import { C, Series, backdrop, clamp, drawGlow, lerp, rand, randn, roundRect, tag, text, TAU } from '../../core/util.js';

// Acids, bases and pH. The pH is computed exactly from charge balance and the water equilibrium
// (Kw = 10⁻¹⁴; ethanoic acid Ka = 1.8 × 10⁻⁵). The molecule view shows far more ions than real water
// holds, on a squashed scale, so they can be seen at all.

const KW = 1e-14, KA = 1.8e-5;
const ACID_C = 0.1, BASE_C = 0.1, V_ACID = 25; // titration: 25 mL of 0.1 M acid, 0.1 M sodium hydroxide from the burette
const DROP = 0.002; // mmol per drop in the molecule view (into 50 mL)

function pHof(acidMmol, baseMmol, V, weak) {
  const Ct = acidMmol / V, Na = baseMmol / V; // mol/L (mmol/mL)
  if (!weak) {
    const D = Ct - Na;
    return -Math.log10((D + Math.sqrt(D * D + 4 * KW)) / 2);
  }
  // weak acid: H + Na = A + OH, with A = Ct·Ka/(Ka + H); solve on a log scale
  let lo = -14, hi = 0;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2, H = 10 ** m;
    const f = H + Na - (Ct * KA) / (KA + H) - KW / H;
    if (f > 0) hi = m;
    else lo = m;
  }
  return -(lo + hi) / 2;
}
// universal indicator
const IND = [[1, [214, 38, 38]], [3, [240, 120, 40]], [5, [235, 205, 50]], [7, [70, 190, 80]], [9, [40, 120, 210]], [11, [70, 60, 170]], [13, [120, 40, 150]]];
function indicator(pH) {
  const p = clamp(pH, 1, 13);
  for (let i = 0; i < IND.length - 1; i++)
    if (p <= IND[i + 1][0]) {
      const t = (p - IND[i][0]) / (IND[i + 1][0] - IND[i][0]);
      return IND[i][1].map((v, k) => Math.round(lerp(v, IND[i + 1][1][k], t)));
    }
  return IND.at(-1)[1];
}
const rgb = (c, a = 1) => `rgba(${c.join(',')},${a})`;
/** How many H₃O⁺ (or OH⁻) to show: three in neutral water, rising tenfold per two-and-a-half pH units, capped. */
const shown = (p) => Math.round(clamp(3 * 10 ** ((7 - p) / 2.5), 0, 46));

