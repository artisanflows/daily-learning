import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { LearningModule } from '../../platform/module';
import type { ContentJson } from './app/content/types';
import { moduleStorage, todayStr } from '../../platform/storage';
import './app/styles.css';

interface KStatus { due: number; newAvailable: number; done: boolean; day: string }

// Korean trainer as a real in-page module: its React app is lazy-loaded and mounted
// into the shell's container. It keeps its own IndexedDB, FSRS engine, and 단청 skin;
// it reports daily status + session completion to the platform via the bridge callbacks.
export function koreanModule(): LearningModule {
  const store = moduleStorage('korean');
  let root: Root | null = null;
  let token = 0;  // guards against React StrictMode's mount→unmount→mount double-invoke

  return {
    id: 'korean',
    title: '한국어 Korean',
    blurb: 'Daily Korean · ~18 min',
    accent: '#4e9a7c',
    prefersTheme: 'dark',

    async mount(container, ctx) {
      const mine = ++token;
      container.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'mod-korean';
      const back = document.createElement('div');
      back.className = 'mod-korean__back';
      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.textContent = '← Back';
      backBtn.onclick = () => ctx.goHome();
      back.appendChild(backBtn);
      const appEl = document.createElement('div');
      appEl.className = 'mod-korean__app';
      wrap.append(back, appEl);
      container.appendChild(wrap);

      const appMod = await import('./app/App');  // Korean's app code loads lazily
      if (mine !== token) return;  // superseded by a newer mount — bail

      let content: ContentJson;
      try {
        const res = await fetch('./korean/content.json');
        if (!res.ok) throw new Error('content ' + res.status);
        content = (await res.json()) as ContentJson;
      } catch {
        appEl.textContent = 'Could not load Korean content. Connect once so it can store offline.';
        return;
      }
      if (mine !== token) return;

      root = createRoot(appEl);
      root.render(
        createElement(appMod.App, {
          content,
          onSessionComplete: () => ctx.markActivity(),
          onStatus: (s: { due: number; newAvailable: number; done: boolean }) =>
            store.set('status', { ...s, day: todayStr() } satisfies KStatus),
        }),
      );
    },

    unmount() {
      token++;
      if (root) { root.unmount(); root = null; }
    },

    getDailyStatus() {
      const s = store.get<KStatus | null>('status', null);
      if (!s) return { dueCount: 0, newAvailable: 6, minutes: 18, done: false };
      const fresh = s.day === todayStr();
      return { dueCount: s.due, newAvailable: s.newAvailable, minutes: 18, done: fresh && s.done };
    },

    exportState() { return store.get<KStatus | null>('status', null); },
    importState() { /* status cache only; full data via dumpData/loadData */ },

    // Full learning data lives in Korean's IndexedDB — serialize/restore it for unified
    // platform backup + sync. Dynamic imports keep the module lazy.
    async dumpData() {
      const [db, ei] = await Promise.all([import('./app/store/db'), import('./app/store/exportImport')]);
      const [cards, progress, reviews, logs] = await Promise.all([
        db.getAllCards(), db.getProgress(), db.getAllReviews(), db.getAllLogs(),
      ]);
      return JSON.parse(ei.serializeState({ cards, progress: progress ?? ei.initialProgress(), reviews, logs }, new Date()));
    },
    async loadData(data) {
      if (data == null) return;
      const [db, ei] = await Promise.all([import('./app/store/db'), import('./app/store/exportImport')]);
      await db.restoreFromExport(ei.parseExport(JSON.stringify(data)));
    },
  };
}
