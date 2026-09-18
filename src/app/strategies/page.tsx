"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { useSettingsContext } from "@/lib/SettingsContext";
import { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Briefcase, Sparkles, Wand2, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function StrategiesPage() {
  const { trades, isLoaded } = useTradesContext();
  const { preferences } = useSettingsContext();
  
  const [roughIdea, setRoughIdea] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refinedSOP, setRefinedSOP] = useState<string | null>(null);

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading strategies...</div>;

  if (trades.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)] bg-[var(--card)] rounded-xl border border-[var(--border)]">
        No data available to analyze strategies. Add some trades first!
      </div>
    );
  }

  // --- Strategy Performance Data ---
  const strategyStats = trades.reduce((acc, trade) => {
    const strat = trade.strategy || "Unknown";
    if (!acc[strat]) acc[strat] = { name: strat, pnl: 0, wins: 0, losses: 0, total: 0 };
    acc[strat].pnl += trade.netPnL;
    acc[strat].total += 1;
    if (trade.status === "Win") acc[strat].wins += 1;
    else if (trade.status === "Loss") acc[strat].losses += 1;
    return acc;
  }, {} as Record<string, { name: string, pnl: number, wins: number, losses: number, total: number }>);

  const strategyData = Object.values(strategyStats).map(s => ({
    ...s,
    winRate: Math.round((s.wins / s.total) * 100),
    avgWin: s.wins > 0 ? (trades.filter(t => t.strategy === s.name && t.status === 'Win').reduce((sum, t) => sum + t.netPnL, 0) / s.wins) : 0,
  })).sort((a, b) => b.pnl - a.pnl);

  const bestStrategy = strategyData[0] || null;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Strategies Playbook</h2>
        <p className="text-[var(--muted-foreground)] mt-1">Identify which trading setups actually generate your profits.</p>
      </div>

      {bestStrategy && (
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-[var(--primary)]/30 rounded-xl p-6 flex items-center">
          <div className="bg-[var(--primary)]/20 p-4 rounded-full mr-6">
            <Briefcase className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-purple-300 uppercase tracking-wider mb-1">Most Profitable Setup</h3>
            <div className="text-2xl font-bold text-white">{bestStrategy.name}</div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Generated <span className="text-[var(--win)] font-bold">${bestStrategy.pnl.toLocaleString()}</span> with a {bestStrategy.winRate}% win rate across {bestStrategy.total} trades.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Net P&L by Strategy */}
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
          <h3 className="text-lg font-bold text-white mb-6">Net P&L by Strategy</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }}
                  itemStyle={{ color: '#fafafa' }}
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {strategyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate by Strategy */}
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
          <h3 className="text-lg font-bold text-white mb-6">Win Rate by Strategy</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }}
                  itemStyle={{ color: '#fafafa' }}
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                />
                <Bar dataKey="winRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Strategies Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--muted-foreground)] uppercase bg-[var(--card)]/80 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Strategy Name</th>
                <th className="px-6 py-4 font-semibold text-center">Total Trades</th>
                <th className="px-6 py-4 font-semibold text-center">Win Rate</th>
                <th className="px-6 py-4 font-semibold text-right">Avg Win</th>
                <th className="px-6 py-4 font-semibold text-right">Net P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {strategyData.map((strat) => (
                <tr key={strat.name} className="hover:bg-[var(--muted)]/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{strat.name}</td>
                  <td className="px-6 py-4 text-center text-[var(--muted-foreground)]">{strat.total}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      strat.winRate >= 50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {strat.winRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--win)] font-mono">
                    ${strat.avgWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold font-mono">
                    <span className={strat.pnl > 0 ? 'text-[var(--win)]' : strat.pnl < 0 ? 'text-[var(--loss)]' : 'text-[var(--be)]'}>
                      {strat.pnl >= 0 ? '+' : ''}${strat.pnl.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Strategy Refiner */}
      <div className="bg-[var(--card)] border border-[var(--primary)]/20 rounded-xl p-8 relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Wand2 className="w-32 h-32 text-[var(--primary)]" />
        </div>
        <div className="relative z-10 max-w-4xl">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-[var(--primary)]" /> AI Strategy Refiner
          </h3>
          <p className="text-[var(--muted-foreground)] mb-6 text-sm">
            Type a rough, messy idea for a strategy you have in mind. The AI will refine it into a strict, executable Standard Operating Procedure (SOP).
          </p>

          <div className="space-y-4">
            <textarea
              className="w-full bg-[var(--card)]/50 border border-[var(--border)] rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none h-32 placeholder-zinc-600"
              placeholder="e.g. I want to trade gold when london opens if it sweeps asia high and breaks structure down on 5m, targeting the asia low..."
              value={roughIdea}
              onChange={(e) => setRoughIdea(e.target.value)}
            />
            
            <button
              onClick={async () => {
                const apiKey = preferences.geminiApiKey;
                if (!apiKey) {
                  alert("Please enter your Gemini API Key in Settings.");
                  return;
                }
                if (!roughIdea.trim()) return;

                setIsRefining(true);
                setRefinedSOP(null);
                try {
                  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contents: [{ parts: [{ text: `Take this messy trading idea and turn it into a highly professional, strict, and precise Standard Operating Procedure (SOP) checklist. Do not include any JSON. Use Markdown. Break it down into: Context, Entry Criteria, Invalidation (Stop Loss), Target (Take Profit), and Risk Management. Idea: "${roughIdea}"` }] }]
                    })
                  });
                  const data = await res.json();
                  if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    setRefinedSOP(data.candidates[0].content.parts[0].text);
                  } else {
                    setRefinedSOP("Error generating SOP.");
                  }
                } catch (e) {
                  setRefinedSOP("Error generating SOP.");
                } finally {
                  setIsRefining(false);
                }
              }}
              disabled={isRefining || !roughIdea.trim()}
              className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)] disabled:bg-purple-800 disabled:opacity-50 text-white rounded-md font-medium transition-colors flex items-center"
            >
              {isRefining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Refine into strict SOP
            </button>
          </div>

          {refinedSOP && (
            <div className="mt-8 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
              <h4 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-4 border-b border-[var(--border)] pb-2">Refined Standard Operating Procedure</h4>
              <div className="prose prose-invert prose-purple max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{refinedSOP}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
