import { C, backdrop, clamp, drawGlow, rand, roundRect, tag, text, TAU } from '../../core/util.js';

// Emission and absorption spectra. Wavelengths come from real energy levels: λ (nm) = 1239.84 / ΔE (eV).

const HC = 1239.84;
const L0 = 380, L1 = 750; // visible range shown on the spectroscope

/** Energy levels (eV above the ground state) and allowed downward jumps [from, to, weight]. */
const ATOMS = {
  H: {
    name: 'Hydrogen',
    levels: [1, 2, 3, 4, 5, 6].map((n) => ({ name: `n = ${n}`, E: 13.6 * (1 - 1 / (n * n)) })),
    jumps: (() => {
      const j = [];
      for (let a = 1; a < 6; a++) for (let b = 0; b < a; b++) j.push([a, b, b === 1 ? 2 : 1]);
      return j;
    })(),
    excite: [0, 0.5, 0.9, 1, 0.8, 0.6],
  },
  Na: {
    name: 'Sodium',
    levels: [
      { name: '3s', E: 0 }, { name: '3p', E: 2.104 }, { name: '4s', E: 3.191 }, { name: '3d', E: 3.617 },
      { name: '4p', E: 3.753 }, { name: '5s', E: 4.116 }, { name: '4d', E: 4.284 },
    ],
    jumps: [[1, 0, 1], [2, 1, 1], [3, 1, 1], [4, 0, 3], [4, 2, 0.5], [4, 3, 0.3], [5, 1, 1], [5, 4, 0.3], [6, 1, 1], [6, 4, 0.3]],
    excite: [0, 3, 0.6, 0.6, 0.5, 0.5, 0.5],
  },
  Li: {
    name: 'Lithium',
    levels: [{ name: '2s', E: 0 }, { name: '2p', E: 1.848 }, { name: '3s', E: 3.373 }, { name: '3p', E: 3.834 }, { name: '3d', E: 3.879 }],
    jumps: [[1, 0, 1], [2, 1, 1], [3, 0, 2], [3, 2, 0.4], [4, 1, 1]],
    excite: [0, 3, 0.7, 0.7, 0.8],
  },
};
// lines used for flames, fireworks and the Sun (nm). Strontium, barium and copper glow mostly from molecules (SrCl, BaCl, CuCl) in the flame, which give bands.
const LINES = {
  H: [656.3, 486.1, 434.0, 410.2],
  Na: [589.0, 589.6],
  Li: [670.8, 610.4],
  Sr: [606, 636, 646, 659, 662, 668, 682],
  Ba: [507, 513, 524, 532, 553.5],
  Cu: [420, 428, 436, 444, 452, 488],
};
const SHELLS = {
  Sr: { col: '#ff3346', name: 'strontium: red' },
  Na: { col: '#ffc23a', name: 'sodium: yellow' },
  Ba: { col: '#57ff7a', name: 'barium: green' },
  Cu: { col: '#3d82ff', name: 'copper: blue' },
};
const SUN_LINES = [
  { nm: 656.3, el: 'H', label: 'H' }, { nm: 589.3, el: 'Na', label: 'Na' }, { nm: 527.0, el: 'Fe', label: 'Fe' },
  { nm: 517.3, el: 'Mg', label: 'Mg' }, { nm: 486.1, el: 'H', label: 'H' }, { nm: 438.4, el: 'Fe', label: 'Fe' },
  { nm: 434.0, el: 'H', label: 'H' }, { nm: 430.8, el: 'Ca', label: 'Ca' }, { nm: 410.2, el: 'H', label: 'H' }, { nm: 393.4, el: 'Ca', label: 'Ca' },
];

