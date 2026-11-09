# ScienceAnim

Cinematic, interactive simulations of the ideas behind science, all running live in the browser. Every simulation tells a short **guided story** (narrated chapters that set up the scene and change parameters smoothly), then hands you the controls to explore.

**87 simulations across 10 fields:**

| Field | Simulations |
| --- | --- |
| Physics | Projectile motion & air drag · Double-pendulum chaos · Pendulum waves · Springs & resonance · Waves & interference (ripple tank) · Strings & harmonics · Doppler effect & sonic booms · Light, lenses & rainbows (ray tracing) · Electric fields · Electric circuits (series & parallel) · Electromagnetic induction · How light is made (EM radiation) · Kinetic theory of gases · Brownian motion · Bernoulli’s principle · How wings fly (Joukowski airfoil) · Fluid dynamics (Navier–Stokes) · Radioactive decay & half-life · Nuclear chain reaction · Fusion & tokamaks (Boris-pushed ions and electrons, field-line twist) · How a laser works (stimulated emission, threshold, population inversion) · Particle accelerators (cyclotron phase slip, LHC synchrotron) · Special relativity · Gravity as curved spacetime (Schwarzschild orbits, light bending, clocks) · Ising model & phase transitions (Metropolis, Onsager curve) · Sandpile avalanches (self-organised criticality, power laws) |
| AI | How transformers pay attention (real QKV attention, 2 layers, causal mask) · How a chatbot picks its next word (temperature, top-k, top-p) · Tokens (live byte-pair encoding, UTF-8 byte fallback) · Word embeddings (vector analogies, PCA) · Diffusion models (exact denoiser, DDPM/DDIM, prompt guidance) · Neural network training · Backpropagation step by step (XOR, every gradient shown) · Gradient descent (SGD, momentum, Adam) · Convolution (edge filters, ReLU, max pooling, draw your own) · Reinforcement learning (tabular Q-learning, exploration vs exploitation, cliff walking) · k-means clustering |
| Quantum | Qubits & quantum gates (Bloch sphere) · Bell’s theorem (CHSH test, quantum vs hidden variables) · Quantum teleportation (exact 3-qubit state vector) · Grover’s search (amplitude amplification, up to 64 items) · Bose–Einstein condensate (exact Bose/Fermi occupations, time of flight) · Quantum double slit · Quantum tunnelling (split-step Schrödinger) |
| Astronomy | Moon phases & eclipses · Orbits & gravity (Kepler, three-body, sandbox) · Orbital manoeuvres (Hohmann transfer, rendezvous) · The life of stars (H–R diagram) · Hunting exoplanets (transits & wobble) · Ray-traced black hole (WebGL) · Gravitational waves from merging black holes (chirp, ring-down) |
| Chemistry | Solid, liquid, gas (Lennard-Jones) · Molecule shapes (VSEPR, 3D) · Hydrogen orbitals · Reactions & equilibrium |
| Biology | DNA (helix, replication, transcription, translation) · Natural selection · Predators & prey · Epidemics (SIR) · Turing patterns (reaction–diffusion) · Neuron action potential (Hodgkin–Huxley) · Flocking |
| Mathematics | Galton board & the bell curve · Fourier epicycles · Logistic map & the road to chaos · Lorenz attractor · Mandelbrot & Julia sets (WebGL) · Golden angle / phyllotaxis |
| Computer science | Sorting race · Pathfinding (BFS, Dijkstra, A*, greedy) · Travelling salesperson (greedy, 2-opt, annealing) · Huffman compression (tree building, entropy limit) · Error-correcting codes (Hamming(7,4), noisy picture) · Public-key encryption (RSA with BigInt, square-and-multiply, factoring attack) · Hashing & blockchains (real SHA-256, proof of work, tampering) · Game of Life |
| Technology | Binary numbers · Logic gates & adders · Inside a CPU (fetch–decode–execute) · How the internet works (packet routing) · Radio, TV & wireless (AM/FM/digital) · How screens make pictures · The power grid |
| Earth & climate | Why we have seasons · The Coriolis effect & hurricanes · Greenhouse effect · Seismic waves & Earth's core |

## Running

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build in dist/
npm run thumbs   # render every gallery thumbnail into dist/thumbs/ (needs the build and a Playwright browser)
npm test         # smoke-test every simulation (desktop + phone) against the production build
npm run deploy   # build, render thumbnails and publish dist/ to GitHub Pages by hand (CI normally does this)
```

The first `npm test` needs a browser: `npx playwright install chromium`. Run one simulation with `npm test -- -g cpu`.

**Workflow:** make a short-lived branch for each change and open a pull request into `master`. GitHub Actions (`.github/workflows/ci.yml`) lints and runs the smoke tests on every pull request, split across 4 parallel jobs. Merging into `master` runs them again, and if they pass, it builds the site and publishes it to the `gh-pages` branch. That makes `master` exactly what's live. CI runners have no GPU, so there the two WebGL simulations are tested at reduced resolution. Before publishing, CI renders every gallery thumbnail once (`npm run thumbs`), so visitors download small images instead of running each simulation; any thumbnail missing from `dist/thumbs/index.json` is rendered live in the browser.

Keyboard in a simulation: `Space` pause · `←`/`→` chapters · `R` restart · `F` fullscreen · `C` controls panel · `H` hide interface · `Esc` back.

**Shareable links.** The address bar always describes what's on screen, e.g. `#/sim/projectile?ch=2&angle=30&drag=0.01`: `ch` is the story chapter (1-based, as on the story card), and each control appears by its `key` only when it differs from what that chapter sets. Opening such a link jumps to that chapter with those settings and turns auto-play off. The link button in the player copies it (or opens the share sheet on phones). Unknown keys are ignored and out-of-range values are clamped, so renaming a control's `key` breaks old links to that control only. The format lives in `src/js/share.js`.

