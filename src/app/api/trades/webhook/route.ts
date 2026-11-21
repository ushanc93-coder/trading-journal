import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const QUEUE_FILE = path.join(process.cwd(), "auto_synced_trades.json");

interface IncomingPayload {
  source?: string; // "tradingview" | "ctrader" | "manual"
  broker?: string;
  event?: "opened" | "closed" | "update";
  token?: string;
  positionId?: string | number;
  ticket?: string;
  symbol?: string;
  ticker?: string;
  action?: string; // "buy" | "sell" | "long" | "short"
  tradeType?: string; // "Buy" | "Sell"
  price?: number;
  entryPrice?: number;
  exitPrice?: number;
  lot?: number;
  lotSize?: number;
  volumeInLots?: number;
  contracts?: number;
  sl?: number;
  stopLoss?: number;
  tp?: number;
  takeProfit?: number;
  netProfit?: number;
  netPnL?: number;
  openTime?: string;
  closeTime?: string;
  strategy?: string;
  notes?: string;
}

function readQueue(): any[] {
  try {
    if (!fs.existsSync(QUEUE_FILE)) {
      return [];
    }
    const data = fs.readFileSync(QUEUE_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function writeQueue(queue: any[]) {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write auto_synced_trades.json:", err);
  }
}

// Determine ICT Session and Silver Bullet from trade date/time in New York timezone
function determineIctSession(dateObj: Date): { session: "Asian" | "London" | "New York"; timePeriod: "None" | "London silver bullet" | "NY silver bullet" } {
  try {
    const nyStr = dateObj.toLocaleString("en-US", { timeZone: "America/New_York" });
    const nyDate = new Date(nyStr);
    const nyH = nyDate.getHours();

    let session: "Asian" | "London" | "New York" = "New York";
    let timePeriod: "None" | "London silver bullet" | "NY silver bullet" = "None";

    if (nyH >= 20 || nyH < 2) {
      session = "Asian";
    } else if (nyH >= 2 && nyH < 5) {
      session = "London";
      if (nyH === 3) timePeriod = "London silver bullet";
    } else if (nyH >= 7 && nyH < 17) {
      session = "New York";
      if (nyH === 10 || nyH === 14) timePeriod = "NY silver bullet";
    } else {
      session = "New York";
    }

    return { session, timePeriod };
  } catch {
    return { session: "New York", timePeriod: "None" };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const ackId = searchParams.get("ack");

  let queue = readQueue();

  if (action === "clear") {
    writeQueue([]);
    return NextResponse.json({ success: true, count: 0 });
  }

  if (ackId) {
    queue = queue.filter((t) => t.id !== ackId && t.positionId !== ackId);
    writeQueue(queue);
    return NextResponse.json({ success: true, remaining: queue.length });
  }

  return NextResponse.json({ trades: queue });
}

export async function POST(request: Request) {
  try {
    const raw: IncomingPayload = await request.json();

    const symbolRaw = raw.symbol || raw.ticker || "EURUSD";
    const symbol = symbolRaw.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const actionRaw = (raw.action || raw.tradeType || "buy").toLowerCase();
    const isLong = actionRaw.includes("buy") || actionRaw.includes("long");
    const direction: "Long" | "Short" = isLong ? "Long" : "Short";

    const entryPrice = Number(raw.entryPrice || raw.price || 0);
    const exitPrice = raw.exitPrice !== undefined && raw.exitPrice !== null ? Number(raw.exitPrice) : entryPrice;

    const lotSize = Number(raw.volumeInLots || raw.lotSize || raw.lot || raw.contracts || 1.0);
    const sl = raw.stopLoss !== undefined && raw.stopLoss !== null ? Number(raw.stopLoss) : (raw.sl ? Number(raw.sl) : 0);
    const tp = raw.takeProfit !== undefined && raw.takeProfit !== null ? Number(raw.takeProfit) : (raw.tp ? Number(raw.tp) : 0);

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    const isIndex = ["US30", "NAS100", "US100", "GER40", "SPX500", "US500", "WS30"].some((idx) => symbol.includes(idx));
    const category: "Forex" | "Index" = isIndex ? "Index" : "Forex";

    const { session, timePeriod } = determineIctSession(now);

    const netPnL = Number(raw.netProfit || raw.netPnL || 0);
    let status: "Win" | "Loss" | "Break Even" = "Win";
    if (netPnL > 0) status = "Win";
    else if (netPnL < 0) status = "Loss";
    else if (exitPrice !== entryPrice) status = "Break Even";

    // Calculate R-Multiple
    let rMultiple = 0;
    if (sl > 0 && Math.abs(entryPrice - sl) > 0.00001) {
      const riskDist = Math.abs(entryPrice - sl);
      const rewardDist = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
      rMultiple = Number((rewardDist / riskDist).toFixed(2));
    }

    const sourceName = raw.source === "ctrader" ? "cTrader (IC Markets)" : (raw.source === "tradingview" ? "TradingView" : "Auto-Sync Webhook");
    const ticket = raw.ticket || (raw.positionId ? `CT-${raw.positionId}` : `TV-${Math.floor(1000 + Math.random() * 9000)}`);

    const newTrade = {
      id: "sync-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      ticket,
      symbol,
      direction,
      entryPrice,
      exitPrice,
      lotSize,
      sl,
      tp,
      netPnL,
      rMultiple,
      category,
      session,
      timePeriod,
      date: dateStr,
      rulesFollowed: true,
      emotion: "Calm" as const,
      mistake: "None" as const,
      strategy: (raw.strategy || "Order Flow") as any,
      notes: raw.notes || `Auto-synced execution from ${sourceName} at ${now.toLocaleTimeString()}`,
      status,
      source: sourceName,
      syncedAt: now.toISOString(),
      rawEvent: raw.event || "opened",
    };

    const queue = readQueue();
    queue.unshift(newTrade);
    // Keep max 50 recent trades in queue
    if (queue.length > 50) queue.pop();
    writeQueue(queue);

    return NextResponse.json({
      success: true,
      trade: newTrade,
      message: `Trade ${symbol} (${direction}) successfully queued for auto-journaling from ${sourceName}`,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message || "Failed to process webhook" }, { status: 400 });
  }
}
