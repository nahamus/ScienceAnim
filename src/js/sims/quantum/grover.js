import { C, clamp, rgba, text, tag, backdrop, arrow, easeInOut } from '../../core/util.js';

// Grover's search on n qubits, simulated exactly. All amplitudes stay real: H on every qubit makes
// the uniform state; the oracle flips the sign of the marked item; the diffusion step reflects
// every amplitude about the mean (a → 2·mean − a). Each round turns the state by 2θ in the plane
// of |marked⟩ and |rest⟩, where sin θ = 1/√N, so about π/4·√N rounds find the item.

const PHASE_NOTE = {
  init: 'H on every qubit: an equal superposition of all items',
  oracle: 'Oracle: flip the sign of the marked item',
  diffuse: 'Diffusion: reflect every amplitude about the mean',
  measure: 'Measure',
};

export default {
  id: 'grover',
  title: 'Grover’s Quantum Search',
  category: 'quantum',
  tagline: 'Find one marked item among N in about √N steps by making wrong answers cancel.',
  ages: ['16+'],
  topics: ['Quantum', 'Quantum computing', 'Algorithms'],
  keywords: ['grover', 'quantum algorithm', 'amplitude amplification', 'oracle', 'search', 'quadratic speedup', 'quantum computer', 'interference'],
  blurb:
    'Searching an unsorted list of N items takes N/2 guesses on average. In 1996 Lov Grover found a quantum algorithm that needs only about √N steps. It doesn’t check items in parallel: it uses interference to grow the amplitude of the right answer and shrink the rest, then a single measurement finds it. Here every amplitude is computed exactly for up to 6 qubits (64 items).',
  ideas: [
    'Start in an <b>equal superposition</b>: every item has amplitude 1/√N.',
    'The <b>oracle</b> recognises the answer and flips the sign of its amplitude.',
    '<b>Diffusion</b> reflects every amplitude about the average, so the flipped one grows.',
    'About <b>π/4 · √N</b> rounds give near-certain success: 6 rounds for 64 items, ~800 for a million.',
    'Too many rounds and the amplitude swings back down: the state is <b>rotating</b>, not filling up.',
  ],
  hint: 'Tap a bar to mark a different item',
  renderScale: 1,
  thumbChapter: 3,
  thumbFrames: 260,
  params: [
    { key: 'qubits', label: 'Qubits (N = 2ⁿ items)', type: 'range', min: 2, max: 6, step: 1, value: 3, instant: true },
    { key: 'target', label: 'Marked item', type: 'range', min: 0, max: 63, step: 1, value: 5, instant: true },
    { key: 'auto', label: 'Run automatically', type: 'toggle', value: true },
    { key: 'best', label: 'Stop at the best number of rounds', type: 'toggle', value: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.25, max: 4, step: 0.05, value: 1, unit: '×' },
    { key: 'step', label: 'Next step', type: 'button', action: (sim) => sim.stepOnce() },
    { key: 'measure', label: 'Measure now', type: 'button', action: (sim) => sim.queue(['measure']) },
    { key: 'restart', label: 'Start again', type: 'button', action: (sim) => sim.restart() },
  ],
  story: [
    {
      title: 'A needle in a haystack',
      text: 'Eight boxes, one prize (the amber bar). A normal computer must open boxes one by one: <b>4 tries on average</b>, N/2 for N boxes. A quantum computer with 3 qubits can hold all 8 at once: the H gates give every box the same <b>amplitude</b>, 1/√8 ≈ 0.35. Measuring now would just pick a box at random.',
      params: { qubits: 3, target: 5, auto: false, best: true, speed: 1 },
      enter: (s) => (s.restart(), s.queue(['init'])),
      duration: 13,
    },
    {
      title: 'The oracle marks the answer',
      text: 'The <b>oracle</b> is a circuit that can recognise the right answer (like checking a password) and flips the sign of its amplitude. The probabilities haven’t changed (squares ignore signs), so a measurement would still be a random guess. But the marked item is now different.',
      params: { qubits: 3, auto: false },
      enter: (s) => (s.restart(), s.queue(['init', 'oracle'])),
      duration: 13,
    },
    {
      title: 'Reflect about the mean',
      text: 'The <b>diffusion</b> step reflects every amplitude about the average (dashed line). The others sit just above the average and drop a little; the flipped one sits far below it and jumps <em>far above</em>. After one round the prize’s chance is 78%.',
      formula: 'a → 2·mean − a',
      params: { qubits: 3, auto: false },
      enter: (s) => (s.restart(), s.queue(['init', 'oracle', 'diffuse'])),
      duration: 15,
    },
    {
      title: 'Repeat, then measure',
      text: 'Each round (oracle + diffusion) turns the state a fixed angle towards the answer, as the circle shows. Two rounds take 8 boxes to <b>95%</b>; then one measurement almost always finds the prize.',
      params: { qubits: 3, auto: true, best: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'A bigger haystack',
      text: 'With 6 qubits there are 64 boxes. Each round turns the state by a smaller angle, so it takes more rounds, but only about <b>π/4 · √N</b>: 6 rounds instead of 32 guesses on average. For a million items: about 800 rounds instead of 500,000.',
      formula: 'rounds ≈ π/4 · √N',
      check: {
        q: 'With 64 boxes, how many rounds give the best chance of finding the prize?',
        options: ['1', '6', '32', '64'],
        answer: 1,
        setup: { qubits: 6, auto: false },
        explain: 'Each round turns the state by about 2/√N radians; reaching the answer takes about π/4 · √64 = 6.3, so 6 rounds give 99.7%. The saving grows with N: √N instead of N/2.',
      },
      params: { qubits: 6, target: 41, auto: true, best: true, speed: 1.6 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Don’t overcook it',
      text: 'Keep going past the best point and the state rotates <em>past</em> the answer: the chance falls again, almost to zero after twice as many rounds. A quantum search must know roughly how many answers there are and stop at the right moment.',
      check: {
        q: 'With 16 boxes, the best is 3 rounds (96%). What happens if you keep going to 6 rounds?',
        options: ['It stays near 100%', 'The chance falls again', 'It finds a second prize'],
        answer: 1,
        setup: { qubits: 4, auto: false },
        explain: 'Each round is a fixed rotation. After about 3 rounds the state points at the answer; further rounds rotate it away again, and at 6 rounds the chance is about 2%.',
      },
      params: { qubits: 4, target: 9, auto: true, best: false, speed: 1.4 },
      enter: (s) => s.restart(),
      duration: 20,
    },
    {
      title: 'What it’s good for',
      text: 'Grover’s speed-up is <b>quadratic</b> (N → √N), not exponential like Shor’s factoring. It means a future quantum computer could search an encryption key space of 2¹²⁸ in about 2⁶⁴ steps, which is why security agencies recommend <b>256-bit keys</b>. Running it on big problems needs large, error-corrected quantum computers that don’t exist yet.',
      params: { qubits: 5, target: 19, auto: true, best: true, speed: 1.4 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Pick the number of qubits, tap a bar to hide the prize somewhere else, and step through rounds yourself.',
      params: { qubits: 4, target: 6, auto: false, best: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let N = 0, amp, from, phase = null, t = 0, wait = 0, plan = [], rounds = 0, hist = [], meanLine = null;
    let result = null, loopWait = 0, bars = [], lastPhase = null;

    const tgt = () => Math.min(params.target, N - 1);
    const theta = () => Math.asin(1 / Math.sqrt(N));
    const bestRounds = () => Math.max(1, Math.floor(Math.PI / (4 * theta())));
    const pTarget = () => amp[tgt()] ** 2;
    const maxRounds = () => 2 * bestRounds() + 1;

    function restart() {
      N = 1 << params.qubits;
      amp = new Float64Array(N);
      amp[0] = 1;
      from = amp.slice();
      phase = null;
      plan = [];
      rounds = 0;
      hist = [];
      meanLine = null;
      result = null;
      wait = 0.3;
      loopWait = 0;
      lastPhase = null;
      if (params.auto) planAuto();
    }

    function planAuto() {
      plan = ['init'];
      const R = params.best ? bestRounds() : maxRounds();
      for (let i = 0; i < R; i++) plan.push('oracle', 'diffuse');
      plan.push('measure');
    }

    function begin(p) {
      phase = p;
      t = 0;
      from = amp.slice();
      const T = tgt();
      if (p === 'init') {
        amp.fill(1 / Math.sqrt(N));
        hist = [pTarget()];
        rounds = 0;
        result = null;
      } else if (p === 'oracle') amp[T] = -amp[T];
      else if (p === 'diffuse') {
        const mean = amp.reduce((a, b) => a + b, 0) / N;
        meanLine = mean;
        for (let i = 0; i < N; i++) amp[i] = 2 * mean - amp[i];
        rounds++;
        hist.push(pTarget());
      } else if (p === 'measure') {
        let r = Math.random(), k = 0;
        for (; k < N - 1; k++) if ((r -= amp[k] ** 2) < 0) break;
        result = { k, hit: k === T };
        amp.fill(0);
        amp[k] = 1;
      }
    }

    const shown = (i) => {
      if (!phase) return amp[i];
      const e = easeInOut(clamp(t, 0, 1));
      return from[i] + (amp[i] - from[i]) * e;
    };

    const sim = {
      restart,
      queue(list) {
        plan.push(...list);
      },
      /** One manual step: the next phase of the algorithm. */
      stepOnce() {
        if (phase || plan.length) return;
        if (result) restart();
        if (!hist.length) plan.push('init');
        else plan.push(lastPhase === 'oracle' ? 'diffuse' : 'oracle');
      },
      onParam(k) {
        if (k === 'qubits' || k === 'target' || k === 'best' || (k === 'auto' && params.auto)) restart();
        else if (k === 'auto') plan = []; // stop after the current step
      },
      pointerDown(p) {
        for (const b of bars)
          if (p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1) {
            api.runner.set('target', b.i);
            return;
          }
      },
      update(dt) {
        if (phase) {
          t += (dt * params.speed) / (phase === 'measure' ? 0.5 : 0.8);
          if (t >= 1) {
            lastPhase = phase;
            phase = null;
            wait = 0.45;
            if (lastPhase === 'measure' && params.auto) loopWait = 2.2;
          }
          return;
        }
        if (loopWait > 0) {
          loopWait -= dt;
          if (loopWait <= 0) restart();
          return;
        }
        if (wait > 0) return void (wait -= dt * params.speed);
        if (plan.length) begin(plan.shift());
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const narrow = w < 700;
        const T = tgt();
        const box = api.thumbnail
          ? { x: 10, y: 10, w: w - 20, h: h - 20 }
          : narrow
            ? { x: 16, y: 104, w: w - 32, h: Math.min(240, h * 0.32) }
            : { x: w * 0.06, y: 104, w: w * 0.88, h: h * 0.42 };
        const y0 = box.y + box.h * 0.62;
        const scale = box.h * 0.6;
        const bw = box.w / N;
        bars = [];
        // zero line
        ctx.strokeStyle = 'rgba(200,210,240,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(box.x, y0);
        ctx.lineTo(box.x + box.w, y0);
        ctx.stroke();
        for (let i = 0; i < N; i++) {
          const a = shown(i);
          const x = box.x + i * bw;
          const top = clamp(y0 - a * scale, box.y - 4, box.y + box.h + 10);
          const isT = i === T;
          const col = isT ? C.amber : a < 0 ? C.pink : C.violet;
          ctx.fillStyle = rgba(col, isT ? 0.95 : 0.7);
          const gapPx = Math.min(4, bw * 0.2);
          ctx.fillRect(x + gapPx / 2, Math.min(y0, top), bw - gapPx, Math.abs(top - y0) || 1);
          bars.push({ i, x0: x, x1: x + bw, y0: box.y - 10, y1: box.y + box.h + 24 });
          if (!api.thumbnail && N <= 16 && bw > 26)
            text(ctx, i.toString(2).padStart(params.qubits, '0'), x + bw / 2, box.y + box.h + 12, { size: 10, mono: true, align: 'center', color: isT ? C.amber : C.dim });
          if (result && result.k === i) {
            ctx.strokeStyle = result.hit ? C.teal : C.red;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, box.y - 6, bw - 2, box.h + 10);
          }
        }
        if (api.thumbnail) return;
        // the mean, during diffusion
        if (phase === 'diffuse' && meanLine !== null) {
          const my = y0 - meanLine * scale;
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = C.ink;
          ctx.beginPath();
          ctx.moveTo(box.x, my);
          ctx.lineTo(box.x + box.w, my);
          ctx.stroke();
          ctx.setLineDash([]);
          text(ctx, 'mean', box.x + box.w - 4, my - 9, { size: 10, align: 'right', color: C.dim });
        }
        text(ctx, 'amplitude of each item', box.x, box.y - 14, { size: 11, color: C.dim });
        const tx = box.x + (T + 0.5) * bw;
        text(ctx, '★', tx, box.y + box.h + (N <= 16 && bw > 26 ? 26 : 12), { size: 12, align: 'center', color: C.amber });
        if (phase) tag(ctx, PHASE_NOTE[phase], w / 2, narrow ? 64 : 82, phase === 'oracle' ? C.pink : C.amber, { align: 'center' });
        if (result) tag(ctx, result.hit ? `Found it: item ${result.k}` : `Missed: got item ${result.k}`, w / 2, narrow ? 64 : 82, result.hit ? C.teal : C.red, { align: 'center' });

        // the geometric picture: the state turns in the plane of |marked⟩ and |rest⟩
        const r = Math.min(narrow ? 70 : 90, (h - (box.y + box.h + 90)) / 2.3);
        if (r < 30) return;
        const gx = narrow ? w / 2 : w * 0.72, gy = box.y + box.h + 50 + r * 1.15;
        const others = Array.from({ length: N }, (_, i) => (i === T ? 0 : shown(i)));
        const restA = others.reduce((s, x) => s + x, 0) / Math.max(1, N - 1);
        const ang = Math.atan2(shown(T), restA * Math.sqrt(N - 1));
        ctx.strokeStyle = 'rgba(200,210,240,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(gx, gy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gx - r - 6, gy);
        ctx.lineTo(gx + r + 12, gy);
        ctx.moveTo(gx, gy + r + 6);
        ctx.lineTo(gx, gy - r - 12);
        ctx.stroke();
        text(ctx, 'marked', gx, gy - r - 20, { size: 10, align: 'center', color: C.amber });
        text(ctx, 'the rest', gx + r + 16, gy, { size: 10, color: C.violet });
        const th0 = theta();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + Math.cos(th0) * r, gy - Math.sin(th0) * r);
        ctx.stroke();
        ctx.setLineDash([]);
        if (hist.length || phase) arrow(ctx, gx, gy, gx + Math.cos(ang) * r, gy - Math.sin(ang) * r, C.amber, 2.5, 10);
        text(ctx, `each round turns the arrow ${((2 * th0 * 180) / Math.PI).toFixed(1)}°`, gx, gy + r + 18, { size: 10, color: C.dim, align: 'center' });
      },
      stats() {
        const best = bestRounds();
        return [
          { label: 'Items N', value: `${N} (${params.qubits} qubits)` },
          { label: 'Rounds done', value: String(rounds) },
          { label: 'Chance of the marked item', value: `${(100 * pTarget()).toFixed(1)}%`, color: C.amber },
          { label: 'Best number of rounds', value: `${best} → ${(100 * Math.sin((2 * best + 1) * theta()) ** 2).toFixed(1)}%` },
          { label: 'Classical guesses (average)', value: ((N + 1) / 2).toFixed(1) },
        ];
      },
      charts() {
        const L = maxRounds() + 1;
        const th0 = theta();
        return [{
          title: 'Chance of the marked item after each round (dashed: theory)',
          series: [{ data: hist.slice(0, L), color: C.amber }],
          ref: { data: Array.from({ length: L }, (_, k) => Math.sin((2 * k + 1) * th0) ** 2), color: '#ffffff' },
          min: 0,
          max: 1,
          length: L,
        }];
      },
    };
    restart();
    return sim;
  },
};
