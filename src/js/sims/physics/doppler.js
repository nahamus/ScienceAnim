import { C, Series, backdrop, clamp, drawGlow, tag, text, TAU } from '../../core/util.js';

export default {
  id: 'doppler',
  title: 'Doppler Effect & Sonic Booms',
  category: 'physics',
  tagline: 'Why a passing siren drops in pitch — and what happens when you outrun your own sound.',
  ages: ['14-16', '16+'],
  topics: ['Waves', 'Sound'],
  blurb:
    'A moving source crowds its waves together in front and stretches them out behind. Listeners ahead hear a higher pitch; listeners behind hear a lower one. Push past the speed of sound and the wavefronts pile into a shock cone: a sonic boom.',
  ideas: [
    'Waves ahead of a moving source are compressed (higher frequency); behind, they are stretched (lower).',
    'At Mach 1 the wavefronts stack into a single wall of pressure — the “sound barrier”.',
    'Above Mach 1 a cone-shaped shock wave trails the source, with half-angle sin α = 1/M.',
    'Light does the same thing: receding galaxies look redder — evidence the universe is expanding.',
  ],
  hint: 'Drag the listener (ear) around · turn on sound to hear the pitch',
  thumbChapter: 1,
  thumbFrames: 240,
  params: [
    { key: 'mach', label: 'Source speed', type: 'range', min: 0, max: 2.2, step: 0.01, value: 0, format: (v) => `Mach ${v.toFixed(2)}` },
    { key: 'freq', label: 'Emitted frequency', type: 'range', min: 1, max: 6, step: 0.1, value: 3, unit: 'waves/s' },
    { key: 'color', label: 'Colour by pitch shift', type: 'toggle', value: true },
    { key: 'sound', label: 'Play sound', type: 'toggle', value: false },
  ],
  story: [
    {
      title: 'A source at rest',
      text: 'A stationary source sends out sound in perfect circles. Wherever you stand, crests arrive at the same rate — everyone hears the same pitch.',
      params: { mach: 0, freq: 3 },
      duration: 9,
    },
    {
      title: 'On the move',
      text: 'Now the source moves at half the speed of sound. Each new wave starts a little further ahead, so crests <em>bunch up</em> in front (higher pitch, shown blue) and <em>spread out</em> behind (lower, shown red).',
      formula: 'f′ = f · c / (c − v cos θ)',
      params: { mach: 0.5 },
      duration: 14,
    },
    {
      title: 'The passing siren',
      text: 'Watch the chart: as the source approaches the listener the pitch is high, then it drops suddenly as it passes. That’s the familiar “neeeee-yowww” of a passing ambulance. Turn on sound to hear it.',
      params: { mach: 0.62 },
      duration: 14,
    },
    {
      title: 'Hitting the sound barrier',
      text: 'At exactly Mach 1 the source keeps pace with its own sound. Every wavefront piles up at its nose into one intense wall of pressure.',
      params: { mach: 1 },
      duration: 11,
    },
    {
      title: 'Supersonic: the Mach cone',
      text: 'Faster than sound, the source leaves its waves behind. They overlap along a cone — a <b>shock wave</b>. When the cone sweeps over you, you hear a sonic boom. Faster flight makes a narrower cone.',
      formula: 'sin α = 1 / M',
      params: { mach: 1.7 },
      duration: 14,
    },
    {
      title: 'Try it',
      text: 'Change the speed, drag the listener around, and switch on sound to hear the shift.',
      params: { mach: 0.75 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const CS = 150; // speed of sound in px/s
    let rings = [], sx = 0, sy = 0, t = 0, emitAcc = 0, lx = 0, ly = 0, dragL = false, heard = new Series(240), fHeard = 0, booms = [];
    let audio = null;

    function reset() {
      rings = [];
      sx = api.w * 0.12;
      t = 0;
      heard.clear();
    }
    function perceived() {
      // find the most recent ring that has reached the listener; its emission velocity gives the shift
      let best = null;
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        const rad = CS * (t - r.t);
        if (Math.hypot(lx - r.x, ly - r.y) <= rad) {
          best = r;
          break;
        }
      }
      if (!best) return 0;
      const dx = lx - best.x, dy = ly - best.y;
      const cos = dx / (Math.hypot(dx, dy) || 1);
      const den = 1 - (best.v / CS) * cos;
      return den <= 0.05 ? params.freq * 20 : params.freq / den;
    }
    function ensureAudio(on) {
      if (on && !audio) {
        try {
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = 'triangle';
          osc.connect(gain).connect(ac.destination);
          gain.gain.value = 0;
          osc.start();
          audio = { ac, osc, gain };
        } catch (e) {
          console.warn(e);
        }
      } else if (!on && audio) {
        audio.ac.close();
        audio = null;
      }
    }

    return {
      resize(w, h) {
        sy = h * 0.4;
        if (!lx) {
          lx = w * 0.62;
          ly = h * 0.6;
        }
        reset();
      },
      reset,
      onParam(k, v) {
        if (k === 'sound') ensureAudio(v);
      },
      pointerDown(p) {
        dragL = true;
        lx = p.x;
        ly = p.y;
      },
      pointerMove(p) {
        if (dragL) {
          lx = p.x;
          ly = p.y;
        }
      },
      pointerUp() {
        dragL = false;
      },
      update(dt) {
        t += dt;
        const v = params.mach * CS;
        sx += v * dt;
        if (sx > api.w + 160) {
          sx = -160;
          heard.clear();
        }
        emitAcc += dt * params.freq;
        while (emitAcc >= 1) {
          emitAcc -= 1;
          rings.push({ x: sx, y: sy, t, v });
        }
        const maxR = Math.hypot(api.w, api.h) * 1.1;
        rings = rings.filter((r) => CS * (t - r.t) < maxR);
        fHeard = perceived();
        heard.push(fHeard);
        // sonic boom: detect cone crossing listener
        if (params.mach > 1) {
          const behind = sx - lx;
          const alpha = Math.asin(1 / params.mach);
          const dist = Math.abs(ly - sy);
          const coneX = sx - dist / Math.tan(alpha);
          if (this.prevCone !== undefined && this.prevCone < lx && coneX >= lx && behind > 0) booms.push({ a: 1 });
          this.prevCone = coneX;
        }
        booms.forEach((b) => (b.a -= dt * 1.2));
        booms = booms.filter((b) => b.a > 0);
        if (audio) {
          const f = clamp(fHeard * 110, 60, 2200);
          audio.osc.frequency.setTargetAtTime(f, audio.ac.currentTime, 0.02);
          const d = Math.hypot(lx - sx, ly - sy);
          audio.gain.gain.setTargetAtTime(fHeard ? clamp(60 / d, 0.02, 0.25) : 0, audio.ac.currentTime, 0.05);
        }
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 2;
        const maxR = Math.hypot(w, h);
        const SEG = 36;
        for (const r of rings) {
          const rad = CS * (t - r.t);
          if (rad < 1) continue;
          const al = clamp(1 - rad / maxR, 0, 1) * 0.85;
          if (params.color && r.v > 0) {
            for (let s = 0; s < SEG; s++) {
              const a0 = (s / SEG) * TAU, a1 = ((s + 1.05) / SEG) * TAU;
              const cos = Math.cos((a0 + a1) / 2);
              const den = 1 - (r.v / CS) * cos;
              const shift = clamp(Math.log(1 / Math.max(den, 0.05)) / 1.2, -1, 1);
              const hue = shift > 0 ? 200 + shift * 60 : 200 + shift * 200;
              ctx.strokeStyle = `hsla(${hue},95%,${60 + Math.abs(shift) * 10}%,${al})`;
              ctx.beginPath();
              ctx.arc(r.x, r.y, rad, a0, a1);
              ctx.stroke();
            }
          } else {
            ctx.strokeStyle = `hsla(200,90%,65%,${al})`;
            ctx.beginPath();
            ctx.arc(r.x, r.y, rad, 0, TAU);
            ctx.stroke();
          }
        }
        // Mach cone
        if (params.mach >= 1) {
          const alpha = Math.asin(1 / params.mach);
          const len = w * 1.5;
          ctx.strokeStyle = 'rgba(255,200,120,0.9)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(sx - Math.cos(alpha) * len, sy - Math.sin(alpha) * len);
          ctx.lineTo(sx, sy);
          ctx.lineTo(sx - Math.cos(alpha) * len, sy + Math.sin(alpha) * len);
          ctx.stroke();
        }
        drawGlow(ctx, sx, sy, 34, '#ffb547');
        for (const b of booms) drawGlow(ctx, lx, ly, 160 * (1.2 - b.a), '#ffffff', 0.05 + 0.2 * b.a);
        ctx.globalCompositeOperation = 'source-over';
        // source
        ctx.fillStyle = '#ffd28a';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, TAU);
        ctx.fill();
        // listener (ear icon: a ring with a dot)
        ctx.strokeStyle = '#eaf2ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lx, ly, 13, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = '#eaf2ff';
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, TAU);
        ctx.fill();
        if (!api.thumbnail) {
          tag(ctx, 'listener', lx, ly + 30, C.ink, { align: 'center' });
          if (fHeard) text(ctx, `hears ${(fHeard / params.freq).toFixed(2)}× pitch`, lx, ly - 30, { align: 'center', size: 12, mono: true, color: fHeard > params.freq ? '#9fc2ff' : '#ff9f9f' });
          if (booms.length) text(ctx, 'BOOM!', lx, ly - 54, { align: 'center', size: 22, weight: 700, color: C.amber });
        }
      },
      stats() {
        return [
          { label: 'Mach number', value: params.mach.toFixed(2), color: params.mach >= 1 ? C.amber : undefined },
          { label: 'Heard / emitted', value: fHeard ? (fHeard / params.freq).toFixed(2) + '×' : 'silence' },
          { label: 'Cone half-angle', value: params.mach > 1 ? ((Math.asin(1 / params.mach) * 180) / Math.PI).toFixed(1) + '°' : '—' },
        ];
      },
      charts() {
        return [{ title: 'Pitch heard by the listener', series: [{ data: heard.data.map((f) => f / params.freq), color: '#38d6f5' }], min: 0, max: 3.2, length: 240, yMaxLabel: '3×' }];
      },
      destroy() {
        ensureAudio(false);
      },
    };
  },
};
