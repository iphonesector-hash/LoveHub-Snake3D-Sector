/**
 * Sector Arena — playable arena environment
 */

import * as THREE from 'three';

export class SectorCity {
  constructor(scene) {
    this.scene = scene;
    this.bounds = 28;
    this.group = new THREE.Group();
    scene.add(this.group);
    this._build();
  }

  _build() {
    const groundGeo = new THREE.CircleGeometry(this.bounds + 2, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1f2e,
      metalness: 0.15,
      roughness: 0.85,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    const grid = new THREE.GridHelper(this.bounds * 2, 40, 0x2a3a55, 0x222a3a);
    grid.position.y = 0.02;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    this.group.add(grid);

    const wallGeo = new THREE.TorusGeometry(this.bounds, 0.35, 8, 96);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3d5a80,
      metalness: 0.4,
      roughness: 0.5,
      emissive: 0x0a1525,
      emissiveIntensity: 0.2,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.rotation.x = Math.PI / 2;
    wall.position.y = 0.35;
    wall.castShadow = true;
    this.group.add(wall);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(this.bounds * 0.55, 0.08, 6, 64),
      new THREE.MeshStandardMaterial({
        color: 0x00a8c8,
        emissive: 0x004455,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.5,
      })
    );
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.05;
    this.group.add(ring2);

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x2c3548,
      metalness: 0.3,
      roughness: 0.6,
      emissive: 0x111820,
      emissiveIntensity: 0.15,
    });
    const accents = [0x00c4d4, 0x5e7ce6, 0x4a9fff];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = this.bounds * 0.78;
      const h = 1.2 + (i % 3) * 0.6;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, h, 8), pillarMat);
      p.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      p.castShadow = true;
      this.group.add(p);
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({
          color: accents[i % 3],
          emissive: accents[i % 3],
          emissiveIntensity: 0.6,
        })
      );
      tip.position.set(Math.cos(a) * r, h + 0.15, Math.sin(a) * r);
      this.group.add(tip);
    }

    const center = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.12, 32),
      new THREE.MeshStandardMaterial({
        color: 0x243044,
        metalness: 0.25,
        roughness: 0.7,
        emissive: 0x0a1828,
        emissiveIntensity: 0.25,
      })
    );
    center.position.y = 0.06;
    center.receiveShadow = true;
    this.group.add(center);

    this.obstacles = [];
    const positions = [
      [8, 8], [-9, 6], [10, -7], [-7, -10], [0, 12], [14, 2], [-12, -3], [5, -14],
    ];
    for (const [x, z] of positions) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.7, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x2a3348, metalness: 0.2, roughness: 0.75 })
      );
      box.position.set(x, 0.35, z);
      box.castShadow = true;
      box.receiveShadow = true;
      this.group.add(box);
      this.obstacles.push({ pos: new THREE.Vector3(x, 0, z), radius: 1.0 });
    }

    const pGeo = new THREE.BufferGeometry();
    const count = 80;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * this.bounds * 0.9;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = 0.5 + Math.random() * 3;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0x6a8ab0, size: 0.08, transparent: true, opacity: 0.4 })
    );
    this.group.add(pts);
    this._pts = pts;
  }

  checkCollision(pos, radius = 0.3) {
    const d = Math.hypot(pos.x, pos.z);
    if (d + radius > this.bounds - 0.2) return true;
    for (const o of this.obstacles) {
      if (pos.distanceTo(o.pos) < o.radius + radius) return true;
    }
    return false;
  }

  update(dt, time) {
    if (this._pts) this._pts.rotation.y = time * 0.02;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
