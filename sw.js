// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '389b43fac50d';
const PRECACHE = ["./","assets/accelerator-C8wfnJoh.js","assets/backprop-Cz--rP2I.js","assets/bec-DQPqxHZI.js","assets/bell-test-B4I1wZ9k.js","assets/bernoulli-CRu_zRev.js","assets/binary-DXQzCdQD.js","assets/black-hole-DeaGudbK.js","assets/blockchain-C-Sh_QXF.js","assets/brownian-QZSlxz71.js","assets/chain-reaction-aA53R0AP.js","assets/circuits-DiHiaLeP.js","assets/cnn-DXDv7XRb.js","assets/coriolis-D5c21_87.js","assets/cpu-CEMsD4n6.js","assets/curved-spacetime-C31jofVi.js","assets/diffusion-DtO8P8nW.js","assets/dna-DzE70RJT.js","assets/doppler-D6BdBT98.js","assets/double-pendulum-CaKvCCO3.js","assets/double-slit-CybXR7l2.js","assets/ecosystem-DbcSSpI4.js","assets/electric-field-D-E-CuD0.js","assets/em-radiation-C_0SUaAA.js","assets/embeddings-DukCSSLj.js","assets/epidemic-DHRa0tUm.js","assets/equilibrium-DHTt1GOi.js","assets/exoplanets-Eh0yExzT.js","assets/flocking-hEdnJ_Ec.js","assets/fluid-BdqZLB26.js","assets/fourier-QFnLukEu.js","assets/galton-Dkhcj4o_.js","assets/gl-sHHPorMo.js","assets/gradient-descent-EhJ-Ilj-.js","assets/gravitational-waves-BCVRRjbu.js","assets/gravity-NBbLxIu-.js","assets/greenhouse-0JPLNvkC.js","assets/grover-asEbFcxd.js","assets/hamming-Bzf5CivG.js","assets/huffman-TtxUlMoZ.js","assets/index-BJDCXcvn.js","assets/index-BV1BUTmG.css","assets/induction-z0KVvde6.js","assets/ising-BHcjYkgq.js","assets/kinetic-gas-_9AUGdRQ.js","assets/kmeans-BBJcr8sb.js","assets/laser-CW2pyCkC.js","assets/life-CvRkLWEj.js","assets/lift-BufZp0qe.js","assets/lightning-CCiwOocE.js","assets/llm-sampling-Dds22lOk.js","assets/logic-gates-Do63sOz4.js","assets/logistic-map-XAo_kBKI.js","assets/lorenz-q98KvwY5.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-DPzGDjTV.js","assets/moon-phases-BsinoXfE.js","assets/natural-selection-C-uBK4qc.js","assets/networking-BcpMSeMd.js","assets/neural-network-uw84Lkyb.js","assets/neuron-DgaWPhub.js","assets/orbital-transfer-Br3TGFrk.js","assets/orbitals-DI1LDbRt.js","assets/pathfinding-BMiasD8n.js","assets/pendulum-wave-Dpee_a-A.js","assets/phases-DmDLUEau.js","assets/phyllotaxis-DhjwQd9X.js","assets/power-grid-CMXPq20K.js","assets/projectile-OqH0kK2u.js","assets/q-learning-BH-Nhpnz.js","assets/quantum-DIIrAxBt.js","assets/quantum-tunneling-B6HfPuvX.js","assets/qubit-ByD3jQ5p.js","assets/radio-D7Tbq_6f.js","assets/radioactive-decay-CTlun2gr.js","assets/rainbows-C9IpXQJr.js","assets/refraction-DUsyS6pO.js","assets/relativity-C-hnIhsI.js","assets/resonance-BPh2K4Et.js","assets/ripple-tank-JqHakXC1.js","assets/rsa-oLchGsa5.js","assets/sandpile-KjyvNLEc.js","assets/screens-BSvpTkZq.js","assets/seasons-B-PPfdRz.js","assets/seismic-waves-CehIQgab.js","assets/semiconductors-Z5Lqo0UG.js","assets/sorting-CDkiFais.js","assets/standing-waves-DmWNM0_A.js","assets/star-life-fg7wqSji.js","assets/teleportation-BO8uziSj.js","assets/tokamak-Cw4eOpNb.js","assets/tokenizer-DcEsWDZC.js","assets/tornado-B8Z0wTdd.js","assets/transformer-CpH8naPO.js","assets/tsp-BPW5A15b.js","assets/turbines-CnWPCUr6.js","assets/turing-patterns-DrKQ9F7H.js","assets/vision--bc5l_O0.js","assets/white-blood-cells-DmN_13Wl.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
