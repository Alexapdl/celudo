/* ===== CELUDO — LUDO ENGINE (4 TOKENS, STANDARD RULES) ===== */

export interface Player {
  c: number;
  tokens: number[]; // 4 positions: -1=home base, 0-51=track, 52-56=home stretch, 57=finished
  done: boolean;
  ai: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface GameCallbacks {
  onUpdateUI: (players: Player[], currentPlayerIndex: number) => void;
  onLog: (message: string) => void;
  onTimerUpdate: (timerText: string) => void;
  onDiceRollStart: () => void;
  onDiceRollEnd: (value: number) => void;
  onRollButtonState: (text: string, disabled: boolean) => void;
  onGameOver: (winnerIndex: number, isHuman: boolean) => void;
}

export const C: Record<number, { name: string; bg: string; light: string; dark: string; fill: string; home: string }> = {
  0: { name: 'Green',  bg: '#45d185', light: '#80e8a8', dark: '#27ae60', fill: '#0d1a10', home: '#2ecc71' },
  1: { name: 'Red',    bg: '#ff5c5c', light: '#ff9a9a', dark: '#c0392b', fill: '#2a1010', home: '#e74c3c' },
  2: { name: 'Blue',   bg: '#5c9cff', light: '#9cc4ff', dark: '#2471a3', fill: '#0a1020', home: '#3498db' },
  3: { name: 'Yellow', bg: '#fcd535', light: '#fde88a', dark: '#c4a000', fill: '#1a1600', home: '#f1c40f' },
};

const CELL_COUNT = 52;

// 52-cell main track [col, row] on 15×15 grid — counterclockwise from Green's start
const TK: [number, number][] = [
  [6,13],[6,12],[6,11],[6,10],[6,9],[6,8],
  [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
  [0,7],[0,6],
  [1,6],[2,6],[3,6],[4,6],[5,6],[6,6],
  [6,5],[6,4],[6,3],[6,2],
  [6,1],[6,0],
  [7,0],[8,0],
  [8,1],[8,2],[8,3],[8,4],[8,5],[8,6],
  [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
  [14,7],[14,8],
  [13,8],[12,8],[11,8],[10,8],[9,8],
  [8,8],[8,9],[8,10],[8,11],[8,12],
];

// Home stretch cells per player (5 usable cells, index 0-4; index 5 unused since pos=57→center)
const HS: [number, number][][] = [
  [[7,12],[7,11],[7,10],[7,9],[7,8],[7,8]],  // Green: UP col 7 (entry from TK[51]=[8,12])
  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],     // Red:   RIGHT row 7 (entry from TK[12]=[0,7])
  [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],     // Blue:  DOWN col 7 (entry from TK[25]=[6,0])
  [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]], // Yellow:LEFT row 7 (entry from TK[38]=[13,6])
];

// 4 home-base circle positions per player (2×2 in each 6×6 corner)
const HB: [number, number][][] = [
  [[1,10],[4,10],[1,13],[4,13]],   // Green  (bottom-left, rows 9-14 cols 0-5)
  [[1,1], [4,1], [1,4], [4,4]],   // Red    (top-left,    rows 0-5  cols 0-5)
  [[10,1],[13,1],[10,4],[13,4]],   // Blue   (top-right,   rows 0-5  cols 9-14)
  [[10,10],[13,10],[10,13],[13,13]], // Yellow (bottom-right,rows 9-14 cols 9-14)
];

// Player relative start position on TK (absolute: TK[SP[pi]])
const SP = [0, 13, 26, 39];

// Home entry: relative track position after one full lap (51 = TK[51] for Green, etc.)
const HE = [51, 51, 51, 51];

// Absolute safe cell positions (no captures allowed here)
const SAFE = [0, 8, 13, 21, 26, 34, 39, 47];

export class LudoGame {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pc: number;
  private cs: number = 0;
  private cur: number = 0;
  private dice: number = 0;
  private over: boolean = false;
  private winner: number = -1;
  private moving: boolean = false;   // waiting for human token click
  private gameTime: number = 0;
  private diceRolling: boolean = false;
  private pl: Player[] = [];
  private movableTokens: number[] = []; // token indices the human can move this turn
  private an: {
    on: boolean;
    pi: number;
    ti: number;       // which token is animating
    path: Point[];
    idx: number;
    t: number;
    dur: number;
    cb?: () => void;
  };
  private frame: number = 0;
  private stopped: boolean = false;
  private ti: NodeJS.Timeout | null = null;
  private callbacks: GameCallbacks;

