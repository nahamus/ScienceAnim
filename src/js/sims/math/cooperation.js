import { C, TAU, clamp, roundRect, tag, text } from '../../core/util.js';

// The evolution of cooperation.
// Evolve: the iterated prisoner's dilemma (Axelrod 1980). Payoffs R = 3, T = 5, P = 1, S = 0. Each pair of
// strategies plays matches of 50 rounds, where every move has a chance of coming out wrong (noise). Average
// payoffs fill a table A[i][j]; population shares then follow the replicator equation x_i ← x_i f_i / f̄
// with a whisper of mutation.
// Grid: Nowak & May (1992). Each cell cooperates or defects, plays its 8 neighbours and itself once
// (C–C pays 1, D against C pays b, everything else 0), then copies the best scorer around it.

const R = 3, T = 5, P = 1, S = 0;
const ROUNDS = 50;
const STRATS = [
  { id: 'allc', name: 'Always cooperate', col: '#2ee6a6' },
  { id: 'alld', name: 'Always defect', col: '#ff4d6d' },
  { id: 'tft', name: 'Tit for tat', col: '#ffb547' },
  { id: 'grudge', name: 'Grudger', col: '#a78bfa' },
  { id: 'rand', name: 'Random', col: '#9aa3b5' },
  { id: 'pavlov', name: 'Win-stay, lose-shift', col: '#38d6f5' },
  { id: 'gtft', name: 'Generous tit for tat', col: '#a3e635' },
];
const NS = STRATS.length;
// a starting crowd with plenty of naive players for cheats to exploit
const START = [0.24, 0.12, 0.08, 0.08, 0.26, 0.11, 0.11];

