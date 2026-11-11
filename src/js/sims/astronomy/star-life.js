import { C, TAU, clamp, easeInOut, drawGlow, tag, text, seeded } from '../../core/util.js';

// Evolutionary tracks: [stage, log T (K), log L (L☉), radius (R☉), seconds on screen, real duration]
const TRACKS = {
  0.3: [
    ['Protostar', 3.45, -0.6, 2, 3, '~100 million years'],
    ['Red dwarf (main sequence)', 3.5, -1.8, 0.3, 30, 'over 1 trillion years — longer than the universe has existed'],
  ],
  1: [
    ['Protostar', 3.6, 0.6, 3, 3, '~50 million years'],
    ['Main sequence (like the Sun)', 3.76, 0.0, 1, 10, '~10 billion years'],
    ['Subgiant', 3.7, 0.5, 2, 2.5, '~1 billion years'],
    ['Red giant', 3.6, 3.1, 150, 4, '~1 billion years'],
    ['Helium burning', 3.7, 1.7, 10, 2.5, '~100 million years'],
    ['Asymptotic giant', 3.5, 3.6, 220, 3, '~20 million years'],
    ['Planetary nebula', 4.6, 3.5, 0.1, 3, '~10,000 years'],
    ['White dwarf', 4.3, -1.5, 0.012, 4, 'cooling for billions of years'],
    ['Cool white dwarf', 3.8, -3.6, 0.01, 4, ''],
  ],
  5: [
    ['Protostar', 3.9, 2.2, 6, 2, '~1 million years'],
    ['Main sequence (blue-white)', 4.25, 2.8, 3, 6, '~100 million years'],
    ['Leaving the main sequence', 4.15, 3.0, 5, 1.5, '~1 million years'],
    ['Red giant', 3.62, 3.3, 60, 2.5, '~1 million years'],
    ['Blue loop', 4.0, 3.2, 20, 2.5, '~10 million years'],
    ['Asymptotic giant', 3.5, 4.0, 350, 2.5, '~1 million years'],
    ['Planetary nebula', 4.8, 3.9, 0.1, 2.5, '~10,000 years'],
    ['White dwarf', 4.5, 0, 0.01, 4, 'cooling for billions of years'],
  ],
  20: [
    ['Protostar', 4.2, 4.3, 10, 1.5, '~100,000 years'],
    ['Main sequence (blue giant)', 4.55, 4.7, 7, 4, '~8 million years'],
    ['Blue supergiant', 4.35, 5.0, 25, 1.5, '~1 million years'],
    ['Red supergiant', 3.55, 5.3, 900, 4, '~1 million years'],
    ['SUPERNOVA', 4.0, 9.5, 900, 1.5, 'a few weeks — outshines a whole galaxy'],
    ['Neutron star', 5.8, -1, 0.00001, 5, 'spinning remnant 20 km across'],
  ],
};

function tempColor(logT) {
  const T = Math.pow(10, logT);
  // approximate blackbody colour
  const t = clamp((T - 2500) / (30000 - 2500), 0, 1);
  const stops = [[255, 120, 50], [255, 180, 90], [255, 236, 200], [230, 240, 255], [160, 190, 255]];
  const f = Math.pow(t, 0.45) * (stops.length - 1);
  const k = Math.min(stops.length - 2, Math.floor(f)), u = f - k;
  return stops[k].map((c, i) => Math.round(c + (stops[k + 1][i] - c) * u));
}
const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');

