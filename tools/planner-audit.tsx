// Renders the example planners to SVG: npx tsx tools/planner-audit.tsx /tmp/planner
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, mkdirSync } from 'fs';
import { PlannerPageContent } from '../src/planner/PlannerPageContent';
import { samplePlanner } from '../src/planner/plannerModel';
import { pageDims } from '../src/config/appConfig';
const out = process.argv[2] || '/tmp/planner';
mkdirSync(out, { recursive: true });
for (const [name, p] of [['week', samplePlanner('week')], ['week-plain', { ...samplePlanner('week'), weekBands: false }]] as const) {
  const d = pageDims('letter', { planner: p } as any);
  const body = renderToStaticMarkup(<PlannerPageContent planner={p as any} pageSize="letter" showDateName={false} />);
  writeFileSync(`${out}/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.width} ${d.height}" width="${d.width}" height="${d.height}"><rect width="100%" height="100%" fill="#fff"/>${body}</svg>`);
}
