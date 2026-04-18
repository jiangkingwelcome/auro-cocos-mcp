#!/usr/bin/env node
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'panels', 'default', 'index.ts');
const OUT = path.join(ROOT, 'dist', 'panels', 'default', 'index.js');
const MANIFEST = path.join(ROOT, 'dist', 'panels', 'default', '.panel-manifest.json');

fs.mkdirSync(path.dirname(OUT), { recursive: true });

const result = await build({
  entryPoints: [SRC],
  outfile: OUT,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'es2020',
  minify: false,
  sourcemap: false,
  legalComments: 'none',
  charset: 'utf8',
  external: ['cc'],
  logLevel: 'info',
});

const hash = result.metafile ? Object.keys(result.metafile.outputs).join('|') : String(Date.now());
fs.writeFileSync(MANIFEST, JSON.stringify({
  hash,
  mtime: Date.now(),
  entry: 'panels/default/index.ts',
}, null, 2));

console.log('[build-panel] bundled panel with vue runtime');
