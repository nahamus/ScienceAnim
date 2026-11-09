import { C, TAU, clamp, rgba, text, tag, backdrop } from '../../core/util.js';

// The Bak–Tang–Wiesenfeld sandpile (1987). Grains land on a grid; any square holding 4 or more
// topples, sending one grain to each of its four neighbours (grains off the edge are lost). One
// grain can set off a chain of topplings: an avalanche. With no tuning at all the pile organises
// itself into a critical state where avalanche sizes follow a power law.

const COLORS = [[8, 10, 24], [40, 70, 170], [46, 200, 166], [255, 181, 71]];

export default {
  id: 'sandpile',
  title: 'Sandpile Avalanches: Self-Organised Criticality',
  category: 'physics',
  tagline: 'Drop sand one grain at a time. The pile tunes itself to the edge of collapse.',
  ages: ['14-16', '16+'],
  topics: ['Complex systems', 'Emergence'],
  keywords: ['sandpile', 'self-organized criticality', 'soc', 'bak tang wiesenfeld', 'avalanche', 'power law', 'abelian sandpile', 'earthquakes', 'gutenberg richter', 'fractal'],
  blurb:
    'Add sand grain by grain and the pile grows until it can’t: then a single grain may trigger a slide of any size, from one grain to half the pile. Per Bak and colleagues found that this needs no fine-tuning. The pile drives itself to a critical state, where avalanches follow a power law, the same statistics as earthquakes, solar flares and bursts of activity in the brain.',
  ideas: [
    'Rule: a square with <b>4 grains topples</b>, giving one to each neighbour, which may topple in turn.',
    'The pile settles into a <b>critical state</b> without anyone tuning it: <b>self-organised criticality</b>.',
    'Avalanche sizes follow a <b>power law</b>: no typical size, just a straight line on log–log axes.',
    'Small avalanches are common and huge ones rare, but <b>never rare enough to ignore</b>, like earthquakes.',
    'Pouring grains on one spot grows an intricate <b>fractal</b> from the same simple rule.',
  ],
  hint: 'Tap or drag to drop grains by hand',
  renderScale: 1,
  thumbChapter: 0,
  thumbFrames: 240,
  params: [
    { key: 'drop', label: 'Where grains land', type: 'select', value: 'random', options: [
      { value: 'random', label: 'Random' }, { value: 'center', label: 'Centre' }, { value: 'hand', label: 'By hand' },
    ] },
    { key: 'rate', label: 'Grains per second', type: 'range', min: 1, max: 3000, step: 1, value: 200 },
    { key: 'slow', label: 'Slow-motion avalanches', type: 'toggle', value: false },
    { key: 'size', label: 'Grid', type: 'select', value: '101', instant: true, options: [
      { value: '65', label: '65²' }, { value: '101', label: '101²' }, { value: '161', label: '161²' },
    ] },
    { key: 'empty', label: 'Empty the table', type: 'button', action: (sim) => sim.clear() },
    { key: 'prime', label: 'Jump to the critical state', type: 'button', action: (sim) => sim.prime() },
  ],
  story: [
    {
      title: 'Grain by grain',
      text: 'One rule: when a square holds <b>4 grains</b> it <b>topples</b>, passing one grain to each neighbour. Pour sand onto the centre and that rule alone grows this intricate, four-fold <b>fractal</b>. Colours show 0, 1, 2 and 3 grains.',
      params: { drop: 'center', rate: 700, slow: false },
      enter: (s) => s.clear(),
      duration: 14,
    },
    {
      title: 'Random rain',
      text: 'Now grains fall at random spots. At first nothing much happens: squares fill up quietly and an occasional grain causes a small slide (flashing white). The table is slowly getting fuller.',
      params: { drop: 'random', rate: 300, slow: false },
      enter: (s) => s.clear(),
      duration: 13,
    },
    {
      title: 'The critical state',
      text: 'Eventually the pile stops growing: on average grains leave over the edges as fast as they arrive. Now it is <b>critical</b>. Watch in slow motion: most grains do nothing or topple a few squares, but now and then one sets off a cascade that sweeps across the table.',
      check: {
        q: 'The pile is critical. You add one more grain. How big will the avalanche be?',
        options: ['Always tiny', 'Always huge', 'Usually tiny, occasionally enormous'],
        answer: 2,
        setup: { drop: 'random', slow: true, rate: 6 },
        explain: 'There is no typical size. Most grains cause small slides, but avalanches of every size up to the whole table keep happening, with steadily falling odds.',
      },
      params: { drop: 'random', slow: true, rate: 6 },
      enter: (s) => s.prime(),
      duration: 18,
    },
    {
      title: 'A power law',
      text: 'Count thousands of avalanches by size. On ordinary axes they’d hug zero, but on <b>log–log</b> axes they fall on a <b>straight line</b>: a power law. Ten times bigger avalanches are a fixed factor rarer, at every scale, up to the size of the table.',
      formula: 'P(size s) ∝ s^−τ',
      params: { drop: 'random', slow: false, rate: 1500 },
      enter: (s) => (s.prime(), s.clearStats()),
      duration: 16,
    },
    {
      title: 'Nobody tuned it',
      text: 'A magnet is only critical at one exact temperature. The sandpile finds its critical point <b>by itself</b>, which is why Bak, Tang and Wiesenfeld (1987) thought it might explain the power laws seen all over nature: <b>earthquake</b> sizes (the Gutenberg–Richter law), solar flares, forest fires and cascades of firing neurons.',
      params: { drop: 'random', slow: true, rate: 10 },
      enter: (s) => s.primeIfEmpty(),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Drop grains by hand on a critical pile, switch slow motion on and off, or pour onto the centre of an empty table.',
      params: { drop: 'hand', slow: true, rate: 10 },
      enter: (s) => s.primeIfEmpty(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let N, hgt, flash, off, octx, img, layout = null;
    let acc = 0, grains = 0, lost = 0, current = null, last = 0, biggest = 0, quiet = 0;
    let hist = new Float64Array(24), waveAcc = 0;

    function alloc() {
      N = +params.size;
      hgt = new Int32Array(N * N);
      flash = new Float32Array(N * N);
      off = document.createElement('canvas');
      off.width = off.height = N;
      octx = off.getContext('2d');
      img = octx.createImageData(N, N);
      for (let i = 0; i < N * N; i++) img.data[i * 4 + 3] = 255;
    }

    function topple(i, t, stack) {
      hgt[i] -= 4 * t;
      // fainter flashes when grains pour in fast, or the whole table would glow white
      if (params.drop !== 'center') flash[i] = params.slow ? 1 : clamp(40 / params.rate, 0.12, 1);
      const x = i % N, y = (i / N) | 0;
      const nb = [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, y > 0 ? i - N : -1, y < N - 1 ? i + N : -1];
      for (const n of nb) {
        if (n < 0) {
          lost += t;
          continue;
        }
        hgt[n] += t;
        if (stack && hgt[n] >= 4) stack.push(n);
      }
    }

    /** Topple everything right away; returns the number of topplings. */
    function relax(start) {
      const stack = [start];
      let count = 0;
      while (stack.length) {
        const i = stack.pop();
        if (hgt[i] < 4) continue;
        const t = hgt[i] >> 2;
        count += t;
        topple(i, t, stack);
        if (hgt[i] >= 4) stack.push(i);
      }
      return count;
    }

    function record(size) {
      last = size;
      if (!size) return void quiet++;
      biggest = Math.max(biggest, size);
      hist[Math.min(hist.length - 1, Math.floor(Math.log2(size)))]++;
    }

    function addGrain(i, n = 1) {
      hgt[i] += n;
      grains += n;
      if (params.slow) {
        current = { size: 0, active: hgt[i] >= 4 ? [i] : [] };
        if (!current.active.length) {
          record(0);
          current = null;
        }
      } else {
        const s = relax(i);
        if (params.drop !== 'center') record(s);
      }
    }

    /** One wave of a slow-motion avalanche: every unstable square topples once. */
    function wave() {
      const next = [];
      for (const i of current.active) {
        if (hgt[i] < 4) continue;
        current.size++;
        topple(i, 1, null);
      }
      // the squares that are now unstable: the toppled ones and their neighbours
      const seen = new Set();
      for (const i of current.active)
        for (const j of [i, i - 1, i + 1, i - N, i + N])
          if (j >= 0 && j < N * N && !seen.has(j) && hgt[j] >= 4) seen.add(j), next.push(j);
      current.active = next;
      if (!next.length) {
        record(current.size);
        current = null;
      }
    }

    const sim = {
      clear() {
        if (+params.size !== N) alloc();
        hgt.fill(0);
        flash.fill(0);
        grains = lost = 0;
        current = null;
        sim.clearStats();
      },
      clearStats() {
        hist = new Float64Array(24);
        biggest = quiet = last = 0;
      },
      /** Skip ahead: rain grains until the pile has organised itself into the critical state. */
      prime() {
        if (+params.size !== N) alloc();
        for (let i = 0; i < N * N; i++) hgt[i] = Math.random() < 0.85 ? 2 + ((Math.random() * 2) | 0) : (Math.random() * 2) | 0;
        current = null;
        for (let k = 0; k < N * N * 0.6; k++) {
          const i = (Math.random() * N * N) | 0;
          hgt[i]++;
          relax(i);
        }
        flash.fill(0);
        sim.clearStats();
      },
      /** Opened straight at a later chapter: start from a critical pile, not an empty table. */
      primeIfEmpty() {
        let sum = 0;
        for (let i = 0; i < N * N; i++) sum += hgt[i];
        if (sum < N * N) sim.prime();
      },
      onParam(k) {
        if (k === 'size') sim.clear();
        if (k === 'slow' && !params.slow && current) {
          for (const i of current.active) current.size += relax(i);
          record(current.size);
          current = null;
        }
      },
      pointerDown(p) {
        sim.handDrop(p);
      },
      pointerMove(p) {
        if (p.down) sim.handDrop(p);
      },
      handDrop(p) {
        if (!layout || current) return;
        const { x0, y0, size } = layout;
        const gx = Math.floor(((p.x - x0) / size) * N), gy = Math.floor(((p.y - y0) / size) * N);
        if (gx >= 0 && gy >= 0 && gx < N && gy < N) addGrain(gy * N + gx);
      },
      update(dt) {
        if (+params.size !== N) sim.clear();
        for (let i = 0; i < flash.length; i++) if (flash[i] > 0) flash[i] = Math.max(0, flash[i] - dt * 2.5);
        if (current) {
          waveAcc += dt * 40;
          let k = 0;
          while (waveAcc >= 1 && current && k++ < 4) {
            waveAcc--;
            wave();
          }
          return;
        }
        if (params.drop === 'hand') return;
        acc += dt * params.rate;
        if (params.drop === 'center') {
          const n = Math.floor(acc);
          acc -= n;
          if (n) addGrain(((N / 2) | 0) * N + ((N / 2) | 0), n);
          return;
        }
        let budget = 6000; // keep a frame affordable at high rates
        while (acc >= 1 && !current && budget-- > 0) {
          acc--;
          addGrain((Math.random() * N * N) | 0);
        }
        if (acc > 50) acc = 50;
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        if (+params.size !== N) sim.clear();
        const d = img.data;
        for (let i = 0; i < N * N; i++) {
          const c = COLORS[Math.min(3, hgt[i])];
          const f = flash[i];
          d[i * 4] = c[0] + (255 - c[0]) * f;
          d[i * 4 + 1] = c[1] + (255 - c[1]) * f;
          d[i * 4 + 2] = c[2] + (255 - c[2]) * f;
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
        if (current && current.size > 0) tag(ctx, `avalanche: ${current.size} topplings`, x0 + size / 2, y0 + size + 16, C.ink, { align: 'center' });
        else if (last > 0 && params.drop !== 'center') tag(ctx, `last avalanche: ${last} topplings`, x0 + size / 2, y0 + size + 16, C.dim, { align: 'center' });

        // legend
        const lx = narrow ? 24 : 64, ly = narrow ? y0 + size + 42 : y0 + size - 8;
        if (!narrow || ly < h - 20)
          ['0', '1', '2', '3'].forEach((lab, k) => {
            ctx.fillStyle = `rgb(${COLORS[k].join(',')})`;
            ctx.fillRect(lx + k * 46, ly - 6, 12, 12);
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.strokeRect(lx + k * 46 - 0.5, ly - 6.5, 13, 13);
            text(ctx, lab + (k === 0 ? ' grains' : ''), lx + k * 46 + 17, ly, { size: 10, color: C.dim });
          });

        // the avalanche-size histogram on log-log axes
        const box = narrow
          ? { x: 46, y: ly + 34, w: w - 70, h: Math.min(140, h - (ly + 34) - 30) }
          : { x: 64, y: 92, w: Math.max(160, x0 - 120), h: Math.min(200, h * 0.32) };
        if (box.h < 70 || params.drop === 'center') return;
        const total = hist.reduce((a, b) => a + b, 0);
        text(ctx, 'how often each avalanche size happens (log–log)', box.x, box.y - 12, { size: 11, color: C.dim });
        ctx.strokeStyle = 'rgba(160,175,230,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        const maxBin = Math.max(8, Math.ceil(Math.log2(N * N)));
        // frequency per unit size in each doubling bin, so a power law comes out straight
        const dens = Array.from(hist.slice(0, maxBin), (c, b) => (c ? c / 2 ** b : 0));
        const top = Math.log10(Math.max(...dens, 1e-9));
        const span = 7;
        const X = (b) => box.x + (b / maxBin) * box.w, Y = (v) => box.y + clamp((top - Math.log10(v)) / span, 0, 1) * box.h;
        for (let b = 0; b <= maxBin; b += Math.ceil(maxBin / 6)) text(ctx, b < 10 ? String(2 ** b) : `2^${b}`, X(b), box.y + box.h + 11, { size: 10, align: 'center', color: C.dim });
        text(ctx, 'avalanche size (topplings)', box.x + box.w, box.y + box.h + 25, { size: 10, align: 'right', color: C.dim });
        if (total < 20) {
          text(ctx, 'collecting avalanches…', box.x + box.w / 2, box.y + box.h / 2, { size: 11, align: 'center', color: C.dim });
          return;
        }
        ctx.fillStyle = C.amber;
        let prev = null;
        ctx.strokeStyle = rgba(C.amber, 0.6);
        ctx.beginPath();
        dens.forEach((v, b) => {
          if (!v) return;
          const px = X(b + 0.5), py = Y(v);
          if (prev) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
          prev = [px, py];
        });
        ctx.stroke();
        dens.forEach((v, b) => {
          if (!v) return;
          ctx.beginPath();
          ctx.arc(X(b + 0.5), Y(v), 3.5, 0, TAU);
          ctx.fill();
        });
      },
      stats() {
        let sum = 0;
        for (let i = 0; i < N * N; i++) sum += hgt[i];
        const total = hist.reduce((a, b) => a + b, 0);
        return [
          { label: 'Grains dropped', value: grains.toLocaleString() },
          { label: 'Grains on the table (average per square)', value: (sum / (N * N)).toFixed(3), color: C.amber },
          { label: 'Avalanches recorded', value: total.toLocaleString() },
          { label: 'Grains that caused none', value: quiet.toLocaleString() },
          { label: 'Biggest avalanche', value: `${biggest.toLocaleString()} topplings`, color: C.teal },
          { label: 'Grains lost over the edge', value: lost.toLocaleString() },
        ];
      },
    };
    alloc();
    return sim;
  },
};
