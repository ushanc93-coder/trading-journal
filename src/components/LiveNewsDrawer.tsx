"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Newspaper, X, ExternalLink, RefreshCw, Flame, Zap, 
  Search, Globe, ChevronRight, Maximize2, Minimize2,
  Sparkles, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight,
  Minus, Compass, ShieldCheck, Languages, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  analyzeNewsArticle,
  analyzeGoldMarketPulse,
  ArticleAnalysis,
  GoldMarketPulse,
} from "@/lib/macroNewsAnalyzer";
import { markNewsIdAsUnderstood } from "./ReutersLiveFlashAlert";

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  summary: string;
  category: "Fed / Rates" | "Forex / FX" | "Commodities / Gold" | "Macro / Global";
  isBreaking?: boolean;
  analysis?: ArticleAnalysis;
}

export default function LiveNewsDrawer() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [goldPulse, setGoldPulse] = useState<GoldMarketPulse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"Gold" | "Reuters" | "All">("Gold");
  const [search, setSearch] = useState("");
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [lang, setLang] = useState<"si" | "en">("si");

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/market-news");
      if (res.ok) {
        const data = await res.json();
        const list: NewsItem[] = data.news || [];
        const enriched = list.map((item) => ({
          ...item,
          analysis: item.analysis || analyzeNewsArticle(item.title, item.summary, item.source),
        }));
        setNews(enriched);
        if (data.goldPulse) {
          setGoldPulse(data.goldPulse);
        } else {
          setGoldPulse(analyzeGoldMarketPulse(enriched));
        }
      }
    } catch (e) {
      console.error("Failed to load live news", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchNews();
    const interval = setInterval(fetchNews, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      fetchNews();
    };
    window.addEventListener("open-reuters-drawer", handleOpen);
    return () => window.removeEventListener("open-reuters-drawer", handleOpen);
  }, []);

  const cleanTitle = (raw: string) => {
    return raw
      .replace(/^investingLive\s*/i, "")
      .replace(/^[a-z]+Live\s*:\s*/i, "")
      .trim();
  };

  const filtered = news.filter((item) => {
    const text = (item.title + " " + item.summary + " " + item.source).toLowerCase();
    if (filter === "Gold") {
      if (!text.includes("gold") && !text.includes("xau") && !text.includes("bullion")) return false;
    } else if (filter === "Reuters") {
      if (!item.source.toLowerCase().includes("reuters") && !item.title.toLowerCase().includes("reuters")) return false;
    }

    if (search.trim()) {
      if (!text.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const latestGoldItem = news.find((item) => {
    const t = (item.title + " " + item.summary).toLowerCase();
    return t.includes("gold") || t.includes("xau") || t.includes("bullion");
  });

  const getTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      return formatDistanceToNow(d, { addSuffix: true }).replace("about ", "");
    } catch {
      return "Recently";
    }
  };

  return (
    <>
      {/* Topbar Live Wire Pill */}
      <button
        onClick={() => {
          setIsOpen(true);
          if (news.length === 0) fetchNews();
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill hover:border-[#FF8000] transition-all text-xs font-bold text-[var(--foreground)] cursor-pointer group shadow-xs"
        title="Live Reuters & Gold Breaking News Wire"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8000] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF8000]"></span>
        </span>
        <span className="text-[#FF8000] font-black tracking-wider uppercase text-[10px]">Reuters</span>
        <span className="hidden sm:inline text-xs font-semibold text-[var(--foreground)]">Wire</span>
      </button>

      {/* Slide-over Drawer Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] overflow-hidden">
              {/* Fullscreen Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity cursor-pointer z-0"
              />

              {/* Panel Wrapper - Fixed Full Viewport Height Pinned to Right Edge */}
              <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10 pointer-events-none h-full z-10">
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className={`w-screen ${
                    isExpanded ? "max-w-3xl" : "max-w-xl"
                  } h-full h-dvh max-h-screen bg-white dark:bg-[#101622] text-[var(--foreground)] border-l border-[var(--border)] shadow-2xl flex flex-col pointer-events-auto transition-[max-width] duration-200 overflow-hidden`}
                  style={{ backgroundColor: "var(--card)" }}
                >
                  {/* Header (Pinned) */}
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-white dark:bg-[#101622] shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FF8000]/15 text-[#FF8000] flex items-center justify-center font-black text-xs border border-[#FF8000]/30 shadow-xs">
                        R
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[var(--foreground)] tracking-tight flex items-center gap-1.5">
                          Reuters &amp; Gold Intelligence Wire
                        </h3>
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          {lang === "si" ? "ක්ෂණික සාර්ව ආර්ථික විශ්ලේෂණය සහ Trade Guidance" : "Live macro catalysts, AI sentiment & trade bias"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Language Switch */}
                      <button
                        onClick={() => setLang(lang === "si" ? "en" : "si")}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/20 transition-colors cursor-pointer mr-1"
                        title="Toggle Language"
                      >
                        {lang === "si" ? "සිංහල" : "EN"}
                      </button>

                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="hidden sm:flex p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                        title={isExpanded ? "Narrow Drawer" : "Widen Drawer"}
                      >
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={fetchNews}
                        disabled={loading}
                        className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                        title="Refresh headlines"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#FF8000]" : ""}`} />
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Macro Pulse Status Header Banner */}
                  {goldPulse && (
                    <div className="p-3 bg-amber-500/10 border-b border-amber-500/25 flex items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="text-xs">
                          <span className="font-bold text-amber-600 dark:text-amber-400 mr-1.5">
                            {lang === "si" ? "රන් වෙළඳපල:" : "Gold Condition:"}
                          </span>
                          <span className="text-[var(--foreground)] font-semibold">
                            {lang === "si" ? goldPulse.conditionSi : goldPulse.condition}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-[#151D2C] border border-[var(--border)] text-[var(--foreground)] shrink-0">
                        Pivot: {goldPulse.goldRange.pivot}
                      </span>
                    </div>
                  )}

                  {/* Search & Filter Tabs (Pinned) */}
                  <div className="p-3 border-b border-[var(--border)] bg-slate-50 dark:bg-[#151D2C] space-y-2 shrink-0">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        placeholder={lang === "si" ? "Gold, Reuters, Fed, CPI සොයන්න..." : "Search Gold, Reuters, Fed, CPI..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white dark:bg-[#101622] border border-[var(--border)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[#FF8000] transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto pb-0.5">
                      <button
                        onClick={() => setFilter("Gold")}
                        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                          filter === "Gold"
                            ? "bg-amber-500 text-black shadow-xs font-black"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-white dark:bg-[#101622] border border-[var(--border)]"
                        }`}
                      >
                        <Flame className="w-3 h-3" />
                        <span>Gold (XAU)</span>
                      </button>

                      <button
                        onClick={() => setFilter("Reuters")}
                        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                          filter === "Reuters"
                            ? "bg-[#FF8000] text-white shadow-xs font-black"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-white dark:bg-[#101622] border border-[var(--border)]"
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>Reuters</span>
                      </button>

                      <button
                        onClick={() => setFilter("All")}
                        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                          filter === "All"
                            ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs font-black"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-white dark:bg-[#101622] border border-[var(--border)]"
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>All Wire</span>
                      </button>
                    </div>
                  </div>

                  {/* News Feed List (Scrollable) */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-slate-100/50 dark:bg-[#0c1018]">
                    {loading && news.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[var(--muted-foreground)] animate-pulse flex flex-col items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#FF8000]" />
                        <span>{lang === "si" ? "ප්‍රවෘත්ති ලබාගනිමින් පවතී..." : "Fetching live Reuters & commodity wires..."}</span>
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[var(--muted-foreground)] bg-white dark:bg-[#151D2C] rounded-2xl border border-[var(--border)]">
                        <p className="font-semibold text-[var(--foreground)] mb-1">
                          {lang === "si" ? "ගැලපෙන ප්‍රවෘත්ති නොමැත" : "No matching headlines"}
                        </p>
                        <p>{lang === "si" ? "'All Wire' තෝරා බලන්න." : "Select 'All Wire' to see all updates."}</p>
                      </div>
                    ) : (
                      filtered.map((item) => {
                        const isArticleExpanded = expandedArticleId === item.id;
                        const analysis = item.analysis || analyzeNewsArticle(item.title, item.summary, item.source);

                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-2xl border transition-all ${
                              isArticleExpanded
                                ? "bg-amber-500/10 border-amber-500/40 shadow-xs"
                                : "bg-white dark:bg-[#151D2C] hover:border-amber-500/40 border-[var(--border)] shadow-xs"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                    item.source.toLowerCase().includes("reuters")
                                      ? "bg-[#FF8000]/15 text-[#FF8000] border border-[#FF8000]/30"
                                      : "bg-blue-500/15 text-blue-500 border border-blue-500/25"
                                  }`}
                                >
                                  {item.source}
                                </span>

                                {item.isBreaking && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse">
                                    ⚡ BREAKING
                                  </span>
                                )}

                                {analysis && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                                      analysis.goldImpact === "Bullish"
                                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25"
                                        : analysis.goldImpact === "Bearish"
                                        ? "bg-rose-500/15 text-rose-500 border border-rose-500/25"
                                        : "bg-amber-500/15 text-amber-500 border border-amber-500/25"
                                    }`}
                                  >
                                    {analysis.goldImpact === "Bullish" ? "Bullish XAU" : analysis.goldImpact === "Bearish" ? "Bearish XAU" : "Range XAU"}
                                  </span>
                                )}

                                <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                                  {getTimeAgo(item.pubDate)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setExpandedArticleId(isArticleExpanded ? null : item.id)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    isArticleExpanded
                                      ? "bg-amber-500 text-black font-black"
                                      : "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                                  }`}
                                  title="Instant AI Analysis"
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>{lang === "si" ? "විශ්ලේෂණය" : "Analysis"}</span>
                                </button>

                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-[var(--muted-foreground)] hover:text-[#FF8000] transition-colors"
                                  title="Open Source Link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>

                            <h4
                              onClick={() => setExpandedArticleId(isArticleExpanded ? null : item.id)}
                              className="text-xs font-bold text-[var(--foreground)] hover:text-[#FF8000] transition-colors leading-snug cursor-pointer"
                            >
                              {cleanTitle(item.title)}
                            </h4>

                            {item.summary && (
                              <p className="text-[11px] text-[var(--muted-foreground)] mt-1.5 line-clamp-2 leading-relaxed">
                                {item.summary}
                              </p>
                            )}

                            {/* Expanded Analysis Drawer Card */}
                            {isArticleExpanded && analysis && (
                              <div className="mt-2.5 pt-2.5 border-t border-[var(--border)] space-y-2 bg-slate-50 dark:bg-[#101622]/80 p-2.5 rounded-xl">
                                <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  <span>{lang === "si" ? analysis.quickTakeSi : analysis.quickTake}</span>
                                </div>

                                <div className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                                  <strong className="text-[var(--foreground)] block text-[10px] uppercase font-bold text-indigo-500 mb-0.5">
                                    {lang === "si" ? "රන් මිලට බලපෑම් (Macro Logic):" : "Macro Mechanism:"}
                                  </strong>
                                  {lang === "si" ? analysis.macroReasoningSi : analysis.macroReasoning}
                                </div>

                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-[var(--foreground)]">
                                  <strong className="text-emerald-500 block text-[10px] uppercase font-bold mb-0.5">
                                    {lang === "si" ? "ඔබ කළ යුතු දේ (Action Plan):" : "Trader Action Plan:"}
                                  </strong>
                                  {lang === "si" ? analysis.actionablePlanSi : analysis.actionablePlan}
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                                    {analysis.keyLevelsToWatch ? `Zone: ${analysis.keyLevelsToWatch}` : ""}
                                  </span>
                                  <button
                                    onClick={() => markNewsIdAsUnderstood(item.id)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-semibold transition-colors cursor-pointer active:scale-95 shadow-xs"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>තේරුම් ගත්තා</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer (Pinned) */}
                  <div className="p-3 border-t border-[var(--border)] bg-white dark:bg-[#101622] flex items-center justify-between text-[11px] text-[var(--muted-foreground)] shrink-0">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-refreshes every 2 min
                    </span>
                    <span className="font-mono font-bold text-[var(--foreground)]">{filtered.length} headlines</span>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
