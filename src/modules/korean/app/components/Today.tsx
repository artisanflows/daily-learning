// Today panel — sits under the shared Chrome (topbar + menu bar). A stat panel, a
// chess-style "Today's plan" mixing the three modes (session / vocab / phrases), and backup.
// Goal framing: TOPIK I on the horizon, but PRACTICAL first — Simon's family speaks
// Korean, so reading menus and signs beats producing business sentences.

import { useRef } from 'react';
import type { Progress } from '../store/exportImport';

interface Props {
  progress: Progress;
  dueCount: number;
  onStart: () => void;
  onShort: () => void;
  onGoLearn: () => void;
  onGoVocab: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const mark = (k: string) => { try { return localStorage.getItem(k) === today(); } catch { return false; } };

export function Today({ progress, dueCount, onStart, onShort, onGoLearn, onGoVocab, onExport, onImport }: Props): React.JSX.Element {
  const fileInput = useRef<HTMLInputElement>(null);
  const sessionDone = progress.last_session === today();
  const vocabDone = mark('kr-plan-vocab');
  const learnDone = mark('kr-plan-learn');

  return (
    <div className="screen">
      <section className="dl-panel">
        <h2>Today</h2>
        <div className="dl-statgrid">
          <div className="dl-stat"><b>{dueCount}</b><span>due for review</span></div>
          <div className="dl-stat"><b>{progress.curriculum_day}</b><span>days done</span></div>
          <div className="dl-stat"><b>{progress.minutes_logged_total}</b><span>min total</span></div>
        </div>
        <button className="primary wide" style={{ marginTop: 16 }} onClick={onStart}>Start session</button>
        <button className="wide" style={{ marginTop: 10 }} onClick={onShort}>Short session</button>
      </section>

      <section className="dl-panel">
        <h2>Today’s plan</h2>
        <p className="small" style={{ marginBottom: 12 }}>
          Goal: TOPIK I on the horizon — practical first. Mix the three so every day has
          structure, recognition, and something you can use at the table tonight.
        </p>
        <div className="dl-todo">
          <button className="dl-todo__row" onClick={onStart}>
            <span className={'dl-planbox' + (sessionDone ? ' done' : '')}>{sessionDone && '✓'}</span>
            <span className="dl-todo__label">Daily session<small>{dueCount > 0 ? `${dueCount} due · ` : ''}lesson + reviews</small></span>
            <span className="dl-todo__go">go →</span>
          </button>
          <button className="dl-todo__row" onClick={onGoVocab}>
            <span className={'dl-planbox' + (vocabDone ? ' done' : '')}>{vocabDone && '✓'}</span>
            <span className="dl-todo__label">One vocabulary round<small>things · food · dining · signs</small></span>
            <span className="dl-todo__go">go →</span>
          </button>
          <button className="dl-todo__row" onClick={onGoLearn}>
            <span className={'dl-planbox' + (learnDone ? ' done' : '')}>{learnDone && '✓'}</span>
            <span className="dl-todo__label">Phrases or a lesson<small>say one new phrase at dinner</small></span>
            <span className="dl-todo__go">go →</span>
          </button>
        </div>
      </section>

      <section className="dl-panel">
        <h2>Backup</h2>
        <div className="button-row">
          <button onClick={onExport}>Export</button>
          <button onClick={() => fileInput.current?.click()}>Import</button>
        </div>
        <input ref={fileInput} type="file" accept="application/json" hidden
          onChange={(e) => { const file = e.target.files?.[0]; if (file) onImport(file); e.target.value = ''; }} />
      </section>
    </div>
  );
}
