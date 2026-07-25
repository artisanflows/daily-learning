import type { LearningModule } from '../../platform/module';
import { moduleStorage, todayStr } from '../../platform/storage';

interface CStatus { due: number; newAvailable: number; done: boolean; day: string }

// Chess Atelier is a large self-contained vanilla app with an embedded Stockfish engine,
// so it runs as a same-origin embedded sub-app (its own DOM/CSS/engine, fully isolated).
// Same-origin means its localStorage is shared, and a postMessage bridge feeds the
// shell's Today card + the platform streak.
export function chessModule(): LearningModule {
  const store = moduleStorage('chess');
  let listener: ((e: MessageEvent) => void) | null = null;

  return {
    id: 'chess',
    title: 'Chess Atelier',
    blurb: 'Openings · tactics · endgames',
    accent: '#bc5b3d',
    prefersTheme: 'light',

    mount(container, ctx) {
      container.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'mod-chess';
      const back = document.createElement('div');
      back.className = 'mod-chess__back';
      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.textContent = '← Back';
      backBtn.onclick = () => ctx.goHome();
      back.appendChild(backBtn);
      const frame = document.createElement('iframe');
      frame.className = 'mod-chess__frame';
      frame.title = 'Chess Atelier';
      frame.src = './chess/index.html';
      wrap.append(back, frame);
      container.appendChild(wrap);

      listener = (e: MessageEvent) => {
        const d = e.data as { source?: string; due?: number; newAvailable?: number; done?: boolean };
        if (!d || d.source !== 'chess-atelier') return;
        store.set('status', {
          due: Math.max(0, d.due || 0),
          newAvailable: Math.max(0, d.newAvailable || 0),
          done: !!d.done,
          day: todayStr(),
        } satisfies CStatus);
        if (d.done) ctx.markActivity();
      };
      window.addEventListener('message', listener);
    },

    unmount() {
      if (listener) { window.removeEventListener('message', listener); listener = null; }
    },

    getDailyStatus() {
      const s = store.get<CStatus | null>('status', null);
      if (!s) return { dueCount: 0, newAvailable: 2, minutes: 12, done: false };
      const fresh = s.day === todayStr();
      return { dueCount: s.due, newAvailable: fresh ? s.newAvailable : 2, minutes: 12, done: fresh && s.done };
    },

    exportState() { return store.get<CStatus | null>('status', null); },
    importState() { /* status cache only; full data via dumpData/loadData */ },

    // Chess stores everything under its own localStorage key (same-origin, so directly
    // accessible). This is the full learning data for unified platform backup/sync.
    dumpData() {
      try { const raw = localStorage.getItem('sicilian-trainer-v1'); return raw ? JSON.parse(raw) : null; }
      catch { return null; }
    },
    loadData(data) {
      if (data == null) return;
      try { localStorage.setItem('sicilian-trainer-v1', JSON.stringify(data)); } catch { /* blocked */ }
    },
  };
}
