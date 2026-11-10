// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = 'b6423fef2cf1';
const PRECACHE = ["./","assets/accelerator-CnLVdpTR.js","assets/backprop-gZ7BD7RW.js","assets/bec-UBxzd0R-.js","assets/bell-test-zTLlUtqu.js","assets/bernoulli-NwilOHpS.js","assets/binary-BtkAkFtP.js","assets/black-hole-DeaGudbK.js","assets/blockchain-CxCPLk49.js","assets/brownian-BUn6FqQR.js","assets/chain-reaction-BCiMFJn7.js","assets/circuits-CPGJk1n-.js","assets/cnn-DiFqgABP.js","assets/coriolis-CEpwsYKv.js","assets/cpu-CrF2RE9w.js","assets/curved-spacetime-CyYdUZps.js","assets/diffusion-OtBRITGN.js","assets/dna-DfV88b6o.js","assets/doppler-ByyIpxWA.js","assets/double-pendulum-BD9dttC6.js","assets/double-slit-DuWf4kTU.js","assets/ecosystem-DPK8G4na.js","assets/electric-field-DxIUcCmP.js","assets/em-radiation-DKe5lsY4.js","assets/embeddings-BP1w50qr.js","assets/epidemic-y1LHtNPt.js","assets/equilibrium-CUO_F8EU.js","assets/exoplanets-p9hjuz_N.js","assets/flocking-DhsCGdeB.js","assets/fluid-D1K0QriZ.js","assets/fourier-uPe_Va0a.js","assets/galton-CUi2xa5G.js","assets/gl-sHHPorMo.js","assets/gradient-descent-Dj-JkvUj.js","assets/gravitational-waves-BJ_PxNXK.js","assets/gravity-DgO3VC70.js","assets/greenhouse-DjAzDWbS.js","assets/grover-1uwhZAtN.js","assets/hamming-B2HdbO59.js","assets/huffman-60RWn-Je.js","assets/index-0o8Vm-Gk.js","assets/index-ByLVs70R.css","assets/induction-IhVTJK8h.js","assets/ising-B4kGU8tD.js","assets/kinetic-gas-CvLbFfKl.js","assets/kmeans-B8a1BxnR.js","assets/laser-BScra3Ts.js","assets/life-DOnSK5Vl.js","assets/lift-CTLQUjNW.js","assets/lightning-BlEEd6ge.js","assets/llm-sampling-b3EBJYIe.js","assets/logic-gates-BYiJ5lOQ.js","assets/logistic-map-B3tZgHcn.js","assets/lorenz-BfqGtYoV.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-A9m2xPKJ.js","assets/moon-phases-DU5sQdvP.js","assets/natural-selection-DA4pKUMG.js","assets/networking-CEKCdLkL.js","assets/neural-network-BW97GgJP.js","assets/neuron-BGAkUAse.js","assets/orbital-transfer-D91Ki3Tt.js","assets/orbitals-B2aAahla.js","assets/pathfinding-DOvDVtoQ.js","assets/pendulum-wave-C9hOSkib.js","assets/phases-BU6mMrJw.js","assets/phyllotaxis-CdT-mwkY.js","assets/power-grid-D92uwHzo.js","assets/projectile-Ddy7KD0v.js","assets/q-learning-XCl549Dd.js","assets/quantum-DnT3yMEE.js","assets/quantum-tunneling-CvgmbHGz.js","assets/qubit-mQsNpylo.js","assets/radio-59zsW69M.js","assets/radioactive-decay-DVMII-Tj.js","assets/rainbows-6eOnROOZ.js","assets/refraction-B5f_vNHj.js","assets/relativity-DrRAyTCg.js","assets/resonance-DxNv12xr.js","assets/ripple-tank-DT19IhUP.js","assets/rsa-BjBTdohG.js","assets/sandpile-C9V2oeWU.js","assets/screens-F1DILEKJ.js","assets/seasons-C7KUCsRB.js","assets/seismic-waves-D1-grYY1.js","assets/semiconductors-CKv15q16.js","assets/sorting-DxhUkK7c.js","assets/standing-waves-C_Nc4fED.js","assets/star-life-BV1fMUIE.js","assets/teleportation-BFzKo2w4.js","assets/tokamak-BdEuGBhM.js","assets/tokenizer-COT5CGeN.js","assets/tornado-CNApJs8B.js","assets/transformer-Cf7oIkhV.js","assets/tsp-Bn9EEcT_.js","assets/turbines-D6tvdRDi.js","assets/turing-patterns-BTGb82wM.js","assets/vision-CXO1O2fT.js","assets/white-blood-cells-tgg3NwsO.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
