import { C, TAU, clamp, tag, text, backdrop, rand } from '../../core/util.js';

// Refractive index of water across the visible spectrum (Cauchy fit), and a rough colour for each.
const nWater = (nm) => 1.3195 + 3.0e3 / (nm * nm) + 2.2e8 / nm ** 4;
const SPECTRUM = [
  { nm: 700, col: '#ff3b3b', name: 'red' },
  { nm: 620, col: '#ff8a1f', name: 'orange' },
  { nm: 580, col: '#ffe14a', name: 'yellow' },
  { nm: 530, col: '#4cf06a', name: 'green' },
  { nm: 490, col: '#3ad2ff', name: 'cyan' },
  { nm: 450, col: '#4f6bff', name: 'blue' },
  { nm: 410, col: '#b45cff', name: 'violet' },
];
const deg = (r) => (r * 180) / Math.PI;

/** Wavelength (nm) → linear-ish RGB, 0..1 (after Bruton). */
function wl2rgb(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) (r = (440 - nm) / 60), (b = 1);
  else if (nm < 490) (g = (nm - 440) / 50), (b = 1);
  else if (nm < 510) (g = 1), (b = (510 - nm) / 20);
  else if (nm < 580) (r = (nm - 510) / 70), (g = 1);
  else if (nm < 645) (r = 1), (g = (645 - nm) / 65);
  else r = 1;
  const f = nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 680 ? 0.3 + (0.7 * (750 - nm)) / 70 : 1;
  return [r * f, g * f, b * f];
}

/** Angle of a ray's exit from the anti-sun direction, after k internal reflections (radians). */
function bowAngle(b, n, k) {
  const i = Math.asin(b), r = Math.asin(b / n);
  const D = 2 * (i - r) + k * (Math.PI - 2 * r); // total deviation
  // fold onto 0..π, measured from the direction pointing back toward the Sun's opposite
  let a = Math.PI - (D % TAU);
  if (a < -Math.PI) a += TAU;
  return Math.abs(a);
}

/**
 * Trace one ray through a drop of radius 1 centred on the origin (y up). The ray comes from the left
 * at height b. Returns the polyline inside the drop and the exit point and direction.
 */
function trace(b, n, k) {
  const pts = [];
  let px = -Math.sqrt(1 - b * b), py = b;
  pts.push([px, py]);
  // refract in: incoming d = (1,0), outward normal = (px,py)
  let dx = 1, dy = 0;
  const refract = (dx, dy, nx, ny, eta) => {
    const cosi = -(nx * dx + ny * dy);
    const k2 = 1 - eta * eta * (1 - cosi * cosi);
    if (k2 < 0) return null;
    const f = eta * cosi - Math.sqrt(k2);
    return [eta * dx + f * nx, eta * dy + f * ny];
  };
  [dx, dy] = refract(dx, dy, px, py, 1 / n);
  for (let j = 0; j <= k; j++) {
    const tt = -2 * (px * dx + py * dy); // next hit on the unit circle
    px += dx * tt;
    py += dy * tt;
    pts.push([px, py]);
    if (j < k) {
      const dn = dx * px + dy * py;
      dx -= 2 * dn * px;
      dy -= 2 * dn * py;
    }
  }
  const out = refract(dx, dy, -px, -py, n) || [dx, dy];
  return { pts, exit: [px, py], dir: out };
}

