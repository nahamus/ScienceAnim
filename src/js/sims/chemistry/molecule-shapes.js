import { C, TAU, clamp, backdrop, tag, text, rgba } from '../../core/util.js';

const EL = {
  H: { c: '#f2f5ff', r: 0.32 },
  C: { c: '#4a4f5e', r: 0.5 },
  N: { c: '#3d6bff', r: 0.5 },
  O: { c: '#ff3b4a', r: 0.5 },
  F: { c: '#7dff6a', r: 0.42 },
  Cl: { c: '#3ee08a', r: 0.55 },
  B: { c: '#ffb3c1', r: 0.48 },
  S: { c: '#ffd23a', r: 0.6 },
  P: { c: '#ff8a3d', r: 0.6 },
  Xe: { c: '#46c9e0', r: 0.62 },
};

// domains: [element, bondOrder] for atoms; ['lp'] for lone pairs
const MOLS = {
  co2: { name: 'CO₂ — carbon dioxide', center: 'C', d: [['O', 2], ['O', 2]], shape: 'Linear', ideal: 180 },
  bf3: { name: 'BF₃ — boron trifluoride', center: 'B', d: [['F', 1], ['F', 1], ['F', 1]], shape: 'Trigonal planar', ideal: 120 },
  ch4: { name: 'CH₄ — methane', center: 'C', d: [['H', 1], ['H', 1], ['H', 1], ['H', 1]], shape: 'Tetrahedral', ideal: 109.5 },
  nh3: { name: 'NH₃ — ammonia', center: 'N', d: [['H', 1], ['H', 1], ['H', 1], ['lp']], shape: 'Trigonal pyramidal', ideal: 107 },
  h2o: { name: 'H₂O — water', center: 'O', d: [['H', 1], ['H', 1], ['lp'], ['lp']], shape: 'Bent', ideal: 104.5 },
  pcl5: { name: 'PCl₅ — phosphorus pentachloride', center: 'P', d: [['Cl', 1], ['Cl', 1], ['Cl', 1], ['Cl', 1], ['Cl', 1]], shape: 'Trigonal bipyramidal', ideal: 90 },
  sf6: { name: 'SF₆ — sulfur hexafluoride', center: 'S', d: [['F', 1], ['F', 1], ['F', 1], ['F', 1], ['F', 1], ['F', 1]], shape: 'Octahedral', ideal: 90 },
  xef4: { name: 'XeF₄ — xenon tetrafluoride', center: 'Xe', d: [['F', 1], ['F', 1], ['F', 1], ['F', 1], ['lp'], ['lp']], shape: 'Square planar', ideal: 90 },
};

const norm = (v) => {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
};

