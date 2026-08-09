const POOL = [
  { id: 'orbs', label: 'Collect 25 orbs', labelFa: '۲۵ گوی جمع کن', target: 25, key: 'orbs', reward: 40 },
  { id: 'ai', label: 'Defeat 2 AI', labelFa: '۲ مار AI شکست بده', target: 2, key: 'kills', reward: 60 },
  { id: 'mass', label: 'Reach mass 20', labelFa: 'جرم ۲۰ برس', target: 20, key: 'mass', reward: 50 },
  { id: 'survive', label: 'Survive 90s', labelFa: '۹۰ ثانیه زنده بمان', target: 90, key: 'time', reward: 45 },
  { id: 'crystal', label: 'Collect 5 crystals', labelFa: '۵ کریستال', target: 5, key: 'crystals', reward: 55 },
  { id: 'combo', label: 'Reach combo x5', labelFa: 'کمبو x5', target: 5, key: 'combo', reward: 50 },
  { id: 'power', label: 'Use 3 power-ups', labelFa: '۳ پاورآپ', target: 3, key: 'powers', reward: 40 },
];
export class MissionSystem {
  constructor(engine) {
    this.engine = engine; this.current = null; this.progress = 0;
    this.stats = { orbs: 0, kills: 0, crystals: 0, powers: 0, time: 0 };
  }
  start() {
    this.stats = { orbs: 0, kills: 0, crystals: 0, powers: 0, time: 0 };
    this.current = { ...POOL[(Math.random() * POOL.length) | 0] };
    this.progress = 0;
    this.engine.onMission?.(this._payload());
  }
  _payload() {
    if (!this.current) return null;
    return { label: this.current.label, labelFa: this.current.labelFa, progress: this.progress, target: this.current.target, done: this.progress >= this.current.target };
  }
  track(key, amount = 1) {
    if (!this.current) return;
    if (key === this.current.key) {
      if (['mass','combo','time'].includes(this.current.key)) this.progress = amount;
      else this.progress += amount;
      if (this.progress >= this.current.target) {
        this.engine.snake?.addScore(this.current.reward);
        this.engine.onScore?.(this.engine.snake.score, this.engine.snake.combo);
        this.engine.onMission?.({ ...this._payload(), done: true });
        setTimeout(() => { if (this.engine.state === 'playing') this.start(); }, 2000);
      } else this.engine.onMission?.(this._payload());
    }
  }
  update(dt) {
    if (!this.current) return;
    this.stats.time += dt;
    if (this.current.key === 'time') this.track('time', this.stats.time);
    if (this.current.key === 'mass') this.track('mass', this.engine.snake?.length || 0);
    if (this.current.key === 'combo') this.track('combo', this.engine.snake?.combo || 1);
  }
  reset() { this.current = null; this.progress = 0; }
}
