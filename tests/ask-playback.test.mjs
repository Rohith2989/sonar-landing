import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { DURATION, frameAt } from '../source/ask-motion/portrait-timeline.mjs';

// Exercise the shipped controller against browser events and a controllable RAF.
const source = (await readFile('source/ask-motion/ask-poses.mjs', 'utf8'))
  .replace(/^import .*;\n/gm, '')
  .replace('export function', 'function')
  .replaceAll('import.meta.url', '"https://preview.test/landing/ask-motion/ask-motion.mjs"');
const settle = () => new Promise(resolve => setImmediate(resolve));

function setup({ reduced = false, failed = false } = {}) {
  function events(extra = {}) {
    const listeners = new Map();
    return Object.assign({
      addEventListener(name, fn) { listeners.set(name, [...(listeners.get(name) ?? []), fn]); },
      removeEventListener(name, fn) { listeners.set(name, (listeners.get(name) ?? []).filter(x => x !== fn)); },
      emit(name) { for (const fn of listeners.get(name) ?? []) fn(); },
    }, extra);
  }
  const draws = [], loads = [], requests = new Map(), classes = new Set();
  const canvas = { getContext() { return { clearRect() {}, drawImage(...args) { draws.push(args); } }; } };
  const button = events({ setAttribute(name, value) { this[name] = value; } });
  const preference = events({ matches: reduced });
  const section = {
    dataset: {}, isConnected: true,
    classList: { add(name) { classes.add(name); }, toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } },
    querySelector(selector) { return selector === '.lp-ask-portrait' ? canvas : selector === '.lp-ask-control' ? button : {}; },
    querySelectorAll() { return [0, 1, 2].map(() => ({ decode: () => Promise.resolve() })); },
  };
  const document = events({ hidden: false, getElementById() { return {}; }, querySelectorAll() { return section.isConnected ? [section] : []; } });
  let intersection, mutation, clock = 0, id = 0;
  vm.runInNewContext(source, {
    document, URL, URLSearchParams, DURATION, frameAt, location: { search: '' }, matchMedia: () => preference, queueMicrotask,
    Image: class { decode() { loads.push(this.src); return failed ? Promise.reject(new Error('Media unavailable')) : Promise.resolve(); } },
    requestAnimationFrame(fn) { requests.set(++id, fn); return id; }, cancelAnimationFrame(id) { requests.delete(id); },
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} disconnect() {} },
    MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} },
  });
  return { button, preference, document, section, loads, draws, requests, classes,
    visible: value => intersection([{ isIntersecting: value }]),
    removed: () => { section.isConnected = false; mutation(); },
    advance(ms) { for (let step = 0; step < ms; step += 20) { clock += 20; const callbacks = [...requests.values()]; requests.clear(); for (const fn of callbacks) fn(clock); } },
  };
}

test('whole-portrait playback follows visibility, pause and motion preferences', async () => {
  const h = setup();
  assert.equal(h.loads.length, 0, 'Atlases must not download before the scene is visible');
  h.visible(true);
  await settle();
  assert.equal(h.loads.length, 2);
  assert.equal(h.section.dataset.askMotion, 'playing');
  h.advance(2000);
  assert.notEqual(h.section.dataset.askFrame, '0');
  const held = h.section.dataset.askFrame;
  h.button.emit('click');
  h.advance(2000);
  assert.equal(h.section.dataset.askFrame, held);
  assert.equal(h.requests.size, 0);
  assert.equal(h.button['aria-label'], 'Play section animation');
  h.button.emit('click');
  assert.equal(h.requests.size, 1);
  h.document.hidden = true;
  h.document.emit('visibilitychange');
  assert.equal(h.requests.size, 0);
  h.document.hidden = false;
  h.document.emit('visibilitychange');
  assert.equal(h.requests.size, 1);
  h.preference.matches = true;
  h.preference.emit('change');
  assert.equal(h.requests.size, 0);
  assert.equal(h.button.hidden, true);
  assert.ok(!h.classes.has('lp-ask-pose-ready'));
  h.preference.matches = false;
  h.preference.emit('change');
  h.visible(false);
  assert.equal(h.requests.size, 0);
  h.visible(true);
  h.removed();
  await settle();
  assert.equal(h.requests.size, 0, 'Removed sections release their animation callback');
});

test('reduced motion renders the still layers without downloading animation atlases', async () => {
  const h = setup({ reduced: true });
  h.visible(true);
  await settle();
  assert.equal(h.loads.length, 0);
  assert.equal(h.section.dataset.askMotion, 'reduced');
  assert.ok(h.classes.has('lp-ask-composite-ready'));
  assert.equal(h.requests.size, 0);
  h.preference.matches = false;
  h.preference.emit('change');
  await settle();
  assert.equal(h.loads.length, 2);
  assert.equal(h.section.dataset.askMotion, 'playing');
});

test('a failed atlas keeps the complete still portrait and hides the unavailable control', async () => {
  const h = setup({ failed: true });
  h.visible(true);
  await settle();
  assert.equal(h.section.dataset.askMotion, 'unavailable');
  assert.equal(h.requests.size, 0);
  assert.equal(h.button.hidden, true);
  assert.ok(h.classes.has('lp-ask-composite-ready'));
  assert.ok(!h.classes.has('lp-ask-pose-ready'));
  assert.equal(h.draws.length, 0);
});
