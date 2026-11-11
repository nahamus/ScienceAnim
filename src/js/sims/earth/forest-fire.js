import { C, clamp, roundRect, tag, text } from '../../core/util.js';

// Site percolation on a square grid: each cell holds a tree with probability p, and fire spreads from a burning tree
// to its four neighbours. Below p ≈ 0.593 fires stay small; above it they cross the whole forest. In "living forest"
// mode trees regrow and lightning strikes at random (the Drossel–Schwabl model), and the forest organises itself
// near the critical density, with fires of every size.

const EMPTY = 0, TREE = 1, FIRE = 2, ASH = 3, NEW = 4;
const PC = 0.5927;

export default {
  id: 'forest-fire',
  title: 'Forest Fires & Tipping Points',
  category: 'earth',
  tagline: 'Add a few more trees and a small fire becomes a forest-wide blaze. Meet the tipping point.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Wildfires', 'Tipping points', 'Complex systems'],
  keywords: ['forest fire', 'wildfire', 'percolation', 'tipping point', 'critical threshold', 'firebreak', 'self-organised criticality', 'power law', 'Drossel-Schwabl'],
  blurb:
    'Plant trees at random and light one edge. If the forest is sparse the fire soon dies out; if it is dense the fire sweeps right across. In between lies a sharp tipping point at about 59 % cover, where a tiny change makes all the difference. The same maths describes how diseases spread, how water seeps through coffee grounds, and why putting out every small wildfire can lead to giant ones.',
  ideas: [
    'Fire can only jump to a neighbouring tree, so it needs a <b>connected path</b> of trees to keep going.',
    'Below a <b>critical density</b> (about 59 % on a square grid) fires stay small; above it they cross the whole forest.',
    'Near the threshold the burnt patches are ragged <b>fractals</b>, and a tiny change in density changes everything.',
    '<b>Firebreaks</b> work by cutting the connections; vaccination stops epidemics in exactly the same way.',
    'A forest that regrows and is struck by lightning tunes itself to the edge: fires of <b>every size</b>, many small and a few huge.',
  ],
  hint: 'Click to light a fire; choose “cut firebreaks” and drag to clear trees',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 260,
  params: [
    { key: 'mode', label: 'Forest', type: 'select', value: 'single', options: [{ value: 'single', label: 'Planted forest, one fire' }, { value: 'living', label: 'Living forest (regrowth and lightning)' }] },
    { key: 'density', label: 'Tree cover', type: 'range', min: 0.2, max: 0.95, step: 0.01, value: 0.45, instant: true, format: (v) => Math.round(v * 100) + ' %' },
    { key: 'tool', label: 'Clicking the forest', type: 'select', value: 'light', options: [{ value: 'light', label: 'lights a fire' }, { value: 'cut', label: 'cuts a firebreak' }] },
    { key: 'grow', label: 'Regrowth (living forest)', type: 'range', min: 0.2, max: 3, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'replant', label: 'Replant the forest', type: 'button', action: (s) => s.plant() },
    { key: 'ignite', label: 'Light the left edge', type: 'button', action: (s) => s.igniteEdge() },
  ],
  story: [
    {
      title: 'A sparse forest',
      text: 'Each square is a patch of ground; trees (green) cover 45 % of them at random. We light the whole left edge. Fire can only jump to a tree right next to it, so it soon runs out of neighbours and dies, having burnt only a small part of the forest.',
      params: { mode: 'single', density: 0.45, tool: 'light' },
      enter: (s) => s.plantAndLight(),
      duration: 12,
    },
    {
      title: 'A dense forest',
      text: 'Now plant 70 % cover and light the edge again. There are connected paths of trees almost everywhere, and the fire sweeps right across the forest.',
      params: { mode: 'single', density: 0.7 },
      enter: (s) => s.plantAndLight(),
      duration: 12,
    },
    {
      title: 'The tipping point',
      text: 'Between them lies a sharp threshold, at about 59 % cover. Just below it, fires fizzle; just above, they cross the forest. Right at the threshold the fire creeps along ragged, branching paths: the burnt shape is a fractal. The panel shows how much of the forest burns for each density: a cliff, not a slope.',
      formula: 'critical density on a square grid:  p꜀ ≈ 0.593',
      params: { mode: 'single', density: 0.6 },
      enter: (s) => s.plantAndLight(),
      duration: 16,
    },
    {
      title: 'A small change, a big difference',
      text: 'Compare two forests that differ by only a few trees in every hundred.',
      check: {
        q: 'One forest has 55 % tree cover and another 65 %. How do fires lit at one edge compare?',
        options: ['In the 65 % forest it usually crosses the whole forest; in the 55 % one it dies out', 'The 65 % fire is about 10 % bigger', 'They behave the same'],
        answer: 0,
        setup: { mode: 'single', density: 0.55 },
        explain: 'The threshold at 59 % lies between them. Below it the clusters of connected trees are all finite; above it one giant cluster spans the forest. A tipping point turns a small change in the cause into a huge change in the result.',
      },
      params: { mode: 'single', density: 0.65 },
      enter: (s) => s.plantAndLight(),
      duration: 14,
    },
    {
      title: 'Firebreaks',
      text: 'A dense forest, but with strips cleared through it. The fire races up to the first break and stops. Firefighters cut breaks and burn strips on purpose for this reason. Vaccination works the same way: immune people are gaps that break the chains an infection needs.',
      params: { mode: 'single', density: 0.75, tool: 'cut' },
      enter: (s) => s.plantAndLight(true),
      duration: 15,
    },
    {
      title: 'A living forest',
      text: 'Now let trees regrow slowly and lightning strike now and then. Watch the tree cover: it rises past the threshold, a big fire knocks it back, and it rises again. The forest tunes itself to the tipping point, and the fires come in every size, from a single tree to huge blazes. Physicists call this self-organised criticality, like the sandpile.',
      params: { mode: 'living', grow: 1 },
      enter: (s) => s.plant(),
      duration: 22,
    },
    {
      title: 'The problem with putting fires out',
      text: 'In 1988 a third of Yellowstone National Park burned in an extremely dry, windy summer. In many forests, decades of putting out every small fire had also let fuel build up.',
      check: {
        q: 'Why can stopping every small fire make giant fires more likely?',
        options: ['The forest keeps filling in until it is far above the tipping point, so the next fire connects everything', 'Small fires make the trees fireproof', 'It doesn’t: it always makes fires smaller'],
        answer: 0,
        setup: { mode: 'living', grow: 1 },
        explain: 'Small fires thin the forest and keep it near the threshold. Remove them and fuel builds up into one connected mass, ready for a catastrophic blaze. Many parks now let small fires burn or set controlled burns.',
      },
      params: { mode: 'living', grow: 2 },
      duration: 18,
    },
    {
      title: 'Your forest',
      text: 'Set the density, light fires, cut firebreaks, or switch to the living forest. Can you find the lowest density at which the fire still crosses?',
      params: { mode: 'single', density: 0.59, tool: 'light' },
      enter: (s) => s.plantAndLight(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let W = 0, H = 0, cell = 6, grid, next, off, octx, img, shade, fireT = 0, growT = 0;
    let burnedNow = 0, initialTrees = 0, crossed = false, curve = null, sizes = new Map(), cover = [], currentFire = null;

    function alloc() {
      cell = api.thumbnail ? 5 : api.w < 760 ? 5 : 6;
      W = Math.floor(api.w / cell);
      H = Math.floor((api.h - 60) / cell);
      grid = new Uint8Array(W * H);
      next = new Uint8Array(W * H);
      shade = new Uint8Array(W * H).map(() => Math.floor(Math.random() * 60));
      off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      octx = off.getContext('2d');
      img = octx.createImageData(W, H);
      if (!api.thumbnail) curve = percolationCurve();
    }
    /** How much of a forest burns when the left edge is lit, averaged over a few random forests per density. */
    function percolationCurve() {
      const w = 90, h = 60, out = [], g = new Uint8Array(w * h), q = new Int32Array(w * h);
      for (let p = 0.3; p <= 0.901; p += 0.02) {
        let burnt = 0;
        for (let rep = 0; rep < 4; rep++) {
          let trees = 0, head = 0, tail = 0;
          for (let i = 0; i < w * h; i++) trees += g[i] = Math.random() < p ? 1 : 0;
          for (let y = 0; y < h; y++) if (g[y * w]) (g[y * w] = 2), (q[tail++] = y * w);
          while (head < tail) {
            const i = q[head++], x = i % w;
            for (const j of [i - 1, i + 1, i - w, i + w]) {
              if (j < 0 || j >= w * h || (j === i - 1 && x === 0) || (j === i + 1 && x === w - 1)) continue;
              if (g[j] === 1) (g[j] = 2), (q[tail++] = j);
            }
          }
          burnt += tail / Math.max(1, trees);
        }
        out.push([p, burnt / 4]);
      }
      return out;
    }
    function plant(breaks = false) {
      if (!W) alloc();
      for (let i = 0; i < W * H; i++) grid[i] = Math.random() < (params.mode === 'living' ? 0.3 : params.density) ? TREE : EMPTY;
      if (breaks) for (const fx of [0.3, 0.62]) for (let y = 0; y < H; y++) for (let k = 0; k < 3; k++) grid[y * W + Math.floor(W * fx) + k] = EMPTY;
      initialTrees = grid.reduce((a, c) => a + (c === TREE), 0);
      burnedNow = 0;
      crossed = false;
      sizes = new Map();
      cover = [];
      currentFire = null;
    }
    function igniteEdge() {
      for (let y = 0; y < H; y++) if (grid[y * W] === TREE) grid[y * W] = FIRE;
      crossed = false;
    }
    function plantAndLight(breaks) {
      plant(breaks);
      igniteEdge();
    }
    function spread() {
      next.set(grid);
      let burning = 0;
      for (let i = 0; i < W * H; i++) {
        if (grid[i] !== FIRE) continue;
        burning++;
        next[i] = ASH;
        const x = i % W;
        if (x > 0 && grid[i - 1] === TREE) next[i - 1] = FIRE;
        if (x < W - 1 && grid[i + 1] === TREE) next[i + 1] = FIRE;
        if (i >= W && grid[i - W] === TREE) next[i - W] = FIRE;
        if (i < W * (H - 1) && grid[i + W] === TREE) next[i + W] = FIRE;
        if (x === W - 1) crossed = true;
      }
      const t = grid;
      grid = next;
      next = t;
      return burning;
    }

    return {
      plant: () => plant(),
      plantAndLight,
      igniteEdge,
      reset: () => plantAndLight(),
      resize() {
        const nw = Math.floor(api.w / (api.w < 760 ? 5 : 6));
        if (W && Math.abs(nw - W) < 3) return;
        alloc();
        plantAndLight();
      },
      onParam(k) {
        if (k === 'mode' || (k === 'density' && params.mode === 'single')) plant();
      },
      pointerDown(p) {
        this.paint(p);
      },
      pointerMove(p) {
        if (p.down && params.tool === 'cut') this.paint(p);
      },
      paint(p) {
        if (!W) return;
        const cx = Math.floor(p.x / cell), cy = Math.floor((p.y - 60) / cell);
        if (params.tool === 'light') {
          for (let y = -1; y <= 1; y++)
            for (let x = -1; x <= 1; x++) {
              const X = cx + x, Y = cy + y;
              if (X >= 0 && Y >= 0 && X < W && Y < H && grid[Y * W + X] === TREE) grid[Y * W + X] = FIRE;
            }
        } else
          for (let y = -2; y <= 2; y++)
            for (let x = -2; x <= 2; x++) {
              const X = cx + x, Y = cy + y;
              if (X >= 0 && Y >= 0 && X < W && Y < H && grid[Y * W + X] !== FIRE) grid[Y * W + X] = EMPTY;
            }
      },
      update(dt) {
        if (!W) return;
        dt = Math.min(dt, 0.05);
        fireT += dt;
        const stepEvery = 1 / 30;
        while (fireT > stepEvery) {
          fireT -= stepEvery;
          const burning = spread();
          if (params.mode === 'living') {
            if (currentFire && !burning) {
              sizes.set(currentFire.size, (sizes.get(currentFire.size) || 0) + 1);
              currentFire = null;
            }
            if (currentFire) currentFire.size += burning;
            // regrowth; ash and bare ground slowly fill in
            growT += 0.0011 * params.grow;
            const n = Math.floor(growT * W * H);
            growT -= n / (W * H);
            for (let k = 0; k < n; k++) {
              const i = Math.floor(Math.random() * W * H);
              if (grid[i] === EMPTY || grid[i] === ASH) grid[i] = NEW;
            }
            // lightning, but only when no fire is burning, so each fire can be counted
            if (!burning && Math.random() < 0.05) {
              const i = Math.floor(Math.random() * W * H);
              if (grid[i] === TREE || grid[i] === NEW) (grid[i] = FIRE), (currentFire = { size: 0 });
            }
            for (let i = 0; i < W * H; i++) if (grid[i] === NEW) grid[i] = TREE;
          }
        }
        if (api.frame % 6 === 0) {
          let t = 0, a = 0;
          for (let i = 0; i < W * H; i++) (t += grid[i] === TREE), (a += grid[i] === ASH);
          burnedNow = a;
          if (params.mode === 'living') {
            cover.push(t / (W * H));
            if (cover.length > 300) cover.shift();
          }
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#0b0d10';
        ctx.fillRect(0, 0, w, h);
        if (!W) return;
        const d = img.data, flick = api.frame;
        for (let i = 0, j = 0; i < W * H; i++, j += 4) {
          const c = grid[i], s = shade[i];
          if (c === TREE || c === NEW) (d[j] = 20 + s * 0.4), (d[j + 1] = 110 + s), (d[j + 2] = 50 + s * 0.3);
          else if (c === FIRE) {
            const f = (i * 7 + flick * 13) % 40;
            (d[j] = 255), (d[j + 1] = 120 + f * 3), (d[j + 2] = 30);
          } else if (c === ASH) (d[j] = 52), (d[j + 1] = 48), (d[j + 2] = 46);
          else (d[j] = 38 + s * 0.2), (d[j + 1] = 30 + s * 0.15), (d[j + 2] = 22);
          d[j + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 60, W * cell, H * cell);
        ctx.imageSmoothingEnabled = true;
        if (api.thumbnail) return;
        // panel: share burnt vs density, or (living forest) the tree cover over time
        if (w >= 760) this.panel(w);
        const burning = grid.some((c) => c === FIRE);
        const msg = params.mode === 'living'
          ? `tree cover ${Math.round((cover.at(-1) || 0) * 100)} %  ·  threshold 59 %`
          : `${Math.round((burnedNow / Math.max(1, initialTrees)) * 100)} % of trees burnt${crossed ? '  ·  crossed the forest' : burning ? '' : '  ·  fire out'}`;
        tag(ctx, msg, w - 16, 84, crossed ? C.red : C.amber, { align: 'right', size: 12 });
      },
      panel(w) {
        const bw = 250, bh = 160, x0 = w - bw - 16, y0 = 108;
        ctx.fillStyle = 'rgba(8,11,22,0.86)';
        ctx.strokeStyle = 'rgba(160,175,230,0.25)';
        roundRect(ctx, x0, y0, bw, bh, 12);
        ctx.fill();
        ctx.stroke();
        const gx0 = x0 + 34, gx1 = x0 + bw - 14, gy0 = y0 + 30, gy1 = y0 + bh - 26;
        ctx.strokeStyle = 'rgba(233,237,247,0.3)';
        ctx.beginPath();
        ctx.moveTo(gx0, gy0);
        ctx.lineTo(gx0, gy1);
        ctx.lineTo(gx1, gy1);
        ctx.stroke();
        if (params.mode === 'living') {
          text(ctx, 'Tree cover over time', x0 + 12, y0 + 15, { size: 11, color: C.dim, shadow: false });
          const Y = (c) => gy1 - (c / 0.9) * (gy1 - gy0);
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(255,77,109,0.6)';
          ctx.beginPath();
          ctx.moveTo(gx0, Y(PC));
          ctx.lineTo(gx1, Y(PC));
          ctx.stroke();
          ctx.setLineDash([]);
          text(ctx, '59 %', gx0 - 6, Y(PC), { size: 9, align: 'right', color: C.red, shadow: false });
          ctx.strokeStyle = '#4fd27a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          cover.forEach((c, i) => (i ? ctx.lineTo(gx0 + (i / 300) * (gx1 - gx0), Y(c)) : ctx.moveTo(gx0, Y(c))));
          ctx.stroke();
          ctx.lineWidth = 1;
          return;
        }
        text(ctx, 'Share of forest burnt vs tree cover', x0 + 12, y0 + 15, { size: 11, color: C.dim, shadow: false });
        const X = (p) => gx0 + ((p - 0.3) / 0.6) * (gx1 - gx0), Y = (f) => gy1 - f * (gy1 - gy0);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255,77,109,0.6)';
        ctx.beginPath();
        ctx.moveTo(X(PC), gy0);
        ctx.lineTo(X(PC), gy1);
        ctx.stroke();
        ctx.setLineDash([]);
        if (curve) {
          ctx.strokeStyle = C.amber;
          ctx.lineWidth = 2;
          ctx.beginPath();
          curve.forEach(([p, f], i) => (i ? ctx.lineTo(X(p), Y(f)) : ctx.moveTo(X(p), Y(f))));
          ctx.stroke();
          ctx.lineWidth = 1;
        }
        for (const p of [0.3, 0.6, 0.9]) text(ctx, `${Math.round(p * 100)}%`, X(p), gy1 + 11, { size: 9, align: 'center', color: C.dim, shadow: false });
        text(ctx, '100%', gx0 - 5, gy0, { size: 9, align: 'right', color: C.dim, shadow: false });
        text(ctx, '0', gx0 - 5, gy1, { size: 9, align: 'right', color: C.dim, shadow: false });
        const pd = clamp(params.density, 0.3, 0.9);
        const f = curve ? curve.reduce((b, c) => (Math.abs(c[0] - pd) < Math.abs(b[0] - pd) ? c : b))[1] : 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(X(pd), Y(f), 4, 0, Math.PI * 2);
        ctx.fill();
      },
      stats() {
        let trees = 0, fire = 0;
        for (let i = 0; i < W * H; i++) (trees += grid[i] === TREE), (fire += grid[i] === FIRE);
        const total = [...sizes.values()].reduce((a, b) => a + b, 0), big = [...sizes.entries()].filter(([s]) => s > W * H * 0.05).reduce((a, [, n]) => a + n, 0);
        return params.mode === 'living'
          ? [
              { label: 'Tree cover', value: `${Math.round((trees / (W * H)) * 100)} %`, color: C.lime },
              { label: 'Fires so far', value: String(total) },
              { label: 'Big fires (> 5 % of forest)', value: String(big), color: C.red },
              { label: 'Burning now', value: String(fire), color: C.orange },
            ]
          : [
              { label: 'Tree cover planted', value: `${Math.round(params.density * 100)} %`, color: C.lime },
              { label: 'Trees burnt', value: `${Math.round((burnedNow / Math.max(1, initialTrees)) * 100)} %`, color: C.orange },
              { label: 'Fire crossed the forest?', value: crossed ? 'yes' : fire ? 'not yet' : 'no', color: crossed ? C.red : C.teal },
              { label: 'Burning now', value: String(fire) },
            ];
      },
    };
  },
};
