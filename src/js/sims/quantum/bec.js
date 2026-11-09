import { C, clamp, rgba, text, tag, backdrop, CMAPS } from '../../core/util.js';

// An ideal gas of N atoms in a 3D harmonic trap. Levels E = n·ħω hold g = (n+1)(n+2)/2 states;
// occupations follow Bose–Einstein (bosons) or Fermi–Dirac (fermions), with the chemical potential
// solved exactly for this N. The picture is a time-of-flight image like the 1995 JILA one: the
// thermal cloud's column density is the semiclassical ±Li₂(±ζ e^(−q)) profile; the condensate is a
// Thomas–Fermi blob. The trap is 3× tighter vertically, so on release the condensate flips from
// a lying to a standing shape while the thermal cloud becomes round.

const N = 120;
const ZETA3 = 1.2020569;
const TC = Math.cbrt(N / ZETA3); // k·Tc in units of ħω (≈ 4.64)
const NMAX = 90;
const LAMBDA = 1 / 3; // horizontal / vertical trap frequency
const G = Array.from({ length: NMAX + 1 }, (_, n) => ((n + 1) * (n + 2)) / 2);
const EF = (() => {
  let s = 0, n = 0;
  while (s + G[n] <= N) s += G[n++];
  return n - 1 + (N - s) / G[n];
})();

/** Dilogarithm Li₂(z) for real z ≤ 1. */
function li2(z) {
  if (z === 0) return 0;
  if (z === 1) return Math.PI ** 2 / 6;
  if (z < 0) {
    // Landen: maps any negative z into (0, 1)
    const w = z / (z - 1);
    return -li2(w) - 0.5 * Math.log(1 - z) ** 2;
  }
  if (z > 0.5) return Math.PI ** 2 / 6 - Math.log(z) * Math.log(1 - z) - li2(1 - z);
  let s = 0, p = z;
  for (let k = 1; k < 60; k++, p *= z) s += p / (k * k);
  return s;
}

/** Chemical potential (in ħω, ground level = 0) and level occupations at temperature t (in ħω). */
function solve(t, fermi) {
  const occ = (mu) => G.map((g, n) => g / (Math.exp((n - mu) / t) + (fermi ? 1 : -1)));
  const total = (mu) => occ(mu).reduce((a, b) => a + b, 0);
  let lo = -60 * t - 60, hi = fermi ? NMAX : -1e-12;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (total(mid) > N) hi = mid;
    else lo = mid;
  }
  const mu = (lo + hi) / 2;
  return { mu, occ: occ(mu) };
}

