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
  unit?: string;           // block id this card drills — ties the card to a study-plan unit
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

// The EXPLORE layer (like chess's broad reference tabs). Browsable one-pagers the
// learner can wander through with no session — the "wander and read" side of the app.
export interface ExploreEntry {
  id: string;
  title: string;
  subtitle?: string;       // e.g. country · grape, or artist · year
  image?: string;          // optional image (art works)
  facts?: { label: string; value: string }[];  // quick-reference key/value rows
  /** Typicity bars on a 0–5 scale (wine: the tasting axes — acidity, tannin, body…). */
  profile?: { label: string; value: number }[];
  body: string;            // paragraphs separated by blank lines
  source?: string;
}
export interface ExploreSection {
  id: string;
  title: string;
  blurb?: string;
  kind?: 'gallery' | 'list';   // gallery = image/monogram cards; list = text rows
  entries: ExploreEntry[];
}
// Optional world map pinned to explore entries (wine). Coordinates are equirectangular
// in a 360×180 space (x = lon+180, y = 90−lat) so pins land on the real Natural Earth
// outlines. `country` (Natural Earth name) lights up the home country on the entry's
// zoomed regional map.
export interface MapPin { entryId: string; label: string; x: number; y: number; country?: string }

// An optional study goal turns the blocks into an ordered study plan on the Today tab
// (like chess's "Today's plan"): each block is a unit, with read + card-mastery tracking.
export interface Goal {
  title: string;           // e.g. "Introductory Sommelier — theory"
  blurb: string;           // one-line framing shown under the title
}

export interface DomainContent {
  id: string;              // module id, e.g. 'wine'
  title: string;
  blurb: string;
  accent: string;          // this domain's accent colour
  newPerDay: number;       // per-module new-card cap (platform-wide budgeting is a later step)
  goal?: Goal;             // optional exam/goal the blocks build toward
  blocks: Block[];         // the Learn layer — ordered; with a goal set, this IS the study plan
  cards: Card[];           // the Review layer
  explore?: ExploreSection[];  // the Explore layer (optional)
  mapPins?: MapPin[];      // optional map markers (rendered over the shared world outline)
}
