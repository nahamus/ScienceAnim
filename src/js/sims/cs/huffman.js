import { C, clamp, rgba, text, backdrop, roundRect } from '../../core/util.js';

// Huffman coding (1952). Count each symbol, then repeatedly join the two least frequent nodes
// into a parent until one tree remains. Reading 0 for a left branch and 1 for a right branch gives
// every symbol a code; frequent symbols sit high in the tree and get short codes, and no code is
// the start of another, so the bitstream needs no separators. Drawn as a dendrogram: a parent's
// height is the step at which it was made.

const TEXTS = {
  sea: 'she sells sea shells on the sea shore',
  miss: 'mississippi',
  pangram: 'the quick brown fox jumps over the lazy dog',
  uniform: 'abcdefghhgfedcbaabcdefgh',
};
const PAL = ['#5b8cff', '#ff8a3d', '#2ee6a6', '#ff5fa2', '#a78bfa', '#ffb547', '#38d6f5', '#a3e635'];
const show = (ch) => (ch === ' ' ? '␣' : ch);

function build(str) {
  const counts = new Map();
  for (const ch of str) counts.set(ch, (counts.get(ch) || 0) + 1);
  let id = 0;
  const leaves = [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([ch, n]) => ({ id: id++, ch, n, leaf: true }));
  const pool = leaves.slice();
  const merges = [];
  while (pool.length > 1) {
    pool.sort((a, b) => a.n - b.n || a.id - b.id);
    const [l, r] = pool.splice(0, 2);
    const p = { id: id++, n: l.n + r.n, l, r, step: merges.length };
    l.parent = r.parent = p;
    merges.push(p);
    pool.push(p);
  }
  const root = pool[0];
  const codes = new Map();
  // leaf order for drawing: in-order traversal of the finished tree, so no edges cross
  const order = [];
  (function walk(n, code) {
    if (n.leaf) {
      n.code = code || '0';
      codes.set(n.ch, n.code);
      order.push(n);
      return;
    }
    walk(n.l, code + '0');
    walk(n.r, code + '1');
  })(root, '');
  const total = str.length;
  let entropy = 0;
  for (const lf of leaves) {
    const p = lf.n / total;
    entropy -= p * Math.log2(p);
  }
  const bits = [...str].reduce((s, ch) => s + codes.get(ch).length, 0);
  return { leaves, merges, root, codes, order, entropy, bits, total, fixed: Math.max(1, Math.ceil(Math.log2(leaves.length))) };
}

