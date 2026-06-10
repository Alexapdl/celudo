# Celudo — Architecture Reference

## System Overview

```mermaid
graph TB
  subgraph Browser["Browser (Next.js 16)"]
    P["page.tsx<br/>Root Controller"]
    US["useUserState<br/>Wallet · Profile · Staking"]
    GC["useGameController<br/>Game Lifecycle"]
    LG["LudoGame<br/>Canvas 60fps Engine"]
    UI["GameScreen · DiceAnimation<br/>VictoryModal"]
    SM["soundManager<br/>Web Audio API"]
    SS["StakingScreen<br/>Coming Soon"]
  end

  subgraph API["Next.js API Routes"]
    G1["POST /api/game<br/>Create game + on-chain init"]
    G2["POST /api/game/join<br/>Join lobby"]
    G3["POST /api/game/settle<br/>Award points + settle on-chain"]
    U1["GET/POST /api/user<br/>Profile CRUD"]
  end

  subgraph Chain["Celo Blockchain"]
    ESC["LudoEscrow.sol"]
    CUSD["cUSD (ERC20)"]
  end

  subgraph DB["Supabase PostgreSQL"]
    UT["users"]
    GT["games"]
    HT["game_history"]
  end

  P --> US
  P --> GC
  GC --> LG
  LG --> UI
  P --> SM
  US --> SS
  US --> U1
  GC --> G1
  GC --> G2
  GC --> G3
  G1 --> ESC
  G3 --> ESC
  ESC --> CUSD
  U1 --> UT
  G1 --> GT
  G2 --> GT
  G3 --> HT
```

---

## Game Engine

```mermaid
classDiagram
  class LudoGame {
    +Player[] pl
    +number cur
    +number dice
    +boolean over
    +AnimState an
    +roll() void
    +onClick(x, y) void
    +doAI() void
    +endTurn() void
    -drawBoard() void
    -drawTokens() void
    -startAnim() void
    -applyMove() void
  }

  class Player {
    +number index
    +number[] tokens
    +boolean isAI
    +string color
  }

  class GameCallbacks {
    <<interface>>
    +onUpdateUI(players, curIndex)
    +onDiceRollStart()
    +onDiceRollEnd(value)
    +onRollButtonState(text, disabled)
    +onLog(message)
    +onTimerUpdate(text)
    +onGameOver(winnerIndex, isHuman)
  }

  LudoGame --> Player : pl
  LudoGame --> GameCallbacks : callbacks
```

### Token Position Encoding

| Range | Meaning |
|-------|---------|
| `-1` | Home base (off track) |
| `0` | Just entered track (at start cell) |
| `1–50` | Main track |
| `51` | Last track cell (home entry) |
| `52–56` | Home stretch (5 cells) |
| `57` | Finished (center) |

### Safe Cells

Absolute track positions `[0, 8, 13, 21, 26, 34, 39, 47]` — no captures allowed.

### Win Condition

First player to move all 4 tokens to position `57` (center) wins the game.

### Capture Rule

When a token lands on a cell occupied by an opponent (and that cell is not a safe cell), the opponent token returns to home base (`pos = -1`). The capturing player receives a bonus roll.

---

## Turn Flow

```mermaid
sequenceDiagram
  participant H as Human Player
  participant E as LudoGame Engine
  participant AI as AI Players

  H->>E: tap Roll Dice
  E->>E: roll() → dice animation
  E-->>H: onDiceRollEnd(value)

  alt Movable tokens exist
    E-->>H: highlight movable tokens
    H->>E: click token (onClick)
    E->>E: startAnim → applyMove
    alt Rolled 6 or captured
      E-->>H: onRollButtonState("Roll Again", false)
    else Normal turn
      E->>AI: doAI() (400–600ms delay)
      AI->>E: auto-roll + heuristic move
      E->>E: endTurn() → advance cur
    end
  else No movable tokens
    E->>E: endTurn() → advance cur
  end

  alt Game over
    E-->>H: onGameOver(winnerIndex, isHuman)
  end
```

---

## State Management

```mermaid
graph LR
  LG["LudoGame<br/>(canvas, game loop)"] -->|callbacks| GC["useGameController"]
  GC -->|setters| PS["page.tsx<br/>(React state)"]
  PS -->|props| GS["GameScreen"]
  PS -->|props| DA["DiceAnimation"]
  PS -->|props| VM["VictoryModal"]

  UW["useUserState"] --> PS
  UW -->|fetch| API["/api/user"]
  UW -->|wagmi| WC["Wallet Connection"]
```

- **`useGameController`** — Instantiates `LudoGame` when `currentView === "game"`, bridges game callbacks to React state. Handles game-over scoring and API calls.
- **`useUserState`** — Manages wallet connection (Wagmi), user profile (Supabase), staking balance, points, tier calculation. Provides `effectiveAddress` for both real wallets and demo mode.

