import { test, assert, loadDoc, clone } from './harness.js';
import { createGame, TICK_MS } from '../engine/state.js';

const doc = await loadDoc();
const key = Object.fromEntries([...doc.rounds, doc.boss].map((r) => [r.id, r.rule.correctChoice]));
const wrongOf = (r) => r.choices.find((c) => c.id !== r.rule.correctChoice).id;

function launched(g, { assist = true } = {}) {
  g.start(); if (assist) g.toggleAssist();
  g.lock(); g.lock(); g.tick(doc.config.launch.impactMs);
  return g.view();
}
function toQuestion(g, opts) {
  launched(g, opts);
  for (let i = 0; i < 100000 && g.view().phase === 'flying'; i++) g.tick(50);
  return g.view();
}

test('fresh game: briefing, then Launch shows the power gauge, no flight yet', () => {
  const g = createGame(doc);
  assert.equal(g.view().phase, 'briefing'); assert.equal(g.view().sim.status, 'standing');
  g.start(); assert.equal(g.view().phase, 'aim-power'); assert.equal(g.view().aim.stage, 'power');
  g.tick(500); assert.equal(g.view().sim.status, 'standing'); assert.equal(g.view().sim.x, 0);
});
test('power gauge sweeps low-high-low and one lock picks the moving value, then the angle gauge starts', () => {
  const g = createGame(doc); g.start();
  g.tick(750); // half the 1500 ms period = full power
  near(g.view().aim.power01, 1); g.lock();
  assert.equal(g.view().phase, 'aim-angle'); near(g.view().aim.powerMps, doc.config.physics.powerMaxMps);
  g.tick(425); // quarter of the 1700 ms period = half the angle range
  near(g.view().aim.angleDeg, 45); g.lock();
  assert.equal(g.view().phase, 'launching'); near(g.view().aim.angleDeg, 45);
});
function near(a, b) { assert.ok(Math.abs(a - b) < 1e-6, `${a} vs ${b}`); }
test('timing matters: locking at different moments gives different power and angle', () => {
  const grab = (ms) => { const g = createGame(doc); g.start(); g.tick(ms); g.lock(); return g.view().aim.powerMps; };
  assert.ok(grab(750) > grab(300)); assert.ok(grab(300) !== grab(500));
});
test('lock is ignored outside the aiming phases', () => {
  const g = createGame(doc); g.lock(); assert.equal(g.view().phase, 'briefing');
  toQuestion(g); const p = g.view().phase; g.lock(); assert.equal(g.view().phase, p);
});
test('the Catalyst impact: nothing moves until the impact time, then the character is launched with the chosen vector', () => {
  const g = createGame(doc); g.start(); g.toggleAssist(); g.lock(); g.lock();
  assert.equal(g.view().phase, 'launching'); g.tick(doc.config.launch.impactMs - 50);
  assert.equal(g.view().phase, 'launching'); assert.equal(g.view().sim.x, 0);
  g.tick(50);
  const v = g.view();
  assert.equal(v.phase, 'flying'); assert.equal(v.sim.status, 'running');
  const sp = doc.config.physics.powerMinMps + (doc.config.physics.powerMaxMps - doc.config.physics.powerMinMps) * doc.config.gauge.assistPower;
  near(v.sim.speedMps, sp); near(Math.atan2(v.sim.vy, v.sim.vx) * 180 / Math.PI, doc.config.gauge.assistAngleDeg);
});
test('Assist locks fixed good values and is recorded as assistance', () => {
  const g = createGame(doc); g.start(); g.toggleAssist(); g.tick(123); g.lock(); g.tick(77); g.lock();
  const v = g.view(); assert.equal(v.assistance.assistedLaunch, true); assert.equal(v.assistance.assistUsed, true);
});
test('a question appears when the character stops on the road, with no briefing screen first', () => {
  const v = toQuestion(createGame(doc));
  assert.equal(v.phase, 'awaiting-answer'); assert.equal(v.round.id, 'q1'); assert.equal(v.sim.status, 'paused'); assert.ok(v.sim.misses >= 1);
});
test('a question screen has four lettered options and no hint or worked-solution API', () => {
  const g = createGame(doc);
  assert.equal(typeof g.requestHint, 'undefined'); assert.equal(typeof g.viewWorked, 'undefined'); assert.equal(typeof g.dismissBriefing, 'undefined');
  const v = toQuestion(g); assert.equal(v.round.choices.length, 4); assert.ok(!('revealedHints' in v));
});
test('no selection: guidance shown, no attempt, no completion', () => {
  const g = createGame(doc); toQuestion(g); g.submit(null);
  const v = g.view();
  assert.equal(v.attempts, 0); assert.equal(v.score, 0); assert.equal(v.completedRoundIds.length, 0);
  assert.equal(v.lastResult.headline, 'Select an option'); assert.equal(v.phase, 'awaiting-answer');
});
test('wrong answer: one attempt, explains that option, round stays open, no points, no energy change', () => {
  const g = createGame(doc); const v0 = toQuestion(g); const e0 = v0.sim.energy;
  g.submit(wrongOf(v0.round));
  const v = g.view();
  assert.equal(v.attempts, 1); assert.equal(v.score, 0); assert.equal(v.phase, 'awaiting-answer'); assert.equal(v.sim.energy, e0);
  assert.equal(v.lastResult.tone, 'incorrect'); assert.equal(v.mood, 'mourn');
  assert.equal(v.lastResult.body, v0.round.choices.find((c) => c.id !== v0.round.rule.correctChoice).why);
});
test('retry works; correct completes once with +1 point and the power-up energy; repeated Submit changes nothing', () => {
  const g = createGame(doc); const v0 = toQuestion(g); const e0 = v0.sim.energy;
  g.submit(wrongOf(v0.round)); g.submit(key.q1);
  let v = g.view();
  assert.equal(v.phase, 'feedback'); assert.equal(v.score, 1); assert.equal(v.sim.energy, e0 + doc.config.powerUpEnergy); assert.equal(v.attempts, 2); assert.equal(v.mood, 'celebrate');
  g.submit(key.q1); v = g.view(); assert.equal(v.score, 1); assert.equal(v.attempts, 2); assert.equal(v.sim.energy, e0 + doc.config.powerUpEnergy);
});
function reaim(g, { power = 750, angle = 425 } = {}) { g.tick(power); g.lock(); g.tick(angle); g.lock(); g.tick(doc.config.launch.relaunchMs); }
test('after a correct answer the power and angle dials pop up again, then the character is relaunched (no Catalyst charge)', () => {
  const g = createGame(doc); toQuestion(g); g.submit(key.q1); g.next();
  let v = g.view();
  assert.equal(v.phase, 'aim-power'); assert.equal(v.aim.relaunch, true); assert.equal(v.sim.status, 'paused'); const x0 = v.sim.x;
  g.tick(300); g.tick(450); g.lock(); assert.equal(g.view().phase, 'aim-angle'); g.tick(100); g.lock();
  assert.equal(g.view().phase, 'launching'); g.tick(doc.config.launch.relaunchMs - 50); assert.equal(g.view().phase, 'launching'); assert.equal(g.view().sim.x, x0);
  g.tick(50); v = g.view();
  assert.equal(v.phase, 'flying'); assert.equal(v.sim.status, 'running'); assert.equal(v.aim.relaunch, false); near(v.sim.x, x0);
});
test('the relaunch uses the chosen power and angle: a better lock flies faster; Assist locks the fixed good values', () => {
  const speed = (power) => { const g = createGame(doc); toQuestion(g, { assist: false }); g.submit(key.q1); g.next(); g.tick(power); g.lock(); g.tick(425); g.lock(); g.tick(doc.config.launch.relaunchMs); return g.view().sim.speedMps; };
  assert.ok(speed(750) > speed(200) + 5, 'more power, more speed');
  near(speed(750), doc.config.physics.powerMaxMps + doc.config.relaunch.stepMps);
  const g = createGame(doc); toQuestion(g, { assist: true }); g.submit(key.q1); g.next(); g.tick(123); g.lock(); g.tick(77); g.lock(); g.tick(doc.config.launch.relaunchMs);
  const v = g.view(); const p = doc.config.physics;
  near(v.sim.speedMps, p.powerMinMps + (p.powerMaxMps - p.powerMinMps) * doc.config.gauge.assistPower + doc.config.relaunch.stepMps);
  near(Math.atan2(v.sim.vy, v.sim.vx) * 180 / Math.PI, doc.config.gauge.assistAngleDeg);
});
test('the next question follows a relaunch: Layer 2, then 3, in order', () => {
  const g = createGame(doc); toQuestion(g); g.submit(key.q1); g.next(); reaim(g);
  for (let i = 0; i < 100000 && g.view().phase === 'flying'; i++) g.tick(50);
  assert.equal(g.view().round.id, 'q2'); g.submit(key.q2); g.next(); reaim(g);
  for (let i = 0; i < 100000 && g.view().phase === 'flying'; i++) g.tick(50);
  assert.equal(g.view().round.id, 'q3');
});
test('everything is paused while a question is open', () => {
  const g = createGame(doc); const v0 = toQuestion(g);
  g.tick(60000); const v1 = g.view();
  assert.equal(v1.sim.x, v0.sim.x); assert.equal(v1.sim.energy, v0.sim.energy);
});
test('draw values interpolate between fixed steps', () => {
  const g = createGame(doc); launched(g); g.tick(TICK_MS); g.tick(TICK_MS / 2);
  const v = g.view();
  assert.ok(v.draw.x < v.sim.x && v.draw.x > v.sim.x - 40, 'drawn slightly behind the latest step');
});
test('restart: cancel preserves the session, confirm returns to the first briefing', () => {
  const g = createGame(doc); toQuestion(g); g.submit(key.q1);
  assert.equal(g.restart(false), false); assert.equal(g.view().score, 1);
  assert.equal(g.restart(true), true);
  const v = g.view(); assert.equal(v.phase, 'briefing'); assert.equal(v.score, 0); assert.equal(v.attempts, 0);
});
test('content error on a question: grading disabled, nothing changes', () => {
  const d = clone(doc); d.rounds[0].rule.correctChoice = null;
  const g = createGame(d); toQuestion(g); g.submit('a');
  const v = g.view(); assert.includes(v.contentError, 'answer key'); assert.equal(v.attempts, 0); assert.equal(v.score, 0);
  assert.includes(v.lastResult.headline, 'Content error');
});
test('fatal content problems put the game in an error state without counting anything', () => {
  const d = clone(doc); d.config.physics.gravity = 0;
  const g = createGame(d); const v = g.view();
  assert.equal(v.phase, 'error'); assert.ok(v.errors.length > 0); assert.equal(v.attempts, 0);
  g.start(); g.lock(); g.submit('a'); assert.equal(g.view().phase, 'error');
});

