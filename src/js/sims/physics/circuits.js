import { C, TAU, backdrop, drawGlow, tag, text, Series } from '../../core/util.js';

const R_INTERNAL = 0.3;

export default {
  id: 'circuits',
  title: 'Electric Circuits',
  category: 'physics',
  tagline: 'Voltage pushes, resistance resists, current flows. Why one dead bulb can kill the whole string.',
  ages: ['11-14', '14-16'],
  topics: ['Electricity'],
  blurb:
    'A battery is a pump for electric charge. It pushes electrons around a closed loop of wire, and anything in the loop — a bulb, a heater, a phone — turns that flow into light, heat or work. Wire bulbs one after another or side by side and they behave completely differently.',
  ideas: [
    '<b>Current</b> (amps) is how much charge flows per second; <b>voltage</b> (volts) is the push.',
    '<b>Ohm’s law</b>: current = voltage ÷ resistance.',
    'In <b>series</b>, bulbs share the voltage, so each is dimmer — and one break stops everything.',
    'In <b>parallel</b>, each bulb gets the full voltage and its own path. Homes are wired this way.',
  ],
  hint: 'Click a bulb to break or fix it · click the switch',
  thumbChapter: 4,
  thumbFrames: 60,
  params: [
    { key: 'layout', label: 'Wiring', type: 'select', value: 'single', options: [{ value: 'single', label: 'One bulb' }, { value: 'series', label: 'Series' }, { value: 'parallel', label: 'Parallel' }] },
    { key: 'V', label: 'Battery voltage', type: 'range', min: 1.5, max: 12, step: 0.5, value: 6, unit: 'V', digits: 1 },
    { key: 'R', label: 'Resistance per bulb', type: 'range', min: 2, max: 30, step: 1, value: 12, unit: 'Ω' },
    { key: 'n', label: 'Bulbs (series/parallel)', type: 'range', min: 2, max: 4, step: 1, value: 3, instant: true },
    { key: 'on', label: 'Switch closed', type: 'toggle', value: true },
    { key: 'fix', label: 'Fix all bulbs', type: 'button', action: (s) => s.fixAll() },
  ],
  story: [
    {
      title: 'A complete loop',
      text: 'A battery, a switch and a bulb, joined in a loop of wire. The blue dots are electrons. The battery pushes them out of its negative end, round the loop and back in at the positive end. Where they squeeze through the thin filament, it heats up and glows.',
      params: { layout: 'single', V: 6, R: 12, on: true },
      enter: (s) => s.fixAll(),
      duration: 12,
    },
    {
      title: 'Open the switch',
      text: 'Break the loop anywhere and the flow stops everywhere at once. Electricity needs a <b>complete circuit</b>.',
      params: { layout: 'single', on: false },
      enter: (s) => s.later(5, (r) => r.set('on', true)),
      duration: 10,
    },
    {
      title: 'More push, more flow',
      text: 'Double the voltage and the current doubles: the electrons drift faster and the bulb blazes. The bulb’s power rises with the <b>square</b> of the current, which is why it gets so much brighter.',
      formula: 'I = V / R,     P = V · I',
      params: { layout: 'single', on: true, V: 12, R: 12 },
      tween: 4,
      duration: 13,
    },
    {
      title: 'Bulbs in series',
      check: {
        q: 'This bulb runs on a 9 V battery. Add two more identical bulbs in a single line (in series). Each bulb will glow…',
        options: ['brighter', 'the same', 'dimmer'],
        answer: 2,
        setup: { layout: 'single', V: 9, R: 10, on: true },
        explain: 'The same 9 V now pushes current through three times the resistance, so the current falls to a third and each bulb gets just 3 V.',
      },
      text: 'Three bulbs in a single line. The same current must pass through all of them, and they share the battery’s voltage, so each glows dimly. Now one bulb breaks — and <b>all</b> go dark. Old Christmas lights were wired like this.',
      formula: 'R_total = R₁ + R₂ + R₃',
      params: { layout: 'series', n: 3, V: 9, R: 10, on: true },
      enter: (s) => {
        s.fixAll();
        s.later(7, () => s.toggle(1));
      },
      duration: 15,
    },
    {
      title: 'Bulbs in parallel',
      check: {
        q: 'Now give each bulb its own path across the battery (in parallel). How bright is each one?',
        options: ['Dimmer than in series', 'As bright as one bulb alone', 'Dark: parallel wires short out the battery'],
        answer: 1,
        explain: 'In parallel each bulb gets the full 9 V, so each glows like a bulb on its own. The battery supplies three times the current, so it runs down three times faster.',
      },
      text: 'Now each bulb has its own path straight across the battery. Each gets the full voltage and glows brightly; the battery supplies the sum of the currents. Break one and the others carry on — that is how your home is wired.',
      formula: '1/R_total = 1/R₁ + 1/R₂ + 1/R₃',
      params: { layout: 'parallel', n: 3, V: 9, R: 10, on: true },
      enter: (s) => {
        s.fixAll();
        s.later(7, () => s.toggle(1));
      },
      duration: 15,
    },
    {
      title: 'Build your own',
      text: 'Switch between wirings, change the voltage and resistance, and click bulbs to break them. Watch the meter readings next to each bulb.',
      params: { layout: 'parallel', n: 3, V: 6, R: 12 },
      enter: (s) => s.fixAll(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let broken = [false, false, false, false], jobs = [], phase = [0, 0, 0, 0], glow = [0, 0, 0, 0];
    const sI = new Series(300);

    const count = () => (params.layout === 'single' ? 1 : Math.round(params.n));

    function solve() {
      const n = count(), R = params.R, V = params.on ? params.V : 0;
      const bulbs = [];
      let I = 0;
      if (params.layout === 'parallel') {
        for (let k = 0; k < n; k++) bulbs.push({ I: 0, V: 0 });
        const live = bulbs.map((_, k) => !broken[k]);
        const nl = live.filter(Boolean).length;
        if (nl) {
          const Rp = R / nl;
          I = V / (Rp + R_INTERNAL);
          const Vb = I * Rp;
          bulbs.forEach((b, k) => {
            b.V = Vb;
            b.I = live[k] ? Vb / R : 0;
          });
        }
      } else {
        const ok = !broken.slice(0, n).some(Boolean);
        I = ok ? V / (n * R + R_INTERNAL) : 0;
        for (let k = 0; k < n; k++) bulbs.push({ I, V: ok ? I * R : broken[k] ? V : 0 });
      }
      return { I, bulbs };
    }

    const geom = () => {
      const { w, h } = api;
      const x0 = Math.max(60, w * 0.16), x1 = w - Math.max(50, w * 0.12);
      const y0 = Math.max(130, h * 0.2), y1 = Math.max(y0 + 160, h * 0.6);
      const n = count();
      const pos = [];
      for (let k = 0; k < n; k++) {
        if (params.layout === 'parallel') pos.push([x0 + ((x1 - x0) * (k + 1)) / (n + 0.6), (y0 + y1) / 2]);
        else pos.push([x0 + ((x1 - x0) * (k + 1)) / (n + 1), y0]);
      }
      return { x0, x1, y0, y1, pos, by: (y0 + y1) / 2, sw: [x0 + (x1 - x0) * 0.25, y1] };
    };

    /** Loops as polylines (electron direction: from − terminal, round, into +). */
    function loops(g) {
      const { x0, x1, y0, y1, pos, by } = g;
      // battery on the left side: + at the top, − at the bottom; electrons leave − (bottom)
      if (params.layout === 'parallel')
        return pos.map(([bx]) => [[x0, by + 14], [x0, y1], [bx, y1], [bx, y0], [x0, y0], [x0, by - 14]]);
      return [[[x0, by + 14], [x0, y1], [x1, y1], [x1, y0], [x0, y0], [x0, by - 14]]];
    }

    return {
      fixAll() {
        broken = [false, false, false, false];
      },
      toggle(k) {
        broken[k] = !broken[k];
      },
      later(t, fn) {
        jobs.push({ t, fn });
      },
      pointerDown(p) {
        const g = geom();
        const hit = g.pos.findIndex(([x, y]) => Math.hypot(p.x - x, p.y - y) < 30);
        if (hit >= 0) broken[hit] = !broken[hit];
        else if (Math.hypot(p.x - g.sw[0], p.y - g.sw[1]) < 34) api.runner.set('on', !params.on);
      },
      update(dt) {
        for (const j of jobs) if ((j.t -= dt) <= 0) j.fn(api.runner);
        jobs = jobs.filter((j) => j.t > 0);
        const { I, bulbs } = solve();
        bulbs.forEach((b, k) => {
          const target = Math.min(1.6, (b.I * b.I * params.R) / 3);
          glow[k] += (target - glow[k]) * Math.min(1, dt * 8);
        });
        const n = count();
        for (let k = 0; k < n; k++) phase[k] += dt * 60 * (params.layout === 'parallel' ? bulbs[k].I : I);
        if (api.frame % 2 === 0) sI.push(I);
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0d1124' });
        const g = geom();
        const { x0, x1, y0, y1, pos, by } = g;
        const { I, bulbs } = solve();
        // wires
        ctx.strokeStyle = '#c98a4a';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x0, by - 14);
        ctx.lineTo(x0, y0);
        if (params.layout === 'parallel') {
          ctx.lineTo(pos[pos.length - 1][0], y0);
          ctx.moveTo(x0, by + 14);
          ctx.lineTo(x0, y1);
          ctx.lineTo(g.sw[0] - 22, y1);
          ctx.moveTo(g.sw[0] + 22, y1);
          ctx.lineTo(pos[pos.length - 1][0], y1);
          for (const [bx] of pos) {
            ctx.moveTo(bx, y0);
            ctx.lineTo(bx, by - 18);
            ctx.moveTo(bx, by + 18);
            ctx.lineTo(bx, y1);
          }
        } else {
          for (const [bx] of pos) {
            ctx.lineTo(bx - 18, y0);
            ctx.moveTo(bx + 18, y0);
          }
          ctx.lineTo(x1, y0);
          ctx.lineTo(x1, y1);
          ctx.lineTo(g.sw[0] + 22, y1);
          ctx.moveTo(g.sw[0] - 22, y1);
          ctx.lineTo(x0, y1);
          ctx.lineTo(x0, by + 14);
        }
        ctx.stroke();

        // switch
        const [sx, sy] = g.sw;
        ctx.fillStyle = '#e8e2d0';
        ctx.beginPath();
        ctx.arc(sx - 22, sy, 4, 0, TAU);
        ctx.arc(sx + 22, sy, 4, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#e8e2d0';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(sx - 22, sy);
        const a = params.on ? 0 : -0.55;
        ctx.lineTo(sx - 22 + Math.cos(a) * 44, sy + Math.sin(a) * 44);
        ctx.stroke();
        if (!api.thumbnail) tag(ctx, params.on ? 'switch: closed' : 'switch: open', sx, sy + 28, params.on ? C.teal : C.red, { align: 'center', size: 10 });

        // battery
        ctx.fillStyle = '#0d1124';
        ctx.fillRect(x0 - 26, by - 14, 52, 28);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x0 - 22, by - 8);
        ctx.lineTo(x0 + 22, by - 8);
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x0 - 12, by + 6);
        ctx.lineTo(x0 + 12, by + 6);
        ctx.stroke();
        text(ctx, '+', x0 + 32, by - 9, { size: 15, weight: 700, color: C.red });
        text(ctx, '−', x0 + 32, by + 8, { size: 15, weight: 700, color: C.blue });
        tag(ctx, `${params.V.toFixed(1)} V`, x0 - 34, by, C.amber, { align: 'right', size: 12 });

        // electrons
        const L = loops(g);
        ctx.fillStyle = '#7fb2ff';
        L.forEach((pts, k) => {
          const segs = [];
          let total = 0;
          for (let i = 1; i < pts.length; i++) {
            const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
            segs.push(d);
            total += d;
          }
          const gap = 22;
          const off = (((phase[k] + k * 7) % gap) + gap) % gap;
          let si = 0, acc = 0;
          for (let d = off; d < total; d += gap) {
            while (si < segs.length - 1 && acc + segs[si] < d) acc += segs[si++];
            const f = (d - acc) / segs[si];
            const x = pts[si][0] + (pts[si + 1][0] - pts[si][0]) * f;
            const y = pts[si][1] + (pts[si + 1][1] - pts[si][1]) * f;
            ctx.beginPath();
            ctx.arc(x, y, 2.6, 0, TAU);
            ctx.fill();
          }
        });

        // bulbs
        pos.forEach(([bx, bby], k) => {
          const gl = glow[k];
          if (gl > 0.01) {
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, bx, bby, 30 + gl * 90, '#ffcf6b', 0.12);
            ctx.globalCompositeOperation = 'source-over';
          }
          ctx.fillStyle = gl > 0.02 ? `rgba(255,${210 + 40 * Math.min(1, gl)},${140 + 100 * Math.min(1, gl)},${0.25 + 0.7 * Math.min(1, gl)})` : 'rgba(200,210,240,0.1)';
          ctx.strokeStyle = 'rgba(255,255,255,0.55)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(bx, bby, 18, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = broken[k] ? '#666' : '#ffe9b0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const vert = params.layout === 'parallel';
          for (let i = 0; i <= 8; i++) {
            const t = -10 + i * 2.5, o = i % 2 ? 4 : -4;
            if (vert) ctx[i ? 'lineTo' : 'moveTo'](bx + o, bby + t);
            else ctx[i ? 'lineTo' : 'moveTo'](bx + t, bby + o);
          }
          ctx.stroke();
          if (broken[k]) {
            ctx.strokeStyle = C.red;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx - 10, bby - 10);
            ctx.lineTo(bx + 10, bby + 10);
            ctx.moveTo(bx + 10, bby - 10);
            ctx.lineTo(bx - 10, bby + 10);
            ctx.stroke();
          }
          if (!api.thumbnail) {
            const b = bulbs[k];
            const ty = params.layout === 'parallel' ? bby : bby - 38;
            const tx = params.layout === 'parallel' ? bx + 26 : bx;
            tag(ctx, broken[k] ? 'broken' : `${b.V.toFixed(1)} V · ${b.I.toFixed(2)} A`, tx, ty, broken[k] ? C.red : C.amber, { align: params.layout === 'parallel' ? 'left' : 'center', size: 10 });
          }
        });
        if (!api.thumbnail) tag(ctx, `battery current ${I.toFixed(2)} A`, x0, y1 + 30, '#7fb2ff', { align: 'left', size: 11 });
      },
      stats() {
        const { I, bulbs } = solve();
        const P = bulbs.reduce((s, b) => s + b.I * b.I * params.R, 0);
        const Rt = I > 0 ? (params.on ? params.V / I - R_INTERNAL : 0) : Infinity;
        return [
          { label: 'Current from battery', value: I.toFixed(2) + ' A', color: '#7fb2ff' },
          { label: 'Total resistance', value: isFinite(Rt) ? Rt.toFixed(1) + ' Ω' : 'open circuit' },
          { label: 'Power to bulbs', value: P.toFixed(1) + ' W', color: C.amber },
          { label: 'Voltage per bulb', value: bulbs.map((b) => b.V.toFixed(1)).join(' · ') + ' V' },
        ];
      },
      charts() {
        return [{ title: 'Battery current (A)', series: [{ data: sI.data, color: '#7fb2ff' }], min: 0, length: 300 }];
      },
    };
  },
};
