import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

// A minimal browser surface exercises the shipped controller's lifecycle without
// replacing playback decisions with test-only copies of the implementation.
const source = (await readFile('source/ask-motion/ask-motion.mjs', 'utf8'))
  .replace(/^import .*;\n/, '')
  .replace('export function', 'function')
  .replaceAll('import.meta.url', '"https://preview.test/landing/ask-motion/ask-motion.mjs"');

function setup(reduced = false) {
  function events(extra = {}) {
    const listeners = new Map();
    return Object.assign({
      addEventListener(name, fn) { listeners.set(name, [...(listeners.get(name) ?? []), fn]); },
      removeEventListener(name, fn) { listeners.set(name, (listeners.get(name) ?? []).filter(x => x !== fn)); },
      emit(name) { for (const fn of listeners.get(name) ?? []) fn(); },
    }, extra);
  }
  const video = events({
    paused: true, loads: 0, plays: 0, duration: 8, currentTime: 0,
    getAttribute() { return this.src; }, removeAttribute() { delete this.src; },
    load() { this.loads++; }, pause() { this.paused = true; },
    play() { this.plays++; this.paused = false; return Promise.resolve(); },
  });
  const button = events({ setAttribute(name, value) { this[name] = value; } });
  const preference = events({ matches: reduced });
  const section = {
    dataset: {}, isConnected: true, classList: { add() {}, toggle() {} },
    querySelector(selector) { return selector === '.lp-ask-video' ? video : selector === '.lp-ask-control' ? button : {}; },
  };
  const document = events({ hidden: false, getElementById() { return {}; }, querySelectorAll() { return section.isConnected ? [section] : []; } });
  let intersection, mutation;
  vm.runInNewContext(source, {
    document, URL, URLSearchParams, location: { search: '' }, matchMedia: () => preference, queueMicrotask,
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} disconnect() {} },
    MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} },
  });
  return { video, button, preference, document, section, visible: value => intersection([{ isIntersecting: value }]), removed: () => { section.isConnected = false; mutation(); } };
}

test('playback follows visibility, the pause control and motion preferences', () => {
  const h = setup();
  assert.equal(h.video.loads, 0, 'Video must not download before the scene is visible');
  h.visible(true);
  assert.equal(h.video.loads, 1);
  h.video.emit('loadeddata');
  assert.equal(h.video.paused, false);
  h.button.emit('click');
  assert.equal(h.video.paused, true);
  assert.equal(h.button['aria-label'], 'Play section animation');
  h.button.emit('click');
  assert.equal(h.video.paused, false);
  h.document.hidden = true;
  h.document.emit('visibilitychange');
  assert.equal(h.video.paused, true);
  h.document.hidden = false;
  h.document.emit('visibilitychange');
  assert.equal(h.video.paused, false);
  h.preference.matches = true;
  h.preference.emit('change');
  assert.equal(h.video.paused, true);
  assert.equal(h.button.hidden, true);
  h.preference.matches = false;
  h.preference.emit('change');
  h.visible(false);
  assert.equal(h.video.paused, true);
});

test('reduced motion avoids the video request and failure keeps the still poster', async () => {
  const h = setup(true);
  h.visible(true);
  assert.equal(h.video.loads, 0);
  assert.equal(h.section.dataset.askMotion, 'reduced');
  h.preference.matches = false;
  h.preference.emit('change');
  assert.equal(h.video.loads, 1);
  h.video.emit('error');
  assert.equal(h.section.dataset.askMotion, 'unavailable');
  assert.equal(h.video.paused, true);
  assert.equal(h.button.hidden, true);
  h.removed();
  await new Promise(resolve => queueMicrotask(resolve));
  assert.equal(h.video.src, undefined, 'Removed sections release their media resource');
});
