import { C, TAU, clamp, rgba, text, drawGlow, backdrop, Series } from '../../core/util.js';

// A Bell test with polarization-entangled photon pairs (|HH⟩ + |VV⟩)/√2. Quantum mechanics: each
// side alone is 50/50 random, and the two results agree with probability cos²(a − b). The rival
// "hidden instructions" model gives each pair a shared secret polarization λ at the source; each
// polarizer then passes the photon if λ is within 45° of its own axis. Both models are sampled
// exactly. CHSH: S = E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′), at most 2 for any hidden-instruction
// model; quantum mechanics reaches 2√2 ≈ 2.83 at a = 0°, a′ = 45°, b = 22.5°, b′ = 67.5°.

const DEG = Math.PI / 180;
const CHSH_A = [0, 45], CHSH_B = [22.5, 67.5];
const FLIGHT = 1.1; // seconds from source to polarizer
const TAPE = 28;

/** Folded angle between polarizers, 0–90°: only this matters for both models. */
const gap = (a, b) => {
  const d = Math.abs(a - b) % 180;
  return d > 90 ? 180 - d : d;
};
const agreeQ = (d) => Math.cos(d * DEG) ** 2;
const agreeH = (d) => 1 - (2 * d) / 180;
/** The hidden-instruction rule: pass (+1) if λ lies within 45° of the polarizer axis. */
const passes = (axis, lam) => (Math.cos(2 * (axis - lam) * DEG) >= 0 ? 1 : -1);

