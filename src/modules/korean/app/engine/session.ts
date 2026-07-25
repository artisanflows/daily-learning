// The daily session state machine (specs/03 §1). Pure reducer — components
// render; this decides. REVIEW → NEW → PRODUCE → SUMMARY, with the minimum
// viable day path skipping straight from REVIEW to SUMMARY.

import { REVIEW_BLOCK_SECONDS } from './srs';

export type SessionPhase = 'idle' | 'review' | 'new' | 'produce' | 'summary';

export interface SessionState {
  phase: SessionPhase;
  /** Minimum viable day: REVIEW → SUMMARY only. Counts fully for the streak. */
  short: boolean;
  reviewsDone: number;
  reviewsCorrect: number;
  newIntroduced: number;
  /** Seconds spent in REVIEW — INV-3 hard-stops the block at 360. */
  reviewSeconds: number;
  startedAt: string;
}

export type SessionEvent =
  | { type: 'START'; short: boolean; now: Date }
  | { type: 'REVIEW_ANSWERED'; correct: boolean }
  | { type: 'REVIEW_TICK'; seconds: number }
  | { type: 'REVIEW_EXHAUSTED' }
  | { type: 'NEW_CARD_INTRODUCED' }
  | { type: 'NEW_DONE' }
  | { type: 'PRODUCE_DONE' }
  | { type: 'FINISH' };

export function initialSession(): SessionState {
  return {
    phase: 'idle',
    short: false,
    reviewsDone: 0,
    reviewsCorrect: 0,
    newIntroduced: 0,
    reviewSeconds: 0,
    startedAt: '',
  };
}

/** INV-3: remaining due cards carry to tomorrow. No penalty, no warning. */
export const reviewTimeUp = (state: SessionState): boolean =>
  state.reviewSeconds >= REVIEW_BLOCK_SECONDS;

export function reduceSession(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case 'START':
      return {
        ...initialSession(),
        phase: 'review',
        short: event.short,
        startedAt: event.now.toISOString(),
      };
    case 'REVIEW_ANSWERED':
      if (state.phase !== 'review') return state;
      return {
        ...state,
        reviewsDone: state.reviewsDone + 1,
        reviewsCorrect: state.reviewsCorrect + (event.correct ? 1 : 0),
      };
    case 'REVIEW_TICK': {
      if (state.phase !== 'review') return state;
      const next = { ...state, reviewSeconds: event.seconds };
      // Hard stop — the block ends, the session continues.
      return reviewTimeUp(next) ? leaveReview(next) : next;
    }
    case 'REVIEW_EXHAUSTED':
      if (state.phase !== 'review') return state;
      return leaveReview(state);
    case 'NEW_CARD_INTRODUCED':
      if (state.phase !== 'new') return state;
      return { ...state, newIntroduced: state.newIntroduced + 1 };
    case 'NEW_DONE':
      if (state.phase !== 'new') return state;
      return { ...state, phase: 'produce' };
    case 'PRODUCE_DONE':
      if (state.phase !== 'produce') return state;
      return { ...state, phase: 'summary' };
    case 'FINISH':
      return { ...state, phase: 'idle' };
    default:
      return state;
  }
}

function leaveReview(state: SessionState): SessionState {
  // MVD path: a short session skips NEW and PRODUCE entirely.
  return { ...state, phase: state.short ? 'summary' : 'new' };
}
