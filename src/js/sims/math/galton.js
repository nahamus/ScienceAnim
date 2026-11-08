import { C, TAU, clamp, backdrop, tag, text, drawGlow } from '../../core/util.js';

function binom(n, p) {
  const out = [];
  let c = 1;
  for (let k = 0; k <= n; k++) {
    out.push(c * Math.pow(p, k) * Math.pow(1 - p, n - k));
    c = (c * (n - k)) / (k + 1);
  }
  return out;
}

export default {
  id: 'galton',
  title: 'The Bell Curve from Chaos',
  category: 'math',
  tagline: 'Thousands of random bounces add up to one perfectly predictable shape.',
  blurb:
    'Drop a ball through rows of pegs and you cannot predict where it will land. Drop thousands and they always build the same smooth bell-shaped pile. This Galton board shows the central limit theorem — the reason heights, test scores and measurement errors so often follow a bell curve.',
  ideas: [
    'Each peg is a coin flip: bounce left or right.',
    'Landing spot = number of rightward bounces; there are many more paths to the middle than to the edges.',
    'The counts follow <b>Pascal’s triangle</b> — the binomial distribution.',
    'Add up many small random effects and you get the <b>normal distribution</b> (central limit theorem).',
  ],
  hint: 'Click the board to drop a handful of balls',
  thumbChapter: 1,
  thumbFrames: 700,
  params: [
    { key: 'rows', label: 'Rows of pegs', type: 'range', min: 4, max: 16, step: 1, value: 12, instant: true },
    { key: 'p', label: 'Chance of bouncing right', type: 'range', min: 0.1, max: 0.9, step: 0.01, value: 0.5, format: (v) => (v * 100).toFixed(0) + ' %' },
    { key: 'rate', label: 'Balls per second', type: 'range', min: 0, max: 60, step: 1, value: 20 },
    { key: 'curve', label: 'Show predicted curve', type: 'toggle', value: true },
    { key: 'clear', label: 'Empty the bins', type: 'button', action: (s) => s.clear() },
  ],
  story: [
    {
      title: 'One ball, many choices',
      text: 'A single ball falls through the pegs. At every peg it bounces left or right — a coin flip. Where will it land? There is no way to know.',
      params: { rows: 12, p: 0.5, rate: 0.7, curve: false },
      enter: (s) => s.clear(),
      duration: 10,
    },
    {
      title: 'Order out of randomness',
      text: 'Now let thousands fall. Each one is unpredictable, yet together they build the same shape every time: a smooth hill, highest in the middle — the <b>bell curve</b>.',
      params: { rate: 40, curve: false, p: 0.5 },
      enter: (s) => s.clear(),
      duration: 14,
    },
    {
      title: 'Counting paths',
      text: 'To land at the far left a ball must bounce left every single time — only one path does it. To land in the middle it can take any mix of lefts and rights: hundreds of paths. The dashed curve counts them exactly, using <b>Pascal’s triangle</b>.',
      formula: 'P(k) = C(n, k) · pᵏ · (1 − p)ⁿ⁻ᵏ',
      params: { curve: true, rate: 40 },
      duration: 15,
    },
    {
      title: 'Loaded pegs',
      text: 'Tilt the odds so each bounce goes right 70% of the time. The hill slides right but keeps its bell shape — just shifted and slightly narrower.',
      params: { p: 0.7, rate: 45, curve: true },
      enter: (s) => s.clear(),
      duration: 13,
    },
    {
      title: 'The central limit theorem',
      text: 'Whenever a result is the <b>sum of many small random effects</b> — genes adding to height, tiny errors adding to a measurement — it lands on a bell curve. It is one of the most powerful facts in all of mathematics.',
      formula: 'mean = n·p,    spread σ = √(n·p·(1 − p))',
      params: { p: 0.5, rows: 16, rate: 55 },
      enter: (s) => s.clear(),
      duration: 15,
    },
    {
      title: 'Experiment',
      text: 'Change the rows and the odds, or click on the board to drop extra balls. How many balls does it take before the pile matches the curve?',
      params: { rows: 10, rate: 25, p: 0.5 },
      enter: (s) => s.clear(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let balls = [], bins = [], total = 0, acc = 0, extra = 0;
    const rows = () => Math.round(params.rows);

    function clear() {
      balls = [];
      bins = new Array(rows() + 1).fill(0);
      total = 0;
    }
    clear();

    const geom = () => {
      const { w, h } = api;
      const n = rows();
      const top = 92;
      const bottom = h > 640 ? h * 0.78 : h - 24;
      const binH = Math.max(80, (bottom - top) * 0.42);
      const pegH = bottom - top - binH - 20;
      const dy = pegH / (n + 0.5);
      const dx = Math.min(dy * 1.25, (w * 0.8) / (n + 1));
      const cx = w < 900 ? w / 2 : w * 0.58;
      return { n, top, dy, dx, cx, binTop: bottom - binH, bottom, binH };
    };

    function drop(k = 1) {
      for (let i = 0; i < k; i++) balls.push({ row: -1, k: 0, t: Math.random() * 0.2, hue: Math.random(), dir: 0 });
    }

    return {
      clear,
      reset: clear,
      onParam(key) {
        if (key === 'rows') clear();
      },
      pointerDown() {
        extra += 25;
      },
      update(dt) {
        acc += dt * params.rate;
        while (acc >= 1) {
          drop();
          acc -= 1;
        }
        if (extra > 0) {
          const k = Math.min(extra, 3);
          drop(k);
          extra -= k;
        }
        const n = rows();
        const hop = 0.13;
        for (const b of balls) {
          b.t += dt / hop;
          while (b.t >= 1 && b.row < n) {
            b.t -= 1;
            b.row++;
            if (b.row < n) {
              b.dir = Math.random() < params.p ? 1 : 0;
              b.k += b.dir;
            }
          }
          if (b.row >= n && !b.done) {
            b.done = true;
            bins[b.k] = (bins[b.k] || 0) + 1;
            total++;
          }
        }
        balls = balls.filter((b) => !b.done);
        if (balls.length > 1500) balls.splice(0, balls.length - 1500);
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#140f26', grid: false });
        const g = geom();
        const { n, top, dy, dx, cx } = g;
        const pegX = (r, j) => cx + (j - r / 2) * dx;
        const pegY = (r) => top + (r + 0.5) * dy;
        // pegs
        ctx.fillStyle = 'rgba(200,210,255,0.55)';
        for (let r = 0; r < n; r++)
          for (let j = 0; j <= r; j++) {
            ctx.beginPath();
            ctx.arc(pegX(r, j), pegY(r), Math.max(1.6, dx * 0.07), 0, TAU);
            ctx.fill();
          }
        // funnel
        ctx.strokeStyle = 'rgba(200,210,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 40, top - 30);
        ctx.lineTo(cx - 8, top - 2);
        ctx.moveTo(cx + 40, top - 30);
        ctx.lineTo(cx + 8, top - 2);
        ctx.stroke();
        // bins
        const bw = dx;
        const x0 = cx - ((n + 1) / 2) * bw;
        ctx.strokeStyle = 'rgba(200,210,255,0.22)';
        ctx.beginPath();
        for (let k = 0; k <= n + 1; k++) {
          ctx.moveTo(x0 + k * bw, g.binTop);
          ctx.lineTo(x0 + k * bw, g.bottom);
        }
        ctx.moveTo(x0, g.bottom);
        ctx.lineTo(x0 + (n + 1) * bw, g.bottom);
        ctx.stroke();
        const maxBin = Math.max(1, ...bins);
        const expected = binom(n, params.p);
        const maxE = Math.max(...expected);
        const scale = (g.binH - 10) / Math.max(maxBin, total * maxE * 1.05);
        for (let k = 0; k <= n; k++) {
          const hgt = bins[k] * scale;
          const grd = ctx.createLinearGradient(0, g.bottom - hgt, 0, g.bottom);
          grd.addColorStop(0, '#ffd27a');
          grd.addColorStop(1, '#ff8a3d');
          ctx.fillStyle = grd;
          ctx.fillRect(x0 + k * bw + 2, g.bottom - hgt, bw - 4, hgt);
        }
        if (params.curve && total > 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.setLineDash([5, 4]);
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          const sd = Math.sqrt(n * params.p * (1 - params.p));
          for (let i = 0; i <= 200; i++) {
            const kx = -0.5 + ((n + 1) * i) / 200;
            const z = (kx - n * params.p) / Math.max(0.3, sd);
            const v = (total / (Math.max(0.3, sd) * Math.sqrt(TAU))) * Math.exp(-0.5 * z * z);
            ctx[i ? 'lineTo' : 'moveTo'](x0 + (kx + 0.5) * bw, g.bottom - v * scale);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
        // balls
        ctx.globalCompositeOperation = 'lighter';
        const rr = Math.max(2.5, dx * 0.16);
        for (const b of balls) {
          let x, y;
          if (b.row < 0) {
            x = cx;
            y = top - 20 + b.t * 20;
          } else {
            const t = clamp(b.t, 0, 1);
            const r0 = b.row, k0 = b.k - (b.row < n ? b.dir : 0);
            const xa = pegX(r0, k0), ya = pegY(r0) - rr * 1.6;
            const xb = r0 + 1 < n ? pegX(r0 + 1, b.k) : x0 + (b.k + 0.5) * bw;
            const yb = r0 + 1 < n ? pegY(r0 + 1) - rr * 1.6 : g.binTop;
            x = xa + (xb - xa) * t;
            y = ya + (yb - ya) * t - Math.sin(t * Math.PI) * dy * 0.35;
          }
          drawGlow(ctx, x, y, rr * 3, '#ffcf6b', 0.35);
        }
        ctx.globalCompositeOperation = 'source-over';
        if (!api.thumbnail) {
          tag(ctx, `${total} balls`, x0 + (n + 1) * bw, g.binTop - 18, C.amber, { align: 'right', size: 11 });
          if (n <= 12)
            for (let k = 0; k <= n; k++) text(ctx, String(bins[k]), x0 + (k + 0.5) * bw, g.bottom + 12, { size: 9, align: 'center', color: C.dim, mono: true });
        }
      },
      stats() {
        const n = rows();
        let mean = 0, v = 0;
        for (let k = 0; k <= n; k++) mean += k * bins[k];
        mean /= Math.max(1, total);
        for (let k = 0; k <= n; k++) v += bins[k] * (k - mean) ** 2;
        v /= Math.max(1, total);
        return [
          { label: 'Balls dropped', value: String(total) },
          { label: 'Average bin', value: mean.toFixed(2), color: C.amber },
          { label: 'Predicted average n·p', value: (n * params.p).toFixed(2) },
          { label: 'Spread σ', value: Math.sqrt(v).toFixed(2) },
          { label: 'Predicted σ', value: Math.sqrt(n * params.p * (1 - params.p)).toFixed(2) },
        ];
      },
      charts() {
        const n = rows();
        const e = binom(n, params.p).map((x) => x * total);
        return [{ title: 'Bin counts vs binomial prediction', kind: 'bars', series: [{ data: bins.slice(0, n + 1), color: C.amber }], ref: { data: e, color: '#ffffff' }, min: 0 }];
      },
    };
  },
};
