// Procedural Web Audio API sound effects for Casino games (zero external audio files).
class CasinoSoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public isMuted() {
    return this.muted;
  }

  public setMuted(m: boolean) {
    this.muted = m;
  }

  private getCtx(): AudioContext | null {
    if (this.muted || typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    duration = 0.08,
    type: OscillatorType = "sine",
    gain = 0.08,
    delay = 0,
    freqEnd?: number,
  ) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public click() {
    this.tone(540, 0.045, "triangle", 0.05);
  }

  public chip() {
    this.tone(1180, 0.055, "sine", 0.06, 0, 1480);
    this.tone(1680, 0.045, "triangle", 0.04, 0.03);
  }

  public pegHit(pitchScale = 1) {
    this.tone(680 * pitchScale, 0.045, "sine", 0.045);
  }

  public roll() {
    this.tone(360, 0.08, "triangle", 0.05, 0, 520);
  }

  public orbPop(idx = 0) {
    this.tone(420 + (idx % 8) * 45, 0.065, "sine", 0.055);
  }

  public gem() {
    this.tone(784, 0.11, "sine", 0.07, 0, 1175);
    this.tone(1046, 0.13, "triangle", 0.05, 0.04);
  }

  public hop() {
    this.tone(320, 0.08, "sine", 0.07, 0, 620);
  }

  public cardFlip() {
    this.tone(480, 0.05, "triangle", 0.05, 0, 310);
  }

  public reelStop(reelIdx = 0) {
    this.tone(180 + reelIdx * 32, 0.07, "square", 0.035, 0, 110);
  }

  public win(big = false) {
    const notes = big ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [523.25, 659.25, 783.99];
    notes.forEach((f, i) => this.tone(f, big ? 0.18 : 0.12, "triangle", 0.08, i * 0.065));
  }

  public bust() {
    this.tone(240, 0.18, "sawtooth", 0.07, 0, 75);
    this.tone(150, 0.22, "triangle", 0.06, 0.05, 55);
  }
}

export const soundFx = new CasinoSoundEngine();
