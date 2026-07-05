'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import Link from 'next/link';
import { SKILL_REGISTRY_ADDRESS, SKILL_REGISTRY_ABI } from './contract';

function SkillRow({ skillId, delay }: { skillId: number; delay: number }) {
  const { writeContract, isPending } = useWriteContract();
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState<string | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);

  const { data: skill } = useReadContract({
    address: SKILL_REGISTRY_ADDRESS,
    abi: SKILL_REGISTRY_ABI,
    functionName: 'getSkill',
    args: [BigInt(skillId)],
  });

  if (!skill) {
    return null;
  }

  const creator = skill[0];
  const name = skill[1];
  const description = skill[2];
  const bodyCID = skill[3];
  const price = skill[4];
  const invokeCount = skill[5];

  const handleInvoke = () => {
    writeContract({
      address: SKILL_REGISTRY_ADDRESS,
      abi: SKILL_REGISTRY_ABI,
      functionName: 'invokeSkill',
      args: [BigInt(skillId)],
      value: price,
    });
  };

  const handleToggleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (body !== null || !bodyCID) {
      return;
    }
    setLoadingBody(true);
    try {
      const res = await fetch(`https://gateway.pinata.cloud/ipfs/${bodyCID}`);
      const data = await res.json();
      setBody(data.body || '(no content found)');
    } catch (err) {
      setBody('(failed to load from IPFS)');
    } finally {
      setLoadingBody(false);
    }
  };

  return (
    <div
      className="animate-fade-up border-b border-[#1c231b]"
      style={{ animationDelay: delay + 'ms' }}
    >
      <div className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[3rem_1fr_10rem_8rem_8rem] items-center gap-4 py-4 px-2 hover:bg-[#0f130d] transition-colors duration-200">
        <span className="text-[#5a6355] font-mono text-xs">{String(skillId).padStart(2, '0')}</span>
        <div className="min-w-0">
          <button
            onClick={handleToggleExpand}
            className="text-[#e8ece4] font-medium truncate text-left hover:text-[#7dd67a]"
          >
            {name} {bodyCID ? (expanded ? '▾' : '▸') : ''}
          </button>
          <p className="text-[#5a6355] text-xs truncate hidden md:block">{description}</p>
        </div>
        <span className="text-[#5a6355] font-mono text-xs hidden md:inline">
          {creator.slice(0, 6)}...{creator.slice(-4)}
        </span>
        <span className="text-[#7dd67a] font-mono text-sm text-right md:text-left">
          {formatEther(price)} <span className="text-[#5a6355]">RITUAL</span>
        </span>
        <button
          onClick={handleInvoke}
          disabled={isPending}
          className="justify-self-end font-mono text-xs uppercase tracking-wide border border-[#ff7a45]/40 text-[#ff7a45] hover:bg-[#ff7a45] hover:text-black disabled:opacity-40 px-3 py-1.5 rounded transition-all duration-200"
        >
          {isPending ? '...' : 'invoke'}
        </button>
      </div>

      {expanded && (
        <div className="px-2 pb-4 pl-14 pr-4">
          <div className="bg-[#0f130d] border border-[#1c231b] rounded p-3 font-mono text-xs text-[#9aa596] whitespace-pre-wrap max-h-64 overflow-y-auto">
            {!bodyCID
              ? 'no instructions attached to this skill.'
              : loadingBody
              ? 'loading from ipfs...'
              : body}
          </div>
        </div>
      )}
    </div>
  );
}

