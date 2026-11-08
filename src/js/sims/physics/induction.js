import { C, TAU, clamp, backdrop, drawGlow, tag, arrow, Series, rgba } from '../../core/util.js';

const MAG_L = 150, MAG_H = 40, POLE = MAG_L / 2 - 12;

/** Field lines of a bar magnet (two poles), traced once in the magnet's own frame. */
function traceFieldLines() {
  const lines = [];
  const field = (x, y) => {
    const dx1 = x - POLE, dy = y, dx2 = x + POLE;
    const r1 = Math.pow(dx1 * dx1 + dy * dy, 1.5) + 1e-6;
    const r2 = Math.pow(dx2 * dx2 + dy * dy, 1.5) + 1e-6;
    return [dx1 / r1 - dx2 / r2, dy / r1 - dy / r2];
  };
  for (let k = 0; k < 16; k++) {
    // equal-flux spacing: uniform in cos(angle) on each side
    const u = ((k % 8) + 0.5) / 8;
    const a = (k < 8 ? 1 : -1) * Math.acos(1 - 1.9 * u);
    let x = POLE + Math.cos(a) * 9, y = Math.sin(a) * 9;
    const pts = [[x, y]];
    for (let i = 0; i < 900; i++) {
      const [fx, fy] = field(x, y);
      const m = Math.hypot(fx, fy) || 1;
      x += (fx / m) * 5;
      y += (fy / m) * 5;
      pts.push([x, y]);
      if (Math.hypot(x + POLE, y) < 9 || Math.abs(x) > 1400 || Math.abs(y) > 900) break;
    }
    lines.push(pts);
  }
  return lines;
}

