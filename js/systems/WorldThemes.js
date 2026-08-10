import * as THREE from 'three';
import { WorldObstacle } from '../entities/WorldObstacle.js';

export function groundMatForTheme(theme, zone, d) {
  if (theme === 'ember') {
    return new THREE.MeshStandardMaterial({
      color: zone === 'danger' ? 0x3a1008 : d.ground, metalness: 0.1, roughness: 0.9,
      emissive: 0x2a0800, emissiveIntensity: zone === 'danger' ? 0.2 : 0.08,
    });
  }
  if (theme === 'crystal') {
    return new THREE.MeshStandardMaterial({
      color: d.ground, metalness: 0.35, roughness: 0.25, emissive: d.accent, emissiveIntensity: 0.06,
    });
  }
  if (theme === 'aurora') {
    return new THREE.MeshStandardMaterial({
      color: 0x0e2430, metalness: 0.15, roughness: 0.7, emissive: 0x081820, emissiveIntensity: 0.05,
    });
  }
  if (theme === 'void') {
    return new THREE.MeshStandardMaterial({
      color: d.ground, metalness: 0.55, roughness: 0.4, emissive: 0x101028, emissiveIntensity: 0.08,
    });
  }
  if (theme === 'neon') {
    return new THREE.MeshStandardMaterial({
      color: d.ground, metalness: 0.3, roughness: 0.55, emissive: d.accent, emissiveIntensity: 0.04,
    });
  }
  if (theme === 'green') {
    return new THREE.MeshStandardMaterial({
      color: zone === 'forest' ? 0x2d6a38 : d.ground, metalness: 0.05, roughness: 0.85,
      emissive: 0x1a4020, emissiveIntensity: 0.04,
    });
  }
  if (theme === 'forest') {
    return new THREE.MeshStandardMaterial({
      color: zone === 'danger' ? 0x1a3020 : d.ground, metalness: 0.08, roughness: 0.9,
      emissive: 0x0e2010, emissiveIntensity: 0.06,
    });
  }
  if (theme === 'mountain') {
    return new THREE.MeshStandardMaterial({
      color: d.ground, metalness: 0.15, roughness: 0.95, emissive: 0x202820, emissiveIntensity: 0.03,
    });
  }
  if (theme === 'canyon') {
    return new THREE.MeshStandardMaterial({
      color: zone === 'danger' ? 0x8a3010 : d.ground, metalness: 0.1, roughness: 0.88,
      emissive: 0x401808, emissiveIntensity: 0.05,
    });
  }
  if (theme === 'coastal') {
    return new THREE.MeshStandardMaterial({
      color: zone === 'open' ? 0xe8d8a8 : d.ground, metalness: 0.05, roughness: 0.92,
      emissive: 0x403010, emissiveIntensity: 0.02,
    });
  }
  if (theme === 'ruins') {
    return new THREE.MeshStandardMaterial({
      color: d.ground, metalness: 0.25, roughness: 0.7, emissive: 0x2a2010, emissiveIntensity: 0.04,
    });
  }
  return new THREE.MeshStandardMaterial({
    color: d.ground, metalness: 0.2, roughness: 0.8,
    emissive: zone === 'danger' ? d.accent : 0x000000, emissiveIntensity: zone === 'danger' ? 0.1 : 0,
  });
}

export function propCountForTheme(theme) {
  if (theme === 'neon') return 6;
  if (theme === 'crystal') return 7;
  if (theme === 'forest') return 8;
  if (theme === 'green' || theme === 'mountain' || theme === 'aurora' || theme === 'ruins') return 6;
  if (theme === 'canyon' || theme === 'ember' || theme === 'void') return 5;
  return 5;
}

