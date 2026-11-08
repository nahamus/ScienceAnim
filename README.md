# ScienceAnim

Cinematic, interactive simulations of the ideas behind science, all running live in the browser. Every simulation tells a short **guided story** (narrated chapters that set up the scene and change parameters smoothly), then hands you the controls to explore.

**63 simulations across 8 fields:**

| Field | Simulations |
| --- | --- |
| Physics | Projectile motion & air drag · Double-pendulum chaos · Pendulum waves · Springs & resonance · Waves & interference (ripple tank) · Strings & harmonics · Doppler effect & sonic booms · Light, lenses & rainbows (ray tracing) · Quantum double slit · Quantum tunnelling (split-step Schrödinger) · Electric fields · Electric circuits (series & parallel) · Electromagnetic induction · How light is made (EM radiation) · Kinetic theory of gases · Brownian motion · Bernoulli’s principle · How wings fly (Joukowski airfoil) · Fluid dynamics (Navier–Stokes) · Radioactive decay & half-life · Nuclear chain reaction · Special relativity |
| Astronomy | Moon phases & eclipses · Orbits & gravity (Kepler, three-body, sandbox) · Orbital manoeuvres (Hohmann transfer, rendezvous) · The life of stars (H–R diagram) · Hunting exoplanets (transits & wobble) · Ray-traced black hole (WebGL) |
| Chemistry | Solid, liquid, gas (Lennard-Jones) · Molecule shapes (VSEPR, 3D) · Hydrogen orbitals · Reactions & equilibrium |
| Biology | DNA (helix, replication, transcription, translation) · Natural selection · Predators & prey · Epidemics (SIR) · Turing patterns (reaction–diffusion) · Neuron action potential (Hodgkin–Huxley) · Flocking |
| Mathematics | Galton board & the bell curve · Fourier epicycles · Logistic map & the road to chaos · Lorenz attractor · Mandelbrot & Julia sets (WebGL) · Golden angle / phyllotaxis |
| Computer science | Neural network training · Gradient descent (SGD, momentum, Adam) · k-means clustering · Sorting race · Pathfinding (BFS, Dijkstra, A*, greedy) · Travelling salesperson (greedy, 2-opt, annealing) · Game of Life |
| Technology | Binary numbers · Logic gates & adders · Inside a CPU (fetch–decode–execute) · How the internet works (packet routing) · Radio, TV & wireless (AM/FM/digital) · How screens make pictures · The power grid |
| Earth & climate | Why we have seasons · The Coriolis effect & hurricanes · Greenhouse effect · Seismic waves & Earth's core |

## Running

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build in dist/
npm test         # smoke-test every simulation (desktop + phone) against the production build
npm run deploy   # publish dist/ to GitHub Pages
```

The first `npm test` needs a browser: `npx playwright install chromium`. Run one simulation with `npm test -- -g cpu`.

Keyboard in a simulation: `Space` pause · `←`/`→` chapters · `R` restart · `F` fullscreen · `C` controls panel · `H` hide interface · `Esc` back.

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
      physics/ astronomy/ chemistry/ biology/ math/ cs/ tech/ earth/
tools/
  sim-manifest.js          Vite plugin: reads each sim's gallery metadata at build time
tests/
  smoke.spec.js            Playwright: opens every sim, plays every chapter, pokes every control
```

Each simulation is its own code chunk, downloaded only when it is opened (or when the gallery renders its thumbnail), so the first page load stays small however large the library grows.

### Adding a simulation

Create `src/js/sims/<field>/<id>.js` exporting a definition; it is picked up automatically (add the id to `ORDER` in `sims/index.js` to place it). `id`, `title`, `category`, `tagline` and `blurb` (and `keywords`, if used) must be plain string literals, because the gallery reads them at build time without loading the simulation. Restart `npm run dev` after adding a new file.

```js
export default {
  id: 'my-sim',
  title: 'My Simulation',
  category: 'physics',                 // a key from categories.js
  tagline: 'One line for the gallery card.',
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
