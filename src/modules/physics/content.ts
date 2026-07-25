import type { DomainContent } from '../knowledge-core/types';

// Physics v0 — textbook-anchored (Newtonian core), conceptual (no problem sets), with
// misconception cards (state the error, then why it's wrong) per spec 02 §3 / 03 §1.
// Settled material: low accuracy risk. Diagrams are static SVG, themed via CSS vars.
const forcesSvg =
  '<svg viewBox="0 0 340 150" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, sans-serif">' +
  '<defs><marker id="ph-ar" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)"/></marker></defs>' +
  '<rect x="70" y="55" width="70" height="45" rx="6" fill="var(--accent)" opacity="0.18" stroke="var(--accent)"/>' +
  '<text x="105" y="82" font-size="15" font-weight="700" text-anchor="middle" fill="var(--plat-text)">m</text>' +
  '<line x1="140" y1="70" x2="250" y2="70" stroke="var(--accent)" stroke-width="3" marker-end="url(#ph-ar)"/>' +
  '<text x="255" y="74" font-size="14" font-weight="600" fill="var(--plat-text)">F</text>' +
  '<line x1="140" y1="100" x2="210" y2="100" stroke="var(--plat-muted)" stroke-width="2" marker-end="url(#ph-ar)"/>' +
  '<text x="215" y="104" font-size="13" fill="var(--plat-muted)">a</text>' +
  '<text x="70" y="135" font-size="14" fill="var(--plat-text)">Net force F gives acceleration a  ·  F = m a</text>' +
  '</svg>';

const waveSvg =
  '<svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, sans-serif">' +
  '<text x="10" y="18" font-size="13" font-weight="600" fill="var(--plat-text)">Constructive: crest + crest → bigger</text>' +
  '<path d="M10,45 Q 30,25 50,45" fill="none" stroke="var(--plat-muted)" stroke-width="2"/>' +
  '<path d="M60,45 Q 80,25 100,45" fill="none" stroke="var(--plat-muted)" stroke-width="2"/>' +
  '<text x="112" y="49" font-size="14" fill="var(--plat-muted)">=</text>' +
  '<path d="M130,50 Q 155,10 180,50" fill="none" stroke="var(--accent)" stroke-width="3"/>' +
  '<text x="10" y="110" font-size="13" font-weight="600" fill="var(--plat-text)">Destructive: crest + trough → cancel</text>' +
  '<path d="M10,140 Q 30,120 50,140" fill="none" stroke="var(--plat-muted)" stroke-width="2"/>' +
  '<path d="M60,140 Q 80,160 100,140" fill="none" stroke="var(--plat-muted)" stroke-width="2"/>' +
  '<text x="112" y="144" font-size="14" fill="var(--plat-muted)">=</text>' +
  '<line x1="130" y1="140" x2="185" y2="140" stroke="var(--accent)" stroke-width="3"/>' +
  '</svg>';

