import { C, Series, clamp, drawGlow, rand, roundRect, tag, text, TAU } from '../../core/util.js';

// Energy-balance model drives the temperature; photons visualise the flows.
const T0 = 255; // effective temperature with no greenhouse gases, albedo 0.3
// effective IR absorptivity: fast rise that saturates, plus a slow logarithmic tail (CO₂ band wings).
// calibrated so 0 ppm → −18 °C, 280 ppm → ~14 °C, 560 ppm → ~+3 °C
const emissivity = (ppm) => 0.766 * (1 - Math.exp(-ppm / 90)) + 0.0225 * Math.log2(1 + ppm / 280);
const eqTemp = (ppm, albedo) => {
  const f = 1 - emissivity(ppm) / 2;
  return T0 * Math.pow((1 - albedo) / 0.7, 0.25) / Math.pow(f, 0.25);
};

export default {
  id: 'greenhouse',
  title: 'The Greenhouse Effect',
  category: 'earth',
  tagline: 'Sunlight in, heat out — and the invisible gases that decide how warm our planet stays.',
  ages: ['11-14', '14-16'],
  topics: ['Climate', 'Radiation'],
  blurb:
    'Sunlight passes easily through the air and warms the ground. The warm ground glows back in infrared, which we can’t see. Carbon dioxide, water vapour and methane absorb that infrared and send some of it back down. More of these gases means more heat kept in.',
  ideas: [
    'Sunlight arrives mainly as visible light, which the atmosphere lets through.',
    'The warm surface emits <b>infrared</b> radiation.',
    'Greenhouse gas molecules absorb infrared and re-emit it in random directions — some back to the ground.',
    'Without any greenhouse gases Earth would average about −18 °C; with them, about +14 °C.',
    'Doubling CO₂ from pre-industrial levels adds roughly 3 °C once feedbacks are included.',
  ],
  hint: 'Slide the CO₂ level and watch the thermometer',
  thumbChapter: 3,
  thumbFrames: 300,
  params: [
    { key: 'ppm', label: 'Greenhouse gases (CO₂-equivalent)', type: 'range', min: 0, max: 1200, step: 10, value: 0, unit: 'ppm' },
    { key: 'albedo', label: 'Reflectivity (ice & clouds)', type: 'range', min: 0.1, max: 0.6, step: 0.01, value: 0.3, format: (v) => (v * 100).toFixed(0) + ' %' },
    { key: 'sun', label: 'Sunlight photons', type: 'range', min: 5, max: 60, step: 1, value: 16, unit: '/s' },
  ],
  story: [
    {
      title: 'Sunlight arrives',
      text: 'Yellow photons of sunlight stream down. Air is transparent to visible light, so most reach the ground and warm it. Some bounce straight back off clouds and ice.',
      params: { ppm: 0, albedo: 0.3, sun: 16 },
      enter: (s) => s.setTemp(240),
      duration: 11,
    },
    {
      title: 'The Earth glows',
      text: 'Anything warm radiates. The ground sends energy back to space as red <b>infrared</b> photons. With no greenhouse gases they escape freely, and the planet settles at a frosty <em>−18 °C</em>.',
      formula: 'P = σ T⁴',
      params: { ppm: 0 },
      duration: 13,
    },
    {
      title: 'Greenhouse gases',
      text: 'Add the CO₂ and water vapour of the pre-industrial atmosphere (280 ppm). These molecules absorb infrared and re-emit it in random directions — often back down. The ground warms until it’s balanced again, at about <em>+14 °C</em>.',
      params: { ppm: 280 },
      tween: 3,
      duration: 15,
    },
    {
      title: 'Turning up CO₂',
      text: 'Burning fossil fuels has raised CO₂ to over 420 ppm. Doubling it to 560 traps more heat, and the new balance is about <b>3 °C warmer</b> — a huge change for a whole planet.',
      params: { ppm: 560 },
      tween: 4,
      duration: 15,
    },
    {
      title: 'Melting ice, a feedback',
      text: 'Warming melts bright ice, so less sunlight is reflected and even more is absorbed. Lower the reflectivity and watch temperatures climb further. This is a <b>positive feedback</b>.',
      params: { albedo: 0.25 },
      tween: 3,
      duration: 14,
    },
    {
      title: 'Your planet',
      text: 'Set the greenhouse gases and reflectivity. Can you find the levels that keep the planet near today’s temperature?',
      params: { ppm: 420, albedo: 0.3 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let T = 255, photons = [], mols = [], sunAcc = 0, irAcc = 0, tempS = new Series(400), clouds = [], absorbed = 0, escaped = 0;
    let ground = 0, atmTop = 0, atmBot = 0;

    function syncMols() {
      const n = Math.round(Math.sqrt(params.ppm) * 1.5);
      while (mols.length < n) mols.push({ x: rand(api.w), y: rand(atmTop, atmBot), vx: rand(-12, 12), vy: rand(-5, 5), r: rand(TAU), glow: 0 });
      if (mols.length > n) mols.length = n;
    }
    return {
      setTemp(v) {
        T = v;
      },
      resize(w, h) {
        ground = h * 0.78;
        atmTop = h * 0.16;
        atmBot = ground - 20;
        clouds = Array.from({ length: 5 }, (_, i) => ({ x: (i + 0.5) * (w / 5) + rand(-40, 40), y: rand(atmTop + 40, atmTop + 120), s: rand(0.7, 1.3) }));
        mols = [];
        syncMols();
      },
      update(dt) {
        const { w } = api;
        syncMols();
        const Teq = eqTemp(params.ppm, params.albedo);
        T += (Teq - T) * Math.min(1, dt * 0.35);
        if (api.frame % 3 === 0) tempS.push(T - 273.15);
        // sunlight
        sunAcc += dt * params.sun;
        while (sunAcc > 1) {
          sunAcc--;
          const x = rand(w * 0.05, w * 0.95);
          photons.push({ x, y: atmTop - 80, vx: rand(-15, 15), vy: 260, k: 'sun', life: 6, ph: rand(TAU) });
        }
        // infrared from the ground, rate ∝ T⁴
        irAcc += dt * params.sun * Math.pow(T / 288, 4) * 0.6;
        while (irAcc > 1) {
          irAcc--;
          const a = -Math.PI / 2 + rand(-0.5, 0.5);
          photons.push({ x: rand(w * 0.03, w * 0.97), y: ground - 2, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, k: 'ir', life: 8, ph: rand(TAU), cool: 0 });
        }
        for (const p of photons) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          p.ph += dt * 18;
          p.cool -= dt;
          if (p.k === 'sun') {
            // reflection from clouds / bright surfaces
            if (!p.tested && p.y > atmTop + 90) {
              p.tested = true;
              if (Math.random() < params.albedo * 0.85) {
                p.vy = -260;
                p.refl = true;
              }
            }
            if (p.y >= ground) {
              p.dead = true;
              absorbed++;
            }
          } else {
            for (const m of mols) {
              if (p.cool > 0) break;
              if ((m.x - p.x) ** 2 + (m.y - p.y) ** 2 < 260 && Math.random() < 0.75) {
                const a = rand(TAU);
                p.vx = Math.cos(a) * 170;
                p.vy = Math.sin(a) * 170;
                p.cool = 0.25;
                m.glow = 1;
                break;
              }
            }
            if (p.y >= ground && p.vy > 0) p.dead = true;
          }
          if (p.y < -20) {
            p.dead = true;
            if (p.k === 'ir') escaped++;
          }
          if (p.x < -20 || p.x > w + 20 || p.life < 0) p.dead = true;
        }
        photons = photons.filter((p) => !p.dead);
        for (const m of mols) {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          m.r += dt;
          m.glow = Math.max(0, m.glow - dt * 2);
          if (m.x < 0) m.x += w;
          if (m.x > w) m.x -= w;
          if (m.y < atmTop || m.y > atmBot) m.vy *= -1;
        }
      },
      draw() {
        const { w, h } = api;
        // sky gradient warms with temperature
        const warm = clamp((T - 255) / 50, 0, 1);
        const g = ctx.createLinearGradient(0, 0, 0, ground);
        g.addColorStop(0, '#02030a');
        g.addColorStop(0.18, '#060a1c');
        g.addColorStop(1, `rgb(${20 + warm * 60},${40 + warm * 20},${80 - warm * 30})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, ground);
        // sun glow at top
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, w * 0.5, -60, w * 0.35, '#ffb547', 0.08);
        ctx.globalCompositeOperation = 'source-over';
        // clouds
        for (const c of clouds) {
          ctx.fillStyle = `rgba(220,230,255,${0.05 + params.albedo * 0.2})`;
          for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.ellipse(c.x + (k - 1.5) * 26 * c.s, c.y + Math.sin(k * 2) * 6, 34 * c.s, 16 * c.s, 0, 0, TAU);
            ctx.fill();
          }
        }
        // ground: icy white ↔ green/brown with reflectivity
        const gg = ctx.createLinearGradient(0, ground, 0, h);
        const ice = clamp((params.albedo - 0.1) / 0.5, 0, 1);
        gg.addColorStop(0, `rgb(${40 + ice * 150 + warm * 40},${80 + ice * 140},${50 + ice * 170})`);
        gg.addColorStop(1, '#0a0c10');
        ctx.fillStyle = gg;
        ctx.fillRect(0, ground, w, h - ground);
        // ground heat glow
        ctx.fillStyle = `rgba(255,90,40,${0.08 + warm * 0.25})`;
        ctx.fillRect(0, ground, w, 4);
        // molecules (CO₂: O=C=O)
        for (const m of mols) {
          const dx = Math.cos(m.r) * 8, dy = Math.sin(m.r) * 8;
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, m.x, m.y, 14 + 26 * m.glow, '#ff4d6d', 0.15 + 0.2 * m.glow);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#ff6b6b';
          ctx.beginPath();
          ctx.arc(m.x - dx, m.y - dy, 4, 0, TAU);
          ctx.moveTo(m.x + dx + 4, m.y + dy);
          ctx.arc(m.x + dx, m.y + dy, 4, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#8a92a8';
          ctx.beginPath();
          ctx.arc(m.x, m.y, 4.4, 0, TAU);
          ctx.fill();
        }
        // photons as wiggles
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        for (const p of photons) {
          const sp = Math.hypot(p.vx, p.vy) || 1;
          const ux = p.vx / sp, uy = p.vy / sp;
          const len = p.k === 'sun' ? 18 : 22, amp = p.k === 'sun' ? 2.2 : 4, waves = p.k === 'sun' ? 4 : 2;
          ctx.strokeStyle = p.k === 'sun' ? '#ffe08a' : '#ff5a3c';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i <= 12; i++) {
            const s = (i / 12) * len;
            const o = Math.sin((i / 12) * waves * TAU + p.ph) * amp;
            const X = p.x - ux * s - uy * o, Y = p.y - uy * s + ux * o;
            i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
          }
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        // thermometer
        const tx = w - 64, ty = atmTop + 10, th = ground - atmTop - 40;
        ctx.fillStyle = 'rgba(8,11,22,0.8)';
        roundRect(ctx, tx - 22, ty - 14, 44, th + 60, 22);
        ctx.fill();
        const Tc = T - 273.15;
        const frac = clamp((Tc + 30) / 60, 0, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        roundRect(ctx, tx - 5, ty, 10, th, 5);
        ctx.fill();
        const tg = ctx.createLinearGradient(0, ty + th, 0, ty);
        tg.addColorStop(0, '#38d6f5');
        tg.addColorStop(0.5, '#ffb547');
        tg.addColorStop(1, '#ff4d6d');
        ctx.fillStyle = tg;
        roundRect(ctx, tx - 5, ty + th * (1 - frac), 10, th * frac, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx, ty + th + 14, 12, 0, TAU);
        ctx.fill();
        text(ctx, `${Tc >= 0 ? '+' : ''}${Tc.toFixed(1)} °C`, tx - 30, ty + th * (1 - frac), { align: 'right', mono: true, size: 15, weight: 600, color: Tc > 16 ? C.red : Tc > 0 ? C.amber : C.cyan });
        if (!api.thumbnail) {
          tag(ctx, 'space', 18, atmTop - 40, C.dim);
          tag(ctx, 'atmosphere', 18, atmTop + 20, C.cyan);
          tag(ctx, 'sunlight', 110, atmTop - 40, '#ffe08a');
          tag(ctx, 'infrared', 190, atmTop - 40, '#ff5a3c');
          if (mols.length) tag(ctx, 'CO₂', 120, atmTop + 20, '#ff6b6b');
        }
      },
      stats() {
        const Tc = T - 273.15;
        return [
          { label: 'Surface temperature', value: `${Tc.toFixed(1)} °C`, color: Tc > 16 ? C.red : Tc > 0 ? C.amber : C.cyan },
          { label: 'Settles at', value: `${(eqTemp(params.ppm, params.albedo) - 273.15).toFixed(1)} °C` },
          { label: 'Greenhouse gases', value: `${params.ppm.toFixed(0)} ppm` },
          { label: 'IR escaping to space', value: escaped + absorbed ? `${((1 - emissivity(params.ppm) / 2) * 100).toFixed(0)} %` : '—' },
        ];
      },
      charts() {
        return [{ title: 'Surface temperature (°C)', series: [{ data: tempS.data, color: '#ff8a3d' }], min: -25, max: 30, length: 400 }];
      },
    };
  },
};
