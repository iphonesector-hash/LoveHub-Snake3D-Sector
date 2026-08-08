/**
 * 3D Snake — smooth body following, acceleration, controlled turns
 */

import * as THREE from 'three';

const SEGMENT_SPACING = 0.55;
const BASE_SPEED = 6.2;
const MIN_SPEED = 2.4;
const BOOST_MULTIPLIER = 1.75;
const ACCEL = 14;
const DECEL = 11;
const TURN_SPEED = 9.5;
const TURN_SPEED_BOOST = 7.2;
const HEAD_RADIUS = 0.32;
const BODY_RADIUS = 0.28;
const BOOST_ENERGY_MAX = 1;
const BOOST_DRAIN = 0.35;
const BOOST_REGEN = 0.22;

export class Snake {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.segments = [];
    this.history = [];
    this.historySpacing = 0.08;
    this.maxHistory = 2000;

    this.direction = new THREE.Vector3(0, 0, -1);
    this.targetDir = new THREE.Vector3(0, 0, -1);
    this._tmp = new THREE.Vector3();
    this._move = new THREE.Vector3();

    this.speed = BASE_SPEED;
    this.targetSpeed = BASE_SPEED;
    this.alive = true;
    this.length = options.startLength || 5;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;

    this.boostEnergy = BOOST_ENERGY_MAX;
    this.boosting = false;

    this.group = new THREE.Group();
    scene.add(this.group);

