import { C, TAU, drawGlow, tag, text, Series, arrow } from '../../core/util.js';

const GM = 1, R1 = 1, R2 = 2.1, EARTH = 0.5, TS = 1.1; // TS: simulated time per real second

/** Orbit shape (conic) from a state vector. */
function elements(x, y, vx, vy) {
  const r = Math.hypot(x, y), v2 = vx * vx + vy * vy;
  const h = x * vy - y * vx;
  const ex = (v2 - GM / r) * x / GM - ((x * vx + y * vy) * vx) / GM;
  const ey = (v2 - GM / r) * y / GM - ((x * vx + y * vy) * vy) / GM;
  const e = Math.hypot(ex, ey);
  const energy = v2 / 2 - GM / r;
  const a = -GM / (2 * energy);
  return { e, a, w: Math.atan2(ey, ex), h, energy, rp: a * (1 - e), ra: a * (1 + e) };
}

export default {
  id: 'orbital-transfer',
  title: 'Orbital Manoeuvres',
  category: 'astronomy',
  tagline: 'To catch something ahead of you in orbit, first slow down. Rocket science, literally.',
  ages: ['14-16', '16+'],
  topics: ['Orbits', 'Gravity', 'Energy'],
  blurb:
    'Orbits defy intuition. Fire your engine forward and you end up higher but slower. Brake and you drop lower and overtake everything above you. Fly the moves real spacecraft use to reach space stations, change orbits and rendezvous.',
  ideas: [
    'An orbit is <b>falling</b> around a planet while moving sideways fast enough to keep missing it.',
    'Burning <b>forward</b> raises the opposite side of your orbit; burning backward lowers it.',
    'Higher orbits are <b>slower</b>, so speeding up eventually leaves you moving slower.',
    'A <b>Hohmann transfer</b> uses two burns to move between circular orbits with the least fuel.',
  ],
  hint: 'Click the upper half to burn forward, the lower half to burn backward',
  thumbChapter: 4,
  thumbFrames: 520,
  params: [
    { key: 'dv', label: 'Burn size Δv', type: 'range', min: 0.02, max: 0.3, step: 0.01, value: 0.1, format: (v) => (v * 5.59).toFixed(2) + ' km/s' },
    { key: 'station', label: 'Show space station', type: 'toggle', value: false },
    { key: 'predict', label: 'Show predicted orbit', type: 'toggle', value: true },
    { key: 'pro', label: 'Burn forward ↑', type: 'button', action: (s) => s.burn(1) },
    { key: 'retro', label: 'Burn backward ↓', type: 'button', action: (s) => s.burn(-1) },
    { key: 'hohmann', label: 'Auto: Hohmann to station orbit', type: 'button', action: (s) => s.hohmann() },
    { key: 'reset', label: 'Reset orbit', type: 'button', action: (s) => s.init() },
  ],
  story: [
    {
      title: 'Falling around the Earth',
      text: 'A spacecraft circles the Earth. It is in free fall, pulled toward the planet every moment — but it moves sideways so fast (about 5.6 km/s at this height) that the ground keeps curving away beneath it. That is all an orbit is.',
      params: { station: false, predict: true },
      enter: (s) => s.init(),
      duration: 11,
    },
    {
      title: 'Burn forward',
      text: 'Fire the engine forward for a moment. The orbit stretches into an <b>ellipse</b>: the far side rises, while the point where you burned stays put. On the way up the craft slows as it climbs against gravity.',
      params: { station: false },
      enter: (s) => {
        s.init();
        s.schedule(1.2, () => s.burn(1, 0.16));
      },
      duration: 13,
    },
    {
      title: 'Circularise at the top',
      text: 'At the highest point (apoapsis) burn forward again. Now the orbit is a bigger circle. Check the speed: the craft is now <b>slower</b> than when it started, even though it fired its engine twice. Higher orbits are slower.',
      formula: 'v = √(GM / r)',
      enter: (s) => s.hohmann(),
      duration: 16,
    },
    {
      title: 'Lower is faster',
      text: 'A space station waits in the higher orbit, and our craft is in the lower one. Watch the inner craft <b>lap</b> the station: the inner orbit is shorter and faster. Orbital period grows steeply with size.',
      formula: 'T² ∝ r³   (Kepler’s third law)',
      params: { station: true },
      enter: (s) => s.init(true),
      duration: 13,
    },
    {
      title: 'Rendezvous',
      text: 'To dock, wait until the station is the right distance ahead, then do a <b>Hohmann transfer</b>. Half an orbit later the craft arrives exactly as the station does. This is how crews reach the International Space Station.',
      params: { station: true },
      enter: (s) => s.rendezvous(),
      duration: 18,
    },
    {
      title: 'Fly it yourself',
      text: 'Burn forward or backward and watch the predicted orbit change. Try to catch the station: remember, to go faster, go lower.',
      params: { station: true },
      enter: (s) => s.init(true),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let craft, st, trail = [], flame = 0, flameDir = 1, jobs = [], auto = null, prevVr = 0, t = 0, burns = 0, totalDv = 0, docked = false;
    const sSpeed = new Series(400);
    const bg = Array.from({ length: 260 }, () => [Math.random(), Math.random(), Math.random() * 1.3 + 0.2, Math.random() * 0.6 + 0.15]);

    function init(_withStation = false, stPhase = 0.8) {
      const v = Math.sqrt(GM / R1);
      craft = { x: R1, y: 0, vx: 0, vy: -v };
      const vs = Math.sqrt(GM / R2);
      const a = -stPhase;
      st = { x: R2 * Math.cos(a), y: R2 * Math.sin(a), vx: vs * Math.sin(a), vy: -vs * Math.cos(a) };
      trail = [];
      jobs = [];
      auto = null;
      t = 0;
      burns = 0;
      totalDv = 0;
      docked = false;
      sSpeed.clear();
    }
    function burn(dir, dv = params.dv) {
      const v = Math.hypot(craft.vx, craft.vy);
      craft.vx += (craft.vx / v) * dv * dir;
      craft.vy += (craft.vy / v) * dv * dir;
      flame = 0.7;
      flameDir = dir;
      burns++;
      totalDv += dv;
      docked = false;
    }
    function hohmann() {
      const r = Math.hypot(craft.x, craft.y);
      const dv1 = Math.sqrt(GM / r) * (Math.sqrt((2 * R2) / (r + R2)) - 1);
      burn(1, dv1);
      auto = { stage: 'apo' };
      prevVr = 1;
    }
    function rendezvous() {
      // station must lead by π − ω₂·t_transfer when we start the transfer
      const tH = Math.PI * Math.sqrt(((R1 + R2) / 2) ** 3 / GM);
      const lead = Math.PI - Math.sqrt(GM / R2 ** 3) * tH;
      // craft orbits clockwise on screen (angle decreasing); start 2.5 s before the burn
      const wait = 2.5;
      const w1 = Math.sqrt(GM / R1 ** 3), w2 = Math.sqrt(GM / R2 ** 3);
      init(true, 0);
      const phase0 = lead + (w1 - w2) * wait * TS; // station angle ahead (clockwise) at t=0
      const a = -phase0;
      const vs = Math.sqrt(GM / R2);
      st = { x: R2 * Math.cos(a), y: R2 * Math.sin(a), vx: vs * Math.sin(a), vy: -vs * Math.cos(a) };
      jobs.push({ at: wait, fn: hohmann });
    }
    init();

    function grav(b, dt) {
      const r = Math.hypot(b.x, b.y);
      const a = -GM / (r * r * r);
      b.vx += a * b.x * dt;
      b.vy += a * b.y * dt;
    }

    return {
      init,
      burn,
      hohmann,
      rendezvous,
      schedule(at, fn) {
        jobs.push({ at: t + at, fn });
      },
      reset: () => init(params.station),
      pointerDown(p) {
        burn(p.y < api.h / 2 ? 1 : -1);
      },
      update(dt) {
        if (docked) {
          craft = { ...st };
        }
        const steps = 8;
        const h = (dt * TS) / steps;
        for (let k = 0; k < steps; k++) {
          for (const b of docked ? [st] : [craft, st]) {
            grav(b, h / 2);
            b.x += b.vx * h;
            b.y += b.vy * h;
            grav(b, h / 2);
          }
          const r = Math.hypot(craft.x, craft.y);
          if (r < EARTH * 1.02) {
            // crashed: bounce back to a safe orbit
            init(params.station);
            return;
          }
        }
        t += dt;
        for (const j of jobs) if (!j.done && t >= j.at) (j.done = true), j.fn();
        jobs = jobs.filter((j) => !j.done);
        if (auto) {
          const vr = craft.x * craft.vx + craft.y * craft.vy;
          if (prevVr > 0 && vr <= 0) {
            const r = Math.hypot(craft.x, craft.y);
            const v = Math.hypot(craft.vx, craft.vy);
            burn(1, Math.sqrt(GM / r) - v);
            auto = null;
          }
          prevVr = vr;
        }
        if (params.station && !docked && Math.hypot(craft.x - st.x, craft.y - st.y) < 0.1 && Math.hypot(craft.vx - st.vx, craft.vy - st.vy) < 0.05) docked = true;
        flame = Math.max(0, flame - dt);
        trail.push([craft.x, craft.y]);
        if (trail.length > 420) trail.shift();
        if (api.frame % 3 === 0) sSpeed.push(Math.hypot(craft.vx, craft.vy) * 5.59);
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#02030a';
        ctx.fillRect(0, 0, w, h);
        for (const [x, y, r, a] of bg) {
          ctx.fillStyle = `rgba(220,230,255,${a})`;
          ctx.fillRect(x * w, y * h, r, r);
        }
        const S = Math.min(w, h - 120) / (2 * R2 * 1.25);
        const cx = w / 2, cy = Math.max(h * 0.42, 60 + R2 * S * 1.1);
        const P = (x, y) => [cx + x * S, cy + y * S];

        // station orbit
        if (params.station) {
          ctx.strokeStyle = 'rgba(56,214,245,0.18)';
          ctx.setLineDash([2, 6]);
          ctx.beginPath();
          ctx.arc(cx, cy, R2 * S, 0, TAU);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        // predicted orbit
        const el = elements(craft.x, craft.y, craft.vx, craft.vy);
        if (params.predict && el.energy < 0) {
          const b = el.a * Math.sqrt(Math.max(0, 1 - el.e * el.e));
          const fx = -el.a * el.e; // ellipse centre offset from focus along periapsis direction
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(el.w);
          ctx.strokeStyle = 'rgba(255,181,71,0.45)';
          ctx.setLineDash([6, 6]);
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.ellipse(fx * S, 0, el.a * S, b * S, 0, 0, TAU);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
          if (el.e > 0.02 && !api.thumbnail) {
            const [ax, ay] = P(Math.cos(el.w + Math.PI) * el.ra, Math.sin(el.w + Math.PI) * el.ra);
            const [qx, qy] = P(Math.cos(el.w) * el.rp, Math.sin(el.w) * el.rp);
            tag(ctx, `apoapsis ${((el.ra - EARTH) * 12740).toFixed(0)} km`, ax, ay - 16, C.amber, { align: 'center', size: 10 });
            if (el.rp > EARTH) tag(ctx, `periapsis ${((el.rp - EARTH) * 12740).toFixed(0)} km`, qx, qy + 16, C.amber, { align: 'center', size: 10 });
            else tag(ctx, 'IMPACT', qx, qy + 16, C.red, { align: 'center', size: 10 });
          }
        }
        // earth
        const [ex, ey] = P(0, 0);
        const er = EARTH * S;
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, ex, ey, er * 1.5, '#3a7bff', 0.62);
        ctx.globalCompositeOperation = 'source-over';
        const eg = ctx.createRadialGradient(ex - er * 0.4, ey - er * 0.4, er * 0.1, ex, ey, er);
        eg.addColorStop(0, '#6fc3ff');
        eg.addColorStop(0.5, '#1f6fd1');
        eg.addColorStop(1, '#0a2250');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, TAU);
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = 'rgba(70,170,90,0.55)';
        const rot = t * 0.15;
        for (let k = 0; k < 6; k++) {
          const a = rot + k * 1.1;
          ctx.beginPath();
          ctx.ellipse(ex + Math.cos(a) * er * 0.55, ey + Math.sin(k * 1.7) * er * 0.5, er * 0.28, er * 0.17, a, 0, TAU);
          ctx.fill();
        }
        const night = ctx.createLinearGradient(ex - er, ey - er, ex + er, ey + er);
        night.addColorStop(0.45, 'rgba(0,0,10,0)');
        night.addColorStop(1, 'rgba(0,0,10,0.75)');
        ctx.fillStyle = night;
        ctx.fillRect(ex - er, ey - er, er * 2, er * 2);
        ctx.restore();

        // trail
        ctx.lineWidth = 1.6;
        for (let i = 1; i < trail.length; i++) {
          const [x1, y1] = P(...trail[i - 1]);
          const [x2, y2] = P(...trail[i]);
          ctx.strokeStyle = `rgba(255,95,162,${(i / trail.length) * 0.8})`;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // station
        if (params.station) {
          const [sx, sy] = P(st.x, st.y);
          const a = Math.atan2(st.vy, st.vx);
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(a);
          ctx.fillStyle = '#9fb3d9';
          ctx.fillRect(-3, -9, 6, 18);
          ctx.fillStyle = '#2f6fd8';
          ctx.fillRect(-12, -12, 7, 24);
          ctx.fillRect(5, -12, 7, 24);
          ctx.restore();
          if (!api.thumbnail) tag(ctx, docked ? 'DOCKED ✓' : 'station', sx, sy - 22, docked ? C.lime : C.cyan, { align: 'center', size: 10 });
        }

        // craft
        if (!docked || !params.station) {
          const [px, py] = P(craft.x, craft.y);
          const a = Math.atan2(craft.vy, craft.vx);
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(a);
          if (flame > 0) {
            ctx.globalCompositeOperation = 'lighter';
            const fx = flameDir > 0 ? -10 : 10;
            drawGlow(ctx, fx - flameDir * 8, 0, 18 * (flame + 0.4), '#ff8a3d', 0.15);
            ctx.globalCompositeOperation = 'source-over';
          }
          ctx.fillStyle = '#ffe2ee';
          ctx.beginPath();
          ctx.moveTo(9, 0);
          ctx.lineTo(-6, -5);
          ctx.lineTo(-3, 0);
          ctx.lineTo(-6, 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          const v = Math.hypot(craft.vx, craft.vy);
          if (!api.thumbnail) arrow(ctx, px, py, px + (craft.vx / v) * (24 + v * 30), py + (craft.vy / v) * (24 + v * 30), 'rgba(255,95,162,0.8)', 1.6, 7);
          if (!api.thumbnail) text(ctx, `${(v * 5.59).toFixed(2)} km/s`, px + 14, py - 14, { size: 11, color: C.pink, mono: true });
        }
      },
      stats() {
        const r = Math.hypot(craft.x, craft.y);
        const el = elements(craft.x, craft.y, craft.vx, craft.vy);
        const T = el.energy < 0 ? TAU * Math.sqrt(el.a ** 3 / GM) : Infinity;
        return [
          { label: 'Speed', value: (Math.hypot(craft.vx, craft.vy) * 5.59).toFixed(2) + ' km/s', color: C.pink },
          { label: 'Altitude', value: ((r - EARTH) * 12740).toFixed(0) + ' km' },
          { label: 'Orbit period', value: isFinite(T) ? ((T * 239) / TAU).toFixed(0) + ' min' : 'escaping!' },
          { label: 'Eccentricity', value: el.e.toFixed(3) },
          { label: 'Burns / total Δv', value: `${burns} / ${(totalDv * 5.59).toFixed(2)} km/s` },
        ];
      },
      charts() {
        return [{ title: 'Speed (km/s)', series: [{ data: sSpeed.data, color: C.pink }], length: 400 }];
      },
    };
  },
};
