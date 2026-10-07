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
3. **Ask Sonar** — a photographic campaign director over a sea-glass sky, with subtle facial movement and drifting clouds behind the existing live index lookup.
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

The approved artwork is in `source/ask-motion/assets/scene.png`. It was refined
with the built-in image generation tool using `source/ask-motion/image-prompt.txt`.
The eight-second 1080p master, `scene-veo.mp4`, was generated with the quality
`veo-3.1-generate-preview` model using the same first and last image and the prompt
in `source/ask-motion/video-prompt.txt`. The generated scene is illustrative.

The shipped silent H.264 loop is `landing/ask-motion/scene-loop.mp4`, with a
182KB WebP poster. An SVG mask confines the live video to the face and distant
clouds; the paper, other faces, phone, hands and magnifying glass remain the
approved still. The lookup is the original React form, with its existing API
contract, validation and unavailable state. No API keys ship to the browser.

The section loads video only when it enters the viewport and pauses when it
leaves the viewport or the document is hidden. The visible motion control pauses
both facial and cloud motion. Reduced motion uses the still poster without a
video request. A failed video also keeps the poster. `?ask-time=3#how` provides a
paused frame for visual review. The mobile layout places the headline above a
closer portrait crop.

`npm run build` copies the module/CSS/mask and includes the artwork and heading
in both prerendered entry points. Its observer also enhances the live tree
created by the existing bundle. The React source contains the matching layout
and imports for an eventual upstream build; this static repo still cannot
compile the full app. The module adds its own decorative nodes without moving
or replacing React's form or result nodes.

To re-encode the approved video, run `python3 scripts/build-ask-media.py`
(requires `imageio-ffmpeg`). Regeneration is an explicit separate action:
`python3 scripts/generate-ask-video.py` requires `google-genai` and reads
`GEMINI_API_KEY` from the environment or a hidden prompt, never from source.
