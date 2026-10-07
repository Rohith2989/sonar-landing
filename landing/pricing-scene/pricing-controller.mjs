import { validateCatalogue, offersMarkup, getPlan, money } from './pricing-content.mjs';

export function mountPricing(section, { lazy = true } = {}) {
  section.dataset.pricingManaged = 'true';
  let data = null, platforms = 'dual', interval = 'month', request, timeout, refreshTimer;
  let active = false, disposed = false, lastData = '', visible = false;
  const initial = section.querySelector('[data-pricing-catalogue]');
  if (initial) { try { data = validateCatalogue(JSON.parse(initial.textContent)); lastData = JSON.stringify(data); } catch {} }
  const offers = section.querySelector('[data-pricing-offers]');
  const status = section.querySelector('[data-pricing-status]');
  function render(announce = false) {
    const wasExpanded = offers.querySelector('.sp-addons')?.open;
    const focused = document.activeElement?.closest('[data-plan]')?.dataset.plan;
    offers.innerHTML = offersMarkup(data, platforms, interval);
    if (wasExpanded && offers.querySelector('.sp-addons')) offers.querySelector('.sp-addons').open = true;
    if (focused) offers.querySelector(`[data-plan="${focused}"] .sp-cta`)?.focus({preventScroll:true});
    section.querySelectorAll('[data-platform]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.platform === platforms)));
    section.querySelectorAll('[data-interval]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.interval === interval)));
    section.querySelector('.sp-saving').hidden = data?.annual_months_billed !== 11;
    if (announce && data) status.textContent = `${platforms === 'dual' ? 'TikTok and Instagram' : 'One platform'}, ${interval === 'year' ? 'annual' : 'monthly'} billing. ` + ['solo','team','agency'].map(key => { const p = getPlan(data,key,platforms,interval); return `${key}: ${typeof p?.price_usd === 'number' ? `$${money(p.price_usd)} per ${interval}` : 'price unavailable'}`; }).join('. ');
  }
  async function refresh() {
    if (disposed || request || document.hidden) return;
    const controller = new AbortController(); request = controller;
    timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('/api/public/pricing', {credentials:'omit', cache:'no-store', signal:controller.signal});
      if (!response.ok) throw new Error('Prices unavailable');
      const next = validateCatalogue(await response.json());
      if (disposed) return;
      const serialized = JSON.stringify(next);
      data = next;
      if (lastData !== serialized) { lastData = serialized; render(); }
    } catch {
      if (!disposed) { data = null; lastData = ''; render(); }
    } finally { clearTimeout(timeout); request = null; }
  }
  function activate() {
    if (active) return;
    active = true; void refresh();
    refreshTimer = setInterval(() => { if (visible) void refresh(); }, 60000);
  }
  function click(event) {
    const target = event.target.closest('button');
    if (!target || !section.contains(target)) return;
    if (target.dataset.platform && target.dataset.platform !== platforms) { platforms = target.dataset.platform; render(true); }
    if (target.dataset.interval && target.dataset.interval !== interval) { interval = target.dataset.interval; render(true); }
    if (target.hasAttribute('data-pricing-retry')) void refresh();
  }
  function resume() { if (active && visible && !document.hidden) void refresh(); }
  section.addEventListener('click',click);
  window.addEventListener('focus',resume);
  document.addEventListener('visibilitychange',resume);
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting);
    if (visible) activate();
  }, {rootMargin:'150px'}) : null;
  observer?.observe(section);
  if (!lazy || !observer) { visible = true; activate(); }
  return () => {
    delete section.dataset.pricingManaged;
    disposed = true; request?.abort(); clearTimeout(timeout); clearInterval(refreshTimer); observer?.disconnect();
    section.removeEventListener('click',click); window.removeEventListener('focus',resume); document.removeEventListener('visibilitychange',resume);
  };
}
