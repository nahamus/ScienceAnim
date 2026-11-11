import { C, TAU, clamp, lerp, roundRect, tag, text } from '../../core/util.js';

// Red blood cells and oxygen. Haemoglobin loading follows the Hill equation S = Pⁿ ÷ (Pⁿ + P50ⁿ) with n = 2.7 and
// P50 = 26.8 mmHg. Exercise (heat, acid, CO₂) shifts P50 right (the Bohr effect) and lowers the oxygen pressure in
// working muscle. Carbon monoxide occupies seats and shifts the curve left. Oxygen pressure in the lungs falls
// with altitude (alveolar gas equation, with faster breathing lowering CO₂ at height). Weeks at altitude raise the
// number of red cells. The round trip and the capillary are illustrations driven by these numbers.

const N_HILL = 2.7, P50 = 26.8;
const OXY = [220, 32, 58], DEOXY = [110, 22, 52];
// colour stretched over the 55–100 % range where real blood lives, so the change is easy to see
const mix = (s) => `rgb(${OXY.map((v, i) => Math.round(lerp(DEOXY[i], v, clamp((s - 0.55) / 0.45, 0, 1)))).join(',')})`;

export default {
  id: 'red-blood-cells',
  title: 'Red Blood Cells: Oxygen Couriers',
  category: 'biology',
  tagline: 'Trillions of tiny discs carry oxygen from your lungs to every cell. Here’s how they do it.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Human body', 'Blood', 'Respiration'],
  keywords: ['red blood cells', 'erythrocytes', 'haemoglobin', 'hemoglobin', 'oxygen', 'circulation', 'capillaries', 'oxygen dissociation curve', 'Bohr effect', 'cooperative binding', 'sickle cell', 'carbon monoxide', 'altitude', 'EPO', 'anaemia', 'blood is not blue'],
  blurb:
    'Most of the cells in your body are red blood cells: about 25 trillion of the 30 trillion or so, each a flexible disc packed with haemoglobin. Each lap of your body takes about a minute. They load up with oxygen in the lungs, squeeze single-file through capillaries narrower than themselves, and hand the oxygen over exactly where it’s needed most. See how, and what happens with sickle-cell disease, carbon monoxide and thin mountain air.',
  ideas: [
    'Red blood cells have <b>no nucleus</b>, leaving room for about 270 million haemoglobin molecules each.',
    'Each haemoglobin has <b>four seats</b> for oxygen. Seats fill more easily once others are taken, which gives an <b>S-shaped</b> loading curve.',
    'They fill up almost completely in the lungs, and unload where oxygen is scarce: in working muscle.',
    'Warm, acidic, busy muscle makes haemoglobin let go of even more oxygen (the <b>Bohr effect</b>).',
    'Blood is never blue: it is bright red with oxygen and dark red without.',
  ],
  hint: 'Turn up the exercise and watch the oxygen unload',
  thumbChapter: 2,
  thumbFrames: 300,
  params: [
    {
      key: 'scene', label: 'View', type: 'select', value: 'loop', instant: true,
      options: [{ value: 'loop', label: 'The round trip' }, { value: 'squeeze', label: 'Inside a capillary' }, { value: 'curve', label: 'Haemoglobin' }],
    },
    { key: 'exercise', label: 'Exercise', type: 'range', min: 0, max: 1, step: 0.01, value: 0, format: (v) => (v < 0.1 ? 'resting' : v < 0.5 ? 'walking' : v < 0.8 ? 'running' : 'sprinting') },
    { key: 'altitude', label: 'Altitude', type: 'range', min: 0, max: 8.8, step: 0.1, value: 0, format: (v) => (v < 0.05 ? 'sea level' : `${(v * 1000).toLocaleString('en-US')} m`) },
    { key: 'acclim', label: 'Weeks spent at this altitude', type: 'toggle', value: false },
    { key: 'sickle', label: 'Sickle cells', type: 'range', min: 0, max: 0.6, step: 0.01, value: 0, format: (v) => Math.round(v * 100) + ' %' },
    { key: 'co', label: 'Carbon monoxide', type: 'range', min: 0, max: 0.5, step: 0.01, value: 0, format: (v) => Math.round(v * 100) + ' % of seats blocked' },
    { key: 'po2', label: 'Oxygen around the cell', type: 'range', min: 2, max: 110, step: 1, value: 100, unit: ' mmHg' },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.3, max: 3, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
  ],
  story: [
    {
      title: '25 trillion couriers',
      text: 'Red blood cells are by far the most common cells in your body: about 25 trillion of the roughly 30 trillion. Each is a squashy disc, dimpled on both sides, with no nucleus: that leaves room for about 270 million molecules of haemoglobin, the red, iron-containing protein that carries oxygen. Each cell lasts about 120 days, so you make roughly 2.5 million new ones every second.',
      params: { scene: 'loop', exercise: 0, altitude: 0, acclim: false, sickle: 0, co: 0, speed: 1 },
      duration: 14,
    },
    {
      title: 'The round trip',
      text: 'The heart pumps the cells to the lungs, where they turn bright red as they fill with oxygen, then out to the body. In the muscle’s tiny capillaries they hand the oxygen over and turn dark red. A full lap takes about a minute at rest. (Blood is never blue: veins only look blue through skin.)',
      params: { scene: 'loop', exercise: 0, altitude: 0, acclim: false, sickle: 0, co: 0, speed: 1.4 },
      duration: 15,
    },
    {
      title: 'Four seats and teamwork',
      text: 'Each haemoglobin has four seats for oxygen. Once one is taken, the shape of the molecule changes and the others fill more easily. That teamwork gives an <b>S-shaped</b> curve: haemoglobin is nearly full where oxygen is plentiful (the lungs), but lets go of a lot when oxygen gets scarce. Watch the seats empty as the oxygen around it falls.',
      check: {
        q: 'Why is an S-shaped loading curve good for delivering oxygen?',
        options: ['Cells fill almost completely in the lungs, yet let go readily in the tissues', 'It makes haemoglobin hold on to oxygen as tightly as possible', 'It lets cells carry more than four oxygen molecules per haemoglobin'],
        answer: 0,
        setup: { scene: 'curve', exercise: 0, altitude: 0, co: 0, po2: 100 },
        explain: 'The flat top means a dip in lung oxygen barely matters: cells still fill up. The steep middle means a modest drop in oxygen, as in working tissue, releases a lot of it. A straight or very tight curve would do one job but not the other.',
      },
      params: { scene: 'curve', exercise: 0, altitude: 0, co: 0, po2: 20 },
      tween: 10,
      duration: 16,
    },
    {
      title: 'Squeezing through',
      text: 'Capillaries are so narrow (about 5 thousandths of a millimetre) that red cells, at about 8, must fold up to get through, single file. Their flexible, dimpled shape lets them bend into parachutes and spring back. This is where oxygen crosses into the surrounding muscle, while carbon dioxide comes the other way.',
      params: { scene: 'squeeze', exercise: 0.2, sickle: 0, co: 0, speed: 1 },
      duration: 14,
    },
    {
      title: 'Working muscles get more',
      text: 'Hard-working muscle is warmer and more acidic, and makes more carbon dioxide. All three nudge haemoglobin into letting go more easily: the curve shifts right (the <b>Bohr effect</b>). Muscle also uses its oxygen faster. At rest, cells give up about a quarter of their oxygen on each pass; in a sprint, more than three-quarters.',
      params: { scene: 'curve', exercise: 1, altitude: 0, co: 0, po2: 18 },
      tween: 3,
      duration: 15,
    },
    {
      title: 'Sickle-cell disease',
      text: 'One wrong letter in the haemoglobin gene makes the protein clump into stiff rods when it gives up its oxygen. The cells bend into rigid sickles that can’t fold, so they jam in capillaries and block the blood behind them, starving the tissue of oxygen and causing severe pain. New treatments use CRISPR gene editing to switch a backup haemoglobin gene back on.',
      params: { scene: 'squeeze', exercise: 0.4, sickle: 0.35, co: 0, speed: 1 },
      duration: 16,
    },
    {
      title: 'Carbon monoxide',
      text: 'Carbon monoxide, from faulty boilers and car exhausts, grabs haemoglobin’s seats about 200 times more tightly than oxygen. Blocked seats carry no oxygen, and the remaining ones hold on to theirs more tightly too, so even less is delivered. Because the gas has no smell, CO alarms save lives.',
      check: {
        q: 'With 40 % of seats blocked by carbon monoxide, is oxygen delivery cut by 40 %?',
        options: ['More than 40 %: the remaining seats also let go less easily', 'Exactly 40 %', 'Less than 40 %: the body makes up the difference'],
        answer: 0,
        setup: { scene: 'curve', exercise: 0, altitude: 0, co: 0, po2: 40 },
        explain: 'Carbon monoxide does double damage. It takes seats away, and it makes the other seats cling to their oxygen (the curve shifts left), so tissues get even less than the lost seats suggest.',
      },
      params: { scene: 'curve', exercise: 0, altitude: 0, co: 0.4, po2: 40 },
      duration: 15,
    },
    {
      title: 'Thin air',
      text: 'At 5,000 m each breath holds about half the oxygen it does at sea level, so the cells leave the lungs less full. Over a few weeks the kidneys sense this and release the hormone <b>EPO</b>, which tells the bone marrow to make more red blood cells. That is why athletes train at altitude, and why EPO is a banned drug in sport.',
      params: { scene: 'loop', exercise: 0.3, altitude: 5, acclim: true, sickle: 0, co: 0, speed: 1.2 },
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Switch views and play with exercise, altitude, sickle cells and carbon monoxide. Can you find a combination where the muscles get barely any oxygen?',
      params: { scene: 'loop', exercise: 0.5, altitude: 0, acclim: false, sickle: 0, co: 0, speed: 1 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    // ---------------------------------------------------------------- physiology
    const p50 = () => (P50 + 6 * params.exercise) * (1 - 0.5 * params.co);
    const sat = (P) => (1 - params.co) * P ** N_HILL / (P ** N_HILL + p50() ** N_HILL);
    const pLung = () => Math.max(20, 0.21 * (760 * Math.exp(-params.altitude / 8.4) - 47) - 50 * Math.exp(-params.altitude / 5));
    const pTissue = () => Math.min(40 - 22 * params.exercise, pLung() - 15);
    const cellsFactor = () => 1 + (params.acclim ? 0.35 * clamp(params.altitude / 5, 0, 1) : 0);
    const delivery = () => (sat(pLung()) - sat(pTissue())) * cellsFactor() * (1 + 3 * params.exercise);
    const REST = (() => {
      const hill = (P) => P ** N_HILL / (P ** N_HILL + P50 ** N_HILL);
      return hill(99.7) - hill(40);
    })();

    // ---------------------------------------------------------------- loop scene state
    const NL = 64;
    const cells = Array.from({ length: NL }, (_, i) => ({ s: i / NL + Math.random() * 0.01, o2: 0.7, sickle: Math.random() }));
    const puffs = [];
    // ---------------------------------------------------------------- capillary scene state
    let caps = [], capAcc = 0, stuckT = 0;
    let seatsShown = 4;

    const loopGeom = () => {
      const { w, h } = api;
      const phone = w < 760;
      return phone ? { phone, x0: 24, x1: w - 24, y0: 80, y1: h * 0.62 } : { phone, x0: w * 0.47, x1: w - 60, y0: 190, y1: h - 100 };
    };
    /** Point on the loop at s ∈ [0,1): top edge = lungs (left→right), right = artery, bottom = muscle (right→left), left = vein + heart. */
    function loopPt(g, s) {
      const W = g.x1 - g.x0, H = g.y1 - g.y0, per = 2 * (W + H);
      let d = (((s % 1) + 1) % 1) * per;
      if (d < W) return [g.x0 + d, g.y0, 'lung'];
      d -= W;
      if (d < H) return [g.x1, g.y0 + d, 'artery'];
      d -= H;
      if (d < W) return [g.x1 - d, g.y1, 'muscle'];
      d -= W;
      return [g.x0, g.y1 - d, 'vein'];
    }

    function drawRBC(x, y, r, s, sick) {
      if (sick) {
        ctx.fillStyle = mix(s * 0.6);
        ctx.beginPath();
        ctx.arc(x, y, r, Math.PI * 0.15, Math.PI * 1.85);
        ctx.arc(x + r * 0.55, y, r * 0.7, Math.PI * 1.7, Math.PI * 0.3, true);
        ctx.fill();
        return;
      }
      const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
      g.addColorStop(0, `rgba(${DEOXY.map((v, i) => Math.round(lerp(v, OXY[i], s) * 0.7)).join(',')},1)`);
      g.addColorStop(0.55, mix(s));
      g.addColorStop(0.85, mix(Math.min(1, s + 0.15)));
      g.addColorStop(1, mix(s * 0.8));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }

    function drawLoop() {
      const { w, h } = api;
      const g = loopGeom();
      const W = g.x1 - g.x0;
      // lungs
      ctx.fillStyle = 'rgba(255,150,170,0.12)';
      roundRect(ctx, g.x0 + W * 0.12, g.y0 - 46, W * 0.76, 92, 40);
      ctx.fill();
      for (let k = 0; k < 18; k++) {
        ctx.fillStyle = 'rgba(255,170,190,0.18)';
        ctx.beginPath();
        ctx.arc(g.x0 + W * 0.16 + (k / 17) * W * 0.68, g.y0 + (k % 2 ? -22 : 22), 16, 0, TAU);
        ctx.fill();
      }
      text(ctx, `Lungs: oxygen ${Math.round(pLung())} mmHg`, g.x0 + W / 2, g.y0 - 58, { size: 12, align: 'center', color: '#ffb3c1', weight: 600 });
      // muscle
      ctx.fillStyle = 'rgba(200,70,80,0.16)';
      roundRect(ctx, g.x0 + W * 0.12, g.y1 - 46, W * 0.76, 92, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(220,100,110,0.25)';
      for (let k = 0; k < 8; k++) {
        ctx.beginPath();
        ctx.moveTo(g.x0 + W * 0.13, g.y1 - 40 + k * 11);
        ctx.lineTo(g.x0 + W * 0.87, g.y1 - 40 + k * 11);
        ctx.stroke();
      }
      text(ctx, `Muscle: oxygen ${Math.round(pTissue())} mmHg`, g.x0 + W / 2, g.y1 + 60, { size: 12, align: 'center', color: '#ff9aa5', weight: 600 });
      // vessels
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 22;
      ctx.strokeRect(g.x0, g.y0, W, g.y1 - g.y0);
      // heart
      const hx = g.x0, hy = (g.y0 + g.y1) / 2;
      const beat = 1 + 0.08 * Math.max(0, Math.sin(api.time * TAU * (1.1 + params.exercise * 1.6))) ** 8;
      ctx.fillStyle = '#c0283c';
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(beat, beat);
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.bezierCurveTo(-34, -2, -18, -30, 0, -12);
      ctx.bezierCurveTo(18, -30, 34, -2, 0, 22);
      ctx.fill();
      ctx.restore();
      text(ctx, 'heart', hx + 30, hy, { size: 11, color: C.dim });
      if (!g.phone) {
        text(ctx, 'artery', g.x1 + 16, hy, { size: 11, color: C.dim });
        text(ctx, 'vein', hx - 16, hy + 40, { size: 11, color: C.dim, align: 'right' });
      }
      // oxygen puffs
      for (const p of puffs) {
        ctx.fillStyle = `rgba(150,220,255,${1 - p.t})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, TAU);
        ctx.fill();
      }
      // cells
      const r = g.phone ? 7 : 10;
      const nShow = Math.round(NL * Math.min(1, 0.75 * cellsFactor()));
      for (let i = 0; i < nShow; i++) {
        const c = cells[i];
        const [x, y] = loopPt(g, c.s);
        drawRBC(x, y, r, c.o2, c.sickle < params.sickle);
      }
      if (!g.phone) drawMiniCurve(24, 120, Math.min(300, w * 0.3 - 30), 170);
      void h;
    }

    function drawMiniCurve(x, y, wd, ht, big) {
      ctx.fillStyle = 'rgba(8,11,24,0.86)';
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      roundRect(ctx, x, y, wd, ht, 12);
      ctx.fill();
      ctx.stroke();
      text(ctx, 'Haemoglobin loading curve', x + 12, y + 15, { size: big ? 12 : 11, weight: 600, color: C.dim });
      const x0 = x + (big ? 46 : 30), x1 = x + wd - 14, y0 = y + 32, y1 = y + ht - (big ? 34 : 24);
      const X = (P) => x0 + (P / 110) * (x1 - x0), Y = (s) => y1 - s * (y1 - y0);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y1);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      // the resting curve for reference
      if (params.exercise > 0.05 || params.co > 0.02) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let P = 0; P <= 110; P += 2) ctx[P ? 'lineTo' : 'moveTo'](X(P), Y(P ** N_HILL / (P ** N_HILL + P50 ** N_HILL)));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = C.red;
      ctx.lineWidth = big ? 3 : 2;
      ctx.beginPath();
      for (let P = 0; P <= 110; P += 1) ctx[P ? 'lineTo' : 'moveTo'](X(P), Y(sat(P)));
      ctx.stroke();
      const pl = pLung(), pt = pTissue();
      // unloaded share
      ctx.fillStyle = 'rgba(56,214,245,0.15)';
      ctx.fillRect(x0, Y(sat(pl)), x1 - x0, Y(sat(pt)) - Y(sat(pl)));
      for (const [P, lab, col] of [[pl, 'lungs', '#ffb3c1'], [pt, 'muscle', '#ff9aa5']]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(X(P), Y(sat(P)), big ? 6 : 4, 0, TAU);
        ctx.fill();
        text(ctx, lab, X(P), Y(sat(P)) - 12, { size: big ? 11 : 9, align: 'center', color: col });
      }
      text(ctx, `${Math.round((sat(pl) - sat(pt)) * 100)} % handed over`, x1, y1 - 10, { size: big ? 12 : 10, align: 'right', color: C.cyan, weight: 600 });
      if (big) {
        for (const P of [0, 20, 40, 60, 80, 100]) text(ctx, String(P), X(P), y1 + 12, { size: 10, align: 'center', color: 'rgba(233,237,247,0.45)', mono: true });
        text(ctx, 'oxygen around the cell (mmHg)', x1, y1 + 26, { size: 10, align: 'right', color: 'rgba(233,237,247,0.45)' });
        for (const s of [0, 0.5, 1]) text(ctx, `${s * 100}%`, x0 - 6, Y(s), { size: 10, align: 'right', color: 'rgba(233,237,247,0.45)', mono: true });
        // current point
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(X(params.po2), Y(sat(params.po2)), 7, 0, TAU);
        ctx.fill();
      }
    }

    function drawCurveScene() {
      const { w, h } = api;
      const phone = w < 760;
      // a haemoglobin molecule with four seats
      const mx = phone ? w * 0.5 : w * 0.3, my = phone ? 150 : 222, R = phone ? 60 : 56;
      const sub = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      const filled = sat(params.po2) / Math.max(0.001, 1 - params.co);
      const coSeats = Math.round(params.co * 4);
      sub.forEach(([sx, sy], k) => {
        const x = mx + sx * R * 0.45, y = my + sy * R * 0.42;
        ctx.fillStyle = k % 2 ? 'rgba(170,60,90,0.55)' : 'rgba(150,50,110,0.55)';
        ctx.beginPath();
        ctx.ellipse(x, y, R * 0.5, R * 0.44, sx * sy * 0.4, 0, TAU);
        ctx.fill();
        // seat (iron in a haem group)
        const hx = x + sx * R * 0.18, hy = y + sy * R * 0.12;
        const isCO = k < coSeats;
        const has = isCO || k - coSeats < seatsShown - coSeats;
        ctx.fillStyle = '#ffb547';
        ctx.fillRect(hx - 9, hy - 3, 18, 6);
        if (has) {
          ctx.fillStyle = isCO ? '#555a66' : '#8fd8ff';
          ctx.beginPath();
          ctx.arc(hx - 5, hy - 10, 5.5, 0, TAU);
          ctx.arc(hx + 5, hy - 10, 5.5, 0, TAU);
          ctx.fill();
          if (isCO) text(ctx, 'CO', hx, hy - 22, { size: 9, align: 'center', color: '#c0c6d6', weight: 700 });
        }
      });
      seatsShown = lerp(seatsShown, coSeats + filled * (4 - coSeats), 0.08);
      const cap1 = phone ? [mx, my + R + 30, 'center'] : [24, 112, 'left'];
      text(ctx, 'haemoglobin: four seats for oxygen', cap1[0], cap1[1], { size: 12, align: cap1[2], color: C.dim });
      text(ctx, `${Math.round(sat(params.po2) * 100)} % of seats carry oxygen`, cap1[0], cap1[1] + 22, { size: 14, align: cap1[2], weight: 700, color: '#8fd8ff' });
      if (!phone) drawMiniCurve(w * 0.55, 120, w * 0.42, Math.min(400, h - 220), true);
      else drawMiniCurve(16, my + R + 72, w - 32, h - (my + R + 72) - 60, true);
    }

    function drawSqueeze() {
      const { w, h } = api;
      const phone = w < 760;
      const cy = h * (phone ? 0.4 : 0.42);
      const nx0 = w * 0.3, nx1 = w * 0.78;
      const wide = phone ? 46 : 70, narrow = phone ? 22 : 34;
      // muscle around the capillary
      ctx.fillStyle = 'rgba(200,70,80,0.18)';
      ctx.fillRect(nx0, cy - narrow / 2 - 90, nx1 - nx0, 80);
      ctx.fillRect(nx0, cy + narrow / 2 + 10, nx1 - nx0, 80);
      const starving = stuckT > 1.5;
      text(ctx, starving ? 'muscle starved of oxygen' : 'muscle cells', (nx0 + nx1) / 2, cy - narrow / 2 - 104, { size: 12, align: 'center', color: starving ? C.red : '#ff9aa5', weight: 600 });
      // vessel walls
      ctx.fillStyle = 'rgba(255,200,200,0.06)';
      ctx.strokeStyle = 'rgba(255,180,190,0.5)';
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, cy + (s * wide) / 2);
        ctx.lineTo(nx0 - 30, cy + (s * wide) / 2);
        ctx.quadraticCurveTo(nx0, cy + (s * narrow) / 2, nx0 + 20, cy + (s * narrow) / 2);
        ctx.lineTo(nx1 - 20, cy + (s * narrow) / 2);
        ctx.quadraticCurveTo(nx1, cy + (s * narrow) / 2, nx1 + 30, cy + (s * wide) / 2);
        ctx.lineTo(w, cy + (s * wide) / 2);
        ctx.stroke();
      }
      // cells: discs side-on in the wide vessel, folded parachutes in the capillary
      for (const c of caps) {
        const inNarrow = c.x > nx0 && c.x < nx1;
        const r = phone ? 13 : 20;
        if (c.sick) {
          drawRBC(c.x, cy + c.y * (inNarrow ? 0.2 : 1), r * 0.9, c.o2, true);
          continue;
        }
        ctx.fillStyle = mix(c.o2);
        ctx.beginPath();
        if (inNarrow) {
          // parachute / bullet shape
          ctx.moveTo(c.x + r * 0.7, cy);
          ctx.quadraticCurveTo(c.x + r * 0.5, cy - narrow * 0.45, c.x - r * 0.6, cy - narrow * 0.42);
          ctx.quadraticCurveTo(c.x - r * 0.2, cy, c.x - r * 0.6, cy + narrow * 0.42);
          ctx.quadraticCurveTo(c.x + r * 0.5, cy + narrow * 0.45, c.x + r * 0.7, cy);
        } else {
          // side view of a biconcave disc: dumbbell
          const y = cy + c.y;
          ctx.ellipse(c.x, y - r * 0.55, r * 0.32, r * 0.42, 0, 0, TAU);
          ctx.ellipse(c.x, y + r * 0.55, r * 0.32, r * 0.42, 0, 0, TAU);
          ctx.rect(c.x - r * 0.2, y - r * 0.6, r * 0.4, r * 1.2);
        }
        ctx.fill();
      }
      // oxygen leaving into the muscle
      for (const p of puffs) {
        ctx.fillStyle = `rgba(150,220,255,${1 - p.t})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, TAU);
        ctx.fill();
      }
      if (stuckT > 0.5) tag(ctx, 'a stiff sickle cell is stuck: blood backs up', w - 16, phone ? 56 : 84, C.red, { align: 'right' });
      if (!phone) {
        text(ctx, 'artery side (bright red)', 20, cy + wide / 2 + 24, { size: 11, color: C.dim });
        text(ctx, 'vein side (dark red)', w - 20, cy + wide / 2 + 24, { size: 11, align: 'right', color: C.dim });
        text(ctx, 'capillary: narrower than a red cell', (nx0 + nx1) / 2, cy + narrow / 2 + 108, { size: 11, align: 'center', color: C.dim });
      }
    }

    return {
      update(dt) {
        const sp = params.speed;
        const { w, h } = api;
        for (const p of puffs) {
          p.t += dt * 1.2;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
        for (let i = puffs.length - 1; i >= 0; i--) if (puffs[i].t >= 1) puffs.splice(i, 1);
        if (params.scene === 'loop') {
          const g = loopGeom();
          const lap = 1 / (14 / (1 + params.exercise * 1.5));
          for (const c of cells) {
            c.s = (c.s + dt * sp * lap) % 1;
            const [x, y, part] = loopPt(g, c.s);
            const W = g.x1 - g.x0;
            const inside = x > g.x0 + W * 0.12 && x < g.x0 + W * 0.88;
            if (part === 'lung' && inside) {
              const target = sat(pLung());
              if (c.o2 < target && Math.random() < dt * 6 && puffs.length < 160) puffs.push({ x, y: y - 26, vx: 0, vy: 50, t: 0.2 });
              c.o2 += (target - c.o2) * (1 - Math.exp(-dt * sp * 3));
            } else if (part === 'muscle' && inside) {
              const target = sat(pTissue());
              if (c.o2 > target + 0.02 && Math.random() < dt * 8 * (1 + params.exercise) && puffs.length < 160) puffs.push({ x, y, vx: 0, vy: 40, t: 0 });
              c.o2 += (target - c.o2) * (1 - Math.exp(-dt * sp * 3));
            }
          }
        } else if (params.scene === 'squeeze') {
          const cy = h * (w < 760 ? 0.4 : 0.42), nx0 = w * 0.3, nx1 = w * 0.78;
          const v = (w < 760 ? 60 : 110) * sp * (1 + params.exercise);
          capAcc += dt * sp * (1.1 + params.exercise);
          if (capAcc > 1 && (!caps.length || caps[caps.length - 1].x > 40)) {
            capAcc = 0;
            caps.push({ x: -20, y: (Math.random() - 0.5) * 18, o2: sat(100), sick: Math.random() < params.sickle, stuck: 0 });
          }
          // move in order, front first; nobody passes a stuck cell
          let blockAt = Infinity;
          stuckT = 0;
          for (let i = 0; i < caps.length; i++) {
            const c = caps[i];
            if (c.stuck > 0) {
              c.stuck -= dt;
              stuckT = Math.max(stuckT, c.stuck > 0 ? 2 : 0);
              blockAt = c.x - 30;
              continue;
            }
            let nx = c.x + v * dt;
            if (nx > blockAt) nx = Math.max(c.x, blockAt);
            if (c.sick && c.x < nx0 + 10 && nx >= nx0 + 10 && Math.random() < 0.5) c.stuck = 4;
            c.x = nx;
            blockAt = c.x - 30;
            if (c.x > nx0 && c.x < nx1) {
              const target = sat(pTissue());
              const before = c.o2;
              c.o2 += (target - c.o2) * (1 - Math.exp(-dt * 2.2 * sp));
              if (before - c.o2 > 0.002 && Math.random() < 0.5) puffs.push({ x: c.x, y: cy, vx: (Math.random() - 0.5) * 20, vy: (Math.random() < 0.5 ? -1 : 1) * 60, t: 0 });
            }
            if (c.sick) c.o2 = Math.min(c.o2, 0.9);
          }
          // reverse order: caps were pushed at the back, so iterate from the front
          caps = caps.filter((c) => c.x < w + 30);
          caps.sort((a, b) => b.x - a.x);
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#0b0610';
        ctx.fillRect(0, 0, w, h);
        if (params.scene === 'loop') drawLoop();
        else if (params.scene === 'squeeze') drawSqueeze();
        else drawCurveScene();
      },
      stats() {
        const pl = pLung(), pt = pTissue();
        return [
          { label: 'Leaving the lungs', value: `${Math.round(sat(pl) * 100)} % full`, color: C.red },
          { label: 'Leaving the muscle', value: `${Math.round(sat(pt) * 100)} % full` },
          { label: 'Handed over each lap', value: `${Math.round((sat(pl) - sat(pt)) * 100)} %`, color: C.cyan },
          { label: 'Oxygen delivered', value: `${(delivery() / REST).toFixed(1)}× resting`, color: C.teal },
          { label: 'Red cells', value: params.acclim && params.altitude > 0.5 ? `+${Math.round((cellsFactor() - 1) * 100)} % (EPO)` : 'normal' },
        ];
      },
    };
  },
};
