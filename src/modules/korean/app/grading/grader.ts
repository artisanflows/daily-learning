// Deterministic grader — specs/08. Synchronous, local, no network, no fuzz.
// Accept-set membership after normalisation; wrong answers route through the
// error-pattern table; the fallback is expected + note, never bare "incorrect".

import type { ErrorPattern, GrammarItem } from '../content/types';
import { normalizeAnswer } from '../utils/nfc';

export interface GradeInput {
  given: string;
  accept: string[];
  grammarPoints: GrammarItem[];
  errorPatterns: ErrorPattern[];
}

export interface GradeResult {
  verdict: 'correct' | 'wrong';
  errorPatternId?: string;
  explanation?: string;
  expected?: string;
}

export function grade(input: GradeInput): GradeResult {
  const given = normalizeAnswer(input.given);
  const accept = input.accept.map(normalizeAnswer);

  // Exact set membership. No fuzzy matching — in Korean a one-character
  // difference is frequently a different particle, which is what's being tested.
  if (accept.includes(given)) return { verdict: 'correct' };

  const expected = input.accept[0] ?? '';

  // Error-pattern table: a pattern matches when swapping the learner's wrong
  // piece for the expected one produces an accepted answer. Deterministic,
  // authored, offline — better than model output for a known finite error set.
  for (const pattern of input.errorPatterns) {
    const { expected: want, given: got } = pattern.when;
    if (!given.includes(got)) continue;
    const repaired = normalizeAnswer(given.replace(got, want));
    if (accept.includes(repaired)) {
      return { verdict: 'wrong', errorPatternId: pattern.id, explanation: pattern.explain.trim(), expected };
    }
  }

  // Fallback: expected answer plus the relevant grammar note (specs/08 §4).
  const note = input.grammarPoints
    .map((g) => g.contrast?.trim() || g.meaning.trim())
    .find((text) => text.length > 0);
  const result: GradeResult = { verdict: 'wrong', expected };
  if (note) result.explanation = note;
  return result;
}
