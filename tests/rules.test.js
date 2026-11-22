import { test, assert, loadDoc } from './harness.js';
import { evaluate } from '../engine/rules.js';
import { explain } from '../engine/feedback.js';

const doc = await loadDoc();
const all = [...doc.rounds, doc.boss];

test('the correct option is graded correct for every question, including Layer 8', () => {
  for (const q of all) assert.equal(evaluate(q, doc.sources, q.rule.correctChoice).status, 'correct', q.id);
});
test('every wrong option is incorrect and has its own reason text', () => {
  for (const q of all) for (const c of q.choices) {
    if (c.id === q.rule.correctChoice) continue;
    const r = evaluate(q, doc.sources, c.id);
    assert.equal(r.status, 'incorrect', `${q.id}/${c.id}`);
    assert.equal(explain(r, q).body, c.why);
  }
});
test('empty or unknown choices are input guidance, not attempts', () => {
  for (const bad of [null, undefined, '']) assert.equal(evaluate(doc.rounds[0], doc.sources, bad).reasonCode, 'NO_SELECTION');
  assert.equal(evaluate(doc.rounds[0], doc.sources, 'z').reasonCode, 'BAD_CHOICE');
  assert.equal(explain(evaluate(doc.rounds[0], doc.sources, null), doc.rounds[0]).tone, 'guidance');
});
test('the answer comes from the rule, not from option order', () => {
  const q = JSON.parse(JSON.stringify(doc.rounds[0])); q.choices.reverse();
  assert.equal(evaluate(q, doc.sources, 'b').status, 'correct');
  assert.equal(evaluate(q, doc.sources, 'a').status, 'incorrect');
});
test('a broken question is a content error with no grading', () => {
  const q = JSON.parse(JSON.stringify(doc.rounds[0])); q.rule.correctChoice = null;
  const r = evaluate(q, doc.sources, 'b');
  assert.equal(r.status, 'content-error'); assert.equal(explain(r, q).tone, 'error');
});
test('feedback text uses lettered options and explains the answer', () => {
  const q = doc.rounds[0];
  assert.includes(explain(evaluate(q, doc.sources, 'b'), q).headline, 'B) Hub');
  assert.includes(explain(evaluate(q, doc.sources, 'a'), q).headline, 'A) Router');
  assert.includes(explain(evaluate(q, doc.sources, 'b'), q).body, 'Layer 1');
  assert.includes(explain(evaluate(doc.boss, doc.sources, 'c'), doc.boss).nextStep, 'glide');
});
