/* ===== CELUDO — 8-BIT LUDO ENGINE IN TYPESCRIPT ===== */

export interface Player {
  c: number;
  pos: number;
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
  0: { name: 'Red', bg: '#ff5c5c', light: '#ff9a9a', dark: '#c0392b', fill: '#2a1010', home: '#e74c3c' },
  1: { name: 'Green', bg: '#45d185', light: '#80e8a8', dark: '#27ae60', fill: '#0d1a10', home: '#2ecc71' },
  2: { name: 'Yellow', bg: '#fcd535', light: '#fde88a', dark: '#c4a000', fill: '#1a1600', home: '#f1c40f' },
  3: { name: 'Blue', bg: '#5c9cff', light: '#9cc4ff', dark: '#2471a3', fill: '#0a1020', home: '#3498db' }
};

const CELL_COUNT = 52;

// 52-cell track coords [col,row] on 15x15 grid
const TK: [number, number][] = [
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [6, 5], [6, 4], [6, 3], [6, 2],
  [6, 1], [6, 0], [7, 0], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [9, 6], [10, 6],
  [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 8], [8, 9], [8, 10], [8, 11], [8, 12]
];

const HS: [number, number][][] = [
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]]
];

const HB: [number, number][] = [[2, 12], [2, 2], [12, 2], [12, 12]]; // home base token position per player
const SP = [0, 13, 26, 39]; // start pos on track
const HE = [50, 11, 24, 37]; // home entry index
const SAFE = [0, 8, 13, 21, 26, 34, 39, 47];

function qc(c: number, r: number): number {
  if (c <= 5 && r <= 5) return 1;
  if (c >= 9 && r <= 5) return 2;
  if (c <= 5 && r >= 9) return 0;
  if (c >= 9 && r >= 9) return 3;
  return -1;
}

const BM: string[][] = [
  ['H', 'H', 'H', 'H', 'H', 'H', 'E', 'E', 'g', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'E', 'E', 'E', 'E', 'H', 'E', 'g', 'E', 'H', 'E', 'E', 'E', 'E', 'H'],
  ['H', 'E', 'G', 'G', 'E', 'H', 'E', 'g', 'E', 'H', 'E', 'Y', 'Y', 'E', 'H'],
  ['H', 'E', 'G', 'G', 'E', 'H', 'E', 'g', 'E', 'H', 'E', 'Y', 'Y', 'E', 'H'],
  ['H', 'E', 'E', 'E', 'E', 'H', 'E', 'g', 'E', 'H', 'E', 'E', 'E', 'E', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'E', 'g', 'S', 'E', 'E', 'E', 'E', 'E', 'E'],
  ['E', 'E', 'E', 'E', 'E', 'S', 'E', 'C', 'E', 'E', 'E', 'E', 'E', 'E', 'E'],
  ['r', 'r', 'r', 'r', 'r', 'E', 'C', 'C', 'C', 'E', 'y', 'y', 'y', 'y', 'y'],
  ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'C', 'E', 'S', 'E', 'E', 'E', 'E', 'E'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'E', 'b', 'E', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'E', 'E', 'E', 'E', 'H', 'E', 'b', 'E', 'H', 'E', 'E', 'E', 'E', 'H'],
  ['H', 'E', 'R', 'R', 'E', 'H', 'E', 'b', 'E', 'H', 'E', 'B', 'B', 'E', 'H'],
  ['H', 'E', 'R', 'R', 'E', 'H', 'E', 'b', 'E', 'H', 'E', 'B', 'B', 'E', 'H'],
  ['H', 'E', 'E', 'E', 'E', 'H', 'E', 'b', 'E', 'H', 'E', 'E', 'E', 'E', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'r', 'E', 'E', 'H', 'H', 'H', 'H', 'H', 'H']
];

