// Auto-registers every simulation module in this folder tree (Vite glob import).
// Display order follows ORDER; anything not listed is appended.

const modules = import.meta.glob('./*/*.js', { eager: true });

const ORDER = [
  // physics
  'projectile', 'double-pendulum', 'pendulum-wave', 'ripple-tank', 'standing-waves', 'doppler', 'refraction',
  'double-slit', 'quantum-tunneling', 'electric-field', 'induction', 'em-radiation', 'kinetic-gas', 'brownian',
  'fluid', 'chain-reaction', 'relativity',
  // astronomy
  'gravity', 'orbital-transfer', 'exoplanets', 'black-hole',
  // chemistry
  'phases', 'molecule-shapes', 'orbitals', 'equilibrium',
  // biology
  'dna', 'natural-selection', 'ecosystem', 'epidemic', 'turing-patterns', 'neuron', 'flocking',
  // math
  'galton', 'fourier', 'logistic-map', 'lorenz', 'mandelbrot', 'phyllotaxis',
  // cs
  'neural-network', 'gradient-descent', 'kmeans', 'sorting', 'pathfinding', 'tsp', 'life',
  // earth
  'seasons', 'greenhouse', 'seismic-waves',
];

const all = Object.values(modules).map((m) => m.default).filter(Boolean);
export const SIMS = all.sort((a, b) => {
  const ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
  return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
});
