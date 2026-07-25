// REVIEW block — one card, full bleed, answer area in the thumb zone.
// Exact match auto-advances as Good (specs/02 §5); a miss shows the expected
// form + authored explanation, then offers Again/Hard only.

import { useEffect, useRef, useState } from 'react';
import type { ContentJson } from '../content/types';
import type { QueueCardRef } from '../engine/queue';
import type { SessionEvent, SessionState } from '../engine/session';
import { REVIEW_BLOCK_SECONDS, Rating } from '../engine/srs';
import { grade, type GradeResult } from '../grading/grader';
import { speakKorean } from '../utils/audio';
import { looksLatin } from '../utils/nfc';

interface Props {
  content: ContentJson;
  due: QueueCardRef[];
  session: SessionState;
  dispatch: (event: SessionEvent) => void;
  onRated: (ref: QueueCardRef, rating: Rating, correct: boolean) => Promise<void>;
}

export function ReviewScreen({ content, due, session, dispatch, onRated }: Props): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [keyboardHint, setKeyboardHint] = useState(false);
  const startRef = useRef<number | null>(null);

  // INV-3 timer: visible, and the one timer that hard-stops.
  useEffect(() => {
    startRef.current ??= Date.now();
    const start = startRef.current;
    const id = setInterval(() => {
      dispatch({ type: 'REVIEW_TICK', seconds: Math.floor((Date.now() - start) / 1000) });
    }, 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  const ref = due[index];
  const sentence = ref ? content.sentences[ref.sentenceId] : undefined;

  // Queue exhausted → leave the block. (Effect, not render-time dispatch.)
  useEffect(() => {
    if (!ref || !sentence) dispatch({ type: 'REVIEW_EXHAUSTED' });
  }, [ref, sentence, dispatch]);

  useEffect(() => {
    // Dictation cards play automatically once per card — user taps to replay.
    if (ref?.type === 'dict' && sentence) speakKorean(sentence.ko, { rate: 0.85 });
  }, [ref, sentence]);

  if (!ref || !sentence) return <div className="screen" />;

  const accept = ref.type === 'cloze' && sentence.cloze ? sentence.cloze.accept : sentence.accept;

  const advance = () => {
    setInput('');
    setResult(null);
    setKeyboardHint(false);
    setIndex((i) => i + 1);
  };

  const submit = () => {
    if (result || input.trim() === '') return;
    // A Latin answer means the Korean keyboard isn't active — setup hint,
    // not a wrong answer (specs/05 §4).
    if (looksLatin(input)) {
      setKeyboardHint(true);
      return;
    }
    const grammarPoints = sentence.grammar
      .map((g) => content.grammar[g])
      .filter((g): g is NonNullable<typeof g> => Boolean(g));
    const r = grade({ given: input, accept, grammarPoints, errorPatterns: content.errorPatterns });
    if (r.verdict === 'correct') {
      // Auto-Good: no button press on a known card keeps 42 reviews inside 6 minutes.
      void onRated(ref, Rating.Good, true);
      advance();
    } else {
      setResult(r);
    }
  };

  const rateWrong = (rating: Rating) => {
    void onRated(ref, rating, false);
    advance();
  };

  const secondsLeft = Math.max(0, REVIEW_BLOCK_SECONDS - session.reviewSeconds);
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="screen">
      <div className="progress-line">
        <span>
          {index + 1} / {due.length}
        </span>
        <span className="timer hard" aria-label="review time remaining">
          {mm}:{ss}
        </span>
      </div>

      <div className="card-face card-enter" key={ref.key}>
        {sentence.register === 'honorific' && <span className="register-hon">honorific</span>}
        {ref.type === 'prod' && (
          <>
            <p className="en" style={{ fontSize: 18 }}>{sentence.en}</p>
            {sentence.literal && <p className="gloss">{sentence.literal}</p>}
          </>
        )}
        {ref.type === 'cloze' && sentence.cloze && (
          <p className="ko-prompt" lang="ko">
            {sentence.ko.replace(sentence.cloze.hidden, '＿＿')}
          </p>
        )}
        {ref.type === 'dict' && (
          <button onClick={() => speakKorean(sentence.ko, { rate: 0.85 })} aria-label="replay audio">
            ▶ Play again
          </button>
        )}
      </div>

      {result && (
        <div className="card-face" role="status">
          <p className="diff-given" lang="ko">{input}</p>
          <p className="diff-expected" lang="ko">{result.expected}</p>
          {result.explanation && <p className="small">{result.explanation}</p>}
        </div>
      )}
      {keyboardHint && (
        <p className="small" role="status">
          That looks like Latin letters. Switch to the Korean keyboard (🌐 key) — if it's not
          installed: Settings → General → Keyboard → Add New Keyboard → Korean.
        </p>
      )}

      <div className="thumb-zone">
        {!result ? (
          <>
            <input
              type="text"
              lang="ko"
              value={input}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              placeholder={ref.type === 'cloze' ? 'Missing piece…' : '한국어로…'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <button className="primary wide" onClick={submit}>
              Check
            </button>
          </>
        ) : (
          <div className="button-row">
            <button className="wide" onClick={() => rateWrong(Rating.Again)}>
              Again
            </button>
            <button className="wide" onClick={() => rateWrong(Rating.Hard)}>
              Hard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
