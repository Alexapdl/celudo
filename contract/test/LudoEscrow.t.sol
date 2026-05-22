// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/LudoEscrow.sol";

contract MockERC20 is IERC20 {
    string public name = "Mock Mento USD";
    string public symbol = "mUSD";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(uint256 initialSupply) {
        mint(msg.sender, initialSupply);
    }

    function mint(address account, uint256 amount) public {
        balanceOf[account] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract LudoEscrowTest is Test {
    LudoEscrow public escrow;
    MockERC20 public token;

    address public owner = address(0x9);
    address public admin = address(0x1);
    address public treasury = address(0x2);
    address public player1 = address(0x3);
    address public player2 = address(0x4);
    address public player3 = address(0x5);
    address public player4 = address(0x6);

    uint256 public feeBps = 500; // 5%

    function setUp() public {
        vm.prank(owner);
        escrow = new LudoEscrow(admin, treasury, feeBps);
        token = new MockERC20(1_000_000 * 1e18);

        // Distribute tokens to players
        token.transfer(player1, 100 * 1e18);
        token.transfer(player2, 100 * 1e18);
        token.transfer(player3, 100 * 1e18);
        token.transfer(player4, 100 * 1e18);
        token.transfer(admin, 100 * 1e18); // For bot funding

        // Approve escrow for players
        vm.prank(player1);
        token.approve(address(escrow), type(uint256).max);
        vm.prank(player2);
        token.approve(address(escrow), type(uint256).max);
        vm.prank(player3);
        token.approve(address(escrow), type(uint256).max);
        vm.prank(player4);
        token.approve(address(escrow), type(uint256).max);
        vm.prank(admin);
        token.approve(address(escrow), type(uint256).max);
    }

    function testInitializeGame() public {
        vm.prank(admin);
        escrow.initializeGame(101, address(token), 10 * 1e18, 2, 0);

        (
            uint256 id,
            address tkn,
            uint256 bet,
            uint8 numP,
            uint8 mode,
            uint256 totalE,
            bool isS,
            bool isC,
            bool isI
        ) = escrow.games(101);

        assertEq(id, 101);
        assertEq(tkn, address(token));
        assertEq(bet, 10 * 1e18);
        assertEq(numP, 2);
        assertEq(mode, 0);
        assertEq(totalE, 0);
        assertFalse(isS);
        assertFalse(isC);
        assertTrue(isI);
    }

    function testDepositBet() public {
        vm.prank(admin);
        escrow.initializeGame(102, address(token), 5 * 1e18, 2, 0);

        vm.prank(player1);
        escrow.depositBet(102);

        vm.prank(player2);
        escrow.depositBet(102);

        (,,,,, uint256 totalE,,,) = escrow.games(102);
        assertEq(totalE, 10 * 1e18);
        assertEq(token.balanceOf(address(escrow)), 10 * 1e18);
        assertEq(token.balanceOf(player1), 95 * 1e18);
        assertEq(token.balanceOf(player2), 95 * 1e18);

        address[] memory players = escrow.getGamePlayers(102);
        assertEq(players.length, 2);
        assertEq(players[0], player1);
        assertEq(players[1], player2);
    }

    function testSettleSolo() public {
        // Solo/1v1: Player 1 vs Player 2
        vm.prank(admin);
        escrow.initializeGame(201, address(token), 10 * 1e18, 2, 0);

        vm.prank(player1);
        escrow.depositBet(201);
        vm.prank(player2);
        escrow.depositBet(201);

        uint256 initialTreasury = token.balanceOf(treasury);
        uint256 initialPlayer1 = token.balanceOf(player1);

        address[] memory winners = new address[](1);
        winners[0] = player1;

        vm.prank(admin);
        escrow.settleGame(201, winners);

        // 20 token total escrowed. 5% fee = 1 token. Net reward = 19 tokens.
        assertEq(token.balanceOf(treasury) - initialTreasury, 1 * 1e18);
        assertEq(token.balanceOf(player1) - initialPlayer1, 19 * 1e18);

        (,,,,,, bool isS,,) = escrow.games(201);
        assertTrue(isS);
    }

    function testSettleDuo() public {
        // Duo/2v2: Player 1 & 2 vs Player 3 & 4
        vm.prank(admin);
        escrow.initializeGame(202, address(token), 10 * 1e18, 4, 1);

        vm.prank(player1);
        escrow.depositBet(202);
        vm.prank(player2);
        escrow.depositBet(202);
        vm.prank(player3);
        escrow.depositBet(202);
        vm.prank(player4);
        escrow.depositBet(202);

        uint256 initialTreasury = token.balanceOf(treasury);
        uint256 initialPlayer1 = token.balanceOf(player1);
        uint256 initialPlayer2 = token.balanceOf(player2);

        // Winners are Player 1 and Player 2 (teammates)
        address[] memory winners = new address[](2);
        winners[0] = player1;
        winners[1] = player2;

        vm.prank(admin);
        escrow.settleGame(202, winners);

        // 40 token total escrowed. 5% fee = 2 token. Net reward = 38 tokens.
        // Winner 1 gets 19, Winner 2 gets 19.
        assertEq(token.balanceOf(treasury) - initialTreasury, 2 * 1e18);
        assertEq(token.balanceOf(player1) - initialPlayer1, 19 * 1e18);
        assertEq(token.balanceOf(player2) - initialPlayer2, 19 * 1e18);
    }

    function testDepositForBots() public {
        // Player 1 vs AI Bot (Funded by admin)
        vm.prank(admin);
        escrow.initializeGame(301, address(token), 10 * 1e18, 2, 0);

        vm.prank(player1);
        escrow.depositBet(301);

        address bot = address(0x88);
        vm.prank(admin);
        escrow.depositBetFor(301, bot);

        (,,,,, uint256 totalE,,,) = escrow.games(301);
        assertEq(totalE, 20 * 1e18);

        uint256 initialBot = token.balanceOf(bot);
        uint256 initialTreasury = token.balanceOf(treasury);

        // Let's say Player 1 wins
        address[] memory winners = new address[](1);
        winners[0] = player1;

        vm.prank(admin);
        escrow.settleGame(301, winners);

        // Player 1 gets 19 tokens (since they started with 90, got 19, should end with 109)
        assertEq(token.balanceOf(player1), 109 * 1e18);
        assertEq(token.balanceOf(treasury) - initialTreasury, 1 * 1e18);
    }

    function testCancelAndRefund() public {
        vm.prank(admin);
        escrow.initializeGame(401, address(token), 10 * 1e18, 2, 0);

        vm.prank(player1);
        escrow.depositBet(401);

        uint256 initialPlayer1 = token.balanceOf(player1);

        vm.prank(admin);
        escrow.cancelGame(401);

        assertEq(token.balanceOf(player1) - initialPlayer1, 10 * 1e18);
        assertEq(token.balanceOf(player1), 100 * 1e18);

        (,,,,,,,bool isC,) = escrow.games(401);
        assertTrue(isC);
    }
}
