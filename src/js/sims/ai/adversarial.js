import { C, Series, backdrop, clamp, seeded, tag, text } from '../../core/util.js';

// A real (small) neural network trained in your browser on hand-drawn-style shapes, then attacked.
// 16×16 grey images → 32 hidden ReLU units → 4 classes, trained by stochastic gradient descent.
// Attacks are projected gradient descent: nudge every pixel a little in the direction that most raises the target
// class, never by more than ε from the original. Fooling images start from grey with no limit.

const N = 16, D = N * N, HID = 32, K = 4;
const NAMES = ['circle', 'square', 'triangle', 'cross'];
const COLS = ['#4cc3ff', '#ffb547', '#ff5fa2', '#a3e635'];

function inside(k, x, y, cx, cy, r, a) {
  const dx = x - cx, dy = y - cy, c = Math.cos(a), s = Math.sin(a), u = dx * c + dy * s, v = -dx * s + dy * c;
  if (k === 0) return Math.hypot(dx, dy) < r;
  if (k === 1) return Math.abs(u) < r * 0.85 && Math.abs(v) < r * 0.85;
  if (k === 2) {
    const h = r * 1.1;
    return v < h * 0.55 && v > -h * 0.95 && Math.abs(u) < (v + h * 0.95) * 0.62;
  }
  return (Math.abs(u) < r * 0.3 && Math.abs(v) < r) || (Math.abs(v) < r * 0.3 && Math.abs(u) < r);
}
function drawShape(k, rnd) {
  const img = new Float32Array(D), cx = 7.5 + (rnd() - 0.5) * 4, cy = 7.5 + (rnd() - 0.5) * 4, r = 4.4 + rnd() * 1.8, a = k === 0 ? 0 : rnd() * Math.PI * 2;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let s = 0;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) s += inside(k, x + (sx + 0.5) / 3, y + (sy + 0.5) / 3, cx, cy, r, a);
      img[y * N + x] = clamp((s / 9) * (0.75 + rnd() * 0.25) + (rnd() - 0.5) * 0.08, 0, 1);
    }
  return img;
}

