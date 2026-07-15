// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentIntegrityLog {
    address public owner;
    mapping(address => bool) public authorizedAgents;

    struct Checkpoint {
        bytes32 contentHash;
        bytes32 prevHash;
        uint64 timestamp;
        address agent;
    }

    mapping(bytes32 => bytes32) public latestHash;   // fileId => most recent contentHash
    mapping(bytes32 => uint256) public checkpointCount;

    event Checkpointed(
        bytes32 indexed fileId,
        bytes32 contentHash,
        bytes32 prevHash,
        uint64 timestamp,
        address indexed agent,
        uint256 index
    );

    event AgentAuthorizationChanged(address indexed agent, bool authorized);

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedAgents[msg.sender], "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedAgents[msg.sender] = true;
    }

    function setAgentAuthorization(address agent, bool authorized) external {
        require(msg.sender == owner, "Only owner can set authorization");
        authorizedAgents[agent] = authorized;
        emit AgentAuthorizationChanged(agent, authorized);
    }

    function commit(bytes32 fileId, bytes32 contentHash) external onlyAuthorized {
        bytes32 prevHash = latestHash[fileId];
        latestHash[fileId] = contentHash;
        checkpointCount[fileId] += 1;

        emit Checkpointed(
            fileId,
            contentHash,
            prevHash,
            uint64(block.timestamp),
            msg.sender,
            checkpointCount[fileId] - 1
        );
    }

    function verify(bytes32 fileId, bytes32 currentContentHash) external view returns (bool) {
        return latestHash[fileId] == currentContentHash;
    }
}