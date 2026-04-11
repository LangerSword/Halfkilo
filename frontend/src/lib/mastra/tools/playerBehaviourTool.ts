// src/lib/mastra/tools/playerBehaviourTool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const playerBehaviourTool = createTool({
    id: 'read_player_behaviour',
    description: `Analyse the player's behaviour signals and return a calmness score
    and recommended aggression adjustment for the agent. Call this at the start
    of every turn before deciding a move.`,

    inputSchema: z.object({
        // Movement signals (from Phaser world or battle canvas)
        moveFrequency: z.number().min(0).max(10)
            .describe('How many times player moved per second in last 3s. 0=still, 10=frantic'),
        decisionTimeMs: z.number().min(0)
            .describe('Milliseconds player took to confirm their last move. 0=instant, 10000+=slow'),
        attackFrequency: z.number().min(0).max(10)
            .describe('Attack actions per second in last 3s. High = aggressive player'),
        idleTimeMs: z.number().min(0)
            .describe('How long player has been idle (not inputting anything)'),
        // Battle-specific context
        currentTurn: z.number().describe('Current battle turn number'),
        playerHPPercent: z.number().min(0).max(100).describe('Player HP as percentage'),
        agentHPPercent: z.number().min(0).max(100).describe('Agent HP as percentage'),
        role: z.enum(['user_pet', 'opponent_agent', 'opponent_pet'])
            .describe('Which role this agent is playing'),
    }),

    outputSchema: z.object({
        behaviourScore: z.number().min(0).max(100)
            .describe('0 = completely frantic/aggressive, 100 = perfectly calm/passive'),
        aggressionDelta: z.number().min(-30).max(30)
            .describe('How much to shift agent aggression. Positive = be MORE aggressive'),
        speedModifier: z.enum(['faster', 'normal', 'slower'])
            .describe('Should agent respond faster or slower than usual'),
        recommendedStyle: z.enum(['passive', 'reactive', 'aggressive', 'berserker'])
            .describe('Overall battle style the agent should adopt this turn'),
        inCharacterNote: z.string()
            .describe('One sentence the agent should incorporate into its reasoning'),
    }),

    execute: async (input) => {
        const {
            moveFrequency, decisionTimeMs, attackFrequency,
            idleTimeMs, currentTurn, playerHPPercent, agentHPPercent, role
        } = input;

        // Compute raw calmness score
        // High move frequency = less calm, long decision time = more calm
        const movePenalty = Math.min(moveFrequency * 8, 50);
        const attackPenalty = Math.min(attackFrequency * 10, 40);
        const decisionBonus = Math.min(decisionTimeMs / 200, 20); // up to 20 bonus for slow decisions
        const idleBonus = Math.min(idleTimeMs / 1000, 15); // bonus for being still

        const rawScore = 100 - movePenalty - attackPenalty + decisionBonus + idleBonus;
        const behaviourScore = Math.max(0, Math.min(100, rawScore));

        // Compute aggression delta — agent becomes more aggressive when player is aggressive
        // Role modifies this: opponent_agent is most reactive, user_pet is supportive
        let aggressionDelta = 0;
        if (behaviourScore < 30) {
            // Player is very frantic — agent mirrors with aggression
            aggressionDelta = role === 'user_pet' ? 10 : 25;
        } else if (behaviourScore < 60) {
            // Player is somewhat active
            aggressionDelta = role === 'user_pet' ? 5 : 10;
        } else if (behaviourScore > 80) {
            // Player is very calm — agent becomes more probing/patient
            aggressionDelta = role === 'opponent_agent' ? -10 : -5;
        }

        // HP pressure overrides: if agent is losing badly, it ignores behaviour and attacks
        if (agentHPPercent < 25) aggressionDelta = Math.max(aggressionDelta, 20);
        // If player is nearly dead, agent stays aggressive to close it out
        if (playerHPPercent < 20) aggressionDelta = Math.max(aggressionDelta, 15);

        // Determine style
        const effectiveAggression = 50 + aggressionDelta;
        let recommendedStyle: 'passive' | 'reactive' | 'aggressive' | 'berserker';
        if (effectiveAggression >= 80) recommendedStyle = 'berserker';
        else if (effectiveAggression >= 60) recommendedStyle = 'aggressive';
        else if (effectiveAggression >= 40) recommendedStyle = 'reactive';
        else recommendedStyle = 'passive';

        // Speed modifier
        let speedModifier: 'faster' | 'normal' | 'slower';
        if (behaviourScore < 30) speedModifier = 'faster';       // match player's energy
        else if (behaviourScore > 75 || idleTimeMs > 3000) speedModifier = 'slower'; // patient
        else speedModifier = 'normal';

        // In-character note (fed to the agent's reasoning)
        const notes: Record<string, string> = {
            berserker: 'The opponent is reckless — overwhelm them before they recover.',
            aggressive: 'Their hurried movements betray anxiety — press the advantage.',
            reactive: 'They are testing me. I shall respond in kind.',
            passive: 'They move with patience. I must think carefully before acting.',
        };
        const inCharacterNote = notes[recommendedStyle];

        return { behaviourScore, aggressionDelta, speedModifier, recommendedStyle, inCharacterNote };
    },
});
