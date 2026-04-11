// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PetNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    struct PetStats {
        string name;
        string petType;
        string element;
        uint256 hp;
        uint256 attack;
        uint256 defense;
        uint256 specialPower;
    }

    mapping(uint256 => PetStats) public petStats;

    event PetMinted(uint256 indexed tokenId, address indexed owner, string name, string element);

    constructor() ERC721("HalfkiloPet", "HKPET") Ownable(msg.sender) {}

    function mint(address to, PetStats memory stats) external onlyOwner returns (uint256) {
        uint256 tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        petStats[tokenId] = stats;
        emit PetMinted(tokenId, to, stats.name, stats.element);
        return tokenId;
    }

    function getPetStats(uint256 tokenId) external view returns (
        string memory name,
        string memory petType,
        string memory element,
        uint256 hp,
        uint256 attack,
        uint256 defense,
        uint256 specialPower
    ) {
        require(ownerOf(tokenId) != address(0), "Pet does not exist");
        PetStats memory s = petStats[tokenId];
        return (s.name, s.petType, s.element, s.hp, s.attack, s.defense, s.specialPower);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
