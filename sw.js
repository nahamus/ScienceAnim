// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '9c49c61d1e21';
const PRECACHE = ["./","assets/accelerator-CcoqAR4t.js","assets/backprop-Ds3oBHDp.js","assets/bec-DH2rIKIK.js","assets/bell-test-B8nl53a-.js","assets/bernoulli-B3jDQDQy.js","assets/binary-DwOyO64F.js","assets/black-hole-DeaGudbK.js","assets/blockchain-Cl64qYtl.js","assets/brownian-VEAHGevs.js","assets/chain-reaction-CKoTBl_o.js","assets/circuits-C4gD8ie0.js","assets/cnn-D3-SMpqD.js","assets/coriolis-DSdBOpTK.js","assets/cpu-D7dSXFIQ.js","assets/curved-spacetime-CMV40crW.js","assets/diffusion-D1homzTm.js","assets/dna-XzF8LnM_.js","assets/doppler-DHiOfE9C.js","assets/double-pendulum-CMF7DTQx.js","assets/double-slit-DSvDnC5J.js","assets/ecosystem-5Ik2U3fy.js","assets/electric-field-Cq3ftn-0.js","assets/em-radiation-CEnHAoAY.js","assets/embeddings-cwTPY-q2.js","assets/epidemic-TMmHw8H0.js","assets/equilibrium-B8of9GNI.js","assets/exoplanets-CUzTLD8B.js","assets/flocking-UWgEFulp.js","assets/fluid-BcX9OBVF.js","assets/fourier-B0skJeS0.js","assets/galton-DSCUiOf1.js","assets/gl-sHHPorMo.js","assets/gradient-descent-BLARDDmv.js","assets/gravitational-waves-FaXFbhWf.js","assets/gravity-qQtg_cdq.js","assets/greenhouse-BdKV91-r.js","assets/grover-ZnH2tZNc.js","assets/hamming-DO6BXkJX.js","assets/huffman-CdDQu5xr.js","assets/index-2q8ohCOQ.js","assets/index-DTDvvMPI.css","assets/induction-etNVxMbq.js","assets/ising-CuEPnZ3X.js","assets/kinetic-gas-DjNfkHaN.js","assets/kmeans-B-zw-QNt.js","assets/laser-BeiNdRG1.js","assets/life-DaPb4Hnx.js","assets/lift-4p_0nfvo.js","assets/lightning-CfS2-PNu.js","assets/llm-sampling-B6VE-xIK.js","assets/logic-gates-Di3f1ap8.js","assets/logistic-map-D9Hosg5i.js","assets/lorenz-CNL37Gzi.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-ye8gqct_.js","assets/moon-phases-BPtDSzRL.js","assets/natural-selection-Dp8mVWX2.js","assets/networking-Du0J9P3z.js","assets/neural-network-56BwmxcY.js","assets/neuron-CwbGRRdf.js","assets/orbital-transfer-D5TpQpvz.js","assets/orbitals-fMvGi9yi.js","assets/pathfinding-CGHTl3p5.js","assets/pendulum-wave-tgXPdtQz.js","assets/phases-iBdYicy7.js","assets/phyllotaxis-LGBL48h_.js","assets/power-grid-eUG-E4iC.js","assets/projectile-BrGnHPXS.js","assets/q-learning-J4pm1qNA.js","assets/quantum-Bq_QK11T.js","assets/quantum-tunneling-DJz8qPs7.js","assets/qubit-Be97a3Ax.js","assets/radio-CXYyt480.js","assets/radioactive-decay-FMG21N_b.js","assets/rainbows-CYN6MQs6.js","assets/refraction-H2C2dE4M.js","assets/relativity-Bo3KOpSq.js","assets/resonance-CPgWQXPY.js","assets/ripple-tank-CQGJf-6g.js","assets/rsa-C8NAw78T.js","assets/sandpile-tQEuCMuh.js","assets/screens-B46q2VPS.js","assets/seasons-CioW_tau.js","assets/seismic-waves-v0hiMaQk.js","assets/semiconductors-DgiQYio-.js","assets/sorting-B4_bsa0q.js","assets/standing-waves-IivavTls.js","assets/star-life-BuxLe0E6.js","assets/teleportation-BzZEkfBN.js","assets/tokamak-ZIDJ1Hrd.js","assets/tokenizer-CZi9120G.js","assets/tornado-DPRYQ1NV.js","assets/transformer-DHWf2aBI.js","assets/tsp-34SjCpp1.js","assets/turbines-CMvXJnut.js","assets/turing-patterns-BcCqGsSo.js","assets/vision-B4Blghyv.js","assets/white-blood-cells-DWlzPcZe.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
