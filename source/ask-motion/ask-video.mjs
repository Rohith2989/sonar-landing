import { sceneMarkup, copyMarkup, controlMarkup } from './ask-markup.mjs';

const instances = new Map();
const sources = [
  { file: 'portrait-fluid.webm', type: 'video/webm; codecs="vp9"' },
  { file: 'portrait-fluid-hevc.mov', type: 'video/mp4; codecs="hvc1"' },
];

function mount(section) {
  const copy = section.querySelector('.lp-deep-inner > div:first-child');
  if (!copy) return;
  section.classList.add('lp-ask');
  if (section.dataset.askDesign === 'feed') {
    section.classList.remove('lp-feed');
    delete section.dataset.askDesign;
    section.querySelector('.lp-ask-scene').outerHTML = sceneMarkup;
    section.querySelector('.lp-ask-copy').outerHTML = copyMarkup;
  }
  section.dataset.askMode = 'video';
  if (!section.querySelector('.lp-ask-scene')) section.insertAdjacentHTML('afterbegin', sceneMarkup);
  if (!section.querySelector('.lp-ask-copy')) copy.insertAdjacentHTML('afterbegin', copyMarkup);
  if (!section.querySelector('.lp-ask-control')) section.insertAdjacentHTML('beforeend', controlMarkup);
  const video = section.querySelector('.lp-ask-film');
  const rest = section.querySelector('.lp-ask-portrait-rest');
  rest.src = new URL('./portrait-fluid-rest.webp', import.meta.url).href;
  const button = section.querySelector('.lp-ask-control');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const candidates = sources.filter(source => video.canPlayType(source.type));
  let visible = false, paused = false, ready = false, failed = false, destroyed = false, preparing = false, layersReady = false;
  let sourceIndex = -1, generation = 0;
  const queryTime = new URLSearchParams(location.search).get('ask-time');
  const proofTime = queryTime !== null && /^\d+(\.\d+)?$/.test(queryTime) ? Number(queryTime) : null;
  if (proofTime !== null) paused = true;
  video.muted = true;
  video.defaultMuted = true;

  function sync() {
    const currentGeneration = ++generation;
    const playing = ready && visible && !document.hidden && !preference.matches && !paused && !failed && !destroyed;
    section.dataset.askMotion = failed ? 'unavailable' : preference.matches ? 'reduced' : paused ? 'paused' : !ready ? 'loading' : playing ? 'playing' : 'offscreen';
    button.hidden = failed || preference.matches || !ready;
    button.innerHTML = paused ? '<span aria-hidden="true">▷</span><span>Play motion</span>' : '<span aria-hidden="true">Ⅱ</span><span>Pause motion</span>';
    button.setAttribute('aria-label', paused ? 'Play section animation' : 'Pause section animation');
    section.classList.toggle('lp-ask-film-ready', ready && !preference.matches && !failed);
    if (playing) {
      video.play().catch(() => {
        if (destroyed || currentGeneration !== generation) return;
        paused = true;
        sync();
      });
    } else video.pause();
  }
  function loadNext() {
    if (destroyed) return;
    ready = false;
    const source = candidates[++sourceIndex];
    if (!source) { failed = true; video.removeAttribute('src'); video.load(); sync(); return; }
    video.src = new URL(`./${source.file}`, import.meta.url).href;
    section.dataset.askCodec = source.file.endsWith('.webm') ? 'vp9-alpha' : 'hevc-alpha';
    video.load();
    sync();
  }
  function hasDecodedAlpha() {
    // Some browsers decode HEVC/VP9 color but discard alpha. Never show a black rectangle.
    const probe = document.createElement('canvas');
    probe.width = probe.height = 2;
    const context = probe.getContext('2d', { willReadFrequently: true });
    if (!context || !video.videoWidth) return false;
    context.drawImage(video, 0, 0, 2, 2, 0, 0, 2, 2);
    return context.getImageData(0, 0, 1, 1).data[3] < 16;
  }
  function onReady() {
    if (destroyed || failed) return;
    try { if (!hasDecodedAlpha()) { loadNext(); return; } }
    catch { loadNext(); return; }
    ready = true;
    if (proofTime !== null) video.currentTime = Math.max(0, Math.min(proofTime, video.duration - .05));
    sync();
  }
  function onError() { if (!failed && !destroyed) loadNext(); }
  async function prepare() {
    if (preparing || failed || destroyed) return;
    preparing = true;
    try {
      if (!layersReady) {
        await Promise.all([...section.querySelectorAll('.lp-ask-layers img')].map(image => { image.loading = 'eager'; return image.decode(); }));
        if (destroyed) return;
        layersReady = true;
        section.classList.add('lp-ask-composite-ready');
      }
      if (!preference.matches && sourceIndex === -1) loadNext();
    } catch { failed = true; }
    finally { preparing = false; if (!destroyed) sync(); }
  }
  function onPreference() { sync(); if (visible) prepare(); }
  function onToggle() { paused = !paused; sync(); }
  video.addEventListener('loadeddata', onReady);
  video.addEventListener('error', onError);
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
    generation++;
    observer.disconnect();
    video.removeEventListener('loadeddata', onReady);
    video.removeEventListener('error', onError);
    video.pause();
    video.removeAttribute('src');
    video.load();
    button.removeEventListener('click', onToggle);
    preference.removeEventListener('change', onPreference);
    document.removeEventListener('visibilitychange', sync);
  };
}

export function startAskVideo() {
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

if (typeof document !== 'undefined') startAskVideo();
