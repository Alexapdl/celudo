"use client";

import { useCallback, useEffect } from "react";

// We'll use Web Audio API oscillator for synthetic retro sounds
// This avoids needing actual audio files and keeps the build self-contained

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private bgmOsc: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }
    return this.ctx;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume = 0.15, fadeOut = true) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      if (fadeOut) {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      /* AudioContext may be suspended */
    }
  }

  diceTick = () => {
    // Rapid ticking sound for dice anticipation
    this.playTone(800, "square", 0.05, 0.08);
  };

  diceLand = (value: number) => {
    // Thud + pitch based on value
    const base = 200 + value * 80;
    this.playTone(base, "triangle", 0.3, 0.2);
    setTimeout(() => this.playTone(base * 0.7, "sine", 0.2, 0.1), 50);
  };

  tokenMove = () => {
    // Cute bloop
    this.playTone(440, "sine", 0.1, 0.1);
    setTimeout(() => this.playTone(660, "sine", 0.1, 0.08), 80);
  };

  capture = () => {
    // Crash sound
    this.playTone(150, "sawtooth", 0.3, 0.15);
    setTimeout(() => this.playTone(100, "square", 0.3, 0.12), 60);
  };

  winFanfare = () => {
    // Victory arpeggio
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, "triangle", 0.4, 0.15), i * 150);
    });
    // Bass hit
    setTimeout(() => this.playTone(130, "square", 0.6, 0.2), 600);
  };

  loseSound = () => {
    // Sad descending
    this.playTone(440, "sine", 0.3, 0.1);
    setTimeout(() => this.playTone(349, "sine", 0.3, 0.1), 200);
    setTimeout(() => this.playTone(262, "sine", 0.5, 0.1), 400);
  };

  buttonClick = () => {
    this.playTone(880, "sine", 0.05, 0.06);
  };

  toastSound = (type: "success" | "error" | "info") => {
    const freq = type === "success" ? 880 : type === "error" ? 220 : 660;
    this.playTone(freq, "sine", 0.15, 0.08);
  };

  startBGM = () => {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      if (this.bgmOsc) return; // already playing
      this.bgmOsc = ctx.createOscillator();
      this.bgmGain = ctx.createGain();
      this.bgmOsc.type = "sine";
      this.bgmOsc.frequency.setValueAtTime(220, ctx.currentTime);
      this.bgmGain.gain.setValueAtTime(0.03, ctx.currentTime);
      this.bgmOsc.connect(this.bgmGain);
      this.bgmGain.connect(ctx.destination);
      this.bgmOsc.start();
    } catch {
      /* ignore */
    }
  };

  stopBGM = () => {
    try {
      if (this.bgmOsc) {
        this.bgmOsc.stop();
        this.bgmOsc.disconnect();
        this.bgmOsc = null;
      }
      if (this.bgmGain) {
        this.bgmGain.disconnect();
        this.bgmGain = null;
      }
    } catch {
      /* ignore */
    }
  };

  toggle = () => {
    this.enabled = !this.enabled;
    return this.enabled;
  };

  isEnabled = () => this.enabled;
}

export const soundManager = new SoundManager();

export function useSound() {
  const resumeAudio = useCallback(() => {
    const ctx = soundManager["ctx"];
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
  }, []);

  useEffect(() => {
    const handler = () => resumeAudio();
    document.addEventListener("click", handler, { once: true });
    return () => document.removeEventListener("click", handler);
  }, [resumeAudio]);

  return soundManager;
}
