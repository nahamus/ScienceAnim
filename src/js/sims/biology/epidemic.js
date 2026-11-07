import { SpatialHash, Series, backdrop, drawGlow, rand, TAU } from '../../core/util.js';

const COL = { S: '#7f8db8', I: '#ff4d6d', R: '#2ee6a6', V: '#38d6f5' };

export default {
  id: 'epidemic',
  title: 'How Epidemics Spread',
  category: 'biology',
  tagline: 'One infection becomes thousands. See how distancing and vaccines bend the curve.',
  blurb:
    'Each dot is a person. Infected people pass the disease to others they come close to, then recover with immunity. From these simple rules come exponential outbreaks, peaks, herd immunity — and the reason flattening the curve and vaccination work.',
  ideas: [
    'Early on, cases grow <b>exponentially</b>: each infection causes R₀ more.',
    'Outbreaks peak when so many people are immune that each case infects fewer than one other.',
    '<b>Distancing</b> lowers and delays the peak, keeping hospitals under capacity.',
    'Vaccinating enough people gives <b>herd immunity</b>: the disease cannot find enough hosts.',
  ],
  hint: 'Click a person to infect them',
  thumbChapter: 2,
  thumbFrames: 400,
  params: [
    { key: 'N', label: 'Population', type: 'range', min: 100, max: 900, step: 10, value: 500, instant: true },
    { key: 'distancing', label: 'Social distancing', type: 'range', min: 0, max: 0.9, step: 0.01, value: 0, format: (v) => (v * 100).toFixed(0) + ' % stay home' },
    { key: 'vax', label: 'Vaccinated at start', type: 'range', min: 0, max: 0.9, step: 0.01, value: 0, format: (v) => (v * 100).toFixed(0) + ' %', instant: true },
    { key: 'infect', label: 'Transmission chance', type: 'range', min: 0.1, max: 1, step: 0.01, value: 0.5, format: (v) => (v * 100).toFixed(0) + ' %' },
    { key: 'dur', label: 'Days infectious', type: 'range', min: 3, max: 20, step: 1, value: 9 },
    { key: 'restart', label: 'Restart outbreak', type: 'button', action: (s) => s.init() },
  ],
  story: [
    {
      title: 'Patient zero',
      text: 'A town of 500 people going about their lives. One of them — the red dot — has just caught a new disease. Anyone who comes close might catch it.',
      params: { distancing: 0, vax: 0, infect: 0.5, dur: 9 },
      enter: (s) => s.init(),
      duration: 9,
    },
    {
      title: 'Exponential growth',
      text: 'One infects two, two infect four… Watch the red curve in the chart: at first it doubles again and again. This is why early action matters so much.',
      formula: 'dI/dt = β S I − γ I',
      duration: 13,
    },
    {
      title: 'Peak and burnout',
      text: 'Eventually so many people have recovered (green) and become immune that the virus struggles to find new hosts. Cases peak and decline. But look how high the peak went — far above the dashed <b>hospital capacity</b> line.',
      duration: 14,
    },
    {
      title: 'Flatten the curve',
      text: 'Same disease, but 75% of people stay home. Infections still happen, but slowly. The peak is <b>lower and later</b> — and stays under hospital capacity.',
      params: { distancing: 0.75, vax: 0 },
      enter: (s) => s.init(),
      duration: 16,
    },
    {
      title: 'Herd immunity by vaccine',
      text: 'Now 70% are vaccinated (light blue) before the outbreak. The infection runs into immune people at every turn and <b>fizzles out</b>, protecting even those who aren’t vaccinated.',
      params: { distancing: 0, vax: 0.7 },
      enter: (s) => s.init(),
      duration: 15,
    },
    {
      title: 'Run your own outbreak',
      text: 'Adjust transmission, distancing and vaccination, then restart. Click anyone to infect them.',
      params: { vax: 0.3, distancing: 0.3 },
      enter: (s) => s.init(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const DAY = 0.5; // seconds per day
    const RAD = 11;
    let people = [], sS = new Series(500), sI = new Series(500), sR = new Series(500), sparks = [], day = 0, peak = 0;
    const hash = new SpatialHash(RAD * 2);

    function init() {
      const { w, h } = api;
      people = [];
      const n = Math.round(params.N);
      for (let i = 0; i < n; i++) {
        const a = rand(TAU), s = rand(25, 45);
        people.push({ x: rand(10, w - 10), y: rand(10, h - 10), vx: Math.cos(a) * s, vy: Math.sin(a) * s, st: Math.random() < params.vax ? 'V' : 'S', t: 0, home: Math.random(), pulse: 0 });
      }
      const z = people.find((p) => p.st === 'S') || people[0];
      z.st = 'I';
      z.t = 0;
      sS.clear();
      sI.clear();
      sR.clear();
      day = 0;
      peak = 0;
    }
    const count = (st) => people.reduce((a, p) => a + (p.st === st), 0);

    return {
      init,
      resize() {
        if (!people.length) init();
        else for (const p of people) (p.x = Math.min(p.x, api.w - 5)), (p.y = Math.min(p.y, api.h - 5));
      },
      reset: init,
      onParam(k) {
        if (k === 'N' || k === 'vax') init();
      },
      pointerDown(pt) {
        let best = null, bd = 900;
        for (const p of people) {
          const d = (p.x - pt.x) ** 2 + (p.y - pt.y) ** 2;
          if (d < bd && p.st === 'S') (bd = d), (best = p);
        }
        if (best) {
          best.st = 'I';
          best.t = 0;
          best.pulse = 1;
        }
      },
      update(dt) {
        const { w, h } = api;
        day += dt / DAY;
        hash.clear();
        for (const p of people) {
          const still = p.home < params.distancing;
          if (!still) {
            p.vx += rand(-1, 1) * 60 * dt;
            p.vy += rand(-1, 1) * 60 * dt;
            const s = Math.hypot(p.vx, p.vy) || 1;
            p.vx = (p.vx / s) * 38;
            p.vy = (p.vy / s) * 38;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
          }
          if (p.x < 6 || p.x > w - 6) (p.vx *= -1), (p.x = Math.max(6, Math.min(w - 6, p.x)));
          if (p.y < 6 || p.y > h - 6) (p.vy *= -1), (p.y = Math.max(6, Math.min(h - 6, p.y)));
          p.pulse = Math.max(0, p.pulse - dt * 1.5);
          if (p.st === 'I') {
            p.t += dt / DAY;
            if (p.t > params.dur) p.st = 'R';
          }
          hash.insert(p);
        }
        const near = [];
        const pr = 1 - Math.pow(1 - params.infect, dt * 3);
        for (const p of people) {
          if (p.st !== 'I') continue;
          hash.query(p.x, p.y, RAD, near);
          for (const q of near) {
            if (q.st !== 'S') continue;
            if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 > RAD * RAD) continue;
            if (Math.random() < pr) {
              q.st = 'I';
              q.t = 0;
              q.pulse = 1;
              sparks.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, t: 0 });
            }
          }
        }
        for (const s of sparks) s.t += dt;
        sparks = sparks.filter((s) => s.t < 0.5);
        if (api.frame % 3 === 0) {
          const i = count('I');
          peak = Math.max(peak, i);
          sS.push(count('S'));
          sI.push(i);
          sR.push(count('R') + count('V'));
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0b0f22' });
        ctx.globalCompositeOperation = 'lighter';
        for (const p of people) {
          if (p.st === 'I') {
            ctx.strokeStyle = 'rgba(255,77,109,0.18)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, RAD, 0, TAU);
            ctx.stroke();
            drawGlow(ctx, p.x, p.y, 16 + p.pulse * 30, '#ff4d6d', 0.25);
          }
        }
        for (const s of sparks) {
          ctx.strokeStyle = `rgba(255,140,160,${1 - s.t / 0.5})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        for (const p of people) {
          ctx.fillStyle = COL[p.st];
          ctx.globalAlpha = p.st === 'R' ? 0.75 : 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.st === 'I' ? 4 : 3.4, 0, TAU);
          ctx.fill();
          if (p.home < params.distancing && p.st !== 'I') {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, TAU);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      },
      stats() {
        const n = people.length || 1;
        return [
          { label: 'Day', value: day.toFixed(0) },
          { label: 'Infected now', value: String(count('I')), color: COL.I },
          { label: 'Peak infected', value: `${peak} (${((peak / n) * 100).toFixed(0)}%)` },
          { label: 'Ever infected', value: `${(((count('I') + count('R')) / n) * 100).toFixed(0)} %` },
        ];
      },
      charts() {
        const cap = Math.round(people.length * 0.15);
        return [
          {
            title: 'Susceptible · Infected · Recovered',
            series: [
              { data: sS.data, color: COL.S, label: 'S', fill: false },
              { data: sI.data, color: COL.I, label: 'I' },
              { data: sR.data, color: COL.R, label: 'R/V', fill: false },
            ],
            ref: { data: new Array(Math.max(2, sI.data.length)).fill(cap), color: '#ffb547' },
            min: 0,
            max: people.length,
            length: 500,
          },
        ];
      },
    };
  },
};
