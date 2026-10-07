export const plans = [
  { key: 'solo', name: 'Solo', line: 'Find your angle.', note: 'Your category, in focus.' },
  { key: 'team', name: 'Team', line: 'See the whole story.', note: 'More perspectives. One clear picture.' },
  { key: 'agency', name: 'Agency', line: 'Make every brand move.', note: 'A clearer view for every client.' },
];
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
const isPrice = value => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
export function validateCatalogue(data) {
  if (!data || data.currency !== 'USD' || !Array.isArray(data.plans) || !data.plans.length || !Array.isArray(data.addons) || !Number.isInteger(data.annual_months_billed) || data.annual_months_billed < 1) throw new Error('Invalid catalogue');
  const keys = new Set();
  for (const p of data.plans) {
    const key = `${p.plan_key}|${p.platforms_key}|${p.interval}`;
    if (!p.plan_key || keys.has(key) || !['single','dual'].includes(p.platforms_key) || !['month','year'].includes(p.interval) || !isPrice(p.price_usd) || !isPrice(p.from_price_usd) || !(p.niche_allowance === null || (Number.isInteger(p.niche_allowance) && p.niche_allowance >= 0)) || typeof p.available !== 'boolean' || typeof p.contact_only !== 'boolean' || (p.available && (p.contact_only || p.price_usd === null || p.niche_allowance === null))) throw new Error('Invalid plan');
    keys.add(key);
  }
  for (const a of data.addons) if (typeof a.label !== 'string' || typeof a.unit !== 'string' || typeof a.available !== 'boolean' || !isPrice(a.price_usd) || (a.available && a.price_usd === null)) throw new Error('Invalid add-on');
  return data;
}
export function getPlan(data, key, platforms, interval) {
  return data?.plans.find(p => p.plan_key === key && p.platforms_key === platforms && p.interval === interval);
}
export function planDestination(plan) {
  return plan?.available === true && !plan.contact_only && typeof plan.price_usd === 'number' && plan.niche_allowance !== null ? '/signup' : '/contact';
}
const arrow = '<span aria-hidden="true">↗</span>';
const check = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="m3 8 3.2 3.2L13 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function cardMarkup(role, i, data, platforms, interval) {
  const plan = getPlan(data, role.key, platforms, interval);
  const price = plan?.price_usd;
  const known = typeof price === 'number';
  const direct = planDestination(plan) === '/signup';
  return `<article class="sp-card" data-plan="${role.key}" data-testid="pricing-plan-${role.key}" aria-labelledby="sp-${role.key}-title">
    <div class="sp-card-head"><div class="sp-card-intro"><span class="sp-number">0${i + 1}</span><h3 id="sp-${role.key}-title">${role.name}${role.key === 'team' ? '<span class="sp-star" aria-hidden="true">✳</span>' : ''}</h3><p>${role.line}</p></div>
      <div class="sp-art" aria-hidden="true"><img src="/landing/pricing-scene/${role.key}.webp" width="480" height="400" alt="" loading="lazy" decoding="async"/><i class="sp-art-glint"></i></div></div>
    <div class="sp-amount">${known ? `<span class="sp-value"><span class="sp-currency">$</span>${money(price)}</span><span class="sp-period">/ ${interval === 'year' ? 'year' : 'month'}</span>` : '<span class="sp-unavailable">Price unavailable</span>'}</div>
    <p class="sp-billing">${known ? interval === 'year' ? 'One payment per year' : 'Billed monthly' : 'Contact us for current pricing'}</p>
    <ul class="sp-features"><li>${check}<strong>${plan?.niche_allowance ?? '—'} ${plan?.niche_allowance === 1 ? 'niche' : 'niches'}</strong></li><li>${check}${platforms === 'dual' ? 'TikTok + Instagram' : 'One platform'}</li></ul>
    <p class="sp-card-note">${role.note}</p>
    <a class="sp-cta" href="${planDestination(plan)}" aria-label="Choose ${role.name}${direct ? '' : ' — contact us for availability'}">Choose ${role.name}${arrow}</a>
  </article>`;
}
export function offersMarkup(data, platforms = 'dual', interval = 'month') {
  if (!data) return '<div class="sp-error" role="alert"><p>Pricing is temporarily unavailable.</p><button type="button" data-pricing-retry>Try again</button><a href="/contact">Contact us for pricing ↗</a></div>';
  const enterprise = getPlan(data, 'enterprise', platforms, interval);
  const enterprisePrice = enterprise?.from_price_usd;
  return `<div class="sp-grid">${plans.map((p,i) => cardMarkup(p,i,data,platforms,interval)).join('')}</div>
    ${enterprise ? `<div class="sp-enterprise"><div class="sp-enterprise-copy"><h3>Enterprise</h3><p>${enterprise.niche_allowance === null ? 'Custom scope.' : `${enterprise.niche_allowance} niches.`} A wider field of view.</p></div><div class="sp-enterprise-action"><p>${typeof enterprisePrice === 'number' ? `From <strong>$${money(enterprisePrice)}</strong>` : 'Custom pricing'}<small>Custom scope, invoiced</small></p><a href="/contact" class="sp-cta">Let's talk${arrow}</a></div></div>` : ''}
    <div class="sp-after"><p class="sp-availability">${plans.some(p => planDestination(getPlan(data,p.key,platforms,interval)) === '/contact') ? 'Talk to our team to get started.' : 'Choose a plan to get started.'} <span>All prices in USD.</span></p>${data.addons.length ? `<details class="sp-addons"><summary>Add a little more<span aria-hidden="true">+</span></summary><ul>${data.addons.map(a => `<li><div><strong>${escapeHtml(a.label)}</strong><span>${escapeHtml(a.unit)}</span></div><b>${a.price_usd === null ? 'Contact us' : `$${money(a.price_usd)}`}</b>${a.available ? '' : '<a href="/contact">Ask about availability ↗</a>'}</li>`).join('')}</ul></details>` : ''}</div>`;
}
export function pricingMarkup(data = null, {page = false} = {}) {
  const titleTag = page ? 'h1' : 'h2';
  return `<section id="pricing" class="sp-pricing" aria-labelledby="sp-heading"><div class="sp-inner">
    <header class="sp-header"><p class="sp-eyebrow">Plans for your next move</p><${titleTag} id="sp-heading">Small team. <span>Big perspective.</span></${titleTag}><p class="sp-subtitle">Choose how much of the market you want to see.</p></header>
    <div class="sp-controls"><div class="sp-switch" role="group" aria-label="Platforms"><button type="button" data-platform="single" aria-pressed="false">One platform</button><button type="button" data-platform="dual" aria-pressed="true">TikTok + Instagram</button></div><div class="sp-billing-control"><div class="sp-switch" role="group" aria-label="Billing period"><button type="button" data-interval="month" aria-pressed="true">Monthly</button><button type="button" data-interval="year" aria-pressed="false">Annual</button></div><span class="sp-saving"${data?.annual_months_billed === 11 ? '' : ' hidden'}><span aria-hidden="true">✳</span>1 month on us</span></div></div>
    <p class="sp-sr" data-pricing-status role="status" aria-live="polite" aria-atomic="true"></p>
    <div data-pricing-offers>${data ? offersMarkup(data) : '<p class="sp-loading" role="status">Loading prices…</p>'}</div>
    ${data ? `<script type="application/json" data-pricing-catalogue>${JSON.stringify(data).replace(/</g,'\\u003c')}</script>` : ''}
    <noscript><p class="sp-nojs">Showing monthly prices for both platforms. Enable JavaScript to compare billing options, or <a href="/contact">contact us</a>.</p></noscript>
  </div></section>`;
}
