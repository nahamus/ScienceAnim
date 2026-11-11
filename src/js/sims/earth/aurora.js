import { C, TAU, clamp, drawGlow, tag, text } from '../../core/util.js';

// The Northern Lights.
// Space: Earth's dipole field (field lines r = L cos²λ), squashed on the day side and stretched into a tail at
// night. The solar wind flows round the magnetosphere along streamlines y = ±√(y₀² + b(x)²). A share of the
// particles that grows with geomagnetic activity (Kp) enters from the tail and spirals down field lines to an
// oval about 67° from the equator.
// Sky: curtains of light seen from the ground. Oxygen glows green (557.7 nm, ~100–200 km up) and red
// (630 nm, above ~200 km); nitrogen glows purple-blue along the lower edge. The oval reaches further from the
// pole as Kp rises (its edge sits near 68° − 2.4° × Kp geomagnetic latitude), so a strong storm is seen far south.

const PLACES = {
  tromso: { name: 'Tromsø, Norway', lat: 67 },
  edinburgh: { name: 'Edinburgh, Scotland', lat: 58 },
  london: { name: 'London, England', lat: 54 },
  madrid: { name: 'Madrid, Spain', lat: 43 },
};
const ovalEdge = (kp) => 68 - 2.4 * kp; // rough geomagnetic latitude of the oval's equatorward edge

