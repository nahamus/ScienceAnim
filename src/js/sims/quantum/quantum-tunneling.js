import { C, TAU, clamp, backdrop, tag, text, Series } from '../../core/util.js';

const N = 1024, L = 200, DX = L / N, DT = 0.05, RATE = 260; // steps per second
const X0 = 40, SIG = 6, MID = 100, EDGE = 18;

// --- radix-2 FFT (in place)
const bitrev = new Uint32Array(N);
for (let i = 0, bits = Math.log2(N); i < N; i++) {
  let r = 0;
  for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
  bitrev[i] = r;
}
const twr = new Float64Array(N / 2), twi = new Float64Array(N / 2);
for (let i = 0; i < N / 2; i++) (twr[i] = Math.cos((-TAU * i) / N)), (twi[i] = Math.sin((-TAU * i) / N));
function fft(re, im, inverse) {
  for (let i = 0; i < N; i++) {
    const j = bitrev[i];
    if (j > i) {
      let t = re[i];
      re[i] = re[j];
      re[j] = t;
      t = im[i];
      im[i] = im[j];
      im[j] = t;
    }
  }
  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1, step = N / size;
    for (let i = 0; i < N; i += size)
      for (let j = 0; j < half; j++) {
        const wr = twr[j * step], wi = inverse ? -twi[j * step] : twi[j * step];
        const a = i + j, b = a + half;
        const xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
      }
  }
  if (inverse) for (let i = 0; i < N; i++) (re[i] /= N), (im[i] /= N);
}

