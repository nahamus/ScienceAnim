import { C, backdrop, clamp, randn, rand, tag, TAU } from '../../core/util.js';

// Amphiphiles in water (implicit solvent), moved by Langevin dynamics. Each molecule is a water-loving head bead
// plus oily tail beads: soap has one tail, a membrane lipid has two. Tails (and oil) attract each other; heads are
// bulky and repel tails. Nothing tells them where to go: hiding the oily parts from water assembles everything.

const HEAD = '#4cc3ff', TAIL = '#ffb547', OIL = '#d9a441';
const DT = 0.01, G = 2;

export default {
  id: 'self-assembly',
  title: 'Soap, Bubbles & Membranes',
  category: 'chemistry',
  tagline: 'Two-faced molecules build balls, coats and walls by themselves: how soap cleans and how cells hold together.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Molecules', 'Cells', 'Self-assembly'],
  keywords: ['soap', 'detergent', 'micelle', 'surfactant', 'hydrophobic', 'emulsion', 'lipid', 'phospholipid', 'bilayer', 'membrane', 'vesicle', 'handwashing'],
  blurb:
    'A soap molecule has a head that loves water and a tail that hates it. Drop them in water and they huddle into tiny balls with their tails hidden inside, all by themselves. The same trick lets soap wrap up grease so it washes away, and with two tails instead of one, it builds the thin double wall around every living cell.',
  ideas: [
    'Soap and lipid molecules are <b>amphiphilic</b>: a water-loving (hydrophilic) head and a water-hating (hydrophobic) tail.',
    'In water they <b>self-assemble</b>: nothing directs them; hiding the tails from water is enough.',
    'One-tailed soap forms <b>micelles</b>, balls with the tails inside and heads facing out.',
    'Soap coats oil droplets so they can’t merge and stick: that is how washing works.',
    'Two-tailed lipids form a <b>bilayer</b>, the membrane around every cell, which seals itself if punctured.',
  ],
  hint: 'Drag to stir the water',
  thumbChapter: 2,
  thumbFrames: 400,
  params: [
    { key: 'kind', label: 'Molecule', type: 'select', value: 'soap', options: [{ value: 'soap', label: 'Soap (one tail)' }, { value: 'lipid', label: 'Membrane lipid (two tails)' }] },
    { key: 'count', label: 'Molecules', type: 'range', min: 0, max: 140, step: 1, value: 90, instant: true },
    { key: 'oil', label: 'Oil droplets', type: 'range', min: 0, max: 4, step: 1, value: 0, instant: true },
    { key: 'temp', label: 'Temperature', type: 'range', min: 0.1, max: 1, step: 0.05, value: 0.3, format: (v) => (v < 0.25 ? 'cool' : v < 0.5 ? 'warm' : v < 0.75 ? 'hot' : 'very hot') },
    // builds the membrane bubble (also for the quick check, which shows the scene before its chapter starts)
    { key: 'bubble', type: 'toggle', value: false, hidden: true },
    { key: 'shuffle', label: 'Scatter them', type: 'button', action: (s) => s.scatter() },
    { key: 'bubble', label: 'Make a membrane bubble', type: 'button', action: (s) => s.vesicle() },
    { key: 'poke', label: 'Poke a hole', type: 'button', action: (s) => s.poke() },
  ],
  story: [
    {
      title: 'Two-faced molecules',
      text: 'A soap molecule has a <b>head</b> (blue) that loves water and a long oily <b>tail</b> (orange) that hates it. Here a handful of them have just been stirred into water, scattered at random.',
      params: { kind: 'soap', count: 90, oil: 0, temp: 0.3, bubble: false },
      enter: (s) => s.scatter(),
      duration: 12,
    },
    {
      title: 'Hiding the tails',
      text: 'Watch: the tails find each other and the molecules gather into little balls called <b>micelles</b>, heads outward, tails tucked inside. Nobody arranges them. Water molecules would rather cling to each other than to oil, so the oily tails get squeezed together: the hydrophobic effect.',
      params: { kind: 'soap', count: 110, oil: 0, temp: 0.3 },
      duration: 16,
    },
    {
      title: 'Inside out?',
      text: 'Look at the edge of each little cluster.',
      check: {
        q: 'In a micelle floating in water, which part of each soap molecule faces outwards, into the water?',
        options: ['The water-loving head', 'The oily tail', 'It is random'],
        answer: 0,
        setup: { kind: 'soap', count: 110, oil: 0, temp: 0.3 },
        explain: 'Heads face the water and tails hide in the middle. Turn it around in oil (as in some cosmetics) and you get reverse micelles, with the heads inside.',
      },
      params: { kind: 'soap', count: 110, oil: 0, temp: 0.3 },
      duration: 13,
    },
    {
      title: 'Grease',
      text: 'Now some oil (gold) without any soap. Oil hates water too, so its droplets stick to each other and merge into bigger blobs. That’s why water alone can’t wash greasy hands or plates: the grease just clumps.',
      params: { kind: 'soap', count: 0, oil: 4, temp: 0.3, bubble: false },
      enter: (s) => s.scatter(),
      duration: 14,
    },
    {
      title: 'Soap to the rescue',
      text: 'Add soap. Tails dig into the oil, heads stay in the water, and every droplet ends up wrapped in a coat of heads. Coated droplets can’t merge, so they stay small and get rinsed away. Soap also tears apart the fatty coat of many viruses, including the one that causes COVID-19, which is why washing your hands works so well.',
      params: { kind: 'soap', count: 120, oil: 4, temp: 0.3 },
      enter: (s) => s.scatter(),
      duration: 18,
    },
    {
      title: 'Two tails build a wall',
      text: 'Cell membranes are made of lipids with <b>two</b> tails. Too fat to fit into a small ball, they line up side by side in a double layer, a <b>bilayer</b>, tails meeting in the middle, heads facing the water inside and out. Here is a tiny bubble of membrane. Every cell in your body is wrapped in one about 5 nanometres thick.',
      check: {
        q: 'Why do the two layers of a membrane point their tails at each other?',
        options: ['So that both sets of tails are hidden from the water on either side', 'Because the heads repel the tails of the other layer', 'It is a coincidence'],
        answer: 0,
        setup: { kind: 'lipid', count: 0, oil: 0, temp: 0.2, bubble: true },
        explain: 'There is water inside the cell and outside it. Facing the tails together hides all of them, while every head touches water. It is the arrangement with the least oil exposed.',
      },
      params: { kind: 'lipid', count: 0, oil: 0, temp: 0.2, bubble: true },
      enter: (s) => s.vesicle(),
      duration: 16,
    },
    {
      title: 'Self-healing',
      text: 'Poke a hole and the membrane closes up again: the exposed tails at the edges hate water so much that the gap pulls shut. Cells survive small tears this way, and scientists use a quick electric shock to open such holes on purpose, to slip DNA or medicines inside.',
      params: { kind: 'lipid', count: 0, oil: 0, temp: 0.2 },
      enter: (s) => {
        s.vesicle();
        setTimeout(() => s.poke(), 2500);
      },
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Mix soap or lipids with oil, change the temperature, scatter them, make bubbles and poke holes. Drag on the water to stir.',
      params: { kind: 'soap', count: 90, oil: 2, temp: 0.3, bubble: false },
      enter: (s) => s.scatter(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let P = [], bonds = [], ties = [], mols = [], k = 12, W = 60, H = 45, stir = null;
    const top = () => 60;

    function layout() {
      k = clamp(Math.min(api.w, api.h) / 52, 8, 15);
      W = api.w / k;
      H = (api.h - top()) / k;
    }
    const add = (x, y, t, m) => (P.push({ x, y, vx: 0, vy: 0, t, m }), P.length - 1);
    function addMol(kind, x, y, a) {
      const c = Math.cos(a), s = Math.sin(a), id = mols.length;
      const h = add(x, y, 'H', id);
      if (kind === 'soap') {
        const t1 = add(x + c * 0.8, y + s * 0.8, 'T', id), t2 = add(x + c * 1.6, y + s * 1.6, 'T', id);
        bonds.push([h, t1], [t1, t2]);
        ties.push([h, t2, 1.6]);
        mols.push({ kind, beads: [h, t1, t2] });
      } else {
        const nx = -s * 0.5, ny = c * 0.5;
        const a1 = add(x + c * 0.8 + nx, y + s * 0.8 + ny, 'T', id), a2 = add(x + c * 1.6 + nx, y + s * 1.6 + ny, 'T', id);
        const b1 = add(x + c * 0.8 - nx, y + s * 0.8 - ny, 'T', id), b2 = add(x + c * 1.6 - nx, y + s * 1.6 - ny, 'T', id);
        bonds.push([h, a1], [a1, a2], [h, b1], [b1, b2]);
        ties.push([a1, b1, 1], [a2, b2, 1], [h, a2, 1.7], [h, b2, 1.7]);
        mols.push({ kind, beads: [h, a1, a2, b1, b2] });
      }
    }
    function addOil(cx, cy, n = 22) {
      for (let i = 0; i < n; i++) {
        const a = rand(TAU), r = Math.sqrt(Math.random()) * 2.4;
        add(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 'O', -1);
      }
    }
    function clear() {
      P = [];
      bonds = [];
      ties = [];
      mols = [];
    }
    function scatter() {
      layout();
      clear();
      const nOil = Math.round(params.oil), nMol = Math.round(params.count);
      let placed = 0;
      for (let d = 0; d < nOil; d++) {
        // bare oil starts in a huddle and merges; with soap the droplets start well apart
        const huddle = nMol === 0;
        const cx = huddle ? W * 0.56 + (d % 2 ? 5.2 : 0) + rand(-0.3, 0.3) : W * (0.2 + 0.6 * ((d + 0.5) / nOil)) + rand(-2, 2);
        const cy = huddle ? H * 0.42 + Math.floor(d / 2) * 5.2 + rand(-0.3, 0.3) : H * (0.3 + 0.4 * (d % 2)) + rand(-2, 2);
        addOil(cx, cy);
        // soap poured onto grease: a few molecules start out already touching each droplet, tails in
        for (let j = 0; j < 8 && placed < nMol; j++, placed++) {
          const a = (j / 8) * TAU + rand(-0.2, 0.2);
          addMol(params.kind, cx + Math.cos(a) * 4.4, cy + Math.sin(a) * 4.4, a + Math.PI);
        }
      }
      for (let i = placed; i < nMol; i++) addMol(params.kind, rand(2, W - 2), rand(2, H - 2), rand(TAU));
    }
    function vesicle() {
      layout();
      clear();
      // a bilayer bubble: outer leaflet heads out, inner leaflet heads in, tails meeting in between
      const cx = W * (api.w >= 760 ? 0.56 : 0.5), cy = H * 0.45, R = Math.min(W, H) * 0.24;
      const ring = (r, inward) => {
        const n = Math.round((TAU * r) / 1.32);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU, hx = cx + Math.cos(a) * r, hy = cy + Math.sin(a) * r;
          addMol('lipid', hx, hy, inward ? a : a + Math.PI);
        }
      };
      ring(R + 1.8, false);
      ring(R - 1.8, true);
      for (let i = 0; i < 18; i++) addMol('lipid', rand(2, W - 2), rand(2, H - 2), rand(TAU));
    }
    function poke() {
      // knock out a few neighbouring lipids from one side of the bubble
      if (!mols.length) return;
      const xs = P.filter((p) => p.t === 'H'), cx = xs.reduce((a, p) => a + p.x, 0) / xs.length;
      const victims = mols.map((m, i) => [i, P[m.beads[0]]]).filter(([, h]) => h.x > cx).sort((a, b) => b[1].x - a[1].x).slice(0, 7);
      for (const [i] of victims)
        for (const b of mols[i].beads) {
          P[b].x += 9 + rand(0, 3);
          P[b].vx += 20;
        }
    }

    function step() {
      const n = P.length, fx = new Float64Array(n), fy = new Float64Array(n);
      for (const [i, j] of bonds) {
        const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, d = Math.hypot(dx, dy) || 1e-6, f = (150 * (d - 0.8)) / d;
        fx[i] += f * dx;
        fy[i] += f * dy;
        fx[j] -= f * dx;
        fy[j] -= f * dy;
      }
      for (const [i, j, L] of ties) {
        const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, d = Math.hypot(dx, dy) || 1e-6, f = (40 * (d - L)) / d;
        fx[i] += f * dx;
        fy[i] += f * dy;
        fx[j] -= f * dx;
        fy[j] -= f * dy;
      }
      const cs = 2.5, grid = new Map();
      for (let i = 0; i < n; i++) {
        const key = Math.floor(P[i].x / cs) * 4096 + Math.floor(P[i].y / cs);
        (grid.get(key) || grid.set(key, []).get(key)).push(i);
      }
      for (let i = 0; i < n; i++) {
        const gx = Math.floor(P[i].x / cs), gy = Math.floor(P[i].y / cs), ti = P[i].t;
        for (let a = -1; a <= 1; a++)
          for (let b = -1; b <= 1; b++) {
            const list = grid.get((gx + a) * 4096 + gy + b);
            if (!list) continue;
            for (const j of list) {
              if (j <= i) continue;
              const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, d2 = dx * dx + dy * dy;
              if (d2 > 6.25) continue;
              const d = Math.sqrt(d2) || 1e-6, tj = P[j].t;
              let f = 0;
              if (d < 1) f += 40 * (1 - d);
              const oily = (ti === 'T' || ti === 'O') && (tj === 'T' || tj === 'O');
              if (oily) {
                // oily parts attract (oil to oil most strongly)
                const A = ti === 'O' && tj === 'O' ? 1.9 : 1.35, u = A * Math.exp(-((d - 1.05) ** 2) / 0.3);
                f -= (u * (d - 1.05)) / 0.15;
              } else if (ti === 'H' && tj === 'H') {
                if (d < 1.4) f += 8 * (1.4 - d);
              } else if (d < 1.5) f += 6 * (1.5 - d);
              fx[i] -= (f * dx) / d;
              fy[i] -= (f * dy) / d;
              fx[j] += (f * dx) / d;
              fy[j] += (f * dy) / d;
            }
          }
      }
      const sq = Math.sqrt(2 * G * params.temp * DT);
      for (let i = 0; i < n; i++) {
        const p = P[i];
        if (stir) {
          const dx = p.x - stir.x, dy = p.y - stir.y;
          if (dx * dx + dy * dy < 36) (fx[i] += stir.vx * 6), (fy[i] += stir.vy * 6);
        }
        p.vx += (fx[i] - G * p.vx) * DT + sq * randn();
        p.vy += (fy[i] - G * p.vy) * DT + sq * randn();
        p.x += p.vx * DT;
        p.y += p.vy * DT;
        if (p.x < 0) (p.x = 0), (p.vx = Math.abs(p.vx));
        if (p.x > W) (p.x = W), (p.vx = -Math.abs(p.vx));
        if (p.y < 0) (p.y = 0), (p.vy = Math.abs(p.vy));
        if (p.y > H) (p.y = H), (p.vy = -Math.abs(p.vy));
      }
    }
    // clusters of oily beads (tails and oil) that touch
    function clusters() {
      const idx = [];
      for (let i = 0; i < P.length; i++) if (P[i].t !== 'H') idx.push(i);
      const lab = new Int32Array(P.length).fill(-1), sizes = [];
      for (const i of idx) {
        if (lab[i] >= 0) continue;
        const id = sizes.length, st = [i];
        lab[i] = id;
        let mset = new Set(), oil = 0;
        while (st.length) {
          const a = st.pop();
          if (P[a].m >= 0) mset.add(P[a].m);
          else oil++;
          for (const j of idx) if (lab[j] < 0 && (P[a].x - P[j].x) ** 2 + (P[a].y - P[j].y) ** 2 < 2.9) (lab[j] = id), st.push(j);
        }
        sizes.push({ mols: mset.size, oil });
      }
      return sizes;
    }
    let stats = { micelles: 0, loose: 0, droplets: 0, coated: 0 }, statT = 0;

    return {
      scatter,
      vesicle,
      poke,
      reset: scatter,
      resize() {
        const had = P.length;
        layout();
        if (!had) scatter();
      },
      onParam(key, v) {
        if (key === 'bubble' && v) return vesicle();
        if (key === 'kind' || key === 'count' || key === 'oil') {
          // add or remove molecules and oil to match the sliders without starting again
          if (key === 'kind') return scatter();
          const want = Math.round(params.count), have = mols.length;
          if (key === 'count' && want > have) for (let i = have; i < want; i++) addMol(params.kind, rand(2, W - 2), rand(2, H - 2), rand(TAU));
          else if (key === 'count' && want < have) scatter();
          if (key === 'oil') scatter();
        }
      },
      pointerDown(p) {
        stir = { x: p.x / k, y: (p.y - top()) / k, vx: 0, vy: 0 };
      },
      pointerMove(p) {
        if (!stir || !p.down) return;
        const x = p.x / k, y = (p.y - top()) / k;
        stir.vx = (x - stir.x) * 6;
        stir.vy = (y - stir.y) * 6;
        stir.x = x;
        stir.y = y;
      },
      pointerUp() {
        stir = null;
      },
      update(dt) {
        if (!P.length && !params.count && !params.oil) return;
        const steps = 16, t0 = performance.now();
        for (let s = 0; s < steps; s++) {
          step();
          if (!api.thumbnail && performance.now() - t0 > 9) break;
        }
        if (stir) (stir.vx *= 0.8), (stir.vy *= 0.8);
        statT -= dt;
        if (statT <= 0 && !api.thumbnail) {
          statT = 0.5;
          const cl = clusters();
          stats = {
            micelles: cl.filter((c) => c.mols >= 4 && !c.oil).length,
            loose: cl.filter((c) => c.mols === 1 && !c.oil).length,
            droplets: cl.filter((c) => c.oil >= 6).length,
            coated: cl.filter((c) => c.oil >= 6 && c.mols >= 4).length,
          };
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#07203a', edge: '#020814' });
        const X = (p) => p.x * k, Y = (p) => top() + p.y * k;
        // oil
        for (const p of P) {
          if (p.t !== 'O') continue;
          ctx.fillStyle = OIL;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(X(p), Y(p), k * 0.62, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        // tails
        ctx.strokeStyle = TAIL;
        ctx.lineWidth = Math.max(2, k * 0.42);
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (const [i, j] of bonds) {
          if (P[i].t === 'H') continue;
          ctx.moveTo(X(P[i]), Y(P[i]));
          ctx.lineTo(X(P[j]), Y(P[j]));
        }
        for (const m of mols) {
          const h = P[m.beads[0]], t = P[m.beads[1]];
          ctx.moveTo(X(h), Y(h));
          ctx.lineTo(X(t), Y(t));
          if (m.kind === 'lipid') {
            const t2 = P[m.beads[3]];
            ctx.moveTo(X(h), Y(h));
            ctx.lineTo(X(t2), Y(t2));
          }
        }
        ctx.stroke();
        // heads
        for (const m of mols) {
          const h = P[m.beads[0]];
          const g = ctx.createRadialGradient(X(h) - k * 0.2, Y(h) - k * 0.2, 1, X(h), Y(h), k * 0.6);
          g.addColorStop(0, '#d8f3ff');
          g.addColorStop(1, HEAD);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(X(h), Y(h), k * 0.58, 0, TAU);
          ctx.fill();
        }
        if (api.thumbnail) return;
        if (w >= 760) {
          tag(ctx, 'water-loving head', 24, 84, HEAD, { size: 11 });
          tag(ctx, 'oily tail', 160, 84, TAIL, { size: 11 });
          if (P.some((p) => p.t === 'O')) tag(ctx, 'oil', 236, 84, OIL, { size: 11 });
        }
        const lip = mols.length && mols[0].kind === 'lipid';
        const msg = P.some((p) => p.t === 'O')
          ? `${stats.droplets} oil droplet${stats.droplets === 1 ? '' : 's'} · ${stats.coated} coated with soap`
          : lip ? 'membrane lipids: two tails each' : `${stats.micelles} micelle${stats.micelles === 1 ? '' : 's'} · ${stats.loose} loose molecules`;
        tag(ctx, msg, w - 16, 84, C.cyan, { align: 'right', size: 11 });
      },
      stats() {
        return [
          { label: 'Molecules', value: String(mols.length) },
          { label: 'Micelles (balls of 4 or more)', value: String(stats.micelles), color: TAIL },
          { label: 'Loose molecules', value: String(stats.loose) },
          { label: 'Oil droplets / coated', value: `${stats.droplets} / ${stats.coated}`, color: OIL },
        ];
      },
    };
  },
};
