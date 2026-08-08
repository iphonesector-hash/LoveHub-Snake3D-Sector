/**
 * InputSystem — professional mobile-first controls
 * Analog joystick + swipe + keyboard. Prevents browser gestures.
 */

const DEADZONE = 0.12;
const JOY_MAX_RADIUS = 56;
const SWIPE_MIN_DIST = 36;
const SWIPE_MAX_DURATION = 450;
const TURN_COOLDOWN = 0.08;

export class InputSystem {
  constructor(container) {
    this.container = container || document.body;
    this.targetDirection = { x: 0, z: -1 };
    this.magnitude = 1;
    this.boost = false;
    this.enabled = true;
    this._lastHeading = { x: 0, z: -1 };
    this.joystick = {
      active: false,
      pointerId: null,
      originX: 0,
      originY: 0,
      dx: 0,
      dy: 0,
      maxRadius: JOY_MAX_RADIUS,
      visualX: 0,
      visualY: 0,
    };
    this._swipe = null;
    this._discreteCooldown = 0;
    this._usingAnalog = false;
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    window.addEventListener('keyup', this._onKeyUp, { passive: false });
    this.container.addEventListener('touchstart', this._preventScroll, { passive: false });
    this.container.addEventListener('touchmove', this._preventScroll, { passive: false });

    this.base = document.getElementById('joystick-base');
    this.knob = document.getElementById('joystick-knob');
    this.zone = document.getElementById('joystick-zone');
    this.boostBtn = document.getElementById('btn-boost');

    if (this.base) {
      this.base.addEventListener('touchstart', this._onJoyStart, { passive: false });
      this.base.addEventListener('touchmove', this._onJoyMove, { passive: false });
      this.base.addEventListener('touchend', this._onJoyEnd, { passive: false });
      this.base.addEventListener('touchcancel', this._onJoyEnd, { passive: false });
      this.base.addEventListener('pointerdown', this._onJoyPointerDown, { passive: false });
    }

    window.addEventListener('pointermove', this._onJoyPointerMove, { passive: false });
    window.addEventListener('pointerup', this._onJoyPointerUp, { passive: false });
    window.addEventListener('pointercancel', this._onJoyPointerUp, { passive: false });

    const canvas = document.getElementById('canvas-container');
    if (canvas) {
      canvas.addEventListener('touchstart', this._onSwipeStart, { passive: false });
      canvas.addEventListener('touchmove', this._onSwipeMove, { passive: false });
      canvas.addEventListener('touchend', this._onSwipeEnd, { passive: false });
      canvas.addEventListener('touchcancel', this._onSwipeEnd, { passive: false });
    }

    if (this.boostBtn) {
      const setBoost = (v) => (e) => {
        e.preventDefault();
        if (!this.enabled) return;
        this.boost = v;
        this.boostBtn.classList.toggle('active', v);
      };
      this.boostBtn.addEventListener('touchstart', setBoost(true), { passive: false });
      this.boostBtn.addEventListener('touchend', setBoost(false), { passive: false });
      this.boostBtn.addEventListener('touchcancel', setBoost(false), { passive: false });
      this.boostBtn.addEventListener('mousedown', setBoost(true));
      this.boostBtn.addEventListener('mouseup', setBoost(false));
      this.boostBtn.addEventListener('mouseleave', setBoost(false));
    }
  }

  _preventScroll = (e) => {
    if (!this.enabled) return;
    if (
      e.target.closest('.joystick-zone') ||
      e.target.closest('#canvas-container') ||
      e.target.closest('#btn-boost')
    ) {
      e.preventDefault();
    }
  };

  _onKeyDown = (e) => {
    if (!this.enabled) return;
    const code = e.code;
    let set = null;
    switch (code) {
      case 'ArrowUp':
      case 'KeyW':
        set = { x: 0, z: -1 };
        break;
      case 'ArrowDown':
      case 'KeyS':
        set = { x: 0, z: 1 };
        break;
      case 'ArrowLeft':
      case 'KeyA':
        set = { x: -1, z: 0 };
        break;
      case 'ArrowRight':
      case 'KeyD':
        set = { x: 1, z: 0 };
        break;
      case 'Space':
      case 'ShiftLeft':
      case 'ShiftRight':
        this.boost = true;
        e.preventDefault();
        return;
      default:
        return;
    }
    if (set) {
      e.preventDefault();
      this._applyDiscreteDirection(set.x, set.z);
    }
  };

