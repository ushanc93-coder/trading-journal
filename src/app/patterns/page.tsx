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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight flex items-center">
            <Shapes className="w-5 h-5 mr-2 text-[var(--primary)]" />
            Chart Patterns Library
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Auto-catalogued gallery of your historical trade setups and patterns.
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input 
            type="text" 
            placeholder="Search patterns or symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[var(--card)] border border-[var(--border)] rounded-full pl-8.5 pr-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56 shadow-xs"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {patternTabs.map(pattern => (
          <button
            key={pattern}
            onClick={() => setActivePattern(pattern)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              activePattern === pattern
                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)] hover:bg-[var(--muted)]/50'
            }`}
          >
            {pattern}
          </button>
        ))}
      </div>

      {displayTrades.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center neumorphic-card p-10 text-center">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-3">
            <ImageIcon className="w-6 h-6 text-indigo-500" />
          </div>
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">No Patterns Found</h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-md leading-relaxed">
            Save a trade with a chart screenshot. The AI will automatically scan it and tag classic patterns here for you to study later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
          {displayTrades.map(trade => (
            <div key={trade.id} className="neumorphic-card neumorphic-card-hover overflow-hidden group flex flex-col">
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
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <div className="font-bold text-xs text-[var(--foreground)] flex items-center">
                      {trade.symbol}
                      <span className={`ml-2 text-[9px] uppercase px-1.5 py-0.2 rounded-full font-semibold ${
                        trade.direction === 'Long' ? 'bg-[var(--win)]/15 text-[var(--win)]' : 'bg-[var(--loss)]/15 text-[var(--loss)]'
                      }`}>
                        {trade.direction}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                      {format(parseISO(trade.date), 'MMM d, yyyy')} • {trade.session}
                    </div>
                  </div>
                  <div className={`text-xs font-bold font-mono tabular-nums ${trade.status === 'Win' ? 'text-[var(--win)]' : trade.status === 'Loss' ? 'text-[var(--loss)]' : 'text-[var(--muted-foreground)]'}`}>
                    {trade.netPnL > 0 
                      ? `+$${trade.netPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : trade.netPnL < 0 
                      ? `-$${Math.abs(trade.netPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : `$0.00`}
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="flex flex-wrap gap-1">
                    {trade.patterns?.map((pattern, i) => (
                      <span key={i} className="text-[10px] bg-[var(--primary)]/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-[var(--primary)]/20 font-semibold">
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
