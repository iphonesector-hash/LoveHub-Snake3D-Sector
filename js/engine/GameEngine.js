/**
 * GameEngine — Snake.io-style loop, arena camera, local 2P support
 */

import * as THREE from 'three';
import { Snake } from '../entities/Snake.js';
import { spawnFood } from '../entities/Food.js';
import { SectorCity } from '../worlds/SectorCity.js';
import { InputSystem } from '../systems/InputSystem.js';

export const GameState = {
  LOADING: 'loading', MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover',
};

export class GameEngine {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.state = GameState.LOADING;
    this.clock = new THREE.Clock();
    this.time = 0;
    this.foods = [];
    this.maxFood = 56;
    this.mode = 'solo';
    this.onStateChange = options.onStateChange || (() => {});
    this.onScore = options.onScore || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this._headPos = new THREE.Vector3();
    this._headPos2 = new THREE.Vector3();
    this._camTarget = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._lookSmooth = new THREE.Vector3();
    this._particles = [];
    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this.input = new InputSystem(document.getElementById('game-root'));
    this.world = null;
    this.snake = null;
    this.snake2 = null;
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._onResize();
    this._raf = null;
    this._running = false;
    this._baseFov = 50;
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b121e);
    this.scene.fog = new THREE.FogExp2(0x0b121e, 0.016);
  }

  _initCamera() {
    const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(this._baseFov, aspect, 0.1, 220);
    this.camera.position.set(0, 26, 16);
    this.camera.lookAt(0, 0, 0);
    this.camLerp = 8.0;
    this.lookLerp = 10.0;
  }

  _initLights() {
    this.scene.add(new THREE.HemisphereLight(0x6a8ab0, 0x0a0e18, 0.65));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(12, 28, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 2; dir.shadow.camera.far = 80;
    dir.shadow.camera.left = -50; dir.shadow.camera.right = 50;
    dir.shadow.camera.top = 50; dir.shadow.camera.bottom = -50;
    dir.shadow.bias = -0.001;
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0x4a80c0, 0.25);
    fill.position.set(-10, 12, -8);
    this.scene.add(fill);
  }

  async init() {
    this.world = new SectorCity(this.scene);
    this.snake = new Snake(this.scene, { startLength: 6 });
    this._spawnFoods();
    this.setState(GameState.MENU);
  }

  setMode(mode) { this.mode = mode === 'local2' ? 'local2' : 'solo'; }

  _spawnFoods() {
    while (this.foods.length < this.maxFood) {
      this.foods.push(spawnFood(this.scene, this.world.bounds - 2, this.foods));
    }
  }

  _burst(x, z, color = 0x3dffb5) {
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.SphereGeometry(0.08, 6, 5);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, 0.5, z);
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 3;
      this.scene.add(m);
      this._particles.push({ mesh: m, vx: Math.cos(a) * sp, vy: 2 + Math.random() * 2, vz: Math.sin(a) * sp, life: 0.35 + Math.random() * 0.2 });
    }
  }

  _updateParticles(dt) {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
      p.vy -= 6 * dt;
      p.mesh.material.opacity = Math.max(0, p.life * 2);
      if (p.life <= 0) {
        this.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose();
        this._particles.splice(i, 1);
      }
    }
  }

  _ensureSnake2() {
    if (this.snake2) return;
    this.snake2 = new Snake(this.scene, { startLength: 6 });
    this.snake2.headMat.color.setHex(0xff6bb5);
    this.snake2.headMat.emissive.setHex(0x401028);
    this.snake2.bodyMat.color.setHex(0xe050a0);
  }

  _removeSnake2() {
    if (!this.snake2) return;
    this.snake2.dispose();
    this.snake2 = null;
  }

  startGame() {
    this.snake.reset(6);
    if (this.mode === 'local2') {
      this._ensureSnake2();
      this.snake2.reset(6);
      for (const s of this.snake2.segments) { s.x += 8; s.z -= 4; s.mesh.position.set(s.x, 0.34, s.z); }
      for (const p of this.snake2.history) { p.x += 8; p.z -= 4; }
      this.snake2.heading.set(0, 0, -1);
    } else {
      this._removeSnake2();
    }
    this.foods.forEach((f) => f.dispose());
    this.foods = [];
    this._spawnFoods();
    this.input.setEnabled(true);
    this.input.showControls(true);
    this.setState(GameState.PLAYING);
    this.clock.start();
  }

  pause() {
    if (this.state !== GameState.PLAYING) return;
    this.setState(GameState.PAUSED);
    this.input.setEnabled(false);
  }

  resume() {
    if (this.state !== GameState.PAUSED) return;
    this.setState(GameState.PLAYING);
    this.input.setEnabled(true);
    this.clock.start();
  }

  gameOver(winner = null) {
    this.snake.die();
    if (this.snake2) this.snake2.die();
    this.input.setEnabled(false);
    this.input.showControls(false);
    this.setState(GameState.GAMEOVER);
    this.onGameOver({ score: this.snake.score, length: this.snake.length, score2: this.snake2?.score || 0, mode: this.mode, winner });
  }

  setState(s) { this.state = s; this.onStateChange(s); }

  startLoop() {
    if (this._running) return;
    this._running = true;
    this.clock.start();
    this._loop();
  }

  stopLoop() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _loop = () => {
    if (!this._running) return;
    this._raf = requestAnimationFrame(this._loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    if (this.state === GameState.PLAYING) this._updateGameplay(dt);
    this._updateCamera(dt);
    this._updateParticles(dt);
    if (this.world) this.world.update(dt, this.time);
    for (let i = 0; i < this.foods.length; i++) this.foods[i].update(dt, this.time);
    this.renderer.render(this.scene, this.camera);
  };

  _tryCollect(snake) {
    snake.writeHead(this._headPos);
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      if (!f.alive) continue;
      const p = f.getPosition();
      if (Math.hypot(this._headPos.x - p.x, this._headPos.z - p.z) < 0.7) {
        snake.addScore(f.value * 10);
        snake.grow(f.growAmount);
        this._burst(p.x, p.z, f.mat.color.getHex());
        f.collect();
        this.foods.splice(i, 1);
        if (snake === this.snake) this.onScore(snake.score, snake.combo);
        if (navigator.vibrate) navigator.vibrate(10);
      }
    }
  }

  _updateGameplay(dt) {
    this.input.update(dt);
    this.snake.update(dt, this.input.getHeading(), this.input.getMagnitude(), this.input.isBoosting());
    this.snake.writeHead(this._headPos);
    if (this.world.checkCollision(this._headPos, 0.34) || this.snake.checkSelfCollision()) {
      this.gameOver(this.mode === 'local2' ? 'p2' : null);
      return;
    }
    this._tryCollect(this.snake);

    if (this.mode === 'local2' && this.snake2) {
      this.snake2.update(dt, this.input.getP2Heading(), this.input.getP2Magnitude(), this.input.isP2Boosting());
      this.snake2.writeHead(this._headPos2);
      if (this.world.checkCollision(this._headPos2, 0.34) || this.snake2.checkSelfCollision()) {
        this.gameOver('p1');
        return;
      }
      if (this._crossKill(this.snake, this.snake2)) { this.gameOver('p2'); return; }
      if (this._crossKill(this.snake2, this.snake)) { this.gameOver('p1'); return; }
      this._tryCollect(this.snake2);
    }
    this._spawnFoods();
  }

  _crossKill(attacker, victim) {
    if (!attacker?.alive || !victim?.alive || victim.segments.length < 6) return false;
    const h = attacker.segments[0];
    for (let i = 4; i < victim.segments.length; i++) {
      const s = victim.segments[i];
      if (Math.hypot(h.x - s.x, h.z - s.z) < 0.42) return true;
    }
    return false;
  }

  _updateCamera(dt) {
    if (!this.snake) return;
    this.snake.writeHead(this._headPos);
    let focusX = this._headPos.x, focusZ = this._headPos.z, len = this.snake.length;
    if (this.mode === 'local2' && this.snake2?.alive) {
      this.snake2.writeHead(this._headPos2);
      focusX = (this._headPos.x + this._headPos2.x) * 0.5;
      focusZ = (this._headPos.z + this._headPos2.z) * 0.5;
      len = Math.max(this.snake.length, this.snake2.length);
    }
    const dir = this.snake.heading;
    const height = 20 + Math.min(16, len * 0.32) + (this.mode === 'local2' ? 6 : 0);
    const back = 10 + Math.min(7, len * 0.12);
    const boostLift = this.snake.boosting ? 2 : 0;
    this._camTarget.set(focusX - dir.x * back * 0.2, height + boostLift, focusZ - dir.z * back * 0.2 + back * 0.45);
    const k = 1 - Math.exp(-this.camLerp * dt);
    this.camera.position.lerp(this._camTarget, k);
    this._look.set(focusX + dir.x * 3, 0.15, focusZ + dir.z * 3);
    this._lookSmooth.lerp(this._look, 1 - Math.exp(-this.lookLerp * dt));
    this.camera.lookAt(this._lookSmooth);
    const wantFov = this._baseFov + (this.snake.boosting ? 5 : 0) + Math.min(5, len * 0.07) + (this.mode === 'local2' ? 4 : 0);
    this.camera.fov += (wantFov - this.camera.fov) * (1 - Math.exp(-5 * dt));
    this.camera.updateProjectionMatrix();
  }

  _onResize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  getScore() { return this.snake?.score || 0; }
  getCombo() { return this.snake?.combo || 1; }
  getLength() { return this.snake?.length || 0; }

  dispose() {
    this.stopLoop();
    window.removeEventListener('resize', this._onResize);
    this.input.dispose();
    this.snake?.dispose();
    this._removeSnake2();
    this.world?.dispose();
    this.foods.forEach((f) => f.dispose());
    this.renderer.dispose();
  }
}
