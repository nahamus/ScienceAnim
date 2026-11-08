import { C, Series, backdrop, drawGlow, roundRect, tag, text, TAU } from '../../core/util.js';

export default {
  id: 'relativity',
  title: 'Special Relativity: Time Dilation',
  category: 'physics',
  tagline: 'Why moving clocks tick slower — explained with nothing but a bouncing beam of light.',
  ages: ['16+'],
  topics: ['Relativity'],
  blurb:
    'Einstein started from one strange fact: everyone measures the same speed of light, no matter how fast they move. Follow that idea with a “light clock” — a photon bouncing between two mirrors — and time itself has to stretch.',
  ideas: [
    'The speed of light is the same for every observer.',
    'Seen from outside, a moving light clock’s photon travels a longer, diagonal path — so each tick takes longer.',
    'The slow-down factor is γ = 1/√(1 − v²/c²); it is tiny at everyday speeds and huge near light speed.',
    'Moving objects are also shortened along their direction of motion (length contraction).',
  ],
  thumbChapter: 1,
  params: [
    { key: 'beta', label: 'Ship speed', type: 'range', min: 0, max: 0.99, step: 0.01, value: 0, format: (v) => `${v.toFixed(2)} c` },
    { key: 'contract', label: 'Show length contraction', type: 'toggle', value: false },
    { key: 'path', label: 'Show photon path', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'A clock made of light',
      text: 'Two mirrors, one photon bouncing between them. Each round trip is one <b>tick</b>. Both clocks are identical; for now, both are at rest and tick in perfect sync.',
      params: { beta: 0, contract: false, path: true },
      duration: 10,
    },
    {
      title: 'Set one in motion',
      text: 'The lower clock rides a spaceship at 60% of light speed. From where we stand, its photon must travel a <em>longer diagonal path</em> to reach the far mirror. But light can’t go faster than light…',
      params: { beta: 0.6 },
      duration: 14,
    },
    {
      title: 'So time slows down',
      text: '…so each tick on the ship <b>takes longer</b>. Compare the tick counters: the moving clock falls behind by exactly the factor γ. Nobody on board notices anything — for them, our clock is the slow one.',
      formula: 'Δt′ = γ Δt,   γ = 1 / √(1 − v²/c²)',
      params: { beta: 0.6 },
      duration: 14,
    },
    {
      title: 'Close to light speed',
      text: 'At 95% of light speed, γ ≈ 3.2: the ship’s clock ticks once for every three of ours. This is measured every day — fast muons from cosmic rays live long enough to reach the ground only because their clocks run slow.',
      params: { beta: 0.95 },
      duration: 14,
    },
    {
      title: 'Shrinking lengths',
      text: 'Relativity has a twin effect: the moving ship is also <b>shortened</b> along its direction of travel by the same factor γ.',
      formula: 'L = L<sub>0</sub> / γ',
      params: { beta: 0.9, contract: true },
      duration: 12,
    },
    {
      title: 'Explore',
      text: 'Slide the ship’s speed and watch the gap between the clocks open up. Notice how little happens until you get above about half the speed of light.',
      params: { beta: 0.8, contract: true },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let H = 120, Ytop = 0, Ybot = 0, cS = 260, ship = 0, ph1 = 0, ph2 = 0, ticks1 = 0, ticks2 = 0, path = [], t1 = new Series(300), t2 = new Series(300);
    let stars = [];
    const gamma = () => 1 / Math.sqrt(1 - params.beta ** 2);

    function reset() {
      ph1 = ph2 = 0;
      ticks1 = ticks2 = 0;
      ship = api.w * 0.5;
      path = [];
      t1.clear();
      t2.clear();
    }
    return {
      resize(w, h) {
        H = Math.min(140, h * 0.2);
        Ytop = Math.max(80, h * 0.12);
        Ybot = Ytop + H + 90;
        cS = H * 2.2;
        stars = Array.from({ length: 120 }, () => ({ x: Math.random() * w, y: Math.random() * h, s: Math.random() }));
        reset();
      },
      reset,
      onParam(k) {
        if (k === 'beta') path = [];
      },
      update(dt) {
        const { w } = api;
        const b = params.beta;
        const vx = b * cS;
        // stationary clock: phase advances at c/(2H) round trips per second
        ph1 += (dt * cS) / (2 * H);
        // moving clock: vertical speed c·√(1−β²)
        ph2 += (dt * cS * Math.sqrt(1 - b * b)) / (2 * H);
        while (ph1 >= 1) { ph1 -= 1; ticks1++; }
        while (ph2 >= 1) { ph2 -= 1; ticks2++; }
        ship += vx * dt;
        if (ship > w + 80) {
          ship = -80;
          path = [];
        }
        const y = Ybot + H * (1 - Math.abs(1 - 2 * ph2));
        path.push(ship, y);
        if (path.length > 4000) path.splice(0, 2);
        for (const s of stars) {
          s.x -= vx * dt * 0.05 * (0.3 + s.s);
          if (s.x < 0) s.x += w;
        }
        if (api.frame % 3 === 0) {
          t1.push(ticks1 + ph1);
          t2.push(ticks2 + ph2);
        }
      },
      draw() {
        const { w } = api;
        backdrop(ctx, w, api.h, { grid: false });
        for (const s of stars) {
          ctx.fillStyle = `rgba(200,215,255,${0.15 + s.s * 0.4})`;
          ctx.fillRect(s.x, s.y, 1.5, 1.5);
        }
        const g = gamma();
        const clock = (cx, y0, ph, label, ticks, color, squash = 1) => {
          const mw = 70 * squash;
          ctx.fillStyle = '#c9d4f5';
          roundRect(ctx, cx - mw / 2, y0 - 6, mw, 6, 3);
          ctx.fill();
          roundRect(ctx, cx - mw / 2, y0 + H, mw, 6, 3);
          ctx.fill();
          ctx.strokeStyle = 'rgba(200,215,255,0.18)';
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.moveTo(cx - mw / 2, y0);
          ctx.lineTo(cx - mw / 2, y0 + H);
          ctx.moveTo(cx + mw / 2, y0);
          ctx.lineTo(cx + mw / 2, y0 + H);
          ctx.stroke();
          ctx.setLineDash([]);
          const py = y0 + H * (1 - Math.abs(1 - 2 * ph));
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, cx, py, 22, color);
          ctx.globalCompositeOperation = 'source-over';
          // dial
          const dx = cx + mw / 2 + 50 * Math.max(squash, 0.6), dy = y0 + H / 2;
          ctx.strokeStyle = 'rgba(200,215,255,0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(dx, dy, 26, 0, TAU);
          ctx.stroke();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(dx, dy, 26, -Math.PI / 2, -Math.PI / 2 + ph * TAU);
          ctx.stroke();
          text(ctx, String(ticks), dx, dy, { align: 'center', mono: true, size: 15, weight: 600 });
          if (!api.thumbnail) tag(ctx, label, cx, y0 - 26, color, { align: 'center' });
        };
        clock(w * 0.5, Ytop, ph1, 'clock at rest', ticks1, '#38d6f5');

        // ship hull
        const squash = params.contract ? 1 / g : 1;
        const sw = 180 * squash, sh = H + 54;
        ctx.save();
        ctx.translate(ship, Ybot + H / 2);
        ctx.fillStyle = 'rgba(91,140,255,0.08)';
        ctx.strokeStyle = 'rgba(140,170,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-sw / 2, -sh / 2);
        ctx.lineTo(sw / 2 - 20 * squash, -sh / 2);
        ctx.quadraticCurveTo(sw / 2 + 30 * squash, 0, sw / 2 - 20 * squash, sh / 2);
        ctx.lineTo(-sw / 2, sh / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (params.beta > 0.05) {
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, -sw / 2 - 10, 0, 30 + params.beta * 30, '#ff8a3d');
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();
        // the photon's actual zig-zag path in our frame
        if (params.path && path.length > 4) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(255,181,71,0.75)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(path[0], path[1]);
          for (let i = 2; i < path.length; i += 2) ctx.lineTo(path[i], path[i + 1]);
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
        clock(ship, Ybot, ph2, `moving at ${params.beta.toFixed(2)}c`, ticks2, '#ffb547', squash);
        if (!api.thumbnail) {
          text(ctx, `γ = ${g.toFixed(3)}`, 28, Ytop + H / 2, { mono: true, size: 20, weight: 600, color: C.amber });
        }
      },
      stats() {
        const g = gamma();
        return [
          { label: 'Speed', value: params.beta.toFixed(2) + ' c' },
          { label: 'Lorentz factor γ', value: g.toFixed(3), color: C.amber },
          { label: 'Ticks at rest', value: String(ticks1) },
          { label: 'Ticks on ship', value: String(ticks2) },
        ];
      },
      charts() {
        return [
          {
            title: 'Accumulated ticks',
            series: [
              { data: t1.data, color: '#38d6f5', label: 'rest', fill: false },
              { data: t2.data, color: '#ffb547', label: 'ship', fill: false },
            ],
            min: 0,
            length: 300,
          },
        ];
      },
    };
  },
};
