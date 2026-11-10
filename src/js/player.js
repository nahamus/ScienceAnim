// Full-screen player: stage, guided story mode, controls panel, live data and charts.

import { Runner } from './core/engine.js';
import { CATEGORY, ICONS } from './categories.js';
import { FONT, MONO, rgba } from './core/util.js';
import { buildShare, chapterBaseline } from './share.js';

const h = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html !== undefined) el.innerHTML = html;
  return el;
};
const pad = (n) => String(n).padStart(2, '0');
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Recording a clip needs a canvas stream and a recorder that can encode it.
const CAN_RECORD = typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;
const CLIP_MAX = 60; // seconds

export class Player {
  constructor(root, def, { onBack, next, prev, start, embed = false, lesson = null }) {
    this.def = def;
    this.cat = CATEGORY[def.category];
    this.story = def.story || [];
    this.chapter = -1;
    this.chapterTime = 0;
    this.answers = new Map(); // chapter index -> chosen option (-1 = skipped) for quick checks
    this.auto = this.story.length > 0;
    this.onBack = onBack;
    this.embed = embed; // inside someone else's page (an iframe): no way back to the gallery

    const el = (this.el = h('div', embed ? 'player embed' : 'player'));
    el.style.setProperty('--accent', this.cat.color);
    el.style.setProperty('--accent-soft', rgba(this.cat.color, 0.16));
    el.innerHTML = `
      <header class="p-top">
        ${
          embed
            ? `<a class="icon-btn" data-act="open" target="_blank" rel="noopener" title="Open in ScienceAnim">${ICONS.external}</a>`
            : `<button class="icon-btn" data-act="back" title="All simulations (Esc)">${ICONS.back}</button>`
        }
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
          <div class="share">
            <button class="icon-btn" data-act="share" title="Share this view" aria-haspopup="menu" aria-expanded="false">${ICONS.link}</button>
            <div class="share-menu" role="menu" hidden>
              <button role="menuitem" data-share="link">${ICONS.link}<span>Copy link</span></button>
              <button role="menuitem" data-share="embed">${ICONS.code}<span>Copy embed code</span></button>
              ${CAN_RECORD ? `<button role="menuitem" data-share="clip">${ICONS.record}<span>Record a clip</span></button>` : ''}
              ${def.story?.length ? `<a role="menuitem" data-share="sheet" href="#/sheet/${def.id}"${embed ? ' target="_blank" rel="noopener"' : ''}>${ICONS.print}<span>Printable worksheet</span></a>` : ''}
            </div>
          </div>
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
            ${
              embed
                ? ''
                : `<nav class="sec-nav">
              ${prev ? `<a href="${prev.href || '#/sim/' + prev.id}"><small>Previous${lesson ? ' in lesson' : ''}</small>${esc(prev.title)}</a>` : '<span></span>'}
              ${next ? `<a href="${next.href || '#/sim/' + next.id}" class="r"><small>Next${lesson ? ' in lesson' : ''}</small>${esc(next.title)}</a>` : '<span></span>'}
            </nav>`
            }
          </div>
        </aside>
      </div>
      ${lesson ? lessonBar(lesson) : ''}`;
    root.appendChild(el);

    this.$ = (s) => el.querySelector(s);
    this.stageHost = this.$('.stage-host');
    // embedded players are usually small, so give the animation the room
    if (embed || window.innerWidth < 900) el.classList.add('panel-closed');

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
    if (start) this.openAt(start);
    // a short embed (a class page, a slide) shows the animation first; the story is one tap away
    if (embed && window.innerHeight < 560) this.$('.story-card')?.classList.add('min');
    this.runner.start();
    setTimeout(() => this.$('.hint')?.classList.add('gone'), 9000);
  }

  // ------------------------------------------------------------------ links
  /** Recreate the view a shared link describes: its chapter, then its control values. */
  openAt({ chapter, params }) {
    if (this.story.length) {
      // step through earlier chapters' settings so the state matches reading the story to here
      for (let j = 0; j < chapter; j++) this.runner.applyParams(this.story[j].params, 0);
      this.goto(chapter, true);
      this.setAuto(false); // stay on the chapter that was shared
    }
    this.runner.applyParams(params, 0);
  }

  /** The link for what's on screen now (sliders mid-tween count as their destination). */
  shareHash(embed = this.embed) {
    const values = { ...this.runner.params };
    for (const [k, tw] of this.runner.tweens) values[k] = tw.to;
    return buildShare(this.def, this.chapter, values, { embed, asking: this.pendingCheck() });
  }

