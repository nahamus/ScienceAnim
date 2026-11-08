import { fullscreenShader } from '../../core/gl.js';

const FRAG = `
uniform vec2 uRes, uCenter, uC;
uniform float uScale, uIter, uJulia, uPal, uTime;
varying vec2 vUv;
vec3 pal(float t) {
  if (uPal < 0.5) return 0.5 + 0.5 * cos(6.28318 * (t * vec3(1.0, 1.0, 1.0) + vec3(0.0, 0.1, 0.2)));
  if (uPal < 1.5) return 0.5 + 0.5 * cos(6.28318 * (t * vec3(1.0, 0.7, 0.4) + vec3(0.0, 0.15, 0.20)));
  return 0.5 + 0.5 * cos(6.28318 * (t * vec3(0.8, 0.8, 0.5) + vec3(0.6, 0.45, 0.25)));
}
void main() {
  vec2 p = (vUv * uRes - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 pos = uCenter + p * uScale;
  vec2 z = uJulia > 0.5 ? pos : vec2(0.0);
  vec2 c = uJulia > 0.5 ? uC : pos;
  float n = 0.0;
  float trap = 1e9;
  for (int i = 0; i < 1500; i++) {
    if (float(i) >= uIter) break;
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    trap = min(trap, abs(length(z) - 0.5));
    if (dot(z, z) > 256.0) break;
    n += 1.0;
  }
  vec3 col;
  if (n >= uIter) {
    col = vec3(0.01, 0.01, 0.025) + 0.08 * vec3(0.3, 0.4, 1.0) * exp(-trap * 12.0);
  } else {
    float sn = n - log2(log2(dot(z, z))) + 4.0;
    float t = sn * 0.025 + uTime * 0.02;
    col = pal(t);
    col *= 0.35 + 0.65 * smoothstep(0.0, 1.0, sn / 18.0);
  }
  gl_FragColor = vec4(pow(col, vec3(0.9)), 1.0);
}`;

const TARGETS = {
  home: { x: -0.6, y: 0, s: 2.6 },
  seahorse: { x: -0.743643887, y: 0.131825904, s: 2e-5 },
  mini: { x: -1.7548776662, y: 0, s: 2.5e-4 },
  spiral: { x: -0.761574, y: -0.0847596, s: 1e-4 },
};

