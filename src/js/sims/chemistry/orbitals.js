import { C, drawGlow, easeInOut, tag } from '../../core/util.js';

// Real hydrogen orbitals ψ = R(r)·Y(angle), a₀ = 1. Unnormalised; only shape and sign matter here.
const ORBITALS = {
  '1s': { n: 1, R: (r) => Math.exp(-r), Y: () => 1, ext: 5.5, label: '1s' },
  '2s': { n: 2, R: (r) => (2 - r) * Math.exp(-r / 2), Y: () => 1, ext: 13, label: '2s' },
  '2p': { n: 2, R: (r) => r * Math.exp(-r / 2), Y: (x, y, z, r) => z / r, ext: 12, label: '2p' },
  '3s': { n: 3, R: (r) => (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3), Y: () => 1, ext: 25, label: '3s' },
  '3p': { n: 3, R: (r) => r * (6 - r) * Math.exp(-r / 3), Y: (x, y, z, r) => z / r, ext: 24, label: '3p' },
  '3dz2': { n: 3, R: (r) => r * r * Math.exp(-r / 3), Y: (x, y, z, r) => (3 * z * z - r * r) / (r * r), ext: 22, label: '3d z²' },
  '3dxy': { n: 3, R: (r) => r * r * Math.exp(-r / 3), Y: (x, y, z, r) => (x * z) / (r * r), ext: 21, label: '3d xz' },
  '4f': { n: 4, R: (r) => r * r * r * Math.exp(-r / 4), Y: (x, y, z, r) => (z * (5 * z * z - 3 * r * r)) / (r * r * r), ext: 34, label: '4f z³' },
  '4fxyz': { n: 4, R: (r) => r * r * r * Math.exp(-r / 4), Y: (x, y, z, r) => (x * y * z) / (r * r * r), ext: 32, label: '4f xyz' },
};

function sample(orb, N) {
  const psi = (x, y, z) => {
    const r = Math.hypot(x, y, z) + 1e-9;
    return orb.R(r) * orb.Y(x, y, z, r);
  };
  const E = orb.ext;
  let max = 0;
  for (let i = 0; i < 40000; i++) {
    const v = psi((Math.random() * 2 - 1) * E, (Math.random() * 2 - 1) * E, (Math.random() * 2 - 1) * E);
    max = Math.max(max, v * v);
  }
  max *= 1.15;
  const pts = new Float32Array(N * 4);
  // shrink-wrap each cloud but keep bigger shells visibly bigger
  const f = Math.sqrt(E / 34) / E;
  let k = 0, guard = 0;
  while (k < N && guard++ < 8e6) {
    const x = (Math.random() * 2 - 1) * E, y = (Math.random() * 2 - 1) * E, z = (Math.random() * 2 - 1) * E;
    const v = psi(x, y, z);
    if (Math.random() * max < v * v) {
      pts[k * 4] = x * f;
      pts[k * 4 + 1] = z * f; // z is "up" on screen
      pts[k * 4 + 2] = y * f;
      pts[k * 4 + 3] = v >= 0 ? 1 : -1;
      k++;
    }
  }
  return pts;
}

