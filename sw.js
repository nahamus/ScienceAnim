// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '4ec10d9d6525';
const PRECACHE = ["./","assets/accelerator-DBQlTPh-.js","assets/backprop-z_bzt3Na.js","assets/bec-DCYMECFp.js","assets/bell-test-Cl4sGFFe.js","assets/bernoulli-fesjxDh2.js","assets/binary-Bwce8ZL_.js","assets/black-hole-VDJfgpot.js","assets/blockchain-B8bKYYvz.js","assets/brownian-DQTIagGc.js","assets/chain-reaction-b0bhPDIc.js","assets/circuits-Hew0OdRJ.js","assets/cnn-0k0QY3ey.js","assets/coriolis-D2mGje4L.js","assets/cpu-NrQdDLRh.js","assets/curved-spacetime-CvEFN0XJ.js","assets/diffusion-CYX-IcW1.js","assets/dna-m4Pffw7f.js","assets/doppler-pmuFS6KW.js","assets/double-pendulum-D_JFgNXH.js","assets/double-slit-B-g05Ho4.js","assets/ecosystem-NABgzeZi.js","assets/electric-field-DiKeTUQT.js","assets/em-radiation-BUEClUp7.js","assets/embeddings-X6dPh60H.js","assets/epidemic-C6QFkHPn.js","assets/equilibrium-Cz9Ozyvg.js","assets/exoplanets-C23RVnuV.js","assets/flocking-DH8_IAoJ.js","assets/fluid-CNr0bvPA.js","assets/fourier-DfLmUOzR.js","assets/galton-PCORXY0H.js","assets/gl-sHHPorMo.js","assets/gradient-descent-ByAKqjdP.js","assets/gravitational-waves-ZnBg9z4A.js","assets/gravity-BkCw2sJ2.js","assets/greenhouse-DB4X2_VK.js","assets/grover-BFBUDrC6.js","assets/hamming-ToiSigzO.js","assets/huffman-Ce-0Fb-K.js","assets/index-DkfXcBPw.js","assets/index-XaYVHsD4.css","assets/induction-CwjWyqch.js","assets/ising-d4lFZ2dP.js","assets/kinetic-gas-BN0TmUZJ.js","assets/kmeans-BK8pcceK.js","assets/laser-DMHfenaH.js","assets/life-Dz3HnGp2.js","assets/lift-EJ-chUDF.js","assets/lightning-DmiTf1UG.js","assets/llm-sampling-CYOQcMSB.js","assets/logic-gates-BXqmcp_p.js","assets/logistic-map-CPZVR7Ta.js","assets/lorenz-Dov_VoJQ.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-D1yo5uB6.js","assets/moon-phases-DjuZYdLY.js","assets/natural-selection-DCKo2UOO.js","assets/networking-B7VV_hEn.js","assets/neural-network-DIfkkNo7.js","assets/neuron-Dl2VhpvH.js","assets/orbital-transfer-BYqLl5Du.js","assets/orbitals-hJiHQoOF.js","assets/pathfinding-D43D4Yxp.js","assets/pendulum-wave-C7eWWaCh.js","assets/phases-yUj1nmLQ.js","assets/phyllotaxis-CS96Nm59.js","assets/power-grid-Sog6qgUL.js","assets/projectile-YVYgBc-5.js","assets/q-learning-DI-JeMDk.js","assets/quantum-CVGHiMeT.js","assets/quantum-tunneling-BFOGfgdm.js","assets/qubit-gqGidNRl.js","assets/radio-Bi8I_RIZ.js","assets/radioactive-decay-CoC7kblj.js","assets/rainbows-CThCuND4.js","assets/refraction-YgasxoV7.js","assets/relativity-B2jmg1cZ.js","assets/resonance-C_OZXe-H.js","assets/ripple-tank-jyL8nPjv.js","assets/rsa-Cb1U-RFe.js","assets/sandpile-htVA9itv.js","assets/screens-CpzrxTEd.js","assets/seasons-Bu9jeODw.js","assets/seismic-waves-zT07Jv5u.js","assets/semiconductors-DToa3sov.js","assets/sorting-wBZfR448.js","assets/standing-waves-Coa8o5Pl.js","assets/star-life-CwcE3Md1.js","assets/teleportation-1fx2UTts.js","assets/tokamak-Cge5LeVR.js","assets/tokenizer-DJKeKETj.js","assets/tornado-CuL6L9XT.js","assets/transformer-BzYorfNJ.js","assets/tsp-jtBgQqA6.js","assets/turbines-CcSJQ4uz.js","assets/turing-patterns-CN6ryNhS.js","assets/vision-B0TlU51z.js","assets/white-blood-cells-BMFBzj4a.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
