"use client";

import React, { useState } from "react";
import { useTradesContext } from "@/lib/TradesContext";
import { Shapes, Search, Image as ImageIcon, ExternalLink } from "lucide-react";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { Trade } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";

export default function PatternsPage() {
  const { trades, isLoaded } = useTradesContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [activePattern, setActivePattern] = useState<string>("All");
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading patterns...</div>;

  // Extract all unique patterns from all trades
  const allPatterns = new Set<string>();
  trades.forEach(trade => {
    if (trade.patterns) {
      trade.patterns.forEach(p => allPatterns.add(p));
    }
  });
  
  const patternTabs = ["All", ...Array.from(allPatterns)].sort();
  
  // Filter trades that have at least one image AND some patterns
  const tradesWithPatterns = trades.filter(t => t.images && t.images.length > 0 && t.patterns && t.patterns.length > 0);
  
  // Filter by active pattern and search term
  const displayTrades = tradesWithPatterns.filter(trade => {
    const matchesPattern = activePattern === "All" || (trade.patterns && trade.patterns.includes(activePattern));
    const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (trade.patterns && trade.patterns.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesPattern && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Shapes className="w-6 h-6 mr-2 text-[var(--primary)]" />
            Chart Patterns Library
          </h2>
          <p className="text-[var(--muted-foreground)] mt-1">
            An auto-generated educational gallery of your best setups, identified by AI.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input 
            type="text"
            placeholder="Search patterns or symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[var(--card)] border border-[var(--border)] rounded-md pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--primary)] w-64"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {patternTabs.map(pattern => (
          <button
            key={pattern}
            onClick={() => setActivePattern(pattern)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              activePattern === pattern
                ? 'bg-[var(--primary)]/20 text-indigo-300 border-[var(--primary)]/50'
                : 'bg-[var(--card)]/50 text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]'
            }`}
          >
            {pattern}
          </button>
        ))}
      </div>

      {displayTrades.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--card)]/20 border border-[var(--border)] rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-[var(--card)] rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Patterns Found</h3>
          <p className="text-[var(--muted-foreground)] max-w-md">
            Save a trade with a chart screenshot. The AI will automatically scan it and tag classic patterns here for you to study later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
          {displayTrades.map(trade => (
            <div key={trade.id} className="bg-[#111115] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--primary)]/30 transition-colors group flex flex-col">
              <div 
                className="aspect-video relative overflow-hidden bg-[var(--card)] cursor-pointer"
                onClick={() => setViewingImage(trade.images![0])}
              >
                <img 
                  src={trade.images![0]} 
                  alt="Chart" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-white flex items-center">
                      {trade.symbol}
                      <span className={`ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                        trade.direction === 'Long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {trade.direction}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {format(parseISO(trade.date), 'MMM d, yyyy')} • {trade.session}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${trade.status === 'Win' ? 'text-emerald-400' : trade.status === 'Loss' ? 'text-rose-400' : 'text-[var(--muted-foreground)]'}`}>
                    {trade.netPnL > 0 ? '+' : ''}{trade.netPnL}
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {trade.patterns?.map((pattern, i) => (
                      <span key={i} className="text-xs bg-[var(--primary)]/10 text-indigo-300 px-2 py-1 rounded-md border border-[var(--primary)]/20">
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingImage && (
        <ImageViewerModal 
          onClose={() => setViewingImage(null)} 
          src={viewingImage} 
        />
      )}
    </div>
  );
}
