import { C, TAU, drawGlow, roundRect, tag, text } from '../../core/util.js';

// Schrödinger's cat (1935). A radioactive atom with half-life T½ is, until checked, in a superposition
// √p |not decayed⟩ + √(1−p) |decayed⟩ with p = 2^(−t/T½). Linked to a detector, a flask and a cat, the maths
// (taken literally) puts the cat in the same superposition. Opening the box gives one outcome at random with
// those odds. Interference shows a superposition is real: coherent paths give fringes with visibility V,
// a mere mixture gives none. Decoherence: an object's surroundings record "which way", so V = exp(−t/τ) with
// τ shrinking dramatically with size and with how busy the environment is. τ values here are rough orders of
// magnitude for illustration.

const OBJECTS = {
  atom: { name: 'an atom', tau: { vacuum: 10, air: 1e-6 } },
  c60: { name: 'a buckyball (60 atoms)', tau: { vacuum: 1, air: 1e-10 } },
  big: { name: 'a 2,000-atom molecule', tau: { vacuum: 0.01, air: 1e-13 } },
  virus: { name: 'a virus', tau: { vacuum: 1e-6, air: 1e-18 } },
  dust: { name: 'a speck of dust', tau: { vacuum: 1e-12, air: 1e-26 } },
  cat: { name: 'a cat', tau: { vacuum: 1e-25, air: 1e-40 } },
};
const FLIGHT = 1e-3; // s: how long the object must stay coherent in the experiment

