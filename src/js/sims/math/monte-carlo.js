import { C, TAU, clamp, roundRect, tag, text } from '../../core/util.js';

// Monte Carlo: answers from randomness.
// Darts: uniform points in a square; the share inside the circle → π/4.
// Needles: Buffon (1777). Needles as long as the gap between lines cross a line with probability 2/π.
// Area: uniform points in a box around the Mandelbrot set; the share that never escapes × box area ≈ 1.506.
// The typical error shrinks like 1/√n.

const SCENES = {
  darts: { truth: Math.PI, name: 'π', lo: 2.4, hi: 3.9, sd: 4 * Math.sqrt((Math.PI / 4) * (1 - Math.PI / 4)) },
  needle: { truth: Math.PI, name: 'π', lo: 2.4, hi: 3.9, sd: 2.37 },
  area: { truth: 1.5066, name: 'area', lo: 0.8, hi: 2.2, sd: 6.25 * Math.sqrt(0.241 * 0.759) },
};
const BOX = { x0: -2.1, x1: 0.6, y0: -1.35, y1: 1.35 }; // 2.7 × 2.7 = 7.29
const BOXA = (BOX.x1 - BOX.x0) * (BOX.y1 - BOX.y0);
SCENES.area.sd = BOXA * Math.sqrt((1.5066 / BOXA) * (1 - 1.5066 / BOXA));
function inMandel(cx, cy) {
  // quick rejections: main cardioid and period-2 bulb
  const q = (cx - 0.25) ** 2 + cy * cy;
  if (q * (q + (cx - 0.25)) <= 0.25 * cy * cy) return true;
  if ((cx + 1) ** 2 + cy * cy <= 1 / 16) return true;
  let x = 0, y = 0;
  for (let i = 0; i < 1500; i++) {
    const xx = x * x - y * y + cx;
    y = 2 * x * y + cy;
    x = xx;
    if (x * x + y * y > 4) return false;
  }
  return true;
}

