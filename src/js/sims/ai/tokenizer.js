import { C, clamp, rgba, text, tag, backdrop, roundRect, MONO } from '../../core/util.js';

// Byte-pair encoding, the way GPT-style tokenizers are built. The training text is split into
// words (a leading space stays attached), every word starts as single characters, and the most
// frequent neighbouring pair across the whole text is glued into a new token, over and over.
// The base vocabulary is the 256 byte values, so any character outside the training text
// (accents, Chinese) still encodes, as its raw UTF-8 bytes. Everything here is computed live.

const CORPUS = `The model reads text as a list of numbers. Before a language model can learn anything, the text has to be cut into pieces called tokens. A token can be a whole word, part of a word, a single letter or a mark like a comma. The model never sees the letters themselves; it only sees the number of each token.
How do we choose the pieces? One simple idea is to use every letter as a token. That works, but then the model has to read a very long list of tokens for every sentence, and it has to learn again and again that the letters t, h and e often come together. Another idea is to use every word as a token. That makes the lists short, but there are far too many words, and the model would have no token at all for a new word, a name or a typing mistake.
Byte pair encoding sits between the two. It starts with single letters and looks through a large amount of training text. It counts every pair of neighbours and finds the pair that appears most often. That pair is glued together into one new token, and the counting starts again. After thousands of steps, the most common words are single tokens, while rare words are built from a few common pieces. The word the is learned early. A long word that is rarely seen is still split into parts.
We trained the tokenizer on this very text, so the words it has seen many times become tokens first. A real tokenizer learns from billions of words in many languages and keeps going until it has about one hundred thousand tokens.
Tokens explain some odd things that chatbots do. Ask a model how many times the letter r appears in the word strawberry and it may get the answer wrong. It does not see the letters s, t, r, a, w, b, e, r, r and y. It sees a few token numbers, perhaps one for straw and one for berry, and has to remember how each one is spelled. Strawberry, strawberries, blueberry and raspberry all hide their letters in the same way. The model learned the meaning of the pieces, not the letters inside them.
Numbers are cut in strange places too. The year 2024 may be one token or two, and a long number like 1234567 is split into chunks that do not line up with thousands. In 1990 there were no such models. By 2000 and 2010 they were small, and by 2020 and 2023 they were huge. In 2024 a model could read a whole book of 100000 tokens at once. Prices like 19 or 99 and years like 1999 or 2021 are common, so the tokenizer learns them, but most numbers are not.
Text in other languages is often cut into many more pieces than English when the tokenizer was trained mostly on English. Every token costs the same amount of computing, so the same message can cost more and fill the memory of the model faster. Modern tokenizers are trained on text from many languages to make this fairer.
The model reads the tokens one at a time and predicts the next token. Then it adds that token to the text and predicts the next one, and the next, until the answer is finished. Every word you read from a chatbot was written one token at a time.`;

const SAMPLES = {
  english: 'The model learned to predict the next word, one token at a time.',
  spelling: 'How many times does the letter r appear in strawberry?',
  numbers: 'In 2024 the price rose from 1,234,567 to 9,876,543 dollars.',
  spanish: 'El modelo aprendió a predecir la próxima palabra.',
  chinese: '模型学会了预测下一个词。',
};
const MAXM = 280;
const PRE = /\s?\p{L}+|\s?\p{N}+|\s?[^\s\p{L}\p{N}]+|\s+/gu;
const SEP = '\u0000';
const enc = new TextEncoder();
const CHIP = ['#5b8cff', '#ff8a3d', '#2ee6a6', '#ff5fa2', '#a78bfa', '#ffb547'];

