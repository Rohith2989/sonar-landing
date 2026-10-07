"""Encode the approved master for the web; never regenerate as part of a build."""
from pathlib import Path
import subprocess
import imageio_ffmpeg

root = Path(__file__).resolve().parents[1]
subprocess.run([
    imageio_ffmpeg.get_ffmpeg_exe(), '-y',
    '-i', str(root / 'source/ask-motion/assets/scene-veo.mp4'),
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    str(root / 'landing/ask-motion/scene-loop.mp4'),
], check=True)
