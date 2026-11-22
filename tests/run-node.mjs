// Optional: node tests/run-node.mjs (Node 18+). The browser runner (tests/index.html) is the primary path.
import { runAll } from './harness.js';
import './content.test.js'; import './rules.test.js'; import './sim.test.js'; import './state.test.js'; import './device.test.js';
const r = await runAll();
if (r.noTests) { console.error('FAIL: zero tests discovered'); process.exit(1); }
console.log(`${r.passed} / ${r.total} passed, ${r.failed.length} failed`);
for (const f of r.failed) console.log(`FAIL ${f.name}: ${f.error}`);
process.exit(r.failed.length ? 1 : 0);
