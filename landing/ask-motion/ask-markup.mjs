export const sceneMarkup = `<div class="lp-ask-scene" aria-hidden="true">
  <div class="lp-ask-frame">
    <img class="lp-ask-poster" src="/landing/ask-motion/scene-poster.webp" width="1672" height="941" loading="lazy" decoding="async" alt="">
    <div class="lp-ask-layers">
      <img class="lp-ask-clouds" src="/landing/ask-motion/cloud-background.webp" width="1672" height="941" loading="lazy" alt="">
      <img class="lp-ask-portrait-rest" src="/landing/ask-motion/portrait-rest.webp" width="1280" height="720" loading="lazy" alt="">
      <video class="lp-ask-film" width="1920" height="1080" muted playsinline loop preload="none" aria-hidden="true" tabindex="-1"></video>
      <canvas class="lp-ask-portrait" width="1280" height="720"></canvas>
      <img class="lp-ask-props" src="/landing/ask-motion/foreground-props.webp" width="1672" height="941" loading="lazy" alt="">
    </div>
  </div>
</div>`;

export const copyMarkup = `<header class="lp-ask-copy">
  <span class="lp-ask-eyebrow"><span></span> Ask Sonar</span>
  <h2>Good ideas.<br><em>Real evidence.</em></h2>
  <p>Ask about your market.<br>See the work behind the answer.</p>
</header>`;

export const controlMarkup = `<button class="lp-ask-control" type="button" aria-label="Pause section animation" hidden><span aria-hidden="true">Ⅱ</span><span>Pause motion</span></button>`;
