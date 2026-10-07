import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
import { DURATION, POSES, SEQUENCE, frameAt } from '../source/ask-motion/portrait-timeline.mjs';

test('both entry points expose the Ask heading and keep the real lookup form', async () => {
  for (const file of ['index.html', 'prerendered/index.html']) {
    const html = await readFile(file, 'utf8');
    assert.equal(html.split('<!-- sonar-ask-motion -->').length - 1, 1);
    assert.equal(html.split('class="lp-ask-scene"').length - 1, 1);
    assert.ok(html.includes('<h2>Good ideas.<br><em>Real evidence.</em></h2>'));
    const section = html.slice(html.indexOf('<section id="how"'), html.indexOf('<section id="product"'));
    assert.match(section, /<input[^>]*aria-label="Enter your niche"[^>]*required=""[^>]*maxLength="60"/);
    assert.match(section, /<button type="submit" aria-label="Run this query"/);
    assert.match(section, /<canvas class="lp-ask-portrait" width="1280" height="720"><\/canvas>/);
    assert.doesNotMatch(section, /lp-ask-video|motion-mask/);
  }
  for (const file of ['ask-motion.mjs', 'ask-markup.mjs', 'ask-motion.css', 'portrait-timeline.mjs']) {
    assert.equal(await readFile(`source/ask-motion/${file}`, 'utf8'), await readFile(`landing/ask-motion/${file}`, 'utf8'));
  }
});

test('twelve held poses return to the identical rest frame across the loop seam', () => {
  assert.equal(POSES.length, 12);
  assert.equal(DURATION, 8000);
  let time = 0;
  for (const pose of SEQUENCE) {
    assert.equal(frameAt(time), pose.index);
    assert.equal(frameAt(time + pose.hold - 1), pose.index);
    time += pose.hold;
  }
  assert.equal(frameAt(DURATION - 1), 0);
  assert.equal(frameAt(DURATION), 0);
  assert.equal(frameAt(-1), 0);
});

test('transparent atlases animate the outer hair silhouette, with no frozen hair mask', async () => {
  const manifest = JSON.parse(await readFile('landing/ask-motion/portrait-manifest.json', 'utf8'));
  assert.deepEqual(manifest.poses, POSES);
  let budget = 0;
  for (const file of manifest.sources) {
    const path = `landing/ask-motion/${file}`;
    const meta = await sharp(path).metadata();
    assert.equal(meta.width, 3840);
    assert.equal(meta.height, 1440);
    assert.ok(meta.hasAlpha);
    budget += (await stat(path)).size;
  }
  assert.ok(budget < 2_000_000, 'The two transparent atlases should total less than 2 MB');
  const { data, info } = await sharp('landing/ask-motion/portrait-atlas-0.webp').raw().toBuffer({ resolveWithObject: true });
  for (let cell = 0; cell < 6; cell++) {
    const x = (cell % 3) * 1280, y = Math.floor(cell / 3) * 720;
    assert.equal(data[(y * info.width + x) * 4 + 3], 0, 'Each pose has a transparent background');
  }
  let changed = 0;
  // Compare the outer head area in reading pose 0 and raised pose 4.
  for (let y = 0; y < 250; y++) for (let x = 550; x < 890; x++) {
    const a = (y * info.width + x) * 4 + 3;
    const b = ((y + 720) * info.width + x + 1280) * 4 + 3;
    if (Math.abs(data[a] - data[b]) > 80) changed++;
  }
  assert.ok(changed > 2000, `Outer hair must move with the face; only ${changed} silhouette pixels changed`);
  for (const file of ['scene-poster.webp', 'cloud-background.webp', 'foreground-props.webp']) {
    const meta = await sharp(`landing/ask-motion/${file}`).metadata();
    assert.equal(meta.width, 1672);
    assert.equal(meta.height, 941);
  }
});
