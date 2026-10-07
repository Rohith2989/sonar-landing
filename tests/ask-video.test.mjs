import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = (await readFile('source/ask-motion/feed-video.mjs', 'utf8'))
  .replace(/^import .*;\n/gm, '')
  .replace('export function', 'function')
  .replaceAll('import.meta.url', '"https://preview.test/landing/ask-motion/feed-video.mjs"');
const settle = () => new Promise(resolve => setImmediate(resolve));
function setup({ reduced = false, alpha = 0 } = {}) {
  function events(extra = {}) {
    const listeners = new Map();
    return Object.assign({
      addEventListener(name, fn) { listeners.set(name, [...(listeners.get(name) ?? []), fn]); },
      removeEventListener(name, fn) { listeners.set(name, (listeners.get(name) ?? []).filter(x => x !== fn)); },
      emit(name) { for (const fn of listeners.get(name) ?? []) fn(); },
    }, extra);
  }
  const classes = new Set(), styles = {};
  let lookupBottom = 520, resizeCallback;
  let decodedAlpha = alpha, rejectPlay;
  const video = events({
    paused: true, loads: 0, duration: 8, videoWidth: 1920, currentTime: 0,
    canPlayType() { return 'probably'; }, removeAttribute() { delete this.src; },
    load() { this.loads++; }, pause() { this.paused = true; },
    play() { this.paused = false; return new Promise((resolve, reject) => { rejectPlay = reject; }); },
  });
  const rest = { decode: () => Promise.resolve() };
  const button = events({ setAttribute(name, value) { this[name] = value; } });
  const preference = events({ matches: reduced });
  const section = { dataset: {}, isConnected: true,
    style: { setProperty(name, value) { styles[name] = value; } },
    getBoundingClientRect() { return { top: 100 }; },
    classList: { add(name) { classes.add(name); }, toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } },
    querySelector(selector) { return selector === '.lp-ask-film' ? video : selector === '.lp-ask-control' ? button : selector === '.lp-ask-portrait-rest' ? rest : selector === '.lp-console input' ? null : { getBoundingClientRect() { return { bottom: lookupBottom }; } }; },
    querySelectorAll() { return [rest]; },
  };
  const document = events({ hidden: false, getElementById() { return {}; }, querySelectorAll() { return section.isConnected ? [section] : []; },
    createElement() { return { getContext() { return { drawImage() {}, getImageData() { return { data: [0,0,0,decodedAlpha] }; } }; } }; },
  });
  let intersection, mutation;
  vm.runInNewContext(source, { document, URL, URLSearchParams, location: { search: '' }, matchMedia: () => preference, queueMicrotask,
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} disconnect() {} },
    MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} },
    ResizeObserver: class { constructor(fn) { resizeCallback = fn; } observe() {} disconnect() {} },
  });
  return { video, button, preference, document, section, classes, styles,
    resize(bottom) { lookupBottom = bottom; resizeCallback(); },
    visible: value => intersection([{ isIntersecting: value }]),
    removed: () => { section.isConnected = false; mutation(); },
    setAlpha(value) { decodedAlpha = value; }, rejectPlay: () => rejectPlay(new Error('Autoplay blocked')),
  };
}

test('the real video loads on visibility and pauses with the user, document and section', async () => {
  const h = setup();
  assert.equal(h.video.loads, 0);
  h.visible(true); await settle();
  assert.match(h.video.src, /closer-feed.webm$/);
  h.video.emit('loadeddata');
  assert.equal(h.video.paused, false);
  assert.ok(h.classes.has('lp-ask-film-ready'));
  h.button.emit('click');
  assert.equal(h.video.paused, true);
  assert.equal(h.section.dataset.askMotion, 'paused');
  h.button.emit('click');
  h.document.hidden = true; h.document.emit('visibilitychange');
  assert.equal(h.video.paused, true);
  h.document.hidden = false; h.document.emit('visibilitychange');
  assert.equal(h.video.paused, false);
  h.visible(false);
  assert.equal(h.video.paused, true);
  h.visible(true);
  h.removed(); await settle();
  assert.equal(h.video.src, undefined);
  assert.equal(h.video.paused, true);
});

test('mobile artwork moves below the lookup when its result area expands', () => {
  const h = setup();
  h.resize(520);
  assert.equal(h.styles['--feed-art-top'], '428px');
  h.resize(840);
  assert.equal(h.styles['--feed-art-top'], '748px');
});

test('reduced motion never requests video and restores the matching still', async () => {
  const h = setup({ reduced: true });
  h.visible(true); await settle();
  assert.equal(h.video.loads, 0);
  assert.equal(h.section.dataset.askMotion, 'reduced');
  assert.ok(h.classes.has('lp-ask-composite-ready'));
  h.preference.matches = false; h.preference.emit('change'); await settle();
  assert.equal(h.video.loads, 1);
  h.video.emit('loadeddata');
  h.preference.matches = true; h.preference.emit('change');
  assert.equal(h.video.paused, true);
  assert.ok(!h.classes.has('lp-ask-film-ready'));
});

test('a decoder that discards transparency tries the other codec without exposing black', async () => {
  const h = setup({ alpha: 255 });
  h.visible(true); await settle();
  h.video.emit('loadeddata');
  assert.match(h.video.src, /closer-feed-hevc.mov$/);
  assert.ok(!h.classes.has('lp-ask-film-ready'));
  h.setAlpha(0); h.video.emit('loadeddata');
  assert.ok(h.classes.has('lp-ask-film-ready'));
  assert.equal(h.section.dataset.askCodec, 'hevc-alpha');
});

test('unavailable formats and autoplay restrictions retain a usable still/control', async () => {
  const h = setup();
  h.visible(true); await settle();
  h.video.emit('error'); h.video.emit('error');
  assert.equal(h.section.dataset.askMotion, 'unavailable');
  assert.equal(h.button.hidden, true);
  assert.ok(!h.classes.has('lp-ask-film-ready'));
  const blocked = setup();
  blocked.visible(true); await settle();
  blocked.video.emit('loadeddata'); blocked.rejectPlay(); await settle();
  assert.equal(blocked.section.dataset.askMotion, 'paused');
  assert.equal(blocked.button['aria-label'], 'Play section animation');
});
