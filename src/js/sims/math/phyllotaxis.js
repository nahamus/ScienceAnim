import { C, drawGlow, tag, TAU } from '../../core/util.js';

const GOLDEN = 360 * (1 - 1 / ((1 + Math.sqrt(5)) / 2)); // 137.5077…°

export default {
  id: 'phyllotaxis',
  title: 'The Golden Angle in Nature',
  category: 'math',
  tagline: 'Why sunflowers, pinecones and daisies all count their spirals in Fibonacci numbers.',
  ages: ['11-14', '14-16'],
  topics: ['Sequences', 'Geometry'],
  blurb:
    'Plants grow new seeds, petals and leaves one at a time from a central point, each rotated by a fixed angle from the last. Which angle packs them best? Almost any choice leaves wasteful gaps — except one: the golden angle, 137.5°, tied to the golden ratio and the Fibonacci numbers.',
  ideas: [
    'Each new seed is placed at a fixed turn from the previous one.',
    'Simple fractions of a turn (like ¼ or ⅓) make straight spokes with gaps between them.',
    'The <b>golden angle</b> ≈ 137.5° is the “most irrational” angle, so seeds never line up.',
    'The visible spirals come in <b>Fibonacci numbers</b>: 8, 13, 21, 34, 55…',
  ],
  hint: 'Try the angle slider — tiny changes make a huge difference',
  thumbChapter: 2,
  thumbFrames: 200,
  params: [
    { key: 'angle', label: 'Divergence angle', type: 'range', min: 90, max: 180, step: 0.001, value: 90, unit: '°', digits: 3 },
    { key: 'N', label: 'Seeds', type: 'range', min: 100, max: 3000, step: 50, value: 1200, instant: true },
    { key: 'mod', label: 'Highlight spirals', type: 'select', value: 0, options: [{ value: 0, label: 'Off' }, { value: 13, label: '13' }, { value: 21, label: '21' }, { value: 34, label: '34' }, { value: 55, label: '55' }] },
    { key: 'sweep', label: 'Slowly sweep the angle', type: 'toggle', value: false },
    { key: 'regrow', label: 'Regrow', type: 'button', action: (s) => s.regrow() },
  ],
  story: [
    {
      title: 'Growing from the centre',
      text: 'A sunflower head grows seeds one by one from its centre. Each new seed appears a fixed turn away from the last, then gets pushed outward. Here the turn is exactly <b>90°</b> — a quarter.',
      params: { angle: 90, mod: 0, sweep: false },
      enter: (s) => s.regrow(),
      duration: 10,
    },
    {
      title: 'Simple fractions waste space',
      text: 'A quarter turn makes 4 spokes; a third (120°) makes 3. Any simple fraction makes seeds line up in straight rows, leaving wasted gaps between them.',
      params: { angle: 120 },
      tween: 3,
      duration: 11,
    },
    {
      title: 'The golden angle',
      text: 'At <b>137.5°</b> something magical happens: seeds never line up, so they fill the disc evenly with no gaps. This is the angle sunflowers actually use.',
      formula: 'θ = 360° · (1 − 1/φ) ≈ 137.508°,   φ = (1+√5)/2',
      params: { angle: GOLDEN },
      tween: 4,
      enter: (s) => s.regrow(),
      duration: 14,
    },
    {
      title: 'Hidden Fibonacci spirals',
      text: 'Your eye finds spirals curling both ways. Highlight them and count: <b>21</b> one way, <b>34</b> the other — consecutive Fibonacci numbers. Real sunflowers show the same counts.',
      formula: '1, 1, 2, 3, 5, 8, 13, 21, 34, 55, …',
      params: { mod: 21 },
      enter: (s, r) => setTimeout(() => r.set('mod', 34), 6000),
      duration: 13,
    },
    {
      title: 'A tiny miss',
      text: 'Change the angle by just 0.2° and the pattern breaks down: gaps and spokes reappear toward the edge. Nature’s precision matters.',
      params: { angle: GOLDEN - 0.2, mod: 0 },
      tween: 2,
      duration: 11,
    },
    {
      title: 'Sweep through every angle',
      text: 'Now the angle slowly drifts. Watch spokes, spirals and starbursts flicker by — and notice how rarely the disc is evenly filled.',
      params: { sweep: true, N: 1500 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let shown = 0;
    return {
      regrow() {
        shown = 0;
      },
      reset() {
        shown = 0;
      },
      update(dt) {
        const N = Math.round(params.N);
        shown = Math.min(N, shown + dt * N * 0.35);
        if (params.sweep) {
          let a = params.angle + dt * 0.25;
          if (a > 180) a = 90;
          api.runner.params.angle = a;
          api.runner.onParamChange?.('angle', a);
        }
      },
      draw() {
        const { w, h } = api;
        const g = ctx.createRadialGradient(w / 2, h * 0.46, 0, w / 2, h * 0.46, Math.max(w, h) * 0.7);
        g.addColorStop(0, '#1a1406');
        g.addColorStop(1, '#040302');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        const N = Math.round(params.N);
        const R = Math.min(w, h) * 0.42;
        const c = R / Math.sqrt(N);
        const cx = w / 2, cy = h * 0.46;
        const th = (params.angle * Math.PI) / 180;
        const n = Math.floor(shown);
        const mod = params.mod;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const r = c * Math.sqrt(i + 0.5);
          const a = i * th;
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          const f = i / N;
          const s = c * (0.42 + 0.18 * f);
          const hi = mod && i % mod === 0;
          let col;
          if (mod) col = hi ? '#ffffff' : `hsla(${30 + (i % mod) * (300 / mod)},70%,${45 + 10 * f}%,0.55)`;
          else col = `hsl(${55 - f * 30},${85}%,${62 - f * 18}%)`;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y, s, 0, TAU);
          ctx.fill();
        }
        if (n < N && n > 0) {
          const a = n * th;
          const r = c * Math.sqrt(n);
          drawGlow(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 22, '#ffd27a');
        }
        drawGlow(ctx, cx, cy, 30, '#ffb547', 0.2);
        ctx.globalCompositeOperation = 'source-over';
        if (!api.thumbnail) tag(ctx, `${params.angle.toFixed(3)}°`, cx, cy - R - 20, Math.abs(params.angle - GOLDEN) < 0.01 ? C.amber : C.ink, { align: 'center', size: 13 });
      },
      stats() {
        const frac = params.angle / 360;
        // best rational approximation with small denominator → number of spokes
        let best = 1, bErr = 1;
        for (let q = 1; q <= 60; q++) {
          const err = Math.abs(frac * q - Math.round(frac * q));
          if (err < bErr - 1e-9) (bErr = err), (best = q);
          if (err < 0.002) break;
        }
        return [
          { label: 'Angle', value: params.angle.toFixed(3) + '°' },
          { label: 'Off golden by', value: (params.angle - GOLDEN).toFixed(3) + '°', color: Math.abs(params.angle - GOLDEN) < 0.01 ? C.amber : undefined },
          { label: 'Fraction of a turn', value: `≈ ${Math.round(frac * best)}/${best}` },
          { label: 'Seeds', value: String(Math.floor(shown)) },
        ];
      },
    };
  },
};
