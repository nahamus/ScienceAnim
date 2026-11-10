import { C, TAU, clamp, lerp, drawGlow, tag, text, rand, rgba, roundRect, Series } from '../../core/util.js';

// ---------------------------------------------------------------- device physics

const NVT = 0.052; // ideality × thermal voltage (V)
const R_SERIES = 100; // ohms, in series with the diode / LED
const MATERIALS = {
  si: { name: 'Silicon diode', gap: 1.12, on: 0.65, color: null, light: 'infrared (heat)' },
  red: { name: 'Red LED', gap: 1.9, on: 1.8, color: '#ff4d4d', light: 'red, 650 nm' },
  green: { name: 'Green LED', gap: 2.3, on: 2.2, color: '#3dff7a', light: 'green, 540 nm' },
  blue: { name: 'Blue LED', gap: 2.8, on: 2.75, color: '#4d8dff', light: 'blue, 450 nm' },
};
// diode current (A) at a voltage across it; Is set so 1 mA flows at the material's switch-on voltage
const diodeI = (vd, on) => 1e-3 * Math.exp((vd - on) / NVT) - 1e-3 * Math.exp(-on / NVT);
const diodeV = (i, on) => on + NVT * Math.log(Math.max(i, 1e-15) / 1e-3 + Math.exp(-on / NVT));
/** Battery V in series with the diode and resistor: returns { vd, i (A) }. */
function solveDiode(V, on) {
  let lo = -20, hi = 20;
  for (let k = 0; k < 60; k++) {
    const m = (lo + hi) / 2;
    if (m + R_SERIES * diodeI(m, on) > V) hi = m;
    else lo = m;
  }
  const vd = (lo + hi) / 2;
  return { vd, i: diodeI(vd, on) };
}

const VT = 0.7, KN = 0.02; // MOSFET threshold (V) and gain (A/V²)
function mosI(vgs, vds) {
  if (vds <= 0) return 0;
  if (vgs <= VT) return 1e-7 * Math.exp((vgs - VT) / 0.08) * Math.min(1, vds / 0.1);
  const ov = vgs - VT;
  return vds < ov ? KN * (ov * vds - (vds * vds) / 2) : (KN / 2) * ov * ov * (1 + 0.02 * vds);
}
/** Supply → red LED → resistor → transistor → ground. Returns { i (A), vds }. */
function solveSwitch(vdd, vgs) {
  const on = MATERIALS.red.on;
  let lo = 0, hi = vdd / R_SERIES;
  for (let k = 0; k < 50; k++) {
    const m = (lo + hi) / 2;
    const vds = vdd - diodeV(m, on) - m * R_SERIES;
    if (vds < 0 || mosI(vgs, vds) < m) hi = m;
    else lo = m;
  }
  const i = (lo + hi) / 2;
  return { i, vds: Math.max(0, vdd - diodeV(i, on) - i * R_SERIES) };
}
const mA = (i) => (Math.abs(i) < 1e-6 ? '0' : Math.abs(i) < 1e-3 ? (i * 1e3).toFixed(3) : (i * 1e3).toFixed(1));

