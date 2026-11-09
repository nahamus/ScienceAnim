import { C, TAU, clamp, text, tag, drawGlow, CMAPS } from '../../core/util.js';

// Gravitational waves from a black-hole binary, at leading (quadrupole, Newtonian-chirp) order.
// Time to merger τ shrinks; the wave phase follows Φ(τ) = −2 (τ/k)^(5/8), so the frequency rises
// as τ^(−3/8) and the amplitude as f^(2/3): the "chirp". k is proportional to the chirp mass
// Mc = (m1 m2)^(3/5) / (m1 + m2)^(1/5), so heavier binaries sweep through fewer cycles.
// After merger the new black hole rings down: a fading tone. Time runs in slow motion and the
// stretching of space is exaggerated about 10²⁰ times so you can see it.

const T0 = 14; // seconds of (slow-motion) inspiral shown before merger
const K_REF = 0.0157, MC_REF = 28; // k for GW150914's chirp mass
const RING_TAU = 0.45; // ring-down decay time (display seconds)
const GMC3 = 4.925e-6; // G·M☉/c³ in seconds

const chirpMass = (a, b) => Math.pow(a * b, 0.6) / Math.pow(a + b, 0.2);

export default {
  id: 'gravitational-waves',
  title: 'Gravitational Waves: When Black Holes Collide',
  category: 'astronomy',
  tagline: 'Two black holes spiral together and shake spacetime itself. Watch the ripples, hear the chirp.',
  ages: ['14-16', '16+'],
  topics: ['Gravity', 'Black holes', 'Waves'],
  keywords: ['gravitational waves', 'ligo', 'virgo', 'black hole merger', 'chirp', 'gw150914', 'einstein', 'general relativity', 'spacetime', 'ringdown', 'nobel 2017'],
  blurb:
    'Einstein predicted in 1916 that accelerating masses make ripples in spacetime. A century later, on 14 September 2015, the LIGO detectors felt one: two black holes of 36 and 29 Suns, 1.3 billion light years away, spiralling together and merging. As they close in, the waves get faster and stronger, a rising “chirp”, then the new black hole rings like a bell and falls silent.',
  ideas: [
    'Orbiting masses send out <b>gravitational waves</b> that stretch space one way and squeeze it the other.',
    'The waves carry away energy, so the orbit <b>shrinks</b> and speeds up: frequency and strength rise in a <b>chirp</b>.',
    'Two waves are emitted per orbit (the pattern repeats every half turn), so the wave frequency is <b>twice</b> the orbital frequency.',
    'After merging, the new black hole <b>rings down</b> and about 5% of the total mass leaves as wave energy (E = mc²).',
    'By the time they reach Earth the stretch is tiny: LIGO’s 4 km arms change by a <b>thousandth of a proton’s width</b>.',
  ],
  hint: 'Change the masses to hear a different chirp',
  renderScale: 1,
  thumbChapter: 0,
  thumbFrames: 420,
  params: [
    { key: 'm1', label: 'Mass of black hole 1', type: 'range', min: 5, max: 80, step: 1, value: 36, unit: 'M☉', instant: true },
    { key: 'm2', label: 'Mass of black hole 2', type: 'range', min: 5, max: 80, step: 1, value: 29, unit: 'M☉', instant: true },
    { key: 'speed', label: 'Slow motion', type: 'range', min: 0.2, max: 2, step: 0.05, value: 1, unit: '×' },
    { key: 'ring', label: 'Show a ring of floating particles', type: 'toggle', value: false },
    { key: 'restart', label: 'Start again', type: 'button', action: (sim) => sim.restart() },
  ],
  story: [
    {
      title: 'Two black holes',
      text: 'Two black holes, 36 and 29 times the mass of the Sun, orbit each other. Einstein’s general relativity says that as they swing around they make <b>ripples in spacetime</b> that spread out at the speed of light: the spiral pattern. Gold is space stretched, blue is space squeezed.',
      params: { m1: 36, m2: 29, speed: 1, ring: false },
      enter: (s) => s.restart(4),
      duration: 13,
    },
    {
      title: 'Stretch and squeeze',
      text: 'What does a wave do as it passes? It stretches space in one direction while squeezing it in the other, then swaps, twice per orbit. The ring of floating particles shows it, exaggerated by about 10²⁰ times. A real wave passing you right now would change your height by far less than an atom.',
      params: { ring: true, speed: 0.7 },
      enter: (s) => s.restart(3),
      duration: 15,
    },
    {
      title: 'The chirp',
      text: 'The waves carry away energy, so the black holes sink closer and orbit faster, which makes stronger waves still. The trace at the bottom is what a detector records: a wave that speeds up and grows, the famous <b>chirp</b>. Turned into sound, it’s a rising “whoop”.',
      formula: 'f ∝ τ^(−3/8),  strength ∝ f^(2/3)',
      check: {
        q: 'As the black holes spiral closer, what happens to the waves?',
        options: ['They get slower and weaker', 'They get faster and stronger', 'They stay the same'],
        answer: 1,
        setup: { ring: false, speed: 1 },
        explain: 'A tighter orbit is a faster orbit, so the wave frequency rises; faster-moving masses also shake spacetime harder, so the amplitude grows. That rising chirp is the fingerprint LIGO searches for.',
      },
      params: { ring: false, speed: 1 },
      enter: (s) => s.restart(7),
      duration: 15,
    },
    {
      title: 'Merger and ring-down',
      text: 'In the last fraction of a second they plunge together into one black hole of about 62 Suns. It’s lopsided at first and <b>rings like a struck bell</b>, its waves fading in a few cycles. The missing <b>3 Suns of mass</b> left as gravitational-wave energy: for a moment, more power than all the stars in the visible universe combined.',
      params: { speed: 0.5, ring: true },
      enter: (s) => s.restart(T0 - 2.4),
      duration: 15,
    },
    {
      title: 'Lighter and heavier',
      text: 'Lighter black holes (here 10 and 8 Suns) take longer to merge, spending many more cycles in the detector’s band and ending at a higher pitch. Heavier ones give a short, low chirp. Matching the shape of the chirp is how astronomers <b>weigh</b> black holes a billion light years away.',
      params: { m1: 10, m2: 8, speed: 1, ring: false },
      enter: (s) => s.restart(3),
      duration: 16,
    },
    {
      title: 'Listening to the universe',
      text: 'LIGO caught GW150914 on <b>14 September 2015</b>, 100 years after Einstein’s prediction, earning the <b>2017 Nobel Prize</b>. Detectors in the US, Italy and Japan have since recorded hundreds of mergers, including two neutron stars in 2017 that also flashed with light and made gold and platinum.',
      params: { m1: 36, m2: 29, speed: 1, ring: false },
      enter: (s) => s.restart(5),
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Set the two masses, slow time down, and switch on the ring of particles to feel the wave.',
      params: { m1: 30, m2: 30, speed: 1, ring: true },
      enter: (s) => s.restart(2),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0, cell, gw, gh, rhoIdx, theta, field, off, octx, img, done = 0;
    const CS = 150; // display wave speed, px per display second

    const M = () => params.m1 + params.m2;
    const k = () => K_REF * (chirpMass(params.m1, params.m2) / MC_REF);
    // merger when the separation shrinks to touching: r ∝ τ^(1/4)
    const tauEnd = () => T0 * Math.pow(0.32, 4);
    const tMerge = () => T0 - tauEnd();
    const phaseAt = (tau) => -2 * Math.pow(tau / k(), 5 / 8);
    const freqAt = (tau) => (5 / 4) * Math.pow(k(), -5 / 8) * Math.pow(tau, -3 / 8); // dΦ/dt
    const ampAt = (tau) => Math.pow(tau / tauEnd(), -1 / 4); // ∝ f^(2/3), 1 at merger

    /** Wave strength and phase at the source at (display) time tr. */
    function wave(tr) {
      const te = tMerge();
      if (tr < te) {
        const tau = T0 - tr;
        return { A: ampAt(tau), P: phaseAt(tau) };
      }
      const fe = freqAt(tauEnd());
      const dt = tr - te;
      return { A: Math.exp(-dt / RING_TAU) * 1.1, P: phaseAt(tauEnd()) + fe * 1.2 * dt };
    }

    function grid() {
      const { w, h } = api;
      cell = api.thumbnail ? 4 : w < 700 ? 5 : 6;
      gw = Math.ceil(w / cell);
      gh = Math.ceil(h / cell);
      const cx = w / 2, cy = centreY();
      rhoIdx = new Uint16Array(gw * gh);
      theta = new Float32Array(gw * gh);
      for (let j = 0; j < gh; j++)
        for (let i = 0; i < gw; i++) {
          const dx = (i + 0.5) * cell - cx, dy = (j + 0.5) * cell - cy;
          rhoIdx[j * gw + i] = Math.min(4095, Math.round(Math.hypot(dx, dy) / 2));
          theta[j * gw + i] = Math.atan2(dy, dx);
        }
      field = { A: new Float32Array(4096), P: new Float32Array(4096) };
      off = document.createElement('canvas');
      off.width = gw;
      off.height = gh;
      octx = off.getContext('2d');
      img = octx.createImageData(gw, gh);
      api._gw = { w, h };
    }
    const centreY = () => (api.thumbnail ? api.h / 2 : api.w < 700 ? api.h * 0.36 : api.h * 0.42);

    const sim = {
      /** Restart, optionally skipping ahead by `skip` display seconds. */
      restart(skip = 0) {
        t = skip;
        done = 0;
      },
      update(dt) {
        t += dt * params.speed;
        if (t > tMerge() + 4.5 && (done += dt) > 0.3) sim.restart(0.5);
      },
      draw() {
        const { w, h } = api;
        if (!api._gw || api._gw.w !== w || api._gw.h !== h) grid();
        const cx = w / 2, cy = centreY();
        // one radial profile per frame, then every pixel looks it up
        const ref = 60;
        for (let r = 0; r < 4096; r++) {
          const rho = r * 2;
          const { A, P } = wave(t - rho / CS);
          field.A[r] = (A * ref) / Math.max(rho, ref);
          field.P[r] = P;
        }
        const d = img.data, lut = CMAPS.diverge;
        for (let n = 0; n < gw * gh; n++) {
          const r = rhoIdx[n];
          const v = field.A[r] * Math.cos(field.P[r] - 2 * theta[n]);
          const c = clamp(Math.round(127.5 + v * 120), 0, 255) * 3;
          d[n * 4] = lut[c];
          d[n * 4 + 1] = lut[c + 1];
          d[n * 4 + 2] = lut[c + 2];
          d[n * 4 + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, gw * cell, gh * cell);
        ctx.fillStyle = 'rgba(5,7,15,0.35)';
        ctx.fillRect(0, 0, w, h);

        // the black holes
        const scale = Math.min(w, h) * (api.thumbnail ? 0.3 : 0.2);
        const te = tMerge();
        const bhR = (m) => 4 + Math.sqrt(m) * scale * 0.022;
        if (t < te) {
          const tau = T0 - t;
          const sep = scale * Math.pow(tau / T0, 1 / 4);
          const orb = phaseAt(tau) / 2;
          const r1 = (sep * params.m2) / M(), r2 = (sep * params.m1) / M();
          for (const [r, m, s] of [[r1, params.m1, 0], [r2, params.m2, Math.PI]]) {
            const x = cx + Math.cos(orb + s) * r, y = cy + Math.sin(orb + s) * r;
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, x, y, bhR(m) * 2.6, '#ffd38a', 0.25);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x, y, bhR(m), 0, TAU);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,211,138,0.6)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        } else {
          const dt = t - te;
          const flash = Math.exp(-dt * 3);
          const wob = 1 + 0.12 * Math.exp(-dt / RING_TAU) * Math.cos(freqAt(tauEnd()) * 1.2 * dt);
          const R = bhR(M() * 0.95);
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, cx, cy, R * (2.6 + 6 * flash), '#ffd38a', 0.25 + 0.5 * flash);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.ellipse(cx, cy, R * wob, R / wob, 0, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,211,138,0.6)';
          ctx.stroke();
        }
        if (api.thumbnail) return;
        const narrow = w < 700;

        // a ring of free-floating particles, stretched and squeezed (+ polarisation)
        if (params.ring) {
          const rx = narrow ? w * 0.78 : w * 0.8, ry = narrow ? cy + scale * 1.25 : cy - scale * 0.2;
          const rho = Math.hypot(rx - cx, ry - cy), th = Math.atan2(ry - cy, rx - cx);
          const { A, P } = wave(t - rho / CS);
          const hh = 0.35 * A * Math.cos(P - 2 * th); // exaggerated
          const R0 = narrow ? 30 : 42;
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.beginPath();
          ctx.arc(rx, ry, R0, 0, TAU);
          ctx.stroke();
          ctx.fillStyle = C.ink;
          for (let i = 0; i < 20; i++) {
            const a = (i / 20) * TAU;
            const ux = Math.cos(a), uy = Math.sin(a);
            // stretch along the line to the source, squeeze across it
            const along = ux * Math.cos(th) + uy * Math.sin(th), across = -ux * Math.sin(th) + uy * Math.cos(th);
            const a2 = along * (1 + hh / 2), c2 = across * (1 - hh / 2);
            const px = rx + R0 * (a2 * Math.cos(th) - c2 * Math.sin(th)), py = ry + R0 * (a2 * Math.sin(th) + c2 * Math.cos(th));
            ctx.beginPath();
            ctx.arc(px, py, 2.6, 0, TAU);
            ctx.fill();
          }
          text(ctx, 'floating particles (×10²⁰)', rx, ry + R0 + 16, { size: 10, align: 'center', color: C.dim });
        }

        // the detector trace: what an observer far to the right records
        const box = narrow ? { x: 16, y: h - 96, w: w - 32, h: 70 } : { x: w * 0.5, y: h - 120, w: w * 0.46, h: 84 };
        ctx.fillStyle = 'rgba(5,7,15,0.7)';
        ctx.fillRect(box.x - 8, box.y - 22, box.w + 16, box.h + 30);
        text(ctx, 'detector signal (strain)', box.x, box.y - 10, { size: 11, color: C.dim });
        const span = 6; // seconds shown
        const delay = (box.x + box.w - cx) / CS;
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const n = Math.round(box.w);
        for (let i = 0; i <= n; i++) {
          const tt = t - span + (i / n) * span - delay;
          const { A, P } = wave(tt);
          const y = box.y + box.h / 2 - (A / 1.2) * Math.cos(P) * (box.h / 2) * 0.95;
          ctx[i ? 'lineTo' : 'moveTo'](box.x + i, clamp(y, box.y, box.y + box.h));
        }
        ctx.stroke();
        const phaseLabel = t < te ? 'inspiral' : t < te + 1.2 ? 'merger · ring-down' : 'quiet';
        tag(ctx, phaseLabel, w / 2, narrow ? 64 : 82, t < te ? C.amber : C.pink, { align: 'center' });
      },
      stats() {
        const mc = chirpMass(params.m1, params.m2);
        const eta = (params.m1 * params.m2) / M() ** 2;
        const erad = 0.048 * (4 * eta) ** 2 * M();
        // real time spent above 30 Hz, leading order: τ = 5/256 (πf)^(−8/3) (G Mc/c³)^(−5/3)
        const tau30 = (5 / 256) * Math.pow(Math.PI * 30, -8 / 3) * Math.pow(mc * GMC3, -5 / 3);
        return [
          { label: 'Chirp mass', value: `${mc.toFixed(1)} M☉`, color: C.amber },
          { label: 'Final black hole ≈', value: `${(M() - erad).toFixed(1)} M☉` },
          { label: 'Energy radiated ≈', value: `${erad.toFixed(1)} M☉ c²`, color: C.pink },
          { label: 'Real time from 30 Hz to merger', value: `${tau30 < 1 ? (tau30 * 1000).toFixed(0) + ' ms' : tau30.toFixed(1) + ' s'}` },
          { label: 'Wave frequency at the last orbit ≈', value: `${Math.round(4400 / M())} Hz` },
        ];
      },
    };
    return sim;
  },
};
