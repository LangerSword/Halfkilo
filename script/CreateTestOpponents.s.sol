// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/GameCore.sol";

/// @notice Create and register test opponent agents for battle testing.
contract CreateTestOpponents is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        GameCore gameCore = GameCore(vm.envAddress("GAME_CORE"));

        // Register AI Opponent (agentId = 2)
        address aiOpponentWallet = address(0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa);
        uint256 aiAgentId = gameCore.registerAgent(aiOpponentWallet, "AI Agent", "ipfs://ai-agent");
        console.log("Created AI Opponent Agent ID:", aiAgentId);

        // Register Online Opponent (agentId = 3)
        address onlineOpponentWallet = address(0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB);
        uint256 onlineAgentId = gameCore.registerAgent(onlineOpponentWallet, "Online Player", "ipfs://online-player");
        console.log("Created Online Opponent Agent ID:", onlineAgentId);

        vm.stopBroadcast();

        console.log("Test opponents created successfully!");
    }
}
