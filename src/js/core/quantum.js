// Small quantum toolkit shared by the quantum simulations: complex state vectors for a few qubits,
// standard gates, measurement, reduced Bloch vectors, and a Bloch-sphere drawing.

import { C, TAU, rgba, drawGlow, text } from './util.js';

const S2 = Math.SQRT1_2;

// ---------------------------------------------------------------- state vectors
// A state of n qubits is { n, re: Float64Array(2^n), im: Float64Array(2^n) }.
// Basis index bit k (value 1 << k) is qubit k.

export function zeroState(n) {
  const re = new Float64Array(1 << n), im = new Float64Array(1 << n);
  re[0] = 1;
  return { n, re, im };
}

export const copyState = (s) => ({ n: s.n, re: s.re.slice(), im: s.im.slice() });

/** 2×2 gates as [[a, b], [c, d]] with complex entries [re, im]. */
export const GATES = {
  I: [[[1, 0], [0, 0]], [[0, 0], [1, 0]]],
  X: [[[0, 0], [1, 0]], [[1, 0], [0, 0]]],
  Y: [[[0, 0], [0, -1]], [[0, 1], [0, 0]]],
  Z: [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]],
  H: [[[S2, 0], [S2, 0]], [[S2, 0], [-S2, 0]]],
  S: [[[1, 0], [0, 0]], [[0, 0], [0, 1]]],
  T: [[[1, 0], [0, 0]], [[0, 0], [S2, S2]]],
};

/** Apply a 2×2 gate to qubit k, optionally only where qubit `ctrl` is 1. */
export function apply1(s, g, k, ctrl = -1) {
  const { re, im } = s;
  const bit = 1 << k, cb = ctrl >= 0 ? 1 << ctrl : 0;
  const [[a, b], [c, d]] = g;
  for (let i = 0; i < re.length; i++) {
    if (i & bit || (cb && !(i & cb))) continue;
    const j = i | bit;
    const r0 = re[i], i0 = im[i], r1 = re[j], i1 = im[j];
    re[i] = a[0] * r0 - a[1] * i0 + b[0] * r1 - b[1] * i1;
    im[i] = a[0] * i0 + a[1] * r0 + b[0] * i1 + b[1] * r1;
    re[j] = c[0] * r0 - c[1] * i0 + d[0] * r1 - d[1] * i1;
    im[j] = c[0] * i0 + c[1] * r0 + d[0] * i1 + d[1] * r1;
  }
  return s;
}

/** Probability that qubit k reads 1. */
export function prob1(s, k) {
  let p = 0;
  for (let i = 0; i < s.re.length; i++) if (i & (1 << k)) p += s.re[i] ** 2 + s.im[i] ** 2;
  return p;
}

/** Measure qubit k (random number r in [0,1)), collapse the state, return 0 or 1. */
export function measure(s, k, r = Math.random()) {
  const bit = 1 << k;
  const out = r < prob1(s, k) ? 1 : 0;
  let norm = 0;
  for (let i = 0; i < s.re.length; i++) {
    if (!!(i & bit) !== !!out) s.re[i] = s.im[i] = 0;
    else norm += s.re[i] ** 2 + s.im[i] ** 2;
  }
  const f = 1 / Math.sqrt(norm || 1);
  for (let i = 0; i < s.re.length; i++) (s.re[i] *= f), (s.im[i] *= f);
  return out;
}

/** Bloch vector (⟨X⟩, ⟨Y⟩, ⟨Z⟩) of qubit k after tracing out the others; length < 1 when entangled. */
export function blochOf(s, k) {
  const bit = 1 << k;
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < s.re.length; i++) {
    if (i & bit) continue;
    const j = i | bit;
    const ar = s.re[i], ai = s.im[i], br = s.re[j], bi = s.im[j];
    // ρ01 = Σ a·conj(b)
    x += 2 * (ar * br + ai * bi);
    y += 2 * (ar * bi - ai * br);
    z += ar * ar + ai * ai - br * br - bi * bi;
  }
  return [x, y, z];
}

/** Single-qubit state amplitudes from Bloch angles: cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩. */
export function fromAngles(theta, phi) {
  return [[Math.cos(theta / 2), 0], [Math.sin(theta / 2) * Math.cos(phi), Math.sin(theta / 2) * Math.sin(phi)]];
}

export const blochFromAngles = (theta, phi) => [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];

/** Rotate vector v about unit axis n by angle a (Rodrigues). */
export function rotate(v, n, a) {
  const c = Math.cos(a), s = Math.sin(a);
  const d = n[0] * v[0] + n[1] * v[1] + n[2] * v[2];
  const cx = n[1] * v[2] - n[2] * v[1], cy = n[2] * v[0] - n[0] * v[2], cz = n[0] * v[1] - n[1] * v[0];
  return [v[0] * c + cx * s + n[0] * d * (1 - c), v[1] * c + cy * s + n[1] * d * (1 - c), v[2] * c + cz * s + n[2] * d * (1 - c)];
}

