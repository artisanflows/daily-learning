import { useState } from 'react';
import type { MapPin } from './types';
import { COUNTRY_PATHS } from './mapdata';

// Real geography: Natural Earth country outlines (public domain), baked to static
// paths by scripts/build-maps.mjs in an equirectangular 360x180 space that matches
// MapPin (x = lon+180, y = 90−lat). We add the design layer: palette, pins, labels.

export function WorldMap({ pins, accent, onPick }: { pins: MapPin[]; accent: string; onPick: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    // Wine lives between ~55°N and ~46°S — crop the dead poles for a bigger, denser map.
    <svg viewBox="0 0 360 152" className="k-worldmap" role="img" aria-label="World wine map — tap a pin">
      <rect x="-2" y="-14" width="364" height="180" fill="var(--k-ocean)" rx="6" />
      <g transform="translate(0 -14)">
        {COUNTRY_PATHS.map((c, i) => (
          <path key={i} d={c.d} fill="var(--k-land)" stroke="var(--k-land-edge)" strokeWidth="0.35" strokeLinejoin="round" />
        ))}
        {pins.map((p) => {
          const on = hover === p.entryId;
          const flipLabel = p.x > 300; // keep labels inside the right edge
          return (
            <g key={p.entryId} transform={`translate(${p.x} ${p.y})`}
               onClick={() => onPick(p.entryId)}
               onMouseEnter={() => setHover(p.entryId)} onMouseLeave={() => setHover(null)}
               style={{ cursor: 'pointer' }}>
              <circle r="7" fill="transparent" />
              {on && <circle r="5.4" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.6" />}
              <circle r={on ? 3.6 : 2.7} fill={accent} stroke="#fff" strokeWidth="0.9" />
              {on && (
                <g transform={flipLabel ? `translate(${-(p.label.length * 4.4 + 16)} 0)` : ''}>
                  <rect x="6" y="-8.5" width={p.label.length * 4.4 + 8} height="13" rx="3" fill="var(--plat-text)" opacity="0.92" />
                  <text x="10" y="1" fontSize="7.5" fill="#fff">{p.label}</text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// Zoomed regional map for an entry page: a window around the pin, target country
// tinted, pin + label rendered large. Same baked geography, same palette.
export function RegionMap({ pin, accent }: { pin: MapPin; accent: string }) {
  const W = 44, H = 26; // window in degrees — wide enough that 110m outlines read well
  const x = Math.max(0, Math.min(360 - W, pin.x - W / 2));
  const y = Math.max(0, Math.min(180 - H, pin.y - H / 2));
  return (
    <svg viewBox={`${x} ${y} ${W} ${H}`} className="k-worldmap k-worldmap--region" role="img" aria-label={`Map: ${pin.label}`}>
      <rect x={x - 2} y={y - 2} width={W + 4} height={H + 4} fill="var(--k-ocean)" />
      {COUNTRY_PATHS.map((c, i) => (
        <path key={i} d={c.d}
          fill={pin.country && c.name === pin.country ? 'var(--k-land-hi)' : 'var(--k-land)'}
          stroke="var(--k-land-edge)" strokeWidth="0.18" strokeLinejoin="round" />
      ))}
      <g transform={`translate(${pin.x} ${pin.y})`}>
        <circle r="1.6" fill={accent} stroke="#fff" strokeWidth="0.5" />
        <rect x="2.4" y="-3.4" width={pin.label.length * 2.15 + 3.4} height="5" rx="1.2" fill="var(--plat-text)" opacity="0.92" />
        <text x="4" y="0.4" fontSize="3.4" fill="#fff">{pin.label}</text>
      </g>
    </svg>
  );
}
