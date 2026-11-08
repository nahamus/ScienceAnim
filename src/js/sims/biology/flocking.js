import { SpatialHash, drawGlow, fade, rand, TAU } from '../../core/util.js';

export default {
  id: 'flocking',
  title: 'Flocking & Emergence',
  category: 'biology',
  tagline: 'Three simple rules, no leader — and a murmuration of hundreds of birds appears.',
  ages: ['11-14', '14-16'],
  topics: ['Behaviour', 'Emergence', 'Modelling'],
  blurb:
    'Starlings, fish schools and locust swarms move as one, yet no individual is in charge. In 1986 Craig Reynolds showed that just three local rules — keep your distance, match your neighbours’ heading, and stay close to the group — are enough. Complex group behaviour emerges from simple individual decisions.',
  ideas: [
    '<b>Separation:</b> steer away from neighbours that are too close.',
    '<b>Alignment:</b> steer toward the average heading of nearby neighbours.',
    '<b>Cohesion:</b> steer toward the average position of nearby neighbours.',
    'Behaviour that arises from interactions, not central planning, is called <b>emergent</b>.',
  ],
  hint: 'Move your cursor over the flock — it’s a hawk',
  thumbChapter: 3,
  thumbFrames: 260,
  params: [
    { key: 'sep', label: 'Separation', type: 'range', min: 0, max: 3, step: 0.05, value: 0 },
    { key: 'ali', label: 'Alignment', type: 'range', min: 0, max: 3, step: 0.05, value: 0 },
    { key: 'coh', label: 'Cohesion', type: 'range', min: 0, max: 3, step: 0.05, value: 0 },
    { key: 'vision', label: 'Vision radius', type: 'range', min: 15, max: 120, step: 1, value: 55, unit: 'px' },
    { key: 'N', label: 'Birds', type: 'range', min: 50, max: 900, step: 10, value: 450, instant: true },
    { key: 'hawk', label: 'Roaming hawk', type: 'toggle', value: false },
  ],
  story: [
    {
      title: 'Every bird for itself',
      text: 'Hundreds of birds flying with no rules at all. They wander aimlessly, bumping into each other. No pattern, no group.',
      params: { sep: 0, ali: 0, coh: 0, hawk: false },
      duration: 8,
    },
    {
      title: 'Rule 1: Personal space',
      text: '<b>Separation</b>: each bird steers away from any neighbour that gets too close. Collisions stop, but there’s still no group.',
      params: { sep: 1.6, ali: 0, coh: 0 },
      duration: 10,
    },
    {
      title: 'Rule 2: Follow the crowd',
      text: '<b>Alignment</b>: each bird turns toward the average direction of its neighbours. Rivers of birds begin streaming together.',
      params: { sep: 1.6, ali: 1.2, coh: 0 },
      duration: 11,
    },
    {
      title: 'Rule 3: Stay together',
      text: '<b>Cohesion</b>: each bird drifts toward the centre of its neighbours. Now flocks form, swirl, merge and split — a murmuration. No bird sees the whole flock.',
      params: { sep: 1.6, ali: 1.2, coh: 0.9 },
      duration: 14,
    },
    {
      title: 'Enter the hawk',
      text: 'A predator dives through. Birds near it flee, and the panic ripples outward through the flock faster than any single bird could fly. Then they regroup.',
      params: { hawk: true },
      duration: 14,
    },
    {
      title: 'Tune the rules',
      text: 'Move your cursor to chase the flock. Try maximum cohesion with no separation, or alignment alone — tiny changes in rules give very different collective behaviour.',
      params: { hawk: false },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let boids = [], hawk = { x: 0, y: 0, vx: 120, vy: 40 }, first = true;
    const hash = new SpatialHash(60);

    function sync() {
      const n = Math.round(params.N);
      while (boids.length < n) {
        const a = rand(TAU);
        boids.push({ x: rand(api.w), y: rand(api.h), vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 });
      }
      if (boids.length > n) boids.length = n;
    }

    return {
      resize() {
        sync();
        first = true;
        hawk.x = api.w * 0.2;
        hawk.y = api.h * 0.3;
      },
      reset() {
        boids = [];
        sync();
      },
      onParam(k) {
        if (k === 'N') sync();
      },
      update(dt) {
        const { w, h } = api;
        sync();
        hash.cell = Math.max(20, params.vision);
        hash.clear();
        for (const b of boids) hash.insert(b);
        const near = [];
        const R = params.vision, R2 = R * R, sepR2 = (R * 0.45) ** 2;
        const p = api.pointer;
        const threats = [];
        if (p.inside) threats.push(p);
        if (params.hawk) threats.push(hawk);
        for (const b of boids) {
          hash.query(b.x, b.y, R, near);
          let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, cnt = 0;
          for (const o of near) {
            if (o === b) continue;
            let dx = o.x - b.x, dy = o.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > R2) continue;
            cnt++;
            ax += o.vx;
            ay += o.vy;
            cx += o.x;
            cy += o.y;
            if (d2 < sepR2 && d2 > 0) {
              sx -= dx / d2;
              sy -= dy / d2;
            }
          }
          let fx = rand(-1, 1) * 40, fy = rand(-1, 1) * 40;
          if (cnt) {
            fx += (ax / cnt - b.vx) * params.ali * 1.2;
            fy += (ay / cnt - b.vy) * params.ali * 1.2;
            fx += (cx / cnt - b.x) * params.coh * 1.6;
            fy += (cy / cnt - b.y) * params.coh * 1.6;
            fx += sx * params.sep * 2400;
            fy += sy * params.sep * 2400;
          }
          for (const t of threats) {
            const dx = b.x - t.x, dy = b.y - t.y, d2 = dx * dx + dy * dy;
            if (d2 < 130 * 130) {
              const d = Math.sqrt(d2) + 1;
              fx += (dx / d) * 2600 / (d * 0.05 + 1);
              fy += (dy / d) * 2600 / (d * 0.05 + 1);
            }
          }
          b.vx += fx * dt;
          b.vy += fy * dt;
          const s = Math.hypot(b.vx, b.vy) || 1;
          const sp = Math.min(Math.max(s, 70), 190);
          b.vx = (b.vx / s) * sp;
          b.vy = (b.vy / s) * sp;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < 0) b.x += w;
          if (b.x > w) b.x -= w;
          if (b.y < 0) b.y += h;
          if (b.y > h) b.y -= h;
        }
        if (params.hawk) {
          // chase the nearest bird
          let best = null, bd = Infinity;
          for (const b of boids) {
            const d = (b.x - hawk.x) ** 2 + (b.y - hawk.y) ** 2;
            if (d < bd) (bd = d), (best = b);
          }
          if (best) {
            hawk.vx += (best.x - hawk.x) * dt * 2.2;
            hawk.vy += (best.y - hawk.y) * dt * 2.2;
          }
          const s = Math.hypot(hawk.vx, hawk.vy) || 1;
          hawk.vx = (hawk.vx / s) * 215;
          hawk.vy = (hawk.vy / s) * 215;
          hawk.x = (hawk.x + hawk.vx * dt + w) % w;
          hawk.y = (hawk.y + hawk.vy * dt + h) % h;
        }
      },
      draw() {
        const { w, h } = api;
        if (first || api.thumbnail) {
          const g = ctx.createLinearGradient(0, 0, 0, h);
          g.addColorStop(0, '#0d1230');
          g.addColorStop(1, '#2a1630');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
          first = false;
        } else {
          fade(ctx, w, h, 0.28, '14,15,40');
        }
        ctx.lineWidth = 1;
        for (const b of boids) {
          const a = Math.atan2(b.vy, b.vx);
          const hue = ((a / TAU) * 360 + 360 + 180) % 360;
          const c = Math.cos(a), s = Math.sin(a);
          ctx.fillStyle = `hsla(${hue},85%,72%,0.95)`;
          ctx.beginPath();
          ctx.moveTo(b.x + c * 7, b.y + s * 7);
          ctx.lineTo(b.x - c * 4 - s * 3.2, b.y - s * 4 + c * 3.2);
          ctx.lineTo(b.x - c * 2, b.y - s * 2);
          ctx.lineTo(b.x - c * 4 + s * 3.2, b.y - s * 4 - c * 3.2);
          ctx.closePath();
          ctx.fill();
        }
        if (params.hawk) {
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, hawk.x, hawk.y, 40, '#ff4d6d', 0.25);
          ctx.globalCompositeOperation = 'source-over';
          const a = Math.atan2(hawk.vy, hawk.vx), c = Math.cos(a), s = Math.sin(a);
          ctx.fillStyle = '#ff6b81';
          ctx.beginPath();
          ctx.moveTo(hawk.x + c * 16, hawk.y + s * 16);
          ctx.lineTo(hawk.x - c * 10 - s * 11, hawk.y - s * 10 + c * 11);
          ctx.lineTo(hawk.x - c * 4, hawk.y - s * 4);
          ctx.lineTo(hawk.x - c * 10 + s * 11, hawk.y - s * 10 - c * 11);
          ctx.closePath();
          ctx.fill();
        }
      },
      stats() {
        // order parameter: how aligned the flock is (0 random … 1 all same heading)
        let sx = 0, sy = 0;
        for (const b of boids) {
          const s = Math.hypot(b.vx, b.vy) || 1;
          sx += b.vx / s;
          sy += b.vy / s;
        }
        const order = Math.hypot(sx, sy) / Math.max(1, boids.length);
        this._o = this._o || [];
        if (api.frame % 3 === 0) {
          this._o.push(order);
          if (this._o.length > 200) this._o.shift();
        }
        return [
          { label: 'Birds', value: String(boids.length) },
          { label: 'Alignment (order)', value: (order * 100).toFixed(0) + ' %' },
        ];
      },
      charts() {
        return this._o ? [{ title: 'How aligned the whole flock is', series: [{ data: this._o, color: '#a3e635' }], min: 0, max: 1, length: 200 }] : [];
      },
    };
  },
};
