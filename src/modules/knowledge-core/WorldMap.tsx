import { useState } from 'react';
import type { MapPin } from './types';

// A deliberately STYLISED world outline (not cartographically precise) in a 360×180
// equirectangular space, so pins placed by (lon+180, 90−lat) land on roughly the right
// landmass. Its only job is to give wine regions a spatial sense; the labels carry meaning.
const LAND = [
  // North America
  'M40 34 L96 30 L100 44 L84 60 L74 72 L64 64 L58 50 L44 46 Z',
  // Central America bridge
  'M84 66 L100 72 L108 82 L98 82 L86 74 Z',
  // South America
  'M104 84 L124 90 L120 112 L112 140 L104 150 L99 122 L100 98 Z',
  // Europe
  'M168 32 L196 30 L198 44 L188 52 L172 52 L166 42 Z',
  // Africa
  'M172 56 L206 54 L210 82 L196 112 L184 130 L177 104 L170 78 Z',
  // Asia
  'M200 30 L306 24 L326 44 L306 66 L256 72 L220 64 L202 48 Z',
  // SE Asia / Indonesia
  'M300 74 L322 72 L326 86 L306 90 L298 82 Z',
  // Australia
  'M304 112 L338 110 L342 128 L320 136 L303 128 Z',
];

export function WorldMap({ pins, accent, onPick }: { pins: MapPin[]; accent: string; onPick: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <svg viewBox="0 0 360 180" className="k-worldmap" role="img" aria-label="World wine map">
      <rect x="0" y="0" width="360" height="180" fill="var(--k-ocean)" rx="8" />
      {LAND.map((d, i) => <path key={i} d={d} fill="var(--k-land)" stroke="var(--k-land-edge)" strokeWidth="0.8" strokeLinejoin="round" />)}
      {pins.map((p) => {
        const on = hover === p.entryId;
        return (
          <g key={p.entryId} className="k-pin" transform={`translate(${p.x} ${p.y})`}
             onClick={() => onPick(p.entryId)}
             onMouseEnter={() => setHover(p.entryId)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
            <circle r="8" fill="transparent" />
            <circle r={on ? 4.2 : 3.2} fill={accent} stroke="#fff" strokeWidth="1.1" />
            {on && (
              <g>
                <rect x="6" y="-9" width={p.label.length * 4.6 + 8} height="14" rx="3" fill="var(--plat-text)" />
                <text x="10" y="1" fontSize="8" fill="#fff">{p.label}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
