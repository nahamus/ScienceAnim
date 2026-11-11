import { C, Series } from '../../core/util.js';

// Patterns as run-length-free coordinate lists (x, y)
const P = {
  glider: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
  lwss: [[1, 0], [4, 0], [0, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3]],
  rpent: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
  acorn: [[1, 0], [3, 1], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]],
  gun: [
    [24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2], [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
    [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4], [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5],
    [10, 6], [16, 6], [24, 6], [11, 7], [15, 7], [12, 8], [13, 8],
  ],
  pulsar: (() => {
    const out = [];
    const q = [[2, 0], [3, 0], [4, 0], [0, 2], [0, 3], [0, 4], [5, 2], [5, 3], [5, 4], [2, 5], [3, 5], [4, 5]];
    for (const [x, y] of q) for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) out.push([6 + sx * (x + 1), 6 + sy * (y + 1)]);
    return out;
  })(),
  blinker: [[0, 0], [1, 0], [2, 0]],
  toad: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]],
  beacon: [[0, 0], [1, 0], [0, 1], [3, 2], [2, 3], [3, 3]],
  block: [[0, 0], [1, 0], [0, 1], [1, 1]],
  beehive: [[1, 0], [2, 0], [0, 1], [3, 1], [1, 2], [2, 2]],
  pentadecathlon: [[1, 0], [1, 1], [0, 2], [2, 2], [1, 3], [1, 4], [1, 5], [1, 6], [0, 7], [2, 7], [1, 8], [1, 9]],
};

