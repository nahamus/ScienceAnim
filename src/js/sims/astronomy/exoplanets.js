import { C, TAU, clamp, randn, rand, drawGlow, tag, text, Series } from '../../core/util.js';

/** Area of overlap of two circles with radii R, r whose centres are d apart. */
function overlap(R, r, d) {
  if (d >= R + r) return 0;
  if (d <= Math.abs(R - r)) return Math.PI * Math.min(R, r) ** 2;
  const a = r * r * Math.acos((d * d + r * r - R * R) / (2 * d * r));
  const b = R * R * Math.acos((d * d + R * R - r * r) / (2 * d * R));
  const c = 0.5 * Math.sqrt((-d + r + R) * (d + r - R) * (d - r + R) * (d + r + R));
  return a + b - c;
}
const LIMB = 0.6;
const limb = (rr) => 1 - LIMB * (1 - Math.sqrt(Math.max(0, 1 - rr * rr)));

export default {
  id: 'exoplanets',
  title: 'Hunting Exoplanets',
  category: 'astronomy',
  tagline: 'How we find planets around other stars from a dip of light or a tiny wobble.',
  ages: ['14-16', '16+'],
  topics: ['Space', 'Light', 'Data'],
  blurb:
    'Planets around other stars are far too faint and close to their star to photograph. Astronomers find them indirectly: a planet crossing in front of its star blocks a sliver of light, and its gravity makes the star wobble. Space telescopes like Kepler and TESS have found thousands of worlds this way.',
  ideas: [
    'A <b>transit</b> dims the star by the fraction of its disc the planet covers: (R_planet / R_star)².',
    'The time between dips gives the planet’s <b>year</b>; the depth gives its <b>size</b>.',
    'Only planets whose orbits we see almost <b>edge-on</b> ever transit.',
    'The planet’s pull makes the star <b>wobble</b>, shifting its light back and forth in colour (Doppler shift).',
  ],
  hint: 'Watch the light curve below the star',
  thumbChapter: 1,
  thumbFrames: 300,
  params: [
    { key: 'size', label: 'Planet size', type: 'range', min: 0.009, max: 0.16, step: 0.001, value: 0.1, format: (v) => (v * 109).toFixed(1) + ' × Earth' },
    { key: 'period', label: 'Orbital period', type: 'range', min: 3, max: 14, step: 0.1, value: 6, format: (v) => v.toFixed(1) + ' days' },
    { key: 'incl', label: 'Orbit tilt (90° = edge-on)', type: 'range', min: 75, max: 90, step: 0.1, value: 89, unit: '°', digits: 1 },
    { key: 'noise', label: 'Telescope noise', type: 'range', min: 0, max: 0.004, step: 0.0001, value: 0.0004, format: (v) => (v * 1e6).toFixed(0) + ' ppm' },
    { key: 'rv', label: 'Show star wobble & spectrum', type: 'toggle', value: false },
    { key: 'clear', label: 'Clear light curve', type: 'button', action: (s) => s.clearCurve() },
  ],
  story: [
    {
      title: 'A planet you can’t see',
      text: 'This sun-like star is hundreds of light-years away. A giant planet circles it, but from Earth the planet is lost in the star’s glare — billions of times fainter. So how can we know it is there?',
      params: { size: 0.1, period: 6, incl: 89, noise: 0.0004, rv: false },
      enter: (s) => s.clearCurve(),
      duration: 10,
    },
    {
      title: 'The transit',
      text: 'Measure the star’s brightness continuously. Each time the planet crosses in front, the light <b>dips</b> by about 1% — the share of the star’s disc it hides. The dip repeats every orbit, like clockwork.',
      formula: 'depth = (R_planet / R_star)²',
      params: { size: 0.1, incl: 89, rv: false },
      duration: 14,
    },
    {
      title: 'An Earth-sized world',
      text: 'Shrink the planet to Earth size. The dip is now just <b>0.008%</b> — smaller than the telescope’s noise. Finding Earth twins means staring at a star for years and stacking many transits.',
      params: { size: 0.0092, noise: 0.00025, incl: 89, rv: false },
      enter: (s) => s.clearCurve(),
      duration: 14,
    },
    {
      title: 'The tilt has to be just right',
      text: 'Tilt the orbit a few degrees and the planet passes above the star: <b>no dip at all</b>. For an Earth-like orbit only about one in 200 systems is lined up well enough, so most planets never transit for us.',
      params: { size: 0.1, noise: 0.0004, incl: 84, rv: false },
      enter: (s) => s.clearCurve(),
      duration: 13,
    },
    {
      title: 'The wobble',
      text: 'Star and planet both orbit their shared centre of mass, so the star <b>wobbles</b>. Moving toward us its light is squeezed bluer; moving away, stretched redder. Watch the dark lines in its spectrum slide back and forth.',
      formula: 'Δλ / λ = v / c',
      params: { rv: true, incl: 89, size: 0.12 },
      duration: 15,
    },
    {
      title: 'Find your own planet',
      text: 'Choose a planet’s size, year and tilt, add noise, and see whether its signal would be detectable.',
      params: { size: 0.05, period: 4, noise: 0.0006, rv: true },
      enter: (s) => s.clearCurve(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let phase = -0.7, curve = [], tAcc = 0, flux = 1, transits = 0, wasIn = false;
    const sFlux = new Series(400);
    const stars = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.2, a: Math.random() * 0.6 + 0.2 }));
    const spots = Array.from({ length: 40 }, () => ({ a: rand(TAU), r: Math.sqrt(Math.random()) * 0.92, s: rand(0.04, 0.1), ph: rand(TAU) }));
    const geom = () => {
      const { w, h } = api;
      const Rs = Math.min(w * 0.12, h * 0.15);
      return { Rs, cx: w * 0.5, cy: Math.max(180, h * 0.32), a: Math.min(w * 0.38, Rs * 3.6) };
    };

    function pos() {
      const g = geom();
      const i = (params.incl * Math.PI) / 180;
      const x = g.a * Math.sin(phase);
      const y = g.a * Math.cos(phase) * Math.cos(i);
      const z = Math.cos(phase);
      return { x, y, z, g };
    }

    return {
      clearCurve() {
        curve = [];
        sFlux.clear();
        transits = 0;
      },
      reset() {
        phase = -0.7;
        this.clearCurve();
      },
      update(dt) {
        const w = TAU / (params.period * 1.4);
        phase += dt * w;
        if (phase > Math.PI) phase -= TAU;
        const { x, y, z, g } = pos();
        const rp = params.size * g.Rs;
        const d = Math.hypot(x, y);
        let blocked = 0;
        if (z > 0) blocked = (overlap(g.Rs, rp, d) * limb(Math.min(1, d / g.Rs))) / (Math.PI * g.Rs * g.Rs * (1 - LIMB / 3));
        const inT = blocked > 0;
        if (inT && !wasIn) transits++;
        wasIn = inT;
        flux = 1 - blocked;
        tAcc += dt;
        if (tAcc > 1 / 30) {
          tAcc = 0;
          const v = flux + randn() * params.noise;
          curve.push(v);
          if (curve.length > 900) curve.shift();
          sFlux.push(v);
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#020309';
        ctx.fillRect(0, 0, w, h);
        for (const s of stars) {
          ctx.fillStyle = `rgba(220,230,255,${s.a * (0.7 + 0.3 * Math.sin(api.time * 2 + s.x * 50))})`;
          ctx.fillRect(s.x * w, s.y * h, s.r, s.r);
        }
        const { x, y, z, g } = pos();
        const wob = params.rv ? -x * 0.06 : 0;
        const sx = g.cx + wob, sy = g.cy;
        const rp = Math.max(1.5, params.size * g.Rs);
        const i = (params.incl * Math.PI) / 180;

        // orbit path
        ctx.strokeStyle = 'rgba(160,180,255,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(g.cx, g.cy, g.a, Math.max(0.5, g.a * Math.cos(i)), 0, 0, TAU);
        ctx.stroke();

        const planet = () => {
          const px = g.cx + x, py = g.cy + y;
          const gr = ctx.createRadialGradient(px - rp * 0.4, py - rp * 0.4, rp * 0.1, px, py, rp);
          gr.addColorStop(0, '#6a83b8');
          gr.addColorStop(1, '#141c33');
          ctx.fillStyle = z > 0 ? '#05060b' : gr;
          ctx.beginPath();
          ctx.arc(px, py, rp, 0, TAU);
          ctx.fill();
          if (z <= 0) {
            ctx.strokeStyle = 'rgba(160,190,255,0.35)';
            ctx.stroke();
          }
        };
        if (z <= 0) planet();

        // star with limb darkening + shimmering granulation
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, sx, sy, g.Rs * 3.2, '#ffb547', 0.25);
        ctx.globalCompositeOperation = 'source-over';
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, g.Rs);
        sg.addColorStop(0, '#fff6dc');
        sg.addColorStop(0.55, '#ffd78a');
        sg.addColorStop(0.85, '#ffa64a');
        sg.addColorStop(1, '#d9661f');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, g.Rs, 0, TAU);
        ctx.fill();
        ctx.save();
        ctx.clip();
        for (const s of spots) {
          const rr = s.r * g.Rs;
          ctx.fillStyle = `rgba(255,255,230,${0.05 + 0.04 * Math.sin(api.time * 1.5 + s.ph)})`;
          ctx.beginPath();
          ctx.arc(sx + Math.cos(s.a) * rr, sy + Math.sin(s.a) * rr, s.s * g.Rs, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        if (z > 0) planet();

        // light curve panel
        const px0 = w < 760 ? 16 : Math.max(w * 0.4, 500), px1 = w - 16;
        const py0 = Math.max(g.cy + g.Rs + 50, h * 0.6), py1 = Math.min(h - 24, py0 + 150);
        if (py1 - py0 > 60) {
          ctx.fillStyle = 'rgba(10,14,30,0.75)';
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(px0, py0, px1 - px0, py1 - py0, 12) : ctx.rect(px0, py0, px1 - px0, py1 - py0);
          ctx.fill();
          ctx.stroke();
          const depth = Math.max(params.size * params.size * 1.6, params.noise * 4, 0.0004);
          const Y = (v) => py0 + 26 + ((1 - v) / depth) * (py1 - py0 - 44);
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(px0 + 10, Y(1));
          ctx.lineTo(px1 - 10, Y(1));
          ctx.stroke();
          ctx.setLineDash([]);
          const n = curve.length;
          const span = 900;
          ctx.strokeStyle = '#ffd78a';
          ctx.lineWidth = 1.4;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (let k = 0; k < n; k++) {
            const X = px1 - 10 - ((n - 1 - k) / span) * (px1 - px0 - 20);
            ctx[k ? 'lineTo' : 'moveTo'](X, clamp(Y(curve[k]), py0 + 4, py1 - 4));
          }
          ctx.stroke();
          text(ctx, 'Star brightness', px0 + 14, py0 + 14, { size: 11, color: 'rgba(233,237,247,0.7)', weight: 600 });
          text(ctx, `dip depth ${((params.size ** 2) * 100).toFixed(params.size < 0.03 ? 4 : 2)} %`, px1 - 14, py0 + 14, { size: 11, align: 'right', color: C.amber, mono: true });
        }

        // spectrum with Doppler-shifted absorption lines
        if (params.rv) {
          const W = Math.min(300, w * 0.36), H = 26, X0 = w - W - 18, Y0 = 100;
          const grd = ctx.createLinearGradient(X0, 0, X0 + W, 0);
          ['#7a2cff', '#2a5bff', '#2ad4ff', '#3bff7a', '#f5ff3b', '#ff9b2a', '#ff2a2a'].forEach((c, k, a) => grd.addColorStop(k / (a.length - 1), c));
          ctx.fillStyle = grd;
          ctx.fillRect(X0, Y0, W, H);
          const vr = Math.sin(phase); // + away (red), − toward (blue)
          const shift = vr * 9;
          ctx.fillStyle = 'rgba(0,0,0,0.85)';
          for (const f of [0.14, 0.31, 0.47, 0.52, 0.71, 0.86]) ctx.fillRect(X0 + f * W + shift - 1.5, Y0, 3, H);
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.strokeRect(X0, Y0, W, H);
          tag(ctx, vr > 0.15 ? 'moving away → redshift' : vr < -0.15 ? 'moving toward us → blueshift' : 'sideways', X0 + W / 2, Y0 + H + 16, vr > 0.15 ? C.red : vr < -0.15 ? C.cyan : C.dim, { align: 'center', size: 10 });
        }
      },
      stats() {
        return [
          { label: 'Brightness', value: (flux * 100).toFixed(3) + ' %', color: flux < 1 ? C.amber : undefined },
          { label: 'Expected dip', value: ((params.size ** 2) * 1e6).toFixed(0) + ' ppm' },
          { label: 'Planet radius', value: (params.size * 109).toFixed(1) + ' R⊕' },
          { label: 'Transits seen', value: String(transits) },
          { label: 'Transits at all?', value: Math.cos((params.incl * Math.PI) / 180) * geom().a < geom().Rs * (1 + params.size) ? 'yes' : 'no — orbit too tilted', color: C.cyan },
        ];
      },
      charts() {
        return [{ title: 'Light curve (recent)', series: [{ data: sFlux.data, color: C.amber, fill: false }], length: 400 }];
      },
    };
  },
};
