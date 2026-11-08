import { C, TAU, tag, text, drawGlow, Series } from '../../core/util.js';

// Radii as fractions of Earth's radius (6371 km)
const CMB = 3480 / 6371, ICB = 1220 / 6371;
const RE = 6371;

/** Simplified PREM-like velocity model (km/s). */
function vel(r, wave) {
  if (r > CMB) {
    const t = (1 - r) / (1 - CMB); // 0 at surface, 1 at core boundary
    return wave === 'P' ? 7.6 + 6.1 * Math.pow(t, 0.25) : 4.3 + 3.0 * Math.pow(t, 0.25);
  }
  if (r > ICB) {
    if (wave === 'S') return 0; // liquid outer core: no shear waves
    const t = (CMB - r) / (CMB - ICB);
    return 8.0 + 2.3 * t;
  }
  return wave === 'P' ? 11.1 : 3.6;
}
const layerOf = (r) => (r > CMB ? 0 : r > ICB ? 1 : 2);

/** Trace one ray through the layered Earth; returns [x, y, t] samples and where it surfaced. */
function traceRay(take, wave) {
  // source at the north pole (0, 1); take = angle from straight down (rad), positive toward +x
  let x = 0, y = 0.999, dx = Math.sin(take), dy = -Math.cos(take), t = 0;
  const pts = [[x, y, 0]];
  const ds = 0.004;
  let layer = 0;
  for (let i = 0; i < 4000; i++) {
    const r = Math.hypot(x, y);
    const v = vel(r, wave);
    // bend toward slower material: d(dir)/ds = (∇n − (∇n·dir)dir)/n with n = 1/v
    const h = 1e-3;
    const n = 1 / v;
    const nr = 1 / vel(Math.min(0.9999, r + h), wave);
    const nl = 1 / vel(Math.max(0.0001, r - h), wave);
    let dn = 0;
    if (layerOf(r + h) === layerOf(r) && layerOf(r - h) === layerOf(r)) dn = (nr - nl) / (2 * h);
    const ux = x / r, uy = y / r;
    const gx = dn * ux, gy = dn * uy;
    const dot = gx * dx + gy * dy;
    dx += ((gx - dot * dx) / n) * ds;
    dy += ((gy - dot * dy) / n) * ds;
    const m = Math.hypot(dx, dy);
    dx /= m;
    dy /= m;
    let nx = x + dx * ds, ny = y + dy * ds;
    const nrad = Math.hypot(nx, ny);
    const nl2 = layerOf(nrad);
    if (nl2 !== layer) {
      // Snell's law at the spherical boundary
      const v1 = vel(r, wave), v2 = vel(nrad, wave);
      if (v2 === 0) {
        pts.push([nx, ny, t + (ds * RE) / v1]);
        return { pts, end: null, blocked: true };
      }
      const Nx = nx / nrad, Ny = ny / nrad;
      const cosi = -(dx * Nx + dy * Ny) * (nl2 > layer ? 1 : -1);
      const nNx = nl2 > layer ? Nx : -Nx, nNy = nl2 > layer ? Ny : -Ny; // normal facing the incoming ray
      const eta = v2 / v1;
      const k = 1 - eta * eta * (1 - cosi * cosi);
      if (k < 0) {
        dx = dx + 2 * cosi * nNx;
        dy = dy + 2 * cosi * nNy;
      } else {
        const tx = eta * dx + (eta * cosi - Math.sqrt(k)) * nNx;
        const ty = eta * dy + (eta * cosi - Math.sqrt(k)) * nNy;
        dx = tx;
        dy = ty;
        layer = nl2;
      }
      nx = x + dx * ds;
      ny = y + dy * ds;
    }
    t += (ds * RE) / v;
    x = nx;
    y = ny;
    pts.push([x, y, t]);
    if (Math.hypot(x, y) >= 1) {
      const ang = Math.atan2(x, y); // epicentral angle from the pole
      return { pts, end: { ang, t }, blocked: false };
    }
  }
  return { pts, end: null, blocked: false };
}

