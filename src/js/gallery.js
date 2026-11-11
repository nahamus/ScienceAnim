// Home page: hero, category filters, search and simulation cards with real rendered thumbnails.

import { Runner } from './core/engine.js';
import { CATEGORIES, CATEGORY, ICONS } from './categories.js';
import { drawGlow, rgba, TAU } from './core/util.js';
import { lessonHash, MAX_STEPS } from './lesson.js';
import { copyText } from './player.js';

const THUMB_VERSION = 'v2';
const thumbCache = new Map();
const storeKey = (id) => `sa-thumb-${THUMB_VERSION}-${id}`;
function cachedThumb(id) {
  if (thumbCache.has(id)) return thumbCache.get(id);
  try {
    const v = localStorage.getItem(storeKey(id));
    if (v) thumbCache.set(id, v);
    return v;
  } catch {
    return null;
  }
}
let thumbQueue = [];
let thumbBusy = false;
let activeGallery = null;

// Thumbnails rendered at build time (tools/render-thumbs.mjs) live in thumbs/, listed with content
// hashes in thumbs/index.json. Without that manifest (dev server, tests) they render in the browser.
export const EXPORTING = typeof location !== 'undefined' && new URLSearchParams(location.search).has('export-thumbs');
let prebuilt = null;
function loadPrebuilt() {
  if (EXPORTING) return Promise.resolve(null);
  prebuilt ??= fetch(`${import.meta.env.BASE_URL}thumbs/index.json`, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => j?.files || null)
    .catch(() => null);
  return prebuilt;
}

/** Render queued thumbnails one at a time, only while a gallery is on screen. */
async function pumpThumbs() {
  let g = activeGallery;
  const s = g && g.el.isConnected ? thumbQueue.shift() : null;
  if (!s) {
    thumbBusy = false;
    return;
  }
  let def = null;
  try {
    def = await s.load();
  } catch (err) {
    console.warn('could not load', s.id, err);
  }
  g = activeGallery;
  if (!g || !g.el.isConnected) {
    thumbQueue.unshift(s);
    thumbBusy = false;
    return;
  }
  const url = def && renderThumb(def);
  if (url) {
    thumbCache.set(s.id, url);
    try {
      localStorage.setItem(storeKey(s.id), url);
    } catch {
      /* storage full or blocked: keep the in-memory copy */
    }
    const img = g.el.querySelector(`.card[data-id="${s.id}"] .thumb-img`);
    if (img) {
      img.style.backgroundImage = `url(${url})`;
      img.classList.add('ready');
    }
  }
  setTimeout(pumpThumbs, 30);
}

// Age bands used for curriculum tags (a sim's `ages`), in order.
const AGE_BANDS = [
  { id: '11-14', from: 11, to: 14 },
  { id: '14-16', from: 14, to: 16 },
  { id: '16+', from: 16, to: Infinity },
];

/** "Ages 11–16", "Ages 14+" … from a sim's bands. */
export function agesLabel(ages) {
  const bands = AGE_BANDS.filter((b) => ages?.includes(b.id));
  if (!bands.length) return '';
  const from = bands[0].from, to = bands[bands.length - 1].to;
  return to === Infinity ? `Ages ${from}+` : `Ages ${from}–${to}`;
}

const session = {
  get: (k) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* storage blocked: filters just won't be remembered */
    }
  },
};

