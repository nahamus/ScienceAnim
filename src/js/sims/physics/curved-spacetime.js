import { C, clamp, rgba, text, tag, backdrop, TAU } from '../../core/util.js';

// General relativity around a non-spinning mass (Schwarzschild), in units G = c = M = 1, so the
// event horizon is at r = 2 and the photon sphere at r = 3. Orbits integrate the exact equatorial
// geodesic equations by RK4:
//   Einstein:  r'' = −1/r² + L²/r³ − 3L²/r⁴      Newton: r'' = −1/r² + L²/r³      φ' = L/r²
// Light rays use the null version (r'' = L²/r³ − 3L²/r⁴). Clocks at rest tick at √(1 − 2/r).

const VIEW = 34; // half-width of the view, in units of GM/c²

function newtonL(ra, rp) {
  return Math.sqrt((2 * ra * rp) / (ra + rp));
}
/** Angular momentum of the Einstein orbit with the same far and near points (falls back to Newton's). */
function einsteinL(ra, rp) {
  if (rp < 4.5) return { L: newtonL(ra, rp), exact: false };
  if (ra - rp < 1e-6) return { L: Math.sqrt(ra / (1 - 3 / ra)), exact: true };
  const L2 = (2 / ra - 2 / rp) / ((1 - 2 / ra) / ra ** 2 - (1 - 2 / rp) / rp ** 2);
  return L2 > 0 ? { L: Math.sqrt(L2), exact: true } : { L: newtonL(ra, rp), exact: false };
}

