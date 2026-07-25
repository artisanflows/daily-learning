# Daily Learning — Merge Plan

*How Chess Atelier and the Korean trainer become one platform, with room for future trainers. Draft for Simon's review — July 2026.*

---

## 1. What we're building

One installable "Daily Learning" PWA. A shared **home** answers *"what should I learn today?"* across every subject (one combined ~35-minute plan, one streak). Each subject — chess, Korean, and future trainers — is a **module** inside it, keeping its own content, logic, and visual character. Think shopping mall: one entrance and directory (the shell), independent stores inside (the modules).

## 2. What we're merging (the honest starting point)

| | Chess Atelier | Korean trainer |
|---|---|---|
| Build | Custom Node script → one 1.4 MB HTML | **Vite + React 19 + TypeScript** → `dist/` SPA |
| Language | Vanilla JS | React + TS |
| Storage | localStorage (`sicilian-trainer-v1`) | **IndexedDB** (`hangugeo`) |
| Sync | GitHub gist sync ✓ + save-codes | Export/import JSON only (no cloud) |
| SRS | Hand-rolled SM-2 | **FSRS** (`ts-fsrs` library) |
| Content | `.mjs` modules | Markdown+YAML → compiled `content.json` |
| PWA | Own service worker + manifest | Own service worker + manifest |
| Look | Light: cream + terracotta | Dark: ink-blue 단청 + mineral-green |

**Shared DNA (why this merge is natural):** both are offline, no-login, spaced-repetition, adherence-first daily-habit PWAs built on the same philosophy. They were, in effect, built to merge.

## 3. Decided architecture: Vite platform, apps as modules

Standardize on **Vite** (Korean already uses it; it's the industry-standard tool for multi-module apps, lazy-loading, one build, one install). Chess is vanilla JS — Vite hosts vanilla JS and React side by side without trouble.

```
daily-learning/
  index.html                     shell entry
  vite.config.ts                 ONE build; ONE service-worker plugin enumerating all modules
  public/manifest.webmanifest    ONE manifest: "Daily Learning"
  src/
    shell/                       home, subject switcher, unified daily plan, settings
    platform/
      tokens.css                 shared design system (below)
      storage.ts                 shared persistence + gist sync + unified export/import
      module.ts                  the interface every trainer implements
    modules/
      chess/                     ported Chess Atelier (vanilla JS; Stockfish lazy-loaded)
      korean/                    ported Korean (React; CSS scoped)
```

### The module interface (how a trainer plugs in)

```ts
interface LearningModule {
  id: string;                 // 'chess' | 'korean'
  title: string;
  accent: string;             // per-app accent tint
  prefersTheme: 'light' | 'dark';
  mount(container: HTMLElement): void;   // render into a container, not the whole page
  unmount(): void;
  getDailyStatus(): { dueCount: number; newAvailable: number; minutes: number; done: boolean };
  exportState(): unknown;     // for unified backup + sync
  importState(data: unknown): void;
}
```

The shell calls `getDailyStatus()` on each module to build the combined "Today" screen, and `mount()` when you open a subject. Future MD-spec trainers just implement this interface — no shell changes needed. **This is what makes the platform extensible.**

## 4. Design system: share the *system*, not the *skin*

Korean's dark 단청 palette was deliberately designed to be "not the warm-cream-and-terracotta" — it's good, subject-specific work we won't erase. Resolution (matches your "per-app accent tints" choice):

- **Shared across everything:** spacing scale, corner radii, type scale, component shapes (cards, buttons, the daily-plan rows), motion rules, accessibility floor.
- **Platform shell:** neutral **pastel-blue**, light — the calm frame/hallway.
- **Per module:** each keeps its palette — chess warm-light (terracotta as *its* accent tint), Korean cool-dark (mineral-green). You always know which "room" you're in.
- **Light/dark:** the shell is theme-aware; each module declares `prefersTheme`, so entering chess feels light, entering Korean feels dark (its evening-study intent preserved).

One `tokens.css` holds the shared layer; each module has a small palette file. A design change happens in one place forever.

## 5. Storage, sync & streak

- **Keep each module's storage** (chess localStorage, Korean IndexedDB) — both are clean and isolated. The platform adds a thin layer that can **export/import both together**.
- **Unify sync:** extend chess's gist sync to the whole platform, so **Korean gains cloud backup for free** (it has none today). One token, one synced blob = both subjects' progress, backed up off-device.
- **Migration (critical):** your existing chess progress (streak, schedule, saved games) is read from `sicilian-trainer-v1` and preserved unchanged when chess becomes a module. Korean's `hangugeo` DB likewise. Nobody loses a streak.
- **Streak model (decision — see §7):** recommended = **one platform streak** (any completed session counts) + per-subject stats underneath. Best supports the "did I learn today?" habit.

## 6. The technical merge risks (from the code review) and how each is handled

1. **Two service workers + two manifests** → collapse to **one** SW (the Vite precache plugin enumerates both modules) and one manifest. *Highest-friction item; solved once at the platform level.*
2. **Korean's global CSS + `#root` ownership** → scope it under a wrapper class so styles don't leak into the shell or chess.
3. **Relative content path** (`./content.json`) → namespace to `korean/content.json`.
4. **Stockfish weight** (chess's big dependency) → lazy-load only when a chess feature needs it, so the platform stays fast to open.
5. **Shared `speechSynthesis`** (Korean cancels speech globally) → coordinate through the platform so modules don't cut each other off.
6. **Two SRS engines** → *not* a problem: each module keeps its own; the shell only reads their daily counts. (No attempt to force one algorithm.)

## 7. Open decisions for Simon

1. **Streak:** one platform streak (recommended) vs. separate per-subject streaks?
2. **Korean → cloud sync:** fold Korean into the unified gist sync so it gets cloud backup too (recommended yes)?
3. **Repo:** new `daily-learning` monorepo (recommended), with the existing `chess-atelier` and `korean-trainer` repos kept as archives?

## 8. Build order (Phase 1 = shell + Chess + Korean)

- **1a — Foundation:** scaffold the Vite platform: shell home, `tokens.css` design system, the module interface, unified storage+sync, one SW + manifest. *(No subject content yet — just the frame, provable on its own.)*
- **1b — Korean in:** it's already Vite/React, so this is mostly: scope its CSS, namespace its content, drop its own SW/manifest, wire into shared export/sync. Relatively clean.
- **1c — Chess in:** the bigger lift — wrap the vanilla app to mount into a container, lazy-load Stockfish, bring the `.mjs` content, migrate the existing save, scope its CSS.
- **1d — Unify & verify:** the combined Today screen, the platform streak, then verify offline PWA + sync + that no existing progress was lost.

**Honest effort note:** this is a multi-session build. 1a and 1c are the substantial pieces; 1b is moderate. Nothing here is risky or novel — it's careful plumbing — but it's real work, done in reviewable stages.

## 9. Future trainers

The other trainers (currently MD specs) become modules by implementing the §3 interface — no shell rewiring. When you're ready to build one, its spec drops into `modules/<name>/` and appears on the home screen automatically.
