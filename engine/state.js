// Session state machine: launch gauges, flight, questions, last chance, boss, glide, restart.
// All grading goes through rules.js; all movement goes through sim.js.
import { validateDocument } from './content.js';
import { evaluate } from './rules.js';
import { explain } from './feedback.js';
import { createSim, step, ackQuestion, onCorrectAnswer, resume, startGlide, launch, gaugeValue, powerFromGauge, angleFromGauge } from './sim.js';

export const TICK_MS = 50;
const QUESTION_PHASES = ['awaiting-answer', 'last-chance', 'boss'];
const MOVING = ['flying', 'glide'];

export function createGame(doc) {
  const validation = validateDocument(doc);
  const config = doc && doc.config;
  const rounds = (doc && doc.rounds) || [];
  const boss = doc && doc.boss;
  const sources = (doc && doc.sources) || [];
  let S;

  function fresh() {
    return {
      phase: validation.fatal.length ? 'error' : 'briefing',
      errors: validation.fatal.slice(),
      sim: validation.fatal.length ? null : createSim(config), prev: null,
      score: 0, completedRoundIds: [], attempts: {},
      assistance: { assistUsed: false, assistBoosts: 0, assistedLaunch: false },
      askedCount: 0, currentRoundId: null, lastChanceUsed: false, lastChance: false,
      bossDefeated: false, outcome: null, lastResult: null, assist: false, boostQueued: false,
      acc: 0, pendingNext: null, contentError: null, mood: null, moodSeq: 0,
      gaugeMs: 0, lockedPower: null, lockedAngle: null, launchMs: 0, relaunch: false, launchSeq: 0, launchAtX: 0, lastChances: 0
    };
  }
  S = fresh();

  const currentRound = () => (S.currentRoundId === (boss && boss.id) ? boss : rounds.find((r) => r.id === S.currentRoundId) || null);
  const totalAttempts = () => Object.values(S.attempts).reduce((a, b) => a + b, 0);
  const setMood = (m) => { S.mood = m; S.moodSeq += 1; };
  const finish = (outcome) => { S.outcome = outcome; S.phase = 'summary'; S.lastChance = false; };

  function openQuestion(lastChance) {
    const round = rounds[S.askedCount];
    S.askedCount += 1;
    S.sim = ackQuestion(S.sim);
    S.currentRoundId = round.id;
    S.lastChance = lastChance;
    S.lastResult = null;
    S.contentError = validation.rounds[round.id];
    S.phase = lastChance ? 'last-chance' : 'awaiting-answer';
  }

  // After Layer 7 the boss is asked at the next stop, like every other question (FR-023): no last chance, retries are free.
  function openBoss() {
    S.sim = ackQuestion(S.sim);
    S.currentRoundId = boss.id; S.lastChance = false; S.lastResult = null; S.contentError = validation.boss; S.phase = 'boss';
  }

  // The character stopped on the road (a miss) or the glide ran dry.
  function handleStatus() {
    const st = S.sim.status;
    if (st === 'missed') {
      // A stop always asks a question. At zero energy it is a last chance, every time (FR-008).
      if (S.askedCount < rounds.length) {
        const dry = S.sim.energy <= 1e-9;
        if (dry) { S.lastChanceUsed = true; S.lastChances += 1; }
        openQuestion(dry);
      } else if (!S.bossDefeated) openBoss();
      else if (S.sim.energy <= 1e-9) finish('out-of-energy');
      else S.sim = resume(S.sim, config);
    } else if (st === 'stopped') finish(S.sim.phase === 'glide' ? 'victory' : 'out-of-energy');
  }

  function runStep() {
    S.prev = S.sim;
    const input = { boostPressed: S.boostQueued, assist: S.assist };
    S.boostQueued = false;
    S.sim = step(S.sim, input, config, TICK_MS);
    if (S.sim.boostEvent && S.assist) { S.assistance.assistUsed = true; S.assistance.assistBoosts += 1; }
    handleStatus();
  }

  const power01 = () => (S.assist ? config.gauge.assistPower : gaugeValue(S.gaugeMs, config.gauge.powerPeriodMs));
  const angleNow = () => (S.assist ? config.gauge.assistAngleDeg : angleFromGauge(gaugeValue(S.gaugeMs, config.gauge.anglePeriodMs), config));

  // Values for drawing between two fixed steps: the scene is drawn every display frame (FR-034), the
  // simulation only every TICK_MS, so position is interpolated by the leftover time.
  function drawValues() {
    const cur = S.sim;
    if (!cur) return null;
    const running = MOVING.includes(S.phase) && S.prev && cur.status === 'running';
    const a = running ? Math.min(1, S.acc / TICK_MS) : 1;
    const lerp = (p, c) => (running ? p + (c - p) * a : c);
    return {
      x: lerp(S.prev ? S.prev.x : cur.x, cur.x), y: lerp(S.prev ? S.prev.y : cur.y, cur.y), th: lerp(S.prev ? S.prev.th : cur.th, cur.th),
      tail: cur.tail.map((q, i) => ({ x: lerp(S.prev && S.prev.tail[i] ? S.prev.tail[i].x : q.x, q.x), y: lerp(S.prev && S.prev.tail[i] ? S.prev.tail[i].y : q.y, q.y) })),
      sweepMs: (cur.sweepMs + (running ? S.acc : 0)) % config.boost.sweepMs
    };
  }

  const api = {
    start() { if (S.phase === 'briefing') { S.phase = 'aim-power'; S.gaugeMs = 0; S.launchMs = 0; } return api.view(); },

    // One click locks the moving gauge: power first, then angle (FR-036).
    lock() {
      if (S.phase === 'aim-power') {
        S.lockedPower = power01(); S.assistance.assistedLaunch = S.assistance.assistedLaunch || S.assist;
        S.phase = 'aim-angle'; S.gaugeMs = 0;
      } else if (S.phase === 'aim-angle') {
        S.lockedAngle = angleNow(); S.assistance.assistedLaunch = S.assistance.assistedLaunch || S.assist;
        if (S.assist) S.assistance.assistUsed = true;
        S.phase = 'launching'; S.launchMs = 0;
      }
      return api.view();
    },

    tick(dtMs) {
      if (S.phase === 'aim-power' || S.phase === 'aim-angle') { S.gaugeMs += dtMs; return api.view(); }
      if (S.phase === 'launching') {
        // Every launch (the first, and the power-up re-aim after a correct answer) is a Catalyst charge that ends in an impact.
        S.launchMs += dtMs;
        if (S.launchMs >= config.launch.impactMs) {
          const first = !S.relaunch;
          const power = first ? powerFromGauge(S.lockedPower, config) : powerFromGauge(S.lockedPower, config) + config.relaunch.stepMps * S.sim.answersCorrect;
          const spin = first ? config.launch.spinRadS * S.lockedPower : config.relaunch.spinRadS;
          S.launchAtX = S.sim.x; S.launchSeq += 1;
          S.sim = launch(first ? S.sim : { ...S.sim, status: 'paused', vx: 0, vy: 0, w: 0 }, power, S.lockedAngle, spin, config.launch.liftM);
          S.prev = S.sim; S.phase = 'flying'; S.acc = 0; S.relaunch = false;
        }
        return api.view();
      }
      if (!MOVING.includes(S.phase)) return api.view();
      S.launchMs += dtMs;
      S.acc += dtMs;
      while (S.acc >= TICK_MS && MOVING.includes(S.phase)) { S.acc -= TICK_MS; runStep(); }
      if (!MOVING.includes(S.phase)) S.acc = 0;
      return api.view();
    },

    pressBoost() { if (MOVING.includes(S.phase)) S.boostQueued = true; return api.view(); },
    toggleAssist() { S.assist = !S.assist; return api.view(); },

    submit(choice) {
      if (!QUESTION_PHASES.includes(S.phase)) return api.view();
      const round = currentRound();
      if (S.contentError) { S.lastResult = explain({ status: 'content-error', evidence: { message: S.contentError, roundId: round.id } }, round); return api.view(); }
      const result = evaluate(round, sources, choice);
      S.lastResult = explain(result, round);
      if (result.status === 'correct') {
        if (S.completedRoundIds.includes(round.id)) return api.view();
        S.attempts[round.id] = (S.attempts[round.id] || 0) + 1;
        S.completedRoundIds.push(round.id);
        S.lastChance = false;
        if (S.phase === 'boss') { S.bossDefeated = true; S.pendingNext = 'glide'; }
        else {
          S.score += 1;
          S.sim = onCorrectAnswer(S.sim, config);
          S.pendingNext = 'flying'; // always the power-up re-aim; the boss comes at the next stop
        }
        S.phase = 'feedback';
        setMood('celebrate');
      } else if (result.status === 'incorrect') {
        S.attempts[round.id] = (S.attempts[round.id] || 0) + 1;
        setMood('mourn');
        if (S.phase === 'last-chance') finish('out-of-energy');
      }
      return api.view();
    },

    next() {
      if (S.phase !== 'feedback') return api.view();
      const to = S.pendingNext; S.pendingNext = null; S.lastResult = null; S.mood = null;
      if (to === 'glide') { S.sim = startGlide(S.sim, config); S.phase = 'glide'; S.currentRoundId = null; }
      else { S.relaunch = true; S.gaugeMs = 0; S.lockedPower = null; S.lockedAngle = null; S.phase = 'aim-power'; } // power-up: aim again
      return api.view();
    },

    restart(confirmed) {
      if (!confirmed) return false;
      S = fresh();
      return true;
    },

    view() {
      const round = S.phase === 'error' ? null : currentRound();
      const stage = S.phase === 'aim-power' ? 'power' : S.phase === 'aim-angle' ? 'angle' : null;
      return {
        phase: S.phase, errors: S.errors, sim: S.sim, config, draw: drawValues(),
        round, isBoss: Boolean(round && boss && round.id === boss.id),
        score: S.score, roundCount: rounds.length, completedRoundIds: S.completedRoundIds.slice(),
        attempts: totalAttempts(), assistance: { ...S.assistance }, assist: S.assist,
        lastResult: S.lastResult, lastChance: S.lastChance, lastChanceUsed: S.lastChanceUsed, lastChances: S.lastChances,
        bossDefeated: S.bossDefeated, outcome: S.outcome, contentError: S.contentError,
        mood: S.mood, moodSeq: S.moodSeq, askedCount: S.askedCount, warnings: validation.warnings,
        aim: {
          stage,
          power01: stage === 'power' ? power01() : S.lockedPower,
          powerMps: stage === 'power' ? powerFromGauge(power01(), config) : (S.lockedPower !== null ? powerFromGauge(S.lockedPower, config) : null),
          angleDeg: stage === 'angle' ? angleNow() : S.lockedAngle,
          gaugeMs: S.gaugeMs, relaunch: S.relaunch
        },
        launchMs: S.launchMs, launch: { seq: S.launchSeq, x: S.launchAtX }
      };
    }
  };
  return api;
}
