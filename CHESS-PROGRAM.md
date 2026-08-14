# Chess Atelier — what it does and what it knows

A single-file chess trainer (~15 MB HTML, works offline) that ships as the **Chess**
module of the Daily Learning PWA. Built for one player, from one repertoire, with
a full-strength engine and a lot of measured data behind it.

Everything below is counted from the source, not remembered.

---

## 0. Where things actually live

This trips people up, so it goes first. The chess program lives in **two places**
and only one of them is version-controlled.

| | `~/Desktop/DailyLearning` | `~/Desktop/ChessX` |
|---|---|---|
| **Is a git repo** | yes (public, `artisanflows/daily-learning`) | **no** |
| **Holds** | the Vite PWA shell + all modules (`src/modules/`: chess, korean, art, wine, knowledge-core, physics, psychology) and the **built** chess app at `public/chess/index.html` | the chess app's **source**: content files, `app.js`, `style.css`, the whole `src/scripts/` toolchain |
| **Chess is** | one 16 MB built HTML blob, mounted full-bleed by the shell | ~250 editable files that produce that blob |

So: **the app runs from Daily Learning; the app is written in ChessX.** Editing
chess means editing ChessX, building, and copying the result across. Nothing in
`public/chess/index.html` should ever be hand-edited — the next build overwrites it.

Because ChessX has no git history, **this document is kept in the Daily Learning
repo** so it survives. The books also sit in DailyLearning's root and are
gitignored; they must stay that way, the repo is public.

---

## 1. The eleven tabs

| Tab | What it does |
|---|---|
| **Progress** | Today's plan, streaks, mastery per chapter, new-lines-per-day setting, engine strength, cloud sync |
| **Play** | Play out any position vs the embedded engine; play real humans over the Lichess Board API |
| **Study** | Walk a repertoire line move by move with annotations, sidelines, plans and an engine read at the end |
| **Drill** | Spaced-repetition recall of lines you've studied — you play your side from memory |
| **Punish** | Dedicated lines for opponents' common mistakes, each with the refutation |
| **Quiz** | Master-move quiz drawn from the masters database |
| **Tactics** | 1,680 puzzles across rating bands, plus 660 calculation exercises |
| **Endgames** | 123 tablebase-verified positions, from basic mates to master technique |
| **Concepts** | 16 middlegame structures + 135 strategy exercises with a remember-loop |
| **Map** | The repertoire as a walkable decision tree — per chapter and per colour |
| **My Games** | Import PGN, auto-review with the engine, browse mistakes, replay from any point |

---

## 2. The repertoire — what it actually knows

**20 chapters · 245 lines · 6,592 moves · 1,152 sidelines · 1,967 annotations · 28 punish lines · 10 annotated master games**

### As Black

| Chapter | Lines | Sidelines | Covers |
|---|---|---|---|
| Sicilian Foundations | 2 | 12 | The Sicilian move orders and what each concedes |
| The Najdorf (5…a6) | 5 | 31 | Introductory Najdorf |
| **The Najdorf Masterclass** | 48 | 170 | The full 6.Bg5 / 6.Be3 / 6.Bc4 / 6.f4 complex |
| The Dragon (5…g6) | 4 | 26 | Introductory Dragon |
| **The Dragon Masterclass** | 38 | 125 | Yugoslav Attack, 9.0-0-0, Topalov, Soltis |
| The Sveshnikov (5…e5) | 3 | 22 | Introductory Sveshnikov |
| **The Sveshnikov Masterclass** | 27 | 121 | The full 9.Nd5 / 9.Bxf6 landscape |
| **The Kan Masterclass** | 10 | 58 | The …a6/…e6 systems |
| **Anti-Sicilians** | 30 | 67 | 2.c3, 2.Nc3, 2.Bc4, 2.f4, 2.d4, Rossolimo, Moscow, Closed — **and the delayed versions after 2.Nf3** |
| The Caro-Kann (1…c6) | 5 | 32 | Advance and Panov main lines (spare defence) |
| The King's Indian | 5 | 43 | vs 1.d4 with 2.c4 |
| The Classical Masterclass (QGD) | 9 | 54 | vs 1.d4 with 2.c4, the …d5 route |
| **Anti-1.d4 Systems** | 4 | 17 | London, Trompowsky, Jobava, Colle |
| vs 1.c4 & 1.Nf3 | 7 | 22 | English, Réti, KIA, Nimzo-Larsen, Bird, 1.e3/1.g3 |

### As White (1.d4)

| Chapter | Lines | Sidelines | Covers |
|---|---|---|---|
| **The 1.d4 Masterclass** | 22 | 164 | The Avrukh-based spine |
| The Queen's Gambit | 9 | 87 | QGD, Slav, QGA |
| The Catalan | 6 | 34 | The full Catalan |
| The London System | 4 | 17 | The London |
| White vs Dutch, Benoni & Grünfeld | 7 | 50 | Those three defences |
| The Classics | — | — | 10 annotated master games |

Every line carries a **tabiya**: your plans, their plans, and what to watch for.
Every chapter opens with a **primer** — 6–8 illustrated sections with board diagrams.

---

## 3. The other courses

| Course | Size | Notes |
|---|---|---|
| **Tactics** | 1,680 puzzles | Banded by rating, sourced from the lichess puzzle database |
| **Calculation** | 660 exercises | Longer forcing sequences |
| **Endgames** | 123 positions | Every one verified against perfect-play tablebases |
| **Strategy** | 135 exercises | Positional decisions with a spaced-repetition remember-loop |
| **Concepts** | 16 structures | Middlegame pawn structures and their plans |
| **Mate patterns** | 18 patterns + 18 puzzle sets | Named mating nets |
| **Quiet mistakes** | 153 positions | Club-popular moves that are quietly bad, engine-triaged |
| **Classics / Losses** | 10 + 10 | One instructive master game and one instructive loss per chapter |

