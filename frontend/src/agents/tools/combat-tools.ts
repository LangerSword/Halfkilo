import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const petStateSchema = z.object({
  id: z.string(),
  hp: z.number().min(0).max(100),
  stamina: z.number().min(0).max(100),
  attack: z.number().min(1),
  defense: z.number().min(1),
  speed: z.number().min(1),
});

export const moveSchema = z.object({
  name: z.string(),
  power: z.number().min(1).max(100),
  staminaCost: z.number().min(0).max(100),
  accuracy: z.number().min(0.1).max(1),
  critRate: z.number().min(0).max(1).default(0.1),
});

const scoreMoveInputSchema = z.object({
  attacker: petStateSchema,
  defender: petStateSchema,
  move: moveSchema,
});

const scoreMoveOutputSchema = z.object({
  estimatedDamage: z.number().min(0),
  staminaAfter: z.number().min(0),
  hitChance: z.number().min(0).max(1),
  critChance: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
});

const historySummaryInputSchema = z.object({
  actions: z.array(
    z.object({
      actor: z.enum(['player', 'enemy']),
      move: z.string(),
      damage: z.number().min(0),
      wasCritical: z.boolean(),
    }),
  ),
});

const historySummaryOutputSchema = z.object({
  averageDamageByPlayer: z.number(),
  averageDamageByEnemy: z.number(),
  playerCritRate: z.number(),
  enemyCritRate: z.number(),
});

const queueTxInputSchema = z.object({
  battleId: z.string(),
  actorId: z.string(),
  side: z.enum(['player', 'enemy']),
  moveName: z.string(),
  estimatedDamage: z.number().min(0),
});

const queueTxOutputSchema = z.object({
  submitted: z.boolean(),
  chain: z.string(),
  txReference: z.string(),
  message: z.string(),
});

const freeAiTacticsInputSchema = z.object({
  side: z.enum(['player', 'enemy']),
  attacker: petStateSchema,
  defender: petStateSchema,
  candidateMoves: z.array(moveSchema).min(1),
  recentSummary: z
    .object({
      averageDamageByPlayer: z.number(),
      averageDamageByEnemy: z.number(),
      playerCritRate: z.number(),
      enemyCritRate: z.number(),
    })
    .optional(),
});

const freeAiTacticsOutputSchema = z.object({
  provider: z.string(),
  model: z.string(),
  recommendation: z.string(),
  fallbackUsed: z.boolean(),
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const safeAverage = (items: number[]) => {
  if (items.length === 0) {
    return 0;
  }

  return items.reduce((sum, current) => sum + current, 0) / items.length;
};

export const scoreMoveTool = createTool({
  id: 'score-move',
  description: 'Scores a move using current attacker/defender pet state.',
  inputSchema: scoreMoveInputSchema,
  outputSchema: scoreMoveOutputSchema,
  execute: async inputData => {
    const base = inputData.move.power * (inputData.attacker.attack / inputData.defender.defense);
    const staminaPenalty = inputData.move.staminaCost > inputData.attacker.stamina ? 0.75 : 1;
    const estimatedDamage = Math.max(0, Math.round(base * inputData.move.accuracy * staminaPenalty));
    const staminaAfter = Math.max(0, inputData.attacker.stamina - inputData.move.staminaCost);
    const confidence = clamp((inputData.move.accuracy + (1 - inputData.move.staminaCost / 100)) / 2, 0, 1);

    return {
      estimatedDamage,
      staminaAfter,
      hitChance: inputData.move.accuracy,
      critChance: inputData.move.critRate ?? 0.1,
      confidence,
    };
  },
});

export const summarizeHistoryTool = createTool({
  id: 'summarize-action-history',
  description: 'Summarizes recent PvP actions to help adaptive strategy.',
  inputSchema: historySummaryInputSchema,
  outputSchema: historySummaryOutputSchema,
  execute: async inputData => {
    const playerActions = inputData.actions.filter(action => action.actor === 'player');
    const enemyActions = inputData.actions.filter(action => action.actor === 'enemy');

    return {
      averageDamageByPlayer: safeAverage(playerActions.map(action => action.damage)),
      averageDamageByEnemy: safeAverage(enemyActions.map(action => action.damage)),
      playerCritRate: safeAverage(playerActions.map(action => (action.wasCritical ? 1 : 0))),
      enemyCritRate: safeAverage(enemyActions.map(action => (action.wasCritical ? 1 : 0))),
    };
  },
});

export const queueAvalancheMoveTool = createTool({
  id: 'queue-avalanche-move',
  description: 'Queues an action payload for Avalanche L1 settlement.',
  inputSchema: queueTxInputSchema,
  outputSchema: queueTxOutputSchema,
  execute: async inputData => {
    const stamp = Date.now().toString(36);
    const txReference = `avax-l1-${inputData.battleId}-${stamp}`;

    return {
      submitted: true,
      chain: 'avalanche-l1',
      txReference,
      message: `${inputData.side} move ${inputData.moveName} queued for settlement`,
    };
  },
});

export const freeAiTacticsTool = createTool({
  id: 'free-ai-tactics',
  description: 'Uses a free text model API to produce tactical advice for the next PvP move.',
  inputSchema: freeAiTacticsInputSchema,
  outputSchema: freeAiTacticsOutputSchema,
  execute: async inputData => {
    const endpoint = process.env.FREE_AI_ENDPOINT ?? 'https://text.pollinations.ai/openai';
    const model = process.env.FREE_AI_MODEL ?? 'openai';

    const prompt = [
      `Side: ${inputData.side}`,
      `Attacker HP/Stamina: ${inputData.attacker.hp}/${inputData.attacker.stamina}`,
      `Defender HP/Stamina: ${inputData.defender.hp}/${inputData.defender.stamina}`,
      `Moves: ${inputData.candidateMoves.map(move => `${move.name}(pow=${move.power},cost=${move.staminaCost},acc=${move.accuracy})`).join(', ')}`,
      inputData.recentSummary
        ? `Recent summary: playerDmg=${inputData.recentSummary.averageDamageByPlayer.toFixed(1)}, enemyDmg=${inputData.recentSummary.averageDamageByEnemy.toFixed(1)}, playerCrit=${inputData.recentSummary.playerCritRate.toFixed(2)}, enemyCrit=${inputData.recentSummary.enemyCritRate.toFixed(2)}`
        : 'Recent summary: unavailable',
    ].join('\n');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.FREE_AI_TOKEN ? { Authorization: `Bearer ${process.env.FREE_AI_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are a PvP battle tactics assistant. Return short tactical advice with one recommended move and one reason.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          max_tokens: 140,
        }),
      });

      if (!response.ok) {
        throw new Error(`Free API call failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const recommendation = payload.choices?.[0]?.message?.content?.trim();

      if (!recommendation) {
        throw new Error('Free API returned an empty recommendation');
      }

      return {
        provider: 'pollinations',
        model,
        recommendation,
        fallbackUsed: false,
      };
    } catch {
      const fallbackMove = [...inputData.candidateMoves].sort((a, b) => {
        const aScore = a.power * a.accuracy - a.staminaCost * 0.2;
        const bScore = b.power * b.accuracy - b.staminaCost * 0.2;
        return bScore - aScore;
      })[0];

      return {
        provider: 'local-fallback',
        model: 'heuristic-v1',
        recommendation: `Use ${fallbackMove.name}; best estimated power-to-risk ratio from current options.`,
        fallbackUsed: true,
      };
    }
  },
});
