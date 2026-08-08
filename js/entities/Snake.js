/**
 * Snake — Snake.io-style continuous movement + path body
 */

import * as THREE from 'three';

const SEG_SPACE = 0.48;
const BASE_SPEED = 7.2;
const BOOST_SPEED = 13.5;
const ACCEL = 22;
const DECEL = 16;
const TURN_RATE = 11.5;
const TURN_BOOST = 9.0;
const HEAD_R = 0.34;
const BODY_R = 0.29;
const ENERGY_MAX = 1;
const ENERGY_DRAIN = 0.28;
const ENERGY_REGEN = 0.18;
const HIST_CAP = 4000;

export class Snake {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.segments = [];
    this._hist = [];
    this._histLen = 0;
    this._histMax = HIST_CAP;
    this.heading = new THREE.Vector3(0, 0, -1);
    this.desired = new THREE.Vector3(0, 0, -1);
    this._tmp = new THREE.Vector3();
    this._move = new THREE.Vector3();
    this.speed = BASE_SPEED;
    this.targetSpeed = BASE_SPEED;
    this.alive = true;
    this.length = options.startLength || 6;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.energy = ENERGY_MAX;
    this.boosting = false;
    this.mass = this.length;
    this.group = new THREE.Group();
    scene.add(this.group);
    this._mats();
    this._spawn();
  }

  _mats() {
    this.headMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff, metalness: 0.35, roughness: 0.4,
      emissive: 0x004455, emissiveIntensity: 0.35,
    });
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x5b8def, metalness: 0.2, roughness: 0.5,
      emissive: 0x1a2040, emissiveIntensity: 0.12,
    });
    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5,
    });
  }

  _spawn() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this.segments = [];
    this._hist = [];
    this._histLen = 0;
    const start = new THREE.Vector3(0, 0.32, 6);
    for (let i = 0; i < this.length; i++) {
      const pos = start.clone().add(new THREE.Vector3(0, 0, i * SEG_SPACE));
      const mesh = this._segMesh(i === 0);
      mesh.position.copy(pos);
      this.group.add(mesh);
      this.segments.push({ pos: pos.clone(), mesh });
      this._pushHist(pos);
    }
    this.heading.set(0, 0, -1);
    this.desired.set(0, 0, -1);
    this.speed = BASE_SPEED;
    this.targetSpeed = BASE_SPEED;
    this.energy = ENERGY_MAX;
    this.boosting = false;
    this.alive = true;
    this.mass = this.length;
  }

  _segMesh(isHead) {
    const geo = new THREE.SphereGeometry(isHead ? HEAD_R : BODY_R, 14, 12);
    const mesh = new THREE.Mesh(geo, isHead ? this.headMat : this.bodyMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (isHead) {
      const eg = new THREE.SphereGeometry(0.07, 8, 6);
      const L = new THREE.Mesh(eg, this.eyeMat);
      const R = new THREE.Mesh(eg, this.eyeMat);
      L.position.set(-0.13, 0.1, -0.24);
      R.position.set(0.13, 0.1, -0.24);
      mesh.add(L, R);
      this._glow = new THREE.PointLight(0x00e5ff, 0.7, 5);
      this._glow.position.set(0, 0.15, 0);
      mesh.add(this._glow);
    }
    return mesh;
  }

  _pushHist(v3) {
    if (this._histLen < this._histMax) {
      this._hist.push(v3.clone());
      this._histLen++;
    } else {
      const last = this._hist.pop();
      last.copy(v3);
      this._hist.unshift(last);
    }
  }

  grow(n = 1) {
    for (let i = 0; i < n; i++) {
      const last = this.segments[this.segments.length - 1];
      const mesh = this._segMesh(false);
      mesh.position.copy(last.pos);
      this.group.add(mesh);
      this.segments.push({ pos: last.pos.clone(), mesh });
      this.length++;
      this.mass = this.length;
    }
  }

  update(dt, desired, boostHeld, stickMag = 0) {
    if (!this.alive) return;
    const dl = Math.hypot(desired.x, desired.z) || 1;
    this.desired.set(desired.x / dl, 0, desired.z / dl);

    const hx = this.heading.x, hz = this.heading.z;
    const dx = this.desired.x, dz = this.desired.z;
    const cross = hx * dz - hz * dx;
    const dot = hx * dx + hz * dz;
    let ang = Math.atan2(cross, dot);
    const rate = (this.boosting ? TURN_BOOST : TURN_RATE) * (0.75 + 0.5 * Math.min(1, stickMag || 1));
    const maxA = rate * dt;
    if (ang > maxA) ang = maxA;
    else if (ang < -maxA) ang = -maxA;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    this.heading.x = hx * cos - hz * sin;
    this.heading.z = hx * sin + hz * cos;
    const hl = Math.hypot(this.heading.x, this.heading.z) || 1;
    this.heading.x /= hl;
    this.heading.z /= hl;
    this.heading.y = 0;

    if (boostHeld && this.energy > 0.02) {
      this.boosting = true;
      this.energy = Math.max(0, this.energy - ENERGY_DRAIN * dt);
      if (this.energy <= 0.01) this.boosting = false;
    } else {
      this.boosting = false;
      this.energy = Math.min(ENERGY_MAX, this.energy + ENERGY_REGEN * dt);
    }

    this.targetSpeed = this.boosting ? BOOST_SPEED : BASE_SPEED;
    if (this.speed < this.targetSpeed) this.speed = Math.min(this.targetSpeed, this.speed + ACCEL * dt);
    else if (this.speed > this.targetSpeed) this.speed = Math.max(this.targetSpeed, this.speed - DECEL * dt);

    const head = this.segments[0];
    this._move.set(this.heading.x, 0, this.heading.z).multiplyScalar(this.speed * dt);
    head.pos.add(this._move);

    if (this._histLen === 0 || head.pos.distanceToSquared(this._hist[0]) > 0.0025) {
      this._pushHist(head.pos);
    }

    let distAccum = 0, hi = 0;
    for (let i = 1; i < this.segments.length; i++) {
      const need = i * SEG_SPACE;
      while (hi < this._histLen - 1) {
        const a = this._hist[hi], b = this._hist[hi + 1];
        const sl = a.distanceTo(b);
        if (distAccum + sl >= need) {
          const t = (need - distAccum) / (sl || 1);
          this.segments[i].pos.lerpVectors(a, b, t);
          break;
        }
        distAccum += sl;
        hi++;
      }
      if (hi >= this._histLen - 1) this.segments[i].pos.copy(this._hist[this._histLen - 1] || head.pos);
    }

    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      s.mesh.position.copy(s.pos);
      if (i === 0) {
        this._tmp.copy(s.pos).add(this.heading);
        s.mesh.lookAt(this._tmp);
        if (this._glow) {
          this._glow.intensity = this.boosting ? 1.4 : 0.7;
          this._glow.color.setHex(this.boosting ? 0xffaa33 : 0x00e5ff);
        }
        this.headMat.emissiveIntensity = this.boosting ? 0.7 : 0.35;
        this.headMat.emissive.setHex(this.boosting ? 0x664400 : 0x004455);
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }
  }

  getHeadPosition() { return this.segments[0]?.pos.clone() || new THREE.Vector3(); }
  getBoostEnergy() { return this.energy; }

  checkSelfCollision(threshold = 0.38) {
    if (this.segments.length < 10) return false;
    const head = this.segments[0].pos;
    for (let i = 8; i < this.segments.length; i++) {
      if (head.distanceToSquared(this.segments[i].pos) < threshold * threshold) return true;
    }
    return false;
  }

  die() {
    this.alive = false;
    this.boosting = false;
    this.headMat.emissive.setHex(0xff2222);
    this.headMat.emissiveIntensity = 0.9;
  }

  reset(n = 6) {
    this.length = n;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.headMat.emissive.setHex(0x004455);
    this.headMat.emissiveIntensity = 0.35;
    this._spawn();
  }

  addScore(pts) {
    const g = Math.floor(pts * this.combo);
    this.score += g;
    this.combo = Math.min(12, this.combo + 0.4);
    this.comboTimer = 2.2;
    return g;
  }

  dispose() {
    this.scene.remove(this.group);
    this.segments.forEach((s) => s.mesh.geometry?.dispose());
  }
}
