import { useCallback, useEffect, useRef, useState } from 'react';
import type { LearningModule } from '../platform/module';
import { MODULES } from './registry';
import { Today } from './Today';
import { moduleStorage, markActivity, currentStreak } from '../platform/storage';

export function App() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  const goHome = useCallback(() => { setActiveId(null); }, []);

  const active = MODULES.find((m) => m.id === activeId) ?? null;

  if (!active) {
    return <Today modules={MODULES} streak={currentStreak()} onOpen={setActiveId} />;
  }
  return <SubjectView key={active.id} module={active} onHome={goHome} refresh={refresh} />;
}

function SubjectView({ module, onHome, refresh }: { module: LearningModule; onHome: () => void; refresh: () => void; }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    module.mount(host, {
      storage: moduleStorage(module.id),
      markActivity: () => { markActivity(); refresh(); },
      goHome: onHome,
    });
    return () => module.unmount();
  }, [module, onHome, refresh]);

  return (
    <div className="subject-view" data-theme={module.prefersTheme}>
      <div className="subject-view__host" ref={hostRef} />
    </div>
  );
}
