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
    <div className="bg-[var(--card)] rounded-md border border-[var(--border)] flex flex-col h-full">
      <div className="flex items-center p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold text-white mr-4">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex space-x-1">
          <button onClick={prevMonth} className="p-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-[var(--muted-foreground)] py-2 border-b border-[var(--border)]">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
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
            
            if (dayTrades.length > 0) {
              if (totalPnL > 0) {
                bgColor = "bg-emerald-900/20 border border-emerald-500/20"; // Light green tinted background
                textColor = "text-[var(--win)]";
              } else if (totalPnL < 0) {
                bgColor = "bg-rose-900/20 border border-rose-500/20"; // Light red tinted background
                textColor = "text-[var(--loss)]";
              } else {
                bgColor = "bg-[var(--muted)] border border-[var(--border)]";
                textColor = "text-[var(--be)]";
              }
            }

            return (
              <div 
                key={dateStr} 
                className={`relative min-h-[80px] p-2 rounded-xl flex flex-col justify-between transition-colors hover:brightness-125 ${bgColor}`}
              >
                <div className={`text-xs font-semibold self-end ${isToday(day) ? 'bg-[var(--primary)] text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-[var(--muted-foreground)]'}`}>
                  {format(day, 'd')}
                </div>
                
                {dayTrades.length > 0 && (
                  <div className="text-center mt-auto mb-1">
                    <div className={`font-bold text-sm ${textColor}`}>
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
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
