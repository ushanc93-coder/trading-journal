"use client";

import React, { useState, useRef, useMemo } from "react";
import { 
  ImagePlus, Upload, CheckCircle2, AlertCircle, X, Sparkles, 
  Trash2, ChevronDown, Check, ArrowRight, FileImage, Eye, RefreshCw, Link as LinkIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Trade } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";
import { ImageViewerModal } from "./ImageViewerModal";

interface MatchedItem {
  id: string;
  file: File;
  previewUrl: string;
  matchedTradeId: string;
  matchScore: number;
  matchReason: string;
  uploadedUrl?: string;
}

interface AutoMatchImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  onApplyMatches: (updates: { tradeId: string; imageUrl: string }[]) => void;
}

export default function AutoMatchImagesModal({
  isOpen,
  onClose,
  trades,
  onApplyMatches
}: AutoMatchImagesModalProps) {
  const [lang, setLang] = useState<"en" | "si">("si");
  const [items, setItems] = useState<MatchedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sort trades newest first for matching & selection
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trades]);

  if (!isOpen) return null;

  // Smart Match Engine: Scores and associates a screenshot to the best trade
  const findBestTradeMatch = (file: File): { trade: Trade | null; score: number; reason: string } => {
    if (sortedTrades.length === 0) {
      return { trade: null, score: 0, reason: "No trades in journal" };
    }

    const fname = file.name.toLowerCase();
    const fileModDate = new Date(file.lastModified);
    const fileDateStr = fileModDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const fileHours = fileModDate.getHours();

    let bestTrade: Trade | null = null;
    let highestScore = -1;
    let bestReason = "Default latest trade";

    for (let i = 0; i < sortedTrades.length; i++) {
      const t = sortedTrades[i];
      let score = 0;
      const reasons: string[] = [];

      // 1. Direct Ticket Match (Highest Priority: TR-001, 6178397, etc.)
      if (t.ticket) {
        const cleanTicket = t.ticket.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanFilename = fname.replace(/[^a-z0-9]/g, "");
        if (cleanTicket && cleanFilename.includes(cleanTicket)) {
          score += 100;
          reasons.push(lang === "si" ? `Ticket #${t.ticket} ගැලපේ` : `Ticket #${t.ticket} match`);
        }
      }

      // 2. Exact or Embedded Date Match
      const tDate = t.date.trim();
      if (tDate) {
        if (fname.includes(tDate) || fname.includes(tDate.replace(/-/g, ""))) {
          score += 45;
          reasons.push(lang === "si" ? `ගොනු නාමයේ දිනය (${tDate}) ගැලපේ` : `Date in filename (${tDate})`);
        } else if (fileDateStr === tDate) {
          score += 35;
          reasons.push(lang === "si" ? `Screenshot දිනය (${tDate}) ගැලපේ` : `Screenshot date match (${tDate})`);
        }
      }

      // 3. Symbol Match (XAUUSD, GOLD, EURUSD, US30, etc.)
      const sym = t.symbol.toLowerCase();
      if (fname.includes(sym)) {
        score += 30;
        reasons.push(lang === "si" ? `Symbol ${t.symbol} ගැලපේ` : `Symbol ${t.symbol} match`);
      } else if (sym.includes("xau") && (fname.includes("gold") || fname.includes("xau"))) {
        score += 30;
        reasons.push(lang === "si" ? `Gold (XAU) ගැලපේ` : `Gold (XAU) match`);
      }

      // 4. Direction Match (Buy, Sell, Long, Short)
      const dir = t.direction.toLowerCase();
      if (fname.includes(dir) || (dir === "long" && fname.includes("buy")) || (dir === "short" && fname.includes("sell"))) {
        score += 15;
        reasons.push(lang === "si" ? `Direction (${t.direction}) ගැලපේ` : `Direction (${t.direction}) match`);
      }

      // 5. Time Proximity (cTrader notes often include HH:mm or session)
      if (t.session) {
        if (
          (t.session === "Asian" && fileHours >= 0 && fileHours < 8) ||
          (t.session === "London" && fileHours >= 7 && fileHours < 14) ||
          (t.session === "New York" && fileHours >= 13 && fileHours < 22)
        ) {
          score += 10;
        }
      }

      // Bonus: Prefer trades that don't have images yet
      if (!t.images || t.images.length === 0) {
        score += 5;
      }

      if (score > highestScore) {
        highestScore = score;
        bestTrade = t;
        bestReason = reasons.join(" + ") || (lang === "si" ? "දිනය අනුව ගැලපුණි" : "Date proximity");
      }
    }

    if (!bestTrade || highestScore < 10) {
      bestTrade = sortedTrades[0];
      highestScore = 10;
      bestReason = lang === "si" ? "නවතම Trade එක (පහසුවෙන් මාරු කළ හැක)" : "Latest trade (can be changed)";
    }

    return { trade: bestTrade, score: highestScore, reason: bestReason };
  };

  const handleFiles = (filesList: FileList | File[]) => {
    const rawFiles = Array.from(filesList).filter(f => f.type.startsWith("image/"));
    if (rawFiles.length === 0) return;

    const newItems: MatchedItem[] = rawFiles.map(file => {
      const { trade, score, reason } = findBestTradeMatch(file);
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        matchedTradeId: trade ? trade.id : sortedTrades[0]?.id || "",
        matchScore: score,
        matchReason: reason
      };
    });

    setItems(prev => [...prev, ...newItems]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateMatchedTrade = (itemId: string, tradeId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          matchedTradeId: tradeId,
          matchScore: 100,
          matchReason: lang === "si" ? "ඔබ විසින් තෝරාගන්නා ලදී (Manual selection)" : "Manually selected"
        };
      }
      return item;
    }));
    setActiveDropdownIndex(null);
  };

  const handleApplyAll = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    try {
      const updates: { tradeId: string; imageUrl: string }[] = [];

      for (const item of items) {
        // Upload image to server via /api/upload
        let finalUrl = item.previewUrl;
        try {
          const formData = new FormData();
          formData.append("file", item.file);
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.url) finalUrl = data.url;
          }
        } catch {
          // If upload api fails, fallback to local object URL or compressed image
        }

        updates.push({
          tradeId: item.matchedTradeId,
          imageUrl: finalUrl
        });
      }

      onApplyMatches(updates);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setItems([]);
        onClose();
      }, 1200);
    } catch (e) {
      console.error("Failed to link images", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <ImagePlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] truncate">
                {lang === "si" ? "Chart Screenshots අදාළ Trade වලට Auto-Link කිරීම" : "Auto-Link Chart Screenshots to Trades"}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] truncate">
                {lang === "si"
                  ? "Screenshots එකවර drop කර අදාළ Trades සමඟ ස්වයංක්‍රීයව match කරගන්න"
                  : "Drop chart screenshots to automatically match and attach to your trades"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center p-1 bg-[var(--accent)] rounded-2xl border border-[var(--border)] text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  lang === "en" 
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm font-extrabold" 
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("si")}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  lang === "si" 
                    ? "bg-indigo-500 text-white shadow-sm font-extrabold" 
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                සිංහල
              </button>
            </div>

            <button 
              onClick={onClose}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-2 rounded-xl transition-colors hover:bg-[var(--accent)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Dropzone */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/60 dark:bg-slate-900/40 hover:bg-indigo-500/5 flex flex-col items-center justify-center space-y-2"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              multiple 
              className="hidden" 
            />
            <div className="w-12 h-12 rounded-2xl bg-[var(--card)] flex items-center justify-center border border-[var(--border)] text-indigo-500 shadow-sm">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">
                {lang === "si" 
                  ? "Chart Screenshots (එකක් හෝ කිහිපයක්) මෙතැනට Drag & Drop කරන්න" 
                  : "Click to select or drag & drop multiple chart screenshots"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {lang === "si"
                  ? "ගොනුවේ නම, දිනය හෝ වේලාව අනුව අදාළ Trade එක ස්වයංක්‍රීයව හඳුනාගනී"
                  : "Matches by filename, date, session time, or symbol automatically"}
              </p>
            </div>
          </div>

          {/* Matched Items List */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>{items.length} {lang === "si" ? "Screenshots හඳුනාගන්නා ලදී" : "Screenshots ready to match"}</span>
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {lang === "si" ? "කැමති නම් Trade එක වෙනස් කරන්න" : "You can change matched trade below"}
                </span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const matchedTrade = sortedTrades.find(t => t.id === item.matchedTradeId) || sortedTrades[0];
                  const isDropdownOpen = activeDropdownIndex === idx;

                  return (
                    <div 
                      key={item.id} 
                      className="p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      {/* Left: Thumbnail & Filename */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-14 h-12 rounded-xl overflow-hidden border border-[var(--border)] bg-slate-900 shrink-0 relative group cursor-pointer"
                          onClick={() => setPreviewModalImg(item.previewUrl)}
                        >
                          <img src={item.previewUrl} alt="chart" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--foreground)] truncate max-w-[200px]" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>{item.matchReason}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Matched Trade Selector & Remove Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveDropdownIndex(isDropdownOpen ? null : idx)}
                            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-indigo-500 text-xs font-semibold text-[var(--foreground)] transition-colors min-w-[200px]"
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${matchedTrade?.direction === "Long" ? "bg-emerald-500" : "bg-rose-500"}`} />
                              <strong className="text-[var(--foreground)]">{matchedTrade?.symbol}</strong>
                              <span className="text-[var(--muted-foreground)] font-mono text-[11px]">({matchedTrade?.date})</span>
                              <span className={`font-mono text-[11px] ${matchedTrade && matchedTrade.netPnL >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                {matchedTrade && matchedTrade.netPnL >= 0 ? `+$${matchedTrade.netPnL}` : `-$${Math.abs(matchedTrade?.netPnL || 0)}`}
                              </span>
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
                          </button>

                          {/* Dropdown to change trade */}
                          {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 w-72 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl shadow-black/20 z-50 p-1.5 max-h-56 overflow-y-auto flex flex-col gap-1">
                              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] border-b border-[var(--border)]">
                                {lang === "si" ? "Trade එක තෝරන්න" : "Select Trade to Attach"}
                              </div>
                              {sortedTrades.map(t => {
                                const isSelected = t.id === item.matchedTradeId;
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleUpdateMatchedTrade(item.id, t.id)}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                                      isSelected ? "bg-indigo-500 text-white font-bold" : "hover:bg-[var(--accent)] text-[var(--foreground)]"
                                    }`}
                                  >
                                    <div className="truncate">
                                      <div className="font-semibold">{t.symbol} • {t.direction}</div>
                                      <div className={`text-[10px] ${isSelected ? "text-white/80" : "text-[var(--muted-foreground)]"}`}>
                                        {t.date} | {t.ticket || `#${t.id.slice(0, 5)}`}
                                      </div>
                                    </div>
                                    <span className={`font-mono font-bold text-xs ${isSelected ? "text-white" : t.netPnL >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                      {t.netPnL >= 0 ? `+$${t.netPnL}` : `-$${Math.abs(t.netPnL)}`}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                          title="Remove this image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--accent)]/20 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {lang === "si" ? "අවලංගු කරන්න" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleApplyAll}
            disabled={items.length === 0 || isProcessing || isSuccess}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              items.length > 0 && !isProcessing && !isSuccess
                ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer"
                : isSuccess
                ? "bg-emerald-500 text-white cursor-default"
                : "bg-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed opacity-60"
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 animate-bounce" />
                <span>{lang === "si" ? "සාර්ථකව Trades වලට Link විය!" : "Linked Successfully!"}</span>
              </>
            ) : isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === "si" ? "Upload වෙමින් පවතී..." : "Uploading & Linking..."}</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                <span>
                  {lang === "si" 
                    ? `Screenshots ${items.length} ම Trades වලට Link කරන්න` 
                    : `Link ${items.length} Screenshots to Trades`}
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Image Preview Lightbox */}
      {previewModalImg && (
        <ImageViewerModal
          src={previewModalImg}
          onClose={() => setPreviewModalImg(null)}
        />
      )}
    </div>
  );
}