  _onKeyUp = (e) => {
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.boost = false;
      if (this.boostBtn) this.boostBtn.classList.remove('active');
    }
  };

  _applyDiscreteDirection(x, z) {
    if (this._discreteCooldown > 0) return false;
    const cx = this._lastHeading.x;
    const cz = this._lastHeading.z;
    const dot = cx * x + cz * z;
    if (dot < -0.55) return false;
    this.targetDirection = { x, z };
    this._lastHeading = { x, z };
    this.magnitude = 1;
    this._usingAnalog = false;
    this._discreteCooldown = TURN_COOLDOWN;
    return true;
  }

  _onJoyStart = (e) => {
    if (!this.enabled) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    this._joyBegin(t.clientX, t.clientY, t.identifier);
  };

  _onJoyMove = (e) => {
    if (!this.joystick.active) return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (this.joystick.pointerId != null && t.identifier !== this.joystick.pointerId) continue;
      this._joyUpdate(t.clientX, t.clientY);
    }
  };

  _onJoyEnd = (e) => {
    e.preventDefault();
    this._joyRelease();
  };

  _onJoyPointerDown = (e) => {
    if (!this.enabled || e.pointerType === 'touch') return;
    e.preventDefault();
    this.base.setPointerCapture?.(e.pointerId);
    this._joyBegin(e.clientX, e.clientY, e.pointerId);
  };

  _onJoyPointerMove = (e) => {
    if (!this.joystick.active || e.pointerType === 'touch') return;
    if (this.joystick.pointerId != null && e.pointerId !== this.joystick.pointerId) return;
    e.preventDefault();
    this._joyUpdate(e.clientX, e.clientY);
  };

  _onJoyPointerUp = (e) => {
    if (!this.joystick.active || e.pointerType === 'touch') return;
    if (this.joystick.pointerId != null && e.pointerId !== this.joystick.pointerId) return;
    this._joyRelease();
  };

  _joyBegin(clientX, clientY, id) {
    const rect = this.base.getBoundingClientRect();
    this.joystick.active = true;
    this.joystick.pointerId = id;
    this.joystick.originX = rect.left + rect.width / 2;
    this.joystick.originY = rect.top + rect.height / 2;
    this._usingAnalog = true;
    this._joyUpdate(clientX, clientY);
  }

  _joyUpdate(clientX, clientY) {
    let dx = clientX - this.joystick.originX;
    let dy = clientY - this.joystick.originY;
    const dist = Math.hypot(dx, dy);
    const max = this.joystick.maxRadius;
    if (dist > max) {
      const s = max / dist;
      dx *= s;
      dy *= s;
    }
    this.joystick.dx = dx;
    this.joystick.dy = dy;
    this.joystick.visualX = dx;
    this.joystick.visualY = dy;
    if (this.knob) {
      this.knob.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
      this.knob.classList.toggle('active', dist > max * DEADZONE);
    }
    const norm = dist / max;
    if (norm < DEADZONE) {
      this.magnitude = 0;
      return;
    }
    const mag = Math.min(1, (norm - DEADZONE) / (1 - DEADZONE));
    const len = Math.hypot(dx, dy) || 1;
    const x = dx / len;
    const z = dy / len;
    this.targetDirection = { x, z };
    this._lastHeading = { x, z };
    this.magnitude = mag;
    this._usingAnalog = true;
  }

  _joyRelease() {
    this.joystick.active = false;
    this.joystick.pointerId = null;
    this.joystick.dx = 0;
    this.joystick.dy = 0;
    this.joystick.visualX = 0;
    this.joystick.visualY = 0;
    if (this.knob) {
      this.knob.style.transform = 'translate(-50%, -50%)';
      this.knob.classList.remove('active');
    }
    this.magnitude = 1;
    this.targetDirection = { ...this._lastHeading };
    this._usingAnalog = false;
  }

  _onSwipeStart = (e) => {
    if (!this.enabled || e.touches.length !== 1) return;
    if (e.target.closest?.('.joystick-zone')) return;
    e.preventDefault();
    const t = e.touches[0];
    this._swipe = { x: t.clientX, y: t.clientY, t: performance.now(), used: false };
  };

  _onSwipeMove = (e) => {
    if (!this._swipe || this._swipe.used || e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - this._swipe.x;
    const dy = t.clientY - this._swipe.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < SWIPE_MIN_DIST) return;
    if (absX > absY * 1.15) {
      this._applyDiscreteDirection(dx > 0 ? 1 : -1, 0);
    } else if (absY > absX * 1.15) {
      this._applyDiscreteDirection(0, dy > 0 ? 1 : -1);
    } else {
      const len = Math.hypot(dx, dy) || 1;
      this._applyDiscreteDirection(dx / len, dy / len);
    }
    this._swipe.x = t.clientX;
    this._swipe.y = t.clientY;
    this._swipe.t = performance.now();
  };

  _onSwipeEnd = (e) => {
    if (!this._swipe) return;
    e.preventDefault();
    const t = e.changedTouches?.[0];
    if (t && !this._swipe.used) {
      const dx = t.clientX - this._swipe.x;
      const dy = t.clientY - this._swipe.y;
      const dt = performance.now() - this._swipe.t;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) >= SWIPE_MIN_DIST && dt <= SWIPE_MAX_DURATION) {
        if (absX > absY) this._applyDiscreteDirection(dx > 0 ? 1 : -1, 0);
        else this._applyDiscreteDirection(0, dy > 0 ? 1 : -1);
      }
    }
    this._swipe = null;
  };

  update(dt) {
    if (this._discreteCooldown > 0) {
      this._discreteCooldown = Math.max(0, this._discreteCooldown - dt);
    }
  }

  getDirection() { return this.targetDirection; }
  getMagnitude() { return this.magnitude; }
  isBoosting() { return this.boost; }
  isAnalog() { return this._usingAnalog; }

  setEnabled(v) {
    this.enabled = v;
    if (!v) {
      this.boost = false;
      this._joyRelease();
    }
  }

  showJoystick(show) {
    if (this.zone) this.zone.classList.toggle('hidden', !show);
    if (this.boostBtn) this.boostBtn.classList.toggle('hidden', !show);
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('pointermove', this._onJoyPointerMove);
    window.removeEventListener('pointerup', this._onJoyPointerUp);
    window.removeEventListener('pointercancel', this._onJoyPointerUp);
  }
}
