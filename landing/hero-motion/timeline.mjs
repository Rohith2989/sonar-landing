// The pose clock controls only the camera and headphones. The woman is static.
// Adapted from HyperFrames stop-motion-cadence's shared quantized-time pattern.
export const FRAMES = [
  // pose, duration ms, camera pose, headphone pose, camera tilt, headphone tilt, flash
  [0,2050,0,0,0,0,0],
  [0,110,1,0,-3,0,0], [0,150,1,0,-4,0,0],
  [0,100,2,0,-4,0,0], [0,100,3,0,1,0,1],
  [0,100,3,0,2,0,.25], [0,120,4,0,-1,0,0],
  [0,180,5,0,0,0,0], [0,120,0,0,0,0,0],
  [0,500,0,0,0,0,0], [0,110,0,1,0,-3,0],
  [0,110,0,2,0,-10,0], [0,110,0,3,0,5,0],
  [0,110,0,3,0,8,0], [0,110,0,4,0,-4,0],
  [0,180,0,5,0,1,0], [0,800,0,0,0,0,0],
  [0,1270,0,0,0,0,0],
].map(([figure,duration,camera,headphones,cameraTilt,headphonesTilt,flash],index)=>
  Object.freeze({index,figure:0,duration,camera,headphones,cameraTilt,headphonesTilt,flash}));
export const DURATION = FRAMES.reduce((sum,frame)=>sum+frame.duration,0);
export function frameAt(elapsed) {
  let time = ((elapsed % DURATION) + DURATION) % DURATION;
  for(const frame of FRAMES){if(time < frame.duration)return frame;time-=frame.duration;}
  return FRAMES[0];
}
export function frameStart(index){return FRAMES.slice(0,index).reduce((sum,frame)=>sum+frame.duration,0);}
