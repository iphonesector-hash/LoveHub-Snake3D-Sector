import * as THREE from 'three';
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
  const margin = 0.62;

  // Primary sample at current head
  let obsHit = collision.testHead(hx, hz, margin);

  // Sweep samples along path traveled (anti-tunnel) + slight forward
  if (!obsHit.hit) {
    const steps = snake.speed > 12 ? 8 : (snake.speed > 8 ? 5 : 3);
    const look = Math.min(Math.max(snake.speed * dt, 0.4), 2.4);
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * look;
      // Path behind (where we came from)
      let h = collision.testHead(hx - snake.heading.x * t, hz - snake.heading.z * t, margin);
      if (h.hit) { obsHit = h; break; }
      // Slight forward probe at high speed
      if (snake.speed > 10) {
        h = collision.testHead(hx + snake.heading.x * t * 0.25, hz + snake.heading.z * t * 0.25, margin * 0.9);
        if (h.hit) { obsHit = h; break; }
      }
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
    _pushOut(head, headPos, o, 1.0);
    _syncHistory(snake, head);
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
    // Multi-pass push-out so we leave the volume fully
    for (let pass = 0; pass < 4; pass++) {
      const still = _pushOut(head, headPos, o, 1.05 + pass * 0.15);
      if (!still) break;
    }
    _syncHistory(snake, head);

    // Redirect heading away from surface
    const dx = head.x - o.x;
    const dz = head.z - o.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    const nx = dx / dist;
    const nz = dz / dist;
    const into = snake.heading.x * (-nx) + snake.heading.z * (-nz);
    if (into > 0) {
      snake.heading.x += nx * into * 1.25;
      snake.heading.z += nz * into * 1.25;
      const hl = Math.hypot(snake.heading.x, snake.heading.z) || 1;
      snake.heading.x /= hl;
      snake.heading.z /= hl;
      if (snake.desired) {
        snake.desired.x = snake.heading.x;
        snake.desired.z = snake.heading.z;
      }
    }
    // Hard speed damp on impact so we don't re-tunnel next frame
    if (snake.speed > 5) snake.speed *= 0.35;
    snake.targetSpeed = Math.min(snake.targetSpeed || snake.speed, snake.speed);
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


/** Keep trail history consistent after head push-out. */
function _syncHistory(snake, head) {
  if (!snake.history || !snake.history.length) return;
  const n = Math.min(8, snake.history.length);
  for (let i = 0; i < n; i++) {
    const h = snake.history[i];
    if (!h) continue;
    const t = 1 - i / (n + 1);
    h.x = head.x * t + h.x * (1 - t);
    h.z = head.z * t + h.z * (1 - t);
  }
  if (snake.segments && snake.segments.length > 1) {
    for (let i = 1; i < Math.min(4, snake.segments.length); i++) {
      const s = snake.segments[i];
      const d = Math.hypot(s.x - head.x, s.z - head.z);
      if (d < 0.15) {
        s.x = head.x - snake.heading.x * 0.46 * i;
        s.z = head.z - snake.heading.z * 0.46 * i;
        if (s.mesh) s.mesh.position.set(s.x, 0.34, s.z);
      }
    }
  }
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

/** Build wireframe meshes for all active obstacles (debug visualization) */
export function createCollisionDebugGroup(scene, collision) {
  const group = new THREE.Group();
  group.name = 'collisionDebug';
  const matSolid = new THREE.MeshBasicMaterial({
    color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.55, depthWrite: false,
  });
  const matLethal = new THREE.MeshBasicMaterial({
    color: 0xff3040, wireframe: true, transparent: true, opacity: 0.7, depthWrite: false,
  });
  if (!collision?.obstacles) return group;
  for (const o of collision.obstacles) {
    if (!o || !o.alive) continue;
    let mesh;
    if (o.type === 'box') {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry((o.halfW || 1) * 2, 0.55, (o.halfD || 1) * 2),
        o.lethal ? matLethal : matSolid
      );
    } else {
      const r = o.radius || 1.2;
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, 0.5, 14),
        o.lethal ? matLethal : matSolid
      );
    }
    mesh.position.set(o.x, 0.28, o.z);
    group.add(mesh);
  }
  scene.add(group);
  return group;
}
