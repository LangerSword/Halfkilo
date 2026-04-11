// src/app/api/agent/battle/route.ts
// ⚠️ Read node_modules/next/dist/docs/ for correct Next.js 16 Response streaming API
import { NextRequest } from 'next/server';
import { withFallback } from '@/lib/mastra/llm';
import { createPhilosopherAgent, PHILOSOPHER_CARDS } from '@/lib/mastra/agents/philosopherAgent';
import { getOrCreateBattleMemory, updateBattleMemory } from '@/lib/mastra/memory/agentMemory';
import { PHILOSOPHER_MOVES } from '@/lib/mastra/tools/battleMoveTool';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const body = await req.json() as {
        matchId: string;
        philosopherKey: string;
        role: 'user_pet' | 'opponent_agent' | 'opponent_pet';
        // Agent battle state
        agentHP: number; agentMaxHP: number; agentElement: string;
        // Opponent state
        opponentHP: number; opponentMaxHP: number; opponentElement: string;
        opponentLastMove?: string;
        // Player behaviour signals — captured by frontend
        moveFrequency: number;       // moves/sec in last 3s
        decisionTimeMs: number;      // ms to pick last move
        attackFrequency: number;     // attacks/sec
        idleTimeMs: number;          // ms since last input
        // Context
        turn: number;
        playerHPPercent: number;
    };

    const memory = getOrCreateBattleMemory(body.matchId, body.philosopherKey, body.role);
    const characterCard = PHILOSOPHER_CARDS[body.philosopherKey];
    const availableMoves = PHILOSOPHER_MOVES[body.philosopherKey] ?? ['Attack', 'Defend'];
    const previousMoves = memory.turnHistory.map(t => t.moveChosen);

    const prompt = `
[YOUR PHILOSOPHER IDENTITY]:
${characterCard}

[YOUR ROLE IN THIS BATTLE]: ${body.role}
  - user_pet: you are fighting FOR the player. Coordinate with them. Mirror their energy.
  - opponent_agent: you are the philosopher NPC fighting AGAINST the player. React to them.
  - opponent_pet: you are the opponent's recruited philosopher. Aggressive by default.

[CURRENT BATTLE STATE]:
  Turn: ${body.turn}
  Your HP: ${body.agentHP}/${body.agentMaxHP} (${Math.round(body.agentHP / body.agentMaxHP * 100)}%)
  Your Element: ${body.agentElement}
  Opponent HP: ${body.opponentHP}/${body.opponentMaxHP}
  Opponent Element: ${body.opponentElement}
  Opponent's Last Move: ${body.opponentLastMove ?? 'None yet'}
  Your Previous Moves: ${previousMoves.slice(-3).join(', ') || 'None yet'}
  Available Moves: ${availableMoves.join(', ')}

[PLAYER BEHAVIOUR SIGNALS]:
  Movement frequency: ${body.moveFrequency}/sec (0=still, 10=frantic)
  Decision time: ${body.decisionTimeMs}ms (short=impulsive, long=calm)
  Attack frequency: ${body.attackFrequency}/sec
  Player idle time: ${body.idleTimeMs}ms

INSTRUCTIONS:
1. First call playerBehaviourTool with the exact behaviour signals above.
2. Then call battleMoveTool with the behaviour output + battle state.
3. Both tool calls are REQUIRED. Do not skip either.
4. Your reasoning must be in-character. Speak as ${body.philosopherKey}.
`.trim();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) =>
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

            try {
                const results = await withFallback(async (tier) => {
                    const agent = createPhilosopherAgent(tier);
                    const agentStream = await agent.stream(prompt, {
                        toolChoice: 'required',
                    });

                    // Stream reasoning in real time → frontend shows this as typewriter
                    for await (const chunk of agentStream.textStream) {
                        send({ type: 'reasoning_chunk', text: chunk });
                    }

                    return await agentStream.toolResults;
                });

                // Extract both tool results
                const behaviourResult = results?.find(
                    (r: any) => r.payload?.toolName === 'read_player_behaviour'
                )?.payload?.result as any;

                const moveResult = results?.find(
                    (r: any) => r.payload?.toolName === 'battle_move'
                )?.payload?.result as any;

                if (moveResult) {
                    // Update battle memory
                    const newTurn = {
                        turn: body.turn,
                        playerBehaviourScore: behaviourResult?.behaviourScore ?? 50,
                        moveChosen: moveResult.move,
                        reasoning: moveResult.reasoning,
                    };
                    updateBattleMemory(body.matchId, body.philosopherKey, body.role, {
                        turnHistory: [...memory.turnHistory, newTurn],
                        aggressionLevel: Math.min(100, Math.max(0,
                            memory.aggressionLevel + (behaviourResult?.aggressionDelta ?? 0)
                        )),
                        currentTurn: body.turn,
                    });

                    send({
                        type: 'move',
                        move: moveResult.move,
                        moveCategory: moveResult.moveCategory,
                        targetSelf: moveResult.targetSelf,
                        reasoning: moveResult.reasoning,
                        aggressionUsed: moveResult.aggressionUsed,
                        turnDelay: moveResult.turnDelay,
                        behaviourScore: behaviourResult?.behaviourScore ?? 50,
                        recommendedStyle: behaviourResult?.recommendedStyle ?? 'reactive',
                    });
                }
            } catch (err: any) {
                send({ type: 'error', message: err.message ?? 'Agent failed' });
            } finally {
                send({ type: 'done' });
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
