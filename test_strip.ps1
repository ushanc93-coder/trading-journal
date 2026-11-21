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

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    public const int GWL_STYLE = -16;
    public const int WS_CAPTION = 0x00C00000;
    public const int WS_THICKFRAME = 0x00040000;
    public const int WS_MAXIMIZEBOX = 0x00010000;
    public const int WS_MINIMIZEBOX = 0x00020000;
    public const int WS_SYSMENU = 0x00080000;

    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_FRAMECHANGED = 0x0020;
    public const uint SWP_SHOWWINDOW = 0x0040;
}
"@
Add-Type -TypeDefinition $code

$p = Get-Process -Name chrome | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if ($p) {
    $hWnd = $p.MainWindowHandle
    $style = [Win32Helper]::GetWindowLong($hWnd, [Win32Helper]::GWL_STYLE)
    $newStyle = $style -band (-bnot [Win32Helper]::WS_CAPTION) -band (-bnot [Win32Helper]::WS_THICKFRAME) -band (-bnot [Win32Helper]::WS_MAXIMIZEBOX)
    [Win32Helper]::SetWindowLong($hWnd, [Win32Helper]::GWL_STYLE, $newStyle)
    # HWND_TOPMOST = -1, fixed width 510, height 250
    [Win32Helper]::SetWindowPos($hWnd, [IntPtr](-1), 0, 0, 510, 250, 0x0002 -bor 0x0020 -bor 0x0040)
    Write-Output "Successfully stripped caption & frame from hWnd: $hWnd"
} else {
    Write-Output "No Chrome window found"
}
