$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) {
    $edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
$tempProfile = "$env:TEMP\ForexClockProfile"
$url = "http://localhost:3000/clock"

$proc = Start-Process -FilePath $edge -ArgumentList "--app=$url --user-data-dir=`"$tempProfile`" --window-size=510,250 --no-first-run --no-default-browser-check" -PassThru
Start-Sleep -Milliseconds 1500

$handles = (Get-Process | Where-Object { $_.ProcessName -like "*edge*" -or $_.ProcessName -like "*chrome*" }) | Where-Object { $_.MainWindowTitle -like "*Forex*" -or $_.MainWindowTitle -like "*StandBy*" -or $_.MainWindowTitle -like "*UC*" }
Write-Output "Found Windows:"
$handles | Select-Object Id, ProcessName, MainWindowTitle, MainWindowHandle
