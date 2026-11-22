// Load -> validate -> start. Content errors are shown and never counted as attempts.
import { createGame } from './engine/state.js';
import { mountGame } from './ui/controls.js';
import { detectEnvironment } from './ui/device.js';

// Pick the layout before anything is drawn: a vertical touch format for phones, the full-window landscape format for desktops.
const env = detectEnvironment(window);
const root = document.documentElement;
root.dataset.format = env.format; root.dataset.browser = env.browser; root.dataset.touch = env.coarse ? 'yes' : 'no';
if (env.quality === 'low' || env.quality === 'high') root.dataset.quality = env.quality;

async function boot() {
  const hudRoot = document.getElementById('hud');
  const mainRoot = document.getElementById('main');
  const liveRoot = document.getElementById('live');
  mainRoot.textContent = 'Loading...';
  let doc = null;
  try {
    const res = await fetch('data/levels.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    doc = await res.json();
  } catch (err) {
    mainRoot.textContent = '';
    const p = document.createElement('p');
    p.textContent = `Content error: could not load data/levels.json (${err.message}). Serve this folder over HTTP: python3 -m http.server 8000 --bind 127.0.0.1`;
    mainRoot.append(p);
    return;
  }
  const game = createGame(doc);
  mountGame({ game, hudRoot, mainRoot, liveRoot, env });
}
boot();
