import { test, assert, loadDoc, clone } from './harness.js';
import { validateDocument, questionContentError, MSG } from '../engine/content.js';

const doc = await loadDoc();

test('shipped content is valid: 7 layer questions, a Layer 8 boss, a source for each', () => {
  const v = validateDocument(doc);
  assert.deepEqual(v.fatal, []);
  assert.equal(doc.rounds.length, 7); assert.equal(doc.boss.informal, true);
  doc.rounds.forEach((r, i) => assert.equal(r.layer, i + 1));
  for (const r of [...doc.rounds, doc.boss]) assert.equal(r.choices.length, 4);
});
test('answer key is the standard one: B C B D B A D, boss C', () => {
  assert.equal(doc.rounds.map((r) => r.rule.correctChoice).join(''), 'bcbdbad');
  assert.equal(doc.boss.rule.correctChoice, 'c');
});
test('no hints, worked solutions, briefings or concepts remain in the data', () => {
  const text = JSON.stringify(doc);
  assert.ok(!/"hints"|"briefing"|"concepts"|worked/i.test(text));
});
test('missing, unknown key, duplicate ids, wrong option count, bad source are content errors', () => {
  const q = () => clone(doc.rounds[0]);
  let r = q(); r.rule.correctChoice = null; assert.equal(questionContentError(r, doc.sources), MSG.KEY);
  r = q(); r.rule.correctChoice = 'z'; assert.equal(questionContentError(r, doc.sources), MSG.KEY);
  r = q(); r.choices[1].id = 'a'; assert.equal(questionContentError(r, doc.sources), MSG.CHOICES);
  r = q(); r.choices.pop(); assert.equal(questionContentError(r, doc.sources), MSG.CHOICES);
  r = q(); r.choices[0].why = ''; assert.equal(questionContentError(r, doc.sources), MSG.CHOICES);
  r = q(); r.rule.sourceId = 'nope'; assert.equal(questionContentError(r, doc.sources), MSG.SOURCE);
  r = q(); r.prompt = ' '; assert.equal(questionContentError(r, doc.sources), MSG.PROMPT);
  assert.equal(questionContentError(doc.rounds[0], doc.sources), null);
});
test('a bad round is reported per round and does not make the document fatal', () => {
  const d = clone(doc); d.rounds[2].rule.correctChoice = 'q';
  const v = validateDocument(d);
  assert.deepEqual(v.fatal, []); assert.equal(v.rounds.q3, MSG.KEY); assert.equal(v.rounds.q1, null);
});
test('fatal: wrong schema, missing sources/boss, boss not informal, bad config', () => {
  assert.ok(validateDocument(null).fatal.length > 0);
  let d = clone(doc); d.schemaVersion = 1; assert.ok(validateDocument(d).fatal.some((m) => m.includes('schemaVersion')));
  d = clone(doc); d.sources = []; assert.ok(validateDocument(d).fatal.some((m) => m.includes('sources')));
  d = clone(doc); delete d.boss; assert.ok(validateDocument(d).fatal.some((m) => m.includes('boss')));
  d = clone(doc); d.boss.informal = false; assert.ok(validateDocument(d).fatal.some((m) => m.includes('informal')));
  d = clone(doc); d.config.physics.gravity = 0; assert.ok(validateDocument(d).fatal.some((m) => m.includes('physics.gravity')));
  d = clone(doc); d.config.devices.kinds = [1]; assert.ok(validateDocument(d).fatal.some((m) => m.includes('kinds')));
  d = clone(doc); d.config.physics.angleMaxDeg = 95; assert.ok(validateDocument(d).fatal.length > 0);
});
test('every source is either linked or marked review-pending; unreviewed sources raise warnings', () => {
  const v = validateDocument(doc);
  assert.ok(v.warnings.length > 0);
  for (const s of doc.sources) assert.ok(s.url || s.reviewPending, s.id);
});
