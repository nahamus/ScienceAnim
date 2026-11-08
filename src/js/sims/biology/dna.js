import { C, TAU, clamp, smoothstep, lerp, backdrop, tag, text, drawGlow, rgba, seeded } from '../../core/util.js';

const BASE_COL = { A: '#ff5f6d', T: '#ffc145', G: '#38d6f5', C: '#2ee6a6', U: '#c084fc' };
const PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' };
const CODONS = [
  ['GCT', 'Ala', '#ff8a3d'], ['TGG', 'Trp', '#a78bfa'], ['AAA', 'Lys', '#5b8cff'], ['GAA', 'Glu', '#ff4d6d'],
  ['CTG', 'Leu', '#2ee6a6'], ['TTT', 'Phe', '#ffd166'], ['GGC', 'Gly', '#9be4ff'], ['AGC', 'Ser', '#ff5fa2'],
  ['CAT', 'His', '#a3e635'], ['ACC', 'Thr', '#38d6f5'],
];

function makeGene() {
  const r = seeded(7);
  const cod = [['ATG', 'Met', '#ffffff']];
  for (let i = 0; i < 12; i++) cod.push(CODONS[Math.floor(r() * CODONS.length)]);
  cod.push(['TAA', 'STOP', '#888']);
  const seq = 'GCA' + cod.map((c) => c[0]).join('') + 'CGT';
  return { seq: seq.split(''), cod, start: 3 };
}

