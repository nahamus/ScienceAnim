import { C, TAU, clamp, backdrop, tag, text, rand, drawGlow } from '../../core/util.js';

export default {
  id: 'bernoulli',
  title: 'Bernoulli’s Principle',
  category: 'physics',
  tagline: 'Squeeze a flow and it speeds up — and where it is fast, pressure drops.',
  ages: ['14-16', '16+'],
  topics: ['Fluids', 'Pressure'],
  blurb:
    'Water speeding through a narrow pipe, air rushing over a wing, a shower curtain sucked inward: all are Bernoulli’s principle. A moving fluid trades pressure for speed. Where it flows fast its pressure is low; where it slows, pressure rises. It explains perfume sprayers, carburettors, aircraft speed sensors and part of how wings lift.',
  ideas: [
    'Fluid can’t pile up, so in a narrower section it must flow <b>faster</b> (continuity).',
    'Speeding up needs a push, which comes from a <b>pressure drop</b>: fast flow = low pressure.',
    'Pressure + kinetic energy per volume stays <b>constant</b> along the flow.',
    'Blowing between two balls makes them move <b>together</b>, not apart.',
  ],
  hint: 'Drag the throat of the pipe up or down to squeeze it',
  thumbChapter: 1,
  thumbFrames: 200,
  params: [
    { key: 'mode', label: 'Demo', type: 'select', value: 'venturi', options: [{ value: 'venturi', label: 'Venturi tube' }, { value: 'balls', label: 'Two hanging balls' }] },
    { key: 'ratio', label: 'Throat width', type: 'range', min: 0.25, max: 1, step: 0.01, value: 0.5, format: (v) => (v * 100).toFixed(0) + ' %' },
    { key: 'flow', label: 'Flow rate', type: 'range', min: 0, max: 1.5, step: 0.01, value: 0.8, format: (v) => (v * 100).toFixed(0) + ' %' },
  ],
  story: [
    {
      title: 'Squeeze the pipe',
      text: 'Water flows through a pipe with a narrow waist. Every second, the same amount of water must pass every point — so in the narrow throat it has to move much <b>faster</b>. Halve the width, double the speed.',
      formula: 'A₁ v₁ = A₂ v₂',
      params: { mode: 'venturi', ratio: 0.5, flow: 0.8 },
      duration: 12,
    },
    {
      title: 'Fast flow, low pressure',
      text: 'The glass tubes on top are pressure gauges: the higher the column, the higher the pressure. Over the throat the column is <b>lowest</b>. The water could only speed up there because the pressure ahead of it was lower.',
      formula: 'p + ½ ρ v² = constant',
      params: { mode: 'venturi', ratio: 0.5, flow: 0.9 },
      duration: 14,
    },
    {
      title: 'Narrower still',
      text: 'Squeeze the throat further. The speed rises sharply and the pressure falls so far it can drop below the outside air — enough to suck in air or fuel through a side hole. Perfume atomisers and old carburettors work this way.',
      params: { mode: 'venturi', ratio: 0.3, flow: 0.9 },
      tween: 4,
      duration: 13,
    },
    {
      title: 'Blow between two balls',
      text: 'Two light balls hang side by side. Blow air down between them. Most people expect them to fly apart — instead they swing <b>together</b>. The fast air between them has lower pressure than the still air outside, which pushes them inward.',
      params: { mode: 'balls', flow: 1.1 },
      duration: 14,
    },
    {
      title: 'Wings and airspeed',
      text: 'Aircraft measure their speed with a pitot tube that compares still and moving air pressure using exactly this rule. And the air speeding over a wing’s curved top has lower pressure than the air below — see the “How Wings Fly” simulation for the whole story.',
      params: { mode: 'venturi', ratio: 0.45, flow: 1.2 },
      duration: 13,
    },
    {
      title: 'Explore',
      text: 'Change the throat width and the flow rate, or drag the throat directly, and watch the gauges respond.',
      params: { mode: 'venturi', ratio: 0.6, flow: 0.8 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let parts = [], drag = false, balls = [{ th: 0, w: 0 }, { th: 0, w: 0 }], air = [];
    const gauges = [0.15, 0.5, 0.85];
    const gaugeH = [0, 0, 0];

    const geom = () => {
      const { w, h } = api;
      const x0 = 20, x1 = w - 20;
      const cy = Math.max(h * 0.5, 260);
      const H = Math.min(80, h * 0.12);
      return { x0, x1, cy, H, L: x1 - x0 };
    };
    // half-height of the pipe at fractional position u ∈ [0,1]
    const half = (u, g) => {
      const b = Math.abs(u - 0.5) < 0.2 ? 0.5 + 0.5 * Math.cos(((u - 0.5) / 0.2) * Math.PI) : 0;
      return g.H * (1 - (1 - params.ratio) * b);
    };

    return {
      onParam(k) {
        if (k === 'mode') {
          parts = [];
          air = [];
        }
      },
      pointerDown(p) {
        const g = geom();
        if (params.mode === 'venturi' && Math.abs(p.x - (g.x0 + g.L / 2)) < g.L * 0.2) drag = true;
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        const g = geom();
        api.runner.set('ratio', clamp(Math.abs(p.y - g.cy) / g.H, 0.2, 1));
      },
      pointerUp() {
        drag = false;
      },
      update(dt) {
        const g = geom();
        if (params.mode === 'venturi') {
          const Q = params.flow * 2 * g.H * 140; // px²/s through the wide section at full speed
          while (parts.length < 700) parts.push({ u: rand(0, 1), s: rand(-0.95, 0.95) });
          for (const p of parts) {
            const hh = half(p.u, g);
            const v = Q / (2 * hh);
            p.v = v;
            p.u += (v * dt) / g.L;
            if (p.u > 1) {
              p.u -= 1;
              p.s = rand(-0.95, 0.95);
            }
          }
          gauges.forEach((u, i) => {
            const hh = half(u, g);
            const v = Q / (2 * hh) / 140;
            const target = clamp(1.4 - 0.5 * v * v, -0.1, 1.6);
            gaugeH[i] += (target - gaugeH[i]) * Math.min(1, dt * 3);
          });
        } else {
          const F = params.flow * params.flow * 2.2;
          balls.forEach((b, i) => {
            const sgn = i === 0 ? 1 : -1; // pull toward the middle
            const a = -9 * Math.sin(b.th) + sgn * F * 0.6 - 0.8 * b.w;
            b.w += a * dt;
            b.th += b.w * dt;
            // balls (radius 34) hang 140 px apart: stop when they touch
            const lim = Math.asin(35 / Math.min(260, api.h * 0.45));
            if (i === 0) b.th = clamp(b.th, -0.25, lim);
            else b.th = clamp(b.th, -lim, 0.25);
            if (Math.abs(b.th) >= lim - 1e-6) b.w = 0;
          });
          for (let k = 0; k < Math.round(params.flow * 6); k++) air.push({ x: rand(-6, 6), y: 0, v: rand(220, 300) * params.flow });
          for (const a of air) a.y += a.v * dt;
          air = air.filter((a) => a.y < api.h);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0b1226' });
        const g = geom();
        if (params.mode === 'venturi') {
          // pipe walls
          const top = [], bot = [];
          for (let i = 0; i <= 120; i++) {
            const u = i / 120, x = g.x0 + u * g.L, hh = half(u, g);
            top.push([x, g.cy - hh]);
            bot.push([x, g.cy + hh]);
          }
          ctx.fillStyle = 'rgba(40,110,200,0.2)';
          ctx.beginPath();
          top.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y));
          for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
          ctx.fill();
          ctx.strokeStyle = 'rgba(190,215,255,0.7)';
          ctx.lineWidth = 3;
          for (const line of [top, bot]) {
            ctx.beginPath();
            line.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y));
            ctx.stroke();
          }
          // particles as short streaks coloured by speed
          const vmax = (params.flow * 140) / Math.max(0.2, params.ratio);
          for (const p of parts) {
            const x = g.x0 + p.u * g.L, hh = half(p.u, g), y = g.cy + p.s * hh * 0.92;
            const t = clamp(p.v / Math.max(1, vmax), 0, 1);
            ctx.strokeStyle = `hsla(${210 - 170 * t},90%,${55 + 15 * t}%,0.85)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - Math.min(30, p.v * 0.06), y);
            ctx.stroke();
          }
          // pressure gauges
          gauges.forEach((u, i) => {
            const x = g.x0 + u * g.L, hh = half(u, g);
            const base = g.cy - hh;
            const tubeTop = g.cy - g.H - 170;
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = 'rgba(190,215,255,0.5)';
            ctx.lineWidth = 1.5;
            ctx.fillRect(x - 9, tubeTop, 18, base - tubeTop);
            ctx.strokeRect(x - 9, tubeTop, 18, base - tubeTop);
            const level = base - Math.max(0, gaugeH[i]) * 100 - 6;
            const gr = ctx.createLinearGradient(0, level, 0, base);
            gr.addColorStop(0, '#5bb4ff');
            gr.addColorStop(1, '#1f5fb8');
            ctx.fillStyle = gr;
            ctx.fillRect(x - 8, level, 16, base - level);
            if (!api.thumbnail) {
              const v = (params.flow * 2 * g.H) / (2 * hh);
              tag(ctx, `v ${v.toFixed(2)}  ·  p ${gaugeH[i].toFixed(2)}`, x, tubeTop - 16, i === 1 ? C.amber : C.cyan, { align: 'center', size: 10 });
            }
          });
          if (!api.thumbnail) text(ctx, 'flow →', g.x0 + 10, g.cy + g.H + 24, { size: 11, color: C.dim });
        } else {
          const cx = w * 0.55, top = 90, L = Math.min(260, h * 0.45), r = 34;
          // nozzle
          ctx.fillStyle = '#7b84a8';
          ctx.fillRect(cx - 10, top - 10, 20, 30);
          for (const a of air) {
            ctx.fillStyle = 'rgba(160,220,255,0.5)';
            ctx.fillRect(cx + a.x, top + 20 + a.y, 2, 8);
          }
          balls.forEach((b, i) => {
            const px = cx + (i === 0 ? -1 : 1) * 70, py = top;
            const bx = px + Math.sin(b.th) * L, by = py + Math.cos(b.th) * L;
            ctx.strokeStyle = 'rgba(233,237,247,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(bx, by);
            ctx.stroke();
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, bx, by, r * 1.8, '#ff8a3d', 0.25);
            ctx.globalCompositeOperation = 'source-over';
            const gr = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.35, 2, bx, by, r);
            gr.addColorStop(0, '#ffe2c4');
            gr.addColorStop(1, '#c4561e');
            ctx.fillStyle = gr;
            ctx.beginPath();
            ctx.arc(bx, by, r, 0, TAU);
            ctx.fill();
            if (!api.thumbnail && params.flow > 0.2) tag(ctx, 'high pressure →', bx + (i === 0 ? -r - 8 : r + 8), by, C.red, { align: i === 0 ? 'right' : 'left', size: 10 });
          });
          if (!api.thumbnail && params.flow > 0.2) tag(ctx, 'fast air, low pressure', cx, top + L + 60, C.cyan, { align: 'center', size: 11 });
        }
      },
      stats() {
        if (params.mode === 'balls') {
          const gap = 140 - 2 * Math.sin(balls[0].th) * Math.min(260, api.h * 0.45);
          return [{ label: 'Air speed', value: (params.flow * 10).toFixed(1) + ' m/s' }, { label: 'Gap between balls', value: gap.toFixed(0) + ' px', color: C.amber }];
        }
        const sp = 1 / params.ratio;
        return [
          { label: 'Speed-up in throat', value: sp.toFixed(2) + '×', color: C.amber },
          { label: 'Pressure in throat', value: gaugeH[1].toFixed(2), color: C.cyan },
          { label: 'Pressure before', value: gaugeH[0].toFixed(2) },
        ];
      },
    };
  },
};
