// Auto-registers every simulation module in this folder tree (Vite glob import).
// Display order follows ORDER; anything not listed is appended.

const modules = import.meta.glob('./*/*.js', { eager: true });

const ORDER = [
  // physics
  'double-pendulum', 'ripple-tank', 'double-slit', 'electric-field', 'em-radiation', 'doppler',
  'kinetic-gas', 'brownian', 'fluid', 'chain-reaction', 'relativity',
  // astronomy
  'gravity', 'black-hole',
  // chemistry
  'orbitals', 'equilibrium',
  // biology
  'natural-selection', 'epidemic', 'neuron', 'flocking',
  // math
  'fourier', 'lorenz', 'mandelbrot', 'phyllotaxis',
  // cs
  'neural-network', 'sorting', 'pathfinding', 'life',
  // earth
  'greenhouse',
];

const all = Object.values(modules).map((m) => m.default).filter(Boolean);
export const SIMS = all.sort((a, b) => {
  const ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
  return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
});
