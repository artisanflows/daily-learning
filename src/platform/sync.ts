// Unified backup + cloud sync for the whole platform: platform meta + every module's
// full learning data (chess localStorage, Korean IndexedDB, …) in one snapshot.
import { exportAll, importAll, getState, savePlatform } from './storage';
import { MODULES } from '../shell/registry';

interface FullSnapshot {
  v: 2;
  platform: unknown;               // the platform localStorage state (streak, settings, caches)
  data: Record<string, unknown>;   // per-module full data, keyed by module id
}

export async function buildSnapshot(): Promise<FullSnapshot> {
  const data: Record<string, unknown> = {};
  for (const m of MODULES) {
    if (m.dumpData) {
      try { data[m.id] = await m.dumpData(); } catch { data[m.id] = null; }
    }
  }
  return { v: 2, platform: JSON.parse(exportAll()), data };
}

export async function applySnapshot(snap: FullSnapshot): Promise<void> {
  if (!snap || typeof snap !== 'object' || snap.v !== 2) throw new Error('Not an Atelier backup');
  if (snap.platform) importAll(JSON.stringify(snap.platform));
  for (const m of MODULES) {
    if (m.loadData && snap.data && m.id in snap.data) {
      try { await m.loadData(snap.data[m.id]); } catch { /* one module failing shouldn't abort the rest */ }
    }
  }
}

/* ---- Local file export / import (offline backup) ---- */
export async function exportToFile(): Promise<void> {
  const json = JSON.stringify(await buildSnapshot(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'atelier-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
export async function importFromText(text: string): Promise<boolean> {
  try { await applySnapshot(JSON.parse(text)); return true; } catch { return false; }
}

/* ---- Cloud sync via a private GitHub gist (one token backs up every subject) ---- */
export async function gistPush(token: string, gistId?: string): Promise<string | null> {
  const content = JSON.stringify(await buildSnapshot());
  const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';
  const res = await fetch(url, {
    method: gistId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify({ description: 'Atelier progress', public: false, files: { 'daily-learning.json': { content } } }),
  });
  if (!res.ok) return null;
  return (await res.json()).id as string;
}
export async function gistPull(token: string, gistId: string): Promise<boolean> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return false;
  const content = (await res.json())?.files?.['daily-learning.json']?.content;
  return typeof content === 'string' ? importFromText(content) : false;
}

/* ---- Sync settings (token + gist id) live in platform meta ---- */
export function getSyncSettings() { return getState().meta.settings; }
export function setSyncSettings(s: { syncToken?: string; syncGistId?: string }) {
  Object.assign(getState().meta.settings, s);
  savePlatform();
}