export default {
  id: 'aurora',
  title: 'The Northern Lights',
  category: 'earth',
  tagline: 'Curtains of green and red light in the polar sky. Where do they come from?',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Magnetism', 'Space weather', 'Light'],
  keywords: ['aurora', 'aurora borealis', 'northern lights', 'southern lights', 'aurora australis', 'solar wind', 'magnetosphere', 'magnetic field', 'solar storm', 'coronal mass ejection', 'Kp index', 'oxygen', 'nitrogen', 'Carrington event'],
  blurb:
    'The Sun blows a constant wind of charged particles into space. Earth’s magnetic field shields us from most of it, but some particles are steered down towards the poles, where they crash into the upper atmosphere and make it glow: oxygen green and red, nitrogen purple. When the Sun throws out a big storm, the lights can be seen far from the poles, as they were across Europe and the Americas in May 2024.',
  ideas: [
    'The Sun constantly blows out charged particles, the <b>solar wind</b>, at about 400 km/s.',
    'Earth’s <b>magnetic field</b> deflects most of it, and charged particles spiral along field lines.',
    'Field lines plunge into the atmosphere near the magnetic poles, so particles arrive in a ring, the <b>auroral oval</b>.',
    'Particles slam into the thin air 100–300 km up, and the atoms glow: <b>oxygen green and red, nitrogen purple</b>.',
    'In a <b>solar storm</b> the oval grows, so the aurora can be seen much further from the poles.',
  ],
  hint: 'Turn up the solar activity, or set off a storm',
  thumbChapter: 4,
  thumbFrames: 200,
  params: [
    {
      key: 'scene', label: 'View', type: 'select', value: 'space', instant: true,
      options: [{ value: 'space', label: 'From space' }, { value: 'sky', label: 'From the ground' }],
    },
    { key: 'kp', label: 'Solar activity (Kp index)', type: 'range', min: 1, max: 9, step: 0.1, value: 3, format: (v) => `${v.toFixed(1)} (${v < 4 ? 'quiet' : v < 5 ? 'active' : v < 7 ? 'storm' : 'severe storm'})` },
    {
      key: 'place', label: 'Watching from', type: 'select', value: 'tromso',
      options: Object.entries(PLACES).map(([value, p]) => ({ value, label: p.name })),
    },
    { key: 'storm', label: 'Solar storm!', type: 'button', action: (s) => s.storm() },
  ],
  story: [
    {
      title: 'The solar wind',
      text: 'The Sun doesn’t just shine: it also blows out a stream of electrically charged particles, mostly protons and electrons, called the <b>solar wind</b>. It rushes out at about 400 km/s and takes two to four days to cross the 150 million km to Earth.',
      params: { scene: 'space', kp: 3 },
      duration: 13,
    },
    {
      title: 'Earth’s magnetic shield',
      text: 'Deep inside the Earth, molten iron makes a magnetic field like a giant bar magnet’s. Charged particles can’t easily cross magnetic field lines, so the solar wind is steered around this bubble, the <b>magnetosphere</b>, which it squashes on the day side and stretches into a long tail on the night side.',
      params: { scene: 'space', kp: 3 },
      duration: 14,
    },
    {
      title: 'Down to the poles',
      text: 'Some particles get in through the tail. Then they spiral along the field lines, which plunge into the atmosphere near the magnetic poles. So the particles rain down in a ring around each pole, the <b>auroral oval</b> (shown glowing), giving the northern lights (aurora borealis) and the southern lights (aurora australis).',
      check: {
        q: 'Why are the lights usually seen near the poles, not at the equator?',
        options: ['The magnetic field lines lead the particles down there', 'It is colder near the poles', 'The Sun shines on the poles more directly'],
        answer: 0,
        setup: { scene: 'space', kp: 4 },
        explain: 'Particles spiral along magnetic field lines like beads on a wire. Near the equator the field lines run parallel to the ground and keep particles high up. Near the poles they dive steeply into the atmosphere, guiding the particles down.',
      },
      params: { scene: 'space', kp: 4 },
      duration: 15,
    },
    {
      title: 'Glowing air',
      text: 'From the ground in northern Norway the oval is overhead. The incoming particles slam into the thin air 100–300 km up and give its atoms energy, which they give out again as light. Oxygen glows <b>green</b> around 100–200 km, and <b>red</b> higher up where the air is thinnest. Nitrogen adds a <b>purple-pink</b> fringe along the bottom edge.',
      params: { scene: 'sky', kp: 4, place: 'tromso' },
      duration: 15,
    },
    {
      title: 'Solar storms',
      text: 'Sometimes the Sun hurls out a billion-tonne cloud of particles, a coronal mass ejection. When it hits, the oval swells towards the equator and the aurora appears far south. In May 2024 a severe storm painted the sky red and pink over London, Madrid and even Mexico. In 1859 the Carrington event was so strong that telegraph wires sparked.',
      params: { scene: 'sky', kp: 8.7, place: 'london' },
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Switch between space and the ground, choose where you are watching from, and turn up the solar activity. How strong a storm do you need to see the lights from Madrid?',
      params: { scene: 'space', kp: 5, place: 'edinburgh' },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const wind = [];
    const entering = [];
    let ovalGlow = 0, t = 0, boost = 0, strip = null, stripKey = '', glow = null;

    const geom = () => {
      const { w, h } = api;
      const phone = w < 760;
      const Re = Math.min(w, h) * (phone ? 0.055 : 0.055);
      return { phone, Re, ex: w * (phone ? 0.62 : 0.66), ey: h * (phone ? 0.5 : 0.48) };
    };
    const kpNow = () => clamp(params.kp + boost, 1, 9);
    const standoff = () => 10.5 / (1 + 0.06 * (kpNow() - 1)); // Re
    /** Half-width of the magnetosphere at distance x (in Re, + towards the night side). */
    function halfWidth(x) {
      const R = standoff();
      if (x < -R) return 0;
      return 1.55 * R * Math.sqrt(clamp((x + R) / (2.4 * R), 0, 1.6));
    }

    function fieldLine(L, night) {
      // dipole line in the meridian plane, squashed by day and stretched by night
      const lmax = Math.acos(Math.sqrt(1 / L));
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const lam = -lmax + (2 * lmax * i) / 60;
        const r = L * Math.cos(lam) ** 2;
        let x = r * Math.cos(lam), y = -r * Math.sin(lam);
        const R = standoff();
        if (night) x *= 1 + 0.06 * L * L * (0.5 + 0.06 * kpNow());
        else x = -x * Math.min(1, (0.92 * R) / L);
        pts.push([x, y]);
      }
      return pts;
    }

    return {
      storm() {
        boost = 5.5;
      },
      update(dt) {
        t += dt;
        boost = Math.max(0, boost - dt * 0.35);
        if (params.scene !== 'space') return;
        const g = geom();
        const kp = kpNow();
        const xmin = -g.ex / g.Re - 1;
        // solar wind
        const rate = 160 * (0.6 + kp * 0.12);
        for (let k = 0; k < rate * dt; k++) wind.push({ x: xmin, y0: (Math.random() - 0.5) * 2 * (api.h / g.Re) * 0.55, v: 14 + Math.random() * 6 + kp * 0.8 });
        for (const p of wind) p.x += p.v * dt;
        for (let i = wind.length - 1; i >= 0; i--) if (wind[i].x > api.w / g.Re) wind.splice(i, 1);
        // a few enter through the tail and spiral down to the poles
        if (Math.random() < dt * kp * 1.4) {
          const L = 5.5 + Math.random() * 3;
          entering.push({ L, north: Math.random() < 0.5, s: 0, ph: Math.random() * TAU });
        }
        for (const e of entering) e.s += dt * 0.55;
        for (let i = entering.length - 1; i >= 0; i--)
          if (entering[i].s >= 1) {
            entering.splice(i, 1);
            ovalGlow = Math.min(1.5, ovalGlow + 0.18);
          }
        ovalGlow *= Math.exp(-dt * 0.6);
      },
      draw() {
        if (params.scene === 'space') this.drawSpace();
        else this.drawSky();
      },
      drawSpace() {
        const { w, h } = api;
        const g = geom();
        const kp = kpNow();
        ctx.fillStyle = '#03040a';
        ctx.fillRect(0, 0, w, h);
        for (let k = 0; k < 120; k++) {
          ctx.fillStyle = `rgba(200,210,255,${0.1 + ((k * 37) % 10) / 45})`;
          ctx.fillRect((((k * 7919) % 1000) / 1000) * w, (((k * 104729) % 997) / 997) * h, 1, 1);
        }
        const X = (x) => g.ex + x * g.Re, Y = (y) => g.ey + y * g.Re;
        // the Sun, far off to the left
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, -h * 0.35, g.ey, h * 0.9, '#ffb547', 0.35);
        ctx.globalCompositeOperation = 'source-over';
        text(ctx, 'Sun →', 16, g.ey - 4, { size: 11, color: C.amber, weight: 600 });
        // magnetopause outline
        ctx.strokeStyle = 'rgba(120,170,255,0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        for (const s of [1, -1]) {
          ctx.beginPath();
          for (let x = -standoff(); x < w / g.Re; x += 0.25) ctx[x === -standoff() ? 'moveTo' : 'lineTo'](X(x), Y(s * halfWidth(x)));
          ctx.stroke();
        }
        ctx.setLineDash([]);
        // field lines
        ctx.lineWidth = 1.2;
        for (const L of [2, 3, 4.5, 6.5, 8.5]) {
          for (const night of [false, true]) {
            ctx.strokeStyle = `rgba(110,170,255,${0.45 - L * 0.03})`;
            ctx.beginPath();
            fieldLine(L, night).forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](X(x), Y(y)));
            ctx.stroke();
          }
        }
        // open field lines from the polar caps into the tail
        for (const s of [1, -1])
          for (const k of [0, 1, 2]) {
            const lam = (78 + k * 4) * (Math.PI / 180);
            ctx.strokeStyle = 'rgba(110,170,255,0.18)';
            ctx.beginPath();
            ctx.moveTo(X(Math.cos(lam)), Y(-s * Math.sin(lam)));
            ctx.bezierCurveTo(X(2 + k), Y(-s * (3.5 + k)), X(8), Y(-s * (2.2 + k * 0.9)), X(w / g.Re), Y(-s * (1.6 + k * 0.8)));
            ctx.stroke();
          }
        // solar wind
        ctx.strokeStyle = 'rgba(255,200,120,0.8)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const yAt = (p, x) => {
          const b = halfWidth(x);
          return Math.sign(p.y0 || 1) * Math.sqrt(p.y0 * p.y0 + b * b);
        };
        for (const p of wind) {
          const x0 = p.x - 0.5;
          ctx.moveTo(X(x0), Y(yAt(p, x0)));
          ctx.lineTo(X(p.x), Y(yAt(p, p.x)));
        }
        ctx.stroke();
        // particles spiralling in along field lines
        for (const e of entering) {
          const lmax = Math.acos(Math.sqrt(1 / e.L));
          const lam = (e.north ? 1 : -1) * e.s * lmax;
          const r = e.L * Math.cos(lam) ** 2;
          const x = r * Math.cos(lam) * (1 + 0.06 * e.L * e.L * (0.5 + 0.06 * kp)), y = -r * Math.sin(lam);
          const wob = 0.35 * (1 - e.s) * Math.sin(e.s * 60 + e.ph);
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.arc(X(x) + wob * g.Re * Math.sin(lam), Y(y) + wob * g.Re * Math.cos(lam), 2.6, 0, TAU);
          ctx.fill();
        }
        // Earth
        const eg = ctx.createRadialGradient(X(-0.35), Y(-0.35), g.Re * 0.1, X(0), Y(0), g.Re);
        eg.addColorStop(0, '#4f9cff');
        eg.addColorStop(0.7, '#1f5bb0');
        eg.addColorStop(1, '#0d2a5c');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(X(0), Y(0), g.Re, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,10,0.5)';
        ctx.beginPath();
        ctx.arc(X(0), Y(0), g.Re, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        // auroral ovals at about 67° (wider when active)
        const edge = (ovalEdge(kp) * Math.PI) / 180;
        ctx.globalCompositeOperation = 'lighter';
        const pole = (76 * Math.PI) / 180;
        ctx.strokeStyle = `rgba(80,255,140,${clamp(0.35 + ovalGlow * 0.5, 0, 1)})`;
        ctx.lineWidth = 4 + kp * 0.6;
        ctx.shadowColor = '#50ff8c';
        ctx.shadowBlur = 14;
        // north and south, on the day (left) and night (right) sides of the limb
        for (const [a0, a1] of [[-edge, -pole], [-(Math.PI - edge), -(Math.PI - pole)], [edge, pole], [Math.PI - edge, Math.PI - pole]]) {
          ctx.beginPath();
          ctx.arc(X(0), Y(0), g.Re * 1.05, Math.min(a0, a1), Math.max(a0, a1));
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
        // labels
        const R = standoff();
        tag(ctx, 'magnetosphere', X(-R * 0.55), Y(-halfWidth(-R * 0.55) - 1.2), '#7fa5ff', { align: 'center', size: 10 });
        tag(ctx, 'auroral oval', X(0), Y(-1.9), C.teal, { align: 'center', size: 10 });
        if (!g.phone) tag(ctx, 'solar wind', X(-R - 3.5), Y(-4), C.amber, { align: 'center', size: 10 });
        if (boost > 0.3) tag(ctx, 'solar storm arriving!', w - 16, g.phone ? 56 : 84, C.red, { align: 'right' });
      },
      drawSky() {
        const { w, h } = api;
        const phone = w < 760;
        const kp = kpNow();
        const place = PLACES[params.place];
        // how far the viewer is from the oval's edge (degrees of latitude; ≤ 0 means under it)
        const dist = ovalEdge(kp) - place.lat;
        // the green lower parts show low in the north a few degrees away; the higher red tops from further
        const greenVis = clamp(1 - dist / 4, 0, 1), redVis = clamp(1 - dist / 10, 0, 1);
        const horizon = h * (phone ? 0.74 : 0.8);
        const sky = ctx.createLinearGradient(0, 0, 0, horizon);
        sky.addColorStop(0, '#02030a');
        sky.addColorStop(1, '#0b1226');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, horizon);
        for (let k = 0; k < 200; k++) {
          ctx.fillStyle = `rgba(230,235,255,${0.2 + ((k * 37) % 10) / 14})`;
          ctx.fillRect((((k * 7919) % 1000) / 1000) * w, (((k * 104729) % 997) / 997) * horizon, 1.2, 1.2);
        }
        // the curtains: lower when the oval is far to the north
        const lift = dist <= 0 ? 0 : clamp(dist / 8, 0, 1);
        const base0 = horizon - (horizon - 120) * (0.62 - 0.6 * lift);
        const bright = clamp(0.25 + kp * 0.09, 0, 1);
        // curtains are soft glows, so they are drawn at half resolution and scaled up
        const half = 0.5;
        glow ??= document.createElement('canvas');
        if (glow.width !== Math.ceil(w * half) || glow.height !== Math.ceil(h * half)) {
          glow.width = Math.ceil(w * half);
          glow.height = Math.ceil(h * half);
        }
        const gx = glow.getContext('2d');
        gx.setTransform(1, 0, 0, 1, 0, 0);
        gx.clearRect(0, 0, glow.width, glow.height);
        gx.setTransform(half, 0, 0, half, 0, 0);
        gx.globalCompositeOperation = 'lighter';
        // one vertical colour strip (bottom = lower edge of the curtain), stretched for every column
        const purple = clamp((kp - 5) / 4, 0, 1);
        const key = `${purple.toFixed(2)}|${greenVis.toFixed(2)}|${redVis.toFixed(2)}|${kp.toFixed(1)}`;
        if (key !== stripKey) {
          stripKey = key;
          strip ??= document.createElement('canvas');
          strip.width = 1;
          strip.height = 128;
          const sc = strip.getContext('2d');
          sc.clearRect(0, 0, 1, 128);
          const gr = sc.createLinearGradient(0, 128, 0, 0);
          gr.addColorStop(0, `rgba(190,90,255,${(0.2 + 0.7 * purple) * greenVis})`);
          gr.addColorStop(0.08, `rgba(80,255,140,${greenVis})`);
          gr.addColorStop(0.5, `rgba(60,230,120,${0.55 * greenVis})`);
          gr.addColorStop(0.75, `rgba(255,60,90,${(0.25 + 0.5 * clamp((kp - 3) / 6, 0, 1)) * redVis})`);
          gr.addColorStop(1, 'rgba(255,40,80,0)');
          sc.fillStyle = gr;
          sc.fillRect(0, 0, 1, 128);
        }
        const curtains = 3;
        for (let c = 0; c < curtains; c++) {
          const amp = 30 + c * 18, ph = c * 2.1;
          const heightPx = (horizon - 120) * (0.32 + 0.05 * kp) * (1 - lift * 0.5);
          for (let x = -10; x < w + 10; x += 3) {
            const base = base0 - c * 26 + Math.sin(x * 0.004 + t * 0.25 + ph) * amp + Math.sin(x * 0.011 - t * 0.4 + ph) * amp * 0.35;
            const ray = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(x * 0.09 + t * 1.7 + c * 5) * Math.sin(x * 0.023 - t * 0.6));
            const top = base - heightPx * (0.8 + 0.3 * Math.sin(x * 0.007 + ph));
            gx.globalAlpha = clamp(bright * ray * (0.55 - c * 0.12), 0, 1);
            gx.drawImage(strip, x, top - heightPx * 0.6, 3, base - top + heightPx * 0.6);
          }
        }
        gx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(glow, 0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
        // snowy ground and trees
        ctx.fillStyle = '#0a0f1c';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 6) ctx.lineTo(x, horizon - 6 * Math.sin(x * 0.01) - 4 * Math.sin(x * 0.031));
        ctx.lineTo(w, h);
        ctx.fill();
        ctx.fillStyle = '#050810';
        for (let k = 0; k < 26; k++) {
          const x = ((k * 7919) % 1000) / 1000 * w, s = 18 + ((k * 31) % 7) * 7;
          ctx.beginPath();
          ctx.moveTo(x, horizon - s * 2.2);
          ctx.lineTo(x - s * 0.5, horizon + 4);
          ctx.lineTo(x + s * 0.5, horizon + 4);
          ctx.fill();
        }
        text(ctx, phone ? 'Looking north' : `Looking north from ${place.name}`, 16, horizon + 26, { size: 12, color: C.dim });
        const vis = greenVis > 0.05 ? (dist <= 0 ? 'overhead' : 'low in the north') : redVis > 0.05 ? 'faint red glow on the horizon' : 'nothing tonight';
        tag(ctx, `aurora: ${vis}`, w - 16, phone ? 56 : 84, greenVis > 0.05 ? C.teal : redVis > 0.05 ? C.red : C.dim, { align: 'right' });
      },
      stats() {
        const kp = kpNow();
        const dist = ovalEdge(kp) - PLACES[params.place].lat;
        return [
          { label: 'Kp index', value: kp.toFixed(1), color: kp >= 5 ? C.red : C.teal },
          { label: 'Oval reaches down to', value: `${Math.round(ovalEdge(kp))}° latitude` },
          { label: 'Solar wind speed', value: `${Math.round(350 + kp * 60)} km/s`, color: C.amber },
          { label: 'Visible from', value: PLACES[params.place].name },
          { label: 'Can you see it?', value: dist <= 0 ? 'yes, overhead' : dist < 4 ? 'yes, to the north' : dist < 10 ? 'maybe, a red glow' : 'no', color: dist < 10 ? C.teal : C.dim },
        ];
      },
    };
  },
};
