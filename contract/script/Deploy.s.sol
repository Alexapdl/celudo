// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LudoEscrow.sol";

contract DeployLudoEscrow is Script {
    // Address that will be admin (your backend wallet)
    // address constant ADMIN = 0x000...;

    // Treasury wallet address
    // address constant TREASURY = 0x000...;

    // 5% = 500 bps
    uint256 constant TREASURY_FEE_BPS = 500;

    function run() external {
        address deployerAdmin = vm.envAddress("ADMIN_ADDRESS");
        address deployerTreasury = vm.envAddress("TREASURY_ADDRESS");

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        LudoEscrow escrow = new LudoEscrow(
            deployerAdmin,
            deployerTreasury,
            TREASURY_FEE_BPS
        );

        console.log("LudoEscrow deployed to:", address(escrow));
        console.log("Admin set to:", deployerAdmin);
        console.log("Treasury set to:", deployerTreasury);
        console.log("Fee BPS:", TREASURY_FEE_BPS, "(5%)");

        vm.stopBroadcast();
    }
}
