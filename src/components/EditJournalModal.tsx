"use client";

import { X, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { ProcessEntry } from "@/lib/useJournal";
import { format } from "date-fns";

interface EditJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updatedFields: Partial<ProcessEntry>) => void;
  entry: ProcessEntry | null;
}

export default function EditJournalModal({ isOpen, onClose, onSave, entry }: EditJournalModalProps) {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    date: "",
    pair: "",
    session: "London",
    entryRules: true,
    max2Trades: true,
    maxRisk: true,
    maxTp: true,
    maxProfit: true,
    result: "Good Win" as ProcessEntry["result"],
    outcome: ""
  });

  useEffect(() => {
    if (isOpen && entry) {
      setFormData({
        date: entry.date,
        pair: entry.pair,
        session: entry.session,
        entryRules: entry.entryRules,
        max2Trades: entry.max2Trades,
        maxRisk: entry.maxRisk,
        maxTp: entry.maxTp,
        maxProfit: entry.maxProfit,
        result: entry.result,
        outcome: entry.outcome
      });
      setErrors({});
    }
  }, [isOpen, entry]);

  if (!isOpen || !entry) return null;

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.date.trim()) newErrors.date = true;
    if (!formData.pair.trim()) newErrors.pair = true;
    if (!formData.outcome.trim()) newErrors.outcome = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSave(entry.id, formData);
    onClose();
  };

  const results = ["Good Win", "Good Loss", "Bad Win", "Bad Loss"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--card)] w-full max-w-xl rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/50">
          <h2 className="text-xl font-bold text-white">Edit Journal Entry</h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {Object.keys(errors).length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/50 rounded-lg p-3 flex items-start">
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 mr-2 shrink-0" />
              <p className="text-sm text-rose-500">Please fill in all required fields highlighted in red.</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Date</label>
              <input 
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-white focus:outline-none focus:border-[var(--primary)] ${errors.date ? '!border-rose-500' : 'border-[var(--border)]'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Pair</label>
              <input 
                list="markets-list-edit"
                value={formData.pair}
                onChange={e => setFormData({...formData, pair: e.target.value.toUpperCase()})}
                placeholder="e.g. EU"
                className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-white focus:outline-none focus:border-[var(--primary)] uppercase ${errors.pair ? '!border-rose-500' : 'border-[var(--border)]'}`}
              />
              <datalist id="markets-list-edit">
                <option value="EURUSD" />
                <option value="GBPUSD" />
                <option value="USDJPY" />
                <option value="USDCHF" />
                <option value="AUDUSD" />
                <option value="USDCAD" />
                <option value="NZDUSD" />
                <option value="EURGBP" />
                <option value="EURJPY" />
                <option value="GBPJPY" />
                <option value="AUDJPY" />
                <option value="XAUUSD" />
                <option value="XAGUSD" />
                <option value="USOIL" />
                <option value="UKOIL" />
                <option value="US30" />
                <option value="US100" />
                <option value="US500" />
                <option value="GER40" />
                <option value="UK100" />
                <option value="JPN225" />
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Session</label>
              <select
                value={formData.session}
                onChange={e => setFormData({...formData, session: e.target.value})}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[var(--primary)]"
              >
                <option>Asian</option>
                <option>London</option>
                <option>NY</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Rules Evaluated</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { key: "entryRules", label: "Entry" },
                { key: "max2Trades", label: "2 Trades" },
                { key: "maxRisk", label: "0.5% Risk" },
                { key: "maxTp", label: "2R TP" },
                { key: "maxProfit", label: "2% Profit" }
              ].map((rule) => {
                const val = formData[rule.key as keyof typeof formData] as boolean;
                return (
                  <button 
                    key={rule.key}
                    onClick={() => setFormData({...formData, [rule.key]: !val})}
                    className={`flex flex-col items-center justify-center p-2 rounded border transition-colors ${
                      val 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold mb-1 text-[var(--muted-foreground)]">{rule.label}</span>
                    <span className="text-xs font-bold uppercase">{val ? "TRUE" : "FALSE"}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Result</label>
              <select 
                value={formData.result}
                onChange={e => setFormData({...formData, result: e.target.value as any})}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[var(--primary)]"
              >
                {results.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Outcome</label>
              <input 
                type="text" 
                value={formData.outcome}
                onChange={e => setFormData({...formData, outcome: e.target.value})}
                placeholder="Successful day"
                className={`w-full bg-[var(--card)] border rounded-md px-3 py-2 text-white focus:outline-none focus:border-[var(--primary)] ${errors.outcome ? '!border-rose-500' : 'border-[var(--border)]'}`}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--card)]/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-6 py-2 text-sm font-medium bg-[var(--primary)] hover:bg-[var(--primary)] text-white rounded-lg transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
