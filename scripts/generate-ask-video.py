"""Generate the approved cinemagraph. Credentials remain in memory only."""
import getpass
import json
import os
from pathlib import Path
import time

from google import genai
from google.genai import types

root = Path(__file__).resolve().parents[1]
prompt = (root / 'source/ask-motion/video-prompt.txt').read_text()
key = os.environ.get('GEMINI_API_KEY') or getpass.getpass('Gemini API key (not saved): ')
client = genai.Client(api_key=key)
image = types.Image.from_file(location=str(root / 'source/ask-motion/assets/scene.png'))
operation_file = root / '.qa/ask-video-operation.json'
if operation_file.exists():
    operation = types.GenerateVideosOperation.model_validate_json(operation_file.read_text())
else:
    operation = client.models.generate_videos(
        model='veo-3.1-generate-preview',
        prompt=prompt,
        image=image,
        config=types.GenerateVideosConfig(
            last_frame=image,
            aspect_ratio='16:9',
            resolution='1080p',
            duration_seconds=8,
            number_of_videos=1,
            person_generation='allow_adult',
        ),
    )
    operation_file.write_text(operation.model_dump_json(exclude_none=True))
    print('Veo 3.1 quality generation started.', flush=True)
while not operation.done:
    time.sleep(15)
    operation = client.operations.get(operation)
    operation_file.write_text(operation.model_dump_json(exclude_none=True))
    print('Generation ready.' if operation.done else 'Rendering...', flush=True)
if operation.error:
    raise RuntimeError(str(operation.error).replace(key, '[redacted]'))
if not operation.response or not operation.response.generated_videos:
    raise RuntimeError('No video returned: ' + str(operation.response))
video = operation.response.generated_videos[0].video
client.files.download(file=video)
destination = root / 'source/ask-motion/assets/scene-veo.mp4'
video.save(str(destination))
print(f'Saved {destination}', flush=True)
