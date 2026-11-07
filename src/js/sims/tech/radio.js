import { C, TAU, clamp, backdrop, drawGlow, tag, text, rgba } from '../../core/util.js';

// smooth deterministic noise so traces scroll stably
const hash = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};
const noiseAt = (t, rate = 60) => {
  const k = Math.floor(t * rate), f = t * rate - k;
  return hash(k) * (1 - f) + hash(k + 1) * f;
};
const BITS = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1];

export default {
  id: 'radio',
  title: 'Radio, TV & Wireless Signals',
  category: 'tech',
  tagline: 'How a voice rides an invisible wave across a country — AM, FM and digital.',
  blurb:
    'Sound fades within metres, but radio waves race at the speed of light for thousands of kilometres. To send a voice or a picture, a transmitter takes a steady high-frequency “carrier” wave and changes it to match the message. Change its height and you have AM; change its frequency and you have FM; switch between set patterns and you have digital radio, TV, Wi-Fi and mobile data.',
  ideas: [
    'Each station transmits a <b>carrier wave</b> at its own frequency; tuning picks one out.',
    '<b>AM</b> varies the carrier’s strength; <b>FM</b> varies its frequency.',
    'Noise mostly changes a signal’s strength, so FM is far <b>clearer</b> than AM.',
    '<b>Digital</b> signals send 1s and 0s; a receiver only has to tell them apart, and errors can be corrected.',
  ],
  hint: 'Turn up the noise and compare AM with FM',
  thumbChapter: 3,
  thumbFrames: 60,
  params: [
    { key: 'mode', label: 'Modulation', type: 'select', value: 'none', options: [{ value: 'none', label: 'Carrier only' }, { value: 'am', label: 'AM' }, { value: 'fm', label: 'FM' }, { value: 'digital', label: 'Digital' }] },
    { key: 'noise', label: 'Interference', type: 'range', min: 0, max: 1, step: 0.01, value: 0 },
    { key: 'tone', label: 'Sound pitch', type: 'range', min: 0.5, max: 3, step: 0.05, value: 1.2, format: (v) => (v * 250).toFixed(0) + ' Hz' },
    { key: 'carrier', label: 'Carrier frequency (shown slowed)', type: 'range', min: 8, max: 30, step: 0.5, value: 16 },
  ],
  story: [
    {
      title: 'Sound doesn’t travel far',
      text: 'A singer’s voice (top trace) is a wave of air pressure a few hundred times a second. Shout across a field and it fades to nothing. To reach a whole country we need a different kind of wave: <b>radio</b>, which travels at the speed of light.',
      params: { mode: 'none', noise: 0, tone: 1.2, carrier: 16 },
      duration: 12,
    },
    {
      title: 'The carrier wave',
      text: 'The transmitter sends out a steady radio wave at a fixed frequency — the number on your dial, such as 100 MHz, meaning 100 million waves per second. On its own the carrier says nothing; it is a blank page.',
      params: { mode: 'none' },
      duration: 12,
    },
    {
      title: 'AM: change the height',
      text: 'Amplitude modulation makes the carrier stronger and weaker in step with the sound. The outline of the wave traces out the voice. The receiver follows that outline to rebuild the sound.',
      formula: 's(t) = [1 + m · sound(t)] · cos(2π f_c t)',
      params: { mode: 'am', noise: 0 },
      duration: 13,
    },
    {
      title: 'FM: change the frequency',
      text: 'Frequency modulation keeps the height fixed and instead squeezes the waves closer together when the sound is high and spreads them out when it is low. The receiver measures how fast the wave is wiggling.',
      formula: 's(t) = cos(2π f_c t + k ∫ sound dt)',
      params: { mode: 'fm', noise: 0 },
      duration: 13,
    },
    {
      title: 'Static',
      text: 'Lightning, motors and distance add <b>noise</b>. Noise mostly changes how strong the signal is — which AM reads directly as crackle. FM ignores strength, so it stays clean. That is why music stations moved to FM.',
      params: { mode: 'am', noise: 0.45 },
      enter: (s, r) => s.later(6.5, () => r.set('mode', 'fm')),
      duration: 15,
    },
    {
      title: 'Digital: Wi-Fi, 4G and TV',
      text: 'Modern systems send <b>bits</b>, here by switching between two frequencies. The receiver just has to decide “which one?” for each bit, so moderate noise causes no errors at all — and the few mistakes are fixed by error-correcting codes. Digital TV, Wi-Fi and phones pack many bits into each wave this way.',
      params: { mode: 'digital', noise: 0.3 },
      duration: 16,
    },
    {
      title: 'Experiment',
      text: 'Switch modulation types and push the interference up. Notice where AM, FM and digital each start to fail.',
      params: { mode: 'am', noise: 0.2 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0, jobs = [];
    const msg = (τ) => 0.65 * Math.sin(TAU * params.tone * τ) + 0.35 * Math.sin(TAU * params.tone * 2.3 * τ + 1);
    const bitAt = (τ) => BITS[((Math.floor(τ * 2) % BITS.length) + BITS.length) % BITS.length];
    // integral of the message for FM (closed form)
    const msgInt = (τ) => (-0.65 * Math.cos(TAU * params.tone * τ)) / (TAU * params.tone) - (0.35 * Math.cos(TAU * params.tone * 2.3 * τ + 1)) / (TAU * params.tone * 2.3);
    const fc = () => params.carrier;

    function signal(τ) {
      const m = params.mode;
      let s;
      if (m === 'am') s = (1 + 0.8 * msg(τ)) * 0.55 * Math.cos(TAU * fc() * τ);
      else if (m === 'fm') s = 0.9 * Math.cos(TAU * fc() * τ + 2.2 * TAU * msgInt(τ) * params.tone);
      else if (m === 'digital') {
        // continuous-phase FSK: integrate the frequency over whole bit periods
        const fb = (b) => (b ? 1.5 : 0.75) * fc() * 0.5; // cycles per bit
        const per = BITS.reduce((a, b) => a + fb(b), 0);
        const k = Math.floor(τ * 2), f = τ * 2 - k;
        const nb = BITS.length, cyc = Math.floor(k / nb), r = k - cyc * nb;
        let ph = cyc * per;
        for (let i = 0; i < r; i++) ph += fb(BITS[i]);
        ph += fb(BITS[r]) * f;
        s = 0.9 * Math.cos(TAU * ph);
      } else s = 0.9 * Math.cos(TAU * fc() * τ);
      return s;
    }
    const noisy = (τ) => signal(τ) * (1 + params.noise * 0.9 * noiseAt(τ, 9)) + params.noise * 0.35 * noiseAt(τ, 140);
    function received(τ) {
      const m = params.mode, n = params.noise;
      if (m === 'am') return clamp(0.8 * msg(τ) + n * 1.1 * noiseAt(τ, 9) + n * 0.5 * noiseAt(τ, 70), -1.4, 1.4);
      if (m === 'fm') {
        const clicks = n > 0.7 ? (noiseAt(τ, 25) > 0.92 - (n - 0.7) ? 1.2 * Math.sign(noiseAt(τ, 300)) : 0) : 0;
        return clamp(0.8 * msg(τ) + n * 0.12 * noiseAt(τ, 70) + clicks, -1.4, 1.4);
      }
      if (m === 'digital') {
        const b = bitAt(τ);
        const k = Math.floor(τ * 2);
        const err = Math.abs(hash(k * 7.3)) < Math.max(0, (n - 0.45) * 0.9);
        return (err ? 1 - b : b) ? 0.7 : -0.7;
      }
      return 0;
    }

    return {
      later(dt, fn) {
        jobs.push({ t: dt, fn });
      },
      update(dt) {
        t += dt;
        for (const j of jobs) if ((j.t -= dt) <= 0) j.fn(api.runner);
        jobs = jobs.filter((j) => j.t > 0);
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0b0f22', grid: false });
        const wide = w > 760;
        const left = wide ? 150 : 16, right = w - (wide ? 150 : 16);
        const top = 100, rows = 4, gap = 12;
        const rowH = Math.min(92, ((h > 640 ? h * 0.75 : h - 30) - top - gap * 3) / rows);
        const span = 2.4; // seconds of signal across the width
        const traces = [
          { name: 'Sound (the message)', col: C.amber, fn: (τ) => (params.mode === 'digital' ? (bitAt(τ) ? 0.7 : -0.7) : 0.85 * msg(τ)), on: true },
          { name: params.mode === 'none' ? 'Carrier wave' : 'Transmitted radio wave', col: C.cyan, fn: (τ) => signal(τ), on: true, dense: true },
          { name: 'What the antenna picks up', col: '#9fb8ff', fn: (τ) => noisy(τ), on: true, dense: true },
          { name: params.mode === 'digital' ? 'Decoded bits' : 'Sound out of the speaker', col: C.lime, fn: (τ) => received(τ), on: params.mode !== 'none' },
        ];
        traces.forEach((tr, k) => {
          const y0 = top + k * (rowH + gap), cy = y0 + rowH / 2;
          ctx.fillStyle = 'rgba(12,16,34,0.7)';
          ctx.fillRect(left, y0, right - left, rowH);
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.strokeRect(left, y0, right - left, rowH);
          if (!api.thumbnail) text(ctx, tr.name, left + 8, y0 + 12, { size: 10, color: rgba(tr.col.startsWith('#') ? tr.col : '#ffffff', 0.85), weight: 600 });
          if (!tr.on) return;
          ctx.strokeStyle = tr.col;
          ctx.lineWidth = tr.dense ? 1.2 : 2;
          ctx.beginPath();
          const N = Math.floor(right - left);
          for (let i = 0; i <= N; i += tr.dense ? 1 : 2) {
            const τ = t - ((N - i) / N) * span;
            const v = tr.fn(τ);
            ctx[i ? 'lineTo' : 'moveTo'](left + i, cy - v * rowH * 0.42);
          }
          ctx.stroke();
          if (params.mode === 'digital' && k === 3 && !api.thumbnail) {
            // mark bit errors
            for (let b = Math.floor((t - span) * 2); b <= Math.floor(t * 2); b++) {
              const τ = b / 2 + 0.25;
              const sent = bitAt(τ), got = received(τ) > 0 ? 1 : 0;
              const x = left + ((τ - (t - span)) / span) * (right - left);
              if (x < left || x > right) continue;
              text(ctx, String(got), x, cy, { size: 12, align: 'center', mono: true, weight: 700, color: got === sent ? C.lime : C.red });
            }
          }
        });
        // transmitter & receiver icons with expanding wavefronts
        if (wide) {
          const tx = 70, ty = top + rowH * 1.5;
          ctx.strokeStyle = '#9fb3d9';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tx - 18, ty + 70);
          ctx.lineTo(tx, ty - 20);
          ctx.lineTo(tx + 18, ty + 70);
          ctx.moveTo(tx - 12, ty + 40);
          ctx.lineTo(tx + 12, ty + 40);
          ctx.moveTo(tx - 8, ty + 15);
          ctx.lineTo(tx + 8, ty + 15);
          ctx.stroke();
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, tx, ty - 22, 16, '#38d6f5', 0.4);
          for (let k = 0; k < 5; k++) {
            const r = ((t * 60 + k * 30) % 150) + 10;
            ctx.strokeStyle = `rgba(56,214,245,${0.5 * (1 - r / 160)})`;
            ctx.beginPath();
            ctx.arc(tx, ty - 22, r, -0.9, 0.9);
            ctx.stroke();
          }
          ctx.globalCompositeOperation = 'source-over';
          const rx = w - 75, ry = top + rowH * 3.3;
          ctx.fillStyle = '#20284a';
          ctx.strokeStyle = C.lime;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(rx - 34, ry - 22, 68, 44, 8) : ctx.rect(rx - 34, ry - 22, 68, 44);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = '#9fb3d9';
          ctx.beginPath();
          ctx.moveTo(rx + 20, ry - 22);
          ctx.lineTo(rx + 34, ry - 70);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) ctx.fillRect(rx - 26 + i * 7, ry - 12 + j * 7, 3, 3);
          if (!api.thumbnail) {
            tag(ctx, 'transmitter', tx, ty + 90, C.cyan, { align: 'center', size: 10 });
            tag(ctx, 'receiver', rx, ry + 36, C.lime, { align: 'center', size: 10 });
          }
        }
        if (!api.thumbnail) {
          const band = { none: 'carrier', am: 'AM radio · 0.5–1.7 MHz', fm: 'FM radio · 88–108 MHz', digital: 'Digital TV 470–700 MHz · Wi-Fi 2.4/5 GHz' }[params.mode];
          tag(ctx, band, w - 16, 84, C.ink, { align: 'right', size: 11 });
        }
      },
      stats() {
        const q = params.mode === 'am' ? Math.max(0, 1 - params.noise * 1.4) : params.mode === 'fm' ? (params.noise > 0.7 ? 0.5 : 0.97 - params.noise * 0.1) : params.mode === 'digital' ? (params.noise < 0.45 ? 1 : Math.max(0, 1 - (params.noise - 0.45) * 0.9)) : 0;
        return [
          { label: 'Modulation', value: { none: 'none', am: 'amplitude (AM)', fm: 'frequency (FM)', digital: 'frequency-shift keying' }[params.mode], color: C.cyan },
          { label: 'Interference', value: (params.noise * 100).toFixed(0) + ' %' },
          { label: params.mode === 'digital' ? 'Bits correct' : 'Sound quality', value: params.mode === 'none' ? '—' : (q * 100).toFixed(0) + ' %', color: q > 0.9 ? C.lime : q > 0.6 ? C.amber : C.red },
        ];
      },
    };
  },
};
