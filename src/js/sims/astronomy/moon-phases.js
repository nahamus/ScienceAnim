import { C, TAU, drawGlow, tag, text } from '../../core/util.js';

const PHASES = ['New Moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full Moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
const MONTH = 29.53;

export default {
  id: 'moon-phases',
  title: 'Moon Phases & Eclipses',
  category: 'astronomy',
  tagline: 'Half the Moon is always lit. What changes is how much of that half we can see.',
  blurb:
    'The Moon makes no light of its own; it reflects sunlight. One half is always lit, but as the Moon circles Earth each month we see different amounts of that bright half, from a thin crescent to a full disc. Occasionally Sun, Earth and Moon line up exactly — and we get an eclipse.',
  ideas: [
    'The Sun always lights <b>half</b> of the Moon.',
    'The phase depends on the angle between the Sun, Earth and Moon — not on Earth’s shadow.',
    'A full cycle takes <b>29.5 days</b>, which is where the “month” comes from.',
    'The Moon’s orbit is tilted 5°, so <b>eclipses</b> only happen when the line-up is exact.',
  ],
  hint: 'Drag the Moon around its orbit',
  thumbChapter: 1,
  thumbFrames: 2,
  params: [
    { key: 'day', label: 'Day of lunar month', type: 'range', min: 0, max: 29.5, step: 0.1, value: 4, digits: 1 },
    { key: 'speed', label: 'Days per second', type: 'range', min: 0, max: 5, step: 0.1, value: 1.5 },
    { key: 'tilt', label: 'Realistic 5° orbit tilt', type: 'toggle', value: true },
    { key: 'node', label: 'Orbit orientation', type: 'range', min: 0, max: 360, step: 1, value: 60, unit: '°' },
  ],
  story: [
    {
      title: 'Always half lit',
      text: 'Seen from far above, sunlight streams in from the right. The Moon, like Earth, always has a bright day side facing the Sun and a dark night side. The big disc on the left shows what we see from Earth.',
      params: { speed: 1.5, tilt: true, node: 60 },
      duration: 12,
    },
    {
      title: 'Phases',
      text: 'As the Moon orbits, we see more or less of its day side. Between Earth and Sun it shows us its dark side: <b>new Moon</b>. A week later we see half of the lit half: <b>first quarter</b>. Opposite the Sun we see all of it: <b>full Moon</b>.',
      params: { speed: 2.5 },
      duration: 16,
    },
    {
      title: 'Not Earth’s shadow',
      text: 'A common myth says phases are Earth’s shadow falling on the Moon. They aren’t — at first quarter the shadow (grey cone) points nowhere near the Moon. Phases are just viewing angle.',
      params: { day: 7.4, speed: 0 },
      tween: 2,
      duration: 12,
    },
    {
      title: 'Eclipses need a perfect line-up',
      text: 'If the Moon’s orbit were flat with Earth’s, every full Moon would pass through Earth’s shadow (a <b>lunar eclipse</b>) and every new Moon would shadow Earth (a <b>solar eclipse</b>). Watch with the tilt switched off.',
      params: { tilt: false, speed: 2.5 },
      duration: 14,
    },
    {
      title: 'The 5° tilt',
      text: 'In reality the Moon’s orbit is tilted 5°, so usually it passes just above or below the shadow (see the side view). Only when a full or new Moon happens near a crossing point do we get an eclipse — a few times a year.',
      params: { tilt: true, node: 0, speed: 2.5 },
      duration: 15,
    },
    {
      title: 'Explore',
      text: 'Drag the Moon, or set the day of the month directly. Rotate the orbit’s orientation to make eclipses possible.',
      params: { speed: 1, tilt: true, node: 40 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let drag = false;
    const stars = Array.from({ length: 180 }, () => [Math.random(), Math.random(), Math.random() * 0.5 + 0.15]);
    const maria = [[-0.3, -0.25, 0.22], [0.15, -0.35, 0.16], [0.25, 0.05, 0.2], [-0.15, 0.2, 0.14], [0.05, 0.42, 0.1], [-0.42, 0.1, 0.12]];

    const geom = () => {
      const { w, h } = api;
      const wide = w > 760;
      return {
        ex: wide ? w * 0.62 : w * 0.5,
        ey: wide ? h * 0.42 : h * 0.27,
        R: wide ? Math.min(w * 0.22, h * 0.3) : Math.min(w * 0.33, h * 0.17),
        mx: wide ? w * 0.18 : w * 0.5,
        my: wide ? h * 0.36 : h * 0.66,
        mr: wide ? Math.min(w * 0.12, h * 0.17) : Math.min(w * 0.2, h * 0.09),
        wide,
      };
    };
    const ang = () => (params.day / MONTH) * TAU; // 0 = new moon (towards the Sun, on the right)
    const height = () => (params.tilt ? Math.sin(ang() - (params.node * Math.PI) / 180) : 0); // above/below ecliptic, ±1 = 5°

    function eclipse() {
      const a = ((ang() % TAU) + TAU) % TAU;
      const z = Math.abs(height());
      const full = Math.abs(a - Math.PI) < 0.09, nw = Math.min(a, TAU - a) < 0.09;
      if (z < 0.18 && full) return 'lunar';
      if (z < 0.12 && nw) return 'solar';
      return null;
    }

    function drawMoonFace(cx, cy, r, e, ecl) {
      // e: elongation (0 new, π full). Lit side on the right while waxing.
      ctx.fillStyle = '#16181f';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fill();
      const k = Math.cos(e); // 1 new, -1 full
      const waxing = Math.sin(e) >= 0;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.clip();
      const lit = ecl === 'lunar' ? '#b5482c' : '#e9e4d6';
      // lit half: right side while waxing, left while waning (as seen from the northern hemisphere)
      ctx.fillStyle = lit;
      ctx.beginPath();
      if (waxing) ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
      else ctx.arc(cx, cy, r, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.closePath();
      ctx.fill();
      // terminator: an ellipse that either carves the crescent (k > 0) or extends into a gibbous (k < 0)
      ctx.fillStyle = k > 0 ? '#16181f' : lit;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(0.01, Math.abs(k) * r), r, 0, 0, Math.PI * 2);
      ctx.fill();
      // maria texture
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(120,120,130,0.55)';
      for (const [x, y, s] of maria) {
        ctx.beginPath();
        ctx.arc(cx + x * r, cy + y * r, s * r, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.stroke();
    }

    return {
      pointerDown(p) {
        const g = geom();
        const a = ang();
        const mx = g.ex + Math.cos(a) * g.R, my = g.ey - Math.sin(a) * g.R;
        drag = Math.hypot(p.x - mx, p.y - my) < 40;
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        const g = geom();
        let a = Math.atan2(-(p.y - g.ey), p.x - g.ex);
        if (a < 0) a += TAU;
        api.runner.set('speed', 0);
        api.runner.set('day', Math.round(((a / TAU) * MONTH) * 10) / 10);
      },
      pointerUp() {
        drag = false;
      },
      update(dt) {
        if (params.speed > 0) {
          const v = (params.day + dt * params.speed) % MONTH;
          api.runner.params.day = v;
          api.runner.onParamChange?.('day', v);
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#030409';
        ctx.fillRect(0, 0, w, h);
        for (const [x, y, a] of stars) {
          ctx.fillStyle = `rgba(220,230,255,${a})`;
          ctx.fillRect(x * w, y * h, 1, 1);
        }
        const g = geom();
        const a = ang();
        const ecl = eclipse();
        // sunlight from the right
        const sun = ctx.createLinearGradient(w, 0, w * 0.6, 0);
        sun.addColorStop(0, 'rgba(255,200,110,0.18)');
        sun.addColorStop(1, 'rgba(255,200,110,0)');
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, w, h);
        if (!api.thumbnail) tag(ctx, 'sunlight ←', w - 16, 84, C.amber, { align: 'right', size: 11 });
        // Earth's shadow cone to the left
        const er = Math.max(14, g.R * 0.16);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.moveTo(g.ex, g.ey - er);
        ctx.lineTo(g.ex - g.R * 1.35, g.ey - er * 0.55);
        ctx.lineTo(g.ex - g.R * 1.35, g.ey + er * 0.55);
        ctx.lineTo(g.ex, g.ey + er);
        ctx.fill();
        // orbit
        ctx.strokeStyle = 'rgba(200,210,255,0.18)';
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.arc(g.ex, g.ey, g.R, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        // phase markers
        if (!api.thumbnail)
          for (let k = 0; k < 8; k += 2) {
            const b = (k / 8) * TAU;
            text(ctx, PHASES[k], g.ex + Math.cos(b) * (g.R + 34), g.ey - Math.sin(b) * (g.R + 22), { size: 10, align: 'center', color: 'rgba(233,237,247,0.4)' });
          }
        // Earth (day side right)
        const eg = ctx.createLinearGradient(g.ex - er, 0, g.ex + er, 0);
        eg.addColorStop(0, '#06122a');
        eg.addColorStop(0.5, '#1f5fb8');
        eg.addColorStop(1, '#8fd0ff');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(g.ex, g.ey, er, 0, TAU);
        ctx.fill();
        // Moon on its orbit (top view): lit side faces the Sun (right)
        const mx = g.ex + Math.cos(a) * g.R, my = g.ey - Math.sin(a) * g.R;
        const mr = Math.max(8, er * 0.45);
        ctx.fillStyle = '#1b1d24';
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, TAU);
        ctx.fill();
        ctx.fillStyle = ecl === 'lunar' ? '#b5482c' : '#e9e4d6';
        ctx.beginPath();
        ctx.arc(mx, my, mr, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        // line of sight
        ctx.strokeStyle = 'rgba(255,95,162,0.35)';
        ctx.beginPath();
        ctx.moveTo(g.ex, g.ey);
        ctx.lineTo(mx, my);
        ctx.stroke();
        if (ecl === 'solar') {
          ctx.fillStyle = 'rgba(0,0,0,0.85)';
          ctx.beginPath();
          ctx.arc(g.ex + er * 0.7, g.ey, er * 0.25, 0, TAU);
          ctx.fill();
        }

        // view from Earth
        const e = a; // elongation
        if (ecl === 'solar') {
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, g.mx, g.my, g.mr * 2.6, '#cfe0ff', 0.25);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(g.mx, g.my, g.mr, 0, TAU);
          ctx.fill();
        } else drawMoonFace(g.mx, g.my, g.mr, e, ecl);
        if (!api.thumbnail) {
          const idx = Math.round((((a % TAU) + TAU) % TAU) / (TAU / 8)) % 8;
          tag(ctx, ecl === 'lunar' ? 'LUNAR ECLIPSE' : ecl === 'solar' ? 'SOLAR ECLIPSE' : PHASES[idx], g.mx, g.my + g.mr + 24, ecl ? C.red : C.amber, { align: 'center', size: 12 });
          text(ctx, 'as seen from Earth', g.mx, g.my - g.mr - 16, { size: 10, align: 'center', color: C.dim });
        }

        // side view strip: Moon height above/below Earth's orbital plane
        if (params.tilt || !api.thumbnail) {
          const sx = g.wide ? g.ex - g.R : 20, sw = g.wide ? g.R * 2 : w - 40;
          const sy = g.wide ? Math.min(h - 60, g.ey + g.R + 70) : Math.min(h - 40, g.my + g.mr + 70);
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + sw, sy);
          ctx.stroke();
          const hz = height();
          const px = sx + sw / 2 + Math.cos(a) * (sw / 2) * 0.9;
          ctx.fillStyle = '#e9e4d6';
          ctx.beginPath();
          ctx.arc(px, sy - hz * 18, 4, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#3a7bff';
          ctx.beginPath();
          ctx.arc(sx + sw / 2, sy, 6, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(sx, sy - 5, sw / 2 - 6, 10);
          if (!api.thumbnail) text(ctx, 'side view (height exaggerated)', sx + sw / 2, sy + 18, { size: 10, align: 'center', color: C.dim });
        }
      },
      stats() {
        const a = ((ang() % TAU) + TAU) % TAU;
        const idx = Math.round(a / (TAU / 8)) % 8;
        return [
          { label: 'Phase', value: PHASES[idx], color: C.amber },
          { label: 'Lit portion visible', value: (((1 - Math.cos(a)) / 2) * 100).toFixed(0) + ' %' },
          { label: 'Day of cycle', value: params.day.toFixed(1) + ' / 29.5' },
          { label: 'Eclipse', value: eclipse() || 'none', color: eclipse() ? C.red : undefined },
        ];
      },
    };
  },
};