export default {
  id: 'orbitals',
  title: 'The Shapes of Atoms',
  category: 'chemistry',
  tagline: 'Electron clouds of hydrogen, built dot by dot from the Schrödinger equation.',
  ages: ['16+'],
  topics: ['Atomic structure', 'Quantum'],
  blurb:
    'Electrons don’t orbit the nucleus like planets. Quantum mechanics only gives the probability of finding one at each point — a cloud whose shape is set by the Schrödinger equation. These shapes, called orbitals, decide how atoms bond and so underpin all of chemistry.',
  ideas: [
    'Each dot is one possible place an electron could be found if you looked.',
    'Higher energy levels (n) give larger clouds with more <b>nodes</b> — surfaces where the electron is never found.',
    'Colours show the <b>phase</b> (sign) of the wavefunction; it matters when orbitals overlap to form bonds.',
    'The s, p, d, f shapes explain the layout of the periodic table.',
  ],
  hint: 'Drag to rotate the atom',
  thumbChapter: 2,
  thumbFrames: 60,
  params: [
    {
      key: 'orb', label: 'Orbital', type: 'select', value: '1s',
      options: Object.entries(ORBITALS).map(([k, o]) => ({ value: k, label: o.label })),
    },
    { key: 'N', label: 'Sample points', type: 'range', min: 2000, max: 30000, step: 1000, value: 14000, instant: true },
    { key: 'phase', label: 'Colour by phase', type: 'toggle', value: true },
    { key: 'spin', label: 'Auto-rotate', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'A cloud, not an orbit',
      text: 'The simplest atom: hydrogen, one electron. Instead of a neat orbit, the electron is spread out as a fuzzy sphere of <b>probability</b>. Each dot marks a place it might be found.',
      formula: 'Ĥψ = Eψ',
      params: { orb: '1s', phase: true },
      duration: 11,
    },
    {
      title: 'Bigger and hollow',
      text: 'Give the electron more energy and the cloud grows. The 2s orbital has an inner and outer shell separated by a <b>node</b> — a sphere where the electron is never found.',
      params: { orb: '2s' },
      duration: 11,
    },
    {
      title: 'Dumbbells',
      text: 'The 2p orbital has two lobes. Orange and blue mark opposite <b>phases</b> of the wave — like the up and down of a vibrating string. Between them is a flat nodal plane.',
      params: { orb: '2p' },
      duration: 11,
    },
    {
      title: 'Clovers and donuts',
      text: 'Third-shell d orbitals take stranger shapes: a dumbbell threaded through a donut, or a four-leaf clover. Their directions explain why molecules have the angles they do.',
      params: { orb: '3dz2' },
      enter: (s, r) => setTimeout(() => r.set('orb', '3dxy'), 6500),
      duration: 13,
    },
    {
      title: 'Exotic f orbitals',
      text: 'The f orbitals of the fourth shell have even more lobes. They shape the chemistry of the rare-earth metals in magnets and phone screens.',
      params: { orb: '4fxyz' },
      duration: 12,
    },
    {
      title: 'Explore',
      text: 'Pick any orbital and rotate it. The Live data chart shows how likely the electron is to be found at each distance from the nucleus.',
      params: { orb: '3p' },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let buf = null, pts = null, from = null, morph = 1, yaw = 0.5, pitch = 0.35, drag = null, radial = [];

    function build() {
      const orb = ORBITALS[params.orb];
      const N = Math.round(params.N);
      const next = sample(orb, N);
      from = pts && pts.length === next.length ? pts : null;
      pts = next;
      morph = from ? 0 : 1;
      // radial probability P(r) = r²R² and histogram
      const bins = 60;
      radial = new Array(bins).fill(0);
      for (let i = 0; i < N; i++) {
        const r = Math.hypot(pts[i * 4], pts[i * 4 + 1], pts[i * 4 + 2]);
        const b = Math.min(bins - 1, Math.floor((r / Math.sqrt(orb.ext / 34)) * bins));
        radial[b]++;
      }
    }
    build();
    return {
      onParam(k) {
        if (k === 'orb' || k === 'N') build();
      },
      pointerDown(p) {
        drag = { x: p.x, y: p.y, yaw, pitch };
      },
      pointerMove(p) {
        if (!drag) return;
        yaw = drag.yaw + (p.x - drag.x) * 0.008;
        pitch = Math.max(-1.4, Math.min(1.4, drag.pitch + (p.y - drag.y) * 0.008));
      },
      pointerUp() {
        drag = null;
      },
      update(dt) {
        if (params.spin && !drag) yaw += dt * 0.35;
        if (morph < 1) morph = Math.min(1, morph + dt / 1.3);
      },
      draw() {
        const { w, h } = api;
        const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.7);
        g.addColorStop(0, '#0a1420');
        g.addColorStop(1, '#020408');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        const S = Math.min(w, h) * 0.42;
        const cx = w / 2, cy = h * 0.45;
        const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        // faint axes
        ctx.strokeStyle = 'rgba(160,190,255,0.12)';
        ctx.lineWidth = 1;
        for (const [ax, ay, az] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
          const x1 = ax * cyw + az * syw, z1 = -ax * syw + az * cyw;
          const y2 = ay * cp - z1 * sp;
          ctx.beginPath();
          ctx.moveTo(cx - x1 * S * 1.05, cy - y2 * S * 1.05);
          ctx.lineTo(cx + x1 * S * 1.05, cy + y2 * S * 1.05);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'lighter';
        const n = pts.length / 4;
        const e = easeInOut(morph);
        const dense = n > 16000 ? 0.32 : n > 8000 ? 0.45 : 0.6;
        const colP = params.phase ? [255, 160, 70] : [120, 200, 255];
        const colN = params.phase ? [70, 160, 255] : [120, 200, 255];
        // accumulate points additively into a pixel buffer (much faster than thousands of fillRects)
        const BW = Math.ceil(w), BH = Math.ceil(h);
        if (!buf || buf.w !== BW || buf.h !== BH) {
          const cv = document.createElement('canvas');
          cv.width = BW;
          cv.height = BH;
          const g2 = cv.getContext('2d');
          buf = { w: BW, h: BH, cv, g2, img: g2.createImageData(BW, BH), acc: new Float32Array(BW * BH * 3) };
        }
        // only the cloud's bounding box is touched: clear, accumulate and convert just that region
        const acc = buf.acc;
        let x0 = BW, y0 = BH, x1m = -1, y1m = -1;
        for (let i = 0; i < n; i++) {
          let x = pts[i * 4], y = pts[i * 4 + 1], z = pts[i * 4 + 2];
          if (from && e < 1) {
            x = from[i * 4] + (x - from[i * 4]) * e;
            y = from[i * 4 + 1] + (y - from[i * 4 + 1]) * e;
            z = from[i * 4 + 2] + (z - from[i * 4 + 2]) * e;
          }
          const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
          const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
          const persp = 1 / (1.8 - z2 * 0.5);
          const X = (cx + x1 * S * persp * 1.8) | 0, Y = (cy - y2 * S * persp * 1.8) | 0;
          if (X < 0 || Y < 0 || X >= BW - 1 || Y >= BH - 1) continue;
          if (X < x0) x0 = X;
          if (X > x1m) x1m = X;
          if (Y < y0) y0 = Y;
          if (Y > y1m) y1m = Y;
          const c = pts[i * 4 + 3] > 0 ? colP : colN;
          const a = dense * (0.45 + 0.55 * (z2 * 0.5 + 0.5));
          const r = c[0] * a, g = c[1] * a, b = c[2] * a;
          let o = (Y * BW + X) * 3;
          acc[o] += r; acc[o + 1] += g; acc[o + 2] += b;
          acc[o + 3] += r; acc[o + 4] += g; acc[o + 5] += b;
          o += BW * 3;
          acc[o] += r; acc[o + 1] += g; acc[o + 2] += b;
          acc[o + 3] += r; acc[o + 4] += g; acc[o + 5] += b;
        }
        if (x1m >= 0) {
          const bw = x1m - x0 + 2, bh = y1m - y0 + 2;
          const d = buf.img.data;
          for (let yy = y0; yy < y0 + bh; yy++) {
            for (let k = yy * BW + x0, end = k + bw; k < end; k++) {
              const r = acc[k * 3], g = acc[k * 3 + 1], b = acc[k * 3 + 2];
              d[k * 4] = r;
              d[k * 4 + 1] = g;
              d[k * 4 + 2] = b;
              d[k * 4 + 3] = r || g || b ? 255 : 0;
              acc[k * 3] = acc[k * 3 + 1] = acc[k * 3 + 2] = 0; // ready for the next frame
            }
          }
          buf.g2.putImageData(buf.img, 0, 0, x0, y0, bw, bh);
          ctx.drawImage(buf.cv, x0, y0, bw, bh, x0, y0, bw, bh);
        }
        drawGlow(ctx, cx, cy, 16, '#ffffff', 0.25);
        ctx.globalCompositeOperation = 'source-over';
        if (!api.thumbnail) {
          tag(ctx, `${ORBITALS[params.orb].label} orbital  ·  n = ${ORBITALS[params.orb].n}`, cx, Math.max(124, cy - S * 1.05), C.teal, { align: 'center', size: 12 });
          tag(ctx, 'nucleus', cx + 20, cy + 22, C.ink);
        }
      },
      stats() {
        const o = ORBITALS[params.orb];
        return [
          { label: 'Shell n', value: String(o.n) },
          { label: 'Energy', value: (-13.6 / (o.n * o.n)).toFixed(2) + ' eV' },
          { label: 'Points', value: (pts.length / 4).toLocaleString() },
          { label: 'Cloud radius', value: `~${(o.ext * 0.053).toFixed(1)} nm` },
        ];
      },
      charts() {
        return [{ title: 'Probability vs distance from nucleus', kind: 'bars', series: [{ data: radial, color: '#2ee6a6' }], min: 0, xLabel: 'nucleus → outer edge' }];
      },
    };
  },
};
