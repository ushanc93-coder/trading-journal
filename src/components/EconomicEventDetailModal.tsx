"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Globe, 
  Languages, 
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { CalendarEvent } from "./EconomicCalendarCard";
import { matchEventIntelligence } from "@/lib/economic-event-intelligence";

interface EconomicEventDetailModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
}

export default function EconomicEventDetailModal({
  isOpen,
  event,
  onClose
}: EconomicEventDetailModalProps) {
  const [lang, setLang] = useState<"en" | "si">("en");

  if (!isOpen || !event) return null;

  const intel = matchEventIntelligence(event.title);
  const content = lang === "si" ? intel.si : intel.en;

  const evDate = (() => {
    try {
      return parseISO(event.date);
    } catch {
      return new Date();
    }
  })();

  const timeRemainingStr = (() => {
    try {
      const diffMs = evDate.getTime() - Date.now();
      const absDiffMs = Math.abs(diffMs);
      const totalMinutes = Math.floor(absDiffMs / 60000);
      const days = Math.floor(totalMinutes / 1440);
      const hours = Math.floor((totalMinutes % 1440) / 60);
      const mins = totalMinutes % 60;

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
      const formatted = parts.join(" ");

      if (diffMs <= 0) {
        if (totalMinutes < 1) return lang === "si" ? "දැන් නිකුත් විය" : "Just released";
        return lang === "si" ? `${formatted} කට පෙර` : `${formatted} ago`;
      } else {
        if (totalMinutes < 1) return lang === "si" ? "විනාඩියකට අඩු කාලයකින්" : "Due < 1m";
        return lang === "si" ? `තව ${formatted} කින්` : `in ${formatted}`;
      }
    } catch {
      return "";
    }
  })();

  const getImpactBadge = (impact: CalendarEvent["impact"]) => {
    switch (impact) {
      case "High":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-500 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            HIGH IMPACT (MAJOR MOVER)
          </span>
        );
      case "Medium":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            MEDIUM IMPACT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--muted)]/30 text-[var(--muted-foreground)]">
            LOW IMPACT / HOLIDAY
          </span>
        );
    }
  };

  const getCurrencyColor = (curr: string) => {
    switch (curr) {
      case "USD":
        return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
      case "EUR":
        return "bg-blue-500/15 text-blue-500 border-blue-500/30";
      case "GBP":
        return "bg-purple-500/15 text-purple-500 border-purple-500/30";
      case "JPY":
        return "bg-red-500/15 text-red-500 border-red-500/30";
      case "CAD":
        return "bg-amber-500/15 text-amber-500 border-amber-500/30";
      case "AUD":
        return "bg-teal-500/15 text-teal-500 border-teal-500/30";
      default:
        return "bg-[var(--muted)]/20 text-[var(--foreground)] border-[var(--border)]";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[var(--card)] text-[var(--foreground)] rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden z-10 my-auto"
        >
          {/* Top Header Bar */}
          <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-start justify-between gap-3 bg-[var(--muted)]/15">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border uppercase tracking-wider ${getCurrencyColor(event.country)}`}>
                  {event.country}
                </span>
                {getImpactBadge(event.impact)}
                <span className="text-xs text-[var(--muted-foreground)] font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {format(evDate, "hh:mm a • EEE, MMM d, yyyy")}
                </span>
                {timeRemainingStr && (
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                    {timeRemainingStr}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] tracking-tight leading-snug">
                {event.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Language Switcher */}
              <div className="flex items-center bg-[var(--card)] p-0.5 rounded-xl border border-[var(--border)] shadow-xs">
                <button
                  onClick={() => setLang("en")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    lang === "en"
                      ? "bg-[#4F39F6] text-white shadow-xs"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                  title="Switch to English"
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
                  title="සිංහල භාෂාවට මාරු වන්න"
                >
                  <Languages className="w-3 h-3" />
                  <span>සිංහල</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-4 max-h-[calc(85vh-160px)] overflow-y-auto custom-scrollbar">
            {/* Release Data Stats Grid (Forecast vs Previous) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[var(--muted)]/15 border border-[var(--border)]">
              <div>
                <span className="text-[10px] font-semibold uppercase text-[var(--muted-foreground)] block">
                  {lang === "si" ? "අපේක්ෂිත අගය (Forecast)" : "Forecast"}
                </span>
                <span className="text-sm font-extrabold font-mono text-[var(--foreground)]">
                  {event.forecast || (lang === "si" ? "වාර්තා නොවේ" : "N/A")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-[var(--muted-foreground)] block">
                  {lang === "si" ? "පෙර අගය (Previous)" : "Previous"}
                </span>
                <span className="text-sm font-extrabold font-mono text-[var(--muted-foreground)]">
                  {event.previous || (lang === "si" ? "වාර්තා නොවේ" : "N/A")}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] font-semibold uppercase text-[var(--muted-foreground)] block">
                  {lang === "si" ? "අපේක්ෂිත Volatility" : "Expected Volatility"}
                </span>
                <span className="text-xs font-bold text-rose-500 font-mono">
                  {intel.volatility}
                </span>
              </div>
            </div>

            {/* Affected Instruments Chips */}
            <div>
              <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
                {lang === "si" ? "බලපෑමට ලක්වන ප්‍රධාන මුදල් යුගල & Assets" : "Key Affected Instruments"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {intel.affectedPairs.map((pair) => (
                  <span
                    key={pair}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--muted)]/25 text-[var(--foreground)] border border-[var(--border)]"
                  >
                    {pair}
                  </span>
                ))}
              </div>
            </div>

            {/* Event Summary & Explanation */}
            <div className="p-3.5 rounded-2xl bg-[var(--muted)]/10 border border-[var(--border)] space-y-1.5">
              <h4 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5 uppercase tracking-wide text-[#4F39F6]">
                <BookOpen className="w-3.5 h-3.5" />
                {lang === "si" ? "සිදුවීම පිළිබඳ කෙටි හැඳින්වීම" : "Brief Indicator Overview"}
              </h4>
              <p className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed">
                {content.summary}
              </p>
            </div>

            {/* Why It Matters */}
            <div className="p-3.5 rounded-2xl bg-[var(--muted)]/10 border border-[var(--border)] space-y-1.5">
              <h4 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5 uppercase tracking-wide text-blue-500">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === "si" ? "මෙය වෙළඳපලට වැදගත් වන්නේ ඇයි?" : "Why Central Banks & Algorithms Monitor This"}
              </h4>
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
                {content.whyItMatters}
              </p>
            </div>

            {/* Bullish vs Bearish Scenario Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bullish Scenario */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {lang === "si" ? "අපේක්ෂිත අගයට වඩා වැඩි නම් (Bullish)" : "If Actual > Forecast"}
                </h4>
                <p className="text-xs text-[var(--foreground)] leading-relaxed">
                  {content.bullishScenario}
                </p>
              </div>

              {/* Bearish Scenario */}
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {lang === "si" ? "අපේක්ෂිත අගයට වඩා අඩු නම් (Bearish)" : "If Actual < Forecast"}
                </h4>
                <p className="text-xs text-[var(--foreground)] leading-relaxed">
                  {content.bearishScenario}
                </p>
              </div>
            </div>

            {/* ICT Smart Money Trading Tip */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#4F39F6]/15 via-[#4F39F6]/10 to-transparent border border-[#4F39F6]/30 space-y-1.5">
              <h4 className="text-xs font-black text-[#4F39F6] flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                {lang === "si" ? "ICT & Smart Money Trading මාර්ගෝපදේශය" : "ICT Institutional Execution Rule"}
              </h4>
              <p className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed">
                {content.ictTradingTip}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 px-5 border-t border-[var(--border)] bg-[var(--muted)]/15 flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)] text-[11px]">
              {lang === "si" ? "Forex Factory සහ ආයතනික දත්ත මූලාශ්‍ර" : "Forex Factory Institutional Calendar"}
            </span>

            <div className="flex items-center gap-2">
              <a
                href="https://www.forexfactory.com/calendar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-[#4F39F6] hover:underline"
              >
                <span>Forex Factory</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl font-bold bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity cursor-pointer"
              >
                {lang === "si" ? "වසන්න" : "Done"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
