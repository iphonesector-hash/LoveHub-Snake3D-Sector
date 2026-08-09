import * as THREE from 'three';
import { ZONE_TYPES } from '../worlds/WorldDefs.js';

export const CHUNK_SIZE = 48;
const ACTIVE_RADIUS = 2;

export class ChunkStreamer {
  constructor(scene, worldDef) {
    this.scene = scene;
    this.worldDef = worldDef;
    this.chunks = new Map();
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  key(cx, cz) { return `${cx},${cz}`; }
  worldToChunk(x, z) {
    return { cx: Math.floor(x / CHUNK_SIZE), cz: Math.floor(z / CHUNK_SIZE) };
  }

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

  _hash(cx, cz) {
    let h = (cx * 73856093) ^ (cz * 19349663);
    return ((h >>> 0) % 100000) / 100000;
  }

  _buildChunk(cx, cz) {
    const g = new THREE.Group();
    const ox = cx * CHUNK_SIZE + CHUNK_SIZE * 0.5;
    const oz = cz * CHUNK_SIZE + CHUNK_SIZE * 0.5;
    const h = this._hash(cx, cz);
    const zone = ZONE_TYPES[(Math.floor(h * ZONE_TYPES.length)) % ZONE_TYPES.length];
    const d = this.worldDef;
    const theme = d.theme || 'cyber';

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(CHUNK_SIZE - 0.4, CHUNK_SIZE - 0.4, 2, 2),
      new THREE.MeshStandardMaterial({
        color: d.ground,
        metalness: theme === 'void' || theme === 'cyber' ? 0.45 : theme === 'ember' ? 0.15 : 0.12,
        roughness: theme === 'crystal' || theme === 'aurora' ? 0.3 : theme === 'ember' ? 0.85 : 0.9,
        emissive: zone === 'danger' ? d.accent : (theme === 'ember' ? 0x2a0800 : 0x000000),
        emissiveIntensity: zone === 'danger' ? 0.1 : (theme === 'ember' ? 0.06 : 0),
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(ox, 0, oz);
    g.add(ground);

    if ((zone === 'open' || zone === 'arena') && (theme === 'cyber' || theme === 'neon' || theme === 'void')) {
      const grid = new THREE.GridHelper(CHUNK_SIZE * 0.9, 6, d.gridA, d.gridB);
      grid.position.set(ox, 0.04, oz);
      const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
      mats.forEach((m) => { m.opacity = 0.22; m.transparent = true; });
      g.add(grid);
    }

    const baseProps = theme === 'neon' ? 6 : theme === 'crystal' ? 7 : theme === 'ember' ? 5 : theme === 'void' ? 5 : theme === 'aurora' ? 6 : 5;
    const propCount = zone === 'open' ? Math.max(2, baseProps - 2) : zone === 'forest' || zone === 'crystal' ? baseProps + 1 : baseProps;
    for (let i = 0; i < propCount; i++) {
      const px = ox + (this._hash(cx + i * 3, cz - i) - 0.5) * CHUNK_SIZE * 0.85;
      const pz = oz + (this._hash(cx - i, cz + i * 5) - 0.5) * CHUNK_SIZE * 0.85;
      g.add(this._makeProp(px, pz, zone, d, h + i * 0.07, theme));
    }

    if (h > 0.72) g.add(this._makeLandmark(ox, oz, d, theme, h));

    if (zone === 'treasure' || zone === 'recovery' || zone === 'boss') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(6, 6.4, 32),
        new THREE.MeshBasicMaterial({
          color: zone === 'treasure' ? 0xffd060 : zone === 'recovery' ? 0x60ffb0 : 0xff4060,
          transparent: true, opacity: 0.35, side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(ox, 0.08, oz);
      g.add(ring);
    }

    this.group.add(g);
    this.chunks.set(this.key(cx, cz), { group: g, zone, cx, cz, ox, oz });
  }

  _makeProp(x, z, zone, d, seed, theme) {
    const col = d.propColors[(Math.floor(seed * 10) % d.propColors.length)];
    let mesh;
    if (theme === 'cyber') {
      const h = 2 + seed * 9;
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.1 + seed * 0.6, h, 1.1 + seed * 0.4),
        new THREE.MeshStandardMaterial({
          color: col, metalness: 0.55, roughness: 0.35,
          emissive: d.accent, emissiveIntensity: 0.12 + seed * 0.2,
        })
      );
      mesh.position.set(x, h * 0.5, z);
      if (seed > 0.5) {
        const sign = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.45, 0.08),
          new THREE.MeshBasicMaterial({ color: d.secondary, transparent: true, opacity: 0.85 })
        );
        sign.position.set(0, h * 0.3, 0.65);
        mesh.add(sign);
      }
    } else if (theme === 'neon') {
      const h = 1.5 + seed * 7;
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.9 + seed * 0.5, h, 0.9 + seed * 0.3),
        new THREE.MeshStandardMaterial({
          color: col, metalness: 0.4, roughness: 0.4,
          emissive: d.accent, emissiveIntensity: 0.25 + seed * 0.3,
        })
      );
      mesh.position.set(x, h * 0.5, z);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.6 + seed * 0.4, 0.06, 6, 16),
        new THREE.MeshBasicMaterial({ color: d.secondary, transparent: true, opacity: 0.7 })
      );
      ring.position.y = h * 0.35;
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);
    } else if (theme === 'crystal') {
      const s = 0.7 + seed * 1.9;
      mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(s, 0),
        new THREE.MeshStandardMaterial({
          color: d.accent, metalness: 0.65, roughness: 0.15,
          emissive: d.accent, emissiveIntensity: 0.3 + seed * 0.25,
          transparent: true, opacity: 0.82,
        })
      );
      mesh.position.set(x, 0.9 + seed * 1.3, z);
      mesh.rotation.y = seed * 6;
    } else if (theme === 'ember') {
      mesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.7 + seed * 0.5, 1.4 + seed * 3.2, 5),
        new THREE.MeshStandardMaterial({
          color: 0x2a1008, emissive: 0xff4020,
          emissiveIntensity: 0.2 + seed * 0.35, roughness: 0.65,
        })
      );
      mesh.position.set(x, 0.7 + seed * 0.8, z);
    } else if (theme === 'void') {
      const h = 1.5 + seed * 5;
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.55, h, 6),
        new THREE.MeshStandardMaterial({
          color: col, metalness: 0.72, roughness: 0.28,
          emissive: d.accent, emissiveIntensity: 0.18,
        })
      );
      mesh.position.set(x, h * 0.5, z);
    } else {
      mesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.45 + seed * 0.3, 2 + seed * 5, 5),
        new THREE.MeshStandardMaterial({
          color: 0xd0f0ff, metalness: 0.35, roughness: 0.2,
          emissive: d.accent, emissiveIntensity: 0.18 + seed * 0.15,
          transparent: true, opacity: 0.78,
        })
      );
      mesh.position.set(x, 1 + seed * 2, z);
    }
    return mesh;
  }

  _makeLandmark(ox, oz, d, theme, h) {
    const g = new THREE.Group();
    if (theme === 'cyber') {
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 12, 2.2),
        new THREE.MeshStandardMaterial({
          color: 0x1a3048, metalness: 0.6, roughness: 0.3,
          emissive: d.accent, emissiveIntensity: 0.2,
        })
      );
      tower.position.set(ox, 6, oz);
      g.add(tower);
    } else if (theme === 'neon') {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(5, 0.35, 8, 24, Math.PI),
        new THREE.MeshBasicMaterial({ color: d.accent, transparent: true, opacity: 0.7 })
      );
      arch.position.set(ox, 0.2, oz);
      arch.rotation.x = -Math.PI / 2;
      g.add(arch);
    } else if (theme === 'crystal') {
      const big = new THREE.Mesh(
        new THREE.OctahedronGeometry(3.5, 0),
        new THREE.MeshStandardMaterial({
          color: d.accent, metalness: 0.7, roughness: 0.12,
          emissive: d.accent, emissiveIntensity: 0.5, transparent: true, opacity: 0.9,
        })
      );
      big.position.set(ox, 4, oz);
      g.add(big);
    } else if (theme === 'ember') {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(3, 6, 6),
        new THREE.MeshStandardMaterial({
          color: 0x2a1008, emissive: 0xff3010, emissiveIntensity: 0.4, roughness: 0.8,
        })
      );
      cone.position.set(ox, 3, oz);
      g.add(cone);
    } else if (theme === 'void') {
      const plat = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 4.5, 0.4, 8),
        new THREE.MeshStandardMaterial({
          color: 0x202040, metalness: 0.8, roughness: 0.3,
          emissive: d.accent, emissiveIntensity: 0.2,
        })
      );
      plat.position.set(ox, 0.3, oz);
      g.add(plat);
    } else {
      const mono = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 8, 1.5),
        new THREE.MeshStandardMaterial({
          color: 0xc0e8ff, metalness: 0.4, roughness: 0.15,
          emissive: d.accent, emissiveIntensity: 0.35, transparent: true, opacity: 0.8,
        })
      );
      mono.position.set(ox, 4, oz);
      mono.rotation.y = h * 2;
      g.add(mono);
    }
    return g;
  }

  _disposeChunk(k) {
    const c = this.chunks.get(k);
    if (!c) return;
    this.group.remove(c.group);
    c.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
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
