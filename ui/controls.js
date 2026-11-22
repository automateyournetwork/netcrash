// Input events, keyboard/focus behavior, and the animation-frame loop.
import { createQualityMonitor } from './device.js';
import { buildHud, updateHud, updateStage, renderMain, updateDynamic, setSceneAnimation } from './render.js';

export function mountGame({ game, hudRoot, mainRoot, liveRoot, confirmFn = (m) => window.confirm(m), env = {} }) {
  const ui = { selected: null, key: '', lastMoodSeq: 0 };
  buildHud(hudRoot);

  function announce(text) { liveRoot.textContent = ''; setTimeout(() => { liveRoot.textContent = text; }, 30); }

  function refresh(focusHeading = true) {
    const v = game.view();
    const key = `${v.phase}|${v.round ? v.round.id : ''}|${v.lastChance}`;
    if (key !== ui.key) {
      ui.key = key; ui.selected = null;
      renderMain(mainRoot, v, ui);
      const target = document.getElementById('lock-btn') || document.getElementById('screen-heading');
      if (focusHeading && target) target.focus();
    }
    updateHud(v); updateStage(v); updateDynamic(v);
    if (v.moodSeq !== ui.lastMoodSeq) {
      ui.lastMoodSeq = v.moodSeq;
      if (v.lastResult) announce(`${v.lastResult.headline} ${v.lastResult.body}`);
    } else if (v.lastResult && v.lastResult.tone === 'guidance') announce(v.lastResult.headline);
    return v;
  }

  function onAction(action, el) {
    switch (action) {
      case 'start': game.start(); break;
      case 'lock': game.lock(); break;
      case 'select': ui.selected = el.value; return;
      case 'submit': {
        const v = game.view();
        const choice = ui.selected;
        game.submit(choice);
        // keep focus on Submit unless the screen changed
        refresh(false);
        const btn = document.getElementById('submit-btn') || document.getElementById('next-btn'); if (btn) btn.focus();
        return;
      }
      case 'next': game.next(); break;
      case 'boost': game.pressBoost(); return;
      case 'assist': game.toggleAssist(); break;
      case 'motion': setSceneAnimation(el.checked); updateHud(game.view()); updateStage(game.view()); return;
      case 'format': {
        const q = new URLSearchParams(window.location.search); if (el.value === 'auto') q.delete('format'); else q.set('format', el.value);
        const qs = q.toString(); window.location.search = qs ? `?${qs}` : ''; return;
      }
      case 'restart':
        if (game.restart(confirmFn('Restart the run? Your current progress will be cleared.'))) { ui.key = ''; break; }
        return;
      case 'reload': window.location.reload(); return;
      default: return;
    }
    refresh();
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (el && el.tagName !== 'INPUT' && el.tagName !== 'SELECT') onAction(el.getAttribute('data-action'), el);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-action]');
    if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT')) onAction(el.getAttribute('data-action'), el);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      game.pressBoost();
    }
  });

  // Frame-rate meter (?fps=1) and automatic lighter quality when the frame rate stays low (FR-050).
  const monitor = createQualityMonitor(); let shownAt = 0; let meter = null;
  if (env.fps && typeof document !== 'undefined') { meter = document.createElement('div'); meter.id = 'fps'; meter.setAttribute('aria-hidden', 'true'); document.body.append(meter); }
  function noteFrame(now, dt, flying) {
    const root = typeof document !== 'undefined' ? document.documentElement : null;
    if (!root || !root.dataset) return;
    const m = monitor.note(now, dt, flying);
    if (meter && now - shownAt > 250) { shownAt = now; meter.textContent = `${m.fps} fps, worst ${Math.round(m.worstMs)} ms, quality ${root.dataset.quality || 'high'}, ${env.format || '?'} / ${env.browser || '?'}`; }
    if (m.low && !root.dataset.quality) {
      root.dataset.quality = 'low';
      const note = document.getElementById('quality-note'); if (note) note.textContent = 'Quality: low (automatic, frame rate was low)';
    }
  }

  let last = performance.now(); let prevStatus = null; let tickCount = 0;
  function frame(now) {
    const raw = now - last; const dt = Math.min(250, raw); last = now;
    noteFrame(now, raw, game.view().phase === 'flying' || game.view().phase === 'glide');
    const before = game.view().phase;
    game.tick(dt);
    const v = game.view();
    if (v.phase !== before) refresh(); else { updateStage(v); if (v.sim && v.sim.status !== prevStatus || tickCount++ % 6 === 0) updateHud(v); }
    prevStatus = v.sim && v.sim.status;
    requestAnimationFrame(frame);
  }
  refresh();
  requestAnimationFrame(frame);
  return { refresh };
}
