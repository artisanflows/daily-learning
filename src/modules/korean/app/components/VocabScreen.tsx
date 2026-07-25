// Vocabulary drill — multiple choice, no typing. Two directions:
//   KO → EN  (see 한글, pick the meaning)
//   EN → KO  (see the meaning, pick the correct Korean spelling)
// Pure recognition practice over the curriculum's vocab, separate from the SRS session.

import { useMemo, useState } from 'react';
import type { ContentJson, VocabItem } from '../content/types';
import { speakKorean } from '../utils/audio';

type Dir = 'ko2en' | 'en2ko';
const ROUND = 12;

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; }
  return r;
}

interface Q { item: VocabItem; options: VocabItem[] }
function buildDeck(vocab: VocabItem[]): Q[] {
  const pool = vocab.filter((v) => v.ko && v.en);
  return shuffle(pool).slice(0, ROUND).map((item) => {
    const distractors = shuffle(pool.filter((v) => v.id !== item.id)).slice(0, 3);
    return { item, options: shuffle([item, ...distractors]) };
  });
}

export function VocabScreen({ content, onBack }: { content: ContentJson; onBack: () => void }): React.JSX.Element {
  const vocab = useMemo(() => Object.values(content.vocab), [content.vocab]);
  const [dir, setDir] = useState<Dir>('ko2en');
  const [deck, setDeck] = useState<Q[]>(() => buildDeck(vocab));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const restart = (d: Dir) => { setDir(d); setDeck(buildDeck(vocab)); setI(0); setPicked(null); setScore(0); };

  if (i >= deck.length) {
    return (
      <div className="screen">
        <h2>{score} / {deck.length}</h2>
        <p className="small">Recognition builds across sessions — a few minutes a day beats one long cram.</p>
        <div className="thumb-zone">
          <button className="primary wide" onClick={() => restart(dir)}>Again</button>
          <button className="wide" onClick={onBack}>Done</button>
        </div>
      </div>
    );
  }

  const q = deck[i]!;
  const promptKo = dir === 'ko2en';
  const key = (v: VocabItem) => (promptKo ? v.en : v.ko);
  const answered = picked !== null;

  return (
    <div className="screen">
      <div className="progress-line">
        <span>{i + 1} / {deck.length}</span>
        <span className="seg">
          <button className={dir === 'ko2en' ? 'on' : ''} onClick={() => restart('ko2en')}>한글 → EN</button>
          <button className={dir === 'en2ko' ? 'on' : ''} onClick={() => restart('en2ko')}>EN → 한글</button>
        </span>
      </div>

      <div className="card-face" style={{ alignItems: 'center', textAlign: 'center' }}>
        {promptKo
          ? <p className="ko-prompt" lang="ko">{q.item.ko}</p>
          : <p className="ko-prompt">{q.item.en}</p>}
        {promptKo && <button onClick={() => speakKorean(q.item.ko, { rate: 0.85 })}>▶ Listen</button>}
        {answered && q.item.register === 'honorific' && <span className="register-hon">honorific</span>}
      </div>

      <div className="vocab-opts">
        {q.options.map((opt) => {
          const isAns = opt.id === q.item.id;
          const cls = ['', promptKo ? '' : 'ko-opt', answered && isAns ? 'is-correct' : answered && opt.id === picked ? 'is-wrong' : ''].join(' ').trim();
          return (
            <button key={opt.id} className={cls} lang={promptKo ? undefined : 'ko'} disabled={answered}
              onClick={() => { setPicked(opt.id); if (isAns) setScore((s) => s + 1); }}>
              {key(opt)}
            </button>
          );
        })}
      </div>

      <div className="thumb-zone">
        {answered && (
          <button className="primary wide" onClick={() => { setI(i + 1); setPicked(null); }}>
            {i + 1 >= deck.length ? 'See score' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}
