import * as THREE from 'three';

const SPACING = 0.46, BASE_SPEED = 8.4, BOOST_SPEED = 15.2, ACCEL = 32, DECEL = 20, TURN_RATE = 16.5;
const HEAD_R = 0.36, BODY_R = 0.29, HISTORY_STEP = 0.1, MAX_HISTORY = 5000;

export class Snake {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.segments = []; this.history = []; this._histPool = [];
    this._tmp = new THREE.Vector3();
    this.heading = new THREE.Vector3(0, 0, -1);
    this.desired = new THREE.Vector3(0, 0, -1);
    this.speed = BASE_SPEED; this.targetSpeed = BASE_SPEED;
    this.boosting = false; this.speedMult = 1; this._baseSpeedMult = 1;
    this.effects = { speed: 0, bite: 0, shield: 0 };
    this.alive = true;
    this.length = options.startLength || 6;
    this.score = 0; this.mass = this.length; this.combo = 1; this.comboTimer = 0;
    this.group = new THREE.Group(); scene.add(this.group);
    this._mats(); this._spawn();
  }
  _mats() {
    this.headMat = new THREE.MeshStandardMaterial({ color: 0x2ee6ff, metalness: 0.4, roughness: 0.35, emissive: 0x0a3040, emissiveIntensity: 0.4 });
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x4b7bff, metalness: 0.22, roughness: 0.48, emissive: 0x101830, emissiveIntensity: 0.14 });
    this.eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.55 });
  }
  _allocHist(x, z) { const p = this._histPool.pop() || { x: 0, z: 0 }; p.x = x; p.z = z; return p; }
  _spawn() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this.segments = [];
    while (this.history.length) this._histPool.push(this.history.pop());
    for (let i = 0; i < this.length; i++) {
      const x = 0, z = 8 + i * SPACING;
      const mesh = this._segMesh(i === 0);
      mesh.position.set(x, 0.34, z); this.group.add(mesh);
      this.segments.push({ x, z, mesh }); this.history.push(this._allocHist(x, z));
    }
    this.heading.set(0, 0, -1); this.desired.set(0, 0, -1);
    this.speed = BASE_SPEED; this.targetSpeed = BASE_SPEED; this.boosting = false; this.alive = true; this.mass = this.length;
  }
  _segMesh(isHead) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(isHead ? HEAD_R : BODY_R, 14, 12), isHead ? this.headMat : this.bodyMat);
    mesh.castShadow = true;
    if (isHead) {
      const eg = new THREE.SphereGeometry(0.08, 8, 6);
      const L = new THREE.Mesh(eg, this.eyeMat), R = new THREE.Mesh(eg, this.eyeMat);
      L.position.set(-0.15, 0.12, -0.24); R.position.set(0.15, 0.12, -0.24); mesh.add(L, R);
      this._headLight = new THREE.PointLight(0x2ee6ff, 0.8, 5); this._headLight.position.set(0, 0.25, 0); mesh.add(this._headLight);
    }
    return mesh;
  }
  update(dt, desiredHeading, magnitude, boostHeld) {
    if (!this.alive) return;
    const mag = Math.max(0, Math.min(1, magnitude || 0));
    const dlen = Math.hypot(desiredHeading.x, desiredHeading.z) || 1;
    this.desired.set(desiredHeading.x / dlen, 0, desiredHeading.z / dlen);
    if (mag > 0.04) {
      const hx = this.heading.x, hz = this.heading.z;
      const cross = hx * this.desired.z - hz * this.desired.x;
      const dot = hx * this.desired.x + hz * this.desired.z;
      let angle = Math.atan2(cross, dot);
      const maxTurn = TURN_RATE * (0.75 + 0.25 * mag) * dt;
      if (angle > maxTurn) angle = maxTurn; else if (angle < -maxTurn) angle = -maxTurn;
      if (angle) {
        const c = Math.cos(angle), s = Math.sin(angle);
        this.heading.x = hx * c - hz * s; this.heading.z = hx * s + hz * c;
        const hl = Math.hypot(this.heading.x, this.heading.z) || 1;
        this.heading.x /= hl; this.heading.z /= hl;
      }
    }
    this.boosting = !!boostHeld;
    for (const k of Object.keys(this.effects)) { if (this.effects[k] > 0) { this.effects[k] -= dt; if (this.effects[k] < 0) this.effects[k] = 0; } }
    if (this.effects.speed > 0) this.speedMult = Math.max(this._baseSpeedMult || 1, 1.45);
    else this.speedMult = this._baseSpeedMult || 1;
    const base = this.boosting ? BOOST_SPEED : BASE_SPEED;
    this.targetSpeed = base * (this.speedMult || 1);
    if (this.speed < this.targetSpeed) this.speed = Math.min(this.targetSpeed, this.speed + ACCEL * dt);
    else if (this.speed > this.targetSpeed) this.speed = Math.max(this.targetSpeed, this.speed - DECEL * dt);
    const head = this.segments[0];
    head.x += this.heading.x * this.speed * dt; head.z += this.heading.z * this.speed * dt;
    head.mesh.position.set(head.x, 0.34, head.z);
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
          this.segments[i].x = sx; this.segments[i].z = sz; this.segments[i].mesh.position.set(sx, 0.34, sz); break;
        }
        distAccum += seg; hi++;
      }
    }
    this._tmp.set(head.x + this.heading.x, 0.34, head.z + this.heading.z); head.mesh.lookAt(this._tmp);
    if (this._headLight) {
      this._headLight.intensity = this.boosting ? 1.6 : (this.effects.bite > 0 ? 1.3 : 0.8);
      this._headLight.color.setHex(this.effects.bite > 0 ? 0xff4060 : (this.boosting ? 0xffb040 : 0x2ee6ff));
    }
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 1; }
  }
  applyEffect(type, duration) {
    if (type === 'speed') this.effects.speed = Math.max(this.effects.speed, duration);
    else if (type === 'bite') this.effects.bite = Math.max(this.effects.bite, duration);
    else if (type === 'shield') this.effects.shield = Math.max(this.effects.shield, duration);
  }
  hasBite() { return this.effects.bite > 0; }
  hasShield() { return this.effects.shield > 0; }
  stealMass(amount = 2) {
    const steal = Math.min(amount, Math.max(0, this.segments.length - 5));
    for (let i = 0; i < steal; i++) {
      const last = this.segments.pop(); if (!last) break;
      this.group.remove(last.mesh); last.mesh.geometry?.dispose();
      this.length = Math.max(5, this.length - 1); this.mass = this.length;
    }
    return steal;
  }
  grow(amount = 1) {
    for (let n = 0; n < amount; n++) {
      const last = this.segments[this.segments.length - 1];
      const mesh = this._segMesh(false); mesh.position.set(last.x, 0.34, last.z);
      this.group.add(mesh); this.segments.push({ x: last.x, z: last.z, mesh }); this.length++; this.mass++;
    }
  }
  writeHead(out) { const h = this.segments[0]; out.set(h.x, 0.34, h.z); return out; }
  checkSelfCollision(threshold = 0.4) {
    if (this.segments.length < 12) return false;
    const h = this.segments[0];
    for (let i = 10; i < this.segments.length; i++) if (Math.hypot(h.x - this.segments[i].x, h.z - this.segments[i].z) < threshold) return true;
    return false;
  }
  die() { this.alive = false; this.boosting = false; this.headMat.emissive.setHex(0xff2020); this.headMat.emissiveIntensity = 0.95; }
  reset(startLength = 6) {
    this.length = startLength; this.mass = startLength; this.score = 0; this.combo = 1; this.comboTimer = 0;
    this.effects = { speed: 0, bite: 0, shield: 0 }; this.speedMult = 1; this._baseSpeedMult = 1;
    this.headMat.emissive.setHex(0x0a3040); this.headMat.emissiveIntensity = 0.4; this._spawn();
  }
  addScore(points) {
    const g = Math.floor(points * this.combo); this.score += g;
    this.combo = Math.min(12, this.combo + 0.4); this.comboTimer = 2.2; return g;
  }
  dispose() { this.scene.remove(this.group); this.segments.forEach((s) => s.mesh.geometry?.dispose()); }
}
