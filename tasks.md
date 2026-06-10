# Celudo — Task Board

Tasks are broken down as **atomic commits** — each task is a single, self-contained PR. Check the box when merged.

## Phase 1 — Docs & Foundation

- [x] **T001** `docs: add README.md with Mermaid architecture`
  - Files: `readme.md`
  - Project overview, tech stack, setup, scripts, Mermaid architecture diagram, game rules, tier system, contributing guide

- [x] **T002** `docs: rewrite architecture.md with Mermaid diagrams`
  - Files: `architecture.md`
  - Replace all ASCII art with Mermaid: system overview, class diagram, sequence diagrams, ER diagram, state management flow

- [x] **T003** `docs: add atomic task breakdown to tasks.md`
  - Files: `tasks.md`
  - This file. One task per PR, grouped by phase

- [x] **T004** `feat: add Coming Soon overlay to StakingScreen`
  - Files: `src/components/staking/StakingScreen.tsx`
  - Add `Lock` icon, semi-transparent overlay, "Coming Soon" badge, disable stake/unstake buttons
  - DeFi yield is simulated — overlay informs users that real staking is under development

- [x] **T005** `feat: dual testnet/mainnet environment configuration`
  - Files: `.env.example`, `src/lib/wagmi.ts`
  - Add `NEXT_PUBLIC_NETWORK` toggle, split contract addresses by network
  - Both Alfajores and Celo mainnet chains in Wagmi config with automatic switching

## Phase 2 — Smart Contract Deployment

- [ ] **T006** `feat: deploy LudoEscrow to Alfajores testnet`
  - Files: `contract/`, `.env.local`
  - Deploy via Foundry to `https://alfajores-forno.celo-testnet.org`
  - Verify on Alfajores block explorer
  - Update `.env.local` with testnet escrow address

- [ ] **T007** `feat: deploy LudoEscrow to Celo mainnet`
  - Files: `contract/`, `.env.local`
  - Deploy via Foundry to `https://forno.celo.org`
  - Verify on Celoscan
  - Update `.env.local` with mainnet escrow address, admin key, treasury address

- [ ] **T008** `feat: wire escrow contract address to API routes`
  - Files: `src/app/api/game/route.ts`, `src/app/api/game/settle/route.ts`
  - Replace placeholder `0xYour...` guard with live contract address
  - Ensure `getAdminContract()` resolves correctly for both testnet and mainnet

## Phase 3 — Core Gameplay Fixes

- [x] **T009** `fix: blockade rule — 2 same-color tokens block opponents`
  - Files: `src/app/ludoEngine.ts`
  - When 2+ tokens of same color occupy a cell, opponent tokens cannot pass through
  - Add `isBlockade(cellPos, playerIndex)` helper
  - Update `getMovableTokens()` and `applyMove()` to check blockades

- [x] **T010** `feat: animated home base exit`
  - Files: `src/app/ludoEngine.ts`
  - When a token leaves home base (pos -1 → 0), animate it flying from home-base circle to start cell
  - Add `homeExit` animation state to `AnimState`

- [x] **T011** `feat: token stacking display when same-color tokens share a cell`
  - Files: `src/app/ludoEngine.ts`
  - When 2+ same-color tokens are on the same cell, render them with a small offset so they stack visually
  - Add `getTokenOffsets(cellPos)` helper

- [x] **T012** `feat: sound effect for bonus roll`
  - Files: `src/lib/sound.ts`, `src/app/ludoEngine.ts`
  - Add distinct `bonusRoll()` SFX (e.g., ascending arpeggio or sparkle)
  - Trigger from `LudoGame` when roll === 6 or capture occurs

## Phase 4 — Multiplayer & Cash Bet

- [ ] **T013** `feat: real-time game state sync via Supabase Realtime`
  - Files: `src/hooks/useGameController.ts`, `src/lib/supabase.ts`
  - Subscribe to `games` table changes for live lobby updates
  - Broadcast player moves to other connected clients

- [ ] **T014** `feat: lobby waiting room with live player count`
  - Files: `src/components/lobby/LobbyScreen.tsx`
  - Show real-time player count per room
  - Auto-start game when all slots are filled
  - Display wallet addresses of joined players

- [ ] **T015** `feat: cash bet deposit flow`
  - Files: `src/components/lobby/LobbyScreen.tsx`, `src/hooks/useUserState.ts`, new `src/hooks/useEscrow.ts`
  - After creating a cash-bet game, prompt user to approve cUSD spending
  - Call `depositBet(gameId)` on LudoEscrow contract via Wagmi
  - Show transaction status (pending → confirmed)

- [ ] **T016** `feat: game settlement flow — on-chain settleGame call`
  - Files: `src/app/api/game/settle/route.ts`, `src/hooks/useGameController.ts`
  - On game over, call `/api/game/settle` which calls `settleGame(gameId, winners[])` on-chain
  - Show settlement confirmation to user
  - Handle on-chain errors gracefully (retry, fallback to pending state)

## Phase 5 — Staking / DeFi Yield (Coming Soon → Implementation)

- [ ] **T017** `feat: StakingPool.sol contract scaffold`
  - Files: `contract/src/StakingPool.sol`, `contract/test/StakingPool.t.sol`
  - Accept cUSD deposits, track staker balances
  - Integrate with a Celo yield protocol (Mento Reserve, Aave, or similar)
  - Tier-based APY boost modifier
  - Write comprehensive Foundry tests

- [ ] **T018** `feat: yield calculation service`
  - Files: new `src/lib/yield.ts`, new `src/app/api/yield/route.ts`
  - Backend endpoint that calculates current APY based on on-chain data
  - Replace hardcoded `BASE_APY = 5.0` with dynamic fetch
  - Rate-limit and cache yield data

- [ ] **T019** `feat: real on-chain staking integration`
  - Files: `src/hooks/useUserState.ts`, `src/components/staking/StakingScreen.tsx`
  - Replace simulated `handleStake()` with real `StakingPool.deposit()` call
  - Replace simulated `handleUnstake()` with real `StakingPool.withdraw()` call
  - Remove Coming Soon overlay
  - Show real earned yield from on-chain data

## Phase 6 — Polish & Production

- [ ] **T020** `feat: global leaderboard page`
  - Files: new `src/components/leaderboard/LeaderboardScreen.tsx`, new API route
  - Query `users` table ordered by points
  - Show rank, username, points, tier, win rate
  - Paginated, searchable

- [ ] **T021** `feat: tournament bracket management`
  - Files: new `src/components/tournament/`, updated `src/app/api/`
  - Auto-generate brackets from registered players
  - Track rounds, advance winners
  - Award bonus points to tournament winners

- [ ] **T022** `feat: production Supabase hardening`
  - Files: `supabase/migrations/`, RLS policies
  - Tighten RLS policies (no `USING (true)` for writes)
  - Add service-role-only endpoints for sensitive operations
  - Add rate limiting, input validation, error boundaries

- [ ] **T023** `feat: remove demo mode in production`
  - Files: `src/hooks/useUserState.ts`, `src/components/home/HomeScreen.tsx`
  - Gate demo mode behind `NEXT_PUBLIC_ALLOW_DEMO=true`
  - In production build, hide demo mode link entirely
  - Ensure all cash-bet flows require a real wallet