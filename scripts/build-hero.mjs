import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

// Export one static approved portrait.
// Pack the unchanged camera and headphone cutouts into their original atlases.
const output = 'landing/hero-motion';
await mkdir(output, { recursive: true });
const configs = {
  camera: { cols: 3, rows: 2, width: 640, height: 504,
    boxes: [[8,74,532,380],[514,74,534,380],[1018,74,518,384],[8,540,532,408],[513,540,536,388],[1018,540,518,386]] },
  headphones: { cols: 3, rows: 2, width: 640, height: 410,
    boxes: [[50,64,455,365],[559,64,453,365],[1064,64,461,365],[50,554,455,365],[559,554,453,365],[1064,554,461,365]] },
};
const manifest = { version: 6, generation: 'Static approved v4 portrait; camera and headphones retain their original animation', actors: {} };
const input='source/hero-motion/assets/figure-v4/frame-08.png';
const padded=await sharp(input).extend({top:0,left:0,right:1,bottom:0,background:'#00000000'}).png().toBuffer();
await sharp(padded).resize(768,1004,{fit:'contain',background:'#00000000'})
  .extend({top:16,bottom:16,left:16,right:16,background:'#00000000'})
  .webp({quality:92,alphaQuality:100,effort:4}).toFile(`${output}/figure-poster.webp`);
manifest.actors.figure={sources:['/landing/hero-motion/figure-poster.webp'],sourceImages:[input],static:true,cols:1,rows:1,width:800,height:1036,padding:16,framesPerSheet:1,count:1};
// A lens can extend beyond its nominal atlas cell. Isolate disconnected camera cutouts
// before packing so a neighboring forearm cannot leak into another frame's gutter.
async function isolatedCameras(input) {
  const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h}=info,labels=new Uint32Array(w*h),queue=new Int32Array(w*h),parts=[];
  let id=0;
  for(let p=0;p<w*h;p++) {
    if(labels[p]||data[p*4+3]<16)continue;
    id++;let a=0,b=1,x0=w,y0=h;queue[0]=p;labels[p]=id;
    while(a<b) {
      const q=queue[a++],x=q%w,y=Math.floor(q/w);x0=Math.min(x0,x);y0=Math.min(y0,y);
      for(const n of [x>0?q-1:-1,x<w-1?q+1:-1,y>0?q-w:-1,y<h-1?q+w:-1]) {
        if(n>=0&&!labels[n]&&data[n*4+3]>=16){labels[n]=id;queue[b++]=n;}
      }
    }
    if(b>1000)parts.push({id,x:x0,y:y0});
  }
  parts.sort((a,b)=>Math.floor(a.y/(h/2))-Math.floor(b.y/(h/2))||a.x-b.x);
  if(parts.length!==6)throw new Error(`Expected six camera cutouts, found ${parts.length}`);
  return parts.map(part=>{
    const pixels=Buffer.from(data);
    for(let p=0;p<w*h;p++)if(labels[p]!==part.id)pixels[p*4+3]=0;
    return sharp(pixels,{raw:{width:w,height:h,channels:4}});
  });
}
for (const [name, config] of Object.entries(configs)) {
  const input = `source/hero-motion/assets/${name}-poses.png`;
  const metadata = await sharp(input).metadata();
  const separated = name === 'camera' ? await isolatedCameras(input) : null;
  const cells = [];
  for (let i = 0; i < config.cols * config.rows; i++) {
    const x = i % config.cols, y = Math.floor(i / config.cols);
    const left = Math.round(x * metadata.width / config.cols);
    const top = Math.round(y * metadata.height / config.rows);
    const right = Math.round((x + 1) * metadata.width / config.cols);
    const bottom = Math.round((y + 1) * metadata.height / config.rows);
    const box = config.boxes?.[i] ?? [left, top, right-left, bottom-top];
    // Pack to equal output cells, preserving alpha and aspect ratio.
    const buffer = await (separated?.[i] ?? sharp(input)).extract({left:box[0],top:box[1],width:box[2],height:box[3]})
      .resize(config.width,config.height,{fit:'contain',background:'#00000000'})
      .png().toBuffer();
    cells.push({input:buffer,left:x*config.width,top:y*config.height});
    if (i === 0) await sharp(buffer).webp({quality:90,alphaQuality:100}).toFile(`${output}/${name}-poster.webp`);
  }
  await sharp({create:{width:config.cols*config.width,height:config.rows*config.height,channels:4,background:'#00000000'}})
    .composite(cells).webp({quality:88,alphaQuality:100,effort:6}).toFile(`${output}/${name}-atlas.webp`);
  manifest.actors[name] = {src:`/landing/hero-motion/${name}-atlas.webp`,cols:config.cols,rows:config.rows,width:config.width,height:config.height,count:cells.length};
}
await writeFile(`${output}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log('Built the static woman portrait and animated camera/headphones.');
