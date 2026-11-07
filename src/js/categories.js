// Field categories with their accent color and a line icon (inline SVG paths).

const svg = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const CATEGORIES = [
  {
    id: 'physics',
    name: 'Physics',
    color: '#5b8cff',
    icon: svg('<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>'),
  },
  {
    id: 'astronomy',
    name: 'Astronomy',
    color: '#a78bfa',
    icon: svg('<circle cx="12" cy="12" r="4"/><path d="M3 15c3-1 15-6 18-9"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="19" r="1"/>'),
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    color: '#2ee6a6',
    icon: svg('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 14h9"/>'),
  },
  {
    id: 'biology',
    name: 'Biology',
    color: '#a3e635',
    icon: svg('<path d="M7 3c0 6 10 6 10 12s-10 6-10 6"/><path d="M17 3c0 6-10 6-10 12"/><path d="M8.5 7h7M8.5 17h7M10 12h4"/>'),
  },
  {
    id: 'math',
    name: 'Mathematics',
    color: '#ffb547',
    icon: svg('<path d="M4 18c3 0 4-12 8-12s5 12 8 12"/><path d="M3 12h18"/>'),
  },
  {
    id: 'cs',
    name: 'Computer Science',
    color: '#ff5fa2',
    icon: svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M8 9l-2 2 2 2M16 9l2 2-2 2M13 8l-2 6"/>'),
  },
  {
    id: 'earth',
    name: 'Earth & Climate',
    color: '#38d6f5',
    icon: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
  },
];

export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const ICONS = {
  play: svg('<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>'),
  pause: svg('<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  restart: svg('<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4.5h4.5"/>'),
  expand: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  sliders: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  next: svg('<path d="M9 5l7 7-7 7"/>'),
  prev: svg('<path d="M15 5l-7 7 7 7"/>'),
  book: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>'),
  minimize: svg('<path d="M6 15l6-6 6 6"/>'),
  maximize: svg('<path d="M6 9l6 6 6-6"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  hand: svg('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5V4a1.5 1.5 0 0 1 3 0v6m0-4.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5-2.7L4.5 15a1.6 1.6 0 0 1 2.6-1.8L8 14"/>'),
};