export default {
  id: 'star-life',
  title: 'The Life of Stars',
  category: 'astronomy',
  tagline: 'Born in a cloud, burning for billions of years, dying as a dwarf — or a supernova.',
  ages: ['14-16', '16+'],
  topics: ['Space', 'Nuclear'],
  blurb:
    'A star’s whole life is decided by one number: its mass. Small stars sip their fuel and glow for trillions of years. Stars like the Sun shine for ten billion years, swell into red giants and fade as white dwarfs. Giants burn out in a few million years and explode, scattering the elements that make planets and people.',
  ideas: [
    'Stars shine by <b>fusing hydrogen into helium</b> in their cores.',
    'The <b>Hertzsprung–Russell diagram</b> plots brightness against temperature; stars move across it as they age.',
    'More massive stars burn <b>much faster</b> and die younger.',
    'Big stars end in <b>supernovae</b>, forging and scattering heavy elements — the iron in your blood came from one.',
  ],
  hint: 'Choose a star mass in the panel',
  thumbChapter: 3,
  thumbFrames: 30,
  params: [
    { key: 'mass', label: 'Star mass', type: 'select', value: 1, options: [{ value: 0.3, label: '0.3 M☉' }, { value: 1, label: '1 M☉ (Sun)' }, { value: 5, label: '5 M☉' }, { value: 20, label: '20 M☉' }] },
    { key: 'speed', label: 'Playback speed', type: 'range', min: 0.2, max: 3, step: 0.05, value: 1, format: (v) => v.toFixed(2) + '×' },
    { key: 'restart', label: 'Restart life', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'A star is born',
      text: 'A cold cloud of gas collapses under its own gravity and heats up. When its core reaches about 10 million °C, hydrogen nuclei begin to <b>fuse</b> into helium, releasing enormous energy. A star switches on.',
      params: { mass: 1, speed: 0.6 },
      enter: (s) => s.restart(),
      duration: 10,
    },
    {
      title: 'The long middle age',
      text: 'For 10 billion years a Sun-like star sits quietly on the <b>main sequence</b>, the diagonal band where most stars live, balancing gravity against the heat of fusion. Our Sun is about halfway through.',
      formula: 'E = mc²:  4 ¹H → ⁴He + energy',
      params: { mass: 1, speed: 0.6 },
      enter: (s) => s.jump(4),
      duration: 12,
    },
    {
      title: 'Red giant',
      text: 'When the core’s hydrogen runs out, it shrinks and heats while the outer layers balloon outward and cool. The star becomes a <b>red giant</b> 150 times its old size. In about 5 billion years the Sun will swallow Mercury and Venus.',
      params: { mass: 1, speed: 0.7 },
      enter: (s) => s.jump(13),
      duration: 13,
    },
    {
      title: 'A quiet ending',
      text: 'The giant puffs off its outer layers as a glowing <b>planetary nebula</b>, leaving its exposed core: a <b>white dwarf</b> the size of Earth but with half the Sun’s mass. It slowly cools and fades forever.',
      params: { mass: 1, speed: 0.8 },
      enter: (s) => s.jump(23.5),
      duration: 13,
    },
    {
      title: 'Live fast, die young',
      text: 'A star 20 times the Sun’s mass burns so fiercely it lasts only 8 million years. It swells into a red supergiant, then its core collapses in a fraction of a second and it explodes as a <b>supernova</b>, leaving a neutron star or black hole.',
      params: { mass: 20, speed: 0.8 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Small stars live forever',
      text: 'A red dwarf a third of the Sun’s mass burns so slowly it will shine for over a trillion years. Not one has ever died: the universe is too young.',
      params: { mass: 0.3, speed: 1 },
      enter: (s) => s.restart(),
      duration: 11,
    },
    {
      title: 'Explore',
      text: 'Pick a mass and watch its whole life play out on the H–R diagram.',
      params: { mass: 5, speed: 1 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0, trail = [], flash = 0;
    const rng = seeded(4);
    const field = [];
    for (let i = 0; i < 260; i++) {
      // background population: main sequence, giants, white dwarfs
      const r = rng();
      let lt, ll;
      if (r < 0.7) {
        lt = 3.45 + rng() * 1.1;
        ll = (lt - 3.76) * 6.2 + (rng() - 0.5) * 0.7;
      } else if (r < 0.88) {
        lt = 3.55 + rng() * 0.2;
        ll = 1.5 + rng() * 2.2;
      } else if (r < 0.95) {
        lt = 3.9 + rng() * 0.7;
        ll = -2.5 - rng() * 1.2 + (lt - 4) * 1.5;
      } else {
        lt = 3.5 + rng() * 0.9;
        ll = 4.3 + rng() * 1.2;
      }
      field.push([lt, ll, rng()]);
    }
    const bg = Array.from({ length: 140 }, () => [Math.random(), Math.random(), Math.random() * 0.5 + 0.1]);

    const track = () => TRACKS[params.mass] || TRACKS[1];
    function state() {
      const tr = track();
      let acc = 0;
      for (let i = 0; i < tr.length; i++) {
        const d = tr[i][4];
        if (t < acc + d || i === tr.length - 1) {
          const u = clamp((t - acc) / d, 0, 1);
          const nxt = tr[Math.min(tr.length - 1, i + 1)];
          // ease toward the next stage during the last third of this one
          const k = i === tr.length - 1 ? 0 : easeInOut(clamp((u - 0.65) / 0.35, 0, 1));
          const cur = tr[i];
          return {
            i,
            stage: k > 0.5 && i < tr.length - 1 ? nxt[0] : cur[0],
            note: k > 0.5 && i < tr.length - 1 ? nxt[5] : cur[5],
            lt: cur[1] + (nxt[1] - cur[1]) * k,
            ll: cur[2] + (nxt[2] - cur[2]) * k,
            rad: Math.exp(Math.log(cur[3]) + (Math.log(nxt[3]) - Math.log(cur[3])) * k),
            u,
            cur,
          };
        }
        acc += d;
      }
    }

    return {
      restart() {
        t = 0;
        trail = [];
        flash = 0;
      },
      jump(to) {
        t = to;
        trail = [];
      },
      reset() {
        t = 0;
        trail = [];
      },
      onParam(k) {
        if (k === 'mass') {
          t = 0;
          trail = [];
        }
      },
      update(dt) {
        const total = track().reduce((s, x) => s + x[4], 0);
        t = Math.min(total + 3, t + dt * params.speed);
        const s = state();
        if (s.stage === 'SUPERNOVA' && flash < 1) flash = Math.min(1, flash + dt * 3);
        else flash = Math.max(0, flash - dt * 0.4);
        if (s.stage !== 'SUPERNOVA') {
          const last = trail[trail.length - 1];
          if (!last || Math.hypot(last[0] - s.lt, last[1] - s.ll) > 0.01) trail.push([s.lt, s.ll]);
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#030409';
        ctx.fillRect(0, 0, w, h);
        for (const [x, y, a] of bg) {
          ctx.fillStyle = `rgba(220,230,255,${a})`;
          ctx.fillRect(x * w, y * h, 1, 1);
        }
        const s = state();
        const wide = w > 820;
        // H–R diagram
        const D = wide ? { x: w * 0.52, y: 90, w: w * 0.44, h: Math.min(h - 140, h * 0.68) } : { x: 20, y: h * 0.42, w: w - 40, h: h * 0.3 };
        const X = (lt) => D.x + ((4.8 - lt) / (4.8 - 3.35)) * D.w;
        const Y = (ll) => D.y + ((6.5 - ll) / 10.5) * D.h;
        ctx.fillStyle = 'rgba(12,16,34,0.7)';
        ctx.fillRect(D.x, D.y, D.w, D.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(D.x, D.y, D.w, D.h);
        for (const [lt, ll, a] of field) {
          if (ll > 6.4 || ll < -4) continue;
          ctx.fillStyle = hex(tempColor(lt));
          ctx.globalAlpha = 0.25 + a * 0.3;
          ctx.beginPath();
          ctx.arc(X(lt), Y(ll), 1.6, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (!api.thumbnail) {
          text(ctx, 'main sequence', X(4.1), Y(1.0), { size: 10, color: 'rgba(233,237,247,0.45)', align: 'center' });
          text(ctx, 'giants', X(3.62), Y(4.1), { size: 10, color: 'rgba(233,237,247,0.45)', align: 'center' });
          text(ctx, 'white dwarfs', X(4.15), Y(-3.4), { size: 10, color: 'rgba(233,237,247,0.45)', align: 'center' });
          text(ctx, '← hotter       temperature       cooler →', D.x + D.w / 2, D.y + D.h + 12, { size: 10, color: C.dim, align: 'center' });
          text(ctx, 'brighter ↑', D.x + 6, D.y + 12, { size: 10, color: C.dim });
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        trail.forEach(([lt, ll], i) => ctx[i ? 'lineTo' : 'moveTo'](X(clamp(lt, 3.35, 4.8)), Y(clamp(ll, -4, 6.5))));
        ctx.stroke();
        if (s.stage !== 'SUPERNOVA' && s.lt <= 4.8) {
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, X(clamp(s.lt, 3.35, 4.8)), Y(clamp(s.ll, -4, 6.5)), 16, hex(tempColor(s.lt)), 0.4);
          ctx.globalCompositeOperation = 'source-over';
        }

        // the star itself
        const cx = wide ? w * 0.25 : w * 0.5, cy = wide ? h * 0.45 : h * 0.24;
        const maxR = wide ? Math.min(w * 0.2, h * 0.3) : Math.min(w * 0.3, h * 0.14);
        const rpx = clamp(14 + Math.log10(Math.max(1e-5, s.rad) * 100) * (maxR / 4.6), 2, maxR);
        const col = tempColor(Math.min(s.lt, 4.7));
        if (s.stage === 'SUPERNOVA' || flash > 0.01) {
          ctx.globalCompositeOperation = 'lighter';
          const k = s.stage === 'SUPERNOVA' ? s.u : 1;
          drawGlow(ctx, cx, cy, maxR * (1 + k * 2.5), '#ffffff', 0.15 + 0.2 * flash);
          ctx.strokeStyle = `rgba(255,170,120,${0.6 * (1 - k * 0.5)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, maxR * k * 1.6 + 10, 0, TAU);
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
        if (s.stage === 'Planetary nebula' || (s.cur[0] === 'Planetary nebula')) {
          ctx.globalCompositeOperation = 'lighter';
          const k = s.u;
          for (const [rr, c] of [[1, '#2ee6a6'], [0.75, '#ff5fa2'], [0.5, '#38d6f5']]) {
            ctx.strokeStyle = c;
            ctx.globalAlpha = 0.35 * (1 - k * 0.6);
            ctx.lineWidth = 8 * rr;
            ctx.beginPath();
            ctx.ellipse(cx, cy, maxR * (0.4 + k * 0.8) * rr, maxR * (0.32 + k * 0.6) * rr, 0.4, 0, TAU);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        if (s.stage !== 'SUPERNOVA') {
          if (s.stage === 'Neutron star') {
            const a = api.time * 6;
            ctx.globalCompositeOperation = 'lighter';
            for (const sg of [1, -1]) {
              const gr = ctx.createLinearGradient(cx, cy, cx + sg * Math.cos(a) * maxR * 1.4, cy + sg * Math.sin(a) * maxR * 1.4);
              gr.addColorStop(0, 'rgba(160,190,255,0.8)');
              gr.addColorStop(1, 'rgba(160,190,255,0)');
              ctx.strokeStyle = gr;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.lineTo(cx + sg * Math.cos(a) * maxR * 1.4, cy + sg * Math.sin(a) * maxR * 1.4);
              ctx.stroke();
            }
            drawGlow(ctx, cx, cy, 20, '#a0beff', 0.4);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, cx, cy, rpx * 2.6, hex(col), 0.3);
            ctx.globalCompositeOperation = 'source-over';
            const g = ctx.createRadialGradient(cx - rpx * 0.2, cy - rpx * 0.2, rpx * 0.05, cx, cy, rpx);
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.35, hex(col));
            g.addColorStop(1, hex(col.map((v) => Math.round(v * 0.55))));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, rpx, 0, TAU);
            ctx.fill();
          }
        }
        if (!api.thumbnail) {
          // wide: label above the star, clear of the story card that covers the lower left
          const ty = wide ? Math.max(126, cy - maxR - 40) : Math.min(h - 30, cy + maxR + 30);
          tag(ctx, s.stage, cx, ty, s.stage === 'SUPERNOVA' ? C.red : C.amber, { align: 'center', size: 13 });
          if (s.note) text(ctx, s.note, cx, wide ? ty + 22 : Math.min(h - 8, ty + 26), { size: 11, align: 'center', color: C.dim });
        }
      },
      stats() {
        const s = state();
        return [
          { label: 'Stage', value: s.stage, color: C.amber },
          { label: 'Surface temperature', value: s.lt > 5 ? '~600,000 K' : Math.round(Math.pow(10, s.lt)).toLocaleString() + ' K' },
          { label: 'Brightness', value: s.ll > 8 ? '10 billion+ Suns' : Math.pow(10, s.ll) >= 1 ? Math.round(Math.pow(10, s.ll)).toLocaleString() + ' × Sun' : Math.pow(10, s.ll).toPrecision(2) + ' × Sun' },
          { label: 'Radius', value: s.rad < 0.001 ? '~10 km' : s.rad < 0.05 ? '~Earth-sized' : s.rad.toFixed(s.rad < 10 ? 1 : 0) + ' × Sun' },
        ];
      },
    };
  },
};
