import { C, TAU, backdrop, drawGlow, tag, text, Series, clamp } from '../../core/util.js';

const NAT = [0.55, 0.75, 1, 1.25, 1.5, 1.8];

export default {
  id: 'resonance',
  title: 'Springs & Resonance',
  category: 'physics',
  tagline: 'Push at just the right rhythm and a small shake becomes a huge swing.',
  blurb:
    'Anything springy — a child on a swing, a guitar string, a skyscraper, a wine glass — has a natural rhythm it likes to wobble at. Push it at that rhythm and every push adds to the last: the swings grow enormous. This is resonance. It tunes radios and makes music, and it can shake bridges apart.',
  ideas: [
    'A mass on a spring bounces with a fixed <b>natural frequency</b> that depends on mass and stiffness.',
    '<b>Damping</b> (friction) drains energy so free bounces die away.',
    'Driven at its natural frequency, a system <b>resonates</b>: each push lands at the perfect moment.',
    'Driven too slow it follows along; too fast it barely moves and swings <b>opposite</b> to the push.',
  ],
  hint: 'Drag the weight down and let go',
  thumbChapter: 5,
  thumbFrames: 600,
  params: [
    { key: 'mode', label: 'Setup', type: 'select', value: 'single', options: [{ value: 'single', label: 'One spring' }, { value: 'barton', label: 'Six springs' }] },
    { key: 'f', label: 'Shaking frequency', type: 'range', min: 0.2, max: 2.5, step: 0.01, value: 0.4, format: (v) => v.toFixed(2) + ' × natural' },
    { key: 'A', label: 'Shaking strength', type: 'range', min: 0, max: 0.5, step: 0.01, value: 0 },
    { key: 'damp', label: 'Damping', type: 'range', min: 0.02, max: 1.5, step: 0.01, value: 0.08 },
    { key: 'pluck', label: 'Pull and release', type: 'button', action: (s) => s.pluck() },
  ],
  story: [
    {
      title: 'Boing',
      text: 'A weight hangs on a spring. Pull it down and let go: it bounces up and down with a steady rhythm — its <b>natural frequency</b>. A heavier weight or a softer spring would bounce more slowly.',
      formula: 'f₀ = (1 / 2π) · √(k / m)',
      params: { mode: 'single', A: 0, damp: 0.08, f: 1 },
      enter: (s) => s.pluck(),
      duration: 11,
    },
    {
      title: 'Damping',
      text: 'Friction and air resistance drain energy every bounce, so the swings shrink and die away. More damping, quicker stop — like a car’s shock absorbers.',
      params: { mode: 'single', A: 0, damp: 0.6 },
      enter: (s) => s.pluck(),
      duration: 10,
    },
    {
      title: 'Shake it slowly',
      text: 'Now the top of the spring is shaken gently, much slower than its natural rhythm. The weight simply rides along with the hand, in step with it.',
      params: { mode: 'single', A: 0.35, f: 0.35, damp: 0.25 },
      enter: (s) => s.rest(),
      duration: 11,
    },
    {
      title: 'Resonance',
      text: 'Shake at exactly the natural frequency. Each tiny push arrives just as the weight is already moving that way, adding a little more energy every time. The swing grows and grows until damping can barely hold it.',
      formula: 'amplitude = A·f₀² / √((f₀² − f²)² + (2γf)²)',
      params: { mode: 'single', A: 0.06, f: 1, damp: 0.1 },
      enter: (s) => s.rest(),
      duration: 15,
    },
    {
      title: 'Too fast',
      text: 'Shake much faster than its natural frequency and the weight can’t keep up. It barely moves — and when it does, it moves <b>opposite</b> to the hand.',
      params: { mode: 'single', A: 0.35, f: 2.2, damp: 0.25 },
      enter: (s) => s.rest(),
      duration: 11,
    },
    {
      title: 'Picking out one rhythm',
      text: 'Six springs with different natural frequencies hang from one shaking bar. Only the one whose rhythm matches the shaking swings wildly. A radio tunes into one station the same way, and engineers design bridges and towers so wind and footsteps cannot find their resonance.',
      params: { mode: 'barton', A: 0.07, f: 1.25, damp: 0.1 },
      enter: (s) => {
        s.rest();
        s.sweep();
      },
      duration: 18,
    },
    {
      title: 'Explore',
      text: 'Change the shaking frequency slowly and watch the resonance chart. Try very low damping — and be patient.',
      params: { mode: 'single', A: 0.3, f: 0.8, damp: 0.12 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let phaseDrive = 0, held = null, sweepT = -1;
    const n = 6;
    const xs = new Float32Array(n), vs = new Float32Array(n);
    const trace = [];
    const sX = new Series(300), sS = new Series(300);
    const F0 = 0.9; // natural frequency of the single spring (Hz)

    const nat = (k) => (params.mode === 'barton' ? NAT[k] * F0 : F0);
    const count = () => (params.mode === 'barton' ? n : 1);

    function rest() {
      xs.fill(0);
      vs.fill(0);
      trace.length = 0;
    }
    function pluck() {
      rest();
      xs[0] = 1.1;
    }

    const geom = () => {
      const { w, h } = api;
      const top = Math.max(100, h * 0.14);
      const L = Math.max(160, h * 0.36);
      const scale = Math.min(80, h * 0.11);
      return { top, L, scale, cx: params.mode === 'barton' ? 0 : w * 0.3 };
    };

    return {
      rest,
      pluck,
      sweep() {
        sweepT = 0;
      },
      reset: rest,
      onParam(k) {
        if (k === 'mode') rest();
      },
      pointerDown(p) {
        if (params.mode !== 'single') return;
        const g = geom();
        const my = g.top + g.L + xs[0] * g.scale;
        if (Math.abs(p.x - g.cx) < 50 && Math.abs(p.y - my) < 50) held = p.y - my;
      },
      pointerMove(p) {
        if (held === null || !p.down) return;
        const g = geom();
        xs[0] = clamp((p.y - held - g.top - g.L) / g.scale, -1.6, 1.6);
        vs[0] = 0;
      },
      pointerUp() {
        held = null;
      },
      update(dt) {
        if (sweepT >= 0) {
          sweepT += dt;
          const seq = [1.25, 0.75, 1.5];
          const i = Math.floor(sweepT / 6);
          if (i < seq.length && Math.abs(params.f - seq[i]) > 1e-3) api.runner.set('f', seq[i], 1.5);
          if (i >= seq.length) sweepT = -1;
        }
        const sub = 8, h = dt / sub;
        for (let s = 0; s < sub; s++) {
          phaseDrive += h * TAU * params.f * F0;
          const sup = params.A * Math.sin(phaseDrive);
          for (let k = 0; k < count(); k++) {
            if (held !== null && k === 0) continue;
            const w0 = TAU * nat(k);
            const a = -w0 * w0 * (xs[k] - sup) - 2 * params.damp * vs[k];
            vs[k] += a * h;
            xs[k] += vs[k] * h;
            xs[k] = clamp(xs[k], -3, 3);
          }
        }
        const sup = params.A * Math.sin(phaseDrive);
        trace.push([xs[0], sup]);
        if (trace.length > 240) trace.shift();
        if (api.frame % 2 === 0) {
          sX.push(xs[0]);
          sS.push(sup);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0e1024' });
        const g = geom();
        const sup = params.A * Math.sin(phaseDrive);
        const spring = (x, y0, y1, coils = 12, wdt = 16, col = '#9fb3d9') => {
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y0);
          const L = y1 - y0;
          ctx.lineTo(x, y0 + 8);
          for (let i = 0; i <= coils * 2; i++) ctx.lineTo(x + (i % 2 ? wdt : -wdt) * (i === 0 || i === coils * 2 ? 0 : 1), y0 + 8 + ((L - 16) * i) / (coils * 2));
          ctx.lineTo(x, y1);
          ctx.stroke();
        };
        const mass = (x, y, size, energy, col) => {
          if (energy > 0.05) {
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, x, y, size * 1.6 + energy * 40, col, 0.2);
            ctx.globalCompositeOperation = 'source-over';
          }
          const gr = ctx.createLinearGradient(x, y - size / 2, x, y + size / 2);
          gr.addColorStop(0, '#d6dcf0');
          gr.addColorStop(1, '#565e7c');
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(x - size / 2, y - size / 2, size, size, 6) : ctx.rect(x - size / 2, y - size / 2, size, size);
          ctx.fill();
        };
        const barY = g.top + sup * g.scale;
        if (params.mode === 'single') {
          // shaking hand/bar
          ctx.fillStyle = '#7b84a8';
          ctx.fillRect(g.cx - 60, barY - 8, 120, 8);
          if (params.A > 0) {
            ctx.strokeStyle = 'rgba(255,181,71,0.5)';
            ctx.setLineDash([3, 4]);
            ctx.strokeRect(g.cx - 66, g.top - params.A * g.scale - 10, 132, params.A * g.scale * 2 + 4);
            ctx.setLineDash([]);
          }
          const my = g.top + g.L + xs[0] * g.scale;
          spring(g.cx, barY, my - 26, 14, 16);
          mass(g.cx, my, 52, Math.abs(xs[0]), '#ff8a3d');
          // pen trace scrolling to the right
          const tx0 = g.cx + 90, tx1 = w - 30;
          if (tx1 - tx0 > 80) {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            ctx.moveTo(tx0, g.top + g.L);
            ctx.lineTo(tx1, g.top + g.L);
            ctx.stroke();
            const draw = (idx, col, base) => {
              ctx.strokeStyle = col;
              ctx.lineWidth = 2;
              ctx.beginPath();
              trace.forEach((p, i) => {
                const x = tx0 + ((trace.length - 1 - i) / 240) * (tx1 - tx0);
                ctx[i ? 'lineTo' : 'moveTo'](x, base + p[idx] * g.scale);
              });
              ctx.stroke();
            };
            if (params.A > 0) draw(1, 'rgba(255,181,71,0.6)', g.top + g.L);
            draw(0, '#ff8a3d', g.top + g.L);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(tx0, g.top + g.L + xs[0] * g.scale, 4, 0, TAU);
            ctx.fill();
            if (!api.thumbnail) {
              text(ctx, '← time', tx0 + 40, g.top + g.L - g.scale * 1.8, { size: 10, color: C.dim });
              if (params.A > 0) tag(ctx, 'hand', tx1, g.top + g.L - g.scale * 1.8, C.amber, { align: 'right', size: 10 });
              tag(ctx, 'weight', tx1, g.top + g.L - g.scale * 1.8 + 24, C.orange, { align: 'right', size: 10 });
            }
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.moveTo(g.cx - 70, g.top + g.L);
          ctx.lineTo(g.cx + 70, g.top + g.L);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          const x0 = w * 0.12, x1 = w * 0.88;
          ctx.fillStyle = '#7b84a8';
          ctx.fillRect(x0 - 30, barY - 8, x1 - x0 + 60, 8);
          for (let k = 0; k < n; k++) {
            const x = x0 + ((x1 - x0) * k) / (n - 1);
            const L = g.L * (0.55 + 0.45 / NAT[k] ** 0.8) * 0.75;
            const my = g.top + L + xs[k] * g.scale;
            const res = Math.abs(NAT[k] - params.f) < 0.08;
            spring(x, barY, my - 18, 10, 11, res ? '#ffd27a' : '#9fb3d9');
            mass(x, my, 26 + 18 / NAT[k], Math.abs(xs[k]) * 0.8, '#ff8a3d');
            if (!api.thumbnail) text(ctx, `${NAT[k].toFixed(2)}×`, x, g.top + L + g.scale * 1.9, { size: 10, align: 'center', color: res ? C.amber : C.dim, mono: true });
          }
        }
        if (!api.thumbnail && params.A > 0) tag(ctx, `shaking at ${params.f.toFixed(2)} × natural`, w - 18, 84, Math.abs(params.f - 1) < 0.05 && params.mode === 'single' ? C.amber : C.ink, { align: 'right', size: 11 });
      },
      stats() {
        const w0 = TAU * F0, w = TAU * F0 * params.f;
        const amp = (params.A * w0 * w0) / Math.sqrt((w0 * w0 - w * w) ** 2 + (2 * params.damp * w) ** 2);
        return [
          { label: 'Natural frequency', value: F0.toFixed(2) + ' Hz' },
          { label: 'Shaking frequency', value: (F0 * params.f).toFixed(2) + ' Hz', color: C.amber },
          { label: 'Predicted swing / shake', value: params.A > 0 ? (amp / params.A).toFixed(1) + '×' : '—', color: C.orange },
          { label: 'Quality factor Q', value: (w0 / (2 * params.damp)).toFixed(0) },
        ];
      },
      charts() {
        const w0 = TAU * F0;
        const data = [];
        for (let f = 0.2; f <= 2.5; f += 0.025) {
          const w = TAU * F0 * f;
          data.push((w0 * w0) / Math.sqrt((w0 * w0 - w * w) ** 2 + (2 * params.damp * w) ** 2));
        }
        const mark = data.map((_, i) => (Math.abs(0.2 + i * 0.025 - params.f) < 0.0125 ? Math.max(...data) : 0));
        return [
          { title: 'Response vs shaking frequency (marker = now)', kind: 'bars', series: [{ data: mark, color: 'rgba(255,181,71,0.5)' }], ref: { data, color: C.orange }, min: 0, xLabel: 'slow  ←  frequency  →  fast' },
          { title: 'Weight (orange) and hand (yellow)', series: [{ data: sS.data, color: C.amber, fill: false }, { data: sX.data, color: C.orange, fill: false }], length: 300 },
        ];
      },
    };
  },
};
