import { SIMS } from './sims/index.js';
import { Gallery } from './gallery.js';
import { Player } from './player.js';

const root = document.getElementById('app');
let view = null;
let galleryScroll = 0;

function route() {
  const m = location.hash.match(/^#\/sim\/([\w-]+)/);
  const def = m && SIMS.find((s) => s.id === m[1]);
  if (view instanceof Gallery) galleryScroll = window.scrollY;
  view?.destroy();
  view = null;
  if (def) {
    const i = SIMS.indexOf(def);
    document.title = `${def.title} · ScienceAnim`;
    document.body.classList.add('in-player');
    view = new Player(root, def, {
      onBack: () => (location.hash = '#/'),
      prev: SIMS[i - 1],
      next: SIMS[i + 1],
    });
  } else {
    document.title = 'ScienceAnim · Interactive science, beautifully animated';
    document.body.classList.remove('in-player');
    view = new Gallery(root, SIMS);
    requestAnimationFrame(() => window.scrollTo(0, galleryScroll));
  }
}

window.addEventListener('hashchange', route);
route();
