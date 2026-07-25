// All storage access goes through src/store/ — no component touches IndexedDB
// directly (DESIGN §2). idb keeps this thin; the logic lives in pure modules.

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { ReviewLogEntry, StoredCard } from '../engine/srs';
import type { DayLog, Progress } from './exportImport';
import { initialProgress } from './exportImport';

interface TrainerDB extends DBSchema {
  cards: { key: string; value: StoredCard };
  progress: { key: string; value: Progress };
  /** Append-only. Nothing in the app deletes or rewrites entries (Invariant 4). */
  reviews: { key: number; value: ReviewLogEntry };
  logs: { key: string; value: DayLog };
}

let dbPromise: Promise<IDBPDatabase<TrainerDB>> | null = null;

function db(): Promise<IDBPDatabase<TrainerDB>> {
  dbPromise ??= openDB<TrainerDB>('hangugeo', 1, {
    upgrade(database) {
      database.createObjectStore('cards');
      database.createObjectStore('progress');
      database.createObjectStore('reviews', { autoIncrement: true });
      database.createObjectStore('logs');
    },
  });
  return dbPromise;
}

export async function getAllCards(): Promise<Record<string, StoredCard>> {
  const d = await db();
  const out: Record<string, StoredCard> = {};
  let cursor = await d.transaction('cards').store.openCursor();
  while (cursor) {
    out[String(cursor.key)] = cursor.value;
    cursor = await cursor.continue();
  }
  return out;
}

/** Writes ONE card. There is deliberately no putAllCards outside import/restore. */
export async function putCard(key: string, card: StoredCard): Promise<void> {
  await (await db()).put('cards', card, key);
}

/** Append-only — add, never put. A key collision throws instead of overwriting. */
export async function appendReview(entry: ReviewLogEntry): Promise<void> {
  await (await db()).add('reviews', entry);
}

export async function getAllReviews(): Promise<ReviewLogEntry[]> {
  return (await db()).getAll('reviews');
}

export async function getProgress(): Promise<Progress> {
  return (await (await db()).get('progress', 'progress')) ?? initialProgress();
}

export async function setProgress(progress: Progress): Promise<void> {
  await (await db()).put('progress', progress, 'progress');
}

export async function appendLogLines(date: string, lines: string[]): Promise<void> {
  const d = await db();
  const existing = (await d.get('logs', date)) ?? { date, lines: [] };
  existing.lines.push(...lines);
  await d.put('logs', existing, date);
}

export async function getAllLogs(): Promise<DayLog[]> {
  return (await db()).getAll('logs');
}

/**
 * Restore from a validated export. The ONLY bulk write in the app, reachable
 * solely from the user-initiated import flow after parseExport has accepted
 * the file — this is the backup restore path, not a mutation affordance.
 */
export async function restoreFromExport(state: {
  cards: Record<string, StoredCard>;
  progress: Progress;
  reviews: ReviewLogEntry[];
  logs: DayLog[];
}): Promise<void> {
  const d = await db();
  const tx = d.transaction(['cards', 'progress', 'reviews', 'logs'], 'readwrite');
  await Promise.all([
    tx.objectStore('cards').clear(),
    tx.objectStore('reviews').clear(),
    tx.objectStore('logs').clear(),
  ]);
  for (const [key, card] of Object.entries(state.cards)) await tx.objectStore('cards').put(card, key);
  await tx.objectStore('progress').put(state.progress, 'progress');
  for (const entry of state.reviews) await tx.objectStore('reviews').add(entry);
  for (const log of state.logs) await tx.objectStore('logs').put(log, log.date);
  await tx.done;
}
