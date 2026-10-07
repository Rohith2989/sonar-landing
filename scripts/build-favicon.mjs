import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Keep the legacy browser fallback identical to the hand-drawn SVG master.
const svg = await readFile(new URL('../favicon.svg', import.meta.url));
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => sharp(svg).resize(size, size).png().toBuffer()));
const directory = Buffer.alloc(6 + 16 * sizes.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index];
  directory[entry + 1] = sizes[index];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(new URL('../favicon.ico', import.meta.url), Buffer.concat([directory, ...images]));

// Changing the URL makes browsers refresh an older cached tab icon.
const root = fileURLToPath(new URL('../', import.meta.url));
const revision = createHash('sha256').update(svg).digest('hex').slice(0, 10);
const pages = ['index.html', ...(await readdir(join(root, 'prerendered'), { recursive: true }))
  .filter(file => file.endsWith('.html')).map(file => join('prerendered', file))];
for (const page of pages) {
  const path = join(root, page);
  const html = await readFile(path, 'utf8');
  const updated = html.replace(/href="\/favicon\.svg(?:\?[^\"]*)?"/g, `href="/favicon.svg?v=${revision}"`);
  if (updated !== html) await writeFile(path, updated);
}
console.log(`Sonar favicon built at 16, 32, and 48 pixels; updated ${pages.length} page references.`);
