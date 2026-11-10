// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '109d50f88379';
const PRECACHE = ["./","assets/accelerator-DNpnuIj6.js","assets/backprop-BqROBM7n.js","assets/bec-ebLVF4Hl.js","assets/bell-test-CG7jP6mw.js","assets/bernoulli-BgdNkFLx.js","assets/binary-aOJnzjMs.js","assets/black-hole-DeaGudbK.js","assets/blockchain-B1jLQJzA.js","assets/brownian-qczd00aY.js","assets/chain-reaction-DP6KZUNT.js","assets/circuits-BaXiLLL-.js","assets/cnn-XUQC-O8t.js","assets/coriolis-C5hOPoa_.js","assets/cpu-C-3Wgrn9.js","assets/curved-spacetime-B0u9R5j4.js","assets/diffusion-BN85gYGa.js","assets/dna-NGlT_7dm.js","assets/doppler-DQq4eQTu.js","assets/double-pendulum-DRw_H_rZ.js","assets/double-slit-CwJF6zbX.js","assets/ecosystem-B-0ujl-w.js","assets/electric-field-DhPTX4ya.js","assets/em-radiation-d7WBimV2.js","assets/embeddings-DDL-RzOd.js","assets/epidemic-DxfK7QYt.js","assets/equilibrium-C1Pm1FJ9.js","assets/exoplanets-O1PTMMq5.js","assets/flocking-B5Q-PBTI.js","assets/fluid-CJcJaLkL.js","assets/fourier-Cf2z7zHS.js","assets/galton-DIxj1-3O.js","assets/gl-sHHPorMo.js","assets/gradient-descent-CkQPwvMG.js","assets/gravitational-waves-BMXSrSRN.js","assets/gravity-CwhXtyv9.js","assets/greenhouse-B8WpDiYT.js","assets/grover-BcJdZi-7.js","assets/hamming-C882jkY7.js","assets/huffman-DgFSG4iZ.js","assets/index-ByLVs70R.css","assets/index-hdlQss3G.js","assets/induction-DijDvNlC.js","assets/ising-TlpF1cZE.js","assets/kinetic-gas-DwclAlnc.js","assets/kmeans-DajN1pXu.js","assets/laser-BmPoXM7v.js","assets/life-16otgjov.js","assets/lift-vKRsybdj.js","assets/lightning-Skg_cLLC.js","assets/llm-sampling-m4kzrt7D.js","assets/logic-gates-C8gL1Jgh.js","assets/logistic-map-CDmBEytB.js","assets/lorenz-DWcIob6l.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-Ct6Wwf1H.js","assets/moon-phases--rDdFV_C.js","assets/natural-selection-BUtnRHeW.js","assets/networking-DoH9bNd0.js","assets/neural-network-D4vKrPe9.js","assets/neuron-R8Z1IL7u.js","assets/orbital-transfer-_O5wKE_O.js","assets/orbitals-BF7Hnb6i.js","assets/pathfinding-E-Aw0oEr.js","assets/pendulum-wave-DSqaAirT.js","assets/phases-BTXbLVhQ.js","assets/phyllotaxis-DeTn1-nf.js","assets/power-grid-DnHOwa5p.js","assets/projectile-Cf1bG3Tt.js","assets/q-learning-olz6mk4m.js","assets/quantum-9MYL8qBF.js","assets/quantum-tunneling-CT0OerHD.js","assets/qubit-CbpRNAyX.js","assets/radio-BO4tOc3W.js","assets/radioactive-decay-CLHtXiGX.js","assets/rainbows-D9LqVYFw.js","assets/refraction-D6cSDi4A.js","assets/relativity-W6PqMUez.js","assets/resonance-BgP_MjuA.js","assets/ripple-tank-lSovcQWa.js","assets/rsa-k06QIeiN.js","assets/sandpile-BU6m6vM0.js","assets/screens-rZVKELha.js","assets/seasons-DV2gzJHF.js","assets/seismic-waves-DL6fTpzN.js","assets/semiconductors-Da6uhGlM.js","assets/sorting-D_b2EKZY.js","assets/standing-waves-GFlF_Xrr.js","assets/star-life-Bzoa2RSG.js","assets/teleportation---bRtR2E.js","assets/tokamak-jpXOU_wA.js","assets/tokenizer-xYbs6VM4.js","assets/tornado-YyogmHHF.js","assets/transformer-BpZMWrJo.js","assets/tsp-D1X7H-z7.js","assets/turbines-MY9t0Lig.js","assets/turing-patterns-Dky5ZU6W.js","assets/vision-CnOpZZyB.js","assets/white-blood-cells-CVAeI6MW.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
