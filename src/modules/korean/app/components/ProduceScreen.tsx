// PRODUCE block — commit-then-reveal, strictly in that order (specs/03 §5).
// Revealing models before commitment turns retrieval into copying.

import { useState } from 'react';
import type { ContentJson, CurriculumDay } from '../content/types';

export interface ProduceResult {
  prompt: string;
  sentences: string[];
  selfRating: number | null;
  uncertain: string;
}

interface Props {
  content: ContentJson;
  day: CurriculumDay | undefined;
  onDone: (result: ProduceResult) => void;
}

export function ProduceScreen({ content, day, onDone }: Props): React.JSX.Element {
  const [sentences, setSentences] = useState(['', '', '']);
  const [committed, setCommitted] = useState(false);
  const [selfRating, setSelfRating] = useState<number | null>(null);
  const [uncertain, setUncertain] = useState('');
  const prompt = day?.produce_prompt ?? '';

  if (!day || !prompt) {
    onDone({ prompt: '', sentences: [], selfRating: null, uncertain: '' });
    return <div className="screen" />;
  }

  const anyText = sentences.some((s) => s.trim() !== '');

  return (
    <div className="screen">
      <h2>Produce</h2>
      <p style={{ fontSize: 16 }}>{prompt}</p>

      {sentences.map((value, i) => (
        <input
          key={i}
          type="text"
          lang="ko"
          value={value}
          disabled={committed}
          placeholder={`${i + 1}.`}
          autoCapitalize="none"
          autoCorrect="off"
          onChange={(e) =>
            setSentences((prev) => prev.map((s, j) => (j === i ? e.target.value : s)))
          }
        />
      ))}

      {committed && (
        <div className="card-face">
          <p className="small">Model answers</p>
          {day.produce_models.map((mid) => {
            const model = content.sentences[mid];
            return model ? (
              <div key={mid}>
                <p className="ko" lang="ko">
                  {model.ko}
                </p>
                <p className="en">{model.en}</p>
              </div>
            ) : null;
          })}
          <p className="small" style={{ marginTop: 8 }}>
            How did it go?
          </p>
          <div className="button-row">
            {[0, 1, 2, 3].map((n) => (
              <button
                key={n}
                className={selfRating === n ? 'primary' : ''}
                onClick={() => setSelfRating(n)}
              >
                {n}/3
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            placeholder="Uncertain about… (optional — the most valuable line in the log)"
            value={uncertain}
            onChange={(e) => setUncertain(e.target.value)}
          />
        </div>
      )}

      <div className="thumb-zone">
        {!committed ? (
          <button className="primary wide" disabled={!anyText} onClick={() => setCommitted(true)}>
            Commit
          </button>
        ) : (
          <button
            className="primary wide"
            onClick={() => onDone({ prompt, sentences, selfRating, uncertain })}
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
