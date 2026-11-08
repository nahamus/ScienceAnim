import { C, TAU, clamp, tag, text, roundRect, rgba, FONT, MONO } from '../../core/util.js';

// Real attention arithmetic, at toy scale. Each word is a small hand-made vector (a real model learns
// thousands of dimensions); each head has its own query and key maps; attention is
// softmax(QKᵀ/√d) and the result is added back into the words' vectors before the next layer.
// Two layers are enough to resolve "it" the way the original Transformer paper's example does.

// vector layout
const SINK = 0, NOUN = 1, KA = 2, KB = 3, PRON = 4, ADJ_A = 5, ADJ_B = 6, VERB = 7, FUNC = 8, WANT_A = 9, WANT_B = 10;
const DIM = 11;
const D_HEAD = 4; // scores are divided by √d of the (notional) head size
const SHOWN = [NOUN, KA, KB, PRON, ADJ_A, ADJ_B, WANT_A, WANT_B]; // the cells drawn under each word

const SENTENCES = {
  tired: { words: 'The animal didn’t cross the street because it was too tired', a: 'living thing', b: 'place' },
  wide: { words: 'The animal didn’t cross the street because it was too wide', a: 'living thing', b: 'place' },
  big: { words: 'The trophy didn’t fit in the suitcase because it was too big', a: 'object', b: 'container' },
  small: { words: 'The trophy didn’t fit in the suitcase because it was too small', a: 'object', b: 'container' },
};
const FEATURES = {
  animal: [NOUN, KA], trophy: [NOUN, KA], street: [NOUN, KB], suitcase: [NOUN, KB],
  it: [PRON], tired: [ADJ_A], big: [ADJ_A], wide: [ADJ_B], small: [ADJ_B],
  cross: [VERB], fit: [VERB], was: [VERB],
};

function embed(key) {
  const toks = ['⟨start⟩', ...SENTENCES[key].words.split(' ')];
  return toks.map((w) => {
    const v = new Float64Array(DIM);
    if (w === '⟨start⟩') v[SINK] = 1;
    else for (const f of FEATURES[w.toLowerCase()] || [FUNC]) v[f] = 1;
    return { w, v };
  });
}

// Each head: query(x) and key(x) as sparse maps over the vector, plus what its values write back.
const HEADS = {
  prev: {
    layer: 1,
    label: 'Layer 1 · the word just before',
    // a purely positional head: a learned bias toward the previous position (no content)
    bias: (i, j) => (j === i - 1 ? 9 : j === 0 ? 3 : 0),
  },
  clue: {
    layer: 1,
    label: 'Layer 1 · find the describing word',
    q: (x) => ({ [SINK]: 8 - 6 * x[PRON], [ADJ_A]: 10 * x[PRON], [ADJ_B]: 10 * x[PRON] }),
    k: (x) => ({ [SINK]: x[SINK], [ADJ_A]: x[ADJ_A], [ADJ_B]: x[ADJ_B] }),
    // values: a describing word hands over "the thing I describe is of kind A / B"
    v: (x) => ({ [WANT_A]: x[ADJ_A], [WANT_B]: x[ADJ_B] }),
  },
  coref: {
    layer: 2,
    label: 'Layer 2 · what does “it” refer to?',
    q: (x) => ({
      [SINK]: 8 - 6 * x[PRON] - 6 * (x[ADJ_A] + x[ADJ_B]),
      [KA]: 5 * x[PRON] + 10 * x[WANT_A] + 12 * x[ADJ_A],
      [KB]: 5 * x[PRON] + 10 * x[WANT_B] + 12 * x[ADJ_B],
    }),
    k: (x) => ({ [SINK]: x[SINK], [KA]: x[KA], [KB]: x[KB] }),
  },
};

/** Attention weights for one head over a list of vectors. */
function attend(head, xs, causal) {
  const n = xs.length;
  const scores = [], weights = [];
  for (let i = 0; i < n; i++) {
    const row = new Float64Array(n);
    const q = head.q ? head.q(xs[i]) : null;
    for (let j = 0; j < n; j++) {
      if (causal && j > i) {
        row[j] = -Infinity;
        continue;
      }
      if (head.bias) row[j] = head.bias(i, j);
      else {
        const k = head.k(xs[j]);
        let s = 0;
        for (const d in q) s += q[d] * (k[d] || 0);
        row[j] = s / Math.sqrt(D_HEAD);
      }
    }
    const m = Math.max(...row);
    const e = row.map((s) => (s === -Infinity ? 0 : Math.exp(s - m)));
    const sum = e.reduce((a, b) => a + b, 0);
    scores.push(row);
    weights.push(e.map((x) => x / sum));
  }
  return { scores, weights };
}

