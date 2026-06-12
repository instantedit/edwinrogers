/**
 * One-shot optimizer: .assets-raw/*.png → public/ web-ready assets.
 * Run: node scripts/optimize-assets.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const RAW = new URL('../.assets-raw/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const OUT = new URL('../public/assets/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const PUB = new URL('../public/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

await mkdir(OUT, { recursive: true });

const jobs = [
  // OG/social card — jpg for maximum platform compatibility
  { in: 'og.png', out: `${PUB}og.jpg`, w: 1200, h: 675, fmt: 'jpeg', q: 82 },
  // Work cards — webp, 2x the rendered ~640px width
  { in: 'speedlead.png', out: `${OUT}work-speedlead.webp`, w: 1280, h: 960, fmt: 'webp', q: 80 },
  { in: 'biziasurf.png', out: `${OUT}work-biziasurf.webp`, w: 1280, h: 960, fmt: 'webp', q: 80 },
  { in: 'hapahoney.png', out: `${OUT}work-hapahoney.webp`, w: 1280, h: 960, fmt: 'webp', q: 80 },
  { in: 'instantedit.png', out: `${OUT}work-instantedit.webp`, w: 1280, h: 960, fmt: 'webp', q: 80 },
  // About portrait — poster/fallback for the video loop
  { in: 'about.png', out: `${OUT}about-poster.webp`, w: 900, h: 1200, fmt: 'webp', q: 80 },
];

for (const j of jobs) {
  const img = sharp(`${RAW}${j.in}`).resize(j.w, j.h, { fit: 'cover' });
  if (j.fmt === 'jpeg') await img.jpeg({ quality: j.q, mozjpeg: true }).toFile(j.out);
  else await img.webp({ quality: j.q }).toFile(j.out);
  console.log(`ok ${j.in} → ${j.out}`);
}
