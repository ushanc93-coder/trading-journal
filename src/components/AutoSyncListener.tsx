"use client";

import { useEffect, useState } from "react";
import { useTradesContext } from "@/lib/TradesContext";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";

export default function AutoSyncListener() {
  const { addTrade } = useTradesContext();
  const [syncedBanner, setSyncedBanner] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSyncQueue = async () => {
      try {
        const res = await fetch("/api/trades/webhook");
        if (!res.ok) return;
        const data = await res.json();

        if (isMounted && data.trades && Array.isArray(data.trades) && data.trades.length > 0) {
          for (const item of data.trades) {
            // Acknowledge this trade from the server queue
            await fetch(`/api/trades/webhook?ack=${item.id}`);

            // Add trade to journal
            const { id, source, syncedAt, rawEvent, ...cleanTrade } = item;
            addTrade(cleanTrade);

            // Show celebratory toast notification
            setSyncedBanner(item);
            setTimeout(() => {
              if (isMounted) setSyncedBanner(null);
            }, 6500);
          }
        }
      } catch (err) {
        // Silent failure for polling
      }
    };

    const interval = setInterval(checkSyncQueue, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [addTrade]);

  if (!syncedBanner) return null;

  const isLong = syncedBanner.direction === "Long";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-20 right-6 z-[100] max-w-sm w-full bg-[var(--card)]/95 backdrop-blur-xl border border-emerald-500/40 shadow-2xl rounded-2xl p-3.5 text-[var(--foreground)]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Zap className="w-4 h-4 fill-emerald-500" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-500 flex items-center gap-1">
                <span>Auto-Synced</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </span>
              <h4 className="text-sm font-black flex items-center gap-1.5 text-[var(--foreground)]">
                <span>{syncedBanner.symbol}</span>
                <span className={`text-xs px-1.5 py-0.2 rounded font-bold flex items-center ${
                  isLong ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                }`}>
                  {isLong ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {syncedBanner.direction}
                </span>
              </h4>
            </div>
          </div>
          <button
            onClick={() => setSyncedBanner(null)}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2 pt-2 border-t border-[var(--border)] grid grid-cols-3 gap-1 text-[11px] font-mono">
          <div>
            <span className="text-[9px] uppercase text-[var(--muted-foreground)] block">Entry</span>
            <span className="font-bold">{syncedBanner.entryPrice}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase text-[var(--muted-foreground)] block">Lots</span>
            <span className="font-bold">{syncedBanner.lotSize}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase text-[var(--muted-foreground)] block">Session</span>
            <span className="font-bold text-indigo-500">{syncedBanner.session}</span>
          </div>
        </div>

        <div className="mt-1.5 text-[10px] text-[var(--muted-foreground)] flex items-center justify-between">
          <span>Source: {syncedBanner.source || "Webhook"}</span>
          <span className="text-emerald-500 font-semibold">Added to Journal ✓</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