export default {
  id: 'adversarial',
  title: 'Fooling an AI',
  category: 'ai',
  tagline: 'Change every pixel by a hair and a confident AI sees something completely different.',
  ages: ['14-16', '16+'],
  topics: ['Neural networks', 'AI safety', 'Images'],
  keywords: ['adversarial example', 'adversarial attack', 'neural network', 'image classifier', 'robustness', 'FGSM', 'PGD', 'fooling images', 'AI safety', 'adversarial training'],
  blurb:
    'A small neural network learns to recognise shapes, right here in your browser, and gets nearly all of them right. Then we add noise so faint you can’t see it, but aimed precisely, and it confidently calls a circle a triangle. Adversarial examples show that image AIs don’t see the way we do, matter for self-driving cars and security, and are one of the open problems of AI safety.',
  ideas: [
    'An image classifier turns pixels into a score for each class; training tunes its weights on labelled examples.',
    'The <b>gradient</b> tells us, for every pixel, which way to nudge it to raise any class’s score.',
    'Nudging every pixel a tiny amount in that direction adds up: an <b>adversarial example</b> fools the network while looking unchanged to us.',
    'Random noise of the same size barely matters; it is the <b>aim</b> that does the damage.',
    '<b>Adversarial training</b> makes a model harder to fool, but no image AI is fully immune yet.',
  ],
  hint: 'Pick a target, then turn up the aimed noise',
  thumbChapter: 3,
  thumbFrames: 160,
  params: [
    { key: 'view', label: 'View', type: 'select', value: 'gallery', options: [{ value: 'gallery', label: 'Test pictures' }, { value: 'attack', label: 'Attack one picture' }, { value: 'dream', label: 'Fooling image' }] },
    { key: 'target', label: 'Make it see a', type: 'select', value: 2, options: NAMES.map((n, i) => ({ value: i, label: n })) },
    { key: 'noise', label: 'Noise', type: 'select', value: 'aimed', options: [{ value: 'aimed', label: 'aimed (adversarial)' }, { value: 'random', label: 'random' }] },
    { key: 'eps', label: 'Noise strength (per pixel)', type: 'range', min: 0, max: 0.25, step: 0.005, value: 0.1, format: (v) => `± ${Math.round(v * 100)} %` },
    // chapter 1 trains on screen; every later chapter (and links straight to one) finishes training at once
    { key: 'learn', type: 'toggle', value: false, hidden: true },
    { key: 'pic', label: 'New picture', type: 'button', action: (s) => s.newPic() },
    { key: 'toughen', label: 'Toughen it up (adversarial training)', type: 'button', action: (s) => s.toughen() },
    { key: 'retrain', label: 'Train from scratch', type: 'button', action: (s) => s.retrain() },
  ],
  story: [
    {
      title: 'A tiny AI learns shapes',
      text: 'This is a real neural network: 256 inputs (one per pixel), 32 hidden neurons and 4 outputs. Right now it is training in your browser on 1,600 hand-drawn-style shapes, adjusting its 8,000-odd weights to get them right. Watch the accuracy climb, then check its answers on pictures it has never seen.',
      params: { view: 'gallery', learn: true },
      duration: 14,
    },
    {
      title: 'A little random noise',
      text: 'Pick a circle it gets right and sprinkle random noise on it, each pixel changed by up to 10 %. The network shrugs it off: the shape is still clearly a circle, to it and to you.',
      params: { view: 'attack', noise: 'random', eps: 0.1, target: 2, learn: false },
      enter: (s) => s.newPic(0),
      duration: 13,
    },
    {
      title: 'Aimed noise',
      text: 'Now the same amount of noise, but aimed. For each pixel we ask the network which way a tiny nudge would make it more sure it sees a triangle, and nudge that way, a few times over. The picture still looks like a circle; the middle panel shows the change, magnified ten times. The AI now says triangle.',
      params: { view: 'attack', noise: 'aimed', eps: 0.1, target: 2 },
      duration: 15,
    },
    {
      title: 'Why aim matters',
      text: 'Both kinds of noise change each pixel by the same small amount.',
      check: {
        q: 'Why does aimed noise fool the network when random noise of the same size doesn’t?',
        options: ['Every pixel is pushed the way that raises the wrong answer, so 256 tiny pushes add up', 'Aimed noise is much brighter', 'Random noise is filtered out by the camera'],
        answer: 0,
        setup: { view: 'attack', noise: 'random', eps: 0.1, target: 2, learn: false },
        explain: 'Random nudges point every which way and mostly cancel out. Aimed nudges all pull in the same direction in the network’s eyes, so hundreds of invisible changes add up to a big change in its scores.',
      },
      params: { view: 'attack', noise: 'aimed', eps: 0.1, target: 2 },
      duration: 14,
    },
    {
      title: 'Not just a toy',
      text: 'Big image AIs fall for the same trick. In 2014 researchers turned a photo of a panda into a confident “gibbon” with invisible noise. A few black and white stickers made a stop sign read as a speed limit sign, and a 3D-printed turtle was classified as a rifle from almost every angle. That matters for self-driving cars, face recognition and content filters.',
      params: { view: 'attack', noise: 'aimed', eps: 0.12, target: 1 },
      enter: (s) => s.newPic(3),
      duration: 15,
    },
    {
      title: 'Seeing things',
      text: 'Start from a plain grey square and nudge the pixels, over and over, towards “circle”. The network ends up more than 99 % sure, yet the picture looks nothing like a circle to us. It has found the patterns the network really keys on, which are not the ones we use.',
      params: { view: 'dream', target: 0 },
      enter: (s) => s.dream(),
      duration: 14,
    },
    {
      title: 'Toughening it up',
      text: 'One defence is <b>adversarial training</b>: attack the network’s own training pictures and teach it the right answers anyway. Watch the number on the right: how strong the noise has to be before this picture fools it. Afterwards the attack needs more noise, and the noise starts to look like real triangle edges.',
      check: {
        q: 'After adversarial training, what is true?',
        options: ['It takes stronger noise to fool it, but it can still be fooled', 'It can never be fooled again', 'It forgets how to recognise normal shapes'],
        answer: 0,
        setup: { view: 'attack', noise: 'aimed', eps: 0.1, target: 2 },
        explain: 'Training on attacked examples smooths out the tiny shortcuts the attack relied on, so a bigger push is needed. But a determined attacker with enough noise still wins: making AI truly robust is an open research problem.',
      },
      params: { view: 'attack', noise: 'aimed', eps: 0.1, target: 2 },
      enter: (s) => s.toughen(),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Try every target, change the noise strength, compare aimed with random noise, and make fooling images for each class. Train from scratch, then toughen it up.',
      params: { view: 'attack', noise: 'aimed', eps: 0.08, target: 3 },
      enter: (s) => s.newPic(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let rnd = seeded(7);
    let W1, b1, W2, b2, data, test, trainQ = [], accS = new Series(200), trained = 0, toughened = false;
    let pic = null, picK = 0, adv = null, advKey = '', dreamX = null, dreamStep = 0, needed = null;

    // ---------------------------------------------------------------- the network
    function init() {
      rnd = seeded(7);
      data = [];
      for (let i = 0; i < 1600; i++) data.push({ x: drawShape(i % K, rnd), k: i % K });
      test = [];
      for (let i = 0; i < 24; i++) test.push({ x: drawShape(i % K, rnd), k: i % K });
      const r = (n) => (rnd() - 0.5) * 2 * Math.sqrt(6 / n);
      W1 = new Float32Array(HID * D).map(() => r(D + HID));
      b1 = new Float32Array(HID);
      W2 = new Float32Array(K * HID).map(() => r(HID + K));
      b2 = new Float32Array(K);
    }
    function fwd(x) {
      const h = new Float32Array(HID);
      for (let j = 0; j < HID; j++) {
        let s = b1[j];
        const o = j * D;
        for (let i = 0; i < D; i++) s += W1[o + i] * x[i];
        h[j] = s > 0 ? s : 0;
      }
      const z = new Float32Array(K);
      let m = -1e9;
      for (let k = 0; k < K; k++) {
        let s = b2[k];
        for (let j = 0; j < HID; j++) s += W2[k * HID + j] * h[j];
        z[k] = s;
        m = Math.max(m, s);
      }
      let t = 0;
      const p = Array.from(z, (v) => ((t += Math.exp(v - m)), Math.exp(v - m)));
      return { h, p: p.map((v) => v / t) };
    }
    const guess = (p) => p.indexOf(Math.max(...p));
    function sgd(x, k, lr) {
      const { h, p } = fwd(x);
      const dz = p.slice();
      dz[k] -= 1;
      const dh = new Float32Array(HID);
      for (let c = 0; c < K; c++) {
        for (let j = 0; j < HID; j++) {
          dh[j] += W2[c * HID + j] * dz[c];
          W2[c * HID + j] -= lr * dz[c] * h[j];
        }
        b2[c] -= lr * dz[c];
      }
      for (let j = 0; j < HID; j++) {
        if (h[j] <= 0) continue;
        const g = dh[j], o = j * D;
        for (let i = 0; i < D; i++) W1[o + i] -= lr * g * x[i];
        b1[j] -= lr * g;
      }
    }
    /** Gradient of the loss for `target` with respect to the pixels. */
    function gradX(x, target) {
      const { h, p } = fwd(x);
      const dz = p.slice();
      dz[target] -= 1;
      const dh = new Float32Array(HID);
      for (let c = 0; c < K; c++) for (let j = 0; j < HID; j++) dh[j] += W2[c * HID + j] * dz[c];
      const g = new Float32Array(D);
      for (let j = 0; j < HID; j++) {
        if (h[j] <= 0) continue;
        const o = j * D;
        for (let i = 0; i < D; i++) g[i] += W1[o + i] * dh[j];
      }
      return g;
    }
    function attack(x0, target, eps, steps = 12) {
      const x = x0.slice();
      for (let s = 0; s < steps; s++) {
        const g = gradX(x, target);
        for (let i = 0; i < D; i++) x[i] = clamp(clamp(x[i] - (eps / 4) * Math.sign(g[i]), x0[i] - eps, x0[i] + eps), 0, 1);
      }
      return x;
    }
    function randomNoise(x0, eps) {
      const r = seeded(99);
      return x0.map((v) => clamp(v + (r() < 0.5 ? -eps : eps), 0, 1));
    }
    /** The weakest aimed noise that makes this picture read as the target (or null if even 0.25 isn't enough). */
    function noiseNeeded(x0, target) {
      if (guess(fwd(x0).p) === target) return 0;
      let lo = 0, hi = 0.25;
      if (guess(fwd(attack(x0, target, hi)).p) !== target) return null;
      for (let i = 0; i < 7; i++) {
        const m = (lo + hi) / 2;
        if (guess(fwd(attack(x0, target, m)).p) === target) hi = m;
        else lo = m;
      }
      return hi;
    }
    const accuracy = () => test.filter((s) => guess(fwd(s.x).p) === s.k).length / test.length;

    // ---------------------------------------------------------------- actions
    function retrain() {
      init();
      toughened = false;
      trained = 0;
      accS.clear();
      trainQ = [];
      // three passes with a falling learning rate, queued and run a slice per frame so you can watch
      for (const [epochs, lr] of [[6, 0.03], [6, 0.015], [4, 0.006]]) for (let e = 0; e < epochs; e++) for (const s of data) trainQ.push([s, lr, 0]);
      newPic(picK);
    }
    function toughen() {
      if (!W1) retrain();
      if (trainQ.length) finish();
      toughened = true;
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i < 600; i++) trainQ.push([data[i], 0.006, 0.08]);
        for (let i = 600; i < 1200; i++) trainQ.push([data[i], 0.006, 0]);
      }
      advKey = '';
      needed = null;
    }
    function finish() {
      while (trainQ.length) step(trainQ.shift());
    }
    function step([s, lr, eps]) {
      let x = s.x;
      if (eps) x = attack(x, (s.k + 1 + Math.floor(rnd() * 3)) % K, eps, 4);
      sgd(x, s.k, lr);
      trained++;
    }
    function newPic(k) {
      if (!test) init();
      picK = k ?? Math.floor(rnd() * K);
      const r = seeded(1000 + Math.floor(rnd() * 1e6));
      // keep drawing until it is a picture the network currently gets right
      for (let tries = 0; tries < 20; tries++) {
        pic = drawShape(picK, r);
        if (!W1 || trainQ.length || guess(fwd(pic).p) === picK) break;
      }
      advKey = '';
      needed = null;
    }
    function dream() {
      dreamX = new Float32Array(D).map(() => 0.5 + (Math.random() - 0.5) * 0.05);
      dreamStep = 0;
    }

    return {
      retrain,
      toughen,
      newPic,
      dream,
      reset: retrain,
      resize() {
        // opening any chapter: train straight away (well under a second); chapter 1 then retrains on screen
        if (!W1) {
          retrain();
          finish();
          newPic(picK);
        }
      },
      onParam(k, v) {
        if (k === 'target' && params.view === 'dream') dream();
        if (k === 'learn') {
          if (v) retrain();
          else if (trainQ.length) finish(), newPic(picK);
        }
        if (k === 'target' || k === 'eps' || k === 'noise') advKey = '';
        if (k === 'target') needed = null;
      },
      update() {
        if (!W1) return;
        // training: as many examples as fit in a few milliseconds per frame
        const t0 = performance.now();
        while (trainQ.length && performance.now() - t0 < (api.thumbnail ? 1e9 : 9)) step(trainQ.shift());
        if (trainQ.length || api.frame % 20 === 0) {
          if (api.frame % 4 === 0) accS.push(accuracy());
        }
        this.ensureAdv();
        if (params.view === 'dream' && dreamX && dreamStep < 80 && !trainQ.length) {
          const g = gradX(dreamX, +params.target);
          for (let i = 0; i < D; i++) dreamX[i] = clamp(dreamX[i] - 0.01 * Math.sign(g[i]), 0, 1);
          dreamStep++;
        }
      },
      /** Work out the attacked picture when anything it depends on has changed (also while paused). */
      ensureAdv() {
        if (!W1) return;
        if (!pic) newPic(0);
        const key = `${params.noise}|${params.eps}|${params.target}|${trainQ.length === 0}|${toughened}`;
        if (key !== advKey && !trainQ.length) {
          advKey = key;
          adv = params.noise === 'aimed' ? attack(pic, +params.target, params.eps) : randomNoise(pic, params.eps);
          if (needed === null && params.noise === 'aimed') needed = noiseNeeded(pic, +params.target);
        }
      },
      draw() {
        const { w, h } = api;
        if (params.view === 'attack') this.ensureAdv();
        backdrop(ctx, w, h, { center: '#0d1226' });
        if (!W1) return;
        if (params.view === 'gallery') this.gallery(w, h);
        else if (params.view === 'dream') this.drawDream(w, h);
        else this.drawAttack(w, h);
        if (api.thumbnail) return;
        const training = trainQ.length > 0;
        tag(ctx, training ? `training… ${Math.round(accuracy() * 100)} % right so far` : `${toughened ? 'toughened · ' : ''}${Math.round(accuracy() * 100)} % right on new pictures`, w - 16, 84, training ? C.amber : C.teal, { align: 'right', size: 12 });
      },
      img(x, X, Y, S, signed = false) {
        const px = S / N;
        for (let i = 0; i < D; i++) {
          const v = x[i];
          if (signed) {
            const a = clamp(Math.abs(v) * 10, 0, 1);
            ctx.fillStyle = v > 0 ? `rgba(255,95,120,${a})` : `rgba(80,160,255,${a})`;
            ctx.fillRect(X + (i % N) * px, Y + Math.floor(i / N) * px, px + 0.5, px + 0.5);
          } else {
            const g = Math.round(v * 255);
            ctx.fillStyle = `rgb(${g},${g},${g})`;
            ctx.fillRect(X + (i % N) * px, Y + Math.floor(i / N) * px, px + 0.5, px + 0.5);
          }
        }
        ctx.strokeStyle = 'rgba(233,237,247,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(X, Y, S, S);
      },
      bars(p, X, Y, Wd) {
        const g = guess(p);
        for (let k = 0; k < K; k++) {
          const y = Y + k * 22;
          text(ctx, NAMES[k], X, y + 7, { size: 11, color: k === g ? COLS[k] : C.dim, weight: k === g ? 700 : 500, shadow: false });
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(X + 62, y, Wd - 100, 14);
          ctx.fillStyle = COLS[k];
          ctx.fillRect(X + 62, y, (Wd - 100) * p[k], 14);
          text(ctx, `${Math.round(p[k] * 100)}%`, X + Wd - 4, y + 7, { size: 10, align: 'right', color: C.ink, shadow: false, mono: true });
        }
      },
      gallery(w) {
        const wide = w >= 760, cols = wide ? 8 : 4, S = wide ? Math.min(88, (w - 80) / cols - 14) : (w - 40) / cols - 10;
        const x0 = wide ? 40 : 20, y0 = 120;
        test.forEach((s, i) => {
          const X = x0 + (i % cols) * (S + 14), Y = y0 + Math.floor(i / cols) * (S + 30);
          this.img(s.x, X, Y, S);
          const p = fwd(s.x).p, g = guess(p), ok = g === s.k;
          if (!api.thumbnail) text(ctx, `${ok ? '✓' : '✗'} ${NAMES[g]}`, X + S / 2, Y + S + 12, { size: 11, align: 'center', color: ok ? C.teal : C.red, shadow: false });
        });
      },
      drawAttack(w) {
        if (!pic || !adv) return;
        const wide = w >= 760;
        const S = wide ? Math.min(200, (w - 140) / 3) : (w - 48) / 3, gap = wide ? 30 : 8, x0 = wide ? 40 : 16, y0 = 128;
        const p0 = fwd(pic).p, p1 = fwd(adv).p, diff = adv.map((v, i) => v - pic[i]);
        const L = (str, X) => text(ctx, str, X + S / 2, y0 - 14, { size: wide ? 12 : 10, align: 'center', color: C.ink });
        L('original', x0);
        L(wide ? 'the change × 10' : 'change ×10', x0 + S + gap);
        L(params.noise === 'aimed' ? (wide ? 'with aimed noise' : 'aimed') : wide ? 'with random noise' : 'random', x0 + 2 * (S + gap));
        this.img(pic, x0, y0, S);
        this.img(diff, x0 + S + gap, y0, S, true);
        this.img(adv, x0 + 2 * (S + gap), y0, S);
        if (api.thumbnail) return;
        const by = y0 + S + 26;
        if (wide) {
          this.bars(p0, x0, by, S + 10);
          this.bars(p1, x0 + 2 * (S + gap), by, S + 10);
        } else {
          this.bars(p0, 16, by, w / 2 - 20);
          this.bars(p1, w / 2 + 4, by, w / 2 - 20);
        }
        const g1 = guess(p1);
        const fooled = g1 !== picK;
        tag(ctx, fooled ? `fooled: it sees a ${NAMES[g1]}` : `still a ${NAMES[picK]}`, x0 + 2 * (S + gap) + S / 2, y0 + S + 10, fooled ? C.red : C.teal, { align: 'center', size: 11 });
        if (wide && params.noise === 'aimed') {
          const nx = x0 + 3 * (S + gap) - gap + 24;
          if (nx < w - 150) {
            text(ctx, 'noise needed to fool it', nx, y0 + 10, { size: 11, color: C.dim });
            const same = +params.target === picK;
            text(ctx, same ? 'it already is one' : needed === null ? (trainQ.length ? '…' : 'more than ±25 %') : `± ${Math.round(needed * 100)} %`, nx, y0 + 38, { size: same ? 16 : 24, weight: 700, color: C.amber });
            text(ctx, `to make it see a ${NAMES[params.target]}`, nx, y0 + 62, { size: 11, color: C.dim });
          }
        }
      },
      drawDream(w) {
        if (!dreamX) dream();
        const wide = w >= 760, S = wide ? 240 : Math.min(200, w - 60), x0 = wide ? 60 : (w - S) / 2, y0 = 130;
        text(ctx, `grey square, nudged ${dreamStep} times towards “${NAMES[params.target]}”`, x0, y0 - 14, { size: 12, color: C.ink });
        this.img(dreamX, x0, y0, S);
        if (api.thumbnail) return;
        const p = fwd(dreamX).p;
        if (wide) this.bars(p, x0 + S + 40, y0 + 20, 260);
        else this.bars(p, 20, y0 + S + 24, w - 40);
      },
      stats() {
        const p0 = pic ? fwd(pic).p : [0, 0, 0, 0], p1 = adv ? fwd(adv).p : p0;
        return [
          { label: 'Right on new pictures', value: `${Math.round(accuracy() * 100)} %`, color: C.teal },
          { label: 'Original picture', value: `${NAMES[guess(p0)]} (${Math.round(Math.max(...p0) * 100)} %)` },
          { label: 'After the noise', value: `${NAMES[guess(p1)]} (${Math.round(Math.max(...p1) * 100)} %)`, color: guess(p1) !== picK ? C.red : C.ink },
          { label: 'Examples trained on', value: trained.toLocaleString() },
        ];
      },
      charts() {
        return [{ title: 'Accuracy on new pictures', series: [{ data: accS.data, color: C.teal }], min: 0, max: 1, length: 200 }];
      },
    };
  },
};
