import { C, TAU, clamp, rgba, text, tag, roundRect, FONT, MONO, backdrop, easeInOut } from '../../core/util.js';
import { drawBloch, rotate, GATE_ROT } from '../../core/quantum.js';

// One qubit on the Bloch sphere. Every single-qubit gate is a rotation of the sphere, so the state
// is tracked exactly as a unit vector (x, y, z) = (⟨X⟩, ⟨Y⟩, ⟨Z⟩); the amplitudes shown are
// cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩, the same state up to an unobservable global phase.

const PALETTE = ['X', 'Y', 'Z', 'H', 'S', 'T', 'M', '↺'];
const GATE_COLOR = { X: C.pink, Y: C.lime, Z: C.cyan, H: C.amber, S: C.violet, T: C.violet, M: C.teal, '↺': C.dim };
const NOTE = {
  X: 'X: half-turn about x (quantum NOT)',
  Y: 'Y: half-turn about y',
  Z: 'Z: half-turn about z (flips the phase)',
  H: 'H: half-turn about the x+z diagonal',
  S: 'S: quarter-turn about z',
  T: 'T: eighth-turn about z',
};

export default {
  id: 'qubit',
  title: 'Qubits and Quantum Gates',
  category: 'quantum',
  tagline: 'A qubit is an arrow on a sphere. Quantum gates spin it; measuring snaps it to a pole.',
  ages: ['14-16', '16+'],
  topics: ['Quantum', 'Quantum computing'],
  keywords: ['qubit', 'bloch sphere', 'superposition', 'hadamard', 'quantum gate', 'pauli', 'phase', 'measurement', 'quantum computer'],
  blurb:
    'A normal bit is 0 or 1. A qubit can be any blend of the two, and every possible qubit state is a point on a sphere: 0 at the north pole, 1 at the south pole, and superpositions everywhere in between. Quantum gates, the instructions of a quantum computer, simply rotate the sphere. Measuring gives only 0 or 1, with odds set by the latitude.',
  ideas: [
    'A qubit’s state is <b>α|0⟩ + β|1⟩</b>; measuring gives 0 with probability |α|² and 1 with probability |β|².',
    'Every state is a point on the <b>Bloch sphere</b>; every single-qubit gate is a <b>rotation</b> of it.',
    'The <b>Hadamard</b> gate turns |0⟩ into an equal superposition, the starting move of most quantum algorithms.',
    'Points around the equator differ only in <b>phase</b>: invisible to a measurement, but they change what later gates do.',
    'Measuring <b>collapses</b> the state to |0⟩ or |1⟩, so one copy of a qubit can’t reveal its full state.',
  ],
  hint: 'Tap a gate to rotate the qubit · drag the sphere to turn it',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 150,
  params: [
    { key: 'speed', label: 'Gate animation speed', type: 'range', min: 0.25, max: 3, step: 0.05, value: 1, unit: '×' },
    { key: 'shots', label: 'Measure fresh copies (repeat)', type: 'toggle', value: false },
    { key: 'rate', label: 'Measurements per second', type: 'range', min: 1, max: 60, step: 1, value: 8 },
    { key: 'trail', label: 'Show path', type: 'toggle', value: true },
    { key: 'labels', label: 'Label the axes', type: 'toggle', value: true },
    { key: 'measure', label: 'Measure once', type: 'button', action: (sim) => sim.run(['M']) },
    { key: 'reset', label: 'Reset to |0⟩', type: 'button', action: (sim) => sim.reset() },
  ],
  story: [
    {
      title: 'A bit that can point anywhere',
      text: 'An ordinary bit is 0 or 1. A <b>qubit</b> is an arrow on a sphere: pointing up is <b>|0⟩</b>, pointing down is <b>|1⟩</b>, and every other direction is a <em>superposition</em>, a blend of both. This is the Bloch sphere, and it holds every possible state of one qubit.',
      params: { shots: false, trail: true, labels: true, speed: 1 },
      enter: (s) => s.reset(),
      duration: 12,
    },
    {
      title: 'The X gate: a quantum NOT',
      text: 'Quantum computers run on <b>gates</b>, and every single-qubit gate is a rotation of the sphere. <b>X</b> spins it half a turn about the x axis, so |0⟩ becomes |1⟩: exactly what NOT does to an ordinary bit.',
      params: { shots: false, speed: 0.8 },
      enter: (s) => (s.reset(), s.run(['X'], 0.6)),
      duration: 11,
    },
    {
      title: 'Hadamard: making a superposition',
      text: 'The <b>H</b> (Hadamard) gate turns about the diagonal between x and z. Starting from |0⟩ it lands on the equator: <b>|+⟩ = (|0⟩ + |1⟩)/√2</b>, equal parts 0 and 1. Almost every quantum algorithm begins with H gates.',
      formula: 'H|0⟩ = (|0⟩ + |1⟩) / √2',
      params: { shots: false, speed: 0.8 },
      enter: (s) => (s.reset(), s.run(['H'], 0.6)),
      duration: 12,
    },
    {
      title: 'Measuring: only 0 or 1',
      text: 'Measure |+⟩ and you get 0 or 1 at random, 50/50, and the arrow <b>snaps</b> to that pole. To see the odds you need many fresh copies: here each tick prepares a new |+⟩ and measures it. The chance of 0 is <b>|α|² = cos²(θ/2)</b>, set purely by the latitude.',
      check: {
        q: 'A qubit sits on the equator at |+⟩. You measure 1,000 fresh copies. About how many give 0?',
        options: ['All 1,000', 'About 500', 'About 707', 'None'],
        answer: 1,
        setup: { shots: false },
        explain: 'On the equator θ = 90°, so P(0) = cos²(45°) = ½. The amplitude is 1/√2 ≈ 0.707, but probabilities are amplitudes squared, so about 500.',
      },
      params: { shots: true, rate: 20 },
      enter: (s) => (s.reset(), s.set('H'), s.clearTally()),
      duration: 14,
    },
    {
      title: 'Phase: the hidden dial',
      text: 'Points around the equator all give 50/50, so a measurement can’t tell them apart. But they differ in <b>phase</b>, and phase matters: <b>Z</b> turns |+⟩ into |−⟩, then <b>H</b> sends |−⟩ to |1⟩ instead of |0⟩. Quantum algorithms use phase to make wrong answers cancel out.',
      check: {
        q: 'Start at |0⟩ and apply H, then Z, then H. What will measuring give?',
        options: ['Always 0', 'Always 1', '50/50', 'Different every run'],
        answer: 1,
        setup: { shots: false },
        explain: 'H takes |0⟩ to |+⟩; Z spins it round the equator to |−⟩; H takes |−⟩ to |1⟩. The sequence H Z H acts exactly like X.',
      },
      params: { shots: false, speed: 0.7 },
      enter: (s) => (s.reset(), s.run(['H', 'Z', 'H'], 0.6)),
      duration: 16,
    },
    {
      title: 'Smaller turns',
      text: '<b>S</b> and <b>T</b> turn about z by a quarter and an eighth. Combining H and T gates can reach as close as you like to any point on the sphere, so a handful of gate types is enough for a universal quantum computer. Real qubits (superconducting circuits, trapped ions, photons) are steered by precisely timed microwave or laser pulses.',
      params: { shots: false, speed: 1 },
      enter: (s) => (s.reset(), s.run(['H', 'T', 'T', 'S', 'H', 'T'], 0.6)),
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Tap gates to steer the arrow. Can you reach |+i⟩, |1⟩ or |−⟩? Turn on repeated measurement to see the odds, or measure once to collapse it.',
      params: { shots: false, speed: 1 },
      enter: (s) => s.reset(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let v = [0, 0, 1], trail = [], queue = [], anim = null, circuit = [], wait = 0;
    let yaw = -0.55, pitch = 0.32, drag = null, buttons = [];
    let tally = [0, 0], shotAcc = 0, flash = null;

    const probs = () => [(1 + v[2]) / 2, (1 - v[2]) / 2];

    function snap(z) {
      v = [0, 0, z];
      trail = [];
    }

    function startNext() {
      const g = queue.shift();
      if (!g) return;
      circuit.push(g);
      if (circuit.length > 14) circuit.shift();
      if (g === 'M') {
        const out = Math.random() < probs()[1] ? 1 : 0;
        circuit[circuit.length - 1] = 'M' + out;
        tally[out]++;
        flash = { out, t: 0, from: v };
        snap(out ? -1 : 1);
        anim = { kind: 'measure', t: 0, dur: 0.5 };
        return;
      }
      const { axis, angle } = GATE_ROT[g];
      anim = { kind: 'gate', g, axis, angle, from: v, t: 0, dur: 0.35 + 0.55 * (angle / Math.PI) };
      trail = [v];
    }

    const sim = {
      /** Queue gates (after an optional pause in seconds). */
      run(gates, delay = 0) {
        queue.push(...gates);
        wait = Math.max(wait, delay);
      },
      /** Jump straight to the state the gates produce from |0⟩, with no animation. */
      set(...gates) {
        sim.reset();
        for (const g of gates) {
          const { axis, angle } = GATE_ROT[g];
          v = rotate(v, axis, angle);
          circuit.push(g);
        }
      },
      reset() {
        v = [0, 0, 1];
        trail = [];
        queue = [];
        anim = null;
        circuit = [];
        wait = 0;
        flash = null;
      },
      clearTally() {
        tally = [0, 0];
        shotAcc = 0;
      },
      pointerDown(p) {
        for (const b of buttons)
          if (p.x >= b.x && p.x <= b.x + b.s && p.y >= b.y && p.y <= b.y + b.s) {
            if (b.g === '↺') sim.reset();
            else sim.run([b.g]);
            return;
          }
        drag = { x: p.x, y: p.y, yaw, pitch };
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        yaw = drag.yaw + (p.x - drag.x) * 0.01;
        pitch = clamp(drag.pitch + (p.y - drag.y) * 0.01, -1.2, 1.2);
      },
      pointerUp() {
        drag = null;
      },
      onParam(k) {
        if (k === 'shots') sim.clearTally();
      },
      update(dt) {
        if (wait > 0) wait -= dt;
        else if (!anim) startNext();
        if (anim) {
          anim.t += (dt * params.speed) / anim.dur;
          if (anim.kind === 'gate') {
            const t = easeInOut(Math.min(1, anim.t));
            v = rotate(anim.from, anim.axis, anim.angle * t);
            if (params.trail) trail.push(v);
          }
          if (anim.t >= 1) {
            if (anim.kind === 'gate') v = rotate(anim.from, anim.axis, anim.angle);
            anim = null;
            wait = 0.25 / params.speed;
          }
        }
        if (flash) flash.t += dt;
        // repeated measurement of fresh copies: the arrow stays put, the tally grows
        if (params.shots && !anim) {
          shotAcc += dt * params.rate;
          while (shotAcc >= 1) {
            shotAcc--;
            const out = Math.random() < probs()[1] ? 1 : 0;
            tally[out]++;
            flash = { out, t: 0, shot: true };
          }
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const narrow = w < 700;
        // gate palette
        const n = PALETTE.length;
        buttons = [];
        let s, R, cx, cy, circY, meter;
        if (narrow) {
          s = Math.min(40, (w - 24) / n - 6);
          const x0 = (w - n * (s + 6) + 6) / 2;
          PALETTE.forEach((g, i) => buttons.push({ g, x: x0 + i * (s + 6), y: 58, s }));
          // top to bottom: palette, circuit, odds, sphere
          circY = 58 + s + 24;
          meter = { x: 24, y: circY + 34, w: w - 48 };
          R = clamp(Math.min(w * 0.32, (h - 40 - (meter.y + 76)) / 2.4), 40, 150);
          cx = w / 2;
          cy = meter.y + 76 + R * 1.2;
        } else {
          s = clamp((h - 150) / n - 8, 26, 44);
          const x0 = w - s - 28;
          PALETTE.forEach((g, i) => buttons.push({ g, x: x0, y: 86 + i * (s + 8), s }));
          circY = 84;
          // sit right of centre and high, clear of the story card (bottom left)
          // keep the sphere between the story card (x 20–490) and the gate palette
          const room = x0 - 24 - 510;
          R = Math.max(70, Math.min(h * 0.27, w * 0.18, room / 2.5));
          cx = Math.max(w * 0.6, 510 + R * 1.25);
          if (cx + R * 1.25 > x0 - 16) cx = (510 + x0 - 16) / 2;
          cy = Math.max(circY + 40 + R * 1.2, h * 0.44);
          meter = { x: w * 0.1, y: 116, w: Math.min(220, w * 0.2), vertical: true };
        }
        if (api.thumbnail) {
          R = Math.min(w, h) * 0.36;
          cx = w / 2;
          cy = h / 2;
        }

        drawBloch(ctx, cx, cy, R, v, {
          color: C.violet, yaw, pitch, labels: params.labels ? 'full' : 'poles', trail: params.trail ? trail : null,
          axis: anim?.kind === 'gate' ? anim.axis : null, thin: narrow || api.thumbnail,
        });
        // measurement flash at the pole
        if (flash && flash.t < 0.6) {
          const a = 1 - flash.t / 0.6;
          const py = cy + (flash.out ? 1 : -1) * R;
          ctx.strokeStyle = rgba(flash.out ? C.pink : C.teal, a);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, py, 8 + 26 * (1 - a), 0, TAU);
          ctx.stroke();
        }
        if (api.thumbnail) return;

        // palette
        for (const b of buttons) {
          const col = GATE_COLOR[b.g];
          ctx.fillStyle = 'rgba(12,16,32,0.85)';
          ctx.strokeStyle = rgba(col.startsWith('#') ? col : '#ffffff', 0.6);
          ctx.lineWidth = 1.2;
          roundRect(ctx, b.x, b.y, b.s, b.s, 8);
          ctx.fill();
          ctx.stroke();
          ctx.font = `700 ${Math.round(b.s * 0.42)}px ${b.g === 'M' ? FONT : MONO}`;
          ctx.fillStyle = col;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.g, b.x + b.s / 2, b.y + b.s / 2 + 1);
        }

        // circuit: one wire with the gates applied so far
        const cw = narrow ? w - 40 : Math.min(520, w * 0.5);
        const x0 = narrow ? 20 : cx - cw / 2;
        ctx.strokeStyle = 'rgba(200,210,240,0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x0 + 34, circY);
        ctx.lineTo(x0 + cw, circY);
        ctx.stroke();
        text(ctx, '|0⟩', x0, circY, { size: 12, mono: true, color: C.dim });
        const gs = 24;
        circuit.forEach((g, i) => {
          const gx = x0 + 44 + i * (gs + 6);
          if (gx + gs > x0 + cw) return;
          const base = g[0];
          const col = GATE_COLOR[base];
          ctx.fillStyle = '#0c1020';
          ctx.strokeStyle = col.startsWith('#') ? col : '#888';
          roundRect(ctx, gx, circY - gs / 2, gs, gs, 5);
          ctx.fill();
          ctx.stroke();
          text(ctx, base === 'M' ? 'M' + g[1] : g, gx + gs / 2, circY + 1, { size: base === 'M' ? 10 : 12, mono: true, align: 'center', color: col, weight: 700, shadow: false });
        });

        // gate description while it turns
        if (anim?.kind === 'gate') tag(ctx, NOTE[anim.g], cx, cy + R + (narrow ? 26 : 42), C.amber, { align: 'center' });

        // probability meter
        const [p0, p1] = probs();
        const total = tally[0] + tally[1];
        const rows = [['0', p0, C.teal, tally[0]], ['1', p1, C.pink, tally[1]]];
        rows.forEach(([lab, p, col, k], i) => {
          const y = meter.y + i * 30;
          const bw = meter.w - 70;
          text(ctx, `P(${lab})`, meter.x, y, { size: 12, mono: true, color: C.dim });
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(meter.x + 40, y - 6, bw, 12);
          ctx.fillStyle = col;
          ctx.fillRect(meter.x + 40, y - 6, bw * p, 12);
          if (total) {
            ctx.fillStyle = C.ink;
            ctx.fillRect(meter.x + 40 + bw * (k / total) - 1, y - 9, 2, 18);
          }
          text(ctx, `${Math.round(p * 100)}%`, meter.x + 44 + bw, y, { size: 12, mono: true });
        });
        if (total) text(ctx, `measured: ${tally[0]} × 0, ${tally[1]} × 1  (white marks)`, meter.x, meter.y + 56, { size: 11, color: C.dim });
      },
      stats() {
        const th = Math.acos(clamp(v[2], -1, 1)), ph = Math.atan2(v[1], v[0]);
        const a = Math.cos(th / 2), b = Math.sin(th / 2);
        const deg = ((((ph * 180) / Math.PI) % 360) + 360) % 360;
        const out = [
          { label: 'α (amount of |0⟩)', value: a.toFixed(3), color: C.teal },
          // at the poles the phase means nothing, so only show it for a real superposition
          { label: 'β (amount of |1⟩)', value: b < 1e-3 ? '0' : a < 1e-3 ? b.toFixed(3) : `${b.toFixed(3)} · phase ${Math.round(deg) % 360}°`, color: C.pink },
          { label: 'P(0) = |α|²', value: (a * a).toFixed(3) },
          { label: 'P(1) = |β|²', value: (b * b).toFixed(3) },
        ];
        const total = tally[0] + tally[1];
        if (total) out.push({ label: 'Measured 0s', value: `${tally[0]} / ${total} (${((100 * tally[0]) / total).toFixed(1)}%)` });
        return out;
      },
      charts() {
        const total = tally[0] + tally[1];
        return [{
          title: total ? 'Measured share of 0s and 1s' : 'Chance of reading 0 or 1',
          kind: 'bars',
          series: [{ data: total ? [tally[0] / total, tally[1] / total] : probs(), color: C.violet }],
          min: 0,
          max: 1,
        }];
      },
    };
    return sim;
  },
};
