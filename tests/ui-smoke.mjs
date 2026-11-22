// Node-only UI smoke test with a tiny fake DOM (no dependencies). It runs the real render/controls
// code through a full playthrough. It is NOT a substitute for a real browser check (layout, focus ring,
// CSS animation, screen readers). Run: node tests/ui-smoke.mjs
import { readFile } from 'node:fs/promises';

class Text { constructor(d) { this.nodeType = 3; this.data = String(d); this.parent = null; } get textContent() { return this.data; } }
class El {
  constructor(tag) { this.nodeType = 1; this.tagName = tag.toUpperCase(); this.attrs = {}; this.children = []; this.parent = null; this.style = {}; this.className = ''; this.value = ''; this.checked = false; this.focused = false; }
  append(...nodes) { for (const n of nodes) { const c = typeof n === 'string' ? new Text(n) : n; c.parent = this; this.children.push(c); } }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'value') this.value = String(v); if (k === 'checked') this.checked = true; if (k === 'class') this.className = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  get textContent() { return this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this.children = []; if (v !== '' && v !== null) this.append(String(v)); }
  focus() { this.focused = true; global.__focus = this; }
  closest(sel) { const m = /^\[([\w-]+)\]$/.exec(sel); for (let e = this; e; e = e.parent) if (e.nodeType === 1 && m && m[1] in e.attrs) return e; return null; }
  walk(fn) { fn(this); for (const c of this.children) if (c.nodeType === 1) c.walk(fn); }
}
const listeners = {};
const body = new El('body');
global.document = {
  createElement: (t) => new El(t), createElementNS: (_n, t) => new El(t), createTextNode: (d) => new Text(d),
  getElementById(id) { let f = null; body.walk((e) => { if (!f && e.attrs.id === id) f = e; }); return f; },
  addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); }
};
global.window = { location: { reload() {} } };
let rafCb = null; global.requestAnimationFrame = (cb) => { rafCb = cb; };
let now = 0; global.performance = { now: () => now };

const mk = (id, tag = 'div') => { const e = new El(tag); e.setAttribute('id', id); body.append(e); return e; };
const hudRoot = mk('hud', 'header'); const mainRoot = mk('main', 'main'); const liveRoot = mk('live');

const { createGame } = await import('../engine/state.js');
const { mountGame } = await import('../ui/controls.js');
const doc = JSON.parse(await readFile(new URL('../data/levels.json', import.meta.url), 'utf8'));
doc.config.initialEnergy = 4000; // plenty of energy: stops are ordinary questions, not last chances (those are covered by the state tests)
const game = createGame(doc);
let confirmAnswer = false;
mountGame({ game, hudRoot, mainRoot, liveRoot, confirmFn: () => confirmAnswer });

const fire = (type, target) => (listeners[type] || []).forEach((fn) => fn({ target, key: '', preventDefault() {} }));
const byAction = (a) => { let f = null; mainRoot.walk((e) => { if (!f && e.attrs['data-action'] === a) f = e; }); return f; };
const click = (a) => { const el = byAction(a); if (!el) throw new Error(`no [${a}] on screen: ${mainRoot.textContent.slice(0, 120)}`); fire('click', el); };
const pick = (value) => { let f = null; mainRoot.walk((e) => { if (e.tagName === 'INPUT' && e.attrs.name === 'choice' && e.value === String(value)) f = e; }); if (!f) throw new Error('no radio ' + value); fire('change', f); };
const frames = (n, dt = 50) => { for (let i = 0; i < n; i++) { now += dt; const cb = rafCb; if (cb) cb(now); } };
const until = (pred, max = 20000) => { for (let i = 0; i < max && !pred(); i++) frames(1, 200); if (!pred()) throw new Error('condition not reached'); };
const text = () => mainRoot.textContent;
const fb = () => (document.getElementById('feedback') || { textContent: '' }).textContent;
const hud = (id) => document.getElementById(id).textContent;

let failures = 0; const check = (name, ok, extra = '') => { if (!ok) { failures++; console.log(`FAIL ${name} ${extra}`); } else console.log(`ok   ${name}`); };

