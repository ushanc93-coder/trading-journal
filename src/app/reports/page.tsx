"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { parseISO, getDay } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

export default function ReportsPage() {
  const { trades, isLoaded } = useTradesContext();

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading reports...</div>;

  if (trades.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)] bg-[var(--card)] rounded-xl border border-[var(--border)]">
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
        <h2 className="text-2xl font-bold text-white tracking-tight">Advanced Reports</h2>
        <p className="text-[var(--muted-foreground)] mt-1">Deep dive into your statistical edge and performance metrics.</p>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Expectancy (Per Trade)" value={`$${expectancy.toFixed(2)}`} highlight={expectancy >= 0} />
        <MetricCard title="Largest Win" value={`$${largestWin.toLocaleString()}`} highlight={true} />
        <MetricCard title="Largest Loss" value={`-$${Math.abs(largestLoss).toLocaleString()}`} highlight={false} isLoss />
        <MetricCard title="Total Trades" value={trades.length.toString()} highlight={null} />
        
        <MetricCard title="Gross Profit" value={`$${grossProfit.toLocaleString()}`} highlight={true} />
        <MetricCard title="Gross Loss" value={`-$${grossLoss.toLocaleString()}`} highlight={false} isLoss />
        <MetricCard title="Average Win" value={`$${avgWin.toFixed(2)}`} highlight={true} />
        <MetricCard title="Average Loss" value={`-$${avgLoss.toFixed(2)}`} highlight={false} isLoss />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Day of the week Performance */}
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
          <h3 className="text-lg font-bold text-white mb-6">P&L by Day of the Week</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeDayStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }}
                  itemStyle={{ color: '#fafafa' }}
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {activeDayStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Class Comparison */}
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
          <h3 className="text-lg font-bold text-white mb-6">Asset Class P&L</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }}
                  itemStyle={{ color: '#fafafa' }}
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                />
                <Bar dataKey="pnl" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
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

function MetricCard({ title, value, highlight, isLoss = false }: { title: string, value: string, highlight: boolean | null, isLoss?: boolean }) {
  let colorClass = "text-white";
  if (highlight === true) colorClass = "text-[var(--win)]";
  if (highlight === false || isLoss) colorClass = "text-[var(--loss)]";

  return (
    <div className="bg-[var(--card)] p-5 rounded-md border border-[var(--border)] flex flex-col justify-center">
      <div className="text-sm font-medium text-[var(--muted-foreground)] mb-2">{title}</div>
      <h3 className={`text-2xl font-bold ${colorClass}`}>{value}</h3>
    </div>
  );
}
