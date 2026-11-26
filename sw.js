// Service worker: after one visit the whole site works offline, every simulation included.
// tools/site-pages.js fills in VERSION and PRECACHE at build time and writes this to dist/sw.js.
//
//   pages          network first, so a new deploy shows up at once; the cached app when offline
//   assets/*       cache first (file names carry content hashes, so a cached copy is never stale)
//   thumbnails,    stale-while-revalidate: shown from cache straight away, refreshed in the background
//   fonts, icons

const VERSION = '886f0f2310c0';
const PRECACHE = ["./","assets/accelerator-CwIautfV.js","assets/acids-bases-99JvfhlE.js","assets/adversarial-B-2AHkjw.js","assets/antibiotic-resistance-DjCeuK_Y.js","assets/aurora-BMHHXH_j.js","assets/backprop-E6euXhJT.js","assets/battery-Doz2dgar.js","assets/bayes-CKdox_9t.js","assets/bec-CYVzpt3D.js","assets/bell-test-DNrDIwb9.js","assets/bernoulli-BbKbv9e8.js","assets/binary-PP0opg6U.js","assets/black-hole-VDJfgpot.js","assets/blockchain-Rg_AYzKD.js","assets/brownian-C4fm6pB0.js","assets/bz-reaction-BTIu72RO.js","assets/chain-reaction-BzRXtA3J.js","assets/circuits-BswkIrJA.js","assets/cnn-B28NowXO.js","assets/cooperation-aBjjBzMP.js","assets/coriolis-Cr4QrfMQ.js","assets/cpu-CBJ7894x.js","assets/crispr-CMMy7bck.js","assets/curved-spacetime-VxVhuWE5.js","assets/dark-matter-QkhHfNWn.js","assets/diffusion-Du-wwXmr.js","assets/dinosaur-asteroid-D4H6FZet.js","assets/dna-CQgJTzu_.js","assets/doppler-BMcXw3Kr.js","assets/double-pendulum-DVms0mN5.js","assets/double-slit-DqlpXk7Z.js","assets/ecosystem-B0iQYa8Q.js","assets/electric-field-C4h450VX.js","assets/em-radiation-COmFsAD7.js","assets/embeddings-c_TXaiMs.js","assets/enzymes-CdcJ8VLd.js","assets/epidemic-Cym7pxNk.js","assets/equilibrium-BrEVlXVe.js","assets/error-correction-djVbPRmY.js","assets/exoplanets-QxQ9wGG3.js","assets/expanding-universe-CA3YzF00.js","assets/fireflies-BBkdn9ap.js","assets/flocking-k1zbF2-c.js","assets/fluid-CuXcU-vE.js","assets/forest-fire-Cx5oA0Tf.js","assets/fourier-aLZqp1Ba.js","assets/galaxy-collisions-N-K4oQVg.js","assets/galton-lFZcDU_L.js","assets/gl-sHHPorMo.js","assets/gradient-descent-M1K7cDGE.js","assets/gravitational-waves-DxCh24_9.js","assets/gravity-G_5OXQK8.js","assets/greenhouse-BOi5GoHQ.js","assets/grover-COQTHGHM.js","assets/hamming-DgBxztSz.js","assets/huffman-CmuEPffX.js","assets/index-DGUONy8B.js","assets/index-XaYVHsD4.css","assets/induction-BmOcVWQq.js","assets/ising-BG5fKmVk.js","assets/kinetic-gas-6Pxqv-GD.js","assets/kmeans-D3I6zotH.js","assets/laser-CG0cY0yn.js","assets/life-CMJ-GrG4.js","assets/lift-2NW1z4Hd.js","assets/lightning-JGRF5u9s.js","assets/llm-sampling-BdaKdbhz.js","assets/logic-gates-DNhaEZiJ.js","assets/logistic-map-C9xNtOUr.js","assets/lorenz-iCE2bWW6.js","assets/mandelbrot-D8Up-H3g.js","assets/molecule-shapes-CcQrDW8C.js","assets/monte-carlo-D2jmDNVa.js","assets/moon-phases-cy9ysYZt.js","assets/natural-selection-CcF56PSW.js","assets/networking-7K31q6Jj.js","assets/neural-network-B1pIjgnk.js","assets/neuron-U_ZfmTu6.js","assets/orbital-transfer-rcglxuVX.js","assets/orbitals-AEttSnL5.js","assets/pathfinding-CkEbYFQ-.js","assets/pendulum-wave-DH8imwyz.js","assets/phases-mJ5n9vv1.js","assets/phyllotaxis-B7fckhjG.js","assets/power-grid-Cjm5acJp.js","assets/projectile-DDtf5cMX.js","assets/protein-folding-DkzpQzaW.js","assets/q-learning-KcuKq1Gi.js","assets/quantum-BRv7pQIH.js","assets/quantum-tunneling-DoZWCdur.js","assets/qubit-DXwzL110.js","assets/radio-BqrWOEjx.js","assets/radioactive-decay-DxCk97Uo.js","assets/rainbows-BEtlkMpp.js","assets/red-blood-cells-_A5rC77H.js","assets/refraction-B1GJ_Qe6.js","assets/relativity-fto7ImEk.js","assets/resonance-DROy6Gqm.js","assets/ripple-tank-BjoNiYHU.js","assets/rsa-DyIwFXkP.js","assets/sandpile-BmbVZtq0.js","assets/schrodingers-cat-Bx67OSQR.js","assets/screens-Blmjps_i.js","assets/seasons-B27uiwGD.js","assets/seismic-waves-uKkW2MOb.js","assets/self-assembly-CThJruDk.js","assets/semiconductors-BVsQ2oec.js","assets/sky-colour-IyKKODLv.js","assets/small-world-Do8THFN5.js","assets/snowflakes-BQD7KEhi.js","assets/sorting-BskqKAdc.js","assets/spectra-D3Q75cMJ.js","assets/standing-waves-BUg44Z_H.js","assets/star-life-CqB2N-VD.js","assets/teleportation-DpXNesO0.js","assets/tides-DKFS23PP.js","assets/tokamak-CXqyI9dF.js","assets/tokenizer-BRvARkmb.js","assets/tornado-FsfuD6Ua.js","assets/traffic-07cj7-7R.js","assets/transformer-Dt8w4ZVu.js","assets/tsp-xFeMPzrP.js","assets/turbines-D-BLzPQ8.js","assets/turing-patterns-DS0hDuqK.js","assets/vision-vs40Q3RL.js","assets/white-blood-cells-D9wFAsmx.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","manifest.webmanifest"]; // eslint-disable-line no-undef
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

const scope = () => self.registration.scope; // https://scienceanim.nahamus.com/

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
