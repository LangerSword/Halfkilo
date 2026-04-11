import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const battleMoveTool = createTool({
  id: 'battle_move',
  description: `Decide and commit a battle move for this turn.
    Input: current battle state. Output: structured move decision with reasoning.`,
  inputSchema: z.object({
    myHP: z.number(),
    myMaxHP: z.number(),
    myAttack: z.number(),
    myDefense: z.number(),
    mySpecialPower: z.number(),
    myType: z.string(),
    opponentHP: z.number(),
    opponentMaxHP: z.number(),
    opponentType: z.string(),
    opponentAttack: z.number(),
    turnNumber: z.number(),
    statusEffects: z.array(z.string()).optional(),
    battleHistory: z.array(z.object({
      turn: z.number(),
      myMove: z.string(),
      opponentMove: z.string(),
      damageDone: z.number(),
      damageTaken: z.number(),
    })).optional(),
  }),
  outputSchema: z.object({
    move: z.enum(['attack', 'defend', 'special', 'heal']),
    target: z.enum(['opponent_primary', 'opponent_secondary', 'self', 'ally']),
    reasoning: z.string(),
    confidence: z.number().min(0).max(1),
    expectedDamage: z.number().optional(),
  }),
  execute: async (input) => {
    // The LLM fills this via tool_use — the schema enforces structure.
    // This executor is the fallback if called directly.
    const hpRatio = input.myHP / input.myMaxHP;
    if (hpRatio < 0.3) {
      return {
        move: 'heal' as const,
        target: 'self' as const,
        reasoning: 'Critical HP — emergency heal required.',
        confidence: 0.9,
      };
    }
    return {
      move: 'attack' as const,
      target: 'opponent_primary' as const,
      reasoning: 'Default attack — no special conditions met.',
      confidence: 0.6,
      expectedDamage: input.myAttack,
    };
  },
});
