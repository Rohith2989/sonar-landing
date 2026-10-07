import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { POSES, DURATION } from '../source/ask-motion/portrait-timeline.mjs';

const ffmpeg = execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
const out = 'landing/ask-motion';
const intermediate = '.qa/portrait-poses';
await mkdir(intermediate, { recursive: true });
await mkdir(out, { recursive: true });
const width = 1280, height = 720, cols = 3, perSheet = 6;
const cells = [];
for (const [index, pose] of POSES.entries()) {
  const path = `${intermediate}/pose-${String(index).padStart(2, '0')}.png`;
  execFileSync(ffmpeg, ['-y', '-ss', String(pose.sourceTime), '-i', 'source/ask-motion/assets/portrait-green-veo.mp4',
    '-vf', 'chromakey=0x00ff00:0.18:0.06,despill=type=green:mix=0.5:expand=0.1,format=rgba,scale=1280:720',
    '-frames:v', '1', path], { stdio: ['ignore', 'ignore', 'pipe'] });
  cells.push({ input: path, left: (index % cols) * width, top: Math.floor((index % perSheet) / cols) * height });
}
for (let sheet = 0; sheet < 2; sheet++) {
  await sharp({ create: { width: cols * width, height: 2 * height, channels: 4, background: '#00000000' } })
    .composite(cells.slice(sheet * perSheet, (sheet + 1) * perSheet))
    .webp({ quality: 93, alphaQuality: 100, effort: 6 }).toFile(`${out}/portrait-atlas-${sheet}.webp`);
}
await sharp(cells[0].input).webp({ quality: 93, alphaQuality: 100, effort: 6 }).toFile(`${out}/portrait-rest.webp`);
await writeFile(`${out}/portrait-manifest.json`, JSON.stringify({ version: 2, width, height, cols, perSheet, count: POSES.length, duration: DURATION, poses: POSES,
  source: 'Veo 3.1 quality portrait on chroma green, twelve complete RGBA poses; no face-only mask',
  sources: ['portrait-atlas-0.webp', 'portrait-atlas-1.webp'],
}, null, 2) + '\n');
console.log('Built twelve transparent portrait poses, two atlases and a matching still.');
