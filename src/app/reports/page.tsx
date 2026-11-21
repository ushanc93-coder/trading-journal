"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { parseISO, getDay } from "date-fns";
import { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, LabelList, Cell
} from "recharts";
import { 
  Info, BarChart2, TrendingUp, Layers, ArrowUp, ArrowDown, 
  CheckCircle2, XCircle, ListFilter
} from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = Number(payload[0].value) || 0;
    const isLoss = val < 0;
    const fullDay = payload[0].payload?.day;
    const tradesCount = payload[0].payload?.trades;
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] p-3 rounded-xl shadow-xl z-50">
        <p className="text-[var(--muted-foreground)] font-medium text-xs mb-1">
          {fullDay || label || payload[0].name}
        </p>
        <p className={`text-base font-bold ${isLoss ? 'text-[var(--loss)]' : 'text-[var(--win)]'}`}>
          {isLoss ? '-' : '+'}${Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {tradesCount !== undefined && (
          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
            {tradesCount} {tradesCount === 1 ? 'trade' : 'trades'}
          </p>
        )}
      </div>
    );
  }
  return null;
};

function formatCurrency(val: number, forceSign = false): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (isNegative) return `-$${formatted}`;
  if (forceSign && val > 0) return `+$${formatted}`;
  return `$${formatted}`;
}

