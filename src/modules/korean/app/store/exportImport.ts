// Pure serialization core for export/import — no IndexedDB in this file, so
// the round-trip guarantee (export → import → identical state) is testable
// without a browser. The export IS the backup story (specs/00, WORKFLOW §7).

import type { StoredCard, ReviewLogEntry } from '../engine/srs';

export interface Progress {
  version: 1;
  phase: number;
  /** Index into the compiled curriculum order — the queue pointer, not a calendar. */
  curriculum_day: number;
  streak: number;
  grace_used_this_week: number;
  minutes_logged_total: number;
  /** INV-1 bookkeeping: how many new cards were introduced on new_cards_date. */
  new_cards_today: number;
  new_cards_date: string;
  last_session: string;
}

export interface DayLog {
  date: string;
  lines: string[];
}

export interface ExportedState {
  version: 1;
  exported_at: string;
  cards: Record<string, StoredCard>;
  progress: Progress;
  /** Append-only review history — the one thing that cannot be rebuilt. Always included. */
  reviews: ReviewLogEntry[];
  logs: DayLog[];
}

export function initialProgress(): Progress {
  return {
    version: 1,
    phase: 0,
    curriculum_day: 0,
    streak: 0,
    grace_used_this_week: 0,
    minutes_logged_total: 0,
    new_cards_today: 0,
    new_cards_date: '',
    last_session: '',
  };
}

export function serializeState(
  input: Omit<ExportedState, 'version' | 'exported_at'>,
  now: Date,
): string {
  const state: ExportedState = { version: 1, exported_at: now.toISOString(), ...input };
  return JSON.stringify(state, null, 1);
}

/**
 * Parse and validate an export. Throws with a plain-English message on
 * malformed input — corrupt state is surfaced, never silently accepted
 * or overwritten (DESIGN §6).
 */
export function parseExport(json: string): ExportedState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('This file is not valid JSON — it may be truncated or not an export file.');
  }
  if (typeof raw !== 'object' || raw === null) throw new Error('This file does not contain an export object.');
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) throw new Error(`Unsupported export version: ${String(obj.version)}.`);
  if (typeof obj.cards !== 'object' || obj.cards === null) throw new Error('Export is missing its cards.');
  if (typeof obj.progress !== 'object' || obj.progress === null) throw new Error('Export is missing progress.');
  if (!Array.isArray(obj.reviews)) throw new Error('Export is missing the review history.');
  if (!Array.isArray(obj.logs)) throw new Error('Export is missing session logs.');
  for (const [key, card] of Object.entries(obj.cards as Record<string, unknown>)) {
    const c = card as Record<string, unknown>;
    if (typeof c.due !== 'string' || typeof c.reps !== 'number') {
      throw new Error(`Card "${key}" is malformed — refusing to import a damaged backup.`);
    }
  }
  return raw as ExportedState;
}
