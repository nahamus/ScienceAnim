import { C, TAU, clamp, drawGlow, roundRect, tag, text } from '../../core/util.js';

// Small worlds and hubs.
// Ring: Watts & Strogatz (1998). N people on a ring, each linked to the K nearest. Each link is rewired to a random
// person with probability p (every link has its own fixed random draw, so raising p only ever adds shortcuts).
// Hubs: Barabási & Albert (1999). Each newcomer links to M existing people, picked in proportion to how many
// links they already have ("rich get richer"), giving a few highly connected hubs.

const N = 60, K = 4, M = 2;

function seeded(s) {
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
/** Ring lattice with links rewired with probability p. draws: per-link [u, target]. */
function wattsStrogatz(p, draws) {
  const adj = Array.from({ length: N }, () => new Set());
  const edges = [];
  let e = 0;
  for (let i = 0; i < N; i++)
    for (let d = 1; d <= K / 2; d++, e++) {
      let j = (i + d) % N, rewired = false;
      const [u, v] = draws[e];
      if (u < p) {
        let t = Math.floor(v * N);
        for (let tries = 0; tries < N && (t === i || adj[i].has(t)); tries++) t = (t + 1) % N;
        if (t !== i && !adj[i].has(t)) {
          j = t;
          rewired = true;
        }
      }
      if (adj[i].has(j)) continue;
      adj[i].add(j);
      adj[j].add(i);
      edges.push([i, j, rewired]);
    }
  return { adj, edges };
}
function barabasiAlbert(rnd) {
  const adj = Array.from({ length: N }, () => new Set());
  const edges = [];
  const ends = [];
  const link = (a, b) => {
    adj[a].add(b);
    adj[b].add(a);
    edges.push([a, b, false]);
    ends.push(a, b);
  };
  link(0, 1);
  link(1, 2);
  link(2, 0);
  for (let n = 3; n < N; n++) {
    const picked = new Set();
    while (picked.size < M) picked.add(ends[Math.floor(rnd() * ends.length)]);
    for (const t of picked) link(n, t);
  }
  return { adj, edges };
}
function bfs(adj, s, removed) {
  const d = new Array(N).fill(-1);
  if (removed?.has(s)) return d;
  d[s] = 0;
  const q = [s];
  for (let k = 0; k < q.length; k++)
    for (const v of adj[q[k]])
      if (d[v] < 0 && !removed?.has(v)) {
        d[v] = d[q[k]] + 1;
        q.push(v);
      }
  return d;
}
function measures(adj, removed) {
  let sum = 0, cnt = 0, diam = 0, unreach = 0;
  for (let s = 0; s < N; s++) {
    if (removed?.has(s)) continue;
    const d = bfs(adj, s, removed);
    for (let t = 0; t < N; t++) {
      if (t === s || removed?.has(t)) continue;
      if (d[t] < 0) unreach++;
      else {
        sum += d[t];
        cnt++;
        diam = Math.max(diam, d[t]);
      }
    }
  }
  let cc = 0, cn = 0;
  for (let i = 0; i < N; i++) {
    if (removed?.has(i)) continue;
    const nb = [...adj[i]].filter((v) => !removed?.has(v));
    if (nb.length < 2) continue;
    let links = 0;
    for (let a = 0; a < nb.length; a++) for (let b = a + 1; b < nb.length; b++) if (adj[nb[a]].has(nb[b])) links++;
    cc += links / ((nb.length * (nb.length - 1)) / 2);
    cn++;
  }
  return { L: cnt ? sum / cnt : 0, C: cn ? cc / cn : 0, diam, split: unreach > 0 };
}

// the classic curves, averaged over several random rewirings
const CURVE = (() => {
  const ps = Array.from({ length: 22 }, (_, i) => 10 ** (-3 + (3 * i) / 21));
  const reps = 8;
  const base = measures(wattsStrogatz(0, Array.from({ length: N * 2 }, () => [1, 0])).adj);
  return ps.map((p) => {
    let L = 0, Cc = 0;
    for (let r = 0; r < reps; r++) {
      const rnd = seeded(100 + r);
      const m = measures(wattsStrogatz(p, Array.from({ length: N * 2 }, () => [rnd(), rnd()])).adj);
      L += m.L / reps;
      Cc += m.C / reps;
    }
    return { p, L: L / base.L, C: Cc / base.C };
  });
})();

export default {
  id: 'small-world',
  title: 'Small Worlds and Hubs',
  category: 'math',
  tagline: 'Why everyone is about six handshakes from anyone else, and why some networks hinge on a few hubs.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Networks', 'Complex systems', 'Graphs'],
  keywords: ['small world', 'six degrees of separation', 'network', 'graph theory', 'Watts Strogatz', 'Barabasi Albert', 'scale-free', 'hub', 'shortest path', 'clustering', 'Milgram', 'epidemic spreading', 'social network'],
  blurb:
    'Most of your friends know each other, so your social world feels small and local. Yet a chain of about six acquaintances links you to almost anyone on Earth. The secret is a handful of long-range links. Rewire a ring of friends and watch the distances collapse, then meet the hubs that hold the internet, airline routes and our social networks together.',
  ideas: [
    'A network is people (<b>nodes</b>) and friendships (<b>links</b>). The distance between two people is the fewest links joining them.',
    'In a ring where everyone knows only their neighbours, messages crawl. A few random <b>shortcuts</b> slash the average distance.',
    'Friends of friends stay friends (high <b>clustering</b>), so the network still feels local: a <b>small world</b>.',
    'Many real networks grow by <b>preferential attachment</b>: newcomers link to the already popular, creating <b>hubs</b>.',
    'Hub networks shrug off random failures but fall apart if the biggest hubs are knocked out.',
  ],
  hint: 'Tap two people to find the shortest chain between them',
  thumbChapter: 2,
  thumbFrames: 60,
  params: [
    {
      key: 'kind', label: 'Network', type: 'select', value: 'ring', instant: true,
      options: [{ value: 'ring', label: 'Ring of friends' }, { value: 'hubs', label: 'Hubs (rich get richer)' }],
    },
    { key: 'p', label: 'Links rewired at random', type: 'range', min: 0, max: 1, step: 0.005, value: 0, instant: true, format: (v) => (v * 100).toFixed(v < 0.1 ? 1 : 0) + ' %' },
    { key: 'spread', label: 'Spread a rumour', type: 'button', action: (s) => s.spread() },
    { key: 'knock', label: 'Knock out the 3 biggest hubs', type: 'button', action: (s) => s.knock() },
    { key: 'heal', label: 'Restore everyone', type: 'button', action: (s) => s.heal() },
    { key: 'reroll', label: 'New random links', type: 'button', action: (s) => s.reroll() },
  ],
  story: [
    {
      title: 'A ring of friends',
      text: 'Sixty people stand in a ring, each friends with the two people on either side. To get a message to the person directly opposite, it has to be passed hand to hand: 15 steps. On average, any two people are about 8 steps apart. Everyone’s friends also know each other, so the network is highly <b>clustered</b>.',
      params: { kind: 'ring', p: 0 },
      enter: (s) => s.pick(0, 30),
      duration: 13,
    },
    {
      title: 'A few shortcuts',
      text: 'Now give just 5 % of the friendships a random new end, somewhere across the ring. These few <b>shortcuts</b> (in amber) slash the average distance, while almost everyone’s circle of friends stays the same. The graph shows it: distance (blue) collapses long before clustering (green) drops.',
      check: {
        q: 'If we rewire 5 % of the links at random, what happens to the average number of steps between two people?',
        options: ['It drops a lot, by almost half', 'It falls by about 5 %', 'It barely changes'],
        answer: 0,
        setup: { kind: 'ring', p: 0 },
        explain: 'Each shortcut is a bridge across the ring that many paths can use, so even a few of them cut distances drastically. Duncan Watts and Steven Strogatz showed this in 1998 and called such networks small worlds.',
      },
      params: { kind: 'ring', p: 0.05 },
      enter: (s) => s.pick(0, 30),
      duration: 15,
    },
    {
      title: 'Six degrees of separation',
      text: 'In 1967 Stanley Milgram asked people in Nebraska to get a letter to a stranger in Boston, only by passing it to someone they knew personally. The letters that arrived took about six steps. In 2016 Facebook measured its 1.6 billion users: any two were on average just 3.6 steps apart. With hundreds of friends each, the number of people you can reach grows so fast that a few steps cover the whole planet.',
      formula: 'average steps ≈ ln(people) ÷ ln(friends each)',
      params: { kind: 'ring', p: 0.1 },
      enter: (s) => s.pick(7, 41),
      duration: 15,
    },
    {
      title: 'How things spread',
      text: 'Shortcuts also speed up anything that travels through the network: rumours, fashions, viruses. Here a rumour starts with one person and everyone passes it to all their friends each step. On the plain ring it creeps round in two slow fronts; with shortcuts it pops up in distant places and reaches everyone in a few steps.',
      params: { kind: 'ring', p: 0.06 },
      enter: (s) => s.spread(),
      duration: 15,
    },
    {
      title: 'Hubs',
      text: 'Many real networks grow over time, and newcomers prefer to link to people (or websites, or airports) that are already popular. The rich get richer, and a few <b>hubs</b> end up with a huge number of links while most nodes have only a few. Airline routes, the web and the internet’s backbone all look like this. Hubs make distances short too.',
      params: { kind: 'hubs', p: 0 },
      enter: (s) => {
        s.heal();
        s.spread(true);
      },
      duration: 15,
    },
    {
      title: 'Achilles’ heel',
      text: 'Lose a random person and a hub network hardly notices. But knock out just the three biggest hubs and it starts to fall apart: distances grow and some people are cut off entirely. That is why a storm at one hub airport can disrupt flights worldwide.',
      check: {
        q: 'Which would damage a hub network more?',
        options: ['Removing the 3 best-connected nodes', 'Removing 3 nodes picked at random', 'Both do about the same damage'],
        answer: 0,
        setup: { kind: 'hubs', p: 0 },
        explain: 'Most nodes have only a couple of links, so a random failure usually removes a minor node. The hubs carry a large share of all the paths, so losing them splits the network and stretches the routes that remain.',
      },
      params: { kind: 'hubs', p: 0 },
      enter: (s) => s.knock(),
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Slide the rewiring from 0 to 100 % and watch distance and clustering. Tap any two people to find the shortest chain, spread rumours, and knock out hubs.',
      params: { kind: 'ring', p: 0.02 },
      enter: (s) => s.heal(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let rnd = seeded(5);
    let draws = Array.from({ length: N * 2 }, () => [rnd(), rnd()]);
    let ba = barabasiAlbert(seeded(11));
    let net = null, meas = null, removed = new Set();
    let A = 0, B = 30, pathNodes = [], sel = 0;
    let wave = null; // { start, t, dist }
    let baPos = null;

    function layoutBA() {
      // simple force-directed layout, done once
      const r = seeded(3);
      const P = Array.from({ length: N }, (_, i) => ({ x: Math.cos((TAU * i) / N) * (0.3 + r() * 0.6), y: Math.sin((TAU * i) / N) * (0.3 + r() * 0.6), vx: 0, vy: 0 }));
      for (let it = 0; it < 500; it++) {
        for (let i = 0; i < N; i++)
          for (let j = i + 1; j < N; j++) {
            const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, d2 = dx * dx + dy * dy + 1e-4;
            const f = 0.004 / d2;
            P[i].vx -= f * dx;
            P[i].vy -= f * dy;
            P[j].vx += f * dx;
            P[j].vy += f * dy;
          }
        for (const [a, b] of ba.edges) {
          const dx = P[b].x - P[a].x, dy = P[b].y - P[a].y, d = Math.hypot(dx, dy) || 1e-3;
          const f = (d - 0.18) * 0.05;
          P[a].vx += (f * dx) / d;
          P[a].vy += (f * dy) / d;
          P[b].vx -= (f * dx) / d;
          P[b].vy -= (f * dy) / d;
        }
        for (const p of P) {
          p.vx -= p.x * 0.01;
          p.vy -= p.y * 0.01;
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.6;
          p.vy *= 0.6;
        }
      }
      let m = 0;
      for (const p of P) m = Math.max(m, Math.abs(p.x), Math.abs(p.y));
      return P.map((p) => ({ x: p.x / m, y: p.y / m }));
    }

    function rebuild() {
      net = params.kind === 'ring' ? wattsStrogatz(params.p, draws) : ba;
      if (params.kind === 'hubs' && !baPos) baPos = layoutBA();
      meas = measures(net.adj, removed);
      findPath();
    }
    function findPath() {
      pathNodes = [];
      if (removed.has(A) || removed.has(B)) return;
      const d = bfs(net.adj, A, removed);
      if (d[B] < 0) return;
      let cur = B;
      pathNodes.push(cur);
      while (cur !== A) {
        for (const v of net.adj[cur])
          if (d[v] === d[cur] - 1 && !removed.has(v)) {
            cur = v;
            break;
          }
        pathNodes.push(cur);
      }
    }
    rebuild();

    const geom = () => {
      const { w, h } = api;
      const phone = w < 760;
      if (phone) {
        const R = Math.min(w * 0.4, (h - 130) / 2);
        return { phone, cx: w / 2, cy: 62 + R, R, chart: null };
      }
      const R = Math.min(w * 0.22, (h - 330) / 2);
      return { phone, cx: Math.max(R + 40, w * 0.3), cy: 112 + R, R, chart: { x: w * 0.58, y: 120, w: w * 0.42 - 24, h: Math.min(260, h * 0.32) } };
    };
    function nodeXY(i, g) {
      if (params.kind === 'hubs') return [g.cx + baPos[i].x * g.R, g.cy + baPos[i].y * g.R];
      const a = (TAU * i) / N - Math.PI / 2;
      return [g.cx + Math.cos(a) * g.R, g.cy + Math.sin(a) * g.R];
    }

    return {
      pick(a, b) {
        A = a;
        B = b;
        findPath();
      },
      spread(fromHub) {
        let s = 0;
        if (fromHub) {
          let best = -1;
          for (let i = 0; i < N; i++) if (net.adj[i].size > best && !removed.has(i)) [best, s] = [net.adj[i].size, i];
        }
        wave = { start: s, t: 0, dist: bfs(net.adj, s, removed) };
      },
      knock() {
        removed = new Set([...Array(N).keys()].sort((a, b) => net.adj[b].size - net.adj[a].size).slice(0, 3));
        wave = null;
        rebuild();
      },
      heal() {
        removed = new Set();
        wave = null;
        rebuild();
      },
      reroll() {
        rnd = seeded(Math.floor(Math.random() * 1e9));
        draws = Array.from({ length: N * 2 }, () => [rnd(), rnd()]);
        ba = barabasiAlbert(rnd);
        baPos = null;
        removed = new Set();
        wave = null;
        rebuild();
      },
      onParam(k) {
        if (k === 'kind') {
          removed = new Set();
          wave = null;
          if (params.kind === 'hubs') {
            A = 5;
            B = 40;
          }
        }
        if (k === 'kind' || k === 'p') {
          rebuild();
          if (wave) wave.dist = bfs(net.adj, wave.start, removed);
        }
      },
      pointerDown(p) {
        const g = geom();
        let best = -1, bd = 22;
        for (let i = 0; i < N; i++) {
          const [x, y] = nodeXY(i, g);
          const d = Math.hypot(p.x - x, p.y - y);
          if (d < bd) [best, bd] = [i, d];
        }
        if (best < 0) return;
        if (sel === 0) A = best;
        else B = best;
        sel = 1 - sel;
        wave = null;
        findPath();
      },
      update(dt) {
        if (wave) wave.t += dt;
      },
      draw() {
        const { w, h } = api;
        const g = geom();
        ctx.fillStyle = '#05070f';
        ctx.fillRect(0, 0, w, h);
        const step = wave ? Math.floor(wave.t / 0.7) : -1;
        const maxD = wave ? Math.max(...wave.dist) : 0;
        // links
        for (const [a, b, rew] of net.edges) {
          if (removed.has(a) || removed.has(b)) continue;
          const [x1, y1] = nodeXY(a, g), [x2, y2] = nodeXY(b, g);
          ctx.strokeStyle = rew ? 'rgba(255,181,71,0.75)' : 'rgba(140,170,255,0.28)';
          ctx.lineWidth = rew ? 1.6 : 1.2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          if (params.kind === 'ring' && rew) ctx.quadraticCurveTo(g.cx + (x1 + x2 - 2 * g.cx) * 0.25, g.cy + (y1 + y2 - 2 * g.cy) * 0.25, x2, y2);
          else ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        // shortest path
        if (!wave && pathNodes.length > 1) {
          ctx.strokeStyle = C.teal;
          ctx.lineWidth = 3.5;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          pathNodes.forEach((n, i) => {
            const [x, y] = nodeXY(n, g);
            ctx[i ? 'lineTo' : 'moveTo'](x, y);
          });
          ctx.stroke();
        }
        // nodes
        for (let i = 0; i < N; i++) {
          const [x, y] = nodeXY(i, g);
          const deg = net.adj[i].size;
          const r = params.kind === 'hubs' ? 3 + Math.sqrt(deg) * 2.2 : 6;
          if (removed.has(i)) {
            ctx.strokeStyle = 'rgba(255,77,109,0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - r, y - r);
            ctx.lineTo(x + r, y + r);
            ctx.moveTo(x + r, y - r);
            ctx.lineTo(x - r, y + r);
            ctx.stroke();
            continue;
          }
          let col = '#5b8cff';
          if (wave) {
            const d = wave.dist[i];
            if (d >= 0 && d <= step) col = d === step ? '#ffd166' : '#ff8a3d';
            else col = 'rgba(91,140,255,0.55)';
            if (d === step && d >= 0) {
              ctx.globalCompositeOperation = 'lighter';
              drawGlow(ctx, x, y, r * 3.5, '#ffb547', 0.3);
              ctx.globalCompositeOperation = 'source-over';
            }
          } else if (i === A || i === B) col = C.teal;
          else if (pathNodes.includes(i)) col = '#8ff5d2';
          ctx.fillStyle = col;
          ctx.strokeStyle = '#05070f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
          ctx.stroke();
        }
        // labels
        if (wave) {
          const reached = wave.dist.filter((d, i) => d >= 0 && d <= step && !removed.has(i)).length;
          const all = N - removed.size;
          const done = step >= maxD;
          tag(ctx, done ? `everyone reachable has heard it: ${maxD} steps` : `step ${Math.max(0, step)}: ${reached} of ${all} have heard`, w - 16, g.phone ? 56 : 84, C.amber, { align: 'right' });
        } else if (pathNodes.length > 1) {
          tag(ctx, `shortest chain: ${pathNodes.length - 1} steps`, w - 16, g.phone ? 56 : 84, C.teal, { align: 'right' });
        } else if (removed.size) tag(ctx, 'those two are cut off from each other', w - 16, g.phone ? 56 : 84, C.red, { align: 'right' });

        // the Watts–Strogatz curves
        if (g.chart && params.kind === 'ring') {
          const { x, y, w: cw, h: ch } = g.chart;
          ctx.fillStyle = 'rgba(8,11,24,0.86)';
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          roundRect(ctx, x, y, cw, ch, 12);
          ctx.fill();
          ctx.stroke();
          text(ctx, 'Compared with the plain ring', x + 12, y + 15, { size: 11, weight: 600, color: C.dim });
          const x0 = x + 14, x1 = x + cw - 14, y0 = y + 36, y1 = y + ch - 30;
          const X = (p) => x0 + ((Math.log10(p) + 3) / 3) * (x1 - x0), Y = (v) => y1 - v * (y1 - y0);
          const line = (key, col) => {
            ctx.strokeStyle = col;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            CURVE.forEach((c, i) => ctx[i ? 'lineTo' : 'moveTo'](X(c.p), Y(c[key])));
            ctx.stroke();
          };
          line('L', '#5b8cff');
          line('C', C.teal);
          if (params.p > 0) {
            const px = X(clamp(params.p, 0.001, 1));
            ctx.strokeStyle = 'rgba(255,181,71,0.8)';
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(px, y0);
            ctx.lineTo(px, y1);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          for (const [p, s] of [[0.001, '0.1 %'], [0.01, '1 %'], [0.1, '10 %'], [1, '100 %']]) text(ctx, s, X(p), y1 + 12, { size: 10, align: 'center', color: 'rgba(233,237,247,0.45)', mono: true });
          text(ctx, 'links rewired', x1, y1 + 24, { size: 9, align: 'right', color: 'rgba(233,237,247,0.45)' });
          text(ctx, 'average distance', x0 + 6, y0 - 8, { size: 10, color: '#7fa5ff' });
          text(ctx, 'clustering', x0 + 120, y0 - 8, { size: 10, color: C.teal });
        }
        if (g.chart && params.kind === 'hubs') {
          // degree histogram
          const { x, y, w: cw, h: ch } = g.chart;
          ctx.fillStyle = 'rgba(8,11,24,0.86)';
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          roundRect(ctx, x, y, cw, ch, 12);
          ctx.fill();
          ctx.stroke();
          text(ctx, 'How many people have each number of links', x + 12, y + 15, { size: 11, weight: 600, color: C.dim });
          const deg = net.adj.map((s) => s.size);
          const mx = Math.max(...deg);
          const counts = new Array(mx + 1).fill(0);
          deg.forEach((d) => counts[d]++);
          const top = Math.max(...counts);
          const x0 = x + 14, x1 = x + cw - 14, y0 = y + 34, y1 = y + ch - 26;
          const bw = (x1 - x0) / (mx + 1);
          counts.forEach((c, d) => {
            if (!c) return;
            ctx.fillStyle = d >= 10 ? C.amber : '#5b8cff';
            ctx.fillRect(x0 + d * bw + 1, y1 - (c / top) * (y1 - y0), bw - 2, (c / top) * (y1 - y0));
          });
          text(ctx, 'links →', x1, y1 + 12, { size: 10, align: 'right', color: 'rgba(233,237,247,0.45)' });
          text(ctx, 'most have 2–3', x0 + 3 * bw + 10, y0 + 6, { size: 10, color: '#7fa5ff' });
          text(ctx, `hubs: up to ${mx}`, x1, y0 + 6, { size: 10, align: 'right', color: C.amber });
        }
      },
      stats() {
        const deg = net.adj.map((s, i) => (removed.has(i) ? 0 : s.size));
        return [
          { label: 'Average steps apart', value: meas.L.toFixed(2), color: '#7fa5ff' },
          { label: 'Longest shortest chain', value: String(meas.diam) },
          { label: 'Clustering', value: `${Math.round(meas.C * 100)} %`, color: C.teal },
          { label: 'Most links (one person)', value: String(Math.max(...deg)) },
          { label: 'Network', value: meas.split ? 'split apart' : 'all connected', color: meas.split ? C.red : undefined },
        ];
      },
    };
  },
};
