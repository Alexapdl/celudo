// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract LudoEscrow {
    address public owner;
    address public admin;
    address public treasuryAddress;
    uint256 public treasuryFeeBps; // e.g. 500 = 5%

    struct Game {
        uint256 id;
        address token;
        uint256 betAmount;
        uint8 numPlayers;
        uint8 mode; // 0 = Solo 1v1 (2p), 1 = Duo 2v2 (4p), 2 = 4-Player FFA (4p)
        address[] players;
        uint256 totalEscrowed;
        bool isSettled;
        bool isCancelled;
        bool isInitialized;
    }

    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => bool)) public hasDeposited;

    event GameInitialized(
        uint256 indexed gameId,
        address indexed token,
        uint256 betAmount,
        uint8 numPlayers,
        uint8 mode
    );
    event BetDeposited(uint256 indexed gameId, address indexed player, uint256 amount);
    event GameSettled(uint256 indexed gameId, address[] winners, uint256 totalPayout, uint256 treasuryFee);
    event GameCancelled(uint256 indexed gameId, string reason);
    event ConfigUpdated(address indexed newAdmin, address indexed newTreasury, uint256 feeBps);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyAdminOrOwner() {
        require(msg.sender == admin || msg.sender == owner, "Only admin or owner");
        _;
    }

    constructor(address _admin, address _treasuryAddress, uint256 _treasuryFeeBps) {
        owner = msg.sender;
        admin = _admin;
        treasuryAddress = _treasuryAddress;
        treasuryFeeBps = _treasuryFeeBps;
    }

    function setOwner(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid owner");
        owner = _newOwner;
    }

    function setConfig(address _newAdmin, address _newTreasury, uint256 _feeBps) external onlyOwner {
        require(_newAdmin != address(0), "Invalid admin");
        require(_newTreasury != address(0), "Invalid treasury");
        require(_feeBps <= 2000, "Fee too high (max 20%)"); // safety limit
        admin = _newAdmin;
        treasuryAddress = _newTreasury;
        treasuryFeeBps = _feeBps;
        emit ConfigUpdated(_newAdmin, _newTreasury, _feeBps);
    }

    function initializeGame(
        uint256 gameId,
        address token,
        uint256 betAmount,
        uint8 numPlayers,
        uint8 mode
    ) external onlyAdminOrOwner {
        require(!games[gameId].isInitialized, "Game already initialized");
        require(token != address(0), "Invalid token address");
        require(numPlayers == 2 || numPlayers == 4, "Players must be 2 or 4");
        require(mode <= 2, "Invalid mode");

        games[gameId].id = gameId;
        games[gameId].token = token;
        games[gameId].betAmount = betAmount;
        games[gameId].numPlayers = numPlayers;
        games[gameId].mode = mode;
        games[gameId].isInitialized = true;

        emit GameInitialized(gameId, token, betAmount, numPlayers, mode);
    }

    function depositBet(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.isInitialized, "Game not initialized");
        require(!game.isSettled && !game.isCancelled, "Game inactive");
        require(!hasDeposited[gameId][msg.sender], "Already deposited");
        require(game.players.length < game.numPlayers, "Lobby full");

        // Transfer tokens into escrow
        IERC20 token = IERC20(game.token);
        require(
            token.transferFrom(msg.sender, address(this), game.betAmount),
            "Transfer failed"
        );

        game.players.push(msg.sender);
        game.totalEscrowed += game.betAmount;
        hasDeposited[gameId][msg.sender] = true;

        emit BetDeposited(gameId, msg.sender, game.betAmount);
    }

    // Admin can deposit on behalf of bots/sponsors (paying from admin wallet)
    function depositBetFor(uint256 gameId, address player) external onlyAdminOrOwner {
        Game storage game = games[gameId];
        require(game.isInitialized, "Game not initialized");
        require(!game.isSettled && !game.isCancelled, "Game inactive");
        require(!hasDeposited[gameId][player], "Already deposited");
        require(game.players.length < game.numPlayers, "Lobby full");

        // Transfer tokens from admin/caller into escrow
        IERC20 token = IERC20(game.token);
        require(
            token.transferFrom(msg.sender, address(this), game.betAmount),
            "Transfer failed"
        );

        game.players.push(player);
        game.totalEscrowed += game.betAmount;
        hasDeposited[gameId][player] = true;

        emit BetDeposited(gameId, player, game.betAmount);
    }

    function settleGame(uint256 gameId, address[] calldata winners) external onlyAdmin {
        Game storage game = games[gameId];
        require(game.isInitialized, "Game not initialized");
        require(!game.isSettled, "Already settled");
        require(!game.isCancelled, "Cancelled");
        require(winners.length > 0, "No winners specified");

        game.isSettled = true;

        uint256 total = game.totalEscrowed;
        uint256 fee = (total * treasuryFeeBps) / 10000;
        uint256 netReward = total - fee;

        IERC20 token = IERC20(game.token);

        // Send fee to treasury
        if (fee > 0) {
            require(token.transfer(treasuryAddress, fee), "Fee transfer failed");
        }

        // Distribute net reward to winners equally
        uint256 rewardPerWinner = netReward / winners.length;
        for (uint256 i = 0; i < winners.length; i++) {
            require(token.transfer(winners[i], rewardPerWinner), "Reward transfer failed");
        }

        emit GameSettled(gameId, winners, netReward, fee);
    }

    function cancelGame(uint256 gameId) external onlyAdminOrOwner {
        Game storage game = games[gameId];
        require(game.isInitialized, "Game not initialized");
        require(!game.isSettled, "Already settled");
        require(!game.isCancelled, "Already cancelled");

        game.isCancelled = true;

        IERC20 token = IERC20(game.token);
        uint256 len = game.players.length;

        // Refund all deposited players
        for (uint256 i = 0; i < len; i++) {
            address player = game.players[i];
            if (hasDeposited[gameId][player]) {
                hasDeposited[gameId][player] = false;
                require(token.transfer(player, game.betAmount), "Refund failed");
            }
        }

        emit GameCancelled(gameId, "Game cancelled by admin/owner");
    }

    // View players in a game
    function getGamePlayers(uint256 gameId) external view returns (address[] memory) {
        return games[gameId].players;
    }
}
