import { SIMS } from './sims/index.js';
import { Gallery } from './gallery.js';
import { Player } from './player.js';
import { parseShare, isEmbed } from './share.js';

const root = document.getElementById('app');
let view = null;
let galleryScroll = 0;

let routeId = 0;

async function route() {
  const id = ++routeId;
  const m = location.hash.match(/^#\/sim\/([\w-]+)(?:\?(.*))?/);
  const entry = m && SIMS.find((s) => s.id === m[1]);
  if (view instanceof Gallery) galleryScroll = window.scrollY;
  view?.destroy();
  view = null;
  if (entry) {
    const i = SIMS.indexOf(entry);
    document.title = `${entry.title} · ScienceAnim`;
    document.body.classList.add('in-player');
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
    view = new Player(root, def, {
      onBack: () => (location.hash = '#/'),
      prev: SIMS[i - 1],
      next: SIMS[i + 1],
      start: parseShare(def, m[2]),
      embed: isEmbed(m[2]),
    });
    SIMS[i + 1]?.load().catch(() => {}); // warm up the likely next stop
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
