// Top-level orchestrator: owns loaded state, the session reducer, and all
// persistence calls. Components below render and call back — they never touch
// storage themselves (DESIGN §2).

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { ContentJson, CurriculumDay } from './content/types';
import { buildQueue, type BuiltQueue, type QueueCardRef } from './engine/queue';
import { initialSession, reduceSession } from './engine/session';
import { Rating, newCard, rateCard, reviewLogEntry, type StoredCard } from './engine/srs';
import {
  appendLogLines,
  appendReview,
  getAllCards,
  getAllLogs,
  getAllReviews,
  getProgress,
  putCard,
  restoreFromExport,
  setProgress,
} from './store/db';
import { initialProgress, parseExport, serializeState, type Progress } from './store/exportImport';
import { Today } from './components/Today';
import { ReviewScreen } from './components/ReviewScreen';
import { NewScreen } from './components/NewScreen';
import { ProduceScreen, type ProduceResult } from './components/ProduceScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { LearnScreen } from './components/LearnScreen';
import { VocabScreen } from './components/VocabScreen';
import { Chrome, type KTab } from './components/Chrome';

const todayStr = (d: Date): string => d.toISOString().slice(0, 10);

function countDue(cards: Record<string, StoredCard>): number {
  const now = Date.now();
  return Object.values(cards).filter((c) => new Date(c.due).getTime() <= now).length;
}

// Platform bridge: optional callbacks let the Daily Learning shell read this module's
// daily status (for the Today screen) and feed the shared streak on completion.
export interface KoreanBridge {
  onSessionComplete?: () => void;
  onStatus?: (s: { due: number; newAvailable: number; done: boolean }) => void;
}

