import { C, Series, backdrop, drawGlow, hsl, TAU } from '../../core/util.js';

// Equal masses and arm lengths; state = [θ1, θ2, ω1, ω2]
function deriv(s, g, out) {
  const [t1, t2, w1, w2] = s;
  const d = t1 - t2;
  const den = 3 - Math.cos(2 * d);
  out[0] = w1;
  out[1] = w2;
  out[2] = (-3 * g * Math.sin(t1) - g * Math.sin(t1 - 2 * t2) - 2 * Math.sin(d) * (w2 * w2 + w1 * w1 * Math.cos(d))) / den;
  out[3] = (2 * Math.sin(d) * (2 * w1 * w1 + 2 * g * Math.cos(t1) + w2 * w2 * Math.cos(d))) / den;
}
const k1 = new Float64Array(4), k2 = new Float64Array(4), k3 = new Float64Array(4), k4 = new Float64Array(4), tmp = new Float64Array(4);
function rk4(s, g, h) {
  deriv(s, g, k1);
  for (let i = 0; i < 4; i++) tmp[i] = s[i] + (h / 2) * k1[i];
  deriv(tmp, g, k2);
  for (let i = 0; i < 4; i++) tmp[i] = s[i] + (h / 2) * k2[i];
  deriv(tmp, g, k3);
  for (let i = 0; i < 4; i++) tmp[i] = s[i] + h * k3[i];
  deriv(tmp, g, k4);
  for (let i = 0; i < 4; i++) s[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
}
const energy = (s, g) => {
  const [t1, t2, w1, w2] = s;
  const T = 0.5 * (2 * w1 * w1 + w2 * w2 + 2 * w1 * w2 * Math.cos(t1 - t2));
  const V = -g * (2 * Math.cos(t1) + Math.cos(t2));
  return T + V;
};

export default {
  id: 'double-pendulum',
  title: 'Chaos & the Double Pendulum',
  category: 'physics',
  tagline: 'Two hinged rods, perfectly predictable laws — and a future no one can predict.',
  ages: ['16+'],
  topics: ['Chaos', 'Forces'],
  blurb:
    'A double pendulum follows Newton’s laws exactly, yet the tiniest nudge to its starting angle grows exponentially until two copies have nothing in common. This is deterministic chaos — the “butterfly effect.”',
  ideas: [
    '<b>Deterministic</b> does not mean <b>predictable</b>: the equations have no randomness, yet long-term forecasts are impossible.',
    'Small differences grow roughly like e<sup>λt</sup>, where λ is the Lyapunov exponent.',
    'At low energy the motion is nearly regular; chaos appears when the arms can flip over.',
  ],
  thumbChapter: 2,
  thumbFrames: 420,
  hint: 'Click anywhere to restart the swarm with the first arm pointing at your cursor',
  params: [
    { key: 'count', label: 'Pendulums', type: 'range', min: 1, max: 300, step: 1, value: 1, instant: true },
    { key: 'spread', label: 'Initial difference', type: 'range', min: -7, max: -1, step: 0.5, value: -3, instant: true, format: (v) => `10^${v} rad` },
    { key: 'angle', label: 'Starting angle', type: 'range', min: 10, max: 178, step: 1, value: 125, unit: '°', instant: true },
    { key: 'g', label: 'Gravity', type: 'range', min: 2, max: 30, step: 0.1, value: 9.8, unit: 'm/s²' },
    { key: 'trail', label: 'Trail length', type: 'range', min: 0, max: 400, step: 10, value: 220 },
    { key: 'rods', label: 'Show rods', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'A simple machine',
      text: 'One pendulum hangs from the end of another. Gravity and two hinges — that’s all. Watch the tip trace out its path.',
      params: { count: 1, angle: 125, trail: 400, rods: true },
      duration: 12,
    },
    {
      title: 'Identical twins',
      text: 'Now two pendulums start just <em>0.001 radians</em> apart — far less than the width of a hair at arm’s length. For a few seconds they move as one…',
      params: { count: 2, spread: -3, angle: 125, trail: 160 },
      duration: 14,
    },
    {
      title: 'A fan of futures',
      text: 'Two hundred pendulums, each differing by a ten-thousandth of a radian. They begin as a single line, then the rainbow tears apart.',
      formula: 'δ(t) ≈ δ<sub>0</sub> · e<sup>λt</sup>',
      params: { count: 200, spread: -4, angle: 125, trail: 50, rods: true },
      duration: 16,
    },
    {
      title: 'The butterfly effect',
      text: 'The Live data chart tracks the gap between the first and last pendulum on a log scale. It climbs in a straight line — <b>exponential growth</b>. Making the initial error 1000× smaller only buys a little more time.',
      params: { count: 200, spread: -7, trail: 40 },
      duration: 16,
    },
    {
      title: 'Low energy, little chaos',
      text: 'Start from a gentle 30° and the swarm stays together, swinging in near-regular rhythm. Chaos needs enough energy for the arms to fling over the top.',
      params: { count: 200, spread: -3, angle: 30, trail: 30 },
      duration: 12,
    },
    {
      title: 'Your turn',
      text: 'Click the scene to drop the swarm from any angle. Try changing gravity, the number of pendulums and the starting difference.',
      params: { count: 150, spread: -4, angle: 160, trail: 60 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let pends = [], sep = new Series(400), t = 0, cx = 0, cy = 0, L = 100;
    function init(angle = (params.angle * Math.PI) / 180, angle2 = angle) {
      const n = Math.round(params.count);
      const d = Math.pow(10, params.spread);
      pends = [];
      for (let i = 0; i < n; i++) {
        pends.push({ s: new Float64Array([angle + i * d, angle2 + i * d, 0, 0]), trail: [], hue: n === 1 ? 190 : 200 + (160 * i) / Math.max(1, n - 1) });
      }
      sep.clear();
      t = 0;
    }
    init();
    return {
      resize(w, h) {
        cx = w / 2;
        cy = h * 0.38;
        L = Math.min(w * 0.22, h * 0.27);
      },
      onParam(k) {
        if (k === 'count' || k === 'spread' || k === 'angle') init();
      },
      reset: () => init(),
      pointerDown(p) {
        const a = Math.atan2(p.x - cx, p.y - cy);
        init(a, a);
      },
      update(dt) {
        const sub = 8, h = dt / sub;
        const g = params.g;
        for (const p of pends) for (let i = 0; i < sub; i++) rk4(p.s, g, h * 1.5);
        t += dt;
        if (pends.length > 1) {
          const a = pends[0].s, b = pends[pends.length - 1].s;
          const dd = Math.hypot(Math.atan2(Math.sin(a[0] - b[0]), Math.cos(a[0] - b[0])), Math.atan2(Math.sin(a[1] - b[1]), Math.cos(a[1] - b[1])));
          sep.push(Math.log10(Math.max(1e-9, dd)));
        }
        const max = Math.round(params.trail);
        for (const p of pends) {
          const [t1, t2] = p.s;
          const x1 = cx + L * Math.sin(t1), y1 = cy + L * Math.cos(t1);
          p.x1 = x1;
          p.y1 = y1;
          p.x2 = x1 + L * Math.sin(t2);
          p.y2 = y1 + L * Math.cos(t2);
          p.trail.push(p.x2, p.y2);
          while (p.trail.length > max * 2) p.trail.splice(0, 2);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h);
        const n = pends.length;
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = ctx.lineJoin = 'round';
        // trails
        for (const p of pends) {
          const tr = p.trail;
          const m = tr.length / 2;
          if (m < 2) continue;
          if (n <= 3) {
            for (let i = 1; i < m; i++) {
              const a = i / m;
              ctx.strokeStyle = hsl(p.hue + (n === 1 ? a * 120 : 0), 90, 62, a * 0.9);
              ctx.lineWidth = 0.6 + a * 2.2;
              ctx.beginPath();
              ctx.moveTo(tr[i * 2 - 2], tr[i * 2 - 1]);
              ctx.lineTo(tr[i * 2], tr[i * 2 + 1]);
              ctx.stroke();
            }
          } else if (n <= 20) {
            ctx.strokeStyle = hsl(p.hue, 90, 60, 0.55);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(tr[0], tr[1]);
            for (let i = 1; i < m; i++) ctx.lineTo(tr[i * 2], tr[i * 2 + 1]);
            ctx.stroke();
          }
        }
        // a swarm: group the trails into a dozen colour bands, one stroke each instead of 200
        if (n > 20) {
          const bands = 12;
          ctx.lineWidth = 1.2;
          for (let b = 0; b < bands; b++) {
            ctx.strokeStyle = hsl(200 + (160 * (b + 0.5)) / bands, 90, 60, n > 100 ? 0.35 : 0.55);
            ctx.beginPath();
            for (let k = Math.floor((b * n) / bands); k < Math.floor(((b + 1) * n) / bands); k++) {
              const tr = pends[k].trail;
              if (tr.length < 4) continue;
              ctx.moveTo(tr[0], tr[1]);
              for (let i = 2; i < tr.length; i += 2) ctx.lineTo(tr[i], tr[i + 1]);
            }
            ctx.stroke();
          }
        }
        // rods
        if (params.rods) {
          ctx.lineWidth = n > 20 ? 1 : 3;
          if (n > 20) {
            ctx.strokeStyle = hsl(280, 70, 75, 0.18);
            ctx.beginPath();
            for (const p of pends) {
              if (p.x1 === undefined) continue;
              ctx.moveTo(cx, cy);
              ctx.lineTo(p.x1, p.y1);
              ctx.lineTo(p.x2, p.y2);
            }
            ctx.stroke();
          } else for (const p of pends) {
            if (p.x1 === undefined) continue;
            ctx.strokeStyle = hsl(p.hue, 70, 75, n > 20 ? 0.18 : 0.75);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(p.x1, p.y1);
            ctx.lineTo(p.x2, p.y2);
            ctx.stroke();
          }
        }
        // bobs
        if (n > 20) {
          // a swarm: small batched dots, one fill per colour band
          const bands = 12;
          for (let b = 0; b < bands; b++) {
            ctx.fillStyle = hsl(200 + (160 * (b + 0.5)) / bands, 95, 68, 0.9);
            ctx.beginPath();
            for (let k = Math.floor((b * n) / bands); k < Math.floor(((b + 1) * n) / bands); k++) {
              const p = pends[k];
              if (p.x1 === undefined) continue;
              ctx.moveTo(p.x2 + 2.2, p.y2);
              ctx.arc(p.x2, p.y2, 2.2, 0, TAU);
            }
            ctx.fill();
          }
        } else for (const p of pends) {
          if (p.x1 === undefined) continue;
          const r = 22;
          if (n <= 20) drawGlow(ctx, p.x1, p.y1, r * 0.8, '#9fb4ff');
          drawGlow(ctx, p.x2, p.y2, r, n === 1 ? '#7fe3ff' : '#ffffff', 0.12);
          if (n > 1) {
            ctx.fillStyle = hsl(p.hue, 95, 65, 0.9);
            ctx.beginPath();
            ctx.arc(p.x2, p.y2, n > 20 ? 1.8 : 4, 0, TAU);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
        // pivot
        ctx.fillStyle = '#c8d2f0';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = C.faint;
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy);
        ctx.lineTo(cx + 30, cy);
        ctx.stroke();
      },
      stats() {
        const e = pends[0] ? energy(pends[0].s, 9.8) : 0;
        const last = sep.last;
        return [
          { label: 'Pendulums', value: String(pends.length) },
          { label: 'Elapsed', value: t.toFixed(1) + ' s' },
          { label: 'Energy (pend. 1)', value: e.toFixed(2) },
          { label: 'Spread', value: last === undefined ? '—' : last < -0.5 ? `10^${last.toFixed(1)}` : 'total chaos', color: last > -0.5 ? C.red : undefined },
        ];
      },
      charts() {
        if (pends.length < 2) return [];
        return [{ title: 'Separation, log₁₀ (radians)', series: [{ data: sep.data, color: '#ff5fa2' }], min: -8, max: 1, length: 400 }];
      },
    };
  },
};