export class Gallery {
  constructor(root, sims) {
    this.sims = sims;
    this.filter = session.get('sa-filter') || 'all';
    this.age = session.get('sa-age') || 'all';
    if (this.age !== 'all' && !AGE_BANDS.some((b) => b.id === this.age)) this.age = 'all';
    this.query = '';
    const el = (this.el = document.createElement('div'));
    el.className = 'gallery';
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, sims.filter((s) => s.category === c.id).length]));
    el.innerHTML = `
      <section class="hero">
        <canvas class="hero-bg"></canvas>
        <div class="hero-inner">
          <div class="brand"><span class="logo"></span>ScienceAnim</div>
          <h1>See how the universe <em>works</em>.</h1>
          <p>Cinematic, interactive simulations of the ideas behind science — from quantum particles to black holes,
          evolution to neural networks. Each one tells a short guided story, then lets you take the controls.</p>
          <div class="hero-meta">
            <span><b>${sims.length}</b> simulations</span>
            <span><b>${CATEGORIES.filter((c) => counts[c.id]).length}</b> fields of STEM</span>
            <span><b>100%</b> real-time, in your browser</span>
          </div>
        </div>
      </section>
      <section class="browse">
        <div class="filters">
          <div class="pills">
            <button data-f="all">All <small>${sims.length}</small></button>
            ${CATEGORIES.filter((c) => counts[c.id])
              .map((c) => `<button data-f="${c.id}" style="--c:${c.color}"><i>${c.icon}</i>${c.name} <small>${counts[c.id]}</small></button>`)
              .join('')}
          </div>
          <div class="tools">
            <label class="age">
              <select aria-label="Age range">
                <option value="all">All ages</option>
                ${AGE_BANDS.map((b) => `<option value="${b.id}">Ages ${b.id.replace('-', '–')}</option>`).join('')}
              </select>
            </label>
            <label class="search">${ICONS.search}<input type="search" placeholder="Search simulations or topics…" aria-label="Search simulations"></label>
            <button class="btn lesson-toggle" aria-pressed="false" aria-label="Make a lesson" title="Pick simulations to teach in order, then share one link">${ICONS.book}<span>Make a lesson</span></button>
          </div>
        </div>
        <div class="grid"></div>
        <p class="empty" hidden>No simulations match those filters.</p>
      </section>
      <div class="lesson-tray" role="region" aria-label="Lesson builder" hidden>
        <div class="lt-head">
          <input class="lt-title" placeholder="Lesson title (optional)" maxlength="80" aria-label="Lesson title">
          <button class="icon-btn" data-lt="close" title="Close the lesson builder">${ICONS.close}</button>
        </div>
        <ol class="lt-items"></ol>
        <p class="lt-empty">Tap simulations to add them, in the order you’ll teach them (up to ${MAX_STEPS}).</p>
        <div class="lt-acts">
          <button class="btn" data-lt="clear">Clear</button>
          <button class="btn" data-lt="copy">${ICONS.link}<span>Copy lesson link</span></button>
          <a class="btn primary" data-lt="start">Start lesson ${ICONS.next}</a>
        </div>
      </div>
      <footer class="foot">
        <span>Built with plain JavaScript, Canvas and WebGL. Every frame is computed live.</span>
        <span>Tip: in a simulation, press <kbd>Space</kbd> to pause, <kbd>←</kbd>/<kbd>→</kbd> to change chapters, <kbd>H</kbd> to hide the interface.</span>
      </footer>`;
    root.appendChild(el);

    this.grid = el.querySelector('.grid');
    this.cards = sims.map((s) => this.card(s));
    this.cards.forEach((c) => this.grid.appendChild(c));

    el.querySelectorAll('.pills button').forEach((b) =>
      b.addEventListener('click', () => {
        this.filter = b.dataset.f;
        session.set('sa-filter', this.filter);
        this.apply();
      }),
    );
    const age = el.querySelector('.age select');
    age.value = this.age;
    age.addEventListener('change', () => {
      this.age = age.value;
      session.set('sa-age', this.age);
      this.apply();
    });
    el.querySelector('.search input').addEventListener('input', (e) => {
      this.query = e.target.value.trim().toLowerCase();
      this.apply();
    });
    this.apply();
    this.initLesson();
    this.hero = new HeroField(el.querySelector('.hero-bg'));
    this.queueThumbs();
  }

  card(s) {
    const cat = CATEGORY[s.category];
    const a = document.createElement('a');
    a.className = 'card';
    a.href = `#/sim/${s.id}`;
    a.style.setProperty('--c', cat.color);
    a.dataset.id = s.id;
    a.innerHTML = `
      <div class="thumb"><div class="thumb-img"></div><div class="thumb-live"></div><span class="play">${ICONS.play}</span><span class="pick" aria-hidden="true"></span></div>
      <div class="meta">
        <span class="cat"><i>${cat.icon}</i>${cat.name}${s.ages ? `<em>${agesLabel(s.ages)}</em>` : ''}</span>
        <h3>${s.title}</h3>
        <p>${s.tagline || ''}</p>
        ${s.topics?.length ? `<p class="topics">${s.topics.join(' · ')}</p>` : ''}
      </div>`;
    const cached = cachedThumb(s.id);
    if (cached) a.querySelector('.thumb-img').style.backgroundImage = `url(${cached})`;
    a.addEventListener('click', (e) => {
      if (!this.picking) return;
      e.preventDefault(); // building a lesson: a card adds or removes itself instead of opening
      this.togglePick(s.id);
    });
    let timer;
    const warm = () => s.load().catch(() => {});
    a.addEventListener('pointerdown', warm);
    a.addEventListener('focus', warm);
    a.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      warm();
      timer = setTimeout(() => this.preview(a, s), 280);
    });
    a.addEventListener('pointerleave', () => {
      clearTimeout(timer);
      this.stopPreview(a);
    });
    return a;
  }

  // ------------------------------------------------------------------ lesson builder
  initLesson() {
    let saved = null;
    try {
      saved = JSON.parse(session.get('sa-lesson'));
    } catch {
      /* none yet */
    }
    const known = new Set(this.sims.map((s) => s.id));
    this.plan = { title: String(saved?.title || ''), ids: (saved?.ids || []).filter((id) => known.has(id)) };
    const $ = (q) => this.el.querySelector(q);
    this.tray = $('.lesson-tray');
    $('.lesson-toggle').addEventListener('click', () => this.setPicking(!this.picking));
    $('[data-lt=close]').addEventListener('click', () => this.setPicking(false));
    $('[data-lt=clear]').addEventListener('click', () => {
      this.plan.ids = [];
      this.saveLesson();
    });
    const title = $('.lt-title');
    title.value = this.plan.title;
    title.addEventListener('input', () => {
      this.plan.title = title.value;
      this.saveLesson();
    });
    $('[data-lt=copy]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const url = location.origin + location.pathname.replace(/[^/]*$/, '') + lessonHash(this.plan);
      const ok = await copyText(url);
      btn.querySelector('span').textContent = ok ? 'Link copied' : 'Copy failed';
      setTimeout(() => (btn.querySelector('span').textContent = 'Copy lesson link'), 1800);
    });
    this.tray.querySelector('.lt-items').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const k = +b.closest('li').dataset.k;
      if (b.dataset.do === 'rm') this.plan.ids.splice(k, 1);
      else if (b.dataset.do === 'up' && k > 0) this.plan.ids.splice(k - 1, 2, this.plan.ids[k], this.plan.ids[k - 1]);
      this.saveLesson();
    });
    this.setPicking(session.get('sa-picking') === '1');
  }

  setPicking(on) {
    this.picking = on;
    session.set('sa-picking', on ? '1' : '0');
    this.el.classList.toggle('picking', on);
    this.tray.hidden = !on;
    const t = this.el.querySelector('.lesson-toggle');
    t.setAttribute('aria-pressed', String(on));
    t.classList.toggle('on', on);
    this.renderLesson();
  }

  togglePick(id) {
    const k = this.plan.ids.indexOf(id);
    if (k >= 0) this.plan.ids.splice(k, 1);
    else if (this.plan.ids.length < MAX_STEPS) this.plan.ids.push(id);
    this.saveLesson();
  }

  saveLesson() {
    session.set('sa-lesson', JSON.stringify(this.plan));
    this.renderLesson();
  }

  renderLesson() {
    const { ids } = this.plan;
    this.cards.forEach((c) => {
      const k = ids.indexOf(c.dataset.id);
      c.classList.toggle('picked', k >= 0);
      c.querySelector('.pick').textContent = k >= 0 ? k + 1 : '+';
    });
    const byId = (id) => this.sims.find((s) => s.id === id);
    this.tray.querySelector('.lt-items').innerHTML = ids
      .map(
        (id, k) => `<li data-k="${k}"><b>${k + 1}</b><span>${byId(id).title}</span>
          ${k ? `<button data-do="up" title="Move earlier" aria-label="Move ${byId(id).title} earlier">${ICONS.prev}</button>` : ''}
          <button data-do="rm" title="Remove" aria-label="Remove ${byId(id).title}">${ICONS.close}</button></li>`,
      )
      .join('');
    this.tray.querySelector('.lt-empty').hidden = ids.length > 0;
    this.tray.classList.toggle('has-items', ids.length > 0);
    const start = this.tray.querySelector('[data-lt=start]');
    if (ids.length) start.href = lessonHash(this.plan);
    else start.removeAttribute('href');
    this.tray.querySelector('[data-lt=copy]').disabled = !ids.length;
  }

  async preview(card, entry) {
    this.stopPreview(card);
    const token = (card._previewToken = {});
    let s;
    try {
      s = await entry.load();
    } catch {
      return;
    }
    if (card._previewToken !== token || !card.matches(':hover') || !this.el.isConnected) return;
    const host = card.querySelector('.thumb-live');
    try {
      const r = new Runner(host, s, { interactive: false, thumbnail: true, maxDpr: 1.5 });
      const ch = s.story?.[0];
      if (ch) {
        r.applyParams(ch.params, 0);
        ch.enter?.(r.sim, r);
      }
      r.start();
      card._runner = r;
      card.classList.add('live');
    } catch (err) {
      console.warn(err);
    }
  }

  stopPreview(card) {
    card._previewToken = null;
    card.classList.remove('live');
    if (card._runner) {
      const r = card._runner;
      card._runner = null;
      setTimeout(() => r.destroy(), 250);
    }
  }

  apply() {
    const forAge = (s) => this.age === 'all' || !!s.ages?.includes(this.age);
    // pill counts follow the age filter, so each pill says how many it will show
    this.el.querySelectorAll('.pills button').forEach((b) => {
      b.classList.toggle('on', b.dataset.f === this.filter);
      b.setAttribute('aria-pressed', String(b.dataset.f === this.filter));
      const n = this.sims.filter((s) => forAge(s) && (b.dataset.f === 'all' || s.category === b.dataset.f)).length;
      b.querySelector('small').textContent = n;
    });
    let shown = 0;
    this.cards.forEach((c, i) => {
      const s = this.sims[i];
      const hay = [s.title, s.tagline, s.blurb, CATEGORY[s.category].name, ...(s.keywords || []), ...(s.topics || [])].join(' ').toLowerCase();
      const ok = (this.filter === 'all' || s.category === this.filter) && forAge(s) && (!this.query || hay.includes(this.query));
      c.hidden = !ok;
      if (ok) c.style.setProperty('--i', shown++);
    });
    this.el.querySelector('.empty').hidden = shown > 0;
  }

  async queueThumbs() {
    activeGallery = this;
    if (EXPORTING) return;
    const files = await loadPrebuilt();
    if (activeGallery !== this) return;
    const startPump = () => {
      if (!thumbBusy && thumbQueue.length) {
        thumbBusy = true;
        setTimeout(pumpThumbs, 150);
      }
    };
    const prebuiltFor = (s) => files?.[s.id];
    const fetchThumb = (i) => {
      const s = this.sims[i];
      const el = this.cards[i].querySelector('.thumb-img');
      const img = new Image();
      img.onload = () => {
        el.style.backgroundImage = `url(${img.src})`;
        el.classList.add('ready');
      };
      img.onerror = () => {
        // missing from this deploy: render it here instead
        if (!cachedThumb(s.id)) thumbQueue.unshift(s);
        startPump();
      };
      img.src = `${import.meta.env.BASE_URL}thumbs/${prebuiltFor(s)}`;
    };
    // Fetch each image only as its card nears the screen: the first screenful arrives at once and the
    // rest of the library costs nothing until someone scrolls (or filters) to it.
    const lazy = typeof IntersectionObserver !== 'undefined';
    if (lazy) {
      this.thumbObserver = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            this.thumbObserver.unobserve(e.target);
            fetchThumb(this.cards.indexOf(e.target));
          }
        },
        { rootMargin: '800px 0px' },
      );
    }
    this.sims.forEach((s, i) => {
      if (!prebuiltFor(s)) return;
      if (lazy) this.thumbObserver.observe(this.cards[i]);
      else fetchThumb(i);
    });
    const visible = (s) => !this.cards[this.sims.indexOf(s)].hidden;
    // cards in the current filter first, so the visible grid fills in before the rest
    thumbQueue = this.sims.filter((s) => !prebuiltFor(s) && !cachedThumb(s.id)).sort((a, b) => visible(b) - visible(a));
    startPump();
  }

  destroy() {
    if (activeGallery === this) activeGallery = null;
    this.thumbObserver?.disconnect();
    this.hero.destroy();
    this.cards.forEach((c) => this.stopPreview(c));
    this.el.remove();
  }
}

