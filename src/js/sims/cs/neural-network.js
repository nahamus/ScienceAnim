import { C, Series, clamp, drawGlow, rand, randn, rgba, roundRect, tag, TAU } from '../../core/util.js';

function dataset(kind, n = 220, noise = 0.1) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    let x, y, c;
    if (kind === 'circle') {
      c = i % 2;
      const r = c ? rand(0, 0.45) : rand(0.62, 0.95);
      const a = rand(TAU);
      x = Math.cos(a) * r;
      y = Math.sin(a) * r;
    } else if (kind === 'xor') {
      x = rand(-0.95, 0.95);
      y = rand(-0.95, 0.95);
      if (Math.abs(x) < 0.06) x += 0.12 * Math.sign(x || 1);
      if (Math.abs(y) < 0.06) y += 0.12 * Math.sign(y || 1);
      c = x * y > 0 ? 1 : 0;
    } else if (kind === 'spiral') {
      c = i % 2;
      const t = (Math.floor(i / 2) / (n / 2)) * 1.75 * TAU * 0.5;
      const r = (t / (1.75 * Math.PI)) * 0.9 + 0.05;
      const a = t + c * Math.PI;
      x = Math.cos(a) * r;
      y = Math.sin(a) * r;
    } else {
      c = i % 2;
      x = (c ? 0.45 : -0.45) + randn() * 0.25;
      y = (c ? 0.35 : -0.35) + randn() * 0.25;
    }
    pts.push({ x: x + randn() * noise * 0.3, y: y + randn() * noise * 0.3, c });
  }
  return pts;
}

class MLP {
  constructor(sizes) {
    this.sizes = sizes;
    this.W = [];
    this.b = [];
    this.vW = [];
    this.vb = [];
    for (let l = 1; l < sizes.length; l++) {
      const s = Math.sqrt(1 / sizes[l - 1]);
      this.W.push(Array.from({ length: sizes[l] }, () => Array.from({ length: sizes[l - 1] }, () => randn() * s)));
      this.b.push(new Array(sizes[l]).fill(0));
      this.vW.push(Array.from({ length: sizes[l] }, () => new Array(sizes[l - 1]).fill(0)));
      this.vb.push(new Array(sizes[l]).fill(0));
    }
  }
  forward(x) {
    const acts = [x];
    let a = x;
    for (let l = 0; l < this.W.length; l++) {
      const last = l === this.W.length - 1;
      const out = this.W[l].map((row, j) => {
        let z = this.b[l][j];
        for (let i = 0; i < row.length; i++) z += row[i] * a[i];
        return last ? 1 / (1 + Math.exp(-z)) : Math.tanh(z);
      });
      acts.push(out);
      a = out;
    }
    return acts;
  }
  train(batch, lr) {
    const gW = this.W.map((L) => L.map((r) => r.map(() => 0)));
    const gb = this.b.map((L) => L.map(() => 0));
    let loss = 0;
    for (const p of batch) {
      const acts = this.forward(input(p));
      const y = acts[acts.length - 1][0];
      loss += -(p.c * Math.log(y + 1e-9) + (1 - p.c) * Math.log(1 - y + 1e-9));
      let delta = [y - p.c];
      for (let l = this.W.length - 1; l >= 0; l--) {
        const aPrev = acts[l];
        for (let j = 0; j < delta.length; j++) {
          gb[l][j] += delta[j];
          for (let i = 0; i < aPrev.length; i++) gW[l][j][i] += delta[j] * aPrev[i];
        }
        if (l > 0) {
          const nd = new Array(aPrev.length).fill(0);
          for (let i = 0; i < aPrev.length; i++) {
            let s = 0;
            for (let j = 0; j < delta.length; j++) s += this.W[l][j][i] * delta[j];
            nd[i] = s * (1 - aPrev[i] * aPrev[i]);
          }
          delta = nd;
        }
      }
    }
    const k = lr / batch.length;
    for (let l = 0; l < this.W.length; l++)
      for (let j = 0; j < this.W[l].length; j++) {
        for (let i = 0; i < this.W[l][j].length; i++) {
          this.vW[l][j][i] = 0.9 * this.vW[l][j][i] - k * gW[l][j][i];
          this.W[l][j][i] += this.vW[l][j][i];
        }
        this.vb[l][j] = 0.9 * this.vb[l][j] - k * gb[l][j];
        this.b[l][j] += this.vb[l][j];
      }
    return loss / batch.length;
  }
}
// feature inputs: x, y plus a little help (x², y²) only if enabled
let useSquares = false;
const input = (p) => (useSquares ? [p.x, p.y, p.x * p.x, p.y * p.y] : [p.x, p.y]);

