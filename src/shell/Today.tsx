import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { DailyStatus, LearningModule } from '../platform/module';
import { getBudget, setBudget } from '../platform/storage';
import { SettingsCard } from './SettingsCard';

interface Props {
  modules: LearningModule[];
  streak: number;
  onOpen: (id: string) => void;
}

interface Planned { m: LearningModule; s: DailyStatus; dueMin: number; newMin: number; today: number; deferNew: boolean }

// A refined monogram per subject — a glyph, not an emoji.
const GLYPH: Record<string, string> = {
  chess: '♞', korean: '한', wine: 'W', physics: 'P', psychology: 'Ψ', art: 'A',
};

// Spec's allocation: due SRS across every subject first (retention), then new material
// subject by subject until the day's minutes run out. A short day is a complete day.
function planDay(rows: { m: LearningModule; s: DailyStatus }[], budget: number): Planned[] {
  const items: Planned[] = rows.map(({ m, s }) => {
    const cnt = s.dueCount + s.newAvailable;
    const dueMin = cnt > 0 ? Math.round((s.minutes * s.dueCount) / cnt) : (s.dueCount > 0 ? s.minutes : 0);
    const newMin = Math.max(0, s.minutes - dueMin);
    return { m, s, dueMin, newMin, today: dueMin, deferNew: false };
  });
  if (!budget) { items.forEach((i) => { i.today = i.dueMin + i.newMin; }); return items; }
  let remaining = budget - items.reduce((a, i) => a + i.dueMin, 0); // due always included
  for (const i of items) {
    if (i.newMin <= 0 || i.s.done) continue;
    if (remaining >= i.newMin) { i.today += i.newMin; remaining -= i.newMin; }
    else i.deferNew = true;
  }
  return items;
}

const CHIPS: { label: string; min: number }[] = [
  { label: '10m', min: 10 }, { label: '20m', min: 20 }, { label: '30m', min: 30 }, { label: '45m', min: 45 }, { label: 'All', min: 0 },
];

export function Today({ modules, streak, onOpen }: Props) {
  const [budget, setBudgetState] = useState(getBudget());
  const rows = modules.map((m) => ({ m, s: m.getDailyStatus() }));
  const plan = planDay(rows, budget);
  const plannedMin = plan.reduce((a, i) => a + (i.s.done ? 0 : i.today), 0);
  const dueTotal = rows.reduce((a, x) => a + x.s.dueCount, 0);
  const doneCount = rows.filter((x) => x.s.done).length;
  const chooseBudget = (min: number) => { setBudget(min); setBudgetState(min); };

  return (
    <div className="shell dl-module">
      <header className="dl-topbar">
        <span className="shell__logo" aria-hidden="true" />
        <h1 className="dl-topbar__title" style={{ color: 'var(--plat-accent-strong)' }}>Daily Learning</h1>
        <span className="dl-topbar__blurb">chess · korean · wine · art</span>
        <span className="shell__streak" style={{ marginLeft: 'auto' }}>
          {streak > 0
            ? <><span className="ic ic-flame" style={{ color: 'var(--warn)' }} /> {streak}-day streak</>
            : <span className="dl-muted">Start today</span>}
        </span>
      </header>

      <section className="dl-panel">
        <h2>Today</h2>
        <div className="dl-statgrid">
          <div className="dl-stat"><b>{plannedMin}</b><span>min planned</span></div>
          <div className="dl-stat"><b>{dueTotal}</b><span>due for review</span></div>
          <div className="dl-stat"><b>{doneCount}/{rows.length}</b><span>subjects done</span></div>
          <div className="dl-stat"><b>{streak}</b><span>day streak</span></div>
        </div>
        <div className="budget">
          <span className="budget__label"><span className="ic ic-clock" />Time today</span>
          {CHIPS.map((c) => (
            <button key={c.label} className={'budget__chip' + (budget === c.min ? ' is-on' : '')} onClick={() => chooseBudget(c.min)}>{c.label}</button>
          ))}
        </div>
      </section>

      <section className="dl-panel">
        <h2>Today’s plan</h2>
        <p className="dl-muted" style={{ marginBottom: 14 }}>
          {doneCount === rows.length ? 'Everything ticked — nicely paced.' : 'Work top to bottom, or jump to what you fancy. Any tick keeps the streak.'}
        </p>
        <div className="plan-groups">
          {plan.map(({ m, s, today, deferNew }) => {
            const items = m.getPlanItems?.() ?? [{ label: 'Daily session', done: s.done }];
            return (
              <div key={m.id} className="plan-group" style={{ '--accent': m.accent } as CSSProperties}>
                <button className="plan-group__head" onClick={() => onOpen(m.id)}>
                  <span className="plan-group__badge" aria-hidden="true">{GLYPH[m.id] ?? m.title[0]}</span>
                  <span className="plan-group__title">{m.title}</span>
                  <span className="plan-group__meta dl-muted">
                    {s.done ? 'done today ✓' : `~${today} min${deferNew ? ' · new deferred' : ''}`}
                  </span>
                </button>
                <div className="dl-todo">
                  {items.map((it, i) => (
                    <button key={i} className="dl-todo__row" onClick={() => onOpen(m.id)}>
                      <span className={'dl-planbox' + (it.done ? ' done' : '')}>{it.done && <span className="ic ic-check" />}</span>
                      <span className="dl-todo__label">{it.label}{it.sub && <small>{it.sub}</small>}</span>
                      <span className="dl-todo__go">go →</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="dl-panel">
        <h2>Subjects</h2>
        <div className="subject-grid">
          {plan.map(({ m, s }) => (
            <button key={m.id} className="subject-card" style={{ '--accent': m.accent } as CSSProperties} onClick={() => onOpen(m.id)}>
              <div className="subject-card__head">
                <span className="subject-card__badge" aria-hidden="true">{GLYPH[m.id] ?? m.title[0]}</span>
                <span className="subject-card__title">{m.title}</span>
              </div>
              <div className="subject-card__blurb dl-muted">{m.blurb}</div>
              <div className="subject-card__status">
                {s.done
                  ? <span className="subject-card__done"><span className="ic ic-check" />Done today</span>
                  : <span className="subject-card__meta">{s.dueCount} due · {s.newAvailable} new</span>}
              </div>
            </button>
          ))}
        </div>
      </section>

      <SettingsCard />
      <p className="shell__foot dl-muted">More trainers slot in here as they’re built.</p>
    </div>
  );
}
