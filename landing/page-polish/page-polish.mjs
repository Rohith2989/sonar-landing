import { footerMarkup } from './footer-content.mjs';

// Keep the legacy React footer nodes intact while presenting the shared design.
const footers = new Map();
function sync() {
  for (const [original, scene] of footers) {
    if (!original.isConnected) { scene.remove(); footers.delete(original); }
  }
  for (const original of document.querySelectorAll('#root main ~ footer:not(.sf-footer):not([data-footer-replaced])')) {
    original.insertAdjacentHTML('beforebegin',footerMarkup);
    const scene = original.previousElementSibling;
    original.dataset.footerReplaced = 'true';
    footers.set(original,scene);
  }
}
if (typeof document !== 'undefined') {
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; sync(); });
  });
  observer.observe(document.getElementById('root') ?? document.body,{childList:true,subtree:true});
  sync();
}
