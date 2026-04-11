import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { createPetAgent } from '../agents/petAgent';
import { fetchPetStatsTool } from '../tools/fetchPetStatsTool';
import { typeMatchupTool } from '../tools/typeMatchupTool';

// Shared schemas
const petStatsSchema = z.object({
  name: z.string(),
  petType: z.string(),
  element: z.string(),
  hp: z.number(),
  attack: z.number(),
  defense: z.number(),
  specialPower: z.number(),
});

const hpEntrySchema = z.object({
  name: z.string(),
  current: z.number(),
  max: z.number(),
});

const historyEntrySchema = z.object({
  turn: z.number(),
  petName: z.string(),
  move: z.string(),
  damage: z.number(),
  reasoning: z.string(),
});

// ─── Step 1: Fetch all 4 pet stats ───
const fetchAllStats = createStep({
  id: 'fetch-all-stats',
  description: 'Fetch all 4 pet stats from Avalanche NFT contract',
  inputSchema: z.object({
    matchId: z.string(),
    team1: z.tuple([z.number(), z.number()]),
    team2: z.tuple([z.number(), z.number()]),
  }),
  outputSchema: z.object({
    pets: z.array(petStatsSchema),
    matchId: z.string(),
    team1: z.tuple([z.number(), z.number()]),
    team2: z.tuple([z.number(), z.number()]),
  }),
  execute: async ({ inputData }) => {
    const allIds = [...inputData.team1, ...inputData.team2];
    const stats = await Promise.all(
      allIds.map(async (id) => {
        const result = await fetchPetStatsTool.execute!({ tokenId: id }, {});
        return result as z.infer<typeof petStatsSchema>;
      })
    );
    return {
      pets: stats,
      matchId: inputData.matchId,
      team1: inputData.team1,
      team2: inputData.team2,
    };
  },
});

