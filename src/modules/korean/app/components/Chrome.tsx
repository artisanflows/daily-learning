// Shared chrome for the Korean module — uses the platform's .dl-topbar/.dl-tabs
// (the same classes chess-style knowledge modules use), so the layout is identical.

export type KTab = 'today' | 'learn' | 'vocab';

export function Chrome({ tab, onTab }: { tab: KTab; onTab: (t: KTab) => void }): React.JSX.Element {
  return (
    <>
      <header className="dl-topbar">
        <span className="dl-topbar__badge" aria-hidden="true" lang="ko">한</span>
        <h1 className="dl-topbar__title" lang="ko">한국어</h1>
        <span className="dl-topbar__blurb">Daily Korean</span>
      </header>
      <nav className="dl-tabs">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => onTab('today')}>Today</button>
        <button className={tab === 'learn' ? 'active' : ''} onClick={() => onTab('learn')}>Learn</button>
        <button className={tab === 'vocab' ? 'active' : ''} onClick={() => onTab('vocab')}>Vocabulary</button>
      </nav>
    </>
  );
}
