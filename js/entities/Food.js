/**
 * Food / crystals — arena collectibles
 */

import * as THREE from 'three';

const COLORS = [0x30d158, 0x00d4ff, 0xff9f0a, 0xbf5af2, 0xff375f];

export class Food {
  constructor(scene, position, type = 'orb') {
    this.scene = scene;
    this.alive = true;
    this.type = type;
    this.value = type === 'crystal' ? 3 : 1;
    this.growAmount = type === 'crystal' ? 2 : 1;
    this._t = Math.random() * 10;

    const color = COLORS[(Math.random() * COLORS.length) | 0];
    const size = type === 'crystal' ? 0.28 : 0.18;
    const geo =
      type === 'crystal'
        ? new THREE.OctahedronGeometry(size, 0)
        : new THREE.SphereGeometry(size, 10, 8);

    this.mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.35,
      emissive: color,
      emissiveIntensity: 0.45,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.copy(position);
    this.mesh.position.y = 0.28;
    this.mesh.castShadow = true;
    scene.add(this.mesh);
    this.baseY = 0.28;
  }

  getPosition() {
    return this.mesh.position;
  }

  update(dt, time) {
    if (!this.alive) return;
    this._t += dt;
    this.mesh.position.y = this.baseY + Math.sin(this._t * 3) * 0.08;
    this.mesh.rotation.y += dt * 1.5;
  }

  collect() {
    this.alive = false;
    this.scene.remove(this.mesh);
    this.mesh.geometry?.dispose();
    this.mat?.dispose();
  }

  dispose() {
    if (this.alive) this.collect();
  }
}

export function spawnFood(scene, bounds = 24, existing = []) {
  let tries = 0;
  let pos;
  do {
    const a = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * (bounds - 4);
    pos = new THREE.Vector3(Math.cos(a) * r, 0.28, Math.sin(a) * r);
    tries++;
  } while (tries < 20 && existing.some((f) => f.alive && f.getPosition().distanceTo(pos) < 1.5));

  const type = Math.random() < 0.18 ? 'crystal' : 'orb';
  return new Food(scene, pos, type);
}
