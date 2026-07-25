# 00 — Architecture

## Core

Shared by every module. Modules may not fork these.

| Component | Notes |
|---|---|
| Session runner | State machine, timers, block sequencing |
| FSRS engine | `ts-fsrs`, config and load invariants per `korean-trainer/specs/02-srs-engine.md` |
| Storage | IndexedDB, one store per module, single export |
| Card renderer | Prompt / input / reveal / grade, module-supplied card components |
| Grading interface | Deterministic accept-set matching, error-pattern lookup |
| Progress and streak | **One streak across the whole platform**, not per module |
| PWA shell | Install, offline, service worker, routing |
| Scheduler | Composes today from enabled modules within a total budget |

## Module

A module supplies content, card types, and a session shape. It does not supply scheduling, storage, or streak logic.

```
/modules/<id>/
  manifest.yml
  content/           MD + frontmatter
  cards/             module-specific card components
  engines/           optional — e.g. Korean's conjugation engine
```

## The one rule that keeps this honest

**Modules never touch the FSRS engine or the load invariants.** The six-new-cards-per-day cap and the 0.85 retention target are platform-level and apply to the *sum* across modules, not per module. Four modules each claiming "just six a day" is twenty-four new cards a day and a collapsed queue by spring.

This is the single most likely way a merged platform fails, and it fails silently.

## Browser and mobile

One codebase, responsive, installable. The PWA covers both — desktop browser and phone home screen from the same build, with the same offline behaviour.

Two iOS caveats worth knowing: notifications require the app to be installed to the home screen rather than run in a tab, and background sync is limited, so all state must survive being backgrounded and killed at any moment. Design for the app being terminated mid-session; never hold session progress only in memory.
