// Validates authored content (data/levels.json, schema version 2). Pure: no DOM, no network.
// Round-level problems are reported per round so grading for that round can be disabled.

export const LAYER_NAMES = {
  1: 'Physical', 2: 'Data Link', 3: 'Network', 4: 'Transport',
  5: 'Session', 6: 'Presentation', 7: 'Application'
};

export const MSG = {
  KEY: 'Content error: answer key missing or not one of the options',
  SOURCE: 'Content error: source missing or unknown',
  CHOICES: 'Content error: a question needs exactly four options with unique ids, labels, and reasons',
  PROMPT: 'Content error: question text is missing',
  AMBIGUOUS: 'Content error: more than one option is marked correct'
};

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isPos = (v) => isNum(v) && v > 0;

// Returns a "Content error: ..." message or null for one question (round or boss).
export function questionContentError(q, sources) {
  if (!q || typeof q.prompt !== 'string' || !q.prompt.trim()) return MSG.PROMPT;
  const ch = Array.isArray(q.choices) ? q.choices : [];
  const ids = ch.map((c) => c && c.id);
  if (ch.length !== 4 || new Set(ids).size !== 4 || ch.some((c) => !c || !c.id || !c.label || !c.why)) return MSG.CHOICES;
  const key = q.rule && q.rule.correctChoice;
  if (key === null || key === undefined || !ids.includes(key)) return MSG.KEY;
  if (ch.filter((c) => c.correct === true).length > 1) return MSG.AMBIGUOUS;
  const srcIds = (sources || []).map((s) => s.id);
  if (!q.rule.sourceId || !srcIds.includes(q.rule.sourceId)) return MSG.SOURCE;
  return null;
}

