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
3. **How it works** — a deep sonar band with a radar sweep behind the live index lookup.
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
