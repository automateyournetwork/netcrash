// Pure fixed-step simulation of the run: rigid-body flight, impulse contacts, energy, air boost.
// No clock, no randomness. Positions are in meters (x along the road, y above it, measured at the
// character's center of gravity), angles in radians (counter-clockwise positive), speeds in m/s.
// The character is a rectangle with orientation and spin. Bounces are impulses at the contact point
// (FR-037, FR-040): a flat landing puts nearly all of the impulse into motion, a tilted or corner
// landing puts much of it into spin. A Cat6 tail hangs from the rear as a Verlet rope (FR-041).
const EPS = 1e-9;
const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Devices are placed once, deterministically: gaps between them grow, so a player eventually misses.
export function buildDevices(config) {
  const d = config.devices; const list = [];
  let x = d.firstX;
  for (let i = 0; i < d.count; i++) {
    const kind = (i % 7) + 1; const k = d.kinds[kind - 1];
    list.push({ id: i, x, kind, top: k.top, half: k.halfM, e: k.e, tilt: k.tiltDeg, boxHalf: k.boxHalfM, boxBottom: k.boxBottomM });
    x += d.gapStartM + d.gapGrowM * i + (i % 3) * 15;
  }
  return list;
}

// Boost power-ups hang along the way (in the air and low over the road), placed deterministically.
export function buildPickups(config) {
  const k = config.pickups; const list = [];
  for (let i = 0; i < k.count; i++) list.push({ id: i, x: k.firstX + i * k.gapM + (i % 2) * 22, y: k.heights[i % k.heights.length], r: k.radius });
  return list;
}

// Triangle wave 0 -> 1 -> 0 over periodMs: the moving needle of a dial.
export function gaugeValue(ms, periodMs) {
  const p = (((ms % periodMs) + periodMs) % periodMs) / periodMs;
  return p < 0.5 ? p * 2 : 2 - 2 * p;
}
export const powerFromGauge = (g, config) => config.physics.powerMinMps + (config.physics.powerMaxMps - config.physics.powerMinMps) * g;
export const angleFromGauge = (g, config) => config.physics.angleMinDeg + (config.physics.angleMaxDeg - config.physics.angleMinDeg) * g;

// Timing quality of a Boost press, 1 at the dial center, 0 at either end (FR-005c).
export function boostQuality(sweepMs, config) {
  return clamp(1 - 2 * Math.abs(gaugeValue(sweepMs, config.boost.sweepMs) - 0.5), 0, 1);
}
export const inGoodWindow = (sweepMs, config) => boostQuality(sweepMs, config) >= config.boost.goodQuality - 1e-9;

const inertia = (p) => (p.bodyHalfW * p.bodyHalfW + p.bodyHalfH * p.bodyHalfH) * p.inertiaK; // unit mass
const halfHeight = (th, p) => p.bodyHalfW * Math.abs(Math.sin(th)) + p.bodyHalfH * Math.abs(Math.cos(th));
const wrap = (th) => { let t = th % (2 * Math.PI); if (t > Math.PI) t -= 2 * Math.PI; if (t < -Math.PI) t += 2 * Math.PI; return t; };

function tailAnchor(n, p) { return { x: n.x - p.bodyHalfW * Math.cos(n.th), y: n.y - p.bodyHalfW * Math.sin(n.th) }; }

function initialTail(n, config) {
  const a = tailAnchor(n, config.physics); const t = config.tail; const nodes = [];
  for (let i = 0; i < t.nodes; i++) {
    const x = a.x - t.segM * 0.8 * (i + 1); const y = Math.max(0.5, a.y - t.segM * 0.5 * (i + 1));
    nodes.push({ x, y, px: x, py: y });
  }
  return nodes;
}