/** Next move (true = cooperate) for strategy k, given my and their history. */
function move(k, mine, theirs, rnd, state) {
  const n = theirs.length;
  switch (STRATS[k].id) {
    case 'allc':
      return true;
    case 'alld':
      return false;
    case 'tft':
      return n === 0 ? true : theirs[n - 1];
    case 'grudge':
      if (n && !theirs[n - 1]) state.mad = true;
      return !state.mad;
    case 'rand':
      return rnd() < 0.5;
    case 'pavlov': {
      if (n === 0) return true;
      const won = theirs[n - 1]; // R or T: they cooperated
      return won ? mine[n - 1] : !mine[n - 1];
    }
    case 'gtft':
      return n === 0 ? true : theirs[n - 1] || rnd() < 1 / 3;
  }
  return true;
}
function play(a, b, noise, rnd) {
  const ma = [], mb = [], sa = {}, sb = {};
  let pa = 0, pb = 0;
  for (let r = 0; r < ROUNDS; r++) {
    let x = move(a, ma, mb, rnd, sa), y = move(b, mb, ma, rnd, sb);
    if (rnd() < noise) x = !x;
    if (rnd() < noise) y = !y;
    ma.push(x);
    mb.push(y);
    pa += x ? (y ? R : S) : y ? T : P;
    pb += y ? (x ? R : S) : x ? T : P;
  }
  return { pa: pa / ROUNDS, pb: pb / ROUNDS, ma, mb };
}
function seeded(s) {
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function table(noise) {
  const rnd = seeded(42);
  const A = Array.from({ length: NS }, () => new Array(NS).fill(0));
  const M = 40;
  for (let i = 0; i < NS; i++)
    for (let j = i; j < NS; j++) {
      let si = 0, sj = 0;
      for (let m = 0; m < M; m++) {
        const r = play(i, j, noise, rnd);
        si += r.pa;
        sj += r.pb;
      }
      A[i][j] = si / M;
      A[j][i] = sj / M;
    }
  return A;
}

const GN = 75; // spatial grid size

export default {
  id: 'cooperation',
  title: 'The Evolution of Cooperation',
  category: 'math',
  tagline: 'Cheating pays in the short run. So why is the world full of cooperation?',
  ages: ['14-16', '16+'],
  topics: ['Game theory', 'Complex systems', 'Evolution'],
  keywords: ['prisoner\'s dilemma', 'game theory', 'tit for tat', 'Axelrod', 'cooperation', 'evolution', 'replicator dynamics', 'Nowak May', 'spatial game', 'Nash equilibrium', 'altruism', 'reciprocity'],
  blurb:
    'Two players can each cooperate or cheat. Cheating always earns you more in a single game, yet if both cheat, both do badly. This is the prisoner’s dilemma, and it hides inside everything from bacteria sharing food to countries cutting emissions. Let strategies compete and evolve, and watch cooperation win, as long as players meet again or live near each other.',
  ideas: [
    'In a <b>single</b> game, defecting earns more whatever the other player does, so “rational” players both defect and both lose out.',
    'When the same players meet <b>again and again</b>, being nice but retaliating pays: <b>tit for tat</b> famously won Robert Axelrod’s 1980 tournaments.',
    'Under evolution, cheaters thrive at first by exploiting the naive, then run out of victims.',
    'In a noisy world, a little <b>forgiveness</b> stops endless feuds.',
    'When players only meet <b>neighbours</b>, clusters of cooperators can protect each other, even without memory.',
  ],
  hint: 'Change the noise, or switch to the grid',
  thumbChapter: 6,
  thumbFrames: 240,
  params: [
    {
      key: 'scene', label: 'Scene', type: 'select', value: 'evolve', instant: true,
      options: [{ value: 'evolve', label: 'Strategies evolving' }, { value: 'grid', label: 'Neighbours on a grid' }],
    },
    { key: 'noise', label: 'Mistakes (each move)', type: 'range', min: 0, max: 0.15, step: 0.01, value: 0, instant: true, format: (v) => Math.round(v * 100) + ' %' },
    { key: 'b', label: 'Temptation to cheat (grid)', type: 'range', min: 1.05, max: 2.6, step: 0.01, value: 1.85, instant: true, format: (v) => v.toFixed(2) + '×' },
    { key: 'speed', label: 'Generations per second', type: 'range', min: 0.5, max: 8, step: 0.5, value: 2 },
    { key: 'matrix', label: 'Show the payoff table', type: 'toggle', value: false },
    { key: 'restart', label: 'Restart', type: 'button', action: (s) => s.restart() },
    { key: 'scatter', label: 'Scatter cheats on the grid', type: 'button', action: (s) => s.scatter() },
  ],
  story: [
    {
      title: 'The dilemma',
      text: 'Two players choose, at the same time, to <b>cooperate</b> or <b>defect</b>. Both cooperate: 3 points each. Both defect: 1 each. One defects while the other cooperates: the cheat gets 5, the sucker 0. If they cooperate, defecting earns you 5 instead of 3; if they defect, it earns you 1 instead of 0. So defecting always pays more for you, yet two defectors end up worse off than two cooperators. That is the dilemma.',
      params: { scene: 'evolve', noise: 0, matrix: true, speed: 0.5 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Meeting again and again',
      text: 'Now players meet for 50 rounds and remember what happened. In 1980 Robert Axelrod invited experts to send in strategies and played them all against each other. The winner was the simplest: <b>tit for tat</b>. Cooperate first, then copy whatever your partner did last time. The strip shows tit for tat against always-defect: it gets cheated once, then never again.',
      params: { scene: 'evolve', noise: 0, matrix: false, speed: 0.5 },
      enter: (s) => s.showMatch(2, 1),
      duration: 15,
    },
    {
      title: 'Let them evolve',
      text: 'Now let the strategies breed: each generation, a strategy’s share grows in proportion to how many points it scores against the current crowd. Always-defect booms at first by exploiting the always-cooperators and random players. But as its victims vanish, cheats mostly meet each other or retaliators, and they die out.',
      check: {
        q: 'Always-defect starts out by exploiting the naive players. What happens to it in the long run?',
        options: ['It dies out once its victims are gone', 'It takes over completely', 'It settles at about half the population'],
        answer: 0,
        setup: { scene: 'evolve', noise: 0, matrix: false, speed: 2 },
        explain: 'Cheats need suckers. As always-cooperate and random players vanish, cheats mostly meet other cheats (1 point a round) or retaliators who cooperate only with cooperators (3 points a round between them), so they fall behind.',
      },
      params: { scene: 'evolve', noise: 0, matrix: false, speed: 2 },
      enter: (s) => {
        s.restart();
        s.showMatch(1, 0);
      },
      duration: 18,
    },
    {
      title: 'A noisy world',
      text: 'Real life has misunderstandings. Let 5 % of moves come out wrong. One mistake sets two tit-for-tat players off on an endless echo of revenge. Strategies that forgive, like generous tit for tat (which lets a third of defections go), or that patch things up, like win-stay lose-shift, now do best.',
      check: {
        q: 'With mistakes in the game, which do you think will end up most common?',
        options: ['A strategy that sometimes forgives', 'Strict tit for tat', 'Always defect'],
        answer: 0,
        setup: { scene: 'evolve', noise: 0.05, matrix: false, speed: 2 },
        explain: 'After one accidental defection, two tit-for-tat players keep punishing each other in turn. A forgiving strategy breaks the cycle and gets back to earning 3 points a round, so it outscores the strict one.',
      },
      params: { scene: 'evolve', noise: 0.05, matrix: false, speed: 2 },
      enter: (s) => {
        s.restart();
        s.showMatch(2, 2);
      },
      duration: 18,
    },
    {
      title: 'Neighbours',
      text: 'Now forget memory. Each square plays only its neighbours, once, then copies whichever neighbour scored best. Blue squares cooperate, red ones defect. Defecting next to cooperators pays well, but a block of cooperators earns a lot from each other, enough to hold its ground. Here the cheat starts as a single square in the middle.',
      params: { scene: 'grid', b: 1.85, speed: 4, matrix: false },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'A kaleidoscope of cheats',
      text: 'With the temptation set just right, the single cheat grows into an ever-changing pattern: green squares just switched to cooperating, yellow ones just started cheating. Neither side ever wins, and about a third of the squares keep cooperating forever, even though every single game rewards cheating. Lower the temptation and cooperators hold firm; raise it and cheats spread further.',
      params: { scene: 'grid', b: 1.85, speed: 6, matrix: false },
      duration: 18,
    },
    {
      title: 'Your turn',
      text: 'Try different amounts of noise and see which strategy wins. On the grid, scatter cheats at random and change the temptation.',
      params: { scene: 'evolve', noise: 0.02, b: 1.7, speed: 2, matrix: false },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let A = table(params.noise), Anoise = params.noise;
    let x = [...START], gen = 0, acc = 0;
    let hist = [];
    const NA = 140;
    const agents = Array.from({ length: NA }, (_, i) => ({ s: i % NS, from: i % NS, t: 1 }));
    let match = { a: 2, b: 1, res: null, t: 0, auto: false };
    // grid
    let G = new Uint8Array(GN * GN), Gp = new Uint8Array(GN * GN), score = new Float32Array(GN * GN), ggen = 0;

    function ensureTable() {
      if (Anoise !== params.noise) {
        A = table(params.noise);
        Anoise = params.noise;
        match.res = null;
      }
    }
    function fitness() {
      return x.map((_, i) => x.reduce((s, xj, j) => s + xj * A[i][j], 0));
    }
    function assignAgents() {
      // keep the dots matching the shares, changing as few as possible
      const want = x.map((v) => v * NA), cnt = new Array(NS).fill(0);
      agents.forEach((a) => cnt[a.s]++);
      const target = want.map(Math.floor);
      let left = NA - target.reduce((a, b) => a + b, 0);
      want.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => {
        if (left > 0) {
          target[i]++;
          left--;
        }
      });
      for (const a of agents) {
        if (cnt[a.s] > target[a.s]) {
          const to = target.findIndex((t, i) => cnt[i] < t);
          if (to < 0) break;
          cnt[a.s]--;
          cnt[to]++;
          a.from = a.s;
          a.s = to;
          a.t = 0;
        }
      }
    }
    function generation() {
      const f = fitness();
      const fbar = x.reduce((s, v, i) => s + v * f[i], 0);
      const mu = 0.0005;
      x = x.map((v, i) => (v * f[i]) / fbar);
      x = x.map((v) => v * (1 - mu) + mu / NS);
      gen++;
      hist.push([...x]);
      if (hist.length > 160) hist.shift();
      assignAgents();
    }

    function gridRestart(scatter) {
      G.fill(0);
      if (scatter) for (let i = 0; i < G.length; i++) G[i] = Math.random() < 0.1 ? 1 : 0;
      else G[((GN / 2) | 0) * GN + ((GN / 2) | 0)] = 1;
      Gp.set(G);
      ggen = 0;
    }
    function gridStep() {
      const b = params.b;
      for (let y = 0; y < GN; y++)
        for (let xx = 0; xx < GN; xx++) {
          let s = 0;
          const me = G[y * GN + xx];
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const o = G[((y + dy + GN) % GN) * GN + ((xx + dx + GN) % GN)];
              if (o === 0) s += me === 0 ? 1 : b;
            }
          score[y * GN + xx] = s;
        }
      Gp.set(G);
      const N = new Uint8Array(G.length);
      for (let y = 0; y < GN; y++)
        for (let xx = 0; xx < GN; xx++) {
          let best = score[y * GN + xx], bs = G[y * GN + xx];
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const k = ((y + dy + GN) % GN) * GN + ((xx + dx + GN) % GN);
              if (score[k] > best) {
                best = score[k];
                bs = G[k];
              }
            }
          N[y * GN + xx] = bs;
        }
      G = N;
      ggen++;
    }

    function restart() {
      ensureTable();
      x = [...START];
      gen = 0;
      acc = 0;
      hist = [[...x]];
      agents.forEach((a, i) => {
        a.s = a.from = i % NS;
        a.t = 1;
      });
      assignAgents();
      agents.forEach((a) => (a.t = 1));
      gridRestart(false);
    }
    restart();

    const layout = () => {
      const { w, h } = api;
      const phone = w < 760;
      if (phone) return { phone, ax: 16, ay: 60, aw: w - 32, ah: h * 0.3, cx: 16, cy: 60 + h * 0.3 + 12, cw: w - 32, ch: h * 0.22 };
      return { phone, ax: 24, ay: 110, aw: w * 0.44, ah: h * 0.44, cx: w * 0.5, cy: 110, cw: w * 0.5 - 20, ch: h - 110 - 24 };
    };

    function drawAgents(L) {
      const cols = Math.ceil(Math.sqrt((NA * L.aw) / L.ah));
      const rows = Math.ceil(NA / cols);
      const cell = Math.min(L.aw / cols, (L.ah - 60) / rows);
      const r = cell * 0.36;
      agents.forEach((a, i) => {
        const X = L.ax + (i % cols) * cell + cell / 2, Y = L.ay + 50 + Math.floor(i / cols) * cell + cell / 2;
        ctx.fillStyle = a.t < 1 && a.t * 3 % 1 < 0.5 ? STRATS[a.from].col : STRATS[a.s].col;
        ctx.beginPath();
        ctx.arc(X, Y, r, 0, TAU);
        ctx.fill();
      });
    }
    function drawMatch(L) {
      if (!match.res) {
        const rnd = seeded(7);
        match.res = play(match.a, match.b, params.noise, rnd);
      }
      const n = Math.min(ROUNDS, 20);
      const shown = Math.min(n, Math.floor(match.t * 3) + 1);
      const X0 = L.ax, W = L.aw, Y0 = L.ay;
      const sz = Math.min(16, (W - 150) / n - 2);
      [[match.a, match.res.ma], [match.b, match.res.mb]].forEach(([k, moves], row) => {
        const y = Y0 + 8 + row * (sz + 6);
        text(ctx, STRATS[k].name, X0, y + sz / 2, { size: 11, weight: 600, color: STRATS[k].col });
        for (let i = 0; i < shown; i++) {
          ctx.fillStyle = moves[i] ? 'rgba(46,230,166,0.9)' : 'rgba(255,77,109,0.9)';
          ctx.fillRect(X0 + 150 + i * (sz + 2), y, sz, sz);
        }
      });
    }

    function drawEvolve() {
      const { w, h } = api;
      const L = layout();
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, w, h);
      if (params.matrix) drawMatrix(L);
      else {
        drawMatch(L);
        drawAgents(L);
      }
      // share chart
      const cx = L.cx, cy = L.cy, cw = L.cw, ch = L.phone ? L.ch : L.ch * 0.55;
      ctx.fillStyle = 'rgba(8,11,24,0.86)';
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      roundRect(ctx, cx, cy, cw, ch, 12);
      ctx.fill();
      ctx.stroke();
      text(ctx, 'Share of the population', cx + 12, cy + 15, { size: 11, weight: 600, color: C.dim });
      text(ctx, `generation ${gen}`, cx + cw - 12, cy + 15, { size: 10, align: 'right', color: C.amber, mono: true });
      const x0 = cx + 12, x1 = cx + cw - 12, y0 = cy + 28, y1 = cy + ch - 10;
      const span = Math.max(24, hist.length - 1);
      for (let k = 0; k < NS; k++) {
        ctx.strokeStyle = STRATS[k].col;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        hist.forEach((hx, i) => ctx[i ? 'lineTo' : 'moveTo'](x0 + (i / span) * (x1 - x0), y1 - hx[k] * (y1 - y0)));
        ctx.stroke();
      }
      // leaderboard
      const f = fitness();
      const order = [...STRATS.keys()].sort((a, b) => x[b] - x[a]);
      const ly = L.phone ? cy + ch + 10 : cy + ch + 16;
      const rowH = L.phone ? 15 : 22;
      if (!L.phone) text(ctx, 'Strategy · share · points per round', cx + 4, ly, { size: 11, weight: 600, color: C.dim });
      order.forEach((k, i) => {
        const y = ly + (L.phone ? 6 : 18) + i * rowH;
        if (y > h - 12) return;
        const bw = (L.phone ? cw - 150 : cw - 260) * x[k];
        ctx.fillStyle = STRATS[k].col;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(cx + (L.phone ? 130 : 180), y - rowH * 0.32, Math.max(1, bw), rowH * 0.64);
        ctx.globalAlpha = 1;
        text(ctx, STRATS[k].name, cx + 4, y, { size: L.phone ? 10 : 12, color: STRATS[k].col });
        if (!L.phone) text(ctx, `${Math.round(x[k] * 100)} %  ·  ${f[k].toFixed(2)}`, cx + cw - 4, y, { size: 11, align: 'right', color: C.dim, mono: true });
        else text(ctx, `${Math.round(x[k] * 100)}%`, cx + cw - 2, y, { size: 10, align: 'right', color: C.dim, mono: true });
      });
    }
    function drawMatrix(L) {
      const W = Math.min(L.aw, 380), H = Math.min(L.ah, 260);
      const X0 = L.ax + (L.aw - W) / 2, Y0 = L.ay + 10;
      const c = W / 3, r = (H - 40) / 3;
      text(ctx, 'Points: (you, them)', X0, Y0 + 6, { size: 12, weight: 600, color: C.dim });
      const yy = Y0 + 24;
      text(ctx, 'They cooperate', X0 + c * 1.5, yy + r * 0.5, { size: 12, align: 'center', color: C.teal });
      text(ctx, 'They defect', X0 + c * 2.5, yy + r * 0.5, { size: 12, align: 'center', color: C.red });
      text(ctx, 'You cooperate', X0 + c * 0.5, yy + r * 1.5, { size: 12, align: 'center', color: C.teal });
      text(ctx, 'You defect', X0 + c * 0.5, yy + r * 2.5, { size: 12, align: 'center', color: C.red });
      const cells = [[[3, 3], [0, 5]], [[5, 0], [1, 1]]];
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++) {
          const X = X0 + c * (1 + j), Y = yy + r * (1 + i);
          ctx.fillStyle = i === 1 && j === 1 ? 'rgba(255,77,109,0.14)' : i === 0 && j === 0 ? 'rgba(46,230,166,0.14)' : 'rgba(255,255,255,0.05)';
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          roundRect(ctx, X + 3, Y + 3, c - 6, r - 6, 8);
          ctx.fill();
          ctx.stroke();
          const [p, q] = cells[i][j];
          text(ctx, `${p} , ${q}`, X + c / 2, Y + r / 2, { size: 22, weight: 700, align: 'center', mono: true });
        }
    }

    function drawGrid() {
      const { w, h } = api;
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, w, h);
      const phone = w < 760;
      const size = Math.min(phone ? w - 24 : w * 0.56, h - (phone ? 120 : 150));
      const X0 = phone ? (w - size) / 2 : Math.max(250, w * 0.62 - size / 2), Y0 = phone ? 64 : 116;
      const c = size / GN;
      const cols = ['#2f6dff', '#ff4d6d', '#2ee6a6', '#ffd23f']; // C stays C, D stays D, D→C, C→D
      let coop = 0;
      for (let i = 0; i < G.length; i++) {
        const now = G[i], was = Gp[i];
        if (!now) coop++;
        ctx.fillStyle = cols[now === was ? now : now === 0 ? 2 : 3];
        ctx.fillRect(X0 + (i % GN) * c, Y0 + Math.floor(i / GN) * c, c + 0.6, c + 0.6);
      }
      const leg = [['cooperating', cols[0]], ['defecting', cols[1]], ['just switched to cooperating', cols[2]], ['just switched to defecting', cols[3]]];
      if (!phone) {
        leg.forEach(([s, col], i) => {
          ctx.fillStyle = col;
          ctx.fillRect(24, 120 + i * 22, 12, 12);
          text(ctx, s, 42, 126 + i * 22, { size: 11, color: C.dim });
        });
      }
      tag(ctx, `${Math.round((coop / G.length) * 100)} % cooperating · round ${ggen}`, w - 16, phone ? 56 : 84, C.cyan, { align: 'right' });
    }

    return {
      restart,
      reset: restart,
      scatter() {
        gridRestart(true);
      },
      showMatch(a, b) {
        match = { a, b, res: null, t: 0 };
      },
      onParam(k) {
        if (k === 'noise') {
          ensureTable();
          restart();
        }
        if (k === 'scene') restart();
      },
      update(dt) {
        if (params.scene === 'evolve') {
          ensureTable();
          match.t += dt;
          for (const a of agents) a.t = Math.min(1, a.t + dt * 1.2);
          if (!params.matrix) {
            acc += dt * params.speed;
            while (acc >= 1) {
              acc -= 1;
              if (gen < 400) generation();
            }
          }
        } else {
          acc += dt * params.speed;
          while (acc >= 1) {
            acc -= 1;
            gridStep();
          }
        }
      },
      draw() {
        if (params.scene === 'evolve') drawEvolve();
        else drawGrid();
      },
      stats() {
        if (params.scene === 'grid') {
          let coop = 0;
          for (let i = 0; i < G.length; i++) if (!G[i]) coop++;
          return [
            { label: 'Cooperators', value: `${Math.round((coop / G.length) * 100)} %`, color: C.blue },
            { label: 'Temptation b', value: params.b.toFixed(2) },
            { label: 'Round', value: String(ggen) },
          ];
        }
        const best = [...STRATS.keys()].sort((a, b) => x[b] - x[a])[0];
        const fit = fitness();
        const coopRate = x.reduce((s, v, i) => s + v * fit[i], 0);
        return [
          { label: 'Generation', value: String(gen), color: C.amber },
          { label: 'Most common', value: STRATS[best].name, color: STRATS[best].col },
          { label: 'Always-defect share', value: `${Math.round(x[1] * 100)} %`, color: C.red },
          { label: 'Mistakes', value: `${Math.round(params.noise * 100)} %` },
          { label: 'Average points (max 3)', value: clamp(coopRate, 0, 5).toFixed(2) },
        ];
      },
    };
  },
};
