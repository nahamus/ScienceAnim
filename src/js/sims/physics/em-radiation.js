import { C, backdrop, clamp, drawGlow, tag, text, TAU } from '../../core/util.js';

export default {
  id: 'em-radiation',
  title: 'How Light Is Made',
  category: 'physics',
  tagline: 'Shake an electric charge and its field lines ripple outward at the speed of light.',
  blurb:
    'A charge’s field cannot update everywhere at once — news of any change spreads outward at the speed of light. When a charge accelerates, its field lines develop a kink that races away. That travelling kink is electromagnetic radiation: radio, light and X-rays are all made this way.',
  ideas: [
    'A charge at rest or moving steadily does <b>not</b> radiate.',
    'Only <b>acceleration</b> produces radiation — the kinks in the field lines.',
    'The kink moves outward at the speed of light, c.',
    'An oscillating charge (an antenna) sends out a continuous wave whose frequency matches the shaking.',
  ],
  hint: 'Drag the charge to shake it yourself',
  thumbChapter: 3,
  thumbFrames: 260,
  params: [
    {
      key: 'motion', label: 'Charge motion', type: 'select', value: 'still',
      options: [
        { value: 'still', label: 'At rest' },
        { value: 'drift', label: 'Steady' },
        { value: 'jolt', label: 'Jolt' },
        { value: 'osc', label: 'Oscillate' },
        { value: 'circle', label: 'Circle' },
        { value: 'hand', label: 'By hand' },
      ],
    },
    { key: 'c', label: 'Speed of light (on screen)', type: 'range', min: 120, max: 600, step: 10, value: 320, unit: 'px/s' },
    { key: 'freq', label: 'Shake frequency', type: 'range', min: 0.2, max: 2, step: 0.05, value: 0.8, unit: 'Hz' },
    { key: 'amp', label: 'Shake amplitude', type: 'range', min: 5, max: 70, step: 1, value: 34, unit: 'px' },
    { key: 'lines', label: 'Field lines', type: 'range', min: 8, max: 64, step: 1, value: 32, instant: true },
  ],
  story: [
    {
      title: 'A charge at rest',
      text: 'A single electric charge. Its field lines point straight out in every direction, unchanged forever. Nothing is being sent anywhere.',
      params: { motion: 'still' },
      duration: 9,
    },
    {
      title: 'Steady motion',
      text: 'Moving at constant speed, the charge drags its field along. The lines stay straight and radial — <b>uniform motion does not radiate</b>.',
      params: { motion: 'drift' },
      duration: 10,
    },
    {
      title: 'A sudden jolt',
      text: 'Now the charge starts and stops abruptly. Far away, the field still “thinks” the charge is where it was. The two regions are joined by a <em>kink</em> that races outward at the speed of light — a pulse of radiation.',
      params: { motion: 'jolt' },
      duration: 14,
    },
    {
      title: 'Shake it: an antenna',
      text: 'Wiggle the charge up and down and the kinks become a continuous <b>electromagnetic wave</b>. This is exactly how a radio antenna broadcasts — electrons sloshing back and forth.',
      formula: 'λ = c / f',
      params: { motion: 'osc', freq: 0.8, amp: 34 },
      duration: 14,
    },
    {
      title: 'Faster shaking, shorter waves',
      text: 'Double the frequency and the wavelength halves. Light is the same thing, with electrons in atoms shaking around 500 trillion times a second.',
      params: { motion: 'osc', freq: 1.6, amp: 20 },
      duration: 11,
    },
    {
      title: 'Going in circles',
      text: 'A charge whirling in a circle radiates spiral waves. Particle accelerators produce brilliant “synchrotron light” this way.',
      params: { motion: 'circle', freq: 0.6, amp: 40 },
      duration: 12,
    },
    {
      title: 'Your hand',
      text: 'Grab the charge and shake it. Quick flicks make sharp pulses; smooth sweeps make gentle waves.',
      params: { motion: 'hand' },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let hist = [], t = 0, x = 0, y = 0, vx = 0, vy = 0, home = [0, 0], drag = false, tx = 0, ty = 0, joltT = 0;

    function reset() {
      hist = [];
      x = home[0];
      y = home[1];
      vx = vy = 0;
      t = 0;
      joltT = 0;
      tx = x;
      ty = y;
    }
    return {
      resize(w, h) {
        home = [w * 0.42, h * 0.45];
        reset();
      },
      reset,
      onParam(k) {
        if (k === 'motion') {
          if (params.motion === 'drift') {
            x = api.w * 0.2;
          } else {
            x = home[0];
          }
          y = home[1];
          tx = x;
          ty = y;
          hist = [];
        }
      },
      pointerDown(p) {
        if (Math.hypot(p.x - x, p.y - y) < 60 || params.motion === 'hand') {
          drag = true;
          api.runner.set('motion', 'hand');
          tx = p.x;
          ty = p.y;
        }
      },
      pointerMove(p) {
        if (drag) {
          tx = p.x;
          ty = p.y;
        }
      },
      pointerUp() {
        drag = false;
      },
      update(dt) {
        t += dt;
        const px = x, py = y;
        const m = params.motion, w2 = TAU * params.freq;
        if (m === 'still') {
          x = home[0];
          y = home[1];
        } else if (m === 'drift') {
          x += 90 * dt;
          if (x > api.w * 0.8) {
            x = api.w * 0.2;
            hist = [];
          }
          y = home[1];
        } else if (m === 'jolt') {
          joltT += dt;
          const period = 3.2;
          const ph = joltT % period;
          const k = Math.floor(joltT / period);
          const a = k % 2 === 0 ? -1 : 1;
          // move 70px quickly in 0.18s then rest
          const s = clamp(ph / 0.18, 0, 1);
          x = home[0] + a * (35 - 70 * s);
          y = home[1];
        } else if (m === 'osc') {
          x = home[0];
          y = home[1] + params.amp * Math.sin(w2 * t);
        } else if (m === 'circle') {
          x = home[0] + params.amp * Math.cos(w2 * t);
          y = home[1] + params.amp * Math.sin(w2 * t);
        } else if (m === 'hand') {
          const k = 1 - Math.exp(-dt * 25);
          x += (tx - x) * k;
          y += (ty - y) * k;
        }
        // keep the charge speed below c
        const c = params.c;
        let dx = x - px, dy = y - py;
        const sp = Math.hypot(dx, dy) / Math.max(dt, 1e-4);
        if (sp > c * 0.9 && dt > 0) {
          const f = (c * 0.9) / sp;
          x = px + dx * f;
          y = py + dy * f;
          dx *= f;
          dy *= f;
        }
        vx = dt > 0 ? dx / dt : 0;
        vy = dt > 0 ? dy / dt : 0;
        hist.push({ t, x, y, vx, vy });
        const maxTau = Math.hypot(api.w, api.h) / c + 0.2;
        while (hist.length > 2 && t - hist[0].t > maxTau) hist.shift();
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { grid: true });
        const n = Math.round(params.lines);
        const c = params.c;
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineJoin = ctx.lineCap = 'round';
        // field lines: points on light-shells from each past emission event
        const N = hist.length;
        const NB = 7;
        const buckets = Array.from({ length: NB }, () => []);
        for (let l = 0; l < n; l++) {
          const th = (l / n) * TAU + 0.0001;
          const dx = Math.cos(th), dy = Math.sin(th);
          let lx = x, ly = y;
          for (let i = N - 1; i >= 0; i -= 1) {
            const e = hist[i];
            const tau = t - e.t;
            const vd = e.vx * dx + e.vy * dy;
            const v2 = e.vx * e.vx + e.vy * e.vy;
            const s = -tau * vd + tau * Math.sqrt(Math.max(0, vd * vd + c * c - v2));
            const X = e.x + e.vx * tau + dx * s;
            const Y = e.y + e.vy * tau + dy * s;
            const sx = X - lx, sy = Y - ly;
            const sl = Math.hypot(sx, sy);
            if (sl < 1.5 && i > 0) continue;
            // how far the segment bends away from radial → radiation highlight
            const bend = sl > 0 ? Math.abs((sx / sl) * dy - (sy / sl) * dx) : 0;
            const b = Math.min(NB - 1, Math.floor(clamp(bend * 2.2, 0, 0.999) * NB));
            buckets[b].push(lx, ly, X, Y);
            lx = X;
            ly = Y;
            if (X < -50 || Y < -50 || X > w + 50 || Y > h + 50) break;
          }
          // beyond the oldest shell: static field from the oldest position
          if (N) buckets[0].push(lx, ly, lx + dx * 2000, ly + dy * 2000);
        }
        buckets.forEach((seg, k) => {
          if (!seg.length) return;
          const b = k / (NB - 1);
          ctx.strokeStyle = `hsla(${195 - b * 160},100%,${58 + b * 22}%,${0.35 + b * 0.6})`;
          ctx.lineWidth = 1.2 + b * 2;
          ctx.beginPath();
          for (let i = 0; i < seg.length; i += 4) {
            ctx.moveTo(seg[i], seg[i + 1]);
            ctx.lineTo(seg[i + 2], seg[i + 3]);
          }
          ctx.stroke();
        });
        drawGlow(ctx, x, y, 60, '#ff7a4d', 0.2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ff7a4d';
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        text(ctx, '+', x, y + 1, { size: 15, weight: 700, align: 'center', shadow: false });
        if (!api.thumbnail && params.motion === 'jolt') tag(ctx, 'kink travels at c', w * 0.72, h * 0.16, C.amber, { align: 'center' });
      },
      stats() {
        const v = Math.hypot(vx, vy);
        return [
          { label: 'Charge speed', value: `${(v / params.c).toFixed(2)} c` },
          { label: 'Wavelength', value: params.motion === 'osc' || params.motion === 'circle' ? `${(params.c / params.freq).toFixed(0)} px` : '—' },
        ];
      },
    };
  },
};
