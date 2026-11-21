import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const action = searchParams.get("action") || body.action || "minimize";

    if (action === "minimize") {
      const psCmd = `
        Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class WMin { [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); }' -ErrorAction SilentlyContinue
        $pidFile = "$env:TEMP\\forex_clock_widget.pid"
        if (Test-Path $pidFile) {
          $pId = Get-Content $pidFile
          $p = Get-Process -Id $pId -ErrorAction SilentlyContinue
          if ($p -and $p.MainWindowHandle -ne [IntPtr]::Zero) {
            [WMin]::ShowWindow($p.MainWindowHandle, 6)
          }
        }
      `.replace(/\r?\n\s*/g, " ");

      exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCmd}"`);
      return NextResponse.json({ success: true, action: "minimized" });
    }

    if (action === "close") {
      const psCmd = `
        $pidFile = "$env:TEMP\\forex_clock_widget.pid"
        if (Test-Path $pidFile) {
          $pId = Get-Content $pidFile
          Stop-Process -Id $pId -Force -ErrorAction SilentlyContinue
          Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        }
      `.replace(/\r?\n\s*/g, " ");

      exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCmd}"`);
      return NextResponse.json({ success: true, action: "closed" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
