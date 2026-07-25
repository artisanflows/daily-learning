import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Card, DomainContent } from './types';
import { freshCard, rateCard, isDue, Rating, type Grade, type StoredCard } from './srs';
import './knowledge.css';

interface Store { get<T>(k: string, f: T): T; set(k: string, v: unknown): void }
interface Props {
  content: DomainContent;
  store: Store;
  onActivity: () => void;
  onStatus: (s: { due: number; newAvailable: number; done: boolean }) => void;
  onHome: () => void;
}
interface Meta { introducedDay: string; introducedCount: number; doneDay: string }
type View = 'home' | 'learn' | 'block' | 'card' | 'summary';

const today = () => new Date().toISOString().slice(0, 10);
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
function matches(card: Card, given: string): boolean {
  const set = card.accept && card.accept.length ? card.accept : card.answer ? [card.answer] : [];
  const g = norm(given);
  return g.length > 0 && set.some((a) => norm(a) === g);
}
const paras = (s: string) => s.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

export function KnowledgeApp({ content, store, onActivity, onStatus, onHome }: Props) {
  const [states, setStates] = useState<Record<string, StoredCard>>(() => store.get('cards', {}));
  const [meta, setMeta] = useState<Meta>(() => store.get<Meta>('meta', { introducedDay: '', introducedCount: 0, doneDay: '' }));
  const [read, setRead] = useState<Record<string, 1>>(() => store.get('read', {}));
  const [view, setView] = useState<View>('home');
  // learn navigation
  const [blockId, setBlockId] = useState<string | null>(null);
  const [page, setPage] = useState(-1); // -1 = primer, 0..n-1 = lessons
  // review session
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const tally = useRef({ reviewed: 0, correct: 0, introduced: 0 });

  const introducedToday = meta.introducedDay === today() ? meta.introducedCount : 0;
  const dueCards = useMemo(() => content.cards.filter((c) => states[c.id] && isDue(states[c.id]!)), [content, states]);
  const newCards = useMemo(() => content.cards.filter((c) => !states[c.id]), [content, states]);
  const newAvailable = Math.max(0, Math.min(content.newPerDay - introducedToday, newCards.length));

  useEffect(() => {
    onStatus({ due: dueCards.length, newAvailable, done: meta.doneDay === today() });
  }, [dueCards.length, newAvailable, meta.doneDay, onStatus]);

  const persist = useCallback((s: Record<string, StoredCard>, m: Meta) => { store.set('cards', s); store.set('meta', m); }, [store]);
  const accentStyle = { '--accent': content.accent } as CSSProperties;
  const Back = ({ onClick }: { onClick: () => void }) => (
    <div className="mod-knowledge__back"><button type="button" onClick={onClick}>← Back</button></div>
  );

  /* ---------------- Review session ---------------- */
  const start = () => {
    const q = [...dueCards, ...newCards.slice(0, newAvailable)];
    if (!q.length) return;
    tally.current = { reviewed: 0, correct: 0, introduced: 0 };
    setQueue(q); setIdx(0); setRevealed(false); setInput(''); setResult(null); setView('card');
  };
  const cur = queue[idx];
  const isNew = !!cur && !states[cur.id];
  const applyRating = (rating: Grade) => {
    if (!cur) return;
    const now = new Date();
    const next = rateCard(states[cur.id] ?? freshCard(now), rating, now);
    const s2 = { ...states, [cur.id]: next };
    let m2 = meta;
    if (isNew) { m2 = { ...meta, introducedDay: today(), introducedCount: introducedToday + 1 }; tally.current.introduced++; }
    tally.current.reviewed++;
    if (rating !== Rating.Again) tally.current.correct++;
    setStates(s2); setMeta(m2); persist(s2, m2);
    if (idx + 1 >= queue.length) {
      const done = { ...m2, doneDay: today() };
      setMeta(done); store.set('meta', done); onActivity(); setView('summary');
    } else { setIdx(idx + 1); setRevealed(false); setInput(''); setResult(null); }
  };

  /* ---------------- Learn: block reader ---------------- */
  const block = content.blocks.find((b) => b.id === blockId) ?? null;
  const openBlock = (id: string) => { setBlockId(id); setPage(-1); setView('block'); };
  const finishBlock = () => {
    if (blockId) { const r = { ...read, [blockId]: 1 as const }; setRead(r); store.set('read', r); }
    setView('learn');
  };

  /* ================= Render ================= */
  if (view === 'summary') {
    const t = tally.current;
    return (
      <div className="mod-knowledge" style={accentStyle}>
        <Back onClick={() => setView('home')} />
        <div className="k-screen k-center">
          <h1>Done</h1>
          <p className="dl-muted">{t.reviewed} cards · {t.correct} correct · {t.introduced} new</p>
          <button className="dl-btn dl-btn--accent" onClick={() => setView('home')}>Back</button>
        </div>
      </div>
    );
  }

  if (view === 'card' && cur) {
    const typed = cur.type !== 'why';
    return (
      <div className="mod-knowledge" style={accentStyle}>
        <Back onClick={() => setView('home')} />
        <div className="k-screen">
          <div className="k-progress dl-muted">{idx + 1} / {queue.length}{isNew ? ' · new' : ''}{cur.tag ? ' · ' + cur.tag : ''}</div>
          <div className="k-card">
            {cur.image && <img className="k-img" src={cur.image} alt="" />}
            <p className="k-prompt">{cur.prompt}</p>
            {revealed && (
              <div className="k-reveal">
                {typed && <p className={result ? 'k-ok' : 'k-no'}>{result ? 'Correct' : 'Answer: ' + (cur.answer ?? '')}</p>}
                <p className="k-explain">{cur.explanation}</p>
                <p className="k-source dl-muted">{cur.source}</p>
              </div>
            )}
          </div>
          <div className="k-thumb">
            {typed && !revealed && (
              <>
                <input className="k-input" autoFocus value={input} placeholder="Type your answer"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) { setResult(matches(cur, input)); setRevealed(true); } }} />
                <button className="dl-btn dl-btn--accent" disabled={!input.trim()} onClick={() => { setResult(matches(cur, input)); setRevealed(true); }}>Check</button>
              </>
            )}
            {typed && revealed && <button className="dl-btn dl-btn--accent" onClick={() => applyRating(result ? Rating.Good : Rating.Again)}>Continue</button>}
            {!typed && !revealed && <button className="dl-btn dl-btn--accent" onClick={() => setRevealed(true)}>Reveal</button>}
            {!typed && revealed && (
              <div className="k-grades">
                <button className="k-g k-g-again" onClick={() => applyRating(Rating.Again)}>Again</button>
                <button className="k-g k-g-hard" onClick={() => applyRating(Rating.Hard)}>Hard</button>
                <button className="k-g k-g-good" onClick={() => applyRating(Rating.Good)}>Good</button>
                <button className="k-g k-g-easy" onClick={() => applyRating(Rating.Easy)}>Easy</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'block' && block) {
    const onPrimer = page < 0;
    const lesson = onPrimer ? null : block.lessons[page];
    const total = block.lessons.length;
    const atEnd = page >= total - 1;
    return (
      <div className="mod-knowledge" style={accentStyle}>
        <Back onClick={() => setView('learn')} />
        <div className="k-screen">
          <div className="k-progress dl-muted">{block.title} · {onPrimer ? 'overview' : `lesson ${page + 1} / ${total}`}</div>
          <div className="k-lesson">
            {onPrimer ? (
              <>
                <h2>{block.title}</h2>
                {paras(block.primer).map((p, i) => <p key={i} className="k-body">{p}</p>)}
              </>
            ) : lesson ? (
              <>
                <h2>{lesson.title}</h2>
                {lesson.diagram && <div className="k-diagram" dangerouslySetInnerHTML={{ __html: lesson.diagram }} />}
                {paras(lesson.body).map((p, i) => <p key={i} className="k-body">{p}</p>)}
              </>
            ) : null}
          </div>
          <div className="k-thumb">
            <div className="k-navrow">
              <button className="dl-btn" onClick={() => (onPrimer ? setView('learn') : setPage(page - 1))}>◀ Back</button>
              {atEnd
                ? <button className="dl-btn dl-btn--accent" onClick={finishBlock}>Finish ✓</button>
                : <button className="dl-btn dl-btn--accent" onClick={() => setPage(page + 1)}>Next ▶</button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'learn') {
    return (
      <div className="mod-knowledge" style={accentStyle}>
        <Back onClick={() => setView('home')} />
        <div className="k-screen">
          <h1>Learn</h1>
          <div className="k-blocklist">
            {content.blocks.map((b) => (
              <button key={b.id} className="k-blockrow" onClick={() => openBlock(b.id)}>
                <span className="k-blockrow__title">{b.title}</span>
                <span className="k-blockrow__meta dl-muted">{read[b.id] ? 'read ✓' : `${b.lessons.length} lessons`}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // home (subject landing): Learn + Review
  const nothing = dueCards.length + newAvailable === 0;
  const readCount = content.blocks.filter((b) => read[b.id]).length;
  return (
    <div className="mod-knowledge" style={accentStyle}>
      <Back onClick={onHome} />
      <div className="k-screen k-center">
        <h1>{content.title}</h1>
        <p className="dl-muted">{nothing ? 'Review all done for today.' : `${dueCards.length} due · ${newAvailable} new`}</p>
        <div className="k-actions">
          <button className="dl-btn dl-btn--accent" disabled={nothing} onClick={start}>{nothing ? 'Come back tomorrow' : 'Start review'}</button>
          <button className="dl-btn" onClick={() => setView('learn')}>Learn ▸ <span className="dl-muted">{readCount}/{content.blocks.length}</span></button>
        </div>
      </div>
    </div>
  );
}
