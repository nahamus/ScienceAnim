import { C, TAU, clamp, tag, text, drawGlow } from '../../core/util.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEG = Math.PI / 180;

/** Solar declination (degrees) for a day of the year and axial tilt. */
const decl = (day, tilt) => tilt * Math.sin((TAU * (day - 80)) / 365);
function dayLength(lat, d) {
  const x = -Math.tan(lat * DEG) * Math.tan(d * DEG);
  if (x <= -1) return 24;
  if (x >= 1) return 0;
  return (24 * Math.acos(x)) / Math.PI;
}

export default {
  id: 'seasons',
  title: 'Why We Have Seasons',
  category: 'earth',
  tagline: 'It’s not how close we are to the Sun. It’s the tilt.',
  ages: ['11-14'],
  topics: ['Space', 'Climate'],
  blurb:
    'Most people guess that summer happens when Earth is closest to the Sun. In fact Earth is closest in early January — midwinter in the north. Seasons come from Earth’s 23.4° tilt: for half the year one hemisphere leans toward the Sun, getting longer days and more direct, concentrated sunlight.',
  ideas: [
    'Earth’s axis is tilted <b>23.4°</b> and always points the same way in space (toward the North Star).',
    'The hemisphere tilted toward the Sun gets <b>longer days</b> and a <b>higher Sun</b>.',
    'High-angle sunlight is <b>concentrated</b> on a smaller area, so it heats more.',
    'Distance hardly matters: Earth is only 3% closer in January than in July.',
  ],
  hint: 'Drag the Earth along its orbit to change the date',
  thumbChapter: 1,
  thumbFrames: 2,
  params: [
    { key: 'day', label: 'Day of year', type: 'range', min: 0, max: 364, step: 1, value: 172, format: (v) => { const d = new Date(2025, 0, 1 + Math.round(v)); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; } },
    { key: 'tilt', label: 'Axial tilt', type: 'range', min: 0, max: 60, step: 0.1, value: 23.4, unit: '°', digits: 1 },
    { key: 'lat', label: 'Your latitude', type: 'range', min: -89, max: 89, step: 1, value: 45, format: (v) => Math.abs(v) + '° ' + (v >= 0 ? 'N' : 'S') },
    { key: 'run', label: 'Let the year pass', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'A tilted planet',
      text: 'Earth circles the Sun once a year. Its spin axis is tilted by 23.4°, and — this is the key — the axis keeps pointing the <b>same direction</b> in space all year round, toward the North Star.',
      params: { tilt: 23.4, lat: 45, run: true },
      duration: 12,
    },
    {
      title: 'June: the north leans in',
      text: 'In June the northern half tilts toward the Sun. At 45° N the Sun climbs high and stays up about 15½ hours. Below the Arctic Circle the Sun never sets at all: the <b>midnight sun</b>.',
      params: { day: 172, run: false, lat: 45, tilt: 23.4 },
      tween: 3,
      duration: 13,
    },
    {
      title: 'Concentrated sunlight',
      text: 'Look at the sunbeam close-up. When the Sun is high, a beam of light lands on a small patch of ground and heats it strongly. When the Sun is low the same beam smears across a large area. That, plus long days, is summer.',
      formula: 'heating ∝ sin(Sun’s elevation)',
      params: { day: 172, lat: 45, run: false, tilt: 23.4 },
      duration: 14,
    },
    {
      title: 'December: the south’s turn',
      text: 'Six months later the axis still points the same way, but Earth is on the other side of the Sun. Now the southern hemisphere leans in and has summer, while the north has short days and a low winter Sun.',
      params: { day: 355, lat: 45, run: false, tilt: 23.4 },
      tween: 4,
      duration: 13,
    },
    {
      title: 'Not distance',
      check: {
        q: 'Earth is closest to the Sun in early January. What season is it then in the northern hemisphere?',
        options: ['Summer', 'Winter'],
        answer: 1,
        explain: 'Northern winter. The north leans away from the Sun in January. Our distance from the Sun changes by only about 3%, far too little to matter next to the tilt.',
      },
      text: 'Earth’s orbit is slightly oval, and we are actually <b>closest to the Sun in early January</b> — northern winter. The 3% change in distance is tiny compared with the effect of the tilt.',
      params: { day: 3, lat: 45, run: false, tilt: 23.4 },
      tween: 2,
      duration: 12,
    },
    {
      title: 'What if there were no tilt?',
      check: {
        q: 'If Earth’s axis had no tilt at all, what would happen to the seasons?',
        options: ['They would be stronger', 'They would almost vanish', 'They would swap hemispheres'],
        answer: 1,
        explain: 'With no tilt, the Sun would climb to the same height every day of the year and days would always last 12 hours. Only the tiny effect of distance would remain.',
      },
      text: 'Set the tilt to zero. Every place now has 12-hour days all year and the Sun follows the same path every day: <b>no seasons</b>. Crank it up to 60° and seasons become extreme.',
      params: { tilt: 0, run: true },
      tween: 3,
      enter: (s, r) => s.later(6.5, () => r.set('tilt', 50, 4)),
      duration: 15,
    },
    {
      title: 'Your planet',
      text: 'Pick your latitude and drag Earth around its orbit. The chart shows how long your days are through the year.',
      params: { tilt: 23.4, run: true },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let dragging = false, glob = null, gctx = null, gimg = null, gsize = 0;
    const stars = Array.from({ length: 160 }, () => [Math.random(), Math.random(), Math.random() * 1.1 + 0.2, Math.random() * 0.5 + 0.15]);

    const geom = () => {
      const { w, h } = api;
      const wide = w >= 820;
      const orbW = wide ? w * 0.56 : w;
      const cx = orbW * 0.5, cy = Math.max(170, h * 0.36);
      const rx = Math.min(orbW * 0.4, 300), ry = rx * 0.32;
      if (wide) {
        const gR = Math.min(110, (w - orbW) * 0.32, h * 0.18);
        return { cx, cy, rx, ry, wide, gx: orbW + (w - orbW) / 2, gy: Math.max(80 + gR, h * 0.3), gR };
      }
      // narrow screens: a smaller close-up globe tucked under the orbit, on the right
      const gR = Math.min(64, h * 0.11, w * 0.14);
      return { cx, cy, rx, ry, wide: true, gx: w - gR - 34, gy: cy + ry + gR + 46, gR };
    };
    // June solstice on the right of the orbit, December on the left; the axis always leans left in space
    const orbitPos = (day, g) => {
      const a = (TAU * (day - 172)) / 365;
      return { x: g.cx + Math.cos(a) * g.rx, y: g.cy - Math.sin(a) * g.ry, a, depth: -Math.sin(a) };
    };
    /** Spin axis seen from the side with the Sun to the left: leans toward the Sun in June. */
    const axisVec = () => {
      const t = params.tilt * DEG, a = (TAU * (params.day - 172)) / 365;
      return [-Math.sin(t) * Math.cos(a), Math.cos(t), Math.sin(t) * Math.sin(a)];
    };
    const basis = (A) => {
      let e1 = [A[1], -A[0], 0];
      const m = Math.hypot(e1[0], e1[1]) || 1;
      e1 = [e1[0] / m, e1[1] / m, 0];
      const e2 = [A[1] * e1[2] - A[2] * e1[1], A[2] * e1[0] - A[0] * e1[2], A[0] * e1[1] - A[1] * e1[0]];
      return [e1, e2];
    };

    function renderGlobe(R) {
      const size = Math.ceil(R * 2);
      if (size !== gsize) {
        gsize = size;
        glob = document.createElement('canvas');
        glob.width = glob.height = size;
        gctx = glob.getContext('2d');
        gimg = gctx.createImageData(size, size);
      }
      const A = axisVec();
      const [e1, e2] = basis(A);
      const spin = api.time * 0.6;
      const d = gimg.data;
      for (let j = 0; j < size; j++)
        for (let i = 0; i < size; i++) {
          const x = (i + 0.5 - R) / R, y = (R - j - 0.5) / R;
          const r2 = x * x + y * y;
          const k = (j * size + i) * 4;
          if (r2 > 1) {
            d[k + 3] = 0;
            continue;
          }
          const z = Math.sqrt(1 - r2);
          const lat = Math.asin(clamp(x * A[0] + y * A[1] + z * A[2], -1, 1));
          const lon = Math.atan2(x * e2[0] + y * e2[1] + z * e2[2], x * e1[0] + y * e1[1] + z * e1[2]) + spin;
          const light = -x; // Sun to the left
          const land = Math.sin(lon * 3 + 1) * Math.cos(lat * 4) + Math.sin(lon * 5) * 0.4 > 0.45;
          const ice = Math.abs(lat) > 1.2;
          let r = land ? 60 : 22, g = land ? 130 : 70, b = land ? 70 : 160;
          if (ice) (r = 225), (g = 235), (b = 245);
          const l = clamp(light * 1.4 + 0.12, 0.06, 1);
          d[k] = r * l;
          d[k + 1] = g * l;
          d[k + 2] = b * l;
          d[k + 3] = 255;
        }
      gctx.putImageData(gimg, 0, 0);
      return glob;
    }

    let jobs = [];
    return {
      later(t, fn) {
        jobs.push({ t, fn });
      },
      pointerDown(p) {
        const g = geom();
        const e = orbitPos(params.day, g);
        if (Math.hypot(p.x - e.x, p.y - e.y) < 50) dragging = true;
      },
      pointerMove(p) {
        if (!dragging || !p.down) return;
        const g = geom();
        const a = Math.atan2(-(p.y - g.cy) / g.ry, (p.x - g.cx) / g.rx);
        let day = Math.round(172 + (a / TAU) * 365);
        day = ((day % 365) + 365) % 365;
        api.runner.set('run', false);
        api.runner.set('day', day);
      },
      pointerUp() {
        dragging = false;
      },
      update(dt) {
        for (const j of jobs) if ((j.t -= dt) <= 0) j.fn();
        jobs = jobs.filter((j) => j.t > 0);
        if (params.run) {
          const v = (params.day + dt * 22) % 365;
          api.runner.params.day = v;
          api.runner.onParamChange?.('day', v);
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#03040b';
        ctx.fillRect(0, 0, w, h);
        for (const [x, y, r, a] of stars) {
          ctx.fillStyle = `rgba(220,230,255,${a})`;
          ctx.fillRect(x * w, y * h, r, r);
        }
        const g = geom();
        const day = params.day;
        const dec = decl(day, params.tilt);

        // orbit
        ctx.strokeStyle = 'rgba(160,180,255,0.22)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(g.cx, g.cy, g.rx, g.ry, 0, 0, TAU);
        ctx.stroke();
        if (!api.thumbnail)
          for (const [d, lbl] of [[172, 'June solstice'], [266, 'Sept equinox'], [355, 'Dec solstice'], [80, 'March equinox']]) {
            const p = orbitPos(d, g);
            text(ctx, lbl, p.x, p.y + (p.depth > 0 ? -16 : 22), { size: 10, align: 'center', color: 'rgba(233,237,247,0.45)' });
          }

        const e = orbitPos(day, g);
        const drawEarth = () => {
          const R = 18 + 4 * (1 - e.depth) * 0.5;
          // lit side faces the Sun
          const toSun = Math.atan2(g.cy - e.y, g.cx - e.x);
          const grd = ctx.createRadialGradient(e.x + Math.cos(toSun) * R * 0.5, e.y + Math.sin(toSun) * R * 0.5, R * 0.1, e.x, e.y, R * 1.1);
          grd.addColorStop(0, '#9fd8ff');
          grd.addColorStop(0.45, '#2a78d6');
          grd.addColorStop(1, '#040a1c');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(e.x, e.y, R, 0, TAU);
          ctx.fill();
          // axis: fixed in space, always leaning to the left of the screen
          const t = params.tilt * DEG;
          ctx.strokeStyle = C.amber;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(e.x + Math.sin(t) * R * 1.6, e.y + Math.cos(t) * R * 1.6);
          ctx.lineTo(e.x - Math.sin(t) * R * 1.6, e.y - Math.cos(t) * R * 1.6);
          ctx.stroke();
          text(ctx, 'N', e.x - Math.sin(t) * R * 1.9, e.y - Math.cos(t) * R * 1.9, { size: 10, align: 'center', color: C.amber, weight: 700 });
        };
        if (e.depth > 0) drawEarth();
        // Sun
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, g.cx, g.cy, 120, '#ffb547', 0.25);
        drawGlow(ctx, g.cx, g.cy, 46, '#fff1c2', 0.5);
        ctx.globalCompositeOperation = 'source-over';
        if (e.depth <= 0) drawEarth();

        // close-up globe (wide layouts)
        if (g.wide && g.gR > 30) {
          const R = g.gR;
          const img = renderGlobe(R);
          // sunbeams from the left
          ctx.globalCompositeOperation = 'lighter';
          for (let k = -4; k <= 4; k++) {
            const y = g.gy + (k / 4) * R * 1.1;
            const grd = ctx.createLinearGradient(g.gx - R * 2.3, 0, g.gx - R * 0.8, 0);
            grd.addColorStop(0, 'rgba(255,200,100,0)');
            grd.addColorStop(1, 'rgba(255,200,100,0.12)');
            ctx.strokeStyle = grd;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(g.gx - R * 2.3, y);
            ctx.lineTo(g.gx - R * 0.6, y);
            ctx.stroke();
          }
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(img, g.gx - R, g.gy - R, R * 2, R * 2);
          // axis + your latitude circle
          const A = axisVec();
          const [e1, e2] = basis(A);
          ctx.strokeStyle = 'rgba(255,181,71,0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(g.gx - A[0] * R * 1.3, g.gy + A[1] * R * 1.3);
          ctx.lineTo(g.gx + A[0] * R * 1.3, g.gy - A[1] * R * 1.3);
          ctx.stroke();
          const lat = params.lat * DEG;
          const sl = Math.sin(lat), cl = Math.cos(lat);
          let lx = 0, ly = 0, lbest = -2;
          ctx.strokeStyle = C.pink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          let pen = false;
          for (let k = 0; k <= 72; k++) {
            const th = (k / 72) * TAU;
            const p = [0, 1, 2].map((q) => sl * A[q] + cl * (Math.cos(th) * e1[q] + Math.sin(th) * e2[q]));
            const sx = g.gx + p[0] * R, sy = g.gy - p[1] * R;
            if (p[2] >= 0) {
              ctx[pen ? 'lineTo' : 'moveTo'](sx, sy);
              pen = true;
              if (p[0] > lbest) (lbest = p[0]), (lx = sx), (ly = sy);
            } else pen = false;
          }
          ctx.stroke();
          if (!api.thumbnail) {
            tag(ctx, 'sunlight →', g.gx - R * 1.6, g.gy - R - 14, C.amber, { align: 'center', size: 10 });
            if (lbest > -2) tag(ctx, `${Math.abs(params.lat)}° ${params.lat >= 0 ? 'N' : 'S'}`, lx + 8, ly, C.pink, { size: 10 });
          }
          // beam spread diagram below the globe
          const el = clamp(90 - Math.abs(params.lat - dec), 0, 90);
          const by = g.gy + R + 70;
          const bx = g.gx;
          if (by + 40 < h) {
            const spread = el > 1 ? 1 / Math.sin(el * DEG) : 8;
            const W0 = 36;
            const W1 = Math.min(W0 * spread, (api.w - bx) * 1.6);
            ctx.fillStyle = 'rgba(255,200,100,0.18)';
            const dx = Math.cos(el * DEG) * 70, dy = Math.sin(el * DEG) * 70;
            // ray bundle
            ctx.beginPath();
            ctx.moveTo(bx - W1 / 2 - dx, by - dy);
            ctx.lineTo(bx - W1 / 2, by);
            ctx.lineTo(bx + W1 / 2, by);
            ctx.lineTo(bx + W1 / 2 - dx, by - dy);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#3a2a18';
            ctx.fillRect(bx - 90, by, 180, 6);
            ctx.fillStyle = 'rgba(255,190,90,0.9)';
            ctx.fillRect(bx - W1 / 2, by, W1, 3);
            if (!api.thumbnail) text(ctx, `Sun ${el.toFixed(0)}° high · same light spread ${spread.toFixed(1)}×`, Math.min(bx, api.w - 120), by + 20, { size: 10, align: "center", color: C.dim });
          }
        }

        if (!api.thumbnail) {
          const dl = dayLength(params.lat, dec);
          const d = new Date(2025, 0, 1 + Math.round(day));
          tag(ctx, `${d.getDate()} ${MONTHS[d.getMonth()]}  ·  daylight ${Math.floor(dl)}h ${String(Math.round((dl % 1) * 60)).padStart(2, '0')}m at ${Math.abs(params.lat)}°${params.lat >= 0 ? 'N' : 'S'}`, 18, 84, C.ink, { size: 12 });
        }
      },
      stats() {
        const dec = decl(params.day, params.tilt);
        const dl = dayLength(params.lat, dec);
        const el = 90 - Math.abs(params.lat - dec);
        const sunDist = 1 - 0.0167 * Math.cos((TAU * (params.day - 3)) / 365);
        const season = (lat) => {
          const s = Math.sign(lat || 1) * dec;
          if (Math.abs(dec) < params.tilt * 0.35) return params.day < 172 || params.day > 300 ? (s >= 0 ? 'spring' : 'autumn') : s >= 0 ? 'autumn' : 'spring';
          return s > 0 ? 'summer' : 'winter';
        };
        return [
          { label: 'Daylight', value: `${dl.toFixed(1)} h`, color: C.amber },
          { label: 'Noon Sun height', value: Math.max(0, el).toFixed(1) + '°' },
          { label: 'Sun overhead at', value: `${Math.abs(dec).toFixed(1)}° ${dec >= 0 ? 'N' : 'S'}` },
          { label: 'Distance to Sun', value: (sunDist * 149.6).toFixed(1) + ' M km' },
          { label: 'Season here', value: params.tilt < 0.5 ? 'none!' : season(params.lat), color: C.teal },
        ];
      },
      charts() {
        const data = [], ref = [];
        for (let d = 0; d < 365; d += 5) {
          data.push(dayLength(params.lat, decl(d, params.tilt)));
          ref.push(12);
        }
        const cur = Math.round(params.day / 5);
        return [{ title: `Hours of daylight through the year (now: ${MONTHS[new Date(2025, 0, 1 + Math.round(params.day)).getMonth()]})`, series: [{ data: data.slice(0, cur + 1), color: C.amber }], ref: { data: ref, color: 'rgba(255,255,255,0.35)' }, length: data.length, min: 0, max: 24 }];
      },
    };
  },
};
