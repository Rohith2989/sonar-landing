// Twelve complete portrait poses, including every curl, ear and the neck.
// The resting pose appears at both ends, so no reverse-video blink is needed.
export const POSES = [
  { sourceTime: 0, hold: 1700 },
  { sourceTime: 1.1, hold: 180 },
  { sourceTime: 1.4, hold: 180 },
  { sourceTime: 1.7, hold: 180 },
  { sourceTime: 2.0, hold: 1100 },
  { sourceTime: 3.1, hold: 900 },
  { sourceTime: 4.3, hold: 900 },
  { sourceTime: 5.1, hold: 240 },
  { sourceTime: 5.6, hold: 240 },
  { sourceTime: 6.2, hold: 240 },
  { sourceTime: 6.9, hold: 240 },
  { sourceTime: 7.6, hold: 900 },
];
export const SEQUENCE = [...POSES.map((pose, index) => ({ index, hold: pose.hold })), { index: 0, hold: 1000 }];
export const DURATION = SEQUENCE.reduce((sum, pose) => sum + pose.hold, 0);
export function frameAt(time) {
  let position = ((time % DURATION) + DURATION) % DURATION;
  for (const frame of SEQUENCE) {
    if (position < frame.hold) return frame.index;
    position -= frame.hold;
  }
  return 0;
}
