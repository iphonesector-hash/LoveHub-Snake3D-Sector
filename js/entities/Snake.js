/**
 * Snake — Snake.io-style continuous movement + path body
 */

import * as THREE from 'three';

const SPACING = 0.48;
const BASE_SPEED = 7.2;
const BOOST_SPEED = 13.5;
const ACCEL = 22;
const DECEL = 16;
const TURN_RATE = 11.5;
const TURN_RATE_MIN = 4.5;
const HEAD_R = 0.34;
const BODY_R = 0.28;
const HISTORY_STEP = 0.12;
const MAX_HISTORY = 4000;

export class Snake {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.segments = [];
    this.history = [];
    this._histPool = [];
    this._tmp = new THREE.Vector3();
    this._move = new THREE.Vector3();
    this.heading = new THREE.Vector3(0, 0, -1);
    this.desired = new THREE.Vector3(0, 0, -1);
    this.speed = BASE_SPEED;
    this.targetSpeed = BASE_SPEED;
    this.boosting = false;
    this.alive = true;
    this.length = options.startLength || 6;
    this.score = 0;
    this.mass = options.startLength || 6;
    this.combo = 1;
    this.comboTimer = 0;
    this.group = new THREE.Group();
    scene.add(this.group);
    this._mats();
    this._spawn();
  }

  _mats() {
    this.headMat = new THREE.MeshStandardMaterial({ color: 0x2ee6ff, metalness: 0.35, roughness: 0.4, emissive: 0x0a3040, emissiveIntensity: 0.35 });
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x4b6fff, metalness: 0.2, roughness: 0.5, emissive: 0x101830, emissiveIntensity: 0.12 });
    this.eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
  }

  _allocHist(x, z) {
    const p = this._histPool.pop() || { x: 0, z: 0 };
    p.x = x; p.z = z;
    return p;
  }

  _spawn() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this.segments = [];
    for (let i = 0; i < this.history.length; i++) this._histPool.push(this.history[i]);
    this.history = [];
    const startZ = 6;
    for (let i = 0; i < this.length; i++) {
      const x = 0, z = startZ + i * SPACING;
      const mesh = this._segMesh(i === 0);
      mesh.position.set(x, 0.32, z);
      this.group.add(mesh);
      this.segments.push({ x, z, mesh });
      this.history.push(this._allocHist(x, z));
    }
    this.heading.set(0, 0, -1);
    this.desired.set(0, 0, -1);
    this.speed = BASE_SPEED;
    this.targetSpeed = BASE_SPEED;
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
      const light = new THREE.PointLight(0x2ee6ff, 0.7, 5);
      light.position.set(0, 0.25, 0);
      mesh.add(light);
      this._headLight = light;
    }
    return mesh;
  }

  update(dt, desiredHeading, magnitude = 0, boostHeld = false) {
    if (!this.alive) return;
    const dx = desiredHeading.x, dz = desiredHeading.z;
    const dlen = Math.hypot(dx, dz) || 1;
    this.desired.set(dx / dlen, 0, dz / dlen);
    const hx = this.heading.x, hz = this.heading.z;
    const cross = hx * this.desired.z - hz * this.desired.x;
    const dot = hx * this.desired.x + hz * this.desired.z;
    let angle = Math.atan2(cross, dot);
    const mag = Math.max(0, Math.min(1, magnitude));
    const rate = TURN_RATE_MIN + (TURN_RATE - TURN_RATE_MIN) * (mag > 0 ? mag : 0);
    const maxTurn = (mag > 0.02 ? rate : 0) * dt;
    if (angle > maxTurn) angle = maxTurn;
    else if (angle < -maxTurn) angle = -maxTurn;
    if (Math.abs(angle) > 1e-6) {
      const c = Math.cos(angle), s = Math.sin(angle);
      this.heading.x = hx * c - hz * s;
      this.heading.z = hx * s + hz * c;
      const hl = Math.hypot(this.heading.x, this.heading.z) || 1;
      this.heading.x /= hl;
      this.heading.z /= hl;
    }
    this.boosting = !!boostHeld;
    this.targetSpeed = this.boosting ? BOOST_SPEED : BASE_SPEED;
    if (this.speed < this.targetSpeed) this.speed = Math.min(this.targetSpeed, this.speed + ACCEL * dt);
    else if (this.speed > this.targetSpeed) this.speed = Math.max(this.targetSpeed, this.speed - DECEL * dt);
    const head = this.segments[0];
    const step = this.speed * dt;
    head.x += this.heading.x * step;
    head.z += this.heading.z * step;
    head.mesh.position.set(head.x, 0.32, head.z);
    const last = this.history[0];
    if (!last || Math.hypot(head.x - last.x, head.z - last.z) >= HISTORY_STEP) {
      this.history.unshift(this._allocHist(head.x, head.z));
      while (this.history.length > MAX_HISTORY) this._histPool.push(this.history.pop());
    } else { last.x = head.x; last.z = head.z; }
    let distAccum = 0, hi = 0;
    for (let i = 1; i < this.segments.length; i++) {
      const need = i * SPACING;
      while (hi < this.history.length - 1) {
        const a = this.history[hi], b = this.history[hi + 1];
        const seg = Math.hypot(a.x - b.x, a.z - b.z);
        if (distAccum + seg >= need) {
          const t = (need - distAccum) / (seg || 1);
          const sx = a.x + (b.x - a.x) * t, sz = a.z + (b.z - a.z) * t;
          this.segments[i].x = sx; this.segments[i].z = sz;
          this.segments[i].mesh.position.set(sx, 0.32, sz);
          break;
        }
        distAccum += seg; hi++;
      }
      if (hi >= this.history.length - 1) {
        const p = this.history[this.history.length - 1] || head;
        this.segments[i].x = p.x; this.segments[i].z = p.z;
        this.segments[i].mesh.position.set(p.x, 0.32, p.z);
      }
    }
    this._tmp.set(head.x + this.heading.x, 0.32, head.z + this.heading.z);
    head.mesh.lookAt(this._tmp);
    if (this._headLight) {
      this._headLight.intensity = this.boosting ? 1.4 : 0.7;
      this._headLight.color.setHex(this.boosting ? 0xffb040 : 0x2ee6ff);
    }
    this.headMat.emissiveIntensity = this.boosting ? 0.7 : 0.35;
    this.headMat.emissive.setHex(this.boosting ? 0x553010 : 0x0a3040);
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 1; }
  }

  grow(amount = 1) {
    for (let n = 0; n < amount; n++) {
      const last = this.segments[this.segments.length - 1];
      const mesh = this._segMesh(false);
      mesh.position.set(last.x, 0.32, last.z);
      this.group.add(mesh);
      this.segments.push({ x: last.x, z: last.z, mesh });
      this.length++; this.mass++;
    }
  }

  getHeadPosition() {
    const h = this.segments[0];
    return new THREE.Vector3(h.x, 0.32, h.z);
  }

  writeHead(out) {
    const h = this.segments[0];
    out.set(h.x, 0.32, h.z);
    return out;
  }

  get direction() { return this.heading; }

  checkSelfCollision(threshold = 0.38) {
    if (this.segments.length < 10) return false;
    const h = this.segments[0];
    for (let i = 8; i < this.segments.length; i++) {
      const s = this.segments[i];
      if (Math.hypot(h.x - s.x, h.z - s.z) < threshold) return true;
    }
    return false;
  }

  die() {
    this.alive = false;
    this.boosting = false;
    this.headMat.emissive.setHex(0xff2020);
    this.headMat.emissiveIntensity = 0.9;
  }

  reset(startLength = 6) {
    this.length = startLength;
    this.mass = startLength;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.headMat.emissive.setHex(0x0a3040);
    this.headMat.emissiveIntensity = 0.35;
    this._spawn();
  }

  addScore(points) {
    const g = Math.floor(points * this.combo);
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
