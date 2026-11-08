import { C, TAU, clamp, drawGlow, tag, text, seeded } from '../../core/util.js';

export default {
  id: 'screens',
  title: 'How Screens Make Pictures',
  category: 'tech',
  tagline: 'Millions of tiny red, green and blue lights fool your eyes into seeing a photo.',
  blurb:
    'Look closely at any screen — phone, laptop or TV — and the picture dissolves into a grid of pixels. Look closer still and each pixel is just three tiny lights: red, green and blue. By varying their brightness, a screen can make almost any colour your eye can see. Old tube TVs painted the picture line by line with an electron beam, fast enough that you never noticed.',
  ideas: [
    'An image is a grid of <b>pixels</b>, each storing one colour as three numbers.',
    'Each pixel is made of <b>red, green and blue subpixels</b>; your eye blends them.',
    'Light adds up: red + green = <b>yellow</b>, all three = <b>white</b> (additive mixing).',
    'Screens redraw the whole picture <b>60+ times a second</b>; old CRTs drew it one line at a time.',
  ],
  hint: 'Drag to move the magnifying glass',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 30,
  params: [
    { key: 'mode', label: 'View', type: 'select', value: 'zoom', options: [{ value: 'zoom', label: 'Zoom in' }, { value: 'mix', label: 'Colour mixing' }, { value: 'scan', label: 'Old TV scanning' }] },
    { key: 'zoom', label: 'Magnification', type: 'range', min: 1, max: 60, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'res', label: 'Resolution (pixels across)', type: 'range', min: 16, max: 320, step: 4, value: 160, instant: true },
    { key: 'R', label: 'Red', type: 'range', min: 0, max: 255, step: 1, value: 255 },
    { key: 'G', label: 'Green', type: 'range', min: 0, max: 255, step: 1, value: 255 },
    { key: 'B', label: 'Blue', type: 'range', min: 0, max: 255, step: 1, value: 0 },
    { key: 'scan', label: 'Scan speed', type: 'range', min: 0.02, max: 2, step: 0.01, value: 0.15, format: (v) => v.toFixed(2) + ' frames/s' },
  ],
  story: [
    {
      title: 'A picture',
      text: 'A sunset over the sea, as your screen shows it. It looks smooth and continuous. Let’s zoom in.',
      params: { mode: 'zoom', zoom: 1, res: 160 },
      duration: 8,
    },
    {
      title: 'Pixels',
      text: 'Magnify and the picture breaks into a grid of square <b>pixels</b>. Each holds one colour, stored as three bytes: how much red, green and blue.',
      params: { mode: 'zoom', zoom: 9 },
      tween: 5,
      duration: 12,
    },
    {
      title: 'Red, green and blue',
      text: 'Closer still: every pixel is really three tiny lights — a red, a green and a blue <b>subpixel</b>. They are too small for your eye to separate at normal distance, so it blends them into one colour.',
      params: { mode: 'zoom', zoom: 45 },
      tween: 5,
      duration: 14,
    },
    {
      title: 'Mixing light',
      text: 'Light adds, unlike paint. Red and green light together look <b>yellow</b>. Add blue as well and you get white. With 256 levels for each, a screen can make 16.7 million colours from just three.',
      formula: 'R + G = yellow,   G + B = cyan,   R + B = magenta,   R + G + B = white',
      params: { mode: 'mix', R: 255, G: 255, B: 0 },
      duration: 14,
    },
    {
      title: 'More pixels, more detail',
      text: 'Lower the resolution and the image turns blocky; raise it and edges become smooth. A 4K TV has 3840 × 2160 ≈ <b>8.3 million</b> pixels — about 25 million subpixels — refreshed 60 or more times every second.',
      params: { mode: 'zoom', zoom: 1, res: 24 },
      enter: (s, r) => s.later(5, () => r.set('res', 320)),
      duration: 13,
    },
    {
      title: 'How old TVs did it',
      text: 'A tube TV fired a beam of electrons at a glowing screen, sweeping it across one line at a time, top to bottom, 50–60 times a second. Each spot glowed only briefly; your eye’s persistence filled in the rest. Here it is in very slow motion.',
      params: { mode: 'scan', scan: 0.15, res: 120 },
      duration: 16,
    },
    {
      title: 'Explore',
      text: 'Drag the magnifier, change the resolution, or mix your own colour with the R, G and B sliders.',
      params: { mode: 'zoom', zoom: 20, res: 160 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let img = null, imgKey = '', data = null, IW = 0, IH = 0, focus = [0.62, 0.42], drag = null, phos = null, pctx = null, beam = 0, jobs = [];

    function makeImage() {
      const res = Math.round(params.res);
      const key = res + 'x' + Math.round((api.h / Math.max(1, api.w)) * 1000);
      if (key === imgKey) return;
      imgKey = key;
      IW = res;
      IH = Math.max(8, Math.round((res * api.h) / Math.max(1, api.w)));
      img = document.createElement('canvas');
      img.width = IW;
      img.height = IH;
      const g = img.getContext('2d');
      const sx = IW / 400;
      g.scale(sx, sx);
      const H = IH / sx;
      const sky = g.createLinearGradient(0, 0, 0, H * 0.62);
      sky.addColorStop(0, '#1b1446');
      sky.addColorStop(0.5, '#a4386b');
      sky.addColorStop(0.85, '#ff8a3d');
      sky.addColorStop(1, '#ffd27a');
      g.fillStyle = sky;
      g.fillRect(0, 0, 400, H * 0.62);
      g.fillStyle = '#fff1b8';
      g.beginPath();
      g.arc(250, H * 0.56, 38, 0, TAU);
      g.fill();
      const r = seeded(3);
      g.fillStyle = '#2a1840';
      g.beginPath();
      g.moveTo(0, H * 0.62);
      for (let x = 0; x <= 400; x += 10) g.lineTo(x, H * 0.62 - 30 - Math.abs(Math.sin(x * 0.018)) * 60 - r() * 10 + (x > 200 ? 40 : 0));
      g.lineTo(400, H * 0.62);
      g.fill();
      const sea = g.createLinearGradient(0, H * 0.62, 0, H);
      sea.addColorStop(0, '#5a2a5a');
      sea.addColorStop(1, '#0d1030');
      g.fillStyle = sea;
      g.fillRect(0, H * 0.62, 400, H);
      for (let k = 0; k < 26; k++) {
        g.fillStyle = `rgba(255,210,140,${0.7 - k * 0.025})`;
        const y = H * 0.64 + k * 6;
        const wd = 60 - k * 1.6 + r() * 20;
        g.fillRect(250 - wd / 2 + (r() - 0.5) * 10, y, wd, 2.5);
      }
      data = g.getImageData(0, 0, IW, IH).data;
      phos = null;
    }

    return {
      later(t, fn) {
        jobs.push({ t, fn });
      },
      resize() {
        imgKey = '';
      },
      pointerDown(p) {
        drag = [p.x, p.y];
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        const z = params.zoom;
        focus[0] = clamp(focus[0] - (p.x - drag[0]) / api.w / z, 0, 1);
        focus[1] = clamp(focus[1] - (p.y - drag[1]) / api.h / z, 0, 1);
        drag = [p.x, p.y];
      },
      pointerUp() {
        drag = null;
      },
      update(dt) {
        for (const j of jobs) if ((j.t -= dt) <= 0) j.fn(api.runner);
        jobs = jobs.filter((j) => j.t > 0);
        makeImage();
        if (params.mode === 'scan') beam = (beam + dt * params.scan) % 1;
      },
      draw() {
        const { w, h } = api;
        makeImage();
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        if (params.mode === 'zoom') {
          const z = params.zoom;
          const vw = IW / z, vh = IH / z;
          const x0 = clamp(focus[0] * IW - vw / 2, 0, IW - vw), y0 = clamp(focus[1] * IH - vh / 2, 0, IH - vh);
          const px = w / vw; // screen pixels per image pixel
          if (px < 14) {
            ctx.imageSmoothingEnabled = px < 3;
            ctx.drawImage(img, x0, y0, vw, vh, 0, 0, w, h);
            ctx.imageSmoothingEnabled = true;
            if (px > 5) {
              ctx.strokeStyle = 'rgba(0,0,0,0.35)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              for (let i = Math.ceil(x0); i < x0 + vw; i++) {
                const x = (i - x0) * px;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
              }
              for (let j = Math.ceil(y0); j < y0 + vh; j++) {
                const y = (j - y0) * px;
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
              }
              ctx.stroke();
            }
          } else {
            // individual pixels drawn as RGB subpixel stripes
            const blend = clamp((px - 14) / 30, 0, 1);
            for (let j = Math.floor(y0); j < Math.min(IH, y0 + vh + 1); j++)
              for (let i = Math.floor(x0); i < Math.min(IW, x0 + vw + 1); i++) {
                const k = (j * IW + i) * 4;
                const r = data[k], g = data[k + 1], b = data[k + 2];
                const sx = (i - x0) * px, sy = (j - y0) * px;
                ctx.fillStyle = `rgb(${r * (1 - blend)},${g * (1 - blend)},${b * (1 - blend)})`;
                ctx.fillRect(sx, sy, px, px);
                if (blend > 0) {
                  const sw = px / 3;
                  const pad = px * 0.08;
                  ctx.globalCompositeOperation = 'lighter';
                  ctx.fillStyle = `rgba(255,0,0,${(r / 255) * blend})`;
                  ctx.fillRect(sx + pad, sy + pad, sw - pad * 1.2, px - pad * 2);
                  ctx.fillStyle = `rgba(0,255,0,${(g / 255) * blend})`;
                  ctx.fillRect(sx + sw + pad * 0.4, sy + pad, sw - pad * 1.2, px - pad * 2);
                  ctx.fillStyle = `rgba(0,90,255,${(b / 255) * blend})`;
                  ctx.fillRect(sx + 2 * sw - pad * 0.2, sy + pad, sw - pad * 1.2, px - pad * 2);
                  ctx.globalCompositeOperation = 'source-over';
                }
                if (px > 60 && !api.thumbnail) text(ctx, `${r},${g},${b}`, sx + px / 2, sy + px - 10, { size: 10, align: 'center', mono: true, color: 'rgba(255,255,255,0.75)' });
              }
          }
          if (!api.thumbnail) tag(ctx, `${z.toFixed(1)}× · ${IW} × ${IH} pixels`, w - 16, 84, C.ink, { align: 'right', size: 11 });
        } else if (params.mode === 'mix') {
          const cx = w * (w > 760 ? 0.55 : 0.5), cy = h * 0.42, R = Math.min(w, h) * 0.17;
          ctx.globalCompositeOperation = 'lighter';
          const circ = (x, y, col) => {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(x, y, R, 0, TAU);
            ctx.fill();
          };
          circ(cx, cy - R * 0.55, `rgb(${params.R},0,0)`);
          circ(cx - R * 0.55, cy + R * 0.4, `rgb(0,${params.G},0)`);
          circ(cx + R * 0.55, cy + R * 0.4, `rgb(0,0,${params.B})`);
          ctx.globalCompositeOperation = 'source-over';
          const sw = Math.min(140, w * 0.2);
          const col = `rgb(${params.R},${params.G},${params.B})`;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(w - sw - 24, 110, sw, sw, 16) : ctx.rect(w - sw - 24, 110, sw, sw);
          ctx.fill();
          if (!api.thumbnail) {
            tag(ctx, `mixed: (${params.R}, ${params.G}, ${params.B})`, w - sw / 2 - 24, 110 + sw + 22, C.ink, { align: 'center', size: 11 });
            text(ctx, 'red', cx, cy - R * 1.7, { size: 12, align: 'center', color: '#ff6b6b', weight: 700 });
            text(ctx, 'green', cx - R * 1.6, cy + R * 1.45, { size: 12, align: 'center', color: '#6bff7a', weight: 700 });
            text(ctx, 'blue', cx + R * 1.6, cy + R * 1.45, { size: 12, align: 'center', color: '#6b9bff', weight: 700 });
          }
        } else {
          // CRT raster scan with phosphor persistence
          const sw = Math.min(w - 40, (h - 140) * 1.5), sh = sw / 1.5;
          const ox = (w - sw) / 2, oy = 96;
          if (!phos || phos.width !== IW) {
            phos = document.createElement('canvas');
            phos.width = IW;
            phos.height = IH;
            pctx = phos.getContext('2d');
          }
          const lines = IH;
          const curLine = Math.floor(beam * lines);
          const frac = beam * lines - curLine;
          // fade, then paint the lines scanned since last frame
          pctx.fillStyle = 'rgba(0,0,0,0.035)';
          pctx.fillRect(0, 0, IW, IH);
          pctx.drawImage(img, 0, curLine, Math.max(1, Math.floor(frac * IW)), 1, 0, curLine, Math.max(1, Math.floor(frac * IW)), 1);
          if (curLine > 0) pctx.drawImage(img, 0, curLine - 1, IW, 1, 0, curLine - 1, IW, 1);
          ctx.fillStyle = '#05060a';
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(ox - 14, oy - 14, sw + 28, sh + 28, 28) : ctx.rect(ox - 14, oy - 14, sw + 28, sh + 28);
          ctx.fill();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(phos, ox, oy, sw, sh);
          ctx.imageSmoothingEnabled = true;
          // scanline texture
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          for (let j = 0; j < lines; j++) ctx.fillRect(ox, oy + ((j + 0.85) / lines) * sh, sw, Math.max(0.5, sh / lines * 0.15));
          const bx = ox + frac * sw, by = oy + ((curLine + 0.5) / lines) * sh;
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, bx, by, 18, '#ffffff', 0.3);
          ctx.globalCompositeOperation = 'source-over';
          if (!api.thumbnail) tag(ctx, `line ${curLine + 1} of ${lines}  ·  real TVs: ~60 full frames per second`, w - 16, 84, C.ink, { align: 'right', size: 11 });
        }
      },
      stats() {
        const res = Math.round(params.res);
        return [
          { label: 'Pixels', value: `${IW} × ${IH} = ${(IW * IH).toLocaleString()}` },
          { label: 'Subpixels', value: (IW * IH * 3).toLocaleString() },
          { label: 'Bytes for this image', value: (IW * IH * 3).toLocaleString(), color: C.amber },
          { label: 'A 4K screen', value: '8.3 M pixels', color: C.cyan },
          { label: 'Resolution setting', value: String(res) },
        ];
      },
    };
  },
};
