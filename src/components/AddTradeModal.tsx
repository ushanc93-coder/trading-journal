"use client";

import { X, AlertCircle, Image as ImageIcon, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Trade } from "@/lib/mock-data";
import { format } from "date-fns";
import { useJournal } from "@/lib/useJournal";

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrade?: (trade: Omit<Trade, "id">) => void;
  onEditTrade?: (id: string, trade: Partial<Trade>) => void;
  initialTrade?: Trade | null;
}

import { useTradesContext } from "@/lib/TradesContext";
import { useSettingsContext } from "@/lib/SettingsContext";
import { ImageViewerModal } from "./ImageViewerModal";
import { useConfirm } from "@/lib/ConfirmContext";


function CustomSelect({ value, onChange, options, className = "" }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  return (
    <div ref={ref} className={`relative ${className}`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-2 flex items-center justify-between cursor-pointer hover:border-[var(--primary)] transition-colors focus:outline-none text-[var(--foreground)]"
      >
        <span className="truncate">{value || "Select..."}</span>
        <svg className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-xl shadow-black/10 z-50 p-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 flex flex-col gap-0.5 max-h-[250px] overflow-y-auto">
          {options.map((opt: string) => {
            const isActive = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={(e) => { e.preventDefault(); onChange(opt); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50'}`}
              >
                <span className="truncate">{opt}</span>
                {isActive && <svg className="w-4 h-4 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CustomAutocomplete({ value, onChange, options, placeholder, error, className = "" }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filtered = options.filter((o: string) => o.toLowerCase().includes(value.toLowerCase()));
  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value.toUpperCase()); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] uppercase transition-colors ${error ? 'border-2 !border-[var(--loss)]' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-xl shadow-black/10 z-50 p-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 flex flex-col gap-0.5 max-h-[250px] overflow-y-auto">
          {filtered.map((opt: string) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(opt); setIsOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
            >
              <span>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


function CustomDatePicker({ value, onChange, className = "", error }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) return new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    }
    return new Date();
  });
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  
  const days = [];
  for(let i=0; i<firstDayOfMonth; i++) days.push(null);
  for(let i=1; i<=daysInMonth; i++) days.push(i);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 flex items-center justify-between cursor-pointer transition-colors text-[var(--foreground)] ${error ? 'border-2 !border-[var(--loss)]' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
      >
        <span>{value || "Select date"}</span>
        <svg className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[260px] bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl shadow-black/10 z-50 p-3 animate-in fade-in zoom-in-95 origin-top-left">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1 hover:bg-[var(--muted)] rounded-lg text-[var(--foreground)] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="font-semibold text-sm tracking-wide text-[var(--foreground)]">{monthNames[month]} {year}</span>
            <button type="button" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1 hover:bg-[var(--muted)] rounded-lg text-[var(--foreground)] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 place-items-center">
            {days.map((d, i) => {
              if (d === null) return <div key={`empty-${i}`} className="h-8 w-8"></div>;
              
              const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              
              const today = new Date();
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
              
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => { onChange(dateStr); setIsOpen(false); }}
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${isSelected ? 'bg-[var(--primary)] text-white shadow-md scale-110' : isToday ? 'border border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--foreground)] hover:bg-[var(--muted)]/60 hover:scale-105'}`}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AddTradeModal({ isOpen, onClose, onAddTrade, onEditTrade, initialTrade }: AddTradeModalProps) {
  const { addEntry, updateEntry, entries } = useJournal();
  const { trades } = useTradesContext();
  const { accounts, activeAccountId, preferences } = useSettingsContext();
  const { confirm, alert } = useConfirm();
  const [step, setStep] = useState(1);
  const [journalData, setJournalData] = useState({
    entryRules: true,
    max2Trades: true,
    maxRisk: true,
    maxTp: true,
    maxProfit: true,
    result: "Good Win" as "Good Win" | "Good Loss" | "Bad Win" | "Bad Loss",
    outcome: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    symbol: "",
    category: "Forex",
    direction: "Long",
    entryPrice: "",
    exitPrice: "",
    lotSize: "",
    sl: "",
    tp: "",
    session: "New York",
    timePeriod: "None",
    rulesFollowed: true,
    emotion: "Calm",
    mistake: "None",
    strategy: "Order Flow",
    notes: "",
    netPnL: "",
    date: "",
    images: [] as string[],
    patterns: [] as string[]
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTrade) {
        setFormData({
          symbol: initialTrade.symbol || "",
          category: initialTrade.category || "Forex",
          direction: initialTrade.direction || "Long",
          entryPrice: initialTrade.entryPrice?.toString() || "",
          exitPrice: initialTrade.exitPrice?.toString() || "",
          lotSize: initialTrade.lotSize?.toString() || "",
          sl: initialTrade.sl?.toString() || "",
          tp: initialTrade.tp?.toString() || "",
          session: initialTrade.session || "New York",
          timePeriod: initialTrade.timePeriod || "None",
          rulesFollowed: initialTrade.rulesFollowed ?? true,
          emotion: initialTrade.emotion || "Calm",
          mistake: initialTrade.mistake || "None",
          strategy: initialTrade.strategy || "Order Flow",
          notes: initialTrade.notes || "",
          netPnL: initialTrade.netPnL?.toString() || "",
          date: initialTrade.date || format(new Date(), 'yyyy-MM-dd'),
          images: initialTrade.images || [],
          patterns: initialTrade.patterns || []
        });
      } else {
        setFormData({
          symbol: "",
          category: "Forex",
          direction: "Long",
          entryPrice: "",
          exitPrice: "",
          lotSize: "",
          sl: "",
          tp: "",
          session: "New York",
          timePeriod: "None",
          rulesFollowed: true,
          emotion: "Calm",
          mistake: "None",
          strategy: "Order Flow",
          notes: "",
          netPnL: "",
          date: format(new Date(), 'yyyy-MM-dd'),
          images: [],
          patterns: [] as string[]
        });
      }
      setErrors({});
      setStep(1);
      setJournalData({
        entryRules: true,
        max2Trades: true,
        maxRisk: true,
        maxTp: true,
        maxProfit: true,
        result: "Good Win",
        outcome: ""
      });
    }
  }, [isOpen, initialTrade]);
  
  const [isScanning, setIsScanning] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      await alert({ message: "File size exceeds 5MB limit.", danger: true });
      return;
    }

    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, result.url] }));
        
        const apiKey = preferences.geminiApiKey;
        if (apiKey) {
          setIsScanning(true);
          try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
              const base64Data = (reader.result as string).split(',')[1];
              
              let aiRes: any;
              let retries = 3;
              while (retries > 0) {
                aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{
                      parts: [
                        { text: "Extract trading details from this screenshot (TradingView, MT4, etc.). Return a JSON object with these keys: symbol (string, e.g. XAUUSD), direction ('Long' or 'Short'), entryPrice (number), exitPrice (number or null), sl (number), tp (number), lotSize (number, look for 'Qty' or 'Volume'), netPnL (number or null), date (string 'YYYY-MM-DD', infer from bottom axis/time), and patterns (array of strings, identify any classic chart patterns like 'Order Block', 'FVG', 'Head & Shoulders', 'Break & Retest', 'Double Top', 'Liquidity Sweep' etc. visible in the chart). If a value is missing, use null (or empty array for patterns)." },
                        { inline_data: { mime_type: file.type, data: base64Data } }
                      ]
                    }],
                    generationConfig: { response_mime_type: "application/json" }
                  })
                });
                
                if (aiRes.status === 503 || aiRes.status === 429) {
                  retries--;
                  if (retries === 0) break;
                  await new Promise(r => setTimeout(r, 2000)); // wait 2 seconds before retry
                } else {
                  break;
                }
              }
              
              const aiData = await aiRes.json();
              
              if (!aiRes.ok) {
                console.error("Gemini API Error:", aiData);
                let errMsg = aiData.error?.message || "";
                if (aiRes.status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("exceeded")) {
                  setAiError("AI Analysis is currently busy due to high demand. Please try again in a few moments.");
                } else {
                  setAiError("AI Vision failed: Please verify your API key and network connection.");
                }
                setIsScanning(false);
                return;
              }

              if (aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                let rawText = aiData.candidates[0].content.parts[0].text;
                rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
                
                try {
                  const parsed = JSON.parse(rawText);
                  setFormData(prev => ({
                    ...prev,
                    symbol: parsed.symbol || prev.symbol,
                    direction: parsed.direction || prev.direction,
                    entryPrice: parsed.entryPrice !== null && parsed.entryPrice !== undefined ? parsed.entryPrice.toString() : prev.entryPrice,
                    exitPrice: parsed.exitPrice !== null && parsed.exitPrice !== undefined ? parsed.exitPrice.toString() : prev.exitPrice,
                    sl: parsed.sl !== null && parsed.sl !== undefined ? parsed.sl.toString() : prev.sl,
                    tp: parsed.tp !== null && parsed.tp !== undefined ? parsed.tp.toString() : prev.tp,
                    lotSize: parsed.lotSize !== null && parsed.lotSize !== undefined ? parsed.lotSize.toString() : prev.lotSize,
                    netPnL: parsed.netPnL !== null && parsed.netPnL !== undefined ? parsed.netPnL.toString() : prev.netPnL,
                    date: parsed.date || prev.date,
                    patterns: parsed.patterns && Array.isArray(parsed.patterns) ? parsed.patterns : prev.patterns
                  }));
                } catch (parseErr) {
                  console.error("JSON Parse Error on Gemini Response:", rawText);
                  setAiError("AI couldn't extract clean numbers from the image. Please enter manually.");
                }
              } else {
                setAiError("AI returned no data.");
              }
              setIsScanning(false);
            };
          } catch (e: any) {
            console.error("AI Scan failed", e);
            setAiError("AI Scan failed: " + e.message);
            setIsScanning(false);
          }
        } else {
          // Simulate AI Vision Trade Extraction if no API key is provided
          setIsScanning(true);
          setTimeout(() => {
            setFormData(prev => ({
              ...prev,
              symbol: prev.symbol || "EURUSD",
              direction: "Long",
              entryPrice: "1.1020",
              exitPrice: "1.1060",
              sl: "1.1000",
              tp: "1.1060",
              lotSize: "2",
              netPnL: "800"
            }));
            setIsScanning(false);
          }, 1500);
        }
      }
    } catch (err) {
      console.error(err);
      await alert({ message: "Failed to upload image.", danger: true });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };
  
  if (!isOpen) return null;

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.symbol.trim()) newErrors.symbol = "Required";
    if (!formData.netPnL.toString().trim()) newErrors.netPnL = "Required";
    if (!formData.entryPrice.toString().trim()) newErrors.entryPrice = "Required";
    if (!formData.exitPrice.toString().trim()) newErrors.exitPrice = "Required";
    if (!formData.sl.toString().trim()) newErrors.sl = "Required";
    if (!formData.tp.toString().trim()) newErrors.tp = "Required";
    if (!formData.lotSize.toString().trim()) newErrors.lotSize = "Required";
    if (!formData.notes.trim()) newErrors.notes = "Required";
    if (!formData.date.trim()) newErrors.date = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    if (initialTrade) {
      handleFinalSubmit(); // skip step 2 for edits
    } else {
      setStep(2);
    }
  };

  const handleFinalSubmit = () => {
    if (step === 2 && !initialTrade) {
      const newErrors: Record<string, string> = {};
      if (!journalData.outcome.trim()) newErrors.outcome = "Required";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    if (onAddTrade || onEditTrade) {
      let newTicket = initialTrade?.ticket;
      if (!initialTrade) {
        const maxNumber = trades.reduce((max, t) => {
          if (!t.ticket) return max;
          const num = parseInt(t.ticket.replace(/\D/g, ''));
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        newTicket = `TKT-${String(maxNumber + 1).padStart(3, '0')}`;
      }
      const entry = parseFloat(formData.entryPrice) || 0;
      const exit = parseFloat(formData.exitPrice) || 0;
      const sl = parseFloat(formData.sl) || 0;
      const lotSize = parseFloat(formData.lotSize) || 1;
      const isLong = formData.direction === "Long";
      
      const finalPnL = parseFloat(formData.netPnL) || 0;
      const status = finalPnL > 0 ? "Win" : finalPnL < 0 ? "Loss" : "Break Even";
      
      // Calculate R-Multiple accurately
      let rMultiple = finalPnL > 0 ? 2 : (finalPnL < 0 ? -1 : 0);
      if (entry > 0 && sl > 0 && Math.abs(entry - sl) > 0) {
        const riskPerUnit = Math.abs(entry - sl);
        const profitPerUnit = isLong ? (exit - entry) : (entry - exit);
        rMultiple = Math.round((profitPerUnit / riskPerUnit) * 10) / 10;
      }
      
      const payload = {
        symbol: formData.symbol.toUpperCase(),
        category: formData.category as "Forex" | "Index",
        direction: formData.direction as "Long" | "Short",
        entryPrice: entry,
        exitPrice: exit,
        lotSize: lotSize,
        sl: sl,
        tp: parseFloat(formData.tp) || 0,
        netPnL: Math.round(finalPnL),
        rMultiple,
        session: formData.session as any,
        timePeriod: formData.timePeriod as any,
        date: formData.date,
        rulesFollowed: formData.rulesFollowed,
        emotion: formData.emotion as any,
        mistake: formData.mistake as any,
        strategy: formData.strategy as any,
        notes: formData.notes,
        status: status as any,
        images: formData.images,
        patterns: formData.patterns
      };
      
      // Compute Rules Automatically!
      const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];
      const balance = activeAccount ? activeAccount.balance : 10000;
      
      // If we are editing, we should exclude the current trade from the "tradesToday" count and sum
      const tradesToday = trades.filter(t => t.date === formData.date && (!initialTrade || t.id !== initialTrade.id));
      
      const entryRules = formData.rulesFollowed;
      const max2Trades = tradesToday.length < 2; // Can only have 0 or 1 other trades today
      
      let dollarRisk = 0;
      if (rMultiple > 0) dollarRisk = finalPnL / rMultiple;
      else if (rMultiple < 0) dollarRisk = Math.abs(finalPnL / Math.abs(rMultiple));
      else dollarRisk = Math.abs(finalPnL); // fallback
      
      const maxRisk = dollarRisk <= balance * 0.005;
      const maxTp = finalPnL <= 0 || (rMultiple === 2);
      
      const sumPnL = tradesToday.reduce((sum, t) => sum + t.netPnL, 0) + finalPnL;
      const maxProfit = sumPnL <= balance * 0.02;

      const allRulesFollowed = entryRules && max2Trades && maxRisk && maxTp && maxProfit;
      const journalResult = allRulesFollowed ? (finalPnL >= 0 ? "Good Win" : "Good Loss") : (finalPnL >= 0 ? "Bad Win" : "Bad Loss");

      const journalPayload = {
        date: formData.date,
        pair: formData.symbol.toUpperCase(),
        session: formData.session as any,
        entryRules,
        max2Trades,
        maxRisk,
        maxTp,
        maxProfit,
        result: journalResult as any,
        outcome: journalData.outcome
      };

      if (initialTrade && onEditTrade) {
        onEditTrade(initialTrade.id, payload);
        
        // Find existing journal entry and update it
        const existingJournal = entries.find(e => e.date === initialTrade.date && e.pair === initialTrade.symbol);
        if (existingJournal) {
          updateEntry(existingJournal.id, journalPayload);
        } else {
          addEntry({ ...journalPayload });
        }
      } else if (onAddTrade) {
        onAddTrade(payload);
        // Add journal entry
        addEntry(journalPayload);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--card)] w-full max-w-2xl rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/50">
          <h2 className="text-xl font-bold text-[var(--foreground)]">{initialTrade ? 'Edit Trade' : 'Add New Trade'}</h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 ? (
            <>
              {/* Basics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Date</label>
              <CustomDatePicker value={formData.date} onChange={(val: string) => { setFormData({...formData, date: val}); if (errors.date) setErrors({...errors, date: ""}); }} error={errors.date} />
              {errors.date && <p className="text-xs text-[var(--loss)] mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Market</label>
              
<CustomAutocomplete 
  value={formData.symbol} 
  onChange={(val: string) => {
    setFormData({...formData, symbol: val.toUpperCase()});
    if (errors.symbol) setErrors({...errors, symbol: ""});
  }} 
  options={["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD", "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "XAUUSD", "XAGUSD", "USOIL", "UKOIL", "US30", "US100", "US500", "GER40", "UK100", "JPN225"]} 
  placeholder="e.g. EURUSD" 
  error={errors.symbol} 
/>

            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Category</label>
              <CustomSelect value={formData.category} onChange={(val: string) => setFormData({...formData, category: val})} options={["Forex", "Index"]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Direction</label>
              <CustomSelect value={formData.direction} onChange={(val: string) => setFormData({...formData, direction: val})} options={["Long", "Short"]} />
            </div>
          </div>

          {/* Execution Details */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Net P&L ($)</label>
              <input type="number" value={formData.netPnL} onChange={e => {
                setFormData({...formData, netPnL: e.target.value});
                if (errors.netPnL) setErrors({...errors, netPnL: ""});
              }} className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] ${errors.netPnL ? 'border-2 !border-[var(--loss)]' : 'border-[var(--border)]'}`} placeholder="e.g. 150" />
              {errors.netPnL && <p className="text-xs text-[var(--loss)] mt-1">{errors.netPnL}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Entry Price</label>
              <input type="number" value={formData.entryPrice} onChange={e => {
                setFormData({...formData, entryPrice: e.target.value});
                if (errors.entryPrice) setErrors({...errors, entryPrice: ""});
              }} className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] ${errors.entryPrice ? 'border-2 !border-[var(--loss)]' : 'border-[var(--border)]'}`} />
              {errors.entryPrice && <p className="text-xs text-[var(--loss)] mt-1">{errors.entryPrice}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Exit Price</label>
              <input type="number" value={formData.exitPrice} onChange={e => {
                setFormData({...formData, exitPrice: e.target.value});
                if (errors.exitPrice) setErrors({...errors, exitPrice: ""});
              }} className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] ${errors.exitPrice ? 'border-2 !border-[var(--loss)]' : 'border-[var(--border)]'}`} />
              {errors.exitPrice && <p className="text-xs text-[var(--loss)] mt-1">{errors.exitPrice}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Stop Loss</label>
              <input type="number" value={formData.sl} onChange={e => {
                setFormData({...formData, sl: e.target.value});
                if (errors.sl) setErrors({...errors, sl: ""});
              }} className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] ${errors.sl ? 'border-2 !border-[var(--loss)]' : 'border-[var(--border)]'}`} />
              {errors.sl && <p className="text-xs text-[var(--loss)] mt-1">{errors.sl}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Take Profit</label>
              <input type="number" value={formData.tp} onChange={e => {
                setFormData({...formData, tp: e.target.value});
                if (errors.tp) setErrors({...errors, tp: ""});
              }} className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] ${errors.tp ? 'border-2 !border-[var(--loss)]' : 'border-[var(--border)]'}`} />
              {errors.tp && <p className="text-xs text-[var(--loss)] mt-1">{errors.tp}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Lot Size</label>
              <input type="number" value={formData.lotSize} onChange={e => {
                setFormData({...formData, lotSize: e.target.value});
                if (errors.lotSize) setErrors({...errors, lotSize: ""});
              }} className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] ${errors.lotSize ? 'border-2 !border-[var(--loss)]' : 'border-[var(--border)]'}`} />
              {errors.lotSize && <p className="text-xs text-[var(--loss)] mt-1">{errors.lotSize}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Session</label>
              <CustomSelect value={formData.session} onChange={(val: string) => setFormData({...formData, session: val})} options={["Asian", "London", "New York"]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Time Period</label>
              <CustomSelect value={formData.timePeriod} onChange={(val: string) => setFormData({...formData, timePeriod: val})} options={["London Silver Bullet", "NY AM Silver Bullet", "NY PM Silver Bullet"]} />
            </div>
          </div>

          {/* Psychology & Checklist */}
          <div className="pt-4 border-t border-[var(--border)] space-y-4">
            <h3 className="text-md font-semibold text-[var(--foreground)]">Self-Management & Psychology</h3>
            
            <div className="flex items-center">
              <input type="checkbox" id="rules" checked={formData.rulesFollowed} onChange={e => setFormData({...formData, rulesFollowed: e.target.checked})} className="w-4 h-4 rounded border-[var(--border)] bg-[var(--card)] text-[var(--primary)] focus:ring-[var(--primary)]" />
              <label htmlFor="rules" className="ml-2 text-sm text-[var(--foreground)]">Did you follow your trading plan?</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Emotion</label>
                <CustomSelect value={formData.emotion} onChange={(val: string) => setFormData({...formData, emotion: val})} options={["Calm", "Anxious", "FOMO", "Revenge"]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Mistake</label>
                <CustomSelect value={formData.mistake} onChange={(val: string) => setFormData({...formData, mistake: val})} options={["None", "Early Entry", "Late Entry", "Chased", "Moved SL", "Forced"]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Strategy</label>
                <CustomSelect value={formData.strategy} onChange={(val: string) => setFormData({...formData, strategy: val})} options={["Order Flow", "Sharp turn #1", "Sharp turn #2"]} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Notes</label>
              <textarea 
                rows={3} 
                value={formData.notes}
                onChange={e => {
                  setFormData({...formData, notes: e.target.value});
                  if (errors.notes) setErrors({...errors, notes: ""});
                }}
                className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] ${errors.notes ? 'border-2 !border-[var(--loss)]' : 'border-[var(--border)]'}`}
                placeholder="What went well? What went wrong?"
              />
              {errors.notes && <p className="text-xs text-[var(--loss)] mt-1">{errors.notes}</p>}
            </div>

            {/* Images Section */}
            <div className="pt-4 border-t border-[var(--border)] space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Attachments</h3>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isScanning}
                  className="flex items-center px-3 py-1.5 bg-[var(--muted)] hover:bg-[var(--border)] rounded-md text-[var(--foreground)] text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> {isUploading ? "Uploading..." : isScanning ? "✨ AI Extracting Trade..." : "Attach Image"}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
              
              {aiError && (
                <div className="bg-[var(--loss)]/20 border border-[var(--loss)]/30 rounded-md p-3 flex items-start text-sm mt-2">
                  <AlertCircle className="w-5 h-5 text-[var(--loss)] mr-2 shrink-0 mt-0.5" />
                  <div className="text-[var(--loss)] font-medium">{aiError}</div>
                </div>
              )}

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] aspect-video cursor-pointer" onClick={() => setPreviewImage(url)}>
                      <img src={url} alt="Attached" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-[var(--loss)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
            </>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Step 2: Link Daily Journal Entry</h3>
              
              <div className="p-4 bg-[var(--card)]/50 rounded-lg border border-[var(--border)] mb-4">
                <p className="text-sm text-[var(--foreground)]">
                  <span className="font-bold text-[var(--primary)]">Note:</span> Your daily rules (Entry Rules, Max 2 Trades, Max Risk, Max TP, Max Profit) and Session Result are now <span className="font-bold text-[var(--foreground)]">automatically calculated</span> by the algorithm based on your trade execution parameters and your account balance.
                </p>
              </div>
              {/* Notes ONLY */}
              <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Session Outcome Notes</label>
                  <textarea 
                    rows={4} 
                    value={journalData.outcome}
                    onChange={e => {
                      setJournalData({...journalData, outcome: e.target.value});
                      if (errors.outcome) setErrors({...errors, outcome: ""});
                    }}
                    className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] ${errors.outcome ? 'border-2 !border-[var(--loss)]' : 'border-[var(--border)]'}`}
                    placeholder="Summarize your daily performance and what you learned..."
                  />
                  {errors.outcome && <p className="text-xs text-[var(--loss)] mt-1">{errors.outcome}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--card)]/50 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-[var(--foreground)] hover:text-[var(--foreground)] transition-colors">
            Cancel
          </button>
          {step === 1 && !initialTrade ? (
            <button onClick={handleNext} className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary)] transition-colors shadow-lg shadow-[var(--primary)]/20">
              Next: Daily Journal
            </button>
          ) : (
            <div className="flex space-x-3">
              {step === 2 && (
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-md text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                  Back
                </button>
              )}
              <button onClick={handleFinalSubmit} className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary)] transition-colors shadow-lg shadow-[var(--primary)]/20">
                {initialTrade ? 'Save Changes' : 'Save Trade & Journal'}
              </button>
            </div>
          )}
        </div>
      </div>

      {previewImage && (
        <ImageViewerModal src={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
}
