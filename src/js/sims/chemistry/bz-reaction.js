import { C, Series, arrow, backdrop, clamp, drawGlow, lerp, rand, roundRect, tag, text, TAU } from '../../core/util.js';

// The Belousov–Zhabotinsky reaction.
// Stirred beaker: the two-variable Oregonator (Tyson–Fife), u = activator HBrO₂, v = oxidised catalyst.
// Unstirred dish: Barkley's excitable-medium model on a grid, the standard cheap stand-in for BZ waves.

const EPS = 0.04, Q = 0.002; // Oregonator
const BA = 0.75, BB = 0.06, BE = 0.02, BDT = 0.01, BH = 0.5; // Barkley: a, b, ε, time step, grid spacing
const RED = [214, 52, 44], BLUE = [47, 107, 255];
const SECONDS_PER_UNIT = 12.5; // model time → real seconds, so one tick is about a minute
const mix = (a, b, t) => `rgb(${a.map((x, i) => Math.round(lerp(x, b[i], t))).join(',')})`;

export default {
  id: 'bz-reaction',
  title: 'The Chemical Clock',
  category: 'chemistry',
  tagline: 'A mixture that flips from red to blue and back on its own, and paints spirals in a dish.',
  ages: ['14-16', '16+'],
  topics: ['Reactions', 'Feedback', 'Patterns'],
  keywords: ['Belousov', 'Zhabotinsky', 'BZ reaction', 'oscillating reaction', 'spiral waves', 'autocatalysis', 'excitable medium'],
  blurb:
    'Most reactions run one way and stop. The Belousov–Zhabotinsky reaction ticks: the whole flask turns blue, then red, then blue again, for an hour. Left unstirred in a dish, it sends out rings and spirals. A loop of chemical feedback, a product that speeds itself up and another that shuts it down, is all it takes.',
  ideas: [
    'An <b>autocatalytic</b> step makes more of the activator the more of it there is, so it switches on suddenly.',
    'The switched-on state makes an <b>inhibitor</b> that shuts the activator down again: a feedback loop that ticks.',
    'Unstirred, each patch triggers its neighbours, so the colour change travels as a <b>wave</b>.',
    'Behind every wave is a recovering zone that can’t fire, so waves <b>cancel</b> when they meet and broken waves curl into <b>spirals</b>.',
    'It only ticks while it has fuel: the reaction is always running downhill, just not in a straight line.',
  ],
  hint: 'In the dish, click or drag to start waves',
  thumbChapter: 5,
  thumbFrames: 420,
  params: [
    { key: 'scene', label: 'View', type: 'select', value: 'beaker', options: [{ value: 'beaker', label: 'Stirred beaker' }, { value: 'dish', label: 'Unstirred dish' }] },
    { key: 'fuel', label: 'Fuel left (bromate & malonic acid)', type: 'range', min: 0, max: 1, step: 0.01, value: 1, format: (v) => (v * 100).toFixed(0) + ' %' },
    { key: 'drain', label: 'Let the fuel run down', type: 'toggle', value: false },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.3, max: 3, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'pace', label: 'Pacemaker spots in the dish', type: 'toggle', value: true },
    { key: 'cut', label: 'Break the waves', type: 'button', action: (s) => s.cut() },
    { key: 'clear', label: 'Reset the dish', type: 'button', action: (s) => s.clearDish() },
  ],
  story: [
    {
      title: 'A clock in a beaker',
      text: 'In 1951 Boris Belousov mixed a few chemicals and watched the flask turn blue, then red, then blue again, every minute or so for an hour. Journals rejected his paper: a reaction, they said, cannot run backwards and forwards on its own. It took Anatol Zhabotinsky in the 1960s to convince the world.',
      formula: 'bromate + malonic acid  →  CO₂ + bromine compounds   (iron catalyst: red ⇄ blue)',
      params: { scene: 'beaker', fuel: 1, drain: false, speed: 1 },
      enter: (s) => s.resetBeaker(),
      duration: 14,
    },
    {
      title: 'A feedback loop',
      text: 'The secret is an <b>activator</b>, HBrO₂, that makes more of itself: the more there is, the faster it grows, so it switches on all at once and turns the catalyst blue. But the blue catalyst produces bromide, an <b>inhibitor</b> that destroys the activator. The flask turns red, the bromide is used up, and the cycle starts again. Watch the two curves in the chart.',
      formula: 'BrO₃⁻ + HBrO₂ → 2 HBrO₂  (the activator copies itself)',
      params: { scene: 'beaker', fuel: 1, drain: false },
      duration: 16,
    },
    {
      title: 'Why does it turn back?',
      text: 'Each flip to blue sows the seeds of its own end. Press on to see the answer, then follow the loop round once more.',
      check: {
        q: 'The flask has just turned blue. What turns it back to red?',
        options: ['An inhibitor that the blue phase itself produces', 'The colour simply wears off', 'The flask cools down'],
        answer: 0,
        setup: { scene: 'beaker', fuel: 1, drain: false },
        explain: 'The blue (oxidised) catalyst makes bromide, which mops up the activator. With no activator, the catalyst relaxes back to red. Activation followed by delayed inhibition is the recipe for every chemical, electrical or biological clock.',
      },
      params: { scene: 'beaker', fuel: 1, drain: false },
      duration: 12,
    },
    {
      title: 'Leave it unstirred',
      text: 'Pour the same mixture into a thin dish and don’t stir. A dust speck or bubble flips first, and each patch that turns blue sets off its neighbours. Rings of blue spread out like ripples, a few millimetres a minute, and keep coming like a target.',
      params: { scene: 'dish', pace: true, speed: 1 },
      enter: (s) => s.clearDish(),
      duration: 15,
    },
    {
      title: 'Waves that cancel',
      text: 'Ripples on a pond pass through each other. These waves can’t: behind each blue front is a band that has just fired and needs time to recover. When two waves meet, each runs into the other’s exhausted wake and both vanish.',
      check: {
        q: 'Two chemical waves meet head-on. What happens?',
        options: ['They pass through each other', 'They cancel out', 'They bounce back'],
        answer: 1,
        setup: { scene: 'dish', pace: true },
        explain: 'Each wave can only advance into fresh, rested mixture. Where they meet there is only recovering mixture ahead of both, so both fronts stop. Nerve impulses and heart waves behave exactly the same way.',
      },
      params: { scene: 'dish', pace: true },
      duration: 15,
    },
    {
      title: 'Break a wave, get a spiral',
      text: 'Now we wipe out half of every ring, as if by tilting the dish. Each broken end can’t stop and can’t catch up with the rest, so it curls round its own recovering wake and becomes a <b>spiral</b> that turns for as long as the fuel lasts.',
      params: { scene: 'dish', pace: false },
      enter: (s) => s.brokenWave(),
      duration: 18,
    },
    {
      title: 'Running down',
      text: 'Back in the beaker, the fuel is being used up. The ticks come further apart, and then stop for good. The clock never breaks the laws of thermodynamics: every step runs downhill in energy. It just takes a winding path, and only while it is far from equilibrium.',
      params: { scene: 'beaker', fuel: 1, drain: true, speed: 2 },
      enter: (s) => s.resetBeaker(),
      duration: 18,
    },
    {
      title: 'The same pattern in your heart',
      text: 'Heart muscle is an excitable medium too: each beat is a wave of contraction. If a wave breaks, a spiral can form and spin far faster than the normal beat, making the heart quiver uselessly: fibrillation. A defibrillator shocks every cell at once, wiping out the spirals so a normal beat can restart. Slime moulds and brain tissue make the same spirals.',
      params: { scene: 'dish', pace: false, speed: 1 },
      enter: (s) => s.spirals(),
      duration: 18,
    },
    {
      title: 'Explore',
      text: 'Click or drag in the dish to start waves, break them into spirals, or switch on the pacemakers. In the beaker, change the fuel and watch the rhythm change.',
      params: { scene: 'dish', pace: true, drain: false, fuel: 1 },
      enter: (s) => s.clearDish(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    // ---------------------------------------------------------------- beaker (well mixed)
    let u = 0.01, v = 0.1, bt = 0, cycles = 0, lastUp = -1, period = 0, prevU = u;
    const sU = new Series(420), sV = new Series(420), tape = [];
    const fOf = () => 1 + (1 - params.fuel) * 1.6; // the stoichiometric factor rises as the fuel runs out; ticking stops near 2.25
    function resetBeaker() {
      u = 0.01;
      v = 0.1;
      bt = 0;
      cycles = 0;
      lastUp = -1;
      period = 0;
      sU.clear();
      sV.clear();
      tape.length = 0;
    }
    function stepBeaker(T) {
      const f = fOf(), dt = 0.0005;
      for (let t = 0; t < T; t += dt) {
        const du = (u - u * u - (f * v * (u - Q)) / (u + Q)) / EPS;
        u = Math.max(Q * 0.5, u + du * dt);
        v += (u - v) * dt;
        bt += dt;
        if (u > 0.3 && prevU <= 0.3) {
          if (lastUp >= 0) period = bt - lastUp;
          lastUp = bt;
          cycles++;
        }
        prevU = u;
      }
    }
    const blueness = () => clamp((v - 0.01) / 0.2, 0, 1);

    // ---------------------------------------------------------------- dish (excitable medium)
    let W = 0, H = 0, U, V, U2, off, octx, img, pace = [];
    function alloc() {
      W = api.thumbnail ? 130 : 200;
      H = Math.max(40, Math.round((W * api.h) / Math.max(1, api.w)));
      U = new Float32Array(W * H);
      V = new Float32Array(W * H);
      U2 = new Float32Array(W * H);
      off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      octx = off.getContext('2d');
      img = octx.createImageData(W, H);
      placePacemakers();
    }
    function placePacemakers() {
      // three spots that fire on their own, at slightly different rhythms, spread across the dish
      pace = [
        { x: 0.22, y: 0.3, every: 9, t: 0.5 },
        { x: 0.72, y: 0.62, every: 11, t: 3 },
        { x: 0.46, y: 0.85, every: 13, t: 6 },
      ].map((p) => ({ ...p, x: Math.round(p.x * W), y: Math.round(p.y * H) }));
    }
    function excite(cx, cy, r = 3) {
      for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y > r * r) continue;
          const X = cx + x, Y = cy + y;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const i = Y * W + X;
          if (V[i] < 0.25) U[i] = 1;
        }
    }
    function clearDish() {
      if (!W) alloc();
      U.fill(0);
      V.fill(0);
      for (const p of pace) p.t = p.every * 0.3 + rand(0, 1);
      pace[0].t = 0.3;
    }
    function cut() {
      if (!W) alloc();
      // wipe the top half: every ring loses an arc, and the cut ends curl into spirals
      for (let i = 0; i < (W * H) >> 1; i++) (U[i] = 0), (V[i] = 0);
    }
    function brokenWave() {
      clearDish();
      // a straight wave front that ends halfway across the dish, with its recovering wake behind it
      const x0 = Math.round(W * 0.35);
      for (let y = 0; y < (H >> 1) + 2; y++)
        for (let x = x0 - 18; x < x0; x++) {
          const i = y * W + x;
          if (x >= x0 - 5) U[i] = 1;
          else V[i] = 0.55 * ((x - (x0 - 18)) / 13);
        }
    }
    function spirals() {
      clearDish();
      // several broken fronts in different places and directions
      const seeds = [
        [0.25, 0.35, 1], [0.7, 0.3, -1], [0.55, 0.75, 1],
      ];
      for (const [fx, fy, dir] of seeds) {
        const cx = Math.round(fx * W), cy = Math.round(fy * H);
        for (let y = cy; y < Math.min(H, cy + Math.round(H * 0.22)); y++)
          for (let k = 0; k < 16; k++) {
            const x = cx + dir * k;
            if (x < 0 || x >= W) continue;
            const i = y * W + x;
            if (k < 4) U[i] = 1;
            else V[i] = 0.55 * (1 - (k - 4) / 12);
          }
      }
    }
    function stepDish() {
      const D = BDT / (BH * BH), r = BDT / BE;
      for (let y = 0; y < H; y++) {
        const yu = (y ? y - 1 : 1) * W, yc = y * W, yd = (y < H - 1 ? y + 1 : H - 2) * W;
        for (let x = 0; x < W; x++) {
          const i = yc + x, uc = U[i];
          const l = U[yc + (x ? x - 1 : 1)] + U[yc + (x < W - 1 ? x + 1 : W - 2)] + U[yu + x] + U[yd + x] - 4 * uc;
          const th = (V[i] + BB) / BA;
          const nu = uc + r * uc * (1 - uc) * (uc - th) + D * l;
          U2[i] = nu < 0 ? 0 : nu > 1 ? 1 : nu;
          V[i] += BDT * (uc - V[i]);
        }
      }
      const t = U;
      U = U2;
      U2 = t;
    }
    // reduced iron catalyst is orange-red, oxidised is blue; the recovering wake fades from pale blue back to red
    const lut = new Uint8ClampedArray(64 * 64 * 3);
    for (let a = 0; a < 64; a++)
      for (let b = 0; b < 64; b++) {
        const front = a / 63, wake = clamp((b / 63) * 1.6, 0, 1);
        const k = Math.max(front, wake * 0.75);
        const base = [196, 64, 34], blue = [40, 96, 235], pale = [150, 190, 255];
        const j = (a * 64 + b) * 3;
        for (let c = 0; c < 3; c++) lut[j + c] = lerp(lerp(base[c], blue[c], k), pale[c], front * 0.5);
      }

    // ---------------------------------------------------------------- shared
    const bubbles = Array.from({ length: 26 }, () => ({ x: rand(-1, 1), y: rand(0, 1), s: rand(1, 2.6), v: rand(0.06, 0.16) }));
    let stirA = 0;
    const narrow = () => api.w < 760;

    return {
      resetBeaker,
      clearDish,
      cut,
      brokenWave,
      spirals,
      resize() {
        const nh = Math.max(40, Math.round(((api.thumbnail ? 130 : 200) * api.h) / Math.max(1, api.w)));
        if (W && Math.abs(nh - H) <= 3) return;
        alloc();
        clearDish();
      },
      reset() {
        resetBeaker();
        clearDish();
      },
      pointerDown(p) {
        if (params.scene === 'dish' && W) excite(Math.floor((p.x / api.w) * W), Math.floor((p.y / api.h) * H));
      },
      pointerMove(p) {
        if (p.down && params.scene === 'dish' && W) excite(Math.floor((p.x / api.w) * W), Math.floor((p.y / api.h) * H), 2);
      },
      update(dt) {
        dt = Math.min(dt, 0.05);
        const sp = params.speed;
        if (params.drain && params.fuel > 0) api.runner.set('fuel', Math.max(0, params.fuel - dt * 0.045 * sp));
        // the beaker always runs, so switching views keeps its rhythm
        stepBeaker(dt * 1.2 * sp);
        stirA += dt * 6;
        for (const b of bubbles) {
          b.y -= b.v * dt * (0.5 + params.fuel);
          if (b.y < 0) (b.y = 1), (b.x = rand(-1, 1));
        }
        if (api.frame % 3 === 0) {
          sU.push(clamp((Math.log10(u) + 3) / 3, 0, 1));
          sV.push(blueness());
          tape.push(blueness());
          if (tape.length > 300) tape.shift();
        }
        if (params.scene === 'dish' && W) {
          const steps = Math.round(12 * sp), t0 = performance.now();
          for (let s = 0; s < steps; s++) {
            if (params.pace && params.fuel > 0.2)
              for (const p of pace) {
                p.t -= BDT;
                if (p.t <= 0) {
                  p.t = p.every;
                  excite(p.x, p.y, 2);
                }
              }
            stepDish();
            if (!api.thumbnail && performance.now() - t0 > 7) break;
          }
          // without fuel the dish slowly goes quiet
          if (params.fuel < 0.2) for (let i = 0; i < U.length; i++) U[i] *= 0.9;
        }
      },
      draw() {
        const { w, h } = api;
        if (params.scene === 'dish') this.drawDish(w, h);
        else this.drawBeaker(w, h);
      },
      drawDish(w, h) {
        if (!W) return;
        const d = img.data;
        for (let i = 0, j = 0; i < W * H; i++, j += 4) {
          const k = ((Math.min(63, (U[i] * 63) | 0) * 64 + Math.min(63, (V[i] * 63) | 0)) * 3);
          d[j] = lut[k];
          d[j + 1] = lut[k + 1];
          d[j + 2] = lut[k + 2];
          d[j + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(off, 0, 0, w, h);
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        if (api.thumbnail) return;
        if (params.pace && params.fuel > 0.2)
          for (const p of pace) {
            const x = ((p.x + 0.5) / W) * w, y = ((p.y + 0.5) / H) * h;
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, TAU);
            ctx.stroke();
          }
        if (params.pace && params.fuel > 0.2 && !narrow()) {
          const p = pace[0];
          tag(ctx, 'pacemaker', ((p.x + 0.5) / W) * w, ((p.y + 0.5) / H) * h - 20, C.ink, { align: 'center', size: 10 });
        }
        tag(ctx, `unstirred dish · ${params.fuel > 0.2 ? 'blue = just fired, pale = recovering' : 'out of fuel'}`, w - 16, 84, C.ink, { align: 'right', size: 11 });
      },
      drawBeaker(w, h) {
        backdrop(ctx, w, h, { center: '#0d1226' });
        const wide = !narrow();
        const cx = wide ? w * 0.4 : w * 0.5;
        const top = 150, bot = wide ? Math.min(h - 110, h * 0.7) : h * 0.6;
        const bw = Math.min(wide ? 300 : w * 0.62, (bot - top) * 0.9);
        const k = blueness();
        const col = mix(RED, BLUE, k);
        // liquid
        const lt = top + (bot - top) * 0.22;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - bw / 2 + 6, lt);
        ctx.lineTo(cx + bw / 2 - 6, lt);
        ctx.lineTo(cx + bw / 2 - 6, bot - 18);
        ctx.quadraticCurveTo(cx + bw / 2 - 6, bot - 4, cx + bw / 2 - 20, bot - 4);
        ctx.lineTo(cx - bw / 2 + 20, bot - 4);
        ctx.quadraticCurveTo(cx - bw / 2 + 6, bot - 4, cx - bw / 2 + 6, bot - 18);
        ctx.closePath();
        const lg = ctx.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
        lg.addColorStop(0, col);
        lg.addColorStop(0.5, mix(RED.map((x) => x + 30), BLUE.map((x) => x + 40), k));
        lg.addColorStop(1, col);
        ctx.fillStyle = lg;
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.clip();
        // swirl from the stirrer, and rising CO₂ bubbles
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let r = 1; r <= 3; r++) {
          ctx.beginPath();
          ctx.ellipse(cx, bot - 30 - r * 22, (bw / 2) * (0.25 + r * 0.18), 7 + r * 2, 0, stirA * (r % 2 ? 1 : -1) * 0.2, stirA * (r % 2 ? 1 : -1) * 0.2 + 2.2);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ffffff';
        for (const b of bubbles) {
          ctx.beginPath();
          ctx.arc(cx + b.x * (bw / 2 - 16), lt + b.y * (bot - lt - 10), b.s, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        // glass
        ctx.strokeStyle = 'rgba(210,225,255,0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - bw / 2 - 8, top);
        ctx.lineTo(cx - bw / 2, top + 8);
        ctx.lineTo(cx - bw / 2, bot - 16);
        ctx.quadraticCurveTo(cx - bw / 2, bot, cx - bw / 2 + 16, bot);
        ctx.lineTo(cx + bw / 2 - 16, bot);
        ctx.quadraticCurveTo(cx + bw / 2, bot, cx + bw / 2, bot - 16);
        ctx.lineTo(cx + bw / 2, top);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx - bw / 2 + 16, top + 30);
        ctx.lineTo(cx - bw / 2 + 16, bot - 30);
        ctx.stroke();
        // stirrer bar
        ctx.save();
        ctx.translate(cx, bot - 12);
        ctx.scale(1, 0.3);
        ctx.rotate(stirA);
        ctx.fillStyle = '#e8ecf5';
        roundRect(ctx, -22, -5, 44, 10, 5);
        ctx.fill();
        ctx.restore();
        if (api.thumbnail) return;
        tag(ctx, k > 0.5 ? 'blue: catalyst oxidised' : 'red: catalyst reduced', cx, top - 22, k > 0.5 ? '#8fb3ff' : '#ff9b8f', { align: 'center', size: 12 });
        // a tape of the colour over time
        // a tape of the colour over time: beside the beaker on wide screens (clear of the story card), below it on phones
        const lx = cx + bw / 2 + 40, lw = Math.min(250, w - lx - 16);
        const tx = wide ? lx : 16, tw = wide ? lw : w - 32, ty = wide ? top + 290 : bot + 26;
        if ((wide && lw >= 180) || (!wide && h > 600)) {
          text(ctx, 'colour over time  →  now', tx, ty - 10, { size: 10, color: C.dim });
          const n = tape.length;
          for (let i = 0; i < n; i++) {
            ctx.fillStyle = mix(RED, BLUE, tape[i]);
            ctx.fillRect(tx + (i / 300) * tw, ty, tw / 300 + 0.6, 14);
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(tx, ty, tw, 14);
        }
        if (wide) this.drawLoop(lx, top - 10, lw);
      },
      drawLoop(x0, y0, bw) {
        // the feedback loop, lit up by the current state
        if (bw < 180) return;
        const act = clamp((Math.log10(u) + 3) / 3, 0, 1), k = blueness();
        const bh = 230;
        ctx.fillStyle = 'rgba(8,11,22,0.8)';
        ctx.strokeStyle = 'rgba(160,175,230,0.2)';
        roundRect(ctx, x0, y0, bw, bh, 12);
        ctx.fill();
        ctx.stroke();
        text(ctx, 'The feedback loop', x0 + 12, y0 + 16, { size: 11, color: C.dim, shadow: false });
        const nodes = [
          { x: x0 + bw / 2, y: y0 + 72, label: 'activator HBrO₂', c: '#ffb547', on: act, up: true },
          { x: x0 + bw - 56, y: y0 + 160, label: 'catalyst → blue', c: '#5b8cff', on: k },
          { x: x0 + 56, y: y0 + 160, label: 'inhibitor Br⁻', c: '#ff5fa2', on: k * 0.8 },
        ];
        const gx = (nodes[0].x + nodes[1].x + nodes[2].x) / 3, gy = (nodes[0].y + nodes[1].y + nodes[2].y) / 3;
        const link = (a, b, label, neg) => {
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
          arrow(ctx, a.x + ux * 14, a.y + uy * 14, b.x - ux * 15, b.y - uy * 15, neg ? 'rgba(255,95,162,0.8)' : 'rgba(233,237,247,0.5)', 2, 8);
          // label just outside the triangle, beside the middle of the arrow
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, ox = mx - gx, oy = my - gy, o = Math.hypot(ox, oy) || 1;
          text(ctx, label, mx + (ox / o) * 16, my + (oy / o) * 12, { size: 10, align: 'center', color: neg ? '#ff9cc5' : C.dim, shadow: false });
        };
        link(nodes[0], nodes[1], 'oxidises', false);
        link(nodes[1], nodes[2], 'makes', false);
        link(nodes[2], nodes[0], 'destroys', true);
        // self-loop on the activator
        ctx.strokeStyle = 'rgba(255,181,71,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(nodes[0].x + 22, nodes[0].y, 11, -2.6, 2.6);
        ctx.stroke();
        text(ctx, 'copies itself', nodes[0].x + 38, nodes[0].y, { size: 10, color: '#ffd08a', shadow: false });
        ctx.globalCompositeOperation = 'lighter';
        for (const n of nodes) drawGlow(ctx, n.x, n.y, 10 + n.on * 34, n.c, 0.25);
        ctx.globalCompositeOperation = 'source-over';
        for (const n of nodes) {
          ctx.fillStyle = n.c;
          ctx.globalAlpha = 0.35 + n.on * 0.65;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 9, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = 1;
          text(ctx, n.label, n.x, n.y + (n.up ? -22 : 22), { size: 10, align: 'center', color: C.ink, shadow: false });
        }
      },
      stats() {
        const k = blueness();
        const per = period > 0 ? ((period * SECONDS_PER_UNIT) / 60).toFixed(1) + ' min' : '—';
        const ticking = period > 0 && bt - lastUp < period * 2.5;
        return [
          { label: 'Beaker colour', value: k > 0.5 ? 'blue' : 'red', color: k > 0.5 ? '#8fb3ff' : '#ff8a7a' },
          { label: 'Ticks so far', value: String(cycles) },
          { label: 'Time between ticks', value: ticking ? per : params.fuel < 0.25 ? 'stopped' : per },
          { label: 'Fuel left', value: (params.fuel * 100).toFixed(0) + ' %', color: params.fuel < 0.25 ? C.red : C.teal },
        ];
      },
      charts() {
        return [
          {
            title: 'Beaker: activator (log) and blue catalyst',
            series: [
              { data: sU.data, color: '#ffb547', label: 'HBrO₂', fill: false },
              { data: sV.data, color: '#5b8cff', label: 'blue', fill: false },
            ],
            min: 0,
            max: 1,
            length: 420,
          },
        ];
      },
    };
  },
};
