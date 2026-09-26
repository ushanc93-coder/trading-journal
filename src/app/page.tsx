"use client";

import { useTrades } from "@/lib/useTrades";
import { ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { format, parseISO } from "date-fns";
  import { useState } from "react";
import { motion } from "framer-motion";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import Link from "next/link";

export default function DashboardPage() {
    const [chartTab, setChartTab] = useState("cumulative");
  const [tableTab, setTableTab] = useState("recent");
  const { trades, isLoaded } = useTrades();

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading dashboard...</div>;

  // Derived Metrics
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.status === "Win");
  const losses = trades.filter(t => t.status === "Loss");
  const winRate = totalTrades > 0 ? Math.round((wins.length / totalTrades) * 100) : 0;
  
  const netPnL = trades.reduce((acc, trade) => acc + trade.netPnL, 0);
  
  const grossProfit = wins.reduce((acc, t) => acc + t.netPnL, 0);
  const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.netPnL, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "∞" : "0.00";

  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

  // Group trades by date
  const tradesByDate = [...trades].reverse().reduce((acc: Record<string, any>, trade: any) => {
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
  const equityData = Object.values(tradesByDate).map((day: any) => {
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
            <p className="text-[var(--foreground)]">Cumulative P&L: <span className={data.equity >= 0 ? "text-[var(--win)]" : "text-[var(--loss)]"}>${data.equity.toFixed(2)}</span></p>
          ) : (
            <p className="text-[var(--foreground)]">Net P&L: <span className={data.daily >= 0 ? "text-[var(--win)]" : "text-[var(--loss)]"}>${data.daily.toFixed(2)}</span></p>
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* Top row of KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total P&L */}
        <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Total P&L <div className="group relative flex items-center">
                <Info className="cursor-help w-3 h-3 ml-1" />
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  The total sum of Net Profit/Loss across all recorded trades.
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--foreground)]"></div>
                </div>
              </div>
          </div>
          <h3 className={`text-2xl font-bold ${netPnL >= 0 ? "text-[var(--win)]" : "text-[var(--loss)]"}`}>
            ${netPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Trades in total: {totalTrades}</p>
        </div>

        {/* Profit factor */}
        <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Profit factor <div className="group relative flex items-center">
                <Info className="cursor-help w-3 h-3 ml-1" />
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  Gross Profit divided by Gross Loss. A value above 1.0 means you are profitable.
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--foreground)]"></div>
                </div>
              </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--foreground)]">{profitFactor}</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center">
             +0.12 {/* Mock trend */}
          </p>
        </div>

        {/* Average winning trade */}
        <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Average winning trade <div className="group relative flex items-center">
                <Info className="cursor-help w-3 h-3 ml-1" />
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  Total Gross Profit divided by the total number of Winning trades.
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--foreground)]"></div>
                </div>
              </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--win)]">
            ${avgWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-[var(--win)] mt-1 flex items-center">
             <ArrowUpRight className="w-3 h-3 mr-0.5" /> +17.25
          </p>
        </div>

        {/* Average losing trade */}
        <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Average losing trade <div className="group relative flex items-center">
                <Info className="cursor-help w-3 h-3 ml-1" />
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  Total Gross Loss divided by the total number of Losing trades.
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--foreground)]"></div>
                </div>
              </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--loss)]">
            ${avgLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-[var(--loss)] mt-1 flex items-center">
             <ArrowDownRight className="w-3 h-3 mr-0.5" /> -21.36
          </p>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Donuts */}
        <div className="space-y-6 flex flex-col">
          {/* Winning % By Trades */}
          <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm">Winning % By Trades</h3>
              <div className="group relative flex items-center">
                <Info className="cursor-help w-4 h-4 text-[var(--muted-foreground)]" />
                <div className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  The percentage of total individual trades that resulted in a Win.
                  <div className="absolute top-full right-2 border-4 border-transparent border-t-[var(--foreground)]"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataTrades}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={60}
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
                  <span className="text-xl font-bold text-[var(--foreground)]">{winRate}%</span>
                  <span className="text-[10px] text-[var(--win)]">winrate</span>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col">
                  <div className="flex items-center text-sm font-bold">
                    <div className="w-3 h-3 bg-[var(--win)] rounded-sm mr-2"></div>
                    {wins.length}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] ml-5">winners</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center text-sm font-bold">
                    <div className="w-3 h-3 bg-[var(--loss)] rounded-sm mr-2"></div>
                    {losses.length}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] ml-5">losers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Winning % By Days */}
          <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm">Winning % By Days</h3>
              <div className="group relative flex items-center">
                <Info className="cursor-help w-4 h-4 text-[var(--muted-foreground)]" />
                <div className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  The percentage of trading days that ended with a positive Net P&L.
                  <div className="absolute top-full right-2 border-4 border-transparent border-t-[var(--foreground)]"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              {/* For simplicity using same logic as trades, assuming 1 trade = 1 day here. In real app we'd map days. */}
              <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataTrades}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={60}
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
                  <span className="text-xl font-bold text-[var(--foreground)]">{winRate}%</span>
                  <span className="text-[10px] text-[var(--win)]">winrate</span>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col">
                  <div className="flex items-center text-sm font-bold">
                    <div className="w-3 h-3 bg-[var(--win)] rounded-sm mr-2"></div>
                    {wins.length}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] ml-5">winners</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center text-sm font-bold">
                    <div className="w-3 h-3 bg-[var(--loss)] rounded-sm mr-2"></div>
                    {losses.length}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] ml-5">losers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Area Chart */}
        <div className="lg:col-span-3 bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)]">
          <div className="flex bg-[var(--muted)]/50 rounded-xl p-1.5 w-fit mb-8">
            <button 
              onClick={() => setChartTab('cumulative')}
              className={`relative px-4 py-1.5 font-medium text-sm transition-colors z-10 ${chartTab === 'cumulative' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
            >
              Daily Net cumulative P&L
              {chartTab === 'cumulative' && (
                <motion.div
                  layoutId="chartTab"
                  className="absolute inset-0 bg-[var(--card)] rounded-lg -z-10 border border-[var(--border)] shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
            <button 
              onClick={() => setChartTab('daily')}
              className={`relative px-4 py-1.5 font-medium text-sm transition-colors z-10 ${chartTab === 'daily' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
            >
              Net daily P&L
              {chartTab === 'daily' && (
                <motion.div
                  layoutId="chartTab"
                  className="absolute inset-0 bg-[var(--card)] rounded-lg -z-10 border border-[var(--border)] shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </div>
          
          <div className="h-[350px] w-full">
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
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="equity" stroke="var(--win)" strokeWidth={1} fillOpacity={1} fill="url(#splitColor)" isAnimationActive={true} animationDuration={1000} animationBegin={0} animationEasing="ease-out" />
                </AreaChart>
              ) : (
                <BarChart data={equityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Table */}
        <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] flex flex-col overflow-hidden">
          <div className="flex border-b border-[var(--border)] px-6 pt-6 pb-4">
            <div className="flex bg-[var(--muted)]/50 rounded-xl p-1 w-full">
              <button 
                onClick={() => setTableTab('recent')}
                className={`relative flex-1 px-2 py-1.5 font-medium text-sm transition-colors z-10 ${tableTab === 'recent' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
              >
                Recent
                {tableTab === 'recent' && (
                  <motion.div
                    layoutId="tableTab"
                    className="absolute inset-0 bg-[var(--card)] rounded-lg -z-10 border border-[var(--border)] shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
              <button 
                onClick={() => setTableTab('open')}
                className={`relative flex-1 px-2 py-1.5 font-medium text-sm transition-colors z-10 ${tableTab === 'open' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
              >
                Open
                {tableTab === 'open' && (
                  <motion.div
                    layoutId="tableTab"
                    className="absolute inset-0 bg-[var(--card)] rounded-lg -z-10 border border-[var(--border)] shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto hide-scrollbar">
            <table className="w-full text-xs text-left">
              <thead className="text-[var(--muted-foreground)] uppercase bg-[var(--card)]/50">
                <tr>
                  <th className="pl-6 pr-2 py-4 font-medium">Date</th>
                  <th className="px-2 py-4 font-medium">Symbol</th>
                  <th className="px-2 py-4 font-medium text-right">Vol</th>
                  <th className="pl-2 pr-6 py-4 font-medium text-right">P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {trades.filter(t => tableTab === 'recent' ? true : (t.status as string) === 'Open').slice(0, 10).map((trade) => (
                  <tr key={trade.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="pl-6 pr-2 py-4 text-[var(--muted-foreground)]">{format(parseISO(trade.date), 'MM/dd')}</td>
                    <td className="px-2 py-4 font-semibold text-[var(--foreground)]">{trade.symbol}</td>
                    <td className="px-2 py-4 text-[var(--muted-foreground)] text-right">{trade.lotSize.toFixed(1)}</td>
                    <td className="pl-2 pr-6 py-4 text-right">
                      <span className={`font-medium ${trade.netPnL > 0 ? 'text-[var(--win)]' : trade.netPnL < 0 ? 'text-[var(--loss)]' : 'text-[var(--be)]'}`}>
                          ${trade.netPnL}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Calendar */}
        <div className="lg:col-span-3">
          <CalendarHeatmap trades={trades} />
        </div>
      </div>
    </div>
  );
}




