import { C, TAU, backdrop, drawGlow, tag, Series, rand } from '../../core/util.js';

export default {
  id: 'radioactive-decay',
  title: 'Radioactive Decay & Half-Life',
  category: 'physics',
  tagline: 'No one can say when an atom will decay — yet half of them always go in the same time.',
  blurb:
    'An unstable atomic nucleus can spit out a particle at any moment, turning into a different element. Each individual decay is completely random. But with billions of atoms, the randomness averages out into a precise clock: the half-life. That clock dates ancient bones, powers spacecraft and shapes nuclear waste policy.',
  ideas: [
    'Each nucleus has the same <b>chance per second</b> of decaying, whatever its age.',
    'Which atom decays next is <b>unpredictable</b>; how many decay is not.',
    'In one <b>half-life</b>, half of the remaining nuclei decay — every time.',
    'Carbon-14’s half-life of 5,730 years lets archaeologists <b>date</b> once-living things.',
  ],
  hint: 'Click to refill with fresh atoms',
  thumbChapter: 1,
  thumbFrames: 260,
  params: [
    { key: 'half', label: 'Half-life', type: 'range', min: 1, max: 12, step: 0.5, value: 4, format: (v) => v.toFixed(1) + ' s' },
    { key: 'N', label: 'Atoms', type: 'range', min: 64, max: 2500, step: 1, value: 900, instant: true },
    { key: 'chain', label: 'Daughter is also radioactive', type: 'toggle', value: false },
    { key: 'units', label: 'Time shown as', type: 'select', value: 'sec', options: [{ value: 'sec', label: 'Seconds' }, { value: 'c14', label: 'Carbon-14 years' }] },
    { key: 'refill', label: 'Fresh sample', type: 'button', action: (s) => s.init() },
  ],
  story: [
    {
      title: 'Unstable nuclei',
      text: 'Each glowing dot is the nucleus of an unstable atom. At random moments one bursts, flinging out a particle, and becomes a different, stable element (grey). There is no way to predict which one will go next.',
      params: { half: 4, N: 400, chain: false, units: 'sec' },
      enter: (s) => s.init(),
      duration: 11,
    },
    {
      title: 'Half, then half again',
      text: 'Count them, though, and a pattern appears. After one half-life (here 4 s) half are left. After another, half of those — a quarter. Then an eighth. The curve is an <b>exponential decay</b>, and it never quite reaches zero.',
      formula: 'N(t) = N₀ · (½)^(t / T½)',
      params: { half: 4, N: 2500, chain: false, units: 'sec' },
      enter: (s) => s.init(),
      duration: 18,
    },
    {
      title: 'Randomness averages out',
      text: 'With only 64 atoms the count staggers and jumps around the smooth prediction. With trillions of atoms in a real sample, the half-life is as reliable as any clock.',
      params: { N: 64, half: 3 },
      enter: (s) => s.init(),
      duration: 13,
    },
    {
      title: 'Carbon dating',
      text: 'Living things keep topping up their carbon-14. When they die, the clock starts: every 5,730 years half of it is gone. Measure how much is left in a bone or a piece of wood and you know its age.',
      params: { units: 'c14', half: 4, N: 2500, chain: false },
      enter: (s) => s.init(),
      duration: 16,
    },
    {
      title: 'Decay chains',
      text: 'Often the new nucleus is itself unstable (cyan) and decays in turn. Its numbers first rise as it is produced, then fall. Uranium passes through 14 steps like this before ending as stable lead.',
      params: { chain: true, units: 'sec', N: 2500, half: 3 },
      enter: (s) => s.init(),
      duration: 18,
    },
    {
      title: 'Experiment',
      text: 'Change the half-life and sample size. Click the canvas for a fresh sample.',
      params: { chain: false, N: 900, half: 4 },
      enter: (s) => s.init(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let atoms = [], t = 0, bursts = [];
    const sP = new Series(400), sD = new Series(400), sRef = new Series(400);

    function init() {
      const n = Math.round(params.N);
      atoms = Array.from({ length: n }, () => ({ s: 0, j: rand(TAU) }));
      t = 0;
      bursts = [];
      sP.clear();
      sD.clear();
      sRef.clear();
    }
    init();

    const layout = () => {
      const { w, h } = api;
      const n = atoms.length;
      const top = 96, bottom = h > 640 ? h * 0.74 : h - 20;
      const left = w < 900 ? 20 : w * 0.3, right = w - 20;
      const W = right - left, H = bottom - top;
      const cols = Math.ceil(Math.sqrt((n * W) / H));
      const rows = Math.ceil(n / cols);
      const cell = Math.min(W / cols, H / rows);
      return { cols, cell, x0: left + (W - cols * cell) / 2, y0: top + (H - rows * cell) / 2 };
    };

    const counts = () => {
      let p = 0, d = 0;
      for (const a of atoms) a.s === 0 ? p++ : a.s === 1 && d++;
      return [p, d];
    };

    return {
      init,
      reset: init,
      onParam(k) {
        if (k === 'N') init();
      },
      pointerDown() {
        init();
      },
      update(dt) {
        t += dt;
        const lam = Math.LN2 / params.half;
        const p1 = 1 - Math.exp(-lam * dt);
        const p2 = 1 - Math.exp(-(Math.LN2 / (params.half * 0.6)) * dt);
        const L = layout();
        atoms.forEach((a, i) => {
          if (a.s === 0 && Math.random() < p1) {
            a.s = params.chain ? 1 : 2;
            const x = L.x0 + ((i % L.cols) + 0.5) * L.cell, y = L.y0 + (Math.floor(i / L.cols) + 0.5) * L.cell;
            if (bursts.length < 90) bursts.push({ x, y, a: rand(TAU), t: 0, col: '#ffb547' });
          } else if (a.s === 1 && Math.random() < p2) {
            a.s = 2;
            const x = L.x0 + ((i % L.cols) + 0.5) * L.cell, y = L.y0 + (Math.floor(i / L.cols) + 0.5) * L.cell;
            if (bursts.length < 90) bursts.push({ x, y, a: rand(TAU), t: 0, col: '#38d6f5' });
          }
        });
        for (const b of bursts) b.t += dt;
        bursts = bursts.filter((b) => b.t < 0.7);
        if (api.frame % 3 === 0) {
          const [p, d] = counts();
          sP.push(p);
          sD.push(d);
          sRef.push(atoms.length * Math.pow(0.5, t / params.half));
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0e0f22', grid: false });
        const L = layout();
        const r = Math.max(1.2, L.cell * 0.32);
        const cols = { 0: [], 1: [], 2: [] };
        atoms.forEach((a, i) => cols[a.s].push(i));
        // small cells: squares in one batched path are far cheaper than thousands of arcs
        const sq = L.cell < 10;
        const dot = (x, y, rr) => {
          if (sq) ctx.rect(x - rr, y - rr, rr * 2, rr * 2);
          else {
            ctx.moveTo(x + rr, y);
            ctx.arc(x, y, rr, 0, TAU);
          }
        };
        ctx.fillStyle = 'rgba(140,150,175,0.35)';
        ctx.beginPath();
        for (const i of cols[2]) dot(L.x0 + ((i % L.cols) + 0.5) * L.cell, L.y0 + (Math.floor(i / L.cols) + 0.5) * L.cell, r);
        ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        const few = atoms.length <= 700;
        for (const [s, col] of [[0, '#ffb547'], [1, '#38d6f5']]) {
          if (few) {
            for (const i of cols[s]) {
              const a = atoms[i];
              const x = L.x0 + ((i % L.cols) + 0.5) * L.cell, y = L.y0 + (Math.floor(i / L.cols) + 0.5) * L.cell;
              drawGlow(ctx, x + Math.sin(api.time * 9 + a.j) * L.cell * 0.04, y, r * 2.6, col, 0.35);
            }
          } else {
            // many atoms: one batched path per colour
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = col;
            ctx.beginPath();
            for (const i of cols[s]) dot(L.x0 + ((i % L.cols) + 0.5) * L.cell, L.y0 + (Math.floor(i / L.cols) + 0.5) * L.cell, r * 1.1);
            ctx.fill();
            ctx.globalCompositeOperation = 'lighter';
          }
        }
        for (const b of bursts) {
          const k = b.t / 0.7;
          ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(b.x, b.y, r + k * L.cell * 1.6, 0, TAU);
          ctx.stroke();
          drawGlow(ctx, b.x + Math.cos(b.a) * k * 120, b.y + Math.sin(b.a) * k * 120, 6, b.col, 0.5);
        }
        ctx.globalCompositeOperation = 'source-over';
        if (!api.thumbnail) {
          const [p, d] = counts();
          const yrs = params.units === 'c14';
          const tl = yrs ? `${Math.round((t / params.half) * 5730).toLocaleString()} years` : `${t.toFixed(1)} s`;
          tag(ctx, `t = ${tl}  ·  half-lives: ${(t / params.half).toFixed(2)}`, w - 16, 84, C.ink, { align: 'right', size: 11 });
          tag(ctx, `remaining ${p} / ${atoms.length} (${((p / atoms.length) * 100).toFixed(1)}%)`, w - 16, 110, C.amber, { align: 'right', size: 11 });
          if (params.chain) tag(ctx, `daughter ${d}`, w - 16, 136, C.cyan, { align: 'right', size: 11 });
        }
      },
      stats() {
        const [p, d] = counts();
        const yrs = params.units === 'c14';
        return [
          { label: 'Half-life', value: yrs ? '5,730 years' : params.half.toFixed(1) + ' s' },
          { label: 'Elapsed', value: yrs ? Math.round((t / params.half) * 5730).toLocaleString() + ' yr' : t.toFixed(1) + ' s' },
          { label: 'Original atoms left', value: ((p / atoms.length) * 100).toFixed(1) + ' %', color: C.amber },
          { label: 'Predicted', value: (Math.pow(0.5, t / params.half) * 100).toFixed(1) + ' %' },
          ...(params.chain ? [{ label: 'Daughter atoms', value: String(d), color: C.cyan }] : []),
        ];
      },
      charts() {
        const series = [{ data: sP.data, color: C.amber, label: 'parent' }];
        if (params.chain) series.push({ data: sD.data, color: C.cyan, label: 'daughter' });
        return [{ title: 'Atoms remaining (dashed: prediction)', series, ref: { data: sRef.data, color: 'rgba(255,255,255,0.6)' }, min: 0, max: atoms.length }];
      },
    };
  },
};
