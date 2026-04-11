// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BattleArena is Ownable {
    struct MatchResult {
        uint256[] team1;
        uint256[] team2;
        uint8 winner;
        uint256 timestamp;
    }

    mapping(bytes32 => MatchResult) public results;

    event MatchCommitted(bytes32 indexed matchId, uint8 winner, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    function commitResult(
        bytes32 matchId,
        uint256[] calldata team1,
        uint256[] calldata team2,
        uint8 winner
    ) external onlyOwner {
        require(winner == 1 || winner == 2, "Winner must be 1 or 2");
        require(results[matchId].timestamp == 0, "Match already committed");

        results[matchId] = MatchResult({
            team1: team1,
            team2: team2,
            winner: winner,
            timestamp: block.timestamp
        });

        emit MatchCommitted(matchId, winner, block.timestamp);
    }

    function getResult(bytes32 matchId) external view returns (
        uint256[] memory team1,
        uint256[] memory team2,
        uint8 winner,
        uint256 timestamp
    ) {
        MatchResult memory r = results[matchId];
        return (r.team1, r.team2, r.winner, r.timestamp);
    }
}
