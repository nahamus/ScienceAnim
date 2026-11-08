import { C, SpatialHash, Series, backdrop, clamp, drawGlow, randn, rgba, roundRect, tag, text } from '../../core/util.js';

const VSCALE = (T) => 62 * Math.sqrt(T / 100); // rms speed in px/s for a temperature in K

export default {
  id: 'kinetic-gas',
  title: 'The Kinetic Theory of Gases',
  category: 'physics',
  tagline: 'Temperature, pressure and the ideal gas law — explained by billions of tiny collisions.',
  ages: ['14-16', '16+'],
  topics: ['Particles', 'Gases', 'Thermal physics'],
  blurb:
    'A gas is a swarm of molecules flying around and bouncing off each other and the walls. Temperature is just their average kinetic energy; pressure is the drumbeat of impacts on the container. Squeeze, heat and watch the ideal gas law emerge from pure mechanics.',
  ideas: [
    '<b>Temperature</b> measures the average kinetic energy of molecules.',
    '<b>Pressure</b> is the force of countless molecular impacts on the walls.',
    'Speeds follow the Maxwell–Boltzmann distribution: a few slow, most medium, a few very fast.',
    'Pushing a piston into a gas speeds up the molecules that hit it — compressing a gas heats it.',
  ],
  hint: 'Drag the piston to compress or expand the gas',
  params: [
    { key: 'T', label: 'Temperature (thermostat)', type: 'range', min: 40, max: 1000, step: 5, value: 300, unit: 'K' },
    { key: 'V', label: 'Volume', type: 'range', min: 0.25, max: 1, step: 0.01, value: 1, format: (v) => (v * 100).toFixed(0) + ' %' },
    { key: 'N', label: 'Molecules', type: 'range', min: 50, max: 700, step: 10, value: 320 },
    { key: 'thermo', label: 'Thermostat (hold temperature)', type: 'toggle', value: true },
    { key: 'follow', label: 'Follow one molecule', type: 'toggle', value: false },
  ],
  story: [
    {
      title: 'A box of gas',
      text: 'Hundreds of molecules race around, colliding with each other and the walls. Colour shows speed: <em>blue</em> is slow, <em>orange</em> is fast.',
      params: { T: 300, V: 1, N: 320, thermo: true, follow: false },
      duration: 10,
    },
    {
      title: 'A spread of speeds',
      text: 'No two molecules move at the same speed. Yet the speed histogram in Live data settles into a precise shape — the <b>Maxwell–Boltzmann distribution</b> (dashed line) predicted in the 1860s.',
      params: { T: 300 },
      duration: 13,
    },
    {
      title: 'Turn up the heat',
      text: 'Tripling the temperature makes molecules hit the walls harder and more often. At fixed volume, <b>pressure rises in proportion to temperature</b>.',
      formula: 'P ∝ T',
      params: { T: 900 },
      duration: 12,
    },
    {
      title: 'Squeeze it',
      text: 'Halve the volume while the thermostat holds temperature steady. Molecules now hit the walls twice as often: <b>pressure doubles</b>. Together these give the ideal gas law.',
      formula: 'P V = N k T',
      params: { T: 300, V: 0.5, thermo: true },
      duration: 14,
    },
    {
      title: 'Compression heats',
      text: 'Thermostat off. As the piston pushes in, molecules bounce off a wall that is moving toward them and gain speed — the gas <b>heats up</b>. That’s why a bike pump gets warm.',
      params: { thermo: false, V: 0.32 },
      tween: 3,
      duration: 13,
    },
    {
      title: 'One molecule’s journey',
      text: 'Follow a single molecule. Its path is a jagged random walk — the average distance between collisions is called the <b>mean free path</b>.',
      params: { thermo: true, T: 300, V: 1, follow: true },
      duration: 14,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const R = 3.6;
    let mols = [], box = { x: 0, y: 0, w: 0, h: 0 }, wallX = 0, wallV = 0, impulse = 0, pressure = new Series(200), pAvg = 0, hist = new Array(30).fill(0);
    let trail = [], drag = false, collisions = 0;
    const hash = new SpatialHash(R * 4);

    function spawn() {
      const s = VSCALE(params.T) / Math.SQRT2;
      return { x: box.x + R + Math.random() * (wallX - box.x - 2 * R), y: box.y + R + Math.random() * (box.h - 2 * R), vx: randn() * s, vy: randn() * s };
    }
    function sync() {
      const n = Math.round(params.N);
      while (mols.length < n) mols.push(spawn());
      if (mols.length > n) mols.length = n;
    }
    function layout(w, h) {
      const bw = Math.min(w * 0.78, 980), bh = Math.min(h * 0.62, 520);
      box = { x: (w - bw) / 2, y: h * 0.12, w: bw, h: bh };
    }
    function temp() {
      let ke = 0;
      for (const m of mols) ke += m.vx * m.vx + m.vy * m.vy;
      const vrms = Math.sqrt(ke / Math.max(1, mols.length));
      return 100 * Math.pow(vrms / 62, 2);
    }

    return {
      resize(w, h) {
        layout(w, h);
        wallX = box.x + box.w * params.V;
        mols = [];
        sync();
      },
      reset() {
        mols = [];
        wallX = box.x + box.w * params.V;
        sync();
        pressure.clear();
      },
      pointerDown(p) {
        if (Math.abs(p.x - wallX) < 40 && p.y > box.y - 20 && p.y < box.y + box.h + 40) drag = true;
      },
      pointerMove(p) {
        if (drag) api.runner.set('V', clamp((p.x - box.x) / box.w, 0.25, 1));
      },
      pointerUp() {
        drag = false;
      },
      update(dt) {
        sync();
        const target = box.x + box.w * params.V;
        const prevX = wallX;
        wallX += clamp(target - wallX, -400 * dt, 400 * dt);
        wallV = dt > 0 ? (wallX - prevX) / dt : 0;
        const sub = 3, h = dt / sub;
        for (let s = 0; s < sub; s++) {
          hash.clear();
          for (const m of mols) {
            m.x += m.vx * h;
            m.y += m.vy * h;
            hash.insert(m);
          }
          // pair collisions
          const near = [];
          for (const a of mols) {
            hash.query(a.x, a.y, 2 * R, near);
            for (const b of near) {
              if (b === a || b.x < a.x || (b.x === a.x && b.y <= a.y)) continue;
              const dx = b.x - a.x, dy = b.y - a.y;
              const d2 = dx * dx + dy * dy;
              if (d2 >= 4 * R * R || d2 === 0) continue;
              const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
              const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
              if (rel > 0) {
                a.vx -= rel * nx; a.vy -= rel * ny;
                b.vx += rel * nx; b.vy += rel * ny;
                collisions++;
              }
              const o = (2 * R - d) / 2;
              a.x -= nx * o; a.y -= ny * o;
              b.x += nx * o; b.y += ny * o;
            }
          }
          // walls
          for (const m of mols) {
            if (m.x < box.x + R) { m.x = box.x + R; if (m.vx < 0) { impulse += -2 * m.vx; m.vx = -m.vx; } }
            if (m.x > wallX - R) {
              m.x = wallX - R;
              if (m.vx > wallV) { impulse += 2 * (m.vx - wallV); m.vx = 2 * wallV - m.vx; }
            }
            if (m.y < box.y + R) { m.y = box.y + R; if (m.vy < 0) { impulse += -2 * m.vy; m.vy = -m.vy; } }
            if (m.y > box.y + box.h - R) { m.y = box.y + box.h - R; if (m.vy > 0) { impulse += 2 * m.vy; m.vy = -m.vy; } }
          }
        }
        // thermostat: gently rescale toward the set temperature
        if (params.thermo) {
          const k = Math.sqrt(params.T / Math.max(1, temp()));
          const f = 1 + (k - 1) * Math.min(1, dt * 2);
          for (const m of mols) { m.vx *= f; m.vy *= f; }
        } else if (Math.abs(temp() - params.T) > 5 && !api.runner.tweens.has('T')) {
          api.runner.params.T = clamp(temp(), 40, 1000);
          api.runner.onParamChange?.('T', api.runner.params.T);
        }
        // pressure = impulse per unit wall length per time
        const perim = 2 * (wallX - box.x) + 2 * box.h;
        const p = dt > 0 ? impulse / (perim * dt) : 0;
        impulse = 0;
        pAvg += (p - pAvg) * Math.min(1, dt * 1.5);
        if (api.frame % 3 === 0) pressure.push(pAvg);
        // speed histogram
        const vmax = VSCALE(1000) * 2.2;
        hist.fill(0);
        for (const m of mols) {
          const b = Math.floor((Math.hypot(m.vx, m.vy) / vmax) * hist.length);
          if (b < hist.length) hist[b]++;
        }
        if (params.follow && mols[0]) {
          trail.push(mols[0].x, mols[0].y);
          if (trail.length > 1600) trail.splice(0, 2);
        } else trail.length = 0;
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h);
        // container
        const glowT = clamp((temp() - 40) / 960, 0, 1);
        ctx.fillStyle = rgba(glowT > 0.5 ? '#ff8a3d' : '#5b8cff', 0.04 + glowT * 0.04);
        ctx.fillRect(box.x, box.y, wallX - box.x, box.h);
        ctx.strokeStyle = 'rgba(180,195,240,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(box.x + box.w + 30, box.y);
        ctx.lineTo(box.x, box.y);
        ctx.lineTo(box.x, box.y + box.h);
        ctx.lineTo(box.x + box.w + 30, box.y + box.h);
        ctx.stroke();
        // piston
        const g = ctx.createLinearGradient(wallX, 0, wallX + 18, 0);
        g.addColorStop(0, '#8e9bc4');
        g.addColorStop(1, '#3a4466');
        ctx.fillStyle = g;
        roundRect(ctx, wallX, box.y + 2, 16, box.h - 4, 4);
        ctx.fill();
        ctx.fillStyle = '#556088';
        ctx.fillRect(wallX + 16, box.y + box.h / 2 - 5, w, 10);
        // molecules
        const vref = VSCALE(params.thermo ? params.T : 300) * 1.8;
        ctx.globalCompositeOperation = 'lighter';
        if (trail.length > 4) {
          ctx.strokeStyle = 'rgba(255,255,255,0.55)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(trail[0], trail[1]);
          for (let i = 2; i < trail.length; i += 2) ctx.lineTo(trail[i], trail[i + 1]);
          ctx.stroke();
        }
        for (const m of mols) {
          const s = clamp(Math.hypot(m.vx, m.vy) / vref, 0, 1);
          ctx.fillStyle = `hsl(${215 - s * 190},95%,${55 + s * 15}%)`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, R, 0, Math.PI * 2);
          ctx.fill();
        }
        if (params.follow && mols[0]) drawGlow(ctx, mols[0].x, mols[0].y, 26, '#ffffff');
        ctx.globalCompositeOperation = 'source-over';
        if (!api.thumbnail) {
          tag(ctx, 'piston', wallX + 8, box.y + box.h + 22, C.ink, { align: 'center' });
          const T = temp();
          text(ctx, `${T.toFixed(0)} K`, box.x + 12, box.y - 18, { mono: true, size: 13, color: T > 500 ? C.orange : C.cyan });
          text(ctx, `P = ${(pAvg / 100).toFixed(2)}`, box.x + 100, box.y - 18, { mono: true, size: 13, color: C.dim });
        }
      },
      stats() {
        const T = temp();
        const area = (wallX - box.x) * box.h;
        const ideal = (mols.length * T * (62 * 62) / 100) / (2 * area); // 2D: P·A = N·m⟨v²⟩/2, m = 1
        return [
          { label: 'Temperature', value: T.toFixed(0) + ' K' },
          { label: 'Pressure', value: (pAvg / 100).toFixed(2) },
          { label: 'Volume', value: ((100 * (wallX - box.x)) / box.w).toFixed(0) + ' %' },
          { label: 'PV / NkT', value: ideal > 0 ? (pAvg / ideal).toFixed(2) : '—', color: C.teal },
          { label: 'Collisions / s', value: (collisions / Math.max(api.time, 0.1)).toFixed(0) },
        ];
      },
      charts() {
        const T = Math.max(temp(), 1);
        const vmax = VSCALE(1000) * 2.2;
        const n = hist.length, bw = vmax / n;
        const s2 = Math.pow(VSCALE(T), 2) / 2;
        const ref = [];
        for (let i = 0; i < n; i++) {
          const v = (i + 0.5) * bw;
          ref.push(mols.length * bw * (v / s2) * Math.exp((-v * v) / (2 * s2)));
        }
        return [
          { title: 'Speed distribution', kind: 'bars', series: [{ data: hist, color: '#ff8a3d', label: 'measured' }], ref: { data: ref, color: '#e9edf7' }, min: 0, xLabel: 'slow → fast' },
          { title: 'Pressure over time', series: [{ data: pressure.data.map((p) => p / 100), color: '#38d6f5' }], min: 0, length: 200 },
        ];
      },
    };
  },
};
