// Vite plugin: everything the site needs beyond the app itself, so links preview well and it works offline.
//
//   sim/<id>/index.html  a copy of the app page whose <head> describes that simulation (title, description,
//                        Open Graph / Twitter card with its 1200×630 preview image). Chat apps and search engines read
//                        these tags without running JavaScript; the app then boots straight into the sim
//                        (see main.js). Share links point here: https://…/ScienceAnim/sim/<id>/?ch=3
//   sitemap.xml          every page, for search engines (submit it in Search Console: a project site's
//                        robots.txt isn't read, as it isn't at the domain root)
//   sw.js                service worker that precaches the app and every simulation's code (see src/sw.js)
//   build-files.json     this build's code files, so the next deploy can keep them for tabs still open
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
export const SITE_IMAGE = 'black-hole'; // its preview image stands for the whole site
// Link preview images: tools/render-thumbs.mjs renders og/<id>.jpg at this size (what Facebook, LinkedIn and
// Slack want for a large card) and switches each page over from the fallback once its image exists.
export const OG_W = 1200;
export const OG_H = 630;
export const ogFallback = () => `${SITE}og/site.png`; // public/og/site.png
export const ogFor = (id) => `${SITE}og/${id}.jpg`;

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
    `<meta property="og:image:width" content="${OG_W}" />`,
    `<meta property="og:image:height" content="${OG_H}" />`,
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
        image: ogFallback(),
      }
    : { title: SITE_TITLE, desc: SITE_DESC, url: SITE, image: ogFallback() };

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

      // This build's own code files. The next deploy copies them forward (tools/keep-previous.mjs), so a tab
      // still running this build can load the simulations it hasn't opened yet.
      const code = files.filter((f) => f.startsWith('assets/'));
      writeFileSync(join(out, 'build-files.json'), JSON.stringify({ files: code }));
    },
  };
}
