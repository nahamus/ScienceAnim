import { C, TAU, clamp, lerp, drawGlow, tag, text, backdrop, roundRect, arrow, Series, rand } from '../../core/util.js';

// A 3 MW wind turbine with 50 m blades, and a hydroelectric dam.
const RHO = 1.225; // air, kg/m³
const R_ROTOR = 50; // m
const AREA = Math.PI * R_ROTOR * R_ROTOR;
const RATED = 3e6; // W
const CP_MAX = 0.45; // a good real rotor; the Betz limit is 16/27 ≈ 0.593
const BETZ = 16 / 27;
const CUT_IN = 3, CUT_OUT = 25; // m/s
const TSR = 7; // tip speed / wind speed at best efficiency
const GEAR = 100;
const DRAWN_GEAR = 4; // the gears are drawn 4:1 so the generator can be followed by eye
const HOME_W = 450; // an average home uses ~4,000 kWh a year ≈ 450 W

const windPower = (v) => 0.5 * RHO * AREA * v * v * v;
const cpOf = (pitch) => CP_MAX * Math.max(0, 1 - pitch / 30) ** 1.5;

/** How the turbine runs in wind v: blade pitch, power coefficient, output, rotor speed and status. */
function operate(v, auto, manualPitch) {
  const free = (TSR * v) / R_ROTOR; // rad/s at the best tip-speed ratio
  if (auto) {
    if (v > CUT_OUT) return { pitch: 90, cp: 0, P: 0, omega: 0, state: 'storm: blades feathered, rotor braked', color: C.cyan };
    if (v < CUT_IN) return { pitch: 0, cp: 0, P: 0, omega: free * 0.3, state: 'too little wind to generate', color: C.dim };
    const need = RATED / (CP_MAX * windPower(v));
    const pitch = need >= 1 ? 0 : 30 * (1 - need ** (2 / 3));
    const cp = cpOf(pitch);
    return {
      pitch, cp, P: cp * windPower(v), omega: Math.min(1.6, free * Math.sqrt(cp / CP_MAX)),
      state: pitch > 0.5 ? 'full power: blades turned to spill wind' : 'catching as much wind as it can',
      color: pitch > 0.5 ? C.amber : C.lime,
    };
  }
  const cp = v < CUT_IN ? 0 : cpOf(manualPitch);
  const P = cp * windPower(v);
  const omega = v < CUT_IN ? free * 0.3 : free * Math.sqrt(Math.max(0.04, cp / CP_MAX));
  const over = P > RATED * 1.08;
  return { pitch: manualPitch, cp, P, omega, state: over ? 'OVERLOAD: generator overheating' : 'manual pitch', color: over ? C.red : C.ink, over };
}

/** Axial induction factor a for a power coefficient Cp = 4a(1−a)² (the slower root). */
function induction(cp) {
  let lo = 0, hi = 1 / 3;
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    if (4 * m * (1 - m) * (1 - m) < cp) lo = m;
    else hi = m;
  }
  return lo;
}

const MW = (p) => (p >= 1e6 ? (p / 1e6).toFixed(p >= 1e7 ? 0 : 2) + ' MW' : (p / 1e3).toFixed(0) + ' kW');
const homes = (p) => Math.round(p / HOME_W).toLocaleString('en-GB');

