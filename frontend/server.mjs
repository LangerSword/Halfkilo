import { WebSocketServer } from 'ws';
import WebSocket from 'ws';

const MASTRA_WS = process.env.MASTRA_WS_URL || 'ws://localhost:3001';

const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket Server running on ws://localhost:8080");
console.log(`Relaying Mastra events from ${MASTRA_WS}`);

let waitingPlayer = null;

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'ws://localhost:8080');
    const mode = url.searchParams.get('mode'); // 'online' or 'mastra'
    const matchId = url.searchParams.get('matchId');

    // --- Mastra relay mode: proxy events from mastra-backend WS to this client ---
    if (mode === 'mastra' && matchId) {
        console.log(`[Mastra relay] Client connected for match ${matchId}`);
        let upstream = null;
        try {
            upstream = new WebSocket(`${MASTRA_WS}?matchId=${matchId}`);
        } catch {
            // Connection failed
        }

        // Simple relay: forward upstream → client
        if (upstream) {
            upstream.on('message', (data) => {
                if (ws.readyState === 1) ws.send(data.toString());
            });
            upstream.on('close', () => {
                if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'upstream_closed' }));
            });
            upstream.on('error', () => {
                ws.send(JSON.stringify({ type: 'error', message: 'Mastra upstream connection error' }));
            });
            ws.on('close', () => { try { upstream.close(); } catch {} });
        } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Could not connect to Mastra backend' }));
        }
        return;
    }

    // --- Original online PvP matchmaking relay ---
    console.log('New client connected (online PvP mode)');

    if (!waitingPlayer) {
        // First player connects
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: 'init', playerIndex: 1, message: 'Waiting for opponent...' }));
    } else {
        // Second player connects
        const p1 = waitingPlayer;
        const p2 = ws;
        waitingPlayer = null;

        p2.send(JSON.stringify({ type: 'init', playerIndex: 2, message: 'Opponent found!' }));
        p1.send(JSON.stringify({ type: 'start', message: 'Opponent found! Battle starts now.' }));
        p2.send(JSON.stringify({ type: 'start', message: 'Opponent found! Battle starts now.' }));

        // Map events between P1 and P2
        p1.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            // Relay to p2
            p2.send(JSON.stringify({ type: 'action', action: data.action, player: 1 }));
        });

        p2.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            // Relay to p1
            p1.send(JSON.stringify({ type: 'action', action: data.action, player: 2 }));
        });

        const handleDisconnect = () => {
            if (p1.readyState === 1) p1.send(JSON.stringify({ type: 'disconnect' }));
            if (p2.readyState === 1) p2.send(JSON.stringify({ type: 'disconnect' }));
        };

        p1.on('close', handleDisconnect);
        p2.on('close', handleDisconnect);
    }

    ws.on('error', console.error);
});
