export const roles = [
  {
    key: 'lead', audience: 'Brand marketers', word: 'Lead.', title: 'Set the direction.',
    description: 'See the competitors, creators and content shaping your category.',
    action: 'Explore your market', href: '#how',
  },
  {
    key: 'prove', audience: 'Agencies', word: 'Prove.', title: 'Make the case.',
    description: 'Give every client a clear view, with source videos behind the story.',
    action: 'Bring the evidence', href: '#free-report',
  },
  {
    key: 'move', audience: 'Founders', word: 'Move.', title: 'Find your opening.',
    description: 'Understand the market before your next creator brief or launch.',
    action: 'See where to start', href: '#free-report',
  },
];

export const peopleMarkup = `<section id="people" class="lp-people lp-role-scene" aria-labelledby="people-heading">
  <div class="lp-role-inner">
    <header class="lp-role-header">
      <div>
        <span class="lp-role-eyebrow">Built for your next move</span>
        <h2 id="people-heading">Different roles.<br>Same unfair clarity.</h2>
      </div>
      <p>For the people turning<br>market signals into action.</p>
    </header>
    <div class="lp-role-grid">
      ${roles.map((role, index) => `<article class="lp-role" data-role="${role.key}" aria-labelledby="people-${role.key}">
        <span class="lp-role-label">0${index + 1} / ${role.audience}</span>
        <h3 id="people-${role.key}">${role.word}</h3>
        <div class="lp-role-art" aria-hidden="true">
          <img src="/landing/people-scene/${role.key}.webp" width="1200" height="1020" loading="lazy" decoding="async" alt="">
        </div>
        <div class="lp-role-copy">
          <h4>${role.title}</h4>
          <p>${role.description}</p>
          <a href="${role.href}" aria-label="${role.action} — ${role.audience}">${role.action}<span aria-hidden="true">↗</span></a>
        </div>
      </article>`).join('\n      ')}
    </div>
    <p class="lp-role-note">Illustrative photography.</p>
  </div>
</section>`;
