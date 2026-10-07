"""Key the new Veo film and encode transparent web delivery without dropping frames."""
import argparse
import json
from pathlib import Path
import subprocess
import imageio_ffmpeg

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--name', choices=['closer-feed', 'portrait-fluid'], default='closer-feed')
args = parser.parse_args()
name = args.name
source = root / f'source/ask-motion/assets/{name}-veo.mp4'
out = root / 'landing/ask-motion'
qa = root / f'.qa/{name}-video'
out.mkdir(parents=True, exist_ok=True)
qa.mkdir(parents=True, exist_ok=True)
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
key = 'chromakey=0x00ff00:0.18:0.06,despill=type=green:mix=0.5:expand=0.1'

def run(args):
    subprocess.run(args, check=True)

# Keep the 24 fps temporal detail returned by Veo. Chroma is removed offline,
# so the browser decodes a real alpha video instead of keying it on every frame.
run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source), '-an',
     '-vf', key + ',format=yuva420p', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '24',
     '-deadline', 'good', '-cpu-used', '2', '-row-mt', '1', '-auto-alt-ref', '0',
     '-metadata:s:v:0', 'alpha_mode=1', str(out / f'{name}.webm')])
print('Encoded transparent VP9 film.', flush=True)
# ProRes is an intermediate only, never shipped to the page.
run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source), '-an',
     '-vf', key + ',format=yuva444p10le', '-c:v', 'prores_ks', '-profile:v', '4',
     '-alpha_bits', '16', str(qa / 'portrait-alpha-master.mov')])
run(['xcrun', 'swiftc', str(root / 'scripts/encode-ask-hevc.swift'), '-o', str(qa / 'encode-hevc')])
run([str(qa / 'encode-hevc'), str(qa / 'portrait-alpha-master.mov'), str(out / f'{name}-hevc.mov')])
# Exact first frame provides a matching reduced-motion/loading fallback.
run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
     '-vf', key + ',format=rgba', '-frames:v', '1', str(qa / 'rest.png')])
run(['node', '--input-type=module', '-e',
     "import sharp from 'sharp'; await sharp(process.argv[1]).webp({quality:93,alphaQuality:100,effort:6}).toFile(process.argv[2]);",
     str(qa / 'rest.png'), str(out / f'{name}-rest.webp')])
manifest = {
    'version': 3, 'model': 'veo-3.1-generate-preview', 'resolution': '1920x1080',
    'fps': 24, 'duration': 8, 'frames': 192, 'audio': False,
    'source': f'source/ask-motion/assets/{name}-veo.mp4',
    'prompt': 'source/ask-motion/closer-feed-video-v2-prompt.txt' if name == 'closer-feed' else 'source/ask-motion/transparent-video-prompt.txt',
    'delivery': [
        {'src': f'{name}.webm', 'codec': 'VP9 with alpha'},
        {'src': f'{name}-hevc.mov', 'codec': 'HEVC with alpha'},
    ],
    'backup': '?ask-motion=poses#how',
}
(out / ('closer-feed-manifest.json' if name == 'closer-feed' else 'video-manifest.json')).write_text(json.dumps(manifest, indent=2) + '\n')
print('Built complete 24 fps transparent video and matching still.', flush=True)
