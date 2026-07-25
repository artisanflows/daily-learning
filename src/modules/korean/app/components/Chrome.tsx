// Chess-style chrome for the Korean module: topbar (badge + title) + a pill menu bar.
// Kept identical across the Today / Learn / Vocabulary panels so the bar feels persistent.

export type KTab = 'today' | 'learn' | 'vocab';

export function Chrome({ tab, onTab }: { tab: KTab; onTab: (t: KTab) => void }): React.JSX.Element {
  return (
    <>
      <header className="ktop">
        <span className="ktop__badge" aria-hidden="true" lang="ko">한</span>
        <h1 className="ktop__title" lang="ko">한국어</h1>
        <span className="ktop__blurb small">Daily Korean</span>
      </header>
      <nav className="ktabs">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => onTab('today')}>Today</button>
        <button className={tab === 'learn' ? 'active' : ''} onClick={() => onTab('learn')}>Learn</button>
        <button className={tab === 'vocab' ? 'active' : ''} onClick={() => onTab('vocab')}>Vocabulary</button>
      </nav>
    </>
  );
}
