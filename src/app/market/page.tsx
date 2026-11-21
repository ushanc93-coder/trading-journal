"use client";

import { useState } from "react";
import EconomicCalendarCard from "@/components/EconomicCalendarCard";
import LiveMarketNewsCard from "@/components/LiveMarketNewsCard";
import HistoricalNewsImpactCard from "@/components/HistoricalNewsImpactCard";
import AddTradeModal from "@/components/AddTradeModal";
import { useTradesContext } from "@/lib/TradesContext";
import { 
  EVENT_INTELLIGENCE_DATABASE, 
  EventIntelligence 
} from "@/lib/economic-event-intelligence";
import { 
  Globe, 
  Calendar, 
  GraduationCap, 
  Newspaper, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Sparkles, 
  Languages, 
  Plus, 
  Search, 
  ArrowRight, 
  Target, 
  Zap, 
  AlertTriangle,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Clock
} from "lucide-react";

type ViewMode = "calendar" | "playbook" | "history" | "news";

export default function EconomicIntelPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [lang, setLang] = useState<"en" | "si">("si"); // Default to Sinhala for user comfort
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [selectedIntelKey, setSelectedIntelKey] = useState<string>("cpi");
  const [searchIntel, setSearchIntel] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const { addTrade } = useTradesContext();

  const allIntelList = Object.values(EVENT_INTELLIGENCE_DATABASE);
  const selectedIntel = EVENT_INTELLIGENCE_DATABASE[selectedIntelKey] || allIntelList[0];
  const intelContent = lang === "si" ? selectedIntel.si : selectedIntel.en;

  const filteredIntelList = allIntelList.filter((item) => {
    if (filterCategory !== "ALL" && item.category !== filterCategory) return false;
    if (searchIntel.trim()) {
      const q = searchIntel.toLowerCase();
      const matchKey = item.key.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchSummary = item.en.summary.toLowerCase().includes(q) || item.si.summary.toLowerCase().includes(q);
      if (!matchKey && !matchCategory && !matchSummary) return false;
    }
    return true;
  });

  const getVolatilityBadge = (vol: EventIntelligence["volatility"]) => {
    if (vol.includes("Extreme")) {
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    }
    if (vol.includes("High")) {
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }
    return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
  };

  return (
    <div className="space-y-4 max-w-[1880px] mx-auto pb-8">
      {/* Top Header Bar: Clean, Professional, Zero Lag */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 neumorphic-card px-5 py-4">
        {/* Title & Core Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F39F6]/10 text-[#4F39F6] flex items-center justify-center shrink-0 shadow-xs border border-[#4F39F6]/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-semibold text-[var(--foreground)] tracking-tight">
                Economic Intel &amp; Macro Education
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#4F39F6] text-white">
                PRO INTEL
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--muted-foreground)]">
              {lang === "si" 
                ? "ආර්ථික දිනදර්ශනය, පුවත් විශ්ලේෂණය සහ ICT ආයතනික අධ්‍යාපනික මධ්‍යස්ථානය" 
                : "Real-time economic catalysts, institutional impact playbooks & ICT news education"}
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[var(--muted)]/40 p-1 rounded-xl self-start lg:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === "calendar"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#4F39F6]" />
            <span>{lang === "si" ? "ආර්ථික දිනදර්ශනය" : "Economic Calendar"}</span>
          </button>

          <button
            onClick={() => setViewMode("playbook")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === "playbook"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === "si" ? "ICT News Playbook" : "News Playbook"}</span>
          </button>

          <button
            onClick={() => setViewMode("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === "history"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-500" />
            <span>{lang === "si" ? "අතීත සිදුවීම් අධ්‍යයනය" : "Case Studies"}</span>
          </button>

          <button
            onClick={() => setViewMode("news")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === "news"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 text-emerald-500" />
            <span>{lang === "si" ? "ප්‍රවෘත්ති සංග්‍රහය" : "News Wire"}</span>
          </button>
        </div>

        {/* Right: Language Switcher & Log Trade */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* Global Language Toggle */}
          <div className="flex items-center bg-[var(--muted)]/40 p-0.5 rounded-xl border border-[var(--border)]">
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === "en"
                  ? "bg-[#4F39F6] text-white shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("si")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                lang === "si"
                  ? "bg-[#4F39F6] text-white shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <Languages className="w-3 h-3" />
              <span>සිංහල</span>
            </button>
          </div>

          {/* Quick Log Trade Modal Trigger */}
          <button
            onClick={() => setIsAddTradeOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#4F39F6] hover:bg-[#4338CA] text-white shadow-sm shadow-[#4F39F6]/25 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Trade</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: ECONOMIC CALENDAR (NATIVE, INTERACTIVE, ULTRA FAST) */}
      {/* ========================================================= */}
      {viewMode === "calendar" && (
        <div className="space-y-4">
          <EconomicCalendarCard />
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: ICT NEWS EDUCATION & IMPACT PLAYBOOK               */}
      {/* ========================================================= */}
      {viewMode === "playbook" && (
        <div className="space-y-4">
          {/* 1. Educational Hero: The Anatomy of a High-Impact News Release */}
          <div className="bg-[var(--card)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)] tracking-tight">
                {lang === "si" 
                  ? "ප්‍රධාන ආර්ථික පුවතක ආයතනික අදියර 3 (The Anatomy of a News Release)" 
                  : "The Anatomy of a High-Impact News Release: Institutional Phases"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Phase 1 */}
              <div className="p-3.5 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    Phase 1: 08:00 - 08:29 AM EST
                  </span>
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <h3 className="text-xs font-semibold text-[var(--foreground)]">
                  {lang === "si" ? "පූර්ව-පුවත් පරාසය (Pre-News Range)" : "Pre-News Accumulation"}
                </h3>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                  {lang === "si"
                    ? "පුවතට පෙර වෙළඳපල ඉතා කුඩා පරාසයක (Tight Range) සිරවේ. මෙහිදී Session Highs සහ Lows වටා Buy-side / Sell-side Liquidity එකතු කරනු ලබයි."
                    : "Price coils into tight ranges, intentionally building Equal Highs and Equal Lows (Buy-Side & Sell-Side Liquidity) for algorithmic delivery."}
                </p>
              </div>

              {/* Phase 2 */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                    Phase 2: 08:30 - 08:35 AM EST
                  </span>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {lang === "si" ? "ජුදාස් ස්විං උගුල (The Judas Swing)" : "The Judas Swing Fake-Out"}
                </h3>
                <p className="text-[11px] text-amber-950/80 dark:text-amber-200/80 leading-relaxed">
                  {lang === "si"
                    ? "පළමු මිනිත්තු 1-5 තුළ ප්‍රතිවිරුද්ධ දිශාවට සිදුවන ක්ෂණික රැවටිලි චලනය. මෙය සිල්ලර Traders ලාගේ Stop Losses Sweep කර ආයතනික Orders පිරවීම සඳහා කෙරෙන්නකි."
                    : "The aggressive initial spike into opposing liquidity pools. Algorithms hunt stop orders and mitigate deep Fair Value Gaps before expanding in the true direction."}
                </p>
              </div>

              {/* Phase 3 */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    Phase 3: 08:45 AM+ EST
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <h3 className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {lang === "si" ? "සැබෑ දිශානතිය (Real Displacement)" : "Displacement & Clean Re-entry"}
                </h3>
                <p className="text-[11px] text-emerald-950/80 dark:text-emerald-200/80 leading-relaxed">
                  {lang === "si"
                    ? "M5 / M15 Market Structure Shift (MSS) තහවුරු වූ පසු, මිල Fair Value Gap (FVG) වෙත ආපසු එන විට අවම අවදානමකින් නිවැරදි Trend එකට එක්වීම."
                    : "Market structure shifts clearly on M5. Retracements back into the post-news Fair Value Gap (FVG) or Order Block provide high-probability institutional entries."}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Interactive Major Catalysts Guide & Impact Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Catalysts Selector List (4 cols) */}
            <div className="lg:col-span-4 bg-[var(--card)] p-3 sm:p-4 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#4F39F6]" />
                  <span>{lang === "si" ? "ප්‍රධාන ආර්ථික දර්ශක" : "Major Economic Catalysts"}</span>
                </h3>
                <span className="text-[10px] tabular-nums text-[var(--muted-foreground)]">
                  {filteredIntelList.length} Items
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={searchIntel}
                  onChange={(e) => setSearchIntel(e.target.value)}
                  placeholder={lang === "si" ? "දර්ශකයක් සොයන්න (CPI, NFP, GDP)..." : "Search catalyst (CPI, NFP, GDP)..."}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] focus:outline-hidden focus:border-[#4F39F6] text-[var(--foreground)]"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
                {["ALL", "Inflation", "Employment", "Central Bank / Rates", "Growth / GDP", "Consumer / Spending"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      filterCategory === cat
                        ? "bg-[#4F39F6] text-white"
                        : "bg-[var(--muted)]/30 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Catalysts List */}
              <div className="space-y-1.5 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar">
                {filteredIntelList.map((item) => {
                  const isSelected = item.key === selectedIntelKey;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setSelectedIntelKey(item.key)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[#4F39F6]/10 border-[#4F39F6] text-[#4F39F6] shadow-xs"
                          : "bg-[var(--muted)]/10 border-transparent hover:bg-[var(--muted)]/20 hover:border-[var(--border)] text-[var(--foreground)]"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs font-bold uppercase tracking-tight truncate">
                          {item.key.toUpperCase()} - {item.category}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] truncate">
                          {item.affectedPairs.slice(0, 3).join(", ")}
                        </span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? "text-[#4F39F6] translate-x-0.5" : "text-[var(--muted-foreground)]"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Catalyst Detailed Dossier (8 cols) */}
            <div className="lg:col-span-8 bg-[var(--card)] p-4 sm:p-6 rounded-2xl border border-[var(--border)] shadow-xs space-y-4">
              {/* Catalyst Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)] uppercase tracking-tight">
                      {selectedIntel.key.toUpperCase()} • {selectedIntel.category}
                    </h2>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getVolatilityBadge(selectedIntel.volatility)}`}>
                      {selectedIntel.volatility}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--muted-foreground)]">
                    <span className="font-semibold">{lang === "si" ? "බලපෑමට ලක්වන වෙළඳපලවල්:" : "Primary Assets:"}</span>
                    <span className="font-mono text-[var(--foreground)]">
                      {selectedIntel.affectedPairs.join(" • ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary & Why It Matters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--muted)]/15 border border-[var(--border)] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F39F6] block">
                    {lang === "si" ? "දර්ශකයේ හැඳින්වීම (Summary)" : "What is this Catalyst?"}
                  </span>
                  <p className="text-xs text-[var(--foreground)] leading-relaxed">
                    {intelContent.summary}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--muted)]/15 border border-[var(--border)] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                    {lang === "si" ? "වෙළඳපලට වැදගත් වන හේතුව (Why it Matters)" : "Institutional Importance"}
                  </span>
                  <p className="text-xs text-[var(--foreground)] leading-relaxed">
                    {intelContent.whyItMatters}
                  </p>
                </div>
              </div>

              {/* Bullish vs Bearish Market Reaction Matrix */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] block">
                  {lang === "si" ? "වෙළඳපල ප්‍රතිචාර ආකෘතිය (Outcome Playbook)" : "Scenario Playbook: Forecast vs Actual"}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Bullish Scenario */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {lang === "si" ? "Bullish අවස්ථාව (Actual > Forecast)" : "Bullish Outcome"}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
                      {intelContent.bullishScenario}
                    </p>
                  </div>

                  {/* Bearish Scenario */}
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {lang === "si" ? "Bearish අවස්ථාව (Actual < Forecast)" : "Bearish Outcome"}
                      </span>
                    </div>
                    <p className="text-xs text-rose-950 dark:text-rose-200 leading-relaxed font-medium">
                      {intelContent.bearishScenario}
                    </p>
                  </div>
                </div>
              </div>

              {/* ICT Smart Money Concept Tip */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#4F39F6]/10 via-[#4F39F6]/5 to-transparent border border-[#4F39F6]/30 space-y-1.5">
                <div className="flex items-center gap-2 text-[#4F39F6]">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {lang === "si" ? "ICT / Smart Money වෙළඳ උපායමාර්ගය (Trading Rule)" : "ICT Smart Money Trading Strategy"}
                  </span>
                </div>
                <p className="text-xs text-[var(--foreground)] leading-relaxed">
                  {intelContent.ictTradingTip}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Golden Capital Preservation Rules (cTrader / IC Markets execution guidelines) */}
          <div className="bg-[var(--card)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                {lang === "si" 
                  ? "cTrader / Broker ගිණුම ආරක්ෂා කරගැනීමේ ස්වර්ණමය නීති 3" 
                  : "3 Golden Rules for Capital Preservation During Red Folder News"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">
                  {lang === "si" ? "නීතිය 1: මිනිත්තු 5-15 නීතිය" : "Rule 1: The 15-Minute Rule"}
                </span>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                  {lang === "si"
                    ? "පුවත නිකුත් වන පළමු මිනිත්තු කිහිපය තුළ කිසිදු Market Order එකක් නොදමන්න. ඇල්ගොරිතම මඟින් දෙපැත්තේම Stop Loss දඩයම් කර අවසන් වන තෙක් රැඳී සිටින්න."
                    : "Never enter market orders in the first 5 minutes of high-impact releases. Let the algorithmic whipsaw conclude before planning any execution."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                  {lang === "si" ? "නීතිය 2: Spread සහ Slippage අවදානම" : "Rule 2: Spread Widening"}
                </span>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                  {lang === "si"
                    ? "cTrader හෝ IC Markets හි සාමාන්‍ය 1 pip spread එක news වෙලාවට pips 10-25 දක්වා වැඩි විය හැක. Stop Loss එකට වඩා බොහෝ ඈතින් trade එක close විය හැක (Slippage)."
                    : "Spreads can violently widen from 0.5 pips to 15-20 pips. Stop losses can suffer severe negative slippage during initial high-volatility spikes."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                  {lang === "si" ? "නීතිය 3: FVG + MSS තහවුරු වීම" : "Rule 3: Wait for FVG / MSS"}
                </span>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                  {lang === "si"
                    ? "මිනිත්තු 5 Chart එකෙහි Market Structure Shift (MSS) එකක් සහ පිරිසිදු Fair Value Gap (FVG) එකක් දර්ශනය වී, මිල නැවත එම FVG එකට පැමිණි විට පමණක් Trade කරන්න."
                    : "Wait for a distinct Market Structure Shift (MSS) on the M5 chart and enter solely on the retracement into the newly minted Fair Value Gap (FVG)."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: HISTORICAL NEWS IMPACT ARCHIVE & CASE STUDIES       */}
      {/* ========================================================= */}
      {viewMode === "history" && (
        <div className="space-y-4">
          <HistoricalNewsImpactCard />
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 4: REAL-TIME CLEAN MARKET NEWS WIRE                  */}
      {/* ========================================================= */}
      {viewMode === "news" && (
        <div className="space-y-4">
          <LiveMarketNewsCard />
        </div>
      )}

      {/* Add Trade Modal Trigger */}
      <AddTradeModal
        isOpen={isAddTradeOpen}
        onClose={() => setIsAddTradeOpen(false)}
        onAddTrade={addTrade}
      />
    </div>
  );
}
