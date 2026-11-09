import { C, clamp, rgba, text, tag, backdrop, roundRect, TAU } from '../../core/util.js';

// Hamming(7,4): 4 data bits plus 3 parity bits. Drawn as three overlapping circles, each of which
// must hold an even number of 1s. One flipped bit makes exactly the circles that contain it fail,
// and each bit sits in a different combination of circles, so the failures point to it.
// Bits: [p1, p2, p3, d1, d2, d3, d4]; circle A = {p1, d1, d2, d4}, B = {p2, d1, d3, d4}, C = {p3, d2, d3, d4}.

const CIRCLES = [[0, 3, 4, 6], [1, 3, 5, 6], [2, 4, 5, 6]];
const BY_SYNDROME = { 1: 0, 2: 1, 4: 2, 3: 3, 5: 4, 6: 5, 7: 6 };
const NAMES = ['p₁', 'p₂', 'p₃', 'd₁', 'd₂', 'd₃', 'd₄'];
const IW = 32, IH = 24;

function encode(d) {
  const [d1, d2, d3, d4] = d;
  return [d1 ^ d2 ^ d4, d1 ^ d3 ^ d4, d2 ^ d3 ^ d4, d1, d2, d3, d4];
}
const failing = (b) => CIRCLES.map((c) => c.reduce((s, i) => s ^ b[i], 0) === 1);
function decode(b) {
  const f = failing(b);
  const s = (f[0] ? 1 : 0) + (f[1] ? 2 : 0) + (f[2] ? 4 : 0);
  const out = b.slice();
  if (s) out[BY_SYNDROME[s]] ^= 1;
  return out.slice(3);
}
function picture() {
  const img = new Uint8Array(IW * IH);
  for (let y = 0; y < IH; y++)
    for (let x = 0; x < IW; x++) {
      const dx = x + 0.5 - 16, dy = y + 0.5 - 12;
      const r = Math.hypot(dx, dy);
      let v = r < 11 ? 1 : 0;
      if (Math.hypot(x + 0.5 - 12, y + 0.5 - 9) < 2.1 || Math.hypot(x + 0.5 - 20, y + 0.5 - 9) < 2.1) v = 0;
      const mr = Math.hypot(dx, y + 0.5 - 11.5);
      if (mr > 5.2 && mr < 7 && y + 0.5 > 14) v = 0;
      img[y * IW + x] = v;
    }
  return img;
}
const PIC = picture();
const PHASES = [
  { key: 'data', dur: 1.6, note: '4 data bits to send' },
  { key: 'parity', dur: 2.0, note: 'each circle gets a parity bit to make its count of 1s even' },
  { key: 'noise', dur: 1.4, note: 'noise on the line flips a bit' },
  { key: 'check', dur: 2.2, note: 'the receiver checks every circle: an odd count fails' },
  { key: 'fix', dur: 2.4, note: '' },
];

