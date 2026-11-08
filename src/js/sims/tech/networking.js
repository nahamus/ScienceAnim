import { C, TAU, backdrop, drawGlow, tag, text, seeded, Series, rgba } from '../../core/util.js';

const MESSAGE = 'HELLO FROM THE OTHER SIDE OF THE WORLD';
const PAL = ['#ff5fa2', '#38d6f5', '#ffb547', '#a3e635', '#a78bfa', '#2ee6a6', '#ff8a3d', '#5b8cff'];

export default {
  id: 'networking',
  title: 'How the Internet Works',
  category: 'tech',
  tagline: 'Your message is chopped into packets that each find their own way across the world.',
  ages: ['11-14', '14-16'],
  topics: ['Networks'],
  blurb:
    'When you send a message or load a video, the data is cut into small packets, each labelled with where it is going and its place in the sequence. Routers pass every packet hop by hop toward its destination, choosing whichever route looks best right now. Packets may take different paths, arrive out of order or get lost — and the receiving computer puts it all back together.',
  ideas: [
    'Data travels in <b>packets</b>, each with a destination address and a sequence number.',
    'Each <b>router</b> only decides the next hop, based on its current view of the network.',
    'Packets can take <b>different routes</b> and arrive out of order; the receiver reassembles them.',
    'Lost packets are noticed and <b>resent</b> (TCP). Cut a cable and traffic flows around it.',
  ],
  hint: 'Click a link to cut or repair it',
  thumbChapter: 2,
  thumbFrames: 300,
  params: [
    { key: 'size', label: 'Letters per packet', type: 'range', min: 2, max: 12, step: 1, value: 4, instant: true },
    { key: 'rate', label: 'Sending rate', type: 'range', min: 1, max: 12, step: 0.5, value: 4, format: (v) => v + ' packets/s' },
    { key: 'loss', label: 'Packet loss', type: 'range', min: 0, max: 0.3, step: 0.01, value: 0, format: (v) => (v * 100).toFixed(0) + ' %' },
    { key: 'adaptive', label: 'Routers avoid busy links', type: 'toggle', value: true },
    { key: 'send', label: 'Send message again', type: 'button', action: (s) => s.send() },
    { key: 'heal', label: 'Repair all links', type: 'button', action: (s) => s.heal() },
  ],
  story: [
    {
      title: 'Chopped into packets',
      text: 'Your laptop is sending a message to a server on the far side of the network. It does not send one long stream: it slices the message into small numbered <b>packets</b>, each stamped with the destination address.',
      params: { size: 4, rate: 3, loss: 0, adaptive: true },
      enter: (s) => {
        s.heal();
        s.send();
      },
      duration: 13,
    },
    {
      title: 'Hop by hop',
      text: 'Each circle is a <b>router</b>. No router knows the whole route; it just forwards each packet to the neighbour that is closest to the destination by its current estimate. Busy links get queues, so routers send later packets another way.',
      params: { rate: 8, adaptive: true },
      enter: (s) => s.send(),
      duration: 15,
    },
    {
      title: 'Out of order, put back together',
      text: 'Because packets take different paths, they arrive jumbled. The receiver holds each one in its numbered slot until the gaps are filled, then the message appears whole.',
      params: { rate: 10, adaptive: true, size: 3 },
      enter: (s) => s.send(),
      duration: 15,
    },
    {
      title: 'Cut a cable',
      text: 'A backbone cable is severed (red). Routers notice the link is dead and recompute their routes, so traffic simply <b>flows around</b> the damage. The internet was designed to survive exactly this.',
      params: { rate: 6, loss: 0 },
      enter: (s) => {
        s.send();
        s.cutBusiest();
      },
      duration: 15,
    },
    {
      title: 'Lost packets get resent',
      text: 'Now 15% of packets vanish — dropped by overloaded routers or noisy links. The receiver only acknowledges what arrives; anything unconfirmed after a timeout is <b>sent again</b> (shown flashing). The message still arrives perfectly, just a little later.',
      params: { loss: 0.15, rate: 6 },
      enter: (s) => {
        s.heal();
        s.send();
      },
      duration: 17,
    },
    {
      title: 'Your network',
      text: 'Cut links by clicking them, add packet loss, and resend. How many cables can you cut before the server becomes unreachable?',
      params: { loss: 0.05, rate: 5 },
      enter: (s) => s.send(),
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let nodes = [], links = [], packets = [], sendQ = [], acc = 0, got = [], total = 0, t = 0, sent = 0, lost = 0, resent = 0, doneT = -1, src = 0, dst = 1;
    const sLat = new Series(80);

    function buildNet() {
      const r = seeded(12);
      nodes = [];
      const { w, h } = api;
      const x0 = 70, x1 = w - 70, y0 = 110, y1 = h > 640 ? h * 0.72 : h - 40;
      nodes.push({ x: x0 - 20, y: (y0 + y1) / 2, kind: 'laptop' });
      nodes.push({ x: x1 + 20, y: (y0 + y1) / 2, kind: 'server' });
      const cols = Math.max(4, Math.round((x1 - x0) / 120)), rows = Math.max(3, Math.round((y1 - y0) / 110));
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          const x = x0 + 50 + ((x1 - x0 - 100) * (i + 0.5)) / cols + (r() - 0.5) * 50;
          const y = y0 + ((y1 - y0) * (j + 0.5)) / rows + (r() - 0.5) * 40;
          nodes.push({ x, y, kind: 'router' });
        }
      links = [];
      const has = (a, b) => links.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
      nodes.forEach((n, i) => {
        const near = nodes.map((m, j) => [j, Math.hypot(m.x - n.x, m.y - n.y)]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]);
        const k = n.kind === 'router' ? 3 : 2;
        for (const [j, d] of near.slice(0, k)) {
          if ((i < 2 && j < 2) || has(i, j)) continue;
          links.push({ a: i, b: j, len: d, load: 0, cut: false });
        }
      });
    }

    function nextHop(at, to) {
      // Dijkstra from the destination over live links; cost = length × (1 + queue)
      const dist = new Array(nodes.length).fill(Infinity);
      dist[to] = 0;
      const done = new Set();
      while (done.size < nodes.length) {
        let u = -1, best = Infinity;
        for (let i = 0; i < nodes.length; i++) if (!done.has(i) && dist[i] < best) (best = dist[i]), (u = i);
        if (u < 0) break;
        done.add(u);
        for (const l of links) {
          if (l.cut || (l.a !== u && l.b !== u)) continue;
          const v = l.a === u ? l.b : l.a;
          const c = l.len * (params.adaptive ? 1 + l.load * 0.9 : 1);
          if (dist[u] + c < dist[v]) dist[v] = dist[u] + c;
        }
      }
      let best = null, bd = Infinity;
      for (const l of links) {
        if (l.cut || (l.a !== at && l.b !== at)) continue;
        const v = l.a === at ? l.b : l.a;
        const c = l.len * (params.adaptive ? 1 + l.load * 0.9 : 1) + dist[v];
        if (c < bd) (bd = c), (best = { v, l });
      }
      return best;
    }

    function send() {
      const n = Math.ceil(MESSAGE.length / params.size);
      total = n;
      got = new Array(n).fill(null);
      sendQ = Array.from({ length: n }, (_, i) => ({ seq: i, retry: false }));
      packets = [];
      sent = lost = resent = 0;
      doneT = -1;
      t = 0;
    }

    function launch(seq, retry) {
      const hop = nextHop(src, dst);
      if (!hop) return;
      packets.push({ seq, at: src, hop, f: 0, born: t, retry, col: PAL[seq % PAL.length], deadline: t + 9 });
      hop.l.load++;
      sent++;
      if (retry) resent++;
    }

    buildNet();
    send();

    return {
      send,
      heal() {
        for (const l of links) l.cut = false;
      },
      cutBusiest() {
        // cut the link carrying the most packets on the current shortest route
        let at = src;
        const route = [];
        for (let k = 0; k < 30 && at !== dst; k++) {
          const h = nextHop(at, dst);
          if (!h) break;
          route.push(h.l);
          at = h.v;
        }
        const l = route[Math.floor(route.length / 2)];
        if (l) l.cut = true;
      },
      reset: send,
      resize() {
        buildNet();
        send();
      },
      onParam(k) {
        if (k === 'size') send();
      },
      pointerDown(p) {
        let best = null, bd = 12;
        for (const l of links) {
          const A = nodes[l.a], B = nodes[l.b];
          const vx = B.x - A.x, vy = B.y - A.y;
          const u = Math.max(0, Math.min(1, ((p.x - A.x) * vx + (p.y - A.y) * vy) / (vx * vx + vy * vy)));
          const d = Math.hypot(A.x + vx * u - p.x, A.y + vy * u - p.y);
          if (d < bd) (bd = d), (best = l);
        }
        if (best) best.cut = !best.cut;
      },
      update(dt) {
        t += dt;
        acc += dt * params.rate;
        while (acc >= 1 && sendQ.length) {
          acc -= 1;
          const q = sendQ.shift();
          launch(q.seq, q.retry);
        }
        if (!sendQ.length) acc = Math.min(acc, 1);
        const speed = 260;
        for (const p of packets) {
          if (p.dead) continue;
          const l = p.hop.l;
          if (l.cut) {
            p.dead = true;
            l.load = Math.max(0, l.load - 1);
            continue;
          }
          p.f += (dt * speed) / (l.len * (1 + l.load * 0.25));
          if (p.f >= 1) {
            l.load = Math.max(0, l.load - 1);
            p.at = p.hop.v;
            p.f = 0;
            if (Math.random() < params.loss) {
              p.dead = true;
              p.lostAt = [nodes[p.at].x, nodes[p.at].y, t];
              lost++;
              continue;
            }
            if (p.at === dst) {
              p.dead = true;
              p.handled = true;
              if (got[p.seq] === null) got[p.seq] = t;
              sLat.push(t - p.born);
              continue;
            }
            const h = nextHop(p.at, dst);
            if (!h) {
              p.dead = true;
              continue;
            }
            p.hop = h;
            h.l.load++;
          }
        }
        // timeouts → retransmit anything not yet received
        for (const p of packets) if (p.dead && !p.handled && got[p.seq] === null && t > p.deadline - 6) {
          p.handled = true;
          if (!sendQ.some((q) => q.seq === p.seq) && !packets.some((o) => !o.dead && o.seq === p.seq)) sendQ.push({ seq: p.seq, retry: true });
        }
        packets = packets.filter((p) => !p.dead || (p.lostAt && t - p.lostAt[2] < 0.8) || !p.handled);
        if (doneT < 0 && got.length && got.every((g) => g !== null)) doneT = t;
        if (doneT > 0 && t - doneT > 4) send();
      },
      draw() {
        const { w, h } = api;
        backdrop(ctx, w, h, { center: '#0b1024' });
        // links
        for (const l of links) {
          const A = nodes[l.a], B = nodes[l.b];
          ctx.strokeStyle = l.cut ? 'rgba(255,77,109,0.7)' : `rgba(120,150,230,${0.22 + Math.min(0.5, l.load * 0.12)})`;
          ctx.lineWidth = l.cut ? 2 : 2 + Math.min(4, l.load);
          ctx.setLineDash(l.cut ? [4, 6] : []);
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
          ctx.stroke();
          ctx.setLineDash([]);
          if (l.cut) text(ctx, '✕', (A.x + B.x) / 2, (A.y + B.y) / 2, { size: 14, align: 'center', color: C.red, weight: 700 });
        }
        // nodes
        nodes.forEach((n, i) => {
          if (n.kind === 'router') {
            ctx.fillStyle = '#1a2242';
            ctx.strokeStyle = 'rgba(160,180,240,0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(n.x, n.y, 9, 0, TAU);
            ctx.fill();
            ctx.stroke();
          } else {
            const col = i === src ? C.pink : C.teal;
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, n.x, n.y, 40, col, 0.25);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#20284a';
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(n.x - 18, n.y - 14, 36, 28, 5) : ctx.rect(n.x - 18, n.y - 14, 36, 28);
            ctx.fill();
            ctx.stroke();
            if (!api.thumbnail) tag(ctx, n.kind === 'laptop' ? 'you' : 'server', n.x, n.y - 30, col, { align: 'center', size: 10 });
          }
        });
        // packets
        for (const p of packets) {
          if (p.lostAt) {
            const k = (t - p.lostAt[2]) / 0.8;
            ctx.strokeStyle = `rgba(255,77,109,${1 - k})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.lostAt[0], p.lostAt[1], 8 + k * 20, 0, TAU);
            ctx.stroke();
            continue;
          }
          if (p.dead) continue;
          const A = nodes[p.at], B = nodes[p.hop.v];
          const x = A.x + (B.x - A.x) * p.f, y = A.y + (B.y - A.y) * p.f;
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, x, y, 14, p.col, 0.35);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = p.col;
          ctx.fillRect(x - 7, y - 5, 14, 10);
          if (p.retry && Math.sin(t * 20) > 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(x - 8, y - 6, 16, 12);
          }
          if (!api.thumbnail) text(ctx, String(p.seq + 1), x, y + 0.5, { size: 8, align: 'center', weight: 700, color: '#0a0d1a', shadow: false });
        }
        // reassembly buffer
        if (!api.thumbnail) {
          const n = total, sz = params.size;
          const bw = Math.min(26, (w - 40) / n);
          const x0 = (w - bw * n) / 2, y0 = 76;
          for (let i = 0; i < n; i++) {
            const ok = got[i] !== null;
            ctx.fillStyle = ok ? rgba(PAL[i % PAL.length], 0.85) : 'rgba(255,255,255,0.06)';
            ctx.fillRect(x0 + i * bw + 1, y0, bw - 2, 14);
          }
          const msg = got.map((g, i) => (g !== null ? MESSAGE.slice(i * sz, i * sz + sz) : '·'.repeat(Math.min(sz, MESSAGE.length - i * sz)))).join('');
          text(ctx, msg, w / 2, y0 + 30, { size: 13, align: 'center', mono: true, color: doneT > 0 ? C.teal : C.ink });
        }
      },
      stats() {
        const rec = got.filter((g) => g !== null).length;
        return [
          { label: 'Packets received', value: `${rec} / ${total}`, color: rec === total ? C.teal : undefined },
          { label: 'Sent (incl. resends)', value: String(sent) },
          { label: 'Lost', value: String(lost), color: lost ? C.red : undefined },
          { label: 'Resent', value: String(resent) },
          { label: 'Cut links', value: String(links.filter((l) => l.cut).length) },
        ];
      },
      charts() {
        return [{ title: 'Delivery time per packet (s)', kind: 'bars', series: [{ data: sLat.data, color: C.cyan }], min: 0 }];
      },
    };
  },
};