/** Brightness of the sky bows vs angle from the anti-solar point, as gradient colour stops. */
function bowProfile() {
  const BIN = 0.2, MAXA = 64, NB = Math.round(MAXA / BIN);
  const rgb = [new Float32Array(NB), new Float32Array(NB), new Float32Array(NB)];
  for (let nm = 400; nm <= 700; nm += 10) {
    const n = nWater(nm), c = wl2rgb(nm);
    for (const [k, wgt] of [[1, 1], [2, 0.42]]) {
      for (let s = 0; s < 3000; s++) {
        const b = (s + 0.5) / 3000;
        const a = deg(bowAngle(b, n, k));
        if (a >= MAXA || a < 1) continue;
        const bin = Math.floor(a / BIN);
        // b: rays arrive over a disc; divide by sin(angle): light spreads over a ring of sky
        const v = (wgt * b) / Math.sin((a * Math.PI) / 180);
        rgb[0][bin] += v * c[0];
        rgb[1][bin] += v * c[1];
        rgb[2][bin] += v * c[2];
      }
    }
  }
  // blur by the Sun's half-degree disc
  const out = [new Float32Array(NB), new Float32Array(NB), new Float32Array(NB)];
  const K = 3;
  for (let ch = 0; ch < 3; ch++)
    for (let i = 0; i < NB; i++) {
      let s = 0, ws = 0;
      for (let j = -K; j <= K; j++) {
        const q = i + j;
        if (q < 0 || q >= NB) continue;
        const wj = Math.exp(-(j * j) / (K * 0.8) ** 2);
        s += rgb[ch][q] * wj;
        ws += wj;
      }
      out[ch][i] = s / ws;
    }
  let peak = 0;
  for (let i = 0; i < NB; i++) peak = Math.max(peak, out[0][i], out[1][i], out[2][i]);
  const stops = [];
  for (let i = 0; i < NB; i += 2) {
    // inside the bow the sky is lit by every drop's scattered light: brighter, but not glaring
    const cap = i * BIN < 39 ? 0.22 * peak : Infinity;
    const f = (c) => Math.round(255 * Math.min(1, ((1.7 * Math.min(cap, out[c][i])) / peak) ** 0.95));
    stops.push([(i * BIN) / MAXA, `rgba(${f(0)},${f(1)},${f(2)},1)`]);
  }
  return { stops, maxA: MAXA };
}