export function createSim(config) {
  const p = config.physics;
  const s = {
    x: 0, y: p.bodyHalfH, vx: 0, vy: 0, th: 0, w: 0, distanceM: 0, speedMps: 0, grounded: true,
    energy: config.initialEnergy, boostCooldownMs: 0, sweepMs: 0, boostQuality: null,
    answersCorrect: 0, goodBoosts: 0, bounces: 0, roadBounces: 0, misses: 0, lastDevice: -1,
    lastBounce: null, bounceSeq: 0, boostSeq: 0, sideHits: 0, stuckMs: 0,
    vaultId: -1, vaultCoolMs: 0, plaid: false, plaidSeq: 0,
    boosts: config.boost.startCount, pickups: buildPickups(config), taken: [], pickupSeq: 0, lastPickup: null,
    phase: 'cruise', status: 'standing', boostEvent: null, bounceEvent: null,
    devices: buildDevices(config)
  };
  s.tail = initialTail(s, config);
  return s;
}

function velocity(n) { n.speedMps = Math.hypot(n.vx, n.vy); }

// Catalyst 6500 impact: the chosen power (m/s) and angle (degrees) become the launch velocity, and
// the hit sets the character tumbling forward.
export function launch(s, powerMps, angleDeg, spinRadS = 0, liftM = 0) {
  const n = {
    ...s, vx: powerMps * Math.cos(angleDeg * DEG), vy: powerMps * Math.sin(angleDeg * DEG), w: -spinRadS,
    grounded: false, status: 'running', boostEvent: null, bounceEvent: null
  };
  n.y = Math.max(s.y, 0) + 0.05 + liftM; // the ram lifts the body off the road so a flat launch does not scrape it
  velocity(n);
  return n;
}

// Lowest point of the body relative to its center of gravity. A nearly flat body lands on the
// middle of its bottom edge; a tilted one on its lowest corner (blend over `flatBlendM`).
function contactPoint(n, p) {
  const a = p.bodyHalfW; const b = p.bodyHalfH; const c = Math.cos(n.th); const s = Math.sin(n.th);
  const pts = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) pts.push({ rx: sx * a * c - sy * b * s, ry: sx * a * s + sy * b * c });
  pts.sort((u, v) => u.ry - v.ry);
  const [p1, p2] = pts;
  const w = clamp(Math.abs(p2.ry - p1.ry) / p.flatBlendM, 0, 1);
  const mx = (p1.rx + p2.rx) / 2; const my = (p1.ry + p2.ry) / 2;
  return { rx: lerp(mx, p1.rx, w), ry: lerp(my, p1.ry, w), lowRy: p1.ry, lowRx: p1.rx };
}

// Impulse at contact point r against a surface with unit normal (nx, ny): restitution e, friction mu.
// Returns efficiency eta in 0..1 (share of the impulse that goes into translation), or null if the
// contact point is not approaching the surface.
function resolve(n, r, nx, ny, e, mu, p) {
  const I = inertia(p);
  const vpx = n.vx - n.w * r.ry; const vpy = n.vy + n.w * r.rx;
  const vn = vpx * nx + vpy * ny;
  if (vn >= 0) return null;
  const rxn = r.rx * ny - r.ry * nx;
  const k = 1 + (rxn * rxn) / I;
  const j = (-(1 + e) * vn) / k;
  n.vx += j * nx; n.vy += j * ny; n.w += (rxn * j) / I;
  const tx = ny; const ty = -nx;
  const vtx = n.vx - n.w * r.ry; const vty = n.vy + n.w * r.rx;
  const vt = vtx * tx + vty * ty;
  const rxt = r.rx * ty - r.ry * tx;
  const jt = clamp(-vt / (1 + (rxt * rxt) / I), -mu * j, mu * j);
  n.vx += jt * tx; n.vy += jt * ty; n.w += (rxt * jt) / I;
  return 1 / k;
}