  constructor(canvas: HTMLCanvasElement, pc: number = 4, callbacks: GameCallbacks) {
    this.cv = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = true;
    this.pc = Math.min(4, Math.max(2, pc));
    this.callbacks = callbacks;

    for (let i = 0; i < this.pc; i++) {
      this.pl.push({ c: i, tokens: [-1, -1, -1, -1], done: false, ai: i > 0 });
    }

    this.an = { on: false, pi: 0, ti: 0, path: [], idx: 0, t: 0, dur: 140 };

    this.onClick = this.onClick.bind(this);
    this.resize = this.resize.bind(this);

    this.cv.addEventListener('click', this.onClick);
    this.resize();
    window.addEventListener('resize', this.resize);

    this.startTimer();
    this.loop();
    this.updateUI();
  }

  resize() {
    const parent = this.cv.parentElement;
    if (!parent) return;
    const s = Math.min(parent.clientWidth - 8, parent.clientHeight - 8);
    this.cv.width = s;
    this.cv.height = s;
    this.cs = s / 15;
  }

  startTimer() {
    this.ti = setInterval(() => {
      this.gameTime++;
      const min = Math.floor(this.gameTime / 60);
      const sec = (this.gameTime % 60).toString().padStart(2, '0');
      this.callbacks.onTimerUpdate(`⏱ ${min}:${sec}`);
    }, 1000);
  }

  stop() {
    if (this.ti) clearInterval(this.ti);
    this.stopped = true;
    this.cv.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.resize);
  }

  loop() {
    if (this.stopped) return;
    requestAnimationFrame(() => this.loop());
    this.frame++;
    this.stepAnim();
    this.draw();
  }

  // ===== COORDINATE HELPERS =====
  pix(col: number, row: number): Point {
    return { x: (col + 0.5) * this.cs, y: (row + 0.5) * this.cs };
  }

  pos2pix(pi: number, tokenIdx: number, pos: number): Point {
    if (pos === -1) {
      const [c, r] = HB[pi][tokenIdx];
      return this.pix(c, r);
    }
    if (pos === 57) return this.pix(7, 7);
    if (pos >= 52) {
      const [c, r] = HS[pi][pos - 52];
      return this.pix(c, r);
    }
    const abs = (SP[pi] + pos) % CELL_COUNT;
    const [c, r] = TK[abs];
    return this.pix(c, r);
  }

