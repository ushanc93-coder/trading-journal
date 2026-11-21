"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  RefreshCw,
  ExternalLink,
  Search,
  Flame,
  DollarSign,
  TrendingUp,
  Landmark,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Compass,
  Languages,
  X,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  analyzeNewsArticle,
  analyzeGoldMarketPulse,
  ArticleAnalysis,
  GoldMarketPulse,
} from "@/lib/macroNewsAnalyzer";

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

interface LiveMarketNewsCardProps {
  compact?: boolean;
  maxItems?: number;
}

export default function LiveMarketNewsCard({
  compact = false,
  maxItems,
}: LiveMarketNewsCardProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Gold (XAU/USD)");
  const [searchQuery, setSearchQuery] = useState("");
  const [goldPulse, setGoldPulse] = useState<GoldMarketPulse | null>(null);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [selectedModalItem, setSelectedModalItem] = useState<NewsItem | null>(null);
  const [lang, setLang] = useState<"si" | "en">("si");
  const [showPulseOverview, setShowPulseOverview] = useState<boolean>(true);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/market-news");
      if (!res.ok) throw new Error("Failed to load news feed");
      const data = await res.json();
      const newsList: NewsItem[] = data.news || [];
      
      // Ensure each item has client-side fallback analysis
      const enriched = newsList.map((item) => ({
        ...item,
        analysis: item.analysis || analyzeNewsArticle(item.title, item.summary, item.source),
      }));

      setNews(enriched);
      if (data.goldPulse) {
        setGoldPulse(data.goldPulse);
      } else {
        setGoldPulse(analyzeGoldMarketPulse(enriched));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 2 * 60 * 1000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  const filteredNews = news.filter((item) => {
    if (selectedCategory === "Gold (XAU/USD)") {
      const text = (item.title + " " + item.summary).toLowerCase();
      if (!text.includes("gold") && !text.includes("xau") && !text.includes("bullion") && !text.includes("metal")) return false;
    } else if (selectedCategory === "Reuters Wire") {
      if (!item.source.toLowerCase().includes("reuters") && !item.title.toLowerCase().includes("reuters")) return false;
    } else if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchSource = item.source.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchSource) return false;
    }
    return true;
  });

  const displayList = maxItems ? filteredNews.slice(0, maxItems) : filteredNews;

  const getSourceBadge = (source: string, title: string) => {
    const s = (source + " " + title).toLowerCase();
    if (s.includes("reuters")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#FF8000]/15 text-[#FF8000] border border-[#FF8000]/30 shadow-xs">
          REUTERS
        </span>
      );
    }
    if (s.includes("fxstreet")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-blue-500/15 text-blue-500 border border-blue-500/30">
          FXStreet
        </span>
      );
    }
    if (s.includes("forexlive")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          ForexLive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/20">
        {source || "Wire"}
      </span>
    );
  };

  const getCategoryBadge = (cat: NewsItem["category"]) => {
    switch (cat) {
      case "Fed / Rates":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
            <Landmark className="w-2.5 h-2.5" />
            FED / RATES
          </span>
        );
      case "Commodities / Gold":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-yellow-500/15 text-yellow-500 border border-yellow-500/25">
            <Flame className="w-2.5 h-2.5" />
            GOLD / XAU
          </span>
        );
      case "Forex / FX":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
            <DollarSign className="w-2.5 h-2.5" />
            FOREX / DXY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/25">
            <TrendingUp className="w-2.5 h-2.5" />
            GLOBAL MACRO
          </span>
        );
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      return formatDistanceToNow(d, { addSuffix: true }).replace("about ", "");
    } catch {
      return "Recently";
    }
  };

  const getImpactBadge = (analysis?: ArticleAnalysis) => {
    if (!analysis) return null;
    if (analysis.goldImpact === "Bullish") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
          {lang === "si" ? "Bullish (මිල ඉහළට)" : "Bullish XAU"}
        </span>
      );
    }
    if (analysis.goldImpact === "Bearish") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <ArrowDownRight className="w-3 h-3 text-rose-500" />
          {lang === "si" ? "Bearish (මිල පහළට)" : "Bearish XAU"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <Minus className="w-3 h-3 text-amber-500" />
        {lang === "si" ? "Neutral (සීමිත පරාසය)" : "Range / Neutral"}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-xs overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 bg-[var(--card)]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xs">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                Live Gold &amp; Macro Intelligence Wire
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF8000] text-white font-semibold uppercase tracking-wider">
                REUTERS WIRE
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              {lang === "si"
                ? "රන් වෙළඳපල ක්ෂණික සාර්ව ආර්ථික විශ්ලේෂණය සහ ආයෝජන සැලැස්ම (ICT Macro Analysis)"
                : "Real-time Gold (XAU/USD) Macro Analysis, Trader Bias & Instant Impact Engine"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "si" ? "en" : "si")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold transition-all shadow-xs cursor-pointer"
            title="Switch Language / භාෂාව මාරු කරන්න"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-500" />
            <span>{lang === "si" ? "සිංහල" : "English"}</span>
          </button>

          {/* Toggle Pulse Overview */}
          <button
            onClick={() => setShowPulseOverview(!showPulseOverview)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
              showPulseOverview
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
            }`}
            title="Toggle Gold Macro Pulse Overview"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === "si" ? "Gold Pulse" : "Macro Pulse"}</span>
            {showPulseOverview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Refresh */}
          <button
            onClick={fetchNews}
            disabled={loading}
            className="p-2 rounded-2xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors cursor-pointer border border-[var(--border)]"
            title="Refresh news"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. EXECUTIVE GOLD MACRO PULSE & TACTICAL PLAN (AT THE TOP) */}
      {/* ========================================================= */}
      {showPulseOverview && goldPulse && (
        <div className="p-4 border-b border-[var(--border)] bg-gradient-to-br from-amber-500/5 via-transparent to-indigo-500/5 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-[var(--border)]/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/25">
                  {lang === "si" ? "වත්මන් වෙළඳපල තත්ත්වය" : "MARKET CONDITION"}
                </span>
                <span className="text-xs font-semibold text-[var(--foreground)]">
                  {lang === "si" ? goldPulse.conditionSi : goldPulse.condition}
                </span>
              </div>
            </div>

            {/* Bias Pill & Key Levels */}
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${
                  goldPulse.bias === "Bullish"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : goldPulse.bias === "Bearish"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                }`}
              >
                {goldPulse.bias === "Bullish" && <ArrowUpRight className="w-4 h-4" />}
                {goldPulse.bias === "Bearish" && <ArrowDownRight className="w-4 h-4" />}
                {goldPulse.bias === "Consolidation / Range" && <Minus className="w-4 h-4" />}
                <span>
                  {lang === "si"
                    ? goldPulse.bias === "Bullish"
                      ? "Bullish (ඉහළට)"
                      : goldPulse.bias === "Bearish"
                      ? "Bearish (පහළට)"
                      : "Range-Bound (පරාසගත)"
                    : `${goldPulse.bias} BIAS`}
                </span>
              </div>

              <div className="text-[11px] tabular-nums px-2.5 py-1 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
                <span className="text-[var(--muted-foreground)] mr-1">Watch:</span>
                <span className="text-rose-500 font-semibold">{goldPulse.goldRange.resistance}</span>
                <span className="mx-1 text-[var(--muted-foreground)]">/</span>
                <span className="text-emerald-500 font-semibold">{goldPulse.goldRange.support}</span>
              </div>
            </div>
          </div>

          {/* Catalysts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {goldPulse.primaryCatalysts.map((cat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-1 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                  <span className="text-[var(--foreground)] truncate">
                    {lang === "si" ? cat.titleSi : cat.title}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase shrink-0 ${
                      cat.impact === "positive"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : cat.impact === "negative"
                        ? "bg-rose-500/15 text-rose-500"
                        : "bg-slate-500/15 text-slate-400"
                    }`}
                  >
                    {cat.impact === "positive" ? "Bullish" : cat.impact === "negative" ? "Bearish" : "Neutral"}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                  {lang === "si" ? cat.descSi : cat.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Actionable Execution Plan */}
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <Compass className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {lang === "si" ? "ක්‍රියාත්මක විය යුතු ආකාරය (ICT Tactical Plan)" : "ICT TACTICAL EXECUTION PLAN"}
                </span>
                <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed mt-0.5">
                  {lang === "si" ? goldPulse.tacticalPlanSi : goldPulse.tacticalPlan}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
              <span className="text-[10px] tabular-nums px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-500 font-semibold">
                Max 0.5% Risk
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="p-3 border-b border-[var(--border)]/60 space-y-2 bg-[var(--muted)]/20">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
          <input
            type="text"
            placeholder={
              lang === "si"
                ? "ප්‍රවෘත්ති සොයන්න (උදා: Gold, Reuters, CPI, Powell, Dollar)..."
                : "Search news by pair, asset, or event (e.g. Gold, Reuters, CPI, Powell)..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl pl-9 pr-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/70 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          {["Gold (XAU/USD)", "ALL", "Reuters Wire", "Fed / Rates", "Forex / FX", "Macro / Global"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? "bg-amber-500 text-black font-black shadow-xs"
                  : cat === "Gold (XAU/USD)"
                  ? "text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/20"
                  : cat === "Reuters Wire"
                  ? "text-[#FF8000] hover:bg-[#FF8000]/10 border border-[#FF8000]/20"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] border border-transparent"
              }`}
            >
              {cat === "Gold (XAU/USD)" && <Flame className="w-3.5 h-3.5" />}
              {cat === "Reuters Wire" && <Zap className="w-3.5 h-3.5" />}
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]/50 p-3 space-y-2.5">
        {loading && news.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--muted-foreground)] animate-pulse flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span>
              {lang === "si"
                ? "Reuters සහ ප්‍රධාන මූල්‍ය පුවත් සේවා සමඟ සම්බන්ධ වෙමින් පවතී..."
                : "Connecting to real-time Reuters & Global Market Wire..."}
            </span>
          </div>
        ) : displayList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {lang === "si" ? "තෝරාගත් සෙවුමට අදාළ ප්‍රවෘත්ති නොමැත" : "No headlines matching filter"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {lang === "si"
                ? "සෙවුම් වචන වෙනස් කරන්න හෝ 'ALL' තෝරා නැවත උත්සාහ කරන්න."
                : "Clear search or choose \"ALL\" to view latest stories."}
            </p>
          </div>
        ) : (
          displayList.map((item) => {
            const isExpanded = expandedArticleId === item.id;
            const analysis = item.analysis || analyzeNewsArticle(item.title, item.summary, item.source);

            return (
              <div
                key={item.id}
                className={`rounded-2xl transition-all border ${
                  isExpanded
                    ? "bg-[var(--accent)]/30 border-amber-500/40 shadow-sm"
                    : "bg-[var(--card)] hover:bg-[var(--muted)]/40 border-[var(--border)]/60"
                } p-3.5 space-y-2`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSourceBadge(item.source, item.title)}
                    {item.isBreaking && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse">
                        ⚡ BREAKING
                      </span>
                    )}
                    {getCategoryBadge(item.category)}
                    {getImpactBadge(analysis)}
                    <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums">
                      {getTimeAgo(item.pubDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Instant AI Macro Analysis Toggle Button */}
                    <button
                      onClick={() => setExpandedArticleId(isExpanded ? null : item.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                        isExpanded
                          ? "bg-amber-500 text-black font-semibold"
                          : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      }`}
                      title="View Instant Market Analysis / ක්ෂණික විශ්ලේෂණය බලන්න"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lang === "si" ? "විශ්ලේෂණය" : "Analysis"}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {/* Open external article link */}
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl text-[var(--muted-foreground)] hover:text-[#FF8000] hover:bg-[var(--muted)] transition-colors cursor-pointer"
                      title="Open full article on source site / මුල් ලිපිය බලන්න"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Headline */}
                <h4
                  onClick={() => setExpandedArticleId(isExpanded ? null : item.id)}
                  className="text-xs sm:text-sm font-bold text-[var(--foreground)] hover:text-amber-500 transition-colors leading-snug cursor-pointer"
                >
                  {item.title}
                </h4>

                {/* Snippet (Clean, no HTML artifacts) */}
                {item.summary && (
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                )}

                {/* ========================================================= */}
                {/* EXPANDABLE INLINE AI TRADER ANALYSIS PANEL               */}
                {/* ========================================================= */}
                {isExpanded && analysis && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3 bg-[var(--card)]/80 p-3.5 rounded-2xl border">
                    {/* Quick Take Banner */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {lang === "si" ? "ප්‍රධාන කරුණ (Quick Take)" : "QUICK TAKE & MARKET TAKEAWAY"}
                        </div>
                        <p className="text-xs text-[var(--foreground)] font-semibold leading-relaxed mt-0.5">
                          {lang === "si" ? analysis.quickTakeSi : analysis.quickTake}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown Grid: Mechanism & Action Plan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Macro Mechanism */}
                      <div className="p-3 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                          <Compass className="w-3 h-3" />
                          {lang === "si" ? "ඇයි රන් මිලට බලපෑම් කරන්නේ? (Mechanism)" : "WHY THIS MOVES GOLD (MACRO LOGIC)"}
                        </span>
                        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                          {lang === "si" ? analysis.macroReasoningSi : analysis.macroReasoning}
                        </p>
                      </div>

                      {/* ICT Actionable Plan */}
                      <div className="p-3 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          {lang === "si" ? "ඔබ කළ යුතු දේ (Actionable Trade Plan)" : "WHAT TRADERS SHOULD DO NOW"}
                        </span>
                        <p className="text-xs text-[var(--foreground)] leading-relaxed font-medium">
                          {lang === "si" ? analysis.actionablePlanSi : analysis.actionablePlan}
                        </p>
                      </div>
                    </div>

                    {/* Key Levels Footer */}
                    {analysis.keyLevelsToWatch && (
                      <div className="flex items-center justify-between text-xs font-mono text-[var(--muted-foreground)] bg-[var(--accent)]/20 px-3 py-1.5 rounded-xl border border-[var(--border)]">
                        <span className="font-semibold">{lang === "si" ? "අවධානය යොමු කළ යුතු සීමා:" : "Key Technical Zones:"}</span>
                        <span className="text-amber-500 font-bold">{analysis.keyLevelsToWatch}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 px-4 border-t border-[var(--border)] bg-[var(--card)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF8000]" />
          <span>Reuters + FX Financial Wire Real-Time Feed</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="font-medium text-amber-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>AI Macro Engine Active</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live ({news.length} Headlines)
          </span>
        </div>
      </div>
    </div>
  );
}
