/**
 * Sector Arena — playable premium mobile arena
 */

import * as THREE from 'three';

export class SectorCity {
  constructor(scene) {
    this.scene = scene;
    this.bounds = 42;
    this.group = new THREE.Group();
    scene.add(this.group);
    this._build();
  }

  _build() {
    const groundGeo = new THREE.CircleGeometry(this.bounds + 2, 64);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1f2e, metalness: 0.15, roughness: 0.85 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    const grid = new THREE.GridHelper(this.bounds * 2, 40, 0x2a3350, 0x222838);
    grid.position.y = 0.02;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    this.group.add(grid);

    const wallH = 1.2;
    const wallGeo = new THREE.CylinderGeometry(this.bounds, this.bounds, wallH, 64, 1, true);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2a3555, metalness: 0.4, roughness: 0.5, side: THREE.DoubleSide,
      emissive: 0x0a1528, emissiveIntensity: 0.25,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = wallH / 2;
    this.group.add(wall);

    const rimGeo = new THREE.TorusGeometry(this.bounds, 0.12, 8, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x3d9eff, emissive: 0x1a60aa, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.3,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = wallH;
    this.group.add(rim);

    const pillarGeo = new THREE.CylinderGeometry(0.45, 0.55, 3.5, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x3a4560, metalness: 0.5, roughness: 0.4, emissive: 0x101828, emissiveIntensity: 0.2,
    });
    const capGeo = new THREE.CylinderGeometry(0.65, 0.45, 0.25, 8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x4aa3ff, emissive: 0x1a5080, emissiveIntensity: 0.5 });
    const positions = [[18,18],[-18,18],[18,-18],[-18,-18],[0,28],[0,-28],[28,0],[-28,0]];
    for (const [x, z] of positions) {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(x, 1.75, z);
      p.castShadow = true;
      p.receiveShadow = true;
      this.group.add(p);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, 3.6, z);
      this.group.add(cap);
    }

    const padGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.15, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x243048, metalness: 0.3, roughness: 0.6, emissive: 0x0c1830, emissiveIntensity: 0.3,
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r = 22;
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(Math.cos(a) * r, 0.08, Math.sin(a) * r);
      pad.receiveShadow = true;
      this.group.add(pad);
    }
    this._t = 0;
  }

  checkCollision(pos, radius = 0.3) {
    const r = Math.hypot(pos.x, pos.z);
    return r + radius > this.bounds - 0.4;
  }

  update(dt, time) { this._t = time; }
  dispose() { this.scene.remove(this.group); }
}
