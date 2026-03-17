@echo off
setlocal

echo [1/3] Build TypeScript...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo ERROR: build failed
  exit /b 1
)

echo [2/3] Assemble plugin package...
if exist dist-plugin rmdir /s /q dist-plugin
mkdir dist-plugin\aura-for-cocos
copy package.json dist-plugin\aura-for-cocos\package.json >nul
xcopy dist dist-plugin\aura-for-cocos\dist /E /I /Q >nul
xcopy stdio-shim dist-plugin\aura-for-cocos\stdio-shim /E /I /Q >nul
xcopy mcp-config-templates dist-plugin\aura-for-cocos\mcp-config-templates /E /I /Q >nul
if exist node_modules\zod xcopy node_modules\zod dist-plugin\aura-for-cocos\node_modules\zod /E /I /Q >nul

echo [3/3] Zip package...
powershell -Command "Compress-Archive -Path 'dist-plugin\aura-for-cocos' -DestinationPath 'dist-plugin\aura-for-cocos.zip' -Force"

echo Package ready:
echo   dist-plugin\aura-for-cocos\
echo   dist-plugin\aura-for-cocos.zip
