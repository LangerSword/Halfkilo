// src/lib/mastra/memory/agentMemory.ts

export interface RoamMemory {
    philosopherKey: string;
    playerAddress: string;
    conversationTurns: { role: 'player' | 'philosopher'; text: string }[];
    patienceLevel: number;      // 0-100. Starts at 100. Drops when player is annoying.
    hasBeenChallenged: boolean; // true after agent challenges the player
    totalInteractions: number;
}

export interface BattleMemory {
    matchId: string;
    philosopherKey: string;
    role: 'user_pet' | 'opponent_agent' | 'opponent_pet';
    turnHistory: {
        turn: number;
        playerBehaviourScore: number;  // 0-100 calmness score from playerBehaviourTool
        moveChosen: string;
        reasoning: string;
    }[];
    aggressionLevel: number;   // 0-100. Reacts to player behaviour in real time.
    currentTurn: number;
}

// ── Global stores ─────────────────────────────────────────────────────────────
// Key format for roam: `${playerAddress}:${philosopherKey}`
// Key format for battle: `${matchId}:${philosopherKey}:${role}`
const roamStore = new Map<string, RoamMemory>();
const battleStore = new Map<string, BattleMemory>();

// ── Roam memory helpers ───────────────────────────────────────────────────────
export function getOrCreateRoamMemory(
    playerAddress: string,
    philosopherKey: string
): RoamMemory {
    const key = `${playerAddress}:${philosopherKey}`;
    if (!roamStore.has(key)) {
        roamStore.set(key, {
            philosopherKey,
            playerAddress,
            conversationTurns: [],
            patienceLevel: 100,
            hasBeenChallenged: false,
            totalInteractions: 0,
        });
    }
    return roamStore.get(key)!;
}

export function updateRoamMemory(
    playerAddress: string,
    philosopherKey: string,
    update: Partial<RoamMemory>
): void {
    const key = `${playerAddress}:${philosopherKey}`;
    const existing = getOrCreateRoamMemory(playerAddress, philosopherKey);
    roamStore.set(key, { ...existing, ...update });
}

// ── Battle memory helpers ─────────────────────────────────────────────────────
export function getOrCreateBattleMemory(
    matchId: string,
    philosopherKey: string,
    role: BattleMemory['role']
): BattleMemory {
    const key = `${matchId}:${philosopherKey}:${role}`;
    if (!battleStore.has(key)) {
        battleStore.set(key, {
            matchId,
            philosopherKey,
            role,
            turnHistory: [],
            aggressionLevel: 50, // neutral start
            currentTurn: 0,
        });
    }
    return battleStore.get(key)!;
}

export function updateBattleMemory(
    matchId: string,
    philosopherKey: string,
    role: BattleMemory['role'],
    update: Partial<BattleMemory>
): void {
    const key = `${matchId}:${philosopherKey}:${role}`;
    const existing = getOrCreateBattleMemory(matchId, philosopherKey, role);
    battleStore.set(key, { ...existing, ...update });
}

export function clearBattleMemory(matchId: string): void {
    for (const key of battleStore.keys()) {
        if (key.startsWith(`${matchId}:`)) battleStore.delete(key);
    }
}
