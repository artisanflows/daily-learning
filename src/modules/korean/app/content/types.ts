// Shared shapes for the compiled content artifact (public/content.json).
// Compiled by scripts/build-content.ts — the app never parses MD at runtime.

export type Register = 'honorific' | 'polite' | 'casual';

export interface SentenceItem {
  id: string; // s0001…
  ko: string;
  en: string;
  literal?: string;
  register?: Register;
  grammar: string[];
  vocab: string[];
  /** Accepted answers for production/dictation. Always contains at least `ko`. */
  accept: string[];
  /** Optional cloze: `hidden` is blanked out of `ko`; `accept` are valid fills. */
  cloze?: { hidden: string; accept: string[] };
  /**
   * Which card types this sentence generates. Defaults to [prod, dict].
   * Cloze sentences use [prod, cloze]; 반말 recognition-only uses [dict] —
   * the learner must parse casual speech early but not produce it (specs/06 §1).
   */
  cards: ('prod' | 'dict' | 'cloze')[];
  phase: number;
  tags: string[];
  note?: string;
}

export interface VocabItem {
  id: string; // v0001…
  ko: string;
  en: string;
  pos: string;
  register?: Register;
  first_seen?: string;
  /** Practical topic pack for the vocab drill: 'things' | 'food' | 'restaurant' | 'signs'.
      Items without a topic are the original curriculum vocab ("core"). */
  topic?: string;
}

/** Survival phrases — dining/dietary first (practical priority, 2026-07-25). */
export interface Phrase {
  id: string; // ph001…
  ko: string;
  en: string;
  note?: string;
}

export interface GrammarItem {
  id: string; // g001…
  name: string;
  form: string;
  meaning: string;
  examples: string[];
  contrast?: string;
  phase: number;
}

export interface MinimalPair {
  id: string; // mp001…
  /** The contrast set, 2–3 words, e.g. [달, 탈, 딸]. */
  options: string[];
  /** Which contrast this trains, e.g. "ㄷ/ㅌ/ㄸ initial". */
  contrast: string;
  en?: string[];
}

export interface ReadingWord {
  id: string; // rw001…
  ko: string;
  /** Sound-change note when pronunciation differs from spelling. */
  note?: string;
}

export interface ErrorPattern {
  id: string; // e001…
  when: { expected: string; given: string };
  explain: string;
}

export interface CurriculumDay {
  id: string; // p0-w01-d01…
  phase: number;
  week: number;
  day: number;
  title: string;
  /** Lesson prose for the NEW block, plain text paragraphs. */
  body: string;
  introduces: { grammar: string[]; sentences: string[] };
  /** Phase 0 drills. */
  drill?: 'minimal-pairs' | 'reading';
  produce_prompt?: string;
  produce_models: string[];
}

export interface ContentJson {
  version: 1;
  sentences: Record<string, SentenceItem>;
  vocab: Record<string, VocabItem>;
  grammar: Record<string, GrammarItem>;
  minimalPairs: MinimalPair[];
  readingWords: ReadingWord[];
  errorPatterns: ErrorPattern[];
  /** In curriculum order — this order IS the new-card introduction order. */
  curriculum: CurriculumDay[];
  /** Survival phrasebook (optional — added alongside the compiled artifact). */
  phrasebook?: Phrase[];
}
