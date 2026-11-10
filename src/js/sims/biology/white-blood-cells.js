import { C, TAU, clamp, lerp, tag, rand, seeded, Series } from '../../core/util.js';

const CELL = 14; // px per cell of the alarm-signal (chemokine) grid
const MAX_GERMS = 320;

export default {
  id: 'white-blood-cells',
  title: 'White Blood Cells vs Germs',
  category: 'biology',
  tagline: 'Germs get in through a splinter. Watch white blood cells sense the alarm, squeeze out of the blood and eat them.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Immune system', 'Cells', 'Disease'],
  keywords: ['white blood cells', 'immune system', 'neutrophil', 'macrophage', 'phagocytosis', 'antibodies', 'bacteria', 'infection', 'inflammation', 'pus', 'vaccine', 'memory cells', 'chemotaxis'],
  blurb:
    'A splinter breaks the skin and bacteria start multiplying. Resident macrophages raise the alarm with chemical signals; neutrophils racing past in the blood stick to the vessel wall, squeeze through it, follow the chemical trail and swallow the germs whole. Days later antibodies arrive to tag the survivors, and the body remembers, which is how vaccines work.',
  ideas: [
    'Bacteria can <b>double</b> every 20 minutes or so, so an infection grows fast.',
    'Cells in the tissue release <b>alarm chemicals</b> (chemokines) that spread out from the infection.',
    '<b>Neutrophils</b>, the most common white blood cell, stick to the vessel wall, squeeze between its cells and follow the chemical trail.',
    'They engulf and digest germs: <b>phagocytosis</b>. Dead neutrophils and germs make <b>pus</b>.',
    '<b>Antibodies</b> from B cells stick to germs, clump them and flag them to be eaten.',
    'After an infection, or a <b>vaccine</b>, <b>memory cells</b> make antibodies much faster next time.',
  ],
  hint: 'Click in the tissue to add more germs',
  thumbChapter: 3,
  thumbFrames: 240,
  params: [
    { key: 'grow', label: 'Germs double every', type: 'range', min: 1, max: 8, step: 0.1, value: 3, format: (v) => v.toFixed(1) + ' s (sped up)' },
    { key: 'wbc', label: 'White cells in the blood', type: 'range', min: 0, max: 3, step: 0.05, value: 1, format: (v) => (v === 0 ? 'none' : '×' + v.toFixed(1)) },
    { key: 'alarm', label: 'Alarm signals (chemokines)', type: 'toggle', value: true },
    { key: 'show', label: 'Show the alarm signal', type: 'toggle', value: true },
    { key: 'immunity', label: 'Antibodies', type: 'select', value: 'none', options: [{ value: 'none', label: 'First time meeting this germ' }, { value: 'memory', label: 'Vaccinated (or met it before)' }, { value: 'off', label: 'No antibodies' }] },
    { key: 'infect', label: 'Add germs', type: 'button', action: (s) => s.infect() },
  ],
  story: [
    {
      title: 'A splinter lets germs in',
      text: 'Skin is a wall that keeps germs out, but a splinter punches straight through it and carries <b>bacteria</b> (green) into the tissue underneath. Each one grows and splits in two, so their numbers <b>double</b> again and again. Real bacteria can double every 20 minutes; here time is sped up.',
      params: { wbc: 0, alarm: false, show: false, immunity: 'off', grow: 2.5 },
      enter: (s) => s.restart(),
      duration: 13,
    },
    {
      title: 'Raising the alarm',
      text: 'Big <b>macrophages</b> already living in the tissue spot the intruders. They start eating them and, more importantly, release <b>alarm chemicals</b> called chemokines. The signal (teal) spreads outwards, strongest near the germs. It also makes nearby blood vessels leaky: that is why a cut goes red, warm and swollen.',
      params: { wbc: 0, alarm: true, show: true },
      duration: 13,
    },
    {
      title: 'Leaving the blood',
      text: 'Billions of <b>neutrophils</b> ride the bloodstream with the red cells. Where the alarm reaches the vessel wall, they stick, roll along it and then <b>squeeze between the wall cells</b> into the tissue, a trick called diapedesis.',
      params: { wbc: 1.4, alarm: true, show: true },
      duration: 14,
    },
    {
      title: 'Seek and swallow',
      text: 'Each neutrophil crawls <em>up</em> the chemical trail towards the strongest signal, like following a smell. When it touches a bacterium it wraps around it and pulls it inside, then digests it with enzymes. This is called <b>phagocytosis</b> (“cell eating”).',
      params: { wbc: 1.4, alarm: true, show: false },
      check: {
        q: 'How does a neutrophil find bacteria hidden in the tissue?',
        options: ['It follows a trail of alarm chemicals', 'It wanders randomly until it bumps into one', 'The blood carries it straight to them'],
        answer: 0,
        explain: 'Neutrophils sense the chemokine gradient and crawl towards the strongest signal, which leads them to the infection. Switch the alarm off and see how much worse they do.',
      },
      duration: 15,
    },
    {
      title: 'Pus',
      text: 'A neutrophil can only eat a few germs (5 to 20) before it dies. The dead white cells, broken germs and fluid pile up as <b>pus</b>: the yellowish stuff in an infected cut is a battlefield of fallen neutrophils.',
      params: { wbc: 1.4, alarm: true, show: false },
      duration: 12,
    },
    {
      title: 'Antibodies arrive',
      text: 'Meanwhile, in the lymph nodes, <b>B cells</b> that happen to recognise this germ multiply and pour out <b>antibodies</b> (yellow Y shapes). For a brand-new germ this takes about a week (sped up here). Antibodies stick to germs, glue them into clumps that can’t multiply, and flag them so white cells swallow them faster.',
      params: { wbc: 0.8, alarm: true, show: false, immunity: 'none', grow: 2.2 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Memory and vaccines',
      text: 'Some of those B cells stay behind as <b>memory cells</b>. If the same germ comes back, antibodies flood in within a day or two and the infection is crushed before you feel ill. A <b>vaccine</b> gives you that memory safely, using a harmless piece or weakened version of the germ.',
      params: { wbc: 0.8, alarm: true, show: false, immunity: 'memory', grow: 2.2 },
      check: {
        q: 'Why does a vaccine stop you getting ill from a germ later?',
        options: ['It trains your immune system to make the right antibodies quickly', 'It kills every germ already in your body', 'It makes your white blood cells bigger'],
        answer: 0,
        explain: 'A vaccine leaves memory cells behind, so the next real infection triggers a fast, strong antibody response. Compare how quickly the germs are cleared now.',
      },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Explore',
      text: 'Click to add germs. Make them grow faster, remove the white cells or the alarm signal, and compare a first infection with a vaccinated body.',
      params: { wbc: 1, alarm: true, show: true, immunity: 'none', grow: 3 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let sinceInfect = 0, abOn = false, remembered = false, eaten = 0;
    let germs = [], neut = [], macro = [], abs = [], rbc = [], pus = [];
    let field = null, tmp = null, gx = 0, gy = 0, fieldCanvas = null, fieldImg = null;
    let tissueCanvas = null, spawnAcc = 0, abAcc = 0;
    const sGerms = new Series(300), sNeut = new Series(300);
    let L = null;

    function layout() {
      const { w, h } = api;
      const narrow = w < 700;
      const vy0 = narrow ? 70 : 76;
      const vy1 = vy0 + clamp(h * 0.1, 46, 80);
      const bottom = narrow ? Math.round(h * 0.6) : h;
      const sx = narrow ? w * 0.56 : w * 0.64;
      const sy = narrow ? lerp(vy1, bottom, 0.58) : lerp(vy1, Math.min(h, 760), 0.48);
      const sc = clamp(Math.min(w, h * 1.4) / 1100, 0.62, 1.1);
      return { w, h, narrow, vy0, vy1, bottom, sx, sy, sc };
    }

    // ---------------------------------------------- tissue texture (drawn once per size)
    function buildTissue() {
      tissueCanvas = document.createElement('canvas');
      tissueCanvas.width = Math.ceil(L.w);
      tissueCanvas.height = Math.ceil(L.h);
      const g = tissueCanvas.getContext('2d');
      const bg = g.createLinearGradient(0, 0, 0, L.h);
      bg.addColorStop(0, '#2a1420');
      bg.addColorStop(1, '#170b14');
      g.fillStyle = bg;
      g.fillRect(0, 0, L.w, L.h);
      const r = seeded(5);
      const n = Math.round((L.w * L.h) / 2600);
      for (let i = 0; i < n; i++) {
        const x = r() * L.w, y = L.vy1 + r() * (L.h - L.vy1), rr = (14 + r() * 16) * L.sc;
        g.fillStyle = `rgba(${150 + r() * 40},${70 + r() * 30},${100 + r() * 30},${0.05 + r() * 0.06})`;
        g.beginPath();
        g.ellipse(x, y, rr, rr * (0.6 + r() * 0.4), r() * TAU, 0, TAU);
        g.fill();
        g.fillStyle = 'rgba(120,60,120,0.12)';
        g.beginPath();
        g.arc(x + rr * 0.1, y, rr * 0.22, 0, TAU);
        g.fill();
      }
      // collagen fibres
      g.strokeStyle = 'rgba(230,180,200,0.05)';
      g.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        const x = r() * L.w, y = L.vy1 + r() * (L.h - L.vy1);
        g.beginPath();
        g.moveTo(x, y);
        g.bezierCurveTo(x + 60, y + rand(-30, 30), x + 120, y + rand(-30, 30), x + 200, y + rand(-20, 20));
        g.stroke();
      }
      // the blood vessel
      const vg = g.createLinearGradient(0, L.vy0, 0, L.vy1);
      vg.addColorStop(0, '#3a0a14');
      vg.addColorStop(0.5, '#5a1020');
      vg.addColorStop(1, '#3a0a14');
      g.fillStyle = vg;
      g.fillRect(0, L.vy0, L.w, L.vy1 - L.vy0);
      g.fillStyle = 'rgba(255,170,190,0.35)';
      for (const y of [L.vy0, L.vy1]) {
        for (let x = 0; x < L.w; x += 34 * L.sc) {
          g.beginPath();
          g.ellipse(x + 17 * L.sc, y, 15 * L.sc, 3.2, 0, 0, TAU);
          g.fill();
        }
      }
    }

    // ---------------------------------------------- the alarm-signal field
    function buildField() {
      gx = Math.ceil(L.w / CELL) + 1;
      gy = Math.ceil((L.bottom - L.vy0) / CELL) + 1;
      field = new Float32Array(gx * gy);
      tmp = new Float32Array(gx * gy);
      fieldCanvas = document.createElement('canvas');
      fieldCanvas.width = gx;
      fieldCanvas.height = gy;
      fieldImg = fieldCanvas.getContext('2d').createImageData(gx, gy);
    }
    const fi = (x, y) => clamp(Math.floor(x / CELL), 0, gx - 1) + clamp(Math.floor((y - L.vy0) / CELL), 0, gy - 1) * gx;
    function sampleField(x, y) {
      const fx = clamp(x / CELL - 0.5, 0, gx - 1.001), fy = clamp((y - L.vy0) / CELL - 0.5, 0, gy - 1.001);
      const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, k = i + j * gx;
      return lerp(lerp(field[k], field[k + 1], u), lerp(field[k + gx], field[k + gx + 1], u), v);
    }
    function stepField(dt) {
      const decay = Math.exp(-dt * 0.15);
      for (let s = 0; s < 2; s++) {
        for (let j = 0; j < gy; j++) {
          for (let i = 0; i < gx; i++) {
            const k = i + j * gx, c = field[k];
            const l = i > 0 ? field[k - 1] : c, r = i < gx - 1 ? field[k + 1] : c;
            const u = j > 0 ? field[k - gx] : c, d = j < gy - 1 ? field[k + gx] : c;
            tmp[k] = (c + 0.22 * (l + r + u + d - 4 * c)) * decay;
          }
        }
        [field, tmp] = [tmp, field];
      }
    }

    // ---------------------------------------------- germs, cells and antibodies
    const newGerm = (x, y, a = rand(TAU)) => ({ x, y, a, age: rand(0, params.grow), tag: 0, eater: null, dig: 0, vx: 0, vy: 0 });
    function infect(n = 14, x = L.sx, y = L.sy) {
      for (let i = 0; i < n && germs.length < MAX_GERMS; i++) germs.push(newGerm(x + rand(-18, 18) * L.sc, y + rand(-14, 14) * L.sc));
      // a fresh infection restarts the clock; adding germs mid-fight doesn't
      if (!abOn) sinceInfect = 0;
    }
    function restart() {
      germs = [];
      neut = [];
      abs = [];
      pus = [];
      eaten = 0;
      remembered = false;
      sGerms.clear();
      sNeut.clear();
      if (field) field.fill(0);
      seedMacro();
      infect(10);
    }
    function seedMacro() {
      const r = seeded(3);
      macro = [];
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU + 0.6;
        macro.push({ x: L.sx + Math.cos(a) * 150 * L.sc * (0.8 + r() * 0.5), y: clamp(L.sy + Math.sin(a) * 100 * L.sc, L.vy1 + 40, L.bottom - 30), vx: 0, vy: 0, ph: r() * TAU, busy: 0, gut: [] });
      }
    }
    function spawnRbc() {
      rbc = [];
      const n = Math.round(L.w / 26);
      for (let i = 0; i < n; i++) rbc.push({ x: rand(L.w), y: rand(L.vy0 + 10, L.vy1 - 10), a: rand(TAU), sp: rand(0.8, 1.2) });
    }

    // germs near a point, via a bucket grid rebuilt each frame
    let buckets = new Map(), bOX = 0, bOY = 0;
    const BK = 40;
    function rebucket() {
      buckets = new Map();
      // shift the grid every frame so the spreading push leaves no grid-shaped pattern
      bOX = rand(BK);
      bOY = rand(BK);
      for (const g of germs) {
        if (g.eater) continue;
        const k = (((g.x + bOX) / BK) | 0) * 4096 + (((g.y + bOY) / BK) | 0);
        let b = buckets.get(k);
        if (!b) buckets.set(k, (b = []));
        b.push(g);
      }
      // crowded germs spread outwards from the middle of their patch
      for (const b of buckets.values()) {
        if (b.length < 3) continue;
        let mx = 0, my = 0;
        for (const g of b) (mx += g.x), (my += g.y);
        mx /= b.length;
        my /= b.length;
        const k = Math.min(b.length, 24) * 0.25;
        for (const g of b) {
          const dx = g.x - mx, dy = g.y - my, d = Math.hypot(dx, dy) || 1;
          g.vx += (dx / d) * k;
          g.vy += (dy / d) * k;
        }
      }
    }
    function nearest(x, y, range, preferTagged = false) {
      let best = null, bd = range * range;
      const r = Math.ceil(range / BK), cx = ((x + bOX) / BK) | 0, cy = ((y + bOY) / BK) | 0;
      for (let i = cx - r; i <= cx + r; i++)
        for (let j = cy - r; j <= cy + r; j++) {
          const b = buckets.get(i * 4096 + j);
          if (b) for (const g of b) {
            if (g.eater) continue;
            const d = (g.x - x) ** 2 + (g.y - y) ** 2 * 1 - (preferTagged && g.tag ? 900 : 0);
            if (d < bd) (bd = d), (best = g);
          }
        }
      return best;
    }

    function update(dt) {
      sinceInfect += dt;
      rebucket();
      const sc = L.sc;
      // germs multiply unless clumped by antibodies
      const born = [];
      const crowd = germs.length / MAX_GERMS;
      for (const g of germs) {
        if (g.eater) continue;
        g.x += (rand(-1, 1) * 16 + g.vx) * dt * sc;
        g.y += (rand(-1, 1) * 16 + g.vy) * dt * sc;
        g.vx *= 0.9;
        g.vy *= 0.9;
        g.a += rand(-0.3, 0.3) * dt;
        g.x = clamp(g.x, 4, L.w - 4);
        g.y = clamp(g.y, L.vy1 + 8, L.bottom - 6);
        if (!g.tag) {
          g.age += dt;
          if (g.age > params.grow && Math.random() > crowd) {
            g.age = rand(-0.2, 0.2) * params.grow;
            const dx = Math.cos(g.a) * 5 * sc, dy = Math.sin(g.a) * 5 * sc;
            born.push(newGerm(g.x + dx, g.y + dy, g.a + rand(-0.4, 0.4)));
            g.x -= dx;
            g.y -= dy;
            born[born.length - 1].age = 0;
          }
        }
        if (params.alarm) field[fi(g.x, g.y)] += 0.6 * dt;
      }
      for (const b of born) if (germs.length < MAX_GERMS) germs.push(b);

      // macrophages: slow, big appetite, the main source of the alarm
      for (const m of macro) {
        const tg = nearest(m.x, m.y, 110 * sc);
        if (tg && params.alarm) field[fi(m.x, m.y)] += 40 * dt;
        if (tg) {
          const dx = tg.x - m.x, dy = tg.y - m.y, d = Math.hypot(dx, dy) || 1;
          m.vx = lerp(m.vx, (dx / d) * 10 * sc, dt);
          m.vy = lerp(m.vy, (dy / d) * 10 * sc, dt);
          if (d < 24 * sc && m.busy <= 0) swallow(m, tg, 0.7);
        } else {
          m.vx *= 0.98;
          m.vy *= 0.98;
        }
        m.busy -= dt;
        m.x += m.vx * dt;
        m.y = clamp(m.y + m.vy * dt, L.vy1 + 30, L.bottom - 20);
        m.ph += dt;
      }

      // neutrophils in the blood: they roll in, stick where the alarm reaches the wall, then squeeze out
      spawnAcc += dt * params.wbc * 5;
      while (spawnAcc > 1) {
        spawnAcc -= 1;
        if (neut.filter((n) => n.state !== 'blood').length < 70) neut.push({ x: -20, y: rand(L.vy0 + 14, L.vy1 - 14), state: 'blood', vx: 0, vy: 0, ph: rand(TAU), meals: 0, life: 0, gut: [], busy: 0, sq: 0 });
      }
      for (const n of neut) {
        n.ph += dt * 3;
        if (n.state === 'blood') {
          n.x += 140 * sc * dt;
          const wall = params.alarm ? sampleField(n.x, L.vy1 + CELL) : 0;
          if (n.x > 0 && Math.random() < dt * (params.alarm ? clamp(wall * 12, 0, 4) : 0.01)) n.state = 'roll';
          if (n.x > L.w + 30) n.dead = true;
        } else if (n.state === 'roll') {
          n.y = lerp(n.y, L.vy1 - 10 * sc, dt * 4);
          n.x += 22 * sc * dt;
          n.sq += dt;
          if (n.sq > 1.2) (n.state = 'squeeze'), (n.sq = 0);
        } else if (n.state === 'squeeze') {
          n.sq += dt / 1.4;
          n.y = lerp(L.vy1 - 10 * sc, L.vy1 + 18 * sc, n.sq);
          if (n.sq >= 1) n.state = 'tissue';
        } else {
          n.life += dt;
          const sp = 60 * sc;
          const tg = nearest(n.x, n.y, (abOn ? 90 : 60) * sc, true);
          let ax, ay;
          if (tg) {
            const dx = tg.x - n.x, dy = tg.y - n.y, d = Math.hypot(dx, dy) || 1;
            (ax = dx / d), (ay = dy / d);
            if (d < 16 * sc && n.busy <= 0) swallow(n, tg, tg.tag ? 0.2 : 0.45);
          } else if (params.alarm) {
            const gxv = sampleField(n.x + 8, n.y) - sampleField(n.x - 8, n.y);
            const gyv = sampleField(n.x, n.y + 8) - sampleField(n.x, n.y - 8);
            const gm = Math.hypot(gxv, gyv);
            if (gm > 1e-4) (ax = gxv / gm), (ay = gyv / gm);
            else (ax = rand(-1, 1)), (ay = rand(-1, 1));
          } else (ax = rand(-1, 1)), (ay = rand(-1, 1));
          const wob = Math.sin(n.ph * 1.3) * 0.5;
          n.vx = lerp(n.vx, (ax + wob * ay) * sp * (n.busy > 0 ? 0.3 : 1), dt * 2.5);
          n.vy = lerp(n.vy, (ay - wob * ax) * sp * (n.busy > 0 ? 0.3 : 1), dt * 2.5);
          n.x = clamp(n.x + n.vx * dt, 6, L.w - 6);
          n.y = clamp(n.y + n.vy * dt, L.vy1 + 14, L.bottom - 8);
          n.busy -= dt;
          // a neutrophil only manages a handful of meals before it dies and becomes pus
          if (n.meals >= 10 || n.life > 45) {
            n.dead = true;
            pus.push({ x: n.x, y: n.y, age: 0, ph: n.ph });
            for (const g of n.gut) germs.splice(germs.indexOf(g), 1), eaten++;
          }
        }
      }
      neut = neut.filter((n) => !n.dead);

      // digestion inside phagocytes
      for (const g of germs) {
        if (!g.eater) continue;
        g.dig += dt / 2.2;
        if (g.dig >= 1) g.gone = true;
      }
      if (germs.some((g) => g.gone)) {
        for (const g of germs) if (g.gone) {
          const e = g.eater;
          e.gut.splice(e.gut.indexOf(g), 1);
          eaten++;
        }
        germs = germs.filter((g) => !g.gone);
      }

      // antibodies: produced after a delay, much shorter with memory
      const live = germs.filter((g) => !g.eater).length;
      const delay = params.immunity === 'memory' || remembered ? 2.5 : 11;
      if (params.immunity !== 'off' && !abOn && live > 0 && sinceInfect > delay) (abOn = true), (remembered = true);
      if (abOn && live === 0 && abs.length === 0) abOn = false;
      if (abOn && params.immunity !== 'off') {
        abAcc += dt * 70;
        while (abAcc > 1 && abs.length < 320) {
          abAcc -= 1;
          abs.push({ x: clamp(L.sx + rand(-1, 1) * L.w * 0.3, 0, L.w), y: L.vy1 + 2, a: rand(TAU), life: 0 });
        }
        abAcc = Math.min(abAcc, 1);
      }
      for (const a of abs) {
        a.life += dt;
        const dx = L.sx - a.x, dy = L.sy - a.y, d = Math.hypot(dx, dy) || 1;
        a.x += ((dx / d) * 70 + rand(-60, 60)) * sc * dt;
        a.y += ((dy / d) * 70 + rand(-60, 60)) * sc * dt;
        a.a += rand(-3, 3) * dt;
        const g = nearest(a.x, a.y, 9 * sc);
        if (g && g.tag < 2) {
          g.tag++;
          a.dead = true;
        }
        if (a.life > 14) a.dead = true;
      }
      if (abs.length) abs = abs.filter((a) => !a.dead);
      if (params.immunity === 'off') abs = [];

      for (const p of pus) p.age += dt;
      if (pus.length > 90) pus.splice(0, pus.length - 90);
      pus = pus.filter((p) => p.age < 40);

      for (const r of rbc) {
        r.x += 150 * sc * r.sp * dt;
        r.a += dt;
        if (r.x > L.w + 20) (r.x = -20), (r.y = rand(L.vy0 + 10, L.vy1 - 10));
      }
      if (params.alarm) stepField(dt);
      else field.fill(0);
      sGerms.push(live);
      sNeut.push(neut.filter((n) => n.state === 'tissue').length);
    }

    function swallow(cell, g, busy) {
      g.eater = cell;
      g.dig = 0;
      g.ox = g.x - cell.x;
      g.oy = g.y - cell.y;
      cell.gut.push(g);
      cell.busy = busy;
      if (cell.meals !== undefined) cell.meals++;
    }

    // ---------------------------------------------- drawing
    function blob(x, y, r, ph, stretchX, stretchY, n = 10) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * TAU;
        const rr = r * (1 + 0.12 * Math.sin(a * 3 + ph) + 0.08 * Math.sin(a * 5 - ph * 1.3));
        const along = Math.cos(a) * stretchX + Math.sin(a) * stretchY;
        const k = 1 + Math.max(0, along) * 0.45;
        const px = x + Math.cos(a) * rr * k, py = y + Math.sin(a) * rr * k;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
    }
    function drawGerm(g, x, y, s, alpha = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(g.a);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g.tag ? '#8fcf5a' : '#5fe07a';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-6 * s, -2.6 * s, 12 * s, 5.2 * s, 2.6 * s) : ctx.rect(-6 * s, -2.6 * s, 12 * s, 5.2 * s);
      ctx.fill();
      ctx.fillStyle = 'rgba(10,60,20,0.5)';
      ctx.fillRect(-1 * s, -1.2 * s, 2 * s, 2.4 * s);
      if (g.tag) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < g.tag; i++) {
          const ax = (-3 + i * 3) * s;
          ctx.beginPath();
          ctx.moveTo(ax, -2.6 * s);
          ctx.lineTo(ax, -5 * s);
          ctx.lineTo(ax - 1.8 * s, -7 * s);
          ctx.moveTo(ax, -5 * s);
          ctx.lineTo(ax + 1.8 * s, -7 * s);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    /** All free germs at once: each rod is a round-capped line, so a colour needs just one stroke. */
    function drawGerms(s) {
      ctx.lineCap = 'round';
      ctx.lineWidth = 5.2 * s;
      for (const tagged of [false, true]) {
        ctx.beginPath();
        for (const g of germs) {
          if (g.eater || !!g.tag !== tagged) continue;
          const c = Math.cos(g.a) * 3.4 * s, sn = Math.sin(g.a) * 3.4 * s;
          ctx.moveTo(g.x - c, g.y - sn);
          ctx.lineTo(g.x + c, g.y + sn);
        }
        ctx.strokeStyle = tagged ? '#8fcf5a' : '#5fe07a';
        ctx.stroke();
      }
      // antibodies stuck on: little yellow Ys standing off the side of the rod
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      for (const g of germs) {
        if (g.eater || !g.tag) continue;
        const ux = Math.cos(g.a), uy = Math.sin(g.a), nx = -uy, ny = ux;
        for (let i = 0; i < g.tag; i++) {
          const along = (i ? 2 : -2) * s;
          const bx = g.x + ux * along + nx * 2.6 * s, by = g.y + uy * along + ny * 2.6 * s;
          const tx = bx + nx * 2.6 * s, ty = by + ny * 2.6 * s;
          ctx.moveTo(bx, by);
          ctx.lineTo(tx, ty);
          ctx.lineTo(tx + nx * 1.8 * s - ux * 1.8 * s, ty + ny * 1.8 * s - uy * 1.8 * s);
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + nx * 1.8 * s + ux * 1.8 * s, ty + ny * 1.8 * s + uy * 1.8 * s);
        }
      }
      ctx.strokeStyle = '#ffd166';
      ctx.stroke();
    }
    function drawPhagocyte(c, r, body, nucleus, lobes) {
      const sp = Math.hypot(c.vx, c.vy) || 1;
      blob(c.x, c.y, r, c.ph, (c.vx / sp) * Math.min(1, sp / 30), (c.vy / sp) * Math.min(1, sp / 30));
      ctx.fillStyle = body;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = nucleus;
      for (let i = 0; i < lobes; i++) {
        const a = c.ph * 0.2 + (i / lobes) * TAU;
        ctx.beginPath();
        ctx.arc(c.x + Math.cos(a) * r * 0.28, c.y + Math.sin(a) * r * 0.28, r * (lobes > 1 ? 0.27 : 0.42), 0, TAU);
        ctx.fill();
      }
      for (const g of c.gut) {
        const k = 1 - g.dig;
        drawGerm(g, c.x + g.ox * 0.4 * k, c.y + g.oy * 0.4 * k, L.sc * (0.5 + 0.5 * k), 0.25 + 0.6 * k);
      }
    }

    function draw() {
      const sc = L.sc;
      ctx.drawImage(tissueCanvas, 0, 0, L.w, L.h);
      // inflammation: the tissue warms (reddens) where the alarm is strong
      if (params.show && params.alarm) {
        const d = fieldImg.data;
        for (let k = 0; k < gx * gy; k++) {
          const v = field[k] / (field[k] + 0.5);
          d[k * 4] = 60;
          d[k * 4 + 1] = 230;
          d[k * 4 + 2] = 200;
          d[k * 4 + 3] = v * 150;
        }
        fieldCanvas.getContext('2d').putImageData(fieldImg, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(fieldCanvas, 0, L.vy0, gx * CELL, gy * CELL);
      }
      // red blood cells
      for (const r of rbc) {
        ctx.fillStyle = '#c0283c';
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 8 * sc, 8 * sc * (0.45 + 0.35 * Math.abs(Math.cos(r.a))), 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(80,0,10,0.45)';
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 3.5 * sc, 3.5 * sc * (0.45 + 0.35 * Math.abs(Math.cos(r.a))), 0, 0, TAU);
        ctx.fill();
      }
      // the splinter
      ctx.save();
      ctx.translate(L.sx, L.sy);
      ctx.rotate(0.42);
      const sg = ctx.createLinearGradient(0, -5 * sc, 0, 5 * sc);
      sg.addColorStop(0, '#a87a4a');
      sg.addColorStop(1, '#5c3c1e');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(-14 * sc, 0);
      ctx.lineTo(L.h, -6 * sc);
      ctx.lineTo(L.h, 6 * sc);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // pus: dead neutrophils
      for (const p of pus) {
        ctx.fillStyle = `rgba(232,220,150,${0.5 * (1 - p.age / 40)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9 * sc, 0, TAU);
        ctx.fill();
      }
      drawGerms(sc);
      for (const m of macro) drawPhagocyte(m, 24 * sc, 'rgba(190,150,220,0.55)', 'rgba(110,60,170,0.85)', 1);
      for (const n of neut) {
        if (n.state === 'squeeze') {
          // half through the wall: squash it
          ctx.save();
          ctx.translate(n.x, n.y);
          ctx.scale(0.65, 1.3);
          ctx.translate(-n.x, -n.y);
          drawPhagocyte(n, 11 * sc, 'rgba(235,225,250,0.85)', 'rgba(120,70,190,0.9)', 3);
          ctx.restore();
        } else drawPhagocyte(n, 11 * sc, 'rgba(235,225,250,0.85)', 'rgba(120,70,190,0.9)', 3);
      }
      // antibodies
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (const a of abs) {
        const c = Math.cos(a.a), s = Math.sin(a.a), k = 4 * sc;
        ctx.moveTo(a.x - c * k, a.y - s * k);
        ctx.lineTo(a.x, a.y);
        ctx.lineTo(a.x + Math.cos(a.a + 0.6) * k, a.y + Math.sin(a.a + 0.6) * k);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + Math.cos(a.a - 0.6) * k, a.y + Math.sin(a.a - 0.6) * k);
      }
      ctx.stroke();
      if (L.narrow) {
        ctx.fillStyle = '#05070f';
        ctx.fillRect(0, L.bottom, L.w, L.h - L.bottom);
      }

      if (api.thumbnail) return;
      const sz = L.narrow ? 9 : 11;
      tag(ctx, 'blood vessel', 12, L.vy1 + 14, '#ff8fa0', { size: sz });
      tag(ctx, 'splinter', L.sx + 120 * sc, L.sy + 26 * sc, '#d9a46a', { size: sz });
      const live = germs.filter((g) => !g.eater).length;
      if (live && !L.narrow) tag(ctx, 'bacteria', L.sx - 70 * sc, L.sy - 52 * sc, '#5fe07a', { align: 'center', size: sz });
      const m0 = macro[0];
      if (m0) tag(ctx, 'macrophage', m0.x, m0.y - 34 * sc, '#cfa8f0', { align: 'center', size: sz });
      const n0 = neut.find((n) => n.state === 'tissue' && n.y > L.vy1 + 40);
      if (n0) tag(ctx, 'neutrophil', n0.x, n0.y - 22 * sc, '#efe6ff', { align: 'center', size: sz });
      const nr = neut.find((n) => n.state === 'roll' || n.state === 'squeeze');
      if (nr && !L.narrow) tag(ctx, 'squeezing out', nr.x, L.vy0 - 12, C.ink, { align: 'center', size: sz });
      if (pus.length > 4 && !L.narrow) tag(ctx, 'pus', pus[pus.length - 1].x, pus[pus.length - 1].y + 22 * sc, '#e8dc96', { align: 'center', size: sz });
      if (abs.length) tag(ctx, 'antibodies', L.narrow ? 12 : L.w * 0.42, L.vy1 + (L.narrow ? 34 : 40), '#ffd166', { size: sz });
      if (!live && eaten > 0) tag(ctx, 'infection cleared!', L.sx, L.sy - 40 * sc, C.teal, { align: 'center', size: 13 });
    }

    return {
      infect: () => infect(),
      restart,
      reset: restart,
      resize() {
        const old = L;
        L = layout();
        buildTissue();
        buildField();
        spawnRbc();
        if (!old) restart();
        else {
          const fx = L.w / old.w, fy = (L.bottom - L.vy1) / (old.bottom - old.vy1);
          for (const o of [...germs, ...neut, ...macro, ...pus, ...abs]) {
            o.x *= fx;
            o.y = L.vy1 + (o.y - old.vy1) * fy;
          }
        }
      },
      pointerDown(p) {
        if (p.y > L.vy1 && p.y < L.bottom) infect(8, p.x, p.y);
      },
      update,
      draw,
      stats() {
        const live = germs.filter((g) => !g.eater).length;
        const ab = params.immunity === 'off' ? 'none' : abOn ? 'attacking!' : live ? `coming (${params.immunity === 'memory' || remembered ? 'fast: memory' : 'slow: first time'})` : '—';
        return [
          { label: 'Germs', value: String(live), color: '#5fe07a' },
          { label: 'Neutrophils at work', value: String(neut.filter((n) => n.state === 'tissue').length) },
          { label: 'Germs eaten', value: String(eaten) },
          { label: 'Antibodies', value: ab, color: abOn ? C.amber : C.dim },
        ];
      },
      charts() {
        return [
          { title: 'Germs alive', series: [{ data: sGerms.data, color: '#5fe07a' }], length: 300, min: 0 },
          { title: 'Neutrophils in the tissue', series: [{ data: sNeut.data, color: '#cfa8f0' }], length: 300, min: 0 },
        ];
      },
    };
  },
};
