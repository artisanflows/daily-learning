// NEW block — the curriculum day decides what happens (specs/03 §3):
// Phase 0 days teach prose + run a drill; Phase 1+ days teach prose/grammar
// and introduce today's new cards (already capped by INV-1 in the queue).

import { useMemo, useState } from 'react';
import type { ContentJson, CurriculumDay } from '../content/types';
import type { QueueCardRef } from '../engine/queue';
import { speakKorean, koreanVoiceCount } from '../utils/audio';

interface Props {
  content: ContentJson;
  day: CurriculumDay | undefined;
  newCards: QueueCardRef[];
  onIntroduced: (ref: QueueCardRef) => Promise<void>;
  onDone: (hasProduce: boolean) => void;
}

export function NewScreen({ content, day, newCards, onIntroduced, onDone }: Props): React.JSX.Element {
  const [step, setStep] = useState<'lesson' | 'cards' | 'drill'>('lesson');
  const [cardIndex, setCardIndex] = useState(0);
  const hasProduce = Boolean(day?.produce_prompt);

  if (!day) {
    // Curriculum exhausted or short content day — reviews still happened, day still counts.
    return (
      <div className="screen">
        <h2>No new material today</h2>
        <p className="small">The curriculum queue is drained. Reviews keep the streak alive.</p>
        <div className="thumb-zone">
          <button className="primary wide" onClick={() => onDone(false)}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === 'lesson') {
    return (
      <div className="screen">
        <p className="small">
          Week {day.week} · Day {day.day}
        </p>
        <h2>{day.title}</h2>
        <div className="lesson">{day.body}</div>
        {day.introduces.grammar.map((gid) => {
          const g = content.grammar[gid];
          return g ? (
            <div className="card-face" key={gid}>
              <h2 lang="ko">{g.name}</h2>
              <p className="gloss">{g.form}</p>
              <p style={{ fontSize: 16 }}>{g.meaning}</p>
              {g.contrast && <p className="small">{g.contrast}</p>}
            </div>
          ) : null;
        })}
        <div className="thumb-zone">
          <button
            className="primary wide"
            onClick={() => setStep(day.drill ? 'drill' : newCards.length > 0 ? 'cards' : 'lesson')}
          >
            {day.drill ? 'Start drill' : newCards.length > 0 ? 'New cards' : 'Continue'}
          </button>
          {!day.drill && newCards.length === 0 && (
            <button className="wide" onClick={() => onDone(hasProduce)}>
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'drill') {
    return day.drill === 'minimal-pairs' ? (
      <MinimalPairDrill content={content} onDone={() => onDone(hasProduce)} />
    ) : (
      <ReadingDrill content={content} dayIndex={day.week * 7 + day.day} onDone={() => onDone(hasProduce)} />
    );
  }

  // step === 'cards' — introduce today's new sentences one at a time.
  const ref = newCards[cardIndex];
  const sentence = ref ? content.sentences[ref.sentenceId] : undefined;
  if (!ref || !sentence) {
    onDone(hasProduce);
    return <div className="screen" />;
  }
  const isFirstCardOfSentence = cardIndex === 0 || newCards[cardIndex - 1]?.sentenceId !== ref.sentenceId;

  return (
    <div className="screen">
      <p className="small">
        New {cardIndex + 1} / {newCards.length}
      </p>
      <div className="card-face card-enter" key={ref.key}>
        {sentence.register === 'honorific' && <span className="register-hon">honorific</span>}
        <p className="ko-prompt" lang="ko">
          {sentence.ko}
        </p>
        <p className="en" style={{ fontSize: 17 }}>
          {sentence.en}
        </p>
        {sentence.literal && <p className="gloss">{sentence.literal}</p>}
        {isFirstCardOfSentence && sentence.note && <p className="small">{sentence.note}</p>}
        <button onClick={() => speakKorean(sentence.ko, { rate: 0.85 })}>▶ Listen</button>
      </div>
      <div className="thumb-zone">
        <button
          className="primary wide"
          onClick={() => {
            // Await the introduction before leaving the block — otherwise the
            // phase changes first and the last card's count event is dropped.
            void onIntroduced(ref).then(() => {
              if (cardIndex + 1 >= newCards.length) onDone(hasProduce);
              else setCardIndex(cardIndex + 1);
            });
          }}
        >
          {cardIndex + 1 >= newCards.length ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  );
}

// ---- Phase 0 drills --------------------------------------------------------

const TRIALS = 10;

function MinimalPairDrill({ content, onDone }: { content: ContentJson; onDone: () => void }): React.JSX.Element {
  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  // Random pair/target/voice per trial is specified behaviour (specs/04 §4).
  const [current, setCurrent] = useState(() => randomTrial(content));

  const play = () => speakKorean(current.target, { rate: 0.85, voiceIndex: current.voice });

  const next = () => {
    setPicked(null);
    setCurrent(randomTrial(content));
    setTrial((t) => t + 1);
  };

  if (trial >= TRIALS) {
    return (
      <div className="screen">
        <h2>
          {correct} / {TRIALS}
        </h2>
        <p className="small">
          Below chance is impossible, below comfortable is expected. The discrimination builds
          across days, not within one drill.
        </p>
        {koreanVoiceCount() < 3 && (
          <p className="small">
            Note: this device has {koreanVoiceCount() || 'no'} Korean voice
            {koreanVoiceCount() === 1 ? '' : 's'} — the drill works best with three (pregenerated
            clips arrive in a later version).
          </p>
        )}
        <div className="thumb-zone">
          <button className="primary wide" onClick={onDone}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <p className="small">
        Trial {trial + 1} / {TRIALS} · {current.pair.contrast}
      </p>
      <div className="card-face">
        <button className="primary" onClick={play}>
          ▶ Play
        </button>
      </div>
      <div className="choice-grid">
        {current.pair.options.map((option) => {
          const isPicked = picked === option;
          const isTarget = option === current.target;
          return (
            <button
              key={option}
              lang="ko"
              className={picked && isTarget ? 'correct' : isPicked ? 'lapse' : ''}
              disabled={picked !== null}
              onClick={() => {
                setPicked(option);
                if (isTarget) setCorrect((c) => c + 1);
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="thumb-zone">
          <p className="small" role="status">
            {picked === current.target ? 'Yes.' : `It was ${current.target}.`}
          </p>
          <button className="primary wide" onClick={next}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function randomTrial(content: ContentJson) {
  const pair = content.minimalPairs[Math.floor(Math.random() * content.minimalPairs.length)] ?? {
    id: 'mp000',
    options: ['달', '탈'],
    contrast: '',
  };
  const target = pair.options[Math.floor(Math.random() * pair.options.length)] ?? pair.options[0]!;
  return { pair, target, voice: Math.floor(Math.random() * 3) };
}

const WORDS_PER_DAY = 12;

function ReadingDrill({
  content,
  dayIndex,
  onDone,
}: {
  content: ContentJson;
  dayIndex: number;
  onDone: () => void;
}): React.JSX.Element {
  // Deterministic rotation through the word list — every word cycles through
  // over the two weeks without repeats clustering.
  const words = useMemo(() => {
    const all = content.readingWords;
    if (all.length === 0) return [];
    const start = (dayIndex * WORDS_PER_DAY) % all.length;
    return Array.from({ length: Math.min(WORDS_PER_DAY, all.length) }, (_, i) => all[(start + i) % all.length]!);
  }, [content.readingWords, dayIndex]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const word = words[index];
  if (!word) {
    onDone();
    return <div className="screen" />;
  }

  return (
    <div className="screen">
      <p className="small">
        Read aloud, under 3 seconds · {index + 1} / {words.length}
      </p>
      <div className="card-face card-enter" key={word.id} style={{ alignItems: 'center' }}>
        <p className="ko-prompt" lang="ko" style={{ fontSize: 48 }}>
          {word.ko}
        </p>
        {revealed && (
          <>
            {word.note && <p className="small">{word.note}</p>}
            <button onClick={() => speakKorean(word.ko, { rate: 0.85 })}>▶ Hear it</button>
          </>
        )}
      </div>
      <div className="thumb-zone">
        {!revealed ? (
          <button className="primary wide" onClick={() => setRevealed(true)}>
            Reveal
          </button>
        ) : (
          <button
            className="primary wide"
            onClick={() => {
              setRevealed(false);
              if (index + 1 >= words.length) onDone();
              else setIndex(index + 1);
            }}
          >
            {index + 1 >= words.length ? 'Done' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}
