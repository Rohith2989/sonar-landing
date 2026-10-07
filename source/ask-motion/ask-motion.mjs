// Previous films remain explicitly selectable without loading their media by default.
const mode = new URLSearchParams(location.search).get('ask-motion');
await import(mode === 'poses' ? './ask-poses.mjs' : mode === 'portrait' ? './ask-video.mjs' : './feed-video.mjs');
