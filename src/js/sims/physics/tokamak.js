import { C, clamp, rgba, text, tag, backdrop, roundRect, TAU } from '../../core/util.js';

// Charged particles in a tokamak's magnetic field, pushed with the Boris method (the standard
// plasma-physics integrator). Units: major radius R₀ = 3, minor radius a = 1, charge/mass ±1.
//   straight tube: uniform field along the axis; particles stream out of the ends.
//   ring:          toroidal field B₀R₀/R only; it is weaker on the outside, so ions drift up and
//                  electrons down (grad-B and curvature drift) until they hit the wall.
//   tokamak:       adds a poloidal field from the plasma current, twisting the field lines so each
//                  particle spends as long above the midplane as below and the drifts cancel.

const R0 = 3, A = 1, B0 = 10, HALF = 6;
const NP = 14;
const RATE = 6; // simulation time units per second
const DT = 0.02;

function field(p, mode, twist) {
  if (mode === 'straight') return [B0, 0, 0];
  const R = Math.hypot(p.x, p.y), cz = p.x / R, sz = p.y / R;
  const bt = (B0 * R0) / R;
  let bx = -sz * bt, by = cz * bt, bz = 0;
  if (mode === 'tokamak' && twist > 0) {
    const dr = R - R0, r = Math.hypot(dr, p.z);
    const bp = ((B0 * twist * (r / A)) / R0) * (R0 / R);
    if (r > 1e-9) {
      const st = p.z / r, ct = dr / r;
      bx += -st * cz * bp;
      by += -st * sz * bp;
      bz += ct * bp;
    }
  }
  return [bx, by, bz];
}
function boris(p, mode, twist) {
  const [bx, by, bz] = field(p, mode, twist);
  const h = (p.q * DT) / 2;
  const tx = bx * h, ty = by * h, tz = bz * h, t2 = tx * tx + ty * ty + tz * tz;
  const vpx = p.vx + (p.vy * tz - p.vz * ty), vpy = p.vy + (p.vz * tx - p.vx * tz), vpz = p.vz + (p.vx * ty - p.vy * tx);
  const sx = (2 * tx) / (1 + t2), sy = (2 * ty) / (1 + t2), sz = (2 * tz) / (1 + t2);
  p.vx += vpy * sz - vpz * sy;
  p.vy += vpz * sx - vpx * sz;
  p.vz += vpx * sy - vpy * sx;
  p.x += p.vx * DT;
  p.y += p.vy * DT;
  p.z += p.vz * DT;
}
function spawn(q, mode) {
  const r = 0.5 * Math.sqrt(Math.random()), th = Math.random() * TAU;
  const pitch = (0.3 + 0.65 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
  const vperp = Math.sqrt(1 - pitch * pitch), g = Math.random() * TAU;
  if (mode === 'straight') {
    return { q, x: (Math.random() - 0.5) * 2, y: r * Math.cos(th), z: r * Math.sin(th), vx: pitch, vy: vperp * Math.cos(g), vz: vperp * Math.sin(g), trail: [], age: 0 };
  }
  const ze = Math.random() * TAU, R = R0 + r * Math.cos(th);
  const zx = -Math.sin(ze), zy = Math.cos(ze), rx = Math.cos(ze), ry = Math.sin(ze);
  return {
    q, x: R * Math.cos(ze), y: R * Math.sin(ze), z: r * Math.sin(th),
    vx: pitch * zx + vperp * Math.cos(g) * rx, vy: pitch * zy + vperp * Math.cos(g) * ry, vz: vperp * Math.sin(g), trail: [], age: 0,
  };
}

export default {
  id: 'tokamak',
  title: 'Fusion: Bottling a Star',
  category: 'physics',
  tagline: 'Hold a 150-million-degree plasma with magnetic fields alone, and see why the field must twist.',
  ages: ['14-16', '16+'],
  topics: ['Nuclear', 'Energy', 'Magnetism'],
  keywords: ['fusion', 'nuclear fusion', 'tokamak', 'plasma', 'magnetic confinement', 'iter', 'jet', 'nif', 'deuterium', 'tritium', 'lawson criterion', 'stellarator', 'gyration', 'drift', 'clean energy'],
  blurb:
    'Fusion powers the Sun: light nuclei merge and release energy. Doing it on Earth means heating hydrogen to about <b>150 million °C</b>, ten times hotter than the Sun’s core, so no material wall can touch it. The gas becomes a <b>plasma</b> of charged particles, and charged particles can be steered by magnetic fields. Here each ion and electron is pushed by the real Lorentz force, so you can see why a straight tube leaks, a simple ring leaks, and a twisted ring, the <b>tokamak</b>, holds on.',
  ideas: [
    'Fusing deuterium and tritium releases <b>17.6 MeV</b>, millions of times more than burning a fuel atom.',
    'A hot plasma is made of charged particles, which <b>spiral around magnetic field lines</b>.',
    'A straight field leaks out of the ends; bending it into a ring makes the field weaker on the outside, so particles <b>drift</b> into the wall.',
    'A current in the plasma <b>twists</b> the field lines, so the drifts average out: the tokamak.',
    'Ignition needs enough density × temperature × confinement time: the <b>Lawson criterion</b>.',
  ],
  hint: 'Drag to turn the view · try the three magnet shapes',
  renderScale: 1,
  thumbChapter: 3,
  thumbFrames: 200,
  params: [
    { key: 'shape', label: 'Magnetic field', type: 'select', value: 'tokamak', options: [{ value: 'straight', label: 'Straight tube' }, { value: 'ring', label: 'Plain ring' }, { value: 'tokamak', label: 'Twisted (tokamak)' }] },
    { key: 'twist', label: 'Twist from plasma current', type: 'range', min: 0.1, max: 1, step: 0.05, value: 0.5 },
    { key: 'lines', label: 'Show field lines', type: 'toggle', value: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.25, max: 3, step: 0.05, value: 1, unit: '×' },
    { key: 'restart', label: 'Fresh plasma', type: 'button', action: (sim) => sim.restart() },
  ],
  story: [
    {
      title: 'The power of the Sun',
      text: 'In the Sun, hydrogen nuclei fuse into helium and a little mass becomes a lot of energy (E = mc²). The easiest reaction on Earth fuses two heavy kinds of hydrogen, <b>deuterium and tritium</b>. One gram of fuel releases as much energy as burning about 8 tonnes of oil. The catch: the nuclei repel each other, so they must smash together at enormous temperatures.',
      formula: 'D + T → ⁴He (3.5 MeV) + n (14.1 MeV)',
      params: { shape: 'tokamak', twist: 0.5, lines: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Too hot to touch',
      text: 'At 150 million °C any wall would melt instantly and cool the fuel. But the fuel is now a <b>plasma</b>: bare nuclei (orange) and electrons (blue), all electrically charged. A magnetic field makes charged particles <b>spiral</b> around its lines. In a straight tube they can’t escape sideways…',
      check: {
        q: 'Particles spiral along the field in a straight magnetic tube. Where do they escape?',
        options: ['Through the sides', 'Out of the open ends', 'They never escape'],
        answer: 1,
        setup: { shape: 'straight', lines: true },
        explain: 'The magnetic force only pushes sideways to the field, so it can’t stop motion along the field lines. The particles slide along them and out of the ends.',
      },
      params: { shape: 'straight', lines: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 14,
    },
    {
      title: 'Bend it into a ring',
      text: 'No ends: bend the tube into a doughnut. Now the field lines are circles. But the magnets are bunched closer on the inside, so the field is <b>stronger inside than outside</b>. Each spiral is a little wider on its outer side, so ions creep <b>upwards</b> and electrons <b>downwards</b> (see the cross-section) until they hit the wall within seconds.',
      check: {
        q: 'In a plain ring, what happens to the plasma?',
        options: ['It is held forever', 'Ions and electrons drift apart, up and down, into the wall', 'It stops moving'],
        answer: 1,
        setup: { shape: 'ring', lines: true },
        explain: 'Because the field weakens with distance from the centre, each gyration is slightly lopsided. Ions and electrons drift vertically in opposite directions; the charges separate and the resulting electric field throws the whole plasma outwards.',
      },
      params: { shape: 'ring', lines: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Give it a twist',
      text: 'The tokamak’s trick (Soviet physicists, 1950s): drive an electric current through the plasma itself. Its own magnetic field twists the lines into <b>helices</b>, so a particle following one spends as long on the top of the doughnut as on the bottom, and its drifts cancel. In the cross-section the trails now close into loops instead of running into the wall.',
      params: { shape: 'tokamak', twist: 0.5, lines: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 17,
    },
    {
      title: 'Hot, dense and long enough',
      text: 'To get more energy out than you put in, the plasma must be hot, dense, and held long enough for fusions to pile up. Their product must beat about <b>3 × 10²¹ keV·s/m³</b>: the Lawson criterion. More twist (more current) holds most particles longer here, but some on wide “banana” orbits still escape, and real plasmas also leak through turbulence.',
      formula: 'n · T · τ ≳ 3 × 10²¹ keV·s/m³',
      params: { shape: 'tokamak', twist: 0.85, lines: false, speed: 1.6 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Where fusion stands',
      text: 'In 2022 the US National Ignition Facility got <b>3.15 MJ</b> out of a fuel pellet hit by 2.05 MJ of laser light: the first “ignition”. Britain’s JET tokamak made a record <b>69 MJ</b> in 5 seconds in 2023. ITER in France, a 23,000-tonne tokamak, aims for 500 MW of fusion from 50 MW of heating, with first plasma planned in the mid-2030s. Stellarators like Wendelstein 7-X twist the field with cleverly shaped coils instead of a current.',
      params: { shape: 'tokamak', twist: 0.5, lines: true, speed: 1.2 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Your turn',
      text: 'Switch between the three fields, change the twist, and drag to turn the view. Watch the cross-section: loops mean trapped, lines running into the wall mean lost.',
      params: { shape: 'tokamak', twist: 0.35, lines: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let parts = [], flashes = [], yaw = 0.5, pitch = 0.5, drag = null, lost = 0, lifeSum = 0, acc = 0, L = {};

    function restart() {
      parts = Array.from({ length: NP }, (_, i) => spawn(i % 2 ? -1 : 1, params.shape));
      flashes = [];
      lost = 0;
      lifeSum = 0;
    }
    restart();

    function project(x, y, z) {
      const x1 = x * Math.cos(yaw) - y * Math.sin(yaw);
      const y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
      return [L.cx + L.s * x1, L.cy + L.s * (y1 * Math.sin(pitch) - z * Math.cos(pitch)), y1];
    }
    const isLost = (p) => {
      if (params.shape === 'straight') return Math.abs(p.x) > HALF || Math.hypot(p.y, p.z) > A;
      return Math.hypot(Math.hypot(p.x, p.y) - R0, p.z) > A;
    };
    const section = (p) => (params.shape === 'straight' ? [p.y, p.z] : [Math.hypot(p.x, p.y) - R0, p.z]);

    function line3(pts, col, width) {
      ctx.strokeStyle = col;
      ctx.lineWidth = width;
      ctx.beginPath();
      pts.forEach(([x, y, z], i) => {
        const [X, Y] = project(x, y, z);
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      });
      ctx.stroke();
    }

    return {
      restart,
      resize(w, h) {
        const narrow = w < 700;
        if (narrow) {
          const s = Math.min((w - 20) / 2 / (R0 + A + 0.2), (h - 120) * 0.42 / 3);
          L = { narrow, cx: w / 2, cy: 110 + (R0 + A) * s * 0.55, s, sec: { x: 16, y: 110 + (R0 + A) * s * 1.2 + 30, size: Math.min(130, h - (110 + (R0 + A) * s * 1.2 + 30) - 20) } };
        } else {
          const x0 = w - 550 >= 360 ? 510 : Math.max(w * 0.4, 400);
          const s = Math.min((w - 40 - x0) / 2 / (R0 + A + 0.3), (h - 140) / 2 / ((R0 + A) * 0.55 + 1.2));
          L = { narrow, cx: x0 + (w - 40 - x0) / 2, cy: 100 + (h - 140) / 2, s, sec: { x: 34, y: 112, size: clamp(h - 112 - 360, 110, 200) } };
        }
      },
      onParam(k) {
        if (k === 'shape') restart();
      },
      pointerDown(p) {
        drag = { x: p.x, y: p.y, yaw, pitch };
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        yaw = drag.yaw + (p.x - drag.x) * 0.008;
        pitch = clamp(drag.pitch + (p.y - drag.y) * 0.006, 0.1, 1.45);
      },
      pointerUp() {
        drag = null;
      },
      update(dt) {
        acc += dt * params.speed * RATE;
        const steps = Math.min(Math.floor(acc / DT), 60);
        acc -= steps * DT;
        for (let k = 0; k < steps; k++) {
          for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            if (p.dead) continue;
            boris(p, params.shape, params.twist);
            p.age += DT;
            if (k % 3 === 0) {
              p.trail.push([p.x, p.y, p.z]);
              if (p.trail.length > 260) p.trail.shift();
            }
            if (isLost(p)) {
              lost++;
              lifeSum += p.age;
              flashes.push({ x: p.x, y: p.y, z: p.z, t: 1, q: p.q });
              p.dead = true;
              p.respawn = 1;
            }
          }
        }
        for (const p of parts) if (p.dead && (p.respawn -= dt * params.speed) <= 0) Object.assign(p, spawn(p.q, params.shape), { dead: false });
        for (const f of flashes) f.t -= dt * 1.5;
        flashes = flashes.filter((f) => f.t > 0);
        if (!drag) yaw += dt * 0.04;
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const straight = params.shape === 'straight';
        // vessel wireframe
        ctx.lineWidth = 1;
        if (straight) {
          for (let k = 0; k < 4; k++) {
            const th = (k * TAU) / 4;
            line3([[-HALF, Math.cos(th), Math.sin(th)], [HALF, Math.cos(th), Math.sin(th)]], 'rgba(160,175,230,0.18)', 1);
          }
          for (const xx of [-HALF, -HALF / 2, 0, HALF / 2, HALF]) line3(Array.from({ length: 33 }, (_, i) => [xx, Math.cos((i * TAU) / 32), Math.sin((i * TAU) / 32)]), xx === -HALF || xx === HALF ? 'rgba(255,120,140,0.5)' : 'rgba(160,175,230,0.18)', 1);
        } else {
          for (const th of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) line3(Array.from({ length: 65 }, (_, i) => { const ze = (i * TAU) / 64; return [(R0 + A * Math.cos(th)) * Math.cos(ze), (R0 + A * Math.cos(th)) * Math.sin(ze), A * Math.sin(th)]; }), 'rgba(160,175,230,0.16)', 1);
          for (let k = 0; k < 12; k++) {
            const ze = (k * TAU) / 12;
            line3(Array.from({ length: 33 }, (_, i) => { const th = (i * TAU) / 32; return [(R0 + A * Math.cos(th)) * Math.cos(ze), (R0 + A * Math.cos(th)) * Math.sin(ze), A * Math.sin(th)]; }), 'rgba(160,175,230,0.16)', 1);
          }
        }
        // field lines
        if (params.lines) {
          const col = rgba(C.violet, 0.45);
          if (straight) for (let k = 0; k < 3; k++) line3([[-HALF, 0.6 * Math.cos(k * 2.1), 0.6 * Math.sin(k * 2.1)], [HALF, 0.6 * Math.cos(k * 2.1), 0.6 * Math.sin(k * 2.1)]], col, 1.2);
          else {
            const rr = 0.65;
            const q = params.shape === 'tokamak' ? 1 / params.twist : Infinity; // safety factor: trips round the doughnut per trip round the tube
            const n = params.shape === 'tokamak' ? 3 : 2;
            for (let k = 0; k < n; k++) {
              const pts = [];
              const turns = params.shape === 'tokamak' ? Math.min(4, Math.max(1, q)) : 1;
              for (let i = 0; i <= 360 * turns; i++) {
                const ze = (i / 360) * TAU;
                const th = (k * TAU) / n + (params.shape === 'tokamak' ? ze / q : 0);
                const R = R0 + rr * Math.cos(th);
                pts.push([R * Math.cos(ze), R * Math.sin(ze), rr * Math.sin(th)]);
              }
              line3(pts, col, 1.2);
            }
          }
        }
        // particles
        for (const p of parts) {
          if (p.dead) continue;
          const col = p.q > 0 ? C.orange : C.cyan;
          if (p.trail.length > 1) line3(p.trail, rgba(col, 0.55), 1.2);
          const [X, Y] = project(p.x, p.y, p.z);
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(X, Y, 3.2, 0, TAU);
          ctx.fill();
        }
        for (const f of flashes) {
          const [X, Y] = project(f.x, f.y, f.z);
          ctx.strokeStyle = rgba(C.red, f.t);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(X, Y, 4 + (1 - f.t) * 16, 0, TAU);
          ctx.stroke();
        }
        // cross-section panel
        const sc = L.sec;
        if (sc.size > 60) {
          const half = sc.size / 2, k = (half - 8) / A;
          const cx = sc.x + half, cy = sc.y + half;
          ctx.fillStyle = 'rgba(8,11,22,0.75)';
          roundRect(ctx, sc.x, sc.y, sc.size, sc.size, 10);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,120,140,0.55)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, A * k, 0, TAU);
          ctx.stroke();
          for (const p of parts) {
            if (p.dead) continue;
            ctx.fillStyle = rgba(p.q > 0 ? C.orange : C.cyan, 0.5);
            for (let i = 0; i < p.trail.length; i += 2) {
              const [a, b] = section({ x: p.trail[i][0], y: p.trail[i][1], z: p.trail[i][2] });
              ctx.fillRect(cx + a * k - 0.8, cy - b * k - 0.8, 1.6, 1.6);
            }
          }
          text(ctx, straight ? 'Cross-section of the tube' : 'Cross-section (outside →)', sc.x, sc.y - 12, { size: 11, color: C.dim, weight: 600 });
          if (!straight && !L.narrow) {
            text(ctx, 'up', cx, sc.y + 10, { size: 9, align: 'center', color: C.dim });
            text(ctx, 'down', cx, sc.y + sc.size - 9, { size: 9, align: 'center', color: C.dim });
          }
        }
        if (!api.thumbnail) {
          const ty = L.narrow ? 102 : 100;
          tag(ctx, 'ions', L.narrow ? w - 110 : w - 150, ty, C.orange);
          tag(ctx, 'electrons', L.narrow ? w - 66 : w - 100, ty, C.cyan);
        }
      },
      stats() {
        const alive = parts.filter((p) => !p.dead).length;
        const held = lost ? (lifeSum / lost / RATE).toFixed(1) + ' s' : 'none lost yet';
        return [
          { label: 'Field', value: params.shape === 'straight' ? 'straight tube' : params.shape === 'ring' ? 'plain ring' : `tokamak, q ≈ ${(1 / params.twist).toFixed(1)}`, color: C.violet },
          { label: 'Particles in the plasma', value: `${alive} of ${NP}` },
          { label: 'Particles lost to the wall', value: String(lost), color: lost ? C.red : C.teal },
          { label: 'Average time before loss', value: held },
        ];
      },
    };
  },
};
