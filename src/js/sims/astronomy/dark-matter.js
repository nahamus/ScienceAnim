import { C, TAU, drawGlow, roundRect, tag, text } from '../../core/util.js';

// Rotation curves and dark matter. A Milky-Way-like galaxy: a bulge (Hernquist, 1.5e10 Msun) and an exponential
// disc (6e10 Msun, scale 3 kpc), treated as spherical for the enclosed mass, plus an optional cored dark halo
// ρ ∝ 1/(1 + (r/rc)²). Circular speed v = √(G M(<r) / r). The "measured" points come from the same model with
// the halo that fits the Milky Way (about 5e11 Msun inside 50 kpc), plus measurement scatter.

const G = 4.30091e-6; // kpc (km/s)² / Msun
const MB = 1.5e10, AB = 0.6, MD = 6e10, RD = 3, RC = 5;
const KPC_MYR = 1.0227e-3; // 1 km/s in kpc per Myr
const RMAX = 30, VMAX = 300;
const visM = (r) => MB * (r / (r + AB)) ** 2 + MD * (1 - (1 + r / RD) * Math.exp(-r / RD));
const haloShape = (r) => r - RC * Math.atan(r / RC);
const haloM = (r, h) => (h * 1e11 * haloShape(r)) / haloShape(50);
const vc = (r, h) => Math.sqrt((G * (visM(r) + haloM(r, h))) / Math.max(r, 0.05));
const TRUE_H = 5;
const VIS50 = visM(50);

// "measured" speeds: radio and optical Doppler measurements, with scatter
const DATA = [];
{
  let s = 12345;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 - 0.5) * 2;
  for (let r = 1; r <= 29.5; r += 1.6) DATA.push({ r, v: vc(r, TRUE_H) + rnd() * 7, e: 5 + r * 0.35 });
}

