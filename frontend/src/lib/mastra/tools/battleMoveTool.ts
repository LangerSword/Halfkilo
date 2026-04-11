// src/lib/mastra/tools/battleMoveTool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Available moves per philosopher — injected into tool description at agent creation
export const PHILOSOPHER_MOVES: Record<string, string[]> = {
    socrates: ['Question', 'Dialectic Counter', 'Socratic Reversal', 'Hemlock Drain', 'Elenchus Strike'],
    nietzsche: ['Will Surge', 'Eternal Return', 'Hammer Blow', 'Übermensch Rage', 'Nihil Blast'],
    sun_tzu: ['Feint', 'Terrain Read', 'Flanking Strike', 'Water Strategy', 'Empty Fort'],
    plato: ['Form Strike', 'Ideal Shield', 'Cave Illusion', 'Soul Ascent', 'Philosopher Beam'],
    darwin: ['Adapt', 'Natural Selection', 'Survival Strike', 'Mutation Burst', 'Fitness Surge'],
};

export const battleMoveTool = createTool({
    id: 'battle_move',
    description: `Decide and commit a battle move. MUST be called every turn.
    Choose from the philosopher's specific move list.
    Factor in the behaviour score from playerBehaviourTool — do not ignore it.`,

    inputSchema: z.object({
        // Agent state
        agentHP: z.number(), agentMaxHP: z.number(),
        agentElement: z.string(),
        philosopherKey: z.string(),
        availableMoves: z.array(z.string()),
        // Opponent state
        opponentHP: z.number(), opponentMaxHP: z.number(),
        opponentElement: z.string(),
        opponentLastMove: z.string().optional(),
        // Behaviour context (from playerBehaviourTool)
        behaviourScore: z.number().min(0).max(100),
        recommendedStyle: z.enum(['passive', 'reactive', 'aggressive', 'berserker']),
        inCharacterNote: z.string(),
        speedModifier: z.enum(['faster', 'normal', 'slower']),
        // Battle context
        turn: z.number(),
        role: z.enum(['user_pet', 'opponent_agent', 'opponent_pet']),
        previousMoves: z.array(z.string()).optional(),
    }),

    outputSchema: z.object({
        move: z.string().describe('Exact move name from availableMoves list'),
        moveCategory: z.enum(['attack', 'defend', 'special', 'heal', 'counter']),
        targetSelf: z.boolean().describe('true if move affects self (heal/buff)'),
        reasoning: z.string().max(250).describe('In-character reasoning, max 250 chars'),
        aggressionUsed: z.enum(['passive', 'reactive', 'aggressive', 'berserker']),
        turnDelay: z.number().min(0).max(3000)
            .describe('Milliseconds the agent "waits" before executing. 0=instant, 3000=very slow'),
    }),

    execute: async (input) => {
        // Deterministic fallback — fires if LLM fails to call this tool
        const { availableMoves, recommendedStyle, agentHP, agentMaxHP, turn, previousMoves } = input;
        const hpRatio = agentHP / agentMaxHP;

        // Avoid repeating last move
        const lastMove = previousMoves?.at(-1);
        const moves = availableMoves.filter((m: string) => m !== lastMove);
        const pool = moves.length > 0 ? moves : availableMoves;

        // Style-based selection
        let move: string;
        if (hpRatio < 0.25) {
            // Low HP — prefer heal or defensive move (first or last in list)
            move = pool[0];
        } else if (recommendedStyle === 'berserker' || recommendedStyle === 'aggressive') {
            // Attack-heavy — pick from middle of list (usually attack moves)
            move = pool[Math.floor(pool.length / 2)];
        } else {
            // Reactive or passive — rotate through moves
            move = pool[turn % pool.length];
        }

        const delays: Record<string, number> = {
            faster: 200, normal: 800, slower: 1800,
        };

        return {
            move,
            moveCategory: hpRatio < 0.25 ? 'heal' : recommendedStyle === 'berserker' ? 'attack' : 'reactive' as any,
            targetSelf: hpRatio < 0.25,
            reasoning: `${input.inCharacterNote} Choosing ${move}.`,
            aggressionUsed: recommendedStyle,
            turnDelay: delays[input.speedModifier] ?? 800,
        };
    },
});
