import { Agent } from '@mastra/core/agent';
import { pvpDecisionWorkflow } from './workflows/pvp-decision-workflow';
import { freeAiTacticsTool, queueAvalancheMoveTool, scoreMoveTool, summarizeHistoryTool } from './tools/combat-tools';

const playerModel = process.env.PLAYER_AGENT_MODEL ?? 'openai/gpt-4.1-mini';
const enemyModel = process.env.ENEMY_AGENT_MODEL ?? 'openai/gpt-4.1-mini';
const orchestratorModel = process.env.ORCHESTRATOR_MODEL ?? 'openai/gpt-4.1';

export const playerPetAgent = new Agent({
  id: 'player-pet-agent',
  name: 'Player Pet Agent',
  instructions: `You manage the player's pet strategy in PvP battles.
Use workflow-pvpDecisionWorkflow for move recommendations.
Use summarize-action-history and score-move before finalizing a recommendation.
Use free-ai-tactics for a free external tactical second opinion.
Keep responses concise and action-oriented.`,
  model: playerModel,
  tools: {
    summarizeHistoryTool,
    scoreMoveTool,
    freeAiTacticsTool,
  },
  workflows: {
    pvpDecisionWorkflow,
  },
});

export const enemyPetAgent = new Agent({
  id: 'enemy-pet-agent',
  name: 'Enemy Pet Agent',
  instructions: `You control the enemy pet with adaptive strategy.
Use workflow-pvpDecisionWorkflow to choose moves that counter player behavior.
Use summarize-action-history to adapt based on recent turns.`,
  model: enemyModel,
  tools: {
    summarizeHistoryTool,
    scoreMoveTool,
    freeAiTacticsTool,
  },
  workflows: {
    pvpDecisionWorkflow,
  },
});

export const battleOrchestratorAgent = new Agent({
  id: 'battle-orchestrator-agent',
  name: 'Battle Orchestrator Agent',
  instructions: `You orchestrate one full PvP turn between player and enemy pets.
Ask each side for its move recommendation and produce a deterministic turn summary.
Queue settlements with queue-avalanche-move once damage values are known.`,
  model: orchestratorModel,
  tools: {
    queueAvalancheMoveTool,
    summarizeHistoryTool,
    scoreMoveTool,
    freeAiTacticsTool,
  },
  workflows: {
    pvpDecisionWorkflow,
  },
});
