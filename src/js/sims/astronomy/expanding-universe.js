import { C, TAU, clamp, lerp, smoothstep, drawGlow, tag, text, roundRect } from '../../core/util.js';

// The expanding universe, from inflation to the far future, on one clock.
// Expansion follows flat ΛCDM with Planck-like numbers: H(a) = H0 √(Ωr/a⁴ + Ωm/a³ + ΩΛ).
// Time t(a) is integrated once into a table; the background temperature is T = 2.725 K / a.
// Galaxies sit at fixed comoving positions (hashed cells, so the field never repeats and never runs out),
// drawn at screen position = home + a × (comoving offset). Bound galaxies keep their own size.

const H0 = 67.7 / 977.8; // per Gyr
const OM = 0.31, OR = 9.1e-5, OL = 1 - OM - OR;
const Hof = (a) => H0 * Math.sqrt(OR / a ** 4 + OM / a ** 3 + OL); // per Gyr
const CKMS = 299792;
const YR = 3.156e7; // seconds per year

// t(a) table, in Gyr, uniform in log10 a
const LA0 = -32, LA1 = Math.log10(12), NT = 4000;
const TT = new Float64Array(NT + 1);
{
  const du = ((LA1 - LA0) * Math.LN10) / NT;
  const a0 = 10 ** LA0;
  TT[0] = (a0 * a0) / (2 * H0 * Math.sqrt(OR));
  let prev = 1 / Hof(a0);
  for (let i = 1; i <= NT; i++) {
    const f = 1 / Hof(10 ** (LA0 + ((LA1 - LA0) * i) / NT));
    TT[i] = TT[i - 1] + 0.5 * (f + prev) * du;
    prev = f;
  }
}
function aOfT(t) {
  if (t <= TT[0]) return Math.sqrt(2 * H0 * Math.sqrt(OR) * Math.max(t, 1e-80));
  if (t >= TT[NT]) return 10 ** LA1;
  let lo = 0, hi = NT;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (TT[m] < t) lo = m;
    else hi = m;
  }
  const f = (t - TT[lo]) / (TT[hi] - TT[lo]);
  return 10 ** (LA0 + ((LA1 - LA0) * (lo + f)) / NT);
}
function tOfA(a) {
  const u = ((Math.log10(a) - LA0) / (LA1 - LA0)) * NT;
  const i = clamp(Math.floor(u), 0, NT - 1);
  return lerp(TT[i], TT[i + 1], u - i);
}
const T0 = tOfA(1); // ≈ 13.8 Gyr
/** Comoving distance light covers between scale factors a1 and a2, in billions of light-years. */
function chi(a1, a2) {
  if (a2 <= a1) return 0;
  const n = 160, l1 = Math.log(a1), l2 = Math.log(a2);
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const a = Math.exp(l1 + ((l2 - l1) * i) / n);
    s += (i === 0 || i === n ? 0.5 : 1) / (a * Hof(a));
  }
  return (s * (l2 - l1)) / n;
}

// The clock: a slider position 0–100 mapped piecewise onto time (log-uniform early on, linear later).
const S2Y = (s) => s / YR;
const ANCHORS = [
  [0, S2Y(1e-36)], [6, S2Y(1e-32)], [14, S2Y(1e-12)], [20, S2Y(1e-6)], [28, S2Y(1)], [36, S2Y(180)], [40, S2Y(1200)],
  [52, 3.8e5], [60, 1e8], [66, 4e8], [70, 1e9], [88, T0 * 1e9], [100, 50e9],
];
const TODAY = 88;
function yearsOf(x) {
  x = clamp(x, 0, 100);
  for (let i = 1; i < ANCHORS.length; i++) {
    const [x1, y1] = ANCHORS[i];
    if (x <= x1) {
      const [x0, y0] = ANCHORS[i - 1];
      const f = (x - x0) / (x1 - x0);
      return y0 >= 1e9 ? lerp(y0, y1, f) : 10 ** lerp(Math.log10(y0), Math.log10(y1), f);
    }
  }
  return 50e9;
}
const A_END = aOfT(S2Y(1e-32) / 1e9); // scale factor as inflation ends
function aOfX(x) {
  if (x < 6) return A_END * Math.exp(-10 * (6 - x)); // e^60 of inflation over the first 6 units
  return aOfT(yearsOf(x) / 1e9);
}

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).replace(/./g, (c) => SUP[c] ?? c);
const comma = (v) => Math.round(v).toLocaleString('en-US');
function big(v) {
  if (v < 100) return String(+v.toPrecision(2));
  if (v < 1e4) return comma(v);
  if (v < 1e6) return comma(Math.round(v / 100) * 100);
  const words = [[1e6, 'million'], [1e9, 'billion'], [1e12, 'trillion']];
  for (let i = words.length - 1; i >= 0; i--) {
    const [u, name] = words[i];
    if (v >= u && v < u * 1000) {
      const m = v / u;
      return `${m < 10 ? m.toFixed(1).replace(/\.0$/, '') : Math.round(m)} ${name}`;
    }
  }
  return `10${sup(Math.round(Math.log10(v)))}`;
}
function fmtTime(y) {
  const s = y * YR;
  if (s < 1e-3) {
    let e = Math.floor(Math.log10(s));
    let m = Math.round(s / 10 ** e);
    if (m >= 10) [m, e] = [1, e + 1];
    return `${m === 1 ? '' : m + ' × '}10${sup(e)} seconds`;
  }
  if (s < 1) return `${+s.toPrecision(2)} seconds`;
  if (s < 120) return `${Math.round(s)} second${Math.round(s) === 1 ? '' : 's'}`;
  if (s < 7200) return `${Math.round(s / 60)} minutes`;
  if (s < 2 * 86400) return `${Math.round(s / 3600)} hours`;
  if (y < 1) return `${Math.round(s / 86400)} days`;
  if (y < 1e4) return `${comma(y)} years`;
  if (y < 1e6) return `${comma(Math.round(y / 1000) * 1000)} years`;
  if (y < 1e9) return `${Math.round(y / 1e6)} million years`;
  return `${(y / 1e9).toFixed(y < 1e10 ? 2 : 1)} billion years`;
}

