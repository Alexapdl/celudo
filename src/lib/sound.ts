"use client";

import { useCallback, useEffect } from "react";

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private bgmPlaying = false;
  private bgmGain: GainNode | null = null;
  private bgmTimeout: ReturnType<typeof setTimeout> | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, type: OscillatorType, dur: number, vol = 0.12, delay = 0, dest?: AudioNode) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.connect(gain);
      gain.connect(dest || ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    } catch { /* ignore */ }
  }

  // ===== SFX =====
  tokenMove = () => { this.tone(330, "sine", 0.08, 0.08); this.tone(494, "sine", 0.08, 0.06, 0.06); };
  capture = () => { this.tone(110, "sawtooth", 0.25, 0.12); this.tone(82, "square", 0.25, 0.1, 0.04); };
  winFanfare = () => { [392, 523, 659, 784].forEach((f, i) => this.tone(f, "triangle", 0.35, 0.12, i * 0.12)); this.tone(98, "square", 0.5, 0.15, 0.5); };
  loseSound = () => { this.tone(330, "sine", 0.25, 0.08); this.tone(262, "sine", 0.25, 0.08, 0.15); this.tone(196, "sine", 0.4, 0.08, 0.3); };
  buttonClick = () => { this.tone(660, "sine", 0.04, 0.05); };
  toastSound = (type: "success" | "error" | "info") => { const f = type === "success" ? 660 : type === "error" ? 165 : 494; this.tone(f, "sine", 0.12, 0.06); };

  // ===== PIRATE SEA SHANTY BGM =====
  // A minor pentatonic + dorian flavor, slow tempo
  startBGM = () => {
    if (!this.enabled || this.bgmPlaying) return;
    this.bgmPlaying = true;
    try {
      const ctx = this.getCtx();
      this.bgmGain = ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.035, ctx.currentTime);
      this.bgmGain.connect(ctx.destination);

      // Sea shanty melody: A C D E G A (minor pentatonic)
      // Low slow drone underneath
      const melody: { n: number; d: number }[] = [
        { n: 440, d: 0.55 }, { n: 0, d: 0.1 }, { n: 523, d: 0.35 }, { n: 587, d: 0.45 }, { n: 523, d: 0.25 },
        { n: 440, d: 0.5 }, { n: 0, d: 0.1 }, { n: 392, d: 0.45 }, { n: 440, d: 0.35 }, { n: 523, d: 0.55 },
        { n: 0, d: 0.1 }, { n: 587, d: 0.4 }, { n: 659, d: 0.45 }, { n: 587, d: 0.3 }, { n: 523, d: 0.5 },
        { n: 0, d: 0.15 }, { n: 440, d: 0.55 }, { n: 392, d: 0.3 }, { n: 330, d: 0.6 },
        { n: 0, d: 0.1 }, { n: 587, d: 0.35 }, { n: 523, d: 0.3 }, { n: 440, d: 0.5 }, { n: 392, d: 0.4 },
        { n: 440, d: 0.6 }, { n: 0, d: 0.3 },
      ];
      const loopLen = melody.reduce((s, m) => s + m.d, 0);

      // Drone bass
      const playDrone = () => {
        if (!this.bgmPlaying) return;
        this.tone(110, "sine", loopLen * 0.95, 0.025, 0, this.bgmGain!);
        this.tone(110, "triangle", loopLen * 0.5, 0.012, loopLen * 0.48, this.bgmGain!);
      };

      const playLoop = () => {
        if (!this.bgmPlaying) return;
        playDrone();
        let t = 0;
        melody.forEach(({ n, d }) => {
          if (n > 0) this.tone(n, "sine", d * 0.7, 0.03, t, this.bgmGain!);
          t += d;
        });
        this.bgmTimeout = setTimeout(playLoop, loopLen * 1000);
      };
      playLoop();
    } catch { /* ignore */ }
  };

  stopBGM = () => {
    this.bgmPlaying = false;
    if (this.bgmTimeout) { clearTimeout(this.bgmTimeout); this.bgmTimeout = null; }
    try { if (this.bgmGain) { this.bgmGain.disconnect(); this.bgmGain = null; } } catch { /* ignore */ }
  };

  get enabledStatus() { return this.enabled; }
  get bgmActive() { return this.bgmPlaying; }

  toggle = (): boolean => {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopBGM();
    return this.enabled;
  };

  toggleBGM = (): boolean => {
    if (this.bgmPlaying) { this.stopBGM(); return false; }
    else { if (!this.enabled) this.enabled = true; this.startBGM(); return true; }
  };

  isEnabled = () => this.enabled;
}

export const soundManager = new SoundManager();

export function useSound() {
  const resume = useCallback(() => {
    try { if (soundManager["ctx"] && (soundManager["ctx"] as AudioContext).state === "suspended") (soundManager["ctx"] as AudioContext).resume(); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    const h = () => resume();
    document.addEventListener("click", h, { once: true });
    document.addEventListener("touchstart", h, { once: true });
    return () => { document.removeEventListener("click", h); document.removeEventListener("touchstart", h); };
  }, [resume]);
  return soundManager;
}