---

## Cash Bet Flow

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant API as /api/game
  participant ESC as LudoEscrow.sol
  participant CUSD as cUSD Token

  U->>FE: Set bet amount & mode
  FE->>API: POST /api/game {mode, bet_amount}
  API->>ESC: initializeGame(gameId, token, bet, numPlayers, mode)
  ESC-->>API: GameInitialized event
  API-->>FE: {game, on_chain_game_id}

  U->>FE: Approve cUSD spending
  FE->>CUSD: approve(escrow, betAmount)
  U->>FE: Deposit bet
  FE->>ESC: depositBet(gameId)
  ESC->>CUSD: transferFrom(user, escrow, betAmount)
  ESC-->>FE: BetDeposited event

  Note over FE: Game plays normally...

  FE->>API: POST /api/game/settle {gameId, winners}
  API->>ESC: settleGame(gameId, winners[])
  ESC->>CUSD: transfer(treasury, fee)
  ESC->>CUSD: transfer(winners, netReward)
  ESC-->>API: GameSettled event
```

---

## Database Schema

```mermaid
erDiagram
  users {
    TEXT wallet_address PK
    TEXT username
    INTEGER points
    INTEGER games_played
    INTEGER wins
    NUMERIC staked_balance
    NUMERIC earned_yield
    TIMESTAMPTZ created_at
  }

  games {
    UUID id PK
    BIGSERIAL on_chain_game_id UK
    TEXT mode
    NUMERIC bet_amount
    TEXT token_address
    TEXTARRAY players
    TEXTARRAY winners
    TEXT status
    TIMESTAMPTZ created_at
  }

  game_history {
    UUID id PK
    TEXT user_wallet FK
    UUID game_id FK
    TEXT mode
    INTEGER points_earned
    BOOLEAN won
    TIMESTAMPTZ created_at
  }

  users ||--o{ game_history : "plays"
  games ||--o{ game_history : "has"
```

### Mobile Status Values

| Status | Meaning |
|--------|---------|
| `waiting` | Lobby open, waiting for players |
| `active` | Game in progress |
| `settled` | Game finished, prizes distributed |
| `cancelled` | Game cancelled, refunds issued |

### Game Modes

| Mode | Players | Base Points | Win Bonus |
|------|---------|-------------|-----------|
| `free` | 2–4 | 10 | +25 |
| `solo` | 2 | 5 | +10 |
| `duo` | 4 (2v2) | 8 | +15 |
| `4player` | 4 | 10 | +25 |
| `tournament` | 4+ | 20 | +100 |

---

## Smart Contract: LudoEscrow.sol

```mermaid
graph LR
  O["Owner"] -->|setConfig, setOwner| ESC["LudoEscrow"]
  A["Admin"] -->|initializeGame, settleGame, cancelGame| ESC
  P["Player"] -->|depositBet| ESC
  ESC -->|fee 5%| T["Treasury"]
  ESC -->|net reward| W["Winners[]"]
```

### Key Functions

| Function | Caller | Purpose |
|----------|--------|---------|
| `initializeGame(gameId, token, bet, numPlayers, mode)` | Admin/Owner | Register game on-chain |
| `depositBet(gameId)` | Player wallet | Transfer bet into escrow |
| `depositBetFor(gameId, player)` | Admin/Owner | Deposit on behalf of bot/sponsor |
| `settleGame(gameId, winners[])` | Admin | Distribute pot minus 5% fee |
| `cancelGame(gameId)` | Admin/Owner | Refund all deposited players |
| `setConfig(admin, treasury, feeBps)` | Owner | Change admin/fee settings |

### Fee Structure

Default treasury fee: **5%** (500 bps). Max cap: **20%** (2000 bps). Remainder split equally among `winners[]`.

---

## Board Layout (15x15 Grid)

```
Col:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14
Row 0:[R][R][R][R][R][R][  ][  ][  ][B][B][B][B][B][B]
Row 1:[R][R][R][R][R][R][  ][B↓][  ][B][B][B][B][B][B]
Row 2:[R][R][●][●][R][R][  ][B↓][  ][B][B][●][●][B][B]
Row 3:[R][R][●][●][R][R][  ][B↓][  ][B][B][●][●][B][B]
Row 4:[R][R][R][R][R][R][  ][B↓][  ][B][B][B][B][B][B]
Row 5:[R][R][R][R][R][R][  ][B↓][  ][B][B][B][B][B][B]
Row 6:[  ][R→][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][Y←][  ]
Row 7:[  ][R→][R→][R→][R→][R→][R→][★][Y←][Y←][Y←][Y←][Y←][Y←][  ]
Row 8:[  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ]
Row 9:[G][G][G][G][G][G][  ][G↑][  ][Y][Y][Y][Y][Y][Y]
Row10:[G][G][●][●][G][G][  ][G↑][  ][Y][Y][●][●][Y][Y]
Row11:[G][G][●][●][G][G][  ][G↑][  ][Y][Y][●][●][Y][Y]
Row12:[G][G][G][G][G][G][  ][G↑][  ][Y][Y][Y][Y][Y][Y]
Row13:[G][G][G][G][G][G][  ][G↑][  ][Y][Y][Y][Y][Y][Y]
Row14:[G][G][G][G][G][G][  ][  ][  ][Y][Y][Y][Y][Y][Y]

Legend:
  G = Green home (bottom-left)    R = Red home (top-left)
  B = Blue home (top-right)       Y = Yellow home (bottom-right)
  ● = Token home-base circle slots
  ★ = Center (win)
  → ← ↑ ↓ = Home stretch corridors
  [ ] = Main track cell
```

### Color Assignment

| Player | Color | Home Area | Start Cell | Home Entry |
|--------|-------|-----------|------------|------------|
| 0 | Green | Bottom-left | `[6,13]` | `TK[51]=[8,12]` → `[7,12]` |
| 1 | Red | Top-left | `[0,6]` | `TK[12]=[0,7]` → `[1,7]` |
| 2 | Blue | Top-right | `[7,0]` | `TK[25]=[6,0]` → `[7,1]` |
| 3 | Yellow | Bottom-right | `[14,6]` | `TK[38]=[13,6]` → `[13,7]` |

---

## DeFi Yield — COMING SOON

The staking/yield feature currently displays a **Coming Soon** overlay. The real DeFi integration is planned as:

```mermaid
graph TB
  subgraph Future["Planned DeFi Yield (Coming Soon)"]
    SU["User Stake cUSD"] --> SC["StakingPool.sol<br/>(future contract)"]
    SC -->|"deposit cUSD"| YP["Yield Protocol<br/>(Mento, Aave, etc.)"]
    YP -->|"yield + principal"| SC
    SC -->|"APY + boost"| SU
  end

  subgraph Current["Current Implementation"]
    SU2["StakingScreen UI<br/>(Coming Soon overlay)"]
    DB2["Supabase: staked_balance<br/>(simulated)"]
    SU2 --> DB2
  end
```

**Current state**: StakingScreen shows APY breakdown and tier boosts, but all values are simulated. `handleStake()` updates React state and syncs to Supabase — no on-chain interaction.

**Planned state**: A `StakingPool.sol` contract that accepts cUSD deposits, routes them to a Celo yield protocol, and distributes real yield to stakers with tier-based APY boosts.

---

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/game` | Create game lobby (+ on-chain init for cash bets) |
| `GET` | `/api/game` | List open games |
| `POST` | `/api/game/join` | Player joins a lobby |
| `POST` | `/api/game/settle` | End game: award points, settle on-chain |
| `GET` | `/api/user?wallet=` | Fetch or upsert user profile |
| `POST` | `/api/user` | Update user stats |

---

## Sound System

Implemented in `src/lib/sound.ts` using the **Web Audio API** (no audio files). All sounds are synthesized:

- **BGM**: A minor pentatonic melody loop + bass drone
- **Token move**: Ascending tone (E4→B4)
- **Capture**: Harsh sawtooth chord
- **Win fanfare**: Rising arpeggio

Controlled by `soundManager.toggle()` and `soundManager.toggleBGM()`.

---

## Deployment

### Dual Network Configuration

The app supports both Alfajores testnet and Celo mainnet via the `NEXT_PUBLIC_NETWORK` environment variable:

| Variable | Alfajores (Testnet) | Celo (Mainnet) |
|----------|-------------------|---------------|
| `NEXT_PUBLIC_NETWORK` | `testnet` | `mainnet` |
| `NEXT_PUBLIC_CELO_RPC_URL` | `https://alfajores-forno.celo-testnet.org` | `https://forno.celo.org` |
| `NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS` | Deployed testnet address | Deployed mainnet address |
| `NEXT_PUBLIC_USDM_ADDRESS` | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |

The Wagmi config in `src/lib/wagmi.ts` includes both chains and switches based on the active network.

### Contract Deployment

```bash
# Deploy to Alfajores testnet
cd contract
forge script script/Deploy.s.sol --rpc-url https://alfajores-forno.celo-testnet.org --broadcast

# Deploy to Celo mainnet
forge script script/Deploy.s.sol --rpc-url https://forno.celo.org --broadcast
```

After deployment, update `.env.local` with the deployed contract address.