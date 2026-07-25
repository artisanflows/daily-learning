import type { DomainContent } from '../knowledge-core/types';

// Art v0 — the "recognition layer" (image → artist, period, why it matters) plus the
// "understanding layer" (formal vocabulary), per spec 03 §3. Images are Met Open Access
// CC0 works, downloaded at authoring time and committed under public/art (offline gate).
export const ART: DomainContent = {
  id: 'art',
  title: 'Art',
  blurb: 'Recognise · read · understand',
  accent: '#b07d2c',
  newPerDay: 6,
  blocks: [
    {
      id: 'ways-of-looking',
      title: 'Ways of looking',
      primer: 'Before any chronology, learn to look. Without a formal vocabulary an art survey is just names attached to thumbnails.\n\nThese are the tools you use on every single work — the layer that turns recognising a painting into understanding it.',
      lessons: [
        { id: 'composition', title: 'Composition & line', body: 'Composition is how the artist arranges everything to lead your eye — balance, a focal point, the path your gaze travels. Notice where you look first, and what pulls you there.\n\nLine does two jobs: contour (the edges of things) and gesture (energy and movement). A diagonal feels active; a horizontal, calm. Much of a picture’s feeling is decided before you notice any subject.' },
        { id: 'colour-light', title: 'Colour, light, space', body: 'Colour carries temperature (warm advances, cool recedes) and relationships (complementaries intensify each other). Light models form: chiaroscuro is strong light-to-dark contrast for drama and volume — Caravaggio and Rembrandt are its masters.\n\nSpace is built by perspective — linear (converging lines) or atmospheric (distant things paler and bluer). And facture — visible brushwork — is itself expressive: smooth and hidden, or thick and gestural.' },
        { id: 'the-question', title: 'The one question', body: 'For every work, ask: what problem was this artist solving?\n\nThat single question is the understanding layer. Knowing Van Gogh painted a wheat field is a fact; seeing that he was trying to make paint itself carry emotion is the thing worth keeping. It stops the recognition cards from being a quiz.' },
      ],
    },
    {
      id: 'anchors',
      title: 'Reading a few masters',
      primer: 'The recognition layer trains your eye to place an unseen work — its hand, its period. Here are the anchors behind the review images.',
      lessons: [
        { id: 'dutch', title: 'Dutch Golden Age: Vermeer & Rembrandt', body: 'Vermeer turned ordinary interiors into contemplative worlds — a woman by a window, luminous natural light, absolute stillness.\n\nRembrandt used chiaroscuro not for theatrics but for psychology: faces emerging from shadow, carrying a lifetime of feeling. Between them, light does two different kinds of work — one quiet, one searching.' },
        { id: 'toward-modern', title: 'Toward the modern eye', body: 'Bruegel (Northern Renaissance) made peasant life and the turning seasons a grand subject, painted from a high, sweeping vantage.\n\nTurner (Romanticism) let light and atmosphere begin to dissolve solid form — anticipating Impressionism by decades. Degas (Impressionism) borrowed the cropped, off-centre framing of photography and Japanese prints. Van Gogh (Post-Impressionism) pushed thick, expressive colour toward pure feeling. Follow that thread and you can watch representation loosen into modern art.' },
      ],
    },
  ],
  cards: [
    // Understanding layer (formal vocabulary)
    { id: 'a-composition', type: 'why', prompt: 'In formal analysis, what does “composition” govern?',
      explanation: 'How the artist leads your eye — balance, focal point, and the path your gaze travels. Much of a picture’s feeling is set by arrangement before you register the subject.',
      source: 'Formal analysis', verified: true, tag: 'looking' },
    { id: 'a-chiaroscuro', type: 'cloze', prompt: 'Strong contrast of light and dark for drama and volume is called ___.',
      answer: 'chiaroscuro', accept: ['chiaroscuro'], explanation: 'From Italian “light-dark”. Masters: Caravaggio, Rembrandt.',
      source: 'Formal analysis', verified: true, tag: 'looking' },
    { id: 'a-question', type: 'why', prompt: 'The single question to ask of every artwork (the understanding layer)?',
      explanation: '“What problem was this artist solving?” It converts recognition into understanding.',
      source: 'Spec 03 §3', verified: true, tag: 'looking' },

    // Recognition layer (image → artist, period, why)
    { id: 'a-vangogh', type: 'instance', image: 'art/436535.jpg', prompt: 'Who painted this?',
      answer: 'Van Gogh', accept: ['van gogh', 'vincent van gogh', 'gogh'],
      explanation: 'Van Gogh, “Wheat Field with Cypresses” (1889). Post-Impressionism — swirling impasto and heightened colour make paint itself carry feeling.',
      source: 'Met Open Access (CC0)', verified: true, tag: 'Post-Impressionism' },
    { id: 'a-vermeer', type: 'instance', image: 'art/437878.jpg', prompt: 'Who painted this?',
      answer: 'Vermeer', accept: ['vermeer', 'johannes vermeer'],
      explanation: 'Vermeer, “A Maid Asleep” (ca. 1656–57). Dutch Golden Age — luminous domestic light and profound stillness.',
      source: 'Met Open Access (CC0)', verified: true, tag: 'Dutch Golden Age' },
    { id: 'a-rembrandt', type: 'instance', image: 'art/437398.jpg', prompt: 'Who painted this?',
      answer: 'Rembrandt', accept: ['rembrandt', 'rembrandt van rijn'],
      explanation: 'Rembrandt, “Flora” (ca. 1654). Dutch Golden Age — chiaroscuro used for psychological depth, not just drama.',
      source: 'Met Open Access (CC0)', verified: true, tag: 'Dutch Golden Age' },
    { id: 'a-bruegel', type: 'instance', image: 'art/435809.jpg', prompt: 'Who painted this?',
      answer: 'Bruegel', accept: ['bruegel', 'brueghel', 'pieter bruegel', 'pieter bruegel the elder'],
      explanation: 'Bruegel the Elder, “The Harvesters” (1565). Northern Renaissance — everyday peasant life and season raised to a grand subject.',
      source: 'Met Open Access (CC0)', verified: true, tag: 'Northern Renaissance' },
    { id: 'a-turner', type: 'instance', image: 'art/383001.jpg', prompt: 'Who made this?',
      answer: 'Turner', accept: ['turner', 'jmw turner', 'j.m.w. turner', 'william turner'],
      explanation: 'J.M.W. Turner, from the “Liber Studiorum” (1811). Romanticism — light and atmosphere begin to dissolve solid form, decades before Impressionism.',
      source: 'Met Open Access (CC0)', verified: true, tag: 'Romanticism' },
    { id: 'a-degas', type: 'instance', image: 'art/436135.jpg', prompt: 'Who made this?',
      answer: 'Degas', accept: ['degas', 'edgar degas'],
      explanation: 'Degas, “Dancer with a Fan” (ca. 1880). Impressionism — cropped, off-centre framing borrowed from photography and Japanese prints.',
      source: 'Met Open Access (CC0)', verified: true, tag: 'Impressionism' },
  ],
};
