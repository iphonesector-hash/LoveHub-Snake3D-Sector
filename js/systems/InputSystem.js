/**
 * InputSystem — full-screen touch steering (Snake.io style) + keyboard
 */

const DEADZONE = 0.08;
const JOY_RADIUS = 64;
const JOY_SIDE_KEY = 'snake3d_joy_side';
const SENS_KEY = 'snake3d_sensitivity';

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
    this.sensitivity = parseFloat(localStorage.getItem(SENS_KEY) || '1') || 1;
    this._keys = new Set();
    this.p2 = { heading: { x: 0, z: -1 }, magnitude: 0, boostHeld: false, active: false, id: null, ox: 0, oy: 0 };
    this._bind();
    this._applySide();
  }

  _bind() {
    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    window.addEventListener('keyup', this._onKeyUp, { passive: false });
    this.container.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.container.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.container.addEventListener('touchend', this._onTouchEnd, { passive: false });
    this.container.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
    this.zone = document.getElementById('joystick-zone');
    this.base = document.getElementById('joystick-base');
    this.knob = document.getElementById('joystick-knob');
    this.boostBtn = document.getElementById('btn-boost');
    this.sideBtn = document.getElementById('btn-joy-side');
    if (this.boostBtn) {
      const down = (e) => { e.preventDefault(); e.stopPropagation(); if (!this.enabled) return; this.boostHeld = true; this.boostBtn.classList.add('active'); };
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

  _isUI(el) {
    if (!el || !el.closest) return false;
    return !!(el.closest('.screen') || el.closest('.hud-btn') || el.closest('#btn-boost') || el.closest('.btn') || el.closest('.lang-btn') || el.closest('.panel') || el.closest('.menu-content'));
  }

  _applySide() {
    if (!this.zone || !this.boostBtn) return;
    const right = this.side === 'right';
    this.zone.classList.toggle('side-right', right);
    this.boostBtn.classList.toggle('side-left', right);
  }

  setSensitivity(v) {
    this.sensitivity = Math.max(0.5, Math.min(1.5, Number(v) || 1));
    localStorage.setItem(SENS_KEY, String(this.sensitivity));
  }

  _onTouchStart = (e) => {
    if (!this.enabled) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const el = document.elementFromPoint(t.clientX, t.clientY);
      if (this._isUI(el)) continue;
      e.preventDefault();
      if (!this.joystick.active) {
        this.joystick.active = true;
        this.joystick.id = t.identifier;
        this.joystick.ox = t.clientX;
        this.joystick.oy = t.clientY;
        this.analogActive = true;
        this._showFloatingJoy(t.clientX, t.clientY);
        this._joyUpdate(t.clientX, t.clientY, false);
      } else if (!this.p2.active) {
        this.p2.active = true;
        this.p2.id = t.identifier;
        this.p2.ox = t.clientX;
        this.p2.oy = t.clientY;
        this._p2Update(t.clientX, t.clientY);
      }
    }
  };

  _onTouchMove = (e) => {
    if (!this.enabled) return;
    let used = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (this.joystick.active && t.identifier === this.joystick.id) {
        e.preventDefault(); used = true; this._joyUpdate(t.clientX, t.clientY, true);
      } else if (this.p2.active && t.identifier === this.p2.id) {
        e.preventDefault(); used = true; this._p2Update(t.clientX, t.clientY);
      }
    }
    if (used) e.preventDefault();
  };

  _onTouchEnd = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (this.joystick.active && t.identifier === this.joystick.id) {
        e.preventDefault();
        this.joystick.active = false; this.joystick.id = null;
        this.analogActive = false; this.magnitude = 0;
        this._hideFloatingJoy();
      } else if (this.p2.active && t.identifier === this.p2.id) {
        e.preventDefault();
        this.p2.active = false; this.p2.id = null; this.p2.magnitude = 0;
      }
    }
  };

  _showFloatingJoy(x, y) {
    if (!this.zone) return;
    this.zone.classList.remove('hidden');
    this.zone.style.left = `${x - 64}px`;
    this.zone.style.top = `${y - 64}px`;
    this.zone.style.bottom = 'auto'; this.zone.style.right = 'auto'; this.zone.style.position = 'fixed';
    if (this.knob) { this.knob.style.transform = 'translate(-50%, -50%)'; this.knob.classList.add('active'); }
  }

  _hideFloatingJoy() {
    if (!this.zone) return;
    this.zone.classList.add('hidden');
    this.zone.style.left = ''; this.zone.style.top = ''; this.zone.style.position = '';
    this.zone.style.bottom = ''; this.zone.style.right = '';
    this._applySide();
    if (this.knob) { this.knob.style.transform = 'translate(-50%, -50%)'; this.knob.classList.remove('active'); }
  }

  _joyUpdate(cx, cy, follow) {
    let dx = cx - this.joystick.ox;
    let dy = cy - this.joystick.oy;
    const dist = Math.hypot(dx, dy);
    const max = this.joystick.radius;
    if (follow && dist > max * 1.35) {
      const scale = (dist - max) / dist;
      this.joystick.ox += dx * scale * 0.55;
      this.joystick.oy += dy * scale * 0.55;
      dx = cx - this.joystick.ox; dy = cy - this.joystick.oy;
      if (this.zone) { this.zone.style.left = `${this.joystick.ox - 64}px`; this.zone.style.top = `${this.joystick.oy - 64}px`; }
    }
    const d2 = Math.hypot(dx, dy);
    let kx = dx, ky = dy;
    if (d2 > max) { kx = (dx / d2) * max; ky = (dy / d2) * max; }
    if (this.knob) this.knob.style.transform = `translate(calc(-50% + ${kx.toFixed(1)}px), calc(-50% + ${ky.toFixed(1)}px))`;
    const norm = Math.min(1, d2 / max);
    if (norm < DEADZONE) { this.magnitude = 0; return; }
    const t = (norm - DEADZONE) / (1 - DEADZONE);
    const mag = t * t * (3 - 2 * t);
    const len = Math.hypot(dx, dy) || 1;
    this.heading = { x: dx / len, z: dy / len };
    this.magnitude = Math.min(1, Math.max(0.4, mag) * this.sensitivity);
    this.analogActive = true;
  }

  _p2Update(cx, cy) {
    let dx = cx - this.p2.ox, dy = cy - this.p2.oy;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) { this.p2.magnitude = 0; return; }
    if (dist > JOY_RADIUS * 1.3) {
      this.p2.ox = cx - (dx / dist) * JOY_RADIUS;
      this.p2.oy = cy - (dy / dist) * JOY_RADIUS;
      dx = cx - this.p2.ox; dy = cy - this.p2.oy;
    }
    const len = Math.hypot(dx, dy) || 1;
    this.p2.heading = { x: dx / len, z: dy / len };
    this.p2.magnitude = Math.min(1, (dist / JOY_RADIUS) * this.sensitivity);
  }

  _onKeyDown = (e) => {
    if (!this.enabled) return;
    const c = e.code;
    if (['ArrowUp','KeyW','ArrowDown','KeyS','ArrowLeft','KeyA','ArrowRight','KeyD'].includes(c)) { e.preventDefault(); this._keys.add(c); this._syncKeys(); }
    if (['KeyI','KeyK','KeyJ','KeyL'].includes(c)) { e.preventDefault(); this._keys.add(c); this._syncP2Keys(); }
    if (c === 'Space' || c === 'ShiftLeft' || c === 'ShiftRight') { e.preventDefault(); this.boostHeld = true; }
    if (c === 'KeyB') { e.preventDefault(); this.p2.boostHeld = true; }
  };

  _onKeyUp = (e) => {
    this._keys.delete(e.code); this._syncKeys(); this._syncP2Keys();
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { this.boostHeld = false; this.boostBtn?.classList.remove('active'); }
    if (e.code === 'KeyB') this.p2.boostHeld = false;
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
    this.magnitude = 1 * this.sensitivity;
  }

  _syncP2Keys() {
    let x = 0, z = 0;
    if (this._keys.has('KeyI')) z -= 1;
    if (this._keys.has('KeyK')) z += 1;
    if (this._keys.has('KeyJ')) x -= 1;
    if (this._keys.has('KeyL')) x += 1;
    if (x === 0 && z === 0) { if (!this.p2.active) this.p2.magnitude = 0; return; }
    const len = Math.hypot(x, z) || 1;
    this.p2.heading = { x: x / len, z: z / len };
    this.p2.magnitude = 1;
  }

  update(_dt) {}
  getHeading() { return this.heading; }
  getMagnitude() { return this.magnitude; }
  isBoosting() { return this.boostHeld; }
  getP2Heading() { return this.p2.heading; }
  getP2Magnitude() { return this.p2.magnitude; }
  isP2Boosting() { return this.p2.boostHeld; }
  setEnabled(v) {
    this.enabled = v;
    if (!v) {
      this.boostHeld = false; this.magnitude = 0; this.analogActive = false;
      this.joystick.active = false; this.p2.active = false; this.p2.magnitude = 0;
      this._keys.clear(); this.boostBtn?.classList.remove('active'); this._hideFloatingJoy();
    }
  }
  showControls(show) { this.boostBtn?.classList.toggle('hidden', !show); if (!show) this._hideFloatingJoy(); }
  getDirection() { return this.heading; }
  isAnalog() { return this.analogActive; }
  showJoystick(show) { this.showControls(show); }
  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.container.removeEventListener('touchstart', this._onTouchStart);
    this.container.removeEventListener('touchmove', this._onTouchMove);
    this.container.removeEventListener('touchend', this._onTouchEnd);
    this.container.removeEventListener('touchcancel', this._onTouchEnd);
  }
}
