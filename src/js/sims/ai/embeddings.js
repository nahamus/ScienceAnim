import { C, TAU, clamp, seeded, drawGlow, tag, text, rgba, arrow, FONT } from '../../core/util.js';

// Word vectors at toy scale. Each word gets 26 hand-labelled numbers (person? royal? female? a
// capital? past tense? …) plus a little random jitter, so analogies come out close but not exact.
// Real models learn hundreds to thousands of unlabelled numbers per word from billions of words.
// The 2D map is a live PCA projection: the flat "shadow" of the vectors that keeps the most spread.

const DIMS = [
  'person', 'royal', 'male', 'female', 'young', 'animal', 'pet', 'farm', 'dog-like', 'cat-like', 'cow-like', 'sheep-like',
  'place', 'capital city', 'country', 'Europe', 'Asia', 'Africa', 'French', 'Italian', 'Japanese', 'German', 'Egyptian',
  'action', 'past tense', 'movement',
];
const D = Object.fromEntries(DIMS.map((d, i) => [d, i]));

const WORDS = {
  people: {
    man: ['person', 'male'], woman: ['person', 'female'], boy: ['person', 'male', 'young'], girl: ['person', 'female', 'young'],
    king: ['person', 'royal', 'male'], queen: ['person', 'royal', 'female'], prince: ['person', 'royal', 'male', 'young'],
    princess: ['person', 'royal', 'female', 'young'], child: ['person', 'young'],
  },
  places: {
    france: ['place', 'country', 'Europe', 'French'], paris: ['place', 'capital city', 'Europe', 'French'],
    italy: ['place', 'country', 'Europe', 'Italian'], rome: ['place', 'capital city', 'Europe', 'Italian'],
    germany: ['place', 'country', 'Europe', 'German'], berlin: ['place', 'capital city', 'Europe', 'German'],
    japan: ['place', 'country', 'Asia', 'Japanese'], tokyo: ['place', 'capital city', 'Asia', 'Japanese'],
    egypt: ['place', 'country', 'Africa', 'Egyptian'], cairo: ['place', 'capital city', 'Africa', 'Egyptian'],
  },
  animals: {
    dog: ['animal', 'pet', 'dog-like'], puppy: ['animal', 'pet', 'dog-like', 'young'],
    cat: ['animal', 'pet', 'cat-like'], kitten: ['animal', 'pet', 'cat-like', 'young'],
    cow: ['animal', 'farm', 'cow-like'], calf: ['animal', 'farm', 'cow-like', 'young'],
    sheep: ['animal', 'farm', 'sheep-like'], lamb: ['animal', 'farm', 'sheep-like', 'young'],
  },
  verbs: {
    walk: ['action', 'movement'], walked: ['action', 'movement', 'past tense'],
    swim: ['action', 'movement', 'animal'], swam: ['action', 'movement', 'animal', 'past tense'],
    run: ['action', 'movement', 'young'], ran: ['action', 'movement', 'young', 'past tense'],
    eat: ['action', 'farm'], ate: ['action', 'farm', 'past tense'],
  },
};
// small secondary features, so related groups overlap a little as real meanings do
const EXTRA = { swim: { 'movement': 0.6 }, swam: { 'movement': 0.6 }, eat: { animal: 0.3 }, ate: { animal: 0.3 }, child: { male: 0.4, female: 0.4 } };

const GROUP_COLORS = { people: '#ff5fa2', places: '#38d6f5', animals: '#a3e635', verbs: '#ffb547' };

const ANALOGIES = {
  none: null,
  royal: { a: 'man', b: 'king', c: 'woman', want: 'queen', group: 'people' },
  young: { a: 'man', b: 'boy', c: 'woman', want: 'girl', group: 'people' },
  capital: { a: 'france', b: 'paris', c: 'italy', want: 'rome', group: 'places' },
  capital2: { a: 'germany', b: 'berlin', c: 'japan', want: 'tokyo', group: 'places' },
  baby: { a: 'dog', b: 'puppy', c: 'cat', want: 'kitten', group: 'animals' },
  past: { a: 'walk', b: 'walked', c: 'swim', want: 'swam', group: 'verbs' },
};

