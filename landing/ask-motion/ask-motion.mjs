import { sceneMarkup, copyMarkup, controlMarkup } from './ask-markup.mjs';
import { DURATION, frameAt } from './portrait-timeline.mjs';

const instances = new Map();
let atlasPromise;
function loadAtlases() {
  return atlasPromise ??= Promise.all([0, 1].map(async index => {
    const image = new Image();
    image.src = new URL(`./portrait-atlas-${index}.webp`, import.meta.url).href;
    await image.decode();
    return image;
  })).catch(error => { atlasPromise = undefined; throw error; });
}

function mount(section) {
  const copy = section.querySelector('.lp-deep-inner > div:first-child');
  if (!copy) return;
  section.classList.add('lp-ask');
  if (!section.querySelector('.lp-ask-scene')) section.insertAdjacentHTML('afterbegin', sceneMarkup);
  if (!section.querySelector('.lp-ask-copy')) copy.insertAdjacentHTML('afterbegin', copyMarkup);
  if (!section.querySelector('.lp-ask-control')) section.insertAdjacentHTML('beforeend', controlMarkup);
  const canvas = section.querySelector('.lp-ask-portrait');
  const context = canvas.getContext('2d');
  if (!context) return;
  const button = section.querySelector('.lp-ask-control');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, paused = false, ready = false, failed = false, destroyed = false, preparing = false;
  let elapsed = 0, lastTime = null, request = null, lastFrame = -1, atlases;
  const queryTime = new URLSearchParams(location.search).get('ask-time');
  if (queryTime !== null && /^\d+(\.\d+)?$/.test(queryTime)) {
    elapsed = Math.min(DURATION - 1, Number(queryTime) * 1000);
    paused = true;
  }

  function draw() {
    if (!ready) return;
    const frame = frameAt(elapsed);
    if (frame === lastFrame) return;
    const cell = frame % 6;
    context.clearRect(0, 0, 1280, 720);
    context.drawImage(atlases[Math.floor(frame / 6)], (cell % 3) * 1280, Math.floor(cell / 3) * 720, 1280, 720, 0, 0, 1280, 720);
    lastFrame = frame;
    section.dataset.askFrame = String(frame);
  }
  function canPlay() { return ready && visible && !document.hidden && !preference.matches && !paused && !failed && !destroyed; }
  function stop() {
    if (request !== null) cancelAnimationFrame(request);
    request = null;
    lastTime = null;
  }
  function tick(time) {
    request = null;
    if (!canPlay()) return;
    if (lastTime !== null) elapsed = (elapsed + Math.min(time - lastTime, 100)) % DURATION;
    lastTime = time;
    draw();
    request = requestAnimationFrame(tick);
  }
  function sync() {
    stop();
    const playing = canPlay();
    section.dataset.askMotion = failed ? 'unavailable' : preference.matches ? 'reduced' : paused ? 'paused' : !ready ? 'loading' : playing ? 'playing' : 'offscreen';
    button.hidden = failed || preference.matches || !ready;
    button.innerHTML = paused ? '<span aria-hidden="true">▷</span><span>Play motion</span>' : '<span aria-hidden="true">Ⅱ</span><span>Pause motion</span>';
    button.setAttribute('aria-label', paused ? 'Play section animation' : 'Pause section animation');
    section.classList.toggle('lp-ask-pose-ready', ready && !preference.matches && !failed);
    draw();
    if (playing) request = requestAnimationFrame(tick);
  }
  async function prepare() {
    if (preparing || ready || failed || destroyed) return;
    preparing = true;
    try {
      await Promise.all([...section.querySelectorAll('.lp-ask-layers img')].map(image => { image.loading = 'eager'; return image.decode(); }));
      if (destroyed) return;
      section.classList.add('lp-ask-composite-ready');
      if (preference.matches) return;
      atlases = await loadAtlases();
      if (!destroyed) ready = true;
    } catch { failed = true; }
    finally { preparing = false; if (!destroyed) sync(); }
  }
  function onPreference() { sync(); if (visible) prepare(); }
  function onToggle() { paused = !paused; sync(); }
  button.addEventListener('click', onToggle);
  preference.addEventListener('change', onPreference);
  document.addEventListener('visibilitychange', sync);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) prepare();
    sync();
  }, { threshold: 0 });
  observer.observe(section.querySelector('.lp-ask-scene'));
  sync();
  return () => {
    destroyed = true;
    stop();
    observer.disconnect();
    context.clearRect(0, 0, 1280, 720);
    button.removeEventListener('click', onToggle);
    preference.removeEventListener('change', onPreference);
    document.removeEventListener('visibilitychange', sync);
  };
}

export function startAskMotion() {
  const scan = () => {
    for (const [section, dispose] of instances) if (!section.isConnected) { dispose(); instances.delete(section); }
    for (const section of document.querySelectorAll('#how.lp-deep')) {
      if (instances.has(section)) continue;
      const dispose = mount(section);
      if (dispose) instances.set(section, dispose);
    }
  };
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; scan(); });
  });
  observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
  scan();
}

if (typeof document !== 'undefined') startAskMotion();
