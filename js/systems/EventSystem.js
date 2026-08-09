const EVENT_COOLDOWN = 45;
const EVENT_DURATION = 18;
const EVENTS = [
  { id: 'food_storm', label: 'FOOD STORM', labelFa: 'طوفان غذا', color: '#3dffb5' },
  { id: 'ai_invasion', label: 'AI INVASION', labelFa: 'هجوم AI', color: '#ff6060' },
  { id: 'crystal_storm', label: 'CRYSTAL STORM', labelFa: 'طوفان کریستال', color: '#40f0d0' },
  { id: 'golden_zone', label: 'GOLDEN ZONE', labelFa: 'منطقه طلایی', color: '#ffd060' },
  { id: 'cyber_rush', label: 'CYBER RUSH', labelFa: 'هجوم سایبر', color: '#2ee6ff' },
  { id: 'meteor', label: 'METEOR SHOWER', labelFa: 'بارش شهاب', color: '#ff8040' },
];
export class EventSystem {
  constructor(engine) {
    this.engine = engine; this.active = null; this.timer = 0; this.cooldown = 20;
  }
  update(dt) {
    if (this.active) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.active = null; this.cooldown = EVENT_COOLDOWN * (0.7 + Math.random() * 0.6);
        this.engine.onEvent?.(null);
      }
      return;
    }
    this.cooldown -= dt;
    if (this.cooldown <= 0 && Math.random() < 0.02) this._start(EVENTS[(Math.random() * EVENTS.length) | 0]);
  }
  _start(ev) {
    this.active = { ...ev }; this.timer = EVENT_DURATION;
    this.engine.onEvent?.(this.active);
    if (ev.id === 'food_storm' || ev.id === 'crystal_storm') this.engine.maxFood = Math.min(90, (this.engine.maxFood || 55) + 25);
    if (ev.id === 'ai_invasion') this.engine.maxAI = Math.min(14, (this.engine.maxAI || 10) + 4);
    if (ev.id === 'cyber_rush' && this.engine.snake) this.engine.snake._baseSpeedMult = 1.25;
  }
  getScoreMult() {
    if (!this.active) return 1;
    if (this.active.id === 'golden_zone' || this.active.id === 'cyber_rush') return 2;
    return 1;
  }
  reset() { this.active = null; this.timer = 0; this.cooldown = 25; this.engine.onEvent?.(null); }
}