const el = (id) => document.getElementById(id);
const phase = () => game.view().phase;
const radios = () => { let n = 0; mainRoot.walk((e) => { if (e.tagName === 'INPUT' && e.attrs.name === 'choice') n++; }); return n; };

// --- Briefing: the character just stands there; Launch starts the gauges ---
check('briefing shown first with a standing character, how-to-play text and a Launch button', text().includes('get ready to crash') && text().includes('Joke alert') && !!el('character') && !!byAction('start'));
check('HUD labels present', hudRoot.textContent.includes('Distance') && hudRoot.textContent.includes('Speed') && hudRoot.textContent.includes('Energy'));
check('no hint or worked-solution controls anywhere', !byAction('hint') && !byAction('worked') && !/worked solution|hint/i.test(text() + hudRoot.textContent));
check('briefing: the angry-bull Catalyst 6500 is already there, standing by the character', phase() === 'briefing' && game.view().sim.x === 0 && el('launcher-wrap').getAttribute('visibility') === 'visible' && ['bull-legF', 'bull-legB', 'bull-armF', 'bull-armB', 'bull-face', 'bull-mouth', 'bull-brow-L', 'bull-eye-R'].every((i) => !!el(i)));
const paw0 = el('bull-body').getAttribute('transform'); frames(4);
check('the bull animates while idle (paws the ground, snorts)', el('bull-body').getAttribute('transform') !== paw0 && Number(el('bull-steam-0').getAttribute('opacity')) >= 0);
frames(10);
check('briefing: character stays on the ground', game.view().sim.x === 0);

click('start');
const vis = (id) => el(id).getAttribute('visibility') === 'visible';
check('only the power dial is shown, inside the scene, plus a Lock button', phase() === 'aim-power' && text().includes('Set your power') && !!byAction('lock') && vis('dial-power') && !vis('dial-angle') && !vis('dial-boost'));
check('the dial is clickable (locks) and sits in the scene svg', el('dial-power').attrs['data-action'] === 'lock' && el('dial-power').attrs.transform.startsWith('translate(6'));
const m0 = el('dial-power-needle').getAttribute('transform'); frames(6);
check('power needle sweeps on its own between frames', el('dial-power-needle').getAttribute('transform') !== m0, `${m0} -> ${el('dial-power-needle').getAttribute('transform')}`);
check('power value is also text (dial and readout)', /^Power: \d+%$/.test(el('pw-val').textContent) && /^\d+%$/.test(el('dial-power-val').textContent), el('pw-val').textContent);
check('Lock button is focused for keyboard use', global.__focus && global.__focus.attrs.id === 'lock-btn');
click('lock');
check('after locking power the angle dial replaces the power dial', phase() === 'aim-angle' && text().includes('Set your angle') && vis('dial-angle') && !vis('dial-power'));
const a0 = el('dial-angle-needle').getAttribute('transform'); frames(6);
check('angle needle moves; angle readout in degrees', el('dial-angle-needle').getAttribute('transform') !== a0 && /^Angle: \d+\u00B0$/.test(el('an-val').textContent), el('an-val').textContent);
check('aim arrow is visible while choosing the angle', el('aim').getAttribute('visibility') === 'visible');
click('lock');
check('launching: the Catalyst winds up before anything moves, with a furious face', phase() === 'launching' && el('launcher-wrap').getAttribute('visibility') === 'visible' && game.view().sim.x === 0);
frames(3);
const lx0 = el('launcher-wrap').getAttribute('transform'); frames(10);
check('the bull charges toward the character (legs pumping)', el('launcher-wrap').getAttribute('transform') !== lx0 && el('bull-mouth').getAttribute('d').startsWith('M-12 -64'), el('bull-mouth').getAttribute('d'));
until(() => phase() === 'flying');
check('impact launches the character: flying with a Boost control', text().includes('Flying') && !!byAction('boost') && game.view().sim.status === 'running');
check('Boosts are limited to 3 at the start and shown as text and on the dial', hud('hud-boosts') === '3 left' && /3 left/.test(el('dial-boost-sub').textContent), hud('hud-boosts'));
check('Boost pickups (orbs) are drawn in the scene, the plug has 8 horizontal pins', el('pickups').children.length === 9 && el('char-spin').children.filter((c) => c.tagName === 'RECT' && c.attrs.width === '12.2').length === 8);
check('a layout selector exists', !!el('format-select'));
check('no aiming dial remains and the Boost dial is in the scene', !vis('dial-power') && !vis('dial-angle') && vis('dial-boost') && el('dial-boost').attrs['data-action'] === 'boost');
check('the character has human-like eyes (no X eyes) and a mouth', ['eye-L', 'eye-R', 'pupil-L', 'pupil-R', 'lid-L', 'brow-L', 'mouth'].every((i) => !!el(i)) && !/l6 6/.test(el('char-spin').children.map((c) => c.attrs.d || '').join('')));
frames(10);

