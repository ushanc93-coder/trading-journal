import { Trade } from "./mock-data";

/**
 * Parses a standard cTrader History export CSV (comma or semicolon separated)
 * and returns clean Trade objects ready to be added to the journal.
 */
export function parseCtraderCsv(csvContent: string): Omit<Trade, "id">[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) return [];

  // Detect delimiter (comma or semicolon or tab)
  const headerLine = lines[0];
  let delimiter = ",";
  if (headerLine.includes(";") && headerLine.split(";").length > headerLine.split(",").length) {
    delimiter = ";";
  } else if (headerLine.includes("\t") && headerLine.split("\t").length > headerLine.split(",").length) {
    delimiter = "\t";
  }

  // Parse CSV line respecting quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = parseLine(headerLine).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Find column indices
  const findIndex = (possibleNames: string[]) => {
    return headers.findIndex(h => possibleNames.some(p => h.includes(p)));
  };

  const dealIdIdx = findIndex(["dealid", "orderid", "positionid", "id"]);
  const symbolIdx = findIndex(["symbol", "instrument"]);
  const directionIdx = findIndex(["openingdirection", "direction", "type"]);
  const volumeIdx = findIndex(["closingquantity", "quantity", "volume", "lots", "size"]);
  const entryPriceIdx = findIndex(["entryprice", "openingprice", "openprice"]);
  const exitPriceIdx = findIndex(["closingprice", "closeprice", "exitprice"]);
  const pnlIdx = findIndex(["netusd", "netprofit", "net", "gross", "profit"]);
  const closeTimeIdx = findIndex(["closingtime", "closetime", "time", "date"]);
  const slIdx = findIndex(["stoploss", "sl"]);
  const tpIdx = findIndex(["takeprofit", "tp"]);
  const balanceIdx = findIndex(["balance", "accountbalance", "equity"]);

  const trades: Omit<Trade, "id">[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length < 4) continue;

    const rawSymbol = symbolIdx >= 0 ? cols[symbolIdx] : "";
    if (!rawSymbol || rawSymbol.toLowerCase().includes("balance") || rawSymbol.toLowerCase().includes("deposit")) {
      continue;
    }

    const cleanSymbol = rawSymbol.toUpperCase();
    const rawDir = directionIdx >= 0 ? cols[directionIdx].toLowerCase() : "buy";
    const direction: "Long" | "Short" = rawDir.includes("sell") || rawDir.includes("short") ? "Short" : "Long";

    const rawEntry = entryPriceIdx >= 0 ? parseFloat(cols[entryPriceIdx].replace(/[^0-9.-]/g, "")) : 0;
    const rawExit = exitPriceIdx >= 0 ? parseFloat(cols[exitPriceIdx].replace(/[^0-9.-]/g, "")) : rawEntry;
    const rawPnL = pnlIdx >= 0 ? parseFloat(cols[pnlIdx].replace(/[^0-9.-]/g, "")) : 0;

    const rawSL = slIdx >= 0 ? parseFloat(cols[slIdx].replace(/[^0-9.-]/g, "")) : 0;
    const rawTP = tpIdx >= 0 ? parseFloat(cols[tpIdx].replace(/[^0-9.-]/g, "")) : 0;

    let volume = 0.01;
    if (volumeIdx >= 0) {
      const v = parseFloat(cols[volumeIdx].replace(/[^0-9.-]/g, ""));
      if (!isNaN(v)) {
        if (cleanSymbol.includes("XAU") && v >= 100) {
          volume = Math.round((v / 100) * 100) / 100;
        } else if (v >= 1000) {
          volume = Math.round((v / 100000) * 100) / 100;
        } else {
          volume = v;
        }
      }
    }

    let dateStr = new Date().toISOString().split("T")[0];
    let hour = 12;
    if (closeTimeIdx >= 0 && cols[closeTimeIdx]) {
      const parsedDate = new Date(cols[closeTimeIdx]);
      if (!isNaN(parsedDate.getTime())) {
        dateStr = parsedDate.toISOString().split("T")[0];
        hour = parsedDate.getUTCHours();
      }
    }

    // Determine session from UTC hour
    let session: "Asian" | "London" | "New York" = "London";
    if (hour >= 0 && hour < 7) session = "Asian";
    else if (hour >= 7 && hour < 12) session = "London";
    else session = "New York";

    const category: "Forex" | "Index" = (cleanSymbol.includes("US30") || cleanSymbol.includes("NAS100") || cleanSymbol.includes("GER40") || cleanSymbol.includes("SPX500")) ? "Index" : "Forex";

    const rawTicket = dealIdIdx >= 0 ? cols[dealIdIdx] : `${i}`;
    const ticket = rawTicket.startsWith("#") ? rawTicket : `#TR-${rawTicket}`;

    const isWin = rawPnL > 0;
    const status: "Win" | "Loss" | "Break Even" = rawPnL > 0.05 ? "Win" : rawPnL < -0.05 ? "Loss" : "Break Even";

    let rowBalance: number | undefined = undefined;
    if (balanceIdx >= 0 && cols[balanceIdx]) {
      const b = parseFloat(cols[balanceIdx].replace(/[^0-9.-]/g, ""));
      if (!isNaN(b)) {
        rowBalance = Math.round(b * 100) / 100;
      }
    }

    trades.push({
      date: dateStr,
      symbol: cleanSymbol,
      direction,
      entryPrice: isNaN(rawEntry) ? 0 : rawEntry,
      exitPrice: isNaN(rawExit) ? 0 : rawExit,
      lotSize: Math.max(0.01, volume || 0.01),
      sl: isNaN(rawSL) ? 0 : rawSL,
      tp: isNaN(rawTP) ? 0 : rawTP,
      netPnL: isNaN(rawPnL) ? 0 : Math.round(rawPnL * 100) / 100,
      rMultiple: isWin ? 2.0 : -1.0,
      category,
      session,
      timePeriod: "None",
      emotion: "Calm",
      strategy: "Order Flow",
      status,
      mistake: "None",
      rulesFollowed: true,
      ticket,
      balance: rowBalance,
      notes: `Auto-imported from cTrader history export (${dateStr})`
    });
  }

  return trades;
}
