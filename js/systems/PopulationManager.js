import { spawnFood } from '../entities/Food.js';
import { spawnPowerUp } from '../entities/PowerUp.js';
import { AISnake } from '../entities/AISnake.js';
import { pickAIType } from '../data/aiTypes.js';

const MAX_FOOD = 55, MAX_POWER = 12, MAX_AI = 10, DESPAWN_DIST = 120;
const MIN_AI_SPAWN = 28, MAX_AI_SPAWN = 90;

export class PopulationManager {
  constructor(engine) { this.engine = engine; }
  update(dt) {
    const e = this.engine;
    if (!e.snake?.alive) return;
    const hx = e.snake.segments[0].x, hz = e.snake.segments[0].z;
    this._maintainFood(hx, hz);
    this._maintainPower(hx, hz);
    this._maintainAI(hx, hz);
  }
  _dist(x, z, hx, hz) { return Math.hypot(x - hx, z - hz); }
  _maintainFood(hx, hz) {
    const e = this.engine;
    for (let i = e.foods.length - 1; i >= 0; i--) {
      const f = e.foods[i];
      if (!f.alive) { e.foods.splice(i, 1); continue; }
      const p = f.getPosition();
      if (this._dist(p.x, p.z, hx, hz) > DESPAWN_DIST) { f.dispose(); e.foods.splice(i, 1); }
    }
    let guard = 0;
    while (e.foods.length < MAX_FOOD && guard++ < 20) {
      const ang = Math.random() * Math.PI * 2, r = 12 + Math.random() * 70;
      const x = hx + Math.cos(ang) * r, z = hz + Math.sin(ang) * r;
      e.foods.push(spawnFood(e.scene, 40, [], e.spawnOpts || {}));
      const f = e.foods[e.foods.length - 1];
      f._x = x; f._z = z; f.mesh.position.set(x, 0.38, z);
    }
  }
  _maintainPower(hx, hz) {
    const e = this.engine;
    for (let i = e.powerUps.length - 1; i >= 0; i--) {
      const p = e.powerUps[i];
      if (!p.alive) { e.powerUps.splice(i, 1); continue; }
      if (this._dist(p._x, p._z, hx, hz) > DESPAWN_DIST) { p.dispose(); e.powerUps.splice(i, 1); }
    }
    let guard = 0;
    while (e.powerUps.length < MAX_POWER && guard++ < 10) {
      const ang = Math.random() * Math.PI * 2, r = 20 + Math.random() * 75;
      const x = hx + Math.cos(ang) * r, z = hz + Math.sin(ang) * r;
      const pu = spawnPowerUp(e.scene);
      pu._x = x; pu._z = z; pu.mesh.position.set(x, 0.55, z);
      e.powerUps.push(pu);
    }
  }
  _maintainAI(hx, hz) {
    const e = this.engine;
    for (let i = e.ais.length - 1; i >= 0; i--) {
      const ai = e.ais[i];
      if (!ai.alive) { ai.dispose(); e.ais.splice(i, 1); continue; }
      const ax = ai.segments[0].x, az = ai.segments[0].z;
      if (this._dist(ax, az, hx, hz) > DESPAWN_DIST * 1.15) { ai.dispose(); e.ais.splice(i, 1); }
    }
    const bias = e.worldDef?.aiBias;
    let guard = 0;
    while (e.ais.length < MAX_AI && guard++ < 8) {
      const ang = Math.random() * Math.PI * 2;
      const r = MIN_AI_SPAWN + Math.random() * (MAX_AI_SPAWN - MIN_AI_SPAWN);
      const x = hx + Math.cos(ang) * r, z = hz + Math.sin(ang) * r;
      const type = pickAIType(bias);
      const ai = new AISnake(e.scene, { startLength: 5 + ((Math.random() * 6) | 0), aiType: type });
      const dx = x - ai.segments[0].x, dz = z - ai.segments[0].z;
      for (const s of ai.segments) { s.x += dx; s.z += dz; s.mesh.position.set(s.x, 0.34, s.z); }
      for (const h of ai.history) { h.x += dx; h.z += dz; }
      e.ais.push(ai);
    }
  }
}