// --- Scene while flying ---
const sceneIds = ['ly-clouds', 'ly-far', 'ly-near', 'ground', 'ly-lines-wrap', 'ly-landmarks', 'launcher', 'character', 'streaks', 'ov-distance', 'ov-next', 'ov-speed', 'ov-energy-fill', 'ov-energy-pct', 'stage-text', 'tower', 'aim', 'tail', 'dials'];
check('tail is drawn as a rope from the body', /^M[\d.-]+ [\d.-]+( L[\d.-]+ [\d.-]+){4}$/.test(el('tail-line').getAttribute('d')), el('tail-line').getAttribute('d'));
check('scene layers, launcher, character and corner readouts exist', sceneIds.every((i) => !!el(i)), sceneIds.filter((i) => !el(i)).join(','));
check('HUD shows speed in Mbps and distance in m', hud('hud-speed').includes('bps') && /m$/.test(hud('hud-distance')), hud('hud-speed'));
const labels = []; mainRoot.walk((e) => { if (e.tagName === 'TEXT') labels.push(e.textContent); });
check('no layer numbers/names on the device art (only the Layer 8 tower is labeled)', labels.filter((t) => /\bL[1-7]\b|Layer [1-7]\b|Physical|Data Link|Network|Transport|Session|Presentation|Application/.test(t)).length === 0 && labels.includes('Layer 8'));
const devVisible = () => { let n = 0; for (const g of el('ly-landmarks').children) if (g.getAttribute('visibility') === 'visible' && g.attrs['data-slot'] !== undefined) n++; return n; };
check('devices stand on the road ahead', devVisible() >= 1, String(devVisible()));
check('corner readouts show distance, bounces, speed and energy', /m$/.test(hud('ov-distance')) && /^\d+$/.test(hud('ov-next')) && hud('ov-speed').includes('bps') && /%\)$/.test(hud('ov-energy-pct')));
check('stage text equivalent reports distance and bounces', /travelled, \d+ device bounces/.test(el('stage-text').textContent), el('stage-text').textContent);
const farBefore = el('ly-far').getAttribute('transform'); const cBefore = el('char-pos').getAttribute('transform');
frames(8);
const tailBefore = el('tail-line').getAttribute('d'); const rotBefore = el('char-spin').getAttribute('transform');
frames(4);
check('the body tumbles and the tail swings as it flies', el('char-spin').getAttribute('transform') !== rotBefore && el('tail-line').getAttribute('d') !== tailBefore);
check('layers scroll and the character moves with the physics', el('ly-far').getAttribute('transform') !== farBefore && el('char-pos').getAttribute('transform') !== cBefore);
check('stage text has no null/undefined/NaN', !/null|undefined|NaN/.test(el('stage').textContent + hudRoot.textContent + el('char-pos').getAttribute('transform')));
{ // Scene animation: ON by default (even if the system prefers reduced motion); the switch turns it off.
  const { updateStage, sceneAnimationOn } = await import('../ui/render.js');
  window.matchMedia = () => ({ matches: true }); updateStage(game.view());
  check('animation defaults to on even when the system prefers reduced motion', sceneAnimationOn() === true && el('motion-note').textContent === '');
  const mt = el('motion-toggle'); mt.checked = false; fire('change', mt); frames(2);
  check('animation off: no scroll, no tilt, readouts still update, note shows the switch', /translate\(0 0\)$/.test(el('ly-far').getAttribute('transform')) && /^rotate\(-?0(\.00)?\)$/.test(el('char-spin').getAttribute('transform')) && /m$/.test(hud('ov-distance')) && el('motion-note').textContent.includes('Scene animation'));
  mt.checked = true; fire('change', mt); frames(3);
  const f1 = el('ly-far').getAttribute('transform'); frames(3);
  check('animation on: scene scrolls again', !/translate\(0 0\)$/.test(f1) && el('ly-far').getAttribute('transform') !== f1 && el('motion-note').textContent === '');
  delete window.matchMedia;
}
click('boost'); frames(2);
check('boost shows speed streaks while cooling down', el('streaks').getAttribute('opacity') === '1' || game.view().sim.grounded, el('streaks').getAttribute('opacity'));
{ // Plaid (FR-054): forge a view at 400+ Gbps and check the tartan background, the RV cabin and the text equivalent
  const { updateStage } = await import('../ui/render.js');
  const v0 = game.view(); const forged = { ...v0, sim: { ...v0.sim, plaid: true, speedMps: 160 } };
  updateStage(forged);
  check('plaid: the tartan background and the RV cabin cutaway appear, the normal sky layers hide', vis('plaid-bg') && vis('rv') && el('ly-far').getAttribute('visibility') === 'hidden' && el('ly-clouds').getAttribute('visibility') === 'hidden');
  check('plaid: the two cartoon characters and the speech bubble are in the cabin', ['rv-pilot', 'rv-sidekick', 'rv-bubble', 'rv-pilot-pupil-L', 'rv-sidekick-mouth', 'rv-streak'].every((i) => !!el(i)) && el('rv-bubble').textContent.includes("He's gone plaid!?!"));
  check('plaid: announced in the text equivalent and the plug is happy', /gone plaid/.test(el('stage-text').textContent) && el('mouth').getAttribute('d').startsWith('M-6 6.5'), el('stage-text').textContent);
  updateStage(v0);
  check('plaid: back to the normal sky when the speed drops', !vis('plaid-bg') && !vis('rv') && el('ly-far').getAttribute('visibility') === 'visible');
}

