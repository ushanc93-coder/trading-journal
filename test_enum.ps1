Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class WinHelper {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public static void PrintMatching(string pattern) {
        EnumWindows((hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(256);
            GetWindowText(hWnd, sb, 256);
            string title = sb.ToString();
            if (!string.IsNullOrEmpty(title) && title.ToLower().Contains(pattern.ToLower())) {
                Console.WriteLine("HWND: " + hWnd + " | Title: " + title);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@
[WinHelper]::PrintMatching("Trading")
[WinHelper]::PrintMatching("Clock")
[WinHelper]::PrintMatching("3000")
