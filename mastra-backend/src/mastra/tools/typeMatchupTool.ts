import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const TYPE_CHART: Record<string, Record<string, number>> = {
  fire:    { nature: 1.5, thunder: 1.5, water: 0.75, fire: 1.0 },
  water:   { fire: 1.5, nature: 0.75, water: 1.0, thunder: 0.75 },
  nature:  { water: 1.5, fire: 0.75, nature: 1.0, thunder: 1.0 },
  thunder: { water: 1.5, nature: 1.0, fire: 0.75, thunder: 1.0 },
};

export const typeMatchupTool = createTool({
  id: 'type_matchup',
  description: 'Returns damage multiplier and tactical advice based on type matchup.',
  inputSchema: z.object({
    attackerElement: z.string(),
    defenderElement: z.string(),
  }),
  outputSchema: z.object({
    multiplier: z.number(),
    advice: z.string(),
  }),
  execute: async (input) => {
    const row = TYPE_CHART[input.attackerElement.toLowerCase()] ?? {};
    const multiplier = row[input.defenderElement.toLowerCase()] ?? 1.0;
    const advice = multiplier > 1.2
      ? `Strong type advantage! Prioritize elemental special attacks.`
      : multiplier < 0.9
      ? `Type disadvantage — avoid elemental moves, use physical attacks instead.`
      : `Neutral matchup — play to your base stats.`;
    return { multiplier, advice };
  },
});
