import { C, TAU, clamp, lerp, drawGlow, tag, text, rand, seeded } from '../../core/util.js';

const SOUND = 343; // m/s

export default {
  id: 'lightning',
  title: 'Lightning & Thunder',
  category: 'earth',
  tagline: 'How a storm cloud charges up, how the bolt finds its way down, and how to tell how far away it struck.',
  ages: ['11-14', '14-16'],
  topics: ['Electricity', 'Weather', 'Sound'],
  keywords: ['lightning', 'thunder', 'static electricity', 'storm', 'stepped leader', 'lightning rod', 'charge'],
  blurb:
    'Inside a thunderstorm, tiny ice crystals and soft hail collide in violent updrafts and swap electric charge, until the cloud holds hundreds of millions of volts. Then a faint channel of charged air steps down towards the ground, a spark leaps up to meet it, and a giant current flashes back up the path. The air heats to five times the temperature of the Sun’s surface and bursts outwards: thunder.',
  ideas: [
    'Collisions between rising <b>ice crystals</b> and falling <b>soft hail</b> separate charge: the top of the cloud turns positive, the base negative.',
    'The negative base repels electrons in the ground below, leaving it <b>positive</b>.',
    'Lightning starts as a faint <b>stepped leader</b> zig-zagging down about 50 m at a time.',
    'Tall, pointed objects send up <b>streamers</b> to meet it, which is why lightning rods work.',
    'The bright <b>return stroke</b> heats the air to about 30,000 °C, and the sudden expansion is <b>thunder</b>.',
    'Light arrives at once but sound takes about <b>3 seconds per kilometre</b>.',
  ],
  hint: 'Click the stage to make the lightning strike',
  thumbChapter: 4,
  thumbFrames: 60,
  params: [
    { key: 'updraft', label: 'Updraft strength', type: 'range', min: 0.2, max: 2, step: 0.05, value: 1, format: (v) => Math.round(v * 20) + ' m/s' },
    { key: 'auto', label: 'Strike when charged', type: 'toggle', value: true },
    { key: 'slow', label: 'Slow motion', type: 'toggle', value: true },
    { key: 'rod', label: 'Lightning rod on the house', type: 'toggle', value: false },
    { key: 'dist', label: 'Your distance from the strike', type: 'range', min: 0.5, max: 8, step: 0.1, value: 3, format: (v) => v.toFixed(1) + ' km' },
    { key: 'strike', label: 'Strike now', type: 'button', action: (s) => s.strike() },
  ],
  story: [
    {
      title: 'A storm builds',
      text: 'Warm, moist air shoots upwards inside a thunderstorm. Small <b>ice crystals</b> ride up with it while heavier lumps of <b>soft hail</b> fall through them. When they collide, the crystals carry <b>positive</b> charge up to the top of the cloud and the hail takes <b>negative</b> charge down to its base.',
      params: { auto: false, updraft: 1, slow: true },
      enter: (s) => s.calm(),
      duration: 14,
    },
    {
      title: 'Opposites attract',
      text: 'The negative cloud base pushes electrons in the ground away, so the ground beneath turns <b>positive</b>, and the positive patch follows the storm. Air is a good insulator, but as the charge builds the electric field grows towards the point where air breaks down: about <b>3 million volts per metre</b>.',
      params: { auto: false, updraft: 1.4 },
      duration: 13,
    },
    {
      title: 'The stepped leader',
      text: 'Finally the air near the cloud base breaks down. A faint, branching channel of charged air, the <b>stepped leader</b>, zig-zags downwards about 50 m at a time, pausing between steps. Here it is slowed right down: really it takes about a fiftieth of a second.',
      params: { auto: true, slow: true, rod: false },
      enter: (s) => s.strike(),
      duration: 13,
    },
    {
      title: 'Reaching up',
      text: 'As the leader nears the ground, the field at the tips of tall, pointed things becomes strong enough for sparks called <b>streamers</b> to shoot upwards. The first streamer to touch the leader completes the circuit. A <b>lightning rod</b> makes sure that happens on a safe metal rod wired to the ground.',
      params: { auto: true, slow: true, rod: true },
      check: {
        q: 'Lightning is heading down towards a field with a tall tree, a house with a lightning rod, and an open meadow. Where is it most likely to strike?',
        options: ['The open meadow', 'The tallest pointed object', 'Anywhere, it is completely random'],
        answer: 1,
        explain: 'Tall, pointed objects concentrate the electric field and launch the first streamers, so the leader usually connects with them. Never shelter under a lone tree in a storm.',
      },
      enter: (s) => s.strike(),
      duration: 13,
    },
    {
      title: 'The return stroke',
      text: 'The moment they connect, a huge current of about <b>30,000 amps</b> surges up the channel. It heats the air to about <b>30,000 °C</b>, five times hotter than the surface of the Sun, so it glows brilliantly. Often several strokes follow down the same path, which is why lightning flickers.',
      params: { auto: true, slow: false, rod: true },
      enter: (s) => s.strike(),
      duration: 12,
    },
    {
      title: 'Counting to the thunder',
      text: 'The searing air expands so fast it makes a shock wave: <b>thunder</b>. The flash reaches you almost instantly, but sound travels only about 343 m each second. Count the seconds between the flash and the bang and divide by <b>3</b> to get the distance in kilometres (by 5 for miles).',
      formula: 'distance (km) ≈ seconds ÷ 3',
      params: { auto: false, slow: false, dist: 3 },
      check: {
        q: 'You count 9 seconds between the flash and the thunder. How far away was the strike?',
        options: ['About 1 km', 'About 3 km', 'About 9 km'],
        answer: 1,
        explain: 'Sound covers about 1 km every 3 seconds, so 9 seconds means about 3 km. If the gap is under 30 seconds (10 km), go indoors.',
      },
      enter: (s) => s.strike(),
      duration: 16,
    },
    {
      title: 'Explore',
      text: 'Click to strike, change the updraft to charge the storm faster, add a lightning rod, and move further away to hear the thunder later.',
      params: { auto: true, slow: false, updraft: 1.2 },
      duration: 20,
    },
  ],
  create(api) {
    const { ctx, params } = api;
    let t = 0, charge = 0.3, phase = 'charging';
    let cloudPuffs = [], ice = [];
    let leader = null; // { segs: [{x1,y1,x2,y2,parent,depth}], tips: [segIndex], main: [], target }
    let stepT = 0, streamer = null;
    let flash = 0, strokeT = 0, strokes = [];
    let flashAt = -1, thunderHeard = -1, shake = 0;

    const lay = () => {
      const { w, h } = api;
      const narrow = w < 700;
      const T = narrow ? 64 : 60;
      const ground = narrow ? Math.round(h * 0.58) : Math.round(h * 0.82);
      const cloudTop = T + 10;
      const base = T + (ground - T) * (narrow ? 0.48 : 0.36);
      const sx = narrow ? w * 0.42 : w * 0.56; // where strikes land
      const ox = narrow ? w * 0.9 : w * 0.92; // the observer
      return { w, h, narrow, T, ground, cloudTop, base, sx, ox };
    };

    // fixed objects on the ground: a tree and a house
    const objects = (L) => {
      const s = clamp(L.h / 700, 0.55, 1.2);
      return {
        tree: { x: L.sx - 70 * s, top: L.ground - 78 * s, s },
        house: { x: L.sx + 55 * s, top: L.ground - 46 * s, s, rodTop: L.ground - 98 * s },
      };
    };

    function build() {
      const L = lay();
      const r = seeded(7);
      cloudPuffs = [];
      const cx = L.sx, half = Math.min(L.w * 0.46, 520);
      for (let i = 0; i < 34; i++) {
        const u = r() * 2 - 1;
        const x = cx + u * half * (0.9 + 0.3 * r());
        const top = lerp(L.cloudTop + 20, L.base - 50, Math.abs(u) ** 1.3);
        const y = lerp(top, L.base - 22, r());
        cloudPuffs.push({ x, y, r: lerp(28, 70, r()) * clamp(Math.min(L.w * 1.4, L.h) / 800, 0.6, 1.2), k: r() });
      }
      ice = [];
      for (let i = 0; i < 70; i++) ice.push(newIce(L, true));
    }

    function newIce(L, anywhere) {
      const half = Math.min(L.w * 0.3, 360);
      const big = Math.random() < 0.45; // soft hail (graupel)
      return {
        x: L.sx + rand(-half, half),
        y: anywhere ? rand(L.cloudTop + 30, L.base - 20) : big ? L.cloudTop + 40 : L.base - 20,
        big,
        q: 0, // charge it has picked up, −1..1
      };
    }

    function calm() {
      charge = 0.05;
      phase = 'charging';
      leader = null;
      streamer = null;
      flash = 0;
      flashAt = -1;
      thunderHeard = -1;
      for (const p of ice) p.q = 0;
    }

    function strike() {
      if (phase === 'leader' || phase === 'stroke') return;
      charge = Math.max(charge, 0.9);
      startLeader();
    }

    function startLeader() {
      const L = lay();
      const O = objects(L);
      const tallest = params.rod ? { x: O.house.x, y: O.house.rodTop } : { x: O.tree.x, y: O.tree.top };
      const x0 = L.sx + rand(-40, 40);
      leader = { segs: [], tips: [], target: tallest, done: false };
      leader.segs.push({ x1: x0, y1: L.base - 10, x2: x0, y2: L.base + 4, parent: -1, main: true, depth: 0 });
      leader.tips = [0];
      phase = 'leader';
      stepT = 0;
      streamer = null;
    }

    function stepLeader(L) {
      const step = (L.ground - L.base) / 16;
      const next = [];
      for (const ti of leader.tips) {
        const s = leader.segs[ti];
        // the main branch zig-zags towards the tallest object; side branches wander downwards
        const aim = s.main ? Math.atan2(leader.target.y - s.y2, leader.target.x - s.x2) : Math.PI / 2;
        const ang = clamp(aim + rand(-0.6, 0.6), 0.25, Math.PI - 0.25);
        const len = step * rand(0.6, 1.1);
        const seg = { x1: s.x2, y1: s.y2, x2: s.x2 + Math.cos(ang) * len * 0.8, y2: s.y2 + Math.sin(ang) * len, parent: ti, main: s.main, depth: s.depth + 1 };
        if (seg.y2 > L.ground - 4 && !s.main) continue;
        leader.segs.push(seg);
        next.push(leader.segs.length - 1);
        // branches fork off and some fizzle out
        if (leader.tips.length + next.length < 9 && Math.random() < 0.22) {
          const a2 = ang + rand(0.4, 0.9) * (Math.random() < 0.5 ? -1 : 1);
          leader.segs.push({ x1: s.x2, y1: s.y2, x2: s.x2 + Math.cos(a2) * len * 0.8, y2: s.y2 + Math.sin(a2) * len, parent: ti, main: false, depth: s.depth + 1 });
          next.push(leader.segs.length - 1);
        }
      }
      leader.tips = next.filter((i) => leader.segs[i].main || Math.random() > 0.12);
      const mainTip = leader.tips.find((i) => leader.segs[i].main);
      if (mainTip === undefined) return void startLeader();
      const m = leader.segs[mainTip];
      const gap = Math.hypot(m.x2 - leader.target.x, m.y2 - leader.target.y);
      const reach = (L.ground - L.base) * 0.3;
      if (gap < reach || m.y2 > leader.target.y) {
        if (!streamer) streamer = { x: leader.target.x, y: leader.target.y, len: 0, from: mainTip, gap };
        streamer.len = Math.min(1, streamer.len + 0.45);
        if (streamer.len >= 1) connect(mainTip);
      }
    }

    function connect(tip) {
      // the path from the connecting tip back to the cloud becomes the channel
      const path = [];
      for (let i = tip; i >= 0; i = leader.segs[i].parent) path.push(leader.segs[i]);
      leader.channel = path;
      leader.done = true;
      phase = 'stroke';
      strokeT = 0;
      const n = 2 + Math.floor(Math.random() * 3);
      strokes = [0];
      for (let i = 1; i < n; i++) strokes.push(strokes[i - 1] + rand(0.06, 0.14));
      flashAt = t;
      thunderHeard = -1;
      charge = Math.max(0.05, charge - 0.85);
      for (const p of ice) p.q *= 0.15;
    }

    function update(dt) {
      t += dt;
      const L = lay();
      if (!cloudPuffs.length) build();
      // charging: collisions in the updraft separate charge
      const up = params.updraft;
      if (phase === 'charging' || phase === 'leader') charge = Math.min(1, charge + dt * 0.055 * up);
      for (const p of ice) {
        p.y += (p.big ? 18 : -30 * up) * dt * clamp(L.h / 800, 0.6, 1.2);
        p.x += Math.sin(t * 0.7 + p.y * 0.02) * 6 * dt;
        p.q += (p.big ? -1 : 1) * dt * 0.4 * up * (1 - Math.abs(p.q));
        if (p.big ? p.y > L.base - 10 : p.y < L.cloudTop + 26) Object.assign(p, newIce(L, false));
      }
      if (phase === 'charging' && params.auto && charge >= 1) startLeader();
      if (phase === 'leader') {
        stepT -= dt;
        if (stepT <= 0) {
          stepLeader(L);
          stepT = params.slow ? 0.16 : 0.012;
        }
      }
      if (phase === 'stroke') {
        strokeT += dt * (params.slow ? 0.6 : 1);
        // flicker: each stroke is a sharp flash that fades in ~50 ms
        let f = 0;
        for (const s of strokes) if (strokeT >= s) f = Math.max(f, Math.exp(-(strokeT - s) / 0.05));
        flash = f;
        if (strokeT > strokes[strokes.length - 1] + 0.5) {
          phase = 'after';
          strokeT = 0;
        }
      } else flash *= Math.exp(-dt * 12);
      if (phase === 'after') {
        strokeT += dt;
        if (strokeT > 1.2) {
          leader = null;
          streamer = null;
          phase = 'charging';
        }
      }
      // thunder: sound covers the distance at 343 m/s
      if (flashAt >= 0 && thunderHeard < 0 && t - flashAt >= (params.dist * 1000) / SOUND) {
        thunderHeard = t;
        shake = 1;
      }
      shake *= Math.exp(-dt * 2.2);
    }

    function drawCloud(L) {
      const lit = flash;
      for (const p of cloudPuffs) {
        const g = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.4, p.r * 0.1, p.x, p.y, p.r);
        const c = Math.round(lerp(70, 110, p.k) + 140 * lit);
        g.addColorStop(0, `rgba(${c},${c + 6},${c + 22},0.95)`);
        g.addColorStop(1, `rgba(${Math.round(c * 0.55)},${Math.round(c * 0.6)},${Math.round(c * 0.7 + 10)},0.0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      // a dark, flat cloud base
      ctx.fillStyle = `rgba(${30 + 120 * lit},${36 + 120 * lit},${52 + 120 * lit},0.85)`;
      const half = Math.min(L.w * 0.42, 480);
      ctx.beginPath();
      ctx.ellipse(L.sx, L.base - 18, half, 26, 0, 0, TAU);
      ctx.fill();
    }

    function drawCharges(L) {
      // + and − on the ice and hail
      const plus = [], minus = [];
      for (const p of ice) {
        if (Math.abs(p.q) < 0.25) continue;
        (p.q > 0 ? plus : minus).push(p);
      }
      const sz = 3.2;
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(255,120,120,0.9)';
      ctx.beginPath();
      for (const p of plus) {
        ctx.moveTo(p.x - sz, p.y);
        ctx.lineTo(p.x + sz, p.y);
        ctx.moveTo(p.x, p.y - sz);
        ctx.lineTo(p.x, p.y + sz);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120,190,255,0.95)';
      ctx.beginPath();
      for (const p of minus) {
        ctx.moveTo(p.x - sz, p.y);
        ctx.lineTo(p.x + sz, p.y);
      }
      ctx.stroke();
      // hail and crystals as dots
      ctx.fillStyle = 'rgba(230,240,255,0.5)';
      ctx.beginPath();
      for (const p of ice) {
        const r = p.big ? 2.2 : 1.1;
        ctx.moveTo(p.x + 6 + r, p.y + 4);
        ctx.arc(p.x + 6, p.y + 4, r, 0, TAU);
      }
      ctx.fill();
      // induced positive charge on the ground, under the storm
      const n = Math.round(charge * 16);
      const half = Math.min(L.w * 0.34, 380);
      ctx.strokeStyle = 'rgba(255,120,120,0.8)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = L.sx - half + ((i + 0.5) / 16) * half * 2 + (i % 2) * 6;
        const y = L.ground + 10 + (i % 2) * 7;
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 3);
        ctx.lineTo(x, y + 3);
      }
      ctx.stroke();
    }

    function drawGround(L) {
      const O = objects(L);
      const lit = flash;
      ctx.fillStyle = `rgb(${14 + 60 * lit},${24 + 60 * lit},${20 + 60 * lit})`;
      ctx.fillRect(0, L.ground, L.w, L.h - L.ground);
      // tree
      const { tree, house } = O;
      ctx.fillStyle = '#2c2117';
      ctx.fillRect(tree.x - 4 * tree.s, L.ground - 30 * tree.s, 8 * tree.s, 30 * tree.s);
      ctx.fillStyle = `rgb(${22 + 70 * lit},${46 + 80 * lit},${30 + 60 * lit})`;
      ctx.beginPath();
      ctx.moveTo(tree.x, tree.top);
      ctx.lineTo(tree.x + 22 * tree.s, L.ground - 26 * tree.s);
      ctx.lineTo(tree.x - 22 * tree.s, L.ground - 26 * tree.s);
      ctx.fill();
      // house
      const hs = house.s, hx = house.x;
      ctx.fillStyle = `rgb(${60 + 80 * lit},${56 + 80 * lit},${66 + 80 * lit})`;
      ctx.fillRect(hx - 24 * hs, L.ground - 26 * hs, 48 * hs, 26 * hs);
      ctx.fillStyle = `rgb(${90 + 80 * lit},${44 + 60 * lit},${40 + 60 * lit})`;
      ctx.beginPath();
      ctx.moveTo(hx - 30 * hs, L.ground - 26 * hs);
      ctx.lineTo(hx, house.top);
      ctx.lineTo(hx + 30 * hs, L.ground - 26 * hs);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,210,120,0.8)';
      ctx.fillRect(hx - 14 * hs, L.ground - 18 * hs, 8 * hs, 8 * hs);
      if (params.rod) {
        ctx.strokeStyle = '#c9a86a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx, house.rodTop);
        ctx.lineTo(hx, house.top);
        ctx.moveTo(hx + 1, house.top + 4);
        ctx.lineTo(hx + 30 * hs, L.ground - 26 * hs);
        ctx.lineTo(hx + 30 * hs, L.ground + 6);
        ctx.stroke();
      }
      // the observer, far off to the right
      const px = L.ox, py = L.ground;
      ctx.fillStyle = '#c8d0e0';
      ctx.beginPath();
      ctx.arc(px, py - 22, 4.5, 0, TAU);
      ctx.fill();
      ctx.fillRect(px - 3, py - 17, 6, 12);
      ctx.fillRect(px - 3, py - 6, 2.5, 6);
      ctx.fillRect(px + 0.5, py - 6, 2.5, 6);
    }

    function drawLeader() {
      if (!leader) return;
      const { segs } = leader;
      const bright = phase === 'stroke' ? flash : 0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (!leader.done || phase === 'after' || bright < 0.05) {
        // the faint, stepping leader (and its branches afterwards)
        const fade = phase === 'after' ? Math.max(0, 1 - strokeT / 1.2) : 1;
        ctx.strokeStyle = `rgba(190,170,255,${0.55 * fade})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (const s of segs) {
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
        }
        ctx.stroke();
        if (!leader.done) {
          ctx.globalCompositeOperation = 'lighter';
          for (const i of leader.tips) drawGlow(ctx, segs[i].x2, segs[i].y2, 10, '#b9a6ff', 0.4);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      if (streamer) {
        const s = segs[streamer.from];
        const ex = lerp(streamer.x, s.x2, streamer.len * 0.5), ey = lerp(streamer.y, s.y2, streamer.len * 0.5);
        ctx.strokeStyle = 'rgba(255,190,240,0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(streamer.x, streamer.y);
        ctx.lineTo(ex + rand(-2, 2), ey);
        if (streamer.len >= 1) ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      }
      if (leader.done && bright > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        // branches light dimly, the channel blazes
        ctx.strokeStyle = `rgba(200,190,255,${0.5 * bright})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (const s of segs) {
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
        }
        ctx.stroke();
        const ch = leader.channel;
        for (const [wd, a] of [[16, 0.12], [7, 0.35], [2.6, 1]]) {
          ctx.strokeStyle = wd > 3 ? `rgba(180,170,255,${a * bright})` : `rgba(255,255,255,${a * bright})`;
          ctx.lineWidth = wd;
          ctx.beginPath();
          ch.forEach((s, i) => {
            if (!i) ctx.moveTo(s.x2, s.y2);
            ctx.lineTo(s.x1, s.y1);
          });
          if (streamer) ctx.lineTo(streamer.x, streamer.y);
          ctx.stroke();
          if (streamer) {
            ctx.beginPath();
            ctx.moveTo(ch[0].x2, ch[0].y2);
            ctx.lineTo(streamer.x, streamer.y);
            ctx.stroke();
          }
        }
        if (streamer) drawGlow(ctx, streamer.x, streamer.y, 40, '#d9d0ff', 0.6 * bright);
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    function drawThunder(L) {
      if (flashAt < 0) return;
      const since = t - flashAt;
      const pxPerM = (L.ox - L.sx) / (params.dist * 1000);
      const r = since * SOUND * pxPerM;
      const heard = thunderHeard >= 0;
      if (!heard || t - thunderHeard < 1.5) {
        const a = heard ? Math.max(0, 1 - (t - thunderHeard) / 1.5) : 0.5;
        ctx.strokeStyle = `rgba(255,200,120,${a})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.arc(L.sx, L.ground - (L.ground - L.base) * 0.35, Math.max(1, r), -Math.PI * 0.95, Math.PI * 0.2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (api.thumbnail) return;
      const secs = heard ? thunderHeard - flashAt : since;
      if (heard) {
        if (t - thunderHeard < 4) {
          tag(ctx, 'BOOM!', L.ox, L.ground - 62, C.amber, { align: 'center', size: 13 });
          tag(ctx, `${secs.toFixed(1)} s → ${(secs / 3).toFixed(1)} km away`, L.ox, L.ground - 88, C.ink, { align: 'right' });
        }
      } else {
        tag(ctx, `counting… ${Math.floor(since) + 1}`, L.ox, L.ground - 62, C.cyan, { align: 'center' });
      }
    }

    return {
      calm,
      strike,
      reset() {
        calm();
      },
      resize() {
        build();
        leader = null;
        streamer = null;
        if (phase !== 'charging') phase = 'charging';
      },
      pointerDown() {
        strike();
      },
      update,
      draw() {
        const L = lay();
        ctx.save();
        if (shake > 0.02) ctx.translate(rand(-3, 3) * shake, rand(-2, 2) * shake);
        // night sky, lit by the flash
        const sky = ctx.createLinearGradient(0, 0, 0, L.ground);
        const f = flash;
        sky.addColorStop(0, `rgb(${8 + 90 * f},${10 + 90 * f},${24 + 110 * f})`);
        sky.addColorStop(1, `rgb(${16 + 120 * f},${22 + 120 * f},${40 + 130 * f})`);
        ctx.fillStyle = sky;
        ctx.fillRect(-10, -10, L.w + 20, L.h + 20);
        drawCloud(L);
        drawCharges(L);
        drawGround(L);
        drawLeader();
        drawThunder(L);
        ctx.restore();
        if (!api.thumbnail) {
          // charge meter: field strength at the ground as a share of breakdown
          const x = 16, y = L.narrow ? L.ground + 30 : 96, wd = Math.min(180, L.w * 0.4);
          text(ctx, 'Electric field', x, y - 10, { size: 11, color: C.dim });
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(x, y, wd, 7);
          ctx.fillStyle = charge > 0.9 ? C.amber : C.cyan;
          ctx.fillRect(x, y, wd * charge, 7);
          text(ctx, phase === 'leader' ? 'breakdown!' : `${(charge * 3).toFixed(1)} of 3 MV/m`, x + wd + 8, y + 4, { size: 11, color: charge > 0.9 ? C.amber : C.ink, mono: true });
          if (cloudPuffs.length) {
            tag(ctx, '+ top', Math.min(L.w - 30, L.sx + Math.min(L.w * 0.25, 260)), L.cloudTop + 34, '#ff8080', { align: 'center', size: 10 });
            tag(ctx, '− base', Math.min(L.w - 34, L.sx + Math.min(L.w * 0.3, 300)), L.base - 12, C.cyan, { align: 'center', size: 10 });
          }
          tag(ctx, 'you', L.ox, L.ground - 36, C.ink, { align: 'center', size: 10 });
        }
      },
      stats() {
        const since = flashAt >= 0 ? (thunderHeard >= 0 ? thunderHeard - flashAt : t - flashAt) : 0;
        return [
          { label: 'Cloud charge', value: Math.round(charge * 100) + '%', color: charge > 0.9 ? C.amber : C.cyan },
          { label: 'Stage', value: { charging: 'charging up', leader: 'stepped leader', stroke: 'return stroke!', after: 'channel cooling' }[phase] },
          { label: 'Thunder delay', value: (params.dist * 1000) / SOUND > 0 ? `${((params.dist * 1000) / SOUND).toFixed(1)} s for ${params.dist.toFixed(1)} km` : '—' },
          { label: 'Since the flash', value: flashAt >= 0 ? since.toFixed(1) + ' s' : '—' },
        ];
      },
    };
  },
};
