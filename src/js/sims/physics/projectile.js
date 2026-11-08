import { C, TAU, clamp, rgba, drawGlow, tag, arrow, text } from '../../core/util.js';

const WORLDS = [
  { value: 9.81, label: 'Earth' },
  { value: 1.62, label: 'Moon' },
  { value: 3.71, label: 'Mars' },
  { value: 24.79, label: 'Jupiter' },
];
const COLORS = ['#ffb547', '#38d6f5', '#ff5fa2', '#a3e635', '#a78bfa', '#ff8a3d'];

/** Integrate one shot with quadratic drag; returns range, flight time and peak height. */
function simulate(deg, v, g, k) {
  const a = (deg * Math.PI) / 180;
  let x = 0, y = 0, vx = v * Math.cos(a), vy = v * Math.sin(a), t = 0, H = 0;
  const dt = (2 * v) / g / 400;
  for (let i = 0; i < 4000; i++) {
    const s = Math.hypot(vx, vy);
    vx += -k * s * vx * dt;
    vy += (-g - k * s * vy) * dt;
    const ny = y + vy * dt;
    if (ny < 0) {
      const f = y / (y - ny);
      x += vx * dt * f;
      t += dt * f;
      break;
    }
    x += vx * dt;
    y = ny;
    t += dt;
    if (y > H) H = y;
  }
  return { range: x, T: t, H };
}

function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 2 ? 2 : m < 5 ? 5 : 10) * p;
}

