// FSRS wrapper shared by all knowledge domains (ts-fsrs, retention 0.85).
// Card scheduling state is stored with Date fields serialised to ISO strings.
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card as FsrsCard, type Grade } from 'ts-fsrs';

const scheduler = fsrs(generatorParameters({ request_retention: 0.85, maximum_interval: 365, enable_fuzz: true }));

// Keep every field ts-fsrs sets (spread), just serialise the two Date fields.
export type StoredCard = { due: string; last_review?: string; reps: number; lapses: number; state: number;[k: string]: unknown };

function toFsrs(c: StoredCard): FsrsCard {
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined } as unknown as FsrsCard;
}
function toStored(c: FsrsCard): StoredCard {
  return { ...c, due: c.due.toISOString(), last_review: c.last_review ? new Date(c.last_review).toISOString() : undefined } as unknown as StoredCard;
}

export function freshCard(now: Date): StoredCard { return toStored(createEmptyCard(now)); }
export function rateCard(card: StoredCard, rating: Grade, now: Date): StoredCard {
  return toStored(scheduler.repeat(toFsrs(card), now)[rating].card);
}
export function isDue(card: StoredCard, now = Date.now()): boolean {
  return new Date(card.due).getTime() <= now;
}
export { Rating };
export type { Grade };