function BootTerminal({ count }: { count: number }) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= 3) {
      return;
    }
    const timer = setTimeout(function () {
      setVisibleLines(visibleLines + 1);
    }, 450);
    return function () {
      clearTimeout(timer);
    };
  }, [visibleLines]);

  return (
    <div className="bg-[#0f130d] border border-[#1c231b] rounded-lg p-5 font-mono text-sm self-start">
      <p className="text-[#5a6355] mb-3"># live ledger</p>

      {visibleLines >= 1 && (
        <div className="animate-fade-up">
          <p className="text-[#9aa596]">
            <span className="text-[#7dd67a]">$</span> skills --count
          </p>
          <p className="text-[#e8ece4] pl-4 mb-3">{count} published</p>
        </div>
      )}

      {visibleLines >= 2 && (
        <div className="animate-fade-up">
          <p className="text-[#9aa596]">
            <span className="text-[#7dd67a]">$</span> registry --address
          </p>
          <p className="text-[#e8ece4] pl-4 mb-3 truncate">{SKILL_REGISTRY_ADDRESS}</p>
        </div>
      )}

      {visibleLines >= 3 && (
        <div className="animate-fade-up">
          <p className="text-[#9aa596]">
            <span className="text-[#7dd67a]">$</span> status
          </p>
          <p className="text-[#ff7a45] pl-4">
            settling onchain <span className="cursor-blink">|</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [price, setPrice] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: skillCount } = useReadContract({
    address: SKILL_REGISTRY_ADDRESS,
    abi: SKILL_REGISTRY_ABI,
    functionName: 'getSkillCount',
  });

  const handlePublish = async () => {
    if (!name.trim() || !description.trim() || !price.trim()) {
      alert('Please fill in name, description, and price.');
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Price must be a valid number greater than 0.');
      return;
    }

    if (name.length > 100 || description.length > 300) {
      alert('Name or description is too long.');
      return;
    }

    let bodyCID = '';

    if (body.trim()) {
      setUploading(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: body }),
        });
        const data = await res.json();
        if (data.cid) {
          bodyCID = data.cid;
        }
      } catch (err) {
        console.error('Upload failed', err);
      } finally {
        setUploading(false);
      }
    }

    writeContract({
      address: SKILL_REGISTRY_ADDRESS,
      abi: SKILL_REGISTRY_ABI,
      functionName: 'publishSkill',
      args: [name, description, bodyCID, parseEther(price)],
    });

    setName('');
    setDescription('');
    setBody('');
    setPrice('');
  };

  const count = skillCount ? Number(skillCount) : 0;
  const isBusy = isPending || uploading;

  return (
    <main className="min-h-screen bg-[#0b0d0a] text-[#e8ece4] font-sans">
      <div className="border-b border-[#1c231b] px-6 md:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff7a45]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#7dd67a]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#3a4335]" />
          </div>
          <span className="font-mono text-xs text-[#5a6355]">ritual-anvil forge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-mono text-xs text-[#5a6355] hover:text-[#7dd67a]">
            dashboard
          </Link>
          <ConnectButton />
        </div>
      </div>

      <section className="px-6 md:px-10 py-16 md:py-24 grid md:grid-cols-[1.3fr_1fr] gap-12 border-b border-[#1c231b]">
        <div>
          <p className="animate-fade-up font-mono text-xs text-[#ff7a45] mb-4 tracking-widest">
            RITUAL TESTNET CHAIN 1979
          </p>
          <h1
            className="animate-fade-up font-mono text-4xl md:text-6xl font-bold leading-[1.05] mb-6 tracking-tight"
            style={{ animationDelay: '100ms' }}
          >
            Skills, forged
            <br />
            onchain for
            <br />
            <span className="text-[#7dd67a]">AI agents.</span>
          </h1>
          <p
            className="animate-fade-up text-[#9aa596] text-base md:text-lg max-w-md leading-relaxed"
            style={{ animationDelay: '200ms' }}
          >
            Publish a skill, set a price, get paid every time an agent invokes it. No middleman, the contract settles it.
          </p>
        </div>

        <BootTerminal count={count} />
      </section>

      {isConnected && (
        <section className="px-6 md:px-10 py-10 border-b border-[#1c231b]">
          <p className="font-mono text-xs text-[#5a6355] mb-4 tracking-widest">PUBLISH A SKILL</p>
          <div className="grid gap-3 max-w-3xl">
            <div className="grid md:grid-cols-3 gap-3">
              <input
                className="p-3 rounded bg-[#0f130d] border border-[#1c231b] focus:border-[#7dd67a] outline-none text-sm font-mono placeholder:text-[#5a6355]"
                placeholder="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="p-3 rounded bg-[#0f130d] border border-[#1c231b] focus:border-[#7dd67a] outline-none text-sm font-mono placeholder:text-[#5a6355]"
                placeholder="short description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                className="p-3 rounded bg-[#0f130d] border border-[#1c231b] focus:border-[#7dd67a] outline-none text-sm font-mono placeholder:text-[#5a6355]"
                placeholder="0.01 RITUAL"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <textarea
              className="p-3 rounded bg-[#0f130d] border border-[#1c231b] focus:border-[#7dd67a] outline-none text-sm font-mono placeholder:text-[#5a6355] min-h-[120px]"
              placeholder="full skill instructions (optional) — this gets stored on IPFS, not on-chain"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <button
              onClick={handlePublish}
              disabled={isBusy}
              className="bg-[#7dd67a] hover:bg-[#94e091] disabled:opacity-40 text-black font-mono text-sm font-semibold rounded px-5 py-3 transition-all duration-200 justify-self-start w-full md:w-auto"
            >
              {uploading ? 'uploading to ipfs...' : isPending ? 'publishing...' : 'publish'}
            </button>
          </div>
        </section>
      )}

      <section className="px-6 md:px-10 py-10">
        <p className="font-mono text-xs text-[#5a6355] mb-4 tracking-widest">REGISTRY ({count})</p>
        {count === 0 ? (
          <p className="text-[#5a6355] font-mono text-sm py-8 border-t border-b border-dashed border-[#1c231b]">
            registry is empty. publish the first skill above.
          </p>
        ) : (
          <div>
            <div className="hidden md:grid grid-cols-[3rem_1fr_10rem_8rem_8rem] gap-4 px-2 pb-2 border-b border-[#1c231b] font-mono text-[10px] text-[#5a6355] tracking-widest uppercase">
              <span>id</span>
              <span>skill</span>
              <span>creator</span>
              <span>price</span>
              <span></span>
            </div>
            {Array.from({ length: count }, (_, i) => (
              <SkillRow key={i} skillId={i} delay={i * 80} />
            ))}
          </div>
        )}
      </section>

      <footer className="px-6 md:px-10 py-8 border-t border-[#1c231b] font-mono text-[11px] text-[#5a6355]">
        ritual-anvil built on ritual chain
      </footer>
    </main>
  );
}
