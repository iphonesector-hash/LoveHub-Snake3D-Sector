import * as THREE from 'three';
import { WORLD_DEFS } from './WorldDefs.js';
import { ChunkStreamer } from '../systems/ChunkStreamer.js';

export { WORLD_DEFS };

export class SectorCity {
  constructor(scene, worldId = 'sectorCity') {
    this.scene = scene;
    this.def = WORLD_DEFS[worldId] || WORLD_DEFS.sectorCity;
    this.bounds = 1e9;
    this.group = new THREE.Group();
    scene.add(this.group);
    this._buildSky();
    this.streamer = new ChunkStreamer(scene, this.def);
    this._buildAmbient();
  }

  _buildSky() {
    const d = this.def;
    const skyGeo = new THREE.SphereGeometry(220, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: d.skyTop || d.bg, side: THREE.BackSide, depthWrite: false, fog: false });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(this.sky);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(160, 200, 48),
      new THREE.MeshBasicMaterial({ color: d.accent, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false, fog: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2;
    this.group.add(ring);
  }

  _buildAmbient() {
    const d = this.def;
    const count = 36;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 180;
      pos[i * 3 + 1] = 2 + Math.random() * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: d.accent, size: 0.35, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true });
    this.particles = new THREE.Points(geo, mat);
    this.group.add(this.particles);
  }

  applySceneTheme(scene) {
    const d = this.def;
    scene.background = new THREE.Color(d.bg);
    scene.fog = new THREE.FogExp2(d.fog, d.fogDensity || 0.0055);
  }

  update(dt, time, playerX = 0, playerZ = 0) {
    if (this.streamer) this.streamer.update(playerX, playerZ);
    if (this.particles) {
      this.particles.rotation.y = time * 0.02;
      this.particles.position.x = playerX * 0.12;
      this.particles.position.z = playerZ * 0.12;
    }
  }

  getZoneAt(x, z) {
    return this.streamer ? this.streamer.getZoneAt(x, z) : 'open';
  }

  softClamp() {}
  checkCollision() { return false; }

  dispose() {
    if (this.streamer) this.streamer.dispose();
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }
}
