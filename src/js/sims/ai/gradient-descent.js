import { C, TAU, clamp, colormap, tag, text, Series, drawGlow, randn } from '../../core/util.js';

const LANDS = {
  bowl: {
    label: 'Simple valley',
    f: (x, y) => 0.5 * x * x + 2.5 * y * y,
    g: (x, y) => [x, 5 * y],
    dom: [-4, 4, -2.6, 2.6],
    start: [-3.5, 2.2],
  },
  himmel: {
    label: 'Four valleys',
    f: (x, y) => ((x * x + y - 11) ** 2 + (x + y * y - 7) ** 2) / 40,
    g: (x, y) => [(4 * x * (x * x + y - 11) + 2 * (x + y * y - 7)) / 40, (2 * (x * x + y - 11) + 4 * y * (x + y * y - 7)) / 40],
    dom: [-5.5, 5.5, -5, 5],
    start: [-0.3, -0.6],
  },
  rosen: {
    label: 'Banana ravine',
    f: (x, y) => ((1 - x) ** 2 + 20 * (y - x * x) ** 2) / 4,
    g: (x, y) => [(-2 * (1 - x) - 80 * x * (y - x * x)) / 4, (40 * (y - x * x)) / 4],
    dom: [-2.2, 2.2, -1.2, 3],
    start: [-1.8, 2.6],
  },
  bumpy: {
    label: 'Bumpy hills',
    f: (x, y) => 0.08 * (x * x + y * y) + 0.6 * (1 - Math.cos(2.2 * x) * Math.cos(2.2 * y)),
    g: (x, y) => [0.16 * x + 0.6 * 2.2 * Math.sin(2.2 * x) * Math.cos(2.2 * y), 0.16 * y + 0.6 * 2.2 * Math.cos(2.2 * x) * Math.sin(2.2 * y)],
    dom: [-5, 5, -3.6, 3.6],
    start: [-4.2, 3],
  },
};

const OPT = {
  sgd: { label: 'Plain gradient descent', color: '#ffffff' },
  momentum: { label: 'Momentum', color: '#ff5fa2' },
  adam: { label: 'Adam', color: '#38d6f5' },
};
const LUT = colormap(['#050816', '#0d1b4a', '#123f7a', '#1f7a8c', '#3fb07a', '#c8d65a', '#ffd27a', '#fff3d6']);

