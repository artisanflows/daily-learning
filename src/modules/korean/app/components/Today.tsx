// Today screen — two primary buttons and small numbers. Nothing else (specs/05 §3).

import { useRef } from 'react';
import type { Progress } from '../store/exportImport';

interface Props {
  progress: Progress;
  dueCount: number;
  onStart: () => void;
  onShort: () => void;
  onLearn: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function Today({ progress, dueCount, onStart, onShort, onLearn, onExport, onImport }: Props): React.JSX.Element {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <div className="screen">
      <div style={{ paddingTop: 48 }}>
        <h1 lang="ko">한국어</h1>
        {/* Day-streak lives on the Daily Learning home now (platform owns it); showing it
            here too would compete with a different number. Keep the local totals. */}
        <p className="small" style={{ marginTop: 8 }}>
          {progress.minutes_logged_total} min total
          {dueCount > 0 ? ` · ${dueCount} due` : ''}
        </p>
      </div>

      <div className="thumb-zone">
        <button className="primary wide" onClick={onStart}>
          Start
        </button>
        <button className="wide" onClick={onShort}>
          Short session
        </button>
        <button className="wide" onClick={onLearn}>
          Learn ▸ browse lessons &amp; grammar
        </button>
        <div className="button-row" style={{ marginTop: 12 }}>
          <button onClick={onExport}>Export</button>
          <button onClick={() => fileInput.current?.click()}>Import</button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