    this._createMaterials();
    this._spawn();
  }

  _createMaterials() {
    this.headMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      metalness: 0.4,
      roughness: 0.35,
      emissive: 0x003344,
      emissiveIntensity: 0.3,
    });
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x5e5ce6,
      metalness: 0.25,
      roughness: 0.45,
      emissive: 0x1a1a40,
      emissiveIntensity: 0.15,
    });
    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.4,
    });
  }

  _spawn() {
    while (this.group.children.length) {
      this.group.remove(this.group.children[0]);
    }
    this.segments = [];
    this.history = [];

    const start = new THREE.Vector3(0, 0.35, 4);

    for (let i = 0; i < this.length; i++) {
      const pos = start.clone().add(new THREE.Vector3(0, 0, i * SEGMENT_SPACING));
      const isHead = i === 0;
      const mesh = this._createSegmentMesh(isHead);
      mesh.position.copy(pos);
      this.group.add(mesh);
      this.segments.push({ position: pos.clone(), mesh });
      this.history.push(pos.clone());
    }

    this.direction.set(0, 0, -1);
    this.targetDir.set(0, 0, -1);
    this.speed = BASE_SPEED;
    this.targetSpeed = BASE_SPEED;
    this.boostEnergy = BOOST_ENERGY_MAX;
    this.boosting = false;
    this.alive = true;
  }

  _createSegmentMesh(isHead) {
    const geo = new THREE.SphereGeometry(isHead ? HEAD_RADIUS : BODY_RADIUS, 16, 12);
    const mat = isHead ? this.headMat : this.bodyMat;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (isHead) {
      const eyeGeo = new THREE.SphereGeometry(0.07, 8, 6);
      const left = new THREE.Mesh(eyeGeo, this.eyeMat);
      const right = new THREE.Mesh(eyeGeo, this.eyeMat);
      left.position.set(-0.14, 0.12, -0.22);
      right.position.set(0.14, 0.12, -0.22);
      mesh.add(left);
      mesh.add(right);

      const light = new THREE.PointLight(0x00d4ff, 0.6, 4);
      light.position.set(0, 0.2, 0);
      mesh.add(light);
      this._headLight = light;
    }

    return mesh;
  }

  setTargetDirection(x, z, allowReverse = true) {
    if (!this.alive) return;
    const len = Math.hypot(x, z) || 1;
    const nx = x / len;
    const nz = z / len;

    if (!allowReverse) {
      const dot = this.direction.x * nx + this.direction.z * nz;
      if (dot < -0.55) return;
    }

    this.targetDir.set(nx, 0, nz);
  }

  grow(amount = 1) {
    for (let i = 0; i < amount; i++) {
      const last = this.segments[this.segments.length - 1];
      const pos = last.position.clone();
      const mesh = this._createSegmentMesh(false);
      mesh.position.copy(pos);
      this.group.add(mesh);
      this.segments.push({ position: pos, mesh });
      this.length++;
    }
  }

  update(dt, inputDir, boostHeld, magnitude = 1, analog = false) {
    if (!this.alive) return;

    const ilen = Math.hypot(inputDir.x, inputDir.z) || 1;
    const ix = inputDir.x / ilen;
    const iz = inputDir.z / ilen;

    if (!analog) {
      const dot = this.direction.x * ix + this.direction.z * iz;
      if (dot >= -0.55) {
        this.targetDir.set(ix, 0, iz);
      }
    } else {
      this.targetDir.set(ix, 0, iz);
    }

    const cx = this.direction.x;
    const cz = this.direction.z;
    const tx = this.targetDir.x;
    const tz = this.targetDir.z;
    const cross = cx * tz - cz * tx;
    const dot = cx * tx + cz * tz;
    let angle = Math.atan2(cross, dot);

    const turnRate = this.boosting ? TURN_SPEED_BOOST : TURN_SPEED;
    const turnScale = analog ? 0.65 + 0.35 * magnitude : 1;
    const maxTurn = turnRate * turnScale * dt;
    if (angle > maxTurn) angle = maxTurn;
    else if (angle < -maxTurn) angle = -maxTurn;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.direction.x = cx * cos - cz * sin;
    this.direction.z = cx * sin + cz * cos;
    const dlen = Math.hypot(this.direction.x, this.direction.z) || 1;
    this.direction.x /= dlen;
    this.direction.z /= dlen;
    this.direction.y = 0;

    if (boostHeld && this.boostEnergy > 0.02) {
      this.boosting = true;
      this.boostEnergy = Math.max(0, this.boostEnergy - BOOST_DRAIN * dt);
      if (this.boostEnergy <= 0.01) this.boosting = false;
    } else {
      this.boosting = false;
      this.boostEnergy = Math.min(BOOST_ENERGY_MAX, this.boostEnergy + BOOST_REGEN * dt);
    }

    const mag = Math.max(0, Math.min(1, magnitude));
    let cruise = MIN_SPEED + (BASE_SPEED - MIN_SPEED) * (analog ? Math.max(mag, 0.35) : 1);
    if (!analog) cruise = BASE_SPEED;
    else if (mag < 0.02) cruise = this.speed;

    this.targetSpeed = cruise * (this.boosting ? BOOST_MULTIPLIER : 1);

    if (this.speed < this.targetSpeed) {
      this.speed = Math.min(this.targetSpeed, this.speed + ACCEL * dt);
    } else if (this.speed > this.targetSpeed) {
      this.speed = Math.max(this.targetSpeed, this.speed - DECEL * dt);
    }

    const head = this.segments[0];
    this._move.set(this.direction.x, 0, this.direction.z).multiplyScalar(this.speed * dt);
    head.position.add(this._move);

    this.history.unshift(head.position.clone());
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    let distAccum = 0;
    let histIdx = 0;
    for (let i = 1; i < this.segments.length; i++) {
      const targetDist = i * SEGMENT_SPACING;
      while (histIdx < this.history.length - 1) {
        const a = this.history[histIdx];
        const b = this.history[histIdx + 1];
        const segLen = a.distanceTo(b);
        if (distAccum + segLen >= targetDist) {
          const t = (targetDist - distAccum) / (segLen || 1);
          this.segments[i].position.lerpVectors(a, b, t);
          break;
        }
        distAccum += segLen;
        histIdx++;
      }
      if (histIdx >= this.history.length - 1) {
        this.segments[i].position.copy(this.history[this.history.length - 1] || head.position);
      }
    }

    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      s.mesh.position.copy(s.position);
      if (i === 0) {
        this._tmp.copy(head.position).add(this.direction);
        s.mesh.lookAt(this._tmp);
        if (this._headLight) {
          this._headLight.intensity = this.boosting ? 1.1 : 0.6;
          this._headLight.color.setHex(this.boosting ? 0xffaa44 : 0x00d4ff);
        }
        this.headMat.emissiveIntensity = this.boosting ? 0.55 : 0.3;
        this.headMat.emissive.setHex(this.boosting ? 0x553300 : 0x003344);
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }
  }

  getHeadPosition() {
    return this.segments[0]?.position.clone() || new THREE.Vector3();
  }

  getHeadMesh() {
    return this.segments[0]?.mesh;
  }

  getBoostEnergy() {
    return this.boostEnergy;
  }

  checkSelfCollision(threshold = 0.35) {
    if (this.segments.length < 8) return false;
    const head = this.segments[0].position;
    for (let i = 6; i < this.segments.length; i++) {
      if (head.distanceTo(this.segments[i].position) < threshold) {
        return true;
      }
    }
    return false;
  }

  die() {
    this.alive = false;
    this.boosting = false;
    this.headMat.emissive.setHex(0xff0000);
    this.headMat.emissiveIntensity = 0.8;
  }

  reset(startLength = 5) {
    this.length = startLength;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.headMat.emissive.setHex(0x003344);
    this.headMat.emissiveIntensity = 0.3;
    this._spawn();
  }

  addScore(points) {
    const gained = Math.floor(points * this.combo);
    this.score += gained;
    this.combo = Math.min(10, this.combo + 0.5);
    this.comboTimer = 2.5;
    return gained;
  }

  dispose() {
    this.scene.remove(this.group);
    this.segments.forEach((s) => {
      s.mesh.geometry?.dispose();
    });
  }
}