function seeded(s) {
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const sci = (v) => {
  const e = Math.floor(Math.log10(v));
  return e >= 0 ? `${Math.round(v)} s` : `10${String(e).replace(/./g, (c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)])} s`;
};

export default {
  id: 'schrodingers-cat',
  title: 'Schrödinger’s Cat',
  category: 'quantum',
  tagline: 'Alive, asleep, or both? Why the quantum world is fuzzy, and why cats never are.',
  ages: ['14-16', '16+'],
  topics: ['Superposition', 'Measurement', 'Decoherence'],
  keywords: ['Schrödinger\'s cat', 'Schrodinger cat', 'superposition', 'quantum measurement', 'wavefunction collapse', 'decoherence', 'interference', 'radioactive decay', 'half-life', 'many worlds', 'Copenhagen interpretation', 'thought experiment', 'quantum computer'],
  blurb:
    'In 1935 Erwin Schrödinger imagined a cat sealed in a box with a radioactive atom wired to a flask of poison. Quantum rules say the atom is both decayed and not decayed until someone looks, so is the cat both alive and dead? He meant it as a joke about how strange the theory is. Open the box, open a hundred, test whether “both” is real, and discover decoherence: the reason everyday things never look quantum.',
  ideas: [
    'A quantum system can be in a <b>superposition</b>: a blend of possibilities that each have an amplitude.',
    'A <b>measurement</b> gives just one outcome, at random, with probabilities set by the amplitudes.',
    'Superpositions are real, not just ignorance: the possibilities can <b>interfere</b>, which a mere “we don’t know which” never does.',
    'Surroundings constantly “look” at big objects (air, light, heat), destroying the interference: <b>decoherence</b>.',
    'Bigger, warmer, busier objects decohere almost instantly, so cats are always either awake or not.',
  ],
  hint: 'Open the box, or open a hundred',
  thumbChapter: 2,
  thumbFrames: 120,
  params: [
    {
      key: 'scene', label: 'Experiment', type: 'select', value: 'box', instant: true,
      options: [{ value: 'box', label: 'One box' }, { value: 'many', label: 'A hundred boxes' }, { value: 'waves', label: 'Interference test' }],
    },
    { key: 'half', label: 'Atom’s half-life', type: 'range', min: 2, max: 20, step: 0.5, value: 8, instant: true, unit: ' s' },
    { key: 'cat', label: 'Put a cat in the box', type: 'toggle', value: true, hidden: true },
    { key: 'coherent', label: 'Real superposition (not just “we don’t know”)', type: 'toggle', value: true },
    {
      key: 'object', label: 'Object sent through', type: 'select', value: 'c60',
      options: Object.entries(OBJECTS).map(([value, o]) => ({ value, label: o.name.replace(/^an? /, '').replace(/^./, (m) => m.toUpperCase()) })),
    },
    {
      key: 'env', label: 'Surroundings', type: 'select', value: 'vacuum',
      options: [{ value: 'vacuum', label: 'Cold, ultra-high vacuum' }, { value: 'air', label: 'Warm air' }],
    },
    { key: 'open', label: 'Open the box', type: 'button', action: (s) => s.toggleBox() },
    { key: 'reset', label: 'Start again', type: 'button', action: (s) => s.reset() },
  ],
  story: [
    {
      title: 'One atom, two possibilities',
      text: 'Start with a single radioactive atom in a box. Its half-life is 8 seconds: after 8 s there is a 50 % chance it has decayed. Quantum theory doesn’t say it has secretly decayed or not. Until something checks, it is in a <b>superposition</b> of both, shown by the two bars: how much “not decayed” and how much “decayed”, shifting as time passes.',
      params: { scene: 'box', half: 8, cat: false },
      enter: (s) => s.reset(),
      duration: 14,
    },
    {
      title: 'Schrödinger’s trap',
      text: 'Now Schrödinger’s 1935 thought experiment (no real cats are involved). If the atom decays, a detector clicks, a hammer breaks a flask, and a cartoon sleeping gas knocks the cat out. The cat’s fate is tied to the atom, so if you take the maths literally, the closed box holds a cat that is <b>both awake and knocked out</b>. Schrödinger meant this as an absurdity: surely something is missing.',
      params: { scene: 'box', half: 8, cat: true },
      enter: (s) => s.reset(),
      duration: 15,
    },
    {
      title: 'Opening the box',
      text: 'Open the box and you never see a blur: the cat is either awake or out cold, and the superposition is gone. Quantum theory can’t say which you’ll see, only the odds. Close it, start again, and open it once more; each time is a fresh roll of the dice.',
      params: { scene: 'box', half: 8, cat: true },
      enter: (s) => s.reset(5),
      duration: 13,
    },
    {
      title: 'A hundred boxes',
      text: 'One box tells you little. Prepare a hundred identical boxes and open them all at the same moment. You can never predict a single box, yet the fraction of awake cats follows the half-life curve precisely. Quantum mechanics is perfectly reliable about the odds and silent about each single event.',
      check: {
        q: 'You open 100 boxes after exactly one half-life. How many cats are awake?',
        options: ['About 50, but you can’t say which', 'Exactly 50', 'All of them are half awake'],
        answer: 0,
        setup: { scene: 'many', half: 8, cat: true },
        explain: 'Each box is an independent 50:50 chance, so you get close to 50, usually between about 40 and 60, and every opened cat is definitely one or the other. Which ones is random.',
      },
      params: { scene: 'many', half: 8, cat: true },
      enter: (s) => s.reset(8),
      duration: 15,
    },
    {
      title: 'Is “both” real?',
      text: 'Maybe the atom secretly decided all along and we just don’t know? For small things we can test this. Send a molecule along two paths at once and let the paths meet on a screen. A real superposition makes the two possibilities <b>interfere</b>: stripes build up. A mere “it took one path, we don’t know which” makes no stripes. Toggle between them.',
      params: { scene: 'waves', coherent: true, object: 'c60', env: 'vacuum' },
      enter: (s) => s.reset(),
      duration: 16,
    },
    {
      title: 'Decoherence',
      text: 'Now let the molecule fly through warm air. Every air molecule that bumps into it carries away a hint of which path it took. The surroundings have effectively “looked”, and the stripes vanish. The bigger and warmer the object, the faster this happens: a buckyball in air loses it in about 10⁻¹⁰ s, a cat in vastly less than a trillionth of a trillionth of a second. That is why the everyday world never looks quantum.',
      check: {
        q: 'Why do we never see a real cat in a superposition?',
        options: ['Its surroundings destroy the superposition almost instantly', 'Cats are too clever to be quantum', 'Quantum rules switch off above a certain size'],
        answer: 0,
        setup: { scene: 'waves', coherent: true, object: 'c60', env: 'vacuum' },
        explain: 'No rule says big things can’t be quantum, and ever-bigger molecules have shown interference (about 2,000 atoms in 2019). But a cat constantly exchanges air, light and heat with its surroundings, which record its state far too fast for any interference to survive.',
      },
      params: { scene: 'waves', coherent: true, object: 'c60', env: 'air' },
      enter: (s) => s.reset(),
      duration: 17,
    },
    {
      title: 'Still a puzzle, and a technology',
      text: 'Decoherence explains why we never see superpositions of big things. Whether a measurement truly picks one outcome (the Copenhagen view) or every outcome happens in branching worlds (many-worlds) is still argued over. Meanwhile, quantum computers deliberately keep qubits in superposition, and their biggest enemy is exactly this decoherence.',
      params: { scene: 'box', half: 8, cat: true },
      enter: (s) => s.reset(),
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Open boxes, open a hundred, change the half-life, and send different objects through the interference test in vacuum or in air. How big can you go before the stripes disappear?',
      params: { scene: 'waves', coherent: true, object: 'big', env: 'vacuum' },
      enter: (s) => s.reset(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0, opened = false, outcome = null, autoOpen = -1;
    let boxes = [], manyOpen = false, manyT = 0;
    const hits = new Float32Array(160);
    let nHits = 0, rnd = seeded(5);

    const pAlive = (tt) => Math.pow(2, -tt / params.half);
    const visibility = () => {
      if (!params.coherent) return 0;
      const tau = OBJECTS[params.object].tau[params.env];
      return Math.exp(-FLIGHT / tau);
    };
    function screenP(x) {
      // x in −1..1: two overlapping humps from the two paths, with fringes of visibility V
      const env = Math.exp(-(((x - 0.18) / 0.32) ** 2)) + Math.exp(-(((x + 0.18) / 0.32) ** 2));
      return env * (1 + visibility() * Math.cos(x * 34));
    }

    function reset(openIn) {
      t = 0;
      opened = false;
      outcome = null;
      autoOpen = openIn ?? -1;
      boxes = Array.from({ length: 100 }, () => ({ u: Math.random() }));
      manyOpen = false;
      manyT = 0;
      hits.fill(0);
      nHits = 0;
      rnd = seeded(5);
    }
    reset();

    function openBox() {
      opened = true;
      outcome = Math.random() < pAlive(t) ? 'alive' : 'out';
    }

    function catAt(x, y, s, awake, alpha = 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f0a35a';
      ctx.strokeStyle = '#3a2412';
      ctx.lineWidth = 2 * s;
      // body (lying down when out)
      ctx.beginPath();
      if (awake) ctx.ellipse(x, y + 10 * s, 26 * s, 18 * s, 0, 0, TAU);
      else ctx.ellipse(x + 6 * s, y + 18 * s, 34 * s, 12 * s, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      // tail
      ctx.beginPath();
      if (awake) {
        ctx.moveTo(x + 22 * s, y + 18 * s);
        ctx.quadraticCurveTo(x + 50 * s, y + 10 * s, x + 40 * s, y - 16 * s);
      } else {
        ctx.moveTo(x + 36 * s, y + 20 * s);
        ctx.quadraticCurveTo(x + 56 * s, y + 26 * s, x + 62 * s, y + 18 * s);
      }
      ctx.lineWidth = 6 * s;
      ctx.strokeStyle = '#e0904a';
      ctx.stroke();
      // head
      const hx = awake ? x - 4 * s : x - 26 * s, hy = awake ? y - 16 * s : y + 12 * s;
      ctx.fillStyle = '#f0a35a';
      ctx.strokeStyle = '#3a2412';
      ctx.lineWidth = 2 * s;
      for (const e of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(hx + e * 6 * s, hy - 12 * s);
        ctx.lineTo(hx + e * 16 * s, hy - 26 * s);
        ctx.lineTo(hx + e * 18 * s, hy - 6 * s);
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(hx, hy, 17 * s, 0, TAU);
      ctx.fill();
      ctx.stroke();
      // face
      ctx.strokeStyle = '#2a170a';
      ctx.fillStyle = '#2a170a';
      for (const e of [-1, 1]) {
        if (awake) {
          ctx.beginPath();
          ctx.arc(hx + e * 6 * s, hy - 2 * s, 2.6 * s, 0, TAU);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(hx + e * 6 * s - 3 * s, hy - 5 * s);
          ctx.lineTo(hx + e * 6 * s + 3 * s, hy + 1 * s);
          ctx.moveTo(hx + e * 6 * s + 3 * s, hy - 5 * s);
          ctx.lineTo(hx + e * 6 * s - 3 * s, hy + 1 * s);
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(hx, hy + 6 * s, 3 * s, 0.2, Math.PI - 0.2);
      ctx.stroke();
      if (!awake) text(ctx, 'z z', hx - 16 * s, hy - 26 * s, { size: 13 * s, color: '#9fb4ff', weight: 700 });
      ctx.restore();
    }

    function drawBox() {
      const { w } = api;
      const phone = w < 760;
      const bw = phone ? w * 0.8 : Math.min(w * 0.4, 460), bh = bw * 0.62;
      const bx = phone ? (w - bw) / 2 : w * 0.43 - bw / 2, by = phone ? 80 : 150;
      const p = opened ? (outcome === 'alive' ? 1 : 0) : pAlive(t);
      // box (cutaway)
      ctx.fillStyle = '#20160e';
      ctx.strokeStyle = '#8a6a44';
      ctx.lineWidth = 3;
      roundRect(ctx, bx, by, bw, bh, 8);
      ctx.fill();
      ctx.stroke();
      // atom, detector, flask
      const ax = bx + bw * 0.14, ay = by + bh * 0.3;
      const decayedView = opened ? outcome === 'out' : false;
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, ax, ay, 26, opened ? (decayedView ? '#ff6b6b' : '#7fd8ff') : '#c79bff', 0.4);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#e8e2ff';
      ctx.beginPath();
      ctx.arc(ax, ay, 7, 0, TAU);
      ctx.fill();
      text(ctx, 'atom', ax, ay + 20, { size: 10, align: 'center', color: C.dim });
      if (params.cat) {
        ctx.fillStyle = '#556';
        ctx.fillRect(ax - 14, ay + 34, 28, 18);
        text(ctx, 'detector', ax, ay + 62, { size: 9, align: 'center', color: C.dim });
        const fx = bx + bw * 0.3, fy = by + bh * 0.72;
        ctx.fillStyle = decayedView ? 'rgba(160,255,160,0.25)' : 'rgba(160,255,160,0.7)';
        ctx.beginPath();
        ctx.moveTo(fx - 8, fy - 22);
        ctx.lineTo(fx + 8, fy - 22);
        ctx.lineTo(fx + 14, fy + 12);
        ctx.lineTo(fx - 14, fy + 12);
        ctx.fill();
        text(ctx, 'sleeping gas', fx, fy + 24, { size: 9, align: 'center', color: C.dim });
        const s = bw / 420;
        const cx = bx + bw * 0.66, cy = by + bh * 0.48;
        if (opened) catAt(cx, cy, s * 1.3, outcome === 'alive');
        else {
          catAt(cx, cy, s * 1.3, true, 0.15 + 0.6 * p);
          catAt(cx, cy, s * 1.3, false, 0.15 + 0.6 * (1 - p));
        }
      }
      // lid
      if (!opened) {
        ctx.fillStyle = 'rgba(60,42,26,0.55)';
        roundRect(ctx, bx, by, bw, bh, 8);
        ctx.fill();
        text(ctx, 'closed: nobody has looked', bx + bw / 2, by + bh + 18, { size: 12, align: 'center', color: C.dim });
      } else text(ctx, outcome === 'alive' ? (params.cat ? 'Open: the cat is awake' : 'Open: the atom has not decayed') : params.cat ? 'Open: the cat is out cold (just asleep!)' : 'Open: the atom has decayed', bx + bw / 2, by + bh + 18, { size: 13, weight: 600, align: 'center', color: outcome === 'alive' ? C.teal : C.red });

      // state panel
      const px = phone ? 16 : w * 0.68, py = phone ? by + bh + 40 : 150, pw = phone ? w - 32 : Math.min(w * 0.3, 330), ph = phone ? 110 : 250;
      ctx.fillStyle = 'rgba(8,11,24,0.86)';
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      roundRect(ctx, px, py, pw, ph, 12);
      ctx.fill();
      ctx.stroke();
      text(ctx, opened ? 'After looking' : 'Quantum state (amplitudes)', px + 12, py + 16, { size: 11, weight: 600, color: C.dim });
      const labels = params.cat ? ['awake', 'out cold'] : ['not decayed', 'decayed'];
      const vals = [Math.sqrt(p), Math.sqrt(1 - p)];
      const barW = pw - 130;
      vals.forEach((v, k) => {
        const y = py + (phone ? 38 : 52) + k * (phone ? 28 : 44);
        text(ctx, labels[k], px + 12, y, { size: 12, color: k ? C.red : C.teal });
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(px + 100, y - 8, barW, 16);
        ctx.fillStyle = k ? C.red : C.teal;
        ctx.fillRect(px + 100, y - 8, barW * v, 16);
        if (!phone) text(ctx, `chance ${Math.round(v * v * 100)} %`, px + 100, y + 18, { size: 10, color: C.dim, mono: true });
      });
      if (!opened && !phone) {
        // coherence link
        ctx.strokeStyle = 'rgba(199,155,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 0; k <= 40; k++) {
          const yy = py + 52 + (44 * k) / 40;
          ctx[k ? 'lineTo' : 'moveTo'](px + 90 + Math.sin(k * 0.9 + api.time * 5) * 5, yy);
        }
        ctx.stroke();
        text(ctx, 'both at once (a superposition)', px + 12, py + 160, { size: 11, color: C.violet });
        text(ctx, `time ${t.toFixed(1)} s · half-life ${params.half} s`, px + 12, py + 186, { size: 11, color: C.dim, mono: true });
      }
    }

    function drawMany() {
      const { w, h } = api;
      const phone = w < 760;
      const cols = 10, size = phone ? (w - 40) / cols : Math.min((w * 0.4) / cols, (h - 360) / cols);
      const x0 = phone ? 20 : w * 0.48 - (cols * size) / 2, y0 = phone ? 80 : 120;
      const p = pAlive(manyOpen ? manyT : t);
      let alive = 0;
      boxes.forEach((b, i) => {
        const x = x0 + (i % cols) * size, y = y0 + Math.floor(i / cols) * size;
        const isAlive = b.u < p;
        if (manyOpen && isAlive) alive++;
        ctx.fillStyle = manyOpen ? (isAlive ? 'rgba(46,230,166,0.85)' : 'rgba(255,77,109,0.75)') : '#3a2a1a';
        roundRect(ctx, x + 2, y + 2, size - 4, size - 4, 4);
        ctx.fill();
        if (manyOpen) text(ctx, isAlive ? '◕' : '✕', x + size / 2, y + size / 2, { size: size * 0.45, align: 'center', color: '#05070f', shadow: false });
      });
      text(ctx, manyOpen ? `Opened at ${manyT.toFixed(1)} s: ${alive} awake, ${100 - alive} out cold` : `Closed boxes · ${t.toFixed(1)} s`, x0, y0 + cols * size + 22, { size: phone ? 12 : 15, weight: 600 });
      // decay curve
      if (!phone) {
        const gx = w * 0.72, gy = 130, gw = w * 0.26, gh = 220;
        ctx.fillStyle = 'rgba(8,11,24,0.86)';
        roundRect(ctx, gx, gy, gw, gh, 12);
        ctx.fill();
        text(ctx, 'Chance each cat is awake', gx + 12, gy + 16, { size: 11, weight: 600, color: C.dim });
        const X = (tt) => gx + 16 + (tt / (3 * params.half)) * (gw - 32), Y = (v) => gy + gh - 24 - v * (gh - 56);
        ctx.strokeStyle = C.teal;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let tt = 0; tt <= 3 * params.half; tt += params.half / 30) ctx[tt ? 'lineTo' : 'moveTo'](X(tt), Y(pAlive(tt)));
        ctx.stroke();
        const now = manyOpen ? manyT : t;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(X(Math.min(now, 3 * params.half)), gy + 30);
        ctx.lineTo(X(Math.min(now, 3 * params.half)), gy + gh - 24);
        ctx.stroke();
        if (manyOpen) {
          ctx.fillStyle = C.amber;
          ctx.beginPath();
          ctx.arc(X(Math.min(manyT, 3 * params.half)), Y(alive / 100), 6, 0, TAU);
          ctx.fill();
          text(ctx, 'what you found', X(Math.min(manyT, 3 * params.half)) + 10, Y(alive / 100) - 10, { size: 10, color: C.amber });
        }
        [1, 2, 3].forEach((k) => text(ctx, `${k} half-life${k > 1 ? 's' : ''}`, X(k * params.half), gy + gh - 10, { size: 9, align: 'center', color: C.dim }));
      }
    }

    function drawWaves() {
      const { w, h } = api;
      const phone = w < 760;
      const sx = phone ? 30 : w * 0.18, sy = phone ? h * 0.36 : h * 0.4;
      const scrX = phone ? w - 40 : w * 0.7, top = sy - (phone ? 110 : 170), bot = sy + (phone ? 110 : 170);
      // source and two paths
      ctx.fillStyle = C.violet;
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, TAU);
      ctx.fill();
      text(ctx, OBJECTS[params.object].name, sx, sy + 26, { size: 11, align: 'center', color: C.dim });
      const midX = (sx + scrX) / 2;
      ctx.strokeStyle = 'rgba(199,155,255,0.45)';
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(midX, sy + s * (bot - sy) * 0.8, scrX, sy);
        ctx.stroke();
      }
      // gas molecules if in air
      if (params.env === 'air') {
        ctx.fillStyle = 'rgba(180,200,255,0.35)';
        for (let k = 0; k < 90; k++) {
          const x = sx + 20 + (((k * 7919) % 1000) / 1000) * (scrX - sx - 40) + Math.sin(api.time * 3 + k) * 6;
          const y = top + (((k * 104729) % 997) / 997) * (bot - top) + Math.cos(api.time * 2.6 + k) * 6;
          ctx.fillRect(x, y, 2.5, 2.5);
        }
      }
      // screen with hits
      ctx.fillStyle = '#10142a';
      ctx.fillRect(scrX, top, 14, bot - top);
      const mx = Math.max(1, ...hits);
      for (let i = 0; i < hits.length; i++) {
        const y = top + ((i + 0.5) / hits.length) * (bot - top);
        const v = hits[i] / mx;
        ctx.fillStyle = `rgba(255,214,102,${0.15 + 0.85 * v})`;
        ctx.fillRect(scrX + 18, y - (bot - top) / hits.length / 2, v * (phone ? 26 : 120), (bot - top) / hits.length + 0.5);
      }
      // prediction
      if (!phone) {
        let pm = 0;
        for (let i = 0; i < 200; i++) pm = Math.max(pm, screenP(-1 + i / 100));
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const x = -1 + i / 100;
          const y = top + ((x + 1) / 2) * (bot - top);
          ctx[i ? 'lineTo' : 'moveTo'](scrX + 18 + (screenP(x) / pm) * 120, y);
        }
        ctx.stroke();
      }
      const V = visibility();
      const tau = OBJECTS[params.object].tau[params.env];
      tag(ctx, !params.coherent ? 'no stripes: it really took one path' : V > 0.5 ? 'stripes: the two paths interfere' : V > 0.05 ? 'faint stripes: partly decohered' : 'no stripes: the surroundings “looked”', w - 16, phone ? 56 : 84, V > 0.5 && params.coherent ? C.teal : C.amber, { align: 'right' });
      if (!phone) {
        text(ctx, `stays coherent for roughly ${sci(tau)}`, sx - 20, bot + 34, { size: 12, color: C.violet });
        text(ctx, '(rough order of magnitude; the trip takes about a thousandth of a second)', sx - 20, bot + 54, { size: 10, color: C.dim });
      }
    }

    return {
      reset,
      toggleBox() {
        if (params.scene === 'many') {
          if (manyOpen) reset();
          else {
            manyOpen = true;
            manyT = t;
          }
          return;
        }
        if (opened) reset();
        else openBox();
      },
      onParam(k) {
        if (k === 'scene' || k === 'half') reset();
        if (k === 'coherent' || k === 'object' || k === 'env') {
          hits.fill(0);
          nHits = 0;
        }
      },
      update(dt) {
        if (!opened && !manyOpen) t += dt;
        if (autoOpen > 0 && t >= autoOpen) {
          autoOpen = -1;
          if (params.scene === 'many') {
            manyOpen = true;
            manyT = t;
          } else openBox();
        }
        if (params.scene === 'waves') {
          // fire objects at the screen: sample positions by rejection from the pattern
          for (let k = 0; k < 40; k++) {
            const x = rnd() * 2 - 1;
            if (rnd() * 2.6 < screenP(x)) {
              hits[Math.min(hits.length - 1, Math.floor(((x + 1) / 2) * hits.length))]++;
              nHits++;
            }
          }
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#06070f';
        ctx.fillRect(0, 0, w, h);
        if (params.scene === 'box') drawBox();
        else if (params.scene === 'many') drawMany();
        else drawWaves();
      },
      stats() {
        if (params.scene === 'waves') {
          return [
            { label: 'Stripe contrast', value: `${Math.round(visibility() * 100)} %`, color: C.teal },
            { label: 'Coherent for', value: sci(OBJECTS[params.object].tau[params.env]), color: C.violet },
            { label: 'Objects detected', value: nHits.toLocaleString('en-US') },
          ];
        }
        const p = pAlive(t);
        return [
          { label: 'Time', value: `${t.toFixed(1)} s`, color: C.amber },
          { label: 'Chance not decayed', value: `${Math.round(p * 100)} %`, color: C.teal },
          { label: 'Box', value: params.scene === 'many' ? (manyOpen ? 'all opened' : 'all closed') : opened ? 'open' : 'closed' },
        ];
      },
    };
  },
};
