import { C, roundRect, text } from '../../core/util.js';

// Each algorithm is a generator over an array-like view that yields operations.
const ALGOS = {
  bubble: {
    name: 'Bubble sort', big: 'O(n²)',
    *run(a) {
      const n = a.length;
      for (let i = 0; i < n; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
          yield ['cmp', j, j + 1];
          if (a[j] > a[j + 1]) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]];
            swapped = true;
            yield ['swap', j, j + 1];
          }
        }
        yield ['done', n - i - 1];
        if (!swapped) break;
      }
    },
  },
  insertion: {
    name: 'Insertion sort', big: 'O(n²)',
    *run(a) {
      for (let i = 1; i < a.length; i++) {
        let j = i;
        while (j > 0) {
          yield ['cmp', j - 1, j];
          if (a[j - 1] <= a[j]) break;
          [a[j - 1], a[j]] = [a[j], a[j - 1]];
          yield ['swap', j - 1, j];
          j--;
        }
      }
    },
  },
  selection: {
    name: 'Selection sort', big: 'O(n²)',
    *run(a) {
      for (let i = 0; i < a.length; i++) {
        let m = i;
        for (let j = i + 1; j < a.length; j++) {
          yield ['cmp', m, j];
          if (a[j] < a[m]) m = j;
        }
        if (m !== i) {
          [a[i], a[m]] = [a[m], a[i]];
          yield ['swap', i, m];
        }
        yield ['done', i];
      }
    },
  },
  merge: {
    name: 'Merge sort', big: 'O(n log n)',
    *run(a) {
      function* ms(lo, hi) {
        if (hi - lo < 2) return;
        const mid = (lo + hi) >> 1;
        yield* ms(lo, mid);
        yield* ms(mid, hi);
        const tmp = [];
        let i = lo, j = mid;
        while (i < mid && j < hi) {
          yield ['cmp', i, j];
          tmp.push(a[i] <= a[j] ? a[i++] : a[j++]);
        }
        while (i < mid) tmp.push(a[i++]);
        while (j < hi) tmp.push(a[j++]);
        for (let k = 0; k < tmp.length; k++) {
          a[lo + k] = tmp[k];
          yield ['set', lo + k];
        }
      }
      yield* ms(0, a.length);
    },
  },
  quick: {
    name: 'Quicksort', big: 'O(n log n)',
    *run(a) {
      function* qs(lo, hi) {
        if (lo >= hi) return;
        const mid = (lo + hi) >> 1;
        [a[mid], a[hi]] = [a[hi], a[mid]];
        yield ['swap', mid, hi];
        const pv = a[hi];
        let i = lo;
        for (let j = lo; j < hi; j++) {
          yield ['cmp', j, hi];
          if (a[j] < pv) {
            [a[i], a[j]] = [a[j], a[i]];
            yield ['swap', i, j];
            i++;
          }
        }
        [a[i], a[hi]] = [a[hi], a[i]];
        yield ['swap', i, hi];
        yield* qs(lo, i - 1);
        yield* qs(i + 1, hi);
      }
      yield* qs(0, a.length - 1);
    },
  },
  heap: {
    name: 'Heapsort', big: 'O(n log n)',
    *run(a) {
      const n = a.length;
      function* sift(start, end) {
        let root = start;
        while (2 * root + 1 <= end) {
          let child = 2 * root + 1, sw = root;
          yield ['cmp', sw, child];
          if (a[sw] < a[child]) sw = child;
          if (child + 1 <= end) {
            yield ['cmp', sw, child + 1];
            if (a[sw] < a[child + 1]) sw = child + 1;
          }
          if (sw === root) return;
          [a[root], a[sw]] = [a[sw], a[root]];
          yield ['swap', root, sw];
          root = sw;
        }
      }
      for (let s = (n >> 1) - 1; s >= 0; s--) yield* sift(s, n - 1);
      for (let end = n - 1; end > 0; end--) {
        [a[0], a[end]] = [a[end], a[0]];
        yield ['swap', 0, end];
        yield ['done', end];
        yield* sift(0, end - 1);
      }
    },
  },
};

