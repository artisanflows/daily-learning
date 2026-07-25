// The contract every trainer implements to live inside the Daily Learning shell.
// The shell knows nothing about chess or Korean specifically — only this interface.
// A future trainer (currently just an MD spec) becomes a module by implementing this.

export interface DailyStatus {
  dueCount: number;       // items due for review today
  newAvailable: number;   // new items that could be introduced today
  minutes: number;        // rough estimate to clear today's work
  done: boolean;          // has today's session been completed?
}

export interface LearningModule {
  id: string;                          // 'chess' | 'korean' — stable, used as storage namespace
  title: string;                       // shown on the home card
  blurb: string;                       // one-line description
  accent: string;                      // per-app accent colour (CSS value)
  prefersTheme: 'light' | 'dark';      // the module's preferred mode; shell honours it while mounted
  fullBleed?: boolean;                 // fills the screen with no shell padding (chess); shell floats a back control

  // Render the module into a container element (NOT the whole page). Called on entry.
  mount(container: HTMLElement, ctx: ModuleContext): void | Promise<void>;
  // Tear down (listeners, timers, engines). Called on leave.
  unmount(): void;

  // For the unified "Today" screen. Must be cheap and synchronous.
  getDailyStatus(): DailyStatus;

  // Lightweight synchronous snapshot (e.g. the status cache). Cheap; used for quick state.
  exportState(): unknown;
  importState(data: unknown): void;

  // FULL learning data for unified backup + cloud sync (cards, reviews, progress…).
  // May be async (IndexedDB). Optional — a module with nothing heavy can omit it.
  dumpData?(): Promise<unknown> | unknown;
  loadData?(data: unknown): Promise<void> | void;
}

// Services the shell hands each module at mount time.
export interface ModuleContext {
  // Namespaced persistence (each module gets its own island; the shell aggregates for sync).
  storage: {
    get<T>(key: string, fallback: T): T;
    set(key: string, value: unknown): void;
  };
  // Tell the platform a session was completed today (feeds the shared streak).
  markActivity(): void;
  // Ask the shell to return to the home screen.
  goHome(): void;
}

export type ModuleFactory = () => LearningModule;
