import { C, tag, text, Series, roundRect, FONT, MONO } from '../../core/util.js';

// A real (tiny) language model: word-level trigram counts from the little corpus below, smoothed with
// bigram and unigram counts. It only ever looks two words back, where an LLM looks back thousands of
// tokens through a transformer, but the sampling step at the end is exactly the one LLMs use:
// logits ÷ temperature → softmax → optional top-k / top-p cut-off → draw at random.

const CORPUS = `
the cat sat on the mat . the cat sat on the warm windowsill . the cat chased the mouse across the kitchen .
the cat chased the ball of wool . the cat slept in the sun all afternoon . the cat watched the birds in the garden .
the dog sat on the mat . the dog chased the cat around the garden . the dog chased the ball across the park .
the dog barked at the postman . the dog slept by the fire . the dog dug a hole in the garden .
the mouse ran across the kitchen floor . the mouse hid behind the old sofa . the mouse ate the cheese .
the moon rose over the quiet sea . the moon is a ball of grey rock . the moon pulls the tides of the sea .
the moon was bright and full tonight . the stars shone over the quiet town . the stars are distant suns .
the sun is a star made of hot gas . the sun rose over the hills . the sun warms the sea and the land .
the sea was calm and blue . the sea was wild and grey in the storm . the ocean is deep and dark and cold .
the ocean covers most of the planet . the ocean is full of strange fish . the fish swam deep in the ocean .
the storm rolled in from the sea . the rain fell on the quiet town all night . the wind blew across the hills .
the ship sailed across the sea at night . the ship sailed into the storm . the old ship sank in the storm .
once upon a time there was a little cat . once upon a time there was a brave knight . once upon a time a dragon lived in the hills .
the knight rode across the hills . the knight fought the dragon in the storm . the dragon slept on a pile of gold .
the dragon flew over the town at night . the little cat lived in the old house by the sea .
the robot learned to read . the robot learned to paint the sea . the robot watched the stars all night .
the computer learned from a lot of text . the model reads the words and guesses the next word .
the next word is chosen at random . the next word depends on the words before it .
i like the cat . i like the sea . i like to read about the stars . i like to watch the storm from the window .
we sailed across the sea to the little town . we watched the moon rise over the sea .
`;

const PROMPTS = {
  cat: 'the cat',
  moon: 'the moon',
  once: 'once upon',
  robot: 'the robot',
  sea: 'the sea',
};

function train() {
  const words = CORPUS.trim().split(/\s+/);
  const uni = new Map(), bi = new Map(), tri = new Map();
  const bump = (m, k, w) => {
    let t = m.get(k);
    if (!t) m.set(k, (t = new Map()));
    t.set(w, (t.get(w) || 0) + 1);
  };
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    uni.set(w, (uni.get(w) || 0) + 1);
    if (i >= 1) bump(bi, words[i - 1], w);
    if (i >= 2) bump(tri, words[i - 2] + ' ' + words[i - 1], w);
  }
  const total = words.length;
  const vocab = [...uni.keys()];
  return { uni, bi, tri, total, vocab };
}

/** Next-word distribution given the last two words: interpolated trigram / bigram / unigram. */
function nextProbs(M, a, b) {
  const t = M.tri.get(a + ' ' + b), g = M.bi.get(b);
  const sum = (m) => [...m.values()].reduce((x, y) => x + y, 0);
  const tT = t ? sum(t) : 0, gT = g ? sum(g) : 0;
  const [lt, lg, lu] = t ? [0.8, 0.17, 0.03] : g ? [0, 0.93, 0.07] : [0, 0, 1];
  const out = [];
  for (const w of M.vocab) {
    const p = lt * ((t?.get(w) || 0) / (tT || 1)) + lg * ((g?.get(w) || 0) / (gT || 1)) + lu * (M.uni.get(w) / M.total);
    out.push({ w, logit: Math.log(p) });
  }
  return out;
}

/** The LLM sampling step: temperature, softmax, then top-k and top-p (nucleus) cut-offs. */
function shape(cands, T, k, p) {
  const z = cands.map((c) => c.logit / Math.max(T, 0.02));
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  const list = cands.map((c, i) => ({ ...c, p: e[i] / s })).sort((a, b) => b.p - a.p);
  // raw probabilities at temperature 1, for comparison
  const z1 = cands.map((c) => c.logit), m1 = Math.max(...z1);
  const e1 = new Map(cands.map((c) => [c.w, Math.exp(c.logit - m1)]));
  const s1 = [...e1.values()].reduce((a, b) => a + b, 0);
  let cum = 0;
  list.forEach((c, i) => {
    c.p1 = e1.get(c.w) / s1;
    c.kept = (!k || i < k) && cum < p;
    cum += c.p;
  });
  const keptSum = list.filter((c) => c.kept).reduce((a, c) => a + c.p, 0);
  list.forEach((c) => (c.q = c.kept ? c.p / keptSum : 0));
  return list;
}