// Solid parts of a device: its main box, plus a thin pole below it for devices that stand on a pole.
function deviceBoxes(d, dv) {
  const boxes = [{ L: d.x - d.boxHalf, R: d.x + d.boxHalf, B: d.boxBottom, T: d.top, main: true }];
  if (d.boxBottom > 0) boxes.push({ L: d.x - dv.poleHalfM, R: d.x + dv.poleHalfM, B: 0, T: d.boxBottom, main: false });
  return boxes;
}
function corners(n, p) {
  const a = p.bodyHalfW; const b = p.bodyHalfH; const c = Math.cos(n.th); const s = Math.sin(n.th); const out = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push({ rx: sx * a * c - sy * b * s, ry: sx * a * s + sy * b * c });
  return out;
}

// A landing on top of a device throws the character forward HARD (FR-040): the contact result (restitution, spin,
// friction) is only the starting point. Quality scales the bonus, but even a poor landing leaves at a speed of at
// least `padMinExitMps` x (0.6 + 0.4 x quality) along (mostly) the ideal angle, so nobody ever rides on top.
// Returns true when the bounce happened.
function padBounce(n, dev, cp, p, dv, lift) {
  const phi = dev.tilt * DEG; const nx = Math.sin(phi); const ny = Math.cos(phi);
  const vx0 = Math.max(0, n.vx); const eta = resolve(n, cp, nx, ny, dev.e, p.devMu, p);
  if (eta === null) return false;
  const kick = dv.padKickMps * eta; n.vx += kick * nx; n.vy += kick * ny; n.vx *= 1 + dv.padSpeedGain * eta;
  n.y += lift;
  // Better contact, better angle: blend toward the ideal pad angle (never less than padAimFloor, so even a poor landing goes forward).
  const blend = Math.min(1, Math.max(dv.padAimFloor, eta * dv.padAimBlend));
  let sp = Math.hypot(n.vx, n.vy); const ang = n.vx > 0 ? Math.atan2(n.vy, n.vx) : Math.PI / 2; const a2 = ang + (dv.padAngleDeg * DEG - ang) * blend;
  sp = Math.max(sp, dv.padMinExitMps * (0.6 + 0.4 * eta)); // the haul-ass floor
  sp = Math.min(sp, p.maxSpeedMps);
  n.vx = sp * Math.cos(a2); n.vy = sp * Math.sin(a2);
  n.vx = Math.max(n.vx, vx0 + dv.padAddVx * eta); // momentum is additive: never less than before, plus a forward gain
  n.energy += dv.energy * (dv.energyMinFrac + (1 - dv.energyMinFrac) * eta);
  n.grounded = false; n.bounces += 1; n.lastDevice = dev.id; n.bounceEvent = 'device';
  n.bounceSeq += 1; n.lastBounce = { q: eta, kind: dev.kind, seq: n.bounceSeq };
  return true;
}

