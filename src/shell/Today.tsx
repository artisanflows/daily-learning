import type { CSSProperties } from 'react';
import type { LearningModule } from '../platform/module';
import { SettingsCard } from './SettingsCard';

interface Props {
  modules: LearningModule[];
  streak: number;
  onOpen: (id: string) => void;
}

export function Today({ modules, streak, onOpen }: Props) {
  const rows = modules.map((m) => ({ m, s: m.getDailyStatus() }));
  const minutesLeft = rows.reduce((a, x) => a + (x.s.done ? 0 : x.s.minutes), 0);
  const allDone = rows.every((x) => x.s.done);

  return (
    <div className="shell">
      <header className="shell__top">
        <div className="shell__brand"><span className="shell__logo" aria-hidden="true" />Daily Learning</div>
        <div className="shell__streak dl-muted">{streak > 0 ? `🔥 ${streak}-day streak` : 'Start today'}</div>
      </header>

      <section className="dl-card today">
        <h1>Today</h1>
        <p className="dl-muted">
          {allDone ? 'All done for today. Nice work.' : `About ${minutesLeft} min across your subjects.`}
        </p>
      </section>

      <div className="subject-grid">
        {rows.map(({ m, s }) => (
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
                : <span className="dl-muted">{s.dueCount} due · {s.newAvailable} new · ~{s.minutes} min</span>}
            </div>
          </button>
        ))}
      </div>

      <p className="shell__foot dl-muted">More trainers slot in here as they're built.</p>

      <SettingsCard />
    </div>
  );
}
