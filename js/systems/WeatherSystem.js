/**
 * WeatherSystem — world-biased weather with visual + light gameplay effects.
 * Fully wired from GameEngine; no placeholders.
 */
import * as THREE from 'three';

export const WEATHER_TYPES = {
  sunny:        { id: 'sunny',        label: 'Sunny',        labelFa: '\u0622\u0641\u062a\u0627\u0628\u06cc',   fogMul: 1.0, speedMul: 1.0,  xpMul: 1.0,  particle: null },
  rain:         { id: 'rain',         label: 'Rain',         labelFa: '\u0628\u0627\u0631\u0627\u0646',       fogMul: 1.15,speedMul: 0.97, xpMul: 1.0,  particle: 'rain' },
  heavy_rain:   { id: 'heavy_rain',   label: 'Heavy Rain',   labelFa: '\u0628\u0627\u0631\u0627\u0646 \u0634\u062f\u06cc\u062f', fogMul: 1.35,speedMul: 0.93, xpMul: 1.05, particle: 'rain' },
  snow:         { id: 'snow',         label: 'Snow',         labelFa: '\u0628\u0631\u0641',         fogMul: 1.2, speedMul: 0.9,  xpMul: 1.05, particle: 'snow' },
  fog:          { id: 'fog',          label: 'Fog',          labelFa: '\u0645\u0647',           fogMul: 1.8, speedMul: 1.0,  xpMul: 1.0,  particle: null },
  storm:        { id: 'storm',        label: 'Storm',        labelFa: '\u0637\u0648\u0641\u0627\u0646',       fogMul: 1.5, speedMul: 0.95, xpMul: 1.1,  particle: 'rain' },
  sandstorm:    { id: 'sandstorm',    label: 'Sandstorm',    labelFa: '\u0637\u0648\u0641\u0627\u0646 \u0634\u0646',  fogMul: 2.0, speedMul: 0.88, xpMul: 1.1,  particle: 'dust' },
  ashfall:      { id: 'ashfall',      label: 'Ashfall',      labelFa: '\u0628\u0627\u0631\u0634 \u062e\u0627\u06a9\u0633\u062a\u0631', fogMul: 1.4, speedMul: 0.94, xpMul: 1.08, particle: 'embers' },
  meteor_shower:{ id: 'meteor_shower',label: 'Meteor Shower',labelFa: '\u0628\u0627\u0631\u0634 \u0634\u0647\u0627\u0628', fogMul: 1.1, speedMul: 1.0,  xpMul: 1.2,  particle: 'embers' },
  aurora:       { id: 'aurora',       label: 'Aurora',       labelFa: '\u0634\u0641\u0642 \u0642\u0637\u0628\u06cc',   fogMul: 0.9, speedMul: 1.0,  xpMul: 1.25, particle: 'aurora' },
};

export class WeatherSystem {
  constructor(engine) {
    this.engine = engine;
    this.current = WEATHER_TYPES.sunny;
    this.timer = 0;
    this._pts = null;
    this._vel = null;
    this._count = 0;
  }

  start(worldDef) {
    const bias = worldDef?.weatherBias || ['sunny'];
    const defId = worldDef?.weatherDefault || bias[0] || 'sunny';
    this._setWeather(defId);
    this.timer = 25 + Math.random() * 35;
  }

  update(dt, worldDef, playerX = 0, playerZ = 0) {
    this.timer -= dt;
    if (this.timer <= 0) {
      const bias = worldDef?.weatherBias || ['sunny'];
      const next = bias[(Math.random() * bias.length) | 0];
      this._setWeather(next);
      this.timer = 35 + Math.random() * 45;
      this.engine?.onToast?.({
        text: '\u2601 ' + (this.current.label || next).toUpperCase(),
        color: '#a0d0ff',
      });
    }
    this._updateParticles(dt, playerX, playerZ);
  }

  _setWeather(id) {
    this.current = WEATHER_TYPES[id] || WEATHER_TYPES.sunny;
    this._rebuildParticles();
    const scene = this.engine?.scene;
    if (scene?.fog && this.engine?.world?.def) {
      const base = this.engine.world.def.fogDensity || 0.005;
      scene.fog.density = base * (this.current.fogMul || 1);
    }
  }

  getSpeedMul() { return this.current.speedMul || 1; }
  getXpMul() { return this.current.xpMul || 1; }
  getLabel() { return this.current.label || 'Sunny'; }
  getLabelFa() { return this.current.labelFa || this.current.label; }
  getId() { return this.current.id || 'sunny'; }

  _rebuildParticles() {
    const scene = this.engine?.scene;
    if (this._pts && scene) {
      scene.remove(this._pts);
      this._pts.geometry?.dispose();
      this._pts.material?.dispose();
      this._pts = null;
    }
    const kind = this.current.particle;
    if (!kind || !scene) return;

    const n = kind === 'rain' || kind === 'snow' ? 400 : 220;
    this._count = n;
    const pos = new Float32Array(n * 3);
    this._vel = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 30 + 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      if (kind === 'rain') {
        this._vel[i * 3] = 0; this._vel[i * 3 + 1] = -12 - Math.random() * 8; this._vel[i * 3 + 2] = 0;
      } else if (kind === 'snow') {
        this._vel[i * 3] = (Math.random() - 0.5) * 1.5; this._vel[i * 3 + 1] = -1.5 - Math.random() * 2; this._vel[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      } else if (kind === 'dust') {
        this._vel[i * 3] = 4 + Math.random() * 6; this._vel[i * 3 + 1] = (Math.random() - 0.5) * 2; this._vel[i * 3 + 2] = (Math.random() - 0.5) * 3;
      } else {
        this._vel[i * 3] = (Math.random() - 0.5) * 2; this._vel[i * 3 + 1] = 1 + Math.random() * 2; this._vel[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const colors = {
      rain: 0xa0c8ff, snow: 0xe8f0ff, dust: 0xc0a060, embers: 0xff6030, aurora: 0x60ffc0,
    };
    const mat = new THREE.PointsMaterial({
      color: colors[kind] || 0xffffff,
      size: kind === 'rain' ? 0.12 : (kind === 'snow' ? 0.22 : 0.28),
      transparent: true, opacity: 0.65, depthWrite: false, sizeAttenuation: true, fog: false,
    });
    this._pts = new THREE.Points(geo, mat);
    this._pts.frustumCulled = false;
    scene.add(this._pts);
  }

  _updateParticles(dt, px, pz) {
    if (!this._pts || !this._vel) return;
    const pos = this._pts.geometry.attributes.position.array;
    const n = this._count;
    for (let i = 0; i < n; i++) {
      pos[i * 3] += this._vel[i * 3] * dt;
      pos[i * 3 + 1] += this._vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += this._vel[i * 3 + 2] * dt;
      if (pos[i * 3 + 1] < 0 || Math.abs(pos[i * 3] - px) > 50 || Math.abs(pos[i * 3 + 2] - pz) > 50) {
        pos[i * 3] = px + (Math.random() - 0.5) * 70;
        pos[i * 3 + 1] = 8 + Math.random() * 25;
        pos[i * 3 + 2] = pz + (Math.random() - 0.5) * 70;
      }
    }
    this._pts.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    if (this._pts && this.engine?.scene) {
      this.engine.scene.remove(this._pts);
      this._pts.geometry?.dispose();
      this._pts.material?.dispose();
    }
    this._pts = null;
  }
}
