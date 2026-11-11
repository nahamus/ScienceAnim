import { C, TAU, clamp, roundRect, tag, text } from '../../core/util.js';

// Bayes' theorem two ways.
// Test: 1,000 people, natural frequencies. Sick = prevalence × 1000; true positives = sick × sensitivity;
// false positives = healthy × false-alarm rate. P(sick | positive) = TP ÷ (TP + FP). A second test is applied
// to the positives only (independent errors), so yesterday's answer becomes today's prior.
// Coin: a coin with hidden bias. Starting from a flat prior, after h heads and t tails the belief about the
// bias is a Beta(h + 1, t + 1) curve.

const NP = 1000;
function seeded(s) {
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function lgamma(x) {
  // Lanczos approximation
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(TAU) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
const betaPdf = (p, a, b) => Math.exp((a - 1) * Math.log(Math.max(p, 1e-12)) + (b - 1) * Math.log(Math.max(1 - p, 1e-12)) + lgamma(a + b) - lgamma(a) - lgamma(b));

export default {
  id: 'bayes',
  title: 'Bayes’ Theorem',
  category: 'math',
  tagline: 'You test positive for a rare disease. The test is 90 % accurate. Are you probably ill?',
  ages: ['14-16', '16+'],
  topics: ['Probability', 'Statistics', 'Reasoning'],
  keywords: ['Bayes theorem', 'conditional probability', 'base rate fallacy', 'false positive', 'medical test', 'prior', 'posterior', 'likelihood', 'natural frequencies', 'Bayesian inference', 'beta distribution', 'spam filter', 'machine learning'],
  blurb:
    'A positive result from a good test feels like proof. But if the disease is rare, most positives can be false alarms from the huge number of healthy people tested. Bayes’ theorem is the rule for updating what you believe when new evidence arrives, and it powers everything from medical screening to spam filters and AI. Count 1,000 people and it becomes obvious.',
  ideas: [
    'Start from how common something is before any evidence: the <b>prior</b> (the base rate).',
    'A test with a small false-alarm rate still produces many false positives when it is used on many healthy people.',
    '<b>Bayes’ theorem</b>: P(ill | positive) = P(positive | ill) × P(ill) ÷ P(positive).',
    'Counting people (<b>natural frequencies</b>) makes Bayes easy: ill positives ÷ all positives.',
    'Each new piece of evidence updates the belief, which becomes the prior for the next.',
  ],
  hint: 'Change how rare the disease is and how good the test is',
  thumbChapter: 3,
  thumbFrames: 120,
  params: [
    {
      key: 'scene', label: 'Scene', type: 'select', value: 'test', instant: true,
      options: [{ value: 'test', label: 'Medical test' }, { value: 'coin', label: 'Is the coin fair?' }],
    },
    {
      key: 'view', label: 'Show', type: 'select', value: 'people',
      options: [{ value: 'people', label: 'Everyone' }, { value: 'tested', label: 'Test results' }, { value: 'positives', label: 'Only positives' }],
    },
    { key: 'prev', label: 'People who have the disease', type: 'range', min: 0.002, max: 0.3, step: 0.001, value: 0.01, instant: true, format: (v) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)} % (${Math.round(v * NP)} in 1,000)` },
    { key: 'sens', label: 'Test catches the disease', type: 'range', min: 0.5, max: 1, step: 0.01, value: 0.9, instant: true, format: (v) => Math.round(v * 100) + ' % of the time' },
    { key: 'fpr', label: 'False alarms in healthy people', type: 'range', min: 0, max: 0.2, step: 0.005, value: 0.09, instant: true, format: (v) => (v * 100).toFixed(1) + ' %' },
    { key: 'retest', label: 'Test the positives again', type: 'toggle', value: false },
    { key: 'truth', label: 'Coin’s real chance of heads', type: 'range', min: 0.05, max: 0.95, step: 0.05, value: 0.7, instant: true, format: (v) => Math.round(v * 100) + ' %' },
    { key: 'flipping', label: 'Keep flipping', type: 'toggle', value: false },
    { key: 'flip', label: 'Flip 10 times', type: 'button', action: (s) => s.flip(10) },
    { key: 'clear', label: 'Start over', type: 'button', action: (s) => s.clearCoin() },
  ],
  story: [
    {
      title: 'A rare disease',
      text: 'Here are 1,000 people. One in a hundred of them has a disease (in red), but nobody can tell who by looking. So we screen everyone with a test.',
      params: { scene: 'test', view: 'people', prev: 0.01, sens: 0.9, fpr: 0.09, retest: false },
      duration: 11,
    },
    {
      title: 'A good test',
      text: 'The test catches 90 % of people who have the disease. In healthy people it is right 91 % of the time, so it gives a false alarm to 9 % of them. Everyone with a yellow ring tested positive. Notice how many of them are healthy.',
      params: { scene: 'test', view: 'tested', prev: 0.01, sens: 0.9, fpr: 0.09, retest: false },
      duration: 13,
    },
    {
      title: 'You test positive',
      text: 'You get a positive result. Now gather everyone who tested positive. Only 9 of the 98 are actually ill: about <b>9 %</b>. The test is good, but the healthy people outnumber the ill ones 99 to 1, so even a small false-alarm rate produces far more false positives than true ones.',
      check: {
        q: 'You test positive. Roughly how likely is it that you have the disease?',
        options: ['About 10 %', 'About 50 %', 'About 90 %'],
        answer: 0,
        setup: { scene: 'test', view: 'tested', prev: 0.01, sens: 0.9, fpr: 0.09, retest: false },
        explain: 'Out of 1,000 people, 10 are ill and 9 of them test positive. Of the 990 healthy people, 9 % (89) also test positive. So 9 of 98 positives are ill. In studies, most doctors asked this same question guessed 80–90 %.',
      },
      params: { scene: 'test', view: 'positives', prev: 0.01, sens: 0.9, fpr: 0.09, retest: false },
      duration: 15,
    },
    {
      title: 'Bayes’ theorem',
      text: 'Thomas Bayes worked out the rule in the 1750s. The chance you are ill given a positive test depends on the test’s accuracy <i>and</i> on how common the disease was to begin with, the <b>prior</b>. Watch what happens when the disease becomes more common (now 1 in 10): the same positive result means much more.',
      formula: 'P(ill | +) = P(+ | ill) × P(ill) ÷ P(+)',
      params: { scene: 'test', view: 'positives', prev: 0.1, sens: 0.9, fpr: 0.09, retest: false },
      duration: 15,
    },
    {
      title: 'Test again',
      text: 'Back to the rare disease. Doctors don’t stop at one test: they test the positives again. Now the group being tested is already 9 % ill, not 1 %. That is Bayes in action: your updated belief becomes the new prior. After two positives, the chance of being ill jumps to about 50 %.',
      params: { scene: 'test', view: 'positives', prev: 0.01, sens: 0.9, fpr: 0.09, retest: true },
      duration: 15,
    },
    {
      title: 'Learning from evidence',
      text: 'Bayes also works when the unknown is a number. Is this coin fair? We start with no idea: every chance of heads looks equally likely (a flat line). After each flip, the belief curve updates; it narrows around the true value as evidence piles up. Spam filters, weather forecasts, self-driving cars and many AI systems update beliefs this way.',
      params: { scene: 'coin', truth: 0.7, flipping: true },
      enter: (s) => s.clearCoin(),
      duration: 18,
    },
    {
      title: 'Your turn',
      text: 'Make the disease rarer or commoner, the test better or worse, and see how much a positive result really means. Or set a hidden coin and watch the evidence build up.',
      params: { scene: 'test', view: 'positives', prev: 0.02, sens: 0.95, fpr: 0.05, retest: false },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const rnd = seeded(2024);
    // a fixed random order of people, and a fixed random number for each test
    const order = Array.from({ length: NP }, (_, i) => i).sort(() => rnd() - 0.5);
    const u1 = Array.from({ length: NP }, () => rnd()), u2 = Array.from({ length: NP }, () => rnd());
    const dots = Array.from({ length: NP }, () => ({ x: 0, y: 0, a: 1, init: false }));
    let flips = [], flipAcc = 0, crnd = seeded(7);

    /** Exact natural-frequency classification of each person. */
    function classify() {
      const sick = Math.round(params.prev * NP);
      const ill = new Array(NP).fill(false);
      for (let k = 0; k < sick; k++) ill[order[k]] = true;
      // rank people within each group by their test draw so counts are exact
      const pos = new Array(NP).fill(false), pos2 = new Array(NP).fill(false);
      const groups = [[...Array(NP).keys()].filter((i) => ill[i]), [...Array(NP).keys()].filter((i) => !ill[i])];
      groups.forEach((g, gi) => {
        const rate = gi === 0 ? params.sens : params.fpr;
        const n1 = Math.round(g.length * rate);
        const by1 = [...g].sort((a, b) => u1[a] - u1[b]);
        by1.slice(0, n1).forEach((i) => (pos[i] = true));
        const firsts = by1.slice(0, n1);
        const n2 = Math.round(firsts.length * rate);
        [...firsts].sort((a, b) => u2[a] - u2[b]).slice(0, n2).forEach((i) => (pos2[i] = true));
      });
      return { ill, pos, pos2 };
    }
    function counts() {
      const sick = Math.round(params.prev * NP), healthy = NP - sick;
      const tp = Math.round(sick * params.sens), fp = Math.round(healthy * params.fpr);
      const tp2 = Math.round(tp * params.sens), fp2 = Math.round(fp * params.fpr);
      return { sick, healthy, tp, fp, tp2, fp2 };
    }

    function layout() {
      const { w, h } = api;
      const phone = w < 760;
      if (phone) {
        const cols = 50, rows = 20, cell = Math.min((w - 24) / cols, (h * 0.42) / rows);
        return { phone, cols, rows, cell, x0: (w - cols * cell) / 2, y0: 66, panel: { x: 12, y: 66 + rows * cell + 14, w: w - 24, h: h - (66 + rows * cell + 14) - 56 } };
      }
      const cols = 40, rows = 25, aw = w * 0.52, ah = Math.min(h - 130 - 340, 420) + 40;
      const cell = Math.min(aw / cols, Math.max(ah, 300) / rows);
      return { phone, cols, rows, cell, x0: 28, y0: 112, panel: { x: w * 0.58, y: 112, w: w * 0.42 - 24, h: Math.min(h - 136, 470) } };
    }

    function drawTest() {
      const { w, h } = api;
      const L = layout();
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, w, h);
      const { ill, pos, pos2 } = classify();
      const c = counts();
      const v = params.view;
      const posSet = params.retest ? pos2 : pos;
      // targets
      let ti = 0;
      const posList = [];
      for (let k = 0; k < NP; k++) {
        const i = order[(k * 7) % NP]; // spread the ill across the grid
        if (posSet[i]) posList.push(i);
      }
      posList.sort((a, b) => (ill[b] ? 1 : 0) - (ill[a] ? 1 : 0));
      const gather = v === 'positives';
      const gcols = Math.max(6, Math.ceil(Math.sqrt(posList.length * 1.6)));
      const gcell = Math.min(L.cell * 2.2, (L.cols * L.cell) / gcols, (L.rows * L.cell) / Math.max(1, Math.ceil(posList.length / gcols)));
      const rank = new Map(posList.map((i, k) => [i, k]));
      for (let k = 0; k < NP; k++) {
        const i = order[(k * 7) % NP];
        const d = dots[i];
        let tx = L.x0 + (ti % L.cols) * L.cell + L.cell / 2, ty = L.y0 + Math.floor(ti / L.cols) * L.cell + L.cell / 2;
        ti++;
        let ta = 1;
        if (gather) {
          if (rank.has(i)) {
            const r = rank.get(i);
            tx = L.x0 + (r % gcols) * gcell + gcell / 2;
            ty = L.y0 + Math.floor(r / gcols) * gcell + gcell / 2;
          } else ta = 0.07;
        }
        if (!d.init) {
          d.x = tx;
          d.y = ty;
          d.a = ta;
          d.init = true;
        }
        d.tx = tx;
        d.ty = ty;
        d.ta = ta;
        d.big = gather && rank.has(i);
        const r = (d.big ? gcell : L.cell) * 0.36;
        ctx.globalAlpha = d.a;
        ctx.fillStyle = ill[i] ? '#ff4d6d' : '#5f78b8';
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, TAU);
        ctx.fill();
        if (v !== 'people' && posSet[i]) {
          ctx.strokeStyle = '#ffd23f';
          ctx.lineWidth = Math.max(1.2, r * 0.45);
          ctx.beginPath();
          ctx.arc(d.x, d.y, r + ctx.lineWidth * 0.6, 0, TAU);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      if (gather && !L.phone) {
        const tp = params.retest ? c.tp2 : c.tp, fp = params.retest ? c.fp2 : c.fp;
        const yb = L.y0 + Math.ceil(posList.length / gcols) * gcell + 22;
        text(ctx, `${tp} ill + ${fp} healthy tested positive${params.retest ? ' twice' : ''}`, L.x0, yb, { size: L.phone ? 12 : 15, weight: 600 });
        text(ctx, `chance a positive is ill: ${tp} ÷ ${tp + fp} = ${tp + fp ? Math.round((tp / (tp + fp)) * 100) : 0} %`, L.x0, yb + (L.phone ? 18 : 24), { size: L.phone ? 12 : 15, color: C.amber, mono: true });
      }

      // frequency tree
      const P = L.panel;
      if (P.h < 60) return;
      ctx.fillStyle = 'rgba(8,11,24,0.86)';
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      roundRect(ctx, P.x, P.y, P.w, P.h, 12);
      ctx.fill();
      ctx.stroke();
      if (L.phone) {
        const ppv = c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0;
        const ppv2 = c.tp2 + c.fp2 ? c.tp2 / (c.tp2 + c.fp2) : 0;
        text(ctx, `1,000 people → ${c.sick} ill, ${c.healthy} healthy`, P.x + 10, P.y + 14, { size: 11, color: C.dim });
        text(ctx, `positives: ${c.tp} ill + ${c.fp} healthy`, P.x + 10, P.y + 32, { size: 11, color: '#ffd23f' });
        text(ctx, `P(ill | +) = ${Math.round(ppv * 100)} %${params.retest ? `  →  after 2nd: ${Math.round(ppv2 * 100)} %` : ''}`, P.x + 10, P.y + 50, { size: 11, color: C.amber, mono: true });
        return;
      }
      text(ctx, 'Counting 1,000 people', P.x + 14, P.y + 18, { size: 12, weight: 600, color: C.dim });
      const box = (x, y, n, label, col) => {
        const bw = Math.min(140, P.w / 4 - 8), bh = 46;
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 8);
        ctx.fill();
        ctx.stroke();
        text(ctx, String(n), x, y - 7, { size: 17, weight: 700, align: 'center', mono: true, color: col });
        text(ctx, label, x, y + 12, { size: 10, align: 'center', color: C.dim });
      };
      const line = (x1, y1, x2, y2, lab) => {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (lab) text(ctx, lab, (x1 + x2) / 2 + 6, (y1 + y2) / 2, { size: 9.5, color: 'rgba(233,237,247,0.6)' });
      };
      const cx = P.x + P.w / 2, q = P.w / 4;
      const r0 = P.y + 60, r1 = P.y + 150, r2 = P.y + 240;
      line(cx, r0 + 23, cx - q, r1 - 23, `${(params.prev * 100).toFixed(1)} %`);
      line(cx, r0 + 23, cx + q, r1 - 23, '');
      box(cx, r0, NP, 'people', C.ink);
      line(cx - q, r1 + 23, cx - q * 1.5, r2 - 23, `${Math.round(params.sens * 100)} %`);
      line(cx - q, r1 + 23, cx - q * 0.5, r2 - 23, '');
      line(cx + q, r1 + 23, cx + q * 0.5, r2 - 23, `${(params.fpr * 100).toFixed(1)} %`);
      line(cx + q, r1 + 23, cx + q * 1.5, r2 - 23, '');
      box(cx - q, r1, c.sick, 'ill', '#ff4d6d');
      box(cx + q, r1, c.healthy, 'healthy', '#7f98d8');
      box(cx - q * 1.5, r2, c.tp, 'ill, positive', '#ffd23f');
      box(cx - q * 0.5, r2, c.sick - c.tp, 'ill, negative', 'rgba(233,237,247,0.4)');
      box(cx + q * 0.5, r2, c.fp, 'healthy, positive', '#ffd23f');
      box(cx + q * 1.5, r2, c.healthy - c.fp, 'healthy, negative', 'rgba(233,237,247,0.4)');
      const ppv = c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0;
      const yy = r2 + 60;
      text(ctx, 'If you test positive, the chance you are ill:', P.x + 14, yy, { size: 12, color: C.dim });
      text(ctx, `${c.tp} ÷ (${c.tp} + ${c.fp}) = ${(ppv * 100).toFixed(1)} %`, P.x + 14, yy + 26, { size: 20, weight: 700, color: C.amber, mono: true });
      if (params.retest) {
        const ppv2 = c.tp2 + c.fp2 ? c.tp2 / (c.tp2 + c.fp2) : 0;
        text(ctx, 'After a second positive test:', P.x + 14, yy + 62, { size: 12, color: C.dim });
        text(ctx, `${c.tp2} ÷ (${c.tp2} + ${c.fp2}) = ${(ppv2 * 100).toFixed(1)} %`, P.x + 14, yy + 88, { size: 20, weight: 700, color: C.teal, mono: true });
      }
    }

    function drawCoin() {
      const { w, h } = api;
      const phone = w < 760;
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, w, h);
      const heads = flips.filter((f) => f).length, tails = flips.length - heads;
      // recent flips
      const show = flips.slice(-30);
      const cs = phone ? 10 : 16;
      const x0 = phone ? 14 : 30, y0 = phone ? 70 : 120;
      text(ctx, `${flips.length} flips: ${heads} heads, ${tails} tails`, x0, y0 - (phone ? 0 : 6), { size: phone ? 12 : 15, weight: 600 });
      show.forEach((f, i) => {
        const X = x0 + cs + i * (cs * 2 + 4), Y = y0 + cs + 18;
        ctx.fillStyle = f ? '#ffd166' : '#8f9ab8';
        ctx.beginPath();
        ctx.arc(X, Y, cs, 0, TAU);
        ctx.fill();
        text(ctx, f ? 'H' : 'T', X, Y + 1, { size: cs, weight: 700, align: 'center', color: '#1a1a24', shadow: false });
      });
      // belief curve
      const px = phone ? 14 : w * 0.38, pw = phone ? w - 28 : w * 0.62 - 30;
      const py = phone ? y0 + 60 : 190, ph = phone ? h - py - 70 : Math.min(h - 220, 400);
      ctx.fillStyle = 'rgba(8,11,24,0.86)';
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      roundRect(ctx, px, py, pw, ph, 12);
      ctx.fill();
      ctx.stroke();
      text(ctx, 'How much we believe each possible chance of heads', px + 12, py + 15, { size: 11, weight: 600, color: C.dim });
      const gx0 = px + 16, gx1 = px + pw - 16, gy0 = py + 34, gy1 = py + ph - 28;
      const a = heads + 1, b = tails + 1;
      let peak = 0;
      const vals = [];
      for (let k = 0; k <= 200; k++) {
        const p = k / 200;
        const v = betaPdf(p, a, b);
        vals.push(v);
        peak = Math.max(peak, v);
      }
      const top = Math.max(peak, 2.2);
      // 95 % interval by numerical CDF
      let cum = 0;
      const tot = vals.reduce((s, v) => s + v, 0);
      let lo = 0, hi = 1;
      vals.forEach((v, k) => {
        const prev = cum;
        cum += v / tot;
        if (prev < 0.025 && cum >= 0.025) lo = k / 200;
        if (prev < 0.975 && cum >= 0.975) hi = k / 200;
      });
      const X = (p) => gx0 + p * (gx1 - gx0), Y = (v) => gy1 - (v / top) * (gy1 - gy0);
      ctx.fillStyle = 'rgba(167,139,250,0.22)';
      ctx.beginPath();
      ctx.moveTo(X(lo), gy1);
      for (let k = Math.round(lo * 200); k <= Math.round(hi * 200); k++) ctx.lineTo(X(k / 200), Y(vals[k]));
      ctx.lineTo(X(hi), gy1);
      ctx.fill();
      ctx.strokeStyle = C.violet;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      vals.forEach((v, k) => ctx[k ? 'lineTo' : 'moveTo'](X(k / 200), Y(v)));
      ctx.stroke();
      // the hidden truth
      ctx.strokeStyle = 'rgba(255,214,102,0.8)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(X(params.truth), gy0);
      ctx.lineTo(X(params.truth), gy1);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'true value (hidden from us)', X(params.truth) + 6, gy0 + 6, { size: 10, color: C.amber });
      for (let k = 0; k <= 10; k += 2) text(ctx, `${k * 10}%`, X(k / 10), gy1 + 12, { size: 10, align: 'center', color: 'rgba(233,237,247,0.45)', mono: true });
      text(ctx, 'chance of heads →', gx1, gy1 + 24, { size: 9, align: 'right', color: 'rgba(233,237,247,0.45)' });
      if (!phone) {
        const best = flips.length ? heads / flips.length : 0.5;
        text(ctx, 'Best guess', x0, 230, { size: 12, color: C.dim });
        text(ctx, `${Math.round(best * 100)} % heads`, x0, 256, { size: 22, weight: 700, color: C.violet, mono: true });
        text(ctx, '95 % sure it is between', x0, 300, { size: 12, color: C.dim });
        text(ctx, `${Math.round(lo * 100)} % and ${Math.round(hi * 100)} %`, x0, 326, { size: 22, weight: 700, color: C.violet, mono: true });
        text(ctx, flips.length && (lo > 0.5 || hi < 0.5) ? 'Evidence says: not a fair coin' : 'Not enough evidence yet to say', x0, 366, { size: 13, color: flips.length && (lo > 0.5 || hi < 0.5) ? C.red : C.dim });
      }
      tag(ctx, `posterior after ${flips.length} flips`, w - 16, phone ? 56 : 84, C.violet, { align: 'right' });
    }

    const sim = {
      flip(n) {
        for (let i = 0; i < n; i++) flips.push(crnd() < params.truth);
      },
      clearCoin() {
        flips = [];
        flipAcc = 0;
        crnd = seeded(7);
      },
      onParam(k) {
        if (k === 'truth') sim.clearCoin();
      },
      update(dt) {
        const k = 1 - Math.exp(-dt * 4);
        for (const d of dots) {
          if (!d.init) continue;
          d.x += (d.tx - d.x) * k;
          d.y += (d.ty - d.y) * k;
          d.a += (d.ta - d.a) * k;
        }
        if (params.scene === 'coin' && params.flipping && flips.length < 400) {
          flipAcc += dt * clamp(1.5 + flips.length / 12, 1.5, 12);
          while (flipAcc >= 1) {
            flipAcc -= 1;
            sim.flip(1);
          }
        }
      },
      draw() {
        if (params.scene === 'test') drawTest();
        else drawCoin();
      },
      stats() {
        if (params.scene === 'coin') {
          const heads = flips.filter((f) => f).length;
          return [
            { label: 'Flips', value: String(flips.length) },
            { label: 'Heads', value: String(heads), color: C.amber },
            { label: 'Best guess', value: flips.length ? `${Math.round((heads / flips.length) * 100)} %` : '—', color: C.violet },
          ];
        }
        const c = counts();
        const ppv = c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0;
        const ppv2 = c.tp2 + c.fp2 ? c.tp2 / (c.tp2 + c.fp2) : 0;
        return [
          { label: 'Ill (prior)', value: `${(params.prev * 100).toFixed(1)} %`, color: C.red },
          { label: 'Positive tests', value: String(c.tp + c.fp), color: '#ffd23f' },
          { label: 'Ill, given positive', value: `${(ppv * 100).toFixed(1)} %`, color: C.amber },
          { label: 'Ill, given 2 positives', value: `${(ppv2 * 100).toFixed(1)} %`, color: C.teal },
          { label: 'Ill, given negative', value: `${(((c.sick - c.tp) / Math.max(1, NP - c.tp - c.fp)) * 100).toFixed(2)} %` },
        ];
      },
    };
    return sim;
  },
};
