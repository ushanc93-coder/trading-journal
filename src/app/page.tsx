"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { Info, ArrowRight, Clock, Target, ShieldAlert, Award, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { format, parseISO, isWithinInterval, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { useState } from "react";
import { useSettingsContext } from "@/lib/SettingsContext";
import { motion } from "framer-motion";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import { Trade } from "@/lib/mock-data";
import ViewTradeModal from "@/components/ViewTradeModal";

export default function DashboardPage() {
  const [chartTab, setChartTab] = useState("cumulative");
  const [tableTab, setTableTab] = useState("recent");
  const [selectedTradeForModal, setSelectedTradeForModal] = useState<Trade | null>(null);
  const { trades, isLoaded } = useTradesContext();

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading dashboard...</div>;

  const { activeDateRange, customDateRange } = useSettingsContext();

  const now = new Date();
  let filteredTrades = trades;
  
  if (activeDateRange !== "All Time") {
    filteredTrades = trades.filter(t => {
      const tradeDate = parseISO(t.date);
      if (activeDateRange === "Today") {
        return tradeDate >= startOfDay(now);
      } else if (activeDateRange === "This Week") {
        return tradeDate >= startOfWeek(now, { weekStartsOn: 1 });
      } else if (activeDateRange === "This Month") {
        return tradeDate >= startOfMonth(now);
      } else if (activeDateRange === "Custom" && customDateRange?.start && customDateRange?.end) {
        return tradeDate >= new Date(customDateRange.start) && tradeDate <= new Date(customDateRange.end);
      }
      return true;
    });
  }

  // Derived Metrics
  const totalTrades = filteredTrades.length;
  const wins = filteredTrades.filter(t => t.status === "Win");
  const losses = filteredTrades.filter(t => t.status === "Loss");
  const breakEvens = filteredTrades.filter(t => t.status === "Break Even");
  const closedTrades = wins.length + losses.length + breakEvens.length;
  const winRate = closedTrades > 0 ? Math.round((wins.length / closedTrades) * 100) : 0;
  
  const netPnL = filteredTrades.reduce((acc, trade) => acc + trade.netPnL, 0);
  
  const grossProfit = wins.reduce((acc, t) => acc + t.netPnL, 0);
  const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.netPnL, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "∞" : "0.00";

  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const winRateFloat = closedTrades > 0 ? (wins.length / closedTrades) : 0;
  const lossRateFloat = closedTrades > 0 ? (losses.length / closedTrades) : 0;
  const expectedValue = (winRateFloat * avgWin) - (lossRateFloat * avgLoss);
  
  // Max Drawdown calculation
  let peak = 0;
  let maxDd = 0;
  let runningBal = 10000; // Assuming base balance
  
  // Avg Risk to Reward (R:R)
  const avgRR = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : avgWin > 0 ? "^z" : "0.00";

  // Group trades by date
  const tradesByDate = filteredTrades.reduce((acc: Record<string, any>, trade: any) => {
    const d = format(parseISO(trade.date), 'MM/dd/yyyy');
    if (!acc[d]) {
      acc[d] = { date: d, daily: 0, trades: 0, wins: 0, losses: 0 };
    }
    acc[d].daily += trade.netPnL;
    acc[d].trades += 1;
    if (trade.status === 'Win') acc[d].wins += 1;
    if (trade.status === 'Loss') acc[d].losses += 1;
    return acc;
  }, {} as Record<string, any>);

  let cumulative = 0;
  
  const sortedDays = Object.values(tradesByDate).map((d: any) => ({ ...d, timestamp: new Date(d.date).getTime() })).sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate Drawdown through chronological equity curve
  let currentPeak = 0;
  let maxDrawdownDollars = 0;
  let cumulativeForDd = 0;
  sortedDays.forEach((d: any) => {
    cumulativeForDd += d.daily;
    if (cumulativeForDd > currentPeak) currentPeak = cumulativeForDd;
    const drawdown = currentPeak - cumulativeForDd;
    if (drawdown > maxDrawdownDollars) maxDrawdownDollars = drawdown;
  });
  const maxDrawdownPct = (maxDrawdownDollars / (10000 + currentPeak)) * 100;

  const equityData = sortedDays.map((day: any) => {
    cumulative += day.daily;
    return {
      ...day,
      equity: cumulative
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--card)]/80 backdrop-blur-md border border-[var(--border)] p-4 rounded-xl shadow-xl text-sm">
          <p className="font-semibold mb-2">{label}</p>
          {chartTab === 'cumulative' ? (
            <p className="text-[var(--foreground)]">
              Cumulative P&L:{" "}
              <span className={`font-semibold tabular-nums ${data.equity >= 0 ? "text-[var(--win)]" : "text-[var(--loss)]"}`}>
                {data.equity > 0 
                  ? `+$${data.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : data.equity < 0 
                  ? `-$${Math.abs(data.equity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : `$0.00`}
              </span>
            </p>
          ) : (
            <p className="text-[var(--foreground)]">
              Net P&L:{" "}
              <span className={`font-semibold tabular-nums ${data.daily >= 0 ? "text-[var(--win)]" : "text-[var(--loss)]"}`}>
                {data.daily > 0 
                  ? `+$${data.daily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : data.daily < 0 
                  ? `-$${Math.abs(data.daily).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : `$0.00`}
              </span>
            </p>
          )}
          <div className="mt-2 text-xs">
            <p className="text-[var(--muted-foreground)]">Trades: {data.trades}</p>
            <p className="text-[var(--win)]">Wins: {data.wins}</p>
            <p className="text-[var(--loss)]">Losses: {data.losses}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Since TradeZella has area chart gradient that shows green when positive and red when negative:
  // We can use a split gradient for Recharts.
  const gradientOffset = () => {
    const dataMax = Math.max(...equityData.map((i) => i.equity));
    const dataMin = Math.min(...equityData.map((i) => i.equity));
  
    if (dataMax <= 0) {
      return 0;
    }
    if (dataMin >= 0) {
      return 1;
    }
  
    return dataMax / (dataMax - dataMin);
  };
  const off = gradientOffset();

  // Data for Donut Chart (Trades)
  const pieDataTrades = [
    { name: "Winners", value: wins.length, color: "var(--win)" },
    { name: "Losers", value: losses.length, color: "var(--loss)" }
  ];
  if (breakEvens.length > 0) {
    pieDataTrades.push({ name: "Break Evens", value: breakEvens.length, color: "#9CA3AF" });
  }

  const winningDays = Object.values(tradesByDate).filter((d: any) => d.daily > 0).length;
  const losingDays = Object.values(tradesByDate).filter((d: any) => d.daily < 0).length;
  const breakEvenDays = Object.values(tradesByDate).filter((d: any) => d.daily === 0).length;
  const totalDays = winningDays + losingDays + breakEvenDays;
  const dayWinRate = totalDays > 0 ? Math.round((winningDays / totalDays) * 100) : 0;
  
  const pieDataDays = [
    { name: "Winners", value: winningDays, color: "var(--win)" },
    { name: "Losers", value: losingDays, color: "var(--loss)" }
  ];
  if (breakEvenDays > 0) {
    pieDataDays.push({ name: "Break Evens", value: breakEvenDays, color: "#9CA3AF" });
  }

  // Sort trades chronologically descending (newest trades first)
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return timeB - timeA;
  });

  const openTrades = sortedTrades.filter(t => (t.status as string) === 'Open' || (t as any).rawEvent === 'opened');
  const recentTrades = sortedTrades;
  const currentTableTrades = tableTab === 'recent' ? recentTrades : openTrades;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top row of KPIs - Neumorphic Luxury Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total P&L */}
        <div className="neumorphic-card neumorphic-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                netPnL >= 0 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              }`}>
                {netPnL >= 0 ? <ArrowUpRight className="w-5 h-5 stroke-[2.5]" /> : <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Total Net P&L
              </span>
            </div>
            <div className="group relative flex items-center">
              <Info className="cursor-help w-3.5 h-3.5 text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] transition-colors" />
              <div className="pointer-events-none absolute right-0 top-full mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-52 p-2.5 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-xl shadow-xl z-50 text-center font-normal whitespace-normal">
                The total sum of Net Profit/Loss across all recorded trades.
              </div>
            </div>
          </div>
          <div>
            <h3 className={`text-2xl sm:text-[26px] font-bold font-mono tabular-nums tracking-tight ${netPnL >= 0 ? "text-[var(--win)]" : "text-[var(--loss)]"}`}>
              {netPnL > 0 
                ? `+$${netPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : netPnL < 0 
                ? `-$${Math.abs(netPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : `$0.00`}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--muted-foreground)] font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              <span>{totalTrades} recorded trades</span>
            </div>
          </div>
        </div>

        {/* Profit factor */}
        <div className="neumorphic-card neumorphic-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Target className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Profit Factor
              </span>
            </div>
            <div className="group relative flex items-center">
              <Info className="cursor-help w-3.5 h-3.5 text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] transition-colors" />
              <div className="pointer-events-none absolute right-0 top-full mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-52 p-2.5 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-xl shadow-xl z-50 text-center font-normal whitespace-normal">
                Gross Profit divided by Gross Loss. A value above 1.0 means you are profitable.
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-[26px] font-bold font-mono tabular-nums tracking-tight text-[var(--foreground)]">
              {profitFactor}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--muted-foreground)] font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Avg Risk/Reward: 1:{avgRR}</span>
            </div>
          </div>
        </div>

        {/* Average winning trade */}
        <div className="neumorphic-card neumorphic-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Award className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Avg Win
              </span>
            </div>
            <div className="group relative flex items-center">
              <Info className="cursor-help w-3.5 h-3.5 text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] transition-colors" />
              <div className="pointer-events-none absolute right-0 top-full mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-52 p-2.5 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-xl shadow-xl z-50 text-center font-normal whitespace-normal">
                Total Gross Profit divided by the total number of Winning trades.
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-[26px] font-bold font-mono tabular-nums tracking-tight text-[var(--win)]">
              +${avgWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--muted-foreground)] font-medium">
              <span>Expected Value:</span>
              <span className={`font-mono font-semibold tabular-nums ${expectedValue >= 0 ? "text-[var(--win)]" : "text-[var(--loss)]"}`}>
                {expectedValue > 0 
                  ? `+$${expectedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : expectedValue < 0 
                  ? `-$${Math.abs(expectedValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : `$0.00`}
              </span>
            </div>
          </div>
        </div>

        {/* Average losing trade */}
        <div className="neumorphic-card neumorphic-card-hover p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Avg Loss
              </span>
            </div>
            <div className="group relative flex items-center">
              <Info className="cursor-help w-3.5 h-3.5 text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] transition-colors" />
              <div className="pointer-events-none absolute right-0 top-full mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-52 p-2.5 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-xl shadow-xl z-50 text-center font-normal whitespace-normal">
                The average net loss of all your losing trades.
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-[26px] font-bold font-mono tabular-nums tracking-tight text-[var(--loss)]">
              -${avgLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-500/90 font-medium">
              <span>Max Drawdown:</span>
              <span className="font-mono font-semibold tabular-nums">
                -${maxDrawdownDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (-{maxDrawdownPct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Circular Charts */}
        <div className="flex flex-col gap-4">
          {/* Winning % By Trades */}
          <div className="neumorphic-card p-5 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--foreground)]">Winning % By Trades</h3>
              <div className="group relative flex items-center">
                <Info className="cursor-help w-3.5 h-3.5 text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] transition-colors" />
                <div className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2.5 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-xl shadow-xl z-50 text-center font-normal whitespace-normal">
                  The percentage of total individual trades that resulted in a Win.
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="relative w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDataTrades} cx="50%" cy="50%"
                      innerRadius={42} outerRadius={54}
                      dataKey="value" stroke="none"
                      isAnimationActive={true} animationBegin={0} animationDuration={1000} animationEasing="ease-out"
                    >
                      {pieDataTrades.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-mono tabular-nums text-[var(--foreground)]">{winRate}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-[var(--win)] font-bold">winrate</span>
                </div>
              </div>
              <div className="flex flex-col space-y-2.5">
                <div className="flex flex-col">
                  <div className="flex items-center text-xs font-semibold tabular-nums">
                    <div className="w-2.5 h-2.5 bg-[var(--win)] rounded-xs mr-2"></div>
                    {wins.length}
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)] ml-4.5">winners</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center text-xs font-semibold tabular-nums">
                    <div className="w-2.5 h-2.5 bg-[var(--loss)] rounded-xs mr-2"></div>
                    {losses.length}
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)] ml-4.5">losers</span>
                </div>
                {breakEvens.length > 0 && (
                  <div className="flex flex-col">
                    <div className="flex items-center text-xs font-semibold tabular-nums">
                      <div className="w-2.5 h-2.5 bg-[#9CA3AF] rounded-xs mr-2"></div>
                      {breakEvens.length}
                    </div>
                    <span className="text-[11px] text-[var(--muted-foreground)] ml-4.5">break even</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Winning % By Days */}
          <div className="neumorphic-card p-5 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--foreground)]">Winning % By Days</h3>
              <div className="group relative flex items-center">
                <Info className="cursor-help w-3.5 h-3.5 text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] transition-colors" />
                <div className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2.5 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-xl shadow-xl z-50 text-center font-normal whitespace-normal">
                  The percentage of trading days that ended with a positive Net P&L.
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="relative w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDataDays} cx="50%" cy="50%"
                      innerRadius={42} outerRadius={54}
                      dataKey="value" stroke="none"
                      isAnimationActive={true} animationBegin={0} animationDuration={1000} animationEasing="ease-out"
                    >
                      {pieDataDays.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-mono tabular-nums text-[var(--foreground)]">{dayWinRate}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-[var(--win)] font-bold">winrate</span>
                </div>
              </div>
              <div className="flex flex-col space-y-2.5">
                <div className="flex flex-col">
                  <div className="flex items-center text-xs font-semibold tabular-nums">
                    <div className="w-2.5 h-2.5 bg-[var(--win)] rounded-xs mr-2"></div>
                    {winningDays}
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)] ml-4.5">winners</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center text-xs font-semibold tabular-nums">
                    <div className="w-2.5 h-2.5 bg-[var(--loss)] rounded-xs mr-2"></div>
                    {losingDays}
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)] ml-4.5">losers</span>
                </div>
                {breakEvenDays > 0 && (
                  <div className="flex flex-col">
                    <div className="flex items-center text-xs font-semibold tabular-nums">
                      <div className="w-2.5 h-2.5 bg-[#9CA3AF] rounded-xs mr-2"></div>
                      {breakEvenDays}
                    </div>
                    <span className="text-[11px] text-[var(--muted-foreground)] ml-4.5">break even</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Area Chart */}
        <div className="lg:col-span-3 neumorphic-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex bg-[var(--muted)]/50 rounded-lg p-1 w-fit mb-5">
            <button 
              onClick={() => setChartTab('cumulative')}
              className={`relative px-3 py-1 font-medium text-xs transition-colors z-10 ${chartTab === 'cumulative' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
            >
              Daily Net cumulative P&L
              {chartTab === 'cumulative' && (
                <motion.div
                  layoutId="chartTab"
                  className="absolute inset-0 bg-[var(--card)] rounded-md -z-10 border border-[var(--border)] shadow-xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
            <button 
              onClick={() => setChartTab('daily')}
              className={`relative px-3 py-1 font-medium text-xs transition-colors z-10 ${chartTab === 'daily' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
            >
              Net daily P&L
              {chartTab === 'daily' && (
                <motion.div
                  layoutId="chartTab"
                  className="absolute inset-0 bg-[var(--card)] rounded-md -z-10 border border-[var(--border)] shadow-xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </div>
          
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === 'cumulative' ? (
                <AreaChart data={equityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={off} stopColor="var(--win)" stopOpacity={0.8} />
                      <stop offset={off} stopColor="var(--loss)" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="equity" stroke="var(--win)" strokeWidth={1} fillOpacity={1} fill="url(#splitColor)" isAnimationActive={true} animationDuration={1000} animationBegin={0} animationEasing="ease-out" />
                </AreaChart>
              ) : (
                <BarChart data={equityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{fill: "var(--muted)", opacity: 0.2}} />
                  <Bar dataKey="daily" isAnimationActive={true} animationDuration={1000} animationBegin={0} animationEasing="ease-out">
                    {
                      equityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.daily >= 0 ? 'var(--win)' : 'var(--loss)'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Left Column: Recent / Open Trades Table */}
        <div className="neumorphic-card flex flex-col h-full overflow-hidden">
          {/* Header & Tabs */}
          <div className="border-b border-[var(--border)] px-3 py-2 bg-[var(--muted)]/15">
            <div className="flex bg-[var(--muted)]/50 rounded-lg p-0.5 w-full">
              <button 
                onClick={() => setTableTab('recent')}
                className={`relative flex-1 px-2.5 py-1.5 font-medium text-xs transition-colors z-10 flex items-center justify-center gap-1.5 ${
                  tableTab === 'recent' 
                    ? 'text-[var(--foreground)] font-semibold' 
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>Recent</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  tableTab === 'recent' 
                    ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs' 
                    : 'text-[var(--muted-foreground)]'
                }`}>
                  {recentTrades.length}
                </span>
                {tableTab === 'recent' && (
                  <motion.div
                    layoutId="tableTab"
                    className="absolute inset-0 bg-[var(--card)] rounded-md -z-10 border border-[var(--border)] shadow-xs"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
              <button 
                onClick={() => setTableTab('open')}
                className={`relative flex-1 px-2.5 py-1.5 font-medium text-xs transition-colors z-10 flex items-center justify-center gap-1.5 ${
                  tableTab === 'open' 
                    ? 'text-[var(--foreground)] font-semibold' 
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>Open</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  tableTab === 'open' 
                    ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs' 
                    : 'text-[var(--muted-foreground)]'
                }`}>
                  {openTrades.length}
                </span>
                {tableTab === 'open' && (
                  <motion.div
                    layoutId="tableTab"
                    className="absolute inset-0 bg-[var(--card)] rounded-md -z-10 border border-[var(--border)] shadow-xs"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Table Body / Scrollable Area */}
          <div className="flex-1 overflow-y-auto max-h-[460px] custom-scrollbar">
            {currentTableTrades.length === 0 ? (
              <div className="py-16 px-4 text-center flex flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
                <Clock className="w-6 h-6 opacity-40 mb-1" />
                <span className="text-xs font-medium text-[var(--foreground)]">
                  {tableTab === 'open' ? 'No open positions' : 'No trades recorded yet'}
                </span>
                <span className="text-[11px] max-w-[220px] leading-relaxed opacity-75">
                  {tableTab === 'open' 
                    ? 'All trades currently recorded in this account are closed.' 
                    : 'Your completed trade executions will appear here.'}
                </span>
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 z-10 text-[10px] text-[var(--muted-foreground)] uppercase font-semibold border-b border-[var(--border)] bg-[var(--card)]">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Symbol</th>
                    <th className="px-3 py-2 text-right">Vol</th>
                    <th className="px-3 py-2 text-right">P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {currentTableTrades.map((trade) => {
                    const pnl = Number(trade.netPnL || 0);
                    const formattedPnL = pnl > 0 
                      ? `+$${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : pnl < 0 
                      ? `-$${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : `$0.00`;

                    return (
                      <tr 
                        key={trade.id} 
                        onClick={() => setSelectedTradeForModal(trade)}
                        className="h-8.5 hover:bg-[var(--muted)]/35 cursor-pointer transition-colors group"
                        title="Click to view full trade details"
                      >
                        <td className="px-3 py-1.5 text-[var(--muted-foreground)] text-[11px] whitespace-nowrap">
                          {format(parseISO(trade.date), 'MM/dd')}
                        </td>
                        <td className="px-3 py-1.5 font-semibold text-[var(--foreground)] group-hover:text-blue-500 transition-colors">
                          <div className="flex items-center gap-1.5">
                            <span>{trade.symbol}</span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                              trade.direction === 'Long' 
                                ? 'bg-blue-500/10 text-blue-500' 
                                : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {trade.direction === 'Long' ? 'B' : 'S'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-[var(--muted-foreground)] text-right text-[11px] tabular-nums">
                          {Number(trade.lotSize || 0.01).toFixed(2)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-xs">
                          <span className={`font-semibold ${
                            pnl > 0 
                              ? 'text-[var(--win)]' 
                              : pnl < 0 
                              ? 'text-[var(--loss)]' 
                              : 'text-[var(--muted-foreground)]'
                          }`}>
                            {formattedPnL}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-3 border-t border-[var(--border)] bg-[var(--muted)]/20 flex items-center justify-between text-[11px] text-[var(--muted-foreground)] mt-auto">
            <span>Showing {currentTableTrades.length} {tableTab === 'open' ? 'open' : 'recent'} trades</span>
            <Link 
              href="/trades" 
              className="inline-flex items-center gap-1 font-medium text-[var(--foreground)] hover:text-blue-500 transition-colors group"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: Calendar */}
        <div className="lg:col-span-3">
          <CalendarHeatmap trades={trades} />
        </div>
      </div>

      {/* Trade Details Modal */}
      {selectedTradeForModal && (
        <ViewTradeModal
          isOpen={!!selectedTradeForModal}
          onClose={() => setSelectedTradeForModal(null)}
          trade={selectedTradeForModal}
        />
      )}
    </div>
  );
}




