# Sonar — landing page

The redesigned public landing page for 8X Sonar, the social-listening index of TikTok and Instagram.

**Live:** https://sonar-landing-tau.vercel.app

## What's here

| Path | What |
|---|---|
| `/` (root) | The built, prerendered static site, deployable as-is (`vercel.json` routes the public pages). |
| `landing/` | The page's media: the Veo 3.1 sea-glass sky loop (AV1 + H.264, landscape and portrait), the keyed hero cut-outs, persona photography, the closing sky, the grain tile. |
| `source/src/` | The landing's source: `pages/Landing.tsx`, `styles/landing.css`, `components/ProductScreenshot.tsx` (React + Tailwind, from the Sonar frontend). |
| `preview-data/pricing.json` | The plan catalogue as the backend serves it before Stripe is configured, so the preview's pricing section renders real list prices. |

## The page

1. **Hero** — a pinned stage of depth layers over a living painted sky: sonar rings, a two-tone headline, the woman holding *The Sonar Report*, hands with a camera and headphones reaching in from the edges. Scrolling parts the layers while the dashboard rises over them in a browser window.
2. **The index** — real index numbers only (dated, aggregate), and the niche directory drifting past.
3. **Ask Sonar** — a compact photographic phone-and-lens film beside the live index lookup, with a gentle sea-glass cloud drift.
4. **One index, four ways in** — S-01 to S-04 sheets that stack as you scroll.
5. **Built around the person doing the work** — photo cards that bloom from black and white into colour.
6. **Pricing**, then the free-report close over a second painted sky.

Scroll motion uses compositor-only CSS scroll timelines; the hero's pose animation
uses a shared stepped canvas clock. Reduced motion gets the finished layout.

The live index lookup, the free-report form and the weekly-markets list call the Sonar backend and need it to work; on a static host they show their honest unavailable states. Photography is illustrative and generated; product screenshots are the real app with anonymous sample data.

## Hero motion

The woman and newspaper are static, using the approved clear v4 reading pose.
`source/hero-motion/hero-motion.mjs` sets the existing image to
`landing/hero-motion/figure-poster.webp`; it never creates an animated canvas
for her or loads any other woman frames. Her entrance animation and cursor
parallax are disabled. The existing scroll layout is preserved.

Only the camera and headphones use the shared 6.33-second, 18-step clock.
Their original assets and timing remain intact, including the shutter flash.
The static portrait source is `assets/figure-v4/frame-08.png`. Earlier frame
sets and generation prompts remain in `source/hero-motion/` for reference.

```sh
npm ci
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`. The local server mirrors the Vercel public-page and
pricing rewrites. `npm run build` copies the editable hero module/CSS/timeline
and wires both static entry points. It does not rebuild the original React app;
the other app sources and its full build configuration still live upstream.
Run `npm run build:hero` only after changing the source pose images, then run
`npm run build`. `npm test` checks timing, synchronized shutter flash, loop
boundaries, atlas validity/size, and deployed source parity.

For deterministic visual review, use `/?hero-frame=0` through `/?hero-frame=17`.
These URLs pause at that step; the visible play control resumes the loop.
Ordinary page loads autoplay. The sequence pauses off screen or in a hidden tab,
respects reduced-motion preferences, and retains the original accessible images
if the animation assets fail to load. The control pauses the camera/headphone sequence;
the existing sky animation is independent.

## Niche scroller

`source/marquee-speed.mjs` measures each duplicated row so it drifts at 20px/s
(16px/s in the reverse row), regardless of label count, font loading or viewport
width. Hover still pauses it, and reduced-motion preferences keep it static.
The build copies the module and CSS override into `landing/` and loads them in
both static entry points. The matching CSS fallback also lives in
`source/src/styles/landing.css` for the upstream React build.

## Ask Sonar scene

The approved “Go beyond the scroll” composition uses two photographic female hands,
a phone showing a skincare creator, and a real optical magnifier inspecting her
serum bottle. The 8-second master is a fresh Gemini `veo-3.1-generate-preview`
quality generation at 1920×1080, 24fps. All 192 video frames are retained.
The two rear clips stay subtle; cloud motion is a separate 42-second CSS drift.

`source/ask-motion/assets/closer-feed-focus.png` is the matching first/last
reference, made with built-in ImageGen. The initial plate and edit prompts are
`closer-feed-image-prompt.txt` and `closer-feed-focus-image-prompt.txt`. The final
video prompt is `closer-feed-video-v2-prompt.txt`, and the approved section and
storyboard are under `source/ask-motion/previews/closer-feed-*`.

`npm run build:ask-video` keys the source master offline and creates transparent
VP9 WebM and HEVC MOV, plus an exact first-frame WebP fallback. It requires Python
`imageio-ffmpeg`, Sharp, and macOS/Xcode command-line tools for HEVC alpha encoding.
Built media is committed, so normal builds need only Node. `npm run build` copies
the modules and wires both static entry points. The upstream reference JSX is
updated too; the live React lookup nodes, validation and API contract are preserved.

The film loads only when visible and pauses off screen or in a hidden tab.
The visible control pauses both film and clouds. Reduced motion displays the
matching still without requesting video. A decoded-alpha probe rejects formats
that would expose an opaque rectangle, tries the other codec, then retains the
still if neither works. Resize observation keeps mobile artwork below expanding
lookup results. Media requests support byte ranges in the local preview server.

Review URLs:
- `/#how` — approved phone-and-lens film.
- `/?ask-time=6#how` — pause at a specific video time.
- `/?ask-motion=portrait#how` — prior smooth portrait video backup.
- `/?ask-motion=poses#how` — original twelve-pose backup.

The backup media loads only when explicitly selected. `npm run build:ask` still
rebuilds the twelve poses; `npm run build:ask-video -- --name portrait-fluid`
rebuilds the prior smooth portrait. The local `codex/ask-12-frame-backup` branch
preserves the earlier complete implementation.

Tests cover deployed parity, video/atlas lifecycle, codec fallback, reduced
motion, autoplay failure and the hero timeline. Actual browser recordings and
video validation are saved locally under `.qa/` (gitignored).

Fresh regeneration is explicit and separate from the build:

```sh
python3 scripts/generate-ask-video.py \
  --input source/ask-motion/assets/closer-feed-focus.png \
  --prompt source/ask-motion/closer-feed-video-v2-prompt.txt \
  --output source/ask-motion/assets/closer-feed-veo.mp4
```

The script requires `google-genai` and reads `GEMINI_API_KEY` from the environment
or a hidden prompt. It never saves the key, and no API credentials ship to the browser.
A saved operation in `.qa/` resumes the existing render; use a fresh `--operation`
path to request a new render deliberately.
