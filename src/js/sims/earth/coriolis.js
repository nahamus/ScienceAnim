import { C, TAU, rand, drawGlow, tag, text, backdrop } from '../../core/util.js';

export default {
  id: 'coriolis',
  title: 'The Coriolis Effect',
  category: 'earth',
  tagline: 'On a spinning planet, straight lines bend — and that is why hurricanes spin.',
  blurb:
    'Throw a ball across a spinning merry-go-round and, to the riders, it curves away. Nothing pushed it; the ground turned underneath. Earth is a giant merry-go-round, so moving air and water are deflected too: to the right in the north, to the left in the south. That sets the spin of every hurricane.',
  ideas: [
    'In a rotating frame, moving objects seem pushed sideways by the <b>Coriolis effect</b>.',
    'Seen from outside, the ball flies perfectly straight — the platform turns under it.',
    'On Earth, winds are deflected <b>right</b> in the northern hemisphere and <b>left</b> in the southern.',
    'Air rushing into a low-pressure centre is deflected into a spiral: <b>hurricanes</b> spin opposite ways in each hemisphere.',
  ],
  hint: 'Click to throw a ball (carousel) or add a storm (storm)',
  thumbChapter: 3,
  thumbFrames: 500,
  params: [
    { key: 'mode', label: 'Scene', type: 'select', value: 'carousel', options: [{ value: 'carousel', label: 'Merry-go-round' }, { value: 'storm', label: 'Hurricane' }] },
    { key: 'spin', label: 'Platform spin', type: 'range', min: 0, max: 1.2, step: 0.01, value: 0.6, format: (v) => (v * 9.55).toFixed(1) + ' rpm' },
    { key: 'lat', label: 'Latitude (storm)', type: 'range', min: -60, max: 60, step: 1, value: 25, format: (v) => Math.abs(v) + '° ' + (v >= 0 ? 'N' : 'S') },
    { key: 'clear', label: 'Clear', type: 'button', action: (s) => s.clear() },
  ],
  story: [
    {
      title: 'A still merry-go-round',
      text: 'Two children sit opposite each other on a merry-go-round. One rolls a ball to the other. With the platform still, it goes straight across and is caught.',
      params: { mode: 'carousel', spin: 0 },
      enter: (s) => s.clear(),
      duration: 10,
    },
    {
      title: 'Now it spins',
      text: 'Set the platform turning and throw again. <b>Left</b>: seen from a balcony above, the ball still flies dead straight — but the catcher has moved on. <b>Right</b>: to the children riding along, the ball mysteriously <b>curves</b> away. That apparent push is the Coriolis effect.',
      formula: 'a_Coriolis = −2 Ω × v',
      params: { mode: 'carousel', spin: 0.7 },
      enter: (s) => s.clear(),
      duration: 16,
    },
    {
      title: 'Earth is spinning too',
      text: 'Earth turns once a day, so everything moving across its surface gets the same sideways nudge — gentle, but over hundreds of kilometres it adds up. In the northern hemisphere moving air is bent to the <b>right</b>.',
      params: { mode: 'storm', lat: 25 },
      enter: (s) => s.clear(),
      duration: 13,
    },
    {
      title: 'Birth of a hurricane',
      text: 'Over warm ocean, rising air leaves low pressure at the centre. Air rushes in from all sides — and every stream is bent to the right. Together they swirl into a giant <b>anticlockwise</b> spiral around a calm eye.',
      params: { mode: 'storm', lat: 25 },
      duration: 14,
    },
    {
      title: 'Down under',
      text: 'In the southern hemisphere the deflection is to the left, so cyclones spin <b>clockwise</b>. (The Coriolis effect is far too weak to decide which way your sink drains, though — that is a myth.)',
      params: { mode: 'storm', lat: -25 },
      enter: (s) => s.clear(),
      duration: 13,
    },
    {
      title: 'No spin at the equator',
      text: 'At the equator the local spin is zero, so air flows straight into the low and fills it before a vortex can form. Hurricanes almost never form within 5° of the equator.',
      formula: 'f = 2 Ω sin(latitude)',
      params: { mode: 'storm', lat: 0 },
      enter: (s) => s.clear(),
      duration: 12,
    },
    {
      title: 'Explore',
      text: 'Switch scenes, change the spin or the latitude, and click to throw balls or seed storms.',
      params: { mode: 'carousel', spin: 0.5 },
      enter: (s) => s.clear(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0, rot = 0, balls = [], throwT = 0.8, parcels = [], storms = [];

    function clear() {
      balls = [];
      parcels = [];
      storms = [];
      throwT = 0.8;
    }
    const panels = () => {
      const { w, h } = api;
      const wide = w > 700;
      const R = wide ? Math.min(w * 0.21, h * 0.3) : Math.min(w * 0.4, h * 0.17);
      if (wide) return { R, a: [w * 0.27, h * 0.42], b: [w * 0.73, h * 0.42] };
      return { R, a: [w * 0.5, 96 + R], b: [w * 0.5, 96 + 3 * R + 50] };
    };

    function throwBall() {
      const v = 1.15; // in platform radii per second
      // thrower sits at angle rot + π, catcher at rot
      const th = rot + Math.PI;
      const x = Math.cos(th), y = Math.sin(th);
      const vx = v, vy = 0; // aimed straight at the catcher (along +x in the rotating frame)
      // rotate aim into inertial frame and add the thrower's own spin velocity
      const c = Math.cos(rot), s = Math.sin(rot);
      const ivx = vx * c - vy * s - params.spin * y;
      const ivy = vx * s + vy * c + params.spin * x;
      balls.push({ x, y, vx: ivx, vy: ivy, path: [], t0: t, done: false });
      if (balls.length > 4) balls.shift();
    }

    function storm(x, y) {
      storms = [{ x, y }];
      parcels = [];
    }

    return {
      clear,
      reset: clear,
      onParam(k) {
        if (k === 'mode') clear();
      },
      pointerDown(p) {
        if (params.mode === 'carousel') throwBall();
        else storm(p.x, p.y);
      },
      update(dt) {
        t += dt;
        if (params.mode === 'carousel') {
          rot += params.spin * dt;
          throwT -= dt;
          if (throwT <= 0) {
            throwBall();
            throwT = 3.2;
          }
          for (const b of balls) {
            if (b.done) continue;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            // store inertial and co-rotating positions
            const c = Math.cos(-rot), s = Math.sin(-rot);
            b.path.push([b.x, b.y, b.x * c - b.y * s, b.x * s + b.y * c]);
            if (Math.hypot(b.x, b.y) > 1.02) b.done = true;
          }
        } else {
          const { w, h } = api;
          if (!storms.length) storms = [{ x: w * 0.55, y: h * 0.42 }];
          const f = 1.6 * Math.sin((params.lat * Math.PI) / 180);
          const Rm = Math.min(w, h) * 0.42;
          while (parcels.length < 360) {
            const a = rand(TAU), r = Rm * rand(0.75, 1);
            parcels.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, trail: [] });
          }
          const sub = 3, hh = dt / sub;
          for (const p of parcels) {
            for (let k = 0; k < sub; k++) {
              const r = Math.hypot(p.x, p.y) || 1;
              const G = 70 * Math.min(1, r / 60);
              // math coords (y up): Coriolis a = f (v_y, −v_x); friction keeps speeds sane
              const ax = (-G * p.x) / r + f * p.vy - 0.35 * p.vx;
              const ay = (-G * p.y) / r - f * p.vx - 0.35 * p.vy;
              p.vx += ax * hh;
              p.vy += ay * hh;
              p.x += p.vx * hh;
              p.y += p.vy * hh;
            }
            p.trail.push([p.x, p.y]);
            if (p.trail.length > 14) p.trail.shift();
            if (Math.hypot(p.x, p.y) < 14 || Math.hypot(p.x, p.y) > Rm * 1.4) p.dead = true;
          }
          parcels = parcels.filter((p) => !p.dead);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0a0f22', grid: params.mode === 'carousel' });
        if (params.mode === 'carousel') {
          const P = panels();
          const drawPanel = ([cx, cy], rotating) => {
            const R = P.R;
            const disc = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
            disc.addColorStop(0, '#26304f');
            disc.addColorStop(1, '#151b33');
            ctx.fillStyle = disc;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = 'rgba(160,180,240,0.35)';
            ctx.lineWidth = 2;
            ctx.stroke();
            const pr = rotating ? 0 : rot;
            // screen: y down, so a positive math angle appears anticlockwise when we negate y
            const S = (x, y) => [cx + x * R, cy - y * R];
            ctx.strokeStyle = 'rgba(160,180,240,0.15)';
            ctx.lineWidth = 1;
            for (let k = 0; k < 8; k++) {
              const a = pr + (k * TAU) / 8;
              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.lineTo(...S(Math.cos(a), Math.sin(a)));
              ctx.stroke();
            }
            // paths
            for (const b of balls) {
              ctx.strokeStyle = 'rgba(255,181,71,0.9)';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              b.path.forEach((q, i) => ctx[i ? 'lineTo' : 'moveTo'](...S(rotating ? q[2] : q[0], rotating ? q[3] : q[1])));
              ctx.stroke();
              const q = b.path[b.path.length - 1];
              if (q && !b.done) {
                ctx.globalCompositeOperation = 'lighter';
                drawGlow(ctx, ...S(rotating ? q[2] : q[0], rotating ? q[3] : q[1]), 12, '#ffb547', 0.4);
                ctx.globalCompositeOperation = 'source-over';
              }
            }
            // thrower (pink) and catcher (cyan)
            for (const [a, col] of [[pr + Math.PI, C.pink], [pr, C.cyan]]) {
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.arc(...S(Math.cos(a) * 0.93, Math.sin(a) * 0.93), 8, 0, TAU);
              ctx.fill();
            }
            if (!api.thumbnail) tag(ctx, rotating ? 'riding along (rotating view)' : 'from above (still view)', cx, cy - R - 22, rotating ? C.amber : C.ink, { align: 'center', size: 11 });
          };
          drawPanel(P.a, false);
          drawPanel(P.b, true);
        } else {
          const S = storms[0] || { x: w * 0.55, y: h * 0.42 };
          // ocean glow and eye
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, S.x, S.y, Math.min(w, h) * 0.5, '#1f4f9a', 0.5);
          ctx.globalCompositeOperation = 'source-over';
          ctx.lineCap = 'round';
          // bucket trails by speed so each bucket is one stroke call
          const buckets = [[], [], [], []];
          for (const p of parcels) {
            if (p.trail.length < 2) continue;
            const sp = Math.hypot(p.vx, p.vy);
            buckets[Math.min(3, Math.floor(sp / 35))].push(p);
          }
          ctx.lineWidth = 1.4;
          buckets.forEach((arr, k) => {
            ctx.strokeStyle = `rgba(${200 + k * 18},230,255,${0.25 + k * 0.2})`;
            ctx.beginPath();
            for (const p of arr) p.trail.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](S.x + x, S.y - y));
            ctx.stroke();
          });
          ctx.fillStyle = 'rgba(5,8,20,0.9)';
          ctx.beginPath();
          ctx.arc(S.x, S.y, 12, 0, TAU);
          ctx.fill();
          if (!api.thumbnail) {
            text(ctx, 'L', S.x, S.y + 1, { size: 13, align: 'center', weight: 700, color: C.red });
            const dir = params.lat > 2 ? 'anticlockwise ↺' : params.lat < -2 ? 'clockwise ↻' : 'no spin';
            tag(ctx, `${Math.abs(params.lat)}° ${params.lat >= 0 ? 'N' : 'S'}  ·  ${dir}`, w - 16, 84, C.cyan, { align: 'right', size: 12 });
          }
        }
      },
      stats() {
        if (params.mode === 'carousel') {
          const last = balls.filter((b) => b.done).pop();
          let miss = '—';
          if (last) {
            const q = last.path[last.path.length - 1];
            const ang = Math.atan2(q[3], q[2]);
            miss = ((ang * 180) / Math.PI).toFixed(0) + '°';
          }
          return [
            { label: 'Platform spin', value: (params.spin * 9.55).toFixed(1) + ' rpm' },
            { label: 'Ball misses catcher by', value: miss, color: C.amber },
          ];
        }
        const f = 2 * 7.29e-5 * Math.sin((params.lat * Math.PI) / 180);
        return [
          { label: 'Latitude', value: Math.abs(params.lat) + '° ' + (params.lat >= 0 ? 'N' : 'S') },
          { label: 'Coriolis parameter f', value: f.toExponential(2) + ' /s', color: C.cyan },
          { label: 'Rotation', value: params.lat > 2 ? 'anticlockwise' : params.lat < -2 ? 'clockwise' : 'none' },
        ];
      },
    };
  },
};
