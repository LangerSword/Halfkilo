// src/lib/mastra/tools/roamChatTool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const roamChatTool = createTool({
    id: 'roam_chat_response',
    description: `Generate a philosopher's response during free-roam conversation.
    Track patience degradation. Optionally trigger a battle challenge.`,

    inputSchema: z.object({
        philosopherKey: z.string(),
        playerMessage: z.string().max(500),
        patienceLevel: z.number().min(0).max(100),
        conversationLength: z.number().describe('Total turns in this conversation'),
        playerHasBeenRude: z.boolean().describe('True if message contains insults/spam'),
        playerIsChallenging: z.boolean().describe('True if player used the Challenge option'),
    }),

    outputSchema: z.object({
        response: z.string().max(400).describe('The philosopher speaks in character'),
        newPatienceLevel: z.number().min(0).max(100),
        shouldChallenge: z.boolean().describe('True = philosopher initiates battle'),
        challengeReason: z.string().optional().describe('Why the philosopher challenges'),
        mood: z.enum(['welcoming', 'thoughtful', 'irritated', 'furious', 'battle_ready']),
        offerBattleOption: z.boolean().describe('Show "Challenge?" button to player'),
    }),

    execute: async (input) => {
        const { patienceLevel, playerHasBeenRude, playerIsChallenging, conversationLength } = input;

        // Patience degrades on rudeness, very long conversations, and being challenged
        let newPatience = patienceLevel;
        if (playerHasBeenRude) newPatience = Math.max(0, newPatience - 25);
        if (conversationLength > 10) newPatience = Math.max(0, newPatience - 5);
        if (conversationLength > 20) newPatience = Math.max(0, newPatience - 10);

        const shouldChallenge = playerIsChallenging || newPatience <= 20;
        const mood: 'welcoming' | 'thoughtful' | 'irritated' | 'furious' | 'battle_ready' =
            newPatience > 70 ? 'welcoming'
            : newPatience > 50 ? 'thoughtful'
                : newPatience > 30 ? 'irritated'
                    : newPatience > 10 ? 'furious'
                        : 'battle_ready';

        // Deterministic fallback response (LLM will override this)
        const fallbackResponses: Record<string, string> = {
            welcoming: 'Ah, a seeker of wisdom. What troubles your mind?',
            thoughtful: 'Your words give me pause. Let us reason together.',
            irritated: 'You test my patience. Choose your next words carefully.',
            furious: 'Enough of this. My philosophy demands action.',
            battle_ready: 'Words have failed us both. Let us settle this differently.',
        };

        return {
            response: fallbackResponses[mood],
            newPatienceLevel: newPatience,
            shouldChallenge,
            challengeReason: shouldChallenge
                ? (playerHasBeenRude ? 'Your disrespect cannot go unanswered.' : 'This debate must be settled in battle.')
                : undefined,
            mood,
            offerBattleOption: newPatience <= 60 || playerIsChallenging,
        };
    },
});
