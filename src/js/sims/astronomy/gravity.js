import { C, arrow, drawGlow, hsl, rgba, tag, TAU } from '../../core/util.js';

// Newtonian N-body gravity with leapfrog integration, in world units (G = 1).
const SCENES = {
  kepler: () => [
    { x: 0, y: 0, vx: 0, vy: 0, m: 4000, r: 22, color: '#ffc46b', star: true },
    { x: 300, y: 0, vx: 0, vy: 2.6, m: 1, r: 7, color: '#5bd0ff' },
  ],
  system: () => {
    const b = [{ x: 0, y: 0, vx: 0, vy: 0, m: 4000, r: 22, color: '#ffc46b', star: true }];
    const radii = [90, 140, 200, 270, 350];
    const cols = ['#c7b8a6', '#ffd29d', '#5bd0ff', '#ff7a59', '#e9c98a'];
    radii.forEach((r, i) => {
      const v = Math.sqrt(4000 / r);
      const a = i * 2.1;
      b.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, vx: -Math.sin(a) * v, vy: Math.cos(a) * v, m: 0.5, r: 4 + (i % 3) * 2, color: cols[i] });
    });
    return b;
  },
  binary: () => {
    const m = 2000, d = 60, v = Math.sqrt(m / (4 * d));
    return [
      { x: -d, y: 0, vx: 0, vy: -v, m, r: 16, color: '#ffb36b', star: true },
      { x: d, y: 0, vx: 0, vy: v, m, r: 14, color: '#8fb8ff', star: true },
      { x: 300, y: 0, vx: 0, vy: Math.sqrt((2 * m) / 300) * 1.02, m: 0.5, r: 5, color: '#a3e635' },
    ];
  },
  eight: () => {
    // Chenciner–Montgomery figure-eight choreography, scaled
    const L = 170, M = 1500, V = Math.sqrt(M / L);
    const p = [-0.97000436, 0.24308753], v3 = [-0.93240737, -0.86473146];
    return [
      { x: p[0] * L, y: p[1] * L, vx: (-v3[0] / 2) * V, vy: (-v3[1] / 2) * V, m: M, r: 11, color: '#ff7a59', star: true },
      { x: -p[0] * L, y: -p[1] * L, vx: (-v3[0] / 2) * V, vy: (-v3[1] / 2) * V, m: M, r: 11, color: '#5bd0ff', star: true },
      { x: 0, y: 0, vx: v3[0] * V, vy: v3[1] * V, m: M, r: 11, color: '#ffd166', star: true },
    ];
  },
  sandbox: () => [{ x: 0, y: 0, vx: 0, vy: 0, m: 4000, r: 22, color: '#ffc46b', star: true }],
};

