import { C, TAU, clamp, rgba, text, tag, backdrop, Series } from '../../core/util.js';

// The 2D Ising model: a square grid of spins (±1), each preferring to match its four neighbours,
// at temperature T (units where J = k = 1). Metropolis Monte Carlo on a checkerboard: flipping a
// spin that costs energy ΔE happens with probability e^(−ΔE/T). Onsager's exact result (1944):
// the transition is at Tc = 2/ln(1+√2) ≈ 2.269, with |M| = (1 − sinh⁻⁴(2/T))^(1/8) below it.

const TC = 2 / Math.log(1 + Math.SQRT2);
const onsager = (T) => (T >= TC ? 0 : Math.pow(1 - Math.pow(Math.sinh(2 / T), -4), 1 / 8));
const UP = [255, 181, 71], DOWN = [24, 40, 110];

export default {
  id: 'ising',
  title: 'The Ising Model: Magnets and Phase Transitions',
  category: 'physics',
  tagline: 'Tiny magnets that copy their neighbours. Cool them through 2.27 and order appears out of nowhere.',
  ages: ['16+'],
  topics: ['Complex systems', 'Magnetism', 'Thermodynamics'],
  keywords: ['ising', 'phase transition', 'critical point', 'ferromagnet', 'curie temperature', 'monte carlo', 'metropolis', 'onsager', 'spin', 'universality', 'emergence'],
  blurb:
    'A grid of atomic magnets, each pointing up or down and each wanting to match its neighbours, while heat jostles them randomly. Hot: chaos. Cold: everything lines up into a magnet. In between lies a sharp tipping point, the critical temperature, where patches of every size appear at once. This simple model explains how iron loses its magnetism and is a template for transitions across physics and beyond.',
  ideas: [
    'Each spin prefers to <b>match its neighbours</b>; temperature makes it flip at random.',
    'Below the <b>critical temperature</b> Tc ≈ 2.27 the spins line up: a <b>spontaneous magnet</b>.',
    'Above Tc the order melts and the net magnetisation is <b>zero</b>, like iron above its Curie point (770 °C).',
    'At Tc there are clusters of <b>every size</b>: the pattern looks the same at every zoom (scale invariance).',
    'Very different systems (magnets, boiling liquids, alloys) share the same critical behaviour: <b>universality</b>.',
  ],
  hint: 'Drag across the grid to paint spins',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 90,
  params: [
    { key: 'T', label: 'Temperature T', type: 'range', min: 0.5, max: 5, step: 0.01, value: 2.27 },
    { key: 'h', label: 'Outside magnetic field', type: 'range', min: -1, max: 1, step: 0.01, value: 0 },
    { key: 'size', label: 'Grid', type: 'select', value: '128', instant: true, options: [
      { value: '64', label: '64²' }, { value: '128', label: '128²' }, { value: '256', label: '256²' },
    ] },
    { key: 'speed', label: 'Sweeps per frame', type: 'range', min: 1, max: 20, step: 1, value: 4 },
    { key: 'random', label: 'Randomise (hot start)', type: 'button', action: (sim) => sim.fill('random') },
    { key: 'cold', label: 'All up (cold start)', type: 'button', action: (sim) => sim.fill('up') },
  ],
  story: [
    {
      title: 'A grid of tiny magnets',
      text: 'Each square is an atom’s magnetic <b>spin</b>, pointing up (gold) or down (blue). Neighbours prefer to point the same way; heat makes them flip at random. Hot (T = 4), heat wins: a speckled mess with no overall direction.',
      params: { T: 4, h: 0, speed: 4 },
      enter: (s) => (s.fill('random'), s.clearCurve()),
      duration: 12,
    },
    {
      title: 'Cool it down',
      text: 'At T = 1.5 neighbours win. Patches of matching spins form and grow as the boundaries between them shrink, like bubbles in foam merging. Given time, one direction takes over: the grid has become a <b>magnet</b>, though no single spin decided which way.',
      params: { T: 1.5, h: 0, speed: 6 },
      enter: (s) => s.fill('random'),
      duration: 15,
    },
    {
      title: 'The critical point',
      text: 'Near <b>Tc ≈ 2.27</b> order and disorder are perfectly balanced. Clusters of <em>every size</em> appear, from single squares to islands spanning the grid, with islands inside islands. Zoom in or out and it looks the same. Changes here are slow and huge: <b>critical fluctuations</b>.',
      formula: 'Tc = 2 / ln(1 + √2) ≈ 2.269',
      params: { T: 2.3, h: 0, speed: 8 },
      enter: (s) => s.fill('random'),
      duration: 16,
    },
    {
      title: 'A sharp transition',
      text: 'Now the temperature falls slowly from 3.5 to 1.2 while the graph records the <b>magnetisation</b> |M|, the share of spins pointing the majority way minus the rest. Nothing happens until Tc, then it shoots up. The line is <b>Onsager’s exact solution</b> (1944), one of the great feats of theoretical physics.',
      check: {
        q: 'As the grid cools from hot, when does a net magnetisation first appear?',
        options: ['Gradually, from the start', 'Suddenly, at one temperature', 'Only at absolute zero'],
        answer: 1,
        setup: { T: 3.5, h: 0 },
        explain: 'In an infinitely large grid |M| is exactly zero for every T above Tc and rises steeply just below it. A finite grid rounds the corner slightly, but the jump is unmistakable: a phase transition.',
      },
      params: { T: 1.2, h: 0, speed: 10 },
      tween: 28,
      enter: (s) => (s.fill('random'), s.setT(3.5, 1.2, 28), s.clearCurve()),
      duration: 32,
    },
    {
      title: 'Tipping the balance',
      text: 'An outside <b>magnetic field</b> favours one direction. In the cold, ordered phase even a weak field makes the whole grid flip to follow it, but only after a patch of the new direction forms and spreads, just as real magnets can be re-magnetised.',
      params: { T: 1.8, h: -0.15, speed: 8 },
      enter: (s) => s.fill('up'),
      duration: 15,
    },
    {
      title: 'Far beyond magnets',
      text: 'The same mathematics and the same critical exponents describe a liquid at its critical point, alloys sorting their atoms, and models of opinions and flocks. Ising-style networks also gave rise to <b>Hopfield networks</b> (Nobel Prize in Physics 2024) and to the <b>quantum annealers</b> that solve problems by cooling spins into their lowest energy.',
      params: { T: 2.3, h: 0, speed: 8 },
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Change the temperature and the field, paint spins by dragging, or try a bigger grid at Tc.',
      params: { T: 2.27, h: 0, speed: 6 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let L = 0, s, img, off, octx, data;
    let curve = new Map(), mHist = new Series(300), eHist = new Series(300), tick = 0, layout = null;
    const acc = new Float64Array(2); // for the T sweep: Σ|m| and count in the current bin
    let bin = null;

    function alloc() {
      L = +params.size;
      s = new Int8Array(L * L);
      off = document.createElement('canvas');
      off.width = off.height = L;
      octx = off.getContext('2d');
      img = octx.createImageData(L, L);
      data = img.data;
      for (let i = 0; i < L * L; i++) data[i * 4 + 3] = 255;
    }

    function fill(kind) {
      if (+params.size !== L) alloc();
      for (let i = 0; i < L * L; i++) s[i] = kind === 'up' ? 1 : Math.random() < 0.5 ? 1 : -1;
      mHist.clear();
      eHist.clear();
    }

    /** One Metropolis sweep, checkerboard order (each colour updates using the other's spins). */
    // acceptance probability exp(−ΔE/T) for each (spin, neighbour sum) pair, rebuilt per sweep
    const accept = new Float64Array(18);
    let seed = (Math.random() * 2 ** 32) >>> 0 || 1;
    function sweep() {
      const T = params.T, h = params.h;
      // ΔE for flipping spin σ with neighbour sum n: 2σ(n + h); n ∈ {−4,…,4}
      for (let n = -4; n <= 4; n++)
        for (const sg of [-1, 1]) {
          const dE = 2 * sg * (n + h);
          accept[(n + 4) * 2 + (sg > 0 ? 1 : 0)] = dE <= 0 ? 2 : Math.exp(-dE / T);
        }
      let r = seed;
      for (let colour = 0; colour < 2; colour++)
        for (let y = 0; y < L; y++) {
          const up = ((y + L - 1) % L) * L, dn = ((y + 1) % L) * L, row = y * L;
          for (let x = (y + colour) & 1; x < L; x += 2) {
            const i = row + x;
            const right = x === L - 1 ? row : i + 1, left = x === 0 ? row + L - 1 : i - 1;
            const n = s[up + x] + s[dn + x] + s[right] + s[left];
            const p = accept[(n + 4) * 2 + (s[i] > 0 ? 1 : 0)];
            if (p >= 1) s[i] = -s[i];
            else {
              // xorshift32: a fast random number in [0, 1)
              r ^= r << 13;
              r ^= r >>> 17;
              r ^= r << 5;
              if ((r >>> 0) / 4294967296 < p) s[i] = -s[i];
            }
          }
        }
      seed = r;
    }

    function measure() {
      let m = 0, e = 0;
      for (let y = 0; y < L; y++)
        for (let x = 0; x < L; x++) {
          const i = y * L + x;
          m += s[i];
          e -= s[i] * (s[y * L + ((x + 1) % L)] + s[((y + 1) % L) * L + x]) + params.h * s[i];
        }
      return { m: m / (L * L), e: e / (L * L) };
    }

    const sim = {
      fill,
      clearCurve() {
        curve = new Map();
        bin = null;
      },
      /** Cool (or heat) steadily from one temperature to another over `dur` seconds. */
      setT(from, to, dur) {
        api.runner.set('T', from);
        api.runner.set('T', to, dur);
      },
      onParam(k) {
        if (k === 'size') fill('random');
      },
      pointerDown(p) {
        sim.paint(p, true);
      },
      pointerMove(p) {
        if (p.down) sim.paint(p, false);
      },
      paint(p, first) {
        if (!layout) return;
        const { x0, y0, size } = layout;
        const gx = Math.floor(((p.x - x0) / size) * L), gy = Math.floor(((p.y - y0) / size) * L);
        if (gx < 0 || gy < 0 || gx >= L || gy >= L) return;
        if (first) sim.brush = -s[gy * L + gx];
        const r = Math.max(1, Math.round(L / 40));
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r) continue;
            s[((gy + dy + L) % L) * L + ((gx + dx + L) % L)] = sim.brush;
          }
      },
      brush: 1,
      update() {
        for (let k = 0; k < params.speed; k++) sweep();
        if (++tick % 3) return;
        const { m, e } = measure();
        mHist.push(m);
        eHist.push(e);
        // the magnetisation curve: average |m| in temperature bins of 0.05
        const b = Math.round(params.T / 0.05) * 0.05;
        if (bin !== b) {
          if (bin !== null && acc[1] > 2) curve.set(+bin.toFixed(2), acc[0] / acc[1]);
          bin = b;
          acc[0] = acc[1] = 0;
        }
        acc[0] += Math.abs(m);
        acc[1]++;
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        if (+params.size !== L) fill('random');
        for (let i = 0; i < L * L; i++) {
          const c = s[i] > 0 ? UP : DOWN;
          data[i * 4] = c[0];
          data[i * 4 + 1] = c[1];
          data[i * 4 + 2] = c[2];
        }
        octx.putImageData(img, 0, 0);
        const narrow = w < 700;
        let size, x0, y0;
        if (api.thumbnail) (size = Math.max(w, h)), (x0 = (w - size) / 2), (y0 = (h - size) / 2);
        else if (narrow) (size = Math.min(w - 24, h * 0.5)), (x0 = (w - size) / 2), (y0 = 64);
        else (size = Math.min(h - 120, w * 0.5)), (x0 = w - size - 36), (y0 = Math.max(70, (h - size) / 2));
        layout = { x0, y0, size };
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, x0, y0, size, size);
        ctx.imageSmoothingEnabled = true;
        if (api.thumbnail) return;
        ctx.strokeStyle = 'rgba(200,210,240,0.25)';
        ctx.strokeRect(x0 - 0.5, y0 - 0.5, size + 1, size + 1);
        const rel = params.T / TC;
        tag(ctx, `T = ${params.T.toFixed(2)}  (${rel < 0.98 ? 'ordered' : rel > 1.02 ? 'disordered' : 'critical'})`, x0 + size / 2, y0 + size + 16, rel < 0.98 ? C.amber : rel > 1.02 ? C.cyan : C.pink, { align: 'center' });

        // the magnetisation-temperature graph
        const box = narrow
          ? { x: 46, y: y0 + size + 52, w: w - 70, h: Math.min(150, h - (y0 + size + 52) - 30) }
          : { x: 64, y: 92, w: Math.max(160, x0 - 120), h: Math.min(200, h * 0.32) };
        if (box.h < 70) return;
        const X = (T) => box.x + ((T - 0.5) / 4.5) * box.w, Y = (m) => box.y + box.h - m * box.h;
        ctx.strokeStyle = 'rgba(160,175,230,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        text(ctx, 'magnetisation |M| vs temperature', box.x, box.y - 12, { size: 11, color: C.dim });
        for (const T of [1, 2, 3, 4, 5]) text(ctx, String(T), X(T), box.y + box.h + 11, { size: 10, align: 'center', color: C.dim });
        text(ctx, '1', box.x - 6, Y(1), { size: 10, align: 'right', color: C.dim });
        text(ctx, '0', box.x - 6, Y(0), { size: 10, align: 'right', color: C.dim });
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = rgba(C.pink, 0.6);
        ctx.beginPath();
        ctx.moveTo(X(TC), box.y);
        ctx.lineTo(X(TC), box.y + box.h);
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, 'Tc', X(TC) + 4, box.y + 10, { size: 10, color: C.pink });
        ctx.strokeStyle = rgba(C.ink, 0.7);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const T = 0.5 + (i / 120) * 4.5;
          ctx[i ? 'lineTo' : 'moveTo'](X(T), Y(onsager(T)));
        }
        ctx.stroke();
        ctx.fillStyle = C.amber;
        for (const [T, m] of curve) {
          ctx.beginPath();
          ctx.arc(X(T), Y(m), 3, 0, TAU);
          ctx.fill();
        }
        const cur = Math.abs(mHist.last ?? 0);
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(X(clamp(params.T, 0.5, 5)), Y(cur), 6, 0, TAU);
        ctx.stroke();
        if (!narrow) text(ctx, 'line: Onsager’s exact result · dots: this grid', box.x, box.y + box.h + 26, { size: 10, color: C.dim });
      },
      stats() {
        const m = mHist.last ?? 0;
        return [
          { label: 'Temperature / Tc', value: (params.T / TC).toFixed(2), color: C.pink },
          { label: 'Magnetisation M', value: m.toFixed(3), color: C.amber },
          { label: 'Exact |M| (infinite grid)', value: onsager(params.T).toFixed(3) },
          { label: 'Energy per spin', value: (eHist.last ?? 0).toFixed(3) },
          { label: 'Spins', value: `${L} × ${L} = ${(L * L).toLocaleString()}` },
        ];
      },
      charts() {
        return [
          { title: 'Magnetisation M over time', series: [{ data: mHist.data, color: C.amber }], min: -1, max: 1, length: 300 },
          { title: 'Energy per spin', series: [{ data: eHist.data, color: C.cyan }], min: -2.2, max: 0.2, length: 300 },
        ];
      },
    };
    fill('random');
    return sim;
  },
};
