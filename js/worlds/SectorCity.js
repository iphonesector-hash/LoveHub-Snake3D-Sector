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
    this._auroraBands = null;
    if (this.def.theme === 'aurora') this._buildAurora();
  }

  _buildSky() {
    const d = this.def;
    const skyGeo = new THREE.SphereGeometry(220, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: d.skyTop || d.bg, side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(this.sky);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(150, 195, 48),
      new THREE.MeshBasicMaterial({
        color: d.accent, transparent: true, opacity: d.theme === 'neon' ? 0.1 : 0.055,
        side: THREE.DoubleSide, depthWrite: false, fog: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2;
    this.group.add(ring);
    if (d.theme === 'neon' || d.theme === 'ember') {
      const ring2 = new THREE.Mesh(
        new THREE.RingGeometry(100, 120, 32),
        new THREE.MeshBasicMaterial({
          color: d.secondary, transparent: true, opacity: 0.07,
          side: THREE.DoubleSide, depthWrite: false, fog: false,
        })
      );
      ring2.rotation.x = -Math.PI / 2;
      ring2.position.y = 8;
      this.group.add(ring2);
    }
  }

  _buildAmbient() {
    const d = this.def;
    const count = d.particleCount || 40;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const style = d.particleStyle || 'city_lights';
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      if (style === 'snow' || style === 'embers') pos[i * 3 + 1] = Math.random() * 30;
      else if (style === 'stars') pos[i * 3 + 1] = 8 + Math.random() * 40;
      else pos[i * 3 + 1] = 1.5 + Math.random() * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    let color = d.accent;
    if (style === 'embers') color = 0xff6040;
    else if (style === 'snow') color = 0xe0f0ff;
    else if (style === 'stars') color = 0xc0d0ff;
    else if (style === 'neon_sparks') color = 0xff4fd8;
    const mat = new THREE.PointsMaterial({
      color, size: d.particleSize || 0.3, transparent: true, opacity: 0.55,
      depthWrite: false, sizeAttenuation: true,
    });
    this.particles = new THREE.Points(geo, mat);
    this.group.add(this.particles);
    this._particleStyle = style;
  }

  _buildAurora() {
    this._auroraBands = new THREE.Group();
    const colors = [0x40ffb0, 0x60a0ff, 0x80ffe0];
    for (let i = 0; i < 3; i++) {
      const band = new THREE.Mesh(
        new THREE.PlaneGeometry(80 + i * 20, 12 + i * 4),
        new THREE.MeshBasicMaterial({
          color: colors[i], transparent: true, opacity: 0.08 + i * 0.02,
          side: THREE.DoubleSide, depthWrite: false, fog: false,
        })
      );
      band.position.set(0, 35 + i * 8, -40 - i * 15);
      band.rotation.x = 0.3;
      this._auroraBands.add(band);
    }
    this.group.add(this._auroraBands);
  }

  applySceneTheme(scene) {
    const d = this.def;
    scene.background = new THREE.Color(d.bg);
    scene.fog = new THREE.FogExp2(d.fog, d.fogDensity || 0.0055);
  }

  update(dt, time, playerX = 0, playerZ = 0) {
    if (this.streamer) this.streamer.update(playerX, playerZ);
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position;
      const arr = pos.array;
      const style = this._particleStyle;
      if (style === 'snow' || style === 'embers') {
        for (let i = 0; i < arr.length; i += 3) {
          arr[i + 1] -= dt * (style === 'embers' ? 2.5 : 4);
          if (style === 'embers') arr[i] += Math.sin(time + i) * dt * 0.8;
          if (arr[i + 1] < 0) {
            arr[i + 1] = 25 + Math.random() * 10;
            arr[i] = playerX + (Math.random() - 0.5) * 80;
            arr[i + 2] = playerZ + (Math.random() - 0.5) * 80;
          }
        }
        pos.needsUpdate = true;
      } else {
        this.particles.rotation.y = time * (style === 'stars' ? 0.008 : 0.02);
        this.particles.position.x = playerX * 0.1;
        this.particles.position.z = playerZ * 0.1;
      }
    }
    if (this._auroraBands) {
      this._auroraBands.position.x = playerX * 0.05;
      this._auroraBands.position.z = playerZ * 0.05;
      this._auroraBands.children.forEach((b, i) => {
        b.material.opacity = 0.06 + Math.sin(time * 0.4 + i) * 0.04;
      });
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
