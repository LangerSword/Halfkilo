// src/lib/mastra/index.ts
import { Mastra } from '@mastra/core';
import { createPhilosopherAgent } from './agents/philosopherAgent';

export const mastra = new Mastra({
    agents: {
        philosopherAgent: createPhilosopherAgent('primary'),
    },
});

// Export helpers used by API routes
export { createPhilosopherAgent } from './agents/philosopherAgent';
export { PHILOSOPHER_CARDS } from './agents/philosopherAgent';
export { getLLM, withFallback } from './llm';
export {
    getOrCreateRoamMemory, updateRoamMemory,
    getOrCreateBattleMemory, updateBattleMemory,
    clearBattleMemory
} from './memory/agentMemory';
