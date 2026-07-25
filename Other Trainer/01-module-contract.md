# 01 — Module contract

## Manifest

```yaml
id: wine
name: Wine
icon: wine
enabled: true
paused: false

primary_eligible: true      # can take the long block
primary_minutes: 15
srs_share: 1                # relative weight in the short block

card_types: [why, cloze, instance]
engines: []                 # korean declares [conjugation]

content: ./content
weekly_prompt: "Open one bottle. Structured note."
```

## Interface

```ts
interface Module {
  id: string;
  manifest: Manifest;
  buildQueue(due: CardState[], budget: Budget): Card[];
  renderCard(card: Card): Component;
  grade(card: Card, given: string): GradeResult;   // synchronous, local
}
```

Everything is synchronous and local. No module may require a network call, an API key, or an account. A module that cannot run in airplane mode does not ship.

## Pausing

Any module can be paused. Paused means: no new material, no due cards surfaced, state frozen and preserved.

This is not a nice-to-have. Over two years there will be a month where physics is the wrong use of twenty minutes, and the alternative to pausing is a queue that becomes frightening and then abandoned. Pausing must be one tap and carry no penalty — no warning, no "you'll lose progress", no streak break.

## Adding a module

1. Write the manifest
2. Author and verify the first 30 sessions of content
3. Register in `/modules/`
4. Nothing in `/core/` changes

If step 4 turns out to be false, the contract is wrong and that is the thing to fix — not the core.
