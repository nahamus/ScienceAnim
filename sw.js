// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '9e0daff55ac2';
const PRECACHE = ["./","assets/accelerator-xs_vcxj8.js","assets/acids-bases-DFypSktU.js","assets/adversarial-j3Ati1n8.js","assets/backprop-uOGhrGCv.js","assets/battery-igd65lgI.js","assets/bayes-BK41xReZ.js","assets/bec-CDT-fQBM.js","assets/bell-test-DjgufDt3.js","assets/bernoulli-LR5DImCE.js","assets/binary-9dS4v_f2.js","assets/black-hole-VDJfgpot.js","assets/blockchain-1-Zr7j8W.js","assets/brownian-CK6Anerr.js","assets/bz-reaction-EYg0_kMk.js","assets/chain-reaction-BXmJQCwA.js","assets/circuits-DZXOg34Y.js","assets/cnn-D5UwXSNi.js","assets/cooperation-BW51X61J.js","assets/coriolis-qPcs-QxV.js","assets/cpu-C70QuQg3.js","assets/curved-spacetime-CJuRrt82.js","assets/dark-matter-om8yLy2I.js","assets/diffusion-BuGr8v14.js","assets/dna-CO--4Fim.js","assets/doppler-BStjXjgh.js","assets/double-pendulum-akoxClA6.js","assets/double-slit-BJhzQiM3.js","assets/ecosystem-DgOZPOGD.js","assets/electric-field-D23iRZ4l.js","assets/em-radiation-BPXL21O-.js","assets/embeddings-Df_c_szC.js","assets/enzymes-Hjk6OG0l.js","assets/epidemic-BOH1jC6m.js","assets/equilibrium-LEV4W4YF.js","assets/error-correction-BjRp1jr8.js","assets/exoplanets-BHZP620B.js","assets/expanding-universe-BCUU4ZPT.js","assets/fireflies-YjPCOeL7.js","assets/flocking-B9R0E2_w.js","assets/fluid-yr1O5-3J.js","assets/forest-fire-DZxb3xIF.js","assets/fourier-DoafJS4z.js","assets/galaxy-collisions-CjxUWMld.js","assets/galton-uYZYe2nL.js","assets/gl-sHHPorMo.js","assets/gradient-descent-l0M0ejjH.js","assets/gravitational-waves-DVkeTLUw.js","assets/gravity-CdX9aoWf.js","assets/greenhouse-ChQCHnqI.js","assets/grover-BzSkf93V.js","assets/hamming-CGtlMufS.js","assets/huffman-Q747TWlD.js","assets/index-2ttyW3rA.js","assets/index-XaYVHsD4.css","assets/induction-BflXa1dQ.js","assets/ising-DfC7tSfm.js","assets/kinetic-gas-BHZHXEan.js","assets/kmeans-B4y6DNve.js","assets/laser-Ca_phHOC.js","assets/life-BRfPKrTM.js","assets/lift-x7AO0NdZ.js","assets/lightning-DWfOx7ch.js","assets/llm-sampling-BCs13d6I.js","assets/logic-gates-5RQbsFGo.js","assets/logistic-map-D3hVXQcb.js","assets/lorenz-3OdWKMO5.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-DAqzqwEQ.js","assets/monte-carlo-B3WK93pQ.js","assets/moon-phases-BoQYjyzr.js","assets/natural-selection-B-zSovra.js","assets/networking-aOzRllRg.js","assets/neural-network-bilssket.js","assets/neuron-CBtPkd-W.js","assets/orbital-transfer-3GzSUtva.js","assets/orbitals-BsGALPCy.js","assets/pathfinding-lp6mUZIY.js","assets/pendulum-wave-DVyVyOAl.js","assets/phases-Cux5DesZ.js","assets/phyllotaxis-CBcDLNOO.js","assets/power-grid-CDkKChgF.js","assets/projectile-VvTObtGY.js","assets/protein-folding-jUlawF2Q.js","assets/q-learning-B2RbxbUh.js","assets/quantum-BL5zM6yz.js","assets/quantum-tunneling-F_t6yfEA.js","assets/qubit-So_Ruinr.js","assets/radio-BdZPMlU8.js","assets/radioactive-decay-2P95vCmb.js","assets/rainbows-DvfQQlBD.js","assets/refraction-Dm4vGLSr.js","assets/relativity-CykfKm_m.js","assets/resonance-B0TcQ3ig.js","assets/ripple-tank-D5GVfTcx.js","assets/rsa-BOzgHAzS.js","assets/sandpile-CD7MO1DG.js","assets/screens-CW5hFa-h.js","assets/seasons-Db8ZonSh.js","assets/seismic-waves-DPKhgsvG.js","assets/self-assembly-D4PK-0FF.js","assets/semiconductors-D6l7aX6F.js","assets/small-world-DlEHJxT7.js","assets/snowflakes-CxL4IV1Q.js","assets/sorting-C6qrtjBJ.js","assets/spectra-Bd8PTqRP.js","assets/standing-waves-BOLn4KeE.js","assets/star-life-B3yjeWUx.js","assets/teleportation-BzRS8yek.js","assets/tides-BUNas7rL.js","assets/tokamak-C5qJquHt.js","assets/tokenizer-ChKS50SX.js","assets/tornado-fs4_y0la.js","assets/traffic-RSLOUlmv.js","assets/transformer-Blgt82zB.js","assets/tsp-DLOG-apr.js","assets/turbines-BoEYHS1J.js","assets/turing-patterns-BzKlREEm.js","assets/vision-C0wUO6fz.js","assets/white-blood-cells-CkrOh6Q5.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
