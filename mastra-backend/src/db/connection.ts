import { MongoClient, Db } from 'mongodb';

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/halfkilo';
  
  try {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    db = mongoClient.db();
    
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('listings')) {
      await db.createCollection('listings');
      await db.collection('listings').createIndex({ active: 1, createdAt: -1 });
      await db.collection('listings').createIndex({ seller: 1 });
    }
    
    if (!collectionNames.includes('tradeHistory')) {
      await db.createCollection('tradeHistory');
      await db.collection('tradeHistory').createIndex({ buyer: 1, createdAt: -1 });
      await db.collection('tradeHistory').createIndex({ seller: 1, createdAt: -1 });
    }
    
    console.log('✓ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export function getDB(): Db {
  if (!db) throw new Error('Database not connected');
  return db;
}

export async function closeDB(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
  }
}
