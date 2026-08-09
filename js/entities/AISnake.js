import { Snake } from './Snake.js';

const COLORS = [
  [0xff6b9d, 0xe05080], [0xffb040, 0xe09030], [0x60ff90, 0x40c070], [0xc060ff, 0xa040e0],
  [0xff6060, 0xd04040], [0x40e0ff, 0x20b0d0], [0xffe060, 0xd0c040], [0xa0a0ff, 0x7070e0],
];

export class AISnake extends Snake {
  constructor(scene, options = {}) {
    super(scene, options);
    this.isAI = true;
    this.thinkT = 0;
    this.wander = { x: 0, z: -1 };
    const c = COLORS[(Math.random() * COLORS.length) | 0];
    this.headMat.color.setHex(c[0]);
    this.headMat.emissive.setHex(0x201010);
    this.bodyMat.color.setHex(c[1]);
    const a = Math.random() * Math.PI * 2;
    const r = 15 + Math.random() * 40;
    const ox = Math.cos(a) * r;
    const oz = Math.sin(a) * r;
    for (const s of this.segments) {
      s.x += ox; s.z += oz;
      s.mesh.position.set(s.x, 0.34, s.z);
    }
    for (const h of this.history) { h.x += ox; h.z += oz; }
    this.heading.set(-Math.cos(a), 0, -Math.sin(a));
    this.desired.copy(this.heading);
  }

  aiUpdate(dt, foods, playerHead, playerAlive) {
    if (!this.alive) return;
    this.thinkT -= dt;
    if (this.thinkT <= 0) {
      this.thinkT = 0.25 + Math.random() * 0.35;
      let best = null, bestD = 1e9;
      for (const f of foods) {
        if (!f.alive) continue;
        const p = f.getPosition ? f.getPosition() : null;
        if (!p) continue;
        const d = Math.hypot(this.segments[0].x - p.x, this.segments[0].z - p.z);
        if (d < bestD) { bestD = d; best = p; }
      }
      const hx = this.segments[0].x, hz = this.segments[0].z;
      if (playerAlive && playerHead) {
        const pd = Math.hypot(hx - playerHead.x, hz - playerHead.z);
        if (pd < 12 && Math.random() < 0.5) {
          this.wander.x = hx - playerHead.x;
          this.wander.z = hz - playerHead.z;
        } else if (best) {
          this.wander.x = best.x - hx;
          this.wander.z = best.z - hz;
        }
      } else if (best) {
        this.wander.x = best.x - hx;
        this.wander.z = best.z - hz;
      } else {
        this.wander.x += (Math.random() - 0.5) * 2;
        this.wander.z += (Math.random() - 0.5) * 2;
      }
      const len = Math.hypot(this.wander.x, this.wander.z) || 1;
      this.wander.x /= len; this.wander.z /= len;
    }
    this.update(dt, this.wander, 0.9, this.length > 12 && Math.random() < 0.002);
  }
}
