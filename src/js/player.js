// Full-screen player: stage, guided story mode, controls panel, live data and charts.

import { Runner } from './core/engine.js';
import { CATEGORY, ICONS } from './categories.js';
import { FONT, MONO, rgba } from './core/util.js';

const h = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html !== undefined) el.innerHTML = html;
  return el;
};
const pad = (n) => String(n).padStart(2, '0');

export class Player {
  constructor(root, def, { onBack, next, prev }) {
    this.def = def;
    this.cat = CATEGORY[def.category];
    this.story = def.story || [];
    this.chapter = -1;
    this.chapterTime = 0;
    this.auto = this.story.length > 0;
    this.onBack = onBack;

    const el = (this.el = h('div', 'player'));
    el.style.setProperty('--accent', this.cat.color);
    el.style.setProperty('--accent-soft', rgba(this.cat.color, 0.16));
    el.innerHTML = `
      <header class="p-top">
        <button class="icon-btn" data-act="back" title="All simulations (Esc)">${ICONS.back}</button>
        <div class="p-title">
          <span class="chip"><i>${this.cat.icon}</i>${this.cat.name}</span>
          <h1>${def.title}</h1>
        </div>
        <div class="p-actions">
          <div class="seg speed" title="Simulation speed">
            ${[0.25, 0.5, 1, 2, 4].map((s) => `<button data-speed="${s}" class="${s === 1 ? 'on' : ''}">${s}×</button>`).join('')}
          </div>
          <button class="icon-btn" data-act="play" title="Play / pause (Space)">${ICONS.pause}</button>
          <button class="icon-btn" data-act="restart" title="Restart (R)">${ICONS.restart}</button>
          <button class="icon-btn" data-act="full" title="Fullscreen (F)">${ICONS.expand}</button>
          <button class="icon-btn" data-act="panel" title="Controls & data (C)">${ICONS.sliders}</button>
        </div>
      </header>
      <div class="p-body">
        <div class="stage">
          <div class="stage-host"></div>
          ${def.hint ? `<div class="hint"><i>${ICONS.hand}</i>${def.hint}</div>` : ''}
          <div class="story-card"></div>
        </div>
        <aside class="panel">
          <button class="sheet-handle" data-act="panel" aria-label="Close controls"></button>
          <div class="panel-scroll">
            <section class="sec-about">
              <p class="lede">${def.blurb || ''}</p>
            </section>
            <section class="sec-controls"><h3>Controls</h3><div class="controls"></div></section>
            <section class="sec-data"><h3>Live data</h3><div class="stats"></div><div class="charts"></div></section>
            ${def.ideas ? `<section class="sec-ideas"><h3>Key ideas</h3><ul>${def.ideas.map((i) => `<li>${i}</li>`).join('')}</ul></section>` : ''}
            <nav class="sec-nav">
              ${prev ? `<a href="#/sim/${prev.id}"><small>Previous</small>${prev.title}</a>` : '<span></span>'}
              ${next ? `<a href="#/sim/${next.id}" class="r"><small>Next</small>${next.title}</a>` : '<span></span>'}
            </nav>
          </div>
        </aside>
      </div>`;
    root.appendChild(el);

    this.$ = (s) => el.querySelector(s);
    this.stageHost = this.$('.stage-host');
    if (window.innerWidth < 900) el.classList.add('panel-closed');

    try {
      this.runner = new Runner(this.stageHost, def);
    } catch (err) {
      this.stageHost.innerHTML = `<div class="error">This simulation could not start: ${err.message}</div>`;
      console.error(err);
      return;
    }
    this.runner.onParamChange = (k, v) => this.syncControl(k, v);
    this.runner.onInteract = () => {
      this.$('.hint')?.classList.add('gone');
    };
    this.runner.onFrame = (dt) => this.tick(dt);

    this.buildControls();
    this.buildStory();
    this.bind();
    if (this.story.length) this.goto(0, true);
    else this.$('.story-card').remove();
    this.runner.start();
    setTimeout(() => this.$('.hint')?.classList.add('gone'), 9000);
  }

