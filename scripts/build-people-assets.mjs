import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('landing/people-scene', { recursive: true });
for (const role of ['lead', 'prove', 'move']) {
  await sharp(`source/people-scene/assets/${role}.png`)
    .resize({ width: 1200, height: 1020, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 91, alphaQuality: 100, effort: 6 })
    .toFile(`landing/people-scene/${role}.webp`);
}
console.log('Three transparent people assets optimized for the page.');
