/**
 * Food / crystals — collectibles for growth loop
 */

import * as THREE from 'three';

const COLORS = [0x3dffb5, 0xffd24a, 0xff6b9d, 0x6bc5ff, 0xc79bff, 0xff9a5c];

export class Food {
  constructor(scene, x, z, type = 'orb') {
    this.scene = scene;
    this.alive = true;
    this.value = type === 'crystal' ? 3 : 1;
    this.growAmount = type === 'crystal' ? 2 : 1;
    this.type = type;
    this._t = Math.random() * Math.PI * 2;
    this._x = x;
    this._z = z;
    const color = COLORS[(Math.random() * COLORS.length) | 0];
    const size = type === 'crystal' ? 0.34 : 0.22;
    const geo = type === 'crystal'
      ? new THREE.OctahedronGeometry(size, 0)
      : new THREE.SphereGeometry(size, 12, 10);
    this.mat = new THREE.MeshStandardMaterial({
      color, metalness: 0.4, roughness: 0.28, emissive: color, emissiveIntensity: 0.55,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.set(x, 0.38, z);
    this.mesh.castShadow = true;
    scene.add(this.mesh);
    this._baseY = 0.38;
  }

  getPosition() { return this.mesh.position; }

  update(dt, time) {
    if (!this.alive) return;
    this._t += dt;
    this.mesh.position.y = this._baseY + Math.sin(time * 2.8 + this._t) * 0.14;
    this.mesh.rotation.y += dt * 1.6;
    if (this.type === 'crystal') this.mesh.rotation.x += dt * 0.9;
  }

  collect() {
    this.alive = false;
    this.scene.remove(this.mesh);
    this.mesh.geometry?.dispose();
    this.mat?.dispose();
  }

  dispose() { if (this.alive) this.collect(); }
}

export function spawnFood(scene, bounds = 40, existing = []) {
  let x, z, tries = 0;
  do {
    const a = Math.random() * Math.PI * 2;
    const r = 5 + Math.random() * (bounds - 8);
    x = Math.cos(a) * r;
    z = Math.sin(a) * r;
    tries++;
  } while (tries < 16 && existing.some((f) => f.alive && Math.hypot(f._x - x, f._z - z) < 2.0));
  const type = Math.random() < 0.14 ? 'crystal' : 'orb';
  return new Food(scene, x, z, type);
}
