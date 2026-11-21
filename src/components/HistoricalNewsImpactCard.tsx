"use client";

import { useState } from "react";
import { 
  HISTORICAL_CASE_STUDIES, 
  HistoricalCaseStudy 
} from "@/lib/economic-event-intelligence";
import { 
  GraduationCap, 
  Languages, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Calendar, 
  Target, 
  ShieldAlert,
  ChevronRight
} from "lucide-react";

export default function HistoricalNewsImpactCard() {
  const [lang, setLang] = useState<"en" | "si">("en");
  const [selectedCase, setSelectedCase] = useState<HistoricalCaseStudy>(HISTORICAL_CASE_STUDIES[0]);

  const getOutcomeBadge = (outcome: HistoricalCaseStudy["outcomeType"]) => {
    switch (outcome) {
      case "Bullish Spike":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "Bearish Liquidity Dump":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "Judas Swing Reversal":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      default:
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
    }
  };

  const caseContent = lang === "si" ? selectedCase.si : selectedCase.en;

  return (
    <div className="flex flex-col h-full bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-3.5 sm:p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--muted)]/15">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4F39F6]/15 text-[#4F39F6] flex items-center justify-center">
            <GraduationCap className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[var(--foreground)] tracking-tight flex items-center gap-1.5">
              <span>{lang === "si" ? "පසුගිය ප්‍රධාන පුවත් සහ වෙළඳපල බලපෑම් (History & Education)" : "Historical News Impacts & Market Case Studies"}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#4F39F6] text-white font-extrabold uppercase">
                Archive
              </span>
            </h3>
            <p className="text-[10px] sm:text-[11px] text-[var(--muted-foreground)]">
              {lang === "si" 
                ? "අතීතයේ ආර්ථික පුවත් නිසා වෙළඳපල චලනය වූ ආකාරය සහ ICT ආයතනික පාඩම්" 
                : "Real institutional case studies: How past news releases engineered liquidity"}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-[var(--card)] p-0.5 rounded-xl border border-[var(--border)] shadow-xs self-start sm:self-auto">
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
      </div>

      {/* Main Grid: Left Selector List + Right Detailed Case Study */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)] overflow-hidden">
        {/* Left Case Studies Selector (5 cols) */}
        <div className="lg:col-span-5 p-2 sm:p-3 space-y-2 overflow-y-auto max-h-[320px] lg:max-h-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] px-2 block mb-1">
            {lang === "si" ? "සිදුවීම් ලැයිස්තුව (තෝරා බලන්න)" : "Select Case Study to Inspect"}
          </span>

          {HISTORICAL_CASE_STUDIES.map((item) => {
            const isSelected = item.id === selectedCase.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedCase(item)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-[#4F39F6]/10 border-[#4F39F6] shadow-xs"
                    : "bg-[var(--muted)]/10 hover:bg-[var(--muted)]/25 border-transparent hover:border-[var(--border)]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-[var(--muted)]/30 text-[var(--foreground)]">
                      {item.currency}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getOutcomeBadge(item.outcomeType)}`}>
                      {item.outcomeType}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                      {item.date}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--foreground)] truncate">
                    {lang === "si" ? item.si.title : item.en.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--muted-foreground)] font-mono">
                    <span className="text-emerald-500 font-bold">{item.pipMove}</span>
                    <span>•</span>
                    <span>{item.affectedInstrument}</span>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-[#4F39F6] translate-x-0.5" : "text-[var(--muted-foreground)]/50"}`} />
              </button>
            );
          })}
        </div>

        {/* Right Detail Inspection Panel (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between space-y-4 overflow-y-auto">
          <div className="space-y-3.5">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-[#4F39F6] text-white">
                  {selectedCase.currency}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getOutcomeBadge(selectedCase.outcomeType)}`}>
                  {selectedCase.outcomeType}
                </span>
                <span className="text-xs text-[var(--muted-foreground)] font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedCase.date}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[var(--foreground)] tracking-tight">
                {caseContent.title}
              </h3>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[var(--muted)]/15 border border-[var(--border)] text-center">
              <div>
                <span className="text-[9.5px] font-bold uppercase text-[var(--muted-foreground)] block">
                  {lang === "si" ? "අපේක්ෂිත (Forecast)" : "Forecast"}
                </span>
                <span className="text-xs font-bold font-mono text-[var(--foreground)]">
                  {selectedCase.forecast}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] font-bold uppercase text-[var(--muted-foreground)] block">
                  {lang === "si" ? "සැබෑ අගය (Actual)" : "Actual Print"}
                </span>
                <span className="text-xs font-black font-mono text-emerald-500">
                  {selectedCase.actual}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] font-bold uppercase text-[var(--muted-foreground)] block">
                  {lang === "si" ? "වෙළඳපල චලනය" : "Pip Impact"}
                </span>
                <span className="text-xs font-black font-mono text-[#4F39F6]">
                  {selectedCase.pipMove}
                </span>
              </div>
            </div>

            {/* Event Description */}
            <div className="p-3.5 rounded-xl bg-[var(--muted)]/10 border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#4F39F6]" />
                {lang === "si" ? "වෙළඳපල තුළ සිදු වූ දෙය (What Happened)" : "Market Movement Breakdown"}
              </span>
              <p className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed">
                {caseContent.description}
              </p>
            </div>

            {/* ICT Smart Money Education Lesson */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#4F39F6]/15 via-[#4F39F6]/10 to-transparent border border-[#4F39F6]/30 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4F39F6] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {lang === "si" ? "ICT ආයතනික වෙළඳාම් පාඩම (Key Takeaway)" : "Institutional Smart Money Rule"}
              </span>
              <p className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed">
                {caseContent.ictLesson}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border)]/60 text-[10px] text-[var(--muted-foreground)] flex items-center justify-between">
            <span>Trading Journal Educational Archive</span>
            <span className="text-[#4F39F6] font-bold">Future Education Tab Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
