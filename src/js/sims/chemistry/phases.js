import { C, clamp, randn, backdrop, tag, Series, drawGlow } from '../../core/util.js';

const BW = 36, BH = 26, RC = 2.5, RC2 = RC * RC, DT = 0.004;

export default {
  id: 'phases',
  title: 'Solid, Liquid, Gas',
  category: 'chemistry',
  tagline: 'Turn the temperature dial and watch atoms freeze into crystals, melt and boil away.',
  ages: ['11-14', '14-16'],
  topics: ['Particles', 'States of matter'],
  blurb:
    'Every substance is made of atoms that attract each other when close and push apart when squeezed. Whether it is a solid, liquid or gas is just a contest between that stickiness and how fast the atoms are jiggling — which is what temperature really is. These atoms follow the Lennard-Jones force law used by real chemists.',
  ideas: [
    '<b>Temperature</b> is the average jiggling energy of atoms.',
    'In a <b>gas</b>, atoms fly freely and only meet in brief collisions.',
    'In a <b>liquid</b>, they stick together but can slide past each other.',
    'In a <b>solid</b>, they lock into an orderly <b>crystal</b>, vibrating in place.',
  ],
  hint: 'Hold the mouse on atoms to heat them (Shift to cool)',
  thumbChapter: 3,
  thumbFrames: 600,
  params: [
    { key: 'T', label: 'Temperature', type: 'range', min: 0.03, max: 2, step: 0.01, value: 1.4, format: (v) => (v * 120).toFixed(0) + ' K' },
    { key: 'N', label: 'Atoms', type: 'range', min: 60, max: 320, step: 10, value: 240, instant: true },
    { key: 'g', label: 'Gravity', type: 'range', min: 0, max: 0.12, step: 0.005, value: 0.05 },
    { key: 'bonds', label: 'Show attractions', type: 'toggle', value: true },
    { key: 'reset', label: 'Scatter atoms', type: 'button', action: (s) => s.init() },
  ],
  story: [
    {
      title: 'A hot gas',
      text: 'These are argon atoms at about 170 K (−100 °C). They zoom around, bouncing off the walls and occasionally off each other. Most of the box is empty space.',
      params: { T: 1.4, g: 0.05, bonds: true },
      enter: (s) => s.init(),
      duration: 10,
    },
    {
      title: 'Cooling: droplets condense',
      text: 'Cool them down. Slower atoms can no longer escape each other’s gentle pull when they meet, so they cling together. <b>Droplets</b> form, merge and rain to the bottom — condensation.',
      params: { T: 0.45 },
      tween: 5,
      duration: 15,
    },
    {
      title: 'A liquid',
      text: 'Now most atoms are in a puddle. They are packed closely but keep shuffling, swapping neighbours and sliding past one another. That is why liquids flow and take the shape of their container.',
      params: { T: 0.38 },
      duration: 12,
    },
    {
      title: 'Freezing into a crystal',
      text: 'Cool further and the atoms settle into the arrangement that packs them best: a <b>hexagonal crystal</b>. Each atom has six neighbours and only trembles in place. That rigid order is what makes a solid solid.',
      params: { T: 0.06 },
      tween: 6,
      duration: 16,
    },
    {
      title: 'Melting and boiling',
      text: 'Heat it up again. First the crystal’s edges loosen and it melts into a liquid, then atoms at the surface gain enough energy to break free and <b>evaporate</b>, until it is all gas again.',
      params: { T: 1.2 },
      tween: 12,
      duration: 16,
    },
    {
      title: 'Your lab',
      text: 'Set the temperature and gravity, add or remove atoms, and hold the mouse over the atoms to heat a spot (hold Shift to cool it).',
      params: { T: 0.3, g: 0.05 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let n = 0, x, y, vx, vy, ax, ay, bonds = [], coord = 0, tCur = 0;
    const sT = new Series(300), sC = new Series(300);
    const ncx = Math.ceil(BW / RC), ncy = Math.ceil(BH / RC);
    const head = new Int32Array(ncx * ncy);
    let next;

    function init() {
      n = Math.round(params.N);
      x = new Float32Array(n);
      y = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      ax = new Float32Array(n);
      ay = new Float32Array(n);
      next = new Int32Array(n);
      const cols = Math.ceil(Math.sqrt((n * BW) / BH));
      const sp = BW / cols;
      for (let i = 0; i < n; i++) {
        x[i] = (i % cols) * sp + sp / 2 + (Math.random() - 0.5) * 0.3;
        y[i] = Math.floor(i / cols) * sp + sp / 2 + (Math.random() - 0.5) * 0.3;
        const s = Math.sqrt(Math.max(0.05, params.T));
        vx[i] = randn() * s;
        vy[i] = randn() * s;
      }
      forces();
      sT.clear();
      sC.clear();
    }

    function forces(collect = false) {
      head.fill(-1);
      for (let i = 0; i < n; i++) {
        const cx = clamp(Math.floor(x[i] / RC), 0, ncx - 1), cy = clamp(Math.floor(y[i] / RC), 0, ncy - 1);
        const c = cy * ncx + cx;
        next[i] = head[c];
        head[c] = i;
        ax[i] = 0;
        ay[i] = params.g;
      }
      if (collect) bonds.length = 0;
      let links = 0;
      for (let cy = 0; cy < ncy; cy++)
        for (let cx = 0; cx < ncx; cx++) {
          for (let i = head[cy * ncx + cx]; i >= 0; i = next[i]) {
            for (let oy = -1; oy <= 1; oy++)
              for (let ox = -1; ox <= 1; ox++) {
                const nx = cx + ox, ny = cy + oy;
                if (nx < 0 || ny < 0 || nx >= ncx || ny >= ncy) continue;
                for (let j = head[ny * ncx + nx]; j >= 0; j = next[j]) {
                  if (j <= i) continue;
                  const dx = x[j] - x[i], dy = y[j] - y[i];
                  let r2 = dx * dx + dy * dy;
                  if (r2 > RC2) continue;
                  if (r2 < 0.64) r2 = 0.64;
                  const ir2 = 1 / r2, ir6 = ir2 * ir2 * ir2;
                  const f = 24 * ir2 * ir6 * (2 * ir6 - 1);
                  ax[i] -= f * dx;
                  ay[i] -= f * dy;
                  ax[j] += f * dx;
                  ay[j] += f * dy;
                  if (r2 < 1.69) {
                    links++;
                    if (collect) bonds.push(i, j);
                  }
                }
              }
          }
        }
      // soft walls
      for (let i = 0; i < n; i++) {
        if (x[i] < 0.6) ax[i] += (0.6 - x[i]) * 400;
        if (x[i] > BW - 0.6) ax[i] -= (x[i] - BW + 0.6) * 400;
        if (y[i] < 0.6) ay[i] += (0.6 - y[i]) * 400;
        if (y[i] > BH - 0.6) ay[i] -= (y[i] - BH + 0.6) * 400;
      }
      coord = (2 * links) / Math.max(1, n);
    }

    function step(collect) {
      for (let i = 0; i < n; i++) {
        vx[i] += ax[i] * DT * 0.5;
        vy[i] += ay[i] * DT * 0.5;
        x[i] += vx[i] * DT;
        y[i] += vy[i] * DT;
      }
      forces(collect);
      let ke = 0;
      for (let i = 0; i < n; i++) {
        vx[i] += ax[i] * DT * 0.5;
        vy[i] += ay[i] * DT * 0.5;
        ke += vx[i] * vx[i] + vy[i] * vy[i];
      }
      tCur = ke / (2 * n);
      const lam = Math.sqrt(clamp(1 + (DT / 0.25) * (params.T / Math.max(1e-6, tCur) - 1), 0.8, 1.25));
      for (let i = 0; i < n; i++) {
        vx[i] *= lam;
        vy[i] *= lam;
      }
    }

    const geom = () => {
      const { w, h } = api;
      const s = Math.min((w - 40) / BW, (h - 150) / BH);
      const W = BW * s, H = BH * s;
      return { s, X0: Math.min(w - W - 20, Math.max(20, w * 0.56 - W / 2)), Y0: Math.max(76, (h - H) / 2 - 30) };
    };

    init();

    return {
      init,
      reset: init,
      onParam(k) {
        if (k === 'N') init();
      },
      update() {
        const p = api.pointer;
        if (p.down) {
          const g = geom();
          const px = (p.x - g.X0) / g.s, py = (p.y - g.Y0) / g.s;
          for (let i = 0; i < n; i++) {
            const d2 = (x[i] - px) ** 2 + (y[i] - py) ** 2;
            if (d2 < 9) {
              const k = p.shift ? 0.9 : 1.08;
              vx[i] = vx[i] * k + (p.shift ? 0 : randn() * 0.15);
              vy[i] = vy[i] * k + (p.shift ? 0 : randn() * 0.15);
            }
          }
        }
        const steps = 8;
        for (let k = 0; k < steps; k++) step(k === steps - 1);
        if (api.frame % 3 === 0) {
          sT.push(tCur * 120);
          sC.push(coord);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0b1020' });
        const { s, X0, Y0 } = geom();
        ctx.fillStyle = 'rgba(120,150,230,0.04)';
        ctx.strokeStyle = 'rgba(160,180,240,0.35)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(X0, Y0, BW * s, BH * s);
        ctx.strokeRect(X0, Y0, BW * s, BH * s);
        if (params.bonds) {
          ctx.strokeStyle = 'rgba(120,200,255,0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let k = 0; k < bonds.length; k += 2) {
            const i = bonds[k], j = bonds[k + 1];
            ctx.moveTo(X0 + x[i] * s, Y0 + y[i] * s);
            ctx.lineTo(X0 + x[j] * s, Y0 + y[j] * s);
          }
          ctx.stroke();
        }
        // atoms coloured by their own speed (cold blue → hot orange)
        const buckets = [[], [], [], [], [], []];
        const cols = ['#3d7bff', '#38b6f5', '#5fe0d0', '#ffd166', '#ff9a3d', '#ff5a3d'];
        for (let i = 0; i < n; i++) {
          const e = (vx[i] * vx[i] + vy[i] * vy[i]) / 2;
          buckets[clamp(Math.floor(Math.sqrt(e / 0.9) * 3), 0, 5)].push(i);
        }
        const r = s * 0.5;
        ctx.globalCompositeOperation = 'lighter';
        buckets.forEach((b, k) => {
          for (const i of b) drawGlow(ctx, X0 + x[i] * s, Y0 + y[i] * s, r * 2.6, cols[k], 0.3);
        });
        ctx.globalCompositeOperation = 'source-over';
        if (api.pointer.down && api.pointer.inside) {
          ctx.strokeStyle = api.pointer.shift ? 'rgba(56,214,245,0.6)' : 'rgba(255,138,61,0.6)';
          ctx.beginPath();
          ctx.arc(api.pointer.x, api.pointer.y, 3 * s, 0, 6.2832);
          ctx.stroke();
        }
        if (!api.thumbnail) {
          const ph = this.phase();
          tag(ctx, `${ph}  ·  ${(tCur * 120).toFixed(0)} K`, X0 + BW * s, Y0 - 16, ph === 'Solid' ? C.cyan : ph === 'Liquid' ? C.teal : C.amber, { align: 'right', size: 12 });
        }
      },
      phase() {
        if (coord > 3.4 && tCur < 0.3) return 'Solid';
        if (coord > 2.2) return 'Liquid';
        if (coord > 0.9) return 'Liquid + gas';
        return 'Gas';
      },
      stats() {
        return [
          { label: 'Temperature', value: (tCur * 120).toFixed(0) + ' K', color: C.amber },
          { label: 'Target', value: (params.T * 120).toFixed(0) + ' K' },
          { label: 'Neighbours per atom', value: coord.toFixed(2) },
          { label: 'Phase (estimate)', value: this.phase(), color: C.teal },
        ];
      },
      charts() {
        return [
          { title: 'Temperature (K)', series: [{ data: sT.data, color: C.orange }], min: 0, length: 300 },
          { title: 'Close neighbours per atom (6 = crystal)', series: [{ data: sC.data, color: C.cyan }], min: 0, max: 6.5, length: 300 },
        ];
      },
    };
  },
};