export default {
  id: 'llm-sampling',
  title: 'How a Chatbot Chooses Its Next Word',
  category: 'ai',
  tagline: 'Language models write one word at a time by rolling weighted dice. Temperature sets how wild the dice are.',
  ages: ['14-16', '16+'],
  topics: ['Language models', 'Probability'],
  keywords: ['llm', 'chatgpt', 'gpt', 'claude', 'temperature', 'top-p', 'nucleus sampling', 'next token', 'autocomplete'],
  blurb:
    'A large language model never plans a whole sentence. It reads the text so far, gives every possible next word a probability, picks one at random according to those probabilities, adds it to the text and repeats. Settings like temperature and top-p reshape the probabilities before the pick, trading predictability for surprise.',
  ideas: [
    'A language model outputs a <b>probability for every possible next word</b>, then one is drawn at random.',
    'Text is generated <b>one word at a time</b>: each choice becomes part of the input for the next.',
    '<b>Temperature</b> sharpens (low) or flattens (high) the probabilities.',
    '<b>Top-k</b> and <b>top-p</b> cut off the unlikely tail so a high temperature stays sensible.',
  ],
  hint: 'Click a word bar to choose the next word yourself',
  renderScale: 1,
  thumbChapter: 1,
  thumbFrames: 420,
  params: [
    { key: 'prompt', label: 'Prompt', type: 'select', value: 'cat', instant: true, options: Object.entries(PROMPTS).map(([k, v]) => ({ value: k, label: `“${v}…”` })) },
    { key: 'temp', label: 'Temperature', type: 'range', min: 0.05, max: 2.5, step: 0.05, value: 1 },
    { key: 'topk', label: 'Top-k (0 = off)', type: 'range', min: 0, max: 30, step: 1, value: 0 },
    { key: 'topp', label: 'Top-p (nucleus)', type: 'range', min: 0.05, max: 1, step: 0.05, value: 1 },
    { key: 'speed', label: 'Words per second', type: 'range', min: 0.3, max: 8, step: 0.1, value: 1.2 },
    { key: 'restart', label: 'Start again', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'Guess the next word',
      text: 'The bars show the model’s probabilities for the next word after “the cat”. This little model learned them from a few dozen sentences and only looks back two words. A real LLM learns from trillions of words and looks back thousands, but it ends every step the same way: with a probability for each possible next word.',
      params: { prompt: 'cat', temp: 1, topk: 0, topp: 1, speed: 0.6 },
      enter: (s) => s.restart(),
      duration: 14,
    },
    {
      title: 'Roll the weighted dice',
      text: 'The next word is drawn <b>at random</b>, with likely words more likely to be drawn. The pick is added to the text, and the model goes again from the new last words. Run it twice and you get two different stories, which is why a chatbot gives a different answer every time you ask.',
      params: { speed: 1.4 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Cold: always the safest word',
      text: 'At a temperature near zero the top word always wins. With no randomness the model falls into a rut, repeating the same likely phrase forever. Real chatbots run at a low but non-zero temperature for exactly this reason.',
      check: {
        q: 'Turn the temperature down to almost zero, so the most likely word always wins. What happens to the text?',
        options: ['It gets more creative', 'It repeats itself in loops', 'It stops after one word'],
        answer: 1,
        setup: { temp: 1, topk: 0, topp: 1, speed: 1.4 },
        explain: 'With no randomness the same two words always lead to the same next word, so the text soon walks into a loop it can never leave, like “the cat sat on the mat . the cat sat on the mat …”.',
      },
      params: { temp: 0.05, topk: 0, topp: 1, speed: 2.5 },
      enter: (s) => s.restart(),
      duration: 14,
    },
    {
      title: 'Hot: anything goes',
      text: 'Raise the temperature and the probabilities flatten out. Rare words get a real chance, the text becomes surprising and soon stops making sense. Temperature divides the model’s raw scores (<b>logits</b>) before they are turned into probabilities.',
      formula: 'pᵢ = e^(zᵢ / T) ÷ Σⱼ e^(zⱼ / T)',
      params: { temp: 2.2, topk: 0, topp: 1, speed: 2.2 },
      enter: (s) => s.restart(),
      duration: 14,
    },
    {
      title: 'Trim the tail',
      text: 'The fix is to cut off the long tail of unlikely words before drawing. <b>Top-k</b> keeps only the k most likely words; <b>top-p</b> keeps the smallest set whose probabilities add up to p. Greyed-out bars can no longer be drawn. Now a warm temperature gives variety without nonsense.',
      params: { temp: 1.4, topk: 0, topp: 0.75, speed: 1.8 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Pick a prompt and play with temperature, top-k and top-p. Click any bar to choose the next word yourself. You are now the model.',
      params: { prompt: 'once', temp: 0.9, topk: 0, topp: 0.9, speed: 1.2 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const M = train();
    let words = [], dist = [], spin = null, acc = 0, hold = 0, layoutBars = [];
    const probSeries = new Series(60), entSeries = new Series(60);
    const MAX_WORDS = 34;

    function restart() {
      words = PROMPTS[params.prompt].split(' ').map((w) => ({ w, prompt: true }));
      spin = null;
      acc = 0;
      hold = 0;
      probSeries.clear();
      entSeries.clear();
      refresh();
    }

    function refresh() {
      const n = words.length;
      const raw = nextProbs(M, words[n - 2]?.w ?? '.', words[n - 1].w);
      dist = shape(raw, params.temp, Math.round(params.topk), params.topp);
    }

    /** Draw a word from the shaped distribution and start the "dice roll" animation toward it. */
    function roll(forced) {
      const kept = dist.filter((c) => c.kept);
      let pick = forced;
      if (!pick) {
        let r = Math.random(), i = 0;
        while (i < kept.length - 1 && r > kept[i].q) r -= kept[i++].q;
        pick = kept[i];
      }
      spin = { pick, t: 0, dur: Math.min(0.9, 0.7 / Math.max(params.speed, 0.6) + 0.15), forced: !!forced };
    }

    function commit() {
      const { pick } = spin;
      words.push({ w: pick.w, p: pick.q });
      probSeries.push(pick.q);
      const H = -dist.reduce((a, c) => a + (c.q > 0 ? c.q * Math.log2(c.q) : 0), 0);
      entSeries.push(H);
      spin = null;
      refresh();
    }

    restart();

    // wide: text on the left, bars on the right (clear of the story card, bottom-left);
    // narrow: text on top, bars underneath
    const layout = () => {
      const { w, h } = api;
      const narrow = w < 600;
      const side = w >= 700;
      const top = narrow ? 72 : 132;
      const textBox = side ? { x: 36, y: top, w: w * 0.44 - 36 } : { x: narrow ? 16 : 36, y: top, w: w - (narrow ? 32 : 72) };
      const bars = side ? { left: w * 0.5, right: w - 24, top } : { left: narrow ? 16 : 36, right: w - (narrow ? 16 : 36), top: narrow ? h * 0.42 : h * 0.4 };
      return { narrow, side, textBox, bars };
    };

    return {
      restart,
      reset: restart,
      onParam(k) {
        if (k === 'prompt') restart();
        else if (!spin) refresh();
      },
      pointerDown(p) {
        const hit = layoutBars.find((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
        if (hit && !spin && words.length < MAX_WORDS) roll(hit.c);
      },
      update(dt) {
        if (spin) {
          spin.t += dt;
          if (spin.t >= spin.dur) commit();
          return;
        }
        if (words.length >= MAX_WORDS) {
          hold += dt;
          if (hold > 3) restart();
          return;
        }
        acc += dt * params.speed;
        if (acc >= 1) {
          acc = 0;
          roll();
        }
      },
      draw() {
        const { w, h } = api;
        const L = layout();
        ctx.fillStyle = '#05070f';
        ctx.fillRect(0, 0, w, h);

        // ---- the generated text, wrapped
        const fs = L.narrow ? 15 : 19;
        ctx.font = `500 ${fs}px ${FONT}`;
        let x = L.textBox.x, y = L.textBox.y;
        const lineH = fs * 1.75, space = ctx.measureText(' ').width;
        const n = words.length;
        words.forEach((wd, i) => {
          const str = wd.w;
          const ww = ctx.measureText(str).width;
          if (x + ww > L.textBox.x + L.textBox.w) {
            x = L.textBox.x;
            y += lineH;
          }
          const ctxWord = i >= n - 2; // the two words the model is looking at
          if (ctxWord) {
            ctx.fillStyle = 'rgba(56,214,245,0.13)';
            roundRect(ctx, x - 4, y - fs * 0.8, ww + 8, fs * 1.6, 6);
            ctx.fill();
          }
          ctx.fillStyle = wd.prompt ? C.dim : wd.p !== undefined && wd.p < 0.08 ? C.pink : C.ink;
          ctx.textBaseline = 'middle';
          ctx.fillText(str, x, y);
          x += ww + space * 1.4;
        });
        // the word being chosen: a blinking slot / the rolling pick
        if (n < MAX_WORDS) {
          const label = spin ? (spin.t > spin.dur * 0.55 ? spin.pick.w : dist[Math.floor(spin.t * 30) % Math.min(6, dist.length)].w) : '▍';
          const ww = ctx.measureText(label).width;
          if (x + ww > L.textBox.x + L.textBox.w) {
            x = L.textBox.x;
            y += lineH;
          }
          ctx.fillStyle = spin ? C.amber : `rgba(255,181,71,${0.4 + 0.4 * Math.sin(api.time * 6)})`;
          ctx.fillText(label, x, y);
        }

        // ---- probability bars for the next word
        const shown = dist.slice(0, L.narrow ? 8 : 10);
        const top = L.side ? L.bars.top : Math.max(L.bars.top, y + 40);
        const rowH = Math.min(L.narrow ? 26 : 30, (h - top - (L.side ? 60 : 30)) / shown.length);
        const labelW = L.narrow ? 92 : 120;
        const bx = L.bars.left + labelW;
        const bw = Math.min(L.bars.right - bx - 54, 520);
        const pmax = Math.max(shown[0]?.q ?? 1, shown[0]?.p1 ?? 0, 0.05);
        layoutBars = [];
        if (!api.thumbnail) text(ctx, `next word after “${words.slice(-2).map((x) => x.w).join(' ')}”`, bx, top - 16, { size: 12, color: C.dim });
        shown.forEach((c, i) => {
          const yy = top + i * rowH;
          const picked = spin && spin.pick.w === c.w;
          ctx.font = `500 ${L.narrow ? 12 : 13}px ${MONO}`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = c.kept ? (picked ? C.amber : C.ink) : 'rgba(233,237,247,0.3)';
          ctx.fillText(c.w === '.' ? '. (end)' : c.w, bx - 10, yy + rowH / 2);
          ctx.textAlign = 'left';
          // ghost outline: the probability at temperature 1, before any shaping
          ctx.strokeStyle = 'rgba(233,237,247,0.25)';
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(bx, yy + 4, (c.p1 / pmax) * bw, rowH - 8);
          ctx.setLineDash([]);
          const len = (c.q / pmax) * bw;
          const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
          grad.addColorStop(0, picked ? C.amber : C.cyan);
          grad.addColorStop(1, picked ? '#ffd27a' : C.blue);
          ctx.fillStyle = c.kept ? grad : 'rgba(233,237,247,0.08)';
          roundRect(ctx, bx, yy + 4, Math.max(c.kept ? 2 : 0, len), rowH - 8, 4);
          ctx.fill();
          ctx.font = `500 11px ${MONO}`;
          ctx.fillStyle = c.kept ? C.dim : 'rgba(233,237,247,0.25)';
          ctx.fillText(c.kept ? `${(c.q * 100).toFixed(c.q < 0.1 ? 1 : 0)}%` : 'cut', bx + Math.max(len, (c.p1 / pmax) * bw) + 8, yy + rowH / 2);
          layoutBars.push({ x: L.narrow ? 0 : bx - labelW, y: yy, w: bw + labelW, h: rowH, c });
        });
        if (!api.thumbnail) {
          const rest = dist.slice(shown.length).filter((c) => c.kept).length;
          text(ctx, `+ ${dist.length - shown.length} more words${rest ? ` (${rest} still possible)` : ''}`, bx, top + shown.length * rowH + 12, { size: 11, color: C.dim });
          tag(ctx, `T = ${params.temp.toFixed(2)}${params.topk ? ` · top-k ${params.topk}` : ''}${params.topp < 1 ? ` · top-p ${params.topp.toFixed(2)}` : ''}`, w - 16, 84, C.amber, { align: 'right' });
          if (!L.narrow) text(ctx, 'dashed: probability at temperature 1', w - 16, h - 18, { size: 10, color: C.dim, align: 'right' });
        }
      },
      stats() {
        const H = -dist.reduce((a, c) => a + (c.q > 0 ? c.q * Math.log2(c.q) : 0), 0);
        return [
          { label: 'Words written', value: String(words.filter((x) => !x.prompt).length) },
          { label: 'Top word chance', value: `${((dist[0]?.q ?? 0) * 100).toFixed(0)}%`, color: C.cyan },
          { label: 'Words still possible', value: String(dist.filter((c) => c.kept).length), color: C.amber },
          { label: 'Uncertainty (entropy)', value: `${H.toFixed(2)} bits`, color: C.pink },
        ];
      },
      charts() {
        return [
          { title: 'Chance of each chosen word', series: [{ data: probSeries.data, color: C.cyan }], min: 0, max: 1, length: MAX_WORDS, kind: 'bars' },
          { title: 'Uncertainty before each pick (bits)', series: [{ data: entSeries.data, color: C.pink }], min: 0, length: MAX_WORDS },
        ];
      },
    };
  },
};
