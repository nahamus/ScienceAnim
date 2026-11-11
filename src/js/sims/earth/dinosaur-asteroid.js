import { C, TAU, clamp, drawGlow, lerp, roundRect, smoothstep, tag, text } from '../../core/util.js';

// The Chicxulub impact, 66 million years ago.
// Impact: a stony asteroid (3,000 kg/m³) hits at an angle. Energy E = ½ m v². Final crater size follows a power
// law fitted through Meteor Crater (~1.2 km for ~10 Mt) and Chicxulub (~180 km for ~7.5 × 10⁷ Mt):
// D ≈ 0.58 km × E[Mt]^0.317. Small stony bodies (tens of metres) burst in the air instead (Chelyabinsk, Tunguska).
// World: a landscape far from the impact through the aftermath, on a stretched clock from an hour before to a
// million years after. Sunlight and temperature curves are simplified from impact-winter models (soot and sulphate
// haze: near-darkness for months, years of cold).

const MT = 4.184e15; // J per megaton of TNT
const HIROSHIMA = 0.015; // Mt
const energyMt = (dKm, v) => (0.5 * 3000 * (Math.PI / 6) * (dKm * 1000) ** 3 * (v * 1000) ** 2) / MT;
const craterKm = (E) => 0.58 * E ** 0.317;

// world clock: 0–100 → years relative to impact (negative = before)
const HOUR = 1 / (365.25 * 24);
const WORLD = [
  [0, -HOUR], [10, 0], [12, 10 / 60 * HOUR], [22, 3 * HOUR], [32, 7 / 365], [44, 0.5], [56, 3], [70, 30], [86, 1000], [100, 1e6],
];
function yearsAt(x) {
  x = clamp(x, 0, 100);
  for (let i = 1; i < WORLD.length; i++) {
    const [x1, y1] = WORLD[i];
    if (x <= x1) {
      const [x0, y0] = WORLD[i - 1];
      const f = (x - x0) / (x1 - x0);
      if (y0 <= 0) return lerp(y0, y1, f);
      return 10 ** lerp(Math.log10(y0), Math.log10(y1), f);
    }
  }
  return 1e6;
}
function fmtYears(y) {
  if (y < 0) return 'an hour before';
  if (y === 0) return 'the moment of impact';
  const m = y * 365.25 * 24 * 60;
  if (m < 60) return Math.round(m) <= 1 ? '1 minute after' : `${Math.round(m)} minutes after`;
  if (m < 48 * 60) return Math.round(m / 60) === 1 ? '1 hour after' : `${Math.round(m / 60)} hours after`;
  if (y < 2 / 12) return `${Math.round(y * 365.25)} days after`;
  if (y < 1.5) return Math.round(y * 12) === 1 ? '1 month after' : `${Math.round(y * 12)} months after`;
  if (y < 1000) return `${Math.round(y)} years after`;
  if (y < 1e6) return `${Math.round(y / 1000).toLocaleString('en-US')},000 years after`;
  return 'a million years after';
}
/** Sunlight reaching the ground (0–1) and temperature change (°C), simplified impact-winter curves. */
function climate(y) {
  if (y <= 0) return { sun: 1, dT: 0, heat: 0 };
  const hrs = y / HOUR;
  const heat = hrs < 0.15 ? 0 : Math.exp(-(((Math.log10(hrs) - Math.log10(0.8)) / 0.45) ** 2)); // the sky glows for an hour or so
  const dark = smoothstep(0.0005, 0.03, y) * Math.exp(-Math.max(0, y - 0.6) / 1.4); // soot and sulphate haze
  const sun = clamp(1 - 0.97 * dark, 0.02, 1);
  const cold = smoothstep(0.03, 0.8, y) * Math.exp(-Math.max(0, y - 1.2) / 9);
  return { sun, dT: -20 * cold + 6 * heat, heat };
}

