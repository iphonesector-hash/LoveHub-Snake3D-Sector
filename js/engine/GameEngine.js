/**
 * GameEngine — campaign + arcade, themed arenas
 */

import * as THREE from 'three';
import { Snake } from '../entities/Snake.js';
import { spawnFood } from '../entities/Food.js';
import { SectorCity, WORLD_DEFS } from '../worlds/SectorCity.js';
import { InputSystem } from '../systems/InputSystem.js';
import { getLevel, nextLevelId } from '../data/levels.js';

export const GameState = {
  LOADING: 'loading', MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused',
  GAMEOVER: 'gameover', LEVELCLEAR: 'levelclear',
};

export class GameEngine {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.state = GameState.LOADING;
    this.clock = new THREE.Clock();
    this.time = 0;
    this.foods = [];
    this.maxFood = 52;
    this.mode = 'arcade';
    this.worldId = 'sectorCity';
    this.levelId = 1;
    this.levelTimer = 0;
    this.onStateChange = options.onStateChange || (() => {});
    this.onScore = options.onScore || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this.onLevelClear = options.onLevelClear || (() => {});
    this._headPos = new THREE.Vector3();
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
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._onResize();
    this._raf = null;
    this._running = false;
    this._baseFov = 48;
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1424);
    this.scene.fog = new THREE.FogExp2(0x0a1424, 0.014);
  }

  _initCamera() {
    const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(this._baseFov, aspect, 0.1, 220);
    this.camera.position.set(0, 24, 14);
    this.camera.lookAt(0, 0, 0);
    this.camLerp = 8.5;
    this.lookLerp = 11;
  }

  _initLights() {
    this.scene.add(new THREE.HemisphereLight(0x8ab0d0, 0x0a0e18, 0.7));
    this.dir = new THREE.DirectionalLight(0xffffff, 0.95);
    this.dir.position.set(14, 30, 12);
    this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(1024, 1024);
    this.dir.shadow.camera.near = 2; this.dir.shadow.camera.far = 90;
    this.dir.shadow.camera.left = -55; this.dir.shadow.camera.right = 55;
    this.dir.shadow.camera.top = 55; this.dir.shadow.camera.bottom = -55;
    this.dir.shadow.bias = -0.001;
    this.scene.add(this.dir);
    this.fill = new THREE.DirectionalLight(0x5080c0, 0.28);
    this.fill.position.set(-12, 14, -10);
    this.scene.add(this.fill);
  }

  async init() {
    this._loadWorld('sectorCity');
    this.snake = new Snake(this.scene, { startLength: 6 });
    this._spawnFoods();
    this.setState(GameState.MENU);
  }

  _loadWorld(worldId) {
    if (this.world) this.world.dispose();
    this.worldId = WORLD_DEFS[worldId] ? worldId : 'sectorCity';
    this.world = new SectorCity(this.scene, this.worldId);
    this.world.applySceneTheme(this.scene);
  }

  setMode(mode) { this.mode = mode === 'campaign' ? 'campaign' : 'arcade'; }
  setWorld(worldId) { this.worldId = worldId; }
  setLevel(levelId) { this.levelId = levelId; }

  _spawnFoods() {
    while (this.foods.length < this.maxFood) {
      this.foods.push(spawnFood(this.scene, this.world.bounds - 2, this.foods));
    }
  }

  _clearFoods() {
    this.foods.forEach((f) => f.dispose());
    this.foods = [];
  }

  _burst(x, z, color = 0x3dffb5) {
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.SphereGeometry(0.07, 6, 5);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, 0.5, z);
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 3;
      this.scene.add(m);
      this._particles.push({ mesh: m, vx: Math.cos(a) * sp, vy: 2 + Math.random() * 2, vz: Math.sin(a) * sp, life: 0.3 + Math.random() * 0.2 });
    }
  }

  _updateParticles(dt) {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
      p.vy -= 6 * dt;
      p.mesh.material.opacity = Math.max(0, p.life * 2.2);
      if (p.life <= 0) {
        this.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose();
        this._particles.splice(i, 1);
      }
    }
  }

  startGame() {
    let worldId = this.worldId;
    if (this.mode === 'campaign') {
      const lv = getLevel(this.levelId);
      worldId = lv.world;
      this.levelTimer = lv.timeLimit > 0 ? lv.timeLimit : 0;
    } else this.levelTimer = 0;
    if (worldId !== this.world?.def?.id) this._loadWorld(worldId);
    else this.world.applySceneTheme(this.scene);
    this.snake.reset(6);
    this._clearFoods();
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

  gameOver() {
    this.snake.die();
    this.input.setEnabled(false);
    this.input.showControls(false);
    this.setState(GameState.GAMEOVER);
    this.onGameOver({ score: this.snake.score, length: this.snake.length, mode: this.mode, levelId: this.levelId });
  }

  levelClear() {
    this.input.setEnabled(false);
    this.input.showControls(false);
    this.setState(GameState.LEVELCLEAR);
    this.onLevelClear({ score: this.snake.score, length: this.snake.length, levelId: this.levelId, nextLevelId: nextLevelId(this.levelId) });
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

  _updateGameplay(dt) {
    this.input.update(dt);
    this.snake.update(dt, this.input.getHeading(), this.input.getMagnitude(), this.input.isBoosting());
    this.snake.writeHead(this._headPos);
    if (this.world.checkCollision(this._headPos, 0.34) || this.snake.checkSelfCollision()) {
      this.gameOver();
      return;
    }
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      if (!f.alive) continue;
      const p = f.getPosition();
      if (Math.hypot(this._headPos.x - p.x, this._headPos.z - p.z) < 0.72) {
        this.snake.addScore(f.value * 10);
        this.snake.grow(f.growAmount);
        this._burst(p.x, p.z, f.mat.color.getHex());
        f.collect();
        this.foods.splice(i, 1);
        this.onScore(this.snake.score, this.snake.combo);
        if (navigator.vibrate) navigator.vibrate(8);
      }
    }
    this._spawnFoods();
    if (this.mode === 'campaign') {
      const lv = getLevel(this.levelId);
      if (lv.timeLimit > 0) {
        this.levelTimer -= dt;
        if (this.levelTimer <= 0) { this.gameOver(); return; }
      }
      if (this.snake.score >= lv.targetScore && this.snake.length >= lv.targetLength) this.levelClear();
    }
  }

  _updateCamera(dt) {
    if (!this.snake) return;
    this.snake.writeHead(this._headPos);
    const dir = this.snake.heading;
    const len = this.snake.length;
    const height = 18 + Math.min(14, len * 0.28);
    const back = 9 + Math.min(6, len * 0.1);
    const boostLift = this.snake.boosting ? 1.8 : 0;
    this._camTarget.set(this._headPos.x - dir.x * back * 0.22, height + boostLift, this._headPos.z - dir.z * back * 0.22 + back * 0.48);
    const k = 1 - Math.exp(-this.camLerp * dt);
    this.camera.position.lerp(this._camTarget, k);
    this._look.set(this._headPos.x + dir.x * 4, 0.12, this._headPos.z + dir.z * 4);
    this._lookSmooth.lerp(this._look, 1 - Math.exp(-this.lookLerp * dt));
    this.camera.lookAt(this._lookSmooth);
    const wantFov = this._baseFov + (this.snake.boosting ? 4 : 0) + Math.min(5, len * 0.06);
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
  getLevelTimer() { return Math.max(0, this.levelTimer); }

  dispose() {
    this.stopLoop();
    window.removeEventListener('resize', this._onResize);
    this.input.dispose();
    this.snake?.dispose();
    this.world?.dispose();
    this._clearFoods();
    this.renderer.dispose();
  }
}
