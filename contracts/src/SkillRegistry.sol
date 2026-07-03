// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SkillRegistry {
    struct Skill {
        address creator;
        string name;
        string description;
        uint256 price; // in wei
        uint256 invokeCount;
    }

    Skill[] public skills;

    event SkillPublished(uint256 indexed skillId, address indexed creator, string name, uint256 price);
    event SkillInvoked(uint256 indexed skillId, address indexed invoker, uint256 amountPaid);

    function publishSkill(string calldata name, string calldata description, uint256 price) external {
        skills.push(Skill({
            creator: msg.sender,
            name: name,
            description: description,
            price: price,
            invokeCount: 0
        }));

        emit SkillPublished(skills.length - 1, msg.sender, name, price);
    }

    function invokeSkill(uint256 skillId) external payable {
        require(skillId < skills.length, "Skill does not exist");
        Skill storage skill = skills[skillId];
        require(msg.value >= skill.price, "Insufficient payment");

        skill.invokeCount += 1;

        (bool sent, ) = payable(skill.creator).call{value: msg.value}("");
        require(sent, "Payment to creator failed");

        emit SkillInvoked(skillId, msg.sender, msg.value);
    }

    function getSkillCount() external view returns (uint256) {
        return skills.length;
    }

    function getSkill(uint256 skillId) external view returns (
        address creator,
        string memory name,
        string memory description,
        uint256 price,
        uint256 invokeCount
    ) {
        require(skillId < skills.length, "Skill does not exist");
        Skill storage skill = skills[skillId];
        return (skill.creator, skill.name, skill.description, skill.price, skill.invokeCount);
    }
}