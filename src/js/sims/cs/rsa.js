import { C, clamp, rgba, text, tag, backdrop, roundRect, easeInOut, TAU } from '../../core/util.js';

// RSA with small primes, computed exactly with BigInt. Alice picks primes p and q, publishes
// n = p·q and e, and keeps d with e·d ≡ 1 (mod φ), φ = (p−1)(q−1). Bob turns each letter into a
// number m (A = 1 … Z = 26) and sends c = mᵉ mod n; Alice recovers m = cᵈ mod n. Powers are
// computed by square-and-multiply, the same way real software does it, and drawn as hops around
// a "clock" of n positions. Eve sees n, e and every c, and tries to factor n by trial division.

const KEYS = {
  tiny: { p: 5n, q: 11n, e: 3n },
  classic: { p: 61n, q: 53n, e: 17n },
  bigger: { p: 1009n, q: 1013n, e: 65537n },
};
const MESSAGES = { HI: 'HI', CODE: 'CODE', SECRET: 'SECRET' };

function egcd(a, b) {
  let [r0, r1, s0, s1] = [a, b, 1n, 0n];
  while (r1) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  return [r0, s0];
}
function makeKey(k) {
  const { p, q, e } = KEYS[k];
  const n = p * q, phi = (p - 1n) * (q - 1n);
  const d = ((egcd(e, phi)[1] % phi) + phi) % phi;
  return { p, q, e, n, phi, d };
}
/** Square-and-multiply, left to right. Returns every intermediate value (as BigInt) and labels. */
function powSteps(m, k, n) {
  const bits = k.toString(2);
  const steps = [];
  let r = 1n, pow = 0n;
  for (let i = 0; i < bits.length; i++) {
    if (i > 0) {
      r = (r * r) % n;
      pow *= 2n;
      steps.push({ v: r, op: 'square', pow });
    }
    if (bits[i] === '1') {
      r = (r * m) % n;
      pow += 1n;
      steps.push({ v: r, op: i === 0 ? 'start' : 'multiply', pow });
    }
  }
  return steps;
}
const letterNum = (ch) => BigInt(ch.charCodeAt(0) - 64);
const big = (v) => {
  const s = v.toString();
  return s.length > 12 ? s.slice(0, 6) + '…' + s.slice(-4) : s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
const PHASE = { enc: 2.6, send: 1.6, dec: 2.8, show: 0.8 };

export default {
  id: 'rsa',
  title: 'Public-Key Encryption (RSA)',
  category: 'cs',
  tagline: 'Anyone can lock a message with Alice’s public key; only her private key opens it.',
  ages: ['14-16', '16+'],
  topics: ['Cryptography', 'Number theory'],
  keywords: ['rsa', 'encryption', 'public key', 'private key', 'cryptography', 'prime numbers', 'modular arithmetic', 'factoring', 'https', 'eavesdropper', 'diffie hellman', 'square and multiply', 'quantum computer', 'shor'],
  blurb:
    'Every time your browser shows a padlock, it has agreed a secret with a website it has never met, over a network anyone can listen to. The trick is <b>public-key cryptography</b>. In RSA (1977), Alice publishes two numbers that let anyone lock a message for her, but only she can unlock it, because only she knows the two primes multiplied together to make her key. Here every number is real: tiny primes, so you can follow the arithmetic.',
  ideas: [
    'Alice multiplies two secret primes: <b>n = p × q</b>. She publishes n and a number e.',
    'Bob encrypts a number m as <b>c = mᵉ mod n</b>: a power on a clock with n positions.',
    'Alice decrypts with her private <b>d</b>: m = cᵈ mod n. Finding d needs p and q.',
    'Multiplying primes is easy; <b>factoring</b> n back into them is astronomically hard for big n.',
    'Real keys have n with over <b>600 digits</b>. A big enough quantum computer could break RSA, so new methods are being rolled out.',
  ],
  hint: 'Change the key size and message in the controls',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 300,
  params: [
    { key: 'key', label: 'Alice’s primes', type: 'select', value: 'tiny', options: [{ value: 'tiny', label: '5 × 11' }, { value: 'classic', label: '61 × 53' }, { value: 'bigger', label: '1009 × 1013' }] },
    { key: 'msg', label: 'Bob’s message', type: 'select', value: 'HI', options: Object.keys(MESSAGES).map((k) => ({ value: k, label: k })) },
    { key: 'eve', label: 'Eve tries to factor n', type: 'toggle', value: false },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.3, max: 3, step: 0.05, value: 1, unit: '×' },
    { key: 'restart', label: 'Send again', type: 'button', action: (sim) => sim.restart() },
  ],
  story: [
    {
      title: 'Sending a secret in public',
      text: 'Bob wants to send Alice a message, but every message crosses the internet where <b>Eve</b> can copy it. They have never met to agree a password. In 1977 Rivest, Shamir and Adleman found a way: Alice publishes a lock that anyone can close, but only she can open.',
      params: { key: 'tiny', msg: 'HI', eve: false, speed: 1 },
      enter: (s) => s.restart(),
      duration: 13,
    },
    {
      title: 'Alice makes her keys',
      text: 'Alice picks two primes, here <b>5 and 11</b>, and multiplies them: <b>n = 55</b>. She publishes n and <b>e = 3</b>: that’s her public key. From the primes she works out a private number <b>d = 27</b>, chosen so that 3 × 27 = 81 is one more than a multiple of (5−1)(11−1) = 40. She tells nobody p, q or d.',
      formula: 'n = p·q,   e·d ≡ 1 (mod (p−1)(q−1))',
      params: { key: 'tiny', msg: 'HI', eve: false, speed: 0.8 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Locking: a power on a clock',
      text: 'Bob turns each letter into a number (H = 8) and raises it to the power e, but on a clock of n = 55 positions: 8³ = 512, which is 17 after going round the clock 9 times. The hops scramble the number. Eve sees 17, n and e, yet working backwards is hard.',
      formula: 'c = mᵉ mod n',
      params: { key: 'tiny', msg: 'HI', eve: false, speed: 0.7 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Unlocking with the private key',
      text: 'Alice raises 17 to the power d = 27 on the same clock and lands exactly back on 8: H. Computers don’t multiply 27 times: <b>square-and-multiply</b> needs only a handful of steps, even for exponents hundreds of digits long.',
      formula: 'm = cᵈ mod n',
      check: {
        q: 'Eve has the public key (n = 55, e = 3) and the scrambled 17. What does she need to compute d?',
        options: ['Nothing more: e and n are enough', 'The two primes that multiply to make n', 'Bob’s computer'],
        answer: 1,
        setup: { key: 'tiny', msg: 'HI', eve: false },
        explain: 'd is worked out from (p−1)(q−1), so Eve needs p and q. For n = 55 she can find them by trial, but for a real key she would have to factor a 617-digit number.',
      },
      params: { key: 'tiny', msg: 'HI', eve: false, speed: 0.7 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Eve’s attack: factor n',
      text: 'Eve tries dividing n by 2, 3, 5, 7 … With n = 55 she finds 5 instantly, computes d herself and reads everything. With 61 × 53 = 3,233 it still takes only seconds. Small keys are no protection at all.',
      params: { key: 'classic', msg: 'CODE', eve: true, speed: 1.2 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Why big keys are safe',
      text: 'Multiplying two primes takes a computer a microsecond, but factoring the result gets dramatically harder as it grows. Real RSA keys use n with about <b>617 digits</b> (2048 bits). The best known methods would take far longer than the age of the universe on today’s computers.',
      check: {
        q: 'Doubling the number of digits in n makes factoring it…',
        options: ['About twice as hard', 'Enormously harder', 'Easier'],
        answer: 1,
        setup: { key: 'bigger', msg: 'SECRET', eve: true },
        explain: 'Trial division needs about √n tries, so doubling the digits squares the work. Even the best known algorithm grows faster than any power of the key length, which is why 617-digit keys are out of reach.',
      },
      params: { key: 'bigger', msg: 'SECRET', eve: true, speed: 1.4 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Padlocks, signatures and quantum computers',
      text: 'Your browser uses public-key maths to agree a secret with a website; the same idea run backwards gives <b>digital signatures</b> that prove who sent something. A large quantum computer running <b>Shor’s algorithm</b> could factor n quickly, so since 2024 new “post-quantum” methods based on different maths have been rolled out alongside RSA.',
      params: { key: 'classic', msg: 'SECRET', eve: false, speed: 1.4 },
      enter: (s) => s.restart(),
      duration: 17,
    },
    {
      title: 'Your turn',
      text: 'Try the three key sizes and messages, and switch Eve on and off. Note how Eve’s number of tries grows with the key, while Alice and Bob’s work barely changes.',
      params: { key: 'tiny', msg: 'CODE', eve: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let K, msg, cipher, letter = 0, phase = 'enc', pt = 0, done = [], eve = null, L = {};

    function restart() {
      K = makeKey(params.key);
      msg = MESSAGES[params.msg] || 'HI';
      cipher = [...msg].map((ch) => {
        const m = letterNum(ch);
        const enc = powSteps(m, K.e, K.n);
        const c = enc.at(-1).v;
        return { ch, m, c, enc, dec: powSteps(c, K.d, K.n) };
      });
      letter = 0;
      phase = 'enc';
      pt = 0;
      done = [];
      eve = { tried: 1n, found: null, t: 0 };
    }
    restart();

    function advance() {
      const order = ['enc', 'send', 'dec', 'show'];
      const i = order.indexOf(phase);
      if (i < order.length - 1) phase = order[i + 1];
      else {
        done.push(letter);
        letter++;
        phase = 'enc';
        if (letter >= cipher.length) phase = 'hold';
      }
      pt = 0;
    }

    function wheelPos(v, R) {
      const a = -Math.PI / 2 + (Number(v) / Number(K.n)) * TAU;
      return [L.wx + Math.cos(a) * R, L.wy + Math.sin(a) * R];
    }

    return {
      restart,
      resize(w, h) {
        const narrow = w < 700;
        if (narrow) {
          const R = clamp((h - 380) / 2.3, 40, 100);
          L = { narrow, bobX: 44, aliceX: w - 44, eveX: w / 2, chY: 140, eveY: 196, rowY: 266, compX: 16, compY: 312, wx: w / 2, wy: 352 + R, R };
        } else {
          const rx0 = w - 550 >= 360 ? 510 : Math.max(w * 0.4, 380);
          const R = clamp(Math.min((h - 418 - 40) / 2, (w - 40 - rx0) / 2 - 30), 60, 150);
          L = { narrow, bobX: 90, aliceX: w - 90, eveX: w / 2, chY: 150, eveY: 210, rowY: 306, compX: rx0, compY: 362, wx: rx0 + (w - 40 - rx0) / 2, wy: 418 + R, R };
        }
      },
      onParam(k) {
        if (k === 'key' || k === 'msg') restart();
      },
      update(dt) {
        const s = params.speed;
        if (phase === 'hold') {
          pt += dt * s;
          if (pt > 3) restart();
        } else {
          pt += (dt * s) / PHASE[phase];
          if (pt >= 1) advance();
        }
        if (params.eve && !eve.found) {
          eve.t += dt * s;
          // Eve tries about 12 divisors a second at first, then faster: a computer does billions
          const rate = 12 * Math.pow(1.6, eve.t);
          const step = BigInt(Math.max(1, Math.floor(rate * dt * s)));
          for (let i = 0n; i < step; i++) {
            eve.tried += 1n;
            if (K.n % eve.tried === 0n) {
              eve.found = eve.tried;
              break;
            }
          }
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const cur = cipher[Math.min(letter, cipher.length - 1)];
        // ---- people and channel
        const person = (x, y, name, col) => {
          ctx.fillStyle = rgba(col, 0.9);
          ctx.beginPath();
          ctx.arc(x, y - 10, 10, 0, TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(x, y + 14, 15, 11, 0, Math.PI, 0);
          ctx.fill();
          text(ctx, name, x, y + 32, { size: 12, align: 'center', weight: 700, color: col });
        };
        ctx.strokeStyle = rgba(C.violet, 0.35);
        ctx.setLineDash([5, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(L.bobX + 24, L.chY);
        ctx.lineTo(L.aliceX - 24, L.chY);
        ctx.moveTo(L.eveX, L.chY);
        ctx.lineTo(L.eveX, L.eveY - 30);
        ctx.stroke();
        ctx.setLineDash([]);
        person(L.bobX, L.chY, 'Bob', C.cyan);
        person(L.aliceX, L.chY, 'Alice', C.pink);
        person(L.eveX, L.eveY, 'Eve', C.red);
        if (!L.narrow) text(ctx, 'the internet: anyone can listen', L.eveX, L.chY - 16, { size: 11, align: 'center', color: C.dim });
        // envelope in flight
        if (phase === 'send') {
          const t = easeInOut(clamp(pt, 0, 1));
          const x = L.bobX + 24 + (L.aliceX - L.bobX - 48) * t;
          ctx.fillStyle = rgba(C.amber, 0.95);
          roundRect(ctx, x - 22, L.chY - 13, 44, 26, 5);
          ctx.fill();
          text(ctx, big(cur.c), x, L.chY + 1, { size: 12, align: 'center', weight: 700, color: '#1a1205', shadow: false, mono: true });
        }
        // ---- Alice's public key, private key
        tag(ctx, `public key: n = ${big(K.n)}, e = ${big(K.e)}`, L.narrow ? L.aliceX + 30 : L.aliceX, L.chY - (L.narrow ? 46 : 44), C.teal, { align: L.narrow ? 'right' : 'center' });
        if (!L.narrow) tag(ctx, `private: d = ${big(K.d)} (p = ${K.p}, q = ${K.q})`, L.aliceX, L.chY + 56, C.pink, { align: 'center' });
        // ---- letter rows: Bob's plaintext, Eve's copy, Alice's result
        const bs = L.narrow ? 22 : 30, step = bs + 4;
        const box = (x, y, s, col, filled, sub) => {
          ctx.fillStyle = filled ? rgba(col, 0.18) : 'rgba(255,255,255,0.03)';
          ctx.strokeStyle = rgba(col, filled ? 0.8 : 0.25);
          ctx.lineWidth = 1.2;
          roundRect(ctx, x, y - bs / 2, bs, bs, 6);
          ctx.fill();
          ctx.stroke();
          text(ctx, s, x + bs / 2, y, { size: L.narrow ? 12 : 14, align: 'center', weight: 700, mono: true, color: filled ? C.ink : C.faint });
          if (sub) text(ctx, sub, x + bs / 2, y + bs / 2 + 11, { size: 10, align: 'center', mono: true, color: C.dim });
        };
        const sent = (i) => i < letter || (i === letter && (phase === 'dec' || phase === 'show' || (phase === 'send' && pt > 0.5)));
        const n = cipher.length, rowW = n * step;
        const bx = clamp(L.bobX - 30, 8, w), ax = clamp(L.aliceX + 30 - rowW, 0, w - rowW - 8), ex = L.eveX - rowW / 2;
        const rowY = L.rowY - (L.narrow ? 20 : 0);
        const showNums = !L.narrow || n <= 4;
        cipher.forEach((c, i) => {
          box(bx + i * step, rowY, c.ch, C.cyan, true, showNums ? String(c.m) : '');
          if (!L.narrow) box(ex + i * step, rowY, sent(i) ? '■' : '', C.red, sent(i), sent(i) ? big(c.c) : '');
          const got = done.includes(i) || (i === letter && phase === 'show');
          box(ax + i * step, rowY, got ? c.ch : '', C.pink, got, got && showNums ? String(c.m) : '');
        });
        if (L.narrow) {
          const seen = cipher.filter((_, i) => sent(i)).map((c) => big(c.c));
          text(ctx, `Eve copies: ${seen.length ? seen.join(' · ') : '…'}`, 16, rowY + 34, { size: 11, mono: true, color: C.red });
        }
        if (!L.narrow) {
          text(ctx, 'Bob’s message', bx, rowY - 30, { size: 11, color: C.dim });
          text(ctx, 'Eve’s copy', ex, rowY - 30, { size: 11, color: C.dim });
          text(ctx, 'Alice reads', ax, rowY - 30, { size: 11, color: C.dim });
        }
        // ---- Eve's factoring attempt
        if (params.eve) {
          const ey = L.narrow ? L.eveY - 4 : L.eveY + 2;
          const exx = L.eveX + 30;
          if (eve.found) {
            const other = K.n / eve.found;
            text(ctx, `Found it: ${big(K.n)} = ${eve.found} × ${other}`, exx, ey - 8, { size: 12, color: C.red, weight: 700 });
            text(ctx, `so she can compute d = ${big(K.d)}`, exx, ey + 9, { size: 11, color: C.red });
          } else {
            text(ctx, `trying divisors… ${eve.tried.toLocaleString('en')}`, exx, ey - 8, { size: 12, color: C.red, weight: 600 });
            text(ctx, `up to √n ≈ ${Math.round(Math.sqrt(Number(K.n))).toLocaleString('en')}`, exx, ey + 9, { size: 11, color: C.dim });
          }
        }
        // ---- the clock (mod n) and the computation
        const R = L.R;
        ctx.strokeStyle = 'rgba(160,175,230,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(L.wx, L.wy, R, 0, TAU);
        ctx.stroke();
        const nn = Number(K.n);
        const tickEvery = nn <= 60 ? 1 : nn <= 4000 ? 500 : 100000;
        for (let v = 0; v < nn; v += tickEvery) {
          const [x, y] = wheelPos(BigInt(v), R);
          ctx.fillStyle = nn <= 60 ? 'rgba(233,237,247,0.35)' : 'rgba(233,237,247,0.25)';
          ctx.beginPath();
          ctx.arc(x, y, nn <= 60 ? 2.2 : 1.6, 0, TAU);
          ctx.fill();
          if ((nn <= 60 && v % 5 === 0) || nn > 60) {
            const [lx, ly] = wheelPos(BigInt(v), R + 14);
            text(ctx, big(BigInt(v)), lx, ly, { size: 9, align: 'center', color: C.dim, shadow: false });
          }
        }
        text(ctx, `mod ${big(K.n)}`, L.wx, L.wy, { size: 13, align: 'center', color: C.dim, weight: 600 });
        const steps = phase === 'enc' ? cur.enc : phase === 'dec' ? cur.dec : null;
        const col = phase === 'enc' ? C.cyan : C.pink;
        if (steps) {
          const shown = Math.min(steps.length, Math.floor(clamp(pt, 0, 0.999) * (steps.length + 0.6)) + 1);
          let prev = null;
          for (let i = 0; i < shown; i++) {
            const [x, y] = wheelPos(steps[i].v, R);
            if (prev) {
              ctx.strokeStyle = rgba(col, 0.25 + 0.6 * (i / shown));
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(prev[0], prev[1]);
              ctx.quadraticCurveTo(L.wx, L.wy, x, y);
              ctx.stroke();
            }
            ctx.fillStyle = i === shown - 1 ? C.white : col;
            ctx.beginPath();
            ctx.arc(x, y, i === shown - 1 ? 6 : 4, 0, TAU);
            ctx.fill();
            prev = [x, y];
          }
          const last = steps[shown - 1];
          const base = phase === 'enc' ? cur.m : cur.c;
          const exp = phase === 'enc' ? K.e : K.d;
          const who = phase === 'enc' ? 'Bob locks' : 'Alice unlocks';
          text(ctx, `${who}: ${big(base)}^${big(exp)} mod ${big(K.n)}`, L.compX, L.compY, { size: L.narrow ? 12 : 14, weight: 700, color: col, mono: true });
          text(ctx, `step ${shown} of ${steps.length}: ${last.op === 'start' ? 'start with' : last.op}, power ${big(last.pow)} → ${big(last.v)}`, L.compX, L.compY + 22, { size: L.narrow ? 11 : 12, color: C.ink, mono: true });
        } else {
          const [x, y] = wheelPos(phase === 'show' || phase === 'hold' ? cur.m : cur.c, R);
          ctx.fillStyle = C.amber;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, TAU);
          ctx.fill();
          const msg2 = phase === 'send' ? `${cur.ch} = ${cur.m} travels as ${big(cur.c)}` : phase === 'show' ? `${big(cur.c)} unlocks to ${cur.m} = ${cur.ch}` : `Message delivered: ${msg}`;
          text(ctx, msg2, L.compX, L.compY, { size: L.narrow ? 12 : 14, weight: 700, color: C.amber, mono: true });
        }
      },
      stats() {
        const bits = K.n.toString(2).length;
        return [
          { label: 'Key size (real keys: 2048)', value: `${bits} bits`, color: C.teal },
          { label: 'n = p × q', value: big(K.n) },
          { label: 'Alice’s work per letter', value: `${cipher[0]?.dec.length ?? 0} steps` },
          { label: 'Eve’s tries', value: params.eve ? eve.tried.toLocaleString('en') + (eve.found ? ' ✓' : '') : '—', color: eve.found ? C.red : undefined },
        ];
      },
    };
  },
};
