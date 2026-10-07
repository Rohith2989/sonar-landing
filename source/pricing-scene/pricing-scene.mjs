import { pricingMarkup } from './pricing-content.mjs';
import { mountPricing } from './pricing-controller.mjs';

// The shipped React snapshot predates this design. Mount beside its original
// pricing section so React retains ownership of its own nodes and forms.
const mounted = new Map();
const controllers = new Map();
function sync() {
  for (const [original, scene] of mounted) {
    if (!original.isConnected) { scene.remove(); mounted.delete(original); }
  }
  for (const [scene, dispose] of controllers) {
    if (!scene.isConnected) { dispose(); controllers.delete(scene); }
  }
  for (const original of document.querySelectorAll('section#pricing:not(.sp-pricing)')) {
    if (mounted.has(original)) continue;
    if (original.parentElement.classList.contains('lp-pricing')) {
      original.parentElement.classList.replace('lp-pricing','sp-pricing-host');
      original.parentElement.classList.remove('lp-grain');
    }
    original.insertAdjacentHTML('beforebegin', pricingMarkup(null, {page:location.pathname === '/pricing'}));
    const scene = original.previousElementSibling;
    original.dataset.pricingReplaced = 'true';
    original.removeAttribute('id');
    mounted.set(original, scene);
    if (location.hash === '#pricing') requestAnimationFrame(() => { if(scene.isConnected) scene.scrollIntoView({block:'start',behavior:'instant'}); });
  }
  // Also activate the prerendered section before hydration, or if the original
  // app bundle cannot load. Its controller is released if React replaces it.
  for (const scene of document.querySelectorAll('.sp-pricing:not([data-pricing-managed])')) {
    controllers.set(scene, mountPricing(scene));
  }
  document.body.classList.toggle('sp-pricing-page', location.pathname === '/pricing');
}
if (typeof document !== 'undefined') {
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true; queueMicrotask(() => { queued = false; sync(); });
  });
  observer.observe(document.getElementById('root') ?? document.body, {childList:true, subtree:true});
  sync();
}
