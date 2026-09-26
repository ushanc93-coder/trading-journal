"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { parseISO, getDay } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Info } from "lucide-react";


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isLoss = payload[0].value < 0;
    return (
      <div className="bg-[var(--card)]/80 backdrop-blur-md border border-[var(--border)] p-4 rounded-xl shadow-xl">
        <p className="text-[var(--muted-foreground)] font-medium text-sm mb-1">{label}</p>
        <p className={`text-lg font-bold ${isLoss ? 'text-[var(--loss)]' : 'text-[var(--profit)]'}`}>
          {isLoss ? '-' : ''}$\{Math.abs(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { trades, isLoaded } = useTradesContext();

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading reports...</div>;

  if (trades.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)] bg-[var(--card)] rounded-3xl border border-[var(--border)]">
        No data available to generate reports. Add some trades first!
      </div>
    );
  }

  // --- Aggregate Metrics ---
  const wins = trades.filter(t => t.status === "Win");
  const losses = trades.filter(t => t.status === "Loss");
  
  const grossProfit = wins.reduce((sum, t) => sum + t.netPnL, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.netPnL, 0));
  const netPnL = grossProfit - grossLoss;
  
  const winRate = trades.length > 0 ? wins.length / trades.length : 0;
  const lossRate = 1 - winRate;
  
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  
  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.netPnL)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.netPnL)) : 0;
  
  // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
  const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

  // --- Chart 1: P&L by Day of the Week ---
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayStats = Array(7).fill(0).map((_, i) => ({ day: daysOfWeek[i], pnl: 0, trades: 0 }));
  
  trades.forEach(trade => {
    const dayIndex = getDay(parseISO(trade.date));
    dayStats[dayIndex].pnl += trade.netPnL;
    dayStats[dayIndex].trades += 1;
  });
  
  // Filter out weekends if empty
  const activeDayStats = dayStats.filter(d => d.trades > 0);

  // --- Chart 2: Asset Class Performance ---
  const assetClasses = {
    Forex: { name: "Forex", wins: 0, losses: 0, pnl: 0 },
    Index: { name: "Indices", wins: 0, losses: 0, pnl: 0 }
  };
  
  trades.forEach(trade => {
    const cat = trade.category === "Forex" ? "Forex" : "Index";
    if (trade.status === "Win") assetClasses[cat].wins++;
    else if (trade.status === "Loss") assetClasses[cat].losses++;
    assetClasses[cat].pnl += trade.netPnL;
  });

  const assetData = Object.values(assetClasses).filter(a => a.wins > 0 || a.losses > 0);

  // --- Chart 3: Long vs Short ---
  const directionData = [
    { name: "Longs", value: trades.filter(t => t.direction === "Long").length, color: "#8b5cf6" },
    { name: "Shorts", value: trades.filter(t => t.direction === "Short").length, color: "#ec4899" }
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Advanced Reports</h2>
        <p className="text-[var(--muted-foreground)] mt-1">Deep dive into your statistical edge and performance metrics.</p>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard tooltipText="The average amount you can expect to win or lose on every single trade you take." title="Expectancy (Per Trade)" value={`$${expectancy.toFixed(2)}`} highlight={expectancy >= 0} />
        <MetricCard tooltipText="The single biggest winning trade in your history." title="Largest Win" value={`$${largestWin.toLocaleString()}`} highlight={true} />
        <MetricCard tooltipText="The single biggest losing trade in your history." title="Largest Loss" value={`-$${Math.abs(largestLoss).toLocaleString()}`} highlight={false} isLoss />
        <MetricCard tooltipText="The total number of closed trades recorded." title="Total Trades" value={trades.length.toString()} highlight={null} />
        
        <MetricCard tooltipText="The total sum of money made strictly from winning trades." title="Gross Profit" value={`$${grossProfit.toLocaleString()}`} highlight={true} />
        <MetricCard tooltipText="The total sum of money lost strictly from losing trades." title="Gross Loss" value={`-$${grossLoss.toLocaleString()}`} highlight={false} isLoss />
        <MetricCard tooltipText="The average profit size of a winning trade." title="Average Win" value={`$${avgWin.toFixed(2)}`} highlight={true} />
        <MetricCard tooltipText="The average loss size of a losing trade." title="Average Loss" value={`-$${avgLoss.toFixed(2)}`} highlight={false} isLoss />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Day of the week Performance */}
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">P&L by Day of the Week</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeDayStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.2 }} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {activeDayStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Class Comparison */}
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">Asset Class P&L</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.2 }} />
                <Bar dataKey="pnl" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#8b5cf6' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, highlight, isLoss = false, tooltipText }: { title: string, value: string, highlight: boolean | null, isLoss?: boolean, tooltipText?: string }) {
  let colorClass = "text-[var(--foreground)]";
  if (highlight === true) colorClass = "text-[var(--win)]";
  if (highlight === false || isLoss) colorClass = "text-[var(--loss)]";

  return (
    <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex flex-col justify-center hover:border-[var(--primary)]/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 relative">
      <div className="text-sm font-medium text-[var(--muted-foreground)] mb-2 flex items-center relative z-20">
        {title}
        {tooltipText && (
          <div className="group relative flex items-center">
            <Info className="cursor-help w-3 h-3 ml-1" />
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
              {tooltipText}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]"></div>
            </div>
          </div>
        )}
      </div>
      <h3 className={`text-2xl font-bold ${colorClass}`}>{value}</h3>
    </div>
  );
}
