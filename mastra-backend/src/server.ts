import express, { Router } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { mastra } from './mastra/index.js';
import { registerBroadcast, unregisterBroadcast } from './mastra/workflows/matchWorkflow.js';
import { connectDB } from './db/connection.js';
import { TradeService } from './services/TradeService.js';
import { BlockchainUtils } from './services/BlockchainService.js';

const app = express();
app.use(express.json());

// Initialize database
let dbConnected = false;
connectDB().then(() => {
  dbConnected = true;
  console.log('Database initialized');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// CORS middleware for frontend requests
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Track WebSocket clients per match
const matchClients: Map<string, Set<WebSocket>> = new Map();

// REST: Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'halfkilo-mastra-backend', network: 'avalanche-fuji-testnet' });
});

// REST: Network info
app.get('/api/network', (_req, res) => {
  res.json({
    network: 'avalanche-fuji-testnet',
    chainId: 43113,
    rpc: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorer: 'https://testnet.snowtrace.io',
  });
});
  matchClients.set(matchId, new Set());

  // Register broadcast function for this match
  const broadcastFn = (data: Record<string, unknown>) => {
    const clients = matchClients.get(matchId) ?? new Set();
    const msg = JSON.stringify({ matchId, ...data });
    clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  };

  registerBroadcast(matchId, broadcastFn);

  res.json({ matchId, status: 'starting' });

  // Run match workflow asynchronously
  try {
    const workflow = mastra.getWorkflow('matchWorkflow');
    const run = await workflow.createRun();
    const result = await run.start({
      inputData: {
        matchId,
        team1: team1 as [number, number],
        team2: team2 as [number, number],
      },
    });
    console.log(`Match ${matchId} finished:`, result.status);
  } catch (err) {
    console.error(`Match ${matchId} error:`, err);
    broadcastFn({ type: 'error', message: 'Match failed unexpectedly' });
  } finally {
    // Cleanup after match
    setTimeout(() => {
      unregisterBroadcast(matchId);
      matchClients.delete(matchId);
    }, 30000); // keep room open 30s after match ends
  }
});

// REST: List active matches
app.get('/api/matches', (_req, res) => {
  res.json({ matches: Array.from(matchClients.keys()) });
});

// WebSocket server on port 3001
const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `ws://localhost:3001`);
  const matchId = url.searchParams.get('matchId');

  if (matchId && matchClients.has(matchId)) {
    matchClients.get(matchId)!.add(ws);
    ws.send(JSON.stringify({ type: 'connected', matchId }));

    ws.on('close', () => {
      matchClients.get(matchId)?.delete(ws);
    });

    ws.on('error', (err) => {
      console.error(`WS error for match ${matchId}:`, err);
      matchClients.get(matchId)?.delete(ws);
    });
  } else {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid or unknown matchId' }));
    ws.close();
  }
});

// Express API on port 3002
const API_PORT = parseInt(process.env.API_PORT ?? '3002', 10);

// ============ TRADE API ROUTES ============

// Create a listing
app.post('/api/trade/list', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const { seller, item, price } = req.body;
    
    if (!seller || !item || !price) {
      res.status(400).json({ error: 'Missing required fields: seller, item, price' });
      return;
    }

    const listing = await TradeService.createListing(seller, item, price);
    res.json({ success: true, listing });
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Get all active listings
app.get('/api/trade/listings', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const listings = await TradeService.getActiveListings(limit, skip);
    res.json({ listings, count: listings.length });
  } catch (err) {
    console.error('Error fetching listings:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get seller's listings
app.get('/api/trade/listings/seller/:address', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const { address } = req.params;
    const listings = await TradeService.getSellerListings(address);
    res.json({ listings });
  } catch (err) {
    console.error('Error fetching seller listings:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get single listing
app.get('/api/trade/listings/:listingId', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const { listingId } = req.params;
    const listing = await TradeService.getListing(listingId);
    
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    res.json({ listing });
  } catch (err) {
    console.error('Error fetching listing:', err);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Purchase an item
app.post('/api/trade/buy', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const { listingId, buyer, txHash } = req.body;

    if (!listingId || !buyer) {
      res.status(400).json({ error: 'Missing required fields: listingId, buyer' });
      return;
    }

    const trade = await TradeService.purchaseItem(listingId, buyer, txHash);
    res.json({ success: true, trade });
  } catch (err) {
    console.error('Error purchasing item:', err);
    res.status(500).json({ error: 'Failed to purchase item' });
  }
});

// Cancel a listing
app.post('/api/trade/cancel', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const { listingId, seller } = req.body;

    if (!listingId || !seller) {
      res.status(400).json({ error: 'Missing required fields: listingId, seller' });
      return;
    }

    await TradeService.cancelListing(listingId, seller);
    res.json({ success: true });
  } catch (err) {
    console.error('Error canceling listing:', err);
    res.status(500).json({ error: 'Failed to cancel listing' });
  }
});

// Get trade history
app.get('/api/trade/history/:address', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = parseInt(req.query.skip as string) || 0;

    const history = await TradeService.getTradeHistory(address, limit, skip);
    res.json({ history });
  } catch (err) {
    console.error('Error fetching trade history:', err);
    res.status(500).json({ error: 'Failed to fetch trade history' });
  }
});

