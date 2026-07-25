// Pure text utilities — no I/O. Korean strings are NFC-normalised on ingest
// and before ANY comparison (CLAUDE.md §Conventions): decomposed jamo from
// some IMEs must never fail an equality check the learner deserved to pass.

export const nfc = (s: string): string => s.normalize('NFC');

/** Normalise for grading: NFC, collapse whitespace, strip terminal punctuation. */
export function normalizeAnswer(s: string): string {
  return nfc(s)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.!?。！？…]+$/u, '')
    .trim();
}

/** True when the input contains Latin letters — the "Korean keyboard not installed" signal (specs/05 §4). */
export const looksLatin = (s: string): boolean => /[A-Za-z]/.test(s);
