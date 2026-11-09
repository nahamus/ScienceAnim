import { C, clamp, rgba, text, tag, backdrop, roundRect, arrow } from '../../core/util.js';
import { sha256 } from '../../core/sha256.js';

// Real SHA-256 hashes and real proof-of-work. Each block's hash covers its number, the previous
// block's hash, its data and a nonce; a block is valid when its hash starts with `difficulty`
// hex zeros and its "previous" field matches the block before. Mining = trying nonces 0, 1, 2 …
// Every extra zero multiplies the average number of tries by 16.

const LEDGER = ['Alice pays Bob 5', 'Bob pays Carol 2', 'Carol pays Dan 7', 'Dan pays Erin 1', 'Erin pays Finn 4', 'Finn pays Gus 3', 'Gus pays Hana 9', 'Hana pays Ivan 6', 'Ivan pays Jo 8'];
const TAMPER = { none: 'Bob pays Carol 2', one: 'Bob pays Carol 3', big: 'Bob pays Carol 200' };
const RATE = { slow: 25, fast: 3000, max: 120000 };
const ZERO = '0'.repeat(64);
const hashOf = (b) => sha256(`${b.index}|${b.prev}|${b.data}|${b.nonce}`);
const short = (h) => h.slice(0, 14) + '…';

function bitsOf(hex) {
  const out = new Uint8Array(256);
  for (let i = 0; i < 64; i++) {
    const v = parseInt(hex[i], 16);
    for (let b = 0; b < 4; b++) out[i * 4 + b] = (v >> (3 - b)) & 1;
  }
  return out;
}

