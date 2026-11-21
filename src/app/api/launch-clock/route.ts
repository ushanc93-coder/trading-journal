import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), "Launch-Frameless-Clock.bat");
    exec(`cmd /c "${scriptPath}"`, (err) => {
      if (err) {
        console.error("Failed to launch clock script:", err);
      }
    });
    return NextResponse.json({ success: true, message: "Clock widget launched" });
  } catch (error) {
    console.error("API launch error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