export function App({ content, onSessionComplete, onStatus }: { content: ContentJson } & KoreanBridge): React.JSX.Element {
  const [progress, setProgressState] = useState<Progress | null>(null);
  const [cards, setCards] = useState<Record<string, StoredCard>>({});
  const [queue, setQueue] = useState<BuiltQueue | null>(null);
  const [session, dispatch] = useReducer(reduceSession, undefined, initialSession);
  const [produceResult, setProduceResult] = useState<ProduceResult | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [panel, setPanel] = useState<KTab>('today');
  const finalized = useRef(false);
  // The curriculum day this session runs — captured at START. Progress advances
  // during finalize, so anything session-scoped must not re-derive from progress.
  const [sessionDay, setSessionDay] = useState<CurriculumDay | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      setProgressState(await getProgress());
      const loaded = await getAllCards();
      setCards(loaded);
      setDueCount(countDue(loaded));
    })();
  }, []);

  const day: CurriculumDay | undefined = progress
    ? content.curriculum[Math.min(progress.curriculum_day, content.curriculum.length - 1)]
    : undefined;
  const contentExhausted = progress ? progress.curriculum_day >= content.curriculum.length : false;

  // Report daily status up to the platform shell (for the unified Today screen).
  useEffect(() => {
    if (!progress) return;
    const today = todayStr(new Date());
    const usedNew = progress.new_cards_date === today ? progress.new_cards_today : 0;
    onStatus?.({
      due: dueCount,
      newAvailable: contentExhausted ? 0 : Math.max(0, 6 - usedNew),
      done: progress.last_session === today,
    });
  }, [progress, dueCount, contentExhausted, onStatus]);

  const persistProgress = useCallback(async (p: Progress) => {
    setProgressState(p);
    await setProgress(p);
  }, []);

  const startSession = useCallback(
    (short: boolean) => {
      if (!progress) return;
      const now = new Date();
      // INV-1 bookkeeping is per calendar day — reset the counter on a new date.
      const isToday = progress.new_cards_date === todayStr(now);
      const newCardsToday = isToday ? progress.new_cards_today : 0;
      if (!isToday) {
        void persistProgress({ ...progress, new_cards_today: 0, new_cards_date: todayStr(now) });
      }
      setQueue(buildQueue({ content, cards, newCardsToday, now }));
      setProduceResult(null);
      finalized.current = false;
      setSessionDay(contentExhausted ? undefined : day);
      dispatch({ type: 'START', short, now });
    },
    [progress, cards, content, persistProgress, day, contentExhausted],
  );

  /** One review of one card: grade already decided, rating chosen. Never touches other cards. */
  const handleRated = useCallback(
    async (ref: QueueCardRef, rating: Rating, correct: boolean) => {
      const now = new Date();
      const existing = cards[ref.key];
      if (!existing) return;
      await appendReview(reviewLogEntry(ref.key, existing, rating, now));
      const updated = rateCard(existing, rating, now);
      await putCard(ref.key, updated);
      setCards((prev) => ({ ...prev, [ref.key]: updated }));
      dispatch({ type: 'REVIEW_ANSWERED', correct });
    },
    [cards],
  );

  /** Introduce one new card (NEW block). Counts toward INV-1 via progress. */
  const handleIntroduced = useCallback(
    async (ref: QueueCardRef) => {
      if (!progress) return;
      const now = new Date();
      const card = newCard(now);
      await putCard(ref.key, card);
      setCards((prev) => ({ ...prev, [ref.key]: card }));
      await persistProgress({
        ...progress,
        new_cards_today: (progress.new_cards_date === todayStr(now) ? progress.new_cards_today : 0) + 1,
        new_cards_date: todayStr(now),
      });
      dispatch({ type: 'NEW_CARD_INTRODUCED' });
    },
    [progress, persistProgress],
  );

  /** Runs once when the summary screen mounts: streak, minutes, curriculum pointer, day log. */
  const finalizeSession = useCallback(async () => {
    if (!progress || finalized.current) return;
    finalized.current = true;
    onSessionComplete?.();   // feed the shared platform streak — any completed session counts
    const now = new Date();
    const today = todayStr(now);
    if (progress.last_session === today) {
      // Second session today: log minutes, nothing else moves.
      const minutes = Math.max(1, Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 60000));
      await persistProgress({ ...progress, minutes_logged_total: progress.minutes_logged_total + minutes });
      return;
    }
    const last = progress.last_session ? new Date(progress.last_session) : null;
    const gapDays = last ? Math.round((new Date(today).getTime() - last.getTime()) / 86_400_000) : Infinity;
    let streak = 1;
    let grace = progress.grace_used_this_week;
    if (gapDays === 1) {
      streak = progress.streak + 1;
      if (now.getDay() === 1) grace = 0; // Monday resets the weekly grace day
    } else if (gapDays === 2 && progress.grace_used_this_week === 0) {
      // One grace day per week, applied automatically and silently (specs/03 §8).
      streak = progress.streak + 1;
      grace = 1;
    }
    const minutes = Math.max(1, Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 60000));
    const advance = !session.short && sessionDay ? 1 : 0;
    await persistProgress({
      ...progress,
      phase: sessionDay?.phase ?? progress.phase,
      curriculum_day: progress.curriculum_day + advance,
      streak,
      grace_used_this_week: grace,
      minutes_logged_total: progress.minutes_logged_total + minutes,
      last_session: today,
    });
    const lines = [
      `# ${today} — ${sessionDay ? sessionDay.title : 'Review only'}`,
      `Reviews: ${session.reviewsDone} (${session.reviewsCorrect} correct) · New: ${session.newIntroduced} · Minutes: ${minutes}`,
    ];
    if (produceResult) {
      lines.push('## Production', `Prompt: ${produceResult.prompt}`);
      produceResult.sentences.forEach((s, i) => s.trim() && lines.push(`${i + 1}. ${s}`));
      if (produceResult.selfRating !== null) lines.push(`Self-rating: ${produceResult.selfRating}/3`);
      if (produceResult.uncertain.trim()) lines.push(`Uncertain about: ${produceResult.uncertain.trim()}`);
    }
    await appendLogLines(today, lines);
  }, [progress, session, sessionDay, produceResult, persistProgress, onSessionComplete]);

  const exportState = useCallback(async () => {
    const [allCards, reviews, logs] = await Promise.all([getAllCards(), getAllReviews(), getAllLogs()]);
    const json = serializeState(
      { cards: allCards, progress: progress ?? initialProgress(), reviews, logs },
      new Date(),
    );
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hangugeo-export-${todayStr(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [progress]);

  const importState = useCallback(async (file: File) => {
    try {
      const state = parseExport(await file.text());
      const ok = window.confirm(
        `Restore from this backup? It contains ${Object.keys(state.cards).length} cards and ` +
          `${state.reviews.length} reviews, exported ${state.exported_at.slice(0, 10)}. ` +
          'Current data will be replaced.',
      );
      if (!ok) return;
      await restoreFromExport(state);
      setCards(await getAllCards());
      setProgressState(await getProgress());
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Import failed.');
    }
  }, []);

  if (!progress) return <div className="screen" />;

  switch (session.phase) {
    case 'review':
      return (
        <ReviewScreen
          content={content}
          due={queue?.due ?? []}
          session={session}
          dispatch={dispatch}
          onRated={handleRated}
        />
      );
    case 'new':
      return (
        <NewScreen
          content={content}
          day={sessionDay}
          newCards={queue?.newCards ?? []}
          onIntroduced={handleIntroduced}
          onDone={(hasProduce) => {
            dispatch({ type: 'NEW_DONE' });
            if (!hasProduce) dispatch({ type: 'PRODUCE_DONE' });
          }}
        />
      );
    case 'produce':
      return (
        <ProduceScreen
          content={content}
          day={sessionDay}
          onDone={(result) => {
            setProduceResult(result);
            dispatch({ type: 'PRODUCE_DONE' });
          }}
        />
      );
    case 'summary':
      return (
        <SummaryScreen
          content={content}
          day={sessionDay}
          session={session}
          progress={progress}
          onMounted={finalizeSession}
          onDone={() => {
            setDueCount(countDue(cards));
            dispatch({ type: 'FINISH' });
          }}
        />
      );
    default:
      return (
        <>
          <Chrome tab={panel} onTab={setPanel} />
          {panel === 'today' && (
            <Today
              progress={progress}
              dueCount={dueCount}
              onStart={() => startSession(false)}
              onShort={() => startSession(true)}
              onExport={exportState}
              onImport={importState}
            />
          )}
          {panel === 'learn' && <LearnScreen content={content} currentDay={progress.curriculum_day} />}
          {panel === 'vocab' && <VocabScreen content={content} onBack={() => setPanel('today')} />}
        </>
      );
  }
}