export default function ReportsPage() {
  const { trades, isLoaded } = useTradesContext();
  const [symbolView, setSymbolView] = useState<"chart" | "rankings">("chart");

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading reports...</div>;

  if (trades.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)] bg-[var(--card)] rounded-lg border border-[var(--border)]">
        No data available to generate reports. Add some trades first!
      </div>
    );
  }

  // --- 1. Aggregate Metrics ---
  const wins = trades.filter(t => t.status === "Win");
  const losses = trades.filter(t => t.status === "Loss");
  
  const grossProfit = wins.reduce((sum, t) => sum + (t.netPnL > 0 ? t.netPnL : 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.netPnL < 0 ? t.netPnL : 0), 0));
  const netPnL = grossProfit - grossLoss;
  
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  
  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.netPnL)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.netPnL)) : 0;
  
  // Reconciled Expectancy (Per Trade): Net Profit / Total Trades ($825.00 / 11 = $75.00)
  const expectancy = trades.length > 0 ? netPnL / trades.length : 0;

  // --- 2. Card 1 Data: P&L by Day of the Week (Mon - Fri) ---
  const hasCrypto = trades.some(t => (t.category as string) === "Crypto" || t.symbol.toUpperCase().includes("BTC") || t.symbol.toUpperCase().includes("ETH"));
  const weekdays = [
    { key: "Monday", short: "Mon" },
    { key: "Tuesday", short: "Tue" },
    { key: "Wednesday", short: "Wed" },
    { key: "Thursday", short: "Thu" },
    { key: "Friday", short: "Fri" }
  ];
  if (hasCrypto) {
    weekdays.push({ key: "Saturday", short: "Sat" }, { key: "Sunday", short: "Sun" });
  }

  const dayStatsMap: Record<string, { day: string; short: string; pnl: number; trades: number }> = {};
  weekdays.forEach(d => {
    dayStatsMap[d.key] = { day: d.key, short: d.short, pnl: 0, trades: 0 };
  });

  trades.forEach(trade => {
    const dayIdx = getDay(parseISO(trade.date)); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const fullDayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIdx];
    
    let targetDay = fullDayName;
    if (!hasCrypto) {
      if (fullDayName === "Saturday" || fullDayName === "Sunday") {
        targetDay = "Friday";
      }
    }
    if (dayStatsMap[targetDay]) {
      dayStatsMap[targetDay].pnl += trade.netPnL;
      dayStatsMap[targetDay].trades += 1;
    }
  });

  const dayStats = weekdays.map(d => ({
    ...dayStatsMap[d.key],
    pnl: Math.round(dayStatsMap[d.key].pnl * 100) / 100
  }));
  const bestDay = [...dayStats].sort((a, b) => b.pnl - a.pnl)[0];

  // --- 3. Card 2 Data: P&L by Asset / Symbol ---
  const symbolStatsMap: Record<string, { symbol: string; pnl: number; trades: number; wins: number; losses: number }> = {};
  trades.forEach(t => {
    if (!symbolStatsMap[t.symbol]) {
      symbolStatsMap[t.symbol] = { symbol: t.symbol, pnl: 0, trades: 0, wins: 0, losses: 0 };
    }
    symbolStatsMap[t.symbol].pnl += t.netPnL;
    symbolStatsMap[t.symbol].trades += 1;
    if (t.netPnL > 0) symbolStatsMap[t.symbol].wins += 1;
    else if (t.netPnL < 0) symbolStatsMap[t.symbol].losses += 1;
  });

  const symbolData = Object.values(symbolStatsMap)
    .map(s => ({
      ...s,
      pnl: Math.round(s.pnl * 100) / 100
    }))
    .sort((a, b) => b.pnl - a.pnl);
  const bestSymbol = symbolData[0];

  // --- 4. Card 3 Data: Asset Class & Direction Breakdown ---
  const forexTrades = trades.filter(t => t.category === "Forex");
  const indexTrades = trades.filter(t => t.category === "Index");

  const forexPnL = forexTrades.reduce((sum, t) => sum + t.netPnL, 0);
  const indexPnL = indexTrades.reduce((sum, t) => sum + t.netPnL, 0);
  const totalPositivePnL = Math.max(1, Math.max(0, forexPnL) + Math.max(0, indexPnL));

  const forexPct = Math.round((Math.max(0, forexPnL) / totalPositivePnL) * 100);
  const indexPct = 100 - forexPct;

  const forexWins = forexTrades.filter(t => t.status === "Win").length;
  const forexWinRate = forexTrades.length > 0 ? (forexWins / forexTrades.length) * 100 : 0;

  const indexWins = indexTrades.filter(t => t.status === "Win").length;
  const indexWinRate = indexTrades.length > 0 ? (indexWins / indexTrades.length) * 100 : 0;

  // Direction: Long vs Short
  const longTrades = trades.filter(t => t.direction === "Long");
  const shortTrades = trades.filter(t => t.direction === "Short");

  const longPnL = longTrades.reduce((sum, t) => sum + t.netPnL, 0);
  const shortPnL = shortTrades.reduce((sum, t) => sum + t.netPnL, 0);

  const longWins = longTrades.filter(t => t.status === "Win").length;
  const longWinRate = longTrades.length > 0 ? (longWins / longTrades.length) * 100 : 0;

  const shortWins = shortTrades.filter(t => t.status === "Win").length;
  const shortWinRate = shortTrades.length > 0 ? (shortWins / shortTrades.length) * 100 : 0;

  const longAvgRR = longTrades.length > 0 
    ? (longTrades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / longTrades.length).toFixed(1)
    : "0.0";
  const shortAvgRR = shortTrades.length > 0 
    ? (shortTrades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / shortTrades.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Advanced Reports</h2>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Statistical edge and multi-dimensional performance metrics.</p>
      </div>

      {/* Aggregate Metrics Grid (All Standardized to 2 Decimals) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <MetricCard 
          tooltipText="The average amount you can expect to make or lose per trade: Net Profit ($825.00) / Total Trades (11) = $75.00." 
          title="Expectancy (Per Trade)" 
          value={formatCurrency(expectancy)} 
          highlight={expectancy >= 0} 
        />
        <MetricCard 
          tooltipText="The single biggest winning trade in your history." 
          title="Largest Win" 
          value={formatCurrency(largestWin)} 
          highlight={true} 
        />
        <MetricCard 
          tooltipText="The single biggest losing trade in your history." 
          title="Largest Loss" 
          value={formatCurrency(largestLoss)} 
          highlight={false} 
          isLoss 
        />
        <MetricCard 
          tooltipText="The total number of closed trades recorded." 
          title="Total Trades" 
          value={trades.length.toString()} 
          highlight={null} 
        />
        
        <MetricCard 
          tooltipText="The total sum of money made strictly from winning trades." 
          title="Gross Profit" 
          value={formatCurrency(grossProfit)} 
          highlight={true} 
        />
        <MetricCard 
          tooltipText="The total sum of money lost strictly from losing trades." 
          title="Gross Loss" 
          value={formatCurrency(-grossLoss)} 
          highlight={false} 
          isLoss 
        />
        <MetricCard 
          tooltipText="The average profit size of a winning trade: Gross Profit ($975.00) / 7 wins = $139.29." 
          title="Average Win" 
          value={formatCurrency(avgWin)} 
          highlight={true} 
        />
        <MetricCard 
          tooltipText="The average loss size of a losing trade: Gross Loss ($150.00) / 3 losses = -$50.00." 
          title="Average Loss" 
          value={formatCurrency(-avgLoss)} 
          highlight={false} 
          isLoss 
        />
      </div>

      {/* Symmetrical 3-Card Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* CARD 1: P&L by Day of the Week (Mon - Fri) */}
        <div className="neumorphic-card p-5 sm:p-6 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">P&L by Day of Week</h3>
                <p className="text-[11px] text-[var(--muted-foreground)]">Mon – Fri trading sessions</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-[var(--muted-foreground)]">
                5 Days
              </span>
            </div>
            
            <div className="h-[270px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayStats} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="short" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `$${val}`}
                    domain={[
                      (dataMin: number) => Math.min(0, Math.floor(dataMin * 1.25 / 50) * 50),
                      (dataMax: number) => Math.max(0, Math.ceil(dataMax * 1.25 / 50) * 50)
                    ]}
                  />
                  <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.2 }} />
                  <Bar dataKey="pnl" barSize={26} maxBarSize={28} radius={[4, 4, 0, 0]}>
                    {dayStats.map((entry, index) => (
                      <Cell key={`day-cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                    <LabelList 
                      dataKey="pnl" 
                      position="top" 
                      formatter={(val: any) => formatCurrency(Number(val), true)}
                      fill="var(--foreground)" 
                      fontSize={10} 
                      fontWeight={700}
                      offset={6}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)]">Best Performer:</span>
            <span className="font-semibold tabular-nums text-[var(--win)]">
              {bestDay?.day} ({formatCurrency(bestDay?.pnl || 0, true)})
            </span>
          </div>
        </div>

        {/* CARD 2: P&L by Asset / Symbol */}
        <div className="neumorphic-card p-5 sm:p-6 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">P&L by Asset / Symbol</h3>
                <p className="text-[11px] text-[var(--muted-foreground)]">Net profit per instrument</p>
              </div>
              <div className="flex items-center bg-[var(--muted)]/50 p-0.5 rounded-full border border-[var(--border)] text-[11px] font-medium">
                <button 
                  onClick={() => setSymbolView("chart")}
                  className={`px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                    symbolView === "chart" 
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold" 
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <BarChart2 className="w-3 h-3" />
                  Chart
                </button>
                <button 
                  onClick={() => setSymbolView("rankings")}
                  className={`px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                    symbolView === "rankings" 
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold" 
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <ListFilter className="w-3 h-3" />
                  List
                </button>
              </div>
            </div>

            {symbolView === "chart" ? (
              <div className="h-[270px] w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={symbolData} margin={{ top: 25, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis 
                      dataKey="symbol" 
                      stroke="var(--muted-foreground)" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={35}
                    />
                    <YAxis 
                      stroke="var(--muted-foreground)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `$${val}`}
                      domain={[
                        (dataMin: number) => Math.min(0, Math.floor(dataMin * 1.3 / 50) * 50),
                        (dataMax: number) => Math.max(0, Math.ceil(dataMax * 1.3 / 50) * 50)
                      ]}
                    />
                    <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.2 }} />
                    <Bar dataKey="pnl" barSize={20} maxBarSize={24} radius={[5, 5, 0, 0]}>
                      {symbolData.map((entry, index) => (
                        <Cell key={`sym-cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                      ))}
                      <LabelList 
                        dataKey="pnl" 
                        position="top" 
                        formatter={(val: any) => formatCurrency(Number(val), true)}
                        fill="var(--foreground)" 
                        fontSize={9} 
                        fontWeight={700}
                        offset={6}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[270px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {symbolData.map(item => (
                  <div key={item.symbol} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--card)]/80 border border-[var(--border)] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--foreground)]">{item.symbol}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">({item.trades} trades)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        {item.wins}W / {item.losses}L
                      </span>
                      <span className={`font-bold ${item.pnl >= 0 ? 'text-[var(--win)]' : 'text-[var(--loss)]'}`}>
                        {formatCurrency(item.pnl, true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)]">Top Instrument:</span>
            <span className="font-bold text-[var(--win)]">
              {bestSymbol?.symbol} ({formatCurrency(bestSymbol?.pnl || 0, true)})
            </span>
          </div>
        </div>

        {/* CARD 3: Asset Class & Trade Direction */}
        <div className="neumorphic-card p-5 sm:p-6 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">Asset Class & Direction</h3>
                <p className="text-[11px] text-[var(--muted-foreground)]">Asset allocation & Long vs Short edge</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-[var(--muted-foreground)]">
                Breakdown
              </span>
            </div>

            {/* Asset Class Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Forex ({forexPct}%)
                </span>
                <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Indices ({indexPct}%)
                </span>
              </div>
              
              <div className="w-full h-2.5 bg-[var(--muted)] rounded-full overflow-hidden flex p-0.5 border border-[var(--border)]">
                <div style={{ width: `${forexPct}%` }} className="bg-indigo-500 rounded-l-full h-full transition-all" />
                <div style={{ width: `${indexPct}%` }} className="bg-purple-500 rounded-r-full h-full transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 rounded-md bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30">
                  <div className="text-[10px] text-[var(--muted-foreground)]">Forex Net P&L</div>
                  <div className="text-xs font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">{formatCurrency(forexPnL, true)}</div>
                  <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{forexWinRate.toFixed(1)}% Win Rate ({forexTrades.length} trades)</div>
                </div>
                <div className="p-2 rounded-md bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30">
                  <div className="text-[10px] text-[var(--muted-foreground)]">Indices Net P&L</div>
                  <div className="text-xs font-semibold tabular-nums text-purple-600 dark:text-purple-400">{formatCurrency(indexPnL, true)}</div>
                  <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{indexWinRate.toFixed(1)}% Win Rate ({indexTrades.length} trades)</div>
                </div>
              </div>
            </div>

            {/* Trade Direction (Long vs Short) */}
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div className="text-[10px] font-semibold text-[var(--foreground)] uppercase tracking-wider">
                Direction Performance
              </div>

              {/* Longs */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                    <ArrowUp className="w-3.5 h-3.5" />
                    Longs ({longTrades.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums">Avg R:R 1:{longAvgRR}</span>
                    <span className="font-semibold tabular-nums text-xs text-[var(--win)]">{formatCurrency(longPnL, true)}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div style={{ width: `${longWinRate}%` }} className="bg-[#10B981] h-full rounded-full transition-all" />
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5 text-right tabular-nums">
                  {longWins} Wins ({longWinRate.toFixed(1)}% Win Rate)
                </div>
              </div>

              {/* Shorts */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 font-semibold text-rose-500 text-xs">
                    <ArrowDown className="w-3.5 h-3.5" />
                    Shorts ({shortTrades.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums">Avg R:R {shortAvgRR}R</span>
                    <span className="font-semibold tabular-nums text-xs text-[var(--loss)]">{formatCurrency(shortPnL, true)}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div style={{ width: `${shortWinRate}%` }} className="bg-[#EF4444] h-full rounded-full transition-all" />
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5 text-right tabular-nums">
                  {shortWins} Win ({shortWinRate.toFixed(1)}% Win Rate)
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)]">Primary Edge:</span>
            <span className="font-semibold tabular-nums text-[var(--win)]">
              Long Positions ({longWinRate.toFixed(1)}% Win Rate)
            </span>
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
    <div className="neumorphic-card p-4 flex flex-col justify-between transition-all duration-200 relative">
      <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 flex items-center justify-between relative z-20">
        <span>{title}</span>
        {tooltipText && (
          <div className="group relative flex items-center">
            <Info className="cursor-help w-3 h-3 text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)]" />
            <div className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2.5 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-xl shadow-xl z-50 text-center font-normal whitespace-normal">
              {tooltipText}
            </div>
          </div>
        )}
      </div>
      <h3 className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${colorClass}`}>{value}</h3>
    </div>
  );
}
