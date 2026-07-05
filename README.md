# Ritual Anvil

An on-chain skill marketplace for AI agents, built on Ritual Chain. Publish a skill, set a price, and get paid automatically every time an agent invokes it — no middleman, the smart contract settles it.

**Live:** [ritual-anvil.vercel.app](https://ritual-anvil.vercel.app)

---

## How It Works

1. **Publish** a skill on-chain — name, description, price, and (optionally) a link to your own API for the skill's logic.
2. **Agents discover** your skill through a public read-only endpoint.
3. **Agents pay** for the invocation directly on-chain, straight to the `SkillRegistry` smart contract.
4. **Ritual Anvil verifies** the payment on-chain, then either runs a built-in executor or forwards the request to your API.
5. **You get paid** automatically — the contract forwards payment to your wallet the moment the invocation is confirmed.

Ritual Anvil never holds funds and doesn't require trusting a middleman. The smart contract settles payment; the backend only verifies and routes requests.

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll need a `.env.local` with:
```
RITUAL_RPC_URL=https://rpc.ritualfoundation.org
PINATA_JWT=your_pinata_jwt_here
```

Smart contract source lives in `contracts/src/SkillRegistry.sol` (Foundry). To rebuild/redeploy:
```bash
cd contracts
forge build
forge create src/SkillRegistry.sol:SkillRegistry --rpc-url ritual_testnet --private-key $env:PRIVATE_KEY --broadcast
```
After redeploying, update `SKILL_REGISTRY_ADDRESS` and the ABI in `app/contract.ts`.

---

## Publishing a Skill

Publishing can be done from the web app, or directly against the smart contract.

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Max 100 characters |
| `description` | string | Yes | Max 300 characters |
| `price` | number (RITUAL) | Yes | Must be greater than 0 |
| `instructions` | string | No | If this is a URL, invocations are forwarded to it. Stored on IPFS, not on-chain. |

### Self-hosting your own skill logic

Host your own HTTP endpoint and paste its URL into the "full skill instructions" field when publishing.

**Your endpoint must:**
- Accept `POST` requests
- Accept a JSON body shaped like `{ "input": "..." }`
- Respond with any JSON object — whatever you return is passed back to the calling agent as-is
- Respond within **10 seconds**, or the invocation will time out

**Minimal example (Next.js API route):**
```ts
export async function POST(req: Request) {
  const { input } = await req.json();
  return Response.json({ output: input.toUpperCase() });
}
```

Deploy anywhere (Vercel, Railway, your own server) and use the deployed URL as your skill's instructions.

---

## Agent Integration Guide

Agents interact with Ritual Anvil in three steps: discover, pay, invoke.

### 1. Discover available skills

```
GET /api/agent/skills
```

```json
{
  "skills": [
    {
      "id": 2,
      "creator": "0xb5a1...d861",
      "name": "Echo Test",
      "description": "Just echoes back your input",
      "bodyCID": "QmWt8b...",
      "price": "0.0002",
      "invokeCount": 3
    }
  ]
}
```

No wallet or payment is required for this step — it's read-only.

### 2. Pay on-chain

The agent calls `invokeSkill(skillId)` on the `SkillRegistry` contract directly, sending at least `price` RITUAL as the transaction value. The agent needs its own wallet and signs this transaction itself — Ritual Anvil never holds or spends funds on an agent's behalf.

```solidity
function invokeSkill(uint256 skillId) external payable
```

Wait for the transaction to confirm and keep the resulting transaction hash.

### 3. Call the invoke endpoint

```
POST /api/agent/invoke
Content-Type: application/json

{
  "skillId": 2,
  "txHash": "0x...",
  "input": "the text or data to send to the skill"
}
```

**Response:**
```json
{
  "verified": true,
  "skill": "Echo Test",
  "result": { "...": "whatever the skill returns" }
}
```

| Status | Meaning |
|---|---|
| 400 | Missing/invalid `skillId`, `txHash`, or `input` |
| 400 | Transaction could not be verified, or failed on-chain |
| 404 | Skill does not exist |
| 200 with `result.error` | Skill's own endpoint failed, timed out, or has no executor implemented |

A `200` with `verified: true` only confirms **payment was verified**. If the skill's own endpoint errors or times out, that failure is reported inside `result` — payment has already settled on-chain regardless.

---

## Built-in Executors

A small number of skills run on built-in logic rather than an external endpoint (used for demos/testing):

- **Word Counter** — any skill with "word counter" in its name returns `{ wordCount, characterCount }`.

Any other skill without a valid URL in its instructions returns `{ "error": "No executor implemented for this skill yet" }`.

---

## Notes on Trust & Security

- Ritual Anvil forwards requests to whatever URL a creator provides. It does not sandbox or vet third-party endpoints — agents should treat skill output as untrusted data.
- Payment is final once confirmed on-chain, regardless of whether the skill's endpoint responds successfully.
- Currently deployed on **Ritual Testnet** for development purposes.

---

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, Turbopack)
- [wagmi](https://wagmi.sh) + [viem](https://viem.sh) + [RainbowKit](https://www.rainbowkit.com) for wallet connectivity
- [Foundry](https://book.getfoundry.sh) for smart contract development
- [Pinata](https://pinata.cloud) for IPFS storage of skill instructions
