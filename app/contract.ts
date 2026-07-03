export const SKILL_REGISTRY_ADDRESS = '0x37454498BD1A448CBb4103a80AA480e14a2A682C';

export const SKILL_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'getSkill',
    inputs: [{ name: 'skillId', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'invokeCount', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSkillCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'invokeSkill',
    inputs: [{ name: 'skillId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'publishSkill',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'price', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;