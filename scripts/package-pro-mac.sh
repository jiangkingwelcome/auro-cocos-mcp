#!/usr/bin/env bash
set -euo pipefail

echo "============================================"
echo "  Aura Pro - Full Build (Mac)"
echo "============================================"
echo ""
echo "  This script builds the complete Pro edition:"
echo "    1. TypeScript compilation"
echo "    2. Rust native module (release)"
echo "    3. esbuild release bundle"
echo "    4. JS obfuscation + bytenode"
echo "    5. Assemble + zip"
echo ""

# ── Prerequisites check ──
echo "[0/7] Checking prerequisites..."
command -v rustc >/dev/null 2>&1 || { echo "ERROR: Rust not found. Install from https://rustup.rs/"; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo "ERROR: Cargo not found. Install Rust first."; exit 1; }
echo "  rustc: OK"
echo "  cargo: OK"
echo "  node:  OK"
echo ""

# ── Step 1: TypeScript ──
echo "[1/7] TypeScript compilation..."
npm run build

# ── Step 2: Rust native module ──
echo "[2/7] Rust native module (release)..."
cd native
cargo build --release

ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
  NODE_FILE="cocos_pro.darwin-arm64.node"
else
  NODE_FILE="cocos_pro.darwin-x64.node"
fi
cp target/release/libcocos_mcp_pro.dylib "$NODE_FILE"
cd ..
echo "  Output: native/$NODE_FILE"

# ── Step 3: esbuild release bundle ──
echo "[3/7] esbuild release bundle..."
node scripts/build-release.mjs

# ── Step 4: JS protection ──
echo "[4/7] JS obfuscation + bytenode..."
node scripts/build-protected.mjs

# ── Step 5: Assemble Pro package ──
echo "[5/7] Assemble Pro package..."
rm -rf dist-plugin-pro
mkdir -p dist-plugin-pro/aura-for-cocos/dist/panels/default/i18n
mkdir -p dist-plugin-pro/aura-for-cocos/native

# package.json
cp dist-release/package.json dist-plugin-pro/aura-for-cocos/package.json

# JS bundles (protected)
cp dist-release/main.js  dist-plugin-pro/aura-for-cocos/dist/main.js
cp dist-release/core.js  dist-plugin-pro/aura-for-cocos/dist/core.js
cp dist-release/scene.js dist-plugin-pro/aura-for-cocos/dist/scene.js
for jsc in dist-release/main.jsc dist-release/core.jsc dist-release/scene.jsc; do
  [ -f "$jsc" ] && cp "$jsc" "dist-plugin-pro/aura-for-cocos/dist/$(basename "$jsc")"
done

# Panel
cp dist-release/panels/default/index.js dist-plugin-pro/aura-for-cocos/dist/panels/default/index.js
if [ -d dist-release/panels/default/i18n ]; then
  cp -r dist-release/panels/default/i18n/* dist-plugin-pro/aura-for-cocos/dist/panels/default/i18n/ 2>/dev/null || true
fi

# Rust native binary
cp native/index.js dist-plugin-pro/aura-for-cocos/native/index.js
cp "native/$NODE_FILE" "dist-plugin-pro/aura-for-cocos/native/$NODE_FILE"

# stdio-shim (protected)
if [ -d dist-release/stdio-shim ]; then
  cp -r dist-release/stdio-shim dist-plugin-pro/aura-for-cocos/stdio-shim
else
  cp -r stdio-shim dist-plugin-pro/aura-for-cocos/stdio-shim
fi

# MCP config templates
cp -r mcp-config-templates dist-plugin-pro/aura-for-cocos/mcp-config-templates

# ── Step 6: Copy docs + LICENSE + README + ACTIVATION ──
echo "[6/7] Copy docs, LICENSE, README, ACTIVATION..."
if [ -d docs ]; then
  cp -r docs dist-plugin-pro/aura-for-cocos/docs
fi
[ -f LICENSE ] && cp LICENSE dist-plugin-pro/aura-for-cocos/LICENSE
[ -f README.md ] && cp README.md dist-plugin-pro/aura-for-cocos/README.md
[ -f ACTIVATION.txt ] && cp ACTIVATION.txt dist-plugin-pro/aura-for-cocos/ACTIVATION.txt

# ── Step 7: Zip ──
echo "[7/7] Create zip..."
VERSION=$(node -e "console.log(require('./dist-release/package.json').version || 'unknown')")
(cd dist-plugin-pro && zip -r "aura-for-cocos-v${VERSION}-pro-${ARCH}.zip" aura-for-cocos >/dev/null)

echo ""
echo "============================================"
echo "  Pro Build Complete!"
echo "============================================"
echo ""
echo "  Folder: dist-plugin-pro/aura-for-cocos/"
echo "  Zip:    dist-plugin-pro/aura-for-cocos-v${VERSION}-pro-${ARCH}.zip"
echo ""
echo "  Contents:"
echo "    dist/*.js          JS loaders (protected)"
echo "    dist/*.jsc         V8 bytecode (binary)"
echo "    native/*.node      Rust binary"
echo "    stdio-shim/        stdio bridge (obfuscated)"
echo ""
echo "  To install:"
echo "    1. Copy aura-for-cocos/ to your Cocos project's extensions/"
echo "    2. Create .mcp-license with your license key"
echo "    3. Restart Cocos Creator"
echo "    macOS note: if blocked, run: xattr -cr extensions/aura-for-cocos/"
echo "============================================"
echo ""
