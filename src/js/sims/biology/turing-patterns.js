import { C, clamp, colormap, tag } from '../../core/util.js';

const PRESETS = {
  spots: { f: 0.0367, k: 0.0649, label: 'Leopard spots', cmap: ['#1a0e05', '#3b2208', '#b8741f', '#f2c35c', '#fff1c2'] },
  stripes: { f: 0.029, k: 0.057, label: 'Zebrafish stripes', cmap: ['#f4f1ea', '#c9c3b5', '#40372c', '#0d0b09', '#0d0b09'] },
  coral: { f: 0.0545, k: 0.062, label: 'Coral & brain', cmap: ['#06121f', '#0e3a52', '#ff5f7e', '#ffc0b0', '#ffffff'] },
  holes: { f: 0.039, k: 0.058, label: 'Pufferfish holes', cmap: ['#0b1d14', '#1b5a3a', '#a3e635', '#f6ffd0', '#ffffff'] },
  waves: { f: 0.014, k: 0.054, label: 'Travelling waves', cmap: ['#050816', '#1f2f8a', '#5b8cff', '#bfe0ff', '#ffffff'] },
};

export default {
  id: 'turing-patterns',
  title: 'How the Leopard Got Its Spots',
  category: 'biology',
  tagline: 'Two chemicals, one simple rule — and nature paints spots, stripes and mazes.',
  ages: ['16+'],
  topics: ['Development', 'Patterns', 'Modelling'],
  blurb:
    'In 1952 Alan Turing — the codebreaker and father of computing — proposed how a uniform clump of cells could develop spots and stripes. Two chemicals spread out at different speeds while reacting with each other. Tiny random bumps grow into regular patterns. Biologists have since found Turing patterns in fish skin, fingers and hair follicles.',
  ideas: [
    'An <b>activator</b> chemical makes more of itself; an <b>inhibitor</b> shuts it down.',
    'The inhibitor <b>spreads faster</b>, so each active patch suppresses its surroundings.',
    'This “local activation, long-range inhibition” turns random noise into <b>regular patterns</b>.',
    'Small changes in reaction rates switch the pattern between spots, stripes and mazes.',
  ],
  hint: 'Paint with the mouse to add chemical',
  renderScale: 1,
  thumbChapter: 1,
  thumbFrames: 260,
  params: [
    { key: 'preset', label: 'Pattern', type: 'select', value: 'spots', options: Object.entries(PRESETS).map(([k, p]) => ({ value: k, label: p.label })) },
    { key: 'f', label: 'Feed rate f', type: 'range', min: 0.01, max: 0.08, step: 0.0001, value: 0.0367, digits: 4 },
    { key: 'k', label: 'Kill rate k', type: 'range', min: 0.045, max: 0.07, step: 0.0001, value: 0.0649, digits: 4 },
    { key: 'speed', label: 'Steps per frame', type: 'range', min: 1, max: 30, step: 1, value: 14 },
    { key: 'seed', label: 'Reseed', type: 'button', action: (s) => s.seed() },
    { key: 'clear', label: 'Blank canvas', type: 'button', action: (s) => s.seed(true) },
  ],
  story: [
    {
      title: 'A smooth start',
      text: 'Imagine an embryo’s skin as a sheet of cells sharing two chemicals. At first they are spread almost evenly, with just a few random specks. Watch what happens as they react and diffuse.',
      formula: '∂a/∂t = D_a∇²a − ab² + f(1 − a)<br>∂b/∂t = D_b∇²b + ab² − (f + k)b',
      params: { preset: 'spots', speed: 14 },
      enter: (s) => s.seed(),
      duration: 13,
    },
    {
      title: 'Spots',
      text: 'Each speck grows, then splits in two like a dividing cell, until the sheet is evenly filled with <b>spots</b>. Each spot keeps its neighbours at a distance by surrounding itself with inhibitor.',
      params: { preset: 'spots' },
      duration: 14,
    },
    {
      title: 'Stripes',
      text: 'Change the feed and kill rates slightly and spots join into <b>stripes</b> and labyrinths — the pattern on a zebrafish or the ridges of your fingerprints.',
      params: { preset: 'stripes' },
      enter: (s) => s.seed(),
      duration: 14,
    },
    {
      title: 'Coral',
      text: 'Another nudge and the stripes branch and wander like coral or the folds of a brain.',
      params: { preset: 'coral' },
      enter: (s) => s.seed(),
      duration: 13,
    },
    {
      title: 'Same rule, many animals',
      text: 'Nature does not need a blueprint for every spot. One chemical recipe, slightly retuned, gives cheetahs spots, zebrafish stripes and pufferfish their maze. Paint on the canvas to disturb the pattern and watch it heal.',
      params: { preset: 'holes' },
      enter: (s) => s.seed(),
      duration: 16,
    },
    {
      title: 'Explore the recipe',
      text: 'Choose a preset or tune f and k by hand. Some combinations make patterns that never stop moving.',
      params: { preset: 'waves' },
      enter: (s) => s.seed(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let W = 0, H = 0, A, B, A2, B2, img, off, octx, lut, lutKey = '';

    function alloc() {
      const cols = api.thumbnail ? 150 : 200;
      W = cols;
      H = Math.max(40, Math.round((cols * api.h) / Math.max(1, api.w)));
      A = new Float32Array(W * H).fill(1);
      B = new Float32Array(W * H);
      A2 = new Float32Array(W * H);
      B2 = new Float32Array(W * H);
      off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      octx = off.getContext('2d');
      img = octx.createImageData(W, H);
    }
    function blob(cx, cy, r, v = 1) {
      for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y > r * r) continue;
          const i = ((cy + y + H) % H) * W + ((cx + x + W) % W);
          B[i] = 0.25 * v + B[i] * (1 - v);
          A[i] = 0.5 * v + A[i] * (1 - v);
        }
    }
    function seed(blank = false) {
      if (!W) alloc();
      A.fill(1);
      B.fill(0);
      if (blank) return;
      const n = Math.round((W * H) / 2600) + 4;
      for (let s = 0; s < n; s++) blob(Math.floor(Math.random() * W), Math.floor(Math.random() * H), 2 + Math.floor(Math.random() * 3));
      for (let i = 0; i < W * H; i++) if (Math.random() < 0.002) B[i] = 0.2;
    }
    function step() {
      const f = params.f, k = params.k;
      const fk1 = f, fk2 = f + k;
      for (let y = 0; y < H; y++) {
        const yu = ((y - 1 + H) % H) * W, yc = y * W, yd = ((y + 1) % H) * W;
        for (let x = 0; x < W; x++) {
          const xl = x === 0 ? W - 1 : x - 1, xr = x === W - 1 ? 0 : x + 1;
          const i = yc + x;
          const a = A[i], b = B[i];
          const la = 0.2 * (A[yc + xl] + A[yc + xr] + A[yu + x] + A[yd + x]) + 0.05 * (A[yu + xl] + A[yu + xr] + A[yd + xl] + A[yd + xr]) - a;
          const lb = 0.2 * (B[yc + xl] + B[yc + xr] + B[yu + x] + B[yd + x]) + 0.05 * (B[yu + xl] + B[yu + xr] + B[yd + xl] + B[yd + xr]) - b;
          const r = a * b * b;
          const na = a + la - r + fk1 * (1 - a), nb = b + 0.5 * lb + r - fk2 * b;
          A2[i] = na < 0 ? 0 : na > 1 ? 1 : na;
          B2[i] = nb < 0 ? 0 : nb > 1 ? 1 : nb;
        }
      }
      let t = A;
      A = A2;
      A2 = t;
      t = B;
      B = B2;
      B2 = t;
    }

    return {
      seed,
      reset: () => seed(),
      resize() {
        const nh = Math.max(40, Math.round(((api.thumbnail ? 150 : 200) * api.h) / Math.max(1, api.w)));
        if (W && Math.abs(nh - H) <= 3) return;
        alloc();
        seed();
      },
      onParam(key, v) {
        if (key === 'preset' && PRESETS[v]) {
          api.runner.set('f', PRESETS[v].f);
          api.runner.set('k', PRESETS[v].k);
        }
      },
      update() {
        if (!W) return;
        const p = api.pointer;
        if (p.down && p.inside) {
          const cx = Math.floor((p.x / api.w) * W), cy = Math.floor((p.y / api.h) * H);
          blob(cx, cy, 3);
        }
        // run the requested steps, but never spend more than ~6 ms per frame on them
        const n = Math.round(params.speed);
        const t0 = performance.now();
        for (let s = 0; s < n; s++) {
          step();
          if (!api.thumbnail && performance.now() - t0 > 6) break;
        }
      },
      draw() {
        const { w, h } = api;
        if (!W) return;
        const pr = PRESETS[params.preset] || PRESETS.spots;
        if (lutKey !== params.preset) {
          lut = colormap(pr.cmap);
          lutKey = params.preset;
        }
        const d = img.data;
        for (let i = 0, j = 0; i < W * H; i++, j += 4) {
          const v = clamp(Math.floor(B[i] * 3.2 * 255), 0, 255) * 3;
          d[j] = lut[v];
          d[j + 1] = lut[v + 1];
          d[j + 2] = lut[v + 2];
          d[j + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(off, 0, 0, w, h);
        // soft vignette
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        if (!api.thumbnail) tag(ctx, `${pr.label}  ·  f ${params.f.toFixed(4)}  k ${params.k.toFixed(4)}`, w - 16, 84, C.ink, { align: 'right', size: 11 });
      },
      stats() {
        let s = 0;
        for (let i = 0; i < W * H; i++) s += B[i];
        return [
          { label: 'Feed rate f', value: params.f.toFixed(4) },
          { label: 'Kill rate k', value: params.k.toFixed(4) },
          { label: 'Diffusion ratio a : b', value: '2 : 1' },
          { label: 'Pattern coverage', value: ((s / (W * H)) * 300).toFixed(1) + ' %', color: C.amber },
        ];
      },
    };
  },
};
