import {copyFile,readFile,writeFile,mkdir} from 'node:fs/promises';
import {sceneMarkup,copyMarkup,controlMarkup} from '../source/ask-motion/feed-markup.mjs';
import {peopleMarkup} from '../source/people-scene/people-content.mjs';
import {pricingMarkup,validateCatalogue} from '../source/pricing-scene/pricing-content.mjs';
import {footerMarkup} from '../source/page-polish/footer-content.mjs';
const out='landing/hero-motion';
await mkdir(out,{recursive:true});
for(const name of ['hero-motion.mjs','hero-motion.css','timeline.mjs'])await copyFile(`source/hero-motion/${name}`,`${out}/${name}`);
const marker='<!-- sonar-hero-motion -->';
const script=`${marker}\n    <script type="module" src="/landing/hero-motion/hero-motion.mjs"></script>`;
for(const name of ['marquee-speed.mjs','marquee-speed.css'])await copyFile(`source/${name}`,`landing/${name}`);
const marqueeMarker='<!-- sonar-marquee-speed -->';
const marqueeAssets=`${marqueeMarker}\n    <link rel="stylesheet" href="/landing/marquee-speed.css">\n    <script type="module" src="/landing/marquee-speed.mjs"></script>`;
await mkdir('landing/ask-motion',{recursive:true});
for(const name of ['feed-markup.mjs','feed-video.mjs','feed-motion.css','ask-motion.mjs','ask-video.mjs','ask-poses.mjs','ask-markup.mjs','ask-motion.css','portrait-timeline.mjs'])await copyFile(`source/ask-motion/${name}`,`landing/ask-motion/${name}`);
const askMarker='<!-- sonar-ask-motion -->';
const askAssets=`${askMarker}\n    <link rel="stylesheet" href="/landing/ask-motion/ask-motion.css">\n    <link rel="stylesheet" href="/landing/ask-motion/feed-motion.css">\n    <script type="module" src="/landing/ask-motion/ask-motion.mjs"></script>`;
await mkdir('landing/people-scene',{recursive:true});
for(const name of ['people-content.mjs','people-scene.mjs','people-scene.css'])await copyFile(`source/people-scene/${name}`,`landing/people-scene/${name}`);
const peopleMarker='<!-- sonar-people-scene -->';
const peopleAssets=`${peopleMarker}\n    <link rel="stylesheet" href="/landing/people-scene/people-scene.css">\n    <script type="module" src="/landing/people-scene/people-scene.mjs"></script>`;
for(const file of ['index.html','prerendered/index.html']) {
  let html=await readFile(file,'utf8');
  if(!html.includes(marker))html=html.replace('</head>',`${script}\n  </head>`);
  if(!html.includes(marqueeMarker))html=html.replace('</head>',`${marqueeAssets}\n  </head>`);
  if(!html.includes(askMarker))html=html.replace('</head>',`${askAssets}\n  </head>`);
  if(!html.includes(peopleMarker))html=html.replace('</head>',`${peopleAssets}\n  </head>`);
  const peopleSection=/<section\b[^>]*class="lp-people(?: lp-role-scene)?"[^>]*>[\s\S]*?<\/section>/;
  if(!peopleSection.test(html))throw new Error(`Missing people section in ${file}`);
  html=html.replace(peopleSection,peopleMarkup);
  if(!html.includes('href="/landing/ask-motion/feed-motion.css"'))html=html.replace('</head>', '<link rel="stylesheet" href="/landing/ask-motion/feed-motion.css">\n</head>');
  html=html.replace(/<section id="how"[^>]*>/, '<section id="how" class="lp-deep lp-ask lp-feed scroll-mt-24" data-ask-design="feed">');
  if(html.includes('class="lp-ask-scene"')) {
    html=html.replace(/<div class="lp-ask-scene" aria-hidden="true">[\s\S]*?\n<\/div>/,sceneMarkup);
    html=html.replace(/<header class="lp-ask-copy">[\s\S]*?<\/header>/,copyMarkup);
  } else {
    html=html.replace('<section id="how" class="lp-deep lp-ask lp-feed scroll-mt-24" data-ask-design="feed">',`<section id="how" class="lp-deep lp-ask lp-feed scroll-mt-24" data-ask-design="feed">${sceneMarkup}${controlMarkup}`);
    html=html.replace('<div class="lp-deep-inner"><div>',`<div class="lp-deep-inner"><div>${copyMarkup}`);
  }
  await writeFile(file,html);
}
// Check local imports and atlas files before deploying the static snapshot.
const manifest = JSON.parse(await readFile(`${out}/manifest.json`,'utf8'));
for(const actor of Object.values(manifest.actors)) {
  for(const source of actor.sources ?? [actor.src])await readFile(`.${source}`);
}
for(const file of ['scene-poster.webp','cloud-background.webp','foreground-props.webp','portrait-rest.webp','portrait-atlas-0.webp','portrait-atlas-1.webp','portrait-manifest.json','portrait-fluid.webm','portrait-fluid-hevc.mov','portrait-fluid-rest.webp','video-manifest.json','closer-feed.webm','closer-feed-hevc.mov','closer-feed-rest.webp','closer-feed-manifest.json'])await readFile(`landing/ask-motion/${file}`);
for(const name of ['lead','prove','move'])await readFile(`landing/people-scene/${name}.webp`);
const catalogue=validateCatalogue(JSON.parse(await readFile('preview-data/pricing.json','utf8')));
await mkdir('landing/pricing-scene',{recursive:true});
for(const name of ['pricing-content.mjs','pricing-controller.mjs','pricing-scene.mjs','pricing-scene.css'])await copyFile(`source/pricing-scene/${name}`,`landing/pricing-scene/${name}`);
for(const name of ['solo','team','agency'])await readFile(`landing/pricing-scene/${name}.webp`);
const pricingMarker='<!-- sonar-pricing-scene -->';
const pricingAssets=`${pricingMarker}\n    <link rel="stylesheet" href="/landing/pricing-scene/pricing-scene.css">\n    <script type="module" src="/landing/pricing-scene/pricing-scene.mjs"></script>`;
for(const file of ['index.html','prerendered/index.html','prerendered/pricing.html']) {
  let html=await readFile(file,'utf8');
  if(!html.includes(pricingMarker))html=html.replace('</head>',`${pricingAssets}\n  </head>`);
  const section=/<section\b[^>]*id="pricing"[^>]*>[\s\S]*?<\/section>/;
  if(!section.test(html))throw new Error(`Missing pricing section in ${file}`);
  html=html.replace(section,pricingMarkup(catalogue,{page:file==='prerendered/pricing.html'}));
  html=html.replace('<div class="lp-pricing lp-grain">','<div class="sp-pricing-host">');
  await writeFile(file,html);
}
await mkdir('landing/page-polish',{recursive:true});
for(const name of ['footer-content.mjs','page-polish.mjs','page-polish.css'])await copyFile(`source/page-polish/${name}`,`landing/page-polish/${name}`);
const polishMarker='<!-- sonar-page-polish -->';
const polishAssets=`${polishMarker}\n    <link rel="stylesheet" href="/landing/page-polish/page-polish.css">\n    <script type="module" src="/landing/page-polish/page-polish.mjs"></script>`;
for(const file of ['index.html','prerendered/index.html','prerendered/pricing.html']) {
  let html=await readFile(file,'utf8');
  if(!html.includes(polishMarker))html=html.replace('</head>',`${polishAssets}\n  </head>`);
  const footer=/<footer\b[^>]*>[\s\S]*?<\/footer>/;
  if(!footer.test(html))throw new Error(`Missing footer in ${file}`);
  html=html.replace(footer,footerMarkup);
  await writeFile(file,html);
}
console.log('Landing and pricing built with shared page cleanup and footer.');
