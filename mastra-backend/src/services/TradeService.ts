import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/connection.js';
import { Listing, TradeHistory, InventoryItem } from '../db/types.js';

export class TradeService {
  /**
   * Create a new listing
   */
  static async createListing(seller: string, item: InventoryItem, price: string): Promise<Listing> {
    const db = getDB();
    const listingId = uuidv4();
    
    const listing: Listing = {
      listingId,
      seller: seller.toLowerCase(),
      itemTokenId: item.tokenId,
      itemName: item.name,
      itemPower: item.power,
      itemRarity: item.rarity,
      price,
      active: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
    
    await db.collection<Listing>('listings').insertOne(listing);
    return listing;
  }

  /**
   * Get all active listings
   */
  static async getActiveListings(limit = 50, skip = 0): Promise<Listing[]> {
    const db = getDB();
    return await db
      .collection<Listing>('listings')
      .find({ active: true, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
  }

  /**
   * Get listings by seller
   */
  static async getSellerListings(seller: string): Promise<Listing[]> {
    const db = getDB();
    return await db
      .collection<Listing>('listings')
      .find({ seller: seller.toLowerCase(), active: true })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Get a single listing
   */
  static async getListing(listingId: string): Promise<Listing | null> {
    const db = getDB();
    return await db.collection<Listing>('listings').findOne({ listingId });
  }

  /**
   * Purchase an item
   */
  static async purchaseItem(listingId: string, buyer: string, txHash?: string): Promise<TradeHistory> {
    const db = getDB();
    const listing = await this.getListing(listingId);
    
    if (!listing) {
      throw new Error('Listing not found');
    }
    
    if (!listing.active) {
      throw new Error('Listing is no longer active');
    }
    
    const tradeId = uuidv4();
    const trade: TradeHistory = {
      tradeId,
      seller: listing.seller,
      buyer: buyer.toLowerCase(),
      itemTokenId: listing.itemTokenId,
      itemName: listing.itemName,
      price: listing.price,
      txHash,
      status: 'pending',
      createdAt: new Date(),
    };
    
    // Insert trade record
    await db.collection<TradeHistory>('tradeHistory').insertOne(trade);
    
    // Deactivate listing
    await db.collection('listings').updateOne(
      { listingId },
      { $set: { active: false, completedAt: new Date() } }
    );
    
    return trade;
  }

  /**
   * Confirm a trade (when blockchain tx is confirmed)
   */
  static async confirmTrade(tradeId: string, txHash: string, txDetails?: any): Promise<void> {
    const db = getDB();
    const updateData: any = { 
      status: 'confirmed', 
      txHash, 
      completedAt: new Date(),
      network: 'avalanche-fuji',
      explorerUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
    };

    // Add blockchain Details if provided
    if (txDetails) {
      if (txDetails.blockNumber) updateData.blockNumber = txDetails.blockNumber;
      if (txDetails.gasUsed) updateData.gasUsed = txDetails.gasUsed.toString();
    }

    await db.collection('tradeHistory').updateOne(
      { tradeId },
      { $set: updateData }
    );
  }

  /**
   * Cancel a listing
   */
  static async cancelListing(listingId: string, seller: string): Promise<void> {
    const db = getDB();
    const listing = await this.getListing(listingId);
    
    if (!listing) {
      throw new Error('Listing not found');
    }
    
    if (listing.seller !== seller.toLowerCase()) {
      throw new Error('Not authorized to cancel this listing');
    }
    
    await db.collection('listings').updateOne(
      { listingId },
      { $set: { active: false } }
    );
  }

  /**
   * Get trade history for an address (as buyer or seller)
   */
  static async getTradeHistory(address: string, limit = 20, skip = 0): Promise<TradeHistory[]> {
    const db = getDB();
    return await db
      .collection<TradeHistory>('tradeHistory')
      .find({
        $or: [
          { seller: address.toLowerCase() },
          { buyer: address.toLowerCase() },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
  }

  /**
   * Get buy history for an address
   */
  static async getBuyHistory(address: string, limit = 20, skip = 0): Promise<TradeHistory[]> {
    const db = getDB();
    return await db
      .collection<TradeHistory>('tradeHistory')
      .find({ buyer: address.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
  }

  /**
   * Get sell history for an address
   */
  static async getSellHistory(address: string, limit = 20, skip = 0): Promise<TradeHistory[]> {
    const db = getDB();
    return await db
      .collection<TradeHistory>('tradeHistory')
      .find({ seller: address.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
  }

  /**
   * Get seller stats
   */
  static async getSellerStats(seller: string): Promise<{
    totalSales: number;
    totalRevenue: string;
    listings: number;
  }> {
    const db = getDB();
    const sales = await db
      .collection<TradeHistory>('tradeHistory')
      .aggregate([
        { $match: { seller: seller.toLowerCase(), status: 'confirmed' } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalRevenue: { $sum: { $toDecimal: '$price' } },
          },
        },
      ])
      .toArray();
    
    const listings = await db
      .collection<Listing>('listings')
      .countDocuments({ seller: seller.toLowerCase(), active: true });
    
    const stats = sales[0];
    return {
      totalSales: stats?.count || 0,
      totalRevenue: stats?.totalRevenue?.toString() || '0',
      listings,
    };
  }

  /**
   * Search listings
   */
  static async searchListings(query: string, limit = 50): Promise<Listing[]> {
    const db = getDB();
    return await db
      .collection<Listing>('listings')
      .find({
        active: true,
        itemName: { $regex: query, $options: 'i' },
      })
      .limit(limit)
      .toArray();
  }
}