export default {
  id: 'dark-matter',
  title: 'The Case for Dark Matter',
  category: 'astronomy',
  tagline: 'The outer stars of galaxies orbit far too fast. Something unseen is holding them in.',
  ages: ['14-16', '16+'],
  topics: ['Space', 'Gravity', 'Galaxies'],
  keywords: ['dark matter', 'rotation curve', 'Vera Rubin', 'galaxy rotation', 'flat rotation curve', 'Kepler', 'missing mass', 'dark matter halo', 'WIMP', 'axion', 'MOND', 'gravitational lensing', 'Bullet Cluster'],
  blurb:
    'Planets far from the Sun orbit slowly, and the same should be true for stars far from the centre of a galaxy. But when Vera Rubin and Kent Ford measured how fast stars orbit, the outer ones were going just as fast as the inner ones. The only way gravity can hold them is if galaxies contain about five times more matter than we can see. Nobody yet knows what this dark matter is.',
  ideas: [
    'In orbit, speed is set by the mass inside the orbit: v² = G × M(inside) ÷ r.',
    'If most of a galaxy’s mass were in its bright centre, outer stars would orbit <b>slower</b>, like the outer planets.',
    'Measured speeds stay roughly <b>flat</b> far out: there must be mass we can’t see, spread far beyond the stars.',
    'This invisible <b>dark matter</b> forms a huge halo around each galaxy and outweighs ordinary matter about 5 to 1.',
    'Other clues agree: bent light (gravitational lensing), colliding clusters, and the pattern of the cosmic microwave background.',
  ],
  hint: 'Add dark matter until the curve fits the measurements',
  thumbChapter: 4,
  thumbFrames: 200,
  params: [
    { key: 'halo', label: 'Dark matter', type: 'range', min: 0, max: 10, step: 0.1, value: 0, format: (v) => (v === 0 ? 'none' : `${((v * 1e11) / VIS50).toFixed(1)} × the visible mass`) },
    { key: 'data', label: 'Show measured speeds', type: 'toggle', value: false },
    {
      key: 'mode', label: 'Stars move…', type: 'select', value: 'orbit', instant: true,
      options: [{ value: 'orbit', label: 'At the speed gravity allows' }, { value: 'fling', label: 'At the measured speeds' }],
    },
    { key: 'speed', label: 'Time speed', type: 'range', min: 0.2, max: 4, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'restart', label: 'Restart the stars', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'A spinning galaxy',
      text: 'This is a galaxy like our Milky Way, seen from above: a bright central bulge and a flat disc of about 100 billion stars, all orbiting the centre. The Sun is one of them, 26,000 light-years out, moving at about 220 km/s. Even so, one lap takes it about 230 million years.',
      params: { halo: TRUE_H, data: false, mode: 'orbit', speed: 1 },
      enter: (s) => s.restart(),
      duration: 13,
    },
    {
      title: 'What gravity predicts',
      text: 'Most of the stars and gas are near the centre. So, as with the planets (Neptune crawls round the Sun while Mercury races), stars far out should orbit <b>slower</b>, because they feel less pull. The amber curve shows the speed gravity allows from everything we can see. Watch the outer stars lag behind.',
      formula: 'v² = G × M(inside r) ÷ r',
      params: { halo: 0, data: false, mode: 'orbit', speed: 1.5 },
      duration: 15,
    },
    {
      title: 'What we measure',
      text: 'In the 1970s Vera Rubin and Kent Ford measured how fast stars and gas orbit in nearby galaxies, using the Doppler shift of their light. Radio telescopes tracked hydrogen gas even farther out. The speeds (the blue points) don’t drop: they stay almost <b>flat</b> as far out as we can measure.',
      check: {
        q: 'The outer stars orbit far faster than the visible matter can explain. What does that tell us?',
        options: ['There is extra unseen mass, spread far out beyond the stars', 'The outer stars are about to fly away', 'The galaxy’s centre is heavier than we thought'],
        answer: 0,
        setup: { halo: 0, data: true, mode: 'orbit', speed: 1.5 },
        explain: 'Galaxies have looked this way for billions of years, so the stars are not escaping. Extra mass in the centre would only raise the inner part of the curve. To keep the speed flat far out, the mass inside each orbit has to keep growing with distance, so there must be matter we can’t see, spread well beyond the stars.',
      },
      params: { halo: 0, data: true, mode: 'orbit', speed: 1.5 },
      duration: 14,
    },
    {
      title: 'Adding dark matter',
      text: 'Now add an invisible halo of matter around the galaxy (shown in purple, though in reality you can’t see it). As it grows, the curve rises to meet the measurements. A good match needs roughly <b>six to seven times</b> as much dark matter as visible matter, in a halo far bigger than the disc of stars.',
      params: { halo: TRUE_H, data: true, mode: 'orbit', speed: 1.5 },
      tween: 7,
      duration: 15,
    },
    {
      title: 'Without it, galaxies would fly apart',
      text: 'What if the stars really move at the measured speeds, but only the visible matter is pulling on them? The outer stars are going faster than the escape speed, so they fly off into space. Within a few hundred million years the galaxy’s outskirts would be gone. Real galaxies are billions of years old, so something must be holding them together.',
      params: { halo: 0, data: true, mode: 'fling', speed: 3 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'What is it?',
      text: 'Many other clues point the same way: galaxy clusters bend light more than their visible mass can (gravitational lensing), and the ripples in the cosmic microwave background need it too. Dark matter doesn’t shine, absorb or reflect light, and passes through ordinary matter. It could be a new kind of particle, like WIMPs or axions, but detectors deep underground haven’t caught one yet. Some physicists instead try to change the law of gravity (MOND), but that struggles to explain all the clues.',
      params: { halo: TRUE_H, data: true, mode: 'orbit', speed: 1 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Your turn',
      text: 'Set the amount of dark matter, turn the measurements on and off, and switch the stars to the measured speeds to see what holds a galaxy together.',
      params: { halo: 2, data: true, mode: 'orbit', speed: 1 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const N = 2200;
    const st = Array.from({ length: N }, () => ({ r: 0, a: 0, x: 0, y: 0, vx: 0, vy: 0, b: 0, arm: 0, gone: false }));
    let t = 0;

    function restart() {
      let s = 99;
      const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
      st.forEach((p, i) => {
        // bulge stars near the centre, disc stars spread exponentially (cut at the edge of the plot)
        let r;
        if (i < N * 0.12) r = 0.2 + 2 * rnd() ** 1.5;
        else {
          do r = -RD * Math.log(1 - rnd() * 0.999) * 1.5;
          while (r > 21);
          r = Math.max(0.6, r);
        }
        p.r = r;
        p.a = rnd() * TAU;
        p.b = 0.4 + 0.6 * rnd();
        p.arm = rnd();
        p.bulge = i < N * 0.12;
        p.x = r * Math.cos(p.a);
        p.y = r * Math.sin(p.a);
        const v = (params.mode === 'fling' ? vObs(r) : vc(r, params.halo)) * KPC_MYR;
        p.vx = -v * Math.sin(p.a);
        p.vy = v * Math.cos(p.a);
        p.gone = false;
      });
      t = 0;
    }
    function vObs(r) {
      return vc(r, TRUE_H);
    }

    function geom() {
      const { w, h } = api;
      const phone = w < 760;
      if (phone) {
        const R = Math.min(w * 0.2, (h - 150) * 0.42);
        const px = 2 * R + 22, py = 64;
        return { phone, gx: R + 12, gy: py + (h - 60 - py) / 2, R, px, py, pw: w - px - 8, ph: h - 60 - py };
      }
      const R = Math.min(w * 0.24, h * 0.3);
      return { phone, gx: Math.max(R + 30, w * 0.27), gy: 90 + R + 20, R, px: w * 0.54, py: 120, pw: w * 0.46 - 24, ph: Math.min(h * 0.55, 420) };
    }

    restart();

    return {
      restart,
      reset: restart,
      onParam(k) {
        if (k === 'mode') restart();
      },
      update(dt) {
        const T = dt * 20 * params.speed; // Myr this frame
        t += T;
        if (params.mode === 'orbit') {
          for (const p of st) {
            p.a += ((vc(p.r, params.halo) * KPC_MYR) / p.r) * T;
            p.x = p.r * Math.cos(p.a);
            p.y = p.r * Math.sin(p.a);
          }
        } else {
          // the stars keep their measured speeds; only visible matter pulls on them
          const n = 4, h = T / n;
          for (const p of st) {
            if (p.gone) continue;
            for (let k = 0; k < n; k++) {
              const r = Math.hypot(p.x, p.y);
              const g = (G * KPC_MYR * KPC_MYR * visM(r)) / (r * r * r);
              p.vx -= g * p.x * h;
              p.vy -= g * p.y * h;
              p.x += p.vx * h;
              p.y += p.vy * h;
            }
            if (Math.hypot(p.x, p.y) > 120) p.gone = true;
          }
        }
      },
      draw() {
        const { w, h } = api;
        const g = geom();
        ctx.fillStyle = '#03040a';
        ctx.fillRect(0, 0, w, h);
        for (let k = 0; k < 120; k++) {
          ctx.fillStyle = `rgba(200,210,255,${0.1 + ((k * 37) % 10) / 45})`;
          ctx.fillRect((((k * 7919) % 1000) / 1000) * w, (((k * 104729) % 997) / 997) * h, 1, 1);
        }
        const sc = g.R / 20; // the galaxy view reaches 65,000 light-years

        // the dark halo, shown in purple
        if (params.halo > 0 && params.mode === 'orbit') {
          const k = params.halo / 10;
          const grd = ctx.createRadialGradient(g.gx, g.gy, 0, g.gx, g.gy, g.R * 1.5);
          grd.addColorStop(0, `rgba(150,90,255,${0.32 * k})`);
          grd.addColorStop(0.5, `rgba(130,80,240,${0.18 * k})`);
          grd.addColorStop(1, 'rgba(120,70,230,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(g.gx, g.gy, g.R * 1.5, 0, TAU);
          ctx.fill();
        }

        // stars, brighter along two spiral arms (a pattern turning slowly, like a density wave)
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, g.gx, g.gy, g.R * 0.22, '#ffd9a0', 0.35);
        const pat = t * 0.0012;
        for (const p of st) {
          if (p.gone) continue;
          const X = g.gx + p.x * sc, Y = g.gy + p.y * sc;
          if (X < -5 || X > w + 5 || Y < -5 || Y > h + 5) continue;
          let arm = 0;
          if (!p.bulge) {
            const ang = Math.atan2(p.y, p.x);
            const want = Math.log(Math.hypot(p.x, p.y) / 2) * 2.2 + pat;
            arm = Math.max(Math.cos(2 * (ang - want)), 0) ** 4;
          }
          const blue = arm > 0.4 && p.arm < 0.6;
          ctx.fillStyle = p.bulge ? `rgba(255,220,170,${0.7 * p.b})` : blue ? `rgba(170,200,255,${0.4 + 0.5 * arm})` : `rgba(235,230,220,${0.1 + 0.2 * p.b + 0.55 * arm})`;
          const s = p.bulge ? 1.6 : 1.3 + arm * 0.9;
          ctx.fillRect(X - s / 2, Y - s / 2, s, s);
        }
        ctx.globalCompositeOperation = 'source-over';

        // the Sun's orbit
        if (params.mode === 'orbit') {
          ctx.strokeStyle = 'rgba(255,214,102,0.35)';
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.arc(g.gx, g.gy, 8 * sc, 0, TAU);
          ctx.stroke();
          ctx.setLineDash([]);
          const sa = -0.6 + (t * vc(8, params.halo) * KPC_MYR) / 8;
          const sx = g.gx + Math.cos(sa) * 8 * sc, sy = g.gy + Math.sin(sa) * 8 * sc;
          ctx.fillStyle = C.amber;
          ctx.beginPath();
          ctx.arc(sx, sy, 3.5, 0, TAU);
          ctx.fill();
          tag(ctx, 'Sun', sx + 8, sy - 10, C.amber, { size: 10 });
        } else {
          const lost = st.filter((p) => p.gone || Math.hypot(p.x, p.y) > 24).length;
          tag(ctx, `${Math.round((lost / N) * 100)} % of stars escaping`, g.gx, g.phone ? g.gy - g.R - 4 : g.gy - g.R + 14, C.red, { align: 'center', size: g.phone ? 10 : 12 });
        }
        if (params.halo > 0 && params.mode === 'orbit' && !g.phone) tag(ctx, 'dark matter halo (really invisible)', g.gx, g.gy + g.R * 1.12, '#b48cff', { align: 'center', size: 10 });

        // ---------------------------------------------------------------- rotation curve
        const { px, py, pw, ph } = g;
        ctx.fillStyle = 'rgba(8,11,24,0.86)';
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        roundRect(ctx, px, py, pw, ph, 12);
        ctx.fill();
        ctx.stroke();
        const x0 = px + (g.phone ? 34 : 46), x1 = px + pw - 16, y0 = py + 36, y1 = py + ph - 34;
        const X = (r) => x0 + (r / RMAX) * (x1 - x0), Y = (v) => y1 - (v / VMAX) * (y1 - y0);
        text(ctx, g.phone ? 'Orbit speed vs distance' : 'Orbit speed vs distance from the centre', px + 14, py + 18, { size: g.phone ? 11 : 12, weight: 600, color: C.dim });
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let v = 100; v <= 300; v += 100) {
          ctx.moveTo(x0, Y(v));
          ctx.lineTo(x1, Y(v));
        }
        for (let r = 10; r <= 30; r += 10) {
          ctx.moveTo(X(r), y0);
          ctx.lineTo(X(r), y1);
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0, y1);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        for (let v = 0; v <= 300; v += 100) text(ctx, String(v), x0 - 6, Y(v), { size: 10, align: 'right', color: 'rgba(233,237,247,0.45)', mono: true });
        text(ctx, 'km/s', x0 - 6, y0 - 12, { size: 9, align: 'right', color: 'rgba(233,237,247,0.45)' });
        for (let r = 0; r <= 30; r += 10) text(ctx, `${Math.round(r * 3.26)}k`, X(r), y1 + 12, { size: 10, align: 'center', color: 'rgba(233,237,247,0.45)', mono: true });
        text(ctx, 'light-years', x1, y1 + 24, { size: 9, align: 'right', color: 'rgba(233,237,247,0.45)' });
        // the Sun
        ctx.strokeStyle = 'rgba(255,214,102,0.35)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(X(8), y0);
        ctx.lineTo(X(8), y1);
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, 'Sun', X(8) + 4, y0 + 6, { size: 9, color: C.amber });

        const curve = (f, col, wdt, dash) => {
          ctx.strokeStyle = col;
          ctx.lineWidth = wdt;
          ctx.setLineDash(dash || []);
          ctx.beginPath();
          for (let r = 0.2; r <= RMAX; r += 0.25) ctx[r === 0.2 ? 'moveTo' : 'lineTo'](X(r), Y(f(r)));
          ctx.stroke();
          ctx.setLineDash([]);
        };
        curve((r) => Math.sqrt((G * visM(r)) / r), C.amber, 2, [6, 5]);
        if (params.halo > 0) curve((r) => vc(r, params.halo), '#c9a6ff', 3);
        if (params.data) {
          for (const d of DATA) {
            ctx.strokeStyle = 'rgba(110,220,255,0.6)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(X(d.r), Y(d.v - d.e));
            ctx.lineTo(X(d.r), Y(d.v + d.e));
            ctx.stroke();
            ctx.fillStyle = C.cyan;
            ctx.beginPath();
            ctx.arc(X(d.r), Y(d.v), 3.2, 0, TAU);
            ctx.fill();
          }
        }
        // legend
        const ly = y0 + 8;
        const leg = [[C.amber, 'gravity of visible matter', true]];
        if (params.halo > 0) leg.push(['#c9a6ff', 'visible + dark matter']);
        if (params.data) leg.push([C.cyan, 'measured speeds']);
        leg.forEach(([c, s, dashed], i) => {
          const yy = ly + 4 + i * 16;
          ctx.strokeStyle = c;
          ctx.lineWidth = 2;
          ctx.setLineDash(dashed ? [4, 3] : []);
          ctx.beginPath();
          const lw = g.phone ? 112 : 150;
          ctx.moveTo(x1 - lw, yy);
          ctx.lineTo(x1 - lw + 14, yy);
          ctx.stroke();
          ctx.setLineDash([]);
          text(ctx, g.phone ? s.replace('gravity of ', '') : s, x1 - lw + 19, yy, { size: g.phone ? 9 : 10, color: C.dim });
        });
      },
      stats() {
        const h = params.halo;
        const rms = Math.sqrt(DATA.reduce((s, d) => s + (vc(d.r, h) - d.v) ** 2, 0) / DATA.length);
        const m30v = visM(30), m30d = haloM(30, h);
        return [
          { label: 'Speed at the Sun', value: `${Math.round(vc(8, h))} km/s`, color: C.amber },
          { label: 'Speed at 100,000 ly', value: `${Math.round(vc(30, h))} km/s` },
          { label: 'Dark matter share', value: `${Math.round((m30d / (m30v + m30d)) * 100)} %`, color: '#c9a6ff' },
          { label: 'Fit to measurements', value: rms < 12 ? 'good' : rms < 30 ? 'close' : 'poor', color: rms < 12 ? C.teal : rms < 30 ? C.amber : C.red },
          { label: 'Time', value: `${Math.round(t)} million years` },
        ];
      },
    };
  },
};
