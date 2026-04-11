import { Memory } from '@mastra/memory';

export const battleMemory = new Memory({
  options: {
    lastMessages: 20,
    semanticRecall: false,
  },
});

// Per-pet thread key convention: `pet_${tokenId}`
// The agent's accumulated wins/losses/type-learning lives here across sessions.
// When MongoDB storage is available, swap to:
//
// import { MongoDBStorage } from '@mastra/memory/storage/mongodb';
// export const battleMemory = new Memory({
//   storage: new MongoDBStorage({
//     url: process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
//     dbName: 'halfkilo',
//     collectionName: 'pet_memory',
//   }),
//   options: {
//     lastMessages: 20,
//     semanticRecall: {
//       topK: 5,
//       messageRange: 2,
//     },
//   },
// });
