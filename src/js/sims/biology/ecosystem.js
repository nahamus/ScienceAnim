import { C, TAU, clamp, rand, SpatialHash, Series, drawGlow, tag } from '../../core/util.js';

const CELL = 18, MAXR = 1400, MAXF = 260;

export default {
  id: 'ecosystem',
  title: 'Predators & Prey',
  category: 'biology',
  tagline: 'Rabbits boom, foxes feast, everyone crashes — and the cycle starts again.',
  ages: ['11-14', '14-16'],
  topics: ['Ecology', 'Populations'],
  blurb:
    'Grass feeds rabbits, rabbits feed foxes. Each animal here follows a few simple rules: wander, eat, breed when well fed, starve when not. Nobody plans anything, yet the populations rise and fall in endless chasing waves — the same cycles fur trappers recorded for lynx and hares over a century.',
  ideas: [
    'More prey means more food for predators, so predators <b>multiply</b>.',
    'Too many predators <b>eat down</b> the prey, and then starve themselves.',
    'With few predators left, prey recover — and the cycle <b>repeats</b>.',
    'The predator peak always <b>lags behind</b> the prey peak.',
  ],
  hint: 'Click to drop in foxes (Shift-click for rabbits)',
  thumbChapter: 3,
  thumbFrames: 500,
  params: [
    { key: 'grass', label: 'Grass regrowth', type: 'range', min: 0.02, max: 0.4, step: 0.01, value: 0.12 },
    { key: 'rbreed', label: 'Rabbit breeding', type: 'range', min: 0.2, max: 1.5, step: 0.05, value: 0.7 },
    { key: 'hunt', label: 'Fox hunting skill', type: 'range', min: 0.4, max: 1.6, step: 0.05, value: 1, format: (v) => v.toFixed(2) + '×' },
    { key: 'speed', label: 'Simulation speed', type: 'range', min: 0.5, max: 4, step: 0.1, value: 2, format: (v) => v.toFixed(1) + '×' },
    { key: 'migrate', label: 'Occasional newcomers', type: 'toggle', value: true },
    { key: 'restart', label: 'Restart', type: 'button', action: (s) => s.init(60, 8) },
  ],
  story: [
    {
      title: 'A meadow of rabbits',
      text: 'Forty rabbits on a fresh green meadow and no predators. They graze, grow fat and breed. With food everywhere their numbers <b>explode</b> — until the grass runs short and hunger catches up.',
      params: { grass: 0.12, rbreed: 0.7, hunt: 1, speed: 2, migrate: false },
      enter: (s) => s.init(40, 0),
      duration: 13,
    },
    {
      title: 'Enter the foxes',
      text: 'A few foxes arrive. Surrounded by easy prey they eat well and raise large litters. The orange line on the chart starts to climb.',
      params: { migrate: true },
      enter: (s) => s.addFoxes(10),
      duration: 13,
    },
    {
      title: 'Boom and bust',
      text: 'Soon there are too many foxes. Rabbits are eaten faster than they can breed and their numbers <b>crash</b>. Then the foxes, short of food, starve.',
      params: { migrate: true },
      duration: 16,
    },
    {
      title: 'Endless cycles',
      text: 'With few foxes left, the surviving rabbits recover — and the cycle begins again. Notice that fox peaks always come <b>after</b> rabbit peaks. Canadian lynx and snowshoe hares show the same ten-year waves.',
      formula: 'dR/dt = αR − βRF,     dF/dt = δRF − γF',
      params: { speed: 3, migrate: true },
      enter: (s) => s.init(120, 12),
      duration: 18,
    },
    {
      title: 'Change the balance',
      text: 'Make foxes better hunters and watch the swings grow wilder — sometimes too wild, wiping out the rabbits and then the foxes. Ecosystems with clumsier predators are often more stable.',
      params: { hunt: 1.5, speed: 3 },
      duration: 16,
    },
    {
      title: 'Run your own world',
      text: 'Tune grass, breeding and hunting, and click to drop in foxes (Shift-click for rabbits). Can you find a balance where both survive?',
      params: { hunt: 1, speed: 2, migrate: true },
      enter: (s) => s.init(80, 8),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let rabbits = [], foxes = [], grass, gw = 0, gh = 0, time = 0, img, off, octx;
    const hash = new SpatialHash(60);
    const sR = new Series(500), sF = new Series(500);
    let sampleT = 0;

    function grid() {
      gw = Math.ceil(api.w / CELL);
      gh = Math.ceil(api.h / CELL);
      grass = new Float32Array(gw * gh).fill(1);
      off = document.createElement('canvas');
      off.width = gw;
      off.height = gh;
      octx = off.getContext('2d');
      img = octx.createImageData(gw, gh);
    }
    const mk = (fox, x, y, e) => ({ x: x ?? rand(api.w), y: y ?? rand(api.h), a: rand(TAU), e: e ?? (fox ? 1.2 : rand(0.4, 0.9)), fox, t: 0 });
    function init(nr = 60, nf = 8) {
      grid();
      rabbits = Array.from({ length: nr }, () => mk(false));
      foxes = Array.from({ length: nf }, () => mk(true));
      sR.clear();
      sF.clear();
      time = 0;
    }
    function addFoxes(n, x, y) {
      for (let i = 0; i < n; i++) foxes.push(mk(true, x !== undefined ? x + rand(-20, 20) : undefined, y !== undefined ? y + rand(-20, 20) : undefined));
    }

    function move(o, sp, dt) {
      o.x += Math.cos(o.a) * sp * dt;
      o.y += Math.sin(o.a) * sp * dt;
      if (o.x < 0) (o.x = 0), (o.a = Math.PI - o.a);
      if (o.x > api.w) (o.x = api.w), (o.a = Math.PI - o.a);
      if (o.y < 0) (o.y = 0), (o.a = -o.a);
      if (o.y > api.h) (o.y = api.h), (o.a = -o.a);
    }

    function step(dt) {
      time += dt;
      const gr = params.grass;
      for (let i = 0; i < grass.length; i++) grass[i] += gr * dt * (1.05 - grass[i]) * (grass[i] + 0.05);
      // rabbits
      const born = [];
      for (const r of rabbits) {
        r.t += dt;
        r.a += rand(-1, 1) * 3 * dt;
        const ci = clamp(Math.floor(r.y / CELL), 0, gh - 1) * gw + clamp(Math.floor(r.x / CELL), 0, gw - 1);
        const g = grass[ci];
        // slow down to graze on good grass
        move(r, g > 0.3 ? 14 : 46, dt);
        const bite = Math.min(g, 1.6 * dt);
        grass[ci] = g - bite;
        r.e += bite * 0.9 - 0.11 * dt;
        if (r.e > 1.1 && Math.random() < dt * params.rbreed && rabbits.length + born.length < MAXR) {
          r.e *= 0.5;
          born.push(mk(false, r.x, r.y, r.e));
        }
      }
      rabbits = rabbits.filter((r) => r.e > 0 && r.t < 40).concat(born);
      hash.clear();
      for (const r of rabbits) hash.insert(r);
      // foxes
      const near = [];
      const kits = [];
      const eaten = new Set();
      for (const f of foxes) {
        f.t += dt;
        hash.query(f.x, f.y, 80, near);
        let best = null, bd = 80 * 80;
        for (const r of near) {
          if (eaten.has(r)) continue;
          const d = (r.x - f.x) ** 2 + (r.y - f.y) ** 2;
          if (d < bd) (bd = d), (best = r);
        }
        if (best) {
          const ta = Math.atan2(best.y - f.y, best.x - f.x);
          let da = ta - f.a;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          f.a += clamp(da, -4 * dt, 4 * dt);
          if (bd < 100 && Math.random() < 0.3 * params.hunt) {
            eaten.add(best);
            f.e += 0.45;
          }
        } else f.a += rand(-1, 1) * 2.5 * dt;
        move(f, best ? 52 * Math.sqrt(params.hunt) : 34, dt);
        f.e -= 0.14 * dt;
        if (f.e > 1.6 && Math.random() < dt * 0.5 && foxes.length + kits.length < MAXF) {
          f.e *= 0.5;
          kits.push(mk(true, f.x, f.y, f.e));
        }
      }
      if (eaten.size) rabbits = rabbits.filter((r) => !eaten.has(r));
      foxes = foxes.filter((f) => f.e > 0 && f.t < 45).concat(kits);
      if (params.migrate) {
        if (foxes.length < 2 && rabbits.length > 60 && Math.random() < dt * 0.15) addFoxes(2);
        if (rabbits.length < 4 && Math.random() < dt * 0.3) for (let i = 0; i < 4; i++) rabbits.push(mk(false));
      }
    }

    init(40, 0);

    return {
      init,
      addFoxes,
      reset: () => init(60, 8),
      resize() {
        if (Math.ceil(api.w / CELL) !== gw || Math.ceil(api.h / CELL) !== gh) {
          const old = grass;
          const ow = gw;
          grid();
          if (old) for (let y = 0; y < gh; y++) for (let x = 0; x < Math.min(gw, ow); x++) grass[y * gw + x] = old[y * ow + x] ?? 1;
        }
      },
      pointerDown(p) {
        if (p.shift) for (let i = 0; i < 12; i++) rabbits.push(mk(false, p.x + rand(-25, 25), p.y + rand(-25, 25)));
        else addFoxes(5, p.x, p.y);
      },
      update(dt) {
        const T = dt * params.speed;
        const n = Math.ceil(T / 0.05);
        for (let i = 0; i < n; i++) step(T / n);
        sampleT += T;
        if (sampleT > 0.25) {
          sampleT = 0;
          sR.push(rabbits.length);
          sF.push(foxes.length);
        }
      },
      draw() {
        const { w, h } = api;
        const d = img.data;
        for (let i = 0, j = 0; i < grass.length; i++, j += 4) {
          const g = clamp(grass[i], 0, 1);
          d[j] = 26 + 30 * (1 - g);
          d[j + 1] = 22 + 92 * g;
          d[j + 2] = 14 + 26 * g;
          d[j + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, gw * CELL, gh * CELL);
        ctx.fillStyle = 'rgba(3,6,12,0.25)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#f3ecdc';
        for (const r of rabbits) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, 2.6, 0, TAU);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const f of foxes) drawGlow(ctx, f.x, f.y, 14, '#ff8a3d', 0.2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ff9b4a';
        for (const f of foxes) {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.a);
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(-5, -4.5);
          ctx.lineTo(-3, 0);
          ctx.lineTo(-5, 4.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        if (!api.thumbnail) {
          tag(ctx, `rabbits ${rabbits.length}`, w - 16, 84, '#f3ecdc', { align: 'right', size: 12 });
          tag(ctx, `foxes ${foxes.length}`, w - 16, 110, C.orange, { align: 'right', size: 12 });
        }
      },
      stats() {
        let g = 0;
        for (let i = 0; i < grass.length; i++) g += grass[i];
        return [
          { label: 'Rabbits', value: String(rabbits.length), color: '#f3ecdc' },
          { label: 'Foxes', value: String(foxes.length), color: C.orange },
          { label: 'Grass cover', value: ((g / grass.length) * 100).toFixed(0) + ' %', color: C.lime },
          { label: 'Days elapsed', value: (time * 2).toFixed(0) },
        ];
      },
      charts() {
        return [
          { title: 'Population', series: [{ data: sR.data, color: '#f3ecdc', label: 'rabbits' }], min: 0, length: 500 },
          { title: 'Population', series: [{ data: sF.data, color: C.orange, label: 'foxes' }], min: 0, length: 500 },
        ];
      },
      tally: () => [rabbits.length, foxes.length],
      _step: step,
    };
  },
};
