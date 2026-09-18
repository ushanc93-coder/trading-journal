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
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading journal...</div>;

  const results = ["Good Win", "Good Loss", "Bad Win", "Bad Loss"] as const;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center py-6 bg-[var(--card)] rounded-xl border border-[var(--border)]">
        <h2 className="text-xl font-bold text-white tracking-tight">Measure your success by Process</h2>
        <p className="text-[var(--muted-foreground)]">Not by how much u made (outcome)</p>
      </div>

      {/* Process Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--foreground)] uppercase bg-[var(--muted)]/80 border-b border-[var(--border)]">
              <tr>
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
            <tbody className="divide-y divide-zinc-800/50">
              
              {/* Historical Entries */}
              {entries.map((entry) => {
                // If any rule is false, row is colored red, otherwise green
                const isFailed = !entry.entryRules || !entry.max2Trades || !entry.maxRisk || !entry.maxTp || !entry.maxProfit;
                const isExpanded = expandedEntry === entry.id;
                const entryTrades = trades.filter(t => t.date === entry.date && (entry.pair.includes(t.symbol) || t.symbol.includes(entry.pair) || entry.pair === ''));
                
                return (
                  <React.Fragment key={entry.id}>
                    <tr 
                      onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                      className={`group cursor-pointer ${isFailed ? 'bg-rose-950/20 hover:bg-rose-900/30' : 'bg-emerald-950/10 hover:bg-emerald-900/20'}`}
                    >
                      <td className={`px-4 py-3 font-mono text-xs whitespace-nowrap flex items-center ${isFailed ? 'text-rose-200' : 'text-emerald-200'}`}>
                        {isExpanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                        {entry.date}
                      </td>
                      <td className={`px-4 py-3 font-semibold ${isFailed ? 'text-white' : 'text-white'}`}>
                        {entry.pair}
                      </td>
                      <td className={`px-4 py-3 text-xs ${isFailed ? 'text-white' : 'text-[var(--muted-foreground)]'}`}>
                        {entry.session}
                      </td>
                      
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold uppercase ${entry.entryRules ? (isFailed ? 'text-white' : 'text-emerald-400') : 'text-white font-extrabold'}`}>
                          {entry.entryRules ? 'TRUE' : 'FALSE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold uppercase ${entry.max2Trades ? (isFailed ? 'text-white' : 'text-emerald-400') : 'text-white font-extrabold'}`}>
                          {entry.max2Trades ? 'TRUE' : 'FALSE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold uppercase ${entry.maxRisk ? (isFailed ? 'text-white' : 'text-emerald-400') : 'text-white font-extrabold'}`}>
                          {entry.maxRisk ? 'TRUE' : 'FALSE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold uppercase ${entry.maxTp ? (isFailed ? 'text-white' : 'text-emerald-400') : 'text-white font-extrabold'}`}>
                          {entry.maxTp ? 'TRUE' : 'FALSE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold uppercase ${entry.maxProfit ? (isFailed ? 'text-white' : 'text-emerald-400') : 'text-white font-extrabold'}`}>
                          {entry.maxProfit ? 'TRUE' : 'FALSE'}
                        </span>
                      </td>
                      
                      <td className={`px-4 py-3 text-xs font-medium ${isFailed ? 'text-white' : 'text-emerald-100'}`}>
                        {entry.result}
                      </td>
                      <td className={`px-4 py-3 text-xs ${isFailed ? 'text-rose-100' : 'text-emerald-100'}`}>
                        {entry.outcome}
                      </td>
                      
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEntry(entry);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1.5 transition-all rounded mr-1 ${isFailed ? 'text-white hover:text-emerald-200 hover:bg-emerald-500/20' : 'text-[var(--muted-foreground)] hover:text-emerald-400 hover:bg-emerald-500/10'}`}
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
                              // Sync delete: delete all associated trades
                              const linkedTrades = trades.filter(t => t.date === entry.date && t.symbol === entry.pair);
                              linkedTrades.forEach(t => deleteTrade(t.id));
                            }
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1.5 transition-all rounded ${isFailed ? 'text-white hover:text-rose-200 hover:bg-rose-500/20' : 'text-[var(--muted-foreground)] hover:text-rose-400 hover:bg-rose-500/10'}`}
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Trades Details */}
                    {isExpanded && (
                      <tr className="bg-[var(--card)]/30">
                        <td colSpan={11} className="p-0 border-b border-[var(--border)]/50">
                          <div className="px-12 py-6">
                            <h4 className="text-sm font-semibold text-white mb-4">Trades Linked to this Session</h4>
                            {entryTrades.length === 0 ? (
                              <p className="text-[var(--muted-foreground)] text-sm">No trades found for {entry.pair} on {entry.date}.</p>
                            ) : (
                              <div className="space-y-3">
                                {entryTrades.map(trade => (
                                  <div key={trade.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)]/50 bg-[var(--card)] shadow-md">
                                    <div className="flex items-center space-x-6">
                                      <div>
                                        <div className="text-xs text-[var(--muted-foreground)] font-semibold uppercase">{trade.symbol}</div>
                                        <div className="text-sm text-white font-bold">{trade.direction}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-[var(--muted-foreground)] font-semibold uppercase">Net P&L</div>
                                        <div className={`text-sm font-bold ${trade.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          {trade.netPnL >= 0 ? '+' : ''}${trade.netPnL}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-[var(--muted-foreground)] font-semibold uppercase">Setup</div>
                                        <div className="text-sm text-[var(--foreground)]">{trade.strategy}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-[var(--muted-foreground)] font-semibold uppercase">Followed Rules?</div>
                                        <div className={`text-sm font-bold ${trade.rulesFollowed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          {trade.rulesFollowed ? 'Yes' : 'No'}
                                        </div>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => setViewingTrade(trade)} 
                                      className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-500/10 transition-colors"
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
            </tbody>
          </table>
        </div>
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
