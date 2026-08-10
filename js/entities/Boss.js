/**
 * Boss entity — HP, phases, special attacks. Not just a big AISnake.
 */
import * as THREE from 'three';

export const BOSS_DEFS = {
  rock_titan: {
    id: 'rock_titan', name: 'Rock Titan', nameFa: '\u062a\u06cc\u062a\u0627\u0646 \u0633\u0646\u06af\u06cc',
    world: 'mountainPass', hp: 120, phases: 3, color: [0x8a9098, 0x5a6068],
    size: 2.2, speed: 0.7, attack: 'slam', reward: { xp: 200, coins: 80, mass: 15 },
  },
  ancient_beast: {
    id: 'ancient_beast', name: 'Ancient Beast', nameFa: '\u062c\u0627\u0646\u0648\u0631 \u0628\u0627\u0633\u062a\u0627\u0646\u06cc',
    world: 'deepForest', hp: 100, phases: 3, color: [0x2d6a38, 0x1a3020],
    size: 2.0, speed: 0.85, attack: 'charge', reward: { xp: 180, coins: 70, mass: 12 },
  },
  sand_wyrm: {
    id: 'sand_wyrm', name: 'Sand Wyrm', nameFa: '\u06a9\u0631\u0645 \u0634\u0646\u06cc',
    world: 'canyonLands', hp: 110, phases: 3, color: [0xc07040, 0x8a5030],
    size: 2.1, speed: 1.0, attack: 'burrow', reward: { xp: 190, coins: 75, mass: 14 },
  },
  cyber_serpent: {
    id: 'cyber_serpent', name: 'Cyber Serpent', nameFa: '\u0645\u0627\u0631 \u0633\u0627\u06cc\u0628\u0631',
    world: 'neonDistrict', hp: 130, phases: 3, color: [0xff4fd8, 0xc040ff],
    size: 2.0, speed: 1.15, attack: 'laser', reward: { xp: 220, coins: 90, mass: 16 },
  },
  temple_guardian: {
    id: 'temple_guardian', name: 'Temple Guardian', nameFa: '\u0646\u06af\u0647\u0628\u0627\u0646 \u0645\u0639\u0628\u062f',
    world: 'ancientRuins', hp: 140, phases: 3, color: [0xd0b060, 0x8a8060],
    size: 2.3, speed: 0.75, attack: 'shockwave', reward: { xp: 250, coins: 100, mass: 18 },
  },
  lava_titan: {
    id: 'lava_titan', name: 'Lava Titan', nameFa: '\u062a\u06cc\u062a\u0627\u0646 \u0644\u0627\u0648\u0627',
    world: 'emberValley', hp: 150, phases: 3, color: [0xff5020, 0xff8040],
    size: 2.4, speed: 0.8, attack: 'erupt', reward: { xp: 280, coins: 120, mass: 20 },
  },
};

export class Boss {
  constructor(scene, defId, options = {}) {
    this.def = BOSS_DEFS[defId] || BOSS_DEFS.rock_titan;
    this.scene = scene;
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.phase = 1;
    this.alive = true;
    this.attackTimer = 3;
    this.invuln = 0;
    this.x = options.x || 40;
    this.z = options.z || -40;

    this.group = new THREE.Group();
    scene.add(this.group);
    this.segments = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const r = (1.2 - i * 0.08) * this.def.size;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 10),
        new THREE.MeshStandardMaterial({
          color: this.def.color[i === 0 ? 0 : 1],
          metalness: 0.4, roughness: 0.5,
          emissive: this.def.color[0], emissiveIntensity: 0.3,
        })
      );
      mesh.position.set(this.x, r * 0.6, this.z + i * r * 1.6);
      mesh.castShadow = true;
      this.group.add(mesh);
      this.segments.push({ mesh, r });
    }
    this.hpRing = new THREE.Mesh(
      new THREE.RingGeometry(2.5, 2.8, 32),
      new THREE.MeshBasicMaterial({ color: 0xff4060, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    this.hpRing.rotation.x = -Math.PI / 2;
    this.hpRing.position.set(this.x, 0.15, this.z);
    this.group.add(this.hpRing);
  }

  get head() { return this.segments[0]; }

  update(dt, player) {
    if (!this.alive) return;
    if (this.invuln > 0) this.invuln -= dt;
    this.attackTimer -= dt;

    // follow player loosely
    if (player && player.alive) {
      const hx = player.segments[0].x;
      const hz = player.segments[0].z;
      const dx = hx - this.x;
      const dz = hz - this.z;
      const dist = Math.hypot(dx, dz) || 1;
      const spd = this.def.speed * (1 + (this.phase - 1) * 0.15);
      this.x += (dx / dist) * spd * dt * 4;
      this.z += (dz / dist) * spd * dt * 4;
    }

    // body follow
    let px = this.x, pz = this.z;
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      if (i === 0) {
        s.mesh.position.set(px, s.r * 0.6, pz);
      } else {
        const dx = px - s.mesh.position.x;
        const dz = pz - s.mesh.position.z;
        const d = Math.hypot(dx, dz) || 1;
        const target = s.r * 1.5;
        if (d > target) {
          s.mesh.position.x += (dx / d) * (d - target);
          s.mesh.position.z += (dz / d) * (d - target);
        }
        s.mesh.position.y = s.r * 0.6;
        px = s.mesh.position.x;
        pz = s.mesh.position.z;
      }
    }
    this.hpRing.position.set(this.x, 0.15, this.z);
    this.hpRing.scale.setScalar(0.5 + 0.5 * (this.hp / this.maxHp));

    // phase transitions
    const ratio = this.hp / this.maxHp;
    if (ratio < 0.33) this.phase = 3;
    else if (ratio < 0.66) this.phase = 2;
    else this.phase = 1;
  }

  takeDamage(amount) {
    if (!this.alive || this.invuln > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invuln = 0.35;
    if (this.hp <= 0) {
      this.alive = false;
      this.die();
      return true;
    }
    return false;
  }

  getHpRatio() {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0;
  }

  die() {
    for (const s of this.segments) {
      s.mesh.material.emissiveIntensity = 1.5;
      s.mesh.material.transparent = true;
    }
  }

  dispose() {
    this.alive = false;
    this.scene.remove(this.group);
    this.segments.forEach((s) => {
      s.mesh.geometry?.dispose();
      s.mesh.material?.dispose();
    });
  }
}

export function bossForWorld(worldId) {
  for (const b of Object.values(BOSS_DEFS)) {
    if (b.world === worldId) return b.id;
  }
  return null;
}