// Devices are solid but never send the character backwards (FR-044): a corner inside a box is pushed out of
// it (position only, velocity is not reflected), forward speed is kept and a vault boost is ADDED the first
// time a device is hit, with enough upward speed to clear its top, so the character rides up and over it.
function collideSolid(n, p, dv) {
  for (const d of n.devices) {
    if (Math.abs(d.x - n.x) > d.boxHalf + p.bodyHalfW + p.bodyHalfH + 4) continue;
    for (const box of deviceBoxes(d, dv)) {
      for (const c of corners(n, p)) {
        const cx = n.x + c.rx; const cy = n.y + c.ry;
        if (!(cx > box.L && cx < box.R && cy > box.B && cy < box.T)) continue;
        const faces = [[cx - box.L, -1], [box.R - cx, 1], [box.T - cy, 0]];
        // No underside face: a plate on a pole can be passed under, and a body taller than the gap must never wedge.
        const [depth, face] = faces.sort((u, v) => u[0] - v[0])[0];
        if (face === 0) { // landed on a top (corner already inside): a proper hard bounce when falling, a lift otherwise
          if (n.vy < 0 && d.top === box.T && padBounce(n, d, c, p, dv, depth)) return true;
          n.y += depth; n.vy = Math.max(n.vy, 0); n.vx = Math.max(n.vx, dv.vaultMinMps); return true;
        }
        n.x += face * depth; // out of the wall; the speed is not reflected
        n.vx = Math.max(n.vx, dv.vaultMinMps); // always forward
        const lowY = n.y + contactPoint(n, p).lowRy;
        const need = Math.max(0, box.T - lowY + dv.vaultClearM);
        const climb = Math.min(dv.vaultMaxVy, Math.sqrt(2 * p.gravity * need) * dv.vaultClimbMul);
        n.vy = Math.max(n.vy, climb);
        if (n.vaultId !== d.id || n.vaultCoolMs <= 0) { // first contact with this device: add forward momentum
          n.vx += dv.vaultBoostMps; n.vaultId = d.id; n.vaultCoolMs = dv.vaultCoolMs;
          n.sideHits = (n.sideHits || 0) + 1; n.bounceEvent = 'side'; n.bounceSeq += 1;
          n.lastBounce = { q: 0.6, kind: d.kind, seq: n.bounceSeq, side: true };
        }
        { const sp = Math.hypot(n.vx, n.vy); if (sp > p.maxSpeedMps) { n.vx *= p.maxSpeedMps / sp; n.vy *= p.maxSpeedMps / sp; } }
        return true;
      }
    }
  }
  return false;
}

// A pickup is collected when the body's center comes within its radius plus the body's half height.
function collectPickups(n, config) {
  const p = config.physics; const reach = config.pickups.radius + p.bodyHalfH;
  for (const k of n.pickups) {
    if (Math.abs(k.x - n.x) > reach + 2 || n.taken.includes(k.id)) continue;
    if (Math.hypot(k.x - n.x, k.y - n.y) < reach) {
      n.taken = [...n.taken, k.id]; n.boosts = Math.min(config.boost.maxCount, n.boosts + 1);
      n.pickupSeq += 1; n.lastPickup = { id: k.id, x: k.x, y: k.y, seq: n.pickupSeq };
    }
  }
}

function stepTail(n, config, h) {
  const t = config.tail; const g = config.physics.gravity; const a = tailAnchor(n, config.physics);
  const nodes = n.tail;
  for (const q of nodes) {
    const vx = (q.x - q.px) * t.damp; const vy = (q.y - q.py) * t.damp;
    q.px = q.x; q.py = q.y; q.x += vx; q.y += vy - g * h * h;
  }
  for (let it = 0; it < t.iterations; it++) {
    let prev = a;
    for (const q of nodes) {
      const dx = q.x - prev.x; const dy = q.y - prev.y; const d = Math.hypot(dx, dy) || 1e-6;
      const f = t.segM / d; q.x = prev.x + dx * f; q.y = prev.y + dy * f;
      if (q.y < 0.5) q.y = 0.5;
      prev = q;
    }
  }
}

