import { C, Series, backdrop, clamp, drawGlow, randn, tag, TAU } from '../../core/util.js';

// A two-letter (HP) protein: oily, hydrophobic beads (H) and water-loving, polar beads (P) on a flexible chain,
// moved by Langevin dynamics (random kicks from water plus friction). Oily beads attract each other strongly and
// any neighbour a little: being surrounded hides them from water, which is the hydrophobic effect that folds proteins.

const SEQS = {
  designed: 'PHPPHHPHHPPHPHHPHPPHHPHHPPHPHHPHPP',
  oily: 'HHHHPHHHHHHPHHHHHHPHHHHHHPHHHHHHHH',
  polar: 'PPPPHPPPPPPHPPPPPPHPPPPPPHPPPPPPPP',
};
const H = '#ffb547', P = '#4cc3ff';
const DT = 0.015, GAMMA = 1.5;

export default {
  id: 'protein-folding',
  title: 'How Proteins Fold',
  category: 'chemistry',
  tagline: 'A floppy chain of amino acids snaps into a working shape, because oil hides from water.',
  ages: ['14-16', '16+'],
  topics: ['Proteins', 'Molecules', 'AI in science'],
  keywords: ['protein folding', 'amino acid', 'hydrophobic', 'denature', 'AlphaFold', 'Levinthal', 'sickle cell', 'enzyme', 'HP model'],
  blurb:
    'Every protein starts as a string of amino acids, and only works once it has folded into the right shape. The driving force is surprisingly simple: oily amino acids avoid water and huddle together in the middle, leaving water-loving ones on the outside. Heat it and it unfolds; change one bead and it can turn sticky. Predicting the fold from the string was a 50-year puzzle, until AI cracked it.',
  ideas: [
    'A protein is a chain of <b>amino acids</b>; its sequence is spelled out by a gene.',
    '<b>Hydrophobic</b> (oily) amino acids hide from water in the core; <b>polar</b> ones stay on the surface.',
    'The folded shape decides what a protein does, from carrying oxygen to digesting food.',
    'Heat breaks the weak attractions holding the fold: the protein <b>denatures</b>, as when an egg cooks.',
    'AI systems like AlphaFold now predict a protein’s shape from its sequence, earning a share of the 2024 Nobel Prize in Chemistry.',
  ],
  hint: 'Drag a bead to pull the chain about',
  thumbChapter: 2,
  thumbFrames: 420,
  params: [
    { key: 'seq', label: 'Sequence', type: 'select', value: 'designed', options: [{ value: 'designed', label: 'Mixed (like a real protein)' }, { value: 'oily', label: 'Almost all oily' }, { value: 'polar', label: 'Almost all water-loving' }] },
    { key: 'temp', label: 'Temperature', type: 'range', min: 0.2, max: 4, step: 0.05, value: 0.5, format: (v) => `${Math.round(20 + v * 16)} °C (model)` },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.3, max: 3, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'water', label: 'Show water', type: 'toggle', value: true },
    // chapter 1 grows the chain on the ribosome; every later chapter (including links straight to it) starts from a whole chain
    { key: 'grow', type: 'toggle', value: false, hidden: true },
    { key: 'stretch', label: 'Stretch it out', type: 'button', action: (s) => s.stretch() },
    { key: 'mutate', label: 'Mutate one bead', type: 'button', action: (s) => s.mutate() },
  ],
  story: [
    {
      title: 'Made bead by bead',
      text: 'A ribosome builds a protein by joining amino acids into a chain, in the order spelled out by a gene. There are 20 kinds; here we sort them into two families: <b>oily</b> ones (orange) that shun water, and <b>water-loving</b> ones (blue).',
      params: { seq: 'designed', temp: 0.5, speed: 1, water: true, grow: true },
      enter: (s) => s.synthesize(),
      duration: 15,
    },
    {
      title: 'Oil hides from water',
      text: 'Water jostles the chain constantly. Whenever oily beads bump together they tend to stay, out of water’s way, while water-loving beads are happy on the outside. Within moments the floppy string collapses into a compact ball with an oily core.',
      params: { seq: 'designed', temp: 0.5, grow: false },
      duration: 15,
    },
    {
      title: 'Inside and out',
      text: 'Look at where each colour ended up.',
      check: {
        q: 'In a folded protein, where do most of the oily (hydrophobic) amino acids end up?',
        options: ['Buried in the core, away from water', 'On the surface, touching water', 'Spread evenly everywhere'],
        answer: 0,
        setup: { seq: 'designed', temp: 0.5 },
        explain: 'Water molecules would rather bond with each other than sit next to oil, so the chain settles with oily beads inside and water-loving beads outside. It is the same reason oil drops merge in salad dressing.',
      },
      params: { seq: 'designed', temp: 0.5 },
      duration: 13,
    },
    {
      title: 'Shape is everything',
      text: 'A real protein folds into one precise shape, and the shape is its job: a pocket that grips a sugar, a channel that lets ions through, a hinge that pulls a muscle. Christian Anfinsen won the 1972 Nobel Prize for showing that the sequence alone contains all the instructions.',
      params: { seq: 'designed', temp: 0.4 },
      duration: 14,
    },
    {
      title: 'Too hot: unfolding',
      text: 'Turn up the heat. The kicks from water grow stronger than the weak attractions holding the core together, and the chain flops open: it is <b>denatured</b>. Cooking an egg does this to its proteins, which then tangle together and set solid.',
      check: {
        q: 'Why does egg white turn white and solid when you cook it?',
        options: ['Its proteins unfold and tangle together', 'The water in it freezes', 'New proteins are made by the heat'],
        answer: 0,
        setup: { seq: 'designed', temp: 0.5 },
        explain: 'Heat shakes the proteins open, exposing their oily cores. Unfolded chains stick to each other and form a tangled solid that scatters light. Cooling doesn’t undo the tangle, which is why you can’t uncook an egg.',
      },
      params: { seq: 'designed', temp: 3.8 },
      duration: 16,
    },
    {
      title: 'A puzzle of numbers',
      text: 'A chain of 100 amino acids could take more shapes than there are atoms in the universe; trying them one by one would take longer than the age of the universe. Yet proteins fold in milliseconds. They don’t search: each move that hides a bit more oil is downhill, so the chain slides down an energy funnel. Watch the energy chart fall.',
      params: { seq: 'designed', temp: 0.5 },
      enter: (s) => s.stretch(),
      duration: 16,
    },
    {
      title: 'One wrong bead',
      text: 'Swap a single water-loving bead on the surface for an oily one and the protein gains a sticky patch. In sickle-cell disease exactly this happens to haemoglobin: one amino acid out of 146 changes, and the molecules clump into stiff fibres that bend red blood cells into sickles.',
      params: { seq: 'designed', temp: 0.5 },
      enter: (s) => s.mutateSurface(),
      duration: 15,
    },
    {
      title: 'AI solves the fold',
      text: 'Working out a protein’s shape in the lab can take years. In 2020 DeepMind’s AlphaFold learned to predict it from the sequence alone, almost as accurately. It has since predicted structures for over 200 million proteins, and Demis Hassabis and John Jumper shared the 2024 Nobel Prize in Chemistry with David Baker, who designs brand-new proteins.',
      params: { seq: 'designed', temp: 0.5 },
      enter: (s) => s.stretch(),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Change the sequence and temperature, mutate beads, stretch the chain or drag it about, and see which chains fold into a neat ball.',
      params: { seq: 'designed', temp: 0.5 },
      enter: (s) => s.stretch(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let seq = SEQS.designed, n = seq.length;
    let x, y, vx, vy, fx, fy, shown = n, growT = 0, cam = { x: 0, y: 0, s: 24 }, grab = -1, mutated = -1, E = 0;
    const sE = new Series(400), sR = new Series(400);
    const water = Array.from({ length: 70 }, () => ({ a: Math.random() * TAU, r: 0.5 + Math.random(), p: Math.random() * TAU, k: Math.floor(Math.random() * 40) }));

    function alloc() {
      n = seq.length;
      x = new Float64Array(n);
      y = new Float64Array(n);
      vx = new Float64Array(n);
      vy = new Float64Array(n);
      fx = new Float64Array(n);
      fy = new Float64Array(n);
    }
    function stretch() {
      seq = SEQS[params.seq] || SEQS.designed;
      mutated = -1;
      alloc();
      // a loose zig-zag, centred
      for (let i = 0; i < n; i++) {
        x[i] = (i - n / 2) * 0.92;
        y[i] = (i % 2 ? 0.3 : -0.3) + randn() * 0.05;
      }
      shown = n;
      sE.clear();
      sR.clear();
    }
    function synthesize() {
      stretch();
      shown = 1;
      growT = 0;
      for (let i = 0; i < n; i++) (x[i] = -n * 0.46), (y[i] = 0);
    }
    /** Complete a chain still on the ribosome, laying the missing beads out loosely. */
    function finish() {
      if (!x) return stretch();
      for (let i = shown; i < n; i++) {
        x[i] = x[i - 1] + 0.92;
        y[i] = (i % 2 ? 0.3 : -0.3) + randn() * 0.05;
        vx[i] = vy[i] = 0;
      }
      shown = n;
    }
    function mutate(i) {
      if (i === undefined) i = Math.floor(Math.random() * n);
      seq = seq.slice(0, i) + (seq[i] === 'H' ? 'P' : 'H') + seq.slice(i + 1);
      mutated = i;
    }
    function centre() {
      let cx = 0, cy = 0;
      for (let i = 0; i < shown; i++) (cx += x[i]), (cy += y[i]);
      return [cx / shown, cy / shown];
    }
    function mutateSurface() {
      if (!x) stretch();
      // the water-loving bead furthest from the centre becomes oily
      const [cx, cy] = centre();
      let best = -1, bd = -1;
      for (let i = 0; i < n; i++) {
        if (seq[i] !== 'P') continue;
        const d = (x[i] - cx) ** 2 + (y[i] - cy) ** 2;
        if (d > bd) (bd = d), (best = i);
      }
      if (best >= 0) mutate(best);
    }
    function step() {
      fx.fill(0);
      fy.fill(0);
      E = 0;
      const m = shown;
      for (let i = 0; i < m - 1; i++) {
        const dx = x[i + 1] - x[i], dy = y[i + 1] - y[i], d = Math.hypot(dx, dy) || 1e-6, f = (100 * (d - 1)) / d;
        fx[i] += f * dx;
        fy[i] += f * dy;
        fx[i + 1] -= f * dx;
        fy[i + 1] -= f * dy;
      }
      for (let i = 1; i < m - 1; i++) {
        const ax = x[i - 1] + x[i + 1] - 2 * x[i], ay = y[i - 1] + y[i + 1] - 2 * y[i];
        fx[i] += 1.5 * ax;
        fy[i] += 1.5 * ay;
        fx[i - 1] -= 0.75 * ax;
        fy[i - 1] -= 0.75 * ay;
        fx[i + 1] -= 0.75 * ax;
        fy[i + 1] -= 0.75 * ay;
      }
      for (let i = 0; i < m; i++)
        for (let j = i + 2; j < m; j++) {
          const dx = x[j] - x[i], dy = y[j] - y[i], d2 = dx * dx + dy * dy;
          if (d2 > 6.25) continue;
          const d = Math.sqrt(d2) || 1e-6;
          let f = 0;
          if (d < 1) f += 60 * (1 - d);
          const nH = (seq[i] === 'H') + (seq[j] === 'H');
          if (nH) {
            // oily beads want neighbours (any neighbour hides them from water), and other oily beads most of all
            const A = nH === 2 ? 1.6 : 0.55, u = A * Math.exp(-((d - 1.15) ** 2) / 0.35);
            E -= u;
            f -= (u * (d - 1.15)) / 0.175;
          }
          fx[i] -= (f * dx) / d;
          fy[i] -= (f * dy) / d;
          fx[j] += (f * dx) / d;
          fy[j] += (f * dy) / d;
        }
      const sq = Math.sqrt(2 * GAMMA * params.temp * DT);
      for (let i = 0; i < m; i++) {
        if (i === grab) continue;
        vx[i] += (fx[i] - GAMMA * vx[i]) * DT + sq * randn();
        vy[i] += (fy[i] - GAMMA * vy[i]) * DT + sq * randn();
        x[i] += vx[i] * DT;
        y[i] += vy[i] * DT;
      }
    }
    const rg = () => {
      const [cx, cy] = centre();
      let s = 0;
      for (let i = 0; i < shown; i++) s += (x[i] - cx) ** 2 + (y[i] - cy) ** 2;
      return Math.sqrt(s / shown);
    };
    function buried() {
      // share of oily beads with at least three neighbours close by
      let h = 0, b = 0;
      for (let i = 0; i < shown; i++) {
        if (seq[i] !== 'H') continue;
        h++;
        let c = 0;
        for (let j = 0; j < shown; j++) if (j !== i && (x[j] - x[i]) ** 2 + (y[j] - y[i]) ** 2 < 2.1) c++;
        if (c >= 4) b++;
      }
      return h ? b / h : 0;
    }
    // wide screens: centre the chain right of middle, clear of the story card
    const cx0 = () => (api.w < 760 ? api.w / 2 : api.w * 0.56);
    const toScreen = (i) => [cx0() + (x[i] - cam.x) * cam.s, cam.y0 + (y[i] - cam.y) * cam.s];

    return {
      stretch,
      synthesize,
      mutate: () => mutate(),
      mutateSurface,
      reset: stretch,
      resize() {
        if (!x) stretch();
      },
      onParam(k, v) {
        if (k === 'seq') stretch();
        if (k === 'grow') v ? synthesize() : finish();
      },
      pointerDown(p) {
        let best = -1, bd = 30 * 30;
        for (let i = 0; i < shown; i++) {
          const [sx, sy] = toScreen(i), d = (sx - p.x) ** 2 + (sy - p.y) ** 2;
          if (d < bd) (bd = d), (best = i);
        }
        grab = best;
      },
      pointerMove(p) {
        if (grab < 0 || !p.down) return;
        x[grab] = cam.x + (p.x - cx0()) / cam.s;
        y[grab] = cam.y + (p.y - cam.y0) / cam.s;
        vx[grab] = vy[grab] = 0;
      },
      pointerUp() {
        grab = -1;
      },
      update(dt) {
        if (!x) return;
        dt = Math.min(dt, 0.05);
        if (shown < n) {
          // the ribosome adds a bead every 0.35 s; each new one joins the end of the chain
          growT += dt;
          while (growT > 0.35 && shown < n) {
            growT -= 0.35;
            x[shown] = x[shown - 1] + 0.95;
            y[shown] = y[shown - 1] + randn() * 0.1;
            vx[shown] = vy[shown] = 0;
            shown++;
          }
        }
        const steps = Math.round(70 * params.speed), t0 = performance.now();
        for (let s = 0; s < steps; s++) {
          step();
          if (!api.thumbnail && performance.now() - t0 > 8) break;
        }
        // camera follows the chain gently and zooms to fit
        const [cx, cy] = centre();
        let ext = 4;
        for (let i = 0; i < shown; i++) ext = Math.max(ext, Math.abs(x[i] - cx) + 1.5, Math.abs(y[i] - cy) * 1.4 + 1.5);
        const target = clamp(Math.min(api.w * 0.42, api.h * 0.34) / ext, 10, 34);
        const k = Math.min(1, dt * 2.5);
        cam.x += (cx - cam.x) * k;
        cam.y += (cy - cam.y) * k;
        cam.s += (target - cam.s) * k;
        cam.y0 = api.w < 760 ? api.h * 0.42 : api.h * 0.4;
        for (const wp of water) wp.p += dt * (1 + params.temp);
        if (api.frame % 3 === 0) {
          sE.push(E);
          sR.push(rg());
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#081628' });
        if (!x) return;
        if (cam.y0 === undefined) cam.y0 = h * 0.4;
        const R = clamp(cam.s * 0.42, 4, 13);
        // water molecules jiggling around the water-loving beads
        if (params.water && !api.thumbnail) {
          ctx.fillStyle = 'rgba(120,200,255,0.35)';
          for (const wp of water) {
            const i = wp.k % shown;
            if (seq[i] !== 'P') continue;
            const [sx, sy] = toScreen(i);
            const rr = R * (1.6 + wp.r) + Math.sin(wp.p * 3) * 2;
            ctx.beginPath();
            ctx.arc(sx + Math.cos(wp.a + wp.p * 0.4) * rr, sy + Math.sin(wp.a + wp.p * 0.4) * rr, 2.2, 0, TAU);
            ctx.fill();
          }
        }
        // backbone
        ctx.strokeStyle = 'rgba(233,237,247,0.55)';
        ctx.lineWidth = Math.max(2, R * 0.35);
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < shown; i++) {
          const [sx, sy] = toScreen(i);
          i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
        }
        ctx.stroke();
        // oily core glow
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < shown; i++) if (seq[i] === 'H') drawGlow(ctx, ...toScreen(i), R * 2.6, H, 0.12);
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < shown; i++) {
          const [sx, sy] = toScreen(i);
          const g = ctx.createRadialGradient(sx - R * 0.35, sy - R * 0.35, R * 0.1, sx, sy, R);
          const c = seq[i] === 'H' ? H : P;
          g.addColorStop(0, '#ffffff');
          g.addColorStop(0.35, c);
          g.addColorStop(1, c + 'aa');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(sx, sy, R, 0, TAU);
          ctx.fill();
          if (i === mutated) {
            ctx.strokeStyle = C.red;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(sx, sy, R + 5, 0, TAU);
            ctx.stroke();
          }
        }
        if (shown < n) {
          // the ribosome at the growing end
          const [sx, sy] = toScreen(shown - 1);
          ctx.fillStyle = 'rgba(167,139,250,0.85)';
          ctx.beginPath();
          ctx.ellipse(sx + R * 2.2, sy, R * 2.2, R * 1.6, 0, 0, TAU);
          ctx.fill();
          if (!api.thumbnail) tag(ctx, 'ribosome', sx + R * 2.2, sy - R * 2.6, C.violet, { align: 'center', size: 11 });
        }
        if (api.thumbnail) return;
        if (mutated >= 0) {
          const [sx, sy] = toScreen(mutated);
          tag(ctx, 'mutation: now oily', sx, sy - R - 18, C.red, { align: 'center', size: 11 });
        }
        const r = rg(), state = r < 2.9 ? 'folded' : r < 3.5 ? 'partly folded' : 'unfolded';
        tag(ctx, `${state}  ·  ${Math.round(buried() * 100)} % of oily beads buried`, w - 16, 84, state === 'folded' ? C.teal : C.amber, { align: 'right', size: 12 });
        if (w >= 760) {
          tag(ctx, 'oily (hydrophobic)', 24, 84, H, { size: 11 });
          tag(ctx, 'water-loving (polar)', 164, 84, P, { size: 11 });
        }
      },
      stats() {
        if (!x) return [];
        const r = rg();
        return [
          { label: 'Shape', value: r < 2.9 ? 'folded' : r < 3.5 ? 'partly folded' : 'unfolded', color: r < 2.9 ? C.teal : C.amber },
          { label: 'Oily beads buried', value: Math.round(buried() * 100) + ' %', color: H },
          { label: 'Size (radius)', value: r.toFixed(1) + ' beads' },
          { label: 'Energy', value: E.toFixed(1), color: C.cyan },
        ];
      },
      charts() {
        return [
          { title: 'Energy: falls as oil gets buried', series: [{ data: sE.data, color: C.cyan }], length: 400 },
          { title: 'Size of the chain', series: [{ data: sR.data, color: C.amber }], min: 0, length: 400 },
        ];
      },
    };
  },
};
