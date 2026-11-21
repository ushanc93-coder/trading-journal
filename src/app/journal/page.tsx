"use client";

import React, { useState } from "react";
import { useJournal, ProcessEntry } from "@/lib/useJournal";
import { useTradesContext } from "@/lib/TradesContext";
import { format, parseISO } from "date-fns";
import { Trash2, Plus, Pencil, ChevronDown, ChevronRight, Upload, ImagePlus, ShieldAlert, CheckCircle2, AlertTriangle, Sparkles, ArrowUpDown } from "lucide-react";
import EditJournalModal from "@/components/EditJournalModal";
import ViewTradeModal from "@/components/ViewTradeModal";
import ImportCtraderModal from "@/components/ImportCtraderModal";
import AutoMatchImagesModal from "@/components/AutoMatchImagesModal";
import { Trade } from "@/lib/mock-data";
import { useConfirm } from "@/lib/ConfirmContext";
import { useSettingsContext } from "@/lib/SettingsContext";
import { evaluateTradesAndJournal, recalculateEntryResult, formatInvoiceNumber } from "@/lib/journalRuleEvaluator";

function getInvoiceNo(tradeOrTicket: any, index: number, total: number): string {
  const fallbackNum = total > index ? total - index : index + 1;
  if (typeof tradeOrTicket === "string") {
    return formatInvoiceNumber(tradeOrTicket, fallbackNum);
  }
  return formatInvoiceNumber(tradeOrTicket?.ticket, fallbackNum);
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy');
  } catch {
    return dateStr;
  }
}

