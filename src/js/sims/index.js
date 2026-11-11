// Registers every simulation in this folder tree. Gallery metadata (id, title, category, tagline,
// blurb, keywords) comes from a build-time manifest; each simulation's code is its own chunk,
// downloaded only when it is opened or its thumbnail is rendered.
// Display order follows ORDER; anything not listed is appended.

import MANIFEST from 'virtual:sim-manifest';

const loaders = import.meta.glob('./*/*.js', { import: 'default' });

const ORDER = [
  // physics
  'projectile', 'double-pendulum', 'pendulum-wave', 'resonance', 'ripple-tank', 'standing-waves', 'doppler',
  'refraction', 'electric-field', 'circuits', 'induction', 'em-radiation',
  'kinetic-gas', 'brownian', 'bernoulli', 'lift', 'fluid', 'radioactive-decay', 'chain-reaction', 'tokamak', 'laser', 'accelerator', 'relativity', 'curved-spacetime', 'ising', 'sandpile',
  // artificial intelligence
  'transformer', 'llm-sampling', 'tokenizer', 'embeddings', 'diffusion', 'neural-network', 'backprop', 'gradient-descent', 'cnn', 'adversarial', 'q-learning', 'kmeans',
  // quantum
  'qubit', 'bell-test', 'teleportation', 'quantum-error-correction', 'grover', 'bec', 'double-slit', 'quantum-tunneling', 'schrodingers-cat',
  // astronomy
  'moon-phases', 'gravity', 'orbital-transfer', 'star-life', 'exoplanets', 'black-hole', 'gravitational-waves', 'expanding-universe', 'galaxy-collisions', 'dark-matter', 'tides',
  // chemistry
  'phases', 'molecule-shapes', 'orbitals', 'equilibrium', 'bz-reaction', 'battery', 'spectra', 'acids-bases', 'protein-folding', 'enzymes', 'snowflakes', 'self-assembly',
  // biology
  'dna', 'natural-selection', 'ecosystem', 'epidemic', 'turing-patterns', 'neuron', 'vision', 'white-blood-cells', 'flocking', 'fireflies', 'antibiotic-resistance', 'crispr', 'red-blood-cells',
  // math
  'galton', 'fourier', 'logistic-map', 'lorenz', 'mandelbrot', 'phyllotaxis', 'traffic', 'cooperation', 'small-world', 'bayes', 'monte-carlo',
  // cs
  'sorting', 'pathfinding', 'tsp', 'huffman', 'hamming', 'rsa', 'blockchain', 'life',
  // technology
  'binary', 'logic-gates', 'cpu', 'networking', 'radio', 'screens', 'semiconductors', 'power-grid', 'turbines',
  // earth
  'seasons', 'coriolis', 'lightning', 'tornado', 'rainbows', 'sky-colour', 'aurora', 'greenhouse', 'forest-fire', 'seismic-waves', 'dinosaur-asteroid',
];

const rank = (id) => {
  const i = ORDER.indexOf(id);
  return i < 0 ? 999 : i;
};

/** Gallery entries: metadata plus `load()`, which resolves to the full definition (cached). */
export const SIMS = MANIFEST.map(({ file, ...meta }) => {
  let pending;
  const entry = {
    ...meta,
    def: null,
    load: () =>
      (pending ??= loaders[file]().then((def) => {
        if (def.id !== meta.id) throw new Error(`manifest mismatch for ${file}`);
        return (entry.def = def);
      }).catch((err) => {
        pending = null;
        throw err;
      })),
  };
  return entry;
}).sort((a, b) => rank(a.id) - rank(b.id));
