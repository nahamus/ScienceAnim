import { C, Series, clamp, drawGlow, rand, randn, tag, TAU } from '../../core/util.js';

// Pulse-coupled oscillators (Mirollo & Strogatz 1990). Each firefly has an internal clock (phase 0 → 1) and flashes
// when it reaches 1. Seeing a neighbour flash pushes its clock forward a little, more so late in its cycle; a clock
// pushed past 1 flashes at once. With enough coupling, and rhythms that are similar enough, everyone ends up together.

const T0 = 1.0; // seconds between flashes for an average firefly
const GLOW = '#d8ff6a';

export default {
  id: 'fireflies',
  title: 'Fireflies in Sync',
  category: 'biology',
  tagline: 'Thousands of fireflies flash in unison with no leader. A little nudging is all it takes.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Synchronisation', 'Emergence', 'Rhythms'],
  keywords: ['synchronization', 'synchronisation', 'firefly', 'oscillator', 'Kuramoto', 'Mirollo-Strogatz', 'pacemaker', 'Millennium Bridge', 'emergence', 'coupled oscillators'],
  blurb:
    'In a few forests in Southeast Asia and the Smoky Mountains, thousands of fireflies flash in perfect unison. Nobody leads. Each one simply flashes a little sooner when it sees a neighbour flash, and order spreads by itself. The same maths keeps your heartbeat steady, made a London bridge wobble, and keeps power stations turning in step.',
  ideas: [
    'Each firefly is an <b>oscillator</b>: an internal clock that flashes once per cycle.',
    'Seeing a flash nudges a firefly’s clock forward; small nudges add up until groups lock together.',
    'Synchrony needs <b>enough coupling</b> compared with how different the natural rhythms are: below a threshold it never comes.',
    'With only nearby neighbours visible, <b>waves</b> of flashes sweep across the swarm.',
    'Pacemaker cells in the heart, crickets, applause and power grids all synchronise the same way.',
  ],
  hint: 'Click to flash a light and nudge the fireflies near it',
  thumbChapter: 1, // the twinkling meadow; a synchronised one is dark between pulses
  thumbFrames: 200,
  params: [
    { key: 'couple', label: 'How strongly a flash nudges others', type: 'range', min: 0, max: 0.4, step: 0.01, value: 0, format: (v) => (v === 0 ? 'not at all' : `${Math.round(v * 100)} %`) },
    { key: 'spread', label: 'How different their natural rhythms are', type: 'range', min: 0, max: 0.4, step: 0.01, value: 0.08, format: (v) => `± ${Math.round(v * 100)} %` },
    { key: 'sight', label: 'How far a firefly can see', type: 'range', min: 40, max: 1200, step: 10, value: 1200, format: (v) => (v >= 1200 ? 'the whole meadow' : `${Math.round(v)} px`) },
    { key: 'count', label: 'Fireflies', type: 'range', min: 20, max: 400, step: 10, value: 220, instant: true },
    { key: 'shuffle', label: 'Scramble their clocks', type: 'button', action: (s) => s.scramble() },
  ],
  story: [
    {
      title: 'A summer night',
      text: 'A meadow full of fireflies, each blinking about once a second. Every firefly keeps its own internal clock and pays no attention to the others, so the flashes twinkle at random.',
      params: { couple: 0, spread: 0.08, sight: 1200, count: 220 },
      enter: (s) => s.scramble(),
      duration: 12,
    },
    {
      title: 'A little nudge',
      text: 'Now each firefly does one simple thing: when it sees a flash, it brings its own next flash slightly forward. Pairs fall into step, then little groups, and the groups swallow each other until the whole meadow pulses as one. Watch the sync meter in the chart climb.',
      params: { couple: 0.12, spread: 0.08, sight: 1200 },
      duration: 18,
    },
    {
      title: 'Who is in charge?',
      text: 'Look for the firefly that is leading the others.',
      check: {
        q: 'Which firefly sets the rhythm that everyone follows?',
        options: ['None of them: the rhythm emerges from everyone nudging everyone', 'The first one to flash', 'The brightest one'],
        answer: 0,
        setup: { couple: 0.12, spread: 0.08, sight: 1200 },
        explain: 'Every firefly obeys the same local rule and no one sees the whole swarm. The shared beat is an emergent property: it exists only in the group, like a crowd’s rhythmic clapping.',
      },
      params: { couple: 0.12, spread: 0.08, sight: 1200 },
      enter: (s) => s.scramble(),
      duration: 16,
    },
    {
      title: 'A tipping point',
      text: 'Make the fireflies’ natural rhythms very different and the nudges weak. Now they never settle: small groups form and break apart. Turn the coupling up and, past a threshold, synchrony suddenly takes over. Yoshiki Kuramoto worked out this threshold mathematically in 1975.',
      check: {
        q: 'The fireflies’ rhythms differ a lot and each nudge is tiny. What happens?',
        options: ['They never fully synchronise', 'They synchronise, just more slowly', 'They all stop flashing'],
        answer: 0,
        setup: { couple: 0.02, spread: 0.3, sight: 1200 },
        explain: 'Each nudge has to make up for the fact that a fast firefly keeps drifting ahead of a slow one. If the nudges are too weak for the differences, the drift wins and no common beat forms, however long you wait.',
      },
      params: { couple: 0.02, spread: 0.3, sight: 1200 },
      enter: (s) => s.scramble(),
      duration: 16,
    },
    {
      title: 'Waves across the trees',
      text: 'In a dense forest each firefly only sees its near neighbours. Patches lock together locally, and the flashing rolls across the swarm in waves, as it does along the riverbanks of Malaysia and Thailand.',
      params: { couple: 0.22, spread: 0.04, sight: 90 },
      enter: (s) => s.scramble(),
      duration: 18,
    },
    {
      title: 'Your heart does this',
      text: 'Your heartbeat is set by about 10,000 pacemaker cells, each with its own electrical rhythm, that pull each other into step. In 2000 London’s Millennium Bridge began to sway on its opening day because walkers unconsciously fell into step with the wobble, making it worse. Power stations across a continent turn in lockstep at 50 or 60 times a second for the same reason.',
      params: { couple: 0.3, spread: 0.06, sight: 1200 },
      enter: (s) => s.scramble(),
      duration: 16,
    },
    {
      title: 'Your meadow',
      text: 'Change the coupling, the rhythms and how far fireflies can see. Click to flash your own light: can you pull the swarm onto your beat?',
      params: { couple: 0.12, spread: 0.1, sight: 1200 },
      enter: (s) => s.scramble(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let flies = [], pings = [], grass = [], trees = [];
    const sSync = new Series(500), sFlash = new Series(500);
    let recent = [];

    function mk() {
      const { w, h } = api;
      const T = T0 * Math.max(0.4, 1 + params.spread * randn() * 0.6);
      return { x: rand(20, w - 20), y: rand(110, h * 0.82), hx: 0, hy: 0, ph: Math.random(), T, glow: 0, dx: rand(TAU), sp: rand(4, 12) };
    }
    function scramble() {
      flies = [];
      for (let i = 0; i < Math.round(params.count); i++) flies.push(mk());
      for (const f of flies) (f.hx = f.x), (f.hy = f.y);
      sSync.clear();
      sFlash.clear();
    }
    function scenery() {
      const { w } = api;
      grass = Array.from({ length: Math.round(w / 6) }, (_, i) => ({ x: i * 6 + rand(-2, 2), hgt: rand(18, 60), lean: rand(-8, 8) }));
      trees = Array.from({ length: Math.max(3, Math.round(w / 260)) }, (_, i) => ({ x: (i + 0.5) * (w / Math.max(3, Math.round(w / 260))) + rand(-40, 40), s: rand(0.7, 1.2) }));
    }
    function flash(f) {
      f.ph = 0;
      f.glow = 1;
      recent.push(api.time);
      pulse(f.x, f.y, f);
    }
    /** Everyone who can see a flash at (x, y) moves their clock forward; anyone pushed past 1 flashes too. */
    function pulse(x, y, src, strength = params.couple) {
      if (strength <= 0) return;
      const R2 = params.sight * params.sight, chain = [];
      // the push from one flash is shared out: the more fireflies in view, the smaller each one's share
      const seen = Math.max(6, flies.length * Math.min(1, (Math.PI * R2) / Math.max(1, api.w * (api.h * 0.72))));
      strength *= 12 / seen;
      for (const g of flies) {
        if (g === src || g.ph < 0.08) continue; // a firefly that has just flashed ignores flashes for a moment
        if ((g.x - x) ** 2 + (g.y - y) ** 2 > R2) continue;
        g.ph += strength * g.ph; // nudged forward, more so late in its cycle
        if (g.ph >= 1) chain.push(g);
      }
      for (const g of chain) if (g.ph >= 1) flash(g);
    }
    // order parameter: 1 when every clock reads the same, near 0 when they are spread round the cycle
    function sync() {
      let cx = 0, cy = 0;
      for (const f of flies) (cx += Math.cos(f.ph * TAU)), (cy += Math.sin(f.ph * TAU));
      return flies.length ? Math.hypot(cx, cy) / flies.length : 0;
    }

    return {
      scramble,
      reset: scramble,
      resize() {
        scenery();
        if (!flies.length) scramble();
      },
      onParam(k) {
        if (k === 'count') {
          while (flies.length < params.count) flies.push(mk());
          if (flies.length > params.count) flies.length = Math.round(params.count);
        }
        if (k === 'spread') for (const f of flies) f.T = T0 * Math.max(0.4, 1 + params.spread * randn() * 0.6);
      },
      pointerDown(p) {
        pings.push({ x: p.x, y: p.y, t: 0 });
        pulse(p.x, p.y, null, Math.max(0.25, params.couple * 2));
      },
      update(dt) {
        dt = Math.min(dt, 0.05);
        for (const f of flies) {
          f.ph += dt / f.T;
          f.glow = Math.max(0, f.glow - dt * 3.2);
          f.dx += rand(-1, 1) * dt;
          f.x = f.hx + Math.cos(f.dx) * f.sp * Math.sin(api.time * 0.3 + f.sp);
          f.y = f.hy + Math.sin(f.dx * 1.3) * f.sp * 0.6;
        }
        for (const f of flies) if (f.ph >= 1) flash(f);
        for (const p of pings) p.t += dt;
        pings = pings.filter((p) => p.t < 0.8);
        recent = recent.filter((t) => api.time - t < 0.1);
        if (api.frame % 2 === 0) {
          sSync.push(sync());
          sFlash.push(recent.length / Math.max(1, flies.length));
        }
      },
      draw() {
        const { w, h } = api;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#02030a');
        g.addColorStop(0.7, '#061120');
        g.addColorStop(1, '#03080c');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // the meadow glows faintly when many flash together
        const together = recent.length / Math.max(1, flies.length);
        if (together > 0.2) {
          ctx.fillStyle = `rgba(150,220,80,${Math.min(0.12, together * 0.15)})`;
          ctx.fillRect(0, 0, w, h);
        }
        // tree silhouettes
        ctx.fillStyle = '#010205';
        for (const t of trees) {
          const base = h * 0.9, ht = h * 0.5 * t.s;
          ctx.fillRect(t.x - 5 * t.s, base - ht * 0.4, 10 * t.s, ht * 0.4);
          ctx.beginPath();
          ctx.ellipse(t.x, base - ht * 0.62, 70 * t.s, ht * 0.38, 0, 0, TAU);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const f of flies) {
          if (f.glow > 0.02) drawGlow(ctx, f.x, f.y, 6 + f.glow * 22, GLOW, 0.5 * f.glow);
          else {
            ctx.fillStyle = 'rgba(170,200,100,0.45)';
            ctx.fillRect(f.x - 1.25, f.y - 1.25, 2.5, 2.5);
          }
        }
        for (const p of pings) drawGlow(ctx, p.x, p.y, 20 + p.t * 120, '#ffe08a', 0.5 * (1 - p.t / 0.8));
        ctx.globalCompositeOperation = 'source-over';
        // grass
        ctx.strokeStyle = '#030807';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (const s of grass) {
          ctx.moveTo(s.x, h);
          ctx.quadraticCurveTo(s.x, h - s.hgt * 0.6, s.x + s.lean, h - s.hgt);
        }
        ctx.stroke();
        if (api.thumbnail) return;
        const r = sync();
        tag(ctx, `in sync: ${Math.round(r * 100)} %`, w - 16, 84, r > 0.8 ? C.lime : r > 0.4 ? C.amber : C.dim, { align: 'right', size: 12 });
        if (params.sight < 1200 && w >= 760) {
          const f = flies[0];
          if (f) {
            ctx.strokeStyle = 'rgba(216,255,106,0.25)';
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.arc(f.x, f.y, params.sight, 0, TAU);
            ctx.stroke();
            ctx.setLineDash([]);
            tag(ctx, 'what one firefly can see', f.x, f.y - params.sight - 12, GLOW, { align: 'center', size: 10 });
          }
        }
      },
      stats() {
        const r = sync();
        const bins = new Array(20).fill(0);
        for (const f of flies) bins[Math.min(19, Math.floor(clamp(f.ph, 0, 0.999) * 20))]++;
        const biggest = Math.max(...bins.map((b, i) => b + bins[(i + 1) % 20]));
        return [
          { label: 'In sync', value: `${Math.round(r * 100)} %`, color: r > 0.8 ? C.lime : C.amber },
          { label: 'Largest group flashing together', value: `${Math.round((biggest / Math.max(1, flies.length)) * 100)} %` },
          { label: 'Fireflies', value: String(flies.length) },
          { label: 'Nudge per flash', value: params.couple ? `${Math.round(params.couple * 100)} %` : 'none' },
        ];
      },
      charts() {
        return [
          { title: 'Sync meter (1 = all together)', series: [{ data: sSync.data, color: C.lime }], min: 0, max: 1, length: 500 },
          { title: 'Share flashing right now', series: [{ data: sFlash.data, color: GLOW }], min: 0, max: 1, length: 500 },
        ];
      },
    };
  },
};