// --- First question: only the question and four lettered options ---
until(() => phase() === 'awaiting-answer', 60000);
check('question screen: scene stays visible, question text, exactly four options, Submit only', !!el('stage') && text().includes('Question 1 of 8') && text().includes('Layer 1 (Physical Layer)') && radios() === 4 && !!byAction('submit') && !byAction('hint') && !byAction('worked'));
check('face is sad after the miss', el('mouth').getAttribute('d') === 'M-5 12 Q0 6.5 5 12', el('mouth').getAttribute('d'));
check('Boost dial hidden while a question is open', !vis('dial-boost'));
check('options are lettered A to D', ['A) Router', 'B) Hub', 'C) Unmanaged Switch', 'D) Firewall'].every((t) => text().includes(t)));
check('no item picture, diagram or briefing on the question screen', !/Diagram|Briefing/.test(text()));
click('submit');
check('no selection -> guidance, no attempt', fb().includes('Select an option') && hud('hud-attempts') === '0', fb());
pick('a'); click('submit');
check('wrong answer -> reason for that option + retry', fb().includes('A router works at Layer 3') && hud('hud-attempts') === '1' && !!byAction('submit'), fb());
check('assistance shows no hints or worked solutions', !/hint|worked/i.test(hud('hud-assist')), hud('hud-assist'));
pick('b'); click('submit');
check('correct -> feedback + Next, score 1', fb().includes('Correct') && !!byAction('next') && !byAction('submit') && hud('hud-score').startsWith('1'), fb());
check('celebrate mood text', el('mood').textContent.includes('Celebrating'));
check('face is happy after a correct answer', el('mouth').getAttribute('d').startsWith('M-6 6.5 Q0 15'), el('mouth').getAttribute('d'));
click('next');
check('after a correct answer the power dial pops up again (power-up), no flight yet', phase() === 'aim-power' && text().includes('Power up') && vis('dial-power') && !!byAction('lock') && game.view().sim.status === 'paused');
check('the bull is back beside the plug while you re-aim', el('launcher-wrap').getAttribute('visibility') === 'visible');
click('lock'); check('then the angle dial again', phase() === 'aim-angle' && vis('dial-angle')); click('lock');
frames(3); const rl0 = el('launcher-wrap').getAttribute('transform'); frames(10);
check('the plug is worried, not sad, while the bull charges (relaunch)', el('mouth').getAttribute('d').startsWith('M-2.5 9'), el('mouth').getAttribute('d'));
check('the bull winds up and charges again before the relaunch (run-up present)', phase() === 'launching' && el('launcher-wrap').getAttribute('transform') !== rl0 && el('bull-mouth').getAttribute('d').startsWith('M-12 -64'), el('launcher-wrap').getAttribute('transform'));
until(() => phase() === 'flying');
check('relaunched with the chosen values: flying again', text().includes('Flying') && game.view().sim.status === 'running');

