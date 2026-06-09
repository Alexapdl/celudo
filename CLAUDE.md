# Celudo — Claude Code Guide

## Project Overview

Celudo is a play-to-earn Ludo game on the **Celo** blockchain. Players stake cUSD to earn yield, play Ludo against AI or other players, and accumulate tournament points that boost their staking APY. Games can be free, tournament, or cash-bet (on-chain escrow).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Animation | Framer Motion 12 |
| Web3 | Wagmi 3 + Viem 2 + Ethers.js 6 |
| Database | Supabase (PostgreSQL) |
| Blockchain | Celo (forno.celo.org) |
| Smart Contracts | Foundry (Solidity) |
| Audio | Web Audio API (no sample files) |

## Dev Commands

```bash
npm run dev      # Start Next.js dev server (http://localhost:3000)
npm run build    # Production build + type check
npm run lint     # ESLint
```

### Smart Contracts (requires Foundry)
```bash
cd contract
forge build      # Compile contracts
forge test       # Run tests
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast   # Deploy
```

## Key Directories

```
src/
├── app/
│   ├── ludoEngine.ts          # Core Ludo game logic + canvas rendering
│   ├── page.tsx               # Root app controller, view routing
│   └── api/                   # Next.js API routes
│       ├── game/route.ts      # Create game
│       ├── game/join/         # Join game lobby
│       ├── game/settle/       # Settle game, award points
│       └── user/route.ts      # User profile CRUD
├── components/
│   ├── game/                  # GameScreen, DiceAnimation, VictoryModal
│   ├── home/                  # HomeScreen
│   ├── lobby/                 # LobbyScreen (room selection, cash bets)
│   ├── profile/               # ProfileScreen
│   ├── staking/               # StakingScreen
│   └── ui/                    # Header, BottomNav, shared components
├── hooks/
│   ├── useGameController.ts   # Game lifecycle, state sync to UI
│   └── useUserState.ts        # Wallet, points, tiers, staking
└── lib/
    ├── sound.ts               # Web Audio BGM + SFX (synthesized)
    ├── wagmi.ts               # Wagmi config (Celo chain, connectors)
    └── supabase.ts            # Supabase client

contract/
├── src/LudoEscrow.sol         # Escrow contract for cash-bet games
└── test/LudoEscrow.t.sol
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0x...   # Deployed LudoEscrow address
NEXT_PUBLIC_USDM_ADDRESS=0x765DE...         # cUSD token on Celo
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...               # Server-side only
ADMIN_PRIVATE_KEY=...                       # Backend wallet for escrow calls
```

## Game Architecture

The game engine lives entirely in `ludoEngine.ts` as a single `LudoGame` class that owns a `<canvas>` element and renders at 60fps. It communicates back to React via a `GameCallbacks` object (no direct state coupling).

### Data Model
- Each `Player` has `tokens: number[]` — 4 token positions:
  - `-1` = home base
  - `0–51` = main track (relative to player's start)
  - `52–56` = home stretch
  - `57` = finished (center)
- Win condition: all 4 tokens at position `57`

### Track Layout (15×15 grid)
- 52-cell main track (`TK[]`) — counterclockwise from Green's start `[6,13]`
- 4 home stretches (`HS[]`) — each 5 cells leading to center `[7,7]`
- Start positions: `SP = [0, 13, 26, 39]` (one per quadrant)
- Safe cells (no captures): `SAFE = [0, 8, 13, 21, 26, 34, 39, 47]`

### Turn Flow
1. Human taps **Roll Dice** → `LudoGame.roll()` → dice animation → `onDiceRollEnd`
2. If movable tokens exist → highlight them, wait for canvas click
3. Human clicks a token → `onClick` → `startAnim` → `applyMove`
4. Roll 6 or capture → extra turn (button re-enabled)
5. AI players: auto-roll with 400–600ms delay, pick token by heuristic

## Database Schema

```sql
users         (wallet_address PK, points, staked_balance, earned_yield, games_played, wins)
games         (id UUID PK, mode, bet_amount, players[], status, on_chain_game_id)
game_history  (id, game_id, wallet_address, won, points_earned, created_at)
```

## Points System

| Mode | Base | Win Bonus |
|------|------|-----------|
| Free | 10 | +25 |
| Tournament | 20 | +100 |
| 2-Player | 5 | +10 |
| 3-Player | 8 | +15 |
| 4-Player | 10 | +25 |

## Tier System (APY Boost)

| Tier | Min Points | Boost |
|------|-----------|-------|
| Bronze | 100 | +0.5% |
| Silver | 500 | +1.0% |
| Gold | 2,000 | +2.0% |
| Diamond | 10,000 | +3.0% |
| Legend | 50,000 | +5.0% |

## Cash Bet Flow

1. User sets bet amount & mode in LobbyScreen
2. `POST /api/game` → creates DB record + calls escrow `initializeGame`
3. User approves ERC20 + calls escrow `depositBet` via MetaMask/MiniPay
4. Game plays as normal
5. On game over → `POST /api/game/settle` → backend calls escrow `settleGame(gameId, winners[])`

## Demo Mode

Non-wallet users can activate demo mode from HomeScreen. Demo generates a fake address, pre-fills profile data, and skips all on-chain transactions. Cash-bet rooms are locked in demo mode.
