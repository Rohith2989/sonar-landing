const VIEWS = {
  ask: {
    title: "Ask Sonar",
    alt: "Current Sonar question composer with niche and time-window scope controls",
  },
  dashboard: {
    title: "Dashboard",
    alt: "Current Sonar dashboard with tracked niches, brand metrics and recent reports",
  },
  creators: {
    title: "Discover creators",
    alt: "Current Sonar creator directory with reliable reach, engagement and type filters",
  },
  reports: {
    title: "Report library",
    alt: "Current Sonar report library with niche, owner, date and report status columns",
  },
} as const;

/** Captures of actual app routes, with anonymous fixtures (public/demo/product/manifest.json),
 *  shown in a browser window — Sonar is a web app, so it is pictured as one. */
export function ProductScreenshot({ view, priority = false }: {
  view: keyof typeof VIEWS;
  priority?: boolean;
}) {
  const info = VIEWS[view];
  const src = `/demo/product/${view}.png`;
  return (
    <figure className="min-w-0" data-product-screenshot={view}>
      <div className="lp-window">
        <img src={src} alt={info.alt} width={1440} height={900}
          loading={priority ? "eager" : "lazy"} decoding="async"
          fetchPriority={priority ? "high" : "auto"} className="block h-auto w-full" />
      </div>
    </figure>
  );
}
