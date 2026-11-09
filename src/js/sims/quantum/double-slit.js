import { C, CMAPS, clamp, drawGlow, rgba, tag, TAU } from '../../core/util.js';

export default {
  id: 'double-slit',
  title: 'The Quantum Double Slit',
  category: 'quantum',
  tagline: 'Fire electrons one at a time. Each lands as a dot — yet together they paint a wave.',
  ages: ['16+'],
  topics: ['Quantum', 'Waves'],
  blurb:
    'Richard Feynman called it “the only mystery” of quantum mechanics. Single electrons pass through a wall with two slits. Each arrives as one point, but thousands build up an interference pattern — as if every electron went through both slits. Watch which slit it uses and the pattern vanishes.',
  ideas: [
    'Quantum objects travel as <b>waves of probability</b> and are detected as <b>particles</b>.',
    'The bright and dark bands come from the electron’s wave interfering with itself.',
    'Measuring which slit was used destroys the interference — observation changes the outcome.',
    'Faster electrons have shorter de Broglie wavelengths, so their fringes sit closer together.',
  ],
  hint: 'Toggle the which-path detector and watch the pattern change',
  thumbChapter: 1,
  thumbFrames: 260,
  params: [
    { key: 'rate', label: 'Electrons per second', type: 'range', min: 1, max: 400, step: 1, value: 3 },
    { key: 'lambda', label: 'de Broglie wavelength', type: 'range', min: 8, max: 28, step: 0.5, value: 16, unit: 'px' },
    { key: 'sep', label: 'Slit separation', type: 'range', min: 40, max: 140, step: 1, value: 80, unit: 'px', instant: true },
    { key: 'detector', label: 'Which-path detector', type: 'toggle', value: false },
    { key: 'wave', label: 'Show probability wave', type: 'toggle', value: false },
    { key: 'clear', label: 'Clear screen', type: 'button', action: (sim) => sim.clear() },
  ],
  story: [
    {
      title: 'One electron at a time',
      text: 'An electron gun fires single electrons at a wall with two narrow slits. Each one lands on the detector screen as a single, sharp <b>dot</b>. So far, they look like tiny bullets.',
      params: { rate: 3, detector: false, wave: false, lambda: 16 },
      enter: (s) => s.clear(),
      duration: 11,
    },
    {
      title: 'A pattern emerges',
      text: 'Turn up the rate. The dots aren’t random after all — they pile into <em>bright and dark bands</em>. Bullets through two slits would make two stripes, not many.',
      params: { rate: 140, detector: false, wave: false },
      duration: 13,
    },
    {
      title: 'Interfering with itself',
      text: 'Between the gun and the screen the electron behaves like a <b>wave</b> passing through both slits at once. The two halves interfere — and the wave’s brightness gives the odds of where the dot appears.',
      formula: 'P(y) = |ψ<sub>1</sub> + ψ<sub>2</sub>|<sup>2</sup>',
      params: { rate: 90, wave: true },
      duration: 14,
    },
    {
      title: 'Peek at the slits',
      text: 'Now a detector records which slit each electron uses. Instantly the fringes disappear — we get <b>two plain bands</b>. Knowing the path destroys the interference.',
      formula: 'P(y) = |ψ<sub>1</sub>|<sup>2</sup> + |ψ<sub>2</sub>|<sup>2</sup>',
      params: { detector: true, rate: 140, wave: true },
      enter: (s) => s.clear(),
      duration: 14,
    },
    {
      title: 'Faster electrons',
      text: 'Back to unobserved. Speeding electrons up shortens their wavelength (λ = h/p), so the fringes crowd closer together.',
      formula: 'λ = h / p',
      params: { detector: false, lambda: 10, rate: 160, wave: true },
      enter: (s) => s.clear(),
      duration: 13,
    },
    {
      title: 'Run the experiment',
      text: 'Change the wavelength, the slit spacing and the detector. Clear the screen to start a fresh exposure.',
      params: { lambda: 18, rate: 60, wave: false },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let flying = [], hits = [], bins = new Float32Array(90), acc = 0, total = 0, t = 0, flashes = [];
    let gx, bx, sx, cy, L, layer, lctx, waveCv, waveCtx, waveImg;
    const WG = 150, HG = 96;

    function geom() {
      const { w, h } = api;
      gx = w * 0.08;
      bx = w * 0.4;
      sx = w * 0.84;
      cy = h * 0.46;
      L = sx - bx;
    }
    function slitY(i) {
      return cy + (i ? 1 : -1) * params.sep / 2;
    }
    function prob(y, det) {
      const s = (y - cy) / Math.hypot(y - cy, L);
      const a = 10;
      const b = (Math.PI * a * s) / params.lambda;
      const env = b === 0 ? 1 : Math.pow(Math.sin(b) / b, 2);
      if (det) {
        const k = params.sep / 2 * 1.5;
        const g = (yy) => Math.exp(-Math.pow((y - yy) / (L * 0.14), 2));
        return 0.5 * (g(cy - k) + g(cy + k)) * (0.4 + 0.6 * env);
      }
      const ph = (Math.PI * params.sep * s) / params.lambda;
      return Math.pow(Math.cos(ph), 2) * env;
    }
    function sample(det) {
      const { h } = api;
      for (let k = 0; k < 400; k++) {
        const y = cy + (Math.random() - 0.5) * h * 0.92;
        if (Math.random() < prob(y, det)) return y;
      }
      return cy;
    }
    function clear() {
      hits = [];
      bins.fill(0);
      total = 0;
      if (lctx) lctx.clearRect(0, 0, layer.width, layer.height);
    }
    function paintHit(hh) {
      lctx.globalCompositeOperation = 'lighter';
      drawGlow(lctx, hh.x, hh.y, 5, '#5be7ff', 0.25);
    }
    function build() {
      geom();
      layer = document.createElement('canvas');
      layer.width = api.w;
      layer.height = api.h;
      lctx = layer.getContext('2d');
      for (const hh of hits) paintHit(hh);
      waveCv = document.createElement('canvas');
      waveCv.width = WG;
      waveCv.height = HG;
      waveCtx = waveCv.getContext('2d');
      waveImg = waveCtx.createImageData(WG, HG);
    }

    let geo = null, geoKey = '';
    function drawWave() {
      // ψ beyond the barrier: two cylindrical waves; before it: a plane wave
      const { w, h } = api;
      const k = TAU / params.lambda, om = 6;
      const d = waveImg.data;
      const lut = CMAPS.ice;
      const det = params.detector;
      // each pixel's distance to the two slits (and the fall-off) only changes with the geometry
      const key = `${w}|${h}|${WG}|${HG}|${bx}|${slitY(0)}|${slitY(1)}`;
      if (key !== geoKey) {
        geoKey = key;
        geo = [0, 1, 2, 3].map(() => new Float32Array(WG * HG));
        for (let j = 0; j < HG; j++)
          for (let i = 0; i < WG; i++) {
            const x = (i / WG) * w, y = (j / HG) * h, q = j * WG + i;
            for (let s = 0; s < 2; s++) {
              const r = Math.hypot(x - bx, y - slitY(s)) + 1;
              geo[s][q] = r;
              geo[2 + s][q] = 1 / Math.sqrt(r / 60 + 1);
            }
          }
      }
      const [R0, R1, A0, A1] = geo;
      const ot = om * t;
      for (let j = 0; j < HG; j++)
        for (let i = 0; i < WG; i++) {
          const x = (i / WG) * w, q = j * WG + i;
          let v = 0;
          if (x < gx || x > sx) v = 0;
          else if (x < bx) {
            const re = Math.cos(k * (x - gx) - ot);
            v = re * re * 0.5;
          } else {
            const c0 = A0[q] * Math.cos(k * R0[q] - ot), c1 = A1[q] * Math.cos(k * R1[q] - ot);
            v = det ? (c0 * c0 + c1 * c1) * 0.7 : (c0 + c1) * (c0 + c1) * 0.35;
          }
          const li = (clamp(v, 0, 1) * 255) | 0;
          const o = (j * WG + i) * 4;
          d[o] = lut[li * 3];
          d[o + 1] = lut[li * 3 + 1];
          d[o + 2] = lut[li * 3 + 2];
          d[o + 3] = li;
        }
      waveCtx.putImageData(waveImg, 0, 0);
      ctx.globalAlpha = 0.55;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(waveCv, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    build();
    return {
      clear,
      resize: build,
      reset: clear,
      onParam(k) {
        if (k === 'sep' || k === 'lambda' || k === 'detector') {
          if (k !== 'lambda') clear();
        }
      },
      update(dt) {
        t += dt;
        acc += params.rate * dt;
        while (acc >= 1) {
          acc -= 1;
          flying.push({ x: gx + 20, y: cy + (Math.random() - 0.5) * 6, stage: 0, slit: Math.random() < 0.5 ? 0 : 1, ty: 0, age: 0 });
        }
        const v = (bx - gx) / 0.7;
        for (const e of flying) {
          e.age += dt;
          if (e.stage === 0) {
            e.x += v * dt;
            if (e.x >= bx) {
              e.stage = 1;
              e.ty = sample(params.detector);
              e.r = 0;
              if (params.detector) flashes.push({ x: bx, y: slitY(e.slit), a: 1 });
            }
          } else {
            e.r += v * dt;
            if (e.r >= L) {
              e.done = true;
              const hh = { x: sx + 4 + Math.random() * 48, y: e.ty };
              hits.push(hh);
              if (hits.length > 20000) hits.shift();
              paintHit(hh);
              total++;
              const bi = Math.floor(((e.ty - (cy - api.h * 0.46)) / (api.h * 0.92)) * bins.length);
              if (bi >= 0 && bi < bins.length) bins[bi]++;
              flashes.push({ x: hh.x, y: hh.y, a: 1, hit: true });
            }
          }
        }
        flying = flying.filter((e) => !e.done);
        for (const f of flashes) f.a -= dt * 2.5;
        flashes = flashes.filter((f) => f.a > 0);
      },
      draw() {
        const { w, h } = api;
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, '#060814');
        g.addColorStop(1, '#03040a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        if (params.wave) drawWave();

        // gun
        ctx.fillStyle = '#1a2140';
        ctx.strokeStyle = 'rgba(160,180,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(gx - 34, cy - 18, 54, 36, 8);
        ctx.fill();
        ctx.stroke();
        drawGlow(ctx, gx + 20, cy, 16, '#5be7ff');

        // barrier with slits
        ctx.fillStyle = '#2a3354';
        const a = 5;
        const y1 = slitY(0), y2 = slitY(1);
        ctx.fillRect(bx - 4, 0, 8, y1 - a);
        ctx.fillRect(bx - 4, y1 + a, 8, y2 - y1 - 2 * a);
        ctx.fillRect(bx - 4, y2 + a, 8, h - y2 - a);
        if (params.detector) {
          for (const yy of [y1, y2]) {
            ctx.strokeStyle = rgba(C.red, 0.8);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(bx, yy, 14, 0, TAU);
            ctx.stroke();
          }
        }

        // screen
        ctx.fillStyle = 'rgba(30,40,70,0.55)';
        ctx.fillRect(sx, 0, 58, h);
        ctx.drawImage(layer, 0, 0);
        // histogram glow next to screen
        const max = Math.max(1, ...bins);
        ctx.globalCompositeOperation = 'lighter';
        const bh = (h * 0.92) / bins.length;
        for (let i = 0; i < bins.length; i++) {
          const v = bins[i] / max;
          if (v <= 0) continue;
          const y = cy - h * 0.46 + i * bh;
          ctx.fillStyle = rgba('#38d6f5', 0.15 + 0.6 * v);
          ctx.fillRect(sx + 62, y + 1, v * (w - sx - 72), bh - 1.5);
        }
        // electrons
        for (const e of flying) {
          if (e.stage === 0) drawGlow(ctx, e.x, e.y, 9, '#5be7ff');
          else if (params.rate < 40) {
            const al = 0.5 * (1 - e.r / L);
            ctx.lineWidth = 1.5;
            const slits = params.detector ? [e.slit] : [0, 1];
            for (const s of slits) {
              ctx.strokeStyle = rgba('#5be7ff', al);
              ctx.beginPath();
              ctx.arc(bx, slitY(s), e.r, -1.1, 1.1);
              ctx.stroke();
            }
          }
        }
        for (const f of flashes) drawGlow(ctx, f.x, f.y, f.hit ? 16 * f.a + 4 : 22 * f.a, f.hit ? '#ffffff' : '#ff4d6d');
        ctx.globalCompositeOperation = 'source-over';

        if (!api.thumbnail) {
          tag(ctx, 'electron gun', gx - 6, cy - 34, C.cyan, { align: 'center' });
          tag(ctx, params.detector ? 'slits — watched' : 'two slits', bx, 84, params.detector ? C.red : C.ink, { align: 'center' });
          tag(ctx, 'detector screen', sx + 29, 84, C.amber, { align: 'center' });
        }
      },
      stats() {
        return [
          { label: 'Electrons detected', value: total.toLocaleString() },
          { label: 'Which-path info', value: params.detector ? 'Yes' : 'No', color: params.detector ? C.red : C.teal },
        ];
      },
      charts() {
        const ref = [];
        let pm = 0;
        for (let i = 0; i < bins.length; i++) {
          const y = cy - api.h * 0.46 + ((i + 0.5) / bins.length) * api.h * 0.92;
          ref.push(prob(y, params.detector));
          pm = Math.max(pm, ref[i]);
        }
        const bm = Math.max(1, ...bins);
        return [
          {
            title: 'Hits across the screen vs. theory',
            kind: 'bars',
            series: [{ data: Array.from(bins, (b) => b / bm), color: '#38d6f5', label: 'measured' }],
            ref: { data: ref.map((r) => r / (pm || 1)), color: '#ffb547' },
            min: 0,
            max: 1.1,
            xLabel: 'top → bottom',
          },
        ];
      },
    };
  },
};
