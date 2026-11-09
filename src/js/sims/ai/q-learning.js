import { C, clamp, rgba, text, tag, backdrop, roundRect, arrow, Series, TAU } from '../../core/util.js';

// Tabular Q-learning (Watkins, 1989). The agent keeps a table Q(square, move) of how much total
// future reward it expects. After every step it nudges one entry towards
//   reward + γ · (best Q at the next square),
// so value seeps backwards from the prize one step at a time. Moves are ε-greedy: usually the best
// known move, sometimes a random one to explore. Nothing about the maze is given to the agent.

const MAPS = {
  open: ['..........', '.....X....', '..#....G..', '..#..X....', '..#.......', 'S.#.......', '..........'],
  maze: ['S.#.......', '..#.###.#.', '..#...#.#.', '.####.#.#.', '.X....#.#.', '.######.#.', '........#G'],
  two: ['..........', '..........', '.g..S...G.', '..........', '..........', '..........', '..........'],
  cliff: ['..........', '..........', '..........', 'SXXXXXXXXG'],
};
const REWARD = { G: 10, g: 2, X: -10 };
const STEP = -0.1;
const MOVES = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // up right down left
const SPEED = { slow: 5, normal: 22, fast: 160, turbo: 4000 };
const MAX_STEPS = 250;

