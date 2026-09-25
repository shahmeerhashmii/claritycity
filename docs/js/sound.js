// sound.js - Soft, calibrated Web Audio synthesizer for control room chimes

class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.volume = 0.30; // 30% default volume
    this.lastSoundTime = 0;
    this.minIntervalSec = 1.5; // Rate limit: max 1 sound per 1.5s
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle(enable) {
    this.enabled = enable;
    if (this.enabled) {
      this.init();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Major incident alert: soft, two-tone calm chime (< 0.8s)
  playEmergencyAlarm() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastSoundTime < this.minIntervalSec) return;
    this.lastSoundTime = now;

    try {
      // First tone (D5: 587.33 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(this.volume * 0.18, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second tone (A4: 440.00 Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440.00, now + 0.12);

      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch (e) {}
  }

  // Soft predictive sensor ping: gentle single high chime (A5: 880 Hz)
  playPredictivePing() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastSoundTime < this.minIntervalSec) return;
    this.lastSoundTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880.00, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }
}

export const soundManager = new SoundFX();
