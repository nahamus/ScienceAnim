import { C, Series, backdrop, clamp, lerp, rand, roundRect, tag, text, TAU } from '../../core/util.js';

// Cars on a ring road, each following the one ahead with the Intelligent Driver Model (Treiber, Hennecke & Helbing
// 2000), but reacting to what it saw a moment ago (human reaction time) with a little random wobble. Small speed
// changes then grow from car to car into stop-and-go waves that travel backwards: phantom jams.

const L = 230, LEN = 4.5, S0 = 2, A = 1.0, B = 1.5, V0 = 14, HEAD = 1.2, DT = 0.05, PLAY = 3; // metres, m/s, s
// speed colour: red when stopped, amber around 15 km/h, green from 30 km/h (the ring is too crowded to go much faster)
const COL = (v) => {
  const k = clamp(v / 8.3, 0, 1), RED = [255, 77, 109], AMB = [255, 181, 71], GRN = [46, 230, 166];
  const [p, q, t] = k < 0.5 ? [RED, AMB, k * 2] : [AMB, GRN, (k - 0.5) * 2];
  return `rgb(${p.map((c, i) => Math.round(lerp(c, q[i], t))).join(',')})`;
};

export default {
  id: 'traffic',
  title: 'Phantom Traffic Jams',
  category: 'math',
  tagline: 'No crash, no roadworks, no bottleneck, yet the traffic stops. Where do jams come from?',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Complex systems', 'Waves', 'Modelling'],
  keywords: ['traffic jam', 'phantom jam', 'stop-and-go', 'shockwave', 'intelligent driver model', 'Sugiyama', 'self-driving car', 'emergence', 'instability'],
  blurb:
    'In 2008 Japanese researchers asked 22 drivers to drive steadily round a circular track. Within minutes a traffic jam appeared from nowhere and rolled backwards round the circle. Each driver reacts a fraction of a second late and brakes a little harder than the car in front; small wobbles grow into waves. Watch it happen, find out why fewer cars or one patient driver can stop it.',
  ideas: [
    'Each driver only reacts to the car ahead, and with a <b>delay</b> of about a second.',
    'Reacting late means braking harder than needed; the next driver brakes harder still, so small wobbles <b>grow</b>.',
    'The jam is a <b>wave</b>: it travels backwards while cars drive in at the back and out at the front.',
    'Above a critical <b>density</b> steady traffic is unstable; with bigger gaps the wobbles die away.',
    'A single smooth driver, or a well-programmed self-driving car, can <b>damp</b> the waves for everyone.',
  ],
  hint: 'Tap the brakes button, or change the reaction time',
  thumbChapter: 3,
  thumbFrames: 1500,
  params: [
    { key: 'cars', label: 'Cars on the 230 m ring', type: 'range', min: 8, max: 32, step: 1, value: 22, instant: true },
    { key: 'react', label: 'Driver reaction time', type: 'range', min: 0, max: 1.2, step: 0.05, value: 0, format: (v) => v.toFixed(2) + ' s' },
    { key: 'wobble', label: 'Driver wobble', type: 'range', min: 0, max: 1, step: 0.05, value: 0, format: (v) => (v === 0 ? 'perfect' : v < 0.4 ? 'slight' : v < 0.7 ? 'jumpy' : 'erratic') },
    { key: 'smart', label: 'One smart, patient car', type: 'toggle', value: false },
    { key: 'brake', label: 'Tap the brakes', type: 'button', action: (s) => s.brake() },
    { key: 'restart', label: 'Even spacing, start again', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'Round and round',
      text: 'In 2008 researchers in Nagoya, Japan, put 22 cars on a circular track 230 m round and asked the drivers to keep a steady speed. Here are perfect robot drivers: they react instantly and never wobble, so the traffic flows smoothly forever.',
      params: { cars: 22, react: 0, wobble: 0, smart: false },
      enter: (s) => s.restart(),
      duration: 12,
    },
    {
      title: 'Human drivers',
      text: 'Real drivers react to the car ahead a fraction of a second late, and never hold a perfectly steady speed. Watch: a tiny slowdown makes the driver behind brake a little harder, the next one harder still, and soon cars are stopping completely.',
      params: { cars: 22, react: 0.6, wobble: 0.3, smart: false },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'A wave going backwards',
      text: 'The chart on the right is a space–time diagram: each row is a moment, newest at the top, and each dot a car coloured by speed. The red stripes are jams, and they slope the “wrong” way: a jam drifts backwards, against the traffic, at about 15–20 km/h. Cars drive into its back and escape from its front.',
      params: { cars: 22, react: 0.6, wobble: 0.3 },
      duration: 16,
    },
    {
      title: 'What caused it?',
      text: 'There was no accident, no narrowing, no junction.',
      check: {
        q: 'What caused this traffic jam?',
        options: ['Small speed changes growing as each driver reacts a little late', 'One driver who stopped on purpose', 'The road being too narrow'],
        answer: 0,
        setup: { cars: 22, react: 0.6, wobble: 0.3 },
        explain: 'Nobody did anything wrong. Each driver’s delayed reaction made them overcorrect, and the overcorrections grew from car to car. Engineers call it string instability; drivers call it a phantom jam.',
      },
      params: { cars: 22, react: 0.6, wobble: 0.3 },
      duration: 14,
    },
    {
      title: 'Fewer cars',
      text: 'Take some cars off the road. With bigger gaps, each driver has room to slow gently, the wobbles shrink instead of growing, and traffic flows. There is a critical density: below it traffic heals itself, above it jams appear by themselves.',
      check: {
        q: 'Why does no jam form with fewer cars on the same road?',
        options: ['Bigger gaps let drivers slow gently, so wobbles shrink instead of growing', 'The drivers are better', 'The cars go too fast to jam'],
        answer: 0,
        setup: { cars: 14, react: 0.6, wobble: 0.3 },
        explain: 'With room to spare, a driver who reacts late can still ease off softly, so the next driver barely notices. That is why ramp meters, which let cars onto a motorway one at a time, can keep traffic moving.',
      },
      params: { cars: 14, react: 0.6, wobble: 0.3 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'One tap of the brakes',
      text: 'Back to 22 cars, smooth for now. One driver taps the brakes for a second, perhaps to glance at a phone. The ripple it starts doesn’t fade: it keeps circling, long after the driver has sped up again.',
      params: { cars: 22, react: 0.45, wobble: 0.05, smart: false },
      enter: (s) => {
        s.restart();
        setTimeout(() => s.brake(), 2500);
      },
      duration: 18,
    },
    {
      title: 'A smart car',
      text: 'Now one car (blue) drives differently: it leaves a bigger gap and refuses to brake hard, cruising at the average speed instead of chasing the car ahead. In a 2017 experiment in Arizona, one such self-driving car among 20 human-driven ones calmed the stop-and-go waves, cutting braking and fuel use for everyone. Give it half a minute and watch the stopped cars dwindle.',
      params: { cars: 22, react: 0.6, wobble: 0.3, smart: true },
      enter: (s) => s.restart(),
      duration: 32,
    },
    {
      title: 'Your road',
      text: 'Change the number of cars, the reaction time and the wobble, tap the brakes, and switch the smart car on and off. Can you find the most cars the ring can hold without jamming?',
      params: { cars: 22, react: 0.6, wobble: 0.3, smart: false },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let x = [], v = [], hist = [], braking = 0, brakeCar = 5, avg = 5, rows = [], rowT = 0;
    const sSpeed = new Series(500);

    function restart() {
      const n = Math.round(params.cars);
      x = Array.from({ length: n }, (_, i) => (i * L) / n + rand(-0.2, 0.2));
      v = new Array(n).fill(7);
      v[0] = 4; // one car starts a little slow, as real drivers never start perfectly even
      hist = [];
      rows = [];
      braking = 0;
      avg = 7;
      sSpeed.clear();
    }
    function brake() {
      braking = 1.2;
      brakeCar = Math.min(5, x.length - 1);
    }
    function step() {
      const n = x.length;
      hist.push({ x: x.slice(), v: v.slice() });
      const lag = Math.round(params.react / DT);
      while (hist.length > lag + 1) hist.shift();
      const H = hist[0], nv = v.slice();
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, smart = params.smart && i === 0;
        // a human driver reacts to the gap and speeds they saw a reaction-time ago; the smart car sees the present
        const src = smart ? { x, v } : H;
        let gap = (src.x[j] - src.x[i] + L) % L - LEN;
        if (n === 1) gap = L - LEN;
        gap = Math.max(0.1, gap);
        const vi = v[i], dv = src.v[i] - src.v[j];
        const head = smart ? 0.9 : HEAD; // the smart car's safety check alone; it cruises on a steady target
        const want = S0 + Math.max(0, vi * head + (vi * dv) / (2 * Math.sqrt(A * B)));
        let acc = A * (1 - (vi / V0) ** 4 - (want / gap) ** 2);
        if (!smart) acc += params.wobble * (Math.random() - 0.5) * 2 * 0.6;
        // the smart car cruises at the traffic's average speed rather than chasing the car ahead
        // the smart car cruises at the traffic's long-run average speed, using its gap as a buffer, and only brakes
        // when the safety check demands it
        else acc = Math.min(acc, clamp(0.5 * (avg - vi), -0.8, 0.4));
        if (i === brakeCar && braking > 0) acc = -4;
        nv[i] = Math.max(0, vi + acc * DT);
      }
      v = nv;
      for (let i = 0; i < n; i++) x[i] = (x[i] + v[i] * DT) % L;
      // never let a car pass through the one ahead
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, gap = (x[j] - x[i] + L) % L;
        if (n > 1 && gap < LEN + 0.3) (x[i] = (x[j] - LEN - 0.3 + L) % L), (v[i] = Math.min(v[i], v[j]));
      }
      braking = Math.max(0, braking - DT);
      const mean = v.reduce((a, b) => a + b, 0) / Math.max(1, n);
      avg += ((mean - avg) * DT) / 20;
    }
    const layout = () => {
      const { w, h } = api;
      if (w < 760) {
        const R = Math.min(w * 0.36, h * 0.2);
        return { cx: w / 2, cy: 110 + R + 14, R, st: { x: 20, y: 110 + 2 * R + 60, w: w - 40, h: Math.max(60, h - (110 + 2 * R + 60) - 110) } }; // phones: caption clear of the hint
      }
      const R = Math.min(w * 0.2, h * 0.27);
      const sx = Math.max(w * 0.5, 40 + 2 * R + 80);
      return { cx: 40 + R + 30, cy: 120 + R, R, st: { x: sx, y: 120, w: w - sx - 30, h: Math.min(h - 400, 460) } };
    };

    return {
      restart,
      brake,
      reset: restart,
      resize() {
        if (!x.length) restart();
      },
      onParam(k) {
        if (k === 'cars') restart();
      },
      update(dt) {
        if (!x.length) return;
        dt = Math.min(dt, 0.05) * PLAY;
        const n = Math.round(dt / DT);
        for (let i = 0; i < Math.max(1, n); i++) step();
        rowT += dt;
        if (rowT >= 0.5) {
          rowT = 0;
          rows.push(x.map((p, i) => [p, v[i]]));
          if (rows.length > 400) rows.shift();
        }
        if (api.frame % 3 === 0) sSpeed.push((v.reduce((a, b) => a + b, 0) / Math.max(1, v.length)) * 3.6);
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0c1222' });
        if (!x.length) return;
        const { cx, cy, R, st } = layout();
        // road
        ctx.strokeStyle = '#2a2f3d';
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 10]);
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        // cars
        const scale = (TAU * R) / L;
        for (let i = 0; i < x.length; i++) {
          const a = (x[i] / L) * TAU - Math.PI / 2;
          ctx.save();
          ctx.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
          ctx.rotate(a + Math.PI / 2);
          const smart = params.smart && i === 0;
          ctx.fillStyle = smart ? '#4d8dff' : COL(v[i]);
          roundRect(ctx, -LEN * scale * 0.5, -6, LEN * scale, 12, 3);
          ctx.fill();
          if (i === brakeCar && braking > 0) {
            ctx.fillStyle = '#ff2040';
            ctx.fillRect(-LEN * scale * 0.5, -7, 3, 14);
          }
          ctx.restore();
        }
        if (!api.thumbnail) {
          const mean = (v.reduce((p, q) => p + q, 0) / v.length) * 3.6;
          text(ctx, `${mean.toFixed(0)} km/h`, cx, cy - 8, { size: 22, align: 'center', weight: 700, color: COL(mean / 3.6) });
          text(ctx, 'average speed', cx, cy + 16, { size: 11, align: 'center', color: C.dim });
          if (params.smart) tag(ctx, 'smart car', cx + Math.cos((x[0] / L) * TAU - Math.PI / 2) * (R + 30), cy + Math.sin((x[0] / L) * TAU - Math.PI / 2) * (R + 30), '#7fb0ff', { align: 'center', size: 10 });
        }
        // space–time diagram: newest row at the top, each dot a car coloured by its speed
        if (st.h > 60 && !api.thumbnail) {
          ctx.fillStyle = 'rgba(8,11,22,0.85)';
          roundRect(ctx, st.x - 10, st.y - 28, st.w + 20, st.h + 52, 12);
          ctx.fill();
          text(ctx, 'position round the ring →', st.x, st.y - 14, { size: 10, color: C.dim, shadow: false });
          text(ctx, 'time ↓ (now at the top)', st.x + st.w, st.y - 14, { size: 10, align: 'right', color: C.dim, shadow: false });
          const rh = st.h / 200;
          for (let r = 0; r < rows.length && r < 200; r++) {
            const row = rows[rows.length - 1 - r], y = st.y + r * rh;
            for (const [p, sp] of row) {
              ctx.fillStyle = COL(sp);
              ctx.fillRect(st.x + (p / L) * st.w - 1, y, 2.5, Math.max(1.5, rh));
            }
          }
          ctx.strokeStyle = 'rgba(233,237,247,0.2)';
          ctx.strokeRect(st.x, st.y, st.w, st.h);
          text(ctx, 'red stripes = jams, sloping backwards', st.x, st.y + st.h + 14, { size: 10, color: C.red, shadow: false });
        }
        if (!api.thumbnail) {
          const stopped = v.filter((q) => q < 1).length;
          tag(ctx, stopped ? `${stopped} cars stopped` : 'flowing', w - 16, 84, stopped ? C.red : C.teal, { align: 'right', size: 12 });
        }
      },
      stats() {
        const n = v.length, mean = (v.reduce((p, q) => p + q, 0) / Math.max(1, n)) * 3.6;
        const sd = Math.sqrt(v.reduce((p, q) => p + (q * 3.6 - mean) ** 2, 0) / Math.max(1, n));
        return [
          { label: 'Average speed', value: `${mean.toFixed(0)} km/h`, color: COL(mean / 3.6) },
          { label: 'Cars stopped now', value: String(v.filter((q) => q < 1).length), color: C.red },
          { label: 'Speed spread', value: `± ${sd.toFixed(0)} km/h` },
          { label: 'Gap between cars', value: `${(L / Math.max(1, n) - LEN).toFixed(1)} m` },
        ];
      },
      charts() {
        return [{ title: 'Average speed (km/h)', series: [{ data: sSpeed.data, color: C.teal }], min: 0, max: 50, length: 500 }];
      },
    };
  },
};
