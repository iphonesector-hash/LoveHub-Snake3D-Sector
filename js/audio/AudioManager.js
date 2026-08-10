/**
 * AudioManager — placeholder-ready professional audio system.
 * Drop real audio files under /assets/audio/ and map them in TRACKS / SFX.
 * Until assets exist, uses Web Audio API synthesized cues (safe, no external deps).
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = 0.7;
    this.musicVol = 0.45;
    this.sfxVol = 0.7;
    this.muteMusic = false;
    this.muteSfx = false;
    this._currentWorld = null;
    this._musicNode = null;
    this._enabled = true;
    try {
      const s = JSON.parse(localStorage.getItem('snake3d_audio') || '{}');
      if (s.master != null) this.master = s.master;
      if (s.musicVol != null) this.musicVol = s.musicVol;
      if (s.sfxVol != null) this.sfxVol = s.sfxVol;
      if (s.muteMusic != null) this.muteMusic = s.muteMusic;
      if (s.muteSfx != null) this.muteSfx = s.muteSfx;
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

  save() {
    localStorage.setItem('snake3d_audio', JSON.stringify({
      master: this.master, musicVol: this.musicVol, sfxVol: this.sfxVol,
      muteMusic: this.muteMusic, muteSfx: this.muteSfx,
    }));
  }

  setMaster(v) { this.master = Math.max(0, Math.min(1, v)); this.save(); }
  setMusicVol(v) { this.musicVol = Math.max(0, Math.min(1, v)); this.save(); }
  setSfxVol(v) { this.sfxVol = Math.max(0, Math.min(1, v)); this.save(); }
  setMuteMusic(m) { this.muteMusic = !!m; this.save(); }
  setMuteSfx(m) { this.muteSfx = !!m; this.save(); }

  playSfx(id) {
    if (!this._enabled || this.muteSfx || !this._ensure()) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const vol = this.master * this.sfxVol * 0.18;
    const map = {
      eat: [520, 0.06], crystal: [680, 0.08], star: [880, 0.1],
      power: [440, 0.12], boost: [200, 0.05], collision: [120, 0.1],
      death: [90, 0.25], loot: [600, 0.07], levelup: [660, 0.2],
      event: [300, 0.15], click: [400, 0.04], mission: [520, 0.12],
    };
    const [freq, dur] = map[id] || [350, 0.06];
    o.type = id === 'death' || id === 'collision' ? 'sawtooth' : 'sine';
    o.frequency.setValueAtTime(freq, now);
    if (id === 'levelup' || id === 'star') o.frequency.linearRampToValueAtTime(freq * 1.5, now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(now); o.stop(now + dur + 0.02);
  }

  enterWorld(worldId) {
    this._currentWorld = worldId;
    this.playSfx('event');
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }
}

export const audio = new AudioManager();
