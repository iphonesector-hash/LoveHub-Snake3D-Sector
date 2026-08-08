/**
 * GameEngine — Snake.io-style loop, arena camera, arcade flow
 */

import * as THREE from 'three';
import { Snake } from '../entities/Snake.js';
import { spawnFood } from '../entities/Food.js';
import { SectorCity } from '../worlds/SectorCity.js';
import { InputSystem } from '../systems/InputSystem.js';

export const GameState = {
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover',
};

export class GameEngine {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.state = GameState.LOADING;
    this.clock = new THREE.Clock();
    this.time = 0;
    this.foods = [];
    this.maxFood = 48;
    this.onStateChange = options.onStateChange || (() => {});
    this.onScore = options.onScore || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this._headPos = new THREE.Vector3();
    this._camTarget = new THREE.Vector3();
    this._look = new THREE.Vector3();
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
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1220);
    this.scene.fog = new THREE.FogExp2(0x0c1220, 0.018);
  }

  _initCamera() {
    const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(this._baseFov, aspect, 0.1, 200);
    this.camera.position.set(0, 28, 18);
    this.camera.lookAt(0, 0, 0);
    this.camLerp = 6.0;
    this.lookLerp = 8.0;
  }

  _initLights() {
    this.scene.add(new THREE.HemisphereLight(0x6a7aaa, 0x1a1520, 0.65));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(12, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    sun.shadow.bias = -0.001;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4060aa, 0.25);
    fill.position.set(-10, 12, -8);
    this.scene.add(fill);
  }

  async init() {
    this.world = new SectorCity(this.scene);
    this.snake = new Snake(this.scene, { startLength: 6 });
    this._spawnFoods();
    this.setState(GameState.MENU);
  }

  _spawnFoods() {
    while (this.foods.length < this.maxFood) {
      this.foods.push(spawnFood(this.scene, this.world.bounds - 3, this.foods));
    }
  }

  startGame() {
    this.snake.reset(6);
    this.foods.forEach((f) => f.dispose());
    this.foods = [];
    this._spawnFoods();
    this.input.setEnabled(true);
    this.input.showControls(this._isTouchDevice());
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
    this.onGameOver({ score: this.snake.score, length: this.snake.length });
  }

  setState(s) {
    this.state = s;
    this.onStateChange(s);
  }

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
    if (this.world) this.world.update(dt, this.time);
    for (let i = 0; i < this.foods.length; i++) this.foods[i].update(dt, this.time);
    this.renderer.render(this.scene, this.camera);
  };

  _updateGameplay(dt) {
    this.input.update(dt);
    const heading = this.input.getHeading();
    const mag = this.input.getMagnitude();
    const boost = this.input.isBoosting();
    this.snake.update(dt, heading, mag, boost);
    this.snake.writeHead(this._headPos);
    if (this.world.checkCollision(this._headPos, 0.32)) { this.gameOver(); return; }
    if (this.snake.checkSelfCollision()) { this.gameOver(); return; }
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      if (!f.alive) continue;
      const p = f.getPosition();
      if (Math.hypot(this._headPos.x - p.x, this._headPos.z - p.z) < 0.65) {
        this.snake.addScore(f.value * 10);
        this.snake.grow(f.growAmount);
        f.collect();
        this.foods.splice(i, 1);
        this.onScore(this.snake.score, this.snake.combo);
        if (navigator.vibrate) navigator.vibrate(12);
      }
    }
    this._spawnFoods();
  }

  _updateCamera(dt) {
    if (!this.snake) return;
    this.snake.writeHead(this._headPos);
    const dir = this.snake.heading;
    const len = this.snake.length;
    const height = 22 + Math.min(18, len * 0.35);
    const back = 12 + Math.min(8, len * 0.15);
    const boostLift = this.snake.boosting ? 1.5 : 0;
    this._camTarget.set(
      this._headPos.x - dir.x * back * 0.35,
      height + boostLift,
      this._headPos.z - dir.z * back * 0.35 + back * 0.55
    );
    const k = 1 - Math.exp(-this.camLerp * dt);
    this.camera.position.lerp(this._camTarget, k);
    this._look.set(this._headPos.x + dir.x * 3, 0.2, this._headPos.z + dir.z * 3);
    if (!this._lookSmooth) this._lookSmooth = this._look.clone();
    this._lookSmooth.lerp(this._look, 1 - Math.exp(-this.lookLerp * dt));
    this.camera.lookAt(this._lookSmooth);
    const wantFov = this._baseFov + (this.snake.boosting ? 4 : 0) + Math.min(6, len * 0.08);
    this.camera.fov += (wantFov - this.camera.fov) * (1 - Math.exp(-4 * dt));
    this.camera.updateProjectionMatrix();
  }

  _isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
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
    this.world?.dispose();
    this.foods.forEach((f) => f.dispose());
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
