/** The public landing (MAT-191 refresh, redesigned 2026-10-06).
 *
 * Two pinned references fused: Orelloo's editorial composition (giant two-tone grotesk headline,
 * a cut-out figure holding the report up like a broadsheet, hands reaching in from the edges,
 * numbered S-01..S-04 colour bands) inside DUNA's painterly sky, repainted in the workspace's
 * sea-glass palette. The motion lives in styles/landing.css (scroll timelines, compositor-only).
 *
 * Signup, lazy runtime pricing, visitor lookup and lead submission keep their existing public
 * contracts. No API calls during prerender or initial smoke.
 */
import { Fragment, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { PromptDemo } from "@/components/daylight/PromptDemo";
import { ProductScreenshot } from "@/components/ProductScreenshot";
import { PublicPricing } from "@/components/PublicPricing";
import { InstagramGlyph, TikTokGlyph } from "@/components/daylight/assets";
import { Turnstile, isTurnstileEnabled, type TurnstileHandle } from "@/components/Turnstile";
import { PublicPage } from "./Niches";
import { DIRECTORY, fmt, niceDate } from "@/lib/niche-directory";
import { ActiveMarkets } from "@/components/ActiveMarkets";
import "../../ask-motion/ask-motion.css";
import "../../ask-motion/ask-motion.mjs";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** A heading set word by word; each word rises in turn as the heading scrolls in. */
function Words({ text, offset = 0 }: { text: string; offset?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="w" style={{ "--w": i + offset } as Vars}>{w}</span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </>
  );
}

/** One index figure, the same everywhere on the page: the snapshot reads as a floor ("961K+");
 *  once the visitor's own lookup has read the live total, every surface adopts that one value. */
function indexTotal(liveTotal: number | null) {
  const live = liveTotal !== null && liveTotal > 0;
  return { live, label: live ? fmt(liveTotal) : `${fmt(DIRECTORY.total_videos)}+` };
}

/* ── drawn glyphs (one stroke family) ─────────────────────────────────── */

function CapIcon({ name }: { name: "ground" | "cite" | "link" }) {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === "ground" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.9" />
          <path d="M8 9h8M8 13h8M8 17h4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </>
      )}
      {name === "cite" && (
        <path d="M9.5 4 7.5 20M16.5 4l-2 16M4.5 9.5h16M3.5 14.5h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      )}
      {name === "link" && (
        <>
          <path d="M10.5 13.5a4.2 4.2 0 0 0 6 0l2.8-2.8a4.24 4.24 0 0 0-6-6L11.8 6.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M13.5 10.5a4.2 4.2 0 0 0-6 0l-2.8 2.8a4.24 4.24 0 0 0 6 6l1.5-1.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function PillarIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === "discover" && (
        <>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {name === "ask" && (
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5v-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      )}
      {name === "track" && (
        <path d="M3 13h4l2.5-6 4 11 2.5-5H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {name === "report" && (
        <>
          <path d="M6 3.5h8l4 4v13H6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function Check() {
  return (
    <span className="lp-check" aria-hidden="true">
      <svg width={10} height={10} viewBox="0 0 14 14" fill="none">
        <path d="M2.5 7.5 5.6 10.5 11.5 3.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/* ── 1. hero ─────────────────────────────────────────────────────────────
   The film is written as raw HTML: React does not render the `muted` attribute on the server,
   and a prerendered autoplay video without it never starts. Sources are matched by aspect and
   only under no-preference for reduced motion, so a reduced-motion visitor loads no video. */

const SKY_VIDEO = `<video autoplay muted loop playsinline preload="auto" poster="/landing/sea-poster.webp" aria-hidden="true" tabindex="-1">
  <source src="/landing/sea-phone.av1.mp4" type='video/mp4; codecs="av01.0.08M.10"' media="(max-aspect-ratio: 9/16) and (prefers-reduced-motion: no-preference)">
  <source src="/landing/sea-phone.h264.mp4" type="video/mp4" media="(max-aspect-ratio: 9/16) and (prefers-reduced-motion: no-preference)">
  <source src="/landing/sea-1440.av1.mp4" type='video/mp4; codecs="av01.0.08M.10"' media="(prefers-reduced-motion: no-preference)">
  <source src="/landing/sea-1080.h264.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)">
</video>`;

function SkyFilm() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const video = host.current?.querySelector("video");
    if (!video) return;
    const shown = () => video.classList.add("is-playing");
    if (!video.paused && video.readyState > 2) shown();
    video.addEventListener("playing", shown);
    // Off screen, the film stops spending frames. On screen, a watchdog resumes it: some browsers
    // pause a muted loop on resize or a tab switch and never start it again.
    let inView = true;
    const io = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([e]) => {
          inView = e.isIntersecting;
          if (inView) void video.play().catch(() => {});
          else video.pause();
        })
      : null;
    io?.observe(video);
    const resume = () => window.setTimeout(() => {
      if (inView && video.paused && document.visibilityState === "visible") void video.play().catch(() => {});
    }, 400);
    video.addEventListener("pause", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      video.removeEventListener("playing", shown);
      video.removeEventListener("pause", resume);
      document.removeEventListener("visibilitychange", resume);
      io?.disconnect();
    };
  }, []);
  return (
    <div className="lp-layer lp-skywrap" data-scroll="sky" style={{ inset: 0 }}>
      <div className="lp-sky" ref={host}>
        <img src="/landing/sea-poster.webp" alt="" fetchPriority="high" />
        <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: SKY_VIDEO }} />
      </div>
    </div>
  );
}

/** Pointer parallax: one rAF-throttled listener writes --mx/--my in [-1, 1]; fine pointers only. */
function usePointerDepth(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window.matchMedia !== "function") return;
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 900px)").matches) return;
    el.setAttribute("data-pointer", "");
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        el.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    return () => { el.removeEventListener("pointermove", onMove); cancelAnimationFrame(frame); };
  }, [ref]);
}

