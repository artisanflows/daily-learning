import { useRef, useState } from 'react';
import type { MapPin } from './types';
import { COUNTRY_PATHS } from './mapdata';

// Real geography: Natural Earth country outlines (public domain), baked to static
// paths by scripts/build-maps.mjs in an equirectangular 360x180 space that matches
// MapPin (x = lon+180, y = 90−lat). We add the design layer: palette, pins, labels,
// and zoom — presets + wheel + drag — so clustered regions (Europe!) spread out.

interface VB { x: number; y: number; w: number }
const ASPECT = 138 / 360; // world view crops the dead polar bands
const WORLD: VB = { x: 0, y: 14, w: 360 };
const PRESETS: { label: string; vb: VB }[] = [
  { label: 'World', vb: WORLD },
  { label: 'Europe', vb: { x: 166, y: 33, w: 42 } },
  { label: 'Americas', vb: { x: 40, y: 30, w: 110 } },
  { label: 'Oceania', vb: { x: 285, y: 100, w: 78 } },
  { label: 'S. Africa', vb: { x: 178, y: 105, w: 45 } },
];
const clampVB = (v: VB): VB => {
  const w = Math.min(360, Math.max(10, v.w));
  const h = w * ASPECT;
  return { w, x: Math.min(360 - w, Math.max(0, v.x)), y: Math.min(180 - h, Math.max(0, v.y)) };
};

export function WorldMap({ pins, accent, onPick }: { pins: MapPin[]; accent: string; onPick: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [vb, setVb] = useState<VB>(WORLD);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ px: number; py: number; vb: VB; moved: boolean } | null>(null);

  const h = vb.w * ASPECT;
  const k = vb.w / 360;                       // zoom factor: 1 = world, smaller = zoomed in
  const pinR = Math.max(0.5, 2.7 * Math.pow(k, 0.75));
  const fs = Math.max(1.1, 5.2 * Math.pow(k, 0.75));
  // Zoomed in → auto-label, but greedily skip labels that would collide with one
  // already placed (dense clusters stay readable; the rest appear on hover).
  const autoLabels = new Set<string>();
  if (vb.w <= 130) {
    const placed: { x: number; y: number; w: number }[] = [];
    for (const p of [...pins].sort((a, b) => a.y - b.y)) {
      if (p.x < vb.x - 5 || p.x > vb.x + vb.w + 5 || p.y < vb.y - 5 || p.y > vb.y + h + 5) continue;
      const lw = p.label.length * fs * 0.58 + fs;
      const collides = placed.some((q) => Math.abs(q.y - p.y) < fs * 2.1 && Math.abs(q.x - p.x) < (q.w + lw) / 2 + fs);
      if (!collides) { autoLabels.add(p.entryId); placed.push({ x: p.x, y: p.y, w: lw }); }
    }
  }

  // Convert a client point into map coordinates via the SVG's live transform.
  const toMap = (e: { clientX: number; clientY: number }) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { mx: vb.x + ((e.clientX - rect.left) / rect.width) * vb.w, my: vb.y + ((e.clientY - rect.top) / rect.height) * h };
  };
  const zoomAt = (factor: number, cx: number, cy: number) => {
    setVb((v) => {
      const w = Math.min(360, Math.max(10, v.w * factor));
      return clampVB({ w, x: cx - (cx - v.x) * (w / v.w), y: cy - (cy - v.y) * (w / v.w) });
    });
  };

  return (
    <div>
      <div className="k-mapbar">
        {PRESETS.map((p) => (
          <button key={p.label} className={'k-mapbar__btn' + (Math.abs(vb.w - p.vb.w) < 1 && Math.abs(vb.x - p.vb.x) < 1 ? ' on' : '')} onClick={() => setVb(clampVB(p.vb))}>{p.label}</button>
        ))}
        <span className="k-mapbar__spacer" />
        <button className="k-mapbar__btn" onClick={() => zoomAt(1 / 1.5, vb.x + vb.w / 2, vb.y + h / 2)}>＋</button>
        <button className="k-mapbar__btn" onClick={() => zoomAt(1.5, vb.x + vb.w / 2, vb.y + h / 2)}>−</button>
      </div>
      <svg ref={svgRef} viewBox={`${vb.x} ${vb.y} ${vb.w} ${h}`} className="k-worldmap" role="img"
        aria-label="World wine map — zoom in and tap a pin"
        style={{ cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        onWheel={(e) => { const { mx, my } = toMap(e); zoomAt(e.deltaY > 0 ? 1.25 : 1 / 1.25, mx, my); }}
        onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { px: e.clientX, py: e.clientY, vb, moved: false }; }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const rect = svgRef.current!.getBoundingClientRect();
          const dx = ((e.clientX - d.px) / rect.width) * d.vb.w;
          const dy = ((e.clientY - d.py) / rect.height) * d.vb.w * ASPECT;
          if (Math.abs(e.clientX - d.px) + Math.abs(e.clientY - d.py) > 4) d.moved = true;
          setVb(clampVB({ w: d.vb.w, x: d.vb.x - dx, y: d.vb.y - dy }));
        }}
        onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }}
        onPointerLeave={() => { drag.current = null; }}>
        <rect x="-4" y="-4" width="368" height="188" fill="var(--k-ocean)" />
        {COUNTRY_PATHS.map((c, i) => (
          <path key={i} d={c.d} fill="var(--k-land)" stroke="var(--k-land-edge)" strokeWidth={0.35 * Math.max(k, 0.25)} strokeLinejoin="round" />
        ))}
        {pins.map((p) => {
          const on = hover === p.entryId;
          const labelled = on || autoLabels.has(p.entryId);
          const flip = p.x > vb.x + vb.w * 0.72;
          const lw = p.label.length * fs * 0.58 + fs;
          return (
            <g key={p.entryId} transform={`translate(${p.x} ${p.y})`}
               onClick={() => { if (!drag.current?.moved) onPick(p.entryId); }}
               onMouseEnter={() => setHover(p.entryId)} onMouseLeave={() => setHover(null)}
               style={{ cursor: 'pointer' }}>
              <circle r={pinR * 2.6} fill="transparent" />
              {on && <circle r={pinR * 2} fill="none" stroke={accent} strokeWidth={pinR * 0.3} opacity="0.6" />}
              <circle r={on ? pinR * 1.35 : pinR} fill={accent} stroke="#fff" strokeWidth={pinR * 0.33} />
              {labelled && (
                <g transform={flip ? `translate(${-(lw + pinR * 4.4)} 0)` : ''} opacity={on ? 1 : 0.92}>
                  <rect x={pinR * 2.2} y={-fs * 0.85} width={lw} height={fs * 1.7} rx={fs * 0.35} fill="var(--plat-text)" opacity="0.9" />
                  <text x={pinR * 2.2 + fs * 0.5} y={fs * 0.42} fontSize={fs} fill="#fff">{p.label}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
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
