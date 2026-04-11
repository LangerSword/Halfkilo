import { Mastra } from '@mastra/core';
import { petAgent } from './agents/petAgent';
import { matchWorkflow } from './workflows/matchWorkflow';
import { battleMemory } from './memory/battleMemory';

export const mastra = new Mastra({
  agents: { petAgent },
  workflows: { matchWorkflow },
  memory: { battle: battleMemory },
});
