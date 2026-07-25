import type { DomainContent } from '../knowledge-core/types';

// Psychology v0 — methodology FIRST (spec 03 §4): the one domain where the underlying
// literature is unreliable, so the skill of reading a claim comes before any finding.
// Every finding carries a replication-status tag. Simon should give this a real review
// pass per the accuracy gate (spec 02 §3) — not just a spot-check.
export const PSYCHOLOGY: DomainContent = {
  id: 'psychology',
  title: 'Psychology',
  blurb: 'Methods first · honest findings',
  accent: '#7e5aa2',
  newPerDay: 6,
  blocks: [
    {
      id: 'methods',
      title: 'Methods & the replication crisis',
      primer: 'Psychology is the one domain here where the widely available material is substantially unreliable. A large part of the pre-2015 canon did not replicate — yet it fills popular books and many textbooks.\n\nSo the first and most valuable skill is not any single finding: it is reading a claim and asking whether it holds up. This block is that skill, and it transfers to everything else you read.',
      lessons: [
        {
          id: 'stats-literacy', title: 'Effect size, power, p-values',
          body: 'A p-value is not the chance the result is a fluke. It is how surprising the data would be if nothing were really going on. A small p from a tiny sample with a huge claimed effect is a red flag, not a triumph.\n\nEffect size — how big the effect is — matters more than whether it is “significant”. “Significant” can mean “real but trivial”.\n\nUnderpowered studies (too few subjects) don’t just miss real effects; when they do hit significance, the effect is inflated — which is exactly why so many small, exciting studies failed to replicate.',
        },
        {
          id: 'how-it-broke', title: 'How the canon broke',
          body: 'Publication bias: journals published positive, surprising results and filed away null ones, so the literature is a biased sample of what was actually found.\n\nThe garden of forking paths: with many defensible analysis choices, a researcher can reach “significance” by luck without any dishonesty. Add p-hacking and HARKing (hypothesising after results are known) and false positives pile up.\n\nThe fixes are structural: preregistration (fix the analysis before seeing data), larger samples, and large multi-lab replications — the Many Labs and Reproducibility projects — which are the evidence for what actually holds.',
        },
        {
          id: 'the-tag', title: 'The replication tag',
          body: 'Every finding in this trainer carries a status: Robust, Mixed/smaller-than-claimed, or Failed/contested.\n\nLearn the tag with the finding. A trainer that drilled the failed canon would leave you confidently wrong — the tag is what makes the rest usable.\n\nAnd where a famous result failed, the failure is worth learning: the story of ego depletion or power posing teaches more about method than the “finding” ever did.',
        },
      ],
    },
    {
      id: 'robust-failed',
      title: 'What holds, what fell',
      primer: 'Some psychology is rock-solid; some famous results are dead. Knowing which is which — and holding the difference in mind — is the point of this whole domain.',
      lessons: [
        {
          id: 'robust', title: 'What replicates',
          body: 'Robust, repeatedly confirmed: the spacing effect and the testing (retrieval-practice) effect; the Big Five structure of personality; the narrow limits of working memory; classical and operant conditioning; most core perception findings.\n\nThese are safe to build on — and several are the science behind spaced-repetition learning itself.',
        },
        {
          id: 'failed', title: 'What failed or shrank',
          body: 'Failed or heavily contested: social priming (e.g. “elderly” words making people walk slower), ego depletion (willpower as a depletable fuel), power posing’s hormonal claims, the IAT’s predictive validity, and stereotype threat.\n\nSmaller than famously claimed: much of heuristics-and-biases, growth mindset, and facial feedback.\n\nWhen you meet these in a popular book, the confident version is usually the outdated one.',
        },
      ],
    },
    {
      id: 'memory',
      title: 'Memory',
      primer: 'Memory is one of the robust corners of psychology — and the science behind this very app. Two ideas do most of the work.',
      lessons: [
        {
          id: 'spacing-testing', title: 'Spacing and testing',
          body: 'Retrieval practice — testing yourself — strengthens memory far more than re-reading, even though re-reading feels more productive. That is the testing effect.\n\nSpacing reviews out over time beats massing them together (cramming). Difficulty at the moment of recall is the point, not a bug.\n\nTogether these are why spaced-repetition systems — like the one scheduling these cards — work.',
        },
        {
          id: 'reconstruction', title: 'Reconstruction, not playback',
          body: 'Memory is not a recording you replay. It is reconstructed each time, and each recall can subtly alter it — the misinformation effect shows how easily post-event suggestions rewrite a memory.\n\nThe practical upshot: confidence is not accuracy. A vivid, certain memory can still be wrong.',
        },
      ],
    },
  ],
  cards: [
    { id: 'psy-pvalue', type: 'why', prompt: 'What does a p-value actually tell you — and what does it NOT?',
      explanation: 'It tells you how surprising the data would be if nothing were going on. It does NOT give the probability the result is a fluke, nor how big or important the effect is.',
      source: 'Open methods literature', verified: true, tag: 'methods' },
    { id: 'psy-power', type: 'cloze', prompt: 'A study with too few subjects is under-___, and tends to inflate the effects it does find.',
      answer: 'powered', accept: ['powered'], explanation: 'Low statistical power both misses real effects and, when it hits significance, exaggerates them.',
      source: 'Open methods literature', verified: true, tag: 'methods' },
    { id: 'psy-forking', type: 'cloze', prompt: 'Trying many defensible analyses until one is significant is the “garden of ___ paths”.',
      answer: 'forking', accept: ['forking'], explanation: 'Even without dishonesty, analytic flexibility manufactures false positives.',
      source: 'Gelman & Loken', verified: true, tag: 'methods' },
    { id: 'psy-prereg', type: 'instance', prompt: 'Name the practice that defuses forking paths by fixing the analysis before seeing the data.',
      answer: 'preregistration', accept: ['preregistration', 'pre-registration', 'prereg'], explanation: 'Committing to hypotheses and analysis in advance separates confirmation from exploration.',
      source: 'Open Science practices', verified: true, tag: 'methods' },
    { id: 'psy-pubbias', type: 'why', prompt: 'What is publication bias, and why does it poison the literature?',
      explanation: 'Positive, surprising results get published while null results are filed away — so the published record is a biased sample that overstates effects.',
      source: 'Open methods literature', verified: true, tag: 'methods' },
    { id: 'psy-spacing-robust', type: 'instance', prompt: 'The spacing effect (spaced beats massed study) — replication status?',
      answer: 'robust', accept: ['robust', 'replicates', 'holds'], explanation: 'One of the most reliable findings in all of psychology — and the basis of SRS.',
      source: 'Many Labs / meta-analyses', verified: true, tag: 'robust' },
    { id: 'psy-testing-robust', type: 'cloze', prompt: 'Testing yourself strengthens memory more than re-reading — the ___ effect (robust).',
      answer: 'testing', accept: ['testing', 'retrieval', 'retrieval practice'], explanation: 'Retrieval practice; robustly replicated across materials and ages.',
      source: 'Roediger & Karpicke; replications', verified: true, tag: 'robust' },
    { id: 'psy-bigfive', type: 'instance', prompt: 'The Big Five structure of personality — replication status?',
      answer: 'robust', accept: ['robust', 'replicates', 'holds'], explanation: 'The five-factor structure recurs across cultures and methods — one of personality psychology’s solid results.',
      source: 'Cross-cultural replications', verified: true, tag: 'robust' },
    { id: 'psy-powerpose', type: 'instance', prompt: '“Power posing changes your hormones and behaviour” — replication status?',
      answer: 'failed', accept: ['failed', 'failed to replicate', 'debunked', 'not replicated'], explanation: 'The hormonal/behavioural claims failed to replicate (Ranehill et al. 2015); a co-author publicly withdrew support.',
      source: 'Ranehill et al. 2015', verified: true, tag: 'failed' },
    { id: 'psy-egodepletion', type: 'instance', prompt: 'Ego depletion (willpower as a depletable fuel) — replication status?',
      answer: 'failed', accept: ['failed', 'failed to replicate', 'contested', 'not replicated'], explanation: 'A large Registered Replication Report found essentially no effect. Heavily contested at best.',
      source: 'RRR (Hagger et al. 2016)', verified: true, tag: 'failed' },
    { id: 'psy-priming', type: 'instance', prompt: 'Social priming (e.g. “elderly” words → walking slower) — replication status?',
      answer: 'failed', accept: ['failed', 'failed to replicate', 'not replicated', 'debunked'], explanation: 'Flagship social-priming effects failed to replicate and are a central example of the crisis.',
      source: 'Replication attempts', verified: true, tag: 'failed' },
    { id: 'psy-teach-failure', type: 'why', prompt: 'Why teach the FAILURE of a result like power posing, not just skip it?',
      explanation: 'The story of how a famous finding collapsed teaches effect size, power, and publication bias more vividly than any clean statement — and inoculates you against the next overclaim.',
      source: 'Spec 03 §4', verified: true, tag: 'methods' },
    { id: 'psy-memory-recon', type: 'why', prompt: 'Is memory playback or reconstruction — and why does it matter?',
      explanation: 'Reconstruction: memory is rebuilt each recall and can be altered (misinformation effect). So confidence is not accuracy — a vivid memory can still be wrong.',
      source: 'Loftus; robust', verified: true, tag: 'memory' },
    { id: 'psy-wm', type: 'why', prompt: 'What do working-memory limits tell us about how much we can hold at once?',
      explanation: 'Only a few items (famously ~4, not the myth of “7±2”) can be held actively at once — a robust constraint that shapes learning, UI, and instruction.',
      source: 'Cowan; robust', verified: true, tag: 'robust' },
  ],
};
