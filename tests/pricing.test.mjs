import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCatalogue, getPlan, planDestination, offersMarkup, pricingMarkup } from '../source/pricing-scene/pricing-content.mjs';
const data = JSON.parse(await readFile(new URL('../preview-data/pricing.json',import.meta.url),'utf8'));

test('all platform and billing selections show catalogue totals, never annual-as-monthly prices', () => {
  validateCatalogue(data);
  const expected = {
    'single/month':[79,239,599], 'dual/month':[119,349,899],
    'single/year':[869,2629,6589], 'dual/year':[1309,3839,9889],
  };
  for(const [selection,prices] of Object.entries(expected)) {
    const [platforms,interval] = selection.split('/');
    const html = offersMarkup(data,platforms,interval);
    ['solo','team','agency'].forEach((key,i) => {
      assert.equal(getPlan(data,key,platforms,interval).price_usd,prices[i]);
      assert.ok(html.includes(prices[i].toLocaleString('en-US')));
    });
    assert.equal((html.match(new RegExp(`class="sp-period">/ ${interval === 'year' ? 'year' : 'month'}`,'g')) || []).length,3);
    if(interval === 'year') assert.ok(html.includes('One payment per year'));
  }
});
test('signup requires an available, fully priced self-serve plan', () => {
  const base = getPlan(data,'solo','dual','month');
  assert.equal(planDestination(base),'/contact');
  assert.equal(planDestination({...base,available:true}),'/signup');
  for(const changed of [{price_usd:null},{niche_allowance:null},{contact_only:true}])
    assert.equal(planDestination({...base,available:true,...changed}),'/contact');
  assert.equal(planDestination(undefined),'/contact');
});
test('malformed API data fails closed, including duplicate variants and invalid availability', () => {
  for(const patch of [{price_usd:-1},{price_usd:Infinity},{price_usd:'119'},{available:true,price_usd:null},{available:true,contact_only:true},{niche_allowance:1.5},{platforms_key:'other'}]) {
    const value = structuredClone(data); Object.assign(value.plans[0],patch);
    assert.throws(() => validateCatalogue(value));
  }
  const duplicate = structuredClone(data); duplicate.plans.push(duplicate.plans[0]);
  assert.throws(() => validateCatalogue(duplicate));
  assert.throws(() => validateCatalogue({...data,currency:'EUR'}));
});
test('missing price variants and API failures do not become zero-priced plans', () => {
  const missing = {...data,plans:data.plans.filter(p=>p.plan_key !== 'solo')};
  const html = offersMarkup(missing);
  assert.ok(html.includes('Price unavailable'));
  assert.ok(html.includes('href="/contact"'));
  const failure = offersMarkup(null);
  assert.ok(failure.includes('role="alert"'));
  assert.ok(failure.includes('data-pricing-retry'));
  assert.ok(!failure.includes('sp-value'));
});
test('API-provided add-on copy and embedded catalogue cannot inject markup', () => {
  const hostile = structuredClone(data);
  hostile.addons[0].label = '<img src=x onerror=alert(1)>';
  hostile.addons[0].unit = '</script><script>alert(1)</script>';
  const html = pricingMarkup(hostile);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>alert(1)'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('\\u003c/script>'));
});
test('deployed modules match source and static pricing is usable without JavaScript', async () => {
  for(const file of ['pricing-content.mjs','pricing-controller.mjs','pricing-scene.mjs','pricing-scene.css'])
    assert.equal(await readFile(new URL(`../source/pricing-scene/${file}`,import.meta.url),'utf8'),await readFile(new URL(`../landing/pricing-scene/${file}`,import.meta.url),'utf8'));
  for(const file of ['index.html','prerendered/index.html','prerendered/pricing.html']) {
    const html=await readFile(new URL(`../${file}`,import.meta.url),'utf8');
    assert.equal((html.match(/id="pricing"/g)||[]).length,1);
    assert.equal((html.match(/sonar-pricing-scene/g)||[]).length,1);
    assert.ok(html.includes('Choose Solo'));
    assert.ok(html.includes('Showing monthly prices for both platforms.'));
  }
});
