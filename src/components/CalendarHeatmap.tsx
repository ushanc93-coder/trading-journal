"use client";

import { Trade } from "@/lib/mock-data";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CalendarHeatmapProps {
  trades: Trade[];
}

export default function CalendarHeatmap({ trades }: CalendarHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  
  // Calculate padding days for the first week (Sunday = 0)
  const startingDayIndex = getDay(firstDayOfMonth);
  const paddingDays = Array.from({ length: startingDayIndex }).fill(null);

  // Group trades by date string "yyyy-MM-dd"
  const tradesByDate = trades.reduce((acc, trade) => {
    // trade.date is already "yyyy-MM-dd"
    if (!acc[trade.date]) {
      acc[trade.date] = [];
    }
    acc[trade.date].push(trade);
    return acc;
  }, {} as Record<string, Trade[]>);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] flex flex-col h-full min-h-[500px]">
      <div className="flex items-center p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold text-[var(--foreground)] mr-4">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex space-x-1">
          <button onClick={prevMonth} className="p-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-4 pb-2 border-b border-[var(--border)]">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-[var(--muted-foreground)]">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
          {paddingDays.map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px]"></div>
          ))}
          
          {daysInMonth.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTrades = tradesByDate[dateStr] || [];
            
            const totalPnL = dayTrades.reduce((acc, t) => acc + t.netPnL, 0);
            
            // Determine cell color
            let bgColor = "bg-[var(--card)]/50 border border-[var(--border)]/50"; // Empty/No trades
            let textColor = "text-[var(--muted-foreground)]";
            let numColor = "text-[var(--muted-foreground)]";
            let subColor = "text-[var(--muted-foreground)]";
            
            if (dayTrades.length > 0) {
              if (totalPnL > 0) {
                bgColor = "bg-[var(--win)]/10 border border-[var(--win)]/30 dark:bg-[var(--win)]/10 dark:border-[var(--win)]/20";
                textColor = "text-[var(--win)]";
                numColor = "text-[var(--win)]/60";
                subColor = "text-[var(--win)]/80";
              } else if (totalPnL < 0) {
                bgColor = "bg-[var(--loss)]/10 border border-[var(--loss)]/30 dark:bg-[var(--loss)]/10 dark:border-[var(--loss)]/20";
                textColor = "text-[var(--loss)]";
                numColor = "text-[var(--loss)]/60";
                subColor = "text-[var(--loss)]/80";
              } else {
                bgColor = "bg-[var(--be)]/10 border border-[var(--be)]/30 dark:bg-[var(--be)]/10 dark:border-[var(--be)]/20";
                textColor = "text-[var(--be)]";
                numColor = "text-[var(--be)]/60";
                subColor = "text-[var(--be)]/80";
              }
            }

            return (
              <div 
                key={dateStr} 
                className={`relative min-h-[80px] p-2 rounded-xl flex flex-col justify-between transition-colors hover:brightness-[0.95] dark:hover:brightness-125 ${bgColor}`}
              >
                <div className={`text-xs font-semibold self-end ${isToday(day) ? "bg-[var(--primary)] text-white w-5 h-5 flex items-center justify-center rounded-full" : numColor}`}>
                  {format(day, 'd')}
                </div>
                
                {dayTrades.length > 0 && (
                  <div className="text-center mt-auto mb-1">
                    <div className={`font-bold text-sm ${textColor}`}>
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
                    </div>
                    <div className={`text-[10px] font-medium ${subColor}`}>
                      {dayTrades.length} {dayTrades.length === 1 ? 'trade' : 'trades'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}





