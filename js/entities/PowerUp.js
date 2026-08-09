import * as THREE from 'three';

const DEFS = {
  speed:  { color: 0x40a0ff, label: 'SPD', duration: 6 },
  bite:   { color: 0xff4060, label: 'BITE', duration: 8 },
  star:   { color: 0xffe060, label: 'STAR', duration: 0 },
  shield: { color: 0x60ffb0, label: 'SHD', duration: 5 },
  prize:  { color: 0xc060ff, label: '$$$', duration: 0 },
};

export class PowerUp {
  constructor(scene, x, z, type = 'speed') {
    this.scene = scene;
    this.type = type;
    this.def = DEFS[type] || DEFS.speed;
    this.alive = true;
    this._x = x; this._z = z;
    this._t = Math.random() * 10;
    const geo = new THREE.OctahedronGeometry(0.42, 0);
    this.mat = new THREE.MeshStandardMaterial({
      color: this.def.color, emissive: this.def.color, emissiveIntensity: 0.7,
      metalness: 0.5, roughness: 0.25,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.set(x, 0.55, z);
    scene.add(this.mesh);
  }
  update(dt, time) {
    if (!this.alive) return;
    this._t += dt;
    this.mesh.position.y = 0.55 + Math.sin(time * 3 + this._t) * 0.18;
    this.mesh.rotation.y += dt * 2.5;
    this.mesh.rotation.x += dt * 1.2;
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

export function spawnPowerUp(scene, bounds, existing = []) {
  let x, z, tries = 0;
  do {
    x = (Math.random() - 0.5) * bounds * 1.6;
    z = (Math.random() - 0.5) * bounds * 1.6;
    tries++;
  } while (tries < 20 && existing.some((p) => p.alive && Math.hypot(p._x - x, p._z - z) < 6));
  const types = ['speed', 'bite', 'star', 'shield', 'prize'];
  const weights = [0.28, 0.22, 0.18, 0.15, 0.17];
  let r = Math.random(), type = 'speed', acc = 0;
  for (let i = 0; i < types.length; i++) {
    acc += weights[i];
    if (r <= acc) { type = types[i]; break; }
  }
  return new PowerUp(scene, x, z, type);
}