/** Run a simulation off-screen for a moment and snapshot it. */
export function renderThumb(s, width = 560, height = 350) {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:${height}px;pointer-events:none`;
  document.body.appendChild(host);
  let r;
  try {
    r = new Runner(host, s, { width, height, interactive: false, thumbnail: true, maxDpr: 1, preserve: true });
    const ch = s.story?.[s.thumbChapter ?? 0];
    if (ch) {
      r.applyParams(ch.params, 0);
      ch.enter?.(r.sim, r);
    }
    // advance the physics without drawing, then render the final frame once
    const frames = s.thumbFrames ?? 150;
    for (let i = 0; i < frames - 1; i++) {
      r.time += 1 / 60;
      r.sim.update?.(1 / 60);
      r.frame++;
    }
    r.step(1 / 60);
    return r.canvas.toDataURL('image/jpeg', 0.84);
  } catch (err) {
    console.warn('thumbnail failed for', s.id, err);
    return null;
  } finally {
    r?.destroy();
    host.remove();
  }
}

/** Animated constellation behind the hero text. */
class HeroField {
  constructor(canvas) {
    this.c = canvas;
    this.g = canvas.getContext('2d');
    this.pts = [];
    const cols = CATEGORIES.map((c) => c.color);
    for (let i = 0; i < 90; i++)
      this.pts.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.02, vy: (Math.random() - 0.5) * 0.02, r: 1 + Math.random() * 2.2, c: cols[i % cols.length], ph: Math.random() * TAU });
    this.mouse = { x: -1, y: -1 };
    this.onMove = (e) => {
      const r = this.c.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) / r.width;
      this.mouse.y = (e.clientY - r.top) / r.height;
    };
    window.addEventListener('pointermove', this.onMove);
    let last = performance.now();
    // "reduce motion" in the device's settings: draw the starfield once and leave it still
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loop = (t) => {
      if (!still) this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      this.draw(dt, t / 1000);
    };
    this.raf = requestAnimationFrame(loop);
  }
  draw(dt, t) {
    const c = this.c, g = this.g;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = c.clientWidth, H = c.clientHeight;
    if (c.width !== Math.round(W * dpr)) (c.width = Math.round(W * dpr)), (c.height = Math.round(H * dpr));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const P = this.pts;
    for (const p of P) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0 || p.x > 1) p.vx *= -1;
      if (p.y < 0 || p.y > 1) p.vy *= -1;
      const dx = p.x - this.mouse.x, dy = (p.y - this.mouse.y) * (H / W);
      const d2 = dx * dx + dy * dy;
      if (d2 < 0.02) {
        p.x += (dx / Math.sqrt(d2 + 1e-6)) * 0.03 * dt;
        p.y += (dy / Math.sqrt(d2 + 1e-6)) * 0.03 * dt;
      }
    }
    g.lineWidth = 1;
    for (let i = 0; i < P.length; i++)
      for (let j = i + 1; j < P.length; j++) {
        const a = P[i], b = P[j];
        const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
        const d = Math.hypot(dx, dy);
        if (d < 150) {
          g.strokeStyle = rgba(a.c, (1 - d / 150) * 0.22);
          g.beginPath();
          g.moveTo(a.x * W, a.y * H);
          g.lineTo(b.x * W, b.y * H);
          g.stroke();
        }
      }
    g.globalCompositeOperation = 'lighter';
    for (const p of P) drawGlow(g, p.x * W, p.y * H, p.r * (7 + 2 * Math.sin(t * 1.5 + p.ph)), p.c);
    g.globalCompositeOperation = 'source-over';
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this.onMove);
  }
}
