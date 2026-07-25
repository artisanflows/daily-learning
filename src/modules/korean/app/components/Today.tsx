// Today panel — sits under the shared Chrome (topbar + menu bar). A stat panel and the
// two session buttons, plus backup. Learn / Vocabulary now live in the menu bar.

import { useRef } from 'react';
import type { Progress } from '../store/exportImport';

interface Props {
  progress: Progress;
  dueCount: number;
  onStart: () => void;
  onShort: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function Today({ progress, dueCount, onStart, onShort, onExport, onImport }: Props): React.JSX.Element {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <div className="screen">
      <section className="kpanel">
        <h2>Today</h2>
        <div className="kstatgrid">
          <div className="kstat"><b>{dueCount}</b><span>due for review</span></div>
          <div className="kstat"><b>{progress.curriculum_day}</b><span>days done</span></div>
          <div className="kstat"><b>{progress.minutes_logged_total}</b><span>min total</span></div>
        </div>
        <button className="primary wide" style={{ marginTop: 16 }} onClick={onStart}>Start session</button>
        <button className="wide" style={{ marginTop: 10 }} onClick={onShort}>Short session</button>
      </section>

      <section className="kpanel">
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
