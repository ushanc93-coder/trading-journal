"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Sparkles, Check, CheckCircle2, Settings, Zap, ArrowUpRight, ArrowDownRight, Minus, X } from "lucide-react";
import Link from "next/link";
import { NewsItem } from "./LiveMarketNewsCard";
import { getUnderstoodNewsIds, markNewsIdAsUnderstood } from "./ReutersLiveFlashAlert";
import { ArticleAnalysis, analyzeNewsArticle } from "@/lib/macroNewsAnalyzer";

export default function NotificationBell() {
  const [unreadItem, setUnreadItem] = useState<NewsItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Listen to wire news updates from ReutersLiveFlashAlert
  useEffect(() => {
    const handleNewsUpdate = (e: any) => {
      const item: NewsItem | undefined = e.detail?.latestItem;
      const isUnderstood: boolean = e.detail?.isUnderstood ?? false;
      if (item && !isUnderstood) {
        setUnreadItem(item);
      } else {
        setUnreadItem(null);
      }
    };

    const handleUnderstood = (e: any) => {
      const id = e.detail?.id;
      if (unreadItem && unreadItem.id === id) {
        setUnreadItem(null);
      }
    };

    window.addEventListener("wire-news-update", handleNewsUpdate);
    window.addEventListener("wire-news-understood", handleUnderstood);

    return () => {
      window.removeEventListener("wire-news-update", handleNewsUpdate);
      window.removeEventListener("wire-news-understood", handleUnderstood);
    };
  }, [unreadItem]);

  const handleOpenAnalysis = () => {
    if (unreadItem) {
      window.dispatchEvent(new CustomEvent("open-wire-analysis", { detail: { item: unreadItem } }));
      setIsOpen(false);
    }
  };

  const handleUnderstood = () => {
    if (unreadItem) {
      markNewsIdAsUnderstood(unreadItem.id);
      setUnreadItem(null);
      setIsOpen(false);
    }
  };

  const analysis: ArticleAnalysis | null = unreadItem
    ? unreadItem.analysis || analyzeNewsArticle(unreadItem.title, unreadItem.summary, unreadItem.source)
    : null;

  const unreadCount = unreadItem ? 1 : 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Topbar Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-8 h-8 flex items-center justify-center rounded-full glass-pill text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-all cursor-pointer shadow-xs"
        title="Notifications & Wire Alerts"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/20">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--foreground)] text-xs">
              <Bell className="w-3.5 h-3.5 text-indigo-500" />
              <span>Notifications &amp; Wire Alerts</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleUnderstood}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                Mark as read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[360px] overflow-y-auto p-2">
            {unreadItem ? (
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-[#FF8000]/15 text-[#FF8000] border border-[#FF8000]/30">
                      <Zap className="w-2.5 h-2.5" />
                      REUTERS WIRE
                    </span>
                    {analysis && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          analysis.goldImpact === "Bullish"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : analysis.goldImpact === "Bearish"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {analysis.goldImpact === "Bullish" ? "🟢 Bullish XAU" : analysis.goldImpact === "Bearish" ? "🔴 Bearish XAU" : "🟡 Range"}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--muted-foreground)]">New</span>
                </div>

                <p className="text-xs font-semibold text-[var(--foreground)] leading-snug line-clamp-2">
                  {unreadItem.title}
                </p>

                {analysis?.quickTake && (
                  <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 leading-relaxed bg-[var(--muted)]/20 p-2 rounded-md">
                    {analysis.quickTakeSi || analysis.quickTake}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleOpenAnalysis}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#FF8000] hover:bg-[#FF8000]/90 text-black text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>විශ්ලේෂණය (Analyze)</span>
                  </button>

                  <button
                    onClick={handleUnderstood}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-[var(--card)] hover:bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    title="Mark Understood"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>තේරුම් ගත්තා</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 px-4 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/70 mx-auto" />
                <p className="text-xs font-medium text-[var(--foreground)]">All caught up!</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  No unread breaking wire dispatches. You will be notified when market catalysts break.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-[var(--border)] bg-[var(--muted)]/10 text-center">
            <Link
              href="/settings?tab=notifications"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] inline-flex items-center gap-1 font-medium transition-colors"
            >
              <Settings className="w-3 h-3" />
              <span>Notification Settings</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
