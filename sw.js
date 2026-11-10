// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '637af6552b00';
const PRECACHE = ["./","assets/accelerator-C2zueA2I.js","assets/backprop-CMbMYh48.js","assets/bec-DyycJQS5.js","assets/bell-test-Dy0JpU6V.js","assets/bernoulli-C-Wqz2ju.js","assets/binary-BlLKYR6L.js","assets/black-hole-DeaGudbK.js","assets/blockchain-u9Nl2j_W.js","assets/brownian-CS3pRiAr.js","assets/chain-reaction-BcRBwH88.js","assets/circuits-p1a1PucY.js","assets/cnn-C9xBAPkW.js","assets/coriolis-OVxX7y6X.js","assets/cpu-BU7zHXlX.js","assets/curved-spacetime-7FXPmPZJ.js","assets/diffusion-clTc3Igy.js","assets/dna-BbCCu8WS.js","assets/doppler-C6-DyyzK.js","assets/double-pendulum-Ch2Gwsis.js","assets/double-slit-B5ApgcID.js","assets/ecosystem-BEeOTllh.js","assets/electric-field-DqlBm8Ah.js","assets/em-radiation-BnTcPGhB.js","assets/embeddings-SGbWvqNn.js","assets/epidemic-CX-9Iw-_.js","assets/equilibrium-D4YGZNnE.js","assets/exoplanets-euo4l5B0.js","assets/flocking-7YAgiqn6.js","assets/fluid-B4r2NP0U.js","assets/fourier-CVEWE9ms.js","assets/galton-BKlKIvjZ.js","assets/gl-sHHPorMo.js","assets/gradient-descent-CpX6mFzz.js","assets/gravitational-waves-COirjTLG.js","assets/gravity-D2O_tX34.js","assets/greenhouse-BM0kCp7T.js","assets/grover-CUMkqeTF.js","assets/hamming-gkgWQiE0.js","assets/huffman-Bv4yfdHW.js","assets/index-ByLVs70R.css","assets/index-Ddt9_QhH.js","assets/induction-BNqo20RK.js","assets/ising-C-XA6b_0.js","assets/kinetic-gas-Cfqm4NeP.js","assets/kmeans-DnN1WsBc.js","assets/laser-qLpEzV1E.js","assets/life-DGl8RiFt.js","assets/lift-Bx3r5TTg.js","assets/lightning-BaNmVNw0.js","assets/llm-sampling-DrDKUlpa.js","assets/logic-gates-CVdtqEZA.js","assets/logistic-map-BsOCMueW.js","assets/lorenz-DjiRVX4c.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-DgQS4xNg.js","assets/moon-phases-pkjIiRpG.js","assets/natural-selection-DNHldHrX.js","assets/networking-B2F2G07d.js","assets/neural-network-DtOLuP7A.js","assets/neuron-cd6iQgYi.js","assets/orbital-transfer-BsflavhF.js","assets/orbitals-DyCfK14x.js","assets/pathfinding-BwGLHPaq.js","assets/pendulum-wave-DZSmqPjP.js","assets/phases-JRJekBjO.js","assets/phyllotaxis-BG32mSUu.js","assets/power-grid-DNRLA_DK.js","assets/projectile-C2XSMSVf.js","assets/q-learning-CiHMrcl0.js","assets/quantum-D9uTEbZ4.js","assets/quantum-tunneling-C3FYPVNq.js","assets/qubit-cL-4bSep.js","assets/radio-BRSD7MFy.js","assets/radioactive-decay-CjVnkJov.js","assets/rainbows--roBesz8.js","assets/refraction-BKhm2Iuf.js","assets/relativity-B3Bcb5mg.js","assets/resonance-DHMtqScD.js","assets/ripple-tank-C4jHd2oo.js","assets/rsa-PBWW9toQ.js","assets/sandpile-DH0UphRG.js","assets/screens-Cz0fGFDr.js","assets/seasons-ZwQ2W5EK.js","assets/seismic-waves-BJwE_Xyo.js","assets/semiconductors-BB4gDU0Y.js","assets/sorting-kCF16AW5.js","assets/standing-waves-BcsKggJt.js","assets/star-life-DZi6Stex.js","assets/teleportation-CLwYwGhi.js","assets/tokamak-x06HF1Go.js","assets/tokenizer-vdgBEbxV.js","assets/tornado-3PwXTWN6.js","assets/transformer-3jylpWqG.js","assets/tsp-DbZHPLZq.js","assets/turbines-rM1_SOCf.js","assets/turing-patterns-C8Etf5_M.js","assets/vision-CuoF1Hb1.js","assets/white-blood-cells-BtYa4fpf.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
