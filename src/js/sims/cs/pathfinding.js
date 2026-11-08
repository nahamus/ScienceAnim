import { C, drawGlow, rand, roundRect, tag } from '../../core/util.js';

class Heap {
  constructor() {
    this.a = [];
  }
  push(item, pr) {
    const a = this.a;
    a.push([pr, item]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top[1];
  }
  get size() {
    return this.a.length;
  }
}

const ALGO_NAMES = { bfs: 'Breadth-first', dijkstra: 'Dijkstra', astar: 'A*', greedy: 'Greedy best-first' };

export default {
  id: 'pathfinding',
  title: 'Pathfinding: How GPS Finds a Route',
  category: 'cs',
  tagline: 'Breadth-first, Dijkstra, A* and greedy search race to find the shortest way through a maze.',
  ages: ['14-16', '16+'],
  topics: ['Algorithms', 'Graphs'],
  blurb:
    'Every time a map app plans a route or a game character walks around a wall, a search algorithm explores possibilities. Blind searches flood outward in every direction; smart ones use a sense of direction to focus on promising paths. Watch them think.',
  ideas: [
    '<b>Breadth-first search</b> explores in rings and finds the path with fewest steps.',
    '<b>Dijkstra’s algorithm</b> accounts for costs (like slow mud) and finds the cheapest route.',
    '<b>A*</b> adds a guess of the remaining distance, so it explores far less while still finding the best path.',
    'Using only the guess (<b>greedy</b>) is fast but can be fooled into long detours.',
  ],
  hint: 'Drag to draw walls · drag the green start or pink goal to move them',
  thumbChapter: 2,
  thumbFrames: 140,
  params: [
    { key: 'algo', label: 'Algorithm', type: 'select', value: 'bfs', options: Object.entries(ALGO_NAMES).map(([value, label]) => ({ value, label })) },
    { key: 'map', label: 'Map', type: 'select', value: 'open', options: [{ value: 'open', label: 'Open' }, { value: 'mud', label: 'Mud' }, { value: 'trap', label: 'Trap' }, { value: 'maze', label: 'Maze' }, { value: 'empty', label: 'Empty' }] },
    { key: 'speed', label: 'Cells explored per second', type: 'range', min: 10, max: 2000, step: 10, value: 220 },
    { key: 'new', label: 'New map', type: 'button', action: (s) => s.makeMap() },
  ],
  story: [
    {
      title: 'Flooding outward',
      text: '<b>Breadth-first search</b> checks every cell one step away, then two steps, then three — like water spreading from the green start. It’s guaranteed to find the shortest path, but explores a lot.',
      params: { algo: 'bfs', map: 'open', speed: 260 },
      enter: (s) => s.makeMap(),
      duration: 13,
    },
    {
      title: 'Not all steps are equal',
      text: 'Brown cells are mud — five times slower to cross. <b>Dijkstra’s algorithm</b> expands the cheapest-so-far cell first, so it happily walks around the mud to save time.',
      formula: 'expand the cell with the smallest g (cost so far)',
      params: { algo: 'dijkstra', map: 'mud', speed: 300 },
      enter: (s) => s.makeMap(),
      duration: 14,
    },
    {
      title: 'A*: a sense of direction',
      text: '<b>A*</b> ranks cells by cost so far <em>plus</em> a straight-line guess of the distance left. It beelines toward the goal, exploring a fraction of the map — and still finds the optimal path.',
      formula: 'f = g + h',
      params: { algo: 'astar', map: 'open', speed: 160 },
      enter: (s) => s.makeMap(),
      duration: 14,
    },
    {
      title: 'Greedy gets trapped',
      text: 'Greedy search only looks at the guess. It charges straight into this U-shaped wall, then has to crawl around it — and ends up with a longer path. A guess alone isn’t enough.',
      params: { algo: 'greedy', map: 'trap', speed: 160 },
      enter: (s) => s.makeMap(),
      duration: 13,
    },
    {
      title: 'Solving a maze',
      text: 'In a maze, A* still helps — but the walls force it to explore many dead ends.',
      params: { algo: 'astar', map: 'maze', speed: 400 },
      enter: (s) => s.makeMap(),
      duration: 13,
    },
    {
      title: 'Design a challenge',
      text: 'Draw walls, drag the start and goal, and compare algorithms on the same map. Which one explores the fewest cells?',
      params: { algo: 'astar', map: 'empty', speed: 300 },
      enter: (s) => s.makeMap(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let cols = 0, rows = 0, cell = 24, ox = 0, oy = 0, grid, start, goal, search = null, path = [], pathT = 0, drag = null, acc = 0;

    const idx = (x, y) => y * cols + x;
    function reachable() {
      const seen = new Uint8Array(cols * rows), q = [idx(start.x, start.y)];
      seen[q[0]] = 1;
      while (q.length) {
        const c = q.pop();
        if (c === idx(goal.x, goal.y)) return true;
        const x = c % cols, y = (c / cols) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= cols || Y >= rows) continue;
          const n = idx(X, Y);
          if (!seen[n] && grid[n] !== 1) (seen[n] = 1), q.push(n);
        }
      }
      return false;
    }
    function makeMap(tries = 0) {
      grid = new Uint8Array(cols * rows);
      start = { x: Math.max(1, Math.round(cols * 0.12)), y: Math.round(rows * 0.5) };
      goal = { x: Math.min(cols - 2, Math.round(cols * 0.86)), y: Math.round(rows * 0.5) };
      const m = params.map;
      if (m === 'open' || m === 'mud') {
        for (let i = 0; i < cols * rows * 0.075; i++) {
          const x = Math.floor(rand(cols)), y = Math.floor(rand(rows));
          const len = Math.floor(rand(2, 6)), horiz = Math.random() < 0.5;
          for (let k = 0; k < len; k++) {
            const X = x + (horiz ? k : 0), Y = y + (horiz ? 0 : k);
            if (X < cols && Y < rows) grid[idx(X, Y)] = 1;
          }
        }
        if (m === 'mud') {
          for (let b = 0; b < 3; b++) {
            const cx = cols * (0.35 + b * 0.15), cy = rows * rand(0.3, 0.7), r = Math.min(cols, rows) * rand(0.18, 0.28);
            for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if ((x - cx) ** 2 + (y - cy) ** 2 < r * r && grid[idx(x, y)] === 0) grid[idx(x, y)] = 2;
          }
          for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (grid[idx(x, y)] === 1 && Math.random() < 0.6) grid[idx(x, y)] = 0;
        }
      } else if (m === 'trap') {
        const cx = Math.round(cols * 0.55), h = Math.round(rows * 0.32);
        for (let y = start.y - h; y <= start.y + h; y++) if (y >= 0 && y < rows) grid[idx(cx, y)] = 1;
        for (let x = cx - Math.round(cols * 0.22); x <= cx; x++) {
          if (start.y - h >= 0) grid[idx(x, start.y - h)] = 1;
          if (start.y + h < rows) grid[idx(x, start.y + h)] = 1;
        }
      } else if (m === 'maze') {
        grid.fill(1);
        const stack = [[1, 1]];
        grid[idx(1, 1)] = 0;
        while (stack.length) {
          const [x, y] = stack[stack.length - 1];
          const nb = [[2, 0], [-2, 0], [0, 2], [0, -2]].map(([dx, dy]) => [x + dx, y + dy, x + dx / 2, y + dy / 2]).filter(([X, Y]) => X > 0 && Y > 0 && X < cols - 1 && Y < rows - 1 && grid[idx(X, Y)] === 1);
          if (!nb.length) {
            stack.pop();
            continue;
          }
          const [X, Y, mx, my] = nb[Math.floor(Math.random() * nb.length)];
          grid[idx(mx, my)] = 0;
          grid[idx(X, Y)] = 0;
          stack.push([X, Y]);
        }
        // open a few loops so there are alternative routes
        for (let i = 0; i < cols * rows * 0.03; i++) {
          const x = 1 + Math.floor(rand(cols - 2)), y = 1 + Math.floor(rand(rows - 2));
          grid[idx(x, y)] = 0;
        }
        start = { x: 1, y: 1 };
        goal = { x: cols - 2 - ((cols - 3) % 2), y: rows - 2 - ((rows - 3) % 2) };
      }
      grid[idx(start.x, start.y)] = 0;
      grid[idx(goal.x, goal.y)] = 0;
      if (!reachable() && tries < 12) return makeMap(tries + 1);
      begin();
    }

    function begin() {
      const n = cols * rows;
      search = { g: new Float32Array(n).fill(Infinity), from: new Int32Array(n).fill(-1), closed: new Float32Array(n).fill(-1), open: new Heap(), openSet: new Uint8Array(n), order: 0, found: false, failed: false, expanded: 0, tick: 0 };
      const s = idx(start.x, start.y);
      search.g[s] = 0;
      search.open.push(s, 0);
      search.openSet[s] = 1;
      path = [];
      pathT = 0;
    }
    const hfun = (i) => Math.abs((i % cols) - goal.x) + Math.abs(Math.floor(i / cols) - goal.y);
    const cost = (i) => (grid[i] === 2 && params.algo !== 'bfs' ? 5 : 1);

    function expand() {
      const S = search;
      if (S.found || S.failed) return;
      if (!S.open.size) {
        S.failed = true;
        return;
      }
      const cur = S.open.pop();
      if (S.closed[cur] >= 0) return;
      S.closed[cur] = S.tick++;
      S.openSet[cur] = 0;
      S.expanded++;
      if (cur === idx(goal.x, goal.y)) {
        S.found = true;
        let c = cur;
        while (c !== -1) {
          path.unshift(c);
          c = S.from[c];
        }
        return;
      }
      const x = cur % cols, y = Math.floor(cur / cols);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= cols || Y >= rows) continue;
        const n = idx(X, Y);
        if (grid[n] === 1 || S.closed[n] >= 0) continue;
        const g = S.g[cur] + cost(n);
        if (g < S.g[n]) {
          S.g[n] = g;
          S.from[n] = cur;
          const a = params.algo;
          const pr = a === 'bfs' ? S.order++ : a === 'dijkstra' ? g : a === 'astar' ? g + hfun(n) * 1.0001 : hfun(n);
          S.open.push(n, pr);
          S.openSet[n] = 1;
        }
      }
    }
    const cellAt = (p) => ({ x: Math.floor((p.x - ox) / cell), y: Math.floor((p.y - oy) / cell) });

