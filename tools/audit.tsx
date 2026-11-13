// Renders every block at full, half and quarter size to SVG files for a layout check.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, mkdirSync } from 'fs';
import { REGISTERED_BLOCKS } from '../src/registry/blockRegistry';
import { calculateSlotGeometries } from '../src/utils/layoutPresets';

const out = process.argv[2] || '/tmp/audit';
mkdirSync(out, { recursive: true });
const g = {
  full: calculateSlotGeometries('letter', '1-full')['slot-1'],
  half: calculateSlotGeometries('letter', '2-half')['slot-1'],
  quarter: calculateSlotGeometries('letter', '4-quarter')['slot-1'],
};
for (const def of REGISTERED_BLOCKS) {
  for (const size of ['full', 'half', 'quarter'] as const) {
    if (!def.allowedSizes.includes(size)) continue;
    const { width, height } = g[size];
    const instance: any = { instanceId: 'audit-' + def.id, blockId: def.id, settings: { ...def.defaultSettings }, character: undefined };
    let body = '';
    try { body = renderToStaticMarkup(<>{def.render({ instance, size, width, height })}</>); } catch (e) { body = `<text x="10" y="20">${String(e).slice(0, 80)}</text>`; }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${width + 8} ${height + 8}" width="${width + 8}" height="${height + 8}"><rect x="-4" y="-4" width="${width + 8}" height="${height + 8}" fill="#fff"/><rect width="${width}" height="${height}" rx="12" fill="none" stroke="#2D2200" stroke-width="2.25"/>${body}</svg>`;
    writeFileSync(`${out}/${def.id}__${size}.svg`, svg);
  }
}
console.log('done');
