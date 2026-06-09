# Celudo — Task Board

## Completed

- [x] **Create CLAUDE.md** — project guide for Claude Code
- [x] **Create architecture.md** — system architecture reference
- [x] **Fix Ludo engine: 4 tokens per player** — `src/app/ludoEngine.ts`
- [x] **Fix win condition** — all 4 tokens must reach center (pos=57)
- [x] **Fix home entry (HE)** — set to 51 for all players (correct one-lap rule)
- [x] **Fix HS geometry** — home stretch entries now geometrically adjacent to last track cell
- [x] **Remove boardOffset hack** — no more `cs * 0.3` coordinate fudge
- [x] **Draw board programmatically** — replaced static `board.png` with canvas rendering
- [x] **Token click selection** — click a highlighted token to move it (auto-select if only 1)
- [x] **Extra roll on capture** — capturing an opponent gives a bonus roll
- [x] **AI token heuristic** — AI prioritizes captures, then home stretch, then most advanced
- [x] **Update GameScreen.tsx** — shows 4-token progress dots per player (0/4 … 4/4)

## Backlog / Future

- [ ] **Blockade rule** — 2 same-color tokens on same cell block opponents from passing
- [ ] **Multi-player online** — real-time multiplayer via WebSocket or Supabase Realtime
- [ ] **Animated home base exit** — token flies from home-base circle to start cell
- [ ] **Sound: bonus roll** — distinct audio cue for extra-roll events
- [ ] **Leaderboard** — global points ranking page
- [ ] **Tournament brackets** — automated bracket management for tournaments
- [ ] **Token stacking display** — visual offset when 2+ tokens of same color share a cell
