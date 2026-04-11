import { freeAiTacticsTool, queueAvalancheMoveTool } from './tools/combat-tools';
import { pvpDecisionWorkflow } from './workflows/pvp-decision-workflow';

async function runSimulation() {
  if (!queueAvalancheMoveTool.execute) {
    throw new Error('queueAvalancheMoveTool.execute is not available');
  }

  if (!freeAiTacticsTool.execute) {
    throw new Error('freeAiTacticsTool.execute is not available');
  }

  const run = await pvpDecisionWorkflow.createRun();

  const decision = await run.start({
    inputData: {
      side: 'player',
      attacker: {
        id: 'pet-player-001',
        hp: 92,
        stamina: 60,
        attack: 55,
        defense: 42,
        speed: 37,
      },
      defender: {
        id: 'pet-enemy-001',
        hp: 88,
        stamina: 58,
        attack: 51,
        defense: 46,
        speed: 35,
      },
      candidateMoves: [
        {
          name: 'Swift Claw',
          power: 22,
          staminaCost: 10,
          accuracy: 0.92,
          critRate: 0.14,
        },
        {
          name: 'Arc Burst',
          power: 32,
          staminaCost: 22,
          accuracy: 0.75,
          critRate: 0.2,
        },
        {
          name: 'Guard Break',
          power: 27,
          staminaCost: 16,
          accuracy: 0.84,
          critRate: 0.1,
        },
      ],
    },
  });

  if (decision.status !== 'success') {
    throw new Error(`Workflow failed with status: ${decision.status}`);
  }

  const settlement = await queueAvalancheMoveTool.execute(
    {
      battleId: 'battle-demo-001',
      actorId: 'pet-player-001',
      side: 'player',
      moveName: decision.result.recommendedMove,
      estimatedDamage: decision.result.estimatedDamage,
    },
    {} as never,
  );

  const freeAdvice = await freeAiTacticsTool.execute(
    {
      side: 'player',
      attacker: {
        id: 'pet-player-001',
        hp: 92,
        stamina: 60,
        attack: 55,
        defense: 42,
        speed: 37,
      },
      defender: {
        id: 'pet-enemy-001',
        hp: 88,
        stamina: 58,
        attack: 51,
        defense: 46,
        speed: 35,
      },
      candidateMoves: [
        {
          name: 'Swift Claw',
          power: 22,
          staminaCost: 10,
          accuracy: 0.92,
          critRate: 0.14,
        },
        {
          name: 'Arc Burst',
          power: 32,
          staminaCost: 22,
          accuracy: 0.75,
          critRate: 0.2,
        },
        {
          name: 'Guard Break',
          power: 27,
          staminaCost: 16,
          accuracy: 0.84,
          critRate: 0.1,
        },
      ],
    },
    {} as never,
  );

  console.log('Decision');
  console.log(JSON.stringify(decision.result, null, 2));
  console.log('Settlement');
  console.log(JSON.stringify(settlement, null, 2));
  console.log('Free AI Advice');
  console.log(JSON.stringify(freeAdvice, null, 2));
}

runSimulation().catch(error => {
  console.error('Simulation failed', error);
  process.exit(1);
});