export default {
  id: 'semiconductors',
  title: 'Diodes, LEDs & Transistors',
  category: 'tech',
  tagline: 'Inside the silicon: why a diode only lets current one way, how an LED makes light, and how a transistor switches.',
  ages: ['14-16', '16+'],
  topics: ['Electricity', 'Electronics', 'Light'],
  keywords: ['diode', 'LED', 'light-emitting diode', 'transistor', 'MOSFET', 'semiconductor', 'silicon', 'p-n junction', 'doping', 'holes', 'electrons', 'band gap', 'depletion zone', 'switch', 'amplifier', 'chip'],
  blurb:
    'Every phone, computer and LED light is built from semiconductors: silicon with a sprinkle of other atoms added. Put p-type and n-type silicon together and you get a diode, a one-way valve for current. Choose the right material and the same junction glows: an LED. Add a third connection and you have a transistor, a switch with no moving parts, billions of which make up a computer chip.',
  ideas: [
    '<b>n-type</b> silicon has spare <b>electrons</b>; <b>p-type</b> has <b>holes</b> where electrons are missing. Holes behave like positive charges.',
    'Where they meet, electrons fill nearby holes and leave a <b>depletion zone</b> with no free charges: a barrier.',
    '<b>Forward bias</b> squeezes the barrier and current flows. <b>Reverse bias</b> widens it and almost nothing flows, so a diode is a one-way valve.',
    'In an <b>LED</b>, each electron falling into a hole releases its energy as a <b>photon</b>. A bigger <b>band gap</b> gives bluer light and needs more voltage.',
    'In a <b>transistor</b>, a voltage on the <b>gate</b> pulls electrons into a thin <b>channel</b> that connects source and drain. Gate on = switch on: a 1.',
  ],
  hint: 'Drag the battery voltage from negative to positive',
  thumbChapter: 4,
  thumbFrames: 120,
  params: [
    { key: 'scene', label: 'Device', type: 'select', value: 'diode', options: [{ value: 'diode', label: 'Diode / LED' }, { value: 'transistor', label: 'Transistor' }] },
    { key: 'volts', label: 'Battery voltage', type: 'range', min: -3, max: 3.5, step: 0.05, value: 0, format: (v) => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
    { key: 'material', label: 'Material', type: 'select', value: 'si', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.name })) },
    { key: 'gate', label: 'Gate voltage', type: 'range', min: 0, max: 3, step: 0.01, value: 0, format: (v) => v.toFixed(2) + ' V' },
    { key: 'supply', label: 'Supply voltage', type: 'range', min: 0, max: 5, step: 0.1, value: 5, format: (v) => v.toFixed(1) + ' V' },
    { key: 'wiggle', label: 'Wiggle the gate (amplifier)', type: 'toggle', value: false },
  ],
  story: [
    {
      title: 'Two kinds of silicon',
      text: 'Pure silicon barely conducts. Add a few phosphorus atoms and each brings a <b>spare electron</b> (blue) that can wander: that’s <b>n-type</b>. Add boron instead and each leaves a gap, a <b>hole</b> (red rings). Neighbouring electrons hop into holes, so the holes drift around like positive charges: <b>p-type</b>.',
      params: { scene: 'diode', volts: 0, material: 'si' },
      duration: 15,
    },
    {
      title: 'The depletion zone',
      text: 'Join them and electrons near the boundary fill the holes opposite. That leaves a thin <b>depletion zone</b> with no free charges, only the fixed charged atoms left behind (+ and −). Their electric field pushes any more electrons back: a barrier about 0.7 V high in silicon.',
      params: { scene: 'diode', volts: 0, material: 'si' },
      duration: 14,
    },
    {
      title: 'Forward bias: current flows',
      text: 'Connect the battery’s + to the p side. Its push shrinks the barrier, and once you pass about <b>0.7 V</b> electrons and holes pour across and meet. Each meeting (recombination) releases a little energy, in silicon as heat. Current flows round the circuit.',
      params: { scene: 'diode', volts: 1.6, material: 'si' },
      tween: 4,
      duration: 14,
    },
    {
      title: 'Reverse bias: blocked',
      text: 'Flip the battery. Now it pulls electrons and holes <em>away</em> from the junction, the depletion zone widens, and almost no current can cross. A diode is a <b>one-way valve</b> for electricity, used to turn AC into DC in every phone charger.',
      params: { scene: 'diode', volts: -2.2, material: 'si' },
      tween: 3,
      check: {
        q: 'You turn the battery round so it pushes the other way through a diode. What happens?',
        options: ['Almost no current flows', 'The same current flows backwards', 'Twice the current flows'],
        answer: 0,
        explain: 'Reverse voltage widens the depletion zone, so there are no free charges to carry current across it. Only a tiny leak gets through (until, at very high voltage, it breaks down).',
      },
      duration: 13,
    },
    {
      title: 'Light-emitting diodes',
      text: 'Swap silicon for a material like gallium arsenide phosphide. Now when an electron drops into a hole, the energy comes out as a <b>photon</b> of light. The energy step, the <b>band gap</b>, sets the colour: about 1.9 electron-volts gives red.',
      formula: 'photon energy = band gap ≈ e × switch-on voltage',
      params: { scene: 'diode', volts: 2.6, material: 'red' },
      duration: 14,
    },
    {
      title: 'Bigger gap, bluer light',
      text: 'Blue light carries more energy per photon, so a blue LED needs a material with a bigger band gap (gallium nitride) and a higher voltage to switch on. Inventing a bright blue LED took until the 1990s and won a Nobel prize, because blue + red + green made white LED lighting possible.',
      params: { scene: 'diode', volts: 3.4, material: 'blue' },
      check: {
        q: 'Which LED needs the highest voltage before it lights up?',
        options: ['Red', 'Green', 'Blue'],
        answer: 2,
        explain: 'Blue photons have the most energy, and each electron must be given at least that much energy by the battery. Try the red, green and blue LEDs at the same voltage.',
      },
      duration: 14,
    },
    {
      title: 'The transistor',
      text: 'A transistor has three connections. Current wants to flow from the <b>source</b> to the <b>drain</b>, through an LED, but the p-type silicon between them blocks it. Above that gap, separated by a thin layer of glass, is the <b>gate</b>.',
      params: { scene: 'transistor', gate: 0, supply: 5, wiggle: false },
      duration: 13,
    },
    {
      title: 'Flip the switch',
      text: 'Put a positive voltage on the gate. Its field pushes holes away and pulls electrons up into a thin <b>channel</b> under the glass, bridging source and drain. Past about <b>0.7 V</b> the transistor switches on and the LED lights. No moving parts, almost no current into the gate, and it can switch billions of times a second.',
      params: { scene: 'transistor', gate: 2.4, supply: 5, wiggle: false },
      tween: 5,
      duration: 15,
    },
    {
      title: 'Ones and zeros',
      text: 'Gate off: no current, a <b>0</b>. Gate on: current, a <b>1</b>. Connect transistors together and you can build logic gates, memory and whole processors. A modern chip packs over <b>10 billion</b> of them, each channel only a few dozen atoms long.',
      params: { scene: 'transistor', gate: 0.3, supply: 5, wiggle: false },
      tween: 1,
      duration: 12,
    },
    {
      title: 'An amplifier',
      text: 'Set the gate partly on, then wiggle it a little. A small change in gate voltage makes a much <b>bigger</b> change in current: compare the two charts. That is <b>amplification</b>, how a microphone’s tiny signal becomes loud enough to drive a speaker.',
      params: { scene: 'transistor', gate: 1.15, supply: 5, wiggle: true },
      tween: 2,
      duration: 15,
    },
    {
      title: 'Explore',
      text: 'Try every LED colour, reverse the battery, and play with the gate. How low can the gate go before the transistor turns off?',
      params: { scene: 'diode', volts: 2.4, material: 'green', wiggle: false },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0;
    let elec = [], holes = [], flashes = [], photons = [], wireDots = [];
    let chan = [], tWell = [], tHoles = [];
    let crossAcc = 0;
    const sI = new Series(300), sG = new Series(300);
    let curve = [], curveKey = '';
    let L = null;

    function layout() {
      const { w, h } = api;
      const narrow = w < 700;
      const x0 = narrow ? w * 0.06 : w * 0.42, x1 = w * 0.95;
      const y0 = narrow ? h * 0.3 : h * 0.34, y1 = narrow ? h * 0.54 : h * 0.66;
      const wy = narrow ? h * 0.15 : 150;
      const sc = clamp(Math.min(w, h * 1.4) / 1100, 0.7, 1.1);
      return { w, h, narrow, x0, x1, y0, y1, wy, jx: (x0 + x1) / 2, sc };
    }

    /** Electrons (filled) or holes (rings), all in one path. */
    function dots(list, r, color, ring, lw = 1.5) {
      ctx.beginPath();
      for (const p of list) {
        ctx.moveTo(p.x + r, p.y);
        ctx.arc(p.x, p.y, r, 0, TAU);
      }
      if (ring) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // ---------------------------------------------------------------- diode
    const mat = () => MATERIALS[params.material];
    const diodeState = () => solveDiode(params.volts, mat().on);
    // depletion zone width in px: shrinks under forward bias, grows under reverse
    function depletion(vd) {
      const vbi = mat().on + 0.15;
      return (L.x1 - L.x0) * 0.09 * Math.sqrt(clamp((vbi - vd) / vbi, 0.04, 4));
    }
    function seedDiode() {
      elec = [];
      holes = [];
      const W0 = depletion(0);
      for (let i = 0; i < 54; i++) {
        elec.push({ x: rand(L.jx + W0 / 2 + 6, L.x1 - 6), y: rand(L.y0 + 6, L.y1 - 6), st: 'free' });
        holes.push({ x: rand(L.x0 + 6, L.jx - W0 / 2 - 6), y: rand(L.y0 + 6, L.y1 - 6), st: 'free' });
      }
      flashes = [];
      photons = [];
    }
    function updateDiode(dt) {
      const { vd, i } = diodeState();
      const W = depletion(vd), eEdge = L.jx + W / 2, hEdge = L.jx - W / 2;
      const jit = 60 * L.sc, drift = i > 1e-4 ? (25 + 25 * Math.sqrt(i * 1e3)) * L.sc : 0;
      // recombination events in proportion to the current
      crossAcc += dt * clamp(i * 1e3 * 3, 0, 70);
      while (crossAcc > 1) {
        crossAcc -= 1;
        let e = null, hh = null;
        for (const p of elec) if (p.st === 'free' && (!e || p.x < e.x)) e = p;
        for (const p of holes) if (p.st === 'free' && (!hh || p.x > hh.x)) hh = p;
        if (!e || !hh) break;
        const mx = L.jx + rand(-0.25, 0.25) * W, my = lerp(e.y, hh.y, 0.5);
        e.st = hh.st = 'pair';
        e.mx = hh.mx = mx;
        e.my = hh.my = my;
        e.partner = hh;
      }
      for (const e of elec) {
        if (e.st === 'pair') {
          e.x = lerp(e.x, e.mx, 1 - Math.exp(-dt * 9));
          e.y = lerp(e.y, e.my, 1 - Math.exp(-dt * 9));
          continue;
        }
        e.x += rand(-1, 1) * jit * dt - drift * dt;
        e.y += rand(-1, 1) * jit * dt;
        if (e.x < eEdge + 3) e.x = eEdge + 3 + Math.random() * 3;
        e.x = Math.min(e.x, L.x1 - 4);
        e.y = clamp(e.y, L.y0 + 4, L.y1 - 4);
      }
      for (const p of holes) {
        if (p.st === 'pair') {
          p.x = lerp(p.x, p.mx, 1 - Math.exp(-dt * 9));
          p.y = lerp(p.y, p.my, 1 - Math.exp(-dt * 9));
          continue;
        }
        p.x += rand(-1, 1) * jit * dt + drift * dt;
        p.y += rand(-1, 1) * jit * dt;
        if (p.x > hEdge - 3) p.x = hEdge - 3 - Math.random() * 3;
        p.x = Math.max(p.x, L.x0 + 4);
        p.y = clamp(p.y, L.y0 + 4, L.y1 - 4);
      }
      // a pair that has met annihilates: a flash (and a photon for an LED); the battery replaces both
      for (const e of elec) {
        if (e.st !== 'pair' || Math.hypot(e.x - e.mx, e.y - e.my) > 2) continue;
        const hh = e.partner;
        e.st = 'free';
        e.x = L.x1 - 3;
        e.y = rand(L.y0 + 6, L.y1 - 6);
        hh.st = 'free';
        hh.x = L.x0 + 3;
        hh.y = rand(L.y0 + 6, L.y1 - 6);
        flashes.push({ x: e.mx, y: e.my, t: 0 });
        if (mat().color && photons.length < 120) {
          const a = rand(TAU);
          photons.push({ x: e.mx, y: e.my, vx: Math.cos(a), vy: Math.sin(a), t: 0 });
        }
      }
      for (const f of flashes) f.t += dt * 3;
      flashes = flashes.filter((f) => f.t < 1);
      const sp = 260 * L.sc;
      for (const p of photons) {
        p.t += dt;
        p.x += p.vx * sp * dt;
        p.y += p.vy * sp * dt;
      }
      photons = photons.filter((p) => p.t < 1.4);
      moveWire(dt, i * 1e3);
      sI.push(i * 1e3);
    }

    // electrons drifting round the outside circuit, speed proportional to the current
    function wirePath() {
      if (params.scene === 'transistor') {
        const T = tLayout();
        return [[T.xs, T.top], [T.xs, L.wy], [T.xd, L.wy], [T.xd, T.top]];
      }
      return [[L.x0 + 12, L.y0], [L.x0 + 12, L.wy], [L.x1 - 12, L.wy], [L.x1 - 12, L.y0]];
    }
    function pathLen(P) {
      let s = 0;
      for (let k = 1; k < P.length; k++) s += Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]);
      return s;
    }
    function pointAt(P, u) {
      let s = u * pathLen(P);
      for (let k = 1; k < P.length; k++) {
        const d = Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]);
        if (s <= d) return [lerp(P[k - 1][0], P[k][0], s / d), lerp(P[k - 1][1], P[k][1], s / d)];
        s -= d;
      }
      return P[P.length - 1];
    }
    function moveWire(dt, ima) {
      if (!wireDots.length) for (let k = 0; k < 28; k++) wireDots.push(k / 28);
      // forward current: electrons leave the p end and come back into the n end; reverse: the other way
      const v = clamp(Math.sign(ima) * Math.sqrt(Math.abs(ima)) * 0.03, -0.25, 0.25);
      for (let k = 0; k < wireDots.length; k++) wireDots[k] = (((wireDots[k] + v * dt) % 1) + 1) % 1;
    }
    function drawWire(ima) {
      const P = wirePath();
      ctx.strokeStyle = 'rgba(200,210,235,0.55)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      P.forEach(([x, y], k) => ctx[k ? 'lineTo' : 'moveTo'](x, y));
      ctx.stroke();
      if (Math.abs(ima) > 0.02) {
        ctx.fillStyle = C.cyan;
        for (const u of wireDots) {
          const [x, y] = pointAt(P, u);
          ctx.beginPath();
          ctx.arc(x, y, 2.6, 0, TAU);
          ctx.fill();
        }
      }
    }
    function drawBattery(x, y, V, label) {
      // long plate = +
      const flip = V < 0;
      ctx.fillStyle = '#05070f';
      ctx.fillRect(x - 16, y - 18, 32, 36);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.5;
      for (const [dx, hgt] of [[-6, flip ? 9 : 18], [6, flip ? 18 : 9]]) {
        ctx.beginPath();
        ctx.moveTo(x + dx, y - hgt);
        ctx.lineTo(x + dx, y + hgt);
        ctx.stroke();
      }
      text(ctx, flip ? '−' : '+', x - 14, y - 22, { size: 13, align: 'center', color: flip ? C.cyan : C.red, weight: 700 });
      text(ctx, flip ? '+' : '−', x + 14, y - 22, { size: 13, align: 'center', color: flip ? C.red : C.cyan, weight: 700 });
      if (label) tag(ctx, label, x, y + 32, C.ink, { align: 'center', size: L.narrow ? 9 : 10.5 });
    }
    function drawResistor(x, y) {
      ctx.fillStyle = '#05070f';
      ctx.fillRect(x - 22, y - 8, 44, 16);
      ctx.strokeStyle = C.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 22, y);
      for (let k = 0; k < 6; k++) ctx.lineTo(x - 18 + k * 7.2, y + (k % 2 ? 6 : -6));
      ctx.lineTo(x + 22, y);
      ctx.stroke();
    }

    function drawDiode() {
      const { vd, i } = diodeState();
      const m = mat();
      const W = depletion(vd);
      ctx.fillStyle = '#06070e';
      ctx.fillRect(0, 0, L.w, L.h);
      drawWire(i * 1e3);
      drawBattery((L.x0 + L.x1) / 2 - 40 * L.sc, L.wy, params.volts, `${params.volts.toFixed(2)} V`);
      drawResistor(L.x0 + (L.x1 - L.x0) * 0.78, L.wy);
      // crystal
      ctx.fillStyle = 'rgba(255,90,110,0.09)';
      ctx.fillRect(L.x0, L.y0, L.jx - L.x0, L.y1 - L.y0);
      ctx.fillStyle = 'rgba(90,150,255,0.09)';
      ctx.fillRect(L.jx, L.y0, L.x1 - L.jx, L.y1 - L.y0);
      // lattice dots (silicon atoms)
      ctx.fillStyle = 'rgba(200,210,235,0.12)';
      const g = 22 * L.sc;
      for (let x = L.x0 + g / 2; x < L.x1; x += g) for (let y = L.y0 + g / 2; y < L.y1; y += g) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      // depletion zone with its fixed ions
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(L.jx - W / 2, L.y0, W, L.y1 - L.y0);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(L.jx - W / 2, L.y0, W, L.y1 - L.y0);
      ctx.setLineDash([]);
      ctx.font = `700 ${Math.round(12 * L.sc)}px "Inter", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let x = L.x0 + g; x < L.x1; x += g) {
        if (Math.abs(x - L.jx) > W / 2) continue;
        for (let y = L.y0 + g; y < L.y1; y += g) {
          ctx.fillStyle = x < L.jx ? 'rgba(255,130,150,0.8)' : 'rgba(130,180,255,0.8)';
          ctx.fillText(x < L.jx ? '−' : '+', x, y);
        }
      }
      ctx.textAlign = 'left';
      // LED glow from the junction
      if (m.color && i > 1e-4) {
        ctx.globalCompositeOperation = 'lighter';
        const k = clamp(i * 1e3 / 15, 0, 1);
        drawGlow(ctx, L.jx, (L.y0 + L.y1) / 2, (L.y1 - L.y0) * (0.6 + k), m.color, 0.15);
        ctx.globalCompositeOperation = 'source-over';
      }
      // carriers
      dots(elec, 3.6 * L.sc, '#5b9dff', false);
      dots(holes, 3.6 * L.sc, '#ff6b80', true, 1.8);
      ctx.globalCompositeOperation = 'lighter';
      for (const f of flashes) drawGlow(ctx, f.x, f.y, 10 + 14 * f.t, m.color || '#ff8a3d', 0.3);
      for (const p of photons) {
        ctx.strokeStyle = rgba(m.color || '#ff8a3d', clamp(1.4 - p.t, 0, 1));
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 0; k <= 8; k++) {
          const s = k * 2.2, wv = Math.sin(k * 1.6 + p.t * 30) * 3;
          const x = p.x - p.vx * s - p.vy * wv, y = p.y - p.vy * s + p.vx * wv;
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(233,237,247,0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);

      if (api.thumbnail) return;
      const sz = L.narrow ? 9 : 11;
      tag(ctx, L.narrow ? 'p: holes' : 'p-type: holes', L.x0 + 4, L.y0 - 14, '#ff8a9a', { size: sz });
      tag(ctx, L.narrow ? 'n: electrons' : 'n-type: electrons', L.x1 - 4, L.y0 - 14, '#8cb8ff', { size: sz, align: 'right' });
      tag(ctx, 'depletion zone', L.jx, L.y0 - 14, C.ink, { align: 'center', size: sz });
      const state = i * 1e3 > 0.2 ? (m.color ? 'glowing' : 'conducting') : params.volts < 0 ? 'blocked (reverse)' : 'below switch-on';
      tag(ctx, `${mA(i)} mA · ${state}`, L.jx, L.y1 + (L.narrow ? 40 : 46), i * 1e3 > 0.2 ? C.teal : C.dim, { align: 'center', size: sz + 1 });
    }

    // ---------------------------------------------------------------- transistor
    function tLayout() {
      const top = L.narrow ? L.h * 0.37 : L.h * 0.4;
      const bot = L.narrow ? L.h * 0.6 : L.h * 0.72;
      const W = L.x1 - L.x0;
      const wellW = W * 0.24, wellD = (bot - top) * 0.36;
      const xs = L.x0 + W * 0.15, xd = L.x1 - W * 0.15;
      const c0 = L.x0 + W * 0.06 + wellW, c1 = L.x1 - W * 0.06 - wellW;
      return { top, bot, W, wellW, wellD, xs, xd, c0, c1, gx: (c0 + c1) / 2 };
    }
    const gateV = () => clamp(params.gate + (params.wiggle ? 0.12 * Math.sin(t * TAU * 0.6) : 0), 0, 3.2);
    const swState = () => solveSwitch(params.supply, gateV());
    function seedTransistor() {
      const T = tLayout();
      tWell = [];
      for (let k = 0; k < 70; k++) {
        const left = k % 2 === 0;
        const x0 = left ? L.x0 + T.W * 0.06 : T.c1;
        tWell.push({ left, x: x0 + rand(4, T.wellW - 4), y: rand(T.top + 4, T.top + T.wellD - 4) });
      }
      tHoles = [];
      for (let k = 0; k < 46; k++) tHoles.push({ x: rand(L.x0 + 6, L.x1 - 6), y: rand(T.top + T.wellD + 4, T.bot - 6), hx: 0 });
      for (const p of tHoles) (p.hx = p.x), (p.hy = p.y);
      chan = [];
    }
    function updateTransistor(dt) {
      const T = tLayout();
      const vg = gateV();
      const { i } = swState();
      const want = Math.round(clamp((vg - VT) * 16, 0, 40));
      const chH = 5 + clamp(vg - VT, 0, 2.5) * 4;
      while (chan.length < want) chan.push({ x: rand(T.c0 - 6, T.c1), y: T.top + rand(2, chH) });
      if (chan.length > want) chan.length = want;
      const sp = clamp(i * 1e3 * 7, 0, 220) * L.sc;
      for (const e of chan) {
        e.x += (sp + rand(-25, 25)) * dt;
        e.y = clamp(e.y + rand(-20, 20) * dt, T.top + 2, T.top + chH);
        if (e.x > T.c1 + 8) e.x = T.c0 - 8 - rand(6);
        if (e.x < T.c0 - 16) e.x = T.c0 - 10;
        if (sp < 1 && e.x > T.c1 - 4) e.x = T.c1 - 4;
      }
      for (const e of tWell) {
        const x0 = e.left ? L.x0 + T.W * 0.06 : T.c1;
        e.x = clamp(e.x + rand(-30, 30) * dt, x0 + 3, x0 + T.wellW - 3);
        e.y = clamp(e.y + rand(-30, 30) * dt, T.top + 3, T.top + T.wellD - 3);
      }
      // holes near the gate get pushed down by its field
      const push = clamp(vg / 3, 0, 1) * (T.bot - T.top) * 0.42;
      for (const p of tHoles) {
        p.hx = clamp(p.hx + rand(-20, 20) * dt, L.x0 + 4, L.x1 - 4);
        p.hy = clamp(p.hy + rand(-20, 20) * dt, T.top + T.wellD + 4, T.bot - 4);
        const under = p.hx > T.c0 - 10 && p.hx < T.c1 + 10;
        const minY = under ? T.top + 10 + push : T.top + T.wellD + 4;
        p.x = p.hx;
        p.y = lerp(p.y, Math.max(p.hy, minY), 1 - Math.exp(-dt * 5));
      }
      moveWire(dt, i * 1e3);
      sI.push(i * 1e3);
      sG.push(vg);
    }
    function drawTransistor() {
      const T = tLayout();
      const vg = gateV();
      const { i } = swState();
      ctx.fillStyle = '#06070e';
      ctx.fillRect(0, 0, L.w, L.h);
      drawWire(i * 1e3);
      drawBattery(L.x0 + (L.x1 - L.x0) * 0.3, L.wy, params.supply, `supply ${params.supply.toFixed(1)} V`);
      drawResistor(L.x0 + (L.x1 - L.x0) * 0.56, L.wy);
      // the LED being switched
      const lx = L.x0 + (L.x1 - L.x0) * 0.76, ly = L.wy, k = clamp(i * 1e3 / 25, 0, 1);
      if (k > 0.01) {
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, lx, ly, 26 + 50 * k, '#ff4d4d', 0.25);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.fillStyle = k > 0.01 ? `rgba(255,${80 + 120 * k},${80 + 120 * k},1)` : '#5a2a30';
      ctx.beginPath();
      ctx.moveTo(lx - 9, ly - 10);
      ctx.lineTo(lx + 9, ly);
      ctx.lineTo(lx - 9, ly + 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(lx + 9, ly - 10, 2.5, 20);
      // substrate and wells
      ctx.fillStyle = 'rgba(255,90,110,0.1)';
      ctx.fillRect(L.x0, T.top, L.x1 - L.x0, T.bot - T.top);
      ctx.fillStyle = 'rgba(90,150,255,0.2)';
      roundRect(ctx, L.x0 + T.W * 0.06, T.top, T.wellW, T.wellD, 10);
      ctx.fill();
      roundRect(ctx, T.c1, T.top, T.wellW, T.wellD, 10);
      ctx.fill();
      // depletion under the gate
      const push = clamp(vg / 3, 0, 1) * (T.bot - T.top) * 0.42;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(T.c0, T.top, T.c1 - T.c0, 8 + push);
      // channel
      if (vg > VT) {
        const chH = 5 + clamp(vg - VT, 0, 2.5) * 4;
        ctx.fillStyle = `rgba(91,157,255,${0.15 + 0.2 * clamp((vg - VT) / 2, 0, 1)})`;
        ctx.fillRect(T.c0 - 4, T.top, T.c1 - T.c0 + 8, chH + 2);
      }
      // oxide and gate
      ctx.fillStyle = 'rgba(200,230,255,0.35)';
      ctx.fillRect(T.c0 - 6, T.top - 6, T.c1 - T.c0 + 12, 6);
      const gh = 22 * L.sc;
      const gg = ctx.createLinearGradient(0, T.top - 6 - gh, 0, T.top - 6);
      gg.addColorStop(0, '#c9ced8');
      gg.addColorStop(1, '#7d8494');
      ctx.fillStyle = gg;
      ctx.fillRect(T.c0 + 4, T.top - 6 - gh, T.c1 - T.c0 - 8, gh);
      if (vg > 0.05) {
        ctx.font = `700 ${Math.round(12 * L.sc)}px "Inter", system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,120,140,${clamp(vg / 2, 0.2, 1)})`;
        ctx.textAlign = 'center';
        const n = Math.round(clamp(vg * 3, 1, 9));
        for (let q = 0; q < n; q++) ctx.fillText('+', T.c0 + 14 + ((T.c1 - T.c0 - 28) * (q + 0.5)) / n, T.top - 6 - gh / 2 + 1);
        ctx.textAlign = 'left';
      }
      // the gate's own wire
      const gy = L.narrow ? T.top - 6 - gh - 26 : T.top - 6 - gh - 40;
      ctx.strokeStyle = 'rgba(200,210,235,0.55)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(T.gx, T.top - 6 - gh);
      ctx.lineTo(T.gx, gy);
      ctx.stroke();
      ctx.fillStyle = C.amber;
      ctx.beginPath();
      ctx.arc(T.gx, gy, 5, 0, TAU);
      ctx.fill();
      // source / drain contacts
      ctx.fillStyle = '#c9ced8';
      ctx.fillRect(T.xs - 10, T.top - 6, 20, 6);
      ctx.fillRect(T.xd - 10, T.top - 6, 20, 6);
      // carriers
      dots(tWell, 3.3 * L.sc, '#5b9dff', false);
      dots(chan, 3.3 * L.sc, '#5b9dff', false);
      dots(tHoles, 3.3 * L.sc, '#ff6b80', true, 1.6);
      ctx.strokeStyle = 'rgba(233,237,247,0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(L.x0, T.top, L.x1 - L.x0, T.bot - T.top);

      if (api.thumbnail) return;
      const sz = L.narrow ? 9 : 11;
      tag(ctx, `gate ${vg.toFixed(2)} V`, T.gx + 10, gy, C.amber, { size: sz });
      tag(ctx, 'source', T.xs, T.top + T.wellD + 16, '#8cb8ff', { align: 'center', size: sz });
      tag(ctx, 'drain', T.xd, T.top + T.wellD + 16, '#8cb8ff', { align: 'center', size: sz });
      tag(ctx, 'p-type silicon', T.gx, T.bot - 14, '#ff8a9a', { align: 'center', size: sz });
      tag(ctx, 'LED', lx, ly + 24, '#ff8080', { align: 'center', size: sz });
      if (!L.narrow) tag(ctx, 'glass layer', T.c1 + 8, T.top - 16 - gh, '#cfe6ff', { size: sz });
      const on = i * 1e3 > 1;
      tag(ctx, on ? `ON · ${mA(i)} mA · a “1”` : 'OFF · no current · a “0”', T.gx, T.bot + 20, on ? C.teal : C.dim, { align: 'center', size: sz + 1 });
      if (vg > VT && !L.narrow) tag(ctx, 'channel of electrons', T.gx, T.top + 30 + push * 0.2, '#8cb8ff', { align: 'center', size: sz });
    }

    function ivCurve() {
      const key = params.material;
      if (key !== curveKey) {
        curveKey = key;
        curve = [];
        for (let v = -1; v <= 3.5001; v += 0.05) curve.push(solveDiode(v, mat().on).i * 1e3);
      }
      return curve;
    }

    return {
      reset() {
        seedDiode();
        seedTransistor();
        sI.clear();
        sG.clear();
      },
      resize() {
        L = layout();
        seedDiode();
        seedTransistor();
      },
      onParam(k) {
        if (k === 'material') photons = [];
        if (k === 'scene') {
          sI.clear();
          sG.clear();
        }
      },
      update(dt) {
        t += dt;
        if (params.scene === 'transistor') updateTransistor(dt);
        else updateDiode(dt);
      },
      draw() {
        if (params.scene === 'transistor') drawTransistor();
        else drawDiode();
      },
      stats() {
        if (params.scene === 'transistor') {
          const vg = gateV(), { i, vds } = swState();
          return [
            { label: 'Gate voltage', value: vg.toFixed(2) + ' V', color: C.amber },
            { label: 'Switch', value: i * 1e3 > 1 ? 'ON (1)' : 'OFF (0)', color: i * 1e3 > 1 ? C.teal : C.dim },
            { label: 'Current through the LED', value: mA(i) + ' mA' },
            { label: 'Voltage across the transistor', value: vds.toFixed(2) + ' V' },
          ];
        }
        const m = mat(), { vd, i } = diodeState();
        return [
          { label: 'Across the diode', value: vd.toFixed(2) + ' V' },
          { label: 'Current', value: mA(i) + ' mA', color: i * 1e3 > 0.2 ? C.teal : C.dim },
          { label: 'Band gap', value: m.gap.toFixed(2) + ' eV' },
          { label: 'Each recombination gives', value: m.light, color: m.color || C.orange },
        ];
      },
      charts() {
        if (params.scene === 'transistor')
          return [
            { title: 'Gate voltage (V): small wiggle in', series: [{ data: sG.data, color: C.amber }], length: 300, min: 0, max: 3 },
            { title: 'LED current (mA): big swing out', series: [{ data: sI.data, color: '#ff6b6b' }], length: 300, min: 0, max: 35 },
          ];
        const v = params.volts;
        return [
          { title: `Current vs battery voltage (now ${v.toFixed(2)} V)`, series: [{ data: ivCurve(), color: mat().color || C.cyan }], min: -2, max: 30, xLabel: '−1 V → +3.5 V', yMaxLabel: '30 mA' },
          { title: 'Current over time (mA)', series: [{ data: sI.data, color: C.teal }], length: 300, min: 0, max: 30 },
        ];
      },
    };
  },
};
