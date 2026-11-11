import { C, Series, backdrop, clamp, drawGlow, roundRect, tag, text, TAU } from '../../core/util.js';

// The quantum repetition (bit-flip) code. A qubit α|0⟩ + β|1⟩ is spread over d qubits as α|00…0⟩ + β|11…1⟩.
// Each round, noise flips each qubit with probability p. Parity checks between neighbours (Z_i Z_{i+1}) reveal
// where flips happened without revealing α or β; the decoder flips back the minority. A logical error happens only
// when more than half the qubits flip in one round. Only bit flips and perfect checks here, to keep it clear.

const ALPHA = 0.8; // and β = 0.6
const binom = (n, k) => {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
};
const logicalRate = (d, p) => {
  let s = 0;
  for (let k = (d + 1) / 2; k <= d; k++) s += binom(d, k) * p ** k * (1 - p) ** (d - k);
  return s;
};

export default {
  id: 'quantum-error-correction',
  title: 'Quantum Error Correction',
  category: 'quantum',
  tagline: 'Qubits are fragile. Spread one across many, and check it without looking.',
  ages: ['16+'],
  topics: ['Quantum computing', 'Errors', 'Information'],
  keywords: ['quantum error correction', 'qubit', 'repetition code', 'bit flip', 'syndrome', 'parity check', 'surface code', 'threshold', 'logical qubit', 'Willow', 'no-cloning'],
  blurb:
    'Quantum computers are ruined by noise: a stray vibration or photon can flip a qubit and wreck a calculation. You can’t back a qubit up (quantum states can’t be copied) and you can’t peek at it (measuring destroys it). Yet there is a way: spread one qubit across several and ask only clever yes/no questions about them. Watch errors get caught and fixed, and see why bigger codes win only when the hardware is good enough.',
  ideas: [
    'A qubit can’t be <b>copied</b> (the no-cloning theorem) or <b>looked at</b> without destroying its superposition.',
    'Instead, encode it as α|000⟩ + β|111⟩: one qubit’s worth of information spread over three, entangled.',
    '<b>Parity checks</b> ask “are these two the same?”, which reveals where an error is but nothing about α or β.',
    'If errors are rare enough (below the <b>threshold</b>), a bigger code makes logical errors exponentially rarer.',
    'Real machines use the <b>surface code</b>, which catches both kinds of quantum error; in 2024 Google showed it improving as it grew.',
  ],
  hint: 'Change the error rate and the code size',
  thumbChapter: 5,
  thumbFrames: 300,
  params: [
    { key: 'p', label: 'Chance each qubit flips per round', type: 'range', min: 0, max: 0.6, step: 0.01, value: 0.1, format: (v) => Math.round(v * 100) + ' %' },
    { key: 'd', label: 'Code size (qubits)', type: 'select', value: 3, options: [3, 5, 7, 9].map((d) => ({ value: d, label: String(d) })) },
    { key: 'fix', label: 'Check and correct', type: 'toggle', value: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.3, max: 4, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'peek', label: 'Peek at the qubits', type: 'button', action: (s) => s.peek() },
    { key: 'restart', label: 'Reset counts', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'Fragile qubits',
      text: 'The top qubit holds 0.8|0⟩ + 0.6|1⟩, a superposition. Each round, noise has a chance of flipping it, swapping the 0 and 1 parts. After a flip the information is wrong, and nothing in the qubit tells us so. Real qubits err about once in every few hundred to thousand steps; here it is much more often so you can watch.',
      params: { p: 0.1, d: 3, fix: false, speed: 1 },
      enter: (s) => s.restart(),
      duration: 13,
    },
    {
      title: 'No copying, no peeking',
      text: 'For ordinary bits you would keep backup copies and look at them now and then. Neither works here. Quantum states can’t be copied (the no-cloning theorem), and looking at a qubit destroys it: watch the peek collapse the superposition into a plain 0 or 1, with the 0.6 and 0.8 gone for good.',
      params: { p: 0.1, d: 3, fix: false },
      enter: (s) => setTimeout(() => s.peek(), 2500),
      duration: 14,
    },
    {
      title: 'Spread it out',
      text: 'Instead, entangle the qubit with two partners to make 0.8|000⟩ + 0.6|111⟩ (the bottom row). This is not three copies: it is a single qubit’s worth of information spread across three. A flip on any one of them, say the middle, turns it into 0.8|010⟩ + 0.6|101⟩.',
      formula: 'α|0⟩ + β|1⟩   →   α|000⟩ + β|111⟩',
      params: { p: 0.1, d: 3, fix: false },
      duration: 14,
    },
    {
      title: 'Asking the right question',
      text: 'The diamonds are parity checks, done with extra helper qubits. Each asks only “are my two neighbours the same?”. Both halves of the superposition give the same answer, so the check learns where a flip happened without learning anything about the 0.8 or 0.6. The superposition survives.',
      check: {
        q: 'Checks between qubits 1–2 and 2–3 both say “different”. Which qubit flipped?',
        options: ['Qubit 2, the one they share', 'Qubit 1', 'We can’t tell without measuring α and β'],
        answer: 0,
        setup: { p: 0.1, d: 3, fix: false },
        explain: 'Only the middle qubit sits in both checks. Flip it back and 0.8|000⟩ + 0.6|111⟩ is restored exactly. This pattern of check results is called the syndrome.',
      },
      params: { p: 0.1, d: 3, fix: true },
      duration: 14,
    },
    {
      title: 'Catch and correct',
      text: 'Now every round runs the checks and flips back the odd one out. The protected qubit fails only when two or more of its three qubits flip in the same round. Compare the error counts: at a 10 % flip rate the single qubit fails about once in 10 rounds, the protected one about once in 35.',
      formula: 'logical failure ≈ 3p²   (vs p for a bare qubit)',
      params: { p: 0.1, d: 3, fix: true, speed: 2.5 },
      enter: (s) => s.restart(),
      duration: 20,
    },
    {
      title: 'Bigger codes and the threshold',
      text: 'Use 7 qubits and the code only fails if 4 flip at once: far rarer. The panel shows the failure rate for each code size. While the physical error rate is below the threshold (50 % for this simple code), every step up in size makes errors much rarer. Above it, bigger codes make things worse.',
      check: {
        q: 'When does making the code bigger reduce errors?',
        options: ['Only when each qubit’s error rate is below the threshold', 'Always: more qubits are always better', 'Never: more qubits mean more errors'],
        answer: 0,
        setup: { p: 0.1, d: 7, fix: true },
        explain: 'More qubits means more chances for errors, but also more evidence to outvote them. Below the threshold the extra evidence wins; above it, the extra errors do. That is why the quality of each physical qubit matters so much.',
      },
      params: { p: 0.1, d: 7, fix: true, speed: 1.5 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'The real thing',
      text: 'Real qubits also suffer phase flips (the sign between 0 and 1 changes), and the checks themselves can fail. The <b>surface code</b> lays qubits out like a chessboard and checks both kinds of error at once; it works if each step fails less than about 1 % of the time. In 2024 Google’s Willow chip crossed that line: each time the code grew (3×3, 5×5, 7×7) the logical error rate roughly halved. A useful machine may need around a thousand physical qubits for every logical one.',
      params: { p: 0.04, d: 9, fix: true },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Your turn',
      text: 'Change the flip rate and the code size, switch correction off and on, and peek. Find where the bigger code stops helping.',
      params: { p: 0.15, d: 5, fix: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let e = [], single = 0, logical = 0, phase = 0, t = 0, flips = [], fixes = [], singleFlip = false, peekT = 0, peekVal = 0;
    let rounds = 0, singleFails = 0, codeFails = 0;
    const sSingle = new Series(400), sCode = new Series(400);
    const D = () => +params.d;

    function restart() {
      e = new Array(D()).fill(0);
      single = 0;
      logical = 0;
      phase = 0;
      t = 0;
      flips = [];
      fixes = [];
      rounds = singleFails = codeFails = 0;
      sSingle.clear();
      sCode.clear();
    }
    function peek() {
      peekT = 2.6;
      peekVal = Math.random() < ALPHA * ALPHA ? 0 : 1;
    }
    const syndrome = () => e.slice(0, -1).map((b, i) => b ^ e[i + 1]);

    return {
      restart,
      peek,
      reset: restart,
      resize() {
        if (!e.length) restart();
      },
      onParam(k) {
        if (k === 'd') restart();
      },
      update(dt) {
        dt = Math.min(dt, 0.05);
        if (peekT > 0) {
          peekT -= dt;
          return; // the world holds still while we look
        }
        t += dt * params.speed;
        // each round: noise (0–0.4 s), checks (0.4–0.8), correction (0.8–1.2), rest
        const P = [0.4, 0.8, 1.2, 1.5];
        if (phase === 0 && t > 0) {
          flips = e.map(() => Math.random() < params.p);
          singleFlip = Math.random() < params.p;
          flips.forEach((f, i) => f && (e[i] ^= 1));
          if (singleFlip) single ^= 1;
          phase = 1;
        } else if (phase === 1 && t > P[0]) phase = 2;
        else if (phase === 2 && t > P[1]) {
          fixes = [];
          if (params.fix) {
            const ones = e.reduce((a, b) => a + b, 0);
            // majority decoding: flip back the minority; if the majority flipped, we "fix" the wrong way
            if (ones > D() / 2) {
              e.forEach((b, i) => !b && fixes.push(i));
              logical ^= 1;
            } else e.forEach((b, i) => b && fixes.push(i));
            e = e.map(() => 0);
          }
          phase = 3;
        } else if (phase === 3 && t > P[2]) phase = 4;
        else if (phase === 4 && t > P[3]) {
          rounds++;
          // a bare qubit is "failed" whenever it is in the wrong state at the end of a round
          if (single) (singleFails++, (single = 0));
          if (params.fix && logical) (codeFails++, (logical = 0));
          if (!params.fix && e.reduce((a, b) => a + b, 0) > D() / 2) (codeFails++, (e = e.map(() => 0)));
          sSingle.push(singleFails / rounds);
          sCode.push(codeFails / rounds);
          t = 0;
          phase = 0;
          flips = [];
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0d0f26' });
        if (!e.length) return;
        const wide = w >= 760, d = D();
        const x0 = wide ? 80 : 34, sp = wide ? Math.min(84, (w - 420) / Math.max(d - 1, 1)) : Math.min(42, (w - 70) / Math.max(d - 1, 1));
        const yA = wide ? 190 : 175, yB = wide ? 400 : 320, R = wide ? 24 : 13;
        const qubit = (x, y, bit, flash, fix, label) => {
          ctx.globalCompositeOperation = 'lighter';
          if (flash) drawGlow(ctx, x, y, 44, C.red, 0.5);
          if (fix) drawGlow(ctx, x, y, 40, C.amber, 0.5);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = bit ? 'rgba(255,77,109,0.25)' : 'rgba(91,140,255,0.2)';
          ctx.strokeStyle = bit ? C.red : '#7fa6ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, R, 0, TAU);
          ctx.fill();
          ctx.stroke();
          if (!api.thumbnail) {
            text(ctx, bit ? '✗' : '✓', x, y + 1, { size: R, align: 'center', weight: 700, color: bit ? C.red : C.teal, shadow: false });
            if (label) text(ctx, label, x, y + R + 14, { size: 10, align: 'center', color: C.dim });
          }
        };
        const peeking = peekT > 0;
        const ket = (bits, flipped) => {
          if (peeking) return `|${String(peekVal).repeat(bits)}⟩   (measured: the superposition is gone)`;
          const a = Array.from({ length: bits }, (_, i) => (flipped[i] ? '1' : '0')).join('');
          const b = Array.from({ length: bits }, (_, i) => (flipped[i] ? '0' : '1')).join('');
          return `0.8|${a}⟩ + 0.6|${b}⟩`;
        };
        // lane A: a bare qubit
        if (!api.thumbnail) text(ctx, 'One bare qubit', x0 - R, yA - 50, { size: 15, weight: 600, color: C.ink });
        qubit(x0, yA, single, phase >= 1 && phase < 4 && singleFlip, false);
        if (!api.thumbnail) text(ctx, ket(1, [single]), x0 + 44, yA, { size: wide ? 18 : 12, mono: true, color: single ? C.red : C.ink });
        // lane B: the code
        if (!api.thumbnail) text(ctx, `The same qubit spread over ${d}`, x0 - R, yB - 70, { size: 15, weight: 600, color: C.ink });
        const syn = syndrome();
        for (let i = 0; i < d - 1; i++) {
          const cx = x0 + (i + 0.5) * sp, cy = yB - (wide ? 40 : 32), lit = phase >= 2 && syn[i];
          ctx.fillStyle = lit ? C.amber : 'rgba(233,237,247,0.12)';
          ctx.beginPath();
          ctx.moveTo(cx, cy - 8);
          ctx.lineTo(cx + 8, cy);
          ctx.lineTo(cx, cy + 8);
          ctx.lineTo(cx - 8, cy);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(233,237,247,0.2)';
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy + 6);
          ctx.lineTo(x0 + i * sp, yB - R);
          ctx.moveTo(cx + 6, cy + 6);
          ctx.lineTo(x0 + (i + 1) * sp, yB - R);
          ctx.stroke();
        }
        for (let i = 0; i < d; i++) qubit(x0 + i * sp, yB, e[i], phase >= 1 && phase < 4 && flips[i], phase >= 3 && fixes.includes(i), wide ? `q${i + 1}` : '');
        if (api.thumbnail) return;
        text(ctx, ket(d, e), x0 - R, yB + 56, { size: wide ? 18 : 12, mono: true, color: e.some(Boolean) ? C.amber : C.ink });
        const stage = peeking ? 'peeking: measurement collapses the state' : ['', 'noise strikes', 'parity checks', params.fix ? 'correction' : 'no correction', ''][phase] || '';
        if (stage) tag(ctx, stage, x0 - R, yB + 92, peeking ? C.red : C.cyan, { size: 11 });
        if (wide) this.panel(w);
        tag(ctx, `bare qubit failed ${singleFails} × · code failed ${codeFails} × in ${rounds} rounds`, w - 16, 84, C.ink, { align: 'right', size: 11 });
      },
      panel(w) {
        // logical error per round vs physical error rate for each code size (exact for majority voting)
        const bw = 300, bh = 230, x0 = w - bw - 16, y0 = 108;
        ctx.fillStyle = 'rgba(8,11,22,0.86)';
        ctx.strokeStyle = 'rgba(160,175,230,0.25)';
        roundRect(ctx, x0, y0, bw, bh, 12);
        ctx.fill();
        ctx.stroke();
        text(ctx, 'Chance the stored qubit is lost, per round', x0 + 12, y0 + 16, { size: 11, color: C.dim, shadow: false });
        const gx0 = x0 + 40, gx1 = x0 + bw - 14, gy0 = y0 + 34, gy1 = y0 + bh - 30;
        const X = (p) => gx0 + (p / 0.6) * (gx1 - gx0), Y = (r) => gy1 - ((Math.log10(Math.max(r, 1e-6)) + 6) / 6) * (gy1 - gy0);
        ctx.strokeStyle = 'rgba(233,237,247,0.3)';
        ctx.beginPath();
        ctx.moveTo(gx0, gy0);
        ctx.lineTo(gx0, gy1);
        ctx.lineTo(gx1, gy1);
        ctx.stroke();
        for (const [r, lab] of [[1, '1'], [1e-2, '1/100'], [1e-4, '1/10⁴'], [1e-6, '1/10⁶']]) text(ctx, lab, gx0 - 4, Y(r), { size: 9, align: 'right', color: C.dim, shadow: false });
        for (const p of [0, 0.25, 0.5]) text(ctx, `${Math.round(p * 100)}%`, X(p), gy1 + 11, { size: 9, align: 'center', color: C.dim, shadow: false });
        text(ctx, 'flip chance per qubit →', gx1, gy1 + 22, { size: 9, align: 'right', color: C.dim, shadow: false });
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = 'rgba(255,77,109,0.6)';
        ctx.beginPath();
        ctx.moveTo(X(0.5), gy0);
        ctx.lineTo(X(0.5), gy1);
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, 'threshold', X(0.5) + 4, gy0 + 6, { size: 9, color: C.red, shadow: false });
        const cols = { 1: '#9aa3b8', 3: C.cyan, 5: C.teal, 7: C.lime, 9: C.amber };
        for (const d of [1, 3, 5, 7, 9]) {
          ctx.strokeStyle = cols[d];
          ctx.lineWidth = d === D() ? 3 : 1.5;
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const p = (i / 60) * 0.6, yy = Y(logicalRate(d, p));
            i ? ctx.lineTo(X(p), yy) : ctx.moveTo(X(p), yy);
          }
          ctx.stroke();
          text(ctx, d === 1 ? 'bare' : `${d}`, X(0.6) + 2, Y(logicalRate(d, 0.6)), { size: 9, color: cols[d], shadow: false });
        }
        ctx.lineWidth = 1;
        const p = params.p;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(X(p), Y(logicalRate(D(), p)), 4, 0, TAU);
        ctx.fill();
        text(ctx, `size ${D()}: about 1 in ${Math.round(1 / Math.max(logicalRate(D(), p), 1e-9)).toLocaleString()}`, x0 + 12, y0 + bh - 10, { size: 10, color: C.ink, shadow: false });
      },
      stats() {
        const d = D(), p = params.p;
        return [
          { label: 'Rounds', value: String(rounds) },
          { label: 'Bare qubit failures', value: `${singleFails}  (expected ${Math.round(p * 100)} %)`, color: C.red },
          { label: `Size-${d} code failures`, value: `${codeFails}  (expected ${(logicalRate(d, p) * 100).toFixed(clamp(p, 0, 1) < 0.05 ? 3 : 1)} %)`, color: C.teal },
          { label: 'Qubits in the code', value: `${d} data + ${d - 1} check helpers` },
        ];
      },
      charts() {
        return [
          {
            title: 'Failure rate so far',
            series: [
              { data: sSingle.data, color: C.red, label: 'bare', fill: false },
              { data: sCode.data, color: C.teal, label: 'code', fill: false },
            ],
            min: 0,
            length: 400,
          },
        ];
      },
    };
  },
};
