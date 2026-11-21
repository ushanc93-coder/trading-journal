$code = @"
using System;
using System.Runtime.InteropServices;

public class Win32Min {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
Add-Type -TypeDefinition $code

$pidFile = "$env:TEMP\forex_clock_widget.pid"
if (Test-Path $pidFile) {
    $procId = Get-Content $pidFile
    $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($p -and $p.MainWindowHandle -ne [IntPtr]::Zero) {
        # SW_MINIMIZE = 6
        [Win32Min]::ShowWindow($p.MainWindowHandle, 6)
        Write-Output "Successfully minimized PID: $procId"
    } else {
        Write-Output "Process handle not found"
    }
} else {
    Write-Output "No PID file found"
}