function train() {
  const counts = new Map();
  for (const m of CORPUS.match(PRE)) counts.set(m, (counts.get(m) || 0) + 1);
  const words = [...counts].map(([wd, n]) => ({ s: [...wd], n }));
  const merges = [];
  while (merges.length < MAXM) {
    const pc = new Map();
    for (const w of words) for (let i = 0; i < w.s.length - 1; i++) {
      const k = w.s[i] + SEP + w.s[i + 1];
      pc.set(k, (pc.get(k) || 0) + w.n);
    }
    let best = null, bc = 1;
    for (const [k, c] of pc) if (c > bc) (best = k), (bc = c);
    if (!best) break;
    const [a, b] = best.split(SEP);
    merges.push({ a, b, ab: a + b, count: bc });
    for (const w of words) {
      const s = [];
      for (let i = 0; i < w.s.length; i++) {
        if (i < w.s.length - 1 && w.s[i] === a && w.s[i + 1] === b) s.push(a + b), i++;
        else s.push(w.s[i]);
      }
      w.s = s;
    }
  }
  return merges;
}

const MERGES = train();
const RANK = new Map(MERGES.map((m, r) => [m.a + SEP + m.b, r]));
const ID = new Map();
MERGES.forEach((m, r) => ID.has(m.ab) || ID.set(m.ab, 256 + r));

/** Encode `str` with the first k merges. Tokens: { s, id, byte } */
function encode(str, k) {
  const out = [];
  for (const piece of str.match(PRE) || []) {
    let s = [];
    for (const ch of piece) {
      const code = ch.codePointAt(0);
      if (code < 128) s.push(ch);
      else for (const b of enc.encode(ch)) s.push({ byte: b });
    }
    for (;;) {
      let bi = -1, br = k;
      for (let i = 0; i < s.length - 1; i++) {
        if (typeof s[i] !== 'string' || typeof s[i + 1] !== 'string') continue;
        const r = RANK.get(s[i] + SEP + s[i + 1]);
        if (r !== undefined && r < br) (br = r), (bi = i);
      }
      if (bi < 0) break;
      s.splice(bi, 2, s[bi] + s[bi + 1]);
    }
    for (const t of s) {
      if (typeof t === 'string') out.push({ s: t, id: t.length === 1 ? t.charCodeAt(0) : ID.get(t) });
      else out.push({ s: t.byte.toString(16).toUpperCase().padStart(2, '0'), id: t.byte, byte: true });
    }
  }
  return out;
}

const vocabAt = (k) => 256 + new Set(MERGES.slice(0, k).map((m) => m.ab)).size;
const show = (s) => s.replace(/ /g, '·').replace(/\n/g, '⏎');