// step(simState, {boostPressed, assist}, config, dtMs) -> new simState (no mutation)
export function step(s, input, config, dtMs = 50) {
  if (s.status !== 'running') return s;
  const n = { ...s, boostEvent: null, bounceEvent: null };
  const dt = dtMs / 1000;
  n.boostCooldownMs = Math.max(0, s.boostCooldownMs - dtMs);
  n.vaultCoolMs = Math.max(0, (s.vaultCoolMs || 0) - dtMs);
  n.sweepMs = (s.sweepMs + dtMs) % config.boost.sweepMs;
  const wanted = Boolean(input && input.boostPressed) && s.boostCooldownMs <= 0;
  const q = wanted ? (input.assist ? 1 : boostQuality(s.sweepMs, config)) : 0;
  const good = wanted && q >= config.boost.goodQuality - 1e-9;

  if (n.phase === 'glide') {
    let d = n.speedMps * dt + (wanted ? 15 + 45 * q : 0);
    let cost = d * config.glide.drainPerMeter;
    if (cost > n.energy) { d = n.energy / config.glide.drainPerMeter; cost = n.energy; }
    if (wanted) { n.boostCooldownMs = config.boost.cooldownMs; n.boostEvent = good ? 'good' : 'mistimed'; n.boostQuality = q; if (good) n.goodBoosts = s.goodBoosts + 1; }
    n.energy = Math.max(0, n.energy - cost);
    n.x += d; n.distanceM = n.x;
    if (n.energy <= EPS) { n.energy = 0; n.status = 'stopped'; }
    return n;
  }

  // Air boost: one impulse forward and up whose size grows with timing quality. Only while airborne and
  // with energy left (no energy, no boost).
  if (wanted && !n.grounded && n.energy > EPS && n.boosts > 0) {
    const b = config.airBoost; n.boosts = s.boosts - 1;
    if (good) {
      // A press in the green range assumes the perfect angle: relaunch along the optimal angle, faster, steadier.
      const sp = Math.min(config.physics.maxSpeedMps, Math.max(Math.hypot(n.vx, n.vy), b.perfectMinMps) + b.perfectGainMps * q);
      n.vx = sp * Math.cos(b.optimalAngleDeg * DEG); n.vy = sp * Math.sin(b.optimalAngleDeg * DEG); n.w *= b.perfectSpinKeep;
    } else { n.vx += lerp(b.minVx, b.maxVx, q); n.vy += lerp(b.minVy, b.maxVy, q); }
    n.boostCooldownMs = config.boost.cooldownMs; n.boostQuality = q; n.boostSeq = (s.boostSeq || 0) + 1;
    n.boostEvent = good ? 'good' : 'mistimed';
    if (good) n.goodBoosts = s.goodBoosts + 1;
  }

  const p = config.physics; const dv = config.devices;
  n.tail = s.tail.map((t) => ({ ...t }));
  const h = dt / p.subSteps;
  for (let i = 0; i < p.subSteps; i++) {
    const px = n.x;
    if (n.grounded) {
      n.th *= Math.exp(-p.rightRate * h); n.w = 0; n.y = halfHeight(n.th, p);
      const dec = p.slideDecel * h; n.vx = n.vx > 0 ? Math.max(0, n.vx - dec) : Math.min(0, n.vx + dec); n.vy = 0; n.x += n.vx * h;
      if (collideSolid(n, p, dv)) { n.grounded = false; n.y = Math.max(n.y, halfHeight(n.th, p) + 0.05); }
    } else {
      const before = contactPoint(n, p); const lowPrev = n.y + before.lowRy;
      n.vy -= p.gravity * h; n.w *= 1 - p.spinDrag * h;
      if (n.energy <= EPS) n.vx *= Math.max(0, 1 - p.dryDragPerS * h); // out of energy: no floating on, it comes down
      n.th = wrap(n.th + n.w * h); n.x += n.vx * h; n.y += n.vy * h;
      const cp = contactPoint(n, p); const low = n.y + cp.lowRy; const lowX = n.x + cp.lowRx;
      let hit = false;
      if (n.vy < 0) {
        const dev = n.devices.find((d) => Math.abs(lowX - d.x) <= d.half && lowPrev >= d.top && low < d.top);
        if (dev) { hit = padBounce(n, dev, cp, p, dv, dev.top - low); }
      }
      if (!hit) collideSolid(n, p, dv);
      if (!hit && n.y + contactPoint(n, p).lowRy <= 0) {
        const cp2 = contactPoint(n, p); const low2 = n.y + cp2.lowRy;
        const eta = resolve(n, cp2, 0, 1, p.roadRestitution, p.roadMu, p);
        n.y += -low2;
        if (eta !== null) {
          n.w *= p.rollDamp; n.vx = Math.max(0, n.vx * p.roadFriction); // the road never throws you backwards either
          if (Math.abs(n.vy) < p.minBounceMps) { n.vy = 0; n.w = 0; n.grounded = true; n.y = halfHeight(n.th, p); }
          else { n.roadBounces += 1; if (!n.bounceEvent) n.bounceEvent = 'road'; }
        } else if (n.vy <= 0) { n.vy = 0; n.grounded = true; n.y = halfHeight(n.th, p); }
      }
    }
    collectPickups(n, config);
    stepTail(n, config, h);
    const dx = Math.abs(n.x - px);
    n.energy = Math.max(0, n.energy - dx * config.drainPerMeter);
  }
  n.distanceM = n.x; velocity(n);
  // Wedged against a device (barely moving, off the ground) for a second: shake loose to the nearest clear
  // spot on the road, upright, so a run can never freeze.
  n.stuckMs = !n.grounded && Math.hypot(n.vx, n.vy) < 4 ? (s.stuckMs || 0) + dtMs : 0;
  if (n.stuckMs >= 1000) { // shake loose, forward first
    const clear = (x) => n.devices.every((d) => Math.abs(x - d.x) > Math.max(d.boxHalf, dv.poleHalfM) + p.bodyHalfW + 2);
    let nx = n.x; for (let k = 1; k < 80 && !clear(nx); k++) { const l = n.x - 5 * k; const r = n.x + 5 * k; nx = clear(r) ? r : clear(l) ? l : nx; }
    n.x = nx; n.th = 0; n.w = 0; n.vx = 0; n.vy = 0; n.grounded = true; n.y = p.bodyHalfH; n.stuckMs = 0; n.distanceM = n.x;
  }
  // Plaid (FR-054): the displayed speed passed the threshold; leave only when it falls below the exit speed.
  const gb = speedGbps(n.speedMps, config);
  const on = s.plaid ? gb >= config.plaid.exitGbps : gb >= config.plaid.thresholdGbps;
  n.plaid = on; if (on && !s.plaid) n.plaidSeq = (s.plaidSeq || 0) + 1;
  // Stopped on the road once it has also righted itself: that is a miss.
  if (n.grounded && Math.abs(n.vx) <= p.stopMps) { n.vx = 0; if (Math.abs(n.th) < 0.06) { n.status = 'missed'; n.misses = s.misses + 1; } velocity(n); }
  return n;
}

