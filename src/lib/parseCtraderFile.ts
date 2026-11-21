import * as XLSX from "xlsx";
import { Trade } from "./mock-data";
import { evaluateTradesAndJournal } from "./journalRuleEvaluator";

function parseDateValue(val: any): { dateStr: string; hour: number } {
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, "0");
    const d = String(val.getUTCDate()).padStart(2, "0");
    return {
      dateStr: `${y}-${m}-${d}`,
      hour: val.getUTCHours()
    };
  }

  // Handle Excel serial date numbers (e.g. 46281.293)
  if (typeof val === "number" && val > 30000) {
    const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getUTCFullYear();
      const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getUTCDate()).padStart(2, "0");
      return {
        dateStr: `${y}-${m}-${d}`,
        hour: dateObj.getUTCHours()
      };
    }
  }

  const str = String(val || "").trim();
  if (!str) {
    const now = new Date();
    return { dateStr: now.toISOString().split("T")[0], hour: now.getUTCHours() };
  }

  // Handle DD/MM/YYYY HH:mm:ss or YYYY-MM-DD HH:mm:ss
  const parts = str.split(/[\sT]+/);
  const datePart = parts[0] || "";
  const timePart = parts[1] || "12:00:00";

  let year = new Date().getFullYear();
  let month = "01";
  let day = "01";

  if (datePart.includes("/")) {
    const dParts = datePart.split("/");
    if (dParts.length === 3) {
      day = dParts[0].padStart(2, "0");
      month = dParts[1].padStart(2, "0");
      year = parseInt(dParts[2], 10);
    }
  } else if (datePart.includes("-")) {
    const dParts = datePart.split("-");
    if (dParts[0].length === 4) {
      year = parseInt(dParts[0], 10);
      month = dParts[1].padStart(2, "0");
      day = dParts[2].padStart(2, "0");
    } else if (dParts.length === 3) {
      day = dParts[0].padStart(2, "0");
      month = dParts[1].padStart(2, "0");
      year = parseInt(dParts[2], 10);
    }
  }

  const hour = parseInt(timePart.split(":")[0], 10) || 12;
  return {
    dateStr: `${year}-${month}-${day}`,
    hour
  };
}

export interface ParsedCtraderResult {
  trades: Omit<Trade, "id">[];
  detectedBalance?: number;
}

