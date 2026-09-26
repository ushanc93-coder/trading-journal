
import { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, addMonths, subMonths, set } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from "lucide-react";

export default function DatePickerDropdown({ date, onChange }: { date: string, onChange: (d: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(date || new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth }).fill(null);

  const selectedDate = new Date(date || new Date());

  const handleSelect = (day: Date) => {
    // Preserve time from current selection
    const newDate = set(selectedDate, {
      year: day.getFullYear(),
      month: day.getMonth(),
      date: day.getDate()
    });
    // Format required for datetime-local: yyyy-MM-ddThh:mm
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm font-medium text-[var(--foreground)] flex items-center justify-between min-w-[200px] hover:border-[var(--primary)] transition-colors shadow-sm"
      >
        <span>{format(selectedDate, 'MMM d, yyyy h:mm a')}</span>
        <CalendarIcon className="w-4 h-4 ml-2 text-[var(--muted-foreground)]" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 animate-zoom-in p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-[var(--foreground)]">{format(currentMonth, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--muted-foreground)] mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => <div key={`empty-${i}`} />)}
            {daysInMonth.map(day => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleSelect(day)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isSelected ? 'bg-[var(--primary)] text-white shadow-md' : isCurrentDay ? 'bg-[var(--muted)] text-[var(--foreground)]' : 'hover:bg-[var(--muted)] text-[var(--foreground)]'}`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between">
            <button onClick={() => handleSelect(new Date())} className="text-xs font-semibold text-[var(--primary)] hover:underline">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
