// Each row contains two identical runs of labels and travels half its width.
// Measure that distance so the directory's size never dictates reading speed.
const rows = new Set();

function setDuration(row) {
  const distance = row.getBoundingClientRect().width / 2;
  const pixelsPerSecond = row.classList.contains('rev') ? 16 : 20;
  if (distance > 0) {
    row.style.setProperty('--marquee-duration', `${distance / pixelsPerSecond}s`);
  }
}

const resize = new ResizeObserver(entries => {
  for (const { target } of entries) setDuration(target);
});

function syncRows() {
  for (const row of rows) {
    if (!row.isConnected) {
      resize.unobserve(row);
      rows.delete(row);
    }
  }
  for (const row of document.querySelectorAll('.lp-marquee-row')) {
    if (rows.has(row)) continue;
    rows.add(row);
    setDuration(row);
    resize.observe(row);
  }
}

// The shipped React bundle replaces the prerendered tree on startup/navigation.
const observer = new MutationObserver(syncRows);
observer.observe(document.getElementById('root') ?? document.body, {
  childList: true,
  subtree: true,
});
syncRows();
document.fonts.ready.then(() => {
  for (const row of rows) setDuration(row);
});
