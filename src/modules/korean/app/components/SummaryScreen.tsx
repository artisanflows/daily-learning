// SUMMARY — counts, tomorrow's first item, and the listening prescription
// (specs/03 §9): a specific named thing for today's dead time.

import { useEffect } from 'react';
import type { ContentJson, CurriculumDay } from '../content/types';
import type { SessionState } from '../engine/session';
import type { Progress } from '../store/exportImport';

// v0 prescriptions: a small named rotation. Grows with the curriculum post-freeze.
const PRESCRIPTIONS = [
  'TTMIK "Iyagi" beginner episode — one, at 0.8×, just listen.',
  'One Pororo episode with Korean subtitles — cartoons are honest beginner input.',
  'Replay today\'s three sentences from memory while making coffee.',
  'One K-drama scene (2 min), Korean subtitles, played twice.',
  'TTMIK Level 1 podcast episode — any one, while walking.',
  'Ask your wife one 이거 한국말로 뭐예요? and use the answer three times today.',
];

interface Props {
  content: ContentJson;
  day: CurriculumDay | undefined;
  session: SessionState;
  progress: Progress;
  onMounted: () => Promise<void>;
  onDone: () => void;
}

export function SummaryScreen({ content, day, session, progress, onMounted, onDone }: Props): React.JSX.Element {
  useEffect(() => {
    void onMounted();
  }, [onMounted]);

  // Derive from today's day, not from progress — finalize advances the
  // pointer while this screen is mounted, which would double-count.
  const todayIndex = day ? content.curriculum.findIndex((d) => d.id === day.id) : -1;
  const tomorrow =
    todayIndex >= 0 ? content.curriculum[todayIndex + (session.short ? 0 : 1)] : undefined;
  const tomorrowFirstSentence = tomorrow?.introduces.sentences[0];
  const prescription = PRESCRIPTIONS[progress.curriculum_day % PRESCRIPTIONS.length];

  return (
    <div className="screen">
      <h2>Done</h2>
      <div className="card-face">
        <p>
          Reviews: {session.reviewsDone}
          {session.reviewsDone > 0 && (
            <span className="small"> ({session.reviewsCorrect} correct)</span>
          )}
        </p>
        <p>New: {session.newIntroduced}</p>
        {session.short && <p className="small">Short session — counts fully.</p>}
      </div>

      {tomorrow && (
        <div className="card-face">
          <p className="small">Tomorrow</p>
          <p style={{ fontSize: 16 }}>{tomorrow.title}</p>
          {tomorrowFirstSentence && content.sentences[tomorrowFirstSentence] && (
            <p className="ko" lang="ko">
              {content.sentences[tomorrowFirstSentence].ko}
            </p>
          )}
        </div>
      )}

      <div className="card-face">
        <p className="small">Listening, sometime today</p>
        <p style={{ fontSize: 16 }}>{prescription}</p>
      </div>

      {day && (
        <p className="small">
          Saturday is consolidation; Sunday is optional. The queue never punishes a slow week.
        </p>
      )}

      <div className="thumb-zone">
        <button className="primary wide" onClick={onDone}>
          Finish
        </button>
      </div>
    </div>
  );
}
