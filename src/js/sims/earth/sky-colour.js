import { C, TAU, clamp, drawGlow, roundRect, tag, text } from '../../core/util.js';

// Why the sky is blue. The sky is rendered with single scattering through a spherical, exponential atmosphere:
// for each direction we march along the line of sight and add sunlight scattered towards us at each point, dimmed
// on its way in from the Sun and on its way out to us. Air molecules scatter as λ⁻⁴ (Rayleigh) with the
// standard phase function; haze and dust scatter all colours alike, mostly forwards (Henyey–Greenstein).
// Three channels stand for red (680 nm), green (550 nm) and blue (440 nm).

const RE = 6371, TOP = 60; // km
const LAMBDA = [0.68, 0.55, 0.44]; // μm
const TAU_R = LAMBDA.map((l) => 0.0088 * l ** -4.05); // Rayleigh optical depth straight up: 0.042, 0.10, 0.25
const PLANETS = {
  earth: { HR: 8, HM: 1.2, ray: TAU_R, dustScat: [1, 1, 1], dustExt: [1, 1, 1], g: [0.8, 0.8, 0.8], sun: [1, 0.98, 0.94], ground: [0.16, 0.22, 0.12] },
  // Mars: almost no air, but fine dust that absorbs blue and throws what blue it scatters strongly forwards
  mars: { HR: 11, HM: 11, ray: TAU_R.map((t) => t * 0.02), dustScat: [0.95, 0.72, 0.5], dustExt: [1, 1.05, 1.15], g: [0.55, 0.65, 0.9], sun: [0.72, 0.7, 0.66], ground: [0.32, 0.17, 0.09] },
};
const COLOURS = [
  { nm: 680, col: '#ff4040', name: 'red' },
  { nm: 610, col: '#ff9a2e', name: 'orange' },
  { nm: 575, col: '#ffe14a', name: 'yellow' },
  { nm: 530, col: '#4cf06a', name: 'green' },
  { nm: 470, col: '#3a8cff', name: 'blue' },
  { nm: 420, col: '#9b5cff', name: 'violet' },
];

/** Distance along a ray from height h (km) at elevation angle e until it leaves the atmosphere, or -1 if it hits the ground. */
function exitDist(h, sinE) {
  const r = RE + h;
  const b = r * sinE;
  const disc = b * b - (r * r - (RE + TOP) ** 2);
  const s = -b + Math.sqrt(Math.max(0, disc));
  // does it hit the planet?
  const dg = b * b - (r * r - RE * RE);
  if (sinE < 0 && dg > 0 && -b - Math.sqrt(dg) > 0) return -1;
  return s;
}
const hg = (cosT, g) => (1 - g * g) / (4 * Math.PI * (1 + g * g - 2 * g * cosT) ** 1.5);
const rayPhase = (cosT) => (3 / (16 * Math.PI)) * (1 + cosT * cosT);

/** Optical depths (per unit τ) along a ray from height h at elevation sinE: [rayleigh, mie]. */
function depth(h, sinE, P, n = 10) {
  const S = exitDist(h, sinE);
  if (S < 0) return null;
  let dr = 0, dm = 0, prev = 0;
  for (let i = 1; i <= n; i++) {
    const s = S * (i / n) ** 2;
    const mid = (s + prev) / 2;
    const r = Math.sqrt((RE + h) ** 2 + mid * mid + 2 * (RE + h) * mid * sinE);
    const hh = r - RE;
    dr += Math.exp(-hh / P.HR) * (s - prev);
    dm += Math.exp(-hh / P.HM) * (s - prev);
    prev = s;
  }
  return [dr / P.HR, dm / P.HM]; // normalised so that straight up from the ground ≈ 1
}

