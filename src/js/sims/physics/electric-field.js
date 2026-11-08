import { C, CMAPS, clamp, drawGlow, rand, tag, text, TAU } from '../../core/util.js';

const PRESETS = {
  single: (w, h) => [{ x: w * 0.5, y: h * 0.45, q: 1 }],
  dipole: (w, h) => [{ x: w * 0.36, y: h * 0.45, q: 1 }, { x: w * 0.64, y: h * 0.45, q: -1 }],
  like: (w, h) => [{ x: w * 0.38, y: h * 0.45, q: 1 }, { x: w * 0.62, y: h * 0.45, q: 1 }],
  quad: (w, h) => [
    { x: w * 0.4, y: h * 0.32, q: 1 }, { x: w * 0.6, y: h * 0.32, q: -1 },
    { x: w * 0.4, y: h * 0.6, q: -1 }, { x: w * 0.6, y: h * 0.6, q: 1 },
  ],
  capacitor: (w, h) => {
    const out = [];
    for (let i = 0; i < 9; i++) {
      const x = w * 0.3 + (w * 0.4 * i) / 8;
      out.push({ x, y: h * 0.3, q: 0.55 }, { x, y: h * 0.62, q: -0.55 });
    }
    return out;
  },
};

export default {
  id: 'electric-field',
  title: 'Electric Fields',
  category: 'physics',
  tagline: 'Drag charges around and watch invisible lines of force flow between them.',
  ages: ['14-16', '16+'],
  topics: ['Electricity', 'Fields'],
  blurb:
    'Every charge reaches out through space with an electric field. Here, thousands of tracer particles drift along the field so you can see its shape — streaming out of positive charges and into negative ones. Background colour shows the electric potential: the “height” a charge would roll down.',
  ideas: [
    'Field lines start on <b>positive</b> charges and end on <b>negative</b> charges.',
    'Field strength falls off with the square of distance: E = kq/r².',
    'Equipotential lines (contours) are always perpendicular to the field.',
    'Between two flat, oppositely charged plates the field is nearly uniform — the idea behind capacitors.',
  ],
  hint: 'Drag charges · click empty space to add + · right-click or Shift-click to add −',
  params: [
    {
      key: 'preset', label: 'Arrangement', type: 'select', value: 'single',
      options: [
        { value: 'single', label: 'Single' },
        { value: 'dipole', label: 'Dipole' },
        { value: 'like', label: 'Like pair' },
        { value: 'quad', label: 'Quadrupole' },
        { value: 'capacitor', label: 'Capacitor' },
      ],
    },
    { key: 'tracers', label: 'Field tracers', type: 'range', min: 200, max: 3000, step: 50, value: 1400 },
    { key: 'potential', label: 'Show potential', type: 'toggle', value: false },
    { key: 'contours', label: 'Equipotential lines', type: 'toggle', value: false },
    { key: 'clear', label: 'Remove all charges', type: 'button', action: (s) => s.setCharges([]) },
  ],
  story: [
    {
      title: 'A lone charge',
      text: 'A single positive charge. The streaming particles follow its <b>electric field</b>, pointing straight outward in every direction and thinning as they spread.',
      formula: 'E = k q / r<sup>2</sup>',
      params: { preset: 'single', potential: false, contours: false },
      duration: 10,
    },
    {
      title: 'Opposites attract',
      text: 'Add a negative charge and the field becomes a <b>dipole</b>. Lines leave the positive charge and curve round to end on the negative one.',
      params: { preset: 'dipole', potential: false },
      duration: 12,
    },
    {
      title: 'Like charges repel',
      text: 'Two positive charges push their field lines apart. Halfway between them is a <b>null point</b> where the fields cancel exactly — notice the tracers stall there.',
      params: { preset: 'like', potential: false },
      duration: 12,
    },
    {
      title: 'The potential landscape',
      text: 'Colour now shows the <b>electric potential</b>: hills around positive charges, valleys around negative ones. Contours mark equal potential, and the field always crosses them at right angles.',
      formula: 'E = −∇V',
      params: { preset: 'dipole', potential: true, contours: true },
      duration: 14,
    },
    {
      title: 'A capacitor',
      text: 'Two rows of opposite charges approximate a pair of plates. Between them the field is almost <b>uniform</b>: evenly spaced, parallel lines. This stores energy in every phone and camera flash.',
      params: { preset: 'capacitor', potential: true, contours: false },
      duration: 13,
    },
    {
      title: 'Build your own',
      text: 'Drag charges around. Click to add a positive charge, right-click (or Shift-click) for a negative one.',
      params: { preset: 'quad', potential: true, contours: true },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let charges = [], tracers = [], dirty = true, drag = null, moved = false;
    const GW = 160, GH = 100;
    const pot = new Float32Array(GW * GH);
    const off = document.createElement('canvas');
    off.width = GW;
    off.height = GH;
    const octx = off.getContext('2d');
    const img = octx.createImageData(GW, GH);

    const field = (x, y, out) => {
      let ex = 0, ey = 0;
      for (const c of charges) {
        const dx = x - c.x, dy = y - c.y;
        const r2 = dx * dx + dy * dy + 60;
        const inv = c.q / (r2 * Math.sqrt(r2));
        ex += dx * inv;
        ey += dy * inv;
      }
      out[0] = ex * 6000;
      out[1] = ey * 6000;
    };
    const potential = (x, y) => {
      let v = 0;
      for (const c of charges) v += c.q / Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2 + 60);
      return v;
    };
    function spawn(tr) {
      const pos = charges.filter((c) => c.q > 0);
      if (pos.length && Math.random() < 0.55) {
        const c = pos[Math.floor(Math.random() * pos.length)];
        const a = rand(TAU);
        tr.x = c.x + Math.cos(a) * 14;
        tr.y = c.y + Math.sin(a) * 14;
      } else {
        tr.x = rand(api.w);
        tr.y = rand(api.h);
      }
      tr.life = rand(1.5, 5);
      tr.hist = [tr.x, tr.y];
      return tr;
    }
    function setCharges(list) {
      charges = list.map((c) => ({ ...c }));
      dirty = true;
      tracers.forEach(spawn);
    }
    function ensureTracers() {
      const n = Math.round(params.tracers);
      while (tracers.length < n) tracers.push(spawn({}));
      if (tracers.length > n) tracers.length = n;
    }
    const at = (p) => charges.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < 22);
    const E = [0, 0];

    return {
      setCharges,
      resize(w, h) {
        if (!this.lw) setCharges(PRESETS[params.preset](w, h));
        else {
          for (const c of charges) {
            c.x *= w / this.lw;
            c.y *= h / this.lh;
          }
          dirty = true;
        }
        this.lw = w;
        this.lh = h;
      },
      reset() {
        setCharges(PRESETS[params.preset](api.w, api.h));
      },
      onParam(k, v) {
        if (k === 'preset') setCharges(PRESETS[v](api.w, api.h));
      },
      pointerDown(p) {
        drag = at(p);
        moved = false;
        if (!drag) {
          const q = p.button === 2 || p.shift ? -1 : 1;
          charges.push({ x: p.x, y: p.y, q });
          drag = charges[charges.length - 1];
          dirty = true;
        }
      },
      pointerMove(p) {
        if (drag) {
          drag.x = p.x;
          drag.y = p.y;
          moved = true;
          dirty = true;
        }
      },
      pointerUp() {
        drag = null;
      },
      update(dt) {
        ensureTracers();
        for (const tr of tracers) {
          field(tr.x, tr.y, E);
          const m = Math.hypot(E[0], E[1]) + 1e-9;
          const sp = 30 + 260 * clamp(m / 30, 0, 1);
          tr.x += (E[0] / m) * sp * dt;
          tr.y += (E[1] / m) * sp * dt;
          tr.m = m;
          tr.life -= dt;
          tr.hist.push(tr.x, tr.y);
          if (tr.hist.length > 14) tr.hist.splice(0, 2);
          let sink = false;
          for (const c of charges) if (c.q < 0 && Math.hypot(c.x - tr.x, c.y - tr.y) < 12) sink = true;
          if (sink || tr.life < 0 || tr.x < -20 || tr.y < -20 || tr.x > api.w + 20 || tr.y > api.h + 20) spawn(tr);
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#04050c';
        ctx.fillRect(0, 0, w, h);
        if (params.potential || params.contours) {
          if (dirty) {
            for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) pot[j * GW + i] = potential(((i + 0.5) / GW) * w, ((j + 0.5) / GH) * h);
            dirty = false;
          }
          const d = img.data, lut = CMAPS.diverge;
          for (let k = 0; k < GW * GH; k++) {
            const v = pot[k] * 18;
            let li = (clamp(Math.tanh(v) * 0.5 + 0.5, 0, 1) * 255) | 0;
            let r = 0, g = 0, b = 0, a = 0;
            if (params.potential) {
              r = lut[li * 3]; g = lut[li * 3 + 1]; b = lut[li * 3 + 2]; a = 150;
            }
            if (params.contours) {
              const f = Math.abs(((v * 3) % 1 + 1) % 1 - 0.5);
              if (f > 0.44) {
                r = Math.max(r, 230); g = Math.max(g, 236); b = Math.max(b, 255); a = Math.max(a, 120);
              }
            }
            d[k * 4] = r; d[k * 4 + 1] = g; d[k * 4 + 2] = b; d[k * 4 + 3] = a;
          }
          octx.putImageData(img, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(off, 0, 0, w, h);
        } else dirty = true;

        // tracers
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.3;
        const NB = 8;
        const bk = Array.from({ length: NB }, () => []);
        for (const tr of tracers) if (tr.hist.length >= 4) bk[Math.min(NB - 1, Math.floor(clamp(tr.m / 40, 0, 0.999) * NB))].push(tr.hist);
        bk.forEach((list, k) => {
          if (!list.length) return;
          const s = (k + 0.5) / NB;
          ctx.strokeStyle = `hsla(${200 - s * 170},95%,${55 + s * 20}%,${0.25 + s * 0.5})`;
          ctx.beginPath();
          for (const hst of list) {
            ctx.moveTo(hst[0], hst[1]);
            for (let i = 2; i < hst.length; i += 2) ctx.lineTo(hst[i], hst[i + 1]);
          }
          ctx.stroke();
        });
        // charges
        for (const c of charges) {
          const col = c.q > 0 ? '#ff6a3d' : '#3d8bff';
          drawGlow(ctx, c.x, c.y, 46 * Math.sqrt(Math.abs(c.q)), col, 0.25);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (const c of charges) {
          const r = 12 * Math.sqrt(Math.abs(c.q)) + 2;
          ctx.fillStyle = c.q > 0 ? '#ff7a4d' : '#4d94ff';
          ctx.beginPath();
          ctx.arc(c.x, c.y, r, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          text(ctx, c.q > 0 ? '+' : '−', c.x, c.y + 1, { size: r * 1.3, weight: 700, align: 'center', shadow: false, color: '#fff' });
        }
        if (params.preset === 'like' && charges.length === 2 && !api.thumbnail && !moved) {
          tag(ctx, 'null point', (charges[0].x + charges[1].x) / 2, charges[0].y - 40, C.amber, { align: 'center' });
        }
      },
      stats() {
        const pos = charges.filter((c) => c.q > 0).length;
        const net = charges.reduce((s, c) => s + c.q, 0);
        let e = '—';
        const p = api.pointer;
        if (p.inside) {
          field(p.x, p.y, E);
          e = Math.hypot(E[0], E[1]).toFixed(1);
        }
        return [
          { label: 'Positive charges', value: String(pos), color: C.orange },
          { label: 'Negative charges', value: String(charges.length - pos), color: C.blue },
          { label: 'Net charge', value: net.toFixed(1) },
          { label: '|E| at cursor', value: e },
        ];
      },
    };
  },
};
