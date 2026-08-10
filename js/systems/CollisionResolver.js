/**
 * Resolve obstacle collisions.
 * Solid: block + slide along surface (no death).
 * Lethal/hazard: damage/death (shield absorbs one hit).
 * Ghost: pass through everything.
 *
 * Uses multi-sample sweeps to prevent tunneling at boost speeds.
 */
export function resolveSolidCollision(snake, headPos, collision, dt) {
  if (!snake?.alive || snake.hasGhost?.()) return { killed: false };

  const head = snake.segments[0];
  const hx = headPos.x;
  const hz = headPos.z;
  // Larger margin so visual mesh and collider stay in sync
  const margin = 0.55;

  // Primary sample at current head
  let obsHit = collision.testHead(hx, hz, margin);

  // Sweep samples along movement direction (anti-tunnel)
  if (!obsHit.hit) {
    const steps = snake.speed > 12 ? 5 : (snake.speed > 8 ? 3 : 2);
    const look = Math.min(snake.speed * dt, 1.6);
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * look;
      const mx = hx - snake.heading.x * t;
      const mz = hz - snake.heading.z * t;
      const h = collision.testHead(mx, mz, margin);
      if (h.hit) { obsHit = h; break; }
    }
  }

  // Radial samples around head for thick/box obstacles
  if (!obsHit.hit) {
    const s = 0.38;
    const samples = [
      [hx + s, hz], [hx - s, hz], [hx, hz + s], [hx, hz - s],
      [hx + s * 0.7, hz + s * 0.7], [hx - s * 0.7, hz - s * 0.7],
      [hx + s * 0.7, hz - s * 0.7], [hx - s * 0.7, hz + s * 0.7],
    ];
    for (const [sx, sz] of samples) {
      const h = collision.testHead(sx, sz, margin * 0.85);
      if (h.hit) { obsHit = h; break; }
    }
  }

  if (!obsHit.hit) return { killed: false };

  const o = obsHit.obstacle;
  if (!o || !o.alive) return { killed: false };

  // --- Shield absorbs one hit of any kind ---
  if (snake.hasShield()) {
    snake.effects.shield = 0;
    if (snake.effects.fortify) snake.effects.fortify = 0;
    _pushOut(head, headPos, o, 0.9);
    return {
      killed: false,
      shake: 0.45,
      absorbed: true,
      kind: o.kind || 'obstacle',
    };
  }

  // --- Lethal / hazard → death ---
  if (obsHit.lethal || o.lethal) {
    return {
      killed: true,
      burn: true,
      kind: o.kind || 'hazard',
      shake: 0.9,
    };
  }

  // --- Solid obstacle → ALWAYS block + slide ---
  if (obsHit.solid || o.solid !== false) {
    // Force push-out with generous padding
    _pushOut(head, headPos, o, 0.85);

    // Redirect heading away from surface
    const dx = head.x - o.x;
    const dz = head.z - o.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    const nx = dx / dist;
    const nz = dz / dist;
    const into = snake.heading.x * (-nx) + snake.heading.z * (-nz);
    if (into > 0) {
      snake.heading.x += nx * into * 1.1;
      snake.heading.z += nz * into * 1.1;
      const hl = Math.hypot(snake.heading.x, snake.heading.z) || 1;
      snake.heading.x /= hl;
      snake.heading.z /= hl;
    }
    // Hard speed damp on impact so we don't re-tunnel next frame
    if (snake.speed > 6) snake.speed *= 0.55;
    snake.boosting = false;

    return {
      killed: false,
      blocked: true,
      solid: true,
      kind: o.kind || 'obstacle',
      shake: 0.22,
      nearMiss: false,
    };
  }

  return { killed: false };
}

/** Push head fully outside the obstacle collider. Always attempts a push. */
function _pushOut(head, headPos, o, extra = 0.7) {
  if (o.type === 'box') {
    const dx = head.x - o.x;
    const dz = head.z - o.z;
    const halfW = (o.halfW || 1) + extra;
    const halfD = (o.halfD || 1) + extra;

    // If inside expanded box, push to nearest face
    if (Math.abs(dx) <= halfW && Math.abs(dz) <= halfD) {
      const toEdgeX = halfW - Math.abs(dx);
      const toEdgeZ = halfD - Math.abs(dz);
      if (toEdgeX < toEdgeZ) {
        head.x += (dx >= 0 ? 1 : -1) * (toEdgeX + 0.12);
      } else {
        head.z += (dz >= 0 ? 1 : -1) * (toEdgeZ + 0.12);
      }
      head.mesh.position.set(head.x, 0.34, head.z);
      headPos.set(head.x, 0.34, head.z);
      return true;
    }

    // Outside but near — push along closest point on box surface
    const px = Math.max(-o.halfW, Math.min(o.halfW, dx));
    const pz = Math.max(-o.halfD, Math.min(o.halfD, dz));
    const ox = dx - px;
    const oz = dz - pz;
    const od = Math.hypot(ox, oz);
    if (od > 0 && od < extra + 0.3) {
      const need = extra + 0.15;
      const push = need - od;
      head.x += (ox / od) * push;
      head.z += (oz / od) * push;
      head.mesh.position.set(head.x, 0.34, head.z);
      headPos.set(head.x, 0.34, head.z);
      return true;
    }
    return false;
  }

  // circle / cylinder / hazard
  const pushR = (o.radius || 1.2) + extra;
  const dx = head.x - o.x;
  const dz = head.z - o.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  if (dist < pushR) {
    const push = pushR - dist + 0.15;
    head.x += (dx / dist) * push;
    head.z += (dz / dist) * push;
    head.mesh.position.set(head.x, 0.34, head.z);
    headPos.set(head.x, 0.34, head.z);
    return true;
  }
  return false;
}
