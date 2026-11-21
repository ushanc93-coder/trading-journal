$code = @"
using System;
using System.Runtime.InteropServices;

public class Win32Helper {
    [DllImport("user32.dll", EntryPoint = "GetWindowLong")]
    public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", EntryPoint = "SetWindowLong")]
    public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    public const int GWL_STYLE = -16;
    public const int WS_CAPTION = 0x00C00000;
    public const int WS_THICKFRAME = 0x00040000;
    public const int WS_MAXIMIZEBOX = 0x00010000;
    public const uint SWP_FRAMECHANGED = 0x0020;
    public const uint SWP_SHOWWINDOW = 0x0040;
}
"@
Add-Type -TypeDefinition $code

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$tempProfile = "$env:TEMP\ForexClockChromeProfile"
$url = "http://localhost:3000/clock"

# Screen dimensions for placing at bottom-right
Add-Type -AssemblyName System.Windows.Forms
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$w = 515
$h = 245
$x = $screen.Right - $w - 20
$y = $screen.Bottom - $h - 20

$proc = Start-Process -FilePath $chrome -ArgumentList "--app=$url --user-data-dir=`"$tempProfile`" --window-size=$w,$h --window-position=$x,$y --no-first-run --no-default-browser-check" -PassThru

# Wait for window handle
$hWnd = [IntPtr]::Zero
for ($i = 0; $i -lt 25; $i++) {
    Start-Sleep -Milliseconds 200
    if ($proc.MainWindowHandle -ne [IntPtr]::Zero) {
        $hWnd = $proc.MainWindowHandle
        break
    }
    $proc.Refresh()
}

if ($hWnd -ne [IntPtr]::Zero) {
    # Strip Titlebar & Resize Frame
    $style = [Win32Helper]::GetWindowLong($hWnd, [Win32Helper]::GWL_STYLE)
    $newStyle = $style -band (-bnot [Win32Helper]::WS_CAPTION) -band (-bnot [Win32Helper]::WS_THICKFRAME) -band (-bnot [Win32Helper]::WS_MAXIMIZEBOX)
    [Win32Helper]::SetWindowLong($hWnd, [Win32Helper]::GWL_STYLE, $newStyle)

    # HWND_TOPMOST = -1, Set position & fixed size at bottom right
    [Win32Helper]::SetWindowPos($hWnd, [IntPtr](-1), $x, $y, $w, $h, 0x0020 -bor 0x0040)
    Write-Output "SUCCESS: Stripped caption and framed at bottom-right ($x, $y, $w, $h)"
} else {
    Write-Output "Could not find window handle"
}
