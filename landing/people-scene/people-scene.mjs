import { peopleMarkup } from './people-content.mjs';

// The static snapshot hydrates into the existing upstream React bundle. Keep its
// original nodes intact; the new presentation is a sibling owned by this module.
const mounted = new Map();
function sync() {
  for (const [original, scene] of mounted) {
    if (!original.isConnected) { scene.remove(); mounted.delete(original); }
  }
  for (const original of document.querySelectorAll('.lp-people:not(.lp-role-scene)')) {
    if (mounted.has(original)) continue;
    original.insertAdjacentHTML('beforebegin', peopleMarkup);
    const scene = original.previousElementSibling;
    original.dataset.roleReplaced = 'true';
    mounted.set(original, scene);
    if (location.hash === '#people') requestAnimationFrame(() => {
      if (scene.isConnected) scene.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
}

if (typeof document !== 'undefined') {
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; sync(); });
  });
  observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
  sync();
}
