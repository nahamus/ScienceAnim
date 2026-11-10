// Deploy step: copy the currently published build's code files into dist/ before dist/ replaces it.
//   node tools/keep-previous.mjs        (after `npm run build`, before publishing; needs git and network)
//
// Each simulation's code is a chunk with a content hash in its name, loaded the first time it's opened. A tab
// opened before a deploy still asks for the old names; without them it shows "Couldn't load". Keeping the
// previous build's files (only those: its build-files.json lists them) means one deploy of overlap, so the
// published site never grows beyond two builds' worth of code.
//
// It never fails the deploy: with no published site, no list, or no network it just says so and stops.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BRANCH = 'gh-pages';
const OUT = 'dist';
const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

try {
  if (!existsSync(join(OUT, 'index.html'))) throw new Error('no build in dist/ (run `npm run build` first)');
  git('fetch', '--quiet', '--depth=1', 'origin', `+${BRANCH}:refs/remotes/origin/${BRANCH}`); // + : always take what is published
  const ref = `origin/${BRANCH}`;
  let files;
  try {
    files = JSON.parse(git('show', `${ref}:build-files.json`).toString()).files;
  } catch {
    // published before build-files.json existed: that build's code is whatever is in assets/
    files = git('ls-tree', '-r', '--name-only', ref, 'assets/')
      .toString()
      .split('\n')
      .filter((f) => /\.(js|css)$/.test(f));
  }
  let kept = 0;
  for (const f of files) {
    if (!/^assets\/[\w.-]+\.(js|css)$/.test(f)) continue; // only plain code files, never paths outside assets/
    const dest = join(OUT, f);
    if (existsSync(dest)) continue; // unchanged between builds: same content, same name
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, git('show', `${ref}:${f}`));
    kept++;
  }
  console.log(`Kept ${kept} code files from the previous deploy (of ${files.length} it had).`);
} catch (err) {
  console.warn(`Not keeping the previous deploy's code: ${err.message.split('\n')[0]}`);
}
