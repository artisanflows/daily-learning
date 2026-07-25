// Vocabulary — a real learn→review loop (Simon's brief, 2026-07-25):
//   LEARN   introduce up to 20 new words/day (study card: word + meaning + listen),
//           each lands in the "learned" stack with an FSRS schedule.
//   REVIEW  multiple-choice across EVERYTHING learned — the queue is due-first
//           (FSRS decides when the brain needs the reminder), never topic-picked.
//   BROWSE  the reference list by topic pack, learned words ticked.
// Scheduling reuses the app's ts-fsrs engine (engine/srs.ts); state in localStorage.

import { useMemo, useState } from 'react';
import type { ContentJson, VocabItem } from '../content/types';
import { Rating, newCard, rateCard, type StoredCard } from '../engine/srs';
import { speakKorean } from '../utils/audio';

const LEARN_PER_DAY = 20;
const REVIEW_ROUND = 15;
const STORE_KEY = 'kr-vocab-v1';

const TOPIC_LABELS: Record<string, string> = {
  all: 'All', things: 'Things', food: 'Food', restaurant: 'Dining', signs: 'Signs', core: 'Course',
};
const today = () => new Date().toISOString().slice(0, 10);

interface VocabStore { states: Record<string, StoredCard>; day: string; introduced: number }
function loadStore(): VocabStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const s = JSON.parse(raw) as VocabStore; return { states: s.states ?? {}, day: s.day ?? '', introduced: s.introduced ?? 0 }; }
  } catch { /* corrupt/blocked */ }
  return { states: {}, day: '', introduced: 0 };
}
function saveStore(s: VocabStore) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* blocked */ } }

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; }
  return r;
}

type Mode = 'home' | 'learn' | 'review' | 'browse' | 'done-learn' | 'done-review';
type Dir = 'ko2en' | 'en2ko';
interface Q { item: VocabItem; options: VocabItem[] }

function buildQuestions(items: VocabItem[], all: VocabItem[]): Q[] {
  return items.map((item) => {
    const near = all.filter((v) => v.id !== item.id && (v.topic ?? 'core') === (item.topic ?? 'core'));
    const rest = all.filter((v) => v.id !== item.id && (v.topic ?? 'core') !== (item.topic ?? 'core'));
    const distractors = shuffle(near).slice(0, 3);
    if (distractors.length < 3) distractors.push(...shuffle(rest).slice(0, 3 - distractors.length));
    return { item, options: shuffle([item, ...distractors]) };
  });
}

