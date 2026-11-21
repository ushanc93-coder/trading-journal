$wsh = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Forex Clock Widget.lnk"
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "C:\Users\Lenovo\.gemini\antigravity\scratch\trading-journal\Launch-Frameless-Clock.bat"
$shortcut.WorkingDirectory = "C:\Users\Lenovo\.gemini\antigravity\scratch\trading-journal"
$shortcut.Description = "Forex & ICT Frameless Desktop Clock"
$shortcut.Save()
Write-Host "Created shortcut at $shortcutPath"