// Get buy history
app.get('/api/trade/buy-history/:address', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = parseInt(req.query.skip as string) || 0;

    const history = await TradeService.getBuyHistory(address, limit, skip);
    res.json({ history });
  } catch (err) {
    console.error('Error fetching buy history:', err);
    res.status(500).json({ error: 'Failed to fetch buy history' });
  }
});

// Get sell history
app.get('/api/trade/sell-history/:address', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = parseInt(req.query.skip as string) || 0;

    const history = await TradeService.getSellHistory(address, limit, skip);
    res.json({ history });
  } catch (err) {
    console.error('Error fetching sell history:', err);
    res.status(500).json({ error: 'Failed to fetch sell history' });
  }
});

// Get seller stats
app.get('/api/trade/stats/:address', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const { address } = req.params;
    const stats = await TradeService.getSellerStats(address);
    res.json({ stats });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Search listings
app.get('/api/trade/search', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!query) {
      res.status(400).json({ error: 'Missing query parameter: q' });
      return;
    }

    const listings = await TradeService.searchListings(query, limit);
    res.json({ listings, count: listings.length });
  } catch (err) {
    console.error('Error searching listings:', err);
    res.status(500).json({ error: 'Failed to search listings' });
  }
});

// ============ BLOCKCHAIN INTEGRATION ROUTES (AVALANCHE FUJI TESTNET) ============

// Verify transaction on Fuji testnet
app.get('/api/blockchain/tx/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    if (!txHash.startsWith('0x')) {
      res.status(400).json({ error: 'Invalid transaction hash' });
      return;
    }

    const details = await BlockchainUtils.getTransactionDetails(txHash);

    if (!details) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json({ 
      transaction: details,
      explorerUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
    });
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Get account balance on Fuji testnet
app.get('/api/blockchain/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!BlockchainUtils.validateAddress(address)) {
      res.status(400).json({ error: 'Invalid address' });
      return;
    }

    const balance = await BlockchainUtils.getBalance(address);

    if (!balance) {
      res.status(500).json({ error: 'Failed to fetch balance' });
      return;
    }

    res.json({ 
      address,
      balance: balance.balance,
      balanceWei: balance.balanceWei,
      network: 'avalanche-fuji-testnet',
    });
  } catch (err) {
    console.error('Error fetching balance:', err);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Get current gas price on Fuji testnet
app.get('/api/blockchain/gas-price', async (req, res) => {
  try {
    const gasPrice = await BlockchainUtils.getGasPrice();

    if (!gasPrice) {
      res.status(500).json({ error: 'Failed to fetch gas price' });
      return;
    }

    res.json({ 
      gasPrice: gasPrice.gasPrice,
      gasPriceWei: gasPrice.gasPriceWei,
      network: 'avalanche-fuji-testnet',
      unit: 'AVAX',
    });
  } catch (err) {
    console.error('Error fetching gas price:', err);
    res.status(500).json({ error: 'Failed to fetch gas price' });
  }
});

// Get testnet faucet URL
app.get('/api/blockchain/faucet/:address', (req, res) => {
  try {
    const { address } = req.params;

    if (!BlockchainUtils.validateAddress(address)) {
      res.status(400).json({ error: 'Invalid address' });
      return;
    }

    const faucetUrl = BlockchainUtils.getFaucetUrl(address);

    res.json({ 
      faucetUrl,
      instructions: 'Use this URL to request test AVAX from the Avalanche Fuji faucet',
      network: 'avalanche-fuji-testnet',
    });
  } catch (err) {
    console.error('Error generating faucet URL:', err);
    res.status(500).json({ error: 'Failed to generate faucet URL' });
  }
});

// Confirm trade and update with blockchain details
app.post('/api/blockchain/confirm-trade', async (req, res) => {
  try {
    if (!dbConnected) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }

    const { tradeId, txHash } = req.body;

    if (!tradeId || !txHash) {
      res.status(400).json({ error: 'Missing required fields: tradeId, txHash' });
      return;
    }

    if (!txHash.startsWith('0x')) {
      res.status(400).json({ error: 'Invalid transaction hash' });
      return;
    }

    // Get transaction details from Fuji testnet
    const txDetails = await BlockchainUtils.getTransactionDetails(txHash);

    if (!txDetails) {
      res.status(404).json({ error: 'Transaction not found on Fuji testnet' });
      return;
    }

    // Confirm trade in database
    await TradeService.confirmTrade(tradeId, txHash, txDetails);

    res.json({ 
      success: true, 
      message: 'Trade confirmed on Avalanche Fuji testnet',
      explorerUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
      transaction: txDetails,
    });
  } catch (err) {
    console.error('Error confirming trade:', err);
    res.status(500).json({ error: 'Failed to confirm trade' });
  }
});

// ============ END BLOCKCHAIN ROUTES ============

app.listen(API_PORT, () => {
  console.log(`Halfkilo Match API running on :${API_PORT}`);
});

console.log('Halfkilo WebSocket running on ws://localhost:3001');
