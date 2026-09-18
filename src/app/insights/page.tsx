"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { useSettingsContext } from "@/lib/SettingsContext";
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";
import { BrainCircuit, AlertTriangle, Target, Lightbulb, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
      <div className="p-8 text-center text-[var(--muted-foreground)] bg-[var(--card)] rounded-xl border border-[var(--border)]">
        No data available to generate insights. Add some trades first!
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">UC Insights</h2>
          <p className="text-[var(--muted-foreground)] mt-1">AI-driven analysis of your trading psychology and execution habits.</p>
        </div>
        {isGenerating && (
          <div className="flex items-center px-4 py-2 bg-[var(--primary)]/50 text-white rounded-md text-sm font-medium">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing Data...
          </div>
        )}
      </div>

      {/* Actionable Advice Box */}
      <div className="bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/10 border border-[var(--primary)]/30 p-6 md:p-8 rounded-xl relative shadow-lg">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Lightbulb className="w-32 h-32 text-[var(--primary)]" />
        </div>
        <div className="flex flex-col md:flex-row items-start gap-4 relative z-10">
          <div className="p-4 bg-[var(--primary)]/20 rounded-xl shrink-0 border border-[var(--primary)]/30">
            <Lightbulb className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <div className="w-full">
            <h3 className="text-xl font-bold text-white mb-2">Real-Time Psychoanalysis</h3>
            <div className="text-[var(--foreground)] leading-relaxed text-sm md:text-base prose prose-invert prose-indigo max-w-none">
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
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target className="w-24 h-24 text-[var(--primary)]" />
          </div>
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Discipline Score</h3>
          <div className="text-5xl font-bold text-white mb-2">{disciplineScore}%</div>
          <p className="text-xs text-[var(--muted-foreground)] text-center">You followed your rules on {rulesFollowed} out of {trades.length} trades.</p>
          
          <div className="w-full bg-[var(--muted)] rounded-full h-2 mt-4">
            <div 
              className={`h-2 rounded-full ${disciplineScore >= 80 ? 'bg-emerald-500' : disciplineScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
              style={{ width: `${disciplineScore}%` }}
            ></div>
          </div>
        </div>

        {/* Top Mistake */}
        <div className="bg-[var(--card)] p-6 rounded-xl border border-rose-500/20 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-24 h-24 text-rose-500" />
          </div>
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Most Frequent Mistake</h3>
          <div className="text-3xl font-bold text-rose-500 text-center capitalize">{topMistake[0]}</div>
          {topMistake[1] > 0 && (
            <p className="text-xs text-[var(--muted-foreground)] text-center mt-2">Occurred {topMistake[1]} times. Focus on eliminating this to improve your edge.</p>
          )}
        </div>

        {/* Psychological Edge */}
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BrainCircuit className="w-24 h-24 text-blue-500" />
          </div>
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Best Emotional State</h3>
          <div className="text-3xl font-bold text-blue-400 text-center">
            {emotionData.sort((a, b) => b.pnl - a.pnl)[0]?.name || "N/A"}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] text-center mt-2">You are most profitable when trading in this state of mind.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* P&L by Emotion */}
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
          <h3 className="text-lg font-bold text-white mb-6">P&L by Emotion</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }}
                  itemStyle={{ color: '#fafafa' }}
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#3b82f6' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate by Session */}
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
          <h3 className="text-lg font-bold text-white mb-6">Win Rate by Session</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px' }}
                  itemStyle={{ color: '#fafafa' }}
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                />
                <Bar dataKey="winRate" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

