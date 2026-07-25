import type { DomainContent } from '../knowledge-core/types';

// Wine v0 — Block 1 (systematic tasting + pairing logic), the country-labelling insight,
// and classic appellation facts. All items are stable, factual, and public (appellation
// regulations / grape composition). source + verified per the accuracy gate; Simon should
// still spot-check specifics per spec 02 §3 before relying on them.
export const WINE: DomainContent = {
  id: 'wine',
  title: 'Wine',
  blurb: 'Tasting · regions · grapes',
  accent: '#7b2f3f',
  newPerDay: 6,
  blocks: [
    {
      id: 'tasting',
      title: 'Systematic tasting',
      primer: 'Before any bottle can teach you anything, you need a fixed structure to taste against. Without one, every wine is an isolated impression you forget by the next glass.\n\nWith one, each bottle becomes a data point you can compare across regions, grapes and years. Assess the same six things, in the same order, every time.',
      lessons: [
        {
          id: 'six-axes',
          title: 'The six axes',
          diagram: '<svg viewBox="0 0 340 208" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, sans-serif">' +
            '<circle cx="18" cy="24" r="5" fill="var(--accent)"/><text x="34" y="28" font-size="14" font-weight="600" fill="var(--plat-text)">Acid</text><text x="150" y="28" font-size="12" fill="var(--plat-muted)">freshness · backbone</text>' +
            '<circle cx="18" cy="56" r="5" fill="var(--accent)"/><text x="34" y="60" font-size="14" font-weight="600" fill="var(--plat-text)">Tannin</text><text x="150" y="60" font-size="12" fill="var(--plat-muted)">grip · structure (reds)</text>' +
            '<circle cx="18" cy="88" r="5" fill="var(--accent)"/><text x="34" y="92" font-size="14" font-weight="600" fill="var(--plat-text)">Alcohol</text><text x="150" y="92" font-size="12" fill="var(--plat-muted)">warmth</text>' +
            '<circle cx="18" cy="120" r="5" fill="var(--accent)"/><text x="34" y="124" font-size="14" font-weight="600" fill="var(--plat-text)">Body</text><text x="150" y="124" font-size="12" fill="var(--plat-muted)">weight · texture</text>' +
            '<circle cx="18" cy="152" r="5" fill="var(--accent)"/><text x="34" y="156" font-size="14" font-weight="600" fill="var(--plat-text)">Fruit</text><text x="150" y="156" font-size="12" fill="var(--plat-muted)">ripeness · profile</text>' +
            '<circle cx="18" cy="184" r="5" fill="var(--accent)"/><text x="34" y="188" font-size="14" font-weight="600" fill="var(--plat-text)">Finish</text><text x="150" y="188" font-size="12" fill="var(--plat-muted)">length</text>' +
            '</svg>',
          body: 'Acid is the wine’s freshness and backbone — it makes your mouth water and keeps a wine lively. High acid feels tart and crisp; low acid feels soft, even flabby.\n\nTannin is the drying, grippy sensation on your gums, mostly in reds, from grape skins and oak. It gives structure and ageing potential.\n\nAlcohol is felt as warmth; body is the wine’s overall weight and texture — light like skim milk, or full like cream.\n\nFruit describes the ripeness and flavour family (citrus, stone fruit, red or black berry). Finish is how long the flavour lasts after you swallow — a long finish is a mark of quality.',
        },
        {
          id: 'pairing-logic',
          title: 'Pairing is logic, not lists',
          body: 'You don’t memorise pairings — you reason them from four rules.\n\nMatch acidity to fat: a high-acid wine cuts through rich, fatty food and refreshes the palate.\n\nMatch tannin to protein: tannin binds with protein and fat, so a tannic red feels smoother beside a steak than on its own.\n\nKeep the wine’s sweetness above the dish’s: a wine less sweet than the dessert tastes thin and sour.\n\nMatch weight to weight: a delicate dish is flattened by a heavy wine, and vice versa.',
        },
      ],
    },
    {
      id: 'labelling',
      title: 'What the label tells you',
      primer: 'Here is the single most useful thing to learn about wine: every country answers “what does the label tell you?” differently.\n\nLearn each country’s organising principle and you can read a label you’ve never seen before — worth more than memorising any individual appellation.',
      lessons: [
        { id: 'lab-france', title: 'France — by place', body: 'France labels by PLACE. The grape is usually absent — a red Burgundy says “Gevrey-Chambertin”, not “Pinot Noir”, because the appellation implies the grape and style.\n\nMost French regions blend: Bordeaux (Cabernet Sauvignon, Merlot, Cabernet Franc, Petit Verdot, Malbec), the southern Rhône (Grenache-Syrah-Mourvèdre), Champagne (Chardonnay, Pinot Noir, Meunier).\n\nThe exception is Burgundy: monovarietal (Pinot Noir or Chardonnay) yet still labelled by place. The rule holds; the blending habit doesn’t.' },
        { id: 'lab-italy', title: 'Italy — place + native grape', body: 'Italy labels by PLACE plus its NATIVE GRAPE, under the DOC/DOCG system, with enormous varietal diversity.\n\nBrunello di Montalcino is 100% Sangiovese; Barolo and Barbaresco are 100% Nebbiolo; Chianti Classico is at least 80% Sangiovese. The place tells you the rules; the grape tells you the character.' },
        { id: 'lab-spain', title: 'Spain — grape + time in oak', body: 'Spain often labels by GRAPE plus TIME IN OAK AND BOTTLE. The ladder Joven → Crianza → Reserva → Gran Reserva is an AGEING classification — not a region, and not a quality tier, a point widely misread.\n\nA Gran Reserva has simply spent the most time maturing before release.' },
        { id: 'lab-germany', title: 'Germany — grape + ripeness', body: 'Germany labels by GRAPE plus RIPENESS AT HARVEST. The Prädikat ladder — Kabinett → Spätlese → Auslese → Beerenauslese → Trockenbeerenauslese — measures must weight (sugar/ripeness when picked), not the sweetness of the finished wine.\n\nA Kabinett can be made bone dry.' },
        { id: 'lab-newworld', title: 'New World — grape first', body: 'The New World (California, Australia, Chile and the rest) labels by GRAPE first, region second — the inverse of France. “Barossa Shiraz” names the grape, then the place.\n\nIt’s the most immediately readable system, and the reason France can feel opaque by comparison.' },
      ],
    },
    {
      id: 'regions',
      title: 'A few anchor regions',
      primer: 'The atomic unit of wine study is a single appellation — small enough to learn in one sitting, rich enough to be worth it.\n\nAn “introduction to Italian wine” is one overview; the real learning is region by region. Here are a few anchors; the review cards drill the specifics.',
      lessons: [
        { id: 'reg-italy', title: 'Italy: Piedmont & Tuscany', body: 'Piedmont’s Barolo and Barbaresco are 100% Nebbiolo — pale in colour, high in acid and tannin, powerful despite looking delicate.\n\nIn Tuscany, Sangiovese rules: Brunello di Montalcino (100% Sangiovese from the warmer Montalcino climate, five years’ minimum ageing) and Chianti Classico (at least 80% Sangiovese).' },
        { id: 'reg-france', title: 'France: the classics', body: 'Bordeaux blends its five reds to hedge site and vintage. Burgundy splits into tiny place-named plots of Pinot Noir and Chardonnay.\n\nThe southern Rhône’s GSM (Grenache-Syrah-Mourvèdre) powers Châteauneuf-du-Pape. Champagne blends Chardonnay, Pinot Noir and Meunier — and is a place, not merely a style.' },
      ],
    },
  ],
  cards: [
    // --- Block 1: systematic tasting + pairing logic ---
    { id: 'w-taste-axes', type: 'why', prompt: 'Systematic tasting fixes the things you assess in every glass. What are they?',
      explanation: 'Acid, tannin, alcohol, body, fruit, finish — a fixed structure so every bottle becomes a comparable data point rather than an anecdote.',
      source: 'Spec 03 §Wine, block 1', verified: true, tag: 'tasting' },
    { id: 'w-taste-first', type: 'why', prompt: 'Why taste to a fixed structure from the very first bottle?',
      explanation: 'Without a structure, each subsequent bottle is an isolated impression. With one, you build a mental library you can compare across regions and vintages.',
      source: 'Spec 03 §Wine', verified: true, tag: 'tasting' },
    { id: 'w-pair-acid', type: 'cloze', prompt: 'Pairing logic: match acidity to ___ (rich, fatty dishes).',
      answer: 'fat', accept: ['fat', 'fatty', 'richness'], explanation: 'Acid cuts through fat and refreshes the palate — think a crisp white with fried food.',
      source: 'Spec 03 §Wine, pairing', verified: true, tag: 'pairing' },
    { id: 'w-pair-tannin', type: 'cloze', prompt: 'Pairing logic: match tannin to ___ (it binds and softens against it).',
      answer: 'protein', accept: ['protein', 'proteins'], explanation: 'Tannin binds with protein and fat, so a tannic red feels smoother with a steak than on its own.',
      source: 'Spec 03 §Wine, pairing', verified: true, tag: 'pairing' },
    { id: 'w-pair-sweet', type: 'cloze', prompt: 'Pairing a dessert: the wine’s sweetness should sit ___ the dish’s sweetness.',
      answer: 'above', accept: ['above', 'higher'], explanation: 'A wine less sweet than the dessert tastes thin and sour beside it — sweet wine must out-sweet the plate.',
      source: 'Spec 03 §Wine, pairing', verified: true, tag: 'pairing' },
    { id: 'w-pair-weight', type: 'cloze', prompt: 'Pairing logic: match the ___ of the wine to the weight of the dish.',
      answer: 'weight', accept: ['weight', 'body'], explanation: 'A light dish is flattened by a heavy wine and vice versa — weight to weight, body to body.',
      source: 'Spec 03 §Wine, pairing', verified: true, tag: 'pairing' },

    // --- The structural insight the module is built on ---
    { id: 'w-label-fr-nw', type: 'why', prompt: 'Each wine country answers “what does the label tell you?” differently. What are France’s and the New World’s answers?',
      explanation: 'France labels by PLACE (appellation) — the grape is usually absent. The New World labels by GRAPE first, region second. Learning that difference is worth more than any single appellation.',
      source: 'Spec 03 §Wine, organising principle', verified: true, tag: 'labelling' },
    { id: 'w-burgundy-exception', type: 'why', prompt: 'Burgundy is France’s exception to place-labelling. How?',
      explanation: 'It is monovarietal — Pinot Noir for reds, Chardonnay for whites — yet still labelled by PLACE, not grape. The rule (label by place) holds; the blending norm does not.',
      source: 'Spec 03 §Wine, France', verified: true, tag: 'France' },

    // --- Classic appellation / grape facts ---
    { id: 'w-brunello', type: 'instance', prompt: 'Brunello di Montalcino is made from 100% which grape?',
      answer: 'Sangiovese', accept: ['sangiovese'], explanation: 'Brunello is 100% Sangiovese from the warmer, drier Montalcino mesoclimate, with long ageing (min. five years).',
      source: 'DOCG regulations', verified: true, tag: 'Italy' },
    { id: 'w-barolo', type: 'instance', prompt: 'Barolo and Barbaresco are made from 100% which grape?',
      answer: 'Nebbiolo', accept: ['nebbiolo'], explanation: 'Both Piedmont DOCGs are 100% Nebbiolo — high acid, high tannin, pale colour that belies its power.',
      source: 'DOCG regulations', verified: true, tag: 'Italy' },
    { id: 'w-chianti', type: 'cloze', prompt: 'Chianti Classico must be at least ___% Sangiovese.',
      answer: '80', accept: ['80', '80%'], explanation: 'Chianti Classico requires a minimum 80% Sangiovese, with the rest from permitted local or international grapes.',
      source: 'DOCG regulations', verified: true, tag: 'Italy' },
    { id: 'w-gsm', type: 'instance', prompt: 'The southern Rhône “GSM” blend is Grenache, Syrah, and ___.',
      answer: 'Mourvèdre', accept: ['mourvedre', 'mourvèdre'], explanation: 'Grenache (fruit/warmth), Syrah (structure/spice), Mourvèdre (savoury grip) — the backbone of Châteauneuf-du-Pape and much of the south.',
      source: 'Appellation practice', verified: true, tag: 'France' },
    { id: 'w-bordeaux', type: 'why', prompt: 'Name the principal red grapes permitted in a classic Bordeaux blend.',
      explanation: 'Cabernet Sauvignon, Merlot, Cabernet Franc, Petit Verdot, and Malbec. Bordeaux blends rather than relying on one grape — the mix hedges vintage and site.',
      source: 'Appellation practice', verified: true, tag: 'France' },
    { id: 'w-rioja-ladder', type: 'cloze', prompt: 'Spain’s ageing ladder: Joven → Crianza → Reserva → ___.',
      answer: 'Gran Reserva', accept: ['gran reserva', 'granreserva'], explanation: 'Each step requires more time in oak and bottle before release.',
      source: 'Spanish DO ageing rules', verified: true, tag: 'Spain' },
    { id: 'w-rioja-meaning', type: 'why', prompt: 'In Spain, what do Crianza / Reserva / Gran Reserva classify — and what is it commonly misread as?',
      explanation: 'They classify TIME IN OAK AND BOTTLE (ageing), not the region or inherent quality. It is widely misread as a quality or origin tier — it is an ageing scale.',
      source: 'Spec 03 §Wine, Spain', verified: true, tag: 'Spain' },
    { id: 'w-pradikat', type: 'cloze', prompt: 'Germany’s Prädikat ripeness ladder: Kabinett → Spätlese → Auslese → BA → ___.',
      answer: 'TBA', accept: ['tba', 'trockenbeerenauslese'], explanation: 'Trockenbeerenauslese (TBA) — from individually selected botrytised, shrivelled berries.',
      source: 'German wine law', verified: true, tag: 'Germany' },
    { id: 'w-pradikat-meaning', type: 'why', prompt: 'German Prädikat levels (Kabinett…TBA) measure what, exactly?',
      explanation: 'Must weight — the sugar/ripeness of the grapes AT HARVEST — not the sweetness of the finished wine. A Kabinett can be made bone dry.',
      source: 'Spec 03 §Wine, Germany', verified: true, tag: 'Germany' },
    { id: 'w-champagne', type: 'instance', prompt: 'Champagne’s three principal grapes are Chardonnay, Pinot Noir, and ___.',
      answer: 'Meunier', accept: ['meunier', 'pinot meunier'], explanation: 'Meunier adds fruit and approachability; Chardonnay finesse; Pinot Noir structure.',
      source: 'Appellation practice', verified: true, tag: 'Champagne' },
  ],
};
