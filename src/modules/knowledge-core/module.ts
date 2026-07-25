import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { LearningModule } from '../../platform/module';
import { moduleStorage, todayStr } from '../../platform/storage';
import type { DomainContent } from './types';

interface KStatus { due: number; newAvailable: number; done: boolean; day: string }

// Domain-agnostic wrapper: turns any DomainContent into a platform module.
// Every knowledge domain (wine, physics, psychology, art) is just content + this.
// Card SRS state lives in the platform storage island, so unified sync covers it for free.
export function makeKnowledgeModule(content: DomainContent): LearningModule {
  const store = moduleStorage(content.id);
  let root: Root | null = null;
  let token = 0;

  return {
    id: content.id,
    title: content.title,
    blurb: content.blurb,
    accent: content.accent,
    prefersTheme: 'light',

    async mount(container, ctx) {
      const mine = ++token;
      container.innerHTML = '';
      const host = document.createElement('div');
      container.appendChild(host);
      const mod = await import('./KnowledgeApp');  // lazy: ts-fsrs + session UI
      if (mine !== token) return;
      root = createRoot(host);
      root.render(createElement(mod.KnowledgeApp, {
        content,
        store,
        onActivity: () => ctx.markActivity(),
        onStatus: (s: { due: number; newAvailable: number; done: boolean }) =>
          store.set('status', { ...s, day: todayStr() } satisfies KStatus),
        onHome: () => ctx.goHome(),
      }));
    },

    unmount() { token++; if (root) { root.unmount(); root = null; } },

    getDailyStatus() {
      const s = store.get<KStatus | null>('status', null);
      if (!s) return { dueCount: 0, newAvailable: content.newPerDay, minutes: 5, done: false };
      const fresh = s.day === todayStr();
      const na = fresh ? s.newAvailable : content.newPerDay;
      return { dueCount: s.due, newAvailable: na, minutes: Math.max(3, Math.round((s.due + na) * 0.4)), done: fresh && s.done };
    },

    // The same per-day ticks KnowledgeApp keeps ('meta'.doneDay + 'days'), read here for
    // the home's aggregated Today's plan.
    getPlanItems() {
      const t = todayStr();
      const s = store.get<KStatus | null>('status', null);
      const meta = store.get<{ doneDay?: string }>('meta', {});
      const days = store.get<{ read?: string; explore?: string }>('days', { read: '', explore: '' });
      const fresh = s && s.day === t;
      const items = [
        { label: 'Review the cards', sub: fresh ? `${s.due} due · ${s.newAvailable} new` : undefined, done: meta.doneDay === t },
        { label: 'Read a lesson', done: days.read === t },
      ];
      if ((content.explore ?? []).length > 0) {
        items.push({ label: content.id === 'art' ? 'Gallery visit or quiz' : 'Explore a region', done: days.explore === t });
      }
      return items;
    },

    exportState() { return store.get<KStatus | null>('status', null); },
    importState() { /* card SRS state rides in the platform island → covered by unified sync */ },
  };
}