export default {
  id: 'acids-bases',
  title: 'Acids, Bases & pH',
  category: 'chemistry',
  tagline: 'Protons hop from molecule to molecule, and one drop can swing a solution from acid to alkali.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Acids', 'Equilibrium', 'Titration'],
  keywords: ['pH', 'acid', 'alkali', 'base', 'hydronium', 'hydroxide', 'neutralisation', 'titration', 'indicator', 'Grotthuss', 'buffer', 'vinegar'],
  blurb:
    'An acid is a substance that hands protons (hydrogen ions) to water; a base takes them away. The pH scale counts those protons on a scale of tens: each step is ten times more acidic than the next. Watch protons hop through water, neutralise an acid drop by drop, and see why a titration flips colour so suddenly.',
  ideas: [
    'Even pure water splits a tiny bit: 2 H₂O ⇌ H₃O⁺ + OH⁻. In neutral water the two are equal: pH 7.',
    'An <b>acid</b> gives protons to water, making H₃O⁺; a <b>base</b> makes OH⁻, which grabs them back.',
    'pH = −log₁₀[H₃O⁺]: each pH step means <b>ten times</b> more or less H₃O⁺.',
    'Protons don’t swim far: they <b>hop</b> along chains of water molecules, which makes acids conduct so well.',
    'In a titration the pH barely moves until the acid is nearly used up, then leaps several units in a drop.',
  ],
  hint: 'Add drops of acid or base, or switch to the titration',
  thumbChapter: 2,
  thumbFrames: 240,
  params: [
    { key: 'scene', label: 'View', type: 'select', value: 'molecules', options: [{ value: 'molecules', label: 'Molecules in water' }, { value: 'titration', label: 'Titration' }] },
    { key: 'acid', label: 'Acid in the flask', type: 'select', value: 'strong', options: [{ value: 'strong', label: 'Hydrochloric (strong)' }, { value: 'weak', label: 'Ethanoic, vinegar (weak)' }] },
    { key: 'drip', label: 'Burette open', type: 'toggle', value: false },
    { key: 'rate', label: 'Drip rate', type: 'range', min: 0.2, max: 3, step: 0.1, value: 1, format: (v) => v.toFixed(1) + ' mL/s' },
    { key: 'hops', label: 'Highlight proton hops', type: 'toggle', value: false },
    { key: 'addA', label: '+ drop of acid', type: 'button', action: (s) => s.drop('acid') },
    { key: 'addB', label: '+ drop of base', type: 'button', action: (s) => s.drop('base') },
    { key: 'fresh', label: 'Start again', type: 'button', action: (s) => s.fresh() },
  ],
  story: [
    {
      title: 'Water is never just water',
      text: 'Every so often two water molecules swap a proton: one becomes H₃O⁺ (orange), the other OH⁻ (blue). In pure water there are always equal numbers of each, so it is <b>neutral</b>: pH 7. In real water only about one molecule in 550 million is split; here we show far more so you can see them.',
      formula: '2 H₂O  ⇌  H₃O⁺ + OH⁻',
      params: { scene: 'molecules', hops: false, drip: false },
      enter: (s) => s.fresh(),
      duration: 14,
    },
    {
      title: 'Add an acid',
      text: 'Hydrogen chloride hands its proton straight to water, leaving a chloride ion (green) behind. H₃O⁺ floods the solution and the pH meter falls. The pH counts H₃O⁺ on a scale of tens: each step down means ten times more of it.',
      formula: 'HCl + H₂O → H₃O⁺ + Cl⁻        pH = −log₁₀[H₃O⁺]',
      params: { scene: 'molecules' },
      enter: (s) => {
        s.fresh();
        for (let i = 0; i < 6; i++) s.drop('acid');
      },
      duration: 15,
    },
    {
      title: 'Powers of ten',
      text: 'Lemon juice is about pH 2, coffee about pH 5, pure water pH 7, seawater about 8 and bleach about 13.',
      check: {
        q: 'Solution A is pH 3 and solution B is pH 5. How much more H₃O⁺ does A have?',
        options: ['2 times', '20 times', '100 times'],
        answer: 2,
        setup: { scene: 'molecules' },
        explain: 'Each pH step is a factor of ten, so two steps is 10 × 10 = 100 times. That is why a small change in pH can matter so much, for example to your blood or to sea creatures building shells.',
      },
      params: { scene: 'molecules' },
      duration: 12,
    },
    {
      title: 'Protons hop',
      text: 'An H₃O⁺ ion barely moves. Instead it passes a proton to the next water molecule, which passes one on in turn, like a relay or a Newton’s cradle. The charge races along while each atom only shuffles a little. This hopping, described by Theodor Grotthuss in 1806, is why acids conduct electricity so well.',
      params: { scene: 'molecules', hops: true },
      enter: (s) => s.ensureAcid(),
      duration: 15,
    },
    {
      title: 'Neutralisation',
      text: 'Now add sodium hydroxide, a base. Each OH⁻ grabs a proton from an H₃O⁺ and the pair become two ordinary water molecules (the flashes). One drop of base cancels one drop of acid, and the pH climbs back towards 7.',
      formula: 'H₃O⁺ + OH⁻  →  2 H₂O',
      params: { scene: 'molecules', hops: false },
      enter: (s) => {
        s.ensureAcid();
        for (let i = 0; i < 6; i++) setTimeout(() => s.drop('base'), 400 + i * 700);
      },
      duration: 15,
    },
    {
      title: 'A titration',
      text: 'Chemists measure how much acid is in a sample by adding base from a burette until it is exactly neutralised. Universal indicator shows the pH. At first each drop of base hardly changes anything: there is plenty of acid left to swallow it.',
      params: { scene: 'titration', acid: 'strong', drip: true, rate: 1.2 },
      enter: (s) => s.fresh(12),
      duration: 18,
    },
    {
      title: 'The sudden leap',
      text: 'Near 25 mL the acid runs out, and the pH leaps from about 4 to 10 within a few drops: the end point.',
      check: {
        q: 'Why does the pH jump so suddenly near the end of the titration?',
        options: ['Once the acid is used up, even a drop of base changes [H₃O⁺] a thousandfold', 'The indicator runs out', 'The base gets stronger'],
        answer: 0,
        setup: { scene: 'titration', acid: 'strong', drip: false },
        explain: 'pH is logarithmic. With lots of acid left, a drop barely dents it. With almost none left, the same drop removes most of what remains, then adds excess OH⁻: [H₃O⁺] falls by factors of ten with every drop.',
      },
      params: { scene: 'titration', acid: 'strong', drip: true, rate: 1 },
      enter: (s) => s.fresh(20),
      duration: 16,
    },
    {
      title: 'Weak acids and buffers',
      text: 'Vinegar’s ethanoic acid is <b>weak</b>: most of its molecules keep their proton, so it starts near pH 3, not 1. Halfway through, the curve goes flat. The mix of acid and its salt soaks up added base: a <b>buffer</b>, the same trick your blood uses to stay at pH 7.4. The end point lands above 7.',
      params: { scene: 'titration', acid: 'weak', drip: true, rate: 1.4 },
      enter: (s) => s.fresh(0),
      duration: 20,
    },
    {
      title: 'Your lab',
      text: 'Switch views. Add drops of acid and base to water, or run titrations with a strong and a weak acid and compare the curves.',
      params: { scene: 'molecules', hops: false, drip: false },
      enter: (s) => s.fresh(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    // ---------------------------------------------------------------- chemistry state
    let mol = { acid: 0, base: 0, V: 50 }; // molecule view: mmol of strong acid and base in 50 mL of water
    let tit = { Vb: 0, curve: [] }; // titration: mL of base added
    const sPH = new Series(400);
    const pHmol = () => pHof(mol.acid, mol.base, mol.V, false);
    const pHtit = () => pHof(ACID_C * V_ACID, BASE_C * tit.Vb, V_ACID + tit.Vb, params.acid === 'weak');
    const pH = () => (params.scene === 'titration' ? pHtit() : pHmol());

    // ---------------------------------------------------------------- particles
    let ps = [], flashes = [], hopsFx = [], drops = [], hopT = 0;
    const narrow = () => api.w < 760;
    function mk(type, x, y) {
      return { type, x: x ?? rand(20, api.w - 20), y: y ?? rand(70, api.h - 20), vx: randn() * 12, vy: randn() * 12, a: rand(TAU), va: rand(-1, 1), seek: false };
    }
    function populate() {
      ps = [];
      const n = api.thumbnail ? 90 : Math.round(clamp((api.w * api.h) / 4200, 80, 190));
      for (let i = 0; i < n; i++) ps.push(mk('w'));
    }
    const count = (t) => ps.reduce((a, p) => a + (p.type === t), 0);
    function convert(from, to, near) {
      const pool = ps.filter((p) => p.type === from);
      if (!pool.length) return null;
      let p = pool[Math.floor(Math.random() * pool.length)];
      if (near) p = pool.reduce((b, q) => ((q.x - near.x) ** 2 + (q.y - near.y) ** 2 < (b.x - near.x) ** 2 + (b.y - near.y) ** 2 ? q : b));
      p.type = to;
      return p;
    }
    function fresh(vb) {
      mol = { acid: 0, base: 0, V: 50 };
      tit = { Vb: vb ?? 0, curve: [] };
      if (vb) for (let v = 0; v <= vb; v += 0.25) tit.curve.push([v, pHof(ACID_C * V_ACID, BASE_C * v, V_ACID + v, params.acid === 'weak')]);
      populate();
      sPH.clear();
      flashes = [];
      drops = [];
      // neutral water: three of each, made as pairs
      for (let i = 0; i < 3; i++) {
        const a = convert('w', 'h');
        if (a) convert('w', 'oh', a);
      }
    }
    function drop(kind) {
      if (params.scene === 'titration') {
        tit.Vb = Math.min(50, tit.Vb + 0.5);
        return;
      }
      const x = rand(api.w * 0.2, api.w * 0.8);
      if (kind === 'acid') {
        mol.acid += DROP;
        // the acid's protons go to water; each leaves a chloride behind
        for (let i = 0; i < 2; i++) {
          const p = convert('w', 'h', { x, y: 80 });
          if (p) (p.seek = true), ps.push(mk('cl', p.x + rand(-20, 20), p.y + rand(-20, 20)));
        }
      } else {
        mol.base += DROP;
        for (let i = 0; i < 2; i++) {
          const p = convert('w', 'oh', { x, y: 80 });
          if (p) (p.seek = true), ps.push(mk('na', p.x + rand(-20, 20), p.y + rand(-20, 20)));
        }
      }
      drops.push({ x, t: 0, kind });
    }

    return {
      fresh,
      drop,
      /** Opening the neutralisation chapter directly: start from the acid of the chapters before it. */
      ensureAcid() {
        if (mol.acid > mol.base) return;
        fresh();
        for (let i = 0; i < 6; i++) drop('acid');
      },
      reset: () => fresh(),
      resize() {
        if (!ps.length) fresh();
      },
      onParam(k) {
        if (k === 'acid') fresh(params.scene === 'titration' ? 0 : undefined);
      },
      update(dt) {
        dt = Math.min(dt, 0.05);
        const { w, h } = api;
        if (params.scene === 'titration') {
          if (params.drip && tit.Vb < 50) {
            const before = tit.Vb;
            tit.Vb = Math.min(50, tit.Vb + params.rate * dt);
            if (Math.floor(before * 4) !== Math.floor(tit.Vb * 4)) drops.push({ t: 0, kind: 'tit' });
          }
          const last = tit.curve.at(-1);
          if (!last || tit.Vb - last[0] >= 0.1) tit.curve.push([tit.Vb, pHtit()]);
        }
        for (const d of drops) d.t += dt;
        drops = drops.filter((d) => d.t < 1);
        // molecule view: keep the numbers of H₃O⁺ and OH⁻ near what the pH calls for
        const p7 = pHmol();
        const tH = shown(p7), tOH = shown(14 - p7);
        let nH = count('h'), nOH = count('oh');
        // H₃O⁺ meeting OH⁻ becomes two waters (only while there are more than the pH calls for)
        for (const a of ps) {
          if (a.type !== 'h') continue;
          for (const b of ps) {
            if (b.type !== 'oh') continue;
            const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
            if (d2 < 22 * 22 && (nH > tH || nOH > tOH)) {
              a.type = b.type = 'w';
              a.seek = b.seek = false;
              flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: 0 });
              nH--;
              nOH--;
              break;
            }
          }
        }
        if (Math.random() < dt * 3) {
          if (nH < tH) {
            const a = convert('w', 'h');
            if (a && nOH < tOH) convert('w', 'oh', a);
          } else if (nOH < tOH) convert('w', 'oh');
          else if (nH > tH + 2 && nOH === 0) convert('h', 'w');
          else if (nOH > tOH + 2 && nH === 0) convert('oh', 'w');
        }
        // spare chloride / sodium ions fade once the solution no longer needs them
        const nCl = count('cl'), nNa = count('na');
        if (nCl > Math.max(tH, 0) + 4) ps.splice(ps.findIndex((p) => p.type === 'cl'), 1);
        if (nNa > Math.max(tOH, 0) + 4) ps.splice(ps.findIndex((p) => p.type === 'na'), 1);
        // proton hops: an H₃O⁺ hands a proton to a neighbouring water
        hopT -= dt;
        if (hopT <= 0) {
          hopT = params.hops ? 0.08 : 0.4;
          const hs = ps.filter((p) => p.type === 'h');
          if (hs.length) {
            const a = hs[Math.floor(Math.random() * hs.length)];
            let best = null, bd = 60 * 60;
            for (const q of ps) {
              if (q.type !== 'w') continue;
              const d2 = (q.x - a.x) ** 2 + (q.y - a.y) ** 2;
              if (d2 < bd) (bd = d2), (best = q);
            }
            if (best) {
              a.type = 'w';
              best.type = 'h';
              best.seek = a.seek;
              a.seek = false;
              hopsFx.push({ x1: a.x, y1: a.y, x2: best.x, y2: best.y, t: 0 });
            }
          }
        }
        for (const f of hopsFx) f.t += dt;
        hopsFx = hopsFx.filter((f) => f.t < (params.hops ? 0.9 : 0.35));
        // drift; fresh base ions home in on H₃O⁺ (and acid on OH⁻) so neutralisation can be seen
        for (const p of ps) {
          if (p.seek && (p.type === 'oh' || p.type === 'h')) {
            const tgt = p.type === 'oh' ? 'h' : 'oh';
            let best = null, bd = Infinity;
            for (const q of ps) {
              if (q.type !== tgt) continue;
              const d2 = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
              if (d2 < bd) (bd = d2), (best = q);
            }
            if (best) {
              const d = Math.sqrt(bd) || 1;
              p.vx += ((best.x - p.x) / d) * 160 * dt;
              p.vy += ((best.y - p.y) / d) * 160 * dt;
            } else p.seek = false;
          }
          p.vx += randn() * 40 * dt;
          p.vy += randn() * 40 * dt;
          p.vx *= 1 - dt * 1.5;
          p.vy *= 1 - dt * 1.5;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.a += p.va * dt;
          if (p.x < 14) (p.x = 14), (p.vx = Math.abs(p.vx));
          if (p.x > w - 14) (p.x = w - 14), (p.vx = -Math.abs(p.vx));
          if (p.y < 64) (p.y = 64), (p.vy = Math.abs(p.vy));
          if (p.y > h - 14) (p.y = h - 14), (p.vy = -Math.abs(p.vy));
        }
        for (const f of flashes) f.t += dt;
        flashes = flashes.filter((f) => f.t < 0.6);
        if (api.frame % 4 === 0) sPH.push(pH());
      },
      draw() {
        const { w, h } = api;
        if (params.scene === 'titration') this.drawTitration(w, h);
        else this.drawMolecules(w, h);
      },
      drawMolecules(w, h) {
        backdrop(ctx, w, h, { center: '#0a1424' });
        // proton hop trails
        for (const f of hopsFx) {
          const life = params.hops ? 0.9 : 0.35, a = 1 - f.t / life;
          ctx.strokeStyle = `rgba(255,181,71,${a * (params.hops ? 0.9 : 0.4)})`;
          ctx.lineWidth = params.hops ? 3 : 1.5;
          ctx.beginPath();
          ctx.moveTo(f.x1, f.y1);
          ctx.lineTo(f.x2, f.y2);
          ctx.stroke();
          const u = Math.min(1, f.t * 4);
          ctx.fillStyle = `rgba(255,240,200,${a})`;
          ctx.beginPath();
          ctx.arc(lerp(f.x1, f.x2, u), lerp(f.y1, f.y2, u), 3, 0, TAU);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const f of flashes) drawGlow(ctx, f.x, f.y, 40 * (1 - f.t / 0.6) + 8, '#ffffff', 0.25);
        for (const p of ps) {
          if (p.type === 'h') drawGlow(ctx, p.x, p.y, 22, '#ff8a3d', 0.35);
          else if (p.type === 'oh') drawGlow(ctx, p.x, p.y, 22, '#3d8bff', 0.35);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (const p of ps) this.drawMol(p);
        for (const d of drops) {
          if (d.kind === 'tit') continue;
          const y = 70 + d.t * 60;
          ctx.fillStyle = d.kind === 'acid' ? `rgba(255,138,61,${1 - d.t})` : `rgba(61,139,255,${1 - d.t})`;
          ctx.beginPath();
          ctx.ellipse(d.x, y, 6, 9, 0, 0, TAU);
          ctx.fill();
        }
        if (api.thumbnail) return;
        this.meter(w - 16, 84, pHmol());
        if (!narrow()) {
          const key = [['h', 'H₃O⁺', '#ff8a3d'], ['oh', 'OH⁻', '#5b9bff'], ['cl', 'Cl⁻', '#7be38f'], ['na', 'Na⁺', '#c9a7ff']];
          let x = 24;
          for (const [, lab, col] of key) {
            tag(ctx, lab, x, 84, col, { size: 11 });
            x += 64;
          }
        }
      },
      drawMol(p) {
        const O = { w: '#e05a5a', h: '#ff8a3d', oh: '#4d8dff' }[p.type];
        if (p.type === 'cl' || p.type === 'na') {
          ctx.fillStyle = p.type === 'cl' ? '#5fd377' : '#b48cff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.type === 'cl' ? 7.5 : 5, 0, TAU);
          ctx.fill();
          return;
        }
        const nH = p.type === 'w' ? 2 : p.type === 'h' ? 3 : 1;
        const angs = nH === 2 ? [-0.91, 0.91] : nH === 3 ? [-1.9, 0, 1.9] : [0];
        for (const a of angs) {
          const x = p.x + Math.cos(p.a + a) * 8, y = p.y + Math.sin(p.a + a) * 8;
          ctx.fillStyle = '#eef1f7';
          ctx.beginPath();
          ctx.arc(x, y, 3.6, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = O;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.type === 'w' ? 6.2 : 7, 0, TAU);
        ctx.fill();
        if (p.type !== 'w' && !api.thumbnail) text(ctx, p.type === 'h' ? '+' : '−', p.x + 9, p.y - 9, { size: 12, weight: 700, color: O, shadow: false });
      },
      meter(x, y, p) {
        const col = indicator(p);
        const label = p < 6.5 ? 'acidic' : p > 7.5 ? 'alkaline' : 'neutral';
        tag(ctx, `pH ${p.toFixed(2)}  ·  ${label}`, x, y, rgb(col.map((v) => Math.min(255, v + 60))), { align: 'right', size: 13 });
      },
      drawTitration(w, h) {
        backdrop(ctx, w, h, { center: '#0d1226' });
        const wide = !narrow();
        const p = pHtit(), col = indicator(p);
        // burette
        const bx = wide ? w * 0.22 : w * 0.22, by0 = 110, by1 = wide ? 330 : Math.max(200, h * 0.32);
        ctx.fillStyle = 'rgba(200,215,255,0.08)';
        ctx.strokeStyle = 'rgba(200,215,255,0.5)';
        ctx.lineWidth = 2;
        ctx.fillRect(bx - 9, by0, 18, by1 - by0);
        ctx.strokeRect(bx - 9, by0, 18, by1 - by0);
        const level = by0 + 6 + (tit.Vb / 50) * (by1 - by0 - 12);
        ctx.fillStyle = 'rgba(160,190,255,0.35)';
        ctx.fillRect(bx - 8, level, 16, by1 - level);
        for (let i = 0; i <= 10; i++) {
          const y = by0 + 6 + (i / 10) * (by1 - by0 - 12);
          ctx.fillStyle = 'rgba(233,237,247,0.5)';
          ctx.fillRect(bx + 9, y, i % 5 ? 4 : 8, 1);
        }
        ctx.beginPath();
        ctx.moveTo(bx - 4, by1);
        ctx.lineTo(bx, by1 + 22);
        ctx.lineTo(bx + 4, by1);
        ctx.fillStyle = 'rgba(200,215,255,0.5)';
        ctx.fill();
        ctx.fillStyle = params.drip ? C.teal : C.red;
        ctx.fillRect(bx - 12, by1 + 4, 24, 5);
        // flask
        const fy0 = by1 + 50, fy1 = wide ? Math.min(h - 340, fy0 + 230) : Math.min(h - 120, fy0 + 150), fw = wide ? 190 : Math.min(140, w * 0.36);
        const fill = clamp(0.35 + (tit.Vb / 50) * 0.4, 0, 0.8);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bx - 16, fy0);
        ctx.lineTo(bx - 16, fy0 + 40);
        ctx.lineTo(bx - fw / 2, fy1);
        ctx.lineTo(bx + fw / 2, fy1);
        ctx.lineTo(bx + 16, fy0 + 40);
        ctx.lineTo(bx + 16, fy0);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(210,225,255,0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.clip();
        const ly = fy1 - (fy1 - fy0) * fill;
        ctx.fillStyle = rgb(col, 0.9);
        ctx.fillRect(bx - fw, ly, fw * 2, fy1 - ly);
        ctx.restore();
        for (const d of drops) {
          if (d.kind !== 'tit') continue;
          const y = by1 + 24 + d.t * (ly - by1 - 24);
          if (y > ly) continue;
          ctx.fillStyle = 'rgba(170,200,255,0.9)';
          ctx.beginPath();
          ctx.ellipse(bx, y, 3, 4.5, 0, 0, TAU);
          ctx.fill();
        }
        if (!api.thumbnail) {
          if (wide) text(ctx, `${tit.Vb.toFixed(1)} mL of NaOH added`, bx + 26, by0 + 10, { size: 11, color: C.ink });
          else text(ctx, `${tit.Vb.toFixed(1)} mL added`, bx, by0 - 14, { size: 11, align: 'center', color: C.ink });
          if (wide) text(ctx, `25 mL of ${params.acid === 'weak' ? 'ethanoic acid' : 'hydrochloric acid'} + indicator`, bx, fy1 + 18, { size: 11, align: 'center', color: C.dim });
          this.meter(w - 16, 84, p);
        }
        // titration curve
        // phones: the curve sits beside the flask
        const gx0 = wide ? Math.max(bx + fw / 2 + 60, w * 0.45) : bx + fw / 2 + 40, gx1 = w - (wide ? 30 : 14);
        const gy0 = wide ? 140 : by0 + 40, gy1 = wide ? Math.min(h - 360, 560) : fy1;
        if (gy1 - gy0 < 80) return;
        ctx.fillStyle = 'rgba(8,11,22,0.75)';
        roundRect(ctx, gx0 - 36, gy0 - 26, gx1 - gx0 + 52, gy1 - gy0 + 56, 12);
        ctx.fill();
        // indicator colour key on the pH axis
        for (let k = 0; k < 140; k++) {
          ctx.fillStyle = rgb(indicator(k / 10), 0.8);
          ctx.fillRect(gx0 - 8, gy1 - ((k + 1) / 140) * (gy1 - gy0), 5, (gy1 - gy0) / 140 + 0.5);
        }
        ctx.strokeStyle = 'rgba(233,237,247,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
        const X = (v) => gx0 + (v / 50) * (gx1 - gx0), Y = (q) => gy1 - (q / 14) * (gy1 - gy0);
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(gx0, Y(7));
        ctx.lineTo(gx1, Y(7));
        ctx.moveTo(X(25), gy0);
        ctx.lineTo(X(25), gy1);
        ctx.stroke();
        ctx.setLineDash([]);
        if (!api.thumbnail) {
          for (const q of [0, 7, 14]) text(ctx, String(q), gx0 - 14, Y(q), { size: 10, align: 'right', color: C.dim, shadow: false });
          for (const v of [0, 25, 50]) text(ctx, `${v}`, X(v), gy1 + 12, { size: 10, align: 'center', color: C.dim, shadow: false });
          text(ctx, wide ? 'pH as base is added (mL)' : 'pH vs mL', gx0, gy0 - 12, { size: 11, color: C.ink, shadow: false });
          text(ctx, 'end point', X(25) + 6, gy0 + 12, { size: 10, color: C.dim, shadow: false });
        }
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        tit.curve.forEach(([v, q], i) => (i ? ctx.lineTo(X(v), Y(q)) : ctx.moveTo(X(v), Y(q))));
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(X(tit.Vb), Y(p), 4.5, 0, TAU);
        ctx.fill();
      },
      stats() {
        const p = pH();
        if (params.scene === 'titration')
          return [
            { label: 'pH', value: p.toFixed(2), color: rgb(indicator(p).map((v) => Math.min(255, v + 60))) },
            { label: 'Base added', value: tit.Vb.toFixed(1) + ' mL' },
            { label: '[H₃O⁺]', value: `${(10 ** -p).toExponential(1)} mol/L` },
            { label: 'Acid left', value: tit.Vb >= 25 ? 'none' : `${Math.round((1 - tit.Vb / 25) * 100)} %` },
          ];
        return [
          { label: 'pH', value: p.toFixed(2), color: rgb(indicator(p).map((v) => Math.min(255, v + 60))) },
          { label: '[H₃O⁺]', value: `${(10 ** -p).toExponential(1)} mol/L` },
          { label: '[OH⁻]', value: `${(10 ** (p - 14)).toExponential(1)} mol/L` },
          { label: 'H₃O⁺ / OH⁻ on screen', value: `${count('h')} / ${count('oh')}` },
        ];
      },
      charts() {
        return [{ title: 'pH over time', series: [{ data: sPH.data, color: C.amber }], min: 0, max: 14, length: 400 }];
      },
    };
  },
};
