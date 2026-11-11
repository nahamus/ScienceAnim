import { C, roundRect, tag, text } from '../../core/util.js';

// Antibiotic resistance on a "mega-plate" (after Baym et al., Science 2016). A long dish of food is divided into
// bands whose antibiotic dose rises tenfold towards the middle: none, 3×, 30×, 300×, 3,000× what normally kills
// the bacteria. Bacteria start at both ends. Each step, bacteria try to divide into a neighbouring empty spot; a
// daughter can only live in a band if its resistance level is at least the band's level. Each division has a
// small chance of a mutation that raises resistance by one level (a new lineage, in a new colour). Resistance
// may carry a growth cost.

const GW = 162, GH = 64;
const BANDS = {
  steps: [0, 1, 2, 3, 4, 3, 2, 1, 0],
  jump: [0, 4, 4, 4, 4, 4, 4, 4, 0],
};
const DOSE = ['no drug', '3×', '30×', '300×', '3,000×'];

export default {
  id: 'antibiotic-resistance',
  title: 'Superbugs: Evolution You Can Watch',
  category: 'biology',
  tagline: 'Bacteria meet ever-stronger antibiotics. In days, they evolve to survive a thousand times the dose.',
  ages: ['11-14', '14-16', '16+'],
  topics: ['Evolution', 'Medicine', 'Microbes'],
  keywords: ['antibiotic resistance', 'superbug', 'bacteria', 'evolution', 'natural selection', 'mutation', 'mega-plate', 'MEGA-plate', 'E. coli', 'Kishony', 'Harvard', 'MRSA', 'drug resistance', 'fitness cost'],
  blurb:
    'In 2016 Harvard scientists filmed evolution on a dish over a metre long. The middle was laced with antibiotic a thousand times stronger than what normally kills the bacteria. In about eleven days, random mutations and survival of the fittest carried the bacteria all the way across. Recreate the experiment, and find out why antibiotic resistance is one of the biggest threats to modern medicine.',
  ideas: [
    'Every time a bacterium divides there is a tiny chance of a random <b>mutation</b> in its DNA.',
    'Antibiotics don’t create resistance: they <b>select</b> the rare mutants that already resist and kill their competitors.',
    'Resistance builds up <b>step by step</b>: each new mutant grows into a stronger band, where the next mutation can arise.',
    'A sudden jump to a high dose is far harder to evolve across than gentle steps.',
    'Resistant infections already kill more than a million people a year: we must use antibiotics wisely.',
  ],
  hint: 'Change the mutation rate or the dose pattern, then restart',
  thumbChapter: 3,
  thumbFrames: 900,
  params: [
    { key: 'mut', label: 'Chance of a resistance mutation', type: 'range', min: 0, max: 0.01, step: 0.0001, value: 0.002, instant: true, format: (v) => (v === 0 ? 'none' : `1 in ${Math.round(1 / v).toLocaleString('en-US')} divisions`) },
    { key: 'cost', label: 'Growth cost of each resistance step', type: 'range', min: 0, max: 0.2, step: 0.01, value: 0.05, instant: true, format: (v) => Math.round(v * 100) + ' % slower' },
    {
      key: 'bands', label: 'Antibiotic pattern', type: 'select', value: 'steps', instant: true,
      options: [{ value: 'steps', label: 'Gentle steps' }, { value: 'jump', label: 'One big jump' }],
    },
    { key: 'speed', label: 'Speed', type: 'range', min: 0.5, max: 6, step: 0.5, value: 2, format: (v) => v + '×' },
    // the quick check shows a plate that has already evolved for a few days
    { key: 'ff', type: 'toggle', value: false, hidden: true },
    { key: 'restart', label: 'Restart the plate', type: 'button', action: (s) => s.restart() },
  ],
  story: [
    {
      title: 'A giant dish',
      text: 'This is a dish of food 120 cm long, split into bands. The outer bands have no antibiotic; moving inwards, each band has ten times more, up to 3,000 times the dose that normally kills these bacteria. A few bacteria (E. coli) are placed at both ends. For now they can’t mutate: watch them fill the drug-free bands and stop dead at the first antibiotic.',
      params: { mut: 0, cost: 0.05, bands: 'steps', speed: 2 },
      enter: (s) => s.restart(),
      duration: 12,
    },
    {
      title: 'A lucky mutant',
      text: 'Now let mutations happen. Each time a bacterium divides, there is a tiny chance a copying mistake in its DNA lets it survive a bit more antibiotic. Usually this changes nothing, but at the edge of the first band a mutant can grow where its cousins die. Its offspring (in a new colour) pour into the empty band.',
      params: { mut: 0.002, cost: 0.05, bands: 'steps', speed: 2 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Step by step',
      text: 'Each new mutant lineage spreads until it meets a stronger band, where the next lucky mutation lets a few of its descendants in. In the real experiment, bacteria crossed all the way to 3,000× in about eleven days. Each branch of colours is a family tree of mutations.',
      check: {
        q: 'Where did the bacteria’s resistance come from?',
        options: ['Random mutations, selected because the antibiotic killed everything else', 'The antibiotic changed the bacteria to protect them', 'Bacteria decided to become resistant'],
        answer: 0,
        setup: { mut: 0.002, cost: 0.05, bands: 'steps', speed: 3, ff: true },
        explain: 'Mutations happen at random, all the time, whether there is antibiotic or not. The antibiotic doesn’t cause them; it acts as a filter, killing everything except the rare mutants that happen to resist. That is natural selection.',
      },
      params: { mut: 0.002, cost: 0.05, bands: 'steps', speed: 3, ff: false },
      enter: (s) => s.restart(),
      duration: 18,
    },
    {
      title: 'One big jump',
      text: 'Now there is no gentle slope: right after the food comes 3,000×. A bacterium would need several mutations at once to survive, which is almost impossible. The bacteria are stuck. Low and in-between doses are what let resistance climb step by step, which is one reason to take the full right dose and keep antibiotics out of places they don’t need to be.',
      params: { mut: 0.002, cost: 0.05, bands: 'jump', speed: 3 },
      enter: (s) => s.restart(),
      duration: 15,
    },
    {
      title: 'Why it matters',
      text: 'Resistant infections already kill more than a million people a year, and the number is rising. Some bacteria can even swap resistance genes with each other. Using antibiotics only when they’re really needed, finishing treatment as prescribed, cleaner hospitals, vaccines and new kinds of drug all slow the arms race.',
      params: { mut: 0.004, cost: 0.03, bands: 'steps', speed: 4 },
      enter: (s) => s.restart(),
      duration: 16,
    },
    {
      title: 'Your turn',
      text: 'Make mutations rarer or commoner, add a bigger cost to resistance, or try the big jump. How quickly can the bacteria cross the plate?',
      params: { mut: 0.001, cost: 0.08, bands: 'steps', speed: 3 },
      enter: (s) => s.restart(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    const grid = new Uint16Array(GW * GH); // 0 = empty, else lineage index + 1
    let lineages = [], hours = 0, acc = 0, mutations = 0, best = 0;
    const img = { canvas: null, data: null };
    const cols = [];
    const bandOf = (x) => Math.min(8, Math.floor((x / GW) * 9));
    const level = (x) => BANDS[params.bands][bandOf(x)];

    function restart() {
      grid.fill(0);
      lineages = [{ r: 0, hue: 205, parent: -1 }, { r: 0, hue: 205, parent: -1 }];
      cols.length = 0;
      for (let y = 0; y < GH; y++) {
        grid[y * GW] = 1;
        grid[y * GW + GW - 1] = 2;
      }
      hours = 0;
      acc = 0;
      mutations = 0;
      best = 0;
    }
    restart();

    function step() {
      const tries = GW * GH;
      for (let k = 0; k < tries; k++) {
        const i = (Math.random() * GW * GH) | 0;
        const id = grid[i];
        if (!id) continue;
        const L = lineages[id - 1];
        if (Math.random() > 1 - params.cost * L.r) continue; // resistant cells divide more slowly
        const x = i % GW, y = (i / GW) | 0;
        const d = (Math.random() * 4) | 0;
        const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) continue;
        const j = ny * GW + nx;
        if (grid[j]) continue;
        let child = id;
        if (params.mut > 0 && Math.random() < params.mut && L.r < 4) {
          lineages.push({ r: L.r + 1, hue: (L.hue + 50 + Math.random() * 70) % 360, parent: id - 1 });
          child = lineages.length;
          mutations++;
        }
        if (lineages[child - 1].r >= level(nx)) {
          grid[j] = child;
          best = Math.max(best, level(nx));
        }
      }
      hours += 0.5;
    }

    const geom = () => {
      const { w, h } = api;
      const phone = w < 760;
      const pw = phone ? w - 24 : Math.min(w - 48, 1100);
      const ph = Math.min((pw * GH) / GW, phone ? h * 0.42 : h * 0.5);
      return { phone, x: (w - pw) / 2, y: phone ? 92 : 150, w: pw, h: ph };
    };

    return {
      restart,
      reset: restart,
      onParam(k, v) {
        if (k === 'bands') restart();
        if (k === 'ff' && v) {
          restart();
          for (let s = 0; s < 220; s++) step();
        }
      },
      update(dt) {
        acc += dt * params.speed * 6;
        let n = 0;
        while (acc >= 1 && n < 30) {
          acc -= 1;
          step();
          n++;
        }
        if (n >= 30) acc = 0;
      },
      draw() {
        const { w, h } = api;
        const g = geom();
        ctx.fillStyle = '#05070f';
        ctx.fillRect(0, 0, w, h);
        // plate and bands
        ctx.fillStyle = '#0d0d10';
        roundRect(ctx, g.x - 6, g.y - 6, g.w + 12, g.h + 12, 10);
        ctx.fill();
        const bw = g.w / 9;
        BANDS[params.bands].forEach((lv, b) => {
          ctx.fillStyle = `rgb(${18 + lv * 10},${16 + lv * 6},${30 + lv * 4})`;
          ctx.fillRect(g.x + b * bw, g.y, bw + 0.5, g.h);
          if (!g.phone || b % 2 === 0) text(ctx, DOSE[lv], g.x + b * bw + bw / 2, g.y - 18, { size: g.phone ? 9 : 11, align: 'center', color: lv ? `rgba(255,${200 - lv * 30},${150 - lv * 30},0.9)` : C.dim, weight: 600 });
        });
        // bacteria
        if (!img.canvas) {
          img.canvas = document.createElement('canvas');
          img.canvas.width = GW;
          img.canvas.height = GH;
          img.data = img.canvas.getContext('2d').createImageData(GW, GH);
        }
        // colours are worked out once per lineage
        if (cols.length > lineages.length) cols.length = 0;
        for (let k = cols.length; k < lineages.length; k++) {
          const L = lineages[k];
          const sat = 0.75, l = 0.42 + L.r * 0.08;
          const a = sat * Math.min(l, 1 - l);
          const f = (n) => {
            const q = (n + L.hue / 30) % 12;
            return Math.round(255 * (l - a * Math.max(-1, Math.min(q - 3, 9 - q, 1))));
          };
          cols.push([f(0), f(8), f(4)]);
        }
        const D = img.data.data;
        for (let i = 0; i < grid.length; i++) {
          const id = grid[i];
          const p = i * 4;
          if (id) {
            const c = cols[id - 1];
            D[p] = c[0];
            D[p + 1] = c[1];
            D[p + 2] = c[2];
            D[p + 3] = 255;
          } else D[p + 3] = 0;
        }
        img.canvas.getContext('2d').putImageData(img.data, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img.canvas, g.x, g.y, g.w, g.h);
        ctx.imageSmoothingEnabled = true;
        // band dividers
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        for (let b = 1; b < 9; b++) {
          ctx.beginPath();
          ctx.moveTo(g.x + b * bw, g.y);
          ctx.lineTo(g.x + b * bw, g.y + g.h);
          ctx.stroke();
        }
        // legend: resistance levels
        const ly = g.y + g.h + 26;
        text(ctx, 'Colours: each new colour is a new mutant family; lighter shades survive higher doses', g.x, ly, { size: g.phone ? 9.5 : 12, color: C.dim });
        tag(ctx, `day ${(hours / 24).toFixed(1)}`, w - 16, g.phone ? 56 : 84, C.amber, { align: 'right' });
      },
      stats() {
        const counts = [0, 0, 0, 0, 0];
        for (let i = 0; i < grid.length; i++) if (grid[i]) counts[lineages[grid[i] - 1].r]++;
        return [
          { label: 'Time', value: `day ${(hours / 24).toFixed(1)}`, color: C.amber },
          { label: 'Strongest dose reached', value: DOSE[best], color: best ? C.red : C.teal },
          { label: 'Resistance mutations', value: String(mutations) },
          { label: 'Mutant families alive', value: String(new Set(grid).size - (grid.includes(0) ? 1 : 0)) },
          { label: 'Plate covered', value: `${Math.round((counts.reduce((a, b) => a + b, 0) / grid.length) * 100)} %`, color: C.teal },
        ];
      },
    };
  },
};
