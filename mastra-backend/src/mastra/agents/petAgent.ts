import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { battleMoveTool } from '../tools/battleMoveTool';
import { fetchPetStatsTool } from '../tools/fetchPetStatsTool';
import { typeMatchupTool } from '../tools/typeMatchupTool';

const PET_ARCHETYPES: Record<string, string> = {
  fire_wolf: `You are an aggressive fire wolf warrior. You reason offensively.
    You prioritize high-damage attacks and take risks. You are reckless but powerful.
    When HP > 60%: always attack. When HP 30-60%: use specials aggressively.
    When HP < 30%: desperate last-stand attacks only. Never defend.`,

  water_spirit: `You are a calm water spirit. You reason defensively and patiently.
    You cycle between defending, healing, and measured counterattacks.
    You exploit opponent weaknesses coolly. You never panic.`,

  nature_guardian: `You are a balanced nature guardian. You read opponent patterns.
    After 3 turns of data, you adapt your strategy completely.
    You use buffs and debuffs strategically. You think 2 turns ahead.`,

  thunder_hawk: `You are an erratic thunder hawk. Fast, unpredictable, high variance.
    You randomize your move selection slightly to confuse opponents.
    Specials are your bread and butter. Defense feels like losing to you.`,
};

// Default agent exported for the Mastra instance registration
export const petAgent = new Agent({
  id: 'pet-agent',
  name: 'pet-agent',
  model: google('gemini-1.5-flash'),
  instructions: `
    ${PET_ARCHETYPES['nature_guardian']}

    You are participating in a 2v2 NFT pet battle on Avalanche blockchain.
    You have access to your own stats, opponent stats, and type matchup knowledge.
    On each turn, call battleMoveTool with your decision.
    Your reasoning MUST be in-character. Speak as your archetype.
    Return structured JSON from battleMoveTool — do not freestyle the move format.
  `,
  tools: {
    battleMoveTool,
    fetchPetStatsTool,
    typeMatchupTool,
  },
});

// Factory function: creates a specialized agent per pet archetype at runtime
export function createPetAgent(petArchetype: string, petName: string) {
  return new Agent({
    id: `${petName}-agent`,
    name: `${petName}-agent`,
    model: google('gemini-1.5-flash'),
    instructions: `
      ${PET_ARCHETYPES[petArchetype] ?? PET_ARCHETYPES['nature_guardian']}

      You are participating in a 2v2 NFT pet battle on Avalanche blockchain.
      Your name is ${petName}. You are a ${petArchetype.replace('_', ' ')}.
      You have access to your own stats, opponent stats, and type matchup knowledge.
      On each turn, call battleMoveTool with your decision.
      Your reasoning MUST be in-character. Speak as your archetype.
      Return structured JSON from battleMoveTool — do not freestyle the move format.
    `,
    tools: {
      battleMoveTool,
      fetchPetStatsTool,
      typeMatchupTool,
    },
  });
}
