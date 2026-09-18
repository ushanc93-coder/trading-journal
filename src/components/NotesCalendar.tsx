import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, addMonths, subMonths } from "date-fns";
import { Note } from "@/lib/useNotebook";
import { ChevronLeft, ChevronRight, FileText, X } from "lucide-react";

const CATEGORY_STYLES: Record<string, { bg: string, text: string, raw: string }> = {
  "Educational": { bg: "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30", text: "text-amber-400", raw: "bg-amber-500" },
  "Strategy": { bg: "bg-[var(--primary)]/20 hover:bg-[var(--primary)]/30 border-[var(--primary)]/30", text: "text-[var(--primary)]", raw: "bg-[var(--primary)]" },
  "Personal": { bg: "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30", text: "text-emerald-400", raw: "bg-emerald-500" },
  "Goals": { bg: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30", text: "text-blue-400", raw: "bg-blue-500" },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Educational": "#f59e0b",
  "Strategy": "#a855f7",
  "Personal": "#10b981",
  "Goals": "#3b82f6",
};

export default function NotesCalendar({ notes, onNoteClick }: { notes: Note[], onNoteClick: (note: Note) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [popupNotes, setPopupNotes] = useState<{ date: Date, notes: Note[] } | null>(null);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth }).fill(null);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-2xl shadow-black/20 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/10 hover:border-[var(--border)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h3 className="text-xl font-bold text-white tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Click any colored square to open its notes</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="p-2 bg-[var(--card)] hover:bg-[var(--muted)] rounded-md text-[var(--muted-foreground)] hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 bg-[var(--card)] hover:bg-[var(--muted)] rounded-md text-[var(--muted-foreground)] hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-4">
        {paddingDays.map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[110px] rounded-xl bg-[var(--card)]/10 border border-[var(--border)]/10"></div>
        ))}
        
        {daysInMonth.map(day => {
          // Find notes for this day
          const dayNotes = notes.filter(n => {
            try {
              return isSameDay(parseISO(n.updatedAt), day);
            } catch { return false; }
          });
          
          let cellStyle = "bg-[var(--card)]/40 border-[var(--border)]/50 hover:bg-[var(--muted)]/80 border";
          let bgStyle: React.CSSProperties = {};
          if (dayNotes.length > 0) {
            cellStyle = "border border-[var(--border)]/50 bg-[var(--card)]/40 shadow-lg hover:-translate-y-1 cursor-pointer";
            const colors = Array.from(new Set(dayNotes.map(n => (n.category && CATEGORY_COLORS[n.category]) ? CATEGORY_COLORS[n.category] : "#71717a")));
            
            if (colors.length === 1) {
              bgStyle = { backgroundColor: colors[0] };
            } else {
              const step = 100 / (colors.length - 1);
              const gradientStops = colors.map((c, i) => `${c} ${i * step}%`).join(', ');
              bgStyle = { background: `linear-gradient(135deg, ${gradientStops})` };
            }
          }

          return (
            <div 
              key={day.toISOString()} 
              onClick={() => {
                if (dayNotes.length > 0) {
                  setPopupNotes({ date: day, notes: dayNotes });
                }
              }}
              className={`min-h-[110px] p-3 rounded-xl transition-all duration-300 flex flex-col overflow-hidden relative group ${cellStyle} ${isToday(day) && dayNotes.length === 0 ? 'ring-2 ring-zinc-700' : ''}`}
            >
              {dayNotes.length > 0 && (
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity" style={bgStyle} />
              )}
              
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className={`text-sm font-semibold ${isToday(day) ? 'text-white' : (dayNotes.length > 0 ? 'text-white/90' : 'text-[var(--muted-foreground)]')}`}>
                  {format(day, 'd')}
                </span>
                {dayNotes.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/40 text-white backdrop-blur-md">{dayNotes.length}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {popupNotes && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPopupNotes(null)}
        >
          <div 
            className="bg-[var(--card)] w-full max-w-md rounded-2xl border border-[var(--border)] shadow-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Notes for {format(popupNotes.date, 'MMMM d')}</h3>
              <button onClick={() => setPopupNotes(null)} className="text-[var(--muted-foreground)] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {popupNotes.notes.map(note => {
                const catStyle = (note.category && CATEGORY_STYLES[note.category]) 
                  ? CATEGORY_STYLES[note.category] 
                  : { bg: "bg-[var(--muted)]/20", text: "text-[var(--muted-foreground)]", raw: "bg-zinc-500" };
                  
                return (
                  <div 
                    key={note.id}
                    onClick={() => {
                      onNoteClick(note);
                      setPopupNotes(null);
                    }}
                    className={`p-4 rounded-xl border border-[var(--border)]/50 cursor-pointer transition-all hover:-translate-y-1 shadow-md relative overflow-hidden group`}
                  >
                    <div className={`absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20 ${catStyle.raw}`}></div>
                    <div className="relative z-10">
                      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${catStyle.text}`}>
                        {note.category || "General"}
                      </div>
                      <h4 className="text-lg font-bold text-white/90 group-hover:text-white transition-colors">
                        {note.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
