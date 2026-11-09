import { C, clamp, rgba, text, tag, backdrop, roundRect } from '../../core/util.js';

// Convolution, the core of a CNN. A 3×3 kernel of weights slides across a 28×28 image; at each
// spot the nine pixel values are multiplied by the nine weights and added up (zero padding at the
// edges keeps the output 28×28). ReLU clips negatives to zero; 2×2 max pooling keeps the strongest
// response in each block and halves the size. Everything is computed on the real pixel values.

const N = 28;
const KERNELS = {
  vertical: { name: 'Vertical edges', k: [-1, 0, 1, -2, 0, 2, -1, 0, 1], scale: 4 },
  horizontal: { name: 'Horizontal edges', k: [-1, -2, -1, 0, 0, 0, 1, 2, 1], scale: 4 },
  diagonal: { name: 'Diagonal edges', k: [0, 1, 2, -1, 0, 1, -2, -1, 0], scale: 4 },
  blur: { name: 'Blur', k: [1, 1, 1, 1, 1, 1, 1, 1, 1].map((v) => v / 9), scale: 1 },
  outline: { name: 'Outline', k: [-1, -1, -1, -1, 8, -1, -1, -1, -1], scale: 5 },
};
const BANK = [
  { key: 'vertical', label: '│ vertical' },
  { key: 'horizontal', label: '─ horizontal' },
  { key: 'diagonal', label: '╱ diagonal' },
  { key: 'anti', label: '╲ diagonal', k: [2, 1, 0, 1, 0, -1, 0, -1, -2] },
];