export default {
  id: 'bell-test',
  title: 'Bell’s Theorem: Testing Entanglement',
  category: 'quantum',
  tagline: 'Entangled photons agree more often than any secret plan could explain. Run the test yourself.',
  ages: ['16+'],
  topics: ['Quantum', 'Entanglement'],
  keywords: ['bell', 'chsh', 'entanglement', 'spooky action', 'einstein', 'epr', 'hidden variables', 'nobel 2022', 'polarization', 'photons', 'nonlocality'],
  blurb:
    'Einstein suspected entangled particles carry hidden instructions, decided when they are made, that fix how they will behave. In 1964 John Bell found a way to test it: count how often two distant detectors agree at different angles. Any hidden-instruction scheme has a limit, S ≤ 2. Quantum mechanics predicts 2.83, and experiments since the 1970s (Nobel Prize 2022) agree with quantum mechanics.',
  ideas: [
    'Each detector on its own gives a <b>random</b> 50/50 result, whatever the angles.',
    'Entangled photons <b>agree</b> with probability <b>cos²(a − b)</b>, where a and b are the polarizer angles.',
    '“Hidden instructions” can match that at 0°, 45° and 90°, but not in between.',
    'The <b>CHSH</b> combination S is at most <b>2</b> for any local hidden-instruction model; quantum mechanics reaches <b>2√2 ≈ 2.83</b>.',
    'Entanglement can’t send messages: the correlation only shows up when the two lists are compared.',
  ],
  hint: 'Turn the polarizers, or switch to the CHSH test',
  renderScale: 1,
  thumbChapter: 1,
  thumbFrames: 160,
  params: [
    { key: 'model', label: 'What the photons do', type: 'select', value: 'quantum', options: [
      { value: 'quantum', label: 'Quantum' }, { value: 'hidden', label: 'Hidden instructions' },
    ] },
    { key: 'mode', label: 'Experiment', type: 'select', value: 'fixed', options: [
      { value: 'fixed', label: 'Set the angles' }, { value: 'chsh', label: 'CHSH test' },
    ] },
    { key: 'a', label: 'Alice’s polarizer', type: 'range', min: 0, max: 180, step: 0.5, value: 0, unit: '°' },
    { key: 'b', label: 'Bob’s polarizer', type: 'range', min: 0, max: 180, step: 0.5, value: 0, unit: '°' },
    { key: 'rate', label: 'Photon pairs per second', type: 'range', min: 1, max: 200, step: 1, value: 12 },
    { key: 'clear', label: 'Clear results', type: 'button', action: (sim) => sim.clear() },
  ],
  story: [
    {
      title: 'Twin photons',
      text: 'A crystal in the middle makes pairs of <b>entangled</b> photons and sends one to Alice and one to Bob. Each meets a polarizer and is either let through (<b style="color:#2ee6a6">+</b>) or blocked (<b style="color:#ff5fa2">−</b>). On each side the results look completely random. But with both polarizers at the same angle, Alice and Bob <b>always agree</b>.',
      params: { model: 'quantum', mode: 'fixed', a: 0, b: 0, rate: 12 },
      enter: (s) => s.clear(true),
      duration: 13,
    },
    {
      title: 'Turn one polarizer',
      text: 'Bob slowly turns his polarizer. Agreement falls smoothly, following <b>cos²(a − b)</b>: 85% at 22.5°, 50% at 45°, and at 90° they <em>never</em> agree. The graph traces the measured agreement against the angle between the polarizers.',
      formula: 'P(agree) = cos²(a − b)',
      check: {
        q: 'Alice stays at 0° and Bob turns to 90°. How often will their results agree?',
        options: ['Always', 'Half the time', 'Never', 'About 85% of the time'],
        answer: 2,
        setup: { model: 'quantum', mode: 'fixed', a: 0, b: 0 },
        explain: 'cos²(90°) = 0: the pair always gives opposite results. Each side alone is still a random 50/50 sequence; only the comparison shows the pattern.',
      },
      params: { model: 'quantum', mode: 'fixed', a: 0, b: 90, rate: 120 },
      tween: 10,
      enter: (s) => s.clear(true),
      duration: 15,
    },
    {
      title: 'Einstein’s idea: hidden instructions',
      text: 'Maybe the photons simply leave the crystal carrying a <b>secret plan</b>, here a hidden polarization (the little line on each photon), and each polarizer just reads it. This copies the results at 0°, 45° and 90° perfectly. But in between it traces a <em>straight line</em>, not the quantum curve.',
      params: { model: 'hidden', mode: 'fixed', a: 0, b: 90, rate: 120 },
      tween: 10,
      enter: (s) => (s.sweepB(0, 90, 10), s.clear(true)),
      duration: 15,
    },
    {
      title: 'The gap at 22.5°',
      text: 'At 22.5° the two explanations disagree: quantum mechanics predicts <b>85%</b> agreement, hidden instructions give <b>75%</b>. Bell proved in 1964 that this is not a quirk of one model: <em>no</em> hidden-instruction scheme, however clever, can match quantum mechanics at every angle.',
      params: { model: 'quantum', mode: 'fixed', a: 0, b: 22.5, rate: 60 },
      enter: (s) => s.clear(),
      duration: 14,
    },
    {
      title: 'The CHSH test: hidden instructions',
      text: 'The practical test (Clauser, Horne, Shimony and Holt, 1969): for every pair, Alice picks 0° or 45° at random and Bob picks 22.5° or 67.5°. Combine the four correlations into one number, <b>S</b>. Any hidden-instruction model, even one we haven’t thought of, gives <b>S ≤ 2</b>. This one sits right on the limit.',
      formula: 'S = E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′) ≤ 2',
      params: { model: 'hidden', mode: 'chsh', rate: 120 },
      enter: (s) => s.clear(true),
      duration: 15,
    },
    {
      title: 'The CHSH test: quantum',
      text: 'Now real entangled photons. S climbs past 2 to about <b>2.83 = 2√2</b>. No secret plan fixed at the source can do this. Experiments by Clauser (1972), Aspect (1982) and Zeilinger (1998) found exactly this, and in 2015 three teams closed the last loopholes. They shared the <b>2022 Nobel Prize</b>.',
      check: {
        q: 'Hidden instructions can reach S = 2 at most. What does quantum mechanics predict?',
        options: ['Exactly 2', 'About 2.83', 'About 1.41', 'Exactly 4'],
        answer: 1,
        setup: { model: 'quantum', mode: 'chsh', rate: 120 },
        explain: 'Each of the four correlations is ±cos(45°) ≈ 0.71 in quantum mechanics, so S = 4 × 0.71 = 2√2 ≈ 2.83. Experiments match it, so the world is not run on hidden instructions.',
      },
      params: { model: 'quantum', mode: 'chsh', rate: 120 },
      enter: (s) => s.clear(true),
      duration: 16,
    },
    {
      title: 'Spooky, but no messages',
      text: 'Does Alice’s choice instantly change Bob’s photon? Whatever she does, Bob’s own results stay a 50/50 coin toss, so <b>no message</b> can be sent this way. The correlation only appears when the two lists are compared, over an ordinary channel. Today the same effect secures <b>quantum key distribution</b> and certifies true randomness.',
      params: { model: 'quantum', mode: 'fixed', a: 30, b: 60, rate: 30 },
      enter: (s) => s.clear(),
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Set the two polarizers, switch between the models, or run the CHSH test and watch S settle.',
      params: { model: 'quantum', mode: 'fixed', a: 0, b: 22.5, rate: 30 },
      enter: (s) => s.clear(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let pairs = [], acc = 0, tapeA = [], tapeB = [];
    let same = 0, n = 0, curve = new Map();
    let chsh = [[0, 0], [0, 0]].map((r) => r.map(() => ({ same: 0, n: 0 })));
    const sHist = new Series(240);
    let sTimer = 0;

    const setting = () =>
      params.mode === 'chsh' ? [CHSH_A[(Math.random() * 2) | 0], CHSH_B[(Math.random() * 2) | 0]] : [params.a, params.b];

    function emit() {
      const [sa, sb] = setting();
      let A, B, lam = null;
      if (params.model === 'quantum') {
        A = Math.random() < 0.5 ? 1 : -1;
        B = Math.random() < agreeQ(gap(sa, sb)) ? A : -A;
      } else {
        lam = Math.random() * 180;
        A = passes(sa, lam);
        B = passes(sb, lam);
      }
      pairs.push({ t: 0, sa, sb, A, B, lam, model: params.model, mode: params.mode });
    }

    function record(p) {
      tapeA.push(p.A);
      tapeB.push(p.B);
      if (tapeA.length > TAPE) tapeA.shift(), tapeB.shift();
      const agree = p.A === p.B ? 1 : 0;
      if (p.mode === 'chsh') {
        const c = chsh[CHSH_A.indexOf(p.sa)][CHSH_B.indexOf(p.sb)];
        c.same += agree;
        c.n++;
      } else {
        // the running total only counts photons measured at the current angles
        if (p.sa === params.a && p.sb === params.b) {
          same += agree;
          n++;
        }
        const d = Math.round(gap(p.sa, p.sb) / 5) * 5; // 5° bins
        const b = curve.get(d) || { same: 0, n: 0 };
        b.same += agree;
        b.n++;
        curve.set(d, b);
      }
    }

    const E = (c) => (c.n ? (2 * c.same - c.n) / c.n : 0);
    function S() {
      const e = chsh.map((r) => r.map(E));
      const S = e[0][0] - e[0][1] + e[1][0] + e[1][1];
      const varS = chsh.flat().reduce((v, c) => v + (c.n ? (1 - E(c) ** 2) / c.n : 1), 0);
      const total = chsh.flat().reduce((t, c) => t + c.n, 0);
      return { S, err: Math.sqrt(varS), total, e };
    }

    const sim = {
      clear(all = false) {
        pairs = [];
        same = n = 0;
        tapeA = [];
        tapeB = [];
        chsh = chsh.map((r) => r.map(() => ({ same: 0, n: 0 })));
        sHist.clear();
        if (all) curve = new Map();
      },
      /** Swing Bob's polarizer from one angle to another over `dur` seconds. */
      sweepB(from, to, dur) {
        api.runner.set('b', from);
        api.runner.set('b', to, dur);
      },
      onParam(k) {
        if (k === 'model' || k === 'mode') sim.clear(true);
        else if (k === 'a' || k === 'b') {
          // results so far belong to the old angles
          same = n = 0;
        }
      },
      update(dt) {
        acc += dt * params.rate;
        while (acc >= 1) {
          acc--;
          emit();
        }
        for (const p of pairs) p.t += dt / FLIGHT;
        const done = pairs.filter((p) => p.t >= 1);
        if (done.length) {
          for (const p of done) if (p.model === params.model) record(p);
          pairs = pairs.filter((p) => p.t < 1);
        }
        if (params.mode === 'chsh' && (sTimer += dt) > 0.25) {
          sTimer = 0;
          const s = S();
          if (s.total > 20) sHist.push(s.S);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const narrow = w < 700;
        const sy = narrow ? 118 : Math.max(130, h * 0.27);
        const ax = narrow ? 38 : w * 0.17, bx = narrow ? w - 38 : w * 0.83, mx = w / 2;
        const pr = narrow ? 20 : 30;
        const chshMode = params.mode === 'chsh';
        const quantum = params.model === 'quantum';

        // beam lines
        ctx.strokeStyle = 'rgba(160,175,230,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, sy);
        ctx.lineTo(bx, sy);
        ctx.stroke();
        // source crystal
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, mx, sy, narrow ? 26 : 38, C.violet, 0.35);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = rgba(C.violet, 0.8);
        ctx.save();
        ctx.translate(mx, sy);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-7, -7, 14, 14);
        ctx.restore();

        // photons in flight
        for (const p of pairs) {
          const d = p.t * (mx - ax - pr);
          for (const x of [mx - d, mx + d]) {
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, x, sy, quantum ? 10 : 8, quantum ? C.amber : C.cyan, 0.3);
            ctx.globalCompositeOperation = 'source-over';
            if (p.lam !== null) {
              const t = p.lam * DEG;
              ctx.strokeStyle = C.cyan;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x - Math.sin(t) * 7, sy + Math.cos(t) * 7);
              ctx.lineTo(x + Math.sin(t) * 7, sy - Math.cos(t) * 7);
              ctx.stroke();
            }
          }
        }

        // polarizers and detector lamps
        const last = { A: tapeA[tapeA.length - 1], B: tapeB[tapeB.length - 1] };
        const angles = chshMode ? null : { A: params.a, B: params.b };
        for (const [x, who, col] of [[ax, 'A', C.pink], [bx, 'B', C.cyan]]) {
          ctx.fillStyle = 'rgba(12,16,32,0.9)';
          ctx.strokeStyle = 'rgba(200,210,240,0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, sy, pr, 0, TAU);
          ctx.fill();
          ctx.stroke();
          // polarizer axis (or both CHSH settings)
          const show = angles ? [angles[who]] : who === 'A' ? CHSH_A : CHSH_B;
          show.forEach((ang, i) => {
            const t = ang * DEG;
            ctx.strokeStyle = angles ? C.ink : rgba(C.ink, 0.7 - i * 0.25);
            ctx.lineWidth = angles ? 3 : 2;
            ctx.beginPath();
            ctx.moveTo(x - Math.sin(t) * pr * 0.85, sy + Math.cos(t) * pr * 0.85);
            ctx.lineTo(x + Math.sin(t) * pr * 0.85, sy - Math.cos(t) * pr * 0.85);
            ctx.stroke();
          });
          const name = who === 'A' ? 'Alice' : 'Bob';
          const angTxt = angles ? `${(+angles[who]).toFixed(1).replace('.0', '')}°` : who === 'A' ? '0° or 45°' : '22.5° or 67.5°';
          // on phones the labels hug the screen edge instead of centring on the polarizer
          const lx = narrow ? (who === 'A' ? x - pr : x + pr) : x;
          const align = narrow ? (who === 'A' ? 'left' : 'right') : 'center';
          text(ctx, name, lx, sy - pr - (narrow ? 30 : 34), { size: narrow ? 12 : 14, weight: 700, align, color: col });
          text(ctx, angTxt, lx, sy - pr - (narrow ? 15 : 16), { size: 11, align, color: C.dim, mono: true });
          const r = last[who];
          if (r !== undefined) {
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, x, sy + pr + 18, 16, r > 0 ? C.teal : C.pink, 0.45);
            ctx.globalCompositeOperation = 'source-over';
            text(ctx, r > 0 ? '+' : '−', x, sy + pr + 18, { size: 15, weight: 700, align: 'center', color: C.ink });
          }
        }
        if (api.thumbnail) return;
        text(ctx, quantum ? 'entangled: no polarization until measured' : 'each pair carries a hidden polarization', mx, sy + (narrow ? 30 : 46), { size: 11, align: 'center', color: C.dim });

        // result tapes: Alice above Bob, matches outlined
        const cells = narrow ? Math.min(TAPE, Math.floor((w - 70) / 12)) : TAPE;
        const cs = narrow ? 10 : 13;
        const tx = mx - (cells * (cs + 2)) / 2 + 16;
        const ty = sy + (narrow ? 58 : 82);
        text(ctx, 'A', tx - 14, ty + cs / 2, { size: 11, weight: 700, color: C.pink, align: 'center' });
        text(ctx, 'B', tx - 14, ty + cs + 4 + cs / 2, { size: 11, weight: 700, color: C.cyan, align: 'center' });
        const off = Math.max(0, tapeA.length - cells);
        for (let i = off; i < tapeA.length; i++) {
          const x = tx + (i - off) * (cs + 2);
          for (const [v, y] of [[tapeA[i], ty], [tapeB[i], ty + cs + 4]]) {
            ctx.fillStyle = v > 0 ? rgba(C.teal, 0.85) : rgba(C.pink, 0.85);
            ctx.fillRect(x, y, cs, cs);
          }
          if (tapeA[i] === tapeB[i]) {
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 0.5, ty - 0.5, cs + 1, 2 * cs + 5);
          }
        }

        // the graph: agreement against angle (fixed), or the S meter (CHSH)
        const box = narrow
          ? { x: 46, y: ty + 2 * cs + 50, w: w - 70, h: Math.max(110, h - (ty + 2 * cs + 50) - 82) } // clear of the hint at the foot of the stage
          : { x: w * 0.56, y: ty + 2 * cs + 56, w: w * 0.38, h: Math.max(120, h - (ty + 2 * cs + 56) - 50) };
        if (chshMode) drawS(box);
        else drawCurve(box);
      },
      stats() {
        const out = [];
        if (params.mode === 'chsh') {
          const s = S();
          out.push({ label: 'Pairs measured', value: String(s.total) });
          out.push({ label: 'S (measured)', value: s.total ? `${s.S.toFixed(2)} ± ${s.err.toFixed(2)}` : '—', color: s.S > 2 ? C.amber : C.cyan });
          out.push({ label: 'Hidden-instruction limit', value: '2' });
          out.push({ label: 'Quantum prediction', value: '2√2 ≈ 2.83' });
          return out;
        }
        const d = gap(params.a, params.b);
        out.push({ label: 'Angle between polarizers', value: `${d.toFixed(1)}°` });
        out.push({ label: 'Agreement (measured)', value: n ? `${((100 * same) / n).toFixed(1)}% of ${n}` : '—', color: C.amber });
        out.push({ label: 'Quantum: cos²(a − b)', value: `${(100 * agreeQ(d)).toFixed(1)}%`, color: C.amber });
        out.push({ label: 'Hidden instructions', value: `${(100 * agreeH(d)).toFixed(1)}%`, color: C.cyan });
        return out;
      },
      charts() {
        if (params.mode !== 'chsh') return null;
        return [{ title: 'S over time (dashed: the limit 2)', series: [{ data: sHist.data, color: params.model === 'quantum' ? C.amber : C.cyan }], ref: { data: [2, 2], color: '#ffffff' }, min: 0, max: 3.2, length: 240 }];
      },
    };

    function drawCurve(b) {
      const X = (d) => b.x + (d / 90) * b.w, Y = (p) => b.y + b.h - p * b.h;
      ctx.strokeStyle = 'rgba(160,175,230,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      for (const d of [0, 22.5, 45, 67.5, 90]) text(ctx, `${d}°`, X(d), b.y + b.h + 12, { size: 10, align: 'center', color: C.dim });
      for (const p of [0, 0.5, 1]) text(ctx, `${p * 100}%`, b.x - 6, Y(p), { size: 10, align: 'right', color: C.dim });
      text(ctx, 'agreement vs angle between polarizers', b.x, b.y - 12, { size: 11, color: C.dim });
      const line = (f, col, dash) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.setLineDash(dash);
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const d = (i / 60) * 90;
          ctx[i ? 'lineTo' : 'moveTo'](X(d), Y(f(d)));
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };
      line(agreeH, rgba(C.cyan, 0.75), [5, 4]);
      line(agreeQ, rgba(C.amber, 0.85), []);
      const lx = b.x + b.w - 8;
      text(ctx, 'quantum', lx, b.y + 12, { size: 10, align: 'right', color: C.amber });
      text(ctx, 'hidden instructions', lx, b.y + 26, { size: 10, align: 'right', color: C.cyan });
      // measured points
      const col = params.model === 'quantum' ? C.amber : C.cyan;
      for (const [d, c] of curve) {
        if (c.n < 8) continue;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(X(d), Y(c.same / c.n), clamp(1.5 + Math.sqrt(c.n) / 4, 2, 4.5), 0, TAU);
        ctx.fill();
      }
      const d = gap(params.a, params.b);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(X(d), b.y);
      ctx.lineTo(X(d), b.y + b.h);
      ctx.stroke();
      ctx.setLineDash([]);
      if (n) {
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(X(d), Y(same / n), 6, 0, TAU);
        ctx.stroke();
      }
    }

    function drawS(b) {
      const s = S();
      const X = (v) => b.x + (v / 4) * b.w;
      const y = b.y + 46;
      text(ctx, 'S, combining the four pairs of settings', b.x, b.y, { size: 11, color: C.dim });
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(b.x, y, b.w, 18);
      ctx.fillStyle = rgba(C.cyan, 0.18);
      ctx.fillRect(b.x, y, X(2) - b.x, 18);
      if (s.total) {
        ctx.fillStyle = s.S > 2 ? C.amber : C.cyan;
        ctx.fillRect(b.x, y + 4, Math.max(0, X(clamp(s.S, 0, 4)) - b.x), 10);
      }
      for (const [v, lab, col] of [[2, 'limit 2', C.cyan], [2 * Math.SQRT2, '2.83', C.amber]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(X(v), y - 4);
        ctx.lineTo(X(v), y + 22);
        ctx.stroke();
        text(ctx, lab, X(v), y + 34, { size: 10, align: 'center', color: col });
      }
      text(ctx, s.total ? `S = ${s.S.toFixed(2)} ± ${s.err.toFixed(2)}` : 'S = …', b.x, b.y + 22, { size: 16, weight: 700, color: s.S > 2 ? C.amber : C.ink, mono: true });
      // the four correlations
      const rows = [[0, 0, '+'], [0, 1, '−'], [1, 0, '+'], [1, 1, '+']];
      const ry = y + 60;
      rows.forEach(([i, j, sign], k) => {
        const yy = ry + k * 20;
        if (yy > b.y + b.h + 30) return;
        const c = s.e[i][j];
        text(ctx, `${sign} E(${CHSH_A[i]}°, ${CHSH_B[j]}°)`, b.x, yy, { size: 11, mono: true, color: C.dim });
        text(ctx, chsh[i][j].n ? c.toFixed(2) : '…', b.x + b.w, yy, { size: 11, mono: true, align: 'right' });
      });
    }

    return sim;
  },
};
