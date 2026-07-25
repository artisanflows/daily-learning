// Shared types for knowledge trainers (wine, art, physics, psychology).
// A domain module supplies a DomainContent; knowledge-core runs the SRS session over it.

export type CardType = 'why' | 'cloze' | 'instance';

export interface Card {
  id: string;
  type: CardType;
  prompt: string;          // question, or a cloze sentence with a ___ blank
  image?: string;          // optional image shown above the prompt (art recognition cards)
  answer?: string;         // canonical answer for typed cards (cloze / instance)
  accept?: string[];       // accepted variants (normalised match); falls back to [answer]
  explanation: string;     // shown after answering — the actual lesson
  source: string;          // provenance (the accuracy gate)
  verified: boolean;       // must be true to enter the queue
  tag?: string;            // e.g. wine region, or psychology replication status
}

// The TEACHING layer (like chess's Study). A block opens with a primer, then walks
// through "understanding" lessons; the SRS cards drill what the lessons taught.
export interface Lesson {
  id: string;
  title: string;
  body: string;            // paragraphs separated by blank lines
  diagram?: string;        // optional inline SVG (authored, static)
}
export interface Block {
  id: string;
  title: string;
  primer: string;          // the block's opening framing
  lessons: Lesson[];
}

export interface DomainContent {
  id: string;              // module id, e.g. 'wine'
  title: string;
  blurb: string;
  accent: string;          // this domain's accent colour
  newPerDay: number;       // per-module new-card cap (platform-wide budgeting is a later step)
  blocks: Block[];         // the Learn layer
  cards: Card[];           // the Review layer
}