export default {
  id: 'dna',
  title: 'DNA: The Code of Life',
  category: 'biology',
  tagline: 'Watch DNA unzip, copy itself, and get read out into a protein.',
  ages: ['14-16', '16+'],
  topics: ['Genetics', 'Cells'],
  blurb:
    'Every cell carries instructions written in a four-letter chemical alphabet along a twisted ladder: DNA. Here you can watch the three processes at the heart of all life: copying the DNA before a cell divides, transcribing a gene into a messenger RNA, and translating that message into a protein, one amino acid at a time.',
  ideas: [
    'DNA is two strands twisted into a <b>double helix</b>, joined by base pairs.',
    'Bases always pair the same way: <b>A with T</b>, <b>G with C</b>. Each strand defines the other.',
    'To copy DNA, the helix unzips and each half templates a new partner.',
    'A gene is <b>transcribed</b> into RNA, then <b>translated</b> three letters (a codon) at a time into a protein.',
  ],
  hint: 'Pick a process in the Controls panel',
  thumbChapter: 0,
  thumbFrames: 30,
  params: [
    { key: 'mode', label: 'Process', type: 'select', value: 'helix', options: [{ value: 'helix', label: 'Double helix' }, { value: 'replicate', label: 'Replication' }, { value: 'transcribe', label: 'Transcription' }, { value: 'translate', label: 'Translation' }] },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.2, max: 3, step: 0.05, value: 1, format: (v) => v.toFixed(2) + '×' },
    { key: 'letters', label: 'Show letters', type: 'toggle', value: true },
    { key: 'restart', label: 'Restart process', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'The double helix',
      text: 'This is DNA: two long strands wound around each other like a twisted ladder. The sides are sugar-phosphate backbones; each rung is a pair of <b>bases</b>. Your cells hold about two metres of it, folded into a nucleus a hundredth of a millimetre wide.',
      params: { mode: 'helix', letters: false, speed: 1 },
      duration: 12,
    },
    {
      title: 'A four-letter alphabet',
      text: 'There are four bases: <b style="color:#ff5f6d">A</b>, <b style="color:#ffc145">T</b>, <b style="color:#38d6f5">G</b> and <b style="color:#2ee6a6">C</b>. They pair only one way — A with T, G with C — so each strand is a mirror-image backup of the other. The order of letters is the genetic code.',
      formula: 'A ═ T      G ≡ C',
      params: { mode: 'helix', letters: true },
      duration: 13,
    },
    {
      title: 'Copying: replication',
      text: 'Before a cell divides it copies all its DNA. An enzyme (helicase) <b>unzips</b> the ladder. Free bases floating nearby snap onto each exposed strand following the pairing rule, giving two identical double helices — each half old, half new.',
      params: { mode: 'replicate', letters: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Reading a gene: transcription',
      text: 'To use a gene, RNA polymerase opens a small bubble in the DNA and builds a matching <b>messenger RNA</b>. RNA uses <b style="color:#c084fc">U</b> instead of T. The message peels away and leaves the nucleus, while the DNA zips closed again.',
      params: { mode: 'transcribe', letters: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Building a protein: translation',
      text: 'A ribosome reads the RNA three letters at a time. Each <b>codon</b> calls for one amino acid, delivered by a transfer RNA. They link into a chain that folds into a protein — an enzyme, a muscle fibre, a hormone. A STOP codon ends it.',
      formula: 'AUG → Met,  GCU → Ala,  UGG → Trp,  …,  UAA → STOP',
      params: { mode: 'translate', letters: true, speed: 1 },
      enter: (s) => s.restart(),
      duration: 22,
    },
    {
      title: 'Explore',
      text: 'Switch between the processes and change the speed. Real cells do all this astonishingly fast: DNA polymerase adds about 50 bases per second, ribosomes about 5 amino acids per second.',
      params: { mode: 'helix', letters: true },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const gene = makeGene();
    const seq = gene.seq, n = seq.length;
    const rnaOf = (b) => (b === 'T' ? 'U' : b);
    let rot = 0, flat = 0, prog = -3, cam = 0, done = 0;
    const floaters = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), b: 'ATGC'[Math.floor(Math.random() * 4)], vx: (Math.random() - 0.5) * 0.02, vy: (Math.random() - 0.5) * 0.02, a: Math.random() * TAU }));
    const jitter = Array.from({ length: n }, () => [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2]);

    function restart() {
      prog = params.mode === 'translate' ? -0.6 : -3;
      done = 0;
    }

    const geom = () => {
      const { w, h } = api;
      const sp = clamp(w / 34, 15, 26);
      const R = clamp(h * 0.09, 34, 60);
      return { sp, R, cy: Math.max(220, h * 0.44) };
    };

    return {
      restart,
      reset: restart,
      onParam(k) {
        if (k === 'mode') restart();
      },
      update(dt) {
        const flatTarget = params.mode === 'helix' ? 0 : 1;
        flat += (flatTarget - flat) * Math.min(1, dt * 2.2);
        rot += dt * (params.mode === 'helix' ? 0.9 : 0.9 * (1 - flat)) * params.speed;
        const rate = params.mode === 'replicate' ? 2.2 : params.mode === 'transcribe' ? 2 : 0.55;
        if (params.mode !== 'helix' && flat > 0.9) {
          if (params.mode === 'translate') {
            const stopAt = gene.cod.length - 1;
            if (prog < stopAt) prog = Math.min(stopAt, prog + dt * rate * params.speed);
            else if ((done += dt) > 4) restart();
          } else if (prog < n + 6) prog += dt * rate * params.speed;
          else if ((done += dt) > 3) restart();
        }
        for (const f of floaters) {
          f.x = (f.x + f.vx * dt + 1) % 1;
          f.y = (f.y + f.vy * dt + 1) % 1;
          f.a += dt * 0.5;
        }
        // camera follows the action
        const { w } = api;
        const { sp } = geom();
        const total = n * sp;
        let focus = total / 2;
        if (params.mode === 'replicate' || params.mode === 'transcribe') focus = prog * sp;
        if (params.mode === 'translate') focus = (gene.start + prog * 3 + 1.5) * sp;
        const target = total < w - 80 ? (total - w) / 2 : clamp(focus - w * 0.55, -40, total - w + 40);
        cam += (target - cam) * Math.min(1, dt * 2.5);
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0d0f24', grid: false });
        const { sp, R, cy } = geom();
        const X = (i) => i * sp - cam;

        // floating free nucleotides in the background
        if (params.mode === 'replicate') {
          for (const f of floaters) {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = BASE_COL[f.b];
            ctx.save();
            ctx.translate(f.x * w, f.y * h);
            ctx.rotate(f.a);
            ctx.fillRect(-6, -2, 12, 4);
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        }

        const rung = (x, y1, y2, b1, b2, alpha = 1, lw = 4) => {
          const ym = (y1 + y2) / 2;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = lw;
          ctx.lineCap = 'round';
          ctx.strokeStyle = BASE_COL[b1];
          ctx.beginPath();
          ctx.moveTo(x, y1);
          ctx.lineTo(x, ym - 1);
          ctx.stroke();
          ctx.strokeStyle = BASE_COL[b2];
          ctx.beginPath();
          ctx.moveTo(x, ym + 1);
          ctx.lineTo(x, y2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        };
        const letter = (b, x, y, a = 1) => {
          if (!params.letters || api.thumbnail || sp < 15) return;
          text(ctx, b, x, y, { size: 11, align: 'center', weight: 700, color: BASE_COL[b], alpha: a, mono: true });
        };
        const backbone = (pts, col, width = 4) => {
          ctx.strokeStyle = col;
          ctx.lineWidth = width;
          ctx.lineJoin = ctx.lineCap = 'round';
          ctx.beginPath();
          pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y));
          ctx.stroke();
        };

        const lo = Math.max(0, Math.floor(cam / sp) - 2), hi = Math.min(n - 1, Math.ceil((cam + w) / sp) + 2);

        if (params.mode === 'translate' && flat > 0.6) {
          this.drawTranslation(X, sp, cy, lo, hi, backbone, letter);
          return;
        }

        // positions for both parent strands (helix → flat ladder morph)
        const A = [], B = [];
        for (let i = 0; i < n; i++) {
          const th = i * (TAU / 10) + rot;
          const tb = th + 2.6;
          const ya = lerp(cy + R * Math.sin(th), cy - R, flat);
          const yb = lerp(cy + R * Math.sin(tb), cy + R, flat);
          A.push({ x: X(i), y: ya, z: lerp(Math.cos(th), 1, flat) });
          B.push({ x: X(i), y: yb, z: lerp(Math.cos(tb), 1, flat) });
        }

        if (params.mode === 'helix' || flat < 0.98) {
          // back backbone segments, rungs, front backbone segments
          const seg = (S, col, front) => {
            for (let i = lo; i < hi; i++) {
              const zf = (S[i].z + S[i + 1].z) / 2;
              if (zf >= 0 !== front) continue;
              ctx.strokeStyle = rgba(col, front ? 1 : 0.35);
              ctx.lineWidth = 3 + 3 * Math.max(0, zf);
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(S[i].x, S[i].y);
              ctx.lineTo(S[i + 1].x, S[i + 1].y);
              ctx.stroke();
            }
          };
          seg(A, '#5b8cff', false);
          seg(B, '#a78bfa', false);
          for (let i = lo; i <= hi; i++) {
            const z = (A[i].z + B[i].z) / 2;
            rung(A[i].x, A[i].y, B[i].y, seq[i], PAIR[seq[i]], 0.45 + 0.55 * (z + 1) / 2, 3 + 1.5 * (z + 1) / 2);
          }
          seg(A, '#5b8cff', true);
          seg(B, '#a78bfa', true);
          ctx.globalCompositeOperation = 'lighter';
          for (let i = lo; i <= hi; i += 1) {
            if (A[i].z > 0.3) drawGlow(ctx, A[i].x, A[i].y, 7, '#5b8cff', 0.3);
            if (B[i].z > 0.3) drawGlow(ctx, B[i].x, B[i].y, 7, '#a78bfa', 0.3);
          }
          ctx.globalCompositeOperation = 'source-over';
          if (params.letters && flat < 0.2)
            for (let i = lo; i <= hi; i++) {
              if (A[i].z > 0.6) letter(seq[i], A[i].x, A[i].y - 14 * Math.sign(cy - A[i].y || 1));
            }
          if (!api.thumbnail && params.mode === 'helix') {
            tag(ctx, 'sugar-phosphate backbone', X(Math.min(hi, 6)), cy - R - 34, '#5b8cff', { align: 'center', size: 10 });
            tag(ctx, 'base pairs', X(Math.min(hi, 14)), cy + R + 34, C.amber, { align: 'center', size: 10 });
          }
          return;
        }

        if (params.mode === 'replicate') {
          const G = R + 34;
          const topA = [], botB = [], newA = [], newB = [];
          for (let i = 0; i < n; i++) {
            const o = smoothstep(0, 5, prog - i);
            const ya = cy - R - o * G, yb = cy + R + o * G;
            topA.push([X(i), ya]);
            botB.push([X(i), yb]);
            const m = smoothstep(2, 6, prog - i);
            newA.push({ m, x: X(i) + jitter[i][0] * 40 * (1 - m), y: ya + 2 * R + jitter[i][1] * 50 * (1 - m) });
            newB.push({ m, x: X(i) + jitter[i][1] * 40 * (1 - m), y: yb - 2 * R + jitter[i][0] * 50 * (1 - m) });
          }
          for (let i = lo; i <= hi; i++) {
            const o = smoothstep(0, 5, prog - i);
            if (o < 0.02) rung(X(i), topA[i][1], botB[i][1], seq[i], PAIR[seq[i]]);
            else {
              // parent halves
              const b1 = seq[i], b2 = PAIR[b1];
              ctx.lineWidth = 4;
              ctx.strokeStyle = BASE_COL[b1];
              ctx.beginPath();
              ctx.moveTo(topA[i][0], topA[i][1]);
              ctx.lineTo(topA[i][0], topA[i][1] + R - 1);
              ctx.stroke();
              ctx.strokeStyle = BASE_COL[b2];
              ctx.beginPath();
              ctx.moveTo(botB[i][0], botB[i][1]);
              ctx.lineTo(botB[i][0], botB[i][1] - R + 1);
              ctx.stroke();
              // incoming new halves
              const na = newA[i], nb = newB[i];
              if (na.m > 0.01 || prog - i > 1) {
                ctx.globalAlpha = 0.3 + 0.7 * na.m;
                ctx.strokeStyle = BASE_COL[b2];
                ctx.beginPath();
                ctx.moveTo(na.x, na.y);
                ctx.lineTo(na.x, na.y - R + 1);
                ctx.stroke();
                ctx.strokeStyle = BASE_COL[b1];
                ctx.beginPath();
                ctx.moveTo(nb.x, nb.y);
                ctx.lineTo(nb.x, nb.y + R - 1);
                ctx.stroke();
                ctx.globalAlpha = 1;
              }
            }
          }
          backbone(topA.slice(lo, hi + 1), '#5b8cff');
          backbone(botB.slice(lo, hi + 1), '#a78bfa');
          const built = (arr) => arr.slice(lo, hi + 1).filter((p) => p.m > 0.98).map((p) => [p.x, p.y]);
          const nA = built(newA), nB = built(newB);
          if (nA.length > 1) backbone(nA, C.pink);
          if (nB.length > 1) backbone(nB, C.pink);
          for (let i = lo; i <= hi; i++) {
            letter(seq[i], X(i), topA[i][1] - 12);
            letter(PAIR[seq[i]], X(i), botB[i][1] + 12);
          }
          // helicase at the fork
          const fx = X(prog), fy = cy;
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, fx + 8, fy, 46, '#ffb547', 0.25);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = 'rgba(255,181,71,0.85)';
          ctx.beginPath();
          ctx.arc(fx + 8, fy, 17, 0.5, TAU - 0.5);
          ctx.lineTo(fx + 8, fy);
          ctx.fill();
          if (!api.thumbnail) {
            tag(ctx, 'helicase', fx + 8, fy - 36, C.amber, { align: 'center', size: 10 });
            if (prog > 8) {
              tag(ctx, 'old strand', X(Math.max(lo + 2, prog - 10)), cy - R - G - 22, '#5b8cff', { align: 'center', size: 10 });
              tag(ctx, 'new strand', X(Math.max(lo + 2, prog - 10)), cy - R - G + 2 * R + 22, C.pink, { align: 'center', size: 10 });
            }
          }
          return;
        }

        // transcription
        const Gt = 26;
        const topA = [], botB = [];
        for (let i = 0; i < n; i++) {
          const d = Math.abs(i - prog);
          const o = 1 - smoothstep(3, 6, d);
          topA.push([X(i), cy - R - o * Gt]);
          botB.push([X(i), cy + R + o * Gt]);
        }
        for (let i = lo; i <= hi; i++) {
          const o = 1 - smoothstep(3, 6, Math.abs(i - prog));
          if (o < 0.05) rung(X(i), topA[i][1], botB[i][1], seq[i], PAIR[seq[i]]);
          else {
            ctx.lineWidth = 4;
            ctx.strokeStyle = BASE_COL[seq[i]];
            ctx.beginPath();
            ctx.moveTo(topA[i][0], topA[i][1]);
            ctx.lineTo(topA[i][0], topA[i][1] + R * (1 - o) + 6);
            ctx.stroke();
            ctx.strokeStyle = BASE_COL[PAIR[seq[i]]];
            ctx.beginPath();
            ctx.moveTo(botB[i][0], botB[i][1]);
            ctx.lineTo(botB[i][0], botB[i][1] - R * 0.9);
            ctx.stroke();
          }
        }
        backbone(topA.slice(lo, hi + 1), '#5b8cff');
        backbone(botB.slice(lo, hi + 1), '#a78bfa');
        // mRNA: pairs with template (bottom) strand inside the bubble, then peels away upward
        const rna = [];
        for (let i = Math.floor(prog); i >= 0; i--) {
          const k = prog - i;
          let x, y;
          if (k < 3.5) {
            x = X(i);
            y = cy + R + Gt - 2 * R * 0.9 - 4;
          } else {
            const kk = k - 3.5;
            x = X(prog - 3.5) - kk * sp * 0.82;
            y = cy + R + Gt - 2 * R * 0.9 - 4 - kk * kk * 1.4 - kk * 4;
          }
          rna.push({ x, y, b: rnaOf(seq[i]) });
        }
        if (rna.length > 1) {
          backbone(rna.map((r) => [r.x, r.y]), C.amber, 3.5);
          for (const r of rna) {
            ctx.strokeStyle = BASE_COL[r.b];
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(r.x, r.y);
            ctx.lineTo(r.x, r.y + 12);
            ctx.stroke();
            letter(r.b, r.x, r.y - 11);
          }
        }
        for (let i = lo; i <= hi; i++) {
          letter(seq[i], X(i), topA[i][1] - 12, 0.7);
          letter(PAIR[seq[i]], X(i), botB[i][1] + 12, 0.7);
        }
        const px = X(prog);
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, px, cy, 80, '#2ee6a6', 0.3);
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(46,230,166,0.6)';
        ctx.fillStyle = 'rgba(46,230,166,0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(px, cy, sp * 4, R + Gt + 18, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        if (!api.thumbnail) {
          tag(ctx, 'RNA polymerase', px, cy + R + Gt + 34, C.teal, { align: 'center', size: 10 });
          tag(ctx, 'template strand', X(Math.min(hi - 3, prog + 9)), cy + R + 30, '#a78bfa', { align: 'center', size: 10 });
          if (rna.length > 8) tag(ctx, 'messenger RNA', rna[rna.length - 1].x + 10, Math.max(90, rna[rna.length - 1].y - 24), C.amber, { align: 'center', size: 10 });
        }
      },
      drawTranslation(X, sp, cy, lo, hi, backbone, letter) {
        const { w } = api;
        const y = cy + 40;
        const pts = [];
        for (let i = lo; i <= hi; i++) pts.push([X(i), y]);
        backbone(pts, C.amber, 3.5);
        const s0 = gene.start;
        for (let i = lo; i <= hi; i++) {
          const b = rnaOf(seq[i]);
          ctx.strokeStyle = BASE_COL[b];
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(X(i), y);
          ctx.lineTo(X(i), y - 13);
          ctx.stroke();
          letter(b, X(i), y + 14);
        }
        // codon brackets
        ctx.strokeStyle = 'rgba(233,237,247,0.25)';
        ctx.lineWidth = 1;
        for (let c = 0; c < gene.cod.length; c++) {
          const x0 = X(s0 + c * 3) - sp * 0.4, x1 = X(s0 + c * 3 + 2) + sp * 0.4;
          ctx.beginPath();
          ctx.moveTo(x0, y + 24);
          ctx.lineTo(x0, y + 28);
          ctx.lineTo(x1, y + 28);
          ctx.lineTo(x1, y + 24);
          ctx.stroke();
        }
        const c = Math.max(0, prog);
        const ci = Math.floor(c), frac = c - ci;
        const rx = X(s0 + c * 3 + 1);
        // protein chain: amino acids for codons already read
        const made = Math.min(ci, gene.cod.length - 1);
        let px = rx - sp * 1.5, py = y - 70;
        const beads = [];
        for (let m = made - 1; m >= 0; m--) {
          beads.push({ x: px, y: py, cod: gene.cod[m] });
          const k = made - 1 - m;
          const ang = -Math.PI / 2 - 0.9 + Math.sin(k * 1.25) * 1.1;
          px += Math.cos(ang) * 24;
          py += Math.sin(ang) * 24;
          py = Math.max(80, py);
        }
        if (beads.length > 1) {
          ctx.strokeStyle = 'rgba(233,237,247,0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          beads.forEach((b, i) => ctx[i ? 'lineTo' : 'moveTo'](b.x, b.y));
          ctx.stroke();
        }
        for (const b of beads) {
          ctx.fillStyle = b.cod[2];
          ctx.beginPath();
          ctx.arc(b.x, b.y, 10, 0, TAU);
          ctx.fill();
          if (!api.thumbnail) text(ctx, b.cod[1], b.x, b.y + 0.5, { size: 8.5, align: 'center', weight: 700, color: '#0b0d18', shadow: false });
        }
        // incoming tRNA carrying the next amino acid
        const cur = gene.cod[Math.min(ci, gene.cod.length - 1)];
        if (cur[1] !== 'STOP') {
          const t = smoothstep(0, 0.6, frac);
          const tx = X(s0 + ci * 3 + 1), ty = y - 40 - (1 - t) * 110;
          ctx.globalAlpha = 0.25 + 0.75 * t;
          ctx.strokeStyle = '#ff9fcf';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(tx - sp, ty + 22);
          ctx.lineTo(tx + sp, ty + 22);
          ctx.moveTo(tx, ty + 22);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.fillStyle = cur[2];
          ctx.beginPath();
          ctx.arc(tx, ty - 8, 10, 0, TAU);
          ctx.fill();
          if (!api.thumbnail) text(ctx, cur[1], tx, ty - 7.5, { size: 8.5, align: 'center', weight: 700, color: '#0b0d18', shadow: false });
          ctx.globalAlpha = 1;
        }
        // ribosome (two subunits)
        ctx.fillStyle = 'rgba(120,140,255,0.22)';
        ctx.strokeStyle = 'rgba(160,180,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(rx, y - 30, sp * 3.2, 40, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(rx, y + 22, sp * 2.6, 20, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        if (!api.thumbnail) {
          tag(ctx, 'ribosome', rx, y + 58, '#a0b4ff', { align: 'center', size: 10 });
          const codonTxt = cur[0].replace(/T/g, 'U');
          tag(ctx, cur[1] === 'STOP' ? `${codonTxt} → STOP: protein released` : `codon ${codonTxt} → ${cur[1]}`, Math.min(w - 120, Math.max(120, rx)), y + 84, cur[1] === 'STOP' ? C.red : C.amber, { align: 'center', size: 11 });
          if (beads.length > 3) tag(ctx, 'growing protein', beads[beads.length - 1].x, Math.max(80, beads[beads.length - 1].y - 22), C.ink, { align: 'center', size: 10 });
        }
      },
      stats() {
        const m = params.mode;
        let gc = 0;
        for (const b of seq) if (b === 'G' || b === 'C') gc++;
        const out = [{ label: 'Sequence length', value: n + ' base pairs' }, { label: 'GC content', value: ((gc / n) * 100).toFixed(0) + ' %' }];
        if (m === 'replicate') out.push({ label: 'Bases copied', value: String(clamp(Math.floor(prog - 2), 0, n)), color: C.pink });
        if (m === 'transcribe') out.push({ label: 'RNA length', value: String(clamp(Math.floor(prog) + 1, 0, n)) + ' nt', color: C.amber });
        if (m === 'translate') out.push({ label: 'Amino acids linked', value: String(clamp(Math.floor(prog), 0, gene.cod.length - 1)), color: C.amber });
        return out;
      },
    };
  },
};
