import { C, TAU, clamp, lerp, tag, text, arrow, rand } from '../../core/util.js';

// Circulation of the tornado's core, m²/s: a Rankine vortex with core radius rc has top speed Γ/(2π rc).
const GAMMA = 2 * Math.PI * 7500;
const CLOUD = 1000; // cloud base height, m
const TS = 2; // the tornado scene runs twice as fast as real time
const EF = [
  { min: 0, name: 'Below EF0', dmg: 'no real damage' },
  { min: 105, name: 'EF0', dmg: 'roof tiles and branches torn off' },
  { min: 138, name: 'EF1', dmg: 'windows smashed, roof badly damaged' },
  { min: 179, name: 'EF2', dmg: 'roof torn off' },
  { min: 219, name: 'EF3', dmg: 'roof and some walls gone' },
  { min: 267, name: 'EF4', dmg: 'house flattened' },
  { min: 323, name: 'EF5', dmg: 'house swept off its foundations' },
];
const vmaxOf = (rc) => GAMMA / (2 * Math.PI * rc); // m/s
const efOf = (kmh) => EF.reduce((a, e, i) => (kmh >= e.min ? i : a), 0);

export default {
  id: 'tornado',
  title: 'How Tornadoes Form',
  category: 'earth',
  tagline: 'Wind shear rolls the air into a spinning tube, a storm stands it upright, and shrinking makes it spin faster.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Weather', 'Forces', 'Fluids'],
  keywords: ['tornado', 'twister', 'supercell', 'wind shear', 'vortex', 'angular momentum', 'Fujita scale'],
  blurb:
    'Tornadoes are the most violent winds on Earth. They start when wind blowing faster and from a different direction high up makes a horizontal roll of spinning air near the ground. A thunderstorm’s updraft tips the roll upright into a rotating storm, and as the spinning column is stretched and squeezed it speeds up, like a skater pulling in their arms, until it touches down.',
  ideas: [
    '<b>Wind shear</b>: wind that is faster higher up rolls the air between into a horizontal spinning tube.',
    'A thunderstorm’s strong <b>updraft</b> lifts the middle of the tube and tilts it upright.',
    'The storm’s rotating updraft (a <b>mesocyclone</b>) makes a rotating thunderstorm: a <b>supercell</b>.',
    'As the spinning column narrows it spins faster: speed × radius stays the same (<b>conservation of angular momentum</b>).',
    'Low pressure in the core cools the air until water vapour condenses into the visible <b>funnel</b>.',
    'Damage is rated on the <b>Enhanced Fujita</b> scale, from EF0 to EF5 (over 320 km/h).',
  ],
  hint: 'Change the width of the spinning column and watch its speed',
  thumbChapter: 4,
  thumbFrames: 260,
  params: [
    { key: 'scene', label: 'Scene', type: 'select', value: 'shear', options: [{ value: 'shear', label: 'Wind shear and updraft' }, { value: 'tornado', label: 'The tornado' }] },
    { key: 'lift', label: 'Updraft lifts the tube', type: 'range', min: 0, max: 1, step: 0.01, value: 0, format: (v) => Math.round(v * 100) + '%' },
    { key: 'width', label: 'Core width', type: 'range', min: 60, max: 500, step: 5, value: 150, format: (v) => `${Math.round(v * 2)} m across` },
    { key: 'touch', label: 'Funnel reaches down', type: 'range', min: 0, max: 1, step: 0.01, value: 1, format: (v) => Math.round(v * 100) + '%' },
  ],
  story: [
    {
      title: 'Wind shear',
      text: 'Before a big storm, the wind near the ground is slowed by friction while the wind a kilometre up blows much <b>faster</b>. Air caught in between is rolled over and over, like a pencil between your hands: a <b>horizontal tube of spinning air</b>, invisible and often kilometres long.',
      params: { scene: 'shear', lift: 0 },
      duration: 13,
    },
    {
      title: 'Tipped upright',
      text: 'A thunderstorm’s powerful <b>updraft</b> sucks air upwards at up to 150 km/h. It lifts the middle of the spinning tube and bends it into an arch, so now there are two <b>upright</b> spinning columns: one turning clockwise, one anticlockwise.',
      params: { scene: 'shear', lift: 0 },
      enter: (s, r) => s.later(1.5, () => r.set('lift', 1, 6)),
      duration: 14,
    },
    {
      title: 'A rotating storm',
      text: 'When the updraft is centred on one of the columns, the whole storm starts turning: a <b>supercell</b> with a rotating core called a <b>mesocyclone</b>, several kilometres wide. Beneath it a lowered, slowly turning <b>wall cloud</b> may appear.',
      params: { scene: 'tornado', touch: 0, width: 450 },
      tween: 2,
      duration: 13,
    },
    {
      title: 'Narrower and faster',
      text: 'The updraft stretches the spinning column upwards and squeezes it thinner. Like a skater pulling in their arms, it <b>spins faster as it narrows</b>: speed × radius stays about the same. Watch the speed as the column shrinks.',
      formula: 'v₁ r₁ = v₂ r₂',
      params: { scene: 'tornado', touch: 0.5, width: 450 },
      enter: (s, r) => s.later(2, () => r.set('width', 120, 6)),
      check: {
        q: 'A spinning column of air shrinks to a third of its width. Roughly how fast does its wind blow now?',
        options: ['A third as fast', 'Just as fast', 'Three times as fast'],
        answer: 2,
        explain: 'Speed × radius stays the same as the air is squeezed inwards, so a third of the radius means three times the speed. That is how a broad, gentle rotation becomes a violent tornado.',
      },
      duration: 15,
    },
    {
      title: 'Touchdown',
      text: 'Pressure in the core drops sharply. The air cools as it expands and its water vapour condenses into the visible <b>funnel</b>. A tornado is born when the spinning column touches the ground; it sucks in air along the surface and flings up a swirling cloud of <b>dust and debris</b>.',
      params: { scene: 'tornado', touch: 0.15, width: 120 },
      enter: (s, r) => s.later(1.5, () => r.set('touch', 1, 5)),
      duration: 14,
    },
    {
      title: 'Measuring the damage',
      text: 'Nobody can put an instrument in a tornado’s path, so its strength is judged from the <b>damage</b> it does, on the Enhanced Fujita scale. Most tornadoes are EF0 or EF1, but a narrow, violent EF5 can top 320 km/h and sweep a house off its foundations.',
      params: { scene: 'tornado', touch: 1, width: 300 },
      enter: (s, r) => s.later(3, () => r.set('width', 65, 8)),
      duration: 15,
    },
    {
      title: 'Explore',
      text: 'Lift the tube in the wind-shear scene, or in the tornado scene change the core width and let the funnel come down or go back up into the cloud.',
      params: { scene: 'tornado', touch: 1, width: 140 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0, phi = 0;
    const timers = [];
    let parts = [];

    const lay = () => {
      const { w, h } = api;
      const narrow = w < 700;
      const T = 84;
      const ground = narrow ? Math.round(h * 0.58) : Math.round(h * 0.84);
      return { w, h, narrow, T, ground };
    };

    // ------------------------------------------------------------ shear scene
    const SH = { rt: 0.27, Lz: 1.1, y0: 0.5, Hup: 1.3 };
    const axis = (s, lift) => {
      const bump = (1 - s * s) ** 1.6;
      const y = SH.y0 + lift * SH.Hup * bump;
      const dy = lift * SH.Hup * 1.6 * (1 - s * s) ** 0.6 * (-2 * s);
      const len = Math.hypot(dy, SH.Lz);
      return { y, z: s * SH.Lz, ty: dy / len, tz: SH.Lz / len };
    };

    function drawShear(L) {
      const { w, h, ground } = L;
      const sky = ctx.createLinearGradient(0, 0, 0, ground);
      sky.addColorStop(0, '#0c1428');
      sky.addColorStop(1, '#2a3448');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      const S = Math.min((ground - L.T - 30) / 2.35, w * (L.narrow ? 0.4 : 0.3));
      const cx = L.narrow ? w * 0.5 : w * 0.56;
      // oblique view: distance recedes up and to the left, so the tube's near end sits lower right
      const P = (x, y, z) => [cx + (x - z * 0.5) * S, ground - (y + z * 0.3) * S];
      const lift = params.lift;
      // ground plane, receding
      ctx.fillStyle = '#18261c';
      ctx.fillRect(0, ground, w, h - ground);
      // the storm cloud overhead
      const cy = ground - (SH.y0 + SH.Hup + 0.3) * S;
      ctx.fillStyle = `rgba(70,78,98,${0.35 + 0.5 * lift})`;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.ellipse(cx + (i - 4) * S * 0.28 + S * 0.25, cy - Math.abs(i - 4) * 4 - 10, S * 0.32, S * 0.18, 0, 0, TAU);
        ctx.fill();
      }
      // wind profile on the left: faster higher up
      const ax = L.narrow ? 12 : Math.max(16, cx - S * 1.9);
      for (let k = 0; k < 6; k++) {
        const y = 0.08 + k * 0.36;
        const sy = ground - y * S;
        if (sy < L.T + 6) continue;
        const len = S * (0.12 + 0.11 * k) * (L.narrow ? 0.7 : 1);
        arrow(ctx, ax, sy, ax + len, sy, `rgba(150,210,255,${0.45 + 0.08 * k})`, 2, 8);
      }
      if (!api.thumbnail) {
        text(ctx, 'fast wind', ax, ground - 0.08 * S - 5 * 0.36 * S - 14, { size: 11, color: C.cyan });
        text(ctx, 'slow wind', ax, ground - 0.08 * S + 14, { size: 11, color: C.dim });
      }
      // updraft
      if (lift > 0.02) {
        const a = clamp(lift * 1.5, 0, 1);
        const [ux, uy0] = P(0, SH.y0 - 0.15, 0);
        const [, uy1] = P(0, SH.y0 + SH.Hup + 0.15, 0);
        ctx.globalAlpha = a;
        arrow(ctx, ux - S * 0.45, uy0, ux - S * 0.45, uy1, 'rgba(255,181,71,0.85)', 4, 14);
        ctx.globalAlpha = 1;
        if (!api.thumbnail) tag(ctx, 'updraft', ux - S * 0.45, (uy0 + uy1) / 2, C.amber, { align: 'center' });
      }
      // the spinning tube: lines on its surface, split into the far and near sides
      const VX = -0.5, VY = 0.3, VZ = -1; // towards the viewer
      const back = new Path2D(), front = new Path2D();
      const NL = 10, NS = 44;
      for (let k = 0; k < NL; k++) {
        const ph = phi + (k * TAU) / NL;
        let prev = null, prevFront = false;
        for (let i = 0; i <= NS; i++) {
          const s = -1 + (2 * i) / NS;
          const A = axis(s, lift);
          const c = Math.cos(ph), sn = Math.sin(ph);
          // normal = cos φ · x̂ + sin φ · (0, tz, −ty)
          const nx = c, ny = sn * A.tz, nz = -sn * A.ty;
          const p = P(nx * SH.rt, A.y + ny * SH.rt, A.z + nz * SH.rt);
          const isFront = nx * VX + ny * VY + nz * VZ > 0;
          if (prev) {
            const path = isFront && prevFront ? front : back;
            path.moveTo(prev[0], prev[1]);
            path.lineTo(p[0], p[1]);
          }
          prev = p;
          prevFront = isFront;
        }
      }
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(140,190,255,0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke(back);
      ctx.strokeStyle = 'rgba(190,230,255,0.85)';
      ctx.lineWidth = 1.8;
      ctx.stroke(front);
      // the near end of the tube, seen end-on: spokes show it rolling (top moving with the fast wind)
      const capA = clamp(1 - lift * 3, 0, 1);
      if (capA > 0) {
        const A = axis(-1, lift);
        const [ex, ey] = P(0, A.y, A.z);
        const rr = SH.rt * S;
        ctx.globalAlpha = capA;
        ctx.fillStyle = 'rgba(120,170,240,0.18)';
        ctx.strokeStyle = 'rgba(190,230,255,0.9)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, rr, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = -phi + (k * TAU) / 6;
          ctx.moveTo(ex + Math.cos(a) * rr * 0.15, ey + Math.sin(a) * rr * 0.15);
          ctx.lineTo(ex + Math.cos(a) * rr * 0.9, ey + Math.sin(a) * rr * 0.9);
        }
        ctx.stroke();
        // curved arrow: clockwise on screen
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ex, ey, rr * 1.25, -2.3, -0.5);
        ctx.stroke();
        const ta = -0.5;
        const hx = ex + Math.cos(ta) * rr * 1.25, hy = ey + Math.sin(ta) * rr * 1.25;
        arrow(ctx, hx - 6 * Math.cos(ta + Math.PI / 2), hy - 6 * Math.sin(ta + Math.PI / 2), hx, hy, C.amber, 2, 9);
        ctx.globalAlpha = 1;
      }
      if (!api.thumbnail) {
        if (lift < 0.35) {
          const [tx, ty] = P(0, SH.y0 + SH.rt + 0.16, SH.Lz * 0.2);
          tag(ctx, 'rolling tube of air', tx, ty, C.ink, { align: 'center' });
        } else if (lift > 0.6) {
          const [bx, by] = P(-0.3, axis(0.72, lift).y, 0.72 * SH.Lz);
          const [fx, fy] = P(0.3, axis(-0.72, lift).y, -0.72 * SH.Lz);
          tag(ctx, '↺ anticlockwise', bx - 10, by, C.lime, { align: 'right' });
          tag(ctx, '↻ clockwise', fx + 10, fy, C.pink);
        }
      }
    }

    // ------------------------------------------------------------ tornado scene
    function spawn(full) {
      const touch = params.touch;
      const tip = CLOUD * (1 - touch);
      if (touch > 0.9 && (!full || Math.random() < 0.6)) return { r: rand(200, 1000), th: rand(TAU), z: rand(0, 60) };
      return { r: rand(params.width * 0.8, 900), th: rand(TAU), z: rand(Math.max(tip, CLOUD * 0.55), CLOUD) };
    }

    function updateTornado(dt) {
      const rc = params.width, vmax = vmaxOf(rc);
      const touch = params.touch;
      const down = touch > 0.9;
      while (parts.length < 420) parts.push(spawn(true));
      const sdt = dt * TS;
      for (const p of parts) {
        const r = Math.max(5, p.r);
        const vt = vmax * (r < rc ? r / rc : rc / r) * (down ? 1 : 0.6);
        p.th += (vt / r) * sdt;
        if (down && p.z < 150) p.r -= 24 * sdt * (r > rc * 0.9 ? 1 : 0.1);
        if (r < rc * 1.3 && down) p.z += 35 * sdt;
        else if (p.z > CLOUD * 0.5) p.z += (r < rc * 2 ? 10 : 2) * sdt;
        if (p.z > CLOUD * 0.75 && r < 500) p.r += 8 * sdt;
        if (p.z > CLOUD * 1.02 || p.r > 1100 || (!down && p.z < CLOUD * (1 - touch) - 20)) Object.assign(p, spawn(false));
      }
    }

    function drawHouse(x, y, s, lvl) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.fillStyle = '#3a3f4c';
      ctx.fillRect(-30, -2, 60, 4); // foundation
      if (lvl >= 6) return void ctx.restore();
      if (lvl === 5) {
        ctx.fillStyle = '#6b6258';
        ctx.beginPath();
        ctx.moveTo(-26, -2);
        ctx.lineTo(-14, -12);
        ctx.lineTo(-2, -7);
        ctx.lineTo(8, -14);
        ctx.lineTo(24, -2);
        ctx.fill();
        return void ctx.restore();
      }
      // walls (EF3 knocks the top of one down)
      ctx.fillStyle = '#7c8394';
      ctx.beginPath();
      ctx.moveTo(-24, -2);
      ctx.lineTo(-24, -30);
      if (lvl >= 4) {
        ctx.lineTo(-6, -30);
        ctx.lineTo(4, -20);
        ctx.lineTo(14, -24);
        ctx.lineTo(24, -12);
      } else ctx.lineTo(24, -30);
      ctx.lineTo(24, -2);
      ctx.fill();
      ctx.fillStyle = lvl >= 2 ? '#14161d' : 'rgba(255,210,120,0.85)';
      ctx.fillRect(-16, -22, 9, 9);
      if (lvl < 4) ctx.fillRect(7, -22, 9, 9);
      ctx.fillStyle = '#3a2a22';
      ctx.fillRect(-3, -16, 7, 14);
      if (lvl <= 2) {
        ctx.fillStyle = '#8a3b32';
        ctx.beginPath();
        ctx.moveTo(-30, -30);
        ctx.lineTo(0, -50);
        ctx.lineTo(30, -30);
        ctx.fill();
        if (lvl >= 1) {
          ctx.fillStyle = '#1a1d26';
          const holes = lvl === 1 ? [[-10, -38], [12, -35]] : [[-14, -36], [-2, -44], [10, -37], [18, -33], [-20, -32]];
          for (const [hx, hy] of holes) ctx.fillRect(hx, hy, 5, 3);
        }
      } else if (lvl === 3) {
        ctx.strokeStyle = '#5b3f2c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-24, -30);
        ctx.lineTo(-10, -40);
        ctx.moveTo(10, -30);
        ctx.lineTo(16, -36);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawTornado(L) {
      const { w, h, ground } = L;
      const top = L.T + (L.narrow ? 8 : 20);
      const Sv = (ground - top - 30) / CLOUD;
      const Sh = Math.min(w * 0.92, 1100) / 2400;
      const cx = L.narrow ? w * 0.42 : w * 0.56;
      const Y = (z) => ground - z * Sv;
      const rc = params.width, touch = params.touch;
      const down = touch > 0.9;
      const vmax = vmaxOf(rc);
      // dark stormy sky
      const sky = ctx.createLinearGradient(0, 0, 0, ground);
      sky.addColorStop(0, '#141a26');
      sky.addColorStop(1, '#3d4656');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      // ground
      ctx.fillStyle = '#1f2a1c';
      ctx.fillRect(0, ground, w, h - ground);
      const tip = CLOUD * (1 - touch);
      // particles: split by side (behind / in front of the funnel) and by height (dust / cloud)
      const pb = [[], []], pf = [[], []];
      for (const p of parts) {
        const x = cx + p.r * Math.cos(p.th) * Sh;
        const d = p.r * Math.sin(p.th);
        const y = Y(p.z) + d * Sh * 0.22;
        (d > 0 ? pf : pb)[p.z < 250 ? 0 : 1].push(x, y);
      }
      const dots = (arr, col, r) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 2) {
          ctx.moveTo(arr[i] + r, arr[i + 1]);
          ctx.arc(arr[i], arr[i + 1], r, 0, TAU);
        }
        ctx.fill();
      };
      dots(pb[0], 'rgba(150,120,90,0.45)', 1.6);
      dots(pb[1], 'rgba(170,180,195,0.3)', 1.6);
      // debris cloud at the base
      if (down) {
        const g = ctx.createRadialGradient(cx, ground - 8, 4, cx, ground - 8, rc * Sh * 3 + 30);
        g.addColorStop(0, 'rgba(130,105,80,0.75)');
        g.addColorStop(1, 'rgba(130,105,80,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, ground - 10, rc * Sh * 3 + 30, (rc * Sh * 3 + 30) * 0.4, 0, 0, TAU);
        ctx.fill();
      }
      // the condensation funnel, widening up into the cloud
      const rf = (z) => {
        const u = z / CLOUD;
        let r = rc * 0.75 * (1 + 2.2 * u ** 3);
        r *= clamp((z - tip) / 90, 0, 1) ** 0.5;
        return r * Sh;
      };
      if (touch > 0.02) {
        const n = 40;
        const pts = [];
        for (let i = 0; i <= n; i++) {
          const z = lerp(tip, CLOUD, i / n);
          pts.push([z, rf(z)]);
        }
        const fg = ctx.createLinearGradient(cx - rc * Sh * 2, 0, cx + rc * Sh * 2, 0);
        fg.addColorStop(0, 'rgba(90,96,110,0.95)');
        fg.addColorStop(0.45, 'rgba(165,172,186,0.95)');
        fg.addColorStop(1, 'rgba(80,86,100,0.95)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        pts.forEach(([z, r], i) => ctx[i ? 'lineTo' : 'moveTo'](cx - r, Y(z)));
        for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(cx + pts[i][1], Y(pts[i][0]));
        ctx.fill();
        // bands moving across the front of the funnel show it turning
        ctx.strokeStyle = 'rgba(60,64,76,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const om = vmax / rc;
        for (let j = 0; j < 14; j++) {
          const z = lerp(tip, CLOUD * 0.97, (j + 0.5) / 14);
          const r = rf(z);
          if (r < 2) continue;
          for (let k = 0; k < 3; k++) {
            const a = ((t * om * TS + (k * TAU) / 3 + j * 0.7) % TAU + TAU) % TAU;
            if (a > Math.PI) continue; // only the near side
            const a2 = Math.min(Math.PI, a + 0.5);
            ctx.moveTo(cx + r * Math.cos(a), Y(z) + r * 0.22 * Math.sin(a));
            ctx.ellipse(cx, Y(z), r, r * 0.22, 0, a, a2);
          }
        }
        ctx.stroke();
      }
      dots(pf[0], 'rgba(170,135,100,0.7)', 1.8);
      dots(pf[1], 'rgba(200,208,220,0.45)', 1.8);
      // the cloud base, with a lowered, rotating wall cloud
      const cb = Y(CLOUD);
      const cg = ctx.createLinearGradient(0, 0, 0, cb + 10);
      cg.addColorStop(0, '#20252f');
      cg.addColorStop(1, '#3a404c');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, w, cb);
      ctx.fillStyle = '#353b47';
      ctx.beginPath();
      ctx.ellipse(cx, cb, Math.min(w * 0.3, 900 * Sh), 22, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(25,28,36,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (t * 0.25 + k / 6) % 1;
        const rx = Math.min(w * 0.28, 850 * Sh) * Math.cos(a * Math.PI);
        ctx.moveTo(cx + rx - 10, cb + 8 + 10 * Math.sin(a * Math.PI));
        ctx.lineTo(cx + rx + 10, cb + 8 + 10 * Math.sin(a * Math.PI));
      }
      ctx.stroke();
      // a house off to the side shows what this wind would do
      const kmh = vmax * 3.6;
      const lvl = down ? efOf(kmh) : 0;
      const hx = Math.min(w - 40, cx + (L.narrow ? 0.5 : 0.3) * w);
      drawHouse(hx, ground, clamp(w / 900, 0.6, 1.1), lvl);
      if (!api.thumbnail) {
        // speed arrows at the edge of the core
        if (touch > 0.3) {
          const z = Math.max(tip + 60, 200);
          const r = rc * Sh;
          const len = clamp(vmax * 0.6, 8, 70);
          arrow(ctx, cx - len / 2, Y(z) + r * 0.22 + 6, cx + len / 2, Y(z) + r * 0.22 + 6, C.amber, 2.2, 8);
        }
        const e = EF[efOf(kmh)];
        tag(ctx, `${Math.round(kmh)} km/h winds`, w - 16, 96, C.amber, { align: 'right', size: 12 });
        tag(ctx, down ? `${e.name}: ${e.dmg}` : 'not touching the ground yet', w - 16, 122, down ? (lvl >= 4 ? C.red : C.ink) : C.dim, { align: 'right' });
        tag(ctx, `core ${Math.round(rc * 2)} m across`, w - 16, 148, C.cyan, { align: 'right' });
      }
    }

    return {
      later(sec, fn) {
        timers.push({ t: t + sec, fn });
      },
      reset() {
        timers.length = 0;
        parts = [];
      },
      onParam(k) {
        if (k === 'scene') parts = [];
      },
      update(dt) {
        t += dt;
        for (let i = timers.length - 1; i >= 0; i--) if (t >= timers[i].t) timers.splice(i, 1)[0].fn();
        if (params.scene === 'shear') phi -= dt * 1.6;
        else updateTornado(dt);
      },
      draw() {
        const L = lay();
        if (params.scene === 'shear') drawShear(L);
        else drawTornado(L);
      },
      stats() {
        if (params.scene === 'shear')
          return [
            { label: 'Tube tilted upright', value: Math.round(params.lift * 90) + '°' },
            { label: 'Wind near the ground', value: '15 km/h' },
            { label: 'Wind 1 km up', value: '70 km/h', color: C.cyan },
          ];
        const vmax = vmaxOf(params.width);
        const kmh = vmax * 3.6;
        const down = params.touch > 0.9;
        return [
          { label: 'Core width', value: `${Math.round(params.width * 2)} m` },
          { label: 'Top wind speed', value: `${Math.round(kmh)} km/h`, color: C.amber },
          { label: 'One turn of the core takes', value: ((TAU * params.width) / vmax).toFixed(0) + ' s' },
          { label: 'Rating', value: down ? EF[efOf(kmh)].name : '— (not touched down)', color: down && efOf(kmh) >= 4 ? C.red : C.ink },
        ];
      },
    };
  },
};