export default {
  id: 'seismic-waves',
  title: 'Seeing Inside the Earth',
  category: 'earth',
  tagline: 'Nobody has drilled past the crust. Earthquakes showed us the liquid core anyway.',
  ages: ['14-16'],
  topics: ['Earth structure', 'Waves'],
  blurb:
    'The deepest hole ever drilled reaches just 12 km — 0.2% of the way to Earth’s centre. Everything we know about the deep interior comes from earthquakes. Their waves bend, speed up and get blocked as they pass through the planet, and seismometers around the world record the result. The pattern reveals a liquid outer core and a solid inner core.',
  ideas: [
    '<b>P waves</b> (push–pull) travel through solids and liquids; <b>S waves</b> (shake) only through solids.',
    'Rock gets stiffer with depth, so waves speed up and their paths <b>curve</b> back toward the surface.',
    'S waves never reach the far side of the Earth: the outer core must be <b>liquid</b>.',
    'P waves bend sharply at the core, leaving a <b>shadow zone</b> 104°–140° from the quake.',
  ],
  hint: 'Click on the surface to set off an earthquake there',
  thumbChapter: 3,
  thumbFrames: 600,
  params: [
    { key: 'P', label: 'P waves (compression)', type: 'toggle', value: true },
    { key: 'S', label: 'S waves (shear)', type: 'toggle', value: true },
    { key: 'rays', label: 'Rays', type: 'range', min: 10, max: 80, step: 1, value: 44, instant: true },
    { key: 'speed', label: 'Playback (×60 = 1 min/s)', type: 'range', min: 20, max: 240, step: 5, value: 90, format: (v) => '×' + v },
    { key: 'trails', label: 'Show full ray paths', type: 'toggle', value: true },
    { key: 'quake', label: 'Trigger earthquake', type: 'button', action: (s) => s.quake() },
  ],
  story: [
    {
      title: 'An earthquake',
      text: 'An earthquake strikes at the top of the globe. Seismic waves race out in every direction through the planet’s interior. Our cut-away shows the rocky mantle, the outer core and the inner core.',
      params: { P: true, S: false, trails: false, speed: 90 },
      enter: (s) => s.quake(0),
      duration: 13,
    },
    {
      title: 'Two kinds of wave',
      text: '<b style="color:#5b8cff">P waves</b> squeeze and stretch the rock, like sound; they arrive first. <b style="color:#ff4d6d">S waves</b> shake it side to side and travel at about 60% of the speed. Seismometers (the dots on the surface) record both.',
      params: { P: true, S: true, trails: false, speed: 90 },
      enter: (s) => s.quake(0),
      duration: 15,
    },
    {
      title: 'Curved paths',
      text: 'Deeper rock is under huge pressure and carries waves faster. Like light through a lens, the waves bend toward slower rock, so their paths <b>curve back up</b> toward the surface.',
      params: { P: true, S: false, trails: true, speed: 120 },
      enter: (s) => s.quake(0),
      duration: 13,
    },
    {
      title: 'The S-wave shadow',
      text: 'S waves cannot travel through liquid. Every S wave that meets the outer core is stopped, leaving a huge <b>shadow</b> on the far side of the planet. In 1906 this told scientists that Earth’s outer core is molten iron.',
      params: { P: false, S: true, trails: true, speed: 120 },
      enter: (s) => s.quake(0),
      duration: 15,
    },
    {
      title: 'The P-wave shadow',
      text: 'P waves do pass through the core, but they slow down there and bend sharply, leaving a ring 104°–140° from the quake where almost no P waves arrive. Faint waves inside this zone led Inge Lehmann in 1936 to discover a <b>solid inner core</b>.',
      params: { P: true, S: false, trails: true, speed: 120 },
      enter: (s) => s.quake(0),
      duration: 16,
    },
    {
      title: 'Your earthquake',
      text: 'Click anywhere on the surface to set off a quake there and watch which seismometers hear it.',
      params: { P: true, S: true, trails: true, speed: 90 },
      enter: (s) => s.quake(0.6),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let rays = { P: [], S: [] }, t = 0, src = 0, stations = [], tMax = 1;
    const sP = new Series(200), sS = new Series(200);

    function build() {
      const n = Math.round(params.rays);
      rays = { P: [], S: [] };
      tMax = 1;
      for (const wave of ['P', 'S'])
        for (let i = 0; i < n; i++) {
          const take = -Math.PI / 2 + 0.03 + ((Math.PI - 0.06) * (i + 0.5)) / n;
          const r = traceRay(take, wave);
          rays[wave].push(r);
          if (r.end) tMax = Math.max(tMax, r.end.t);
        }
      stations = [];
      for (let k = 0; k < 36; k++) stations.push({ ang: (k / 36) * TAU, P: null, S: null, flash: 0 });
      // arrival times at the stations come from a much denser fan of rays
      for (const wave of ['P', 'S'])
        for (let i = 0; i < 260; i++) {
          const take = -Math.PI / 2 + 0.02 + ((Math.PI - 0.04) * (i + 0.5)) / 260;
          const r = traceRay(take, wave);
          if (!r.end) continue;
          for (const st of stations) {
            const d = Math.abs((((st.ang - r.end.ang + Math.PI) % TAU) + TAU) % TAU - Math.PI);
            if (d < 0.045 && (st[wave] === null || r.end.t < st[wave])) st[wave] = r.end.t;
          }
        }
    }

    function quake(at = src) {
      src = at;
      t = 0;
      sP.clear();
      sS.clear();
      for (const st of stations) st.flash = 0;
    }

    build();

    const geom = () => {
      const { w, h } = api;
      const R = Math.min(w * 0.42, (h - 120) * 0.5);
      return { cx: w * (w > 900 ? 0.56 : 0.5), cy: Math.max(80 + R, h * 0.5 - 10), R };
    };

    return {
      quake,
      reset: () => quake(),
      onParam(k) {
        if (k === 'rays') build();
      },
      pointerDown(p) {
        const g = geom();
        const d = Math.hypot(p.x - g.cx, p.y - g.cy);
        if (Math.abs(d - g.R) < 40 || d < g.R) quake(Math.atan2(p.x - g.cx, -(p.y - g.cy)));
      },
      update(dt) {
        t += dt * params.speed;
        if (t > tMax + 200) quake();
        for (const st of stations) {
          for (const wv of ['P', 'S']) if (params[wv] && st[wv] !== null && t >= st[wv] && t - dt * params.speed < st[wv]) st.flash = 1;
          st.flash = Math.max(0, st.flash - dt * 1.2);
        }
        if (api.frame % 3 === 0) {
          // a synthetic seismogram at the station 90° from the quake
          const st = stations.reduce((a, b) => (Math.abs(b.ang - Math.PI / 2) < Math.abs(a.ang - Math.PI / 2) ? b : a));
          const amp = (arr) => (arr === null ? 0 : Math.exp(-Math.max(0, t - arr) / 40) * (t >= arr ? Math.sin((t - arr) * 0.6) : 0));
          sP.push(params.P ? amp(st.P) : 0);
          sS.push(params.S ? amp(st.S) * 1.6 : 0);
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#03040b';
        ctx.fillRect(0, 0, w, h);
        const g = geom();
        const { cx, cy, R } = g;
        // layers
        const layer = (r, c0, c1) => {
          const grd = ctx.createRadialGradient(cx, cy, r * R * 0.2, cx, cy, r * R);
          grd.addColorStop(0, c0);
          grd.addColorStop(1, c1);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(cx, cy, r * R, 0, TAU);
          ctx.fill();
        };
        layer(1, '#5a2a12', '#2a1a14');
        layer(CMB, '#9a4a1e', '#5a2410');
        layer(ICB, '#d8a24a', '#9a6a22');
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, TAU);
        ctx.stroke();
        if (!api.thumbnail) {
          text(ctx, 'mantle (solid rock)', cx, cy - R * 0.78, { size: 11, align: 'center', color: 'rgba(255,220,200,0.55)' });
          text(ctx, 'outer core (liquid iron)', cx, cy - CMB * R * 0.72, { size: 11, align: 'center', color: 'rgba(255,200,160,0.6)', shadow: false });
          text(ctx, 'inner core', cx, cy, { size: 10, align: 'center', color: 'rgba(60,30,5,0.85)', shadow: false });
        }

        // rays rotated to the source position
        const cs = Math.cos(src), sn = Math.sin(src);
        const P = (x, y) => [cx + (x * cs + y * sn) * R, cy - (-x * sn + y * cs) * R];
        for (const wave of ['P', 'S']) {
          if (!params[wave]) continue;
          const col = wave === 'P' ? '#5b8cff' : '#ff4d6d';
          for (const r of rays[wave]) {
            const pts = r.pts;
            // index of the last point reached by time t
            let lo = 0, hi = pts.length - 1;
            while (lo < hi) {
              const mid = (lo + hi + 1) >> 1;
              if (pts[mid][2] <= t) lo = mid;
              else hi = mid - 1;
            }
            const start = params.trails ? 0 : Math.max(0, lo - 25);
            if (lo > start) {
              ctx.strokeStyle = col;
              ctx.globalAlpha = params.trails ? 0.6 : 0.85;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              for (let i = start; i <= lo; i += 3) ctx[i === start ? 'moveTo' : 'lineTo'](...P(pts[i][0], pts[i][1]));
              ctx.lineTo(...P(pts[lo][0], pts[lo][1]));
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
            if (lo < pts.length - 1 && t > 0) {
              const [x, y] = P(pts[lo][0], pts[lo][1]);
              ctx.globalCompositeOperation = 'lighter';
              drawGlow(ctx, x, y, 7, col, 0.3);
              ctx.globalCompositeOperation = 'source-over';
            } else if (r.blocked && lo === pts.length - 1) {
              const [x, y] = P(pts[lo][0], pts[lo][1]);
              ctx.fillStyle = 'rgba(255,77,109,0.8)';
              ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
            }
          }
        }
        // shadow-zone arcs (drawn once waves have had time to arrive)
        if (t > tMax * 0.6 && !api.thumbnail) {
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          if (params.S) {
            ctx.strokeStyle = 'rgba(255,77,109,0.35)';
            ctx.beginPath();
            ctx.arc(cx, cy, R + 12, -Math.PI / 2 + src + 104 * (Math.PI / 180), -Math.PI / 2 + src + (360 - 104) * (Math.PI / 180));
            ctx.stroke();
          }
          if (params.P) {
            ctx.strokeStyle = 'rgba(91,140,255,0.45)';
            for (const sgn of [1, -1]) {
              ctx.beginPath();
              const a0 = -Math.PI / 2 + src + sgn * 104 * (Math.PI / 180), a1 = -Math.PI / 2 + src + sgn * 140 * (Math.PI / 180);
              ctx.arc(cx, cy, R + (params.S ? 22 : 12), Math.min(a0, a1), Math.max(a0, a1));
              ctx.stroke();
            }
          }
          const lblA = -Math.PI / 2 + src + Math.PI;
          if (params.S) tag(ctx, 'S-wave shadow', cx + Math.cos(lblA) * (R + 40), cy + Math.sin(lblA) * (R + 40), C.red, { align: 'center', size: 10 });
          if (params.P && !params.S) {
            const a = -Math.PI / 2 + src + 122 * (Math.PI / 180);
            tag(ctx, 'P-wave shadow', cx + Math.cos(a) * (R + 40), cy + Math.sin(a) * (R + 40), C.blue, { align: 'center', size: 10 });
          }
        }
        // stations
        for (const st of stations) {
          const a = -Math.PI / 2 + src + st.ang;
          const x = cx + Math.cos(a) * (R + 4), y = cy + Math.sin(a) * (R + 4);
          ctx.fillStyle = st.flash > 0 ? `rgba(255,255,255,${0.4 + 0.6 * st.flash})` : 'rgba(233,237,247,0.35)';
          ctx.beginPath();
          ctx.arc(x, y, 3 + st.flash * 3, 0, TAU);
          ctx.fill();
        }
        // epicentre
        const ex = cx + Math.cos(-Math.PI / 2 + src) * R, ey = cy + Math.sin(-Math.PI / 2 + src) * R;
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, ex, ey, 26 + 8 * Math.sin(api.time * 8), '#ffd27a', 0.3);
        ctx.globalCompositeOperation = 'source-over';
        if (!api.thumbnail) tag(ctx, `${Math.floor(t / 60)} min ${String(Math.floor(t % 60)).padStart(2, '0')} s after the quake`, w - 16, 84, C.ink, { align: 'right', size: 11 });
      },
      stats() {
        const heardP = stations.filter((s) => s.P !== null && t >= s.P).length;
        const heardS = stations.filter((s) => s.S !== null && t >= s.S).length;
        const far = stations.find((s) => Math.abs(s.ang - Math.PI) < 0.1);
        return [
          { label: 'Time since quake', value: `${(t / 60).toFixed(1)} min` },
          { label: 'Stations hearing P', value: `${params.P ? heardP : '—'} / 36`, color: C.blue },
          { label: 'Stations hearing S', value: `${params.S ? heardS : '—'} / 36`, color: C.red },
          { label: 'P wave to far side', value: far?.P ? `${(far.P / 60).toFixed(1)} min` : '—' },
          { label: 'Surface P speed', value: '7.6 km/s' },
        ];
      },
      charts() {
        return [{ title: 'Seismogram 90° from the quake', series: [{ data: sP.data, color: C.blue, fill: false, label: 'P' }, { data: sS.data, color: C.red, fill: false, label: 'S' }], min: -2, max: 2, length: 200 }];
      },
    };
  },
};
