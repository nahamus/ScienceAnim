// Vite plugin: everything the site needs beyond the app itself, so links preview well and it works offline.
//
//   sim/<id>/index.html  a copy of the app page whose <head> describes that simulation (title, description,
//                        Open Graph / Twitter card with its thumbnail). Chat apps and search engines read
//                        these tags without running JavaScript; the app then boots straight into the sim
//                        (see main.js). Share links point here: https://…/ScienceAnim/sim/<id>/?ch=3
//   sitemap.xml          every page, for search engines (submit it in Search Console: a project site's
//                        robots.txt isn't read, as it isn't at the domain root)
//   sw.js                service worker that precaches the app and every simulation's code (see src/sw.js)
//
// The dev server serves sim/<id>/ pages too, so share links work locally.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, relative } from 'node:path';
import { readSimMeta } from './sim-manifest.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export const SITE = pkg.homepage.replace(/\/?$/, '/'); // https://nahamus.github.io/ScienceAnim/
const SITE_TITLE = 'ScienceAnim · Interactive science, beautifully animated';
const SITE_DESC =
  'Cinematic, interactive simulations of the ideas behind physics, chemistry, biology, astronomy, mathematics and computer science.';
const SITE_IMAGE = 'black-hole'; // its thumbnail stands for the whole site
// rendered by tools/render-thumbs.mjs at this size
const THUMB_W = 560;
const THUMB_H = 350;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The <head> tags describing one page. */
function headTags({ title, desc, url, image }) {
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="ScienceAnim" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="${THUMB_W}" />`,
    `<meta property="og:image:height" content="${THUMB_H}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
}
const HEAD = /<!--head-->[\s\S]*?<!--\/head-->/;
const headBlock = (sim) => `<!--head-->\n    ${headTags(pageFor(sim))}\n    <!--/head-->`;

/** Whole sentences of `text` up to about 200 characters (what previews and search results show). */
function summary(text, max = 200) {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  let out = sentences[0].trim();
  for (const s of sentences.slice(1)) {
    if ((out + ' ' + s.trim()).length > max) break;
    out += ' ' + s.trim();
  }
  return out;
}

const pageFor = (sim) =>
  sim
    ? {
        title: `${sim.title} · ScienceAnim`,
        desc: summary(sim.blurb || sim.tagline || SITE_DESC),
        url: `${SITE}sim/${sim.id}/`,
        image: `${SITE}thumbs/${sim.id}.jpg`,
      }
    : { title: SITE_TITLE, desc: SITE_DESC, url: SITE, image: `${SITE}thumbs/${SITE_IMAGE}.jpg` };

/** Swap the page's <title> and description (or an earlier tag block) for the full set of tags. */
function withHead(html, sim) {
  const out = HEAD.test(html)
    ? html.replace(HEAD, headBlock(sim))
    : html.replace(/<title>[\s\S]*?<\/title>\s*/, '').replace(/<meta name="description"[^>]*>/, headBlock(sim));
  if (out === html) throw new Error('site-pages: index.html needs a <meta name="description"> to replace');
  return out;
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? listFiles(p) : [p];
  });
}

export default function sitePages({ sims: simsRel }) {
  let config;
  let sims = [];
  const loadSims = () => {
    const dir = resolve(config.root, simsRel);
    sims = readdirSync(dir)
      .filter((d) => statSync(join(dir, d)).isDirectory())
      .flatMap((d) => readdirSync(join(dir, d)).filter((f) => f.endsWith('.js')).map((f) => readSimMeta(join(dir, d, f))));
  };

  return {
    name: 'site-pages',
    configResolved(c) {
      config = c;
      loadSims();
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) => {
        const m = ctx.originalUrl?.match(/^\/sim\/([\w-]+)/);
        return withHead(html, m && sims.find((s) => s.id === m[1]));
      },
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url.match(/^\/sim\/([\w-]+)\/?(\?.*)?$/);
        if (!m) return next();
        loadSims();
        if (!sims.some((s) => s.id === m[1])) return next();
        const src = readFileSync(join(config.root, 'index.html'), 'utf8').replace(/(href|src)="\.\//g, '$1="/');
        const html = await server.transformIndexHtml(req.url, src, req.originalUrl);
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
      });
    },
    closeBundle() {
      const out = resolve(config.root, config.build.outDir);
      const index = readFileSync(join(out, 'index.html'), 'utf8');
      for (const sim of sims) {
        mkdirSync(join(out, 'sim', sim.id), { recursive: true });
        writeFileSync(join(out, 'sim', sim.id, 'index.html'), withHead(index, sim));
      }

      const urls = [SITE, ...sims.map((s) => `${SITE}sim/${s.id}/`)];
      writeFileSync(
        join(out, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n') +
          `\n</urlset>\n`,
      );

      // Precache the app shell and all code; thumbnails (rendered after the build) are cached as they load.
      const files = listFiles(out)
        .map((f) => relative(out, f).replace(/\\/g, '/'))
        .filter((f) => /^assets\/.*\.(js|css)$/.test(f) || /^(manifest\.webmanifest|icons\/.*)$/.test(f))
        .sort();
      const template = readFileSync(join(config.root, 'sw.js'), 'utf8');
      const hash = createHash('sha256');
      hash.update(template + index);
      for (const f of files) hash.update(f + readFileSync(join(out, f)));
      const sw = template
        .replace('__VERSION__', hash.digest('hex').slice(0, 12))
        .replace('__PRECACHE__', JSON.stringify(['./', ...files]));
      writeFileSync(join(out, 'sw.js'), sw);
    },
  };
}
