/**
 * GameEngine — Snake.io-style loop, top-down camera, arena
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
    this._camPos = new THREE.Vector3(0, 22, 16);
    this._look = new THREE.Vector3(0, 0, 0);
    this._baseFov = 48;
    this._targetFov = 48;
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1018);
    this.scene.fog = new THREE.FogExp2(0x0c1018, 0.018);
  }

  _initCamera() {
    const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 150);
    this.camera.position.set(0, 22, 16);
    this.camera.lookAt(0, 0, 0);
    this.camLerp = 6.0;
    this.lookLerp = 7.5;
  }

  _initLights() {
    this.scene.add(new THREE.HemisphereLight(0x8aa0c0, 0x0a0c12, 0.65));
    const dir = new THREE.DirectionalLight(0xfff5e6, 0.9);
    dir.position.set(12, 28, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 2;
    dir.shadow.camera.far = 60;
    dir.shadow.camera.left = -30;
    dir.shadow.camera.right = 30;
    dir.shadow.camera.top = 30;
    dir.shadow.camera.bottom = -30;
    dir.shadow.bias = -0.001;
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0x6a90ff, 0.25);
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
    this.input.showJoystick(this._isTouchDevice());
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
    this.input.showJoystick(false);
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

    if (this.snake && this.state === GameState.PLAYING) {
      const fill = document.getElementById('boost-energy-fill');
      const bar = document.getElementById('boost-energy');
      if (fill && bar) {
        fill.style.transform = `scaleX(${this.snake.getBoostEnergy().toFixed(3)})`;
        bar.classList.toggle('hidden', !this._isTouchDevice());
      }
      const lenEl = document.getElementById('length-value');
      if (lenEl) lenEl.textContent = String(this.snake.length);
    }

    this.renderer.render(this.scene, this.camera);
  };

  _updateGameplay(dt) {
    this.input.update(dt);
    const desired = this.input.getDesiredHeading();
    const boost = this.input.isBoosting();
    const mag = this.input.getMagnitude();

    this.snake.update(dt, desired, boost, mag || (this.input.isSteering() ? 1 : 0.5));

    const head = this.snake.getHeadPosition();
    if (this.world.checkCollision(head, 0.32)) {
      this.gameOver();
      return;
    }
    if (this.snake.checkSelfCollision()) {
      this.gameOver();
      return;
    }

    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      if (!f.alive) continue;
      if (head.distanceToSquared(f.getPosition()) < 0.45 * 0.45) {
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
    const head = this.snake.getHeadPosition();
    const dir = this.snake.heading;

    const height = 18 + Math.min(12, this.snake.length * 0.15);
    const back = 12 + Math.min(6, this.snake.length * 0.08);
    const desired = this._camPos;
    desired.set(
      head.x - dir.x * back * 0.35,
      height,
      head.z - dir.z * back * 0.35 + back * 0.55
    );

    const k = 1 - Math.exp(-this.camLerp * dt);
    this.camera.position.lerp(desired, k);

    const look = head.clone();
    look.x += dir.x * 3;
    look.z += dir.z * 3;
    this._look.lerp(look, 1 - Math.exp(-this.lookLerp * dt));
    this.camera.lookAt(this._look);

    this._targetFov = this._baseFov + (this.snake.boosting ? 4 : 0) + Math.min(6, this.snake.length * 0.04);
    this.camera.fov += (this._targetFov - this.camera.fov) * Math.min(1, dt * 4);
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
