import { C, backdrop, drawGlow, tag, text, rgba, easeInOut } from '../../core/util.js';

const OPS = { LDI: 1, LDA: 2, ADD: 3, STA: 4, OUT: 5, JMP: 6, JC: 7, HLT: 0 };
const EXPLAIN = {
  LDI: (n) => `Load the number ${n} into register A`,
  LDA: (n) => `Load the value stored at address ${n} into A`,
  ADD: (n) => `Add the value at address ${n} to A (set carry if > 255)`,
  STA: (n) => `Store A into memory address ${n}`,
  OUT: () => 'Send A to the output display',
  JMP: (n) => `Jump: continue from address ${n}`,
  JC: (n) => `If the carry flag is set, jump to address ${n}`,
  HLT: () => 'Halt — the program is finished',
};

const PROGRAMS = {
  countdown: {
    label: 'Count down',
    code: [['LDI', 10], ['STA', 31], ['LDA', 31], ['OUT'], ['ADD', 30], ['STA', 31], ['JC', 2], ['HLT']],
    data: { 30: 255 },
  },
  fib: {
    label: 'Fibonacci',
    code: [['LDI', 1], ['STA', 30], ['LDI', 0], ['STA', 31], ['LDA', 30], ['OUT'], ['ADD', 31], ['JC', 14], ['STA', 29], ['LDA', 30], ['STA', 31], ['LDA', 29], ['STA', 30], ['JMP', 4], ['HLT']],
    data: {},
  },
};