export class LudoGame {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pc: number;
  private cs: number = 0;
  private cur: number = 0;
  private dice: number = 0;
  private over: boolean = false;
  private winner: number = -1;
  private moving: boolean = false;
  private gameTime: number = 0;
  private diceRolling: boolean = false;
  private pl: Player[] = [];
  private an: {
    on: boolean;
    pi: number;
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
    this.ctx.imageSmoothingEnabled = false; // 8-bit crisp pixels
    this.pc = Math.min(4, Math.max(2, pc));
    this.callbacks = callbacks;

    // 1 token per player
    for (let i = 0; i < this.pc; i++) {
      this.pl.push({ c: i, pos: -1, done: false, ai: i > 0 });
    }

    // Animation state
    this.an = { on: false, pi: 0, path: [], idx: 0, t: 0, dur: 150 };

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
    const s = Math.min(parent.clientWidth - 8, parent.clientHeight - 8, 600);
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

  // Main 60fps loop
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

  pos2pix(pi: number, pos: number): Point {
    if (pos === -1) {
      const [c, r] = HB[pi];
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

  tokenPix(pi: number): Point {
    if (this.an.on && this.an.pi === pi) {
      const a = this.an;
      const from = a.path[a.idx];
      const to = a.path[Math.min(a.idx + 1, a.path.length - 1)];
      const t = Math.min(a.t / a.dur, 1);
      // Ease out bounce
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = from.x + (to.x - from.x) * ease;
      const y = from.y + (to.y - from.y) * ease;
      // Bounce arc
      const bounce = -Math.sin(t * Math.PI) * this.cs * 0.5;
      return { x, y: y + bounce };
    }
    return this.pos2pix(pi, this.pl[pi].pos);
  }

  // ===== ANIMATION =====
  buildPath(pi: number, dice: number): Point[] {
    const p = this.pl[pi];
    let pos = p.pos;
    const path: Point[] = [this.pos2pix(pi, pos)];
    if (pos === -1) {
      path.push(this.pos2pix(pi, 0));
      return path;
    }
    for (let i = 0; i < dice; i++) {
      if (pos >= 52) {
        pos = Math.min(pos + 1, 57);
        path.push(this.pos2pix(pi, pos));
        continue;
      }
      const entry = HE[pi];
      const left = pos <= entry ? entry - pos : (CELL_COUNT - pos) + entry;
      if (left === 0) {
        pos = 52;
        path.push(this.pos2pix(pi, pos));
      } else {
        pos = (pos + 1) % CELL_COUNT;
        path.push(this.pos2pix(pi, pos));
      }
    }
    return path;
  }

  startAnim(pi: number, dice: number, cb?: () => void) {
    const path = this.buildPath(pi, dice);
    this.an = { on: true, pi, path, idx: 0, t: 0, dur: 150, cb };
    this.moving = true;
  }

  stepAnim() {
    if (!this.an.on) return;
    const a = this.an;
    a.t += 16.67; // ~60fps
    if (a.t >= a.dur) {
      a.idx++;
      a.t = 0;
      if (a.idx >= a.path.length - 1) {
        a.on = false;
        this.moving = false;
        if (a.cb) a.cb();
      }
    }
  }

  // ===== GAME LOGIC =====
  canMove(pi: number, d: number): boolean {
    const p = this.pl[pi];
    if (p.done) return false;
    if (p.pos === -1) return d === 6;
    if (p.pos >= 52) return (p.pos - 52) + d <= 5;
    return true;
  }

  applyMove(pi: number, d: number) {
    const p = this.pl[pi];
    if (p.pos === -1 && d === 6) {
      p.pos = 0;
      this.log(`${C[pi].name} enters!`);
      this.capture(pi);
      return;
    }
    if (p.pos >= 52) {
      const ns = p.pos - 52 + d;
      if (ns >= 5) {
        p.pos = 57;
        p.done = true;
        this.winner = pi;
        this.over = true;
        this.log(`🏆 ${C[pi].name} WINS!`);
      } else {
        p.pos = 52 + ns;
      }
      return;
    }
    const entry = HE[pi];
    const left = p.pos <= entry ? entry - p.pos : (CELL_COUNT - p.pos) + entry;
    if (d > left) {
      const hs = d - left - 1;
      if (hs >= 5) {
        p.pos = 57;
        p.done = true;
        this.winner = pi;
        this.over = true;
        this.log(`🏆 ${C[pi].name} WINS!`);
      } else {
        p.pos = 52 + hs;
        this.log(`${C[pi].name} home stretch!`);
      }
    } else {
      p.pos = (p.pos + d) % CELL_COUNT;
      this.capture(pi);
    }
  }

  capture(pi: number) {
    const pos = this.pl[pi].pos;
    if (pos < 0 || pos >= 52) return;
    const abs = (SP[pi] + pos) % CELL_COUNT;
    if (SAFE.includes(abs)) return;
    for (let i = 0; i < this.pc; i++) {
      if (i === pi) continue;
      const op = this.pl[i];
      if (op.pos < 0 || op.pos >= 52) continue;
      if ((SP[i] + op.pos) % CELL_COUNT === abs) {
        op.pos = -1;
        this.log(`💥 ${C[pi].name} captures ${C[i].name}!`);
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
      if (!this.canMove(0, this.dice)) {
        this.log('No move!');
        setTimeout(() => this.endTurn(), 600);
        return;
      }
      this.moving = true; // wait for click
      this.callbacks.onRollButtonState('Tap board!', true);
    });
  }

  onClick() {
    if (!this.moving || this.an.on || this.cur !== 0) return;
    this.moving = false;
    this.startAnim(0, this.dice, () => {
      this.applyMove(0, this.dice);
      this.updateUI();
      if (this.over) {
        this.onEnd();
        return;
      }
      if (this.dice === 6) {
        this.log('Bonus!');
        this.callbacks.onRollButtonState('🎲 Roll Dice', false);
      } else {
        setTimeout(() => this.endTurn(), 350);
      }
    });
  }

  doAI() {
    if (this.over || this.an.on) return;
    const pi = this.cur;
    this.dice = Math.floor(Math.random() * 6) + 1;
    this.callbacks.onDiceRollEnd(this.dice);
    this.log(`${C[pi].name} rolled ${this.dice}`);
    if (!this.canMove(pi, this.dice)) {
      this.log(`${C[pi].name} — no move.`);
      setTimeout(() => this.endTurn(), 500);
      return;
    }
    setTimeout(() => {
      this.startAnim(pi, this.dice, () => {
        this.applyMove(pi, this.dice);
        this.updateUI();
        if (this.over) {
          this.onEnd();
          return;
        }
        if (this.dice === 6) {
          setTimeout(() => this.doAI(), 600);
        } else {
          setTimeout(() => this.endTurn(), 300);
        }
      });
    }, 400);
  }

  endTurn() {
    this.cur = (this.cur + 1) % this.pc;
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
      // Simulate physical roll by selecting a random side
      const rolledValIndex = Math.floor(Math.random() * 6);
      this.callbacks.onDiceRollEnd(rolledValIndex + 1);
      n++;
      if (n > 8) {
        clearInterval(iv);
        cb();
      }
    }, 80);
  }

  updateUI() {
    this.callbacks.onUpdateUI(this.pl, this.cur);
  }

  log(m: string) {
    this.callbacks.onLog(m);
  }

  onEnd() {
    this.stop();
    this.callbacks.onGameOver(this.winner, this.winner === 0);
  }

  // ===== BEAUTIFUL MOBILE BOARD DRAWING =====
  draw() {
    const ctx = this.ctx;
    const cs = this.cs;
    const s = this.cv.width;
    ctx.clearRect(0, 0, s, s);

    // Rich dark wood background with subtle gradient
    const bg = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.9);
    bg.addColorStop(0, '#1e1e36');
    bg.addColorStop(0.5, '#16162a');
    bg.addColorStop(1, '#0e0e1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s, s);

    this.drawBoard(ctx, cs);
    this.drawTokens(ctx, cs);
  }

  // Draw a rounded rect path (no fill, just path)
  private rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // Fill rounded rect
  private fr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
    this.rr(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // Draw a cell with rounded corners
  private cell(ctx: CanvasRenderingContext2D, cx: number, cy: number, cs: number, fill: string, border: string, radius: number = 0) {
    const pad = 1;
    const w = cs - pad * 2;
    const h = cs - pad * 2;
    if (radius > 0) {
      this.fr(ctx, cx + pad, cy + pad, w, h, radius, fill);
      this.rr(ctx, cx + pad, cy + pad, w, h, radius);
    } else {
      ctx.fillStyle = fill;
      ctx.fillRect(cx + pad, cy + pad, w, h);
      ctx.beginPath();
      ctx.rect(cx + pad, cy + pad, w, h);
    }
    ctx.strokeStyle = border;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Draw circle token
  private circle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // Draw star shape
  private star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string) {
    ctx.fillStyle = col;
    ctx.font = `${r * 2}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy);
  }

  drawBoard(ctx: CanvasRenderingContext2D, cs: number) {
    const s = this.cv.width;

    // Board outer frame shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, s, 3);
    ctx.fillRect(0, s - 3, s, 3);
    ctx.fillRect(0, 0, 3, s);
    ctx.fillRect(s - 3, 0, 3, s);

    // Draw the cross-shaped track (E cells)
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const cellVal = BM[r][c];
        const px = c * cs;
        const py = r * cs;

        if (cellVal === 'E') {
          // Track cell - cream colored
          this.cell(ctx, px, py, cs, '#2a2818', 'rgba(255,255,255,0.06)', 0);
          // Inner groove
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(px + cs * 0.15, py + cs * 0.15, cs * 0.7, cs * 0.7);
          ctx.strokeStyle = 'rgba(255,255,255,0.04)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px + cs * 0.15, py + cs * 0.15, cs * 0.7, cs * 0.7);
        } else if (cellVal === 'S') {
          // Safe cell - golden glow
          const alpha = 0.3 + Math.sin(this.frame * 0.05) * 0.1;
          ctx.fillStyle = `rgba(252,213,53,${alpha})`;
          ctx.fillRect(px, py, cs, cs);
          this.cell(ctx, px, py, cs, '#3a3010', 'rgba(252,213,53,0.3)', 0);
          this.star(ctx, px + cs / 2, py + cs / 2, cs * 0.22, '#fcd535');
        } else if (cellVal === 'r') {
          this.cell(ctx, px, py, cs, 'rgba(255,92,92,0.15)', 'rgba(255,92,92,0.3)', 0);
        } else if (cellVal === 'g') {
          this.cell(ctx, px, py, cs, 'rgba(69,209,133,0.15)', 'rgba(69,209,133,0.3)', 0);
        } else if (cellVal === 'y') {
          this.cell(ctx, px, py, cs, 'rgba(252,213,53,0.15)', 'rgba(252,213,53,0.3)', 0);
        } else if (cellVal === 'b') {
          this.cell(ctx, px, py, cs, 'rgba(92,156,255,0.15)', 'rgba(92,156,255,0.3)', 0);
        } else if (cellVal === 'H') {
          const qi = qc(c, r);
          if (qi >= 0 && qi < this.pc) {
            this.cell(ctx, px, py, cs, C[qi].fill, C[qi].dark, 0);
          } else {
            this.cell(ctx, px, py, cs, '#12122a', '#1a1a3a', 0);
          }
        } else if ('GRYB'.includes(cellVal)) {
          // Token starting spots inside home
          const qi = qc(c, r);
          this.cell(ctx, px, py, cs, C[qi].fill, C[qi].dark, 0);
          const cpx = px + cs / 2;
          const cpy = py + cs / 2;
          // Draw circle base
          this.circle(ctx, cpx, cpy, cs * 0.3, 'rgba(0,0,0,0.4)');
          this.circle(ctx, cpx, cpy, cs * 0.26, C[qi].bg);
          ctx.strokeStyle = C[qi].light;
          ctx.lineWidth = 1;
          this.circle(ctx, cpx, cpy, cs * 0.26, 'rgba(0,0,0,0)');
          ctx.stroke();
        } else if (cellVal === 'C') {
          this.drawCenter(ctx, px, py, cs, c, r);
        }
      }
    }

    // Home base borders with rounded corners
    [[0, 9, 0], [0, 0, 1], [9, 0, 2], [9, 9, 3]].forEach(([sc, sr, ci]) => {
      if (ci >= this.pc) return;
      const bx = sc * cs;
      const by = sr * cs;
      const bw = 6 * cs;

      // Outer border
      this.rr(ctx, bx + 2, by + 2, bw - 4, bw - 4, cs * 0.8);
      ctx.strokeStyle = C[ci].bg;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = C[ci].bg;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner decorative line
      this.rr(ctx, bx + cs * 0.8, by + cs * 0.8, bw - cs * 1.6, bw - cs * 1.6, cs * 0.5);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Start markers
    [0, 13, 26, 39].forEach((idx, i) => {
      if (i >= this.pc) return;
      const [tc, tr] = TK[idx];
      const cx = (tc + 0.5) * cs;
      const cy = (tr + 0.5) * cs;
      this.star(ctx, cx, cy, cs * 0.2, C[i].bg);
    });
  }

  drawCenter(ctx: CanvasRenderingContext2D, px: number, py: number, cs: number, col: number, row: number) {
    if (col === 7 && row === 7) {
      // Finish/winning square - decorative
      ctx.fillStyle = '#1a1a30';
      ctx.fillRect(px, py, cs, cs);
      const cx = px + cs / 2;
      const cy = py + cs / 2;

      // Glow behind
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs * 0.5);
      grd.addColorStop(0, 'rgba(252,213,53,0.3)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(px, py, cs, cs);

      // Crown icon
      ctx.fillStyle = '#fcd535';
      ctx.font = `bold ${Math.floor(cs * 0.45)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑', cx, cy);
      return;
    }
    let tc = '#1a1a28';
    if (row < 7) tc = 'rgba(252,213,53,0.12)';
    else if (row > 7) tc = 'rgba(255,92,92,0.12)';
    else if (col < 7) tc = 'rgba(69,209,133,0.12)';
    else tc = 'rgba(92,156,255,0.12)';
    ctx.fillStyle = tc;
    ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
  }

  drawTokens(ctx: CanvasRenderingContext2D, cs: number) {
    const t = this.frame;
    for (let pi = 0; pi < this.pc; pi++) {
      const p = this.pl[pi];
      if (p.done) continue;
      const pos = this.tokenPix(pi);
      const c = C[pi];
      const r = cs * 0.32;

      // Current player pulse glow
      if (pi === this.cur && !this.an.on) {
        const pulse = Math.sin(t * 0.06) * 0.5 + 0.5;
        const glowR = r + 4 + pulse * 4;
        const grd = ctx.createRadialGradient(pos.x, pos.y, r, pos.x, pos.y, glowR);
        grd.addColorStop(0, `rgba(255,255,255,${0.3 + pulse * 0.4})`);
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shadow underneath
      this.circle(ctx, pos.x + 2, pos.y + 2, r, 'rgba(0,0,0,0.5)');

      // Main token body (circle)
      this.circle(ctx, pos.x, pos.y, r, c.bg);

      // Inner gradient highlight
      const hgrd = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.4, 0, pos.x, pos.y, r);
      hgrd.addColorStop(0, c.light);
      hgrd.addColorStop(0.6, c.bg);
      hgrd.addColorStop(1, c.dark);
      ctx.fillStyle = hgrd;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Border ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = c.dark;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Specular highlight (small white dot)
      this.circle(ctx, pos.x - r * 0.35, pos.y - r * 0.35, r * 0.25, 'rgba(255,255,255,0.35)');

      // Letter inside token
      ctx.fillStyle = '#fff';
      const fontSize = Math.max(8, Math.floor(r * 0.9));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pi === 0 ? 'U' : c.name[0], pos.x, pos.y + 0.5);
    }

    // Click hint arrow
    if (this.moving && !this.an.on && this.cur === 0) {
      const pos = this.tokenPix(0);
      const pulse = Math.sin(t * 0.1) * 0.5 + 0.5;
      const arrowY = pos.y - cs * 0.65;

      ctx.fillStyle = `rgba(255,255,255,${0.6 + pulse * 0.4})`;
      ctx.font = `bold ${Math.floor(cs * 0.3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAP 👆', pos.x, arrowY);
    }
  }
}
