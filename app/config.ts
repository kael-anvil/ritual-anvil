import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

export const ritualTestnet = defineChain({
  id: 1979,
  name: 'Ritual Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'RITUAL',
    symbol: 'RITUAL',
  },
  rpcUrls: {
    default: { http: ['https://rpc.ritualfoundation.org'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.ritualfoundation.org' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Ritual Anvil',
  projectId: '63b9bf39221e49c22e97f7b708c4d26f',
  chains: [ritualTestnet],
  ssr: true,
});