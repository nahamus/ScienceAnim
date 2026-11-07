// Shared math, color and drawing helpers for all simulations.

export const TAU = Math.PI * 2;
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function randn() {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * Math.random());
}

/** Seeded PRNG (mulberry32) so story chapters are reproducible. */
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- colors

export const C = {
  bg: '#05070f',
  ink: '#e9edf7',
  dim: 'rgba(233,237,247,0.55)',
  faint: 'rgba(233,237,247,0.14)',
  grid: 'rgba(140,160,220,0.07)',
  blue: '#5b8cff',
  cyan: '#38d6f5',
  teal: '#2ee6a6',
  lime: '#a3e635',
  amber: '#ffb547',
  orange: '#ff8a3d',
  red: '#ff4d6d',
  pink: '#ff5fa2',
  violet: '#a78bfa',
  white: '#ffffff',
};

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgba(hex, a = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
export const hsl = (h, s = 80, l = 60, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

/** Build a 256-entry RGB lookup table from color stops. */
export function colormap(stops) {
  const lut = new Uint8ClampedArray(256 * 3);
  const rgb = stops.map((s) => hexToRgb(s));
  for (let i = 0; i < 256; i++) {
    const t = (i / 255) * (rgb.length - 1);
    const k = Math.min(Math.floor(t), rgb.length - 2);
    const f = t - k;
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = rgb[k][c] + (rgb[k + 1][c] - rgb[k][c]) * f;
  }
  return lut;
}
export const CMAPS = {
  inferno: colormap(['#000004', '#320a5e', '#781c6d', '#bc3754', '#ed6925', '#fbb61a', '#fcffa4']),
  ice: colormap(['#02040a', '#0b1f4d', '#1c4fa0', '#38a0e0', '#9be4ff', '#ffffff']),
  // diverging: negative = blue, zero = near-black, positive = orange
  diverge: colormap(['#9be4ff', '#2f7de1', '#123270', '#06070d', '#5a1d14', '#e0612a', '#ffd38a']),
  viridis: colormap(['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725']),
};

// ---------------------------------------------------------------- glow sprites

const spriteCache = new Map();
/** Soft radial glow sprite, cached per color. Draw with drawGlow(). */
export function glowSprite(color, core = 0.18) {
  const key = color + core;
  let c = spriteCache.get(key);
  if (c) return c;
  const s = 64;
  c = document.createElement('canvas');
  c.width = c.height = s * 2;
  const g = c.getContext('2d');
  const [r, gg, b] = color.startsWith('#') ? hexToRgb(color) : [255, 255, 255];
  const grad = g.createRadialGradient(s, s, 0, s, s, s);
  grad.addColorStop(0, `rgba(255,255,255,1)`);
  grad.addColorStop(core * 0.5, `rgba(${r},${gg},${b},1)`);
  grad.addColorStop(core, `rgba(${r},${gg},${b},0.55)`);
  grad.addColorStop(0.45, `rgba(${r},${gg},${b},0.12)`);
  grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, s * 2, s * 2);
  spriteCache.set(key, c);
  return c;
}
export function drawGlow(ctx, x, y, r, color, core) {
  ctx.drawImage(glowSprite(color, core), x - r, y - r, r * 2, r * 2);
}

// ---------------------------------------------------------------- drawing helpers

export const FONT = '"Inter", system-ui, sans-serif';
export const MONO = '"JetBrains Mono", ui-monospace, monospace';

export function text(ctx, str, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.weight || 500} ${o.size || 13}px ${o.mono ? MONO : FONT}`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.baseline || 'middle';
  ctx.globalAlpha = o.alpha ?? 1;
  if (o.shadow !== false) {
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 6;
  }
  ctx.fillStyle = o.color || C.ink;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** A small pill label, e.g. for tagging objects in the scene. */
export function tag(ctx, str, x, y, color = C.ink, o = {}) {
  ctx.save();
  ctx.font = `600 ${o.size || 11}px ${FONT}`;
  const w = ctx.measureText(str).width + 14;
  const h = (o.size || 11) + 9;
  const ax = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  ctx.fillStyle = 'rgba(8,11,22,0.78)';
  ctx.strokeStyle = rgba(color.startsWith('#') ? color : '#ffffff', 0.45);
  ctx.lineWidth = 1;
  roundRect(ctx, ax, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, ax + 7, y + 0.5);
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function arrow(ctx, x1, y1, x2, y2, color = C.ink, width = 2, head = 9) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return;
  const hh = Math.min(head, len * 0.6);
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(a) * hh * 0.7, y2 - Math.sin(a) * hh * 0.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.42) * hh, y2 - Math.sin(a - 0.42) * hh);
  ctx.lineTo(x2 - Math.cos(a + 0.42) * hh, y2 - Math.sin(a + 0.42) * hh);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Subtle background: deep gradient + faint grid + vignette. */
export function backdrop(ctx, w, h, o = {}) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  g.addColorStop(0, o.center || '#0b1024');
  g.addColorStop(1, o.edge || '#03040a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (o.grid !== false) {
    const s = o.gridSize || 40;
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const ox = (w / 2) % s;
    const oy = (h / 2) % s;
    for (let x = ox; x < w; x += s) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, h);
    }
    for (let y = oy; y < h; y += s) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(w, Math.round(y) + 0.5);
    }
    ctx.stroke();
  }
}

/** Fade the previous frame for motion trails. */
export function fade(ctx, w, h, alpha = 0.1, color = '5,7,15') {
  ctx.fillStyle = `rgba(${color},${alpha})`;
  ctx.fillRect(0, 0, w, h);
}

/** Fixed-size ring buffer used for time-series charts. */
export class Series {
  constructor(n = 300) {
    this.n = n;
    this.data = [];
  }
  push(v) {
    this.data.push(v);
    if (this.data.length > this.n) this.data.shift();
  }
  clear() {
    this.data.length = 0;
  }
  get last() {
    return this.data[this.data.length - 1];
  }
}

export const fmt = (v, d = 2) => {
  if (!isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) return v.toExponential(1);
  return v.toFixed(d);
};

/** Uniform spatial hash for neighbour queries. */
export class SpatialHash {
  constructor(cell) {
    this.cell = cell;
    this.map = new Map();
  }
  clear() {
    this.map.clear();
  }
  key(x, y) {
    return ((Math.floor(x / this.cell) + 1000) << 16) | (Math.floor(y / this.cell) + 1000);
  }
  insert(o) {
    const k = this.key(o.x, o.y);
    let b = this.map.get(k);
    if (!b) this.map.set(k, (b = []));
    b.push(o);
  }
  query(x, y, r, out = []) {
    out.length = 0;
    const c = this.cell;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
    const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    for (let i = x0; i <= x1; i++)
      for (let j = y0; j <= y1; j++) {
        const b = this.map.get(((i + 1000) << 16) | (j + 1000));
        if (b) for (const o of b) out.push(o);
      }
    return out;
  }
}
