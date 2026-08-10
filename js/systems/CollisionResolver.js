/** Resolve obstacle collisions — solid & lethal both kill (burn), unless shield/ghost */
export function resolveSolidCollision(snake, headPos, collision, dt) {
  if (!snake?.alive || snake.hasGhost?.()) return { killed: false };
  const head = snake.segments[0];
  const hx = headPos.x, hz = headPos.z;
  let obsHit = collision.testHead(hx, hz, 0.42);
  // Anti-tunnel sample while boosting
  if (!obsHit.hit && snake.speed > 11) {
    const mx = hx - snake.heading.x * snake.speed * dt * 0.5;
    const mz = hz - snake.heading.z * snake.speed * dt * 0.5;
    obsHit = collision.testHead(mx, mz, 0.42);
  }
  if (!obsHit.hit) return { killed: false };

  const o = obsHit.obstacle;
  // Shield absorbs one hit
  if (snake.hasShield()) {
    snake.effects.shield = 0;
    // still push out so we don't re-hit next frame
    if (o && (obsHit.solid || obsHit.lethal)) {
      let pushR = o.radius || Math.max(o.halfW || 0, o.halfD || 0) || 1.2;
      if (o.type === 'box') pushR = Math.max(o.halfW || 1, o.halfD || 1) + 0.2;
      const dx = head.x - o.x, dz = head.z - o.z;
      const dist = Math.hypot(dx, dz) || 0.001;
      const need = pushR + 0.55;
      if (dist < need) {
        const push = need - dist + 0.3;
        head.x += (dx / dist) * push;
        head.z += (dz / dist) * push;
        head.mesh.position.set(head.x, 0.34, head.z);
        headPos.set(head.x, 0.34, head.z);
      }
    }
    return { killed: false, shake: 0.35, absorbed: true, kind: o?.kind || 'obstacle' };
  }

  // Solid buildings/rocks/crystals AND lethal hazards both kill
  if (obsHit.lethal || obsHit.solid) {
    return {
      killed: true,
      burn: true,
      kind: o?.kind || (obsHit.lethal ? 'hazard' : 'obstacle'),
      shake: 0.8,
    };
  }
  return { killed: false };
}