export default {
  id: 'blockchain',
  title: 'Hashing and Blockchains',
  category: 'cs',
  tagline: 'Digital fingerprints, proof of work, and why rewriting a blockchain’s history is so hard.',
  ages: ['14-16', '16+'],
  topics: ['Cryptography', 'Algorithms'],
  keywords: ['hash', 'sha-256', 'sha256', 'blockchain', 'bitcoin', 'proof of work', 'mining', 'nonce', 'avalanche effect', 'cryptocurrency', 'ledger', 'git', 'password hashing', 'fingerprint'],
  blurb:
    'A <b>hash function</b> turns any data into a fixed-size fingerprint. Change one character and the fingerprint changes completely, and there is no way to run it backwards. Chain blocks of records together by putting each block’s fingerprint into the next, demand that every fingerprint starts with zeros, and you get a <b>blockchain</b>: a ledger where rewriting history means redoing an enormous amount of guessing. Every hash here is real SHA-256, computed in your browser.',
  ideas: [
    '<b>SHA-256</b> maps any input to 256 bits. The same input always gives the same hash.',
    'One changed character flips about <b>half the bits</b> (the avalanche effect), and you can’t work backwards.',
    '<b>Mining</b> means trying nonce after nonce until the hash starts with enough zeros. Each extra zero means 16× more tries.',
    'Each block contains the previous block’s hash, so editing an old block <b>breaks every link after it</b>.',
    'Hashes also check downloads, store passwords and name every commit in <b>Git</b>.',
  ],
  hint: 'Use the controls to tamper with block 2, then watch the chain break',
  renderScale: 1,
  thumbChapter: 4,
  thumbFrames: 60,
  params: [
    { key: 'difficulty', label: 'Difficulty (leading zeros)', type: 'range', min: 1, max: 4, step: 1, value: 3, instant: true },
    { key: 'speed', label: 'Mining speed', type: 'select', value: 'fast', options: [{ value: 'slow', label: '25 tries/s' }, { value: 'fast', label: '3,000/s' }, { value: 'max', label: 'Flat out' }] },
    { key: 'tamper', label: 'Block 2 says', type: 'select', value: 'none', options: [{ value: 'none', label: 'pays 2' }, { value: 'one', label: 'pays 3' }, { value: 'big', label: 'pays 200' }] },
    { key: 'mine', label: 'Miner fixes broken blocks', type: 'toggle', value: true },
    { key: 'add', label: 'Add a block', type: 'button', action: (sim) => sim.addBlock() },
    { key: 'reset', label: 'Fresh chain', type: 'button', action: (sim) => sim.reset() },
  ],
  story: [
    {
      title: 'A digital fingerprint',
      text: 'Each box is a <b>block</b> of records. Everything in it is fed through <b>SHA-256</b>, which squeezes any amount of data into 256 bits, written as 64 hex digits. Hash the same data again and you get exactly the same fingerprint; the grid shows block 2’s 256 bits.',
      params: { difficulty: 3, speed: 'fast', tamper: 'none', mine: true },
      enter: (s) => s.reset(),
      duration: 13,
    },
    {
      title: 'Change one character',
      text: 'Block 2 now says “pays 3” instead of “pays 2”. Its hash changes <b>completely</b>: about half of the 256 bits flip (red squares), with no pattern. There is no way to steer a hash or run it backwards, so it works as a fingerprint for the data.',
      check: {
        q: 'You change one letter in a long document. Its SHA-256 hash…',
        options: ['Changes in one place', 'Changes completely', 'Stays the same'],
        answer: 1,
        setup: { tamper: 'none', mine: false },
        explain: 'Hash functions are designed so every input bit affects every output bit. One changed letter flips about 128 of the 256 bits, in an unpredictable pattern: the avalanche effect.',
      },
      params: { difficulty: 3, speed: 'fast', tamper: 'one', mine: false },
      enter: (s) => s.reset(),
      duration: 14,
    },
    {
      title: 'Proof of work',
      text: 'A block only counts if its hash starts with 3 zeros (difficulty 3). The only way to get one is to keep changing a spare number, the <b>nonce</b>, and hash again. Here the miner is slowed to 25 tries a second so you can watch each guess fail. About 4,000 tries are needed on average, so at this speed it would take minutes: switch the mining speed up to finish the block.',
      params: { difficulty: 3, speed: 'slow', tamper: 'none', mine: true },
      enter: (s) => (s.reset(), s.addBlock()),
      duration: 13,
    },
    {
      title: 'Every zero is 16 times harder',
      text: 'Each hex digit has 16 possible values, so each extra required zero multiplies the average number of tries by 16. Difficulty 4 needs about 65,000 tries, so the miner must redo every block; even flat out, your browser takes a few seconds. Bitcoin adjusts its difficulty so the whole network takes about <b>10 minutes</b> per block.',
      check: {
        q: 'Going from 3 required zeros to 4 multiplies the average number of tries by…',
        options: ['2', '4', '16'],
        answer: 2,
        setup: { difficulty: 3, speed: 'max', tamper: 'none', mine: false },
        explain: 'A hex digit is 0 with probability 1/16, so needing one more zero makes success 16 times rarer: about 4,096 tries for 3 zeros, 65,536 for 4.',
      },
      params: { difficulty: 4, speed: 'max', tamper: 'none', mine: true },
      enter: (s) => (s.reset(), s.addBlock()),
      duration: 16,
    },
    {
      title: 'Tamper with history',
      text: 'Someone edits block 2 to say “pays 200”. Its hash changes, so it no longer starts with zeros, and block 3’s “previous hash” no longer matches: <b>every block after it</b> is now broken. Anyone holding a copy of the chain can see the tampering instantly.',
      check: {
        q: 'A cheater edits block 2 and wants the chain to look valid again. What must they redo?',
        options: ['Only block 2', 'Block 2 and every block after it', 'Nothing'],
        answer: 1,
        setup: { tamper: 'none', mine: false },
        explain: 'Re-mining block 2 changes its hash, which breaks block 3’s link, and so on down the chain. The cheater must redo the proof of work for every later block.',
      },
      params: { difficulty: 3, speed: 'fast', tamper: 'big', mine: false },
      enter: (s) => s.reset(),
      duration: 15,
    },
    {
      title: 'Outrunning everyone',
      text: 'The miner now re-mines block 2 and every block after it. On a real network, honest miners keep extending the original chain at the same time, and the longest chain wins. To rewrite Bitcoin’s history, a cheater would need more computing power than the rest of the world’s miners combined, which together try hundreds of billions of billions of hashes every second.',
      params: { difficulty: 3, speed: 'fast', tamper: 'big', mine: true },
      enter: (s) => s.reset(),
      duration: 16,
    },
    {
      title: 'Hashes everywhere',
      text: 'You don’t need a cryptocurrency to use hashes. Websites store a hash of your password rather than the password; download pages list hashes so you can check a file; and <b>Git</b> names every commit by a hash that includes its parent’s, a chain just like this one. Proof of work itself costs lots of electricity, so many newer blockchains use other methods.',
      params: { difficulty: 2, speed: 'fast', tamper: 'none', mine: true },
      enter: (s) => s.reset(),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Tamper with block 2, switch the miner off and on, add blocks and raise the difficulty. Watch how many tries each block takes.',
      params: { difficulty: 3, speed: 'fast', tamper: 'none', mine: true },
      enter: (s) => s.reset(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let chain = [], original2 = '', mining = null, acc = 0, totalTries = 0, lastTries = 0, L = {};

    const meets = (h) => h.startsWith('0'.repeat(params.difficulty));
    const own = (i) => meets(chain[i].hash) && chain[i].prev === (i ? chain[i - 1].hash : ZERO);
    // a chain is checked from the start: every block after a broken one is untrusted too
    const valid = (i) => {
      for (let j = 0; j <= i; j++) if (!own(j)) return false;
      return true;
    };
    // the starting chain is mined instantly, at most 3 zeros so a fresh chain never stalls the page
    function mineNow(b) {
      const need = '0'.repeat(Math.min(params.difficulty, 3));
      b.nonce = 0;
      b.hash = hashOf(b);
      while (!b.hash.startsWith(need)) {
        b.nonce++;
        b.hash = hashOf(b);
      }
    }
    function reset() {
      chain = [];
      for (let i = 0; i < 4; i++) {
        const b = { index: i + 1, prev: i ? chain[i - 1].hash : ZERO, data: i === 1 ? TAMPER.none : LEDGER[i], nonce: 0 };
        mineNow(b);
        chain.push(b);
      }
      original2 = chain[1].hash;
      mining = null;
      totalTries = 0;
      lastTries = 0;
      applyTamper();
    }
    function applyTamper() {
      const b = chain[1];
      if (!b) return;
      const want = TAMPER[params.tamper] || TAMPER.none;
      if (b.data !== want) {
        b.data = want;
        b.hash = hashOf(b);
        mining = null;
      }
    }
    function addBlock() {
      const last = chain[chain.length - 1];
      const b = { index: last.index + 1, prev: last.hash, data: LEDGER[(last.index) % LEDGER.length], nonce: 0 };
      b.hash = hashOf(b);
      chain.push(b);
    }
    reset();

    return {
      reset,
      addBlock,
      resize(w, h) {
        const narrow = w < 700;
        if (narrow) {
          const cw = (w - 32 - 10) / 2;
          L = { narrow, cols: 2, x0: 16, y0: 96, cw, ch: 100, gx: 10, gy: 24, av: { x: 16, y: 96 + 2 * 100 + 24 + 30, cell: clamp((h - 96 - 254 - 12) / 16, 4, 6) } };
        } else {
          const cols = 4;
          const cw = Math.min((w - 80 - (cols - 1) * 26) / cols, 270);
          const ax = w - 550 >= 360 ? 510 : Math.max(w * 0.42, 400);
          L = { narrow, cols, x0: 40, y0: 96, cw, ch: 142, gx: 26, gy: 0, av: { x: ax, y: 96 + 142 + 60, cell: clamp((h - 96 - 142 - 60 - 60) / 16, 6, 11) } };
        }
      },
      onParam(k) {
        if (k === 'tamper') applyTamper();
        if (k === 'difficulty') mining = null;
      },
      update(dt) {
        if (!params.mine) return;
        // the miner works on the first broken block
        const i = chain.findIndex((_, j) => !own(j));
        if (i < 0) {
          mining = null;
          return;
        }
        const b = chain[i];
        if (!mining || mining.i !== i) {
          b.prev = i ? chain[i - 1].hash : ZERO;
          b.nonce = 0;
          b.hash = hashOf(b);
          mining = { i, tries: 0, t: 0 };
        }
        acc += RATE[params.speed] * dt;
        let n = Math.min(Math.floor(acc), 4000);
        acc -= Math.floor(acc);
        mining.t += dt;
        while (n-- > 0) {
          if (meets(b.hash)) break;
          b.nonce++;
          b.hash = hashOf(b);
          mining.tries++;
          totalTries++;
        }
        if (meets(b.hash)) {
          lastTries = mining.tries + 1;
          mining = null;
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const show = chain.slice(-4);
        const first = chain.length - show.length;
        const zeros = params.difficulty;
        const pos = (k) => {
          const c = k % L.cols, r = Math.floor(k / L.cols);
          return [L.x0 + c * (L.cw + L.gx), L.y0 + r * (L.ch + L.gy)];
        };
        show.forEach((b, k) => {
          const i = first + k;
          const ok = valid(i);
          const linkOk = b.prev === (i ? chain[i - 1].hash : ZERO);
          const isMining = mining && mining.i === i;
          const [x, y] = pos(k);
          const col = ok ? C.teal : isMining ? C.amber : C.red;
          ctx.fillStyle = rgba(col, 0.07);
          ctx.strokeStyle = rgba(col, 0.75);
          ctx.lineWidth = 1.6;
          roundRect(ctx, x, y, L.cw, L.ch, 10);
          ctx.fill();
          ctx.stroke();
          const fs = L.narrow ? 10 : 11, lh = L.narrow ? 17 : 22, px = x + 10;
          let yy = y + 16;
          text(ctx, `Block ${b.index}`, px, yy, { size: fs + 2, weight: 700, color: col });
          text(ctx, ok ? '✓ valid' : isMining ? 'mining…' : own(i) ? '✗ after a break' : '✗ broken', x + L.cw - 10, yy, { size: fs, align: 'right', color: col, weight: 600 });
          yy += lh;
          const tampered = b.index === 2 && params.tamper !== 'none';
          text(ctx, b.data, px, yy, { size: fs + 1, color: tampered ? C.amber : C.ink, weight: 600 });
          yy += lh;
          text(ctx, `prev ${short(b.prev)}`, px, yy, { size: fs, mono: true, color: linkOk ? C.dim : C.red });
          yy += lh;
          text(ctx, `nonce ${b.nonce.toLocaleString('en')}`, px, yy, { size: fs, mono: true, color: isMining ? C.amber : C.dim });
          yy += lh;
          const hh = short(b.hash);
          const good = meets(b.hash);
          text(ctx, 'hash ', px, yy, { size: fs, mono: true, color: C.dim });
          ctx.font = `500 ${fs}px "JetBrains Mono", monospace`;
          const hx = px + ctx.measureText('hash ').width;
          text(ctx, hh.slice(0, zeros), hx, yy, { size: fs, mono: true, color: good ? C.teal : C.red, weight: 700 });
          text(ctx, hh.slice(zeros), hx + ctx.measureText(hh.slice(0, zeros)).width, yy, { size: fs, mono: true, color: C.ink });
          // link arrow to the next block
          if (k < show.length - 1) {
            const nb = show[k + 1];
            const broken = nb.prev !== b.hash;
            const [nx, ny] = pos(k + 1);
            if (ny === y) arrow(ctx, x + L.cw + 3, y + L.ch / 2, nx - 3, ny + L.ch / 2, broken ? C.red : rgba(C.teal, 0.8), 2, 8);
            else arrow(ctx, x + L.cw / 2, y + L.ch + 3, nx + L.cw / 2, ny - 3, broken ? C.red : rgba(C.teal, 0.8), 2, 8);
          }
        });
        if (first > 0 && !L.narrow) text(ctx, `… ${first} earlier block${first > 1 ? 's' : ''}`, L.x0, L.y0 + L.ch + 18, { size: 11, color: C.dim });
        // avalanche panel: block 2's 256 bits vs its original hash
        const av = L.av, cell = av.cell;
        const b2 = chain[1];
        const now = bitsOf(b2.hash), was = bitsOf(original2);
        let diff = 0;
        for (let i = 0; i < 256; i++) {
          const changed = now[i] !== was[i];
          if (changed) diff++;
          ctx.fillStyle = changed ? rgba(C.red, 0.85) : now[i] ? rgba(C.ink, 0.75) : 'rgba(255,255,255,0.08)';
          ctx.fillRect(av.x + (i % 16) * cell, av.y + Math.floor(i / 16) * cell, cell - 1, cell - 1);
        }
        const tx = av.x + 16 * cell + 18;
        const narrowText = L.narrow;
        const lx = narrowText ? av.x + 16 * cell + 12 : tx;
        text(ctx, 'Block 2’s hash, as 256 bits', av.x, av.y - 14, { size: 12, weight: 700, color: C.cyan });
        const lines = [
          [`“${b2.data}”`, C.ink],
          [diff ? `${diff} of 256 bits differ from the original` : 'unchanged from the original', diff ? C.red : C.teal],
        ];
        if (!narrowText) for (let k = 0; k < 4; k++) lines.push([b2.hash.slice(k * 16, k * 16 + 16), C.dim]);
        lines.forEach(([s, col], i) => text(ctx, s, lx, av.y + 8 + i * 20, { size: narrowText ? 11 : 12, color: col, mono: i > 1 }));
        // mining status
        if (!api.thumbnail) {
          const my = av.y + 16 * cell + 22;
          const msg = mining ? `Mining block ${chain[mining.i].index}: ${mining.tries.toLocaleString('en')} tries so far · need ${zeros} leading zero${zeros > 1 ? 's' : ''} (about ${(16 ** zeros).toLocaleString('en')} tries on average)` : lastTries ? `Last block took ${lastTries.toLocaleString('en')} tries` : params.mine ? 'Every block is valid' : 'Miner is off';
          if (narrowText) {
            const parts = msg.split(' · ');
            parts.forEach((s, i) => text(ctx, s, av.x, my + i * 16, { size: 11, color: mining ? C.amber : C.dim }));
          } else text(ctx, msg, av.x, my, { size: 12, color: mining ? C.amber : C.dim });
          if (!L.narrow) tag(ctx, 'red = bits that changed', av.x, my + 26, C.red);
        }
      },
      stats() {
        const broken = chain.filter((_, i) => !valid(i)).length;
        return [
          { label: 'Blocks', value: String(chain.length) },
          { label: 'Broken blocks', value: String(broken), color: broken ? C.red : C.teal },
          { label: 'Average tries per block', value: (16 ** params.difficulty).toLocaleString('en') },
          { label: 'Hashes tried', value: totalTries.toLocaleString('en') },
        ];
      },
    };
  },
};
