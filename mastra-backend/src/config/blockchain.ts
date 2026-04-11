import { publicActions, walletActions, createPublicClient, createWalletClient, http } from "viem";
import { avalancheFuji } from "viem/chains";

// RPC endpoint for Avalanche Fuji testnet
const FUJI_RPC = process.env.AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";

// Create public client for reading data
export const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(FUJI_RPC),
});

// Create wallet client for transactions (requires private key)
export const createWalletClientForSigning = (privateKey: `0x${string}`) => {
  return createWalletClient({
    chain: avalancheFuji,
    transport: http(FUJI_RPC),
    account: privateKey ? privateKey : undefined,
  }).extend(publicActions);
};

// Get chain info
export const chainInfo = {
  name: avalancheFuji.name,
  id: avalancheFuji.id,
  nativeCurrency: avalancheFuji.nativeCurrency,
  rpcUrls: avalancheFuji.rpcUrls,
  blockExplorers: avalancheFuji.blockExplorers,
};

console.log(`✓ Configured for ${chainInfo.name} (Chain ID: ${chainInfo.id})`);
console.log(`  RPC: ${FUJI_RPC}`);
console.log(`  Explorer: ${chainInfo.blockExplorers?.default.url}`);