const EPOCHS = [
  [6, 'Inflation', 'Space balloons by 10²⁶ times in a split second'],
  [19, 'Quark soup', 'Too hot for protons: quarks and gluons roam free'],
  [33.5, 'Protons and neutrons', 'Quarks have clumped in threes'],
  [40, 'The first nuclei', 'Protons and neutrons fuse into helium'],
  [51.6, 'Glowing fog', 'Light bounces off free electrons and can’t get far'],
  [53, 'First light', 'Atoms form, the fog clears, and light flies free'],
  [61.5, 'The dark ages', 'Cooling hydrogen gas and no stars yet'],
  [67, 'Cosmic dawn', 'The first stars and galaxies light up'],
  [81.3, 'Galaxies grow', 'Galaxies merge and grow while space keeps stretching'],
  [82.6, 'The Sun is born', 'Our solar system forms, 9.2 billion years in'],
  [87.4, 'Galaxies grow', 'Dark energy has started to speed the expansion up'],
  [88.6, 'Today', 'Space is still stretching, and ever faster'],
  [101, 'The far future', 'Dark energy pushes the galaxies ever faster apart'],
];
const epochOf = (x) => EPOCHS.find((e) => x < e[0]) ?? EPOCHS[EPOCHS.length - 1];

/** Rough colour of a blackbody at temperature T (kelvin). */
function bb(T) {
  const t = clamp(T, 1000, 40000) / 100;
  let r, g, b;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * (t - 60) ** -0.1332;
    g = 288.12 * (t - 60) ** -0.0755;
    b = 255;
  }
  return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
}
/** Visible colour of a wavelength in nm (dim red beyond 700 nm: infrared). */
function waveColor(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) [r, g, b] = [(440 - nm) / 60, 0, 1];
  else if (nm < 490) [r, g, b] = [0, (nm - 440) / 50, 1];
  else if (nm < 510) [r, g, b] = [0, 1, (510 - nm) / 20];
  else if (nm < 580) [r, g, b] = [(nm - 510) / 70, 1, 0];
  else if (nm < 645) [r, g, b] = [1, (645 - nm) / 65, 0];
  else [r, g, b] = [1, 0, 0];
  const f = nm > 700 ? clamp(1 - (nm - 700) / 900, 0.35, 1) : 1;
  return `rgb(${Math.round(255 * r * f)},${Math.round(255 * g * f + (nm > 700 ? 30 : 0))},${Math.round(255 * b * f + (nm > 700 ? 30 : 0))})`;
}

function hash(i, j, k) {
  let h = (i * 374761393 + j * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function galaxyIn(i, j) {
  if (i === 0 && j === 0) return { x: 0.5, y: 0.5, size: 10, form: 0.35, spiral: true, ang: 0.5, pv: 0 };
  if (hash(i, j, 1) > 0.8) return null;
  return {
    x: 0.12 + 0.76 * hash(i, j, 2),
    y: 0.12 + 0.76 * hash(i, j, 3),
    size: 3.5 + 7.5 * hash(i, j, 4) ** 1.6,
    form: 0.18 + 1.6 * hash(i, j, 5) ** 2,
    spiral: hash(i, j, 6) < 0.65,
    ang: hash(i, j, 7) * Math.PI,
    pv: hash(i, j, 8) - 0.5,
  };
}

// A field of smooth noise, as an RGBA texture: brighter and darker patches (the density ripples).
function noiseTexture(seed, W, H, power = 1, tint = [255, 255, 255]) {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const img = g.createImageData(W, H);
  const oct = [[6, 0.5], [12, 0.3], [24, 0.2]];
  const grids = oct.map(([n], o) => Array.from({ length: (n + 1) * (n + 1) }, (_, k) => hash(k, o, seed) * 2 - 1));
  const sm = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = 0;
      oct.forEach(([n, amp], o) => {
        const gx = (x / W) * n, gy = (y / H) * n * (H / W) * 1.6;
        const ix = Math.floor(gx) % n, iy = Math.floor(gy) % n;
        const fx = sm(gx - Math.floor(gx)), fy = sm(gy - Math.floor(gy));
        const G = grids[o], at = (a, b) => G[(b % n) * (n + 1) + (a % n)];
        v += amp * lerp(lerp(at(ix, iy), at(ix + 1, iy), fx), lerp(at(ix, iy + 1), at(ix + 1, iy + 1), fx), fy);
      });
      v = Math.sign(v) * Math.abs(v) ** power;
      const p = (y * W + x) * 4;
      if (v > 0) [img.data[p], img.data[p + 1], img.data[p + 2]] = tint;
      img.data[p + 3] = clamp(Math.abs(v) * 2.2, 0, 1) * 255;
    }
  }
  g.putImageData(img, 0, 0);
  return cv;
}

