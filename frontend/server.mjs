// server.mjs — upgraded: preserves original relay + adds behaviour tracking
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
console.log("HK Server: ws://localhost:8080");

let waitingPlayer = null;

// Per-connection behaviour tracking
const behaviourState = new Map(); // ws → { moveTimestamps, attackTimestamps, lastInputMs, idleStart }

function getBehaviour(ws) {
    if (!behaviourState.has(ws)) {
        behaviourState.set(ws, {
            moveTimestamps: [],   // recent move event timestamps
            attackTimestamps: [], // recent attack event timestamps
            lastInputMs: Date.now(),
            idleStart: Date.now(),
            lastDecisionMs: null,
            lastMoveStart: null,
        });
    }
    return behaviourState.get(ws);
}

function computeBehaviourSignal(ws) {
    const b = getBehaviour(ws);
    const now = Date.now();
    const window = 3000; // 3-second sliding window

    // Clean stale timestamps
    b.moveTimestamps = b.moveTimestamps.filter(t => now - t < window);
    b.attackTimestamps = b.attackTimestamps.filter(t => now - t < window);

    const moveFrequency = parseFloat((b.moveTimestamps.length / (window / 1000)).toFixed(2));
    const attackFrequency = parseFloat((b.attackTimestamps.length / (window / 1000)).toFixed(2));
    const idleTimeMs = now - b.lastInputMs;
    const decisionTimeMs = b.lastDecisionMs !== null ? b.lastDecisionMs : 2000;

    return { moveFrequency, attackFrequency, idleTimeMs, decisionTimeMs };
}

wss.on('connection', (ws) => {
    getBehaviour(ws); // initialise tracking

    if (!waitingPlayer) {
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: 'init', playerIndex: 1, message: 'Waiting for opponent...' }));
    } else {
        const p1 = waitingPlayer;
        const p2 = ws;
        waitingPlayer = null;

        p2.send(JSON.stringify({ type: 'init', playerIndex: 2, message: 'Opponent found!' }));
        p1.send(JSON.stringify({ type: 'start', message: 'Opponent found! Battle starts now.' }));
        p2.send(JSON.stringify({ type: 'start', message: 'Opponent found! Battle starts now.' }));

        // ── Original relay (unchanged) ──────────────────────────────────────────
        p1.on('message', (msg) => {
            const data = JSON.parse(msg.toString());

            // Track behaviour signals from p1's actions
            const b = getBehaviour(p1);
            b.lastInputMs = Date.now();
            if (data.action === 'move') b.moveTimestamps.push(Date.now());
            if (data.action === 'attack') b.attackTimestamps.push(Date.now());
            if (data.action === 'confirm_move') {
                b.lastDecisionMs = b.lastMoveStart ? Date.now() - b.lastMoveStart : 2000;
                b.lastMoveStart = null;
            }
            if (data.action === 'move_start') b.lastMoveStart = Date.now();

            // Relay to p2 (unchanged behaviour)
            p2.send(JSON.stringify({ type: 'action', action: data.action, player: 1 }));

            // Also send behaviour signal to p2 (opponent sees player behaviour)
            p2.send(JSON.stringify({
                type: 'behaviour_signal',
                from: 1,
                signal: computeBehaviourSignal(p1),
            }));
        });

        p2.on('message', (msg) => {
            const data = JSON.parse(msg.toString());

            const b = getBehaviour(p2);
            b.lastInputMs = Date.now();
            if (data.action === 'move') b.moveTimestamps.push(Date.now());
            if (data.action === 'attack') b.attackTimestamps.push(Date.now());
            if (data.action === 'confirm_move') {
                b.lastDecisionMs = b.lastMoveStart ? Date.now() - b.lastMoveStart : 2000;
                b.lastMoveStart = null;
            }
            if (data.action === 'move_start') b.lastMoveStart = Date.now();

            p1.send(JSON.stringify({ type: 'action', action: data.action, player: 2 }));
            p1.send(JSON.stringify({
                type: 'behaviour_signal',
                from: 2,
                signal: computeBehaviourSignal(p2),
            }));
        });

        // ── Idle polling: broadcast behaviour every 2s ──────────────────────────
        const idleInterval = setInterval(() => {
            if (p1.readyState === 1) p1.send(JSON.stringify({
                type: 'behaviour_signal', from: 2, signal: computeBehaviourSignal(p2),
            }));
            if (p2.readyState === 1) p2.send(JSON.stringify({
                type: 'behaviour_signal', from: 1, signal: computeBehaviourSignal(p1),
            }));
        }, 2000);

        const handleDisconnect = () => {
            clearInterval(idleInterval);
            behaviourState.delete(p1);
            behaviourState.delete(p2);
            if (p1.readyState === 1) p1.send(JSON.stringify({ type: 'disconnect' }));
            if (p2.readyState === 1) p2.send(JSON.stringify({ type: 'disconnect' }));
        };

        p1.on('close', handleDisconnect);
        p2.on('close', handleDisconnect);
    }

    ws.on('error', console.error);
});