export default {
  id: 'monte-carlo',
  title: 'Monte Carlo: Answers from Randomness',
  category: 'math',
  tagline: 'Throw random darts and they work out π, and much more besides.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Probability', 'Statistics', 'Computing'],
  keywords: ['Monte Carlo method', 'estimate pi', 'random sampling', 'Buffon\'s needle', 'law of large numbers', 'standard error', 'square root of n', 'Mandelbrot area', 'simulation', 'Ulam', 'von Neumann', 'path tracing'],
  blurb:
    'Throw darts at random at a square with a circle inside it. The share that land in the circle is π ÷ 4, so random throws can measure π. This trick, the Monte Carlo method, turns hard calculations into games of chance. It was invented to design the first nuclear reactors and bombs, and today it forecasts weather, prices risk, renders film effects and helps AI plan its moves.',
  ideas: [
    'If points land at random, the share that hits a shape equals the shape’s share of the area.',
    'More throws give a better answer, but slowly: the typical error shrinks like <b>1 ÷ √n</b>.',
    'Ten times more accuracy costs a <b>hundred</b> times more throws.',
    'Monte Carlo works where formulas fail, for example the area of the Mandelbrot set.',
    'Named after the Monte Carlo casino by Stanisław Ulam and John von Neumann in the 1940s.',
  ],
  hint: 'Turn up the rate and watch the estimate settle',
  thumbChapter: 2,
  thumbFrames: 300,
  params: [
    {
      key: 'scene', label: 'Experiment', type: 'select', value: 'darts', instant: true,
      options: [{ value: 'darts', label: 'Darts and a circle' }, { value: 'needle', label: 'Buffon’s needles' }, { value: 'area', label: 'Area of the Mandelbrot set' }],
    },
    { key: 'rate', label: 'Throws per second', type: 'range', min: 1, max: 4000, step: 1, value: 5, format: (v) => String(Math.round(v)) },
    { key: 'clear', label: 'Start again', type: 'button', action: (s) => s.clear() },
    { key: 'more', label: 'Throw 100,000 at once', type: 'button', action: (s) => s.burst(100000) },
  ],
  story: [
    {
      title: 'Throwing darts',
      text: 'Throw darts completely at random at a square board with a circle drawn inside it. The circle covers π ÷ 4 (about 79 %) of the square. So the share of darts landing inside, times 4, should be close to π.',
      formula: 'π ≈ 4 × (darts inside) ÷ (all darts)',
      params: { scene: 'darts', rate: 5 },
      enter: (s) => s.clear(),
      duration: 13,
    },
    {
      title: 'Thousands of darts',
      text: 'One dart tells you almost nothing, but thousands of them add up to a good answer. Watch the estimate wobble, then settle near 3.14159… The graph shows each estimate as more darts land.',
      params: { scene: 'darts', rate: 600 },
      duration: 14,
    },
    {
      title: 'Slowly but surely',
      text: 'The shaded band shows the typical error. It shrinks as more darts land, but slowly: to halve the error you need four times as many darts. A hundred thousand darts gets π right to about two decimal places.',
      formula: 'typical error ∝ 1 ÷ √n',
      check: {
        q: 'To make the estimate ten times more accurate, how many more darts do you need?',
        options: ['100 times as many', '10 times as many', '1,000 times as many'],
        answer: 0,
        setup: { scene: 'darts', rate: 600 },
        explain: 'The error shrinks with the square root of the number of throws. √100 = 10, so a hundred times more darts buys ten times more accuracy. That is why Monte Carlo is easy to start but expensive to perfect.',
      },
      params: { scene: 'darts', rate: 3000 },
      duration: 15,
    },
    {
      title: 'Buffon’s needle',
      text: 'In 1777 the Comte de Buffon asked: drop a needle on a floor of planks, with the needle as long as a plank is wide. How often does it land across a crack? The answer is 2 ÷ π, about 64 %. So by dropping needles and counting, you can measure π without a circle in sight.',
      formula: 'π ≈ 2 × (needles) ÷ (needles crossing a line)',
      params: { scene: 'needle', rate: 15 },
      enter: (s) => s.clear(),
      duration: 16,
    },
    {
      title: 'Measuring the impossible',
      text: 'Nobody has a formula for the area of the Mandelbrot set: its edge is infinitely crinkly. But we can throw darts at a box around it and test each one. The share that lands inside, times the area of the box, gives the answer: about 1.506. This is the real power of Monte Carlo: it works when the maths is too hard.',
      params: { scene: 'area', rate: 1500 },
      enter: (s) => s.clear(),
      duration: 16,
    },
    {
      title: 'Why it matters',
      text: 'In 1946 Stanisław Ulam, recovering from an illness, wondered about his chances of winning at patience (solitaire), and realised that playing many random games was easier than calculating. With John von Neumann he used the idea to follow neutrons through the first nuclear weapons. Today Monte Carlo methods forecast the weather, price financial risk, light the scenes of animated films by tracing random rays, and help AI like AlphaGo choose its moves.',
      params: { scene: 'darts', rate: 4000 },
      enter: (s) => s.clear(),
      duration: 17,
    },
    {
      title: 'Your turn',
      text: 'Pick an experiment, set the rate, and throw. Can you get π right to three decimal places? How many throws did it take?',
      params: { scene: 'darts', rate: 200 },
      enter: (s) => s.clear(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let n = 0, hits = 0, acc = 0, hist = [], recent = [], layer = null, layerKey = '', bg = null, bgKey = '';

    const geom = () => {
      const { w, h } = api;
      const phone = w < 760;
      if (phone) {
        const side = Math.min(w - 24, h * 0.5);
        return { phone, x0: (w - side) / 2, y0: 62, side, chart: { x: 12, y: 62 + side + 12, w: w - 24, h: Math.max(0, h - (62 + side + 12) - 56) } };
      }
      const side = Math.min(h - 140, w * 0.52);
      return { phone, x0: w - side - 24, y0: 110, side, chart: { x: 24, y: 110, w: Math.min(w - side - 72, 440), h: Math.min(260, h * 0.34) } };
    };

    function ensureLayer(g) {
      const key = `${params.scene}:${Math.round(g.side)}`;
      if (layer && layerKey === key) return;
      layer = document.createElement('canvas');
      layer.width = layer.height = Math.round(g.side);
      layerKey = key;
      n = hits = 0;
      hist = [];
      recent = [];
    }
    function ensureBg(g) {
      const key = `${params.scene}:${Math.round(g.side)}`;
      if (bg && bgKey === key) return;
      bgKey = key;
      bg = document.createElement('canvas');
      const S = Math.round(g.side);
      bg.width = bg.height = S;
      const b = bg.getContext('2d');
      b.fillStyle = '#0a0e1c';
      b.fillRect(0, 0, S, S);
      if (params.scene === 'area') {
        // faint picture of the set, for orientation
        const img = b.getImageData(0, 0, S, S);
        const step = 2;
        for (let y = 0; y < S; y += step)
          for (let x = 0; x < S; x += step) {
            const cx = BOX.x0 + (x / S) * (BOX.x1 - BOX.x0), cy = BOX.y0 + (y / S) * (BOX.y1 - BOX.y0);
            let zx = 0, zy = 0, i = 0;
            for (; i < 60 && zx * zx + zy * zy < 4; i++) {
              const t = zx * zx - zy * zy + cx;
              zy = 2 * zx * zy + cy;
              zx = t;
            }
            const v = i === 60 ? 40 : Math.min(30, i * 1.2);
            for (let dy = 0; dy < step; dy++)
              for (let dx = 0; dx < step; dx++) {
                const p = ((y + dy) * S + x + dx) * 4;
                img.data[p] = 10 + v * 0.5;
                img.data[p + 1] = 14 + v * 0.5;
                img.data[p + 2] = 28 + v;
                img.data[p + 3] = 255;
              }
          }
        b.putImageData(img, 0, 0);
      } else if (params.scene === 'needle') {
        b.strokeStyle = 'rgba(255,255,255,0.35)';
        b.lineWidth = 1.5;
        for (let k = 0; k <= 5; k++) {
          b.beginPath();
          b.moveTo(0, (k * S) / 5);
          b.lineTo(S, (k * S) / 5);
          b.stroke();
        }
      } else {
        b.strokeStyle = 'rgba(255,255,255,0.35)';
        b.lineWidth = 1.5;
        b.beginPath();
        b.arc(S / 2, S / 2, S / 2, 0, TAU);
        b.stroke();
      }
    }

    function throwOne(draw) {
      const S = layer.width;
      const lc = layer.getContext('2d');
      if (params.scene === 'darts') {
        const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1;
        const inside = x * x + y * y <= 1;
        n++;
        if (inside) hits++;
        const X = ((x + 1) / 2) * S, Y = ((y + 1) / 2) * S;
        lc.fillStyle = inside ? 'rgba(255,181,71,0.9)' : 'rgba(120,165,255,0.95)';
        lc.fillRect(X - 1, Y - 1, 2, 2);
        if (draw) recent.push({ X, Y, inside, t: 0 });
      } else if (params.scene === 'needle') {
        // gap between lines = needle length = S / 5
        const L = S / 5;
        const cy = Math.random() * S, cx = L / 2 + Math.random() * (S - L), a = Math.random() * Math.PI;
        const y1 = cy - (Math.sin(a) * L) / 2, y2 = cy + (Math.sin(a) * L) / 2;
        const cross = Math.floor(y1 / L) !== Math.floor(y2 / L);
        n++;
        if (cross) hits++;
        lc.strokeStyle = cross ? 'rgba(255,77,109,0.55)' : 'rgba(170,190,230,0.35)';
        lc.lineWidth = 1.2;
        lc.beginPath();
        lc.moveTo(cx - (Math.cos(a) * L) / 2, y1);
        lc.lineTo(cx + (Math.cos(a) * L) / 2, y2);
        lc.stroke();
        if (draw) recent.push({ X: cx, Y: cy, a, L, inside: cross, t: 0 });
      } else {
        const cx = BOX.x0 + Math.random() * (BOX.x1 - BOX.x0), cy = BOX.y0 + Math.random() * (BOX.y1 - BOX.y0);
        const inside = inMandel(cx, cy);
        n++;
        if (inside) hits++;
        const X = ((cx - BOX.x0) / (BOX.x1 - BOX.x0)) * S, Y = ((cy - BOX.y0) / (BOX.y1 - BOX.y0)) * S;
        lc.fillStyle = inside ? 'rgba(255,181,71,0.95)' : 'rgba(120,165,255,0.6)';
        lc.fillRect(X - 0.8, Y - 0.8, 1.6, 1.6);
        if (draw) recent.push({ X, Y, inside, t: 0 });
      }
      const last = hist[hist.length - 1];
      if (!last || n >= last[0] * 1.04 || n < 50) hist.push([n, estimate()]);
    }
    function estimate() {
      if (!n) return NaN;
      if (params.scene === 'darts') return (4 * hits) / n;
      if (params.scene === 'needle') return hits ? (2 * n) / hits : NaN;
      return (BOXA * hits) / n;
    }

    return {
      clear() {
        layer = null;
        acc = 0;
      },
      burst(k) {
        const g = geom();
        ensureLayer(g);
        const m = params.scene === 'area' ? Math.min(k, 30000) : k;
        for (let i = 0; i < m; i++) throwOne(false);
      },
      onParam(k) {
        if (k === 'scene') layer = null;
      },
      update(dt) {
        const g = geom();
        ensureLayer(g);
        acc += dt * params.rate;
        let k = Math.floor(acc);
        acc -= k;
        k = Math.min(k, params.scene === 'area' ? 400 : 3000);
        for (let i = 0; i < k; i++) throwOne(params.rate < 60);
        for (const r of recent) r.t += dt;
        recent = recent.filter((r) => r.t < 0.8);
      },
      draw() {
        const { w, h } = api;
        const g = geom();
        ensureLayer(g);
        ensureBg(g);
        ctx.fillStyle = '#05070f';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(bg, g.x0, g.y0, g.side, g.side);
        ctx.drawImage(layer, g.x0, g.y0, g.side, g.side);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(g.x0, g.y0, g.side, g.side);
        const sc = g.side / layer.width;
        // freshly thrown darts pop
        for (const r of recent) {
          const k = 1 - r.t / 0.8;
          const col = r.inside ? (params.scene === 'needle' ? C.red : C.amber) : '#7fa5ff';
          ctx.globalAlpha = k;
          if (params.scene === 'needle') {
            ctx.strokeStyle = col;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(g.x0 + (r.X - (Math.cos(r.a) * r.L) / 2) * sc, g.y0 + (r.Y - (Math.sin(r.a) * r.L) / 2) * sc);
            ctx.lineTo(g.x0 + (r.X + (Math.cos(r.a) * r.L) / 2) * sc, g.y0 + (r.Y + (Math.sin(r.a) * r.L) / 2) * sc);
            ctx.stroke();
          } else {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(g.x0 + r.X * sc, g.y0 + r.Y * sc, 3 + 6 * k, 0, TAU);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        const S = SCENES[params.scene];
        const est = estimate();
        const big = g.phone ? 15 : 20;
        const label = params.scene === 'area' ? 'area ≈' : 'π ≈';
        const err = isFinite(est) ? Math.abs(est - S.truth) : NaN;
        tag(ctx, `${n.toLocaleString('en-US')} throws`, w - 16, g.phone ? 56 : 84, C.dim, { align: 'right' });

        // estimate history chart
        const P = g.chart;
        if (P.h < 50) return;
        ctx.fillStyle = 'rgba(8,11,24,0.86)';
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        roundRect(ctx, P.x, P.y, P.w, P.h, 12);
        ctx.fill();
        ctx.stroke();
        text(ctx, `${label} ${isFinite(est) ? est.toFixed(5) : '…'}`, P.x + 12, P.y + 18, { size: big, weight: 700, color: C.amber, mono: true });
        if (isFinite(err)) text(ctx, `off by ${err.toFixed(4)}`, P.x + P.w - 12, P.y + 18, { size: 11, align: 'right', color: C.dim, mono: true });
        const x0 = P.x + 40, x1 = P.x + P.w - 14, y0 = P.y + 40, y1 = P.y + P.h - 26;
        if (y1 - y0 < 30) return;
        const nmax = Math.max(100, 10 ** Math.ceil(Math.log10(Math.max(n, 10))));
        const X = (k) => x0 + (Math.log10(k) / Math.log10(nmax)) * (x1 - x0);
        const Y = (v) => y1 - ((clamp(v, S.lo, S.hi) - S.lo) / (S.hi - S.lo)) * (y1 - y0);
        // ±2 typical errors
        ctx.fillStyle = 'rgba(167,139,250,0.18)';
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const k = 10 ** ((Math.log10(nmax) * i) / 60);
          ctx[i ? 'lineTo' : 'moveTo'](X(k), Y(S.truth + (2 * S.sd) / Math.sqrt(k)));
        }
        for (let i = 60; i >= 0; i--) {
          const k = 10 ** ((Math.log10(nmax) * i) / 60);
          ctx.lineTo(X(k), Y(S.truth - (2 * S.sd) / Math.sqrt(k)));
        }
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x0, Y(S.truth));
        ctx.lineTo(x1, Y(S.truth));
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, params.scene === 'area' ? '1.5066' : 'π', x0 - 6, Y(S.truth), { size: 10, align: 'right', color: C.dim, mono: true });
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        let first = true;
        for (const [k, v] of hist) {
          if (!isFinite(v)) continue;
          ctx[first ? 'moveTo' : 'lineTo'](X(k), Y(v));
          first = false;
        }
        ctx.stroke();
        for (let e = 0; e <= Math.log10(nmax); e++) text(ctx, e < 3 ? String(10 ** e) : `10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e]}`, X(10 ** e), y1 + 12, { size: 9, align: 'center', color: 'rgba(233,237,247,0.45)', mono: true });
        text(ctx, 'throws (each step ×10)', x1, y1 + 24, { size: 9, align: 'right', color: 'rgba(233,237,247,0.45)' });
      },
      stats() {
        const S = SCENES[params.scene];
        const est = estimate();
        return [
          { label: 'Throws', value: n.toLocaleString('en-US') },
          { label: params.scene === 'needle' ? 'Crossing a line' : 'Inside', value: n ? `${hits.toLocaleString('en-US')} (${((hits / n) * 100).toFixed(1)} %)` : '—', color: C.amber },
          { label: 'Estimate', value: isFinite(est) ? est.toFixed(4) : '—', color: C.amber },
          { label: 'True value', value: S.truth.toFixed(4) },
          { label: 'Typical error now', value: n ? `± ${(S.sd / Math.sqrt(n)).toFixed(4)}` : '—', color: C.violet },
        ];
      },
    };
  },
};
