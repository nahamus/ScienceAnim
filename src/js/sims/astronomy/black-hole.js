import { fullscreenShader } from '../../core/gl.js';

// Ray-traced Schwarzschild black hole (units: Schwarzschild radius rs = 1).
// Light paths use the exact photon-orbit equation written as a = −1.5 h² r̂ / r⁴.
const FRAG = `
uniform vec2 uRes;
uniform float uTime, uYaw, uPitch, uDist, uLens, uDisk, uBeam, uRing;
varying vec2 vUv;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1, 0)), f.x), mix(hash2(i + vec2(0, 1)), hash2(i + vec2(1, 1)), f.x), f.y);
}
vec3 sky(vec3 d) {
  vec3 col = vec3(0.004, 0.006, 0.014);
  // galactic band
  float b = d.y * 2.4 + 0.35 * sin(d.x * 2.0 + d.z);
  float band = exp(-b * b);
  float neb = noise(d.xz * 4.0 + d.y * 3.0) * noise(d.zy * 7.0);
  col += band * (vec3(0.10, 0.07, 0.16) + vec3(0.22, 0.14, 0.09) * neb) * 0.5;
  // stars on two scales
  for (int i = 0; i < 3; i++) {
    float s = i == 0 ? 36.0 : (i == 1 ? 80.0 : 180.0);
    vec3 p = d * s;
    vec3 id = floor(p);
    vec3 f = fract(p) - 0.5;
    float h = hash(id);
    float th = i == 2 ? 0.88 : (i == 1 ? 0.92 : 0.95);
    if (h > th) {
      float r = length(f);
      float br = (h - th) / (1.0 - th);
      vec3 tint = mix(vec3(0.65, 0.78, 1.0), vec3(1.0, 0.82, 0.6), hash(id + 7.0));
      col += tint * smoothstep(0.3, 0.0, r) * (0.35 + br) * (i == 2 ? 1.0 : 2.4);
    }
  }
  return col;
}
vec3 blackbody(float t) {
  // t in 0..1: deep red → orange → white → blue-white
  vec3 a = vec3(1.0, 0.25, 0.05), b = vec3(1.0, 0.62, 0.25), c = vec3(1.0, 0.95, 0.85), e = vec3(0.75, 0.85, 1.0);
  return t < 0.33 ? mix(a, b, t / 0.33) : (t < 0.7 ? mix(b, c, (t - 0.33) / 0.37) : mix(c, e, (t - 0.7) / 0.3));
}
void main() {
  vec2 uv = (vUv * uRes - 0.5 * uRes) / min(uRes.x, uRes.y);
  float cy = cos(uYaw), sy = sin(uYaw), cp = cos(uPitch), sp = sin(uPitch);
  vec3 cam = uDist * vec3(cp * sy, sp, cp * cy);
  vec3 fw = normalize(-cam);
  vec3 rt = normalize(cross(fw, vec3(0, 1, 0)));
  vec3 up = cross(rt, fw);
  vec3 v = normalize(fw * 1.25 + uv.x * rt + uv.y * up);
  vec3 p = cam;
  vec3 h = cross(p, v);
  float h2 = dot(h, h);
  vec3 col = vec3(0.0);
  float T = 1.0;
  float minR = 100.0;
  for (int i = 0; i < 260; i++) {
    float r = length(p);
    minR = min(minR, r);
    if (r < 1.0) { T = 0.0; break; }
    if (r > uDist * 1.6 + 20.0) break;
    float dt = clamp(0.05 * r, 0.02, 0.8);
    vec3 a = -1.5 * h2 * p / pow(r, 5.0) * uLens;
    vec3 vn = v + a * dt;
    vec3 pn = p + vn * dt;
    if (uDisk > 0.5 && p.y * pn.y < 0.0) {
      float k = p.y / (p.y - pn.y);
      vec3 c = mix(p, pn, k);
      float rc = length(c.xz);
      if (rc > 3.0 && rc < 14.0) {
        float phi = atan(c.z, c.x);
        float omega = 1.0 / pow(rc, 1.5);
        float swirl = phi + uTime * omega * 6.0;
        float tex = 0.55 + 0.45 * noise(vec2(rc * 3.0, swirl * 6.0)) * noise(vec2(rc * 9.0, swirl * 2.0 + 3.0));
        float temp = pow(3.0 / rc, 0.75);
        float edge = smoothstep(3.0, 3.6, rc) * smoothstep(14.0, 9.0, rc);
        // relativistic Doppler beaming
        vec3 vel = normalize(vec3(-c.z, 0.0, c.x)) * sqrt(0.5 / rc);
        float beta = length(vel);
        float cosA = dot(normalize(vel), -normalize(vn));
        float g = 1.0 / (inversesqrt(1.0 - beta * beta) * (1.0 - beta * cosA));
        float boost = mix(1.0, pow(g, 3.5), uBeam);
        float tcol = clamp(temp * mix(1.0, g, uBeam * 0.8), 0.0, 1.0);
        vec3 dc = blackbody(tcol) * tex * edge * temp * 2.6 * boost;
        float op = clamp(edge * tex * 0.92, 0.0, 1.0);
        col += T * dc * op;
        T *= 1.0 - op;
        if (T < 0.02) break;
      }
    }
    v = vn;
    p = pn;
  }
  col += T * sky(normalize(v));
  // photon-ring glow from rays that skimmed r ≈ 1.5
  col += uRing * vec3(1.0, 0.8, 0.55) * 0.35 * exp(-pow((minR - 1.5) * 9.0, 2.0)) * step(1.0, minR);
  col = 1.0 - exp(-col * 1.4);
  col = pow(col, vec3(0.85));
  gl_FragColor = vec4(col, 1.0);
}`;

