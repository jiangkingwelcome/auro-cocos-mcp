@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Aura Pro - Full Build (Win)
echo ============================================
echo.

:: ── Prerequisites check ──
echo [0/7] Checking prerequisites...
where rustc >nul 2>&1
if !ERRORLEVEL! neq 0 (
  echo ERROR: Rust toolchain not found.
  echo   Install from: https://rustup.rs/
  exit /b 1
)
where cargo >nul 2>&1
if !ERRORLEVEL! neq 0 (
  echo ERROR: Cargo not found.
  exit /b 1
)
echo   rustc: OK
echo   cargo: OK
echo.

:: ── Step 1: TypeScript ──
echo [1/7] TypeScript compilation...
call npm run build
if !ERRORLEVEL! neq 0 (
  echo ERROR: TypeScript build failed
  exit /b 1
)

:: ── Step 2: Rust native module ──
echo [2/7] Rust native module (release)...
pushd native
cargo build --release
if !ERRORLEVEL! neq 0 (
  echo ERROR: Rust build failed
  popd
  exit /b 1
)
copy target\release\cocos_mcp_pro.dll cocos_pro.win32-x64-msvc.node >nul
popd

:: ── Step 3: esbuild release bundle ──
echo [3/7] esbuild release bundle...
call node scripts\build-release.mjs
if !ERRORLEVEL! neq 0 (
  echo ERROR: Release build failed
  exit /b 1
)

:: ── Step 4: JS protection ──
echo [4/7] JS obfuscation + bytenode...
call node scripts\build-protected.mjs
if !ERRORLEVEL! neq 0 (
  echo ERROR: Protection build failed
  exit /b 1
)

:: ── Step 5: Assemble Pro package ──
echo [5/7] Assemble Pro package...
if exist dist-plugin-pro rmdir /s /q dist-plugin-pro

mkdir dist-plugin-pro\aura-for-cocos\dist\panels\default\i18n
mkdir dist-plugin-pro\aura-for-cocos\native

copy dist-release\package.json dist-plugin-pro\aura-for-cocos\package.json >nul

copy dist-release\main.js dist-plugin-pro\aura-for-cocos\dist\main.js >nul
copy dist-release\core.js dist-plugin-pro\aura-for-cocos\dist\core.js >nul
copy dist-release\scene.js dist-plugin-pro\aura-for-cocos\dist\scene.js >nul
if exist dist-release\main.jsc copy dist-release\main.jsc dist-plugin-pro\aura-for-cocos\dist\main.jsc >nul
if exist dist-release\core.jsc copy dist-release\core.jsc dist-plugin-pro\aura-for-cocos\dist\core.jsc >nul
if exist dist-release\scene.jsc copy dist-release\scene.jsc dist-plugin-pro\aura-for-cocos\dist\scene.jsc >nul

copy dist-release\panels\default\index.js dist-plugin-pro\aura-for-cocos\dist\panels\default\index.js >nul
if exist dist-release\panels\default\i18n xcopy dist-release\panels\default\i18n dist-plugin-pro\aura-for-cocos\dist\panels\default\i18n /E /I /Q >nul

copy native\index.js dist-plugin-pro\aura-for-cocos\native\index.js >nul
copy native\cocos_pro.win32-x64-msvc.node dist-plugin-pro\aura-for-cocos\native\cocos_pro.win32-x64-msvc.node >nul

if exist dist-release\stdio-shim (
  xcopy dist-release\stdio-shim dist-plugin-pro\aura-for-cocos\stdio-shim /E /I /Q >nul
) else (
  xcopy stdio-shim dist-plugin-pro\aura-for-cocos\stdio-shim /E /I /Q >nul
)

xcopy mcp-config-templates dist-plugin-pro\aura-for-cocos\mcp-config-templates /E /I /Q >nul

:: ── Step 6: Copy docs + LICENSE + README + ACTIVATION ──
echo [6/7] Copy docs, LICENSE, README, ACTIVATION...
if exist docs xcopy docs dist-plugin-pro\aura-for-cocos\docs /E /I /Q >nul
if exist LICENSE copy LICENSE dist-plugin-pro\aura-for-cocos\LICENSE >nul
if exist README.md copy README.md dist-plugin-pro\aura-for-cocos\README.md >nul
if exist ACTIVATION.txt copy ACTIVATION.txt dist-plugin-pro\aura-for-cocos\ACTIVATION.txt >nul

:: ── Step 7: Zip ──
echo [7/7] Create zip...
for /f "usebackq delims=" %%v in (`node -e "console.log(require('./dist-release/package.json').version||'unknown')"`) do set VERSION=%%v

powershell -Command "Compress-Archive -Path 'dist-plugin-pro\aura-for-cocos' -DestinationPath 'dist-plugin-pro\aura-for-cocos-v!VERSION!-pro-win64.zip' -Force"

echo.
echo ============================================
echo   Pro Build Complete
echo ============================================
echo   Folder: dist-plugin-pro\aura-for-cocos\
echo   Zip:    dist-plugin-pro\aura-for-cocos-v!VERSION!-pro-win64.zip
echo ============================================
echo.
