import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { parseCtraderFile } from "@/lib/parseCtraderFile";

export async function GET() {
  try {
    const downloadsDir = path.join(os.homedir(), "Downloads");
    if (!fs.existsSync(downloadsDir)) {
      return NextResponse.json({ success: false, message: "Downloads directory not found" });
    }

    const files = fs.readdirSync(downloadsDir);
    const ctraderFiles = files
      .filter(f => /^cT_.*\.(xlsx|htm|html|csv)$/i.test(f))
      .map(f => {
        const fullPath = path.join(downloadsDir, f);
        const stats = fs.statSync(fullPath);
        return {
          fileName: f,
          fullPath,
          mtimeMs: stats.mtimeMs,
          mtime: stats.mtime.toISOString(),
          size: stats.size
        };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    if (ctraderFiles.length === 0) {
      return NextResponse.json({ success: true, found: false, message: "No cTrader statements found in Downloads" });
    }

    const latest = ctraderFiles[0];
    const fileBuffer = fs.readFileSync(latest.fullPath);
    // Convert Node Buffer to ArrayBuffer
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

    const { trades, detectedBalance } = parseCtraderFile(arrayBuffer);

    return NextResponse.json({
      success: true,
      found: true,
      fileName: latest.fileName,
      filePath: latest.fullPath,
      mtime: latest.mtime,
      detectedBalance,
      tradesCount: trades.length,
      latestTrade: trades.length > 0 ? trades[trades.length - 1] : null,
      trades
    });
  } catch (error: any) {
    console.error("Error detecting cTrader statement:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to scan statements" }, { status: 500 });
  }
}
