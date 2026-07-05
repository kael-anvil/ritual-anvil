import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { SKILL_REGISTRY_ADDRESS, SKILL_REGISTRY_ABI } from "@/app/contract";

const publicClient = createPublicClient({ transport: http(process.env.RITUAL_RPC_URL) });

async function fetchInstructions(bodyCID: string): Promise<string | null> {
  if (!bodyCID) return null;
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${bodyCID}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.body ?? null;
  } catch {
    return null;
  }
}

function builtInExecutor(skillName: string, input: string) {
  if (skillName.toLowerCase().includes("word counter")) {
    const words = input.trim().split(/\s+/).filter(Boolean);
    return { wordCount: words.length, characterCount: input.length };
  }
  return { error: "No executor implemented for this skill yet" };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { skillId, txHash, input } = body;

  if (skillId === undefined || skillId === null) {
    return NextResponse.json({ error: "skillId is required" }, { status: 400 });
  }
  if (!txHash || typeof txHash !== "string" || !txHash.startsWith("0x")) {
    return NextResponse.json({ error: "Valid txHash is required" }, { status: 400 });
  }
  if (typeof input !== "string" || !input.trim()) {
    return NextResponse.json({ error: "input text is required" }, { status: 400 });
  }

  let receipt;
  try {
    receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, timeout: 30_000 });
  } catch {
    return NextResponse.json({ error: "Could not verify transaction (timeout or invalid hash)" }, { status: 400 });
  }

  if (receipt.status !== "success") {
    return NextResponse.json({ error: "Transaction failed or not confirmed" }, { status: 400 });
  }

  let skill;
  try {
    skill = await publicClient.readContract({
      address: SKILL_REGISTRY_ADDRESS,
      abi: SKILL_REGISTRY_ABI,
      functionName: "getSkill",
      args: [BigInt(skillId)],
    }) as readonly [string, string, string, string, bigint, bigint];
  } catch {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const skillName = skill[1];
  const bodyCID = skill[3];

  const instructions = await fetchInstructions(bodyCID);
  let result;

  if (instructions && instructions.trim().startsWith("http")) {
    try {
      const externalRes = await fetchWithTimeout(
        instructions.trim(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        },
        10_000
      );
      if (!externalRes.ok) {
        result = { error: `Skill endpoint returned status ${externalRes.status}` };
      } else {
        result = await externalRes.json();
      }
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      result = { error: isTimeout ? "Skill endpoint timed out" : "Failed to reach the skill's external endpoint" };
    }
  } else {
    result = builtInExecutor(skillName, input);
  }

  return NextResponse.json({ verified: true, skill: skillName, result });
}