/* ── the actors ─────────────────────────────────────────────────────────────
   Each performer is a keyed still (the hand with the camera, the woman with the report, the hand
   with the headphones), sized from its own box so the layers below can place it. */

const ACTORS: Record<string, [number, number]> = {
  figure: [1042, 1312],
  camera: [784, 618],
  headphones: [784, 452],
};

function Actor({ name, alt = "", priority = false }: { name: string; alt?: string; priority?: boolean }) {
  const [w, h] = ACTORS[name];
  return (
    <div className="lp-actor">
      <img className="lp-actor-rest" src={`/landing/${name}-rest.webp`} width={w} height={h}
        alt={alt} fetchPriority={priority ? "high" : "auto"} decoding="async" />
    </div>
  );
}

function Hero({ liveTotal }: { liveTotal: number | null }) {
  const stage = useRef<HTMLDivElement>(null);
  usePointerDepth(stage);
  const total = indexTotal(liveTotal);
  return (
    <section className="lp-hero" aria-label="Sonar">
      <div className="lp-stage" ref={stage}>
        <SkyFilm />
        <div className="lp-wash" aria-hidden="true" />
        <div className="lp-layer lp-rings" data-scroll="rings" aria-hidden="true">
          <span /><span /><span /><span />
        </div>

        <div className="lp-layer lp-copy" data-scroll="copy">
          <div className="lp-badge" style={{ animation: "lp-fade-up 1s var(--lp-ease) both" }}>
            <span className="lp-badge-glyphs"><TikTokGlyph size={12} /><InstagramGlyph size={12} /></span>
            <span className="lp-badge-live" aria-hidden="true" />
            Watching TikTok + Instagram, continuously
          </div>
          <h1 className="lp-display lp-h1">
            <span className="lp-h1-line">
              <span className="lp-h1-fade" style={{ "--d": "120ms" } as Vars}>Your market talks on camera.</span>
            </span>{" "}
            <span className="lp-h1-line">
              <span style={{ "--d": "260ms" } as Vars}>Sonar <span className="lp-h1-accent">listens.</span></span>
            </span>
          </h1>
        </div>

        <div className="lp-layer lp-figure" data-scroll="figure">
          <Actor name="figure" priority
            alt="A woman holding up a broadsheet titled The Sonar Report: the competitors in your niche, the creators posting for them, the clips that broke out" />
        </div>

        <div className="lp-layer lp-hand lp-hand-l" data-scroll="hand-l" aria-hidden="true">
          <Actor name="camera" />
        </div>
        <div className="lp-layer lp-hand lp-hand-r" data-scroll="hand-r" aria-hidden="true">
          <Actor name="headphones" />
        </div>

        <div className="lp-layer lp-side lp-side-l" data-scroll="side">
          <div style={{ "--d": "1000ms" } as Vars}>
            <div className="lp-fact">
              <span className="lp-display" style={{ fontSize: 40, lineHeight: 1 }}>{total.label}</span>
              <span className="text-[13px] text-[color:var(--lp-ink-3)]">videos indexed</span>
              <span className="mt-2 text-[13px] text-[color:var(--lp-ink-2)]">
                <b className="font-semibold text-[color:var(--lp-ink)]">{DIRECTORY.niches.length}</b> niches mapped
              </span>
            </div>
            <p className="mt-5 text-[14px]">
              Ready to use Sonar?{" "}
              <a href="/signup" data-testid="hero-signup-link"
                className="dl-focus font-semibold text-[color:var(--lp-teal)] underline decoration-[rgba(23,94,99,.35)] underline-offset-[3px] hover:decoration-[color:var(--lp-teal)]">
                Create an account
              </a>
              <span aria-hidden="true" className="mx-2">·</span>
              <a href="#pricing" data-testid="hero-pricing-link"
                className="dl-focus font-semibold text-[color:var(--lp-teal)] underline decoration-[rgba(23,94,99,.35)] underline-offset-[3px] hover:decoration-[color:var(--lp-teal)]">
                View pricing
              </a>
            </p>
          </div>
        </div>

        <div className="lp-layer lp-side lp-side-r" data-scroll="side">
          <div style={{ "--d": "900ms" } as Vars}>
            <p>
              Sonar keeps a standing index of TikTok and Instagram, organized by niche — the brands
              in your market, the creators posting about them, and the clips that broke out. Ask it a
              question and the answer comes cited.
            </p>
            <div className="lp-ctas mt-5 flex flex-wrap gap-2.5">
              <a href="#free-report" data-testid="free-report-cta" className="lp-btn lp-btn-ink dl-focus">
                <span className="lp-btn-dot" aria-hidden="true" />
                Get a free social listening report
              </a>
              <a href="#how" data-testid="see-how-link" className="lp-btn lp-btn-glass dl-focus">See how it works</a>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-sheet">
        <div className="mx-auto max-w-[1240px]" data-lp="tilt">
          <ProductScreenshot view="dashboard" priority />
        </div>
      </div>
    </section>
  );
}