export default {
  id: 'life',
  title: 'Conway’s Game of Life',
  category: 'cs',
  tagline: 'Two rules on a grid produce gliders, guns and patterns that compute anything.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Algorithms', 'Emergence'],
  blurb:
    'In 1970 mathematician John Conway invented a “game” with no players. Each square on a grid lives or dies based only on its eight neighbours. From that, stable shapes, oscillators, moving spaceships and even working computers emerge. It’s a playground for how complexity arises from simplicity.',
  ideas: [
    'A dead cell with exactly <b>3</b> live neighbours is born.',
    'A live cell with <b>2 or 3</b> live neighbours survives; otherwise it dies.',
    'Some patterns travel (gliders), some repeat (oscillators), some never settle.',
    'The Game of Life is <b>Turing complete</b>: in principle it can compute anything a computer can.',
  ],
  hint: 'Click or drag to draw living cells',
  thumbChapter: 3,
  thumbFrames: 240,
  params: [
    {
      key: 'scene', label: 'Starting pattern', type: 'select', value: 'soup',
      options: [
        { value: 'soup', label: 'Random soup' },
        { value: 'zoo', label: 'Zoo' },
        { value: 'gliders', label: 'Spaceships' },
        { value: 'gun', label: 'Glider gun' },
        { value: 'rpent', label: 'R-pentomino' },
        { value: 'empty', label: 'Blank' },
      ],
    },
    { key: 'rate', label: 'Generations per second', type: 'range', min: 1, max: 60, step: 1, value: 12 },
    { key: 'cell', label: 'Cell size', type: 'range', min: 4, max: 16, step: 1, value: 9, unit: 'px', instant: true },
    { key: 'trails', label: 'Glowing trails', type: 'toggle', value: true },
    { key: 'clear', label: 'Clear', type: 'button', action: (s) => s.load('empty') },
    { key: 'rand', label: 'Randomise', type: 'button', action: (s) => s.load('soup') },
  ],
  story: [
    {
      title: 'Two simple rules',
      text: 'Each cell is alive or dead. Every tick: a dead cell with exactly <b>three</b> live neighbours comes alive; a live cell with <b>two or three</b> survives; all others die of loneliness or overcrowding.',
      formula: 'B3 / S23',
      params: { scene: 'soup', rate: 12 },
      enter: (s) => s.load('soup'),
      duration: 12,
    },
    {
      title: 'A zoo of creatures',
      text: 'Some patterns freeze into <b>still lifes</b> (blocks, beehives). Others <b>oscillate</b> forever — blinkers, toads, and the 3-phase pulsar.',
      params: { scene: 'zoo', rate: 5 },
      enter: (s) => s.load('zoo'),
      duration: 12,
    },
    {
      title: 'Spaceships',
      text: 'A <b>glider</b> is five cells that rebuild themselves one square over every four ticks — so it travels. Nobody programmed movement; it simply emerges from the rules.',
      params: { scene: 'gliders', rate: 14 },
      enter: (s) => s.load('gliders'),
      duration: 12,
    },
    {
      title: 'The glider gun',
      text: 'In 1970 Bill Gosper found a pattern that fires a new glider every 30 ticks — forever. It proved Life patterns can grow without limit, and gliders can carry signals like wires in a circuit.',
      params: { scene: 'gun', rate: 20 },
      enter: (s) => s.load('gun'),
      duration: 15,
    },
    {
      title: 'Small seed, long story',
      text: 'The <b>R-pentomino</b> is just five cells, yet it churns chaotically for 1,103 generations, spitting out gliders before it finally settles.',
      params: { scene: 'rpent', rate: 40 },
      enter: (s) => s.load('rpent'),
      duration: 16,
    },
    {
      title: 'Create life',
      text: 'Draw your own cells and press play. Can you find a pattern that never dies?',
      params: { scene: 'empty', rate: 10 },
      enter: (s) => s.load('soup'),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let W = 0, H = 0, cur, nxt, age, heat, gen = 0, acc = 0, popS = new Series(300), drawMode = null;

    function alloc() {
      const c = params.cell;
      W = Math.max(10, Math.floor(api.w / c));
      H = Math.max(10, Math.floor(api.h / c));
      cur = new Uint8Array(W * H);
      nxt = new Uint8Array(W * H);
      age = new Uint16Array(W * H);
      heat = new Float32Array(W * H);
    }
    function stamp(pat, x0, y0, flip = false) {
      for (const [x, y] of pat) {
        const X = ((flip ? -x : x) + x0 + W) % W, Y = (y + y0 + H) % H;
        cur[Y * W + X] = 1;
      }
    }
    function load(scene) {
      cur.fill(0);
      age.fill(0);
      heat.fill(0);
      gen = 0;
      popS.clear();
      const cx = W >> 1, cy = H >> 1;
      if (scene === 'soup') for (let i = 0; i < W * H; i++) cur[i] = Math.random() < 0.3 ? 1 : 0;
      else if (scene === 'zoo') {
        const items = ['block', 'beehive', 'blinker', 'toad', 'beacon', 'pulsar', 'pentadecathlon'];
        const step = Math.floor(W / (items.length + 1));
        items.forEach((k, i) => stamp(P[k], step * (i + 1) - 4, cy - 10));
      } else if (scene === 'gliders') {
        for (let i = 0; i < 6; i++) stamp(P.glider, 6 + i * 9, 6 + i * 5);
        stamp(P.lwss, 4, cy + 4);
        stamp(P.lwss, 4, cy + 16);
      } else if (scene === 'gun') stamp(P.gun, 4, 6);
      else if (scene === 'rpent') stamp(P.rpent, cx, cy);
      else if (scene === 'acorn') stamp(P.acorn, cx, cy);
    }
    function step() {
      for (let y = 0; y < H; y++) {
        const ym = ((y - 1 + H) % H) * W, y0 = y * W, yp = ((y + 1) % H) * W;
        for (let x = 0; x < W; x++) {
          const xm = (x - 1 + W) % W, xp = (x + 1) % W;
          const n = cur[ym + xm] + cur[ym + x] + cur[ym + xp] + cur[y0 + xm] + cur[y0 + xp] + cur[yp + xm] + cur[yp + x] + cur[yp + xp];
          const i = y0 + x;
          const alive = cur[i] ? n === 2 || n === 3 : n === 3;
          nxt[i] = alive ? 1 : 0;
          age[i] = alive ? Math.min(65000, age[i] + 1) : 0;
          if (cur[i] && !alive) heat[i] = 1;
        }
      }
      [cur, nxt] = [nxt, cur];
      gen++;
    }
    function paint(p) {
      const x = Math.floor(p.x / params.cell), y = Math.floor(p.y / params.cell);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      cur[y * W + x] = drawMode;
    }
    alloc();
    return {
      load,
      resize() {
        alloc();
        load(params.scene);
      },
      reset() {
        load(params.scene);
      },
      onParam(k, v) {
        if (k === 'scene') load(v);
        if (k === 'cell') {
          alloc();
          load(params.scene);
        }
      },
      pointerDown(p) {
        const x = Math.floor(p.x / params.cell), y = Math.floor(p.y / params.cell);
        drawMode = cur[y * W + x] ? 0 : 1;
        paint(p);
      },
      pointerMove(p) {
        if (drawMode !== null && p.down) paint(p);
      },
      pointerUp() {
        drawMode = null;
      },
      update(dt) {
        acc += dt * params.rate;
        let n = 0;
        while (acc >= 1 && n < 8) {
          acc--;
          n++;
          step();
        }
        for (let i = 0; i < heat.length; i++) if (heat[i] > 0) heat[i] = Math.max(0, heat[i] - dt * 1.2);
        // sample after every step: gating on frame parity could miss every step at some speeds (count stuck at 0)
        if (n) {
          let pop = 0;
          for (let i = 0; i < cur.length; i++) pop += cur[i];
          popS.push(pop);
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#04050b';
        ctx.fillRect(0, 0, w, h);
        const c = params.cell, s = c - (c > 6 ? 1 : 0);
        if (params.trails) {
          for (let i = 0; i < heat.length; i++) {
            const v = heat[i];
            if (v <= 0.02 || cur[i]) continue;
            ctx.fillStyle = `rgba(255,95,162,${v * 0.35})`;
            ctx.fillRect((i % W) * c, Math.floor(i / W) * c, s, s);
          }
        }
        // young cells are hot white-pink, old ones cool to cyan; bucket ages to limit style changes
        const NB = 10;
        const bk = Array.from({ length: NB }, () => []);
        for (let i = 0; i < cur.length; i++) if (cur[i]) bk[Math.min(NB - 1, Math.floor((Math.min(40, age[i]) / 40) * (NB - 1)))].push(i);
        bk.forEach((list, k) => {
          const t = k / (NB - 1);
          ctx.fillStyle = `hsl(${330 - t * 150},${90 - t * 10}%,${78 - t * 22}%)`;
          for (const i of list) ctx.fillRect((i % W) * c, Math.floor(i / W) * c, s, s);
        });
      },
      stats() {
        return [
          { label: 'Generation', value: gen.toLocaleString() },
          { label: 'Living cells', value: (popS.last ?? 0).toLocaleString(), color: C.pink },
          { label: 'Grid', value: `${W} × ${H}` },
        ];
      },
      charts() {
        return [{ title: 'Population', series: [{ data: popS.data, color: '#ff5fa2' }], min: 0, length: 300 }];
      },
    };
  },
};