  tokenPix(pi: number, tokenIdx: number): Point {
    if (this.an.on && this.an.pi === pi && this.an.ti === tokenIdx) {
      const a = this.an;
      const from = a.path[a.idx];
      const to = a.path[Math.min(a.idx + 1, a.path.length - 1)];
      const t = Math.min(a.t / a.dur, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = from.x + (to.x - from.x) * ease;
      const y = from.y + (to.y - from.y) * ease;
      const bounce = -Math.sin(t * Math.PI) * this.cs * 0.4;
      return { x, y: y + bounce };
    }
    return this.pos2pix(pi, tokenIdx, this.pl[pi].tokens[tokenIdx]);
  }

  // ===== ANIMATION =====
  buildPath(pi: number, tokenIdx: number, dice: number): Point[] {
    const pos = this.pl[pi].tokens[tokenIdx];
    const path: Point[] = [this.pos2pix(pi, tokenIdx, pos)];
    if (pos === -1) {
      path.push(this.pos2pix(pi, tokenIdx, 0));
      return path;
    }
    let cur = pos;
    for (let i = 0; i < dice; i++) {
      if (cur >= 52) {
        cur = Math.min(cur + 1, 57);
        path.push(this.pos2pix(pi, tokenIdx, cur));
        continue;
      }
      const entry = HE[pi];
      const left = cur <= entry ? entry - cur : (CELL_COUNT - cur) + entry;
      if (left === 0) {
        cur = 52;
        path.push(this.pos2pix(pi, tokenIdx, cur));
      } else {
        cur = (cur + 1) % CELL_COUNT;
        path.push(this.pos2pix(pi, tokenIdx, cur));
      }
    }
    return path;
  }

  startAnim(pi: number, tokenIdx: number, dice: number, cb?: () => void) {
    const path = this.buildPath(pi, tokenIdx, dice);
    this.an = { on: true, pi, ti: tokenIdx, path, idx: 0, t: 0, dur: 140, cb };
  }

  stepAnim() {
    if (!this.an.on) return;
    const a = this.an;
    a.t += 16.67;
    if (a.t >= a.dur) {
      a.idx++;
      a.t = 0;
      if (a.idx >= a.path.length - 1) {
        a.on = false;
        if (a.cb) a.cb();
      }
    }
  }

  // ===== GAME LOGIC =====
  canMove(pi: number, ti: number, d: number): boolean {
    const pos = this.pl[pi].tokens[ti];
    if (pos === 57) return false;
    if (pos === -1) return d === 6;
    if (pos >= 52) return (pos - 52) + d <= 5;
    return true;
  }

  // Returns token indices the current player can move with the given dice
  canMoveAny(pi: number, d: number): number[] {
    return [0, 1, 2, 3].filter(ti => this.canMove(pi, ti, d));
  }

  // Returns true if a capture happened
  applyMove(pi: number, ti: number, d: number): boolean {
    const p = this.pl[pi];
    const pos = p.tokens[ti];
    let captured = false;

    if (pos === -1 && d === 6) {
      p.tokens[ti] = 0;
      this.log(`${C[pi].name} enters!`);
      captured = this.capture(pi, ti);
      this.checkDone(pi);
      return captured;
    }

    if (pos >= 52) {
      const ns = (pos - 52) + d;
      if (ns >= 5) {
        p.tokens[ti] = 57;
        this.log(`${C[pi].name} token home! 🏠`);
        this.checkDone(pi);
      } else {
        p.tokens[ti] = 52 + ns;
      }
      return false;
    }

    const entry = HE[pi];
    const left = pos <= entry ? entry - pos : (CELL_COUNT - pos) + entry;
    if (d > left) {
      const hs = d - left - 1;
      if (hs >= 5) {
        p.tokens[ti] = 57;
        this.log(`${C[pi].name} token home! 🏠`);
        this.checkDone(pi);
      } else {
        p.tokens[ti] = 52 + hs;
        this.log(`${C[pi].name} home stretch!`);
      }
      return false;
    }

    p.tokens[ti] = (pos + d) % CELL_COUNT;
    captured = this.capture(pi, ti);
    return captured;
  }

  // Send opponent tokens back if they share the same absolute cell (non-safe)
  capture(pi: number, ti: number): boolean {
    const pos = this.pl[pi].tokens[ti];
    if (pos < 0 || pos >= 52) return false;
    const abs = (SP[pi] + pos) % CELL_COUNT;
    if (SAFE.includes(abs)) return false;
    let captured = false;
    for (let oi = 0; oi < this.pc; oi++) {
      if (oi === pi) continue;
      const op = this.pl[oi];
      for (let oti = 0; oti < 4; oti++) {
        const opos = op.tokens[oti];
        if (opos < 0 || opos >= 52) continue;
        if ((SP[oi] + opos) % CELL_COUNT === abs) {
          op.tokens[oti] = -1;
          this.log(`💥 ${C[pi].name} captures ${C[oi].name}!`);
          captured = true;
        }
      }
    }
    return captured;
  }

  checkDone(pi: number) {
    if (this.pl[pi].tokens.every(p => p === 57)) {
      this.pl[pi].done = true;
      if (!this.over) {
        this.winner = pi;
        this.over = true;
        this.log(`🏆 ${C[pi].name} WINS!`);
      }
    }
  }

  // ===== TURN FLOW =====
  roll() {
    if (this.over || this.moving || this.diceRolling || this.pl[this.cur].ai) return;
    this.diceRolling = true;
    this.callbacks.onDiceRollStart();
    this.animDice(() => {
      this.dice = Math.floor(Math.random() * 6) + 1;
      this.callbacks.onDiceRollEnd(this.dice);
      this.log(`You rolled ${this.dice}`);
      this.diceRolling = false;

      this.movableTokens = this.canMoveAny(0, this.dice);
      if (this.movableTokens.length === 0) {
        this.log('No move possible.');
        setTimeout(() => this.endTurn(), 700);
        return;
      }
      if (this.movableTokens.length === 1) {
        // Auto-select the only movable token
        this.executeHumanMove(this.movableTokens[0]);
        return;
      }
      // Multiple choices — wait for click
      this.moving = true;
      this.callbacks.onRollButtonState('Tap a token!', true);
    });
  }

  executeHumanMove(ti: number) {
    this.moving = false;
    this.movableTokens = [];
    this.startAnim(0, ti, this.dice, () => {
      const captured = this.applyMove(0, ti, this.dice);
      this.updateUI();
      if (this.over) { this.onEnd(); return; }
      if (this.dice === 6 || captured) {
        this.log(captured ? 'Capture bonus roll!' : 'Bonus roll!');
        this.callbacks.onRollButtonState('🎲 Roll Dice', false);
      } else {
        setTimeout(() => this.endTurn(), 350);
      }
    });
  }

  onClick(e: MouseEvent) {
    if (!this.moving || this.an.on || this.cur !== 0) return;
    const rect = this.cv.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Find which movable token was clicked
    for (const ti of this.movableTokens) {
      const tp = this.tokenPix(0, ti);
      const dx = mx - tp.x, dy = my - tp.y;
      if (Math.sqrt(dx * dx + dy * dy) < this.cs * 0.5) {
        this.executeHumanMove(ti);
        return;
      }
    }
  }

  doAI() {
    if (this.over || this.an.on) return;
    const pi = this.cur;
    this.dice = Math.floor(Math.random() * 6) + 1;
    this.callbacks.onDiceRollEnd(this.dice);
    this.log(`${C[pi].name} rolled ${this.dice}`);

    const movable = this.canMoveAny(pi, this.dice);
    if (movable.length === 0) {
      this.log(`${C[pi].name} — no move.`);
      setTimeout(() => this.endTurn(), 500);
      return;
    }

    const ti = this.pickAIToken(pi, movable);
    setTimeout(() => {
      this.startAnim(pi, ti, this.dice, () => {
        const captured = this.applyMove(pi, ti, this.dice);
        this.updateUI();
        if (this.over) { this.onEnd(); return; }
        if (this.dice === 6 || captured) {
          setTimeout(() => this.doAI(), 600);
        } else {
          setTimeout(() => this.endTurn(), 300);
        }
      });
    }, 400);
  }

  // AI picks the best token: capture > home-stretch advance > most advanced > enter track
  pickAIToken(pi: number, movable: number[]): number {
    const tokens = this.pl[pi].tokens;
    let best = movable[0];

    // 1. Prefer a move that captures
    for (const ti of movable) {
      const pos = tokens[ti];
      if (pos === -1) continue;
      if (pos >= 52) continue;
      const nextPos = (pos + this.dice) % CELL_COUNT;
      const abs = (SP[pi] + nextPos) % CELL_COUNT;
      if (SAFE.includes(abs)) continue;
      for (let oi = 0; oi < this.pc; oi++) {
        if (oi === pi) continue;
        for (const op of this.pl[oi].tokens) {
          if (op < 0 || op >= 52) continue;
          if ((SP[oi] + op) % CELL_COUNT === abs) return ti;
        }
      }
    }

    // 2. Prefer home-stretch token that can advance
    for (const ti of movable) {
      if (tokens[ti] >= 52) { best = ti; break; }
    }

    // 3. Otherwise prefer most advanced main-track token
    let maxPos = -2;
    for (const ti of movable) {
      const p = tokens[ti];
      if (p >= 0 && p < 52 && p > maxPos) { maxPos = p; best = ti; }
    }

    return best;
  }

  endTurn() {
    if (this.over) return;
    this.cur = (this.cur + 1) % this.pc;
    // Skip done players
    let safety = 0;
    while (this.pl[this.cur].done && safety < this.pc) {
      this.cur = (this.cur + 1) % this.pc;
      safety++;
    }
    this.updateUI();
    if (this.pl[this.cur].ai) {
      setTimeout(() => this.doAI(), 500);
    } else {
      this.callbacks.onRollButtonState('🎲 Roll Dice', false);
    }
  }

  animDice(cb: () => void) {
    let n = 0;
    const iv = setInterval(() => {
      this.callbacks.onDiceRollEnd(Math.floor(Math.random() * 6) + 1);
      n++;
      if (n > 8) { clearInterval(iv); cb(); }
    }, 80);
  }

  updateUI() { this.callbacks.onUpdateUI(this.pl, this.cur); }
  log(m: string) { this.callbacks.onLog(m); }

  onEnd() {
    this.stop();
    this.callbacks.onGameOver(this.winner, this.winner === 0);
  }

  // ===== DRAWING =====
  draw() {
    const ctx = this.ctx;
    const s = this.cv.width;
    ctx.clearRect(0, 0, s, s);
    this.drawBoard(ctx);
    this.drawTokens(ctx);
  }

  private cell(col: number, row: number): { x: number; y: number; w: number } {
    return { x: col * this.cs, y: row * this.cs, w: this.cs };
  }

  private fillCell(ctx: CanvasRenderingContext2D, col: number, row: number, color: string, radius = 2) {
    const { x, y, w } = this.cell(col, row);
    const pad = w * 0.04;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, w - pad * 2, w - pad * 2, radius);
    ctx.fill();
  }

