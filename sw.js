// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '002e54ecc10a';
const PRECACHE = ["./","assets/accelerator-DoyjkwRF.js","assets/acids-bases-VHYSV09k.js","assets/adversarial-VLYaVdc3.js","assets/antibiotic-resistance-BmVEG-88.js","assets/aurora-CKNzeYoS.js","assets/backprop-h81TcRMS.js","assets/battery-T72QyvZQ.js","assets/bayes-C6PjogwD.js","assets/bec-kfDbuRvK.js","assets/bell-test-unYvMKOV.js","assets/bernoulli-CGzedqRD.js","assets/binary-JwZBYV32.js","assets/black-hole-VDJfgpot.js","assets/blockchain-CikWIiyo.js","assets/brownian-H_TAwpoG.js","assets/bz-reaction-C6I2vDhE.js","assets/chain-reaction-DRS9MMUI.js","assets/circuits-je59iTs6.js","assets/cnn-DZFJmGWJ.js","assets/cooperation-D0mF_7Ya.js","assets/coriolis-C4nDqkaM.js","assets/cpu-JdM0vx94.js","assets/curved-spacetime-CA9-Desr.js","assets/dark-matter-CGSc_9na.js","assets/diffusion-3pIsyDk-.js","assets/dinosaur-asteroid-Dl5Eg5V1.js","assets/dna-C0qGkCrO.js","assets/doppler-DxQNVb-M.js","assets/double-pendulum-CILR0KYW.js","assets/double-slit-DApeikJM.js","assets/ecosystem-5KzFSXyf.js","assets/electric-field-CzdvjCGq.js","assets/em-radiation-CbII5Vqw.js","assets/embeddings-DDviPNug.js","assets/enzymes-C7UyDqx6.js","assets/epidemic-BsrJhXh6.js","assets/equilibrium-D7kxXlP2.js","assets/error-correction-BXHZA-Wi.js","assets/exoplanets-CCU5rkYE.js","assets/expanding-universe-CWMGI_G1.js","assets/fireflies-C9YJT2JU.js","assets/flocking-CoRntPCm.js","assets/fluid-DWXOfaNr.js","assets/forest-fire-DbtF6_OM.js","assets/fourier-sFADAsPU.js","assets/galaxy-collisions-BcyJ6_vC.js","assets/galton-ql61Q9ve.js","assets/gl-sHHPorMo.js","assets/gradient-descent-CULw1URp.js","assets/gravitational-waves-JlHjRjyB.js","assets/gravity-X8VENvHH.js","assets/greenhouse-D8TwoV2A.js","assets/grover-5K-CdEr8.js","assets/hamming-DQuOHT1L.js","assets/huffman-DU3IcQ7Z.js","assets/index-UH7Qy524.js","assets/index-XaYVHsD4.css","assets/induction-r377Sh1w.js","assets/ising-CgdQ8oUy.js","assets/kinetic-gas-eOCWfiE9.js","assets/kmeans-CurEJRCg.js","assets/laser-7d2xwVAq.js","assets/life-BQ4C0GuF.js","assets/lift-CV72Plz6.js","assets/lightning-c4nQjdv4.js","assets/llm-sampling-COYvdri1.js","assets/logic-gates-jlNqcMYH.js","assets/logistic-map-DVc6Jz7o.js","assets/lorenz-D1Gv3j-A.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-C17MY5On.js","assets/monte-carlo-aVHDbhgu.js","assets/moon-phases-DPdtmvUF.js","assets/natural-selection-CFZ7T3hO.js","assets/networking-BNLolYLo.js","assets/neural-network-Dx6OaZ7b.js","assets/neuron-oaQ2m59-.js","assets/orbital-transfer-ngfeRIdF.js","assets/orbitals-B5qs_fma.js","assets/pathfinding-Cr7KQUkc.js","assets/pendulum-wave-usou5U4P.js","assets/phases-BI9gWfXt.js","assets/phyllotaxis-CO3R-8CT.js","assets/power-grid-DjWjUySm.js","assets/projectile-CvUGpgdS.js","assets/protein-folding-BC25MaHi.js","assets/q-learning-DZ0TsXqE.js","assets/quantum-DD9z-Uzt.js","assets/quantum-tunneling-BL7FS3wo.js","assets/qubit-D1IJ2YzL.js","assets/radio-aGbpmZuT.js","assets/radioactive-decay-BnnuSJn4.js","assets/rainbows-DIUtae4K.js","assets/refraction-Dh9PChcZ.js","assets/relativity-_v5DJk4m.js","assets/resonance-Dpa5eRRB.js","assets/ripple-tank-CtPlBSjz.js","assets/rsa-BKrikr_3.js","assets/sandpile-Cy-QWSJe.js","assets/screens-CecH0Y82.js","assets/seasons-CqJswgbt.js","assets/seismic-waves-De9mc9ZN.js","assets/self-assembly-vz5M1UZo.js","assets/semiconductors-nY9pze2m.js","assets/sky-colour-DJ5ffmTT.js","assets/small-world-xQsZDEit.js","assets/snowflakes-D2Q6fY9_.js","assets/sorting-D61MuIQ8.js","assets/spectra-C6V61Zv-.js","assets/standing-waves-CRv_sSLP.js","assets/star-life-JHoVYdR8.js","assets/teleportation-D0xasHCj.js","assets/tides-80s9qPil.js","assets/tokamak-3lJaLNWl.js","assets/tokenizer-0H90g8x5.js","assets/tornado-DpQOx1fT.js","assets/traffic-CEwbI1-j.js","assets/transformer-BwR0YeLf.js","assets/tsp-BmQHPSFm.js","assets/turbines-BHgalmk2.js","assets/turing-patterns-C1Vk6As9.js","assets/vision-CFEvC1DO.js","assets/white-blood-cells-DxCNCV7a.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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
