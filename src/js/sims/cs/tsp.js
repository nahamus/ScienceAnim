import { C, TAU, backdrop, tag, Series, drawGlow, seeded } from '../../core/util.js';

const fact = (n) => {
  // (n-1)!/2 as a readable string
  let lg = 0;
  for (let i = 2; i < n; i++) lg += Math.log10(i);
  lg -= Math.log10(2);
  if (lg < 9) return Math.round(10 ** lg).toLocaleString();
  return `about 10^${Math.floor(lg)}`;
};

export default {
  id: 'tsp',
  title: 'The Travelling Salesperson',
  category: 'cs',
  tagline: 'The shortest route through every city — easy to state, fiendishly hard to solve.',
  ages: ['14-16', '16+'],
  topics: ['Algorithms', 'Optimisation'],
  blurb:
    'Visit every city once and return home by the shortest route. Delivery firms, circuit-board drills and DNA sequencing all face this problem. Checking every possible route is hopeless — 60 cities have more routes than atoms in the universe — so computer scientists use clever shortcuts that find excellent routes fast.',
  ideas: [
    'The number of possible routes grows <b>factorially</b>: 10 cities have 181,440; 60 have about 10⁸⁰.',
    '<b>Greedy</b>: always go to the nearest unvisited city. Fast, but leaves ugly detours.',
    '<b>2-opt</b>: whenever two path segments cross, reverse the section between them. Crossings always waste distance.',
    '<b>Simulated annealing</b>: accept some worse moves early (high “temperature”), to escape traps, then cool down.',
  ],
  hint: 'Click to add a city',
  thumbChapter: 3,
  thumbFrames: 300,
  params: [
    { key: 'n', label: 'Cities', type: 'range', min: 6, max: 150, step: 1, value: 12, instant: true },
    { key: 'algo', label: 'Method', type: 'select', value: 'greedy', options: [{ value: 'random', label: 'Random route' }, { value: 'greedy', label: 'Greedy' }, { value: '2opt', label: '2-opt' }, { value: 'anneal', label: 'Annealing' }] },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.2, max: 4, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'solve', label: 'Run', type: 'button', action: (s) => s.run() },
    { key: 'cities', label: 'New cities', type: 'button', action: (s) => s.cities() },
  ],
  story: [
    {
      title: 'The problem',
      text: 'A salesperson must visit 12 cities and return home. This random route wanders all over the map. With 12 cities there are already <b>almost 20 million</b> different routes to choose from.',
      params: { n: 12, algo: 'random', speed: 1 },
      enter: (s) => {
        s.cities(5);
        s.run();
      },
      duration: 11,
    },
    {
      title: 'Greedy: nearest city next',
      text: 'A natural idea: from each city go to the <b>closest</b> one you have not visited. It builds a decent route quickly — but near the end it is forced into long jumps back across the map.',
      params: { n: 12, algo: 'greedy' },
      enter: (s) => {
        s.cities(5);
        s.run();
      },
      duration: 12,
    },
    {
      title: 'Untangle the crossings',
      text: '2-opt looks for two route segments that <b>cross</b>. Reversing the stretch between them always makes the route shorter. Repeat until no crossing — or any other improving swap — remains.',
      params: { n: 40, algo: '2opt', speed: 1 },
      enter: (s) => {
        s.cities(9, true);
        s.run();
      },
      duration: 15,
    },
    {
      title: 'Simulated annealing',
      text: 'Borrowed from metalworking: start “hot”, accepting even worse routes now and then so you can escape dead ends, then slowly cool until only improvements are accepted. Here with 120 cities — a route count with 196 digits.',
      params: { n: 120, algo: 'anneal', speed: 1.5 },
      enter: (s) => {
        s.cities(21);
        s.run();
      },
      duration: 18,
    },
    {
      title: 'Plan your own tour',
      text: 'Click to add cities, choose a method and press Run. Try greedy first, then 2-opt on the result — real solvers chain several tricks like this.',
      params: { n: 30, algo: 'greedy', speed: 1 },
      enter: (s) => {
        s.cities();
        s.run();
      },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let pts = [], tour = [], state = null, best = Infinity, T = 0, accepted = 0, pulse = 0;
    const sLen = new Series(300);

    let boxCache = null, boxKey = '';
    const box = () => {
      const { w, h } = api;
      const k = w + 'x' + h;
      if (k !== boxKey) {
        boxKey = k;
        boxCache = { x: 40, y: 86, w: w - 80, h: Math.max(100, h - 86 - (h > 600 ? 50 : 24)) };
      }
      return boxCache;
    };
    const P = (i) => {
      const b = box();
      return [b.x + pts[i].x * b.w, b.y + pts[i].y * b.h];
    };
    const d = (a, b) => {
      const b0 = box();
      return Math.hypot((pts[a].x - pts[b].x) * b0.w, (pts[a].y - pts[b].y) * b0.h);
    };
    const length = (t = tour) => {
      let s = 0;
      for (let i = 0; i < t.length; i++) s += d(t[i], t[(i + 1) % t.length]);
      return s;
    };

    function cities(seed, keepTour) {
      const r = seed !== undefined ? seeded(seed) : Math.random;
      const n = Math.round(params.n);
      pts = [];
      for (let i = 0; i < n; i++) pts.push({ x: 0.04 + r() * 0.92, y: 0.04 + r() * 0.92 });
      tour = pts.map((_, i) => i);
      if (!keepTour) state = null;
      else {
        // shuffle so 2-opt has crossings to fix
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(r() * (i + 1));
          [tour[i], tour[j]] = [tour[j], tour[i]];
        }
      }
      best = Infinity;
      sLen.clear();
    }

    function run() {
      const n = pts.length;
      const algo = params.algo;
      if (algo === 'random') {
        tour = pts.map((_, i) => i);
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [tour[i], tour[j]] = [tour[j], tour[i]];
        }
        state = { done: true };
      } else if (algo === 'greedy') {
        state = { type: 'greedy', built: [0], left: new Set(pts.map((_, i) => i).filter((i) => i)), acc: 0 };
        tour = [0];
      } else if (algo === '2opt') {
        if (tour.length !== n) tour = pts.map((_, i) => i);
        state = { type: '2opt', i: 0, acc: 0, improved: false, lastSwap: null };
      } else {
        if (tour.length !== n) tour = pts.map((_, i) => i);
        const L = length();
        T = (L / n) * 1.2;
        state = { type: 'anneal', cool: 0 };
        best = L;
      }
      sLen.clear();
    }

    function twoOptPass(budget) {
      const n = tour.length;
      while (budget-- > 0) {
        const i = state.i;
        for (let j = i + 2; j < n - (i === 0 ? 1 : 0); j++) {
          const a = tour[i], b = tour[i + 1], c = tour[j], e = tour[(j + 1) % n];
          const delta = d(a, c) + d(b, e) - d(a, b) - d(c, e);
          if (delta < -1e-6) {
            reverse(i + 1, j);
            state.improved = true;
            state.lastSwap = [a, b, c, e];
            pulse = 1;
            return true;
          }
        }
        state.i++;
        if (state.i >= n - 2) {
          if (!state.improved) {
            state.done = true;
            return false;
          }
          state.i = 0;
          state.improved = false;
        }
      }
      return false;
    }
    function reverse(i, j) {
      while (i < j) {
        [tour[i], tour[j]] = [tour[j], tour[i]];
        i++;
        j--;
      }
    }

    cities(5);
    run();

    return {
      cities: (seed, keep) => cities(seed, keep),
      run,
      reset: () => {
        cities();
        run();
      },
      onParam(k) {
        if (k === 'n') {
          cities();
          run();
        }
      },
      pointerDown(p) {
        const b = box();
        const x = (p.x - b.x) / b.w, y = (p.y - b.y) / b.h;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        pts.push({ x, y });
        if (state?.type === 'greedy' && !state.done) state.left.add(pts.length - 1);
        else {
          // insert the new city where it adds the least distance
          const k = pts.length - 1;
          let bi = 0, bd = Infinity;
          for (let i = 0; i < tour.length; i++) {
            const a = tour[i], c = tour[(i + 1) % tour.length];
            const cost = d(a, k) + d(k, c) - d(a, c);
            if (cost < bd) (bd = cost), (bi = i + 1);
          }
          tour.splice(bi, 0, k);
        }
      },
      update(dt) {
        pulse = Math.max(0, pulse - dt * 3);
        if (!state || state.done) return;
        if (state.type === 'greedy') {
          state.acc += dt * params.speed * Math.max(4, pts.length / 3);
          while (state.acc >= 1 && state.left.size) {
            state.acc -= 1;
            const cur = state.built[state.built.length - 1];
            let bi = -1, bd = Infinity;
            for (const j of state.left) {
              const dd = d(cur, j);
              if (dd < bd) (bd = dd), (bi = j);
            }
            state.left.delete(bi);
            state.built.push(bi);
          }
          tour = state.built.slice();
          if (!state.left.size) state.done = true;
        } else if (state.type === '2opt') {
          state.acc += dt * params.speed * 8;
          while (state.acc >= 1 && !state.done) {
            state.acc -= 1;
            twoOptPass(40);
          }
        } else if (state.type === 'anneal') {
          const n = tour.length;
          let cur = length();
          const tries = Math.round(1500 * params.speed);
          accepted = 0;
          for (let k = 0; k < tries; k++) {
            let i = 1 + Math.floor(Math.random() * (n - 1)), j = 1 + Math.floor(Math.random() * (n - 1));
            if (i === j) continue;
            if (i > j) [i, j] = [j, i];
            const a = tour[i - 1], b = tour[i], c = tour[j], e = tour[(j + 1) % n];
            const delta = d(a, c) + d(b, e) - d(a, b) - d(c, e);
            if (delta < 0 || Math.random() < Math.exp(-delta / T)) {
              reverse(i, j);
              cur += delta;
              accepted++;
            }
          }
          best = Math.min(best, cur);
          T *= Math.pow(0.9965, params.speed * 1.5);
          if (T < 0.02) state.done = true;
        }
        if (api.frame % 2 === 0) sLen.push(length());
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0d0f22' });
        const n = tour.length;
        if (n > 1) {
          const closed = !(state?.type === 'greedy' && !state.done);
          ctx.strokeStyle = state?.type === 'anneal' && !state.done ? `hsla(${20 + 180 * Math.min(1, 0.05 / T)},90%,62%,0.9)` : C.cyan;
          ctx.lineWidth = 2;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (let i = 0; i < n; i++) ctx[i ? 'lineTo' : 'moveTo'](...P(tour[i]));
          if (closed) ctx.closePath();
          ctx.stroke();
          if (state?.lastSwap && pulse > 0) {
            const [a, b, c, e] = state.lastSwap;
            ctx.strokeStyle = `rgba(255,95,162,${pulse})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(...P(a));
            ctx.lineTo(...P(c));
            ctx.moveTo(...P(b));
            ctx.lineTo(...P(e));
            ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < pts.length; i++) {
          const [x, y] = P(i);
          drawGlow(ctx, x, y, i === tour[0] ? 22 : 12, i === tour[0] ? '#ffb547' : '#9be4ff', 0.3);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < pts.length; i++) {
          const [x, y] = P(i);
          ctx.beginPath();
          ctx.arc(x, y, 2.6, 0, TAU);
          ctx.fill();
        }
        if (state?.type === 'greedy' && !state.done && tour.length) {
          const [x, y] = P(tour[tour.length - 1]);
          ctx.strokeStyle = C.amber;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, TAU);
          ctx.stroke();
        }
        if (!api.thumbnail) {
          const label = { random: 'random route', greedy: 'greedy', '2opt': '2-opt', anneal: `annealing · temperature ${T.toFixed(2)}` }[params.algo];
          tag(ctx, `${label}${state?.done ? ' · done' : ''}  ·  length ${length().toFixed(0)} px`, w - 18, 84, state?.done ? C.teal : C.ink, { align: 'right', size: 11 });
        }
      },
      stats() {
        return [
          { label: 'Cities', value: String(pts.length) },
          { label: 'Possible routes', value: fact(pts.length) },
          { label: 'Route length', value: length().toFixed(0) + ' px', color: C.cyan },
          { label: 'Status', value: state?.done ? 'finished' : params.algo === 'anneal' ? `accepting ${accepted}/frame` : 'working…' },
        ];
      },
      charts() {
        return [{ title: 'Route length over time', series: [{ data: sLen.data, color: C.cyan }] }];
      },
    };
  },
};