export const PHYSICS: DomainContent = {
  id: 'physics',
  title: 'Physics',
  blurb: 'Concepts · no problem sets',
  accent: '#5457b0',
  newPerDay: 6,
  blocks: [
    {
      id: 'mechanics',
      title: 'Motion, force, momentum',
      primer: 'Classical mechanics is the frame every later idea is built on. It assumes space and time are absolute, and that given the positions and forces now, the future is fixed.\n\nBoth assumptions hold astonishingly well at everyday scales — and both break later (relativity, quantum). Start here because energy, fields and waves all speak this language.',
      lessons: [
        {
          id: 'three-laws', title: 'Newton’s three laws', diagram: forcesSvg,
          body: 'First law (inertia): a body keeps its velocity unless a net force acts. No force is needed to keep something moving — only to change its motion. Friction hides this on Earth.\n\nSecond law: net force = mass × acceleration (F = ma). A force changes momentum; the same force moves a light object more than a heavy one.\n\nThird law: forces come in equal and opposite pairs, acting on different bodies. The ground pushes back on your foot; that pair is why you can walk.',
        },
        {
          id: 'momentum', title: 'Momentum and conservation',
          body: 'Momentum is mass × velocity (p = mv). In an isolated system — no outside forces — total momentum never changes.\n\nThat single fact explains recoil, rocket propulsion, and every collision: whatever momentum one object gains, another loses.\n\nAnd it isn’t an accident. Conservation of momentum follows from a symmetry — space looks the same everywhere — a preview of the deepest idea in the next block.',
        },
        {
          id: 'mech-misconceptions', title: 'Common wrong turns',
          body: 'Knowing the usual error is often a faster route to the concept than the clean statement.\n\n“Heavier objects fall faster.” False — in a vacuum everything accelerates at the same g; air resistance causes the everyday difference.\n\n“Moving things need a continuous force.” False (first law) — they need a force only to speed up, slow down, or turn.\n\n“Centrifugal force throws you outward.” There is no outward force. You feel your own inertia while a real inward force (centripetal) curves your path.',
        },
      ],
    },
    {
      id: 'energy',
      title: 'Energy and conservation',
      primer: 'If one idea deserves to be called the centre of physics, it is energy conservation. Energy changes form — kinetic, potential, thermal, radiant — but the total in a closed system never changes.\n\nAnd there is a deep reason, not just an observation: conservation laws come from symmetries. That is the thread that ties all of physics together.',
      lessons: [
        {
          id: 'energy-forms', title: 'Forms and transformations',
          body: 'Kinetic energy is the energy of motion, ½mv². Potential energy is stored by position or configuration — gravitational (mgh), elastic, chemical.\n\nEnergy flows between these forms. A pendulum trades potential energy at the top of its swing for kinetic energy at the bottom, back and forth, losing a little to heat through friction each time.\n\nNothing is created or destroyed; it only changes address.',
        },
        {
          id: 'symmetry', title: 'Symmetry and conservation',
          body: 'Noether’s theorem: every continuous symmetry of the laws of physics yields a conserved quantity.\n\nTime-translation symmetry — the laws are the same today as tomorrow — gives conservation of energy. Space-translation gives momentum. Rotational symmetry gives angular momentum.\n\nThis is why conservation laws feel unbreakable: they would fail only if the laws of nature themselves changed.',
        },
      ],
    },
    {
      id: 'waves',
      title: 'Waves and superposition',
      primer: 'Most people meet superposition first as a quantum mystery. That is the wrong order.\n\nWater and sound already do it. Grasp interference with ripples and you have removed most of the “weirdness” of quantum mechanics before you even arrive.',
      lessons: [
        {
          id: 'superposition', title: 'Superposition and interference', diagram: waveSvg,
          body: 'A wave carries energy, not matter. When two waves overlap, their displacements simply add, point by point — that is superposition.\n\nCrest on crest makes a bigger crest (constructive). Crest on trough cancels to nothing (destructive). Across space this produces interference patterns: bright and dark bands, loud and quiet spots.',
        },
        {
          id: 'waves-first', title: 'Why waves before quantum',
          body: 'The famous double-slit pattern is just interference. Light — and even single electrons — show it because they have a wave aspect.\n\nMeeting superposition in water first means the quantum version arrives as a familiar idea in a new setting, rather than a paradox to be accepted on faith.',
        },
      ],
    },
  ],
  cards: [
    { id: 'p-law1', type: 'why', prompt: 'Newton’s first law — what does it say, and what’s the common misreading?',
      explanation: 'A body keeps its velocity unless a net force acts. The misreading is that motion needs a continuous force — it doesn’t; only a CHANGE in motion does. Friction on Earth hides this.',
      source: 'Newtonian mechanics (OpenStax)', verified: true, tag: 'mechanics' },
    { id: 'p-fma', type: 'cloze', prompt: 'Newton’s second law: net force = mass × ___.',
      answer: 'acceleration', accept: ['acceleration', 'a'], explanation: 'F = ma. A force changes momentum; the same force accelerates a light object more than a heavy one.',
      source: 'Newtonian mechanics', verified: true, tag: 'mechanics' },
    { id: 'p-law3', type: 'cloze', prompt: 'Newton’s third law: forces come in equal and ___ pairs, on different bodies.',
      answer: 'opposite', accept: ['opposite'], explanation: 'The pair acts on two different objects — the ground pushing back on your foot is why you can walk.',
      source: 'Newtonian mechanics', verified: true, tag: 'mechanics' },
    { id: 'p-momentum', type: 'instance', prompt: 'In an isolated system, which quantity is conserved in any collision?',
      answer: 'momentum', accept: ['momentum'], explanation: 'Total momentum (Σmv) is unchanged — the basis of recoil, rockets, and collisions.',
      source: 'Newtonian mechanics', verified: true, tag: 'mechanics' },
    { id: 'p-fall', type: 'why', prompt: 'Do heavier objects fall faster? State the error and the truth.',
      explanation: 'Error: heavier = faster. Truth: in a vacuum all objects accelerate equally at g; the everyday difference is air resistance, not weight. A feather and hammer land together on the Moon.',
      source: 'Misconception card (spec 02 §3)', verified: true, tag: 'misconception' },
    { id: 'p-centrifugal', type: 'why', prompt: 'Is there a centrifugal force pushing you outward in a turn? Error and truth.',
      explanation: 'Error: an outward force throws you out. Truth: there is no outward force — you feel your own inertia while a real INWARD (centripetal) force curves your path.',
      source: 'Misconception card', verified: true, tag: 'misconception' },
    { id: 'p-ke', type: 'cloze', prompt: 'Kinetic energy = ½ m ___² (the speed term).',
      answer: 'v', accept: ['v', 'velocity', 'speed'], explanation: 'KE = ½mv². Doubling speed quadruples kinetic energy — why stopping distances grow so fast.',
      source: 'OpenStax University Physics', verified: true, tag: 'energy' },
    { id: 'p-energy-why', type: 'why', prompt: 'What is the deep reason energy is conserved — not just “it is”?',
      explanation: 'Time-translation symmetry: the laws of physics are the same over time. By Noether’s theorem, that symmetry yields conservation of energy.',
      source: 'Noether’s theorem', verified: true, tag: 'energy' },
    { id: 'p-noether', type: 'cloze', prompt: 'Every continuous symmetry yields a conservation law — this is ___’s theorem.',
      answer: 'Noether', accept: ['noether'], explanation: 'Emmy Noether, 1918 — arguably the most important theorem in theoretical physics.',
      source: 'Noether’s theorem', verified: true, tag: 'energy' },
    { id: 'p-momentum-symmetry', type: 'instance', prompt: 'Which symmetry corresponds to conservation of momentum?',
      answer: 'space translation', accept: ['space translation', 'translational', 'translation', 'spatial translation', 'translation in space'],
      explanation: 'Space-translation symmetry — physics is the same here as one metre over — gives conservation of momentum.', source: 'Noether’s theorem', verified: true, tag: 'energy' },
    { id: 'p-pendulum', type: 'instance', prompt: 'A pendulum converts potential energy at the top into ___ energy at the bottom.',
      answer: 'kinetic', accept: ['kinetic'], explanation: 'PE ↔ KE, endlessly, minus a little lost to heat via friction.',
      source: 'OpenStax', verified: true, tag: 'energy' },
    { id: 'p-superpose', type: 'why', prompt: 'When two waves overlap, what happens to their displacements?',
      explanation: 'They add, point by point — superposition. Crest+crest → bigger (constructive); crest+trough → cancel (destructive).',
      source: 'OpenStax, waves', verified: true, tag: 'waves' },
    { id: 'p-destructive', type: 'instance', prompt: 'Crest meets trough of equal size: the waves ___ (destructive interference).',
      answer: 'cancel', accept: ['cancel', 'cancel out', 'cancel each other'], explanation: 'Equal and opposite displacements sum to zero — silence, or a dark band.',
      source: 'OpenStax, waves', verified: true, tag: 'waves' },
    { id: 'p-waves-first', type: 'why', prompt: 'Why teach waves BEFORE quantum mechanics?',
      explanation: 'Superposition and interference are ordinary in water and sound. Meeting them there first removes the “mystery” from the quantum double-slit — it’s the same idea in a new setting.',
      source: 'Spec 03 §1', verified: true, tag: 'waves' },
  ],
};
