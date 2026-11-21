"use client";

import { X, AlertCircle, Image as ImageIcon, Trash2, CheckCircle2, Sparkles, RefreshCw, Check, Zap, Plus } from "lucide-react";
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

function compressImageElement(img: HTMLImageElement, maxDimension: number, quality: number): string {
  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return img.src;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export const PLAYBOOK_CONFIRMATION_OPTIONS = [
  { id: "Bias 1D, 4H, 1H", label: "Bias 1D, 4H, 1H", detail: "HTF Direction & Clear Draw on Liquidity", badge: "HTF Bias" },
  { id: "Silver Bullet Time", label: "Silver Bullet Time", detail: "London (3-4 AM) / NY AM (10-11 AM) / NY PM (2-3 PM)", badge: "Killzone" },
  { id: "15M FVG, or OB / RB", label: "15M FVG, or OB / RB", detail: "15m Key Institutional PD Array mitigation", badge: "15M Array" },
  { id: "1min ST (VSR) / SRL / MSS", label: "1min ST (VSR) / SRL / MSS", detail: "1m LTF Volume Reversal, Liquidity sweep, or MSS", badge: "1M Trigger" },
  { id: "SMT Divergence", label: "SMT Divergence", detail: "Correlated Asset Divergence (EUR/GBP, NQ/ES, DXY)", badge: "SMT" }
];

const DEFAULT_MODAL_PDA = [
  { id: "15M FVG", label: "15M FVG" },
  { id: "15M OB", label: "15M OB" },
  { id: "15M RB", label: "15M RB" },
  { id: "HRL", label: "HRL" }
];

const DEFAULT_MODAL_ENTRY1M = [
  { id: "ST (VSR)", label: "ST (VSR)" },
  { id: "SRL", label: "SRL (Sweep)" },
  { id: "MSS", label: "MSS (Shift)" },
  { id: "Order Flow", label: "Order Flow" }
];

const DEFAULT_MODAL_SMT = [
  { id: "EUR vs GBP", label: "EUR vs GBP" },
  { id: "NQ vs ES", label: "NQ vs ES" },
  { id: "DXY Inverted", label: "DXY Inverted" },
  { id: "XAU vs XAG (Gold)", label: "XAU vs XAG (Gold)" },
  { id: "Clean SMT", label: "Clean SMT" }
];

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
    patterns: [] as string[],
    confirmations: [] as string[],
    confluenceScore: 100,
    playbookDetails: {
      biasFrames: ["1D", "4H", "1H"] as string[],
      sbSession: "London SB (3-4 AM)",
      pdaType: "15M FVG",
      entry1m: "MSS",
      smtType: "Clean SMT"
    }
  });

  const [pdaOptions, setPdaOptions] = useState<{ id: string; label: string }[]>(DEFAULT_MODAL_PDA);
  const [entry1mOptions, setEntry1mOptions] = useState<{ id: string; label: string }[]>(DEFAULT_MODAL_ENTRY1M);
  const [smtOptions, setSmtOptions] = useState<{ id: string; label: string }[]>(DEFAULT_MODAL_SMT);
  const [isAddingPda, setIsAddingPda] = useState(false);
  const [newPdaText, setNewPdaText] = useState("");
  const [isAddingEntry1m, setIsAddingEntry1m] = useState(false);
  const [newEntry1mText, setNewEntry1mText] = useState("");
  const [isAddingSmt, setIsAddingSmt] = useState(false);
  const [newSmtText, setNewSmtText] = useState("");

  const handleAddPda = () => {
    const trimmed = newPdaText.trim();
    if (!trimmed) return;
    const existing = pdaOptions.find(p => p.id.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setFormData(prev => ({
        ...prev,
        playbookDetails: { ...prev.playbookDetails, pdaType: existing.id }
      }));
      setNewPdaText("");
      setIsAddingPda(false);
      return;
    }
    const updated = [...pdaOptions, { id: trimmed, label: trimmed }];
    setPdaOptions(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("uc_pda_options_v2", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setFormData(prev => ({
      ...prev,
      playbookDetails: { ...prev.playbookDetails, pdaType: trimmed }
    }));
    setNewPdaText("");
    setIsAddingPda(false);
  };

  const handleDeletePda = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pdaOptions.filter(p => p.id !== id);
    setPdaOptions(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("uc_pda_options_v2", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    if (formData.playbookDetails.pdaType === id) {
      setFormData(prev => ({
        ...prev,
        playbookDetails: { ...prev.playbookDetails, pdaType: "" }
      }));
    }
  };

  const handleAddEntry1m = () => {
    const trimmed = newEntry1mText.trim();
    if (!trimmed) return;
    const existing = entry1mOptions.find(e => e.id.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setFormData(prev => ({
        ...prev,
        playbookDetails: { ...prev.playbookDetails, entry1m: existing.id }
      }));
      setNewEntry1mText("");
      setIsAddingEntry1m(false);
      return;
    }
    const updated = [...entry1mOptions, { id: trimmed, label: trimmed }];
    setEntry1mOptions(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("uc_entry1m_options_v2", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setFormData(prev => ({
      ...prev,
      playbookDetails: { ...prev.playbookDetails, entry1m: trimmed }
    }));
    setNewEntry1mText("");
    setIsAddingEntry1m(false);
  };

  const handleDeleteEntry1m = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = entry1mOptions.filter(e => e.id !== id);
    setEntry1mOptions(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("uc_entry1m_options_v2", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    if (formData.playbookDetails.entry1m === id) {
      setFormData(prev => ({
        ...prev,
        playbookDetails: { ...prev.playbookDetails, entry1m: "" }
      }));
    }
  };

  const handleAddSmt = () => {
    const trimmed = newSmtText.trim();
    if (!trimmed) return;
    const existing = smtOptions.find(m => m.id.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setFormData(prev => ({
        ...prev,
        playbookDetails: { ...prev.playbookDetails, smtType: existing.id }
      }));
      setNewSmtText("");
      setIsAddingSmt(false);
      return;
    }
    const updated = [...smtOptions, { id: trimmed, label: trimmed }];
    setSmtOptions(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("uc_smt_options_v2", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setFormData(prev => ({
      ...prev,
      playbookDetails: { ...prev.playbookDetails, smtType: trimmed }
    }));
    setNewSmtText("");
    setIsAddingSmt(false);
  };

  const handleDeleteSmt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = smtOptions.filter(m => m.id !== id);
    setSmtOptions(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("uc_smt_options_v2", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    if (formData.playbookDetails.smtType === id) {
      setFormData(prev => ({
        ...prev,
        playbookDetails: { ...prev.playbookDetails, smtType: "" }
      }));
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined") {
        try {
          const savedPda = localStorage.getItem("uc_pda_options_v2");
          if (savedPda) {
            const parsed = JSON.parse(savedPda);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPdaOptions(parsed.map((item: any) => ({
                id: item.id || item,
                label: item.label || item.id || item
              })));
            }
          }
          const savedEntry = localStorage.getItem("uc_entry1m_options_v2");
          if (savedEntry) {
            const parsed = JSON.parse(savedEntry);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setEntry1mOptions(parsed.map((item: any) => ({
                id: item.id || item,
                label: item.label || item.id || item
              })));
            }
          }
          const savedSmt = localStorage.getItem("uc_smt_options_v2");
          if (savedSmt) {
            const parsed = JSON.parse(savedSmt);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSmtOptions(parsed.map((item: any) => ({
                id: item.id || item,
                label: item.label || item.id || item
              })));
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (initialTrade) {
        const details = {
          biasFrames: initialTrade.playbookDetails?.biasFrames || ["1D", "4H", "1H"],
          sbSession: initialTrade.playbookDetails?.sbSession || (initialTrade.timePeriod === "London silver bullet" ? "London SB (3-4 AM)" : initialTrade.timePeriod === "NY silver bullet" ? "NY AM SB (10-11 AM)" : "London SB (3-4 AM)"),
          pdaType: initialTrade.playbookDetails?.pdaType || "15M FVG",
          entry1m: initialTrade.playbookDetails?.entry1m || "MSS",
          smtType: initialTrade.playbookDetails?.smtType || "Clean SMT"
        };
        const computedScore = initialTrade.confluenceScore !== undefined 
          ? initialTrade.confluenceScore 
          : (details.biasFrames.length ? 20 : 0) + (details.sbSession ? 20 : 0) + (details.pdaType ? 20 : 0) + (details.entry1m ? 20 : 0) + (details.smtType ? 20 : 0);

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
          patterns: initialTrade.patterns || [],
          confirmations: initialTrade.confirmations || [],
          confluenceScore: computedScore,
          playbookDetails: details
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
          patterns: [] as string[],
          confirmations: [],
          confluenceScore: 100,
          playbookDetails: {
            biasFrames: ["1D", "4H", "1H"],
            sbSession: "London SB (3-4 AM)",
            pdaType: "15M FVG",
            entry1m: "MSS",
            smtType: "Clean SMT"
          }
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
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);

  const scanTradeImage = async (imageDataUrl: string) => {
    const apiKey = preferences.geminiApiKey?.trim();
    if (!apiKey) {
      // Simulate extraction if no API key is provided
      setIsScanning(true);
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          symbol: prev.symbol || "EURUSD",
          direction: prev.direction || "Long",
          entryPrice: prev.entryPrice || "1.1020",
          exitPrice: prev.exitPrice || "1.1060",
          sl: prev.sl || "1.1000",
          tp: prev.tp || "1.1060",
          lotSize: prev.lotSize || "1.00",
          netPnL: prev.netPnL || "400"
        }));
        setIsScanning(false);
        setAiSuccess("Simulated demo trade extracted (Add Gemini API Key in Settings for live AI).");
        setTimeout(() => setAiSuccess(null), 5000);
      }, 700);
      return;
    }

    setIsScanning(true);
    setAiError(null);
    setAiSuccess(null);

    try {
      // 1. Prepare compressed image specifically for Gemini Vision payload (~80-120KB)
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image for scanning"));
        img.src = imageDataUrl;
      });

      const aiDataUrl = compressImageElement(img, 1280, 0.82);
      const base64Data = aiDataUrl.split(",")[1];

      const promptText = `Extract trading details from this screenshot (TradingView, MT4, etc.). Return a JSON object with these keys: symbol (string, e.g. XAUUSD), direction ('Long' or 'Short'), entryPrice (number), exitPrice (number or null), sl (number), tp (number), lotSize (number, look for 'Qty' or 'Volume'), netPnL (number or null), date (string 'YYYY-MM-DD', infer from bottom axis/time), and patterns (array of strings, identify any classic chart patterns like 'Order Block', 'FVG', 'Head & Shoulders', 'Break & Retest', 'Double Top', 'Liquidity Sweep' etc. visible in the chart). If a value is missing, use null (or empty array for patterns).`;

      // Candidate models for fallback
      const candidateModels = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-flash-latest"
      ];

      let successData: any = null;

      for (const model of candidateModels) {
        try {
          let retries = 2;
          while (retries > 0) {
            const aiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{
                    parts: [
                      { text: promptText },
                      { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                    ]
                  }],
                  generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                  }
                })
              }
            );

            if (aiRes.ok) {
              const data = await aiRes.json();
              if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                successData = data;
                break;
              }
            }

            if (aiRes.status === 503 || aiRes.status === 429) {
              retries--;
              if (retries > 0) {
                await new Promise(r => setTimeout(r, 1200));
                continue;
              }
            }

            if (aiRes.status === 400 || aiRes.status === 403) {
              const errData = await aiRes.json().catch(() => null);
              const errMsg = errData?.error?.message || "";
              if (errMsg.toLowerCase().includes("key") || errMsg.toLowerCase().includes("invalid")) {
                setAiError("Invalid Gemini API key. Please check your API key in Settings.");
                setIsScanning(false);
                return;
              }
            }

            break; // Try next fallback model
          }

          if (successData) break;
        } catch (fetchErr) {
          console.warn(`Model ${model} request failed, trying next fallback:`, fetchErr);
        }
      }

      if (!successData) {
        setAiError("AI Vision temporarily unavailable (Google servers busy). Your chart is saved — you can enter details manually or retry.");
        setIsScanning(false);
        return;
      }

      let rawText = successData.candidates[0].content.parts[0].text;
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
          patterns: parsed.patterns && Array.isArray(parsed.patterns) && parsed.patterns.length > 0 ? parsed.patterns : prev.patterns
        }));
        setAiSuccess("Trade details successfully auto-filled from chart!");
        setTimeout(() => setAiSuccess(null), 5000);
      } catch (parseErr) {
        console.error("JSON Parse Error on Gemini Response:", rawText);
        setAiError("Could not extract clean numbers from chart. Please fill in details manually.");
      }
    } catch (e: any) {
      console.error("AI Scan failed", e);
      setAiError("AI scan could not read image: " + (e.message || "Unknown error"));
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiError(null);
    setAiSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      await alert({ message: "File size exceeds 15MB limit.", danger: true });
      return;
    }

    setIsUploading(true);

    try {
      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Optimize image for journal storage (max 1600px, 0.85 quality) to keep localStorage fast & lean
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = rawDataUrl;
      });

      const optimizedDataUrl = compressImageElement(img, 1600, 0.85);

      setFormData(prev => ({ ...prev, images: [...prev.images, optimizedDataUrl] }));

      // Automatically scan the trade image with AI
      await scanTradeImage(optimizedDataUrl);
    } catch (err: any) {
      console.error(err);
      await alert({ message: "Failed to upload image: " + (err.message || ""), danger: true });
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
      const isZeroExecution = entry === 0 && exit === 0 && finalPnL === 0;
      const status = isZeroExecution ? "Pending" : (finalPnL > 0 ? "Win" : finalPnL < 0 ? "Loss" : "Break Even");
      
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
        isPlanned: isZeroExecution,
        images: formData.images,
        patterns: formData.patterns,
        confirmations: [
          ...(formData.playbookDetails.biasFrames.length > 0 ? [`Bias: ${formData.playbookDetails.biasFrames.join('+')}`] : []),
          ...(formData.playbookDetails.sbSession ? [`SB: ${formData.playbookDetails.sbSession}`] : []),
          ...(formData.playbookDetails.pdaType ? [`PDA: ${formData.playbookDetails.pdaType}`] : []),
          ...(formData.playbookDetails.entry1m ? [`1M: ${formData.playbookDetails.entry1m}`] : []),
          ...(formData.playbookDetails.smtType ? [`SMT: ${formData.playbookDetails.smtType}`] : [])
        ],
        confluenceScore: 
          (formData.playbookDetails.biasFrames.length > 0 ? 20 : 0) +
          (formData.playbookDetails.sbSession ? 20 : 0) +
          (formData.playbookDetails.pdaType ? 20 : 0) +
          (formData.playbookDetails.entry1m ? 20 : 0) +
          (formData.playbookDetails.smtType ? 20 : 0),
        playbookDetails: formData.playbookDetails
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

          {/* Pre-Trade Plan Auto-Sync Informational Pill */}
          {(!parseFloat(formData.entryPrice) && !parseFloat(formData.netPnL)) && (
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs text-indigo-700 dark:text-indigo-300">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-indigo-500 shrink-0 fill-indigo-500" />
                <div className="min-w-0">
                  <span className="font-bold">Pre-Trade Plan Mode (0 P&L / 0 Price):</span>
                  <span className="opacity-90 block text-[11px] truncate sm:whitespace-normal">
                    දවස අවසානයේ cTrader Statement (.xlsx) upload කළ විට Entry, Exit සහ Net P&L ස්වයංක්‍රීයව Auto-Sync වේ!
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shrink-0 border border-indigo-500/30">
                Auto-Sync Ready ⚡
              </span>
            </div>
          )}

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

          {/* Pre-Trade Playbook Confirmations (100 Marks Engine: 20 Each) */}
          <div className="pt-4 border-t border-[var(--border)] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#4F39F6]/15 text-[#4F39F6] flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">
                  Pre-Trade Confluence Playbook
                </h3>
                {(() => {
                  const bMarks = formData.playbookDetails.biasFrames.length > 0 ? 20 : 0;
                  const sMarks = formData.playbookDetails.sbSession ? 20 : 0;
                  const pMarks = formData.playbookDetails.pdaType ? 20 : 0;
                  const eMarks = formData.playbookDetails.entry1m ? 20 : 0;
                  const smMarks = formData.playbookDetails.smtType ? 20 : 0;
                  const tMarks = bMarks + sMarks + pMarks + eMarks + smMarks;
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border transition-all ${
                      tMarks === 100
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                        : tMarks >= 80
                        ? "bg-[#4F39F6]/15 text-[#4F39F6] border-[#4F39F6]/40"
                        : tMarks >= 60
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40"
                        : "bg-rose-500/15 text-rose-500 border-rose-500/40"
                    }`}>
                      {tMarks} / 100 Marks {tMarks === 100 ? "• A+ Setup" : tMarks >= 80 ? "• A Setup" : tMarks >= 60 ? "• B Setup" : "• C Setup"}
                    </span>
                  );
                })()}
              </div>
              
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    playbookDetails: {
                      biasFrames: ["1D", "4H", "1H"],
                      sbSession: "London SB (3-4 AM)",
                      pdaType: "15M FVG",
                      entry1m: "MSS",
                      smtType: "Clean SMT"
                    }
                  })}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-[#4F39F6] hover:bg-[#4F39F6]/10 transition-colors cursor-pointer"
                >
                  Set 100 Marks (A+)
                </button>
                <span className="text-[var(--muted-foreground)] opacity-40">•</span>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    playbookDetails: {
                      biasFrames: [],
                      sbSession: "",
                      pdaType: "",
                      entry1m: "",
                      smtType: ""
                    }
                  })}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  Reset (0)
                </button>
              </div>
            </div>

            {/* Score progress bar */}
            {(() => {
              const bMarks = formData.playbookDetails.biasFrames.length > 0 ? 20 : 0;
              const sMarks = formData.playbookDetails.sbSession ? 20 : 0;
              const pMarks = formData.playbookDetails.pdaType ? 20 : 0;
              const eMarks = formData.playbookDetails.entry1m ? 20 : 0;
              const smMarks = formData.playbookDetails.smtType ? 20 : 0;
              const tMarks = bMarks + sMarks + pMarks + eMarks + smMarks;
              return (
                <div className="w-full bg-[var(--border)]/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      tMarks === 100
                        ? "bg-gradient-to-r from-emerald-500 to-[#10B981]"
                        : tMarks >= 80
                        ? "bg-gradient-to-r from-[#4F39F6] to-indigo-400"
                        : tMarks >= 60
                        ? "bg-gradient-to-r from-amber-500 to-amber-400"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${tMarks}%` }}
                  />
                </div>
              );
            })()}

            {/* 5 Selectors Grid */}
            <div className="space-y-2.5">
              {/* 1. Bias Frame (20 Marks) */}
              <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <span>1. Bias: Which Frame?</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-normal">(Daily / 4H / 1H)</span>
                  </span>
                  <span className={`text-[10.5px] font-mono font-bold ${formData.playbookDetails.biasFrames.length > 0 ? "text-[#10B981]" : "text-[var(--muted-foreground)]"}`}>
                    +{formData.playbookDetails.biasFrames.length > 0 ? 20 : 0}/20 Marks
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["1D", "4H", "1H"].map((f) => {
                    const active = formData.playbookDetails.biasFrames.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? formData.playbookDetails.biasFrames.filter(x => x !== f)
                            : [...formData.playbookDetails.biasFrames, f];
                          setFormData({
                            ...formData,
                            playbookDetails: { ...formData.playbookDetails, biasFrames: next }
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? "bg-[#4F39F6] text-white shadow-xs"
                            : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {active ? `✓ ${f}` : f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Silver Bullet Window (20 Marks) */}
              <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <span>2. SB: Which Frame/Time?</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-normal">(Killzone Window)</span>
                  </span>
                  <span className={`text-[10.5px] font-mono font-bold ${formData.playbookDetails.sbSession ? "text-[#10B981]" : "text-[var(--muted-foreground)]"}`}>
                    +{formData.playbookDetails.sbSession ? 20 : 0}/20 Marks
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "London SB (3-4 AM)", label: "London SB (3-4 AM)" },
                    { id: "NY AM SB (10-11 AM)", label: "NY AM SB (10-11 AM)" },
                    { id: "NY PM SB (2-3 PM)", label: "NY PM SB (2-3 PM)" }
                  ].map((s) => {
                    const active = formData.playbookDetails.sbSession === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            playbookDetails: {
                              ...formData.playbookDetails,
                              sbSession: active ? "" : s.id
                            }
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          active
                            ? "bg-amber-500 text-black font-bold shadow-xs"
                            : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {active ? `✓ ${s.label}` : s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. PDA (20 Marks) */}
              <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <span>3. PDA: What Array?</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-normal">(15M Key Level)</span>
                  </span>
                  <span className={`text-[10.5px] font-mono font-bold ${formData.playbookDetails.pdaType ? "text-[#10B981]" : "text-[var(--muted-foreground)]"}`}>
                    +{formData.playbookDetails.pdaType ? 20 : 0}/20 Marks
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {pdaOptions.map((p) => {
                    const active = formData.playbookDetails.pdaType === p.id;
                    return (
                      <div key={p.id} className="relative group inline-flex">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              playbookDetails: {
                                ...formData.playbookDetails,
                                pdaType: active ? "" : p.id
                              }
                            });
                          }}
                          className={`pl-2.5 ${pdaOptions.length > 1 ? "pr-6" : "pr-2.5"} py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            active
                              ? "bg-emerald-500 text-white font-bold shadow-xs"
                              : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                          }`}
                        >
                          <span>{active ? `✓ ${p.label}` : p.label}</span>
                        </button>
                        {pdaOptions.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeletePda(p.id, e)}
                            title="Remove option"
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white text-muted-foreground transition-opacity cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {isAddingPda ? (
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newPdaText}
                        onChange={(e) => setNewPdaText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPda();
                          }
                          if (e.key === "Escape") setIsAddingPda(false);
                        }}
                        placeholder="Add PDA..."
                        className="px-2 py-0.5 w-24 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[10.5px] text-[var(--foreground)] outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddPda}
                        className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10.5px] font-bold hover:bg-emerald-700 cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingPda(false)}
                        className="p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingPda(true)}
                      className="px-2 py-1 rounded-lg border border-dashed border-[var(--border)] text-[10.5px] font-semibold text-[var(--muted-foreground)] hover:text-emerald-500 hover:border-emerald-500/50 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4. 1M Entry (20 Marks) */}
              <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <span>4. 1M Entry: What Trigger?</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-normal">(Execution Model)</span>
                  </span>
                  <span className={`text-[10.5px] font-mono font-bold ${formData.playbookDetails.entry1m ? "text-[#10B981]" : "text-[var(--muted-foreground)]"}`}>
                    +{formData.playbookDetails.entry1m ? 20 : 0}/20 Marks
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {entry1mOptions.map((e) => {
                    const active = formData.playbookDetails.entry1m === e.id;
                    return (
                      <div key={e.id} className="relative group inline-flex">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              playbookDetails: {
                                ...formData.playbookDetails,
                                entry1m: active ? "" : e.id
                              }
                            });
                          }}
                          className={`pl-2.5 ${entry1mOptions.length > 1 ? "pr-6" : "pr-2.5"} py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            active
                              ? "bg-sky-500 text-white font-bold shadow-xs"
                              : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                          }`}
                        >
                          <span>{active ? `✓ ${e.label}` : e.label}</span>
                        </button>
                        {entry1mOptions.length > 1 && (
                          <button
                            type="button"
                            onClick={(ev) => handleDeleteEntry1m(e.id, ev)}
                            title="Remove option"
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white text-muted-foreground transition-opacity cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {isAddingEntry1m ? (
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newEntry1mText}
                        onChange={(e) => setNewEntry1mText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddEntry1m();
                          }
                          if (e.key === "Escape") setIsAddingEntry1m(false);
                        }}
                        placeholder="Add trigger..."
                        className="px-2 py-0.5 w-24 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[10.5px] text-[var(--foreground)] outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddEntry1m}
                        className="px-2 py-0.5 rounded-lg bg-sky-600 text-white text-[10.5px] font-bold hover:bg-sky-700 cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingEntry1m(false)}
                        className="p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingEntry1m(true)}
                      className="px-2 py-1 rounded-lg border border-dashed border-[var(--border)] text-[10.5px] font-semibold text-[var(--muted-foreground)] hover:text-sky-500 hover:border-sky-500/50 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 5. SMT Divergence (20 Marks) */}
              <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <span>5. SMT Divergence</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-normal">(Correlated Crack)</span>
                  </span>
                  <span className={`text-[10.5px] font-mono font-bold ${formData.playbookDetails.smtType ? "text-[#10B981]" : "text-[var(--muted-foreground)]"}`}>
                    +{formData.playbookDetails.smtType ? 20 : 0}/20 Marks
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {smtOptions.map((m) => {
                    const active = formData.playbookDetails.smtType === m.id;
                    return (
                      <div key={m.id} className="relative group inline-flex">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              playbookDetails: {
                                ...formData.playbookDetails,
                                smtType: active ? "" : m.id
                              }
                            });
                          }}
                          className={`pl-2.5 ${smtOptions.length > 1 ? "pr-6" : "pr-2.5"} py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            active
                              ? "bg-purple-500 text-white font-bold shadow-xs"
                              : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                          }`}
                        >
                          <span>{active ? `✓ ${m.label}` : m.label}</span>
                        </button>
                        {smtOptions.length > 1 && (
                          <button
                            type="button"
                            onClick={(ev) => handleDeleteSmt(m.id, ev)}
                            title="Remove option"
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white text-muted-foreground transition-opacity cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {isAddingSmt ? (
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newSmtText}
                        onChange={(e) => setNewSmtText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSmt();
                          }
                          if (e.key === "Escape") setIsAddingSmt(false);
                        }}
                        placeholder="Add SMT..."
                        className="px-2 py-0.5 w-24 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[10.5px] text-[var(--foreground)] outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSmt}
                        className="px-2 py-0.5 rounded-lg bg-purple-600 text-white text-[10.5px] font-bold hover:bg-purple-700 cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingSmt(false)}
                        className="p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingSmt(true)}
                      className="px-2 py-1 rounded-lg border border-dashed border-[var(--border)] text-[10.5px] font-semibold text-[var(--muted-foreground)] hover:text-purple-500 hover:border-purple-500/50 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
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
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isScanning}
                  className="flex items-center px-3 py-1.5 bg-[var(--muted)] hover:bg-[var(--border)] rounded-md text-[var(--foreground)] text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> {isUploading ? "Uploading..." : isScanning ? "✨ AI Extracting Trade..." : "Attach Image"}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
              
              {aiSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center justify-between text-sm mt-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-emerald-500 text-xs font-medium">{aiSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiSuccess(null)}
                    className="text-emerald-500/70 hover:text-emerald-500 p-1"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {aiError && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start justify-between text-sm mt-2 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-amber-500 text-xs font-medium leading-relaxed">{aiError}</p>
                      <p className="text-[var(--muted-foreground)] text-[11px]">
                        Chart attached successfully. You can enter trade parameters manually or retry the AI scan.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    {formData.images.length > 0 && (
                      <button
                        type="button"
                        onClick={() => scanTradeImage(formData.images[formData.images.length - 1])}
                        disabled={isScanning}
                        className="text-xs px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                        {isScanning ? "Scanning..." : "Retry"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAiError(null)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] aspect-video cursor-pointer" onClick={() => setPreviewImage(url)}>
                      <img src={url} alt="Attached" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            scanTradeImage(url);
                          }}
                          disabled={isScanning}
                          className="px-2 py-1 bg-black/60 hover:bg-[var(--primary)] text-white text-[11px] font-medium rounded-md backdrop-blur-md flex items-center gap-1 transition-colors"
                          title="Extract trade data from this chart with AI"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Scan</span>
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(idx);
                          }}
                          className="p-1.5 bg-black/60 hover:bg-[var(--loss)] text-white rounded-full transition-all backdrop-blur-md"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
