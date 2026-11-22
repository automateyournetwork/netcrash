import { test, assert } from './harness.js';

// Starts the real serve.py on a spare port and checks what it serves (FR-048). Node only; skipped in a browser.
const node = typeof window === 'undefined';
test('serve.py serves the game and refuses the reference zip, python and powershell files', async () => {
  if (!node) return;
  const { spawn } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const dir = fileURLToPath(new URL('..', import.meta.url));
  const port = 8123;
  const p = spawn('python3', ['serve.py', '--port', String(port), '--bind', '127.0.0.1'], { cwd: dir, stdio: 'ignore' });
  try {
    let up = false;
    for (let i = 0; i < 40 && !up; i++) { try { up = (await fetch(`http://127.0.0.1:${port}/index.html`)).ok; } catch { await new Promise((r) => setTimeout(r, 100)); } }
    assert.ok(up, 'server started');
    const status = async (path) => (await fetch(`http://127.0.0.1:${port}${path}`)).status;
    assert.equal(await status('/index.html'), 200); assert.equal(await status('/data/levels.json'), 200); assert.equal(await status('/ui/render.js'), 200);
    for (const bad of ['/nanaca-crash_v110.zip', '/serve.py', '/expose-wsl.ps1', '/.git/config', '/x.zip']) assert.equal(await status(bad), 404, bad);
    const h = await fetch(`http://127.0.0.1:${port}/index.html`);
    assert.equal(h.headers.get('cache-control'), 'no-cache');
  } finally { p.kill(); }
});
