import { C, TAU, clamp, CMAPS, tag, text, arrow } from '../../core/util.js';

// Joukowski airfoil in potential flow (exact solution with the Kutta condition).
const CC = 1; // Joukowski constant
const DEG = Math.PI / 180;

const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => {
  const d = b[0] * b[0] + b[1] * b[1] || 1e-12;
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
function csqrt([x, y]) {
  const r = Math.hypot(x, y);
  const re = Math.sqrt((r + x) / 2), im = Math.sign(y || 1) * Math.sqrt(Math.max(0, (r - x) / 2));
  return [re, im];
}

export default {
  id: 'lift',
  title: 'How Wings Fly',
  category: 'physics',
  tagline: 'Air races over the top of a wing, pressure drops, and 400 tonnes of aircraft rise.',
  blurb:
    'A wing is shaped and tilted so it turns the air flowing past it downward. In doing so the air above speeds up and its pressure falls, while the air below slows and pushes up. This simulation solves the classic equations for air flowing around a wing and shows the speed, pressure and resulting lift.',
  ideas: [
    'Air over the top of the wing moves <b>faster</b> — much faster than the air beneath.',
    'Faster air has <b>lower pressure</b> (Bernoulli): the wing is sucked upward from above and pushed from below.',
    'Tilting the wing up (<b>angle of attack</b>) or curving it (<b>camber</b>) increases lift.',
    'Tilt too far and the airflow tears away from the top: the wing <b>stalls</b>.',
  ],
  hint: 'Drag up or down to change the angle of attack',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 260,
  params: [
    { key: 'alpha', label: 'Angle of attack', type: 'range', min: -8, max: 24, step: 0.5, value: 5, unit: '°', digits: 1 },
    { key: 'camber', label: 'Camber (curve)', type: 'range', min: 0, max: 0.2, step: 0.005, value: 0.08, instant: true },
    { key: 'thick', label: 'Thickness', type: 'range', min: 0.04, max: 0.2, step: 0.005, value: 0.1, instant: true },
    { key: 'U', label: 'Airspeed', type: 'range', min: 0.4, max: 2, step: 0.05, value: 1, format: (v) => (v * 250).toFixed(0) + ' km/h' },
    { key: 'mode', label: 'Tracers', type: 'select', value: 'streaks', options: [{ value: 'streaks', label: 'Streaks' }, { value: 'timing', label: 'Timing lines' }] },
    { key: 'pressure', label: 'Show pressure', type: 'toggle', value: false },
  ],
  story: [
    {
      title: 'Air meets a wing',
      text: 'A wing cross-section sits in a steady wind (from the left). The air splits at the front edge, flows around both sides and leaves smoothly from the sharp back edge. Brighter, longer streaks mean faster air.',
      params: { alpha: 5, camber: 0.08, thick: 0.1, U: 1, mode: 'streaks', pressure: false },
      duration: 11,
    },
    {
      title: 'The race over the top',
      text: 'Release lines of smoke all at once. The air over the top doesn’t just keep pace with the air below — it arrives at the back edge <b>well ahead</b>. (The popular “equal transit time” story is wrong: the top air wins easily.)',
      params: { mode: 'timing', pressure: false, alpha: 6 },
      duration: 14,
    },
    {
      title: 'Low pressure above',
      text: 'Fast-moving air has lower pressure — Bernoulli’s principle. Blue shows suction above the wing, red shows higher pressure below. The difference adds up to a strong upward force: <b>lift</b>.',
      formula: 'p + ½ρv² = constant',
      params: { mode: 'streaks', pressure: true, alpha: 6 },
      duration: 14,
    },
    {
      title: 'Tilt it up',
      text: 'Increase the angle of attack and the wing deflects more air downward. The suction grows and the lift arrow lengthens. Pilots raise the nose to climb or to fly slowly when landing.',
      formula: 'L = ½ ρ v² S C_L',
      params: { alpha: 12, pressure: true, mode: 'streaks' },
      tween: 4,
      duration: 13,
    },
    {
      title: 'Stall',
      text: 'Go past about 15° and the air can no longer follow the curved top surface. It breaks away into turbulent swirls, the suction collapses and lift drops suddenly. This is a <b>stall</b> — and why stall warnings blare in cockpits.',
      params: { alpha: 21, pressure: true },
      tween: 4,
      duration: 13,
    },
    {
      title: 'Design a wing',
      text: 'Change camber, thickness, angle and speed. Doubling airspeed gives four times the lift — that is why planes need long runways to get fast enough.',
      params: { alpha: 5, camber: 0.1, pressure: true, mode: 'streaks' },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let parts = [], spawnAcc = 0, group = 0, groupT = 0, field = null, fieldKey = '', drag = null;

    function geo() {
      const eps = params.thick * 0.9, del = params.camber;
      const mu = [-eps, del];
      const R = Math.hypot(CC + eps, del);
      const beta = Math.atan2(del, CC + eps);
      const a = params.alpha * DEG;
      const stall = Math.max(0, params.alpha - 14);
      const gFac = stall > 0 ? Math.max(0.4, 1 - stall / 9) : 1;
      const G = 4 * Math.PI * params.U * R * Math.sin(a + beta) * gFac;
      return { mu, R, a, G, stall };
    }

    function toZeta(z, g) {
      const disc = csqrt([z[0] * z[0] - z[1] * z[1] - 4 * CC * CC, 2 * z[0] * z[1]]);
      const z1 = [(z[0] + disc[0]) / 2, (z[1] + disc[1]) / 2];
      const z2 = [(z[0] - disc[0]) / 2, (z[1] - disc[1]) / 2];
      const d1 = Math.hypot(z1[0] - g.mu[0], z1[1] - g.mu[1]), d2 = Math.hypot(z2[0] - g.mu[0], z2[1] - g.mu[1]);
      return d1 >= d2 ? [z1, d1] : [z2, d2];
    }

    /** Velocity (u, v) at wing-frame point z. */
    function vel(z, g) {
      const [zeta, d] = toZeta(z, g);
      if (d < g.R * 1.001) return null;
      const U = params.U;
      const s = [zeta[0] - g.mu[0], zeta[1] - g.mu[1]];
      const eIa = [Math.cos(g.a), Math.sin(g.a)], eMa = [Math.cos(g.a), -Math.sin(g.a)];
      const s2 = cmul(s, s);
      const t1 = [U * eMa[0], U * eMa[1]];
      const t2 = cdiv([U * g.R * g.R * eIa[0], U * g.R * g.R * eIa[1]], s2);
      const t3 = cdiv([0, g.G / TAU], s);
      const dW = [t1[0] - t2[0] + t3[0], t1[1] - t2[1] + t3[1]];
      const z2 = cmul(zeta, zeta);
      const J = cdiv([CC * CC, 0], z2);
      const w = cdiv(dW, [1 - J[0], -J[1]]);
      return [w[0], -w[1]];
    }

    const view = () => {
      const { w, h } = api;
      const S = Math.min(w * 0.17, h * 0.2);
      return { S, cx: w * 0.5, cy: h * 0.42 };
    };
    // wing frame → screen: rotate by −α so the free stream is horizontal and the wing pitches up
    const toScreen = (z, g, v) => {
      const c = Math.cos(g.a), s = Math.sin(g.a);
      const x = z[0] * c + z[1] * s, y = -z[0] * s + z[1] * c;
      return [v.cx + x * v.S, v.cy - y * v.S];
    };
    const toWing = (px, py, g, v) => {
      const x = (px - v.cx) / v.S, y = -(py - v.cy) / v.S;
      const c = Math.cos(g.a), s = Math.sin(g.a);
      return [x * c - y * s, x * s + y * c];
    };

    function spawn(g, v, x, y, grp) {
      parts.push({ z: toWing(x, y, g, v), age: 0, grp, sy: y, trail: [] });
    }

    return {
      pointerDown(p) {
        drag = { y: p.y, a: params.alpha };
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        api.runner.set('alpha', clamp(Math.round((drag.a + (drag.y - p.y) * 0.1) * 2) / 2, -8, 24));
      },
      pointerUp() {
        drag = null;
      },
      onParam(k) {
        if (k === 'mode') parts = [];
      },
      update(dt) {
        const g = geo(), v = view();
        const { h } = api;
        if (params.mode === 'streaks') {
          spawnAcc += dt * 190 * params.U;
          while (spawnAcc >= 1) {
            spawnAcc -= 1;
            spawn(g, v, -10, 60 + Math.random() * (h - 60), -1);
          }
        } else {
          groupT -= dt;
          if (groupT <= 0) {
            groupT = 1.3 / params.U;
            group++;
            for (let i = 0; i < 90; i++) spawn(g, v, v.cx - v.S * 3.2, v.cy - v.S * 1.6 + (v.S * 3.2 * i) / 89, group);
          }
        }
        const sdt = dt * 1.1;
        for (const p of parts) {
          const u1 = vel(p.z, g);
          if (!u1) {
            p.dead = true;
            continue;
          }
          const mid = [p.z[0] + u1[0] * sdt * 0.5, p.z[1] + u1[1] * sdt * 0.5];
          const u2 = vel(mid, g) || u1;
          p.z[0] += u2[0] * sdt;
          p.z[1] += u2[1] * sdt;
          p.speed = Math.hypot(u2[0], u2[1]) / params.U;
          p.age += dt;
          // stalled wing: turbulent wake behind the upper surface
          if (g.stall > 0) {
            const sp = toScreen(p.z, g, v);
            const rel = [(sp[0] - v.cx) / v.S, (v.cy - sp[1]) / v.S];
            if (rel[0] > -0.8 && rel[1] > -0.2 && rel[1] < 1.4 + rel[0] * 0.3) {
              p.z[0] += (Math.random() - 0.6) * g.stall * 0.012;
              p.z[1] += (Math.random() - 0.5) * g.stall * 0.02;
            }
          }
          const s = toScreen(p.z, g, v);
          p.trail.push(s);
          if (p.trail.length > 6) p.trail.shift();
          if (s[0] > api.w + 20 || s[1] < -40 || s[1] > api.h + 40) p.dead = true;
        }
        parts = parts.filter((p) => !p.dead);
        if (parts.length > 1700) parts.splice(0, parts.length - 1700);
      },
      draw() {
        const { w, h } = api;
        const g = geo(), v = view();
        ctx.fillStyle = '#060814';
        ctx.fillRect(0, 0, w, h);
        // pressure field (cached)
        if (params.pressure) {
          const key = `${params.alpha}|${params.camber}|${params.thick}|${w}|${h}`;
          if (key !== fieldKey) {
            fieldKey = key;
            const gw = 110, gh = Math.round((110 * h) / w);
            field = document.createElement('canvas');
            field.width = gw;
            field.height = gh;
            const fc = field.getContext('2d');
            const im = fc.createImageData(gw, gh);
            for (let j = 0; j < gh; j++)
              for (let i = 0; i < gw; i++) {
                const z = toWing(((i + 0.5) / gw) * w, ((j + 0.5) / gh) * h, g, v);
                const u = vel(z, g);
                const k = (j * gw + i) * 4;
                if (!u) {
                  im.data[k + 3] = 0;
                  continue;
                }
                const cp = 1 - (u[0] * u[0] + u[1] * u[1]) / (params.U * params.U);
                const t = clamp(0.5 + cp * 0.32, 0, 1);
                const c = Math.floor(t * 255) * 3;
                im.data[k] = CMAPS.diverge[c];
                im.data[k + 1] = CMAPS.diverge[c + 1];
                im.data[k + 2] = CMAPS.diverge[c + 2];
                im.data[k + 3] = 200;
              }
            fc.putImageData(im, 0, 0);
          }
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(field, 0, 0, w, h);
        }
        // tracers
        ctx.lineCap = 'round';
        if (params.mode === 'streaks') {
          // bucket streaks by speed: slow = warm, fast = cool and bright
          const B = 7, buckets = Array.from({ length: B }, () => []);
          for (const p of parts) {
            if (p.trail.length < 2) continue;
            const s = clamp(p.speed || 1, 0, 2.2);
            buckets[Math.min(B - 1, Math.floor((s / 2.2) * B))].push(p);
          }
          ctx.lineWidth = 1.3;
          buckets.forEach((arr, k) => {
            const s = ((k + 0.5) / B) * 2.2;
            ctx.strokeStyle = s > 1 ? `rgba(${150 - 60 * (s - 1)},220,255,${0.35 + 0.4 * (s - 1)})` : `rgba(255,${170 + 60 * s},${120 + 60 * s},${0.3 + 0.2 * s})`;
            ctx.beginPath();
            for (const p of arr) {
              ctx.moveTo(p.trail[0][0], p.trail[0][1]);
              ctx.lineTo(p.trail[p.trail.length - 1][0], p.trail[p.trail.length - 1][1]);
            }
            ctx.stroke();
          });
        } else {
          const groups = new Map();
          for (const p of parts) {
            if (!groups.has(p.grp)) groups.set(p.grp, []);
            groups.get(p.grp).push(p);
          }
          for (const [gi, arr] of groups) {
            arr.sort((a, b) => a.sy - b.sy);
            ctx.strokeStyle = gi % 2 ? 'rgba(56,214,245,0.85)' : 'rgba(255,95,162,0.85)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            let prev = null;
            for (const p of arr) {
              const s = p.trail[p.trail.length - 1];
              if (!s) continue;
              if (prev && Math.hypot(s[0] - prev[0], s[1] - prev[1]) < v.S * 0.4) ctx.lineTo(s[0], s[1]);
              else ctx.moveTo(s[0], s[1]);
              prev = s;
            }
            ctx.stroke();
          }
        }
        // airfoil
        ctx.beginPath();
        for (let i = 0; i <= 160; i++) {
          const th = (i / 160) * TAU;
          const zeta = [g.mu[0] + g.R * Math.cos(th), g.mu[1] + g.R * Math.sin(th)];
          const J = cdiv([CC * CC, 0], zeta);
          const s = toScreen([zeta[0] + J[0], zeta[1] + J[1]], g, v);
          ctx[i ? 'lineTo' : 'moveTo'](s[0], s[1]);
        }
        ctx.closePath();
        const wg = ctx.createLinearGradient(0, v.cy - v.S * 0.4, 0, v.cy + v.S * 0.3);
        wg.addColorStop(0, '#d9deec');
        wg.addColorStop(1, '#59607a');
        ctx.fillStyle = wg;
        ctx.fill();
        // lift arrow
        const Lmag = g.G * params.U;
        const qc = toScreen([-CC, 0], g, v);
        const len = clamp(Lmag * 22, -v.S * 2, v.S * 2.4);
        if (Math.abs(len) > 4) arrow(ctx, qc[0], qc[1] - 10, qc[0], qc[1] - 10 - len, g.stall > 0 ? C.red : C.lime, 4, 14);
        if (!api.thumbnail) {
          tag(ctx, g.stall > 0 ? 'STALL — lift collapsing' : 'lift', qc[0] + 14, qc[1] - 20 - len * 0.7, g.stall > 0 ? C.red : C.lime, { size: 11 });
          text(ctx, 'wind →', 18, 84, { size: 12, color: C.dim });
          tag(ctx, `angle of attack ${params.alpha.toFixed(1)}°`, w - 16, 84, C.amber, { align: 'right', size: 11 });
          if (params.pressure) {
            text(ctx, 'blue: low pressure   red: high pressure', w - 16, 110, { size: 10, align: 'right', color: C.dim });
          }
        }
      },
      stats() {
        const g = geo();
        const CL = (2 * g.G) / (params.U * 4 * CC);
        return [
          { label: 'Lift coefficient C_L', value: CL.toFixed(2), color: g.stall > 0 ? C.red : C.lime },
          { label: 'Lift (relative)', value: (g.G * params.U).toFixed(2) },
          { label: 'Airspeed', value: (params.U * 250).toFixed(0) + ' km/h' },
          { label: 'State', value: g.stall > 0 ? 'stalled' : params.alpha < -3 ? 'pushing down' : 'flying', color: g.stall > 0 ? C.red : C.teal },
        ];
      },
      charts() {
        const data = [];
        for (let a = -8; a <= 24; a += 1) {
          const eps = params.thick * 0.9, del = params.camber;
          const R = Math.hypot(CC + eps, del), beta = Math.atan2(del, CC + eps);
          const st = Math.max(0, a - 14);
          data.push(((2 * 4 * Math.PI * R * Math.sin(a * DEG + beta)) / 4) * (st > 0 ? Math.max(0.4, 1 - st / 9) : 1));
        }
        const mark = data.map((_, i) => (Math.abs(-8 + i - params.alpha) < 0.5 ? Math.max(...data) : 0));
        return [{ title: 'Lift coefficient vs angle (−8° → 24°)', kind: 'bars', series: [{ data: mark, color: 'rgba(255,181,71,0.45)' }], ref: { data, color: C.lime }, xLabel: 'stall beyond ~15°' }];
      },
    };
  },
};
