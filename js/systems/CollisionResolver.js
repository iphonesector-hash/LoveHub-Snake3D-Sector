/**
 * Resolve obstacle collisions.
 * Solid: block + slide along surface (no death).
 * Lethal/hazard: damage/death (shield absorbs one hit).
 * Ghost: pass through everything.
 */
export function resolveSolidCollision(snake, headPos, collision, dt) {
  if (!snake?.alive || snake.hasGhost?.()) return { killed: false };

  const head = snake.segments[0];
  const hx = headPos.x;
  const hz = headPos.z;
  const margin = 0.42;

  // Primary sample
  let obsHit = collision.testHead(hx, hz, margin);

  // Anti-tunnel sample while moving fast / boosting
  if (!obsHit.hit && snake.speed > 10) {
    const look = Math.min(snake.speed * dt * 0.65, 1.1);
    const mx = hx - snake.heading.x * look;
    const mz = hz - snake.heading.z * look;
    obsHit = collision.testHead(mx, mz, margin);
  }

  // Extra samples around head for thick obstacles
  if (!obsHit.hit) {
    const s = 0.28;
    const samples = [
      [hx + s, hz], [hx - s, hz], [hx, hz + s], [hx, hz - s],
    ];
    for (const [sx, sz] of samples) {
      const h = collision.testHead(sx, sz, margin * 0.9);
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
    _pushOut(head, headPos, o, 0.65);
    return {
      killed: false,
      shake: 0.4,
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
      shake: 0.85,
    };
  }

  // --- Solid obstacle → block + slide (NO death) ---
  if (obsHit.solid || o.solid !== false) {
    const blocked = _pushOut(head, headPos, o, 0.55);
    // Soft-stop forward motion into the obstacle so we don't keep tunneling
    if (blocked) {
      const dx = head.x - o.x;
      const dz = head.z - o.z;
      const dist = Math.hypot(dx, dz) || 0.001;
      const nx = dx / dist;
      const nz = dz / dist;
      // Remove velocity component pointing into the surface
      const into = snake.heading.x * (-nx) + snake.heading.z * (-nz);
      if (into > 0) {
        snake.heading.x += nx * into * 0.85;
        snake.heading.z += nz * into * 0.85;
        const hl = Math.hypot(snake.heading.x, snake.heading.z) || 1;
        snake.heading.x /= hl;
        snake.heading.z /= hl;
        // Brief speed damp when slamming into solid
        if (snake.speed > 9) snake.speed *= 0.72;
      }
    }
    return {
      killed: false,
      blocked: true,
      solid: true,
      kind: o.kind || 'obstacle',
      shake: blocked ? 0.18 : 0,
      nearMiss: false,
    };
  }

  return { killed: false };
}

/** Push head outside the obstacle collider. Returns true if a push occurred. */
function _pushOut(head, headPos, o, extra = 0.5) {
  let pushR;
  if (o.type === 'box') {
    pushR = Math.max(o.halfW || 1, o.halfD || 1) + extra;
    // Axis-aligned push for boxes (more stable sliding)
    const dx = head.x - o.x;
    const dz = head.z - o.z;
    const px = Math.max(-o.halfW, Math.min(o.halfW, dx));
    const pz = Math.max(-o.halfD, Math.min(o.halfD, dz));
    const ox = dx - px;
    const oz = dz - pz;
    const od = Math.hypot(ox, oz);
    if (od < 0.001 && Math.abs(dx) <= o.halfW && Math.abs(dz) <= o.halfD) {
      // Deep inside — push along shortest axis
      const toEdgeX = o.halfW - Math.abs(dx) + extra;
      const toEdgeZ = o.halfD - Math.abs(dz) + extra;
      if (toEdgeX < toEdgeZ) {
        head.x += (dx >= 0 ? 1 : -1) * toEdgeX;
      } else {
        head.z += (dz >= 0 ? 1 : -1) * toEdgeZ;
      }
      head.mesh.position.set(head.x, 0.34, head.z);
      headPos.set(head.x, 0.34, head.z);
      return true;
    }
    if (od > 0 && od < extra + 0.15) {
      const need = extra + 0.12;
      const push = need - od;
      head.x += (ox / od) * push;
      head.z += (oz / od) * push;
      head.mesh.position.set(head.x, 0.34, head.z);
      headPos.set(head.x, 0.34, head.z);
      return true;
    }
    return false;
  }

  // circle / cylinder / hazard radius
  pushR = (o.radius || 1.2) + extra;
  const dx = head.x - o.x;
  const dz = head.z - o.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  if (dist < pushR) {
    const push = pushR - dist + 0.08;
    head.x += (dx / dist) * push;
    head.z += (dz / dist) * push;
    head.mesh.position.set(head.x, 0.34, head.z);
    headPos.set(head.x, 0.34, head.z);
    return true;
  }
  return false;
}
