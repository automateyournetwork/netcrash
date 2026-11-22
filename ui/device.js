// Browser/format detection (FR-049). Pure functions, so they can be tested without a browser.

// Which browser family is this? Order matters: Edge and Opera also say "Chrome", Chrome also says "Safari".
export function browserFamily(userAgent = '') {
  const ua = String(userAgent);
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'edge';
  if (/OPR\/|Opera/.test(ua)) return 'opera';
  if (/Firefox\/|FxiOS\//.test(ua)) return 'firefox';
  if (/SamsungBrowser\//.test(ua)) return 'samsung';
  if (/Chrome\/|CriOS\//.test(ua)) return 'chrome';
  if (/Safari\//.test(ua)) return 'safari';
  return 'other';
}

// Choose the layout: 'mobile' (vertical, touch-sized) or 'desktop' (full-window landscape).
// override: 'mobile' | 'desktop' wins; anything else means auto-detect.
export function chooseFormat({ userAgent = '', uaMobile, coarse = false, width = 1280, height = 720, override = '' } = {}) {
  const o = String(override || '').toLowerCase();
  if (o === 'mobile' || o === 'desktop') return { format: o, reason: 'override' };
  const ua = String(userAgent);
  const phone = uaMobile === true || /iPhone|iPod|Windows Phone|Android[^;]*; Mobile|Android.+Mobile|\bMobi\b/i.test(ua);
  if (phone) return { format: 'mobile', reason: 'phone browser' };
  const tablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) || (/Macintosh/.test(ua) && coarse); // iPadOS says Macintosh
  if (tablet) return height >= width ? { format: 'mobile', reason: 'tablet held upright' } : { format: 'desktop', reason: 'tablet held sideways' };
  if (coarse && Math.min(width, height) < 700) return { format: 'mobile', reason: 'small touch screen' };
  return { format: 'desktop', reason: 'default' };
}

// Reads the real environment (browser only).
export function detectEnvironment(win = window) {
  const nav = win.navigator || {};
  const q = new URLSearchParams((win.location && win.location.search) || '');
  const coarse = typeof win.matchMedia === 'function' && win.matchMedia('(pointer: coarse)').matches;
  const info = chooseFormat({
    userAgent: nav.userAgent || '', uaMobile: nav.userAgentData ? nav.userAgentData.mobile : undefined,
    coarse, width: win.innerWidth || 1280, height: win.innerHeight || 720, override: q.get('format') || ''
  });
  return { ...info, browser: browserFamily(nav.userAgent || ''), coarse, quality: q.get('quality') || '', fps: q.get('fps') !== null };
}

// Scene size for a container: landscape keeps height 400 and widens (430..1000); portrait (mobile format)
// keeps width 420 and grows taller (420..900). `vy` keeps the ground at y = 400 (FR-045).
export function sceneSize(W, H, baseH = 400) {
  if (!(W > 0) || !(H > 0)) return { w: 700, h: baseH, vy: 0, portrait: false };
  if (W >= H * 0.95) return { w: Math.round(Math.min(1000, Math.max(430, (baseH * W) / H))), h: baseH, vy: 0, portrait: false };
  const h = Math.round(Math.min(900, Math.max(420, (420 * H) / W)));
  return { w: 420, h, vy: baseH - h, portrait: true };
}

// Frame-rate meter and automatic lower quality (FR-050): average fps over the last second, worst frame,
// and `low` once the rate has stayed under `lowFps` for `afterMs` of flight.
export function createQualityMonitor({ lowFps = 40, afterMs = 3000 } = {}) {
  const stamps = []; let worst = 0; let lowFor = 0; let low = false;
  return {
    note(now, frameMs, flying) {
      stamps.push(now); while (stamps.length && now - stamps[0] > 1000) stamps.shift();
      worst = Math.max(worst * 0.98, frameMs);
      const fps = stamps.length;
      if (flying && fps < lowFps && stamps.length > 5 && now - stamps[0] > 900) lowFor += frameMs; else lowFor = Math.max(0, lowFor - frameMs);
      if (lowFor > afterMs) low = true;
      return { fps, worstMs: worst, low };
    }
  };
}
