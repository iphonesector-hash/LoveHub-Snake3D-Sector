import * as THREE from 'three';

const GEO = new THREE.SphereGeometry(0.28, 10, 8);

export class LootOrb {
  constructor(scene, x, z, opts = {}) {
    this.scene = scene;
    this.alive = true;
    this._x = x;
    this._z = z;
    this.value = opts.value ?? 1;
    this.growAmount = opts.grow ?? 1;
    this.xp = opts.xp ?? 2;
    this.coins = opts.coins ?? 0;
    this.life = opts.life ?? 18;
    this._t = Math.random() * 6;
    this.vx = opts.vx ?? (Math.random() - 0.5) * 8;
    this.vz = opts.vz ?? (Math.random() - 0.5) * 8;
    this.vy = opts.vy ?? 4 + Math.random() * 3;
    this.y = 0.6;
    this.settled = false;
    const col = opts.color ?? 0xffd060;
    this.mat = new THREE.MeshStandardMaterial({
      color: col, emissive: col, emissiveIntensity: 0.7, metalness: 0.4, roughness: 0.3,
    });
    this.mesh = new THREE.Mesh(GEO, this.mat);
    this.mesh.position.set(x, this.y, z);
    scene.add(this.mesh);
  }

  update(dt, time) {
    if (!this.alive) return;
    this.life -= dt;
    if (this.life <= 0) { this.collect(true); return; }
    this._t += dt;
    if (!this.settled) {
      this._x += this.vx * dt;
      this._z += this.vz * dt;
      this.y += this.vy * dt;
      this.vy -= 14 * dt;
      this.vx *= (1 - 2.5 * dt);
      this.vz *= (1 - 2.5 * dt);
      if (this.y <= 0.38) {
        this.y = 0.38;
        this.vy = 0;
        this.vx *= 0.4;
        this.vz *= 0.4;
        if (Math.abs(this.vx) + Math.abs(this.vz) < 0.4) this.settled = true;
      }
    } else {
      this.y = 0.38 + Math.sin(time * 3 + this._t) * 0.1;
    }
    this.mesh.position.set(this._x, this.y, this._z);
    this.mesh.rotation.y += dt * 2;
    if (this.life < 4) this.mat.opacity = Math.max(0.2, this.life / 4);
    this.mat.transparent = this.life < 4;
  }

  getPosition() { return this.mesh.position; }

  collect(silent = false) {
    if (!this.alive) return null;
    this.alive = false;
    this.scene.remove(this.mesh);
    this.mesh.geometry = null;
    this.mat.dispose();
    if (silent) return null;
    return { value: this.value, grow: this.growAmount, xp: this.xp, coins: this.coins };
  }

  dispose() { if (this.alive) this.collect(true); }
}

export function spawnLootExplosion(scene, x, z, mass, opts = {}) {
  const n = Math.min(28, Math.max(4, Math.floor(mass * 0.55) + (opts.bonus || 0)));
  const orbs = [];
  const elite = !!opts.elite;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const sp = 3 + Math.random() * (elite ? 10 : 7);
    orbs.push(new LootOrb(scene, x, z, {
      value: elite ? 3 : 1 + ((Math.random() * 2) | 0),
      grow: elite && i < 3 ? 2 : 1,
      xp: elite ? 6 : 2,
      coins: elite && Math.random() < 0.25 ? 1 : 0,
      color: elite ? 0xffe080 : (opts.color ?? 0x60ffb0),
      vx: Math.cos(ang) * sp,
      vz: Math.sin(ang) * sp,
      vy: 3 + Math.random() * 4,
      life: 14 + Math.random() * 8,
    }));
  }
  return orbs;
}
