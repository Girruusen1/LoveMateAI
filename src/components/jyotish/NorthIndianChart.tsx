import React from 'react';
import { RASHIS } from '../../../shared/jyotish';
import { PLANET_IDS, PLANET_INFO, NAKSHATRAS } from '../../astro/constants';
import { formatDegree, type Chart } from '../../astro/engine';

/**
 * North Indian (diamond) rashi chart. House 1 is the top diamond and houses run
 * anticlockwise. Each house shows its sign number (1 = Mesha … 12 = Meena).
 */
const HOUSES: { poly: string; cx: number; cy: number; nx: number; ny: number }[] = [
  { poly: '200,0 300,100 200,200 100,100', cx: 200, cy: 92, nx: 200, ny: 176 },
  { poly: '0,0 200,0 100,100', cx: 100, cy: 36, nx: 100, ny: 84 },
  { poly: '0,0 100,100 0,200', cx: 34, cy: 100, nx: 82, ny: 104 },
  { poly: '0,200 100,100 200,200 100,300', cx: 92, cy: 200, nx: 176, ny: 204 },
  { poly: '0,200 100,300 0,400', cx: 34, cy: 300, nx: 82, ny: 304 },
  { poly: '0,400 100,300 200,400', cx: 100, cy: 362, nx: 100, ny: 322 },
  { poly: '200,400 100,300 200,200 300,300', cx: 200, cy: 312, nx: 200, ny: 232 },
  { poly: '200,400 300,300 400,400', cx: 300, cy: 362, nx: 300, ny: 322 },
  { poly: '400,400 300,300 400,200', cx: 366, cy: 300, nx: 318, ny: 304 },
  { poly: '400,200 300,300 200,200 300,100', cx: 308, cy: 200, nx: 224, ny: 204 },
  { poly: '400,200 300,100 400,0', cx: 366, cy: 100, nx: 318, ny: 104 },
  { poly: '400,0 300,100 200,0', cx: 300, cy: 36, nx: 300, ny: 84 },
];

const DIAMOND = new Set([0, 3, 6, 9]);

export const NorthIndianChart: React.FC<{ chart: Chart; /** Draw from the Moon sign (Chandra kundli) instead of the Lagna */ fromMoon?: boolean; className?: string }> = ({ chart, fromMoon = false, className = '' }) => {
  const firstSign = fromMoon ? chart.rashi : chart.lagna.sign;
  const byHouse: { label: string; title: string; asc?: boolean }[][] = Array.from({ length: 12 }, () => []);
  if (!fromMoon) byHouse[0].push({ label: 'Asc', title: `Ascendant (Lagna) ${RASHIS[chart.lagna.sign].sanskrit} ${formatDegree(chart.lagna.degree)}`, asc: true });
  for (const id of PLANET_IDS) {
    const p = chart.planets[id];
    const house = (p.sign - firstSign + 12) % 12;
    byHouse[house].push({ label: PLANET_INFO[id].abbr, title: `${id} in ${RASHIS[p.sign].sanskrit} ${formatDegree(p.degree)}, ${NAKSHATRAS[p.nakshatra].name} pada ${p.pada}` });
  }
  const title = fromMoon ? 'Chandra kundli (Moon chart)' : 'Lagna kundli (birth chart)';
  return (
    <svg viewBox="-4 -4 408 408" className={`w-full h-auto max-w-[420px] mx-auto ${className}`} role="img" aria-label={`${title}, North Indian style`}>
      <title>{title}</title>
      <rect x="0" y="0" width="400" height="400" rx="6" className="fill-white stroke-rose-300" strokeWidth="2" />
      <line x1="0" y1="0" x2="400" y2="400" className="stroke-rose-300" strokeWidth="1.5" />
      <line x1="400" y1="0" x2="0" y2="400" className="stroke-rose-300" strokeWidth="1.5" />
      <polygon points="200,0 400,200 200,400 0,200" className="fill-none stroke-rose-300" strokeWidth="1.5" />
      {HOUSES.map((h, i) => {
        const sign = (firstSign + i) % 12;
        const items = byHouse[i];
        const perRow = DIAMOND.has(i) ? 3 : 2;
        const rows: (typeof items)[] = [];
        for (let r = 0; r < items.length; r += perRow) rows.push(items.slice(r, r + perRow));
        const lineH = 17;
        const top = h.cy - ((rows.length - 1) * lineH) / 2;
        return (
          <g key={i}>
            <polygon points={h.poly} className="fill-transparent" />
            <text x={h.nx} y={h.ny} textAnchor="middle" dominantBaseline="middle" className="fill-zinc-400" fontSize="12" fontWeight="600">
              <title>{`House ${i + 1}: ${RASHIS[sign].sanskrit} (${RASHIS[sign].english})`}</title>
              {sign + 1}
            </text>
            {rows.map((row, r) => (
              <text key={r} x={h.cx} y={top + r * lineH} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700">
                {row.map((it, k) => (
                  <tspan key={it.label} className={it.asc ? 'fill-rose-600' : 'fill-zinc-800'} dx={k === 0 ? 0 : 5}>
                    <title>{it.title}</title>
                    {it.label}
                  </tspan>
                ))}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
};
