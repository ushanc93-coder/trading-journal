# Forex & ICT Frameless Always-On-Top Desktop Clock Launcher
# Launches the Native WPF StandBy Widget (Zero title bar, 100% rounded corners, fixed scale)
$ErrorActionPreference = "SilentlyContinue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$widgetScript = Join-Path $scriptDir "Forex-ICT-Native-Widget.ps1"
Start-Process powershell -ArgumentList "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$widgetScript`""
