import { C, TAU, clamp, backdrop, tag, text, rgba, drawGlow } from '../../core/util.js';

const SPECTRUM = [
  [0.68, '#ff2a3c'], [0.63, '#ff6a2a'], [0.59, '#ffc22a'], [0.55, '#9cff3a'], [0.51, '#2affb0'], [0.47, '#2ab8ff'], [0.43, '#5a5cff'], [0.405, '#a04aff'],
];
const DEG = Math.PI / 180;

function fresnel(cosi, cost, n1, n2) {
  const rs = (n1 * cosi - n2 * cost) / (n1 * cosi + n2 * cost);
  const rp = (n2 * cosi - n1 * cost) / (n2 * cosi + n1 * cost);
  return (rs * rs + rp * rp) / 2;
}

/** Build a convex polygon object with outward normals. */
function poly(pts, n, kind) {
  let cx = 0, cy = 0;
  for (const p of pts) (cx += p[0]), (cy += p[1]);
  cx /= pts.length;
  cy /= pts.length;
  const segs = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    let nx = b[1] - a[1], ny = -(b[0] - a[0]);
    const m = Math.hypot(nx, ny) || 1;
    nx /= m;
    ny /= m;
    if ((a[0] - cx) * nx + (a[1] - cy) * ny < 0) (nx = -nx), (ny = -ny);
    segs.push({ a, b, nx, ny });
  }
  return { pts, segs, n, kind };
}

function trace(objs, ox, oy, dx, dy, I, nOf, out, depth = 0, inside = null) {
  if (depth > 12 || I < 0.02) return;
  let best = Infinity, hit = null, hobj = null;
  for (const o of objs)
    for (const s of o.segs) {
      const ex = s.b[0] - s.a[0], ey = s.b[1] - s.a[1];
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((s.a[0] - ox) * ey - (s.a[1] - oy) * ex) / den;
      const u = ((s.a[0] - ox) * dy - (s.a[1] - oy) * dx) / den;
      if (t > 1e-4 && u >= 0 && u <= 1 && t < best) (best = t), (hit = s), (hobj = o);
    }
  const nCur = inside ? nOf(inside) : 1;
  if (!hit) {
    out.push({ x1: ox, y1: oy, x2: ox + dx * 4000, y2: oy + dy * 4000, I, n: nCur });
    return;
  }
  const hx = ox + dx * best, hy = oy + dy * best;
  out.push({ x1: ox, y1: oy, x2: hx, y2: hy, I, n: nCur });
  const entering = dx * hit.nx + dy * hit.ny < 0;
  const n1 = nCur, n2 = entering ? nOf(hobj) : 1;
  const next = entering ? hobj : null;
  // normal facing against the incoming ray
  const Nx = entering ? hit.nx : -hit.nx, Ny = entering ? hit.ny : -hit.ny;
  const cosi = -(dx * Nx + dy * Ny);
  const eta = n1 / n2;
  const k = 1 - eta * eta * (1 - cosi * cosi);
  const rx = dx + 2 * cosi * Nx, ry = dy + 2 * cosi * Ny;
  out.push({ hx, hy, Nx, Ny, mark: true });
  if (k < 0) {
    out.push({ tir: true, hx, hy });
    trace(objs, hx, hy, rx, ry, I, nOf, out, depth + 1, inside);
    return;
  }
  const cost = Math.sqrt(k);
  const tx = eta * dx + (eta * cosi - cost) * Nx, ty = eta * dy + (eta * cosi - cost) * Ny;
  const R = fresnel(cosi, cost, n1, n2);
  trace(objs, hx, hy, tx, ty, I * (1 - R), nOf, out, depth + 1, next);
  if (I * R > 0.025) trace(objs, hx, hy, rx, ry, I * R, nOf, out, depth + 1, inside);
}

