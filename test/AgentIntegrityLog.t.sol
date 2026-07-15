// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {AgentIntegrityLog} from "../src/AgentIntegrityLog.sol";

contract AgentIntegrityLogTest is Test {
    AgentIntegrityLog public integrityLog;
    address public owner = address(1);
    address public hacker = address(2);
    address public authorizedAgent = address(3);

    bytes32 public fileId = keccak256("package-lock.json");
    bytes32 public originalHash = keccak256("healthy package JSON contents");
    bytes32 public updatedHash = keccak256("malicious payload injected");

    function setUp() public {
        vm.prank(owner);
        integrityLog = new AgentIntegrityLog();
    }

    function test_OwnerCanCommit() public {
        vm.prank(owner);
        integrityLog.commit(fileId, originalHash);
        assertEq(integrityLog.latestHash(fileId), originalHash);
    }

    function test_AuthorizedAgentCanCommit() public {
        vm.prank(owner);
        integrityLog.setAgentAuthorization(authorizedAgent, true);

        vm.prank(authorizedAgent);
        integrityLog.commit(fileId, originalHash);
        assertEq(integrityLog.latestHash(fileId), originalHash);
    }

    function test_Revert_NonAuthorizedCannotCommit() public {
        vm.prank(hacker);
        vm.expectRevert("Not authorized");
        integrityLog.commit(fileId, updatedHash);
    }

    function test_Verification() public {
        vm.prank(owner);
        integrityLog.commit(fileId, originalHash);

        assertTrue(integrityLog.verify(fileId, originalHash));
        assertFalse(integrityLog.verify(fileId, updatedHash));
    }
}