#!/usr/bin/env bash
set -euo pipefail

echo "[1/3] Build TypeScript..."
npm run build

echo "[2/3] Assemble plugin package..."
rm -rf dist-plugin
mkdir -p dist-plugin/aura-for-cocos
cp package.json dist-plugin/aura-for-cocos/package.json
cp -r dist dist-plugin/aura-for-cocos/dist
cp -r stdio-shim dist-plugin/aura-for-cocos/stdio-shim
cp -r mcp-config-templates dist-plugin/aura-for-cocos/mcp-config-templates
if [ -d node_modules/zod ]; then
  mkdir -p dist-plugin/aura-for-cocos/node_modules
  cp -r node_modules/zod dist-plugin/aura-for-cocos/node_modules/zod
fi

echo "[3/3] Zip package..."
(cd dist-plugin && zip -r aura-for-cocos.zip aura-for-cocos >/dev/null)

echo "Package ready:"
echo "  dist-plugin/aura-for-cocos/"
echo "  dist-plugin/aura-for-cocos.zip"