export default {
  id: 'induction',
  title: 'Electromagnetic Induction',
  category: 'physics',
  tagline: 'Move a magnet, make electricity. The trick behind every power station.',
  blurb:
    'In 1831 Michael Faraday found that a magnet moving near a coil of wire makes an electric current flow. A still magnet does nothing — only change counts. Nearly all the electricity you use is made this way, by spinning magnets past coils in generators.',
  ideas: [
    'A current flows only while the <b>magnetic flux</b> through the coil is changing.',
    'Faster motion and more turns of wire make a <b>bigger voltage</b>.',
    '<b>Lenz’s law</b>: the induced current makes its own field that opposes the change — the coil pushes back.',
    'Spinning a magnet makes current that reverses each half turn: <b>alternating current</b>.',
  ],
  hint: 'Drag the magnet in and out of the coil',
  thumbChapter: 2,
  thumbFrames: 140,
  params: [
    { key: 'mode', label: 'Motion', type: 'select', value: 'hand', options: [{ value: 'hand', label: 'By hand' }, { value: 'push', label: 'Push & pull' }, { value: 'gen', label: 'Generator' }] },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.2, max: 3, step: 0.05, value: 1, format: (v) => v.toFixed(2) + '×' },
    { key: 'turns', label: 'Turns of wire', type: 'range', min: 1, max: 12, step: 1, value: 6, instant: true },
    { key: 'flip', label: 'Flip the magnet', type: 'toggle', value: false },
    { key: 'lenz', label: 'Show induced field', type: 'toggle', value: false },
    { key: 'lines', label: 'Show field lines', type: 'toggle', value: true },
  ],
  story: [
    {
      title: 'A magnet and a coil',
      text: 'A bar magnet sits next to a coil of copper wire connected to a light bulb and a meter. The invisible magnetic field reaches out from the north pole and loops back to the south. Nothing flows. The bulb is dark.',
      params: { mode: 'hand', lenz: false, flip: false, turns: 6, speed: 1 },
      enter: (s) => s.park(),
      duration: 10,
    },
    {
      title: 'Motion makes current',
      text: 'Push the magnet into the coil and the needle swings — current flows and the bulb glows. Pull it out and the current flows the <b>other way</b>. Hold it still inside: nothing.',
      params: { mode: 'push', speed: 0.8, lenz: false, turns: 6 },
      duration: 14,
    },
    {
      title: 'Faster means more',
      text: 'What matters is how <b>fast the flux changes</b> — the amount of field threading the coil. Move the magnet faster and the voltage spikes higher. The bulb blazes.',
      formula: 'ε = −N · dΦ/dt',
      params: { mode: 'push', speed: 2.4, lenz: false, turns: 6 },
      duration: 13,
    },
    {
      title: 'The coil fights back',
      text: 'The induced current makes the coil itself an electromagnet whose field <b>opposes the change</b>. As the north pole approaches, the coil turns its own north pole to face it and repels it. That push-back is why generating electricity takes effort.',
      formula: 'Lenz’s law: the minus sign in ε = −N dΦ/dt',
      params: { mode: 'push', speed: 0.9, lenz: true, turns: 6 },
      duration: 16,
    },
    {
      title: 'More turns, more voltage',
      text: 'Each loop of wire adds its own share of voltage. Twelve turns give twice the voltage of six. Real generators use thousands.',
      params: { mode: 'push', turns: 12, lenz: false, speed: 1.4 },
      duration: 11,
    },
    {
      title: 'A generator',
      text: 'Now the magnet <b>spins</b>. The flux through the coil swings back and forth, so the current reverses every half turn: <b>alternating current</b>. Steam, wind or falling water spin the magnets in power stations exactly like this.',
      params: { mode: 'gen', speed: 1.2, turns: 8, lenz: false },
      duration: 16,
    },
    {
      title: 'Try it yourself',
      text: 'Grab the magnet and move it in and out of the coil. Try it fast, slow, flipped, and see which way the needle swings.',
      params: { mode: 'hand', speed: 1, turns: 8 },
      enter: (s) => s.park(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const lines = traceFieldLines();
    let mx = 0, ph = 0, rot = 0, prevFlux = null, emf = 0, flowS = 0, drag = null, needle = 0;
    const sFlux = new Series(300), sEmf = new Series(300);

    const geom = () => {
      const { w, h } = api;
      const cx = w * 0.56, cy = Math.max(230, h * 0.43);
      const a = Math.min(68, h * 0.12);
      const n = Math.round(params.turns);
      const sp = 15;
      const len = n * sp;
      return { cx, cy, a, n, sp, len, x0: cx - len / 2 };
    };
    const outside = () => {
      const g = geom();
      return g.x0 - MAG_L / 2 - 90 - g.cx;
    };

    function flux(centerRel, dir, n, sp, a, len) {
      // centerRel: magnet centre relative to coil centre (along axis)
      let F = 0;
      const poles = [[centerRel + dir * POLE, 1], [centerRel - dir * POLE, -1]];
      for (let i = 0; i < n; i++) {
        const xi = -len / 2 + (i + 0.5) * sp;
        for (const [p, q] of poles) {
          const d = xi - p;
          F += q * Math.sign(d) * 0.5 * (1 - Math.abs(d) / Math.hypot(d, a));
        }
      }
      return F;
    }

    function park() {
      mx = outside();
      ph = 0;
      prevFlux = null;
    }
    park();

    return {
      park,
      reset() {
        park();
        sFlux.clear();
        sEmf.clear();
      },
      resize() {
        if (params.mode === 'hand') mx = clamp(mx, outside() - 200, api.w);
      },
      pointerDown(p) {
        const g = geom();
        if (params.mode !== 'hand') api.runner.set('mode', 'hand');
        if (Math.abs(p.x - (g.cx + mx)) < MAG_L / 2 + 30 && Math.abs(p.y - g.cy) < 60) drag = { off: p.x - (g.cx + mx) };
        else drag = { off: 0 };
      },
      pointerMove(p) {
        if (!drag || !p.down) return;
        const g = geom();
        mx = clamp(p.x - drag.off - g.cx, -g.cx + 40, api.w - g.cx - 40);
      },
      pointerUp() {
        drag = null;
      },
      update(dt) {
        const g = geom();
        const dir = params.flip ? -1 : 1;
        let F;
        if (params.mode === 'push') {
          ph += dt * params.speed * 1.7;
          const xo = outside(), xi = 0;
          mx = xo + (xi - xo) * (0.5 - 0.5 * Math.cos(ph));
          F = flux(mx, dir, g.n, g.sp, g.a, g.len);
        } else if (params.mode === 'gen') {
          rot += dt * params.speed * 3;
          mx = g.x0 - MAG_L / 2 - 26 - g.cx;
          F = flux(mx, dir, g.n, g.sp, g.a, g.len) * Math.cos(rot);
        } else {
          F = flux(mx, dir, g.n, g.sp, g.a, g.len);
        }
        if (params.mode !== 'gen') {
          rot -= Math.round(rot / TAU) * TAU;
          rot *= Math.max(0, 1 - dt * 6);
        }
        const raw = prevFlux === null || dt <= 0 ? 0 : -(F - prevFlux) / dt;
        prevFlux = F;
        emf += (raw - emf) * Math.min(1, dt * 14);
        flowS += emf * dt * 6;
        needle += (clamp(emf / 22, -1.3, 1.3) - needle) * Math.min(1, dt * 10);
        if (api.frame % 2 === 0) {
          sFlux.push(F);
          sEmf.push(emf);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0d1226' });
        const g = geom();
        const dir = params.flip ? -1 : 1;
        const MX = g.cx + mx, MY = g.cy;
        const ang = rot;
        const glow = clamp(Math.abs(emf) / 26, 0, 1.4);

        // field lines (animated dashes flow from N to S)
        if (params.lines) {
          ctx.save();
          ctx.translate(MX, MY);
          ctx.rotate(ang);
          ctx.scale(dir, 1);
          ctx.strokeStyle = 'rgba(167,139,250,0.42)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([6, 9]);
          ctx.lineDashOffset = -api.time * 30;
          for (const pts of lines) {
            ctx.beginPath();
            for (let i = 0; i < pts.length; i++) ctx[i ? 'lineTo' : 'moveTo'](pts[i][0], pts[i][1]);
            ctx.stroke();
          }
          ctx.restore();
          ctx.setLineDash([]);
        }

        // circuit: wires up to a bulb and a meter
        const top = Math.max(110, g.cy - g.a - 120);
        const left = g.x0 - 6, right = g.x0 + g.len + 6;
        const bulbX = g.cx - 60, meterX = g.cx + 70;
        const wire = [
          [left, g.cy - g.a], [left, top], [bulbX - 16, top], [bulbX + 16, top], [meterX - 34, top], [meterX + 34, top], [right, top], [right, g.cy - g.a],
        ];
        ctx.strokeStyle = '#b87333';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        wire.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y));
        ctx.stroke();

        // coil: back halves, then magnet, then front halves
        const helix = (front) => {
          ctx.lineWidth = 3.2;
          ctx.strokeStyle = front ? '#e09a5a' : '#6e4422';
          ctx.beginPath();
          for (let i = 0; i < g.n; i++) {
            const x = g.x0 + i * g.sp;
            for (let k = 0; k <= 24; k++) {
              const th = (k / 24) * TAU;
              const z = Math.sin(th);
              const px = x + (k / 24) * g.sp + z * 7, py = g.cy - Math.cos(th) * g.a;
              const isFront = z > 0;
              if (isFront === front) ctx[k === 0 || (k > 0 && (Math.sin(((k - 1) / 24) * TAU) > 0) !== front) ? 'moveTo' : 'lineTo'](px, py);
            }
          }
          ctx.stroke();
        };
        helix(false);

        // magnet
        ctx.save();
        ctx.translate(MX, MY);
        ctx.rotate(ang);
        ctx.scale(dir, 1);
        const half = (x, col1, col2, label) => {
          const gr = ctx.createLinearGradient(0, -MAG_H / 2, 0, MAG_H / 2);
          gr.addColorStop(0, col1);
          gr.addColorStop(1, col2);
          ctx.fillStyle = gr;
          ctx.fillRect(x, -MAG_H / 2, MAG_L / 2, MAG_H);
          ctx.save();
          ctx.scale(dir, 1);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.font = '700 17px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, (x + MAG_L / 4) * dir, 1);
          ctx.restore();
        };
        half(0, '#ff6b81', '#a3162f', 'N');
        half(-MAG_L / 2, '#7aa2ff', '#1f3e9c', 'S');
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-MAG_L / 2, -MAG_H / 2, MAG_L, MAG_H);
        ctx.restore();

        helix(true);

        // moving charges along the coil + wires
        const path = [];
        path.push([right, top], [right, g.cy - g.a]);
        for (let i = g.n - 1; i >= 0; i--) {
          const x = g.x0 + i * g.sp;
          for (let k = 24; k >= 0; k -= 2) {
            const th = (k / 24) * TAU;
            path.push([x + (k / 24) * g.sp + Math.sin(th) * 7, g.cy - Math.cos(th) * g.a]);
          }
        }
        path.push([left, g.cy - g.a], [left, top], [right, top]);
        const segs = [];
        let total = 0;
        for (let i = 1; i < path.length; i++) {
          const L = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
          segs.push(L);
          total += L;
        }
        if (glow > 0.03) {
          ctx.fillStyle = rgba(C.cyan, Math.min(1, glow * 1.4));
          const gap = 26;
          let off = ((flowS % gap) + gap) % gap;
          let si = 0, acc = 0;
          for (let d = off; d < total; d += gap) {
            while (si < segs.length - 1 && acc + segs[si] < d) acc += segs[si++];
            const f = (d - acc) / (segs[si] || 1);
            const x = path[si][0] + (path[si + 1][0] - path[si][0]) * f;
            const y = path[si][1] + (path[si + 1][1] - path[si][1]) * f;
            ctx.beginPath();
            ctx.arc(x, y, 2.4, 0, TAU);
            ctx.fill();
          }
        }

        // induced field (Lenz)
        if (params.lenz && glow > 0.05) {
          const d = Math.sign(emf); // induced B direction along +x when emf>0 (opposes -dΦ)
          const al = Math.min(1, glow * 1.3);
          ctx.globalAlpha = al;
          arrow(ctx, g.cx - d * (g.len / 2 + 30), g.cy + g.a + 34, g.cx + d * (g.len / 2 + 30), g.cy + g.a + 34, C.amber, 3, 12);
          tag(ctx, 'induced field', g.cx, g.cy + g.a + 58, C.amber, { align: 'center', size: 10 });
          tag(ctx, d > 0 ? 'N' : 'S', right + 22, g.cy, d > 0 ? '#ff6b81' : '#7aa2ff', { align: 'center', size: 13 });
          tag(ctx, d > 0 ? 'S' : 'N', left - 22, g.cy, d > 0 ? '#7aa2ff' : '#ff6b81', { align: 'center', size: 13 });
          ctx.globalAlpha = 1;
        }

        // bulb
        ctx.globalCompositeOperation = 'lighter';
        if (glow > 0.02) drawGlow(ctx, bulbX, top - 4, 30 + glow * 70, '#ffcf6b', 0.12);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = glow > 0.02 ? `rgba(255,${200 + 55 * Math.min(1, glow)},${120 + 100 * Math.min(1, glow)},${0.35 + 0.6 * Math.min(1, glow)})` : 'rgba(200,210,240,0.12)';
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bulbX, top - 16, 15, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#6f7690';
        ctx.fillRect(bulbX - 7, top - 3, 14, 7);

        // meter
        ctx.fillStyle = 'rgba(10,14,30,0.92)';
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(meterX - 34, top - 44, 68, 50, 8) : ctx.rect(meterX - 34, top - 44, 68, 50);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(233,237,247,0.35)';
        ctx.lineWidth = 1;
        for (let k = -4; k <= 4; k++) {
          const a = -Math.PI / 2 + k * 0.3;
          ctx.beginPath();
          ctx.moveTo(meterX + Math.cos(a) * 30, top + 2 + Math.sin(a) * 30);
          ctx.lineTo(meterX + Math.cos(a) * (k === 0 ? 22 : 26), top + 2 + Math.sin(a) * (k === 0 ? 22 : 26));
          ctx.stroke();
        }
        const na = -Math.PI / 2 + needle;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(meterX, top + 2);
        ctx.lineTo(meterX + Math.cos(na) * 30, top + 2 + Math.sin(na) * 30);
        ctx.stroke();
        if (!api.thumbnail) {
          tag(ctx, 'meter', meterX, top + 20, C.dim, { align: 'center', size: 9 });
          tag(ctx, `${Math.round(params.turns)} turns`, g.cx, g.cy - g.a - 18, '#e09a5a', { align: 'center', size: 10 });
        }
      },
      stats() {
        return [
          { label: 'Voltage (relative)', value: (emf / 10).toFixed(2), color: Math.abs(emf) > 3 ? C.cyan : undefined },
          { label: 'Flux through coil', value: (prevFlux ?? 0).toFixed(2) },
          { label: 'Current direction', value: Math.abs(emf) < 1 ? 'none' : emf > 0 ? 'clockwise ↻' : 'counter-clockwise ↺' },
          { label: 'Turns', value: String(Math.round(params.turns)) },
        ];
      },
      charts() {
        return [
          { title: 'Magnetic flux Φ through the coil', series: [{ data: sFlux.data, color: C.violet }], length: 300 },
          { title: 'Induced voltage ε = −N dΦ/dt', series: [{ data: sEmf.data, color: C.cyan }], length: 300 },
        ];
      },
    };
  },
};
