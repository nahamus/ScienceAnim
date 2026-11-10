import { C, backdrop, drawGlow, tag, text, rgba } from '../../core/util.js';

const FN = {
  and: (a, b) => a & b,
  or: (a, b) => a | b,
  xor: (a, b) => a ^ b,
  nand: (a, b) => 1 - (a & b),
  not: (a) => 1 - a,
};
const ON = '#ffb547', OFF = 'rgba(160,175,215,0.35)';

export default {
  id: 'logic-gates',
  title: 'Logic Gates: How Computers Think',
  category: 'tech',
  tagline: 'Wire a few on/off switches together cleverly and they can add numbers.',
  ages: ['11-14', '14-16'],
  topics: ['Logic', 'Computer systems'],
  blurb:
    'Inside every chip, transistors are wired into logic gates — tiny circuits that take 1s and 0s in and give a 1 or 0 out according to a simple rule. Combine a handful and you can add two bits. Chain those together and you can add any numbers. Billions of gates doing this, billions of times a second, is a computer.',
  ideas: [
    '<b>AND</b> outputs 1 only if both inputs are 1; <b>OR</b> if either is; <b>NOT</b> flips its input.',
    '<b>XOR</b> outputs 1 if the inputs differ — perfect for adding bits.',
    'A <b>half adder</b> (XOR + AND) adds two bits: 1 + 1 = 10 in binary (sum 0, carry 1).',
    'Chained <b>full adders</b> pass carries along like long addition on paper.',
  ],
  hint: 'Click an input to flip it',
  thumbChapter: 3,
  thumbFrames: 120,
  params: [
    { key: 'mode', label: 'Circuit', type: 'select', value: 'gates', options: [{ value: 'gates', label: 'Basic gates' }, { value: 'half', label: 'Half adder' }, { value: 'adder', label: '4-bit adder' }] },
    { key: 'A', label: 'Number A (adder)', type: 'range', min: 0, max: 15, step: 1, value: 11, instant: true },
    { key: 'B', label: 'Number B (adder)', type: 'range', min: 0, max: 15, step: 1, value: 6, instant: true },
    { key: 'auto', label: 'Cycle inputs automatically', type: 'toggle', value: true },
    { key: 'speed', label: 'Gate speed', type: 'range', min: 0.2, max: 4, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
  ],
  story: [
    {
      title: 'Gates',
      text: 'Two input switches, A and B, feed five logic gates. Watch the lamps as the inputs cycle through every combination. <b>AND</b> lights only when both inputs are on; <b>OR</b> when at least one is.',
      params: { mode: 'gates', auto: true, speed: 1 },
      duration: 14,
    },
    {
      title: 'XOR, NOT and NAND',
      text: '<b>XOR</b> (exclusive or) lights when the inputs differ. <b>NOT</b> just flips A. <b>NAND</b> is AND flipped — and remarkably, every other gate, and so every computer, can be built from NAND gates alone.',
      params: { mode: 'gates', auto: true },
      duration: 14,
    },
    {
      title: 'Adding two bits',
      text: 'Binary addition has four cases: 0+0=0, 0+1=1, 1+0=1 and 1+1=<b>10</b> (zero, carry one). Notice the sum is exactly XOR and the carry is exactly AND. Two gates make a <b>half adder</b>.',
      formula: 'sum = A ⊕ B,    carry = A · B',
      params: { mode: 'half', auto: true },
      duration: 14,
    },
    {
      title: 'Chaining adders',
      text: 'Four full adders in a row add two 4-bit numbers, here 11 + 6. Each passes its carry to the next, just like carrying in long addition. Watch the carries <b>ripple</b> from right to left as the gates settle, until the answer reads 17.',
      formula: '1011 + 0110 = 1 0001',
      params: { mode: 'adder', A: 11, B: 6, auto: false, speed: 0.6 },
      enter: (s) => s.settleFromZero(),
      duration: 16,
    },
    {
      title: 'Billions of them',
      text: 'The arithmetic unit at the heart of a processor is built like this, only 64 bits wide and with clever tricks to avoid waiting for carries. A modern phone chip holds over <b>15 billion</b> transistors switching billions of times a second.',
      params: { mode: 'adder', A: 15, B: 1, auto: false, speed: 0.8 },
      enter: (s) => s.settleFromZero(),
      duration: 14,
    },
    {
      title: 'Experiment',
      text: 'Click the input lamps to flip bits, or set A and B with the sliders. In the adder, try 15 + 15.',
      params: { mode: 'adder', auto: false, speed: 1.5 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let nodes = {}, order = [], tick = 0, cyc = 0, cycT = 0, layoutFor = '';
    const inputs = { A: 0, B: 0 };

    // ------------------------------------------------------------ circuit builders
    function build() {
      nodes = {};
      order = [];
      const add = (id, type, ins = [], extra = {}) => {
        nodes[id] = { id, type, ins, v: 0, ...extra };
        if (type !== 'in') order.push(id);
      };
      if (params.mode === 'gates') {
        add('A', 'in');
        add('B', 'in');
        for (const t of ['and', 'or', 'xor', 'nand']) add(t, t, ['A', 'B']);
        add('not', 'not', ['A']);
      } else if (params.mode === 'half') {
        add('A', 'in');
        add('B', 'in');
        add('sum', 'xor', ['A', 'B']);
        add('carry', 'and', ['A', 'B']);
      } else {
        for (let i = 0; i < 4; i++) {
          add('a' + i, 'in');
          add('b' + i, 'in');
          const cin = i === 0 ? null : 'co' + (i - 1);
          add('x' + i, 'xor', ['a' + i, 'b' + i]);
          add('a1' + i, 'and', ['a' + i, 'b' + i]);
          if (cin) {
            add('s' + i, 'xor', ['x' + i, cin]);
            add('a2' + i, 'and', ['x' + i, cin]);
            add('co' + i, 'or', ['a1' + i, 'a2' + i]);
          } else {
            add('s' + i, 'xor', ['x' + i, 'x' + i]); // placeholder replaced below
            nodes['s' + i] = { id: 's' + i, type: 'buf', ins: ['x' + i], v: 0 };
            add('co' + i, 'buf', ['a1' + i]);
          }
        }
        loadNumbers();
      }
      layoutFor = params.mode;
    }
    function loadNumbers() {
      for (let i = 0; i < 4; i++) {
        nodes['a' + i].v = (params.A >> i) & 1;
        nodes['b' + i].v = (params.B >> i) & 1;
      }
    }
    function settleFromZero() {
      if (layoutFor !== params.mode) build();
      for (const id of order) nodes[id].v = 0;
      loadNumbers();
    }
    function stepGates() {
      const nv = {};
      for (const id of order) {
        const n = nodes[id];
        const a = nodes[n.ins[0]].v, b = n.ins[1] ? nodes[n.ins[1]].v : 0;
        nv[id] = n.type === 'buf' ? a : FN[n.type](a, b);
      }
      for (const id of order) nodes[id].v = nv[id];
    }

    // ------------------------------------------------------------ layout
    function positions() {
      const { w, h } = api;
      const P = {};
      if (params.mode === 'gates') {
        const x0 = w * 0.12, xg = w * (w > 760 ? 0.42 : 0.5), xo = w * (w > 760 ? 0.6 : 0.8);
        // narrow screens put the truth table underneath, so keep the gates in the upper part
        const top = 110, step = Math.min(78, (h * (w > 760 ? 0.75 : 0.56) - top) / 5);
        P.A = [x0, top + step * 1];
        P.B = [x0, top + step * 3];
        ['and', 'or', 'xor', 'nand', 'not'].forEach((t, i) => (P[t] = [xg, top + i * step]));
        P.out = (id) => [xo, P[id][1]];
        P.s = Math.min(46, step * 0.6);
      } else if (params.mode === 'half') {
        const cy = Math.max(220, h * 0.4);
        P.A = [w * 0.15, cy - 60];
        P.B = [w * 0.15, cy + 60];
        P.sum = [w * 0.48, cy - 70];
        P.carry = [w * 0.48, cy + 70];
        P.out = (id) => [w * 0.72, P[id][1]];
        P.s = 54;
      } else {
        // narrow phones: leave room on the left for the final "carry" lamp and its label
        const x0 = w < 600 ? 52 : w * 0.1, x1 = w < 600 ? w - 12 : w * 0.9, cy = Math.max(230, h * 0.42);
        const bw = (x1 - x0) / 4;
        for (let i = 0; i < 4; i++) P['fa' + i] = [x1 - (i + 0.5) * bw, cy, bw * 0.62];
        P.s = Math.min(40, bw * 0.25);
      }
      return P;
    }

    function wire(x1, y1, x2, y2, on) {
      const mx = (x1 + x2) / 2;
      ctx.strokeStyle = on ? ON : OFF;
      ctx.lineWidth = on ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(mx, y1);
      ctx.lineTo(mx, y2);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    function gate(type, x, y, s, on) {
      // body spans x-s/2 … x+s/2; inputs at left, output at right
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = on ? 'rgba(255,181,71,0.18)' : 'rgba(20,26,48,0.95)';
      ctx.strokeStyle = on ? ON : 'rgba(200,210,240,0.7)';
      ctx.lineWidth = 2;
      const L = -s / 2, R = s / 2, H = s * 0.42;
      ctx.beginPath();
      if (type === 'and' || type === 'nand') {
        ctx.moveTo(L, -H);
        ctx.lineTo(0, -H);
        ctx.arc(0, 0, H, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(L, H);
        ctx.closePath();
      } else if (type === 'or' || type === 'xor') {
        ctx.moveTo(L, -H);
        ctx.quadraticCurveTo(R * 0.4, -H, R, 0);
        ctx.quadraticCurveTo(R * 0.4, H, L, H);
        ctx.quadraticCurveTo(L + H * 0.6, 0, L, -H);
      } else if (type === 'not') {
        ctx.moveTo(L, -H);
        ctx.lineTo(R - 8, 0);
        ctx.lineTo(L, H);
        ctx.closePath();
      } else {
        ctx.rect(L, -H, s, H * 2);
      }
      ctx.fill();
      ctx.stroke();
      if (type === 'xor') {
        ctx.beginPath();
        ctx.moveTo(L - 7, -H);
        ctx.quadraticCurveTo(L - 7 + H * 0.6, 0, L - 7, H);
        ctx.stroke();
      }
      if (type === 'nand' || type === 'not') {
        ctx.beginPath();
        ctx.arc(type === 'not' ? R - 4 : R + 4, 0, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      if (!api.thumbnail) text(ctx, type.toUpperCase(), x - (type === 'not' ? 8 : 4), y + 1, { size: Math.max(9, s * 0.2), align: 'center', weight: 700, color: on ? ON : C.ink, shadow: false });
    }
    function lamp(x, y, on, label, r = 14) {
      if (on) {
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, x, y, r * 3, '#ffb547', 0.25);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.fillStyle = on ? '#ffd27a' : 'rgba(160,175,215,0.12)';
      ctx.strokeStyle = on ? '#fff3d6' : 'rgba(160,175,215,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      text(ctx, String(on ? 1 : 0), x, y + 1, { size: r * 0.85, align: 'center', weight: 700, mono: true, color: on ? '#2a1a05' : C.dim, shadow: false });
      if (label && !api.thumbnail) text(ctx, label, x, y - r - 11, { size: 11, align: 'center', color: C.dim, weight: 600 });
    }

    build();

    return {
      settleFromZero,
      reset: () => build(),
      onParam(k) {
        if (k === 'mode') build();
        if ((k === 'A' || k === 'B') && params.mode === 'adder') {
          loadNumbers();
          cycT = 0; // numbers someone just chose (or a shared link set) stay up for a full cycle
        }
      },
      pointerDown(p) {
        const P = positions();
        if (params.mode === 'adder') {
          for (let i = 0; i < 4; i++) {
            const [x, y, bw] = P['fa' + i];
            for (const [k, dx] of [['a', -bw * 0.22], ['b', bw * 0.22]])
              if (Math.hypot(p.x - (x + dx), p.y - (y - 90)) < 20) {
                api.runner.set('auto', false);
                const key = k === 'a' ? 'A' : 'B';
                api.runner.set(key, params[key] ^ (1 << i));
              }
          }
          return;
        }
        for (const id of ['A', 'B'])
          if (Math.hypot(p.x - P[id][0], p.y - P[id][1]) < 24) {
            api.runner.set('auto', false);
            nodes[id].v ^= 1;
          }
      },
      update(dt) {
        if (layoutFor !== params.mode) build();
        if (params.auto && params.mode !== 'adder') {
          cycT += dt;
          if (cycT > 2.2) {
            cycT = 0;
            cyc = (cyc + 1) % 4;
            nodes.A.v = (cyc >> 1) & 1;
            nodes.B.v = cyc & 1;
          }
        } else if (params.auto && params.mode === 'adder') {
          cycT += dt;
          if (cycT > 4) {
            cycT = 0;
            api.runner.set('A', Math.floor(Math.random() * 16));
            api.runner.set('B', Math.floor(Math.random() * 16));
          }
        }
        tick += dt * params.speed;
        while (tick > 0.16) {
          tick -= 0.16;
          stepGates();
        }
        inputs.A = nodes.A?.v;
        inputs.B = nodes.B?.v;
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0c0f22' });
        const P = positions();
        if (params.mode === 'gates' || params.mode === 'half') {
          const s = P.s;
          const gateIds = order;
          for (const id of gateIds) {
            const n = nodes[id];
            const [gx, gy] = P[id];
            n.ins.forEach((src, k) => {
              const [sx, sy] = P[src];
              const iy = n.ins.length === 1 ? gy : gy + (k ? 1 : -1) * s * 0.22;
              wire(sx + 16, sy, gx - s / 2 - (n.type === 'xor' ? 7 : 0), iy, nodes[src].v);
            });
            const [ox, oy] = P.out(id);
            wire(gx + s / 2 + (n.type === 'nand' || n.type === 'not' ? 8 : 0), gy, ox - 14, oy, n.v);
          }
          for (const id of gateIds) gate(nodes[id].type, ...P[id], s, nodes[id].v);
          for (const id of gateIds) lamp(...P.out(id), nodes[id].v, params.mode === 'half' ? id : null);
          lamp(...P.A, nodes.A.v, 'A', 18);
          lamp(...P.B, nodes.B.v, 'B', 18);
          // truth table
          if (!api.thumbnail) {
            const cols = params.mode === 'gates' ? ['A', 'B', 'AND', 'OR', 'XOR', 'NAND', 'NOT A'] : ['A', 'B', 'sum', 'carry'];
            const fns = params.mode === 'gates' ? [(a, b) => a & b, (a, b) => a | b, (a, b) => a ^ b, (a, b) => 1 - (a & b), (a) => 1 - a] : [(a, b) => a ^ b, (a, b) => a & b];
            const cw = 46, rh = 24;
            const tx = w > 760 ? w - cols.length * cw - 24 : (w - cols.length * cw) / 2;
            const ty = w > 760 ? 110 : Math.max(h * 0.62, (P.not?.[1] ?? 0) + s + 30);
            ctx.fillStyle = 'rgba(10,14,30,0.8)';
            ctx.fillRect(tx - 8, ty - 18, cols.length * cw + 16, rh * 5 + 14);
            cols.forEach((c, i) => text(ctx, c, tx + (i + 0.5) * cw, ty, { size: 10, align: 'center', color: C.dim, weight: 700 }));
            for (let r = 0; r < 4; r++) {
              const a = (r >> 1) & 1, b = r & 1;
              const cur = a === nodes.A.v && b === nodes.B.v;
              const y = ty + (r + 1) * rh;
              if (cur) {
                ctx.fillStyle = rgba(C.amber, 0.16);
                ctx.fillRect(tx - 4, y - rh / 2, cols.length * cw + 8, rh);
              }
              const vals = [a, b, ...fns.map((f) => f(a, b))];
              vals.forEach((v, i) => text(ctx, String(v), tx + (i + 0.5) * cw, y, { size: 13, align: 'center', mono: true, color: v ? C.amber : C.dim }));
            }
          }
          if (params.mode === 'half' && !api.thumbnail) {
            const a = nodes.A.v, b = nodes.B.v;
            // wide screens: under the gates; narrow ones put the truth table there, so go below the table
            const tableY = Math.max(h * 0.62, (P.not?.[1] ?? 0) + P.s + 30);
            const ey = w > 760 ? Math.max(220, h * 0.4) + 150 : tableY + 24 * 5 + 22;
            text(ctx, `${a} + ${b} = ${nodes.carry.v}${nodes.sum.v} (binary) = ${a + b}`, w * 0.5, ey, { size: w > 760 ? 18 : 15, align: 'center', mono: true, weight: 600 });
          }
        } else {
          // 4-bit ripple-carry adder
          for (let i = 0; i < 4; i++) {
            const [x, y, bw] = P['fa' + i];
            const busy = nodes['co' + i].v;
            ctx.fillStyle = 'rgba(20,26,48,0.95)';
            ctx.strokeStyle = busy ? ON : 'rgba(200,210,240,0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x - bw / 2, y - 40, bw, 80, 10) : ctx.rect(x - bw / 2, y - 40, bw, 80);
            ctx.fill();
            ctx.stroke();
            if (!api.thumbnail) {
              const tight = bw < 80; // phones: shorter labels that fit inside the box
              text(ctx, tight ? 'adder' : 'full adder', x, y - 14, { size: tight ? 10 : 11, align: 'center', color: C.dim });
              text(ctx, tight ? `bit ${i}` : `bit ${i} · worth ${1 << i}`, x, y + 6, { size: 10, align: 'center', color: C.dim });
              // tiny internal gate lights
              ['x', 'a1', 's', 'a2', 'co'].forEach((g, k) => {
                const n = nodes[g + i];
                if (!n) return;
                ctx.fillStyle = n.v ? ON : 'rgba(160,175,215,0.25)';
                ctx.beginPath();
                ctx.arc(x - 24 + k * 12, y + 24, 3.5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
            // inputs
            wire(x - bw * 0.22, y - 76, x - bw * 0.22, y - 40, nodes['a' + i].v);
            wire(x + bw * 0.22, y - 76, x + bw * 0.22, y - 40, nodes['b' + i].v);
            lamp(x - bw * 0.22, y - 90, nodes['a' + i].v, i === 3 ? 'A' : null);
            lamp(x + bw * 0.22, y - 90, nodes['b' + i].v, i === 3 ? 'B' : null);
            // sum
            wire(x, y + 40, x, y + 76, nodes['s' + i].v);
            lamp(x, y + 90, nodes['s' + i].v, null, 16);
            // carry to the next (left) adder
            const nx = i < 3 ? P['fa' + (i + 1)][0] + bw / 2 : x - bw / 2 - 40;
            wire(x - bw / 2, y, nx, y, nodes['co' + i].v);
            if (i === 3) lamp(nx - 6, y, nodes.co3.v, 'carry', 14);
            else if (!api.thumbnail && nodes['co' + i].v && nx - (x - bw / 2) < -50)
              tag(ctx, 'carry 1', (x - bw / 2 + nx) / 2, y - 14, C.amber, { align: 'center', size: 9 }); // only where the gap fits it
          }
          if (!api.thumbnail) {
            let S = 0;
            for (let i = 0; i < 4; i++) S |= nodes['s' + i].v << i;
            S |= nodes.co3.v << 4;
            const cy = P.fa0[1];
            const bin = (v, n) => v.toString(2).padStart(n, '0');
            text(ctx, `${bin(params.A, 4)} + ${bin(params.B, 4)} = ${bin(S, 5)}`, w / 2, cy + 140, { size: 18, align: 'center', mono: true, weight: 600 });
            text(ctx, `${params.A} + ${params.B} = ${S}${S !== params.A + params.B ? '  (carries still rippling…)' : ''}`, w / 2, cy + 170, { size: 15, align: 'center', mono: true, color: S === params.A + params.B ? C.teal : C.amber });
          }
        }
      },
      stats() {
        if (params.mode === 'adder') {
          let S = 0;
          for (let i = 0; i < 4; i++) S |= nodes['s' + i].v << i;
          S |= nodes.co3.v << 4;
          return [
            { label: 'A + B', value: `${params.A} + ${params.B}` },
            { label: 'Circuit says', value: String(S), color: S === params.A + params.B ? C.teal : C.amber },
            { label: 'Gates in circuit', value: String(order.length) },
          ];
        }
        return [
          { label: 'Inputs', value: `A=${nodes.A.v}  B=${nodes.B.v}` },
          { label: 'Gates', value: String(order.length) },
        ];
      },
    };
  },
};