export default {
  id: 'refraction',
  title: 'Light, Lenses & Rainbows',
  category: 'physics',
  tagline: 'Why light bends in water, gets trapped in glass and splits into colours.',
  blurb:
    'Light travels slower in water and glass than in air. That single fact explains why a straw looks broken in a glass, how lenses focus images in your eye and camera, how optical fibres carry the internet under the ocean, and why prisms and raindrops paint rainbows.',
  ideas: [
    'Light <b>slows down</b> in denser materials; the ratio is the refractive index n.',
    'Crossing a boundary at an angle, light <b>bends</b> (Snell’s law).',
    'Beyond the <b>critical angle</b>, light cannot escape and reflects totally — fibre optics.',
    'Each colour slows by a slightly different amount, so a prism <b>spreads white light</b> into a spectrum.',
  ],
  hint: 'Drag to aim the light',
  thumbChapter: 4,
  thumbFrames: 30,
  params: [
    { key: 'scene', label: 'Scene', type: 'select', value: 'snell', options: [{ value: 'snell', label: 'Into water' }, { value: 'tir', label: 'Trapped light' }, { value: 'prism', label: 'Prism' }, { value: 'lens', label: 'Lens' }] },
    { key: 'angle', label: 'Angle of incidence', type: 'range', min: 0, max: 85, step: 0.5, value: 40, unit: '°', digits: 1 },
    { key: 'n', label: 'Refractive index', type: 'range', min: 1, max: 2.5, step: 0.01, value: 1.33, format: (v) => v.toFixed(2) + (Math.abs(v - 1.33) < 0.01 ? ' water' : Math.abs(v - 1.5) < 0.01 ? ' glass' : Math.abs(v - 2.42) < 0.01 ? ' diamond' : '') },
    { key: 'pulses', label: 'Show light slowing down', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'Light bends',
      text: 'A laser shines into water. At the surface the beam abruptly changes direction — and a faint part bounces off. This bending is called <b>refraction</b>, and it is why a straw in a glass looks broken.',
      params: { scene: 'snell', angle: 45, n: 1.33, pulses: false },
      duration: 10,
    },
    {
      title: 'Because light slows down',
      text: 'The dots show light’s wave crests. In water they bunch up: light travels at only <b>75%</b> of its speed in air. Hitting the surface at a slant, one side of the beam slows first, so the beam swings toward the normal — like a car veering when one wheel hits sand.',
      formula: 'n₁ sin θ₁ = n₂ sin θ₂,    v = c / n',
      params: { scene: 'snell', angle: 45, n: 1.33, pulses: true },
      duration: 15,
    },
    {
      title: 'Denser means more bending',
      text: 'Raise the refractive index from water (1.33) to glass (1.5) to diamond (2.42). Light in diamond crawls at 41% of its top speed and bends sharply — part of why diamonds sparkle.',
      params: { scene: 'snell', n: 2.42, pulses: true },
      tween: 6,
      duration: 12,
    },
    {
      title: 'Trapped light',
      text: 'Now the light starts <b>inside</b> glass, heading out. As the angle grows the escaping beam bends ever flatter, until at the <b>critical angle</b> it cannot leave at all and reflects completely. Optical fibres use this to guide light for thousands of kilometres.',
      formula: 'sin θ_c = n₂ / n₁',
      params: { scene: 'tir', n: 1.5, pulses: false },
      enter: (s, r) => {
        r.set('angle', 15);
        r.set('angle', 60, 11);
      },
      duration: 15,
    },
    {
      title: 'Splitting white light',
      text: 'White light is every colour mixed. Glass slows violet light slightly more than red, so each colour bends by a different amount and a prism <b>fans them out</b> into a spectrum. Raindrops do the same to make rainbows.',
      params: { scene: 'prism', n: 1.52, angle: 48, pulses: false },
      duration: 14,
    },
    {
      title: 'Lenses',
      text: 'Curve the glass and every ray bends by just the right amount to meet at one point: the <b>focus</b>. Your eye, your phone camera and telescopes all work this way. Higher index means stronger bending and a shorter focal length.',
      formula: '1/f = (n − 1) (1/R₁ − 1/R₂)',
      params: { scene: 'lens', n: 1.5 },
      enter: (s, r) => r.set('n', 1.8, 8),
      duration: 15,
    },
    {
      title: 'Play with light',
      text: 'Switch scenes and drag on the canvas to aim the light. Try finding the critical angle for diamond, or tilting the beam into the lens.',
      params: { scene: 'snell', angle: 30, n: 1.5, pulses: true },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let tilt = 0;
    let world = null;

    function build() {
      const { w, h } = api;
      const scene = params.scene;
      const n = params.n;
      const objs = [];
      const sources = [];
      const th = params.angle * DEG;
      if (scene === 'snell') {
        const y0 = h * 0.47;
        objs.push(poly([[-200, y0], [w + 200, y0], [w + 200, h + 300], [-200, h + 300]], n, 'water'));
        const hx = w * 0.5, L = Math.min((y0 - 70) / Math.max(0.2, Math.cos(th)), w * 0.42);
        const dx = Math.sin(th), dy = Math.cos(th);
        sources.push({ x: hx - dx * L, y: y0 - dy * L, dx, dy, col: '#ff3b5c', lam: 0.63 });
        world = { objs, sources, hit: [hx, y0], normal: [0, 1], n1: 1, n2: n };
      } else if (scene === 'tir') {
        const y0 = h * 0.5;
        objs.push(poly([[-200, -300], [w + 200, -300], [w + 200, y0], [-200, y0]], n, 'glass'));
        const hx = w * 0.5, L = Math.min((y0 - 70) / Math.max(0.2, Math.cos(th)), w * 0.42);
        const dx = Math.sin(th), dy = Math.cos(th);
        sources.push({ x: hx - dx * L, y: y0 - dy * L, dx, dy, col: '#3bff9c', lam: 0.53 });
        world = { objs, sources, hit: [hx, y0], normal: [0, 1], n1: n, n2: 1 };
      } else if (scene === 'prism') {
        const S = Math.min(w * 0.3, h * 0.55);
        const cx = w * 0.46, cy = h * 0.44;
        const A = [cx, cy - S * 0.6], B = [cx + S * 0.55, cy + S * 0.35], Cc = [cx - S * 0.55, cy + S * 0.35];
        const pr = poly([A, B, Cc], n, 'glass');
        objs.push(pr);
        const face = pr.segs.find((s) => s.nx < 0);
        const P = [(face.a[0] + face.b[0]) / 2, (face.a[1] + face.b[1]) / 2];
        // incoming direction: rotate the inward normal by −θ (beam comes from below-left)
        const inx = -face.nx, iny = -face.ny;
        const c = Math.cos(-th), s = Math.sin(-th);
        const dx = inx * c - iny * s, dy = inx * s + iny * c;
        const L = Math.min(P[0] - 20, 400);
        for (const [lam, col] of SPECTRUM) sources.push({ x: P[0] - dx * L, y: P[1] - dy * L, dx, dy, col, lam });
        world = { objs, sources, white: true, hit: P, normal: [face.nx, face.ny] };
      } else {
        const cx = w * 0.5, cy = h * 0.42, H = Math.min(h * 0.3, 150), s = 26;
        const R = (H * H + s * s) / (2 * s);
        const pts = [];
        for (let i = 0; i <= 40; i++) {
          const dy = -H + (2 * H * i) / 40;
          pts.push([cx - s + (R - Math.sqrt(R * R - dy * dy)), cy + dy]);
        }
        for (let i = 40; i >= 0; i--) {
          const dy = -H + (2 * H * i) / 40;
          pts.push([cx + s - (R - Math.sqrt(R * R - dy * dy)), cy + dy]);
        }
        objs.push(poly(pts, n, 'lens'));
        const a = tilt * DEG;
        const dx = Math.cos(a), dy = Math.sin(a);
        for (let i = 0; i < 11; i++) {
          const off = -H * 0.82 + (H * 1.64 * i) / 10;
          sources.push({ x: cx - w * 0.42 - off * dy * 0, y: cy + off - dy * w * 0.42, dx, dy, col: '#ffd58a', lam: 0.58 });
        }
        const f = 1 / ((n - 1) * (2 / R - ((n - 1) * 2 * s) / (n * R * R)));
        world = { objs, sources, lens: { cx, cy, H, f } };
      }
      const segs = [];
      const disp = (o, lam) => o.n + (world.white ? 0.012 * 3.2 * (1 / (lam * lam) - 1 / 0.589 ** 2) : 0);
      for (const src of world.sources) {
        const out = [];
        trace(world.objs, src.x, src.y, src.dx, src.dy, 1, (o) => disp(o, src.lam), out);
        segs.push({ src, out });
      }
      world.rays = segs;
    }

    return {
      resize() {},
      pointerDown(p) {
        this.pointerMove(p);
      },
      pointerMove(p) {
        if (!p.down || !world) return;
        if (params.scene === 'lens') {
          tilt = clamp(((p.y - api.h * 0.42) / api.h) * 40, -14, 14);
          return;
        }
        const [hx, hy] = world.hit;
        const vx = hx - p.x, vy = hy - p.y;
        let a;
        if (params.scene === 'prism') {
          const nx = -world.normal[0], ny = -world.normal[1];
          a = Math.atan2(nx * vy - ny * vx, nx * vx + ny * vy);
          a = -a / DEG;
        } else a = Math.abs(Math.atan2(vx, Math.abs(vy))) / DEG;
        api.runner.set('angle', clamp(Math.round(a * 2) / 2, 0, 85));
      },
      draw() {
        const { w, h } = api;
        build();
        const scene = params.scene;
        backdrop(ctx, w, h, { center: '#0b0f22', grid: scene !== 'lens' });

        // materials
        for (const o of world.objs) {
          ctx.beginPath();
          o.pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1]));
          ctx.closePath();
          const t = clamp((params.n - 1) / 1.5, 0, 1);
          if (o.kind === 'water') {
            const g = ctx.createLinearGradient(0, o.pts[0][1], 0, h);
            g.addColorStop(0, `rgba(40,120,220,${0.22 + 0.2 * t})`);
            g.addColorStop(1, `rgba(10,30,80,${0.4 + 0.2 * t})`);
            ctx.fillStyle = g;
          } else {
            ctx.fillStyle = `rgba(150,200,255,${0.07 + 0.12 * t})`;
          }
          ctx.fill();
          ctx.strokeStyle = 'rgba(190,220,255,0.45)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // normal + angle arcs
        if (scene === 'snell' || scene === 'tir') {
          const [hx, hy] = world.hit;
          ctx.setLineDash([5, 6]);
          ctx.strokeStyle = 'rgba(233,237,247,0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(hx, hy - 160);
          ctx.lineTo(hx, hy + 160);
          ctx.stroke();
          ctx.setLineDash([]);
          if (!api.thumbnail) text(ctx, 'normal', hx + 6, hy - 150, { size: 10, color: C.dim });
        }

        // rays
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        let tirHit = false;
        for (const { src, out } of world.rays) {
          const segs = out.filter((s) => !s.mark && !s.tir);
          if (out.some((s) => s.tir)) tirHit = true;
          const white = world.white;
          for (const s of segs) {
            const a = Math.min(1, s.I) * (white ? 0.75 : 1);
            const inside = s.n > 1.001;
            // before the prism, draw one white beam instead of 8 overlapping colours
            const col = white && !inside && s === segs[0] ? '#ffffff' : src.col;
            const aa = white && s === segs[0] ? a / 8 : a;
            ctx.strokeStyle = rgba(col, aa * 0.18);
            ctx.lineWidth = scene === 'lens' ? 5 : 9;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();
            ctx.strokeStyle = rgba(col, aa * 0.95);
            ctx.lineWidth = scene === 'lens' ? 1.3 : 2;
            ctx.stroke();
            // wave crests moving at c/n
            if (params.pulses && !white && scene !== 'lens' && s.I > 0.2) {
              const L = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
              const ux = (s.x2 - s.x1) / L, uy = (s.y2 - s.y1) / L;
              const sp = 24 / s.n;
              const off = ((api.time * 70) / s.n) % sp;
              ctx.fillStyle = rgba('#ffffff', 0.85 * s.I);
              for (let d = off; d < Math.min(L, 1500); d += sp) {
                ctx.beginPath();
                ctx.arc(s.x1 + ux * d, s.y1 + uy * d, 2.1, 0, TAU);
                ctx.fill();
              }
            }
          }
        }
        // spectrum glow where the colours land
        if (world.white) {
          for (const { src, out } of world.rays) {
            const last = out.filter((s) => !s.mark && !s.tir).pop();
            if (!last) continue;
            const t = (w * 0.94 - last.x1) / (last.x2 - last.x1);
            if (t > 0 && t < 1) drawGlow(ctx, w * 0.94, last.y1 + (last.y2 - last.y1) * t, 26, src.col, 0.15);
          }
        }
        ctx.globalCompositeOperation = 'source-over';
        if (world.white) {
          ctx.fillStyle = 'rgba(233,237,247,0.12)';
          ctx.fillRect(w * 0.94, 60, 3, h - 120);
        }

        // sources
        for (const src of world.rays.map((r) => r.src).filter((s, i) => !world.white || i === 0)) {
          if (scene === 'lens') break;
          ctx.save();
          ctx.translate(src.x, src.y);
          ctx.rotate(Math.atan2(src.dy, src.dx));
          ctx.fillStyle = '#2b3150';
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(-36, -8, 38, 16, 4) : ctx.rect(-36, -8, 38, 16);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // labels
        if (!api.thumbnail) {
          if (scene === 'snell' || scene === 'tir') {
            const [hx, hy] = world.hit;
            const t1 = params.angle;
            const s2 = (world.n1 / world.n2) * Math.sin(t1 * DEG);
            const t2 = Math.abs(s2) <= 1 ? Math.asin(s2) / DEG : null;
            const upTxt = `θ₁ = ${t1.toFixed(1)}°`;
            const downTxt = t2 === null ? 'no escape' : `θ₂ = ${t2.toFixed(1)}°`;
            ctx.strokeStyle = 'rgba(255,181,71,0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(hx, hy, 42, -Math.PI / 2 - t1 * DEG, -Math.PI / 2);
            ctx.stroke();
            if (t2 !== null) {
              ctx.beginPath();
              ctx.arc(hx, hy, 42, Math.PI / 2 - t2 * DEG, Math.PI / 2);
              ctx.stroke();
            }
            tag(ctx, upTxt, hx + 50, hy - 60, C.amber, { size: 11 });
            tag(ctx, downTxt, hx + 50, hy + 60, t2 === null ? C.red : C.amber, { size: 11 });
            tag(ctx, scene === 'snell' ? 'air  n = 1.00' : `glass  n = ${params.n.toFixed(2)}`, 18, hy - 22, C.dim, { size: 10 });
            tag(ctx, scene === 'snell' ? `water/glass  n = ${params.n.toFixed(2)}` : 'air  n = 1.00', 18, hy + 22, C.dim, { size: 10 });
            if (tirHit && scene === 'tir') tag(ctx, 'TOTAL INTERNAL REFLECTION', hx, hy - 110, C.red, { align: 'center', size: 11 });
          }
          if (scene === 'lens') {
            const { cx, cy, f } = world.lens;
            for (const sx of [cx - f, cx + f]) {
              if (sx < 0 || sx > w) continue;
              ctx.fillStyle = C.amber;
              ctx.beginPath();
              ctx.arc(sx, cy, 4, 0, TAU);
              ctx.fill();
              text(ctx, 'F', sx, cy + 16, { size: 12, align: 'center', color: C.amber, weight: 700 });
            }
            ctx.strokeStyle = 'rgba(233,237,247,0.12)';
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(w, cy);
            ctx.stroke();
            tag(ctx, `focal length ${(f / 4).toFixed(0)} mm (scaled)`, cx, cy - world.lens.H - 26, C.amber, { align: 'center', size: 10 });
          }
          if (scene === 'prism') tag(ctx, 'screen', w * 0.94, 70, C.dim, { align: 'center', size: 10 });
        }
      },
      stats() {
        const n = params.n;
        const out = [
          { label: 'Refractive index n', value: n.toFixed(2) },
          { label: 'Speed of light inside', value: (299792 / n).toFixed(0) + ' km/s' },
          { label: 'Critical angle', value: (Math.asin(1 / n) / DEG).toFixed(1) + '°', color: C.red },
        ];
        if (params.scene === 'snell' || params.scene === 'tir') {
          const n1 = params.scene === 'snell' ? 1 : n, n2 = params.scene === 'snell' ? n : 1;
          const s2 = (n1 / n2) * Math.sin(params.angle * DEG);
          out.push({ label: 'Refracted angle', value: Math.abs(s2) <= 1 ? (Math.asin(s2) / DEG).toFixed(1) + '°' : 'none — all reflected', color: C.amber });
        }
        return out;
      },
      charts() {
        if (params.scene !== 'snell' && params.scene !== 'tir') return [];
        const n = params.n;
        const n1 = params.scene === 'snell' ? 1 : n, n2 = params.scene === 'snell' ? n : 1;
        const data = [], ref = [];
        for (let a = 0; a <= 85; a += 2.5) {
          const s = (n1 / n2) * Math.sin(a * DEG);
          data.push(Math.abs(s) <= 1 ? Math.asin(s) / DEG : NaN);
          ref.push(a);
        }
        return [{ title: 'Refracted angle vs incident angle (0°–85°)', series: [{ data, color: C.amber, fill: false }], ref: { data: ref, color: 'rgba(255,255,255,0.4)' }, min: 0, max: 90, xLabel: 'dashed: no bending' }];
      },
    };
  },
};
