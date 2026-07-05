import { NextResponse } from "next/server";
import { createPublicClient, http, formatEther } from "viem";
import { SKILL_REGISTRY_ADDRESS, SKILL_REGISTRY_ABI } from "@/app/contract";

const publicClient = createPublicClient({
  transport: http(process.env.RITUAL_RPC_URL),
});

export async function GET() {
  const count = await publicClient.readContract({
    address: SKILL_REGISTRY_ADDRESS,
    abi: SKILL_REGISTRY_ABI,
    functionName: "getSkillCount",
  }) as bigint;

  const skills = [];
  for (let i = 0; i < Number(count); i++) {
    const skill = await publicClient.readContract({
      address: SKILL_REGISTRY_ADDRESS,
      abi: SKILL_REGISTRY_ABI,
      functionName: "getSkill",
      args: [BigInt(i)],
    }) as readonly [string, string, string, string, bigint, bigint];

    skills.push({
      id: i,
      creator: skill[0],
      name: skill[1],
      description: skill[2],
      bodyCID: skill[3],
      price: formatEther(skill[4]),
      invokeCount: Number(skill[5]),
    });
  }

  return NextResponse.json({ skills });
}
