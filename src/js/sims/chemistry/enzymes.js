import { C, Series, backdrop, clamp, drawGlow, rand, randn, roundRect, tag, text, TAU } from '../../core/util.js';

// Lactase splitting lactose into glucose and galactose. Enzymes are big drifting blobs with a pocket (active site);
// sugars wander by diffusion. A sugar that reaches a free pocket binds, is split after a short time that shortens
// as it warms (Q10 = 2), and the products are released. Above about 45 °C enzymes unfold for good.

const RE = 34; // enzyme radius
const GLC = '#2ee6a6', GAL = '#ff79b0', INH = '#9aa3b8', ENZ = '#8b6cff';

export default {
  id: 'enzymes',
  title: 'Enzymes: Life’s Catalysts',
  category: 'chemistry',
  tagline: 'Protein machines that split a sugar in a split second, a job that would otherwise take millions of years.',
  ages: ['14-16', '16+'],
  topics: ['Enzymes', 'Rates', 'Proteins'],
  keywords: ['enzyme', 'catalyst', 'active site', 'lock and key', 'induced fit', 'denature', 'inhibitor', 'lactase', 'lactose intolerance', 'Michaelis-Menten', 'activation energy'],
  blurb:
    'Nearly every reaction in your body is run by an enzyme: a folded protein with a pocket shaped to grip one particular molecule. Watch lactase split milk sugar, see the reaction speed up with more sugar until every enzyme is busy, and find out why too much heat or a look-alike molecule stops it dead.',
  ideas: [
    'An enzyme is a protein whose <b>active site</b> fits its substrate like a key in a lock, and hugs it as it binds (<b>induced fit</b>).',
    'It speeds a reaction by giving it an easier path with a <b>lower activation energy</b>, and comes out unchanged.',
    'More substrate means faster reaction, until every enzyme is busy: the rate <b>levels off</b> (saturation).',
    'Warmth speeds enzymes up, but too much heat <b>denatures</b> them: the pocket loses its shape.',
    'Look-alike <b>inhibitors</b> block the pocket; many medicines work this way.',
  ],
  hint: 'Change the sugar, temperature and inhibitors',
  thumbChapter: 2,
  thumbFrames: 300,
  params: [
    { key: 'sugar', label: 'Lactose (milk sugar)', type: 'range', min: 0, max: 110, step: 1, value: 40, format: (v) => `${Math.round(v)} molecules` },
    { key: 'nEnz', label: 'Lactase enzymes', type: 'range', min: 0, max: 8, step: 1, value: 6 },
    { key: 'temp', label: 'Temperature', type: 'range', min: 5, max: 70, step: 1, value: 37, unit: '°C' },
    { key: 'inhib', label: 'Inhibitor (look-alike) molecules', type: 'range', min: 0, max: 40, step: 1, value: 0 },
    { key: 'sweep', type: 'toggle', value: false, hidden: true },
    { key: 'fresh', label: 'Fresh enzymes', type: 'button', action: (s) => s.freshEnzymes() },
  ],
  story: [
    {
      title: 'A job for an enzyme',
      text: 'Milk contains lactose, a sugar made of two smaller sugars joined together: glucose (green) and galactose (pink). Before you can absorb it, the bond must be cut. In plain water a bond like this can last for millions of years. In your gut, the enzyme <b>lactase</b> (purple) cuts it in a fraction of a second.',
      formula: 'lactose + water  →  glucose + galactose',
      params: { sugar: 40, nEnz: 6, temp: 37, inhib: 0, sweep: false },
      enter: (s) => s.init(),
      duration: 15,
    },
    {
      title: 'Lock and key',
      text: 'Each enzyme is a folded protein with a pocket, the <b>active site</b>, shaped to fit lactose and almost nothing else. When a sugar wanders in, the pocket closes around it, strains the bond, and the two halves pop out. The enzyme is unchanged and ready for the next one.',
      formula: 'E + S  ⇌  ES  →  E + P',
      params: { sugar: 40, nEnz: 6, temp: 37 },
      duration: 15,
    },
    {
      title: 'A lower barrier',
      text: 'Like every catalyst, the enzyme doesn’t add energy: it offers an easier route with a much lower energy hill (the panel). Lactase handles hundreds of sugars a second; the fastest enzyme, catalase, breaks down tens of millions of hydrogen peroxide molecules a second.',
      params: { sugar: 40, nEnz: 6, temp: 37 },
      duration: 14,
    },
    {
      title: 'All hands busy',
      text: 'Now we add more and more sugar. At first the rate rises in step: more sugar, more collisions with free pockets. But soon almost every enzyme is busy all the time, and the rate levels off. Watch the plot of rate against sugar.',
      check: {
        q: 'Every enzyme is already busy almost all the time. What happens to the rate if you double the sugar?',
        options: ['It barely changes', 'It doubles', 'It halves'],
        answer: 0,
        setup: { sugar: 10, nEnz: 6, temp: 37, sweep: false },
        explain: 'The bottleneck is now the enzymes, not the sugar: each can only work so fast. To go faster you need more enzyme. This levelling-off is called saturation, and its top speed is Vmax.',
      },
      params: { nEnz: 6, temp: 37, sweep: true },
      enter: (s) => s.startSweep(),
      duration: 20,
    },
    {
      title: 'Warmer, faster… then broken',
      text: 'Warming speeds everything up: molecules move faster and the cutting step runs quicker. But enzymes are held in shape by weak bonds. Above about 45 °C they start to unfold, the pocket loses its shape (grey), and the reaction stops. Human enzymes work best near body temperature, 37 °C.',
      check: {
        q: 'Why does the rate crash when the temperature rises above about 45 °C?',
        options: ['The enzymes unfold and the active site loses its shape', 'The sugar molecules melt', 'The enzymes are used up by the reaction'],
        answer: 0,
        setup: { sugar: 60, nEnz: 6, temp: 37, sweep: false },
        explain: 'Heat shakes the enzyme’s fold apart (it denatures), so the pocket no longer fits the sugar. Cooling it again doesn’t usually help: like a cooked egg, the protein has lost its shape for good.',
      },
      params: { sugar: 60, nEnz: 6, temp: 58, sweep: false },
      enter: (s) => s.freshEnzymes(),
      tween: 10,
      duration: 18,
    },
    {
      title: 'Blocking the pocket',
      text: 'An <b>inhibitor</b> (grey) looks enough like the sugar to sit in the pocket, but can’t be cut, so it just stays there, blocking the way. Many medicines work like this: ibuprofen blocks the enzyme that makes pain signals, and statins block one that makes cholesterol.',
      params: { sugar: 60, nEnz: 6, temp: 37, inhib: 30, sweep: false },
      enter: (s) => s.freshEnzymes(),
      duration: 16,
    },
    {
      title: 'Lactose intolerance',
      text: 'Babies make plenty of lactase. Most adults in the world make much less after childhood. With few enzymes the sugar piles up, passes on to gut bacteria, and they ferment it into gas: lactose intolerance. People whose ancestors herded cattle often kept making lactase, a classic example of recent human evolution.',
      params: { sugar: 80, nEnz: 1, temp: 37, inhib: 0, sweep: false },
      enter: (s) => s.freshEnzymes(),
      duration: 16,
    },
    {
      title: 'Your lab',
      text: 'Change the amount of sugar and enzyme, warm or cool it, and add inhibitors. Can you find the temperature that gives the fastest rate before the enzymes give up?',
      params: { sugar: 40, nEnz: 6, temp: 37, inhib: 0, sweep: false },
      enter: (s) => s.freshEnzymes(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let enz = [], subs = [], prods = [], flashes = [], made = [], curve = [], sweepT = 0, sampleT = 0;
    const sRate = new Series(400);
    const narrow = () => api.w < 760;
    const area = () => ({ x0: 10, y0: 60, x1: api.w - 10, y1: api.h - 10 });

    function mkEnz() {
      const a = area();
      return { x: rand(a.x0 + 60, a.x1 - 60), y: rand(a.y0 + 60, a.y1 - 60), vx: 0, vy: 0, th: rand(TAU), w: rand(-0.3, 0.3), bound: null, t: 0, close: 0, dead: false, wob: rand(TAU) };
    }
    function mkSub(type, edge) {
      const a = area();
      let x = rand(a.x0, a.x1), y = rand(a.y0, a.y1);
      if (edge) {
        const s = Math.floor(rand(4));
        if (s === 0) x = a.x0;
        else if (s === 1) x = a.x1;
        else if (s === 2) y = a.y0;
        else y = a.y1;
      }
      return { type, x, y, vx: randn() * 20, vy: randn() * 20, a: rand(TAU), va: rand(-2, 2), enz: null };
    }
    function init() {
      enz = [];
      subs = [];
      prods = [];
      flashes = [];
      made = [];
      for (let i = 0; i < Math.round(params.nEnz); i++) enz.push(mkEnz());
      for (let i = 0; i < Math.round(params.sugar); i++) subs.push(mkSub('lac'));
      for (let i = 0; i < Math.round(params.inhib); i++) subs.push(mkSub('inh'));
    }
    function freshEnzymes() {
      for (const e of enz) {
        if (e.bound) e.bound.enz = null;
        e.dead = false;
        e.bound = null;
        e.close = 0;
      }
      if (!enz.length && !subs.length) init();
    }
    function startSweep() {
      curve = [];
      sweepT = 0;
      api.runner.set('sugar', 2);
    }
    const kSpeed = () => 2 ** ((params.temp - 37) / 10); // reactions run about twice as fast for every 10 °C
    const pocket = (e) => [e.x + Math.cos(e.th) * RE * 0.62, e.y + Math.sin(e.th) * RE * 0.62];
    const rate = () => made.filter((t) => api.time - t < 3).length / 3;

    return {
      init,
      freshEnzymes,
      startSweep,
      reset: init,
      resize() {
        if (!enz.length && !subs.length) init();
      },
      update(dt) {
        dt = Math.min(dt, 0.05);
        const a = area();
        // keep the numbers of molecules matching the sliders
        const want = { lac: Math.round(params.sugar), inh: Math.round(params.inhib) };
        for (const type of ['lac', 'inh']) {
          const have = subs.filter((s) => s.type === type).length;
          if (have < want[type]) subs.push(mkSub(type, true));
          else if (have > want[type]) {
            const i = subs.findIndex((s) => s.type === type && !s.enz);
            if (i >= 0) subs.splice(i, 1);
          }
        }
        const nE = Math.round(params.nEnz);
        while (enz.length < nE) enz.push(mkEnz());
        while (enz.length > nE) {
          const e = enz.pop();
          if (e.bound) e.bound.enz = null;
        }
        if (params.sweep) {
          sweepT += dt;
          api.runner.set('sugar', Math.min(110, 2 + sweepT * 5.5));
        }
        const T = params.temp, k = kSpeed();
        const diff = 52 * Math.sqrt((T + 273) / 310);
        // enzymes drift slowly, and unfold for good when it is too hot
        for (const e of enz) {
          e.vx += randn() * 12 * Math.sqrt(dt) - e.vx * dt;
          e.vy += randn() * 12 * Math.sqrt(dt) - e.vy * dt;
          e.x = clamp(e.x + e.vx * dt, a.x0 + RE, a.x1 - RE);
          e.y = clamp(e.y + e.vy * dt, a.y0 + RE, a.y1 - RE);
          e.th += e.w * dt * 0.4;
          for (const o of enz) {
            if (o === e) continue;
            const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy);
            if (d < RE * 2.3 && d > 0) {
              e.vx += (dx / d) * 40 * dt;
              e.vy += (dy / d) * 40 * dt;
            }
          }
          e.wob += dt;
          if (!e.dead && T > 44 && Math.random() < dt * 0.05 * Math.exp((T - 48) / 3)) {
            e.dead = true;
            if (e.bound) (e.bound.enz = null), (e.bound = null);
          }
          e.close += ((e.bound ? 1 : 0) - e.close) * Math.min(1, dt * 8);
          if (e.bound) {
            const s = e.bound;
            const [px, py] = pocket(e);
            s.x += (px - s.x) * Math.min(1, dt * 10);
            s.y += (py - s.y) * Math.min(1, dt * 10);
            s.a = e.th + Math.PI / 2;
            e.t -= dt;
            if (e.t <= 0) {
              if (s.type === 'lac') {
                // cut: release glucose and galactose
                const out = [Math.cos(e.th), Math.sin(e.th)];
                for (const [type, side] of [['glc', 1], ['gal', -1]]) {
                  prods.push({ type, x: s.x, y: s.y, vx: out[0] * 60 - out[1] * side * 40, vy: out[1] * 60 + out[0] * side * 40, a: rand(TAU), life: 0 });
                }
                flashes.push({ x: s.x, y: s.y, t: 0 });
                made.push(api.time);
                subs.splice(subs.indexOf(s), 1);
              } else s.enz = null;
              e.bound = null;
            }
          }
        }
        // sugars and inhibitors diffuse; one that reaches a free pocket binds
        for (const s of subs) {
          if (s.enz) continue;
          // Brownian kicks scale with √dt, so the jiggling speed doesn't depend on the frame rate
          s.vx += randn() * diff * 2.2 * Math.sqrt(dt) - s.vx * dt * 1.2;
          s.vy += randn() * diff * 2.2 * Math.sqrt(dt) - s.vy * dt * 1.2;
          // electrostatic steering: charges around a real active site pull its substrate in from nearby
          let near = null, nd = 220 * 220;
          for (const e of enz) {
            if (e.dead || e.bound) continue;
            const c = Math.cos(e.th), sn = Math.sin(e.th);
            const mx = e.x + c * (RE + 4), my = e.y + sn * (RE + 4);
            const d2 = (mx - s.x) ** 2 + (my - s.y) ** 2;
            if (d2 < nd) {
              nd = d2;
              // from behind the enzyme, head round to the front first rather than into its back
              const front = (s.x - e.x) * c + (s.y - e.y) * sn > RE * 0.4;
              near = front ? [mx, my] : [e.x + c * (RE + 46), e.y + sn * (RE + 46)];
            }
          }
          if (near) {
            const d = Math.hypot(near[0] - s.x, near[1] - s.y) || 1;
            s.vx += ((near[0] - s.x) / d) * 420 * dt;
            s.vy += ((near[1] - s.y) / d) * 420 * dt;
          }
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.a += s.va * dt;
          if (s.x < a.x0) (s.x = a.x0), (s.vx = Math.abs(s.vx));
          if (s.x > a.x1) (s.x = a.x1), (s.vx = -Math.abs(s.vx));
          if (s.y < a.y0) (s.y = a.y0), (s.vy = Math.abs(s.vy));
          if (s.y > a.y1) (s.y = a.y1), (s.vy = -Math.abs(s.vy));
          for (const e of enz) {
            if (e.dead || e.bound) continue;
            // a sugar arriving at the mouth of the pocket is drawn in
            const mx = e.x + Math.cos(e.th) * (RE + 4), my = e.y + Math.sin(e.th) * (RE + 4);
            const dx = s.x - mx, dy = s.y - my;
            if (dx * dx + dy * dy < 22 * 22) {
              e.bound = s;
              s.enz = e;
              e.t = s.type === 'lac' ? rand(1.4, 1.8) / k : rand(3, 4.5);
              break;
            }
            // bounce off the enzyme body elsewhere
            const ex = s.x - e.x, ey = s.y - e.y, d = Math.hypot(ex, ey);
            if (d < RE + 6 && d > 0) {
              s.x = e.x + (ex / d) * (RE + 6);
              s.y = e.y + (ey / d) * (RE + 6);
            }
          }
        }
        for (const p of prods) {
          p.life += dt;
          p.vx += randn() * diff * 2.2 * Math.sqrt(dt) - p.vx * dt;
          p.vy += randn() * diff * 2.2 * Math.sqrt(dt) - p.vy * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.a += dt;
        }
        prods = prods.filter((p) => p.life < 4);
        for (const f of flashes) f.t += dt;
        flashes = flashes.filter((f) => f.t < 0.5);
        made = made.filter((t) => api.time - t < 3);
        if (api.frame % 4 === 0) sRate.push(rate());
        if (params.sweep) {
          sampleT += dt;
          if (sampleT > 1) {
            sampleT = 0;
            curve.push([params.sugar, rate(), enz.filter((e) => e.bound).length / Math.max(1, enz.length)]);
          }
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#10142a' });
        ctx.globalCompositeOperation = 'lighter';
        for (const f of flashes) drawGlow(ctx, f.x, f.y, 36 * (1 - f.t * 2) + 8, '#fff2c0', 0.3);
        ctx.globalCompositeOperation = 'source-over';
        for (const e of enz) this.drawEnz(e);
        for (const p of prods) {
          ctx.globalAlpha = clamp(4 - p.life, 0, 1);
          this.hex(p.x, p.y, 7, p.a, p.type === 'glc' ? GLC : GAL);
          ctx.globalAlpha = 1;
        }
        for (const s of subs) this.drawSub(s);
        if (api.thumbnail) return;
        if (!narrow()) {
          tag(ctx, 'lactase (enzyme)', 24, 84, '#b9a6ff', { size: 11 });
          tag(ctx, 'lactose', 148, 84, GAL, { size: 11 });
          tag(ctx, 'glucose', 214, 84, GLC, { size: 11 });
          if (params.inhib > 0) tag(ctx, 'inhibitor', 282, 84, INH, { size: 11 });
          this.panels(w);
        }
        const dead = enz.filter((e) => e.dead).length;
        if (dead) tag(ctx, `${dead} of ${enz.length} enzymes denatured`, w - 16, narrow() ? 84 : 470, C.red, { align: 'right', size: 11 });
      },
      hex(x, y, r, a, col) {
        ctx.fillStyle = col;
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const t = a + (i * TAU) / 6;
          i ? ctx.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r) : ctx.moveTo(x + Math.cos(t) * r, y + Math.sin(t) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },
      drawSub(s) {
        const dx = Math.cos(s.a) * 6.5, dy = Math.sin(s.a) * 6.5;
        if (s.type === 'inh') {
          this.hex(s.x - dx, s.y - dy, 6.5, s.a, INH);
          this.hex(s.x + dx, s.y + dy, 6.5, s.a, '#6c7385');
          return;
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x - dx, s.y - dy);
        ctx.lineTo(s.x + dx, s.y + dy);
        ctx.stroke();
        this.hex(s.x - dx, s.y - dy, 6.5, s.a, GAL);
        this.hex(s.x + dx, s.y + dy, 6.5, s.a, GLC);
      },
      drawEnz(e) {
        // a blob with a pocket; the pocket closes round a bound sugar (induced fit), and goes ragged when denatured
        const open = 0.55 - e.close * 0.25;
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.th);
        ctx.beginPath();
        const N = 40;
        for (let i = 0; i <= N; i++) {
          const t = open + (i / N) * (TAU - 2 * open);
          let r = RE * (1 + 0.06 * Math.sin(t * 3 + e.wob * 0.7));
          if (e.dead) r *= 1 + 0.18 * Math.sin(t * 5 + e.wob * 2) * Math.cos(t * 2);
          const px = Math.cos(t) * r, py = Math.sin(t) * r;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        // the pocket
        if (!e.dead) {
          ctx.lineTo(RE * 0.3, Math.sin(-open) * RE * 0.45);
          ctx.quadraticCurveTo(RE * 0.05, 0, RE * 0.3, Math.sin(open) * RE * 0.45);
        }
        ctx.closePath();
        const g = ctx.createRadialGradient(-RE * 0.3, -RE * 0.3, 4, 0, 0, RE * 1.1);
        const col = e.dead ? '#59607a' : ENZ;
        g.addColorStop(0, e.dead ? '#8a90a6' : '#c2b2ff');
        g.addColorStop(1, col);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = e.dead ? 'rgba(255,255,255,0.2)' : 'rgba(220,210,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      },
      panels(w) {
        // energy hill with and without the enzyme
        const bw = 230, bh = 130, x0 = w - bw - 18, y0 = 112;
        ctx.fillStyle = 'rgba(8,11,22,0.82)';
        ctx.strokeStyle = 'rgba(160,175,230,0.2)';
        roundRect(ctx, x0, y0, bw, bh, 12);
        ctx.fill();
        ctx.stroke();
        text(ctx, 'Energy along the reaction', x0 + 12, y0 + 16, { size: 11, color: C.dim, shadow: false });
        const base = y0 + bh - 30;
        const path = (Ea, col, dash) => {
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.setLineDash(dash ? [4, 4] : []);
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const s = i / 60, step = clamp((s - 0.3) / 0.4, 0, 1);
            const e = Ea * Math.exp(-(((s - 0.5) / 0.14) ** 2)) - 0.6 * step * step * (3 - 2 * step);
            const X = x0 + 18 + s * (bw - 36), Y = base - e * 20;
            i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        };
        path(3.6, C.orange, true);
        path(1.2, C.teal, false);
        text(ctx, 'no enzyme', x0 + bw / 2 + 26, base - 66, { size: 10, color: C.orange, shadow: false });
        text(ctx, 'with lactase', x0 + bw / 2 + 22, base - 22, { size: 10, color: C.teal, shadow: false });
        // rate against sugar, filled in during the sweep
        const px0 = x0, py0 = y0 + bh + 14, ph = 190;
        ctx.fillStyle = 'rgba(8,11,22,0.82)';
        ctx.strokeStyle = 'rgba(160,175,230,0.2)';
        ctx.lineWidth = 1;
        roundRect(ctx, px0, py0, bw, ph, 12);
        ctx.fill();
        ctx.stroke();
        text(ctx, 'Rate vs amount of sugar', px0 + 12, py0 + 16, { size: 11, color: C.dim, shadow: false });
        const gx0 = px0 + 30, gx1 = px0 + bw - 14, gy0 = py0 + 34, gy1 = py0 + ph - 28;
        ctx.strokeStyle = 'rgba(233,237,247,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx0, gy0);
        ctx.lineTo(gx0, gy1);
        ctx.lineTo(gx1, gy1);
        ctx.stroke();
        text(ctx, 'sugar →', gx1, gy1 + 12, { size: 9, align: 'right', color: C.dim, shadow: false });
        text(ctx, 'rate', gx0 - 6, gy0, { size: 9, align: 'right', color: C.dim, shadow: false });
        const vmax = Math.max(0.5, enz.filter((e) => !e.dead).length / (1.6 / kSpeed()));
        const X = (s) => gx0 + (s / 110) * (gx1 - gx0), Y = (r) => gy1 - clamp(r / (vmax * 1.1), 0, 1) * (gy1 - gy0);
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = 'rgba(46,230,166,0.5)';
        ctx.beginPath();
        ctx.moveTo(gx0, Y(vmax));
        ctx.lineTo(gx1, Y(vmax));
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, 'all enzymes busy', gx1, Y(vmax) - 8, { size: 9, align: 'right', color: C.teal, shadow: false });
        ctx.fillStyle = C.amber;
        for (const [s, r] of curve) {
          ctx.beginPath();
          ctx.arc(X(s), Y(r), 2.6, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(X(params.sugar), Y(rate()), 4, 0, TAU);
        ctx.fill();
      },
      stats() {
        const busy = enz.filter((e) => e.bound && !e.dead).length, alive = enz.filter((e) => !e.dead).length;
        return [
          { label: 'Sugars split per second', value: rate().toFixed(1), color: C.teal },
          { label: 'Enzymes busy', value: `${busy} of ${alive}`, color: '#b9a6ff' },
          { label: 'Working enzymes', value: `${alive} of ${enz.length}`, color: alive < enz.length ? C.red : C.ink },
          { label: 'Lactose left', value: String(subs.filter((s) => s.type === 'lac').length) },
        ];
      },
      charts() {
        return [{ title: 'Sugars split per second', series: [{ data: sRate.data, color: C.teal }], min: 0, length: 400 }];
      },
    };
  },
};
