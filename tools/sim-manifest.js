// Vite plugin: builds a tiny manifest of every simulation's gallery metadata at build time,
// so the gallery can show all cards without downloading each simulation's code.
//
//   import MANIFEST from 'virtual:sim-manifest';
//   // [{ file: './physics/projectile.js', id, title, category, tagline, blurb, keywords }, ...]
//
// Fields are read statically from each `export default { ... }`; they must be plain string
// literals (or an array of string literals for `keywords`).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseAst } from 'vite';

const ID = 'virtual:sim-manifest';
const RESOLVED = '\0' + ID;
const FIELDS = ['id', 'title', 'category', 'tagline', 'blurb', 'keywords', 'renderer'];
const REQUIRED = ['id', 'title', 'category'];

function literal(node) {
  if (!node) return undefined;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  if (node.type === 'ArrayExpression') {
    const items = node.elements.map(literal);
    return items.every((v) => typeof v === 'string') ? items : undefined;
  }
  return undefined;
}

export function readSimMeta(file) {
  const ast = parseAst(readFileSync(file, 'utf8'));
  const decl = ast.body.find((n) => n.type === 'ExportDefaultDeclaration');
  if (!decl || decl.declaration.type !== 'ObjectExpression')
    throw new Error(`${file}: expected \`export default { ... }\``);
  const meta = {};
  for (const prop of decl.declaration.properties) {
    const key = prop.type === 'Property' && (prop.key.name ?? prop.key.value);
    if (!FIELDS.includes(key)) continue;
    const v = literal(prop.value);
    if (v === undefined) throw new Error(`${file}: \`${key}\` must be a plain string literal`);
    meta[key] = v;
  }
  for (const k of REQUIRED) if (!meta[k]) throw new Error(`${file}: missing \`${k}\``);
  return meta;
}

export default function simManifest({ dir }) {
  let simsDir;
  const files = () =>
    readdirSync(simsDir)
      .filter((d) => statSync(join(simsDir, d)).isDirectory())
      .flatMap((d) => readdirSync(join(simsDir, d)).filter((f) => f.endsWith('.js')).map((f) => join(simsDir, d, f)));

  return {
    name: 'sim-manifest',
    configResolved(config) {
      simsDir = resolve(config.root, dir);
    },
    resolveId(id) {
      if (id === ID) return RESOLVED;
    },
    load(id) {
      if (id !== RESOLVED) return;
      const list = files().map((f) => {
        this.addWatchFile(f);
        return { file: './' + relative(simsDir, f).replace(/\\/g, '/'), ...readSimMeta(f) };
      });
      return `export default ${JSON.stringify(list)};`;
    },
    handleHotUpdate({ file, server }) {
      if (!resolve(file).startsWith(simsDir)) return;
      const mod = server.moduleGraph.getModuleById(RESOLVED);
      if (mod) server.moduleGraph.invalidateModule(mod);
    },
  };
}