// ─── Step 2: Run battle loop ───
const runBattleLoop = createStep({
  id: 'run-battle-loop',
  description: 'Turn-by-turn battle loop — max 30 turns',
  inputSchema: z.object({
    pets: z.array(petStatsSchema),
    matchId: z.string(),
    team1: z.tuple([z.number(), z.number()]),
    team2: z.tuple([z.number(), z.number()]),
  }),
  outputSchema: z.object({
    winner: z.number(),
    history: z.array(historyEntrySchema),
    finalHpState: z.array(hpEntrySchema),
    matchId: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { pets, matchId } = inputData;

    // Create agents for the active fighters (index 0 and 2 = first pet of each team)
    const agents = pets.map(pet =>
      createPetAgent(pet.petType.toLowerCase().replace(' ', '_'), pet.name)
    );

    // Mutable battle state
    const hpState = pets.map(p => ({ current: p.hp, max: p.hp }));
    const active = [0, 2]; // indices into pets[] for currently active fighter per team
    const history: z.infer<typeof historyEntrySchema>[] = [];
    let turn = 0;
    let winner: number | null = null;

    // Broadcast function — sends events via the global broadcastMap (set by server.ts)
    const broadcast = getBroadcastFn(matchId);

    while (turn < 30 && winner === null) {
      turn++;

      for (let teamIdx = 0; teamIdx < 2; teamIdx++) {
        const myIdx = active[teamIdx];
        const oppIdx = active[1 - teamIdx];
        const me = pets[myIdx];
        const opp = pets[oppIdx];

        broadcast({ type: 'thinking', petName: me.name, team: teamIdx + 1, turn });

        // Get type matchup for context
        const matchup = await typeMatchupTool.execute!(
          { attackerElement: me.element, defenderElement: opp.element }, {}
        ) as { multiplier: number; advice: string };

        // Ask the Mastra agent for its move decision
        let move = { move: 'attack' as const, target: 'opponent_primary' as const, reasoning: 'Default attack.', confidence: 0.6 };
        let reasoningText = '';

        try {
          const response = await agents[myIdx].generate(
            `Turn ${turn}. Battle state:
             My name: ${me.name} | My type: ${me.element}
             My HP: ${hpState[myIdx].current}/${hpState[myIdx].max}
             My Attack: ${me.attack} | My Defense: ${me.defense} | My Special: ${me.specialPower}
             Opponent: ${opp.name} | Opponent type: ${opp.element}
             Opponent HP: ${hpState[oppIdx].current}/${hpState[oppIdx].max}
             Type matchup: ${matchup.multiplier}x — ${matchup.advice}
             Turn history so far: ${history.length > 0 ? history.slice(-4).map(h => `T${h.turn}: ${h.petName} used ${h.move} for ${h.damage} dmg`).join('; ') : 'None yet'}

             Call the battle_move tool with your decision. Include your in-character reasoning.`,
            { toolChoice: 'required' as const }
          );

          // Extract tool result from ToolResultChunk (payload.toolName, payload.result)
          const toolResult = response.toolResults?.find(
            (t: any) => t.payload?.toolName === 'battleMoveTool'
          );
          if (toolResult?.payload?.result) {
            move = toolResult.payload.result as typeof move;
          }
          reasoningText = move.reasoning || response.text || '';
        } catch (err) {
          console.error(`Agent error for ${me.name} on turn ${turn}:`, err);
          reasoningText = 'Agent error — using fallback attack.';
        }

        // Broadcast reasoning
        broadcast({ type: 'reasoning', petName: me.name, chunk: reasoningText, turn });

        // Apply game logic with type multiplier
        let damage = 0;
        if (move.move === 'attack') {
          damage = Math.max(1, Math.round(me.attack * matchup.multiplier - opp.defense * 0.5));
          hpState[oppIdx].current = Math.max(0, hpState[oppIdx].current - damage);
        } else if (move.move === 'special') {
          damage = Math.max(1, Math.round(me.specialPower * 1.5 * matchup.multiplier - opp.defense * 0.3));
          hpState[oppIdx].current = Math.max(0, hpState[oppIdx].current - damage);
        } else if (move.move === 'heal') {
          const healed = Math.round(me.hp * 0.2);
          hpState[myIdx].current = Math.min(hpState[myIdx].max, hpState[myIdx].current + healed);
        }
        // defend: mitigate next incoming damage (simplified: skip damage this turn)

        history.push({ turn, petName: me.name, move: move.move, damage, reasoning: reasoningText });

        broadcast({
          type: 'turn_result',
          turn,
          team: teamIdx + 1,
          petName: me.name,
          move: move.move,
          damage,
          hpState: hpState.map((h, i) => ({ name: pets[i].name, ...h })),
          reasoning: reasoningText,
        });

        // Check win condition
        if (hpState[oppIdx].current <= 0) {
          winner = teamIdx + 1;
          break;
        }

        // Rate-limit delay (500ms between agent calls for free-tier Gemini)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const finalResult = {
      winner: winner ?? 1,
      history,
      finalHpState: hpState.map((h, i) => ({ name: pets[i].name, ...h })),
      matchId,
    };

    broadcast({ type: 'match_over', winner: finalResult.winner, matchId, history });

    return finalResult;
  },
});

// ─── Step 3: Commit result ───
const commitResult = createStep({
  id: 'commit-result',
  description: 'Log result and notify (BattleArena.sol commitment is TODO post-deploy)',
  inputSchema: z.object({
    winner: z.number(),
    history: z.array(historyEntrySchema),
    finalHpState: z.array(hpEntrySchema),
    matchId: z.string(),
  }),
  outputSchema: z.object({
    winner: z.number(),
    matchId: z.string(),
    committed: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    // TODO: call BattleArena.sol commitResult with viem walletClient after deploy
    // TODO: store to MongoDB battle_summaries collection
    console.log(`Match ${inputData.matchId} complete. Winner: Team ${inputData.winner}`);
    console.log(`Battle lasted ${inputData.history.length} moves.`);

    return { winner: inputData.winner, matchId: inputData.matchId, committed: false };
  },
});

// ─── Workflow definition ───
export const matchWorkflow = createWorkflow({
  id: 'match-workflow',
  description: '2v2 NFT pet battle orchestration workflow',
  inputSchema: z.object({
    matchId: z.string(),
    team1: z.tuple([z.number(), z.number()]),
    team2: z.tuple([z.number(), z.number()]),
  }),
  outputSchema: z.object({
    winner: z.number(),
    matchId: z.string(),
    committed: z.boolean(),
  }),
})
  .then(fetchAllStats)
  .then(runBattleLoop)
  .then(commitResult)
  .commit();

// ─── Broadcast infrastructure ───
// Global map used by server.ts to register per-match broadcast functions
type BroadcastFn = (data: Record<string, unknown>) => void;
const broadcastMap = new Map<string, BroadcastFn>();

export function registerBroadcast(matchId: string, fn: BroadcastFn) {
  broadcastMap.set(matchId, fn);
}

export function unregisterBroadcast(matchId: string) {
  broadcastMap.delete(matchId);
}

function getBroadcastFn(matchId: string): BroadcastFn {
  return broadcastMap.get(matchId) ?? ((data) => {
    console.log(`[broadcast:${matchId}]`, JSON.stringify(data).slice(0, 120));
  });
}
