import { C, Series, arrow, backdrop, clamp, drawGlow, rand, roundRect, tag, text, TAU } from '../../core/util.js';

// A lithium-ion cell in cross-section: graphite (left) and a layered metal oxide (right) separated by an
// electrolyte-soaked separator. Lithium ions shuttle through the electrolyte; electrons take the wire.
// Charging faster than the graphite can take ions in (worse when cold) plates lithium metal, which grows
// into dendrites that can pierce the separator and short the cell.

const ROWS = 8, COLS = 6, N = ROWS * COLS;
const FULL_SECONDS = 36; // at 1C a full charge or discharge takes an hour; here an hour is squeezed into 36 s
const ocv = (s) => 3.0 + 1.0 * s + 0.2 * (1 - Math.exp(-8 * s)); // open-circuit voltage: 3.0 V empty, 3.7 V half, 4.2 V full
const LI = '#ffd166', ELECTRON = '#38d6f5';
const PLATE = 3.2; // graphite stress above which lithium starts to plate out (3C at room temperature is fine; cold makes it far worse)

export default {
  id: 'battery',
  title: 'Inside a Lithium-Ion Battery',
  category: 'chemistry',
  tagline: 'Lithium ions rock back and forth between two layered materials every time you charge your phone.',
  ages: ['14-16', '16+'],
  topics: ['Electrochemistry', 'Energy', 'Materials'],
  keywords: ['battery', 'lithium', 'Li-ion', 'electrolyte', 'anode', 'cathode', 'graphite', 'dendrite', 'fast charging', 'thermal runaway', 'redox'],
  blurb:
    'Your phone, laptop and electric car all run on the same idea. Lithium ions slip between the layers of graphite on one side and a metal oxide on the other. Discharging lets them flow downhill while electrons do useful work through the wire; charging pushes them back. Push too hard, or too cold, and lithium metal grows spikes that can short the cell.',
  ideas: [
    'A cell is a sandwich: graphite, a separator soaked in electrolyte, and a layered metal oxide.',
    'The electrolyte lets <b>ions</b> through but not electrons, so the electrons must go round the outside circuit and do work.',
    'Discharging, lithium leaves the graphite as Li⁺ and slots into the oxide; charging forces it back.',
    'The same ions <b>rock back and forth</b>, so nothing is burned up and a cell lasts thousands of cycles.',
    'Charge too fast or too cold and lithium plates onto the graphite as metal <b>dendrites</b>, which can pierce the separator.',
  ],
  hint: 'Pick a mode, then change the rate and temperature',
  thumbChapter: 2,
  thumbFrames: 300,
  params: [
    { key: 'mode', label: 'What the battery is doing', type: 'select', value: 'rest', options: [{ value: 'discharge', label: 'Powering the phone' }, { value: 'charge', label: 'Charging' }, { value: 'rest', label: 'Unplugged' }] },
    { key: 'rate', label: 'Current (C-rate)', type: 'range', min: 0.2, max: 4, step: 0.1, value: 1, format: (v) => `${v.toFixed(1)}C · ${Math.round(60 / v)} min` },
    { key: 'temp', label: 'Temperature', type: 'range', min: -10, max: 45, step: 1, value: 22, unit: '°C' },
    { key: 'smart', label: 'Smart charging (slows down when cold or nearly full)', type: 'toggle', value: false },
    { key: 'rock', label: 'Charge and discharge over and over', type: 'toggle', value: false },
    { key: 'showE', label: 'Show electrons in the wire', type: 'toggle', value: true },
    { key: 'fresh', label: 'New battery', type: 'button', action: (s) => s.init(1) },
  ],
  story: [
    {
      title: 'A sandwich of layers',
      text: 'Inside every phone battery: on the left, <b>graphite</b>, stacked sheets of carbon; on the right, a layered metal <b>oxide</b>; between them a thin plastic <b>separator</b> soaked in electrolyte. This battery is fully charged, so the lithium (yellow) is packed between the graphite sheets.',
      params: { mode: 'rest', rate: 1, temp: 22, smart: false, rock: false },
      enter: (s) => s.init(1),
      duration: 13,
    },
    {
      title: 'Powering your phone',
      text: 'Lithium would rather sit in the oxide, so it moves there by itself. Each atom leaves the graphite as a positive ion, Li⁺, and swims across the electrolyte. Its electron cannot follow: it has to go the long way round, through the wire and your phone, and that flow of electrons is the current that does the work.',
      formula: 'graphite:  LiC₆ → C₆ + Li⁺ + e⁻      oxide:  CoO₂ + Li⁺ + e⁻ → LiCoO₂',
      params: { mode: 'discharge', rate: 1.2, temp: 22 },
      duration: 16,
    },
    {
      title: 'Two roads',
      text: 'Ions go through the middle; electrons go round the outside. They arrive together at the oxide, so charge always balances. Watch the voltage slide from 4.2 V towards 3 V as the oxide fills up.',
      check: {
        q: 'Lithium ions cross straight through the battery. Why don’t the electrons go with them?',
        options: ['The electrolyte and separator block electrons, so they must go round the wire', 'Electrons are too big to fit through', 'They do; the wire carries nothing'],
        answer: 0,
        setup: { mode: 'discharge', rate: 1.2 },
        explain: 'The electrolyte conducts ions but is an electrical insulator. The only path for electrons is the outside circuit, which is exactly why a battery can power anything. If electrons could cross inside, the battery would drain itself.',
      },
      params: { mode: 'discharge', rate: 1.2 },
      duration: 14,
    },
    {
      title: 'Charging it back up',
      text: 'The charger pushes electrons back into the graphite, and the lithium ions follow, squeezing back between the carbon sheets. The energy you put in is stored in lithium sitting where it would rather not be, ready to flow back downhill.',
      params: { mode: 'charge', rate: 1.2, temp: 22, smart: false },
      enter: (s) => s.init(0.08),
      duration: 16,
    },
    {
      title: 'The rocking chair',
      text: 'Nothing is burned up: the same ions rock back and forth, charge after charge, so a good cell survives a thousand cycles or more. Developing this idea won John Goodenough, Stanley Whittingham and Akira Yoshino the 2019 Nobel Prize in Chemistry.',
      params: { rock: true, rate: 3, temp: 22, smart: false },
      enter: (s) => s.init(0.5),
      duration: 16,
    },
    {
      title: 'Too fast, too cold',
      text: 'Now charge hard on a freezing day. Ions arrive faster than the cold, sluggish graphite can take them in, so they pile up on its surface as lithium <b>metal</b>. The metal grows spiky <b>dendrites</b> towards the separator. If one pierces it and touches the other side, the cell shorts, heats up, and can catch fire.',
      params: { mode: 'charge', rate: 3.5, temp: -5, smart: false, rock: false },
      enter: (s) => s.init(0.15),
      duration: 18,
    },
    {
      title: 'Smart charging',
      text: 'So phones charge fast while the battery is nearly empty, then slow to a trickle past about 80% and when it is cold, keeping ions arriving no faster than the graphite can absorb them. That is why the last 20% takes so long.',
      check: {
        q: 'Why does a phone charge more slowly when it is very cold?',
        options: ['To stop lithium metal plating onto the graphite', 'Because the charger cable shrinks', 'To save electricity'],
        answer: 0,
        setup: { mode: 'charge', rate: 3.5, temp: -5, smart: true },
        explain: 'Cold graphite takes in lithium slowly. Charging gently gives every ion time to slot between the sheets instead of plating out as metal, which would grow dendrites and permanently lose capacity.',
      },
      params: { mode: 'charge', rate: 3.5, temp: -5, smart: true, rock: false },
      enter: (s) => s.init(0.15),
      duration: 18,
    },
    {
      title: 'Your turn',
      text: 'Charge and discharge at different rates and temperatures. Find the fastest charge that grows no dendrites, then switch smart charging on and compare.',
      params: { mode: 'charge', rate: 1.5, temp: 22, smart: false, rock: false },
      enter: (s) => s.init(0.2),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let slots, ions, electrons, dendrites, sparks, shorted, heat, flash, acc, status, effRate;
    const sV = new Series(400), sS = new Series(400);
    let L; // layout

    function layout() {
      const { w, h } = api;
      const wide = w >= 760;
      // wide: keep the cell and its labels above the story card, which can reach ~320 px up from the bottom
      const top = wide ? 200 : 180, bot = wide ? Math.min(h - 360, 600) : Math.min(h - 110, top + 360); // phones: labels stay above the hint
      const x0 = wide ? w * 0.08 : 12, x1 = wide ? w * 0.92 : w - 12;
      const mid = (x0 + x1) / 2, gap = Math.min(150, (x1 - x0) * 0.2);
      L = { wide, top, bot: Math.max(bot, top + 200), x0, x1, mid, aL: x0 + 14, aR: mid - gap / 2, cL: mid + gap / 2, cR: x1 - 14 };
      L.rowH = (L.bot - L.top - 30) / ROWS;
      L.wireY = wide ? 150 : 130;
    }
    const rowY = (r) => L.top + 15 + (r + 0.5) * L.rowH;
    const slotX = (side, c) => (side === 'a' ? L.aR - 14 - c * ((L.aR - L.aL - 28) / (COLS - 1)) : L.cL + 14 + c * ((L.cR - L.cL - 28) / (COLS - 1)));

    function init(soc = 1) {
      slots = { a: new Array(N).fill(null), c: new Array(N).fill(null) };
      ions = [];
      const nA = Math.round(soc * N);
      const order = [...Array(N).keys()].sort(() => Math.random() - 0.5);
      for (let k = 0; k < N; k++) {
        const side = k < nA ? 'a' : 'c';
        const s = order[k];
        const ion = { side, slot: s, x: 0, y: 0, path: null, t: 0 };
        slots[side][s] = ion;
        ions.push(ion);
      }
      for (const ion of ions) place(ion);
      electrons = [];
      dendrites = Array.from({ length: ROWS }, () => ({ segs: [], tip: 0 }));
      sparks = [];
      shorted = false;
      heat = 0;
      flash = 0;
      acc = 0;
      status = '';
      sV.clear();
      sS.clear();
    }
    function place(ion) {
      const r = Math.floor(ion.slot / COLS), c = ion.slot % COLS;
      ion.x = slotX(ion.side, c);
      ion.y = rowY(r);
    }
    const soc = () => ions.filter((i) => i.side === 'a' && !i.path).length / N;
    const inFlight = () => ions.filter((i) => i.path).length;

    /** Send one ion across. Returns false if there is nothing to move. */
    function transfer(from) {
      const to = from === 'a' ? 'c' : 'a';
      const src = [];
      for (let s = 0; s < N; s++) if (slots[from][s] && !slots[from][s].path) src.push(s);
      const free = [];
      for (let s = 0; s < N; s++) if (!slots[to][s]) free.push(s);
      if (!src.length || free.length <= inFlight()) return false;
      // ions leave from the slots nearest the separator, and fill from it inwards
      src.sort((p, q) => (p % COLS) - (q % COLS) + rand(-1.5, 1.5));
      free.sort((p, q) => (p % COLS) - (q % COLS) + rand(-1.5, 1.5));
      const ion = slots[from][src[0]];
      const target = free.find((s) => !ions.some((i) => i.path && i.to === to && i.slot2 === s));
      if (target === undefined) return false;
      slots[from][src[0]] = null;
      const r1 = Math.floor(src[0] / COLS), r2 = Math.floor(target / COLS);
      const edgeFrom = from === 'a' ? L.aR : L.cL, edgeTo = to === 'a' ? L.aR : L.cL;
      ion.path = [
        [ion.x, ion.y],
        [edgeFrom + (from === 'a' ? 6 : -6), rowY(r1)],
        [(edgeFrom + edgeTo) / 2 + rand(-12, 12), (rowY(r1) + rowY(r2)) / 2 + rand(-30, 30)],
        [edgeTo + (to === 'a' ? 6 : -6), rowY(r2)],
        [slotX(to, target % COLS), rowY(r2)],
      ];
      ion.seg = 0;
      ion.t = 0;
      ion.to = to;
      ion.slot2 = target;
      ion.row2 = r2;
      if (params.showE) electrons.push({ t: 0, dir: from === 'a' ? 1 : -1 });
      return true;
    }
    /** How hard the graphite is being pushed: the rate, made worse by cold. Above PLATE lithium starts to plate out. */
    const stress = () => effRate * (1 + Math.max(0, 20 - params.temp) / 12);
    function arrive(ion) {
      // charging too hard: some ions fail to slip between the graphite sheets and plate onto the surface instead
      if (ion.to === 'a' && params.mode === 'charge') {
        const pPlate = clamp((stress() - PLATE) / 4, 0, 0.75);
        if (Math.random() < pPlate) {
          // the field is strongest at a sharp tip, so lithium piles onto the longest spike
          const lead = dendrites.reduce((m, d, i) => (d.tip > dendrites[m].tip ? i : m), 0);
          grow(dendrites[lead].tip > 0 && Math.random() < 0.7 ? lead : ion.row2);
          ion.dead = true;
          return;
        }
      }
      ion.side = ion.to;
      ion.slot = ion.slot2;
      ion.path = null;
      slots[ion.side][ion.slot] = ion;
      place(ion);
    }
    function grow(r) {
      const d = dendrites[r];
      const base = [L.aR + 2, rowY(r) + rand(-L.rowH * 0.25, L.rowH * 0.25)];
      const from = d.segs.length && Math.random() < 0.8 ? d.segs.reduce((m, s) => (s[2] > m[2] ? s : m))  : null;
      const sx = from ? from[2] : base[0], sy = from ? from[3] : base[1];
      const a = rand(-0.7, 0.7) + (from && Math.random() < 0.3 ? rand(-1, 1) : 0);
      const len = rand(6, 11);
      const seg = [sx, sy, sx + Math.cos(a) * len, clamp(sy + Math.sin(a) * len, L.top + 18, L.bot - 18)];
      d.segs.push(seg);
      d.tip = Math.max(d.tip, seg[2]);
      if (d.tip >= L.cL - 2 && !shorted) {
        shorted = true;
        flash = 1;
        status = 'short circuit!';
        for (let i = 0; i < 40; i++) sparks.push({ x: L.mid, y: rowY(r), vx: rand(-160, 160), vy: rand(-200, 60), t: 0 });
      }
    }
    // the wire runs from the top of the graphite, over the load, down to the oxide
    function wirePoint(t) {
      const ax = (L.aL + L.aR) / 2, cx = (L.cL + L.cR) / 2, y = L.wireY, top = L.top;
      const legs = [[ax, top], [ax, y], [cx, y], [cx, top]];
      const lens = [top - y, cx - ax, top - y], tot = lens[0] + lens[1] + lens[2];
      let d = t * tot;
      for (let i = 0; i < 3; i++) {
        if (d <= lens[i]) {
          const [p, q] = [legs[i], legs[i + 1]];
          return [p[0] + (q[0] - p[0]) * (d / lens[i]), p[1] + (q[1] - p[1]) * (d / lens[i])];
        }
        d -= lens[i];
      }
      return legs[3];
    }

    return {
      init,
      resize() {
        layout();
        if (!ions) init(1);
        else for (const i of ions) if (!i.path) place(i);
      },
      reset: () => init(1),
      onParam(k, v) {
        if (k === 'mode' && v !== 'rest') status = '';
      },
      update(dt) {
        dt = Math.min(dt, 0.05);
        if (!ions) return;
        const s = soc();
        // rocking chair: flip direction at the ends
        if (params.rock && !shorted) {
          if (params.mode !== 'charge' && s <= 0.02) api.runner.set('mode', 'charge');
          else if (params.mode !== 'discharge' && s >= 0.98) api.runner.set('mode', 'discharge');
        }
        effRate = params.rate;
        if (params.smart && params.mode === 'charge') {
          if (params.temp < 10) effRate = Math.min(effRate, 0.5 + Math.max(0, params.temp + 10) * 0.04);
          if (s > 0.8) effRate = Math.min(effRate, 0.4 + (1 - s) * 3);
        }
        const going = !shorted && params.mode !== 'rest';
        if (going) {
          acc += dt * (effRate * N) / FULL_SECONDS;
          while (acc >= 1) {
            acc -= 1;
            if (!transfer(params.mode === 'discharge' ? 'a' : 'c')) {
              acc = 0;
              if (!inFlight()) status = params.mode === 'discharge' ? 'empty' : 'full';
              break;
            }
          }
        }
        // ions travel along their paths; slower in the electrolyte when cold
        const sp = 260 * (0.55 + 0.45 * clamp((params.temp + 10) / 35, 0, 1));
        for (const ion of ions) {
          if (!ion.path) {
            ion.jx = Math.sin(api.time * 3 + ion.slot) * 0.8;
            continue;
          }
          const [p, q] = [ion.path[ion.seg], ion.path[ion.seg + 1]];
          const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
          ion.t += (dt * sp) / len;
          const wob = ion.seg === 1 || ion.seg === 2 ? Math.sin(api.time * 9 + ion.slot) * 4 : 0;
          const u = Math.min(1, ion.t);
          ion.x = p[0] + (q[0] - p[0]) * u;
          ion.y = p[1] + (q[1] - p[1]) * u + wob;
          if (ion.t >= 1) {
            ion.seg++;
            ion.t = 0;
            if (ion.seg >= ion.path.length - 1) arrive(ion);
          }
        }
        if (ions.some((i) => i.dead)) ions = ions.filter((i) => !i.dead);
        for (const e of electrons) e.t += dt * 0.55;
        electrons = electrons.filter((e) => e.t < 1);
        if (shorted) heat = Math.min(1, heat + dt * 0.25);
        flash = Math.max(0, flash - dt * 1.5);
        for (const p of sparks) {
          p.t += dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 300 * dt;
        }
        sparks = sparks.filter((p) => p.t < 1.2);
        if (api.frame % 4 === 0) {
          sV.push(this.voltage());
          sS.push(soc());
        }
      },
      voltage() {
        if (shorted) return 0.4 * (1 - heat);
        const s = soc(), I = params.mode === 'rest' ? 0 : effRate || 0;
        return ocv(s) + (params.mode === 'charge' ? 1 : -1) * 0.06 * I * (1 + Math.max(0, 15 - params.temp) / 20);
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0c1124' });
        if (!ions) return;
        const { top, bot, aL, aR, cL, cR, mid, x0, x1 } = L;
        // casing
        ctx.fillStyle = 'rgba(20,26,48,0.9)';
        ctx.strokeStyle = shorted ? `rgba(255,77,109,${0.5 + heat * 0.5})` : 'rgba(170,185,230,0.35)';
        ctx.lineWidth = 2;
        roundRect(ctx, x0, top, x1 - x0, bot - top, 14);
        ctx.fill();
        ctx.stroke();
        // electrolyte
        ctx.fillStyle = 'rgba(56,214,245,0.08)';
        ctx.fillRect(aR, top + 2, cL - aR, bot - top - 4);
        // separator
        ctx.setLineDash([5, 6]);
        ctx.strokeStyle = 'rgba(233,237,247,0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(mid, top + 8);
        ctx.lineTo(mid, bot - 8);
        ctx.stroke();
        ctx.setLineDash([]);
        // graphite sheets
        for (let r = 0; r <= ROWS; r++) {
          const y = top + 15 + r * L.rowH;
          ctx.strokeStyle = 'rgba(160,170,190,0.75)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let x = aL; x <= aR; x += 10) {
            const yy = y + ((Math.round((x - aL) / 10) % 2) ? 2.5 : -2.5);
            x === aL ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
          }
          ctx.stroke();
        }
        // oxide layers: rows of metal (purple) and oxygen (red) atoms
        for (let r = 0; r <= ROWS; r++) {
          const y = top + 15 + r * L.rowH;
          for (let x = cL + 6, k = 0; x <= cR; x += 11, k++) {
            ctx.fillStyle = k % 2 ? 'rgba(255,93,115,0.75)' : 'rgba(167,139,250,0.9)';
            ctx.beginPath();
            ctx.arc(x, y, k % 2 ? 2.6 : 3.4, 0, TAU);
            ctx.fill();
          }
        }
        // dendrites
        for (const d of dendrites) {
          if (!d.segs.length) continue;
          ctx.save();
          ctx.shadowColor = 'rgba(200,220,255,0.9)';
          ctx.shadowBlur = 8;
          ctx.strokeStyle = '#eef2fa';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (const s of d.segs) {
            ctx.moveTo(s[0], s[1]);
            ctx.lineTo(s[2], s[3]);
          }
          ctx.stroke();
          ctx.restore();
        }
        // ions
        ctx.globalCompositeOperation = 'lighter';
        for (const ion of ions) if (ion.path) drawGlow(ctx, ion.x, ion.y, 12, LI, 0.25);
        ctx.globalCompositeOperation = 'source-over';
        for (const ion of ions) {
          ctx.fillStyle = LI;
          ctx.beginPath();
          ctx.arc(ion.x + (ion.path ? 0 : ion.jx || 0), ion.y, ion.path ? 5 : 4.5, 0, TAU);
          ctx.fill();
          if (ion.path && L.wide && !api.thumbnail) text(ctx, '+', ion.x + 7, ion.y - 6, { size: 10, weight: 700, color: LI, shadow: false });
        }
        // wire, load and electrons
        const ax = (aL + aR) / 2, cx = (cL + cR) / 2, wy = L.wireY;
        ctx.strokeStyle = 'rgba(255,190,120,0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ax, top);
        ctx.lineTo(ax, wy);
        ctx.lineTo(cx, wy);
        ctx.lineTo(cx, top);
        ctx.stroke();
        const lx = ax + (cx - ax) * 0.3; // off-centre, clear of the hint and the arrow label
        const current = shorted || params.mode === 'rest' || status ? 0 : effRate || 0;
        if (params.mode === 'charge') {
          ctx.fillStyle = '#1b2240';
          ctx.strokeStyle = C.teal;
          ctx.lineWidth = 2;
          roundRect(ctx, lx - 34, wy - 18, 68, 36, 9);
          ctx.fill();
          ctx.stroke();
          text(ctx, 'charger', lx, wy, { size: 11, align: 'center', color: C.teal, shadow: false });
        } else {
          ctx.globalCompositeOperation = 'lighter';
          if (current > 0) drawGlow(ctx, lx, wy, 26 + current * 14, '#ffd166', 0.35);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#10142a';
          ctx.strokeStyle = current > 0 ? '#ffd166' : 'rgba(233,237,247,0.4)';
          ctx.lineWidth = 2;
          roundRect(ctx, lx - 16, wy - 26, 32, 52, 7);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = current > 0 ? 'rgba(120,190,255,0.85)' : 'rgba(80,90,120,0.6)';
          roundRect(ctx, lx - 12, wy - 21, 24, 40, 4);
          ctx.fill();
          if (!api.thumbnail) text(ctx, 'phone', lx + 24, wy, { size: 10, color: C.dim });
        }
        for (const e of electrons) {
          const [ex, ey] = wirePoint(e.dir > 0 ? e.t : 1 - e.t);
          ctx.fillStyle = ELECTRON;
          ctx.beginPath();
          ctx.arc(ex, ey, 3.5, 0, TAU);
          ctx.fill();
        }
        // sparks, flash and heat
        if (shorted) {
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, mid, (top + bot) / 2, 140 + heat * 200, '#ff4d3d', 0.08 + heat * 0.1);
          ctx.globalCompositeOperation = 'source-over';
        }
        for (const p of sparks) {
          ctx.fillStyle = `rgba(255,${200 - p.t * 120},90,${1 - p.t / 1.2})`;
          ctx.fillRect(p.x, p.y, 3, 3);
        }
        if (flash > 0) {
          ctx.fillStyle = `rgba(255,240,220,${flash * 0.35})`;
          ctx.fillRect(0, 0, w, h);
        }
        if (api.thumbnail) return;
        const lab = (str, x, col) => tag(ctx, str, x, bot + 18, col, { align: 'center', size: L.wide ? 11 : 10 });
        lab(L.wide ? 'graphite (−)' : 'graphite', (aL + aR) / 2, '#c8cfdc');
        lab(L.wide ? 'separator + electrolyte' : 'separator', mid, C.cyan);
        lab(L.wide ? 'metal oxide (+)' : 'oxide', (cL + cR) / 2, '#c9b6ff');
        if (L.wide) {
          // which way things are going
          const going = !shorted && params.mode !== 'rest' && !status;
          if (going) {
            const dir = params.mode === 'discharge' ? 1 : -1, y = top - 16;
            arrow(ctx, mid - dir * 50, y, mid + dir * 50, y, LI, 2, 8);
            text(ctx, 'Li⁺ through the electrolyte', mid, y - 15, { size: 10, align: 'center', color: LI });
          }
          const s = stress();
          if (params.mode === 'charge' && !shorted && s > PLATE) tag(ctx, 'lithium plating: ions arriving faster than the graphite can take them', w - 16, 112, C.red, { align: 'right', size: 11 });
        }
        if (status) tag(ctx, status === 'short circuit!' ? 'SHORT CIRCUIT: dendrite pierced the separator' : status === 'empty' ? 'battery empty' : 'fully charged', w - 16, 84, status === 'short circuit!' ? C.red : C.teal, { align: 'right', size: 12 });
      },
      stats() {
        if (!ions) return [];
        const plated = dendrites.reduce((a, d) => a + d.segs.length, 0);
        const cap = Math.round(((N - plated) / N) * 100);
        return [
          { label: 'Charge', value: Math.round(soc() * 100) + ' %', color: C.amber },
          { label: 'Voltage', value: this.voltage().toFixed(2) + ' V', color: C.cyan },
          { label: 'Current', value: params.mode === 'rest' || shorted || status ? '0' : `${(effRate || 0).toFixed(1)}C ${params.mode === 'charge' ? 'in' : 'out'}` },
          { label: 'Lithium lost to plating', value: plated ? `${plated} ions (capacity ${cap} %)` : 'none', color: plated ? C.red : C.teal },
        ];
      },
      charts() {
        return [
          { title: 'Voltage (V)', series: [{ data: sV.data, color: C.cyan }], min: 2.8, max: 4.4, length: 400 },
          { title: 'State of charge', series: [{ data: sS.data, color: C.amber }], min: 0, max: 1, length: 400 },
        ];
      },
    };
  },
};