function build() {
  const r = seeded(11);
  const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(TAU * r());
  const list = [];
  for (const [group, words] of Object.entries(WORDS))
    for (const [w, feats] of Object.entries(words)) {
      const v = new Float64Array(DIMS.length);
      for (const f of feats) v[D[f]] = 1;
      for (const [f, x] of Object.entries(EXTRA[w] || {})) v[D[f]] = Math.max(v[D[f]], x);
      for (let i = 0; i < v.length; i++) v[i] += gauss() * 0.09;
      list.push({ w, group, v });
    }
  return list;
}

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const norm = (a) => Math.sqrt(dot(a, a));
const cos = (a, b) => dot(a, b) / (norm(a) * norm(b));

/** Top-2 principal components of a set of vectors (power iteration with deflation). */
function pca(vs) {
  const n = vs.length, d = vs[0].length;
  const mean = new Float64Array(d);
  for (const v of vs) for (let i = 0; i < d; i++) mean[i] += v[i] / n;
  const X = vs.map((v) => v.map((x, i) => x - mean[i]));
  const cov = Array.from({ length: d }, () => new Float64Array(d));
  for (const x of X) for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) cov[i][j] += (x[i] * x[j]) / n;
  const comps = [];
  for (let c = 0; c < 2; c++) {
    let v = new Float64Array(d).map((_, i) => Math.sin(i * 1.7 + c * 3.1) + 1.1);
    for (let it = 0; it < 200; it++) {
      const u = new Float64Array(d);
      for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) u[i] += cov[i][j] * v[j];
      for (const p of comps) {
        const k = dot(u, p);
        for (let i = 0; i < d; i++) u[i] -= k * p[i];
      }
      const m = norm(u) || 1;
      v = u.map((x) => x / m);
    }
    comps.push(v);
  }
  return { mean, comps };
}

