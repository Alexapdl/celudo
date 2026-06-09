# Celudo — Architecture Reference

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Next.js)                    │
│                                                          │
│  page.tsx ──────────────────────────────────────────    │
│    ├── useUserState      (wallet, profile, staking)      │
│    ├── useGameController (game lifecycle, UI state)      │
│    └── useToast          (notifications)                 │
│                                                          │
│  Game View                                               │
│    ├── <canvas>  ← LudoGame (60fps engine)               │
│    ├── GameScreen.tsx   (UI wrapper)                     │
│    └── DiceAnimation.tsx                                 │
└───────────────────┬─────────────────────────────────────┘
                    │ fetch / wagmi hooks
         ┌──────────┴──────────────────┐
         │                             │
   ┌─────▼──────┐              ┌───────▼──────┐
   │ Next.js    │              │  Celo Chain  │
   │ API Routes │              │  (forno RPC) │
   │            │              │              │
   │ /api/game  │              │ LudoEscrow   │
   │ /api/user  │              │ .sol         │
   └─────┬──────┘              └──────────────┘
         │
   ┌─────▼──────┐
   │  Supabase  │
   │ PostgreSQL │
   │            │
   │ users      │
   │ games      │
   │ game_hist  │
   └────────────┘
```

---

## Game Engine Architecture

### Class: `LudoGame` (`src/app/ludoEngine.ts`)

The game engine is a self-contained canvas renderer. React never reads game state directly — it receives updates exclusively through callbacks.

```
LudoGame
  │
  ├── State
  │     ├── pl: Player[]          4 players, each with tokens[4]
  │     ├── cur: number           current player index
  │     ├── dice: number          last dice value
  │     ├── over: boolean
  │     └── an: AnimState         current animation
  │
  ├── Coordinate System (15×15 grid)
  │     ├── TK[52]                main track cells [col,row]
  │     ├── HS[4][6]              home stretch per player
  │     ├── HB[4][4]              home base slots per player
  │     ├── SP[4]                 start positions (relative)
  │     ├── HE[4]                 home entry positions (relative=51)
  │     └── SAFE[8]               capture-immune cells
  │
  ├── Rendering (60fps loop)
  │     ├── drawBoard()           programmatic board (no image)
  │     └── drawTokens()          4 tokens per player + glow/selection
  │
  ├── Turn Flow
  │     ├── roll()                human roll
  │     ├── onClick()             human token selection
  │     ├── doAI()                AI roll + move
  │     └── endTurn()             advance cur, trigger AI
  │
  └── Callbacks → React
        ├── onUpdateUI(players, curIndex)
        ├── onDiceRollStart/End(value)
        ├── onRollButtonState(text, disabled)
        ├── onLog(message)
        ├── onTimerUpdate(text)
        └── onGameOver(winnerIndex, isHuman)
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

### Win Condition

A player wins when **all 4 tokens** reach position `57`. The first player to do this ends the game.

### Capture Rule

When a token lands on a cell occupied by an opponent (and that cell is not in `SAFE[]`), the opponent token is sent back to home base (`pos = -1`). The capturing player gets a bonus roll.

### Safe Cells

Absolute track positions `[0, 8, 13, 21, 26, 34, 39, 47]` are safe (player start cells + star cells). No captures on safe cells.

---

## State Management

```
LudoGame (canvas, game loop)
    │  callbacks
    ▼
useGameController.ts
    │  setters
    ▼
page.tsx (React state)
    │  props
    ▼
GameScreen.tsx + DiceAnimation.tsx
```

### useGameController

Instantiates `LudoGame` when `currentView === "game"` and bridges game callbacks to React state. Handles game-over scoring and API calls.

### useUserState

Manages wallet connection (Wagmi), user profile (Supabase), staking balance, points, tier calculation. Provides `effectiveAddress` that works for both connected wallets and demo mode.

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

## Database Schema

```sql
-- User profiles
CREATE TABLE users (
  wallet_address  TEXT PRIMARY KEY,
  points          INTEGER DEFAULT 0,
  staked_balance  NUMERIC DEFAULT 0,
  earned_yield    NUMERIC DEFAULT 0,
  games_played    INTEGER DEFAULT 0,
  wins            INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Game lobbies
CREATE TABLE games (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode             TEXT,          -- free | tournament | solo | duo | 4player
  bet_amount       NUMERIC,
  players          TEXT[],        -- wallet addresses
  status           TEXT,          -- waiting | active | settled | cancelled
  on_chain_game_id INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Per-player game results
CREATE TABLE game_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id        UUID REFERENCES games(id),
  wallet_address TEXT,
  won            BOOLEAN,
  points_earned  INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Smart Contract: `LudoEscrow.sol`

Located in `contract/src/LudoEscrow.sol`. Deployed on Celo mainnet.

### Key Functions

| Function | Called By | Purpose |
|----------|-----------|---------|
| `initializeGame(gameId, token, bet, numPlayers, mode)` | Backend (admin) | Register game on-chain |
| `depositBet(gameId)` | Player wallet | Transfer bet into escrow |
| `settleGame(gameId, winners[])` | Backend (admin) | Distribute pot minus fee |
| `cancelGame(gameId)` | Backend/Owner | Refund all players |
| `setConfig(admin, treasury, feeBps)` | Owner | Change admin/fee settings |

### Fee Structure

Default treasury fee: **5%** (500 bps). Remainder split equally among `winners[]`.

---

## Board Layout (15×15 Grid)

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

## Sound System

Implemented in `src/lib/sound.ts` using the **Web Audio API** (no audio files). All sounds are synthesized:

- **BGM**: A minor pentatonic melody loop + bass drone
- **Token move**: Ascending tone (E4→B4)
- **Capture**: Harsh sawtooth chord
- **Win fanfare**: Rising arpeggio

Controlled by `soundManager.toggle()` and `soundManager.toggleBGM()`.
