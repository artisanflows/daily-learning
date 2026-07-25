// Vocabulary drill — multiple choice, no typing, organised into practical TOPIC PACKS
// (things / food / dining / signs / core curriculum). Two directions:
//   KO → EN  (see 한글, pick the meaning)
//   EN → KO  (see the meaning, pick the correct Korean — i.e. sign/menu reading)
// Practical priority (2026-07-25): reading menus and signs beats producing sentences.

import { useMemo, useState } from 'react';
import type { ContentJson, VocabItem } from '../content/types';
import { speakKorean } from '../utils/audio';

type Dir = 'ko2en' | 'en2ko';
const ROUND = 12;

const TOPIC_LABELS: Record<string, string> = {
  all: 'All', things: 'Things', food: 'Food', restaurant: 'Dining', signs: 'Signs', core: 'Course',
};

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; }
  return r;
}

interface Q { item: VocabItem; options: VocabItem[] }
function buildDeck(pool: VocabItem[], all: VocabItem[]): Q[] {
  return shuffle(pool).slice(0, ROUND).map((item) => {
    // Distractors from the same topic when possible — harder, more instructive.
    const near = all.filter((v) => v.id !== item.id && (v.topic ?? 'core') === (item.topic ?? 'core'));
    const rest = all.filter((v) => v.id !== item.id && (v.topic ?? 'core') !== (item.topic ?? 'core'));
    const distractors = shuffle(near).slice(0, 3);
    if (distractors.length < 3) distractors.push(...shuffle(rest).slice(0, 3 - distractors.length));
    return { item, options: shuffle([item, ...distractors]) };
  });
}

export function VocabScreen({ content, onBack }: { content: ContentJson; onBack: () => void }): React.JSX.Element {
  const vocab = useMemo(() => Object.values(content.vocab).filter((v) => v.ko && v.en), [content.vocab]);
  const topics = useMemo(() => {
    const t = [...new Set(vocab.map((v) => v.topic ?? 'core'))];
    const order = ['things', 'food', 'restaurant', 'signs', 'core'];
    return ['all', ...order.filter((x) => t.includes(x))];
  }, [vocab]);
  const [topic, setTopic] = useState('all');
  const [dir, setDir] = useState<Dir>('ko2en');
  const poolFor = (t: string) => (t === 'all' ? vocab : vocab.filter((v) => (v.topic ?? 'core') === t));
  const [deck, setDeck] = useState<Q[]>(() => buildDeck(vocab, vocab));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const restart = (d: Dir, t: string) => {
    setDir(d); setTopic(t); setDeck(buildDeck(poolFor(t), vocab)); setI(0); setPicked(null); setScore(0);
  };

  if (i >= deck.length) {
    // Round complete — tick the Today's-plan box for vocabulary.
    try { localStorage.setItem('kr-plan-vocab', new Date().toISOString().slice(0, 10)); } catch { /* blocked */ }
    return (
      <div className="screen">
        <h2>{score} / {deck.length}</h2>
        <p className="small">Recognition builds across days — a short round daily beats one long cram.</p>
        <div className="thumb-zone">
          <button className="primary wide" onClick={() => restart(dir, topic)}>Again · {TOPIC_LABELS[topic]}</button>
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
      <div className="topic-row">
        {topics.map((t) => (
          <button key={t} className={'topic-chip' + (topic === t ? ' on' : '')} onClick={() => restart(dir, t)}>
            {TOPIC_LABELS[t] ?? t}
          </button>
        ))}
      </div>
      <div className="progress-line">
        <span>{i + 1} / {deck.length} · {score} right</span>
        <span className="seg">
          <button className={dir === 'ko2en' ? 'on' : ''} onClick={() => restart('ko2en', topic)}>한글 → EN</button>
          <button className={dir === 'en2ko' ? 'on' : ''} onClick={() => restart('en2ko', topic)}>EN → 한글</button>
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
