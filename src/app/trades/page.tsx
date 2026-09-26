"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { useJournal } from "@/lib/useJournal";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowUp, Search, Filter, Trash2, Edit2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { Trade } from "@/lib/mock-data";
import AddTradeModal from "@/components/AddTradeModal";
import ViewTradeModal from "@/components/ViewTradeModal";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { X } from "lucide-react";
import { useConfirm } from "@/lib/ConfirmContext";

export default function TradeLogPage() {
  const { trades, isLoaded, deleteTrade, clearAllTrades, updateTrade } = useTradesContext();
  const { entries, deleteEntry, clearAllEntries } = useJournal();
  const { confirm, alert } = useConfirm();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading trades...</div>;

  const filteredTrades = trades.filter(trade => 
    trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  const sortedTrades = [...filteredTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage);
  const paginatedTrades = sortedTrades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Trade Log</h2>
          <p className="text-[var(--muted-foreground)] mt-1">Review all your historical trades in detail.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input 
              type="text" 
              placeholder="Search symbol or notes..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-3xl text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors w-64"
            />
          </div>
          <button 
            onClick={async () => {
              const ok = await confirm({
                message: "Are you sure you want to delete all trades? This will wipe your dashboard clean.",
                danger: true
              });
              if (ok) {
                clearAllTrades();
                clearAllEntries();
              }
            }}
            className="flex items-center px-4 py-2 bg-[var(--loss)]/20 border border-[var(--loss)]/30 rounded-3xl text-sm font-medium text-[var(--loss)] hover:bg-[var(--loss)]/20 transition-colors"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Clear All Data
          </button>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] flex-1 overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--muted-foreground)] uppercase bg-[var(--card)]/80 sticky top-0 z-10 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Inv No.</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Symbol</th>
                <th className="px-6 py-4 font-semibold">Side</th>
                <th className="px-6 py-4 font-semibold">Lots</th>
                <th className="px-6 py-4 font-semibold">Entry</th>
                <th className="px-6 py-4 font-semibold">Exit</th>
                <th className="px-6 py-4 font-semibold">Net P&L</th>
                <th className="px-6 py-4 font-semibold">Mistake</th>
                <th className="px-6 py-4 font-semibold">Notes</th>
                <th className="px-6 py-4 font-semibold">Reference</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              
  {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    No trades found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((trade: any) => (
                  <tr 
                    key={trade.id} 
                    onClick={() => setViewingTrade(trade)}
                    className="hover:bg-[var(--muted)]/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--foreground)]">
                      {format(parseISO(trade.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-[var(--foreground)]">
                      {trade.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        trade.direction === 'Long' ? 'bg-[var(--win)]/20 text-[var(--win)]' : 'bg-[var(--loss)]/20 text-[var(--loss)]'
                      }`}>
                        {trade.direction === 'Long' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--foreground)]">
                      {trade.lotSize.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--muted-foreground)] font-mono">
                      {trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--muted-foreground)] font-mono">
                      {trade.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">
                      <span className={`${
                        trade.netPnL > 0 ? 'text-[var(--win)]' : 
                        trade.netPnL < 0 ? 'text-[var(--loss)]' : 
                        'text-[var(--be)]'
                      }`}>
                        {trade.netPnL >= 0 ? '+' : ''}${trade.netPnL.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs ${trade.mistake === 'None' ? 'text-[var(--muted-foreground)]' : 'text-amber-500'}`}>
                        {trade.mistake}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--muted-foreground)] max-w-xs truncate" title={trade.notes}>
                      {trade.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trade.images && trade.images.length > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden">
                          {trade.images.slice(0, 3).map((url: string, i: number) => (
                            <img 
                              key={i} 
                              src={url} 
                              alt="ref" 
                              className="inline-block h-8 w-8 rounded-3xl ring-2 ring-[var(--card)] object-cover cursor-pointer hover:scale-110 transition-transform relative z-10 hover:z-20" 
                              onClick={(e) => { e.stopPropagation(); setPreviewImage(url); }}
                            />
                          ))}
                          {trade.images.length > 3 && (
                            <div className="flex items-center justify-center h-8 w-8 rounded-3xl ring-2 ring-[var(--card)] bg-[var(--muted)] text-xs text-[var(--foreground)] z-0 relative">
                              +{trade.images.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTrade(trade);
                          }}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                          title="Edit Trade"
                        >
                          <Edit2 className="w-4 h-4" />
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
                              // Sync delete: if it's the only trade for this date+pair, delete the journal entry
                              const j = entries.find(je => je.date === trade.date && je.pair === trade.symbol);
                                if (j) deleteEntry(j.id);
                            }
                          }}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--loss)] hover:bg-[var(--loss)]/20 rounded transition-colors"
                          title="Delete Trade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]/30 flex items-center justify-between text-sm text-[var(--muted-foreground)]">
          <div>Showing {Math.min(filteredTrades.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredTrades.length, currentPage * itemsPerPage)} of {filteredTrades.length} trades</div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 rounded border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
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

      {previewImage && (
        <ImageViewerModal 
          src={previewImage} 
          onClose={() => setPreviewImage(null)} 
        />
      )}
    </div>
  );
}
