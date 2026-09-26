"use client";

import React, { useState } from "react";
import { useJournal, ProcessEntry } from "@/lib/useJournal";
import { useTradesContext } from "@/lib/TradesContext";
import { Trash2, Plus, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import EditJournalModal from "@/components/EditJournalModal";
import ViewTradeModal from "@/components/ViewTradeModal";
import { Trade } from "@/lib/mock-data";
import { useConfirm } from "@/lib/ConfirmContext";

export default function DailyJournalPage() {
  const { entries, addEntry, deleteEntry, updateEntry, isLoaded } = useJournal();
  const { trades, isLoaded: tradesLoaded, deleteTrade } = useTradesContext();
  const { confirm } = useConfirm();
  
  const [editingEntry, setEditingEntry] = useState<ProcessEntry | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading journal...</div>;

  const results = ["Good Win", "Good Loss", "Bad Win", "Bad Loss"] as const;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center py-6 bg-[var(--card)] rounded-3xl border border-[var(--border)]">
        <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Measure your success by Process</h2>
        <p className="text-[var(--muted-foreground)]">Not by how much u made (outcome)</p>
      </div>

      {/* Process Table */}
      <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--card)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-4 font-semibold w-24">Inv No.</th>
                <th className="px-4 py-4 font-semibold whitespace-nowrap w-28">Date</th>
                <th className="px-4 py-4 font-semibold min-w-[100px]">Pair</th>
                <th className="px-4 py-4 font-semibold min-w-[120px]">Session</th>
                <th className="px-4 py-4 font-semibold text-center">Entry rules</th>
                <th className="px-4 py-4 font-semibold text-center">Max 2 trades rule</th>
                <th className="px-4 py-4 font-semibold text-center">Max 0.5% risk rule</th>
                <th className="px-4 py-4 font-semibold text-center">MAX 2R tp rule</th>
                <th className="px-4 py-4 font-semibold text-center">Max 2% profit rule</th>
                <th className="px-4 py-4 font-semibold w-32">Result</th>
                <th className="px-4 py-4 font-semibold">Outcome</th>
                <th className="px-4 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              
              {/* Historical Entries */}
              {(() => {
                const totalPages = Math.ceil(entries.length / itemsPerPage);
                const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const paginatedEntries = sortedEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                return (
                  <>
              {paginatedEntries.map((entry) => {
                // If any rule is false, row is colored red, otherwise green
                const isFailed = !entry.entryRules || !entry.max2Trades || !entry.maxRisk || !entry.maxTp || !entry.maxProfit;
                const isExpanded = expandedEntry === entry.id;
                const entryTrades = trades.filter(t => t.date === entry.date && (entry.pair.includes(t.symbol) || t.symbol.includes(entry.pair) || entry.pair === ''));
                
                return (
                  <React.Fragment key={entry.id}>
                    <tr 
                      onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                      className="group cursor-pointer hover:bg-[var(--muted)]/30 transition-colors border-b border-[var(--border)]/50 last:border-0"
                    >
                      <td className="px-4 py-4 font-mono text-xs font-semibold text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
                        <div className="flex items-center">
                          {isExpanded ? <ChevronDown className="w-4 h-4 mr-1.5" /> : <ChevronRight className="w-4 h-4 mr-1.5" />}
                          {entry.ticket || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs whitespace-nowrap flex items-center text-[var(--muted-foreground)] transition-colors">
                        {entry.date}
                      </td>
                      <td className="px-4 py-4 font-bold text-[var(--foreground)]">
                        {entry.pair}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-[var(--muted-foreground)]">
                        {entry.session}
                      </td>
                      
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${entry.entryRules ? 'bg-[var(--win)]/10 text-[var(--win)] border border-[var(--win)]/20' : 'bg-[var(--loss)]/10 text-[var(--loss)] border border-[var(--loss)]/20'}`}>
                          {entry.entryRules ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${entry.max2Trades ? 'bg-[var(--win)]/10 text-[var(--win)] border border-[var(--win)]/20' : 'bg-[var(--loss)]/10 text-[var(--loss)] border border-[var(--loss)]/20'}`}>
                          {entry.max2Trades ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${entry.maxRisk ? 'bg-[var(--win)]/10 text-[var(--win)] border border-[var(--win)]/20' : 'bg-[var(--loss)]/10 text-[var(--loss)] border border-[var(--loss)]/20'}`}>
                          {entry.maxRisk ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${entry.maxTp ? 'bg-[var(--win)]/10 text-[var(--win)] border border-[var(--win)]/20' : 'bg-[var(--loss)]/10 text-[var(--loss)] border border-[var(--loss)]/20'}`}>
                          {entry.maxTp ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${entry.maxProfit ? 'bg-[var(--win)]/10 text-[var(--win)] border border-[var(--win)]/20' : 'bg-[var(--loss)]/10 text-[var(--loss)] border border-[var(--loss)]/20'}`}>
                          {entry.maxProfit ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4 text-xs font-bold">
                        <span className={entry.result.includes('Good') ? 'text-[var(--win)]' : 'text-[var(--loss)]'}>
                          {entry.result}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-[var(--muted-foreground)] max-w-[200px] truncate" title={entry.outcome}>
                        {entry.outcome}
                      </td>
                      
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEntry(entry);
                            }}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-md transition-colors"
                            title="Edit entry"
                          >
                            <Pencil className="w-4 h-4" />
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
                                const linkedTrades = trades.filter(t => t.date === entry.date && t.symbol === entry.pair);
                                linkedTrades.forEach(t => deleteTrade(t.id));
                              }
                            }}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--loss)] hover:bg-[var(--loss)]/10 rounded-md transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Trades Details */}
                    {isExpanded && (
                      <tr className="bg-[var(--card)]/30">
                        <td colSpan={12} className="p-0 border-b border-[var(--border)]/50">
                          <div className="px-12 py-6">
                            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">Trades Linked to this Session</h4>
                            {entryTrades.length === 0 ? (
                              <p className="text-[var(--muted-foreground)] text-sm">No trades found for {entry.pair} on {entry.date}.</p>
                            ) : (
                              <div className="space-y-3">
                                {entryTrades.map(trade => (
                                  <div key={trade.id} className="flex items-center justify-between p-4 rounded-3xl border border-[var(--border)]/50 bg-[var(--card)] shadow-md">
                                    <div className="flex items-center space-x-6">
                                      <div>
                                        <div className="text-xs text-[var(--muted-foreground)] font-semibold uppercase">{trade.symbol}</div>
                                        <div className="text-sm text-[var(--foreground)] font-bold">{trade.direction}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-[var(--muted-foreground)] font-semibold uppercase">Net P&L</div>
                                        <div className={`text-sm font-bold ${trade.netPnL >= 0 ? 'text-[var(--win)]' : 'text-[var(--loss)]'}`}>
                                          {trade.netPnL >= 0 ? '+' : ''}${trade.netPnL}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-[var(--muted-foreground)] font-semibold uppercase">Setup</div>
                                        <div className="text-sm text-[var(--foreground)]">{trade.strategy}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-[var(--muted-foreground)] font-semibold uppercase">Followed Rules?</div>
                                        <div className={`text-sm font-bold ${trade.rulesFollowed ? 'text-[var(--win)]' : 'text-[var(--loss)]'}`}>
                                          {trade.rulesFollowed ? 'Yes' : 'No'}
                                        </div>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => setViewingTrade(trade)} 
                                      className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-3xl hover:bg-blue-500/10 transition-colors"
                                    >
                                      View Trade Log
                                    </button>
                                  </div>
                                ))}
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
        {entries.length > 0 && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]/30 flex items-center justify-between text-sm text-[var(--muted-foreground)]">
            <div>Showing {Math.min(entries.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(entries.length, currentPage * itemsPerPage)} of {entries.length} entries</div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(entries.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(entries.length / itemsPerPage) || Math.ceil(entries.length / itemsPerPage) === 0}
                className="px-3 py-1 rounded border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
    </div>
  );
}
