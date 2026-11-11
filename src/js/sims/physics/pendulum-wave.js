import { C, TAU, backdrop, drawGlow, tag } from '../../core/util.js';

const COUNT = 16, CYCLE = 60, BASE = 51;

function hslHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export default {
  id: 'pendulum-wave',
  title: 'Pendulum Waves',
  category: 'physics',
  tagline: 'Sixteen simple pendulums dance in snakes, braids and chaos — then fall back in step.',
  ages: ['11-14', '14-16'],
  topics: ['Oscillations', 'Waves'],
  blurb:
    'Each pendulum is a little shorter than the one before, so it swings a little faster. Released together, they slowly drift out of step, forming travelling waves, braids and apparent chaos — until, exactly 60 seconds later, they all line up again. A hypnotic lesson in frequency and phase.',
  ideas: [
    'A pendulum’s period depends only on its <b>length</b>: T = 2π√(L/g).',
    'Neighbouring pendulums differ by exactly one swing per minute.',
    'The changing <b>phase differences</b> between them create travelling waves.',
    'After one full cycle every pendulum has made a whole number of swings, so they <b>realign</b>.',
  ],
  hint: 'Drag horizontally to orbit the camera',
  thumbChapter: 1,
  thumbFrames: 2,
  params: [
    { key: 'speed', label: 'Time speed', type: 'range', min: 0, max: 4, step: 0.05, value: 1, format: (v) => v.toFixed(2) + '×' },
    { key: 'view', label: 'Camera angle', type: 'range', min: -80, max: 80, step: 1, value: 25, unit: '°' },
    { key: 'trails', label: 'Bob trails', type: 'toggle', value: true },
    { key: 'restart', label: 'Release together', type: 'button', action: (s) => s.setT(0) },
  ],
  story: [
    {
      title: 'Sixteen pendulums',
      text: 'Sixteen pendulums hang from one bar, each slightly shorter than its neighbour. They are pulled back together and released. For a moment they swing as one.',
      formula: 'T = 2π √(L / g)',
      params: { speed: 1, view: 25 },
      enter: (s) => s.setT(0),
      duration: 10,
    },
    {
      title: 'A travelling snake',
      text: 'Shorter pendulums swing faster, so they pull ahead. The growing phase differences make a smooth wave that seems to slither along the line — though no pendulum moves sideways at all.',
      params: { view: 10 },
      enter: (s) => s.setT(5),
      duration: 12,
    },
    {
      title: 'Braids and chaos',
      text: 'As the differences grow the pattern breaks into two, three, four interleaved waves, then into what looks like chaos. It is not: every pendulum is still perfectly regular.',
      params: { speed: 1 },
      enter: (s) => s.setT(12),
      duration: 13,
    },
    {
      title: 'Halfway: two teams',
      text: 'At 30 seconds every other pendulum is exactly opposite its neighbour. The line splits into two groups swinging against each other.',
      params: { speed: 0.5, view: 0 },
      enter: (s) => s.setT(29),
      duration: 12,
    },
    {
      title: 'Back in step',
      text: 'In one minute the longest pendulum swings 51 times, the next 52, … the shortest 66. Each has completed a whole number of swings, so at 60 seconds they <b>all line up again</b>.',
      formula: 'swings per minute = 51 + n,   n = 0, 1, … 15',
      params: { speed: 1, view: 30 },
      enter: (s) => s.setT(52),
      duration: 14,
    },
    {
      title: 'Watch from the end',
      text: 'Swing the camera round to look along the bar. Use the slider to speed up time and see a whole cycle in seconds.',
      params: { view: 75, speed: 2 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0, dragX = null;
    const trails = Array.from({ length: COUNT }, () => []);
    const omega = Array.from({ length: COUNT }, (_, i) => (TAU * (BASE + i)) / CYCLE);
    const len = omega.map((w) => 1 / (w * w));
    const lmax = len[0];
    const hues = Array.from({ length: COUNT }, (_, i) => 200 + (i / (COUNT - 1)) * 140);
    const glowCols = hues.map((hh) => hslHex(hh % 360, 90, 60));

    const setT = (v) => {
      t = v;
      for (const tr of trails) tr.length = 0;
    };

    function project(x, y, z) {
      const a = (params.view * Math.PI) / 180;
      const pitch = 0.32;
      const xr = x * Math.cos(a) + z * Math.sin(a);
      const zr = -x * Math.sin(a) + z * Math.cos(a);
      const yr = y * Math.cos(pitch) - zr * Math.sin(pitch);
      const zz = y * Math.sin(pitch) + zr * Math.cos(pitch);
      const S = Math.min(api.w * 0.4, api.h * 0.62);
      const d = 4.5;
      const f = d / (d + zz);
      return [api.w / 2 + xr * S * f, api.h * 0.2 - yr * S * f, f, zz];
    }

    return {
      setT,
      reset: () => setT(0),
      pointerDown(p) {
        dragX = p.x;
      },
      pointerMove(p) {
        if (!p.down || dragX === null) return;
        const v = Math.max(-80, Math.min(80, params.view + (p.x - dragX) * 0.3));
        dragX = p.x;
        api.runner.set('view', v);
      },
      pointerUp() {
        dragX = null;
      },
      update(dt) {
        t += dt * params.speed;
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0f0d22', grid: false });
        const A = 0.32;
        const items = [];
        for (let i = 0; i < COUNT; i++) {
          const z = -0.9 + (1.8 * i) / (COUNT - 1);
          const L = (len[i] / lmax) * 0.95;
          const th = A * Math.cos(omega[i] * t);
          const bx = L * Math.sin(th), by = -L * Math.cos(th);
          const top = project(0, 0, z);
          const bob = project(bx, by, z);
          items.push({ i, z, top, bob, depth: bob[3] });
          const tr = trails[i];
          tr.push([bx, by, z]);
          if (tr.length > 26) tr.shift();
        }
        // bar
        const b0 = project(0, 0, -1), b1 = project(0, 0, 1);
        ctx.strokeStyle = '#7b84a8';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(b0[0], b0[1]);
        ctx.lineTo(b1[0], b1[1]);
        ctx.stroke();
        // floor shadow line of rest positions
        items.sort((a, b) => b.depth - a.depth);
        for (const it of items) {
          const { top, bob, i } = it;
          const hue = hues[i];
          ctx.strokeStyle = `hsla(${hue},40%,75%,${0.25 + 0.3 * top[2]})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(top[0], top[1]);
          ctx.lineTo(bob[0], bob[1]);
          ctx.stroke();
          if (params.trails) {
            const tr = trails[i];
            ctx.strokeStyle = `hsla(${hue},90%,65%,0.35)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            tr.forEach(([x, y, z], k) => {
              const p = project(x, y, z);
              ctx[k ? 'lineTo' : 'moveTo'](p[0], p[1]);
            });
            ctx.stroke();
          }
          const r = 11 * bob[2];
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, bob[0], bob[1], r * 3.2, glowCols[i], 0.2);
          ctx.globalCompositeOperation = 'source-over';
          const g = ctx.createRadialGradient(bob[0] - r * 0.35, bob[1] - r * 0.35, r * 0.1, bob[0], bob[1], r);
          g.addColorStop(0, `hsl(${hue},100%,88%)`);
          g.addColorStop(0.5, `hsl(${hue},85%,60%)`);
          g.addColorStop(1, `hsl(${hue},80%,28%)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(bob[0], bob[1], r, 0, 6.2832);
          ctx.fill();
        }
        if (!api.thumbnail) {
          const tc = ((t % CYCLE) + CYCLE) % CYCLE;
          tag(ctx, `t = ${tc.toFixed(1)} s  of  ${CYCLE} s`, w - 18, 84, Math.min(tc, CYCLE - tc) < 0.6 ? C.amber : C.ink, { align: 'right', size: 12 });
        }
      },
      stats() {
        const tc = ((t % CYCLE) + CYCLE) % CYCLE;
        return [
          { label: 'Time in cycle', value: tc.toFixed(1) + ' s' },
          { label: 'Longest pendulum', value: `${BASE} swings / min` },
          { label: 'Shortest pendulum', value: `${BASE + COUNT - 1} swings / min` },
          { label: 'Neighbour phase gap', value: (((tc / CYCLE) * 360) % 360).toFixed(0) + '°', color: C.amber },
        ];
      },
      charts() {
        const data = omega.map((w) => Math.cos(w * t));
        return [{ title: 'Each pendulum’s swing right now', kind: 'bars', series: [{ data: data.map((v) => v + 1), color: C.violet }], min: 0, max: 2, xLabel: 'longest  →  shortest' }];
      },
    };
  },
};
