import { sceneMarkup, copyMarkup, controlMarkup } from './ask-markup.mjs';

const instances = new Map();

function mount(section) {
  const copy = section.querySelector('.lp-deep-inner > div:first-child');
  if (!copy) return;
  section.classList.add('lp-ask');
  if (!section.querySelector('.lp-ask-scene')) section.insertAdjacentHTML('afterbegin', sceneMarkup);
  if (!section.querySelector('.lp-ask-copy')) copy.insertAdjacentHTML('afterbegin', copyMarkup);
  if (!section.querySelector('.lp-ask-control')) section.insertAdjacentHTML('beforeend', controlMarkup);
  const video = section.querySelector('.lp-ask-video');
  const button = section.querySelector('.lp-ask-control');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, paused = false, ready = false, failed = false, destroyed = false;
  let generation = 0;
  video.muted = true;
  video.defaultMuted = true;
  const queryTime = new URLSearchParams(location.search).get('ask-time');
  const proofTime = queryTime !== null && /^\d+(\.\d+)?$/.test(queryTime) ? Math.min(7.95, Number(queryTime)) : null;
  if (proofTime !== null) paused = true;

  function sync() {
    const shouldPlay = ready && visible && !document.hidden && !preference.matches && !paused && !failed && !destroyed;
    const currentGeneration = ++generation;
    section.dataset.askMotion = failed ? 'unavailable' : preference.matches ? 'reduced' : paused ? 'paused' : !ready ? 'loading' : shouldPlay ? 'playing' : 'offscreen';
    button.hidden = failed || preference.matches || !ready;
    button.innerHTML = paused ? '<span aria-hidden="true">▷</span><span>Play motion</span>' : '<span aria-hidden="true">Ⅱ</span><span>Pause motion</span>';
    button.setAttribute('aria-label', paused ? 'Play section animation' : 'Pause section animation');
    section.classList.toggle('lp-ask-ready', ready && !preference.matches && !failed);
    if (shouldPlay) {
      video.play().catch(() => {
        if (destroyed || currentGeneration !== generation) return;
        paused = true;
        sync();
      });
    } else video.pause();
  }
  function prepare() {
    if (video.getAttribute('src') || preference.matches || failed || destroyed) return;
    video.src = new URL('./scene-loop.mp4', import.meta.url).href;
    video.load();
  }
  function onReady() {
    ready = true;
    if (proofTime !== null) video.currentTime = Math.min(proofTime, video.duration - .05);
    sync();
  }
  function onError() { failed = true; sync(); }
  function onPreference() { sync(); if (visible) prepare(); }
  function onToggle() { paused = !paused; sync(); }
  video.addEventListener('loadeddata', onReady, { once: true });
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
    video.pause();
    video.removeAttribute('src');
    video.load();
    observer.disconnect();
    video.removeEventListener('loadeddata', onReady);
    video.removeEventListener('error', onError);
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
