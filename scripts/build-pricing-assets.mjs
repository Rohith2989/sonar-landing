import sharp from 'sharp';
import {mkdir, stat} from 'node:fs/promises';
await mkdir('landing/pricing-scene',{recursive:true});
for (const name of ['solo','team','agency']) {
  await sharp(`source/pricing-scene/assets/${name}.png`).trim({threshold:10}).resize(480,400,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:88,alphaQuality:100,effort:6}).toFile(`landing/pricing-scene/${name}.webp`);
  console.log(name,(await stat(`landing/pricing-scene/${name}.webp`)).size,'bytes');
}
