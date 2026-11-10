// Lessons: a teacher's ordered playlist of simulations, carried entirely in the link.
//   #/lesson/2?t=Light%20and%20sight&s=refraction,rainbows,vision
//   t  title (optional)    s  simulation ids in order    the number is the 1-based step on screen
// Unknown ids are dropped, so a link keeps working if a simulation is renamed or removed.

export const MAX_STEPS = 12;

/** { title, ids } from the part of the hash after "?", keeping only ids in `known`. */
export function parseLesson(query, known) {
  const q = new URLSearchParams(query || '');
  const ids = (q.get('s') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((id, i, all) => known.has(id) && all.indexOf(id) === i)
    .slice(0, MAX_STEPS);
  return { title: (q.get('t') || '').trim().slice(0, 80), ids };
}

/** "#/lesson/<step>?…" for 0-based `step`. */
export function lessonHash({ title, ids }, step = 0) {
  const q = new URLSearchParams();
  if (title) q.set('t', title);
  q.set('s', ids.join(','));
  // keep the commas readable: they are safe in a fragment
  return `#/lesson/${step + 1}?${q.toString().replace(/%2C/g, ',')}`;
}
