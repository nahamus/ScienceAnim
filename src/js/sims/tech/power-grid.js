import { C, TAU, clamp, drawGlow, tag, Series } from '../../core/util.js';

const LINE_R = 10; // ohms for the long-distance line
const VOLTS = [{ value: 11, label: '11 kV' }, { value: 132, label: '132 kV' }, { value: 400, label: '400 kV' }];

export default {
  id: 'power-grid',
  title: 'From Power Station to Plug',
  category: 'tech',
  tagline: 'Why electricity travels at 400,000 volts — and how the grid matches supply to demand every second.',
  blurb:
    'Flip a switch and power arrives instantly from a station perhaps hundreds of kilometres away. On the way it is stepped up to enormous voltages to cross the country, then stepped back down before it reaches your home. Meanwhile grid operators must make exactly as much electricity as everyone is using, at every moment.',
  ideas: [
    'Generators spin magnets inside coils to make <b>alternating current</b> (50 or 60 times a second).',
    'Power = voltage × current. Raising the voltage lets the same power flow with <b>far less current</b>.',
    'Wires waste power as heat in proportion to <b>current squared</b>, so high voltage slashes losses.',
    '<b>Transformers</b> step voltage up for transmission and down to a safe 230 V (or 120 V) for homes.',
  ],
  hint: 'Change the transmission voltage and watch the wires',
  thumbChapter: 2,
  thumbFrames: 120,
  params: [
    { key: 'kv', label: 'Transmission voltage', type: 'select', value: 400, options: VOLTS },
    { key: 'source', label: 'Power source', type: 'select', value: 'thermal', options: [{ value: 'thermal', label: 'Gas/coal' }, { value: 'hydro', label: 'Hydro' }, { value: 'wind', label: 'Wind' }, { value: 'solar', label: 'Solar' }] },
    { key: 'clock', label: 'Time of day', type: 'range', min: 0, max: 24, step: 0.1, value: 18, format: (v) => `${String(Math.floor(v)).padStart(2, '0')}:${String(Math.floor((v % 1) * 60)).padStart(2, '0')}` },
    { key: 'run', label: 'Let the day pass', type: 'toggle', value: false },
  ],
  story: [
    {
      title: 'The journey',
      text: 'A power station (left) spins a generator — magnets turning inside coils of wire, just like the induction simulation. The electricity is stepped up by a transformer, carried along pylons, stepped down at a substation and delivered to homes.',
      params: { kv: 400, source: 'thermal', clock: 18, run: false },
      duration: 13,
    },
    {
      title: 'Why such high voltage?',
      text: 'The town needs 500 MW. At 400,000 volts that takes about 1,250 amps, and the line wastes only ~3% as heat. The glowing dots show current; the wire colour shows heating.',
      formula: 'P = V · I,     P_loss = I² · R',
      params: { kv: 400 },
      duration: 13,
    },
    {
      title: 'Try a lower voltage',
      text: 'Send the same power at 132 kV: three times the current, so <b>nine times</b> the losses — nearly a third of the power heats the sky. At 11 kV the current would be so huge the wires would melt. That is why long-distance lines run at hundreds of thousands of volts.',
      params: { kv: 132 },
      enter: (s) => s.later(7, (r) => r.set('kv', 11)),
      duration: 15,
    },
    {
      title: 'Back down to safe',
      text: 'At the substation and the pole-top transformer near your street, the voltage is stepped down in stages to 230 volts (120 V in North America) — still dangerous, but safe enough to use in a home.',
      params: { kv: 400 },
      duration: 12,
    },
    {
      title: 'Matching demand',
      text: 'Demand rises in the morning, dips, then peaks in the evening as people cook and light their homes. Power stations must ramp up and down to <b>match it exactly</b>; if supply falls short, the grid’s frequency sags and blackouts follow.',
      params: { run: true, source: 'hydro', kv: 400 },
      duration: 16,
    },
    {
      title: 'Sun and wind',
      text: 'Solar panels produce most at midday and nothing at night; wind comes and goes. A modern grid blends many sources, plus batteries and pumped hydro storage, so the lights stay on when the sun sets and the wind drops.',
      params: { run: true, source: 'solar' },
      duration: 16,
    },
    {
      title: 'Run the grid',
      text: 'Pick a source, a transmission voltage and a time of day, and see how much power is wasted and whether supply keeps up.',
      params: { run: false, source: 'wind', clock: 19 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let flow = 0, jobs = [], spin = 0;
    const sD = new Series(240), sG = new Series(240);

    const demand = (hr) => 300 + 140 * Math.exp(-(((hr - 8) / 1.6) ** 2)) + 220 * Math.exp(-(((hr - 19) / 2) ** 2)) - 60 * Math.exp(-(((hr - 3.5) / 2.5) ** 2)); // MW
    function generation(hr) {
      const d = demand(hr);
      if (params.source === 'solar') return Math.max(0, 900 * Math.sin(((hr - 6) / 12) * Math.PI)) * (hr > 6 && hr < 18 ? 1 : 0);
      if (params.source === 'wind') return clamp(380 + 260 * Math.sin(hr * 1.3) * Math.cos(hr * 0.37 + 1) + 120 * Math.sin(api.time * 0.7), 40, 800);
      return d; // dispatchable: follows demand
    }
    function solve() {
      const hr = params.clock;
      const D = demand(hr), G = generation(hr);
      const P = Math.min(D, G) * 1e6; // watts actually delivered from this source
      const V = params.kv * 1000;
      const I = P / V;
      const loss = I * I * LINE_R;
      return { D, G, I, lossFrac: loss / Math.max(1, P), melt: loss > P * 0.9 };
    }

    return {
      later(t, fn) {
        jobs.push({ t, fn });
      },
      update(dt) {
        for (const j of jobs) if ((j.t -= dt) <= 0) j.fn(api.runner);
        jobs = jobs.filter((j) => j.t > 0);
        if (params.run) {
          const v = (params.clock + dt * 0.6) % 24;
          api.runner.params.clock = v;
          api.runner.onParamChange?.('clock', v);
        }
        const s = solve();
        flow += dt * Math.min(400, 20 + s.I / 25);
        spin += dt * (params.source === 'wind' ? 1 + s.G / 400 : 6);
        if (api.frame % 4 === 0) {
          sD.push(s.D);
          sG.push(s.G);
        }
      },
      draw() {
        const { w, h } = api;
        const hr = params.clock;
        const sun = Math.sin(((hr - 6) / 12) * Math.PI);
        const day = clamp(sun * 1.5, 0, 1);
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, `rgb(${8 + 40 * day},${12 + 90 * day},${30 + 140 * day})`);
        sky.addColorStop(1, `rgb(${10 + 60 * day},${14 + 70 * day},${30 + 80 * day})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        if (day > 0.02) {
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, w * (0.1 + 0.8 * ((hr - 6) / 12)), h * 0.42 - sun * h * 0.3, 60, '#ffd27a', 0.3);
          ctx.globalCompositeOperation = 'source-over';
        }
        const G0 = Math.max(260, h * 0.58);
        ctx.fillStyle = `rgb(${14 + 20 * day},${30 + 40 * day},${20 + 20 * day})`;
        ctx.fillRect(0, G0, w, h - G0);
        const s = solve();
        const X = (f) => f * w;

        // --- source
        const sx = X(0.09);
        if (params.source === 'thermal') {
          ctx.fillStyle = '#5a6278';
          ctx.fillRect(sx - 40, G0 - 50, 50, 50);
          ctx.beginPath();
          ctx.moveTo(sx + 14, G0);
          ctx.quadraticCurveTo(sx + 26, G0 - 40, sx + 18, G0 - 80);
          ctx.lineTo(sx + 50, G0 - 80);
          ctx.quadraticCurveTo(sx + 42, G0 - 40, sx + 54, G0);
          ctx.fill();
          for (let k = 0; k < 5; k++) {
            const p = (api.time * 0.3 + k / 5) % 1;
            ctx.fillStyle = `rgba(230,235,245,${0.35 * (1 - p)})`;
            ctx.beginPath();
            ctx.arc(sx + 34 + p * 20, G0 - 84 - p * 70, 10 + p * 18, 0, TAU);
            ctx.fill();
          }
        } else if (params.source === 'hydro') {
          ctx.fillStyle = '#7a8296';
          ctx.beginPath();
          ctx.moveTo(sx - 50, G0 - 90);
          ctx.lineTo(sx + 10, G0 - 90);
          ctx.lineTo(sx + 30, G0);
          ctx.lineTo(sx - 50, G0);
          ctx.fill();
          ctx.fillStyle = 'rgba(60,140,230,0.7)';
          ctx.fillRect(0, G0 - 80, sx - 50, 80);
          ctx.fillStyle = 'rgba(140,200,255,0.6)';
          for (let k = 0; k < 6; k++) ctx.fillRect(sx + 12 + ((api.time * 40 + k * 7) % 20), G0 - 30 + k * 4, 6, 2);
        } else if (params.source === 'wind') {
          for (const [dx, sc] of [[-30, 0.8], [20, 1]]) {
            const bx = sx + dx, top = G0 - 110 * sc;
            ctx.strokeStyle = '#d8dce8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(bx, G0);
            ctx.lineTo(bx, top);
            ctx.stroke();
            for (let k = 0; k < 3; k++) {
              const a = spin * sc + (k * TAU) / 3;
              ctx.beginPath();
              ctx.moveTo(bx, top);
              ctx.lineTo(bx + Math.cos(a) * 46 * sc, top + Math.sin(a) * 46 * sc);
              ctx.stroke();
            }
          }
        } else {
          for (let k = 0; k < 4; k++) {
            ctx.fillStyle = day > 0.05 ? '#2a5bd6' : '#1a2550';
            ctx.save();
            ctx.translate(sx - 50 + k * 26, G0 - 14);
            ctx.transform(1, 0, -0.5, 1, 0, 0);
            ctx.fillRect(0, -16, 22, 16);
            ctx.restore();
          }
        }
        if (!api.thumbnail) tag(ctx, `generating ${s.G.toFixed(0)} MW`, sx, G0 + (api.w < 600 ? 50 : 24), C.amber, { align: 'center', size: 10 });

        // --- line route: station → step-up → pylons → substation → homes
        const tx1 = X(0.2), tx2 = X(0.74), hx0 = X(0.82), hx1 = X(0.98);
        const pylons = [X(0.3), X(0.42), X(0.54), X(0.66)];
        const ptop = G0 - 120;
        // pylons
        for (const px of pylons) {
          ctx.strokeStyle = '#8b93ad';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - 16, G0);
          ctx.lineTo(px, ptop);
          ctx.lineTo(px + 16, G0);
          ctx.moveTo(px - 20, ptop + 14);
          ctx.lineTo(px + 20, ptop + 14);
          ctx.moveTo(px - 11, G0 - 40);
          ctx.lineTo(px + 11, G0 - 40);
          ctx.stroke();
        }
        // wire path points (with sag)
        const pts = [[sx + 10, G0 - 30], [tx1, G0 - 40]];
        let prev = [tx1, ptop + 14];
        pts.push(prev);
        for (const px of pylons.concat([tx2])) {
          const nxt = [px, ptop + 14];
          for (let k = 1; k <= 8; k++) {
            const f = k / 8;
            pts.push([prev[0] + (nxt[0] - prev[0]) * f, prev[1] + (nxt[1] - prev[1]) * f + Math.sin(f * Math.PI) * 18]);
          }
          prev = nxt;
        }
        pts.push([tx2, G0 - 40]);
        const hvStart = 2, hvEnd = pts.length - 2;
        const heat = clamp(s.lossFrac * 2.2, 0, 1);
        for (let i = 1; i < pts.length; i++) {
          const hv = i > hvStart && i <= hvEnd;
          ctx.strokeStyle = hv ? `rgb(${120 + 135 * heat},${130 - 60 * heat},${150 - 120 * heat})` : '#9aa2bb';
          ctx.lineWidth = hv ? 2 + heat * 2 : 2;
          ctx.beginPath();
          ctx.moveTo(...pts[i - 1]);
          ctx.lineTo(...pts[i]);
          ctx.stroke();
        }
        if (heat > 0.05) {
          ctx.globalCompositeOperation = 'lighter';
          for (let i = hvStart + 1; i < hvEnd; i += 3) drawGlow(ctx, pts[i][0], pts[i][1], 10 + heat * 26, '#ff6a3d', 0.15);
          ctx.globalCompositeOperation = 'source-over';
        }
        // current dots
        const segL = [];
        let tot = 0;
        for (let i = 1; i < pts.length; i++) {
          const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          segL.push(d);
          tot += d;
        }
        const gap = 26;
        let si = 0, acc = 0;
        ctx.fillStyle = '#9be4ff';
        for (let d = flow % gap; d < tot; d += gap) {
          while (si < segL.length - 1 && acc + segL[si] < d) acc += segL[si++];
          const f = (d - acc) / segL[si];
          const x = pts[si][0] + (pts[si + 1][0] - pts[si][0]) * f, y = pts[si][1] + (pts[si + 1][1] - pts[si][1]) * f;
          ctx.beginPath();
          ctx.arc(x, y, si > hvStart - 1 && si < hvEnd ? 2 + Math.min(4, s.I / 3000) : 2.5, 0, TAU);
          ctx.fill();
        }
        // transformers
        for (const [x, lbl] of [[tx1, 'step-up'], [tx2, 'step-down']]) {
          ctx.fillStyle = '#3b4560';
          ctx.fillRect(x - 16, G0 - 46, 32, 46);
          ctx.strokeStyle = '#d68a3a';
          ctx.lineWidth = 2;
          for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.arc(x - 6, G0 - 36 + k * 8, 4, 0, TAU);
            ctx.arc(x + 6, G0 - 36 + k * 8, 4, 0, TAU);
            ctx.stroke();
          }
          if (!api.thumbnail) tag(ctx, lbl, x, G0 + 24, C.dim, { align: 'center', size: 9 });
        }
        // homes
        const n = 6;
        for (let k = 0; k < n; k++) {
          const x = hx0 + ((hx1 - hx0) * k) / (n - 1), y = G0;
          const lit = s.G >= s.D - 1 || k < Math.floor((n * s.G) / Math.max(1, s.D));
          ctx.fillStyle = '#2b3150';
          ctx.fillRect(x - 12, y - 20, 24, 20);
          ctx.beginPath();
          ctx.moveTo(x - 15, y - 20);
          ctx.lineTo(x, y - 32);
          ctx.lineTo(x + 15, y - 20);
          ctx.fill();
          ctx.fillStyle = lit ? (day < 0.5 ? '#ffd27a' : 'rgba(255,210,122,0.5)') : '#0b0d18';
          ctx.fillRect(x - 6, y - 14, 5, 6);
          ctx.fillRect(x + 2, y - 14, 5, 6);
          if (lit && day < 0.5) {
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, x, y - 11, 14, '#ffb547', 0.2);
            ctx.globalCompositeOperation = 'source-over';
          }
        }
        if (!api.thumbnail) {
          tag(ctx, `${params.kv} kV · ${Math.round(s.I).toLocaleString()} A`, (pylons[1] + pylons[2]) / 2, ptop - 24, s.melt ? C.red : C.cyan, { align: 'center', size: 11 });
          tag(ctx, s.melt ? 'WIRES WOULD MELT' : `${(s.lossFrac * 100).toFixed(1)}% lost as heat`, (pylons[1] + pylons[2]) / 2, ptop - 50, s.lossFrac > 0.1 ? C.red : C.lime, { align: 'center', size: 11 });
          tag(ctx, '230 V homes', (hx0 + hx1) / 2, G0 + 24, C.amber, { align: 'center', size: 9 });
          const hh = Math.floor(hr), mm = Math.floor((hr % 1) * 60);
          tag(ctx, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}  ·  demand ${s.D.toFixed(0)} MW`, w - 16, 84, C.ink, { align: 'right', size: 11 });
          if (s.G < s.D - 1) tag(ctx, `SHORTFALL ${(s.D - s.G).toFixed(0)} MW — needs storage/backup`, w - 16, 110, C.red, { align: 'right', size: 11 });
        }
      },
      stats() {
        const s = solve();
        return [
          { label: 'Demand', value: s.D.toFixed(0) + ' MW' },
          { label: 'Generation', value: s.G.toFixed(0) + ' MW', color: s.G >= s.D - 1 ? C.lime : C.red },
          { label: 'Line current', value: Math.round(s.I).toLocaleString() + ' A', color: C.cyan },
          { label: 'Lost in the line', value: s.melt ? 'more than delivered!' : (s.lossFrac * 100).toFixed(1) + ' %', color: s.lossFrac > 0.1 ? C.red : C.lime },
        ];
      },
      charts() {
        const D = [], G = [];
        for (let hh = 0; hh <= 24; hh += 0.5) {
          D.push(demand(hh));
          G.push(params.source === 'thermal' || params.source === 'hydro' ? demand(hh) : params.source === 'solar' ? (hh > 6 && hh < 18 ? 900 * Math.sin(((hh - 6) / 12) * Math.PI) : 0) : clamp(380 + 260 * Math.sin(hh * 1.3) * Math.cos(hh * 0.37 + 1), 40, 800));
        }
        return [{ title: 'Over 24 h: demand (dashed) vs this source', series: [{ data: G, color: C.lime }], ref: { data: D, color: '#ffffff' }, min: 0, xLabel: '00:00 → 24:00' }];
      },
    };
  },
};