export default {
  id: 'embeddings',
  title: 'Word Embeddings: Meaning as Directions',
  category: 'ai',
  tagline: 'Turn words into lists of numbers and king − man + woman lands on queen.',
  ages: ['14-16', '16+'],
  topics: ['Language models', 'Vectors'],
  keywords: ['word2vec', 'embedding', 'vectors', 'semantic', 'cosine similarity', 'analogy', 'king queen', 'pca'],
  blurb:
    'Computers only handle numbers, so every language model begins by turning each word into a long list of them: an embedding. Words used in similar ways get similar lists, and differences between lists capture relationships: the step from “man” to “king” is about the same as from “woman” to “queen”. Here each word has 26 hand-labelled numbers; real models learn hundreds or thousands from billions of sentences.',
  ideas: [
    'An <b>embedding</b> is a list of numbers (a vector) standing for a word.',
    'Similar words have vectors pointing the same way: <b>cosine similarity</b> measures it.',
    'Relationships become <b>directions</b>: male→female, country→capital, present→past.',
    'The 2D map is a <b>projection</b> (PCA), a shadow of many dimensions.',
    'Every LLM starts with an embedding table, and learned embeddings can absorb the <b>biases</b> of their training text.',
  ],
  hint: 'Click a word to see its nearest neighbours',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 60,
  params: [
    { key: 'group', label: 'Words shown', type: 'select', value: 'people', instant: true, options: [
      { value: 'people', label: 'People' }, { value: 'places', label: 'Places' }, { value: 'animals', label: 'Animals' },
      { value: 'verbs', label: 'Verbs' }, { value: 'all', label: 'All' },
    ] },
    { key: 'analogy', label: 'Vector sum', type: 'select', value: 'none', instant: true, options: [
      { value: 'none', label: 'None' }, { value: 'royal', label: 'king − man + woman' }, { value: 'young', label: 'boy − man + woman' },
      { value: 'capital', label: 'paris − france + italy' }, { value: 'capital2', label: 'berlin − germany + japan' },
      { value: 'baby', label: 'puppy − dog + cat' }, { value: 'past', label: 'walked − walk + swim' },
    ] },
    { key: 'neighbours', label: 'Nearest neighbours to show', type: 'range', min: 0, max: 6, step: 1, value: 3 },
    { key: 'labels', label: 'Show all labels', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'Words as lists of numbers',
      text: 'A language model can’t read letters, so each word becomes a list of numbers: its <b>embedding</b>. Here each word has 26 numbers (is it a person? royal? female? young?). Words with similar meanings get similar lists, so they land close together. The map is a 2D shadow of those 26 dimensions.',
      params: { group: 'all', analogy: 'none', neighbours: 0, labels: true },
      enter: (s) => s.select(null),
      duration: 13,
    },
    {
      title: 'Nearby means similar',
      text: 'Pick a word and the lines show its nearest neighbours, measured by <b>cosine similarity</b>: how closely two vectors point the same way (1 = identical direction, 0 = unrelated). “cat” sits beside “kitten” and “dog”; “paris” beside “rome” and “france”.',
      formula: 'cos θ = a·b ÷ (|a| |b|)',
      params: { group: 'all', analogy: 'none', neighbours: 4 },
      enter: (s) => s.select('cat'),
      duration: 14,
    },
    {
      title: 'Directions carry meaning',
      text: 'Now the people. The arrow from “man” to “king” is the direction of <b>royalty</b>. Start at “woman”, take the same step, and you land right beside “queen”. The difference between two vectors captures a relationship, and it works anywhere in the space.',
      check: {
        q: 'Take the vector for king, subtract man and add woman. Which word is nearest?',
        options: ['prince', 'queen', 'princess', 'woman'],
        answer: 1,
        setup: { group: 'people', analogy: 'none', neighbours: 0 },
        explain: 'king − man leaves “royal” on its own; adding woman gives royal + female + person, which is exactly what queen means here. (As word2vec does, the three input words are excluded from the answer.)',
      },
      params: { group: 'people', analogy: 'royal', neighbours: 0 },
      enter: (s) => s.select(null),
      duration: 15,
    },
    {
      title: 'Countries and capitals',
      text: 'The same trick finds capital cities. “paris − france” is the direction from a country to its capital; add it to “italy” and you land on <b>rome</b>. Researchers found real learned embeddings doing this in 2013 without anyone telling them what a capital is.',
      params: { group: 'places', analogy: 'capital', neighbours: 0 },
      enter: (s) => s.select(null),
      duration: 14,
    },
    {
      title: 'Grammar is a direction too',
      text: '“walked − walk” points from present to past tense. Add it to “swim” and you reach <b>swam</b>. Young animals work the same way: puppy − dog + cat lands on kitten. These relationships are what the next layers of a language model build on.',
      params: { group: 'verbs', analogy: 'past', neighbours: 0 },
      enter: (s) => s.select(null),
      duration: 14,
    },
    {
      title: 'Inside every LLM',
      text: 'The first layer of every language model is an embedding table like this, only far bigger: tens of thousands of tokens, each with thousands of learned numbers. Because they are learned from human writing, embeddings also soak up its <b>biases</b> (for example linking jobs to one gender), which engineers must measure and reduce.',
      params: { group: 'all', analogy: 'royal', neighbours: 0 },
      enter: (s) => s.select(null),
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Choose a group and a vector sum, or click any word to see its neighbours.',
      params: { group: 'animals', analogy: 'baby', neighbours: 3 },
      enter: (s) => s.select('puppy'),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const ALL = build();
    let view = null, viewKey = '', selected = null, layout = new Map(), anim = 0, viewStart = 0;

    const shown = () => (params.group === 'all' ? ALL : ALL.filter((x) => x.group === params.group));
    const byWord = (w) => ALL.find((x) => x.w === w);

    function ensureView() {
      const an = ANALOGIES[params.analogy];
      const k = params.group + '|' + (an ? an.group : '');
      if (k === viewKey) return;
      viewKey = k;
      // include the analogy's group so its words are on the map
      let words = shown();
      if (an && params.group !== 'all' && an.group !== params.group) words = [...words, ...ALL.filter((x) => x.group === an.group)];
      const P = pca(words.map((x) => x.v));
      const proj = (v) => P.comps.map((c) => dot(c, v.map((x, i) => x - P.mean[i])));
      const pts = words.map((x) => proj(x.v));
      // the vector sum's landing point must fit on the map too
      if (an) {
        const v = (w) => ALL.find((x) => x.w === w).v;
        pts.push(proj(v(an.b).map((x, i) => x - v(an.a)[i] + v(an.c)[i])));
      }
      const ext = [0, 1].map((d) => Math.max(...pts.map((p) => Math.abs(p[d]))) || 1);
      view = { words, proj, ext };
      viewStart = performance.now();
    }

    /** Nearest words to a vector by cosine similarity, excluding some. */
    function nearest(v, k, exclude = []) {
      return ALL.filter((x) => !exclude.includes(x.w))
        .map((x) => ({ x, s: cos(v, x.v) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, k);
    }

    function analogy() {
      const an = ANALOGIES[params.analogy];
      if (!an) return null;
      const A = byWord(an.a).v, B = byWord(an.b).v, Cv = byWord(an.c).v;
      const target = B.map((x, i) => x - A[i] + Cv[i]);
      const top = nearest(target, 3, [an.a, an.b, an.c]);
      return { an, target, top };
    }

    const geom = () => {
      const { w, h } = api;
      const narrow = w < 600;
      // keep the map clear of the story card (bottom-left on wide screens)
      const box = narrow ? { x: 24, y: 70, w: w - 48, h: h - 100 } : { x: Math.max(60, w * 0.08), y: 96, w: w * 0.84, h: h * 0.56 };
      return { narrow, box };
    };
    const toPx = (p, g) => {
      const { box } = g;
      return [box.x + box.w / 2 + (p[0] / view.ext[0]) * box.w * 0.46, box.y + box.h / 2 - (p[1] / view.ext[1]) * box.h * 0.44];
    };

    return {
      select(w) {
        selected = w;
      },
      onParam(k) {
        if (k === 'group' || k === 'analogy') ensureView();
      },
      pointerDown(p) {
        ensureView();
        let best = null, bd = 30;
        for (const [w, [x, y]] of layout) {
          const d = Math.hypot(p.x - x, p.y - y);
          if (d < bd) (bd = d), (best = w);
        }
        selected = best;
        if (best && params.neighbours === 0) api.runner.set('neighbours', 3);
      },
      update() {
        ensureView();
      },
      draw() {
        ensureView();
        // the fly-in runs on the wall clock, so it also plays while the sim is paused (quick checks)
        anim = api.thumbnail ? 1 : Math.min(1, (performance.now() - viewStart) / 700);
        const { w, h } = api;
        const g = geom();
        ctx.fillStyle = '#05070f';
        ctx.fillRect(0, 0, w, h);
        // axes through the origin of the projection
        const [ox, oy] = toPx([0, 0], g);
        ctx.strokeStyle = 'rgba(140,160,220,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(g.box.x, oy);
        ctx.lineTo(g.box.x + g.box.w, oy);
        ctx.moveTo(ox, g.box.y);
        ctx.lineTo(ox, g.box.y + g.box.h);
        ctx.stroke();

        layout = new Map();
        const ease = 1 - (1 - anim) ** 3;
        for (const x of view.words) {
          const p = view.proj(x.v);
          const [px, py] = toPx([p[0] * ease, p[1] * ease], g);
          layout.set(x.w, [px, py]);
        }

        // nearest-neighbour lines from the selected word
        if (selected && params.neighbours > 0 && layout.has(selected)) {
          const sv = byWord(selected).v;
          const [sx, sy] = layout.get(selected);
          for (const { x, s } of nearest(sv, Math.round(params.neighbours), [selected])) {
            if (!layout.has(x.w)) continue;
            const [px, py] = layout.get(x.w);
            ctx.strokeStyle = rgba('#e9edf7', 0.15 + 0.6 * clamp(s, 0, 1));
            ctx.lineWidth = 1 + 2 * clamp(s, 0, 1);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(px, py);
            ctx.stroke();
            if (!api.thumbnail) text(ctx, s.toFixed(2), (sx + px) / 2, (sy + py) / 2 - 7, { size: 10, color: C.dim, align: 'center' });
          }
        }

        // the vector sum: a → b, then the same step from c
        const res = analogy();
        if (res && layout.has(res.an.a) && layout.has(res.an.b) && layout.has(res.an.c)) {
          const [ax, ay] = layout.get(res.an.a), [bx, by] = layout.get(res.an.b), [cx, cy] = layout.get(res.an.c);
          const t = clamp((anim - 0.2) / 0.8, 0, 1);
          arrow(ctx, ax, ay, ax + (bx - ax) * t, ay + (by - ay) * t, C.amber, 2.2, 10);
          const tx = cx + (bx - ax), ty = cy + (by - ay);
          ctx.setLineDash([5, 5]);
          arrow(ctx, cx, cy, cx + (tx - cx) * t, cy + (ty - cy) * t, C.amber, 2.2, 10);
          ctx.setLineDash([]);
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, tx, ty, 26 * t, C.amber, 0.25);
          ctx.globalCompositeOperation = 'source-over';
          const win = res.top[0].x.w;
          if (layout.has(win) && t >= 1) {
            const [wx, wy] = layout.get(win);
            ctx.strokeStyle = C.teal;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(wx, wy, 13, 0, TAU);
            ctx.stroke();
          }
          if (!api.thumbnail) {
            const { an } = res;
            tag(ctx, `${an.b} − ${an.a} + ${an.c} ≈ ${res.top[0].x.w}  (${res.top[0].s.toFixed(2)})`, w - 16, g.narrow ? 58 : 84, C.amber, { align: 'right', size: 12 });
          }
        }

        // the words
        const inSum = res ? [res.an.a, res.an.b, res.an.c] : [];
        for (const x of view.words) {
          const [px, py] = layout.get(x.w);
          const col = GROUP_COLORS[x.group];
          const hot = x.w === selected || inSum.includes(x.w) || (res && anim >= 1 && res.top[0].x.w === x.w);
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, px, py, hot ? 18 : 11, col, 0.3);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(px, py, hot ? 4.5 : 3, 0, TAU);
          ctx.fill();
          if (params.labels || hot) {
            ctx.font = `${hot ? 700 : 500} ${g.narrow ? 11 : 13}px ${FONT}`;
            ctx.fillStyle = hot ? C.ink : rgba('#e9edf7', 0.75);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(x.w, px + 8, py - 1);
          }
        }
        if (!api.thumbnail && !g.narrow) text(ctx, 'a 2D shadow (PCA) of 26-number word vectors', g.box.x, g.box.y + g.box.h + 18, { size: 11, color: C.dim });

      },
      stats() {
        ensureView();
        const out = [];
        const res = analogy();
        if (res) {
          out.push({ label: 'Vector sum', value: `${res.an.b} − ${res.an.a} + ${res.an.c}`, color: C.amber });
          res.top.forEach(({ x, s }, i) => out.push({ label: i ? `then` : 'Nearest word', value: `${x.w} · ${s.toFixed(2)}`, color: i ? C.dim : C.teal }));
        }
        if (selected) {
          out.push({ label: 'Selected', value: selected, color: C.pink });
          for (const { x, s } of nearest(byWord(selected).v, 3, [selected])) out.push({ label: `≈ ${x.w}`, value: s.toFixed(2) });
        }
        if (!out.length) out.push({ label: 'Words on the map', value: String(view.words.length) });
        return out;
      },
      charts() {
        const w = selected || ANALOGIES[params.analogy]?.c;
        if (!w) return null;
        const v = byWord(w).v;
        return [{ title: `The 26 numbers for “${w}”`, kind: 'bars', series: [{ data: Array.from(v, (x) => Math.max(0, x)), color: GROUP_COLORS[byWord(w).group] }], min: 0, max: 1.2 }];
      },
    };
  },
};
