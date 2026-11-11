// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '509aa6a87f20';
const PRECACHE = ["./","assets/accelerator-BVumBtT8.js","assets/backprop-Cqy_kqgg.js","assets/bec-CIc3CMh5.js","assets/bell-test-CZOL9ti4.js","assets/bernoulli-DqsnuOb4.js","assets/binary-CRYOWrXX.js","assets/black-hole-VDJfgpot.js","assets/blockchain-DHrartHk.js","assets/brownian-CfwBwkPt.js","assets/chain-reaction-B2ZTSN8-.js","assets/circuits-BF7AjRBB.js","assets/cnn-qBalaqw5.js","assets/coriolis-3Y-gOcXl.js","assets/cpu-DPL9dD16.js","assets/curved-spacetime-D09Z5f83.js","assets/diffusion-DK8AKQbd.js","assets/dna-DYkxI9Qs.js","assets/doppler-Ci2cU9Bl.js","assets/double-pendulum-CDBj70rr.js","assets/double-slit-CRRiVoOC.js","assets/ecosystem-B9zsDfcD.js","assets/electric-field-B7KHmP1g.js","assets/em-radiation-C-h8y5g0.js","assets/embeddings-DSwkbMRD.js","assets/epidemic-CQ4zVNlN.js","assets/equilibrium-CVglZ9aL.js","assets/exoplanets-I480RTGe.js","assets/flocking-CNdaHeEU.js","assets/fluid-DWXbYKiP.js","assets/fourier-CfOd26K7.js","assets/galton-DFiP50s7.js","assets/gl-sHHPorMo.js","assets/gradient-descent-Cx31WEBy.js","assets/gravitational-waves-DtoqE2DJ.js","assets/gravity-BqkwG3Cq.js","assets/greenhouse-bLrqUBCy.js","assets/grover-N9WliqN2.js","assets/hamming-whY7E4ok.js","assets/huffman-tRPn5aIn.js","assets/index-XaYVHsD4.css","assets/index-grRmyVxZ.js","assets/induction-C4TChfRI.js","assets/ising-CRsq3sgi.js","assets/kinetic-gas-CirhPNQ7.js","assets/kmeans-CmOa9DkL.js","assets/laser-Cjh4s3tP.js","assets/life-DTGW1jCv.js","assets/lift-Clw39B2S.js","assets/lightning-DQxEGvBW.js","assets/llm-sampling-DFGk5lx4.js","assets/logic-gates-DLcvFHma.js","assets/logistic-map-jhnweSSY.js","assets/lorenz-JTmhs6PM.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-CLza99-l.js","assets/moon-phases-DJml73oD.js","assets/natural-selection-CjnjovM6.js","assets/networking-BqjsgxG_.js","assets/neural-network-BQjjMFEl.js","assets/neuron-D--2pJ2H.js","assets/orbital-transfer-DxLW7aFG.js","assets/orbitals-CynldT43.js","assets/pathfinding-D-FXBXD0.js","assets/pendulum-wave-BXReaDj2.js","assets/phases-DwfIhXoM.js","assets/phyllotaxis-DKyKi98D.js","assets/power-grid-bohnZ9Ji.js","assets/projectile-Dw1FkkHa.js","assets/q-learning-j2JW8tj7.js","assets/quantum-BylZRcjz.js","assets/quantum-tunneling-BPaLc4EN.js","assets/qubit-BBn9lBHs.js","assets/radio-oNXTnjpF.js","assets/radioactive-decay-C_shFONp.js","assets/rainbows-DLFjyUdM.js","assets/refraction-CrBkRU9O.js","assets/relativity-CX_AD1Zh.js","assets/resonance-CjYasHLE.js","assets/ripple-tank-BAIEPnnR.js","assets/rsa-CpJYoByZ.js","assets/sandpile-CADwa5qz.js","assets/screens-DCrn5xGt.js","assets/seasons-C1FtbJ2q.js","assets/seismic-waves-BjdWYpdK.js","assets/semiconductors-NSfrQKs6.js","assets/sorting-DB7Na73q.js","assets/standing-waves-DJzaRIx6.js","assets/star-life-B16_0cDu.js","assets/teleportation-CLphNvfY.js","assets/tokamak-CmcDVeIE.js","assets/tokenizer-BYNc7r5w.js","assets/tornado-DJf5I8DY.js","assets/transformer-CWeG3QxA.js","assets/tsp-CpLE4rVo.js","assets/turbines-D8thwzqU.js","assets/turing-patterns-KrcP_L2z.js","assets/vision-DBQC_duq.js","assets/white-blood-cells-Bh0OT7u_.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
