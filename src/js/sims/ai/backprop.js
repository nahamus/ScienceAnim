import { C, FONT, clamp, rgba, text, backdrop, roundRect, drawGlow, easeInOut, Series, randn, TAU } from '../../core/util.js';

// Back-propagation on a 2-2-1 network learning XOR, one example at a time (plain SGD).
// Hidden and output neurons use the sigmoid σ; the loss is binary cross-entropy, which makes the
// output error simply δ = y − t. The chain rule sends it backwards:
//   ∂L/∂v_j = δ · h_j          δ_j = δ · v_j · h_j (1 − h_j)          ∂L/∂w_ji = δ_j · x_i
// Every number on screen is the real value for the current example.

const sig = (z) => 1 / (1 + Math.exp(-z));
const XOR = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]];
const START = { W: [[0.6, -0.4], [-0.5, 0.7]], b: [0.1, -0.2], V: [0.4, -0.3], c: 0.05 };
const PHASES = [
  { key: 'f1', dur: 2.2, title: 'Forward pass ①', note: 'each hidden neuron adds up its weighted inputs, then squashes the sum with σ' },
  { key: 'f2', dur: 2.0, title: 'Forward pass ②', note: 'the output neuron does the same with the hidden values' },
  { key: 'loss', dur: 1.8, title: 'How wrong?', note: 'compare the output y with the target t' },
  { key: 'b2', dur: 2.2, title: 'Backward pass ①', note: 'blame on each output weight = error × the value that flowed through it' },
  { key: 'b1', dur: 2.6, title: 'Backward pass ②', note: 'the error flows back through each weight and the slope of σ' },
  { key: 'up', dur: 2.0, title: 'Update', note: 'every weight takes a small step against its gradient' },
];
const f2 = (v) => (v >= 0 ? ' ' : '') + v.toFixed(2);
const plus = (v) => (v < 0 ? `− ${(-v).toFixed(2)}` : `+ ${v.toFixed(2)}`);
const clone = (n) => JSON.parse(JSON.stringify(n));

function forward(n, x) {
  const zh = [0, 1].map((j) => n.W[j][0] * x[0] + n.W[j][1] * x[1] + n.b[j]);
  const h = zh.map(sig);
  const zo = n.V[0] * h[0] + n.V[1] * h[1] + n.c;
  return { zh, h, zo, y: sig(zo) };
}
function grads(n, ex) {
  const f = forward(n, ex);
  const d = f.y - ex[2];
  const dh = [0, 1].map((j) => d * n.V[j] * f.h[j] * (1 - f.h[j]));
  return { f, d, dh, gV: f.h.map((h) => d * h), gc: d, gW: dh.map((g) => [g * ex[0], g * ex[1]]), gb: dh };
}
function apply(n, g, lr) {
  for (const j of [0, 1]) {
    n.V[j] -= lr * g.gV[j];
    n.b[j] -= lr * g.gb[j];
    for (const i of [0, 1]) n.W[j][i] -= lr * g.gW[j][i];
  }
  n.c -= lr * g.gc;
}
const lossOf = (n, ex) => {
  const y = forward(n, ex).y;
  return -(ex[2] ? Math.log(y) : Math.log(1 - y));
};
const avgLoss = (n) => XOR.reduce((s, e) => s + lossOf(n, e), 0) / 4;

