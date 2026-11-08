import { C, Series, backdrop, drawGlow, randn, tag, TAU } from '../../core/util.js';

export default {
  id: 'brownian',
  title: 'Brownian Motion',
  category: 'physics',
  tagline: 'The restless jiggle of pollen grains that finally proved atoms are real.',
  blurb:
    'In 1827 Robert Brown saw pollen grains in water dancing endlessly with no apparent cause. In 1905 Einstein explained it: the grains are being battered by invisible water molecules. His math let scientists count atoms for the first time.',
  ideas: [
    'Visible grains are kicked by countless invisible molecules from random directions.',
    'Each grain follows a <b>random walk</b>: its average squared distance grows in proportion to time.',
    'Hotter fluids mean faster molecules and a more violent jiggle.',
    'Brownian motion is the microscopic engine of <b>diffusion</b>.',
  ],
  hint: 'Toggle “Reveal molecules” to see what’s really going on',
  params: [
    { key: 'grains', label: 'Grains', type: 'range', min: 1, max: 40, step: 1, value: 1, instant: true },
    { key: 'size', label: 'Grain size', type: 'range', min: 8, max: 30, step: 1, value: 20, unit: 'px', instant: true },
    { key: 'T', label: 'Temperature', type: 'range', min: 100, max: 900, step: 10, value: 300, unit: 'K' },
    { key: 'reveal', label: 'Reveal molecules', type: 'toggle', value: false },
    { key: 'trail', label: 'Show paths', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'A mysterious jiggle',
      text: 'Under a microscope a pollen grain in water never sits still. It wanders and trembles, forever. For decades nobody could explain why.',
      params: { grains: 1, size: 20, reveal: false, trail: true, T: 300 },
      duration: 11,
    },
    {
      title: 'Reveal the molecules',
      text: 'The grain is surrounded by water molecules far too small to see, each moving at hundreds of metres per second. At any instant, slightly more hit one side than the other — and the grain gets shoved.',
      params: { reveal: true },
      duration: 13,
    },
    {
      title: 'A random walk',
      text: 'Hide the molecules again and follow the path. It has no memory: every step is a fresh coin-flip. Zoom into any piece and it looks just as jagged — a hint of <b>fractal</b> geometry.',
      params: { reveal: false, trail: true },
      duration: 12,
    },
    {
      title: 'Einstein’s insight',
      text: 'Einstein showed that the <b>mean squared distance</b> grows in a straight line with time. Measuring its slope reveals how big molecules are — the first way to count atoms.',
      formula: '⟨r<sup>2</sup>⟩ = 4 D t',
      params: { grains: 20, size: 14, trail: true },
      duration: 14,
    },
    {
      title: 'Turn up the heat',
      text: 'Hotter water means faster molecules and harder kicks. The grains diffuse faster — the slope of the chart gets steeper.',
      params: { T: 900 },
      duration: 12,
    },
    {
      title: 'Big and small',
      text: 'Small grains jiggle far more than big ones. Try sliding the grain size and temperature yourself.',
      params: { grains: 8, size: 10, T: 400, reveal: true },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let mols = [], grains = [], msd = new Series(400), t = 0;
    const NM = 2600;

    function vT() {
      return 190 * Math.sqrt(params.T / 300);
    }
    function init() {
      const { w, h } = api;
      mols = [];
      const s = vT() / Math.SQRT2;
      for (let i = 0; i < NM; i++) mols.push({ x: Math.random() * w, y: Math.random() * h, vx: randn() * s, vy: randn() * s });
      grains = [];
      const n = Math.round(params.grains);
      const R = params.size;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const rr = n === 1 ? 0 : Math.min(w, h) * 0.06 * Math.sqrt(i / n) * 2;
        const x = w / 2 + Math.cos(a * 7.3) * rr, y = h * 0.45 + Math.sin(a * 7.3) * rr;
        grains.push({ x, y, x0: x, y0: y, vx: 0, vy: 0, R, M: R * R * 0.22, trail: [x, y], hue: 35 + ((i * 47) % 50) });
      }
      msd.clear();
      t = 0;
    }

    return {
      resize: init,
      reset: init,
      onParam(k) {
        if (k === 'grains' || k === 'size') init();
      },
      update(dt) {
        const { w, h } = api;
        t += dt;
        const target = vT();
        const sub = 2, hh = dt / sub;
        // molecules: thermal bath, re-thermalized at the walls
        for (let s = 0; s < sub; s++) {
          for (const m of mols) {
            m.x += m.vx * hh;
            m.y += m.vy * hh;
            if (m.x < 0 || m.x > w || m.y < 0 || m.y > h) {
              const sp = target / Math.SQRT2;
              if (m.x < 0) { m.x = 0; m.vx = Math.abs(randn() * sp); m.vy = randn() * sp; }
              if (m.x > w) { m.x = w; m.vx = -Math.abs(randn() * sp); m.vy = randn() * sp; }
              if (m.y < 0) { m.y = 0; m.vy = Math.abs(randn() * sp); m.vx = randn() * sp; }
              if (m.y > h) { m.y = h; m.vy = -Math.abs(randn() * sp); m.vx = randn() * sp; }
            }
            for (const g of grains) {
              const dx = m.x - g.x, dy = m.y - g.y;
              const d2 = dx * dx + dy * dy;
              if (d2 > g.R * g.R || d2 === 0) continue;
              const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
              const rel = (m.vx - g.vx) * nx + (m.vy - g.vy) * ny;
              if (rel < 0) {
                const j = (2 * rel) / (1 + 1 / g.M);
                m.vx -= j * nx;
                m.vy -= j * ny;
                g.vx += (j * nx) / g.M;
                g.vy += (j * ny) / g.M;
              }
              m.x = g.x + nx * (g.R + 0.5);
              m.y = g.y + ny * (g.R + 0.5);
            }
          }
          for (const g of grains) {
            g.x += g.vx * hh;
            g.y += g.vy * hh;
            if (g.x < g.R) { g.x = g.R; g.vx = Math.abs(g.vx); }
            if (g.x > w - g.R) { g.x = w - g.R; g.vx = -Math.abs(g.vx); }
            if (g.y < g.R) { g.y = g.R; g.vy = Math.abs(g.vy); }
            if (g.y > h - g.R) { g.y = h - g.R; g.vy = -Math.abs(g.vy); }
          }
        }
        let sum = 0;
        for (const g of grains) {
          const last = g.trail.length;
          if (Math.hypot(g.x - g.trail[last - 2], g.y - g.trail[last - 1]) > 1.5) g.trail.push(g.x, g.y);
          if (g.trail.length > 3000) g.trail.splice(0, 2);
          sum += (g.x - g.x0) ** 2 + (g.y - g.y0) ** 2;
        }
        if (api.frame % 4 === 0) msd.push(sum / Math.max(1, grains.length));
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#071426', edge: '#02060c', gridSize: 50 });
        ctx.globalCompositeOperation = 'lighter';
        if (params.reveal) {
          ctx.fillStyle = 'rgba(120,200,255,0.55)';
          for (const m of mols) ctx.fillRect(m.x - 1, m.y - 1, 2, 2);
        }
        if (params.trail) {
          ctx.lineJoin = 'round';
          for (const g of grains) {
            const tr = g.trail;
            ctx.strokeStyle = `hsla(${g.hue},100%,65%,${grains.length > 5 ? 0.35 : 0.7})`;
            ctx.lineWidth = grains.length > 5 ? 1 : 1.6;
            ctx.beginPath();
            ctx.moveTo(tr[0], tr[1]);
            for (let i = 2; i < tr.length; i += 2) ctx.lineTo(tr[i], tr[i + 1]);
            ctx.stroke();
          }
        }
        for (const g of grains) drawGlow(ctx, g.x, g.y, g.R * 2.6, '#ffb547', 0.3);
        ctx.globalCompositeOperation = 'source-over';
        for (const g of grains) {
          const gr = ctx.createRadialGradient(g.x - g.R * 0.3, g.y - g.R * 0.35, g.R * 0.1, g.x, g.y, g.R);
          gr.addColorStop(0, '#fff3c4');
          gr.addColorStop(0.5, `hsl(${g.hue},90%,58%)`);
          gr.addColorStop(1, `hsl(${g.hue - 10},80%,30%)`);
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.R, 0, TAU);
          ctx.fill();
        }
        if (!api.thumbnail && grains.length === 1) tag(ctx, 'pollen grain', grains[0].x, grains[0].y - grains[0].R - 18, C.amber, { align: 'center' });
      },
      stats() {
        let v = 0;
        for (const g of grains) v += Math.hypot(g.vx, g.vy);
        const D = t > 1 && msd.last ? msd.last / (4 * t) : 0;
        return [
          { label: 'Grains', value: String(grains.length) },
          { label: 'Avg grain speed', value: (v / Math.max(1, grains.length)).toFixed(1) + ' px/s' },
          { label: 'Molecule speed', value: vT().toFixed(0) + ' px/s' },
          { label: 'Diffusion coeff. D', value: D.toFixed(1) },
        ];
      },
      charts() {
        return [{ title: 'Mean squared displacement ⟨r²⟩', series: [{ data: msd.data, color: '#ffb547' }], min: 0, length: 400, xLabel: 'time →' }];
      },
    };
  },
};
