import { createTool } from '@mastra/core/tools';
import { createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { z } from 'zod';

const PET_NFT_ABI = [
  {
    type: 'function',
    name: 'getPetStats',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'petType', type: 'string' },
      { name: 'element', type: 'string' },
      { name: 'hp', type: 'uint256' },
      { name: 'attack', type: 'uint256' },
      { name: 'defense', type: 'uint256' },
      { name: 'specialPower', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

const PET_NFT_ADDRESS = (process.env.PET_NFT_CONTRACT ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

const viemClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(),
});

// Mock pet data for development when contract is not yet deployed
const MOCK_PETS: Record<number, {
  name: string; petType: string; element: string;
  hp: number; attack: number; defense: number; specialPower: number;
}> = {
  1: { name: 'Blaze', petType: 'fire_wolf', element: 'fire', hp: 100, attack: 25, defense: 15, specialPower: 30 },
  2: { name: 'Torrent', petType: 'water_spirit', element: 'water', hp: 120, attack: 18, defense: 22, specialPower: 25 },
  3: { name: 'Thornveil', petType: 'nature_guardian', element: 'nature', hp: 110, attack: 20, defense: 20, specialPower: 22 },
  4: { name: 'Voltix', petType: 'thunder_hawk', element: 'thunder', hp: 90, attack: 28, defense: 12, specialPower: 35 },
};

export const fetchPetStatsTool = createTool({
  id: 'fetch_pet_stats',
  description: 'Fetch on-chain stats for an NFT pet by token ID from PetNFT contract on Avalanche Fuji.',
  inputSchema: z.object({ tokenId: z.number() }),
  outputSchema: z.object({
    name: z.string(),
    petType: z.string(),
    element: z.string(),
    hp: z.number(),
    attack: z.number(),
    defense: z.number(),
    specialPower: z.number(),
  }),
  execute: async (input) => {
    // Use mock data if contract is not deployed yet (address is zero)
    if (PET_NFT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      const mock = MOCK_PETS[input.tokenId] ?? MOCK_PETS[((input.tokenId - 1) % 4) + 1];
      return { ...mock };
    }

    try {
      const stats = await viemClient.readContract({
        address: PET_NFT_ADDRESS,
        abi: PET_NFT_ABI,
        functionName: 'getPetStats',
        args: [BigInt(input.tokenId)],
      });
      return {
        name: stats[0] as string,
        petType: stats[1] as string,
        element: stats[2] as string,
        hp: Number(stats[3]),
        attack: Number(stats[4]),
        defense: Number(stats[5]),
        specialPower: Number(stats[6]),
      };
    } catch (err) {
      console.error(`Failed to fetch on-chain stats for token ${input.tokenId}, using mock:`, err);
      const mock = MOCK_PETS[((input.tokenId - 1) % 4) + 1];
      return { ...mock };
    }
  },
});