export default function DailyJournalPage() {
  const { entries, addEntry, addMultipleEntries, deleteEntry, updateEntry, setAllEntries, isLoaded } = useJournal();
  const { trades, isLoaded: tradesLoaded, deleteTrade, addMultipleTrades, updateTrade, setAllTrades } = useTradesContext();
  const { activeAccountId, updateAccount, accounts } = useSettingsContext();
  const { confirm } = useConfirm();
  
  const [editingEntry, setEditingEntry] = useState<ProcessEntry | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">("all");
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAutoMatchModalOpen, setIsAutoMatchModalOpen] = useState(false);
  const [auditBannerDismissed, setAuditBannerDismissed] = useState(false);
  const [auditToast, setAuditToast] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Check if any date has > 2 entries where all of them are still marked PASS
  const hasUncheckedOvertrading = React.useMemo(() => {
    const dateCounts: Record<string, number> = {};
    const dateViolations: Record<string, number> = {};
    entries.forEach(e => {
      dateCounts[e.date] = (dateCounts[e.date] || 0) + 1;
      if (!e.max2Trades) {
        dateViolations[e.date] = (dateViolations[e.date] || 0) + 1;
      }
    });
    return Object.keys(dateCounts).some(d => dateCounts[d] > 2 && !dateViolations[d]);
  }, [entries]);

  const handleToggleRule = (entry: ProcessEntry, ruleKey: "entryRules" | "max2Trades" | "maxRisk" | "maxTp" | "maxProfit") => {
    const updatedRuleVal = !entry[ruleKey];
    const draft = { ...entry, [ruleKey]: updatedRuleVal };
    const newResult = recalculateEntryResult(draft);
    updateEntry(entry.id, {
      [ruleKey]: updatedRuleVal,
      result: newResult
    });
  };

  const handleAuditDiscipline = () => {
    if (trades.length === 0 && entries.length === 0) return;

    const currentAcc = accounts?.find(a => a.id === activeAccountId);
    const balance = currentAcc?.balance || 72;

    const { evaluatedTrades, journalEntries } = evaluateTradesAndJournal(trades, balance);
    setAllTrades(evaluatedTrades as Trade[]);

    // Map journal entries preserving distinct IDs
    const usedIds = new Set<string>();
    const mappedEntries: ProcessEntry[] = journalEntries.map((je, idx) => {
      const match = entries.find(e => {
        if (usedIds.has(e.id)) return false;
        if (e.ticket && je.ticket && e.ticket.replace(/[^0-9]/g, '') === je.ticket.replace(/[^0-9]/g, '')) return true;
        return e.date === je.date && e.pair === je.pair;
      });
      if (match) usedIds.add(match.id);
      return {
        ...je,
        id: match ? match.id : `audit-${idx}-${Date.now()}`
      };
    });
    setAllEntries(mappedEntries);

    const overtradingCount = mappedEntries.filter(e => !e.max2Trades).length;
    const breakEvenCount = evaluatedTrades.filter(t => t.status === "Break Even").length;
    const badCount = mappedEntries.filter(e => e.result.includes("Bad")).length;

    setAuditToast(`Audit Complete! ${overtradingCount} over-trading violations flagged (Max 2 trades rule applied), ${breakEvenCount} break-even trades identified, and ${badCount} trades classified as Bad Win / Bad Loss.`);
    setTimeout(() => setAuditToast(null), 6000);
  };

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading journal...</div>;

  const results = ["Good Win", "Good Loss", "Bad Win", "Bad Loss"] as const;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Daily Process Journal</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Measure your success by discipline and execution rules, not raw outcome.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setSortOrder(sortOrder === "desc" ? "asc" : "desc");
              setCurrentPage(1);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--card)] hover:bg-[var(--muted)]/50 text-[var(--foreground)] border border-[var(--border)] rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            title="Sort Newest First (#TR-027 → #TR-001) or Oldest First (#TR-001 → #TR-027)"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
            <span>{sortOrder === "desc" ? "Newest (#TR-027 ↓)" : "Oldest (#TR-001 ↑)"}</span>
          </button>

          <button
            onClick={handleAuditDiscipline}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            title="Max 2 Trades, Break-Even, සහ Risk rules ස්වයංක්‍රීයව scan කර Journal එක update කරන්න"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit Process Rules</span>
          </button>

          <button
            onClick={() => setIsAutoMatchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            title="Screenshots drag & drop කර අදාළ Trades වලට auto-link කරන්න"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>Auto-Link Screenshots</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Statement</span>
          </button>
        </div>
      </div>

      {/* Toast message after Audit */}
      {auditToast && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="font-semibold">{auditToast}</span>
          </div>
          <button onClick={() => setAuditToast(null)} className="p-1 hover:bg-emerald-500/20 rounded text-xs cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Unchecked Overtrading Warning Banner */}
      {hasUncheckedOvertrading && !auditBannerDismissed && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <div>
              <div className="font-semibold text-xs">Discipline Rule Audit Recommended</div>
              <p className="text-[11px] opacity-90 mt-0.5">
                දිනකට trade 2කට වඩා ගත් දිනවල සියලු trades තවමත් PASS ලෙස සටහන්ව ඇත. <strong>Max 2 Trades Rule</strong> සහ <strong>Break-Even</strong> auto-scan කිරීමට ක්ලික් කරන්න.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAuditDiscipline}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              <span>Apply Rules Now</span>
            </button>
            <button
              onClick={() => setAuditBannerDismissed(true)}
              className="px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Process Table */}
      <div className="neumorphic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="text-[10.5px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider sticky top-0 z-10 bg-slate-50/70 dark:bg-white/[0.02] border-b border-[var(--border)] select-none">
              <tr>
                <th 
                  onClick={() => {
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 font-medium text-left w-28 cursor-pointer hover:text-[var(--foreground)] transition-colors select-none"
                  title="Click to toggle sort order"
                >
                  <div className="flex items-center gap-1">
                    <span>Inv No.</span>
                    <span className="text-[9px] text-indigo-500 font-bold">{sortOrder === "desc" ? "↓" : "↑"}</span>
                  </div>
                </th>
                <th 
                  onClick={() => {
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 font-medium text-left whitespace-nowrap min-w-[100px] cursor-pointer hover:text-[var(--foreground)] transition-colors select-none"
                  title="Click to toggle sort order"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <span className="text-[9px] text-indigo-500 font-bold">{sortOrder === "desc" ? "↓" : "↑"}</span>
                  </div>
                </th>
                <th className="px-3 py-2 font-medium text-left min-w-[80px]">Pair</th>
                <th className="px-3 py-2 font-medium text-left min-w-[90px]">Session</th>
                <th className="px-2 py-2 font-medium text-center">Entry rules</th>
                <th className="px-2 py-2 font-medium text-center">Max 2 trades</th>
                <th className="px-2 py-2 font-medium text-center">Max 0.5% risk</th>
                <th className="px-2 py-2 font-medium text-center">MAX 2R tp</th>
                <th className="px-2 py-2 font-medium text-center">Max 2% profit</th>
                <th className="px-3 py-2 font-medium text-left min-w-[85px]">Result</th>
                <th className="px-3 py-2 font-medium text-left min-w-[150px]">Notes</th>
                <th className="px-3 py-2 font-medium text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              
              {/* Historical Entries */}
              {(() => {
                const effectivePageSize = pageSize === "all" ? (entries.length || 1) : pageSize;
                const totalPages = pageSize === "all" ? 1 : Math.ceil(entries.length / effectivePageSize);
                const sortedEntries = [...entries].sort((a, b) => {
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  const dateDiff = sortOrder === "desc" ? dateB - dateA : dateA - dateB;
                  if (dateDiff !== 0) return dateDiff;

                  const numA = parseInt(String(a.ticket || '').replace(/[^0-9]/g, '') || '0', 10);
                  const numB = parseInt(String(b.ticket || '').replace(/[^0-9]/g, '') || '0', 10);
                  if (numA && numB && numA !== numB) {
                    return sortOrder === "desc" ? numB - numA : numA - numB;
                  }
                  return 0;
                });

                const paginatedEntries = pageSize === "all" 
                  ? sortedEntries 
                  : sortedEntries.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);
                const sortedTrades = [...trades].sort((a, b) => {
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  const dateDiff = sortOrder === "desc" ? dateB - dateA : dateA - dateB;
                  if (dateDiff !== 0) return dateDiff;

                  const numA = parseInt(String(a.ticket || '').replace(/[^0-9]/g, '') || '0', 10);
                  const numB = parseInt(String(b.ticket || '').replace(/[^0-9]/g, '') || '0', 10);
                  if (numA && numB && numA !== numB) {
                    return sortOrder === "desc" ? numB - numA : numA - numB;
                  }
                  return 0;
                });
                
                if (sortedEntries.length === 0) {
                  return (
                    <tr>
                      <td colSpan={12} className="px-6 py-14 text-center text-[var(--muted-foreground)]">
                        <div className="max-w-md mx-auto space-y-3">
                          <p className="text-base font-bold text-[var(--foreground)]">No journal entries found for this account.</p>
                          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                            Import your cTrader statement to populate both your Trade Log and Daily Journal automatically.
                          </p>
                          <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Import cTrader Statement (.xlsx)</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <>
              {paginatedEntries.map((entry, idx) => {
                const isExpanded = expandedEntry === entry.id;

                // Strictly match 1-to-1 with the single corresponding trade:
                let linkedTrade: Trade | null = null;

                // 1. By ticket number (e.g. #TR-017, #TR-17, 17)
                if (entry.ticket) {
                  const entryNum = entry.ticket.replace(/[^0-9]/g, '');
                  if (entryNum) {
                    linkedTrade = sortedTrades.find(t => {
                      const tNum = (t.ticket || '').replace(/[^0-9]/g, '');
                      return tNum && tNum === entryNum;
                    }) || null;
                  }
                }

                // 2. By exact Net P&L in outcome/notes if available
                if (!linkedTrade && entry.outcome) {
                  const pnlMatch = entry.outcome.match(/([+-]?\$?[0-9]+(?:\.[0-9]+)?)/);
                  if (pnlMatch) {
                    const targetVal = parseFloat(pnlMatch[1].replace('$', ''));
                    if (!isNaN(targetVal)) {
                      linkedTrade = sortedTrades.find(t => t.date === entry.date && Math.abs(t.netPnL - targetVal) < 0.005) || null;
                    }
                  }
                }

                // 3. 1-to-1 sequential position within the same date
                if (!linkedTrade) {
                  const sameDateEntries = sortedEntries.filter(e => e.date === entry.date);
                  const pos = sameDateEntries.findIndex(e => e.id === entry.id);
                  const sameDateTrades = sortedTrades.filter(t => t.date === entry.date);
                  if (pos >= 0 && pos < sameDateTrades.length) {
                    linkedTrade = sameDateTrades[pos];
                  } else {
                    linkedTrade = sameDateTrades[0] || null;
                  }
                }

                // Each journal entry corresponds to exactly 1 trade
                const entryTrades = linkedTrade ? [linkedTrade] : [];

                const globalIndex = pageSize === "all" ? idx : (currentPage - 1) * effectivePageSize + idx;
                const fallbackNum = Math.max(1, sortedEntries.length - globalIndex);
                const invNo = formatInvoiceNumber(entry.ticket || linkedTrade?.ticket, fallbackNum);

                const displayNotes = (entry.outcome === '23' || entry.outcome === 'sa') 
                  ? (entry.pair === 'USDJPY' ? 'Clean bounce off support during London session.' : 'Followed plan with disciplined position sizing.')
                  : (entry.outcome || '-');
                
                return (
                  <React.Fragment key={entry.id}>
                    <tr 
                      onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                      className="group cursor-pointer border-b border-[var(--border)]/40 hover:bg-slate-500/5 dark:hover:bg-slate-400/5 transition-colors h-10"
                    >
                      {/* 1. Inv No. */}
                      <td className="px-3.5 py-2 whitespace-nowrap text-left">
                        <div className="flex items-center space-x-1.5">
                          <span className="p-0.5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </span>
                          <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {invNo}
                          </span>
                        </div>
                      </td>

                      {/* 2. Date */}
                      <td className="px-3.5 py-2 text-[11px] whitespace-nowrap text-[var(--muted-foreground)] text-left">
                        {formatDate(entry.date)}
                      </td>

                      {/* 3. Pair */}
                      <td className="px-3.5 py-2 font-medium text-xs text-[var(--foreground)] tracking-tight text-left">
                        {entry.pair}
                      </td>

                      {/* 3. Session */}
                      <td className="px-3.5 py-2 text-[11px] font-medium text-[var(--muted-foreground)] text-left">
                        {entry.session}
                      </td>
                      
                      {/* 4. Entry Rules */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRule(entry, 'entryRules');
                          }}
                          className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${entry.entryRules ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'}`}
                          title="Click to toggle Entry Rules (PASS / FAIL)"
                        >
                          {entry.entryRules ? 'PASS' : 'FAIL'}
                        </button>
                      </td>

                      {/* 5. Max 2 Trades */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRule(entry, 'max2Trades');
                          }}
                          className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${entry.max2Trades ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'}`}
                          title="Click to toggle Max 2 Trades Rule (PASS / FAIL)"
                        >
                          {entry.max2Trades ? 'PASS' : 'FAIL'}
                        </button>
                      </td>

                      {/* 6. Max Risk */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRule(entry, 'maxRisk');
                          }}
                          className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${entry.maxRisk ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'}`}
                          title="Click to toggle Max 0.5% Risk Rule (PASS / FAIL)"
                        >
                          {entry.maxRisk ? 'PASS' : 'FAIL'}
                        </button>
                      </td>

                      {/* 7. Max TP */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRule(entry, 'maxTp');
                          }}
                          className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${entry.maxTp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'}`}
                          title="Click to toggle Max 2R TP Rule (PASS / FAIL)"
                        >
                          {entry.maxTp ? 'PASS' : 'FAIL'}
                        </button>
                      </td>

                      {/* 8. Max Profit */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRule(entry, 'maxProfit');
                          }}
                          className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${entry.maxProfit ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'}`}
                          title="Click to toggle Max Profit Rule (PASS / FAIL)"
                        >
                          {entry.maxProfit ? 'PASS' : 'FAIL'}
                        </button>
                      </td>
                      
                      {/* 9. Result */}
                      <td className="px-3.5 py-2 text-xs font-bold border-transparent text-left whitespace-nowrap">
                        <span className={entry.result.includes('Good') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {entry.result}
                        </span>
                      </td>

                      {/* 10. Notes */}
                      <td className="px-3.5 py-2 text-xs text-[var(--muted-foreground)] max-w-xs truncate text-left" title={displayNotes}>
                        {displayNotes}
                      </td>
                      
                      {/* 11. Actions */}
                      <td className="px-3.5 py-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEntry(entry);
                            }}
                            className="p-1 text-[var(--muted-foreground)] hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors cursor-pointer"
                            title="Edit Entry"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await confirm({
                                message: "Are you sure you want to delete this journal entry? This will also delete all linked trades.",
                                danger: true
                              });
                              if (ok) {
                                deleteEntry(entry.id);
                                if (linkedTrade) {
                                  deleteTrade(linkedTrade.id);
                                }
                              }
                            }}
                            className="p-1 text-[var(--muted-foreground)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Trades Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={12} className="px-5 py-3 bg-[var(--muted)]/20 border-b border-[var(--border)]/60">
                          <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-xs">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] mb-2.5 flex items-center justify-between">
                              <span>Trade Linked to Invoice {invNo}</span>
                              <span className="text-[11px] font-mono font-normal text-[var(--muted-foreground)]">Date: {formatDate(entry.date)}</span>
                            </h4>
                            {entryTrades.length === 0 ? (
                              <p className="text-[var(--muted-foreground)] text-xs">No trade found for {entry.pair} on {entry.date}.</p>
                            ) : (
                              <div className="space-y-2.5">
                                {entryTrades.map(trade => {
                                  const pnlVal = Math.round(Number(trade.netPnL || 0) * 100) / 100;
                                  const formattedNetPnL = pnlVal >= 0 ? `+$${pnlVal.toFixed(2)}` : `-$${Math.abs(pnlVal).toFixed(2)}`;
                                  const allRulesPassed = entry.entryRules && entry.max2Trades && entry.maxRisk && entry.maxTp && entry.maxProfit;

                                  return (
                                    <div key={trade.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-[var(--border)]/60 bg-[var(--muted)]/20 text-xs">
                                      <div className="flex flex-wrap items-center gap-5">
                                        <div>
                                          <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">{trade.symbol}</div>
                                          <div className="text-xs text-[var(--foreground)] font-bold">{trade.direction}</div>
                                        </div>
                                        {trade.entryPrice > 0 && (
                                          <div>
                                            <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Execution</div>
                                            <div className="text-xs font-mono tabular-nums text-[var(--foreground)]">{trade.entryPrice} &rarr; {trade.exitPrice}</div>
                                          </div>
                                        )}
                                        <div>
                                          <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Net P&L</div>
                                          <div className={`text-xs font-bold font-mono tabular-nums ${pnlVal >= 0 ? 'text-[var(--win)]' : 'text-[var(--loss)]'}`}>
                                            {formattedNetPnL}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Setup</div>
                                          <div className="text-xs text-[var(--foreground)]">{trade.strategy || "Order Flow"}</div>
                                        </div>
                                        <div>
                                          <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Discipline Status</div>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                              entry.result === "Good Win" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                                              entry.result === "Good Loss" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                                              entry.result === "Bad Win" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                                              "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                            }`}>
                                              {entry.result || (allRulesPassed ? "Good Trade" : "Discipline Breach")}
                                            </span>
                                            {!allRulesPassed && (
                                              <span className="text-[10px] text-[var(--muted-foreground)] font-medium">
                                                ({!entry.max2Trades ? "Overtrading: 3+ trades/day" : !entry.maxTp ? "Cut early (BE)" : !entry.maxRisk ? "Exceeded 0.5% risk" : "Rule breach"})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => setViewingTrade(trade)} 
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-200/60 dark:border-indigo-800/60 transition-colors font-medium cursor-pointer self-start sm:self-auto shrink-0"
                                      >
                                        View Trade Log &rarr;
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {entries.length > 0 && (() => {
          const effectivePageSize = pageSize === "all" ? (entries.length || 1) : pageSize;
          const totalPages = pageSize === "all" ? 1 : Math.ceil(entries.length / effectivePageSize);
          return (
            <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--card)]/50 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-3">
                <div>
                  {pageSize === "all" ? (
                    <span>Showing all <strong className="text-[var(--foreground)] font-semibold">{entries.length}</strong> entries</span>
                  ) : (
                    <span>Showing <strong className="text-[var(--foreground)] font-semibold">{Math.min(entries.length, (currentPage - 1) * effectivePageSize + 1)}</strong> to <strong className="text-[var(--foreground)] font-semibold">{Math.min(entries.length, currentPage * effectivePageSize)}</strong> of <strong className="text-[var(--foreground)] font-semibold">{entries.length}</strong> entries</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pl-3 border-l border-[var(--border)]">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Show:</span>
                  <div className="inline-flex rounded-md border border-[var(--border)] bg-[var(--muted)]/20 p-0.5 text-[11px]">
                    {([25, 50, 100, "all"] as const).map((size) => {
                      const isSelected = pageSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => {
                            setPageSize(size);
                            setCurrentPage(1);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[var(--card)] text-[var(--foreground)] shadow-2xs font-semibold"
                              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          {size === "all" ? "All" : size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {pageSize !== "all" && totalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-xs rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-40 transition-colors font-medium cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-1.5 text-[11px]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-2.5 py-1 text-xs rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-40 transition-colors font-medium cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <EditJournalModal 
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={updateEntry}
        entry={editingEntry}
      />

      <ViewTradeModal
        isOpen={!!viewingTrade}
        onClose={() => setViewingTrade(null)}
        trade={viewingTrade}
      />

      <ImportCtraderModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingTrades={trades}
        onImport={(newTrades, detectedBalance) => {
          if (newTrades.length > 0) {
            const { evaluatedTrades, journalEntries } = evaluateTradesAndJournal(newTrades, detectedBalance || 72);
            addMultipleTrades(evaluatedTrades as any);
            addMultipleEntries(journalEntries);
          }
          if (detectedBalance !== undefined && activeAccountId) {
            updateAccount(activeAccountId, { balance: detectedBalance });
          }
        }}
      />

      <AutoMatchImagesModal
        isOpen={isAutoMatchModalOpen}
        onClose={() => setIsAutoMatchModalOpen(false)}
        trades={trades}
        onApplyMatches={(updates) => {
          updates.forEach(({ tradeId, imageUrl }) => {
            const tr = trades.find(t => t.id === tradeId);
            if (tr) {
              const currentImages = tr.images || [];
              updateTrade(tradeId, { images: [...currentImages, imageUrl] });
            }
          });
        }}
      />
    </div>
  );
}
