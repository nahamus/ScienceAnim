import { C, TAU, clamp, lerp, drawGlow, tag, text, rgba, seeded, roundRect } from '../../core/util.js';

// ---------------------------------------------------------------- optics (a "reduced eye": one lens)

// distance from the lens to the retina in mm; a normal eye focuses parallel light with 60 dioptres
const LEN = { normal: 1000 / 60, short: 1000 / 56, long: 1000 / 64 };
// how many extra dioptres the lens can add by squeezing (accommodation) at each age
const RANGE = { child: 10, adult: 4, older: 1 };
const PUPIL = 4; // mm
const glassesFor = (p) => (p.eye === 'short' ? -4 : p.eye === 'long' ? 4 : p.age === 'older' ? 2.5 : 0);

function optics(p, logD = p.dist) {
  const Lr = LEN[p.eye], A = RANGE[p.age];
  const G = p.glasses ? glassesFor(p) : 0;
  const d = 10 ** logD;
  const need = 1000 / Lr + 1 / d - G; // lens power that would focus exactly on the retina
  const squeeze = p.auto ? clamp((need - 60) / A, 0, 1) : p.squeeze;
  const P = 60 + squeeze * A;
  const Vout = P + G - 1 / d; // vergence leaving the lens (dioptres)
  const err = Vout - 1000 / Lr; // > 0: focuses in front of the retina
  const blur = PUPIL * Math.abs(err) * 3.438; // blur circle in arc-minutes
  return { Lr, A, G, d, P, squeeze, Vout, err, blur };
}
const fmtDist = (d) => (d < 1 ? Math.round(d * 100) + ' cm' : d < 10 ? d.toFixed(1) + ' m' : Math.round(d) + ' m');

// ---------------------------------------------------------------- colour vision

const gauss = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2);
const SENS = {
  S: (nm) => gauss(nm, 420, 24),
  M: (nm) => gauss(nm, 534, 42),
  L: (nm) => gauss(nm, 564, 48),
  rod: (nm) => gauss(nm, 498, 40),
};
const CONE_COL = { S: '#5b8cff', M: '#2ee6a6', L: '#ff4d6d', rod: '#c9d2ea' };
const CONE_NAME = { S: 'blue (S) cone', M: 'green (M) cone', L: 'red (L) cone', rod: 'rod' };

