/**
 * InputSystem — Snake.io-style analog steering
 * Primary: virtual joystick (360°). Desktop: WASD/Arrows + Space boost.
 */

const DEADZONE = 0.08;
const JOY_RADIUS = 58;
const HAND_KEY = 'snake3d_hand';

export class InputSystem {
  constructor(container) {
    this.container = container || document.body;
    this.enabled = true;
    this.desiredX = 0;
    this.desiredZ = -1;
    this.magnitude = 0;
    this.boost = false;
    this.steeringActive = false;
    this.hand = localStorage.getItem(HAND_KEY) === 'right' ? 'right' : 'left';
    this.joystick = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
    this._keys = new Set();
    this._bind();
    this._applyHandLayout();
  }

  _bind() {
    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    window.addEventListener('keyup', this._onKeyUp, { passive: false });
    this.zone = document.getElementById('joystick-zone');
    this.base = document.getElementById('joystick-base');
    this.knob = document.getElementById('joystick-knob');
    this.boostBtn = document.getElementById('btn-boost');
    this.handBtn = document.getElementById('btn-hand');
    const root = document.getElementById('game-root') || this.container;
    root.addEventListener('touchmove', this._blockScroll, { passive: false });
    root.addEventListener('touchstart', this._blockScroll, { passive: false });
    if (this.base) {
      this.base.addEventListener('touchstart', this._joyStart, { passive: false });
      this.base.addEventListener('touchmove', this._joyMove, { passive: false });
      this.base.addEventListener('touchend', this._joyEnd, { passive: false });
      this.base.addEventListener('touchcancel', this._joyEnd, { passive: false });
      this.base.addEventListener('pointerdown', this._ptrDown, { passive: false });
    }
    window.addEventListener('pointermove', this._ptrMove, { passive: false });
    window.addEventListener('pointerup', this._ptrUp, { passive: false });
    window.addEventListener('pointercancel', this._ptrUp, { passive: false });
    if (this.boostBtn) {
      const set = (v) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.enabled) return;
        this.boost = v;
        this.boostBtn.classList.toggle('active', v);
      };
      ['touchstart', 'mousedown'].forEach((ev) => this.boostBtn.addEventListener(ev, set(true), { passive: false }));
      ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach((ev) =>
        this.boostBtn.addEventListener(ev, set(false), { passive: false })
      );
    }
    if (this.handBtn) {
      this.handBtn.addEventListener('click', () => {
        this.hand = this.hand === 'left' ? 'right' : 'left';
        localStorage.setItem(HAND_KEY, this.hand);
        this._applyHandLayout();
      });
    }
  }

  _applyHandLayout() {
    const zone = this.zone;
    const boost = this.boostBtn;
    if (!zone) return;
    zone.classList.toggle('hand-right', this.hand === 'right');
    zone.classList.toggle('hand-left', this.hand === 'left');
    if (boost) {
      boost.classList.toggle('hand-right', this.hand === 'right');
      boost.classList.toggle('hand-left', this.hand === 'left');
    }
    if (this.handBtn) this.handBtn.textContent = this.hand === 'left' ? 'LH' : 'RH';
  }

  _blockScroll = (e) => {
    if (!this.enabled) return;
    if (
      e.target.closest?.('#joystick-zone') ||
      e.target.closest?.('#canvas-container') ||
      e.target.closest?.('#btn-boost')
    ) e.preventDefault();
  };

  _onKeyDown = (e) => {
    if (!this.enabled) return;
    const c = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(c)) e.preventDefault();
    if (c === 'Space' || c === 'ShiftLeft' || c === 'ShiftRight') { this.boost = true; return; }
    this._keys.add(c);
    this._syncKeys();
  };

  _onKeyUp = (e) => {
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.boost = false;
      if (this.boostBtn) this.boostBtn.classList.remove('active');
    }
    this._keys.delete(e.code);
    this._syncKeys();
  };

  _syncKeys() {
    let x = 0, z = 0;
    if (this._keys.has('ArrowUp') || this._keys.has('KeyW')) z -= 1;
    if (this._keys.has('ArrowDown') || this._keys.has('KeyS')) z += 1;
    if (this._keys.has('ArrowLeft') || this._keys.has('KeyA')) x -= 1;
    if (this._keys.has('ArrowRight') || this._keys.has('KeyD')) x += 1;
    const len = Math.hypot(x, z);
    if (len > 0.01) {
      this.desiredX = x / len;
      this.desiredZ = z / len;
      this.magnitude = 1;
      this.steeringActive = true;
    } else if (!this.joystick.active) {
      this.magnitude = 0;
      this.steeringActive = false;
    }
  }

  _joyStart = (e) => {
    if (!this.enabled) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    this._begin(t.clientX, t.clientY, t.identifier);
  };
  _joyMove = (e) => {
    if (!this.joystick.active) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this.joystick.id != null && t.identifier !== this.joystick.id) continue;
      this._update(t.clientX, t.clientY);
    }
  };
  _joyEnd = (e) => { e.preventDefault(); this._release(); };

  _ptrDown = (e) => {
    if (!this.enabled || e.pointerType === 'touch') return;
    e.preventDefault();
    this.base.setPointerCapture?.(e.pointerId);
    this._begin(e.clientX, e.clientY, e.pointerId);
  };
  _ptrMove = (e) => {
    if (!this.joystick.active || e.pointerType === 'touch') return;
    if (this.joystick.id != null && e.pointerId !== this.joystick.id) return;
    e.preventDefault();
    this._update(e.clientX, e.clientY);
  };
  _ptrUp = (e) => {
    if (!this.joystick.active || e.pointerType === 'touch') return;
    if (this.joystick.id != null && e.pointerId !== this.joystick.id) return;
    this._release();
  };

  _begin(cx, cy, id) {
    const rect = this.base.getBoundingClientRect();
    this.joystick.active = true;
    this.joystick.id = id;
    this.joystick.ox = rect.left + rect.width / 2;
    this.joystick.oy = rect.top + rect.height / 2;
    this._update(cx, cy);
  }

  _update(cx, cy) {
    let dx = cx - this.joystick.ox;
    let dy = cy - this.joystick.oy;
    const dist = Math.hypot(dx, dy);
    const max = JOY_RADIUS;
    if (dist > max) { const s = max / dist; dx *= s; dy *= s; }
    this.joystick.dx = dx;
    this.joystick.dy = dy;
    if (this.knob) this.knob.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
    const norm = Math.min(1, dist / max);
    if (norm < DEADZONE) { this.magnitude = 0; this.steeringActive = false; return; }
    const t = (norm - DEADZONE) / (1 - DEADZONE);
    const mag = t * t * (3 - 2 * t);
    const len = Math.hypot(dx, dy) || 1;
    this.desiredX = dx / len;
    this.desiredZ = dy / len;
    this.magnitude = mag;
    this.steeringActive = true;
  }

  _release() {
    this.joystick.active = false;
    this.joystick.id = null;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
    this.magnitude = 0;
    this.steeringActive = false;
    if (this.knob) this.knob.style.transform = 'translate(-50%, -50%)';
  }

  update(_dt) {}
  getDesiredHeading() { return { x: this.desiredX, z: this.desiredZ }; }
  getMagnitude() { return this.magnitude; }
  isSteering() { return this.steeringActive; }
  isBoosting() { return this.boost; }
  setEnabled(v) {
    this.enabled = v;
    if (!v) { this.boost = false; this._release(); this._keys.clear(); }
  }
  showJoystick(show) {
    if (this.zone) this.zone.classList.toggle('hidden', !show);
    if (this.boostBtn) this.boostBtn.classList.toggle('hidden', !show);
  }
  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('pointermove', this._ptrMove);
    window.removeEventListener('pointerup', this._ptrUp);
    window.removeEventListener('pointercancel', this._ptrUp);
  }
}