// play Layers 2..7 using the keys; Assist is on from the launch
fire('change', (() => { let f; hudRoot.walk((e) => { if (e.attrs.id === 'assist-toggle') f = e; }); return f; })());
check('assist toggle recorded', game.view().assist === true);
const keyByLayer = { 2: 'c', 3: 'b', 4: 'd', 5: 'b', 6: 'a', 7: 'd' };
for (let layer = 2; layer <= 7; layer++) {
  until(() => phase() === 'awaiting-answer' || phase() === 'last-chance', 60000);
  check(`layer ${layer} question shows four options`, radios() === 4 && text().includes(`Layer ${layer}`));
  pick(keyByLayer[layer]); click('submit');
  check(`layer ${layer} correct`, fb().includes('Correct'), fb());
  click('next');
  check(`after layer ${layer} the dials pop up again (no skipping to the boss)`, phase() === 'aim-power' && text().includes('Power up'));
  click('lock'); click('lock'); until(() => phase() === 'flying'); // power-up: aim again; after Layer 7 the boss comes at the next stop
}
until(() => phase() === 'boss', 60000);
check('the Layer 8 boss appears at the next stop: labeled informal, the post-mortem question, four options', text().includes('informal') && text().includes('quick fix') && text().includes('Layer 8') && radios() === 4);
check('boss options are the owner\'s', ['A) Three-way handshake', 'B) CYA encapsulation', 'C) Cross-team blame routing', 'D) Mandatory trust-fall'].every((t) => text().includes(t)));
pick('a'); click('submit');
check('wrong boss option stays open and explains it', fb().includes('Not quite') && !!byAction('submit'));
pick('b'); click('submit');
check('boss defeated: CYA encapsulation, liability is mandatory', fb().includes('Correct') && fb().includes('CYA encapsulation') && fb().includes('liability is mandatory'), fb());
click('next');
check('glide with no questions', text().includes('Victory glide') && hud('hud-speed').includes('Tbps'), hud('hud-speed'));
until(() => phase() === 'summary', 100000);
check('victory summary shows separated stats', text().includes('Victory') && text().includes('Distance achieved') && text().includes('Assistance used') && text().includes('7 / 7') && !/hint|worked/i.test(text()));
confirmAnswer = false; click('restart');
check('restart cancelled keeps summary', text().includes('Victory'));
confirmAnswer = true; click('restart');
check('restart confirmed returns to the briefing', text().includes('get ready to crash') && hud('hud-score').startsWith('0'));

console.log(failures ? `\n${failures} UI smoke check(s) FAILED` : '\nUI smoke test passed');
process.exit(failures ? 1 : 0);
