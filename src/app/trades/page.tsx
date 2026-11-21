"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { useJournal } from "@/lib/useJournal";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Filter, Trash2, Edit2, Image as ImageIcon, Upload, ImagePlus } from "lucide-react";
import { useState } from "react";
import { Trade } from "@/lib/mock-data";
import AddTradeModal from "@/components/AddTradeModal";
import ViewTradeModal from "@/components/ViewTradeModal";
import ImportCtraderModal from "@/components/ImportCtraderModal";
import AutoMatchImagesModal from "@/components/AutoMatchImagesModal";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { X } from "lucide-react";
import { useSettingsContext } from "@/lib/SettingsContext";
import { useConfirm } from "@/lib/ConfirmContext";
import { evaluateTradesAndJournal, formatInvoiceNumber } from "@/lib/journalRuleEvaluator";

function formatPrice(price: number, symbol?: string): string {
  if (price === undefined || price === null || isNaN(price)) return "-";
  const s = symbol ? symbol.toUpperCase() : "";
  
  if (s.includes("JPY")) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  }
  if (s === "US30" || s === "US100" || s === "GER40" || s === "NAS100" || s === "SPX500") {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (s.startsWith("XAU") || s.startsWith("XAG")) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // Standard Forex (EURUSD, GBPUSD, USDCAD, EURGBP, etc.)
  if (price < 10) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 5 });
  }
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function getInvoiceNo(trade: any, index: number, total: number, sortOrder: "desc" | "asc" = "desc"): string {
  const fallbackNum = sortOrder === "desc" ? Math.max(1, total - index) : index + 1;
  return formatInvoiceNumber(trade.ticket, fallbackNum);
}

