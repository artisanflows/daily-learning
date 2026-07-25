// Shared persistence for the whole platform, plus unified export/import and gist sync.
// Each module gets a namespaced island under `modules.<id>`; platform meta (streak) is separate.

const KEY = 'daily-learning';

export interface PlatformState {
  version: 1;
  meta: {
    streak: number;
    lastActiveDay: string;   // YYYY-MM-DD of the last day any session completed
    settings: { syncToken?: string; syncGistId?: string; budget?: number; hiddenModules?: string[] };  // budget = minutes/day; 0/undefined = all
  };
  modules: Record<string, unknown>;  // per-module snapshots, keyed by module id
}

function fresh(): PlatformState {
  return { version: 1, meta: { streak: 0, lastActiveDay: '', settings: {} }, modules: {} };
}

let state: PlatformState = fresh();

export function loadPlatform(): PlatformState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) state = { ...fresh(), ...parsed, meta: { ...fresh().meta, ...parsed.meta }, modules: parsed.modules || {} };
    }
  } catch { /* corrupt or blocked storage — start fresh */ }
  return state;
}

export function savePlatform(): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked — export is the fallback */ }
}

export function getState(): PlatformState { return state; }

/* ---- Per-module namespaced storage (handed to each module via ModuleContext) ---- */
export function moduleStorage(id: string) {
  return {
    get<T>(key: string, fallback: T): T {
      const island = (state.modules[id] as Record<string, unknown>) || {};
      return (key in island ? (island[key] as T) : fallback);
    },
    set(key: string, value: unknown): void {
      const island = ((state.modules[id] as Record<string, unknown>) || {});
      island[key] = value;
      state.modules[id] = island;
      savePlatform();
    },
  };
}

/* ---- Shared streak: any completed session counts for the platform ---- */
export function todayStr(now = new Date()): string {
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
}
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / 86400000);
}
export function getBudget(): number { return getState().meta.settings.budget || 0; }  // 0 = all
export function setBudget(min: number): void { getState().meta.settings.budget = min; savePlatform(); }

/* ---- Per-device subject visibility (e.g. Simon's wife hides Korean on her phone).
   Hiding only removes a module from the home — its saved progress stays intact. ---- */
export function getHiddenModules(): string[] { return getState().meta.settings.hiddenModules ?? []; }
export function setModuleHidden(id: string, hidden: boolean): string[] {
  const cur = new Set(getHiddenModules());
  if (hidden) cur.add(id); else cur.delete(id);
  getState().meta.settings.hiddenModules = [...cur];
  savePlatform();
  return [...cur];
}

export function markActivity(): void {
  const t = todayStr();
  const last = state.meta.lastActiveDay;
  if (last === t) return;               // already counted today
  const gap = last ? dayDiff(last, t) : 999;
  state.meta.streak = gap === 1 ? state.meta.streak + 1 : 1;  // consecutive day extends; otherwise reset to 1
  state.meta.lastActiveDay = t;
  savePlatform();
}
export function currentStreak(): number {
  const last = state.meta.lastActiveDay;
  if (!last) return 0;
  const gap = dayDiff(last, todayStr());
  return gap <= 1 ? state.meta.streak : 0;  // streak lapses if a full day was missed
}

/* ---- Unified export / import (the offline backup story for the whole platform) ---- */
export function exportAll(): string {
  return JSON.stringify(state, null, 2);
}
export function importAll(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || parsed.version !== 1) return false;
    state = { ...fresh(), ...parsed, meta: { ...fresh().meta, ...parsed.meta }, modules: parsed.modules || {} };
    savePlatform();
    return true;
  } catch { return false; }
}

/* ---- Cloud sync via a private GitHub gist (one token, whole-platform backup) ----
   Korean had no cloud backup; folding it in here gives every module sync for free.
   Last-writer-wins by lastActiveDay/streak; UI wiring comes with the shell Settings. */
export async function syncPush(token: string, gistId?: string): Promise<string | null> {
  const body = {
    description: 'Atelier progress',
    public: false,
    files: { 'daily-learning.json': { content: exportAll() } },
  };
  const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';
  const res = await fetch(url, {
    method: gistId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id as string;
}
export async function syncPull(token: string, gistId: string): Promise<boolean> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return false;
  const data = await res.json();
  const content = data?.files?.['daily-learning.json']?.content;
  return typeof content === 'string' ? importAll(content) : false;
}