export default {
  id: 'neural-network',
  title: 'How a Neural Network Learns',
  category: 'cs',
  tagline: 'Watch a tiny artificial brain bend its decision boundary to separate the data.',
  blurb:
    'A neural network is a stack of simple units, each computing a weighted sum and squashing it. Learning means nudging every weight slightly downhill on the error — gradient descent — over and over. Here a small network learns, live, to tell orange points from blue ones.',
  ideas: [
    'Each neuron draws one soft straight line; layers combine lines into curves.',
    'Training adjusts the weights to reduce the error, using <b>back-propagation</b> to work out each weight’s blame.',
    'With no hidden layer a network can only draw a straight boundary.',
    'More neurons and layers can model more complex shapes — but take longer to train.',
  ],
  hint: 'Click on the plot to add an orange point · right-click or Shift-click for blue',
  thumbChapter: 3,
  thumbFrames: 300,
  params: [
    { key: 'data', label: 'Dataset', type: 'select', value: 'circle', options: [{ value: 'gauss', label: 'Two blobs' }, { value: 'circle', label: 'Circle' }, { value: 'xor', label: 'XOR' }, { value: 'spiral', label: 'Spiral' }] },
    { key: 'layers', label: 'Hidden layers', type: 'select', value: 1, options: [{ value: 0, label: 'None' }, { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }] },
    { key: 'width', label: 'Neurons per layer', type: 'range', min: 1, max: 8, step: 1, value: 4, instant: true },
    { key: 'lr', label: 'Learning rate', type: 'range', min: 0.003, max: 0.3, step: 0.001, value: 0.08, digits: 3 },
    { key: 'train', label: 'Training', type: 'toggle', value: true },
    { key: 'reinit', label: 'New random weights', type: 'button', action: (s) => s.rebuild() },
  ],
  story: [
    {
      title: 'A brain made of maths',
      text: 'Orange and blue points need sorting. The network diagram starts with <b>random weights</b>; the background shows what it currently guesses for every location. Right now: nonsense.',
      params: { data: 'circle', layers: 1, width: 4, lr: 0.08, train: false },
      enter: (s) => s.rebuild(true),
      duration: 9,
    },
    {
      title: 'Learning by going downhill',
      text: 'Training begins. For every mistake, each weight is nudged in the direction that reduces the error. The boundary twists into a circle and the loss curve drops.',
      formula: 'w ← w − η · ∂Loss/∂w',
      params: { train: true },
      duration: 14,
    },
    {
      title: 'No hidden layer: only straight lines',
      text: 'Remove the hidden layer and the network can only draw a single straight boundary. It does its best — but a circle can’t be cut out with one line.',
      params: { layers: 0 },
      enter: (s) => s.rebuild(),
      duration: 12,
    },
    {
      title: 'Lines combine into curves',
      text: 'Each hidden neuron learns one line (look at the coloured connections). The output neuron blends them into a closed shape. Four neurons are plenty for a circle.',
      params: { layers: 1, width: 5 },
      enter: (s) => s.rebuild(),
      duration: 13,
    },
    {
      title: 'The spiral challenge',
      text: 'Two interlocking spirals are much harder. A deeper network with more neurons slowly carves out the arms — it may take a while. Real networks have billions of weights.',
      params: { data: 'spiral', layers: 3, width: 8, lr: 0.05 },
      enter: (s) => s.rebuild(),
      duration: 22,
    },
    {
      title: 'Your experiments',
      text: 'Try different datasets and network shapes. Too high a learning rate makes training jumpy; too low and it crawls. Click the plot to add your own points.',
      params: { data: 'xor', layers: 1, width: 4, lr: 0.08 },
      enter: (s) => s.rebuild(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let pts = dataset(params.data), net, loss = new Series(400), epoch = 0, lastLoss = 0, acc = 0;
    let plot = { x: 0, y: 0, s: 100 }, pulse = 0, sampleIdx = 0;
    const G = 64;
    const off = document.createElement('canvas');
    off.width = off.height = G;
    const octx = off.getContext('2d');
    const img = octx.createImageData(G, G);

    function rebuild(newData = false) {
      useSquares = false;
      if (newData) pts = dataset(params.data);
      const hidden = Array(Number(params.layers)).fill(Math.round(params.width));
      net = new MLP([2, ...hidden, 1]);
      loss.clear();
      epoch = 0;
    }
    rebuild();
    const accuracy = () => pts.reduce((s, p) => s + ((net.forward(input(p)).at(-1)[0] > 0.5 ? 1 : 0) === p.c ? 1 : 0), 0) / pts.length;

    return {
      rebuild,
      resize(w, h) {
        // keep clear of the top bar and the story card in the bottom-left
        const s = Math.max(240, Math.min(h - 76 - 250, w * 0.46, 620));
        plot = { x: w * 0.06, y: 76, s };
      },
      onParam(k) {
        if (k === 'data') {
          pts = dataset(params.data);
          rebuild();
        }
        if (k === 'layers' || k === 'width') rebuild();
      },
      reset() {
        rebuild(true);
      },
      pointerDown(p) {
        const x = ((p.x - plot.x) / plot.s) * 2 - 1, y = -(((p.y - plot.y) / plot.s) * 2 - 1);
        if (Math.abs(x) <= 1 && Math.abs(y) <= 1) pts.push({ x, y, c: p.button === 2 || p.shift ? 0 : 1 });
      },
      update(dt) {
        if (params.train) {
          const iters = 6;
          let l = 0;
          for (let i = 0; i < iters; i++) {
            const batch = Array.from({ length: 24 }, () => pts[Math.floor(Math.random() * pts.length)]);
            l += net.train(batch, params.lr * 3);
          }
          lastLoss = l / iters;
          epoch += (iters * 24) / pts.length;
          if (api.frame % 2 === 0) loss.push(lastLoss);
        }
        if (api.frame % 15 === 0) acc = accuracy();
        pulse += dt * 1.6;
        if (pulse > 1) {
          pulse = 0;
          sampleIdx = Math.floor(Math.random() * pts.length);
        }
      },
      draw() {
        const { w, h } = api;
        ctx.fillStyle = '#05060d';
        ctx.fillRect(0, 0, w, h);
        // decision surface
        const d = img.data;
        for (let j = 0; j < G; j++)
          for (let i = 0; i < G; i++) {
            const x = (i / (G - 1)) * 2 - 1, y = -((j / (G - 1)) * 2 - 1);
            const o = net.forward(input({ x, y })).at(-1)[0];
            const t = o * 2 - 1;
            const k = (j * G + i) * 4;
            // orange for class 1, blue for class 0
            if (t > 0) (d[k] = 40 + 200 * t), (d[k + 1] = 22 + 95 * t), (d[k + 2] = 18 + 10 * t);
            else (d[k] = 15 - 5 * t), (d[k + 1] = 25 - 85 * t), (d[k + 2] = 40 - 180 * t);
            d[k + 3] = 255;
          }
        octx.putImageData(img, 0, 0);
        ctx.save();
        roundRect(ctx, plot.x, plot.y, plot.s, plot.s, 14);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        ctx.globalAlpha = 0.75;
        ctx.drawImage(off, plot.x, plot.y, plot.s, plot.s);
        ctx.globalAlpha = 1;
        for (const p of pts) {
          const X = plot.x + ((p.x + 1) / 2) * plot.s, Y = plot.y + ((1 - p.y) / 2) * plot.s;
          ctx.fillStyle = p.c ? '#ffa94d' : '#4dabff';
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(X, Y, 4.2, 0, TAU);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = 'rgba(160,175,230,0.25)';
        roundRect(ctx, plot.x, plot.y, plot.s, plot.s, 14);
        ctx.stroke();

        // network diagram
        const sizes = net.sizes;
        const nx0 = plot.x + plot.s + Math.max(50, w * 0.06), nx1 = w - 40;
        const ny0 = plot.y + 20, ny1 = plot.y + plot.s - 20;
        const pos = sizes.map((n, l) => Array.from({ length: n }, (_, i) => [nx0 + ((nx1 - nx0) * l) / (sizes.length - 1), (ny0 + ny1) / 2 + (i - (n - 1) / 2) * Math.min(46, (ny1 - ny0) / Math.max(1, n - 1))]));
        const sample = pts[sampleIdx] || pts[0];
        const acts = net.forward(input(sample));
        for (let l = 0; l < net.W.length; l++)
          for (let j = 0; j < net.W[l].length; j++)
            for (let i = 0; i < net.W[l][j].length; i++) {
              const wv = net.W[l][j][i];
              const [x1, y1] = pos[l][i], [x2, y2] = pos[l + 1][j];
              ctx.strokeStyle = rgba(wv > 0 ? '#ffa94d' : '#4dabff', clamp(Math.abs(wv) * 0.35, 0.06, 0.9));
              ctx.lineWidth = clamp(Math.abs(wv) * 1.5, 0.5, 5);
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
              // signal pulse
              const sig = Math.abs(acts[l][i] * wv);
              if (sig > 0.15) {
                const f = (pulse * sizes.length - l) % 1;
                if (pulse * (sizes.length - 1) >= l && pulse * (sizes.length - 1) < l + 1) {
                  ctx.globalCompositeOperation = 'lighter';
                  drawGlow(ctx, x1 + (x2 - x1) * f, y1 + (y2 - y1) * f, 4 + sig * 4, wv > 0 ? '#ffa94d' : '#4dabff', 0.3);
                  ctx.globalCompositeOperation = 'source-over';
                }
              }
            }
        sizes.forEach((n, l) =>
          pos[l].forEach(([x, y], i) => {
            const a = acts[l][i];
            const v = l === sizes.length - 1 ? a * 2 - 1 : Math.tanh(a);
            ctx.fillStyle = v > 0 ? `rgba(255,169,77,${0.25 + 0.75 * Math.abs(v)})` : `rgba(77,171,255,${0.25 + 0.75 * Math.abs(v)})`;
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, l === 0 || l === sizes.length - 1 ? 13 : 11, 0, TAU);
            ctx.fill();
            ctx.stroke();
          }),
        );
        if (!api.thumbnail) {
          tag(ctx, 'inputs (x, y)', pos[0][0][0], ny1 + 34, C.dim, { align: 'center' });
          tag(ctx, 'output', pos.at(-1)[0][0], ny1 + 34, C.dim, { align: 'center' });
          if (sizes.length > 2) tag(ctx, `${sizes.length - 2} hidden layer${sizes.length > 3 ? 's' : ''}`, (pos[1][0][0] + pos.at(-2)[0][0]) / 2, ny0 - 30, C.pink, { align: 'center' });
        }
      },
      stats() {
        const nW = net.W.reduce((s, L) => s + L.length * L[0].length + L.length, 0);
        return [
          { label: 'Accuracy', value: (acc * 100).toFixed(1) + ' %', color: acc > 0.95 ? C.teal : undefined },
          { label: 'Loss', value: lastLoss.toFixed(3) },
          { label: 'Epochs', value: epoch.toFixed(0) },
          { label: 'Weights', value: String(nW) },
        ];
      },
      charts() {
        return [{ title: 'Training loss', series: [{ data: loss.data, color: '#ff5fa2' }], min: 0, length: 400 }];
      },
    };
  },
};
