import { C, backdrop, drawGlow, tag, TAU } from '../../core/util.js';

const NPTS = 300;

function resample(pts, n = NPTS) {
  // equal arc-length resampling of a closed polyline
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    seg.push(d);
    total += d;
  }
  const out = [];
  let i = 0, acc = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total;
    while (acc + seg[i] < target && i < pts.length - 1) acc += seg[i++];
    const t = seg[i] ? (target - acc) / seg[i] : 0;
    const a = pts[i], b = pts[(i + 1) % pts.length];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

const SHAPES = {
  heart: () => {
    const p = [];
    for (let i = 0; i < 400; i++) {
      const t = (i / 400) * TAU;
      p.push([16 * Math.sin(t) ** 3 / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17]);
    }
    return p;
  },
  star: () => {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? 0.42 : 1;
      p.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return p;
  },
  square: () => [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]],
  note: () => {
    // a stylised eighth note outline
    const p = [];
    for (let i = 0; i <= 30; i++) {
      const a = Math.PI * 0.1 + (i / 30) * Math.PI * 1.8;
      p.push([-0.35 + Math.cos(a) * 0.32, 0.55 + Math.sin(a) * 0.22]);
    }
    p.push([-0.06, 0.48], [-0.06, -0.85], [0.1, -0.85], [0.55, -0.45], [0.5, -0.3], [0.1, -0.55], [0.1, 0.55]);
    for (let i = 0; i <= 30; i++) {
      const a = Math.PI * 0.1 + (i / 30) * Math.PI * 1.8;
      p.push([-0.35 + Math.cos(-a + Math.PI * 2) * 0.2, 0.55 + Math.sin(-a + Math.PI * 2) * 0.12]);
    }
    return p;
  },
  infinity: () => {
    const p = [];
    for (let i = 0; i < 300; i++) {
      const t = (i / 300) * TAU;
      const d = 1 + Math.sin(t) ** 2;
      p.push([Math.cos(t) / d, (Math.sin(t) * Math.cos(t)) / d * 1.2]);
    }
    return p;
  },
};

function dft(pts) {
  const N = pts.length, out = [];
  for (let k = 0; k < N; k++) {
    const freq = k <= N / 2 ? k : k - N;
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const a = (-TAU * k * n) / N;
      const [x, y] = pts[n];
      re += x * Math.cos(a) - y * Math.sin(a);
      im += x * Math.sin(a) + y * Math.cos(a);
    }
    re /= N;
    im /= N;
    out.push({ freq, amp: Math.hypot(re, im), phase: Math.atan2(im, re) });
  }
  return out.sort((a, b) => b.amp - a.amp);
}