---

## 4. The measured data behind it

This is what separates the app from a book. Four datasets, all generated locally
and baked into the file.

### Masters database — 17 chapter trees, 149,522 positions
Crawled from the lichess masters explorer along every repertoire line. Drives the
frequency bars, the "leads to" labels and the master-move quiz.

### Sharpness — 11,352 positions
Stockfish at MultiPV 10 over every position the repertoire reaches, main lines
**and** sidelines, storing each move **with its name** and its evaluation. This is
what lets the app say how much a given move gives up.

### Club games, two rating bands
- **1,988 forks** at 1400–1800
- **2,807 forks** at 2000–2400

What real opponents actually played at every position where they have a choice.
Two bands, deliberately: one band tells you how often people go wrong; only the
*gap between bands* separates a genuinely hard position from a weak opponent.

### Practical pick
Combining the two: at every fork where **you** choose, each candidate move shows
the share of real opponents who then play something that gives up more than 0.30
— the **miss-rate**. Forced recaptures score 0% automatically, which is the point:
"narrow" and "difficult" are not the same thing. A summary names the best practical
move, and explicitly refuses to name one when the gap is inside the noise.

Coverage: **46 forks** across the repertoire where you genuinely choose; 39 have
data; 21 produce a decisive recommendation; 18 honestly say there isn't one.

---

## 5. The engine

**Stockfish 18 NNUE**, running in the browser, picked at boot in this order:

1. **Multithreaded** (`sf/stockfish-18-lite.js`) — used when the page is
   cross-origin isolated; takes `cores − 2` threads, capped at 8
2. **Single-threaded** — same strength, slower
3. **Inline asm.js** — a small fallback so the file works opened from disk

Used for: the evaluation bar, blunder explanations while sparring, the 10-second
analysis board, game review with accuracy percentages and move classifications,
endgame play-outs, and the "play it out" mode from any position.

**Analysis board** — you play both sides, top-5 moves update as you explore,
arrow-key navigation, and moves you step back over are remembered so you can walk
a variation forward and back without losing it.

---

## 6. Learning mechanics

- **Spaced repetition (SM-2)** for both drill lines and technique cards
  (endgames + strategy), with ease clamped to 1.3–4.0
- **New lines per day** is a setting, so the queue can't run away from you
- **Missed tactics recycle** back into the review queue
- **Today's plan** on Progress schedules the session across all courses
- **Streaks** are tracked once, at the platform level, not per course

---

## 7. Cloud sync

Progress is kept in `localStorage` and can be synced through a **private GitHub
gist** — you supply a token once; the app stores the gist id and last-sync time.
No server, no account, nothing leaves the machine except to your own gist.

---

## 8. Tooling (`src/scripts/`)

The generators and audits behind the data:

| Script | Purpose |
|---|---|
| `build.mjs` | Assembles the single-file app; inlines CSS, JS, engine, content, all datasets |
| `validate.mjs` | Replays every line and sideline; checks legality, transpositions, punish deviations |
| `measure-sharpness.mjs` | Drives Stockfish over every repertoire position (MultiPV 10, with move names) |
| `crawl-club.mjs` | Fetches real club games per position; `CLUB_BAND=club\|strong` picks the rating band |
| `crawl-book.mjs` + friends | Masters-database crawls per chapter |
| **`coverage-report.mjs`** | **Repertoire evaluation** — walks the tree and finds where an opponent can steer you out of book, weighted by real frequency |
| **`find-bridges.mjs`** | Given a gap, finds moves that transpose back into something you already own |
| `verify-endgames.mjs` | Checks endgame positions against tablebases |
| `audit-*.mjs` | Coverage and consistency audits |

Validator status: **245 lines, 16,983 moves replayed, 0 errors, 29 transpositions verified.**

---

## 9. What it does NOT know

Stated plainly, because the gaps matter as much as the content:

- **The Caro-Kann is a spare, not a defence.** 5 lines. `2.Nf3` (17% of Caro games)
  is uncovered — being fixed from the Schandorff books.
- **Anti-1.d4 assumes 1…Nf6.** If you answer 1.d4 with `…d5`, the London /
  Trompowsky / Colle chapter doesn't apply — roughly 13% of games.
- **White has real holes**: `2.Bf4 Nc6` (9.3%), `1…g6` (4.5%), `1…c5` (3.7%),
  `1…c6` (3.4%), plus the Bogo- and Queen's Indian.
- **Practical-pick data only exists where the crawl reached.** On the analysis
  board, free exploration usually shows nothing.
- **~8% of human moves** fall outside the engine's top ten and are counted as
  misses — a reasonable assumption, not a measurement.
- **Early-opening miss-rates** describe how loosely the general population plays,
  not a trap you engineered.

---

## 10. Build and deploy

```
node src/scripts/validate.mjs      # must report 0 errors
node src/scripts/build.mjs         # → chess-atelier.html + deploy/
cp chess-atelier.html ../DailyLearning/public/chess/index.html
```

The Daily Learning repo is public — **book PDFs are gitignored and must never be
committed**. Check `git status --short | grep -i pdf` before every commit.
The lichess token lives in `ChessX/.lichess-token`, file-based, never printed.