export default {
  id: 'backprop',
  title: 'Backpropagation Step by Step',
  category: 'ai',
  tagline: 'Follow the numbers forward through a tiny network, then watch the blame flow backwards to fix every weight.',
  ages: ['16+'],
  topics: ['Machine learning', 'Calculus'],
  keywords: ['backpropagation', 'backprop', 'chain rule', 'gradient', 'neural network', 'sigmoid', 'xor', 'loss', 'cross entropy', 'sgd', 'forward pass', 'backward pass', 'deep learning'],
  blurb:
    'Every neural network, from this nine-number toy to a chatbot with hundreds of billions of weights, learns with the same trick: <b>back-propagation</b>. A forward pass turns inputs into an answer; the error is measured; then the chain rule from calculus passes the blame backwards, giving every weight its own gradient in one sweep. Here you can watch each step with the real numbers as a 2-2-1 network learns XOR.',
  ideas: [
    '<b>Forward pass</b>: each neuron computes σ(Σ weight × input + bias).',
    'The <b>loss</b> measures how wrong the output is; for this network the output error is just y − t.',
    '<b>Backward pass</b>: the chain rule passes the error back, so each weight learns how much it contributed.',
    '<b>Update</b>: every weight moves a little against its gradient, w ← w − η · ∂L/∂w.',
    'One backward pass gives <b>all</b> the gradients at once, about as costly as the forward pass.',
  ],
  hint: 'Press Next step to go one stage at a time',
  renderScale: 1,
  thumbChapter: 3,
  thumbFrames: 320,
  params: [
    { key: 'auto', label: 'Play automatically', type: 'toggle', value: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.3, max: 3, step: 0.05, value: 1, unit: '×' },
    { key: 'fast', label: 'Fast-forward training', type: 'toggle', value: false },
    { key: 'lr', label: 'Learning rate η', type: 'range', min: 0.1, max: 4, step: 0.05, value: 1 },
    { key: 'step', label: 'Next step', type: 'button', action: (sim) => sim.next() },
    { key: 'reset', label: 'Back to the starting weights', type: 'button', action: (sim) => sim.reset() },
    { key: 'scramble', label: 'Random weights', type: 'button', action: (sim) => sim.scramble() },
  ],
  story: [
    {
      title: 'A network you can follow',
      text: 'Two inputs, two hidden neurons, one output: <b>9 numbers</b> in all (6 weights on the lines, 3 biases). Its task is <b>XOR</b>: output 1 when exactly one input is on. No single straight line separates those cases, so it needs the hidden layer. The starting weights are random, so every answer in the table is near 0.5.',
      params: { auto: false, speed: 1, fast: false, lr: 1 },
      enter: (s) => s.reset(),
      duration: 13,
    },
    {
      title: 'Forward pass',
      text: 'Take the example (0, 1) → 1. Each hidden neuron multiplies the inputs by its weights, adds its bias and squashes the total with the <b>sigmoid</b> σ, an S-curve from 0 to 1. The output neuron does the same with the two hidden values.',
      formula: 'a = σ(Σ w · x + b),   σ(z) = 1 / (1 + e⁻ᶻ)',
      params: { auto: true, speed: 0.7, fast: false },
      enter: (s) => s.reset(1),
      duration: 12,
    },
    {
      title: 'How wrong was it?',
      text: 'The target was 1 but the output is about 0.5. The <b>loss</b> (cross-entropy) turns that into one number, and its slope with respect to the output neuron’s sum is simply <b>y − t</b>, the error. Negative here: the output was too low.',
      formula: 'L = −[t ln y + (1 − t) ln(1 − y)],   ∂L/∂z = y − t',
      params: { auto: true, speed: 0.7, fast: false },
      enter: (s) => s.reset(1, 2),
      duration: 11,
    },
    {
      title: 'Blame flows backwards',
      text: 'Now the clever part. An output weight’s gradient (pink) is the error times the value that flowed along it. To blame a hidden neuron, send the error back through its outgoing weight and multiply by the slope of σ there, h(1 − h). That is the <b>chain rule</b>, applied layer by layer.',
      formula: '∂L/∂v = δ·h,   δₕ = δ·v·h(1 − h),   ∂L/∂w = δₕ·x',
      check: {
        q: 'A weight’s gradient ∂L/∂w is positive. To make the loss smaller, the weight should…',
        options: ['Increase', 'Decrease', 'Stay the same'],
        answer: 1,
        setup: { auto: false, fast: false },
        explain: 'A positive gradient means the loss goes up as the weight goes up, so we step the other way: w ← w − η · ∂L/∂w. Every weight follows its own gradient downhill.',
      },
      params: { auto: true, speed: 0.6, fast: false },
      enter: (s) => s.reset(1, 3),
      duration: 17,
    },
    {
      title: 'Take a small step',
      text: 'Every weight moves a little against its gradient, scaled by the <b>learning rate η</b>. One example only nudges the network: watch its answer for (0, 1) creep up in the table. Then the next example takes its turn: forward, backward, update.',
      formula: 'w ← w − η · ∂L/∂w',
      params: { auto: true, speed: 1.4, fast: false },
      enter: (s) => s.reset(1, 5),
      duration: 15,
    },
    {
      title: 'Thousands of steps later',
      text: 'Fast-forward: the four examples take turns, over and over. The loss sits on a plateau for a while (the network can’t yet see how to split the cases), then the hidden neurons specialise and it plunges. After about <b>1,400 updates</b> every answer is right.',
      check: {
        q: 'A network has a million weights. How many backward passes does one example need to get every weight’s gradient?',
        options: ['One', 'One per layer', 'A million, one per weight'],
        answer: 0,
        setup: { auto: false, fast: false },
        explain: 'The backward pass reuses each layer’s blame for the layer before it, so one sweep gives all the gradients, at roughly the cost of a forward pass. That efficiency, popularised by Rumelhart, Hinton and Williams in 1986, is what makes training huge networks possible.',
      },
      params: { auto: true, speed: 1, fast: true, lr: 1 },
      enter: (s) => s.reset(),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Step through it yourself, change the learning rate, or try random weights. Too large a step (η around 2 or more) can overshoot and leave the network stuck giving 0.5 for some cases, a <b>local minimum</b>. Big networks are less prone to this, which is one reason they’re so big.',
      params: { auto: false, speed: 1, fast: false, lr: 1 },
      enter: (s) => s.reset(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let net, ex = 0, phase = 0, pt = 0, g = null, before = null, updates = 0, L = {};
    const losses = new Series(400);

    function begin() {
      g = grads(net, XOR[ex]);
      before = clone(net);
    }
    function reset(example = 0, ph = 0) {
      net = clone(START);
      updates = 0;
      losses.clear();
      losses.push(avgLoss(net));
      ex = example;
      phase = ph;
      pt = 0;
      begin();
    }
    function finishPhase() {
      if (PHASES[phase].key === 'up') {
        apply(net, g, params.lr);
        updates++;
        losses.push(avgLoss(net));
        ex = (ex + 1) % 4;
        phase = 0;
        begin();
      } else phase++;
      pt = 0;
    }
    reset();

    // nodes: [x1, x2], [h1, h2], [y]
    function layout() {
      const { x0, x1, y0, y1 } = L.net;
      const cx = [x0, (x0 + x1) / 2, x1];
      const gap = Math.min(170, (y1 - y0) * 0.62);
      const my = (y0 + y1) / 2;
      return [[[cx[0], my - gap / 2], [cx[0], my + gap / 2]], [[cx[1], my - gap / 2], [cx[1], my + gap / 2]], [[cx[2], my]]];
    }

    return {
      reset,
      next() {
        finishPhase();
      },
      scramble() {
        reset();
        net = { W: [[randn(), randn()], [randn(), randn()]], b: [randn() * 0.5, randn() * 0.5], V: [randn(), randn()], c: randn() * 0.3 };
        losses.clear();
        losses.push(avgLoss(net));
        begin();
      },
      resize(w, h) {
        const narrow = w < 700;
        if (narrow) {
          L = { narrow, table: { x: 16, y: 92 }, net: { x0: 48, x1: w - 48, y0: 262, y1: Math.min(h - 30, 560) }, cap: { x: 16, y: 166 }, R: 21 };
        } else {
          // inputs stay right of the story card (x 20–490) when there's room
          const nx0 = Math.max(w * 0.4, Math.min(495, w - 470));
          L = { narrow, table: { x: 30, y: 96 }, net: { x0: nx0 + 50, x1: w - 90, y0: 160, y1: Math.min(h - 70, 600) }, cap: { x: nx0, y: 98 }, R: 27 };
        }
      },
      onParam(k) {
        if (k === 'fast' && !params.fast) begin();
      },
      update(dt) {
        if (params.fast) {
          for (let i = 0; i < 6; i++) {
            apply(net, grads(net, XOR[ex]), params.lr);
            updates++;
            ex = (ex + 1) % 4;
            if (updates % 4 === 0) losses.push(avgLoss(net));
          }
          phase = 0;
          pt = 0;
          begin();
          return;
        }
        if (!params.auto) return;
        pt += (dt * params.speed) / PHASES[phase].dur;
        if (pt >= 1) finishPhase();
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const P = layout();
        const R = L.R;
        const ph = params.fast ? -1 : phase;
        const key = ph >= 0 ? PHASES[ph].key : 'fast';
        const t = params.fast ? 1 : clamp(pt, 0, 1);
        const e = XOR[ex];
        const f = g.f;
        const done = (k) => PHASES.findIndex((p) => p.key === k) < ph || (PHASES[ph]?.key === k && t > 0.6);
        // weights shown: tween during the update phase
        const shown = key === 'up' ? (() => {
          const n = clone(before), a = easeInOut(clamp((t - 0.15) / 0.7, 0, 1));
          apply(n, { gV: g.gV.map((v) => v * a), gc: g.gc * a, gW: g.gW.map((r) => r.map((v) => v * a)), gb: g.gb.map((v) => v * a) }, params.lr);
          return n;
        })() : net;

        const edges = [];
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) edges.push({ a: P[0][i], b: P[1][j], wv: shown.W[j][i], gr: g.gW[j][i], layer: 1, sig: e[i] * shown.W[j][i] });
        for (let j = 0; j < 2; j++) edges.push({ a: P[1][j], b: P[2][0], wv: shown.V[j], gr: g.gV[j], layer: 2, sig: f.h[j] * shown.V[j] });
        const showGrad = (layer) => !params.fast && ((layer === 2 && (key === 'b2' || key === 'b1' || key === 'up')) || (layer === 1 && (key === 'b1' || key === 'up') && (key === 'up' || t > 0.45)));
        for (const ed of edges) {
          const [x1, y1] = ed.a, [x2, y2] = ed.b;
          ctx.strokeStyle = rgba(ed.wv >= 0 ? C.orange : C.blue, clamp(0.25 + Math.abs(ed.wv) * 0.25, 0.25, 0.9));
          ctx.lineWidth = clamp(1 + Math.abs(ed.wv) * 2.2, 1, 9);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          // pulses
          const fwd = (key === 'f1' && ed.layer === 1) || (key === 'f2' && ed.layer === 2);
          const bwd = (key === 'b2' && ed.layer === 2) || (key === 'b1' && ed.layer === 1);
          if (fwd || bwd) {
            const u = clamp(t / 0.7, 0, 1);
            const q = fwd ? u : 1 - u;
            if (u < 1 && (bwd || Math.abs(ed.sig) > 0.01)) {
              ctx.globalCompositeOperation = 'lighter';
              drawGlow(ctx, x1 + (x2 - x1) * q, y1 + (y2 - y1) * q, 7 + Math.min(8, Math.abs(fwd ? ed.sig : ed.gr) * 30), fwd ? C.amber : C.pink, 0.35);
              ctx.globalCompositeOperation = 'source-over';
            }
          }
          // labels
          const lt = ed.layer === 1 ? 0.3 : 0.45;
          const lx = x1 + (x2 - x1) * lt, ly = y1 + (y2 - y1) * lt;
          ctx.save();
          ctx.font = `600 12px "JetBrains Mono", monospace`;
          const s = f2(ed.wv).trim();
          const bw = ctx.measureText(s).width + 10;
          ctx.fillStyle = 'rgba(8,11,22,0.85)';
          roundRect(ctx, lx - bw / 2, ly - 10, bw, 20, 6);
          ctx.fill();
          ctx.restore();
          text(ctx, s, lx, ly, { size: 12, mono: true, align: 'center', color: ed.wv >= 0 ? C.orange : C.blue, weight: 600, shadow: false });
          if (showGrad(ed.layer)) text(ctx, `∂ ${f2(ed.gr).trim()}`, lx, ly + 18, { size: 11, mono: true, align: 'center', color: C.pink });
        }
        // nodes
        const nodeVal = [
          [e[0], e[1]],
          [done('f1') || ph < 0 ? f.h[0] : null, done('f1') || ph < 0 ? f.h[1] : null],
          [done('f2') || ph < 0 ? f.y : null],
        ];
        P.forEach((layer, l) =>
          layer.forEach(([x, y], i) => {
            const v = nodeVal[l][i];
            ctx.fillStyle = v === null ? '#141a30' : rgba(C.amber, 0.15 + 0.6 * v);
            ctx.strokeStyle = l === 2 ? C.cyan : 'rgba(255,255,255,0.75)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, R, 0, TAU);
            ctx.fill();
            ctx.stroke();
            text(ctx, v === null ? '?' : l === 0 ? String(v) : v.toFixed(2), x, y, { size: l === 0 ? 16 : 13, align: 'center', weight: 700, mono: true });
            const name = l === 0 ? `x${'₁₂'[i]}` : l === 1 ? `h${'₁₂'[i]}` : 'y';
            text(ctx, name, x, y - R - 11, { size: 12, align: 'center', color: C.dim });
            if (l > 0) {
              const bv = l === 1 ? shown.b[i] : shown.c;
              text(ctx, `b ${f2(bv).trim()}`, x, y + R + 12, { size: 10, mono: true, align: 'center', color: C.dim });
            }
            // hidden blame
            if (l === 1 && !params.fast && (key === 'b1' || key === 'up') && (key === 'up' || t > 0.4)) text(ctx, `δ ${f2(g.dh[i]).trim()}`, x, y + R + 27, { size: 11, mono: true, align: 'center', color: C.pink });
          }),
        );
        // target and error at the output
        const [ox, oy] = P[2][0];
        const tx = L.narrow ? w - 10 : ox, ta = L.narrow ? 'right' : 'center';
        text(ctx, `target t = ${e[2]}`, tx, oy + R + 30, { size: 12, align: ta, color: C.teal, weight: 600 });
        if (!params.fast && (key === 'loss' || key === 'b2' || key === 'b1' || key === 'up') && (key !== 'loss' || t > 0.3)) {
          text(ctx, `error y − t = ${f2(g.d).trim()}`, tx, oy + R + 48, { size: 12, align: ta, color: C.pink, weight: 600 });
          text(ctx, `loss = ${lossOf(before, e).toFixed(3)}`, tx, oy + R + 66, { size: 11, align: ta, color: C.dim });
        }
        // caption
        if (!api.thumbnail) {
          const cap = params.fast ? { title: 'Fast-forward', note: `training on all four examples in turn · ${updates.toLocaleString('en')} updates` } : PHASES[ph];
          text(ctx, `${cap.title}`, L.cap.x, L.cap.y, { size: 15, weight: 700, color: params.fast ? C.violet : key[0] === 'b' ? C.pink : key === 'up' ? C.teal : C.amber });
          ctx.font = `500 12px ${FONT}`;
          if (L.narrow && ctx.measureText(cap.note).width > w - 32) {
            // two lines on phones, split at the space nearest the middle
            const mid = cap.note.length / 2;
            let cut = cap.note.indexOf(' ', mid);
            const back = cap.note.lastIndexOf(' ', mid);
            if (cut < 0 || (back > 0 && mid - back < cut - mid)) cut = back;
            text(ctx, cap.note.slice(0, cut), L.cap.x, L.cap.y + 20, { size: 12, color: C.dim });
            text(ctx, cap.note.slice(cut + 1), L.cap.x, L.cap.y + 36, { size: 12, color: C.dim });
          } else text(ctx, cap.note, L.cap.x, L.cap.y + 21, { size: 12, color: C.dim });
          if (!params.fast) {
            let eq = '';
            if (key === 'f1') eq = `h₁ = σ(${net.W[0][0].toFixed(2)}·${e[0]} ${plus(net.W[0][1])}·${e[1]} ${plus(net.b[0])}) = σ(${f.zh[0].toFixed(2)}) = ${f.h[0].toFixed(2)}`;
            if (key === 'f2') eq = `y = σ(${net.V[0].toFixed(2)}·${f.h[0].toFixed(2)} ${plus(net.V[1])}·${f.h[1].toFixed(2)} ${plus(net.c)}) = ${f.y.toFixed(2)}`;
            if (key === 'loss') eq = `δ = y − t = ${f.y.toFixed(2)} − ${e[2]} = ${g.d.toFixed(2)}`;
            if (key === 'b2') eq = `∂L/∂v₁ = δ · h₁ = ${g.d.toFixed(2)} × ${f.h[0].toFixed(2)} = ${g.gV[0].toFixed(3)}`;
            if (key === 'b1') eq = `δ₁ = δ · v₁ · h₁(1 − h₁) = ${g.d.toFixed(2)} × ${net.V[0].toFixed(2)} × ${(f.h[0] * (1 - f.h[0])).toFixed(2)} = ${g.dh[0].toFixed(3)}`;
            if (key === 'up') eq = `v₁ ← ${before.V[0].toFixed(3)} − ${params.lr.toFixed(2)} × (${g.gV[0].toFixed(3)}) = ${(before.V[0] - params.lr * g.gV[0]).toFixed(3)}`;
            const cut = L.narrow ? eq.lastIndexOf(' = ') : -1;
            if (cut > 0) {
              text(ctx, eq.slice(0, cut), L.cap.x, L.cap.y + 56, { size: 11, mono: true });
              text(ctx, eq.slice(cut + 1), L.cap.x, L.cap.y + 72, { size: 11, mono: true });
            } else text(ctx, eq, L.cap.x, L.cap.y + 44, { size: 13, mono: true });
          }
        }
        // truth table with the network's current answers
        const tb = L.table;
        if (L.narrow && !api.thumbnail) {
          // compact: one row of four cells
          const cw = (w - 32) / 4;
          XOR.forEach((r, i) => {
            const y = forward(shown, r).y, x = tb.x + i * cw;
            const cur = i === ex;
            ctx.fillStyle = cur ? rgba(C.cyan, 0.14) : 'rgba(255,255,255,0.03)';
            roundRect(ctx, x + 2, tb.y, cw - 4, 50, 8);
            ctx.fill();
            text(ctx, `${r[0]},${r[1]} → ${r[2]}`, x + cw / 2, tb.y + 15, { size: 11, mono: true, align: 'center', color: C.dim });
            text(ctx, y.toFixed(2), x + cw / 2, tb.y + 35, { size: 14, mono: true, align: 'center', weight: 700, color: Math.abs(y - r[2]) < 0.2 ? C.teal : C.ink });
          });
          return;
        }
        if (api.thumbnail) return;
        text(ctx, 'XOR examples', tb.x, tb.y, { size: 13, weight: 700, color: C.cyan });
        text(ctx, 'x₁  x₂   target   network says', tb.x, tb.y + 24, { size: 11, color: C.dim, mono: true });
        XOR.forEach((r, i) => {
          const y = forward(shown, r).y, yy = tb.y + 48 + i * 26;
          if (i === ex && !params.fast) {
            ctx.fillStyle = rgba(C.cyan, 0.13);
            roundRect(ctx, tb.x - 8, yy - 12, 290, 24, 6);
            ctx.fill();
          }
          text(ctx, `${r[0]}   ${r[1]}     ${r[2]}`, tb.x + 2, yy, { size: 13, mono: true });
          const bx = tb.x + 150;
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.fillRect(bx, yy - 6, 90, 12);
          ctx.fillStyle = Math.abs(y - r[2]) < 0.2 ? C.teal : C.amber;
          ctx.fillRect(bx, yy - 6, 90 * y, 12);
          text(ctx, y.toFixed(2), bx + 98, yy, { size: 12, mono: true });
        });
      },
      stats() {
        const e = XOR[ex];
        const solved = XOR.every((r) => Math.abs(forward(net, r).y - r[2]) < 0.2);
        return [
          { label: 'Example', value: `(${e[0]}, ${e[1]}) → ${e[2]}`, color: C.cyan },
          { label: 'Updates', value: updates.toLocaleString('en') },
          { label: 'Average loss', value: avgLoss(net).toFixed(3) },
          { label: 'XOR solved', value: solved ? 'yes' : 'not yet', color: solved ? C.teal : undefined },
        ];
      },
      charts() {
        return [{ title: 'Average loss over the four examples', series: [{ data: losses.data, color: C.pink }], min: 0, max: 1, length: 400 }];
      },
    };
  },
};
