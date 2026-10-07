import {copyFile,readFile,writeFile,mkdir} from 'node:fs/promises';
import {sceneMarkup,copyMarkup,controlMarkup} from '../source/ask-motion/ask-markup.mjs';
const out='landing/hero-motion';
await mkdir(out,{recursive:true});
for(const name of ['hero-motion.mjs','hero-motion.css','timeline.mjs'])await copyFile(`source/hero-motion/${name}`,`${out}/${name}`);
const marker='<!-- sonar-hero-motion -->';
const script=`${marker}\n    <script type="module" src="/landing/hero-motion/hero-motion.mjs"></script>`;
for(const name of ['marquee-speed.mjs','marquee-speed.css'])await copyFile(`source/${name}`,`landing/${name}`);
const marqueeMarker='<!-- sonar-marquee-speed -->';
const marqueeAssets=`${marqueeMarker}\n    <link rel="stylesheet" href="/landing/marquee-speed.css">\n    <script type="module" src="/landing/marquee-speed.mjs"></script>`;
await mkdir('landing/ask-motion',{recursive:true});
for(const name of ['ask-motion.mjs','ask-markup.mjs','ask-motion.css','motion-mask.svg'])await copyFile(`source/ask-motion/${name}`,`landing/ask-motion/${name}`);
const askMarker='<!-- sonar-ask-motion -->';
const askAssets=`${askMarker}\n    <link rel="stylesheet" href="/landing/ask-motion/ask-motion.css">\n    <script type="module" src="/landing/ask-motion/ask-motion.mjs"></script>`;
for(const file of ['index.html','prerendered/index.html']) {
  let html=await readFile(file,'utf8');
  if(!html.includes(marker))html=html.replace('</head>',`${script}\n  </head>`);
  if(!html.includes(marqueeMarker))html=html.replace('</head>',`${marqueeAssets}\n  </head>`);
  if(!html.includes(askMarker))html=html.replace('</head>',`${askAssets}\n  </head>`);
  if(!html.includes('class="lp-ask-scene"')) {
    html=html.replace('<section id="how" class="lp-deep scroll-mt-24">',`<section id="how" class="lp-deep lp-ask scroll-mt-24">${sceneMarkup}${controlMarkup}`);
    html=html.replace('<div class="lp-deep-inner"><div>',`<div class="lp-deep-inner"><div>${copyMarkup}`);
  }
  await writeFile(file,html);
}
// Check local imports and atlas files before deploying the static snapshot.
const manifest = JSON.parse(await readFile(`${out}/manifest.json`,'utf8'));
for(const actor of Object.values(manifest.actors)) {
  for(const source of actor.sources ?? [actor.src])await readFile(`.${source}`);
}
for(const file of ['scene-poster.webp','scene-loop.mp4'])await readFile(`landing/ask-motion/${file}`);
console.log('Hero, Ask Sonar and marquee modules built; both static landing entry points wired.');
