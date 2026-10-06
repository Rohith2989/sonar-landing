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

Motion is compositor-only (CSS scroll timelines), measured at 60 fps at rest and while scrolling; reduced motion gets the finished layout.

The live index lookup, the free-report form and the weekly-markets list call the Sonar backend and need it to work; on a static host they show their honest unavailable states. Photography is illustrative and generated; product screenshots are the real app with anonymous sample data.
