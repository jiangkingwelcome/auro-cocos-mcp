@echo off
setlocal enabledelayedexpansion

set "NO_BYTENODE=0"
for %%a in (%*) do (
  if "%%a"=="--no-bytenode" set "NO_BYTENODE=1"
)

echo ============================================
echo   Aura - Release Package (Win)
if "!NO_BYTENODE!"=="1" echo   Mode: obfuscate-only (no bytenode)
if "!NO_BYTENODE!"=="0" echo   Mode: obfuscate + bytenode
echo ============================================
echo.

echo [1/5] Build release bundle ...
call node scripts\build-release.mjs
if !ERRORLEVEL! neq 0 (
  echo ERROR: release build failed
  exit /b 1
)

if "!NO_BYTENODE!"=="1" (
  echo [2/5] Apply protection ^(obfuscate only, bytenode skipped^) ...
  call node scripts\build-protected.mjs --obfuscate-only
) else (
  echo [2/5] Apply protection ^(obfuscate + bytenode^) ...
  call node scripts\build-protected.mjs
)
if !ERRORLEVEL! neq 0 (
  echo ERROR: protected build failed
  exit /b 1
)

echo [3/5] Assemble release package ...
if exist dist-plugin-release rmdir /s /q dist-plugin-release

mkdir dist-plugin-release\aura-for-cocos\dist\panels\default\i18n

copy dist-release\package.json dist-plugin-release\aura-for-cocos\package.json >nul
copy dist-release\main.js dist-plugin-release\aura-for-cocos\dist\main.js >nul
copy dist-release\core.js dist-plugin-release\aura-for-cocos\dist\core.js >nul
copy dist-release\scene.js dist-plugin-release\aura-for-cocos\dist\scene.js >nul
if exist dist-release\main.jsc copy dist-release\main.jsc dist-plugin-release\aura-for-cocos\dist\main.jsc >nul
if exist dist-release\core.jsc copy dist-release\core.jsc dist-plugin-release\aura-for-cocos\dist\core.jsc >nul
if exist dist-release\scene.jsc copy dist-release\scene.jsc dist-plugin-release\aura-for-cocos\dist\scene.jsc >nul
copy dist-release\panels\default\index.js dist-plugin-release\aura-for-cocos\dist\panels\default\index.js >nul
if exist dist-release\panels\default\i18n xcopy dist-release\panels\default\i18n dist-plugin-release\aura-for-cocos\dist\panels\default\i18n /E /I /Q >nul

if exist dist-release\stdio-shim (
  xcopy dist-release\stdio-shim dist-plugin-release\aura-for-cocos\stdio-shim /E /I /Q >nul
) else (
  xcopy stdio-shim dist-plugin-release\aura-for-cocos\stdio-shim /E /I /Q >nul
)
xcopy mcp-config-templates dist-plugin-release\aura-for-cocos\mcp-config-templates /E /I /Q >nul

echo [4/6] Copy docs + LICENSE + README ...
if exist docs xcopy docs dist-plugin-release\aura-for-cocos\docs /E /I /Q >nul
if exist LICENSE copy LICENSE dist-plugin-release\aura-for-cocos\LICENSE >nul
if exist README.md copy README.md dist-plugin-release\aura-for-cocos\README.md >nul

echo [5/6] Create native stub (community) ...
mkdir dist-plugin-release\aura-for-cocos\native 2>nul
if exist native\index.js copy native\index.js dist-plugin-release\aura-for-cocos\native\index.js >nul

echo [6/6] Zip release package ...
for /f "usebackq delims=" %%v in (`node -e "console.log(require('./dist-release/package.json').version||'unknown')"`) do set "VERSION=%%v"

powershell -Command "Compress-Archive -Path 'dist-plugin-release\aura-for-cocos' -DestinationPath 'dist-plugin-release\aura-for-cocos-v!VERSION!-release.zip' -Force"

echo.
echo ============================================
echo   Release package ready!
echo ============================================
echo   Folder: dist-plugin-release\aura-for-cocos\
echo   Zip:    dist-plugin-release\aura-for-cocos-v!VERSION!-release.zip
if "!NO_BYTENODE!"=="1" echo   Note:   bytenode skipped (compatible with older Cocos)
echo ============================================
echo.
