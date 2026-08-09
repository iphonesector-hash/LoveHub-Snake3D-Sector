import * as THREE from 'three';

const DEFS = {
  speed: { color: 0x40a0ff, duration: 6 },
  bite: { color: 0xff4060, duration: 8 },
  star: { color: 0xffe060, duration: 0 },
  shield: { color: 0x60ffb0, duration: 5 },
  prize: { color: 0xc060ff, duration: 0 },
  magnet: { color: 0xff80ff, duration: 7 },
  ghost: { color: 0xc0c0ff, duration: 5 },
  multiplier: { color: 0xffd040, duration: 8 },
  freeze: { color: 0x80e0ff, duration: 4 },
  shockwave: { color: 0xff8040, duration: 0 },
  golden_bite: { color: 0xffc020, duration: 7 },
  teleport: { color: 0xa0ff80, duration: 0 },
  double_xp: { color: 0x80ffc0, duration: 12 },
};

const WEIGHTS = [
  ['speed', 0.12], ['bite', 0.1], ['shield', 0.09], ['magnet', 0.09],
  ['ghost', 0.07], ['multiplier', 0.07], ['freeze', 0.07], ['star', 0.07],
  ['prize', 0.06], ['shockwave', 0.06], ['golden_bite', 0.07],
  ['teleport', 0.05], ['double_xp', 0.08],
];

export class PowerUp {
  constructor(scene, x, z, type = 'speed') {
    this.scene = scene;
    this.type = type;
    this.def = DEFS[type] || DEFS.speed;
    this.alive = true;
    this._x = x;
    this._z = z;
    this._t = Math.random() * 10;
    this.mat = new THREE.MeshStandardMaterial({
      color: this.def.color, emissive: this.def.color, emissiveIntensity: 0.65,
      metalness: 0.5, roughness: 0.25,
    });
    this.mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), this.mat);
    this.mesh.position.set(x, 0.55, z);
    scene.add(this.mesh);
  }

  update(dt, time) {
    if (!this.alive) return;
    this._t += dt;
    this.mesh.position.y = 0.55 + Math.sin(time * 3 + this._t) * 0.16;
    this.mesh.rotation.y += dt * 2.2;
  }

  getPosition() { return this.mesh.position; }

  collect() {
    this.alive = false;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mat.dispose();
    return { type: this.type, duration: this.def.duration };
  }

  dispose() { if (this.alive) this.collect(); }
}

export function spawnPowerUp(scene) {
  let r = Math.random(), acc = 0, type = 'speed';
  for (const [t, w] of WEIGHTS) { acc += w; if (r <= acc) { type = t; break; } }
  return new PowerUp(scene, 0, 0, type);
}
