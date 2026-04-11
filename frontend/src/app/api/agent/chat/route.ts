// src/app/api/agent/chat/route.ts
// ⚠️ Read node_modules/next/dist/docs/ for correct Next.js 16 Response streaming API
import { NextRequest } from 'next/server';
import { withFallback, getLLM } from '@/lib/mastra/llm';
import { createPhilosopherAgent, PHILOSOPHER_CARDS } from '@/lib/mastra/agents/philosopherAgent';
import { getOrCreateRoamMemory, updateRoamMemory } from '@/lib/mastra/memory/agentMemory';
import { roamChatTool } from '@/lib/mastra/tools/roamChatTool';

export const runtime = 'nodejs'; // Required for streaming in Next.js App Router

export async function POST(req: NextRequest) {
    const body = await req.json() as {
        philosopherKey: string;
        playerAddress: string;
        playerMessage: string;
        playerIsChallenging?: boolean;
    };

    const { philosopherKey, playerAddress, playerMessage, playerIsChallenging = false } = body;

    if (!PHILOSOPHER_CARDS[philosopherKey]) {
        return Response.json({ error: 'Unknown philosopher' }, { status: 400 });
    }

    // Load memory
    const memory = getOrCreateRoamMemory(playerAddress, philosopherKey);
    memory.conversationTurns.push({ role: 'player', text: playerMessage });
    memory.totalInteractions++;

    // Detect rudeness heuristically (extend this as needed)
    const rudeWords = ['idiot', 'stupid', 'shut up', 'boring', 'useless'];
    const playerHasBeenRude = rudeWords.some(w => playerMessage.toLowerCase().includes(w));

    // Build the prompt
    const characterCard = PHILOSOPHER_CARDS[philosopherKey];
    const recentHistory = memory.conversationTurns.slice(-6)
        .map(t => `${t.role === 'player' ? 'Player' : 'You'}: ${t.text}`)
        .join('\n');

    const prompt = `
[YOUR PHILOSOPHER IDENTITY]:
${characterCard}

[CURRENT PATIENCE LEVEL]: ${memory.patienceLevel}/100
${memory.patienceLevel < 40 ? '⚠️ You are running very low on patience.' : ''}

[CONVERSATION SO FAR]:
${recentHistory}

[CURRENT MESSAGE FROM PLAYER]: "${playerMessage}"
[PLAYER IS CHALLENGING YOU TO BATTLE]: ${playerIsChallenging}
[THIS IS ANNOYING/RUDE]: ${playerHasBeenRude}

Call roamChatTool now to generate your response.
Input to the tool:
- philosopherKey: "${philosopherKey}"
- playerMessage: "${playerMessage}"
- patienceLevel: ${memory.patienceLevel}
- conversationLength: ${memory.totalInteractions}
- playerHasBeenRude: ${playerHasBeenRude}
- playerIsChallenging: ${playerIsChallenging}
`.trim();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) =>
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

            try {
                const result = await withFallback(async (tier) => {
                    const agent = createPhilosopherAgent(tier);
                    const agentStream = await agent.stream(prompt, {
                        toolChoice: 'required',
                    });

                    // Stream reasoning chunks live
                    for await (const chunk of agentStream.textStream) {
                        send({ type: 'chunk', text: chunk });
                    }

                    return await agentStream.toolResults;
                });

                // Extract roamChatTool result
                const chatResult = result?.find((r: any) => r.payload?.toolName === 'roam_chat_response')?.payload?.result as any;

                if (chatResult) {
                    // Update memory
                    updateRoamMemory(playerAddress, philosopherKey, {
                        conversationTurns: [
                            ...memory.conversationTurns,
                            { role: 'philosopher', text: chatResult.response },
                        ],
                        patienceLevel: chatResult.newPatienceLevel,
                        hasBeenChallenged: chatResult.shouldChallenge || memory.hasBeenChallenged,
                    });

                    send({
                        type: 'response',
                        response: chatResult.response,
                        mood: chatResult.mood,
                        patienceLevel: chatResult.newPatienceLevel,
                        shouldChallenge: chatResult.shouldChallenge,
                        challengeReason: chatResult.challengeReason,
                        offerBattleOption: chatResult.offerBattleOption,
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
