// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = 'dfc80028d6b5';
const PRECACHE = ["./","assets/accelerator-CD_iDbXc.js","assets/acids-bases-DwjS0W62.js","assets/adversarial-Nk1QfID-.js","assets/backprop-Bbb0IknM.js","assets/battery-j1bZk7jB.js","assets/bayes-pWUEGHHj.js","assets/bec-Bur4iHTP.js","assets/bell-test-DeQs1oi6.js","assets/bernoulli-7i4jlxIF.js","assets/binary-C8dhR9-o.js","assets/black-hole-VDJfgpot.js","assets/blockchain-C2tw_yb5.js","assets/brownian-DrqcNAcU.js","assets/bz-reaction-B3ziAW_T.js","assets/chain-reaction-zx4zLEGk.js","assets/circuits-Cy1YZg0d.js","assets/cnn-C_Gz_jmv.js","assets/cooperation-BbvLFfQ8.js","assets/coriolis-DF2RcSfM.js","assets/cpu-XGNIRKJ6.js","assets/curved-spacetime-DlhQfknZ.js","assets/dark-matter-LHaQsYHD.js","assets/diffusion-C6FbQi1Q.js","assets/dna-Bv93B0D6.js","assets/doppler-DjkTHQUV.js","assets/double-pendulum-D9YyYO95.js","assets/double-slit-BRbLBk_6.js","assets/ecosystem-Cdj2Fupl.js","assets/electric-field-DU1YCn7M.js","assets/em-radiation-DB9XemPR.js","assets/embeddings-CcX3fYSf.js","assets/enzymes-CRjX3cjd.js","assets/epidemic-DlSZuC4J.js","assets/equilibrium-C-pwX4tn.js","assets/error-correction-BeBDozST.js","assets/exoplanets-DtJha2wG.js","assets/expanding-universe-BHhuUaOX.js","assets/fireflies-BP6y7-Ym.js","assets/flocking-DVVQGM9w.js","assets/fluid-C47Yutvb.js","assets/forest-fire-_mP64K7A.js","assets/fourier-BXH3z9bI.js","assets/galaxy-collisions-KGjfMGmt.js","assets/galton-DZBhJqKl.js","assets/gl-sHHPorMo.js","assets/gradient-descent-_1E014PE.js","assets/gravitational-waves-DH-Bh7tb.js","assets/gravity-BmUfrmDg.js","assets/greenhouse-BhIXK8G6.js","assets/grover-Bl5U_RMZ.js","assets/hamming-BqIifADP.js","assets/huffman-Cmf0Vd-U.js","assets/index-CVGNxd59.js","assets/index-XaYVHsD4.css","assets/induction-9d9Pt0Aw.js","assets/ising-IaQldczi.js","assets/kinetic-gas-dyqinUEN.js","assets/kmeans-DLwblYj8.js","assets/laser-DdomcdbL.js","assets/life-BXgloXJ-.js","assets/lift-D6mgWjru.js","assets/lightning-CloDTxMo.js","assets/llm-sampling-CACO9vVq.js","assets/logic-gates-CqSAPUhb.js","assets/logistic-map-DuzYcKMm.js","assets/lorenz-6LfyJsVe.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-Dj3Yr1TR.js","assets/monte-carlo-Cqy7jZW-.js","assets/moon-phases-ChICV7Zr.js","assets/natural-selection-Y_dENBFl.js","assets/networking-DODsHiQ1.js","assets/neural-network-CLWoOKHx.js","assets/neuron-DzlJeLOj.js","assets/orbital-transfer-CbigPXlw.js","assets/orbitals-DCvzi1r1.js","assets/pathfinding-BdQ3oLT3.js","assets/pendulum-wave-D9IVPRN-.js","assets/phases-BnSaANvy.js","assets/phyllotaxis-DZNXnJp8.js","assets/power-grid-thuzIDrh.js","assets/projectile-DjZudkIU.js","assets/protein-folding-BeWXt3XO.js","assets/q-learning-nJZbJFGZ.js","assets/quantum-BnVY5Az8.js","assets/quantum-tunneling-kppy1WSI.js","assets/qubit-BYsx8Ixl.js","assets/radio-CH_WGx0o.js","assets/radioactive-decay-DkQ8ASBz.js","assets/rainbows-3kiDoRHi.js","assets/refraction-B8VMQebR.js","assets/relativity-FXI1hh-R.js","assets/resonance-9bZUSNQy.js","assets/ripple-tank-w7Wd7VE_.js","assets/rsa-CRPzg6xz.js","assets/sandpile-Da4S5KP-.js","assets/screens-D_VwqLxK.js","assets/seasons-DVvruoA-.js","assets/seismic-waves-DsXi6lES.js","assets/self-assembly-DDQjjUVQ.js","assets/semiconductors-BsW_32Tm.js","assets/small-world-BgjIzu85.js","assets/snowflakes-H0Q0gvkr.js","assets/sorting-DayD--RT.js","assets/spectra-BknDHwLj.js","assets/standing-waves-tbOiT4-b.js","assets/star-life-CbSKC1SE.js","assets/teleportation-BbHBOfm8.js","assets/tides--ibxfImn.js","assets/tokamak-FIr44GNY.js","assets/tokenizer-CgwM8rmu.js","assets/tornado-BIcg5j9F.js","assets/traffic-DKwzU85Z.js","assets/transformer-DzerYQZ-.js","assets/tsp-3S5DxJE7.js","assets/turbines-DSlHM5Cd.js","assets/turing-patterns-DxkReLEc.js","assets/vision-B2JBf7b9.js","assets/white-blood-cells-BWfC3V00.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
const APP = `sa-app-${VERSION}`;
const RUNTIME = 'sa-runtime';
// Servers often answer with `Vary: Origin` or `Vary: Accept-Encoding`; a script's request carries
// headers the precache request didn't, so lookups must ignore Vary or they'd never hit.
const MATCH = { ignoreVary: true };
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(APP)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sa-app-') && k !== APP).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const scope = () => self.registration.scope; // https://…/ScienceAnim/

async function page(req) {
  try {
    const res = await fetch(req);
    if (res.ok && new URL(req.url).pathname === new URL(scope()).pathname) (await caches.open(APP)).put('./', res.clone());
    return res;
  } catch (err) {
    // Any page of the site (the gallery, or a simulation's link page) boots from the same app.
    const cached = (await caches.match(req, { ...MATCH, ignoreSearch: true })) || (await caches.match(new URL('./', scope()).href, MATCH));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(req) {
  const hit = await caches.match(req, MATCH);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(APP)).put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, wait) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(req, MATCH);
  const fresh = fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
    return res;
  });
  if (hit) {
    wait(fresh.catch(() => {}));
    return hit;
  }
  return fresh;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    if (url.href.startsWith(scope())) e.respondWith(page(req));
    return;
  }
  if (FONTS.test(url.href)) return e.respondWith(staleWhileRevalidate(req, (p) => e.waitUntil(p)));
  if (!url.href.startsWith(scope())) return;
  const path = url.pathname.slice(new URL(scope()).pathname.length);
  if (path.startsWith('assets/')) return e.respondWith(cacheFirst(req));
  if (/^(thumbs|icons)\/|^manifest\.webmanifest$/.test(path))
    return e.respondWith(staleWhileRevalidate(req, (p) => e.waitUntil(p)));
});