export default {
  id: 'fourier',
  title: 'Drawing with Circles',
  category: 'math',
  tagline: 'Spinning circles stacked on spinning circles can draw any shape. This is Fourier’s big idea.',
  blurb:
    'In 1807 Joseph Fourier claimed that any repeating pattern can be built from simple rotations. Chain enough spinning arrows tip-to-tail, each turning at a different speed, and the last tip will trace any drawing you like. The same maths compresses your music, photos and video.',
  ideas: [
    'Any closed curve can be broken into a sum of circular motions (a <b>Fourier series</b>).',
    'The biggest, slowest circles capture the overall shape; small, fast ones add detail.',
    'Sharp corners need many high-frequency terms, and leave a little overshoot (the <b>Gibbs phenomenon</b>).',
    'JPEG and MP3 work by keeping the important frequencies and discarding the rest.',
  ],
  hint: 'Draw a closed shape with your mouse or finger',
  thumbChapter: 3,
  thumbFrames: 430,
  params: [
    {
      key: 'shape', label: 'Shape', type: 'select', value: 'heart',
      options: [
        { value: 'heart', label: 'Heart' },
        { value: 'star', label: 'Star' },
        { value: 'note', label: 'Note' },
        { value: 'infinity', label: 'Infinity' },
        { value: 'square', label: 'Square' },
      ],
    },
    { key: 'K', label: 'Number of circles', type: 'range', min: 1, max: 150, step: 1, value: 1 },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.05, max: 1, step: 0.01, value: 0.25 },
    { key: 'circles', label: 'Show circles', type: 'toggle', value: true },
    { key: 'target', label: 'Show target shape', type: 'toggle', value: false },
  ],
  story: [
    {
      title: 'One spinning arrow',
      text: 'An arrow rotating at a steady rate. Its tip traces a <b>circle</b>. Simple — but hold on.',
      params: { shape: 'heart', K: 1, target: false, circles: true, speed: 0.3 },
      duration: 8,
    },
    {
      title: 'Add another',
      text: 'Attach a second, smaller arrow to the tip of the first, spinning at a different speed. The combined tip now traces a more interesting curve.',
      params: { K: 2 },
      tween: 0,
      duration: 9,
    },
    {
      title: 'A handful of circles',
      text: 'Ten arrows, each with just the right size, speed and starting angle. A shape starts to emerge — a heart. Each circle adds one <b>frequency</b>.',
      formula: 'z(t) = Σ c<sub>n</sub> e<sup>i n t</sup>',
      params: { K: 10, target: true },
      tween: 0,
      duration: 12,
    },
    {
      title: 'More circles, more detail',
      text: 'With 80 circles the drawing is almost perfect. The largest circles set the overall shape; the tiny, fast ones add the fine detail.',
      params: { K: 80 },
      tween: 0,
      duration: 12,
    },
    {
      title: 'Corners are hard',
      text: 'A square’s sharp corners need ever-faster circles. With 15 terms you see wiggles and a little overshoot at each corner — the <b>Gibbs phenomenon</b>, the same ringing you see around text in a blurry JPEG.',
      params: { shape: 'square', K: 15, target: true },
      tween: 0,
      duration: 13,
    },
    {
      title: 'Draw your own',
      text: 'Draw any closed shape on the canvas. Fourier’s circles will learn to trace it. Slide the number of circles to see the drawing sharpen.',
      params: { shape: 'note', K: 60, target: false },
      tween: 0,
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let coeffs = [], target = [], t = 0, trail = [], drawing = null, S = 200, cx = 0, cy = 0;

    function load(pts) {
      target = resample(pts);
      coeffs = dft(target);
      trail = [];
      t = 0;
    }
    load(SHAPES[params.shape]());

    return {
      resize(w, h) {
        S = Math.min(w, h) * 0.32;
        cx = w * 0.5;
        cy = h * 0.45;
      },
      onParam(k, v) {
        if (k === 'shape') load(SHAPES[v]());
        if (k === 'K') trail = [];
      },
      reset() {
        load(SHAPES[params.shape]());
      },
      pointerDown(p) {
        drawing = [[p.x, p.y]];
      },
      pointerMove(p) {
        if (drawing) {
          const l = drawing[drawing.length - 1];
          if (Math.hypot(p.x - l[0], p.y - l[1]) > 3) drawing.push([p.x, p.y]);
        }
      },
      pointerUp() {
        if (drawing && drawing.length > 12) {
          load(drawing.map(([x, y]) => [(x - cx) / S, (y - cy) / S]));
          if (params.K < 30) api.runner.set('K', 60);
        }
        drawing = null;
      },
      update(dt) {
        if (drawing) return;
        const dtt = dt * params.speed * TAU * 0.5;
        t += dtt;
        if (t > TAU) {
          t -= TAU;
          trail = trail.slice(-6);
        }
        // tip position
        let x = 0, y = 0;
        const K = Math.min(coeffs.length, Math.round(params.K));
        for (let i = 0; i < K; i++) {
          const c = coeffs[i];
          x += c.amp * Math.cos(c.freq * t + c.phase);
          y += c.amp * Math.sin(c.freq * t + c.phase);
        }
        trail.push(cx + x * S, cy + y * S);
        if (trail.length > 3000) trail.splice(0, 2);
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#140f06', edge: '#040302' });
        if (params.target && target.length) {
          ctx.strokeStyle = 'rgba(255,181,71,0.22)';
          ctx.setLineDash([4, 5]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          target.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x * S, cy + y * S) : ctx.moveTo(cx + x * S, cy + y * S)));
          ctx.closePath();
          ctx.stroke();
          ctx.setLineDash([]);
        }
        // epicycles
        const K = Math.min(coeffs.length, Math.round(params.K));
        let x = cx, y = cy;
        for (let i = 0; i < K; i++) {
          const c = coeffs[i];
          const r = c.amp * S;
          const nx = x + r * Math.cos(c.freq * t + c.phase), ny = y + r * Math.sin(c.freq * t + c.phase);
          if (params.circles && r > 0.6) {
            const al = Math.max(0.06, 0.45 - i * 0.012);
            ctx.strokeStyle = `rgba(160,190,255,${al})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, TAU);
            ctx.stroke();
            ctx.strokeStyle = `rgba(230,240,255,${al + 0.25})`;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nx, ny);
            ctx.stroke();
          }
          x = nx;
          y = ny;
        }
        // trail
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = ctx.lineJoin = 'round';
        const n = trail.length / 2;
        const chunks = 10, per = Math.ceil(n / chunks);
        for (let c = 0; c < chunks; c++) {
          const i0 = c * per, i1 = Math.min(n - 1, (c + 1) * per);
          if (i1 <= i0) continue;
          ctx.strokeStyle = `rgba(255,181,71,${0.25 + (0.75 * (c + 1)) / chunks})`;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let i = i0; i <= i1; i++) i === i0 ? ctx.moveTo(trail[i * 2], trail[i * 2 + 1]) : ctx.lineTo(trail[i * 2], trail[i * 2 + 1]);
          ctx.stroke();
        }
        drawGlow(ctx, x, y, 16, '#ffb547');
        ctx.globalCompositeOperation = 'source-over';
        if (drawing) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          drawing.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
          ctx.stroke();
          if (!api.thumbnail) tag(ctx, 'release to let the circles trace it', drawing[0][0], drawing[0][1] - 24, C.amber, { align: 'center' });
        }
      },
      stats() {
        const K = Math.min(coeffs.length, Math.round(params.K));
        let e = 0, tot = 0;
        coeffs.forEach((c, i) => {
          tot += c.amp ** 2;
          if (i < K) e += c.amp ** 2;
        });
        return [
          { label: 'Circles in use', value: String(K) },
          { label: 'Shape energy captured', value: ((e / tot) * 100).toFixed(1) + ' %', color: C.amber },
        ];
      },
      charts() {
        const K = Math.round(params.K);
        return [
          {
            title: 'Circle sizes (largest first)',
            kind: 'bars',
            series: [{ data: coeffs.slice(0, 40).map((c, i) => (i < K ? c.amp : 0.0001)), color: '#ffb547' }],
            min: 0,
            xLabel: `first 40 of ${coeffs.length} frequencies`,
          },
        ];
      },
    };
  },
};
