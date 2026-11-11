// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '21efb8b615b7';
const PRECACHE = ["./","assets/accelerator-DziKi-F9.js","assets/backprop-BHDsazgc.js","assets/bec-D7Jr5np4.js","assets/bell-test-euovUrUi.js","assets/bernoulli-FX6Cv0l-.js","assets/binary-Qamq1MhA.js","assets/black-hole-DeaGudbK.js","assets/blockchain-CKTC4xO2.js","assets/brownian-BsHyUxWf.js","assets/chain-reaction-D0T7hBV8.js","assets/circuits-CY4jUppD.js","assets/cnn-LgtaG3wz.js","assets/coriolis-DVHLetJD.js","assets/cpu-ChBWnz-s.js","assets/curved-spacetime-D2mxaZ2D.js","assets/diffusion-CJ1mgoJc.js","assets/dna-DGX5Vk9H.js","assets/doppler-CsYssGx1.js","assets/double-pendulum-Bh6PInMm.js","assets/double-slit-Bbs_NfAM.js","assets/ecosystem-BZmdhptz.js","assets/electric-field-D5C9CbSV.js","assets/em-radiation-Cb9ZqVjk.js","assets/embeddings-D8Uo1btO.js","assets/epidemic-7p0SYEPE.js","assets/equilibrium-BPlB5H8x.js","assets/exoplanets-tDVILt5B.js","assets/flocking-R4pyg_xW.js","assets/fluid-6JQxNa5g.js","assets/fourier-CO_D0oF4.js","assets/galton-CjmEeJns.js","assets/gl-sHHPorMo.js","assets/gradient-descent-VCkCYOGl.js","assets/gravitational-waves-Jb-zMeWf.js","assets/gravity-BBgjG0by.js","assets/greenhouse-D-oHhjaK.js","assets/grover-u56yfIJT.js","assets/hamming-u8yeO0d_.js","assets/huffman-CAA910CS.js","assets/index-B5mzX_B_.js","assets/index-BZsi9Dz-.css","assets/induction-D_Cx5Q5y.js","assets/ising-D_y004Bp.js","assets/kinetic-gas-kMoW07eX.js","assets/kmeans-D0X3xNtj.js","assets/laser-CeNpX7kR.js","assets/life-CSyaVyU6.js","assets/lift-Bz9kavkw.js","assets/lightning-W72AU9Ar.js","assets/llm-sampling-BAsUmpMu.js","assets/logic-gates-0rnQwmZY.js","assets/logistic-map-DU7JL5_p.js","assets/lorenz-Ca_7sYS3.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-Ns4dIM0-.js","assets/moon-phases-CmyqqxUo.js","assets/natural-selection-BkFZV6lB.js","assets/networking-1wQzlzLw.js","assets/neural-network-haWYtMUL.js","assets/neuron-R054lzTe.js","assets/orbital-transfer-JGXxZHHY.js","assets/orbitals-C-j2Hqs0.js","assets/pathfinding-1pxcrb_k.js","assets/pendulum-wave-C4tkhnfG.js","assets/phases-Db1Ehops.js","assets/phyllotaxis-DMQsm7Cl.js","assets/power-grid-Dq6gPJQk.js","assets/projectile-Di0lO6cs.js","assets/q-learning-CbujNXE7.js","assets/quantum-B3pZJaUE.js","assets/quantum-tunneling-6eyVMie1.js","assets/qubit-BANVe6S9.js","assets/radio-BbINN-_f.js","assets/radioactive-decay-DtERzAHx.js","assets/rainbows-zT922Osg.js","assets/refraction-BuhFxNWU.js","assets/relativity-BYfoUBTK.js","assets/resonance-Bo2UZ9i7.js","assets/ripple-tank-CsH3TRMb.js","assets/rsa-BFZyjVLy.js","assets/sandpile-CXjXDY9A.js","assets/screens-BByATMXs.js","assets/seasons-D8xr_7F0.js","assets/seismic-waves-UOGkT5gO.js","assets/semiconductors-DNX9-6tz.js","assets/sorting-Cbneqlar.js","assets/standing-waves-DuLmyuNC.js","assets/star-life-BedpW1kF.js","assets/teleportation-y1VchwZq.js","assets/tokamak-BrI3Xshb.js","assets/tokenizer-D-cQtGsV.js","assets/tornado-adEM51Ez.js","assets/transformer-D-i_M0H0.js","assets/tsp-CCgTXG3i.js","assets/turbines-BWYgMB8C.js","assets/turing-patterns-BpCm8fRi.js","assets/vision-DBi2WVx7.js","assets/white-blood-cells-b3-OkPX8.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
