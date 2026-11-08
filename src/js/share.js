// Shareable links: #/sim/<id>?ch=3&angle=45&drag=1
//   ch      1-based story chapter (as shown on the story card)
//   <key>   a control's value, only where it differs from what that chapter sets by itself
//   embed=1 stripped-down player for iframes (no gallery navigation)
// Unknown keys and out-of-range values are ignored or clamped, so old or hand-edited links still open.

/** Controls whose values can travel in a link. */
const shareable = (def) => (def.params || []).filter((p) => !p.hidden && p.type !== 'button');

/** Decimal places worth keeping for a slider (enough to reproduce its step). */
function digits(p) {
  if (!p.step) return 3;
  const s = String(p.step);
  return s.includes('e-') ? +s.split('e-')[1] : (s.split('.')[1] || '').length;
}

function encode(p, v) {
  if (p.type === 'toggle') return v ? '1' : '0';
  if (p.type === 'range') return String(+(+v).toFixed(digits(p)));
  return String(v);
}

function decode(p, raw) {
  if (p.type === 'toggle') return raw === '1' || raw === 'true';
  if (p.type === 'range') {
    const v = parseFloat(raw);
    return Number.isFinite(v) ? Math.min(p.max, Math.max(p.min, v)) : undefined;
  }
  if (p.type === 'select') return p.options.find((o) => String(o.value) === raw)?.value;
  return undefined;
}

/**
 * Param values in effect once the story has been stepped through to chapter `ch` (0-based).
 * With `asking`, that chapter's quick check is still open, so its setup scene shows instead.
 */
export function chapterBaseline(def, ch, asking = false) {
  const base = {};
  const story = def.story || [];
  for (const p of def.params || []) if ('value' in p) base[p.key] = p.value;
  for (const c of story.slice(0, asking ? ch : ch + 1)) Object.assign(base, c.params);
  if (asking) Object.assign(base, story[ch]?.check?.setup);
  return base;
}

/** Read the part of the hash after "?". Returns null when the link carries no state. */
export function parseShare(def, query) {
  if (!query) return null;
  const q = new URLSearchParams(query);
  const chapters = def.story?.length || 0;
  const out = { chapter: 0, params: {} };
  const ch = parseInt(q.get('ch'), 10);
  if (chapters && Number.isFinite(ch)) out.chapter = Math.min(chapters, Math.max(1, ch)) - 1;
  for (const p of shareable(def)) {
    if (!q.has(p.key)) continue;
    const v = decode(p, q.get(p.key));
    if (v !== undefined) out.params[p.key] = v;
  }
  return q.has('ch') || Object.keys(out.params).length ? out : null;
}

/** Whether a link asks for the embedded player. */
export const isEmbed = (query) => new URLSearchParams(query || '').get('embed') === '1';

/** Build "#/sim/<id>?…" for the given chapter and current control values. */
export function buildShare(def, chapter, values, { embed = false, asking = false } = {}) {
  const q = new URLSearchParams();
  if (def.story?.length) q.set('ch', String(chapter + 1));
  const base = chapterBaseline(def, Math.max(0, chapter), asking);
  for (const p of shareable(def)) {
    const v = values[p.key];
    if (v === undefined) continue;
    const enc = encode(p, v);
    if (base[p.key] !== undefined && encode(p, base[p.key]) === enc) continue;
    q.set(p.key, enc);
  }
  if (embed) q.set('embed', '1');
  const s = q.toString();
  return `#/sim/${def.id}${s ? '?' + s : ''}`;
}
