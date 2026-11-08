import { C, SpatialHash, Series, backdrop, clamp, drawGlow, rand, randn, TAU } from '../../core/util.js';

export default {
  id: 'natural-selection',
  title: 'Evolution by Natural Selection',
  category: 'biology',
  tagline: 'Creatures with random genes compete for food. Watch a population adapt before your eyes.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Evolution', 'Genetics'],
  blurb:
    'Each creature carries three genes: speed, size and sensing range. Faster, bigger, sharper creatures find food more easily — but burn more energy. Creatures that eat enough reproduce, passing on their genes with small random mutations. No one designs anything; the population simply drifts toward whatever works.',
  ideas: [
    '<b>Variation:</b> individuals differ, partly because of random mutation.',
    '<b>Inheritance:</b> offspring resemble their parents.',
    '<b>Selection:</b> traits that help survival and reproduction become more common.',
    'Every advantage has a cost; the best trade-off depends on the environment.',
  ],
  hint: 'Click to drop food anywhere',
  thumbChapter: 1,
  thumbFrames: 300,
  params: [
    { key: 'food', label: 'Food supply', type: 'range', min: 5, max: 80, step: 1, value: 40, unit: '/s' },
    { key: 'mut', label: 'Mutation strength', type: 'range', min: 0, max: 0.3, step: 0.01, value: 0.08 },
    { key: 'pred', label: 'Big creatures eat small ones', type: 'toggle', value: false },
    { key: 'sense', label: 'Show sensing range', type: 'toggle', value: false },
    { key: 'restart', label: 'New population', type: 'button', action: (s) => s.init() },
  ],
  story: [
    {
      title: 'A random population',
      text: 'Forty creatures with random genes. <b>Colour</b> shows speed (blue = slow, red = fast), <b>size</b> is size, and each can sense food within a certain range. Moving costs energy; eating restores it.',
      params: { food: 40, mut: 0.08, pred: false, sense: true },
      enter: (s) => s.init(),
      duration: 12,
    },
    {
      title: 'Eat, reproduce, mutate',
      text: 'A creature that gathers enough energy splits in two. The child inherits its parent’s genes — with tiny random <b>mutations</b>. Those that can’t find food starve.',
      params: { sense: false },
      duration: 13,
    },
    {
      title: 'Selection at work',
      check: {
        q: 'Food is plentiful and the fastest creatures reach it first. Over many generations, average speed will…',
        options: ['rise', 'fall', 'stay the same'],
        answer: 0,
        explain: 'Fast creatures eat more, so they split more often and pass on their speed genes. No creature changes during its life: the population shifts because of who gets to reproduce.',
      },
      text: 'The charts track the average of each gene. With plenty of food, fast creatures win the race to each meal and speed creeps up generation after generation.',
      formula: 'variation + inheritance + selection = evolution',
      duration: 15,
    },
    {
      title: 'Hard times',
      check: {
        q: 'Now food is scarce, and speed burns energy fast. What happens to average speed now?',
        options: ['It keeps rising', 'It falls', 'It stays the same'],
        answer: 1,
        explain: 'When meals are rare, burning energy to run fast is a losing bet. Thrifty, slower creatures outlast the fast ones: “fittest” depends on the environment.',
      },
      text: 'Now food becomes scarce. Speed and size are expensive to run (energy cost ∝ size³ × speed²). Watch thrifty, slower creatures gain the edge — the environment decides what “fittest” means.',
      params: { food: 12 },
      duration: 16,
    },
    {
      title: 'Predators appear',
      text: 'Creatures that are 20% bigger can now eat smaller ones. An <b>arms race</b> begins: being big protects you and feeds you, but costs a lot to maintain.',
      params: { food: 30, pred: true },
      duration: 16,
    },
    {
      title: 'Play god',
      text: 'Change the food supply and mutation rate, toggle predation, or click to drop food. Restart for a fresh random population.',
      params: { pred: false, food: 35 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let crit = [], food = [], acc = 0, gen = 0, births = 0, deaths = 0;
    const mS = new Series(400), mZ = new Series(400), mR = new Series(400), pop = new Series(400);
    const hash = new SpatialHash(40);

    function make(g, x, y) {
      return { x: x ?? rand(api.w), y: y ?? rand(api.h), a: rand(TAU), e: 60, g, gen: 0, wob: rand(TAU), age: 0 };
    }
    function init() {
      crit = [];
      food = [];
      for (let i = 0; i < 40; i++) crit.push(make({ speed: rand(0.6, 1.4), size: rand(0.7, 1.3), sense: rand(0.6, 1.4) }));
      for (let i = 0; i < 80; i++) food.push({ x: rand(api.w), y: rand(api.h) });
      [mS, mZ, mR, pop].forEach((s) => s.clear());
      gen = births = deaths = 0;
    }
    const mutate = (v) => clamp(v * (1 + randn() * params.mut), 0.25, 3);

    return {
      init,
      resize() {
        if (!crit.length) init();
      },
      reset: init,
      pointerDown(p) {
        for (let i = 0; i < 12; i++) food.push({ x: p.x + randn() * 20, y: p.y + randn() * 20 });
      },
      update(dt) {
        const { w, h } = api;
        acc += params.food * dt;
        while (acc > 1 && food.length < 600) {
          acc--;
          food.push({ x: rand(w), y: rand(h) });
        }
        hash.clear();
        for (const f of food) hash.insert(f);
        const near = [];
        const born = [];
        for (const c of crit) {
          const { speed, size, sense } = c.g;
          const R = 6 * size;
          const sr = 40 + 50 * sense;
          c.age += dt;
          // seek nearest food, or prey, else wander
          let tx = null, ty = null, bd = sr * sr;
          hash.query(c.x, c.y, sr, near);
          for (const f of near) {
            if (f.eaten) continue;
            const d = (f.x - c.x) ** 2 + (f.y - c.y) ** 2;
            if (d < bd) (bd = d), (tx = f.x), (ty = f.y);
          }
          if (params.pred) {
            for (const o of crit) {
              if (o === c || o.dead || o.g.size * 1.2 > size) continue;
              const d = (o.x - c.x) ** 2 + (o.y - c.y) ** 2;
              if (d < bd) (bd = d), (tx = o.x), (ty = o.y);
            }
          }
          if (tx !== null) {
            const ta = Math.atan2(ty - c.y, tx - c.x);
            let da = ((ta - c.a + Math.PI * 3) % TAU) - Math.PI;
            c.a += clamp(da, -6 * dt, 6 * dt);
          } else c.a += randn() * dt * 3;
          const v = 55 * speed;
          c.x += Math.cos(c.a) * v * dt;
          c.y += Math.sin(c.a) * v * dt;
          if (c.x < R || c.x > w - R) (c.a = Math.PI - c.a), (c.x = clamp(c.x, R, w - R));
          if (c.y < R || c.y > h - R) (c.a = -c.a), (c.y = clamp(c.y, R, h - R));
          c.wob += dt * (4 + speed * 6);
          // energy budget
          c.e -= dt * (1.4 * size ** 3 * speed ** 2 + 0.9 * sense + 0.6);
          for (const f of near) {
            if (!f.eaten && (f.x - c.x) ** 2 + (f.y - c.y) ** 2 < (R + 3) ** 2) {
              f.eaten = true;
              c.e += 14;
            }
          }
          if (params.pred) {
            for (const o of crit) {
              if (o === c || o.dead || c.dead || o.g.size * 1.2 > size) continue;
              if ((o.x - c.x) ** 2 + (o.y - c.y) ** 2 < R * R) {
                o.dead = true;
                c.e += 30 + o.e * 0.5;
                deaths++;
              }
            }
          }
          if (c.e <= 0) {
            c.dead = true;
            deaths++;
          } else if (c.e > 120) {
            c.e = 60;
            const g = { speed: mutate(speed), size: mutate(size), sense: mutate(sense) };
            const child = make(g, c.x, c.y);
            child.gen = c.gen + 1;
            gen = Math.max(gen, child.gen);
            born.push(child);
            births++;
          }
        }
        food = food.filter((f) => !f.eaten);
        crit = crit.filter((c) => !c.dead).concat(born);
        if (crit.length > 400) crit.length = 400;
        if (crit.length === 0) init();
        if (api.frame % 4 === 0) {
          const n = crit.length || 1;
          mS.push(crit.reduce((s, c) => s + c.g.speed, 0) / n);
          mZ.push(crit.reduce((s, c) => s + c.g.size, 0) / n);
          mR.push(crit.reduce((s, c) => s + c.g.sense, 0) / n);
          pop.push(crit.length);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0b1a14', edge: '#030806' });
        ctx.globalCompositeOperation = 'lighter';
        for (const f of food) drawGlow(ctx, f.x, f.y, 7, '#a3e635', 0.3);
        ctx.globalCompositeOperation = 'source-over';
        for (const c of crit) {
          const { speed, size, sense } = c.g;
          const R = 6 * size;
          const hue = clamp(220 - (speed - 0.5) * 150, 0, 240);
          if (params.sense) {
            ctx.strokeStyle = `hsla(${hue},80%,60%,0.18)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(c.x, c.y, 40 + 50 * sense, 0, TAU);
            ctx.stroke();
          }
          // blobby body with a wobbling outline
          ctx.fillStyle = `hsl(${hue},85%,${50 + clamp(c.e / 120, 0, 1) * 15}%)`;
          ctx.beginPath();
          for (let i = 0; i <= 12; i++) {
            const a = (i / 12) * TAU;
            const r = R * (1 + 0.1 * Math.sin(a * 3 + c.wob));
            const x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.fill();
          // eyes look where it's going
          const ex = Math.cos(c.a) * R * 0.45, ey = Math.sin(c.a) * R * 0.45;
          const px = -Math.sin(c.a) * R * 0.32, py = Math.cos(c.a) * R * 0.32;
          ctx.fillStyle = '#fff';
          for (const s of [1, -1]) {
            ctx.beginPath();
            ctx.arc(c.x + ex + px * s, c.y + ey + py * s, Math.max(1.4, R * 0.2), 0, TAU);
            ctx.fill();
          }
          ctx.fillStyle = '#05070f';
          for (const s of [1, -1]) {
            ctx.beginPath();
            ctx.arc(c.x + ex * 1.15 + px * s, c.y + ey * 1.15 + py * s, Math.max(0.7, R * 0.1), 0, TAU);
            ctx.fill();
          }
        }
      },
      stats() {
        const n = crit.length || 1;
        return [
          { label: 'Population', value: String(crit.length) },
          { label: 'Generations', value: String(gen) },
          { label: 'Avg speed', value: (crit.reduce((s, c) => s + c.g.speed, 0) / n).toFixed(2), color: '#ff6b6b' },
          { label: 'Avg size', value: (crit.reduce((s, c) => s + c.g.size, 0) / n).toFixed(2), color: C.amber },
          { label: 'Avg sense', value: (crit.reduce((s, c) => s + c.g.sense, 0) / n).toFixed(2), color: C.cyan },
          { label: 'Births / deaths', value: `${births} / ${deaths}` },
        ];
      },
      charts() {
        return [
          {
            title: 'Average genes over time',
            series: [
              { data: mS.data, color: '#ff6b6b', label: 'speed', fill: false },
              { data: mZ.data, color: '#ffb547', label: 'size', fill: false },
              { data: mR.data, color: '#38d6f5', label: 'sense', fill: false },
            ],
            min: 0.3,
            max: 2.2,
            length: 400,
          },
          { title: 'Population', series: [{ data: pop.data, color: '#a3e635' }], min: 0, length: 400 },
        ];
      },
    };
  },
};