  /**
   * Full URL of the current view. Normal links go to the simulation's own page (…/sim/<id>/?ch=3), whose
   * tags give it a proper preview in chat apps and search results; embeds use the in-app address.
   */
  shareUrl(embed = false) {
    const app = location.origin + location.pathname.replace(/[^/]*$/, ''); // drop a trailing index.html
    const hash = this.shareHash(embed);
    return app + (embed ? hash : hash.replace(/^#\/sim\/([\w-]+)/, 'sim/$1/'));
  }

  /** Keep the address bar pointing at the current view, without adding history entries. */
  syncUrl() {
    if (!location.hash.startsWith(`#/sim/${this.def.id}`)) return;
    const hash = this.shareHash();
    if (hash !== location.hash) history.replaceState(history.state, '', hash);
    const open = this.$('[data-act=open]');
    if (open) open.href = this.shareUrl(false); // "Open in ScienceAnim" lands on this exact view
  }

  /** An <iframe> snippet for class pages, slide decks and learning platforms. */
  embedCode() {
    const title = `${this.def.title} · ScienceAnim`.replace(/"/g, '&quot;');
    return (
      `<iframe src="${this.shareUrl(true)}" title="${title}" width="800" height="500" ` +
      `style="width:100%;max-width:100%;aspect-ratio:16/10;height:auto;border:0;border-radius:12px" ` +
      `allow="fullscreen; clipboard-write" loading="lazy"></iframe>`
    );
  }

  toggleShareMenu(open = this.$('.share-menu').hidden) {
    const menu = this.$('.share-menu');
    menu.hidden = !open;
    this.$('[data-act=share]').setAttribute('aria-expanded', String(open));
    if (open) menu.querySelector('button').focus({ preventScroll: true });
  }

  async share(kind) {
    this.toggleShareMenu(false);
    if (kind === 'sheet') return; // a plain link
    if (kind === 'clip') return this.record();
    this.syncUrl();
    const blocked = 'Your browser blocked copying';
    if (kind === 'embed') {
      const ok = await copyText(this.embedCode());
      return this.toast(ok ? 'Embed code copied' : blocked);
    }
    const url = this.shareUrl(false);
    // phones and tablets: hand the link to the system share sheet (Messages, Classroom, mail…)
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // the viewer closed the sheet
      }
    }
    const ok = await copyText(url);
    this.toast(ok ? 'Link copied' : this.embed ? blocked : 'Copy the link from the address bar');
  }

  // ------------------------------------------------------------------ clips
  /** Start recording the animation (not the interface) to a video file; call again to stop and save it. */
  record() {
    if (this.recorder) return this.recorder.stop();
    const type = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
    let rec, stream;
    try {
      stream = this.runner.canvas.captureStream(30);
      rec = new MediaRecorder(stream, { ...(type && { mimeType: type }), videoBitsPerSecond: 8e6 });
    } catch (err) {
      console.warn(err);
      stream?.getTracks().forEach((t) => t.stop());
      return this.toast('This browser can’t record the animation');
    }
    const chunks = [];
    const started = performance.now();
    const pill = h('div', 'rec', `<i></i><span>0:00</span><button>Stop &amp; save</button>`);
    pill.querySelector('button').addEventListener('click', () => rec.stop());
    this.$('.stage').appendChild(pill);
    this.el.classList.add('recording');
    const timer = setInterval(() => {
      const s = (performance.now() - started) / 1000;
      pill.querySelector('span').textContent = `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
      if (s >= CLIP_MAX) rec.stop();
    }, 250);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      pill.remove();
      this.el.classList.remove('recording');
      this.recorder = null;
      if (this.destroyed || !chunks.length) return;
      const mime = rec.mimeType || type || 'video/webm';
      const blob = new Blob(chunks, { type: mime });
      const a = h('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${this.def.id}-clip.${mime.includes('mp4') ? 'mp4' : 'webm'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
      this.toast('Clip saved to your downloads');
    };
    this.recorder = rec;
    rec.start(500);
    if (this.runner.paused) this.togglePlay();
    this.toast(`Recording: up to ${CLIP_MAX} s`);
  }

  toast(text) {
    let t = this.$('.toast');
    if (!t) this.$('.stage').appendChild((t = h('div', 'toast')));
    t.textContent = text;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
  }

  // ------------------------------------------------------------------ controls
  buildControls() {
    const box = this.$('.controls');
    this.controls = {};
    const params = (this.def.params || []).filter((p) => !p.hidden);
    if (!params.length) this.$('.sec-controls').remove();
    for (const p of params) {
      const row = h('div', 'ctl ctl-' + p.type);
      row.dataset.key = p.key;
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
        <div class="sc-dots">${this.story
          .map((c, i) => `<button data-ch="${i}" title="${c.title}${c.check ? ' (quick check)' : ''}"${c.check ? ' class="q"' : ''}><i></i></button>`)
          .join('')}</div>
        <button class="sc-mode" title="Toggle auto-play of the guided story"></button>
        <button class="icon-btn sm sc-min" title="Collapse">${ICONS.minimize}</button>
      </div>
      <div class="sc-body">
        <h2></h2><p class="sc-text"></p><div class="sc-check"></div><div class="formula"></div>
      </div>
      <div class="sc-nav">
        <button class="icon-btn sm" data-act="prev" title="Previous (←)">${ICONS.prev}</button>
        <button class="btn primary" data-act="next">Next ${ICONS.next}</button>
      </div>`;
    card.querySelectorAll('.sc-dots button').forEach((b) => b.addEventListener('click', () => this.goto(+b.dataset.ch)));
    card.querySelector('[data-act=prev]').addEventListener('click', () => this.goto(this.chapter - 1));
    card.querySelector('[data-act=next]').addEventListener('click', () => this.next());
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

  /** Next button / → key: reveal a pending quick check first, then move on. */
  next() {
    if (this.pendingCheck()) return this.answer(-1);
    if (this.chapter >= this.story.length - 1) {
      this.$('.story-card').classList.add('min');
      this.setAuto(false);
    } else this.goto(this.chapter + 1);
  }

  pendingCheck() {
    return !!this.story[this.chapter]?.check && !this.answers.has(this.chapter);
  }

  /** Record a quick-check answer (or -1 to skip), then play out the chapter that shows why. */
  answer(choice) {
    const i = this.chapter;
    const ch = this.story[i];
    if (!ch?.check || this.answers.has(i)) return;
    this.answers.set(i, choice);
    if (this.pausedForCheck) {
      this.pausedForCheck = false;
      if (this.runner.paused) this.togglePlay();
    }
    this.chapterTime = 0;
    this.runner.applyParams(ch.params, ch.tween ?? 1.4);
    ch.enter?.(this.runner.sim, this.runner);
    this.renderChapter();
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
    if (this.pausedForCheck && this.runner.paused) this.togglePlay();
    this.pausedForCheck = false;
    if (ch.check && !this.answers.has(i)) {
      // quick check: set the scene (the same however you got here), then hold still until the
      // viewer predicts what happens
      this.runner.applyParams(chapterBaseline(this.def, i, true), instant ? 0 : ch.tween ?? 1.4);
      if (!this.runner.paused) {
        this.togglePlay();
        this.pausedForCheck = true;
      }
    } else {
      this.runner.applyParams(ch.params, instant ? 0 : ch.tween ?? 1.4);
      ch.enter?.(this.runner.sim, this.runner);
    }
    this.renderChapter();
  }

  renderChapter() {
    const i = this.chapter;
    const ch = this.story[i];
    const card = this.$('.story-card');
    const body = card.querySelector('.sc-body');
    body.classList.remove('in');
    void body.offsetWidth;
    body.classList.add('in');
    card.querySelector('.sc-step').textContent = `${pad(i + 1)} / ${pad(this.story.length)}`;
    card.querySelector('h2').textContent = ch.title;
    const pending = this.pendingCheck();
    const text = card.querySelector('.sc-text');
    text.innerHTML = ch.text;
    text.hidden = pending; // the chapter text gives the answer away
    const f = card.querySelector('.formula');
    f.innerHTML = ch.formula || '';
    f.style.display = ch.formula && !pending ? '' : 'none';
    this.renderCheck(card.querySelector('.sc-check'), ch.check, this.answers.get(i));
    card.querySelectorAll('.sc-dots button').forEach((b, j) => {
      b.classList.toggle('done', j < i);
      b.classList.toggle('on', j === i);
      b.style.setProperty('--p', j < i ? 1 : 0);
    });
    const next = card.querySelector('[data-act=next]');
    next.innerHTML = pending ? 'Show me' : i === this.story.length - 1 ? 'Explore freely' : `Next ${ICONS.next}`;
  }

  /** A prediction question with its options, or (once answered) the verdict and explanation. */
  renderCheck(box, check, choice) {
    box.innerHTML = '';
    box.hidden = !check;
    if (!check) return;
    const answered = choice !== undefined;
    box.className = 'sc-check' + (answered ? ' answered' : '');
    box.appendChild(h('div', 'sc-q', `<b>Predict</b> ${check.q}`));
    const opts = h('div', 'sc-options');
    check.options.forEach((label, k) => {
      const b = h('button', '', label);
      if (answered) {
        b.disabled = true;
        if (k === check.answer) b.classList.add('right');
        else if (k === choice) b.classList.add('wrong');
      } else b.addEventListener('click', () => this.answer(k));
      opts.appendChild(b);
    });
    box.appendChild(opts);
    if (answered) {
      const verdict = choice === check.answer ? 'Yes!' : choice === -1 ? 'Here’s why.' : 'Not quite.';
      box.appendChild(h('p', 'sc-explain', `<b>${verdict}</b> ${check.explain}`));
    }
  }

  tick(dt) {
    // story auto-advance
    if (this.story.length && this.auto && !this.runner.paused && !this.pendingCheck()) {
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
    if (f % 15 === 0) this.syncUrl();
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
    el.querySelector('[data-act=back]')?.addEventListener('click', () => this.onBack());
    el.querySelector('[data-act=open]')?.addEventListener('click', (e) => {
      e.currentTarget.href = this.shareUrl(false);
      if (!this.runner.paused) this.togglePlay(); // it carries on in the new tab
    });
    el.querySelector('[data-act=play]').addEventListener('click', () => this.togglePlay());
    el.querySelector('[data-act=restart]').addEventListener('click', () => this.restart());
    el.querySelector('[data-act=full]').addEventListener('click', () => this.fullscreen());
    el.querySelector('[data-act=share]').addEventListener('click', () => this.toggleShareMenu());
    el.querySelectorAll('[data-share]').forEach((b) => b.addEventListener('click', () => this.share(b.dataset.share)));
    if (navigator.share && matchMedia('(pointer: coarse)').matches) this.$('[data-share=link] span').textContent = 'Share link…';
    this.onDocPointer = (e) => {
      if (!e.target.closest('.share')) this.toggleShareMenu(false);
    };
    document.addEventListener('pointerdown', this.onDocPointer);
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
      } else if (e.key === 'ArrowRight') this.next();
      else if (e.key === 'ArrowLeft') this.goto(this.chapter - 1);
      else if (e.key === 'r' || e.key === 'R') this.restart();
      else if (e.key === 'f' || e.key === 'F') this.fullscreen();
      else if (e.key === 'c' || e.key === 'C') el.classList.toggle('panel-closed');
      else if (e.key === 'h' || e.key === 'H') el.classList.toggle('ui-hidden');
      else if (e.key === 'Escape' && !this.$('.share-menu').hidden) this.toggleShareMenu(false);
      else if (e.key === 'Escape' && !document.fullscreenElement && !this.embed) this.onBack();
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
    this.answers.clear();
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
    this.destroyed = true;
    if (this.recorder?.state === 'recording') this.recorder.stop();
    window.removeEventListener('keydown', this.onKey);
    document.removeEventListener('pointerdown', this.onDocPointer);
    this.runner?.destroy();
    this.el.remove();
  }
}

/** The strip under the header in a lesson: its title, a numbered step for each simulation, and Next. */
function lessonBar({ title, step, items }) {
  const next = items[step + 1];
  return `<nav class="lesson-bar" aria-label="Lesson">
    <span class="lb-title">${ICONS.book}<b>${esc(title || 'Lesson')}</b><em>${step + 1} of ${items.length}</em></span>
    <ol>${items
      .map(
        (it, k) =>
          `<li><a href="${it.href}" title="${esc(it.title)}" class="${k === step ? 'on' : k < step ? 'done' : ''}"${k === step ? ' aria-current="step"' : ''}>${k + 1}</a></li>`,
      )
      .join('')}</ol>
    ${
      next
        ? `<a class="btn primary lb-next" href="${next.href}"><span>Next: ${esc(next.title)}</span>${ICONS.next}</a>`
        : `<a class="btn lb-next" href="#/"><span>Lesson complete</span></a>`
    }
  </nav>`;
}

/** Copy text, falling back to a hidden textarea where the clipboard API is unavailable. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand?.('copy') ?? false;
    ta.remove();
    return ok;
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
