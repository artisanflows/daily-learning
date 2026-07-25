import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Card, DomainContent, ExploreEntry } from './types';
import { freshCard, rateCard, isDue, Rating, type Grade, type StoredCard } from './srs';
import { WorldMap } from './WorldMap';
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
// The three browse tabs share the chess-style chrome; the rest are focused overlays.
type View = 'tab' | 'block' | 'entry' | 'card' | 'summary';
type Tab = 'today' | 'learn' | 'explore';

const today = () => new Date().toISOString().slice(0, 10);
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
function matches(card: Card, given: string): boolean {
  const set = card.accept && card.accept.length ? card.accept : card.answer ? [card.answer] : [];
  const g = norm(given);
  return g.length > 0 && set.some((a) => norm(a) === g);
}
const paras = (s: string) => s.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; }
  return r;
}
// Build a 4-way multiple-choice set for a typed card: the answer + 3 distractors drawn
// from other cards of the same type. Returns null when there aren't enough distractors
// (then the card falls back to free typing).
function buildOptions(cur: Card, all: Card[]): string[] | null {
  const correct = cur.answer ?? (cur.accept && cur.accept[0]) ?? '';
  if (!correct) return null;
  const acceptSet = new Set((cur.accept ?? [correct]).map(norm));
  const pool = [...new Set(
    all.filter((c) => c.id !== cur.id && c.type === cur.type)
      .map((c) => c.answer ?? (c.accept && c.accept[0]) ?? '')
      .filter((a) => a && !acceptSet.has(norm(a))),
  )];
  const distractors = shuffle(pool).slice(0, 3);
  if (distractors.length < 3) return null;
  return shuffle([correct, ...distractors]);
}