export default {
  id: 'tokenizer',
  title: 'How AI Reads Text: Tokens',
  category: 'ai',
  tagline: 'Watch byte-pair encoding glue letters into the word pieces a language model actually reads.',
  ages: ['14-16', '16+'],
  topics: ['Language models', 'Data'],
  keywords: ['tokenizer', 'tokenization', 'tokens', 'bpe', 'byte pair encoding', 'vocabulary', 'llm', 'gpt', 'chatgpt', 'strawberry', 'subword', 'unicode', 'utf-8'],
  blurb:
    'A language model never sees letters. Its text is first chopped into <b>tokens</b>, word pieces with ID numbers. GPT-style models build their pieces with <b>byte-pair encoding</b>: start with single characters, then repeatedly glue together the pair of neighbours that appears most often in the training text. Here a real BPE tokenizer learns 280 merges from a page of English, live, and you can see how it cuts up different kinds of text.',
  ideas: [
    'Start with <b>single characters</b> (really the 256 possible bytes), so any text can be encoded.',
    'Count every neighbouring pair in the training text and <b>merge the most frequent</b> into a new token. Repeat.',
    'Common words become one token; rare words are built from a few <b>common pieces</b>.',
    'The model sees only the <b>token IDs</b>, which is why chatbots can struggle to count letters or do arithmetic.',
    'Languages the tokenizer saw less often are split into <b>more tokens</b>, so they cost more to process.',
  ],
  hint: 'Drag the merges slider, or press Learn from scratch',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 420,
  params: [
    {
      key: 'text', label: 'Text to tokenize', type: 'select', value: 'english',
      options: [{ value: 'english', label: 'English' }, { value: 'spelling', label: 'Spelling' }, { value: 'numbers', label: 'Numbers' }, { value: 'spanish', label: 'Spanish' }, { value: 'chinese', label: 'Chinese' }],
    },
    { key: 'merges', label: 'Merges learned', type: 'range', min: 0, max: MAXM, step: 1, value: MAXM },
    { key: 'ids', label: 'Show token IDs', type: 'toggle', value: true },
    { key: 'learn', label: 'Learn from scratch', type: 'button', action: (sim) => sim.learn(0, MAXM, 16) },
  ],
  story: [
    {
      title: 'Computers don’t read letters',
      text: 'A language model only works with numbers. Before it reads anything, the text is cut into <b>tokens</b> and each token is swapped for its ID. The simplest choice: one token per character. That sentence becomes <b>64 tokens</b>, a long list for very little meaning.',
      params: { text: 'english', merges: 0, ids: true },
      duration: 12,
    },
    {
      title: 'Glue the commonest pair',
      text: '<b>Byte-pair encoding</b> reads a big training text (here, one page) and counts every pair of neighbours. The most frequent pair, like “e” followed by a space, becomes a new token. Then it counts again and merges the next winner. Watch the list on the left grow.',
      formula: 'most frequent pair (a, b)  →  new token “ab”',
      params: { text: 'english', ids: true },
      enter: (s) => s.learn(0, 40, 14),
      duration: 16,
    },
    {
      title: 'Words emerge',
      text: 'After a few hundred merges, whole common words like “the” and “token” are single tokens, and the sentence shrinks from 64 tokens to 16. Real tokenizers keep going much longer: GPT-2 has <b>50,257</b> tokens (256 bytes, 50,000 merges and one special token).',
      check: {
        q: 'Which kind of word ends up as a single token first?',
        options: ['Long words', 'Words that are common in the training text', 'Words with rare letters'],
        answer: 1,
        setup: { text: 'english', merges: 40 },
        explain: 'Merges always pick the most frequent pair, so pieces of very common words win first. “the” is one of the earliest tokens; a rare long word may never become one.',
      },
      params: { text: 'english', ids: true },
      enter: (s) => s.learn(40, MAXM, 14),
      duration: 17,
    },
    {
      title: 'Why chatbots can’t spell',
      text: 'Famously, chatbots used to say “strawberry” has two r’s. The model doesn’t receive letters: it gets a few token IDs (here “·straw” and “berry”), and has to remember how each one is spelled. Counting letters inside tokens is surprisingly hard for it.',
      check: {
        q: 'When a model reads the word “strawberry”, what does it actually receive?',
        options: ['Ten letters', 'One or a few token numbers', 'A picture of the word'],
        answer: 1,
        setup: { text: 'spelling', merges: MAXM },
        explain: 'The tokenizer turns the word into a short list of IDs before the model sees it. The letters inside each token are hidden, so the model has to learn spellings indirectly.',
      },
      params: { text: 'spelling', merges: MAXM, ids: true },
      duration: 15,
    },
    {
      title: 'Numbers in odd chunks',
      text: 'Numbers are split wherever the training text happened to have common digit pairs: “2024” may be one token while “1,234,567” falls apart into pieces that don’t match place value. That’s one reason models make arithmetic slips. Some newer tokenizers split every number into single digits.',
      params: { text: 'numbers', merges: MAXM, ids: true },
      duration: 15,
    },
    {
      title: 'Other languages cost more',
      text: 'This tokenizer learned only from English. Accented letters fall back to their raw <b>UTF-8 bytes</b> (dashed boxes), and each Chinese character is 3 bytes, so this 12-character sentence needs <b>36 tokens</b>. Models charge and remember by the token, so poorly covered languages pay more. Modern tokenizers train on many languages to even this out.',
      check: {
        q: 'An English-trained tokenizer reads a Chinese sentence. Compared with English, it uses…',
        options: ['Fewer tokens per character', 'About the same', 'More tokens per character'],
        answer: 2,
        setup: { text: 'chinese', merges: MAXM },
        explain: 'It learned no merges for Chinese, so every character is left as its 3 UTF-8 bytes: 3 tokens per character, against roughly 1 token per 3 to 4 characters of English.',
      },
      params: { text: 'chinese', merges: MAXM, ids: true },
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Pick a text and drag the merges slider to see the tokens form and break apart. Spanish shares the alphabet, so its words reuse English pieces, but its accents still cost extra bytes. Large English tokenizers average about <b>4 characters per token</b>.',
      params: { text: 'spanish', merges: MAXM, ids: true },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params, runner } = api;
    let toks = [], counts = [], k = -1, flash = 0, newest = -1, L = {};

    const kNow = () => clamp(Math.round(params.merges), 0, MERGES.length);
    function retext() {
      const str = SAMPLES[params.text] || SAMPLES.english;
      counts = [];
      for (let i = 0; i <= MERGES.length; i++) counts.push(encode(str, i).length);
      k = -1;
    }
    function refresh() {
      const nk = kNow();
      if (nk === k) return;
      if (nk === k + 1 && k >= 0) (newest = nk - 1), (flash = 1);
      else if (nk < k || k < 0) newest = nk - 1;
      k = nk;
      toks = encode(SAMPLES[params.text] || SAMPLES.english, k);
    }
    retext();
    refresh();

    return {
      learn(from, to, dur) {
        runner.set('merges', from);
        runner.set('merges', to, dur);
      },
      resize(w, h) {
        const narrow = w < 700;
        L = narrow
          ? { narrow, x0: 16, x1: w - 16, y0: 104, fs: 15, lx: 16, lw: w - 32 }
          : { narrow, x0: Math.max(w * 0.37, 380), x1: w - 36, y0: 96, fs: clamp(w / 64, 16, 21), lx: 30, lw: Math.max(w * 0.37, 380) - 70, ly: 96, rows: clamp(Math.floor((h - 420 - 96) / 27), 3, 12) };
      },
      onParam(key) {
        if (key === 'text') retext();
        refresh();
      },
      update(dt) {
        refresh();
        flash = Math.max(0, flash - dt * 1.6);
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const fs = L.fs, lh = fs * 2;
        ctx.font = `500 ${fs}px ${MONO}`;
        // ---- token chips
        let x = L.x0, y = L.y0;
        if (params.text === 'chinese') {
          text(ctx, `${SAMPLES.chinese}  “The model learned to predict the next word.”`, L.x0, y, { size: 13, color: C.dim });
          y += 34;
        }
        const hot = newest >= 0 ? MERGES[newest].ab : null;
        const chips = [];
        toks.forEach((t, i) => {
          const label = t.byte ? t.s : show(t.s);
          ctx.font = `500 ${t.byte ? fs * 0.72 : fs}px ${MONO}`;
          const cw = ctx.measureText(label).width + 10;
          if (x + cw > L.x1 && x > L.x0) (x = L.x0), (y += lh);
          chips.push({ t, i, x, y, cw, label });
          x += cw + 3;
        });
        for (const c of chips) {
          const col = CHIP[c.i % CHIP.length];
          const isHot = hot && c.t.s === hot && flash > 0;
          roundRect(ctx, c.x, c.y - fs * 0.78, c.cw, fs * 1.56, 5);
          ctx.fillStyle = rgba(col, c.t.byte ? 0.08 : 0.2 + (isHot ? 0.6 * flash : 0));
          ctx.fill();
          ctx.setLineDash(c.t.byte ? [3, 3] : []);
          ctx.strokeStyle = isHot ? rgba('#ffffff', 0.5 + 0.5 * flash) : rgba(col, 0.75);
          ctx.lineWidth = isHot ? 2 : 1.2;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.save();
          ctx.font = `500 ${c.t.byte ? fs * 0.72 : fs}px ${MONO}`;
          ctx.textBaseline = 'middle';
          let cx = c.x + 5;
          for (const ch of c.label) {
            ctx.fillStyle = ch === '·' ? C.dim : c.t.byte ? rgba(col, 0.95) : C.ink;
            ctx.fillText(ch, cx, c.y + 1);
            cx += ctx.measureText(ch).width;
          }
          ctx.restore();
        }
        y += lh * 0.95;
        text(ctx, `${toks.length} tokens  ·  ${counts[0]} at the start`, L.x0, y, { size: 12, color: C.dim });
        y += 26;
        // ---- IDs: what the model actually receives
        if (params.ids && !api.thumbnail) {
          text(ctx, 'What the model receives:', L.x0, y, { size: 12, color: C.cyan, weight: 600 });
          y += 20;
          ctx.font = `500 12px ${MONO}`;
          let ix = L.x0;
          const line = (s, col) => {
            const ww = ctx.measureText(s).width;
            if (ix + ww > L.x1) (ix = L.x0), (y += 17);
            text(ctx, s, ix, y, { size: 12, mono: true, color: col, shadow: false });
            ix += ww;
          };
          line('[', C.dim);
          toks.forEach((t, i) => line(t.id + (i < toks.length - 1 ? ', ' : ']'), rgba(CHIP[i % CHIP.length], 0.95)));
          y += 30;
        }
        // ---- merge list
        const rows = L.narrow ? 4 : L.rows;
        const lx = L.lx;
        let ly = L.narrow ? y + 6 : L.ly;
        text(ctx, `Merges learned: ${k} of ${MERGES.length}`, lx, ly, { size: 13, weight: 700, color: C.amber });
        ly += 26;
        if (k === 0) text(ctx, 'none yet: every character is its own token', lx, ly, { size: 12, color: C.dim });
        for (let r = 0; r < rows && k - 1 - r >= 0; r++) {
          const m = MERGES[k - 1 - r];
          const fresh = r === 0 && flash > 0;
          const a = 1 - r / (rows + 1);
          ctx.globalAlpha = a;
          if (fresh) {
            ctx.fillStyle = rgba(C.amber, 0.18 * flash);
            roundRect(ctx, lx - 6, ly - 12, Math.min(L.lw, 330), 24, 6);
            ctx.fill();
          }
          text(ctx, `#${k - r}`, lx, ly, { size: 11, mono: true, color: C.dim });
          const t1 = `${show(m.a)} + ${show(m.b)} → ${show(m.ab)}`;
          text(ctx, t1, lx + 44, ly, { size: 13, mono: true, color: C.ink });
          if (!L.narrow) text(ctx, `${m.count}×`, lx + Math.min(L.lw, 330) - 12, ly, { size: 11, color: C.dim, align: 'right' });
          ctx.globalAlpha = 1;
          ly += L.narrow ? 22 : 27;
        }
        if (!L.narrow && !api.thumbnail) tag(ctx, 'pairs counted in one page of English', lx, ly + 6, C.dim);
      },
      stats() {
        const chars = [...(SAMPLES[params.text] || '')].length;
        return [
          { label: 'Tokens', value: String(toks.length), color: C.cyan },
          { label: 'Characters', value: String(chars) },
          { label: 'Characters per token', value: (chars / Math.max(1, toks.length)).toFixed(2) },
          { label: 'Vocabulary', value: vocabAt(k).toLocaleString('en') },
        ];
      },
      charts() {
        return [{ title: 'Tokens in this text vs merges learned', series: [{ data: counts.slice(0, k + 1), color: C.cyan }], min: 0, max: counts[0], length: MERGES.length + 1 }];
      },
    };
  },
};