function makeData(n, order) {
  const a = Array.from({ length: n }, (_, i) => (i + 1) / n);
  if (order === 'reversed') return a.reverse();
  if (order === 'nearly') {
    for (let k = 0; k < n * 0.06; k++) {
      const i = Math.floor(Math.random() * (n - 3));
      [a[i], a[i + 2]] = [a[i + 2], a[i]];
    }
    return a;
  }
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default {
  id: 'sorting',
  title: 'The Great Sorting Race',
  category: 'cs',
  tagline: 'Bubble, merge, quick and heap sort race on the same data. Clever beats brute force.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Algorithms'],
  blurb:
    'Putting things in order is one of computing’s most common jobs. There are dozens of ways to do it, and the difference between a naive method and a clever one can be a billion-fold on large data. Watch algorithms compete on identical inputs and count every comparison they make.',
  ideas: [
    'Simple methods like bubble sort compare roughly <b>n²</b> pairs — 100× more data means 10,000× more work.',
    '<b>Divide and conquer</b> algorithms (merge sort, quicksort) need only about <b>n log n</b> comparisons.',
    'The best algorithm depends on the data: insertion sort is excellent on nearly-sorted input.',
    'No comparison-based sort can beat n log n on average — it’s a proven speed limit.',
  ],
  thumbChapter: 2,
  thumbFrames: 120,
  params: [
    { key: 'mode', label: 'View', type: 'select', value: 'single', options: [{ value: 'single', label: 'One algorithm' }, { value: 'race', label: 'Race' }] },
    { key: 'algo', label: 'Algorithm', type: 'select', value: 'bubble', options: Object.entries(ALGOS).map(([k, v]) => ({ value: k, label: v.name.replace(' sort', '') })) },
    { key: 'n', label: 'Items', type: 'range', min: 10, max: 300, step: 1, value: 40, instant: true },
    { key: 'order', label: 'Starting order', type: 'select', value: 'random', options: [{ value: 'random', label: 'Random' }, { value: 'nearly', label: 'Nearly sorted' }, { value: 'reversed', label: 'Reversed' }] },
    { key: 'ops', label: 'Steps per second', type: 'range', min: 5, max: 3000, step: 5, value: 60 },
    { key: 'sound', label: 'Sound', type: 'toggle', value: false },
    { key: 'shuffle', label: 'Shuffle & restart', type: 'button', action: (s) => s.start() },
  ],
  story: [
    {
      title: 'Bubble sort',
      text: 'The simplest idea: walk along the line comparing neighbours, swapping any pair that’s out of order. The biggest values “bubble” to the end. White marks the pair being compared.',
      params: { mode: 'single', algo: 'bubble', n: 40, order: 'random', ops: 60 },
      enter: (s) => s.start(),
      duration: 13,
    },
    {
      title: 'Slow at scale',
      text: 'Bubble sort makes about <b>n²/2</b> comparisons. Sorting 40 items took hundreds; sorting a million would take half a trillion.',
      formula: 'comparisons ≈ n² / 2',
      params: { mode: 'single', algo: 'bubble', n: 120, ops: 1500 },
      enter: (s) => s.start(),
      duration: 11,
    },
    {
      title: 'The race',
      text: 'Six algorithms, identical shuffled data, the same number of steps per second. Watch the comparison counters. The <b>n log n</b> algorithms finish while bubble sort is barely started.',
      params: { mode: 'race', n: 100, order: 'random', ops: 450 },
      enter: (s) => s.start(),
      duration: 18,
    },
    {
      title: 'Divide and conquer',
      text: '<b>Merge sort</b> splits the list in half, sorts each half, then merges them. <b>Quicksort</b> picks a pivot and splits around it. Each halving adds just one more level of work.',
      formula: 'comparisons ≈ n · log₂ n',
      params: { mode: 'single', algo: 'merge', n: 120, ops: 300 },
      enter: (s) => s.start(),
      duration: 14,
    },
    {
      title: 'It depends on the data',
      text: 'On <b>nearly sorted</b> data, humble insertion sort finishes almost instantly, while others still do their full work. Real libraries mix algorithms to get the best of each.',
      params: { mode: 'race', n: 100, order: 'nearly', ops: 450 },
      enter: (s) => s.start(),
      duration: 15,
    },
    {
      title: 'Your race',
      text: 'Choose the size, the starting order and the speed. Turn on sound to hear the “sound of sorting”.',
      params: { mode: 'race', order: 'random', n: 150, ops: 800 },
      enter: (s) => s.start(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let lanes = [], acc = 0, audio = null, beepT = 0;

    function lane(key, data) {
      const a = data.slice();
      return { key, a, gen: ALGOS[key].run(a), cmp: 0, wr: 0, hi: [], done: false, sorted: new Set(), finishAt: 0 };
    }
    function start() {
      const data = makeData(Math.round(params.n), params.order);
      lanes = params.mode === 'race' ? Object.keys(ALGOS).map((k) => lane(k, data)) : [lane(params.algo, data)];
      acc = 0;
    }
    start();
    function beep(v) {
      if (!params.sound) return;
      if (!audio) {
        try {
          audio = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
          return;
        }
      }
      if (api.time - beepT < 0.03) return;
      beepT = api.time;
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'triangle';
      o.frequency.value = 160 + v * 900;
      g.gain.setValueAtTime(0.06, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.08);
      o.connect(g).connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + 0.09);
    }

    return {
      start,
      reset: start,
      onParam(k) {
        if (k === 'mode' || k === 'algo' || k === 'n' || k === 'order') start();
      },
      update(dt) {
        acc += dt * params.ops;
        const steps = Math.floor(acc);
        acc -= steps;
        for (const L of lanes) {
          if (L.done) continue;
          L.hi = [];
          for (let s = 0; s < steps; s++) {
            const r = L.gen.next();
            if (r.done) {
              L.done = true;
              L.finishAt = api.time;
              L.hi = [];
              break;
            }
            const [op, i, j] = r.value;
            if (op === 'cmp') L.cmp++;
            else if (op === 'swap') L.wr += 2;
            else if (op === 'set') L.wr++;
            else if (op === 'done') {
              L.sorted.add(i);
              continue;
            }
            L.hi = [op, i, j];
          }
          if (L.hi[1] !== undefined && lanes.length === 1) beep(L.a[L.hi[1]]);
        }
        if (lanes.length > 1 && params.sound) {
          const active = lanes.find((l) => !l.done && l.hi[1] !== undefined);
          if (active) beep(active.a[active.hi[1]]);
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#05060d';
        ctx.fillRect(0, 0, w, h);
        const race = lanes.length > 1;
        const cols = race ? (w >= 640 ? 3 : 2) : 1;
        const rows = Math.ceil(lanes.length / cols);
        const padX = 26, padTop = 96, padBot = api.thumbnail ? 30 : race ? 210 : 230;
        const cw = (w - padX * (cols + 1)) / cols;
        const ch = (h - padTop - padBot - (rows - 1) * 34) / rows;
        const order = lanes.slice().sort((a, b) => (a.done && b.done ? a.finishAt - b.finishAt : a.done ? -1 : b.done ? 1 : 0));
        lanes.forEach((L, idx) => {
          const cx = padX + (idx % cols) * (cw + padX);
          const cy = padTop + Math.floor(idx / cols) * (ch + 34);
          if (race) {
            ctx.fillStyle = 'rgba(255,255,255,0.025)';
            roundRect(ctx, cx - 8, cy - 26, cw + 16, ch + 34, 12);
            ctx.fill();
            const place = L.done ? order.indexOf(L) + 1 : 0;
            text(ctx, `${ALGOS[L.key].name}`, cx, cy - 12, { size: 13, weight: 600, color: L.done ? C.teal : C.ink, shadow: false });
            text(ctx, `${L.cmp.toLocaleString()} cmp${place ? `  ·  #${place}` : ''}`, cx + cw, cy - 12, { size: 11, mono: true, align: 'right', color: L.done ? C.teal : C.dim, shadow: false });
          }
          const n = L.a.length;
          const bw = cw / n;
          const [op, i, j] = L.hi;
          for (let k = 0; k < n; k++) {
            const v = L.a[k];
            const bh = v * ch;
            let col = `hsl(${280 - v * 250},85%,${L.done ? 62 : 55}%)`;
            if (k === i || k === j) col = op === 'cmp' ? '#ffffff' : '#ff5fa2';
            ctx.fillStyle = col;
            const gap = bw > 4 ? 1 : 0;
            ctx.fillRect(cx + k * bw, cy + ch - bh, Math.max(0.8, bw - gap), bh);
          }
          if (!race && !api.thumbnail) {
            text(ctx, ALGOS[L.key].name, cx, cy - 22, { size: 18, weight: 600 });
            text(ctx, ALGOS[L.key].big, cx + 150, cy - 22, { size: 13, mono: true, color: C.pink });
          }
        });
      },
      stats() {
        if (lanes.length === 1) {
          const L = lanes[0], n = L.a.length;
          return [
            { label: 'Comparisons', value: L.cmp.toLocaleString() },
            { label: 'Writes', value: L.wr.toLocaleString() },
            { label: 'n² / 2', value: Math.round((n * n) / 2).toLocaleString() },
            { label: 'n log₂ n', value: Math.round(n * Math.log2(n)).toLocaleString() },
          ];
        }
        return lanes.map((L) => ({ label: ALGOS[L.key].name, value: L.cmp.toLocaleString(), color: L.done ? C.teal : undefined }));
      },
      charts() {
        if (lanes.length < 2) return [];
        return [{ title: 'Comparisons so far', kind: 'bars', series: [{ data: lanes.map((l) => l.cmp), color: '#ff5fa2' }], min: 0, xLabel: lanes.map((l) => ALGOS[l.key].name.split(' ')[0].slice(0, 5)).join(' · ') }];
      },
      destroy() {
        audio?.close();
      },
    };
  },
};