  // ------------------------------------------------------------------ controls
  buildControls() {
    const box = this.$('.controls');
    this.controls = {};
    const params = (this.def.params || []).filter((p) => !p.hidden);
    if (!params.length) this.$('.sec-controls').remove();
    for (const p of params) {
      const row = h('div', 'ctl ctl-' + p.type);
      if (p.type === 'range') {
        row.innerHTML = `<label><span>${p.label}</span><output></output></label><input type="range" min="${p.min}" max="${p.max}" step="${p.step || 'any'}">`;
        const input = row.querySelector('input');
        const out = row.querySelector('output');
        const show = (v) => {
          input.value = v;
          out.textContent = p.format ? p.format(v) : `${(+v).toFixed(p.digits ?? (p.step && p.step < 1 ? 2 : 0))}${p.unit ? ' ' + p.unit : ''}`;
          input.style.setProperty('--fill', ((v - p.min) / (p.max - p.min)) * 100 + '%');
        };
        input.addEventListener('input', () => {
          this.userTook();
          this.runner.set(p.key, +input.value);
          show(+input.value);
        });
        this.controls[p.key] = show;
      } else if (p.type === 'toggle') {
        row.innerHTML = `<label class="switch"><span>${p.label}</span><input type="checkbox"><i></i></label>`;
        const input = row.querySelector('input');
        input.addEventListener('change', () => {
          this.userTook();
          this.runner.set(p.key, input.checked);
        });
        this.controls[p.key] = (v) => (input.checked = !!v);
      } else if (p.type === 'select') {
        row.innerHTML = `<label><span>${p.label}</span></label><div class="seg wrap">${p.options
          .map((o) => `<button data-v="${o.value}">${o.label}</button>`)
          .join('')}</div>`;
        const btns = [...row.querySelectorAll('button')];
        btns.forEach((b, i) =>
          b.addEventListener('click', () => {
            this.userTook();
            this.runner.set(p.key, p.options[i].value);
          }),
        );
        this.controls[p.key] = (v) => btns.forEach((b, i) => b.classList.toggle('on', p.options[i].value === v));
      } else if (p.type === 'button') {
        row.innerHTML = `<button class="btn">${p.label}</button>`;
        row.querySelector('button').addEventListener('click', () => {
          this.userTook();
          p.action(this.runner.sim, this.runner);
        });
      }
      if (p.help) row.title = p.help;
      box.appendChild(row);
      if (this.controls[p.key]) this.controls[p.key](this.runner.params[p.key]);
    }
    // group consecutive buttons in one row
    let group = null;
    for (const row of [...box.children]) {
      if (!row.classList.contains('ctl-button')) {
        group = null;
        continue;
      }
      if (!group) {
        group = h('div', 'ctl-buttons');
        row.before(group);
      }
      group.appendChild(row.firstChild);
      row.remove();
    }
  }

  syncControl(k, v) {
    this.controls?.[k]?.(v);
  }

  // ------------------------------------------------------------------ story
  buildStory() {
    const card = this.$('.story-card');
    if (!card || !this.story.length) return;
    card.innerHTML = `
      <div class="sc-head">
        <span class="sc-step"></span>
        <div class="sc-dots">${this.story.map((_, i) => `<button data-ch="${i}" title="${this.story[i].title}"><i></i></button>`).join('')}</div>
        <button class="sc-mode" title="Toggle auto-play of the guided story"></button>
        <button class="icon-btn sm sc-min" title="Collapse">${ICONS.minimize}</button>
      </div>
      <div class="sc-body">
        <h2></h2><p></p><div class="formula"></div>
      </div>
      <div class="sc-nav">
        <button class="icon-btn sm" data-act="prev" title="Previous (←)">${ICONS.prev}</button>
        <button class="btn primary" data-act="next">Next ${ICONS.next}</button>
      </div>`;
    card.querySelectorAll('.sc-dots button').forEach((b) => b.addEventListener('click', () => this.goto(+b.dataset.ch)));
    card.querySelector('[data-act=prev]').addEventListener('click', () => this.goto(this.chapter - 1));
    card.querySelector('[data-act=next]').addEventListener('click', () => {
      if (this.chapter >= this.story.length - 1) {
        card.classList.add('min');
        this.setAuto(false);
      } else this.goto(this.chapter + 1);
    });
    card.querySelector('.sc-min').addEventListener('click', () => card.classList.toggle('min'));
    card.querySelector('.sc-mode').addEventListener('click', () => this.setAuto(!this.auto));
    this.setAuto(this.auto);
  }

  setAuto(on) {
    this.auto = on;
    const b = this.$('.sc-mode');
    if (b) {
      b.textContent = on ? 'Auto-play on' : 'Auto-play off';
      b.classList.toggle('on', on);
    }
  }

  userTook() {
    // Touching a control means the viewer is exploring; stop auto-advancing.
    if (this.auto) this.setAuto(false);
  }

