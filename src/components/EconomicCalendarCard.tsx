"use client";

import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  Flame, 
  Filter, 
  ChevronRight, 
  ChevronLeft,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  Info,
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Search
} from "lucide-react";
import { 
  format, 
  parseISO, 
  isToday, 
  isTomorrow, 
  isPast, 
  isThisWeek, 
  compareAsc,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from "date-fns";
import EconomicEventDetailModal from "./EconomicEventDetailModal";
import HistoricalNewsImpactCard from "./HistoricalNewsImpactCard";

export interface CalendarEvent {
  title: string;
  country: string;
  date: string;
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast: string;
  previous: string;
}

interface EconomicCalendarCardProps {
  compact?: boolean;
  maxItems?: number;
  onSelectEvent?: (event: CalendarEvent) => void;
}

export default function EconomicCalendarCard({
  compact = false,
  maxItems,
  onSelectEvent
}: EconomicCalendarCardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs & Views
  const [activeTab, setActiveTab] = useState<"calendar" | "history">("calendar");
  const [displayMode, setDisplayMode] = useState<"table" | "cards" | "calendar">("table");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  
  // Filters
  const [filterImpact, setFilterImpact] = useState<"All" | "High" | "HighMed">("High");
  const [filterTime, setFilterTime] = useState<"AllWeek" | "Today" | "Upcoming" | "Past">("AllWeek");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal inspection state
  const [inspectedEvent, setInspectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/economic-calendar");
      if (!res.ok) throw new Error("Failed to load economic calendar");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const [, setLiveTick] = useState(0);

  useEffect(() => {
    fetchCalendar();
    const fetchInterval = setInterval(fetchCalendar, 3 * 60 * 1000); // 3m fetch
    const tickInterval = setInterval(() => setLiveTick((t) => t + 1), 30 * 1000); // 30s tick for real-time min updates
    return () => {
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const handleOpenDetail = (ev: CalendarEvent) => {
    setInspectedEvent(ev);
    setIsModalOpen(true);
    onSelectEvent?.(ev);
  };

  // Filter logic
  const filteredEvents = events.filter((ev) => {
    // Impact filter
    if (filterImpact === "High" && ev.impact !== "High") return false;
    if (filterImpact === "HighMed" && ev.impact !== "High" && ev.impact !== "Medium") return false;

    // Currency filter
    if (selectedCurrency !== "ALL" && ev.country !== selectedCurrency) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!ev.title.toLowerCase().includes(q) && !ev.country.toLowerCase().includes(q)) {
        return false;
      }
    }

    // Time filter
    try {
      const evDate = parseISO(ev.date);
      if (filterTime === "Today") {
        return isToday(evDate);
      } else if (filterTime === "Upcoming") {
        return !isPast(evDate);
      } else if (filterTime === "Past") {
        return isPast(evDate);
      }
      return true; // AllWeek
    } catch {
      return true;
    }
  });

  // Sort events chronologically
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    try {
      return compareAsc(parseISO(a.date), parseISO(b.date));
    } catch {
      return 0;
    }
  });

  const displayList = maxItems ? sortedEvents.slice(0, maxItems) : sortedEvents;

  // Calendar days grid computation
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const calendarStartDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEndDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStartDate, end: calendarEndDate });

  // Events for selected calendar day
  const selectedDayEvents = displayList.filter((ev) => {
    try {
      return isSameDay(parseISO(ev.date), selectedCalendarDate);
    } catch {
      return false;
    }
  });

  // Next upcoming high-impact event
  const nextHighImpact = events.find((ev) => {
    if (ev.impact !== "High") return false;
    try {
      const evDate = parseISO(ev.date);
      return !isPast(evDate);
    } catch {
      return false;
    }
  });

  const getImpactBadge = (impact: CalendarEvent["impact"]) => {
    switch (impact) {
      case "High":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1 h-1 rounded-full bg-rose-500" />
            HIGH
          </span>
        );
      case "Medium":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            MED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-500">
            LOW
          </span>
        );
    }
  };

  const getCurrencyColor = (curr: string) => {
    return "bg-[var(--muted)]/30 text-[var(--foreground)] border border-[var(--border)] font-mono";
  };

  const getTimeRemaining = (dateStr: string) => {
    try {
      const evDate = parseISO(dateStr);
      const diffMs = evDate.getTime() - Date.now();
      const absDiffMs = Math.abs(diffMs);
      const totalMinutes = Math.floor(absDiffMs / 60000);

      const days = Math.floor(totalMinutes / 1440);
      const hours = Math.floor((totalMinutes % 1440) / 60);
      const mins = totalMinutes % 60;

      // Clean format with days, hours, and minutes without seconds
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

      const formattedUnits = parts.join(" ");

      if (diffMs <= 0) {
        if (totalMinutes < 1) return "Just released";
        return `${formattedUnits} ago`;
      } else {
        if (totalMinutes < 1) return "Due < 1m";
        return `in ${formattedUnits}`;
      }
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-full neumorphic-card overflow-hidden">
      {/* Top Header: Sub-tabs (Live Calendar vs History Archive) & Controls */}
      <div className="p-3 sm:p-4 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--muted)]/15">
        {/* Left: Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--card)] p-1 rounded-xl border border-[var(--border)] shadow-xs">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-[#4F39F6] text-white shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Live Macro Calendar</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#4F39F6] text-white shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Past Impacts &amp; Education</span>
              <span className="text-[9px] px-1 rounded bg-white/20 text-white font-extrabold uppercase">
                Archive
              </span>
            </button>
          </div>
        </div>

        {/* Right: Layout Modes & Refresh */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {activeTab === "calendar" && (
            <div className="flex items-center bg-[var(--card)] p-0.5 rounded-xl border border-[var(--border)] shadow-xs text-xs font-bold">
              <button
                onClick={() => setDisplayMode("table")}
                className={`p-1.5 px-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  displayMode === "table"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs font-extrabold"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
                title="Institutional Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Table</span>
              </button>
              <button
                onClick={() => setDisplayMode("cards")}
                className={`p-1.5 px-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  displayMode === "cards"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs font-extrabold"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Cards</span>
              </button>
              <button
                onClick={() => setDisplayMode("calendar")}
                className={`p-1.5 px-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  displayMode === "calendar"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs font-extrabold"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
                title="Interactive Calendar Matrix View"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Calendar</span>
              </button>
            </div>
          )}

          <button
            onClick={fetchCalendar}
            disabled={loading}
            className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] shadow-xs transition-colors cursor-pointer"
            title="Refresh economic calendar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#4F39F6]" : ""}`} />
          </button>
        </div>
      </div>

      {/* VIEW BRANCH 1: HISTORICAL NEWS IMPACT & EDUCATION ARCHIVE */}
      {activeTab === "history" && (
        <div className="flex-1 overflow-hidden p-2 sm:p-3">
          <HistoricalNewsImpactCard />
        </div>
      )}

      {/* VIEW BRANCH 2: LIVE ECONOMIC CALENDAR */}
      {activeTab === "calendar" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Eye-Friendly Next Catalyst Hero Banner */}
          {nextHighImpact && (
            <div 
              onClick={() => handleOpenDetail(nextHighImpact)}
              className="mx-3.5 mt-3 p-3 rounded-2xl bg-[var(--muted)]/15 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[var(--muted)]/25 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">
                      Upcoming High-Impact Catalyst
                    </span>
                    <span className="px-1.5 rounded-md bg-rose-500 text-white font-extrabold text-[9.5px]">
                      {nextHighImpact.country}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] group-hover:text-[#4F39F6] transition-colors truncate">
                    {nextHighImpact.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Countdown</span>
                  <span className="text-xs sm:text-sm font-semibold text-rose-500 tabular-nums">
                    {getTimeRemaining(nextHighImpact.date)}
                  </span>
                </div>
                <span className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs font-bold text-[#4F39F6] flex items-center gap-1 group-hover:bg-[#4F39F6] group-hover:text-white transition-all">
                  <span>Inspect</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* Institutional Filters Ribbon */}
          <div className="p-3 border-b border-[var(--border)]/60 flex flex-wrap items-center justify-between gap-2.5 bg-[var(--muted)]/10 mt-3">
            {/* Impact Filter Buttons */}
            <div className="flex items-center gap-1 bg-[var(--card)] p-0.5 rounded-lg border border-[var(--border)] text-xs">
              <button
                onClick={() => setFilterImpact("High")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  filterImpact === "High"
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                High Impact
              </button>
              <button
                onClick={() => setFilterImpact("HighMed")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  filterImpact === "HighMed"
                    ? "bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                High + Med
              </button>
              <button
                onClick={() => setFilterImpact("All")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  filterImpact === "All"
                    ? "bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                All Events
              </button>
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="flex items-center gap-1 bg-[var(--card)] p-0.5 rounded-lg border border-[var(--border)] text-xs">
              <button
                onClick={() => setFilterTime("AllWeek")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  filterTime === "AllWeek"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-2xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setFilterTime("Today")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  filterTime === "Today"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-2xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilterTime("Upcoming")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  filterTime === "Upcoming"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-2xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilterTime("Past")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  filterTime === "Past"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-2xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Released
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial min-w-[170px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
              <input
                type="text"
                placeholder="Search indicator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg pl-8 pr-3 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Currency Pill Filter */}
          <div className="px-3.5 py-1.5 border-b border-[var(--border)]/40 flex items-center gap-1 overflow-x-auto scrollbar-none text-xs text-[var(--muted-foreground)]">
            <span className="shrink-0 text-[10px] uppercase font-semibold tracking-wider mr-1 text-[var(--muted-foreground)]">
              Currency:
            </span>
            {["ALL", "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"].map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer shrink-0 font-mono text-[11px] font-medium ${
                  selectedCurrency === curr
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "hover:bg-[var(--muted)]/40 hover:text-[var(--foreground)]"
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {/* Events Viewport */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {loading && events.length === 0 ? (
              <div className="p-12 text-center text-xs text-[var(--muted-foreground)] animate-pulse flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#4F39F6]" />
                <span>Loading real-time economic catalysts from Forex Factory...</span>
              </div>
            ) : displayList.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-sm font-bold text-[var(--foreground)]">
                  No scheduled releases match the selected filters
                </p>
                <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
                  Try switching to &quot;This Week&quot; or selecting &quot;ALL&quot; currencies to view the full upcoming institutional release calendar.
                </p>
                <button
                  onClick={() => {
                    setFilterTime("AllWeek");
                    setFilterImpact("All");
                    setSelectedCurrency("ALL");
                    setSearchQuery("");
                  }}
                  className="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#4F39F6] text-white cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : displayMode === "table" ? (
              /* INSTITUTIONAL TABULAR VIEW */
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-slate-50/70 dark:bg-white/[0.02] text-[10.5px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">
                      <th className="py-2 px-3 font-medium">Date &amp; Time</th>
                      <th className="py-2 px-2.5 font-medium">Pair</th>
                      <th className="py-2 px-2.5 font-medium">Impact</th>
                      <th className="py-2 px-3 font-medium">Event / Catalyst</th>
                      <th className="py-2 px-3 text-right font-medium">Forecast</th>
                      <th className="py-2 px-3 text-right font-medium">Previous</th>
                      <th className="py-2 px-3 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map((ev, idx) => {
                      const evDate = parseISO(ev.date);
                      const isEventPast = isPast(evDate);
                      const timeStr = format(evDate, "hh:mm a");
                      const dateStr = format(evDate, "EEE, MMM d");

                      return (
                        <tr
                          key={`${ev.title}-${idx}`}
                          onClick={() => handleOpenDetail(ev)}
                          className={`border-b border-[var(--border)]/35 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer group h-9 ${
                            isEventPast ? "opacity-70" : ""
                          }`}
                        >
                          {/* Date & Time */}
                          <td className="py-1.5 px-3 whitespace-nowrap">
                            <span className="text-xs text-[var(--foreground)] font-medium tabular-nums mr-1.5">{timeStr}</span>
                            <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums">{dateStr}</span>
                          </td>

                          {/* Currency */}
                          <td className="py-1.5 px-2.5 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-[var(--border)] bg-[var(--muted)]/30 text-[var(--foreground)]">
                              {ev.country}
                            </span>
                          </td>

                          {/* Impact */}
                          <td className="py-1.5 px-2.5 whitespace-nowrap">
                            {getImpactBadge(ev.impact)}
                          </td>

                          {/* Title */}
                          <td className="py-1.5 px-3">
                            <div className="text-xs font-medium text-[var(--foreground)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                              {ev.title}
                            </div>
                            <div className={`text-[10px] tabular-nums ${isEventPast ? "text-[var(--muted-foreground)]" : "text-rose-500 font-medium"}`}>
                              {getTimeRemaining(ev.date)}
                            </div>
                          </td>

                          {/* Forecast */}
                          <td className="py-1.5 px-3 text-right whitespace-nowrap text-xs tabular-nums text-[var(--foreground)] font-medium">
                            {ev.forecast || "—"}
                          </td>

                          {/* Previous */}
                          <td className="py-1.5 px-3 text-right whitespace-nowrap text-xs tabular-nums text-[var(--muted-foreground)] font-medium">
                            {ev.previous || "—"}
                          </td>

                          {/* Action Button */}
                          <td className="py-1.5 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(ev);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-medium border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : displayMode === "calendar" ? (
              /* INTERACTIVE ECONOMIC CALENDAR VIEW */
              <div className="flex flex-col gap-4">
                {/* Month Navigation & Overview Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--muted)]/15 border border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                      className="p-1.5 rounded-lg hover:bg-[var(--muted)]/30 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all cursor-pointer border border-[var(--border)]"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="text-sm font-black text-[var(--foreground)] min-w-[140px] text-center tracking-tight">
                      {format(calendarMonth, "MMMM yyyy")}
                    </span>

                    <button
                      onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      className="p-1.5 rounded-lg hover:bg-[var(--muted)]/30 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all cursor-pointer border border-[var(--border)]"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const today = new Date();
                        setCalendarMonth(today);
                        setSelectedCalendarDate(today);
                      }}
                      className="ml-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-all cursor-pointer"
                    >
                      Today
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                      Active Releases:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#4F39F6]/15 text-[#4F39F6] border border-[#4F39F6]/30">
                      {displayList.length} Catalysts
                    </span>
                  </div>
                </div>

                {/* 7-Day Matrix Calendar Grid */}
                <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
                  <div className="min-w-[700px]">
                    {/* Day Headers (Mon - Sun) */}
                    <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--muted)]/20 text-center py-2 text-[10.5px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                        <div key={d} className="py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Day Grid Cells */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-[var(--border)]/60">
                      {calendarDays.map((day, dIdx) => {
                        const isCurrentMonth = isSameMonth(day, calendarMonth);
                        const isCurrentToday = isToday(day);
                        const isSelected = isSameDay(day, selectedCalendarDate);

                        const dayEvents = displayList.filter((ev) => {
                          try {
                            return isSameDay(parseISO(ev.date), day);
                          } catch {
                            return false;
                          }
                        });

                        const hasHighImpact = dayEvents.some((ev) => ev.impact === "High");
                        const hasMedImpact = dayEvents.some((ev) => ev.impact === "Medium");

                        return (
                          <div
                            key={dIdx}
                            onClick={() => setSelectedCalendarDate(day)}
                            className={`min-h-[110px] p-1.5 flex flex-col justify-between transition-all cursor-pointer group select-none ${
                              !isCurrentMonth ? "bg-[var(--muted)]/5 opacity-40" : "bg-[var(--card)]"
                            } ${
                              isSelected
                                ? "ring-2 ring-[#4F39F6] bg-[#4F39F6]/5 z-10"
                                : "hover:bg-[var(--muted)]/15"
                            }`}
                          >
                            {/* Day Header Inside Cell */}
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-mono font-black ${
                                  isCurrentToday
                                    ? "bg-[#4F39F6] text-white shadow-xs"
                                    : isSelected
                                      ? "bg-[var(--foreground)] text-[var(--background)]"
                                      : "text-[var(--foreground)]"
                                }`}
                              >
                                {format(day, "d")}
                              </span>

                              {/* Impact dots & count */}
                              {dayEvents.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {hasHighImpact && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="High Impact" />
                                  )}
                                  {hasMedImpact && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Medium Impact" />
                                  )}
                                  <span className="text-[9px] font-mono font-bold text-[var(--muted-foreground)]">
                                    {dayEvents.length}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Mini Event Chips (up to 3) */}
                            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                              {dayEvents.slice(0, 3).map((ev, eIdx) => {
                                const evDate = parseISO(ev.date);
                                const timeFormatted = format(evDate, "HH:mm");
                                return (
                                  <div
                                    key={`${ev.title}-${eIdx}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDetail(ev);
                                    }}
                                    className={`p-1 rounded-md text-[9.5px] border leading-tight flex items-center justify-between gap-1 transition-all hover:scale-[1.02] cursor-pointer shadow-2xs ${
                                      ev.impact === "High"
                                        ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold"
                                        : ev.impact === "Medium"
                                          ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold"
                                          : "bg-[var(--muted)]/20 border-[var(--border)] text-[var(--foreground)]"
                                    }`}
                                    title={`${ev.country} • ${ev.title} at ${timeFormatted}`}
                                  >
                                    <div className="flex items-center gap-1 min-w-0">
                                      <span className="text-[8px] font-black uppercase px-0.5 rounded bg-black/10 dark:bg-white/10 shrink-0">
                                        {ev.country}
                                      </span>
                                      <span className="truncate">
                                        {ev.title}
                                      </span>
                                    </div>
                                    <span className="font-mono text-[8.5px] shrink-0 opacity-80">
                                      {timeFormatted}
                                    </span>
                                  </div>
                                );
                              })}

                              {dayEvents.length > 3 && (
                                <span className="text-[8.5px] font-black text-[#4F39F6] text-center pt-0.5">
                                  +{dayEvents.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Selected Day Catalyst Schedule & Intelligence Drawer */}
                <div className="p-3.5 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#4F39F6]/15 border border-[#4F39F6]/30 flex items-center justify-center text-[#4F39F6]">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-[var(--foreground)]">
                          Schedule for {format(selectedCalendarDate, "EEEE, MMMM d, yyyy")}
                        </h4>
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          {selectedDayEvents.length} economic catalysts scheduled for release
                        </p>
                      </div>
                    </div>

                    {isToday(selectedCalendarDate) && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>

                  {selectedDayEvents.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--muted-foreground)] bg-[var(--card)] rounded-xl border border-[var(--border)]">
                      No economic events scheduled for this selected date. Click any date with indicator badges in the calendar matrix above to inspect its catalysts.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {selectedDayEvents.map((ev, idx) => {
                        const evDate = parseISO(ev.date);
                        const isEventPast = isPast(evDate);
                        const timeStr = format(evDate, "hh:mm a");

                        return (
                          <div
                            key={`${ev.title}-${idx}`}
                            onClick={() => handleOpenDetail(ev)}
                            className={`p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[#4F39F6]/50 hover:bg-[var(--muted)]/20 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-2xs ${
                              isEventPast ? "opacity-75" : ""
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${getCurrencyColor(ev.country)}`}>
                                    {ev.country}
                                  </span>
                                  {getImpactBadge(ev.impact)}
                                </div>
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="text-[10px] text-[var(--muted-foreground)]">
                                    {timeStr}
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    isEventPast 
                                      ? "text-[var(--muted-foreground)] bg-[var(--muted)]/20" 
                                      : "text-rose-500 bg-rose-500/10 border border-rose-500/20"
                                  }`}>
                                    {getTimeRemaining(ev.date)}
                                  </span>
                                </div>
                              </div>

                              <h5 className="text-xs font-black text-[var(--foreground)] group-hover:text-[#4F39F6] transition-colors leading-snug line-clamp-2">
                                {ev.title}
                              </h5>
                            </div>

                            <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-2 font-mono">
                                {ev.forecast && (
                                  <span className="text-[var(--foreground)] font-bold">
                                    F: {ev.forecast}
                                  </span>
                                )}
                                {ev.previous && (
                                  <span className="text-[var(--muted-foreground)]">
                                    P: {ev.previous}
                                  </span>
                                )}
                              </div>

                              <span className="text-[10px] font-bold text-[#4F39F6] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                <span>Intelligence</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* CARD GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {displayList.map((ev, idx) => {
                  const evDate = parseISO(ev.date);
                  const isEventPast = isPast(evDate);
                  const timeStr = format(evDate, "hh:mm a");
                  const dateStr = format(evDate, "EEE, MMM d");

                  return (
                    <div
                      key={`${ev.title}-${idx}`}
                      onClick={() => handleOpenDetail(ev)}
                      className={`p-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[#4F39F6]/50 hover:bg-[var(--muted)]/20 transition-all cursor-pointer group flex flex-col justify-between gap-2 ${
                        isEventPast ? "opacity-75" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${getCurrencyColor(ev.country)}`}>
                              {ev.country}
                            </span>
                            {getImpactBadge(ev.impact)}
                          </div>
                          <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                            {dateStr}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-[var(--foreground)] group-hover:text-[#4F39F6] transition-colors leading-snug line-clamp-2">
                          {ev.title}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-[var(--foreground)]">
                            {timeStr}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            isEventPast 
                              ? "text-[var(--muted-foreground)] bg-[var(--muted)]/20" 
                              : "text-rose-500 bg-rose-500/10 border border-rose-500/20"
                          }`}>
                            {getTimeRemaining(ev.date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono">
                          {ev.forecast && (
                            <span className="text-[var(--foreground)] font-bold">
                              F: {ev.forecast}
                            </span>
                          )}
                          {ev.previous && (
                            <span className="text-[var(--muted-foreground)]">
                              P: {ev.previous}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-[#4F39F6] flex items-center gap-0.5">
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-2.5 px-4 border-t border-[var(--border)] bg-[var(--card)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-[var(--muted-foreground)]">
        <span>Click any event to open institutional briefing with English ⇄ Sinhala explanation</span>
        <span className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Forex Factory Data Sync • Education Tab Linked
        </span>
      </div>

      {/* Detail Inspection Modal with English ⇄ Sinhala toggle */}
      {inspectedEvent && (
        <EconomicEventDetailModal
          isOpen={isModalOpen}
          event={inspectedEvent}
          onClose={() => {
            setIsModalOpen(false);
            setInspectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