export default {
  id: 'cpu',
  title: 'Inside a Computer Processor',
  category: 'tech',
  tagline: 'Fetch, decode, execute — the three-step loop every program runs on, billions of times a second.',
  blurb:
    'Software is just a list of very simple instructions stored as numbers in memory. The processor fetches one, works out what it means, does it, and moves on to the next. This tiny 8-bit computer runs real programs step by step, so you can follow every number as it moves between memory, registers and the arithmetic unit.',
  ideas: [
    '<b>Memory</b> holds both the program and its data, as numbers.',
    'The <b>program counter</b> (PC) remembers which instruction is next.',
    'Every instruction goes through <b>fetch → decode → execute</b>.',
    '<b>Jumps</b> make loops and decisions — the basis of all software.',
  ],
  hint: 'Use the step button to go one micro-step at a time',
  thumbChapter: 3,
  thumbFrames: 300,
  params: [
    { key: 'prog', label: 'Program', type: 'select', value: 'countdown', options: Object.entries(PROGRAMS).map(([k, p]) => ({ value: k, label: p.label })) },
    { key: 'speed', label: 'Clock speed', type: 'range', min: 0.25, max: 12, step: 0.25, value: 1, format: (v) => v.toFixed(2) + ' Hz (slowed down!)' },
    { key: 'run', label: 'Running', type: 'toggle', value: true },
    { key: 'step', label: 'Single step', type: 'button', action: (s) => s.single() },
    { key: 'reset', label: 'Reset computer', type: 'button', action: (s) => s.boot() },
  ],
  story: [
    {
      title: 'A tiny computer',
      text: 'On the left is <b>memory</b>: 32 numbered boxes, each holding one byte. The program sits at the top as numbers (shown with their meanings). On the right is the <b>processor</b>: a program counter (PC), an instruction register (IR), a working register (A) and an arithmetic unit (ALU).',
      params: { prog: 'countdown', speed: 0.6, run: true },
      enter: (s) => s.boot(),
      duration: 13,
    },
    {
      title: 'Fetch',
      text: 'Each cycle starts with a <b>fetch</b>: the PC sends an address to memory, and the instruction stored there travels along the bus into the instruction register. Then the PC counts up by one, ready for next time.',
      params: { prog: 'countdown', speed: 0.6, run: true },
      duration: 13,
    },
    {
      title: 'Decode and execute',
      text: 'The control unit <b>decodes</b> the instruction — its number says what to do — then <b>executes</b> it, routing data between memory, register A, the ALU and the output.',
      params: { prog: 'countdown', speed: 1, run: true },
      duration: 14,
    },
    {
      title: 'Loops',
      text: 'This program counts down from 10. The <b>JC</b> (jump if carry) instruction sends the PC back to an earlier address, making a loop. When the count passes zero, the jump is skipped and the program halts. Every “if” and “repeat” in software boils down to jumps like this.',
      params: { prog: 'countdown', speed: 3, run: true },
      enter: (s) => s.boot(),
      duration: 16,
    },
    {
      title: 'Fibonacci',
      text: 'A different program, same hardware: this one computes the Fibonacci numbers 1, 1, 2, 3, 5, 8… until the answer no longer fits in 8 bits. Software is what turns one general-purpose machine into anything.',
      params: { prog: 'fib', speed: 6, run: true },
      enter: (s) => s.boot(),
      duration: 18,
    },
    {
      title: 'Now speed it up',
      text: 'Here the clock ticks a few times a second. A phone processor ticks about <b>3 billion</b> times a second on each of 8 cores, often finishing several instructions per tick. At this demo’s speed, one second of phone work would take about <b>a thousand years</b>.',
      params: { prog: 'fib', speed: 12, run: true },
      duration: 14,
    },
    {
      title: 'Step through it',
      text: 'Pause, then use Single step to follow each micro-step. Watch the PC, the carry flag and memory change.',
      params: { prog: 'countdown', speed: 1, run: false },
      enter: (s) => s.boot(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let mem, pc, A, IR, carry, halted, out, queue, cur, curT, instrs, cycles, hl = {}, phase = '', explain = '', haltT = 0;

    function boot() {
      const P = PROGRAMS[params.prog] || PROGRAMS.countdown;
      mem = new Array(32).fill(0).map(() => ({ op: null, v: 0 }));
      P.code.forEach(([op, n], i) => (mem[i] = { op, n: n ?? null, v: OPS[op] * 32 + (n ?? 0) }));
      for (const [a, v] of Object.entries(P.data)) mem[a] = { op: null, v };
      pc = 0;
      A = 0;
      IR = null;
      carry = 0;
      halted = false;
      out = [];
      queue = [];
      cur = null;
      curT = 0;
      instrs = 0;
      cycles = 0;
      phase = '';
      explain = '';
      haltT = 0;
    }

    const step = (from, to, label, apply, dur = 1, ph = phase) => queue.push({ from, to, label, apply, dur, ph });

    function plan() {
      // fetch
      const addr = pc;
      step('PC', 'M' + addr, String(addr), () => (hl = { mem: addr }), 0.8, 'FETCH');
      step('M' + addr, 'IR', mem[addr].op ? `${mem[addr].op}${mem[addr].n !== null ? ' ' + mem[addr].n : ''}` : String(mem[addr].v), () => {
        IR = mem[addr].op ? { op: mem[addr].op, n: mem[addr].n } : { op: 'HLT', n: null };
      }, 1, 'FETCH');
      step('PC', 'PC', 'PC + 1', () => (pc = (pc + 1) % 32), 0.5, 'FETCH');
      step('IR', 'CU', 'decode', () => {
        explain = EXPLAIN[IR.op](IR.n);
      }, 0.8, 'DECODE');
      queue.push({ lazy: true });
    }
    function planExecute() {
      const { op, n } = IR;
      const E = 'EXECUTE';
      if (op === 'LDI') step('IR', 'A', String(n), () => (A = n), 1, E);
      else if (op === 'LDA') {
        step('IR', 'M' + n, String(n), () => (hl = { mem: n }), 0.8, E);
        step('M' + n, 'A', String(mem[n].v), () => (A = mem[n].v), 1, E);
      } else if (op === 'ADD') {
        step('IR', 'M' + n, String(n), () => (hl = { mem: n }), 0.8, E);
        step('M' + n, 'ALU', String(mem[n].v), () => {}, 1, E);
        step('ALU', 'A', 'sum', () => {
          const s = A + mem[n].v;
          carry = s > 255 ? 1 : 0;
          A = s & 255;
          hl = { alu: true };
        }, 0.8, E);
      } else if (op === 'STA') {
        step('A', 'M' + n, String(A), () => {
          mem[n] = { op: null, v: A };
          hl = { mem: n };
        }, 1, E);
      } else if (op === 'OUT') step('A', 'OUT', String(A), () => out.push(A), 1, E);
      else if (op === 'JMP') step('IR', 'PC', String(n), () => (pc = n), 0.8, E);
      else if (op === 'JC') {
        if (carry) step('IR', 'PC', String(n), () => (pc = n), 0.8, E);
        else step('CU', 'CU', 'no carry: skip', () => {}, 0.6, E);
      } else step('CU', 'CU', 'HALT', () => (halted = true), 0.6, E);
    }

    function advance() {
      if (halted) return;
      if (!queue.length) plan();
      cur = queue.shift();
      if (cur.lazy) {
        planExecute();
        instrs++;
        cur = queue.shift();
      }
      phase = cur.ph;
      curT = 0;
    }
    function finish() {
      if (!cur) return;
      cur.apply();
      cycles++;
      cur = null;
    }

    boot();

    // ------------------------------------------------------------ layout
    const L = () => {
      const { w, h } = api;
      const wide = w > 820;
      const mx = wide ? 24 : 16, my = 96;
      const cellW = wide ? Math.min(78, (w * 0.42) / 4) : (w - 32) / 4, cellH = wide ? Math.min(34, (h - 200) / 8) : Math.min(24, (h * 0.42) / 8);
      const memW = cellW * 4;
      const cpuX = wide ? mx + memW + 70 : mx, cpuY = wide ? my : my + cellH * 8 + 50;
      const cpuW = wide ? w - cpuX - 24 : w - 32, cpuH = wide ? Math.min(h - 200, 360) : Math.min(260, h - cpuY - 30);
      const busY = wide ? my + cellH * 8 + 30 : cpuY - 24;
      const box = (fx, fy) => [cpuX + cpuW * fx, cpuY + cpuH * fy];
      return {
        wide, mx, my, cellW, cellH, cpuX, cpuY, cpuW, cpuH, busY,
        anchors: { PC: box(0.2, 0.2), IR: box(0.55, 0.2), CU: box(0.85, 0.2), A: box(0.2, 0.62), ALU: box(0.55, 0.62), OUT: box(0.85, 0.62) },
        cell: (i) => [mx + (i % 4) * cellW, my + Math.floor(i / 4) * cellH],
      };
    }
    function anchor(name, G) {
      if (name[0] === 'M') {
        const [x, y] = G.cell(+name.slice(1));
        return [x + G.cellW / 2, y + G.cellH / 2];
      }
      return G.anchors[name];
    }
    function path(a, b, G) {
      if (a === b) return [anchor(a, G), anchor(b, G)];
      const p = anchor(a, G), q = anchor(b, G);
      const memA = a[0] === 'M', memB = b[0] === 'M';
      if (!memA && !memB) return [p, q];
      // go via the bus
      return [p, [p[0], G.busY], [q[0], G.busY], q];
    }
    function along(pts, t) {
      let total = 0;
      const seg = [];
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        seg.push(d);
        total += d;
      }
      let d = t * total;
      for (let i = 0; i < seg.length; i++) {
        if (d <= seg[i] || i === seg.length - 1) {
          const f = seg[i] ? Math.min(1, d / seg[i]) : 1;
          return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
        }
        d -= seg[i];
      }
      return pts[pts.length - 1];
    }

    return {
      boot,
      single() {
        api.runner.set('run', false);
        if (cur) finish();
        advance();
        if (cur) {
          curT = 1;
          finish();
        }
      },
      reset: boot,
      onParam(k) {
        if (k === 'prog') boot();
      },
      update(dt) {
        if (halted) {
          haltT += dt;
          if (haltT > 4 && params.run) boot();
          return;
        }
        if (!params.run) return;
        if (!cur) advance();
        if (!cur) return;
        curT += (dt * params.speed * 2.2) / cur.dur;
        if (curT >= 1) finish();
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0c0f22' });
        const G = L();
        // memory
        if (!api.thumbnail) text(ctx, 'MEMORY', G.mx, G.my - 16, { size: 11, weight: 700, color: C.dim });
        for (let i = 0; i < 32; i++) {
          const [x, y] = G.cell(i);
          const m = mem[i];
          const isPC = i === pc && !halted;
          const isHL = hl.mem === i;
          ctx.fillStyle = isHL ? rgba(C.amber, 0.22) : m.op ? 'rgba(91,140,255,0.12)' : 'rgba(255,255,255,0.03)';
          ctx.strokeStyle = isPC ? C.pink : 'rgba(255,255,255,0.1)';
          ctx.lineWidth = isPC ? 2 : 1;
          ctx.fillRect(x + 1, y + 1, G.cellW - 2, G.cellH - 2);
          ctx.strokeRect(x + 1, y + 1, G.cellW - 2, G.cellH - 2);
          if (!api.thumbnail || G.cellH > 16) {
            text(ctx, String(i).padStart(2, '0'), x + 5, y + G.cellH / 2, { size: 8.5, mono: true, color: 'rgba(233,237,247,0.3)', shadow: false });
            const label = m.op ? `${m.op}${m.n !== null ? ' ' + m.n : ''}` : String(m.v);
            text(ctx, label, x + G.cellW - 6, y + G.cellH / 2, { size: Math.min(12, G.cellH * 0.45), mono: true, align: 'right', color: m.op ? '#9fb8ff' : m.v ? C.amber : 'rgba(233,237,247,0.25)', shadow: false });
          }
        }
        // bus
        ctx.strokeStyle = 'rgba(160,180,240,0.25)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(G.mx, G.busY);
        ctx.lineTo(G.cpuX + G.cpuW, G.busY);
        ctx.stroke();
        if (!api.thumbnail) text(ctx, 'data bus', G.mx + 4, G.busY + 14, { size: 9, color: C.dim });
        // CPU box
        ctx.fillStyle = 'rgba(16,20,40,0.85)';
        ctx.strokeStyle = 'rgba(160,180,240,0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(G.cpuX, G.cpuY, G.cpuW, G.cpuH, 14) : ctx.rect(G.cpuX, G.cpuY, G.cpuW, G.cpuH);
        ctx.fill();
        ctx.stroke();
        if (!api.thumbnail) text(ctx, 'PROCESSOR', G.cpuX + 12, G.cpuY + 14, { size: 11, weight: 700, color: C.dim });
        const reg = (name, val, col, sub) => {
          const [x, y] = G.anchors[name];
          const bw = Math.min(110, G.cpuW * 0.26), bh = 46;
          const active = cur && (cur.from === name || cur.to === name);
          ctx.fillStyle = active ? rgba(col, 0.22) : 'rgba(255,255,255,0.04)';
          ctx.strokeStyle = active ? col : 'rgba(255,255,255,0.18)';
          ctx.lineWidth = active ? 2 : 1;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 8) : ctx.rect(x - bw / 2, y - bh / 2, bw, bh);
          ctx.fill();
          ctx.stroke();
          text(ctx, sub, x, y - 12, { size: 9, align: 'center', color: C.dim, weight: 700 });
          text(ctx, val, x, y + 8, { size: 14, align: 'center', mono: true, weight: 600, color: col });
        };
        reg('PC', String(pc), C.pink, 'PROGRAM COUNTER');
        reg('IR', IR ? `${IR.op}${IR.n !== null && IR.n !== undefined ? ' ' + IR.n : ''}` : '—', '#9fb8ff', 'INSTRUCTION');
        reg('CU', phase || 'idle', C.violet, 'CONTROL UNIT');
        reg('A', `${A}  (${A.toString(2).padStart(8, '0')})`, C.amber, 'REGISTER A');
        reg('ALU', hl.alu ? '+' : '+ −', C.teal, `ALU · carry ${carry}`);
        reg('OUT', out.length ? String(out[out.length - 1]) : '—', C.lime, 'OUTPUT');
        if (!api.thumbnail) {
          const [ox, oy] = G.anchors.OUT;
          text(ctx, out.slice(-10).join(', '), ox, oy + 40, { size: 11, align: 'center', mono: true, color: C.lime });
          if (explain) text(ctx, explain, G.cpuX + G.cpuW / 2, G.cpuY + G.cpuH - 18, { size: 12, align: 'center', color: C.ink });
          if (halted) tag(ctx, 'HALTED', G.cpuX + G.cpuW - 12, G.cpuY + 14, C.red, { align: 'right', size: 11 });
        }
        // moving data token
        if (cur) {
          const pts = path(cur.from, cur.to, G);
          const [x, y] = along(pts, easeInOut(Math.min(1, curT)));
          ctx.strokeStyle = 'rgba(255,181,71,0.35)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1]));
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, x, y, 26, '#ffb547', 0.3);
          ctx.globalCompositeOperation = 'source-over';
          tag(ctx, cur.label, x, y - 20, C.amber, { align: 'center', size: 10 });
        }
        if (!api.thumbnail && phase) tag(ctx, phase, w - 16, 84, phase === 'FETCH' ? C.pink : phase === 'DECODE' ? C.violet : C.teal, { align: 'right', size: 12 });
      },
      stats() {
        return [
          { label: 'Instructions run', value: String(instrs) },
          { label: 'Micro-steps', value: String(cycles) },
          { label: 'Register A', value: `${A}`, color: C.amber },
          { label: 'Carry flag', value: String(carry) },
          { label: 'Output so far', value: out.slice(-6).join(', ') || '—', color: C.lime },
        ];
      },
    };
  },
};
