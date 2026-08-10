/**
 * AudioManager — synthesized SFX via Web Audio API (no external assets required).
 * Handles mobile autoplay restrictions, volume settings, mute, and haptic feedback.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = 0.7;
    this.musicVol = 0.45;
    this.sfxVol = 0.7;
    this.muteMusic = false;
    this.muteSfx = false;
    this.haptic = true;
    this._currentWorld = null;
    this._enabled = true;
    this._unlocked = false;
    try {
      const s = JSON.parse(localStorage.getItem('snake3d_audio') || '{}');
      if (s.master != null) this.master = s.master;
      if (s.musicVol != null) this.musicVol = s.musicVol;
      if (s.sfxVol != null) this.sfxVol = s.sfxVol;
      if (s.muteMusic != null) this.muteMusic = s.muteMusic;
      if (s.muteSfx != null) this.muteSfx = s.muteSfx;
      if (s.haptic != null) this.haptic = s.haptic;
    } catch {}
  }

  _ensure() {
    if (this.ctx) return true;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      return true;
    } catch {
      return false;
    }
  }

  /** Call on first user gesture to unlock audio on mobile */
  unlock() {
    if (this._unlocked) return;
    if (!this._ensure()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this._unlocked = true;
  }

  save() {
    localStorage.setItem('snake3d_audio', JSON.stringify({
      master: this.master, musicVol: this.musicVol, sfxVol: this.sfxVol,
      muteMusic: this.muteMusic, muteSfx: this.muteSfx, haptic: this.haptic,
    }));
  }

  setMaster(v) { this.master = Math.max(0, Math.min(1, v)); this.save(); }
  setMusicVol(v) { this.musicVol = Math.max(0, Math.min(1, v)); this.save(); if (this._musicTimer) this.startMusic(this._musicTheme); }
  setSfxVol(v) { this.sfxVol = Math.max(0, Math.min(1, v)); this.save(); }
  setMuteMusic(m) { this.muteMusic = !!m; this.save(); if (m) this.stopMusic(); else if (this._musicTheme) this.startMusic(this._musicTheme); }
  setMuteSfx(m) { this.muteSfx = !!m; this.save(); }
  setHaptic(h) { this.haptic = !!h; this.save(); }

  vibrate(pattern) {
    if (!this.haptic) return;
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch {}
  }


  /** Procedural gameplay music — layered bass, chords, arpeggio, percussion.
   *  World-specific BPM, scale, and density. Not sample tracks; continuous during play.
   */
  startMusic(theme = 'cyber') {
    if (this.muteMusic || !this._ensure()) return;
    this.stopMusic();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this._musicTheme = theme;
    this._musicNodes = [];
    this._musicTimer = null;
    this._musicBeat = 0;
    this._musicStep = 0;
    const cfg = this._themeConfig(theme);
    this._musicCfg = cfg;
    this._scheduleMusicLoop();
  }

  stopMusic() {
    if (this._musicTimer) { clearTimeout(this._musicTimer); this._musicTimer = null; }
    if (this._musicNodes) {
      for (const n of this._musicNodes) {
        try { n.stop?.(); n.disconnect?.(); } catch {}
      }
    }
    this._musicNodes = [];
  }

  setMusicTheme(theme) {
    if (theme === this._musicTheme && this._musicTimer) return;
    this.startMusic(theme);
  }

  _themeConfig(theme) {
    const configs = {
      cyber:    { bpm: 96,  scale: [110,138,165,220,277,330], bass: 55,  perc: true,  density: 0.7, wave: 'square' },
      neon:     { bpm: 118, scale: [98,123,147,196,247,294],  bass: 49,  perc: true,  density: 0.85,wave: 'sawtooth' },
      forest:   { bpm: 72,  scale: [130,146,164,196,246,294], bass: 65,  perc: false, density: 0.45,wave: 'sine' },
      green:    { bpm: 80,  scale: [146,164,174,220,261,329], bass: 73,  perc: false, density: 0.5, wave: 'triangle' },
      mountain: { bpm: 68,  scale: [82,110,123,164,196,246],  bass: 41,  perc: false, density: 0.4, wave: 'sine' },
      canyon:   { bpm: 76,  scale: [87,110,130,174,207,261],  bass: 44,  perc: true,  density: 0.5, wave: 'triangle' },
      coastal:  { bpm: 88,  scale: [123,146,165,196,247,294], bass: 62,  perc: false, density: 0.55,wave: 'sine' },
      desert:   { bpm: 84,  scale: [92,110,138,185,220,277],  bass: 46,  perc: true,  density: 0.55,wave: 'triangle' },
      ember:    { bpm: 100, scale: [73,92,110,146,185,220],   bass: 37,  perc: true,  density: 0.8, wave: 'sawtooth' },
      crystal:  { bpm: 90,  scale: [174,196,220,261,329,392], bass: 87,  perc: false, density: 0.6, wave: 'sine' },
      aurora:   { bpm: 64,  scale: [98,123,147,196,247,330],  bass: 49,  perc: false, density: 0.35,wave: 'sine' },
      void:     { bpm: 70,  scale: [55,73,82,110,146,165],    bass: 28,  perc: false, density: 0.4, wave: 'sawtooth' },
      ruins:    { bpm: 74,  scale: [110,130,138,165,207,247], bass: 55,  perc: true,  density: 0.5, wave: 'triangle' },
      sky:      { bpm: 92,  scale: [165,185,220,247,294,370], bass: 82,  perc: false, density: 0.6, wave: 'sine' },
    };
    return configs[theme] || configs.cyber;
  }

  _playTone(freq, type, start, dur, vol) {
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, start);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(Math.min(4000, freq * 6), start);
      g.gain.setValueAtTime(0.001, start);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.connect(f); f.connect(g); g.connect(this.ctx.destination);
      o.start(start); o.stop(start + dur + 0.05);
      this._musicNodes.push(o);
    } catch {}
  }

  _scheduleMusicLoop() {
    if (this.muteMusic || !this.ctx || !this._musicCfg) return;
    const cfg = this._musicCfg;
    const now = this.ctx.currentTime;
    const beatMs = 60000 / cfg.bpm;
    const stepDur = beatMs / 1000;
    const vol = this.master * this.musicVol;
    const scale = cfg.scale;
    const step = this._musicStep | 0;

    if (step % 2 === 0) {
      this._playTone(cfg.bass, 'sine', now, stepDur * 1.6, vol * 0.11);
      this._playTone(cfg.bass * 2, 'triangle', now + 0.02, stepDur * 1.2, vol * 0.04);
    }
    if (step % 4 === 0) {
      const root = scale[step % scale.length];
      this._playTone(root, cfg.wave, now, stepDur * 3.2, vol * 0.06);
      this._playTone(root * 1.25, 'sine', now + 0.05, stepDur * 2.8, vol * 0.04);
      this._playTone(root * 1.5, 'triangle', now + 0.08, stepDur * 2.5, vol * 0.03);
    }
    if (Math.random() < cfg.density) {
      const note = scale[(step + (step % 3)) % scale.length];
      this._playTone(note * 2, 'sine', now + stepDur * 0.25, stepDur * 0.9, vol * 0.07);
    }
    if (cfg.density > 0.55 && Math.random() < 0.4) {
      const note = scale[(step * 2 + 1) % scale.length];
      this._playTone(note * 2, cfg.wave, now + stepDur * 0.55, stepDur * 0.5, vol * 0.05);
    }
    if (cfg.perc && step % 2 === 0) {
      try {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(180, now);
        o.frequency.exponentialRampToValueAtTime(40, now + 0.08);
        g.gain.setValueAtTime(vol * 0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(now); o.stop(now + 0.15);
        this._musicNodes.push(o);
      } catch {}
    }

    this._musicStep = step + 1;
    if (this._musicNodes.length > 40) {
      const old = this._musicNodes.splice(0, 20);
      for (const n of old) { try { n.disconnect?.(); } catch {} }
    }
    this._musicTimer = setTimeout(() => this._scheduleMusicLoop(), beatMs);
  }

  playBossMusic() {
    this.startMusic('ember');
  }

  playGameOverMusic() {
    this.stopMusic();
    if (!this._ensure() || this.muteMusic) return;
    try {
      const now = this.ctx.currentTime;
      const vol = this.master * this.musicVol * 0.1;
      this._playTone(60, 'sawtooth', now, 1.2, vol);
      this._playTone(45, 'sine', now + 0.1, 1.5, vol * 0.8);
    } catch {}
  }

  playVictoryMusic() {
    if (!this._ensure() || this.muteMusic) return;
    try {
      const now = this.ctx.currentTime;
      const vol = this.master * this.musicVol * 0.1;
      [523, 659, 784, 1046].forEach((f, i) => this._playTone(f, 'sine', now + i * 0.12, 0.4, vol));
    } catch {}
  }

  playSfx(id) {
    if (!this._enabled || this.muteSfx || !this._ensure()) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const vol = this.master * this.sfxVol * 0.18;
      const map = {
        eat: [520, 0.06, 'sine'],
        crystal: [680, 0.08, 'sine'],
        star: [880, 0.1, 'sine'],
        power: [440, 0.12, 'triangle'],
        boost: [200, 0.05, 'sawtooth'],
        collision: [120, 0.1, 'sawtooth'],
        death: [90, 0.25, 'sawtooth'],
        loot: [600, 0.07, 'sine'],
        levelup: [660, 0.2, 'sine'],
        event: [300, 0.15, 'triangle'],
        click: [400, 0.04, 'sine'],
        mission: [520, 0.12, 'sine'],
        kill: [180, 0.14, 'sawtooth'],
        shield: [360, 0.1, 'triangle'],
        chest: [720, 0.15, 'sine'],
        teleport: [200, 0.12, 'sine'],
        bite: [150, 0.1, 'sawtooth'],
      };
      const [freq, dur, type] = map[id] || [350, 0.06, 'sine'];
      o.type = type;
      o.frequency.setValueAtTime(freq, now);
      if (id === 'levelup' || id === 'star' || id === 'chest') {
        o.frequency.linearRampToValueAtTime(freq * 1.5, now + dur);
      }
      if (id === 'death' || id === 'collision') {
        o.frequency.linearRampToValueAtTime(freq * 0.5, now + dur);
      }
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(now); o.stop(now + dur + 0.02);
    } catch {}

    if (id === 'eat' || id === 'loot') this.vibrate(8);
    else if (id === 'power' || id === 'crystal' || id === 'star') this.vibrate(15);
    else if (id === 'kill' || id === 'bite') this.vibrate([10, 30, 20]);
    else if (id === 'collision') this.vibrate(30);
    else if (id === 'death') this.vibrate([40, 60, 80]);
    else if (id === 'chest' || id === 'levelup') this.vibrate([20, 40, 20]);
  }

  enterWorld(worldId, musicTheme) {
    this._currentWorld = worldId;
    this.playSfx('event');
    const theme = musicTheme || worldId || 'cyber';
    const map = {
      sectorCity: 'cyber', neonDistrict: 'neon', crystalReef: 'crystal',
      emberValley: 'ember', voidStation: 'void', auroraPeak: 'aurora',
      greenValley: 'green', deepForest: 'forest', mountainPass: 'mountain',
      canyonLands: 'canyon', coastalParadise: 'coastal', ancientRuins: 'ruins',
      desertWastes: 'desert', skyIslands: 'sky',
    };
    this.startMusic(map[theme] || map[worldId] || 'cyber');
  }

  resume() {
    this.unlock();
  }
}

export const audio = new AudioManager();
