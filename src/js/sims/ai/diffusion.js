import { C, TAU, clamp, seeded, drawGlow, tag, text, Series, rgba } from '../../core/util.js';

// A real (tiny) diffusion model in 2D. Each "image" is a single point; the training set is a few
// hundred points shaped like a picture. Because the data are known exactly, the ideal denoiser can
// be computed in closed form: E[x₀ | xₜ] is a softmax-weighted average of the training points.
// Real image models learn an approximation of this same function with a neural network.

const N_DATA = 520;
const VIEW = 1.35; // half-width of the visible square, in data units

/** Training sets: arrays of [x, y, class]. Seeded, so every visit draws the same picture. */
function makeData(kind) {
  const r = seeded(7);
  const jit = (s = 0.025) => (r() - 0.5) * 2 * s;
  const pts = [];
  const heart = (cx, cy, s, cls, n) => {
    for (let i = 0; i < n; i++) {
      const t = r() * TAU;
      const x = 16 * Math.sin(t) ** 3;
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push([cx + (x / 17) * s + jit(), cy + (y / 17) * s + 0.1 * s + jit(), cls]);
    }
  };
  const star = (cx, cy, s, cls, n) => {
    const v = [];
    for (let k = 0; k < 10; k++) {
      const a = Math.PI / 2 + (k * TAU) / 10;
      const rr = k % 2 ? 0.42 : 1;
      v.push([cx + Math.cos(a) * rr * s, cy + Math.sin(a) * rr * s]);
    }
    for (let i = 0; i < n; i++) {
      const k = Math.floor(r() * 10), f = r();
      const [x1, y1] = v[k], [x2, y2] = v[(k + 1) % 10];
      pts.push([x1 + (x2 - x1) * f + jit(), y1 + (y2 - y1) * f + jit(), cls]);
    }
  };
  if (kind === 'spiral') {
    for (let i = 0; i < N_DATA; i++) {
      const u = Math.sqrt(r());
      const a = u * 3.4 * Math.PI;
      const rr = 0.08 + 0.95 * u;
      pts.push([Math.cos(a) * rr + jit(0.03), Math.sin(a) * rr + jit(0.03), 0]);
    }
  } else if (kind === 'heart') {
    heart(0, -0.05, 1.05, 0, N_DATA);
  } else if (kind === 'moons') {
    for (let i = 0; i < N_DATA; i++) {
      const top = i % 2 === 0, a = r() * Math.PI;
      const [x, y] = top ? [Math.cos(a) - 0.5, Math.sin(a) - 0.2] : [0.5 - Math.cos(a), 0.2 - Math.sin(a)];
      pts.push([x * 0.95 + jit(0.04), y * 0.95 + jit(0.04), top ? 0 : 1]);
    }
  } else if (kind === 'smiley') {
    for (let i = 0; i < N_DATA; i++) {
      const p = r();
      if (p < 0.55) {
        const a = r() * TAU;
        pts.push([Math.cos(a) * 1.05 + jit(), Math.sin(a) * 1.05 + jit(), 0]);
      } else if (p < 0.72) {
        const a = r() * TAU, e = p < 0.635 ? -0.38 : 0.38;
        pts.push([e + Math.cos(a) * 0.12 + jit(0.015), 0.32 + Math.sin(a) * 0.12 + jit(0.015), 0]);
      } else {
        const a = Math.PI * (1.18 + r() * 0.64);
        pts.push([Math.cos(a) * 0.62 + jit(), 0.05 + Math.sin(a) * 0.62 + jit(), 0]);
      }
    }
  } else {
    // two kinds of picture, labelled: class 0 = hearts, class 1 = stars (for prompting)
    heart(-0.62, 0, 0.62, 0, N_DATA / 2);
    star(0.62, 0, 0.62, 1, N_DATA / 2);
  }
  return pts;
}

const CLASS_COLORS = ['#ff5fa2', '#ffb547'];

