$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$tempProfile = "$env:TEMP\ForexClockChromeProfile"
$url = "http://localhost:3000/clock"

$proc = Start-Process -FilePath $chrome -ArgumentList "--app=$url --user-data-dir=`"$tempProfile`" --window-size=510,250 --no-first-run --no-default-browser-check" -PassThru
Start-Sleep -Milliseconds 2000

Write-Output "PID: $($proc.Id), Handle: $($proc.MainWindowHandle)"
$all = Get-Process -Name chrome | Where-Object { $_.MainWindowHandle -ne 0 }
$all | Select-Object Id, MainWindowTitle, MainWindowHandle
