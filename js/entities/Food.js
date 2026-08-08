/**
 * Food / crystals — collectibles for growth loop
 */

import * as THREE from 'three';

const COLORS = [0x3dffb5, 0xffd24a, 0xff6b9d, 0x6bc5ff, 0xc79bff];

export class Food {
  constructor(scene, x, z, type = 'orb') {
    this.scene = scene;
    this.alive = true;
    this.value = type === 'crystal' ? 3 : 1;
    this.growAmount = type === 'crystal' ? 2 : 1;
    this.type = type;
    this._t = Math.random() * Math.PI * 2;
    const color = COLORS[(Math.random() * COLORS.length) | 0];
    const size = type === 'crystal' ? 0.32 : 0.2;
    const geo = type === 'crystal' ? new THREE.OctahedronGeometry(size, 0) : new THREE.SphereGeometry(size, 12, 10);
    this.mat = new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.3, emissive: color, emissiveIntensity: 0.45 });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.set(x, 0.35, z);
    this.mesh.castShadow = true;
    scene.add(this.mesh);
    this._baseY = 0.35;
    this._x = x;
    this._z = z;
  }
  getPosition() { return this.mesh.position; }
  update(dt, time) {
    if (!this.alive) return;
    this._t += dt;
    this.mesh.position.y = this._baseY + Math.sin(time * 2.5 + this._t) * 0.12;
    this.mesh.rotation.y += dt * 1.4;
    if (this.type === 'crystal') this.mesh.rotation.x += dt * 0.8;
  }
  collect() {
    this.alive = false;
    this.scene.remove(this.mesh);
    this.mesh.geometry?.dispose();
    this.mat?.dispose();
  }
  dispose() { if (this.alive) this.collect(); }
}

export function spawnFood(scene, bounds = 36, existing = []) {
  let x, z, tries = 0;
  do {
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * (bounds - 6);
    x = Math.cos(a) * r;
    z = Math.sin(a) * r;
    tries++;
  } while (tries < 12 && existing.some((f) => f.alive && Math.hypot(f._x - x, f._z - z) < 2.2));
  const type = Math.random() < 0.12 ? 'crystal' : 'orb';
  return new Food(scene, x, z, type);
}
