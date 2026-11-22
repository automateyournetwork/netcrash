// DOM rendering. Content is set with textContent only (no innerHTML).
import { formatSpeed, gaugeValue, boostQuality } from '../engine/sim.js';
import { sceneSize } from './device.js';

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Write text only when it changed: the scene redraws every display frame, the DOM should not.
function setText(el, text) { if (el && el.__t !== text) { el.__t = text; el.textContent = text; } }
const fmtM = (m) => `${Math.round(m).toLocaleString('en-US')} m`;

export function buildHud(root) {
  root.textContent = '';
  setSceneAnimation(motion.override); // default on: also tells the CSS to ignore the system reduced-motion rule
  const stat = (id, label) => h('div', { class: 'stat' }, h('dt', { text: label }), h('dd', { id }));
  root.append(
    h('h1', { class: 'title', text: 'NETCRASH' }),
    h('dl', { class: 'stats' },
      stat('hud-distance', 'Distance'), stat('hud-speed', 'Speed'), stat('hud-energy', 'Energy'),
      stat('hud-score', 'Score'), stat('hud-rounds', 'Rounds completed'), stat('hud-attempts', 'Valid attempts'),
      stat('hud-boosts', 'Boosts'), stat('hud-assist', 'Assistance')),
    h('div', { class: 'hud-actions' },
      h('label', { class: 'toggle' }, h('input', { type: 'checkbox', id: 'assist-toggle', 'data-action': 'assist' }), ' Assist (every Boost counts as well-timed)'),
      h('label', { class: 'toggle' }, h('input', { type: 'checkbox', id: 'motion-toggle', 'data-action': 'motion' }), ' Scene animation'),
      h('label', { class: 'toggle' }, ' Layout ', h('select', { id: 'format-select', 'data-action': 'format', 'aria-label': 'Layout' },
        h('option', { value: 'auto', text: 'Auto' }), h('option', { value: 'desktop', text: 'Desktop' }), h('option', { value: 'mobile', text: 'Mobile' }))),
      h('span', { id: 'quality-note', class: 'quality-note' }),
      h('button', { type: 'button', id: 'restart-btn', 'data-action': 'restart', text: 'Restart' }))
  );
}

export function updateHud(v) {
  const $ = (id) => document.getElementById(id);
  if (!v.sim) return;
  setText($('hud-distance'), fmtM(v.draw ? v.draw.x : v.sim.x));
  setText($('hud-speed'), formatSpeed(v.sim.speedMps, v.config));
  const e = Math.round(v.sim.energy);
  setText($('hud-energy'), `${e} (${Math.round((v.sim.energy / (v.config.initialEnergy + v.config.superBoostEnergy)) * 100)}% of max)`);
  setText($('hud-score'), `${v.score} / ${v.roundCount}`);
  setText($('hud-rounds'), String(v.completedRoundIds.length));
  setText($('hud-attempts'), String(v.attempts));
  const a = v.assistance;
  setText($('hud-boosts'), `${v.sim.boosts} left`);
  setText($('hud-assist'), `${a.assistBoosts} assisted boosts${a.assistedLaunch ? ', assisted launch' : ''}`);
  $('assist-toggle').checked = v.assist;
  const mt = $('motion-toggle'); if (mt) mt.checked = sceneAnimationOn();
  const fsel = $('format-select'); if (fsel && !fsel.__init) { fsel.__init = true; const q = typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search).get('format') : null; fsel.value = q === 'mobile' || q === 'desktop' ? q : 'auto'; }
}

const NS = 'http://www.w3.org/2000/svg';
const mk = (t, a, text) => {
  const n = document.createElementNS(NS, t);
  for (const [k, val] of Object.entries(a || {})) n.setAttribute(k, String(val));
  if (text !== undefined) n.textContent = text;
  return n;
};
const grp = (attrs, ...kids) => { const g = mk('g', attrs); for (const k of kids.flat()) g.append(k); return g; };

// Scene geometry (viewBox height 400; the width adapts to the window, FR-045). PX_PER_M scrolls the road with distance.
const SCENE = { w: 700, h: 400, roadY: 346, groundPx: 368, charX: 230, pxPerM: 1.6, charScale: 1.7, devScale: 0.9, liftAt: 150 };