export default function TradeLogPage() {
  const { trades, isLoaded, deleteTrade, updateTrade, addMultipleTrades } = useTradesContext();
  const { entries, deleteEntry, addMultipleEntries } = useJournal();
  const { activeAccountId, updateAccount } = useSettingsContext();
  const { confirm, alert } = useConfirm();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">("all");
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAutoMatchModalOpen, setIsAutoMatchModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading trades...</div>;

  const filteredTrades = trades.filter(trade => 
    trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedTrades = [...filteredTrades].sort((a, b) => {
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
  const effectivePageSize = pageSize === "all" ? (sortedTrades.length || 1) : pageSize;
  const totalPages = pageSize === "all" ? 1 : Math.ceil(sortedTrades.length / effectivePageSize);
  const paginatedTrades = pageSize === "all" 
    ? sortedTrades 
    : sortedTrades.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);
  return (
    <div className="space-y-4 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Trade Log</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Execution history, discipline rules, and verified statement data.</p>
        </div>
        
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => {
              setSortOrder(sortOrder === "desc" ? "asc" : "desc");
              setCurrentPage(1);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--card)] hover:bg-[var(--muted)]/50 text-[var(--foreground)] border border-[var(--border)] rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            title="Sort Newest First (#TR-027 → #TR-001) or Oldest First (#TR-001 → #TR-027)"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
            <span>{sortOrder === "desc" ? "Newest First (#TR-027 ↓)" : "Oldest First (#TR-001 ↑)"}</span>
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Statement</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input 
              type="text" 
              placeholder="Search symbol or notes..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-8.5 pr-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/70 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all w-52 shadow-xs"
            />
          </div>
        </div>
      </div>

      <div className="neumorphic-card flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="text-[10.5px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider sticky top-0 z-10 bg-slate-50/70 dark:bg-white/[0.02] border-b border-[var(--border)] select-none">
              <tr>
                <th 
                  onClick={() => {
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 font-medium text-left cursor-pointer hover:text-[var(--foreground)] transition-colors select-none"
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
                  className="px-3 py-2 font-medium text-left cursor-pointer hover:text-[var(--foreground)] transition-colors select-none"
                  title="Click to toggle sort order"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <span className="text-[9px] text-indigo-500 font-bold">{sortOrder === "desc" ? "↓" : "↑"}</span>
                  </div>
                </th>
                <th className="px-3 py-2 font-medium text-left">Symbol</th>
                <th className="px-3 py-2 font-medium text-left">Side</th>
                <th className="px-3 py-2 font-medium text-right">Lots</th>
                <th className="px-3 py-2 font-medium text-right">Entry</th>
                <th className="px-3 py-2 font-medium text-right">Exit</th>
                <th className="px-3 py-2 font-medium text-right">Net P&L</th>
                <th className="px-3 py-2 font-medium text-left">Mistake</th>
                <th className="px-3 py-2 font-medium text-left">Notes</th>
                <th className="px-3 py-2 font-medium text-center">Reference</th>
                <th className="px-3 py-2 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-xs text-[var(--muted-foreground)]">
                    No trades found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((trade: any, idx: number) => {
                  const tradeIndex = pageSize === "all" ? idx : (currentPage - 1) * effectivePageSize + idx;
                  const invNo = getInvoiceNo(trade, tradeIndex, sortedTrades.length, sortOrder);
                  return (
                    <tr 
                      key={trade.id} 
                      onClick={() => setViewingTrade(trade)}
                      className="group cursor-pointer border-b border-[var(--border)]/35 hover:bg-[var(--muted)]/20 transition-colors h-8.5"
                    >
                      {/* 1. Inv No. */}
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <span className="font-mono text-[10.5px] tracking-tight tabular-nums font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
                          {invNo}
                        </span>
                      </td>

                      {/* 2. Date */}
                      <td className="px-3 py-1.5 whitespace-nowrap text-[11px] text-[var(--muted-foreground)]">
                        {format(parseISO(trade.date), 'MMM dd, yyyy')}
                      </td>

                      {/* 3. Symbol */}
                      <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-[var(--foreground)]">
                        {trade.symbol}
                      </td>

                      {/* 4. Side */}
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                          trade.direction === 'Long' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {trade.direction === 'Long' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {trade.direction}
                        </span>
                      </td>

                      {/* 5. Lots */}
                      <td className="px-3 py-1.5 whitespace-nowrap text-right text-xs text-[var(--foreground)]">
                        {trade.lotSize.toFixed(2)}
                      </td>

                      {/* 6. Entry */}
                      <td className="px-3 py-1.5 whitespace-nowrap text-right text-xs text-[var(--muted-foreground)]">
                        {formatPrice(trade.entryPrice, trade.symbol)}
                      </td>

                      {/* 7. Exit */}
                      <td className="px-3 py-1.5 whitespace-nowrap text-right text-xs text-[var(--muted-foreground)]">
                        {formatPrice(trade.exitPrice, trade.symbol)}
                      </td>

                      {/* 8. Net P&L */}
                      <td className="px-3 py-1.5 whitespace-nowrap text-right text-xs font-semibold">
                        {(() => {
                          const isPlan = trade.isPlanned || (trade.entryPrice === 0 && trade.netPnL === 0);
                          if (isPlan) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs">
                                ⏳ Plan ({trade.confluenceScore !== undefined ? trade.confluenceScore : 100}M)
                              </span>
                            );
                          }
                          const pnlVal = Math.round(Number(trade.netPnL || 0) * 100) / 100;
                          const formatted = pnlVal >= 0 ? `+$${pnlVal.toFixed(2)}` : `-$${Math.abs(pnlVal).toFixed(2)}`;
                          return (
                            <div className="flex items-center justify-end gap-1.5">
                              {trade.syncedFromStatement && (
                                <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25" title="Auto-Synced with Statement">
                                  ⚡
                                </span>
                              )}
                              <span className={
                                pnlVal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                                pnlVal < 0 ? 'text-rose-600 dark:text-rose-400' : 
                                'text-slate-500'
                              }>
                                {formatted}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 9. Mistake */}
                      <td className="px-3 py-1.5 whitespace-nowrap text-left">
                        {trade.mistake && trade.mistake !== 'None' ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {trade.mistake}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--muted-foreground)]/50">-</span>
                        )}
                      </td>

                      {/* 10. Notes */}
                      <td className="px-3 py-1.5 text-left text-xs text-[var(--muted-foreground)] max-w-xs truncate" title={trade.notes}>
                        {trade.notes || '-'}
                      </td>

                      {/* 11. Reference */}
                      <td className="px-3 py-1.5 whitespace-nowrap text-center">
                        {trade.images && trade.images.length > 0 ? (
                          <div className="flex items-center justify-center -space-x-1.5 overflow-hidden">
                            {trade.images.slice(0, 3).map((url: string, i: number) => (
                              <img 
                                key={i} 
                                src={url} 
                                alt="ref" 
                                className="inline-block h-5 w-5 rounded-md ring-1 ring-[var(--border)] object-cover cursor-pointer hover:scale-110 transition-transform relative z-10 hover:z-20" 
                                onClick={(e) => { e.stopPropagation(); setPreviewImage(url); }}
                              />
                            ))}
                            {trade.images.length > 3 && (
                              <div className="flex items-center justify-center h-5 w-5 rounded-md ring-1 ring-[var(--border)] bg-[var(--muted)] text-[9px] font-mono text-[var(--foreground)] z-0 relative">
                                +{trade.images.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--muted-foreground)]/40 text-xs">-</span>
                        )}
                      </td>

                      {/* 12. Actions */}
                      <td className="px-3 py-1.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTrade(trade);
                            }}
                            className="p-1 text-[var(--muted-foreground)] hover:text-indigo-600 hover:bg-[var(--muted)]/50 rounded transition-colors cursor-pointer"
                            title="Edit Trade"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await confirm({
                                message: "Are you sure you want to delete this trade?",
                                danger: true
                              });
                              if (ok) {
                                deleteTrade(trade.id);
                                const j = entries.find(je => {
                                  if (je.ticket && trade.ticket) {
                                    const tNum = String(trade.ticket).replace(/[^0-9]/g, '');
                                    const jNum = String(je.ticket).replace(/[^0-9]/g, '');
                                    if (tNum && jNum && tNum === jNum) return true;
                                  }
                                  return je.date === trade.date && je.pair === trade.symbol;
                                });
                                if (j) deleteEntry(j.id);
                              }
                            }}
                            className="p-1 text-[var(--muted-foreground)] hover:text-rose-600 hover:bg-[var(--muted)]/50 rounded transition-colors cursor-pointer"
                            title="Delete Trade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-[var(--border)] bg-[var(--card)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-3">
            <div>
              {sortedTrades.length === 0 ? (
                "0 trades"
              ) : pageSize === "all" ? (
                <span>
                  Showing all <strong className="text-[var(--foreground)] font-semibold">{sortedTrades.length}</strong> trades
                </span>
              ) : (
                <span>
                  Showing <strong className="text-[var(--foreground)] font-semibold">{Math.min(sortedTrades.length, (currentPage - 1) * effectivePageSize + 1)}</strong> to <strong className="text-[var(--foreground)] font-semibold">{Math.min(sortedTrades.length, currentPage * effectivePageSize)}</strong> of <strong className="text-[var(--foreground)] font-semibold">{sortedTrades.length}</strong> trades
                </span>
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
                className="px-2 py-1 text-xs rounded border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-40 transition-colors font-medium cursor-pointer"
              >
                Previous
              </button>
              <span className="px-1.5 text-[11px]">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 text-xs rounded border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-40 transition-colors font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AddTradeModal 
        isOpen={!!editingTrade} 
        onClose={() => setEditingTrade(null)} 
        initialTrade={editingTrade}
        onEditTrade={(id, trade) => updateTrade(id, trade)} 
      />

      {/* View Modal */}
      <ViewTradeModal
        isOpen={!!viewingTrade}
        onClose={() => setViewingTrade(null)}
        trade={viewingTrade}
      />

      {/* Import cTrader Statement Modal */}
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

      {previewImage && (
        <ImageViewerModal 
          src={previewImage} 
          onClose={() => setPreviewImage(null)} 
        />
      )}
    </div>
  );
}