export default {
  id: 'bec',
  title: 'Bose–Einstein Condensate: The Fifth State of Matter',
  category: 'quantum',
  tagline: 'Cool atoms to a millionth of a degree and thousands of them merge into one giant quantum wave.',
  ages: ['16+'],
  topics: ['Quantum', 'Thermodynamics', 'States of matter'],
  keywords: ['bose einstein condensate', 'bec', 'bosons', 'fermions', 'pauli exclusion', 'ultracold atoms', 'laser cooling', 'superfluid', 'jila 1995', 'quantum statistics', 'fifth state of matter'],
  blurb:
    'Predicted by Bose and Einstein in 1924 and first made in 1995, a Bose–Einstein condensate forms when a gas of atoms is cooled so far that a large share of them drop into the very same lowest quantum state and act as one. Here 120 atoms sit in a magnetic trap; the energy ladder shows where they are, and the 3D picture shows what scientists photograph after switching the trap off.',
  ideas: [
    'Particles come in two kinds: <b>bosons</b> can share a quantum state; <b>fermions</b> can’t (Pauli exclusion).',
    'Below a <b>critical temperature</b> Tc, bosons pile into the lowest state: a <b>condensate</b>.',
    'In an ideal trapped gas the condensed share is <b>1 − (T/Tc)³</b>.',
    'A condensate is one big <b>matter wave</b>: its shape on release reflects the trap, not the temperature.',
    'Fermions instead stack up to the <b>Fermi energy</b>, the reason atoms have shells and stars can be held up by electrons.',
  ],
  hint: 'Lower the temperature through Tc and watch the peak rise',
  renderScale: 1,
  thumbChapter: 3,
  thumbFrames: 200,
  params: [
    { key: 'T', label: 'Temperature (in units of Tc)', type: 'range', min: 0.03, max: 2, step: 0.01, value: 0.6 },
    { key: 'kind', label: 'Atoms', type: 'select', value: 'boson', options: [
      { value: 'boson', label: 'Bosons' }, { value: 'fermion', label: 'Fermions' },
    ] },
    { key: 'release', label: 'Switch off the trap (time of flight)', type: 'toggle', value: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.25, max: 2, step: 0.05, value: 1, unit: '×' },
  ],
  story: [
    {
      title: 'A cloud of cold atoms',
      text: 'Lasers and magnetic traps can cool a puff of rubidium atoms to a few <b>millionths of a degree</b> above absolute zero. The ladder shows the trap’s energy levels and how many of our 120 atoms sit on each; the 3D picture shows the cloud’s density, photographed after the trap is switched off. Warm (T = 1.6 Tc), atoms spread over many levels in a smooth hump.',
      params: { T: 1.6, kind: 'boson', release: true, speed: 1 },
      duration: 15,
    },
    {
      title: 'Cooling towards Tc',
      text: 'Cooling squeezes the atoms into fewer, lower levels and the hump narrows. Each atom is also a wave, and its wavelength grows as it slows. Near the <b>critical temperature</b> the waves of neighbouring atoms start to overlap.',
      params: { T: 1.02, kind: 'boson' },
      tween: 6,
      duration: 13,
    },
    {
      title: 'The condensate appears',
      text: 'Below Tc something dramatic happens: a sharp <b>spike</b> rises out of the hump. The extra atoms all drop into the <b>single lowest level</b>. They are bosons, and bosons are happy to share one quantum state, the more the better.',
      check: {
        q: 'Cool a gas of bosons below Tc. Where do the extra atoms go?',
        options: ['Evenly over all the levels', 'Into the single lowest level', 'They escape the trap'],
        answer: 1,
        setup: { T: 1.02, kind: 'boson' },
        explain: 'Below Tc the higher levels can only hold a limited number of atoms at that temperature; every atom beyond that collects in the ground state. That pile-up is the Bose–Einstein condensate.',
      },
      params: { T: 0.7, kind: 'boson' },
      tween: 4,
      duration: 15,
    },
    {
      title: 'Almost pure condensate',
      text: 'At T = 0.2 Tc nearly every atom shares one state: <b>a single quantum wave</b> big enough to photograph. In a large cloud the condensed share is 1 − (T/Tc)³; our small cloud of 120 atoms condenses a little later. Eric Cornell and Carl Wieman made the first one in Colorado in June 1995 and Wolfgang Ketterle soon after; they shared the <b>2001 Nobel Prize</b>.',
      formula: 'N₀ / N = 1 − (T/Tc)³',
      params: { T: 0.2, kind: 'boson', release: true },
      tween: 3,
      duration: 15,
    },
    {
      title: 'The tell-tale shape',
      text: 'Watch the trap switch off. The trap squeezes harder vertically, so in the trap the condensate lies flat. Released, it expands fastest in the direction it was squeezed (a wave’s uncertainty principle) and ends up <b>standing up</b>. A thermal cloud just spreads into a circle. This shape flip was the proof in 1995.',
      params: { T: 0.45, kind: 'boson', release: true, speed: 0.8 },
      duration: 17,
    },
    {
      title: 'Fermions can’t do it',
      text: 'Swap in <b>fermions</b> (like potassium-40, or electrons). The Pauli exclusion principle allows only one per state, so even at the lowest temperature they stack up the ladder to the <b>Fermi energy</b>: no spike, just a broad, flat-topped cloud. This same stacking gives atoms their electron shells and holds up white dwarf stars.',
      check: {
        q: 'Cool fermions as far as you like. What does the cloud look like?',
        options: ['A sharp condensate spike', 'A broad cloud that stops shrinking', 'It vanishes'],
        answer: 1,
        setup: { T: 0.2, kind: 'boson' },
        explain: 'Each fermion needs its own state, so the lowest levels fill up and the rest must sit higher. The cloud keeps a minimum size set by the Fermi energy, however cold it gets.',
      },
      params: { T: 0.06, kind: 'fermion', release: true, speed: 1 },
      duration: 17,
    },
    {
      title: 'Why it matters',
      text: 'Condensates flow without friction (<b>superfluids</b>), form vortices, and can be split and recombined as <b>atom lasers</b> for ultra-precise sensors. Superconductivity is a cousin: electrons pair up into bosons that condense. NASA’s Cold Atom Lab makes condensates on the International Space Station.',
      params: { T: 0.35, kind: 'boson', release: true, speed: 1 },
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Slide the temperature through Tc, switch between bosons and fermions, and watch the cloud in the trap or after release.',
      params: { T: 0.6, kind: 'boson', release: true, speed: 1 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let cache = null, clock = 0;
    const GX = 64, GY = 46;
    // top-down "camera" image, like the absorption photos taken in the lab
    const cam = document.createElement('canvas');
    cam.width = GX;
    cam.height = GY;
    const cctx = cam.getContext('2d');
    const camImg = cctx.createImageData(GX, GY);

    function state() {
      const key = params.T.toFixed(3) + params.kind;
      if (cache?.key === key) return cache;
      const fermi = params.kind === 'fermion';
      const t = params.T * TC;
      const { mu, occ } = solve(t, fermi);
      const n0 = fermi ? 0 : occ[0];
      // thermal profile F(q) on a table of q = (x/σx)² + (y/σy)², and its 2D integral
      const zeta = Math.exp(mu / t);
      const Q = 400, qmax = 30, F = new Float64Array(Q + 1);
      let integral = 0;
      for (let i = 0; i <= Q; i++) {
        const u = zeta * Math.exp(-(i / Q) * qmax);
        F[i] = fermi ? -li2(-u) : li2(Math.min(u, 1));
        integral += F[i] * (qmax / Q) * (i === 0 || i === Q ? 0.5 : 1);
      }
      // for bosons the ground level is drawn as the condensate, so the cloud holds the rest
      const nth = Math.max(0, N - n0);
      cache = { key, fermi, t, mu, occ, n0, F, Q, qmax, integral: integral * Math.PI, nth };
      return cache;
    }

    /** Density image at expansion time τ (in units of 1/ω_vertical). */
    function image(st, tau) {
      // in-trap thermal widths ∝ √T/ω; ballistic expansion √(1 + ω²τ²)
      const s0 = 0.085 * Math.sqrt(Math.max(st.t, 0.4 * EF * (st.fermi ? 1 : 0)) / TC);
      const sx = (s0 / LAMBDA) * Math.sqrt(1 + (LAMBDA * tau) ** 2) * 0.55, sy = s0 * Math.sqrt(1 + tau * tau) * 0.55;
      // Thomas–Fermi condensate: radii ∝ 1/ω, tight axis expands like √(1 + τ²)
      const R0 = 0.05 * Math.pow(Math.max(st.n0, 1) / N, 0.2);
      // Castin–Dum scaling for a cigar-shaped trap: the weak axis barely grows
      const rx = (R0 / LAMBDA) * (1 + LAMBDA ** 2 * (tau * Math.atan(tau) - Math.log(Math.sqrt(1 + tau * tau))));
      const ry = R0 * Math.sqrt(1 + tau * tau);
      const out = new Float64Array(GX * GY);
      const thNorm = st.nth / (st.integral * sx * sy || 1);
      const bcNorm = st.n0 / (Math.PI * 0.4 * rx * ry);
      for (let j = 0; j < GY; j++)
        for (let i = 0; i < GX; i++) {
          const x = (i / (GX - 1) - 0.5) * 1.6, y = (j / (GY - 1) - 0.5) * 1.6;
          const q = (x / sx) ** 2 + (y / sy) ** 2;
          const k = Math.min(st.Q, Math.round((q / st.qmax) * st.Q));
          let v = q < st.qmax ? st.F[k] * thNorm : 0;
          const qc = (x / rx) ** 2 + (y / ry) ** 2;
          if (st.n0 > 0 && qc < 1) v += bcNorm * (1 - qc) ** 1.5;
          out[j * GX + i] = v;
        }
      return out;
    }

    return {
      update(dt) {
        clock += dt * params.speed;
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const st = state();
        const narrow = w < 700;
        // release cycle: 1 s in the trap, 3 s expanding, 2 s holding
        const cyc = clock % 6;
        const tau = params.release ? (cyc < 1 ? 0 : Math.min(cyc - 1, 3) * 3.4) : 0;
        const dens = image(st, tau);
        let max = 0;
        for (const v of dens) max = Math.max(max, v);
        // a gentle power curve keeps the thermal cloud visible beside a tall condensate spike
        for (let n = 0; n < dens.length; n++) dens[n] = Math.pow(dens[n] / (max || 1), 0.6);
        max = 1;

        // the 3D density landscape, drawn as ridge lines back to front
        const box = api.thumbnail
          ? { x: 0, y: h * 0.12, w, h: h * 0.86 }
          : narrow
            ? { x: 12, y: 70, w: w - 24, h: Math.min(h * 0.42, w * 0.85) }
            : { x: w * 0.36, y: 80, w: w * 0.6, h: h * 0.62 };
        const skew = box.w * 0.18;
        const rowGap = (box.h * 0.55) / (GY - 1);
        const peak = box.h * 0.5;
        const lut = CMAPS.inferno;
        for (let j = 0; j < GY; j++) {
          const by = box.y + box.h * 0.4 + j * rowGap;
          const bx = box.x + (j / (GY - 1)) * skew * -1 + skew * 0.5;
          const cw = box.w - skew;
          const pts = [];
          for (let i = 0; i < GX; i++) {
            const v = dens[j * GX + i] / (max || 1);
            pts.push([bx + (i / (GX - 1)) * cw, by - v * peak, v]);
          }
          // occlude the rows behind
          ctx.fillStyle = '#070912';
          ctx.beginPath();
          ctx.moveTo(pts[0][0], by + 1);
          for (const [x, y] of pts) ctx.lineTo(x, y);
          ctx.lineTo(pts[GX - 1][0], by + 1);
          ctx.closePath();
          ctx.fill();
          ctx.lineWidth = 1.3;
          for (let i = 1; i < GX; i++) {
            const v = Math.max(pts[i][2], pts[i - 1][2]);
            const c = Math.round(clamp(0.15 + v * 0.85, 0, 1) * 255) * 3;
            ctx.strokeStyle = `rgb(${lut[c]},${lut[c + 1]},${lut[c + 2]})`;
            ctx.beginPath();
            ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
            ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.stroke();
          }
        }
        if (api.thumbnail) return;
        const phase = !params.release ? 'in the trap' : cyc < 1 ? 'in the trap' : cyc < 4 ? 'trap off: expanding' : 'photographed';
        // the camera view from above, where the shape flip is easy to see
        const cs = Math.round(Math.min(narrow ? 100 : 170, box.w * 0.3));
        const ch = cs; // the image covers the same distance across and down
        const camX = box.x + box.w - cs, camY = box.y - (narrow ? 2 : 14);
        const d = camImg.data;
        for (let n = 0; n < GX * GY; n++) {
          const c = Math.round(clamp(dens[n], 0, 1) * 255) * 3;
          d[n * 4] = lut[c];
          d[n * 4 + 1] = lut[c + 1];
          d[n * 4 + 2] = lut[c + 2];
          d[n * 4 + 3] = 255;
        }
        cctx.putImageData(camImg, 0, 0);
        ctx.drawImage(cam, camX, camY, cs, ch);
        ctx.strokeStyle = 'rgba(200,210,240,0.3)';
        ctx.strokeRect(camX - 0.5, camY - 0.5, cs + 1, ch + 1);
        text(ctx, 'camera, from above', camX + cs / 2, camY + ch + 11, { size: 10, align: 'center', color: C.dim });
        tag(ctx, phase, camX + cs / 2, camY + ch + 30, phase === 'in the trap' ? C.cyan : C.amber, { align: 'center' });

        // the energy ladder
        const lad = narrow
          ? { x: 56, y: box.y + box.h + 30, w: w - 90, h: Math.min(h - (box.y + box.h + 30) - 56, 220) }
          : { x: 70, y: 100, w: Math.min(w * 0.25, 240), h: Math.min(h * 0.4, 280) };
        if (lad.h < 80) return;
        const levels = 12;
        text(ctx, st.fermi ? 'energy levels (fermions)' : 'energy levels (bosons)', lad.x - 24, lad.y - 18, { size: 11, color: C.dim });
        const most = st.fermi ? Math.max(...G.slice(0, levels)) : N;
        for (let n = 0; n < levels; n++) {
          const y = lad.y + lad.h - (n / (levels - 1)) * lad.h;
          ctx.strokeStyle = 'rgba(200,210,240,0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lad.x, y);
          ctx.lineTo(lad.x + lad.w, y);
          ctx.stroke();
          if (st.fermi) {
            // capacity of the level: one fermion per state
            ctx.strokeStyle = rgba(C.violet, 0.5);
            ctx.strokeRect(lad.x, y - 4, (G[n] / most) * lad.w, 8);
          }
          const o = st.occ[n];
          const col = n === 0 && !st.fermi ? C.amber : st.fermi ? C.violet : C.cyan;
          ctx.fillStyle = col;
          ctx.fillRect(lad.x, y - 4, clamp(o / most, 0, 1) * lad.w, 8);
          if (n % 2 === 0 || n === 1) text(ctx, `${n}`, lad.x - 10, y, { size: 10, align: 'right', color: C.dim, mono: true });
          if (o >= 0.5) text(ctx, o.toFixed(o < 10 ? 1 : 0), lad.x + clamp(o / most, 0, 1) * lad.w + 6, y, { size: 10, color: C.ink, mono: true });
        }
        if (st.fermi) {
          const y = lad.y + lad.h - (EF / (levels - 1)) * lad.h;
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = C.pink;
          ctx.beginPath();
          ctx.moveTo(lad.x, y);
          ctx.lineTo(lad.x + lad.w, y);
          ctx.stroke();
          ctx.setLineDash([]);
          text(ctx, 'Fermi energy', lad.x + lad.w, y - 9, { size: 10, align: 'right', color: C.pink });
        }
      },
      stats() {
        const st = state();
        const out = [
          { label: 'Atoms', value: String(N) },
          { label: 'Temperature', value: `${params.T.toFixed(2)} Tc` },
        ];
        if (st.fermi) {
          out.push({ label: 'Atoms in the lowest level', value: st.occ[0].toFixed(2) + ' (max 1)', color: C.violet });
          out.push({ label: 'T / Fermi temperature', value: ((params.T * TC) / EF).toFixed(2) });
        } else {
          out.push({ label: 'Atoms in the lowest level', value: st.n0.toFixed(1), color: C.amber });
          out.push({ label: 'Condensed share', value: `${((100 * st.n0) / N).toFixed(1)}%`, color: C.amber });
          out.push({ label: 'Large-cloud formula 1 − (T/Tc)³', value: `${(100 * Math.max(0, 1 - params.T ** 3)).toFixed(1)}%` });
        }
        return out;
      },
      charts() {
        const st = state();
        return [{ title: 'Atoms on each energy level', kind: 'bars', series: [{ data: st.occ.slice(0, 16), color: st.fermi ? C.violet : C.cyan }], min: 0 }];
      },
    };
  },
};
