'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { SKILL_REGISTRY_ADDRESS, SKILL_REGISTRY_ABI } from './contract';

function SkillCard({ skillId }: { skillId: number }) {
  const { writeContract, isPending } = useWriteContract();

  const { data: skill, refetch } = useReadContract({
    address: SKILL_REGISTRY_ADDRESS,
    abi: SKILL_REGISTRY_ABI,
    functionName: 'getSkill',
    args: [BigInt(skillId)],
  });

  if (!skill) return null;

  const [creator, name, description, price, invokeCount] = skill;

  const handleInvoke = () => {
    writeContract({
      address: SKILL_REGISTRY_ADDRESS,
      abi: SKILL_REGISTRY_ABI,
      functionName: 'invokeSkill',
      args: [BigInt(skillId)],
      value: price,
    });
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
          <p className="text-gray-500 text-xs mt-2">
            by {creator.slice(0, 6)}...{creator.slice(-4)} · used {invokeCount.toString()}x
          </p>
        </div>
        <div className="text-right">
          <p className="text-blue-400 font-semibold mb-2">{formatEther(price)} RITUAL</p>
          <button
            onClick={handleInvoke}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-1.5 rounded text-sm font-semibold"
          >
            {isPending ? 'Invoking...' : 'Invoke'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  const { data: skillCount } = useReadContract({
    address: SKILL_REGISTRY_ADDRESS,
    abi: SKILL_REGISTRY_ABI,
    functionName: 'getSkillCount',
  });

  const handlePublish = () => {
    if (!name || !price) return;
    writeContract({
      address: SKILL_REGISTRY_ADDRESS,
      abi: SKILL_REGISTRY_ABI,
      functionName: 'publishSkill',
      args: [name, description, parseEther(price)],
    });
    setName('');
    setDescription('');
    setPrice('');
  };

  const count = skillCount ? Number(skillCount) : 0;

  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white p-8">
      <h1 className="text-5xl font-bold mb-2 mt-8">Ritual Anvil</h1>
      <p className="text-lg text-gray-400 max-w-xl text-center mb-8">
        Skill marketplace for AI agents — built on Ritual Chain.
      </p>

      <ConnectButton />

      <p className="mt-6 text-gray-400">Total skills published: {count}</p>

      {isConnected && (
        <div className="mt-10 w-full max-w-md bg-gray-900 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Publish a Skill</h2>

          <input
            className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
            placeholder="Skill name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="w-full mb-4 p-2 rounded bg-gray-800 text-white"
            placeholder="Price in RITUAL (e.g. 0.01)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <button
            onClick={handlePublish}
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-2 rounded font-semibold"
          >
            {isPending ? 'Publishing...' : 'Publish Skill'}
          </button>
        </div>
      )}

      <div className="mt-10 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Skills</h2>
        {count === 0 && <p className="text-gray-500">No skills published yet.</p>}
        {Array.from({ length: count }, (_, i) => (
          <SkillCard key={i} skillId={i} />
        ))}
      </div>
    </main>
  );
}