**Embedding.** Add `embed=1` to a link (or use **Copy embed code** in the share menu) to get a stripped-down player for an `<iframe>` in a class page, slide deck or learning platform. It has no gallery navigation, and Esc doesn't leave the sim. Controls start closed, the story card starts collapsed in short frames, and an "Open in ScienceAnim" button opens the same view in a new tab.

## Architecture

No runtime dependencies: plain ES modules, Canvas 2D and WebGL, bundled by Vite.

```
src/
  index.html
  styles/main.css          design system (dark, glass panels, responsive)
  js/
    main.js                hash router: #/ (gallery) and #/sim/<id>
    gallery.js             hero, filters, search, cards with real rendered thumbnails (cached in localStorage)
    player.js              stage, story card, controls, live stats and charts
    categories.js          fields, colours and icons
    core/
      engine.js            Runner: canvas + DPR, frame loop, params & tweening, pointer input
      gl.js                fullscreen fragment-shader helper
      util.js              maths, colour maps, glow sprites, drawing helpers, spatial hash
    sims/
      index.js             registers every sims/<field>/<name>.js (lazy-loaded) and sets display order
      physics/ ai/ astronomy/ chemistry/ biology/ math/ cs/ tech/ earth/
tools/
  sim-manifest.js          Vite plugin: reads each sim's gallery metadata at build time
tests/
  smoke.spec.js            Playwright: opens every sim, plays every chapter, pokes every control
```

Each simulation is its own code chunk, downloaded only when it is opened (or when the gallery renders its thumbnail), so the first page load stays small however large the library grows.

### Adding a simulation

Create `src/js/sims/<field>/<id>.js` exporting a definition; it is picked up automatically (add the id to `ORDER` in `sims/index.js` to place it). `id`, `title`, `category`, `tagline`, `blurb`, `ages` and `topics` (and `keywords`, if used) must be plain literals, because the gallery reads them at build time without loading the simulation. Restart `npm run dev` after adding a new file.

```js
export default {
  id: 'my-sim',
  title: 'My Simulation',
  category: 'physics',                 // a key from categories.js
  tagline: 'One line for the gallery card.',
  ages: ['11-14', '14-16'],            // curriculum bands: '11-14', '14-16', '16+'
  topics: ['Forces', 'Motion'],        // shown on the card and searchable
  blurb: 'A short paragraph for the side panel.',
  ideas: ['Key idea one', 'Key idea two'],
  hint: 'What the viewer can do with the mouse',
  renderer: '2d',                      // or 'webgl'
  params: [
    { key: 'speed', label: 'Speed', type: 'range', min: 0, max: 10, step: 0.1, value: 1 },
    { key: 'trails', label: 'Trails', type: 'toggle', value: true },
    { key: 'mode', label: 'Mode', type: 'select', value: 'a', options: [{ value: 'a', label: 'A' }] },
    { key: 'reset', label: 'Reset', type: 'button', action: (sim) => sim.reset() },
  ],
  story: [
    { title: 'Chapter one', text: 'Narration…', formula: 'E = mc²', params: { speed: 2 }, duration: 10, enter: (sim) => {} },
  ],
  create(api) {
    // api: ctx | gl, params (live), pointer, runner, w, h, time, frame, thumbnail
    return {
      resize(w, h) {},
      update(dt) {},
      draw() {},
      stats: () => [{ label: 'Value', value: '42' }],
      charts: () => [{ title: 'Over time', series: [{ data: [], color: '#5b8cff' }] }],
      pointerDown(p) {}, pointerMove(p) {}, pointerUp(p) {},
      onParam(key, value) {},
      reset() {},
    };
  },
};
```

Numeric params tween smoothly when a story chapter changes them; mark a param `instant: true` if changing it rebuilds the scene.

**Quick checks.** A chapter can ask a prediction question before it plays out:

```js
{
  title: 'Bulbs in series',
  check: {
    q: 'Add two more bulbs in series. Each bulb will glow…',
    options: ['brighter', 'the same', 'dimmer'],
    answer: 2,                                      // index into options
    setup: { layout: 'single', on: true },          // optional: the scene while the question is open
    explain: 'The same voltage now pushes through three times the resistance…',
  },
  text: '…', params: { layout: 'series' }, // applied once the viewer answers or taps "Show me"
}
```

While the question is open the sim is paused, the chapter text is hidden (it would give the answer away), and auto-play waits. Not on the first chapter. `tests/story.spec.js` checks every question is well formed.

**Performance on slow devices.** WebGL simulations adapt their resolution automatically: if frames fall below about 45 fps, the engine draws fewer pixels (down to a third of full) and raises the resolution again when there is headroom. Opt out with `adaptive: false`. Their shaders must size themselves from `gl.drawingBufferWidth/Height` each frame, as the existing ones do. 2D simulations draw at full resolution, so a heavy one should limit its own work per frame. `turing-patterns` caps its steps at about 9 ms, and `fluid` trims its pressure-solver passes to stay within about 8 ms.
