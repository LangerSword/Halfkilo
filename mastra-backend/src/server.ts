import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { mastra } from './mastra/index.js';
import { registerBroadcast, unregisterBroadcast } from './mastra/workflows/matchWorkflow.js';

const app = express();
app.use(express.json());

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
  res.json({ ok: true, service: 'halfkilo-mastra-backend' });
});

// REST: Start a match
app.post('/api/match/start', async (req, res) => {
  const { team1, team2 } = req.body;

  if (!team1 || !team2 || team1.length !== 2 || team2.length !== 2) {
    res.status(400).json({ error: 'team1 and team2 must each be arrays of 2 token IDs' });
    return;
  }

  const matchId = uuidv4();
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
app.listen(API_PORT, () => {
  console.log(`Halfkilo Match API running on :${API_PORT}`);
});

console.log('Halfkilo WebSocket running on ws://localhost:3001');
