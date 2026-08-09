import * as THREE from 'three';

export const WORLD_DEFS = {
  sectorCity: { id: 'sectorCity', name: 'Sector City', nameFa: 'شهر سکتور', bg: 0x0a1424, fog: 0x0a1424, fogDensity: 0.008, ground: 0x0e1a2e, gridA: 0x1a3a5c, gridB: 0x122438, ring: 0x2ee6ff, wall: 0x152438, accent: 0x3dffb5, bounds: 200 },
  neonDistrict: { id: 'neonDistrict', name: 'Neon District', nameFa: 'منطقه نئون', bg: 0x120818, fog: 0x120818, fogDensity: 0.009, ground: 0x1a0e22, gridA: 0x5a2080, gridB: 0x2a1038, ring: 0xff4fd8, wall: 0x2a1238, accent: 0xff9a3c, bounds: 200 },
  crystalReef: { id: 'crystalReef', name: 'Crystal Reef', nameFa: 'صخره کریستال', bg: 0x061820, fog: 0x061820, fogDensity: 0.008, ground: 0x0a2430, gridA: 0x1a6070, gridB: 0x0e3040, ring: 0x40f0d0, wall: 0x0e3040, accent: 0x80ffe0, bounds: 200 },
  emberValley: { id: 'emberValley', name: 'Ember Valley', nameFa: 'دره اخگر', bg: 0x180a08, fog: 0x180a08, fogDensity: 0.009, ground: 0x221208, gridA: 0x603018, gridB: 0x301808, ring: 0xff8040, wall: 0x301808, accent: 0xffd060, bounds: 200 },
  voidStation: { id: 'voidStation', name: 'Void Station', nameFa: 'ایستگاه خلاء', bg: 0x060610, fog: 0x060610, fogDensity: 0.007, ground: 0x0c0c1a, gridA: 0x303060, gridB: 0x181830, ring: 0x8090ff, wall: 0x181830, accent: 0xc0d0ff, bounds: 220 },
  auroraPeak: { id: 'auroraPeak', name: 'Aurora Peak', nameFa: 'قله شفق', bg: 0x081218, fog: 0x081218, fogDensity: 0.008, ground: 0x0c1c28, gridA: 0x208060, gridB: 0x103040, ring: 0x50ffc0, wall: 0x103040, accent: 0xa0ffe0, bounds: 200 },
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
      new THREE.PlaneGeometry(size * 1.5, size * 1.5),
      new THREE.MeshStandardMaterial({ color: d.ground, metalness: 0.15, roughness: 0.92 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);
    const grid = new THREE.GridHelper(size, Math.floor(this.bounds / 4), d.gridA, d.gridB);
    grid.position.y = 0.02;
    const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
    mats.forEach((m) => { m.opacity = 0.28; m.transparent = true; });
    this.group.add(grid);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(this.bounds * 0.95, this.bounds * 0.96, 128),
      new THREE.MeshBasicMaterial({ color: d.ring, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    this.group.add(ring);
  }

  applySceneTheme(scene) {
    scene.background = new THREE.Color(this.def.bg);
    scene.fog = new THREE.FogExp2(this.def.fog, this.def.fogDensity);
  }

  checkCollision() { return false; }

  softClamp(pos) {
    const lim = this.bounds - 1;
    if (pos.x > lim) pos.x = lim;
    if (pos.x < -lim) pos.x = -lim;
    if (pos.z > lim) pos.z = lim;
    if (pos.z < -lim) pos.z = -lim;
  }

  update() {}
  dispose() { this.scene.remove(this.group); }
}
