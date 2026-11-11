// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = 'fdfb3d0db27c';
const PRECACHE = ["./","assets/accelerator-CnN6LvLH.js","assets/acids-bases-wK3srVM8.js","assets/adversarial-DH_UVB9y.js","assets/antibiotic-resistance-BwDEz-ZY.js","assets/aurora-BrcGUrDd.js","assets/backprop-DQDexdxE.js","assets/battery-B50HuVA3.js","assets/bayes-CmUqjNet.js","assets/bec-R-ESPq6T.js","assets/bell-test-CwmExKNq.js","assets/bernoulli-DtJds0BU.js","assets/binary-CyHaUCDJ.js","assets/black-hole-VDJfgpot.js","assets/blockchain-CS7qZYYf.js","assets/brownian-DB67EwDG.js","assets/bz-reaction-DeYzZZw5.js","assets/chain-reaction-BZpPK-4B.js","assets/circuits-Bh_zR73n.js","assets/cnn-jCHdg8we.js","assets/cooperation-DG51QTMY.js","assets/coriolis-BWVmGIGc.js","assets/cpu-DGMGKeA4.js","assets/crispr-GbZv4v1C.js","assets/curved-spacetime-BueBlE8v.js","assets/dark-matter-B_0Y9n1D.js","assets/diffusion-DGYbDnkn.js","assets/dinosaur-asteroid-C7MA26zi.js","assets/dna-CaSt6CNt.js","assets/doppler-CtytBqOo.js","assets/double-pendulum-BjueH9Ua.js","assets/double-slit-CMuW9NAN.js","assets/ecosystem-CTy7nK_O.js","assets/electric-field-CHPxZC0w.js","assets/em-radiation-6QUuIUSJ.js","assets/embeddings-B2OUoVi5.js","assets/enzymes-1CFr1DGK.js","assets/epidemic-BAPRBw1M.js","assets/equilibrium-GSk6tOVb.js","assets/error-correction-DiZka_f4.js","assets/exoplanets-DyEt22WS.js","assets/expanding-universe-Dl8yhMgt.js","assets/fireflies-6gtZzgU2.js","assets/flocking-BSeZa4XH.js","assets/fluid-BFblwqg2.js","assets/forest-fire-2MHfacxX.js","assets/fourier-CTfiDeIr.js","assets/galaxy-collisions-37Njatlb.js","assets/galton-Bj4k4657.js","assets/gl-sHHPorMo.js","assets/gradient-descent-B-0Z6oxe.js","assets/gravitational-waves-DN-QEnuF.js","assets/gravity-D10tnQia.js","assets/greenhouse-0suafkqy.js","assets/grover-DOreefa1.js","assets/hamming-TUFmFVJG.js","assets/huffman-DUtaCz7U.js","assets/index-Dc-lyZ1V.js","assets/index-XaYVHsD4.css","assets/induction-DSgotxHm.js","assets/ising-BZLxsa-m.js","assets/kinetic-gas-CCpo-MLq.js","assets/kmeans-DlpDK_KY.js","assets/laser-D8XkM0gR.js","assets/life-CUmb0Lob.js","assets/lift-39gByR-Y.js","assets/lightning-UDNwb1DW.js","assets/llm-sampling-DZFrBG7M.js","assets/logic-gates-xY9cgHFS.js","assets/logistic-map-B9gZGpOk.js","assets/lorenz-Bp3kUzve.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-DkdZPpM0.js","assets/monte-carlo-BBcd0RWn.js","assets/moon-phases-DMw-aR_1.js","assets/natural-selection-DLb1vi8Q.js","assets/networking-D6l8XEjO.js","assets/neural-network-CqX4YFOa.js","assets/neuron-DqYp8AXc.js","assets/orbital-transfer-C_LsLDFF.js","assets/orbitals-tt0X_JAd.js","assets/pathfinding-DSjhqlNh.js","assets/pendulum-wave-DbIvnt8y.js","assets/phases-Da6mEoqV.js","assets/phyllotaxis-COALulvB.js","assets/power-grid-BUA2kcLl.js","assets/projectile-DYnNcGr3.js","assets/protein-folding-BC-yjTlE.js","assets/q-learning-VhT3yBgE.js","assets/quantum-BRaSXSeF.js","assets/quantum-tunneling-BbUU-Txo.js","assets/qubit-Dh6wHXLn.js","assets/radio-lxJ-cqlB.js","assets/radioactive-decay-BuqX8ymn.js","assets/rainbows-BkZJWhrX.js","assets/red-blood-cells-C5Jaq7-9.js","assets/refraction-BqddgMuA.js","assets/relativity-BzqHucV0.js","assets/resonance-pLNK7SMu.js","assets/ripple-tank-DW0LwWLg.js","assets/rsa-BqLGMr8x.js","assets/sandpile-CmA7Cmw4.js","assets/schrodingers-cat-B_PhUb-G.js","assets/screens-Doi7easN.js","assets/seasons-BiJw2jF_.js","assets/seismic-waves-BkC1Zxub.js","assets/self-assembly-BQ0d0PfK.js","assets/semiconductors-z3qreFzU.js","assets/sky-colour-BZQX74TV.js","assets/small-world-BPwZxCLn.js","assets/snowflakes-CRm41ekd.js","assets/sorting-rr8zfvBY.js","assets/spectra-CCjT0QkV.js","assets/standing-waves-CF15U4av.js","assets/star-life-CNVRKhUb.js","assets/teleportation-CVIy9GTs.js","assets/tides-CFvxsu-E.js","assets/tokamak-Y3i0JS1w.js","assets/tokenizer-C6doYvwi.js","assets/tornado-Dd9nRRYs.js","assets/traffic-BwJtxwbD.js","assets/transformer-C40T0lR4.js","assets/tsp-Cu_8LGe5.js","assets/turbines-Df-kbNho.js","assets/turing-patterns-ByudaEgJ.js","assets/vision-MihbeJFL.js","assets/white-blood-cells-CIlTzkhE.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
