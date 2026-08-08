/**
 * InputSystem — Snake.io-style 360° analog joystick (primary) + keyboard
 */

const DEADZONE = 0.1;
const JOY_RADIUS = 60;
const JOY_SIDE_KEY = 'snake3d_joy_side';

export class InputSystem {
  constructor(container) {
    this.container = container || document.body;
    this.enabled = true;
    this.heading = { x: 0, z: -1 };
    this.magnitude = 0;
    this.boostHeld = false;
    this.analogActive = false;
    this.joystick = { active: false, id: null, ox: 0, oy: 0, radius: JOY_RADIUS };
    this.side = localStorage.getItem(JOY_SIDE_KEY) || 'left';
    this._keys = new Set();
    this._bind();
    this._applySide();
  }

  _bind() {
    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    window.addEventListener('keyup', this._onKeyUp, { passive: false });
    this.container.addEventListener('touchstart', this._blockScroll, { passive: false });
    this.container.addEventListener('touchmove', this._blockScroll, { passive: false });
    this.zone = document.getElementById('joystick-zone');
    this.base = document.getElementById('joystick-base');
    this.knob = document.getElementById('joystick-knob');
    this.boostBtn = document.getElementById('btn-boost');
    this.sideBtn = document.getElementById('btn-joy-side');
    if (this.base) {
      this.base.addEventListener('touchstart', this._joyStart, { passive: false });
      this.base.addEventListener('touchmove', this._joyMove, { passive: false });
      this.base.addEventListener('touchend', this._joyEnd, { passive: false });
      this.base.addEventListener('touchcancel', this._joyEnd, { passive: false });
    }
    if (this.boostBtn) {
      const down = (e) => { e.preventDefault(); if (!this.enabled) return; this.boostHeld = true; this.boostBtn.classList.add('active'); };
      const up = (e) => { e.preventDefault(); this.boostHeld = false; this.boostBtn.classList.remove('active'); };
      this.boostBtn.addEventListener('touchstart', down, { passive: false });
      this.boostBtn.addEventListener('touchend', up, { passive: false });
      this.boostBtn.addEventListener('touchcancel', up, { passive: false });
      this.boostBtn.addEventListener('mousedown', down);
      this.boostBtn.addEventListener('mouseup', up);
      this.boostBtn.addEventListener('mouseleave', up);
    }
    if (this.sideBtn) {
      this.sideBtn.addEventListener('click', () => {
        this.side = this.side === 'left' ? 'right' : 'left';
        localStorage.setItem(JOY_SIDE_KEY, this.side);
        this._applySide();
      });
    }
  }

  _applySide() {
    if (!this.zone || !this.boostBtn) return;
    const right = this.side === 'right';
    this.zone.classList.toggle('side-right', right);
    this.boostBtn.classList.toggle('side-left', right);
  }

  _blockScroll = (e) => {
    if (!this.enabled) return;
    if (e.target.closest('.joystick-zone') || e.target.closest('#canvas-container') || e.target.closest('#btn-boost')) e.preventDefault();
  };

  _onKeyDown = (e) => {
    if (!this.enabled) return;
    const c = e.code;
    if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(c)) {
      e.preventDefault();
      this._keys.add(c);
      this._syncKeys();
    }
    if (c === 'Space' || c === 'ShiftLeft' || c === 'ShiftRight') { e.preventDefault(); this.boostHeld = true; }
  };

  _onKeyUp = (e) => {
    this._keys.delete(e.code);
    this._syncKeys();
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.boostHeld = false;
      this.boostBtn?.classList.remove('active');
    }
  };

  _syncKeys() {
    if (this.analogActive) return;
    let x = 0, z = 0;
    if (this._keys.has('ArrowUp') || this._keys.has('KeyW')) z -= 1;
    if (this._keys.has('ArrowDown') || this._keys.has('KeyS')) z += 1;
    if (this._keys.has('ArrowLeft') || this._keys.has('KeyA')) x -= 1;
    if (this._keys.has('ArrowRight') || this._keys.has('KeyD')) x += 1;
    if (x === 0 && z === 0) { this.magnitude = 0; return; }
    const len = Math.hypot(x, z) || 1;
    this.heading = { x: x / len, z: z / len };
    this.magnitude = 1;
  }

  _joyStart = (e) => {
    if (!this.enabled) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    const r = this.base.getBoundingClientRect();
    this.joystick.active = true;
    this.joystick.id = t.identifier;
    this.joystick.ox = r.left + r.width / 2;
    this.joystick.oy = r.top + r.height / 2;
    this.analogActive = true;
    this._joyUpdate(t.clientX, t.clientY);
  };

  _joyMove = (e) => {
    if (!this.joystick.active) return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== this.joystick.id) continue;
      this._joyUpdate(t.clientX, t.clientY);
    }
  };

  _joyEnd = (e) => {
    e.preventDefault();
    this.joystick.active = false;
    this.joystick.id = null;
    this.analogActive = false;
    this.magnitude = 0;
    if (this.knob) {
      this.knob.style.transform = 'translate(-50%, -50%)';
      this.knob.classList.remove('active');
    }
  };

  _joyUpdate(cx, cy) {
    let dx = cx - this.joystick.ox;
    let dy = cy - this.joystick.oy;
    const dist = Math.hypot(dx, dy);
    const max = this.joystick.radius;
    if (dist > max) { dx = (dx / dist) * max; dy = (dy / dist) * max; }
    if (this.knob) {
      this.knob.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
      this.knob.classList.toggle('active', dist > max * DEADZONE);
    }
    const norm = Math.min(1, dist / max);
    if (norm < DEADZONE) { this.magnitude = 0; return; }
    const t = (norm - DEADZONE) / (1 - DEADZONE);
    const mag = t * t * (3 - 2 * t);
    const len = Math.hypot(dx, dy) || 1;
    this.heading = { x: dx / len, z: dy / len };
    this.magnitude = Math.max(0.35, mag);
    this.analogActive = true;
  }

  update(_dt) {}
  getHeading() { return this.heading; }
  getMagnitude() { return this.magnitude; }
  isBoosting() { return this.boostHeld; }
  setEnabled(v) {
    this.enabled = v;
    if (!v) {
      this.boostHeld = false;
      this.magnitude = 0;
      this.analogActive = false;
      this._keys.clear();
      this.boostBtn?.classList.remove('active');
    }
  }
  showControls(show) {
    this.zone?.classList.toggle('hidden', !show);
    this.boostBtn?.classList.toggle('hidden', !show);
  }
  getDirection() { return this.heading; }
  isAnalog() { return this.analogActive; }
  showJoystick(show) { this.showControls(show); }
  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