// Roadside landmarks. Slots 1-7 are generic network scenery that is deliberately NOT the item in
// the matching round and carries no layer number or name (FR-029: never hint an answer). Slot 8 is
// the informal Layer 8 committee tower. Each is drawn with its bottom-centre at the origin.
function landmark(slot) {
  const k = [];
  const st = { stroke: '#111', 'stroke-width': 2 };
  if (slot === 0) { // road gap: no device to bounce off here
    k.push(mk('ellipse', { cx: 0, cy: 2, rx: 46, ry: 9, fill: '#1b1d22' }), mk('ellipse', { cx: 0, cy: 0, rx: 40, ry: 6, fill: '#0b0c0f' }),
      mk('path', { d: 'M-58 0 l7 -22 l7 22 Z M44 0 l7 -22 l7 22 Z', fill: '#ff8a1f', stroke: '#111', 'stroke-width': 2 }));
  } else if (slot === 1) { // equipment rack
    k.push(mk('rect', { x: -26, y: -70, width: 52, height: 70, rx: 3, fill: '#3b4252', ...st }));
    for (let i = 0; i < 4; i++) k.push(mk('rect', { x: -21, y: -64 + i * 16, width: 42, height: 11, fill: '#5b657a' }), mk('circle', { cx: 15, cy: -58 + i * 16, r: 2, fill: '#3fe06b' }));
  } else if (slot === 2) { // wall access point on a pole
    k.push(mk('rect', { x: -3, y: -60, width: 6, height: 60, fill: '#777', ...st }), mk('ellipse', { cx: 0, cy: -66, rx: 26, ry: 9, fill: '#f2f4f8', ...st }),
      mk('path', { d: 'M-14 -84 a20 20 0 0 1 28 0 M-22 -94 a32 32 0 0 1 44 0', stroke: '#58a6ff', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));
  } else if (slot === 3) { // radio mast
    k.push(mk('path', { d: 'M-18 0 L0 -96 L18 0 M-12 -28 H12 M-8 -52 H8 M-4 -74 H4', stroke: '#c8452f', 'stroke-width': 4, fill: 'none' }), mk('circle', { cx: 0, cy: -98, r: 5, fill: '#ffd23f', ...st }));
  } else if (slot === 4) { // cloud on a stand
    k.push(mk('rect', { x: -3, y: -26, width: 6, height: 26, fill: '#777', ...st }), mk('ellipse', { cx: 0, cy: -48, rx: 36, ry: 16, fill: '#fff', ...st }), mk('ellipse', { cx: -14, cy: -58, rx: 18, ry: 14, fill: '#fff', ...st }), mk('ellipse', { cx: 12, cy: -62, rx: 20, ry: 15, fill: '#fff', ...st }), mk('ellipse', { cx: 0, cy: -50, rx: 30, ry: 11, fill: '#fff' }));
  } else if (slot === 5) { // satellite dish
    k.push(mk('rect', { x: -3, y: -30, width: 6, height: 30, fill: '#777', ...st }), mk('path', { d: 'M-34 -62 Q-6 -20 28 -56 Z', fill: '#dfe5ee', ...st }), mk('line', { x1: -4, y1: -44, x2: 14, y2: -74, stroke: '#111', 'stroke-width': 3 }), mk('circle', { cx: 15, cy: -76, r: 4, fill: '#c8452f', ...st }));
  } else if (slot === 6) { // patch panel on a wall
    k.push(mk('rect', { x: -44, y: -40, width: 88, height: 40, rx: 3, fill: '#8a8f99', ...st }));
    for (let i = 0; i < 8; i++) k.push(mk('rect', { x: -38 + i * 10, y: -32, width: 7, height: 7, fill: '#222' }), mk('rect', { x: -38 + i * 10, y: -20, width: 7, height: 7, fill: '#222' }));
  } else if (slot === 7) { // data-center building
    k.push(mk('rect', { x: -48, y: -56, width: 96, height: 56, fill: '#6f8fb8', ...st }), mk('rect', { x: -52, y: -62, width: 104, height: 8, fill: '#44546a', ...st }),
      mk('rect', { x: -9, y: -30, width: 18, height: 30, fill: '#2b3550' }));
    for (let i = 0; i < 3; i++) k.push(mk('rect', { x: -40 + i * 27, y: -46, width: 18, height: 10, fill: '#cfe9ff' }));
  } else { // slot 8: Layer 8 committee tower (informal, not OSI)
    k.push(mk('rect', { x: -34, y: -110, width: 68, height: 110, fill: '#6d6f7a', ...st }), mk('path', { d: 'M-42 -110 H42 L0 -136 Z', fill: '#9a3b3b', ...st }));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) k.push(mk('rect', { x: -26 + c * 20, y: -98 + r * 22, width: 12, height: 14, fill: '#f3e08a' }));
    k.push(mk('rect', { x: -9, y: -18, width: 18, height: 18, fill: '#3a2a1a' }),
      mk('text', { x: 0, y: 14, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#fff', stroke: '#123', 'stroke-width': 3, 'paint-order': 'stroke' }, 'Layer 8'));
  }
  return grp({ class: 'landmark' }, k);
}

// Catalyst 6500 as an angry bull (FR-052): chassis body, horns, arms, legs, an emoting face and steam.
// Origin = the ground under its feet; it faces right. Animated by updateBull().
function launcher() {
  const ink = '#0a1d35';
  const limb = (id, x, y, w, h, fill) => grp({ id, transform: `translate(${x} ${y})` }, mk('rect', { x: -w / 2, y: 0, width: w, height: h, rx: 3, fill, stroke: ink, 'stroke-width': 2.2 }));
  const legF = limb('bull-legF', 15, -40, 11, 36, '#16427a'); legF.append(mk('rect', { x: -7, y: 32, width: 20, height: 8, rx: 3, fill: '#0d2b50', stroke: ink, 'stroke-width': 2 }));
  const legB = limb('bull-legB', -15, -40, 11, 36, '#16427a'); legB.append(mk('rect', { x: -7, y: 32, width: 20, height: 8, rx: 3, fill: '#0d2b50', stroke: ink, 'stroke-width': 2 }));
  const armF = limb('bull-armF', 31, -70, 9, 32, '#c9d2e0'); armF.append(mk('circle', { cx: 0, cy: 34, r: 7, fill: '#e6ebf3', stroke: ink, 'stroke-width': 2 }));
  const armB = limb('bull-armB', -31, -70, 9, 32, '#c9d2e0'); armB.append(mk('circle', { cx: 0, cy: 34, r: 7, fill: '#e6ebf3', stroke: ink, 'stroke-width': 2 }));
  const chassis = [mk('rect', { x: -32, y: -96, width: 64, height: 64, rx: 6, fill: '#1c4f8f', stroke: ink, 'stroke-width': 3 })];
  for (let i = 0; i < 2; i++) chassis.push(mk('rect', { x: -26, y: -52 + i * 9, width: 52, height: 6, fill: '#0d2b50' }));
  for (let j = 0; j < 8; j++) chassis.push(mk('rect', { x: -23 + j * 6.2, y: -51, width: 3.6, height: 3.6, fill: j % 3 ? '#7fb4f0' : '#3fe06b' }));
  const horn = (s) => mk('path', { d: `M${s * 22} -94 Q${s * 40} -98 ${s * 38} -118 Q${s * 28} -104 ${s * 12} -94 Z`, fill: '#f2e6c4', stroke: ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
  const eye = (side) => { const id = side < 0 ? 'L' : 'R'; return [
    mk('ellipse', { id: `bull-eye-${id}`, cx: side * 10, cy: -79, rx: 6.5, ry: 5.5, fill: '#fff', stroke: ink, 'stroke-width': 1.8 }),
    mk('circle', { id: `bull-pupil-${id}`, cx: side * 10 + 1.5, cy: -79, r: 2.6, fill: '#2b3550' }),
    mk('path', { id: `bull-brow-${id}`, d: '', stroke: ink, 'stroke-width': 3.6, 'stroke-linecap': 'round', fill: 'none' })]; };
  const face = grp({ id: 'bull-face' }, mk('rect', { x: -22, y: -91, width: 44, height: 36, rx: 8, fill: '#2f72c4', stroke: ink, 'stroke-width': 2 }), ...eye(-1), ...eye(1),
    mk('ellipse', { cx: -5, cy: -67, rx: 2, ry: 2.6, fill: ink }), mk('ellipse', { cx: 5, cy: -67, rx: 2, ry: 2.6, fill: ink }),
    mk('path', { id: 'bull-mouth', d: '', stroke: ink, 'stroke-width': 2.4, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  const steam = grp({ id: 'bull-steam' }); for (let i = 0; i < 3; i++) steam.append(mk('circle', { id: `bull-steam-${i}`, cx: 0, cy: 0, r: 7, fill: '#fff', opacity: 0, stroke: '#cfd8e6', 'stroke-width': 1.5 }));
  const body = grp({ id: 'bull-body' }, legB, armB, grp({}, ...chassis), horn(-1), horn(1), face, mk('text', { x: 0, y: -37, 'text-anchor': 'middle', 'font-size': 7.5, 'font-weight': 800, fill: '#cfe9ff' }, 'Catalyst 6500'), legF, armF);
  return grp({ id: 'launcher' }, body, steam);
}

const BULL_FACES = {
  angry: { browL: 'M-17 -90 L-4 -84', browR: 'M4 -84 L17 -90', ry: 5.5, pupil: '#2b3550', mouth: 'M-11 -62 L-7 -65 L-3 -62 L1 -65 L5 -62 L9 -65 L12 -62', fill: 'none', lookY: 0 },
  furious: { browL: 'M-18 -93 L-2 -82', browR: 'M2 -82 L18 -93', ry: 3.6, pupil: '#c40000', mouth: 'M-12 -64 Q0 -52 12 -64 Z', fill: '#fff', lookY: 0 },
  smug: { browL: 'M-17 -86 L-4 -86', browR: 'M4 -89 L17 -93', ry: 3.8, pupil: '#2b3550', mouth: 'M-9 -63 Q3 -58 12 -68', fill: 'none', lookY: 1 }
};
const bullFace = { key: '' };
function applyBullFace(name) {
  if (bullFace.key === name) return; bullFace.key = name;
  const $ = (id) => document.getElementById(id); const f = BULL_FACES[name] || BULL_FACES.angry;
  for (const id of ['L', 'R']) { const e = $(`bull-eye-${id}`); if (!e) return; e.setAttribute('ry', f.ry); const p = $(`bull-pupil-${id}`); p.setAttribute('fill', f.pupil); p.setAttribute('cy', -79 + f.lookY); $(`bull-brow-${id}`).setAttribute('d', id === 'L' ? f.browL : f.browR); }
  const m = $('bull-mouth'); m.setAttribute('d', f.mouth); m.setAttribute('fill', f.fill);
}

// Angry-bull behaviour: paws and snorts while the player aims, winds up and charges when the launch is locked,
// rams the plug, then stands smug (FR-052). Returns the screen x of the bull, or null when it is hidden.
function updateBull(v, now, still, d) {
  const sc = SCENE; const $ = (id) => document.getElementById(id);
  const impactMs = v.config.launch.impactMs; const lm = v.launchMs;
  const hitX = chX() - 70; const idleX = Math.max(74, chX() - 210);
  const launching = v.phase === 'launching' && !v.aim.relaunch; const before = v.phase === 'briefing' || v.phase === 'aim-power' || v.phase === 'aim-angle' || launching;
  const afterHit = !before && v.sim.answersCorrect >= 0 && lm >= impactMs;
  let x = null; let mode = 'idle';
  if (before) {
    if (launching) {
      const t = Math.min(1, lm / impactMs); const wind = 0.3;
      if (t < wind) { x = idleX; mode = 'windup'; } else { const u = (t - wind) / (1 - wind); x = idleX + (hitX - idleX) * u * u; mode = 'charge'; }
    } else x = idleX;
  } else if (afterHit && !still && v.sim.phase !== 'glide') { x = chX() + ((hitX - chX()) / sc.pxPerM - d) * sc.pxPerM; mode = 'smug'; }
  const g = $('launcher-wrap');
  if (x === null || x < -120 || (still && mode !== 'idle')) { g.setAttribute('visibility', 'hidden'); return null; }
  g.setAttribute('visibility', 'visible'); g.setAttribute('transform', `translate(${x.toFixed(1)} ${sc.groundPx}) scale(1.05)`);
  const t = still ? 0 : now;
  const set = (id, tr) => $(id).setAttribute('transform', tr);
  let lean = 0; let legF = 0; let legB = 0; let armF = 0; let armB = 0; let bob = 0; let steam = 0; let steamDir = 1;
  if (mode === 'idle') {
    bob = Math.sin(t / 330) * 1.2; lean = 2 + Math.sin(t / 330) * 1.2; steam = 0.7;
    const cyc = (t % 1100) / 1100; legF = cyc < 0.35 ? -40 * Math.sin((cyc / 0.35) * Math.PI) : 0; // paws the ground
    armF = 10 + Math.sin(t / 330) * 5; armB = -10;
  } else if (mode === 'windup') {
    bob = 3; lean = -7; legF = -35 * Math.abs(Math.sin(t / 70)); armF = 40; armB = 30; steam = 1; steamDir = 1;
  } else if (mode === 'charge') {
    lean = 12; legF = Math.sin(t / 55) * 55; legB = -Math.sin(t / 55) * 55; armF = -70; armB = -60; bob = Math.abs(Math.sin(t / 55)) * -3; steam = 1; steamDir = -1;
  } else { lean = 1; bob = Math.sin(t / 500) * 0.8; armF = 25; armB = -25; steam = 0; }
  set('bull-body', `translate(0 ${bob.toFixed(1)}) rotate(${lean.toFixed(1)} 0 -4)`);
  set('bull-legF', `translate(15 -40) rotate(${legF.toFixed(1)})`); set('bull-legB', `translate(-15 -40) rotate(${legB.toFixed(1)})`);
  set('bull-armF', `translate(31 -70) rotate(${armF.toFixed(1)})`); set('bull-armB', `translate(-31 -70) rotate(${armB.toFixed(1)})`);
  for (let i = 0; i < 3; i++) {
    const c = $(`bull-steam-${i}`); const ph = ((t / 700 + i / 3) % 1);
    const sx = steamDir > 0 ? 8 + ph * 26 : -34 - ph * 34; const sy = -66 - ph * 24;
    c.setAttribute('cx', sx.toFixed(1)); c.setAttribute('cy', sy.toFixed(1)); c.setAttribute('r', (4 + ph * 8).toFixed(1)); c.setAttribute('opacity', (steam * (1 - ph) * 0.85).toFixed(2));
  }
  applyBullFace(mode === 'charge' || mode === 'windup' ? 'furious' : mode === 'smug' ? 'smug' : 'angry');
  return x;
}

// The flying "character": an RJ45 plug. Local origin = center of gravity. The face (eyes with sclera,
// pupils, lids and brows, plus a mouth) is redrawn by applyFace() to show emotion (FR-042).
const EYE = { rx: 4.6, ry: 6, ex: 6.2, ey: -2 };
const face = { key: '' };
function plug() {
  face.key = ''; // a rebuilt stage has a fresh neutral face: redraw the current emotion
  const body = '#cfe9ff'; const ink = '#1b2b44';
  const eye = (side) => {
    const cx = side * EYE.ex; const id = side < 0 ? 'L' : 'R';
    return [
      mk('clipPath', { id: `eye-clip-${id}` }, undefined),
      mk('ellipse', { id: `eye-${id}`, cx, cy: EYE.ey, rx: EYE.rx, ry: EYE.ry, fill: '#fff', stroke: ink, 'stroke-width': 1.5 }),
      mk('circle', { id: `pupil-${id}`, cx, cy: EYE.ey, r: 2.6, fill: '#2b3550' }),
      mk('circle', { id: `glint-${id}`, cx: cx + 0.8, cy: EYE.ey - 1.4, r: 0.9, fill: '#fff' }),
      mk('rect', { id: `lid-${id}`, x: cx - EYE.rx - 1, y: EYE.ey - EYE.ry - 1, width: EYE.rx * 2 + 2, height: 0, fill: body, 'clip-path': `url(#eye-clip-${id})` }),
      mk('rect', { id: `lower-${id}`, x: cx - EYE.rx - 1, y: EYE.ey + EYE.ry + 1, width: EYE.rx * 2 + 2, height: 0, fill: body, 'clip-path': `url(#eye-clip-${id})` }),
      mk('path', { id: `brow-${id}`, d: `M${cx - 4} ${EYE.ey - 10} L${cx + 4} ${EYE.ey - 10}`, stroke: ink, 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none' })
    ];
  };
  const [clipL, ...restL] = eye(-1); const [clipR, ...restR] = eye(1);
  clipL.append(mk('ellipse', { cx: -EYE.ex, cy: EYE.ey, rx: EYE.rx, ry: EYE.ry })); clipR.append(mk('ellipse', { cx: EYE.ex, cy: EYE.ey, rx: EYE.rx, ry: EYE.ry }));
  // Side view of an RJ45 plug. Local origin = center of gravity; the front (gold head) points right.
  const pins = []; for (let i = 0; i < 8; i++) pins.push(mk('rect', { x: 9.4, y: -10.3 + i * 2.65, width: 12.2, height: 1.9, rx: 0.6, fill: i % 2 ? '#ffe9a0' : '#ffc83a' }));
  return grp({ id: 'char-spin' },
    // cable boot at the rear (the tail attaches here)
    mk('rect', { x: -23, y: -9.5, width: 8.5, height: 19, rx: 3, fill: '#2a6fd1', stroke: ink, 'stroke-width': 2 }),
    mk('path', { d: 'M-20 -9 V9 M-17.5 -9 V9', stroke: '#14304f', 'stroke-width': 1.2 }),
    // clear plastic housing
    mk('rect', { x: -15, y: -15, width: 23, height: 30, rx: 4, fill: body, stroke: ink, 'stroke-width': 2.4 }),
    // latch tab: hinged at the front of the housing, sloping up and back along the top (front is right)
    mk('path', { d: 'M8 -15 L-10 -22.5 L-15 -22.5 L-15 -19.5 L-9.5 -19.2 L6.5 -12.5 Z', fill: body, stroke: ink, 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    mk('path', { d: 'M-12 -22.5 V-19.4 M-9.5 -21.6 V-19.2', stroke: ink, 'stroke-width': 1 }),
    // gold contact head with 8 pins
    mk('rect', { x: 8, y: -11.5, width: 15, height: 23, rx: 1.5, fill: '#8f6a14', stroke: ink, 'stroke-width': 2 }),
    mk('rect', { x: 6.6, y: -13.5, width: 2.4, height: 27, rx: 1, fill: '#e8c25a', stroke: ink, 'stroke-width': 1.4 }),
    ...pins,
    grp({ transform: 'translate(-3.5 0)' }, clipL, clipR, ...restL, ...restR,
      mk('circle', { id: 'cheek-L', cx: -11, cy: 6, r: 2.6, fill: '#ff8fa3', opacity: 0 }), mk('circle', { id: 'cheek-R', cx: 11, cy: 6, r: 2.6, fill: '#ff8fa3', opacity: 0 }),
      mk('path', { id: 'mouth', d: 'M-4.5 9 Q0 10.5 4.5 9', stroke: ink, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }),
      mk('path', { id: 'tear', d: 'M-9 4 q-2 3.2 0 5 q2 -1.8 0 -5 Z', fill: '#58a6ff', stroke: ink, 'stroke-width': 0.7, opacity: 0 })));
}

// Emotion table: lid = share of the eye covered from the top, lower = from the bottom, brow = [y offset, tilt degrees],
// look = pupil offset bias, size = eye scale, mouth = path.
const FACES = {
  neutral: { lid: 0.08, lower: 0, brow: [0, 0], size: 1, mouth: 'M-4.5 9 Q0 10.5 4.5 9', fill: 'none', cheek: 0, tear: 0, lookY: 0 },
  worried: { lid: 0, lower: 0, brow: [-1.5, 14], size: 1.12, mouth: 'M-2.5 9 Q0 13 2.5 9 Q0 6.5 -2.5 9 Z', fill: '#7a2e3a', cheek: 0, tear: 0, lookY: 0 },
  happy: { lid: 0.12, lower: 0.38, brow: [-2.5, -4], size: 1, mouth: 'M-6 6.5 Q0 15 6 6.5 Q0 8.5 -6 6.5 Z', fill: '#fff', cheek: 0.85, tear: 0, lookY: -0.4 },
  sad: { lid: 0.38, lower: 0, brow: [1, 16], size: 1, mouth: 'M-5 12 Q0 6.5 5 12', fill: 'none', cheek: 0, tear: 1, lookY: 1.4 }
};
function applyFace(emotion, lookX, lookY, blink) {
  const $ = (id) => document.getElementById(id);
  const f = FACES[emotion] || FACES.neutral;
  const lx = Math.round(lookX * 4) / 4; const ly = Math.round((lookY + f.lookY) * 4) / 4; const bl = blink ? 1 : 0;
  const key = `${emotion}|${lx}|${ly}|${bl}`;
  if (face.key === key) return; face.key = key;
  for (const side of [-1, 1]) {
    const id = side < 0 ? 'L' : 'R'; const cx = side * EYE.ex; const ry = EYE.ry * f.size; const rx = EYE.rx * f.size;
    const e = $(`eye-${id}`); if (!e) return;
    e.setAttribute('rx', rx); e.setAttribute('ry', ry);
    const pupil = $(`pupil-${id}`); pupil.setAttribute('cx', cx + lx * 1.3); pupil.setAttribute('cy', EYE.ey + ly * 1.4); pupil.setAttribute('r', emotion === 'worried' ? 2.2 : 2.6);
    $(`glint-${id}`).setAttribute('cx', cx + 1 + lx * 1.2); $(`glint-${id}`).setAttribute('cy', EYE.ey - 1.5 + ly * 1.2);
    const lid = $(`lid-${id}`); lid.setAttribute('y', EYE.ey - ry - 1); lid.setAttribute('height', bl ? 2 * ry + 2 : f.lid * 2 * ry + 1);
    const low = $(`lower-${id}`); const lh = f.lower * 2 * ry; low.setAttribute('y', EYE.ey + ry + 1 - lh); low.setAttribute('height', lh);
    const brow = $(`brow-${id}`); // positive tilt = inner ends raised (worried, sad)
    const by = EYE.ey - 10 + f.brow[0]; const dy = Math.tan((f.brow[1] * Math.PI) / 180) * 4;
    brow.setAttribute('d', `M${cx - 4} ${by + (side < 0 ? dy : -dy)} L${cx + 4} ${by + (side < 0 ? -dy : dy)}`);
    $(`cheek-${id}`).setAttribute('opacity', f.cheek);
  }
  const m = $('mouth'); m.setAttribute('d', f.mouth); m.setAttribute('fill', f.fill);
  $('tear').setAttribute('opacity', f.tear);
}

// The scene fills the window below the title bar: its viewBox width follows the window shape.
const view = { w: 700, h: 400, vy: 0 };
function measure() {
  const m = typeof document !== 'undefined' ? document.getElementById('main') : null;
  if (m && m.clientWidth && m.clientHeight) { const z = sceneSize(m.clientWidth, m.clientHeight, SCENE.h); view.w = z.w; view.h = z.h; view.vy = z.vy; }
  return view.w;
}
const viewBox = () => `0 ${view.vy} ${view.w} ${view.h}`;
const chX = () => Math.round(view.w * (view.h > SCENE.h ? 0.42 : 0.3));
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('resize', () => { measure(); const svg = document.getElementById('scene-svg'); if (svg) svg.setAttribute('viewBox', viewBox()); });
}

function treeRow(tile, y, rx, ry, c1, c2, step) {
  const g = grp({});
  for (let t = 0; t < 5; t++) for (let x = 0; x < tile; x += step) {
    const cx = t * tile + x + step / 2;
    g.append(mk('ellipse', { cx, cy: y, rx, ry, fill: c1 }), mk('ellipse', { cx: cx - rx * 0.25, cy: y - ry * 0.25, rx: rx * 0.6, ry: ry * 0.6, fill: c2 }));
  }
  return g;
}


// Boost power-up: a gold orb with a lightning bolt (FR-047).
function pickupArt() {
  return grp({}, mk('circle', { cx: 0, cy: 0, r: 17, fill: '#ffd23f', opacity: 0.3 }), mk('circle', { cx: 0, cy: 0, r: 12, fill: '#ffd23f', stroke: '#7a5a00', 'stroke-width': 2.5 }),
    mk('path', { d: 'M2 -9 L-5 1.5 H0 L-2 9 L6 -2 H1 Z', fill: '#fff', stroke: '#7a5a00', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }));
}

// ---- Analog dials drawn inside the scene, far right (FR-036, FR-043) ----
const DIAL = { cx: 620, cy: 262, r: 56 };
const dpt = (t, rad) => { const a = Math.PI * (1 - t); return [(rad * Math.cos(a)).toFixed(2), (-rad * Math.sin(a)).toFixed(2)]; };
const darc = (t0, t1, rad) => { const [x0, y0] = dpt(t0, rad); const [x1, y1] = dpt(t1, rad); return `M${x0} ${y0} A${rad} ${rad} 0 0 1 ${x1} ${y1}`; };
function dial(id, label, action, zones, ticks, labels) {
  const g = grp({ id: `dial-${id}`, class: 'dial', 'data-action': action, visibility: 'hidden', transform: `translate(${DIAL.cx} ${DIAL.cy})` });
  g.append(mk('rect', { x: -76, y: -86, width: 152, height: 128, rx: 14, fill: '#f4f7fb', stroke: '#0b1a2e', 'stroke-width': 3, opacity: 0.94 }),
    mk('text', { x: 0, y: -68, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 900, fill: '#0b1a2e', 'font-family': 'Arial Black, Impact, sans-serif' }, label));
  for (const [t0, t1, col] of zones) g.append(mk('path', { d: darc(t0, t1, DIAL.r - 6), stroke: col, 'stroke-width': 11, fill: 'none' }));
  g.append(mk('path', { d: darc(0, 1, DIAL.r + 1), stroke: '#0b1a2e', 'stroke-width': 3, fill: 'none' }));
  for (const t of ticks) { const [x0, y0] = dpt(t, DIAL.r - 12); const [x1, y1] = dpt(t, DIAL.r + 1); g.append(mk('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke: '#0b1a2e', 'stroke-width': 2 })); }
  for (const [t, txt] of labels) { const [x, y] = dpt(t, DIAL.r - 21); g.append(mk('text', { x, y: +y + 4, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 800, fill: '#0b1a2e' }, txt)); }
  g.append(grp({ id: `dial-${id}-needle` }, mk('line', { x1: 0, y1: 0, x2: 0, y2: -(DIAL.r - 4), stroke: '#c40000', 'stroke-width': 4, 'stroke-linecap': 'round' })),
    mk('circle', { cx: 0, cy: 0, r: 6, fill: '#0b1a2e' }),
    mk('text', { id: `dial-${id}-val`, x: 0, y: 24, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 900, fill: '#0b1a2e', 'font-family': 'Arial Black, Impact, sans-serif' }, ''),
    mk('text', { id: `dial-${id}-sub`, x: 0, y: 38, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 700, fill: '#33405a' }, ''));
  return g;
}
function dials(config) {
  const gq = (1 - config.boost.goodQuality) / 2; const lo = 0.5 - gq; const hi = 0.5 + gq;
  const span = config.physics.angleMaxDeg - config.physics.angleMinDeg;
  const angleTicks = []; for (let d = 10; d <= 80; d += 10) angleTicks.push((d - config.physics.angleMinDeg) / span);
  return grp({ id: 'dials' },
    dial('power', 'POWER', 'lock', [[0, 0.5, '#3ea84f'], [0.5, 0.8, '#f2b134'], [0.8, 1, '#e5483f']], [0, 0.25, 0.5, 0.75, 1], [[0.04, 'LOW'], [0.96, 'HIGH']]),
    dial('angle', 'ANGLE', 'lock', [[0, 1, '#9cc9f7']], angleTicks, [[0, `${config.physics.angleMinDeg}\u00B0`], [(45 - config.physics.angleMinDeg) / span, '45\u00B0'], [1, `${config.physics.angleMaxDeg}\u00B0`]]),
    dial('boost', 'BOOST', 'boost', [[0, lo, '#e5483f'], [lo, hi, '#3ea84f'], [hi, 1, '#e5483f']], [0, lo, 0.5, hi, 1], [[0.5, 'BEST']]));
}

function stage(v) {
  const sc = SCENE; const config = v.config;
  if (typeof ResizeObserver !== 'undefined' && typeof document !== 'undefined') { const m = document.getElementById('main'); if (m && !m.__ro) { m.__ro = new ResizeObserver(() => syncView()); m.__ro.observe(m); } }
  measure();
  const svg = mk('svg', { id: 'scene-svg', viewBox: viewBox(), role: 'img', preserveAspectRatio: 'xMidYMax meet', 'aria-label': 'Side-scrolling road scene. A network cable plug is launched by a Catalyst 6500 and bounces off network devices standing along the road.' });
  const cloud = (x, y, s) => grp({ transform: `translate(${x} ${y}) scale(${s})` }, mk('ellipse', { cx: 0, cy: 0, rx: 50, ry: 16, fill: '#fff', opacity: 0.92 }), mk('ellipse', { cx: -18, cy: -10, rx: 24, ry: 16, fill: '#fff', opacity: 0.92 }), mk('ellipse', { cx: 14, cy: -13, rx: 28, ry: 18, fill: '#fff', opacity: 0.92 }));
  const clouds = grp({ id: 'ly-clouds' });
  for (let t = 0; t < 4; t++) clouds.append(cloud(t * 700 + 160, 70, 1.2), cloud(t * 700 + 470, 120, 0.9), cloud(t * 700 + 640, 50, 0.7), cloud(t * 700 + 90, -60, 1.1), cloud(t * 700 + 380, -170, 1.3), cloud(t * 700 + 560, -290, 0.9), cloud(t * 700 + 250, -400, 1.2));
  const far = grp({ id: 'ly-far' }, treeRow(350, 270, 36, 62, '#3f8f3f', '#5fae55', 70));
  const near = grp({ id: 'ly-near' }, treeRow(350, 318, 30, 34, '#2f7a34', '#4f9a47', 46));
  const road = grp({ id: 'ly-road' });
  road.append(mk('rect', { x: 0, y: sc.roadY - 14, width: 4000, height: 14, fill: '#d9dde3' }), mk('rect', { x: 0, y: sc.roadY, width: 4000, height: sc.h - sc.roadY + 400, fill: '#6c727c' }));
  const lines = grp({ id: 'ly-lines' });
  for (let i = 0; i < 40; i++) lines.append(mk('rect', { x: i * 70, y: sc.roadY + 28, width: 36, height: 5, fill: '#e9edf2' }), mk('rect', { x: i * 70, y: sc.roadY - 14, width: 6, height: 14, fill: '#9aa1ad' }));
  const marks = grp({ id: 'ly-landmarks' });
  for (let n = 0; n < 10; n++) marks.append(grp({ 'data-slot': n, visibility: 'hidden' }));
  marks.append(grp({ id: 'tower', visibility: 'hidden' }, landmark(8)));
  const picks = grp({ id: 'pickups' }); for (let n = 0; n < 8; n++) picks.append(grp({ 'data-slot': n, visibility: 'hidden' }, pickupArt()));
  picks.append(mk('circle', { id: 'burst', cx: 0, cy: 0, r: 10, fill: 'none', stroke: '#ffd23f', 'stroke-width': 5, visibility: 'hidden' }));
  const ground = grp({ id: 'ground' }, road, grp({ id: 'ly-lines-wrap' }, lines), marks, picks, grp({ id: 'launcher-wrap', visibility: 'hidden' }, launcher()));
  const aim = grp({ id: 'aim', visibility: 'hidden' },
    mk('line', { id: 'aim-line', x1: 34, y1: 0, x2: 120, y2: 0, stroke: '#ff5a4d', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '2 9' }),
    mk('path', { id: 'aim-head', d: 'M0 -9 L18 0 L0 9 Z', fill: '#ff5a4d', transform: 'translate(120 0)' }));
  const tail = grp({ id: 'tail' }, mk('path', { id: 'tail-out', d: '', stroke: '#14304f', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), mk('path', { id: 'tail-line', d: '', stroke: '#2a7de1', 'stroke-width': 5.5, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), mk('rect', { id: 'tail-end', x: -4, y: -6, width: 8, height: 12, rx: 2, fill: '#d4a82a', stroke: '#1b2b44', 'stroke-width': 1.6 }));
  const char = grp({ id: 'character' }, grp({ id: 'char-pos' }, grp({ id: 'char-squash' }, plug())));
  const streaks = grp({ id: 'streaks', opacity: 0 });
  for (let i = 0; i < 5; i++) streaks.append(mk('line', { x1: chX() - 150 - i * 20, y1: 90 + i * 22, x2: chX() - 40 - i * 8, y2: 90 + i * 22, stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.7 }));
  svg.append(clouds, far, near, ground, streaks, aim, tail, char, dials(config));

  const hud = h('div', { class: 'stage-hud', 'aria-hidden': 'true' },
    h('div', { class: 'hud-tl' },
      h('div', { class: 'hud-big red', text: 'ENERGY' }),
      h('div', { class: 'ebar' }, h('div', { id: 'ov-energy-fill', class: 'ebar-fill' })),
      h('div', { id: 'ov-energy-pct', class: 'hud-small blue' })),
    h('div', { class: 'hud-tr' },
      h('div', { class: 'hud-line' }, h('span', { class: 'hud-lbl', text: 'DISTANCE' }), h('span', { id: 'ov-distance', class: 'hud-num' })),
      h('div', { class: 'hud-line' }, h('span', { class: 'hud-lbl red', text: 'BOUNCES' }), h('span', { id: 'ov-next', class: 'hud-num red' })),
      h('div', { class: 'hud-line' }, h('span', { class: 'hud-lbl', text: 'SPEED' }), h('span', { id: 'ov-speed', class: 'hud-num sm' }))));

  // One action button above the dial: Lock while aiming, Boost while flying (FR-051).
  const aiming = v.phase === 'aim-power' || v.phase === 'aim-angle';
  const flying = v.phase === 'flying' || v.phase === 'glide';
  const action = aiming ? h('button', { type: 'button', id: 'lock-btn', class: 'action', 'data-action': 'lock', text: 'Lock' })
    : flying ? h('button', { type: 'button', id: 'boost-btn', class: 'action', 'data-action': 'boost', text: 'Boost' }) : '';
  return h('div', { class: 'stage', id: 'stage', 'data-mood': v.mood || '' },
    h('div', { class: 'scene' }, svg, hud), action,
    h('p', { id: 'stage-text', class: 'sr-only' }),
    h('p', { id: 'motion-note', class: 'note' }),
    h('p', { id: 'mood', class: 'mood', 'aria-hidden': 'true' }));
}

// Scene animation is ON by default (owner decision, constitution v1.2.0); the player can turn it off.
const motion = { override: true };
function systemReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export function systemPrefersReducedMotion() { return systemReducedMotion(); }
export function sceneAnimationOn() { return motion.override; }
export function setSceneAnimation(on) {
  motion.override = Boolean(on);
  if (typeof document !== 'undefined' && document.documentElement && document.documentElement.classList) {
    document.documentElement.classList.toggle('anim-on', motion.override);
    document.documentElement.classList.toggle('anim-off', !motion.override);
  }
}
const reducedMotion = () => !sceneAnimationOn();

const vis = { bounceSeq: 0, boostSeq: 0, pickupSeq: 0, burst: null, emo: 'neutral', emoUntil: 0, glideT0: null, glideX0: 0 };
const GLIDE_M_PER_S = 160; // cosmetic scroll speed in the victory glide (real speed would be a blur)
const AIMING = ['briefing', 'aim-power', 'aim-angle', 'launching'];

function syncView() {
  const before = view.w; measure();
  const svg = document.getElementById('scene-svg');
  if (svg && (view.w !== before || svg.__w !== view.w)) { svg.__w = view.w; svg.setAttribute('viewBox', `0 0 ${view.w} ${SCENE.h}`); }
}
let frameNo = 0;

function updateScene(v) {
  const sc = SCENE;
  if (frameNo++ % 20 === 0) syncView();
  const $ = (id) => document.getElementById(id);
  if (!$('ly-far')) return;
  const still = reducedMotion();
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  const s = v.sim;
  const glide = s.phase === 'glide';
  const live = v.draw || { x: s.x, y: s.y };
  if (glide && vis.glideT0 === null) { vis.glideT0 = now; vis.glideX0 = live.x; }
  if (!glide) vis.glideT0 = null;
  const d = still ? 0 : glide ? vis.glideX0 + ((now - vis.glideT0) / 1000) * GLIDE_M_PER_S : live.x;
  const yPx = still ? v.config.physics.bodyHalfH * sc.pxPerM : glide ? 190 + Math.sin(now / 420) * 14 : live.y * sc.pxPerM;
  const camY = Math.max(0, yPx - (view.h > sc.h ? view.h * 0.55 : sc.liftAt));
  const off = (f, tile) => -((d * sc.pxPerM * f) % tile);
  $('ly-clouds').setAttribute('transform', `translate(${off(0.15, 700)} ${camY * 0.2})`);
  $('ly-far').setAttribute('transform', `translate(${off(0.35, 350)} ${camY * 0.5})`);
  $('ly-near').setAttribute('transform', `translate(${off(0.6, 350)} ${camY * 0.7})`);
  $('ground').setAttribute('transform', `translate(0 ${camY})`);
  $('ly-lines-wrap').setAttribute('transform', `translate(${off(1, 70)} 0)`);

  // Devices along the road: a pool of 10 slots keyed by device id, redrawn only when the kind changes.
  const marks = $('ly-landmarks');
  const used = new Set();
  if (!glide) {
    let shownStill = false;
    for (const dev of s.devices) {
      const dm = dev.x - live.x;
      if (dm < -(chX() + 140) / sc.pxPerM || dm > (view.w - chX() + 140) / sc.pxPerM) { if (dm > 0) break; continue; }
      if (still && (dm < 0 || shownStill)) continue;
      const slot = dev.id % 10; used.add(slot);
      const g = marks.children[slot];
      if (g.__kind !== dev.kind) { g.textContent = ''; g.append(landmark(dev.kind)); g.__kind = dev.kind; }
      const x = still ? Math.round(view.w * 0.72) : chX() + (dev.x - d) * sc.pxPerM;
      g.setAttribute('transform', `translate(${x} ${sc.groundPx}) scale(${sc.devScale})`);
      g.setAttribute('visibility', 'visible');
      if (still) shownStill = true;
    }
  }
  for (let n = 0; n < 10; n++) if (!used.has(n)) marks.children[n].setAttribute('visibility', 'hidden');
  const tower = $('tower');
  if (glide) {
    const x = chX() + (vis.glideX0 + 260 - d) * sc.pxPerM;
    tower.setAttribute('transform', `translate(${still ? Math.round(view.w * 0.72) : x} ${sc.groundPx}) scale(1.2)`);
    tower.setAttribute('visibility', x < -120 && !still ? 'hidden' : 'visible');
  } else tower.setAttribute('visibility', 'hidden');

  // Boost pickups: bobbing orbs; a burst ring marks a collection (FR-047).
  const picks = $('pickups');
  const usedP = new Set();
  if (!glide) {
    for (const k of s.pickups) {
      const dm = k.x - live.x;
      if (dm < -(chX() + 60) / sc.pxPerM) continue;
      if (dm > (view.w - chX() + 60) / sc.pxPerM) break;
      if (s.taken.includes(k.id)) continue;
      const slot = k.id % 8; usedP.add(slot);
      const g = picks.children[slot];
      const x = still ? Math.round(view.w * 0.6) : chX() + (k.x - d) * sc.pxPerM;
      const y = sc.groundPx - k.y * sc.pxPerM + (still ? 0 : Math.sin(now / 280 + k.id) * 4);
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); g.setAttribute('visibility', 'visible');
    }
  }
  for (let n = 0; n < 8; n++) if (!usedP.has(n)) picks.children[n].setAttribute('visibility', 'hidden');
  if (s.pickupSeq !== vis.pickupSeq) { vis.pickupSeq = s.pickupSeq; if (s.lastPickup) { vis.burst = { x: s.lastPickup.x, y: s.lastPickup.y, t0: now }; vis.emo = 'happy'; vis.emoUntil = now + 1000; } }
  const burst = $('burst'); const age = vis.burst ? now - vis.burst.t0 : 1e9;
  if (age < 450 && !still) { burst.setAttribute('visibility', 'visible'); burst.setAttribute('cx', (chX() + (vis.burst.x - d) * sc.pxPerM).toFixed(1)); burst.setAttribute('cy', (sc.groundPx - vis.burst.y * sc.pxPerM).toFixed(1)); burst.setAttribute('r', 12 + age * 0.12); burst.setAttribute('opacity', (1 - age / 450).toFixed(2)); } else burst.setAttribute('visibility', 'hidden');

  // The Catalyst 6500, an angry bull (FR-052)
  updateBull(v, now, still, d);
  const impacting = v.phase === 'launching' && !v.aim.relaunch && v.launchMs < v.config.launch.impactMs && !still;
  const impactMs = v.config.launch.impactMs; const lm = v.launchMs;

  // Character: a rigid body. Position and orientation come from the simulation and the tail is its rope
  // (FR-041); the face emotes from sim events and the UI mood (FR-042).
  const phys = v.config.physics; const A = phys.bodyHalfW;
  const th = still || glide ? 0 : (v.draw ? v.draw.th : s.th);
  const thShow = glide && !still ? Math.sin(now / 600) * 0.14 : th;
  const idle = AIMING.includes(v.phase) && !still ? Math.sin(now / 500) * 1.2 : 0;
  const half = 16 * sc.charScale;
  const cy = sc.groundPx - yPx + camY + idle;
  $('char-pos').setAttribute('transform', `translate(${chX()} ${cy}) scale(${sc.charScale})`);
  $('char-spin').setAttribute('transform', `rotate(${(-thShow * 57.2958).toFixed(2)})`);
  const yCom = yPx / sc.pxPerM;
  const sx = (wx) => chX() + (wx - (glide ? live.x : live.x)) * sc.pxPerM; const sy = (wy) => sc.groundPx - wy * sc.pxPerM + camY + idle;
  const anchor = { x: live.x - A * Math.cos(thShow), y: yCom - A * Math.sin(thShow) };
  let nodes;
  if (still || glide || !v.draw) {
    nodes = []; for (let i = 0; i < v.config.tail.nodes; i++) nodes.push({ x: anchor.x - v.config.tail.segM * 0.95 * (i + 1), y: still ? 0.5 : Math.max(0.5, anchor.y - 3 * (i + 1) + (glide ? Math.sin(now / 160 + i) * 4 : 0)) });
  } else nodes = v.draw.tail;
  const pts = [[sx(anchor.x), sy(anchor.y)], ...nodes.map((q) => [sx(q.x), sy(q.y)])];
  const dpath = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
  $('tail-out').setAttribute('d', dpath); $('tail-line').setAttribute('d', dpath);
  const lp = pts[pts.length - 1]; const pp = pts[pts.length - 2];
  $('tail-end').setAttribute('transform', `translate(${lp[0].toFixed(1)} ${lp[1].toFixed(1)}) rotate(${(Math.atan2(lp[1] - pp[1], lp[0] - pp[0]) * 57.2958).toFixed(1)})`);

  // Emotion: the UI mood (answer result) wins; then a timed reaction to the last bounce or boost; then the situation.
  if (s.lastBounce && s.lastBounce.seq !== vis.bounceSeq) { vis.bounceSeq = s.lastBounce.seq; const q = s.lastBounce.q; vis.emo = q >= 0.6 ? 'happy' : q < 0.4 ? 'sad' : 'worried'; vis.emoUntil = now + 1400; }
  if (s.boostSeq !== vis.boostSeq) { vis.boostSeq = s.boostSeq; if (s.boostSeq > 0) { vis.emo = s.boostQuality >= v.config.boost.goodQuality ? 'happy' : 'worried'; vis.emoUntil = now + 1100; } }
  let emotion = 'neutral';
  if (v.mood === 'celebrate') emotion = 'happy';
  else if (v.mood === 'mourn') emotion = 'sad';
  else if (now < vis.emoUntil) emotion = vis.emo;
  else if (glide) emotion = 'happy';
  else if (s.status === 'missed' || (s.status === 'paused' && s.grounded && s.misses > 0)) emotion = 'sad';
  else if (v.phase === 'launching' || (s.status === 'running' && !s.grounded && s.speedMps > 45)) emotion = 'worried';
  const spd = s.speedMps || 0;
  const lookX = spd > 1 ? (s.vx * Math.cos(s.th) + s.vy * Math.sin(s.th)) / spd : 0; const lookY = spd > 1 ? -(-s.vx * Math.sin(s.th) + s.vy * Math.cos(s.th)) / spd : 0;
  applyFace(emotion, still ? 0 : lookX, still ? 0 : lookY, !still && now % 3400 < 130);
  const boosting = s.boostCooldownMs > 0 || glide || impacting;
  $('streaks').setAttribute('opacity', boosting && !still ? 1 : 0);

  // Aim arrow while choosing the angle and until the Catalyst arrives.
  const aim = $('aim');
  const showAim = v.phase === 'aim-angle' || (v.phase === 'launching' && lm < impactMs);
  if (showAim && v.aim.angleDeg !== null) {
    const len = 50 + (v.aim.power01 === null ? 0.5 : v.aim.power01) * 120;
    aim.setAttribute('transform', `translate(${chX()} ${sc.groundPx - half}) rotate(${-v.aim.angleDeg})`);
    const line = $('aim-line'); line.setAttribute('x2', len); $('aim-head').setAttribute('transform', `translate(${len} 0)`);
    aim.setAttribute('visibility', 'visible');
  } else aim.setAttribute('visibility', 'hidden');

  const maxE = v.config.initialEnergy + v.config.superBoostEnergy;
  const pct = Math.max(0, Math.min(100, (s.energy / maxE) * 100));
  setText($('ov-distance'), fmtM(live.x));
  setText($('ov-next'), String(s.bounces));
  setText($('ov-speed'), formatSpeed(s.speedMps, v.config));
  $('ov-energy-fill').style.width = `${pct.toFixed(1)}%`;
  setText($('ov-energy-pct'), `${Math.round(s.energy)} (${Math.round(pct)}%)`);
}

function stageSentence(v) {
  const s = v.sim; const a = v.aim;
  switch (v.phase) {
    case 'briefing': return 'The character stands on the road minding its own business while an angry Catalyst 6500 snorts and paws the ground nearby.';
    case 'aim-power': return `${a.relaunch ? 'Power-up! ' : ''}Power dial moving: ${Math.round((a.power01 || 0) * 100)} percent. Lock it with the Lock button.`;
    case 'aim-angle': return `Angle gauge moving: ${Math.round(a.angleDeg || 0)} degrees. Lock it with the Lock button.`;
    case 'launching': return a.relaunch ? 'Launching with your chosen power and angle.' : 'The angry Catalyst 6500 charges across the screen and rams the character.';
    case 'glide': return `Victory glide at ${formatSpeed(s.speedMps, v.config)}.`;
    default: return `${fmtM(s.x)} travelled, ${s.bounces} device bounces${s.lastBounce ? `, last bounce ${s.lastBounce.q >= 0.6 ? 'solid' : s.lastBounce.q < 0.4 ? 'poor' : 'fair'}` : ''}, ${s.status === 'running' ? (s.grounded ? 'sliding on the road' : 'tumbling through the air') : 'stopped on the road after missing, looking sad'}.`;
  }
}

export function updateStage(v) {
  const t = document.getElementById('stage-text');
  const stg = document.getElementById('stage');
  if (!t || !v.sim) return;
  setText(t, stageSentence(v));
  updateScene(v);
  const mn = document.getElementById('motion-note');
  setText(mn, sceneAnimationOn() ? '' : 'Scene animation is off. Tick "Scene animation" at the top to turn the moving scene back on.');
  const mood = document.getElementById('mood');
  if (stg && mood) {
    const m = v.mood || '';
    if (stg.getAttribute('data-mood') !== m) stg.setAttribute('data-mood', m);
    setText(mood, v.mood === 'celebrate' ? 'Celebrating! \u{1F389}' : v.mood === 'mourn' ? 'Mourning... \u{1F622}' : '');
  }
  updateDials(v);
  // Boost state text (the dial itself is in the scene)
  const note = document.getElementById('boost-state');
  if (note) {
    const ready = v.sim.boostCooldownMs <= 0;
    const air = !v.sim.grounded || v.sim.phase === 'glide';
    const left = v.sim.boosts;
    setText(note, `Boosts left: ${left}. ${left <= 0 ? 'Fly into the gold orbs to collect more.' : !ready ? 'Recharging.' : air ? 'Ready: press when the needle is near BEST.' : 'Ready once you are in the air.'}`);
  }
}

// Needles and visibility of the three dials. The dials appear only when needed (FR-036, FR-043).
function updateDials(v) {
  const $ = (id) => document.getElementById(id);
  if (!$('dial-power')) return;
  const stage = v.aim.stage;
  const dialX = view.w - 80; const dialY = view.h > SCENE.h ? Math.round(view.vy + view.h * 0.5) : DIAL.cy;
  for (const k of ['power', 'angle', 'boost']) { const g = $(`dial-${k}`); const key = `${dialX},${dialY}`; if (g.__x !== key) { g.__x = key; g.setAttribute('transform', `translate(${dialX} ${dialY})`); } }
  const btn = $('lock-btn') || $('boost-btn'); const svgEl = $('scene-svg');
  if (btn && svgEl && svgEl.clientWidth) {
    const W = svgEl.clientWidth; const H = svgEl.clientHeight; const k = Math.min(W / view.w, H / view.h);
    const left = Math.round((W - view.w * k) / 2 + dialX * k); const top = Math.round(H - view.h * k + (dialY - 86 - 32 - view.vy) * k);
    const key = `${left},${top}`; if (btn.__pos !== key) { btn.__pos = key; btn.style.left = `${left}px`; btn.style.top = `${top}px`; }
  }
  const flying = (v.phase === 'flying' || v.phase === 'glide') && v.sim.status === 'running';
  const show = { power: stage === 'power', angle: stage === 'angle', boost: flying };
  for (const k of ['power', 'angle', 'boost']) $(`dial-${k}`).setAttribute('visibility', show[k] ? 'visible' : 'hidden');
  const needle = (k, t) => $(`dial-${k}-needle`).setAttribute('transform', `rotate(${((Math.min(1, Math.max(0, t)) - 0.5) * 180).toFixed(1)})`);
  if (show.power) {
    const p = v.aim.power01 === null ? 0 : v.aim.power01; needle('power', p);
    setText($('dial-power-val'), `${Math.round(p * 100)}%`); setText($('dial-power-sub'), 'press Lock');
  }
  if (show.angle) {
    const g = v.config.physics; const a = v.aim.angleDeg === null ? g.angleMinDeg : v.aim.angleDeg; needle('angle', (a - g.angleMinDeg) / (g.angleMaxDeg - g.angleMinDeg));
    setText($('dial-angle-val'), `${Math.round(a)}\u00B0`); setText($('dial-angle-sub'), `power ${Math.round((v.aim.power01 || 0) * 100)}% locked`);
  }
  if (show.boost) {
    const sweep = v.draw ? v.draw.sweepMs : v.sim.sweepMs; const p = gaugeValue(sweep, v.config.boost.sweepMs);
    needle('boost', p);
    const ready = v.sim.boostCooldownMs <= 0;
    const left = v.sim.boosts;
    setText($('dial-boost-val'), left <= 0 ? 'EMPTY' : ready ? `${Math.round(boostQuality(sweep, v.config) * 100)}%` : 'WAIT');
    setText($('dial-boost-sub'), left <= 0 ? 'collect orbs' : `${left} left, ${ready ? 'click or B' : 'recharging'}`);
    $('dial-boost').setAttribute('opacity', ready && left > 0 ? 1 : 0.6);
    if (btn) { const off = left <= 0 || !ready; if (btn.__off !== off) { btn.__off = off; btn.className = off ? 'action off' : 'action'; } }
  }
  const pv = $('pw-val'); if (pv) setText(pv, v.aim.power01 === null ? 'Power: not set' : `Power: ${Math.round(v.aim.power01 * 100)}%`);
  const av = $('an-val'); if (av) setText(av, v.aim.angleDeg === null ? 'Angle: not set' : `Angle: ${Math.round(v.aim.angleDeg)}\u00B0`);
}

// Instruction text for aiming and flight is visually hidden so nothing covers the gameplay (FR-051);
// the Lock / Boost button lives in the scene above the dial.
function boostControls() {
  return h('section', { class: 'boost', 'aria-labelledby': 'boost-h' },
    h('h2', { id: 'boost-h', text: 'Boost' }),
    h('p', { id: 'boost-state', class: 'boost-state' }));
}

function aimControls(v) {
  const power = v.phase === 'aim-power';
  return h('section', { class: 'aim', 'aria-labelledby': 'screen-heading' },
    h('p', { class: 'note', text: power ? 'Watch the POWER dial on the right of the scene. Its needle sweeps from low to high and back. Press the Lock button above the dial, or Space, once to stop it: timing is key.' : 'Power is locked. Now watch the ANGLE dial and press Lock, or Space, once to stop the needle.' }),
    h('p', { class: 'aim-readout', id: 'pw-val' }), h('p', { class: 'aim-readout', id: 'an-val' }),
    v.assist ? h('p', { class: 'note', text: `Assist is on: the lock uses a fixed good value (power ${Math.round(v.config.gauge.assistPower * 100)}%, angle ${v.config.gauge.assistAngleDeg}\u00B0).` }) : '');
}

function choices(q, selected) {
  const fs = h('fieldset', { class: 'choices' }, h('legend', { text: 'Choose one answer' }));
  q.choices.forEach((c, i) => fs.append(h('label', { class: 'choice' },
    h('input', { type: 'radio', name: 'choice', value: c.id, 'data-action': 'select', checked: selected === c.id }),
    ` ${String.fromCharCode(65 + i)}) ${c.label}`)));
  return fs;
}

// One screen = the scene filling `main` plus a floating panel with that screen's text and controls (FR-045).
export function renderMain(root, v, ui) {
  root.textContent = '';
  const panel = (cls, ...kids) => h('div', { class: `panel ${cls}` }, ...kids);
  const heading = (t) => h('h2', { id: 'screen-heading', tabindex: '-1', text: t });
  let body;
  switch (v.phase) {
    case 'error':
      body = panel('card', heading('Content error'), h('p', { text: 'The game content could not be loaded. Nothing was counted.' }),
        h('ul', {}, v.errors.map((e) => h('li', { text: e }))),
        h('button', { type: 'button', 'data-action': 'reload', text: 'Try loading again' }));
      break;
    case 'briefing':
      body = panel('card', heading('NETCRASH: get ready to crash'),
        h('p', { text: 'Your character is just standing there. Press Launch, then lock the sweeping power dial and the sweeping angle dial with one click each: timing is key. A Catalyst 6500 will do the rest.' }),
        h('p', { text: 'In flight you bounce off the network devices along the road; a landing on top gives a strong, well-angled bounce with extra energy, and hitting a device from the side just knocks you back. If you stop on the road, a question about the OSI model appears; a correct answer launches you again. Wrong answers cost nothing: retry as often as you like.' }),
        h('p', { text: 'Press Boost (the dial, the button, or B) in the air: the closer the needle is to BEST, the bigger the boost, and a perfect one launches you at the ideal angle. Assist makes every press and both launch dials perfect. Energy runs out with distance, not with time, and everything pauses while a question is open.' }),
        ...(systemPrefersReducedMotion() ? [h('p', { class: 'note', text: 'Your system asks for reduced motion, but the scene animation starts on because the game is about movement. Untick "Scene animation" in the title bar to turn it off.' })] : []),
        h('p', { class: 'note', text: 'Joke alert: your speed is shown in network bit rates (Mbps, Gbps, Tbps) while distance is in meters. That mismatch is intentional humor, not a networking claim.' }),
        h('button', { type: 'button', id: 'start-btn', 'data-action': 'start', text: 'Launch!' }));
      break;
    case 'aim-power':
    case 'aim-angle':
      body = panel('sr', heading(v.aim.relaunch ? (v.phase === 'aim-power' ? 'Power up! Set your power again' : 'Power up! Set your angle again') : (v.phase === 'aim-power' ? 'Set your power' : 'Set your angle')), aimControls(v));
      break;
    case 'launching':
      body = panel('sr', heading(v.aim.relaunch ? 'Launching!' : 'Incoming!'), h('p', { text: v.aim.relaunch ? 'Launching with your power and angle.' : 'The angry Catalyst 6500 is charging at the character...' }));
      break;
    case 'flying':
    case 'glide':
      body = panel('sr', heading(v.phase === 'glide' ? 'Victory glide' : 'Flying'),
        h('p', { text: v.phase === 'glide' ? 'You beat the boss! No more questions: enjoy the glide and press Boost for fun.' : 'Bounce off the devices to keep going and fly into the gold orbs to collect boosts. You have a few boosts: use them when the needle is near BEST. If you stop on the road, a question appears.' }),
        boostControls());
      break;
    case 'awaiting-answer':
    case 'last-chance':
    case 'boss':
    case 'feedback': {
      const r = v.round;
      const open = v.phase !== 'feedback';
      const kids = [heading(v.isBoss ? r.title : `${v.lastChance ? 'Last chance: ' : ''}Question ${v.askedCount} of ${v.roundCount + 1}`)];
      if (v.lastChance) kids.push(h('p', { class: 'note', text: 'Energy ran out. This is your one last-chance question: a correct answer keeps the run going, a wrong answer ends it.' }));
      kids.push(h('p', { class: 'prompt', text: r.prompt }));
      if (v.contentError) kids.push(h('p', { class: 'error', role: 'alert', text: `${v.contentError} (question ${r.id}). Grading is disabled until the content is fixed.` }));
      if (open) kids.push(choices(r, ui.selected), h('div', { class: 'actions' }, h('button', { type: 'button', id: 'submit-btn', 'data-action': 'submit', disabled: Boolean(v.contentError), text: 'Submit' })));
      else kids.push(h('div', { class: 'actions' }, h('button', { type: 'button', id: 'next-btn', 'data-action': 'next', text: 'Next' })));
      kids.push(h('div', { id: 'feedback', class: 'feedback', role: 'status', 'aria-live': 'polite' }));
      body = panel('card', ...kids);
      break;
    }
    case 'summary': {
      const a = v.assistance;
      body = panel('card', heading(v.outcome === 'victory' ? 'Victory! Run summary' : 'Out of energy: run summary'),
        h('p', { text: v.outcome === 'victory' ? 'You beat the Layer 8 boss and glided until the energy ran out.' : 'The character ran out of energy and stopped.' }),
        h('dl', { class: 'summary' },
          h('dt', { text: 'Distance achieved' }), h('dd', { text: fmtM(v.sim.x) }),
          h('dt', { text: 'Points' }), h('dd', { text: `${v.score} / ${v.roundCount}` }),
          h('dt', { text: 'Completed rounds' }), h('dd', { text: String(v.completedRoundIds.length) }),
          h('dt', { text: 'Valid attempts' }), h('dd', { text: String(v.attempts) }),
          h('dt', { text: 'Assistance used' }), h('dd', { text: `${a.assistBoosts} assisted boosts${a.assistedLaunch ? ', assisted launch' : ''}` })),
        h('p', { class: 'note', text: 'Completion is not proof of independent mastery: Assist is counted separately above.' }),
        h('div', { id: 'feedback', class: 'feedback', role: 'status', 'aria-live': 'polite' }),
        h('button', { type: 'button', 'data-action': 'restart', text: 'Play again' }));
      break;
    }
    default:
      body = panel('card', heading('Unexpected state'));
  }
  root.append(v.sim ? stage(v) : '', body);
}

export function updateDynamic(v) {
  const fb = document.getElementById('feedback');
  if (fb) {
    fb.textContent = '';
    if (v.lastResult) {
      fb.className = `feedback ${v.lastResult.tone}`;
      fb.append(h('p', { class: 'fb-head', text: v.lastResult.headline }), h('p', { text: v.lastResult.body }));
      if (v.lastResult.nextStep) fb.append(h('p', { text: v.lastResult.nextStep }));
    } else fb.className = 'feedback';
  }
}
