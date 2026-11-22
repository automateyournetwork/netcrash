// Turns evaluation results into explanation text (FR-006). Pure.
const letter = (q, id) => String.fromCharCode(65 + q.choices.findIndex((c) => c.id === id));
const label = (q, id) => { const c = q.choices.find((x) => x.id === id); return c ? `${letter(q, id)}) ${c.label}` : ''; };

export function explain(result, q) {
  switch (result.status) {
    case 'correct': {
      const nextStep = q.informal ? 'Select Next to take the victory glide.' : 'Select Next to launch again.';
      return { tone: 'correct', headline: `Correct: ${label(q, result.evidence.chosen)}.`, body: q.rule.explanation, nextStep };
    }
    case 'incorrect': {
      const c = q.choices.find((x) => x.id === result.evidence.chosen);
      return {
        tone: 'incorrect', headline: `Not quite: ${label(q, result.evidence.chosen)} is not the answer.`,
        body: c.why, nextStep: 'Try again; retries cost nothing.'
      };
    }
    case 'invalid-input':
      return { tone: 'guidance', headline: 'Select an option', body: 'Choose one of the four options, then Submit. This did not count as an attempt.', nextStep: '' };
    case 'content-error':
      return { tone: 'error', headline: result.evidence.message, body: `Question ${result.evidence.roundId || ''} is unavailable for grading until the content is fixed.`.trim(), nextStep: '' };
    default:
      return { tone: 'error', headline: 'Unexpected result', body: '', nextStep: '' };
  }
}
