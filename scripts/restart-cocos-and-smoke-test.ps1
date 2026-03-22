param(
    [string]$CreatorPath = $env:AURA_COCOS_CREATOR_PATH,
    [string]$ProjectPath = $env:AURA_COCOS_PROJECT_PATH,
    [string]$BridgeUrl = $(if ($env:BRIDGE_URL) { $env:BRIDGE_URL } else { 'http://127.0.0.1:7779' }),
    [string]$ProjectArgName = '--path',
    [ValidateSet('bridge', 'scene-basic', 'material-node', 'animation-node')]
    [string]$SmokePreset = 'bridge',
    [string]$SmokeNodeName = '',
    [string]$SceneUrl = '',
    [int]$CloseTimeoutSec = 20,
    [int]$BridgeTimeoutSec = 180,
    [switch]$AttachOnly,
    [switch]$SkipSmoke
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "[restart-smoke] $Message"
}

function Test-BridgeReady([string]$Url) {
    try {
        $status = Invoke-RestMethod -Uri "$Url/api/status" -Method Get -TimeoutSec 5
        $conn = Invoke-RestMethod -Uri "$Url/api/mcp/connection-info" -Method Get -TimeoutSec 5
        return ($null -ne $status) -and ($null -ne $conn) -and [bool]$conn.endpoint
    } catch {
        return $false
    }
}

function Wait-ForBridge([string]$Url, [int]$TimeoutSec) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-BridgeReady -Url $Url) {
            return $true
        }
        Start-Sleep -Seconds 2
    }
    return $false
}

# Click the "Open Project" button in the Creator startup recommendation dialog.
# Matches by Win32 dialog class (#32770) to avoid Chinese title encoding issues.
# Button layout: [Open Dashboard(0)] [New Empty(1)] [Open Project(2)] [Quit(3)]
function Dismiss-CreatorStartupDialog([int]$TimeoutSec = 60) {
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $root = [System.Windows.Automation.AutomationElement]::RootElement
        $allCond = [System.Windows.Automation.Condition]::TrueCondition
        $wins = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $allCond)

        foreach ($w in $wins) {
            if ($w.Current.ClassName -ne '#32770') { continue }

            $btnCond = New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
                [System.Windows.Automation.ControlType]::Button
            )
            $buttons = $w.FindAll([System.Windows.Automation.TreeScope]::Descendants, $btnCond)

            # Try AutomationId first, fall back to index 2 (Open Project)
            $target = $null
            foreach ($b in $buttons) {
                $aid = $b.Current.AutomationId
                if ($aid -eq '2' -or $aid -eq 'btn_open_project') {
                    $target = $b
                    break
                }
            }
            if ((-not $target) -and ($buttons.Count -ge 3)) {
                $target = $buttons[2]
            }

            if ($target) {
                try {
                    $invoke = $target.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
                    $invoke.Invoke()
                    Write-Step "dismissed startup dialog: clicked button[$($target.Current.AutomationId)] [$($target.Current.Name)]"
                    return $true
                } catch {
                    Write-Step "failed to invoke button: $_"
                }
            }
        }
        Start-Sleep -Milliseconds 500
    }
    Write-Step 'startup dialog not detected within timeout, continuing'
    return $false
}

function Stop-CreatorProcesses([int]$TimeoutSec) {
    $procs = @(Get-Process -Name 'CocosCreator' -ErrorAction SilentlyContinue)
    if ($procs.Count -eq 0) {
        return
    }

    Write-Step "closing existing Cocos Creator processes ($($procs.Count))"

    # Force-kill the entire process tree to avoid leftover node children holding project locks
    try {
        taskkill.exe /F /T /IM CocosCreator.exe 2>&1 | Out-Null
    } catch {
    }

    $procs | Stop-Process -Force -ErrorAction SilentlyContinue

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $alive = @(Get-Process -Name 'CocosCreator' -ErrorAction SilentlyContinue)
        if ($alive.Count -eq 0) {
            return
        }
        Start-Sleep -Milliseconds 500
    }

    $alive = @(Get-Process -Name 'CocosCreator' -ErrorAction SilentlyContinue)
    if ($alive.Count -gt 0) {
        Write-Step "forcing remaining Creator processes to stop"
        $alive | Stop-Process -Force
    }
}

if (-not $AttachOnly -and -not $CreatorPath) {
    throw 'CreatorPath is required. Pass -CreatorPath or set AURA_COCOS_CREATOR_PATH.'
}

if (-not $AttachOnly -and -not (Test-Path -LiteralPath $CreatorPath)) {
    throw "Creator executable not found: $CreatorPath"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$smokeScript = Join-Path $repoRoot 'scripts\smoke-bridge.mjs'
if (-not (Test-Path -LiteralPath $smokeScript)) {
    throw "Smoke script not found: $smokeScript"
}

if (-not $AttachOnly) {
    Stop-CreatorProcesses -TimeoutSec $CloseTimeoutSec

    $argStr = if ($ProjectPath) { "$ProjectArgName `"$ProjectPath`"" } else { '' }

    Write-Step "starting Cocos Creator: $CreatorPath $argStr"
    $null = Start-Process -FilePath $CreatorPath -ArgumentList $argStr -WorkingDirectory (Split-Path -Parent $CreatorPath) -PassThru

    # Auto-dismiss the startup recommendation dialog if it appears
    Dismiss-CreatorStartupDialog -TimeoutSec 60 | Out-Null
} else {
    Write-Step 'attach-only mode: skipping Creator restart'
}

Write-Step "waiting for Aura bridge at $BridgeUrl"
if (-not (Wait-ForBridge -Url $BridgeUrl -TimeoutSec $BridgeTimeoutSec)) {
    throw "Bridge did not become ready within ${BridgeTimeoutSec}s: $BridgeUrl"
}

Write-Step 'bridge is ready'

if (-not $SkipSmoke) {
    $nodeCmd = Get-Command node -ErrorAction Stop
    $smokeArgs = @($smokeScript, '--bridge-url', $BridgeUrl, '--preset', $SmokePreset)
    if ($SmokeNodeName) {
        $smokeArgs += @('--node-name', $SmokeNodeName)
    }
    if ($SceneUrl) {
        $smokeArgs += @('--scene-url', $SceneUrl)
    }

    Write-Step "running smoke preset: $SmokePreset"
    & $nodeCmd.Source $smokeArgs
    if ($LASTEXITCODE -ne 0) {
        throw "smoke preset failed: $SmokePreset"
    }
}

Write-Step 'restart + smoke flow completed'
