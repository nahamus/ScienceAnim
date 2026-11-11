// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '12d15ba0eba4';
const PRECACHE = ["./","assets/accelerator-uStleivk.js","assets/acids-bases-DWlEC31Y.js","assets/adversarial-LUdrF6wz.js","assets/backprop-BY-MHFHU.js","assets/battery-BxSktF7K.js","assets/bec-BulX1fqV.js","assets/bell-test-BEnLup0x.js","assets/bernoulli-DcpzkGGv.js","assets/binary-BzG5Pn9c.js","assets/black-hole-VDJfgpot.js","assets/blockchain-Bw_RCP9s.js","assets/brownian-DwfD3Hzx.js","assets/bz-reaction-biFQRBvj.js","assets/chain-reaction-B88CD1Wy.js","assets/circuits-wFR_hVQj.js","assets/cnn-Ds-29uoj.js","assets/coriolis-CUBqFm8q.js","assets/cpu-CEVKvXzO.js","assets/curved-spacetime-I6xYxzL5.js","assets/diffusion-BSuZsdR2.js","assets/dna-DNCbeIBx.js","assets/doppler-Bjy8KpdM.js","assets/double-pendulum-D0VwYo2T.js","assets/double-slit-BLl-t9zi.js","assets/ecosystem-Dt3vujkD.js","assets/electric-field-7Dq2NuDF.js","assets/em-radiation-DoaRe-3V.js","assets/embeddings-DCp1uRgI.js","assets/enzymes-CvnsosoU.js","assets/epidemic-Cdw78EXM.js","assets/equilibrium-DowwA0rt.js","assets/error-correction-CAYMq23M.js","assets/exoplanets-COqwFT0O.js","assets/fireflies-C3ioXKdP.js","assets/flocking-CVjXyR6t.js","assets/fluid-B7Jd9UNe.js","assets/forest-fire-PEL4IE5C.js","assets/fourier-B4X_WCZ5.js","assets/galton-D5rz7Ikj.js","assets/gl-sHHPorMo.js","assets/gradient-descent-DTIrsLXu.js","assets/gravitational-waves-C4MDPW48.js","assets/gravity-BTjQAt-3.js","assets/greenhouse-BOJOBACf.js","assets/grover-Icx1jT_W.js","assets/hamming-ZZLLbRNM.js","assets/huffman-C3u3DKBg.js","assets/index-C6uxekH6.js","assets/index-XaYVHsD4.css","assets/induction-BcbvVHML.js","assets/ising-JmgbIByD.js","assets/kinetic-gas-CmzDwMmh.js","assets/kmeans-DmgmDu5v.js","assets/laser-Bw6w9XAn.js","assets/life-DKkJt846.js","assets/lift-DErRHVqK.js","assets/lightning-wuFRlAF9.js","assets/llm-sampling-B1emdGp1.js","assets/logic-gates-xZ_FU88c.js","assets/logistic-map-7FnoLzhp.js","assets/lorenz-C-wHqUyT.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-qY4L7Kfo.js","assets/moon-phases-CWJpqhNZ.js","assets/natural-selection-BOmvUg9x.js","assets/networking-Bnqe46HH.js","assets/neural-network-CdKelntV.js","assets/neuron-CBM9wLau.js","assets/orbital-transfer-Bh0yTNw4.js","assets/orbitals-DenA9P27.js","assets/pathfinding-DKvSj7Wq.js","assets/pendulum-wave-CQJ9ZYnr.js","assets/phases-CWSBMIGH.js","assets/phyllotaxis-BwE9vh5k.js","assets/power-grid-Cq1P_yQV.js","assets/projectile-shnmoAoo.js","assets/protein-folding-Dpbi4NxW.js","assets/q-learning-AZ-fxK7k.js","assets/quantum-B61aRm04.js","assets/quantum-tunneling-Cp0TOI-M.js","assets/qubit-BVVI4C75.js","assets/radio-B_jqHNAM.js","assets/radioactive-decay-BshQFL5B.js","assets/rainbows-DaTg9RQh.js","assets/refraction-hNqAA4Ro.js","assets/relativity-DMbIOkhC.js","assets/resonance-ad2S0-XE.js","assets/ripple-tank-BlKTDEHE.js","assets/rsa-Bq89W4jv.js","assets/sandpile-B0Otv3PZ.js","assets/screens-BDD69fM-.js","assets/seasons-Bxqn8qmq.js","assets/seismic-waves-1de6z519.js","assets/self-assembly-CJesSxCw.js","assets/semiconductors-DQ7V96rP.js","assets/snowflakes-DO2h7GvK.js","assets/sorting-msMMlPLA.js","assets/spectra-Bh6sFdmO.js","assets/standing-waves-B1eL0QvO.js","assets/star-life-DRavnzBH.js","assets/teleportation-ofnn3grA.js","assets/tokamak-B4ej1BTg.js","assets/tokenizer-Bt5q_c1k.js","assets/tornado-Bc-Yck2U.js","assets/traffic-BX98oVDz.js","assets/transformer-M2BNUH_i.js","assets/tsp-D3OLufGr.js","assets/turbines-_F-OIed_.js","assets/turing-patterns-mmHiZ7Kg.js","assets/vision-OMaEbjdl.js","assets/white-blood-cells-2gDpBDOZ.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
