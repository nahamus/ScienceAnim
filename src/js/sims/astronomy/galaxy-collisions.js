import { C, TAU, clamp, drawGlow, tag, text } from '../../core/util.js';

// Two disc galaxies meet, in the style of Toomre & Toomre (1972): each galaxy is a heavy core (standing in for its
// dark-matter halo, softened like a Plummer sphere) and its stars are test particles that feel both cores.
// The cores feel each other plus a drag while their halos overlap (dynamical friction), which is what lets real
// galaxies merge instead of flying past. Units: length 1 = 50,000 light-years, time 1 ≈ 28 million years.

const EPS = 0.3; // halo softening
const DF = 0.2; // dynamical friction strength
const DT = 0.004;
const SOFT = 0.2; // how stars feel each core
const LY = 50000, MYR = 28, KMS = 530;
const NA = 3600;

function acc(dx, dy, dz, m, eps = EPS) {
  const r2 = dx * dx + dy * dy + dz * dz + eps * eps;
  const f = m / (r2 * Math.sqrt(r2));
  return f;
}
function seeded(s) {
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export default {
  id: 'galaxy-collisions',
  title: 'When Galaxies Collide',
  category: 'astronomy',
  tagline: 'Two spirals meet, fling out tails of stars and merge into one.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Space', 'Gravity', 'Galaxies'],
  keywords: ['galaxy collision', 'galaxy merger', 'tidal tails', 'Andromeda', 'Milky Way', 'Milkomeda', 'Antennae galaxies', 'Toomre', 'dynamical friction', 'dark matter halo', 'elliptical galaxy', 'n-body'],
  blurb:
    'Galaxies are not alone: gravity pulls neighbours together, and over billions of years many collide. Their stars almost never hit each other, because the gaps between stars are enormous. Instead, tides fling out long streams of stars, and the galaxies swing back again and again until they settle into one big round galaxy. Our own Milky Way may one day merge with Andromeda.',
  ideas: [
    'Each galaxy is held together by gravity and sits inside a huge invisible halo of <b>dark matter</b>.',
    'The near side of a galaxy is pulled harder than the far side. These <b>tides</b> stretch it into tails and bridges of stars.',
    'Stars are so far apart that when galaxies collide, they almost <b>never hit each other</b>.',
    'Overlapping halos drag on each other (<b>dynamical friction</b>), so the galaxies lose energy and merge.',
    'Mergers of spirals make big, round <b>elliptical galaxies</b>.',
  ],
  hint: 'Drag to turn the view',
  thumbChapter: 2,
  thumbFrames: 120,
  params: [
    { key: 'rp', label: 'Closest approach', type: 'range', min: 0.4, max: 3, step: 0.1, value: 1.7, instant: true, format: (v) => Math.round(v * 50) + ',000 ly' },
    { key: 'q', label: 'Size of the smaller galaxy', type: 'range', min: 0.25, max: 1, step: 0.05, value: 1, instant: true, format: (v) => Math.round(v * 100) + ' %' },
    {
      key: 'spin', label: 'Second galaxy spins…', type: 'select', value: 'with', instant: true,
      options: [{ value: 'with', label: 'With the orbit' }, { value: 'against', label: 'Against it' }],
    },
    { key: 'tilt', label: 'Tilt of the second galaxy', type: 'range', min: 0, max: 180, step: 5, value: 20, instant: true, unit: '°' },
    { key: 'view', label: 'Viewing angle', type: 'range', min: 0, max: 90, step: 1, value: 30, unit: '°' },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.2, max: 3, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'at', label: 'at', type: 'range', min: 0, max: 400, step: 1, value: 0, hidden: true, instant: true },
    { key: 'restart', label: 'Restart', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'Two galaxies meet',
      text: 'Two spiral galaxies, each with billions of stars (we show a few thousand), are falling towards each other. Each spins like a pinwheel. Their gravity pulls them closer and faster as they approach.',
      params: { rp: 1.7, q: 1, spin: 'with', tilt: 15, view: 22, speed: 1, at: 0 },
      enter: (s) => s.restart(),
      duration: 13,
    },
    {
      title: 'Tidal tails',
      text: 'As they swing past each other, each galaxy pulls harder on the near side of the other than on the far side. These <b>tides</b> fling long tails of stars out into space and draw a bridge between them. Telescopes see exactly these shapes in galaxies like the Antennae and the Mice.',
      params: { rp: 1.7, q: 1, spin: 'with', tilt: 15, speed: 1, at: 12 },
      duration: 15,
    },
    {
      title: 'Stars never crash',
      text: 'So how many stars collided? Almost certainly none. Stars are tiny compared with the gaps between them: if the Sun were a grain of sand, the nearest star would be another grain about 10 km away. Galaxies pass through each other like two swarms of gnats.',
      check: {
        q: 'When two galaxies of 100 billion stars each collide, how many stars hit each other?',
        options: ['Almost none', 'About half of them', 'Nearly all of them'],
        answer: 0,
        setup: { rp: 1.7, q: 1, spin: 'with', tilt: 15, speed: 1, at: 16 },
        explain: 'Stars fill only a tiny fraction of a galaxy’s volume, so head-on hits are vanishingly rare. Gas clouds are much bigger, though: they do collide, squeeze together and set off bursts of new star formation.',
      },
      params: { rp: 1.7, q: 1, spin: 'with', tilt: 15, speed: 1, at: 16 },
      duration: 13,
    },
    {
      title: 'Falling together',
      text: 'Each galaxy sits in a huge halo of dark matter. When the halos overlap they drag on each other and the galaxies lose energy, so they swing back and pass again, closer each time. After a few passes they merge into one. The spiral discs are destroyed, leaving a big, round <b>elliptical galaxy</b> with faint shells and streams around it.',
      params: { rp: 1.7, q: 1, spin: 'with', tilt: 15, speed: 3, at: 24 },
      duration: 18,
    },
    {
      title: 'Spin matters',
      text: 'Now the second galaxy spins against the direction of the orbit. Its stars rush past the other galaxy too quickly to be pulled out, so it makes hardly any tail. Only the galaxy spinning with the orbit throws out long tails.',
      params: { rp: 1.2, q: 1, spin: 'against', tilt: 0, view: 20, speed: 1.3, at: 0 },
      enter: (s) => s.restart(),
      duration: 17,
    },
    {
      title: 'Milky Way meets Andromeda',
      text: 'Andromeda is 2.5 million light-years away and falling towards us at about 110 km/s. A 2025 study using the Hubble and Gaia telescopes put the chance of a merger within the next 10 billion years at about 50 %, with the first close pass at least 5 billion years away. If it happens, the night sky will fill with tails of stars, and the Sun will most likely survive, flung into a new orbit.',
      params: { rp: 0.9, q: 0.8, spin: 'with', tilt: 75, view: 45, speed: 1.4, at: 0 },
      enter: (s) => s.restart(),
      duration: 20,
    },
    {
      title: 'Your turn',
      text: 'Change how close they pass, their sizes, tilt and spin, then restart. Can you make a long, thin tail? A ring? A quick merger?',
      params: { rp: 1.5, q: 0.5, spin: 'with', tilt: 30, view: 35, speed: 1.2, at: 0 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const N = NA * 2;
    const P = new Float32Array(N * 3), V = new Float32Array(N * 3);
    const owner = new Uint8Array(N), bright = new Float32Array(N);
    const core = [{ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, m: 1 }, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, m: 1 }];
    let zoom = 1, t = 0, minSep = 99, passes = 0, approaching = true, yaw = 0, dragging = null;

    function restart() {
      const q = params.q, M = 1 + q;
      const r0 = 7, rp = params.rp;
      const L = Math.sqrt(2 * M * rp);
      const v = Math.sqrt((2 * M) / r0);
      const vt = L / r0, vr = -Math.sqrt(Math.max(0, v * v - vt * vt));
      // relative position/velocity of core 1 (the second galaxy) around core 0, orbit anticlockwise in the x–y plane
      const ang = 2.2;
      const rx = r0 * Math.cos(ang), ry = r0 * Math.sin(ang);
      const ux = Math.cos(ang), uy = Math.sin(ang);
      const vx = vr * ux - vt * uy, vy = vr * uy + vt * ux;
      core[0] = { x: (-q / M) * rx, y: (-q / M) * ry, z: 0, vx: (-q / M) * vx, vy: (-q / M) * vy, vz: 0, m: 1 };
      core[1] = { x: (1 / M) * rx, y: (1 / M) * ry, z: 0, vx: (1 / M) * vx, vy: (1 / M) * vy, vz: 0, m: q };
      const rnd = seeded(7);
      const tilt = (params.tilt * Math.PI) / 180;
      for (let g = 0; g < 2; g++) {
        const c = core[g], R = g ? Math.sqrt(q) : 1, sgn = g === 1 && params.spin === 'against' ? -1 : 1;
        const ti = g ? tilt : 0.12;
        for (let k = 0; k < NA; k++) {
          const i = g * NA + k;
          owner[i] = g;
          let x, y, z, wx, wy, wz;
          const bulge = k < NA * 0.14;
          if (bulge) {
            const r = R * (0.03 + 0.17 * rnd());
            // random orbital plane
            const th = Math.acos(2 * rnd() - 1), ph = rnd() * TAU, ps = rnd() * TAU;
            const nx = Math.sin(th) * Math.cos(ph), ny = Math.sin(th) * Math.sin(ph), nz = Math.cos(th);
            // two unit vectors perpendicular to n
            let ax = -ny, ay = nx, az = 0;
            const al = Math.hypot(ax, ay) || 1;
            ax /= al;
            ay /= al;
            const bx = ny * az - nz * ay, by = nz * ax - nx * az, bz = nx * ay - ny * ax;
            x = r * (Math.cos(ps) * ax + Math.sin(ps) * bx);
            y = r * (Math.cos(ps) * ay + Math.sin(ps) * by);
            z = r * (Math.cos(ps) * az + Math.sin(ps) * bz);
            const vc = Math.sqrt(acc(r, 0, 0, c.m, SOFT) * r * r);
            wx = vc * (-Math.sin(ps) * ax + Math.cos(ps) * bx);
            wy = vc * (-Math.sin(ps) * ay + Math.cos(ps) * by);
            wz = vc * (-Math.sin(ps) * az + Math.cos(ps) * bz);
            bright[i] = 1;
          } else {
            const r = R * (0.12 + 0.92 * Math.sqrt(rnd()));
            const arm = rnd() < 0.7 ? (rnd() < 0.5 ? 0 : Math.PI) + Math.log(r / R + 0.1) * 2.6 + (rnd() - 0.5) * 0.7 : rnd() * TAU;
            const a = arm;
            const lx = r * Math.cos(a), ly = r * Math.sin(a), lz = (rnd() - 0.5) * 0.03;
            const vc = Math.sqrt(acc(r, 0, 0, c.m, SOFT) * r * r) * sgn;
            const lvx = -vc * Math.sin(a), lvy = vc * Math.cos(a);
            // tilt the disc about the x axis
            const ct = Math.cos(ti), st = Math.sin(ti);
            x = lx;
            y = ly * ct - lz * st;
            z = ly * st + lz * ct;
            wx = lvx;
            wy = lvy * ct;
            wz = lvy * st;
            bright[i] = 0.55 + 0.45 * rnd();
          }
          P[i * 3] = c.x + x;
          P[i * 3 + 1] = c.y + y;
          P[i * 3 + 2] = c.z + z;
          V[i * 3] = c.vx + wx;
          V[i * 3 + 1] = c.vy + wy;
          V[i * 3 + 2] = c.vz + wz;
        }
      }
      t = 0;
      zoom = clamp(3.4 / (r0 * 0.5 + 1.6), 0.45, 1.25);
      minSep = 99;
      passes = 0;
      approaching = true;
    }

    function step(dt) {
      // cores: mutual gravity plus friction while halos overlap
      const [a, b] = core;
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      const d = Math.hypot(dx, dy, dz);
      const f = acc(dx, dy, dz, 1, SOFT);
      const rvx = b.vx - a.vx, rvy = b.vy - a.vy, rvz = b.vz - a.vz;
      const fr = DF / (1 + (d / 1.0) ** 3);
      const M = a.m + b.m;
      a.vx += (f * b.m * dx + fr * rvx * (b.m / M)) * dt;
      a.vy += (f * b.m * dy + fr * rvy * (b.m / M)) * dt;
      a.vz += (f * b.m * dz + fr * rvz * (b.m / M)) * dt;
      b.vx += (-f * a.m * dx - fr * rvx * (a.m / M)) * dt;
      b.vy += (-f * a.m * dy - fr * rvy * (a.m / M)) * dt;
      b.vz += (-f * a.m * dz - fr * rvz * (a.m / M)) * dt;
      for (const c of core) {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.z += c.vz * dt;
      }
      // stars feel both cores (symplectic Euler: kick then drift)
      for (let i = 0; i < N; i++) {
        const j = i * 3;
        let ax = 0, ay = 0, az = 0;
        for (const c of core) {
          const ex = c.x - P[j], ey = c.y - P[j + 1], ez = c.z - P[j + 2];
          const s = acc(ex, ey, ez, c.m, SOFT);
          ax += s * ex;
          ay += s * ey;
          az += s * ez;
        }
        V[j] += ax * dt;
        V[j + 1] += ay * dt;
        V[j + 2] += az * dt;
        P[j] += V[j] * dt;
        P[j + 1] += V[j + 1] * dt;
        P[j + 2] += V[j + 2] * dt;
      }
      t += dt;
      const nd = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      if (nd < minSep) minSep = nd;
      // a close pass: separation dips below 2.2 after having been well apart
      if (approaching && nd < 2.2) {
        passes++;
        approaching = false;
      } else if (!approaching && nd > 2.8) approaching = true;
    }
    function ensureTime(T) {
      let n = 0;
      while (t < T && n < 40000) {
        step(DT * 2.5);
        n++;
      }
      zoom = clamp(3.4 / (Math.hypot(core[1].x - core[0].x, core[1].y - core[0].y) * 0.5 + 1.6), 0.45, 1.25);
    }

    function view() {
      const { w, h } = api;
      const phone = w < 760;
      const sc = Math.min(w / (phone ? 7 : 9), h / 6.2) * zoom;
      const cx = phone ? w * 0.5 : w * 0.56, cy = phone ? h * 0.52 : h * 0.47;
      const el = (params.view * Math.PI) / 180;
      return { sc, cx, cy, ce: Math.cos(el), se: Math.sin(el), cy2: Math.cos(yaw), sy2: Math.sin(yaw) };
    }
    function project(v, x, y, z, ox, oy, oz) {
      x -= ox;
      y -= oy;
      z -= oz;
      const X = x * v.cy2 - y * v.sy2, Y0 = x * v.sy2 + y * v.cy2;
      // tilt: view from above (view = 0) towards edge-on (view = 90)
      const Y = Y0 * v.ce - z * v.se;
      return [v.cx + X * v.sc, v.cy + Y * v.sc];
    }

    restart();

    return {
      restart,
      reset: restart,
      onParam(k, v) {
        if (k === 'rp' || k === 'q' || k === 'spin' || k === 'tilt') restart();
        if (k === 'at' && v > t) ensureTime(v);
      },
      pointerDown(p) {
        dragging = { x: p.x, y: p.y, yaw, view: params.view };
      },
      pointerMove(p) {
        if (!dragging || !p.down) return;
        yaw = dragging.yaw + (p.x - dragging.x) * 0.006;
        const nv = clamp(dragging.view + (p.y - dragging.y) * 0.3, 0, 90);
        if (Math.abs(nv - params.view) >= 1) api.runner.set('view', Math.round(nv));
      },
      pointerUp() {
        dragging = null;
      },
      update(dt) {
        // frame both galaxies: zoom out while they are far apart
        const d = Math.hypot(core[1].x - core[0].x, core[1].y - core[0].y);
        zoom += (clamp(3.4 / (d * 0.5 + 1.6), 0.45, 1.25) - zoom) * (1 - Math.exp(-dt * 1.5));
        const n = Math.round(clamp(dt * 60, 0.5, 3) * 2 * params.speed);
        for (let k = 0; k < n; k++) step(DT * 2.5);
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#03040a';
        ctx.fillRect(0, 0, w, h);
        const v = view();
        const M = core[0].m + core[1].m;
        const ox = (core[0].x * core[0].m + core[1].x * core[1].m) / M;
        const oy = (core[0].y * core[0].m + core[1].y * core[1].m) / M;
        const oz = (core[0].z * core[0].m + core[1].z * core[1].m) / M;

        // background stars
        for (let k = 0; k < 140; k++) {
          const x = ((k * 7919) % 1000) / 1000, y = ((k * 104729) % 997) / 997;
          ctx.fillStyle = `rgba(200,210,255,${0.12 + ((k * 31) % 10) / 40})`;
          ctx.fillRect(x * w, y * h, 1, 1);
        }

        // halos (faint)
        ctx.globalCompositeOperation = 'lighter';
        for (let g = 0; g < 2; g++) {
          const [X, Y] = project(v, core[g].x, core[g].y, core[g].z, ox, oy, oz);
          drawGlow(ctx, X, Y, v.sc * 1.7 * Math.sqrt(core[g].m), g ? '#ffb070' : '#7aa8ff', 0.05);
        }
        // stars
        const cols = [['rgba(150,190,255,', 'rgba(230,240,255,'], ['rgba(255,190,130,', 'rgba(255,236,210,']];
        const s = Math.max(1.4, v.sc / 70);
        for (let i = 0; i < N; i++) {
          const j = i * 3;
          const [X, Y] = project(v, P[j], P[j + 1], P[j + 2], ox, oy, oz);
          if (X < -2 || X > w + 2 || Y < -2 || Y > h + 2) continue;
          const g = owner[i];
          const bulge = i % NA < NA * 0.14;
          ctx.fillStyle = cols[g][bulge ? 1 : 0] + (bulge ? 0.6 : 0.75 * bright[i]) + ')';
          ctx.fillRect(X - s / 2, Y - s / 2, s, s);
        }
        // bright cores
        for (let g = 0; g < 2; g++) {
          const [X, Y] = project(v, core[g].x, core[g].y, core[g].z, ox, oy, oz);
          drawGlow(ctx, X, Y, v.sc * 0.28, g ? '#ffd9a8' : '#dbe6ff', 0.35);
        }
        ctx.globalCompositeOperation = 'source-over';

        // scale bar
        const bar = v.sc * 1; // 50,000 ly at the current zoom
        const bx = w - bar - 24, by = h - 30;
        if (w >= 760) {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + bar, by);
          ctx.stroke();
          text(ctx, '50,000 light-years', bx + bar / 2, by - 12, { size: 10, align: 'center', color: C.dim });
        }
        const d = Math.hypot(core[1].x - core[0].x, core[1].y - core[0].y, core[1].z - core[0].z);
        const merged = passes >= 2 && d < 0.12;
        tag(ctx, `${(t * MYR / 1000).toFixed(2)} billion years`, w - 16, 84, C.amber, { align: 'right' });
        if (merged) tag(ctx, 'merged: one elliptical galaxy', w - 16, 112, C.cyan, { align: 'right' });
      },
      stats() {
        const d = Math.hypot(core[1].x - core[0].x, core[1].y - core[0].y, core[1].z - core[0].z);
        const rv = Math.hypot(core[1].vx - core[0].vx, core[1].vy - core[0].vy, core[1].vz - core[0].vz);
        return [
          { label: 'Time', value: `${Math.round(t * MYR)} million years`, color: C.amber },
          { label: "Distance apart", value: d * LY < 1000 ? "< 1,000 ly" : `${(Math.round((d * LY) / 1000) * 1000).toLocaleString("en-US")} ly` },
          { label: 'Closing speed', value: `${Math.round(rv * KMS)} km/s` },
          { label: 'Close passes', value: String(passes) },
          { label: 'Stars that collided', value: '0', color: C.cyan },
        ];
      },
    };
  },
};
