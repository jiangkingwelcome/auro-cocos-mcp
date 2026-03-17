#!/usr/bin/env bash
set -euo pipefail

NO_BYTENODE=0
for arg in "$@"; do
  if [ "$arg" = "--no-bytenode" ]; then
    NO_BYTENODE=1
  fi
done

echo "============================================"
echo "  Aura - Release Package (Mac)"
if [ "$NO_BYTENODE" = "1" ]; then
  echo "  Mode: obfuscate-only (no bytenode)"
else
  echo "  Mode: obfuscate + bytenode"
fi
echo "============================================"

echo ""
echo "[1/5] Build release bundle ..."
node scripts/build-release.mjs

if [ "$NO_BYTENODE" = "1" ]; then
  echo "[2/5] Apply protection (obfuscate only, bytenode skipped) ..."
  node scripts/build-protected.mjs --obfuscate-only
else
  echo "[2/5] Apply protection (obfuscate + bytenode) ..."
  node scripts/build-protected.mjs
fi

echo "[3/5] Assemble release package ..."
rm -rf dist-plugin-release
mkdir -p dist-plugin-release/aura-for-cocos/dist/panels/default/i18n

cp dist-release/package.json dist-plugin-release/aura-for-cocos/package.json

cp dist-release/main.js  dist-plugin-release/aura-for-cocos/dist/main.js
cp dist-release/core.js  dist-plugin-release/aura-for-cocos/dist/core.js
cp dist-release/scene.js dist-plugin-release/aura-for-cocos/dist/scene.js
for jsc in dist-release/main.jsc dist-release/core.jsc dist-release/scene.jsc; do
  [ -f "$jsc" ] && cp "$jsc" "dist-plugin-release/aura-for-cocos/dist/$(basename "$jsc")"
done

cp dist-release/panels/default/index.js dist-plugin-release/aura-for-cocos/dist/panels/default/index.js
if [ -d dist-release/panels/default/i18n ]; then
  cp -r dist-release/panels/default/i18n/* dist-plugin-release/aura-for-cocos/dist/panels/default/i18n/ 2>/dev/null || true
fi

if [ -d dist-release/stdio-shim ]; then
  cp -r dist-release/stdio-shim dist-plugin-release/aura-for-cocos/stdio-shim
else
  cp -r stdio-shim dist-plugin-release/aura-for-cocos/stdio-shim
fi

cp -r mcp-config-templates dist-plugin-release/aura-for-cocos/mcp-config-templates

echo "[4/6] Copy docs + LICENSE + README ..."
if [ -d docs ]; then
  cp -r docs dist-plugin-release/aura-for-cocos/docs
fi
[ -f LICENSE ] && cp LICENSE dist-plugin-release/aura-for-cocos/LICENSE
[ -f README.md ] && cp README.md dist-plugin-release/aura-for-cocos/README.md

echo "[5/6] Create native stub (community) ..."
mkdir -p dist-plugin-release/aura-for-cocos/native
[ -f native/index.js ] && cp native/index.js dist-plugin-release/aura-for-cocos/native/index.js

echo "[6/6] Zip release package ..."
VERSION=$(node -e "console.log(require('./dist-release/package.json').version || 'unknown')")
(cd dist-plugin-release && zip -r "aura-for-cocos-v${VERSION}-release.zip" aura-for-cocos >/dev/null)

echo ""
echo "============================================"
echo "  Release package ready!"
echo "============================================"
echo "  Folder: dist-plugin-release/aura-for-cocos/"
echo "  Zip:    dist-plugin-release/aura-for-cocos-v${VERSION}-release.zip"
if [ "$NO_BYTENODE" = "1" ]; then
  echo "  Note:   bytenode skipped (compatible with older Cocos)"
fi
echo "============================================"
echo ""
