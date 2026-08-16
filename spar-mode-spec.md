# Spec: Spar Mode (Chess Atelier)

**Status:** draft spec, not yet implemented
**Target:** new tab in the Chess Atelier single-file build (twelfth tab, alongside Play / Study / Drill / Punish / Quiz / Tactics / Endgames / Concepts / Map / My Games / Progress)

---

## 1. Problem

Full games are the best teacher per game but the worst teacher per hour. A 40-move game contains perhaps three genuinely instructive moments, most of it replaying opening theory already owned by the repertoire. The learning sits in the post-opening / out-of-theory phase, plus traps and errors on the way there.

Spar Mode extracts those moments directly: the engine sets a position, we play it out 5–10 moves (or as deep as the learning goal requires), and move on. Target is roughly 8–12 instructive decision points per 30-minute session versus ~3 per 45-minute game.

**Explicit non-goal:** replacing real games entirely. Time management, endurance, criticality detection, and conversion psychology are only trainable over the board. Spar Mode replaces the bulk of playing volume, not all of it.

---

## 2. Two failure modes the design must defend against

These are the reasons naive position-drilling fails. Both are requirements, not nice-to-haves.

### 2.1 Pre-labeling

If a position arrives announced as a training position, the user already knows something is there. Real chess requires *detecting* that a position is critical. Naive drilling trains that skill out rather than into the player.

Mitigations (all required):
- **Filler positions.** ≥25% of sparred positions must be ones where the correct answer is "nothing special — make a solid developing move." Sampled from quiet points in master games or from repertoire tabiyas with no tactical content.
- **No theme reveal before the session.** Theme, source, and learning goal are hidden until the position is resolved.
- **No differential UI.** Filler and loaded positions must be visually and structurally indistinguishable at start.

### 2.2 No consequence, so no depth

Without a clock or a lost game, the user drifts to puzzle speed and trains recall instead of calculation.

Mitigations (all required):
- **Time budget.** Soft target of 2–3 minutes on each of the first three moves. Display an elapsed timer; warn (do not block) on moves played under 20 seconds in the first three plies.
- **Written commitment gate.** Before move 1, the user must enter (a) a one-line plan and (b) an eval guess from a coarse picker (`much worse / worse / equal / better / much better`). The board is not interactive until both are submitted. Both are shown back at resolution alongside the engine's actual eval.

---

## 3. Position sourcing

Priority order. The generator should weight sampling in this order unless the user pins a source.

| # | Source | Derivation | Why |
|---|---|---|---|
| 1 | **Repertoire exits** | `coverage-report` output — where opponents steer out of book, frequency-weighted. Start position = first position *after* the exit. | Directly targets the stated failure mode (out of theory when the opponent deviates 1–2 moves). |
| 2 | **Tabiya continuations** | The 245 repertoire lines. Start at the tabiya; spar the following ~10 moves. | The annotated plans exist; the execution is untested. |
| 3 | **Own-game eval drops** | My Games. Find eval swing > 1.0; back up 2–3 moves; start there. | Cheap to generate, maximally relevant. |
| 4 | **Endgames** | The 123 tablebase-verified endgames plus practical technical positions (+1.0 to +1.8 to convert; theoretical draws to hold). | Highest ROI per position of any category. |
| 5 | **Filler** | Quiet positions per §2.1. | Required for the anti-pre-labeling quota. |

---

## 4. Opponent model

**Do not spar against full-strength Stockfish 18.** It refutes rather than teaches and plays lines no human opponent would find — the user ends up defending against ghosts, and traps/punishments become untrainable because the engine never falls for them.

Layered opponent, in order of precedence:

1. **Club-book layer (primary).** Sample the opponent's move from the existing club-games fork distributions, at a user-selected band (1400–1800 or 2000–2400). Play the *popular* club move, not the best move. Sample proportionally to observed frequency; do not always take the modal move.
2. **Sharpness-informed fallback.** Where club data thins out, use the sharpness dataset (11,352 positions, MultiPV 10) to pick a plausible human-ish move from the top-N rather than the top-1.
3. **Node-limited Stockfish (last resort).** When neither dataset covers the position, hand to Stockfish 18 NNUE with a node cap calibrated to the selected band. Never full strength during the spar.

**Full-strength Stockfish is used only for post-hoc adjudication** (§5), never as the sparring opponent.

