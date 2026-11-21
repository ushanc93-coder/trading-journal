import { Trade } from "./mock-data";
import { ProcessEntry } from "./useJournal";

export interface EvaluatedTradeResult {
  trade: Trade;
  journalEntry: Omit<ProcessEntry, "id">;
}

export function formatInvoiceNumber(ticketOrId?: string | null, fallbackNum?: number): string {
  if (ticketOrId && typeof ticketOrId === "string") {
    const trimmed = ticketOrId.trim();
    const match = trimmed.match(/^(?:#?TR-?|#?TKT-?|#)?(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      return `#TR-${String(num).padStart(3, "0")}`;
    }
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  }
  if (typeof fallbackNum === "number" && fallbackNum > 0) {
    return `#TR-${String(fallbackNum).padStart(3, "0")}`;
  }
  return "#TR-001";
}

/**
 * Evaluates a set of trades against discipline & risk rules:
 * 1. Max 2 Trades Rule: Only the first 2 trades of any calendar date pass. 3rd+ trades FAIL (Over-trading).
 * 2. Break Even Detection: Trades with net PnL between -$0.35 and +$0.35 are classified as Break Even.
 * 3. Max Risk (0.5% - 1%) Rule: Losses greater than max allowable risk (e.g. > $1.50 on a ~$70-$100 balance) FAIL.
 * 4. Max 2R TP Rule: Scratched or micro-profit trades (< $0.35) cut early FAIL the 2R target rule.
 * 5. Outcome & Result:
 *    - All rules pass + Win => "Good Win"
 *    - All rules pass + Loss => "Good Loss"
 *    - ANY rule fails + Win => "Bad Win" (Undisciplined win)
 *    - ANY rule fails + Loss/Scratch => "Bad Loss" (Undisciplined loss)
 */
export function evaluateTradesAndJournal(
  trades: (Trade | Omit<Trade, "id">)[],
  accountBalance: number = 72
): { evaluatedTrades: (Trade | Omit<Trade, "id">)[]; journalEntries: Omit<ProcessEntry, "id">[] } {
  // Sort trades chronologically: oldest first for sequential counting per day
  const indexed = trades.map((t, index) => ({ trade: t, originalIndex: index }));
  
  indexed.sort((a, b) => {
    const dateComp = new Date(a.trade.date).getTime() - new Date(b.trade.date).getTime();
    if (dateComp !== 0) return dateComp;
    // Secondary sort by ticket or original order
    const aTicket = String(a.trade.ticket || "").replace(/[^0-9]/g, "");
    const bTicket = String(b.trade.ticket || "").replace(/[^0-9]/g, "");
    if (aTicket && bTicket) {
      return parseInt(aTicket, 10) - parseInt(bTicket, 10);
    }
    return a.originalIndex - b.originalIndex;
  });

  // Track trades count per date
  const dateTradeCounter: Record<string, number> = {};

  const evaluatedTrades: (Trade | Omit<Trade, "id">)[] = [];
  const journalEntries: Omit<ProcessEntry, "id">[] = [];

  // Allowed risk in dollar terms (0.5% - 1.5% of account balance, minimum $1.50)
  const maxRiskThreshold = Math.max(1.50, accountBalance * 0.02);

  for (let i = 0; i < indexed.length; i++) {
    const item = indexed[i];
    const t = item.trade;
    const dateStr = t.date;
    const countOnThisDate = (dateTradeCounter[dateStr] || 0) + 1;
    dateTradeCounter[dateStr] = countOnThisDate;

    // Clean, unique, sequential ticket number (#TR-001, #TR-002, etc.)
    const ticket = formatInvoiceNumber(t.ticket, i + 1);

    const pnl = Math.round(Number(t.netPnL || 0) * 100) / 100;
    const isBreakEven = Math.abs(pnl) <= 0.35;
    const isWin = pnl > 0.35;
    const isLoss = pnl < -0.35;

    // Rule 1: Max 2 trades rule
    const max2Trades = countOnThisDate <= 2;

    // Rule 2: Max Risk rule (loss must not exceed threshold)
    const maxRisk = isLoss ? Math.abs(pnl) <= maxRiskThreshold : true;

    // Rule 3: Max 2R TP rule
    const maxTp = isBreakEven ? false : isLoss ? true : pnl >= 1.0;

    // Rule 4: Entry rules (if heavy over-trading trade #4+, high chance of impulsive entry)
    const entryRules = countOnThisDate <= 3;

    // Rule 5: Max profit rule (discipline after profit)
    const maxProfit = true;

    // Did this trade follow all process rules?
    const allRulesFollowed = entryRules && max2Trades && maxRisk && maxTp;

    // Result classification
    let result: ProcessEntry["result"] = "Good Win";
    if (allRulesFollowed) {
      result = isWin ? "Good Win" : "Good Loss";
    } else {
      result = isWin ? "Bad Win" : "Bad Loss";
    }

    // Status classification for Trade Log
    const status: "Win" | "Loss" | "Break Even" = isBreakEven
      ? "Break Even"
      : isWin
      ? "Win"
      : "Loss";

    // Mistake detection
    let mistake: Trade["mistake"] = "None";
    if (!max2Trades) {
      mistake = "Over-leveraged"; // "Over-trading" mapped to closest or default
    } else if (!maxRisk) {
      mistake = "Over-leveraged";
    } else if (isBreakEven && pnl < 0) {
      mistake = "Early close";
    }

    // Generate descriptive note
    let outcomeNote = "";
    const pnlSignStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
    if (isBreakEven) {
      outcomeNote = `Break Even (${pnlSignStr})`;
    } else if (isWin) {
      outcomeNote = `Execution ${pnlSignStr}`;
    } else {
      outcomeNote = `Execution ${pnlSignStr}`;
    }

    if (!max2Trades) {
      outcomeNote += ` • Trade #${countOnThisDate} of day (Over-trading rule violated)`;
    } else if (!maxRisk) {
      outcomeNote += ` • Exceeded max 0.5% risk rule`;
    }

    const updatedTrade: Trade | Omit<Trade, "id"> = {
      ...t,
      ticket,
      status,
      rulesFollowed: allRulesFollowed,
      mistake,
      notes: t.notes || outcomeNote
    };

    const journalEntry: Omit<ProcessEntry, "id"> = {
      ticket,
      date: dateStr,
      pair: t.symbol,
      session: t.session || "London",
      entryRules,
      max2Trades,
      maxRisk,
      maxTp,
      maxProfit,
      result,
      outcome: outcomeNote
    };

    evaluatedTrades.push(updatedTrade);
    journalEntries.push(journalEntry);
  }

  // Restore original ordering if needed or return chronological
  return {
    evaluatedTrades,
    journalEntries
  };
}

/**
 * Recalculates result when a user toggles any rule checkbox on the UI
 */
export function recalculateEntryResult(
  entry: Pick<ProcessEntry, "entryRules" | "max2Trades" | "maxRisk" | "maxTp" | "maxProfit" | "result">,
  netPnL?: number
): "Good Win" | "Good Loss" | "Bad Win" | "Bad Loss" {
  const allPassed = entry.entryRules && entry.max2Trades && entry.maxRisk && entry.maxTp && entry.maxProfit;
  const isWin = (netPnL !== undefined && netPnL > 0) || entry.result.includes("Win");

  if (allPassed) {
    return isWin ? "Good Win" : "Good Loss";
  } else {
    return isWin ? "Bad Win" : "Bad Loss";
  }
}
