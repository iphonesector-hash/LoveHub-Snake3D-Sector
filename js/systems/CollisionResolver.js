/** Resolve solid obstacle collisions — push player out, damp speed */
export function resolveSolidCollision(snake, headPos, collision, dt, state) {
  if (!snake?.alive || snake.hasGhost?.()) return { killed: false };
  const head = snake.segments[0];
  const hx = headPos.x, hz = headPos.z;
  let obsHit = collision.testHead(hx, hz, 0.42);
  if (!obsHit.hit && snake.speed > 12) {
    const mx = hx - snake.heading.x * snake.speed * dt * 0.5;
    const mz = hz - snake.heading.z * snake.speed * dt * 0.5;
    obsHit = collision.testHead(mx, mz, 0.42);
  }
  if (!obsHit.hit) return { killed: false };
  const o = obsHit.obstacle;
  if (obsHit.lethal) {
    if (snake.hasShield()) { snake.effects.shield = 0; return { killed: false, shake: 0.2 }; }
    return { killed: true };
  }
  if (obsHit.solid && o) {
    let pushR = o.radius || Math.max(o.halfW || 0, o.halfD || 0) || 1.2;
    if (o.type === 'box') pushR = Math.max(o.halfW || 1, o.halfD || 1) + 0.15;
    const dx = head.x - o.x, dz = head.z - o.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    const need = pushR + 0.48;
    if (dist < need) {
      const push = need - dist;
      head.x += (dx / dist) * push;
      head.z += (dz / dist) * push;
      head.mesh.position.set(head.x, 0.34, head.z);
      headPos.set(head.x, 0.34, head.z);
      snake.speed *= 0.72;
      return { killed: false, shake: 0.15, nearMiss: true };
    }
  }
  return { killed: false };
}