export default {
  id: 'mandelbrot',
  title: 'The Mandelbrot Set',
  category: 'math',
  tagline: 'Infinite complexity from z → z² + c. Dive into the most famous shape in mathematics.',
  ages: ['14-16', '16+'],
  topics: ['Complex numbers', 'Fractals'],
  blurb:
    'Take a number, square it and add a constant. Repeat. For some constants the numbers stay small forever; for others they explode. Colour the plane by which is which, and the Mandelbrot set appears — a boundary of infinite intricacy, endlessly self-similar, from a rule a child could follow.',
  ideas: [
    'The black region is every c for which repeating z → z² + c never escapes to infinity.',
    'Colours show <b>how quickly</b> points escape.',
    'The boundary is a <b>fractal</b>: zoom forever and new detail keeps appearing.',
    'Tiny copies of the whole set appear all along its edge — <b>self-similarity</b>.',
    'Every point c also has its own <b>Julia set</b>; the Mandelbrot set is a map of all of them.',
  ],
  hint: 'Drag to pan · scroll to zoom · in Julia mode, move the cursor to change c',
  renderer: 'webgl',
  renderScale: 0.8,
  thumbChapter: 1,
  thumbFrames: 300,
  params: [
    { key: 'mode', label: 'Fractal', type: 'select', value: 'mandel', options: [{ value: 'mandel', label: 'Mandelbrot' }, { value: 'julia', label: 'Julia' }] },
    { key: 'iter', label: 'Max iterations', type: 'range', min: 50, max: 1500, step: 10, value: 300 },
    { key: 'pal', label: 'Palette', type: 'select', value: 1, options: [{ value: 0, label: 'Rainbow' }, { value: 1, label: 'Ember' }, { value: 2, label: 'Ocean' }] },
    { key: 'cycle', label: 'Cycle colours', type: 'toggle', value: true },
    { key: 'home', label: 'Reset view', type: 'button', action: (s) => s.fly('home') },
  ],
  story: [
    {
      title: 'One simple rule',
      text: 'For each point c, start at zero and repeat <b>z → z² + c</b>. If z stays small forever, colour the point black — it’s in the set. Otherwise colour it by how fast it escapes.',
      formula: 'z<sub>n+1</sub> = z<sub>n</sub><sup>2</sup> + c',
      params: { mode: 'mandel', iter: 300 },
      enter: (s) => s.fly('home', 0.1),
      duration: 11,
    },
    {
      title: 'Dive into the edge',
      text: 'We’re zooming into “Seahorse Valley”. However far we go, the boundary never smooths out. By the end of this dive we’re magnified over <b>100,000 times</b>.',
      params: { iter: 600 },
      enter: (s) => s.fly('seahorse', 13),
      duration: 15,
    },
    {
      title: 'Copies of itself',
      text: 'Out along the set’s spiky antenna sits a perfect miniature of the whole Mandelbrot set. There are infinitely many of these — the set contains endless copies of itself.',
      params: { iter: 500 },
      enter: (s) => s.fly('mini', 10),
      duration: 14,
    },
    {
      title: 'Julia sets',
      text: 'Fix c and colour by the starting z instead, and you get a <b>Julia set</b>. As c wanders around the edge of the Mandelbrot set, its Julia set morphs between dust, dragons and lightning.',
      params: { mode: 'julia', iter: 300 },
      enter: (s) => s.fly('home', 0.1, true),
      duration: 16,
    },
    {
      title: 'Explore',
      text: 'Drag to pan and scroll to zoom. Switch to Julia mode and move your cursor to pick c. Increase iterations when you zoom deep.',
      params: { mode: 'mandel', iter: 400 },
      enter: (s) => s.fly('spiral', 12),
      duration: 20,
    },
  ],
  create(api) {
    const { gl, params } = api;
    const shader = fullscreenShader(gl, FRAG);
    let cx = -0.6, cy = 0, ls = Math.log(2.6), fly = null, drag = null, t = 0, jc = [-0.8, 0.156], autoJ = true;

    function flyTo(name, dur = 8, julia = false) {
      const T = TARGETS[name];
      if (julia) {
        cx = 0;
        cy = 0;
        ls = Math.log(3.2);
        fly = null;
        autoJ = true;
        return;
      }
      fly = { x0: cx, y0: cy, l0: ls, x1: T.x, y1: T.y, l1: Math.log(T.s), t: 0, dur: Math.max(0.1, dur) };
    }
    return {
      fly: flyTo,
      onParam(k, v) {
        if (k === 'mode') {
          if (v === 'julia') flyTo('home', 0.1, true);
          else flyTo('home', 0.1);
        }
      },
      pointerDown(p) {
        drag = { x: p.x, y: p.y, cx, cy };
        fly = null;
      },
      pointerMove(p) {
        if (params.mode === 'julia' && !drag && p.inside) {
          autoJ = false;
          jc = [-2 + (p.x / api.w) * 2.8, 1.2 - (p.y / api.h) * 2.4];
        }
        if (!drag) return;
        const sc = Math.exp(ls) / Math.min(api.w, api.h);
        cx = drag.cx - (p.x - drag.x) * sc;
        cy = drag.cy + (p.y - drag.y) * sc;
      },
      pointerUp() {
        drag = null;
      },
      wheel(p, dy) {
        fly = null;
        const sc = Math.exp(ls) / Math.min(api.w, api.h);
        const mx = cx + (p.x - api.w / 2) * sc, my = cy - (p.y - api.h / 2) * sc;
        const f = Math.exp(dy * 0.0015);
        ls = Math.max(Math.log(1e-5), Math.min(Math.log(4), ls + Math.log(f)));
        const sc2 = Math.exp(ls) / Math.min(api.w, api.h);
        cx = mx - (p.x - api.w / 2) * sc2;
        cy = my + (p.y - api.h / 2) * sc2;
      },
      update(dt) {
        t += dt;
        if (fly) {
          fly.t += dt;
          const k = Math.min(1, fly.t / fly.dur);
          const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          ls = fly.l0 + (fly.l1 - fly.l0) * e;
          // centre converges faster than zoom so the target stays in view
          const ck = 1 - Math.pow(1 - Math.min(1, k * 2.2), 3);
          cx = fly.x0 + (fly.x1 - fly.x0) * ck;
          cy = fly.y0 + (fly.y1 - fly.y0) * ck;
          if (k >= 1) fly = null;
        }
        if (params.mode === 'julia' && autoJ) {
          // walk c just inside the main cardioid's edge: c = u/2 − u²/4, u = r·e^{ia}
          const a = t * 0.18, r = 0.985 + 0.03 * Math.sin(t * 0.5);
          const ux = r * Math.cos(a), uy = r * Math.sin(a);
          jc = [ux / 2 - (ux * ux - uy * uy) / 4, uy / 2 - (2 * ux * uy) / 4];
        }
      },
      draw() {
        shader.draw({
          uRes: [gl.drawingBufferWidth, gl.drawingBufferHeight],
          uCenter: [cx, cy],
          uScale: Math.exp(ls),
          uIter: params.iter,
          uJulia: params.mode === 'julia' ? 1 : 0,
          uC: jc,
          uPal: params.pal,
          uTime: params.cycle ? t : 0,
        });
      },
      stats() {
        return [
          { label: 'Magnification', value: `${(2.6 / Math.exp(ls)).toExponential(1).replace('e+', '×10^')}` },
          { label: 'Centre', value: `${cx.toFixed(5)}, ${cy.toFixed(5)}` },
          params.mode === 'julia' ? { label: 'c', value: `${jc[0].toFixed(3)} ${jc[1] >= 0 ? '+' : '−'} ${Math.abs(jc[1]).toFixed(3)}i` } : { label: 'Iterations', value: String(params.iter) },
        ];
      },
    };
  },
};
