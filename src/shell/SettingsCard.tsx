import { useState } from 'react';
import type { LearningModule } from '../platform/module';
import { exportToFile, importFromText, gistPush, gistPull, getSyncSettings, setSyncSettings } from '../platform/sync';

interface Props {
  modules: LearningModule[];      // already in priority order
  hidden: string[];
  onToggle: (id: string, hide: boolean) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}

export function SettingsCard({ modules, hidden, onToggle, onMove }: Props) {
  const s = getSyncSettings();
  const [token, setToken] = useState(s.syncToken ?? '');
  const [gistId, setGistId] = useState(s.syncGistId ?? '');
  const [msg, setMsg] = useState('');

  const doImportFile = async (f: File) => {
    const ok = await importFromText(await f.text());
    setMsg(ok ? 'Imported — reloading…' : 'Import failed: not a valid backup.');
    if (ok) setTimeout(() => window.location.reload(), 700);
  };
  const backup = async () => {
    if (!token) { setMsg('Paste a GitHub token first.'); return; }
    setMsg('Backing up…');
    setSyncSettings({ syncToken: token });
    const id = await gistPush(token, gistId || undefined);
    if (!id) { setMsg('Sync failed — check the token has the “gist” scope.'); return; }
    setSyncSettings({ syncToken: token, syncGistId: id });
    setGistId(id);
    setMsg('Backed up to your private gist ✓');
  };
  const restore = async () => {
    if (!token || !gistId) { setMsg('Need a token and gist id (back up on your other device first).'); return; }
    setMsg('Restoring…');
    const ok = await gistPull(token, gistId);
    setMsg(ok ? 'Restored — reloading…' : 'Restore failed.');
    if (ok) setTimeout(() => window.location.reload(), 700);
  };

  return (
    <details className="dl-card settings">
      <summary>Settings &amp; backup</summary>
      <div className="settings__body">
        <p className="dl-muted settings__hint" style={{ marginTop: 0 }}>
          Subjects on this device — order is your priority: when today’s time is short, #1 gets its
          new material first (due reviews always run for every subject). Hide keeps progress safe.
        </p>
        <div className="settings__subjects">
          {modules.map((m, i) => {
            const isHidden = hidden.includes(m.id);
            const lastVisible = !isHidden && modules.filter((x) => !hidden.includes(x.id)).length === 1;
            return (
              <div key={m.id} className={'settings__subj' + (isHidden ? ' is-off' : '')}>
                <span className="settings__rank" style={{ background: isHidden ? 'var(--plat-line)' : m.accent }}>{i + 1}</span>
                <span className="settings__subjname">{m.title}</span>
                <button className="settings__mini" disabled={i === 0} onClick={() => onMove(m.id, -1)} aria-label={`Move ${m.title} up`}>↑</button>
                <button className="settings__mini" disabled={i === modules.length - 1} onClick={() => onMove(m.id, 1)} aria-label={`Move ${m.title} down`}>↓</button>
                <button className="settings__mini settings__mini--wide" disabled={lastVisible}
                  title={lastVisible ? 'At least one subject stays on' : undefined}
                  onClick={() => onToggle(m.id, !isHidden)}>
                  {isHidden ? 'Show' : 'Hide'}
                </button>
              </div>
            );
          })}
        </div>
        <div className="settings__row">
          <button className="dl-btn" onClick={() => void exportToFile()}>Export backup</button>
          <label className="dl-btn" style={{ cursor: 'pointer' }}>
            Import backup
            <input type="file" accept="application/json" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImportFile(f); }} />
          </label>
        </div>
        <p className="dl-muted settings__hint">
          Cloud sync (optional): a GitHub token with the “gist” scope backs up every subject to one private gist, shared across your devices.
        </p>
        <input className="settings__input" type="password" autoComplete="off" placeholder="GitHub token (gist scope)"
          value={token} onChange={(e) => setToken(e.target.value)} />
        <input className="settings__input" type="text" placeholder="Gist id (auto-filled after first backup)"
          value={gistId} onChange={(e) => setGistId(e.target.value)} />
        <div className="settings__row">
          <button className="dl-btn dl-btn--accent" onClick={() => void backup()}>Back up to cloud</button>
          <button className="dl-btn" onClick={() => void restore()}>Restore from cloud</button>
        </div>
        {msg && <p className="settings__msg">{msg}</p>}
      </div>
    </details>
  );
}
