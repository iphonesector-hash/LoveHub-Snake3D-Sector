const EVENT_COOLDOWN = 40;
const EVENT_DURATION = 16;
const EVENTS = [
  { id: 'food_storm', label: 'FOOD STORM', labelFa: '\u0637\u0648\u0641\u0627\u0646 \u063a\u0630\u0627', color: '#3dffb5' },
  { id: 'ai_invasion', label: 'AI INVASION', labelFa: '\u0647\u062c\u0648\u0645 AI', color: '#ff6060' },
  { id: 'crystal_storm', label: 'CRYSTAL STORM', labelFa: '\u0637\u0648\u0641\u0627\u0646 \u06a9\u0631\u06cc\u0633\u062a\u0627\u0644', color: '#40f0d0' },
  { id: 'golden_zone', label: 'GOLDEN ZONE', labelFa: '\u0645\u0646\u0637\u0642\u0647 \u0637\u0644\u0627\u06cc\u06cc', color: '#ffd060' },
  { id: 'cyber_rush', label: 'CYBER RUSH', labelFa: '\u0647\u062c\u0648\u0645 \u0633\u0627\u06cc\u0628\u0631', color: '#2ee6ff' },
  { id: 'meteor', label: 'METEOR SHOWER', labelFa: '\u0628\u0627\u0631\u0634 \u0634\u0647\u0627\u0628', color: '#ff8040' },
  { id: 'boss_spawn', label: 'BOSS SPAWN', labelFa: '\u0638\u0647\u0648\u0631 \u0628\u0627\u0633', color: '#c060ff' },
  { id: 'treasure_hunt', label: 'TREASURE HUNT', labelFa: '\u0634\u06a9\u0627\u0631 \u06af\u0646\u062c', color: '#ffd060' },
];

export class EventSystem {
  constructor(engine) {
    this.engine = engine;
    this.active = null;
    this.timer = 0;
    this.cooldown = 18;
  }

  update(dt) {
    if (this.active) {
      this.timer -= dt;
      if (this.timer <= 0) this._end();
      return;
    }
    this.cooldown -= dt;
    if (this.cooldown <= 0 && Math.random() < 0.028) {
      const bias = this.engine.world?.def?.eventBias;
      if (bias) {
        const preferred = EVENTS.find((e) => e.id === bias);
        if (preferred && Math.random() < 0.55) {
          this._start(preferred);
          return;
        }
      }
      this._start(EVENTS[(Math.random() * EVENTS.length) | 0]);
    }
  }

  _start(ev) {
    this.active = { ...ev };
    this.timer = EVENT_DURATION + (ev.id === 'boss_spawn' ? 8 : 0);
    this.engine.onEvent?.(this.active);
    if (ev.id === 'food_storm' || ev.id === 'crystal_storm') {
      this.engine.maxFood = Math.min(100, (this.engine.maxFood || 60) + 30);
      this.engine.spawnOpts = {
        ...(this.engine.spawnOpts || {}),
        crystalBias: ev.id === 'crystal_storm' ? 0.4 : 0.1,
      };
    }
    if (ev.id === 'ai_invasion' || ev.id === 'boss_spawn') {
      this.engine.maxAI = Math.min(16, (this.engine.maxAI || 10) + 5);
    }
    if (ev.id === 'cyber_rush' && this.engine.snake) {
      this.engine.snake._baseSpeedMult = Math.max(this.engine.snake._baseSpeedMult || 1, 1.3);
    }
    if (ev.id === 'meteor' && this.engine.snake) {
      this.engine.snake._baseSpeedMult = Math.max(this.engine.snake._baseSpeedMult || 1, 1.15);
    }
  }

  _end() {
    this.active = null;
    this.cooldown = EVENT_COOLDOWN * (0.65 + Math.random() * 0.7);
    this.engine.onEvent?.(null);
    if (this.engine.snake) {
      const worldSpeed = this.engine.world?.def?.speedBias || 1;
      this.engine.snake._baseSpeedMult = worldSpeed;
    }
  }

  getScoreMult() {
    if (!this.active) return 1;
    if (this.active.id === 'golden_zone' || this.active.id === 'cyber_rush' || this.active.id === 'treasure_hunt') return 2.2;
    if (this.active.id === 'food_storm') return 1.4;
    return 1;
  }

  reset() {
    this.active = null;
    this.timer = 0;
    this.cooldown = 22;
    this.engine.onEvent?.(null);
  }
}
