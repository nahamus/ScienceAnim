import { C, TAU, randn, rand, backdrop, tag, Series, drawGlow, rgba } from '../../core/util.js';

const PAL = ['#5b8cff', '#ff5fa2', '#2ee6a6', '#ffb547', '#a78bfa', '#38d6f5', '#ff8a3d', '#a3e635'];

export default {
  id: 'kmeans',
  title: 'Finding Clusters (k-means)',
  category: 'ai',
  tagline: 'How a computer sorts a cloud of data into groups — with no labels at all.',
  ages: ['14-16', '16+'],
  topics: ['Machine learning', 'Data'],
  blurb:
    'Shops group customers, biologists group cells, astronomers group galaxies — usually without being told what the groups are. k-means is the classic way to find them: place k centres, give each point to its nearest centre, move each centre to the middle of its points, and repeat until nothing changes.',
  ideas: [
    '<b>Assign</b>: every point joins its nearest centre.',
    '<b>Update</b>: every centre moves to the average of its points.',
    'Repeating these two steps always reduces the total distance, so it <b>converges</b>.',
    'You must choose k — and a bad starting guess can get stuck in a poor answer.',
  ],
  hint: 'Click to add points · drag a centre to move it',
  thumbChapter: 3,
  thumbFrames: 300,
  params: [
    { key: 'k', label: 'Number of clusters k', type: 'range', min: 2, max: 8, step: 1, value: 4, instant: true },
    { key: 'blobs', label: 'True groups in the data', type: 'range', min: 2, max: 8, step: 1, value: 4, instant: true },
    { key: 'spread', label: 'Group spread', type: 'range', min: 0.03, max: 0.15, step: 0.005, value: 0.06, instant: true },
    { key: 'init', label: 'Starting centres', type: 'select', value: 'pp', options: [{ value: 'random', label: 'Random' }, { value: 'pp', label: 'k-means++' }] },
    { key: 'speed', label: 'Step speed', type: 'range', min: 0.3, max: 3, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'regions', label: 'Shade territories', type: 'toggle', value: true },
    { key: 'newdata', label: 'New data', type: 'button', action: (s) => s.data() },
    { key: 'restart', label: 'Restart k-means', type: 'button', action: (s) => s.start() },
  ],
  story: [
    {
      title: 'A cloud of points',
      text: 'Each dot is a data point — say a customer described by two numbers. We can see there are groups, but the computer only sees coordinates. Four centres (big rings) start at random positions.',
      params: { k: 4, blobs: 4, spread: 0.06, init: 'random', speed: 0.6, regions: false },
      enter: (s) => {
        s.data(3);
        s.start(true);
      },
      duration: 11,
    },
    {
      title: 'Assign, then update',
      text: 'Step 1: every point joins its <b>nearest</b> centre (lines). Step 2: every centre jumps to the <b>average</b> of its points. Repeat. Watch the centres march toward the groups.',
      formula: 'μⱼ ← mean{ xᵢ : xᵢ closest to μⱼ }',
      params: { speed: 0.7, regions: true },
      duration: 15,
    },
    {
      title: 'Converged',
      text: 'After a few rounds no point changes team and the centres stop moving. The chart shows the total squared distance falling at every step until it levels off.',
      params: { speed: 1 },
      duration: 11,
    },
    {
      title: 'Choosing k',
      text: 'Ask for 3 clusters when there are really 5, and k-means still gives you 3 — merging groups that do not belong together. Picking k is up to you; the “elbow” in the error curve is a common hint.',
      params: { k: 3, blobs: 5, init: 'pp', speed: 1 },
      enter: (s) => {
        s.data(11);
        s.start();
      },
      duration: 13,
    },
    {
      title: 'Bad starts',
      text: 'Random starting centres can get trapped: two centres share one group while another group is split. <b>k-means++</b> spreads the starting centres out, making good answers far more likely.',
      params: { k: 5, blobs: 5, init: 'random', speed: 1 },
      enter: (s) => {
        s.data(11);
        s.start(true, 4);
      },
      duration: 14,
    },
    {
      title: 'Your data',
      text: 'Click to add points, drag centres around, change k and restart. Try data with very spread-out groups.',
      params: { k: 4, blobs: 4, init: 'pp', speed: 1 },
      enter: (s) => {
        s.data();
        s.start();
      },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let pts = [], cents = [], phase = 'assign', timer = 0, iter = 0, done = false, drag = null, region = null, regionKey = '';
    const sErr = new Series(60);

    const box = () => {
      const { w, h } = api;
      const m = 30;
      return { x: m, y: 80, w: w - 2 * m, h: Math.max(100, h - 80 - (h > 600 ? 40 : 20)) };
    };
    const toPx = (p) => {
      const b = box();
      return [b.x + p.x * b.w, b.y + p.y * b.h];
    };

    function rng(seed) {
      if (seed === undefined) return Math.random;
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function data(seed) {
      const r = rng(seed);
      const g = Math.round(params.blobs);
      const centers = [];
      for (let i = 0; i < g; i++) {
        let c, tries = 0;
        do c = { x: 0.12 + r() * 0.76, y: 0.12 + r() * 0.76 };
        while (tries++ < 50 && centers.some((o) => Math.hypot(o.x - c.x, o.y - c.y) < 0.24));
        centers.push(c);
      }
      pts = [];
      for (const c of centers) {
        const n = 50 + Math.floor(r() * 40);
        const sx = params.spread * (0.7 + r() * 0.6), sy = params.spread * (0.7 + r() * 0.6);
        for (let i = 0; i < n; i++) {
          const u = Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(TAU * r());
          const v = Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(TAU * r());
          pts.push({ x: Math.min(0.99, Math.max(0.01, c.x + u * sx)), y: Math.min(0.99, Math.max(0.01, c.y + v * sy)), c: -1 });
        }
      }
      start();
    }

    function start(forceRandom = false, seed) {
      const k = Math.round(params.k);
      const r = rng(seed);
      cents = [];
      if (params.init === 'pp' && !forceRandom) {
        cents.push({ ...pts[Math.floor(r() * pts.length)] });
        while (cents.length < k) {
          const d = pts.map((p) => Math.min(...cents.map((c) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2)));
          const tot = d.reduce((a, b) => a + b, 0);
          let t = r() * tot, i = 0;
          while (t > d[i] && i < d.length - 1) t -= d[i++];
          cents.push({ x: pts[i].x, y: pts[i].y });
        }
      } else for (let i = 0; i < k; i++) cents.push({ x: 0.1 + r() * 0.8, y: 0.1 + r() * 0.8 });
      for (const c of cents) (c.tx = c.x), (c.ty = c.y);
      for (const p of pts) p.c = -1;
      phase = 'assign';
      timer = 0.8;
      iter = 0;
      done = false;
      sErr.clear();
      regionKey = '';
    }

    function assign() {
      let changed = 0;
      for (const p of pts) {
        let best = 0, bd = Infinity;
        cents.forEach((c, j) => {
          const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
          if (d < bd) (bd = d), (best = j);
        });
        if (p.c !== best) changed++;
        p.c = best;
      }
      return changed;
    }
    function inertia() {
      let s = 0;
      for (const p of pts) if (p.c >= 0) s += (p.x - cents[p.c].x) ** 2 + (p.y - cents[p.c].y) ** 2;
      return s;
    }

    data(3);

    return {
      data,
      start,
      reset: () => start(),
      onParam(k) {
        if (k === 'k' || k === 'init') start();
        if (k === 'blobs' || k === 'spread') data();
      },
      pointerDown(p) {
        const b = box();
        const x = (p.x - b.x) / b.w, y = (p.y - b.y) / b.h;
        const hit = cents.findIndex((c) => Math.hypot((c.x - x) * b.w, (c.y - y) * b.h) < 22);
        if (hit >= 0) drag = hit;
        else if (x > 0 && x < 1 && y > 0 && y < 1) {
          for (let i = 0; i < 12; i++) pts.push({ x: Math.min(0.99, Math.max(0.01, x + randn() * 0.025)), y: Math.min(0.99, Math.max(0.01, y + randn() * 0.025)), c: -1 });
          done = false;
          phase = 'assign';
        }
      },
      pointerMove(p) {
        if (drag === null || !p.down) return;
        const b = box();
        const c = cents[drag];
        c.x = c.tx = Math.min(1, Math.max(0, (p.x - b.x) / b.w));
        c.y = c.ty = Math.min(1, Math.max(0, (p.y - b.y) / b.h));
        assign();
        done = false;
        regionKey = '';
      },
      pointerUp() {
        drag = null;
      },
      update(dt) {
        for (const c of cents) {
          c.x += (c.tx - c.x) * Math.min(1, dt * 5 * params.speed);
          c.y += (c.ty - c.y) * Math.min(1, dt * 5 * params.speed);
        }
        if (done || drag !== null) return;
        timer -= dt * params.speed;
        if (timer > 0) return;
        if (phase === 'assign') {
          for (const c of cents) (c.x = c.tx), (c.y = c.ty);
          const changed = assign();
          sErr.push(inertia() * 1000);
          iter++;
          if (changed === 0 && iter > 1) {
            done = true;
            return;
          }
          phase = 'update';
          timer = 1;
        } else {
          cents.forEach((c, j) => {
            let sx = 0, sy = 0, n = 0;
            for (const p of pts) if (p.c === j) (sx += p.x), (sy += p.y), n++;
            if (n) (c.tx = sx / n), (c.ty = sy / n);
            else (c.tx = rand(0.1, 0.9)), (c.ty = rand(0.1, 0.9));
          });
          phase = 'assign';
          timer = 1;
        }
        regionKey = '';
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0c1024' });
        const b = box();
        // territories (Voronoi) on a coarse grid
        if (params.regions && cents.length) {
          const key = cents.map((c) => c.x.toFixed(3) + c.y.toFixed(3)).join() + b.w + b.h;
          if (key !== regionKey) {
            regionKey = key;
            const gw = 90, gh = Math.max(20, Math.round((90 * b.h) / b.w));
            region = document.createElement('canvas');
            region.width = gw;
            region.height = gh;
            const g = region.getContext('2d');
            const im = g.createImageData(gw, gh);
            const rgb = PAL.map((c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]);
            for (let y = 0; y < gh; y++)
              for (let x = 0; x < gw; x++) {
                const px = (x + 0.5) / gw, py = (y + 0.5) / gh;
                let best = 0, bd = Infinity;
                cents.forEach((c, j) => {
                  const d = (px - c.x) ** 2 + (py - c.y) ** 2;
                  if (d < bd) (bd = d), (best = j);
                });
                const col = rgb[best % rgb.length], j = (y * gw + x) * 4;
                im.data[j] = col[0];
                im.data[j + 1] = col[1];
                im.data[j + 2] = col[2];
                im.data[j + 3] = 34;
              }
            g.putImageData(im, 0, 0);
          }
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(region, b.x, b.y, b.w, b.h);
          ctx.imageSmoothingEnabled = true;
        }
        // assignment lines while in the update phase
        if (phase === 'update' && !done) {
          ctx.lineWidth = 1;
          for (let j = 0; j < cents.length; j++) {
            ctx.strokeStyle = rgba(PAL[j % PAL.length], 0.2);
            ctx.beginPath();
            const [cx, cy] = toPx(cents[j]);
            for (const p of pts) {
              if (p.c !== j) continue;
              const [x, y] = toPx(p);
              ctx.moveTo(cx, cy);
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }
        // points, bucketed by colour
        const byC = new Map();
        for (const p of pts) {
          const k = p.c;
          if (!byC.has(k)) byC.set(k, []);
          byC.get(k).push(p);
        }
        for (const [k, arr] of byC) {
          ctx.fillStyle = k < 0 ? 'rgba(233,237,247,0.7)' : PAL[k % PAL.length];
          ctx.beginPath();
          for (const p of arr) {
            const [x, y] = toPx(p);
            ctx.moveTo(x + 3, y);
            ctx.arc(x, y, 3, 0, TAU);
          }
          ctx.fill();
        }
        // centres
        cents.forEach((c, j) => {
          const [x, y] = toPx(c);
          const col = PAL[j % PAL.length];
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, x, y, 30, col, 0.25);
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, TAU);
          ctx.stroke();
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        if (!api.thumbnail) tag(ctx, done ? `converged after ${iter} rounds` : `round ${iter} · ${phase === 'assign' ? 'assign points' : 'move centres'}`, w - 18, 84, done ? C.teal : C.ink, { align: 'right', size: 11 });
      },
      stats() {
        const sizes = cents.map((_, j) => pts.filter((p) => p.c === j).length);
        return [
          { label: 'Points', value: String(pts.length) },
          { label: 'Rounds', value: String(iter) },
          { label: 'Total squared distance', value: (inertia() * 1000).toFixed(1), color: C.amber },
          { label: 'Cluster sizes', value: sizes.join(' · ') },
        ];
      },
      charts() {
        return [{ title: 'Error after each round (lower is better)', series: [{ data: sErr.data, color: C.amber }], min: 0 }];
      },
    };
  },
};