export default {
  id: 'quantum-tunneling',
  title: 'Quantum Tunnelling',
  category: 'quantum',
  tagline: 'A particle walks through a wall it can’t climb. Quantum mechanics says it can.',
  ages: ['16+'],
  topics: ['Quantum'],
  blurb:
    'In the quantum world a particle is a spread-out wave of possibility. When that wave meets a barrier it does not simply bounce: part of it leaks through to the other side. This “tunnelling” powers the Sun, lets flash memory store your photos, and lets microscopes see single atoms.',
  ideas: [
    'A particle is described by a <b>wave function</b>; its brightness here is the chance of finding it there.',
    'Facing a barrier higher than its energy, a classical ball always bounces. A quantum wave partly <b>tunnels through</b>.',
    'The chance of tunnelling falls off <b>exponentially</b> with barrier width and height.',
    'Strangely, even a wave with enough energy to pass over can be partly <b>reflected</b>.',
  ],
  hint: 'Click to fire a new particle',
  thumbChapter: 2,
  thumbFrames: 260,
  params: [
    { key: 'scene', label: 'Potential', type: 'select', value: 'barrier', options: [{ value: 'barrier', label: 'Barrier' }, { value: 'double', label: 'Double barrier' }, { value: 'trap', label: 'Harmonic trap' }], instant: true },
    { key: 'V', label: 'Barrier height (× energy)', type: 'range', min: 0, max: 2.5, step: 0.01, value: 1.5, format: (v) => v.toFixed(2) + ' × E' },
    { key: 'width', label: 'Barrier width', type: 'range', min: 0.4, max: 8, step: 0.1, value: 2, format: (v) => v.toFixed(1) + ' nm' },
    { key: 'k', label: 'Particle momentum', type: 'range', min: 1, max: 3, step: 0.05, value: 1.6, instant: true },
    { key: 'phase', label: 'Colour by phase', type: 'toggle', value: true },
    { key: 'fire', label: 'Fire particle', type: 'button', action: (s) => s.launch() },
  ],
  story: [
    {
      title: 'A particle is a wave',
      text: 'An electron flies to the right. Quantum mechanics describes it not as a dot but as a <b>wave packet</b>. The height of the glow is the probability of finding it there; the rainbow colours are the wave’s phase, rippling as it moves. Notice it slowly spreads out.',
      params: { scene: 'barrier', V: 0, width: 2, k: 1.6, phase: true },
      enter: (s) => s.launch(),
      duration: 11,
    },
    {
      title: 'A wall too high to climb',
      text: 'Put up a thick barrier taller than the particle’s energy (the dashed line). A classical ball (orange) just bounces back. The quantum wave bounces too — rippling as the returning wave interferes with the incoming one.',
      params: { scene: 'barrier', V: 1.5, width: 7, k: 1.6 },
      enter: (s) => s.launch(),
      duration: 13,
    },
    {
      title: 'Walking through walls',
      text: 'Make the wall thin. The ball still bounces — but a slice of the wave <b>appears on the other side</b>. The particle has a real chance of being detected beyond a barrier it never had the energy to cross.',
      params: { scene: 'barrier', V: 1.5, width: 1.6, k: 1.6 },
      enter: (s) => s.launch(),
      duration: 14,
    },
    {
      title: 'Exponentially sensitive',
      text: 'Tunnelling drops off exponentially with thickness. Double the width and the chance falls by far more than half. The Sun relies on this: protons tunnel through their electric repulsion to fuse, and the rate sets how brightly it shines.',
      formula: 'T ≈ e^{−2κa},    κ = √(2m(V−E)) / ħ',
      params: { scene: 'barrier', V: 1.5, width: 3, k: 1.6 },
      enter: (s) => s.launch(),
      duration: 14,
    },
    {
      title: 'Bouncing off a low wall',
      text: 'Now the barrier is lower than the particle’s energy. A ball would sail over every time. The wave mostly passes, yet some of it still <b>reflects</b> — another thing with no classical explanation.',
      params: { scene: 'barrier', V: 0.6, width: 4, k: 1.6 },
      enter: (s) => s.launch(),
      duration: 13,
    },
    {
      title: 'A quantum pendulum',
      text: 'In a smooth bowl-shaped potential, a packet of just the right width sloshes back and forth forever without spreading — the quantum version of a pendulum. Atoms in molecules vibrate like this.',
      params: { scene: 'trap' },
      enter: (s) => s.launch(),
      duration: 14,
    },
    {
      title: 'Explore',
      text: 'Choose a barrier, adjust its height and width, and fire particles. Try a double barrier: at certain energies the particle tunnels through both almost perfectly — resonant tunnelling, used in ultra-fast diodes.',
      params: { scene: 'barrier', V: 1.3, width: 1.4, k: 1.6 },
      enter: (s) => s.launch(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const re = new Float64Array(N), im = new Float64Array(N), V = new Float64Array(N);
    const kc = new Float64Array(N), ks = new Float64Array(N), vc = new Float64Array(N), vs = new Float64Array(N), mask = new Float64Array(N);
    let acc = 0, absL = 0, absR = 0, ball = { x: X0, v: 0 }, potKey = '', E = 1, peak = 0.066;
    const sT = new Series(240), sR = new Series(240);

    for (let j = 0; j < N; j++) {
      const k = (TAU / L) * (j < N / 2 ? j : j - N);
      kc[j] = Math.cos((-k * k * DT) / 2);
      ks[j] = Math.sin((-k * k * DT) / 2);
    }
    for (let i = 0; i < N; i++) {
      const x = i * DX;
      const d = Math.max(0, EDGE - Math.min(x, L - x)) / EDGE;
      mask[i] = Math.exp(-3 * d * d * DT);
    }

    const trap = () => params.scene === 'trap';
    const OMEGA = 0.05;

    function buildPotential() {
      const key = `${params.scene}|${params.V.toFixed(3)}|${params.width.toFixed(2)}|${E.toFixed(3)}`;
      if (key === potKey) return;
      potKey = key;
      const V0 = params.V * E, a = params.width;
      for (let i = 0; i < N; i++) {
        const x = i * DX;
        let v = 0;
        if (params.scene === 'barrier') v = Math.abs(x - MID) < a / 2 ? V0 : 0;
        else if (params.scene === 'double') v = Math.abs(x - (MID - 5 - a / 2)) < a / 2 || Math.abs(x - (MID + 5 + a / 2)) < a / 2 ? V0 : 0;
        else v = 0.5 * OMEGA * OMEGA * (x - MID) ** 2;
        V[i] = v;
        vc[i] = Math.cos((-v * DT) / 2);
        vs[i] = Math.sin((-v * DT) / 2);
      }
    }

    function launch() {
      const k0 = trap() ? 0 : params.k;
      const x0 = trap() ? MID - 40 : X0;
      const sig = trap() ? Math.sqrt(1 / (2 * OMEGA)) : SIG;
      let norm = 0;
      for (let i = 0; i < N; i++) {
        const x = i * DX;
        const g = Math.exp(-((x - x0) ** 2) / (4 * sig * sig));
        re[i] = g * Math.cos(k0 * x);
        im[i] = g * Math.sin(k0 * x);
        norm += g * g * DX;
      }
      const s = 1 / Math.sqrt(norm);
      for (let i = 0; i < N; i++) (re[i] *= s), (im[i] *= s);
      peak = 1 / (sig * Math.sqrt(TAU));
      E = trap() ? 0.5 * OMEGA * OMEGA * 1600 : (params.k * params.k) / 2;
      potKey = '';
      buildPotential();
      absL = absR = 0;
      ball = { x: x0, v: k0 };
      sT.clear();
      sR.clear();
    }

    function step() {
      for (let i = 0; i < N; i++) {
        const r = re[i], m = im[i];
        re[i] = r * vc[i] - m * vs[i];
        im[i] = r * vs[i] + m * vc[i];
      }
      fft(re, im, false);
      for (let j = 0; j < N; j++) {
        const r = re[j], m = im[j];
        re[j] = r * kc[j] - m * ks[j];
        im[j] = r * ks[j] + m * kc[j];
      }
      fft(re, im, true);
      for (let i = 0; i < N; i++) {
        const r = re[i], m = im[i];
        let nr = r * vc[i] - m * vs[i], ni = r * vs[i] + m * vc[i];
        if (!trap() && mask[i] < 1) {
          const lost = (nr * nr + ni * ni) * (1 - mask[i] * mask[i]) * DX;
          if (i < N / 2) absL += lost;
          else absR += lost;
          nr *= mask[i];
          ni *= mask[i];
        }
        re[i] = nr;
        im[i] = ni;
      }
      // classical comparison ball
      if (trap()) {
        ball.v += -OMEGA * OMEGA * (ball.x - MID) * DT;
        ball.x += ball.v * DT;
      } else {
        const nx = ball.x + ball.v * DT;
        const i = clamp(Math.round(nx / DX), 0, N - 1);
        if (V[i] > E) ball.v = -ball.v;
        else ball.x = nx;
      }
    }

    function sides() {
      const lo = params.scene === 'double' ? MID - 10 - params.width : MID - params.width / 2;
      const hi = params.scene === 'double' ? MID + 10 + params.width : MID + params.width / 2;
      let l = absL, r = absR;
      for (let i = 0; i < N; i++) {
        const p = (re[i] * re[i] + im[i] * im[i]) * DX;
        const x = i * DX;
        if (x < lo) l += p;
        else if (x > hi) r += p;
      }
      return { l, r };
    }

    launch();

    return {
      launch,
      reset: launch,
      onParam(k) {
        if (k === 'scene' || k === 'k') launch();
      },
      pointerDown() {
        launch();
      },
      update(dt) {
        buildPotential();
        acc += dt * RATE;
        let n = 0;
        while (acc >= 1 && n < 40) {
          step();
          acc -= 1;
          n++;
        }
        if (api.frame % 3 === 0 && !trap()) {
          const s = sides();
          sT.push(s.r);
          sR.push(s.l);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0a0c1e', grid: false });
        const m = Math.max(20, w * 0.03);
        const xl = m, xr = w - m;
        const base = Math.max(260, h * 0.62);
        const X = (x) => xl + (x / L) * (xr - xl);
        const amp = (h * 0.34) / peak;
        const eScale = (h * 0.2) / E;

        // potential
        ctx.fillStyle = 'rgba(167,139,250,0.16)';
        ctx.strokeStyle = 'rgba(167,139,250,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xl, base);
        for (let i = 0; i < N; i += 1) ctx.lineTo(X(i * DX), Math.max(60, base - V[i] * eScale));
        ctx.lineTo(xr, base);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // energy line
        const yE = base - E * eScale;
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(255,181,71,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xl, yE);
        ctx.lineTo(xr, yE);
        ctx.stroke();
        ctx.setLineDash([]);
        if (!api.thumbnail) text(ctx, 'particle energy', xr - 4, yE - 9, { size: 10, align: 'right', color: 'rgba(255,181,71,0.75)' });

        // probability density, coloured by phase
        const cols = Math.floor(xr - xl);
        ctx.globalCompositeOperation = 'lighter';
        for (let c = 0; c < cols; c += 2) {
          const i = Math.floor((c / cols) * N);
          const p = re[i] * re[i] + im[i] * im[i];
          const hgt = p * amp;
          if (hgt < 0.5) continue;
          const hue = params.phase ? ((Math.atan2(im[i], re[i]) / TAU) * 360 + 360) % 360 : 190;
          ctx.fillStyle = `hsla(${hue},90%,60%,0.55)`;
          ctx.fillRect(xl + c, base - hgt, 2, hgt);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let c = 0; c <= cols; c += 2) {
          const i = Math.min(N - 1, Math.floor((c / cols) * N));
          const p = re[i] * re[i] + im[i] * im[i];
          ctx[c ? 'lineTo' : 'moveTo'](xl + c, base - p * amp);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(233,237,247,0.2)';
        ctx.fillRect(xl, base, xr - xl, 1);

        // classical ball
        const bx = X(ball.x);
        const by = trap() ? base - 0.5 * OMEGA * OMEGA * (ball.x - MID) ** 2 * eScale - 9 : yE - 9;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, TAU);
        ctx.fill();
        if (!api.thumbnail) text(ctx, 'classical ball', bx, by - 16, { size: 10, align: 'center', color: C.orange });

        if (!trap() && !api.thumbnail) {
          const s = sides();
          tag(ctx, `reflected ${(s.l * 100).toFixed(1)}%`, xl + 10, 84, C.pink, { size: 11 });
          tag(ctx, `transmitted ${(s.r * 100).toFixed(1)}%`, xr - 10, 84, C.cyan, { size: 11, align: 'right' });
        }
      },
      stats() {
        const s = sides();
        const V0 = params.V * E;
        const kap = V0 > E ? Math.sqrt(2 * (V0 - E)) : 0;
        return [
          { label: 'Particle energy E', value: E.toFixed(2) },
          { label: 'Barrier height', value: trap() ? '—' : (params.V * E).toFixed(2), color: params.V > 1 ? C.violet : undefined },
          { label: 'Found beyond barrier', value: trap() ? '—' : (s.r * 100).toFixed(2) + ' %', color: C.cyan },
          { label: 'Reflected', value: trap() ? '—' : (s.l * 100).toFixed(2) + ' %', color: C.pink },
          { label: 'Estimate e^(−2κa)', value: trap() || params.V <= 1 ? '—' : (Math.exp(-2 * kap * params.width) * 100).toFixed(2) + ' %' },
        ];
      },
      charts() {
        if (trap()) return [];
        return [{ title: 'Probability reflected vs transmitted', series: [{ data: sR.data, color: C.pink, label: 'reflected' }, { data: sT.data, color: C.cyan, label: 'through' }], min: 0, max: 1, length: 240 }];
      },
    };
  },
};