    return {
      makeMap,
      resize(w, h) {
        cell = Math.max(16, Math.round(Math.min(w, h) / 26));
        cols = Math.floor((w - 40) / cell);
        rows = Math.floor((h - 100) / cell);
        if (cols % 2 === 0) cols--;
        if (rows % 2 === 0) rows--;
        ox = Math.round((w - cols * cell) / 2);
        oy = 76;
        makeMap();
      },
      reset: makeMap,
      onParam(k) {
        if (k === 'map') makeMap();
        if (k === 'algo') begin();
      },
      pointerDown(p) {
        const c = cellAt(p);
        if (c.x === start.x && c.y === start.y) drag = { kind: 'start' };
        else if (c.x === goal.x && c.y === goal.y) drag = { kind: 'goal' };
        else if (c.x >= 0 && c.y >= 0 && c.x < cols && c.y < rows) {
          const paint = grid[idx(c.x, c.y)] === 1 ? 0 : 1;
          drag = { kind: 'paint', paint };
          grid[idx(c.x, c.y)] = paint;
          begin();
        }
      },
      pointerMove(p) {
        if (!drag) return;
        const c = cellAt(p);
        if (c.x < 0 || c.y < 0 || c.x >= cols || c.y >= rows) return;
        const i = idx(c.x, c.y);
        if (drag.kind === 'paint') {
          if ((c.x === start.x && c.y === start.y) || (c.x === goal.x && c.y === goal.y)) return;
          if (grid[i] !== drag.paint) {
            grid[i] = drag.paint;
            begin();
          }
        } else if (grid[i] !== 1) {
          const t = drag.kind === 'start' ? start : goal;
          if (t.x !== c.x || t.y !== c.y) {
            t.x = c.x;
            t.y = c.y;
            begin();
          }
        }
      },
      pointerUp() {
        drag = null;
      },
      update(dt) {
        if (!search) return;
        acc += dt * params.speed;
        while (acc >= 1) {
          acc--;
          expand();
        }
        if (search.found) pathT = Math.min(path.length, pathT + dt * 40);
        else if (search.failed) acc = 0;
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#05060d';
        ctx.fillRect(0, 0, w, h);
        const S = search;
        const now = S.tick;
        for (let y = 0; y < rows; y++)
          for (let x = 0; x < cols; x++) {
            const i = idx(x, y);
            const X = ox + x * cell, Y = oy + y * cell;
            if (grid[i] === 1) {
              ctx.fillStyle = '#2a3150';
              roundRect(ctx, X + 1, Y + 1, cell - 2, cell - 2, 4);
              ctx.fill();
              continue;
            }
            let fill = grid[i] === 2 ? '#3a2a14' : 'rgba(255,255,255,0.025)';
            if (S.closed[i] >= 0) {
              const age = now - S.closed[i];
              const fresh = Math.max(0, 1 - age / 60);
              const hue = 250 - Math.min(1, S.g[i] / (cols + rows)) * 80;
              fill = `hsla(${hue},70%,${grid[i] === 2 ? 30 : 32 + fresh * 30}%,${0.55 + fresh * 0.4})`;
            } else if (S.openSet[i]) fill = 'rgba(56,214,245,0.55)';
            ctx.fillStyle = fill;
            ctx.fillRect(X + 1, Y + 1, cell - 2, cell - 2);
          }
        // path
        if (path.length && pathT > 0) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = Math.max(3, cell * 0.28);
          ctx.lineCap = ctx.lineJoin = 'round';
          ctx.beginPath();
          const n = Math.floor(pathT);
          for (let k = 0; k < n; k++) {
            const i = path[k];
            const X = ox + (i % cols) * cell + cell / 2, Y = oy + Math.floor(i / cols) * cell + cell / 2;
            k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
          }
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
        // endpoints
        ctx.globalCompositeOperation = 'lighter';
        for (const [p, col] of [[start, '#2ee6a6'], [goal, '#ff5fa2']]) drawGlow(ctx, ox + p.x * cell + cell / 2, oy + p.y * cell + cell / 2, cell * 1.4, col, 0.3);
        ctx.globalCompositeOperation = 'source-over';
        if (!api.thumbnail) {
          if (S.failed) tag(ctx, 'no path exists — remove some walls', w / 2, oy + (rows * cell) / 2, C.red, { align: 'center', size: 13 });
        }
      },
      stats() {
        const g = search?.found ? search.g[idx(goal.x, goal.y)] : null;
        return [
          { label: 'Algorithm', value: ALGO_NAMES[params.algo], color: C.pink },
          { label: 'Cells explored', value: String(search?.expanded ?? 0) },
          { label: 'Frontier', value: String(search?.open.size ?? 0), color: C.cyan },
          { label: 'Path length', value: path.length ? `${path.length - 1} steps` : '—', color: '#ffd166' },
          { label: 'Path cost', value: g !== null ? String(g) : '—' },
        ];
      },
    };
  },
};
