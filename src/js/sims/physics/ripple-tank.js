import { C, CMAPS, clamp, tag } from '../../core/util.js';

// 2D wave equation on a grid with absorbing (sponge) borders and solid barriers.
export default {
  id: 'ripple-tank',
  title: 'Waves & Interference',
  category: 'physics',
  tagline: 'Drop pebbles in a digital ripple tank and watch waves add, cancel and bend.',
  ages: ['14-16', '16+'],
  topics: ['Waves'],
  blurb:
    'Every wave — water, sound, light — obeys the same rule: neighbouring points pull on each other. When waves overlap they simply add. Where crest meets crest they reinforce; where crest meets trough they cancel. That one idea explains interference and diffraction.',
  ideas: [
    '<b>Superposition:</b> overlapping waves add point by point.',
    'Bright and dark bands appear where path differences are whole or half wavelengths.',
    '<b>Diffraction:</b> a gap about one wavelength wide makes a wave spread out in a fan.',
    'Young’s double slit: fringe spacing grows with wavelength and shrinks as the slits move apart.',
  ],
  hint: 'Click or drag on the water to make ripples',
  params: [
    {
      key: 'mode', label: 'Setup', type: 'select', value: 'one',
      options: [
        { value: 'one', label: 'One source' },
        { value: 'two', label: 'Two sources' },
        { value: 'slit', label: 'Single slit' },
        { value: 'double', label: 'Double slit' },
        { value: 'free', label: 'Free pond' },
      ],
    },
    { key: 'freq', label: 'Frequency', type: 'range', min: 0.08, max: 0.3, step: 0.01, value: 0.16 },
    { key: 'sep', label: 'Source / slit separation', type: 'range', min: 20, max: 140, step: 1, value: 60, unit: 'cells' },
    { key: 'intensity', label: 'Show time-averaged intensity', type: 'toggle', value: false },
  ],
  story: [
    {
      title: 'A single source',
      text: 'A point bobbing up and down sends out circular ripples. <em>Orange</em> marks crests, <em>blue</em> marks troughs. The distance between crests is the <b>wavelength</b>.',
      formula: 'v = f · λ',
      params: { mode: 'one', freq: 0.16, intensity: false },
      duration: 10,
    },
    {
      title: 'Two sources overlap',
      text: 'Two sources in step. Where crest meets crest the water heaves twice as high; where crest meets trough it goes <b>perfectly still</b>. Look for the calm spokes fanning out.',
      params: { mode: 'two', sep: 60, intensity: false },
      duration: 13,
    },
    {
      title: 'Reveal the pattern',
      text: 'Averaging the wave’s energy over time makes the pattern obvious: bright beams of constructive interference separated by dark nodal lines.',
      params: { mode: 'two', intensity: true },
      duration: 12,
    },
    {
      title: 'Spread the sources',
      text: 'Move the sources apart and more, narrower beams appear. Raise the frequency (shorter wavelength) and the same thing happens. Only the <b>ratio</b> of spacing to wavelength matters.',
      params: { mode: 'two', sep: 120, intensity: true, freq: 0.2 },
      duration: 12,
    },
    {
      title: 'Squeezing through a gap',
      text: 'A plane wave hits a wall with one narrow opening. Instead of a sharp beam, the wave fans out from the gap. This bending is called <b>diffraction</b>.',
      params: { mode: 'slit', intensity: false, freq: 0.16, sep: 60 },
      duration: 12,
    },
    {
      title: 'Young’s double slit',
      text: 'Two openings act like two new sources, so the fans interfere. The bright and dark fringes reaching the right edge are exactly what Thomas Young saw with light in 1801 — proof that light is a wave.',
      formula: 'd · sin θ = m · λ',
      params: { mode: 'double', intensity: true, sep: 70 },
      duration: 16,
    },
    {
      title: 'Your pond',
      text: 'Click and drag to drop pebbles. Make two ripples at once and watch them pass straight through each other.',
      params: { mode: 'free', intensity: false },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let W = 0, H = 0, cell = 3, u, up, damp, wall, inten, img, off, offCtx, t = 0;
    const SPONGE = 22;

    function build() {
      const { w, h } = api;
      cell = w * h > 900000 ? 3.4 : 3;
      W = Math.max(40, Math.round(w / cell));
      H = Math.max(30, Math.round(h / cell));
      u = new Float32Array(W * H);
      up = new Float32Array(W * H);
      inten = new Float32Array(W * H);
      damp = new Float32Array(W * H);
      wall = new Uint8Array(W * H);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const d = Math.min(x, y, W - 1 - x, H - 1 - y);
          damp[y * W + x] = d < SPONGE ? 0.25 * Math.pow(1 - d / SPONGE, 2) : 0;
        }
      off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      offCtx = off.getContext('2d');
      img = offCtx.createImageData(W, H);
      layout();
    }

    function layout() {
      wall.fill(0);
      u.fill(0);
      up.fill(0);
      inten.fill(0);
      const m = params.mode;
      if (m === 'slit' || m === 'double') {
        const wx = Math.round(W * 0.33);
        const cy = H / 2;
        const gap = 7;
        for (let y = 0; y < H; y++) {
          let open;
          if (m === 'slit') open = Math.abs(y - cy) < gap * 1.3;
          else open = Math.abs(y - (cy - params.sep / 2)) < gap * 0.7 || Math.abs(y - (cy + params.sep / 2)) < gap * 0.7;
          if (!open) for (let x = wx; x < wx + 4; x++) wall[y * W + x] = 1;
        }
      }
    }

    function sources() {
      const m = params.mode;
      const cy = H / 2;
      if (m === 'one') return [[Math.round(W * 0.4), Math.round(cy)]];
      if (m === 'two') return [[Math.round(W * 0.3), Math.round(cy - params.sep / 2)], [Math.round(W * 0.3), Math.round(cy + params.sep / 2)]];
      return [];
    }

    function drop(gx, gy, amp = 3, r = 3) {
      for (let y = -r * 2; y <= r * 2; y++)
        for (let x = -r * 2; x <= r * 2; x++) {
          const X = gx + x, Y = gy + y;
          if (X < 1 || Y < 1 || X >= W - 1 || Y >= H - 1) continue;
          u[Y * W + X] += amp * Math.exp(-(x * x + y * y) / (r * r));
        }
    }

    function stepWave() {
      const c2 = 0.45;
      const m = params.mode;
      const omega = params.freq;
      t += 1;
      const s = Math.sin(omega * t);
      for (const [sx, sy] of sources()) {
        for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) u[(sy + y) * W + sx + x] = s * 1.4;
      }
      if (m === 'slit' || m === 'double') {
        const x = SPONGE + 2;
        for (let y = 0; y < H; y++) u[y * W + x] = s * 0.9;
      }
      for (let y = 1; y < H - 1; y++) {
        const row = y * W;
        for (let x = 1; x < W - 1; x++) {
          const i = row + x;
          if (wall[i]) {
            up[i] = 0;
            continue;
          }
          const lap = u[i - 1] + u[i + 1] + u[i - W] + u[i + W] - 4 * u[i];
          const d = damp[i] + 0.0006;
          up[i] = (2 * u[i] - (1 - d) * up[i] + c2 * lap) / (1 + d);
        }
      }
      const tmp = u;
      u = up;
      up = tmp;
    }

    build();
    let dragging = false;
    const toGrid = (p) => [Math.round(p.x / cell), Math.round(p.y / cell)];

    return {
      resize: build,
      reset: layout,
      onParam(k) {
        if (k === 'mode' || (k === 'sep' && (params.mode === 'slit' || params.mode === 'double'))) layout();
        if (k === 'intensity' || k === 'sep' || k === 'freq') inten.fill(0);
      },
      pointerDown(p) {
        dragging = true;
        const [x, y] = toGrid(p);
        drop(x, y, 4, 3);
      },
      pointerMove(p) {
        if (!dragging) return;
        const [x, y] = toGrid(p);
        drop(x, y, 0.8, 2.5);
      },
      pointerUp() {
        dragging = false;
      },
      update(dt) {
        // two wave steps per 60th of a second, but within ~5 ms: on a slow device the waves run a
        // little slower instead of each slow frame asking for even more steps
        const n = clamp(Math.round(dt * 60 * 2), 1, 6);
        const t0 = performance.now();
        for (let i = 0; i < n; i++) {
          stepWave();
          if (!api.thumbnail && performance.now() - t0 > 5) break;
        }
        if (params.mode === 'free' && api.thumbnail && api.frame % 40 === 0) drop(Math.round(W * (0.3 + Math.random() * 0.4)), Math.round(H * (0.3 + Math.random() * 0.4)), 4, 3);
        if (params.mode === 'free' && !api.thumbnail && api.frame % 150 === 0 && !dragging && api.runner.pointer.x === 0)
          drop(Math.round(W * (0.25 + Math.random() * 0.5)), Math.round(H * (0.25 + Math.random() * 0.5)), 4, 3);
        const k = 0.02;
        for (let i = 0; i < u.length; i++) inten[i] += (u[i] * u[i] - inten[i]) * k;
      },
      draw() {
        const { w, h } = api;
        const data = img.data;
        const showI = params.intensity;
        const lutD = CMAPS.diverge, lutI = CMAPS.inferno;
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++) {
            const i = y * W + x;
            const o = i * 4;
            if (wall[i]) {
              data[o] = 70; data[o + 1] = 80; data[o + 2] = 110; data[o + 3] = 255;
              continue;
            }
            let r, g, b;
            if (showI) {
              const v = clamp(Math.sqrt(inten[i]) * 1.6, 0, 1);
              const li = (v * 255) | 0;
              r = lutI[li * 3]; g = lutI[li * 3 + 1]; b = lutI[li * 3 + 2];
            } else {
              const v = clamp(u[i] * 0.55, -1, 1);
              const li = ((v * 0.5 + 0.5) * 255) | 0;
              // fake lighting from the slope
              const sl = x > 0 && x < W - 1 ? (u[i + 1] - u[i - 1]) * 60 : 0;
              r = lutD[li * 3] + sl; g = lutD[li * 3 + 1] + sl; b = lutD[li * 3 + 2] + sl;
            }
            data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255;
          }
        offCtx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(off, 0, 0, W * cell, H * cell);
        if (W * cell < w || H * cell < h) {
          ctx.fillStyle = '#03040a';
          ctx.fillRect(W * cell, 0, w, h);
          ctx.fillRect(0, H * cell, w, h);
        }
        // annotate sources
        if (!api.thumbnail) {
          for (const [sx, sy] of sources()) tag(ctx, 'source', sx * cell, sy * cell - 26, C.amber, { align: 'center' });
          if (params.mode === 'double' || params.mode === 'slit') {
            tag(ctx, 'plane wave →', (SPONGE + 6) * cell, 90, C.cyan);
            if (params.intensity) tag(ctx, 'screen →', w - 90, 90, C.amber, { align: 'right' });
          }
        }
      },
      stats() {
        const lambda = (2 * Math.PI * Math.sqrt(0.45)) / params.freq;
        return [
          { label: 'Wavelength', value: `${lambda.toFixed(1)} cells` },
          { label: 'Spacing / λ', value: (params.sep / lambda).toFixed(2) },
        ];
      },
      charts() {
        // intensity profile along the right edge (the "screen")
        const x = W - SPONGE - 4;
        const bins = 60, data = new Array(bins).fill(0);
        for (let y = 0; y < H; y++) data[Math.min(bins - 1, Math.floor((y / H) * bins))] += inten[y * W + x];
        return [{ title: 'Intensity on the right edge (screen)', kind: 'bars', series: [{ data, color: '#ffb547' }], min: 0, xLabel: 'top → bottom' }];
      },
    };
  },
};
