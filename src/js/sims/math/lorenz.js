import { C, drawGlow, randn, tag } from '../../core/util.js';

export default {
  id: 'lorenz',
  title: 'The Lorenz Attractor',
  category: 'math',
  tagline: 'Three simple equations, a butterfly-shaped path that never repeats — and the birth of chaos theory.',
  ages: ['16+'],
  topics: ['Chaos', 'Differential equations'],
  blurb:
    'In 1963 meteorologist Edward Lorenz boiled weather down to three equations. To his shock, rounding a number from six digits to three changed his forecast completely. The paths his equations trace wind forever around two wings without ever repeating: a strange attractor.',
  ideas: [
    'The system is fully deterministic, yet long-term prediction is impossible.',
    'Trajectories stay on a bounded, fractal shape called a <b>strange attractor</b>.',
    'Nearby starting points separate exponentially — the original “butterfly effect”.',
    'Change the parameter ρ and the behaviour switches between steady, periodic and chaotic.',
  ],
  hint: 'Drag to rotate the view',
  thumbChapter: 0,
  thumbFrames: 1400,
  params: [
    { key: 'count', label: 'Particles', type: 'range', min: 1, max: 1500, step: 1, value: 1, instant: true },
    { key: 'rho', label: 'ρ (heating)', type: 'range', min: 5, max: 50, step: 0.1, value: 28 },
    { key: 'sigma', label: 'σ', type: 'range', min: 2, max: 20, step: 0.1, value: 10 },
    { key: 'beta', label: 'β', type: 'range', min: 0.5, max: 4, step: 0.01, value: 2.667 },
    { key: 'trail', label: 'Trail length', type: 'range', min: 10, max: 2500, step: 10, value: 2000, instant: true },
    { key: 'spin', label: 'Auto-rotate', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'Weather in three numbers',
      text: 'A single point moves according to Lorenz’s three equations, a cartoon of air rising and falling in a heated layer. Follow its path.',
      formula: 'ẋ = σ(y − x),  ẏ = x(ρ − z) − y,  ż = xy − βz',
      params: { count: 1, trail: 2500, rho: 28, sigma: 10, beta: 2.667, spin: true },
      duration: 13,
    },
    {
      title: 'The butterfly',
      text: 'The path loops around one wing, then unpredictably flips to the other — never retracing itself, never escaping. This is a <b>strange attractor</b>, a shape with fractal layers.',
      params: { count: 1, trail: 2500 },
      duration: 12,
    },
    {
      title: 'Twins drift apart',
      text: 'Two points start a millionth apart. For a while they’re indistinguishable — then suddenly they’re on opposite wings. Tiny measurement errors doom long-range weather forecasts.',
      params: { count: 2, trail: 500 },
      duration: 14,
    },
    {
      title: 'A cloud of futures',
      text: 'A thousand points begin as a tiny speck. Within seconds they smear across the entire butterfly. Forecasters run “ensembles” like this to estimate the odds of different weather.',
      params: { count: 1000, trail: 14 },
      duration: 14,
    },
    {
      title: 'Turn down the heat',
      text: 'Lower ρ below about 24.7 and chaos disappears: the swarm spirals calmly into one of two fixed points — steady, predictable convection.',
      params: { rho: 15, count: 600, trail: 20 },
      tween: 3,
      duration: 13,
    },
    {
      title: 'Explore',
      text: 'Drag to rotate. Try ρ = 99.96 territory by maxing it out, or tweak σ and β to find periodic orbits hidden among the chaos.',
      params: { rho: 28, count: 300, trail: 60 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let P = [], yaw = 0.6, pitch = 0.25, drag = null, sep = [];

    function init() {
      const n = Math.round(params.count);
      P = [];
      for (let i = 0; i < n; i++) {
        const e = n === 2 ? i * 1e-6 : n === 1 ? 0 : 1e-2;
        P.push({ x: 1 + (n === 2 ? e : randn() * e), y: 1 + (n === 2 ? 0 : randn() * e), z: 20 + (n === 2 ? 0 : randn() * e), tr: [], hue: n === 2 ? (i ? 330 : 190) : 180 + (i / Math.max(1, n)) * 160 });
      }
      sep = [];
    }
    init();
    const deriv = (x, y, z) => [params.sigma * (y - x), x * (params.rho - z) - y, x * y - params.beta * z];

    return {
      reset: init,
      onParam(k) {
        if (k === 'count') init();
        if (k === 'trail') for (const p of P) p.tr.length = 0;
      },
      pointerDown(p) {
        drag = { x: p.x, y: p.y, yaw, pitch };
      },
      pointerMove(p) {
        if (!drag) return;
        yaw = drag.yaw + (p.x - drag.x) * 0.008;
        pitch = Math.max(-1.3, Math.min(1.3, drag.pitch + (p.y - drag.y) * 0.008));
      },
      pointerUp() {
        drag = null;
      },
      update(dt) {
        if (params.spin && !drag) yaw += dt * 0.15;
        const steps = 6, h = Math.min(dt, 1 / 30) / steps * 0.9;
        const maxT = Math.round(params.trail);
        for (const p of P) {
          for (let s = 0; s < steps; s++) {
            const k1 = deriv(p.x, p.y, p.z);
            const k2 = deriv(p.x + (h / 2) * k1[0], p.y + (h / 2) * k1[1], p.z + (h / 2) * k1[2]);
            const k3 = deriv(p.x + (h / 2) * k2[0], p.y + (h / 2) * k2[1], p.z + (h / 2) * k2[2]);
            const k4 = deriv(p.x + h * k3[0], p.y + h * k3[1], p.z + h * k3[2]);
            p.x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
            p.y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
            p.z += (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
          }
          p.tr.push(p.x, p.y, p.z);
          if (p.tr.length > maxT * 3) p.tr.splice(0, p.tr.length - maxT * 3);
        }
        if (P.length === 2) {
          sep.push(Math.log10(Math.max(1e-7, Math.hypot(P[0].x - P[1].x, P[0].y - P[1].y, P[0].z - P[1].z))));
          if (sep.length > 300) sep.shift();
        }
      },
      draw() {
        const { w, h } = api;
        const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.7);
        g.addColorStop(0, '#120a1c');
        g.addColorStop(1, '#030206');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        const S = Math.min(w, h) / 62, cx = w / 2, cy = h * 0.46;
        const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        const proj = (x, y, z) => {
          // Lorenz z is "up"; centre the attractor
          const X = x, Y = z - 25, Z = y;
          const x1 = X * cyw + Z * syw, z1 = -X * syw + Z * cyw;
          const y2 = Y * cp - z1 * sp;
          return [cx + x1 * S, cy - y2 * S];
        };
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = ctx.lineJoin = 'round';
        const many = P.length > 50;
        if (many) {
          // batch trails into a few hue buckets
          const B = 8;
          ctx.lineCap = 'butt'; // round joins on thousands of tiny segments are slow to paint
          ctx.lineJoin = 'bevel';
          for (let b = 0; b < B; b++) {
            ctx.strokeStyle = `hsla(${180 + (b / B) * 160},90%,62%,0.55)`;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            for (let i = b; i < P.length; i += B) {
              const tr = P[i].tr;
              for (let k = 0; k < tr.length; k += 3) {
                const [X, Y] = proj(tr[k], tr[k + 1], tr[k + 2]);
                k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
              }
            }
            ctx.stroke();
          }
          for (const p of P) {
            const [X, Y] = proj(p.x, p.y, p.z);
            ctx.fillStyle = `hsla(${p.hue},100%,75%,0.9)`;
            ctx.fillRect(X - 1, Y - 1, 2, 2);
          }
        } else {
          for (const p of P) {
            const tr = p.tr, n = tr.length / 3;
            const chunks = 16, per = Math.ceil(n / chunks);
            for (let c = 0; c < chunks; c++) {
              const i0 = c * per, i1 = Math.min(n - 1, (c + 1) * per);
              if (i1 <= i0) continue;
              const a = (c + 1) / chunks;
              ctx.strokeStyle = `hsla(${p.hue + (P.length === 1 ? a * 140 : 0)},90%,${50 + a * 15}%,${0.15 + a * 0.75})`;
              ctx.lineWidth = 0.8 + a * 1.4;
              ctx.beginPath();
              for (let i = i0; i <= i1; i++) {
                const [X, Y] = proj(tr[i * 3], tr[i * 3 + 1], tr[i * 3 + 2]);
                i === i0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
              }
              ctx.stroke();
            }
            const [X, Y] = proj(p.x, p.y, p.z);
            drawGlow(ctx, X, Y, 18, P.length === 2 ? (p.hue > 300 ? '#ff5fa2' : '#38d6f5') : '#ffffff');
          }
        }
        ctx.globalCompositeOperation = 'source-over';
        if (!api.thumbnail && params.rho < 24.7 && P.length) {
          const r = Math.sqrt(params.beta * (params.rho - 1));
          const [X1, Y1] = proj(r, r, params.rho - 1), [X2, Y2] = proj(-r, -r, params.rho - 1);
          tag(ctx, 'fixed point', X1, Y1 - 24, C.amber, { align: 'center' });
          tag(ctx, 'fixed point', X2, Y2 - 24, C.amber, { align: 'center' });
        }
      },
      stats() {
        return [
          { label: 'Particles', value: String(P.length) },
          { label: 'ρ', value: params.rho.toFixed(1), color: params.rho > 24.74 ? C.pink : C.teal },
          { label: 'Regime', value: params.rho > 24.74 ? 'chaotic' : params.rho > 1 ? 'steady spiral' : 'at rest' },
        ];
      },
      charts() {
        return P.length === 2 ? [{ title: 'Distance between twins, log₁₀', series: [{ data: sep, color: '#ff5fa2' }], min: -7, max: 2, length: 300 }] : [];
      },
    };
  },
};