/** Run the two layers; returns the vectors entering each layer and every head's attention. */
function run(sentence, causal) {
  const toks = embed(sentence);
  const x0 = toks.map((t) => t.v);
  const l1 = { prev: attend(HEADS.prev, x0, causal), clue: attend(HEADS.clue, x0, causal) };
  // residual stream: each word's vector plus what the clue head's values wrote into it
  const x1 = x0.map((x, i) => {
    const out = Float64Array.from(x);
    l1.clue.weights[i].forEach((a, j) => {
      const v = HEADS.clue.v(x0[j]);
      for (const d in v) out[d] += a * v[d];
    });
    return out;
  });
  const l2 = { coref: attend(HEADS.coref, x1, causal) };
  return { toks, x0, x1, heads: { ...l1, ...l2 } };
}

export default {
  id: 'transformer',
  title: 'How Transformers Pay Attention',
  category: 'ai',
  tagline: 'The idea inside ChatGPT, Claude and Gemini: every word looks at every other word to work out what it means.',
  ages: ['16+'],
  topics: ['Language models', 'Linear algebra'],
  keywords: ['attention', 'self-attention', 'gpt', 'bert', 'llm', 'query key value', 'qkv', 'transformer', 'heads'],
  blurb:
    'Since 2017 almost every large AI model has been a transformer. Its key trick is attention: each word asks a question (its query), every word offers a label (its key), and the better they match, the more information flows between them. Stack this in layers and words can resolve meaning from context, such as what “it” refers to. Here the arithmetic is real but the word vectors are tiny and hand-made, where a real model learns thousands of numbers per word.',
  ideas: [
    'Each word is a <b>vector</b> of numbers that encodes its meaning.',
    'Attention scores come from <b>query · key</b>; softmax turns each row into percentages.',
    'Each word then takes in a blend of the others’ <b>values</b>, weighted by attention.',
    'Many <b>heads</b> run side by side, and <b>layers</b> build on one another.',
    'GPT-style models use a <b>causal mask</b>: words may only look back.',
  ],
  hint: 'Click a query word to see where it looks',
  renderScale: 1,
  thumbChapter: 0,
  thumbFrames: 90,
  params: [
    { key: 'sentence', label: 'Sentence', type: 'select', value: 'tired', instant: true, options: [
      { value: 'tired', label: '…too tired' }, { value: 'wide', label: '…too wide' },
      { value: 'big', label: 'trophy…too big' }, { value: 'small', label: 'trophy…too small' },
    ] },
    { key: 'head', label: 'Attention head', type: 'select', value: 'coref', instant: true, options: Object.entries(HEADS).map(([k, h]) => ({ value: k, label: h.label })) },
    { key: 'causal', label: 'Causal mask (GPT-style: look back only)', type: 'toggle', value: false },
    { key: 'flow', label: 'Show information flowing', type: 'toggle', value: true },
    { key: 'vectors', label: 'Show word vectors', type: 'toggle', value: true },
    { key: 'focus', label: 'Query word', type: 'range', min: 0, max: 12, step: 1, value: 8, hidden: true, instant: true },
  ],
  story: [
    {
      title: 'Words looking at words',
      text: 'Inside a transformer, every word can look at every other word and take in some of its meaning. The lines show where the word “it” is looking: almost entirely at <b>“animal”</b>. That is how the model works out that the animal, not the street, was tired.',
      params: { sentence: 'tired', head: 'coref', causal: false, focus: 8, flow: true, vectors: true },
      duration: 13,
    },
    {
      title: 'Query, key, value',
      text: 'Each word makes three vectors: a <b>query</b> (what am I looking for?), a <b>key</b> (what do I offer?) and a <b>value</b> (what I pass on). A query·key score says how well two words match; softmax turns each row of scores into percentages that add up to 100%. The map on the right shows every word’s row. The live data panel breaks down the numbers.',
      formula: 'Attention(Q, K, V) = softmax(QKᵀ / √d) · V',
      params: { focus: 8 },
      duration: 16,
    },
    {
      title: 'Change one word',
      text: 'Now the street was too wide, and “it” switches to <b>“street”</b>. Nothing about “it” itself changed: its meaning comes entirely from context. The trophy-and-suitcase sentences in the controls work the same way.',
      check: {
        q: 'Change “tired” to “wide”. Where will “it” look now?',
        options: ['Still at “animal”', 'At “street”', 'At the word “wide”'],
        answer: 1,
        setup: { sentence: 'tired', head: 'coref', causal: false, focus: 8 },
        explain: 'A street can be wide but not tired, so the clue now points to the place. Same pronoun, different meaning: attention reads it from the context.',
      },
      params: { sentence: 'wide', head: 'coref', causal: false, focus: 8 },
      duration: 13,
    },
    {
      title: 'Clues pass through layers',
      text: 'How did “it” know? In <b>layer 1</b>, “it” looks at the describing word and copies a clue into its own vector: watch the amber cell light up under “it” (kind of thing wanted: place). <b>Layer 2</b> then uses that clue to pick the matching noun. Real models stack dozens of layers, each building on the last.',
      params: { sentence: 'wide', head: 'clue', focus: 8 },
      duration: 15,
    },
    {
      title: 'Many heads at once',
      text: 'Each layer runs many <b>heads</b> side by side, each with its own queries and keys. This one ignores meaning and just looks at the word before, a diagonal stripe in the map. Notice also how words with nothing to look for park their attention on the first token. Real models do this too: it is called an <b>attention sink</b>.',
      params: { head: 'prev', focus: 8 },
      duration: 14,
    },
    {
      title: 'Only looking back',
      text: 'GPT-style models write text left to right, so a <b>causal mask</b> hides every later word. When “it” is read, “tired” hasn’t arrived yet, so “it” can’t decide and splits its attention. The model settles it one step later, at “tired”, which looks back at “animal”. Click “tired” to see.',
      check: {
        q: 'GPT-style models can only look back. With the causal mask on, where does “it” look in layer 2?',
        options: ['Mostly at “animal”', 'Mostly at “street”', 'Split between “animal” and “street”'],
        answer: 2,
        setup: { sentence: 'tired', head: 'coref', causal: false, focus: 8 },
        explain: 'The clue (“tired”) comes after “it”, so the mask hides it. With no clue, “animal” and “street” score exactly the same. The ambiguity is resolved later in the sentence.',
      },
      params: { sentence: 'tired', head: 'coref', causal: true, focus: 8 },
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Click any word in the top row to see where it looks. Switch heads and sentences, and toggle the causal mask. Try the trophy that didn’t fit in the suitcase.',
      params: { sentence: 'big', head: 'coref', causal: false, focus: 8 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let model = null, key = '', particles = [], qPos = [], kPos = [];

    function ensure() {
      const k = params.sentence + '|' + params.causal;
      if (k === key) return;
      key = k;
      model = run(params.sentence, params.causal);
    }
    const focus = () => clamp(Math.round(params.focus), 0, model.toks.length - 1);
    const head = () => HEADS[params.head] || HEADS.coref;
    const att = () => model.heads[params.head] || model.heads.coref;
    const vectorsIn = () => (head().layer === 2 ? model.x1 : model.x0);

    const geom = () => {
      const { w, h } = api;
      const n = model.toks.length;
      const wide = w >= 640;
      if (wide) {
        // queries along the top, keys along the middle; the map sits bottom-right, clear of the story
        const left = 36, right = w - 36;
        const step = (right - left) / n;
        const qy = Math.max(118, h * 0.2), ky = Math.max(qy + 130, h * 0.47);
        const map = { size: Math.min(w * 0.3, h * 0.36, 250) };
        map.x = w - map.size - 26;
        map.y = h - map.size - 30;
        return { wide, n, step, qy, ky, map, xs: (i) => left + step * (i + 0.5) };
      }
      // phones: two columns of words, queries left, keys right
      const top = 76, bottom = h - 56; // clear of the hint along the bottom
      const step = (bottom - top) / n;
      return { wide, n, step, lx: w * 0.3, rx: w * 0.7, ys: (i) => top + step * (i + 0.5) };
    };

    function spawn(dt) {
      if (!params.flow) {
        particles.length = 0;
        return;
      }
      const a = att().weights[focus()];
      a.forEach((wt, j) => {
        if (wt < 0.04) return;
        if (Math.random() < wt * dt * 14) particles.push({ j, t: 0, wt });
      });
      for (const p of particles) p.t += dt * 0.9;
      particles = particles.filter((p) => p.t < 1);
    }

    return {
      onParam(k) {
        if (k === 'sentence' || k === 'causal') particles.length = 0;
        if (k === 'focus' || k === 'head') particles.length = 0;
      },
      pointerDown(p) {
        ensure();
        const g = geom();
        let best = -1, bd = Infinity;
        for (let i = 0; i < g.n; i++) {
          const [x, y] = g.wide ? [g.xs(i), g.qy] : [g.lx, g.ys(i)];
          const d = g.wide ? Math.abs(p.x - x) + (Math.abs(p.y - y) < 60 ? 0 : 999) : Math.abs(p.y - y) + (p.x < api.w / 2 ? 0 : 999);
          if (d < bd) (bd = d), (best = i);
        }
        if (best >= 0 && bd < 200) api.runner.set('focus', best);
      },
      update(dt) {
        ensure();
        spawn(Math.min(dt, 0.05));
      },
      draw() {
        ensure();
        const { w, h } = api;
        const g = geom();
        const A = att().weights, S = att().scores, f = focus(), n = g.n;
        ctx.fillStyle = '#05070f';
        ctx.fillRect(0, 0, w, h);

        qPos = model.toks.map((_, i) => (g.wide ? [g.xs(i), g.qy] : [g.lx, g.ys(i)]));
        kPos = model.toks.map((_, i) => (g.wide ? [g.xs(i), g.ky] : [g.rx, g.ys(i)]));
        const curve = (i, j) => {
          const [x1, y1] = qPos[i], [x2, y2] = kPos[j];
          return g.wide ? [x1, y1 + 16, x1, (y1 + y2) / 2, x2, (y1 + y2) / 2, x2, y2 - 16] : [x1 + 8, y1, (x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2 - 8, y2];
        };
        const bez = (c, t) => {
          const u = 1 - t;
          return [u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6], u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7]];
        };

        // every word's attention, faint; the focused word's, bright
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            const a = A[i][j];
            if (a < 0.03) continue;
            const c = curve(i, j);
            const on = i === f;
            ctx.strokeStyle = on ? rgba('#38d6f5', 0.25 + 0.75 * a) : rgba('#5b8cff', a * 0.13);
            ctx.lineWidth = on ? 1 + a * 9 : 1;
            ctx.beginPath();
            ctx.moveTo(c[0], c[1]);
            ctx.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
            ctx.stroke();
          }
        // values flowing from keys back to the query
        ctx.globalCompositeOperation = 'lighter';
        for (const p of particles) {
          const [x, y] = bez(curve(f, p.j), 1 - p.t);
          ctx.fillStyle = rgba('#ffd27a', 0.35 + 0.65 * p.wt);
          ctx.beginPath();
          ctx.arc(x, y, 1.5 + 2.5 * p.wt, 0, TAU);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';

        // words
        const fs = g.wide ? clamp(g.step * 0.2, 11, 15) : clamp(g.step * 0.45, 11, 14);
        const drawWord = (i, [x, y], role) => {
          const wd = model.toks[i].w;
          ctx.font = `${role === 'q' && i === f ? 700 : 500} ${fs}px ${FONT}`;
          ctx.textAlign = g.wide ? 'center' : role === 'q' ? 'right' : 'left';
          ctx.textBaseline = 'middle';
          const tw = ctx.measureText(wd).width;
          const bx = g.wide ? x - tw / 2 - 6 : role === 'q' ? x - tw - 6 : x - 6;
          if (role === 'q' && i === f) {
            ctx.fillStyle = 'rgba(56,214,245,0.16)';
            roundRect(ctx, bx, y - fs * 0.9, tw + 12, fs * 1.8, 7);
            ctx.fill();
          }
          const a = role === 'k' ? A[f][i] : 1;
          const masked = role === 'k' && S[f][i] === -Infinity;
          ctx.fillStyle = masked ? 'rgba(233,237,247,0.18)' : role === 'k' ? rgba('#e9edf7', 0.35 + 0.65 * Math.min(1, a * 2.5)) : i === f ? C.cyan : C.ink;
          ctx.fillText(wd, x, y);
          if (role === 'k' && a >= 0.05 && !api.thumbnail) {
            ctx.font = `500 ${Math.max(9, fs - 3)}px ${MONO}`;
            ctx.fillStyle = C.amber;
            const lbl = `${Math.round(a * 100)}%`;
            if (g.wide) ctx.fillText(lbl, x, y + fs + 4);
            else {
              ctx.textAlign = 'left';
              ctx.fillText(lbl, x + tw + 6, y);
            }
          }
        };
        model.toks.forEach((_, i) => drawWord(i, qPos[i], 'q'));
        model.toks.forEach((_, i) => drawWord(i, kPos[i], 'k'));

        // each word's vector (the cells it carries into this layer); amber = clues written by layer 1
        if (params.vectors && !api.thumbnail) {
          const xs = vectorsIn();
          // phones: the cells sit in the margin left of the longest word
          ctx.font = `500 ${fs}px ${FONT}`;
          const longest = Math.max(...model.toks.map((t) => ctx.measureText(t.w).width));
          const room = g.wide ? 0 : g.lx - longest - 16;
          const cell = g.wide ? clamp(g.step / 11, 3, 7) : clamp(room / SHOWN.length, 2, 6);
          xs.forEach((v, i) => {
            const [x, y] = g.wide ? [qPos[i][0], qPos[i][1] - fs - 8] : [Math.max(4 + SHOWN.length * cell, g.lx - longest - 12), qPos[i][1]];
            const x0 = g.wide ? x - (SHOWN.length * cell) / 2 : x - SHOWN.length * cell;
            SHOWN.forEach((d, k) => {
              const val = clamp(v[d], 0, 1);
              const clue = d === WANT_A || d === WANT_B;
              ctx.fillStyle = val > 0.02 ? rgba(clue ? '#ffb547' : '#38d6f5', 0.25 + 0.75 * val) : 'rgba(255,255,255,0.06)';
              ctx.fillRect(x0 + k * cell, y - cell / 2, cell - 1, cell - 1);
            });
          });
        }

        if (!api.thumbnail) {
          const meta = SENTENCES[params.sentence];
          if (g.wide) {
            text(ctx, 'queries: the word that is looking', 36, g.qy - fs - (params.vectors ? 30 : 18), { size: 11, color: C.dim });
            text(ctx, 'keys & values: the words it can look at', 36, g.ky + fs + 22, { size: 11, color: C.dim });
          }
          tag(ctx, head().label + (params.causal ? ' · causal' : ''), w - 16, g.wide ? 84 : 58, C.cyan, { align: 'right' });
          if (params.vectors && g.wide) {
            text(ctx, `cells above each query word = its vector: noun · ${meta.a} · ${meta.b} · pronoun · describes ${meta.a} · describes ${meta.b} · clue → ${meta.a} · clue → ${meta.b}`, 36, g.ky + fs + 40, { size: 10, color: C.dim });
          }
        }

        // the full attention map (rows = queries, columns = keys)
        if (g.wide && !api.thumbnail) {
          const { x, y, size } = g.map;
          const c = size / n;
          text(ctx, 'attention map', x, y - 12, { size: 11, color: C.dim });
          for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++) {
              const masked = S[i][j] === -Infinity;
              ctx.fillStyle = masked ? 'rgba(255,255,255,0.03)' : rgba(i === f ? '#38d6f5' : '#5b8cff', 0.05 + 0.95 * Math.sqrt(A[i][j]));
              ctx.fillRect(x + j * c, y + i * c, c - 1, c - 1);
            }
          ctx.strokeStyle = C.cyan;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - 1, y + f * c - 1, size + 1, c + 1);
        }
      },
      stats() {
        ensure();
        const f = focus();
        const a = att().weights[f], s = att().scores[f];
        const order = Array.from(a, (v, j) => [v, j]).sort((p, q) => q[0] - p[0]).slice(0, 3);
        const out = [{ label: 'Query word', value: model.toks[f].w, color: C.cyan }];
        for (const [v, j] of order) {
          if (v < 0.01) continue;
          out.push({ label: `→ “${model.toks[j].w}”`, value: `score ${s[j].toFixed(1)} → ${(v * 100).toFixed(0)}%`, color: C.amber });
        }
        return out;
      },
      charts() {
        ensure();
        const f = focus();
        return [{ title: `Where “${model.toks[f].w}” looks (each key word, left to right)`, kind: 'bars', series: [{ data: Array.from(att().weights[f]), color: C.cyan }], min: 0, max: 1 }];
      },
    };
  },
};
