// Shared types for knowledge trainers (wine, art, physics, psychology).
// A domain module supplies a DomainContent; knowledge-core runs the SRS session over it.

export type CardType = 'why' | 'cloze' | 'instance';

export interface Card {
  id: string;
  type: CardType;
  prompt: string;          // question, or a cloze sentence with a ___ blank
  answer?: string;         // canonical answer for typed cards (cloze / instance)
  accept?: string[];       // accepted variants (normalised match); falls back to [answer]
  explanation: string;     // shown after answering — the actual lesson
  source: string;          // provenance (the accuracy gate)
  verified: boolean;       // must be true to enter the queue
  tag?: string;            // e.g. wine region, or psychology replication status
}

export interface DomainContent {
  id: string;              // module id, e.g. 'wine'
  title: string;
  blurb: string;
  accent: string;          // this domain's accent colour
  newPerDay: number;       // per-module new-card cap (platform-wide budgeting is a later step)
  cards: Card[];
}
