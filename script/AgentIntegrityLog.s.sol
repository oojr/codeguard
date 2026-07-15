// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentIntegrityLog} from "../src/AgentIntegrityLog.sol";

contract DeployIntegrityLog is Script {
    function run() external returns (AgentIntegrityLog) {
        // Fallback to Anvil default private key #0 if no env variable is set
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY", 
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        
        vm.startBroadcast(deployerPrivateKey);
        AgentIntegrityLog integrityLog = new AgentIntegrityLog();
        vm.stopBroadcast();

        console2.log("AgentIntegrityLog deployed to:", address(integrityLog));
        return integrityLog;
    }
}