import { test, assert, loadDoc, clone } from './harness.js';
import { createSim, step, launch, speedGbps, ackQuestion, onCorrectAnswer, resume, startGlide, formatSpeed, inGoodWindow, boostQuality, gaugeValue, powerFromGauge, angleFromGauge, buildDevices } from '../engine/sim.js';
import { createGame } from '../engine/state.js';

const doc = await loadDoc();
const cfg = doc.config;
const B = cfg.physics.bodyHalfH;
const near = (a, b, msg, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${msg || 'near'}: ${a} vs ${b}`);
const run = (s, n, input = {}, c = cfg) => { for (let i = 0; i < n; i++) s = step(s, input, c, 50); return s; };
const noDevices = { ...cfg, devices: { ...cfg.devices, firstX: 1e9 } }; // free flight, nothing to hit
const dev0 = createSim(cfg).devices[0];
// A character placed just above device 0, falling, at orientation th, so the contact point is over the device.
function falling(th, vx = 20, vy = -20, w = 0) {
  const p = cfg.physics; const H = p.bodyHalfW * Math.abs(Math.sin(th)) + p.bodyHalfH * Math.abs(Math.cos(th));
  const lowRx = Math.abs(th) < 0.01 ? 0 : (th > 0 ? -p.bodyHalfW * Math.cos(th) + p.bodyHalfH * Math.sin(th) : p.bodyHalfW * Math.cos(th) + p.bodyHalfH * Math.sin(-th) * 0 - p.bodyHalfH * Math.sin(-th));
  return { ...launch(createSim(cfg), 30, 45), x: dev0.x - lowRx, y: dev0.top + H + 3, th, w, vx, vy };
}
function bounceOf(s) { for (let i = 0; i < 12 && !s.bounceEvent; i++) s = step(s, {}, cfg, 50); return s; }

test('gauge is a triangle wave: 0 at the start, 1 at half period, 0 again at the end', () => {
  near(gaugeValue(0, 1500), 0); near(gaugeValue(750, 1500), 1); near(gaugeValue(1500, 1500), 0); near(gaugeValue(375, 1500), 0.5);
});
test('gauge values map to power (m/s) and angle (degrees) ranges', () => {
  near(powerFromGauge(0, cfg), cfg.physics.powerMinMps); near(powerFromGauge(1, cfg), cfg.physics.powerMaxMps); near(angleFromGauge(0, cfg), cfg.physics.angleMinDeg); near(angleFromGauge(1, cfg), cfg.physics.angleMaxDeg); near(angleFromGauge(0.5, cfg), 35);
});
test('boost quality is 1 at the dial center, 0 at the ends, and rises toward the center', () => {
  near(boostQuality(500, cfg), 1); near(boostQuality(0, cfg), 0); near(boostQuality(1000, cfg), 0); near(boostQuality(1500, cfg), 1);
  assert.ok(boostQuality(400, cfg) > boostQuality(300, cfg) && boostQuality(300, cfg) > boostQuality(100, cfg));
  assert.ok(inGoodWindow(500, cfg) && !inGoodWindow(100, cfg));
});
test('a fresh sim stands on the road with deterministic, increasing devices that differ by kind', () => {
  const s = createSim(cfg);
  assert.equal(s.status, 'standing'); assert.equal(s.x, 0); near(s.y, B); assert.equal(s.th, 0);
  assert.equal(s.devices.length, 60); assert.deepEqual(buildDevices(cfg), s.devices);
  for (let i = 1; i < s.devices.length; i++) assert.ok(s.devices[i].x - s.devices[i - 1].x >= cfg.devices.gapStartM);
  assert.ok(new Set(s.devices.slice(0, 7).map((d) => d.e)).size > 3, 'devices differ in springiness');
  assert.equal(s.tail.length, cfg.tail.nodes);
  assert.equal(step(s, { boostPressed: true }, cfg, 50), s);
});
test('launch gives the velocity vector and a forward tumble', () => {
  const s = launch(createSim(cfg), 50, 30, 2);
  near(s.vx, 50 * Math.cos(Math.PI / 6)); near(s.vy, 25); near(s.speedMps, 50); near(s.w, -2); assert.equal(s.status, 'running'); assert.equal(s.grounded, false);
});
test('gravity: vy falls by g per second and the apex matches y0 + vy^2 / 2g', () => {
  let s = launch(createSim(cfg), 60, 60); const vy0 = s.vy; const y0 = s.y;
  s = run(s, 20, {}, noDevices); near(s.vy, vy0 - cfg.physics.gravity, 'vy after 1 s', 1e-6);
  let top = 0; s = launch(createSim(cfg), 60, 60);
  for (let i = 0; i < 100 && s.status === 'running'; i++) { s = step(s, {}, noDevices, 50); top = Math.max(top, s.y); }
  near(top, y0 + (vy0 * vy0) / (2 * cfg.physics.gravity), 'apex', 1);
});
test('a steeper angle goes higher, more power goes farther', () => {
  const peak = (pw, a) => { let s = launch(createSim(noDevices), pw, a); let t = 0; for (let i = 0; i < 300 && !s.grounded && s.roadBounces === 0; i++) { s = step(s, {}, noDevices, 50); t = Math.max(t, s.y); } return t; };
  assert.ok(peak(50, 70) > peak(50, 30));
  const range = (pw) => { let s = launch(createSim(noDevices), pw, 45); for (let i = 0; i < 400 && s.roadBounces === 0 && !s.grounded; i++) s = step(s, {}, noDevices, 50); return s.x; };
  assert.ok(range(60) > range(40));
});
test('spin carries on in the air and the orientation follows it', () => {
  let s = { ...launch(createSim(cfg), 40, 45, 2), y: 200 }; const th0 = s.th;
  s = run(s, 10, {}, noDevices);
  assert.ok(s.w < -1.9 && s.w > -2.0, 'spin decays only slightly'); assert.ok(Math.abs(s.th - th0) > 0.5, 'orientation changed');
});
test('energy drains per meter travelled and never goes below zero', () => {
  let s = launch(createSim(cfg), 50, 45); const e0 = s.energy;
  s = step(s, {}, noDevices, 50); near(e0 - s.energy, s.x * cfg.drainPerMeter, 'drain', 1e-6);
  s = { ...launch(createSim(noDevices), 50, 45), energy: 0.01 }; s = run(s, 5, {}, noDevices); assert.equal(s.energy, 0);
});
test('a flat landing on a device is a high-quality bounce; a tilted landing is a lower-quality one that adds spin', () => {
  const flat = bounceOf(falling(0)); const tilt = bounceOf(falling(-0.35));
  assert.equal(flat.bounceEvent, 'device'); assert.equal(tilt.bounceEvent, 'device');
  assert.ok(flat.lastBounce.q > 0.85, `flat q ${flat.lastBounce.q}`); assert.ok(tilt.lastBounce.q < flat.lastBounce.q - 0.2, `tilt q ${tilt.lastBounce.q}`);
  assert.ok(flat.vy > tilt.vy, 'a better bounce goes up faster'); assert.ok(Math.abs(tilt.w) > Math.abs(flat.w) + 0.05, 'a poorer bounce spins more');
  const e0 = falling(0).energy;
  assert.ok(flat.energy - e0 > tilt.energy - e0 + 5, 'a better bounce adds more energy');
  assert.equal(flat.bounces, 1); assert.equal(flat.lastDevice, dev0.id); assert.equal(flat.bounceSeq, 1);
});
test('the bounce is calculated from the impact: a faster fall gives a harder bounce, a spinning fall changes the result', () => {
  const slow = bounceOf(falling(0, 20, -10)); const fast = bounceOf(falling(0, 20, -30));
  assert.ok(fast.vy > slow.vy);
  const spun = bounceOf(falling(0, 20, -20, 3)); const still = bounceOf(falling(0, 20, -20, 0));
  assert.ok(Math.abs(spun.vy - still.vy) > 0.01 || Math.abs(spun.w - still.w) > 0.01, 'spin changes the outcome');
});
test('device kinds bounce differently from the same fall', () => {
  const a = bounceOf({ ...falling(0), x: createSim(cfg).devices[1].x, y: createSim(cfg).devices[1].top + B + 3 });
  const b = bounceOf({ ...falling(0), x: createSim(cfg).devices[2].x, y: createSim(cfg).devices[2].top + B + 3 });
  assert.ok(Math.abs(a.vy - b.vy) > 1 || Math.abs(a.vx - b.vx) > 1);
});
test('passing beside a device or rising through it does not bounce', () => {
  let s = { ...falling(0), x: 313 }; s = run(s, 4); assert.equal(s.bounces, 0);
  s = { ...falling(0), vy: 20, y: dev0.top - 5 }; s = run(s, 2); assert.equal(s.bounces, 0);
});
test('the road bounces less, slows and spins the character; a slow landing sticks, rights itself and slides to a miss', () => {
  let s = { ...launch(createSim(cfg), 30, 45), x: 5, y: B + 1, th: 0, w: 0, vx: 30, vy: -30 };
  s = run(s, 2, {}, noDevices);
  assert.equal(s.roadBounces, 1); assert.ok(s.vy > 0 && s.vy < 30 * 0.45 + 6); assert.ok(s.vx < 30 * 0.8);
  s = { ...launch(createSim(cfg), 30, 45), x: 5, y: B + 0.1, th: 0.3, w: 0, vx: 6, vy: -1.5 };
  s = run(s, 60, {}, noDevices);
  assert.equal(s.status, 'missed'); assert.equal(s.misses, 1); assert.equal(s.vx, 0); assert.ok(Math.abs(s.th) < 0.07, 'righted'); near(s.y, B, 'upright', 1.5);
  assert.equal(step(s, {}, cfg, 50), s);
});
test('the Cat6 tail is a rope: fixed segment length, never through the road, swings when the body spins', () => {
  let s = launch(createSim(cfg), 50, 50, 2.4);
  let minY = 99; let moved = 0; let prevX = s.tail[3].x;
  for (let i = 0; i < 60; i++) { s = step(s, {}, noDevices, 50); for (const q of s.tail) minY = Math.min(minY, q.y); moved += Math.abs(s.tail[3].x - prevX); prevX = s.tail[3].x; }
  assert.ok(minY >= 0.49, `tail above road ${minY}`); assert.ok(moved > 50, 'the free end moves');
  const a = { x: s.x - cfg.physics.bodyHalfW * Math.cos(s.th), y: s.y - cfg.physics.bodyHalfW * Math.sin(s.th) };
  near(Math.hypot(s.tail[0].x - a.x, s.tail[0].y - a.y), cfg.tail.segM, 'first segment', 0.6);
  for (let i = 1; i < s.tail.length; i++) near(Math.hypot(s.tail[i].x - s.tail[i - 1].x, s.tail[i].y - s.tail[i - 1].y), cfg.tail.segM, `segment ${i}`, 0.6);
  const slow = run(launch(createSim(noDevices), 50, 50, 0), 12, {}, noDevices); const fast = run(launch(createSim(noDevices), 50, 50, 4), 12, {}, noDevices);
  assert.ok(Math.abs(slow.tail[3].y - fast.tail[3].y) > 1 || Math.abs(slow.tail[3].x - fast.tail[3].x) > 1, 'spin changes how the tail swings');
});
test('air boost grows with timing quality; assist is the maximum; ignored on the ground; cooldown applies', () => {
  const air = launch(createSim(cfg), 40, 45);
  const at = (sweep, input = { boostPressed: true }) => step({ ...air, sweepMs: sweep }, input, noDevices, 50);
  const perfect = at(500); const ok = at(350); const poor = at(100); const assist = at(100, { boostPressed: true, assist: true });
  const gain = (s) => s.vx - air.vx;
  assert.ok(gain(perfect) > gain(ok) && gain(ok) > gain(poor), 'better timing, better boost');
  assert.equal(perfect.boostEvent, 'good'); assert.equal(poor.boostEvent, 'mistimed'); near(perfect.boostQuality, 1, 'q', 0.05);
  near(gain(assist), gain(perfect), 'assist = perfect', 0.1);
  assert.equal(step(perfect, { boostPressed: true, assist: true }, noDevices, 50).boostEvent, null);
  assert.equal(step({ ...air, grounded: true, vy: 0, y: B, vx: 20 }, { boostPressed: true, assist: true }, noDevices, 50).boostEvent, null);
});
test('a correct answer adds power-up energy; resume relaunches from the spot with a small tumble', () => {
  let s = { ...launch(createSim(cfg), 30, 45), x: 300, y: B, vx: 0, vy: 0, grounded: true, status: 'missed' };
  const e0 = s.energy;
  s = ackQuestion(s); assert.equal(s.status, 'paused'); assert.equal(step(s, {}, cfg, 50), s);
  s = onCorrectAnswer(s, cfg); near(s.energy - e0, cfg.powerUpEnergy); assert.equal(s.answersCorrect, 1);
  s = resume(s, cfg);
  assert.equal(s.status, 'running'); near(s.x, 300); near(s.speedMps, cfg.relaunch.mps + cfg.relaunch.stepMps, 'relaunch speed', 1e-6); near(s.w, -cfg.relaunch.spinRadS, 'spin');
  near(Math.atan2(s.vy, s.vx) * 180 / Math.PI, cfg.relaunch.angleDeg, 'angle', 1e-6);
});
test('glide uses glide speed and glide drain, plus the super boost', () => {
  const s = startGlide(createSim(cfg), cfg);
  near(s.energy, 140 + 300);
  const t = step(s, {}, cfg, 50);
  near(t.x, 100000 * 0.05); near(s.energy - t.energy, 5000 * 0.0005); assert.equal(t.status, 'running');
});
test('formatSpeed shows Mbps, Gbps, Tbps and 150 m/s is exactly 400 Gbps', () => {
  assert.equal(formatSpeed(150, cfg), '400 Gbps'); assert.equal(formatSpeed(0.03, cfg), '80 Mbps');
  assert.equal(formatSpeed(300, cfg), '800 Gbps'); assert.equal(formatSpeed(1000, cfg), '2.7 Tbps'); assert.equal(formatSpeed(20, cfg), '53.3 Gbps');
  near(speedGbps(150, cfg), 400, 'Gbps', 1e-6);
});
test('simulation is deterministic, tail included', () => {
  assert.deepEqual(run(launch(createSim(cfg), 55, 45, 2), 300), run(launch(createSim(cfg), 55, 45, 2), 300));
});

test('devices are solid but never send you backwards: a side hit vaults you up and over with MORE forward speed (FR-044)', () => {
  const d = dev0; const dv = cfg.devices;
  let s = { ...launch(createSim(cfg), 30, 45), x: d.x - 70, y: 22, th: 0, w: 0, vx: 40, vy: 0 };
  let minVx = 1e9; let sideSeen = false; let topY = 0; const e0 = s.energy;
  for (let i = 0; i < 80; i++) { s = step(s, {}, cfg, 50); minVx = Math.min(minVx, s.vx); topY = Math.max(topY, s.y); if (s.bounceEvent === 'side') sideSeen = true; }
  assert.ok(sideSeen, 'a side impact was detected'); assert.ok(minVx >= 39.9, `never slower than before: ${minVx}`);
  assert.ok(s.x > d.x + d.boxHalf, `carried on past the device: ${s.x}`); assert.ok(topY > d.top, 'went over the top');
  assert.equal(s.bounces, 0, 'a vault is not a rewarding top bounce'); assert.ok(s.sideHits >= 1 && s.lastBounce.side);
});
test('a vault ADDS forward momentum once per device (not every substep)', () => {
  const d = dev0; const dv = cfg.devices;
  let s = { ...launch(createSim(cfg), 30, 45), x: d.x - 70, y: 22, th: 0, w: 0, vx: 40, vy: 0 };
  const seen = [];
  for (let i = 0; i < 40; i++) { const before = s.vx; s = step(s, {}, cfg, 50); if (s.bounceEvent === 'side') seen.push(s.vx - before); }
  assert.equal(seen.length, 1, `one vault boost, got ${seen.length}`); assert.ok(seen[0] >= dv.vaultBoostMps - 1, `gain ${seen[0]}`);
});
test('sliding on the road into a device vaults over it going forward (never backwards)', () => {
  const d = dev0;
  let s = { ...launch(createSim(cfg), 30, 45), x: d.x - 70, y: cfg.physics.bodyHalfH, th: 0, w: 0, vx: 30, vy: 0, grounded: true };
  let minVx = 1e9;
  for (let i = 0; i < 120; i++) { s = step(s, {}, cfg, 50); minVx = Math.min(minVx, s.vx); }
  assert.ok(minVx >= 0, `never backwards: ${minVx}`); assert.ok(s.x > d.x, `ended up past the device: ${s.x}`);
});
test('momentum is additive on a top bounce: forward speed is at least what it was plus a quality-scaled gain', () => {
  const s0 = falling(0, 25, -25); const t = bounceOf(s0);
  assert.ok(t.vx >= 25 + cfg.devices.padAddVx * t.lastBounce.q - 1e-6, `vx ${t.vx} q ${t.lastBounce.q}`);
  const poor = bounceOf(falling(-0.35, 25, -25)); assert.ok(poor.vx >= 25, `even a poor bounce never loses forward speed: ${poor.vx}`);
});
test('fuzz: no launch, angle or contact ever drives forward speed negative while flying (no backward bounces)', () => {
  let worst = 1e9;
  for (const g of [0.3, 0.6, 1]) for (const a of [8, 20, 35, 50, 62]) {
    let s = launch(createSim(cfg), cfg.physics.powerMinMps + (cfg.physics.powerMaxMps - cfg.physics.powerMinMps) * g, a, 2, cfg.launch.liftM);
    for (let i = 0; i < 700 && s.status === 'running'; i++) { s = step(s, {}, cfg, 50); worst = Math.min(worst, s.vx); }
  }
  assert.ok(worst >= -1e-9, `most negative vx ${worst}`);
});
test('plaid: the flag switches on at 400 Gbps (150 m/s), stays on above 340 Gbps (127.5 m/s), off below, and counts entries', () => {
  const air = { ...launch(createSim(noDevices), 60, 20), y: 500 };
  let s = { ...air, vx: 149, vy: 0, speedMps: 149 }; s = step(s, {}, noDevices, 50); assert.equal(s.plaid, false);
  s = { ...air, vx: 151, vy: 0 }; s = step(s, {}, noDevices, 50); assert.equal(s.plaid, true); assert.equal(s.plaidSeq, 1);
  s = { ...s, vx: 135, vy: 0 }; s = step(s, {}, noDevices, 50); assert.equal(s.plaid, true, 'hysteresis keeps it on');
  s = { ...s, vx: 120, vy: 0 }; s = step(s, {}, noDevices, 50); assert.equal(s.plaid, false); assert.equal(s.plaidSeq, 1);
  s = { ...s, vx: 155, vy: 0 }; s = step(s, {}, noDevices, 50); assert.equal(s.plaid, true); assert.equal(s.plaidSeq, 2, 'a second entry is counted');
});
test('a wedged character is shaken loose to a clear spot after a second', () => {
  const stuck = { ...launch(createSim(cfg), 30, 45), x: 330, y: 60, th: 1, w: 0, vx: 0, vy: 0, stuckMs: 960 };
  const t = step(stuck, {}, cfg, 50);
  assert.equal(t.grounded, true); assert.equal(t.th, 0); assert.ok(createSim(cfg).devices.every((d) => Math.abs(t.x - d.x) > d.boxHalf + cfg.physics.bodyHalfW), 'moved to a clear spot');
});
test('a Boost in the green range assumes the perfect angle; other presses do not; no energy, no boost', () => {
  const air = { ...launch(createSim(cfg), 40, 20), y: 150, vx: 25, vy: -5 };
  const perfect = step({ ...air, sweepMs: 500 }, { boostPressed: true }, noDevices, 50);
  const ang = Math.atan2(perfect.vy, perfect.vx) * 180 / Math.PI;
  near(ang, cfg.airBoost.optimalAngleDeg, 'optimal angle', 4); assert.ok(perfect.speedMps >= cfg.airBoost.perfectMinMps, 'speed gain'); assert.ok(Math.abs(perfect.w) < Math.abs(air.w) + 1e-9 || air.w === 0);
  const poor = step({ ...air, sweepMs: 100 }, { boostPressed: true }, noDevices, 50);
  assert.ok(Math.abs(Math.atan2(poor.vy, poor.vx) * 180 / Math.PI - cfg.airBoost.optimalAngleDeg) > 10, 'poor press keeps its own direction');
  assert.equal(step({ ...air, sweepMs: 500, energy: 0 }, { boostPressed: true }, noDevices, 50).boostEvent, null);
});
test('a solid bounce is clearly rewarding: at least 100 energy and a forward speed gain of at least 25%', () => {
  const s0 = falling(0, 20, -20); const flat = bounceOf(s0);
  assert.ok(flat.lastBounce.q >= 0.8); assert.ok(flat.energy - s0.energy >= 100, `gain ${flat.energy - s0.energy}`); assert.ok(flat.vx >= 20 * 1.25, `vx ${flat.vx}`);
});

test('the player starts with 3 boosts; each Boost spends one; the 4th press does nothing', () => {
  let s = { ...launch(createSim(cfg), 40, 20), y: 400, vx: 25, vy: 0 };
  assert.equal(s.boosts, 3);
  const used = [];
  for (let k = 0; k < 4; k++) { s = step({ ...s, sweepMs: 500, boostCooldownMs: 0 }, { boostPressed: true }, noDevices, 50); used.push(s.boostEvent); }
  assert.deepEqual(used, ['good', 'good', 'good', null]); assert.equal(s.boosts, 0);
  assert.equal(step({ ...s, sweepMs: 500, boostCooldownMs: 0 }, { boostPressed: true, assist: true }, noDevices, 50).boostEvent, null, 'assist does not add boosts');
});
test('a boost is strong: a perfect one adds at least 25 m/s along the optimal angle; an ordinary one still pushes clearly', () => {
  const air = { ...launch(createSim(cfg), 40, 20), y: 400, vx: 20, vy: -2 };
  const perfect = step({ ...air, sweepMs: 500 }, { boostPressed: true }, noDevices, 50);
  assert.ok(perfect.speedMps - air.speedMps >= 25, `gain ${perfect.speedMps - air.speedMps}`);
  const ok = step({ ...air, sweepMs: 350 }, { boostPressed: true }, noDevices, 50);
  assert.ok(ok.vx - air.vx >= 10 && ok.vy - air.vy >= 5);
});
test('boost pickups are deterministic, flying into one collects it (+1, capped), and a taken one is gone', () => {
  const sim = createSim(cfg); const k = sim.devices && sim.pickups[0];
  assert.equal(sim.pickups.length, 60); assert.deepEqual(sim.pickups, createSim(cfg).pickups);
  let s = { ...launch(createSim(cfg), 40, 20), x: k.x - 20, y: k.y, vx: 30, vy: 0, boosts: 2 };
  s = run(s, 3, {}, noDevices);
  assert.equal(s.boosts, 3); assert.equal(s.pickupSeq, 1); assert.deepEqual(s.taken, [k.id]); assert.equal(s.lastPickup.id, k.id);
  let t = { ...launch(createSim(cfg), 40, 20), x: k.x - 20, y: k.y, vx: 30, vy: 0, boosts: cfg.boost.maxCount };
  t = run(t, 3, {}, noDevices); assert.equal(t.boosts, cfg.boost.maxCount, 'capped');
  let u = { ...s, x: k.x - 20, y: k.y, vx: 30, vy: 0, grounded: false }; u = run(u, 3, {}, noDevices); assert.equal(u.pickupSeq, 1, 'not collected twice');
  const far = run({ ...launch(createSim(noDevices), 40, 20), x: k.x - 20, y: k.y + 150, vx: 30, vy: 0 }, 3, {}, noDevices); assert.equal(far.pickupSeq, 0, 'missed by height');
});
test('out of energy: horizontal speed bleeds away so the character comes down instead of floating on', () => {
  const air = { ...launch(createSim(cfg), 60, 35), y: 300, energy: 0 };
  const t = run({ ...air }, 20, {}, noDevices);
  assert.ok(t.vx < air.vx * 0.5, `vx ${t.vx} vs ${air.vx}`);
  const fed = run({ ...air, energy: 500 }, 20, {}, noDevices); assert.ok(fed.vx > air.vx * 0.9, 'with energy there is no dry drag');
});
test('a better contact launches along a better angle: the exit direction moves toward the ideal pad angle, speed kept', () => {
  const ideal = cfg.devices.padAngleDeg;
  const ang = (s) => Math.atan2(s.vy, s.vx) * 180 / Math.PI;
  const flat = bounceOf(falling(0, 30, -30)); const tilt = bounceOf(falling(-0.35, 30, -30));
  assert.ok(Math.abs(ang(flat) - ideal) < Math.abs(ang(tilt) - ideal) + 1e-9, `flat ${ang(flat)} tilt ${ang(tilt)} ideal ${ideal}`);
  assert.ok(ang(flat) < 55, 'a good bounce exits flat enough to chain devices');
});
test('the ram lifts the body off the road at launch so a flat shot does not scrape it', () => {
  const a = launch(createSim(cfg), 60, 10, 2, 0); const b = launch(createSim(cfg), 60, 10, 2, cfg.launch.liftM);
  near(b.y - a.y, cfg.launch.liftM);
  assert.ok(run(b, 6, {}, noDevices).roadBounces === 0, 'no road contact during the first 0.3 s of a flat launch');
});
// ---- Balance (FR-026): drive the whole game with a scripted bot ----
function lockAt(g, cfgx, power, angleDeg) {
  g.start();
  const want = (stage, w) => { for (let i = 0; i < 4000; i++) { const a = g.view().aim; const cur = stage === 'p' ? a.power01 : (a.angleDeg - cfgx.physics.angleMinDeg) / (cfgx.physics.angleMaxDeg - cfgx.physics.angleMinDeg); if (Math.abs(cur - w) < 0.02) return; g.tick(10); } };
  want('p', power); g.lock(); want('a', (angleDeg - cfgx.physics.angleMinDeg) / (cfgx.physics.angleMaxDeg - cfgx.physics.angleMinDeg)); g.lock();
}
function playBot({ power = 0.8, angle = 45, boosts = false, assist = false, game = null, drain = null } = {}) {
  let used = 0;
  const d = clone(doc); if (drain) d.config.drainPerMeter = drain;
  const g = game || createGame(d);
  if (assist) g.toggleAssist();
  lockAt(g, d.config, power, angle);
  const key = Object.fromEntries([...d.rounds, d.boss].map((r) => [r.id, r.rule.correctChoice]));
  for (let i = 0; i < 400000; i++) {
    const v = g.view();
    if (v.phase === 'summary') return v;
    if (v.phase === 'awaiting-answer' || v.phase === 'last-chance' || v.phase === 'boss') g.submit(key[v.round.id]);
    else if (v.phase === 'feedback') g.next();
    else if (v.phase === 'aim-power') { if (!assist) g.tick(750 - v.aim.gaugeMs); g.lock(); }
    else if (v.phase === 'aim-angle') { if (!assist) g.tick(425 - v.aim.gaugeMs); g.lock(); }
    else if (v.phase === 'launching') g.tick(50);
    else { if (boosts && used < 3 && v.sim.boostCooldownMs <= 0 && v.sim.vy < 0 && v.sim.y > 30 && inGoodWindow(v.sim.sweepMs, d.config)) { g.pressBoost(); used += 1; } g.tick(50); }
  }
  throw new Error('bot did not finish');
}
test('balance: answering every question reaches the boss and a victory, whatever the launch (good, weak, steep, flat, assist, boosting)', () => {
  for (const o of [{}, { power: 0.2 }, { angle: 80 }, { angle: 10 }, { assist: true }, { boosts: true }]) {
    const v = playBot(o);
    assert.equal(v.bossDefeated, true, JSON.stringify(o)); assert.equal(v.outcome, 'victory', JSON.stringify(o)); assert.equal(v.score, 7);
  }
});
test('a harsh drain asks a last-chance question at EVERY zero-energy stop; answering them all correctly still reaches the boss', () => {
  const v = playBot({ drain: 1.5 });
  assert.ok(v.lastChances >= 2, `last chances ${v.lastChances}`); assert.equal(v.outcome, 'victory'); assert.equal(v.bossDefeated, true);
});
test('balance runs are deterministic', () => {
  assert.deepEqual(playBot({ boosts: true }).sim, playBot({ boosts: true }).sim);
});