export function parseCtraderFile(fileBuffer: ArrayBuffer): ParsedCtraderResult {
  const workbook = XLSX.read(fileBuffer, { type: "array", cellDates: true });
  const allTrades: Omit<Trade, "id">[] = [];
  let detectedBalance: number | undefined = undefined;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });
    if (!rawRows || rawRows.length < 2) continue;

    // Locate header row
    let headerRowIdx = -1;
    let symbolIdx = -1;
    let dirIdx = -1;
    let timeIdx = -1;
    let entryIdx = -1;
    let exitIdx = -1;
    let qtyIdx = -1;
    let pnlIdx = -1;
    let idIdx = -1;
    let balanceIdx = -1;
    let latestBalance: number | undefined = undefined;

    for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const rowStr = row.map(c => String(c).toLowerCase().replace(/[^a-z0-9]/g, ""));
      const sIdx = rowStr.findIndex(c => c === "symbol" || c === "instrument");

      if (sIdx !== -1) {
        headerRowIdx = r;
        symbolIdx = sIdx;
        dirIdx = rowStr.findIndex(c => c.includes("direction") || c.includes("type") || c === "action");
        timeIdx = rowStr.findIndex(c => c.includes("closingtime") || c.includes("closetime") || c.includes("time") || c.includes("date"));
        entryIdx = rowStr.findIndex(c => c.includes("entryprice") || c.includes("openprice") || c.includes("entry") || c === "open");
        exitIdx = rowStr.findIndex(c => c.includes("closingprice") || c.includes("closeprice") || c.includes("close") || c === "exit");
        qtyIdx = rowStr.findIndex(c => c.includes("quantity") || c.includes("lots") || c.includes("volume") || c.includes("size"));
        pnlIdx = rowStr.findIndex(c => c.includes("net") || c.includes("gross") || c.includes("profit") || c.includes("pnl"));
        idIdx = rowStr.findIndex(c => c.includes("dealid") || c.includes("positionid") || c.includes("orderid") || c === "id");
        balanceIdx = rowStr.findIndex(c => c.includes("balance") || c.includes("equity"));
        break;
      }
    }

    if (headerRowIdx === -1 || symbolIdx === -1) {
      continue; // Check next sheet if header not found
    }

    // Process rows after header
    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      // Extract balance if available in this row
      let rowBalance: number | undefined = undefined;
      if (balanceIdx !== -1 && row[balanceIdx] !== undefined && row[balanceIdx] !== "") {
        const bVal = parseFloat(String(row[balanceIdx]).replace(/[^0-9.-]/g, ""));
        if (!isNaN(bVal)) {
          rowBalance = Math.round(bVal * 100) / 100;
          latestBalance = rowBalance;
        }
      }

      if (row.length <= symbolIdx) continue;

      const rawSym = String(row[symbolIdx] || "").trim();
      if (!rawSym || rawSym.toLowerCase().includes("total") || rawSym.toLowerCase().includes("balance") || rawSym.toLowerCase().includes("deposit")) {
        continue;
      }

      const cleanSymbol = rawSym.toUpperCase();
      const rawDir = dirIdx !== -1 ? String(row[dirIdx] || "").toLowerCase() : "buy";
      const direction: "Long" | "Short" = rawDir.includes("sell") || rawDir.includes("short") ? "Short" : "Long";

      const { dateStr, hour } = parseDateValue(timeIdx !== -1 ? row[timeIdx] : new Date());

      const rawEntry = entryIdx !== -1 ? parseFloat(String(row[entryIdx]).replace(/[^0-9.-]/g, "")) : 0;
      const rawExit = exitIdx !== -1 ? parseFloat(String(row[exitIdx]).replace(/[^0-9.-]/g, "")) : rawEntry;
      const rawPnL = pnlIdx !== -1 ? parseFloat(String(row[pnlIdx]).replace(/[^0-9.-]/g, "")) : 0;

      let volume = 0.01;
      if (qtyIdx !== -1) {
        const v = parseFloat(String(row[qtyIdx]).replace(/[^0-9.-]/g, ""));
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

      // Determine trading session
      let session: "Asian" | "London" | "New York" = "London";
      if (hour >= 0 && hour < 7) session = "Asian";
      else if (hour >= 7 && hour < 12) session = "London";
      else session = "New York";

      const category: "Forex" | "Index" = (cleanSymbol.includes("US30") || cleanSymbol.includes("NAS100") || cleanSymbol.includes("GER40") || cleanSymbol.includes("SPX500")) ? "Index" : "Forex";

      const rawId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `${r}`;
      const ticket = rawId.startsWith("#") ? rawId : `#TR-${rawId}`;

      const isWin = rawPnL > 0;
      const status: "Win" | "Loss" | "Break Even" = rawPnL > 0.05 ? "Win" : rawPnL < -0.05 ? "Loss" : "Break Even";

      allTrades.push({
        date: dateStr,
        symbol: cleanSymbol,
        direction,
        entryPrice: isNaN(rawEntry) ? 0 : rawEntry,
        exitPrice: isNaN(rawExit) ? 0 : rawExit,
        lotSize: Math.max(0.01, volume || 0.01),
        sl: 0,
        tp: 0,
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
        notes: `Imported from cTrader statement (${dateStr})`
      });
    }

    if (latestBalance !== undefined) {
      detectedBalance = latestBalance;
    }

    if (allTrades.length > 0) break; // Found our trades sheet
  }

  const { evaluatedTrades } = evaluateTradesAndJournal(allTrades, detectedBalance || 72);

  return {
    trades: evaluatedTrades as Omit<Trade, "id">[],
    detectedBalance
  };
}