export default {
  id: 'projectile',
  title: 'Projectile Motion',
  category: 'physics',
  tagline: 'Why a 45° throw goes farthest — until the air gets in the way.',
  ages: ['14-16', '16+'],
  topics: ['Forces', 'Motion'],
  blurb:
    'Anything thrown — a ball, an arrow, a cannonball — follows the same curve. Gravity pulls it down while it keeps drifting sideways, and the two motions never interfere. Launch shells, compare angles, add air resistance and try other planets.',
  ideas: [
    'Horizontal and vertical motion are <b>independent</b>: sideways speed stays constant, vertical speed changes steadily.',
    'With no air the path is a perfect <b>parabola</b> and 45° gives the longest range.',
    'Angles that add to 90° (like 30° and 60°) land at the <b>same spot</b>.',
    'Air resistance shortens every shot and lowers the best angle below 45°.',
  ],
  hint: 'Click anywhere to aim and fire',
  thumbChapter: 2,
  thumbFrames: 420,
  params: [
    { key: 'angle', label: 'Launch angle', type: 'range', min: 5, max: 85, step: 1, value: 30, unit: '°' },
    { key: 'speed', label: 'Launch speed', type: 'range', min: 10, max: 60, step: 1, value: 30, unit: 'm/s' },
    { key: 'drag', label: 'Air resistance', type: 'range', min: 0, max: 0.03, step: 0.001, value: 0, format: (v) => (v < 0.0005 ? 'none (vacuum)' : (v * 1000).toFixed(0) + ' ×10⁻³ /m') },
    { key: 'g', label: 'World', type: 'select', value: 9.81, options: WORLDS },
    { key: 'parts', label: 'Show velocity components', type: 'toggle', value: false },
    { key: 'auto', label: 'Auto-fire', type: 'toggle', value: true },
    { key: 'fire', label: 'Fire', type: 'button', action: (s) => s.fire() },
    { key: 'clear', label: 'Clear trails', type: 'button', action: (s) => s.clear() },
  ],
  story: [
    {
      title: 'Throw something',
      text: 'A cannon fires a shell at 30 m/s. It rises, slows, stops climbing at the top, then falls back down along a smooth arc. Every thrown object in the universe follows this shape.',
      params: { angle: 35, speed: 30, drag: 0, g: 9.81, parts: false, auto: true },
      enter: (s) => s.clear(),
      duration: 10,
    },
    {
      title: 'Two motions in one',
      text: 'Split the velocity into parts. The <b style="color:#38d6f5">sideways</b> arrow never changes — nothing pushes sideways. The <b style="color:#ff5fa2">vertical</b> arrow shrinks, flips and grows: gravity steadily pulls it down.',
      formula: 'x = v₀ cos θ · t,     y = v₀ sin θ · t − ½ g t²',
      params: { parts: true, angle: 50, drag: 0, g: 9.81, auto: true },
      enter: (s) => s.clear(),
      duration: 14,
    },
    {
      title: 'Which angle goes farthest?',
      check: {
        q: 'Same speed, no air. Which launch angle sends the ball farthest?',
        options: ['30°', '45°', '60°', '75°'],
        answer: 1,
        setup: { parts: false, auto: false, angle: 30, drag: 0, g: 9.81 },
        explain: '45° shares the speed evenly between going up (which buys time in the air) and going along (distance each second). 30° and 60° land in the same place: complementary angles always tie.',
      },
      text: 'Fire at 15°, 30°, 45°, 60° and 75°. The 45° shot lands farthest. And look closely: 30° and 60° land at the <b>same spot</b>, as do 15° and 75°.',
      formula: 'range = v₀² · sin 2θ / g',
      params: { parts: false, auto: false, angle: 45, drag: 0, g: 9.81 },
      enter: (s) => s.fan(),
      duration: 15,
    },
    {
      title: 'Now add air',
      check: {
        q: 'Now add air resistance. What happens to the best angle?',
        options: ['It rises above 45°', 'It stays at 45°', 'It drops below 45°'],
        answer: 2,
        setup: { drag: 0, angle: 45, g: 9.81, auto: false, parts: false },
        explain: 'Drag steals speed the whole way, and a shot that stays up longer loses more. Flatter, quicker shots waste less, so the best angle drops below 45°.',
      },
      text: 'Real air pushes back harder the faster you go. Every shot falls short, the arcs become lopsided — steeper on the way down — and the best angle drops below 45°. See the chart: dashed is vacuum, solid is with air.',
      params: { drag: 0.012, angle: 45, g: 9.81, auto: false, parts: false },
      enter: (s) => s.fan(),
      duration: 16,
    },
    {
      title: 'Other worlds',
      check: {
        q: 'Gravity on the Moon is about one-sixth of Earth’s. The same throw goes…',
        options: ['about as far', 'about 2× as far', 'about 6× as far', 'about 36× as far'],
        answer: 2,
        setup: { g: 9.81, drag: 0, angle: 45, parts: false },
        explain: 'Range = v² sin 2θ / g. One-sixth the gravity means six times the hang time and six times the distance.',
      },
      text: 'On the Moon gravity is six times weaker. The same throw sails about six times farther and hangs in the sky six times longer. On Jupiter it barely leaves the barrel.',
      params: { g: 1.62, drag: 0, auto: true, angle: 45, parts: false },
      enter: (s) => s.clear(),
      duration: 13,
    },
    {
      title: 'Your turn',
      text: 'Click anywhere above the ground to aim and fire. Change speed, angle, air and planet, and use the chart to predict the best angle before you try it.',
      params: { g: 9.81, drag: 0.006, auto: false },
      enter: (s) => s.clear(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let shots = [], queue = [], puffs = [], scale = 6, nextColor = 0, autoT = 1.5, warp = 1, shown = params.angle;
    let curveCache = { key: '', data: [], ref: [] };
    const gy = () => api.h - Math.max(80, Math.min(230, api.h * 0.27));
    const ox = () => Math.max(60, api.w * 0.07);

    function fire(deg = params.angle) {
      const g = Number(params.g);
      const a = (deg * Math.PI) / 180;
      const v = params.speed;
      shots.push({ x: 0, y: 0, vx: v * Math.cos(a), vy: v * Math.sin(a), trail: [[0, 0]], landed: false, col: COLORS[nextColor++ % COLORS.length], deg, t: 0, H: 0, k: params.drag, g, age: 0 });
      if (shots.length > 7) shots.shift();
      for (let i = 0; i < 18; i++) {
        const b = a + (Math.random() - 0.5) * 0.6;
        puffs.push({ x: 0, y: 0, vx: Math.cos(b) * (4 + Math.random() * 6), vy: Math.sin(b) * (4 + Math.random() * 6), life: 1, muzzle: true });
      }
    }
    function clear() {
      shots = [];
      queue = [];
      puffs = [];
      autoT = 0.6;
    }
    function fan() {
      clear();
      [15, 30, 45, 60, 75].forEach((d, i) => queue.push({ t: 0.4 + i * 0.55, deg: d }));
    }

    return {
      fire,
      clear,
      fan,
      reset: clear,
      pointerDown(p) {
        const sx = p.x - ox(), sy = gy() - p.y;
        if (sy < 4) return;
        const deg = clamp(Math.round((Math.atan2(sy, Math.max(1, sx)) * 180) / Math.PI), 5, 85);
        api.runner.set('angle', deg);
        fire(deg);
      },
      update(dt) {
        const g = Number(params.g);
        const v = params.speed;
        const Tvac = (2 * v) / g;
        warp = Math.max(1, Tvac / 3.2);
        shown += (params.angle - shown) * Math.min(1, dt * 8);
        for (const q of queue) q.t -= dt;
        while (queue.length && queue[0].t <= 0) {
          const q = queue.shift();
          api.runner.set('angle', q.deg);
          shown = q.deg;
          fire(q.deg);
        }
        const sdt = (dt * warp) / 6;
        for (const s of shots) {
          s.age += dt;
          if (s.landed) continue;
          for (let i = 0; i < 6 && !s.landed; i++) {
            const sp = Math.hypot(s.vx, s.vy);
            s.vx += -s.k * sp * s.vx * sdt;
            s.vy += (-s.g - s.k * sp * s.vy) * sdt;
            const ny = s.y + s.vy * sdt;
            if (ny < 0) {
              const f = s.y / (s.y - ny);
              s.x += s.vx * sdt * f;
              s.y = 0;
              s.t += sdt * f;
              s.landed = true;
              s.trail.push([s.x, 0]);
              for (let j = 0; j < 26; j++) {
                const b = Math.PI * (0.1 + Math.random() * 0.8);
                puffs.push({ x: s.x, y: 0, vx: Math.cos(b) * (3 + Math.random() * 7), vy: Math.sin(b) * (3 + Math.random() * 9), life: 1 });
              }
              break;
            }
            s.x += s.vx * sdt;
            s.y = ny;
            s.t += sdt;
            if (s.y > s.H) s.H = s.y;
          }
          const last = s.trail[s.trail.length - 1];
          if (!s.landed && Math.hypot(s.x - last[0], s.y - last[1]) * scale > 3) s.trail.push([s.x, s.y]);
        }
        for (const p of puffs) {
          p.life -= dt * (p.muzzle ? 2.2 : 1.3);
          p.x += p.vx * dt * (p.muzzle ? 1 : 0.6);
          p.y += p.vy * dt * (p.muzzle ? 1 : 0.6);
          p.vy -= 6 * dt;
        }
        puffs = puffs.filter((p) => p.life > 0);
        // auto-fire once the sky is clear
        if (params.auto && !queue.length && shots.every((s) => s.landed)) {
          autoT -= dt;
          if (autoT <= 0) {
            fire();
            autoT = 1.2;
          }
        }
        // camera: fit the vacuum max range and the current peak
        const R = (v * v) / g;
        const a = (Math.max(params.angle, 45) * Math.PI) / 180;
        const H = (v * v * Math.sin(a) ** 2) / (2 * g);
        const target = Math.min((api.w - ox() - 50) / R, (gy() - 90) / H);
        scale += (target - scale) * Math.min(1, dt * 2.5);
      },
      draw() {
        const { w, h } = api;
        const G = gy(), O = ox();
        const g = Number(params.g);
        const world = WORLDS.find((x) => x.value === g)?.label || '';
        const sky = ctx.createLinearGradient(0, 0, 0, G);
        sky.addColorStop(0, world === 'Moon' ? '#020308' : world === 'Mars' ? '#140806' : world === 'Jupiter' ? '#120c06' : '#050a1c');
        sky.addColorStop(1, world === 'Moon' ? '#0b0d16' : world === 'Mars' ? '#3a1810' : world === 'Jupiter' ? '#3a2614' : '#16264a');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, G);
        const ground = ctx.createLinearGradient(0, G, 0, h);
        const gc = world === 'Moon' ? ['#3a3d48', '#101116'] : world === 'Mars' ? ['#7a3420', '#1c0b06'] : world === 'Jupiter' ? ['#8a5a30', '#24160b'] : ['#1f4a2e', '#08140c'];
        ground.addColorStop(0, gc[0]);
        ground.addColorStop(1, gc[1]);
        ctx.fillStyle = ground;
        ctx.fillRect(0, G, w, h - G);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(0, G, w, 1);

        const X = (m) => O + m * scale;
        const Y = (m) => G - m * scale;

        // distance ticks
        const step = niceStep(70 / scale);
        ctx.fillStyle = 'rgba(233,237,247,0.4)';
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        for (let m = step; X(m) < w - 10; m += step) {
          ctx.fillRect(Math.round(X(m)), G, 1, 6);
          ctx.fillText(m + ' m', X(m), G + 18);
        }
        // height ticks
        ctx.textAlign = 'right';
        for (let m = step; Y(m) > 70; m += step) {
          ctx.fillStyle = 'rgba(140,160,220,0.06)';
          ctx.fillRect(O, Math.round(Y(m)), w - O, 1);
          ctx.fillStyle = 'rgba(233,237,247,0.32)';
          ctx.fillText(m + ' m', O - 8, Y(m) + 3);
        }

        // predicted vacuum path for the current setting
        const a = (shown * Math.PI) / 180;
        const v = params.speed;
        const T = (2 * v * Math.sin(a)) / g;
        ctx.setLineDash([3, 6]);
        ctx.strokeStyle = 'rgba(233,237,247,0.22)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const t = (T * i) / 60;
          const x = v * Math.cos(a) * t, y = v * Math.sin(a) * t - 0.5 * g * t * t;
          ctx[i ? 'lineTo' : 'moveTo'](X(x), Y(Math.max(0, y)));
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // trails
        ctx.lineCap = ctx.lineJoin = 'round';
        for (const s of shots) {
          const fadeA = s.landed ? Math.max(0.35, 1 - s.age * 0.02) : 1;
          ctx.strokeStyle = rgba(s.col, 0.85 * fadeA);
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          s.trail.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](X(x), Y(y)));
          if (!s.landed) ctx.lineTo(X(s.x), Y(s.y));
          ctx.stroke();
          if (s.landed) {
            ctx.fillStyle = s.col;
            ctx.fillRect(X(s.x) - 1, G - 8, 2, 8);
          }
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const s of shots) if (!s.landed) drawGlow(ctx, X(s.x), Y(s.y), 20, s.col);
        for (const p of puffs) {
          ctx.globalAlpha = p.life * 0.5;
          drawGlow(ctx, X(p.x), Y(p.y), (p.muzzle ? 10 : 7) + (1 - p.life) * 10, p.muzzle ? '#ffd27a' : '#c8b49a', 0.1);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        {
          // labels on landed shots, staggered to avoid overlaps
          const landed = shots.filter((s) => s.landed).sort((p, q) => p.x - q.x);
          let lastX = -1e9, row = 0;
          for (const s of landed) {
            row = X(s.x) - lastX < 70 ? row + 1 : 0;
            lastX = X(s.x);
            tag(ctx, `${s.deg}° · ${s.x.toFixed(1)} m`, X(s.x), G - 22 - row * 22, s.col, { align: 'center', size: 10 });
          }
        }

        // velocity components on the newest flying shot
        const fly = [...shots].reverse().find((s) => !s.landed);
        if (params.parts && fly) {
          const k = Math.min(3, 90 / v);
          const px = X(fly.x), py = Y(fly.y);
          arrow(ctx, px, py, px + fly.vx * k, py, C.cyan, 2.5);
          arrow(ctx, px, py, px, py - fly.vy * k, C.pink, 2.5);
          arrow(ctx, px, py, px + fly.vx * k, py - fly.vy * k, 'rgba(255,255,255,0.9)', 1.6);
          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.beginPath();
          ctx.moveTo(px + fly.vx * k, py);
          ctx.lineTo(px + fly.vx * k, py - fly.vy * k);
          ctx.lineTo(px, py - fly.vy * k);
          ctx.stroke();
          ctx.setLineDash([]);
          text(ctx, `vx ${fly.vx.toFixed(1)}`, px + fly.vx * k + 6, py + 12, { size: 11, color: C.cyan, mono: true });
          text(ctx, `vy ${fly.vy.toFixed(1)}`, px + 8, py - fly.vy * k - (fly.vy > 0 ? 8 : -12), { size: 11, color: C.pink, mono: true });
        }

        // cannon
        ctx.save();
        ctx.translate(O, G);
        ctx.strokeStyle = 'rgba(255,181,71,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 46, -a, 0);
        ctx.stroke();
        ctx.rotate(-a);
        const bg = ctx.createLinearGradient(0, -8, 0, 8);
        bg.addColorStop(0, '#9aa4c4');
        bg.addColorStop(0.5, '#4a5272');
        bg.addColorStop(1, '#1d2236');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(-6, -7, 42, 14, 5) : ctx.rect(-6, -7, 42, 14);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#2b3150';
        ctx.beginPath();
        ctx.arc(O, G, 13, Math.PI, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.stroke();
        text(ctx, `${Math.round(shown)}°`, O + 52, G - 14, { size: 12, color: C.amber, mono: true });
        if (warp > 1.05) tag(ctx, `time ×${warp.toFixed(1)}`, w - 16, 84, C.dim, { align: 'right', size: 10 });
      },
      stats() {
        const last = [...shots].reverse().find((s) => s.landed);
        const g = Number(params.g);
        const best = curveCache.data.length ? 5 + 5 * curveCache.data.indexOf(Math.max(...curveCache.data)) : 45;
        return [
          { label: 'World gravity', value: g.toFixed(2) + ' m/s²' },
          { label: 'Last range', value: last ? last.x.toFixed(1) + ' m' : '—', color: last?.col },
          { label: 'Last peak height', value: last ? last.H.toFixed(1) + ' m' : '—' },
          { label: 'Last flight time', value: last ? last.t.toFixed(2) + ' s' : '—' },
          { label: 'Best angle (this setup)', value: '≈ ' + best + '°', color: C.amber },
        ];
      },
      charts() {
        const g = Number(params.g);
        const key = `${params.speed.toFixed(1)}|${g}|${params.drag.toFixed(4)}`;
        if (curveCache.key !== key) {
          const data = [], ref = [];
          for (let d = 5; d <= 85; d += 5) {
            data.push(simulate(d, params.speed, g, params.drag).range);
            const r = (d * Math.PI) / 180;
            ref.push((params.speed ** 2 * Math.sin(2 * r)) / g);
          }
          curveCache = { key, data, ref };
        }
        return [
          {
            title: 'Range vs launch angle (5°–85°)',
            series: [{ data: curveCache.data, color: C.amber, label: params.drag > 0.0005 ? 'with air' : 'vacuum' }],
            ref: { data: curveCache.ref, color: 'rgba(255,255,255,0.5)' },
            min: 0,
            xLabel: '5°  ←  angle  →  85°',
          },
        ];
      },
    };
  },
};