export default {
  id: 'dinosaur-asteroid',
  title: 'The Asteroid That Killed the Dinosaurs',
  category: 'earth',
  tagline: 'A 10 km rock, a 180 km crater, and the darkness that ended the age of dinosaurs.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Extinction', 'Impacts', 'Evidence'],
  keywords: ['asteroid', 'dinosaurs', 'extinction', 'Chicxulub', 'crater', 'impact winter', 'iridium', 'K-Pg boundary', 'Cretaceous', 'mass extinction', 'Alvarez', 'Yucatan', 'meteor', 'Tunguska', 'Chelyabinsk', 'mammals'],
  blurb:
    '66 million years ago a rock about 10 km across, as wide as a city, slammed into what is now Mexico at around 20 km/s. It released more energy than a billion nuclear bombs, gouged a crater 180 km wide, set skies on fire and wrapped the planet in a dark, cold haze for years. Three-quarters of all species died, including every dinosaur except the birds. Watch it happen, and see how scientists found the proof.',
  ideas: [
    'Moving energy grows with <b>speed squared</b>: E = ½ m v². At 20 km/s even rock carries more energy than the same mass of TNT, by about 50 times.',
    'Big impacts dig a crater about <b>20 times</b> wider than the asteroid, then the floor rebounds into a ring of peaks.',
    'Debris thrown into space fell back worldwide, heating the sky and starting fires.',
    'Soot and sulphur haze blocked sunlight for months: plants stopped growing and <b>food chains collapsed</b>.',
    'The proof: a worldwide clay layer rich in <b>iridium</b> (rare on Earth, common in asteroids), shocked quartz, and the buried <b>Chicxulub</b> crater.',
  ],
  hint: 'Change the asteroid’s size and speed, then launch it',
  thumbChapter: 4,
  thumbFrames: 300,
  params: [
    {
      key: 'scene', label: 'View', type: 'select', value: 'world', instant: true,
      options: [{ value: 'impact', label: 'The impact' }, { value: 'world', label: 'The aftermath' }, { value: 'rocks', label: 'Clues in the rocks' }],
    },
    { key: 'size', label: 'Asteroid size', type: 'range', min: 0.02, max: 15, step: 0.01, value: 10, instant: true, format: (v) => (v < 1 ? `${Math.round(v * 1000)} m` : `${v.toFixed(1)} km`) },
    { key: 'speed', label: 'Speed', type: 'range', min: 11, max: 40, step: 1, value: 20, instant: true, unit: ' km/s' },
    { key: 'clock', label: 'Time (aftermath)', type: 'range', min: 0, max: 100, step: 0.1, value: 4, format: (v) => fmtYears(yearsAt(v)) },
    { key: 'launch', label: 'Launch the asteroid', type: 'button', action: (s) => s.launch() },
  ],
  story: [
    {
      title: '66 million years ago',
      text: 'A warm afternoon at the end of the Cretaceous period. Dinosaurs have ruled the land for more than 150 million years. Small mammals scurry underfoot, flowering plants are spreading, and the seas are full of ammonites and marine reptiles. High above, unseen, a rock about 10 km across is closing in.',
      params: { scene: 'world', clock: 4 },
      duration: 12,
    },
    {
      title: 'A mountain falls from the sky',
      text: 'The asteroid, taller than Mount Everest and far wider than any airliner flies, crosses the whole atmosphere in about a second. It is moving at around 20 km/s, sixty times faster than a bullet, and carries the energy of more than a billion Hiroshima bombs.',
      formula: 'energy = ½ × mass × speed²',
      params: { scene: 'impact', size: 10, speed: 20 },
      enter: (s) => s.launch(),
      duration: 13,
    },
    {
      title: 'The crater',
      text: 'In seconds the rock vaporises and blasts out a bowl about 100 km wide and 30 km deep, deeper than the crust is thick in places. Within minutes the bowl’s floor rebounds like a splash in water into a central peak higher than Everest, which collapses again into a ring of mountains. The final crater is about <b>180 km</b> across, now buried under Mexico’s Yucatán Peninsula.',
      check: {
        q: 'The asteroid was about 10 km wide. Roughly how wide is the crater it made?',
        options: ['About 180 km', 'About 10 km', 'About 2,000 km'],
        answer: 0,
        setup: { scene: 'impact', size: 10, speed: 20 },
        explain: 'An impactor carries so much energy that it digs a hole about twenty times its own width. The Chicxulub crater is about 180 km across: you could fit a large city in it many times over.',
      },
      params: { scene: 'impact', size: 10, speed: 20 },
      enter: (s) => s.launch(true),
      duration: 15,
    },
    {
      title: 'Fire in the sky',
      text: 'Thousands of kilometres away, the ground shakes violently within minutes. Then trillions of glassy beads thrown into space fall back all over the world, glowing like shooting stars. For an hour or so the whole sky glows like an oven, and wildfires break out. Near the coasts, tsunamis hundreds of metres high sweep inland.',
      params: { scene: 'world', clock: 18.6 },
      tween: 14,
      duration: 16,
    },
    {
      title: 'The long winter',
      text: 'Soot from the fires and sulphur from vaporised rock spread round the globe and block out the Sun. For months it is darker than a cloudy night, so plants can’t grow. Temperatures plunge by perhaps 10–25 °C for years. With no new plant food, plant-eaters starve, then meat-eaters. About <b>three-quarters</b> of all species disappear.',
      check: {
        q: 'What killed most of the species, including dinosaurs far from the crater?',
        options: ['Darkness and cold stopped plants growing, so food chains collapsed', 'The blast wave from the impact', 'Rocks falling on them'],
        answer: 0,
        setup: { scene: 'world', clock: 38 },
        explain: 'The blast, heat and tsunamis were devastating near the impact, but the global killer was the dark, cold haze. Without sunlight, photosynthesis stopped, and every food chain that starts with plants fell apart.',
      },
      params: { scene: 'world', clock: 47 },
      tween: 16,
      duration: 18,
    },
    {
      title: 'Survivors',
      text: 'Who made it? Small animals that could hide in burrows or water and eat seeds, insects or rotting matter: small mammals, lizards, turtles, crocodiles, and some birds, which are dinosaurs too. Ferns sprouted first from the ashes, and within a million years mammals spread into the empty world, eventually including us.',
      params: { scene: 'world', clock: 98 },
      tween: 14,
      duration: 16,
    },
    {
      title: 'Clues in the rocks',
      text: 'In 1980 Luis and Walter Alvarez found a thin clay layer at the end of the Cretaceous with up to 30 times more iridium than normal. Iridium is rare in Earth’s crust but common in asteroids, and the layer turned up worldwide. It also holds shocked quartz, only made by enormous impacts, and glassy beads. In 1991 the matching crater was identified, buried under Yucatán: Chicxulub.',
      params: { scene: 'rocks' },
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Choose an asteroid size and speed and launch it. A 20 m rock exploded over Chelyabinsk, Russia, in 2013; a 50 m iron one dug Meteor Crater in Arizona. How big must a rock be to make a crater at all?',
      params: { scene: 'impact', size: 1, speed: 18 },
      enter: (s) => s.launch(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let tau = 0;

    const sky = (y) => {
      const c = climate(y);
      const day = c.sun;
      const top = [lerp(18, 70, day), lerp(16, 130, day), lerp(14, 205, day)];
      const bot = [lerp(40, 190, day), lerp(30, 210, day), lerp(24, 230, day)];
      const hot = c.heat;
      return {
        top: top.map((v, i) => Math.round(lerp(v, [140, 30, 10][i], hot * 0.85))),
        bot: bot.map((v, i) => Math.round(lerp(v, [255, 110, 40][i], hot * 0.9))),
        c,
      };
    };

    function sauropod(x, y, s, col) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y, 34 * s, 14 * s, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath(); // neck and head
      ctx.moveTo(x + 22 * s, y - 6 * s);
      ctx.quadraticCurveTo(x + 46 * s, y - 30 * s, x + 54 * s, y - 62 * s);
      ctx.lineTo(x + 64 * s, y - 64 * s);
      ctx.lineTo(x + 60 * s, y - 56 * s);
      ctx.quadraticCurveTo(x + 52 * s, y - 24 * s, x + 30 * s, y + 4 * s);
      ctx.fill();
      ctx.beginPath(); // tail
      ctx.moveTo(x - 30 * s, y - 6 * s);
      ctx.quadraticCurveTo(x - 60 * s, y - 2 * s, x - 82 * s, y + 10 * s);
      ctx.quadraticCurveTo(x - 58 * s, y + 6 * s, x - 28 * s, y + 6 * s);
      ctx.fill();
      for (const lx of [-20, -10, 14, 24]) ctx.fillRect(x + lx * s, y + 6 * s, 6 * s, 20 * s);
    }
    function trex(x, y, s, col) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y, 18 * s, 10 * s, -0.25, 0, TAU);
      ctx.fill();
      ctx.beginPath(); // head
      ctx.moveTo(x + 12 * s, y - 10 * s);
      ctx.lineTo(x + 30 * s, y - 18 * s);
      ctx.lineTo(x + 34 * s, y - 10 * s);
      ctx.lineTo(x + 20 * s, y - 4 * s);
      ctx.fill();
      ctx.beginPath(); // tail
      ctx.moveTo(x - 14 * s, y - 2 * s);
      ctx.lineTo(x - 46 * s, y + 6 * s);
      ctx.lineTo(x - 12 * s, y + 6 * s);
      ctx.fill();
      ctx.fillRect(x - 6 * s, y + 6 * s, 5 * s, 18 * s);
      ctx.fillRect(x + 4 * s, y + 6 * s, 5 * s, 18 * s);
    }

    function drawWorld() {
      const { w, h } = api;
      const phone = w < 760;
      const y = yearsAt(params.clock);
      const s = sky(y);
      const { c } = s;
      const hy = h * (phone ? 0.66 : 0.7);
      const g = ctx.createLinearGradient(0, 0, 0, hy);
      g.addColorStop(0, `rgb(${s.top})`);
      g.addColorStop(1, `rgb(${s.bot})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, hy);
      // the Sun, dimmed by the haze
      if (c.sun > 0.15) {
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, phone ? w * 0.8 : w * 0.56, h * 0.18, 70, '#fff2c0', 0.4 * c.sun);
        ctx.globalCompositeOperation = 'source-over';
      }
      // shooting-star ejecta re-entering
      if (c.heat > 0.05) {
        ctx.strokeStyle = `rgba(255,220,150,${0.8 * c.heat})`;
        ctx.lineWidth = 1.5;
        for (let k = 0; k < 40; k++) {
          const sx = ((k * 7919 + api.time * 260 * (1 + (k % 3))) % (w + 200)) - 100, sy = ((k * 104729) % 997) / 997 * hy * 0.8;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 26, sy - 14);
          ctx.stroke();
        }
      }
      // life and recovery
      const recover = smoothstep(10, 300, y);
      const burnt = smoothstep(0.5 * HOUR, 3 * HOUR, y) * (1 - recover);
      const snow = smoothstep(0.1, 1, y) * (1 - smoothstep(4, 15, y));
      const ground = [
        lerp(lerp(70, 40, burnt), 150, snow * 0.6),
        lerp(lerp(110, 34, burnt), 150, snow * 0.6),
        lerp(lerp(50, 28, burnt), 155, snow * 0.6),
      ].map((v) => Math.round(v * (0.35 + 0.65 * c.sun)));
      ctx.fillStyle = `rgb(${ground})`;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, hy - 10 * Math.sin(x * 0.006) - 5 * Math.sin(x * 0.02));
      ctx.lineTo(w, h);
      ctx.fill();
      // trees: green, then burnt stumps, then ferns and new forest
      const trees = 16;
      for (let k = 0; k < trees; k++) {
        const tx = ((k * 7919) % 1000) / 1000 * w, base = hy - 10 * Math.sin(tx * 0.006) + 2;
        const ht = 50 + ((k * 31) % 7) * 12;
        const alive = burnt < 0.5 || recover > 0.6;
        const grow = recover > 0.6 ? smoothstep(0.6, 1, recover) : 1;
        ctx.fillStyle = alive ? `rgba(${Math.round(30 * c.sun)},${Math.round(80 * c.sun + 10)},${Math.round(40 * c.sun)},1)` : '#1a1410';
        ctx.fillRect(tx - 2, base - ht * grow, 4, ht * grow);
        if (alive) {
          ctx.beginPath();
          ctx.ellipse(tx, base - ht * grow, 22 * grow, 12 * grow, 0, 0, TAU);
          ctx.fill();
        }
      }
      // ferns first after the disaster
      const fern = smoothstep(2, 30, y) * (1 - smoothstep(500, 5000, y) * 0.5);
      if (fern > 0.02) {
        ctx.strokeStyle = `rgba(90,170,70,${fern})`;
        ctx.lineWidth = 2;
        for (let k = 0; k < 60; k++) {
          const fx = ((k * 104729) % 1000) / 1000 * w, fy = hy + 6 + ((k * 37) % 40);
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.quadraticCurveTo(fx + 6, fy - 14, fx + 12, fy - 18);
          ctx.moveTo(fx, fy);
          ctx.quadraticCurveTo(fx - 6, fy - 12, fx - 10, fy - 16);
          ctx.stroke();
        }
      }
      // dinosaurs, until the long winter
      const dino = 1 - smoothstep(0.1, 0.6, y);
      if (dino > 0.02) {
        ctx.globalAlpha = dino;
        const col = `rgb(${Math.round(30 + 30 * c.sun)},${Math.round(36 + 30 * c.sun)},${Math.round(30 + 20 * c.sun)})`;
        sauropod(w * (phone ? 0.68 : 0.62), hy + 18, phone ? 0.8 : 1.4, col);
        trex(w * (phone ? 0.3 : 0.86), hy + 26, phone ? 0.9 : 1.3, col);
        ctx.globalAlpha = 1;
      }
      // small mammals spread out later
      const mam = smoothstep(1000, 1e5, y);
      if (mam > 0.02) {
        ctx.fillStyle = `rgba(120,90,60,${mam})`;
        for (let k = 0; k < 7; k++) {
          const mx = ((k * 7919 + 300) % 1000) / 1000 * w, my = hy + 30 + (k % 3) * 22;
          ctx.beginPath();
          ctx.ellipse(mx, my, 9 + (k % 3) * 6, 5 + (k % 3) * 3, 0, 0, TAU);
          ctx.fill();
        }
      }
      // fire glow and embers / falling ash and snow
      if (burnt > 0.05 && c.heat > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 12; k++) drawGlow(ctx, ((k * 7919) % 1000) / 1000 * w, hy, 60, '#ff7a1a', 0.35 * c.heat);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (snow > 0.05 || (y > 0.003 && y < 0.5)) {
        ctx.fillStyle = snow > 0.3 ? `rgba(230,230,235,${0.6 * snow})` : 'rgba(110,100,95,0.6)';
        for (let k = 0; k < 90; k++) {
          const fx = (((k * 7919) % 1000) / 1000 * w + Math.sin(api.time + k) * 10) % w;
          const fy = ((((k * 104729) % 997) / 997) * hy + api.time * (20 + (k % 5) * 6)) % hy;
          ctx.fillRect(fx, fy, 2, 2);
        }
      }

      // clock and graph
      text(ctx, fmtYears(y).replace(/^./, (m) => m.toUpperCase()), 20, phone ? 70 : 120, { size: phone ? 16 : 22, weight: 700 });
      text(ctx, 'Hell Creek, Montana: about 3,000 km from the impact', 20, phone ? 90 : 146, { size: phone ? 10 : 12, color: C.dim });
      if (!phone) {
        const X0 = w - 340, Y0 = 108, W = 320, H = 150;
        ctx.fillStyle = 'rgba(8,11,24,0.82)';
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        roundRect(ctx, X0, Y0, W, H, 12);
        ctx.fill();
        ctx.stroke();
        const x0 = X0 + 12, x1 = X0 + W - 12, y0 = Y0 + 30, y1 = Y0 + H - 22;
        const X = (cl) => x0 + ((cl - 10) / 90) * (x1 - x0);
        ctx.lineWidth = 2;
        ctx.strokeStyle = C.amber;
        ctx.beginPath();
        for (let cl = 10; cl <= 100; cl += 0.5) ctx[cl === 10 ? 'moveTo' : 'lineTo'](X(cl), y1 - climate(yearsAt(cl)).sun * (y1 - y0));
        ctx.stroke();
        ctx.strokeStyle = C.cyan;
        ctx.beginPath();
        for (let cl = 10; cl <= 100; cl += 0.5) ctx[cl === 10 ? 'moveTo' : 'lineTo'](X(cl), y0 + (y1 - y0) * 0.35 - (climate(yearsAt(cl)).dT / 25) * (y1 - y0) * 0.6);
        ctx.stroke();
        if (params.clock >= 10) {
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.beginPath();
          ctx.moveTo(X(params.clock), y0);
          ctx.lineTo(X(params.clock), y1);
          ctx.stroke();
        }
        text(ctx, 'sunlight', X0 + 12, Y0 + 15, { size: 11, color: C.amber, weight: 600 });
        text(ctx, 'temperature', X0 + 80, Y0 + 15, { size: 11, color: C.cyan, weight: 600 });
        [['min', 12], ['day', 32], ['yr', 56], ['1,000 yr', 86]].forEach(([s, cl]) => text(ctx, s, X(cl), y1 + 11, { size: 9, align: 'center', color: 'rgba(233,237,247,0.5)' }));
      }
    }

    function drawImpact() {
      const { w, h } = api;
      const phone = w < 760;
      const d = params.size, v = params.speed;
      const E = energyMt(d, v);
      const airburst = d < 0.06;
      const Df = airburst ? 0 : craterKm(E);
      const complex = Df > 4;
      const Dt = complex ? Df / 1.6 : Df;
      const depthT = Dt / 3;
      const viewKm = Math.max(Df * 2.4, 60 * Math.min(1, d * 6 + 0.2), 4);
      const kpx = w / viewKm;
      const gy = h * (phone ? 0.62 : 0.6);
      const cx = w * 0.55;
      // time line: 0–2 s approach, 2 impact, then excavation and collapse
      const T = tau;
      const hit = 2;
      ctx.fillStyle = '#04060f';
      ctx.fillRect(0, 0, w, h);
      // sky
      const sg = ctx.createLinearGradient(0, 0, 0, gy);
      sg.addColorStop(0, '#060a1c');
      sg.addColorStop(1, '#2a4a7a');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, w, gy);
      // rock layers
      const layers = [['#3f5f8f', 0.5], ['#b49a72', 3], ['#9a7d58', 6], ['#7d6346', 12], ['#5e4a38', 40]];
      let yy = gy;
      for (const [col, km] of layers) {
        ctx.fillStyle = col;
        ctx.fillRect(0, yy, w, km * kpx + 1);
        yy += km * kpx;
      }
      if (yy < h) {
        ctx.fillStyle = '#3e2f26';
        ctx.fillRect(0, yy, w, h - yy);
      }
      // the crater: a transient bowl that grows, then collapses into a shallow peak-ring crater
      const ex = clamp((T - hit) / 2.2, 0, 1), col = clamp((T - hit - 2.6) / 3, 0, 1);
      if (!airburst && T > hit) {
        const R = (Dt / 2) * Math.pow(ex, 0.5) * kpx * (1 + col * (Df / Dt - 1));
        const D = depthT * kpx * Math.pow(ex, 0.5) * (1 - col * 0.9);
        const peak = complex ? depthT * kpx * 0.9 * Math.sin(Math.PI * clamp(col * 1.6, 0, 1)) + (col > 0.62 ? depthT * kpx * 0.08 : 0) : 0;
        ctx.fillStyle = '#1a1210';
        ctx.beginPath();
        ctx.moveTo(cx - R * 1.08, gy);
        for (let i = 0; i <= 60; i++) {
          const u = -1 + (2 * i) / 60;
          let depth = D * (1 - u * u);
          if (complex && col > 0) depth -= peak * Math.exp(-((u / 0.18) ** 2)) + (col > 0.6 ? depthT * kpx * 0.06 * Math.exp(-(((Math.abs(u) - 0.45) / 0.1) ** 2)) : 0);
          ctx.lineTo(cx + u * R, gy + Math.max(-depthT * kpx * 0.6, depth));
        }
        ctx.lineTo(cx + R * 1.08, gy);
        ctx.closePath();
        ctx.fill();
        // melt glow
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, cx, gy + D * 0.5, Math.max(20, R * 0.7), '#ff6a1a', 0.35 * (1 - col * 0.7));
        ctx.globalCompositeOperation = 'source-over';
        // rim
        ctx.fillStyle = '#6e5a44';
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(cx + s * R * 0.95, gy);
          ctx.quadraticCurveTo(cx + s * R * 1.1, gy - Math.min(D * 0.12, 40) - 2, cx + s * R * 1.4, gy);
          ctx.fill();
        }
        // ejecta curtain and vapour plume
        if (ex < 1 || col < 0.4) {
          const k = 1 - col * 2.5;
          ctx.strokeStyle = `rgba(255,180,90,${0.55 * k})`;
          ctx.lineWidth = 2;
          for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(cx + s * R, gy);
            ctx.lineTo(cx + s * (R + R * 1.4), gy - R * 1.4);
            ctx.stroke();
          }
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, cx, gy - R * 0.9 * ex, R * 1.4 + 20, '#ffd28a', 0.3 * k);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      // the asteroid coming in at 45°
      const burstAlt = d < 0.03 ? 25 : 8;
      if (T < hit || (airburst && T < hit + 0.4)) {
        const f = clamp(T / hit, 0, 1);
        const end = airburst ? { x: cx, y: gy - burstAlt * kpx } : { x: cx, y: gy };
        const start = { x: end.x - h * 0.9, y: end.y - h * 0.9 };
        const x = lerp(start.x, end.x, f), y = lerp(start.y, end.y, f);
        const r = Math.max(3, (d / 2) * kpx);
        ctx.strokeStyle = 'rgba(255,170,80,0.5)';
        ctx.lineWidth = Math.max(2, r * 0.8);
        ctx.beginPath();
        ctx.moveTo(x - (x - start.x) * 0.4, y - (y - start.y) * 0.4);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, x, y, r * 4 + 10, '#ffb070', 0.4);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#5a5048';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
      if (airburst && T >= hit) {
        const k = clamp(1 - (T - hit) / 2.5, 0, 1);
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, cx, gy - burstAlt * kpx, 60 + 200 * (1 - k), '#fff0c0', 0.6 * k);
        ctx.globalCompositeOperation = 'source-over';
      }
      // impact flash
      const flash = T > hit ? Math.exp(-(T - hit) * 3) : 0;
      if (flash > 0.02) {
        ctx.fillStyle = `rgba(255,250,230,${0.85 * flash})`;
        ctx.fillRect(0, 0, w, h);
      }
      // scale references: Everest and a cruising airliner, to scale
      const ev = 8.85 * kpx;
      if (ev > 6) {
        ctx.fillStyle = 'rgba(200,210,230,0.5)';
        ctx.beginPath();
        ctx.moveTo(w * 0.08, gy);
        ctx.lineTo(w * 0.08 + ev * 0.9, gy - ev);
        ctx.lineTo(w * 0.08 + ev * 1.8, gy);
        ctx.fill();
        text(ctx, 'Mount Everest', w * 0.08 + ev * 0.9, gy - ev - 10, { size: 10, align: 'center', color: C.dim });
      }
      const ap = gy - 10.7 * kpx;
      if (ap > 70) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(0, ap);
        ctx.lineTo(w, ap);
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, 'airliners fly here (11 km)', w - 16, ap - 8, { size: 10, align: 'right', color: C.dim });
      }
      // scale bar
      const bar = Math.pow(10, Math.floor(Math.log10(viewKm / 4)));
      const bx = w - 30 - bar * kpx;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, h - 30);
      ctx.lineTo(bx + bar * kpx, h - 30);
      ctx.stroke();
      text(ctx, `${bar >= 1 ? bar : bar * 1000} ${bar >= 1 ? 'km' : 'm'}`, bx + (bar * kpx) / 2, h - 42, { size: 10, align: 'center', color: C.dim });
      const label = T < hit ? 'incoming' : airburst ? 'exploded in the air' : col < 0.05 ? 'excavating the crater (seconds)' : col < 1 ? 'the floor rebounds and collapses (minutes)' : `final crater: ${Df < 1 ? Math.round(Df * 1000) + ' m' : Math.round(Df) + ' km'} across`;
      tag(ctx, label, w - 16, phone ? 56 : 84, T < hit ? C.amber : C.red, { align: 'right' });
    }

    function drawRocks() {
      const { w, h } = api;
      const phone = w < 760;
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(0, 0, w, h);
      const X0 = phone ? w * 0.5 : w * 0.47, W = phone ? w * 0.4 : w * 0.11, top = phone ? 70 : 110, bot = h - (phone ? 70 : 40);
      const mid = (top + bot) / 2;
      // Paleogene above, boundary clay, Cretaceous below
      const draw = (y0, y1, c1, c2) => {
        const g = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, c1);
        g.addColorStop(1, c2);
        ctx.fillStyle = g;
        ctx.fillRect(X0, y0, W, y1 - y0);
      };
      draw(top, mid - 8, '#b9a98c', '#a8977a');
      draw(mid - 8, mid + 8, '#5a3c2e', '#4a3226');
      draw(mid + 8, bot, '#d8cdb5', '#c7b99c');
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      for (let y = top + 14; y < bot; y += 14) {
        if (Math.abs(y - mid) < 12) continue;
        ctx.beginPath();
        ctx.moveTo(X0, y);
        ctx.lineTo(X0 + W, y + Math.sin(y) * 2);
        ctx.stroke();
      }
      // fossils: ammonites and bones below, none above
      ctx.strokeStyle = 'rgba(90,70,50,0.7)';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 6; k++) {
        const fx = X0 + 16 + ((k * 37) % 5) * (W - 32) / 4, fy = mid + 30 + ((k * 53) % 6) * ((bot - mid - 50) / 6);
        ctx.beginPath();
        for (let a = 0; a < 12; a += 0.3) ctx[a ? 'lineTo' : 'moveTo'](fx + Math.cos(a) * a * 0.9, fy + Math.sin(a) * a * 0.9);
        ctx.stroke();
      }
      const fs = phone ? 10 : 12;
      text(ctx, 'After: Paleogene (no dinosaurs)', X0 - 12, (top + mid) / 2, { size: fs, align: 'right', color: C.dim });
      text(ctx, 'boundary clay (about 1 cm)', X0 - 12, mid, { size: fs, weight: 700, align: 'right', color: C.amber });
      text(ctx, 'Before: Cretaceous (fossils)', X0 - 12, mid + 34, { size: fs, align: 'right', color: C.dim });
      // iridium profile
      if (!phone) {
        const gx0 = w * 0.64, gx1 = w - 40;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(gx0, top);
        ctx.lineTo(gx0, bot);
        ctx.stroke();
        ctx.strokeStyle = C.violet;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let y = top; y <= bot; y += 2) {
          const d = (y - mid) / 10;
          const v = 0.3 + 9 * Math.exp(-d * d) + (y < mid ? 1.2 * Math.exp((y - mid) / 60) : 0);
          ctx[y === top ? 'moveTo' : 'lineTo'](gx0 + (v / 10) * (gx1 - gx0), y);
        }
        ctx.stroke();
        text(ctx, 'Iridium in the rock', gx1, top + 4, { size: 12, weight: 600, align: 'right', color: C.violet });
        text(ctx, 'about 30× normal', gx0 + (9.3 / 10) * (gx1 - gx0) - 6, mid - 18, { size: 11, align: 'right', color: C.violet });
        text(ctx, 'normal level', gx0 + 30, bot - 20, { size: 10, color: C.dim });
      }
      const items = ['iridium: rare on Earth, common in asteroids', 'shocked quartz: only made by huge impacts', 'glassy spherules: melted rock that rained down', 'soot from worldwide fires'];
      if (!phone) items.forEach((s, i) => text(ctx, `• ${s}`, 24, 120 + i * 24, { size: 12, color: 'rgba(233,237,247,0.8)' }));
    }

    return {
      launch(skipApproach) {
        tau = skipApproach ? 2 : 0;
      },
      reset() {
        tau = 0;
      },
      update(dt) {
        tau += dt;
      },
      draw() {
        if (params.scene === 'impact') drawImpact();
        else if (params.scene === 'world') drawWorld();
        else drawRocks();
      },
      stats() {
        const E = energyMt(params.size, params.speed);
        const air = params.size < 0.06;
        const y = yearsAt(params.clock);
        const c = climate(y);
        if (params.scene === 'world')
          return [
            { label: 'Time', value: fmtYears(y), color: C.amber },
            { label: 'Sunlight reaching the ground', value: `${Math.round(c.sun * 100)} %`, color: C.amber },
            { label: 'Temperature change', value: `${c.dT > 0 ? '+' : ''}${c.dT.toFixed(0)} °C`, color: C.cyan },
          ];
        return [
          { label: 'Energy', value: E > 1e6 ? `${(E / 1e6).toFixed(0)} million megatons` : E > 1000 ? `${Math.round(E).toLocaleString('en-US')} megatons` : `${E.toFixed(E < 1 ? 2 : 0)} megatons`, color: C.amber },
          { label: 'Hiroshima bombs', value: E / HIROSHIMA > 1e9 ? `${(E / HIROSHIMA / 1e9).toFixed(1)} billion` : Math.round(E / HIROSHIMA).toLocaleString('en-US') },
          { label: 'Crater', value: air ? 'none: it explodes in the air' : craterKm(E) < 1 ? `${Math.round(craterKm(E) * 1000)} m` : `${Math.round(craterKm(E))} km`, color: C.red },
          { label: 'Crater ÷ asteroid size', value: air ? '—' : `${(craterKm(E) / params.size).toFixed(0)} ×` },
        ];
      },
    };
  },
};
