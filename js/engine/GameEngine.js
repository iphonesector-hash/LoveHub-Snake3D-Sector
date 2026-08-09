import * as THREE from 'three';
import { Snake } from '../entities/Snake.js';
import { AISnake } from '../entities/AISnake.js';
import { spawnFood } from '../entities/Food.js';
import { spawnPowerUp } from '../entities/PowerUp.js';
import { SectorCity, WORLD_DEFS } from '../worlds/SectorCity.js';
import { InputSystem } from '../systems/InputSystem.js';
import { PopulationManager } from '../systems/PopulationManager.js';
import { EventSystem } from '../systems/EventSystem.js';
import { MissionSystem } from '../systems/MissionSystem.js';
import { getLevel, nextLevelId } from '../data/levels.js';

export const GameState = {
  LOADING: 'loading', MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused',
  GAMEOVER: 'gameover', LEVELCLEAR: 'levelclear',
};

export class GameEngine {
  constructor(container, options = {}) {
    this.container = container;
    this.state = GameState.LOADING;
    this.clock = new THREE.Clock();
    this.time = 0;
    this.foods = []; this.powerUps = []; this.ais = [];
    this.maxFood = 60; this.maxPower = 14; this.maxAI = 11;
    this.mode = 'arcade'; this.worldId = 'sectorCity'; this.levelId = 1;
    this.levelTimer = 0; this.surviveTimer = 0;
    this.goalProgress = { stars: 0, crystals: 0 };
    this.activeMods = {}; this.spawnOpts = {};
    this.onStateChange = options.onStateChange || (() => {});
    this.onScore = options.onScore || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this.onLevelClear = options.onLevelClear || (() => {});
    this.onGoal = options.onGoal || (() => {});
    this.onStatus = options.onStatus || (() => {});
    this.onEvent = options.onEvent || (() => {});
    this.onMission = options.onMission || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this._headPos = new THREE.Vector3(); this._aiHead = new THREE.Vector3();
    this._camTarget = new THREE.Vector3(); this._look = new THREE.Vector3(); this._lookSmooth = new THREE.Vector3();
    this._particles = []; this.population = null; this.events = null; this.missions = null;
    this._initRenderer(); this._initScene(); this._initCamera(); this._initLights();
    this.input = new InputSystem(document.getElementById('game-root'));
    this.world = null; this.snake = null;
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize); this._onResize();
    this._raf = null; this._running = false; this._baseFov = 52;
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
    this.scene.background = new THREE.Color(0x0a1424);
    this.scene.fog = new THREE.FogExp2(0x0a1424, 0.006);
  }
  _initCamera() {
    const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(this._baseFov, aspect, 0.1, 500);
    this.camera.position.set(0, 28, 16); this.camLerp = 7.5; this.lookLerp = 10;
  }
  _initLights() {
    this.scene.add(new THREE.HemisphereLight(0x8ab0d0, 0x0a0e18, 0.75));
    this.dir = new THREE.DirectionalLight(0xffffff, 0.9);
    this.dir.position.set(20, 40, 15); this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.dir);
    const fill = new THREE.DirectionalLight(0x5080c0, 0.25); fill.position.set(-15, 12, -10); this.scene.add(fill);
  }
  async init() {
    this._loadWorld('sectorCity');
    this.snake = new Snake(this.scene, { startLength: 6 });
    this.population = new PopulationManager(this);
    this.events = new EventSystem(this);
    this.missions = new MissionSystem(this);
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
  _clearFoods() { this.foods.forEach((f) => f.dispose()); this.foods = []; }
  _clearPowerUps() { this.powerUps.forEach((p) => p.dispose()); this.powerUps = []; }
  _clearAIs() { this.ais.forEach((a) => a.dispose()); this.ais = []; }
  _burst(x, z, color = 0x3dffb5) {
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
      m.position.set(x, 0.5, z); const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3;
      this.scene.add(m);
      this._particles.push({ mesh: m, vx: Math.cos(a) * sp, vy: 2 + Math.random() * 2, vz: Math.sin(a) * sp, life: 0.3 });
    }
  }
  _updateParticles(dt) {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i]; p.life -= dt;
      p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt; p.vy -= 6 * dt;
      p.mesh.material.opacity = Math.max(0, p.life * 2.2);
      if (p.life <= 0) { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); this._particles.splice(i, 1); }
    }
  }
  startGame() {
    this.goalProgress = { stars: 0, crystals: 0 }; this.surviveTimer = 0; this.activeMods = {}; this.spawnOpts = {};
    let worldId = this.worldId; this.maxAI = 11; this.maxFood = 60; this.maxPower = 14;
    if (this.mode === 'campaign') {
      const lv = getLevel(this.levelId); worldId = lv.world || worldId;
      const m = lv.mods || {}; this.activeMods = { ...m };
      this.maxFood = m.foodMax || 55; this.maxAI = m.ais ?? 8;
      this.spawnOpts = { starBias: m.starBias ?? 0.05, crystalBias: m.crystalBias ?? 0.15 };
      this.levelTimer = m.timeLimit || 0;
    } else this.levelTimer = 0;
    if (worldId !== this.world?.def?.id) this._loadWorld(worldId); else this.world.applySceneTheme(this.scene);
    this.snake.reset(6); this.snake.speedMult = this.activeMods.speed || 1; this.snake._baseSpeedMult = this.snake.speedMult;
    this._clearFoods(); this._clearPowerUps(); this._clearAIs();
    for (let i = 0; i < 25; i++) {
      const ang = Math.random() * Math.PI * 2, r = 8 + Math.random() * 40;
      const f = spawnFood(this.scene, 40, [], this.spawnOpts);
      f._x = Math.cos(ang) * r; f._z = Math.sin(ang) * r; f.mesh.position.set(f._x, 0.38, f._z); this.foods.push(f);
    }
    for (let i = 0; i < 5; i++) {
      const ang = Math.random() * Math.PI * 2, r = 15 + Math.random() * 35;
      const pu = spawnPowerUp(this.scene);
      pu._x = Math.cos(ang) * r; pu._z = Math.sin(ang) * r; pu.mesh.position.set(pu._x, 0.55, pu._z); this.powerUps.push(pu);
    }
    this.events.reset(); this.missions.start();
    this.input.setEnabled(true); this.input.showControls(!this.activeMods.noBoost);
    this.setState(GameState.PLAYING); this.clock.start(); this._emitGoal(); this._emitStatus();
  }
  _emitGoal() {
    if (this.mode !== 'campaign') { this.onGoal(null); return; }
    const lv = getLevel(this.levelId);
    this.onGoal({ level: lv, progress: { ...this.goalProgress, score: this.snake.score, length: this.snake.length, combo: this.snake.combo, survive: this.surviveTimer } });
  }
  _emitStatus() {
    const e = this.snake?.effects || {};
    const hx = this.snake?.segments?.[0]?.x || 0, hz = this.snake?.segments?.[0]?.z || 0;
    const dist = Math.hypot(hx, hz);
    const zone = this.world?.getZoneAt?.(hx, hz) || 'open';
    this.onStatus({
      bite: e.bite || 0, speed: e.speed || 0, shield: e.shield || 0,
      magnet: e.magnet || 0, ghost: e.ghost || 0, multiplier: e.multiplier || 0,
      freeze: e.freeze || 0, golden_bite: e.golden_bite || 0, double_xp: e.double_xp || 0,
      rivals: this.ais.filter((a) => a.alive).length,
      distance: Math.floor(dist), zone, world: this.worldId,
      xp: this.snake?.xp || 0, level: this.snake?.level || 1, coins: this.snake?.coins || 0,
    });
  }
  pause() { if (this.state !== GameState.PLAYING) return; this.setState(GameState.PAUSED); this.input.setEnabled(false); }
  resume() { if (this.state !== GameState.PAUSED) return; this.setState(GameState.PLAYING); this.input.setEnabled(true); this.clock.start(); }
  gameOver() {
    this.snake.die(); this.input.setEnabled(false); this.input.showControls(false);
    this.setState(GameState.GAMEOVER);
    this.onGameOver({ score: this.snake.score, length: this.snake.length, mode: this.mode, levelId: this.levelId });
  }
  levelClear() {
    this.input.setEnabled(false); this.input.showControls(false); this.setState(GameState.LEVELCLEAR);
    this.onLevelClear({ score: this.snake.score, length: this.snake.length, levelId: this.levelId, nextLevelId: nextLevelId(this.levelId) });
  }
  setState(s) { this.state = s; this.onStateChange(s); }
  startLoop() { if (this._running) return; this._running = true; this.clock.start(); this._loop(); }
  stopLoop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); }
  _loop = () => {
    if (!this._running) return;
    this._raf = requestAnimationFrame(this._loop);
    const dt = Math.min(this.clock.getDelta(), 0.05); this.time += dt;
    if (this.state === GameState.PLAYING) this._updateGameplay(dt);
    this._updateCamera(dt); this._updateParticles(dt);
    const hx = this.snake?.segments?.[0]?.x || 0, hz = this.snake?.segments?.[0]?.z || 0;
    if (this.world) this.world.update(dt, this.time, hx, hz);
    for (const f of this.foods) f.update(dt, this.time);
    for (const p of this.powerUps) p.update(dt, this.time);
    this.renderer.render(this.scene, this.camera);
  };
  _hitBody(attacker, victim, fromSeg = 4) {
    if (!attacker?.alive || !victim?.alive) return false;
    const h = attacker.segments[0];
    for (let i = fromSeg; i < victim.segments.length; i++)
      if (Math.hypot(h.x - victim.segments[i].x, h.z - victim.segments[i].z) < 0.42) return true;
    return false;
  }
  _killAI(ai) {
    if (!ai.alive) return;
    this._burst(ai.segments[0].x, ai.segments[0].z, 0xff4060);
    const pts = Math.max(25, ai.length * 6);
    this.snake.addScore(pts); this.onScore(this.snake.score, this.snake.combo);
    this.missions?.track('kills', 1); ai.die();
  }
  _checkGoal() {
    if (this.mode !== 'campaign') return false;
    const g = getLevel(this.levelId).goal; if (!g) return this.snake.score >= 200;
    const s = this.snake;
    if (g.type === 'score') return s.score >= g.value;
    if (g.type === 'length') return s.length >= g.value;
    if (g.type === 'stars') return this.goalProgress.stars >= g.value;
    if (g.type === 'crystals') return this.goalProgress.crystals >= g.value;
    if (g.type === 'combo') return s.combo >= g.value;
    if (g.type === 'survive') return this.surviveTimer >= g.value;
    return false;
  }
  _updateGameplay(dt) {
    this.input.update(dt);
    let boost = this.input.isBoosting(); if (this.activeMods.noBoost) boost = false;
    this.snake.update(dt, this.input.getHeading(), this.input.getMagnitude(), boost);
    this.snake.writeHead(this._headPos);
    if (this.snake.hasMagnet()) {
      for (const f of this.foods) {
        if (!f.alive) continue;
        const p = f.getPosition(); const d = Math.hypot(this._headPos.x - p.x, this._headPos.z - p.z);
        if (d < 12 && d > 0.3) {
          const pull = (12 - d) * 0.08;
          p.x += (this._headPos.x - p.x) / d * pull; p.z += (this._headPos.z - p.z) / d * pull;
          f.mesh.position.set(p.x, p.y, p.z);
        }
      }
    }
    if (this.snake.checkSelfCollision() && !this.snake.hasShield() && !this.snake.hasGhost()) { this.gameOver(); return; }
    const freezeSlow = this.snake.effects.freeze > 0 ? 0.35 : 1;
    for (const ai of this.ais) {
      if (!ai.alive) continue;
      ai.aiUpdate(dt, this.foods, this._headPos, this.snake.alive, this.snake.hasBite(), freezeSlow);
      const ah = ai.segments[0];
      for (let i = this.foods.length - 1; i >= 0; i--) {
        const f = this.foods[i]; if (!f.alive) continue;
        const p = f.getPosition();
        if (Math.hypot(ah.x - p.x, ah.z - p.z) < 0.7) { ai.grow(f.growAmount); ai.addScore(f.value * 8); f.collect(); this.foods.splice(i, 1); }
      }
      if (this._hitBody(this.snake, ai, 3)) {
        if (this.snake.hasBite()) {
          const amt = this.snake.effects.golden_bite > 0 ? 5 : 3;
          const stolen = ai.stealMass(amt); this.snake.grow(stolen); this.snake.addScore(35 + stolen * 18);
          this.onScore(this.snake.score, this.snake.combo); this._burst(this._headPos.x, this._headPos.z, 0xff4060);
          if (ai.length < 6) this._killAI(ai);
        } else if (this.snake.hasShield()) { this.snake.effects.shield = 0; this._burst(this._headPos.x, this._headPos.z, 0x60ffb0); }
        else if (!this.snake.hasGhost()) { this.gameOver(); return; }
      }
      if (this._hitBody(ai, this.snake, 4)) {
        if (this.snake.hasShield()) { this.snake.effects.shield = 0; this._killAI(ai); }
        else if (!this.snake.hasGhost()) { this.gameOver(); return; }
      }
      ai.writeHead(this._aiHead);
      if (Math.hypot(this._headPos.x - this._aiHead.x, this._headPos.z - this._aiHead.z) < 0.55) {
        if (this.snake.length >= ai.length) this._killAI(ai);
        else if (!this.snake.hasShield() && !this.snake.hasGhost()) { this.gameOver(); return; }
      }
    }
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i]; if (!f.alive) continue;
      const p = f.getPosition();
      if (Math.hypot(this._headPos.x - p.x, this._headPos.z - p.z) < 0.72) {
        const eventMult = this.events?.getScoreMult() || 1;
        this.snake.addScore(f.value * 10 * eventMult); this.snake.grow(f.growAmount);
        if (f.type === 'star') this.goalProgress.stars++;
        if (f.type === 'crystal') this.goalProgress.crystals++;
        this.missions?.track('orbs', 1);
        if (f.type === 'crystal') this.missions?.track('crystals', 1);
        this._burst(p.x, p.z, f.mat.color.getHex()); f.collect(); this.foods.splice(i, 1);
        this.onScore(this.snake.score, this.snake.combo);
      }
    }
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i]; if (!pu.alive) continue;
      const p = pu.getPosition();
      if (Math.hypot(this._headPos.x - p.x, this._headPos.z - p.z) < 0.85) {
        const got = pu.collect(); this.powerUps.splice(i, 1); this.missions?.track('powers', 1);
        if (got.type === 'star') { this.snake.addScore(50); this.goalProgress.stars++; this.onScore(this.snake.score, this.snake.combo); }
        else if (got.type === 'prize') { this.snake.addScore(120); this.snake.grow(5); this.onScore(this.snake.score, this.snake.combo); }
        else if (got.type === 'shockwave') {
          for (const ai of this.ais) {
            if (!ai.alive) continue;
            const ax = ai.segments[0].x, az = ai.segments[0].z;
            const d = Math.hypot(this._headPos.x - ax, this._headPos.z - az);
            if (d < 18) {
              const push = (18 - d) * 0.4; const dx = (ax - this._headPos.x) / (d || 1); const dz = (az - this._headPos.z) / (d || 1);
              for (const s of ai.segments) { s.x += dx * push; s.z += dz * push; s.mesh.position.set(s.x, 0.34, s.z); }
            }
          }
          this._burst(this._headPos.x, this._headPos.z, 0xff8040);
        } else if (got.type === 'teleport') {
          const a = Math.random() * Math.PI * 2, r = 25 + Math.random() * 40;
          const nx = this._headPos.x + Math.cos(a) * r, nz = this._headPos.z + Math.sin(a) * r;
          for (const s of this.snake.segments) { s.x += nx - this._headPos.x; s.z += nz - this._headPos.z; s.mesh.position.set(s.x, 0.34, s.z); }
          for (const h of this.snake.history) { h.x += nx - this._headPos.x; h.z += nz - this._headPos.z; }
          this._burst(nx, nz, 0xa0ff80);
        } else {
          this.snake.applyEffect(got.type, got.duration);
          if (got.type === 'speed') this.snake.speedMult = Math.max(this.snake.speedMult, 1.5);
        }
        this._burst(p.x, p.z, 0xffffff); this._emitStatus();
      }
    }
    this.population?.update(dt);
    this.events?.update(dt);
    this.missions?.update(dt);
    this._emitStatus();
    this.onProgress?.({
      distance: Math.floor(Math.hypot(this._headPos.x, this._headPos.z)),
      zone: this.world?.getZoneAt?.(this._headPos.x, this._headPos.z),
      xp: this.snake.xp, level: this.snake.level, coins: this.snake.coins,
    });
    if (this.mode === 'campaign') {
      this.surviveTimer += dt;
      if (this.levelTimer > 0) {
        this.levelTimer -= dt;
        if (this.levelTimer <= 0) { if (this._checkGoal()) this.levelClear(); else this.gameOver(); return; }
      }
      this._emitGoal();
      if (this._checkGoal()) this.levelClear();
    }
  }
  _updateCamera(dt) {
    if (!this.snake) return;
    this.snake.writeHead(this._headPos);
    const dir = this.snake.heading, len = this.snake.length;
    const height = 22 + Math.min(18, len * 0.3), back = 11 + Math.min(8, len * 0.12);
    this._camTarget.set(this._headPos.x - dir.x * back * 0.15, height + (this.snake.boosting ? 2 : 0), this._headPos.z - dir.z * back * 0.15 + back * 0.5);
    this.camera.position.lerp(this._camTarget, 1 - Math.exp(-this.camLerp * dt));
    this._look.set(this._headPos.x + dir.x * 5, 0.1, this._headPos.z + dir.z * 5);
    this._lookSmooth.lerp(this._look, 1 - Math.exp(-this.lookLerp * dt));
    this.camera.lookAt(this._lookSmooth);
    const wantFov = this._baseFov + (this.snake.boosting ? 7 : 0) + Math.min(6, len * 0.05);
    this.camera.fov += (wantFov - this.camera.fov) * (1 - Math.exp(-5 * dt));
    this.camera.updateProjectionMatrix();
  }
  _onResize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera.aspect = w / Math.max(1, h); this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h);
  }
  getScore() { return this.snake?.score || 0; }
  getCombo() { return this.snake?.combo || 1; }
  getLength() { return this.snake?.length || 0; }
  getLevelTimer() { return Math.max(0, this.levelTimer); }
  dispose() {
    this.stopLoop(); window.removeEventListener('resize', this._onResize);
    this.input.dispose(); this.snake?.dispose(); this._clearAIs(); this.world?.dispose();
    this._clearFoods(); this._clearPowerUps(); this.renderer.dispose();
  }
}
