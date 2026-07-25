import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { LearningModule } from '../../platform/module';
import { moduleStorage, todayStr } from '../../platform/storage';
import { WINE } from './content';

interface WStatus { due: number; newAvailable: number; done: boolean; day: string }

// Wine — first knowledge domain. Uses the shared knowledge-core session runner (lazy-loaded).
// Card SRS state lives in the platform storage island, so it's covered by unified sync for
// free (no dumpData needed — unlike chess/korean whose data sits outside the island).
export function wineModule(): LearningModule {
  const store = moduleStorage('wine');
  let root: Root | null = null;
  let token = 0;

  return {
    id: 'wine',
    title: 'Wine',
    blurb: WINE.blurb,
    accent: WINE.accent,
    prefersTheme: 'light',

    async mount(container, ctx) {
      const mine = ++token;
      container.innerHTML = '';
      const host = document.createElement('div');
      container.appendChild(host);
      const mod = await import('../knowledge-core/KnowledgeApp');  // lazy: ts-fsrs + session UI
      if (mine !== token) return;
      root = createRoot(host);
      root.render(createElement(mod.KnowledgeApp, {
        content: WINE,
        store,
        onActivity: () => ctx.markActivity(),
        onStatus: (s: { due: number; newAvailable: number; done: boolean }) =>
          store.set('status', { ...s, day: todayStr() } satisfies WStatus),
        onHome: () => ctx.goHome(),
      }));
    },

    unmount() { token++; if (root) { root.unmount(); root = null; } },

    getDailyStatus() {
      const s = store.get<WStatus | null>('status', null);
      if (!s) return { dueCount: 0, newAvailable: WINE.newPerDay, minutes: 5, done: false };
      const fresh = s.day === todayStr();
      const na = fresh ? s.newAvailable : WINE.newPerDay;
      return { dueCount: s.due, newAvailable: na, minutes: Math.max(3, Math.round((s.due + na) * 0.4)), done: fresh && s.done };
    },

    exportState() { return store.get<WStatus | null>('status', null); },
    importState() { /* card SRS state rides in the platform island → covered by unified sync */ },
  };
}
