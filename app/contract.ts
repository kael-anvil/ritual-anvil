export const SKILL_REGISTRY_ADDRESS = "0x88F41A75449214Dd912e43764469c7A5791bd78e";

export const SKILL_REGISTRY_ABI = [
  {
    type: "function",
    name: "publishSkill",
    inputs: [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "bodyCID", type: "string" },
      { name: "price", type: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "invokeSkill",
    inputs: [{ name: "skillId", type: "uint256" }],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "getSkillCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getSkill",
    inputs: [{ name: "skillId", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "bodyCID", type: "string" },
      { name: "price", type: "uint256" },
      { name: "invokeCount", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "SkillPublished",
    inputs: [
      { name: "skillId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "price", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "SkillInvoked",
    inputs: [
      { name: "skillId", type: "uint256", indexed: true },
      { name: "invoker", type: "address", indexed: true },
      { name: "amountPaid", type: "uint256", indexed: false }
    ],
    anonymous: false
  }
] as const;
