# ScienceAnim

Cinematic, interactive simulations of the ideas behind science, all running live in the browser. Every simulation tells a short **guided story** (narrated chapters that set up the scene and change parameters smoothly), then hands you the controls to explore.

**28 simulations across 7 fields:**

| Field | Simulations |
| --- | --- |
| Physics | Double-pendulum chaos · Waves & interference (ripple tank) · Quantum double slit · Electric fields · How light is made (EM radiation) · Doppler effect & sonic booms · Kinetic theory of gases · Brownian motion · Fluid dynamics (Navier–Stokes) · Nuclear chain reaction · Special relativity |
| Astronomy | Orbits & gravity (Kepler, three-body, sandbox) · Ray-traced black hole (WebGL) |
| Chemistry | Hydrogen orbitals · Reactions & equilibrium |
| Biology | Natural selection · Epidemics (SIR) · Neuron action potential (Hodgkin–Huxley) · Flocking |
| Mathematics | Fourier epicycles · Lorenz attractor · Mandelbrot & Julia sets (WebGL) · Golden angle / phyllotaxis |
| Computer science | Neural network training · Sorting race · Pathfinding (BFS, Dijkstra, A*, greedy) · Game of Life |
| Earth & climate | Greenhouse effect |

## Running

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build in dist/
npm run deploy   # publish dist/ to GitHub Pages
```

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
      index.js             auto-registers every sims/<field>/<name>.js and sets display order
      physics/ astronomy/ chemistry/ biology/ math/ cs/ earth/
```

### Adding a simulation

Create `src/js/sims/<field>/<id>.js` exporting a definition; it is picked up automatically (add the id to `ORDER` in `sims/index.js` to place it).

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