export default {
  id: 'black-hole',
  title: 'Inside the Gravity of a Black Hole',
  category: 'astronomy',
  tagline: 'Ray-traced in real time: watch spacetime bend starlight and its own glowing disk.',
  ages: ['16+'],
  topics: ['Gravity', 'Space', 'Relativity'],
  blurb:
    'A black hole is matter crushed so tightly that not even light can escape from within its event horizon. Around it, gravity bends the paths of light, warping the starry sky and lifting the far side of its glowing accretion disk into view. Every pixel here is a light ray traced through curved spacetime.',
  ideas: [
    'The <b>event horizon</b> is the point of no return: inside it, escape would require moving faster than light.',
    'Gravity bends light, so stars behind the hole appear distorted into arcs and rings (<b>gravitational lensing</b>).',
    'Light can orbit at 1.5× the horizon radius — the <b>photon sphere</b>, seen as a thin bright ring.',
    'Gas moving toward us looks brighter and bluer — <b>relativistic Doppler beaming</b> makes the disk lopsided.',
  ],
  hint: 'Drag to orbit the camera · scroll to zoom',
  renderer: 'webgl',
  renderScale: 0.55,
  thumbChapter: 2,
  thumbFrames: 2,
  params: [
    { key: 'lens', label: 'Gravity bends light', type: 'range', min: 0, max: 1, step: 0.01, value: 1, format: (v) => (v * 100).toFixed(0) + ' %' },
    { key: 'disk', label: 'Accretion disk', type: 'toggle', value: false },
    { key: 'beam', label: 'Doppler beaming', type: 'toggle', value: true },
    { key: 'tilt', label: 'Camera elevation', type: 'range', min: -10, max: 70, step: 1, value: 8, unit: '°' },
    { key: 'dist', label: 'Camera distance', type: 'range', min: 6, max: 40, step: 0.5, value: 24, unit: 'rₛ' },
    { key: 'spin', label: 'Auto-orbit camera', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'A hole in the sky',
      text: 'A star many times the Sun’s mass collapsed into a black hole. Its <b>event horizon</b> is a sphere from which nothing — not even light — can return. We see it as a perfectly black shadow against the stars.',
      formula: 'r<sub>s</sub> = 2GM / c<sup>2</sup>',
      params: { lens: 1, disk: false, tilt: 8, dist: 24, spin: true },
      duration: 12,
    },
    {
      title: 'Bending starlight',
      text: 'Watch as gravity is switched off and on again. With it, starlight passing close by is bent, stretching background stars into arcs. A star directly behind becomes an <b>Einstein ring</b>.',
      params: { lens: 0, disk: false },
      tween: 0.1,
      enter: (s, r) => setTimeout(() => r.set('lens', 1, 5), 1500),
      duration: 13,
    },
    {
      title: 'The accretion disk',
      text: 'Gas spiralling inward is heated to millions of degrees and glows fiercely. Inner regions orbit fastest and shine hottest. Nothing is stable closer than 3 rₛ — there the gas plunges in.',
      params: { lens: 1, disk: true, beam: false, tilt: 22, dist: 22 },
      duration: 13,
    },
    {
      title: 'Seeing the far side',
      text: 'Look low across the disk. The part <em>behind</em> the black hole should be hidden — but its light is bent up and over the top, and under the bottom too. The disk appears to wrap around the hole.',
      params: { disk: true, beam: false, tilt: 4, dist: 18 },
      duration: 14,
    },
    {
      title: 'Doppler beaming',
      text: 'The disk spins at a sizeable fraction of light speed. Gas rushing toward us is boosted brighter and bluer; gas moving away is dimmer and redder. Real images, like the Event Horizon Telescope’s M87*, are lopsided for this reason.',
      params: { disk: true, beam: true, tilt: 12, dist: 20 },
      duration: 14,
    },
    {
      title: 'Fly around',
      text: 'Drag to orbit, scroll to zoom in toward the photon sphere. Try switching the disk and the light bending on and off.',
      params: { disk: true, beam: true, tilt: 18, dist: 16, spin: false },
      duration: 20,
    },
  ],
  create(api) {
    const { gl, params } = api;
    const shader = fullscreenShader(gl, FRAG);
    let yaw = 0.6, drag = null, t = 0;
    return {
      pointerDown(p) {
        drag = { x: p.x, y: p.y, yaw, tilt: params.tilt };
      },
      pointerMove(p) {
        if (!drag) return;
        yaw = drag.yaw - (p.x - drag.x) * 0.006;
        api.runner.set('tilt', Math.max(-10, Math.min(70, drag.tilt + (p.y - drag.y) * 0.25)));
      },
      pointerUp() {
        drag = null;
      },
      wheel(p, dy) {
        api.runner.set('dist', Math.max(6, Math.min(40, params.dist * (1 + dy * 0.001))));
      },
      update(dt) {
        t += dt;
        if (params.spin && !drag) yaw += dt * 0.08;
      },
      draw() {
        shader.draw({
          uRes: [gl.drawingBufferWidth, gl.drawingBufferHeight],
          uTime: t,
          uYaw: yaw,
          uPitch: (params.tilt * Math.PI) / 180,
          uDist: params.dist,
          uLens: params.lens,
          uDisk: params.disk ? 1 : 0,
          uBeam: params.beam ? 1 : 0,
          uRing: params.lens,
        });
      },
      stats() {
        return [
          { label: 'Camera distance', value: params.dist.toFixed(1) + ' rₛ' },
          { label: 'Light bending', value: (params.lens * 100).toFixed(0) + ' %' },
          { label: 'Photon sphere', value: '1.5 rₛ' },
          { label: 'Innermost stable orbit', value: '3 rₛ' },
        ];
      },
    };
  },
};
