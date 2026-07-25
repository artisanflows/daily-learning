// Learn (browse) layer — the study side of the trainer, mirroring chess's Study and
// wine's Learn. All the curriculum prose + grammar the app already has is only seen
// mid-session; this screen makes the whole thing browsable any time, no session needed.

import { useMemo, useState } from 'react';
import type { ContentJson, CurriculumDay } from '../content/types';
import { speakKorean } from '../utils/audio';

interface Props {
  content: ContentJson;
  /** How far the learner has progressed (progress.curriculum_day) — marks studied days. */
  currentDay: number;
  onBack: () => void;
}

export function LearnScreen({ content, currentDay, onBack }: Props): React.JSX.Element {
  const [tab, setTab] = useState<'lessons' | 'grammar'>('lessons');
  const [openId, setOpenId] = useState<string | null>(null);

  const open = openId ? content.curriculum.find((d) => d.id === openId) : undefined;
  if (open) return <DayReader content={content} day={open} onBack={() => setOpenId(null)} />;

  return (
    <div className="screen">
      <h2>Learn</h2>
      <div className="button-row">
        <button className={tab === 'lessons' ? 'primary' : ''} onClick={() => setTab('lessons')}>Lessons</button>
        <button className={tab === 'grammar' ? 'primary' : ''} onClick={() => setTab('grammar')}>Grammar</button>
      </div>

      {tab === 'lessons'
        ? <LessonList content={content} currentDay={currentDay} onOpen={setOpenId} />
        : <GrammarList content={content} />}

      <div className="thumb-zone">
        <button className="wide" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

function LessonList({ content, currentDay, onOpen }: { content: ContentJson; currentDay: number; onOpen: (id: string) => void }) {
  // Group the flat curriculum by phase so the list reads like a table of contents.
  const phases = useMemo(() => {
    const map = new Map<number, CurriculumDay[]>();
    content.curriculum.forEach((d) => { const a = map.get(d.phase) ?? []; a.push(d); map.set(d.phase, a); });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [content.curriculum]);

  return (
    <div className="learn-list">
      {phases.map(([phase, days]) => (
        <div key={phase}>
          <p className="small learn-list__head">Phase {phase}{phase === 0 ? ' · The writing system' : ' · Speaking & grammar'}</p>
          {days.map((d) => {
            const idx = content.curriculum.indexOf(d);
            const studied = idx < currentDay;
            const here = idx === currentDay;
            return (
              <button key={d.id} className="learn-row" onClick={() => onOpen(d.id)}>
                <span className="learn-row__mark">{studied ? '✓' : here ? '▸' : ''}</span>
                <span className="learn-row__title">{d.title}</span>
                <span className="learn-row__meta small">W{d.week}·D{d.day}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DayReader({ content, day, onBack }: { content: ContentJson; day: CurriculumDay; onBack: () => void }) {
  return (
    <div className="screen">
      <p className="small">Week {day.week} · Day {day.day}</p>
      <h2>{day.title}</h2>
      <div className="lesson">{day.body}</div>

      {day.introduces.grammar.length > 0 && (
        <>
          <p className="small learn-list__head">Grammar introduced</p>
          {day.introduces.grammar.map((gid) => {
            const g = content.grammar[gid];
            return g ? <GrammarCard key={gid} g={g} /> : null;
          })}
        </>
      )}

      {day.introduces.sentences.length > 0 && (
        <>
          <p className="small learn-list__head">Sentences</p>
          {day.introduces.sentences.map((sid) => {
            const s = content.sentences[sid];
            return s ? (
              <div className="card-face" key={sid}>
                <p className="ko" lang="ko">{s.ko}</p>
                <p className="en">{s.en}</p>
                {s.literal && <p className="gloss">{s.literal}</p>}
                <button onClick={() => speakKorean(s.ko, { rate: 0.85 })}>▶ Listen</button>
              </div>
            ) : null;
          })}
        </>
      )}

      <div className="thumb-zone">
        <button className="wide" onClick={onBack}>Back to lessons</button>
      </div>
    </div>
  );
}

function GrammarList({ content }: { content: ContentJson }) {
  const items = useMemo(
    () => Object.values(content.grammar).sort((a, b) => a.phase - b.phase),
    [content.grammar],
  );
  return <div className="learn-list">{items.map((g) => <GrammarCard key={g.id} g={g} />)}</div>;
}

function GrammarCard({ g }: { g: ContentJson['grammar'][string] }) {
  return (
    <div className="card-face">
      <h2 lang="ko">{g.name}</h2>
      <p className="gloss">{g.form}</p>
      <p style={{ fontSize: 16 }}>{g.meaning}</p>
      {g.examples.length > 0 && (
        <ul className="learn-eg">
          {g.examples.map((ex, i) => <li key={i} lang="ko">{ex}</li>)}
        </ul>
      )}
      {g.contrast && <p className="small">{g.contrast}</p>}
    </div>
  );
}
