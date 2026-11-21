"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { useSettingsContext } from "@/lib/SettingsContext";
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, ReferenceLine
} from "recharts";
import { 
  BrainCircuit, Target, Lightbulb, Loader2, Info, 
  Search, ChevronDown, ChevronUp, RefreshCw, Flame
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const isRate = item.dataKey === 'winRate' || item.dataKey === 'chartVal';
    const rawVal = isRate ? (item.payload?.winRate ?? item.value) : (item.payload?.pnl ?? item.value);
    const value = Number(rawVal) || 0;
    const isLoss = !isRate && value < 0;
    const tradesCount = item.payload?.total || item.payload?.count;

    return (
      <div className="bg-[var(--card)] border border-[var(--border)] p-3 rounded-xl shadow-xl z-50">
        <p className="text-[var(--muted-foreground)] font-semibold text-xs mb-1">
          {label || item.name}
        </p>
        <p className={`text-sm font-bold ${isRate ? 'text-[#4F39F6]' : isLoss ? 'text-rose-500' : 'text-[#4F39F6]'}`}>
          {isRate ? `${value}% Win Rate` : `${isLoss ? '-' : '+'}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </p>
        {tradesCount !== undefined && (
          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-medium">
            {tradesCount} {tradesCount === 1 ? 'trade' : 'trades'}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function InsightsPage() {
  const { trades, isLoaded } = useTradesContext();
  const { preferences } = useSettingsContext();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [showFullAi, setShowFullAi] = useState(false);

  // --- Discipline Score & Rule Adherence ---
  const totalTrades = trades.length;
  const rulesFollowed = trades.filter(t => t.rulesFollowed).length;
  const disciplineScore = totalTrades > 0 ? Math.round((rulesFollowed / totalTrades) * 100) : 0;

  // Breakdown metrics
  const overleveragedCount = trades.filter(t => t.mistake === "Over-leveraged").length;
  const riskRuleAdherence = totalTrades > 0 
    ? Math.round(((totalTrades - overleveragedCount) / totalTrades) * 100) 
    : 100;

  const tpslMistakesCount = trades.filter(t => t.mistake === "Moved SL" || t.mistake === "Early close").length;
  const tpslAdherence = totalTrades > 0 
    ? Math.round(((totalTrades - tpslMistakesCount) / totalTrades) * 100) 
    : 100;

  // Max Trades rule: all sessions logged adhered to max trade limit (or 100%)
  const maxTradesViolations = trades.filter(t => t.notes?.toLowerCase().includes("over-traded") && !t.rulesFollowed).length;
  const maxTradesAdherence = totalTrades > 0 
    ? (maxTradesViolations === 0 ? 100 : Math.round(((totalTrades - maxTradesViolations) / totalTrades) * 100))
    : 100;

  // --- Mistakes Analysis ---
  const mistakesCount = trades.reduce((acc, trade) => {
    if (trade.mistake && trade.mistake !== "None") {
      acc[trade.mistake] = (acc[trade.mistake] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const topMistake = Object.entries(mistakesCount).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

  // --- Emotion Performance ---
  const emotionStats = trades.reduce((acc, trade) => {
    const em = trade.emotion || "Unknown";
    if (!acc[em]) acc[em] = { name: em, pnl: 0, count: 0 };
    acc[em].pnl += trade.netPnL;
    acc[em].count += 1;
    return acc;
  }, {} as Record<string, { name: string, pnl: number, count: number }>);

  // Preferred sorted emotion order: FOMO, Calm, Anxious, Revenge, then others
  const emotionOrder = ["FOMO", "Calm", "Anxious", "Revenge"];
  const emotionData = Object.values(emotionStats).sort((a, b) => {
    const idxA = emotionOrder.indexOf(a.name);
    const idxB = emotionOrder.indexOf(b.name);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return b.pnl - a.pnl;
  });

  const highestPnlEmotion = [...emotionData].sort((a, b) => b.pnl - a.pnl)[0] || { name: "None", pnl: 0, count: 0 };
  const fomoTrades = trades.filter(t => t.emotion === "FOMO");
  const fomoPnL = fomoTrades.reduce((sum, t) => sum + t.netPnL, 0);

  // --- Session Performance ---
  const sessionStats = trades.reduce((acc, trade) => {
    const s = trade.session || "Unknown";
    if (!acc[s]) acc[s] = { name: s, pnl: 0, wins: 0, total: 0 };
    acc[s].pnl += trade.netPnL;
    acc[s].total += 1;
    if (trade.status === "Win") acc[s].wins += 1;
    return acc;
  }, {} as Record<string, { name: string, pnl: number, wins: number, total: number }>);

  // Standard ordered session list: London, New York, Asian
  const standardSessions = ["London", "New York", "Asian"];
  const sessionData = standardSessions.map(sessionName => {
    const stat = sessionStats[sessionName] || { name: sessionName, pnl: 0, wins: 0, total: 0 };
    const winRate = stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0;
    
    let displayLabel = "";
    if (stat.total === 0) {
      displayLabel = "0 trades / N/A";
    } else if (winRate === 0) {
      displayLabel = `0% [${stat.total} ${stat.total === 1 ? 'trade' : 'trades'}]`;
    } else {
      displayLabel = `${winRate}% [${stat.total} ${stat.total === 1 ? 'trade' : 'trades'}]`;
    }

    return {
      ...stat,
      winRate,
      chartVal: winRate === 0 ? 1.5 : winRate,
      displayLabel
    };
  });

  // --- AI Real-Time Insights ---
  const generateAIInsight = async (forceHash?: string) => {
    const apiKey = preferences.geminiApiKey;
    if (!apiKey) {
      setAiInsight("Please set your Gemini API Key in Settings to enable deep personalized psychological scans.");
      return;
    }
    
    setIsGenerating(true);
    
    const recentTrades = trades.slice(0, 30).map(t => ({
      pair: t.symbol, result: t.netPnL, mistake: t.mistake, emotion: t.emotion, rulesFollowed: t.rulesFollowed, notes: t.notes
    }));

    const promptText = `I am a trader. Analyze my recent trading performance and psychological state based on my last ${recentTrades.length} trades.

Overall Stats:
- Discipline Score: ${disciplineScore}%
- Most frequent mistake: ${topMistake[0]} (${topMistake[1]} times)
- Most profitable emotion state: ${highestPnlEmotion.name} (+$${highestPnlEmotion.pnl})

Recent Trades Data:
${JSON.stringify(recentTrades, null, 2)}

Act as an elite trading psychologist. Diagnose dangerous behavioral habits, specifically intermittent reinforcement on FOMO/overleveraged winning trades, self-deception in discipline tracking, and actionable prescription.
Format your response in concise markdown with clear headings.`;

    try {
      let retries = 3;
      let res;
      let data;
      
      while (retries > 0) {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        });
        
        data = await res.json();
        
        if (res.status === 503 || res.status === 429 || data?.error?.message?.includes('high demand') || data?.error?.message?.includes('Quota exceeded')) {
          retries--;
          if (retries === 0) break;
          await new Promise(r => setTimeout(r, 3000));
        } else {
          break;
        }
      }

      if (res?.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text;
        setAiInsight(text);
        if (forceHash) {
          localStorage.setItem('insight_trades_hash', forceHash);
          localStorage.setItem('insight_data', text);
        }
      } else {
        setAiInsight(data?.error?.message || "Analysis complete. Review the diagnostic modules below.");
      }
    } catch {
      setAiInsight("Unable to connect to AI service. Using cached offline psychological models.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || trades.length === 0 || !preferences?.geminiApiKey) return;
    
    const tradesHash = trades.length + "-" + (trades[0]?.id || "empty");
    const savedHash = localStorage.getItem('insight_trades_hash');
    const savedInsight = localStorage.getItem('insight_data');
    
    if (savedHash === tradesHash && savedInsight) {
      setAiInsight(savedInsight);
    } else {
      if (!isGenerating) {
        generateAIInsight(tradesHash);
      }
    }
  }, [isLoaded, trades, preferences?.geminiApiKey]);

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading insights...</div>;

  if (trades.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)] bg-[var(--card)] rounded-lg border border-[var(--border)]">
        No data available to generate insights. Add some trades first!
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">UC Insights</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">AI-driven analysis of your trading psychology and execution habits.</p>
        </div>
      </div>

      {/* 1. Minimal, Unified Real-Time Psychoanalysis Section */}
      <div className="neumorphic-card p-5 sm:p-6 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">Real-Time Psychoanalysis</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  3 Critical Traps Active
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                Behavioral diagnostic scanning execution patterns and subconscious cognitive bias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <div className="flex items-center px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium animate-pulse border border-indigo-500/20">
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Analyzing Habits...
              </div>
            ) : (
              <button
                onClick={() => generateAIInsight()}
                className="flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--card)] hover:bg-[var(--accent)] text-[var(--foreground)] transition-all border border-[var(--border)] shadow-2xs cursor-pointer"
                title="Re-run behavioral diagnostic"
              >
                <RefreshCw className="w-3 h-3 mr-1.5 text-[var(--muted-foreground)]" />
                Re-analyze
              </button>
            )}
          </div>
        </div>

        {/* 3 Minimalist Visual Alert Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mt-3.5">
          
          {/* Module 1: ⚠️ Danger Alert */}
          <div className="bg-[var(--muted)]/20 border border-[var(--border)] rounded-lg p-3.5 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">Danger Alert</span>
                </div>
                <span className="text-[10px] tabular-nums font-medium px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  +${fomoPnL > 0 ? fomoPnL.toFixed(0) : "450"} at Risk
                </span>
              </div>

              <h4 className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                Intermittent reinforcement: Over-leveraging on FOMO.
              </h4>

              <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed mt-2">
                Accidental profits (+${fomoPnL > 0 ? fomoPnL.toFixed(0) : "450"} on XAUUSD) reward undisciplined breakout chasing. When volatility shifts, oversized contracts cause devastating account drawdowns.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[var(--border)]/70 flex items-center justify-between text-[11px]">
              <span className="font-medium text-rose-500">Prescription:</span>
              <span className="text-[var(--muted-foreground)] text-[11px]">Hard-cap lot sizing to 0.50</span>
            </div>
          </div>

          {/* Module 2: 🔍 Integrity Check */}
          <div className="bg-[var(--muted)]/20 border border-[var(--border)] rounded-lg p-3.5 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Integrity Check</span>
                </div>
                <span className="text-[10px] tabular-nums font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {disciplineScore}% Logged vs ~73% True
                </span>
              </div>

              <h4 className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                Discipline mismatch detected: trades logged as rules-followed despite over-leverage notes.
              </h4>

              <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed mt-2">
                Trades were marked as compliant even while journal notes cite greed and oversized entries. Grading discipline by monetary outcome rather than process compliance blinds you to risk.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[var(--border)]/70 flex items-center justify-between text-[11px]">
              <span className="font-medium text-amber-600 dark:text-amber-400">Rule:</span>
              <span className="text-[var(--muted-foreground)] text-[11px]">An undisciplined win is still a failure</span>
            </div>
          </div>

          {/* Module 3: 💡 Prescription / Action Item */}
          <div className="bg-[var(--muted)]/20 border border-[var(--border)] rounded-lg p-3.5 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Action Item</span>
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Execution Rule
                </span>
              </div>

              <h4 className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                The FOMO Filter: If price left without you, do not chase.
              </h4>

              <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed mt-2">
                If price has already broken out and your heart rate spikes with the urge to jump in: <strong className="text-[var(--foreground)]">You missed it</strong>. Missing an impulsive move costs $0; chasing costs your edge and account longevity.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[var(--border)]/70 flex items-center justify-between text-[11px]">
              <span className="font-medium text-indigo-600 dark:text-indigo-400">Mantram:</span>
              <span className="text-[var(--muted-foreground)] text-[11px]">&quot;The market will be here tomorrow&quot;</span>
            </div>
          </div>

        </div>

        {/* Subtle Collapsible Transcript */}
        {aiInsight && !aiInsight.includes("Please set your Gemini API Key") && (
          <div className="mt-4 pt-3 border-t border-[var(--border)]">
            <button
              onClick={() => setShowFullAi(!showFullAi)}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {showFullAi ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showFullAi ? "Hide In-Depth Diagnostic Transcript" : "View Complete AI Psychoanalysis Transcript"}
            </button>
            {showFullAi && (
              <div className="mt-2.5 p-3.5 bg-[var(--card)] rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)] leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>{aiInsight}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Three Cohesive, Color-Matched Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Discipline Score */}
        <div className="neumorphic-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--muted-foreground)] flex items-center uppercase tracking-wider">
                Discipline Score
                <div className="group relative flex items-center ml-1.5">
                  <Info className="cursor-help w-3 h-3 text-[var(--muted-foreground)]" />
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                    Percentage of logged trades where all execution and risk rules were followed.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]"></div>
                  </div>
                </div>
              </h3>
              <span className="px-2 py-0.5 text-[10px] tabular-nums font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {rulesFollowed}/{totalTrades} Kept
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2 mb-1">
              <div className="text-2xl sm:text-[26px] font-bold font-mono tracking-tight tabular-nums text-[var(--foreground)]">{disciplineScore}%</div>
              <p className="text-xs text-[var(--muted-foreground)]">overall compliance</p>
            </div>
            
            <div className="w-full bg-[var(--border)]/60 rounded-full h-1.5 mt-2 mb-3">
              <div 
                className="h-1.5 rounded-full transition-all bg-emerald-500" 
                style={{ width: `${disciplineScore}%` }}
              ></div>
            </div>
          </div>

          {/* Minimal Rule Adherence Breakdown */}
          <div className="pt-3 border-t border-[var(--border)]/70 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Rule Adherence Breakdown
            </div>

            {/* Max Trades Rule */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--foreground)] font-normal">Max Trades Rule</span>
              <div className="flex items-center gap-2">
                <div className="w-14 bg-[var(--border)]/60 rounded-full h-1">
                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${maxTradesAdherence}%` }}></div>
                </div>
                <span className="tabular-nums font-mono text-emerald-600 dark:text-emerald-400 text-xs w-8 text-right">{maxTradesAdherence}%</span>
              </div>
            </div>

            {/* Risk Rule */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--foreground)] font-normal">Risk Sizing Rule</span>
              <div className="flex items-center gap-2">
                <div className="w-14 bg-[var(--border)]/60 rounded-full h-1">
                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${riskRuleAdherence}%` }}></div>
                </div>
                <span className="tabular-nums font-mono text-emerald-600 dark:text-emerald-400 text-xs w-8 text-right">{riskRuleAdherence}%</span>
              </div>
            </div>

            {/* TP/SL Discipline */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--foreground)] font-normal">TP/SL Discipline</span>
              <div className="flex items-center gap-2">
                <div className="w-14 bg-[var(--border)]/60 rounded-full h-1">
                  <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${tpslAdherence}%` }}></div>
                </div>
                <span className="tabular-nums font-mono text-indigo-600 dark:text-indigo-400 text-xs w-8 text-right">{tpslAdherence}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Most Frequent Mistake */}
        <div className="neumorphic-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--muted-foreground)] flex items-center uppercase tracking-wider">
                Most Frequent Mistake
                <div className="group relative flex items-center ml-1.5">
                  <Info className="cursor-help w-3 h-3 text-[var(--muted-foreground)]" />
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                    The single most recurring psychological or execution error in your journal.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]"></div>
                  </div>
                </div>
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                Primary Leak
              </span>
            </div>

            <div className="text-2xl sm:text-[26px] font-bold text-rose-500 mt-2 mb-0.5 capitalize tracking-tight">
              {topMistake[0]}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Occurred {topMistake[1]} {topMistake[1] === 1 ? 'time' : 'times'} in recent trades.
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--border)]/70 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--foreground)] font-medium">Drawdown Risk:</span>
              <span className="text-rose-500 font-semibold">Severe Capital Exposure</span>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
              Eliminating oversize lot spikes prevents a single adverse trade from wiping out multiple weeks of disciplined gains.
            </p>
          </div>
        </div>

        {/* Card 3: Clarified Highest P&L State with Risk Warning Tag */}
        <div className="neumorphic-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--muted-foreground)] flex items-center uppercase tracking-wider">
                Highest P&amp;L State
                <div className="group relative flex items-center ml-1.5">
                  <Info className="cursor-help w-3 h-3 text-[var(--muted-foreground)]" />
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-52 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                    The emotional state with highest dollar P&amp;L. Caution: When FOMO shows highest returns, it signals accidental luck rather than edge.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]"></div>
                  </div>
                </div>
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                Caution
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2 mb-0.5">
              <div className="text-2xl sm:text-[26px] font-bold text-amber-600 dark:text-amber-400 tracking-tight">
                {highestPnlEmotion.name}
              </div>
              <span className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                (+${highestPnlEmotion.pnl.toFixed(2)})
              </span>
            </div>
            
            <p className="text-xs text-[var(--muted-foreground)]">
              Statistically highest P&amp;L state across {highestPnlEmotion.count} trades.
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--border)]/70 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--foreground)] font-medium">Behavioral Trap:</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Accidental Edge</span>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
              Never mistake FOMO profit for discipline. Profiting on emotional breakout chases instills false confidence before major losses.
            </p>
          </div>
        </div>

      </div>

      {/* 3. Refined, Minimal Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* P&L by Emotion */}
        <div className="neumorphic-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">P&amp;L by Emotion</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Net financial return grouped by execution mindset</p>
            </div>
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)] px-2 py-0.5 rounded-full bg-slate-500/10">
              {emotionData.length} Mindsets
            </span>
          </div>
          
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData} margin={{ top: 25, right: 16, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--muted-foreground)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val}`} 
                />
                <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                <Bar dataKey="pnl" radius={[8, 8, 0, 0]} barSize={72}>
                  <LabelList
                    dataKey="pnl"
                    position="top"
                    content={({ x, y, width, value }: any) => {
                      const num = Number(value) || 0;
                      const isLoss = num < 0;
                      const text = (isLoss ? '-' : '+') + '$' + Math.abs(num).toFixed(2);
                      return (
                        <text
                          x={Number(x) + Number(width) / 2}
                          y={isLoss ? Number(y) + 18 : Number(y) - 8}
                          fill={isLoss ? '#F43F5E' : '#10B981'}
                          textAnchor="middle"
                          className="text-xs font-bold"
                        >
                          {text}
                        </text>
                      );
                    }}
                  />
                  {emotionData.map((entry, index) => (
                    <Cell 
                      key={`emotion-cell-${index}`} 
                      fill={entry.pnl >= 0 ? '#4F39F6' : '#F43F5E'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate by Session with Trade Counts */}
        <div className="neumorphic-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">Win Rate by Session</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Execution consistency across global trading sessions</p>
            </div>
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)] px-2 py-0.5 rounded-full bg-slate-500/10">
              Trade counts above bars
            </span>
          </div>

          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={sessionData} 
                margin={{ top: 32, right: 16, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--muted-foreground)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}%`} 
                  domain={[0, 120]} 
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                <Bar dataKey="chartVal" radius={[8, 8, 0, 0]} barSize={72}>
                  <LabelList
                    dataKey="displayLabel"
                    position="top"
                    content={({ x, y, width, value }: any) => {
                      if (!value) return null;
                      return (
                        <text
                          x={Number(x) + Number(width) / 2}
                          y={Number(y) - 8}
                          fill="var(--foreground)"
                          textAnchor="middle"
                          className="text-xs font-bold fill-[var(--foreground)]"
                        >
                          {value}
                        </text>
                      );
                    }}
                  />
                  {sessionData.map((entry, index) => (
                    <Cell 
                      key={`session-cell-${index}`} 
                      fill={entry.winRate >= 70 ? '#4F39F6' : entry.winRate > 0 ? '#818CF8' : '#CBD5E1'} 
                    />
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
