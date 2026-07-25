// Builds the session queue. Pure functions — no storage, no DOM.
// This module is where INV-1 (≤6 new/day) and INV-2 (due>60 suppresses new)
// are enforced, checked at session start before the queue is built.

import type { ContentJson } from '../content/types';
import type { CardType, StoredCard } from './srs';
import { DUE_SUPPRESS_THRESHOLD, NEW_CARDS_PER_DAY, cardKey, parseCardKey } from './srs';

export interface QueueCardRef {
  key: string;
  sentenceId: string;
  type: CardType;
}

/**
 * The global new-card introduction order: curriculum days in order, each day's
 * sentences in listed order, each sentence's declared card types in order.
 * The curriculum is a queue, not a calendar — this list never reshuffles.
 */
export function introductionOrder(content: ContentJson): QueueCardRef[] {
  const order: QueueCardRef[] = [];
  for (const day of content.curriculum) {
    for (const sid of day.introduces.sentences) {
      const sentence = content.sentences[sid];
      if (!sentence) continue;
      for (const type of sentence.cards) {
        order.push({ key: cardKey(sid, type), sentenceId: sid, type });
      }
    }
  }
  return order;
}

export interface BuiltQueue {
  /** Due cards, interleaved by type (specs/03 §2). */
  due: QueueCardRef[];
  /** New cards to introduce this session — empty when INV-2 trips. */
  newCards: QueueCardRef[];
}

export function buildQueue(input: {
  content: ContentJson;
  cards: Record<string, StoredCard>;
  /** How many new cards were already introduced today (INV-1 counts per calendar day). */
  newCardsToday: number;
  now: Date;
}): BuiltQueue {
  const { content, cards, newCardsToday, now } = input;

  const due = Object.entries(cards)
    .filter(([, c]) => new Date(c.due).getTime() <= now.getTime())
    .sort((a, b) => new Date(a[1].due).getTime() - new Date(b[1].due).getTime())
    .map(([key]) => ({ key, ...parseCardKey(key) }));

  // INV-2: a backlog above the threshold suppresses ALL new cards until it drains.
  if (due.length > DUE_SUPPRESS_THRESHOLD) {
    return { due: interleaveByType(due), newCards: [] };
  }

  // INV-1: at most 6 new cards per calendar day, however many sessions happen.
  const budget = Math.max(0, NEW_CARDS_PER_DAY - newCardsToday);
  const newCards = introductionOrder(content)
    .filter((ref) => !(ref.key in cards))
    .slice(0, budget);

  return { due: interleaveByType(due), newCards };
}

/**
 * Deterministic interleave: round-robin across card types in due-date order.
 * Blocked practice feels smoother and performs worse (specs/03 §2); a seeded
 * round-robin interleaves without introducing randomness into the session.
 */
export function interleaveByType(refs: QueueCardRef[]): QueueCardRef[] {
  const byType = new Map<CardType, QueueCardRef[]>();
  for (const ref of refs) {
    const bucket = byType.get(ref.type) ?? [];
    bucket.push(ref);
    byType.set(ref.type, bucket);
  }
  const buckets = [...byType.values()];
  const out: QueueCardRef[] = [];
  let i = 0;
  while (out.length < refs.length) {
    const bucket = buckets[i % buckets.length];
    const next = bucket?.shift();
    if (next) out.push(next);
    if (buckets.every((b) => b.length === 0)) break;
    i++;
  }
  return out;
}
