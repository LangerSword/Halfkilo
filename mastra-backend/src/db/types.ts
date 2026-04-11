import { z } from 'zod';

export const ListingSchema = z.object({
  _id: z.string().optional(),
  listingId: z.string(),
  seller: z.string().toLowerCase(),
  itemTokenId: z.number(),
  itemName: z.string(),
  itemPower: z.number(),
  itemRarity: z.number(),
  price: z.string(),
  active: z.boolean().default(true),
  txHash: z.string().optional(), // Fuji testnet tx
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional(),
  network: z.string().default('avalanche-fuji'),
});

export const TradeHistorySchema = z.object({
  _id: z.string().optional(),
  tradeId: z.string(),
  seller: z.string().toLowerCase(),
  buyer: z.string().toLowerCase(),
  itemTokenId: z.number(),
  itemName: z.string(),
  price: z.string(),
  txHash: z.string().optional(), // Fuji testnet tx
  blockNumber: z.number().optional(),
  gasUsed: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'failed']).default('pending'),
  createdAt: z.date().default(() => new Date()),
  completedAt: z.date().optional(),
  network: z.string().default('avalanche-fuji'),
  explorerUrl: z.string().optional(), // Snowtrace URL
});

export type Listing = z.infer<typeof ListingSchema>;
export type TradeHistory = z.infer<typeof TradeHistorySchema>;

export interface InventoryItem {
  tokenId: number;
  name: string;
  power: number;
  rarity: number;
  owner: string;
}

export interface PlayerInventory {
  address: string;
  items: InventoryItem[];
  totalItems: number;
}
