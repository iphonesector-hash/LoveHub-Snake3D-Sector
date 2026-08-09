import * as THREE from 'three';
import { ZONE_TYPES } from '../worlds/WorldDefs.js';
export const CHUNK_SIZE = 48;
const ACTIVE_RADIUS = 2;
export class ChunkStreamer {
  constructor(scene, worldDef) {
    this.scene = scene; this.worldDef = worldDef; this.chunks = new Map();
    this.group = new THREE.Group(); scene.add(this.group);
  }
  key(cx, cz) { return `${cx},${cz}`; }
  worldToChunk(x, z) { return { cx: Math.floor(x / CHUNK_SIZE), cz: Math.floor(z / CHUNK_SIZE) }; }
  update(playerX, playerZ) {
    const { cx, cz } = this.worldToChunk(playerX, playerZ);
    const needed = new Set();
    for (let dx = -ACTIVE_RADIUS; dx <= ACTIVE_RADIUS; dx++)
      for (let dz = -ACTIVE_RADIUS; dz <= ACTIVE_RADIUS; dz++)
        needed.add(this.key(cx + dx, cz + dz));
    for (const k of [...this.chunks.keys()]) if (!needed.has(k)) this._disposeChunk(k);
    for (const k of needed) {
      if (!this.chunks.has(k)) {
        const [sx, sz] = k.split(',').map(Number);
        this._buildChunk(sx, sz);
      }
    }
  }
  _hash(cx, cz) { let h = (cx * 73856093) ^ (cz * 19349663); return ((h >>> 0) % 100000) / 100000; }
  _buildChunk(cx, cz) {
    const g = new THREE.Group();
    const ox = cx * CHUNK_SIZE + CHUNK_SIZE * 0.5, oz = cz * CHUNK_SIZE + CHUNK_SIZE * 0.5;
    const h = this._hash(cx, cz);
    const zone = ZONE_TYPES[(Math.floor(h * ZONE_TYPES.length)) % ZONE_TYPES.length];
    const d = this.worldDef;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(CHUNK_SIZE - 0.5, CHUNK_SIZE - 0.5),
      new THREE.MeshStandardMaterial({
        color: d.ground, metalness: zone === 'industrial' ? 0.4 : 0.12, roughness: zone === 'crystal' ? 0.35 : 0.9,
        emissive: zone === 'danger' ? d.accent : 0x000000, emissiveIntensity: zone === 'danger' ? 0.08 : 0,
      })
    );
    ground.rotation.x = -Math.PI / 2; ground.position.set(ox, 0, oz); g.add(ground);
    if (zone === 'open' || zone === 'arena') {
      const grid = new THREE.GridHelper(CHUNK_SIZE * 0.9, 6, d.gridA, d.gridB);
      grid.position.set(ox, 0.04, oz);
      const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
      mats.forEach((m) => { m.opacity = 0.22; m.transparent = true; });
      g.add(grid);
    }
    const propCount = zone === 'open' ? 2 : zone === 'forest' || zone === 'crystal' ? 7 : 4;
    for (let i = 0; i < propCount; i++) {
      const px = ox + (this._hash(cx + i * 3, cz - i) - 0.5) * CHUNK_SIZE * 0.85;
      const pz = oz + (this._hash(cx - i, cz + i * 5) - 0.5) * CHUNK_SIZE * 0.85;
      g.add(this._makeProp(px, pz, zone, d, h + i * 0.07));
    }
    if (zone === 'treasure' || zone === 'recovery' || zone === 'boss') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(6, 6.4, 32),
        new THREE.MeshBasicMaterial({ color: zone === 'treasure' ? 0xffd060 : zone === 'recovery' ? 0x60ffb0 : 0xff4060, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2; ring.position.set(ox, 0.08, oz); g.add(ring);
    }
    this.group.add(g);
    this.chunks.set(this.key(cx, cz), { group: g, zone, cx, cz, ox, oz });
  }
  _makeProp(x, z, zone, d, seed) {
    const theme = d.theme; let mesh;
    const col = d.propColors[(Math.floor(seed * 10) % d.propColors.length)];
    if (theme === 'cyber' || theme === 'neon') {
      const h = 2 + seed * 8;
      mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2 + seed, h, 1.2 + seed * 0.5),
        new THREE.MeshStandardMaterial({ color: col, metalness: 0.55, roughness: 0.35, emissive: d.accent, emissiveIntensity: 0.15 + seed * 0.2 }));
      mesh.position.set(x, h * 0.5, z);
    } else if (theme === 'crystal') {
      mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.8 + seed * 1.5, 0),
        new THREE.MeshStandardMaterial({ color: d.accent, metalness: 0.6, roughness: 0.2, emissive: d.accent, emissiveIntensity: 0.35, transparent: true, opacity: 0.85 }));
      mesh.position.set(x, 1 + seed, z); mesh.rotation.y = seed * 6;
    } else if (theme === 'ember') {
      mesh = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.5 + seed * 3, 5),
        new THREE.MeshStandardMaterial({ color: 0x3a1810, emissive: 0xff4020, emissiveIntensity: 0.25 + seed * 0.3, roughness: 0.7 }));
      mesh.position.set(x, 0.8 + seed, z);
    } else if (theme === 'void') {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2 + seed * 4, 6),
        new THREE.MeshStandardMaterial({ color: col, metalness: 0.7, roughness: 0.3, emissive: d.accent, emissiveIntensity: 0.2 }));
      mesh.position.set(x, 1 + seed * 2, z);
    } else {
      mesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2 + seed * 4, 4),
        new THREE.MeshStandardMaterial({ color: 0xd0f0ff, metalness: 0.3, roughness: 0.25, emissive: d.accent, emissiveIntensity: 0.2, transparent: true, opacity: 0.8 }));
      mesh.position.set(x, 1 + seed * 2, z);
    }
    return mesh;
  }
  _disposeChunk(k) {
    const c = this.chunks.get(k); if (!c) return;
    this.group.remove(c.group);
    c.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose()); else o.material.dispose(); }
    });
    this.chunks.delete(k);
  }
  getZoneAt(x, z) {
    const { cx, cz } = this.worldToChunk(x, z);
    return this.chunks.get(this.key(cx, cz))?.zone || 'open';
  }
  setWorldDef(def) {
    this.worldDef = def;
    for (const k of [...this.chunks.keys()]) this._disposeChunk(k);
  }
  dispose() {
    for (const k of [...this.chunks.keys()]) this._disposeChunk(k);
    this.scene.remove(this.group);
  }
}
