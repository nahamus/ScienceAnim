import { C, backdrop, clamp, tag, text } from '../../core/util.js';

// Snowflake growth with Reiter's hexagonal cellular model (2005). Each cell of a hex grid holds an amount of water;
// `pace` evens out how fast each style grows on screen (plates gain far more per step than branching stars).
// ice cells (≥ 1) and their neighbours are "receptive": they keep what they have and gain more, while vapour
// elsewhere diffuses. Arms grow because their tips reach out into fresher vapour.

const KINDS = {
  plate: { b: 0.95, g: 0, pace: 0.012, name: 'hexagonal plate', where: 'about −2 °C, or −10 to −20 °C in drier air' },
  star: { b: 0.8, g: 0.002, pace: 0.12, name: 'simple star', where: 'around −12 °C' },
  stellar: { b: 0.35, g: 0.001, pace: 1, name: 'stellar dendrite', where: 'about −15 °C, humid' },
  fern: { b: 0.3, g: 0.0001, pace: 1.6, name: 'fern-like star', where: 'about −15 °C, very humid' },
};
const DIARY = ['plate', 'stellar', 'plate', 'fern', 'star'];

export default {
  id: 'snowflakes',
  title: 'How Snowflakes Grow',
  category: 'chemistry',
  tagline: 'Why every snowflake has six arms, and why the arms match each other but no two flakes match.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Crystals', 'Water', 'Patterns'],
  keywords: ['snowflake', 'ice', 'crystal growth', 'hexagonal', 'hydrogen bond', 'dendrite', 'Nakaya', 'Bentley', 'diffusion', 'Reiter'],
  blurb:
    'A snowflake starts as a speck of ice no bigger than a dust grain. Water molecules lock together in a hexagonal pattern, so the crystal has six sides. As it falls, vapour freezes onto it, and the corners, poking out into fresher air, grow fastest into arms that branch again and again. Watch flakes grow and see how the weather they fall through is written into their shape.',
  ideas: [
    'Water molecules in ice link up in a <b>hexagonal</b> lattice, so ice crystals have six-fold symmetry.',
    'A snowflake grows from <b>vapour</b> freezing onto it, not from frozen raindrops.',
    'Tips stick out into fresher vapour and grow faster than the flat faces between them: this is why <b>arms and branches</b> form.',
    'All six arms grow at the same time in the same air, so they come out <b>alike</b>.',
    'Temperature and humidity decide the shape, so each flake records the path it fell along.',
  ],
  hint: 'Change the conditions while a flake is growing',
  renderScale: 1,
  thumbChapter: 3,
  thumbFrames: 520,
  params: [
    { key: 'kind', label: 'Conditions in the cloud', type: 'select', value: 'stellar', options: Object.entries(KINDS).map(([k, v]) => ({ value: k, label: v.name })) },
    { key: 'speed', label: 'Growth speed', type: 'range', min: 0.2, max: 3, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'vapour', label: 'Show the water vapour', type: 'toggle', value: false },
    { key: 'diary', label: 'Weather keeps changing', type: 'toggle', value: false },
    // a quick-check screen shows a finished flake instead of a bare seed
    { key: 'pregrow', label: 'pregrow', type: 'range', min: 0, max: 1, step: 1, value: 0, hidden: true, instant: true },
    { key: 'again', label: 'New flake', type: 'button', action: (s) => s.seed() },
  ],
  story: [
    {
      title: 'A speck of ice',
      text: 'High in a cloud, a few water molecules freeze onto a speck of dust. Ice is a crystal: each molecule hydrogen-bonds to four neighbours, and the pattern they make is <b>hexagonal</b>. So the tiny crystal is a six-sided plate.',
      params: { kind: 'plate', speed: 0.4, vapour: false, diary: false },
      enter: (s) => s.seed(),
      duration: 12,
    },
    {
      title: 'Fed by vapour',
      text: 'A snowflake doesn’t form from a frozen raindrop. Water vapour drifts to the crystal and freezes straight onto it. Near the flake the air is used up (the dark halo), so the vapour has to diffuse in from further away.',
      params: { kind: 'stellar', speed: 0.6, vapour: true },
      enter: (s) => s.seed(),
      duration: 15,
    },
    {
      title: 'The corners win',
      text: 'The six corners stick out furthest into fresh vapour, so they grow fastest and become <b>arms</b>. Each arm’s edges then stick out too and sprout side branches, and so on: tiny bumps run away into branches. This is why snowflakes are so intricate.',
      params: { kind: 'stellar', speed: 1, vapour: false },
      enter: (s) => s.seed(),
      duration: 15,
    },
    {
      title: 'Six matching arms',
      text: 'Look closely: all six arms carry the same pattern of side branches.',
      check: {
        q: 'Why are the six arms of a snowflake so alike?',
        options: ['They all grew at the same time in the same conditions', 'Each arm copies the shape of the others', 'The wind shapes them all equally'],
        answer: 0,
        setup: { kind: 'stellar', speed: 1, pregrow: 1 },
        explain: 'The arms can’t communicate: the flake is far too small for that to matter. But they are all only a millimetre apart, so they feel the same temperature and humidity at every moment, and respond in the same way.',
      },
      params: { kind: 'fern', speed: 1.2, pregrow: 0 },
      enter: (s) => s.seed(),
      duration: 15,
    },
    {
      title: 'A diary of the weather',
      text: 'As a flake falls for half an hour or more it passes through warmer and colder, wetter and drier air. Each change switches the growth style: plates, then branches, then plates again on the tips of the arms. The finished flake is a record of its journey.',
      check: {
        q: 'A snowflake has long branching arms with flat plates on their tips. What happened as it fell?',
        options: ['The conditions changed late in its growth', 'It broke and was glued back together', 'Nothing: all snowflakes look like this'],
        answer: 0,
        setup: { kind: 'stellar', speed: 1, diary: false, pregrow: 1 },
        explain: 'The arms branch while conditions favour branching; when the air changes, every tip switches to growing plates at the same moment. Reading a flake from the middle out tells you the weather it fell through.',
      },
      params: { speed: 1, diary: true, pregrow: 0 },
      enter: (s) => s.seed(),
      duration: 18,
    },
    {
      title: 'Nakaya’s map',
      text: 'In the 1930s Ukichiro Nakaya grew the first artificial snowflakes and mapped their shapes. Thin plates form near −2 °C, needles and columns near −5 °C, and the big feathery stars around −15 °C when the air is humid. (Needles and columns grow in 3D, so this flat model can’t show them.)',
      params: { kind: 'plate', speed: 1, diary: false },
      enter: (s) => s.seed(),
      duration: 15,
    },
    {
      title: 'No two alike',
      text: 'Wilson Bentley photographed over 5,000 snowflakes from 1885 onwards and never found two the same. With so many branches, each set by the exact path a flake fell along, two identical complex flakes are vanishingly unlikely. Simple tiny plates, though, can look identical.',
      params: { kind: 'fern', speed: 1.2, diary: true },
      enter: (s) => s.seed(),
      duration: 16,
    },
    {
      title: 'Grow your own',
      text: 'Pick conditions and switch them while the flake grows. Can you make a star with plate tips, or a plate with branches?',
      params: { kind: 'stellar', speed: 1, diary: false },
      enter: (s) => s.seed(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let N = 0, c = 0, S, U, REC, DIST, off, octx, img, R = 0, steps = 0, acc = 0, diaryT = 0, diaryI = 0, doneT = 0, kindNow = 'stellar';
    const NB = () => [N, -N, 1, -1, N - 1, -N + 1];

    function alloc() {
      N = api.thumbnail ? 121 : 161;
      c = N >> 1;
      S = new Float32Array(N * N);
      U = new Float32Array(N * N);
      REC = new Uint8Array(N * N);
      DIST = new Int16Array(N * N);
      for (let q = 0; q < N; q++)
        for (let r = 0; r < N; r++) {
          const a = q - c, b = r - c;
          DIST[r * N + q] = Math.max(Math.abs(a), Math.abs(b), Math.abs(a + b));
        }
      off = document.createElement('canvas');
      off.width = N;
      off.height = N;
      octx = off.getContext('2d');
      img = octx.createImageData(N, N);
    }
    const K = () => KINDS[kindNow] || KINDS.stellar;
    function seed() {
      if (!N) alloc();
      kindNow = params.kind;
      if (params.diary) (diaryI = 0), (kindNow = DIARY[0]), (diaryT = 0);
      S.fill(K().b);
      S[c * N + c] = 1;
      R = 0;
      steps = 0;
      doneT = 0;
    }
    /** The cloud changes: the vapour away from the flake takes the new level at once. */
    function setKind(k) {
      kindNow = k;
      const b = K().b;
      for (let i = 0; i < N * N; i++) if (S[i] < 1 && !REC[i]) S[i] = b;
    }
    function step() {
      const b = K().b, g = K().g, nb = NB();
      for (let i = 0; i < N * N; i++) {
        if (DIST[i] >= c - 1) {
          REC[i] = 0;
          continue;
        }
        let r = S[i] >= 1;
        if (!r) for (let k = 0; k < 6; k++) if (S[i + nb[k]] >= 1) {
          r = true;
          break;
        }
        REC[i] = r ? 1 : 0;
      }
      for (let i = 0; i < N * N; i++) U[i] = REC[i] ? 0 : S[i];
      for (let i = 0; i < N * N; i++) {
        if (DIST[i] >= c - 1) {
          S[i] = b;
          continue;
        }
        let sum = 0;
        for (let k = 0; k < 6; k++) sum += U[i + nb[k]];
        S[i] = REC[i] ? S[i] + g + sum / 12 : U[i] + (sum - 6 * U[i]) / 12;
      }
      steps++;
    }
    function radius() {
      let m = 0;
      for (let i = 0; i < N * N; i++) if (S[i] >= 1 && DIST[i] > m) m = DIST[i];
      return m;
    }

    function growAll() {
      seed();
      const t0 = performance.now();
      for (let k = 0; R < c - 8 && performance.now() - t0 < 700; k++) {
        step();
        if (k % 20 === 0) R = radius();
      }
    }

    return {
      seed,
      reset: seed,
      resize() {
        if (!N) {
          alloc();
          seed();
          if (params.pregrow) growAll();
        }
      },
      onParam(k, v) {
        if (k === 'kind' && N) setKind(v);
        if (k === 'diary' && v && N) (diaryT = 0), (diaryI = 0), setKind(DIARY[0]);
        if (k === 'diary' && !v && N) setKind(params.kind);
        if (k === 'pregrow' && v && N) growAll();
      },
      pointerDown() {
        seed();
      },
      update(dt) {
        if (!N) return;
        dt = Math.min(dt, 0.05);
        const grown = R >= c - 8;
        if (grown) {
          doneT += dt;
          if (doneT > 6 && !api.thumbnail) seed();
          return;
        }
        if (params.diary) {
          // the flake falls through changing air: the growth style switches every few seconds
          diaryT += dt * params.speed;
          const every = 2.4;
          if (diaryT > every && diaryI < DIARY.length - 1) {
            diaryT = 0;
            diaryI++;
            setKind(DIARY[diaryI]);
          }
        }
        acc += 10 * params.speed * K().pace;
        const n = Math.floor(acc), t0 = performance.now();
        acc -= n;
        for (let s = 0; s < n; s++) {
          step();
          if (!api.thumbnail && performance.now() - t0 > 9) break;
        }
        if (api.frame % 6 === 0) R = radius();
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0d1a33', edge: '#03060f', grid: false });
        if (!N) return;
        const b = K().b, d = img.data;
        for (let i = 0, j = 0; i < N * N; i++, j += 4) {
          const v = S[i];
          if (v >= 1) {
            // ice: brighter where it is thicker, so ridges and growth bands show
            const k = clamp((v - 1) * 2.2, 0, 1);
            d[j] = 150 + k * 105;
            d[j + 1] = 190 + k * 65;
            d[j + 2] = 255;
            d[j + 3] = 255;
          } else if (params.vapour && DIST[i] < c - 1) {
            const k = clamp(v / Math.max(0.3, b), 0, 1);
            d[j] = 40 * k;
            d[j + 1] = 90 * k;
            d[j + 2] = 160 * k;
            d[j + 3] = 200;
          } else d[j + 3] = 0;
        }
        octx.putImageData(img, 0, 0);
        // draw the axial grid as hexagons: x = q + r/2, y = (√3/2) r
        const wide = w >= 760;
        const cx = wide ? w * 0.56 : w / 2, cy = wide ? h * 0.44 : h * 0.42;
        const sc = (Math.min(wide ? w * 0.7 : w, h * (wide ? 0.78 : 0.7)) / (N * 1.0)) * 1.0;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.transform(sc, 0, sc * 0.5, sc * 0.866, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.shadowColor = 'rgba(160,200,255,0.55)';
        ctx.shadowBlur = 10;
        ctx.drawImage(off, -c - 0.5, -c - 0.5);
        ctx.restore();
        if (api.thumbnail) return;
        const k = K();
        tag(ctx, `${k.name}  ·  ${k.where}`, w - 16, 84, C.cyan, { align: 'right', size: 11 });
        if (params.diary) {
          const label = DIARY.map((x, i) => (i === diaryI ? `[${KINDS[x].name}]` : KINDS[x].name)).join('  →  ');
          if (wide) text(ctx, label, w - 16, 110, { size: 10, align: 'right', color: C.dim });
        }
        // scale bar: the whole grid is about 4 mm across
        const mm = (N * sc) / 4;
        const bx = wide ? w - 40 - mm : 20, by = wide ? h - 30 : 120; // phones: clear of the hint at the foot
        ctx.fillStyle = 'rgba(233,237,247,0.7)';
        ctx.fillRect(bx, by, mm, 2);
        text(ctx, '1 mm', bx + mm / 2, by - 9, { size: 10, align: 'center', color: C.dim });
      },
      stats() {
        const k = K();
        return [
          { label: 'Growing as', value: k.name, color: C.cyan },
          { label: 'Width', value: ((2 * R * 4) / N).toFixed(1) + ' mm' },
          { label: 'Growth steps', value: String(steps) },
          { label: 'Typical conditions', value: k.where },
        ];
      },
    };
  },
};