export default {
  id: 'hamming',
  title: 'Error-Correcting Codes',
  category: 'cs',
  tagline: 'Add a few clever check bits and a receiver can find and fix errors by itself.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Data representation', 'Networks'],
  keywords: ['error correction', 'hamming code', 'parity', 'parity bit', 'noise', 'bit flip', 'qr code', 'reed solomon', 'ecc memory', 'redundancy', 'information theory', 'syndrome'],
  blurb:
    'Every channel is noisy: radio crackles, scratches hit discs, cosmic rays flip bits in memory. Rather than ask for the message again, you can add a few extra <b>check bits</b> so the receiver can repair the damage itself. In 1950 Richard Hamming found a neat way: 3 check bits protect 4 data bits, and the pattern of failed checks points straight at any single flipped bit. Here you can watch it happen, flip bits yourself, and send a picture down a noisy line.',
  ideas: [
    'A <b>parity bit</b> makes the number of 1s even, so any single flip is noticed.',
    'Hamming(7,4) uses three <b>overlapping</b> checks; each bit sits in a different combination of them.',
    'The set of failed checks (the <b>syndrome</b>) names the flipped bit, so it can be fixed.',
    'It costs 75% more bits, but turns a speckled picture into a clean one.',
    'Two flips in one block fool it. Stronger codes protect QR codes, phones, deep-space probes and computer memory.',
  ],
  hint: 'Tap any bit in the circles to flip it',
  renderScale: 1,
  thumbChapter: 3,
  thumbFrames: 300,
  params: [
    { key: 'noise', label: 'Noise: chance each bit flips', type: 'range', min: 0, max: 0.15, step: 0.005, value: 0.03, digits: 3 },
    { key: 'checks', label: 'Checks in the diagram', type: 'select', value: 3, options: [{ value: 1, label: 'One circle' }, { value: 3, label: 'Three circles' }] },
    { key: 'errors', label: 'Bits flipped in the demo', type: 'select', value: 1, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }] },
    { key: 'auto', label: 'Run the demo automatically', type: 'toggle', value: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.3, max: 3, step: 0.05, value: 1, unit: '×' },
    { key: 'resend', label: 'Send the picture again', type: 'button', action: (sim) => sim.resend() },
  ],
  story: [
    {
      title: 'Noise flips bits',
      text: 'A picture is sent as bits: 1 for a bright pixel, 0 for dark. On the way, noise flips about <b>3 in every 100</b> bits. The left picture is what arrives with no protection: speckled. The right one was sent with a <b>Hamming code</b>. How did it survive?',
      params: { noise: 0.03, checks: 3, errors: 1, auto: false, speed: 1 },
      enter: (s) => s.resend(),
      duration: 13,
    },
    {
      title: 'A parity check',
      text: 'The simplest protection: add one bit so the circle holds an <b>even</b> number of 1s. If one bit flips, the count becomes odd and the check fails. But it can’t say <em>which</em> of the bits in the circle went wrong, so the receiver must ask for the block again.',
      params: { checks: 1, errors: 1, auto: true, speed: 0.8 },
      enter: (s) => s.restartDemo(),
      duration: 15,
    },
    {
      title: 'Three overlapping checks',
      text: 'Hamming’s idea: use three overlapping circles, each with its own parity bit. Every bit lies in a <b>different combination</b> of circles. When a bit flips, exactly the circles containing it fail, and that pattern points to it. 4 data bits need only 3 check bits.',
      formula: '7 bits sent = 4 data + 3 checks',
      check: {
        q: 'Circles A and B fail, but C passes. Which bit flipped?',
        options: ['The bit in the very centre', 'The bit shared by A and B only', 'A parity bit'],
        answer: 1,
        setup: { checks: 3, errors: 1, auto: false },
        explain: 'Only one position lies in A and B but outside C: d₁. The centre bit would make all three fail; a parity bit lies in just one circle.',
      },
      params: { checks: 3, errors: 1, auto: true, speed: 0.8 },
      enter: (s) => s.restartDemo(),
      duration: 17,
    },
    {
      title: 'A clean picture through a noisy line',
      text: 'Each 4 pixels travel as a 7-bit block and the receiver fixes any single flip. At 3% noise the unprotected picture has dozens of wrong pixels; the coded one usually has none, at the cost of sending 75% more bits.',
      params: { noise: 0.03, checks: 3, errors: 1, auto: true, speed: 1.2 },
      enter: (s) => s.resend(),
      duration: 14,
    },
    {
      title: 'Two errors fool it',
      text: 'Hamming(7,4) assumes at most one flip per block. With two, the failed circles point at a third, innocent bit, and “fixing” it makes three wrong. Turn the noise up and errors creep into the coded picture too. Stronger codes add more check bits.',
      check: {
        q: 'Two bits in the same 7-bit block flip. What does the decoder do?',
        options: ['Fixes both', 'Spots it and asks again', 'Flips a third bit, making it worse'],
        answer: 2,
        setup: { checks: 3, errors: 2, auto: false },
        explain: 'Two flips give a pattern of failed circles that looks exactly like a single flip somewhere else, so the decoder confidently flips the wrong bit. Adding an eighth overall parity bit (SECDED) lets it detect this case instead.',
      },
      params: { noise: 0.1, checks: 3, errors: 2, auto: true, speed: 0.8 },
      enter: (s) => (s.restartDemo(), s.resend()),
      duration: 17,
    },
    {
      title: 'Codes are everywhere',
      text: 'Hamming invented his code in 1950, fed up with Bell Labs’ computer halting on errors over weekends. Today server memory corrects flipped bits on the fly; <b>QR codes</b> use Reed–Solomon codes and still scan with up to 30% damaged; Voyager’s photos crossed 20 billion km; and your phone’s 5G link uses LDPC and polar codes close to Shannon’s theoretical limit.',
      params: { noise: 0.05, checks: 3, errors: 1, auto: true, speed: 1.2 },
      enter: (s) => (s.restartDemo(), s.resend()),
      duration: 17,
    },
    {
      title: 'Your turn',
      text: 'Tap any bit in the circles to flip it and see which checks fail. Slide the noise to find where the coded picture starts to break down.',
      params: { noise: 0.06, checks: 3, errors: 1, auto: false, speed: 1 },
      enter: (s) => s.restartDemo(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let bits, sent, flipped = [], fixedAt = -1, phase = 0, pt = 0, manual = false, L = {};
    let raw, coded, pos = 0, hold = 0, rawErr = 0, codedErr = 0, blockAcc = 0;

    function restartDemo() {
      const d = [0, 1, 2, 3].map(() => (Math.random() < 0.5 ? 1 : 0));
      if (d.every((v) => v === 0)) d[1] = 1;
      sent = encode(d);
      bits = sent.slice();
      flipped = [];
      fixedAt = -1;
      phase = 0;
      pt = 0;
      manual = false;
    }
    function resend() {
      raw = new Int8Array(IW * IH).fill(-1);
      coded = new Int8Array(IW * IH).fill(-1);
      pos = 0;
      hold = 0;
      rawErr = codedErr = 0;
    }
    restartDemo();
    resend();

    const nChecks = () => Number(params.checks);
    const fails = () => failing(bits).map((f, i) => f && i < nChecks());
    function applyNoise() {
      const n = Number(params.errors);
      const pool = nChecks() === 1 ? CIRCLES[0] : [0, 1, 2, 3, 4, 5, 6];
      flipped = [];
      while (flipped.length < n) {
        const i = pool[Math.floor(Math.random() * pool.length)];
        if (!flipped.includes(i)) flipped.push(i);
      }
      for (const i of flipped) bits[i] ^= 1;
    }
    function fix() {
      if (nChecks() === 1) return;
      const f = failing(bits);
      const s = (f[0] ? 1 : 0) + (f[1] ? 2 : 0) + (f[2] ? 4 : 0);
      if (s) {
        fixedAt = BY_SYNDROME[s];
        bits[fixedAt] ^= 1;
      }
    }
    function sendBlocks(n) {
      for (let k = 0; k < n && pos < IW * IH; k++, pos += 4) {
        const d = [0, 1, 2, 3].map((i) => PIC[pos + i]);
        const flip = (b) => (Math.random() < params.noise ? b ^ 1 : b);
        const r = d.map(flip);
        const c = decode(encode(d).map(flip));
        for (let i = 0; i < 4; i++) {
          raw[pos + i] = r[i];
          coded[pos + i] = c[i];
          if (r[i] !== d[i]) rawErr++;
          if (c[i] !== d[i]) codedErr++;
        }
      }
    }
    // Venn layout
    function spots() {
      const { vx, vy, r } = L;
      return [
        [vx - 1.02 * r, vy - 0.62 * r], [vx + 1.02 * r, vy - 0.62 * r], [vx, vy + 1.17 * r],
        [vx, vy - 0.6 * r], [vx - 0.52 * r, vy + 0.3 * r], [vx + 0.52 * r, vy + 0.3 * r], [vx, vy + 0.02 * r],
      ];
    }
    const centres = () => [[L.vx - 0.55 * L.r, L.vy - 0.32 * L.r], [L.vx + 0.55 * L.r, L.vy - 0.32 * L.r], [L.vx, L.vy + 0.63 * L.r]];

    return {
      restartDemo,
      resend,
      resize(w, h) {
        const narrow = w < 700;
        if (narrow) {
          const r = clamp(Math.min(w * 0.19, (h - 350) / 3.1), 34, 70);
          const s = (w - 32 - 14) / 2;
          L = { narrow, vx: w / 2, vy: 100 + 1.4 * r, r, capY: 100 + 3.1 * r + 14, ix: 16, iy: 100 + 3.1 * r + 58, is: s, gap: 14 };
        } else {
          const r = clamp(Math.min((h - 470) / 3.1, 100), 52, 100);
          const ix = w - 550 >= 360 ? 510 : Math.max(w * 0.42, 400);
          const s = Math.min((w - 40 - ix - 24) / 2, 300);
          L = { narrow, vx: 40 + 1.6 * r, vy: 100 + 1.4 * r, r, capY: 100 + 3.1 * r + 18, ix, iy: 110, is: s, gap: 24 };
        }
      },
      onParam(k) {
        if (k === 'checks' || k === 'errors') restartDemo();
      },
      pointerDown(p) {
        const sp = spots();
        const rr = L.r * 0.19;
        for (let i = 0; i < 7; i++) {
          if (nChecks() === 1 && !CIRCLES[0].includes(i)) continue;
          if (Math.hypot(p.x - sp[i][0], p.y - sp[i][1]) < rr + 4) {
            bits[i] ^= 1;
            flipped = bits.map((b, j) => (b !== sent[j] ? j : -1)).filter((j) => j >= 0);
            fixedAt = -1;
            phase = 3;
            pt = 0;
            manual = true;
            return;
          }
        }
      },
      update(dt) {
        const s = params.speed;
        // picture transmission: about 30 blocks a second, then a pause and a fresh send
        if (pos < IW * IH) {
          blockAcc += 30 * s * dt;
          sendBlocks(Math.floor(blockAcc));
          blockAcc -= Math.floor(blockAcc);
        }
        else if ((hold += dt * s) > 3.5) resend();
        // the Venn demo
        if (!params.auto && phase >= PHASES.length - 1 && pt >= 1) return;
        pt += (dt * s) / PHASES[Math.min(phase, PHASES.length - 1)].dur;
        if (pt >= 1) {
          if (phase === 1) applyNoise();
          if (phase === 3) fix();
          if (phase < PHASES.length - 1) (phase++, (pt = 0));
          else if (params.auto) restartDemo();
          else pt = 1;
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const key = PHASES[phase].key;
        const showParity = phase >= 1 || manual;
        const checking = phase >= 3 || manual;
        const f = fails();
        const cs = centres();
        const names = ['A', 'B', 'C'];
        cs.forEach(([x, y], i) => {
          const off = i >= nChecks();
          const bad = checking && f[i];
          ctx.fillStyle = off ? 'rgba(255,255,255,0.015)' : bad ? rgba(C.red, 0.16) : checking ? rgba(C.teal, 0.08) : rgba([C.blue, C.violet, C.cyan][i], 0.06);
          ctx.strokeStyle = off ? 'rgba(255,255,255,0.08)' : bad ? C.red : checking ? rgba(C.teal, 0.7) : rgba([C.blue, C.violet, C.cyan][i], 0.6);
          ctx.lineWidth = bad ? 3 : 1.6;
          ctx.beginPath();
          ctx.arc(x, y, L.r, 0, TAU);
          ctx.fill();
          ctx.stroke();
          if (!off) {
            const lx = x + (i === 0 ? -0.78 : i === 1 ? 0.78 : 0) * L.r, ly = y + (i === 2 ? 0.82 : -0.78) * L.r;
            const label = checking ? `${names[i]} ${bad ? '✗' : '✓'}` : names[i];
            text(ctx, label, i === 2 ? lx + L.r * 0.75 : lx, i === 2 ? ly - L.r * 0.1 : ly, { size: 13, weight: 700, align: 'center', color: bad ? C.red : checking ? C.teal : C.dim });
          }
        });
        const sp = spots();
        const rr = L.r * 0.19;
        for (let i = 0; i < 7; i++) {
          const off = nChecks() === 1 && !CIRCLES[0].includes(i);
          const isParity = i < 3;
          if (isParity && !showParity) continue;
          const [x, y] = sp[i];
          const wasFlipped = flipped.includes(i) && phase >= 2;
          const wasFixed = i === fixedAt && phase >= 4;
          const wrong = bits[i] !== sent[i];
          let col = isParity ? C.amber : C.cyan;
          if (wasFixed) col = wrong ? C.red : C.teal;
          else if (wasFlipped && wrong) col = C.red;
          ctx.globalAlpha = off ? 0.25 : isParity && key === 'parity' ? clamp(pt * 2, 0, 1) : 1;
          ctx.fillStyle = rgba(col, 0.22);
          ctx.strokeStyle = col;
          ctx.lineWidth = wasFlipped || wasFixed ? 3 : 1.6;
          ctx.beginPath();
          ctx.arc(x, y, rr, 0, TAU);
          ctx.fill();
          ctx.stroke();
          text(ctx, String(bits[i]), x, y, { size: Math.max(13, rr * 0.9), weight: 700, align: 'center', mono: true });
          text(ctx, NAMES[i], x + rr + 8, y - rr * 0.7, { size: 10, color: C.dim });
          ctx.globalAlpha = 1;
          if (key === 'noise' && wasFlipped) {
            ctx.strokeStyle = rgba(C.amber, 1 - pt);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, rr + 6 + pt * 18, 0, TAU);
            ctx.stroke();
          }
        }
        // caption
        let note = PHASES[phase].note;
        if (key === 'noise' && flipped.length > 1) note = 'noise flips two bits';
        if (key === 'fix' || (manual && phase >= 3)) {
          const nf = f.filter(Boolean).length;
          if (nChecks() === 1) note = nf ? 'circle A fails: an error is in there, but which of its 4 bits?' : 'circle A passes';
          else if (fixedAt >= 0) note = bits.every((b, i) => b === sent[i]) ? `failed circles point to ${NAMES[fixedAt]}: flip it back, fixed!` : `the pattern points to ${NAMES[fixedAt]}, the wrong bit: now 3 bits are wrong`;
          else note = nf ? 'checks fail: the decoder will flip the bit they point to' : 'every circle passes: nothing to fix';
        }
        if (!api.thumbnail) {
          const cx = L.narrow ? 16 : 30;
          text(ctx, note, cx, L.capY, { size: L.narrow ? 12 : 13, color: key === 'fix' ? (note.includes('wrong bit') ? C.red : C.teal) : C.ink, weight: 600 });
        }
        // pictures
        const drawPic = (img, x, y, s, label, err) => {
          const c = s / IW, hh = c * IH;
          ctx.fillStyle = '#0b1022';
          roundRect(ctx, x - 4, y - 4, s + 8, hh + 8, 8);
          ctx.fill();
          for (let j = 0; j < IH; j++)
            for (let i = 0; i < IW; i++) {
              const k = j * IW + i, v = img[k];
              if (v < 0) continue;
              const bad = v !== PIC[k];
              ctx.fillStyle = bad ? (v ? '#ff6b81' : '#7a1f33') : v ? '#ffd166' : '#151c38';
              ctx.fillRect(x + i * c, y + j * c, c - 0.6, c - 0.6);
            }
          text(ctx, label, x, y - 16, { size: 12, weight: 700, color: C.ink });
          text(ctx, `${err} wrong pixel${err === 1 ? '' : 's'}`, x, y + hh + 18, { size: 12, color: err ? C.red : C.teal, weight: 600 });
        };
        drawPic(raw, L.ix, L.iy, L.is, 'No protection', rawErr);
        drawPic(coded, L.ix + L.is + L.gap, L.iy, L.is, 'Hamming (7,4)', codedErr);
        if (!L.narrow && !api.thumbnail) {
          const by = L.iy + (L.is / IW) * IH + 46;
          tag(ctx, `${IW * IH} bits sent`, L.ix, by, C.dim);
          tag(ctx, `${(IW * IH * 7) / 4} bits sent (+75%)`, L.ix + L.is + L.gap, by, C.dim);
        }
      },
      stats() {
        const total = Math.max(1, pos);
        return [
          { label: 'Noise', value: (params.noise * 100).toFixed(1) + ' % of bits', color: C.amber },
          { label: 'Wrong pixels, no code', value: ((rawErr / total) * 100).toFixed(1) + ' %' },
          { label: 'Wrong pixels, Hamming', value: ((codedErr / total) * 100).toFixed(1) + ' %', color: codedErr ? undefined : C.teal },
          { label: 'Extra bits sent', value: '75 %' },
        ];
      },
    };
  },
};
