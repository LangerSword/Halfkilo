// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/AgentNFT.sol";
import "../contracts/PetNFT.sol";
import "../contracts/ItemNFT.sol";
import "../contracts/IdentityRegistry.sol";
import "../contracts/ReputationRegistry.sol";
import "../contracts/GameCore.sol";

/// @notice One-time wiring script for an existing deployment.
/// Reads contract addresses from env:
/// AGENT_NFT, PET_NFT, ITEM_NFT, IDENTITY_REGISTRY, REPUTATION_REGISTRY, GAME_CORE
contract WireExistingDeployment is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        AgentNFT agentNFT = AgentNFT(vm.envAddress("AGENT_NFT"));
        PetNFT petNFT = PetNFT(vm.envAddress("PET_NFT"));
        ItemNFT itemNFT = ItemNFT(vm.envAddress("ITEM_NFT"));
        IdentityRegistry identityRegistry = IdentityRegistry(vm.envAddress("IDENTITY_REGISTRY"));
        ReputationRegistry reputationRegistry = ReputationRegistry(vm.envAddress("REPUTATION_REGISTRY"));
        address gameCore = vm.envAddress("GAME_CORE");

        if (!itemNFT.authorizedMinters(gameCore)) {
            itemNFT.setAuthorizedMinter(gameCore, true);
            console.log("Set ItemNFT authorized minter:", gameCore);
        } else {
            console.log("ItemNFT authorized minter already set");
        }

        if (!petNFT.authorizedUpdaters(gameCore)) {
            petNFT.setAuthorizedUpdater(gameCore, true);
            console.log("Set PetNFT authorized updater:", gameCore);
        } else {
            console.log("PetNFT authorized updater already set");
        }

        if (reputationRegistry.authorizedGame() != gameCore) {
            reputationRegistry.setAuthorizedGame(gameCore);
            console.log("Set ReputationRegistry authorized game:", gameCore);
        } else {
            console.log("ReputationRegistry authorized game already set");
        }

        if (agentNFT.owner() != gameCore) {
            agentNFT.transferOwnership(gameCore);
            console.log("Transferred AgentNFT ownership to GameCore");
        } else {
            console.log("AgentNFT ownership already set to GameCore");
        }

        if (itemNFT.owner() != gameCore) {
            itemNFT.transferOwnership(gameCore);
            console.log("Transferred ItemNFT ownership to GameCore");
        } else {
            console.log("ItemNFT ownership already set to GameCore");
        }

        if (petNFT.owner() != gameCore) {
            petNFT.transferOwnership(gameCore);
            console.log("Transferred PetNFT ownership to GameCore");
        } else {
            console.log("PetNFT ownership already set to GameCore");
        }

        if (identityRegistry.owner() != gameCore) {
            identityRegistry.transferOwnership(gameCore);
            console.log("Transferred IdentityRegistry ownership to GameCore");
        } else {
            console.log("IdentityRegistry ownership already set to GameCore");
        }

        vm.stopBroadcast();
    }
}