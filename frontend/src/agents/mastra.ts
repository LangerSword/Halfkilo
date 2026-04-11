import { Mastra } from '@mastra/core/mastra';
import { battleOrchestratorAgent, enemyPetAgent, playerPetAgent } from './pvp-agents';
import { freeAiTacticsTool, queueAvalancheMoveTool, scoreMoveTool, summarizeHistoryTool } from './tools/combat-tools';
import { pvpDecisionWorkflow } from './workflows/pvp-decision-workflow';

export const mastra = new Mastra({
  agents: {
    playerPetAgent,
    enemyPetAgent,
    battleOrchestratorAgent,
  },
  tools: {
    scoreMoveTool,
    summarizeHistoryTool,
    queueAvalancheMoveTool,
    freeAiTacticsTool,
  },
  workflows: {
    pvpDecisionWorkflow,
  },
  logger: false,
});