  drawBoard(ctx: CanvasRenderingContext2D) {
    const s = this.cv.width;
    const cs = this.cs;

    // Background
    ctx.fillStyle = '#0b1320';
    ctx.fillRect(0, 0, s, s);

    // Border
    ctx.strokeStyle = '#1e2d44';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, s - 2, s - 2);

    // ── Home areas (6×6 colored corners) ──
    const homeAreas: [number, number, number][] = [
      [0, 9, 0],   // Green  bottom-left
      [0, 0, 1],   // Red    top-left
      [9, 0, 2],   // Blue   top-right
      [9, 9, 3],   // Yellow bottom-right
    ];
    for (const [startCol, startRow, pi] of homeAreas) {
      const c = C[pi];
      ctx.fillStyle = c.fill;
      ctx.fillRect(startCol * cs, startRow * cs, 6 * cs, 6 * cs);
      // Inner colored border
      ctx.strokeStyle = c.dark;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startCol * cs + 1, startRow * cs + 1, 6 * cs - 2, 6 * cs - 2);
      // Inner lighter panel
      ctx.fillStyle = c.home + '22';
      ctx.fillRect(startCol * cs + cs * 0.5, startRow * cs + cs * 0.5, 5 * cs, 5 * cs);
    }

    // ── Main track cells ──
    const trackColor = '#1a2640';
    const trackBorder = '#2a3a5a';
    for (let i = 0; i < CELL_COUNT; i++) {
      const [col, row] = TK[i];
      ctx.fillStyle = trackColor;
      const { x, y, w } = this.cell(col, row);
      const pad = w * 0.04;
      ctx.fillRect(x + pad, y + pad, w - pad * 2, w - pad * 2);
      ctx.strokeStyle = trackBorder;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x + pad, y + pad, w - pad * 2, w - pad * 2);
    }

    // ── Start cells (colored) ──
    for (let pi = 0; pi < 4; pi++) {
      const absIdx = SP[pi] % CELL_COUNT;
      const [col, row] = TK[absIdx];
      this.fillCell(ctx, col, row, C[pi].home + 'bb');
      // Small arrow indicator
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.floor(cs * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▶', (col + 0.5) * cs, (row + 0.5) * cs);
    }

    // ── Safe cells (star) ──
    for (const absIdx of SAFE) {
      // Only mark if not already a start cell
      if (SP.map(s => s % CELL_COUNT).includes(absIdx)) continue;
      const [col, row] = TK[absIdx];
      this.fillCell(ctx, col, row, '#1e3a2a');
      ctx.fillStyle = '#ffd700aa';
      ctx.font = `${Math.floor(cs * 0.42)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', (col + 0.5) * cs, (row + 0.5) * cs);
    }

    // ── Home stretch corridors ──
    for (let pi = 0; pi < 4; pi++) {
      const c = C[pi];
      for (let hi = 0; hi < 5; hi++) {
        const [col, row] = HS[pi][hi];
        this.fillCell(ctx, col, row, c.home + '55');
        ctx.strokeStyle = c.dark + '88';
        ctx.lineWidth = 0.8;
        const { x, y, w } = this.cell(col, row);
        ctx.strokeRect(x + w * 0.04, y + w * 0.04, w * 0.92, w * 0.92);
      }
    }

    // ── Center area (star/home) ──
    this.drawCenter(ctx, cs);

    // ── Home base circles in each corner ──
    for (let pi = 0; pi < 4; pi++) {
      const c = C[pi];
      for (let ti = 0; ti < 4; ti++) {
        const [col, row] = HB[pi][ti];
        const cx = (col + 0.5) * cs;
        const cy = (row + 0.5) * cs;
        const r = cs * 0.38;
        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = c.dark;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Fill
        ctx.fillStyle = c.fill;
        ctx.fill();
        // Inner circle
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
        ctx.strokeStyle = c.home + '66';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  private drawCenter(ctx: CanvasRenderingContext2D, cs: number) {
    const cx = 7.5 * cs;
    const cy = 7.5 * cs;
    const hw = cs * 1.4;

    // Background square
    ctx.fillStyle = '#0b1320';
    ctx.fillRect(cx - hw, cy - hw, hw * 2, hw * 2);

    // 4 colored triangles pointing inward
    const colors = [C[0].home, C[1].home, C[2].home, C[3].home];
    const corners: [number, number][] = [
      [cx - hw, cy + hw], // Green bottom-left
      [cx - hw, cy - hw], // Red top-left
      [cx + hw, cy - hw], // Blue top-right
      [cx + hw, cy + hw], // Yellow bottom-right
    ];
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(...corners[i]);
      ctx.lineTo(...corners[(i + 1) % 4]);
      ctx.closePath();
      ctx.fillStyle = colors[i] + 'cc';
      ctx.fill();
    }

    // Center star
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(cs * 0.8)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy);
  }

  // ===== TOKEN DRAWING =====
  private circle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  drawTokens(ctx: CanvasRenderingContext2D) {
    const t = this.frame;
    const cs = this.cs;

    for (let pi = 0; pi < this.pc; pi++) {
      const p = this.pl[pi];
      const c = C[pi];

      for (let ti = 0; ti < 4; ti++) {
        if (p.tokens[ti] === 57) continue; // finished tokens not drawn (absorbed into center)

        const pos = this.tokenPix(pi, ti);
        const r = cs * 0.28;
        const isCurrentPlayer = pi === this.cur && !p.done;
        const isMovable = pi === 0 && this.movableTokens.includes(ti) && !this.an.on;

        // Selection glow for human's movable tokens
        if (isMovable) {
          const pulse = Math.sin(t * 0.1) * 0.5 + 0.5;
          const glowR = r + 5 + pulse * 4;
          const grd = ctx.createRadialGradient(pos.x, pos.y, r * 0.5, pos.x, pos.y, glowR);
          grd.addColorStop(0, `rgba(255,255,100,${0.5 + pulse * 0.4})`);
          grd.addColorStop(1, 'rgba(255,255,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        } else if (isCurrentPlayer && !this.an.on && !this.moving) {
          // Subtle glow for current player tokens (not yet in selection mode)
          const pulse = Math.sin(t * 0.05) * 0.5 + 0.5;
          const glowR = r + 3 + pulse * 2;
          const grd = ctx.createRadialGradient(pos.x, pos.y, r, pos.x, pos.y, glowR);
          grd.addColorStop(0, `rgba(255,255,255,${0.2 + pulse * 0.2})`);
          grd.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Shadow
        this.circle(ctx, pos.x + 1.5, pos.y + 2, r, 'rgba(0,0,0,0.45)');

        // Body
        this.circle(ctx, pos.x, pos.y, r, c.bg);

        // Gradient highlight
        const hgrd = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.35, 0, pos.x, pos.y, r);
        hgrd.addColorStop(0, c.light);
        hgrd.addColorStop(0.55, c.bg);
        hgrd.addColorStop(1, c.dark);
        ctx.fillStyle = hgrd;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = c.dark;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Specular highlight
        this.circle(ctx, pos.x - r * 0.3, pos.y - r * 0.32, r * 0.22, 'rgba(255,255,255,0.4)');

        // Token label: player letter + token number
        ctx.fillStyle = '#fff';
        const fontSize = Math.max(7, Math.floor(r * 0.75));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = pi === 0 ? `U${ti + 1}` : `${c.name[0]}${ti + 1}`;
        ctx.fillText(label, pos.x, pos.y + 0.5);

        // Tap hint for movable tokens
        if (isMovable) {
          const pulse = Math.sin(t * 0.1) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255,255,100,${0.6 + pulse * 0.4})`;
          ctx.font = `bold ${Math.floor(cs * 0.22)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▲', pos.x, pos.y - r - cs * 0.18);
        }
      }
    }
  }
}