function playUntil(g, stopAt, { wrongLastChance = false } = {}) {
  launched(g);
  for (let i = 0; i < 400000; i++) {
    const v = g.view();
    if (v.phase === stopAt || v.phase === 'summary') return v;
    if (v.phase === 'last-chance' && wrongLastChance) g.submit(wrongOf(v.round));
    else if (v.phase === 'awaiting-answer' || v.phase === 'last-chance' || v.phase === 'boss') g.submit(key[v.round.id]);
    else if (v.phase === 'feedback') g.next();
    else if (v.phase === 'aim-power') { if (!v.assist) g.tick(750 - v.aim.gaugeMs); g.lock(); }
    else if (v.phase === 'aim-angle') { if (!v.assist) g.tick(425 - v.aim.gaugeMs); g.lock(); }
    else g.tick(50);
  }
  throw new Error('did not reach ' + stopAt);
}
const harsh = () => { const d = clone(doc); d.config.drainPerMeter = 1.5; return d; };

test('last chance: with zero energy the stop asks one final question; wrong ends the run, no retry', () => {
  const v = playUntil(createGame(harsh()), 'summary', { wrongLastChance: true });
  assert.equal(v.outcome, 'out-of-energy'); assert.equal(v.lastChanceUsed, true); assert.equal(v.bossDefeated, false);
});
test('last chance is once per run: a second zero-energy stop ends the run without a question', () => {
  const v = playUntil(createGame(harsh()), 'summary');
  assert.equal(v.outcome, 'out-of-energy'); assert.equal(v.lastChanceUsed, true); assert.ok(v.askedCount <= 7);
});
test('boss (Layer 8) appears right after Layer 7; wrong stays open without cost; correct leads to glide with no more questions', () => {
  const g = createGame(doc);
  let v = playUntil(g, 'boss');
  assert.equal(v.phase, 'boss'); assert.equal(v.score, 7); assert.includes(v.round.title, 'informal');
  const energy = v.sim.energy;
  g.submit(wrongOf(v.round)); v = g.view();
  assert.equal(v.phase, 'boss'); assert.equal(v.score, 7); assert.equal(v.sim.energy, energy); assert.equal(v.bossDefeated, false);
  g.submit('c'); v = g.view();
  assert.equal(v.phase, 'feedback'); assert.equal(v.bossDefeated, true); assert.equal(v.score, 7);
  g.next(); v = g.view(); assert.equal(v.phase, 'glide');
  assert.ok(v.sim.energy >= energy + 300 - 1e-6, 'super boost granted');
  for (let i = 0; i < 100000 && g.view().phase === 'glide'; i++) g.tick(50);
  v = g.view(); assert.equal(v.phase, 'summary'); assert.equal(v.outcome, 'victory'); assert.equal(v.score, 7);
});
test('score never exceeds the number of layer questions and never goes negative', () => {
  const v = playUntil(createGame(doc), 'summary');
  assert.ok(v.score >= 0 && v.score <= v.roundCount);
});
test('assist use is recorded separately from the score', () => {
  const v = playUntil(createGame(doc), 'summary');
  assert.equal(v.assistance.assistUsed, true); assert.equal(v.score, 7);
});
