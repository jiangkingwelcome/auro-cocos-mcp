import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src', 'panels', 'default', 'i18n');
const dstDir = path.join(root, 'dist', 'panels', 'default', 'i18n');

async function main() {
  await fs.mkdir(dstDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.js')) continue;

    const srcFile = path.join(srcDir, entry.name);
    const dstFile = path.join(dstDir, entry.name);
    await fs.copyFile(srcFile, dstFile);
  }

  console.log('[copy-panel-i18n] copied i18n files to dist');
}

main().catch((err) => {
  console.error('[copy-panel-i18n] failed:', err);
  process.exitCode = 1;
});
