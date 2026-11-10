import { C, clamp, rgba, text, tag, backdrop, roundRect, drawGlow, Series, TAU } from '../../core/util.js';

// Cyclotron: two D-shaped electrodes in a uniform magnet. The radio-frequency (RF) voltage across
// the gap flips at the particle's non-relativistic lap rate qB/2πm, so each gap crossing adds
// qV·cos(phase). The orbit radius is p/(qB). With relativity on, a lap takes γ times longer, so
// the particle arrives a little later each time (phase slip of π(γ−1) per half lap) until the
// voltage pushes the wrong way and it stalls. Synchrotron: a fixed ring whose magnets and RF
// track the rising energy, shown with the LHC's real numbers.

const PART = {
  proton: { mc2: 938.272, emax: 10, name: 'proton', col: C.amber },
  electron: { mc2: 0.511, emax: 1.5, name: 'electron', col: C.cyan },
};
const PHI0 = -Math.PI / 3; // the first crossing comes a little before the voltage peak
const LAP = 0.55; // seconds per lap on screen (non-relativistic)
const LHC = { inj: 450, top: 6800, ramp: 20, bTop: 8.33, laps: 11245 };
const pOf = (E, mc2) => Math.sqrt(E * E + 2 * E * mc2);

export default {
  id: 'accelerator',
  title: 'Particle Accelerators',
  category: 'physics',
  tagline: 'Kick a particle every half lap of a cyclotron, then watch relativity throw it out of step.',
  ages: ['14-16', '16+'],
  topics: ['Particles', 'Relativity', 'Magnetism'],
  keywords: ['particle accelerator', 'cyclotron', 'synchrotron', 'lhc', 'cern', 'large hadron collider', 'higgs boson', 'proton therapy', 'relativity', 'lorentz factor', 'electron volt', 'rf cavity', 'magnetic field', 'lawrence'],
  blurb:
    'To look inside protons, make medical isotopes or destroy tumours, physicists accelerate particles to enormous energies. Electric fields do the pushing and magnets bend the path into a circle so one voltage can push again and again. Ernest Lawrence’s 1931 <b>cyclotron</b> does this with a clever timing trick, which works until the particles get close to light speed, when Einstein’s relativity spoils it. Here every kick, lap and phase slip is computed, and the synchrotron view uses the Large Hadron Collider’s real numbers.',
  ideas: [
    'An electric field gives a charge energy: crossing 1 volt gives <b>1 electron-volt</b> (eV).',
    'A magnet bends the path into a circle of radius <b>r = p / qB</b>, so the same gap can be used again and again.',
    'In a cyclotron each lap takes the <b>same time</b> at low speed, so a fixed-frequency voltage stays in step.',
    'Near light speed each lap takes longer (<b>γ</b> grows), the particle arrives late and the push turns into a brake.',
    'Synchrotrons keep a <b>fixed ring</b> and raise the magnets’ strength as the energy grows: the LHC reaches 6.8 TeV.',
  ],
  hint: 'Try the gap voltage, the particle and the relativity switch',
  renderScale: 1,
  thumbChapter: 1,
  thumbFrames: 600,
  params: [
    { key: 'mode', label: 'Machine', type: 'select', value: 'cyclotron', options: [{ value: 'cyclotron', label: 'Cyclotron' }, { value: 'synchrotron', label: 'Synchrotron (LHC)' }] },
    { key: 'particle', label: 'Particle', type: 'select', value: 'proton', options: [{ value: 'proton', label: 'Proton' }, { value: 'electron', label: 'Electron' }] },
    { key: 'kv', label: 'Gap voltage', type: 'range', min: 5, max: 400, step: 5, value: 200, unit: ' kV', instant: true },
    { key: 'rel', label: 'Relativity', type: 'toggle', value: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.25, max: 4, step: 0.05, value: 1, unit: '×' },
    { key: 'restart', label: 'Inject a new particle', type: 'button', action: (sim) => sim.restart() },
  ],
  story: [
    {
      title: 'Energy from a voltage',
      text: 'An electric field pushes on a charge. A proton crossing a gap with <b>200,000 volts</b> across it gains 200,000 electron-volts (0.2 MeV) of energy. To reach millions of eV you could build an enormous voltage, or use a modest one many times over. That’s what the cyclotron does.',
      params: { mode: 'cyclotron', particle: 'proton', kv: 200, rel: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 13,
    },
    {
      title: 'The cyclotron',
      text: 'Two hollow D-shaped electrodes sit inside a big magnet. The magnet bends the proton into a circle; each time it crosses the gap between the “dees” the voltage gives it a kick, and the voltage flips every half lap so the next crossing is pushed too. Faster protons swing in bigger circles, spiralling out to <b>10 MeV</b>, and then fly out to a target.',
      formula: 'lap time T = 2πm / qB',
      check: {
        q: 'As the proton speeds up and its circle gets bigger, the time for each lap…',
        options: ['Gets shorter', 'Stays the same', 'Gets longer'],
        answer: 1,
        setup: { mode: 'cyclotron', particle: 'proton', kv: 200, rel: true },
        explain: 'The circle’s length grows in proportion to the speed, so each lap takes the same time, 2πm/qB. That is why a fixed-frequency voltage stays in step: Lawrence’s key insight in 1930.',
      },
      params: { mode: 'cyclotron', particle: 'proton', kv: 200, rel: true, speed: 1.4 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Relativity spoils the timing',
      text: 'With a smaller voltage the proton needs more laps, and something creeps in: near light speed its energy grows but its speed barely does, and each lap takes a little longer (by the factor <b>γ</b>). It arrives later and later at the gap (dots on the wave) until the voltage is pushing the wrong way. It stalls at about <b>7.5 MeV</b>. Switch relativity off and it would sail on.',
      formula: 'lap time T = 2πγm / qB',
      check: {
        q: 'Why does the proton fall out of step with the voltage?',
        options: ['Friction with the air', 'Relativity: each lap takes longer as its energy grows', 'The magnet gets weaker'],
        answer: 1,
        setup: { mode: 'cyclotron', particle: 'proton', kv: 50, rel: true },
        explain: 'As the energy rises the Lorentz factor γ grows and the lap time 2πγm/qB with it. The particle drifts later each lap until it meets the voltage on its way down, then reversed. Modern cyclotrons make the magnet slightly stronger towards the edge to compensate.',
      },
      params: { mode: 'cyclotron', particle: 'proton', kv: 50, rel: true, speed: 4 },
      enter: (s) => s.restart(),
      duration: 30,
    },
    {
      title: 'Electrons give up almost at once',
      text: 'An electron is 1,836 times lighter than a proton, so just 0.1 MeV already makes γ = 1.2. It falls out of step within a handful of laps. That’s why electrons are accelerated in straight lines (linacs) or in synchrotrons instead.',
      params: { mode: 'cyclotron', particle: 'electron', kv: 20, rel: true, speed: 0.8 },
      enter: (s) => s.restart(),
      duration: 14,
    },
    {
      title: 'The synchrotron',
      text: 'Fix the ring and change the magnets instead: as the energy rises, the bending field is <b>ramped up</b> to keep the particles on the same circle, and the voltage is retuned to match. The LHC at CERN is 27 km round, with 1,232 superconducting magnets reaching 8.3 tesla. It takes protons from 450 GeV to <b>6.8 TeV</b> in about 20 minutes; at the top they lap 11,245 times a second, just 3 m/s slower than light.',
      formula: 'p = q B r',
      params: { mode: 'synchrotron', particle: 'proton', speed: 1 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'What accelerators are for',
      text: 'In 2012 LHC collisions revealed the <b>Higgs boson</b>. But most of the world’s ~30,000 accelerators are smaller: hospital cyclotrons make isotopes for PET scans and fire 230 MeV protons that stop right inside a tumour; synchrotron light sources make brilliant X-rays to map proteins and battery materials.',
      params: { mode: 'cyclotron', particle: 'proton', kv: 300, rel: true, speed: 1.6 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Find the lowest voltage that still gets a proton to 10 MeV with relativity on. Then switch relativity off and see how Newton’s world would let the particle keep going.',
      params: { mode: 'cyclotron', particle: 'proton', kv: 100, rel: true, speed: 1.5 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let E, th, psi, laps, trail, arrivals, state, wait, peak, sync = 0, L = {};
    const energy = new Series(400);

    const P = () => PART[params.particle] || PART.proton;
    function restart() {
      const p = P();
      E = p.mc2 > 1 ? 0.02 : 0.001;
      th = 0;
      psi = PHI0 + Math.PI / 2; // so the first crossing (θ = π/2) arrives at phase PHI0
      laps = 0;
      trail = [];
      arrivals = [];
      state = 'run';
      wait = 0;
      peak = E;
      sync = 0;
      energy.clear();
      energy.push(E);
    }
    restart();

    return {
      restart,
      resize(w, h) {
        const narrow = w < 700;
        if (narrow) {
          const R = Math.min(w / 2 - 24, (h - 250) / 2);
          L = { narrow, cx: w / 2, cy: 104 + R, R, wave: { x: 16, y: 104 + 2 * R + 34, w: w - 32, h: 46 } };
        } else {
          const x0 = w - 550 >= 360 ? 510 : Math.max(w * 0.4, 400);
          const R = Math.min((w - 40 - x0) / 2 - 30, (h - 96 - 150) / 2);
          L = { narrow, cx: x0 + (w - 40 - x0) / 2, cy: 100 + R, R, wave: { x: 40, y: 120, w: Math.min(380, x0 - 80), h: 70 } };
        }
      },
      onParam(k) {
        if (k === 'particle' || k === 'mode') restart();
      },
      update(dt) {
        const sdt = dt * params.speed;
        if (params.mode === 'synchrotron') {
          sync += sdt;
          if (sync > LHC.ramp + 6) sync = 0;
          return;
        }
        const p = P();
        if (state !== 'run') {
          wait -= sdt;
          if (state === 'out') trail.push(trail.length ? [trail[trail.length - 1][0], trail[trail.length - 1][1] + sdt * 4] : [0, 0]);
          if (wait <= 0) restart();
          return;
        }
        const w0 = TAU / LAP;
        let left = sdt;
        while (left > 0 && state === 'run') {
          const h = Math.min(left, 0.004);
          left -= h;
          const g = params.rel ? 1 + E / p.mc2 : 1;
          const before = th;
          th += (w0 / g) * h;
          psi += w0 * h;
          // gap crossings at θ = π/2 + kπ
          const k0 = Math.floor((before - Math.PI / 2) / Math.PI), k1 = Math.floor((th - Math.PI / 2) / Math.PI);
          if (k1 > k0) {
            const cross = Math.PI / 2 + k1 * Math.PI;
            const phase = psi - cross;
            const gain = (params.kv / 1000) * Math.cos(phase);
            E = Math.max(1e-4, E + gain);
            peak = Math.max(peak, E);
            arrivals.push({ phase: ((((phase + Math.PI) % TAU) + TAU) % TAU) - Math.PI, gain });
            if (arrivals.length > 30) arrivals.shift();
            if (k1 % 2 === 0) {
              laps++;
              energy.push(E);
            }
            if (E >= p.emax) {
              state = 'out';
              wait = 2.5;
            } else if (E < peak * 0.35 && peak > p.emax * 0.05) {
              state = 'stalled';
              wait = 3.5;
            }
          }
          const r = pOf(E, p.mc2) / pOf(p.emax, p.mc2);
          trail.push([r * Math.cos(th), r * Math.sin(th)]);
          if (trail.length > 9000) trail.shift();
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const { cx, cy, R } = L;
        if (params.mode === 'synchrotron') return drawSync();
        const p = P();
        // magnet pole outline and the two dees, coloured by the RF polarity
        ctx.fillStyle = 'rgba(91,140,255,0.05)';
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.12, 0, TAU);
        ctx.fill();
        const pol = Math.cos(psi);
        const gap = Math.max(5, R * 0.05);
        for (const side of [-1, 1]) {
          const v = side * pol;
          ctx.fillStyle = v > 0 ? rgba(C.red, 0.08 + 0.12 * v) : rgba(C.blue, 0.08 - 0.12 * v);
          ctx.strokeStyle = 'rgba(200,210,240,0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx + side * gap, cy, R, side > 0 ? -Math.PI / 2 : Math.PI / 2, side > 0 ? Math.PI / 2 : (3 * Math.PI) / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          if (!api.thumbnail) text(ctx, v > 0 ? '+' : '−', cx + side * R * 0.75, cy - R * 0.75, { size: 18, align: 'center', weight: 700, color: v > 0 ? C.red : C.blue });
        }
        // arrows across the gap show which way the field pushes right now
        if (Math.abs(pol) > 0.2) {
          ctx.strokeStyle = rgba(C.amber, Math.abs(pol) * 0.6);
          ctx.lineWidth = 1.5;
          for (const yy of [-0.6, -0.2, 0.2, 0.6]) {
            const dir = pol > 0 ? -1 : 1;
            ctx.beginPath();
            ctx.moveTo(cx - dir * gap * 0.8, cy + yy * R);
            ctx.lineTo(cx + dir * gap * 0.8, cy + yy * R);
            ctx.stroke();
          }
        }
        // the spiral
        ctx.strokeStyle = rgba(p.col, 0.65);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        trail.forEach(([x, y], i) => {
          const X = cx + x * R, Y = cy - y * R;
          i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        });
        ctx.stroke();
        const last = trail[trail.length - 1] || [0, 0];
        const PX = cx + last[0] * R, PY = cy - last[1] * R;
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, PX, PY, 12, p.col, 0.4);
        ctx.globalCompositeOperation = 'source-over';
        if (!api.thumbnail) {
          if (state === 'out') tag(ctx, `extracted at ${p.emax} MeV → target`, cx, cy + R * 1.12 + 18, C.teal, { align: 'center' });
          if (state === 'stalled') tag(ctx, `out of step: stalled at ${peak.toFixed(peak < 1 ? 2 : 1)} MeV`, cx, cy + R * 1.12 + 18, C.red, { align: 'center' });
        }
        // RF wave with the arrival phases
        const wv = L.wave;
        if (!api.thumbnail) {
          ctx.fillStyle = 'rgba(8,11,22,0.7)';
          roundRect(ctx, wv.x - 8, wv.y - 22, wv.w + 16, wv.h + 44, 10);
          ctx.fill();
          text(ctx, 'Gap voltage when the particle arrives', wv.x, wv.y - 10, { size: 11, color: C.dim, weight: 600 });
          const mid = wv.y + wv.h / 2 + 4, amp = wv.h / 2 - 6;
          ctx.strokeStyle = rgba(C.violet, 0.7);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const ph = -Math.PI + (i / 100) * TAU;
            const X = wv.x + (i / 100) * wv.w, Y = mid - Math.cos(ph) * amp;
            i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
          }
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.beginPath();
          ctx.moveTo(wv.x, mid);
          ctx.lineTo(wv.x + wv.w, mid);
          ctx.stroke();
          arrivals.forEach((a, i) => {
            const X = wv.x + ((a.phase + Math.PI) / TAU) * wv.w, Y = mid - Math.cos(a.phase) * amp;
            ctx.fillStyle = rgba(a.gain >= 0 ? C.teal : C.red, 0.3 + (0.7 * (i + 1)) / arrivals.length);
            ctx.beginPath();
            ctx.arc(X, Y, 3.5, 0, TAU);
            ctx.fill();
          });
          text(ctx, 'push', wv.x + wv.w / 2, wv.y + 6, { size: 9, align: 'center', color: C.teal });
          text(ctx, 'early', wv.x + 4, mid + amp + 12, { size: 9, color: C.dim });
          text(ctx, 'late', wv.x + wv.w - 4, mid + amp + 12, { size: 9, align: 'right', color: C.dim });
        }
      },
      stats() {
        if (params.mode === 'synchrotron') {
          const { E, g } = syncState();
          const cv = 299792458 / (2 * g * g);
          return [
            { label: 'Proton energy', value: E >= 1000 ? (E / 1000).toFixed(2) + ' TeV' : E.toFixed(0) + ' GeV', color: C.amber },
            { label: 'Lorentz factor γ', value: Math.round(g).toLocaleString('en') },
            { label: 'Slower than light by', value: cv.toFixed(cv < 10 ? 1 : 0) + ' m/s' },
            { label: 'Dipole field', value: ((LHC.bTop * E) / LHC.top).toFixed(2) + ' T' },
          ];
        }
        const p = P();
        const g = 1 + E / p.mc2;
        const beta = Math.sqrt(1 - 1 / (g * g));
        return [
          { label: 'Kinetic energy', value: E < 1 ? (E * 1000).toFixed(0) + ' keV' : E.toFixed(2) + ' MeV', color: p.col },
          { label: 'Speed', value: (beta * 100).toFixed(1) + ' % of c' },
          { label: 'Lorentz factor γ', value: g.toFixed(4) },
          { label: 'Laps', value: String(laps) },
        ];
      },
      charts() {
        if (params.mode === 'synchrotron') return [];
        return [{ title: 'Energy (MeV) after each lap', series: [{ data: energy.data, color: P().col }], ref: { data: [P().emax, P().emax], color: C.teal }, min: 0, max: P().emax * 1.1, length: Math.max(60, energy.data.length) }];
      },
    };

    function syncState() {
      const f = clamp(sync / LHC.ramp, 0, 1);
      const E = LHC.inj + (LHC.top - LHC.inj) * f;
      return { E, g: (E * 1000) / 938.272 + 1, f };
    }
    function drawSync() {
      const { cx, cy, R } = L;
      const { E, f } = syncState();
      // the ring: 8 arcs of bending magnets, an RF cavity and two detectors
      for (let k = 0; k < 8; k++) {
        const a0 = (k * TAU) / 8 + 0.08, a1 = ((k + 1) * TAU) / 8 - 0.08;
        ctx.strokeStyle = rgba(C.blue, 0.35 + 0.5 * f);
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, R, a0, a1);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();
      const mark = (a, label, col) => {
        const X = cx + Math.cos(a) * R, Y = cy + Math.sin(a) * R;
        ctx.fillStyle = col;
        roundRect(ctx, X - 9, Y - 9, 18, 18, 4);
        ctx.fill();
        if (!api.thumbnail) text(ctx, label, cx + Math.cos(a) * (R + 30), cy + Math.sin(a) * (R + 30), { size: 11, align: 'center', color: col, weight: 700 });
      };
      mark(0, 'RF', C.amber);
      mark(Math.PI / 2, 'ATLAS', C.pink);
      mark(-Math.PI / 2, 'CMS', C.pink);
      // two counter-rotating beams of bunches
      const t = api.time;
      for (let b = 0; b < 2; b++) {
        for (let k = 0; k < 6; k++) {
          const a = (b ? -1 : 1) * t * 1.6 + (k * TAU) / 6;
          const rr = R + (b ? -5 : 5);
          ctx.fillStyle = b ? C.cyan : C.amber;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3.5, 0, TAU);
          ctx.fill();
        }
      }
      // collisions at the detectors once at top energy
      if (f >= 1) {
        for (const a of [Math.PI / 2, -Math.PI / 2]) {
          const X = cx + Math.cos(a) * R, Y = cy + Math.sin(a) * R;
          ctx.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 10; k++) {
            const ang = Math.random() * TAU, len = 10 + Math.random() * 40;
            ctx.strokeStyle = rgba(k % 2 ? C.pink : C.amber, 0.7);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(X, Y);
            ctx.lineTo(X + Math.cos(ang) * len, Y + Math.sin(ang) * len);
            ctx.stroke();
          }
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      if (!api.thumbnail) {
        text(ctx, f >= 1 ? 'Collisions at 13.6 TeV' : `Ramping: ${(E / 1000).toFixed(2)} TeV per proton`, cx, cy - 12, { size: 15, align: 'center', weight: 700, color: f >= 1 ? C.pink : C.amber });
        text(ctx, `bending field ${((LHC.bTop * E) / LHC.top).toFixed(2)} T`, cx, cy + 12, { size: 12, align: 'center', color: C.blue });
        text(ctx, '(about 20 minutes of real ramp, sped up)', cx, cy + 32, { size: 10, align: 'center', color: C.dim });
        if (!L.narrow) text(ctx, 'LHC: 27 km ring, 1,232 bending magnets', L.wave.x, L.wave.y, { size: 12, color: C.dim });
      }
    }
  },
};