export function KnowledgeApp({ content, store, onActivity, onStatus }: Props) {
  const [states, setStates] = useState<Record<string, StoredCard>>(() => store.get('cards', {}));
  const [meta, setMeta] = useState<Meta>(() => store.get<Meta>('meta', { introducedDay: '', introducedCount: 0, doneDay: '' }));
  const [read, setRead] = useState<Record<string, 1>>(() => store.get('read', {}));
  const [view, setView] = useState<View>('tab');
  const [tab, setTab] = useState<Tab>('today');
  // learn navigation
  const [blockId, setBlockId] = useState<string | null>(null);
  const [page, setPage] = useState(-1); // -1 = primer, 0..n-1 = lessons
  // explore navigation
  const [entryId, setEntryId] = useState<string | null>(null);
  // review session
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [input, setInput] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const tally = useRef({ reviewed: 0, correct: 0, introduced: 0 });

  const introducedToday = meta.introducedDay === today() ? meta.introducedCount : 0;
  const dueCards = useMemo(() => content.cards.filter((c) => states[c.id] && isDue(states[c.id]!)), [content, states]);
  const newCards = useMemo(() => content.cards.filter((c) => !states[c.id]), [content, states]);
  const newAvailable = Math.max(0, Math.min(content.newPerDay - introducedToday, newCards.length));
  const learned = content.cards.length - newCards.length;

  useEffect(() => {
    onStatus({ due: dueCards.length, newAvailable, done: meta.doneDay === today() });
  }, [dueCards.length, newAvailable, meta.doneDay, onStatus]);

  const persist = useCallback((s: Record<string, StoredCard>, m: Meta) => { store.set('cards', s); store.set('meta', m); }, [store]);
  const accentStyle = { '--accent': content.accent } as CSSProperties;

  /* ---------------- Review session ---------------- */
  const start = () => {
    const q = [...dueCards, ...newCards.slice(0, newAvailable)];
    if (!q.length) return;
    tally.current = { reviewed: 0, correct: 0, introduced: 0 };
    setQueue(q); setIdx(0); setRevealed(false); setInput(''); setPicked(null); setResult(null); setView('card');
  };
  const cur = queue[idx];
  const isNew = !!cur && !states[cur.id];
  const options = useMemo(() => (cur && cur.type !== 'why' ? buildOptions(cur, content.cards) : null), [cur, content.cards]);
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
    } else { setIdx(idx + 1); setRevealed(false); setInput(''); setPicked(null); setResult(null); }
  };
  const choose = (opt: string) => {
    if (!cur || revealed) return;
    setPicked(opt); setResult(matches(cur, opt)); setRevealed(true);
  };

  /* ---------------- Learn: block reader ---------------- */
  const block = content.blocks.find((b) => b.id === blockId) ?? null;
  const openBlock = (id: string) => { setBlockId(id); setPage(-1); setView('block'); };
  const finishBlock = () => {
    if (blockId) { const r = { ...read, [blockId]: 1 as const }; setRead(r); store.set('read', r); }
    setTab('learn'); setView('tab');
  };

  /* ---------------- Explore ---------------- */
  const allEntries: ExploreEntry[] = useMemo(() => (content.explore ?? []).flatMap((s) => s.entries), [content.explore]);
  const entry = entryId ? allEntries.find((e) => e.id === entryId) ?? null : null;
  const openEntry = (id: string) => { setEntryId(id); setView('entry'); };
  const hasExplore = (content.explore ?? []).length > 0 || (content.mapPins ?? []).length > 0;
  const readCount = content.blocks.filter((b) => read[b.id]).length;
  const nothing = dueCards.length + newAvailable === 0;

  /* ================= Focused overlays ================= */
  if (view === 'summary') {
    const t = tally.current;
    return (
      <div className="mod-knowledge dl-module" style={accentStyle}>
        <div className="mod-knowledge__back"><button type="button" onClick={() => { setTab('today'); setView('tab'); }}><span className="ic ic-back" /> {content.title}</button></div>
        <div className="k-focus k-center">
          <div className="k-hero__badge"><span className="ic ic-check big" /></div>
          <h1 className="dl-serif">Session complete</h1>
          <p className="dl-muted">{t.reviewed} cards · {t.correct} correct · {t.introduced} new</p>
          <button className="dl-btn dl-btn--accent dl-btn--lg" onClick={() => { setTab('today'); setView('tab'); }}>Back to {content.title}</button>
        </div>
      </div>
    );
  }

  if (view === 'card' && cur) {
    const typed = cur.type !== 'why';
    return (
      <div className="mod-knowledge dl-module" style={accentStyle}>
        <div className="mod-knowledge__back"><button type="button" onClick={() => { setTab('today'); setView('tab'); }}><span className="ic ic-back" /> End session</button></div>
        <div className="k-focus k-focus--narrow">
          <div className="k-progress dl-muted">{idx + 1} / {queue.length}{isNew ? ' · new' : ''}{cur.tag ? ' · ' + cur.tag : ''}</div>
          <div className="k-card">
            {cur.image && <img className="k-img" src={cur.image} alt="" />}
            <p className="k-prompt dl-serif">{cur.prompt}</p>
            {typed && options && (
              <div className="k-options">
                {options.map((opt) => {
                  const state = !revealed ? '' : matches(cur, opt) ? ' is-correct' : opt === picked ? ' is-wrong' : '';
                  return <button key={opt} className={'k-option' + state} disabled={revealed} onClick={() => choose(opt)}>{opt}</button>;
                })}
              </div>
            )}
            {revealed && (
              <div className="k-reveal">
                {typed && <p className={result ? 'k-ok' : 'k-no'}>{result ? 'Correct' : 'Answer: ' + (cur.answer ?? '')}</p>}
                <p className="k-explain">{cur.explanation}</p>
                <p className="k-source dl-muted">{cur.source}</p>
              </div>
            )}
          </div>
          <div className="k-thumb">
            {typed && options && revealed && <button className="dl-btn dl-btn--accent dl-btn--block" onClick={() => applyRating(result ? Rating.Good : Rating.Again)}>Continue</button>}
            {typed && !options && !revealed && (
              <>
                <input className="k-input" autoFocus value={input} placeholder="Type your answer"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) { setResult(matches(cur, input)); setRevealed(true); } }} />
                <button className="dl-btn dl-btn--accent dl-btn--block" disabled={!input.trim()} onClick={() => { setResult(matches(cur, input)); setRevealed(true); }}>Check</button>
              </>
            )}
            {typed && !options && revealed && <button className="dl-btn dl-btn--accent dl-btn--block" onClick={() => applyRating(result ? Rating.Good : Rating.Again)}>Continue</button>}
            {!typed && !revealed && <button className="dl-btn dl-btn--accent dl-btn--block" onClick={() => setRevealed(true)}>Reveal answer</button>}
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
      <div className="mod-knowledge dl-module" style={accentStyle}>
        <div className="mod-knowledge__back"><button type="button" onClick={() => { setTab('learn'); setView('tab'); }}><span className="ic ic-back" /> Lessons</button></div>
        <div className="k-focus k-focus--read">
          <div className="k-progress dl-muted">{block.title} · {onPrimer ? 'overview' : `lesson ${page + 1} / ${total}`}</div>
          <div className="k-lesson">
            {onPrimer ? (
              <><h2 className="dl-serif">{block.title}</h2>{paras(block.primer).map((p, i) => <p key={i} className="k-body">{p}</p>)}</>
            ) : lesson ? (
              <>
                <h2 className="dl-serif">{lesson.title}</h2>
                {lesson.diagram && <div className="k-diagram" dangerouslySetInnerHTML={{ __html: lesson.diagram }} />}
                {paras(lesson.body).map((p, i) => <p key={i} className="k-body">{p}</p>)}
              </>
            ) : null}
          </div>
          <div className="k-thumb">
            <div className="k-navrow">
              <button className="dl-btn" onClick={() => (onPrimer ? finishBlock() : setPage(page - 1))}>◀ Back</button>
              {atEnd
                ? <button className="dl-btn dl-btn--accent" onClick={finishBlock}>Finish ✓</button>
                : <button className="dl-btn dl-btn--accent" onClick={() => setPage(page + 1)}>Next ▶</button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'entry' && entry) {
    return (
      <div className="mod-knowledge dl-module" style={accentStyle}>
        <div className="mod-knowledge__back"><button type="button" onClick={() => { setTab('explore'); setView('tab'); }}><span className="ic ic-back" /> Explore</button></div>
        <div className="k-focus k-focus--read">
          {entry.image && <img className="k-entry__img" src={entry.image} alt="" />}
          <h1 className="dl-serif k-h1">{entry.title}</h1>
          {entry.subtitle && <p className="k-entry__sub dl-muted">{entry.subtitle}</p>}
          {entry.facts && entry.facts.length > 0 && (
            <div className="k-facts">
              {entry.facts.map((f, i) => <div key={i} className="k-fact"><span className="k-fact__k dl-muted">{f.label}</span><span className="k-fact__v">{f.value}</span></div>)}
            </div>
          )}
          {paras(entry.body).map((p, i) => <p key={i} className="k-body">{p}</p>)}
          {entry.source && <p className="k-source dl-muted">{entry.source}</p>}
        </div>
      </div>
    );
  }

  /* ================= Tabbed chrome (shared, chess-identical) ================= */
  return (
    <div className="mod-knowledge dl-module" style={accentStyle}>
      <header className="dl-topbar">
        <span className="dl-topbar__badge" aria-hidden="true">{content.title[0]}</span>
        <h1 className="dl-topbar__title">{content.title}</h1>
        <span className="dl-topbar__blurb">{content.blurb}</span>
      </header>

      <nav className="dl-tabs">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>Today</button>
        <button className={tab === 'learn' ? 'active' : ''} onClick={() => setTab('learn')}>Learn</button>
        {hasExplore && <button className={tab === 'explore' ? 'active' : ''} onClick={() => setTab('explore')}>Explore</button>}
      </nav>

      {tab === 'today' && (
        <>
          <section className="dl-panel">
            <h2>Today</h2>
            <div className="dl-statgrid">
              <div className="dl-stat"><b>{dueCards.length}</b><span>due for review</span></div>
              <div className="dl-stat"><b>{newAvailable}</b><span>new available</span></div>
              <div className="dl-stat"><b>{learned}/{content.cards.length}</b><span>cards learned</span></div>
              <div className="dl-stat"><b>{readCount}/{content.blocks.length}</b><span>lessons read</span></div>
            </div>
            <button className="dl-btn dl-btn--accent dl-btn--lg" disabled={nothing} onClick={start} style={{ marginTop: 16 }}>
              {nothing ? 'Review all caught up — come back tomorrow' : `Start review · ${dueCards.length + newAvailable} cards`}
            </button>
          </section>

          {content.goal && (
            <section className="dl-panel">
              <h2>{content.goal.title}</h2>
              <p className="dl-muted" style={{ marginBottom: 12 }}>{content.goal.blurb}</p>
              <div className="k-plan">
                {content.blocks.map((b, i) => {
                  const unitCards = content.cards.filter((c) => c.unit === b.id);
                  const unitLearned = unitCards.filter((c) => states[c.id]).length;
                  const pct = unitCards.length ? Math.round((unitLearned / unitCards.length) * 100) : 0;
                  return (
                    <button key={b.id} className="k-planrow" onClick={() => openBlock(b.id)}>
                      <span className="k-planrow__n">{i + 1}</span>
                      <span className="k-planrow__body">
                        <span className="k-planrow__line">
                          <span className="k-planrow__title">{b.title}</span>
                          <span className="k-planrow__meta dl-muted">
                            {read[b.id] ? 'read ✓' : `${b.lessons.length} lessons`}
                            {unitCards.length > 0 && ` · ${unitLearned}/${unitCards.length} cards`}
                          </span>
                        </span>
                        <span className="k-planbar"><span className="k-planbar__fill" style={{ width: pct + '%' }} /></span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="dl-panel">
            <h2>Keep going</h2>
            <p className="dl-muted" style={{ marginBottom: 12 }}>Read the ideas behind the cards, or wander the collection.</p>
            <div className="k-navrow">
              <button className="dl-btn" onClick={() => setTab('learn')}><span className="ic ic-book" /> Learn</button>
              {hasExplore && <button className="dl-btn" onClick={() => setTab('explore')}><span className="ic ic-globe" /> Explore</button>}
            </div>
          </section>
        </>
      )}

      {tab === 'learn' && (
        <section className="dl-panel">
          <h2>Learn</h2>
          <p className="dl-muted" style={{ marginBottom: 12 }}>Read through the ideas, then the review drills them.</p>
          <div className="k-blocklist">
            {content.blocks.map((b, i) => (
              <button key={b.id} className="k-blockrow" onClick={() => openBlock(b.id)}>
                <span className="k-blockrow__n">{i + 1}</span>
                <span className="k-blockrow__body">
                  <span className="k-blockrow__title">{b.title}</span>
                  <span className="k-blockrow__meta dl-muted">{b.lessons.length} lessons</span>
                </span>
                <span className="k-blockrow__mark">{read[b.id] ? <span className="ic ic-check" /> : <span className="ic ic-arrow" />}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === 'explore' && (
        <>
          {content.mapPins && content.mapPins.length > 0 && (
            <section className="dl-panel">
              <h2>Map</h2>
              <div className="k-map"><WorldMap pins={content.mapPins} accent={content.accent} onPick={openEntry} /></div>
            </section>
          )}
          {(content.explore ?? []).map((sec) => (
            <section key={sec.id} className="dl-panel">
              <h2>{sec.title}</h2>
              {sec.blurb && <p className="dl-muted" style={{ marginBottom: 12 }}>{sec.blurb}</p>}
              <div className={sec.kind === 'list' ? 'k-exlist' : 'k-exgrid'}>
                {sec.entries.map((e) => (
                  sec.kind === 'list' ? (
                    <button key={e.id} className="k-exrow" onClick={() => openEntry(e.id)}>
                      <span className="k-exrow__title">{e.title}</span>
                      {e.subtitle && <span className="k-exrow__sub dl-muted">{e.subtitle}</span>}
                    </button>
                  ) : (
                    <button key={e.id} className="k-excard" onClick={() => openEntry(e.id)}>
                      {e.image
                        ? <span className="k-excard__img" style={{ backgroundImage: `url(${e.image})` }} />
                        : <span className="k-excard__mono" aria-hidden="true">{e.title[0]}</span>}
                      <span className="k-excard__title">{e.title}</span>
                      {e.subtitle && <span className="k-excard__sub dl-muted">{e.subtitle}</span>}
                    </button>
                  )
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