export default {
  id: 'huffman',
  title: 'Compressing Data: Huffman Codes',
  category: 'cs',
  tagline: 'Give common letters short codes and rare ones long codes, and the same message takes fewer bits.',
  ages: ['14-16', '16+'],
  topics: ['Data representation', 'Algorithms'],
  keywords: ['compression', 'huffman coding', 'prefix code', 'entropy', 'information theory', 'shannon', 'zip', 'png', 'jpeg', 'mp3', 'deflate', 'ascii', 'binary tree', 'greedy algorithm', 'morse code'],
  blurb:
    'Plain text spends 8 bits on every character, whether it’s a common “e” or a rare “z”. In 1952 David Huffman, then a student, found the best possible way to give each symbol its own code: build a tree by repeatedly joining the two rarest symbols. Frequent symbols end up with short codes, and no code is the start of another, so the bits can be read back without gaps. Huffman coding is still the last step inside ZIP files, PNG and JPEG images and MP3 audio.',
  ideas: [
    'Fixed-length codes like ASCII waste bits on <b>common</b> symbols.',
    'Huffman’s method: repeatedly <b>join the two least frequent</b> nodes into a parent.',
    'Reading 0 for left and 1 for right gives each symbol a code: frequent ones get <b>short</b> codes.',
    'No code is the beginning of another (a <b>prefix code</b>), so decoding needs no separators.',
    'Shannon’s <b>entropy</b> is the limit: no code can average fewer bits per symbol.',
  ],
  hint: 'Pick a different text in the controls',
  renderScale: 1,
  thumbChapter: 3,
  thumbFrames: 240,
  params: [
    { key: 'text', label: 'Text', type: 'select', value: 'sea', options: [{ value: 'sea', label: 'Sea shells' }, { value: 'miss', label: 'Mississippi' }, { value: 'pangram', label: 'Quick brown fox' }, { value: 'uniform', label: 'All equal' }] },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.3, max: 4, step: 0.05, value: 1, unit: '×' },
    { key: 'loop', label: 'Repeat the build', type: 'toggle', value: false },
    { key: 'rebuild', label: 'Build again', type: 'button', action: (sim) => sim.rebuild() },
    { key: 'finish', label: 'Skip to the result', type: 'button', action: (sim) => sim.finish() },
  ],
  story: [
    {
      title: 'Eight bits for every letter',
      text: 'Computers usually store text in <b>ASCII</b>: 8 bits for every character. “she sells sea shells on the sea shore” is 37 characters, so <b>296 bits</b>. But the letters aren’t equally common: there are 8 s’s, 7 e’s and 7 spaces, and only one n, one r and one t. Why give them all the same length?',
      params: { text: 'sea', speed: 1, loop: false },
      enter: (s) => s.rebuild(0),
      duration: 14,
    },
    {
      title: 'Count, then join the two rarest',
      text: 'Huffman’s recipe: count every symbol, then repeatedly take the <b>two rarest</b> nodes and join them under a new parent whose count is their sum. The rare letters are joined first, so they end up deep in the tree; common ones are joined last and sit near the top.',
      formula: 'parent count = left count + right count',
      params: { text: 'sea', speed: 0.8, loop: false },
      enter: (s) => s.rebuild(),
      duration: 18,
    },
    {
      title: 'Read off the codes',
      text: 'Follow the path from the top: <b>0</b> for every left turn, <b>1</b> for every right. The commonest letter, s, gets a 2-bit code; e and the space get 3 bits; rare n and r get 5. Because every symbol sits at the end of a branch, no code is the start of another, so the bitstream needs no gaps.',
      check: {
        q: 'Why can a Huffman bitstream be decoded without any gaps between letters?',
        options: ['Every code has the same length', 'No code is the start of another code', 'The decoder guesses'],
        answer: 1,
        setup: { text: 'sea', loop: false },
        explain: 'Symbols only sit at the ends of branches, so reading bits and walking down the tree always reaches exactly one symbol, then starts again at the top. Such codes are called prefix codes.',
      },
      params: { text: 'sea', speed: 1, loop: false },
      enter: (s) => s.finish(),
      duration: 16,
    },
    {
      title: 'How much smaller?',
      text: 'The sea-shells sentence drops from 296 bits to <b>112</b>: about 3 bits per letter. Even against the best fixed-length code for its 10 symbols (4 bits each, 148 bits) Huffman wins. The more uneven the counts, the bigger the saving: “mississippi” needs just 21 bits instead of 88.',
      params: { text: 'miss', speed: 1, loop: false },
      enter: (s) => s.rebuild(),
      duration: 15,
    },
    {
      title: 'When every symbol is equally common',
      text: 'Here 8 letters appear 3 times each. The tree comes out perfectly balanced and every code has 3 bits: exactly what a plain fixed-length code would give. Compression needs <b>patterns</b>; random-looking data can’t be squeezed.',
      check: {
        q: 'Eight symbols all appear equally often. How much does Huffman beat a fixed 3-bit code?',
        options: ['By about half', 'By a little', 'Not at all'],
        answer: 2,
        setup: { text: 'uniform', loop: false },
        explain: 'With equal counts, the tree is perfectly balanced: 8 leaves at depth 3, so every code is 3 bits. There is no unevenness to exploit, which is also why already-compressed or encrypted files don’t compress further.',
      },
      params: { text: 'uniform', speed: 1.4, loop: false },
      enter: (s) => s.rebuild(),
      duration: 15,
    },
    {
      title: 'Shannon’s limit',
      text: 'Claude Shannon showed in 1948 that the <b>entropy</b> of the letter frequencies is a hard limit: no code can average fewer bits per symbol. Huffman is always within one bit of it. ZIP and PNG first replace repeated phrases with short references, then Huffman-code the result; JPEG and MP3 Huffman-code their numbers too.',
      formula: 'H = − Σ p log₂ p   bits per symbol',
      params: { text: 'pangram', speed: 2.2, loop: false },
      enter: (s) => s.rebuild(),
      duration: 18,
    },
    {
      title: 'Your turn',
      text: 'Try each text and compare the three numbers: 8 bits per letter, the Huffman average and the entropy limit.',
      params: { text: 'sea', speed: 1.5, loop: true },
      enter: (s) => s.rebuild(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let T, step = 0, pt = 0, phase = 'count', hold = 0, L = {};
    const STR = () => TEXTS[params.text] || TEXTS.sea;

    function rebuild(stopAt) {
      T = build(STR());
      step = 0;
      pt = 0;
      phase = stopAt === 0 ? 'still' : 'count';
      hold = 0;
    }
    function finish() {
      T = T || build(STR());
      step = T.merges.length;
      phase = 'done';
      pt = 1;
      hold = 0;
    }
    rebuild();

    return {
      rebuild,
      finish,
      resize(w, h) {
        const narrow = w < 700;
        if (narrow) L = { narrow, x0: 14, x1: w - 14, top: 100, base: Math.min(h * 0.5, 330), bx: 14, by: Math.min(h * 0.5, 330) + 96 };
        else {
          const bx = w - 550 >= 360 ? 510 : Math.max(w * 0.42, 400);
          // the tree stays right of the story card (x 20–490) so no leaf or code is hidden
          const base = clamp(h - 270, 280, 620);
          L = { narrow, x0: bx, x1: w - 40, top: 100, base, bx, by: base + 116 };
        }
      },
      onParam(k) {
        if (k === 'text') rebuild();
      },
      update(dt) {
        const s = params.speed;
        if (phase === 'still') return;
        if (phase === 'count') {
          pt += dt * s / 1.6;
          if (pt >= 1) (phase = 'merge'), (pt = 0);
        } else if (phase === 'merge') {
          pt += (dt * s) / 0.9;
          if (pt >= 1) {
            step++;
            pt = 0;
            if (step >= T.merges.length) phase = 'done';
          }
        } else if (phase === 'done') {
          pt = Math.min(1, pt + (dt * s) / 3);
          hold += dt * s;
          if (params.loop && hold > 7) rebuild();
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const order = T.order;
        const nL = order.length;
        const span = L.x1 - L.x0;
        const dx = span / nL;
        const X = new Map();
        order.forEach((lf, i) => X.set(lf.id, L.x0 + dx * (i + 0.5)));
        const steps = T.merges.length;
        const levelH = (L.base - L.top - 30) / Math.max(1, steps);
        const yOf = (n) => (n.leaf ? L.base : L.base - levelH * (n.step + 1));
        const xOf = (n) => {
          if (n.leaf) return X.get(n.id);
          if (!X.has(n.id)) X.set(n.id, (xOf(n.l) + xOf(n.r)) / 2);
          return X.get(n.id);
        };
        const made = (n) => n.leaf || n.step < step;
        const codesOn = phase === 'done' || phase === 'still' ? phase === 'done' : false;
        // which nodes are being joined right now
        const joining = phase === 'merge' && step < steps ? T.merges[step] : null;
        // edges
        for (const p of T.merges) {
          if (!made(p)) continue;
          const px = xOf(p), py = yOf(p);
          for (const [c, bit] of [[p.l, '0'], [p.r, '1']]) {
            const cx = xOf(c), cy = yOf(c);
            ctx.strokeStyle = codesOn ? rgba(bit === '0' ? C.cyan : C.pink, 0.75) : 'rgba(160,175,230,0.5)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(cx, py);
            ctx.lineTo(cx, cy - (c.leaf ? 12 : 0));
            ctx.stroke();
            if (codesOn && Math.abs(cx - px) > 12) text(ctx, bit, (px + cx) / 2, py - 8, { size: 11, align: 'center', weight: 700, color: bit === '0' ? C.cyan : C.pink });
          }
        }
        // internal nodes
        for (const p of T.merges) {
          if (!made(p)) continue;
          const x = xOf(p), y = yOf(p);
          ctx.fillStyle = '#141a30';
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 1.2;
          roundRect(ctx, x - 13, y - 9, 26, 18, 9);
          ctx.fill();
          ctx.stroke();
          text(ctx, String(p.n), x, y, { size: 10, align: 'center', weight: 700 });
        }
        // the pair being joined
        if (joining) {
          const a = joining.l, b = joining.r;
          const t = clamp(pt * 1.6, 0, 1);
          for (const c of [a, b]) {
            ctx.strokeStyle = rgba(C.amber, 0.9);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(xOf(c), yOf(c) - (c.leaf ? 0 : 0), c.leaf ? 15 : 16, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (t > 0.5) {
            const px = xOf(joining), py = yOf(joining);
            ctx.globalAlpha = (t - 0.5) * 2;
            ctx.strokeStyle = C.amber;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(xOf(a), yOf(a) - 12);
            ctx.lineTo(xOf(a), py);
            ctx.lineTo(xOf(b), py);
            ctx.lineTo(xOf(b), yOf(b) - 12);
            ctx.stroke();
            text(ctx, `${a.n} + ${b.n} = ${joining.n}`, px, py - 16, { size: 12, align: 'center', color: C.amber, weight: 700 });
            ctx.globalAlpha = 1;
          }
        }
        // leaves, counts, codes
        const fs = clamp(dx * 0.55, 10, 16);
        order.forEach((lf, i) => {
          const x = xOf(lf), y = L.base;
          const col = PAL[i % PAL.length];
          ctx.fillStyle = rgba(col, 0.2);
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(x, y, Math.min(12, dx * 0.45), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          text(ctx, show(lf.ch), x, y, { size: fs, align: 'center', weight: 700, mono: true });
          text(ctx, `×${lf.n}`, x, y + 22, { size: 10, align: 'center', color: C.dim });
          if (codesOn) {
            const shownBits = Math.ceil(lf.code.length * clamp(pt * 2, 0, 1));
            for (let k = 0; k < shownBits; k++) text(ctx, lf.code[k], x, y + 40 + k * 13, { size: 11, align: 'center', mono: true, weight: 700, color: lf.code[k] === '0' ? C.cyan : C.pink });
          }
        });
        // bars and bitstream
        const bx = L.narrow ? 14 : L.bx, by = L.narrow ? L.by : L.by;
        const maxBits = T.total * 8;
        const barW = (L.narrow ? w - 28 : w - 40 - bx) - 150;
        const bar = (label, bits, y, col, note) => {
          text(ctx, label, bx, y, { size: 12, color: C.dim });
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(bx + 120, y - 7, barW, 14);
          ctx.fillStyle = col;
          ctx.fillRect(bx + 120, y - 7, (barW * bits) / maxBits, 14);
          text(ctx, note, bx + 128 + (barW * bits) / maxBits, y, { size: 12, color: col, weight: 700 });
        };
        const done = phase === 'done';
        bar('ASCII, 8 bits each', maxBits, by, C.dim, `${maxBits}`);
        bar(`Fixed ${T.fixed}-bit code`, T.total * T.fixed, by + 24, C.violet, `${T.total * T.fixed}`);
        bar('Huffman', done ? T.bits : 0, by + 48, C.teal, done ? `${T.bits}` : '…');
        bar('Entropy limit', T.entropy * T.total, by + 72, C.amber, `${(T.entropy * T.total).toFixed(0)}`);
        if (done && !api.thumbnail) {
          // the encoded bitstream, coloured by symbol
          const idx = new Map(order.map((lf, i) => [lf.ch, i]));
          let x = bx, y = by + 104;
          const cw = 7.4, maxX = (L.narrow ? w - 14 : w - 40);
          const limit = Math.floor(clamp(pt, 0, 1) * T.total);
          ctx.font = `600 12px "JetBrains Mono", monospace`;
          for (const ch of STR().slice(0, limit)) {
            const code = T.codes.get(ch);
            if (x + code.length * cw > maxX) (x = bx), (y += 17);
            if (y > h - 16) break;
            text(ctx, code, x, y, { size: 12, mono: true, color: PAL[idx.get(ch) % PAL.length], shadow: false });
            x += code.length * cw + 2;
          }
        }
      },
      stats() {
        const done = phase === 'done';
        return [
          { label: 'Characters', value: String(T.total) },
          { label: 'Huffman bits per character', value: done ? (T.bits / T.total).toFixed(2) : '…', color: C.teal },
          { label: 'Entropy limit', value: T.entropy.toFixed(2) + ' bits', color: C.amber },
          { label: 'Saved vs ASCII', value: done ? Math.round((1 - T.bits / (T.total * 8)) * 100) + ' %' : '…' },
        ];
      },
    };
  },
};
