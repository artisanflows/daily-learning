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

const today = () => new Date().toISOString().slice(0, 10);
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
function matches(card: Card, given: string): boolean {
  const set = card.accept && card.accept.length ? card.accept : card.answer ? [card.answer] : [];
  const g = norm(given);
  return g.length > 0 && set.some((a) => norm(a) === g);
}

export function KnowledgeApp({ content, store, onActivity, onStatus, onHome }: Props) {
  const [states, setStates] = useState<Record<string, StoredCard>>(() => store.get('cards', {}));
  const [meta, setMeta] = useState<Meta>(() => store.get<Meta>('meta', { introducedDay: '', introducedCount: 0, doneDay: '' }));
  const [phase, setPhase] = useState<'today' | 'card' | 'summary'>('today');
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

  const start = () => {
    const q = [...dueCards, ...newCards.slice(0, newAvailable)];
    if (!q.length) return;
    tally.current = { reviewed: 0, correct: 0, introduced: 0 };
    setQueue(q); setIdx(0); setRevealed(false); setInput(''); setResult(null); setPhase('card');
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
      setMeta(done); store.set('meta', done); onActivity(); setPhase('summary');
    } else {
      setIdx(idx + 1); setRevealed(false); setInput(''); setResult(null);
    }
  };

  const accentStyle = { '--accent': content.accent } as CSSProperties;

  if (phase === 'summary') {
    const t = tally.current;
    return (
      <div className="mod-knowledge" style={accentStyle}>
        <div className="mod-knowledge__back"><button type="button" onClick={onHome}>← Back</button></div>
        <div className="k-screen k-center">
          <h1>Done</h1>
          <p className="dl-muted">{t.reviewed} cards · {t.correct} correct · {t.introduced} new</p>
          <button className="dl-btn dl-btn--accent" onClick={onHome}>Back to home</button>
        </div>
      </div>
    );
  }

  if (phase === 'card' && cur) {
    const typed = cur.type !== 'why';
    return (
      <div className="mod-knowledge" style={accentStyle}>
        <div className="mod-knowledge__back"><button type="button" onClick={onHome}>← Back</button></div>
        <div className="k-screen">
          <div className="k-progress dl-muted">{idx + 1} / {queue.length}{isNew ? ' · new' : ''}{cur.tag ? ' · ' + cur.tag : ''}</div>
          <div className="k-card">
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
            {typed && revealed && (
              <button className="dl-btn dl-btn--accent" onClick={() => applyRating(result ? Rating.Good : Rating.Again)}>Continue</button>
            )}
            {!typed && !revealed && (
              <button className="dl-btn dl-btn--accent" onClick={() => setRevealed(true)}>Reveal</button>
            )}
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

  // Today
  const nothing = dueCards.length + newAvailable === 0;
  return (
    <div className="mod-knowledge" style={accentStyle}>
      <div className="mod-knowledge__back"><button type="button" onClick={onHome}>← Back</button></div>
      <div className="k-screen k-center">
        <h1>{content.title}</h1>
        <p className="dl-muted">{nothing ? 'All done for today.' : `${dueCards.length} due · ${newAvailable} new`}</p>
        <button className="dl-btn dl-btn--accent" disabled={nothing} onClick={start}>{nothing ? 'Come back tomorrow' : 'Start'}</button>
      </div>
    </div>
  );
}
