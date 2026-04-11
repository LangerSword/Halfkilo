import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { moveSchema, petStateSchema, scoreMoveTool } from '../tools/combat-tools';

const pvpDecisionInputSchema = z.object({
  side: z.enum(['player', 'enemy']),
  attacker: petStateSchema,
  defender: petStateSchema,
  candidateMoves: z.array(moveSchema).min(1),
});

const pvpDecisionOutputSchema = z.object({
  recommendedMove: z.string(),
  rationale: z.string(),
  estimatedDamage: z.number().min(0),
  staminaAfter: z.number().min(0),
  confidence: z.number().min(0).max(1),
});

const chooseMoveStep = createStep({
  id: 'choose-move-step',
  inputSchema: pvpDecisionInputSchema,
  outputSchema: z.object({
    side: z.enum(['player', 'enemy']),
    attacker: petStateSchema,
    defender: petStateSchema,
    selectedMove: moveSchema,
    rationale: z.string(),
  }),
  execute: async ({ inputData }) => {
    const byScore = [...inputData.candidateMoves].sort((a, b) => {
      const aScore = a.power * a.accuracy - a.staminaCost * 0.2;
      const bScore = b.power * b.accuracy - b.staminaCost * 0.2;
      return bScore - aScore;
    });

    const selectedMove = byScore[0];
    const rationale = `${inputData.side} selected ${selectedMove.name} for best power-to-risk ratio.`;

    return {
      side: inputData.side,
      attacker: inputData.attacker,
      defender: inputData.defender,
      selectedMove,
      rationale,
    };
  },
});

const resolveMoveStep = createStep({
  id: 'resolve-move-step',
  inputSchema: chooseMoveStep.outputSchema,
  outputSchema: pvpDecisionOutputSchema,
  execute: async ({ inputData }) => {
    if (!scoreMoveTool.execute) {
      throw new Error('scoreMoveTool.execute is not available');
    }

    const score = await scoreMoveTool.execute(
      {
        attacker: inputData.attacker,
        defender: inputData.defender,
        move: inputData.selectedMove,
      },
      {} as never,
    );

    if (!('estimatedDamage' in score)) {
      throw new Error('scoreMoveTool returned a validation error');
    }

    return {
      recommendedMove: inputData.selectedMove.name,
      rationale: inputData.rationale,
      estimatedDamage: score.estimatedDamage,
      staminaAfter: score.staminaAfter,
      confidence: score.confidence,
    };
  },
});

export const pvpDecisionWorkflow = createWorkflow({
  id: 'pvp-decision-workflow',
  description: 'Selects and scores the next PvP move for a pet.',
  inputSchema: pvpDecisionInputSchema,
  outputSchema: pvpDecisionOutputSchema,
})
  .then(chooseMoveStep)
  .then(resolveMoveStep)
  .commit();
