import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';

test('both entry points expose the Ask heading and keep the real lookup form', async () => {
  for (const file of ['index.html', 'prerendered/index.html']) {
    const html = await readFile(file, 'utf8');
    assert.equal(html.split('<!-- sonar-ask-motion -->').length - 1, 1);
    assert.equal(html.split('class="lp-ask-scene"').length - 1, 1);
    assert.ok(html.includes('<h2>Good ideas.<br><em>Real evidence.</em></h2>'));
    const section = html.slice(html.indexOf('<section id="how"'), html.indexOf('<section id="product"'));
    assert.match(section, /<input[^>]*aria-label="Enter your niche"[^>]*required=""[^>]*maxLength="60"/);
    assert.match(section, /<button type="submit" aria-label="Run this query"/);
    assert.match(section, /<video[^>]*preload="none"[^>]*>/);
    assert.doesNotMatch(section, /<video[^>]*\ssrc=/);
  }
  for (const file of ['ask-motion.mjs', 'ask-markup.mjs', 'ask-motion.css', 'motion-mask.svg']) {
    assert.equal(await readFile(`source/ask-motion/${file}`, 'utf8'), await readFile(`landing/ask-motion/${file}`, 'utf8'));
  }
});

test('the poster fits the scene and the web video stays within its media budget', async () => {
  const poster = await sharp('landing/ask-motion/scene-poster.webp').metadata();
  assert.equal(poster.width, 1672);
  assert.equal(poster.height, 941);
  assert.ok((await stat('landing/ask-motion/scene-poster.webp')).size < 250_000);
  const video = await readFile('landing/ask-motion/scene-loop.mp4');
  assert.ok(video.length < 6_000_000);
  const metadata = video.indexOf(Buffer.from('moov'));
  const frames = video.indexOf(Buffer.from('mdat'));
  assert.ok(metadata > 0 && metadata < frames, 'Fast-start metadata must precede video frames');
});