function makeImage(kind) {
  const img = new Float32Array(N * N);
  if (kind === 'draw' || typeof document === 'undefined') return img;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, N, N);
  g.fillStyle = g.strokeStyle = '#fff';
  if (kind === 'shapes') {
    g.fillRect(3, 4, 9, 9);
    g.beginPath();
    g.arc(20, 8.5, 5, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(5, 24);
    g.lineTo(23, 24);
    g.lineTo(14, 15);
    g.closePath();
    g.fill();
  } else {
    g.font = `bold ${kind === 'H' ? 22 : 24}px Arial, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(kind === 'H' ? 'H' : '7', 14, 15);
  }
  const d = g.getImageData(0, 0, N, N).data;
  for (let i = 0; i < N * N; i++) img[i] = d[i * 4] / 255;
  return img;
}

function conv(img, k) {
  const out = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let s = 0;
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const X = x + i, Y = y + j;
          if (X >= 0 && Y >= 0 && X < N && Y < N) s += img[Y * N + X] * k[(j + 1) * 3 + i + 1];
        }
      out[y * N + x] = s;
    }
  return out;
}

function pool(map, n, relu) {
  const m = n / 2, out = new Float32Array(m * m);
  for (let y = 0; y < m; y++)
    for (let x = 0; x < m; x++) {
      let best = -Infinity;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) best = Math.max(best, map[(y * 2 + j) * n + x * 2 + i]);
      out[y * m + x] = relu ? Math.max(0, best) : best;
    }
  return out;
}

export default {
  id: 'cnn',
  title: 'How a Computer Sees: Convolution',
  category: 'ai',
  tagline: 'Slide a 3×3 filter across an image and watch it pick out edges, the first step of computer vision.',
  ages: ['14-16', '16+'],
  topics: ['Machine learning', 'Computer vision'],
  keywords: ['cnn', 'convolutional neural network', 'convolution', 'kernel', 'filter', 'edge detection', 'sobel', 'relu', 'max pooling', 'feature map', 'computer vision', 'image recognition', 'mnist'],
  blurb:
    'Image-recognition networks don’t look at a picture all at once. A <b>convolutional neural network</b> slides small grids of weights, called <b>filters</b> or kernels, across the image. Each position gives one number: the nine pixels under the filter multiplied by its nine weights and added up. Different filters light up different features, such as vertical or horizontal edges. Here you can watch the arithmetic happen pixel by pixel, and draw your own image.',
  ideas: [
    'A greyscale image is just a grid of brightness numbers.',
    'A <b>filter</b> slides across the image; at each spot it computes Σ pixel × weight.',
    'The output, a <b>feature map</b>, is bright wherever the image matches the filter’s pattern.',
    '<b>ReLU</b> keeps only positive responses; <b>max pooling</b> shrinks the map and keeps the strongest ones.',
    'A real CNN <b>learns</b> its filter weights from examples, layer after layer, from edges to whole objects.',
  ],
  hint: 'Draw on the input image · right-click or Shift to erase',
  renderScale: 1,
  thumbChapter: 1,
  thumbFrames: 300,
  params: [
    { key: 'image', label: 'Image', type: 'select', value: 'H', options: [{ value: 'H', label: 'Letter H' }, { value: '7', label: 'Digit 7' }, { value: 'shapes', label: 'Shapes' }, { value: 'draw', label: 'Draw' }] },
    {
      key: 'filter', label: 'Filter', type: 'select', value: 'vertical',
      options: [{ value: 'vertical', label: '│ Vertical' }, { value: 'horizontal', label: '─ Horizontal' }, { value: 'diagonal', label: '╱ Diagonal' }, { value: 'blur', label: 'Blur' }, { value: 'outline', label: 'Outline' }],
    },
    { key: 'relu', label: 'ReLU (drop negatives)', type: 'toggle', value: false },
    { key: 'pool', label: '2×2 max pooling', type: 'toggle', value: false },
    { key: 'bank', label: 'Show a bank of 4 filters', type: 'toggle', value: false },
    { key: 'speed', label: 'Scan speed', type: 'range', min: 20, max: 800, step: 10, value: 140, unit: ' px/s' },
    { key: 'rescan', label: 'Scan again', type: 'button', action: (sim) => sim.rescan() },
    { key: 'clear', label: 'Clear the image', type: 'button', action: (sim) => sim.clear() },
  ],
  story: [
    {
      title: 'A picture is a grid of numbers',
      text: 'To a computer this “7” is <b>28 × 28 = 784</b> brightness values from 0 (black) to 1 (white), the same size as the famous MNIST handwritten digits. The small 3×3 grid in the middle is a <b>filter</b>: nine weights. This one, all 1/9, simply averages each pixel with its neighbours, so the output is a blurred copy.',
      params: { image: '7', filter: 'blur', relu: false, pool: false, bank: false, speed: 140 },
      enter: (s) => s.rescan(),
      duration: 13,
    },
    {
      title: 'Slide, multiply, add',
      text: 'Now a <b>vertical-edge</b> filter: −1s on the left, +1s on the right. At every spot, the nine pixels are multiplied by the nine weights and added. Where dark meets bright (left to right) the sum is large and <b>orange</b>; bright to dark gives <b>blue</b>; flat areas give zero. The upright bars of the H light up.',
      formula: 'output = Σ pixel × weight',
      params: { image: 'H', filter: 'vertical', relu: false, pool: false, bank: false, speed: 140 },
      enter: (s) => s.rescan(),
      duration: 16,
    },
    {
      title: 'A different filter finds different things',
      text: 'Turn the same weights sideways and you get a <b>horizontal-edge</b> filter. Now the uprights go dark and the crossbar and the ends of the bars light up. Each filter is a detector for one small pattern.',
      check: {
        q: 'A horizontal-edge filter scans the letter H. Which part responds most?',
        options: ['The two upright bars', 'The crossbar and the bar ends', 'Every part equally'],
        answer: 1,
        setup: { image: 'H', filter: 'horizontal', relu: false, pool: false, bank: false },
        explain: 'A horizontal-edge filter responds where brightness changes from top to bottom. That happens above and below the crossbar and at the top and bottom of each bar, not along the sides of the uprights.',
      },
      params: { image: 'H', filter: 'horizontal', relu: false, pool: false, bank: false, speed: 160 },
      enter: (s) => s.rescan(),
      duration: 14,
    },
    {
      title: 'ReLU and pooling',
      text: 'Two simple steps follow each filter. <b>ReLU</b> sets negative values to zero, keeping only “yes, this pattern is here”. <b>Max pooling</b> takes each 2×2 block and keeps its biggest value, halving the map to 14×14. The network keeps the strongest evidence, uses a quarter of the numbers, and cares less about exactly where a feature sits.',
      formula: 'ReLU(x) = max(0, x)',
      params: { image: '7', filter: 'diagonal', relu: true, pool: true, bank: false, speed: 260 },
      enter: (s) => s.rescan(),
      duration: 16,
    },
    {
      title: 'A layer is a bank of filters',
      text: 'One layer runs many filters side by side. Here four edge detectors, each followed by ReLU and pooling, turn the shapes into four maps. The next layer slides its filters across <em>all</em> of these maps at once, combining edges into corners and curves; deeper layers find loops, eyes, wheels and, eventually, whole objects.',
      params: { image: 'shapes', filter: 'vertical', relu: true, pool: false, bank: true, speed: 400 },
      enter: (s) => s.rescan(),
      duration: 17,
    },
    {
      title: 'Learned, not designed',
      text: 'We typed these weights in by hand. A real CNN starts with <b>random</b> filters and adjusts them by back-propagation over millions of examples. Remarkably, the first-layer filters it learns look a lot like these edge detectors. In 2012 a CNN called <b>AlexNet</b> won the ImageNet contest by a huge margin and started the deep-learning boom.',
      check: {
        q: 'In a real image-recognition network, where do the filter weights come from?',
        options: ['Engineers design each one', 'They are learned from labelled examples', 'They are copied from the camera'],
        answer: 1,
        setup: { image: '7', filter: 'outline', relu: false, pool: false, bank: true },
        explain: 'The filters start random and are adjusted, like every other weight, by gradient descent and back-propagation. Nobody tells the network to look for edges; edge detectors simply turn out to be useful.',
      },
      params: { image: '7', filter: 'outline', relu: false, pool: false, bank: true, speed: 400 },
      enter: (s) => s.rescan(),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Draw on the input grid (right-click or hold Shift to erase) and the feature maps update instantly. Try a sloping line with each filter, and hover over a map to see the arithmetic at that spot.',
      params: { image: 'draw', filter: 'diagonal', relu: false, pool: false, bank: true, speed: 140 },
      enter: (s) => s.rescan(true),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params, pointer } = api;
    let img = makeImage(params.image), out, bank = [], scan = 0, L = {}, hover = -1, painting = false;
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');

    const kernel = () => KERNELS[params.filter] || KERNELS.vertical;
    function compute() {
      out = conv(img, kernel().k);
      bank = BANK.map((b) => pool(conv(img, b.k || KERNELS[b.key].k), N, true));
    }
    function rescan(done = false) {
      compute();
      scan = done ? N * N : 0;
    }
    compute();

    function blit(vals, n, x, y, size, mode, scale, upto = n * n) {
      off.width = off.height = n;
      const im = octx.createImageData(n, n), d = im.data;
      for (let i = 0; i < n * n; i++) {
        const v = i < upto ? vals[i] : 0;
        const k = i * 4;
        if (mode === 'grey') d[k] = d[k + 1] = d[k + 2] = 12 + 243 * clamp(v, 0, 1);
        else {
          const t = clamp(v / scale, -1, 1);
          if (i >= upto) (d[k] = 14), (d[k + 1] = 18), (d[k + 2] = 34);
          else if (t >= 0) (d[k] = 14 + 241 * t), (d[k + 1] = 18 + 163 * t), (d[k + 2] = 34 + 37 * t);
          else (d[k] = 14 - 77 * t), (d[k + 1] = 18 - 122 * t), (d[k + 2] = 34 + 221 * -t);
        }
        d[k + 3] = 255;
      }
      octx.putImageData(im, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, x, y, size, size);
      ctx.imageSmoothingEnabled = true;
      ctx.strokeStyle = rgba('#a0afe6', 0.35);
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }

    function cellAt(p, box, n) {
      const i = Math.floor(((p.x - box.x) / box.s) * n), j = Math.floor(((p.y - box.y) / box.s) * n);
      return i >= 0 && j >= 0 && i < n && j < n ? [i, j] : null;
    }
    function paint(p) {
      const c = cellAt(p, L.inp, N);
      if (!c) return;
      const fx = ((p.x - L.inp.x) / L.inp.s) * N, fy = ((p.y - L.inp.y) / L.inp.s) * N;
      const erase = p.button === 2 || p.shift;
      for (let j = c[1] - 2; j <= c[1] + 2; j++)
        for (let i = c[0] - 2; i <= c[0] + 2; i++) {
          if (i < 0 || j < 0 || i >= N || j >= N) continue;
          const d = Math.hypot(i + 0.5 - fx, j + 0.5 - fy);
          const a = clamp(1.6 - d, 0, 1);
          img[j * N + i] = erase ? Math.min(img[j * N + i], 1 - a) : Math.max(img[j * N + i], a);
        }
      rescan(true);
    }

    return {
      rescan(blank = false) {
        if (blank) img = makeImage('draw');
        rescan();
      },
      clear() {
        img = makeImage('draw');
        rescan(true);
      },
      resize(w, h) {
        const narrow = w < 700;
        if (narrow) {
          const S = Math.min((w - 32 - 26) / 2, 190);
          const y0 = 104;
          L = { narrow, inp: { x: 16, y: y0, s: S }, outp: { x: w - 16 - S, y: y0, s: S }, cell: 30, kx: w / 2 - 45, ky: y0 + S + 34, bankY: y0 + S + 34 + 90 + 40, bankS: (w - 32 - 3 * 10) / 4, bankX: 16 };
        } else {
          // the image row runs full width above the story card; the filter bank sits under the output
          const x0 = 40, avail = w - 80;
          const S = clamp(Math.min((avail - 200) / 2, (h - 220) / 2, 340), 110, 340);
          const gap = avail - 2 * S;
          const cell = clamp(gap / 4.2, 30, 46);
          L = { narrow, inp: { x: x0, y: 96, s: S }, outp: { x: w - 40 - S, y: 96, s: S }, cell, kx: x0 + S + gap / 2 - cell * 1.5, ky: 96 + S / 2 - cell * 1.5 - 14, bankY: 96 + S + 48, bankS: (S - 14) / 2, bankX: w - 40 - S, grid2: true };
        }
      },
      onParam(k) {
        if (k === 'image') {
          img = makeImage(params.image);
          rescan();
        }
        if (k === 'filter') rescan();
      },
      pointerDown(p) {
        if (cellAt(p, L.inp, N)) (painting = true), paint(p);
      },
      pointerMove(p) {
        if (painting && p.down) paint(p);
      },
      pointerUp() {
        painting = false;
      },
      update(dt) {
        if (scan < N * N) scan = Math.min(N * N, scan + params.speed * dt);
        hover = -1;
        if (pointer.inside && scan >= N * N) {
          const n = params.pool ? N / 2 : N;
          const c = cellAt(pointer, L.inp, N) || (params.pool ? null : cellAt(pointer, L.outp, n));
          if (c) hover = c[1] * N + c[0];
          else if (params.pool) {
            const q = cellAt(pointer, L.outp, n);
            if (q) hover = q[1] * 2 * N + q[0] * 2;
          }
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const K = kernel();
        const done = Math.floor(scan);
        const cur = scan < N * N ? done : hover;
        // input
        const { inp, outp } = L;
        blit(img, N, inp.x, inp.y, inp.s, 'grey');
        if (inp.s / N >= 6) {
          ctx.strokeStyle = 'rgba(140,160,220,0.08)';
          ctx.beginPath();
          for (let i = 1; i < N; i++) {
            const t = (i / N) * inp.s;
            ctx.moveTo(inp.x + t, inp.y);
            ctx.lineTo(inp.x + t, inp.y + inp.s);
            ctx.moveTo(inp.x, inp.y + t);
            ctx.lineTo(inp.x + inp.s, inp.y + t);
          }
          ctx.stroke();
        }
        // output (feature map, optionally ReLU / pooled)
        const shown = params.relu ? out.map((v) => Math.max(0, v)) : out;
        if (params.pool) {
          const masked = shown.map((v, i) => (i < done ? v : 0));
          const pooled = pool(masked, N, params.relu);
          blit(pooled, N / 2, outp.x, outp.y, outp.s, 'div', K.scale);
        } else blit(shown, N, outp.x, outp.y, outp.s, 'div', K.scale, done);
        const lbl = (s, x, y, col = C.dim) => tag(ctx, s, x, y, col, { align: 'center' });
        lbl(`Input ${N}×${N}`, inp.x + inp.s / 2, inp.y - 16);
        lbl(params.pool ? 'Pooled 14×14' : `Feature map ${N}×${N}`, outp.x + outp.s / 2, outp.y - 16, C.amber);
        // kernel
        const cs = L.cell, kx = L.kx, ky = L.ky;
        const cx = cur >= 0 ? cur % N : -1, cy = cur >= 0 ? Math.floor(cur / N) : -1;
        let sum = 0;
        for (let j = 0; j < 3; j++)
          for (let i = 0; i < 3; i++) {
            const wv = K.k[j * 3 + i];
            const X = cx + i - 1, Y = cy + j - 1;
            const pv = cur >= 0 && X >= 0 && Y >= 0 && X < N && Y < N ? img[Y * N + X] : 0;
            sum += pv * wv;
            const x = kx + i * cs, y = ky + j * cs;
            const t = clamp(wv / (params.filter === 'blur' ? 0.2 : 2), -1, 1);
            ctx.fillStyle = t >= 0 ? rgba(C.amber, 0.12 + 0.5 * t) : rgba(C.blue, 0.12 - 0.5 * t);
            roundRect(ctx, x + 1, y + 1, cs - 2, cs - 2, 5);
            ctx.fill();
            const wl = params.filter === 'blur' ? '1/9' : String(wv);
            text(ctx, wl, x + cs / 2, y + cs / 2 - (cur >= 0 ? 5 : 0), { size: cs > 36 ? 15 : 13, weight: 700, align: 'center', mono: true });
            if (cur >= 0) text(ctx, `×${pv.toFixed(1)}`, x + cs / 2, y + cs / 2 + 11, { size: 10, align: 'center', mono: true, color: C.dim });
          }
        lbl(K.name, kx + cs * 1.5, ky - 16, C.cyan);
        if (cur >= 0) {
          const v = params.relu ? Math.max(0, sum) : sum;
          text(ctx, `sum = ${sum.toFixed(2)}${params.relu && sum < 0 ? ' → 0' : ''}`, kx + cs * 1.5, ky + cs * 3 + 16, { size: 13, align: 'center', mono: true, color: v > 0.05 ? C.amber : v < -0.05 ? C.blue : C.ink });
          // window on the input, pixel on the output
          const c = inp.s / N;
          ctx.strokeStyle = C.cyan;
          ctx.lineWidth = 2;
          ctx.strokeRect(inp.x + (cx - 1) * c, inp.y + (cy - 1) * c, c * 3, c * 3);
          const n = params.pool ? N / 2 : N, oc = outp.s / n;
          const ox = outp.x + (params.pool ? Math.floor(cx / 2) : cx) * oc, oy = outp.y + (params.pool ? Math.floor(cy / 2) : cy) * oc;
          ctx.strokeStyle = C.white;
          ctx.strokeRect(ox, oy, oc, oc);
          if (!L.narrow) {
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = rgba(C.cyan, 0.4);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(inp.x + (cx + 2) * c, inp.y + (cy - 1) * c);
            ctx.lineTo(kx, ky);
            ctx.moveTo(inp.x + (cx + 2) * c, inp.y + (cy + 2) * c);
            ctx.lineTo(kx, ky + cs * 3);
            ctx.moveTo(kx + cs * 3, ky + cs * 1.5);
            ctx.lineTo(ox + oc / 2, oy + oc / 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
        // bank of filters (ReLU + pool each)
        if (params.bank) {
          const s = L.bankS, gap = L.narrow ? 10 : 18;
          BANK.forEach((b, i) => {
            const x = L.bankX + (L.grid2 ? (i % 2) * (s + 14) : i * (s + gap));
            const y = L.bankY + (L.grid2 ? Math.floor(i / 2) * (s + 30) : 0);
            blit(bank[i], N / 2, x, y, s, 'div', 4);
            text(ctx, b.label, x + s / 2, y + s + 13, { size: 11, align: 'center', color: C.dim });
          });
          if (!api.thumbnail) text(ctx, L.grid2 ? 'Layer 1: four filters + ReLU + pooling' : 'Layer 1: four filters, each with ReLU + 2×2 pooling', L.bankX, L.bankY - 16, { size: 12, color: C.violet, weight: 600 });
        }
      },
      stats() {
        let mx = 0;
        for (const v of out) mx = Math.max(mx, params.relu ? v : Math.abs(v));
        const n = params.pool ? 14 : 28;
        return [
          { label: 'Filter', value: kernel().name, color: C.cyan },
          { label: 'Output size', value: `${n} × ${n}` },
          { label: 'Strongest response', value: mx.toFixed(2) },
          { label: 'Multiply-adds per map', value: (N * N * 9).toLocaleString('en') },
        ];
      },
    };
  },
};
