import { Trade } from "./mock-data";

/**
 * Normalizes trading symbol (e.g. "EURUSD.pro", "EUR/USD", "eurusd" -> "EURUSD")
 */
export function normalizeSymbol(sym?: string): string {
  if (!sym) return "";
  return sym.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Normalizes date to YYYY-MM-DD
 */
export function normalizeDate(d?: string): string {
  if (!d) return "";
  const str = d.trim().split("T")[0].split(" ")[0];
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
  return str;
}

/**
 * Normalizes direction ("Buy" / "Long" -> "Long", "Sell" / "Short" -> "Short")
 */
export function normalizeDirection(dir?: string): "Long" | "Short" {
  if (!dir) return "Long";
  const lower = dir.toLowerCase();
  return lower.includes("sell") || lower.includes("short") ? "Short" : "Long";
}

/**
 * Checks whether an existing trade in the journal is an unfulfilled pre-trade plan / playbook entry
 * (i.e. logged prior to execution with 0 prices / pending status, awaiting statement upload).
 */
export function isUnfilledPlannedTrade(trade: Trade): boolean {
  if (trade.syncedFromStatement) return false;
  if ((trade.status as string) === "Pending" || trade.isPlanned === true) return true;
  
  // Trades logged with 0 entryPrice, or 0 netPnL and 0 exitPrice
  const hasZeroPrice = !trade.entryPrice || trade.entryPrice === 0;
  const hasZeroPnLAndExit = (!trade.netPnL || trade.netPnL === 0) && (!trade.exitPrice || trade.exitPrice === 0);
  
  return hasZeroPrice || hasZeroPnLAndExit;
}

/**
 * Checks whether an incoming statement trade is an exact duplicate of an already completed trade
 */
export function isExactTradeDuplicate(incoming: Omit<Trade, "id">, existing: Trade): boolean {
  // If existing is still an unfilled plan, it's NOT a duplicate; it's a sync candidate!
  if (isUnfilledPlannedTrade(existing)) return false;

  // Check by ticket if both have ticket
  if (incoming.ticket && existing.ticket) {
    const normInc = incoming.ticket.replace(/^#TR-|^#|^TKT-/, "").trim();
    const normExt = existing.ticket.replace(/^#TR-|^#|^TKT-/, "").trim();
    if (normInc && normExt && normInc === normExt) {
      return true;
    }
  }

  // Exact signature match for already executed trades
  const sameDate = normalizeDate(existing.date) === normalizeDate(incoming.date);
  const sameSymbol = normalizeSymbol(existing.symbol) === normalizeSymbol(incoming.symbol);
  const sameDir = normalizeDirection(existing.direction) === normalizeDirection(incoming.direction);
  const sameEntry = Math.abs((existing.entryPrice || 0) - (incoming.entryPrice || 0)) < 0.0001;
  const sameLot = Math.abs((existing.lotSize || 0) - (incoming.lotSize || 0)) < 0.0001;
  const samePnL = Math.abs((existing.netPnL || 0) - (incoming.netPnL || 0)) < 0.01;

  return sameDate && sameSymbol && sameDir && sameEntry && sameLot && samePnL;
}

/**
 * Merges an incoming executed trade from a statement/broker into an existing pre-trade plan,
 * fully preserving all the user's Pre-Trade Playbook Confirmations (Bias, SB, PDA, 1M, SMT, 100 Marks).
 */
export function mergeIncomingWithPlanned(existing: Trade, incoming: Omit<Trade, "id">): Trade {
  const pnl = Math.round(Number(incoming.netPnL || 0) * 100) / 100;
  const isBreakEven = Math.abs(pnl) <= 0.35;
  const isWin = pnl > 0.35;
  const status: "Win" | "Loss" | "Break Even" = isBreakEven ? "Break Even" : isWin ? "Win" : "Loss";

  const pnlSignStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
  
  // Keep existing notes and cleanly attach execution result note
  let updatedNotes = existing.notes || "";
  const syncTag = `[Auto-Synced with Statement: Net P&L ${pnlSignStr}]`;
  if (!updatedNotes.includes("Auto-Synced with Statement")) {
    updatedNotes = updatedNotes ? `${updatedNotes} • ${syncTag}` : syncTag;
  }

  return {
    ...existing,
    // Realized execution metrics from statement
    ticket: incoming.ticket || existing.ticket,
    entryPrice: incoming.entryPrice || existing.entryPrice,
    exitPrice: incoming.exitPrice || existing.exitPrice,
    netPnL: pnl,
    lotSize: incoming.lotSize || existing.lotSize,
    sl: incoming.sl !== undefined && incoming.sl !== 0 ? incoming.sl : existing.sl,
    tp: incoming.tp !== undefined && incoming.tp !== 0 ? incoming.tp : existing.tp,
    status,
    rMultiple: incoming.rMultiple !== undefined ? incoming.rMultiple : (isWin ? 2 : (isBreakEven ? 0 : -1)),
    session: existing.session || incoming.session,
    timePeriod: existing.timePeriod && existing.timePeriod !== "None" ? existing.timePeriod : (incoming.timePeriod || "None"),
    
    // Status & Tracking flags
    isPlanned: false,
    syncedFromStatement: true,
    syncedAt: new Date().toISOString(),
    notes: updatedNotes,

    // PRESERVE ALL PLAYBOOK MARKS & CRITERIA!
    confluenceScore: existing.confluenceScore !== undefined ? existing.confluenceScore : 100,
    playbookDetails: existing.playbookDetails,
    confirmations: existing.confirmations,
    images: existing.images || incoming.images || [],
    patterns: existing.patterns || incoming.patterns || [],
    strategy: existing.strategy || incoming.strategy || "Order Flow",
    emotion: existing.emotion || incoming.emotion || "Calm",
    rulesFollowed: existing.rulesFollowed ?? true
  };
}

export interface StatementSyncResult {
  updatedFullTrades: Trade[];
  syncedMatches: Array<{
    existingId: string;
    symbol: string;
    direction: "Long" | "Short";
    pnl: number;
    marks: number;
    ticket?: string;
  }>;
  brandNewTrades: Omit<Trade, "id">[];
  duplicateCount: number;
}

/**
 * Central engine to process an uploaded statement against existing journal trades.
 * Automatically syncs with pre-trade plans, skips exact duplicates, and adds brand new trades.
 */
export function processStatementSync(
  incomingTrades: Omit<Trade, "id">[],
  existingTrades: Trade[]
): StatementSyncResult {
  const currentTrades = [...existingTrades];
  const matchedPlanIds = new Set<string>();
  const syncedMatches: StatementSyncResult["syncedMatches"] = [];
  const brandNewTrades: Omit<Trade, "id">[] = [];
  let duplicateCount = 0;

  for (const incoming of incomingTrades) {
    // 1. Check if already an exact duplicate
    const isDuplicate = currentTrades.some(ext => isExactTradeDuplicate(incoming, ext));
    if (isDuplicate) {
      duplicateCount++;
      continue;
    }

    // 2. Look for matching pre-trade planned trade (only if incoming has executed data)
    const isIncomingExecuted = (incoming.entryPrice && incoming.entryPrice > 0) || Math.abs(incoming.netPnL || 0) > 0 || Boolean(incoming.ticket && !incoming.ticket.startsWith("#TR-"));
    
    const incDate = normalizeDate(incoming.date);
    const incSym = normalizeSymbol(incoming.symbol);
    const incDir = normalizeDirection(incoming.direction);

    // Candidates: unfilled plans with same date, symbol, direction
    const candidates = isIncomingExecuted ? currentTrades.filter(ext => {
      if (matchedPlanIds.has(ext.id)) return false;
      if (!isUnfilledPlannedTrade(ext)) return false;
      return (
        normalizeDate(ext.date) === incDate &&
        normalizeSymbol(ext.symbol) === incSym &&
        normalizeDirection(ext.direction) === incDir
      );
    }) : [];

    if (candidates.length > 0) {
      // Best candidate: prefer session match if available
      let matched = candidates[0];
      if (candidates.length > 1) {
        const sessionMatch = candidates.find(c => c.session === incoming.session);
        if (sessionMatch) matched = sessionMatch;
      }

      // Mark matched so another trade doesn't merge with the same plan
      matchedPlanIds.add(matched.id);

      // Merge incoming executed data with the pre-trade plan
      const mergedTrade = mergeIncomingWithPlanned(matched, incoming);

      // Update in our array
      const idx = currentTrades.findIndex(t => t.id === matched.id);
      if (idx !== -1) {
        currentTrades[idx] = mergedTrade;
      }

      syncedMatches.push({
        existingId: matched.id,
        symbol: mergedTrade.symbol,
        direction: mergedTrade.direction,
        pnl: mergedTrade.netPnL,
        marks: mergedTrade.confluenceScore || 100,
        ticket: mergedTrade.ticket
      });
    } else {
      // 3. Brand new trade without pre-trade plan
      brandNewTrades.push(incoming);
    }
  }

  // If there are brand new trades, format them with IDs and add to current trades
  if (brandNewTrades.length > 0) {
    const formattedNew = brandNewTrades.map(t => ({
      ...t,
      id: Math.random().toString(36).substr(2, 9),
      isPlanned: false,
      syncedFromStatement: true,
      syncedAt: new Date().toISOString()
    })) as Trade[];
    currentTrades.unshift(...formattedNew);
  }

  return {
    updatedFullTrades: currentTrades,
    syncedMatches,
    brandNewTrades,
    duplicateCount
  };
}
