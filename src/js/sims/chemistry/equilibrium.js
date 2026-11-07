import { C, Series, backdrop, clamp, drawGlow, rand, randn, rgba, roundRect, text, TAU } from '../../core/util.js';

const R = 6;

export default {
  id: 'equilibrium',
  title: 'Chemical Reactions & Equilibrium',
  category: 'chemistry',
  tagline: 'Molecules collide, bond and break apart — until the two directions perfectly balance.',
  blurb:
    'A reaction happens when molecules collide with enough energy to get over an activation barrier. Most reactions also run backwards. Eventually the forward and reverse rates match and the mixture stops changing — not because nothing is happening, but because everything happens equally both ways.',
  ideas: [
    'Only collisions with energy above the <b>activation energy</b> lead to a reaction.',
    'At <b>dynamic equilibrium</b> forward and reverse reactions continue at equal rates.',
    '<b>Le Chatelier’s principle:</b> disturb an equilibrium and it shifts to counteract the change.',
    'A <b>catalyst</b> lowers the barrier both ways — equilibrium arrives faster, but in the same place.',
  ],
  hint: 'Use the buttons to add reactants and watch the balance shift',
  thumbChapter: 1,
  thumbFrames: 300,
  params: [
    { key: 'T', label: 'Temperature', type: 'range', min: 200, max: 900, step: 10, value: 350, unit: 'K' },
    { key: 'Ea', label: 'Activation energy', type: 'range', min: 0.5, max: 3, step: 0.05, value: 1.6, unit: 'units' },
    { key: 'cat', label: 'Catalyst', type: 'toggle', value: false },
    { key: 'addA', label: '+ 40 A', type: 'button', action: (s) => s.add('A', 40) },
    { key: 'addB', label: '+ 40 B', type: 'button', action: (s) => s.add('B', 40) },
    { key: 'restart', label: 'Fresh mixture', type: 'button', action: (s) => s.init() },
  ],
  story: [
    {
      title: 'Molecules meet',
      text: 'Red <b>A</b> and blue <b>B</b> molecules fly around randomly. When they collide hard enough to climb the energy barrier, they bond into an <b>AB</b> molecule. Gentle bumps just bounce off.',
      formula: 'A + B ⇌ AB',
      params: { T: 350, Ea: 1.6, cat: false },
      enter: (s) => s.init(),
      duration: 12,
    },
    {
      title: 'Dynamic equilibrium',
      text: 'AB molecules can also shake themselves apart. As AB builds up, more of them break. Soon the forward and reverse rates <b>match</b> and the chart levels off — yet reactions never stop.',
      formula: 'K = [AB] / [A][B]',
      params: {},
      duration: 15,
    },
    {
      title: 'Push it: Le Chatelier',
      text: 'We pour in 40 more A molecules. The system responds by making more AB, using up some of what we added. Equilibria always shift to <b>oppose a change</b>.',
      enter: (s) => s.add('A', 40),
      duration: 14,
    },
    {
      title: 'Turn up the heat',
      text: 'This reaction releases heat when AB forms. Heating the mixture favours the reverse, heat-absorbing direction, so AB breaks apart — and everything happens faster.',
      params: { T: 800 },
      duration: 13,
    },
    {
      title: 'Add a catalyst',
      text: 'A catalyst offers an easier path with a lower barrier (dashed curve). Starting fresh, equilibrium is reached much faster — but the final balance is <b>the same</b>.',
      params: { T: 350, cat: true },
      enter: (s) => s.init(),
      duration: 14,
    },
    {
      title: 'Experiment',
      text: 'Change temperature, barrier height and catalyst. Add reactants and watch the system find a new balance.',
      params: { cat: false },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let mols = [], cA = new Series(400), cB = new Series(400), cAB = new Series(400), flashes = [], fw = [], rv = [];
    const dH = 1.2; // AB is 1.2 units lower than A + B (exothermic)
    const vT = () => 70 * Math.sqrt(params.T / 300);
    const kT = () => params.T / 300;
    const barrier = () => params.Ea * (params.cat ? 0.45 : 1);

    function mk(type, x, y) {
      const s = vT() / Math.SQRT2;
      return { type, x: x ?? rand(R * 3, api.w - R * 3), y: y ?? rand(R * 3, api.h - R * 3), vx: randn() * s, vy: randn() * s, a: rand(TAU), cool: 0 };
    }
    function init() {
      mols = [];
      for (let i = 0; i < 90; i++) mols.push(mk('A'), mk('B'));
      cA.clear();
      cB.clear();
      cAB.clear();
    }
    function add(type, n) {
      for (let i = 0; i < n; i++) mols.push(mk(type, rand(0, 60), rand(api.h * 0.2, api.h * 0.8)));
    }

    return {
      init,
      add,
      resize() {
        if (!mols.length) init();
      },
      reset: init,
      update(dt) {
        const { w, h } = api;
        const now = api.time;
        const target = vT();
        const Ea = barrier();
        const pF = Math.exp(-Ea / kT());
        const kR = 1.4 * Math.exp(-(Ea + dH) / kT());
        for (const m of mols) {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          m.a += dt * (m.type === 'AB' ? 2 : 0.5);
          m.cool -= dt;
          const r = m.type === 'AB' ? R * 1.6 : R;
          if (m.x < r) (m.x = r), (m.vx = Math.abs(m.vx));
          if (m.x > w - r) (m.x = w - r), (m.vx = -Math.abs(m.vx));
          if (m.y < r) (m.y = r), (m.vy = Math.abs(m.vy));
          if (m.y > h - r) (m.y = h - r), (m.vy = -Math.abs(m.vy));
          // thermal bath: nudge speeds toward the set temperature
          const sp = Math.hypot(m.vx, m.vy) || 1;
          const f = 1 + (target / sp - 1) * dt * 0.6;
          m.vx *= f;
          m.vy *= f;
          // reverse reaction: AB falls apart
          if (m.type === 'AB' && m.cool < 0 && Math.random() < kR * dt) {
            m.dead = true;
            const a = rand(TAU), s = vT();
            mols.push({ ...mk('A', m.x + Math.cos(a) * R, m.y + Math.sin(a) * R), vx: Math.cos(a) * s, vy: Math.sin(a) * s, cool: 0.4 });
            mols.push({ ...mk('B', m.x - Math.cos(a) * R, m.y - Math.sin(a) * R), vx: -Math.cos(a) * s, vy: -Math.sin(a) * s, cool: 0.4 });
            flashes.push({ x: m.x, y: m.y, t: 0, c: '#38d6f5' });
            rv.push(now);
          }
        }
        // forward reaction: A meets B (simple grid)
        const cell = 20, grid = new Map();
        for (const m of mols) {
          if (m.dead || m.type !== 'B' || m.cool > 0) continue;
          const k = ((m.x / cell) | 0) * 4096 + ((m.y / cell) | 0);
          (grid.get(k) || grid.set(k, []).get(k)).push(m);
        }
        for (const a of mols) {
          if (a.dead || a.type !== 'A' || a.cool > 0) continue;
          const gx = (a.x / cell) | 0, gy = (a.y / cell) | 0;
          outer: for (let i = -1; i <= 1; i++)
            for (let j = -1; j <= 1; j++) {
              const list = grid.get((gx + i) * 4096 + gy + j);
              if (!list) continue;
              for (const b of list) {
                if (b.dead) continue;
                const dx = b.x - a.x, dy = b.y - a.y;
                if (dx * dx + dy * dy > 4 * R * R) continue;
                // collision energy along the line of centres decides
                const d = Math.hypot(dx, dy) || 1;
                const rel = ((a.vx - b.vx) * dx + (a.vy - b.vy) * dy) / d;
                if (rel <= 0) continue;
                const E = (rel * rel) / (2 * vT() * vT()) * kT() * 1.8;
                if (E > Ea || Math.random() < pF * 0.15) {
                  a.dead = b.dead = true;
                  const ab = mk('AB', (a.x + b.x) / 2, (a.y + b.y) / 2);
                  ab.vx = (a.vx + b.vx) / 2;
                  ab.vy = (a.vy + b.vy) / 2;
                  ab.cool = 0.5;
                  mols.push(ab);
                  flashes.push({ x: ab.x, y: ab.y, t: 0, c: '#ffb547' });
                  fw.push(now);
                } else {
                  // elastic bounce
                  const nx = dx / d, ny = dy / d;
                  a.vx -= rel * nx; a.vy -= rel * ny;
                  b.vx += rel * nx; b.vy += rel * ny;
                }
                break outer;
              }
            }
        }
        mols = mols.filter((m) => !m.dead);
        for (const f of flashes) f.t += dt;
        flashes = flashes.filter((f) => f.t < 0.6);
        fw = fw.filter((t) => now - t < 3);
        rv = rv.filter((t) => now - t < 3);
        if (api.frame % 4 === 0) {
          let a = 0, b = 0, ab = 0;
          for (const m of mols) m.type === 'A' ? a++ : m.type === 'B' ? b++ : ab++;
          cA.push(a);
          cB.push(b);
          cAB.push(ab);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h);
        ctx.globalCompositeOperation = 'lighter';
        for (const f of flashes) drawGlow(ctx, f.x, f.y, 34 * (1 - f.t / 0.6) + 6, f.c, 0.2);
        ctx.globalCompositeOperation = 'source-over';
        const ball = (x, y, r, c) => {
          const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
          g.addColorStop(0, '#ffffff');
          g.addColorStop(0.35, c);
          g.addColorStop(1, rgba(c, 0.6));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
        };
        for (const m of mols) {
          if (m.type === 'A') ball(m.x, m.y, R, '#ff5d73');
          else if (m.type === 'B') ball(m.x, m.y, R, '#4d9bff');
          else {
            const dx = Math.cos(m.a) * R * 0.75, dy = Math.sin(m.a) * R * 0.75;
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(m.x - dx, m.y - dy);
            ctx.lineTo(m.x + dx, m.y + dy);
            ctx.stroke();
            ball(m.x - dx, m.y - dy, R, '#ff5d73');
            ball(m.x + dx, m.y + dy, R, '#4d9bff');
          }
        }
        if (!api.thumbnail) this.drawEnergy(w);
      },
      drawEnergy(w) {
        // reaction-coordinate diagram
        const bw = 230, bh = 130, x0 = w - bw - 18, y0 = 70;
        ctx.fillStyle = 'rgba(8,11,22,0.78)';
        ctx.strokeStyle = 'rgba(160,175,230,0.2)';
        roundRect(ctx, x0, y0, bw, bh, 12);
        ctx.fill();
        ctx.stroke();
        text(ctx, 'Energy along the reaction', x0 + 12, y0 + 16, { size: 11, color: C.dim, shadow: false });
        const base = y0 + bh - 34, scale = 22;
        const path = (Ea, dash) => {
          ctx.setLineDash(dash ? [4, 4] : []);
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const s = i / 60;
            const step = clamp((s - 0.3) / 0.4, 0, 1);
            const e = (Ea + dH * 0.5) * Math.exp(-(((s - 0.5) / 0.14) ** 2)) - dH * step * step * (3 - 2 * step);
            const X = x0 + 18 + s * (bw - 36), Y = base - clamp(e, -2, 3.6) * scale;
            i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        };
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ff8a3d';
        path(params.Ea, false);
        if (params.cat) {
          ctx.strokeStyle = '#2ee6a6';
          path(params.Ea * 0.45, true);
        }
        text(ctx, 'A + B', x0 + 16, base + 14, { size: 10, color: C.ink, shadow: false });
        text(ctx, 'AB', x0 + bw - 30, base + dH * scale + 4, { size: 10, color: C.ink, shadow: false });
        text(ctx, 'Eₐ', x0 + bw / 2 + 8, base - barrier() * scale - 4, { size: 11, color: params.cat ? C.teal : C.orange, shadow: false });
      },
      stats() {
        const a = cA.last ?? 0, b = cB.last ?? 0, ab = cAB.last ?? 0;
        return [
          { label: 'A', value: String(a), color: '#ff5d73' },
          { label: 'B', value: String(b), color: '#4d9bff' },
          { label: 'AB', value: String(ab), color: '#c9a7ff' },
          { label: 'K = [AB]/[A][B]', value: a && b ? ((ab * 100) / (a * b)).toFixed(2) : '—' },
          { label: 'Forward / s', value: (fw.length / 3).toFixed(1) },
          { label: 'Reverse / s', value: (rv.length / 3).toFixed(1) },
        ];
      },
      charts() {
        return [
          {
            title: 'Molecule counts',
            series: [
              { data: cA.data, color: '#ff5d73', label: 'A', fill: false },
              { data: cB.data, color: '#4d9bff', label: 'B', fill: false },
              { data: cAB.data, color: '#c9a7ff', label: 'AB', fill: false },
            ],
            min: 0,
            length: 400,
          },
        ];
      },
    };
  },
};