export default {
  id: 'sky-colour',
  title: 'Why Is the Sky Blue?',
  category: 'earth',
  tagline: 'Sunlight is white, so why is the sky blue, sunsets red, and clouds white?',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Light', 'Atmosphere', 'Colour'],
  keywords: ['why is the sky blue', 'Rayleigh scattering', 'sunset', 'red sunset', 'scattering', 'wavelength', 'atmosphere', 'Mars sunset', 'blue sunset', 'clouds white', 'haze', 'Mie scattering', 'Tyndall'],
  blurb:
    'Sunlight contains every colour, yet the sky glows blue and the setting Sun turns orange and red. The reason is that air molecules scatter short blue waves of light far more than long red ones. Scattered blue reaches your eyes from every direction; light that crosses a lot of air loses its blue on the way. Change the time of day, add haze, or watch a sunset on Mars, where the colours are reversed.',
  ideas: [
    'White sunlight is a mix of all colours, from red (long waves) to violet (short waves).',
    'Air molecules scatter light far more strongly at short wavelengths: about <b>1 ÷ λ⁴</b>, so blue scatters about 5 times more than red.',
    'Blue light scattered out of the sunbeam reaches us from all over the sky, so the sky looks blue.',
    'At sunset sunlight crosses up to 40 times more air: most of the blue is scattered away and the Sun looks orange-red.',
    'Bigger particles (cloud droplets, dust) scatter all colours about equally, so clouds look <b>white</b> and haze looks pale.',
  ],
  hint: 'Drag the Sun up and down the sky',
  thumbChapter: 4,
  thumbFrames: 200,
  params: [
    { key: 'alt', label: 'Height of the Sun', type: 'range', min: -8, max: 70, step: 0.5, value: 40, format: (v) => v.toFixed(1) + '°' },
    { key: 'haze', label: 'Haze, dust or pollution', type: 'range', min: 0, max: 1, step: 0.01, value: 0.03, format: (v) => Math.round(v * 100) + ' %' },
    {
      key: 'planet', label: 'Planet', type: 'select', value: 'earth', instant: true,
      options: [{ value: 'earth', label: 'Earth' }, { value: 'mars', label: 'Mars' }],
    },
    { key: 'inset', label: 'Show the light being scattered', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'White light',
      text: 'Sunlight looks white, but it is a mixture of all the colours of the rainbow. In the panel, each dot is a bit of sunlight of one colour heading for the ground. Most of them travel straight through the air. Now and then one bounces off an air molecule and flies off in a new direction: it is <b>scattered</b>.',
      params: { alt: 40, haze: 0.03, planet: 'earth', inset: true },
      enter: (s) => s.clearCounts(),
      duration: 14,
    },
    {
      title: 'Blue scatters most',
      text: 'Air molecules are far smaller than a wave of light, and they scatter short waves much more strongly than long ones: the effect grows as 1 ÷ wavelength⁴. Blue light (wavelength 450 nm) is scattered about 5 times more than red (680 nm). Look at the tally: blue and violet bounce off far more often. That scattered blue comes at you from every part of the sky.',
      formula: 'scattering ∝ 1 ÷ λ⁴',
      params: { alt: 40, haze: 0.03, planet: 'earth', inset: true },
      duration: 15,
    },
    {
      title: 'Why not violet?',
      text: 'Violet scatters even more than blue, so why isn’t the sky violet? The Sun gives out less violet than blue, some of it is absorbed high up in the atmosphere, and our eyes are much less sensitive to it. The mix of scattered colours that does reach us looks sky blue.',
      check: {
        q: 'Violet light is scattered even more than blue. So why does the sky look blue, not violet?',
        options: ['Less violet in sunlight, and our eyes are less sensitive to it', 'Violet light can’t pass through air at all', 'Violet is scattered back out into space'],
        answer: 0,
        setup: { alt: 40, haze: 0.03, planet: 'earth', inset: true },
        explain: 'Plenty of violet is scattered, but there is less of it in sunlight to start with, and our eyes respond weakly to it. Our blue and green colour sensors respond strongly to the rest of the scattered mix, and the brain reads the result as sky blue.',
      },
      params: { alt: 50, haze: 0.03, planet: 'earth', inset: true },
      duration: 13,
    },
    {
      title: 'Sunset',
      text: 'As the Sun sinks, its light must cross more and more air to reach you, almost 40 times as much at the horizon as from overhead. Along the way nearly all the blue is scattered out of the beam. What’s left is yellow, orange, then red, which colours the Sun and the clouds around it.',
      check: {
        q: 'Why does the setting Sun look red?',
        options: ['Its light crosses far more air, so the blue is scattered away first', 'The Sun cools down in the evening', 'The ground reflects red light up into the sky'],
        answer: 0,
        setup: { alt: 25, haze: 0.12, planet: 'earth', inset: true },
        explain: 'The Sun’s colour never changes. Near the horizon its light skims through a long slice of atmosphere, and with every kilometre more blue is scattered out of the beam, leaving the reds and oranges to reach your eyes.',
      },
      params: { alt: 1.2, haze: 0.12, planet: 'earth', inset: true },
      tween: 12,
      duration: 16,
    },
    {
      title: 'White clouds and hazy skies',
      text: 'Cloud droplets, dust and smoke are much bigger than air molecules. They scatter all colours about equally, so clouds look white and a polluted or dusty sky looks pale and milky rather than deep blue. Turn the haze up and see the blue wash out, especially near the Sun.',
      params: { alt: 35, haze: 0.85, planet: 'earth', inset: false },
      duration: 13,
    },
    {
      title: 'Sunset on Mars',
      text: 'Mars has almost no air, but its sky is full of fine reddish dust. The dust absorbs blue, so the daytime sky is a butterscotch orange. But the dust throws what blue it does scatter mostly forwards, so around the setting Sun the sky turns <b>blue</b>. NASA’s Curiosity rover photographed exactly this in 2015.',
      params: { alt: 3, haze: 0.5, planet: 'mars', inset: false },
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Drag the Sun across the sky, add haze, or switch planets. Can you make a deep blue sky, a pale hazy one, and a fiery sunset?',
      params: { alt: 12, haze: 0.15, planet: 'earth', inset: true },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const GW = 72, GH = 40; // sky grid
    let skyKey = '';
    let skyCanvas = null;
    let sunCol = [1, 1, 1], drag = false;
    // photons in the inset
    const photons = [];
    const tally = new Array(COLOURS.length).fill(0);

    const geom = () => {
      const { w, h } = api;
      const phone = w < 760;
      const hy = phone ? h * 0.66 : h * 0.72;
      const sunX = phone ? w * 0.42 : w * 0.46;
      const inset = phone ? { x: w * 0.5, y: 60, w: w * 0.5 - 10, h: Math.min(170, h * 0.36) } : { x: w * 0.62, y: 110, w: w * 0.38 - 20, h: Math.min(330, h * 0.4) };
      return { phone, hy, sunX, inset, elTop: 75, azSpan: phone ? 110 : 150 };
    };
    const elToY = (g, e) => g.hy - (e / g.elTop) * g.hy;

    function renderSky() {
      const P = PLANETS[params.planet];
      const key = `${params.alt.toFixed(2)}|${params.haze.toFixed(3)}|${params.planet}|${api.w}|${api.h}`;
      if (key === skyKey) return;
      skyKey = key;
      const g = geom();
      const a = (params.alt * Math.PI) / 180;
      const sunDir = [Math.cos(a), 0, Math.sin(a)];
      const tauM = params.haze * (params.planet === 'mars' ? 1.2 : 0.5);
      if (!skyCanvas) skyCanvas = document.createElement('canvas');
      skyCanvas.width = GW;
      skyCanvas.height = GH;
      const sc = skyCanvas.getContext('2d');
      const img = sc.createImageData(GW, GH);
      const twilight = clamp((params.alt + 8) / 8, 0, 1);
      const exposure = params.planet === 'mars' ? 9 : 12;
      for (let j = 0; j < GH; j++) {
        const y = (j / (GH - 1)) * g.hy;
        const e = Math.max(0.3, ((g.hy - y) / g.hy) * g.elTop);
        const er = (e * Math.PI) / 180;
        for (let i = 0; i < GW; i++) {
          const x = (i / (GW - 1)) * api.w;
          const az = (((x - g.sunX) / api.w) * g.azSpan * Math.PI) / 180;
          const d = [Math.cos(er) * Math.cos(az), Math.cos(er) * Math.sin(az), Math.sin(er)];
          const cosT = d[0] * sunDir[0] + d[1] * sunDir[1] + d[2] * sunDir[2];
          const S = exitDist(0, d[2]);
          const out = [0, 0, 0];
          const N = 14;
          let vr = 0, vm = 0, prev = 0;
          for (let k = 1; k <= N; k++) {
            const s = S * (k / N) ** 2;
            const ds = s - prev;
            const mid = (s + prev) / 2;
            prev = s;
            const px = d[0] * mid, py = d[1] * mid, pz = RE + d[2] * mid;
            const r = Math.hypot(px, py, pz);
            const h = r - RE;
            const rho = Math.exp(-h / P.HR) / P.HR, mu = Math.exp(-h / P.HM) / P.HM;
            vr += rho * ds;
            vm += mu * ds;
            // sun elevation as seen from this point
            const sinS = (px * sunDir[0] + py * sunDir[1] + pz * sunDir[2]) / r;
            const sd = depth(h, sinS, P, 6);
            if (!sd) continue;
            for (let c = 0; c < 3; c++) {
              const att = Math.exp(-(P.ray[c] * (vr + sd[0]) + tauM * P.dustExt[c] * (vm + sd[1])));
              out[c] += (P.ray[c] * rho * rayPhase(cosT) + tauM * P.dustScat[c] * mu * hg(cosT, P.g[c])) * att * ds;
            }
          }
          const p = (j * GW + i) * 4;
          for (let c = 0; c < 3; c++) {
            const v = 1 - Math.exp(-out[c] * P.sun[c] * exposure * Math.PI);
            img.data[p + c] = 255 * Math.pow(clamp(v, 0, 1), 1 / 2.2) * (0.08 + 0.92 * twilight) + 4;
          }
          img.data[p + 3] = 255;
        }
      }
      sc.putImageData(img, 0, 0);
      // colour of the Sun's disc: sunlight after crossing the air to the ground
      const sd0 = depth(0, Math.sin(Math.max(a, -0.02)), P, 24) || [40, 40];
      sunCol = [0, 1, 2].map((c) => P.sun[c] * Math.exp(-(P.ray[c] * sd0[0] + tauM * P.dustExt[c] * sd0[1])));
    }

    function spawnPhoton(g) {
      const k = Math.floor(Math.random() * COLOURS.length);
      const a = (clamp(params.alt, 3, 70) * Math.PI) / 180;
      const ix = g.inset;
      // enter along the top/left edge, heading down-right at the Sun's angle
      const t = Math.random();
      const x = ix.x + t * ix.w * 0.8 - ix.w * 0.2, y = ix.y + 34;
      photons.push({ x, y, vx: Math.cos(a), vy: Math.sin(a), k, sc: false, life: 0 });
    }

    return {
      clearCounts() {
        tally.fill(0);
      },
      pointerDown(p) {
        const g = geom();
        const sy = elToY(g, params.alt);
        if (Math.hypot(p.x - g.sunX, p.y - sy) < 60) drag = true;
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        const g = geom();
        api.runner.set('alt', Math.round(clamp(((g.hy - p.y) / g.hy) * g.elTop, -8, 70) * 2) / 2);
      },
      pointerUp() {
        drag = false;
      },
      update(dt) {
        if (!params.inset) return;
        const g = geom();
        const ix = g.inset;
        for (let i = 0; i < 6; i++) if (photons.length < 160) spawnPhoton(g);
        const speed = ix.w * 0.45;
        const air = params.planet === 'mars' ? 0.05 : 1;
        for (const ph of photons) {
          ph.life += dt;
          ph.x += ph.vx * speed * dt;
          ph.y += ph.vy * speed * dt;
          if (!ph.sc) {
            const prob = 0.1 * air * (550 / COLOURS[ph.k].nm) ** 4 * dt;
            if (Math.random() < prob) {
              const ang = Math.random() * TAU;
              ph.vx = Math.cos(ang);
              ph.vy = Math.sin(ang);
              ph.sc = true;
              tally[ph.k]++;
            }
          }
        }
        for (let i = photons.length - 1; i >= 0; i--) {
          const ph = photons[i];
          if (ph.x < ix.x - 4 || ph.x > ix.x + ix.w + 4 || ph.y < ix.y + 24 || ph.y > ix.y + ix.h - 30 || ph.life > 6) photons.splice(i, 1);
        }
      },
      draw() {
        const { w, h } = api;
        const g = geom();
        renderSky();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(skyCanvas, 0, 0, w, g.hy);
        // stars come out at night
        const night = clamp((-params.alt - 2) / 6, 0, 1);
        if (night > 0) {
          for (let k = 0; k < 140; k++) {
            ctx.fillStyle = `rgba(230,235,255,${night * (0.3 + ((k * 37) % 10) / 15)})`;
            ctx.fillRect((((k * 7919) % 1000) / 1000) * w, (((k * 104729) % 997) / 997) * g.hy * 0.9, 1.3, 1.3);
          }
        }
        // the Sun
        const P = PLANETS[params.planet];
        const sy = elToY(g, params.alt);
        const sr = (params.planet === 'mars' ? 0.66 : 1) * Math.max(9, Math.min(w, h) * 0.022);
        const m = Math.max(...sunCol);
        const sc = sunCol.map((v) => Math.round(255 * Math.min(1, (v / m) ** (params.alt > 15 ? 0.25 : 0.7))));
        if (params.alt > -1.5) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, w, g.hy);
          ctx.clip();
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, g.sunX, sy, sr * 7, `rgb(${sc.join(',')})`, 0.25 * Math.min(1, m * 1.6));
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = `rgb(${sc.join(',')})`;
          ctx.beginPath();
          ctx.arc(g.sunX, sy, sr, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        // ground, lit by the sky and the Sun
        const light = clamp(Math.sin((Math.max(params.alt, 0) * Math.PI) / 180) * 1.4 + 0.12, 0.04, 1) * (1 - night * 0.8);
        const gr = ctx.createLinearGradient(0, g.hy, 0, h);
        gr.addColorStop(0, `rgb(${P.ground.map((v, c) => Math.round(255 * v * light * (0.6 + 0.4 * sunCol[c] / m))).join(',')})`);
        gr.addColorStop(1, `rgb(${P.ground.map((v) => Math.round(255 * v * light * 0.35)).join(',')})`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, g.hy, w, h - g.hy);
        // distant hills
        ctx.fillStyle = `rgba(0,0,0,${0.25 + 0.3 * (1 - light)})`;
        ctx.beginPath();
        ctx.moveTo(0, g.hy);
        for (let x = 0; x <= w; x += 8) ctx.lineTo(x, g.hy - 10 - 8 * Math.sin(x * 0.011) - 6 * Math.sin(x * 0.027 + 1));
        ctx.lineTo(w, g.hy);
        ctx.fill();
        if (params.alt < 12 && params.alt > -2) {
          const am = 1 / (Math.sin((Math.max(params.alt, 0) * Math.PI) / 180) + 0.50572 * (Math.max(params.alt, 0) + 6.07995) ** -1.6364);
          tag(ctx, `sunlight crosses ${Math.round(am)}× more air than at noon overhead`, g.sunX + 26, Math.min(sy - 30, g.hy - 40), C.amber, { align: 'left', size: 10 });
        }

        // inset: light being scattered
        if (params.inset) {
          const ix = g.inset;
          // a still frame (a paused quick check) still shows sunlight streaming in
          if (!photons.length) {
            for (let k = 0; k < 70; k++) {
              spawnPhoton(g);
              const ph = photons[photons.length - 1], d = Math.random() * ix.h * 0.7;
              ph.x += ph.vx * d;
              ph.y += ph.vy * d;
            }
          }
          ctx.fillStyle = 'rgba(6,9,20,0.86)';
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          roundRect(ctx, ix.x, ix.y, ix.w, ix.h, 12);
          ctx.fill();
          ctx.stroke();
          text(ctx, 'Sunlight meeting air molecules', ix.x + 12, ix.y + 14, { size: g.phone ? 10 : 11, weight: 600, color: C.dim });
          ctx.save();
          ctx.beginPath();
          ctx.rect(ix.x, ix.y + 24, ix.w, ix.h - 54);
          ctx.clip();
          // air molecules
          ctx.fillStyle = 'rgba(160,180,220,0.18)';
          for (let k = 0; k < 70; k++) ctx.fillRect(ix.x + (((k * 7919) % 1000) / 1000) * ix.w, ix.y + 24 + (((k * 104729) % 997) / 997) * (ix.h - 54), 2, 2);
          for (const ph of photons) {
            ctx.strokeStyle = COLOURS[ph.k].col;
            ctx.globalAlpha = ph.sc ? 0.95 : 0.6;
            ctx.lineWidth = ph.sc ? 2.2 : 1.4;
            ctx.beginPath();
            ctx.moveTo(ph.x, ph.y);
            ctx.lineTo(ph.x - ph.vx * 7, ph.y - ph.vy * 7);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.restore();
          // tally of scattered colours
          const tot = Math.max(1, ...tally);
          const bw = (ix.w - 24) / COLOURS.length;
          const by = ix.y + ix.h - 8;
          COLOURS.forEach((c, k) => {
            const bh = (tally[k] / tot) * 20;
            ctx.fillStyle = c.col;
            ctx.fillRect(ix.x + 12 + k * bw + 3, by - bh, bw - 6, bh);
          });
          text(ctx, 'scattered so far:', ix.x + 12, by - 24, { size: 9, color: 'rgba(233,237,247,0.55)' });
        }
        if (params.planet === 'mars') tag(ctx, 'Mars', w - 16, g.phone ? 56 : 84, C.orange, { align: 'right' });
      },
      stats() {
        const a = Math.max(params.alt, 0);
        const am = 1 / (Math.sin((a * Math.PI) / 180) + 0.50572 * (a + 6.07995) ** -1.6364);
        const P = PLANETS[params.planet];
        const reach = (c) => Math.exp(-P.ray[c] * am - params.haze * 0.5 * am);
        return [
          { label: 'Sun’s height', value: `${params.alt.toFixed(1)}°`, color: C.amber },
          { label: 'Air crossed (× overhead)', value: params.alt > -1 ? am.toFixed(1) : 'Sun has set' },
          { label: 'Blue light getting through', value: params.alt > -1 ? `${Math.round(reach(2) * 100)} %` : '—', color: C.blue },
          { label: 'Red light getting through', value: params.alt > -1 ? `${Math.round(reach(0) * 100)} %` : '—', color: C.red },
          { label: 'Blue scattered vs red', value: `${((680 / 440) ** 4).toFixed(1)} ×` },
        ];
      },
    };
  },
};
