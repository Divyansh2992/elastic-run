import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/generate-india-map.mjs <LGD_States.geojson>');

const abbreviations = {
  'ANDAMAN & NICOBAR': 'AN', 'ANDHRA PRADESH': 'AP', 'ARUNACHAL PRADESH': 'AR',
  ASSAM: 'AS', BIHAR: 'BR', CHANDIGARH: 'CH', CHHATTISGARH: 'CG',
  'DADRA,NAGAR HAVELI,DAMAN & DIU': 'DN', DELHI: 'DL', GOA: 'GA',
  GUJARAT: 'GJ', HARYANA: 'HR', 'HIMACHAL PRADESH': 'HP', 'JAMMU & KASHMIR': 'JK',
  JHARKHAND: 'JH', KARNATAKA: 'KA', KERALA: 'KL', LADAKH: 'LA', LAKSHADWEEP: 'LD',
  'MADHYA PRADESH': 'MP', MAHARASHTRA: 'MH', MANIPUR: 'MN', MEGHALAYA: 'ML',
  MIZORAM: 'MZ', NAGALAND: 'NL', ODISHA: 'OD', PUDUCHERRY: 'PY', PUNJAB: 'PB',
  RAJASTHAN: 'RJ', SIKKIM: 'SK', 'TAMIL NADU': 'TN', TELANGANA: 'TS', TRIPURA: 'TR',
  UTTARAKHAND: 'UK', 'UTTAR PRADESH': 'UP', 'WEST BENGAL': 'WB',
};
const names = {
  'ANDAMAN & NICOBAR': 'Andaman & Nicobar Islands',
  'DADRA,NAGAR HAVELI,DAMAN & DIU': 'Dadra & Nagar Haveli and Daman & Diu',
};
const geojson = JSON.parse(readFileSync(source, 'utf8'));
const project = ([lon, lat]) => [Number(((lon - 66) * 17).toFixed(1)), Number(((39 - lat) * 17).toFixed(1))];
const distanceToSegment = (point, start, end) => {
  const dx = end[0] - start[0], dy = end[1] - start[1];
  if (!dx && !dy) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
};
const simplify = (points, tolerance = 0.018) => {
  if (points.length < 4) return points;
  let max = 0, index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = distanceToSegment(points[i], points[0], points.at(-1));
    if (distance > max) [max, index] = [distance, i];
  }
  if (max <= tolerance) return [points[0], points.at(-1)];
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
};
const simplifyRing = ring => {
  if (ring.length < 14) return ring;
  const result = simplify(ring.slice(0, -1));
  result.push(result[0]);
  return result.length > 3 ? result : ring;
};
const polygonsOf = geometry => geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
const pathOf = polygons => polygons.map(polygon => polygon.map(ring =>
  simplifyRing(ring).map((point, index) => `${index ? 'L' : 'M'}${project(point).join(',')}`).join('') + 'Z'
).join('')).join('');
const area = ring => {
  let total = 0;
  for (let i = 0; i < ring.length - 1; i += 1) total += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(total / 2);
};
const centerOf = polygons => {
  const ring = polygons.flatMap(polygon => polygon).sort((a, b) => area(b) - area(a))[0];
  const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
  return project([(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]);
};
const states = geojson.features.map(feature => {
  const key = feature.properties.STNAME;
  const name = names[key] || key.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
  const polygons = polygonsOf(feature.geometry);
  return { name, abbr: abbreviations[key] || key.slice(0, 2), path: pathOf(polygons), center: centerOf(polygons) };
}).sort((a, b) => a.name.localeCompare(b.name));
const out = `// Generated from LGD States 2024 GeoJSON distributed by Bharatlas.\n// Source: https://bharatlas.com/view/lgd_states\nexport const INDIA_STATE_PATHS = ${JSON.stringify(states)};\n`;
const output = resolve(dirname(fileURLToPath(import.meta.url)), '../src/indiaStates.js');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, out);
console.log(`Generated ${states.length} state and UT paths at ${output}`);