export function VocabScreen({ content, onBack }: { content: ContentJson; onBack: () => void }): React.JSX.Element {
  const vocab = useMemo(() => Object.values(content.vocab).filter((v) => v.ko && v.en), [content.vocab]);
  const byId = useMemo(() => new Map(vocab.map((v) => [v.id, v])), [vocab]);
  const [store, setStore] = useState<VocabStore>(loadStore);
  const [mode, setMode] = useState<Mode>('home');
  const [dir, setDir] = useState<Dir>('ko2en');
  // learn state
  const [learnQueue, setLearnQueue] = useState<VocabItem[]>([]);
  const [li, setLi] = useState(0);
  // review state
  const [questions, setQuestions] = useState<Q[]>([]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  // browse state
  const [topic, setTopic] = useState('all');

  const learnedIds = Object.keys(store.states).filter((id) => byId.has(id));
  const introducedToday = store.day === today() ? store.introduced : 0;
  const learnLeft = Math.max(0, LEARN_PER_DAY - introducedToday);
  const unlearned = vocab.filter((v) => !store.states[v.id]);
  const now = Date.now();
  const dueIds = learnedIds.filter((id) => new Date(store.states[id]!.due).getTime() <= now);

  const persist = (next: VocabStore) => { setStore(next); saveStore(next); };
  const tickPlan = () => { try { localStorage.setItem('kr-plan-vocab', today()); } catch { /* blocked */ } };

  /* ---------------- Learn ---------------- */
  const startLearn = () => {
    if (!learnLeft || !unlearned.length) return;
    setLearnQueue(shuffle(unlearned).slice(0, Math.min(learnLeft, unlearned.length)));
    setLi(0); setMode('learn');
  };
  const gradeNew = (rating: Rating) => {
    const item = learnQueue[li];
    if (!item) return;
    const nw = new Date();
    const card = rateCard(newCard(nw), rating, nw);
    const next: VocabStore = {
      states: { ...store.states, [item.id]: card },
      day: today(),
      introduced: (store.day === today() ? store.introduced : 0) + 1,
    };
    persist(next);
    if (li + 1 >= learnQueue.length) { tickPlan(); setMode('done-learn'); }
    else setLi(li + 1);
  };

  /* ---------------- Review ---------------- */
  const startReview = (extra = false) => {
    const pool = extra
      ? shuffle(learnedIds).slice(0, REVIEW_ROUND)
      : [...dueIds].sort((a, b) => new Date(store.states[a]!.due).getTime() - new Date(store.states[b]!.due).getTime()).slice(0, REVIEW_ROUND);
    if (!pool.length) return;
    setQuestions(buildQuestions(pool.map((id) => byId.get(id)!), vocab));
    setQi(0); setPicked(null); setScore(0); setWrongIds([]); setMode('review');
  };
  const answer = (opt: VocabItem) => {
    const q = questions[qi];
    if (!q || picked) return;
    const right = opt.id === q.item.id;
    setPicked(opt.id);
    if (right) setScore((s) => s + 1); else setWrongIds((w) => [...w, q.item.id]);
    const nw = new Date();
    const prev = store.states[q.item.id];
    if (prev) persist({ ...store, states: { ...store.states, [q.item.id]: rateCard(prev, right ? Rating.Good : Rating.Again, nw) } });
  };
  const nextQ = () => {
    if (qi + 1 >= questions.length) { tickPlan(); setMode('done-review'); }
    else { setQi(qi + 1); setPicked(null); }
  };

  /* ================= Views ================= */
  if (mode === 'learn') {
    const item = learnQueue[li]!;
    return (
      <div className="screen">
        <div className="progress-line"><span>New word {li + 1} / {learnQueue.length}</span><span>{TOPIC_LABELS[item.topic ?? 'core']}</span></div>
        <div className="card-face" style={{ alignItems: 'center', textAlign: 'center', gap: 14 }}>
          <p className="ko-prompt" lang="ko">{item.ko}</p>
          <p className="en" style={{ fontSize: 18 }}>{item.en}</p>
          <button onClick={() => speakKorean(item.ko, { rate: 0.85 })}>▶ Listen</button>
        </div>
        <div className="thumb-zone">
          <button className="primary wide" onClick={() => gradeNew(Rating.Good)}>Got it — next</button>
          <button className="wide" onClick={() => gradeNew(Rating.Easy)}>Already knew this one</button>
          <button className="wide" onClick={() => setMode('home')}>Stop here</button>
        </div>
      </div>
    );
  }

  if (mode === 'review') {
    const q = questions[qi]!;
    const promptKo = dir === 'ko2en';
    const answered = picked !== null;
    return (
      <div className="screen">
        <div className="progress-line">
          <span>{qi + 1} / {questions.length} · {score} right</span>
          <span className="seg">
            <button className={dir === 'ko2en' ? 'on' : ''} onClick={() => setDir('ko2en')}>한글 → EN</button>
            <button className={dir === 'en2ko' ? 'on' : ''} onClick={() => setDir('en2ko')}>EN → 한글</button>
          </span>
        </div>
        <div className="card-face" style={{ alignItems: 'center', textAlign: 'center' }}>
          {promptKo ? <p className="ko-prompt" lang="ko">{q.item.ko}</p> : <p className="ko-prompt">{q.item.en}</p>}
          {promptKo && <button onClick={() => speakKorean(q.item.ko, { rate: 0.85 })}>▶ Listen</button>}
          {answered && !promptKo && <button onClick={() => speakKorean(q.item.ko, { rate: 0.85 })}>▶ Hear it</button>}
        </div>
        <div className="vocab-opts">
          {q.options.map((opt) => {
            const isAns = opt.id === q.item.id;
            const cls = ['', promptKo ? '' : 'ko-opt', answered && isAns ? 'is-correct' : answered && opt.id === picked ? 'is-wrong' : ''].join(' ').trim();
            return (
              <button key={opt.id} className={cls} lang={promptKo ? undefined : 'ko'} disabled={answered} onClick={() => answer(opt)}>
                {promptKo ? opt.en : opt.ko}
              </button>
            );
          })}
        </div>
        <div className="thumb-zone">
          {answered && <button className="primary wide" onClick={nextQ}>{qi + 1 >= questions.length ? 'Finish' : 'Next'}</button>}
        </div>
      </div>
    );
  }

  if (mode === 'done-learn' || mode === 'done-review') {
    const wrong = wrongIds.map((id) => byId.get(id)).filter(Boolean) as VocabItem[];
    return (
      <div className="screen">
        <h2>{mode === 'done-learn' ? `${introducedToday} new today` : `${score} / ${questions.length}`}</h2>
        {mode === 'done-learn'
          ? <p className="small">In the learned stack now — reviews will surface each word right when it starts to fade.</p>
          : <p className="small">Missed words come back sooner automatically.</p>}
        {wrong.length > 0 && (
          <div className="learn-list">
            <p className="small learn-list__head">To revisit</p>
            {wrong.map((w) => (
              <div className="phrase" key={w.id}>
                <div className="phrase__row"><span className="phrase__ko" lang="ko">{w.ko}</span><button onClick={() => speakKorean(w.ko, { rate: 0.85 })}>▶</button></div>
                <span className="phrase__en">{w.en}</span>
              </div>
            ))}
          </div>
        )}
        <div className="thumb-zone">
          {mode === 'done-review' && dueIds.length > 0 && <button className="primary wide" onClick={() => startReview()}>Keep reviewing · {Math.min(dueIds.length, REVIEW_ROUND)} due</button>}
          <button className="wide" onClick={() => setMode('home')}>Back</button>
        </div>
      </div>
    );
  }

  if (mode === 'browse') {
    const topics = ['all', ...['things', 'food', 'restaurant', 'signs', 'core'].filter((t) => vocab.some((v) => (v.topic ?? 'core') === t))];
    const list = topic === 'all' ? vocab : vocab.filter((v) => (v.topic ?? 'core') === topic);
    return (
      <div className="screen">
        <div className="topic-row">
          {topics.map((t) => (
            <button key={t} className={'topic-chip' + (topic === t ? ' on' : '')} onClick={() => setTopic(t)}>{TOPIC_LABELS[t] ?? t}</button>
          ))}
        </div>
        <div className="learn-list">
          {list.map((v) => (
            <div className="phrase" key={v.id}>
              <div className="phrase__row">
                <span className="phrase__ko" lang="ko">{v.ko} {store.states[v.id] && <span className="correct" style={{ fontSize: 14 }}>✓</span>}</span>
                <button onClick={() => speakKorean(v.ko, { rate: 0.85 })}>▶</button>
              </div>
              <span className="phrase__en">{v.en}</span>
            </div>
          ))}
        </div>
        <div className="thumb-zone"><button className="wide" onClick={() => setMode('home')}>Back</button></div>
      </div>
    );
  }

  // home
  return (
    <div className="screen">
      <section className="dl-panel">
        <h2>Vocabulary</h2>
        <div className="dl-statgrid">
          <div className="dl-stat"><b>{learnedIds.length}</b><span>learned of {vocab.length}</span></div>
          <div className="dl-stat"><b>{dueIds.length}</b><span>due for review</span></div>
          <div className="dl-stat"><b>{learnLeft}</b><span>new left today</span></div>
        </div>
        <button className="primary wide" style={{ marginTop: 16 }} disabled={!dueIds.length && !learnedIds.length} onClick={() => (dueIds.length ? startReview() : startReview(true))}>
          {dueIds.length ? `Review · ${Math.min(dueIds.length, REVIEW_ROUND)} due` : learnedIds.length ? 'Extra practice (nothing due)' : 'Review (learn words first)'}
        </button>
        <button className="wide" style={{ marginTop: 10 }} disabled={!learnLeft || !unlearned.length} onClick={startLearn}>
          {unlearned.length === 0 ? 'All words introduced 🎉' : learnLeft ? `Learn new words · up to ${Math.min(learnLeft, unlearned.length)}` : 'Daily 20 done — back tomorrow'}
        </button>
        <button className="wide" style={{ marginTop: 10 }} onClick={() => setMode('browse')}>Browse all words</button>
      </section>
      <section className="dl-panel">
        <h2>How this works</h2>
        <p className="small">Learn introduces words in a study card first — you are never quizzed on a word you haven’t seen. Review then tests across EVERYTHING learned, due-first: the scheduler brings each word back just as it starts to fade. Missed words return sooner.</p>
      </section>
      <div className="thumb-zone"><button className="wide" onClick={onBack}>Back to Today</button></div>
    </div>
  );
}
