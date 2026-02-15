window.Platformer = window.Platformer || {};

Platformer.Beeper = class {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        this.enabled = false;
        return;
      }
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  tone(freq, duration, type = "square", gainValue = 0.05) {
    if (!this.ctx || !this.enabled) return;
    const settings = Platformer.Settings ? Platformer.Settings.current : null;
    if (settings && !settings.accessibility.audioCues) return;

    let mix = 1;
    if (settings) {
      mix = (settings.audio.master / 100) * (settings.audio.sfx / 100);
      if (settings.audio.muteWhenUnfocused && document.hidden) {
        mix = 0;
      }
    }
    if (mix <= 0) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainValue * mix, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  jump() {
    this.tone(420, 0.08, "square", 0.05);
  }

  coin() {
    this.tone(880, 0.06, "triangle", 0.06);
    this.tone(1320, 0.08, "triangle", 0.045);
  }

  damage() {
    this.tone(180, 0.14, "sawtooth", 0.06);
  }

  stomp() {
    this.tone(240, 0.09, "square", 0.055);
  }

  dash() {
    this.tone(520, 0.05, "triangle", 0.05);
    this.tone(340, 0.06, "square", 0.035);
  }

  attack() {
    this.tone(300, 0.04, "sawtooth", 0.045);
    this.tone(220, 0.05, "square", 0.03);
  }

  land() {
    this.tone(140, 0.05, "square", 0.03);
  }
};

Platformer.beeper = new Platformer.Beeper();
