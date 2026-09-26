"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { useSettingsContext } from "@/lib/SettingsContext";
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";
import { BrainCircuit, AlertTriangle, Target, Lightbulb, Sparkles, Loader2, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isLoss = value < 0;
    // Format value based on what we're displaying (PnL vs %)
    const formattedValue = payload[0].name === 'winRate' ? `${value}%` : `${isLoss ? '-' : ''}$${Math.abs(value).toFixed(2)}`;
    return (
      <div className="bg-[var(--card)]/80 backdrop-blur-md border border-[var(--border)] p-4 rounded-xl shadow-xl">
        <p className="text-[var(--muted-foreground)] font-medium text-sm mb-1">{label}</p>
        <p className={`text-lg font-bold ${isLoss ? 'text-[var(--loss)]' : 'text-[var(--profit)]'}`}>
          {formattedValue}
        </p>
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



  // --- Discipline Score ---
  const rulesFollowed = trades.filter(t => t.rulesFollowed).length;
  const disciplineScore = trades.length > 0 ? Math.round((rulesFollowed / trades.length) * 100) : 0;

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

  const emotionData = Object.values(emotionStats);

  // --- Session Performance ---
  const sessionStats = trades.reduce((acc, trade) => {
    const s = trade.session || "Unknown";
    if (!acc[s]) acc[s] = { name: s, pnl: 0, wins: 0, total: 0 };
    acc[s].pnl += trade.netPnL;
    acc[s].total += 1;
    if (trade.status === "Win") acc[s].wins += 1;
    return acc;
  }, {} as Record<string, { name: string, pnl: number, wins: number, total: number }>);

  const sessionData = Object.values(sessionStats).map(s => ({
    ...s,
    winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
  }));

  // --- AI Real-Time Insights ---
  const generateAIInsight = async (forceHash?: string) => {
    const apiKey = preferences.geminiApiKey;
    if (!apiKey) {
      setAiInsight("Please set your Gemini API Key in Settings first.");
      return;
    }
    
    setIsGenerating(true);
    
    const recentTrades = trades.slice(0, 30).map(t => ({
      pair: t.symbol, result: t.netPnL, mistake: t.mistake, emotion: t.emotion, rulesFollowed: t.rulesFollowed
    }));

    const promptText = `I am a trader. Analyze my recent trading performance and psychological state based on my last ${recentTrades.length} trades.

Overall Stats:
- Discipline Score: ${disciplineScore}%
- Most frequent mistake: ${topMistake[0]} (${topMistake[1]} times)
- Most profitable emotion state: ${emotionData.sort((a, b) => b.pnl - a.pnl)[0]?.name || "N/A"}

Recent Trades Data:
${JSON.stringify(recentTrades, null, 2)}

Act as my elite trading psychologist and mentor. Tell me what destructive path I am on right now and how to fix it immediately. 
Format your response in Markdown with NO JSON. Keep it punchy, honest, and highly actionable.`;

    try {
      let retries = 5;
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
          setAiInsight(`The AI is currently processing a high volume of requests (Free Tier Limit). Retrying automatically... (${retries} attempts left)`);
          await new Promise(r => setTimeout(r, 4000));
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
        if (data?.error?.message?.includes('Quota exceeded')) {
          setAiInsight(`⏳ **Free Tier Speed Limit Reached**\n\nGoogle Gemini is 100% free, but limits how fast you can make requests in a single minute. Please wait about 60 seconds, then refresh the page to try again!`);
        } else {
          setAiInsight(`Failed to generate insights. ${data?.error?.message || ''}`);
        }
      }
    } catch (e) {
      setAiInsight("Error generating insights. Please check your network connection.");
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
  }, [isLoaded, trades, preferences?.geminiApiKey]); // We intentionally do not include isGenerating in deps to avoid infinite loops

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading insights...</div>;

  if (trades.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)] bg-[var(--card)] rounded-3xl border border-[var(--border)]">
        No data available to generate insights. Add some trades first!
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">UC Insights</h2>
          <p className="text-[var(--muted-foreground)] mt-1">AI-driven analysis of your trading psychology and execution habits.</p>
        </div>
        {isGenerating && (
          <div className="flex items-center px-4 py-2 bg-[var(--primary)]/50 text-white rounded-3xl text-sm font-medium">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing Data...
          </div>
        )}
      </div>

      {/* Actionable Advice Box */}
      <div className="bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/10 border border-[var(--primary)]/30 p-6 md:p-8 rounded-3xl relative shadow-lg">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Lightbulb className="w-32 h-32 text-[var(--primary)]" />
        </div>
        <div className="flex flex-col md:flex-row items-start gap-4 relative z-10">
          <div className="p-4 bg-[var(--primary)]/20 rounded-3xl shrink-0 border border-[var(--primary)]/30">
            <Lightbulb className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <div className="w-full">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Real-Time Psychoanalysis</h3>
            <div className="text-[var(--foreground)] leading-relaxed text-sm md:text-base prose prose-headings:text-[var(--foreground)] prose-p:text-[var(--foreground)] prose-strong:text-[var(--foreground)] prose-li:text-[var(--foreground)] prose-a:text-[var(--primary)] max-w-none">
              {aiInsight ? (
                <ReactMarkdown>{aiInsight}</ReactMarkdown>
              ) : (
                <p className="text-[var(--muted-foreground)] font-medium">Analyzing your latest trades to build a psychological profile...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Discipline Score */}
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] flex flex-col items-center justify-center relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target className="w-24 h-24 text-[var(--primary)]" />
          </div>
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2 flex items-center relative z-20">
          Discipline Score
          <div className="group relative flex items-center">
            <Info className="cursor-help w-3 h-3 ml-1" />
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
              The percentage of trades where you successfully followed all of your trading rules.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]"></div>
            </div>
          </div>
        </h3>
          <div className="text-5xl font-bold text-[var(--foreground)] mb-2">{disciplineScore}%</div>
          <p className="text-xs text-[var(--muted-foreground)] text-center">You followed your rules on {rulesFollowed} out of {trades.length} trades.</p>
          
          <div className="w-full bg-[var(--muted)] rounded-full h-2 mt-4">
            <div 
              className={`h-2 rounded-full ${disciplineScore >= 80 ? 'bg-[var(--win)]' : disciplineScore >= 50 ? 'bg-amber-500' : 'bg-[var(--loss)]'}`} 
              style={{ width: `${disciplineScore}%` }}
            ></div>
          </div>
        </div>

        {/* Top Mistake */}
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--loss)]/30 flex flex-col items-center justify-center relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-24 h-24 text-[var(--loss)]" />
          </div>
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2 flex items-center relative z-20">
          Most Frequent Mistake
          <div className="group relative flex items-center">
            <Info className="cursor-help w-3 h-3 ml-1" />
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
              The most common psychological or execution error you make that costs you money.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]"></div>
            </div>
          </div>
        </h3>
          <div className="text-3xl font-bold text-[var(--loss)] text-center capitalize">{topMistake[0]}</div>
          {topMistake[1] > 0 && (
            <p className="text-xs text-[var(--muted-foreground)] text-center mt-2">Occurred {topMistake[1]} times. Focus on eliminating this to improve your edge.</p>
          )}
        </div>

        {/* Psychological Edge */}
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] flex flex-col items-center justify-center relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BrainCircuit className="w-24 h-24 text-blue-500" />
          </div>
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2 flex items-center relative z-20">
          Best Emotional State
          <div className="group relative flex items-center">
            <Info className="cursor-help w-3 h-3 ml-1" />
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
              The psychological state of mind in which you statistically produce the highest win rate.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--foreground)]"></div>
            </div>
          </div>
        </h3>
          <div className="text-3xl font-bold text-blue-400 text-center">
            {emotionData.sort((a, b) => b.pnl - a.pnl)[0]?.name || "N/A"}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] text-center mt-2">You are most profitable when trading in this state of mind.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* P&L by Emotion */}
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">P&L by Emotion</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.2 }} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate by Session */}
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">Win Rate by Session</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.2 }} />
                <Bar dataKey="winRate" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

