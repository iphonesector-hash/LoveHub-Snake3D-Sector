/**
 * Premium arena builder — clean playfield, no dead decorations
 */

import * as THREE from 'three';

export const WORLD_DEFS = {
  sectorCity: { id: 'sectorCity', name: 'Sector City', nameFa: 'شهر سکتور', bg: 0x0a1424, fog: 0x0a1424, fogDensity: 0.014, ground: 0x0e1a2e, gridA: 0x1a3a5c, gridB: 0x122438, ring: 0x2ee6ff, wall: 0x152438, accent: 0x3dffb5, bounds: 40 },
  neonDistrict: { id: 'neonDistrict', name: 'Neon District', nameFa: 'منطقه نئون', bg: 0x120818, fog: 0x120818, fogDensity: 0.016, ground: 0x1a0e22, gridA: 0x5a2080, gridB: 0x2a1038, ring: 0xff4fd8, wall: 0x2a1238, accent: 0xff9a3c, bounds: 38 },
  crystalReef: { id: 'crystalReef', name: 'Crystal Reef', nameFa: 'صخره کریستال', bg: 0x061820, fog: 0x061820, fogDensity: 0.015, ground: 0x0a2430, gridA: 0x1a6070, gridB: 0x0e3040, ring: 0x40f0d0, wall: 0x0e3040, accent: 0x80ffe0, bounds: 42 },
  emberValley: { id: 'emberValley', name: 'Ember Valley', nameFa: 'دره اخگر', bg: 0x180a08, fog: 0x180a08, fogDensity: 0.015, ground: 0x221208, gridA: 0x603018, gridB: 0x301808, ring: 0xff8040, wall: 0x301808, accent: 0xffd060, bounds: 36 },
  voidStation: { id: 'voidStation', name: 'Void Station', nameFa: 'ایستگاه خلاء', bg: 0x060610, fog: 0x060610, fogDensity: 0.012, ground: 0x0c0c1a, gridA: 0x303060, gridB: 0x181830, ring: 0x8090ff, wall: 0x181830, accent: 0xc0d0ff, bounds: 44 },
  auroraPeak: { id: 'auroraPeak', name: 'Aurora Peak', nameFa: 'قله شفق', bg: 0x081218, fog: 0x081218, fogDensity: 0.013, ground: 0x0c1c28, gridA: 0x208060, gridB: 0x103040, ring: 0x50ffc0, wall: 0x103040, accent: 0xa0ffe0, bounds: 40 },
};

export class SectorCity {
  constructor(scene, worldId = 'sectorCity') {
    this.scene = scene;
    this.def = WORLD_DEFS[worldId] || WORLD_DEFS.sectorCity;
    this.bounds = this.def.bounds;
    this.group = new THREE.Group();
    scene.add(this.group);
    this._build();
  }

  _build() {
    const d = this.def;
    const size = this.bounds * 2;
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(this.bounds + 3, 72),
      new THREE.MeshStandardMaterial({ color: d.ground, metalness: 0.2, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    const grid = new THREE.GridHelper(size, Math.floor(this.bounds / 1.5), d.gridA, d.gridB);
    grid.position.y = 0.03;
    const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
    mats.forEach((m) => { m.opacity = 0.35; m.transparent = true; });
    this.group.add(grid);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(this.bounds - 0.5, this.bounds - 0.1, 96),
      new THREE.MeshStandardMaterial({ color: d.ring, emissive: d.ring, emissiveIntensity: 0.35, metalness: 0.5, roughness: 0.35, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    this.group.add(ring);

    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(this.bounds, this.bounds, 0.9, 64, 1, true),
      new THREE.MeshStandardMaterial({ color: d.wall, emissive: d.wall, emissiveIntensity: 0.15, metalness: 0.25, roughness: 0.65, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    wall.position.y = 0.45;
    this.group.add(wall);

    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 32),
      new THREE.MeshStandardMaterial({ color: d.ground, emissive: d.accent, emissiveIntensity: 0.12, metalness: 0.3, roughness: 0.6 })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.04;
    this.group.add(pad);
    this._t = 0;
  }

  applySceneTheme(scene) {
    const d = this.def;
    scene.background = new THREE.Color(d.bg);
    scene.fog = new THREE.FogExp2(d.fog, d.fogDensity);
  }

  checkCollision(pos, radius = 0.3) {
    return Math.hypot(pos.x, pos.z) + radius > this.bounds - 0.45;
  }

  update(dt, time) { this._t = time; }
  dispose() { this.scene.remove(this.group); }
}