  goto(i, instant = false) {
    if (i < 0 || i >= this.story.length) return;
    const ch = this.story[i];
    this.chapter = i;
    this.chapterTime = 0;
    this.runner.applyParams(ch.params, instant ? 0 : ch.tween ?? 1.4);
    ch.enter?.(this.runner.sim, this.runner);
    const card = this.$('.story-card');
    const body = card.querySelector('.sc-body');
    body.classList.remove('in');
    void body.offsetWidth;
    body.classList.add('in');
    card.querySelector('.sc-step').textContent = `${pad(i + 1)} / ${pad(this.story.length)}`;
    card.querySelector('h2').textContent = ch.title;
    card.querySelector('p').innerHTML = ch.text;
    const f = card.querySelector('.formula');
    f.innerHTML = ch.formula || '';
    f.style.display = ch.formula ? '' : 'none';
    card.querySelectorAll('.sc-dots button').forEach((b, j) => {
      b.classList.toggle('done', j < i);
      b.classList.toggle('on', j === i);
      b.style.setProperty('--p', j < i ? 1 : 0);
    });
    const next = card.querySelector('[data-act=next]');
    next.innerHTML = i === this.story.length - 1 ? 'Explore freely' : `Next ${ICONS.next}`;
  }

  tick(dt) {
    // story auto-advance
    if (this.story.length && this.auto && !this.runner.paused) {
      const ch = this.story[this.chapter];
      this.chapterTime += dt;
      const dur = ch.duration || 12;
      const dot = this.$(`.sc-dots button[data-ch="${this.chapter}"]`);
      dot?.style.setProperty('--p', Math.min(1, this.chapterTime / dur));
      if (this.chapterTime >= dur) {
        if (this.chapter < this.story.length - 1) this.goto(this.chapter + 1);
        else this.setAuto(false);
      }
    }
    // stats at ~6 Hz, charts every other frame
    const f = this.runner.frame;
    if (f % 10 === 0) this.drawStats();
    if (f % 2 === 0) this.drawCharts();
  }

  drawStats() {
    const stats = this.runner.sim.stats?.();
    const box = this.$('.stats');
    if (!stats || !stats.length) {
      if (!this.runner.sim.charts) this.$('.sec-data')?.remove();
      return;
    }
    if (box.children.length !== stats.length) {
      box.innerHTML = stats.map(() => `<div class="stat"><span></span><b></b></div>`).join('');
    }
    stats.forEach((s, i) => {
      const el = box.children[i];
      el.children[0].textContent = s.label;
      el.children[1].textContent = s.value;
      el.children[1].style.color = s.color || '';
    });
  }

  drawCharts() {
    const charts = this.runner.sim.charts?.();
    if (!charts) return;
    const box = this.$('.charts');
    if (!box) return;
    while (box.children.length < charts.length) {
      const wrap = h('div', 'chart', '<div class="chart-head"><span></span><em></em></div><canvas></canvas>');
      box.appendChild(wrap);
    }
    while (box.children.length > charts.length) box.lastChild.remove();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    charts.forEach((c, i) => {
      const wrap = box.children[i];
      wrap.querySelector('span').textContent = c.title;
      wrap.querySelector('em').innerHTML = (c.series || [])
        .filter((s) => s.label)
        .map((s) => `<i style="background:${s.color}"></i>${s.label}`)
        .join('');
      const cv = wrap.querySelector('canvas');
      const W = cv.clientWidth || 260;
      const H = c.height || 110;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        cv.style.height = H + 'px';
      }
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      drawChart(g, c, W, H);
    });
  }

  // ------------------------------------------------------------------ chrome
  bind() {
    const el = this.el;
    el.querySelector('[data-act=back]').addEventListener('click', () => this.onBack());
    el.querySelector('[data-act=play]').addEventListener('click', () => this.togglePlay());
    el.querySelector('[data-act=restart]').addEventListener('click', () => this.restart());
    el.querySelector('[data-act=full]').addEventListener('click', () => this.fullscreen());
    el.querySelectorAll('[data-act=panel]').forEach((b) => b.addEventListener('click', () => el.classList.toggle('panel-closed')));
    el.querySelectorAll('[data-speed]').forEach((b) =>
      b.addEventListener('click', () => {
        this.runner.speed = +b.dataset.speed;
        el.querySelectorAll('[data-speed]').forEach((x) => x.classList.toggle('on', x === b));
      }),
    );
    this.onKey = (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === ' ') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.key === 'ArrowRight') this.goto(this.chapter + 1);
      else if (e.key === 'ArrowLeft') this.goto(this.chapter - 1);
      else if (e.key === 'r' || e.key === 'R') this.restart();
      else if (e.key === 'f' || e.key === 'F') this.fullscreen();
      else if (e.key === 'c' || e.key === 'C') el.classList.toggle('panel-closed');
      else if (e.key === 'h' || e.key === 'H') el.classList.toggle('ui-hidden');
      else if (e.key === 'Escape' && !document.fullscreenElement) this.onBack();
    };
    window.addEventListener('keydown', this.onKey);
    // panel slide transitions change the stage size; keep canvas in sync
    el.querySelector('.panel').addEventListener('transitionend', () => this.runner.measure());
  }

  togglePlay() {
    this.runner.paused = !this.runner.paused;
    this.$('[data-act=play]').innerHTML = this.runner.paused ? ICONS.play : ICONS.pause;
    this.el.classList.toggle('paused', this.runner.paused);
  }

  restart() {
    this.runner.reset();
    if (this.story.length) {
      this.setAuto(true);
      this.$('.story-card').classList.remove('min');
      this.goto(0, true);
    }
  }

  fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else this.el.requestFullscreen?.().catch(() => {});
  }

  destroy() {
    window.removeEventListener('keydown', this.onKey);
    this.runner?.destroy();
    this.el.remove();
  }
}

