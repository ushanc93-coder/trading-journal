"use client";

import { useMemo } from "react";
import { Trade } from "@/lib/mock-data";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from "recharts";
import { ShieldCheck, Brain, AlertTriangle } from "lucide-react";

interface AnalyticsInsightsProps {
  trades: Trade[];
}

export default function AnalyticsInsights({ trades }: AnalyticsInsightsProps) {
  // Discipline Score
  const rulesFollowed = trades.filter(t => t.rulesFollowed).length;
  const disciplineScore = trades.length > 0 ? Math.round((rulesFollowed / trades.length) * 100) : 0;

  // Session Data
  const sessionData = useMemo(() => {
    const sessions = { "Asian": { wins: 0, losses: 0 }, "London": { wins: 0, losses: 0 }, "New York": { wins: 0, losses: 0 } };
    trades.forEach(t => {
      if (t.status === "Win") sessions[t.session].wins++;
      if (t.status === "Loss") sessions[t.session].losses++;
    });
    return Object.keys(sessions).map(key => ({
      name: key,
      Wins: sessions[key as keyof typeof sessions].wins,
      Losses: sessions[key as keyof typeof sessions].losses,
    }));
  }, [trades]);

  // Mistakes
  const topMistakes = useMemo(() => {
    const mistakes: Record<string, number> = {};
    trades.forEach(t => {
      if (t.mistake !== "None") {
        mistakes[t.mistake] = (mistakes[t.mistake] || 0) + 1;
      }
    });
    return Object.entries(mistakes).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [trades]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Session Performance Bar Chart */}
      <div className="lg:col-span-2 bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
        <h3 className="text-lg font-semibold mb-6">Performance by Session</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sessionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#fafafa' }}
                cursor={{ fill: '#27272a', opacity: 0.4 }}
              />
              <Bar dataKey="Wins" fill="var(--win)" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="Losses" fill="var(--loss)" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Psychology & Discipline Insights */}
      <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm flex flex-col">
        <h3 className="text-lg font-semibold mb-6">Psychology & Discipline</h3>
        
        <div className="flex-1 space-y-6">
          {/* Score */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[var(--muted-foreground)] flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1 text-[var(--primary)]" />
                Discipline Score
              </span>
              <span className="text-lg font-bold text-white">{disciplineScore}%</span>
            </div>
            <div className="w-full bg-[var(--card)] rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2.5 rounded-full" 
                style={{ width: `${disciplineScore}%` }}
              ></div>
            </div>
          </div>

          {/* Emotional State Summary */}
          <div className="p-4 bg-[var(--card)]/50 rounded-lg border border-[var(--border)]/50">
            <div className="flex items-start">
              <Brain className="w-5 h-5 text-[var(--primary)] mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-white">Emotional Edge</h4>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                  You are most profitable when trading in a <span className="text-white font-medium">Calm</span> state. Avoid taking trades when feeling FOMO or Revenge.
                </p>
              </div>
            </div>
          </div>

          {/* Top Mistakes */}
          <div>
            <h4 className="text-sm font-medium text-[var(--muted-foreground)] flex items-center mb-3">
              <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />
              Frequent Mistakes
            </h4>
            <div className="space-y-2">
              {topMistakes.length > 0 ? topMistakes.map(([mistake, count]) => (
                <div key={mistake} className="flex justify-between items-center text-sm">
                  <span className="text-[var(--foreground)]">{mistake}</span>
                  <span className="text-[var(--muted-foreground)] bg-[var(--card)] px-2 py-0.5 rounded-full text-xs">{count} times</span>
                </div>
              )) : (
                <div className="text-sm text-[var(--muted-foreground)]">No mistakes logged yet!</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
