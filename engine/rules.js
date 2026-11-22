// Pure domain evaluation. No DOM, timers, randomness, or progress changes.
import { LAYER_NAMES, questionContentError } from './content.js';

export { LAYER_NAMES };

// evaluate(question, sources, choiceId) -> { status, reasonCode, evidence }
// Works for every question, including the informal Layer 8 boss. The key comes from the
// authored rule, never from option order or label text.
export function evaluate(q, sources, choiceId) {
  const err = questionContentError(q, sources);
  if (err) return { status: 'content-error', reasonCode: 'CONTENT', evidence: { message: err, roundId: q && q.id } };
  const ids = q.choices.map((c) => c.id);
  if (choiceId === null || choiceId === undefined || choiceId === '') return { status: 'invalid-input', reasonCode: 'NO_SELECTION', evidence: {} };
  if (!ids.includes(choiceId)) return { status: 'invalid-input', reasonCode: 'BAD_CHOICE', evidence: { choiceId } };
  const key = q.rule.correctChoice;
  const evidence = { sourceId: q.rule.sourceId, expectedChoice: key, chosen: choiceId };
  if (choiceId === key) return { status: 'correct', reasonCode: 'OK', evidence };
  return { status: 'incorrect', reasonCode: 'WRONG', evidence };
}