export default {
  id: 'turbines',
  title: 'Wind & Water Turbines',
  category: 'tech',
  tagline: 'How moving air and falling water spin a generator, and why twice the wind gives eight times the power.',
  ages: ['11-14', '14-16'],
  topics: ['Energy', 'Electricity'],
  keywords: ['wind turbine', 'hydroelectric', 'dam', 'generator', 'gearbox', 'Betz limit', 'renewable'],
  blurb:
    'A wind turbine is a giant propeller in reverse: the wind pushes on wing-shaped blades and turns a shaft, a gearbox speeds it up, and a generator turns the spin into electricity. A dam does the same with falling water. Find out why the power grows so steeply with wind speed, why no turbine can catch all of the wind, and how both machines protect themselves.',
  ideas: [
    'Blades are shaped like aircraft wings: the wind makes <b>lift</b>, which turns the rotor.',
    'A <b>gearbox</b> turns the slow rotor (about 15 turns a minute) into the fast spin a generator needs (about 1,500).',
    'In the generator, spinning <b>magnets</b> sweep past copper coils and push an alternating current around them.',
    'The power in the wind grows with the <b>cube</b> of its speed: double the wind, eight times the power.',
    'No turbine can take more than <b>59%</b> of the wind’s energy (the Betz limit): the air has to keep flowing through.',
    'A dam turns the energy of <b>falling water</b> into electricity: power = water flow × height × g.',
  ],
  hint: 'Change the wind speed and watch the power output',
  thumbChapter: 0,
  thumbFrames: 240,
  params: [
    { key: 'scene', label: 'Scene', type: 'select', value: 'wind', options: [{ value: 'wind', label: 'Wind turbine' }, { value: 'inside', label: 'Inside the turbine' }, { value: 'hydro', label: 'Hydroelectric dam' }] },
    { key: 'wind', label: 'Wind speed', type: 'range', min: 0, max: 30, step: 0.5, value: 9, format: (v) => `${v} m/s (${Math.round(v * 3.6)} km/h)` },
    { key: 'gusts', label: 'Gusty wind', type: 'toggle', value: false },
    { key: 'auto', label: 'Automatic blade control', type: 'toggle', value: true },
    { key: 'pitch', label: 'Blade pitch (manual)', type: 'range', min: 0, max: 30, step: 0.5, value: 0, format: (v) => v + '°' },
    { key: 'head', label: 'Dam height (head)', type: 'range', min: 10, max: 200, step: 1, value: 100, format: (v) => v + ' m' },
    { key: 'flow', label: 'Water flow', type: 'range', min: 5, max: 100, step: 1, value: 40, format: (v) => v + ' m³/s' },
  ],
  story: [
    {
      title: 'Catching the wind',
      text: 'Moving air carries energy. A turbine’s blades are shaped like aircraft wings: as the wind flows over them it makes <b>lift</b>, which pushes each blade sideways and turns the rotor. Notice the air leaves the rotor <b>slower</b> than it arrived. The energy it lost is what turns the blades.',
      params: { scene: 'wind', wind: 9, auto: true, gusts: false },
      duration: 14,
    },
    {
      title: 'Slow blades, fast generator',
      text: 'The 50 m blades turn only about <b>13 times a minute</b>, but the generator needs to spin about a hundred times faster. A <b>gearbox</b> in the nacelle (the box behind the blades) does that: a big gear drives a small one, in three stages.',
      params: { scene: 'inside', wind: 9, auto: true },
      duration: 14,
    },
    {
      title: 'Magnets and coils',
      text: 'Inside the generator, <b>magnets</b> spin past fixed <b>coils of copper wire</b>. Each time a north pole and then a south pole sweeps by, the magnetic field through a coil flips, pushing current one way and then the other: <b>alternating current</b>. The coils glow here as current flows in them.',
      formula: 'ε = −N dΦ/dt',
      params: { scene: 'inside', wind: 7, auto: true },
      check: {
        q: 'The wind picks up and the generator spins twice as fast. What happens to the voltage it makes?',
        options: ['It halves', 'It stays the same', 'It doubles'],
        answer: 2,
        explain: 'The field through each coil now changes twice as fast, so the induced voltage doubles (and so does its frequency). Watch the trace on the right as the wind rises.',
      },
      enter: (s, r) => s.later(3, () => r.set('wind', 11, 3)),
      duration: 14,
    },
    {
      title: 'Double the wind, eight times the power',
      text: 'Wind twice as fast carries twice as much air through the blades each second, and each kilogram of it has <b>four times</b> the energy (kinetic energy goes as speed squared). That is <b>2 × 4 = 8</b> times the power. That is why turbines stand on tall towers and hilltops, where the wind is stronger.',
      formula: 'P = ½ ρ A v³',
      params: { scene: 'wind', wind: 5, auto: true, gusts: false },
      check: {
        q: 'The wind speed doubles from 5 m/s to 10 m/s. How much more power does the wind carry?',
        options: ['Twice as much', 'Four times as much', 'Eight times as much'],
        answer: 2,
        explain: 'Power goes as the cube of wind speed: 2 × 2 × 2 = 8. At 5 m/s these blades sweep about 0.5 MW of wind; at 10 m/s, 3.8 MW.',
      },
      enter: (s, r) => s.later(3.5, () => r.set('wind', 10, 4)),
      duration: 16,
    },
    {
      title: 'Why not catch all of it?',
      text: 'If the blades stopped the air completely, it would pile up behind them and no fresh wind could get through. The best possible turbine slows the wind to about a <b>third</b> of its speed and takes <b>59%</b> of its energy: the <b>Betz limit</b>. Real turbines reach about 45%. Watch the slowed air spread out behind the rotor.',
      formula: 'Cₚ ≤ 16/27 ≈ 59%',
      params: { scene: 'wind', wind: 9, auto: true, gusts: false },
      duration: 14,
    },
    {
      title: 'Too much wind',
      text: 'With its blades fixed, a turbine in a gale would make far more power than its generator can take, and overheat or tear itself apart. So above about 11 m/s the control system <b>turns the blades</b> to spill some wind and holds the output at 3 MW. Above 25 m/s it turns them edge-on and brakes the rotor.',
      params: { scene: 'wind', wind: 18, auto: false, pitch: 0, gusts: false },
      enter: (s, r) => s.later(6, () => r.set('auto', true)),
      duration: 16,
    },
    {
      title: 'Power from falling water',
      text: 'A dam holds back a deep lake. Water rushes down a pipe called a <b>penstock</b>, spins a turbine at the bottom, and the turbine turns a generator, just like the wind turbine. The power depends on how much water flows each second and how far it falls (the <b>head</b>). Unlike the wind, it can be switched up and down on demand.',
      formula: 'P = η ρ g Q H',
      params: { scene: 'hydro', head: 100, flow: 40 },
      check: {
        q: 'Which makes more power: a 10 m dam with 100 m³/s flowing, or a 100 m dam with 10 m³/s?',
        options: ['The low dam with lots of water', 'The high dam', 'They make the same power'],
        answer: 2,
        explain: 'Power goes as flow × height: 100 × 10 = 10 × 100. Both give about 9 MW. That is why mountain dams with modest rivers can still be powerful.',
      },
      duration: 16,
    },
    {
      title: 'Try it yourself',
      text: 'Turn on gusty wind and watch the output jump about, or switch off the automatic control and set the blade angle yourself. On the dam, change the height and the flow.',
      params: { scene: 'wind', wind: 10, gusts: true, auto: true },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0, rot = 0, omega = 0.8, gust = 0, gustT = 0, gustTarget = 0, op = operate(9, true, 0);
    let veff = params.wind, hydroRot = 0, genRot = 0;
    const timers = [];
    const sPower = new Series(300);
    const sVolt = new Series(160);
    let parts = [], water = [];
    let curveKey = null;
    const curve = [], betz = [];

    const layout = () => {
      const { w, h } = api;
      const narrow = w < 700;
      const T = 84;
      const ground = narrow ? Math.round(h * 0.56) : Math.round(h * 0.84);
      return { w, h, narrow, T, ground };
    };

    // --------------------------------------------------------------- wind scene
    function seedParticles(L) {
      parts = [];
      for (let i = 0; i < 230; i++) parts.push({ x: rand(-20, L.w + 20), q: Math.random() });
    }

    function rotorGeom(L) {
      const Rs = L.narrow ? Math.min((L.ground - L.T) * 0.4, L.w * 0.3) : Math.min((L.ground - L.T) * 0.36, L.w * 0.2);
      const hy = L.narrow ? L.T + (L.ground - L.T) * 0.46 : L.T + (L.ground - L.T) * 0.42;
      const hx = L.narrow ? L.w * 0.36 : L.w * 0.5;
      return { Rs, hx, hy };
    }

    function drawBlades(hx, hy, Rs, angle, pitch, alpha) {
      // side view: the rotor turns about a horizontal axis, so each blade shows as a vertical bar
      const bl = [];
      for (let k = 0; k < 3; k++) {
        const th = angle + (k * TAU) / 3;
        bl.push({ y: Math.cos(th), z: Math.sin(th) });
      }
      bl.sort((a, b) => a.z - b.z);
      for (const b of bl) {
        const L = Rs * b.y;
        const chord = (4 + 5 * Math.abs(Math.cos((pitch * Math.PI) / 180))) * (0.6 + 0.4 * Math.abs(b.z));
        const shade = 150 + 90 * (b.z * 0.5 + 0.5);
        ctx.fillStyle = `rgba(${shade},${shade + 5},${shade + 12},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(hx - chord * 0.5, hy);
        ctx.lineTo(hx - 1, hy - L);
        ctx.lineTo(hx + 1, hy - L);
        ctx.lineTo(hx + chord * 0.5, hy);
        ctx.fill();
      }
    }

    function drawTurbine(hx, hy, Rs, ground, angle, pitch, alpha, overheat) {
      const tw = Math.max(4, Rs * 0.09);
      const tx = hx + Rs * 0.2;
      ctx.fillStyle = `rgba(200,208,225,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(tx - tw * 0.4, hy);
      ctx.lineTo(tx + tw * 0.4, hy);
      ctx.lineTo(tx + tw, ground);
      ctx.lineTo(tx - tw, ground);
      ctx.fill();
      // nacelle
      const nw = Rs * 0.42, nh = Math.max(8, Rs * 0.13);
      ctx.fillStyle = `rgba(222,228,240,${alpha})`;
      roundRect(ctx, hx + 2, hy - nh / 2, nw, nh, nh * 0.3);
      ctx.fill();
      if (overheat > 0) {
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, hx + nw * 0.6, hy, nw * 0.9, '#ff4d6d', 0.3 * overheat);
        ctx.globalCompositeOperation = 'source-over';
      }
      drawBlades(hx, hy, Rs, angle, pitch, alpha);
      // spinner
      ctx.fillStyle = `rgba(240,244,252,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(hx, hy, nh * 0.45, nh * 0.55, 0, 0, TAU);
      ctx.fill();
    }

    function updateWind(dt, L) {
      const G = rotorGeom(L);
      const a = induction(Math.min(BETZ, op.cp));
      const kx = (L.w / 900) * 11; // px/s per m/s
      for (const p of parts) {
        const u = 1 - a * (1 + Math.tanh((p.x - G.hx) / (0.35 * G.Rs)));
        const r0 = lerp(L.T - 10 - G.hy, L.ground - 6 - G.hy, p.q);
        const inside = Math.abs(r0) < G.Rs * Math.sqrt(1 - a);
        p.x += kx * Math.max(0.6, veff) * (inside ? u : 1) * dt;
        if (p.x > L.w + 30) {
          p.x = rand(-40, -5);
          p.q = Math.random();
        }
      }
      return { G, a };
    }

    function drawWind(L) {
      const { w } = L;
      const G = rotorGeom(L);
      const a = induction(Math.min(BETZ, op.cp));
      // sky and hills
      const sky = ctx.createLinearGradient(0, 0, 0, L.ground);
      sky.addColorStop(0, '#081028');
      sky.addColorStop(1, '#16274a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, L.h);
      // far turbines (a wind farm)
      for (const [fx, fs, ph] of [[0.74, 0.34, 1.3], [0.9, 0.26, 2.6], [0.62, 0.22, 0.4]]) {
        const R = G.Rs * fs;
        drawTurbine(w * fx, L.ground - R * 2.1, R, L.ground, rot * 0.97 + ph, op.pitch, 0.35, 0);
      }
      ctx.fillStyle = '#0d1a22';
      ctx.beginPath();
      ctx.moveTo(0, L.ground + 4);
      for (let x = 0; x <= w; x += 20) ctx.lineTo(x, L.ground - 6 * Math.sin(x * 0.006 + 1) - 4 * Math.sin(x * 0.017));
      ctx.lineTo(w, L.h);
      ctx.lineTo(0, L.h);
      ctx.fill();

      // airflow streaks, three brightness bands by speed
      const kx = (L.w / 900) * 11;
      const bands = [[], [], []];
      const Rt0 = G.Rs * Math.sqrt(1 - a);
      for (const p of parts) {
        const r0 = lerp(L.T - 10 - G.hy, L.ground - 6 - G.hy, p.q);
        const inside = Math.abs(r0) < Rt0;
        const yAt = (x) => {
          const u = 1 - a * (1 + Math.tanh((x - G.hx) / (0.35 * G.Rs)));
          const r = inside ? r0 / Math.sqrt(u) : Math.sign(r0) * Math.sqrt(r0 * r0 + Rt0 * Rt0 * (1 / u - 1));
          return [G.hy + r, u];
        };
        const [y, u] = yAt(p.x);
        if (y > L.ground - 3) continue;
        const sp = inside ? u : 1;
        const len = 4 + kx * Math.max(0.6, veff) * sp * 0.09;
        const [y0] = yAt(p.x - len);
        const b = !inside ? 2 : p.x < G.hx ? 1 : 0;
        bands[b].push(p.x - len, y0, p.x, y);
      }
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.5;
      // bands: slowed air behind the rotor, air heading into the rotor, air passing outside it
      const cols = ['rgba(255,190,110,0.5)', 'rgba(150,220,255,0.65)', 'rgba(150,200,255,0.35)'];
      bands.forEach((arr, k) => {
        ctx.strokeStyle = cols[k];
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 4) {
          ctx.moveTo(arr[i], arr[i + 1]);
          ctx.lineTo(arr[i + 2], arr[i + 3]);
        }
        ctx.stroke();
      });

      // the edge of the stream of air that passes through the blades, widening as it slows
      if (op.cp > 0.01) {
        ctx.strokeStyle = 'rgba(255,190,110,0.35)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        for (const sgn of [-1, 1]) {
          for (let x = 0; x <= w; x += 12) {
            const u = 1 - a * (1 + Math.tanh((x - G.hx) / (0.35 * G.Rs)));
            const y = G.hy + sgn * Rt0 / Math.sqrt(u);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, Math.min(y, L.ground));
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const heat = op.over ? 0.6 + 0.4 * Math.sin(t * 10) : 0;
      drawTurbine(G.hx, G.hy, G.Rs, L.ground, rot, op.pitch, 1, heat);

      if (!api.thumbnail) {
        const vin = veff, vout = veff * (1 - 2 * a);
        const up = Math.max(16, G.hx - G.Rs * 1.3);
        tag(ctx, `wind ${vin.toFixed(1)} m/s`, up, G.hy - G.Rs - 16, C.cyan, { align: 'center' });
        if (op.cp > 0.01) tag(ctx, `slowed to ${vout.toFixed(1)} m/s`, Math.min(w - 70, G.hx + G.Rs * 1.6), G.hy + G.Rs * 0.15, C.amber, { align: 'center' });
        tag(ctx, `${MW(op.P)} → ${homes(op.P)} homes`, w - 16, 96, op.over ? C.red : C.lime, { align: 'right', size: 12 });
        tag(ctx, op.state, w - 16, 122, op.color, { align: 'right' });
        if (op.pitch > 0.5) tag(ctx, `blade pitch ${op.pitch.toFixed(0)}°`, w - 16, 148, C.amber, { align: 'right' });
      }
    }

    // --------------------------------------------------------------- inside view
    function gear(cx, cy, r, teeth, angle, fill) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      const n = teeth * 2;
      for (let i = 0; i <= n * 2; i++) {
        const a = angle + (i / (n * 2)) * TAU;
        const rr = i % 4 < 2 ? r : r * (1 - Math.min(0.14, 6 / r));
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(5,8,18,0.8)';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.22, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(5,8,18,0.5)';
      ctx.lineWidth = Math.max(1, r * 0.06);
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const a = angle + (k * TAU) / 4;
        ctx.moveTo(cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25);
        ctx.lineTo(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75);
      }
      ctx.stroke();
    }

    function drawInside(L) {
      const { w, h, narrow } = L;
      backdrop(ctx, w, h, { center: '#0c1430' });
      const bottom = narrow ? h * 0.58 : h - 30;
      const cols = narrow ? 2 : 4;
      const rows = narrow ? 2 : 1;
      const gap = 14;
      const left = narrow ? 12 : Math.max(16, w * 0.03);
      const top = L.T + 10;
      const bw = (w - left * 2 - gap * (cols - 1)) / cols;
      const bh = Math.min(narrow ? 1e9 : 300, (bottom - top - gap * (rows - 1)) / rows);
      const box = (i) => {
        const c = i % cols, r = Math.floor(i / cols);
        return { x: left + c * (bw + gap), y: top + r * (bh + gap), w: bw, h: bh };
      };
      const titles = [
        ['Rotor', `${((omega * 60) / TAU).toFixed(1)} rpm`],
        ['Gearbox', `×${GEAR} (drawn ×${DRAWN_GEAR})`],
        ['Generator', `${((omega * GEAR * 60) / TAU).toFixed(0)} rpm`],
        ['To the grid', MW(op.P)],
      ];
      for (let i = 0; i < 4; i++) {
        const b = box(i);
        ctx.fillStyle = 'rgba(20,28,56,0.75)';
        ctx.strokeStyle = 'rgba(150,170,230,0.22)';
        ctx.lineWidth = 1;
        roundRect(ctx, b.x, b.y, b.w, b.h, 14);
        ctx.fill();
        ctx.stroke();
        text(ctx, titles[i][0], b.x + 12, b.y + 16, { size: 12, weight: 700, color: C.ink, shadow: false });
        text(ctx, titles[i][1], b.x + b.w - 12, b.y + 16, { size: 11, align: 'right', color: C.amber, mono: true, shadow: false });
        if (i < 3 && !narrow) arrow(ctx, b.x + b.w + 2, b.y + b.h / 2, b.x + b.w + gap - 2, b.y + b.h / 2, C.dim, 1.5, 6);
      }
      const inner = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2 + 10, R: Math.min(b.w, b.h - 40) * 0.4 });

      // 1. rotor, face on
      {
        const { cx, cy, R } = inner(box(0));
        for (let k = 0; k < 3; k++) {
          const a = rot + (k * TAU) / 3;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(a);
          ctx.fillStyle = '#dfe5f2';
          ctx.beginPath();
          ctx.moveTo(0, -R * 0.08);
          ctx.quadraticCurveTo(R * 0.5, -R * 0.16, R, -R * 0.02);
          ctx.lineTo(R, R * 0.02);
          ctx.quadraticCurveTo(R * 0.5, R * 0.06, 0, R * 0.08);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#f2f5fb';
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.12, 0, TAU);
        ctx.fill();
      }
      // 2. gears: big on the slow shaft, small one spins DRAWN_GEAR× faster the other way
      {
        const b = box(1);
        const { cx, cy, R } = inner(b);
        const big = R * 0.95, small = big / DRAWN_GEAR;
        const bx = cx - small * 0.9, sx = bx + big + small - Math.min(0.14, 6 / big) * big * 0.5;
        gear(bx, cy, big, 32, rot, '#8a94ad');
        gear(sx, cy, small, 8, -rot * DRAWN_GEAR + Math.PI / 8, '#ffb547');
        if (!api.thumbnail) text(ctx, 'slow shaft', bx, cy + big + 12, { size: 10, align: 'center', color: C.dim, shadow: false });
      }
      // 3. generator: 4 magnets spinning inside 6 coils
      {
        const b = box(2);
        const { cx, cy, R } = inner(b);
        const ring = R * 0.98;
        ctx.strokeStyle = 'rgba(150,160,190,0.6)';
        ctx.lineWidth = R * 0.1;
        ctx.beginPath();
        ctx.arc(cx, cy, ring, 0, TAU);
        ctx.stroke();
        const wv = omega * GEAR; // real electrical drive, for the glow strength
        for (let k = 0; k < 6; k++) {
          const a = (k * TAU) / 6;
          const I = Math.sin(2 * (genRot - a));
          const mag = Math.abs(I) * clamp(wv / 160, 0, 1);
          const x = cx + Math.cos(a) * ring * 0.8, y = cy + Math.sin(a) * ring * 0.8;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a);
          ctx.fillStyle = `rgba(${200 + 55 * mag},${120 + 60 * mag},${60},1)`;
          ctx.fillRect(-R * 0.1, -R * 0.17, R * 0.2, R * 0.34);
          ctx.strokeStyle = 'rgba(60,30,10,0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let s = -3; s <= 3; s++) {
            ctx.moveTo(-R * 0.1, s * R * 0.045);
            ctx.lineTo(R * 0.1, s * R * 0.045);
          }
          ctx.stroke();
          ctx.restore();
          if (mag > 0.05) {
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, x, y, R * 0.35, '#ffb547', 0.5 * mag);
            ctx.globalCompositeOperation = 'source-over';
          }
        }
        for (let k = 0; k < 4; k++) {
          const a0 = genRot + (k * TAU) / 4;
          ctx.fillStyle = k % 2 ? '#4f7dff' : '#ff4d6d';
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, ring * 0.55, a0 - 0.6, a0 + 0.6);
          ctx.closePath();
          ctx.fill();
          const lx = cx + Math.cos(a0) * ring * 0.36, ly = cy + Math.sin(a0) * ring * 0.36;
          text(ctx, k % 2 ? 'S' : 'N', lx, ly, { size: Math.max(9, R * 0.16), weight: 700, align: 'center', color: '#fff', shadow: false });
        }
        ctx.fillStyle = '#c9cfdd';
        ctx.beginPath();
        ctx.arc(cx, cy, ring * 0.1, 0, TAU);
        ctx.fill();
      }
      // 4. output trace
      {
        const b = box(3);
        const x0 = b.x + 12, x1 = b.x + b.w - 12, y0 = b.y + 34, y1 = b.y + b.h - 34;
        const mid = (y0 + y1) / 2, amp = (y1 - y0) / 2;
        ctx.strokeStyle = 'rgba(150,170,230,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, mid);
        ctx.lineTo(x1, mid);
        ctx.stroke();
        const d = sVolt.data, n = d.length;
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < n; i++) ctx[i ? 'lineTo' : 'moveTo'](x0 + ((x1 - x0) * i) / (sVolt.n - 1), mid - d[i] * amp);
        ctx.stroke();
        text(ctx, 'voltage in one coil', (x0 + x1) / 2, y1 + 16, { size: 10, align: 'center', color: C.dim, shadow: false });
        if (!api.thumbnail) {
          const hz = (omega * GEAR * 2) / TAU; // 4 poles = 2 pole pairs
          text(ctx, `${hz.toFixed(0)} Hz AC`, (x0 + x1) / 2, y0 - 4, { size: 11, align: 'center', color: C.cyan, mono: true, shadow: false });
        }
      }
      if (!api.thumbnail) {
        const note = narrow ? 'speeds slowed for viewing' : 'The generator is drawn slowed down: really it spins 100× faster than the blades.';
        text(ctx, note, w / 2, Math.min(bottom + 8, box(narrow ? 3 : 0).y + bh + 18), { size: 11, align: 'center', color: C.dim, shadow: false });
      }
    }

    // --------------------------------------------------------------- hydro scene
    function hydroGeom(L) {
      const { w, narrow } = L;
      const ground = L.ground;
      const maxH = ground - L.T - 30;
      const Hpx = 30 + (maxH - 30) * ((params.head - 10) / 190);
      const sc = clamp(L.h / 560, 0.8, 1.7); // powerhouse size
      const damX = narrow ? w * 0.36 : w * 0.56;
      const damW = Math.max(26, Hpx * 0.35);
      const level = ground - Hpx;
      const ph = { x: damX + damW * 0.5 + 34 * sc, y: ground - 6 };
      const intake = { x: damX - damW * 0.3, y: level + Hpx * 0.45 };
      const path = [
        [intake.x - 30, intake.y],
        [intake.x, intake.y],
        [damX + damW * 0.2, intake.y + Hpx * 0.1],
        [ph.x - 10 * sc, ph.y - 18 * sc],
        [ph.x, ph.y - 18 * sc],
        [ph.x + 24 * sc, ph.y - 6],
        [w + 20, ph.y - 2],
      ];
      return { ground, Hpx, damX, damW, level, ph, path, sc };
    }

    function along(path, s) {
      // s in px from the start of the polyline; returns [x, y, segment index]
      for (let i = 1; i < path.length; i++) {
        const [ax, ay] = path[i - 1], [bx, by] = path[i];
        const l = Math.hypot(bx - ax, by - ay);
        if (s <= l) return [ax + ((bx - ax) * s) / l, ay + ((by - ay) * s) / l, i];
        s -= l;
      }
      const e = path[path.length - 1];
      return [e[0], e[1], path.length];
    }
    const pathLen = (path) => path.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1]) : 0), 0);

    function hydroPower() {
      return 0.9 * 1000 * 9.81 * params.flow * params.head;
    }

    function updateHydro(dt, L) {
      const G = hydroGeom(L);
      const len = pathLen(G.path);
      const want = Math.round(30 + params.flow * 1.4);
      while (water.length < want) water.push({ s: rand(len) });
      if (water.length > want) water.length = want;
      const v = 50 + 9 * Math.sqrt(params.head);
      for (const p of water) {
        p.s += v * dt;
        if (p.s > len) p.s -= len;
      }
      hydroRot += (0.6 + Math.sqrt(params.head) * 0.25) * dt;
    }

    function drawHydro(L) {
      const { w, h } = L;
      const G = hydroGeom(L);
      const sky = ctx.createLinearGradient(0, 0, 0, G.ground);
      sky.addColorStop(0, '#081028');
      sky.addColorStop(1, '#13223f');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      // mountains around the lake
      ctx.fillStyle = '#0e1626';
      ctx.beginPath();
      ctx.moveTo(0, G.ground);
      const peaks = [[0, 0.55], [0.12, 0.85], [0.24, 0.6], [0.36, 0.95], [0.5, 0.7], [0.62, 0.5], [0.8, 0.62], [1, 0.4]];
      for (const [fx, fy] of peaks) ctx.lineTo(fx * w, G.ground - fy * (G.ground - L.T));
      ctx.lineTo(w, G.ground);
      ctx.fill();
      // valley walls behind
      ctx.fillStyle = '#101a2a';
      ctx.beginPath();
      ctx.moveTo(0, G.level - 30);
      ctx.lineTo(G.damX - 20, G.level - 24);
      ctx.lineTo(G.damX + G.damW + 30, G.ground - 10);
      ctx.lineTo(w, G.ground - 4);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();
      // reservoir
      const lake = ctx.createLinearGradient(0, G.level, 0, G.ground);
      lake.addColorStop(0, '#2a67b8');
      lake.addColorStop(1, '#0b2a5a');
      ctx.fillStyle = lake;
      ctx.fillRect(0, G.level, G.damX + 2, G.ground - G.level);
      ctx.strokeStyle = 'rgba(180,220,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const y = G.level + 6 + k * 10;
        for (let x = 6; x < G.damX - 10; x += 28) {
          const o = ((t * 12 + k * 9) % 28);
          ctx.moveTo(x + o, y);
          ctx.lineTo(x + o + 10, y);
        }
      }
      ctx.stroke();
      // dam: concrete wedge
      ctx.fillStyle = '#8f97a8';
      ctx.beginPath();
      ctx.moveTo(G.damX, G.level - 8);
      ctx.lineTo(G.damX + G.damW * 0.25, G.level - 8);
      ctx.lineTo(G.damX + G.damW, G.ground);
      ctx.lineTo(G.damX, G.ground);
      ctx.fill();
      // penstock pipe
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#3c475e';
      ctx.lineWidth = 12 * G.sc;
      ctx.beginPath();
      G.path.slice(1, 5).forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y));
      ctx.stroke();
      // river below
      ctx.fillStyle = '#123d78';
      ctx.fillRect(G.ph.x + 10, G.ph.y - 10, w - G.ph.x, 14);
      // water particles
      ctx.fillStyle = 'rgba(160,215,255,0.85)';
      ctx.beginPath();
      for (const p of water) {
        const [x, y, seg] = along(G.path, p.s);
        if (seg === 1) continue; // still in the lake
        ctx.moveTo(x + 1.8, y);
        ctx.arc(x, y, 1.8, 0, TAU);
      }
      ctx.fill();
      // powerhouse with turbine and generator
      const px = G.ph.x, py = G.ph.y;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(G.sc, G.sc);
      ctx.translate(-px, -py);
      ctx.fillStyle = 'rgba(30,40,64,0.95)';
      ctx.strokeStyle = 'rgba(150,170,230,0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, px - 26, py - 74, 52, 72, 6);
      ctx.fill();
      ctx.stroke();
      const tr = 14;
      ctx.save();
      ctx.translate(px, py - 18);
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 2;
      for (let k = 0; k < 7; k++) {
        const a = hydroRot * 3 + (k * TAU) / 7;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
        ctx.quadraticCurveTo(Math.cos(a + 0.5) * tr * 0.7, Math.sin(a + 0.5) * tr * 0.7, Math.cos(a + 0.9) * tr, Math.sin(a + 0.9) * tr);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = '#c9cfdd';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, py - 32);
      ctx.lineTo(px, py - 50);
      ctx.stroke();
      ctx.fillStyle = '#ffb547';
      roundRect(ctx, px - 14, py - 68, 28, 18, 4);
      ctx.fill();
      ctx.restore();
      const gy = py - 59 * G.sc;
      // power line
      ctx.strokeStyle = 'rgba(200,210,230,0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px + 14 * G.sc, gy);
      ctx.quadraticCurveTo((px + w) / 2, gy - 40, w + 10, gy - 50);
      ctx.stroke();
      const P = hydroPower();
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, px, gy, 26 * G.sc, '#ffb547', 0.35 * clamp(P / 4e7, 0.2, 1));
      ctx.globalCompositeOperation = 'source-over';
      if (!api.thumbnail) {
        // head marker
        const hx = Math.max(14, G.damX - 34);
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hx, G.level);
        ctx.lineTo(hx, py - 18 * G.sc);
        ctx.stroke();
        ctx.setLineDash([]);
        tag(ctx, `head ${params.head} m`, hx, (G.level + py - 18 * G.sc) / 2, C.amber, { align: 'center' });
        if (G.ph.x + 40 * G.sc < w - 60) tag(ctx, 'turbine + generator', G.ph.x, py - 84 * G.sc, C.amber, { align: 'center', size: 10 });
        if (!L.narrow) tag(ctx, 'penstock', (G.path[2][0] + G.path[3][0]) / 2 + 12, (G.path[2][1] + G.path[3][1]) / 2 - 14, C.dim, { align: 'left', size: 10 });
        tag(ctx, `${MW(P)} → ${homes(P)} homes`, w - 16, 96, C.lime, { align: 'right', size: 12 });
        tag(ctx, `${params.flow} m³ of water a second`, w - 16, 122, C.cyan, { align: 'right' });
      }
    }

    const api2 = {
      later(sec, fn) {
        timers.push({ t: t + sec, fn });
      },
      reset() {
        timers.length = 0;
        sPower.clear();
        sVolt.clear();
      },
      resize() {
        seedParticles(layout());
        water = [];
      },
      onParam(k) {
        if (k === 'scene') sPower.clear();
        if (k === 'pitch' && params.auto) api.runner.set('auto', false);
      },
      update(dt) {
        t += dt;
        for (let i = timers.length - 1; i >= 0; i--) if (t >= timers[i].t) timers.splice(i, 1)[0].fn();
        // gusts: a slowly wandering ±30% on top of the set wind
        gustT -= dt;
        if (gustT <= 0) {
          gustTarget = params.gusts ? rand(-0.3, 0.3) : 0;
          gustT = rand(0.8, 2.2);
        }
        gust += (gustTarget - gust) * Math.min(1, dt * 1.5);
        veff = Math.max(0, params.wind * (1 + gust));
        op = operate(veff, params.auto, params.pitch);
        // the rotor has a lot of inertia
        omega += (op.omega - omega) * Math.min(1, dt * 0.8);
        rot += omega * dt;
        genRot += omega * DRAWN_GEAR * dt;
        const L = layout();
        if (!parts.length) seedParticles(L);
        if (params.scene === 'hydro') {
          updateHydro(dt, L);
          sPower.push(hydroPower() / 1e6);
        } else {
          updateWind(dt, L);
          sPower.push(op.P / 1e6);
        }
        sVolt.push(Math.sin(2 * genRot) * clamp((omega * GEAR) / 170, 0, 1.15) * 0.85);
      },
      draw() {
        const L = layout();
        if (params.scene === 'hydro') drawHydro(L);
        else if (params.scene === 'inside') drawInside(L);
        else drawWind(L);
      },
      stats() {
        if (params.scene === 'hydro') {
          const P = hydroPower();
          return [
            { label: 'Height of fall (head)', value: params.head + ' m' },
            { label: 'Water flow', value: params.flow + ' m³/s' },
            { label: 'Electrical power', value: MW(P), color: C.lime },
            { label: 'Homes supplied', value: homes(P) },
          ];
        }
        return [
          { label: 'Wind speed', value: `${veff.toFixed(1)} m/s` },
          { label: 'Power in the wind', value: MW(windPower(veff)), color: C.cyan },
          { label: 'Electrical output', value: MW(op.P), color: op.over ? C.red : C.lime },
          { label: 'Share captured', value: (op.cp * 100).toFixed(0) + '% (limit 59%)' },
          { label: 'Rotor speed', value: `${((omega * 60) / TAU).toFixed(1)} rpm` },
          { label: 'Blade pitch', value: op.pitch.toFixed(0) + '°' },
        ];
      },
      charts() {
        if (params.scene === 'hydro')
          return [{ title: 'Electrical power (MW)', series: [{ data: sPower.data, color: C.lime }], length: 300, min: 0 }];
        // the curve depends only on the control settings, so rebuild it only when they change
        const key = params.auto ? 'auto' : params.pitch;
        if (curveKey !== key) {
          curveKey = key;
          curve.length = betz.length = 0;
          for (let v = 0; v <= 30; v += 0.5) {
            curve.push(operate(v, params.auto, params.pitch).P / 1e6);
            betz.push(Math.min(8, (BETZ * windPower(v)) / 1e6));
          }
        }
        return [
          { title: `Power curve: output vs wind speed (now ${veff.toFixed(1)} m/s)`, series: [{ data: curve, color: C.lime }], ref: { data: betz, color: 'rgba(56,214,245,0.6)' }, min: 0, max: 8, xLabel: '0 → 30 m/s   ·   dashed: the 59% limit', yMaxLabel: '8 MW' },
          { title: 'Electrical output over time (MW)', series: [{ data: sPower.data, color: C.amber }], length: 300, min: 0, max: params.auto ? 3.5 : undefined },
        ];
      },
    };
    return api2;
  },
};