export default {
  id: 'diffusion',
  title: 'How AI Draws: Diffusion Models',
  category: 'ai',
  tagline: 'Image generators start from pure static and remove noise step by step until a picture appears.',
  ages: ['14-16', '16+'],
  topics: ['Generative AI', 'Probability'],
  keywords: ['stable diffusion', 'dall-e', 'midjourney', 'image generation', 'denoising', 'generative'],
  blurb:
    'Stable Diffusion, DALL·E and Midjourney all work the same way. Training: take real pictures, bury them in noise, and teach a network to guess which way is “less noisy”. Generating: start from pure static and follow that guess, one small step at a time, until a brand-new picture condenses out of the noise. Here every “picture” is a single dot, so you can watch the whole process.',
  ideas: [
    '<b>Forward process</b>: blend the data with more and more random noise until nothing of it is left.',
    'A <b>denoiser</b> learns, for any noisy input, the direction back toward realistic data.',
    '<b>Generation</b> runs the process backwards from pure noise, a little at a time.',
    'A <b>prompt</b> steers each step toward one kind of picture; <b>guidance</b> exaggerates that steer.',
  ],
  hint: 'Click or drag to drop a single noisy sample and watch it denoise',
  renderScale: 1,
  thumbChapter: 3,
  thumbFrames: 260,
  params: [
    { key: 'shape', label: 'Training pictures', type: 'select', value: 'heart', instant: true, options: [
      { value: 'heart', label: 'Heart' }, { value: 'spiral', label: 'Spiral' }, { value: 'smiley', label: 'Smiley' },
      { value: 'moons', label: 'Two moons' }, { value: 'pair', label: 'Hearts & stars' },
    ] },
    { key: 'mode', label: 'Process', type: 'select', value: 'generate', instant: true, options: [
      { value: 'noise', label: 'Add noise (training)' }, { value: 'generate', label: 'Remove noise (generate)' },
    ] },
    { key: 'prompt', label: 'Prompt', type: 'select', value: 'none', instant: true, options: [
      { value: 'none', label: 'None' }, { value: '0', label: '“heart”' }, { value: '1', label: '“star”' },
    ], help: 'Only for the hearts & stars set' },
    { key: 'guide', label: 'Guidance strength', type: 'range', min: 0, max: 4, step: 0.1, value: 1, help: 'Classifier-free guidance scale' },
    { key: 'steps', label: 'Denoising steps', type: 'range', min: 4, max: 150, step: 1, value: 60, instant: true },
    { key: 'sampler', label: 'Sampler', type: 'select', value: 'ddpm', instant: true, options: [
      { value: 'ddpm', label: 'Noisy (DDPM)' }, { value: 'ddim', label: 'Deterministic (DDIM)' },
    ] },
    { key: 'n', label: 'Samples', type: 'range', min: 50, max: 900, step: 10, value: 450, instant: true },
    { key: 'speed', label: 'Steps per second', type: 'range', min: 2, max: 60, step: 1, value: 14 },
    { key: 'data', label: 'Show training data', type: 'toggle', value: true },
    { key: 'arrows', label: 'Show denoising directions', type: 'toggle', value: false },
    { key: 'loop', label: 'Repeat automatically', type: 'toggle', value: true },
    { key: 'again', label: 'Generate again', type: 'button', action: (s) => s.start() },
  ],
  story: [
    {
      title: 'The training pictures',
      text: 'To keep things visible, each “picture” here is just one dot on a plane, and our training set is 520 dots that together trace a heart. A real model sees millions of images, each a point in a space with millions of dimensions. The idea is the same.',
      params: { shape: 'heart', mode: 'noise', data: true, arrows: false, prompt: 'none', speed: 8, loop: false },
      enter: (s) => s.start(true),
      duration: 11,
    },
    {
      title: 'Bury them in noise',
      text: 'Training starts by destroying data. Step by step each dot gets a random nudge, while the picture fades. After enough steps the heart is gone and only a round cloud of <b>Gaussian noise</b> remains, the same cloud whatever we started from.',
      formula: 'xₜ = √ᾱₜ · x₀ + √(1 − ᾱₜ) · ε',
      params: { mode: 'noise', speed: 12, loop: true },
      enter: (s) => s.start(),
      duration: 14,
    },
    {
      title: 'Learn the way back',
      text: 'The network is shown noisy dots and asked: which way is the data? The arrows are its answer at the current noise level. Far from the data they point toward the middle of the picture; as the noise fades they sharpen toward the nearest part of the outline.',
      params: { mode: 'generate', arrows: true, speed: 6, loop: true, data: true },
      enter: (s) => s.start(),
      duration: 15,
    },
    {
      title: 'Generate from static',
      text: 'Now start from pure random noise and follow the arrows, removing a little noise at each step. A heart condenses out of the static, dot by dot. None of these dots is copied: each is a new sample of “something heart-shaped”.',
      check: {
        q: 'Start from pure random noise and follow the arrows back, step by step. What do you get?',
        options: ['The same cloud of noise', 'A new set of dots shaped like the training pictures', 'One dot in the centre'],
        answer: 1,
        setup: { mode: 'generate', arrows: true, data: false, loop: false },
        explain: 'Every step moves each dot a little toward where data is likely. Different random starting points end up in different places on the heart, so you get many new samples with the shape of the data.',
      },
      params: { mode: 'generate', arrows: false, speed: 14, loop: true, data: false },
      enter: (s) => s.start(),
      duration: 15,
    },
    {
      title: 'How many steps?',
      text: 'With only a handful of big steps the denoiser has to guess too much at once and the picture comes out smeared. More steps give a sharper result but cost more time. Faster samplers like <b>DDIM</b> take a deterministic path and need fewer steps.',
      params: { steps: 6, sampler: 'ddpm', speed: 4, data: true, loop: true },
      enter: (s) => s.start(),
      duration: 14,
    },
    {
      title: 'Prompts steer the noise',
      text: 'Now the training set holds two kinds of picture: hearts and stars. With no prompt, each dot drifts to whichever is nearer. A <b>prompt</b> asks the denoiser “which way to a star?” at every step, and <b>guidance</b> pushes extra hard in that direction. That is how text-to-image models follow your words.',
      check: {
        q: 'Trained on hearts and stars, with no prompt. What will it generate?',
        options: ['Only hearts', 'Only stars', 'A mix of both', 'Shapes halfway between a heart and a star'],
        answer: 2,
        setup: { shape: 'pair', mode: 'generate', prompt: 'none', loop: false, steps: 60, data: true, arrows: false },
        explain: 'Without a prompt, each random starting point drifts toward whichever kind of picture is nearest, so you get a mix. A good model does not blend them into in-between shapes, because those never appeared in the training data.',
      },
      params: { shape: 'pair', prompt: '1', guide: 1.5, mode: 'generate', steps: 60, sampler: 'ddpm', speed: 14, loop: true },
      enter: (s) => s.start(),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Pick a training set, change the steps and the sampler, or prompt the hearts & stars model and turn guidance right up. Click the canvas to drop a single dot and watch its path.',
      params: { shape: 'spiral', mode: 'generate', prompt: 'none', steps: 60, arrows: false, data: true, loop: true },
      enter: (s) => s.start(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let data = [], key = '', particles = [], t = 0, T = 60, acc = 0, hold = 0, probe = null;
    let field = null, fieldKey = '';
    const logw = new Float64Array(N_DATA + 8); // reused by the denoiser (hot loop)
    const sigmaSeries = new Series(160);
    // cosine noise schedule (Nichol & Dhariwal): ᾱ(s) for s ∈ [0, 1]
    const abar = (s) => {
      const f = (x) => Math.cos(((x + 0.008) / 1.008) * Math.PI * 0.5) ** 2;
      return clamp(f(s) / f(0), 1e-4, 1);
    };
    const A = (k) => abar(k / T); // ᾱ at step k (0 = clean, T = pure noise)

    function ensureData() {
      if (key === params.shape) return;
      key = params.shape;
      data = makeData(params.shape);
    }

    const gauss = () => {
      let u = 0;
      while (u === 0) u = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * Math.random());
    };

    /** Ideal denoiser: E[x₀ | xₜ] for the training set (optionally only one class). */
    function x0hat(x, y, ab, cls) {
      const a = Math.sqrt(ab), v = 1 - ab;
      let m = -Infinity;
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        if (cls !== undefined && d[2] !== cls) {
          logw[i] = -Infinity;
          continue;
        }
        const dx = x - a * d[0], dy = y - a * d[1];
        logw[i] = -(dx * dx + dy * dy) / (2 * v);
        if (logw[i] > m) m = logw[i];
      }
      let sw = 0, sx = 0, sy = 0;
      for (let i = 0; i < data.length; i++) {
        if (logw[i] === -Infinity) continue;
        const w = Math.exp(logw[i] - m);
        sw += w;
        sx += w * data[i][0];
        sy += w * data[i][1];
      }
      return [sx / sw, sy / sw];
    }

    /** Guided estimate of the clean point (classifier-free guidance, written in x₀ form). */
    function predict(x, y, ab) {
      const u = x0hat(x, y, ab);
      if (params.shape !== 'pair' || params.prompt === 'none') return u;
      const c = x0hat(x, y, ab, +params.prompt);
      const w = params.guide;
      return [u[0] + w * (c[0] - u[0]), u[1] + w * (c[1] - u[1])];
    }

    function start(fromData = false) {
      ensureData();
      T = Math.round(params.steps);
      hold = 0;
      acc = 0;
      sigmaSeries.clear();
      const n = Math.round(api.thumbnail ? Math.min(params.n, 260) : params.n);
      particles = [];
      if (params.mode === 'noise') {
        t = fromData ? 0 : 0;
        for (let i = 0; i < n; i++) {
          const d = data[Math.floor(Math.random() * data.length)];
          particles.push({ x0: d[0], y0: d[1], ex: gauss(), ey: gauss(), x: d[0], y: d[1], c: d[2] });
        }
      } else {
        t = T;
        for (let i = 0; i < n; i++) particles.push({ x: gauss(), y: gauss(), c: -1 });
      }
      probe = null;
    }

    function stepNoise() {
      if (t >= T) return false;
      t++;
      const ab = A(t), a = Math.sqrt(ab), s = Math.sqrt(1 - ab);
      for (const p of particles) {
        p.x = a * p.x0 + s * p.ex;
        p.y = a * p.y0 + s * p.ey;
      }
      return true;
    }

    function denoise(p, k) {
      const ab = A(k), abPrev = A(k - 1);
      const [hx, hy] = predict(p.x, p.y, ab);
      const s = Math.sqrt(1 - ab);
      const ex = (p.x - Math.sqrt(ab) * hx) / s, ey = (p.y - Math.sqrt(ab) * hy) / s;
      if (params.sampler === 'ddim' || k === 1) {
        p.x = Math.sqrt(abPrev) * hx + Math.sqrt(1 - abPrev) * ex;
        p.y = Math.sqrt(abPrev) * hy + Math.sqrt(1 - abPrev) * ey;
      } else {
        const sig2 = ((1 - abPrev) / (1 - ab)) * (1 - ab / abPrev);
        const dir = Math.sqrt(Math.max(0, 1 - abPrev - sig2));
        const sig = Math.sqrt(Math.max(0, sig2));
        p.x = Math.sqrt(abPrev) * hx + dir * ex + sig * gauss();
        p.y = Math.sqrt(abPrev) * hy + dir * ey + sig * gauss();
      }
      if (params.shape === 'pair' && k === 1) {
        // colour each finished sample by the kind of picture it landed on
        p.c = nearestClass(p.x, p.y);
      }
    }

    function nearestClass(x, y) {
      let best = Infinity, c = 0;
      for (const d of data) {
        const q = (d[0] - x) ** 2 + (d[1] - y) ** 2;
        if (q < best) (best = q), (c = d[2]);
      }
      return c;
    }

    function stepGenerate() {
      if (t <= 0) return false;
      for (const p of particles) denoise(p, t);
      if (probe && probe.t > 0) {
        denoise(probe, probe.t);
        probe.trail.push([probe.x, probe.y]);
        probe.t--;
      }
      t--;
      return true;
    }

    const geom = () => {
      const { w, h } = api;
      const s = Math.min(w, h * (w < 600 ? 1 : 0.92)) / (2 * VIEW);
      return { s, cx: w / 2, cy: h * (w < 600 ? 0.47 : 0.5) };
    };
    const toPx = (x, y, g = geom()) => [g.cx + x * g.s, g.cy - y * g.s];

    start(true);

    return {
      start: () => start(),
      reset: () => start(),
      onParam(k) {
        if (['shape', 'mode', 'steps', 'n', 'sampler'].includes(k)) start();
        if (k === 'prompt' && params.mode === 'generate') start();
      },
      pointerDown(p) {
        ensureData();
        const g = geom();
        const x = (p.x - g.cx) / g.s, y = (g.cy - p.y) / g.s;
        // a single sample dropped at this noisy position, denoised from the current step (or from the start)
        const k = params.mode === 'generate' && t > 2 ? t : T;
        probe = { x, y, t: k, trail: [[x, y]], c: -1 };
        if (params.mode !== 'generate' || t <= 2) {
          // run the probe on its own
          probe.solo = true;
        }
      },
      update(dt) {
        ensureData();
        acc += dt * params.speed;
        let n = 0;
        while (acc >= 1 && n++ < 12) {
          acc -= 1;
          const moved = params.mode === 'noise' ? stepNoise() : stepGenerate();
          if (probe?.solo && probe.t > 0) {
            denoise(probe, probe.t);
            probe.trail.push([probe.x, probe.y]);
            probe.t--;
          }
          if (moved) sigmaSeries.push(Math.sqrt(1 - A(t)));
        }
        const done = params.mode === 'noise' ? t >= T : t <= 0;
        if (done && params.loop) {
          hold += dt;
          if (hold > 2.2) start();
        }
      },
      draw() {
        const { w, h } = api;
        const g = geom();
        ctx.fillStyle = '#04060d';
        ctx.fillRect(0, 0, w, h);
        // faint frame for the data plane
        ctx.strokeStyle = 'rgba(140,160,220,0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(g.cx - VIEW * g.s, g.cy - VIEW * g.s, 2 * VIEW * g.s, 2 * VIEW * g.s);

        if (params.data) {
          for (const d of data) {
            const [px, py] = toPx(d[0], d[1], g);
            ctx.fillStyle = rgba(params.shape === 'pair' ? CLASS_COLORS[d[2]] : '#9be4ff', 0.22);
            ctx.fillRect(px - 1, py - 1, 2, 2);
          }
        }

        if (params.arrows) {
          const n = w < 600 ? 13 : 19;
          const step = (2 * VIEW) / n;
          // the field only changes with the step and the settings, so compute it once per step
          const fk = [t, T, params.shape, params.prompt, params.guide, n].join('|');
          if (fk !== fieldKey) {
            fieldKey = fk;
            field = [];
            const ab = A(Math.max(1, t));
            for (let i = 0; i <= n; i++)
              for (let j = 0; j <= n; j++) {
                const x = -VIEW + i * step, y = -VIEW + j * step;
                const [hx, hy] = predict(x, y, ab);
                // direction one step back toward the data, scaled for display
                let dx = Math.sqrt(ab) * hx - x, dy = Math.sqrt(ab) * hy - y;
                const len = Math.hypot(dx, dy);
                if (len < 1e-6) continue;
                const L = Math.min(len, step * 0.9) / len;
                field.push([x, y, dx * L, dy * L]);
              }
          }
          ctx.lineWidth = 1.2;
          for (const [x, y, dx, dy] of field) {
            const [px, py] = toPx(x, y, g), [qx, qy] = toPx(x + dx, y + dy, g);
            ctx.strokeStyle = 'rgba(255,214,140,0.45)';
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(qx, qy);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,214,140,0.75)';
            ctx.beginPath();
            ctx.arc(qx, qy, 1.6, 0, TAU);
            ctx.fill();
          }
        }

        const r = Math.max(1.6, Math.min(3, g.s * 0.012));
        const noiseLevel = Math.sqrt(1 - A(t));
        ctx.globalCompositeOperation = 'lighter';
        for (const p of particles) {
          const [px, py] = toPx(p.x, p.y, g);
          if (px < -10 || py < -10 || px > w + 10 || py > h + 10) continue;
          const col = p.c >= 0 && params.shape === 'pair' ? CLASS_COLORS[p.c] : noiseLevel > 0.6 ? '#8fa6ff' : '#e9f3ff';
          ctx.fillStyle = col;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (probe) {
          ctx.strokeStyle = C.amber;
          ctx.lineWidth = 2;
          ctx.beginPath();
          probe.trail.forEach(([x, y], i) => {
            const [px, py] = toPx(x, y, g);
            ctx[i ? 'lineTo' : 'moveTo'](px, py);
          });
          ctx.stroke();
          const [px, py] = toPx(probe.x, probe.y, g);
          drawGlow(ctx, px, py, 22, C.amber, 0.3);
        }
        ctx.globalCompositeOperation = 'source-over';

        if (!api.thumbnail) {
          // progress bar: noise level at the current step
          const bw = Math.min(260, w - 40), bx = w / 2 - bw / 2, by = h - (w < 600 ? 70 : 30); // phones: clear of the hint
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(bx, by, bw, 4);
          const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
          grad.addColorStop(0, '#e9f3ff');
          grad.addColorStop(1, '#8fa6ff');
          ctx.fillStyle = grad;
          ctx.fillRect(bx, by, bw * noiseLevel, 4);
          text(ctx, params.mode === 'noise' ? 'adding noise →' : '← removing noise', w / 2, by - 12, { size: 11, align: 'center', color: C.dim });
          text(ctx, 'clean', bx, by + 14, { size: 10, color: C.dim });
          text(ctx, 'pure noise', bx + bw, by + 14, { size: 10, color: C.dim, align: 'right' });
          const label = `step ${params.mode === 'noise' ? t : T - t} / ${T}`;
          tag(ctx, label, w - 16, 84, C.ink, { align: 'right', mono: true });
          if (params.shape === 'pair' && params.mode === 'generate') {
            const prompt = params.prompt === 'none' ? 'no prompt' : `prompt: “${params.prompt === '0' ? 'heart' : 'star'}” · guidance ${params.guide.toFixed(1)}`;
            tag(ctx, prompt, w - 16, 110, params.prompt === 'none' ? C.dim : CLASS_COLORS[+params.prompt], { align: 'right' });
          }
        }
      },
      stats() {
        const s = Math.sqrt(1 - A(t));
        const out = [
          { label: 'Step', value: `${params.mode === 'noise' ? t : T - t} / ${T}` },
          { label: 'Noise level σ', value: s.toFixed(3), color: C.cyan },
          { label: 'Signal kept √ᾱ', value: Math.sqrt(A(t)).toFixed(3), color: C.amber },
        ];
        if (params.shape === 'pair' && params.mode === 'generate' && t === 0) {
          const stars = particles.filter((p) => p.c === 1).length;
          out.push({ label: 'Hearts : stars', value: `${particles.length - stars} : ${stars}`, color: C.pink });
        }
        return out;
      },
      charts() {
        return [{ title: 'Noise level σ at each step', series: [{ data: sigmaSeries.data, color: C.cyan }], min: 0, max: 1, length: Math.max(10, T) }];
      },
    };
  },
};
