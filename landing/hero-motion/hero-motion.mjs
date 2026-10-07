import { FRAMES, DURATION, frameAt, frameStart } from './timeline.mjs';

const ACTORS = {
  camera: { selector: '.lp-hand-l .lp-actor', cols: 3, width: 640, height: 504, framesPerSheet: 6, sources: ['camera-atlas.webp'] },
  headphones: { selector: '.lp-hand-r .lp-actor', cols: 3, width: 640, height: 410, framesPerSheet: 6, sources: ['headphones-atlas.webp'] },
};
const STYLE_ID = 'sonar-hero-motion-style';
const instances = new Map();
let imagesPromise;

function loadImages() {
  return imagesPromise ??= Promise.all(Object.keys(ACTORS).map(async name => {
    const sheets = await Promise.all(ACTORS[name].sources.map(async source => {
      const image = new Image();
      image.src = new URL(`./${source}`, import.meta.url).href;
      await image.decode();
      return image;
    }));
    return [name, sheets];
  })).then(entries => Object.fromEntries(entries)).catch(error => {
    imagesPromise = undefined;
    throw error;
  });
}

function mount(stage) {
  // The approved woman/newspaper is a single static image, outside the pose clock.
  const figure=stage.querySelector('.lp-figure .lp-actor-rest');
  if(figure){
    figure.src=new URL('./figure-poster.webp',import.meta.url).href;
    figure.width=800;figure.height=1036;
  }
  const nodes = Object.fromEntries(Object.entries(ACTORS).map(([name, config])=>[name, stage.querySelector(config.selector)]));
  if (Object.values(nodes).some(node=>!node)) return null;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionQuery.matches, paused = false, visible = false, ready = false, destroyed = false;
  let elapsed = 0, previousTime = null, raf = 0, lastFrame = -1, images;
  const canvases = {};
  for(const [name, node] of Object.entries(nodes)) {
    const canvas = document.createElement('canvas');
    canvas.width = ACTORS[name].width;
    canvas.height = ACTORS[name].height;
    canvas.className = 'lp-stop-motion';
    canvas.setAttribute('aria-hidden','true');
    canvas.dataset.actor = name;
    node.append(canvas);
    canvases[name] = canvas;
  }
  const flash = document.createElement('span');
  flash.className = 'lp-shutter-flash';
  flash.setAttribute('aria-hidden','true');
  nodes.camera.append(flash);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'lp-motion-control';
  button.hidden = true;
  stage.append(button);
  const query = new URLSearchParams(location.search);
  const requestedFrame = query.get('hero-frame');
  const proofFrame = requestedFrame !== null && /^\d+$/.test(requestedFrame) ? Math.min(FRAMES.length-1,Number(requestedFrame)) : null;
  if(proofFrame !== null){paused=true;elapsed=frameStart(proofFrame);}

  function draw(frame) {
    if(!ready || frame.index === lastFrame)return;
    lastFrame = frame.index;
    for(const [name, canvas] of Object.entries(canvases)) {
      const {cols,width,height,framesPerSheet} = ACTORS[name];
      const sheet = Math.floor(frame[name]/framesPerSheet);
      const pose = frame[name]%framesPerSheet;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,width,height);
      ctx.drawImage(images[name][sheet],(pose%cols)*width,Math.floor(pose/cols)*height,width,height,0,0,width,height);
    }
    // Transform inner actors only: pointer parallax and scroll choreography retain their layers.
    canvases.camera.style.transform = `rotate(${frame.cameraTilt}deg)`;
    canvases.headphones.style.transform = `rotate(${frame.headphonesTilt}deg)`;
    flash.style.opacity = String(frame.flash);
    flash.style.transform = `translate(-50%, -50%) scale(${frame.flash ? 1 : .5})`;
    stage.dataset.motionFrame = String(frame.index);
  }
  function stop(){cancelAnimationFrame(raf);raf=0;previousTime=null;}
  function tick(time) {
    raf=0;
    if(!canPlay())return;
    if(previousTime!==null)elapsed=(elapsed+Math.min(time-previousTime,100))%DURATION;
    previousTime=time;
    draw(frameAt(elapsed));
    raf=requestAnimationFrame(tick);
  }
  function canPlay(){return ready && !destroyed && !reduced && !paused && visible && !document.hidden;}
  function sync() {
    stop();
    stage.dataset.motionState = reduced ? 'reduced' : !ready ? 'loading' : paused ? 'paused' : !visible || document.hidden ? 'offscreen' : 'playing';
    button.textContent = paused ? 'Play animation' : 'Pause animation';
    button.setAttribute('aria-label',paused?'Play hero animation':'Pause hero animation');
    button.hidden = reduced || !ready;
    for(const node of Object.values(nodes))node.classList.toggle('lp-motion-ready',ready&&!reduced);
    if(reduced)flash.style.opacity='0';
    else if(ready){lastFrame=-1;draw(frameAt(elapsed));}
    if(canPlay())raf=requestAnimationFrame(tick);
  }
  async function prepare() {
    if(ready || reduced || destroyed)return;
    try {
      images=await loadImages();
      if(destroyed)return;
      ready=true;sync();
    } catch {
      // A failed download keeps the original accessible photographs and no empty canvas.
      stage.dataset.motionState='unavailable';
      button.hidden=true;
    }
  }
  function onPreference(){reduced=motionQuery.matches;sync();if(!reduced)void prepare();}
  function onToggle(){paused=!paused;sync();}
  button.addEventListener('click',onToggle);
  motionQuery.addEventListener('change',onPreference);
  document.addEventListener('visibilitychange',sync);
  const observer = new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;sync();if(visible)void prepare();
  },{threshold:0});
  observer.observe(stage);
  sync();
  return () => {
    destroyed=true;stop();observer.disconnect();
    motionQuery.removeEventListener('change',onPreference);
    document.removeEventListener('visibilitychange',sync);
    button.removeEventListener('click',onToggle);
    button.remove();flash.remove();
    for(const canvas of Object.values(canvases))canvas.remove();
    for(const node of Object.values(nodes))node.classList.remove('lp-motion-ready');
  };
}

function scan() {
  for(const [stage,dispose] of instances)if(!stage.isConnected){dispose();instances.delete(stage);}
  for(const stage of document.querySelectorAll('.lp-hero .lp-stage')){
    if(instances.has(stage))continue;
    const dispose=mount(stage);if(dispose)instances.set(stage,dispose);
  }
}

export function startHeroMotion() {
  if(document.getElementById(STYLE_ID))return;
  const link=document.createElement('link');
  link.id=STYLE_ID;link.rel='stylesheet';link.href=new URL('./hero-motion.css',import.meta.url).href;
  document.head.append(link);
  // React creates the live tree from the shipped bundle. The observer handles that first commit,
  // subsequent navigation, and disposal; it never replaces React-owned nodes or their text.
  let queued=false;
  const observer=new MutationObserver(records=>{
    if(!records.some(record=>record.addedNodes.length||record.removedNodes.length)||queued)return;
    queued=true;queueMicrotask(()=>{queued=false;scan();});
  });
  observer.observe(document.getElementById('root')??document.body,{childList:true,subtree:true});
  scan();
}

if(typeof document!=='undefined')startHeroMotion();