// ---------------------------------------------------------------- chart drawing

function drawChart(g, c, W, H) {
  const padL = 4, padR = 4, padT = 8, padB = c.xLabel ? 16 : 6;
  const w = W - padL - padR, hh = H - padT - padB;
  const series = c.series || [];
  let min = c.min, max = c.max;
  if (min === undefined || max === undefined) {
    let lo = Infinity, hi = -Infinity;
    for (const s of series) for (const v of s.data) if (isFinite(v)) (lo = Math.min(lo, v)), (hi = Math.max(hi, v));
    if (c.ref) for (const v of c.ref.data) (lo = Math.min(lo, v)), (hi = Math.max(hi, v));
    if (!isFinite(lo)) (lo = 0), (hi = 1);
    if (hi - lo < 1e-9) hi = lo + 1;
    if (min === undefined) min = lo;
    if (max === undefined) max = hi + (hi - lo) * 0.08;
  }
  const Y = (v) => padT + hh - ((v - min) / (max - min)) * hh;
  // grid
  g.strokeStyle = 'rgba(160,175,220,0.08)';
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i <= 3; i++) {
    const y = Math.round(padT + (hh * i) / 3) + 0.5;
    g.moveTo(padL, y);
    g.lineTo(padL + w, y);
  }
  g.stroke();

  if (c.kind === 'bars') {
    for (const s of series) {
      const n = s.data.length;
      const bw = w / n;
      for (let i = 0; i < n; i++) {
        const y = Y(s.data[i]);
        const grad = g.createLinearGradient(0, y, 0, padT + hh);
        grad.addColorStop(0, rgba(s.color, 0.9));
        grad.addColorStop(1, rgba(s.color, 0.15));
        g.fillStyle = grad;
        g.fillRect(padL + i * bw + 0.5, y, Math.max(1, bw - 1.5), padT + hh - y);
      }
    }
  } else {
    for (const s of series) {
      const n = s.data.length;
      if (n < 2) continue;
      const N = c.length || n;
      const X = (i) => padL + (i / (N - 1)) * w;
      g.beginPath();
      for (let i = 0; i < n; i++) g[i ? 'lineTo' : 'moveTo'](X(i), Y(s.data[i]));
      if (s.fill !== false && series.length <= 3) {
        g.save();
        g.lineTo(X(n - 1), padT + hh);
        g.lineTo(X(0), padT + hh);
        g.closePath();
        const grad = g.createLinearGradient(0, padT, 0, padT + hh);
        grad.addColorStop(0, rgba(s.color, 0.28));
        grad.addColorStop(1, rgba(s.color, 0));
        g.fillStyle = grad;
        g.fill();
        g.restore();
        g.beginPath();
        for (let i = 0; i < n; i++) g[i ? 'lineTo' : 'moveTo'](X(i), Y(s.data[i]));
      }
      g.strokeStyle = s.color;
      g.lineWidth = 1.6;
      g.lineJoin = 'round';
      g.stroke();
    }
  }
  if (c.ref) {
    const d = c.ref.data, n = d.length;
    g.beginPath();
    for (let i = 0; i < n; i++) g[i ? 'lineTo' : 'moveTo'](padL + (i / (n - 1)) * w, Y(d[i]));
    g.strokeStyle = c.ref.color || '#fff';
    g.setLineDash([4, 3]);
    g.lineWidth = 1.4;
    g.stroke();
    g.setLineDash([]);
  }
  if (c.xLabel) {
    g.font = `500 10px ${FONT}`;
    g.fillStyle = 'rgba(233,237,247,0.45)';
    g.textAlign = 'center';
    g.fillText(c.xLabel, W / 2, H - 4);
  }
  if (c.yMaxLabel) {
    g.font = `500 10px ${MONO}`;
    g.fillStyle = 'rgba(233,237,247,0.45)';
    g.textAlign = 'right';
    g.fillText(c.yMaxLabel, W - 4, padT + 8);
  }
}