export default {
  id: 'expanding-universe',
  title: 'The Expanding Universe',
  category: 'astronomy',
  tagline: 'Space is stretching. Run the clock back 13.8 billion years to the Big Bang.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Space', 'Cosmology', 'Light'],
  keywords: ['big bang', 'expanding universe', 'hubble law', 'redshift', 'cosmic microwave background', 'CMB', 'inflation', 'dark energy', 'scale factor', 'nucleosynthesis', 'recombination', 'dark ages', 'first stars', 'age of the universe', 'cosmology'],
  blurb:
    'Every distant galaxy is moving away from us, and the farther it is, the faster it goes. That is not because we are at the centre: space itself is stretching, carrying galaxies apart. Run the clock backwards and everything crowds together, heats up and glows, until 13.8 billion years ago the whole universe was a hot, dense soup. This is the Big Bang, and it happened everywhere at once.',
  ideas: [
    'Space itself expands, carrying galaxies apart; galaxies held together by gravity keep their size.',
    '<b>Hubble’s law</b>: a galaxy twice as far away recedes twice as fast (v = H₀ × d).',
    'Light crossing stretching space is stretched too: <b>redshift</b> tells us how much the universe has grown since the light left.',
    'Going back in time the universe gets denser and <b>hotter</b>: T = 2.7 K ÷ (size relative to today).',
    'Atoms formed 380,000 years in. The light released then still fills the sky: the <b>cosmic microwave background</b>.',
    'Since about 5 billion years ago, <b>dark energy</b> has been speeding the expansion up.',
  ],
  hint: 'Drag the timeline or tap a galaxy to ride on it',
  thumbChapter: 5,
  thumbFrames: 240,
  params: [
    { key: 'clock', label: 'Time since the Big Bang', type: 'range', min: 0, max: 100, step: 0.1, value: TODAY, format: (v) => fmtTime(yearsOf(v)) },
    {
      key: 'run', label: 'Clock', type: 'select', value: 'pause',
      options: [{ value: 'pause', label: 'Stopped' }, { value: 'forward', label: '▶ Forwards' }, { value: 'back', label: '◀ Backwards' }],
    },
    { key: 'speed', label: 'Clock speed', type: 'range', min: 0.1, max: 4, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'grid', label: 'Show the stretching grid', type: 'toggle', value: true },
    { key: 'arrows', label: 'Show speeds (from your galaxy)', type: 'toggle', value: false },
    { key: 'hubble', label: 'Speed vs distance plot', type: 'toggle', value: false },
    { key: 'light', label: 'Send a light ray', type: 'button', action: (s) => s.sendLight() },
    { key: 'home', label: 'Back to the Milky Way', type: 'button', action: (s) => s.goHome() },
  ],
  story: [
    {
      title: 'Galaxies flying apart',
      text: 'Each glow is a galaxy, drawn far bigger than life, and ours is in the middle. The clock runs from 8 billion years after the Big Bang to today. Every galaxy drifts away from us, and the farther ones move faster. They aren’t flying through space: <b>space itself is stretching</b>, carrying them along like dots on the grid.',
      params: { clock: 80, run: 'forward', speed: 0.6, grid: true, arrows: true, hubble: false },
      enter: (s) => s.reset(),
      duration: 14,
    },
    {
      title: 'No centre',
      text: 'Does that put us at the centre? We have just hopped to another galaxy. From here, too, everything recedes, faster the farther away. Every galaxy sees the same thing, so there is no centre. Tap any galaxy to ride on it yourself.',
      params: { clock: 82, run: 'forward', speed: 0.6, grid: true, arrows: true, hubble: false },
      enter: (s) => s.hop(),
      duration: 14,
    },
    {
      title: 'Hubble’s law',
      text: 'In 1929 Edwin Hubble, building on the work of Henrietta Leavitt and Vesto Slipher, found that galaxies recede at speeds proportional to their distance. The plot shows it: a straight line. Today the universe grows by about 21 km/s for every million light-years of distance.',
      formula: 'speed = H₀ × distance',
      check: {
        q: 'Galaxy B is three times farther away than galaxy A. How fast does B recede?',
        options: ['Three times as fast as A', 'The same speed as A', 'Nine times as fast as A'],
        answer: 0,
        setup: { clock: 86, run: 'pause', grid: true, arrows: true, hubble: true },
        explain: 'Stretching space makes every distance grow by the same percentage each year. Three times the distance grows three times as much, so it recedes three times as fast. Far enough away, galaxies recede faster than light: nothing breaks the speed limit, because it is space that grows.',
      },
      params: { clock: 84, run: 'forward', speed: 0.5, grid: true, arrows: true, hubble: true },
      enter: (s) => s.goHome(),
      duration: 15,
    },
    {
      title: 'Stretched light',
      text: 'A galaxy sends out violet light 2.4 billion years after the Big Bang. While the light crosses the stretching space, its waves stretch too. When it reaches us today the universe is 3.7 times bigger, and so is every wave, so it arrives as infrared. This is <b>redshift</b>, and it is why the James Webb Space Telescope looks in infrared to find the first galaxies.',
      formula: 'stretch = 1 + z = size now ÷ size then',
      params: { clock: 72, run: 'forward', speed: 0.8, grid: true, arrows: false, hubble: false },
      tween: 0.3,
      enter: (s) => {
        s.goHome();
        s.sendLight(72);
      },
      duration: 18,
    },
    {
      title: 'Run the clock back',
      text: 'Now play the film backwards. Galaxies crowd together and shrink to young blue specks, then vanish. Before about 200 million years there were none, only the first stars. Before them came the dark ages, when there was cool gas but no light. Further back, everything is squeezed closer, denser and hotter.',
      check: {
        q: 'As we rewind, every galaxy crowds closer to every other. So where did the Big Bang happen?',
        options: ['Everywhere at once', 'At one point near the Milky Way', 'At the edge of the universe'],
        answer: 0,
        setup: { clock: TODAY, run: 'pause', grid: true, arrows: false, hubble: false },
        explain: 'All of space was squeezed together, not just one region. The Big Bang was not an explosion at a point that matter flew out from. It was a hot, dense state that filled all of space, and space has been stretching everywhere ever since.',
      },
      params: { clock: TODAY, run: 'back', speed: 1.3, grid: true, arrows: false, hubble: false },
      enter: (s) => {
        s.goHome();
        s.clearLight();
        s.stopAt(50.4);
      },
      duration: 20,
    },
    {
      title: 'The first light',
      text: 'For its first 380,000 years the universe was a glowing fog of nuclei and electrons, as hot as the Sun’s surface or hotter. Light kept bouncing off the free electrons, and sound waves rippled through the fog. Once it cooled to about 3,000 K (2,700 °C), electrons joined nuclei to make atoms and the fog cleared. That light is still all around us, now stretched 1,100 times into microwaves: the <b>cosmic microwave background</b>.',
      formula: 'temperature = 2.7 K ÷ (size relative to today)',
      check: {
        q: 'Why does this afterglow come at us from every direction in the sky?',
        options: ['The whole universe was glowing, everywhere at once', 'It comes from the Milky Way’s centre', 'Stars give out microwaves'],
        answer: 0,
        setup: { clock: 50.8, run: 'pause', grid: false, arrows: false, hubble: false },
        explain: 'Every part of space was glowing when the fog cleared. Wherever we look far enough, we see light from that moment, arriving only now. Its faint hot and cold spots are the ripples you saw, and they are the seeds that later grew into galaxies.',
      },
      params: { clock: 50.8, run: 'forward', speed: 0.14, grid: false, arrows: false, hubble: false },
      tween: 0.6,
      enter: (s) => s.stopAt(55),
      duration: 20,
    },
    {
      title: 'The first three minutes',
      text: 'One second after the Big Bang it was 10 billion degrees. Protons (red) and neutrons (grey) were too hot to stick together. In the next few minutes it cooled enough for them to fuse. Almost every neutron ended up in helium, until the universe was too cold and thin for fusion: about 75 % hydrogen and 25 % helium by mass, just what we measure in the oldest stars.',
      params: { clock: 32.5, run: 'forward', speed: 0.3, grid: false, arrows: false, hubble: false },
      tween: 0.6,
      enter: (s) => s.stopAt(40.5),
      duration: 17,
    },
    {
      title: 'Back to the very beginning',
      text: 'Rewind further. A millionth of a second in, it is too hot even for protons: they melt into a soup of quarks and gluons. Further back still comes <b>inflation</b>, when space grew 10²⁶ times larger in far less than a blink, stretching tiny quantum jitters into the ripples that later seeded galaxies. What came before that, or whether “before” means anything, nobody yet knows.',
      params: { clock: 23, run: 'back', speed: 0.6, grid: false, arrows: false, hubble: false },
      tween: 0.6,
      enter: (s) => s.stopAt(0),
      duration: 22,
    },
    {
      title: 'The future',
      text: 'Now run forwards from today. About 5 billion years ago <b>dark energy</b> took over and the expansion began to speed up. Galaxies held by gravity, like the Milky Way and Andromeda, stay together. Everything else races away, and in time distant galaxies will fade beyond our view.',
      params: { clock: TODAY, run: 'forward', speed: 0.8, grid: true, arrows: true, hubble: false },
      tween: 0.8,
      enter: (s) => {
        s.goHome();
        s.clearLight();
        s.stopAt(100);
      },
      duration: 15,
    },
    {
      title: 'Your turn',
      text: 'Drag the timeline to any moment, run the clock either way, send light rays, and tap galaxies to ride on them.',
      params: { clock: TODAY, run: 'pause', speed: 1, grid: true, arrows: false, hubble: true },
      enter: (s) => s.goHome(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let home = { x: 0, y: 0 }, homeTo = { x: 0, y: 0 }, hopped = false;
    let stop = null, light = null, drag = false;
    let drawn = [], shift = 0;
    let tex = null;

    // early-universe particles, in unit coordinates
    const P = () => ({ x: Math.random(), y: Math.random(), vx: Math.random() - 0.5, vy: Math.random() - 0.5 });
    const nucleons = Array.from({ length: 128 }, (_, i) => ({ ...P(), p: i < 32 ? i % 4 < 2 : true, g: i < 32 ? i >> 2 : -1, k: i % 4 }));
    const quarks = [];
    nucleons.forEach((n, i) => {
      const kinds = n.p ? ['u', 'u', 'd'] : ['u', 'd', 'd'];
      kinds.forEach((q, k) => quarks.push({ ...P(), n: i, k, q, col: ['#ff3d5a', '#38e070', '#3d8bff'][(k + i) % 3] }));
    });
    const protonIdx = nucleons.map((n, i) => (n.p ? i : -1)).filter((i) => i >= 0);
    const electrons = protonIdx.map((n) => ({ ...P(), n, ph: Math.random() * TAU }));
    const photons = Array.from({ length: 70 }, () => ({ ...P(), ang: Math.random() * TAU }));
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), on: 60.3 + Math.random() * 4, tw: Math.random() * TAU }));

    const geom = () => {
      const { w, h } = api;
      const phone = w < 760;
      const cell = clamp(Math.min(w, h) / 6.5, 64, 135);
      return { phone, cell, pxg: cell / 1.3, cx: w * (0.5 - (w >= h ? 0.23 * shift : 0) - (phone && params.hubble && params.clock > 68 ? 0.22 : 0)), cy: (phone ? h * 0.56 : h * 0.55) + (w < h ? h * 0.16 * shift : 0), tlY: phone ? 120 : 140, tl0: phone ? 20 : 40, tl1: w - (phone ? 20 : 40) };
    };
    const clockX = (g, x) => g.tl0 + ((g.tl1 - g.tl0) * x) / 100;

    function ensureTex() {
      if (tex) return;
      tex = {
        a: noiseTexture(11, 200, 125),
        b: noiseTexture(23, 200, 125),
        gas: noiseTexture(37, 160, 100, 2.2, [150, 90, 60]),
        inf: noiseTexture(51, 200, 125, 1, [190, 150, 255]),
      };
    }

    function wrapD(d) {
      return d - Math.round(d);
    }
    function nucleonPos(i, bindHe) {
      const n = nucleons[i];
      if (n.g < 0 || bindHe <= 0) return n;
      const lead = nucleons[n.g * 4];
      const off = [[-0.005, -0.006], [0.005, 0.006], [0.006, -0.005], [-0.006, 0.005]][n.k];
      const tx = lead.x + off[0], ty = lead.y + off[1];
      return { x: n.x + wrapD(tx - n.x) * bindHe, y: n.y + wrapD(ty - n.y) * bindHe };
    }

    function photonState(x) {
      if (!light) return null;
      const t = yearsOf(x) / 1e9;
      if (t < light.te - 1e-6) return null;
      const a = aOfX(x), trav = chi(light.ae, a);
      return { a, trav, done: trav >= light.chiTot, stretch: a / light.ae };
    }

    const sim = {
      reset() {
        home = { x: 0, y: 0 };
        homeTo = { x: 0, y: 0 };
        hopped = false;
        light = null;
        stop = null;
      },
      goHome() {
        homeTo = { x: 0, y: 0 };
        hopped = false;
      },
      hop() {
        const g = geom();
        for (const [i, j] of [[2, -1], [3, -1], [2, 1], [-2, -1], [3, 0], [2, 0]]) {
          const gal = galaxyIn(i, j);
          if (gal && gal.form < 1.2) {
            homeTo = { x: (i + gal.x - 0.5) * g.cell, y: (j + gal.y - 0.5) * g.cell };
            hopped = true;
            return;
          }
        }
      },
      stopAt(x) {
        stop = x;
      },
      clearLight() {
        light = null;
      },
      sendLight(atX) {
        const g = geom();
        const x = atX ?? params.clock;
        if (x < 62) {
          light = null; // no galaxies to shine yet
          return;
        }
        const te = yearsOf(x) / 1e9, ae = aOfX(x);
        const arrive = x < TODAY - 4 ? 1 : aOfX(100);
        const chiTot = Math.max(0.05, chi(ae, arrive));
        const dir = api.w >= api.h ? { x: 1, y: 0 } : { x: 0, y: -1 };
        if (atX !== undefined) shift = 1;
        light = { te, ae, chiTot, dir, sx: homeTo.x + dir.x * chiTot * g.pxg, sy: homeTo.y + dir.y * chiTot * g.pxg };
      },
      onParam(k) {
        if (k === 'run') stop = null;
      },
      pointerDown(p) {
        const g = geom();
        if (Math.abs(p.y - g.tlY) < 22 && p.x > g.tl0 - 12 && p.x < g.tl1 + 12) {
          drag = true;
          this.pointerMove(p);
          return;
        }
        let best = null, bd = 30;
        for (const d of drawn) {
          const dd = Math.hypot(d.sx - p.x, d.sy - p.y);
          if (dd < bd) [best, bd] = [d, dd];
        }
        if (best) {
          homeTo = { x: best.gx, y: best.gy };
          hopped = best.gx !== 0 || best.gy !== 0;
        }
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        const g = geom();
        if (params.run !== 'pause') api.runner.set('run', 'pause');
        api.runner.set('clock', Math.round(clamp(((p.x - g.tl0) / (g.tl1 - g.tl0)) * 100, 0, 100) * 10) / 10);
      },
      pointerUp() {
        drag = false;
      },
      update(dt) {
        // the clock
        if (params.run !== 'pause' && !api.runner.tweens?.has('clock')) {
          const dir = params.run === 'forward' ? 1 : -1;
          const target = stop ?? (dir > 0 ? (params.clock < TODAY - 1e-6 ? TODAY : 100) : 0);
          let x = params.clock + dir * dt * 1.6 * params.speed;
          let done = false;
          if ((dir > 0 && x >= target && params.clock <= target + 1e-9) || (dir < 0 && x <= target && params.clock >= target - 1e-9)) {
            x = target;
            done = true;
          }
          x = clamp(x, 0, 100);
          api.runner.params.clock = x;
          api.runner.onParamChange?.('clock', x);
          if (done || x <= 0 || x >= 100) {
            stop = null;
            api.runner.set('run', 'pause');
          }
        }
        const k = 1 - Math.exp(-dt * 2.2);
        shift += ((light ? 1 : 0) - shift) * k;
        home.x += (homeTo.x - home.x) * k;
        home.y += (homeTo.y - home.y) * k;

        // particles jiggle faster when hotter
        const x = params.clock;
        if (x < 56) {
          const T = 2.725 / aOfX(x);
          const sp = 0.03 + 0.12 * clamp((Math.log10(T) - 3.4) / 9, 0, 1);
          const move = (o, s, kick) => {
            o.vx += (Math.random() - 0.5) * kick * dt;
            o.vy += (Math.random() - 0.5) * kick * dt;
            const v = Math.hypot(o.vx, o.vy) || 1;
            o.x = (o.x + (o.vx / v) * s * dt + 1) % 1;
            o.y = (o.y + (o.vy / v) * s * dt * (api.w / api.h) + 1) % 1;
          };
          for (const n of nucleons) move(n, sp, 6);
          for (const q of quarks) move(q, sp * 1.6, 14);
          for (const e of electrons) {
            move(e, sp * 3, 18);
            e.ph += dt * 6;
          }
          const scatter = x < 52;
          for (const ph of photons) {
            if (scatter && Math.random() < dt * 5) ph.ang = Math.random() * TAU;
            ph.x = (ph.x + Math.cos(ph.ang) * 0.35 * dt + 1) % 1;
            ph.y = (ph.y + Math.sin(ph.ang) * 0.35 * dt * (api.w / api.h) + 1) % 1;
          }
        }
      },
      draw() {
        ensureTex();
        const { w, h } = api;
        const g = geom();
        const x = params.clock;
        const a = aOfX(x), T = 2.725 / a, tG = yearsOf(x) / 1e9;
        ctx.fillStyle = '#020309';
        ctx.fillRect(0, 0, w, h);
        drawn = [];

        // ---------------------------------------------------------------- the hot early universe
        const fog = 1 - smoothstep(51.4, 52.6, x);
        if (fog > 0) {
          const [r, gg, b] = bb(T);
          const dim = 0.62 + 0.25 * smoothstep(51, 30, x);
          ctx.globalAlpha = fog;
          ctx.fillStyle = `rgb(${r * dim},${gg * dim},${b * dim})`;
          ctx.fillRect(0, 0, w, h);
          // the fog rings with sound waves: two ripple patterns trading places
          const osc = 0.5 + 0.5 * Math.sin(api.time * 1.3);
          ctx.globalAlpha = fog * 0.32 * osc;
          ctx.drawImage(tex.a, 0, 0, w, h);
          ctx.globalAlpha = fog * 0.32 * (1 - osc);
          ctx.drawImage(tex.b, 0, 0, w, h);
          ctx.globalAlpha = 1;
        }
        // afterglow, reddening into the microwaves
        const after = smoothstep(51.4, 52.6, x) * (1 - smoothstep(52.6, 57, x));
        if (after > 0) {
          ctx.globalAlpha = after * 0.5;
          ctx.fillStyle = '#5a1a0c';
          ctx.fillRect(0, 0, w, h);
          ctx.globalAlpha = after * 0.3;
          ctx.drawImage(tex.a, 0, 0, w, h);
          ctx.globalAlpha = 1;
        }
        // inflation: space blowing up, with quantum ripples frozen in
        const inf = 1 - smoothstep(5.4, 6.4, x);
        if (inf > 0) {
          ctx.globalAlpha = inf;
          ctx.fillStyle = '#120a26';
          ctx.fillRect(0, 0, w, h);
          ctx.globalAlpha = inf * 0.5 * smoothstep(0.5, 5, x);
          ctx.drawImage(tex.inf, 0, 0, w, h);
          const ph = (x * 1.4) % 1;
          for (let L = 0; L < 2; L++) {
            const s = 14 * 6 ** (ph + L);
            const al = inf * 0.35 * (L === 0 ? ph : 1 - ph * 0.6) * clamp((s - 6) / 30, 0, 1);
            if (al <= 0.01 || s > Math.max(w, h)) continue;
            ctx.globalAlpha = al;
            ctx.strokeStyle = '#c8b4ff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let X = g.cx % s; X < w; X += s) {
              ctx.moveTo(X, 0);
              ctx.lineTo(X, h);
            }
            for (let Y = g.cy % s; Y < h; Y += s) {
              ctx.moveTo(0, Y);
              ctx.lineTo(w, Y);
            }
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        const flash = Math.exp(-(((x - 6) / 0.45) ** 2));
        if (flash > 0.02) {
          ctx.globalAlpha = flash * 0.85;
          ctx.fillStyle = '#f4f0ff';
          ctx.fillRect(0, 0, w, h);
          ctx.globalAlpha = 1;
        }

        // particles
        const pa = smoothstep(5.8, 7.5, x) * (1 - smoothstep(52.6, 55.5, x));
        if (pa > 0) {
          const bindQ = smoothstep(17.5, 20, x), qa = 1 - smoothstep(21, 24, x), na = smoothstep(18.5, 20.5, x);
          const bindHe = smoothstep(34, 38, x), atoms = smoothstep(51.6, 52.6, x);
          const R = clamp(Math.min(w, h) / 110, 4.5, 7.5);
          ctx.globalAlpha = pa;
          // photons
          ctx.lineCap = 'round';
          for (const ph of photons) {
            const X = ph.x * w, Y = ph.y * h, L = 9;
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(X, Y);
            ctx.lineTo(X - Math.cos(ph.ang) * L, Y - Math.sin(ph.ang) * L);
            ctx.stroke();
            ctx.strokeStyle = '#fff3b0';
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
          // quarks
          if (qa > 0) {
            ctx.globalAlpha = pa * qa;
            for (const q of quarks) {
              const n = nucleonPos(q.n, 0);
              const off = (TAU * q.k) / 3 + q.n;
              const tx = n.x + (Math.cos(off) * R * 0.75) / w, ty = n.y + (Math.sin(off) * R * 0.75) / h;
              const X = (q.x + wrapD(tx - q.x) * bindQ) * w, Y = (q.y + wrapD(ty - q.y) * bindQ) * h;
              ctx.fillStyle = 'rgba(0,0,0,0.55)';
              ctx.beginPath();
              ctx.arc(X, Y, 3.6, 0, TAU);
              ctx.fill();
              ctx.fillStyle = q.col;
              ctx.beginPath();
              ctx.arc(X, Y, 2.6, 0, TAU);
              ctx.fill();
            }
          }
          // nucleons
          if (na > 0) {
            ctx.globalAlpha = pa * na;
            nucleons.forEach((n, i) => {
              const q = nucleonPos(i, bindHe);
              const X = q.x * w, Y = q.y * h;
              ctx.fillStyle = n.p ? '#e8483c' : '#9aa3b5';
              ctx.strokeStyle = 'rgba(0,0,0,0.55)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(X, Y, R, 0, TAU);
              ctx.fill();
              ctx.stroke();
            });
          }
          // electrons: free, then captured into atoms
          ctx.globalAlpha = pa;
          electrons.forEach((e, k) => {
            const n = nucleonPos(e.n, bindHe);
            const rr = R * 2.4 + (nucleons[e.n].g >= 0 ? 2 : 0);
            const ox = n.x + (Math.cos(e.ph + k) * rr) / w, oy = n.y + (Math.sin(e.ph + k) * rr) / h;
            const X = (e.x + wrapD(ox - e.x) * atoms) * w, Y = (e.y + wrapD(oy - e.y) * atoms) * h;
            if (atoms > 0.5 && (nucleons[e.n].g < 0 || nucleons[e.n].k === 0)) {
              ctx.strokeStyle = `rgba(140,190,255,${0.35 * atoms})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(n.x * w, n.y * h, rr, 0, TAU);
              ctx.stroke();
            }
            ctx.fillStyle = '#0d1a3a';
            ctx.beginPath();
            ctx.arc(X, Y, 2.6, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#5fb2ff';
            ctx.beginPath();
            ctx.arc(X, Y, 1.7, 0, TAU);
            ctx.fill();
          });
          ctx.globalAlpha = 1;
        }

        // ---------------------------------------------------------------- dark ages and cosmic dawn
        const gas = smoothstep(52.6, 55, x) * (1 - smoothstep(64, 70, x));
        if (gas > 0) {
          ctx.globalAlpha = gas * 0.55;
          ctx.drawImage(tex.gas, 0, 0, w, h);
          ctx.globalAlpha = 1;
        }
        const starA = 1 - smoothstep(67, 72, x);
        if (x > 60 && starA > 0) {
          ctx.globalCompositeOperation = 'lighter';
          for (const s of stars) {
            const on = smoothstep(s.on, s.on + 0.6, x);
            if (on <= 0) continue;
            drawGlow(ctx, s.x * w, s.y * h, 7 + 4 * Math.sin(api.time * 3 + s.tw), '#9fc6ff', 0.3 * on * starA + 0.05);
          }
          ctx.globalCompositeOperation = 'source-over';
        }

        // ---------------------------------------------------------------- galaxies on stretching space
        if (x > 61) {
          const S = a, cell = g.cell;
          const xmin = home.x - (g.cx + 40) / S, xmax = home.x + (w - g.cx + 40) / S;
          const ymin = home.y - (g.cy + 40) / S, ymax = home.y + (h - g.cy + 40) / S;
          const i0 = Math.floor(xmin / cell), i1 = Math.floor(xmax / cell), j0 = Math.floor(ymin / cell), j1 = Math.floor(ymax / cell);
          const cells = (i1 - i0 + 1) * (j1 - j0 + 1);
          const few = cells < 1600;
          const fieldA = smoothstep(61, 66, x);

          if (params.grid) {
            const sp = cell * 2 * S;
            const ga = fieldA * 0.14 * clamp((sp - 10) / 40, 0, 1);
            if (ga > 0.005) {
              ctx.strokeStyle = `rgba(120,160,255,${ga})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              const ox = g.cx - home.x * S, oy = g.cy - home.y * S;
              for (let X = ((ox % sp) + sp) % sp; X < w; X += sp) {
                ctx.moveTo(X, 0);
                ctx.lineTo(X, h);
              }
              for (let Y = ((oy % sp) + sp) % sp; Y < h; Y += sp) {
                ctx.moveTo(0, Y);
                ctx.lineTo(w, Y);
              }
              ctx.stroke();
            }
          }

          const H = Hof(a), hr = H / H0;
          ctx.globalCompositeOperation = 'lighter';
          for (let i = i0; i <= i1; i++) {
            for (let j = j0; j <= j1; j++) {
              const gal = galaxyIn(i, j);
              if (!gal) continue;
              const b = smoothstep(gal.form, gal.form + 0.7, tG) * fieldA;
              if (b <= 0.02) continue;
              const gx = (i + gal.x - 0.5) * cell, gy = (j + gal.y - 0.5) * cell;
              const sx = g.cx + (gx - home.x) * S, sy = g.cy + (gy - home.y) * S;
              if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30) continue;
              const age = tG - gal.form;
              const r = gal.size * (0.4 + 0.6 * smoothstep(0, 3, age));
              const col = age < 1.5 ? '#8fb8ff' : gal.spiral ? '#dfe7ff' : '#ffd6a0';
              if (few) {
                drawGlow(ctx, sx, sy, r * 2.6, col, 0.22 * b + 0.02);
                drawn.push({ sx, sy, gx, gy, b, r, gal, pv: gal.pv });
              } else {
                ctx.fillStyle = col;
                ctx.globalAlpha = b * 0.55;
                ctx.fillRect(sx - 1, sy - 1, 2, 2);
                ctx.globalAlpha = 1;
              }
            }
          }
          ctx.globalCompositeOperation = 'source-over';
          // discs for the nearer, larger galaxies
          if (few) {
            for (const { sx, sy, b, r, gal } of drawn) {
              const d = { sx, sy, b };
              ctx.fillStyle = `rgba(255,255,255,${0.55 * d.b})`;
              ctx.beginPath();
              ctx.ellipse(d.sx, d.sy, r * 0.75, r * (gal.spiral ? 0.32 : 0.55), gal.ang, 0, TAU);
              ctx.fill();
            }
          }
          // Andromeda: bound to the Milky Way, so it does not drift with the stretching
          const mw = { x: g.cx + (0 - home.x) * S, y: g.cy + (0 - home.y) * S };
          const andro = smoothstep(0.6, 1.4, tG) * fieldA;
          if (andro > 0 && few) {
            const ax = mw.x + 30, ay = mw.y - 22;
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, ax, ay, 18, '#dfe7ff', 0.2 * andro);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = `rgba(255,255,255,${0.5 * andro})`;
            ctx.beginPath();
            ctx.ellipse(ax, ay, 6, 2.4, -0.6, 0, TAU);
            ctx.fill();
            if (x > TODAY + 2 && !hopped) tag(ctx, 'Andromeda: held by gravity', ax + 12, ay - 14, C.dim, { size: 10 });
          }

          // speed arrows from home
          if (params.arrows && few) {
            ctx.strokeStyle = 'rgba(110,220,255,0.75)';
            ctx.fillStyle = 'rgba(110,220,255,0.75)';
            ctx.lineWidth = 1.6;
            for (const d of drawn) {
              const dx = d.sx - g.cx, dy = d.sy - g.cy, dist = Math.hypot(dx, dy);
              if (dist < 24 || d.b < 0.4) continue;
              const L = Math.min(70, dist * hr * 0.16);
              const ux = dx / dist, uy = dy / dist;
              const x0 = d.sx + ux * 9, y0 = d.sy + uy * 9, x1 = x0 + ux * L, y1 = y0 + uy * L;
              ctx.beginPath();
              ctx.moveTo(x0, y0);
              ctx.lineTo(x1, y1);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(x1 + ux * 5, y1 + uy * 5);
              ctx.lineTo(x1 - uy * 3.5, y1 + ux * 3.5);
              ctx.lineTo(x1 + uy * 3.5, y1 - ux * 3.5);
              ctx.fill();
            }
          }

          // home marker
          if (fieldA > 0.3) {
            ctx.strokeStyle = 'rgba(255,214,102,0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(g.cx, g.cy, 17, 0, TAU);
            ctx.stroke();
            const atMW = Math.hypot(home.x, home.y) < 2;
            tag(ctx, atMW ? (x > 81.5 ? 'Milky Way (you)' : 'Milky Way') : 'Your new home', g.cx, g.cy + 32, C.amber, { align: 'center', size: 10 });
          }

          // a light ray crossing stretching space
          const ps = photonState(x);
          if (light && ps && fieldA > 0.5) {
            const { dir } = light;
            const srcX = g.cx + (light.sx - home.x) * S, srcY = g.cy + (light.sy - home.y) * S;
            const travPx = Math.min(ps.trav, light.chiTot) * g.pxg;
            const hx = g.cx + (light.sx - dir.x * travPx - home.x) * S, hy = g.cy + (light.sy - dir.y * travPx - home.y) * S;
            ctx.strokeStyle = 'rgba(255,214,102,0.7)';
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.arc(srcX, srcY, 15, 0, TAU);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, srcX, srcY, 22, '#8fb8ff', 0.25);
            ctx.globalCompositeOperation = 'source-over';
            if (srcX > -20 && srcX < w + 20 && srcY > -20 && srcY < h + 20) tag(ctx, 'light leaves here', srcX, srcY - 26, C.dim, { align: 'center', size: 10 });
            const nm = 380 * ps.stretch;
            const lam = 9 * ps.stretch;
            const span = Math.min(Math.hypot(srcX - hx, srcY - hy), lam * 6);
            const col = waveColor(nm);
            ctx.strokeStyle = col;
            ctx.lineWidth = 2.4;
            ctx.shadowColor = col;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            for (let s = 0; s <= span; s += 1.5) {
              const amp = 7 * Math.min(1, s / 10, (span - s) / 10 + 0.3);
              const off = Math.sin((s / lam) * TAU - api.time * 6) * amp;
              const X = hx + dir.x * s - dir.y * off, Y = hy + dir.y * s + dir.x * off;
              ctx[s ? 'lineTo' : 'moveTo'](X, Y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            const band = nm < 450 ? 'violet' : nm < 495 ? 'blue' : nm < 570 ? 'green' : nm < 590 ? 'yellow' : nm < 700 ? 'red' : 'infrared';
            const lx = dir.x ? clamp(hx + 30, 60, w - 200) : clamp(hx + 14, 20, w - 150), ly = clamp(hy + (dir.x ? -24 : 26), g.phone ? 240 : 230, h - 30);
            tag(ctx, ps.done ? `arrived: stretched ${ps.stretch.toFixed(1)}×, now ${band}` : `${Math.round(nm)} nm (${band}) · stretched ${ps.stretch.toFixed(2)}×`, lx, ly, col, { align: 'left', size: g.phone ? 10 : 11 });
          }

          // Hubble's law panel
          if (params.hubble && few && x > 68) {
            const W = g.phone ? w * 0.54 : 300, Hh = g.phone ? 112 : 190;
            const X0 = g.phone ? w - W - 10 : w - W - 16, Y0 = g.phone ? h - Hh - 50 : h - Hh - 24;
            ctx.fillStyle = 'rgba(8,11,24,0.86)';
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            roundRect(ctx, X0, Y0, W, Hh, 12);
            ctx.fill();
            ctx.stroke();
            const px0 = X0 + 44, px1 = X0 + W - 14, py0 = Y0 + 30, py1 = Y0 + Hh - 28;
            const Dmax = (Math.min(w, h) * 0.55) / g.pxg, Vmax = H0 * Dmax * CKMS * 1.6;
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.beginPath();
            ctx.moveTo(px0, py0);
            ctx.lineTo(px0, py1);
            ctx.lineTo(px1, py1);
            ctx.stroke();
            ctx.save();
            ctx.beginPath();
            ctx.rect(px0, py0, px1 - px0, py1 - py0);
            ctx.clip();
            ctx.strokeStyle = 'rgba(255,214,102,0.7)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(px0, py1);
            ctx.lineTo(px1, py1 - ((H * Dmax * CKMS) / Vmax) * (py1 - py0));
            ctx.stroke();
            ctx.setLineDash([]);
            for (const d of drawn) {
              const D = Math.hypot(d.sx - g.cx, d.sy - g.cy) / g.pxg;
              if (D < 0.02 || d.b < 0.4) continue;
              const v = H * D * CKMS + d.pv * 3000;
              ctx.fillStyle = '#7fd8ff';
              ctx.beginPath();
              ctx.arc(px0 + (D / Dmax) * (px1 - px0), py1 - (v / Vmax) * (py1 - py0), 2.6, 0, TAU);
              ctx.fill();
            }
            ctx.restore();
            text(ctx, g.phone ? 'Speed vs distance' : 'Speed away vs distance', X0 + 14, Y0 + 15, { size: g.phone ? 10 : 11, weight: 600, color: C.dim });
            if (!g.phone) text(ctx, `${(H * 977.8 / 3.2616).toFixed(1)} km/s per million ly`, X0 + W - 12, Y0 + 15, { size: 10, align: 'right', color: C.amber, mono: true });
            text(ctx, 'distance →', px1, py1 + 13, { size: 10, align: 'right', color: 'rgba(233,237,247,0.45)' });
            text(ctx, `${Dmax.toFixed(1)} billion ly`, px0, py1 + 13, { size: 10, color: 'rgba(233,237,247,0.45)' });
            text(ctx, `${Math.round(Vmax / 1000)}k`, px0 - 6, py0 + 4, { size: 9, align: 'right', color: 'rgba(233,237,247,0.45)', mono: true });
            text(ctx, 'km/s', px0 - 6, py0 + 16, { size: 9, align: 'right', color: 'rgba(233,237,247,0.45)' });
          }
        }

        // ---------------------------------------------------------------- timeline and caption
        const tl0 = g.tl0, tl1 = g.tl1, ty = g.tlY;
        const grd = ctx.createLinearGradient(tl0, 0, tl1, 0);
        [[0, '#8a6cff'], [0.06, '#ffffff'], [0.35, '#ffe9b0'], [0.51, '#ff8a3a'], [0.53, '#401208'], [0.6, '#140a08'], [0.66, '#3d63c8'], [0.88, '#9fc0ff'], [1, '#56627d']].forEach(([s, c]) => grd.addColorStop(s, c));
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        roundRect(ctx, tl0 - 3, ty - 6, tl1 - tl0 + 6, 12, 6);
        ctx.fill();
        ctx.fillStyle = grd;
        roundRect(ctx, tl0, ty - 3, tl1 - tl0, 6, 3);
        ctx.fill();
        const marks = g.phone
          ? [[0, 'Big Bang'], [37, 'Nuclei'], [52, 'First light'], [TODAY, 'Today']]
          : [[0, 'Big Bang'], [20, 'Protons'], [37, 'Nuclei'], [52, 'First light'], [58, 'Dark ages'], [64, 'First stars'], [76, 'Galaxies'], [TODAY, 'Today'], [96, 'Future']];
        marks.forEach(([m, label]) => {
          const X = clockX(g, m);
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.fillRect(X - 0.5, ty + 5, 1, 5);
          text(ctx, label, clamp(X, tl0 + 20, tl1 - 16), ty + 18, { size: 10, align: 'center', color: m === TODAY ? C.amber : 'rgba(233,237,247,0.6)' });
        });
        const mx = clockX(g, x);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, ty, 7, 0, TAU);
        ctx.fill();
        ctx.stroke();
        if (params.run !== 'pause') {
          const d = params.run === 'forward' ? 1 : -1;
          ctx.fillStyle = C.amber;
          ctx.beginPath();
          ctx.moveTo(mx + d * 18, ty);
          ctx.lineTo(mx + d * 11, ty - 5);
          ctx.lineTo(mx + d * 11, ty + 5);
          ctx.fill();
        }
        const ep = epochOf(x);
        const cy0 = ty + 48;
        text(ctx, ep[1], tl0, cy0, { size: g.phone ? 17 : 22, weight: 700 });
        text(ctx, `${fmtTime(yearsOf(x))} after the Big Bang`, tl0, cy0 + (g.phone ? 21 : 25), { size: g.phone ? 11.5 : 13, color: C.amber, mono: true });
        text(ctx, ep[2], tl0, cy0 + (g.phone ? 38 : 45), { size: g.phone ? 11 : 12.5, color: 'rgba(233,237,247,0.75)' });
      },
      stats() {
        const x = params.clock, a = aOfX(x);
        const H = Hof(a);
        const acc = OL > OM / (2 * a ** 3) + OR / a ** 4;
        return [
          { label: 'Time since Big Bang', value: fmtTime(yearsOf(x)), color: C.amber },
          { label: 'Size vs today', value: a >= 0.995 && a <= 1.005 ? '1 (today)' : a > 1 ? `${a.toFixed(2)}× bigger` : a >= 0.1 ? `${Math.round(a * 100)} %` : `1 / ${big(1 / a)}` },
          { label: 'Temperature', value: x < 6 ? 'inflating' : `${big(2.725 / a)} K`, color: C.red },
          { label: 'Redshift z', value: a < 1 ? (1 / a - 1 < 10 ? (1 / a - 1).toFixed(2) : big(1 / a - 1)) : a < 1.005 ? '0' : '—' },
          { label: 'Expansion', value: acc ? 'speeding up' : 'slowing down', color: acc ? C.cyan : undefined },
          { label: 'Hubble rate', value: x < 40 ? 'huge' : `${big(H * 977.8 / 3.2616)} km/s per Mly` },
        ];
      },
    };
    return sim;
  },
};
