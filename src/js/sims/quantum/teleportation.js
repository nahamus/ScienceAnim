import { C, clamp, rgba, text, tag, backdrop, roundRect, drawGlow, MONO } from '../../core/util.js';
import { zeroState, copyState, apply1, GATES, measure, blochOf, blochFromAngles, drawBloch } from '../../core/quantum.js';

// Quantum teleportation, simulated exactly on a 3-qubit state vector. Qubit 0 holds the message ψ,
// qubits 1 and 2 become an entangled pair shared by Alice and Bob. Each sphere shows that qubit's
// own (reduced) state: an arrow shorter than the radius means it is entangled with the others.

const DEG = Math.PI / 180;
const STEPS = [
  { note: 'Alice holds the message qubit ψ; the other two qubits start as |0⟩' },
  { note: 'H on Alice’s half', gate: ['H', 1] },
  { note: 'CNOT: Alice’s half and Bob’s half become an entangled pair', cnot: [1, 2] },
  { note: 'Alice entangles ψ with her half (CNOT)', cnot: [0, 1] },
  { note: 'Then an H on ψ', gate: ['H', 0] },
  { note: 'Alice measures both her qubits: two random bits', measure: true },
  { note: 'She sends the two bits to Bob over an ordinary channel', send: true },
  { note: 'Bob applies X if the second bit is 1', fix: 'X' },
  { note: 'Bob applies Z if the first bit is 1. His qubit is now ψ', fix: 'Z' },
];
const LAST = STEPS.length - 1;
const NAMES = ['ψ (Alice)', 'Alice’s half', 'Bob’s half'];
const COLORS = [C.amber, C.pink, C.cyan];

