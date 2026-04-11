import hre from "hardhat";

async function main() {
  console.log("Deploying to Avalanche Fuji...");

  // Deploy PetNFT
  const petNFT = await hre.viem.deployContract("PetNFT");
  console.log(`PetNFT deployed to: ${petNFT.address}`);

  // Deploy BattleArena
  const battleArena = await hre.viem.deployContract("BattleArena");
  console.log(`BattleArena deployed to: ${battleArena.address}`);

  console.log("\n--- Add these to mastra-backend/.env ---");
  console.log(`PET_NFT_CONTRACT=${petNFT.address}`);
  console.log(`BATTLE_ARENA_CONTRACT=${battleArena.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
