'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { SKILL_REGISTRY_ADDRESS, SKILL_REGISTRY_ABI } from '../contract';

type SkillData = readonly [string, string, string, string, bigint, bigint];

function SkillLoader({
  skillId,
  onLoad,
}: {
  skillId: number;
  onLoad: (id: number, data: SkillData) => void;
}) {
  const { data } = useReadContract({
    address: SKILL_REGISTRY_ADDRESS,
    abi: SKILL_REGISTRY_ABI,
    functionName: 'getSkill',
    args: [BigInt(skillId)],
  });

  useEffect(() => {
    if (data) {
      onLoad(skillId, data as SkillData);
    }
  }, [data, skillId, onLoad]);

  return null;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [skillsMap, setSkillsMap] = useState<Record<number, SkillData>>({});

  const { data: skillCount } = useReadContract({
    address: SKILL_REGISTRY_ADDRESS,
    abi: SKILL_REGISTRY_ABI,
    functionName: 'getSkillCount',
  });

  const count = skillCount ? Number(skillCount) : 0;

  const handleLoad = (id: number, data: SkillData) => {
    setSkillsMap((prev) => {
      const next = { ...prev };
      next[id] = data;
      return next;
    });
  };

  const allLoaded = Object.keys(skillsMap).map((key) => {
    const id = Number(key);
    return { id: id, data: skillsMap[id] };
  });

  const mySkills = allLoaded.filter((item) => {
    if (!address) {
      return false;
    }
    return item.data[0].toLowerCase() === address.toLowerCase();
  });

  let totalInvocations = 0;
  let totalEarned = 0;

  for (const item of mySkills) {
    const invokeCount = Number(item.data[5]);
    const price = Number(formatEther(item.data[4]));
    totalInvocations = totalInvocations + invokeCount;
    totalEarned = totalEarned + invokeCount * price;
  }

  return (
    <main className="min-h-screen bg-[#0b0d0a] text-[#e8ece4] font-sans">
      {Array.from({ length: count }, (_, i) => (
        <SkillLoader key={i} skillId={i} onLoad={handleLoad} />
      ))}

      <div className="border-b border-[#1c231b] px-6 md:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono text-xs text-[#5a6355] hover:text-[#7dd67a]">
            ritual-anvil
          </Link>
          <span className="font-mono text-xs text-[#5a6355]">/ dashboard</span>
        </div>
        <ConnectButton />
      </div>

      <section className="px-6 md:px-10 py-10">
        <p className="font-mono text-xs text-[#ff7a45] mb-4 tracking-widest">YOUR DASHBOARD</p>

        {!isConnected ? (
          <p className="text-[#5a6355] font-mono text-sm py-8 border-t border-b border-dashed border-[#1c231b]">
            connect your wallet to view your dashboard.
          </p>
        ) : (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-10 max-w-xl">
              <div className="bg-[#0f130d] border border-[#1c231b] rounded-lg p-4">
                <p className="font-mono text-2xl text-[#7dd67a]">{mySkills.length}</p>
                <p className="text-[#5a6355] text-xs mt-1">skills published</p>
              </div>
              <div className="bg-[#0f130d] border border-[#1c231b] rounded-lg p-4">
                <p className="font-mono text-2xl text-[#7dd67a]">{totalInvocations}</p>
                <p className="text-[#5a6355] text-xs mt-1">total invocations</p>
              </div>
              <div className="bg-[#0f130d] border border-[#1c231b] rounded-lg p-4">
                <p className="font-mono text-2xl text-[#7dd67a]">{totalEarned.toFixed(5)}</p>
                <p className="text-[#5a6355] text-xs mt-1">RITUAL earned</p>
              </div>
            </div>

            <p className="font-mono text-xs text-[#5a6355] mb-4 tracking-widest">
              MY SKILLS ({mySkills.length})
            </p>

            {mySkills.length === 0 ? (
              <p className="text-[#5a6355] font-mono text-sm py-8 border-t border-b border-dashed border-[#1c231b]">
                you haven't published any skills yet.{' '}
                <Link href="/" className="text-[#7dd67a] hover:underline">
                  publish one
                </Link>
              </p>
            ) : (
              <div>
                <div className="hidden md:grid grid-cols-[3rem_1fr_8rem_8rem] gap-4 px-2 pb-2 border-b border-[#1c231b] font-mono text-[10px] text-[#5a6355] tracking-widest uppercase">
                  <span>id</span>
                  <span>skill</span>
                  <span>price</span>
                  <span>uses</span>
                </div>
                {mySkills.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[3rem_1fr_8rem_8rem] items-center gap-4 py-4 px-2 border-b border-[#1c231b]"
                  >
                    <span className="text-[#5a6355] font-mono text-xs">
                      {String(item.id).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[#e8ece4] font-medium truncate">{item.data[1]}</p>
                      <p className="text-[#5a6355] text-xs truncate hidden md:block">{item.data[2]}</p>
                    </div>
                    <span className="text-[#7dd67a] font-mono text-sm">
                      {formatEther(item.data[4])} <span className="text-[#5a6355]">RITUAL</span>
                    </span>
                    <span className="text-[#e8ece4] font-mono text-sm">{item.data[5].toString()}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="px-6 md:px-10 py-8 border-t border-[#1c231b] font-mono text-[11px] text-[#5a6355]">
        ritual-anvil built on ritual chain
      </footer>
    </main>
  );
}
