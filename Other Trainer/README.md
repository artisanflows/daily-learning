# Learning Platform

One app, one habit, one daily schedule. Modules plug in over time.

Currently: **Korean**, **Knowledge** (wine · art · physics · psychology), **Chess**.

## Why merge

The argument is not code reuse, though that is real — roughly 70% of each module is the same session runner, FSRS engine, storage layer and card renderer.

The argument is that **habits do not multiply.** Three apps is three icons, three streaks, three separate decisions to open something, and three independent chances to skip. One app with a composed daily schedule is one decision. That is the entire case, and it is a strong one.

## Layout

```
/core/                  session runner · FSRS · storage · card renderer · grading · PWA shell
/modules/
  korean/               see korean-trainer/specs
  wine/  art/           see knowledge-trainer/specs
  physics/  psychology/
  chess/
/schedule/              daily composition across enabled modules
/specs/
  00-architecture.md    what is core, what is module
  01-module-contract.md the manifest every module implements
  02-daily-schedule.md  budget allocation, streak, pausing
```

## Build order

1. **Korean v0** as specified, standing alone. 30 days of use.
2. **Extract `/core/`** from it — only once there is a second module to justify the abstraction.
3. **Wine module** as the second module. This is the test of whether the module contract is right.
4. Everything else, one at a time.

Extracting core before there is a second consumer produces an abstraction fitted to one case. Build one, use it, then generalise against the second.

**Chess stays where it is** until the platform has proven itself with two modules. Merging an already-working app is a rewrite, not an integration, and it buys nothing until there is something worth merging into.
