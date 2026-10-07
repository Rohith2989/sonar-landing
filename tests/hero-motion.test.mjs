import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {FRAMES,DURATION,frameAt,frameStart} from '../source/hero-motion/timeline.mjs';

test('the loop has a continuous resting seam and a single synchronized flash',()=>{
  assert.equal(FRAMES.length,18);
  assert.equal(DURATION,6330);
  assert.equal(frameAt(DURATION).index,0);
  assert.equal(frameAt(-1).index,FRAMES.length-1);
  assert.equal(FRAMES[0].figure,FRAMES.at(-1).figure);
  const flashes=FRAMES.filter(f=>f.flash>0);
  assert.equal(flashes.length,2);
  assert.ok(flashes.every(f=>f.figure===0&&f.camera===3));
  assert.equal(flashes.reduce((n,f)=>n+f.duration,0),200);
  for(const frame of FRAMES){
    assert.equal(frameAt(frameStart(frame.index)).index,frame.index);
    assert.equal(frameAt(frameStart(frame.index)+frame.duration-1).index,frame.index);
  }
});
test('every requested pose exists in a transparent deployed image',async()=>{
  const manifest=JSON.parse(await readFile('landing/hero-motion/manifest.json','utf8'));
  let total=0;
  assert.equal(manifest.actors.figure.sources.length,1);
  assert.equal(manifest.actors.figure.framesPerSheet,1);
  assert.equal(new Set(FRAMES.map(frame=>frame.figure)).size,1);
  for(const [name,actor] of Object.entries(manifest.actors)){
    const sources=actor.sources ?? [actor.src];
    assert.equal(sources.length*actor.cols*actor.rows,actor.count);
    for(const source of sources){
      const buffer=await readFile(`.${source}`);total+=buffer.length;
      const metadata=await sharp(buffer).metadata();
      assert.ok(metadata.hasAlpha);
      assert.equal(metadata.width,actor.cols*actor.width);
      assert.equal(metadata.height,actor.rows*actor.height);
    }
    for(const frame of FRAMES)assert.ok(frame[name]>=0&&frame[name]<actor.count);
  }
  assert.ok(total<4_000_000,`Hero assets exceed 4 MB: ${total}`);
});
test('both deployed entry points load exactly one copy of the source-built hero module',async()=>{
  for(const file of ['index.html','prerendered/index.html']){
    const html=await readFile(file,'utf8');
    assert.equal(html.split('src="/landing/hero-motion/hero-motion.mjs"').length-1,1);
  }
  for(const file of ['hero-motion.mjs','hero-motion.css','timeline.mjs']){
    assert.equal(await readFile(`source/hero-motion/${file}`,'utf8'),await readFile(`landing/hero-motion/${file}`,'utf8'));
  }
});
