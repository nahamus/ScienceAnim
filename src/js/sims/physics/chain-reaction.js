import { C, Series, backdrop, drawGlow, rand, randInt, rgba, roundRect, tag, TAU } from '../../core/util.js';

export default {
  id: 'chain-reaction',
  title: 'Nuclear Chain Reaction',
  category: 'physics',
  tagline: 'One neutron splits one atom — and sets off an avalanche. Can you keep it under control?',
  blurb:
    'When a slow neutron strikes a uranium-235 nucleus, the nucleus splits into two smaller atoms, releases enormous energy and spits out two or three more neutrons. If those go on to split more nuclei, the reaction feeds itself. Bombs let it run away; reactors balance it on a knife edge.',
  ideas: [
    'Each fission releases about 200 MeV — roughly 50 million times more than burning a carbon atom.',
    'The multiplication factor <b>k</b> is the average number of new fissions caused by each fission.',
    '<b>k &gt; 1</b>: runaway growth. <b>k &lt; 1</b>: the reaction fizzles. <b>k = 1</b>: steady power.',
    'Control rods soak up neutrons to hold a reactor at exactly k = 1.',
  ],
  hint: 'Click anywhere to fire a neutron',
  thumbChapter: 1,
  thumbFrames: 200,
  params: [
    {
      key: 'scene', label: 'Scene', type: 'select', value: 'single',
      options: [
        { value: 'single', label: 'Single fission' },
        { value: 'chain', label: 'Fuel block' },
        { value: 'reactor', label: 'Reactor core' },
      ],
    },
    { key: 'density', label: 'Fuel density', type: 'range', min: 0.15, max: 1, step: 0.01, value: 0.9, format: (v) => (v * 100).toFixed(0) + ' %', instant: true },
    { key: 'rods', label: 'Control rods inserted', type: 'range', min: 0, max: 1, step: 0.01, value: 0.5, format: (v) => (v * 100).toFixed(0) + ' %' },
    { key: 'fire', label: 'Fire a neutron', type: 'button', action: (s) => s.fire() },
    { key: 'reload', label: 'Reload fuel', type: 'button', action: (s) => s.build() },
  ],
  story: [
    {
      title: 'Splitting the atom',
      text: 'A neutron drifts into a uranium-235 nucleus. The nucleus wobbles, stretches and <b>splits</b> into two lighter atoms, releasing a flash of energy and two or three fresh neutrons.',
      formula: 'n + ²³⁵U → Ba + Kr + 3n + 200 MeV',
      params: { scene: 'single' },
      duration: 12,
    },
    {
      title: 'A chain reaction',
      text: 'In a dense block of fuel, each new neutron can split another nucleus. One becomes three, three become nine… The chart shows neutron numbers rocketing upward: <b>exponential growth</b>.',
      formula: 'N = k<sup>generations</sup>',
      params: { scene: 'chain', density: 0.95 },
      enter: (s) => s.build(),
      duration: 13,
    },
    {
      title: 'Not enough fuel',
      text: 'Spread the fuel thin and most neutrons escape before hitting anything. The reaction fizzles out. Getting enough fuel close together is called reaching <b>critical mass</b>.',
      params: { scene: 'chain', density: 0.32 },
      enter: (s) => s.build(),
      duration: 13,
    },
    {
      title: 'Inside a reactor',
      text: 'A reactor keeps the fuel topped up and lowers <b>control rods</b> that absorb neutrons. Set just right, every fission triggers exactly one more — a steady, controlled glow of heat.',
      params: { scene: 'reactor', density: 0.85, rods: 0.55 },
      enter: (s) => s.build(),
      duration: 15,
    },
    {
      title: 'Pull the rods',
      text: 'Withdraw the rods and the neutron population climbs; plunge them in and it dies away. Use the slider to hold the reactor steady — that’s a reactor operator’s job.',
      params: { scene: 'reactor', rods: 0.2 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let nuclei = [], neutrons = [], frags = [], flashes = [], energy = 0, fissions = 0, pop = new Series(300), singleTimer = 0, regen = 0;
    const SPEED = 230;

    function rodRects() {
      const { w, h } = api;
      if (params.scene !== 'reactor') return [];
      const out = [];
      const n = 5, depth = params.rods * h * 0.9;
      for (let i = 0; i < n; i++) {
        const x = w * (0.18 + (0.64 * (i + 0.5)) / n) - 7;
        out.push({ x, y: 0, w: 14, h: depth });
      }
      return out;
    }
    function lattice() {
      const { w, h } = api;
      const list = [];
      const sp = 26 / Math.sqrt(params.density);
      const x0 = w * 0.12, x1 = w * 0.88, y0 = h * 0.1, y1 = h * 0.86;
      for (let y = y0; y < y1; y += sp) for (let x = x0; x < x1; x += sp) list.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), r: 7, wob: rand(TAU) });
      return list;
    }
    function build() {
      neutrons = [];
      frags = [];
      flashes = [];
      pop.clear();
      energy = 0;
      fissions = 0;
      if (params.scene === 'single') {
        nuclei = [{ x: api.w * 0.55, y: api.h * 0.42, r: 30, wob: 0 }];
        singleTimer = 0.6;
      } else {
        nuclei = lattice();
        fire(api.w * 0.12 - 40, api.h * 0.48, 0);
      }
    }
    function fire(x = api.w * 0.05, y = api.h * 0.45, a = rand(-0.2, 0.2)) {
      const sp = params.scene === 'single' ? 140 : SPEED;
      neutrons.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 6 });
    }
    function fission(n) {
      fissions++;
      energy += 200;
      const big = params.scene === 'single';
      const a = rand(TAU);
      const s = big ? 70 : 90;
      frags.push({ x: n.x, y: n.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: n.r * 0.72, c: '#b18cff', life: 1 });
      frags.push({ x: n.x, y: n.y, vx: -Math.cos(a) * s, vy: -Math.sin(a) * s, r: n.r * 0.62, c: '#ff8a3d', life: 1 });
      flashes.push({ x: n.x, y: n.y, t: 0, big });
      const k = randInt(2, 3);
      for (let i = 0; i < k; i++) {
        const b = rand(TAU);
        const sp = big ? 150 : SPEED;
        if (neutrons.length < 1800) neutrons.push({ x: n.x + Math.cos(b) * n.r, y: n.y + Math.sin(b) * n.r, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp, life: 6 });
      }
    }

    return {
      build,
      fire: () => fire(),
      resize: build,
      reset: build,
      onParam(k) {
        if (k === 'scene' || k === 'density') build();
      },
      pointerDown(p) {
        const a = rand(TAU);
        neutrons.push({ x: p.x, y: p.y, vx: Math.cos(a) * SPEED, vy: Math.sin(a) * SPEED, life: 6 });
      },
      update(dt) {
        const { w, h } = api;
        const rods = rodRects();
        if (params.scene === 'single') {
          if (!nuclei.length && !frags.length && neutrons.every((n) => n.x > w || n.x < 0 || n.y < 0 || n.y > h)) {
            singleTimer -= dt;
            if (singleTimer < -1) {
              nuclei = [{ x: w * 0.55, y: h * 0.42, r: 30, wob: 0 }];
              neutrons = [];
              singleTimer = 0.8;
            }
          } else if (singleTimer > 0) {
            singleTimer -= dt;
            if (singleTimer <= 0) fire(w * 0.05, h * 0.42, 0);
          }
        }
        for (const n of neutrons) {
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          n.life -= dt;
          for (const r of rods) if (n.x > r.x && n.x < r.x + r.w && n.y > r.y && n.y < r.y + r.h) n.dead = true;
          if (n.x < -20 || n.y < -20 || n.x > w + 20 || n.y > h + 20 || n.life < 0) n.dead = true;
          if (n.dead) continue;
          for (const nu of nuclei) {
            if (nu.dead) continue;
            if ((n.x - nu.x) ** 2 + (n.y - nu.y) ** 2 < nu.r * nu.r) {
              if (Math.random() < 0.9) {
                nu.dead = true;
                n.dead = true;
                fission(nu);
              }
              break;
            }
          }
        }
        neutrons = neutrons.filter((n) => !n.dead);
        nuclei = nuclei.filter((n) => !n.dead);
        for (const f of frags) {
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          f.vx *= 1 - dt * 1.5;
          f.vy *= 1 - dt * 1.5;
          f.life -= dt * (params.scene === 'single' ? 0.35 : 0.9);
        }
        frags = frags.filter((f) => f.life > 0);
        for (const f of flashes) f.t += dt;
        flashes = flashes.filter((f) => f.t < 1.2);
        // reactor: fuel is replenished, and a stray neutron source keeps it from dying out completely
        if (params.scene === 'reactor') {
          regen += dt * 40;
          while (regen > 1) {
            regen--;
            const sp = 26 / Math.sqrt(params.density);
            const cap = Math.floor(((w * 0.76) / sp) * ((h * 0.76) / sp));
            if (nuclei.length < cap) nuclei.push({ x: rand(w * 0.12, w * 0.88), y: rand(h * 0.1, h * 0.86), r: 7, wob: rand(TAU), born: 0 });
          }
          if (neutrons.length < 2 && Math.random() < dt * 2) fire(rand(w * 0.2, w * 0.8), rand(h * 0.2, h * 0.8), rand(TAU));
        }
        if (api.frame % 3 === 0) pop.push(neutrons.length);
        for (const nu of nuclei) {
          nu.wob += dt * 3;
          if (nu.born !== undefined) nu.born = Math.min(1, nu.born + dt * 2);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0a1220', edge: '#02040a' });
        const single = params.scene === 'single';
        // reactor water glow (Cherenkov blue) scales with activity
        if (params.scene === 'reactor') {
          const a = Math.min(1, neutrons.length / 300);
          const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
          g.addColorStop(0, rgba('#3d8bff', 0.08 + a * 0.3));
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
        // nuclei
        for (const nu of nuclei) {
          const s = nu.born !== undefined ? nu.born : 1;
          if (single) {
            // a cluster of protons and neutrons
            const R = nu.r * s;
            drawGlow(ctx, nu.x, nu.y, R * 2.2, '#2ee6a6', 0.25);
            for (let i = 0; i < 40; i++) {
              const a = i * 2.39996, rr = R * 0.85 * Math.sqrt(i / 40);
              ctx.fillStyle = i % 2 ? '#ff6b6b' : '#8fb3ff';
              ctx.beginPath();
              ctx.arc(nu.x + Math.cos(a) * rr + Math.sin(nu.wob + i) * 1.2, nu.y + Math.sin(a) * rr, 5, 0, TAU);
              ctx.fill();
            }
          } else {
            ctx.fillStyle = rgba('#2ee6a6', 0.85 * s);
            ctx.beginPath();
            ctx.arc(nu.x, nu.y, nu.r * s * (1 + Math.sin(nu.wob) * 0.04), 0, TAU);
            ctx.fill();
            ctx.fillStyle = rgba('#d9fff0', 0.5 * s);
            ctx.beginPath();
            ctx.arc(nu.x - 2, nu.y - 2, nu.r * 0.35 * s, 0, TAU);
            ctx.fill();
          }
        }
        // control rods
        for (const r of rodRects()) {
          const g = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
          g.addColorStop(0, '#2b334f');
          g.addColorStop(0.5, '#7380a8');
          g.addColorStop(1, '#2b334f');
          ctx.fillStyle = g;
          roundRect(ctx, r.x, r.y - 6, r.w, r.h + 6, 4);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const f of flashes) {
          const k = f.t / 1.2;
          const R = (f.big ? 260 : 60) * Math.sqrt(k);
          ctx.strokeStyle = `rgba(255,220,150,${(1 - k) * 0.7})`;
          ctx.lineWidth = f.big ? 3 : 1.5;
          ctx.beginPath();
          ctx.arc(f.x, f.y, R, 0, TAU);
          ctx.stroke();
          drawGlow(ctx, f.x, f.y, (f.big ? 160 : 38) * (1 - k * 0.6), '#ffd27a', 0.15 + (1 - k) * 0.2);
        }
        for (const f of frags) {
          drawGlow(ctx, f.x, f.y, f.r * 2.6, f.c, 0.3);
          ctx.fillStyle = rgba(f.c, f.life);
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r * 0.8, 0, TAU);
          ctx.fill();
        }
        for (const n of neutrons) {
          drawGlow(ctx, n.x, n.y, single ? 14 : 8, '#cfe3ff', 0.3);
        }
        ctx.globalCompositeOperation = 'source-over';
        if (!api.thumbnail && single) {
          const nu = nuclei[0];
          if (nu) tag(ctx, 'uranium-235', nu.x, nu.y - nu.r - 26, C.teal, { align: 'center' });
          if (neutrons.length === 1 && nu) tag(ctx, 'neutron', neutrons[0].x, neutrons[0].y - 24, '#cfe3ff', { align: 'center' });
          if (frags.length) {
            tag(ctx, 'barium', frags[0].x, frags[0].y - 30, '#b18cff', { align: 'center' });
            tag(ctx, 'krypton', frags[1]?.x ?? 0, (frags[1]?.y ?? 0) - 30, C.orange, { align: 'center' });
          }
        }
      },
      stats() {
        const d = pop.data, n = d.length;
        let k = '—';
        if (n > 40 && d[n - 30] > 3) k = Math.pow(d[n - 1] / d[n - 30], 1 / 3).toFixed(2);
        return [
          { label: 'Free neutrons', value: String(neutrons.length) },
          { label: 'Fissions', value: fissions.toLocaleString() },
          { label: 'Energy released', value: energy >= 1000 ? (energy / 1000).toFixed(1) + ' GeV' : energy + ' MeV', color: C.amber },
          { label: 'Growth (k est.)', value: k },
        ];
      },
      charts() {
        return [{ title: 'Neutron population', series: [{ data: pop.data, color: '#cfe3ff' }], min: 0, length: 300, xLabel: 'time →' }];
      },
    };
  },
};
