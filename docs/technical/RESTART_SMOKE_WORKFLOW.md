# Restart And Smoke Workflow

This repository now includes a local restart workflow for Cocos Creator so Codex can repeat the same cycle during bug fixing:

1. close Cocos Creator
2. reopen the target project
3. wait for the Aura bridge to recover
4. run a lightweight smoke check

## Scripts

### 1. Restart wrapper

File:

`scripts/restart-cocos-and-smoke-test.ps1`

Purpose:

- stop existing `CocosCreator.exe` processes
- start Creator again
- wait for `http://127.0.0.1:7779` (or a custom bridge URL)
- optionally run a smoke preset

### 2. Smoke runner

File:

`scripts/smoke-bridge.mjs`

Presets:

- `bridge`
- `scene-basic`
- `material-node`
- `animation-node`

## Usage

### Attach to an already opened Creator

Use this when Creator must be started manually, or when direct `CocosCreator.exe` launch shows a modal prompt instead of opening the project.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restart-cocos-and-smoke-test.ps1 `
  -AttachOnly `
  -SceneUrl "db://assets/scenes/New Scene-001.scene" `
  -SmokePreset scene-basic
```

### Bridge only

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restart-cocos-and-smoke-test.ps1 `
  -CreatorPath "D:\cocoscreator\Creator\3.8.8\CocosCreator.exe" `
  -ProjectPath "E:\gitproject\cocos\mcpsheqvbantest" `
  -SmokePreset bridge
```

### Scene smoke

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restart-cocos-and-smoke-test.ps1 `
  -CreatorPath "D:\cocoscreator\Creator\3.8.8\CocosCreator.exe" `
  -ProjectPath "E:\gitproject\cocos\mcpsheqvbantest" `
  -SmokePreset scene-basic
```

### Material node smoke

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restart-cocos-and-smoke-test.ps1 `
  -CreatorPath "D:\cocoscreator\Creator\3.8.8\CocosCreator.exe" `
  -ProjectPath "E:\gitproject\cocos\mcpsheqvbantest" `
  -SceneUrl "db://assets/scenes/New Scene-001.scene" `
  -SmokePreset material-node `
  -SmokeNodeName "AuraMaterialNode"
```

### Animation node smoke

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restart-cocos-and-smoke-test.ps1 `
  -CreatorPath "D:\cocoscreator\Creator\3.8.8\CocosCreator.exe" `
  -ProjectPath "E:\gitproject\cocos\mcpsheqvbantest" `
  -SceneUrl "db://assets/scenes/New Scene-001.scene" `
  -SmokePreset animation-node `
  -SmokeNodeName "AuraAnimTest"
```

## Environment Variables

You can avoid passing paths every time:

```powershell
$env:AURA_COCOS_CREATOR_PATH = "D:\cocoscreator\Creator\3.8.8\CocosCreator.exe"
$env:AURA_COCOS_PROJECT_PATH = "E:\gitproject\cocos\mcpsheqvbantest"
```

Then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restart-cocos-and-smoke-test.ps1 -SmokePreset bridge
```

## Notes

- The default project argument is `--path`. If your local Creator build needs a different launch argument, pass `-ProjectArgName`.
- If Creator starts without reopening a scene, pass `-SceneUrl` so the smoke runner can open the target scene automatically.
- If direct `CocosCreator.exe` launch opens a dashboard recommendation dialog, use `-AttachOnly` and start Creator manually first.
- The script does not automate modal dialogs. If Creator is blocked by a save dialog or a crash popup, the bridge wait step will time out.
- This workflow is meant for repeatable development verification, not full regression testing.