export function makeThemeProp(scene, x, z, d, seed, theme, ck) {
  const col = d.propColors[(Math.floor(seed * 10) % d.propColors.length)];
  let mesh = null, obs = null;
  if (theme === 'cyber') {
    const ht = 2.5 + seed * 10;
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2 + seed * 0.7, ht, 1.2 + seed * 0.5),
      new THREE.MeshStandardMaterial({ color: col, metalness: 0.55, roughness: 0.35, emissive: d.accent, emissiveIntensity: 0.15 + seed * 0.2 }));
    mesh.position.set(x, ht * 0.5, z);
    obs = new WorldObstacle(scene, { type: 'box', x, z, halfW: 0.7 + seed * 0.35, halfD: 0.7 + seed * 0.25, solid: true, kind: 'building', chunkKey: ck });
  } else if (theme === 'neon') {
    const ht = 2 + seed * 8;
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.0 + seed * 0.5, ht, 1.0 + seed * 0.4),
      new THREE.MeshStandardMaterial({ color: col, metalness: 0.4, roughness: 0.4, emissive: d.accent, emissiveIntensity: 0.3 + seed * 0.35 }));
    mesh.position.set(x, ht * 0.5, z);
    obs = new WorldObstacle(scene, { type: 'box', x, z, halfW: 0.6 + seed * 0.25, halfD: 0.6 + seed * 0.2, solid: true, kind: 'building', chunkKey: ck });
  } else if (theme === 'crystal') {
    const s = 0.9 + seed * 2.2;
    mesh = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0),
      new THREE.MeshStandardMaterial({ color: d.accent, metalness: 0.65, roughness: 0.12, emissive: d.accent, emissiveIntensity: 0.35 + seed * 0.25, transparent: true, opacity: 0.85 }));
    mesh.position.set(x, 0.9 + seed * 1.4, z); mesh.rotation.y = seed * 6;
    obs = new WorldObstacle(scene, { type: 'circle', x, z, radius: s * 0.65, solid: true, kind: 'crystal', chunkKey: ck });
  } else if (theme === 'ember') {
    const ht = 1.5 + seed * 3.5;
    mesh = new THREE.Mesh(new THREE.ConeGeometry(0.8 + seed * 0.6, ht, 5),
      new THREE.MeshStandardMaterial({ color: 0x2a1008, emissive: 0xff4020, emissiveIntensity: 0.25 + seed * 0.35, roughness: 0.7 }));
    mesh.position.set(x, ht * 0.45, z);
    obs = new WorldObstacle(scene, { type: 'circle', x, z, radius: 0.9 + seed * 0.4, solid: true, kind: 'rock', chunkKey: ck });
  } else if (theme === 'void') {
    const ht = 2 + seed * 6;
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.65, ht, 6),
      new THREE.MeshStandardMaterial({ color: col, metalness: 0.75, roughness: 0.28, emissive: d.accent, emissiveIntensity: 0.2 }));
    mesh.position.set(x, ht * 0.5, z);
    obs = new WorldObstacle(scene, { type: 'cylinder', x, z, radius: 0.7, solid: true, kind: 'pillar', chunkKey: ck });
  } else if (theme === 'green') {
    const ht = 2.2 + seed * 4;
    mesh = new THREE.Mesh(new THREE.ConeGeometry(0.7 + seed * 0.5, ht, 6),
      new THREE.MeshStandardMaterial({ color: 0x2d6a38, metalness: 0.05, roughness: 0.85, emissive: 0x1a4020, emissiveIntensity: 0.08 }));
    mesh.position.set(x, ht * 0.45, z);
    obs = new WorldObstacle(scene, { type: 'circle', x, z, radius: 0.7 + seed * 0.35, solid: true, kind: 'tree', chunkKey: ck });
  } else if (theme === 'forest') {
    const ht = 4 + seed * 8;
    mesh = new THREE.Mesh(new THREE.ConeGeometry(0.9 + seed * 0.6, ht, 7),
      new THREE.MeshStandardMaterial({ color: col, metalness: 0.05, roughness: 0.9, emissive: 0x0e2010, emissiveIntensity: 0.05 }));
    mesh.position.set(x, ht * 0.42, z);
    obs = new WorldObstacle(scene, { type: 'circle', x, z, radius: 0.85 + seed * 0.4, solid: true, kind: 'tree', chunkKey: ck });
  } else if (theme === 'mountain') {
    const ht = 3 + seed * 7;
    mesh = new THREE.Mesh(new THREE.ConeGeometry(1.2 + seed * 1.2, ht, 5),
      new THREE.MeshStandardMaterial({ color: col, metalness: 0.2, roughness: 0.95 }));
    mesh.position.set(x, ht * 0.4, z);
    obs = new WorldObstacle(scene, { type: 'circle', x, z, radius: 1.1 + seed * 0.6, solid: true, kind: 'rock', chunkKey: ck });
  } else if (theme === 'canyon') {
    const ht = 2.5 + seed * 6;
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5 + seed * 1.5, ht, 1.2 + seed),
      new THREE.MeshStandardMaterial({ color: col, metalness: 0.1, roughness: 0.9 }));
    mesh.position.set(x, ht * 0.5, z);
    obs = new WorldObstacle(scene, { type: 'box', x, z, halfW: 0.9 + seed * 0.7, halfD: 0.7 + seed * 0.5, solid: true, kind: 'rock', chunkKey: ck });
  } else if (theme === 'coastal') {
    const s = 0.8 + seed * 1.5;
    mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0),
      new THREE.MeshStandardMaterial({ color: 0xc0b090, metalness: 0.15, roughness: 0.8 }));
    mesh.position.set(x, s * 0.6, z);
    obs = new WorldObstacle(scene, { type: 'circle', x, z, radius: s * 0.7, solid: true, kind: 'rock', chunkKey: ck });
  } else if (theme === 'ruins') {
    const ht = 2 + seed * 5;
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, ht, 8),
      new THREE.MeshStandardMaterial({ color: col, metalness: 0.3, roughness: 0.6, emissive: d.accent, emissiveIntensity: 0.1 }));
    mesh.position.set(x, ht * 0.5, z);
    obs = new WorldObstacle(scene, { type: 'cylinder', x, z, radius: 0.7, solid: true, kind: 'pillar', chunkKey: ck });
  } else {
    const ht = 2.5 + seed * 6;
    mesh = new THREE.Mesh(new THREE.ConeGeometry(0.5 + seed * 0.35, ht, 5),
      new THREE.MeshStandardMaterial({ color: 0xd0f0ff, metalness: 0.35, roughness: 0.15, emissive: d.accent, emissiveIntensity: 0.2 + seed * 0.15, transparent: true, opacity: 0.82 }));
    mesh.position.set(x, ht * 0.45, z);
    obs = new WorldObstacle(scene, { type: 'circle', x, z, radius: 0.6 + seed * 0.3, solid: true, kind: 'ice', chunkKey: ck });
  }
  return { mesh, obs };
}