/** Approximate colour of a pure wavelength, 0..1 channels. */
function wlRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) (r = (440 - nm) / 60), (b = 1);
  else if (nm < 490) (g = (nm - 440) / 50), (b = 1);
  else if (nm < 510) (g = 1), (b = (510 - nm) / 20);
  else if (nm < 580) (r = (nm - 510) / 70), (g = 1);
  else if (nm < 645) (r = 1), (g = (645 - nm) / 65);
  else r = 1;
  const f = nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 680 ? 0.3 + (0.7 * (780 - nm)) / 100 : 1;
  return [r * f, g * f, b * f];
}
const css = ([r, g, b], a = 1) => `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
function hueName(nm) {
  if (nm < 450) return 'violet';
  if (nm < 490) return 'blue';
  if (nm < 520) return 'cyan-green';
  if (nm < 565) return 'green';
  if (nm < 590) return 'yellow';
  if (nm < 625) return 'orange';
  return 'red';
}
// red (630 nm) and green (532 nm) light mixed so the red and green cones respond exactly as to 580 nm yellow
const MIX = (() => {
  const a1 = SENS.L(630), b1 = SENS.L(532), a2 = SENS.M(630), b2 = SENS.M(532);
  const tL = SENS.L(580), tM = SENS.M(580), det = a1 * b2 - b1 * a2;
  return { red: (tL * b2 - b1 * tM) / det, green: (a1 * tM - tL * a2) / det };
})();

/** The light as a list of [wavelength, weight] lines. */
function spectrum(p) {
  if (p.light === 'single') return [[p.nm, 1]];
  if (p.light === 'mix') return [[630, MIX.red], [532, MIX.green]];
  const out = [];
  for (let nm = 400; nm <= 700; nm += 10) out.push([nm, 1 / 31]);
  return out;
}
const absorbed = (spec, type) => spec.reduce((s, [nm, wt]) => s + wt * SENS[type](nm), 0);

// ---------------------------------------------------------------- the eye-to-brain wiring (design units)

// left eye at (-80,-120), right at (80,-120), chiasm at the origin; LGN at (±95, 95); visual cortex at the back
const FIBRES = [
  // [eye, half of that eye's retina, which half of the view it carries, path]
  { eye: 'L', half: 'outer', field: 'right', pts: [[-92, -88], [-40, -40], [-12, -4], [-30, 40], [-95, 95], [-120, 160], [-70, 222]] },
  { eye: 'L', half: 'inner', field: 'left', pts: [[-68, -88], [-30, -40], [0, 0], [30, 40], [95, 95], [120, 160], [70, 222]] },
  { eye: 'R', half: 'inner', field: 'right', pts: [[68, -88], [30, -40], [0, 0], [-30, 40], [-95, 95], [-120, 160], [-70, 222]] },
  { eye: 'R', half: 'outer', field: 'left', pts: [[92, -88], [40, -40], [12, -4], [30, 40], [95, 95], [120, 160], [70, 222]] },
];
const FIELD_COL = { left: '#38d6f5', right: '#ffb547' };
// where each kind of damage cuts the fibres (fraction along the path)
function cutAt(f, damage) {
  if (damage === 'nerveL' && f.eye === 'L') return 0.12;
  if (damage === 'chiasm' && f.half === 'inner') return 0.34;
  if (damage === 'tractR' && f.pts[6][0] > 0) return 0.62;
  return 2;
}
/** Catmull-Rom resample of a design-space path into evenly spaced points. */
function sample(pts, n = 90) {
  const raw = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 16; k++) {
      const t = k / 16, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      raw.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  raw.push(pts[pts.length - 1]);
  const acc = [0];
  for (let i = 1; i < raw.length; i++) acc.push(acc[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const out = [], L = acc[acc.length - 1];
  for (let i = 0, j = 0; i <= n; i++) {
    const s = (i / n) * L;
    while (j < acc.length - 2 && acc[j + 1] < s) j++;
    const u = (s - acc[j]) / (acc[j + 1] - acc[j] || 1);
    out.push([lerp(raw[j][0], raw[j + 1][0], u), lerp(raw[j][1], raw[j + 1][1], u)]);
  }
  return out;
}
const PATHS = FIBRES.map((f) => sample(f.pts));

export default {
  id: 'vision',
  title: 'How We See',
  category: 'biology',
  tagline: 'Follow light through the lens onto the retina, into the rods and cones, and along the nerves to the brain.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Light', 'Senses', 'Nervous system'],
  keywords: ['eye', 'vision', 'retina', 'lens', 'cornea', 'focus', 'accommodation', 'short sight', 'long sight', 'myopia', 'glasses', 'rods', 'cones', 'colour vision', 'optic nerve', 'optic chiasm', 'visual cortex', 'blind spot'],
  blurb:
    'Your eye is a living camera. The cornea and lens bend light into a tiny upside-down picture on the retina, and the lens changes shape to focus near or far. In the retina, millions of rods and three kinds of cone turn light into nerve signals, and the optic nerves carry them to the back of the brain, which rebuilds the scene you experience.',
  ideas: [
    'The <b>cornea</b> and <b>lens</b> bend (refract) light to form an image on the <b>retina</b>. The image is upside down; the brain flips it.',
    'To focus on near things, muscles let the lens go <b>fatter and rounder</b>. This is called accommodation.',
    '<b>Short sight</b>: the eyeball is too long, so distant things focus in front of the retina. A <b>concave</b> lens fixes it. <b>Long sight</b> is the reverse and needs a <b>convex</b> lens.',
    '<b>Cones</b> work in bright light and come in three kinds (red, green, blue), so we see colour. <b>Rods</b> are far more sensitive but colour-blind, giving night vision.',
    'Each half of the view goes to the <b>opposite</b> side of the brain: fibres from the inner half of each retina cross at the <b>optic chiasm</b>.',
  ],
  hint: 'Drag the object distance slider and watch the lens change shape',
  thumbChapter: 0,
  thumbFrames: 30,
  params: [
    { key: 'scene', label: 'View', type: 'select', value: 'eye', options: [{ value: 'eye', label: 'The eye focusing' }, { value: 'retina', label: 'Inside the retina' }, { value: 'brain', label: 'From eye to brain' }] },
    { key: 'dist', label: 'Object distance', type: 'range', min: -1, max: 1.3, step: 0.01, value: 1, format: (v) => fmtDist(10 ** v) },
    { key: 'eye', label: 'Eyeball', type: 'select', value: 'normal', options: [{ value: 'normal', label: 'Normal' }, { value: 'short', label: 'Short-sighted (too long)' }, { value: 'long', label: 'Long-sighted (too short)' }] },
    { key: 'age', label: 'Age', type: 'select', value: 'adult', options: [{ value: 'child', label: 'Child (very flexible lens)' }, { value: 'adult', label: 'Adult' }, { value: 'older', label: 'Over 60 (stiff lens)' }] },
    { key: 'glasses', label: 'Wear glasses', type: 'toggle', value: false },
    { key: 'auto', label: 'Eye focuses itself', type: 'toggle', value: true },
    { key: 'squeeze', label: 'Lens squeeze (when not automatic)', type: 'range', min: 0, max: 1, step: 0.01, value: 0, format: (v) => Math.round(v * 100) + '%' },
    { key: 'light', label: 'Light shining on the retina', type: 'select', value: 'white', options: [{ value: 'white', label: 'White light' }, { value: 'single', label: 'One colour (wavelength)' }, { value: 'mix', label: 'Red + green light mixed' }] },
    { key: 'nm', label: 'Wavelength', type: 'range', min: 400, max: 700, step: 1, value: 580, format: (v) => `${Math.round(v)} nm (${hueName(v)})` },
    { key: 'bright', label: 'Brightness', type: 'range', min: 0, max: 1, step: 0.01, value: 0.9, format: (v) => (v < 0.25 ? 'starlight' : v < 0.5 ? 'dim room' : v < 0.75 ? 'indoors' : 'daylight') },
    { key: 'damage', label: 'Damage to the pathway', type: 'select', value: 'none', options: [{ value: 'none', label: 'None' }, { value: 'nerveL', label: 'Left optic nerve cut' }, { value: 'chiasm', label: 'Crossing point (chiasm) squashed' }, { value: 'tractR', label: 'Right side of the visual brain' }] },
  ],
  story: [
    {
      title: 'A camera made of jelly',
      text: 'Light from the candle enters through the clear <b>cornea</b>, passes the coloured <b>iris</b> and goes through the <b>lens</b>. Both bend the light so that rays from each point meet again at one point on the <b>retina</b>, the light-sensitive layer at the back. Notice the picture there is <em>upside down</em>: your brain quietly turns it the right way up.',
      params: { scene: 'eye', dist: 0.7, eye: 'normal', age: 'adult', glasses: false, auto: true },
      duration: 15,
    },
    {
      title: 'Focusing near and far',
      text: 'Bring the candle close. Light from a near object spreads out more, so it needs more bending. A ring of <b>ciliary muscle</b> lets the lens go <b>fatter and rounder</b>, which bends light more strongly. Look far away and the lens is stretched thin again. This is called <b>accommodation</b>.',
      params: { scene: 'eye', dist: -0.6, auto: true },
      tween: 6,
      duration: 13,
    },
    {
      title: 'When the lens stops squeezing',
      text: 'Switch the automatic focusing off and the lens stays thin. Now the near candle focuses <em>behind</em> the retina, so each point spreads into a blurry disc. That blur is exactly what you see in the panel.',
      params: { scene: 'eye', dist: -0.6, auto: false, squeeze: 0 },
      check: {
        q: 'You look up from your phone to a mountain far away. What does the lens in your eye do?',
        options: ['Gets fatter and rounder', 'Gets thinner and flatter', 'Stays exactly the same'],
        answer: 1,
        explain: 'Distant light needs less bending, so the ciliary muscle relaxes and the lens is pulled thinner. Watch it flatten as the candle moves away.',
      },
      duration: 12,
    },
    {
      title: 'Short sight',
      text: 'In a <b>short-sighted</b> eye the eyeball is a little too long (or the lens too strong). Light from far away comes to a focus <em>in front of</em> the retina and has spread out again by the time it lands. Near things still look sharp, but distant ones are blurred.',
      params: { scene: 'eye', dist: 1.1, eye: 'short', age: 'adult', glasses: false, auto: true },
      tween: 3,
      duration: 13,
    },
    {
      title: 'Glasses to the rescue',
      text: 'A <b>concave</b> lens (thinner in the middle) spreads the light out a little before it enters the eye, pushing the focus back onto the retina. Long-sighted eyes are too short, so they need the opposite: a <b>convex</b> lens that bends light inwards.',
      formula: 'lens power (dioptres) = 1 ÷ focal length (m)',
      params: { scene: 'eye', dist: 1.1, eye: 'short', glasses: true, auto: true },
      check: {
        q: 'Which kind of lens fixes short sight?',
        options: ['Concave: spreads the light out', 'Convex: bends the light inwards', 'Neither: it needs an operation'],
        answer: 0,
        explain: 'Short-sighted eyes bend light too much for their length, so a diverging (concave) lens cancels some of that bending. Laser surgery can also reshape the cornea to do the same.',
      },
      duration: 13,
    },
    {
      title: 'Why grandparents hold the menu far away',
      text: 'With age the lens hardens and can barely change shape. Distant things are still sharp, but near print blurs, so people hold it at arm’s length. <b>Reading glasses</b> (convex) add the bending the lens can no longer provide.',
      params: { scene: 'eye', dist: -0.55, eye: 'normal', age: 'older', glasses: false, auto: true },
      tween: 3,
      duration: 13,
    },
    {
      title: 'Inside the retina',
      text: 'Zoom into the retina. Oddly, light has to pass through the nerve cells first to reach the light catchers at the back: <b>rods</b> (white) and <b>cones</b> (coloured). When one catches a photon it signals a <b>bipolar cell</b>, which passes it to a <b>ganglion cell</b>, whose long fibre heads off to the brain.',
      params: { scene: 'retina', light: 'white', bright: 0.9 },
      duration: 15,
    },
    {
      title: 'Three kinds of cone',
      text: 'Cones come in three kinds, most sensitive to blue, green and red light (see the chart). A pure colour excites them by different amounts, and your brain reads the <em>mix of signals</em> as a colour. Watch the light sweep through the rainbow.',
      params: { scene: 'retina', light: 'single', bright: 0.9 },
      enter: (s, r) => {
        r.set('nm', 440);
        r.set('nm', 660, 13);
      },
      duration: 15,
    },
    {
      title: 'Fooling the cones',
      text: 'Now there is no yellow light at all: just red and green mixed. The red and green cones respond exactly as they would to yellow, so you <em>see yellow</em>. Every phone and TV screen uses this trick with only red, green and blue pixels.',
      params: { scene: 'retina', light: 'mix', bright: 0.9 },
      check: {
        q: 'A screen has only red, green and blue pixels. How does it make a picture look yellow?',
        options: ['It mixes red and green light, which excites your cones like yellow', 'It has a few hidden yellow pixels', 'Your brain just guesses from the shape'],
        answer: 0,
        explain: 'Your eye can’t tell 580 nm yellow from the right red + green mixture, because the cones send the same signals. Compare the cone bars for both.',
      },
      duration: 14,
    },
    {
      title: 'Seeing in the dark',
      text: 'Turn the light down to starlight. The cones need lots of light and fall silent, but rods respond to a <b>single photon</b>. Rods can’t tell colours apart, which is why a moonlit garden looks grey. In bright light the rods are swamped and switch off.',
      params: { scene: 'retina', light: 'white', bright: 0.12 },
      tween: 4,
      duration: 14,
    },
    {
      title: 'Into the brain',
      text: 'Seen from above, the two optic nerves meet at the <b>optic chiasm</b>. Fibres from the inner half of each retina cross over, so everything in the <em style="color:#38d6f5">left half of your view</em> ends up on the <b>right</b> side of the brain, and the <em style="color:#ffb547">right half</em> on the left. The visual cortex at the back stitches the halves into one picture.',
      params: { scene: 'brain', damage: 'none' },
      duration: 16,
    },
    {
      title: 'When the wiring is damaged',
      text: 'Doctors use this wiring to locate injuries. Damage to the right side of the visual brain wipes out the left half of the view <em>in both eyes</em>, while cutting one optic nerve blinds just that eye. Try each kind of damage.',
      params: { scene: 'brain', damage: 'tractR' },
      check: {
        q: 'A stroke damages the right side of someone’s visual brain. What do they lose?',
        options: ['All sight in the right eye', 'The left half of the view, in both eyes', 'The right half of the view, in both eyes'],
        answer: 1,
        explain: 'Both eyes send their left-half signals to the right side of the brain, so that half of the world disappears for both eyes, even though the eyes are fine.',
      },
      duration: 15,
    },
    {
      title: 'Explore',
      text: 'Move the candle, try different eyes and ages, put glasses on, shine different colours into the retina and cut the pathways to the brain.',
      params: { scene: 'eye', dist: 0.3, eye: 'normal', age: 'adult', glasses: false, auto: true, damage: 'none' },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0;
    let photons = [], pulses = [], cells = [], firing = { S: 0, M: 0, L: 0, rod: 0 };
    let brainPulses = [], brainAcc = 0;
    let curve = [], curveKey = '', sens = null, specLine = [], specKey = '';
    let candle = null;

    // ------------------------------------------------ layout
    const lay = () => {
      const { w, h } = api;
      const narrow = w < 700;
      return { w, h, narrow, T: 64 };
    };
    function eyeLayout() {
      const L = lay();
      const axis = L.narrow ? L.h * 0.27 : L.h * 0.4;
      const R = L.narrow ? Math.min(L.h * 0.15, L.w * 0.21) : Math.min(L.h * 0.25, L.w * 0.16);
      const ex = L.narrow ? L.w * 0.64 : L.w * 0.5;
      const lx = ex - R * 0.6; // the lens
      const s = (R * 1.55) / LEN.normal; // px per mm behind the lens
      return { ...L, axis, R, ex, lx, s };
    }

    // ------------------------------------------------ the candle sprite for the "what you see" panel
    function makeCandle() {
      const c = document.createElement('canvas');
      c.width = 220;
      c.height = 150;
      const g = c.getContext('2d');
      // a little eye chart behind the candle so the blur is easy to judge
      g.fillStyle = '#e9edf7';
      g.font = '700 26px "Inter", system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText('E  F  P', 110, 32);
      g.font = '700 15px "Inter", system-ui, sans-serif';
      g.fillText('T  O  Z  L', 110, 56);
      g.font = '700 9px "Inter", system-ui, sans-serif';
      g.fillText('L  P  E  D  F  C', 110, 72);
      // candle
      const grd = g.createLinearGradient(96, 0, 124, 0);
      grd.addColorStop(0, '#d9c9a8');
      grd.addColorStop(0.5, '#fff6e0');
      grd.addColorStop(1, '#bba987');
      g.fillStyle = grd;
      g.fillRect(100, 104, 20, 44);
      g.strokeStyle = '#333';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(110, 104);
      g.lineTo(110, 98);
      g.stroke();
      const fl = g.createRadialGradient(110, 92, 1, 110, 90, 12);
      fl.addColorStop(0, '#ffffff');
      fl.addColorStop(0.35, '#ffe08a');
      fl.addColorStop(1, 'rgba(255,140,40,0)');
      g.fillStyle = fl;
      g.beginPath();
      g.ellipse(110, 90, 7, 13, 0, 0, TAU);
      g.fill();
      return c;
    }

    // ------------------------------------------------ the eye scene
    function drawCandle(x, base, hgt, flick) {
      const wd = hgt * 0.22;
      const grd = ctx.createLinearGradient(x - wd / 2, 0, x + wd / 2, 0);
      grd.addColorStop(0, '#bfae8c');
      grd.addColorStop(0.5, '#fff3d8');
      grd.addColorStop(1, '#a8977a');
      ctx.fillStyle = grd;
      ctx.fillRect(x - wd / 2, base - hgt * 0.62, wd, hgt * 0.62);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, base - hgt * 0.62);
      ctx.lineTo(x, base - hgt * 0.7);
      ctx.stroke();
      const fy = base - hgt * 0.82;
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, x, fy, hgt * 0.5 * flick, '#ffb547', 0.25);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff1c4';
      ctx.beginPath();
      ctx.ellipse(x, fy, hgt * 0.06, hgt * 0.13 * flick, 0, 0, TAU);
      ctx.fill();
      return fy;
    }

    function drawEye() {
      const E = eyeLayout();
      const { axis, R, ex, lx, s } = E;
      const o = optics(params);
      const rx = lx + o.Lr * s; // retina, on the axis
      const front = ex - R * 0.92;
      const ecx = (front + rx + R * 0.04) / 2, erx = (rx + R * 0.04 - front) / 2;
      // background
      const bg = ctx.createLinearGradient(0, 0, 0, E.h);
      bg.addColorStop(0, '#0a0d1c');
      bg.addColorStop(1, '#04050b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, E.w, E.h);
      // axis
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(0, axis);
      ctx.lineTo(E.w, axis);
      ctx.stroke();
      ctx.setLineDash([]);

      // the candle (object)
      const u = clamp((params.dist + 1) / 2.3, 0, 1);
      const ox = lerp(front - R * 0.45, E.narrow ? E.w * 0.07 : E.w * 0.06, u);
      const oh = R * lerp(0.85, 0.5, u);
      const base = axis + oh * 0.3;
      const flick = 1 + 0.06 * Math.sin(t * 13) + 0.04 * Math.sin(t * 7.3);
      const fy = drawCandle(ox, base, oh, flick);

      // eyeball
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ecx, axis, erx, R, 0, 0, TAU);
      const wg = ctx.createRadialGradient(ecx - erx * 0.3, axis - R * 0.4, R * 0.1, ecx, axis, R * 1.05);
      wg.addColorStop(0, '#2a2f45');
      wg.addColorStop(1, '#141828');
      ctx.fillStyle = wg;
      ctx.fill();
      ctx.lineWidth = Math.max(3, R * 0.05);
      ctx.strokeStyle = '#e8e2dc'; // sclera
      ctx.stroke();
      // retina: a red-pink lining at the back
      ctx.lineWidth = Math.max(3, R * 0.045);
      ctx.strokeStyle = '#ff5f7e';
      ctx.beginPath();
      ctx.ellipse(ecx, axis, erx - R * 0.045, R * 0.955, 0, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.stroke();
      ctx.restore();
      // optic nerve leaving the back, a little off-axis (the blind spot)
      const ny = axis + R * 0.2;
      const nx = ecx + Math.sqrt(Math.max(0, 1 - ((ny - axis) / R) ** 2)) * erx;
      ctx.fillStyle = '#e8d6a8';
      ctx.beginPath();
      ctx.moveTo(nx - 4, ny - R * 0.1);
      ctx.quadraticCurveTo(nx + R * 0.3, ny - R * 0.06, nx + R * 0.55, ny + R * 0.12);
      ctx.lineTo(nx + R * 0.5, ny + R * 0.32);
      ctx.quadraticCurveTo(nx + R * 0.25, ny + R * 0.15, nx - 4, ny + R * 0.1);
      ctx.closePath();
      ctx.fill();
      // cornea bulge
      ctx.strokeStyle = 'rgba(170,220,255,0.75)';
      ctx.fillStyle = 'rgba(120,190,255,0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ex - R * 0.58, axis, R * 0.48, Math.PI * 0.62, Math.PI * 1.38);
      ctx.fill();
      ctx.stroke();
      // iris
      const pr = R * 0.16;
      ctx.strokeStyle = '#4a8f7a';
      ctx.lineWidth = Math.max(3, R * 0.05);
      ctx.beginPath();
      ctx.moveTo(lx - R * 0.08, axis - pr - 2);
      ctx.lineTo(lx - R * 0.08, axis - R * 0.62);
      ctx.moveTo(lx - R * 0.08, axis + pr + 2);
      ctx.lineTo(lx - R * 0.08, axis + R * 0.62);
      ctx.stroke();
      // lens: thicker as it squeezes
      const lt = R * (0.1 + 0.11 * o.squeeze), lh = R * (0.44 - 0.04 * o.squeeze);
      const lg = ctx.createRadialGradient(lx - lt * 0.3, axis - lh * 0.3, 1, lx, axis, lh);
      lg.addColorStop(0, 'rgba(230,245,255,0.85)');
      lg.addColorStop(1, 'rgba(140,190,240,0.45)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.ellipse(lx, axis, lt, lh, 0, 0, TAU);
      ctx.fill();
      // ciliary muscles: redder when contracted
      ctx.fillStyle = `rgb(${150 + 100 * o.squeeze},${90 - 30 * o.squeeze},${100 - 40 * o.squeeze})`;
      for (const sg of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(lx, axis + sg * R * 0.7, R * 0.07, R * 0.1, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(230,230,240,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, axis + sg * R * 0.6);
        ctx.lineTo(lx, axis + sg * lh);
        ctx.stroke();
      }

      // glasses in front of the eye
      if (o.G) {
        const gx = front - R * 0.32, gh = R * 0.75, k = Math.sign(o.G) * R * 0.05;
        ctx.fillStyle = 'rgba(160,220,255,0.18)';
        ctx.strokeStyle = 'rgba(180,230,255,0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx - R * 0.06, axis - gh);
        ctx.quadraticCurveTo(gx - R * 0.06 - k * 2, axis, gx - R * 0.06, axis + gh);
        ctx.lineTo(gx + R * 0.06, axis + gh);
        ctx.quadraticCurveTo(gx + R * 0.06 + k * 2, axis, gx + R * 0.06, axis - gh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // light rays from the flame through the pupil
      const V = Math.abs(o.Vout) < 0.05 ? 0.05 : o.Vout;
      const di = (1000 / V) * s; // px from the lens (negative: rays still spreading)
      const m = (axis - fy) / (lx - ox);
      const Ix = lx + di, Iy = axis + m * di;
      const hits = [];
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1.3;
      for (let k = -2; k <= 2; k++) {
        const yk = axis + (k / 2) * pr;
        let dx = Ix - lx, dy = Iy - yk;
        if (di < 0) (dx = -dx), (dy = -dy);
        const tt = (rx - lx) / dx;
        const yr = yk + dy * tt;
        hits.push(yr);
        ctx.strokeStyle = 'rgba(255,190,90,0.55)';
        ctx.beginPath();
        ctx.moveTo(ox, fy);
        ctx.lineTo(lx, yk);
        ctx.lineTo(rx, yr);
        ctx.stroke();
      }
      // where the light lands: an upside-down candle, blurred by the spread of the rays
      const ymid = (hits[0] + hits[4]) / 2, spread = Math.abs(hits[4] - hits[0]);
      const mb = (axis - base) / (lx - ox), yb = axis + mb * (rx - lx);
      ctx.strokeStyle = 'rgba(255,240,210,0.75)';
      ctx.lineWidth = Math.max(2, oh * 0.08);
      ctx.beginPath();
      ctx.moveTo(rx - 3, yb);
      ctx.lineTo(rx - 3, lerp(yb, ymid, 0.78));
      ctx.stroke();
      drawGlow(ctx, rx - 2, ymid, 7 + spread * 0.9, '#ffb547', 0.3);
      if (di > 0 && Ix < rx - 6 && Ix > lx) drawGlow(ctx, Ix, Iy, 8, '#ffffff', 0.3);
      ctx.globalCompositeOperation = 'source-over';

      // "what you see" panel
      let px, py, pw, ph;
      if (E.narrow) (pw = Math.min(E.w * 0.44, 170)), (ph = pw * 0.62), (px = E.w - pw - 12), (py = axis + R + 26);
      else (pw = Math.min(230, E.w - (ex + R * 1.1) - 18)), (ph = pw * 0.68), (px = E.w - pw - 18), (py = 100);
      if (pw > 90 && !api.thumbnail) {
        ctx.fillStyle = '#0b0e18';
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        roundRect(ctx, px, py, pw, ph, 8);
        ctx.fill();
        ctx.stroke();
        ctx.save();
        roundRect(ctx, px, py, pw, ph, 8);
        ctx.clip();
        candle ??= makeCandle();
        const sc = (pw / 220) * lerp(1.15, 0.62, u);
        const cw = 220 * sc, chh = 150 * sc, cx0 = px + (pw - cw) / 2, cy0 = py + (ph - chh) / 2 + 6;
        const bpx = clamp(o.blur * 0.12, 0, 16) * (pw / 220);
        if (bpx < 0.5) ctx.drawImage(candle, cx0, cy0, cw, chh);
        else {
          const n = 14;
          ctx.globalAlpha = 2.2 / n;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU, rr = bpx * (i % 2 ? 1 : 0.55);
            ctx.drawImage(candle, cx0 + Math.cos(a) * rr, cy0 + Math.sin(a) * rr, cw, chh);
          }
          ctx.globalAlpha = 1;
        }
        ctx.restore();
        text(ctx, 'What you see', px + 8, py + 12, { size: 10, color: C.dim, weight: 600 });
      }

      if (!api.thumbnail) {
        const sz = E.narrow ? 9 : 11;
        tag(ctx, 'cornea', front - R * 0.1, axis - R * 0.62 - (E.narrow ? 4 : 12), '#9fd8ff', { align: 'center', size: sz });
        tag(ctx, 'lens', lx, axis + R * 0.95 + 10, '#cfe6ff', { align: 'center', size: sz });
        tag(ctx, 'retina', rx + R * 0.02, axis - R * 1.05 - 4, '#ff7f98', { align: 'center', size: sz });
        if (!E.narrow) {
          tag(ctx, 'iris', lx - R * 0.08, axis - R * 0.98, '#6fc7a8', { align: 'center', size: sz });
          tag(ctx, 'ciliary muscle', lx - R * 0.1, axis + R * 1.2 + 12, '#ff9aa8', { align: 'center', size: sz });
          tag(ctx, 'optic nerve (blind spot)', nx + R * 0.3, ny + R * 0.55, '#e8d6a8', { size: sz });
        }
        const sharp = o.blur < 3;
        const note = sharp ? 'sharp focus' : o.err > 0 ? 'focuses in front of the retina' : 'would focus behind the retina';
        tag(ctx, note, rx, axis + R + (E.narrow ? 12 : 22), sharp ? C.teal : C.amber, { align: 'center', size: sz });
        if (!E.narrow) tag(ctx, 'image upside down', rx - 10, ymid < axis ? ymid - 16 : ymid + 16, '#ffd28a', { size: 10, align: 'right' });
      }
    }

    // ------------------------------------------------ the retina scene
    function retinaLayout() {
      const L = lay();
      const y0 = L.narrow ? 100 : 132;
      const y1 = L.narrow ? L.h * 0.55 : Math.min(L.h * 0.62, L.h - 300);
      const xi = L.narrow ? L.w * 0.27 : L.w * 0.42;
      const W = L.w * 0.97 - xi;
      return { ...L, y0, y1, xi, W, xg: xi + W * 0.08, xb: xi + W * 0.27, xp: xi + W * 0.46, xo0: xi + W * 0.6, xo1: xi + W * 0.84, xe: xi + W * 0.88, lamp: L.narrow ? L.w * 0.08 : L.w * 0.12 };
    }
    function buildCells() {
      const L = retinaLayout();
      const n = clamp(Math.floor((L.y1 - L.y0) / (L.narrow ? 19 : 23)), 8, 18);
      const r = seeded(11);
      const kinds = [];
      const cycle = ['rod', 'L', 'M', 'rod', 'S', 'L', 'rod', 'M', 'L', 'S'];
      for (let i = 0; i < n; i++) kinds.push(cycle[i % cycle.length]);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
      }
      cells = kinds.map((k, i) => ({ k, y: L.y0 + ((i + 0.5) / n) * (L.y1 - L.y0), act: 0, flash: 0, rate: 0, rateAvg: 0 }));
      photons = [];
      pulses = [];
    }
    const photonRate = () => 5 * 40 ** params.bright; // photons per second over the whole patch

    function updateRetina(dt) {
      const L = retinaLayout();
      if (!cells.length) buildCells();
      const spec = spectrum(params);
      const tot = spec.reduce((s, [, wt]) => s + wt, 0);
      let acc = photonRate() * dt;
      while (acc > 0) {
        if (Math.random() < acc) {
          let pick = Math.random() * tot, nm = spec[0][0];
          for (const [l, wt] of spec) if ((pick -= wt) <= 0) {
            nm = l;
            break;
          }
          const row = Math.floor(Math.random() * cells.length);
          const ty = cells[row].y + (Math.random() - 0.5) * 6;
          const sy = lerp(L.y0, L.y1, 0.5) + (ty - lerp(L.y0, L.y1, 0.5)) * 0.25;
          photons.push({ x: L.lamp, y: sy, x0: L.lamp, y0: sy, ty, row, nm, done: false, fade: 1 });
        }
        acc -= 1;
      }
      const sp = (L.xe - L.lamp) / 1.6;
      for (const p of photons) {
        if (p.done) {
          p.fade -= dt * 4;
          continue;
        }
        p.x += sp * dt;
        p.y = lerp(p.y0, p.ty, clamp((p.x - p.x0) / (L.xi - p.x0), 0, 1));
        const c = cells[p.row];
        if (!p.tested && p.x > (L.xo0 + L.xo1) / 2) {
          p.tested = true;
          if (Math.random() < 0.85 * SENS[c.k](p.nm)) {
            p.done = true;
            c.act += 1;
            c.rate += 1;
            if (c.k === 'rod') {
              // a rod answers a single photon, unless bright light has bleached it
              if (c.rateAvg < 3.5) fire(c);
            } else if (c.act > 2.5) {
              c.act -= 2.5;
              fire(c);
            }
          }
        }
        if (p.x > L.xe + 6) p.done = true;
      }
      photons = photons.filter((p) => p.fade > 0);
      for (const c of cells) {
        c.act *= Math.exp(-dt * 3);
        c.flash = Math.max(0, c.flash - dt * 3);
        c.rateAvg = lerp(c.rateAvg ?? 0, c.rate / dt, 1 - Math.exp(-dt / 1.2));
        c.rate = 0;
      }
      for (const k in firing) firing[k] *= Math.exp(-dt / 1.5);
      for (const q of pulses) q.t += dt * 0.9;
      pulses = pulses.filter((q) => q.t < 1);
    }
    function fire(c) {
      c.flash = 1;
      firing[c.k] += 1 / 1.5;
      pulses.push({ c, t: 0 });
    }
    function pulsePos(L, q) {
      const y = q.c.y, top = L.y0 - 14;
      // receptor body → bipolar → ganglion → along the inner surface to the optic nerve
      const seg = [[L.xp, y], [L.xb, y], [L.xg, y], [L.xg - 10, top], [L.xg - 10 - (L.xg - L.xi) * 0.4, top - 8]];
      const k = q.t * (seg.length - 1), i = Math.min(seg.length - 2, Math.floor(k)), f = k - i;
      return [lerp(seg[i][0], seg[i + 1][0], f), lerp(seg[i][1], seg[i + 1][1], f)];
    }

    function drawRetina() {
      const L = retinaLayout();
      if (!cells.length) buildCells();
      ctx.fillStyle = '#07060c';
      ctx.fillRect(0, 0, L.w, L.h);
      // tissue band
      const tg = ctx.createLinearGradient(L.xi, 0, L.xe, 0);
      tg.addColorStop(0, 'rgba(120,60,90,0.18)');
      tg.addColorStop(1, 'rgba(160,70,90,0.3)');
      ctx.fillStyle = tg;
      ctx.fillRect(L.xi, L.y0 - 22, L.xe - L.xi, L.y1 - L.y0 + 36);
      ctx.fillStyle = '#1a0d0a'; // pigment layer, dark brown
      ctx.fillRect(L.xe, L.y0 - 22, L.xi + L.W - L.xe, L.y1 - L.y0 + 36);
      // lamp
      const spec = spectrum(params);
      const rgb = [0, 0, 0];
      for (const [nm, wt] of spec) {
        const c = wlRGB(nm);
        for (let i = 0; i < 3; i++) rgb[i] += c[i] * wt;
      }
      const mx = Math.max(...rgb, 1e-3);
      const lampCol = params.light === 'white' ? [1, 1, 1] : rgb.map((v) => v / mx);
      const lamp = [L.lamp, lerp(L.y0, L.y1, 0.5)];
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, lamp[0], lamp[1], 30 + 30 * params.bright, '#ffffff', 0.2);
      ctx.fillStyle = css(lampCol, 0.35 + 0.65 * params.bright);
      ctx.beginPath();
      ctx.arc(lamp[0], lamp[1], 9, 0, TAU);
      ctx.fill();
      // photons
      // photons, batched by colour (fading ones drawn dimmer as a group)
      const groups = new Map();
      for (const p of photons) {
        const key = Math.round(p.nm / 5) * 5 + (p.fade < 1 ? 1000 : 0);
        let g = groups.get(key);
        if (!g) groups.set(key, (g = []));
        g.push(p);
      }
      for (const [key, list] of groups) {
        const nm = key % 1000, c = wlRGB(nm);
        ctx.fillStyle = css(params.light === 'white' ? [0.8 + c[0] * 0.2, 0.8 + c[1] * 0.2, 0.8 + c[2] * 0.2] : c, key >= 1000 ? 0.35 : 0.9);
        ctx.beginPath();
        for (const p of list) ctx.rect(p.x - 2, p.y - 1, 5, 2.4);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      // cells
      const ch = (L.y1 - L.y0) / cells.length;
      // wiring (receptor → bipolar → ganglion → optic nerve), bipolar and ganglion cells: one path each
      ctx.strokeStyle = 'rgba(200,180,220,0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const c of cells) {
        ctx.moveTo(L.xp, c.y);
        ctx.lineTo(L.xg, c.y);
        ctx.lineTo(L.xg - 10, L.y0 - 14);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(180,150,210,0.55)';
      ctx.beginPath();
      for (const c of cells) {
        ctx.moveTo(L.xb + 7, c.y);
        ctx.ellipse(L.xb, c.y, 7, ch * 0.28, 0, 0, TAU);
      }
      ctx.fill();
      const gr = Math.min(8, ch * 0.33);
      ctx.fillStyle = 'rgba(230,190,140,0.6)';
      ctx.beginPath();
      for (const c of cells) {
        ctx.moveTo(L.xg + gr, c.y);
        ctx.arc(L.xg, c.y, gr, 0, TAU);
      }
      ctx.fill();
      for (const c of cells) {
        const col = CONE_COL[c.k];
        // photoreceptor: body, then the outer segment that catches light (tapered for a cone)
        const bleached = c.k === 'rod' && c.rateAvg > 3.5;
        ctx.fillStyle = rgba(col, bleached ? 0.18 : 0.42);
        ctx.fillRect(L.xp - 6, c.y - ch * 0.18, L.xo0 - L.xp + 6, ch * 0.36);
        ctx.fillStyle = rgba(col, bleached ? 0.25 : 0.55 + 0.45 * c.flash);
        ctx.beginPath();
        if (c.k === 'rod') ctx.rect(L.xo0, c.y - ch * 0.22, L.xo1 - L.xo0, ch * 0.44);
        else {
          ctx.moveTo(L.xo0, c.y - ch * 0.36);
          ctx.lineTo(L.xo0 + (L.xo1 - L.xo0) * 0.6, c.y - ch * 0.08);
          ctx.lineTo(L.xo0 + (L.xo1 - L.xo0) * 0.6, c.y + ch * 0.08);
          ctx.lineTo(L.xo0, c.y + ch * 0.36);
          ctx.closePath();
        }
        ctx.fill();
        if (c.flash > 0.05) {
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, (L.xo0 + L.xo1) / 2, c.y, ch * (0.8 + c.flash), col, 0.3);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      // signals heading to the brain
      ctx.globalCompositeOperation = 'lighter';
      for (const q of pulses) {
        const [x, y] = pulsePos(L, q);
        drawGlow(ctx, x, y, 8, CONE_COL[q.c.k], 0.35);
      }
      ctx.globalCompositeOperation = 'source-over';

      if (api.thumbnail) return;
      // the colour you'd experience
      const rate = photonRate() / cells.length;
      const cone = clamp((rate * 0.85 * 0.7 - 5) / 8, 0, 1), rod = clamp(rate / 3, 0, 1);
      const grey = 0.28 * rod;
      const seen = lampCol.map((v) => lerp(grey, v * (0.35 + 0.65 * params.bright), cone));
      const sx = L.narrow ? L.lamp + 4 : L.lamp, sy = L.narrow ? L.y1 + 54 : L.y1 - 24;
      ctx.fillStyle = css(seen);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(sx + 12, sy, 12, 0, TAU);
      ctx.fill();
      ctx.stroke();
      const name = cone < 0.15 ? (rod > 0.05 ? 'grey shapes, no colour' : 'nothing') : params.light === 'white' ? 'white' : params.light === 'mix' ? 'yellow!' : hueName(params.nm);
      text(ctx, 'You see:', sx + 30, sy - 7, { size: 10, color: C.dim });
      text(ctx, name, sx + 30, sy + 8, { size: 12, weight: 700 });
      const sz = L.narrow ? 9 : 10.5;
      tag(ctx, 'light in', lerp(L.lamp, L.xi, 0.5), L.y0 - 30, C.ink, { align: 'center', size: sz });
      tag(ctx, 'ganglion', L.xg, L.y1 + 22, '#e6be8c', { align: 'center', size: sz });
      tag(ctx, 'bipolar', L.xb, L.y1 + 22, '#c9a6e8', { align: 'center', size: sz });
      tag(ctx, 'rods & cones', (L.xo0 + L.xo1) / 2, L.y1 + 22, '#ff9fb0', { align: 'center', size: sz });
      if (!L.narrow) {
        tag(ctx, 'to the optic nerve', L.xg - 14, L.y0 - 30, '#e6be8c', { align: 'right', size: sz });
        let ky = L.y1 + 50;
        for (const k of ['rod', 'S', 'M', 'L']) {
          tag(ctx, CONE_NAME[k], L.xi + L.W - 4 * 112 + ['rod', 'S', 'M', 'L'].indexOf(k) * 112, ky, CONE_COL[k], { size: 10 });
        }
        ky += 0;
      }
      if (cells.some((c) => c.k === 'rod' && c.rateAvg > 3.5)) tag(ctx, 'rods swamped by bright light', L.xo1, L.y0 - 30, C.dim, { align: 'right', size: sz });
    }

    // ------------------------------------------------ the brain scene
    function brainLayout() {
      const L = lay();
      const left = Math.min(500, L.w * 0.42), right = L.w - 100;
      const s = L.narrow ? Math.min((L.h * 0.62 - 90) / 600, (L.w - 90) / 440) : Math.min((L.h - 150) / 610, (right - left) / 410);
      const cx = L.narrow ? (L.w - 80) / 2 : (left + right) / 2;
      const cy = (L.narrow ? 90 : 124) + 318 * s;
      return { ...L, s, cx, cy, P: (x, y) => [cx + x * s, cy + y * s] };
    }
    function brainIntact(f) {
      return cutAt(f, params.damage) > 1;
    }
    function updateBrain(dt) {
      brainAcc += dt * 3.2;
      while (brainAcc > 1) {
        brainAcc -= 1;
        FIBRES.forEach((f, i) => brainPulses.push({ i, t: Math.random() * 0.03 }));
      }
      for (const b of brainPulses) b.t += dt * 0.42;
      brainPulses = brainPulses.filter((b) => b.t < 1 && b.t < cutAt(FIBRES[b.i], params.damage));
    }
    function drawBrain() {
      const B = brainLayout();
      const { P, s } = B;
      ctx.fillStyle = '#06070d';
      ctx.fillRect(0, 0, B.w, B.h);
      // the view in front: left half blue, right half amber
      const [fx, fy] = P(0, -265);
      ctx.fillStyle = 'rgba(56,214,245,0.07)';
      ctx.fillRect(fx - 230 * s, fy - 45 * s, 230 * s, 90 * s);
      ctx.fillStyle = 'rgba(255,181,71,0.07)';
      ctx.fillRect(fx, fy - 45 * s, 230 * s, 90 * s);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(fx, fy - 50 * s);
      ctx.lineTo(fx, B.P(0, -150)[1]);
      ctx.stroke();
      ctx.setLineDash([]);
      const ball = P(-150, -265), star = P(150, -265);
      ctx.fillStyle = FIELD_COL.left;
      ctx.beginPath();
      ctx.arc(ball[0], ball[1], 20 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = FIELD_COL.right;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, r = (i % 2 ? 10 : 24) * s;
        ctx.lineTo(star[0] + Math.cos(a) * r, star[1] + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      // head
      const [hx, hy] = P(0, 50);
      ctx.fillStyle = '#141625';
      ctx.strokeStyle = 'rgba(233,237,247,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(hx, hy, 200 * s, 235 * s, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      // nose
      ctx.beginPath();
      ctx.moveTo(...P(-16, -180));
      ctx.lineTo(...P(0, -212));
      ctx.lineTo(...P(16, -180));
      ctx.stroke();
      // visual cortex at the back
      for (const sg of [-1, 1]) {
        const [vx, vy] = P(sg * 72, 238);
        const field = sg < 0 ? 'right' : 'left';
        const live = brainPulses.some((b) => b.t > 0.9 && FIBRES[b.i].field === field);
        ctx.fillStyle = rgba(FIELD_COL[field], live ? 0.32 : 0.12);
        ctx.beginPath();
        ctx.ellipse(vx, vy, 62 * s, 34 * s, sg * 0.25, 0, TAU);
        ctx.fill();
      }
      // fibres
      FIBRES.forEach((f, i) => {
        const path = PATHS[i], cut = cutAt(f, params.damage);
        ctx.strokeStyle = rgba(FIELD_COL[f.field], 0.35);
        ctx.lineWidth = Math.max(2, 7 * s);
        ctx.lineCap = 'round';
        ctx.beginPath();
        path.forEach(([x, y], k) => ctx[k ? 'lineTo' : 'moveTo'](...P(x, y)));
        ctx.stroke();
        if (cut <= 1) {
          const [x, y] = P(...path[Math.round(cut * (path.length - 1))]);
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 3;
          const r = 9 * Math.max(s, 0.7);
          ctx.beginPath();
          ctx.moveTo(x - r, y - r);
          ctx.lineTo(x + r, y + r);
          ctx.moveTo(x + r, y - r);
          ctx.lineTo(x - r, y + r);
          ctx.stroke();
        }
      });
      ctx.lineCap = 'butt';
      // eyes, with rays from each object through the eye's centre onto the far side of the retina
      ctx.globalCompositeOperation = 'lighter';
      for (const [ex, ey] of [[-80, -120], [80, -120]]) {
        for (const [ox, oy, col] of [[-150, -265, FIELD_COL.left], [150, -265, FIELD_COL.right]]) {
          const dx = ex - ox, dy = ey - oy, d = Math.hypot(dx, dy);
          ctx.strokeStyle = rgba(col, 0.35);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(...P(ox, oy));
          ctx.lineTo(...P(ex + (dx / d) * 30, ey + (dy / d) * 30));
          ctx.stroke();
          drawGlow(ctx, ...P(ex + (dx / d) * 30, ey + (dy / d) * 30), 10 * s + 4, col, 0.35);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      for (const [ex, ey] of [[-80, -120], [80, -120]]) {
        const [x, y] = P(ex, ey);
        ctx.fillStyle = '#e8e2dc';
        ctx.beginPath();
        ctx.arc(x, y, 34 * s, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3d7f6b';
        ctx.beginPath();
        ctx.arc(x, y - 22 * s, 11 * s, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#05060a';
        ctx.beginPath();
        ctx.arc(x, y - 24 * s, 5 * s, 0, TAU);
        ctx.fill();
        if (params.damage === 'nerveL' && ex < 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.beginPath();
          ctx.arc(x, y, 34 * s, 0, TAU);
          ctx.fill();
        }
      }
      // signals
      ctx.globalCompositeOperation = 'lighter';
      for (const b of brainPulses) {
        const path = PATHS[b.i];
        const [x, y] = P(...path[Math.min(path.length - 1, Math.round(b.t * (path.length - 1)))]);
        drawGlow(ctx, x, y, 9 * s + 4, FIELD_COL[FIBRES[b.i].field], 0.35);
      }
      ctx.globalCompositeOperation = 'source-over';

      // what each eye, and the brain, ends up seeing
      const seen = (eye, field) => FIBRES.some((f) => f.eye === eye && f.field === field && brainIntact(f));
      const views = [
        ['left eye', seen('L', 'left'), seen('L', 'right')],
        ['right eye', seen('R', 'left'), seen('R', 'right')],
        ['together', seen('L', 'left') || seen('R', 'left'), seen('L', 'right') || seen('R', 'right')],
      ];
      if (!api.thumbnail) {
        const r = B.narrow ? 17 : 26;
        views.forEach(([name, l, rr], i) => {
          const x = B.w - r - (B.narrow ? 10 : 30);
          const y = (B.narrow ? 110 : 196) + i * (2 * r + 34);
          for (const [side, ok] of [[-1, l], [1, rr]]) {
            ctx.fillStyle = ok ? rgba(side < 0 ? FIELD_COL.left : FIELD_COL.right, 0.75) : '#000';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, r, side < 0 ? Math.PI / 2 : -Math.PI / 2, side < 0 ? Math.PI * 1.5 : Math.PI / 2);
            ctx.closePath();
            ctx.fill();
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.stroke();
          text(ctx, name, x, y + r + 11, { size: B.narrow ? 9 : 10.5, align: 'center', color: C.dim });
        });
        text(ctx, B.narrow ? 'Seen' : 'What is seen', B.w - r - (B.narrow ? 10 : 30), (B.narrow ? 110 : 196) - r - 14, { size: B.narrow ? 9 : 11, color: C.dim, weight: 600, align: 'center' });
        const sz = B.narrow ? 9 : 11;
        tag(ctx, 'optic chiasm', ...P(0, 18).map((v, k) => (k ? v + 14 * s + 6 : v)), C.ink, { align: 'center', size: sz });
        if (!B.narrow) {
          tag(ctx, 'optic nerve', ...P(-150, -70), C.dim, { align: 'center', size: sz });
          tag(ctx, 'thalamus (LGN)', ...P(-170, 100), C.dim, { align: 'center', size: sz });
        }
        tag(ctx, 'visual cortex', ...P(0, 290), C.ink, { align: 'center', size: sz });
        tag(ctx, 'left half of view', ...P(-150, -318), FIELD_COL.left, { align: 'center', size: sz });
        tag(ctx, 'right half', ...P(150, -318), FIELD_COL.right, { align: 'center', size: sz });
      }
    }

    // ------------------------------------------------ charts
    function blurCurve() {
      const key = [params.eye, params.age, params.glasses, params.auto, params.auto ? 0 : params.squeeze].join();
      if (key !== curveKey) {
        curveKey = key;
        curve = [];
        for (let i = 0; i <= 60; i++) curve.push(Math.min(80, optics(params, -1 + (2.3 * i) / 60).blur));
      }
      return curve;
    }

    return {
      reset() {
        photons = [];
        pulses = [];
        brainPulses = [];
      },
      resize() {
        buildCells();
      },
      onParam(k) {
        if (k === 'scene') this.reset();
      },
      update(dt) {
        t += dt;
        if (params.scene === 'retina') updateRetina(dt);
        else if (params.scene === 'brain') updateBrain(dt);
      },
      draw() {
        if (params.scene === 'retina') drawRetina();
        else if (params.scene === 'brain') drawBrain();
        else drawEye();
      },
      stats() {
        if (params.scene === 'retina') {
          const rate = photonRate();
          return [
            { label: 'Light', value: params.light === 'white' ? 'white (all colours)' : params.light === 'mix' ? '630 nm red + 532 nm green' : `${Math.round(params.nm)} nm ${hueName(params.nm)}` },
            { label: 'Photons arriving', value: Math.round(rate) + ' per second (shown)' },
            { label: 'Signals per second', value: `rods ${firing.rod.toFixed(1)} · cones ${(firing.S + firing.M + firing.L).toFixed(1)}` },
          ];
        }
        if (params.scene === 'brain') {
          const lost = { none: 'nothing', nerveL: 'all sight in the left eye', chiasm: 'the outer edges of both eyes’ views', tractR: 'the left half of the view, in both eyes' }[params.damage];
          return [
            { label: 'Left half of view', value: 'goes to the right side of the brain', color: FIELD_COL.left },
            { label: 'Right half of view', value: 'goes to the left side', color: FIELD_COL.right },
            { label: 'Lost', value: lost, color: params.damage === 'none' ? C.teal : C.red },
          ];
        }
        const o = optics(params);
        return [
          { label: 'Object distance', value: fmtDist(o.d) },
          { label: 'Lens squeeze', value: Math.round(o.squeeze * 100) + '%', color: o.squeeze > 0.98 && o.err < -0.3 ? C.amber : C.ink },
          { label: 'Focusing power', value: `${(o.P + o.G).toFixed(1)} dioptres${o.G ? ` (glasses ${o.G > 0 ? '+' : ''}${o.G})` : ''}` },
          { label: 'Picture on the retina', value: o.blur < 3 ? 'sharp' : `blurred (${Math.round(o.blur)}′ wide)`, color: o.blur < 3 ? C.teal : C.amber },
        ];
      },
      charts() {
        if (params.scene === 'retina') {
          const spec = spectrum(params);
          const sk = params.light + (params.light === 'single' ? Math.round(params.nm) : '');
          if (!sens) {
            sens = { S: [], M: [], L: [] };
            for (let nm = 400; nm <= 700; nm += 5) for (const k of ['S', 'M', 'L']) sens[k].push(SENS[k](nm));
          }
          if (sk !== specKey) {
            specKey = sk;
            specLine = [];
            for (let nm = 400; nm <= 700; nm += 5) specLine.push(spec.reduce((s, [l, wt]) => s + (Math.abs(l - nm) < 2.6 ? Math.min(1, wt * (params.light === 'white' ? 10 : 1)) : 0), 0) || (params.light === 'white' ? 0.7 : 0));
          }
          const resp = ['S', 'M', 'L', 'rod'].map((k) => absorbed(spec, k));
          const bar = (i) => resp.map((v, j) => (j === i ? v : 0));
          return [
            { title: 'Cone sensitivity: blue, green, red (dashed: the light)', series: [{ data: sens.S, color: CONE_COL.S, fill: false }, { data: sens.M, color: CONE_COL.M, fill: false }, { data: sens.L, color: CONE_COL.L, fill: false }], ref: { data: specLine, color: 'rgba(255,255,255,0.7)' }, min: 0, max: 1.05, xLabel: '400 nm (violet) → 700 nm (red)' },
            { title: 'How much each cell type absorbs: S · M · L · rods', kind: 'bars', series: [0, 1, 2, 3].map((i) => ({ data: bar(i), color: CONE_COL[['S', 'M', 'L', 'rod'][i]] })), min: 0, max: 1 },
          ];
        }
        if (params.scene === 'brain') return [];
        const o = optics(params);
        return [{ title: `Blur at each distance (now ${o.blur < 3 ? 'sharp' : Math.round(o.blur) + '′'})`, series: [{ data: blurCurve(), color: C.amber }], min: 0, max: 80, xLabel: '10 cm → 20 m   ·   low = sharp', yMaxLabel: 'very blurry' }];
      },
    };
  },
};
