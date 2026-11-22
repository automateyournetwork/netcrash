// Tiny dependency-free test harness that works in the browser and in Node.
const tests = [];
export function test(name, fn) { tests.push({ name, fn }); }

export const assert = {
  ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); },
  equal(a, b, msg) { if (a !== b) throw new Error(`${msg || 'not equal'}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); },
  deepEqual(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || 'not deep equal'}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); },
  includes(s, frag, msg) { if (!String(s).includes(frag)) throw new Error(`${msg || 'missing text'}: ${JSON.stringify(s)} does not include ${JSON.stringify(frag)}`); }
};

export const clone = (o) => JSON.parse(JSON.stringify(o));

export async function loadDoc() {
  const url = new URL('../data/levels.json', import.meta.url);
  if (typeof window === 'undefined') {
    const fs = await import('node:fs/promises');
    return JSON.parse(await fs.readFile(url, 'utf8'));
  }
  const res = await fetch(url);
  return res.json();
}

export async function runAll() {
  const results = [];
  for (const t of tests) {
    try { await t.fn(); results.push({ name: t.name, ok: true }); }
    catch (e) { results.push({ name: t.name, ok: false, error: e.message }); }
  }
  const failed = results.filter((r) => !r.ok);
  return { total: results.length, passed: results.length - failed.length, failed, noTests: results.length === 0 };
}
