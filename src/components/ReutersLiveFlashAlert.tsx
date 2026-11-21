"use client";

import { useState, useEffect, useRef } from "react";
import {
  Flame,
  Zap,
  Sparkles,
  X,
  ExternalLink,
  Check,
  Languages,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { NewsItem } from "./LiveMarketNewsCard";
import { analyzeNewsArticle, ArticleAnalysis } from "@/lib/macroNewsAnalyzer";
import { useSettingsContext } from "@/lib/SettingsContext";
import { playNotificationChime } from "@/lib/notificationSound";

export function getUnderstoodNewsIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("understood_news_ids");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markNewsIdAsUnderstood(id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getUnderstoodNewsIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem("understood_news_ids", JSON.stringify(ids.slice(-100)));
    }
  } catch {}
  window.dispatchEvent(new CustomEvent("wire-news-understood", { detail: { id } }));
}

export default function ReutersLiveFlashAlert() {
  const { preferences } = useSettingsContext();
  const notifSettings = preferences.notifications || {
    enableNewsPopups: true,
    popupDurationSeconds: 8,
    enableNewsSound: true,
    filterGoldOnly: true,
  };

  const [latestItem, setLatestItem] = useState<NewsItem | null>(null);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [lang, setLang] = useState<"si" | "en">("si");
  const [isHovered, setIsHovered] = useState(false);

  const lastSeenIdRef = useRef<string | null>(null);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastDuration = notifSettings.popupDurationSeconds ?? 8;

  const startAutoDismissTimer = () => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    // 0 means manual close only
    if (toastDuration > 0) {
      autoDismissTimerRef.current = setTimeout(() => {
        setIsAlertVisible(false);
      }, toastDuration * 1000);
    }
  };

  const pauseAutoDismissTimer = () => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
  };

  const checkLatestNews = async () => {
    try {
      const res = await fetch("/api/market-news");
      if (!res.ok) return;
      const data = await res.json();
      const list: NewsItem[] = data.news || [];
      if (list.length === 0) return;

      const understoodIds = getUnderstoodNewsIds();

      // Filter based on user preferences
      const candidateItems = list.filter((item) => {
        if (!notifSettings.filterGoldOnly) return true;
        const text = (item.title + " " + item.summary + " " + item.source).toLowerCase();
        return (
          (text.includes("gold") || text.includes("xau") || text.includes("bullion") || text.includes("precious")) &&
          (text.includes("reuters") || item.source.toLowerCase().includes("reuters") || item.isBreaking)
        );
      });

      const topItem = candidateItems[0] || list[0];
      if (!topItem) return;

      // Broadcast latest candidate to notification bell
      const isAlreadyUnderstood = understoodIds.includes(topItem.id);

      window.dispatchEvent(
        new CustomEvent("wire-news-update", {
          detail: {
            latestItem: topItem,
            isUnderstood: isAlreadyUnderstood,
          },
        })
      );

      // If already marked as understood, don't popup or notify
      if (isAlreadyUnderstood) {
        setLatestItem(topItem);
        setIsAlertVisible(false);
        return;
      }

      // Check if newly arrived item or first time detecting unread item
      if (lastSeenIdRef.current !== topItem.id) {
        lastSeenIdRef.current = topItem.id;
        setLatestItem(topItem);

        // Show popup toast if enabled in user preferences
        if (notifSettings.enableNewsPopups !== false) {
          setIsAlertVisible(true);
          startAutoDismissTimer();
        }

        // Play chime sound if enabled in user preferences
        if (notifSettings.enableNewsSound !== false) {
          playNotificationChime();
        }
      }
    } catch {
      // Ignore background poll errors
    }
  };

  useEffect(() => {
    checkLatestNews();
    // Poll every 45s for rapid Reuters updates
    const interval = setInterval(checkLatestNews, 45 * 1000);
    return () => {
      clearInterval(interval);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    };
  }, [
    notifSettings.enableNewsPopups,
    notifSettings.popupDurationSeconds,
    notifSettings.enableNewsSound,
    notifSettings.filterGoldOnly,
  ]);

  // Listen to external triggers (e.g. from Bell dropdown)
  useEffect(() => {
    const handleOpenAnalysis = (e: any) => {
      if (e.detail?.item) {
        setLatestItem(e.detail.item);
      }
      setIsAnalysisModalOpen(true);
    };

    const handleUnderstood = (e: any) => {
      const understoodId = e.detail?.id;
      if (latestItem && latestItem.id === understoodId) {
        setIsAlertVisible(false);
        setIsAnalysisModalOpen(false);
      }
      checkLatestNews();
    };

    const handleReset = () => {
      localStorage.removeItem("understood_news_ids");
      lastSeenIdRef.current = null;
      checkLatestNews();
    };

    window.addEventListener("open-wire-analysis", handleOpenAnalysis);
    window.addEventListener("wire-news-understood", handleUnderstood);
    window.addEventListener("reset-wire-understood", handleReset);

    return () => {
      window.removeEventListener("open-wire-analysis", handleOpenAnalysis);
      window.removeEventListener("wire-news-understood", handleUnderstood);
      window.removeEventListener("reset-wire-understood", handleReset);
    };
  }, [latestItem]);

  const handleUnderstoodClick = () => {
    if (latestItem) {
      markNewsIdAsUnderstood(latestItem.id);
    }
    setIsAlertVisible(false);
    setIsAnalysisModalOpen(false);
  };

  const analysis: ArticleAnalysis | null = latestItem
    ? latestItem.analysis || analyzeNewsArticle(latestItem.title, latestItem.summary, latestItem.source)
    : null;

  return (
    <>
      {/* 1. Floating Live Wire Alert Toast (Auto-dismissable with timer bar) */}
      <AnimatePresence>
        {isAlertVisible && latestItem && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onMouseEnter={() => {
              setIsHovered(true);
              pauseAutoDismissTimer();
            }}
            onMouseLeave={() => {
              setIsHovered(false);
              startAutoDismissTimer();
            }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] max-w-lg w-[95%] sm:w-auto"
          >
            <div className="bg-[#0F172A] text-slate-100 border border-[#FF8000]/60 shadow-xl rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-3 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#FF8000]/20 text-[#FF8000] border border-[#FF8000]/40 flex items-center justify-center font-black text-xs shrink-0">
                  <Zap className="w-3.5 h-3.5 text-[#FF8000]" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF8000]">
                      REUTERS WIRE FLASH
                    </span>
                    {analysis && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          analysis.goldImpact === "Bullish"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : analysis.goldImpact === "Bearish"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        }`}
                      >
                        {analysis.goldImpact === "Bullish" ? "🟢 Bullish" : analysis.goldImpact === "Bearish" ? "🔴 Bearish" : "🟡 Range"}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold truncate max-w-[260px] sm:max-w-[320px] text-slate-100">
                    {latestItem.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsAnalysisModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#FF8000] hover:bg-[#FF8000]/90 text-black font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>විශ්ලේෂණය</span>
                </button>

                <button
                  onClick={() => setIsAlertVisible(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                  title="Dismiss pop-up (Will remain in Bell until understood)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Smooth auto-dismiss timer progress line at bottom */}
              {toastDuration > 0 && !isHovered && (
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: toastDuration, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-[2px] bg-[#FF8000]/80"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Detailed Instant Macro Analysis Modal */}
      <AnimatePresence>
        {isAnalysisModalOpen && latestItem && analysis && (
          <div className="fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl max-w-xl w-full shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FF8000]/15 text-[#FF8000] border border-[#FF8000]/30 flex items-center justify-center font-black">
                    <Flame className="w-4 h-4 text-[#FF8000]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#FF8000]">
                        REUTERS LIVE MACRO ANALYSIS
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          analysis.goldImpact === "Bullish"
                            ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                            : analysis.goldImpact === "Bearish"
                            ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                        }`}
                      >
                        {analysis.goldImpact === "Bullish"
                          ? "🟢 Bullish (රන් මිල ඉහළට)"
                          : analysis.goldImpact === "Bearish"
                          ? "🔴 Bearish (රන් මිල පහළට)"
                          : "🟡 Range / Consolidation"}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      {latestItem.source} Wire Dispatch • Verified Macro Catalyst
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLang(lang === "si" ? "en" : "si")}
                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--accent)]/80 cursor-pointer flex items-center gap-1"
                    title="Change language"
                  >
                    <Languages className="w-3 h-3" />
                    <span>{lang === "si" ? "සිංහල" : "English"}</span>
                  </button>
                  <button
                    onClick={() => setIsAnalysisModalOpen(false)}
                    className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--accent)] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-semibold text-[var(--foreground)] leading-snug">
                  {latestItem.title}
                </h3>
                {latestItem.summary && (
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {latestItem.summary}
                  </p>
                )}
              </div>

              {/* Quick Take Banner */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {lang === "si" ? "ප්‍රධාන සාරාංශය (Quick Take)" : "EXECUTIVE SUMMARY"}
                </span>
                <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">
                  {lang === "si" ? analysis.quickTakeSi : analysis.quickTake}
                </p>
              </div>

              {/* Why This Moves Gold */}
              <div className="p-3 rounded-lg bg-[var(--accent)]/30 border border-[var(--border)] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                  {lang === "si" ? "ඇයි වෙළඳපල ඔබ හිතපු පැත්තට නොගියේ? (Macro Mechanism)" : "WHY THE MARKET MOVED (MACRO MECHANISM)"}
                </span>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {lang === "si" ? analysis.macroReasoningSi : analysis.macroReasoning}
                </p>
              </div>

              {/* Action Plan */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {lang === "si" ? "ඔබ දැන් කළ යුතු දේ (Action Plan)" : "WHAT TO DO NEXT"}
                </span>
                <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">
                  {lang === "si" ? analysis.actionablePlanSi : analysis.actionablePlan}
                </p>
              </div>

              {/* Key Technical Levels */}
              {analysis.keyLevelsToWatch && (
                <div className="flex items-center justify-between text-xs tabular-nums p-2.5 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
                  <span className="text-[var(--muted-foreground)] text-xs">Key Zones:</span>
                  <span className="text-amber-500 font-semibold">{analysis.keyLevelsToWatch}</span>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <a
                  href={latestItem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--muted-foreground)] hover:text-[#FF8000] flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>මුල් ලිපිය කියවන්න (Read Source)</span>
                </a>

                <button
                  onClick={handleUnderstoodClick}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>තේරුම් ගත්තා (Understood)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
