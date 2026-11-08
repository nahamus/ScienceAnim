import { C, clamp, backdrop, tag, text, Series, drawGlow } from '../../core/util.js';

const ZOOMS = {
  full: [2.4, 4, 0, 1],
  chaos: [3.4, 4, 0, 1],
  window: [3.8, 3.87, 0.12, 1],
};

export default {
  id: 'logistic-map',
  title: 'The Road to Chaos',
  category: 'math',
  tagline: 'One tiny equation for population growth — and it breaks into chaos.',
  blurb:
    'Model a population that grows quickly but is limited by food: next year = r × this year × (1 − this year). Turn up the growth rate r and the population settles, then flips between two values, then four, eight… and finally behaves chaotically, never repeating. This “period-doubling route to chaos” turns up in dripping taps, heart rhythms and lasers.',
  ideas: [
    'A <b>deterministic</b> rule — no randomness at all — can still behave unpredictably.',
    'As r grows, the stable population <b>splits in two</b>, then four, eight, … ever faster.',
    'Beyond r ≈ 3.57 the population is <b>chaotic</b>: tiny differences explode.',
    'Inside the chaos there are calm <b>windows</b> — and the whole picture repeats at smaller scales.',
  ],
  hint: 'Click the diagram to set the growth rate',
  thumbChapter: 3,
  thumbFrames: 260,
  params: [
    { key: 'r', label: 'Growth rate r', type: 'range', min: 2.4, max: 4, step: 0.001, value: 2.8, digits: 3 },
    { key: 'zoom', label: 'Diagram range', type: 'select', value: 'full', options: [{ value: 'full', label: 'Full' }, { value: 'chaos', label: 'Chaos zone' }, { value: 'window', label: 'Period-3 window' }] },
    { key: 'twin', label: 'Show a twin (start 0.0001 apart)', type: 'toggle', value: false },
    { key: 'speed', label: 'Years per second', type: 'range', min: 1, max: 30, step: 1, value: 6 },
  ],
  story: [
    {
      title: 'A population with limits',
      text: 'Each year the population grows by a factor r, but crowding holds it back. Follow it on the cobweb plot: up to the curve gives next year, across to the diagonal makes that this year, and repeat. At r = 2.8 it spirals in to a <b>steady</b> value.',
      formula: 'xₙ₊₁ = r · xₙ · (1 − xₙ)',
      params: { r: 2.8, zoom: 'full', twin: false, speed: 6 },
      duration: 13,
    },
    {
      title: 'Boom and bust',
      text: 'Raise r past 3 and the steady state splits: the population now <b>alternates</b> between a high year and a low year forever. The bifurcation diagram shows where the population ends up for every r.',
      params: { r: 3.2, zoom: 'full', twin: false },
      tween: 3,
      duration: 12,
    },
    {
      title: 'Doubling, doubling…',
      text: 'At 3.45 the cycle splits again into four years, then eight at 3.54, sixteen… Each doubling arrives sooner — shrinking by Feigenbaum’s constant, the same number for countless systems.',
      formula: 'δ = 4.669 201 609…',
      params: { r: 3.5, zoom: 'full', twin: false },
      tween: 3,
      duration: 13,
    },
    {
      title: 'Chaos',
      text: 'Beyond about 3.57 the population never repeats. Turn on the twin: a second population starting just 0.0001 away soon does something completely different. That <b>sensitivity</b> is what makes weather unpredictable.',
      params: { r: 3.9, twin: true, zoom: 'chaos' },
      tween: 3,
      duration: 15,
    },
    {
      title: 'Islands of order',
      text: 'Zoom into the chaos near r = 3.83 and a calm <b>window</b> opens with a cycle of 3 — which then doubles and descends into chaos all over again: a miniature copy of the whole diagram.',
      params: { r: 3.835, zoom: 'window', twin: false },
      tween: 2,
      duration: 15,
    },
    {
      title: 'Explore',
      text: 'Click anywhere on the diagram to choose r, and switch ranges to dive into the structure.',
      params: { zoom: 'full', r: 3.74 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let x = 0.2, y = 0.2001, acc = 0, path = [], col = 0, off, octx, img, density, bw = 0, bh = 0, key = '';
    const sX = new Series(120), sY = new Series(120);

    const layout = () => {
      const { w, h } = api;
      const top = 80, bottom = h > 640 ? h * 0.72 : h - 20;
      if (w >= 760) {
        const S = Math.min(bottom - top, w * 0.36);
        return { cob: { x: 24, y: top, s: S }, bif: { x: 24 + S + 30, y: top, w: w - S - 78, h: bottom - top } };
      }
      return { cob: null, bif: { x: 16, y: top, w: w - 32, h: bottom - top } };
    };

    function resetDiagram() {
      const L = layout().bif;
      bw = Math.max(50, Math.floor(L.w));
      bh = Math.max(50, Math.floor(L.h));
      off = document.createElement('canvas');
      off.width = bw;
      off.height = bh;
      octx = off.getContext('2d');
      img = octx.createImageData(bw, bh);
      density = new Float32Array(bw * bh);
      col = 0;
      key = `${params.zoom}|${bw}|${bh}`;
    }

    function computeColumns(k) {
      const [r0, r1, y0, y1] = ZOOMS[params.zoom] || ZOOMS.full;
      const d = img.data;
      for (let c = 0; c < k && col < bw; c++, col++) {
        const r = r0 + ((col + 0.5) / bw) * (r1 - r0);
        let v = 0.5;
        for (let i = 0; i < 400; i++) v = r * v * (1 - v);
        for (let i = 0; i < 600; i++) {
          v = r * v * (1 - v);
          const row = Math.floor((1 - (v - y0) / (y1 - y0)) * bh);
          if (row >= 0 && row < bh) density[row * bw + col] += 1;
        }
        for (let row = 0; row < bh; row++) {
          const q = density[row * bw + col];
          const t = clamp(Math.log1p(q) / 3.2, 0, 1);
          const j = (row * bw + col) * 4;
          d[j] = 80 + 175 * t;
          d[j + 1] = 120 + 110 * t;
          d[j + 2] = 255;
          d[j + 3] = q > 0 ? 60 + 195 * t : 0;
        }
      }
      octx.putImageData(img, 0, 0);
    }

    resetDiagram();

    return {
      resize() {
        resetDiagram();
      },
      onParam(k) {
        if (k === 'r') path = path.slice(-4);
        if (k === 'zoom') resetDiagram();
      },
      pointerDown(p) {
        const L = layout().bif;
        if (p.x < L.x || p.x > L.x + L.w) return;
        const [r0, r1] = ZOOMS[params.zoom] || ZOOMS.full;
        api.runner.set('r', clamp(r0 + ((p.x - L.x) / L.w) * (r1 - r0), 2.4, 4));
      },
      reset() {
        x = 0.2;
        y = 0.2001;
        path = [];
      },
      update(dt) {
        if (key !== `${params.zoom}|${bw}|${bh}`) resetDiagram();
        computeColumns(api.thumbnail ? bw : 14);
        acc += dt * params.speed;
        while (acc >= 1) {
          acc -= 1;
          const nx = params.r * x * (1 - x);
          path.push([x, nx]);
          if (path.length > 60) path.shift();
          x = nx;
          y = params.r * y * (1 - y);
          if (!params.twin) y = x + 0.0001;
          sX.push(x);
          sY.push(y);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0b0f22', grid: false });
        const L = layout();
        const [r0, r1, y0, y1] = ZOOMS[params.zoom] || ZOOMS.full;
        // bifurcation diagram
        const B = L.bif;
        ctx.fillStyle = 'rgba(10,14,32,0.6)';
        ctx.fillRect(B.x, B.y, B.w, B.h);
        ctx.drawImage(off, B.x, B.y, B.w, B.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(B.x, B.y, B.w, B.h);
        const rx = B.x + ((params.r - r0) / (r1 - r0)) * B.w;
        if (rx >= B.x && rx <= B.x + B.w) {
          ctx.strokeStyle = 'rgba(255,181,71,0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(rx, B.y);
          ctx.lineTo(rx, B.y + B.h);
          ctx.stroke();
          ctx.globalCompositeOperation = 'lighter';
          for (const [, v] of path.slice(-24)) {
            const py = B.y + (1 - (v - y0) / (y1 - y0)) * B.h;
            if (py > B.y && py < B.y + B.h) drawGlow(ctx, rx, py, 9, '#ffb547', 0.3);
          }
          ctx.globalCompositeOperation = 'source-over';
        }
        if (!api.thumbnail) {
          text(ctx, r0.toFixed(2), B.x + 4, B.y + B.h + 12, { size: 10, color: C.dim, mono: true });
          text(ctx, r1.toFixed(2), B.x + B.w - 4, B.y + B.h + 12, { size: 10, color: C.dim, mono: true, align: 'right' });
          text(ctx, 'growth rate r →', B.x + B.w / 2, B.y + B.h + 12, { size: 10, color: C.dim, align: 'center' });
          tag(ctx, `r = ${params.r.toFixed(3)}`, clamp(rx, B.x + 40, B.x + B.w - 40), B.y - 2 + 14, C.amber, { align: 'center', size: 11 });
        }
        // cobweb
        if (L.cob) {
          const { x: cx, y: cy, s } = L.cob;
          const P = (a, b) => [cx + a * s, cy + (1 - b) * s];
          ctx.fillStyle = 'rgba(10,14,32,0.6)';
          ctx.fillRect(cx, cy, s, s);
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.strokeRect(cx, cy, s, s);
          ctx.strokeStyle = 'rgba(233,237,247,0.3)';
          ctx.beginPath();
          ctx.moveTo(...P(0, 0));
          ctx.lineTo(...P(1, 1));
          ctx.stroke();
          ctx.strokeStyle = C.cyan;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const a = i / 100;
            const [px, py] = P(a, params.r * a * (1 - a));
            ctx[i ? 'lineTo' : 'moveTo'](px, py);
          }
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,181,71,0.8)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          path.forEach(([a, b], i) => {
            const p1 = P(a, a), p2 = P(a, b), p3 = P(b, b);
            if (i === 0) ctx.moveTo(...p1);
            ctx.lineTo(...p2);
            ctx.lineTo(...p3);
          });
          ctx.stroke();
          if (!api.thumbnail) {
            text(ctx, 'this year →', cx + s - 4, cy + s + 12, { size: 10, color: C.dim, align: 'right' });
            text(ctx, 'next year', cx + 4, cy + 12, { size: 10, color: C.dim });
          }
        }
      },
      stats() {
        // detect period of the current orbit
        let v = x;
        const seq = [];
        for (let i = 0; i < 64; i++) seq.push((v = params.r * v * (1 - v)));
        let period = '—';
        for (let p = 1; p <= 32; p++) {
          if (Math.abs(seq[63] - seq[63 - p]) < 1e-4 && Math.abs(seq[62] - seq[62 - p]) < 1e-4) {
            period = String(p);
            break;
          }
        }
        if (period === '—') period = params.r > 3.56 ? 'chaotic' : 'settling…';
        return [
          { label: 'Growth rate r', value: params.r.toFixed(3), color: C.amber },
          { label: 'Population now', value: x.toFixed(4) },
          { label: 'Cycle length', value: period, color: C.cyan },
          { label: 'Twin difference', value: params.twin ? Math.abs(x - y).toFixed(4) : '—', color: C.pink },
        ];
      },
      charts() {
        return [{ title: 'Population year by year', series: params.twin ? [{ data: sX.data, color: C.amber, fill: false }, { data: sY.data, color: C.pink, fill: false, label: 'twin' }] : [{ data: sX.data, color: C.amber }], min: 0, max: 1, length: 120 }];
      },
    };
  },
};
