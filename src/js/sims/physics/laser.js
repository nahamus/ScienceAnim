import { C, clamp, rgba, text, tag, backdrop, roundRect, drawGlow, Series, TAU } from '../../core/util.js';

// A photon-by-photon laser. 80 atoms sit in a rod between two mirrors. The pump excites atoms;
// an excited atom decays spontaneously after ~2 s, sending a photon in a random direction (only
// a few happen to run along the rod). A photon passing an excited atom can trigger stimulated
// emission: an identical twin travelling the same way. Mirrors send the axial photons back
// through the rod again and again; the output mirror lets a fraction escape as the beam.
// In a 2-level medium the pump light knocks atoms down as often as up, and ground-state atoms
// absorb laser photons, so gain never beats loss. In a 4-level medium the lower laser level
// empties at once, so nothing absorbs the laser light.

const N = 80;
const SIGMA = 0.006; // chance a passing photon interacts with an atom
const TAU_SP = 2; // spontaneous lifetime of the upper laser level (s)
const V = 2; // rod lengths per second
const AXIAL = 0.04; // fraction of spontaneous photons that happen to run along the rod
const MAX_PH = 1500;

export default {
  id: 'laser',
  title: 'How a Laser Works',
  category: 'physics',
  tagline: 'One photon triggers an identical twin, mirrors repeat it, and a chain reaction of light becomes a beam.',
  ages: ['14-16', '16+'],
  topics: ['Light', 'Quantum'],
  keywords: ['laser', 'stimulated emission', 'spontaneous emission', 'population inversion', 'pump', 'optical cavity', 'mirror', 'photon', 'coherent light', 'einstein 1917', 'maiman', 'ruby laser', 'four-level laser', 'threshold'],
  blurb:
    'LASER stands for <b>Light Amplification by Stimulated Emission of Radiation</b>. In 1917 Einstein realised that a photon passing an excited atom can make it emit an identical twin photon. Put many excited atoms between two mirrors and one stray photon can multiply into an avalanche of identical light: same colour, same direction, all in step. Here every atom and photon is simulated, so you can find the threshold where a glow turns into a beam.',
  ideas: [
    'A <b>pump</b> (lamp, current or another laser) lifts atoms into an excited state.',
    'Excited atoms drop back by themselves at random: <b>spontaneous emission</b>, light in every direction.',
    'A passing photon can trigger <b>stimulated emission</b>: a twin photon, same direction and phase.',
    '<b>Mirrors</b> send photons back through the atoms again and again; one mirror lets a little out as the beam.',
    'It only works with a <b>population inversion</b>: more atoms ready to emit than ready to absorb.',
  ],
  hint: 'Turn the pump up and down to find the threshold',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 600,
  params: [
    { key: 'pump', label: 'Pump power', type: 'range', min: 0, max: 1, step: 0.01, value: 0.5 },
    { key: 'R', label: 'Output mirror reflects', type: 'range', min: 0.5, max: 0.98, step: 0.01, value: 0.8, unit: '', digits: 2 },
    { key: 'mirrors', label: 'Mirrors', type: 'toggle', value: true },
    { key: 'levels', label: 'Atoms', type: 'select', value: 4, options: [{ value: 4, label: '4-level' }, { value: 2, label: '2-level' }] },
    { key: 'reset', label: 'Switch off and start again', type: 'button', action: (sim) => sim.reset() },
  ],
  story: [
    {
      title: 'Atoms and light',
      text: 'The flash lamp above the rod <b>pumps</b> energy into the atoms, lifting them into an excited state (amber). After a second or two each one drops back by itself and gives out a photon in a random direction: <b>spontaneous emission</b>. That’s how ordinary lamps glow: light in every direction, at random moments.',
      params: { pump: 0.08, R: 0.8, mirrors: true, levels: 4 },
      enter: (s) => s.reset(),
      duration: 14,
    },
    {
      title: 'Stimulated emission',
      text: 'Einstein’s 1917 discovery: if a photon passes an atom that is already excited, it can trigger the atom to release an <b>identical twin</b>: same colour, same direction, exactly in step. One photon becomes two, two become four. It’s the “stimulated emission” in LASER.',
      formula: 'photon + excited atom → 2 identical photons',
      params: { pump: 0.3, R: 0.8, mirrors: true, levels: 4 },
      enter: (s) => s.reset(),
      duration: 15,
    },
    {
      title: 'Mirrors build a beam',
      text: 'Most spontaneous photons fly off sideways and are lost. The few that happen to run along the rod hit a mirror and come back for another pass, cloning more photons each time. The right-hand mirror reflects 80% and lets 20% escape: that leak is the <b>laser beam</b>.',
      check: {
        q: 'What happens if you take the mirrors away?',
        options: ['The beam gets brighter', 'Only a dim glow, no beam', 'The atoms stop being excited'],
        answer: 1,
        setup: { pump: 0.5, mirrors: true, levels: 4 },
        explain: 'Without mirrors each photon gets only one pass through the rod, too few chances to multiply. The light comes out as an ordinary glow in every direction.',
      },
      params: { pump: 0.5, R: 0.8, mirrors: true, levels: 4 },
      enter: (s) => s.reset(),
      duration: 17,
    },
    {
      title: 'The threshold',
      text: 'Slowly turning the pump up: nothing much happens at first. Then, once each round trip creates more photons than the mirrors let out, the beam switches on sharply. Above threshold the number of excited atoms stops rising (dashed line on the chart): every extra bit of pumping goes straight into the beam.',
      formula: 'gain per round trip > loss per round trip',
      params: { pump: 0.02, R: 0.8, mirrors: true, levels: 4 },
      enter: (s, runner) => (s.reset(), runner.set('pump', 0.02), runner.set('pump', 0.7, 14)),
      duration: 17,
    },
    {
      title: 'Population inversion',
      text: 'Try simple <b>2-level</b> atoms. The pump light knocks excited atoms down as often as it lifts them, so at most half are ever excited, and the unexcited half absorb laser photons as fast as the rest create them. No beam, however hard you pump. Real lasers use atoms with extra levels so the excited ones outnumber those able to absorb: a <b>population inversion</b>.',
      check: {
        q: 'Why can’t a simple two-level atom make a laser?',
        options: ['At most half the atoms get excited, and the rest absorb the light', 'Its photons have the wrong colour', 'Mirrors reflect only four-level light'],
        answer: 0,
        setup: { pump: 0.8, mirrors: true, levels: 4 },
        explain: 'Gain needs more atoms ready to emit than ready to absorb. With only two levels the pump can at best equalise them, so absorption always cancels amplification.',
      },
      params: { pump: 0.8, R: 0.8, mirrors: true, levels: 2 },
      enter: (s) => s.reset(),
      duration: 17,
    },
    {
      title: 'Lasers everywhere',
      text: 'Theodore Maiman built the first laser in 1960 from a ruby rod and a flash lamp. Today lasers read barcodes, carry the internet down optical fibres, reshape corneas, cut steel and, in LIGO, measure distances to a thousandth of a proton’s width. Laser pointers are tiny diode lasers, pumped by electric current.',
      params: { pump: 0.9, R: 0.7, mirrors: true, levels: 4 },
      enter: (s) => s.reset(),
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Find the threshold for different output mirrors: a more reflective mirror lases at lower pump power but lets less light out. Switch the mirrors or the atom type and watch the beam die.',
      params: { pump: 0.4, R: 0.9, mirrors: true, levels: 4 },
      enter: (s) => s.reset(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let atoms, photons, sparks, outAcc = 0, outRate = 0, L = {};
    const phSeries = new Series(360), exSeries = new Series(360);

    function reset() {
      atoms = Array.from({ length: N }, () => ({ x: 0.06 + 0.88 * Math.random(), y: 0.12 + 0.76 * Math.random(), e: 0, glow: 0 })).sort((a, b) => a.x - b.x);
      photons = [];
      sparks = [];
      outAcc = 0;
      outRate = 0;
      phSeries.clear();
      exSeries.clear();
    }
    reset();
    const levels = () => Number(params.levels);
    const threshold = () => -Math.log(params.R) / (2 * SIGMA);

    function step(dt) {
      for (const a of atoms) {
        a.glow = Math.max(0, a.glow - dt * 3);
        if (!a.e) {
          if (Math.random() < params.pump * dt) a.e = 1;
        } else if (levels() === 2 && Math.random() < params.pump * dt) a.e = 0;
        else if (Math.random() < dt / TAU_SP) {
          a.e = 0;
          if (Math.random() < AXIAL) photons.push({ x: a.x, d: Math.random() < 0.5 ? 1 : -1, y: a.y, born: 0 });
          else {
            const ang = Math.random() * TAU;
            sparks.push({ x: a.x, y: a.y, vx: Math.cos(ang), vy: Math.sin(ang), life: 1 });
          }
        }
      }
      const next = [];
      for (const p of photons) {
        const x1 = p.x + p.d * V * dt;
        const lo = Math.min(p.x, x1), hi = Math.max(p.x, x1);
        let alive = true;
        for (const a of atoms) {
          if (a.x < lo) continue;
          if (a.x >= hi) break;
          if (Math.random() < SIGMA) {
            if (a.e) {
              a.e = 0;
              a.glow = 1;
              if (photons.length + next.length < MAX_PH) next.push({ x: a.x, d: p.d, y: clamp(p.y + (Math.random() - 0.5) * 0.04, 0.1, 0.9), born: 1 });
            } else if (levels() === 2) {
              a.e = 1;
              alive = false;
              break;
            }
          }
        }
        if (!alive) continue;
        p.x = x1;
        if (p.x > 1) {
          if (params.mirrors && Math.random() < params.R) (p.x = 2 - p.x), (p.d = -1);
          else {
            if (params.mirrors) outAcc++;
            continue;
          }
        }
        if (p.x < 0) {
          if (params.mirrors) (p.x = -p.x), (p.d = 1);
          else continue;
        }
        p.born = Math.max(0, p.born - dt * 2);
        next.push(p);
      }
      photons = next;
      for (const s of sparks) {
        s.x += s.vx * dt * 0.9;
        s.y += s.vy * dt * 0.9 * 2.4;
        s.life -= dt * 0.9;
      }
      sparks = sparks.filter((s) => s.life > 0 && s.y > -0.6 && s.y < 1.6);
      if (sparks.length > 300) sparks.splice(0, sparks.length - 300);
    }

    return {
      reset,
      resize(w, h) {
        const narrow = w < 700;
        if (narrow) {
          const rw = w - 70;
          L = { narrow, x: 30, y: 150, w: rw, h: Math.min(130, h * 0.22), lx: 16, ly: 150 + Math.min(130, h * 0.22) + 70 };
        } else {
          const x0 = w - 550 >= 360 ? 540 : Math.max(w * 0.4, 400);
          const rw = Math.max(260, w - x0 - 130);
          const rh = clamp(h * 0.24, 110, 190);
          L = { narrow, x: x0, y: 150, w: rw, h: rh, lx: x0, ly: 150 + rh + 80 };
        }
      },
      onParam(k) {
        if (k === 'levels' || k === 'mirrors') for (const a of atoms) a.e = Math.min(a.e, 1);
      },
      update(dt) {
        const n = 2;
        for (let i = 0; i < n; i++) step(dt / n);
        outRate += (outAcc / Math.max(dt, 1e-3) - outRate) * Math.min(1, dt * 1.5);
        outAcc = 0;
        if (api.frame % 3 === 0) {
          phSeries.push(photons.length);
          exSeries.push(atoms.filter((a) => a.e).length);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: false });
        const { x, y, w: rw, h: rh } = L;
        const X = (u) => x + u * rw, Y = (v) => y + v * rh;
        // pump lamp
        const lampY = y - 34;
        ctx.fillStyle = rgba('#b9d7ff', 0.08 + 0.55 * params.pump * (0.75 + 0.25 * Math.sin(api.time * 30)));
        roundRect(ctx, x + rw * 0.05, lampY - 8, rw * 0.9, 16, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(200,220,255,0.4)';
        ctx.stroke();
        if (!api.thumbnail) text(ctx, `pump lamp ${Math.round(params.pump * 100)}%`, x + rw * 0.05, lampY - 20, { size: 11, color: C.dim });
        // rod
        ctx.fillStyle = 'rgba(255,90,110,0.05)';
        ctx.strokeStyle = 'rgba(255,140,160,0.3)';
        roundRect(ctx, x, y, rw, rh, 10);
        ctx.fill();
        ctx.stroke();
        // mirrors
        const mirror = (mx, part) => {
          ctx.fillStyle = params.mirrors ? (part ? 'rgba(180,200,255,0.55)' : 'rgba(220,230,255,0.9)') : 'rgba(255,255,255,0.06)';
          ctx.fillRect(mx - 4, y - 10, 8, rh + 20);
        };
        mirror(x - 10, false);
        mirror(x + rw + 10, true);
        if (!api.thumbnail) {
          text(ctx, params.mirrors ? '100%' : 'no mirror', x - 10, y + rh + 24, { size: 10, align: 'center', color: C.dim });
          text(ctx, params.mirrors ? `${Math.round(params.R * 100)}%` : 'no mirror', x + rw + 10, y + rh + 24, { size: 10, align: 'center', color: C.dim });
        }
        // beam out of the output mirror
        const beam = clamp(outRate / 40, 0, 1);
        if (beam > 0.02) {
          const g = ctx.createLinearGradient(x + rw + 14, 0, w, 0);
          g.addColorStop(0, rgba(C.red, 0.3 + 0.7 * beam));
          g.addColorStop(1, rgba(C.red, 0.15 * beam));
          ctx.fillStyle = g;
          ctx.fillRect(x + rw + 14, Y(0.5) - 2 - beam * 4, w - (x + rw + 14), 4 + beam * 8);
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, x + rw + 16, Y(0.5), 14 + beam * 20, C.red, 0.4);
          ctx.globalCompositeOperation = 'source-over';
        }
        // atoms
        for (const a of atoms) {
          ctx.fillStyle = a.e ? C.amber : 'rgba(120,140,200,0.55)';
          ctx.beginPath();
          ctx.arc(X(a.x), Y(a.y), a.e ? 4.2 : 3.2, 0, TAU);
          ctx.fill();
          if (a.glow > 0) {
            ctx.strokeStyle = rgba('#ffffff', a.glow);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(X(a.x), Y(a.y), 7 + (1 - a.glow) * 6, 0, TAU);
            ctx.stroke();
          }
        }
        // spontaneous photons (random directions)
        for (const s of sparks) {
          ctx.fillStyle = rgba(C.pink, 0.7 * s.life);
          ctx.beginPath();
          ctx.arc(X(s.x), Y(s.y), 2, 0, TAU);
          ctx.fill();
        }
        // laser photons, drawn as short dashes along the rod
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(C.red, 0.75);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (const p of photons) {
          const px = X(p.x), py = Y(p.y);
          ctx.moveTo(px - p.d * 6, py);
          ctx.lineTo(px + p.d * 2, py);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        // population bars and energy levels
        const exc = atoms.filter((a) => a.e).length;
        const lx = L.lx, ly = L.ly, bw = L.narrow ? w - 32 - 150 : Math.min(rw - 150, 340);
        const bar = (label, n, yy, col) => {
          text(ctx, label, lx, yy, { size: 12, color: C.dim });
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(lx + 140, yy - 7, bw, 14);
          ctx.fillStyle = col;
          ctx.fillRect(lx + 140, yy - 7, (bw * n) / N, 14);
          text(ctx, String(n), lx + 146 + (bw * n) / N, yy, { size: 12, color: col, weight: 700 });
        };
        bar(levels() === 4 ? 'Ready to emit' : 'Excited', exc, ly, C.amber);
        bar(levels() === 4 ? 'Able to absorb' : 'Ground (absorbs)', levels() === 4 ? 0 : N - exc, ly + 24, 'rgba(120,140,200,0.9)');
        const th = threshold();
        const tx = lx + 140 + (bw * th) / N;
        ctx.strokeStyle = rgba(C.teal, 0.8);
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(tx, ly - 12);
        ctx.lineTo(tx, ly + 10);
        ctx.stroke();
        ctx.setLineDash([]);
        if (!api.thumbnail) {
          text(ctx, 'threshold', tx, ly - 20, { size: 10, align: 'center', color: C.teal });
          const lasing = outRate > 3 && params.mirrors;
          tag(ctx, lasing ? 'LASING: a beam of identical photons' : params.mirrors ? 'below threshold: just a glow' : 'no mirrors: just a glow', lx, ly + 58, lasing ? C.red : C.dim);
        }
      },
      stats() {
        const exc = atoms.filter((a) => a.e).length;
        return [
          { label: 'Photons bouncing in the rod', value: String(photons.length), color: C.red },
          { label: 'Excited atoms', value: `${exc} of ${N}`, color: C.amber },
          { label: 'Threshold', value: `${threshold().toFixed(0)} excited` },
          { label: 'Beam output', value: `${outRate.toFixed(0)} photons/s` },
        ];
      },
      charts() {
        return [
          { title: 'Photons bouncing in the rod', series: [{ data: phSeries.data, color: C.red }], min: 0, length: 360 },
          { title: 'Excited atoms (dashed: threshold)', series: [{ data: exSeries.data, color: C.amber }], ref: { data: [threshold(), threshold()], color: C.teal }, min: 0, max: N, length: 360 },
        ];
      },
    };
  },
};
