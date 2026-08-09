import * as THREE from 'three';
import { WORLD_DEFS } from './WorldDefs.js';
export { WORLD_DEFS };
export class SectorCity {
  constructor(scene, worldId = 'sectorCity') {
    this.scene = scene;
    this.def = WORLD_DEFS[worldId] || WORLD_DEFS.sectorCity;
    this.bounds = 1e6;
    this.group = new THREE.Group();
    scene.add(this.group);
    const hemi = new THREE.Mesh(
      new THREE.SphereGeometry(180, 24, 12),
      new THREE.MeshBasicMaterial({ color: this.def.bg, side: THREE.BackSide, depthWrite: false })
    );
    this.group.add(hemi);
  }
  applySceneTheme(scene) {
    scene.background = new THREE.Color(this.def.bg);
    scene.fog = new THREE.FogExp2(this.def.fog, this.def.fogDensity);
  }
  checkCollision() { return false; }
  softClamp() {}
  update() {}
  dispose() { this.scene.remove(this.group); }
}