/** Approximate sRGB colour of a pure wavelength. */
function nmRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) (r = -(nm - 440) / 60), (b = 1);
  else if (nm < 490) (g = (nm - 440) / 50), (b = 1);
  else if (nm < 510) (g = 1), (b = -(nm - 510) / 20);
  else if (nm < 580) (r = (nm - 510) / 70), (g = 1);
  else if (nm < 645) (r = 1), (g = -(nm - 645) / 65);
  else r = 1;
  const f = nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (750 - nm)) / 50 : 1;
  return [r, g, b].map((v) => Math.round(255 * clamp(v * f, 0, 1) ** 0.8));
}
const nmCSS = (nm, a = 1) => `rgba(${nmRGB(nm).join(',')},${a})`;
const visible = (nm) => nm >= L0 && nm <= L1;

export default {
  id: 'spectra',
  title: 'Why Fireworks Have Colours',
  category: 'chemistry',
  tagline: 'Electrons jumping between energy levels paint fireworks, streetlights and the fingerprints of stars.',
  ages: ['14-16', '16+'],
  topics: ['Atoms', 'Light', 'Spectroscopy'],
  keywords: ['flame test', 'emission spectrum', 'absorption', 'energy levels', 'photon', 'spectroscope', 'Fraunhofer lines', 'helium', 'sodium', 'strontium'],
  blurb:
    'Heat an element and it glows in its own colours. Each electron can only sit on certain energy levels, like the rungs of a ladder, and when it drops from one rung to a lower one it gives out a photon whose colour is fixed by the size of the drop. Every element has its own pattern of colours: a fingerprint we can read in fireworks, in the lab, and in the light of the stars.',
  ideas: [
    'Electrons in an atom can only have certain <b>energies</b>: the levels are like rungs on a ladder.',
    'Heat knocks an electron up; when it falls back it emits a <b>photon</b> carrying exactly the energy difference.',
    'A bigger drop gives a bluer photon: λ = hc / ΔE.',
    'Every element has its own set of levels, so its own set of <b>spectral lines</b>: a fingerprint.',
    'Cool gas absorbs the same colours it would emit, so dark lines in starlight reveal what stars are made of.',
  ],
  hint: 'Switch views, pick an element, or click the sky to launch a firework',
  thumbChapter: 1,
  thumbFrames: 260,
  params: [
    { key: 'scene', label: 'View', type: 'select', value: 'fireworks', options: [{ value: 'fireworks', label: 'Fireworks' }, { value: 'atom', label: 'Inside the atom' }, { value: 'sun', label: 'Sunlight' }] },
    { key: 'el', label: 'Element', type: 'select', value: 'H', options: Object.entries(ATOMS).map(([k, a]) => ({ value: k, label: a.name })) },
    { key: 'heat', label: 'Flame heat (how often electrons are knocked up)', type: 'range', min: 0.2, max: 3, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'shell', label: 'Fireworks', type: 'select', value: 'mix', options: [{ value: 'mix', label: 'All colours' }, ...Object.entries(SHELLS).map(([k, s]) => ({ value: k, label: s.name }))] },
    { key: 'compare', label: 'Overlay the element’s lines on sunlight', type: 'toggle', value: false },
    { key: 'clear', label: 'Clear the spectroscope', type: 'button', action: (s) => s.clearSpec() },
  ],
  story: [
    {
      title: 'Colours from chemicals',
      text: 'A firework’s colour comes from a pinch of a metal compound: strontium burns red, sodium yellow, barium green and copper blue. The spectroscope at the bottom splits the light, like a prism, and shows that each colour is really a handful of sharp <b>lines</b>.',
      params: { scene: 'fireworks', shell: 'mix', heat: 1 },
      enter: (s) => s.clearSpec(),
      duration: 14,
    },
    {
      title: 'A ladder of energies',
      text: 'Zoom into a single hydrogen atom. Its electron can only have certain energies, shown as rungs on a ladder; nothing in between is allowed. In the heat of a flame, collisions knock the electron up to a higher rung.',
      params: { scene: 'atom', el: 'H', heat: 0.8 },
      enter: (s) => s.clearSpec(),
      duration: 14,
    },
    {
      title: 'Falling back makes light',
      text: 'A raised electron soon drops to a lower rung and gives out a photon carrying exactly the energy it lost. Drops onto the second rung give hydrogen’s visible lines: red, cyan, blue and violet. Drops to the bottom rung are too energetic to see (ultraviolet).',
      formula: 'λ = hc / ΔE   ≈   1240 nm·eV / ΔE',
      params: { scene: 'atom', el: 'H', heat: 1.6 },
      duration: 16,
    },
    {
      title: 'Bigger drop, bluer light',
      text: 'Compare the jumps that end on the second rung: from rung 3 gives red at 656 nm, from rung 4 cyan at 486 nm, from rung 5 blue at 434 nm.',
      check: {
        q: 'An electron falls further, between two rungs that are further apart. Its light is…',
        options: ['bluer', 'redder', 'the same colour, but brighter'],
        answer: 0,
        setup: { scene: 'atom', el: 'H' },
        explain: 'A bigger drop releases more energy, and a more energetic photon has a shorter wavelength: towards blue and violet. Small drops give red or invisible infrared light.',
      },
      params: { scene: 'atom', el: 'H', heat: 1.6 },
      duration: 14,
    },
    {
      title: 'Sodium’s yellow',
      text: 'Sodium’s outer electron has a favourite drop of 2.1 eV, from the 3p level to the ground. It gives the intense yellow line at 589 nm: the glow of old streetlights and of salt sprinkled into a flame. Its other drops are weak or invisible infrared.',
      params: { scene: 'atom', el: 'Na', heat: 1.4 },
      enter: (s) => s.clearSpec(),
      duration: 15,
    },
    {
      title: 'Fingerprints of the elements',
      text: 'Every element has its own ladder, so its own lines. Lithium glows crimson at 671 nm. In 1860 Robert Bunsen and Gustav Kirchhoff spotted two unknown blue lines in mineral water and discovered a new element, caesium, without ever seeing it; rubidium followed a year later.',
      params: { scene: 'atom', el: 'Li', heat: 1.4 },
      enter: (s) => s.clearSpec(),
      duration: 15,
    },
    {
      title: 'Reading the Sun',
      text: 'Spread sunlight out and the rainbow is crossed by dark lines. Cooler gas in the Sun’s outer layers absorbs exactly the colours its atoms would emit. Line them up with hydrogen and sodium and they match: we know what the Sun is made of without going there. Helium was found this way in the Sun in 1868, 27 years before it was found on Earth.',
      params: { scene: 'sun', el: 'Na', compare: true },
      duration: 17,
    },
    {
      title: 'What is in that star?',
      text: 'Astronomers do this for millions of stars and galaxies.',
      check: {
        q: 'A star’s spectrum has dark lines at 589 nm. What does that tell us?',
        options: ['Sodium atoms are in the star’s atmosphere', 'The star is yellow', 'The star is moving away from us'],
        answer: 0,
        setup: { scene: 'sun', el: 'Na', compare: true },
        explain: 'Only sodium has that pair of levels 2.1 eV apart, so only sodium absorbs at 589 nm. The overall colour of a star is set by its temperature; the lines tell us its ingredients (and, if they are shifted, its motion).',
      },
      params: { scene: 'sun', el: 'H', compare: true },
      duration: 14,
    },
    {
      title: 'Explore',
      text: 'Launch fireworks by clicking the sky, zoom into hydrogen, sodium and lithium atoms, and compare each element’s lines with sunlight.',
      params: { scene: 'fireworks', shell: 'mix' },
      enter: (s) => s.clearSpec(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let spec = new Map(); // wavelength → brightness on the spectroscope
    let photons = [], electron = { lv: 0, from: 0, t: 1, wait: 0.5 }, kicks = [], shells = [], sparks = [], launchT = 0;
    let counts = { photons: 0, visible: 0 };
    const narrow = () => api.w < 760;

    function clearSpec() {
      spec = new Map();
      photons = [];
      counts = { photons: 0, visible: 0 };
    }
    function light(nm, amount) {
      spec.set(nm, Math.min(1, (spec.get(nm) || 0) + amount));
    }
    // ---------------------------------------------------------------- layout
    function lay() {
      const { w, h } = api;
      if (narrow()) {
        return { lad: { x: 70, y0: 110, x1: w - 30, y1: h * 0.52 }, strip: { x: 16, y: h * 0.6, w: w - 32, h: 46 } };
      }
      const sx = Math.max(520, w * 0.46);
      return { lad: { x: 120, y0: 150, x1: sx - 70, y1: Math.min(h - 360, 560) }, strip: { x: sx, y: Math.min(h * 0.42, 380), w: w - sx - 30, h: 64 } };
    }
    const atom = () => ATOMS[params.el] || ATOMS.H;
    // spacing stretched towards the top (the upper levels crowd together), but the energies quoted are the real ones
const levelY = (E, A, la) => la.y1 - (E / A.levels.at(-1).E) ** 3 * (la.y1 - la.y0);
    const stripX = (nm, st) => st.x + ((nm - L0) / (L1 - L0)) * st.w;

    function updateAtom(dt) {
      const A = atom();
      const la = lay().lad, st = lay().strip;
      if (electron.lv >= A.levels.length) electron.lv = 0;
      electron.t = Math.min(1, electron.t + dt * 5);
      electron.wait -= dt;
      if (electron.wait > 0) return;
      if (electron.lv === 0) {
        // a hot collision kicks the electron up
        const ws = A.excite, tot = ws.reduce((a, b) => a + b, 0);
        let r = Math.random() * tot, k = 1;
        for (; k < ws.length; k++) if ((r -= ws[k]) <= 0) break;
        electron.from = 0;
        electron.lv = Math.min(k, A.levels.length - 1);
        electron.t = 0;
        electron.wait = rand(0.35, 0.8);
        kicks.push({ t: 0, y: levelY(A.levels[electron.lv].E, A, la) });
      } else {
        // fall to a lower level, giving out a photon of exactly the energy lost
        const opts = A.jumps.filter((j) => j[0] === electron.lv);
        const tot = opts.reduce((a, j) => a + j[2], 0);
        let r = Math.random() * tot, pick = opts[0];
        for (const j of opts) if ((r -= j[2]) <= 0) {
          pick = j;
          break;
        }
        const dE = A.levels[pick[0]].E - A.levels[pick[1]].E;
        const nm = HC / dE;
        const y = (levelY(A.levels[pick[0]].E, A, la) + levelY(A.levels[pick[1]].E, A, la)) / 2;
        photons.push({ x: la.x + 120, y, nm, t: 0, tx: visible(nm) ? stripX(nm, st) : nm < L0 ? st.x - 10 : st.x + st.w + 10, ty: st.y + st.h / 2 });
        counts.photons++;
        if (visible(nm)) counts.visible++;
        electron.from = pick[0];
        electron.lv = pick[1];
        electron.t = 0;
        electron.wait = pick[1] === 0 ? rand(0.4, 1.4) / params.heat : rand(0.25, 0.6);
      }
    }
    function launch(x, kind) {
      const keys = Object.keys(SHELLS);
      const k = kind || (params.shell === 'mix' ? keys[Math.floor(Math.random() * keys.length)] : params.shell);
      shells.push({ x, y: api.h + 10, vy: -rand(380, 470), top: api.h * rand(0.18, 0.36), k });
    }
    function burst(s) {
      const n = api.thumbnail ? 60 : 110;
      for (let i = 0; i < n; i++) {
        const a = rand(TAU), v = rand(60, 210);
        sparks.push({ x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rand(1.4, 2.2), k: s.k });
      }
      for (const nm of LINES[s.k]) light(nm, 0.5);
    }

    return {
      clearSpec,
      reset: clearSpec,
      resize() {},
      pointerDown(p) {
        if (params.scene === 'fireworks') launch(p.x);
      },
      onParam(k) {
        if (k === 'el') {
          electron = { lv: 0, from: 0, t: 1, wait: 0.3 };
          photons = [];
        }
      },
      update(dt) {
        dt = Math.min(dt, 0.05);
        for (const [nm, v] of spec) spec.set(nm, v * (1 - dt * 0.04));
        if (params.scene === 'atom') {
          updateAtom(dt);
          for (const p of photons) p.t += dt * 0.9;
          for (const p of photons) if (p.t >= 1 && !p.done) {
            p.done = true;
            if (visible(p.nm)) light(Math.round(p.nm * 10) / 10, 0.35);
          }
          photons = photons.filter((p) => p.t < 1.3);
          for (const k of kicks) k.t += dt;
          kicks = kicks.filter((k) => k.t < 0.5);
        } else if (params.scene === 'fireworks') {
          launchT -= dt;
          if (launchT <= 0) {
            launchT = rand(0.7, 1.5);
            launch(api.w * rand(0.15, narrow() ? 0.85 : 0.75));
          }
          for (const s of shells) {
            s.y += s.vy * dt;
            s.vy += 160 * dt;
            if (s.y <= s.top || s.vy >= 0) {
              s.done = true;
              burst(s);
            }
          }
          shells = shells.filter((s) => !s.done);
          for (const p of sparks) {
            p.t += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 1 - dt * 0.9;
            p.vy = p.vy * (1 - dt * 0.9) + 60 * dt;
          }
          sparks = sparks.filter((p) => p.t < p.life);
        }
      },
      draw() {
        const { w, h } = api;
        if (params.scene === 'fireworks') this.drawFireworks(w, h);
        else if (params.scene === 'atom') this.drawAtom(w, h);
        else this.drawSun(w, h);
      },
      drawStrip(st, title) {
        ctx.fillStyle = 'rgba(4,6,14,0.92)';
        ctx.strokeStyle = 'rgba(160,175,230,0.3)';
        ctx.lineWidth = 1;
        roundRect(ctx, st.x - 8, st.y - 26, st.w + 16, st.h + 52, 10);
        ctx.fill();
        ctx.stroke();
        text(ctx, title, st.x, st.y - 13, { size: 10, color: C.dim, shadow: false });
        // faint rainbow guide
        for (let i = 0; i < st.w; i += 2) {
          ctx.fillStyle = nmCSS(L0 + (i / st.w) * (L1 - L0), 0.08);
          ctx.fillRect(st.x + i, st.y, 2, st.h);
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const [nm, v] of spec) {
          if (v < 0.01) continue;
          const x = stripX(nm, st);
          ctx.fillStyle = nmCSS(nm, Math.min(1, v * 1.4));
          ctx.fillRect(x - 1.5, st.y, 3, st.h);
          drawGlow(ctx, x, st.y + st.h / 2, 8 + v * 14, nmCSS(nm), 0.25 * v);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (const nm of [400, 500, 600, 700]) {
          const x = stripX(nm, st);
          ctx.fillStyle = 'rgba(233,237,247,0.4)';
          ctx.fillRect(x, st.y + st.h, 1, 5);
          text(ctx, `${nm} nm`, x, st.y + st.h + 14, { size: 9, align: 'center', color: C.dim, shadow: false });
        }
      },
      drawFireworks(w, h) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#02030a');
        g.addColorStop(1, '#0b1030');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // skyline
        ctx.fillStyle = '#04050b';
        for (let x = 0, i = 0; x < w; i++) {
          const bw = 30 + ((i * 37) % 50), bh = 30 + ((i * 53) % 70);
          ctx.fillRect(x, h - bh, bw, bh);
          x += bw;
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const s of shells) drawGlow(ctx, s.x, s.y, 10, '#ffe2b0', 0.4);
        for (const p of sparks) {
          const a = 1 - p.t / p.life;
          ctx.strokeStyle = SHELLS[p.k].col;
          ctx.globalAlpha = a;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 0.06, p.y - p.vy * 0.06);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
          drawGlow(ctx, p.x, p.y, 12 * a + 3, SHELLS[p.k].col, 0.35 * a);
        }
        // the whole burst lights up the sky a little
        const recent = sparks.filter((p) => p.t < 0.5);
        if (recent.length) drawGlow(ctx, recent[0].x, recent[0].y, 160, SHELLS[recent[0].k].col, 0.04);
        ctx.globalCompositeOperation = 'source-over';
        if (api.thumbnail) return;
        const st = narrow() ? { x: 16, y: h - 90, w: w - 32, h: 40 } : { x: Math.max(520, w * 0.46), y: h - 150, w: w - Math.max(520, w * 0.46) - 30, h: 54 };
        this.lastStrip = st;
        this.drawStrip(st, 'spectroscope: the light split into its colours');
        const seen = new Set(sparks.map((p) => p.k));
        let i = 0;
        for (const k of Object.keys(SHELLS)) if (seen.has(k)) tag(ctx, SHELLS[k].name, w - 16, 84 + 26 * i++, SHELLS[k].col, { align: 'right', size: 11 });
      },
      drawAtom(w, h) {
        backdrop(ctx, w, h, { center: '#0b0f22' });
        const A = atom(), { lad: la, strip: st } = lay();
        // the ladder
        for (let i = 0; i < A.levels.length; i++) {
          const y = levelY(A.levels[i].E, A, la);
          ctx.strokeStyle = i === 0 ? 'rgba(233,237,247,0.85)' : 'rgba(233,237,247,0.5)';
          ctx.lineWidth = i === 0 ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(la.x, y);
          ctx.lineTo(la.x + 240 > la.x1 ? la.x1 : la.x + 240, y);
          ctx.stroke();
          if (!api.thumbnail) {
            text(ctx, A.levels[i].name, la.x - 12, y, { size: 11, align: 'right', color: C.ink });
            if (!narrow()) text(ctx, `${A.levels[i].E.toFixed(2)} eV`, la.x + 250, y, { size: 10, color: C.dim });
          }
        }
        if (!api.thumbnail) {
          text(ctx, `${A.name}: energy levels`, la.x, la.y0 - 34, { size: 12, color: C.ink, weight: 600 });
          text(ctx, 'spacing stretched so the top rungs can be seen', la.x, la.y0 - 18, { size: 10, color: C.dim });
        }
        // kicks from the flame
        ctx.globalCompositeOperation = 'lighter';
        for (const k of kicks) drawGlow(ctx, la.x + 60, k.y, 30 * (1 - k.t * 2), '#ff8a3d', 0.4);
        ctx.globalCompositeOperation = 'source-over';
        // the electron, sliding between rungs
        const e = electron;
        const y0 = levelY(A.levels[Math.min(e.from, A.levels.length - 1)].E, A, la), y1 = levelY(A.levels[e.lv].E, A, la);
        const ey = y0 + (y1 - y0) * (1 - (1 - e.t) ** 3), ex = la.x + 80;
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, ex, ey, 18, C.cyan, 0.5);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = C.cyan;
        ctx.beginPath();
        ctx.arc(ex, ey, 6, 0, TAU);
        ctx.fill();
        // photons: wavy packets flying to the spectroscope
        for (const p of photons) {
          const u = Math.min(1, p.t);
          const x = p.x + (p.tx - p.x) * u, y = p.y + (p.ty - p.y) * u;
          const col = visible(p.nm) ? nmCSS(p.nm) : 'rgba(180,180,200,0.6)';
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const ang = Math.atan2(p.ty - p.y, p.tx - p.x), wl = clamp(p.nm / 60, 4, 16);
          for (let s = -18; s <= 18; s += 2) {
            const off = Math.sin((s / wl) * TAU + p.t * 30) * 4;
            const px = x + Math.cos(ang) * s - Math.sin(ang) * off, py = y + Math.sin(ang) * s + Math.cos(ang) * off;
            s === -18 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.stroke();
          if (!api.thumbnail && p.t < 0.6 && !narrow())
            text(ctx, visible(p.nm) ? `${p.nm.toFixed(0)} nm` : p.nm < L0 ? 'ultraviolet' : 'infrared', x, y - 14, { size: 10, align: 'center', color: col });
        }
        if (!api.thumbnail) this.drawStrip(st, 'spectroscope');
      },
      drawSun(w, h) {
        backdrop(ctx, w, h, { center: '#120d1a', grid: false });
        const x0 = narrow() ? 16 : 60, x1 = w - (narrow() ? 16 : 60);
        const st = { x: x0, y: narrow() ? h * 0.3 : 240, w: x1 - x0, h: narrow() ? 70 : 110 };
        // the Sun, and its light going into the spectrum
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, x0 + 40, st.y - 70, 60, '#ffd27a', 0.5);
        ctx.globalCompositeOperation = 'source-over';
        // continuous rainbow
        for (let i = 0; i < st.w; i++) {
          ctx.fillStyle = nmCSS(L0 + (i / st.w) * (L1 - L0), 0.95);
          ctx.fillRect(st.x + i, st.y, 1.5, st.h);
        }
        // dark absorption lines
        for (const l of SUN_LINES) {
          if (!visible(l.nm)) continue;
          const x = stripX(l.nm, st), strong = l.el === 'H' || l.el === 'Na' ? 3.5 : 2.2;
          ctx.fillStyle = 'rgba(0,0,0,0.85)';
          ctx.fillRect(x - strong / 2, st.y, strong, st.h);
          if (!api.thumbnail && !narrow()) text(ctx, l.label, x, st.y + st.h + 14, { size: 10, align: 'center', color: C.dim });
        }
        if (api.thumbnail) return;
        text(ctx, 'sunlight spread out: dark lines where the Sun’s gas absorbs', st.x, st.y - 14, { size: 11, color: C.ink });
        for (const nm of [400, 500, 600, 700]) text(ctx, `${nm} nm`, stripX(nm, st), st.y + st.h + (narrow() ? 14 : 30), { size: 9, align: 'center', color: C.dim });
        if (params.compare) {
          const A = params.el;
          const lines = LINES[A] || [];
          const cy = st.y + st.h + (narrow() ? 40 : 70);
          ctx.fillStyle = 'rgba(4,6,14,0.95)';
          ctx.fillRect(st.x, cy, st.w, 40);
          for (const nm of lines) {
            if (!visible(nm)) continue;
            const x = stripX(nm, st);
            ctx.fillStyle = nmCSS(nm);
            ctx.fillRect(x - 1.5, cy, 3, 40);
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(x, cy);
            ctx.lineTo(x, st.y + st.h);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          const match = lines.some((nm) => SUN_LINES.some((l) => Math.abs(l.nm - nm) < 1.5));
          text(ctx, `${ATOMS[A]?.name || A} glowing in a flame${match ? ': its lines match dark lines in sunlight' : ': no matching dark lines'}`, st.x, cy + 54, { size: 11, color: match ? C.teal : C.amber });
        }
      },
      stats() {
        if (params.scene === 'atom') {
          const A = atom();
          const main = A.jumps.map((j) => HC / (A.levels[j[0]].E - A.levels[j[1]].E)).filter(visible).sort((a, b) => b - a);
          return [
            { label: 'Element', value: A.name },
            { label: 'Electron on level', value: A.levels[electron.lv].name, color: C.cyan },
            { label: 'Photons given out', value: `${counts.photons} (${counts.visible} visible)` },
            { label: 'Visible lines', value: main.map((n) => n.toFixed(0)).join(', ') + ' nm' },
          ];
        }
        if (params.scene === 'sun') return [{ label: 'Comparing with', value: ATOMS[params.el]?.name || '—' }, { label: 'Strongest dark lines', value: 'H, Na, Mg, Fe, Ca' }];
        const seen = [...new Set(sparks.map((p) => SHELLS[p.k].name))];
        return [{ label: 'In the sky now', value: seen.length ? seen.join(', ') : '—' }, { label: 'Lines on the spectroscope', value: String([...spec.values()].filter((v) => v > 0.05).length) }];
      },
    };
  },
};
