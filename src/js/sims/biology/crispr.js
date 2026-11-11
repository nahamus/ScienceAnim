import { C, TAU, clamp, lerp, roundRect, tag, text } from '../../core/util.js';

// CRISPR–Cas9. A made-up stretch of DNA (one strand shown 5′→3′ on top, its partner below). Cas9 carries a
// 20-letter guide RNA. It hops between PAM sites ("NGG", which it must bind first), unzips the DNA next to each
// one and compares the guide letter by letter, starting next to the PAM. Any mismatch in the 10 letters nearest
// the PAM (the "seed") makes it let go. Standard Cas9 still cuts with up to two mismatches far from the PAM;
// a high-fidelity version needs a perfect match. On a match it cuts both strands 3 letters from the PAM. The cell
// then repairs the break: quick end-joining (often adds or loses a letter, breaking the gene) or copying a
// supplied template (writing in a new sequence).

const BASES = 'ACGT';
const PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' };
const COL = { A: '#ff6b6b', T: '#ffd166', G: '#4cd97b', C: '#5fa8ff' };
const L = 520, GUIDE_LEN = 20, SEED = 10;
const T_TARGET = 392, T_OFF = 236, T_DECOY = 128; // start of each protospacer

function seeded(s) {
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function makeGenome(risky) {
  const r = seeded(31);
  const g = Array.from({ length: L }, () => BASES[(r() * 4) | 0]);
  const guide = 'GACTTCCACGTAGAGTCCAA'.split('');
  const put = (at, seq) => seq.forEach((b, i) => (g[at + i] = b));
  put(T_TARGET, [...guide, 'T', 'G', 'G']);
  // a decoy: matches far from the PAM but not in the seed
  const decoy = [...guide];
  decoy[17] = PAIR[decoy[17]];
  put(T_DECOY, [...decoy, 'A', 'G', 'G']);
  // an off-target: two mismatches far from the PAM (only placed when asked for)
  if (risky) {
    const off = [...guide];
    off[1] = PAIR[off[1]];
    off[4] = off[4] === 'A' ? 'C' : 'A';
    put(T_OFF, [...off, 'C', 'G', 'G']);
  }
  return { g, guide };
}
/** All PAM sites (start of the protospacer before each NGG), left to right. */
function pams(g) {
  const out = [];
  for (let i = GUIDE_LEN; i < L - 3; i++) if (g[i + 1] === 'G' && g[i + 2] === 'G') out.push(i - GUIDE_LEN);
  return out;
}

export default {
  id: 'crispr',
  title: 'CRISPR: Editing the Code of Life',
  category: 'biology',
  tagline: 'A bacterial immune system turned into molecular scissors that can find and rewrite one spot in DNA.',
  ages: ['14-16', '16+'],
  topics: ['Genetics', 'Biotechnology', 'Medicine'],
  keywords: ['CRISPR', 'Cas9', 'gene editing', 'genome editing', 'guide RNA', 'PAM', 'DNA', 'Doudna', 'Charpentier', 'Nobel prize', 'sickle cell', 'Casgevy', 'off-target', 'knockout', 'HDR', 'NHEJ', 'bacteria', 'phage'],
  blurb:
    'Bacteria fight viruses by keeping snippets of their DNA as mug shots and using a protein, Cas9, to cut any DNA that matches. In 2012 scientists realised the mug shot could be swapped for any sequence they liked, creating programmable molecular scissors. Watch Cas9 search the genome, check letter by letter, cut, and let the cell write in a new sequence. It has already led to an approved cure for sickle-cell disease.',
  ideas: [
    'CRISPR began as a <b>bacterial immune system</b> against viruses.',
    'Cas9 is guided by a 20-letter <b>guide RNA</b>; change the guide and you change the target.',
    'Cas9 only checks DNA next to a short tag called a <b>PAM</b> (NGG), and the letters nearest the PAM must match exactly.',
    'After the cut, quick repair often adds or loses letters (a <b>knockout</b>); copying a template can write in a chosen sequence (an <b>edit</b>).',
    'A near-match elsewhere can be cut by mistake: an <b>off-target</b> edit, the big safety question.',
  ],
  hint: 'Change the guide or the repair, then run the search again',
  thumbChapter: 3,
  thumbFrames: 420,
  params: [
    {
      key: 'guide', label: 'Guide RNA', type: 'select', value: 'match', instant: true,
      options: [
        { value: 'match', label: 'Matches the target' },
        { value: 'seed', label: 'One letter wrong near the PAM' },
        { value: 'distal', label: 'One letter wrong far from the PAM' },
      ],
    },
    {
      key: 'repair', label: 'After the cut', type: 'select', value: 'none', instant: true,
      options: [{ value: 'none', label: 'Just cut' }, { value: 'nhej', label: 'Quick repair' }, { value: 'hdr', label: 'Copy a template' }],
    },
    {
      key: 'fidelity', label: 'Cas9 version', type: 'select', value: 'standard', instant: true,
      options: [{ value: 'standard', label: 'Standard' }, { value: 'high', label: 'High-fidelity' }],
    },
    { key: 'risky', label: 'A near-match elsewhere in the DNA', type: 'toggle', value: false, instant: true },
    { key: 'virus', label: 'Inside a bacterium (virus DNA)', type: 'toggle', value: false, instant: true, hidden: true },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.3, max: 4, step: 0.1, value: 1, format: (v) => v.toFixed(1) + '×' },
    { key: 'again', label: 'Run the search again', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'A bacterial immune system',
      text: 'Bacteria are attacked by viruses too. Many keep a library of short snippets of DNA from viruses that attacked them before: their “CRISPR” mug shots. A protein called <b>Cas9</b> carries a copy of one snippet as a guide and patrols the cell. When a virus injects DNA that matches, Cas9 cuts it in two and the infection is stopped.',
      params: { virus: true, guide: 'match', repair: 'none', fidelity: 'standard', risky: false, speed: 1.6 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'A programmable search engine',
      text: 'In 2012 Jennifer Doudna and Emmanuelle Charpentier showed that the guide can be written to match <i>any</i> DNA sequence (they shared the 2020 Nobel Prize). Now Cas9 is searching human DNA. It can only grab DNA at a short tag, the <b>PAM</b> (any letter then GG). At each PAM it unzips a few letters and compares; if they don’t match, it lets go and hops on.',
      params: { virus: false, guide: 'match', repair: 'none', fidelity: 'standard', risky: false, speed: 1 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Checking letter by letter',
      text: 'Cas9 compares the guide (RNA, which uses U instead of T) with the DNA starting next to the PAM. The 10 letters nearest the PAM are the <b>seed</b>: one wrong letter there and Cas9 lets go. When all 20 letters match, it cuts both strands of the DNA, three letters from the PAM.',
      check: {
        q: 'At one site, 19 of the 20 letters match, but the wrong one is right next to the PAM. Will Cas9 cut?',
        options: ['No: the letters nearest the PAM must match', 'Yes: 19 out of 20 is close enough', 'Only if the cell asks it to'],
        answer: 0,
        setup: { virus: false, guide: 'match', repair: 'none', fidelity: 'standard', risky: false, speed: 1 },
        explain: 'Cas9 unzips the DNA starting at the PAM. A mismatch in the seed stops the unzipping before it gets going, so Cas9 lets go. Mismatches far from the PAM are tolerated more, which is where off-target cuts come from.',
      },
      params: { virus: false, guide: 'match', repair: 'none', fidelity: 'standard', risky: false, speed: 1.4 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Quick repair: breaking a gene',
      text: 'A cell can’t survive with broken DNA, so it rushes to glue the ends together. This quick repair is sloppy: it often adds or loses a letter or two (orange). Because DNA is read in three-letter words, that scrambles every word after it and usually breaks the gene. That is a <b>knockout</b>, useful for finding out what a gene does.',
      params: { virus: false, guide: 'match', repair: 'nhej', fidelity: 'standard', risky: false, speed: 2.2 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Copying a template: an edit',
      text: 'If scientists also supply a short piece of DNA with the sequence they want, matching the DNA either side of the cut, the cell can use it as a template to repair the break. The new letters (blue) are written into the genome. That is how CRISPR can correct a spelling mistake in a gene.',
      check: {
        q: 'Why does copying a template make a chosen edit, when quick repair only breaks the gene?',
        options: ['The cell copies the letters from the template into the gap', 'Cas9 writes the new letters itself', 'The template is a virus that replaces the gene'],
        answer: 0,
        setup: { virus: false, guide: 'match', repair: 'hdr', fidelity: 'standard', risky: false, speed: 2.2 },
        explain: 'Cas9 only cuts. The cell’s own repair machinery fills in the break, and when a matching template is present it copies the template’s letters, including the change scientists put there.',
      },
      params: { virus: false, guide: 'match', repair: 'hdr', fidelity: 'standard', risky: false, speed: 2.2 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'A cure for sickle-cell disease',
      text: 'Sickle-cell disease comes from a single wrong letter in the gene for haemoglobin, which makes red blood cells stiff and curved. In 2023 the first CRISPR medicine, Casgevy, was approved. Doctors take a patient’s blood stem cells, use CRISPR to switch back on a backup haemoglobin gene that is normally off after birth, and return the cells. Most patients treated so far have been free of painful crises.',
      params: { virus: false, guide: 'match', repair: 'hdr', fidelity: 'high', risky: false, speed: 2.5 },
      enter: (s) => s.restart(),
      duration: 17,
    },
    {
      title: 'Close calls',
      text: 'Our genome has 3 billion letters, so somewhere there may be a near-match. Here a site with two wrong letters far from the PAM comes first, and standard Cas9 cuts it: an <b>off-target</b> edit in the wrong gene. Switch to the high-fidelity version, which needs a perfect match, and run the search again: it skips the decoy and finds the real target.',
      params: { virus: false, guide: 'match', repair: 'nhej', fidelity: 'standard', risky: true, speed: 2.5 },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'Your turn',
      text: 'Change the guide, the Cas9 version and the repair, add a near-match, and run the search again. Which combination edits only the target?',
      params: { virus: false, guide: 'distal', repair: 'hdr', fidelity: 'standard', risky: true, speed: 2 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let G = null, guide = null, sites = [], si = 0;
    let state = 'hop', st = 0, pos = 0, from = 0, checked = 0, letters = 0, cutAt = -1, result = '', checkK = 0, matchFlags = [];
    let edited = new Map(); // index → 'ins' | 'del' | 'new'
    let cam = 0, gap = 0;

    function guideFor() {
      const gd = [...guide];
      if (params.guide === 'seed') gd[18] = PAIR[gd[18]];
      if (params.guide === 'distal') gd[2] = PAIR[gd[2]];
      return gd;
    }
    function restart() {
      const m = makeGenome(params.risky);
      G = m.g;
      guide = m.guide;
      sites = pams(G);
      si = -1;
      state = 'hop';
      st = 0;
      from = sites[0] - 30;
      pos = from;
      checked = 0;
      letters = 0;
      cutAt = -1;
      result = '';
      edited = new Map();
      gap = 0;
      cam = pos;
      nextSite();
    }
    function nextSite() {
      si++;
      if (si >= sites.length) {
        state = 'done';
        result = 'searched everything: no match found';
        return;
      }
      from = pos;
      state = 'hop';
      st = 0;
    }
    function startCheck() {
      state = 'check';
      st = 0;
      checkK = 0;
      matchFlags = [];
      checked++;
    }
    function decide() {
      const gd = guideFor();
      const at = sites[si];
      // compare from the PAM end
      for (let k = 0; k < GUIDE_LEN; k++) {
        const i = GUIDE_LEN - 1 - k;
        const ok = G[at + i] === gd[i];
        matchFlags.push(ok);
        letters++;
        if (!ok && k < SEED) return false;
      }
      const bad = matchFlags.filter((f) => !f).length;
      return params.fidelity === 'high' ? bad === 0 : bad <= 2;
    }

    restart();

    const geom = () => {
      const { w, h } = api;
      const phone = w < 760;
      const bw = phone ? 15 : clamp(w / 40, 18, 28);
      return { phone, bw, cy: h * (phone ? 0.42 : 0.4), mapY: phone ? 64 : 116 };
    };

    return {
      restart,
      reset: restart,
      onParam(k) {
        if (k === 'risky' || k === 'virus') restart();
      },
      update(dt) {
        const sp = params.speed;
        st += dt * sp;
        if (state === 'hop') {
          const to = sites[si];
          const dur = 0.35;
          pos = lerp(from, to, Math.min(1, st / dur));
          if (st >= dur) {
            pos = to;
            startCheck();
          }
        } else if (state === 'check') {
          // reveal the comparison one letter at a time
          if (checkK === 0) {
            const ok = decide();
            this._ok = ok;
          }
          const per = 0.09;
          checkK = Math.min(matchFlags.length, Math.floor(st / per) + 1);
          if (st > matchFlags.length * per + 0.2) {
            if (this._ok) {
              state = 'cut';
              st = 0;
              cutAt = sites[si] + GUIDE_LEN - 3; // cut between cutAt-1 and cutAt
              const onTarget = sites[si] === T_TARGET;
              result = params.virus ? 'virus DNA cut: infection stopped' : onTarget ? 'cut at the target' : 'cut at the WRONG place: an off-target edit';
            } else nextSite();
          }
        } else if (state === 'cut') {
          gap = Math.min(1, st / 0.8);
          if (st > 1.6 && params.repair !== 'none' && !params.virus) {
            state = 'repair';
            st = 0;
          }
        } else if (state === 'repair') {
          gap = Math.max(0, 1 - st / 1.2);
          if (st > 1.2 && !edited.size) {
            if (params.repair === 'nhej') {
              G.splice(cutAt, 0, 'A');
              edited.set(cutAt, 'ins');
              result += params.risky && sites[si] !== T_TARGET ? ' (and the gene there is broken)' : ': an extra letter, so the gene is broken';
            } else {
              const at = cutAt - 2;
              const nw = ['T', 'C', 'A', 'G'];
              nw.forEach((b, k) => {
                if (G[at + k] === b) G[at + k] = BASES[(BASES.indexOf(b) + 1) % 4];
                else G[at + k] = b;
                edited.set(at + k, 'new');
              });
              result += ': new letters copied in from the template';
            }
          }
          if (st > 2) state = 'done';
        }
        // camera follows Cas9
        cam += (pos - cam) * (1 - Math.exp(-dt * 4));
      },
      draw() {
        const { w, h } = api;
        const g = geom();
        ctx.fillStyle = params.virus ? '#06100b' : '#070814';
        ctx.fillRect(0, 0, w, h);
        const bw = g.bw;
        const centre = w * (g.phone ? 0.5 : 0.58);
        const xOf = (i) => centre + (i - cam - GUIDE_LEN / 2) * bw;
        const showLetters = bw >= 15;
        const cutX = cutAt >= 0 ? xOf(cutAt) - bw / 2 : -1;
        const sep = gap * bw * 1.6;
        const i0 = Math.max(0, Math.floor(cam - (centre / bw) - 4)), i1 = Math.min(G.length - 1, Math.ceil(cam + (w - centre) / bw + 4));
        // unzipped region while checking / bound
        const at = sites[si];
        const unzip = state === 'check' ? Math.min(GUIDE_LEN, checkK) : state === 'cut' || state === 'repair' ? GUIDE_LEN : 0;
        const open = (i) => at !== undefined && i >= at + GUIDE_LEN - unzip && i < at + GUIDE_LEN;
        const shiftX = (i) => (cutX >= 0 && sep > 0 ? (xOf(i) < cutX ? -sep / 2 : sep / 2) : 0);
        // backbones
        for (const side of [-1, 1]) {
          ctx.strokeStyle = params.virus ? 'rgba(120,230,150,0.75)' : 'rgba(170,190,255,0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          let pen = false;
          for (let i = i0; i <= i1; i++) {
            const x = xOf(i) + shiftX(i);
            const y = g.cy + side * (bw * 0.95 + (open(i) ? bw * 0.7 : 0)) + Math.sin(i * 0.6) * 2;
            if (cutX >= 0 && sep > 0 && Math.abs(x - shiftX(i) - cutX) < bw * 0.5 && pen) {
              ctx.stroke();
              ctx.beginPath();
              pen = false;
            }
            ctx[pen ? 'lineTo' : 'moveTo'](x, y);
            pen = true;
          }
          ctx.stroke();
        }
        // base pairs
        for (let i = i0; i <= i1; i++) {
          const x = xOf(i) + shiftX(i);
          const b = G[i], p = PAIR[b];
          const o = open(i);
          const yTop = g.cy - bw * 0.95 - (o ? bw * 0.7 : 0), yBot = g.cy + bw * 0.95 + (o ? bw * 0.7 : 0);
          const ed = edited.get(i);
          if (!o) {
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, yTop + 8);
            ctx.lineTo(x, yBot - 8);
            ctx.stroke();
          }
          if (showLetters) {
            const isPam = at !== undefined && i >= at + GUIDE_LEN && i < at + GUIDE_LEN + 3 && state !== 'hop';
            const colr = ed === 'ins' ? C.orange : ed === 'new' ? '#4fa3ff' : COL[b];
            if (isPam || ed) {
              ctx.fillStyle = isPam ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.12)';
              roundRect(ctx, x - bw * 0.45, yTop - bw * 0.42, bw * 0.9, bw * 0.84, 4);
              ctx.fill();
            }
            text(ctx, b, x, yTop, { size: bw * 0.62, weight: 700, align: 'center', color: colr, mono: true, shadow: false });
            text(ctx, p, x, yBot, { size: bw * 0.62, weight: 700, align: 'center', color: 'rgba(233,237,247,0.45)', mono: true, shadow: false });
          }
        }
        // Cas9 and its guide
        if (at !== undefined && state !== 'done') {
          const gd = guideFor();
          const hopping = state === 'hop';
          const hopLift = hopping ? Math.sin(Math.PI * Math.min(1, st / 0.35)) * bw * 3 : 0;
          const cx = xOf(pos + GUIDE_LEN / 2) , cy = g.cy - hopLift;
          ctx.fillStyle = 'rgba(167,139,250,0.12)';
          ctx.strokeStyle = 'rgba(167,139,250,0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx + bw * 1.5, cy - bw * 0.6, bw * (GUIDE_LEN / 2 + 2.5), bw * 2.9, 0, 0, TAU);
          ctx.fill();
          ctx.stroke();
          text(ctx, 'Cas9', cx + bw * 1.5, cy - bw * 3.8, { size: 12, weight: 700, align: 'center', color: C.violet });
          // guide RNA letters, written as RNA (U for T), paired against the top strand
          if (showLetters) {
            const gy = g.cy - bw * 0.95 - bw * 0.7 - bw * 0.9 - hopLift;
            for (let k = 0; k < GUIDE_LEN; k++) {
              const i = pos + k;
              const x = xOf(i) + shiftX(at + k);
              const fromPam = GUIDE_LEN - 1 - k;
              let col = 'rgba(233,237,247,0.85)';
              if (state !== 'hop' && fromPam < checkK) col = matchFlags[fromPam] === false ? C.red : C.teal;
              if (state === 'check' && fromPam >= matchFlags.length) col = 'rgba(233,237,247,0.35)';
              text(ctx, gd[k] === 'T' ? 'U' : gd[k], x, gy, { size: bw * 0.62, weight: 700, align: 'center', color: col, mono: true, shadow: false });
            }
            text(ctx, 'guide RNA', xOf(pos) - bw, gy, { size: 10, align: 'right', color: C.dim });
            if (!g.phone && state !== 'hop') {
              const sx0 = xOf(pos + GUIDE_LEN - SEED) - bw / 2, sx1 = xOf(pos + GUIDE_LEN - 1) + bw / 2;
              ctx.strokeStyle = 'rgba(255,214,102,0.6)';
              ctx.beginPath();
              ctx.moveTo(sx0, gy - bw * 0.6);
              ctx.lineTo(sx1, gy - bw * 0.6);
              ctx.stroke();
              text(ctx, 'seed', (sx0 + sx1) / 2, gy - bw * 0.95, { size: 10, align: 'center', color: C.amber });
              text(ctx, 'PAM', xOf(pos + GUIDE_LEN + 1), g.cy - bw * 2.4, { size: 10, align: 'center', color: C.violet });
            }
          }
        }
        // scissors at the cut
        if (cutX >= 0 && (state === 'cut' || state === 'repair')) {
          tag(ctx, '✂ cut', cutX, g.cy + bw * 2.6, C.red, { align: 'center', size: 11 });
          if (state === 'repair' && params.repair === 'hdr') {
            // the template floats in above
            const k = Math.min(1, st / 1);
            const ty = lerp(g.cy - bw * 7, g.cy - bw * 4.2, k);
            ctx.fillStyle = 'rgba(79,163,255,0.18)';
            roundRect(ctx, cutX - bw * 6, ty - bw * 0.5, bw * 12, bw, 6);
            ctx.fill();
            text(ctx, 'template DNA', cutX, ty - bw, { size: 10, align: 'center', color: '#4fa3ff' });
          }
        }
        // genome map
        const mx0 = 20, mx1 = w - 20, my = g.mapY;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        roundRect(ctx, mx0, my - 5, mx1 - mx0, 10, 5);
        ctx.fill();
        for (const s of sites) {
          ctx.fillStyle = s === T_TARGET ? C.teal : params.risky && s === T_OFF ? C.orange : 'rgba(167,139,250,0.5)';
          ctx.fillRect(mx0 + ((s + GUIDE_LEN) / L) * (mx1 - mx0) - 1, my - 7, s === T_TARGET || (params.risky && s === T_OFF) ? 3 : 2, 14);
        }
        ctx.fillStyle = C.ink;
        ctx.beginPath();
        ctx.arc(mx0 + ((pos + GUIDE_LEN) / L) * (mx1 - mx0), my, 5, 0, TAU);
        ctx.fill();
        if (!g.phone) {
          text(ctx, params.virus ? 'virus DNA' : 'a stretch of DNA: each purple tick is a PAM site', mx0, my + 18, { size: 10, color: C.dim });
          text(ctx, 'target', mx0 + ((T_TARGET + GUIDE_LEN) / L) * (mx1 - mx0), my - 16, { size: 10, align: 'center', color: C.teal });
        }
        const status = state === 'hop' ? 'searching for a PAM…' : state === 'check' ? 'checking letters' : result;
        tag(ctx, status, w - 16, g.phone ? 84 : 150, state === 'done' && result.startsWith('searched') ? C.dim : result.includes('WRONG') ? C.red : state === 'check' || state === 'hop' ? C.violet : C.teal, { align: 'right' });
      },
      stats() {
        return [
          { label: 'PAM sites checked', value: String(checked), color: C.violet },
          { label: 'Letters compared', value: String(letters) },
          { label: 'Result', value: result || 'searching…', color: result.includes('WRONG') ? C.red : C.teal },
        ];
      },
    };
  },
};
