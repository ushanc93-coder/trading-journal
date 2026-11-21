Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Drawing

$csharp = @"
using System;
using System.Runtime.InteropServices;

public class NativeGlassTest {
    [StructLayout(LayoutKind.Sequential)]
    public struct AccentPolicy {
        public int AccentState;
        public int AccentFlags;
        public int GradientColor;
        public int AnimationId;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct WindowCompositionAttributeData {
        public int Attribute;
        public IntPtr Data;
        public int SizeOfData;
    }

    [DllImport("user32.dll")]
    public static extern int SetWindowCompositionAttribute(IntPtr hwnd, ref WindowCompositionAttributeData data);

    [DllImport("dwmapi.dll")]
    public static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateRoundRectRgn(int x1, int y1, int x2, int y2, int cx, int cy);

    [DllImport("user32.dll")]
    public static extern int SetWindowRgn(IntPtr hWnd, IntPtr hRgn, bool bRedraw);

    public static void EnableGlass(IntPtr hwnd) {
        try {
            AccentPolicy accent = new AccentPolicy();
            accent.AccentState = 3; // ACCENT_ENABLE_BLURBEHIND
            accent.AccentFlags = 2;
            accent.GradientColor = 0;

            int size = Marshal.SizeOf(accent);
            IntPtr pAccent = Marshal.AllocHGlobal(size);
            Marshal.StructureToPtr(accent, pAccent, false);

            WindowCompositionAttributeData data = new WindowCompositionAttributeData();
            data.Attribute = 19;
            data.SizeOfData = size;
            data.Data = pAccent;

            SetWindowCompositionAttribute(hwnd, ref data);
            Marshal.FreeHGlobal(pAccent);
        } catch {}

        try {
            int round = 2; // DWMWCP_ROUND
            DwmSetWindowAttribute(hwnd, 33, ref round, sizeof(int));
        } catch {}
    }

    public static void SetClipRegion(IntPtr hwnd, int width, int height, int radius) {
        try {
            IntPtr rgn = CreateRoundRectRgn(0, 0, width + 1, height + 1, radius * 2, radius * 2);
            SetWindowRgn(hwnd, rgn, true);
        } catch {}
    }
}
"@

Add-Type -TypeDefinition $csharp -ErrorAction SilentlyContinue

$winW = 405
$winH = 202

$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Glass Test"
        Width="$winW" Height="$winH"
        WindowStyle="None"
        AllowsTransparency="True"
        Background="Transparent"
        Topmost="True"
        ResizeMode="NoResize"
        WindowStartupLocation="CenterScreen">
    <Border Name="MainCard" CornerRadius="16" Background="#C00D1220" BorderBrush="#45FFFFFF" BorderThickness="1.2">
        <Grid Margin="12">
            <TextBlock Text="Apple Crystal Frosted Glass Test" Foreground="White" FontSize="14" FontWeight="Bold"/>
        </Grid>
    </Border>
</Window>
"@

$reader = [System.Xml.XmlReader]::Create([System.IO.StringReader]::new($xaml))
$win = [System.Windows.Markup.XamlReader]::Load($reader)

$win.Add_SourceInitialized({
    $helper = New-Object System.Windows.Interop.WindowInteropHelper($win)
    $hwnd = $helper.Handle
    [NativeGlassTest]::EnableGlass($hwnd)
    [NativeGlassTest]::SetClipRegion($hwnd, [int]$win.Width, [int]$win.Height, 16)
})

$win.Show()

Start-Sleep -Milliseconds 600

# Capture screenshot of the window
$bounds = [System.Drawing.Rectangle]::new([int]$win.Left, [int]$win.Top, [int]$win.Width, [int]$win.Height)
$bmp = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)

$savePath = "C:\Users\Lenovo\.gemini\antigravity\brain\e073d811-d201-46b6-8c13-0e3c38af5cc3\crystal_test.png"
$bmp.Save($savePath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$win.Close()

Write-Output "Screenshot saved to $savePath"
