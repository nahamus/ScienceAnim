import { C, TAU, clamp, drawGlow, roundRect, tag, text } from '../../core/util.js';

// Two scenes.
// Tides: Earth seen from above the North Pole. The tidal acceleration from a body in direction φ, at angle θ on the
// Earth, is ∝ (2cos(θ−φ), −sin(θ−φ)) in that body's frame, and raises the sea by ∝ cos 2(θ−φ). The Sun's effect is
// 0.46 of the Moon's. (Heights hugely exaggerated, and the real bulges are dragged a little ahead by Earth's spin.)
// Roche limit: a rubble-pile moon of grains held together only by their own gravity, with soft contacts,
// orbits a planet (G = M = 1). Inside the Roche limit the planet's tide beats the moon's self-gravity and it
// shears into a ring.

const SUN = 0.46;
const NG = 91; // grains: a hexagonal pile, 5 rings round a centre
const MOON_M = 1.2e-4, MOON_R = 0.055;
// Roche limit for this rubble pile, found by experiment with this very simulation: ≈ 2.1 planet radii
const ROCHE = 1.9 * MOON_R * (1 / MOON_M) ** (1 / 3);

export default {
  id: 'tides',
  title: 'Tides and the Roche Limit',
  category: 'astronomy',
  tagline: 'Why the sea rises twice a day, why we only see one side of the Moon, and how moons become rings.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Space', 'Gravity', 'Earth'],
  keywords: ['tides', 'tidal force', 'high tide', 'spring tide', 'neap tide', 'tidal locking', 'Roche limit', 'Saturn rings', 'Phobos', 'tidal bulge', 'Moon', 'gravity gradient'],
  blurb:
    'The Moon’s gravity pulls harder on the side of the Earth facing it than on the far side. That difference, the tidal force, stretches the oceans into two bulges, so most coasts get two high tides a day. The same stretching has locked the Moon’s face towards us, and a moon that strays too close to its planet gets stretched so hard that it is torn apart into a ring.',
  ideas: [
    'Gravity weakens with distance, so the Moon pulls the near side of the Earth more than the centre, and the centre more than the far side.',
    'Relative to the Earth’s centre, the near side is pulled <b>towards</b> the Moon and the far side is left <b>behind</b>: two bulges.',
    'Earth spins under the bulges, giving <b>two high tides</b> a day. The Sun adds its own, weaker tide: <b>spring</b> and <b>neap</b> tides.',
    'Tides on the Moon slowed its spin until it became <b>tidally locked</b>: it turns once per orbit and always shows us the same face.',
    'Inside the <b>Roche limit</b>, a planet’s tide is stronger than the gravity holding a moon together, and the moon is torn into a ring.',
  ],
  hint: 'Watch the town on the coast ride through the bulges',
  thumbChapter: 7,
  thumbFrames: 300,
  params: [
    {
      key: 'scene', label: 'Scene', type: 'select', value: 'earth', instant: true,
      options: [{ value: 'earth', label: 'Earth’s tides' }, { value: 'roche', label: 'Roche limit' }],
    },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.2, max: 4, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'sun', label: 'Include the Sun’s tide', type: 'toggle', value: false },
    { key: 'arrows', label: 'Show tidal forces', type: 'toggle', value: true },
    { key: 'pulls', label: 'Show the Moon’s pull at 3 points', type: 'toggle', value: false },
    { key: 'start', label: 'Moon’s starting distance (Roche limits)', type: 'range', min: 0.7, max: 2.2, step: 0.05, value: 1.3, instant: true, format: (v) => v.toFixed(2) + '×' },
    { key: 'drift', label: 'Moon spirals inwards', type: 'toggle', value: true },
    { key: 'restart', label: 'Restart', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'Two bulges',
      text: 'Here is the Earth seen from above the North Pole, with the Moon going round it (not to scale, and the ocean’s bulges exaggerated about 100,000 times). The sea is pulled into two bulges: one facing the Moon and one on the opposite side. The Earth spins underneath them, so the coastal town passes through two high tides and two low tides each day.',
      params: { scene: 'earth', speed: 1, sun: false, arrows: false, pulls: false },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Why the far side bulges too',
      text: 'Gravity weakens with distance. The Moon pulls the near side of the Earth hardest, the centre a little less, and the far side least (the three arrows). Take away the average pull on the whole Earth and what is left, the <b>tidal force</b>, points away from the centre on both sides. The near side is pulled ahead of the Earth; the far side gets left behind.',
      formula: 'tidal stretch ∝ M ÷ d³',
      params: { scene: 'earth', speed: 0.6, sun: false, arrows: true, pulls: true },
      duration: 16,
    },
    {
      title: 'Spring and neap tides',
      text: 'The Sun raises tides too, about half as strong as the Moon’s: it is far heavier, but much farther away, and the tidal stretch falls with distance cubed. When Sun and Moon line up, at new and full moon, their bulges add up: big <b>spring tides</b>. At half moon they pull across each other: small <b>neap tides</b>. Watch the tide graph grow and shrink over the month.',
      check: {
        q: 'When are the highest (spring) tides?',
        options: ['At new moon and full moon', 'Only at full moon', 'At half moon'],
        answer: 0,
        setup: { scene: 'earth', speed: 6, sun: true, arrows: true, pulls: false },
        explain: 'Each body stretches the Earth along the line pointing at it, in both directions. At new moon and at full moon the Sun and the Moon lie on the same line, so their bulges stack, whichever side the Moon is on.',
      },
      params: { scene: 'earth', speed: 6, sun: true, arrows: true, pulls: false },
      duration: 18,
    },
    {
      title: 'Tidal locking',
      text: 'The Earth raises much bigger tides in the rocks of the Moon. Long ago the Moon spun faster, and its bulges were always carried slightly out of line with the Earth. Earth’s pull on those bulges acted as a brake until the Moon turned exactly once per orbit. Now it always shows us the same face. The same braking is slowly lengthening our day and pushing the Moon away, by 3.8 cm a year.',
      params: { scene: 'earth', speed: 4, sun: false, arrows: false, pulls: false },
      enter: (s) => s.spinMoon(),
      duration: 18,
    },
    {
      title: 'Too close: the Roche limit',
      text: 'Now a small moon made of loose rubble, held together only by its own gravity, slowly spirals in towards a giant planet. Tidal stretching grows fast as it gets closer (as 1 ÷ distance³). Inside the dashed line, the <b>Roche limit</b>, the planet’s tide pulling the moon apart is stronger than the moon’s own gravity holding it together. Watch what happens once it crosses.',
      params: { scene: 'roche', start: 1.25, drift: true, speed: 1.6, arrows: true },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'A ring is born',
      text: 'Inside the limit the moon stretches, sheds rubble from its near and far ends, and breaks up. Each piece then orbits at its own speed (inner ones faster), so the debris smears out into a ring. Saturn’s rings may have formed like this, from a moon torn apart perhaps a few hundred million years ago. Mars’s moon Phobos is spiralling in and should break into a ring in 30 to 50 million years.',
      check: {
        q: 'Why does the debris spread into a whole ring instead of staying in a clump?',
        options: ['Closer pieces orbit faster, so they pull ahead of farther ones', 'The planet pushes the pieces apart', 'The pieces repel each other'],
        answer: 0,
        setup: { scene: 'roche', start: 0.9, drift: false, speed: 1, arrows: true },
        explain: 'Without enough gravity of its own to hold it together, each piece follows its own orbit. Inner orbits are faster (like Mercury versus Neptune), so the inner debris races ahead and the outer falls behind, until the pieces wrap all the way round.',
      },
      params: { scene: 'roche', start: 0.9, drift: false, speed: 1.6, arrows: true },
      enter: (s) => s.restart(),
      duration: 20,
    },
    {
      title: 'Your turn',
      text: 'Start the rubble moon at different distances. Outside the Roche limit it holds together; inside, it falls apart. Or switch back to the Earth and play with the Sun’s tide.',
      params: { scene: 'roche', start: 1.15, drift: true, speed: 1.2, arrows: true },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    // ---------------------------------------------------------------- Earth scene state
    let hours = 0, phase0 = 2.2, moonSpin = 0, moonOmega = 0, spinning = false;
    const gauge = [];
    // ---------------------------------------------------------------- Roche scene state
    const gx = new Float64Array(NG), gy = new Float64Array(NG), vx = new Float64Array(NG), vy = new Float64Array(NG);
    let tR = 0, broken = false, gr = 0;
    const gm = MOON_M / NG;

    const earthGeom = () => {
      const { w, h } = api;
      const phone = w < 760;
      const m = Math.min(w, h);
      return phone
        ? { phone, cx: w * 0.5, cy: h * 0.44, Re: w * 0.13, Ro: Math.min(w * 0.4, h * 0.3) }
        : { phone, cx: w * 0.5, cy: h * 0.45, Re: m * 0.12, Ro: Math.min(w * 0.3, h * 0.36) };
    };
    const moonAng = () => phase0 + (TAU * hours) / (27.32 * 24);
    const spinAng = () => (TAU * hours) / 23.93;
    const seaHeight = (th) => Math.cos(2 * (th - moonAng())) + (params.sun ? SUN * Math.cos(2 * th) : 0);

    function restartEarth() {
      hours = 0;
      gauge.length = 0;
      spinning = false;
    }
    function restartRoche() {
      // pack the grains into a disc, spinning once per orbit (as if already tidally locked)
      const d0 = params.start * ROCHE;
      const sp = 2 * GRAIN * 0.99;
      let k = 0;
      for (let ring = 0; k < NG; ring++) {
        const n = ring === 0 ? 1 : ring * 6;
        for (let j = 0; j < n && k < NG; j++, k++) {
          const a = (TAU * j) / n + ring * 0.3;
          const r = ring * sp;
          gx[k] = d0 + r * Math.cos(a);
          gy[k] = r * Math.sin(a);
        }
      }
      const W = Math.sqrt(1 / d0 ** 3); // orbital angular speed
      for (let i = 0; i < NG; i++) {
        vx[i] = -W * gy[i];
        vy[i] = W * gx[i];
      }
      tR = 0;
      broken = false;
      gr = 0;
    }

    const GRAIN = MOON_R / 10; // contact radius
    function stepRoche(dt) {
      const ax = new Float64Array(NG), ay = new Float64Array(NG);
      const soft2 = (GRAIN * 2) ** 2;
      for (let i = 0; i < NG; i++) {
        const r2 = gx[i] * gx[i] + gy[i] * gy[i];
        const f = -1 / (r2 * Math.sqrt(r2));
        ax[i] += f * gx[i];
        ay[i] += f * gy[i];
        for (let j = i + 1; j < NG; j++) {
          const dx = gx[j] - gx[i], dy = gy[j] - gy[i];
          const d2 = dx * dx + dy * dy;
          // self-gravity (softened)
          const g = gm / ((d2 + soft2) * Math.sqrt(d2 + soft2));
          let fx = g * dx, fy = g * dy;
          // soft contact with damping
          const D = 2 * GRAIN;
          if (d2 < D * D) {
            const d = Math.sqrt(d2) || 1e-6;
            const over = D - d;
            const nx = dx / d, ny = dy / d;
            const rv = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
            const push = 400 * over - 8 * rv;
            fx -= push * nx;
            fy -= push * ny;
          }
          ax[i] += fx;
          ay[i] += fy;
          ax[j] -= fx;
          ay[j] -= fy;
        }
      }
      // slow inward drift while the moon is in one piece (stands in for tides raised on the planet)
      // (it acts on the moon as a whole, so it doesn't damp the grains' motion relative to each other)
      const drag = params.drift && !broken ? 0.0016 : 0;
      let cvx = 0, cvy = 0;
      for (let i = 0; i < NG; i++) {
        cvx += vx[i] / NG;
        cvy += vy[i] / NG;
      }
      for (let i = 0; i < NG; i++) {
        vx[i] += (ax[i] - drag * cvx) * dt;
        vy[i] += (ay[i] - drag * cvy) * dt;
        gx[i] += vx[i] * dt;
        gy[i] += vy[i] * dt;
      }
      tR += dt;
    }
    function moonCentre() {
      let x = 0, y = 0;
      for (let i = 0; i < NG; i++) {
        x += gx[i];
        y += gy[i];
      }
      x /= NG;
      y /= NG;
      let s = 0;
      for (let i = 0; i < NG; i++) s += (gx[i] - x) ** 2 + (gy[i] - y) ** 2;
      let rm = 0;
      for (let i = 0; i < NG; i++) rm += Math.hypot(gx[i], gy[i]);
      // d: the typical distance of the moon's material from the planet (still right once it is a ring)
      return { x, y, d: rm / NG, spread: Math.sqrt(s / NG) };
    }

    restartEarth();
    restartRoche();

    function drawEarth() {
      const { w, h } = api;
      const g = earthGeom();
      const { cx, cy, Re, Ro } = g;
      const ma = moonAng(), spin = spinAng();
      // sunlight from the right
      ctx.fillStyle = '#03050c';
      ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 110; k++) {
        ctx.fillStyle = `rgba(200,210,255,${0.1 + ((k * 37) % 10) / 45})`;
        ctx.fillRect((((k * 7919) % 1000) / 1000) * w, (((k * 104729) % 997) / 997) * h, 1, 1);
      }
      if (params.sun) {
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, w + 40, cy, Math.min(w, h) * 0.5, '#ffcf6a', 0.12);
        ctx.globalCompositeOperation = 'source-over';
        tag(ctx, 'Sun this way →', w - 16, g.phone ? cy - Ro - 30 : cy - 24, C.amber, { align: 'right', size: 10 });
      } else tag(ctx, 'sunlight →', w - 16, g.phone ? cy - Ro - 30 : cy - 24, 'rgba(255,214,102,0.7)', { align: 'right', size: 10 });

      // Moon orbit
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, Ro, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);

      // ocean: a ring whose thickness follows the tide
      const amp = Re * 0.15, base = Re * 1.12;
      ctx.beginPath();
      for (let k = 0; k <= 180; k++) {
        const th = (TAU * k) / 180;
        const r = base + amp * seaHeight(th);
        ctx[k ? 'lineTo' : 'moveTo'](cx + r * Math.cos(th), cy - r * Math.sin(th));
      }
      ctx.closePath();
      const og = ctx.createRadialGradient(cx, cy, Re, cx, cy, base + amp * 1.5);
      og.addColorStop(0, '#1f5fd0');
      og.addColorStop(1, '#3fa0ff');
      ctx.fillStyle = og;
      ctx.fill();
      // solid Earth with a few continents, spinning
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, Re, 0, TAU);
      ctx.fillStyle = '#163a6e';
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = '#3f8a4a';
      for (const [a, r, s] of [[0.3, 0.55, 0.38], [2.1, 0.6, 0.3], [3.6, 0.35, 0.42], [4.9, 0.62, 0.26], [1.2, 0.1, 0.22]]) {
        const A = a + spin;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(A) * r * Re, cy - Math.sin(A) * r * Re, s * Re, s * Re * 0.65, -A, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      // night side
      ctx.fillStyle = 'rgba(0,0,10,0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, base + amp * 1.6, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, TAU);
      ctx.fill();

      // the coastal town
      const tx = cx + Math.cos(spin) * Re * 1.0, ty = cy - Math.sin(spin) * Re * 1.0;
      const local = seaHeight(spin);
      ctx.fillStyle = C.amber;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tx, ty, 5, 0, TAU);
      ctx.fill();
      ctx.stroke();
      const lab = local > 0.55 ? 'high tide' : local < -0.55 ? 'low tide' : local > 0 ? 'tide rising/falling' : 'tide rising/falling';
      tag(ctx, `town: ${lab}`, tx + Math.cos(spin) * 30, ty - Math.sin(spin) * 30, C.amber, { align: 'center', size: 10 });

      // tidal force arrows around the Earth
      const arrowsFor = (phi, k, col) => {
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = 2;
        for (let i = 0; i < 16; i++) {
          const th = (TAU * i) / 16;
          const rel = th - phi;
          const fr = 2 * Math.cos(rel) * Math.cos(rel) - Math.sin(rel) * Math.sin(rel); // radial part
          const ft = -3 * Math.cos(rel) * Math.sin(rel); // tangential part
          const r0 = base + amp + 14;
          const x0 = cx + r0 * Math.cos(th), y0 = cy - r0 * Math.sin(th);
          const L = Re * 0.32 * k;
          const ex = (fr * Math.cos(th) - ft * Math.sin(th)) * L, ey = -(fr * Math.sin(th) + ft * Math.cos(th)) * L;
          if (Math.hypot(ex, ey) < 3) continue;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0 + ex, y0 + ey);
          ctx.stroke();
          const a = Math.atan2(ey, ex);
          ctx.beginPath();
          ctx.moveTo(x0 + ex + Math.cos(a) * 5, y0 + ey + Math.sin(a) * 5);
          ctx.lineTo(x0 + ex + Math.cos(a + 2.4) * 5, y0 + ey + Math.sin(a + 2.4) * 5);
          ctx.lineTo(x0 + ex + Math.cos(a - 2.4) * 5, y0 + ey + Math.sin(a - 2.4) * 5);
          ctx.fill();
        }
      };
      if (params.arrows) {
        arrowsFor(ma, 1, 'rgba(110,220,255,0.85)');
        if (params.sun) arrowsFor(0, SUN, 'rgba(255,200,90,0.85)');
      }
      // the Moon's pull at near side, centre and far side
      if (params.pulls) {
        const ux = Math.cos(ma), uy = -Math.sin(ma);
        const pts = [[Re, 1.35], [0, 1], [-Re, 0.75]];
        pts.forEach(([off, k], i) => {
          const x0 = cx + ux * off + uy * (i - 1) * 0, y0 = cy + uy * off;
          const L = Re * 0.45 * k;
          ctx.strokeStyle = '#ffd666';
          ctx.fillStyle = '#ffd666';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0 + ux * L, y0 + uy * L);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x0 + ux * (L + 8), y0 + uy * (L + 8));
          ctx.lineTo(x0 + ux * L - uy * 5, y0 + uy * L + ux * 5);
          ctx.lineTo(x0 + ux * L + uy * 5, y0 + uy * L - ux * 5);
          ctx.fill();
        });
        tag(ctx, 'Moon’s pull: strongest on the near side', cx - uy * (Re * 1.9), cy + ux * (Re * 1.9), '#ffd666', { align: 'center', size: 10 });
      }

      // the Moon, with its own (rock) tidal bulge and a face marker
      const mx = cx + Math.cos(ma) * Ro, my = cy - Math.sin(ma) * Ro;
      const mr = Re * (spinning ? 0.42 : 0.3);
      const toEarth = ma + Math.PI;
      const lag = spinning ? clamp((moonOmega - TAU / (27.32 * 24)) * 40, 0, 0.5) : 0;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(-(toEarth + lag));
      ctx.beginPath();
      ctx.ellipse(0, 0, mr * (spinning ? 1.12 : 1.03), mr * (spinning ? 0.92 : 0.98), 0, 0, TAU);
      ctx.fillStyle = '#b9b6ae';
      ctx.fill();
      ctx.restore();
      // craters rotate with the Moon's own spin
      const face = spinning ? moonSpin : toEarth;
      ctx.fillStyle = 'rgba(80,78,72,0.65)';
      for (const [a, r, s] of [[0, 0.45, 0.22], [0.9, 0.55, 0.14], [-0.8, 0.5, 0.16], [2.6, 0.5, 0.12], [3.6, 0.45, 0.18]]) {
        const A = face + a;
        ctx.beginPath();
        ctx.arc(mx + Math.cos(A) * r * mr, my - Math.sin(A) * r * mr, s * mr, 0, TAU);
        ctx.fill();
      }
      // shade the Moon's night side
      ctx.fillStyle = 'rgba(0,0,10,0.55)';
      ctx.beginPath();
      ctx.arc(mx, my, mr * 1.13, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.fill();
      if (spinning) {
        // marker on the "face" so you can see it turn
        const fx = mx + Math.cos(face) * mr * 0.8, fy = my - Math.sin(face) * mr * 0.8;
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, TAU);
        ctx.fill();
        const ratio = moonOmega / (TAU / (27.32 * 24));
        tag(ctx, ratio > 1.03 ? `Moon spins ${ratio.toFixed(1)}× per orbit` : 'locked: one spin per orbit', mx, my + mr + 18, ratio > 1.03 ? C.dim : C.teal, { align: 'center', size: 10 });
        if (lag > 0.02) tag(ctx, 'bulge dragged out of line → braking', mx, my - mr - 16, C.amber, { align: 'center', size: 10 });
      } else tag(ctx, 'Moon', mx, my + mr + 16, C.dim, { align: 'center', size: 10 });

      // tide gauge for the town
      const W = g.phone ? w - 32 : Math.min(320, w * 0.3), H = g.phone ? 86 : 120;
      const X0 = g.phone ? 16 : w - W - 16, Y0 = g.phone ? h - H - 52 : h - H - 24;
      ctx.fillStyle = 'rgba(8,11,24,0.86)';
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      roundRect(ctx, X0, Y0, W, H, 12);
      ctx.fill();
      ctx.stroke();
      text(ctx, 'Sea level at the town', X0 + 12, Y0 + 14, { size: 11, weight: 600, color: C.dim });
      text(ctx, `${Math.floor(hours / 24)} days`, X0 + W - 12, Y0 + 14, { size: 10, align: 'right', color: C.amber, mono: true });
      const gx0 = X0 + 10, gx1 = X0 + W - 10, gy0 = Y0 + 26, gy1 = Y0 + H - 8, mid = (gy0 + gy1) / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(gx0, mid);
      ctx.lineTo(gx1, mid);
      ctx.stroke();
      ctx.strokeStyle = '#3fa0ff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const span = params.sun || params.speed > 3 ? 30 * 24 : 3 * 24;
      gauge.forEach(([hr, v], i) => {
        const X = gx1 - ((hours - hr) / span) * (gx1 - gx0);
        if (X < gx0) return;
        ctx[i && X > gx0 ? 'lineTo' : 'moveTo'](X, mid - (v / (1 + SUN)) * (gy1 - gy0) * 0.48);
      });
      ctx.stroke();
    }

    function drawRoche() {
      const { w, h } = api;
      const phone = w < 760;
      ctx.fillStyle = '#03040a';
      ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 110; k++) {
        ctx.fillStyle = `rgba(200,210,255,${0.1 + ((k * 37) % 10) / 45})`;
        ctx.fillRect((((k * 7919) % 1000) / 1000) * w, (((k * 104729) % 997) / 997) * h, 1, 1);
      }
      const cx = w * 0.5, cy = phone ? h * 0.46 : h * 0.47;
      const sc = Math.min(w * (phone ? 0.46 : 0.4), h * (phone ? 0.36 : 0.4)) / (2.25 * ROCHE * 0.95);
      // planet
      const Rp = sc * 1;
      const pg = ctx.createRadialGradient(cx - Rp * 0.3, cy - Rp * 0.3, Rp * 0.1, cx, cy, Rp);
      pg.addColorStop(0, '#f3dcae');
      pg.addColorStop(0.7, '#c99d62');
      pg.addColorStop(1, '#7a5732');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(cx, cy, Rp, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(120,80,40,0.35)';
      ctx.lineWidth = Rp * 0.08;
      for (const yy of [-0.5, -0.2, 0.15, 0.45]) {
        ctx.beginPath();
        ctx.moveTo(cx - Rp, cy + yy * Rp);
        ctx.lineTo(cx + Rp, cy + yy * Rp);
        ctx.stroke();
      }
      ctx.restore();
      // Roche limit
      ctx.strokeStyle = 'rgba(255,90,110,0.7)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, ROCHE * sc, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      tag(ctx, 'Roche limit', cx, cy - ROCHE * sc - 14, C.red, { align: 'center', size: 10 });

      // grains
      const m = moonCentre();
      const gs = Math.max(2, GRAIN * sc);
      for (let i = 0; i < NG; i++) {
        const X = cx + gx[i] * sc, Y = cy - gy[i] * sc;
        ctx.fillStyle = '#4a4440';
        ctx.beginPath();
        ctx.arc(X, Y, gs + 0.8, 0, TAU);
        ctx.fill();
        ctx.fillStyle = i % 5 ? '#b5aa9c' : '#d8cfc2';
        ctx.beginPath();
        ctx.arc(X, Y, gs, 0, TAU);
        ctx.fill();
      }
      // tidal stretch arrows on the moon while it is whole
      if (params.arrows && !broken) {
        const ux = m.x / m.d, uy = m.y / m.d;
        const k = clamp((ROCHE / m.d) ** 3, 0.2, 2.5);
        const X = cx + m.x * sc, Y = cy - m.y * sc, r = MOON_R * sc * 1.25;
        ctx.strokeStyle = 'rgba(110,220,255,0.85)';
        ctx.fillStyle = 'rgba(110,220,255,0.85)';
        ctx.lineWidth = 2;
        for (const s of [1, -1]) {
          const x0 = X + ux * r * s, y0 = Y - uy * r * s, L = 14 * k;
          const x1 = x0 + ux * L * s, y1 = y0 - uy * L * s;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x1 + ux * 6 * s, y1 - uy * 6 * s);
          ctx.lineTo(x1 - uy * 4, y1 - ux * 4);
          ctx.lineTo(x1 + uy * 4, y1 + ux * 4);
          ctx.fill();
        }
      }
      // close-up of the moon (until it has spread into a ring)
      if (gr < 2.5) {
        const S = phone ? 104 : 200, X0 = phone ? 10 : w - S - 16, Y0 = phone ? 60 : 110;
        ctx.fillStyle = 'rgba(8,11,24,0.88)';
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        roundRect(ctx, X0, Y0, S, S, 10);
        ctx.fill();
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.rect(X0, Y0, S, S);
        ctx.clip();
        const z = (S * 0.32) / MOON_R, ox = X0 + S / 2, oy = Y0 + S / 2;
        // keep the planet's direction pointing down-left in the close-up
        const ang = Math.atan2(m.y, m.x);
        const ca = Math.cos(-ang + Math.PI * 0.75), sa = Math.sin(-ang + Math.PI * 0.75);
        for (let i = 0; i < NG; i++) {
          const dx = gx[i] - m.x, dy = gy[i] - m.y;
          const X = ox + (dx * ca - dy * sa) * z, Y = oy - (dx * sa + dy * ca) * z;
          ctx.fillStyle = '#4a4440';
          ctx.beginPath();
          ctx.arc(X, Y, GRAIN * z + 0.8, 0, TAU);
          ctx.fill();
          ctx.fillStyle = i % 5 ? '#b5aa9c' : '#d8cfc2';
          ctx.beginPath();
          ctx.arc(X, Y, GRAIN * z * 0.92, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        text(ctx, 'close-up', X0 + 8, Y0 + 11, { size: 9, color: C.dim });
        text(ctx, '↙ planet', X0 + 8, Y0 + S - 10, { size: 9, color: C.dim });
      }
      const state = !broken ? (m.d < ROCHE ? 'being stretched apart…' : 'holding together') : gr > 1.5 ? 'debris spreading into a ring' : 'torn apart';
      tag(ctx, `moon: ${state}`, phone ? w - 16 : w - 16, phone ? 72 : 84, broken ? C.red : m.d < ROCHE ? C.amber : C.teal, { align: 'right' });
      if (!phone) text(ctx, 'Drawn to scale: planet, Roche limit and moon', w - 16, h - 22, { size: 10, align: 'right', color: 'rgba(233,237,247,0.45)' });
    }

    return {
      restart() {
        if (params.scene === 'earth') restartEarth();
        else restartRoche();
      },
      reset() {
        restartEarth();
        restartRoche();
      },
      spinMoon() {
        spinning = true;
        moonOmega = (TAU / (27.32 * 24)) * 6;
        moonSpin = moonAng() + Math.PI;
      },
      onParam(k) {
        if (k === 'scene') {
          restartEarth();
          restartRoche();
        }
        if (k === 'start') restartRoche();
      },
      update(dt) {
        if (params.scene === 'earth') {
          const dh = dt * 3 * params.speed;
          hours += dh;
          if (spinning) {
            const W = TAU / (27.32 * 24);
            moonOmega = W + (moonOmega - W) * Math.exp(-dh / 140);
            moonSpin += moonOmega * dh;
          }
          const last = gauge[gauge.length - 1];
          if (!last || hours - last[0] > 0.25 * Math.max(1, params.speed / 2)) {
            gauge.push([hours, seaHeight(spinAng())]);
            if (gauge.length > 1400) gauge.shift();
          }
        } else {
          const n = Math.round(clamp(dt * 60, 0.5, 3) * 10 * params.speed);
          for (let k = 0; k < n; k++) stepRoche(0.012);
          const m = moonCentre();
          gr = m.spread / MOON_R;
          if (!broken && gr > 1.6) {
            broken = true;
          }
        }
      },
      draw() {
        if (params.scene === 'earth') drawEarth();
        else drawRoche();
      },
      stats() {
        if (params.scene === 'earth') {
          const elong = Math.abs(((((moonAng() % TAU) + TAU) % TAU) / TAU) * 2 - 1); // 0 at new moon side, 1 opposite
          const align = Math.abs(Math.cos(moonAng()));
          const range = params.sun ? Math.sqrt(1 + SUN * SUN + 2 * SUN * Math.cos(2 * moonAng())) / (1 + SUN) : 1 / (1 + SUN);
          return [
            { label: 'Time', value: `day ${Math.floor(hours / 24) + 1}, ${String(Math.floor(hours % 24)).padStart(2, '0')}:00`, color: C.amber },
            { label: 'Moon phase', value: align > 0.92 ? (Math.cos(moonAng()) > 0 ? 'full moon' : 'new moon') : align < 0.35 ? 'half moon' : elong > 0 ? 'crescent / gibbous' : '—' },
            { label: 'Tide range', value: params.sun ? (range > 0.85 ? 'spring tide (big)' : range < 0.5 ? 'neap tide (small)' : 'in between') : 'Moon only', color: C.cyan },
            { label: 'Sun’s tide vs Moon’s', value: '0.46 ×' },
          ];
        }
        const m = moonCentre();
        return [
          { label: 'Distance ÷ Roche limit', value: (m.d / ROCHE).toFixed(2), color: m.d < ROCHE ? C.red : C.teal },
          { label: 'Tidal stretch vs at the limit', value: `${((ROCHE / m.d) ** 3).toFixed(2)} ×` },
          { label: 'Moon', value: broken ? (gr > 1.5 ? 'ring forming' : 'torn apart') : 'in one piece' },
          { label: 'Orbits', value: (tR / (TAU * Math.max(0.5, m.d) ** 1.5)).toFixed(1) },
        ];
      },
    };
  },
};