*Alternative if the layered approach proves too costly to build:* a Maia weights file at the matching rating band, accepting the added payload against the single-file size budget (see §8).

---

## 5. Session flow

```
sample position
  → hide theme/source
  → commitment gate (plan + eval guess)     [blocks board]
  → alternating play, opponent per §4
  → exit condition met (§6)
  → resolution screen
```

**Resolution screen** shows, in this order:
1. Engine eval trajectory across the sparred moves (full-strength Stockfish, computed at resolution).
2. The user's submitted plan and eval guess versus what actually happened.
3. Move-by-move deltas — every move losing >0.5, with the better alternative and a one-line reason.
4. *Now* reveal: theme, source, learning goal, and the tabiya annotation if the position came from the repertoire.

---

## 6. Exit conditions

Rule-based, not a fixed move count. Terminate on **whichever fires first**:

- Eval swings by more than **0.8** from the starting eval, in either direction
- The position reaches a **named structure** present in Concepts (16 middlegame structures)
- **10 full moves** played
- User taps "resolve" manually

For endgame positions, replace the eval-swing trigger with: conversion achieved, draw held, or objective result thrown away.

---

## 7. The two multipliers

These are where the efficiency gain over real games actually compounds — a real game yields one instance of a position; sparring yields the position as a *space*. Both are first-class features, not stretch goals.

- **Repeat with variation.** Re-serve the same start position up to 3× with a forced-different opponent try each time (exclude previously sampled opponent moves at the first branch point). Space repeats via the existing SM-2 scheduler.
- **Colour flip.** Serve the same position from the other side. Track both sides' results against a single position ID.

---

## 8. Data model

New position type, stored alongside the existing datasets, baked into the build:

```json
{
  "id": "spar-0001",
  "fen": "...",
  "source": "coverage-exit | tabiya | own-game | endgame | filler",
  "source_ref": "chapter/line id, game id, or endgame id",
  "side_to_move": "w | b",
  "user_plays": "w | b",
  "start_eval": 0.24,
  "theme": "hidden until resolution",
  "learning_goal": "one line, hidden until resolution",
  "is_filler": false,
  "band": "1400-1800 | 2000-2400",
  "exit_rule_override": null
}
```

Attempt records (localStorage, gist-synced, consistent with existing progress sync):

```json
{
  "position_id": "spar-0001",
  "attempt": 1,
  "played_side": "b",
  "plan_text": "...",
  "eval_guess": "equal",
  "actual_start_eval": 0.24,
  "end_eval": -0.61,
  "moves_played": 8,
  "exit_reason": "eval-swing | structure | move-cap | manual",
  "blunders": [{"ply": 5, "played": "Nd7", "best": "Bxd4", "delta": 1.2}],
  "time_per_move_ms": [],
  "timestamp": "..."
}
```

---

## 9. Toolchain additions

New scripts in `src/scripts/`, following existing conventions:

- `build-spar-positions` — generates the position set from sources §3.1–3.5; must be re-runnable and deterministic given the same input datasets
- `validate-spar` — replays every position for legality, confirms `start_eval` matches a fresh Stockfish evaluation within tolerance, confirms the filler quota is ≥25%
- Extend `coverage-report` to emit exit positions in the §8 schema directly, so source 1 requires no manual step

---

## 10. Success criteria

- A 30-minute session yields ≥8 resolved positions
- ≥25% of served positions are filler, verified by `validate-spar`
- Opponent moves come from club-book data ≥60% of the time within the first 6 plies (measure after first build; if lower, the crawl needs extending before Spar Mode is worth shipping)
- Repeat-with-variation and colour-flip both reachable from the resolution screen in one tap

---

## 11. Open questions

1. Size budget: the current build is ~15–16 MB. What does the spar position set add, and does that push the single-file blob past acceptable load time on mobile? Measure before committing to Maia weights.
2. Is the club-games crawl deep enough at the coverage-exit positions specifically, or does it mostly cover mainline territory the repertoire already owns? This determines whether §4.1 is real or mostly falls through to §4.2.
3. Should spar attempts feed the same SM-2 queue as repertoire lines, or a separate scheduler? Mixing may starve one or the other.
4. Filler positions: generated, or hand-picked? Generated risks accidentally serving loaded positions as filler, which corrupts the anti-pre-labeling defence.
