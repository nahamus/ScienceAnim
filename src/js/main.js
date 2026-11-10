import { SIMS } from './sims/index.js';
import { Gallery, EXPORTING, renderThumb, agesLabel } from './gallery.js';
import { Player } from './player.js';
import { parseShare, isEmbed } from './share.js';
import { Worksheet } from './worksheet.js';
import { parseLesson, lessonHash } from './lesson.js';

// A simulation's link page (…/sim/<id>/?ch=3, built by tools/site-pages.js) is the same app with its own
// preview tags. Swap the address for the usual in-app one before anything loads relative to it.
const linkPage = location.pathname.match(/^(.*\/)sim\/([\w-]+)\/?$/);
if (linkPage && !location.hash.startsWith('#/')) {
  const q = location.search.slice(1);
  history.replaceState(null, '', `${linkPage[1]}#/sim/${linkPage[2]}${q ? '?' + q : ''}`);
}

const root = document.getElementById('app');
let view = null;
let galleryScroll = 0;

let routeId = 0;

/** A simulation's link page address, used for links that leave the app (worksheets, lessons). */
const simPage = (id) => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}sim/${id}/`;

async function route() {
  const id = ++routeId;
  const hash = location.hash;
  const m = hash.match(/^#\/(sim|sheet)\/([\w-]+)(?:\?(.*))?/);
  const lm = hash.match(/^#\/lesson\/(\d+)(?:\?(.*))?/);
  let lesson = null;
  let entry = m && SIMS.find((s) => s.id === m[2]);
  if (lm) {
    const plan = parseLesson(lm[2], new Set(SIMS.map((s) => s.id)));
    if (plan.ids.length) {
      const step = Math.min(plan.ids.length, Math.max(1, +lm[1])) - 1;
      const items = plan.ids.map((sid, k) => {
        const e = SIMS.find((s) => s.id === sid);
        return { id: sid, title: e.title, href: lessonHash(plan, k), load: () => e.load() };
      });
      lesson = { title: plan.title, step, items };
      entry = SIMS.find((s) => s.id === plan.ids[step]);
    }
  }
  if (view instanceof Gallery) galleryScroll = window.scrollY;
  view?.destroy();
  view = null;
  if (entry) {
    const i = SIMS.indexOf(entry);
    const sheet = m?.[1] === 'sheet';
    document.title = `${sheet ? 'Worksheet: ' : ''}${entry.title} · ScienceAnim`;
    document.body.classList.toggle('in-player', !sheet);
    let def = entry.def;
    if (!def) {
      root.classList.add('loading');
      try {
        def = await entry.load();
      } catch (err) {
        console.error(err);
        if (id === routeId) showLoadError(entry);
        return;
      } finally {
        if (id === routeId) root.classList.remove('loading');
      }
      if (id !== routeId) return; // the user navigated away while it loaded
    }
    if (sheet) {
      view = new Worksheet(root, def, {
        onBack: () => (location.hash = `#/sim/${entry.id}`),
        url: simPage(entry.id),
        ages: agesLabel(entry.ages),
      });
      return;
    }
    const steps = lesson?.items;
    view = new Player(root, def, {
      onBack: () => (location.hash = '#/'),
      prev: steps ? steps[lesson.step - 1] : SIMS[i - 1],
      next: steps ? steps[lesson.step + 1] : SIMS[i + 1],
      lesson,
      start: m ? parseShare(def, m[3]) : null,
      embed: m ? isEmbed(m[3]) : false,
    });
    (steps ? steps[lesson.step + 1] : SIMS[i + 1])?.load().catch(() => {}); // warm up the likely next stop
  } else {
    document.title = 'ScienceAnim · Interactive science, beautifully animated';
    document.body.classList.remove('in-player');
    view = new Gallery(root, SIMS);
    requestAnimationFrame(() => window.scrollTo(0, galleryScroll));
  }
}

/** Shown when a simulation's code can't be downloaded (offline, or a stale deploy). */
function showLoadError(entry) {
  const el = document.createElement('div');
  el.className = 'load-error';
  el.innerHTML = `<p>Couldn't load <b></b>. Check your connection and try again.</p>
    <p><button class="btn primary">Retry</button> <a class="btn" href="#/">Back to gallery</a></p>`;
  el.querySelector('b').textContent = entry.title;
  el.querySelector('button').addEventListener('click', () => location.reload());
  root.appendChild(el);
  view = { destroy: () => el.remove() };
}

window.addEventListener('hashchange', route);
route();

// Work offline after the first visit. Automated browsers (tests, thumbnail rendering) skip it unless
// the page asks with ?sw, so cached code never hides a fresh build from them.
if (import.meta.env.PROD && 'serviceWorker' in navigator && (!navigator.webdriver || /[?&]sw\b/.test(location.search))) {
  addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {}));
}

// Build-time thumbnail export (tools/render-thumbs.mjs opens the built site with ?export-thumbs)
if (EXPORTING) {
  window.__saExport = {
    ids: SIMS.map((s) => s.id),
    render: async (id) => renderThumb(await SIMS.find((s) => s.id === id).load()),
  };
}
