// ts-fsrs integration. Scheduling is NEVER hand-rolled here (Invariant 1) —
// this module only configures the library, converts to/from storable shapes,
// and owns the three load constants the invariants are built on.

import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs';
import type { Card } from 'ts-fsrs';

/** INV-1 — hard-coded, not a setting. See specs/02-srs-engine.md §4. */
export const NEW_CARDS_PER_DAY = 6;
/** INV-2 — due queue above this suppresses all new cards. */
export const DUE_SUPPRESS_THRESHOLD = 60;
/** INV-3 — the REVIEW block hard-stops at 6:00 elapsed. */
export const REVIEW_BLOCK_SECONDS = 360;

// request_retention 0.85, deliberately below the 0.90 default — the most
// consequential number in the app. Raising it is how sessions quietly grow
// to 45 minutes by month eight. Do not change without a spec change.
export const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.85,
    maximum_interval: 365,
    enable_fuzz: true,
  }),
);

export { Rating };
export type { Card };

export type CardType = 'prod' | 'cloze' | 'dict';

/** Card key format: `{sentence_id}:{card_type}`, e.g. `s0042:prod`. */
export const cardKey = (sentenceId: string, type: CardType): string => `${sentenceId}:${type}`;

export const parseCardKey = (key: string): { sentenceId: string; type: CardType } => {
  const [sentenceId, type] = key.split(':');
  return { sentenceId: sentenceId ?? '', type: (type ?? 'prod') as CardType };
};

/** The ts-fsrs Card with dates as ISO strings — the shape stored in IndexedDB and exports. */
export interface StoredCard extends Omit<Card, 'due' | 'last_review'> {
  due: string;
  last_review?: string;
}

export function toStored(card: Card): StoredCard {
  const { due, last_review, ...rest } = card;
  const stored: StoredCard = { ...rest, due: due.toISOString() };
  if (last_review) stored.last_review = last_review.toISOString();
  return stored;
}

export function fromStored(stored: StoredCard): Card {
  const { due, last_review, ...rest } = stored;
  const card: Card = { ...rest, due: new Date(due) };
  if (last_review) card.last_review = new Date(last_review);
  return card;
}

export function newCard(now: Date): StoredCard {
  return toStored(createEmptyCard(now));
}

/** One review of one card. Returns the updated card only — never touches others (Invariant 4). */
export function rateCard(stored: StoredCard, rating: Rating, now: Date): StoredCard {
  const grade = rating as Exclude<Rating, Rating.Manual>;
  const { card } = scheduler.next(fromStored(stored), now, grade);
  return toStored(card);
}

/** Append-only review log entry — specs/02 §7. */
export interface ReviewLogEntry {
  card_key: string;
  rating: Rating;
  review_time: string;
  elapsed_days: number;
  state: number;
}

export function reviewLogEntry(key: string, stored: StoredCard, rating: Rating, now: Date): ReviewLogEntry {
  return {
    card_key: key,
    rating,
    review_time: now.toISOString(),
    elapsed_days: stored.elapsed_days,
    state: stored.state,
  };
}