export default {
  id: 'gradient-descent',
  title: 'How Machines Learn: Gradient Descent',
  category: 'ai',
  tagline: 'Every AI model learns by rolling downhill. Watch three strategies race to the bottom.',
  ages: ['16+'],
  topics: ['Machine learning', 'Calculus'],
  blurb:
    'Training a neural network means finding the settings that make its error as small as possible. Picture the error as a landscape of hills and valleys; learning is walking downhill. Gradient descent takes steps in the steepest downhill direction. How big a step, and whether to build up momentum, makes all the difference.',
  ideas: [
    'The <b>gradient</b> points uphill; stepping the opposite way lowers the error.',
    'The <b>learning rate</b> sets the step size: too small is slow, too big overshoots and can explode.',
    '<b>Momentum</b> lets the walker build speed through flat areas and narrow ravines.',
    '<b>Adam</b> adapts the step for each direction — the default choice for most deep learning.',
  ],
  hint: 'Click anywhere on the map to start the walkers there',
  renderScale: 1,
  thumbChapter: 3,
  thumbFrames: 260,
  params: [
    { key: 'land', label: 'Landscape', type: 'select', value: 'bowl', options: Object.entries(LANDS).map(([k, l]) => ({ value: k, label: l.label })) },
    { key: 'lr', label: 'Learning rate', type: 'range', min: 0.005, max: 0.5, step: 0.005, value: 0.05, digits: 3 },
    { key: 'sgd', label: 'Plain gradient descent', type: 'toggle', value: true },
    { key: 'momentum', label: 'Momentum', type: 'toggle', value: false },
    { key: 'adam', label: 'Adam', type: 'toggle', value: false },
    { key: 'noise', label: 'Noisy gradients (mini-batches)', type: 'range', min: 0, max: 1, step: 0.05, value: 0 },
    { key: 'speed', label: 'Steps per second', type: 'range', min: 2, max: 60, step: 1, value: 20 },
    { key: 'restart', label: 'Restart walkers', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'Learning is going downhill',
      text: 'The colours show a model’s error for every combination of two settings: dark is low, bright is high. The white walker starts high up. At each step it feels the slope beneath its feet and steps <b>downhill</b>.',
      formula: 'θ ← θ − η · ∇L(θ)',
      params: { land: 'bowl', lr: 0.06, sgd: true, momentum: false, adam: false, noise: 0, speed: 14 },
      enter: (s) => s.restart(),
      duration: 12,
    },
    {
      title: 'Too big a step',
      text: 'Raise the learning rate and the walker overshoots the valley floor, bouncing from wall to wall. A little more and it flies off entirely: training “diverges”. Tuning the learning rate is a big part of training real AI models.',
      params: { lr: 0.38, land: 'bowl', sgd: true, momentum: false, adam: false, noise: 0 },
      enter: (s) => s.restart(),
      duration: 13,
    },
    {
      title: 'The narrow ravine',
      text: 'Many real error landscapes have long, curving ravines. Plain descent zig-zags across the steep walls and crawls along the floor. <b>Momentum</b> (pink) remembers its direction, like a heavy ball, and races along the ravine.',
      params: { land: 'rosen', lr: 0.012, sgd: true, momentum: true, adam: false, noise: 0, speed: 30 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Adam',
      text: '<b>Adam</b> (cyan) keeps a running average of both the slope and its size, giving each direction its own step. It handles awkward terrain gracefully, which is why it trains most of today’s neural networks.',
      params: { land: 'rosen', lr: 0.012, sgd: true, momentum: true, adam: true, noise: 0, speed: 30 },
      enter: (s) => s.restart(),
      duration: 14,
    },
    {
      title: 'Which valley?',
      text: 'Landscapes can have several valleys. Where you end up depends on where you start. Here the walkers set off from the same point, but their different habits carry them into different valleys.',
      params: { land: 'himmel', lr: 0.04, sgd: true, momentum: true, adam: true, noise: 0, speed: 20 },
      enter: (s) => s.restart(),
      duration: 14,
    },
    {
      title: 'Bumps and noise',
      text: 'On a bumpy landscape plain descent gets stuck in the first dip. Real training uses small random batches of data, so the slope is <b>noisy</b> — and that jitter, plus momentum, helps walkers escape shallow traps.',
      params: { land: 'bumpy', lr: 0.08, noise: 0.6, sgd: true, momentum: true, adam: true, speed: 24 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Pick a landscape, toggle optimisers and tune the learning rate. Click the map to choose a new starting point.',
      params: { land: 'himmel', noise: 0, lr: 0.05 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let walkers = [], start = null, acc = 0, mapKey = '', off = null;
    const series = { sgd: new Series(200), momentum: new Series(200), adam: new Series(200) };
    const L = () => LANDS[params.land] || LANDS.bowl;

    function restart(at) {
      const land = L();
      start = at || start || land.start;
      walkers = Object.keys(OPT).map((k) => ({ k, x: start[0], y: start[1], vx: 0, vy: 0, m: [0, 0], v: [0, 0], t: 0, trail: [[start[0], start[1]]], dead: false }));
      for (const s of Object.values(series)) s.clear();
    }

    function step(w) {
      const land = L();
      let [gx, gy] = land.g(w.x, w.y);
      if (params.noise > 0) {
        const s = params.noise * (0.6 + Math.hypot(gx, gy) * 0.6);
        gx += randn() * s;
        gy += randn() * s;
      }
      const lr = params.lr;
      if (w.k === 'sgd') {
        w.x -= lr * gx;
        w.y -= lr * gy;
      } else if (w.k === 'momentum') {
        w.vx = 0.9 * w.vx - lr * gx;
        w.vy = 0.9 * w.vy - lr * gy;
        w.x += w.vx;
        w.y += w.vy;
      } else {
        w.t++;
        const b1 = 0.9, b2 = 0.999, eps = 1e-8, a = lr * 3;
        w.m[0] = b1 * w.m[0] + (1 - b1) * gx;
        w.m[1] = b1 * w.m[1] + (1 - b1) * gy;
        w.v[0] = b2 * w.v[0] + (1 - b2) * gx * gx;
        w.v[1] = b2 * w.v[1] + (1 - b2) * gy * gy;
        const mh0 = w.m[0] / (1 - b1 ** w.t), mh1 = w.m[1] / (1 - b1 ** w.t);
        const vh0 = w.v[0] / (1 - b2 ** w.t), vh1 = w.v[1] / (1 - b2 ** w.t);
        w.x -= (a * mh0) / (Math.sqrt(vh0) + eps);
        w.y -= (a * mh1) / (Math.sqrt(vh1) + eps);
      }
      const [x0, x1, y0, y1] = land.dom;
      if (!isFinite(w.x) || !isFinite(w.y) || Math.abs(w.x) > 6 * Math.max(-x0, x1) || Math.abs(w.y) > 6 * Math.max(-y0, y1)) w.dead = true;
      w.trail.push([w.x, w.y]);
      if (w.trail.length > 400) w.trail.shift();
    }

    function renderMap() {
      const { w, h } = api;
      const land = L();
      const key = `${params.land}|${w}|${h}`;
      if (key === mapKey) return;
      mapKey = key;
      start = null;
      const gw = Math.max(60, Math.round(w / 3)), gh = Math.max(40, Math.round(h / 3));
      off = document.createElement('canvas');
      off.width = gw;
      off.height = gh;
      const g = off.getContext('2d');
      const im = g.createImageData(gw, gh);
      const [x0, x1, y0, y1] = land.dom;
      const vals = new Float32Array(gw * gh);
      let lo = Infinity, hi = -Infinity;
      for (let j = 0; j < gh; j++)
        for (let i = 0; i < gw; i++) {
          const v = Math.log1p(land.f(x0 + ((i + 0.5) / gw) * (x1 - x0), y1 - ((j + 0.5) / gh) * (y1 - y0)) * 4);
          vals[j * gw + i] = v;
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
      for (let k = 0; k < gw * gh; k++) {
        const t = (vals[k] - lo) / (hi - lo);
        // contour banding
        const band = 0.86 + 0.14 * Math.abs(((t * 14) % 1) - 0.5) * 2;
        const c = Math.floor(clamp(t, 0, 1) * 255) * 3;
        im.data[k * 4] = LUT[c] * band;
        im.data[k * 4 + 1] = LUT[c + 1] * band;
        im.data[k * 4 + 2] = LUT[c + 2] * band;
        im.data[k * 4 + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      restart(land.start);
    }

    const toPx = (x, y) => {
      const [x0, x1, y0, y1] = L().dom;
      return [((x - x0) / (x1 - x0)) * api.w, ((y1 - y) / (y1 - y0)) * api.h];
    };

    return {
      restart: () => restart(),
      reset: () => restart(),
      onParam(k) {
        if (k === 'land') {
          mapKey = '';
          renderMap();
        }
      },
      pointerDown(p) {
        const [x0, x1, y0, y1] = L().dom;
        restart([x0 + (p.x / api.w) * (x1 - x0), y1 - (p.y / api.h) * (y1 - y0)]);
      },
      update(dt) {
        renderMap();
        acc += dt * params.speed;
        let n = 0;
        while (acc >= 1 && n++ < 20) {
          acc -= 1;
          for (const w of walkers) if (params[w.k] && !w.dead) step(w);
          for (const w of walkers) if (params[w.k]) series[w.k].push(w.dead ? NaN : Math.log10(L().f(w.x, w.y) + 1e-4));
        }
      },
      draw() {
        const { w, h } = api;
        renderMap();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, w, h);
        // minimum markers
        for (const wk of walkers) {
          if (!params[wk.k]) continue;
          const col = OPT[wk.k].color;
          ctx.strokeStyle = col;
          ctx.globalAlpha = 0.85;
          ctx.lineWidth = 1.8;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          wk.trail.forEach(([x, y], i) => {
            const [px, py] = toPx(x, y);
            ctx[i ? 'lineTo' : 'moveTo'](px, py);
          });
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = col;
          for (const [x, y] of wk.trail.slice(-40)) {
            const [px, py] = toPx(x, y);
            ctx.beginPath();
            ctx.arc(px, py, 1.6, 0, TAU);
            ctx.fill();
          }
          if (!wk.dead) {
            const [px, py] = toPx(wk.x, wk.y);
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, px, py, 20, col === '#ffffff' ? '#e9edf7' : col, 0.3);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, TAU);
            ctx.fill();
          }
        }
        if (start) {
          const [sx, sy] = toPx(start[0], start[1]);
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sx - 6, sy - 6);
          ctx.lineTo(sx + 6, sy + 6);
          ctx.moveTo(sx + 6, sy - 6);
          ctx.lineTo(sx - 6, sy + 6);
          ctx.stroke();
        }
        if (!api.thumbnail) {
          let y = 84;
          for (const k of Object.keys(OPT)) {
            if (!params[k]) continue;
            const wk = walkers.find((q) => q.k === k);
            tag(ctx, `${OPT[k].label}${wk?.dead ? ' — diverged!' : ''}`, w - 16, y, wk?.dead ? C.red : OPT[k].color, { align: 'right', size: 11 });
            y += 26;
          }
          text(ctx, 'low error', 16, h - 16, { size: 10, color: C.dim });
        }
      },
      stats() {
        const out = [{ label: 'Learning rate η', value: params.lr.toFixed(3), color: C.amber }];
        for (const k of Object.keys(OPT)) {
          if (!params[k]) continue;
          const wk = walkers.find((q) => q.k === k);
          out.push({ label: OPT[k].label + ' error', value: wk.dead ? 'diverged' : L().f(wk.x, wk.y).toFixed(4), color: OPT[k].color });
        }
        return out;
      },
      charts() {
        const s = Object.keys(OPT).filter((k) => params[k]).map((k) => ({ data: series[k].data, color: OPT[k].color, fill: false, label: OPT[k].label.split(' ')[0] }));
        return [{ title: 'Error (log scale) per step', series: s, length: 200 }];
      },
    };
  },
};
