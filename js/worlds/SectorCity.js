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
    const size = this.bounds * 2;
    const groundGeo = new THREE.CircleGeometry(this.bounds + 2, 64);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x121a28, metalness: 0.15, roughness: 0.85 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    const grid = new THREE.GridHelper(size, 42, 0x1e3a5f, 0x162033);
    grid.position.y = 0.02;
    grid.material.opacity = 0.45;
    grid.material.transparent = true;
    this.group.add(grid);

    const ringGeo = new THREE.RingGeometry(this.bounds - 0.6, this.bounds - 0.15, 96);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x2ee6ff, emissive: 0x0a6080, emissiveIntensity: 0.35,
      metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    this.group.add(ring);

    const wallGeo = new THREE.CylinderGeometry(this.bounds, this.bounds, 1.2, 64, 1, true);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a2740, emissive: 0x0a1830, emissiveIntensity: 0.2,
      metalness: 0.3, roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0.85,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 0.6;
    this.group.add(wall);

    const pillarGeo = new THREE.BoxGeometry(1.2, 3.5, 1.2);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x243550, metalness: 0.4, roughness: 0.5, emissive: 0x102030, emissiveIntensity: 0.25,
    });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const r = this.bounds - 6;
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(Math.cos(a) * r, 1.75, Math.sin(a) * r);
      p.castShadow = true;
      p.receiveShadow = true;
      this.group.add(p);
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.2, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x3dffb5, emissive: 0x1a8060, emissiveIntensity: 0.5 })
      );
      cap.position.set(Math.cos(a) * r, 3.6, Math.sin(a) * r);
      this.group.add(cap);
    }

    const padGeo = new THREE.CylinderGeometry(4, 4.5, 0.25, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x1a2840, metalness: 0.35, roughness: 0.55, emissive: 0x0c1830, emissiveIntensity: 0.25,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.12;
    pad.receiveShadow = true;
    this.group.add(pad);

    const dotGeo = new THREE.CircleGeometry(0.35, 12);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0x3dffb5, emissive: 0x1a8060, emissiveIntensity: 0.4, transparent: true, opacity: 0.7,
    });
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * (this.bounds - 12);
      const d = new THREE.Mesh(dotGeo, dotMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(Math.cos(a) * r, 0.04, Math.sin(a) * r);
      this.group.add(d);
    }
    this._t = 0;
  }

  checkCollision(pos, radius = 0.3) {
    return Math.hypot(pos.x, pos.z) + radius > this.bounds - 0.5;
  }

  update(dt, time) { this._t = time; }
  dispose() { this.scene.remove(this.group); }
}