export default {
  id: 'q-learning',
  title: 'Learning by Trial and Error',
  category: 'ai',
  tagline: 'A robot learns a maze from nothing but rewards, as value seeps backwards from the prize.',
  ages: ['14-16', '16+'],
  topics: ['Machine learning', 'Algorithms'],
  keywords: ['reinforcement learning', 'q-learning', 'reward', 'agent', 'exploration', 'exploitation', 'epsilon greedy', 'bellman equation', 'discount', 'markov decision process', 'alphago', 'dqn', 'rlhf'],
  blurb:
    'Nobody tells this robot the rules or the way out. It only gets <b>rewards</b>: +10 for the prize, −10 for a trap, and a small cost for every step. Using <b>Q-learning</b>, it keeps a table of how good each move is from each square and improves it after every step. The same idea, with a neural network in place of the table, taught computers to play Atari games, beat the world champion at Go and polish chatbots’ answers.',
  ideas: [
    'The agent learns from <b>rewards</b>, not from examples of the right answer.',
    'Q(square, move) estimates the total future reward; each step nudges it towards <b>reward + γ · best next Q</b>.',
    'Value spreads <b>backwards</b> from the prize, one square per visit.',
    'It must balance <b>exploring</b> (random moves, ε) against <b>exploiting</b> what it already knows.',
    'The discount γ sets how much it cares about rewards far in the future.',
  ],
  hint: 'Tap squares to add or remove walls',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 360,
  params: [
    { key: 'maze', label: 'World', type: 'select', value: 'open', options: [{ value: 'open', label: 'Room' }, { value: 'maze', label: 'Maze' }, { value: 'two', label: 'Two prizes' }, { value: 'cliff', label: 'Cliff' }] },
    { key: 'speed', label: 'Speed', type: 'select', value: 'normal', options: [{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }, { value: 'turbo', label: 'Turbo' }] },
    { key: 'epsilon', label: 'Exploration ε (random moves)', type: 'range', min: 0, max: 0.6, step: 0.01, value: 0.15 },
    { key: 'alpha', label: 'Learning rate α', type: 'range', min: 0.05, max: 1, step: 0.05, value: 0.5 },
    { key: 'gamma', label: 'Discount γ (patience)', type: 'range', min: 0.5, max: 0.99, step: 0.01, value: 0.95 },
    { key: 'qvals', label: 'Show the value of every move', type: 'toggle', value: false },
    { key: 'forget', label: 'Wipe its memory', type: 'button', action: (sim) => sim.forget() },
  ],
  story: [
    {
      title: 'Learning from rewards',
      text: 'The robot knows nothing: not where the prize is, not what walls or traps are. It only receives <b>rewards</b>: <b>+10</b> at the star, <b>−10</b> in a red trap, and <b>−0.1</b> for every step, so dawdling costs. At first it can only stumble around at random.',
      params: { maze: 'open', speed: 'normal', epsilon: 0.15, alpha: 0.5, gamma: 0.95, qvals: false },
      enter: (s) => s.forget(),
      duration: 14,
    },
    {
      title: 'Value seeps backwards',
      text: 'When it finally lands on the star, the move that got it there is marked as good (green). Next time it reaches that square, the square <em>before</em> learns it leads somewhere good, and so on. Each update looks one step ahead, so value spreads back from the prize, square by square. The arrows show the best move known so far.',
      formula: 'Q(s, a) ← Q(s, a) + α [ r + γ · max Q(s′) − Q(s, a) ]',
      check: {
        q: 'The robot reaches the star for the first time. Which square learns something useful?',
        options: ['The starting square', 'Only the square just before the star', 'Every square it visited'],
        answer: 1,
        setup: { maze: 'open', speed: 'normal', qvals: false },
        explain: 'Each update uses only the reward and the value of the very next square. Before the first success every square’s value is about zero, so only the last move, which earned the +10, gets a big boost. The news travels back one square per visit.',
      },
      params: { maze: 'open', speed: 'normal', qvals: true },
      duration: 16,
    },
    {
      title: 'Fast-forward a few hundred tries',
      text: 'At turbo speed the robot runs hundreds of episodes. Green spreads back to the start, the arrows line up into a route around the wall and away from the traps, and the steps per episode (chart) drop to the shortest path (dashed).',
      params: { maze: 'open', speed: 'turbo', qvals: false },
      duration: 13,
    },
    {
      title: 'Explore or exploit?',
      text: 'Two prizes: a small one (+2) three squares to the left and a big one (+10) four squares to the right. With exploration switched off (<b>ε = 0</b>) the robot finds the small prize first and then repeats what worked, forever. It never discovers it could do better.',
      check: {
        q: 'With no random exploring, which prize will the robot settle on?',
        options: ['The small, nearby one', 'The big, distant one', 'Neither'],
        answer: 0,
        setup: { maze: 'two', speed: 'fast', epsilon: 0 },
        explain: 'Once the route to the small prize has a positive value, the greedy robot always takes it. Squares it has never visited still look worth zero, so it has no reason to try them.',
      },
      params: { maze: 'two', speed: 'fast', epsilon: 0, gamma: 0.95, qvals: false },
      enter: (s) => s.forget(),
      duration: 15,
    },
    {
      title: 'A little curiosity pays',
      text: 'Now 30% of moves are random (<b>ε = 0.3</b>). Sooner or later the wandering reaches the big prize, its value spreads back, and the route switches. This <b>exploration–exploitation</b> balance appears everywhere, from recommendation apps to choosing a restaurant.',
      params: { maze: 'two', speed: 'turbo', epsilon: 0.3, gamma: 0.95 },
      enter: (s) => s.forget(),
      duration: 15,
    },
    {
      title: 'Walking the cliff edge',
      text: 'A classic test: the shortest way to the star runs right along a cliff. Q-learning learns that edge route, the best one <em>if</em> you never slip. But its own random exploring moves still tip it over now and then, which is why real robots are trained in simulation first.',
      params: { maze: 'cliff', speed: 'fast', epsilon: 0.1, gamma: 0.95 },
      enter: (s) => s.forget(),
      duration: 15,
    },
    {
      title: 'From tables to AlphaGo',
      text: 'A table works for a few dozen squares, but Go has more positions than atoms in the universe. In 2015 DeepMind’s <b>DQN</b> replaced the table with a neural network and learned 49 Atari games from the pixels; <b>AlphaGo</b> beat Lee Sedol at Go in 2016. Chatbots are polished with <b>RLHF</b>, where the reward comes from human ratings.',
      params: { maze: 'maze', speed: 'turbo', epsilon: 0.15, gamma: 0.95 },
      enter: (s) => s.forget(),
      duration: 17,
    },
    {
      title: 'Your turn',
      text: 'Tap squares to build walls (the robot must adapt), and try the sliders: a low <b>γ</b> makes it short-sighted, so far-away prizes barely register; a high <b>α</b> learns fast but jumps around.',
      params: { maze: 'maze', speed: 'fast', epsilon: 0.15, gamma: 0.95, qvals: true },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let grid, W, H, Q, start, pos, prev, acc = 0, steps = 0, episodes = 0, trail = [], flash = null, best = 0;
    let L = {}, recent = [];
    const lens = new Series(300);

    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? '#' : grid[y][x]);
    const idx = (x, y) => y * W + x;
    const terminal = (c) => c in REWARD;

    function shortest() {
      const dist = new Map([[idx(...start), 0]]);
      const q = [start];
      while (q.length) {
        const [x, y] = q.shift();
        const d = dist.get(idx(x, y));
        if (at(x, y) === 'G') return d;
        if (terminal(at(x, y))) continue;
        for (const [dx, dy] of MOVES) {
          const nx = x + dx, ny = y + dy;
          if (at(nx, ny) === '#' || dist.has(idx(nx, ny))) continue;
          dist.set(idx(nx, ny), d + 1);
          q.push([nx, ny]);
        }
      }
      return 0;
    }
    function load() {
      grid = MAPS[params.maze].map((r) => r.split(''));
      H = grid.length;
      W = grid[0].length;
      grid.forEach((r, y) => r.forEach((c, x) => c === 'S' && (start = [x, y])));
      forget();
    }
    function forget() {
      Q = new Float32Array(W * H * 4);
      episodes = 0;
      lens.clear();
      recent = [];
      best = shortest();
      newEpisode();
    }
    function newEpisode() {
      pos = [...start];
      prev = [...start];
      steps = 0;
      trail = [[...start]];
    }
    function bestMove(x, y) {
      const b = idx(x, y) * 4;
      let m = Math.max(Q[b], Q[b + 1], Q[b + 2], Q[b + 3]);
      const ties = [0, 1, 2, 3].filter((a) => Q[b + a] >= m - 1e-9);
      return ties[Math.floor(Math.random() * ties.length)];
    }
    const vmax = (x, y) => {
      const b = idx(x, y) * 4;
      return Math.max(Q[b], Q[b + 1], Q[b + 2], Q[b + 3]);
    };
    function step() {
      const [x, y] = pos;
      const a = Math.random() < params.epsilon ? Math.floor(Math.random() * 4) : bestMove(x, y);
      let nx = x + MOVES[a][0], ny = y + MOVES[a][1];
      if (at(nx, ny) === '#') (nx = x), (ny = y);
      const c = at(nx, ny);
      const r = terminal(c) ? REWARD[c] : STEP;
      const target = terminal(c) ? r : r + params.gamma * vmax(nx, ny);
      const k = idx(x, y) * 4 + a;
      Q[k] += params.alpha * (target - Q[k]);
      prev = pos;
      pos = [nx, ny];
      steps++;
      trail.push([nx, ny]);
      if (trail.length > 60) trail.shift();
      if (terminal(c) || steps >= MAX_STEPS) {
        episodes++;
        lens.push(steps);
        recent.push(c === 'G' ? 1 : 0);
        if (recent.length > 20) recent.shift();
        flash = { x: nx, y: ny, c: terminal(c) ? c : 'T', t: 1 };
        newEpisode();
        return true;
      }
      return false;
    }
    load();

    return {
      forget,
      resize(w, h) {
        const narrow = w < 700;
        L = narrow ? { narrow, x0: 14, x1: w - 14, y0: 108, y1: h - 40 } : { narrow, x0: w - 550 >= 360 ? 510 : Math.max(w * 0.36, 380), x1: w - 40, y0: 92, y1: h - 56 }; // keep clear of the story card (x 20–490)
      },
      onParam(k) {
        if (k === 'maze') load();
      },
      pointerDown(p) {
        const g = L.grid;
        if (!g) return;
        const x = Math.floor((p.x - g.x) / g.c), y = Math.floor((p.y - g.y) / g.c);
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        const c = grid[y][x];
        if (c !== '.' && c !== '#') return;
        grid[y][x] = c === '#' ? '.' : '#';
        for (let a = 0; a < 4; a++) Q[idx(x, y) * 4 + a] = 0;
        best = shortest();
        if (pos[0] === x && pos[1] === y) newEpisode();
      },
      update(dt) {
        acc += dt * SPEED[params.speed];
        let n = Math.min(Math.floor(acc), 400);
        acc -= Math.floor(acc);
        while (n-- > 0) if (step() && params.speed === 'slow') acc = -0.6; // pause briefly after an episode ends
        if (flash) (flash.t -= dt * 1.5), flash.t <= 0 && (flash = null);
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const c = Math.floor(Math.min((L.x1 - L.x0) / W, (L.y1 - L.y0) / H, 76));
        const gx = Math.round(L.narrow ? (w - c * W) / 2 : L.x1 - c * W), gy = L.y0;
        L.grid = { x: gx, y: gy, c };
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++) {
            const ch = grid[y][x], X = gx + x * c, Y = gy + y * c;
            if (ch === '#') {
              ctx.fillStyle = '#2a3150';
              roundRect(ctx, X + 1, Y + 1, c - 2, c - 2, 4);
              ctx.fill();
              continue;
            }
            const v = terminal(ch) ? REWARD[ch] : vmax(x, y);
            const t = clamp(v / 8, -1, 1);
            ctx.fillStyle = t >= 0 ? rgba(C.teal, 0.05 + 0.5 * t) : rgba(C.red, 0.05 - 0.45 * t);
            ctx.fillRect(X + 1, Y + 1, c - 2, c - 2);
            if (params.qvals && !terminal(ch)) {
              const b = idx(x, y) * 4, mx = X + c / 2, my = Y + c / 2;
              const corners = [[[X, Y], [X + c, Y]], [[X + c, Y], [X + c, Y + c]], [[X + c, Y + c], [X, Y + c]], [[X, Y + c], [X, Y]]];
              corners.forEach(([p1, p2], a) => {
                const q = clamp(Q[b + a] / 8, -1, 1);
                if (Math.abs(q) < 0.01) return;
                ctx.fillStyle = q >= 0 ? rgba(C.teal, 0.5 * q) : rgba(C.red, -0.45 * q);
                ctx.beginPath();
                ctx.moveTo(mx, my);
                ctx.lineTo(...p1);
                ctx.lineTo(...p2);
                ctx.fill();
              });
            }
            if (ch === 'G' || ch === 'g') {
              const R = c * (ch === 'G' ? 0.32 : 0.22);
              ctx.fillStyle = C.amber;
              ctx.beginPath();
              for (let i = 0; i < 10; i++) {
                const a = -Math.PI / 2 + (i * TAU) / 10, r = i % 2 ? R * 0.45 : R;
                ctx.lineTo(X + c / 2 + Math.cos(a) * r, Y + c / 2 + Math.sin(a) * r);
              }
              ctx.fill();
              if (c > 30) text(ctx, ch === 'G' ? '+10' : '+2', X + c / 2, Y + c - 7, { size: 9, align: 'center', color: C.amber, weight: 700 });
            } else if (ch === 'X') {
              ctx.fillStyle = rgba(C.red, 0.55);
              roundRect(ctx, X + c * 0.18, Y + c * 0.18, c * 0.64, c * 0.64, c * 0.18);
              ctx.fill();
              if (c > 30) text(ctx, '−10', X + c / 2, Y + c / 2, { size: 10, align: 'center', weight: 700 });
            } else if (ch === 'S') {
              text(ctx, 'start', X + c / 2, Y + c - 8, { size: 9, align: 'center', color: C.dim });
            }
            if (!terminal(ch) && Math.abs(vmax(x, y)) > 0.02 && !params.qvals) {
              const b = idx(x, y) * 4;
              const a = [0, 1, 2, 3].reduce((m, i) => (Q[b + i] > Q[b + m] ? i : m), 0);
              const [dx, dy] = MOVES[a], s = c * 0.26;
              const al = clamp(Math.abs(vmax(x, y)) / 3, 0.25, 0.9);
              arrow(ctx, X + c / 2 - dx * s, Y + c / 2 - dy * s, X + c / 2 + dx * s, Y + c / 2 + dy * s, rgba('#ffffff', al), Math.max(1.5, c * 0.04), c * 0.18);
            }
          }
        ctx.strokeStyle = 'rgba(160,175,230,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(gx + 0.5, gy + 0.5, c * W - 1, c * H - 1);
        // trail and agent
        const slow = params.speed === 'slow' || params.speed === 'normal';
        if (slow && trail.length > 1) {
          ctx.strokeStyle = rgba(C.cyan, 0.35);
          ctx.lineWidth = 2;
          ctx.beginPath();
          trail.forEach(([x, y], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, gx + (x + 0.5) * c, gy + (y + 0.5) * c));
          ctx.stroke();
        }
        const f = slow ? clamp(acc, 0, 1) : 1;
        const ax = prev[0] + (pos[0] - prev[0]) * (slow ? Math.min(1, f * 1.5) : 1), ay = prev[1] + (pos[1] - prev[1]) * (slow ? Math.min(1, f * 1.5) : 1);
        const AX = gx + (ax + 0.5) * c, AY = gy + (ay + 0.5) * c;
        ctx.fillStyle = C.cyan;
        ctx.beginPath();
        ctx.arc(AX, AY, c * 0.26, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#05070f';
        ctx.beginPath();
        ctx.arc(AX - c * 0.09, AY - c * 0.04, c * 0.05, 0, TAU);
        ctx.arc(AX + c * 0.09, AY - c * 0.04, c * 0.05, 0, TAU);
        ctx.fill();
        if (flash) {
          const col = flash.c === 'X' ? C.red : flash.c === 'T' ? C.dim : C.amber;
          ctx.strokeStyle = rgba(col.startsWith('#') ? col : '#ffffff', flash.t);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(gx + (flash.x + 0.5) * c, gy + (flash.y + 0.5) * c, c * (0.3 + (1 - flash.t) * 0.6), 0, TAU);
          ctx.stroke();
        }
        if (!api.thumbnail) {
          const ty = gy + c * H + 20;
          tag(ctx, 'green = expected reward', gx, ty, C.teal);
          tag(ctx, 'arrows = best move so far', gx + (L.narrow ? 0 : 170), L.narrow ? ty + 26 : ty, C.ink);
        }
      },
      stats() {
        const rate = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
        return [
          { label: 'Episodes', value: String(episodes), color: C.cyan },
          { label: 'Reached the star (last 20)', value: recent.length ? Math.round(rate * 100) + ' %' : '—', color: rate > 0.8 ? C.teal : undefined },
          { label: 'Steps last episode', value: lens.data.length ? String(lens.last) : '—' },
          { label: 'Shortest path', value: best ? String(best) : 'blocked' },
        ];
      },
      charts() {
        return [{ title: 'Steps per episode', series: [{ data: lens.data, color: C.cyan }], ref: best ? { data: [best, best], color: C.amber } : undefined, min: 0, max: Math.min(MAX_STEPS, Math.max(30, ...lens.data.slice(-120))), length: 300 }];
      },
    };
  },
};