/* ── 2. proof — the index's real numbers, nothing else ───────────────────────
   No customer logos exist and none are invented (spec §5). The counts come from the committed
   directory snapshot: aggregate ONLY, never brand names on a public page. Dated, so the numbers
   never imply they are live.

   Incident 2026-08-23: this band printed the snapshot's "961K videos indexed" while the hero card
   reported its LIVE "1.2M-video index". Two fixes, both kept: the snapshot renders as the floor it
   is ("961K+"), and when the visitor's own lookup returns, the band adopts that one live value. */

function ProofStrip({ liveTotal }: { liveTotal: number | null }) {
  const { live, label } = indexTotal(liveTotal);
  return (
    <section aria-label="Index coverage" className="lp-proof">
      <div className="lp-proof-grid">
        <div data-lp="rise">
          <span className="lp-eyebrow">The index</span>
          <p className="lp-big mt-6">
            {label.replace(/\+$/, "")}
            {label.endsWith("+") ? <sup>+</sup> : null}
          </p>
          <p className="mt-3 text-[15px] text-[color:var(--lp-ink-2)]">videos indexed</p>
        </div>
        <div data-lp="rise" style={{ "--r": 6 } as Vars}>
          <p className="lp-statement">A standing index of TikTok and Instagram, organized by niche.</p>
          <div className="lp-facts">
            <span>
              <span className="lp-display text-[30px]">{DIRECTORY.niches.length}</span>
              <span className="text-[13.5px] text-[color:var(--lp-ink-3)]">niches mapped</span>
            </span>
            <span>
              <span className="lp-display text-[30px]">2</span>
              <span className="text-[13.5px] text-[color:var(--lp-ink-3)]">platforms — TikTok + Instagram</span>
            </span>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="lp-mono text-[12px] text-[color:var(--lp-ink-3)]" data-testid="coverage-basis">
              {live
                ? `videos live from the index · directory as of ${niceDate(DIRECTORY.generated_on)}`
                : `counts as of ${niceDate(DIRECTORY.generated_on)}`}
            </span>
            <a href="/competitor-tracking" className="lp-card-cta dl-focus" style={{ color: "var(--lp-ink)" }}>
              Browse the niche directory
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The niches themselves, drifting past: the directory's own labels, in two opposed rows. */
function NicheMarquee() {
  const labels = DIRECTORY.niches.map((n) => n.label);
  const half = Math.ceil(labels.length / 2);
  const rows = [labels.slice(0, half), labels.slice(half)];
  return (
    <div className="lp-marquee" aria-hidden="true">
      {rows.map((row, r) => (
        <div key={r} className={`lp-marquee-row${r ? " rev" : ""}`}>
          {[...row, ...row].map((l, i) => <span key={i}>{l}</span>)}
        </div>
      ))}
    </div>
  );
}

/* ── 3. the deep band — the agent, shown working (#how) ─────────────────── */

const CAPABILITIES: Array<{ icon: "ground" | "cite" | "link"; lead: string; rest: string }> = [
  { icon: "ground", lead: "Grounded answers", rest: "every claim comes from indexed videos, not a model's recollection." },
  { icon: "cite", lead: "Every number cited", rest: "counts trace to the exact clips behind them." },
  { icon: "link", lead: "Every video linked", rest: "one click from the answer to the source." },
];

function Spotlight({ onIndexTotal }: { onIndexTotal: (total: number) => void }) {
  return (
    <section id="how" className="lp-deep lp-ask scroll-mt-24">
      <div className="lp-ask-scene" aria-hidden="true">
        <div className="lp-ask-frame">
          <img className="lp-ask-poster" src="/landing/ask-motion/scene-poster.webp" width={1672} height={941} loading="lazy" decoding="async" alt="" />
          <div className="lp-ask-layers">
            <img className="lp-ask-clouds" src="/landing/ask-motion/cloud-background.webp" width="1672" height="941" loading="lazy" alt="" />
            <img className="lp-ask-portrait-rest" src="/landing/ask-motion/portrait-rest.webp" width="1280" height="720" loading="lazy" alt="" />
            <canvas className="lp-ask-portrait" width="1280" height="720" />
            <img className="lp-ask-props" src="/landing/ask-motion/foreground-props.webp" width="1672" height="941" loading="lazy" alt="" />
          </div>
        </div>
      </div>
      <div className="lp-deep-inner">
        <div>
          <header className="lp-ask-copy">
            <span className="lp-ask-eyebrow"><span />Ask Sonar</span>
            <h2>Good ideas.<br /><em>Real evidence.</em></h2>
            <p>Ask about your market.<br />See the work behind the answer.</p>
          </header>
          <ul className="mt-10">
            {CAPABILITIES.map((c, i) => (
              <li key={c.lead} className="lp-cap-row" data-lp="read">
                <span className="lp-cap-num">0{i + 1}</span>
                <span>
                  <strong><span className="lp-cap-icon mr-2 inline-block align-[-3px]"><CapIcon name={c.icon} /></span>{c.lead}</strong>
                  <span className="rest">{c.rest}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lp-console" data-lp="rise" style={{ "--r": 8 } as Vars}>
          <h3>Try a lookup in the index</h3>
          <PromptDemo onIndexTotal={onIndexTotal} interactiveOnly />
          <p className="lp-console-note">Enter your niche or brand. Results load when you submit.</p>
        </div>
      </div>
      <div className="lp-markets"><ActiveMarkets /></div>
    </section>
  );
}

/* ── 4. the four pillars (#product) — S-01..S-04, stacked colour sheets ───── */

const PILLARS: Array<{
  key: string;
  name: string;
  benefit: string;
  bullets: string[];
  view: "creators" | "ask" | "dashboard" | "reports";
  tone: "cream" | "mint" | "lime" | "ink";
}> = [
  {
    key: "discover",
    name: "Discover",
    benefit: "Search the index like it's yours",
    bullets: [
      "Index-wide search across videos, brands, and creators, scoped to your niche.",
      "Breakouts ranked by how far a clip beat the average of its creator's other videos — not raw views.",
      "Filter to UGC, brand-owned posts, or organic mentions.",
    ],
    view: "creators",
    tone: "cream",
  },
  {
    key: "ask",
    name: "Ask",
    benefit: "Plain questions, cited answers",
    bullets: [
      "The agent reads your niche's indexed coverage, not the open web.",
      "Every number traces to the clips behind it; every clip is one click away.",
      "Follow-up questions keep the same measured scope.",
    ],
    view: "ask",
    tone: "mint",
  },
  {
    key: "track",
    name: "Track",
    benefit: "Know the moment something moves",
    bullets: [
      "Watchlists for the brands and creators you care about.",
      "Movers surface when views jump past an account's normal range.",
      "A weekly digest gathers the movement for your inbox.",
    ],
    view: "dashboard",
    tone: "lime",
  },
  {
    key: "report",
    name: "Report",
    benefit: "From a question to a shareable report",
    bullets: [
      "Briefs and analyses assembled from the same indexed coverage.",
      "Edit, extend, and republish in place as the market shifts.",
      "Share a link — everyone reads the same numbers.",
    ],
    view: "reports",
    tone: "ink",
  },
];

/** The card's natural (unstuck) top in the page, which a stuck card's own rect cannot tell. */
function naturalTop(stack: HTMLElement, i: number) {
  const cards = Array.from(stack.children) as HTMLElement[];
  let y = stack.getBoundingClientRect().top + window.scrollY;
  for (let j = 0; j < i; j++) {
    y += cards[j].offsetHeight + parseFloat(getComputedStyle(cards[j]).marginBottom || "0");
  }
  return y;
}

function PillarCard({ p, i, n, progress, stacked }: {
  p: (typeof PILLARS)[number]; i: number; n: number; progress: MotionValue<number>; stacked: boolean;
}) {
  // Each sheet settles back a little as the later ones slide over it.
  const scale = useTransform(progress, [i / n, 1], [1, 1 - (n - 1 - i) * 0.045]);
  const dim = useTransform(progress, [i / n, 1], [0, (n - 1 - i) * 0.1]);
  return (
    <motion.article
      className="lp-card lp-grain"
      data-tone={p.tone}
      style={{ "--i": i, ...(stacked ? { scale } : {}) } as Vars}
      role="tabpanel"
      id={`pillar-panel-${i}`}
      aria-labelledby={`pillar-tab-${i}`}
      tabIndex={0}
    >
      <div className="lp-card-inner">
        <div className="min-w-0">
          <span className="lp-card-num" aria-hidden="true">S-0{i + 1}</span>
          <div className="lp-card-shot"><ProductScreenshot view={p.view} /></div>
        </div>
        <div className="lp-card-side">
          <div>
            <span className="lp-card-name"><PillarIcon name={p.key} />{p.name}</span>
            <h3 className="lp-display">{p.benefit}</h3>
            <ul>
              {p.bullets.map((b) => <li key={b}><span>{b}</span></li>)}
            </ul>
          </div>
          <a href="#free-report" className="lp-card-cta dl-focus">Get a free report</a>
        </div>
      </div>
      {stacked ? (
        <motion.div aria-hidden="true" style={{ opacity: dim, position: "absolute", inset: 0, background: "#0d2225", pointerEvents: "none" }} />
      ) : null}
    </motion.article>
  );
}

function Pillars() {
  const [active, setActive] = useState(0);
  const [stacked, setStacked] = useState(false);
  const stack = useRef<HTMLDivElement>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const { scrollYProgress } = useScroll({ target: stack, offset: ["start start", "end end"] });

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 900px) and (prefers-reduced-motion: no-preference)");
    const sync = () => setStacked(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // The tab that reads as selected is the sheet on top of the stack.
  useEffect(() => {
    const el = stack.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const line = window.innerHeight * 0.45;
        const cards = Array.from(el.children) as HTMLElement[];
        let top = 0;
        cards.forEach((c, i) => { if (c.getBoundingClientRect().top < line) top = i; });
        setActive(top);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);

  const select = (i: number) => {
    setActive(i);
    const el = stack.current;
    if (!el || typeof window.matchMedia !== "function") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const card = el.children[i] as HTMLElement | undefined;
    const stickTop = card ? parseFloat(getComputedStyle(card).top) || 0 : 0;
    window.scrollTo({ top: naturalTop(el, i) - stickTop, behavior: reduce ? "auto" : "smooth" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const n = PILLARS.length;
    const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1
      : (active + (e.key === "ArrowRight" ? 1 : n - 1)) % n;
    select(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="product" className="lp-pillars scroll-mt-24">
      <div className="lp-head" data-lp="rise">
        <span className="lp-eyebrow">The product</span>
        <h2 className="lp-display mt-6" data-lp="words"><Words text="One index, four ways in" /></h2>
        <p>Discover, ask, track, report — every surface runs on the same niche-scoped index, so the numbers always agree.</p>
      </div>

      <div className="lp-tabs">
        <div role="tablist" aria-label="What Sonar does" onKeyDown={onKeyDown}>
          {PILLARS.map((p, i) => (
            <button
              key={p.key}
              ref={(el) => { tabs.current[i] = el; }}
              type="button"
              role="tab"
              id={`pillar-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`pillar-panel-${i}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => select(i)}
              className="lp-tab dl-focus"
            >
              <small aria-hidden="true">S-0{i + 1}</small>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="lp-stack" ref={stack}>
        {PILLARS.map((p, i) => (
          <PillarCard key={p.key} p={p} i={i} n={PILLARS.length} progress={scrollYProgress} stacked={stacked} />
        ))}
      </div>
    </section>
  );
}

/* ── 5. personas — capability statements only, never invented outcomes ─────
   The photographs are illustrative (generated), not customers, and say so. */

const PERSONAS: Array<{ key: string; name: string; lead: string; points: string[] }> = [
  {
    key: "brand",
    name: "Brand marketers",
    lead: "You own the channel plan. Sonar shows you the field.",
    points: [
      "See which competitors run creator programs — and which creators carry them.",
      "Answer \"what changed this month\" with cited clips instead of screenshots.",
      "Turn what already works in your niche into a brief your team can shoot.",
    ],
  },
  {
    key: "agency",
    name: "Agencies",
    lead: "Several brands at once, one scoped index each.",
    points: [
      "Every client niche is its own index — switch between them without starting over.",
      "Reports are shareable links, so the client reads the same numbers you do.",
      "Find creators already posting in a client's category, with their track record attached.",
    ],
  },
  {
    key: "founder",
    name: "Founders",
    lead: "Marketing is one of your nine jobs. This one arrives mapped.",
    points: [
      "Start from your brand name — Sonar works out the niche and maps it.",
      "See who actually drives your market's conversation before you spend on creators.",
      "The free report shows the shape of your market before you commit to anything.",
    ],
  },
];

function Personas() {
  return (
    <section className="lp-people">
      <div className="lp-head" data-lp="rise">
        <span className="lp-eyebrow">Who it's for</span>
        <h2 className="lp-display mt-6" data-lp="words"><Words text="Built around the person doing the work" /></h2>
        <p>Different desks, same question: what is actually moving in my market, and who is driving it.</p>
      </div>
      <div className="lp-people-grid">
        {PERSONAS.map((p, i) => (
          <article key={p.key} className="lp-person" tabIndex={0} aria-label={p.name}>
            <div className="lp-photo" data-lp="open" style={{ "--r": i * 4 } as Vars}>
              <img src={`/landing/persona-${p.key}-bw.webp`} alt="" loading="lazy" decoding="async" width={960} height={1192} />
              <img className="colour" src={`/landing/persona-${p.key}.webp`} alt="" loading="lazy" decoding="async" width={960} height={1192} />
              <span className="lp-photo-tag"><b>0{i + 1}</b>{p.name}</span>
              <div className="lp-photo-lead"><p>{p.lead}</p></div>
            </div>
            <ul data-lp="rise" style={{ "--r": i * 4 } as Vars}>
              {p.points.map((pt) => (
                <li key={pt}><Check /><span>{pt}</span></li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="lp-note">Photography is illustrative.</p>
    </section>
  );
}

/* ── the lead form — the page's one real close ──────────────────────────────
   POST /api/lead/report fires ON SUBMIT ONLY (health-smoke: no fetch at render). Contract shape:
   {email, brand, url?, captcha_token?}. MAT-213 captures all new requests for review. Only an
   approved request starts a report; no timing is promised. Repeat submissions inside the 7-day
   window come back as status "done" (+ the submitter's own report link) or "already_claimed"
   (someone else at the same domain — no link), and each renders its own honest state. */

function LeadForm() {
  const captchaActive = isTurnstileEnabled();
  const captchaRef = useRef<TurnstileHandle>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [brand, setBrand] = useState("");
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{
    email: string;
    brand: string;
    status: string;
    reportUrl?: string;
    accessCode?: string;
  } | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const em = email.trim();
    const br = brand.trim();
    const url = website.trim();
    if (!em || !br) {
      setError("Add your work email and brand name — the report needs both.");
      return;
    }
    if (captchaActive && !captchaToken) return;
    setError(null);
    setPending(true);
    fetch("/api/lead/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: em,
        brand: br,
        ...(url ? { url } : {}),
        ...(captchaToken ? { captcha_token: captchaToken } : {}),
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        const body = (await r.json().catch(() => ({}))) as {
          status?: string;
          report_url?: string;
          access_code?: string;
        };
        setSent({
          email: em,
          brand: br,
          status: body.status ?? "received",
          reportUrl: body.report_url,
          accessCode: body.access_code,
        });
      })
      .catch((err: Error) => {
        captchaRef.current?.reset();
        setError(
          err.message === "429"
            ? "Too many requests from here right now — give it a minute and try again."
            : "That didn't go through. Check the work email and try again in a minute.",
        );
      })
      .finally(() => setPending(false));
  };

  if (sent) {
    const ready = sent.status === "done" && !!sent.reportUrl;
    const orgClaimed = sent.status === "already_claimed";
    const awaitingReview = sent.status === "awaiting_review";
    const received = sent.status === "received";
    return (
      <div data-testid="lead-success" role="status" className="lp-form">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--lp-ink)] text-[color:var(--lp-lime)]">
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m4.5 10.5 4 4 7-8.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h3 className="lp-display mt-5 text-[28px] text-[color:var(--lp-ink)]">
          {orgClaimed
            ? "Your team already has one."
            : ready
              ? "Your report is ready."
              : awaitingReview ? "Your request is awaiting review."
                : received ? "Your request has already been received." : "Your report is on its way."}
        </h3>
        {orgClaimed ? (
          <p className="mt-3 text-[15px] leading-[1.55] text-[color:var(--lp-ink-2)]" style={{ textWrap: "pretty" }}>
            A free social listening report was already claimed for your organization recently. Ask
            your team for the link, or come back in a few days.
          </p>
        ) : received ? (
          <p className="mt-3 text-[15px] leading-[1.55] text-[color:var(--lp-ink-2)]" style={{ textWrap: "pretty" }}>
            A request for this email or company website was submitted recently. This submission
            won't create another report. If approved, the completed report will be sent to the
            original requester.
          </p>
        ) : ready ? (
          <>
            <p className="mt-3 text-[15px] leading-[1.55] text-[color:var(--lp-ink-2)]" style={{ textWrap: "pretty" }}>
              You requested this report recently — it's ready to read now
              {sent.accessCode ? (
                <>
                  {" "}
                  (access code{" "}
                  <span className="lp-mono text-[13.5px] text-[color:var(--lp-ink)]">{sent.accessCode}</span>)
                </>
              ) : null}
              .
            </p>
            <a href={sent.reportUrl} data-testid="lead-report-link" className="lp-btn lp-btn-ink dl-focus mt-5">
              Open your report
            </a>
          </>
        ) : awaitingReview ? (
          <p className="mt-3 text-[15px] leading-[1.55] text-[color:var(--lp-ink-2)]">
            We've received <span className="font-semibold text-[color:var(--lp-ink)]">{sent.brand}</span> for review.
            If approved, we'll send the completed report to{" "}
            <span className="lp-mono text-[13.5px] text-[color:var(--lp-ink)]">{sent.email}</span>.
          </p>
        ) : (
          <p className="mt-3 text-[15px] leading-[1.55] text-[color:var(--lp-ink-2)]" style={{ textWrap: "pretty" }}>
            We've got <span className="font-semibold text-[color:var(--lp-ink)]">{sent.brand}</span>. Your social
            listening report will arrive in your inbox at{" "}
            <span className="lp-mono text-[13.5px] text-[color:var(--lp-ink)]">{sent.email}</span>.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} data-testid="lead-form" className="lp-form">
      <div className="flex flex-col gap-4">
        <label className="lp-field" htmlFor="lead-email">
          <span>Work email</span>
          <input id="lead-email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="name@yourbrand.com" className="dl-focus" />
        </label>
        <label className="lp-field" htmlFor="lead-brand">
          <span>Brand name</span>
          <input id="lead-brand" type="text" required value={brand}
            onChange={(e) => setBrand(e.target.value)} placeholder="The brand the report is about" className="dl-focus" />
        </label>
        <label className="lp-field" htmlFor="lead-website">
          <span>Website <span className="font-normal text-[color:var(--lp-ink-3)]">(optional)</span></span>
          <input id="lead-website" type="text" inputMode="url" value={website}
            onChange={(e) => setWebsite(e.target.value)} placeholder="yourbrand.com" className="dl-focus" />
        </label>

        {captchaActive && <Turnstile ref={captchaRef} onVerify={setCaptchaToken} />}

        {error && (
          <p data-testid="lead-error" role="alert" className="text-[13.5px] leading-[1.5] text-dl-flag">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || (captchaActive && !captchaToken)}
          aria-busy={pending || undefined}
          className="lp-btn lp-btn-ink dl-focus mt-1 w-full disabled:opacity-60"
        >
          <span className="lp-btn-dot" aria-hidden="true" />
          {pending ? "Sending…" : "Get my free report"}
        </button>
        <p className="text-[12.5px] leading-[1.5] text-[color:var(--lp-ink-3)]">
          We use your email for the report and nothing else.
        </p>
      </div>
    </form>
  );
}

function FreeReport() {
  return (
    <section id="free-report" className="lp-close scroll-mt-24">
      <div className="lp-close-bg" aria-hidden="true">
        <picture>
          <source media="(max-width: 899px)" srcSet="/landing/sky-close-sm.webp" />
          <img src="/landing/sky-close.webp" alt="" loading="lazy" decoding="async" />
        </picture>
      </div>
      <div className="lp-close-grid">
        <div data-lp="rise">
          <span className="lp-eyebrow">Free report</span>
          <h2 className="lp-display mt-6" data-lp="words"><Words text="hear what your market is saying" /></h2>
          <p className="mt-7 max-w-[46ch] text-[17px] leading-[1.55] text-[color:var(--lp-ink-2)]" style={{ textWrap: "pretty" }}>
            Tell us your brand and where to send it. Sonar builds your social listening report
            from the index — the competitors, the creators posting for them, and the clips that
            broke out — and emails it to you.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[color:var(--lp-ink)]">
            <Check /> No account needed — just a work email.
          </p>
        </div>
        <div data-lp="rise" style={{ "--r": 8 } as Vars}><LeadForm /></div>
      </div>
      <div className="lp-wordmark" aria-hidden="true"><span data-lp="climb">sonar.</span></div>
    </section>
  );
}

/* ── page ───────────────────────────────────────────────────────────────── */

function Pricing() {
  return <div className="lp-pricing lp-grain"><PublicPricing lazy /></div>;
}

export function Landing(): ReactNode {
  // The index-wide video total, once the visitor's lookup has read it live: the page's only live
  // index number. Held here so the hero fact, the coverage band and the lookup card print one
  // value from one formatter (2026-08-23).
  const [liveTotal, setLiveTotal] = useState<number | null>(null);
  // PublicPage carries the shared chrome (skip link, PublicNav, PublicFooter,
  // [data-ds="daylight"] scope, MotionConfig reducedMotion="user").
  return (
    <PublicPage platformTheme>
      <div className="lp">
        <Hero liveTotal={liveTotal} />
        <ProofStrip liveTotal={liveTotal} />
        <NicheMarquee />
        <div className="h-[clamp(64px,8vw,120px)]" />
        <Spotlight onIndexTotal={setLiveTotal} />
        <Pillars />
        <Personas />
        <Pricing />
        <FreeReport />
      </div>
    </PublicPage>
  );
}
