"use client";

import { useTrades } from "@/lib/useTrades";
import { ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { format, parseISO } from "date-fns";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import Link from "next/link";

export default function DashboardPage() {
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

  // Data for Equity Curve
  let cumulative = 0;
  const equityData = [...trades].reverse().map(trade => {
    cumulative += trade.netPnL;
    return {
      date: format(parseISO(trade.date), 'MM/dd/yyyy'),
      equity: cumulative
    };
  });

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
    { name: "Winners", value: wins.length, color: "#10b981" },
    { name: "Losers", value: losses.length, color: "#ef4444" }
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* Top row of KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total P&L */}
        <div className="bg-[var(--card)] p-5 rounded-md border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Total P&L <Info className="w-3 h-3 ml-1" />
          </div>
          <h3 className={`text-2xl font-bold ${netPnL >= 0 ? "text-[var(--win)]" : "text-[var(--loss)]"}`}>
            ${netPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Trades in total: {totalTrades}</p>
        </div>

        {/* Profit factor */}
        <div className="bg-[var(--card)] p-5 rounded-md border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Profit factor <Info className="w-3 h-3 ml-1" />
          </div>
          <h3 className="text-2xl font-bold text-white">{profitFactor}</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center">
             +0.12 {/* Mock trend */}
          </p>
        </div>

        {/* Average winning trade */}
        <div className="bg-[var(--card)] p-5 rounded-md border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Average winning trade <Info className="w-3 h-3 ml-1" />
          </div>
          <h3 className="text-2xl font-bold text-[var(--win)]">
            ${avgWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-[var(--win)] mt-1 flex items-center">
             <ArrowUpRight className="w-3 h-3 mr-0.5" /> +17.25
          </p>
        </div>

        {/* Average losing trade */}
        <div className="bg-[var(--card)] p-5 rounded-md border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Average losing trade <Info className="w-3 h-3 ml-1" />
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
          <div className="bg-[var(--card)] p-5 rounded-md border border-[var(--border)] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm">Winning % By Trades</h3>
              <Info className="w-4 h-4 text-[var(--muted-foreground)]" />
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataTrades}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={60}
                      dataKey="value" stroke="none"
                      isAnimationActive={false}
                    >
                      {pieDataTrades.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">{winRate}%</span>
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
          <div className="bg-[var(--card)] p-5 rounded-md border border-[var(--border)] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm">Winning % By Days</h3>
              <Info className="w-4 h-4 text-[var(--muted-foreground)]" />
            </div>
            <div className="flex items-center justify-between mt-6">
              {/* For simplicity using same logic as trades, assuming 1 trade = 1 day here. In real app we'd map days. */}
              <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataTrades}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={60}
                      dataKey="value" stroke="none"
                      isAnimationActive={false}
                    >
                      {pieDataTrades.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">{winRate}%</span>
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
        <div className="lg:col-span-3 bg-[var(--card)] p-6 rounded-md border border-[var(--border)]">
          <div className="flex items-center mb-8 border-b border-[var(--border)] pb-2">
            <h3 className="font-semibold mr-4 border-b-2 border-white pb-2 -mb-[9px]">Daily Net cumulative P&L</h3>
            <h3 className="text-[var(--muted-foreground)] font-medium pb-2 -mb-[9px] cursor-pointer hover:text-[var(--foreground)]">Net daily P&L</h3>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={off} stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset={off} stopColor="#ef4444" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }}
                  itemStyle={{ color: '#fafafa' }}
                />
                <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={1} fillOpacity={1} fill="url(#splitColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Table */}
        <div className="bg-[var(--card)] rounded-md border border-[var(--border)] flex flex-col">
          <div className="flex border-b border-[var(--border)]">
            <button className="flex-1 py-3 text-sm font-semibold text-[var(--muted-foreground)] hover:text-zinc-200 text-center">Recent trades</button>
            <button className="flex-1 py-3 text-sm font-semibold text-white border-b-2 border-white text-center">Open positions</button>
          </div>
          <div className="flex-1 overflow-x-auto hide-scrollbar">
            <table className="w-full text-xs text-left min-w-[500px]">
              <thead className="text-[var(--muted-foreground)] uppercase bg-[var(--card)]/50">
                <tr>
                  <th className="px-4 py-2 font-medium">Open date</th>
                  <th className="px-4 py-2 font-medium">Symbol</th>
                  <th className="px-4 py-2 font-medium text-right">Volume</th>
                  <th className="px-4 py-2 font-medium text-center">Execs</th>
                  <th className="px-4 py-2 font-medium text-right">P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {trades.slice(0, 10).map((trade) => (
                  <tr key={trade.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{format(parseISO(trade.date), 'MM/dd/yyyy')}</td>
                    <td className="px-4 py-3 font-semibold text-white">{trade.symbol}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] text-right">{trade.lotSize.toFixed(1)}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] text-center">2</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[var(--muted-foreground)] text-[10px] uppercase">{trade.status === 'Win' ? 'closed' : 'open'}</span>
                        <span className={`font-medium ${trade.netPnL > 0 ? 'text-[var(--win)]' : trade.netPnL < 0 ? 'text-[var(--loss)]' : 'text-[var(--be)]'}`}>
                          ${trade.netPnL}
                        </span>
                      </div>
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
