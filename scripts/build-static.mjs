import {copyFile,readFile,writeFile,mkdir} from 'node:fs/promises';
const out='landing/hero-motion';
await mkdir(out,{recursive:true});
for(const name of ['hero-motion.mjs','hero-motion.css','timeline.mjs'])await copyFile(`source/hero-motion/${name}`,`${out}/${name}`);
const marker='<!-- sonar-hero-motion -->';
const script=`${marker}\n    <script type="module" src="/landing/hero-motion/hero-motion.mjs"></script>`;
for(const file of ['index.html','prerendered/index.html']) {
  let html=await readFile(file,'utf8');
  if(!html.includes(marker))html=html.replace('</head>',`${script}\n  </head>`);
  await writeFile(file,html);
}
// Check local imports and atlas files before deploying the static snapshot.
const manifest = JSON.parse(await readFile(`${out}/manifest.json`,'utf8'));
for(const actor of Object.values(manifest.actors)) {
  for(const source of actor.sources ?? [actor.src])await readFile(`.${source}`);
}
console.log('Hero module built and both static landing entry points wired.');
