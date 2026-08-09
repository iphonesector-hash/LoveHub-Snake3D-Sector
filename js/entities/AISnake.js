import { Snake } from './Snake.js';
import { AI_TYPES, AI_NAMES } from '../data/aiTypes.js';
export class AISnake extends Snake {
  constructor(scene, options = {}) {
    super(scene, options);
    this.isAI = true; this.thinkT = 0; this.wander = { x: 0, z: -1 };
    this.aiType = options.aiType || 'explorer';
    const def = AI_TYPES[this.aiType] || AI_TYPES.explorer;
    this.aiDef = def;
    this.displayName = AI_NAMES[(Math.random() * AI_NAMES.length) | 0];
    this.headMat.color.setHex(def.color[0]);
    this.headMat.emissive.setHex(0x201010);
    this.bodyMat.color.setHex(def.color[1]);
    this._baseSpeedMult = def.speed; this.speedMult = def.speed;
    if (def.size !== 1) for (const s of this.segments) s.mesh.scale.setScalar(def.size);
  }
  aiUpdate(dt, foods, playerHead, playerAlive, playerHasBite) {
    if (!this.alive) return;
    this.thinkT -= dt;
    if (this.thinkT <= 0) {
      this.thinkT = 0.2 + Math.random() * 0.35;
      const hx = this.segments[0].x, hz = this.segments[0].z;
      let tx = this.wander.x, tz = this.wander.z;
      const agg = this.aiDef.aggression;
      if (playerAlive && playerHead) {
        const pd = Math.hypot(hx - playerHead.x, hz - playerHead.z);
        if (playerHasBite && pd < 18) { tx = hx - playerHead.x; tz = hz - playerHead.z; }
        else if (['hunter','aggressive','elite'].includes(this.aiType) && pd < 35 && Math.random() < agg) {
          tx = playerHead.x - hx; tz = playerHead.z - hz;
        } else if (this.aiType === 'defensive' && pd < 14) { tx = hx - playerHead.x; tz = hz - playerHead.z; }
      }
      if (this.aiType === 'collector' || this.aiType === 'explorer' || Math.random() < 0.5) {
        let best = null, bestD = 1e9;
        for (const f of foods) {
          if (!f.alive) continue;
          const p = f.getPosition(); const d = Math.hypot(hx - p.x, hz - p.z);
          if (d < bestD && d < 40) { bestD = d; best = p; }
        }
        if (best) { tx = best.x - hx; tz = best.z - hz; }
      }
      if (Math.abs(tx) + Math.abs(tz) < 0.1) { tx = Math.random() - 0.5; tz = Math.random() - 0.5; }
      const len = Math.hypot(tx, tz) || 1; this.wander.x = tx / len; this.wander.z = tz / len;
    }
    this.update(dt, this.wander, 0.85 + this.aiDef.aggression * 0.15, this.aiType === 'speedster' || (this.length > 14 && Math.random() < 0.003));
  }
}
