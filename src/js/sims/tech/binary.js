import { C, TAU, backdrop, drawGlow, tag, text, clamp } from '../../core/util.js';

export default {
  id: 'binary',
  title: 'Binary: How Computers Count',
  category: 'tech',
  tagline: 'Everything on your phone — words, photos, music — is just on and off switches.',
  ages: ['11-14', '14-16'],
  topics: ['Data representation'],
  blurb:
    'A computer is built from billions of tiny switches that are either off (0) or on (1). One switch is a bit. Line up eight bits and you have a byte, which can stand for any number from 0 to 255 — or a letter, or the brightness of one colour in a pixel. Here you can flip the bits yourself.',
  ideas: [
    'A <b>bit</b> is one switch: 0 or 1. Eight bits make a <b>byte</b>.',
    'Each position is worth <b>double</b> the one to its right: 1, 2, 4, 8, 16…',
    'n bits can represent <b>2ⁿ</b> different values — 8 bits give 256.',
    'Agreed codes turn numbers into <b>letters</b> (ASCII/Unicode) and <b>colours</b> (RGB).',
  ],
  hint: 'Click a bulb to flip that bit',
  thumbChapter: 2,
  thumbFrames: 60,
  params: [
    { key: 'mode', label: 'Show as', type: 'select', value: 'number', options: [{ value: 'number', label: 'Number' }, { value: 'text', label: 'Text' }, { value: 'color', label: 'Colour' }] },
    { key: 'count', label: 'Count up automatically', type: 'toggle', value: false },
    { key: 'rate', label: 'Counting speed', type: 'range', min: 0.5, max: 30, step: 0.5, value: 2, format: (v) => v + ' per s' },
    { key: 'word', label: 'Word to encode', type: 'select', value: 'Hi!', options: [{ value: 'Hi!', label: 'Hi!' }, { value: 'CAT', label: 'CAT' }, { value: 'π≈3', label: 'π≈3' }, { value: 'STEM', label: 'STEM' }] },
    { key: 'zero', label: 'All bits off', type: 'button', action: (s) => s.set(0) },
  ],
  story: [
    {
      title: 'On and off',
      text: 'Each bulb is a <b>bit</b>: off means 0, on means 1. One bit can only say yes or no. But line up eight of them and the patterns multiply.',
      params: { mode: 'number', count: false },
      enter: (s) => s.set(5),
      duration: 10,
    },
    {
      title: 'Place values',
      text: 'Just as decimal digits are worth 1, 10, 100…, binary positions are worth <b>1, 2, 4, 8, 16, 32, 64, 128</b>, doubling each time. Add up the lit bulbs: 32 + 8 + 2 = 42.',
      formula: '101010₂ = 32 + 8 + 2 = 42',
      params: { mode: 'number', count: false },
      enter: (s) => s.set(42),
      duration: 13,
    },
    {
      title: 'Counting in binary',
      text: 'Watch it count. The rightmost bit flips every step; each bit to its left flips half as often — like a car’s odometer with only 0s and 1s. Eight bits count from 0 to <b>255</b>, then roll over.',
      formula: '2⁸ = 256 values',
      params: { mode: 'number', count: true, rate: 4 },
      enter: (s) => s.set(0),
      duration: 15,
    },
    {
      title: 'Bytes as letters',
      text: 'Computers agree that certain numbers mean certain characters. In ASCII, 72 is “H” and 105 is “i”. Every message you type is stored as a string of bytes like these. Emoji and other scripts use more bytes (Unicode).',
      params: { mode: 'text', count: false, word: 'Hi!' },
      duration: 14,
    },
    {
      title: 'Bytes as colours',
      text: 'A screen pixel uses three bytes: how much red, green and blue light to mix, each 0–255. That is 256³ ≈ <b>16.7 million</b> colours. A 4K photo is about 25 million bytes like this.',
      params: { mode: 'color', count: true, rate: 12 },
      duration: 14,
    },
    {
      title: 'Your turn',
      text: 'Click bulbs to flip bits. Can you make 255? What is the largest number with only one bulb lit?',
      params: { mode: 'number', count: false },
      enter: (s) => s.set(0),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let value = 5, acc = 0, rgb = [40, 160, 255], flip = new Float32Array(24), ch = 0;
    const word = () => [...params.word].map((c) => c.codePointAt(0));

    function setV(v) {
      const old = value;
      value = ((v % 256) + 256) % 256;
      for (let b = 0; b < 8; b++) if (((old >> b) & 1) !== ((value >> b) & 1)) flip[b] = 1;
    }

    const geom = () => {
      const { w, h } = api;
      const cell = Math.min(80, (w - 60) / 8.6);
      return { cell, x0: (w - cell * 8) / 2, y: Math.max(160, h * 0.3) };
    };

    function drawByte(byte, x0, y, cell, opts = {}) {
      for (let i = 0; i < 8; i++) {
        const bit = (byte >> (7 - i)) & 1;
        const x = x0 + (i + 0.5) * cell;
        const r = cell * 0.3;
        const col = opts.color || '#ffcf6b';
        if (bit) {
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, x, y, r * 3.2, col.startsWith('#') ? col : '#ffcf6b', 0.25);
          ctx.globalCompositeOperation = 'source-over';
        }
        const fl = opts.flip ? opts.flip[7 - i] : 0;
        ctx.fillStyle = bit ? col : 'rgba(180,190,220,0.08)';
        ctx.strokeStyle = bit ? 'rgba(255,255,255,0.8)' : 'rgba(180,190,220,0.35)';
        ctx.lineWidth = 1.5 + fl * 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
        ctx.stroke();
        text(ctx, String(bit), x, y + 1, { size: Math.max(11, r * 0.8), align: 'center', weight: 700, color: bit ? '#1a1206' : 'rgba(233,237,247,0.5)', mono: true, shadow: false });
        if (opts.places) text(ctx, String(1 << (7 - i)), x, y + r + 18, { size: 12, align: 'center', color: bit ? C.amber : C.dim, mono: true });
      }
    }

    return {
      set: setV,
      reset: () => setV(0),
      pointerDown(p) {
        const g = geom();
        if (params.mode !== 'number') return;
        if (Math.abs(p.y - g.y) > g.cell * 0.5) return;
        const i = Math.floor((p.x - g.x0) / g.cell);
        if (i < 0 || i > 7) return;
        api.runner.set('count', false);
        setV(value ^ (1 << (7 - i)));
      },
      update(dt) {
        for (let i = 0; i < flip.length; i++) flip[i] = Math.max(0, flip[i] - dt * 3);
        if (params.count) {
          acc += dt * params.rate;
          while (acc >= 1) {
            acc -= 1;
            if (params.mode === 'color') {
              ch = (ch + 1) % 3;
              rgb[ch] = (rgb[ch] + 37 + ch * 23) % 256;
            } else setV(value + 1);
          }
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0f1022' });
        const g = geom();
        if (params.mode === 'number') {
          drawByte(value, g.x0, g.y, g.cell, { places: true, flip });
          const bits = value.toString(2).padStart(8, '0');
          const terms = [];
          for (let b = 7; b >= 0; b--) if ((value >> b) & 1) terms.push(1 << b);
          text(ctx, `${bits}₂  =  ${terms.length ? terms.join(' + ') : '0'}  =  ${value}`, w / 2, g.y + g.cell + 40, { size: Math.min(24, w / 30), align: 'center', mono: true, weight: 600 });
          text(ctx, `hexadecimal: ${value.toString(16).toUpperCase().padStart(2, '0')}    ·    character: ${value >= 32 && value < 127 ? '“' + String.fromCharCode(value) + '”' : '(control)'}`, w / 2, g.y + g.cell + 76, { size: 13, align: 'center', color: C.dim });
        } else if (params.mode === 'text') {
          const codes = word();
          const n = codes.length;
          const cell = Math.min(g.cell * 0.7, (w - 140) / 8.4);
          const rowH = Math.min(cell * 1.45, (h - 260) / Math.max(1, n));
          const x0 = (w - cell * 8) / 2 + 30;
          codes.forEach((c, k) => {
            const y = 120 + k * rowH + rowH / 2;
            text(ctx, String.fromCodePoint(c), x0 - 60, y, { size: Math.min(34, rowH * 0.6), align: 'center', weight: 700, color: C.amber });
            if (c < 256) {
              drawByte(c, x0, y, cell);
              text(ctx, `= ${c}`, x0 + cell * 8 + 14, y, { size: 13, mono: true, color: C.dim });
            } else {
              // multi-byte Unicode character (UTF-8)
              const bytes = [...new TextEncoder().encode(String.fromCodePoint(c))];
              text(ctx, `${bytes.length} bytes in UTF-8: ${bytes.map((b) => b.toString(2).padStart(8, '0')).join(' ')}`, x0, y, { size: 12, mono: true, color: C.cyan });
            }
          });
        } else {
          const cell = Math.min(g.cell * 0.7, (w - 100) / 8.4);
          const x0 = Math.max(20, w * 0.08);
          const names = ['red', 'green', 'blue'], cols = ['#ff4d4d', '#4dff6a', '#4d8cff'];
          rgb.forEach((v, k) => {
            const y = 130 + k * cell * 1.5;
            drawByte(v, x0 + 50, y, cell, { color: cols[k] });
            text(ctx, names[k], x0, y, { size: 13, color: cols[k], weight: 600 });
            text(ctx, String(v), x0 + 60 + cell * 8, y, { size: 13, mono: true, color: C.dim });
          });
          const sx = x0 + 120 + cell * 8, sy = 100, S = clamp(Math.min(w - sx - 30, h * 0.4), 60, 260);
          if (sx + 60 < w) {
            ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(sx, sy, S, S, 16) : ctx.rect(sx, sy, S, S);
            ctx.fill();
            tag(ctx, `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`, sx + S / 2, sy + S + 22, C.ink, { align: 'center', size: 12 });
          }
        }
      },
      stats() {
        if (params.mode === 'color') return [{ label: 'RGB', value: rgb.join(', ') }, { label: 'Possible colours', value: '16,777,216' }, { label: 'Bits used', value: '24' }];
        if (params.mode === 'text') {
          const codes = word();
          return [{ label: 'Characters', value: String(codes.length) }, { label: 'Bytes (UTF-8)', value: String(new TextEncoder().encode(params.word).length), color: C.amber }];
        }
        return [
          { label: 'Decimal', value: String(value), color: C.amber },
          { label: 'Binary', value: value.toString(2).padStart(8, '0') },
          { label: 'Hexadecimal', value: '0x' + value.toString(16).toUpperCase().padStart(2, '0') },
          { label: 'Bits switched on', value: String(value.toString(2).split('').filter((c) => c === '1').length) },
        ];
      },
    };
  },
};