export default {
  id: 'gravity',
  title: 'Orbits & Gravity',
  category: 'astronomy',
  tagline: 'Kepler’s laws, dancing binary stars, the three-body problem — and your own solar system.',
  blurb:
    'Every orbit is a fall that keeps missing. A single law — every mass pulls every other mass with a force that weakens with the square of distance — produces ellipses, figure-eights and chaotic ejections. Launch planets of your own and see what survives.',
  ideas: [
    'An orbit is free fall combined with sideways speed: the planet falls toward the star but keeps missing it.',
    '<b>Kepler’s 2nd law:</b> a planet sweeps out equal areas in equal times — it speeds up when close to its star.',
    '<b>Kepler’s 3rd law:</b> the square of the period grows with the cube of the orbit size.',
    'Three or more bodies usually behave chaotically — there is no general formula for their motion.',
  ],
  hint: 'Press, drag and release to launch a planet',
  thumbChapter: 2,
  thumbFrames: 220,
  params: [
    {
      key: 'scene', label: 'System', type: 'select', value: 'kepler',
      options: [
        { value: 'kepler', label: 'Ellipse' },
        { value: 'system', label: 'Solar system' },
        { value: 'binary', label: 'Binary star' },
        { value: 'eight', label: 'Three bodies' },
        { value: 'sandbox', label: 'Sandbox' },
      ],
    },
    { key: 'areas', label: 'Show equal-area sweeps', type: 'toggle', value: false },
    { key: 'trail', label: 'Trail length', type: 'range', min: 0, max: 1500, step: 50, value: 700 },
    { key: 'vectors', label: 'Show velocity arrows', type: 'toggle', value: false },
    { key: 'nudge', label: 'Nudge one body', type: 'button', action: (s) => s.nudge() },
  ],
  story: [
    {
      title: 'Falling around a star',
      text: 'A planet is pulled toward its star at every moment, but it also moves sideways fast enough that it keeps <b>missing</b>. The result is an ellipse with the star at one focus.',
      formula: 'F = G m<sub>1</sub> m<sub>2</sub> / r<sup>2</sup>',
      params: { scene: 'kepler', areas: false, vectors: true, trail: 900 },
      duration: 12,
    },
    {
      title: 'Equal areas, equal times',
      text: 'Each coloured wedge is swept in the same amount of time. Near the star the planet races, far away it crawls — yet every wedge has <b>the same area</b>. That’s Kepler’s second law, a consequence of conserved angular momentum.',
      params: { scene: 'kepler', areas: true, vectors: true },
      duration: 16,
    },
    {
      title: 'A planetary system',
      text: 'Five planets on circular orbits. The inner ones whip round; the outer ones dawdle. Kepler found the rule in 1619: period squared is proportional to distance cubed.',
      formula: 'T<sup>2</sup> ∝ a<sup>3</sup>',
      params: { scene: 'system', areas: false, vectors: false, trail: 500 },
      duration: 14,
    },
    {
      title: 'Binary stars',
      text: 'Most stars have a partner. Two suns circle their shared centre of mass, while a planet orbits both — a real-life Tatooine.',
      params: { scene: 'binary', trail: 600 },
      duration: 13,
    },
    {
      title: 'The three-body ballet',
      text: 'Three equal stars chasing each other along a figure-eight. This rare, perfectly balanced solution was only discovered in 1993.',
      params: { scene: 'eight', trail: 1100 },
      duration: 13,
    },
    {
      title: '…and its collapse',
      text: 'Nudge one star by a hair and the dance falls apart. Within a few loops the motion becomes <b>chaotic</b>, and one star may be flung away entirely.',
      params: { scene: 'eight', trail: 600 },
      enter: (s) => s.nudge(),
      duration: 16,
    },
    {
      title: 'Build a solar system',
      text: 'Press, drag and release to launch planets. Too slow and they fall in; too fast and they escape. Collisions merge bodies.',
      params: { scene: 'sandbox', trail: 900, vectors: false },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let bodies = [], scale = 1, cx = 0, cy = 0, aim = null, sweeps = [], sweepT = 0, sweepIdx = 0, stars = [], flashes = [], merges = 0;
    const G = 1;

    function load() {
      bodies = SCENES[params.scene]().map((b) => ({ ...b, trail: [] }));
      sweeps = [];
      sweepT = 0;
      sweepIdx = 0;
      merges = 0;
      // put centre of momentum at rest
      let px = 0, py = 0, m = 0;
      for (const b of bodies) (px += b.vx * b.m), (py += b.vy * b.m), (m += b.m);
      for (const b of bodies) (b.vx -= px / m), (b.vy -= py / m);
    }
    function accel() {
      for (const b of bodies) (b.ax = 0), (b.ay = 0);
      for (let i = 0; i < bodies.length; i++)
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const r2 = dx * dx + dy * dy + 25;
          const inv = G / (r2 * Math.sqrt(r2));
          a.ax += dx * inv * b.m;
          a.ay += dy * inv * b.m;
          b.ax -= dx * inv * a.m;
          b.ay -= dy * inv * a.m;
        }
    }
    function collide() {
      for (let i = 0; i < bodies.length; i++)
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j];
          if (Math.hypot(a.x - b.x, a.y - b.y) < (a.r + b.r) * 0.7) {
            const big = a.m >= b.m ? a : b, small = big === a ? b : a;
            const m = a.m + b.m;
            big.vx = (a.vx * a.m + b.vx * b.m) / m;
            big.vy = (a.vy * a.m + b.vy * b.m) / m;
            big.m = m;
            if (!big.star) big.r = Math.min(16, Math.cbrt(big.r ** 3 + small.r ** 3));
            small.dead = true;
            flashes.push({ x: small.x, y: small.y, t: 0 });
            merges++;
          }
        }
      bodies = bodies.filter((b) => !b.dead);
    }
    const toScreen = (x, y) => [cx + x * scale, cy + y * scale];
    const toWorld = (x, y) => [(x - cx) / scale, (y - cy) / scale];

    load();
    return {
      nudge() {
        const b = bodies[bodies.length - 1];
        if (b) {
          b.vx *= 1.004;
          b.vy *= 0.996;
          b.x += 0.5;
        }
      },
      resize(w, h) {
        cx = w / 2;
        cy = h * 0.46;
        scale = Math.min(w, h) / 860;
        stars = Array.from({ length: 220 }, () => ({ x: Math.random() * w, y: Math.random() * h, s: Math.random(), tw: Math.random() * TAU }));
      },
      reset: load,
      onParam(k) {
        if (k === 'scene') load();
        if (k === 'areas') (sweeps = []), (sweepT = 0);
      },
      pointerDown(p) {
        aim = { x: p.x, y: p.y, ex: p.x, ey: p.y };
      },
      pointerMove(p) {
        if (aim) (aim.ex = p.x), (aim.ey = p.y);
      },
      pointerUp() {
        if (!aim) return;
        const [x, y] = toWorld(aim.x, aim.y);
        const vx = ((aim.x - aim.ex) / scale) * 0.03, vy = ((aim.y - aim.ey) / scale) * 0.03;
        bodies.push({ x, y, vx, vy, m: 0.6, r: 5 + Math.random() * 3, color: hsl(Math.random() * 360, 85, 66), trail: [] });
        aim = null;
      },
      update(dt) {
        const sub = 16, h = (dt * 60) / sub;
        accel();
        for (let s = 0; s < sub; s++) {
          for (const b of bodies) {
            b.vx += b.ax * h * 0.5;
            b.vy += b.ay * h * 0.5;
            b.x += b.vx * h;
            b.y += b.vy * h;
          }
          accel();
          for (const b of bodies) {
            b.vx += b.ax * h * 0.5;
            b.vy += b.ay * h * 0.5;
          }
        }
        collide();
        const max = Math.round(params.trail);
        for (const b of bodies) {
          b.trail.push(b.x, b.y);
          while (b.trail.length > max * 2) b.trail.splice(0, 2);
        }
        bodies = bodies.filter((b) => Math.hypot(b.x, b.y) < 6000);
        // Kepler sweeps
        if (params.areas && bodies.length >= 2) {
          sweepT += dt;
          const p = bodies[1], s = bodies[0];
          let cur = sweeps[sweeps.length - 1];
          if (!cur || sweepT > 1.1) {
            if (cur) cur.done = true;
            sweepT = 0;
            cur = { pts: [s.x, s.y], idx: sweepIdx++, area: 0 };
            sweeps.push(cur);
            if (sweeps.length > 8) sweeps.shift();
          }
          const n = cur.pts.length;
          if (n >= 4) cur.area += Math.abs((cur.pts[n - 2] - s.x) * (p.y - s.y) - (p.x - s.x) * (cur.pts[n - 1] - s.y)) / 2;
          cur.pts.push(p.x, p.y);
        }
        for (const f of flashes) f.t += dt;
        flashes = flashes.filter((f) => f.t < 1);
      },
      draw() {
        const { w, h } = api;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.8);
        g.addColorStop(0, '#0b0d22');
        g.addColorStop(1, '#020309');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        const tt = api.time;
        for (const s of stars) {
          ctx.fillStyle = `rgba(210,220,255,${0.12 + s.s * 0.5 * (0.7 + 0.3 * Math.sin(tt * 2 + s.tw))})`;
          ctx.fillRect(s.x, s.y, s.s > 0.85 ? 2 : 1.2, s.s > 0.85 ? 2 : 1.2);
        }
        // sweeps
        if (params.areas) {
          for (const sw of sweeps) {
            ctx.fillStyle = rgba(sw.idx % 2 ? '#a78bfa' : '#38d6f5', 0.22);
            ctx.strokeStyle = rgba(sw.idx % 2 ? '#a78bfa' : '#38d6f5', 0.6);
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < sw.pts.length; i += 2) {
              const [x, y] = toScreen(sw.pts[i], sw.pts[i + 1]);
              i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
        // trails, fading toward the tail
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        for (const b of bodies) {
          const tr = b.trail, n = tr.length / 2;
          if (n < 2) continue;
          const chunks = 12;
          const per = Math.ceil(n / chunks);
          for (let c = 0; c < chunks; c++) {
            const i0 = c * per, i1 = Math.min(n - 1, (c + 1) * per);
            if (i1 <= i0) continue;
            ctx.strokeStyle = rgba(b.color.startsWith('#') ? b.color : '#ffffff', ((c + 1) / chunks) * 0.7);
            ctx.lineWidth = 1 + ((c + 1) / chunks) * 1.4;
            ctx.beginPath();
            for (let i = i0; i <= i1; i++) {
              const [x, y] = toScreen(tr[i * 2], tr[i * 2 + 1]);
              i === i0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            if (!b.color.startsWith('#')) ctx.strokeStyle = b.color.replace(/,[\d.]+\)$/, `,${((c + 1) / chunks) * 0.7})`);
            ctx.stroke();
          }
        }
        for (const b of bodies) {
          const [x, y] = toScreen(b.x, b.y);
          const col = b.color.startsWith('#') ? b.color : '#ffffff';
          drawGlow(ctx, x, y, b.r * scale * (b.star ? 5 : 3), col, b.star ? 0.25 : 0.2);
        }
        for (const f of flashes) {
          const [x, y] = toScreen(f.x, f.y);
          drawGlow(ctx, x, y, 60 * (1 - f.t), '#ffffff', 0.2);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (const b of bodies) {
          const [x, y] = toScreen(b.x, b.y);
          const R = Math.max(2.5, b.r * scale);
          ctx.fillStyle = b.star ? '#fff6e0' : b.color;
          ctx.beginPath();
          ctx.arc(x, y, R, 0, TAU);
          ctx.fill();
          if (!b.star) {
            // day/night shading toward the heaviest body
            const sun = bodies.reduce((a, c) => (c.m > a.m ? c : a), bodies[0]);
            const [sx, sy] = toScreen(sun.x, sun.y);
            const a = Math.atan2(y - sy, x - sx);
            ctx.fillStyle = 'rgba(0,0,10,0.55)';
            ctx.beginPath();
            ctx.arc(x, y, R, a - Math.PI / 2, a + Math.PI / 2);
            ctx.fill();
          }
          if (params.vectors) arrow(ctx, x, y, x + b.vx * 14 * scale, y + b.vy * 14 * scale, rgba('#ffffff', 0.8), 1.5, 7);
        }
        if (aim) {
          ctx.setLineDash([5, 5]);
          arrow(ctx, aim.x, aim.y, aim.x + (aim.x - aim.ex), aim.y + (aim.y - aim.ey), C.lime, 2, 10);
          ctx.setLineDash([]);
          drawGlow(ctx, aim.x, aim.y, 14, '#a3e635');
        }
        if (!api.thumbnail && params.scene === 'kepler' && bodies[1] && params.areas) {
          const [x, y] = toScreen(bodies[1].x, bodies[1].y);
          tag(ctx, `speed ${Math.hypot(bodies[1].vx, bodies[1].vy).toFixed(1)}`, x, y - 22, C.cyan, { align: 'center' });
        }
      },
      stats() {
        let ke = 0, pe = 0;
        for (let i = 0; i < bodies.length; i++) {
          const a = bodies[i];
          ke += 0.5 * a.m * (a.vx * a.vx + a.vy * a.vy);
          for (let j = i + 1; j < bodies.length; j++) pe -= (G * a.m * bodies[j].m) / Math.hypot(a.x - bodies[j].x, a.y - bodies[j].y);
        }
        const out = [
          { label: 'Bodies', value: String(bodies.length) },
          { label: 'Total energy', value: ((ke + pe) / 1000).toFixed(1) + 'k' },
          { label: 'Mergers', value: String(merges) },
        ];
        if (params.areas && sweeps.length > 2) {
          const done = sweeps.filter((s) => s.done).map((s) => s.area);
          if (done.length >= 2) out.push({ label: 'Sweep areas match', value: `${((Math.min(...done) / Math.max(...done)) * 100).toFixed(1)} %`, color: C.teal });
        }
        return out;
      },
      charts() {
        if (params.scene !== 'kepler' || bodies.length < 2) return [];
        const b = bodies[1];
        this._v = this._v || [];
        if (api.frame % 2 === 0) {
          this._v.push(Math.hypot(b.vx, b.vy));
          if (this._v.length > 300) this._v.shift();
        }
        return [{ title: 'Planet speed — fastest at closest approach', series: [{ data: this._v, color: '#38d6f5' }], min: 0, length: 300 }];
      },
    };
  },
};