export default {
  id: 'molecule-shapes',
  title: 'The Shapes of Molecules',
  category: 'chemistry',
  tagline: 'Electron pairs push each other apart — and that decides the shape of every molecule.',
  blurb:
    'Why is water bent while carbon dioxide is straight? Around a central atom, pairs of electrons — in bonds or sitting alone — repel each other and spread out as far as possible, like balloons tied together. This simple rule (VSEPR theory) predicts the 3D shape of most molecules, and shape decides how they behave.',
  ideas: [
    'Each bond or <b>lone pair</b> around the central atom is a region of negative charge.',
    'These regions <b>repel</b> and spread out to be as far apart as possible.',
    '2 → line, 3 → triangle, 4 → tetrahedron, 5 → double pyramid, 6 → octahedron.',
    'Lone pairs push a little <b>harder</b>, squeezing the bonds closer together (water: 104.5°).',
  ],
  hint: 'Drag to rotate the molecule',
  thumbChapter: 5,
  thumbFrames: 200,
  params: [
    { key: 'mol', label: 'Molecule', type: 'select', value: 'ch4', options: Object.entries(MOLS).map(([k, m]) => ({ value: k, label: m.name.split(' — ')[0] })) },
    { key: 'lp', label: 'Show lone pairs', type: 'toggle', value: true },
    { key: 'cloud', label: 'Show repulsion zones', type: 'toggle', value: false },
    { key: 'spin', label: 'Auto-rotate', type: 'toggle', value: true },
    { key: 'shake', label: 'Scramble & relax', type: 'button', action: (s) => s.scramble() },
  ],
  story: [
    {
      title: 'Electron pairs repel',
      text: 'Methane: one carbon bonded to four hydrogens. Each bond is a pair of electrons, and like charges push apart. Scramble the bonds and watch them shove each other around until they are as far apart as possible.',
      params: { mol: 'ch4', cloud: true, spin: true },
      enter: (s) => s.scramble(),
      duration: 12,
    },
    {
      title: 'Two pairs: a straight line',
      text: 'Carbon dioxide has two electron regions (each a double bond) around the carbon. The farthest apart two things can be is opposite each other: a straight <b>180°</b> line.',
      params: { mol: 'co2', cloud: false },
      enter: (s) => s.scramble(),
      duration: 10,
    },
    {
      title: 'Three: a flat triangle',
      text: 'Boron trifluoride has three regions. They spread into a flat triangle, <b>120°</b> apart — like a Mercedes logo.',
      params: { mol: 'bf3' },
      enter: (s) => s.scramble(),
      duration: 10,
    },
    {
      title: 'Four: a tetrahedron',
      text: 'With four regions, a flat square (90°) is not the best you can do. Going 3D, they reach <b>109.5°</b> apart: a tetrahedron. This is the shape of methane and of the carbon in every living thing.',
      params: { mol: 'ch4' },
      enter: (s) => s.scramble(),
      duration: 12,
    },
    {
      title: 'Lone pairs push harder',
      text: 'Ammonia also has four regions, but one is a <b>lone pair</b> — electrons not in a bond. It hugs the nitrogen and pushes harder, squeezing the three hydrogens down into a pyramid with 107° angles.',
      params: { mol: 'nh3', lp: true },
      enter: (s) => s.scramble(),
      duration: 12,
    },
    {
      title: 'Why water is bent',
      text: 'Oxygen in water has two bonds and <b>two lone pairs</b>. They squeeze the H–O–H angle to 104.5°. That bend makes water polar — slightly negative on one side, positive on the other — which is why it dissolves salt, forms droplets and supports life.',
      params: { mol: 'h2o', lp: true },
      enter: (s) => s.scramble(),
      duration: 15,
    },
    {
      title: 'Five and six',
      text: 'Bigger atoms can host more regions. Six make an <b>octahedron</b> (90° apart), as in sulfur hexafluoride. Try PCl₅ and XeF₄ too — XeF₄’s two lone pairs sit opposite each other, leaving a flat square.',
      params: { mol: 'sf6' },
      enter: (s) => s.scramble(),
      duration: 14,
    },
    {
      title: 'Explore',
      text: 'Pick any molecule, scramble it and watch it relax. Toggle the lone pairs and repulsion zones to see what is really deciding the shape.',
      params: { mol: 'xef4', cloud: true },
      enter: (s) => s.scramble(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let dirs = [], yaw = 0.6, pitch = 0.35, drag = null;

    const mol = () => MOLS[params.mol] || MOLS.ch4;

    function scramble() {
      const m = mol();
      dirs = m.d.map(() => norm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]));
    }

    function relax(dt) {
      const m = mol();
      const n = dirs.length;
      const w = m.d.map((d) => (d[0] === 'lp' ? 1.25 : 1));
      for (let it = 0; it < 6; it++) {
        const F = dirs.map(() => [0, 0, 0]);
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            if (i === j) continue;
            const dx = dirs[i][0] - dirs[j][0], dy = dirs[i][1] - dirs[j][1], dz = dirs[i][2] - dirs[j][2];
            const d2 = dx * dx + dy * dy + dz * dz + 1e-4;
            const k = (w[i] * w[j]) / (d2 * Math.sqrt(d2));
            F[i][0] += dx * k;
            F[i][1] += dy * k;
            F[i][2] += dz * k;
          }
        for (let i = 0; i < n; i++) {
          const s = clamp(dt * 0.6, 0, 0.03);
          dirs[i] = norm([dirs[i][0] + F[i][0] * s, dirs[i][1] + F[i][1] * s, dirs[i][2] + F[i][2] * s]);
        }
      }
    }

    function bondAngle() {
      const m = mol();
      const b = m.d.map((d, i) => (d[0] !== 'lp' ? i : -1)).filter((i) => i >= 0);
      if (b.length < 2) return 0;
      let best = 180;
      for (let i = 0; i < b.length; i++)
        for (let j = i + 1; j < b.length; j++) {
          const a = dirs[b[i]], c = dirs[b[j]];
          const ang = (Math.acos(clamp(a[0] * c[0] + a[1] * c[1] + a[2] * c[2], -1, 1)) * 180) / Math.PI;
          best = Math.min(best, ang);
        }
      return best;
    }

    scramble();

    return {
      scramble,
      reset: scramble,
      onParam(k) {
        if (k === 'mol') scramble();
      },
      pointerDown(p) {
        drag = { x: p.x, y: p.y };
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        yaw += (p.x - drag.x) * 0.01;
        pitch = clamp(pitch + (p.y - drag.y) * 0.01, -1.4, 1.4);
        drag = { x: p.x, y: p.y };
      },
      pointerUp() {
        drag = null;
      },
      update(dt) {
        relax(dt);
        if (params.spin && !drag) yaw += dt * 0.45;
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#101329', grid: false });
        const m = mol();
        const S = Math.min(w, h) * 0.2;
        const cx = w * 0.55, cy = h * 0.44;
        const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        const rot = (v) => {
          const x1 = v[0] * cyw + v[2] * syw, z1 = -v[0] * syw + v[2] * cyw;
          const y2 = v[1] * cp - z1 * sp, z2 = v[1] * sp + z1 * cp;
          return [x1, y2, z2];
        };
        const proj = (v) => {
          const f = 4 / (4 - v[2]);
          return [cx + v[0] * S * f, cy - v[1] * S * f, f, v[2]];
        };
        const items = [];
        const c0 = proj([0, 0, 0]);
        m.d.forEach((d, i) => {
          const r = rot(dirs[i]);
          if (d[0] === 'lp') items.push({ type: 'lp', r, z: r[2] * 0.6 });
          else {
            const L = 1.25;
            const end = [r[0] * L, r[1] * L, r[2] * L];
            items.push({ type: 'bond', r, end, z: end[2] / 2, order: d[1] });
            items.push({ type: 'atom', el: d[0], pos: end, z: end[2] });
          }
          if (params.cloud) items.push({ type: 'cloud', r, z: r[2] * 0.7 - 0.05, lp: d[0] === 'lp' });
        });
        items.push({ type: 'atom', el: m.center, pos: [0, 0, 0], z: 0 });
        items.sort((a, b) => a.z - b.z);

        for (const it of items) {
          if (it.type === 'cloud') {
            const p = proj([it.r[0] * 0.75, it.r[1] * 0.75, it.r[2] * 0.75]);
            const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], S * 0.55 * p[2]);
            const col = it.lp ? C.amber : C.violet;
            g.addColorStop(0, rgba(col, 0.28));
            g.addColorStop(1, rgba(col, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p[0], p[1], S * 0.55 * p[2], 0, TAU);
            ctx.fill();
          } else if (it.type === 'lp') {
            if (!params.lp) continue;
            const tip = proj([it.r[0] * 0.95, it.r[1] * 0.95, it.r[2] * 0.95]);
            const mid = proj([it.r[0] * 0.55, it.r[1] * 0.55, it.r[2] * 0.55]);
            const ang = Math.atan2(tip[1] - c0[1], tip[0] - c0[0]);
            const len = Math.hypot(tip[0] - c0[0], tip[1] - c0[1]);
            ctx.save();
            ctx.translate(mid[0], mid[1]);
            ctx.rotate(ang);
            const g = ctx.createRadialGradient(len * 0.15, 0, 2, 0, 0, S * 0.5);
            g.addColorStop(0, 'rgba(255,214,120,0.55)');
            g.addColorStop(1, 'rgba(255,181,71,0.05)');
            ctx.fillStyle = g;
            ctx.strokeStyle = 'rgba(255,200,110,0.5)';
            ctx.beginPath();
            ctx.ellipse(0, 0, Math.max(10, len * 0.55), S * 0.22 * mid[2], 0, 0, TAU);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,240,200,0.9)';
            for (const o of [-5, 5]) {
              ctx.beginPath();
              ctx.arc(len * 0.15, o, 2.6, 0, TAU);
              ctx.fill();
            }
            ctx.restore();
          } else if (it.type === 'bond') {
            const a = c0, b = proj(it.end);
            const nx = -(b[1] - a[1]), ny = b[0] - a[0];
            const nl = Math.hypot(nx, ny) || 1;
            const offs = it.order === 2 ? [-5, 5] : [0];
            for (const o of offs) {
              const ox = (nx / nl) * o, oy = (ny / nl) * o;
              ctx.strokeStyle = '#8c93a8';
              ctx.lineWidth = (it.order === 2 ? 5 : 8) * ((a[2] + b[2]) / 2);
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(a[0] + ox, a[1] + oy);
              ctx.lineTo(b[0] + ox, b[1] + oy);
              ctx.stroke();
              ctx.strokeStyle = 'rgba(255,255,255,0.25)';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          } else {
            const e = EL[it.el];
            const p = proj(it.pos);
            const r = e.r * S * 0.62 * p[2];
            const g2 = ctx.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.4, r * 0.05, p[0], p[1], r * 1.05);
            g2.addColorStop(0, 'rgba(255,255,255,0.95)');
            g2.addColorStop(0.3, e.c);
            g2.addColorStop(1, 'rgba(0,0,0,0.9)');
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.arc(p[0], p[1], r, 0, TAU);
            ctx.fill();
            if (!api.thumbnail && r > 9) text(ctx, it.el, p[0], p[1] + 1, { size: Math.min(15, r * 0.7), align: 'center', weight: 700, color: it.el === 'H' || it.el === 'F' || it.el === 'S' || it.el === 'B' ? '#1a1d2a' : '#ffffff', shadow: false });
          }
        }
        if (!api.thumbnail) {
          tag(ctx, m.name, cx, Math.max(84, cy - S * 1.9), C.ink, { align: 'center', size: 13 });
          tag(ctx, `${m.shape}  ·  ${bondAngle().toFixed(1)}°`, cx, Math.max(112, cy - S * 1.9 + 28), C.amber, { align: 'center', size: 12 });
        }
      },
      stats() {
        const m = mol();
        const lp = m.d.filter((d) => d[0] === 'lp').length;
        return [
          { label: 'Electron regions', value: String(m.d.length) },
          { label: 'Lone pairs', value: String(lp), color: lp ? C.amber : undefined },
          { label: 'Shape', value: m.shape, color: C.teal },
          { label: 'Smallest bond angle', value: bondAngle().toFixed(1) + '°' },
          { label: 'Textbook angle', value: m.ideal + '°' },
        ];
      },
    };
  },
};
