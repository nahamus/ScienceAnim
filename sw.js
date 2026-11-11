// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = 'b93f7e142880';
const PRECACHE = ["./","assets/accelerator-CJqmu--O.js","assets/acids-bases-fF2pE-Xs.js","assets/backprop-BeDuvJtj.js","assets/battery-1T1ek-tZ.js","assets/bec-7aokMgNR.js","assets/bell-test-BZ69alVs.js","assets/bernoulli-9o8wlztx.js","assets/binary-DntdvJJh.js","assets/black-hole-VDJfgpot.js","assets/blockchain-CdNay2yW.js","assets/brownian-Hs7hets1.js","assets/bz-reaction-ChLKFiVa.js","assets/chain-reaction-pe_Q3PZ9.js","assets/circuits-CzJhe--x.js","assets/cnn-DymC2Gsd.js","assets/coriolis-DZz_RetA.js","assets/cpu-Bcr4fdSX.js","assets/curved-spacetime-AFqhnuwz.js","assets/diffusion-ZzZ5kYZ6.js","assets/dna-D6BG34bH.js","assets/doppler-BuLHJzdL.js","assets/double-pendulum-D9QAxuX2.js","assets/double-slit-C8dOQI5G.js","assets/ecosystem-DR33zmd4.js","assets/electric-field-BzT_pDaX.js","assets/em-radiation-D0H2Dkhy.js","assets/embeddings-CNjTvyMl.js","assets/enzymes-D_oxKgaG.js","assets/epidemic-HPArDgx-.js","assets/equilibrium-DKAyof1r.js","assets/exoplanets-DQifyIY_.js","assets/flocking-BLLyytpW.js","assets/fluid-BWEWwFcK.js","assets/fourier-CD3ndus2.js","assets/galton-BTdT0aIs.js","assets/gl-sHHPorMo.js","assets/gradient-descent-DDBJeHNB.js","assets/gravitational-waves-CAvjpBpG.js","assets/gravity-D2z2-FX7.js","assets/greenhouse-DSfuUQ-M.js","assets/grover-CH7UQJnB.js","assets/hamming-CvzQHhsC.js","assets/huffman-knTQzXcb.js","assets/index-B2Br1YOL.js","assets/index-XaYVHsD4.css","assets/induction-B_8jGNpY.js","assets/ising-DUofYPG9.js","assets/kinetic-gas-CFmS6QtG.js","assets/kmeans-Ynfbu60N.js","assets/laser-hnQQ4cIe.js","assets/life-BiFfCedi.js","assets/lift-D5ssdf9A.js","assets/lightning-CIJO_sP8.js","assets/llm-sampling-Ds3P1KzX.js","assets/logic-gates-8iNRQGVT.js","assets/logistic-map-pyhrjh6q.js","assets/lorenz-GB-cmNEi.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-BmJDfZSe.js","assets/moon-phases-CYtf_ig7.js","assets/natural-selection-DSaovHVk.js","assets/networking-ekLik8hG.js","assets/neural-network-D-Qy_Y33.js","assets/neuron-Bh7RC9Je.js","assets/orbital-transfer-1hgZHO6i.js","assets/orbitals-i57S30DZ.js","assets/pathfinding-5t4-cyA9.js","assets/pendulum-wave-ChFphLzd.js","assets/phases-CBosDRYV.js","assets/phyllotaxis-NF3rhilL.js","assets/power-grid-CQ-FHIrF.js","assets/projectile-DP5mocyc.js","assets/protein-folding-C6wMZwdb.js","assets/q-learning-0PDV7pGZ.js","assets/quantum-Vfik2Rcx.js","assets/quantum-tunneling-Cm7IhzJX.js","assets/qubit-DvCXjEgu.js","assets/radio-svyOu8cs.js","assets/radioactive-decay-CnuZyfmk.js","assets/rainbows-DOhisCX6.js","assets/refraction-CKk7rVcK.js","assets/relativity-CqXwKszP.js","assets/resonance-B4QgW_-h.js","assets/ripple-tank-BTzLHzHZ.js","assets/rsa-BCkgvEk8.js","assets/sandpile-BqjTI5l4.js","assets/screens-DKYChx1s.js","assets/seasons-B0Q0DLtE.js","assets/seismic-waves-BzocOLhc.js","assets/self-assembly-DUjksoNj.js","assets/semiconductors-BofJHeqW.js","assets/snowflakes-pmenUDtT.js","assets/sorting-CPHbssyQ.js","assets/spectra-DDtjyZZF.js","assets/standing-waves-jXbU9DH5.js","assets/star-life-B9lTzSm4.js","assets/teleportation-C79t5oEm.js","assets/tokamak-Df2bG8fG.js","assets/tokenizer-Cuk3t55U.js","assets/tornado-CW1o_BSa.js","assets/transformer-Cme__MCn.js","assets/tsp-BXW0Jooj.js","assets/turbines-BQRsRjrT.js","assets/turing-patterns-D_X3HB2s.js","assets/vision-DLlNP5t-.js","assets/white-blood-cells-DCrDCHIx.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