// Called when a question opens: gameplay pauses.
export function ackQuestion(s) { return { ...s, status: 'paused', boostEvent: null, bounceEvent: null }; }

export function onCorrectAnswer(s, config) {
  return { ...s, energy: s.energy + config.powerUpEnergy, answersCorrect: s.answersCorrect + 1 };
}

// After a correct answer: launch again from where the character stands (FR-038).
export function resume(s, config) {
  const r = config.relaunch;
  return launch({ ...s, status: 'paused', vx: 0, vy: 0, w: 0 }, r.mps + r.stepMps * s.answersCorrect, r.angleDeg, r.spinRadS);
}

export function startGlide(s, config) {
  return {
    ...s, phase: 'glide', speedMps: config.glide.speedMps, energy: s.energy + config.superBoostEnergy,
    boostCooldownMs: 0, status: 'running', boostEvent: null, bounceEvent: null, grounded: false, th: 0, w: 0, y: 0
  };
}

export const speedGbps = (speedMps, config) => (speedMps * config.displayBitsPerMps) / 1e9;

// 1 m/s is shown as displayBitsPerMps bits per second (an intentional joke unit mismatch).
export function formatSpeed(speedMps, config) {
  const bps = speedMps * config.displayBitsPerMps;
  let unit = 'Mbps'; let div = 1e6;
  if (bps >= 1e12) { unit = 'Tbps'; div = 1e12; } else if (bps >= 1e9) { unit = 'Gbps'; div = 1e9; }
  const v = bps / div;
  const text = v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
  return `${text} ${unit}`;
}