/** Each single-qubit gate is a rotation of the Bloch sphere: axis and angle. */
export const GATE_ROT = {
  X: { axis: [1, 0, 0], angle: Math.PI },
  Y: { axis: [0, 1, 0], angle: Math.PI },
  Z: { axis: [0, 0, 1], angle: Math.PI },
  H: { axis: [S2, 0, S2], angle: Math.PI },
  S: { axis: [0, 0, 1], angle: Math.PI / 2 },
  T: { axis: [0, 0, 1], angle: Math.PI / 4 },
};

// ---------------------------------------------------------------- drawing

/** Projects Bloch coordinates (z up) to the screen for a sphere at (cx, cy) of radius R. */
export function blochView(cx, cy, R, yaw = -0.55, pitch = 0.32) {
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return (p) => {
    const x1 = p[0] * cyw - p[1] * syw, y1 = p[0] * syw + p[1] * cyw;
    const up = p[2] * cp - x1 * sp;
    const depth = x1 * cp + p[2] * sp;
    return [cx + R * y1, cy - R * up, depth];
  };
}

function ring(ctx, P, f, color, alpha) {
  // a great circle, drawn solid in front and faint behind
  for (const front of [false, true]) {
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i <= 72; i++) {
      const [x, y, d] = P(f((i / 72) * TAU));
      if (d >= 0 === front) {
        if (pen) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        pen = true;
      } else pen = false;
    }
    ctx.strokeStyle = rgba(color, front ? alpha : alpha * 0.4);
    ctx.setLineDash(front ? [] : [3, 4]);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

/**
 * Draws a Bloch sphere with a state arrow. `vec` may be shorter than 1 (a mixed state, e.g. one
 * half of an entangled pair). Options: color, labels ('full' | 'poles' | false), trail (array of
 * points), axis (rotation axis to show), yaw, pitch, thin (smaller fonts).
 */
export function drawBloch(ctx, cx, cy, R, vec, o = {}) {
  const P = blochView(cx, cy, R, o.yaw, o.pitch);
  const col = o.color || C.violet;
  ctx.save();
  // body
  const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
  g.addColorStop(0, 'rgba(120,140,220,0.16)');
  g.addColorStop(1, 'rgba(40,50,100,0.06)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(160,175,230,0.35)';
  ctx.stroke();
  ring(ctx, P, (t) => [Math.cos(t), Math.sin(t), 0], '#a0b4ff', 0.45);
  ring(ctx, P, (t) => [Math.cos(t), 0, Math.sin(t)], '#a0b4ff', 0.18);
  // axes
  const axes = [[[0, 0, 1], '|0⟩'], [[0, 0, -1], '|1⟩'], [[1, 0, 0], '|+⟩'], [[-1, 0, 0], '|−⟩'], [[0, 1, 0], '|+i⟩'], [[0, -1, 0], '|−i⟩']];
  ctx.strokeStyle = 'rgba(160,175,230,0.22)';
  ctx.beginPath();
  for (let a = 0; a < 3; a++) {
    const p = [0, 0, 0], q = [0, 0, 0];
    p[a] = -1;
    q[a] = 1;
    const A = P(p), B = P(q);
    ctx.moveTo(A[0], A[1]);
    ctx.lineTo(B[0], B[1]);
  }
  ctx.stroke();
  if (o.labels !== false) {
    const size = o.thin ? 10 : 12;
    for (const [p, label] of axes) {
      if (o.labels === 'poles' && p[2] === 0) continue;
      const [x, y, d] = P(p.map((v) => v * 1.18));
      text(ctx, label, x, y, { size, align: 'center', color: d < -0.2 ? 'rgba(233,237,247,0.35)' : C.dim, mono: true });
    }
  }
  // rotation axis
  if (o.axis) {
    const A = P(o.axis.map((v) => -v * 1.1)), B = P(o.axis.map((v) => v * 1.1));
    ctx.strokeStyle = rgba(C.amber, 0.8);
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(A[0], A[1]);
    ctx.lineTo(B[0], B[1]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // trail
  if (o.trail?.length > 1) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = rgba(col, 0.55);
    ctx.beginPath();
    o.trail.forEach((p, i) => {
      const [x, y] = P(p);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
  }
  // the state arrow
  const len = Math.hypot(...vec);
  const [ox, oy] = P([0, 0, 0]);
  const [tx, ty, td] = P(vec);
  ctx.strokeStyle = col;
  ctx.lineWidth = o.thin ? 2.2 : 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, tx, ty, (o.thin ? 12 : 18) * (0.5 + 0.5 * len), col, 0.35);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = td < 0 ? rgba(col, 0.6) : col;
  ctx.beginPath();
  ctx.arc(tx, ty, (o.thin ? 3.5 : 5) * (0.6 + 0.4 * len), 0, TAU);
  ctx.fill();
  if (len < 0.98) {
    // a mixed state: show how far the arrow reaches compared with a pure state
    ctx.strokeStyle = rgba(col, 0.35);
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, R * len), 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
  return P;
}