function makeBody(ra, e, gr) {
  const rp = (ra * (1 - e)) / (1 + e);
  const L = gr ? einsteinL(ra, rp).L : newtonL(ra, rp);
  return { gr, L, r: ra, vr: 0, phi: Math.PI, trail: [], peris: [], prevVr: 0, dead: false };
}
function stepBody(b, dt) {
  const acc = (r) => -1 / r ** 2 + (b.L * b.L) / r ** 3 - (b.gr ? (3 * b.L * b.L) / r ** 4 : 0);
  const f = (r, vr) => [vr, acc(r), b.L / (r * r)];
  const k1 = f(b.r, b.vr);
  const k2 = f(b.r + (k1[0] * dt) / 2, b.vr + (k1[1] * dt) / 2);
  const k3 = f(b.r + (k2[0] * dt) / 2, b.vr + (k2[1] * dt) / 2);
  const k4 = f(b.r + k3[0] * dt, b.vr + k3[1] * dt);
  b.r += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
  b.vr += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
  b.phi += (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
  if (b.prevVr < 0 && b.vr >= 0) b.peris.push(b.phi);
  b.prevVr = b.vr;
  if (b.gr && b.r <= 2.02) b.dead = true;
}

/** Trace a light ray arriving from the left at height y (impact parameter |y|). */
function traceRay(y0) {
  let x = -VIEW * 1.25, y = y0;
  let r = Math.hypot(x, y), phi = Math.atan2(y, x);
  const L = -y0; // photon moving in +x: L = x·vy − y·vx
  let vr = x / r;
  const pts = [[x, y]];
  let captured = false;
  for (let i = 0; i < 6000; i++) {
    const dl = clamp(0.02 * r, 0.01, 0.6);
    const acc = (r) => (L * L) / r ** 3 - (3 * L * L) / r ** 4;
    const f = (r, vr) => [vr, acc(r), L / (r * r)];
    const k1 = f(r, vr), k2 = f(r + (k1[0] * dl) / 2, vr + (k1[1] * dl) / 2), k3 = f(r + (k2[0] * dl) / 2, vr + (k2[1] * dl) / 2), k4 = f(r + k3[0] * dl, vr + k3[1] * dl);
    r += (dl / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    vr += (dl / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    phi += (dl / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    if (r <= 2.01) {
      captured = true;
      pts.push([2 * Math.cos(phi), 2 * Math.sin(phi)]);
      break;
    }
    pts.push([r * Math.cos(phi), r * Math.sin(phi)]);
    if (r > VIEW * 1.6) break;
  }
  const [xa, ya] = pts[pts.length - 2], [xb, yb] = pts[pts.length - 1];
  const bend = captured ? null : Math.abs(Math.atan2(yb - ya, xb - xa));
  return { pts, captured, b: Math.abs(y0), bend };
}

export default {
  id: 'curved-spacetime',
  title: 'Gravity as Curved Spacetime',
  category: 'physics',
  tagline: 'Orbits that swing round, light that bends and clocks that slow down near a black hole.',
  ages: ['16+'],
  topics: ['Relativity', 'Gravity'],
  keywords: ['general relativity', 'einstein', 'curved spacetime', 'schwarzschild', 'black hole', 'geodesic', 'precession', 'mercury', 'gravitational lensing', 'light bending', 'time dilation', 'gps', 'photon sphere', 'isco', 'eddington 1919'],
  blurb:
    'Einstein’s general relativity (1915) says gravity isn’t a force pulling across space: mass curves space and time, and everything, light included, follows the straightest possible path through that curved spacetime. Far from a mass this gives Newton’s laws almost exactly; close to a black hole it doesn’t. Here orbits, light rays and clocks follow the exact equations for the spacetime around a black hole, side by side with Newton’s predictions.',
  ideas: [
    'Mass curves spacetime; free objects follow the straightest paths, called <b>geodesics</b>.',
    'Orbits don’t quite close: each loop <b>swings round</b>. Mercury’s orbit shifts 43″ per century more than Newton predicts.',
    'Closer than <b>6 GM/c²</b> to a black hole there are no stable orbits; inside 3 GM/c² even light can circle.',
    'Light <b>bends</b> around mass: twice Newton’s amount, as the 1919 eclipse confirmed.',
    'Clocks run <b>slower</b> deeper in gravity. GPS satellites must correct for it every day.',
  ],
  hint: 'Tap to launch a light ray, or to start an orbit there',
  renderScale: 1,
  thumbChapter: 1,
  thumbFrames: 400,
  params: [
    { key: 'view', label: 'Show', type: 'select', value: 'orbit', options: [{ value: 'orbit', label: 'Orbits' }, { value: 'light', label: 'Light' }, { value: 'clocks', label: 'Clocks' }] },
    { key: 'ra', label: 'Orbit: farthest distance (GM/c²)', type: 'range', min: 5, max: 32, step: 0.5, value: 30, instant: true },
    { key: 'ecc', label: 'Orbit: stretch (eccentricity)', type: 'range', min: 0, max: 0.6, step: 0.01, value: 0.5, instant: true },
    { key: 'newton', label: 'Show Newton’s prediction', type: 'toggle', value: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.25, max: 4, step: 0.05, value: 1, unit: '×' },
    { key: 'restart', label: 'Start again', type: 'button', action: (sim) => sim.restart() },
  ],
  story: [
    {
      title: 'Gravity is geometry',
      text: 'Einstein’s 1915 idea: a mass curves the space and time around it, and a planet isn’t pulled, it simply follows the straightest path it can through that curved spacetime. Far out, at 30 times the black hole’s “size” <b>GM/c²</b>, his orbit (cyan) and Newton’s ellipse (white) almost agree.',
      params: { view: 'orbit', ra: 30, ecc: 0.12, newton: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 13,
    },
    {
      title: 'Orbits that swing round',
      text: 'Make the orbit dip closer and the difference shows: Einstein’s orbit doesn’t close, each loop starts a little further round, tracing a rosette. Newton’s ellipse repeats forever. Mercury’s orbit does this by an extra <b>43 arcseconds per century</b>, a puzzle Newton couldn’t explain and Einstein’s first triumph.',
      formula: 'extra turn per orbit ≈ 6πGM / (c² p)',
      check: {
        q: 'Which planet should show this extra swing most strongly?',
        options: ['Mercury, the closest to the Sun', 'Neptune, the farthest', 'They all show the same'],
        answer: 0,
        setup: { view: 'orbit', ra: 30, ecc: 0.12 },
        explain: 'The effect grows as 1/p, and much faster in the strong curvature close in. Mercury is closest, so its orbit swings most; for the outer planets it is far too small to notice.',
      },
      params: { view: 'orbit', ra: 30, ecc: 0.5, newton: true, speed: 1.4 },
      enter: (s) => s.restart(),
      duration: 17,
    },
    {
      title: 'No safe orbits close in',
      text: 'Now a circular orbit at 5.5 GM/c². In Newton’s world it would go round forever. In Einstein’s, nothing can orbit stably closer than <b>6 GM/c²</b>: the orbit spirals inwards and plunges through the event horizon (black disc). That “innermost stable orbit” sets the inner edge of the glowing discs around real black holes.',
      params: { view: 'orbit', ra: 5.5, ecc: 0, newton: true, speed: 0.7 },
      enter: (s) => s.restart(),
      duration: 14,
    },
    {
      title: 'Light bends too',
      text: 'Light has no mass, yet its path curves as well. Rays passing far away are nudged; those closer than 5.2 GM/c² are swallowed. At <b>3 GM/c²</b> (dashed) light can circle the black hole. In 1919 Eddington measured starlight passing the Sun during an eclipse and found exactly Einstein’s bend.',
      check: {
        q: 'In 1919 starlight passing the Sun was found to bend by…',
        options: ['Nothing at all', 'Exactly Newton’s prediction', 'Twice Newton’s prediction'],
        answer: 2,
        setup: { view: 'light' },
        explain: 'Treating light as a fast particle, Newton’s gravity gives 0.87 arcseconds at the Sun’s edge. General relativity adds the bending of space itself, doubling it to 1.75″, which is what the eclipse photographs showed.',
      },
      params: { view: 'light', speed: 1 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Clocks run slow near mass',
      text: 'Time is curved too. A clock held at rest near the black hole ticks slower than one far away: at 3 GM/c² it runs at 58% speed, at the horizon it would freeze. On Earth the effect is tiny but real: <b>GPS</b> satellite clocks gain 45 microseconds a day from weaker gravity and lose 7 from their speed. Uncorrected, positions would drift about 10 km a day.',
      formula: 'tick rate = √(1 − 2GM / rc²)',
      check: {
        q: 'Compared with a clock at sea level, a clock on top of a high mountain runs…',
        options: ['Slightly faster', 'Slightly slower', 'At exactly the same rate'],
        answer: 0,
        setup: { view: 'clocks' },
        explain: 'It sits a little higher out of Earth’s gravity, so it ticks faster, by about 1 part in 10¹⁶ for every metre of height. Modern atomic clocks can measure the difference for a height change of a few centimetres.',
      },
      params: { view: 'clocks', speed: 1 },
      enter: (s) => s.restart(),
      duration: 17,
    },
    {
      title: 'Lenses in the sky',
      text: 'Mass bends light from distant galaxies into arcs and rings: <b>gravitational lensing</b>, now used to weigh dark matter. In 2019 the Event Horizon Telescope photographed the bright ring of light skimming the photon sphere around the black hole in galaxy M87.',
      params: { view: 'light', speed: 1.4 },
      enter: (s) => s.restart(true),
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'In orbit view, tap anywhere to start an orbit at that distance and change its stretch. In light view, tap to fire a ray at that height and find the one that circles the black hole.',
      params: { view: 'orbit', ra: 14, ecc: 0.35, newton: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let bodies = [], rays = [], t = 0, L = {}, dense = false, replayAt = 0;

    function restart(denseRays = false) {
      dense = denseRays;
      t = 0;
      replayAt = 0;
      bodies = [makeBody(params.ra, params.ecc, true), makeBody(params.ra, params.ecc, false)];
      const ys = dense ? Array.from({ length: 29 }, (_, i) => -14 + i) : [-24, -16, -11, -8, -6.5, -5.6, 5.0, 5.25, 6, 8, 12, 20];
      rays = ys.map((y) => ({ ...traceRay(y), born: (Math.abs(y) % 3) * 0.2 }));
    }
    restart();

    // zoom to suit what is shown: the whole orbit, or close in for light and clocks
    const viewR = () => (params.view === 'orbit' ? Math.max(params.ra * 1.15, 9) : params.view === 'light' ? 20 : 14);
    const toScreen = (x, y) => [L.cx + x * L.s, L.cy - y * L.s];
    const period = () => {
      const ra = params.ra, rp = (ra * (1 - params.ecc)) / (1 + params.ecc);
      return TAU * ((ra + rp) / 2) ** 1.5;
    };

    return {
      restart,
      resize(w, h) {
        const narrow = w < 700;
        if (narrow) {
          const R = Math.min(w / 2 - 10, (h - 150) / 2);
          L = { narrow, cx: w / 2, cy: 104 + R, R };
        } else {
          const x0 = w - 550 >= 360 ? 510 : Math.max(w * 0.38, 380);
          const R = Math.min((w - 40 - x0) / 2, (h - 130) / 2);
          L = { narrow, cx: x0 + (w - 40 - x0) / 2, cy: 92 + (h - 130) / 2, R };
        }
      },
      onParam(k) {
        if (k === 'view' || k === 'ra' || k === 'ecc') restart();
      },
      pointerDown(p) {
        L.s = L.R / viewR();
        const x = (p.x - L.cx) / L.s, y = -(p.y - L.cy) / L.s;
        if (params.view === 'light') {
          if (Math.abs(y) < VIEW) rays.push({ ...traceRay(y), born: t, mine: true });
          if (rays.length > 40) rays.splice(0, rays.length - 40);
        } else if (params.view === 'orbit') {
          const r = Math.hypot(x, y);
          if (r > 4 && r < 32) api.runner.set('ra', Math.round(r * 2) / 2);
        }
      },
      update(dt) {
        const sdt = dt * params.speed;
        t += sdt;
        // replay the beam of light every 7 seconds (unless you are firing your own rays)
        if (params.view === 'light' && t - replayAt > 7 && !rays.some((r) => r.mine)) {
          replayAt = t;
          for (const r of rays) r.born = t + (r.b % 3) * 0.2;
        }
        if (params.view !== 'orbit') return;
        // one Newtonian orbit takes about 5 seconds, whatever its size
        const budget = (period() / 5) * sdt;
        for (const b of bodies) {
          let left = budget;
          while (left > 0 && !b.dead) {
            const h = Math.min(left, 0.0157 * b.r ** 1.5);
            stepBody(b, h);
            left -= h;
            const tr = b.trail;
            const last = tr[tr.length - 1];
            const x = b.r * Math.cos(b.phi), y = b.r * Math.sin(b.phi);
            if (!last || Math.hypot(x - last[0], y - last[1]) > 0.15) tr.push([x, y]);
            if (tr.length > 2600) tr.shift();
          }
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const s = (L.s = L.R / viewR());
        const VR = viewR();
        // faint radial grid (circles every 5 GM/c²)
        ctx.strokeStyle = 'rgba(140,160,220,0.07)';
        ctx.lineWidth = 1;
        for (let r = 5; r <= VR; r += 5) {
          ctx.beginPath();
          ctx.arc(L.cx, L.cy, r * s, 0, TAU);
          ctx.stroke();
        }
        // photon sphere, ISCO, horizon
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = rgba(C.amber, 0.45);
        ctx.beginPath();
        ctx.arc(L.cx, L.cy, 3 * s, 0, TAU);
        ctx.stroke();
        if (params.view === 'orbit') {
          ctx.strokeStyle = rgba(C.violet, 0.45);
          ctx.beginPath();
          ctx.arc(L.cx, L.cy, 6 * s, 0, TAU);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        const g = ctx.createRadialGradient(L.cx, L.cy, 2 * s * 0.6, L.cx, L.cy, 2 * s * 1.5);
        g.addColorStop(0, '#000');
        g.addColorStop(0.65, '#000');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(L.cx, L.cy, 3 * s, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(L.cx, L.cy, 2 * s, 0, TAU);
        ctx.stroke();

        if (params.view === 'orbit') {
          for (const b of bodies) {
            if (!b.gr && !params.newton) continue;
            const col = b.gr ? C.cyan : '#ffffff';
            ctx.strokeStyle = rgba(col, b.gr ? 0.75 : 0.4);
            ctx.lineWidth = b.gr ? 1.6 : 1.2;
            if (!b.gr) ctx.setLineDash([5, 5]);
            ctx.beginPath();
            b.trail.forEach(([x, y], i) => {
              const [X, Y] = toScreen(x, y);
              i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
            });
            ctx.stroke();
            ctx.setLineDash([]);
            if (!b.dead) {
              const [X, Y] = toScreen(b.r * Math.cos(b.phi), b.r * Math.sin(b.phi));
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.arc(X, Y, 5, 0, TAU);
              ctx.fill();
            }
          }
          if (!api.thumbnail) {
            tag(ctx, 'Einstein', L.narrow ? 16 : L.cx - VR * s, L.narrow ? L.cy + VR * s + 8 : 104, C.cyan);
            if (params.newton) tag(ctx, 'Newton', L.narrow ? 96 : L.cx - VR * s + 80, L.narrow ? L.cy + VR * s + 8 : 104, C.ink);
            const gr = bodies[0];
            if (gr.dead) text(ctx, 'plunged through the horizon', L.cx, L.cy + 6 * s + 20, { size: 12, align: 'center', color: C.red, weight: 700 });
          }
        } else if (params.view === 'light') {
          for (const ray of rays) {
            const age = t - ray.born;
            if (age < 0) continue;
            const n = ray.pts.length;
            const head = Math.min(n, Math.floor((age * 1.6 * n) / 3));
            ctx.strokeStyle = ray.captured ? rgba(C.red, 0.55) : rgba(ray.mine ? C.lime : C.amber, 0.6);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            for (let i = 0; i < head; i++) {
              const [X, Y] = toScreen(...ray.pts[i]);
              i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
            }
            ctx.stroke();
            if (head < n && head > 0) {
              const [X, Y] = toScreen(...ray.pts[head - 1]);
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(X, Y, 2.5, 0, TAU);
              ctx.fill();
            }
          }
          if (!api.thumbnail) text(ctx, 'photon sphere 3 GM/c²', L.cx + 3 * s + 6, L.cy - 3 * s - 4, { size: 10, color: C.amber });
        } else {
          // clocks at rest at different distances
          const rs = [2.3, 3, 6, 12, Infinity];
          const span = L.narrow ? w - 40 : VR * s * 1.9;
          const x0 = L.narrow ? 20 : L.cx - VR * s * 0.95;
          rs.forEach((r, i) => {
            const rate = r === Infinity ? 1 : Math.sqrt(1 - 2 / r);
            const x = x0 + (span * (i + 0.5)) / rs.length;
            const y = L.cy + VR * s * 0.55;
            const R = Math.min(span / rs.length / 2 - 6, 34);
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 2;
            ctx.fillStyle = '#0d1328';
            ctx.beginPath();
            ctx.arc(x, y, R, 0, TAU);
            ctx.fill();
            ctx.stroke();
            const a = -Math.PI / 2 + (t * rate * TAU) / 4;
            ctx.strokeStyle = C.amber;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(a) * R * 0.8, y + Math.sin(a) * R * 0.8);
            ctx.stroke();
            text(ctx, r === Infinity ? 'far away' : `r = ${r}`, x, y + R + 14, { size: 11, align: 'center', color: C.dim });
            text(ctx, `${Math.round(rate * 100)}%`, x, y + R + 30, { size: 13, align: 'center', weight: 700, color: rate < 0.7 ? C.red : C.teal });
            // where the clock sits relative to the hole
            if (r !== Infinity) {
              const [X] = toScreen(r, 0);
              ctx.fillStyle = rgba(C.amber, 0.9);
              ctx.beginPath();
              ctx.arc(X, L.cy, 3.5, 0, TAU);
              ctx.fill();
              text(ctx, String(r), X, L.cy + (i % 2 ? 14 : -12), { size: 10, align: 'center', color: C.amber });
            }
          });
          if (!api.thumbnail) text(ctx, 'clocks held still at each distance (far-away clock = 100%)', x0, L.cy + VR * s * 0.55 - 52, { size: 12, color: C.dim });
        }
      },
      stats() {
        if (params.view === 'orbit') {
          const gr = bodies[0];
          const d = gr.peris.slice(1).map((p, i) => p - gr.peris[i] - TAU);
          const prec = d.length ? (d.reduce((a, b) => a + b) / d.length) * (180 / Math.PI) : null;
          const rp = (params.ra * (1 - params.ecc)) / (1 + params.ecc);
          const p = (2 * params.ra * rp) / (params.ra + rp);
          return [
            { label: 'Closest approach', value: rp.toFixed(1) + ' GM/c²' },
            { label: 'Swing per orbit (measured)', value: gr.dead ? 'plunged' : prec === null ? '…' : prec.toFixed(1) + '°', color: C.cyan },
            { label: 'Weak-field formula 6π/p', value: ((6 * Math.PI) / p * (180 / Math.PI)).toFixed(1) + '°' },
            { label: 'Clock rate at closest', value: Math.round(Math.sqrt(Math.max(0, 1 - 2 / rp)) * 100) + '%' },
          ];
        }
        if (params.view === 'light') {
          const far = rays.filter((r) => !r.captured && r.b >= 10).sort((a, b) => a.b - b.b)[0];
          return [
            { label: 'Rays swallowed', value: `${rays.filter((r) => r.captured).length} of ${rays.length}`, color: C.red },
            { label: 'Capture distance', value: '5.20 GM/c² (3√3)' },
            { label: far ? `Bend at b = ${far.b}` : 'Bend', value: far ? ((far.bend * 180) / Math.PI).toFixed(1) + '°' : '—', color: C.amber },
            { label: far ? 'Weak-field 4GM/(c²b)' : 'Weak-field', value: far ? ((4 / far.b) * (180 / Math.PI)).toFixed(1) + '°' : '—' },
          ];
        }
        return [
          { label: 'At 3 GM/c²', value: '58% speed' },
          { label: 'At the horizon', value: 'stops' },
          { label: 'GPS: gravity', value: '+45 μs/day' },
          { label: 'GPS: speed', value: '−7 μs/day' },
        ];
      },
    };
  },
};