export default {
  id: 'teleportation',
  title: 'Quantum Teleportation',
  category: 'quantum',
  tagline: 'Send a qubit’s exact state using one entangled pair and two ordinary bits.',
  ages: ['16+'],
  topics: ['Quantum', 'Entanglement', 'Quantum computing'],
  keywords: ['teleportation', 'entanglement', 'bell pair', 'epr', 'no-cloning', 'quantum network', 'quantum internet', 'cnot', 'micius'],
  blurb:
    'A qubit’s state can’t be read out (measuring gives one bit and destroys the rest) and can’t be copied. Yet it can be moved: if Alice and Bob share an entangled pair, Alice can make a joint measurement and phone Bob two ordinary bits, and Bob can rebuild the exact state. Nothing travels faster than light, and Alice’s original is destroyed. Every amplitude here is computed exactly.',
  ideas: [
    'Teleportation moves a <b>quantum state</b>, not matter, using a shared <b>entangled pair</b> and <b>two classical bits</b>.',
    'Half of an entangled pair, on its own, has <b>no direction</b>: its arrow shrinks to the centre.',
    'Before the bits arrive, Bob’s qubit is one of four versions of ψ, which <b>average to nothing</b>, so no information beats light.',
    'Alice’s original is destroyed in the process, as the <b>no-cloning</b> theorem demands.',
    'Teleportation has been done over <b>1,400 km</b> (satellite to ground, 2017) and links future quantum computers.',
  ],
  hint: 'Change ψ with the sliders, then step through',
  renderScale: 1,
  thumbChapter: 4,
  thumbFrames: 760,
  params: [
    { key: 'theta', label: 'Message ψ: latitude θ', type: 'range', min: 0, max: 180, step: 1, value: 60, unit: '°', instant: true },
    { key: 'phi', label: 'Message ψ: longitude φ', type: 'range', min: 0, max: 359, step: 1, value: 40, unit: '°', instant: true },
    { key: 'auto', label: 'Play automatically', type: 'toggle', value: false },
    { key: 'correct', label: 'Bob uses the two bits', type: 'toggle', value: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.25, max: 3, step: 0.05, value: 1, unit: '×' },
    { key: 'next', label: 'Next step', type: 'button', action: (sim) => sim.next() },
    { key: 'restart', label: 'Start again', type: 'button', action: (sim) => sim.restart() },
  ],
  story: [
    {
      title: 'Send a qubit without sending it',
      text: 'Alice has a qubit in some state <b>ψ</b> (the amber arrow) and wants Bob, far away, to have it. She can’t just measure it and phone the answer: a measurement gives one bit and destroys the rest. She can’t copy it either: the <b>no-cloning</b> theorem forbids copying unknown quantum states.',
      params: { auto: false, correct: true, theta: 60, phi: 40, speed: 1 },
      enter: (s) => s.restart(),
      duration: 13,
    },
    {
      title: 'Share an entangled pair',
      text: 'First Alice and Bob make an <b>entangled pair</b> (an H and a CNOT gate) and Bob takes his half far away. Watch the two lower arrows shrink to dots: on its own, half of an entangled pair has <em>no direction at all</em>. All its information is in how it relates to the other half.',
      params: { auto: false },
      enter: (s) => (s.restart(), s.playTo(2)),
      duration: 14,
    },
    {
      title: 'Alice’s joint measurement',
      text: 'Alice entangles ψ with her half of the pair (CNOT, then H) and measures both qubits. She gets <b>two random bits</b>. Her qubits are now plain 0s and 1s: ψ is gone from her side.',
      params: { auto: false },
      enter: (s) => (s.restart(), s.playTo(5)),
      duration: 15,
    },
    {
      title: 'Bob’s qubit, before the call',
      text: 'Bob’s qubit is now one of <b>four versions of ψ</b> (the faint arrows), one for each pair of bits. Until the bits arrive he can’t tell which. The four point in balanced directions and average to nothing, so his qubit alone carries <b>no information</b> about ψ, and nothing has travelled faster than light.',
      check: {
        q: 'Alice has measured, but her two bits haven’t reached Bob yet. What can Bob learn about ψ from his qubit?',
        options: ['Everything', 'About half of it', 'Nothing at all'],
        answer: 2,
        setup: { auto: false },
        explain: 'Each of the four outcomes is equally likely, and the four versions of ψ average to the centre of the sphere: a completely random qubit. Bob needs the two bits, which travel no faster than light.',
      },
      params: { auto: false },
      enter: (s) => (s.restart(), s.playTo(5, true)),
      duration: 15,
    },
    {
      title: 'The fix',
      text: 'The bits arrive. They tell Bob which of the four versions he holds, and a simple gate (X, Z, both or neither) turns it into <b>ψ</b> exactly. Fidelity 100%. Alice’s original is destroyed, so ψ has been moved, never copied.',
      params: { auto: false, correct: true },
      enter: (s) => (s.restart(), s.playTo(LAST)),
      duration: 16,
    },
    {
      title: 'Without the two bits',
      text: 'If Bob ignores the bits, his qubit is right only when both bits happen to be 0. Over many runs his average fidelity is <b>50%</b>, no better than a random guess. Both halves are needed: the entanglement <em>and</em> the classical message.',
      params: { auto: true, correct: false, speed: 2.2 },
      enter: (s) => (s.resetAverage(), s.restart()),
      duration: 18,
    },
    {
      title: 'Teleportation for real',
      text: 'It was first done with photons in Innsbruck and Rome in 1997. In 2017 China’s <b>Micius</b> satellite teleported photon states over 1,400 km. Quantum networks will use it to link quantum computers, and some designs use it to move qubits around inside a single chip.',
      params: { auto: true, correct: true, speed: 1.6, theta: 120, phi: 200 },
      enter: (s) => (s.resetAverage(), s.restart()),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Choose any ψ with the sliders, then step through. Try switching off Bob’s correction.',
      params: { auto: false, correct: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let st, step, target, anim, wait, bits, ghosts, show, before, sendT, loopWait, runs = 0, fidSum = 0;

    const psi = () => blochFromAngles(params.theta * DEG, params.phi * DEG);
    const bloch = () => [0, 1, 2].map((k) => blochOf(st, k));
    const fidelity = () => {
      const b = blochOf(st, 2), p = psi();
      return (1 + b[0] * p[0] + b[1] * p[1] + b[2] * p[2]) / 2;
    };

    function restart() {
      st = zeroState(3);
      // prepare ψ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩ on qubit 0 with Ry(θ) then a phase
      const th = params.theta * DEG, ph = params.phi * DEG;
      st.re[0] = Math.cos(th / 2);
      st.re[1] = Math.sin(th / 2) * Math.cos(ph);
      st.im[1] = Math.sin(th / 2) * Math.sin(ph);
      step = 0;
      target = params.auto ? LAST : 0;
      anim = null;
      wait = 0.4;
      bits = null;
      ghosts = null;
      sendT = 0;
      loopWait = 0;
      show = bloch();
    }

    function apply(s) {
      const S = STEPS[s];
      if (S.gate) apply1(st, GATES[S.gate[0]], S.gate[1]);
      if (S.cnot) apply1(st, GATES.X, S.cnot[1], S.cnot[0]);
      if (S.measure) {
        // Bob's four possible states, one per outcome
        ghosts = [];
        for (const m0 of [0, 1])
          for (const m1 of [0, 1]) {
            const c = copyState(st);
            measure(c, 0, m0 ? 0 : 1); // r = 0 always gives 1, r = 1 always gives 0
            measure(c, 1, m1 ? 0 : 1);
            ghosts.push(blochOf(c, 2));
          }
        bits = [measure(st, 0), measure(st, 1)];
      }
      if (S.fix && params.correct) {
        if (S.fix === 'X' && bits[1]) apply1(st, GATES.X, 2);
        if (S.fix === 'Z' && bits[0]) apply1(st, GATES.Z, 2);
      }
    }

    function advance() {
      if (step >= LAST) return;
      before = show;
      step++;
      apply(step);
      anim = { t: 0, dur: STEPS[step].send ? 1.6 : 0.8 };
      if (step === LAST) {
        runs++;
        fidSum += fidelity();
      }
    }

    const sim = {
      restart,
      /** Play forward to step k (and keep the four possibilities on show if asked). */
      playTo(k) {
        target = Math.max(target, k);
      },
      next() {
        if (step >= LAST) restart();
        target = Math.max(target, step + 1);
      },
      resetAverage() {
        runs = 0;
        fidSum = 0;
      },
      onParam(k) {
        if (k === 'theta' || k === 'phi' || k === 'correct') {
          if (k === 'correct') sim.resetAverage();
          restart();
        } else if (k === 'auto' && params.auto) target = LAST;
      },
      update(dt) {
        if (anim) {
          anim.t += (dt * params.speed) / anim.dur;
          const e = clamp(anim.t, 0, 1);
          const now = bloch();
          show = now.map((v, k) => v.map((x, i) => before[k][i] + (x - before[k][i]) * e));
          if (STEPS[step].send) sendT = e;
          if (anim.t >= 1) {
            anim = null;
            show = bloch();
            wait = 0.5;
          }
          return;
        }
        if (step >= LAST && params.auto) {
          if ((loopWait += dt * params.speed) > 2.5) restart();
          return;
        }
        if (wait > 0) return void (wait -= dt * params.speed);
        if (step < target) advance();
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const narrow = w < 700;
        // spheres: Alice's two on the left, Bob's on the right
        const R = api.thumbnail ? Math.min(w * 0.13, h * 0.28) : narrow ? Math.min(w * 0.115, 56) : clamp(Math.min(h * 0.13, w * 0.075), 40, 92);
        const sy = api.thumbnail ? h * 0.5 : narrow ? 92 + R * 1.45 : Math.max(110 + R * 1.3, h * 0.33);
        const xs = narrow ? [w * 0.17, w * 0.45, w * 0.8] : [w * 0.2, w * 0.4, w * 0.8];
        const pad = narrow ? 1.3 : 1.5;
        // Alice / Bob zones
        if (!api.thumbnail) {
          for (const [x0, x1, who, col] of [[xs[0] - R * pad, xs[1] + R * pad, 'ALICE', C.pink], [xs[2] - R * pad, xs[2] + R * pad, 'BOB', C.cyan]]) {
            ctx.strokeStyle = rgba(col, 0.25);
            ctx.lineWidth = 1;
            roundRect(ctx, x0, sy - R * 1.55, x1 - x0, R * 3.3, 14);
            ctx.stroke();
            text(ctx, who, x0 + 12, sy - R * 1.55 + 14, { size: 10, weight: 700, color: col });
          }
        }
        // the classical channel and the bits on it
        const chY = narrow ? sy + R * 1.3 + 36 : sy + R * 1.75 + 10;
        if (!api.thumbnail) {
          ctx.strokeStyle = 'rgba(200,210,240,0.2)';
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.moveTo(xs[1], chY);
          ctx.lineTo(xs[2], chY);
          ctx.stroke();
          ctx.setLineDash([]);
          text(ctx, 'ordinary channel (light speed or slower)', (xs[1] + xs[2]) / 2, chY + 14, { size: 10, align: 'center', color: C.dim });
          if (bits && step >= 6) {
            const x = xs[1] + (xs[2] - xs[1]) * (step > 6 ? 1 : sendT);
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, x, chY, 18, C.lime, 0.45);
            ctx.globalCompositeOperation = 'source-over';
            tag(ctx, `${bits[0]}${bits[1]}`, x, chY - 16, C.lime, { align: 'center', size: 12 });
          }
        }
        // Bob's four possibilities, while he waits for the bits
        const ghostOn = ghosts && step >= 5 && step < 7;
        for (let k = 0; k < 3; k++) {
          const P = drawBloch(ctx, xs[k], sy, R, show[k], { color: COLORS[k], labels: api.thumbnail ? false : 'poles', thin: true });
          if (api.thumbnail) continue;
          text(ctx, NAMES[k], xs[k], sy + R * 1.3, { size: narrow ? 10 : 11, align: 'center', color: COLORS[k], weight: 600 });
          if (k === 2) {
            if (ghostOn)
              for (const g of ghosts) {
                const [gx, gy] = P(g);
                const [ox, oy] = P([0, 0, 0]);
                ctx.strokeStyle = rgba(C.cyan, 0.6);
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 3]);
                ctx.beginPath();
                ctx.moveTo(ox, oy);
                ctx.lineTo(gx, gy);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = rgba(C.cyan, 0.6);
                ctx.beginPath();
                ctx.arc(gx, gy, 3, 0, Math.PI * 2);
                ctx.fill();
              }
            // where ψ points, for comparison
            const [px, py] = P(psi());
            ctx.strokeStyle = rgba(C.amber, 0.7);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px, py, 7, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        if (api.thumbnail) return;
        if (step === LAST && !anim) {
          const f = fidelity();
          tag(ctx, `match with ψ: ${(100 * f).toFixed(0)}%`, xs[2], sy - R * 1.55 - 14, f > 0.99 ? C.teal : C.red, { align: 'center', size: 12 });
        }

        // the circuit
        const top = narrow ? chY + 40 : Math.max(chY + 46, h * 0.6);
        const cx0 = narrow ? 16 : w * 0.44, cx1 = narrow ? w - 16 : w - 30;
        const rowH = narrow ? 24 : 28;
        if (top + rowH * 3 > h - 8) return;
        const lab = narrow ? 42 : 86;
        const cols = 8, colW = (cx1 - cx0 - lab) / cols;
        const colX = (c) => cx0 + lab + (c + 0.5) * colW;
        const rowY = (r) => top + r * rowH;
        for (let r = 0; r < 3; r++) {
          ctx.strokeStyle = 'rgba(200,210,240,0.3)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx0 + lab - 6, rowY(r));
          ctx.lineTo(r < 2 ? colX(4) : cx1, rowY(r));
          ctx.stroke();
          text(ctx, narrow ? ['ψ', 'A', 'B'][r] : NAMES[r], cx0, rowY(r), { size: 10, color: COLORS[r] });
        }
        // classical double lines from the measurements down to Bob's corrections
        ctx.strokeStyle = rgba(C.lime, 0.5);
        for (const [r, c] of [[1, 6], [0, 7]]) {
          for (const d of [-1.5, 1.5]) {
            ctx.beginPath();
            ctx.moveTo(colX(4) + d, rowY(r));
            ctx.lineTo(colX(c) + d, rowY(r));
            ctx.lineTo(colX(c) + d, rowY(2) - 9);
            ctx.stroke();
          }
        }
        const box = (c, r, label, col, done) => {
          const s = Math.min(rowH - 4, colW - 4);
          ctx.fillStyle = done ? '#151b33' : '#0b0f1e';
          ctx.strokeStyle = done ? col : rgba(col, 0.4);
          ctx.lineWidth = 1.3;
          roundRect(ctx, colX(c) - s / 2, rowY(r) - s / 2, s, s, 4);
          ctx.fill();
          ctx.stroke();
          ctx.font = `700 ${Math.round(s * 0.5)}px ${MONO}`;
          ctx.fillStyle = done ? col : rgba(col, 0.5);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, colX(c), rowY(r) + 1);
        };
        const dot = (c, r, done) => {
          ctx.fillStyle = done ? C.ink : 'rgba(233,237,247,0.4)';
          ctx.beginPath();
          ctx.arc(colX(c), rowY(r), 4, 0, Math.PI * 2);
          ctx.fill();
        };
        const plus = (c, r, ctl, done) => {
          ctx.strokeStyle = done ? C.ink : 'rgba(233,237,247,0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(colX(c), rowY(ctl));
          ctx.lineTo(colX(c), rowY(r) + (r > ctl ? 8 : -8));
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(colX(c), rowY(r), 8, 0, Math.PI * 2);
          ctx.moveTo(colX(c) - 8, rowY(r));
          ctx.lineTo(colX(c) + 8, rowY(r));
          ctx.moveTo(colX(c), rowY(r) - 8);
          ctx.lineTo(colX(c), rowY(r) + 8);
          ctx.stroke();
          dot(c, ctl, done);
        };
        // step s lives in column s - 1
        box(0, 1, 'H', C.amber, step >= 1);
        plus(1, 2, 1, step >= 2);
        plus(2, 1, 0, step >= 3);
        box(3, 0, 'H', C.amber, step >= 4);
        box(4, 0, 'M', C.lime, step >= 5);
        box(4, 1, 'M', C.lime, step >= 5);
        const off = !params.correct;
        box(6, 2, 'X', off ? '#666a7a' : C.pink, step >= 7 && !off);
        box(7, 2, 'Z', off ? '#666a7a' : C.cyan, step >= 8 && !off);
        if (bits) {
          text(ctx, String(bits[0]), colX(4) + 14, rowY(0) - 10, { size: 11, weight: 700, color: C.lime, mono: true });
          text(ctx, String(bits[1]), colX(4) + 14, rowY(1) - 10, { size: 11, weight: 700, color: C.lime, mono: true });
        }
        // the step cursor
        if (step > 0) {
          const c = step - 1;
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(colX(c) - colW / 2, top - rowH * 0.6, colW, rowH * 3.2);
        }
        text(ctx, STEPS[step].note, narrow ? w / 2 : (cx0 + cx1) / 2, rowY(2) + rowH + 4, { size: 11, align: 'center', color: C.ink });
      },
      stats() {
        const out = [
          { label: 'Step', value: `${step} of ${LAST}` },
          { label: 'Alice’s bits', value: bits ? `${bits[0]} ${bits[1]}` : '—', color: C.lime },
          { label: 'Bob’s match with ψ', value: `${(100 * fidelity()).toFixed(1)}%`, color: C.cyan },
          { label: 'Bob’s arrow length', value: Math.hypot(...blochOf(st, 2)).toFixed(2) },
        ];
        if (runs) out.push({ label: `Average match over ${runs} runs`, value: `${((100 * fidSum) / runs).toFixed(1)}%` });
        return out;
      },
      charts() {
        const probs = Array.from(st.re, (r, i) => r * r + st.im[i] ** 2);
        return [{ title: 'Chance of each of the 8 basis states |Bob Alice ψ⟩', kind: 'bars', series: [{ data: probs, color: C.violet }], min: 0, max: 1 }];
      },
    };
    restart();
    return sim;
  },
};
