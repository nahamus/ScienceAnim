import { C, TAU, clamp, CMAPS, tag, text, arrow, rgba, drawGlow, Series } from '../../core/util.js';

// Two views of one idea.
//   takeoff  an airliner rolls down a runway; lift = ½ρv²S·C_L grows with the square of speed until it beats
//            the weight and the plane flies. A magnifier on the wing shows the airflow around its cross-section.
//   wing     that cross-section up close: a Joukowski airfoil in potential flow (exact solution with the Kutta
//            condition), with streaks, timing lines, pressure and stall.
// Both use the same lift coefficient, so changing the wing's angle, camber or thickness changes the takeoff too.

const CC = 1; // Joukowski constant
const DEG = Math.PI / 180;

const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => {
  const d = b[0] * b[0] + b[1] * b[1] || 1e-12;
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
function csqrt([x, y]) {
  const r = Math.hypot(x, y);
  const re = Math.sqrt((r + x) / 2), im = Math.sign(y || 1) * Math.sqrt(Math.max(0, (r - x) / 2));
  return [re, im];
}

/** Airfoil geometry and circulation for an angle (degrees), camber, thickness and free-stream speed U. */
function wingGeo(alpha, camber, thick, U) {
  const eps = thick * 0.9, del = camber;
  const mu = [-eps, del];
  const R = Math.hypot(CC + eps, del);
  const beta = Math.atan2(del, CC + eps);
  const a = alpha * DEG;
  const stall = Math.max(0, alpha - 14);
  const gFac = stall > 0 ? Math.max(0.4, 1 - stall / 9) : 1;
  const G = 4 * Math.PI * U * R * Math.sin(a + beta) * gFac;
  return { mu, R, a, G, stall, U };
}
/** Lift coefficient (chord 4) — the same number the flow solution gives. */
const liftCoef = (alpha, camber, thick) => {
  const g = wingGeo(alpha, camber, thick, 1);
  return (2 * g.G) / (4 * CC);
};

function toZeta(z, g) {
  const disc = csqrt([z[0] * z[0] - z[1] * z[1] - 4 * CC * CC, 2 * z[0] * z[1]]);
  const z1 = [(z[0] + disc[0]) / 2, (z[1] + disc[1]) / 2];
  const z2 = [(z[0] - disc[0]) / 2, (z[1] - disc[1]) / 2];
  const d1 = Math.hypot(z1[0] - g.mu[0], z1[1] - g.mu[1]), d2 = Math.hypot(z2[0] - g.mu[0], z2[1] - g.mu[1]);
  return d1 >= d2 ? [z1, d1] : [z2, d2];
}
/** Velocity (u, v) at wing-frame point z. */
function vel(z, g) {
  const [zeta, d] = toZeta(z, g);
  if (d < g.R * 1.001) return null;
  const U = g.U;
  const s = [zeta[0] - g.mu[0], zeta[1] - g.mu[1]];
  const eIa = [Math.cos(g.a), Math.sin(g.a)], eMa = [Math.cos(g.a), -Math.sin(g.a)];
  const s2 = cmul(s, s);
  const t1 = [U * eMa[0], U * eMa[1]];
  const t2 = cdiv([U * g.R * g.R * eIa[0], U * g.R * g.R * eIa[1]], s2);
  const t3 = cdiv([0, g.G / TAU], s);
  const dW = [t1[0] - t2[0] + t3[0], t1[1] - t2[1] + t3[1]];
  const z2 = cmul(zeta, zeta);
  const J = cdiv([CC * CC, 0], z2);
  const w = cdiv(dW, [1 - J[0], -J[1]]);
  return [w[0], -w[1]];
}

// ---------------------------------------------------------------- takeoff physics (SI units)
const RHO = 1.225; // air density, kg/m³
const AREA = 560; // wing area, m² (a big four-engined airliner)
const GRAV = 9.81;
const T_MAX = 1.12e6; // four engines at full take-off thrust, N
const RUNWAY = 3200; // m
const TS = 3; // the takeoff runs three times faster than real time
const GROUND_ATT = 2; // the wing's angle to the air while all wheels are on the runway, degrees
const TAIL_LIMIT = 11.5; // pitch beyond which the tail scrapes the runway, degrees
const KMH = 3.6;
const V_UNIT = 250 / KMH; // the wing view's airspeed unit (1 = 250 km/h), m/s

export default {
  id: 'lift',
  title: 'How Wings Fly',
  category: 'physics',
  tagline: 'Air races over the top of a wing, pressure drops, and 400 tonnes of aircraft rise.',
  ages: ['11-14', '14-16'],
  topics: ['Forces', 'Fluids', 'Pressure'],
  blurb:
    'A 380-tonne airliner can only leave the runway when its wings push up harder than gravity pulls down. A wing is shaped and tilted so it turns the air flowing past it downward; the air above speeds up and its pressure falls, while the air below slows and pushes up. Watch a takeoff, then zoom into the wing, where this simulation solves the classic equations for air flowing around it.',
  ideas: [
    'A plane leaves the ground when the <b>lift</b> from its wings is bigger than its <b>weight</b>.',
    'Lift grows with the <b>square of speed</b>: twice as fast gives four times the lift, which is why planes need long runways.',
    'Air over the top of the wing moves <b>faster</b> than the air beneath, so its pressure is <b>lower</b> (Bernoulli): the wing is sucked up from above and pushed from below.',
    'Tilting the wing up (<b>angle of attack</b>) or curving it (<b>camber</b>, which flaps add) increases lift — until, past about 15°, the wing <b>stalls</b>.',
  ],
  hint: 'Drag up or down to change the angle of attack',
  renderScale: 1,
  thumbChapter: 2,
  thumbFrames: 300,
  params: [
    { key: 'scene', label: 'View', type: 'select', value: 'takeoff', options: [{ value: 'takeoff', label: 'Takeoff' }, { value: 'wing', label: 'Wing close-up' }] },
    { key: 'alpha', label: 'Angle of attack', type: 'range', min: -8, max: 24, step: 0.5, value: 8, unit: '°', digits: 1 },
    { key: 'camber', label: 'Camber (curve) — flaps add it', type: 'range', min: 0, max: 0.2, step: 0.005, value: 0.08, instant: true },
    { key: 'thick', label: 'Thickness', type: 'range', min: 0.04, max: 0.2, step: 0.005, value: 0.1, instant: true },
    { key: 'load', label: 'Take-off weight', type: 'range', min: 250, max: 520, step: 5, value: 380, unit: 't', digits: 0 },
    { key: 'thrust', label: 'Engine thrust', type: 'range', min: 30, max: 100, step: 1, value: 85, unit: '%', digits: 0 },
    { key: 'U', label: 'Airspeed (close-up)', type: 'range', min: 0.4, max: 2, step: 0.05, value: 1, format: (v) => (v * 250).toFixed(0) + ' km/h' },
    { key: 'mode', label: 'Tracers (close-up)', type: 'select', value: 'streaks', options: [{ value: 'streaks', label: 'Streaks' }, { value: 'timing', label: 'Timing lines' }] },
    { key: 'pressure', label: 'Show pressure (close-up)', type: 'toggle', value: false },
    { key: 'go', label: 'Start the takeoff again', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'Ready for takeoff',
      text: 'This airliner weighs <b>380 tonnes</b>. To fly, its <b>wings</b> (highlighted) must push up harder than gravity pulls down. Standing still they make no lift at all. Watch the green <b>lift</b> arrow and the gauge as the engines push it down the runway.',
      params: { scene: 'takeoff', alpha: 8, camber: 0.08, thick: 0.1, load: 380, thrust: 85 },
      enter: (s) => s.restart(),
      duration: 14,
    },
    {
      title: 'Speed is everything',
      text: 'From 150 to 300 km/h the lift doesn’t double — it grows <b>four times</b>. Lift depends on the <b>square</b> of airspeed, so each extra km/h counts for more than the last. The magnifier shows the air racing over the wing faster and faster.',
      formula: 'L = ½ ρ v² S C_L',
      params: { scene: 'takeoff' },
      check: {
        q: 'On the runway the plane speeds up from 150 to 300 km/h. How much more lift do its wings make?',
        options: ['Twice as much', 'Four times as much', 'The same: lift only depends on the wing’s shape'],
        answer: 1,
        explain: 'Lift grows with the square of speed: double the speed and the wing turns twice as much air, twice as hard, so 2 × 2 = 4 times the lift.',
      },
      enter: (s) => s.restart(150 / KMH),
      duration: 14,
    },
    {
      title: 'Rotate and lift off',
      text: 'Near take-off speed the pilot pulls back and the nose <b>rotates</b> up, tilting the wings to about 8° against the oncoming air. That raises their lift further — the moment lift beats weight, the wheels leave the runway and the plane climbs away.',
      params: { scene: 'takeoff', alpha: 8 },
      enter: (s) => s.restart(275 / KMH, 1150),
      duration: 13,
    },
    {
      title: 'A slice through the wing',
      text: 'Now zoom into a slice of the wing, in a steady wind from the left. The air splits at the front edge, flows around both sides and leaves smoothly from the sharp back edge. Brighter, longer streaks mean faster air.',
      params: { scene: 'wing', alpha: 5, camber: 0.08, thick: 0.1, U: 1, mode: 'streaks', pressure: false },
      duration: 12,
    },
    {
      title: 'The race over the top',
      text: 'Release lines of smoke all at once. The air over the top doesn’t just keep pace with the air below — it arrives at the back edge <b>well ahead</b>. (The popular “equal transit time” story is wrong: the top air wins easily.)',
      params: { scene: 'wing', mode: 'timing', pressure: false, alpha: 6 },
      duration: 14,
    },
    {
      title: 'Low pressure above',
      text: 'Fast-moving air has lower pressure — Bernoulli’s principle. Blue shows suction above the wing, red shows higher pressure below. The difference adds up to a strong upward force: <b>lift</b>.',
      formula: 'p + ½ρv² = constant',
      params: { scene: 'wing', mode: 'streaks', pressure: true, alpha: 6 },
      duration: 14,
    },
    {
      title: 'Tilt it up',
      text: 'Increase the angle of attack and the wing deflects more air downward. The suction grows and the lift arrow lengthens. That is what rotating on the runway does — and why pilots raise the nose to fly slowly when landing.',
      params: { scene: 'wing', alpha: 12, pressure: true, mode: 'streaks' },
      tween: 4,
      duration: 13,
    },
    {
      title: 'Stall',
      text: 'Go past about 15° and the air can no longer follow the curved top surface. It breaks away into turbulent swirls, the suction collapses and lift drops suddenly. This is a <b>stall</b> — and why stall warnings blare in cockpits.',
      params: { scene: 'wing', alpha: 21, pressure: true },
      tween: 4,
      duration: 13,
    },
    {
      title: 'Your takeoff',
      text: 'Load the plane, set the thrust and the flaps (camber) and choose how far to rotate. How much runway do you need? Too heavy, too little thrust or a stalled wing and you run out of runway; rotate too far and the tail scrapes.',
      params: { scene: 'takeoff', alpha: 8, camber: 0.1, load: 380, thrust: 85 },
      enter: (s) => s.restart(),
      duration: 22,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const narrow = () => api.w < 600;

    // ------------------------------------------------------------ airflow tracers (close-up and magnifier)
    function createFlow() {
      let parts = [], spawnAcc = 0, group = 0, groupT = 0;
      const toScreen = (z, g, v) => {
        // wing frame → screen: rotate by −α so the free stream is horizontal and the wing pitches up
        const c = Math.cos(g.a), s = Math.sin(g.a);
        const x = z[0] * c + z[1] * s, y = -z[0] * s + z[1] * c;
        return [v.cx + x * v.S, v.cy - y * v.S];
      };
      const toWing = (px, py, g, v) => {
        const x = (px - v.cx) / v.S, y = -(py - v.cy) / v.S;
        const c = Math.cos(g.a), s = Math.sin(g.a);
        return [x * c - y * s, x * s + y * c];
      };
      return {
        toScreen,
        toWing,
        clear() {
          parts = [];
        },
        /** rect: the area tracers fill; rate: streaks per second at U = 1. */
        update(dt, g, v, rect, mode, rate, maxParts) {
          if (mode === 'streaks') {
            spawnAcc += dt * rate * g.U;
            while (spawnAcc >= 1) {
              spawnAcc -= 1;
              parts.push({ z: toWing(rect.x - 10, rect.y + Math.random() * rect.h, g, v), trail: [] });
            }
          } else {
            groupT -= dt;
            if (groupT <= 0) {
              groupT = 1.3 / Math.max(0.2, g.U);
              group++;
              for (let i = 0; i < 90; i++) {
                const y = v.cy - v.S * 1.6 + (v.S * 3.2 * i) / 89;
                parts.push({ z: toWing(v.cx - v.S * 3.2, y, g, v), trail: [], grp: group, sy: y });
              }
            }
          }
          const sdt = dt * 1.1;
          for (const p of parts) {
            const u1 = vel(p.z, g);
            if (!u1) {
              p.dead = true;
              continue;
            }
            const mid = [p.z[0] + u1[0] * sdt * 0.5, p.z[1] + u1[1] * sdt * 0.5];
            const u2 = vel(mid, g) || u1;
            p.z[0] += u2[0] * sdt;
            p.z[1] += u2[1] * sdt;
            p.speed = g.U > 0.01 ? Math.hypot(u2[0], u2[1]) / g.U : 1;
            // stalled wing: turbulent wake behind the upper surface
            if (g.stall > 0) {
              const sp = toScreen(p.z, g, v);
              const rel = [(sp[0] - v.cx) / v.S, (v.cy - sp[1]) / v.S];
              if (rel[0] > -0.8 && rel[1] > -0.2 && rel[1] < 1.4 + rel[0] * 0.3) {
                p.z[0] += (Math.random() - 0.6) * g.stall * 0.012;
                p.z[1] += (Math.random() - 0.5) * g.stall * 0.02;
              }
            }
            const s = toScreen(p.z, g, v);
            p.trail.push(s);
            if (p.trail.length > 6) p.trail.shift();
            if (s[0] > rect.x + rect.w + 20 || s[1] < rect.y - 40 || s[1] > rect.y + rect.h + 40) p.dead = true;
          }
          parts = parts.filter((p) => !p.dead);
          if (parts.length > maxParts) parts.splice(0, parts.length - maxParts);
        },
        draw(g, v, mode, width = 1.3) {
          ctx.lineCap = 'round';
          if (mode === 'streaks') {
            // bucket streaks by speed: slow = warm, fast = cool and bright
            const B = 7, buckets = Array.from({ length: B }, () => []);
            for (const p of parts) {
              if (p.trail.length < 2) continue;
              const s = clamp(p.speed || 1, 0, 2.2);
              buckets[Math.min(B - 1, Math.floor((s / 2.2) * B))].push(p);
            }
            ctx.lineWidth = width;
            buckets.forEach((arr, k) => {
              const s = ((k + 0.5) / B) * 2.2;
              ctx.strokeStyle = s > 1 ? `rgba(${150 - 60 * (s - 1)},220,255,${0.35 + 0.4 * (s - 1)})` : `rgba(255,${170 + 60 * s},${120 + 60 * s},${0.3 + 0.2 * s})`;
              ctx.beginPath();
              for (const p of arr) {
                ctx.moveTo(p.trail[0][0], p.trail[0][1]);
                ctx.lineTo(p.trail[p.trail.length - 1][0], p.trail[p.trail.length - 1][1]);
              }
              ctx.stroke();
            });
          } else {
            const groups = new Map();
            for (const p of parts) {
              if (!groups.has(p.grp)) groups.set(p.grp, []);
              groups.get(p.grp).push(p);
            }
            for (const [gi, arr] of groups) {
              arr.sort((a, b) => a.sy - b.sy);
              ctx.strokeStyle = gi % 2 ? 'rgba(56,214,245,0.85)' : 'rgba(255,95,162,0.85)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              let prev = null;
              for (const p of arr) {
                const s = p.trail[p.trail.length - 1];
                if (!s) continue;
                if (prev && Math.hypot(s[0] - prev[0], s[1] - prev[1]) < v.S * 0.4) ctx.lineTo(s[0], s[1]);
                else ctx.moveTo(s[0], s[1]);
                prev = s;
              }
              ctx.stroke();
            }
          }
        },
        airfoil(g, v, fill) {
          ctx.beginPath();
          for (let i = 0; i <= 160; i++) {
            const th = (i / 160) * TAU;
            const zeta = [g.mu[0] + g.R * Math.cos(th), g.mu[1] + g.R * Math.sin(th)];
            const J = cdiv([CC * CC, 0], zeta);
            const s = toScreen([zeta[0] + J[0], zeta[1] + J[1]], g, v);
            ctx[i ? 'lineTo' : 'moveTo'](s[0], s[1]);
          }
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
        },
      };
    }
    const flow = createFlow(); // close-up view
    const lens = createFlow(); // magnifier in the takeoff view

    // ------------------------------------------------------------ the close-up's view and pressure field
    let field = null, fieldKey = '', fieldFrame = 0, drag = null;
    const wingView = () => {
      const { w, h } = api;
      return { S: Math.min(w * 0.17, h * 0.2), cx: w * 0.5, cy: h * 0.42 };
    };
    const closeGeo = () => wingGeo(params.alpha, params.camber, params.thick, params.U);

    // ------------------------------------------------------------ the takeoff
    const plane = { x: 0, V: 0, alt: 0, vy: 0, pitch: GROUND_ATT, phase: 'roll', hold: 0, gear: 1, liftoffX: null, strike: false };
    const sRatio = new Series(300);
    let sampleT = 0, last = { L: 0, W: 1, T: 0, D: 0, aoa: GROUND_ATT };

    const forces = () => {
      const W = params.load * 1000 * GRAV;
      const gamma = plane.alt > 0 ? Math.atan2(plane.vy, Math.max(plane.V, 1)) : 0;
      const aoa = plane.pitch - gamma / DEG;
      const CL = liftCoef(aoa, params.camber, params.thick);
      const q = 0.5 * RHO * plane.V * plane.V * AREA;
      const L = q * CL;
      const D = q * (0.024 + (CL * CL) / (Math.PI * 7.5 * 0.8));
      const T = (params.thrust / 100) * T_MAX;
      return { W, L, D, T, gamma, aoa, CL };
    };
    /** Speed at which the wing, held at the pilot's chosen angle to the air, lifts the plane. */
    const liftoffSpeed = () => {
      const CL = liftCoef(params.alpha, params.camber, params.thick);
      return CL > 0 ? Math.sqrt((2 * params.load * 1000 * GRAV) / (RHO * AREA * CL)) : Infinity;
    };

    function restart(V0 = 0, x0 = 0) {
      Object.assign(plane, { x: x0, V: V0, alt: 0, vy: 0, pitch: GROUND_ATT, phase: 'roll', hold: 0, gear: 1, liftoffX: null, strike: false });
      sRatio.clear();
      lens.clear();
    }

    function stepTakeoff(dt) {
      // a finished run (climbed away, or stopped at the runway end) keeps going briefly, then starts again
      if (plane.hold > 0) {
        plane.hold -= dt;
        if (plane.hold <= 0) return restart();
      }
      const wdt = dt * TS;
      const f = forces();
      last = f;
      const m = params.load * 1000;
      const onGround = plane.alt <= 0;
      if (plane.phase === 'overrun') {
        // brakes and reversers: stop, then try again
        plane.V = Math.max(0, plane.V - 4 * wdt);
        plane.x += plane.V * wdt;
        plane.pitch += (GROUND_ATT - plane.pitch) * Math.min(1, wdt * 2);
        if (plane.V === 0 && !(plane.hold > 0)) plane.hold = 3;
        return;
      }
      if (onGround) {
        // rotate once fast enough that the tilted wing will lift the plane
        if (plane.phase === 'roll' && plane.V >= 0.93 * liftoffSpeed()) plane.phase = 'rotate';
        const target = plane.phase === 'rotate' ? Math.min(params.alpha, TAIL_LIMIT) : GROUND_ATT;
        plane.strike = plane.phase === 'rotate' && params.alpha > TAIL_LIMIT;
        plane.pitch += clamp(target - plane.pitch, -3 * wdt, 3 * wdt);
        const N = Math.max(0, f.W - f.L);
        plane.V = Math.max(0, plane.V + ((f.T - f.D - 0.02 * N) / m) * wdt);
        plane.x += plane.V * wdt;
        // it leaves the ground once the wing, at the angle it will fly at, out-lifts the weight (a stalled
        // wing needs far more speed); on the ground the tail limits how far the nose can come up
        const liftAir = 0.5 * RHO * plane.V * plane.V * AREA * liftCoef(params.alpha, params.camber, params.thick);
        if (plane.phase === 'rotate' && Math.abs(plane.pitch - target) < 0.5 && liftAir > f.W) {
          plane.phase = 'air';
          plane.alt = 0.01;
          plane.liftoffX = plane.x;
        } else if (plane.x > RUNWAY) {
          plane.phase = 'overrun';
        }
      } else {
        // airborne: the pilot holds a steady climb attitude (nose at most 15° up); as the climb steepens the
        // wing meets the air at a smaller angle, so lift settles back towards the weight
        plane.strike = false;
        plane.pitch += clamp(Math.min(params.alpha + 7, 15) - plane.pitch, -2 * wdt, 2 * wdt);
        const ax = (f.T - f.D - f.W * Math.sin(f.gamma)) / m;
        const ay = (f.L * Math.cos(f.gamma) - f.W) / m;
        plane.V = Math.max(1, plane.V + ax * wdt);
        plane.vy += ay * wdt;
        plane.vy *= 1 - Math.min(0.5, 0.25 * wdt);
        plane.alt += plane.vy * wdt;
        plane.x += plane.V * Math.cos(f.gamma) * wdt;
        if (plane.alt > 12) plane.gear = Math.max(0, plane.gear - dt * 0.8);
        if (plane.alt <= 0) {
          plane.alt = 0;
          plane.vy = 0;
          plane.phase = 'rotate';
        }
        if (plane.alt > 420 && !(plane.hold > 0)) plane.hold = 3.5;
      }
      sampleT += dt;
      if (sampleT > 0.05) {
        sampleT = 0;
        sRatio.push(f.L / f.W);
      }
    }

    // ------------------------------------------------------------ takeoff layout
    function layout() {
      const { w, h } = api;
      const n = narrow();
      const ppm = (n ? w * 0.6 : Math.min(w * 0.42, h * 0.62)) / 70; // pixels per metre: the plane is ~70 m long
      const groundY = n ? h * 0.72 : h * 0.63;
      const px = n ? w * 0.66 : w * 0.6; // main wheels on screen
      // the camera rises with the plane once it would leave the top part of the view
      const minY = n ? h * 0.6 : h * 0.44;
      const planeY = groundY - plane.alt * ppm;
      const cam = Math.max(0, minY - planeY);
      const r = n ? Math.min(54, w * 0.14) : Math.min(112, w * 0.12, h * 0.15);
      const lensC = [n ? 16 + r : 24 + r, (n ? 84 : 120) + r];
      return { ppm, groundY: groundY + cam, px, py: planeY + cam, cam, r, lensC };
    }

    /** Plane-local point (metres; x forward, y up, origin at the main wheels) → screen. */
    const P = (L, lx, ly) => {
      const th = plane.pitch * DEG, c = Math.cos(th), s = Math.sin(th);
      return [L.px + (lx * c - ly * s) * L.ppm, L.py - (lx * s + ly * c) * L.ppm];
    };
    const poly = (L, pts) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const [sx, sy] = P(L, x, y);
        ctx[i ? 'lineTo' : 'moveTo'](sx, sy);
      });
      ctx.closePath();
    };

    // the near wing as seen from slightly above: root on the fuselage, tip swept back toward the viewer
    const WING = [[5, 5.2], [-5.5, 4.6], [-17.5, 1.9], [-13.5, 1.6]];
    const WING_ROOT = [-0.5, 4.9]; // where the magnifier looks

    function drawPlane(L, opts = {}) {
      const s = L.ppm;
      // far wing, peeking over the fuselage
      ctx.fillStyle = '#3a4466';
      poly(L, [[3, 8.6], [-4, 8.8], [-15, 13.2], [-12, 13.2]]);
      ctx.fill();
      // far tailplane
      poly(L, [[-34, 9.4], [-38, 9.6], [-43, 12], [-41, 12]]);
      ctx.fill();
      // fuselage
      const [tx, ty] = P(L, 0, 9.8), [bx, by] = P(L, 0, 3.2);
      const fg = ctx.createLinearGradient(tx, ty, bx, by);
      fg.addColorStop(0, '#f4f6fb');
      fg.addColorStop(0.55, '#d3d9e8');
      fg.addColorStop(1, '#8a93ad');
      ctx.fillStyle = fg;
      ctx.beginPath();
      const body = [];
      // top from tail to nose, then the rounded nose, then the belly back, sweeping up to the tail
      for (let x = -40; x <= 26; x += 2) body.push([x, 9.8]);
      for (let k = 0; k <= 10; k++) {
        const a = Math.PI / 2 - (k / 10) * Math.PI;
        body.push([26 + Math.cos(a) * 6.5, 6.5 + Math.sin(a) * 3.3]);
      }
      for (let x = 26; x >= -26; x -= 2) body.push([x, 3.2]);
      body.push([-32, 4.6], [-38, 6.8], [-41, 8.6], [-41, 9.8]);
      body.forEach(([x, y], i) => {
        const [sx, sy] = P(L, x, y);
        ctx[i ? 'lineTo' : 'moveTo'](sx, sy);
      });
      ctx.closePath();
      ctx.fill();
      // cheat line and windows
      ctx.strokeStyle = 'rgba(91,140,255,0.8)';
      ctx.lineWidth = Math.max(1, s * 0.5);
      ctx.beginPath();
      ctx.moveTo(...P(L, -36, 6.6));
      ctx.lineTo(...P(L, 29, 6.6));
      ctx.stroke();
      if (s > 2) {
        ctx.fillStyle = '#2b3350';
        for (let x = -30; x <= 20; x += 2.2) {
          const [wx, wy] = P(L, x, 7.8);
          ctx.fillRect(wx - s * 0.35, wy - s * 0.45, s * 0.7, s * 0.9);
        }
        poly(L, [[28.5, 8.3], [31.4, 7.8], [31.6, 7.1], [28.5, 7.3]]);
        ctx.fill();
      }
      // tail fin
      ctx.fillStyle = '#e8ecf6';
      poly(L, [[-30, 9.6], [-41, 22.5], [-45.5, 22.5], [-42, 9.6]]);
      ctx.fill();
      ctx.fillStyle = 'rgba(91,140,255,0.85)';
      poly(L, [[-36.5, 16.5], [-41, 22.5], [-45.5, 22.5], [-43.8, 16.5]]);
      ctx.fill();
      // near tailplane
      ctx.fillStyle = '#c3cadb';
      poly(L, [[-33, 7.4], [-39, 7.2], [-45, 4.4], [-42.5, 4.3]]);
      ctx.fill();
      // landing gear
      if (plane.gear > 0.02) {
        const gl = 3.2 * plane.gear;
        ctx.strokeStyle = '#6f7894';
        ctx.lineWidth = Math.max(1.5, s * 0.6);
        for (const gx of [-1.5, 23]) {
          ctx.beginPath();
          ctx.moveTo(...P(L, gx, 3.3));
          ctx.lineTo(...P(L, gx, 3.3 - gl + 0.9));
          ctx.stroke();
        }
        ctx.fillStyle = '#1a1e2c';
        for (const [gx, rr] of [[-3, 1.15], [0, 1.15], [23, 0.9]]) {
          const [cx, cy] = P(L, gx, 3.3 - gl + rr - 0.2);
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1.5, rr * s * plane.gear), 0, TAU);
          ctx.fill();
        }
      }
      // the near wing, highlighted
      const pulse = 0.5 + 0.5 * Math.sin(api.time * 3);
      const [wx0, wy0] = P(L, -6, 5), [wx1, wy1] = P(L, -15, 1.7);
      const wg = ctx.createLinearGradient(wx0, wy0, wx1, wy1);
      wg.addColorStop(0, '#9fc0ff');
      wg.addColorStop(1, '#4d7bff');
      if (!opts.small) {
        ctx.save();
        ctx.shadowColor = rgba('#5b8cff', 0.55 + 0.35 * pulse);
        ctx.shadowBlur = 10 + s * 2.2;
        ctx.fillStyle = wg;
        poly(L, WING);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = wg;
      poly(L, WING);
      ctx.fill();
      ctx.strokeStyle = 'rgba(230,240,255,0.9)';
      ctx.lineWidth = opts.small ? 1 : 1.6;
      ctx.stroke();
      // engines under the wing
      ctx.fillStyle = '#b7bfd3';
      for (const [ex, ey] of [[-2.5, 2.4], [-11, 0.9]]) {
        poly(L, [[ex + 4.2, ey + 1.3], [ex - 2.8, ey + 1.3], [ex - 3.6, ey], [ex - 2.8, ey - 1.1], [ex + 4.2, ey - 1.1]]);
        ctx.fill();
        if (!opts.small && plane.V > 1 && params.thrust > 0) {
          const [jx, jy] = P(L, ex - 3.6, ey);
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, jx, jy, s * 2.2, '#ffb547', 0.12 + 0.2 * (params.thrust / 100));
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    }

    function drawTakeoff() {
      const { w, h } = api;
      const L = layout();
      const n = narrow();
      // sky at dawn
      const sky = ctx.createLinearGradient(0, 0, 0, L.groundY);
      sky.addColorStop(0, '#070b1e');
      sky.addColorStop(0.65, '#1b2350');
      sky.addColorStop(1, '#7a4a5c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, w * 0.82, L.groundY - 10, Math.max(w, h) * 0.35, '#ff9a5a', 0.22);
      ctx.globalCompositeOperation = 'source-over';
      // distant hills (slow parallax)
      const hill = (shift, amp, base, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, L.groundY);
        for (let x = 0; x <= w + 20; x += 20) {
          const u = (x + shift) * 0.004;
          ctx.lineTo(x, L.groundY - base - amp * (0.5 + 0.3 * Math.sin(u) + 0.2 * Math.sin(u * 2.7 + 1)));
        }
        ctx.lineTo(w, L.groundY);
        ctx.closePath();
        ctx.fill();
      };
      hill(plane.x * L.ppm * 0.03, h * 0.08, h * 0.02, '#1a1d3a');
      hill(plane.x * L.ppm * 0.08 + 500, h * 0.05, 0, '#131529');
      // ground and runway
      ctx.fillStyle = '#0d1a14';
      ctx.fillRect(0, L.groundY, w, h - L.groundY);
      const rw = Math.max(10, L.ppm * 4.5);
      ctx.fillStyle = '#23262f';
      const X = (wx) => L.px + (wx - plane.x) * L.ppm; // runway metre → screen x
      const r0 = Math.max(0, X(-60)), r1 = Math.min(w, X(RUNWAY + 60));
      if (r1 > r0) ctx.fillRect(r0, L.groundY, r1 - r0, rw);
      // centre-line dashes and edge lights
      ctx.fillStyle = 'rgba(240,240,240,0.75)';
      const first = Math.floor((plane.x - L.px / L.ppm) / 50) * 50;
      for (let m = first; m < plane.x + (w - L.px) / L.ppm + 50; m += 50) {
        if (m < 0 || m > RUNWAY - 30) continue;
        ctx.fillRect(X(m), L.groundY + rw * 0.45, Math.max(4, 25 * L.ppm), Math.max(1, rw * 0.1));
      }
      for (let m = Math.floor((plane.x - L.px / L.ppm) / 30) * 30; m < plane.x + (w - L.px) / L.ppm + 30; m += 30) {
        if (m < -50 || m > RUNWAY + 50) continue;
        const red = m > RUNWAY - 300;
        ctx.fillStyle = red ? '#ff4d6d' : '#ffd27a';
        ctx.fillRect(X(m) - 1, L.groundY - 1, 2.5, 2.5);
        ctx.fillRect(X(m) - 1, L.groundY + rw - 1, 2.5, 2.5);
      }
      // distance boards every 500 m
      if (!api.thumbnail)
        for (let m = 500; m <= RUNWAY; m += 500) {
          const bx = X(m);
          if (bx < -60 || bx > w + 60) continue;
          tag(ctx, m === RUNWAY ? 'runway end' : `${m} m`, bx, L.groundY + rw + 16, m === RUNWAY ? C.red : C.dim, { align: 'center', size: 9 });
        }
      // where the wheels left the ground
      if (plane.liftoffX !== null && !api.thumbnail) {
        const lx = X(plane.liftoffX);
        if (lx > -40 && lx < w + 40) {
          ctx.strokeStyle = rgba(C.lime, 0.8);
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(lx, L.groundY - 30);
          ctx.lineTo(lx, L.groundY + rw);
          ctx.stroke();
          ctx.setLineDash([]);
          tag(ctx, `lift-off after ${Math.round(plane.liftoffX).toLocaleString()} m`, lx, L.groundY - 40, C.lime, { align: 'center', size: 10 });
        }
      }
      // relative wind: streaks flowing past, faster and longer with airspeed
      if (plane.V > 2) {
        const len = clamp(plane.V * 0.6, 4, 70) * (L.ppm / 5);
        ctx.strokeStyle = `rgba(190,215,255,${clamp(plane.V / 120, 0.08, 0.35)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const speedPx = plane.V * L.ppm * TS * 0.25; // slowed down so the eye can follow it
        for (let i = 0; i < 46; i++) {
          const y = ((i * 0.618034) % 1) * L.groundY * 0.95;
          const x = w + len - ((api.time * speedPx + i * 211.7) % (w + len * 2));
          ctx.moveTo(x, y);
          ctx.lineTo(x + len, y);
        }
        ctx.stroke();
      }
      // shadow
      if (plane.alt > 0.5) {
        const a = clamp(0.5 - plane.alt / 300, 0, 0.5);
        ctx.fillStyle = `rgba(0,0,0,${a})`;
        ctx.beginPath();
        ctx.ellipse(L.px - 5 * L.ppm, L.groundY + rw * 0.5, 34 * L.ppm, rw * 0.35, 0, 0, TAU);
        ctx.fill();
      }
      drawPlane(L);

      // forces
      const f = last;
      const base = Math.min(h * 0.16, 70 * (L.ppm / 5)); // arrow length for the weight
      const cg = P(L, 1, 6.5);
      const wc = P(L, -6, 4.4);
      const lift = clamp((f.L / f.W) * base, 0, base * 1.9);
      arrow(ctx, cg[0], cg[1] + 4, cg[0], cg[1] + 4 + base, C.red, 3, 11);
      if (lift > 3) arrow(ctx, wc[0], wc[1] - 6, wc[0], wc[1] - 6 - lift, f.L >= f.W ? C.lime : rgba(C.lime, 0.75), 4, 13);
      const eng = P(L, 4, 3.2);
      const thr = (f.T / T_MAX) * base * 0.8;
      if (thr > 3) arrow(ctx, eng[0], eng[1], eng[0] + thr, eng[1], C.cyan, 2.5, 9);
      const tailP = P(L, -42, 7);
      const dr = clamp((f.D / T_MAX) * base * 0.8, 0, base);
      if (dr > 3) arrow(ctx, tailP[0], tailP[1], tailP[0] - dr, tailP[1], C.amber, 2.5, 9);
      if (!api.thumbnail) {
        tag(ctx, 'weight', cg[0] + 8, cg[1] + 4 + base * 0.8, C.red, { size: 10 });
        if (lift > 26) tag(ctx, 'lift', wc[0] + 8, wc[1] - 6 - lift * 0.8, C.lime, { size: 10 });
        if (!n && thr > 3) tag(ctx, 'thrust', eng[0] + thr + 6, eng[1], C.cyan, { size: 10 });
        if (!n && dr > 3) tag(ctx, 'drag', tailP[0] - dr - 6, tailP[1], C.amber, { size: 10, align: 'right' });
        const tip = P(L, -16, 1.6);
        tag(ctx, 'wing', tip[0] - 4, tip[1] + 14, '#9fc0ff', { size: 10, align: 'right' });
      }

      // magnifier on the wing's cross-section
      const [lcx, lcy] = L.lensC;
      const root = P(L, ...WING_ROOT);
      ctx.strokeStyle = 'rgba(159,192,255,0.55)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      const ang = Math.atan2(root[1] - lcy, root[0] - lcx);
      ctx.moveTo(lcx + Math.cos(ang) * L.r, lcy + Math.sin(ang) * L.r);
      ctx.lineTo(root[0], root[1]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(root[0], root[1], 4, 0, TAU);
      ctx.strokeStyle = '#9fc0ff';
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.arc(lcx, lcy, L.r, 0, TAU);
      ctx.fillStyle = 'rgba(6,8,20,0.92)';
      ctx.fill();
      ctx.clip();
      // the flow is solved with the wind from the left; this plane flies to the right, so mirror the slice
      // to put its leading edge forward and the air streaming back from the right
      // …then turn it by the climb angle: the air meets the wing along the flight path, so the slice tilts
      // exactly as much as the plane does (its angle to the air plus the climb)
      const climb = plane.alt > 0 ? Math.atan2(plane.vy, Math.max(plane.V, 1)) : 0;
      ctx.translate(lcx, lcy);
      ctx.rotate(-climb);
      ctx.translate(-lcx, -lcy);
      ctx.translate(2 * lcx, 0);
      ctx.scale(-1, 1);
      const lg = lensGeo(L);
      lens.draw(lg.g, lg.v, 'streaks', 1.1);
      lens.airfoil(lg.g, lg.v, '#9fc0ff');
      ctx.restore();
      ctx.beginPath();
      ctx.arc(lcx, lcy, L.r, 0, TAU);
      ctx.strokeStyle = 'rgba(159,192,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (!api.thumbnail) {
        tag(ctx, 'the wing, sliced', lcx, lcy - L.r, '#9fc0ff', { size: 9, align: 'center' });
        tag(ctx, `${(plane.V * KMH).toFixed(0)} km/h · ${f.aoa.toFixed(1)}° to the air`, lcx, lcy + L.r, C.dim, { size: 9, align: 'center' });
      }

      // gauges
      if (!api.thumbnail) {
        const gx = w - 16;
        tag(ctx, `${(plane.V * KMH).toFixed(0)} km/h · time ×${TS}`, gx, 84, C.ink, { align: 'right', size: 11 });
        const ratio = f.L / f.W;
        const bw = n ? 120 : 170, by = 108;
        text(ctx, 'lift ÷ weight', gx - bw, by, { size: 10, color: C.dim });
        text(ctx, `${Math.round(ratio * 100)}%`, gx, by, { size: 11, align: 'right', mono: true, weight: 600, color: ratio >= 1 ? C.lime : C.ink });
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(gx - bw, by + 9, bw, 7);
        ctx.fillStyle = ratio >= 1 ? C.lime : '#5b8cff';
        ctx.fillRect(gx - bw, by + 9, bw * clamp(ratio / 1.5, 0, 1), 7);
        ctx.fillStyle = C.ink;
        ctx.fillRect(gx - bw + bw / 1.5 - 1, by + 6, 2, 13);
        const st =
          plane.phase === 'overrun'
            ? ['OUT OF RUNWAY — braking', C.red]
            : plane.strike
              ? ['TAIL STRIKE — rotated too far', C.red]
              : plane.alt > 0
                ? [`climbing · ${Math.round(plane.alt)} m up`, C.lime]
                : plane.phase === 'rotate'
                  ? ['rotate! nose up', C.amber]
                  : last.L > 0
                    ? [`${Math.round(plane.x)} m down the runway`, C.dim]
                    : ['engines spooling up', C.dim];
        tag(ctx, st[0], gx, by + 36, st[1], { align: 'right', size: 10 });
      }
    }

    /** The magnifier's airfoil geometry: the wing's real angle to the air at the plane's real speed. */
    function lensGeo(L) {
      const g = wingGeo(last.aoa, params.camber, params.thick, plane.V / V_UNIT);
      const S = L.r * 0.36;
      return { g, v: { S, cx: L.lensC[0], cy: L.lensC[1] + S * 0.2 }, rect: { x: L.lensC[0] - L.r, y: L.lensC[1] - L.r, w: L.r * 2, h: L.r * 2 } };
    }

    // a small airplane in the close-up's corner, showing where the slice was taken
    function drawLocator() {
      const s = narrow() ? 0.95 : 1.15;
      const saved = { ...plane };
      Object.assign(plane, { pitch: 0, gear: 0 });
      const L = { ppm: s, px: 18 + 46 * s, py: 150 };
      // facing left, into this view's wind (which blows from the left)
      const mid = 18 + 46 * s - 7 * s;
      ctx.save();
      ctx.translate(2 * mid, 0);
      ctx.scale(-1, 1);
      drawPlane(L, { small: true });
      const [cx0, cy] = P(L, ...WING_ROOT);
      const cx = 2 * mid - cx0;
      ctx.restore();
      Object.assign(plane, saved);
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 9);
      ctx.lineTo(cx, cy + 9);
      ctx.stroke();
      text(ctx, 'slice through the wing', 18, 172, { size: 10, color: C.dim });
    }

    function drawWing() {
      const { w, h } = api;
      const g = closeGeo(), v = wingView();
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, w, h);
      // pressure field (cached)
      if (params.pressure) {
        const key = `${params.alpha}|${params.camber}|${params.thick}|${w}|${h}`;
        // rebuilding is ~8000 flow evaluations, so while the angle is still sliding (a story
        // tween or a dragged slider) refresh it every sixth frame rather than every frame
        if (key !== fieldKey && (!field || api.frame - fieldFrame >= 6)) {
          fieldKey = key;
          fieldFrame = api.frame;
          const gw = 110, gh = Math.round((110 * h) / w);
          field = document.createElement('canvas');
          field.width = gw;
          field.height = gh;
          const fc = field.getContext('2d');
          const im = fc.createImageData(gw, gh);
          for (let j = 0; j < gh; j++)
            for (let i = 0; i < gw; i++) {
              const z = flow.toWing(((i + 0.5) / gw) * w, ((j + 0.5) / gh) * h, g, v);
              const u = vel(z, g);
              const k = (j * gw + i) * 4;
              if (!u) {
                im.data[k + 3] = 0;
                continue;
              }
              const cp = 1 - (u[0] * u[0] + u[1] * u[1]) / (params.U * params.U);
              const t = clamp(0.5 + cp * 0.32, 0, 1);
              const c = Math.floor(t * 255) * 3;
              im.data[k] = CMAPS.diverge[c];
              im.data[k + 1] = CMAPS.diverge[c + 1];
              im.data[k + 2] = CMAPS.diverge[c + 2];
              im.data[k + 3] = 200;
            }
          fc.putImageData(im, 0, 0);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(field, 0, 0, w, h);
      }
      flow.draw(g, v, params.mode);
      const wg = ctx.createLinearGradient(0, v.cy - v.S * 0.4, 0, v.cy + v.S * 0.3);
      wg.addColorStop(0, '#d9deec');
      wg.addColorStop(1, '#59607a');
      flow.airfoil(g, v, wg);
      // lift arrow
      const Lmag = g.G * params.U;
      const qc = flow.toScreen([-CC, 0], g, v);
      const len = clamp(Lmag * 22, -v.S * 2, v.S * 2.4);
      if (Math.abs(len) > 4) arrow(ctx, qc[0], qc[1] - 10, qc[0], qc[1] - 10 - len, g.stall > 0 ? C.red : C.lime, 4, 14);
      if (!api.thumbnail) {
        tag(ctx, g.stall > 0 ? 'STALL — lift collapsing' : 'lift', qc[0] + 14, qc[1] - 20 - len * 0.7, g.stall > 0 ? C.red : C.lime, { size: 11 });
        text(ctx, 'wind →', 18, 84, { size: 12, color: C.dim });
        drawLocator();
        tag(ctx, `angle of attack ${params.alpha.toFixed(1)}°`, w - 16, 84, C.amber, { align: 'right', size: 11 });
        if (params.pressure) text(ctx, 'blue: low pressure   red: high pressure', w - 16, 110, { size: 10, align: 'right', color: C.dim });
      }
    }

    return {
      restart,
      pointerDown(p) {
        drag = { y: p.y, a: params.alpha };
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        api.runner.set('alpha', clamp(Math.round((drag.a + (drag.y - p.y) * 0.1) * 2) / 2, -8, 24));
      },
      pointerUp() {
        drag = null;
      },
      onParam(k) {
        if (k === 'mode') flow.clear();
        if (k === 'scene') {
          flow.clear();
          lens.clear();
        }
      },
      update(dt) {
        if (params.scene === 'takeoff') {
          stepTakeoff(dt);
          const L = layout();
          const lg = lensGeo(L);
          // the cap must hold every streak for the whole crossing, or the slow air under the wing (the
          // oldest streaks) is dropped before it reaches the far edge
          lens.update(dt, lg.g, lg.v, lg.rect, 'streaks', narrow() ? 60 : 100, 1400);
        } else {
          const { w, h } = api;
          flow.update(dt, closeGeo(), wingView(), { x: 0, y: 60, w, h: h - 60 }, params.mode, 190, 1700);
        }
      },
      draw() {
        if (params.scene === 'takeoff') drawTakeoff();
        else drawWing();
      },
      stats() {
        if (params.scene === 'takeoff') {
          const f = last;
          return [
            { label: 'Airspeed', value: `${(plane.V * KMH).toFixed(0)} km/h` },
            { label: 'Lift ÷ weight', value: `${Math.round((f.L / f.W) * 100)}%`, color: f.L >= f.W ? C.lime : undefined },
            { label: 'Take-off speed', value: Number.isFinite(liftoffSpeed()) ? `${(liftoffSpeed() * KMH).toFixed(0)} km/h` : 'never', color: C.amber },
            { label: plane.liftoffX !== null ? 'Runway used' : 'Distance', value: `${Math.round(plane.liftoffX ?? plane.x).toLocaleString()} m` },
            { label: 'Altitude', value: `${Math.round(plane.alt)} m` },
          ];
        }
        const g = closeGeo();
        const CL = liftCoef(params.alpha, params.camber, params.thick);
        return [
          { label: 'Lift coefficient C_L', value: CL.toFixed(2), color: g.stall > 0 ? C.red : C.lime },
          { label: 'Lift (relative)', value: (g.G * params.U).toFixed(2) },
          { label: 'Airspeed', value: (params.U * 250).toFixed(0) + ' km/h' },
          { label: 'State', value: g.stall > 0 ? 'stalled' : params.alpha < -3 ? 'pushing down' : 'flying', color: g.stall > 0 ? C.red : C.teal },
        ];
      },
      charts() {
        if (params.scene === 'takeoff')
          return [
            {
              title: 'Lift ÷ weight during the takeoff',
              series: [{ data: sRatio.data, color: C.lime }],
              ref: { data: sRatio.data.map(() => 1), color: 'rgba(255,255,255,0.35)' },
              min: 0,
              max: 1.6,
              length: 300,
              xLabel: 'above the line = flying',
            },
          ];
        const data = [];
        for (let a = -8; a <= 24; a += 1) data.push(liftCoef(a, params.camber, params.thick));
        const mark = data.map((_, i) => (Math.abs(-8 + i - params.alpha) < 0.5 ? Math.max(...data) : 0));
        return [{ title: 'Lift coefficient vs angle (−8° → 24°)', kind: 'bars', series: [{ data: mark, color: 'rgba(255,181,71,0.45)' }], ref: { data, color: C.lime }, xLabel: 'stall beyond ~15°' }];
      },
    };
  },
};