// -> { fatal: string[], rounds: {roundId: message|null}, boss: message|null, warnings: string[] }
export function validateDocument(doc) {
  const fatal = [];
  const warnings = [];
  const rounds = {};
  let boss = null;
  if (!doc || typeof doc !== 'object') return { fatal: ['Content error: document is missing or not an object'], rounds, boss, warnings };
  if (doc.schemaVersion !== 2) fatal.push('Content error: schemaVersion must be 2');

  const c = doc.config || {};
  const g = c.physics || {}; const d = c.devices || {}; const gg = c.gauge || {}; const rl = c.relaunch || {}; const ab = c.airBoost || {}; const ln = c.launch || {}; const tl = c.tail || {};
  const posPaths = [
    ['initialEnergy', c.initialEnergy], ['drainPerMeter', c.drainPerMeter], ['powerUpEnergy', c.powerUpEnergy],
    ['superBoostEnergy', c.superBoostEnergy], ['displayBitsPerMps', c.displayBitsPerMps],
    ['glide.speedMps', c.glide && c.glide.speedMps], ['glide.drainPerMeter', c.glide && c.glide.drainPerMeter],
    ['boost.cooldownMs', c.boost && c.boost.cooldownMs], ['boost.startCount', c.boost && c.boost.startCount], ['boost.maxCount', c.boost && c.boost.maxCount], ['boost.sweepMs', c.boost && c.boost.sweepMs], ['boost.goodQuality', c.boost && c.boost.goodQuality],
    ['physics.gravity', g.gravity], ['physics.subSteps', g.subSteps], ['physics.powerMinMps', g.powerMinMps], ['physics.powerMaxMps', g.powerMaxMps],
    ['physics.angleMinDeg', g.angleMinDeg], ['physics.angleMaxDeg', g.angleMaxDeg], ['physics.roadRestitution', g.roadRestitution], ['physics.roadFriction', g.roadFriction],
    ['physics.slideDecel', g.slideDecel], ['physics.stopMps', g.stopMps], ['physics.minBounceMps', g.minBounceMps], ['physics.maxSpeedMps', g.maxSpeedMps], ['physics.dryDragPerS', g.dryDragPerS],
    ['physics.bodyHalfW', g.bodyHalfW], ['physics.bodyHalfH', g.bodyHalfH], ['physics.inertiaK', g.inertiaK], ['physics.flatBlendM', g.flatBlendM],
    ['physics.roadMu', g.roadMu], ['physics.devMu', g.devMu], ['physics.rollDamp', g.rollDamp], ['physics.rightRate', g.rightRate],
    ['gauge.powerPeriodMs', gg.powerPeriodMs], ['gauge.anglePeriodMs', gg.anglePeriodMs], ['gauge.assistPower', gg.assistPower], ['gauge.assistAngleDeg', gg.assistAngleDeg],
    ['launch.impactMs', ln.impactMs], ['launch.liftM', ln.liftM], ['launch.settleMs', ln.settleMs],
    ['devices.count', d.count], ['devices.firstX', d.firstX], ['devices.gapStartM', d.gapStartM], ['devices.padKickMps', d.padKickMps], ['devices.energy', d.energy], ['devices.energyMinFrac', d.energyMinFrac], ['devices.padSpeedGain', d.padSpeedGain], ['devices.padAngleDeg', d.padAngleDeg], ['devices.padAimBlend', d.padAimBlend], ['devices.padMinExitMps', d.padMinExitMps], ['devices.padAimFloor', d.padAimFloor], ['devices.poleHalfM', d.poleHalfM], ['devices.padAddVx', d.padAddVx], ['devices.vaultBoostMps', d.vaultBoostMps], ['devices.vaultMinMps', d.vaultMinMps], ['devices.vaultClearM', d.vaultClearM], ['devices.vaultMaxVy', d.vaultMaxVy], ['devices.vaultCoolMs', d.vaultCoolMs], ['devices.vaultClimbMul', d.vaultClimbMul], ['plaid.thresholdGbps', c.plaid && c.plaid.thresholdGbps], ['plaid.exitGbps', c.plaid && c.plaid.exitGbps],
    ['relaunch.mps', rl.mps], ['relaunch.angleDeg', rl.angleDeg],
    ['airBoost.minVx', ab.minVx], ['airBoost.maxVx', ab.maxVx], ['airBoost.minVy', ab.minVy], ['airBoost.maxVy', ab.maxVy], ['airBoost.optimalAngleDeg', ab.optimalAngleDeg], ['airBoost.perfectMinMps', ab.perfectMinMps], ['airBoost.perfectGainMps', ab.perfectGainMps], ['airBoost.perfectSpinKeep', ab.perfectSpinKeep],
    ['pickups.count', c.pickups && c.pickups.count], ['pickups.firstX', c.pickups && c.pickups.firstX], ['pickups.gapM', c.pickups && c.pickups.gapM], ['pickups.radius', c.pickups && c.pickups.radius],
    ['tail.nodes', tl.nodes], ['tail.segM', tl.segM], ['tail.damp', tl.damp], ['tail.iterations', tl.iterations]
  ];
  for (const [name, v] of posPaths) if (!isPos(v)) fatal.push(`Content error: config.${name} must be a number greater than 0`);
  for (const [name, v] of [['devices.gapGrowM', d.gapGrowM], ['relaunch.stepMps', rl.stepMps], ['relaunch.spinRadS', rl.spinRadS], ['launch.spinRadS', ln.spinRadS], ['physics.spinDrag', g.spinDrag]]) if (!isNum(v) || v < 0) fatal.push(`Content error: config.${name} must be a number, 0 or more`);
  if (!c.pickups || !Array.isArray(c.pickups.heights) || !c.pickups.heights.length || !c.pickups.heights.every(isPos)) fatal.push('Content error: config.pickups.heights must list heights greater than 0');
  if (c.boost && isNum(c.boost.startCount) && isNum(c.boost.maxCount) && c.boost.startCount > c.boost.maxCount) fatal.push('Content error: config.boost.startCount must not exceed maxCount');
  const kinds = d.kinds;
  if (!Array.isArray(kinds) || kinds.length !== 7 || !kinds.every((k) => k && isPos(k.halfM) && isPos(k.boxHalfM) && isNum(k.boxBottomM) && k.boxBottomM >= 0 && isPos(k.top) && isPos(k.e) && isNum(k.tiltDeg) && Math.abs(k.tiltDeg) < 60)) fatal.push('Content error: config.devices.kinds must list 7 devices with halfM, top, e greater than 0 and tiltDeg between -60 and 60');
  if (isNum(g.angleMinDeg) && isNum(g.angleMaxDeg) && (g.angleMinDeg >= g.angleMaxDeg || g.angleMaxDeg > 89)) fatal.push('Content error: config.physics angle range must be increasing and below 90');
  if (c.boost && isNum(c.boost.goodQuality) && c.boost.goodQuality > 1) fatal.push('Content error: config.boost.goodQuality must be between 0 and 1');

  const seen = new Set();
  const sources = Array.isArray(doc.sources) ? doc.sources : [];
  if (!Array.isArray(doc.sources) || sources.length === 0) fatal.push('Content error: sources must be a non-empty array');
  for (const s of sources) {
    if (!s || !s.id) { fatal.push('Content error: a source has no id'); continue; }
    if (seen.has('s:' + s.id)) fatal.push(`Content error: duplicate source id ${s.id}`);
    seen.add('s:' + s.id);
    if (!s.title || !s.section) fatal.push(`Content error: source ${s.id} needs a title and section`);
    if (!s.url && !s.reviewPending) fatal.push(`Content error: source ${s.id} needs a url`);
    if (s.reviewPending) warnings.push(`Source ${s.id} is pending review`);
  }

  const rs = Array.isArray(doc.rounds) ? doc.rounds : [];
  if (!Array.isArray(doc.rounds) || rs.length === 0) fatal.push('Content error: rounds must be a non-empty array');
  for (const r of rs) {
    if (!r || !r.id) { fatal.push('Content error: a round has no id'); continue; }
    if (seen.has('r:' + r.id)) fatal.push(`Content error: duplicate round id ${r.id}`);
    seen.add('r:' + r.id);
    rounds[r.id] = questionContentError(r, sources);
  }

  if (!doc.boss) fatal.push('Content error: boss is missing');
  else {
    if (doc.boss.informal !== true) fatal.push('Content error: boss.informal must be true');
    boss = questionContentError(doc.boss, sources);
  }
  return { fatal, rounds, boss, warnings };
}
