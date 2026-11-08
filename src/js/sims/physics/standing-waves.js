import { C, TAU, clamp, backdrop, tag, text, rgba } from '../../core/util.js';

const N = 240;
const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const noteName = (f) => {
  const m = Math.round(69 + 12 * Math.log2(f / 440));
  return NOTES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
};

export default {
  id: 'standing-waves',
  title: 'Strings, Harmonics & Music',
  category: 'physics',
  tagline: 'Pluck a string and hear a chord of hidden frequencies.',
  ages: ['14-16', '16+'],
  topics: ['Waves', 'Sound'],
  blurb:
    'A plucked guitar string does not vibrate in one simple way. Waves race back and forth, reflect from both ends and interfere, leaving only patterns that fit exactly on the string: the harmonics. Their mixture is what makes a guitar sound different from a piano playing the same note.',
  ideas: [
    'Waves reflecting off both ends interfere into <b>standing waves</b> that do not travel.',
    'Only whole numbers of half-wavelengths fit, so a string has a <b>fundamental</b> and <b>overtones</b> at 2×, 3×, 4×… its frequency.',
    '<b>Nodes</b> never move; <b>antinodes</b> swing the most.',
    'Where you pluck decides which harmonics ring — and so the <b>tone colour</b> (timbre).',
  ],
  hint: 'Drag the string and let go to pluck it',
  thumbChapter: 3,
  thumbFrames: 60,
  params: [
    { key: 'mode', label: 'View', type: 'select', value: 'pluck', options: [{ value: 'pluck', label: 'Pluck' }, { value: 'mode', label: 'Pure harmonic' }, { value: 'travel', label: 'Two travelling waves' }] },
    { key: 'n', label: 'Harmonic number', type: 'range', min: 1, max: 8, step: 1, value: 1, instant: true },
    { key: 'pos', label: 'Pluck position', type: 'range', min: 0.05, max: 0.5, step: 0.01, value: 0.2, format: (v) => (v * 100).toFixed(0) + ' % along' },
    { key: 'tension', label: 'Tension', type: 'range', min: 0.4, max: 2.5, step: 0.01, value: 1, format: (v) => v.toFixed(2) + '×' },
    { key: 'damp', label: 'Damping', type: 'range', min: 0, max: 1, step: 0.01, value: 0.15 },
    { key: 'pluck', label: 'Pluck', type: 'button', action: (s) => s.pluck() },
  ],
  story: [
    {
      title: 'Pluck a string',
      text: 'A guitar string is pulled aside near one end and released. Watch in slow motion: the kink splits into two bumps that race in opposite directions, flip over as they bounce off the ends, and pass through each other.',
      params: { mode: 'pluck', pos: 0.2, tension: 1, damp: 0.08 },
      enter: (s) => s.pluck(),
      duration: 13,
    },
    {
      title: 'A chord hidden in one note',
      text: 'The chart breaks the motion into its <b>harmonics</b> — simple patterns that fit on the string. A pluck near the end excites many of them at once. That blend is the instrument’s tone.',
      params: { mode: 'pluck', pos: 0.12 },
      enter: (s) => s.pluck(0.12),
      duration: 13,
    },
    {
      title: 'Pluck in the middle',
      text: 'Pluck dead centre and every even harmonic vanishes: they all have a <b>node</b> (a still point) right where you pulled, so they cannot be excited. The sound becomes rounder and hollower.',
      params: { mode: 'pluck', pos: 0.5 },
      enter: (s) => s.pluck(0.5),
      duration: 13,
    },
    {
      title: 'The fundamental',
      text: 'Here is a single harmonic on its own. The whole string swings as one arc: half a wavelength fits between the ends. This sets the note you hear.',
      formula: 'f₁ = v / 2L',
      params: { mode: 'mode', n: 1 },
      duration: 10,
    },
    {
      title: 'Overtones',
      text: 'Fit two, three, four half-waves and you get frequencies 2, 3, 4 times higher. The points that never move are <b>nodes</b>. Guitarists touch a node lightly to play these “harmonics” directly.',
      formula: 'fₙ = n · v / 2L,   n = 1, 2, 3, …',
      params: { mode: 'mode', n: 2 },
      enter: (s) => s.cycle(),
      duration: 16,
    },
    {
      title: 'Where standing waves come from',
      text: 'A standing wave is really two identical waves travelling in <b style="color:#38d6f5">opposite</b> <b style="color:#ff5fa2">directions</b>. Where they always cancel you get nodes; where they always reinforce, antinodes. The white curve is their sum.',
      formula: 'sin(kx − ωt) + sin(kx + ωt) = 2 sin(kx) cos(ωt)',
      params: { mode: 'travel', n: 2 },
      duration: 15,
    },
    {
      title: 'Play',
      text: 'Drag the string anywhere and release to pluck it. Tighten it to raise the pitch, and watch the harmonic chart change as you pluck at different spots.',
      params: { mode: 'pluck', tension: 1.2, damp: 0.12, pos: 0.25 },
      enter: (s) => s.pluck(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let y = new Float32Array(N + 1), yo = new Float32Array(N + 1), yn = new Float32Array(N + 1);
    let held = null, t = 0, cycleT = -1;
    const history = [];
    let lastDt = 1 / 240;
    const geom = () => {
      const { w, h } = api;
      const L0 = Math.max(50, w * 0.08), L1 = w - Math.max(50, w * 0.08);
      return { L0, L1, cy: Math.max(200, h * 0.4), A: Math.min(110, h * 0.14) };
    };
    const c = () => 160 * Math.sqrt(params.tension); // nodes per second

    function shapeTriangle(p, amp) {
      const k = clamp(Math.round(p * N), 1, N - 1);
      for (let i = 0; i <= N; i++) y[i] = i <= k ? (amp * i) / k : (amp * (N - i)) / (N - k);
      yo.set(y);
    }
    function pluck(p = params.pos) {
      if (params.mode !== 'pluck') api.runner.set('mode', 'pluck');
      shapeTriangle(p, 1);
      history.length = 0;
    }

    return {
      pluck,
      cycle() {
        cycleT = 0;
      },
      reset() {
        pluck();
      },
      pointerDown(p) {
        const g = geom();
        if (p.x < g.L0 || p.x > g.L1) return;
        if (params.mode !== 'pluck') api.runner.set('mode', 'pluck');
        held = { p: (p.x - g.L0) / (g.L1 - g.L0), a: clamp((g.cy - p.y) / g.A, -1.2, 1.2) };
      },
      pointerMove(p) {
        if (!held || !p.down) return;
        const g = geom();
        held.p = clamp((p.x - g.L0) / (g.L1 - g.L0), 0.02, 0.98);
        held.a = clamp((g.cy - p.y) / g.A, -1.2, 1.2);
      },
      pointerUp() {
        held = null;
        history.length = 0;
      },
      update(dt) {
        t += dt;
        if (cycleT >= 0) {
          cycleT += dt;
          const n = 2 + Math.floor(cycleT / 4.5);
          if (n <= 5 && n !== params.n) api.runner.set('n', n);
          if (n > 5) cycleT = -1;
        }
        if (params.mode !== 'pluck') return;
        if (held) {
          shapeTriangle(held.p, held.a);
          return;
        }
        const cn = c();
        const sub = Math.max(1, Math.ceil(dt * cn * 1.05));
        const h = dt / sub;
        lastDt = h;
        const r2 = (cn * h) ** 2;
        const damp = 1 - params.damp * h * 1.2;
        for (let s = 0; s < sub; s++) {
          for (let i = 1; i < N; i++) yn[i] = y[i] + (y[i] - yo[i]) * damp + r2 * (y[i - 1] - 2 * y[i] + y[i + 1]);
          yn[0] = yn[N] = 0;
          const tmp = yo;
          yo = y;
          y = yn;
          yn = tmp;
        }
        if (api.frame % 2 === 0) {
          history.push(Float32Array.from(y));
          if (history.length > 6) history.shift();
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#140e22' });
        const g = geom();
        const X = (i) => g.L0 + (i / N) * (g.L1 - g.L0);
        const n = Math.round(params.n);
        const omega = TAU * 0.55 * Math.sqrt(params.tension) * (params.mode === 'travel' ? 0.6 : 1);

        // fretboard-ish backdrop
        const wood = ctx.createLinearGradient(0, g.cy - g.A * 1.6, 0, g.cy + g.A * 1.6);
        wood.addColorStop(0, 'rgba(60,35,20,0)');
        wood.addColorStop(0.5, 'rgba(60,35,20,0.22)');
        wood.addColorStop(1, 'rgba(60,35,20,0)');
        ctx.fillStyle = wood;
        ctx.fillRect(g.L0, g.cy - g.A * 1.6, g.L1 - g.L0, g.A * 3.2);
        ctx.strokeStyle = 'rgba(233,237,247,0.08)';
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.moveTo(g.L0, g.cy);
        ctx.lineTo(g.L1, g.cy);
        ctx.stroke();
        ctx.setLineDash([]);

        const strokeString = (fn, color, width, glowW) => {
          ctx.lineJoin = ctx.lineCap = 'round';
          if (glowW) {
            ctx.strokeStyle = rgba(color, 0.18);
            ctx.lineWidth = glowW;
            ctx.beginPath();
            for (let i = 0; i <= N; i += 2) ctx[i ? 'lineTo' : 'moveTo'](X(i), g.cy - fn(i) * g.A);
            ctx.stroke();
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          for (let i = 0; i <= N; i += 2) ctx[i ? 'lineTo' : 'moveTo'](X(i), g.cy - fn(i) * g.A);
          ctx.stroke();
        };

        if (params.mode === 'pluck') {
          history.forEach((hy, k) => {
            ctx.globalAlpha = 0.06 + k * 0.035;
            strokeString((i) => hy[i], '#ffcf8a', 2);
          });
          ctx.globalAlpha = 1;
          strokeString((i) => y[i], '#ffd9a0', 2.6, 10);
          if (held) tag(ctx, 'release to pluck', X(held.p * N), g.cy - held.a * g.A - 24, C.amber, { align: 'center', size: 10 });
        } else {
          const k = (n * Math.PI) / N;
          const env = (i) => Math.sin(k * i) * 0.8;
          // envelope
          ctx.fillStyle = 'rgba(255,181,71,0.06)';
          ctx.beginPath();
          for (let i = 0; i <= N; i += 2) ctx[i ? 'lineTo' : 'moveTo'](X(i), g.cy - Math.abs(env(i)) * g.A);
          for (let i = N; i >= 0; i -= 2) ctx.lineTo(X(i), g.cy + Math.abs(env(i)) * g.A);
          ctx.fill();
          const wt = omega * n * 0.5 * t;
          if (params.mode === 'travel') {
            strokeString((i) => 0.4 * Math.sin(k * i - wt), C.cyan, 1.6);
            strokeString((i) => 0.4 * Math.sin(k * i + wt), C.pink, 1.6);
            strokeString((i) => 0.8 * Math.sin(k * i) * Math.cos(wt), '#ffffff', 2.6, 9);
          } else {
            for (let j = 1; j <= 3; j++) {
              ctx.globalAlpha = 0.1 * j;
              strokeString((i) => env(i) * Math.cos(wt - j * 0.08), '#ffcf8a', 2);
            }
            ctx.globalAlpha = 1;
            strokeString((i) => env(i) * Math.cos(wt), '#ffd9a0', 2.6, 10);
          }
          // nodes & antinodes
          for (let m = 0; m <= n; m++) {
            const x = g.L0 + (m / n) * (g.L1 - g.L0);
            ctx.fillStyle = C.cyan;
            ctx.beginPath();
            ctx.arc(x, g.cy, 4.5, 0, TAU);
            ctx.fill();
          }
          if (!api.thumbnail && n <= 6) {
            for (let m = 0; m < n; m++) {
              const x = g.L0 + ((m + 0.5) / n) * (g.L1 - g.L0);
              text(ctx, 'antinode', x, g.cy + g.A + 22, { size: 10, align: 'center', color: 'rgba(255,207,138,0.6)' });
            }
            text(ctx, 'node', g.L0 + (g.L1 - g.L0) / n, g.cy - 16, { size: 10, align: 'center', color: rgba(C.cyan, 0.8) });
          }
          if (!api.thumbnail) tag(ctx, `harmonic ${n}  ·  ${n} half-wave${n > 1 ? 's' : ''}`, w / 2, g.cy - g.A - 34, C.amber, { align: 'center', size: 11 });
        }

        // bridges
        for (const x of [g.L0, g.L1]) {
          ctx.fillStyle = '#d8d2c0';
          ctx.fillRect(x - 3, g.cy - 14, 6, 28);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x - 3, g.cy + 6, 6, 8);
        }
      },
      amps() {
        // amplitude of each harmonic (position + velocity)
        const cn = c();
        const out = [];
        for (let m = 1; m <= 12; m++) {
          let a = 0, b = 0;
          const k = (m * Math.PI) / N;
          for (let i = 1; i < N; i++) {
            const s = Math.sin(k * i);
            a += y[i] * s;
            b += ((y[i] - yo[i]) / lastDt) * s;
          }
          a *= 2 / N;
          b *= 2 / N;
          const w = (m * Math.PI * cn) / N;
          out.push(Math.hypot(a, b / w));
        }
        return out;
      },
      stats() {
        const f1 = 110 * Math.sqrt(params.tension);
        const n = Math.round(params.n);
        const f = params.mode === 'pluck' ? f1 : f1 * n;
        return [
          { label: 'Fundamental', value: `${f1.toFixed(1)} Hz (${noteName(f1)})`, color: C.amber },
          { label: params.mode === 'pluck' ? 'Loudest overtone' : `Harmonic ${n}`, value: params.mode === 'pluck' ? (() => { const a = this.amps(); const i = a.slice(1).indexOf(Math.max(...a.slice(1))) + 2; return `${i} × f₁ = ${(f1 * i).toFixed(0)} Hz`; })() : `${f.toFixed(0)} Hz (${noteName(f)})` },
          { label: 'Wave speed', value: (143 * Math.sqrt(params.tension)).toFixed(0) + ' m/s' },
          { label: 'String length', value: '65 cm' },
        ];
      },
      charts() {
        let data;
        if (params.mode === 'pluck') data = this.amps();
        else {
          const n = Math.round(params.n);
          data = Array.from({ length: 12 }, (_, i) => (i + 1 === n ? 0.8 : 0));
        }
        return [{ title: 'Harmonic content (1 → 12)', kind: 'bars', series: [{ data, color: C.amber }], min: 0, xLabel: 'f₁   2f₁   3f₁   …   12f₁' }];
      },
    };
  },
};
