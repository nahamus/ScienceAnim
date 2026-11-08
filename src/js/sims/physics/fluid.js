import { C, CMAPS, clamp, tag } from '../../core/util.js';

// Real-time incompressible fluid (Jos Stam's "Stable Fluids") on a CPU grid.
export default {
  id: 'fluid',
  title: 'Fluid Dynamics',
  category: 'physics',
  tagline: 'Stir a living fluid: vortices, jets, wakes and the swirling billows of clouds.',
  blurb:
    'Fluids obey the Navier–Stokes equations: momentum is carried along by the flow, pressure keeps the fluid from compressing, and viscosity smooths things out. Simple rules, astonishing results — the swirl of cream in coffee, the wake behind an island, the bands of Jupiter.',
  ideas: [
    'Fluids carry their own momentum along with them (advection) — that is what makes them swirl.',
    'Pressure instantly redistributes flow so that water never piles up or thins out (incompressibility).',
    'Flow past an obstacle sheds alternating vortices: the <b>von Kármán vortex street</b>.',
    'Two layers sliding past each other roll up into waves: the <b>Kelvin–Helmholtz instability</b>.',
  ],
  hint: 'Drag across the fluid to stir it',
  thumbFrames: 220,
  params: [
    {
      key: 'mode', label: 'Scene', type: 'select', value: 'paint',
      options: [
        { value: 'paint', label: 'Ink tank' },
        { value: 'jets', label: 'Colliding jets' },
        { value: 'cylinder', label: 'Wind tunnel' },
        { value: 'shear', label: 'Shear layer' },
      ],
    },
    { key: 'vort', label: 'Swirl (vorticity boost)', type: 'range', min: 0, max: 3, step: 0.05, value: 1.2 },
    { key: 'visc', label: 'Viscosity', type: 'range', min: 0, max: 1, step: 0.01, value: 0.05 },
    { key: 'fade', label: 'Ink fading', type: 'range', min: 0, max: 1, step: 0.01, value: 0.15 },
    { key: 'curl', label: 'Show spin (vorticity)', type: 'toggle', value: false },
  ],
  story: [
    {
      title: 'Ink in water',
      text: 'Coloured ink is injected into still water. The fluid carries the ink — and its own momentum — along with it, curling into eddies that stretch and fold the colour.',
      params: { mode: 'paint', vort: 1.2, curl: false },
      duration: 12,
    },
    {
      title: 'Colliding jets',
      text: 'Two jets crash head-on. Water can’t compress, so it squirts sideways and rolls up into <b>mushroom-shaped vortex pairs</b>.',
      formula: '∇ · u = 0',
      params: { mode: 'jets', curl: false },
      duration: 14,
    },
    {
      title: 'A wake of vortices',
      text: 'Wind blows past a cylinder. Behind it, swirls peel off alternately from the top and bottom — a <b>von Kármán vortex street</b>. Satellites see the same pattern in clouds downwind of islands.',
      params: { mode: 'cylinder', vort: 1, curl: false, visc: 0, fade: 0.25 },
      duration: 16,
    },
    {
      title: 'Seeing the spin',
      text: 'Colour now shows <b>vorticity</b> — how fast each bit of fluid is spinning. Orange spins one way, blue the other. The vortices alternate like a zipper.',
      params: { mode: 'cylinder', curl: true },
      duration: 12,
    },
    {
      title: 'Clouds that curl',
      text: 'A fast layer slides over a slow one. Tiny ripples grow into rolling billows — the <b>Kelvin–Helmholtz instability</b>, seen in clouds, ocean currents and Jupiter’s bands.',
      formula: '∂u/∂t + (u·∇)u = −∇p/ρ + ν∇²u',
      params: { mode: 'shear', curl: false, vort: 1.4, fade: 0.05 },
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Drag through the fluid to stir it. Try raising viscosity — the fluid becomes syrupy and the swirls die out.',
      params: { mode: 'paint', curl: false, vort: 1.4, visc: 0.05, fade: 0.12 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let W, H, S, u, v, u0, v0, p, div, r, g, b, r0, g0, b0, solid, img, off, octx, t = 0, hue = 0;
    let lastP = null;
    const IX = (i, j) => i + S * j;

    function alloc() {
      const aspect = api.w / api.h;
      W = Math.round(clamp(Math.sqrt(19000 * aspect), 60, 240));
      H = Math.round(W / aspect);
      S = W + 2;
      const n = S * (H + 2);
      [u, v, u0, v0, p, div, r, g, b, r0, g0, b0] = Array.from({ length: 12 }, () => new Float32Array(n));
      solid = new Uint8Array(n);
      off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      octx = off.getContext('2d');
      img = octx.createImageData(W, H);
      scene();
    }

    function scene() {
      for (const a of [u, v, u0, v0, p, r, g, b]) a.fill(0);
      solid.fill(0);
      const m = params.mode;
      if (m === 'cylinder') {
        const cx = W * 0.22, cy = H / 2 + 0.5, rad = H * 0.09;
        for (let j = 1; j <= H; j++) for (let i = 1; i <= W; i++) if ((i - cx) ** 2 + (j - cy) ** 2 < rad * rad) solid[IX(i, j)] = 1;
      }
      t = 0;
    }

    function bnd(kind, x) {
      const m = params.mode;
      const tunnel = m === 'cylinder' || m === 'shear';
      for (let j = 1; j <= H; j++) {
        if (tunnel) {
          x[IX(0, j)] = kind === 1 ? inflowU(j) : kind === 2 ? 0 : x[IX(1, j)];
          x[IX(W + 1, j)] = x[IX(W, j)];
        } else {
          x[IX(0, j)] = kind === 1 ? -x[IX(1, j)] : x[IX(1, j)];
          x[IX(W + 1, j)] = kind === 1 ? -x[IX(W, j)] : x[IX(W, j)];
        }
      }
      for (let i = 1; i <= W; i++) {
        x[IX(i, 0)] = kind === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
        x[IX(i, H + 1)] = kind === 2 ? -x[IX(i, H)] : x[IX(i, H)];
      }
    }
    const inflowU = (j) => {
      if (params.mode === 'shear') return j < H / 2 ? 34 : 8;
      return 40;
    };

    function advect(kind, d, d0, dt) {
      for (let j = 1; j <= H; j++)
        for (let i = 1; i <= W; i++) {
          const k = IX(i, j);
          let x = i - dt * u[k], y = j - dt * v[k];
          x = clamp(x, 0.5, W + 0.5);
          y = clamp(y, 0.5, H + 0.5);
          const i0 = x | 0, j0 = y | 0, s1 = x - i0, t1 = y - j0;
          d[k] = (1 - s1) * ((1 - t1) * d0[IX(i0, j0)] + t1 * d0[IX(i0, j0 + 1)]) + s1 * ((1 - t1) * d0[IX(i0 + 1, j0)] + t1 * d0[IX(i0 + 1, j0 + 1)]);
        }
      bnd(kind, d);
    }

    function project() {
      for (let j = 1; j <= H; j++)
        for (let i = 1; i <= W; i++) {
          const k = IX(i, j);
          div[k] = -0.5 * (u[k + 1] - u[k - 1] + v[k + S] - v[k - S]);
          p[k] = 0;
        }
      bnd(0, div);
      bnd(0, p);
      for (let it = 0; it < 22; it++) {
        for (let j = 1; j <= H; j++)
          for (let i = 1; i <= W; i++) {
            const k = IX(i, j);
            p[k] = (div[k] + p[k - 1] + p[k + 1] + p[k - S] + p[k + S]) / 4;
          }
        bnd(0, p);
      }
      for (let j = 1; j <= H; j++)
        for (let i = 1; i <= W; i++) {
          const k = IX(i, j);
          u[k] -= 0.5 * (p[k + 1] - p[k - 1]);
          v[k] -= 0.5 * (p[k + S] - p[k - S]);
        }
      bnd(1, u);
      bnd(2, v);
    }

    function vorticity(dt) {
      const eps = params.vort * 9;
      if (eps <= 0) return;
      const w = u0; // reuse buffer for curl
      for (let j = 1; j <= H; j++)
        for (let i = 1; i <= W; i++) {
          const k = IX(i, j);
          w[k] = 0.5 * (v[k + 1] - v[k - 1] - u[k + S] + u[k - S]);
        }
      for (let j = 2; j < H; j++)
        for (let i = 2; i < W; i++) {
          const k = IX(i, j);
          const nx = 0.5 * (Math.abs(w[k + 1]) - Math.abs(w[k - 1]));
          const ny = 0.5 * (Math.abs(w[k + S]) - Math.abs(w[k - S]));
          const len = Math.hypot(nx, ny) + 1e-5;
          u[k] += dt * eps * (ny / len) * w[k];
          v[k] -= dt * eps * (nx / len) * w[k];
        }
    }

    function splat(x, y, fx, fy, col, rad = 4, amt = 1) {
      const i0 = Math.max(1, Math.floor(x - rad * 2)), i1 = Math.min(W, Math.ceil(x + rad * 2));
      const j0 = Math.max(1, Math.floor(y - rad * 2)), j1 = Math.min(H, Math.ceil(y + rad * 2));
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const k = IX(i, j);
          const f = Math.exp(-((i - x) ** 2 + (j - y) ** 2) / (rad * rad));
          u[k] += fx * f;
          v[k] += fy * f;
          r[k] += col[0] * f * amt;
          g[k] += col[1] * f * amt;
          b[k] += col[2] * f * amt;
        }
    }
    const hueRGB = (h) => {
      const f = (n) => {
        const k = (n + h / 30) % 12;
        return 0.5 - 0.5 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      };
      return [f(0), f(8), f(4)];
    };

    function sources(dt) {
      const m = params.mode;
      if (m === 'paint') {
        const idle = !api.runner.pointer.down;
        if (idle) {
          // two slowly orbiting emitters keep the tank alive
          for (let e = 0; e < 2; e++) {
            const a = t * 0.6 + e * Math.PI;
            const x = W / 2 + Math.cos(a) * W * 0.22, y = H / 2 + Math.sin(a * 1.3) * H * 0.25;
            const d = a + Math.PI / 2 + Math.sin(t * 1.7 + e) * 0.8;
            splat(x, y, Math.cos(d) * 160 * dt * 4, Math.sin(d) * 160 * dt * 4, hueRGB((hue + e * 160) % 360), 3.2, dt * 9);
          }
        }
      } else if (m === 'jets') {
        const wob = Math.sin(t * 1.3) * 0.25;
        splat(6, H / 2 + Math.sin(t * 0.7) * 3, Math.cos(wob) * 900 * dt, Math.sin(wob) * 900 * dt, [0.1, 0.75, 1], 3, dt * 14);
        splat(W - 5, H / 2 - Math.sin(t * 0.9) * 3, -Math.cos(wob) * 900 * dt, -Math.sin(wob) * 900 * dt, [1, 0.25, 0.6], 3, dt * 14);
      } else if (m === 'cylinder') {
        // thin streaklines upstream, plus coloured dye released at the cylinder's top and bottom edges
        const n = 11;
        for (let s = 1; s < n; s++) {
          const k = IX(1, Math.round((s * H) / n));
          r[k] = 0.25; g[k] = 0.32; b[k] = 0.45;
        }
        const cx = W * 0.22, rad = H * 0.09;
        splat(cx + rad * 0.2, H / 2 - rad - 0.8, 0, 0, [0.15, 0.7, 1], 1.6, dt * 30);
        splat(cx + rad * 0.2, H / 2 + rad + 1.8, 0, 0, [1, 0.5, 0.12], 1.6, dt * 30);
        // a tiny early nudge breaks the symmetry and starts shedding
        if (t < 0.4) for (let j = 1; j <= H; j++) v[IX(Math.round(W * 0.3), j)] += 3;
      } else if (m === 'shear') {
        for (let j = 1; j <= H; j++) {
          const k = IX(1, j);
          const c = j < H / 2 ? [0.15, 0.55, 1] : [1, 0.75, 0.25];
          const band = Math.abs(j - H / 2) < H * 0.06 ? 1 : 0.35;
          r[k] = c[0] * band; g[k] = c[1] * band; b[k] = c[2] * band;
          v[IX(2, j)] += Math.sin(t * 3.1) * 2.2 * dt * 60 * (Math.abs(j - H / 2) < 4 ? 1 : 0);
        }
      }
    }

    function step(dt) {
      t += dt;
      hue = (hue + dt * 25) % 360;
      sources(dt);
      vorticity(dt);
      // viscosity as simple velocity damping + light smoothing
      const damp = Math.exp(-params.visc * 3 * dt);
      for (let k = 0; k < u.length; k++) {
        u[k] *= damp;
        v[k] *= damp;
      }
      for (let k = 0; k < u.length; k++) if (solid[k]) u[k] = v[k] = 0;
      project();
      u0.set(u);
      v0.set(v);
      advect(1, u, u0, dt);
      advect(2, v, v0, dt);
      for (let k = 0; k < u.length; k++) if (solid[k]) u[k] = v[k] = 0;
      project();
      r0.set(r); g0.set(g); b0.set(b);
      advect(0, r, r0, dt);
      advect(0, g, g0, dt);
      advect(0, b, b0, dt);
      const f = Math.exp(-params.fade * 1.2 * dt);
      for (let k = 0; k < r.length; k++) {
        if (solid[k]) { r[k] = g[k] = b[k] = 0; continue; }
        r[k] *= f; g[k] *= f; b[k] *= f;
      }
    }

    return {
      resize: alloc,
      reset: scene,
      onParam(k) {
        if (k === 'mode') scene();
      },
      pointerDown(pt) {
        lastP = { x: pt.x, y: pt.y };
      },
      pointerMove(pt) {
        if (!pt.down || !lastP) return;
        const sx = W / api.w, sy = H / api.h;
        const dx = pt.x - lastP.x, dy = pt.y - lastP.y;
        splat(pt.x * sx, pt.y * sy, dx * sx * 18, dy * sy * 18, hueRGB(hue), 3.5, 0.9);
        lastP = { x: pt.x, y: pt.y };
      },
      pointerUp() {
        lastP = null;
      },
      update(dt) {
        step(Math.min(dt, 1 / 30));
      },
      draw() {
        const d = img.data;
        if (params.curl) {
          const lut = CMAPS.diverge;
          for (let j = 1; j <= H; j++)
            for (let i = 1; i <= W; i++) {
              const k = IX(i, j);
              const w = 0.5 * (v[k + 1] - v[k - 1] - u[k + S] + u[k - S]);
              const li = (clamp(Math.tanh(w * 0.12) * 0.5 + 0.5, 0, 1) * 255) | 0;
              const o = ((j - 1) * W + (i - 1)) * 4;
              const s = solid[k];
              d[o] = s ? 90 : lut[li * 3]; d[o + 1] = s ? 100 : lut[li * 3 + 1]; d[o + 2] = s ? 130 : lut[li * 3 + 2]; d[o + 3] = 255;
            }
        } else {
          for (let j = 1; j <= H; j++)
            for (let i = 1; i <= W; i++) {
              const k = IX(i, j);
              const o = ((j - 1) * W + (i - 1)) * 4;
              if (solid[k]) { d[o] = 40; d[o + 1] = 46; d[o + 2] = 74; d[o + 3] = 255; continue; }
              // soft tone-mapping so dense ink glows instead of clipping
              const R = r[k], G = g[k], B = b[k];
              d[o] = 255 * (1 - Math.exp(-R * 1.6)) + 4;
              d[o + 1] = 255 * (1 - Math.exp(-G * 1.6)) + 6;
              d[o + 2] = 255 * (1 - Math.exp(-B * 1.6)) + 14;
              d[o + 3] = 255;
            }
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(off, 0, 0, api.w, api.h);
        if (params.mode === 'cylinder') {
          const sx = api.w / W, sy = api.h / H;
          const cx = (W * 0.22 - 0.5) * sx, cy = (H / 2) * sy, rad = H * 0.09 * sy;
          const gr = ctx.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.1, cx, cy, rad);
          gr.addColorStop(0, '#9aa6cc');
          gr.addColorStop(1, '#2a3150');
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.fill();
          if (!api.thumbnail) tag(ctx, 'wind →', 18, 84, C.cyan);
        }
      },
      stats() {
        let ke = 0, maxw = 0;
        for (let j = 1; j <= H; j += 2)
          for (let i = 1; i <= W; i += 2) {
            const k = IX(i, j);
            ke += u[k] * u[k] + v[k] * v[k];
            maxw = Math.max(maxw, Math.abs(0.5 * (v[k + 1] - v[k - 1] - u[k + S] + u[k - S])));
          }
        return [
          { label: 'Grid', value: `${W} × ${H}` },
          { label: 'Kinetic energy', value: (ke / 1e4).toFixed(1) },
          { label: 'Peak spin', value: maxw.toFixed(1) },
        ];
      },
    };
  },
};
