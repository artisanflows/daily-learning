# 02 — Content pipeline

## 1. The reframe: authoring time, not runtime

You have no API key, and the app must stay offline and keyless. But you are building with Claude Code, which *is* an LLM — so the generation happens at **authoring time**, not at runtime:

```
Claude Code generates a batch  →  you review and correct  →  commit as static MD + SVG
                                                              ↓
                                              app ships static content, offline, no key
```

This is better than runtime generation regardless of the key question, for one reason: **it puts a human review gate between generation and learning.** Runtime generation would teach you whatever the model produced, unchecked, and you would have no way to know when it was wrong. In these four domains that matters more than usual — see §3.

Generate in batches of ~30 sessions (one primary month) rather than continuously. A month of content is a reviewable unit; 700 days is not.

## 2. Sources

"Public knowledge" is genuinely rich here, and one domain is exceptionally well served.

| Domain | Sources |
|---|---|
| **Art** | **Met Open Access** and **Rijksmuseum** both publish high-resolution public-domain images with open APIs. National Gallery of Art and Wikimedia Commons likewise. This is a real asset — the most visual domain has the best free imagery. |
| **Physics** | OpenStax (CC BY), HyperPhysics, arXiv for anything current, standard reference works for verification |
| **Psychology** | OpenStax Psychology, open-access journals, the Many Labs and Reproducibility Project datasets — the last of these is essential, see §3 |
| **Wine** | Hardest. Appellation regulations, INAO and DOC/DOCG rules, and official classifications are factual and public; most good interpretive wine writing is not. Expect more original authoring here. |

Two constraints:

- **Art images only from open-access collections.** Never scraped, never from a museum's non-open collection. Met and Rijksmuseum solve this properly; use them.
- **Wikipedia is CC BY-SA**, which means attribution *and* share-alike. Fine for a personal app; it has implications if you ever share it. Prefer paraphrase over reproduction and cite the source per item either way.

## 3. Accuracy — and where it actually bites

The four domains do not share a failure mode, and the verification effort should not be spread evenly.

### Physics — low risk, solved by anchoring

The physics up to and including relativity and QM foundations is **settled textbook material**, and generated content on it is reliable. What is unreliable is *popular explanation* of that material — relativistic mass, consciousness collapsing wavefunctions, entanglement sending signals, the rubber-sheet analogy. These are not contested physics; they are standard pedagogical errors that propagate through popular science writing and therefore through training data. Textbooks get them right.

So the fix is structural rather than laborious: **anchor generation to a textbook sequence.** Generate against the structure of a real course — OpenStax University Physics for the core, Feynman for conceptual framing, a standard relativity text for blocks 7–8 — rather than asking free-form for "an explanation of relativity." Anchored generation produces textbook-grade content; unanchored generation produces the pop-science version.

Verification here is a spot-check, not a full pass. The one thing worth doing deliberately is turning the misconception list into explicit cards — state the error, then why it's wrong — because knowing the common wrong turn is often a faster route to the concept than the clean statement alone.

### Psychology — genuinely different

This is the one case where the **underlying literature** is unreliable, not merely its popularisation. A large part of the pre-2015 canon did not replicate, and that canon is heavily represented in training data and in every popular treatment. There is no textbook anchor that fixes it, because many textbooks still carry the failed findings.

Every finding therefore carries a **replication status tag**:

| Status | Examples |
|---|---|
| Robust | Spacing effect, testing effect, Big Five structure, working-memory limits, conditioning, most perception findings |
| Mixed / smaller than claimed | Much of heuristics-and-biases, growth mindset, facial feedback |
| Failed or heavily contested | Social priming, ego depletion, power posing, IAT predictive validity, stereotype threat |

This is a feature rather than a caveat, and the methodology-first sequencing in `03-curricula.md` §4 exists specifically to make it usable.

### Wine and art — narrow, factual checks

**Wine:** vintages, classifications and producer details drift. Check anything specific against current appellation rules; the structural material is stable.

**Art:** attribution, dating and provenance are frequently disputed. Where scholarship disagrees, say so — "attributed to" is itself worth learning.

### The gate

Every item carries `source:` and `verified:`. Nothing enters the SRS queue unverified — but calibrate the effort: a spot-check for physics, a real pass for psychology, fact-checks for wine and art specifics.

## 4. Diagrams

Claude Code generates **SVG at authoring time**, committed as static files. This works well for physics — spacetime diagrams, field lines, double-slit interference, the equivalence principle — and for wine region maps.

Constraints: SVG only (diffable, scalable, tiny), CSS variables for theming so diagrams work in both themes, and legible at 390px wide. A diagram that needs pinch-zoom on a phone is a failed diagram.

For art, the "diagram" is the artwork itself plus an overlay — composition lines, focal points, sight lines. That overlay is the formal-analysis lesson made visible and is worth more than any generated illustration.
