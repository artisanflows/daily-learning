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
  { label: '10', min: 10 }, { label: '20', min: 20 }, { label: '30', min: 30 }, { label: '45', min: 45 }, { label: 'All', min: 0 },
];

export function Today({ modules, streak, onOpen }: Props) {
  const [budget, setBudgetState] = useState(getBudget());
  const rows = modules.map((m) => ({ m, s: m.getDailyStatus() }));
  const plan = planDay(rows, budget);
  const plannedMin = plan.reduce((a, i) => a + (i.s.done ? 0 : i.today), 0);
  const allDone = rows.every((x) => x.s.done);
  const chooseBudget = (min: number) => { setBudget(min); setBudgetState(min); };

  return (
    <div className="shell">
      <header className="shell__top">
        <div className="shell__brand"><span className="shell__logo" aria-hidden="true" />Daily Learning</div>
        <div className="shell__streak dl-muted">{streak > 0 ? `🔥 ${streak}-day streak` : 'Start today'}</div>
      </header>

      <section className="dl-card today">
        <h1>Today</h1>
        <p className="dl-muted">
          {allDone ? 'All done for today. Nice work.' : `About ${plannedMin} min planned across your subjects.`}
        </p>
        <div className="budget">
          <span className="budget__label dl-muted">Time today</span>
          {CHIPS.map((c) => (
            <button key={c.label} className={'budget__chip' + (budget === c.min ? ' is-on' : '')} onClick={() => chooseBudget(c.min)}>{c.label}</button>
          ))}
        </div>
      </section>

      <div className="subject-grid">
        {plan.map(({ m, s, today, deferNew }) => (
          <button
            key={m.id}
            className="subject-card"
            style={{ '--accent': m.accent } as CSSProperties}
            onClick={() => onOpen(m.id)}
          >
            <div className="subject-card__head">
              <span className="subject-card__dot" />
              <span className="subject-card__title">{m.title}</span>
            </div>
            <div className="subject-card__blurb dl-muted">{m.blurb}</div>
            <div className="subject-card__status">
              {s.done
                ? <span className="dl-pill">Done today ✓</span>
                : <span className="dl-muted">{s.dueCount} due · {s.newAvailable} new · ~{today} min{deferNew ? ' · new deferred' : ''}</span>}
            </div>
          </button>
        ))}
      </div>

      <p className="shell__foot dl-muted">More trainers slot in here as they're built.</p>

      <SettingsCard />
    </div>
  );
}