export default {
  id: 'rainbows',
  title: 'How Rainbows Form',
  category: 'earth',
  tagline: 'Every raindrop is a tiny prism and mirror: follow sunlight in, round the back and out at 42°.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Light', 'Weather'],
  keywords: ['rainbow', 'refraction', 'dispersion', 'raindrop', 'double rainbow', 'Alexander band', 'prism'],
  blurb:
    'A rainbow needs the Sun behind you and rain in front. Each drop bends sunlight as it enters, bounces it off its back and bends it again on the way out, splitting the colours a little. Rays bunch up at about 42° from the point opposite the Sun, so every drop on that circle glows. That is why a rainbow is an arc, why it is red on the outside, and why there is sometimes a second, fainter bow.',
  ideas: [
    'Light <b>slows down</b> in water and bends (refracts) as it goes in and out of a drop.',
    'Violet light bends a little more than red, so the colours fan out: <b>dispersion</b>.',
    'After one reflection inside the drop, light comes back out at up to <b>42°</b> (red) or 40° (violet) from the anti-solar point.',
    'Rays bunch up near that greatest angle, so drops on a <b>circle</b> around your head’s shadow shine brightest.',
    'Two reflections make the fainter <b>secondary bow</b> at 51°, with its colours reversed. The sky between is darker.',
  ],
  hint: 'Drag up and down on the drop to move the incoming ray',
  thumbChapter: 4,
  thumbFrames: 30,
  params: [
    { key: 'scene', label: 'Scene', type: 'select', value: 'drop', options: [{ value: 'drop', label: 'Inside a raindrop' }, { value: 'sky', label: 'In the sky' }] },
    { key: 'b', label: 'Where the ray hits the drop', type: 'range', min: 0, max: 0.99, step: 0.01, value: 0.86, format: (v) => `${Math.round(v * 100)}% of the way up` },
    { key: 'light', label: 'Light', type: 'select', value: 'white', options: [{ value: 'white', label: 'Sunlight (all colours)' }, { value: 'red', label: 'Red only' }, { value: 'violet', label: 'Violet only' }] },
    { key: 'many', label: 'Many rays at once', type: 'toggle', value: false },
    { key: 'bounces', label: 'Reflections inside', type: 'select', value: 1, options: [{ value: 1, label: 'One (main bow)' }, { value: 2, label: 'Two (second bow)' }] },
    { key: 'sun', label: 'Sun height', type: 'range', min: 0, max: 60, step: 1, value: 15, format: (v) => v + '°' },
    { key: 'plane', label: 'View from a plane', type: 'toggle', value: false },
  ],
  story: [
    {
      title: 'Sunlight meets a raindrop',
      text: 'A ray of sunlight hits a falling raindrop. Light travels about a quarter slower in water than in air, so as it crosses into the drop it <b>bends</b> towards the centre. Drag on the drop to aim the ray higher or lower.',
      params: { scene: 'drop', light: 'red', many: false, bounces: 1, b: 0.6 },
      tween: 2,
      enter: (s, r) => s.later(4, () => r.set('b', 0.86, 3)),
      duration: 13,
    },
    {
      title: 'A tiny prism',
      text: 'Sunlight is a mix of colours, and water bends each one by a slightly different amount: <b>violet bends most, red least</b>. So the white ray fans out into a spectrum inside the drop, just as in a glass prism.',
      params: { scene: 'drop', light: 'white', many: false, bounces: 1, b: 0.86 },
      duration: 13,
    },
    {
      title: 'A mirror at the back',
      text: 'At the back of the drop some of the light <b>reflects</b> and heads back towards the Sun’s side, bending again as it leaves. Red comes out at about <b>42°</b> from the direction the sunlight was going backwards, violet at about <b>40°</b>.',
      formula: 'θ = 4r − 2i',
      params: { scene: 'drop', light: 'white', many: false, bounces: 1, b: 0.86 },
      duration: 13,
    },
    {
      title: 'Rays pile up at 42°',
      text: 'Sunlight hits drops at every height, so rays leave at many angles. But no ray of red can come out beyond <b>42°</b>, and near that limit the rays <b>bunch together</b>. Look at the chart: the drop sends far more light to 42° than anywhere else.',
      params: { scene: 'drop', light: 'red', many: true, bounces: 1 },
      check: {
        q: 'Sunlight hits the drop at every height. Where does the drop send most of its red light?',
        options: ['Straight back towards the Sun', 'Evenly in all directions', 'Bunched near 42°'],
        answer: 2,
        explain: 'As you move the ray up the drop, the exit angle climbs to 42° and then turns back. Many rays leave near that turning point, so 42° gets the most light.',
      },
      duration: 15,
    },
    {
      title: 'Your own rainbow',
      text: 'Stand with the Sun behind you. The point exactly opposite the Sun is where your <b>head’s shadow</b> falls. Every drop 42° from that point sends red light to your eye; drops at 40° send violet. Drops on a circle make an <b>arc</b>, red on the <b>outside</b>. Someone beside you sees a rainbow made by different drops.',
      params: { scene: 'sky', sun: 15, plane: false },
      tween: 2,
      duration: 15,
    },
    {
      title: 'Why not at midday?',
      text: 'As the Sun climbs, the point opposite it sinks below the horizon, and the rainbow sinks with it. Once the Sun is higher than 42°, the main bow is entirely <b>below the horizon</b>. That is why rainbows show up in the morning or late afternoon.',
      params: { scene: 'sky', sun: 10, plane: false },
      check: {
        q: 'Why do you almost never see a rainbow around midday in summer?',
        options: ['The Sun is so high that the bow is below the horizon', 'It only rains in the evening', 'Bright sunlight washes the colours out'],
        answer: 0,
        explain: 'The bow is centred on the point opposite the Sun. With the Sun more than 42° up, that whole circle lies below the horizon.',
      },
      enter: (s, r) => s.later(3, () => r.set('sun', 48, 6)),
      duration: 15,
    },
    {
      title: 'The second bow',
      text: 'Some light reflects <b>twice</b> inside the drop before escaping. It comes out at about <b>51°</b>, so a fainter second bow sits outside the first, with its colours <b>reversed</b>. No light from either kind of ray comes out between 42° and 51°, so the sky between the bows looks darker: <b>Alexander’s dark band</b>.',
      params: { scene: 'drop', light: 'white', many: false, bounces: 2, b: 0.95 },
      enter: (s, r) => s.later(7, () => r.applyParams({ scene: 'sky', sun: 12 })),
      duration: 15,
    },
    {
      title: 'Rainbows are circles',
      text: 'The ground usually hides the bottom half, but from a plane or a mountain top you can see a rainbow as a <b>full circle</b>, centred on the shadow of the plane.',
      params: { scene: 'sky', plane: true, sun: 25 },
      duration: 12,
    },
    {
      title: 'Explore',
      text: 'Drag the ray across the drop, switch on many rays, try one or two reflections, or move the Sun and watch the bows rise and sink.',
      params: { scene: 'drop', light: 'white', many: false, bounces: 1, plane: false },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0;
    const timers = [];
    let profile = null;
    let rain = [];
    let hist = [];

    const geo = () => {
      const { w, h } = api;
      const narrow = w < 700;
      const T = 84;
      const bottom = narrow ? h * 0.58 : h - 24;
      const R = narrow ? Math.min(w * 0.3, (bottom - T) * 0.36) : Math.min((bottom - T) * 0.32, w * 0.2);
      const cx = narrow ? w * 0.42 : w * 0.4;
      const cy = narrow ? T + (bottom - T) * 0.42 : T + (bottom - T) * 0.36;
      return { w, h, narrow, T, bottom, R, cx, cy };
    };

    const colours = () =>
      params.light === 'red' ? [SPECTRUM[0]] : params.light === 'violet' ? [SPECTRUM[6]] : SPECTRUM;

    function computeHist() {
      const k = +params.bounces;
      const bins = new Array(36).fill(0); // 0..72° in 2° steps
      for (const s of colours()) {
        const n = nWater(s.nm);
        for (let i = 0; i < 600; i++) {
          const a = deg(bowAngle((i + 0.5) / 600, n, k));
          if (a < 72) bins[Math.floor(a / 2)]++;
        }
      }
      hist = bins;
    }

    function drawRay(G, b, n, k, col, alpha, width) {
      const { R, cx, cy } = G;
      const S = (x, y) => [cx - x * R, cy - y * R]; // mirrored: sunlight arrives from the right
      const tr = trace(b, n, k);
      const [ex, ey] = S(...tr.exit);
      const far = Math.max(G.w, G.h) * 1.5;
      ctx.strokeStyle = col;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.beginPath();
      tr.pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](...S(...p)));
      ctx.lineTo(ex - tr.dir[0] * far, ey - tr.dir[1] * far);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return { tr, ex, ey };
    }

    function drawDrop(G) {
      const { w, h, R, cx, cy } = G;
      backdrop(ctx, w, h, { center: '#0b1430' });
      // the drop
      const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      g.addColorStop(0, 'rgba(140,190,255,0.28)');
      g.addColorStop(1, 'rgba(60,110,200,0.14)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(170,210,255,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // the Sun, off to the right
      text(ctx, '☀', w - 22, 104, { size: 22, align: 'center', color: '#ffd36b' });
      if (!api.thumbnail) text(ctx, 'sunlight', w - 40, 104, { size: 11, color: C.dim, align: 'right' });
      const k = +params.bounces;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'lighter';
      let main = null;
      if (params.many) {
        const cols = colours();
        for (let i = 0; i < 22; i++) {
          const b = 0.04 + (i / 21) * 0.95;
          for (const s of cols) {
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(w, cy - b * R);
            ctx.lineTo(cx + Math.sqrt(1 - b * b) * R, cy - b * R);
            ctx.stroke();
            drawRay(G, b, nWater(s.nm), k, s.col, cols.length > 1 ? 0.35 : 0.55, 1.2);
          }
        }
        // the bunched (Descartes) ray, highlighted
        const n0 = nWater(cols[0].nm);
        const bd = Math.sqrt((k * k + 2 * k + 1 - n0 * n0) / (k * k + 2 * k)); // where the angle peaks
        main = drawRay(G, bd, n0, k, cols[0].col, 1, 2.4);
      } else {
        const b = params.b;
        ctx.strokeStyle = 'rgba(255,248,230,0.95)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(w, cy - b * R);
        ctx.lineTo(cx + Math.sqrt(1 - b * b) * R, cy - b * R);
        ctx.stroke();
        for (const s of colours()) {
          const r = drawRay(G, b, nWater(s.nm), k, s.col, 0.9, 2);
          if (!main) main = r;
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      if (main && !api.thumbnail) {
        // angle between the outgoing ray and the line pointing back along the sunlight
        const { ex, ey, tr } = main;
        const ang = Math.atan2(-tr.dir[1], -tr.dir[0]); // screen angle of the outgoing ray
        const back = 0; // pointing right, back towards the Sun
        ctx.strokeStyle = 'rgba(233,237,247,0.45)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        const L = Math.min(170, G.w - ex - 10);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + L, ey);
        ctx.stroke();
        ctx.setLineDash([]);
        const rr = Math.min(80, L * 0.6);
        const a0 = Math.min(ang, back), a1 = Math.max(ang, back);
        if (tr.dir[0] < 0) {
          ctx.strokeStyle = C.amber;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ex, ey, rr, a0, a1);
          ctx.stroke();
          const am = (a0 + a1) / 2;
          const names = colours();
          const angs = names.map((s) => deg(bowAngle(params.b, nWater(s.nm), k)));
          const label = params.many
            ? `${k === 1 ? 'at most' : 'at least'} ${deg(extreme(nWater(names[0].nm), k)).toFixed(1)}°`
            : names.length > 1
              ? `${angs[0].toFixed(1)}° red · ${angs[angs.length - 1].toFixed(1)}° violet`
              : `${angs[0].toFixed(1)}°`;
          tag(ctx, label, ex + Math.cos(am) * (rr + 14) + 10, ey + Math.sin(am) * (rr + 14), C.amber, { align: 'left' });
        }
        if (!params.many) {
          const n = nWater(colours()[0].nm);
          const i = deg(Math.asin(params.b)), r = deg(Math.asin(params.b / n));
          tag(ctx, `in at ${i.toFixed(0)}°, bends to ${r.toFixed(0)}°`, cx, cy - R - 18, C.cyan, { align: 'center' });
        }
      }
    }

    /** The angle the rays bunch at: the largest exit angle for one reflection, the smallest for two. */
    function extreme(n, k) {
      let m = k === 1 ? 0 : Math.PI;
      for (let i = 0; i < 400; i++) {
        const a = bowAngle((i + 0.5) / 400, n, k);
        m = k === 1 ? Math.max(m, a) : Math.min(m, a);
      }
      return m;
    }

    function drawSky(G) {
      const { w, h } = G;
      const plane = params.plane;
      const horizon = plane ? h + 1000 : G.narrow ? h * 0.52 : h * 0.72;
      // stormy sky ahead, lit by the Sun behind the viewer
      const sky = ctx.createLinearGradient(0, 0, 0, plane ? h : horizon);
      sky.addColorStop(0, '#2a3550');
      sky.addColorStop(1, '#55657f');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      // where the bow is centred: opposite the Sun
      const span = plane ? Math.min(h - 100, w) * 0.5 : Math.min(horizon - 70, w * 0.5);
      const k = span / (plane ? 54 : 52); // px per degree
      const ax = w * 0.5;
      const ay = plane ? G.T + (h - G.T) * 0.45 : horizon + params.sun * k;
      if (!profile) profile = bowProfile();
      const Rmax = profile.maxA * k;
      const grad = ctx.createRadialGradient(ax, ay, 0, ax, ay, Rmax);
      for (const [p, c] of profile.stops) grad.addColorStop(p, c);
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.save();
      if (!plane) {
        ctx.beginPath();
        ctx.rect(0, 0, w, horizon);
        ctx.clip();
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ax, ay, Rmax, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // falling rain
      ctx.strokeStyle = 'rgba(200,215,235,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of rain) {
        const x = d.x * w, y = ((d.y + t * d.v) % 1) * (plane ? h : horizon);
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y + 10);
      }
      ctx.stroke();
      ctx.restore();
      if (!plane) {
        // landscape, and the viewer
        ctx.fillStyle = '#1a2a1f';
        ctx.beginPath();
        ctx.moveTo(0, horizon);
        for (let x = 0; x <= w; x += 16) ctx.lineTo(x, horizon - 8 - 6 * Math.sin(x * 0.01) - 4 * Math.sin(x * 0.031 + 2));
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();
        ctx.fillStyle = '#121c16';
        ctx.fillRect(0, horizon, w, h - horizon);
      } else {
        ctx.fillStyle = 'rgba(230,235,245,0.18)';
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.ellipse(((i * 173 + t * 6) % (w + 200)) - 100, h - 40 - (i % 3) * 18, 120, 22, 0, 0, TAU);
          ctx.fill();
        }
      }
      if (!api.thumbnail) {
        const vis = ay < horizon || plane;
        ctx.fillStyle = 'rgba(10,12,20,0.6)';
        if (vis && ay < h) {
          ctx.beginPath();
          ctx.arc(ax, ay, 5, 0, TAU);
          ctx.fill();
          tag(ctx, plane ? 'plane’s shadow' : 'your head’s shadow', ax, ay + 18, C.ink, { align: 'center' });
        }
        const p42 = 42 - params.sun, p51 = 51 - params.sun;
        if (!plane) {
          const bowTxt = p42 > 0 ? `main bow peaks ${p42.toFixed(0)}° up` : 'main bow below the horizon';
          tag(ctx, `☀ Sun ${params.sun}° up, behind you`, w - 16, 96, C.amber, { align: 'right' });
          if (!G.narrow) tag(ctx, bowTxt, w - 16, 122, p42 > 0 ? C.ink : C.red, { align: 'right' });
          else if (p42 <= 0) tag(ctx, bowTxt, w - 16, 122, C.red, { align: 'right' });
          if (p51 > 0 && !G.narrow) tag(ctx, `second bow peaks ${p51.toFixed(0)}° up`, w - 16, 148, C.dim, { align: 'right' });
          if (p42 > 6) {
            tag(ctx, '42°', ax + 42 * k * Math.cos(-1.05) + 6, ay + 42 * k * Math.sin(-1.05), C.ink, { size: 10 });
            if (p51 > 6) tag(ctx, '51°', ax + 51 * k * Math.cos(-1.05) + 6, ay + 51 * k * Math.sin(-1.05), C.dim, { size: 10 });
            if (p51 > 10) tag(ctx, 'darker band', ax - 46.5 * k * Math.cos(-1.2), ay + 46.5 * k * Math.sin(-1.2), C.dim, { align: 'center', size: 10 });
          }
        }
      }
    }

    const sim = {
      later(sec, fn) {
        timers.push({ t: t + sec, fn });
      },
      reset() {
        timers.length = 0;
      },
      resize() {
        rain = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), v: rand(0.5, 0.9) }));
      },
      onParam(k) {
        if (k === 'light' || k === 'bounces') computeHist();
      },
      pointerDown(p) {
        this.pointerMove(p);
      },
      pointerMove(p) {
        if (!p.down || params.scene !== 'drop') return;
        const G = geo();
        const b = clamp((G.cy - p.y) / G.R, 0, 0.99); // the ray hits the upper half
        api.runner.set('b', Math.round(b * 100) / 100);
        if (params.many) api.runner.set('many', false);
      },
      update(dt) {
        t += dt;
        for (let i = timers.length - 1; i >= 0; i--) if (t >= timers[i].t) timers.splice(i, 1)[0].fn();
        if (!rain.length) this.resize();
      },
      draw() {
        const G = geo();
        if (params.scene === 'sky') drawSky(G);
        else drawDrop(G);
      },
      stats() {
        const k = +params.bounces;
        if (params.scene === 'sky')
          return [
            { label: 'Sun height', value: params.sun + '°' },
            { label: 'Top of main bow', value: 42 - params.sun > 0 ? `${42 - params.sun}° above horizon` : 'below horizon', color: C.amber },
            { label: 'Top of second bow', value: 51 - params.sun > 0 ? `${51 - params.sun}° above horizon` : 'below horizon' },
          ];
        const nr = nWater(700), nv = nWater(410);
        return [
          { label: 'Ray enters at', value: deg(Math.asin(params.b)).toFixed(1) + '° to the surface normal' },
          { label: 'Water bends red by', value: `n = ${nr.toFixed(3)}` },
          { label: 'Water bends violet by', value: `n = ${nv.toFixed(3)}` },
          { label: 'Red leaves at', value: deg(bowAngle(params.b, nr, k)).toFixed(1) + '°', color: '#ff6b6b' },
          { label: 'Violet leaves at', value: deg(bowAngle(params.b, nv, k)).toFixed(1) + '°', color: C.violet },
          { label: 'Brightest angle (red)', value: deg(extreme(nr, k)).toFixed(1) + '°', color: C.amber },
        ];
      },
      charts() {
        if (params.scene === 'sky') return null;
        if (!hist.length) computeHist();
        return [{ title: `Where the drop sends ${params.light === 'white' ? 'sunlight' : params.light + ' light'} (rays per 2°)`, kind: 'bars', series: [{ data: hist, color: params.light === 'violet' ? C.violet : params.light === 'red' ? C.red : C.amber }], min: 0, xLabel: '0° → 72° from the anti-sun direction' }];
      },
    };
    return sim;
  },
};
