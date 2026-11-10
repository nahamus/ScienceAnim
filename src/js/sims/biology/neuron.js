import { C, Series, backdrop, clamp, drawGlow, rand, roundRect, tag, text } from '../../core/util.js';

// Hodgkin–Huxley membrane on a 1-D cable (units: mV, ms, mS/cm², µF/cm²).
const N = 180;
const am = (V) => (Math.abs(V + 40) < 1e-6 ? 1 : (0.1 * (V + 40)) / (1 - Math.exp(-(V + 40) / 10)));
const bm = (V) => 4 * Math.exp(-(V + 65) / 18);
const ah = (V) => 0.07 * Math.exp(-(V + 65) / 20);
const bh = (V) => 1 / (1 + Math.exp(-(V + 35) / 10));
const an = (V) => (Math.abs(V + 55) < 1e-6 ? 0.1 : (0.01 * (V + 55)) / (1 - Math.exp(-(V + 55) / 10)));
const bn = (V) => 0.125 * Math.exp(-(V + 65) / 80);

export default {
  id: 'neuron',
  title: 'How Neurons Fire',
  category: 'biology',
  tagline: 'Ion channels snap open and a spike of voltage races down a nerve fibre.',
  ages: ['14-16', '16+'],
  topics: ['Nervous system', 'Cells'],
  blurb:
    'Every thought, feeling and movement rides on action potentials — brief electrical spikes that travel along nerve fibres. They are created by tiny gates in the cell membrane letting sodium rush in and potassium rush out. This is the Nobel-winning Hodgkin–Huxley model, running live.',
  ideas: [
    'At rest the inside of a neuron sits at about −65 mV.',
    'A strong enough stimulus opens <b>sodium channels</b>; Na⁺ floods in and the voltage spikes positive.',
    '<b>Potassium channels</b> then open, K⁺ flows out, and the membrane resets.',
    'The spike is <b>all-or-nothing</b> and can’t travel backwards because recently fired membrane is refractory.',
    '<b>Myelin</b> insulation lets the signal leap between gaps (nodes), many times faster.',
  ],
  hint: 'Click anywhere along the axon to stimulate it',
  thumbChapter: 3,
  thumbFrames: 160,
  params: [
    { key: 'rate', label: 'Auto-stimulate', type: 'range', min: 0, max: 3, step: 0.1, value: 0.5, unit: 'per s' },
    { key: 'stim', label: 'Stimulus strength', type: 'range', min: 2, max: 40, step: 1, value: 25, unit: 'µA' },
    { key: 'myelin', label: 'Myelinated axon', type: 'toggle', value: false, instant: true },
    { key: 'ions', label: 'Show ion flow', type: 'toggle', value: true },
    { key: 'slow', label: 'Simulated ms per second', type: 'range', min: 2, max: 40, step: 1, value: 16 },
  ],
  story: [
    {
      title: 'A nerve at rest',
      text: 'This tube is an <b>axon</b>, the long wire of a nerve cell. Pumps keep its inside slightly negative: about <em>−65 millivolts</em>. It’s a charged battery, waiting.',
      params: { rate: 0, myelin: false, ions: true, slow: 16 },
      duration: 9,
    },
    {
      title: 'The spike',
      text: 'A stimulus nudges the voltage up. Past a threshold, <b>sodium gates</b> fly open and yellow Na⁺ ions pour in. The inside swings to +40 mV in a millisecond — an <b>action potential</b>.',
      params: { rate: 0, slow: 6 },
      enter: (s) => s.stimulate(0.06),
      duration: 12,
    },
    {
      title: 'Reset',
      text: 'Right behind the spike, <b>potassium gates</b> open and purple K⁺ ions stream out, pulling the voltage back down. For a moment the membrane can’t fire again — it’s <em>refractory</em>.',
      params: { slow: 6 },
      enter: (s) => s.stimulate(0.06),
      duration: 12,
    },
    {
      title: 'A travelling wave',
      text: 'Each patch of membrane triggers the next, so the spike runs down the axon without fading. Because the patch behind is refractory, it can only go <b>forward</b>.',
      formula: 'C dV/dt = −g<sub>Na</sub>m³h(V−E<sub>Na</sub>) − g<sub>K</sub>n⁴(V−E<sub>K</sub>) − …',
      params: { rate: 0.7, slow: 16 },
      duration: 14,
    },
    {
      title: 'Myelin: the express lane',
      text: 'Most human nerves are wrapped in fatty <b>myelin</b>. The spike only regenerates at the gaps, so it leaps from node to node — up to 100× faster. Diseases like MS attack this insulation.',
      params: { myelin: true, rate: 0.7, slow: 16 },
      duration: 15,
    },
    {
      title: 'Experiment',
      text: 'Click anywhere on the axon to fire. Try firing from both ends at once: the two spikes meet — and annihilate each other.',
      params: { myelin: false, rate: 0, slow: 12 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const V = new Float64Array(N), m = new Float64Array(N), hh = new Float64Array(N), n = new Float64Array(N), I = new Float64Array(N);
    const gNaSeg = new Float64Array(N), gKSeg = new Float64Array(N);
    let node = new Uint8Array(N), ions = [], probe = new Series(360), stimAcc = 0, spikes = 0, lastAbove = false;
    let ax0 = 0, ax1 = 0, ay = 0, ar = 18;

    function rest() {
      for (let i = 0; i < N; i++) {
        V[i] = -65;
        m[i] = am(-65) / (am(-65) + bm(-65));
        hh[i] = ah(-65) / (ah(-65) + bh(-65));
        n[i] = an(-65) / (an(-65) + bn(-65));
        I[i] = 0;
      }
      node = new Uint8Array(N);
      for (let i = 0; i < N; i++) node[i] = !params.myelin || i % 18 < 2 ? 1 : 0;
      probe.clear();
    }
    function stimulate(frac = 0.04) {
      const c = clamp(Math.round(frac * N), 1, N - 2);
      for (let i = c - 2; i <= c + 2; i++) if (i >= 0 && i < N) I[i] = params.stim;
      stimHold = 1.2;
    }
    let stimHold = 0;
    const scratch = new Float64Array(N);
    rest();

    function step(dt) {
      const nV = scratch;
      for (let i = 0; i < N; i++) {
        const v = V[i];
        const act = node[i];
        const gNa = act ? 120 * m[i] ** 3 * hh[i] : 0;
        const gK = act ? 36 * n[i] ** 4 : 0;
        const gL = act ? 0.3 : 0.02;
        const iion = gNa * (v - 50) + gK * (v + 77) + gL * (v + 54.4);
        const left = i > 0 ? V[i - 1] : v, right = i < N - 1 ? V[i + 1] : v;
        // internodes under myelin: passive, low capacitance, fast spread (D·dt kept < 0.5 for stability)
        const D = act ? 10 : 30;
        nV[i] = v + dt * (-iion + (stimHold > 0 ? I[i] : 0) + D * (left + right - 2 * v)) * (act ? 1 : 1.5);
        m[i] += dt * (am(v) * (1 - m[i]) - bm(v) * m[i]);
        hh[i] += dt * (ah(v) * (1 - hh[i]) - bh(v) * hh[i]);
        n[i] += dt * (an(v) * (1 - n[i]) - bn(v) * n[i]);
        gNaSeg[i] = gNa;
        gKSeg[i] = gK;
      }
      V.set(nV);
      stimHold -= dt;
      if (stimHold <= 0) I.fill(0);
    }

    return {
      stimulate,
      resize(w, h) {
        ax0 = Math.max(w * 0.06, 52); // room for the "−65 mV" axis labels on narrow phones
        ax1 = w * 0.94;
        ay = h * 0.4;
        ar = clamp(h * 0.035, 12, 22);
      },
      reset: rest,
      onParam(k) {
        if (k === 'myelin') rest();
      },
      pointerDown(p) {
        stimulate(clamp((p.x - ax0) / (ax1 - ax0), 0, 1));
      },
      update(dt) {
        const msTotal = dt * params.slow;
        const sub = Math.ceil(msTotal / 0.01);
        const h = msTotal / sub;
        for (let s = 0; s < sub; s++) step(h);
        if (params.rate > 0) {
          stimAcc += dt * params.rate;
          if (stimAcc > 1) {
            stimAcc = 0;
            stimulate(0.03);
          }
        }
        const pi = Math.round(N * 0.5);
        probe.push(V[pi]);
        const above = V[pi] > 0;
        if (above && !lastAbove) spikes++;
        lastAbove = above;
        // ion particles from open channels
        if (params.ions) {
          const segW = (ax1 - ax0) / N;
          for (let i = 0; i < N; i++) {
            const x = ax0 + (i + 0.5) * segW;
            if (gNaSeg[i] > 8 && Math.random() < gNaSeg[i] * dt * 0.25)
              ions.push({ x: x + rand(-3, 3), y: ay + (Math.random() < 0.5 ? -1 : 1) * (ar + 26), ty: ay, k: 'Na', t: 0 });
            if (gKSeg[i] > 6 && Math.random() < gKSeg[i] * dt * 0.25)
              ions.push({ x: x + rand(-3, 3), y: ay, ty: ay + (Math.random() < 0.5 ? -1 : 1) * (ar + 30), k: 'K', t: 0 });
          }
          for (const o of ions) o.t += dt * 2.2;
          ions = ions.filter((o) => o.t < 1);
          if (ions.length > 1500) ions.splice(0, ions.length - 1500);
        } else ions = [];
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#120b22', edge: '#04030a' });
        const segW = (ax1 - ax0) / N;
        // voltage trace along the axon (oscilloscope above)
        const top = ay - ar - 150, sc = 1.1;
        ctx.strokeStyle = 'rgba(160,175,230,0.12)';
        ctx.setLineDash([3, 5]);
        for (const v of [-65, 0, 40]) {
          ctx.beginPath();
          ctx.moveTo(ax0, top + 75 - (v + 25) * sc);
          ctx.lineTo(ax1, top + 75 - (v + 25) * sc);
          ctx.stroke();
          if (!api.thumbnail) text(ctx, `${v} mV`, ax0 - 6, top + 75 - (v + 25) * sc, { align: 'right', size: 10, mono: true, color: C.dim });
        }
        ctx.setLineDash([]);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#ff5fa2';
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const x = ax0 + (i + 0.5) * segW, y = top + 75 - (V[i] + 25) * sc;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        // membrane coloured by voltage
        for (let i = 0; i < N; i++) {
          const x = ax0 + i * segW;
          const t = clamp((V[i] + 75) / 115, 0, 1);
          ctx.fillStyle = `hsl(${250 - t * 250},${60 + t * 40}%,${18 + t * 52}%)`;
          ctx.fillRect(x, ay - ar, segW + 0.6, ar * 2);
        }
        // tube shading
        const g = ctx.createLinearGradient(0, ay - ar, 0, ay + ar);
        g.addColorStop(0, 'rgba(255,255,255,0.28)');
        g.addColorStop(0.3, 'rgba(255,255,255,0.02)');
        g.addColorStop(0.75, 'rgba(0,0,0,0.15)');
        g.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = g;
        ctx.fillRect(ax0, ay - ar, ax1 - ax0, ar * 2);
        // spike glow
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < N; i += 2) if (V[i] > -10) drawGlow(ctx, ax0 + i * segW, ay, ar * 2.8 * clamp((V[i] + 10) / 50, 0, 1), '#ff5fa2', 0.2);
        for (const o of ions) {
          const y = o.y + (o.ty - o.y) * o.t;
          drawGlow(ctx, o.x, y, 5, o.k === 'Na' ? '#ffd166' : '#b18cff', 0.35);
        }
        ctx.globalCompositeOperation = 'source-over';
        // myelin sheaths
        if (params.myelin) {
          for (let i = 0; i < N; i++) {
            if (node[i] || (i > 0 && !node[i - 1])) continue;
            let j = i;
            while (j < N && !node[j]) j++;
            const x0 = ax0 + i * segW + 1, x1 = ax0 + j * segW - 1;
            const mg = ctx.createLinearGradient(0, ay - ar - 9, 0, ay + ar + 9);
            mg.addColorStop(0, 'rgba(240,235,255,0.55)');
            mg.addColorStop(0.5, 'rgba(200,190,240,0.18)');
            mg.addColorStop(1, 'rgba(160,150,210,0.45)');
            ctx.fillStyle = mg;
            roundRect(ctx, x0, ay - ar - 9, x1 - x0, ar * 2 + 18, ar);
            ctx.fill();
          }
        }
        if (!api.thumbnail) {
          tag(ctx, 'axon', ax0 + 10, ay + ar + 46, C.ink);
          tag(ctx, 'Na⁺ in', ax0 + 70, ay + ar + 46, '#ffd166');
          tag(ctx, 'K⁺ out', ax0 + 140, ay + ar + 46, '#b18cff');
          tag(ctx, 'voltage along the axon', ax0, top - 6, '#ff5fa2');
          const px = ax0 + (N * 0.5 + 0.5) * segW;
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath();
          ctx.moveTo(px, ay + ar + 4);
          ctx.lineTo(px, ay + ar + 24);
          ctx.stroke();
          tag(ctx, 'electrode', px, ay + ar + 30, C.dim, { align: 'center' });
        }
      },
      stats() {
        const pi = Math.round(N * 0.5);
        return [
          { label: 'Voltage at electrode', value: V[pi].toFixed(1) + ' mV', color: V[pi] > 0 ? '#ff5fa2' : undefined },
          { label: 'Spikes recorded', value: String(spikes) },
          { label: 'Na⁺ gates open', value: (m[pi] ** 3 * hh[pi] * 100).toFixed(0) + ' %', color: '#ffd166' },
          { label: 'K⁺ gates open', value: (n[pi] ** 4 * 100).toFixed(0) + ' %', color: '#b18cff' },
        ];
      },
      charts() {
        return [{ title: 'Electrode recording (mV)', series: [{ data: probe.data, color: '#ff5fa2' }], min: -85, max: 50, length: 360 }];
      },
    };
  },
};
