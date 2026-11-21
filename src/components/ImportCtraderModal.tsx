"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { parseCtraderFile } from "@/lib/parseCtraderFile";
import { Trade } from "@/lib/mock-data";
import { processStatementSync, isExactTradeDuplicate } from "@/lib/tradeSyncEngine";
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, 
  ArrowUpRight, ArrowDownRight, Info, ShieldCheck, Sparkles, Globe,
  ChevronDown, ChevronUp, Download, RefreshCw, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImportCtraderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (trades: Omit<Trade, "id">[], detectedBalance?: number) => void;
  existingTrades?: Trade[];
}

export default function ImportCtraderModal({ 
  isOpen, 
  onClose, 
  onImport, 
  existingTrades = [] 
}: ImportCtraderModalProps) {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"en" | "si">("si");
  const [parsedTrades, setParsedTrades] = useState<Omit<Trade, "id">[]>([]);
  const [detectedBalance, setDetectedBalance] = useState<number | undefined>(undefined);
  const [fileName, setFileName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [autoDetectedFile, setAutoDetectedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if an auto-detected statement is available in Downloads
  useEffect(() => {
    if (isOpen) {
      fetch("/api/ctrader/detect")
        .then(res => res.json())
        .then(data => {
          if (data.found && data.fileName) {
            setAutoDetectedFile(data.fileName);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Process parsed trades with the intelligent statement sync engine
  const syncResult = useMemo(() => {
    return processStatementSync(parsedTrades, existingTrades);
  }, [parsedTrades, existingTrades]);

  const { syncedMatches, brandNewTrades, duplicateCount } = syncResult;

  // Non-duplicate trades to be imported (both brand new and synced updates)
  const nonDuplicateTrades = useMemo(() => {
    return parsedTrades.filter(incoming => !existingTrades.some(ext => isExactTradeDuplicate(incoming, ext)));
  }, [parsedTrades, existingTrades]);

  // Backward compatibility alias
  const newTrades = nonDuplicateTrades;

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file: File) => {
    setErrorMsg("");
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const { trades, detectedBalance: bal } = parseCtraderFile(buffer);
      setDetectedBalance(bal);
      if (trades.length === 0) {
        setErrorMsg(
          lang === "si" 
            ? "මෙම ගොනුවේ වලංගු Trade කිසිවක් හමු නොවීය. කරුණාකර එය cTrader History Statement එකක් දැයි පරීක්ෂා කරන්න." 
            : "No valid trades found in this file. Please ensure it is a cTrader History Statement (.xlsx, .html, or .csv)."
        );
        setParsedTrades([]);
      } else {
        setParsedTrades(trades);
      }
    } catch (err: any) {
      setErrorMsg(
        lang === "si"
          ? "ගොනුව කියවීමේදී දෝෂයක් ඇති විය: " + (err.message || "Unknown error")
          : "Failed to parse file: " + (err.message || "Unknown error")
      );
      setParsedTrades([]);
      setDetectedBalance(undefined);
    }
  };

  const handleAutoDetectClick = async () => {
    setIsAutoDetecting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/ctrader/detect");
      const data = await res.json();
      if (data.found && data.trades) {
        setFileName(data.fileName);
        setDetectedBalance(data.detectedBalance);
        setParsedTrades(data.trades);
      } else {
        setErrorMsg(
          lang === "si"
            ? "Downloads ෆෝල්ඩරයේ cTrader statement එකක් හමු නොවීය. කරුණාකර cTrader එකෙන් Statement එක Export කරන්න."
            : "No cTrader statements found in Downloads folder. Please export from cTrader."
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Auto-detect failed");
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirmImport = () => {
    if (newTrades.length === 0 && detectedBalance === undefined) return;
    onImport(newTrades, detectedBalance);
    // Mark today as uploaded in localStorage & notify listeners
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      localStorage.setItem("last_ctrader_upload_date", todayStr);
      window.dispatchEvent(new Event("ctrader_statement_uploaded"));
    } catch (e) {}

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setParsedTrades([]);
      setDetectedBalance(undefined);
      setFileName("");
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto"
      >
        {/* Header - Pinned, Always 100% visible */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between gap-3 shrink-0 bg-[var(--card)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] truncate">
                {lang === "si" ? "cTrader Statement Import කරන්න" : "Import cTrader Statement"}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] truncate">
                {lang === "si" 
                  ? "cTrader XLSX statements Journal එකට ඇතුළත් කිරීම සහ Balance Sync කිරීම" 
                  : "Sync trades and account balance with duplicate protection"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center p-0.5 bg-[var(--accent)] rounded-2xl border border-[var(--border)] text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang("si")}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  lang === "si" 
                    ? "bg-emerald-500 text-white shadow-sm font-extrabold" 
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                සිංහල
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  lang === "en" 
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm font-extrabold" 
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                EN
              </button>
            </div>

            <button 
              onClick={onClose}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-2 rounded-xl transition-colors hover:bg-[var(--accent)] cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* 1-Click Auto-Detect Banner if Statement Detected in Downloads */}
          {autoDetectedFile && parsedTrades.length === 0 && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--foreground)] truncate">
                    {lang === "si" ? "Downloads හි නවතම Statement එක හමුවිය!" : "Detected cTrader Statement in Downloads!"}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--muted-foreground)] truncate">
                    {autoDetectedFile}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAutoDetectClick}
                disabled={isAutoDetecting}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                {isAutoDetecting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{lang === "si" ? "කෙලින්ම Load කරන්න" : "Auto-Load"}</span>
              </button>
            </div>
          )}

          {/* Collapsible 4-Step Instructions Banner */}
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 text-xs overflow-hidden">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full p-3 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {lang === "si" 
                    ? "cTrader එකෙන් Statement Export කරන ආකාරය (පියවර 4)" 
                    : "How to export your statement from cTrader (4 steps)"}
                </span>
              </div>
              {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showInstructions && (
              <div className="p-3 pt-0 border-t border-slate-200 dark:border-slate-800 space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                {lang === "si" ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <span>cTrader තිරයේ පහළින් ඇති <strong>History</strong> ටැබ් එක click කරන්න.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <span>දකුණු කෙළවරේ උඩ ඇති කොළ පැහැති <strong>Statement ▼</strong> බටන් එක ඔබන්න.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                      <span>එහි ඇති <strong>Export to XLSX</strong> තෝරා Save කරගන්න.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                      <span>Download වූ <strong>.xlsx</strong> ගොනුව පහත කොටුවට Drag & Drop කරන්න!</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <span>Go to the <strong>History</strong> tab at the bottom of cTrader.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <span>Click the green <strong>Statement ▼</strong> button on the top right.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                      <span>Select <strong>Export to XLSX</strong> and save the file.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                      <span>Drag & drop the downloaded <strong>.xlsx</strong> file into the box below!</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Upload Drop Area */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/60 dark:bg-slate-900/40 hover:bg-emerald-500/5 flex flex-col items-center justify-center space-y-2.5"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".xlsx,.xls,.csv,.html" 
              className="hidden" 
            />
            <div className="w-12 h-12 rounded-2xl bg-[var(--card)] flex items-center justify-center border border-[var(--border)] text-emerald-500 shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">
                {fileName ? fileName : (lang === "si" ? "cTrader XLSX ගොනුව මෙතැනට Drop කරන්න (හෝ Click කර තෝරන්න)" : "Click to select or drop your cTrader XLSX / CSV here")}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {lang === "si"
                  ? "cTrader එකෙන් බාගත කළ .xlsx Statement ගොනුව කෙලින්ම කියවනු ලැබේ"
                  : "Directly parses .xlsx statements exported from cTrader"}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2.5 font-medium shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Trades Preview & Duplicate Shield Status */}
          {parsedTrades.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {syncedMatches.length > 0 ? (
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 shadow-xs">
                      <Zap className="w-3.5 h-3.5 fill-indigo-500" />
                      <span>{syncedMatches.length} {lang === "si" ? "Playbook Synced" : "Synced with Plan"}</span>
                    </span>
                  ) : null}

                  {brandNewTrades.length > 0 ? (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{brandNewTrades.length} {lang === "si" ? "අලුත් Trades" : "New Trades"}</span>
                    </span>
                  ) : null}

                  {duplicateCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{duplicateCount} {lang === "si" ? "Duplicates Skipped" : "Duplicates Skipped"}</span>
                    </span>
                  ) : null}
                </div>

                <span className="text-xs text-[var(--muted-foreground)] font-mono">
                  {lang === "si" ? "මුළු ගණන" : "Total in file"}: {parsedTrades.length}
                </span>
              </div>

              {/* Glowing Auto-Sync with Pre-Trade Plan Banner */}
              {syncedMatches.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-950 dark:text-indigo-200 text-xs space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
                      <Zap className="w-4 h-4 fill-indigo-500" />
                      <span>
                        {lang === "si" 
                          ? `${syncedMatches.length} Pre-Trade Plan(s) ස්වයංක්‍රීයව Auto-Sync වේ!` 
                          : `${syncedMatches.length} Pre-Trade Plan(s) Auto-Syncing!`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                      100 Marks Preserved 🎯
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {syncedMatches.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-mono bg-[var(--card)]/90 p-2.5 rounded-xl border border-indigo-500/20 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            m.direction === "Long" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                          }`}>
                            {m.direction}
                          </span>
                          <span className="font-bold text-[var(--foreground)]">{m.symbol}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                            {m.marks} Marks Playbook
                          </span>
                        </div>
                        <span className={`font-black ${m.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          Realized: {m.pnl >= 0 ? `+$${m.pnl.toFixed(2)}` : `-$${Math.abs(m.pnl).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Statement Balance Card */}
              {detectedBalance !== undefined && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      $
                    </div>
                    <div>
                      <p className="text-xs font-bold">
                        {lang === "si" ? "cTrader Statement Ending Balance" : "Statement Ending Account Balance"}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        {lang === "si" ? "ගිණුමේ Balance එක ස්වයංක්‍රීයව මෙම අගයට update වේ" : "Account balance will automatically sync to this value"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                      ${detectedBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Duplicate Notice when all are duplicates */}
              {newTrades.length === 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  <span>
                    {lang === "si"
                      ? `මෙම Statement එකේ ඇති සියලුම Trade (${parsedTrades.length}) දැනටමත් ඔබේ Journal එකෙහි සම්පූර්ණයෙන්ම සටහන්ව ඇත. කිසිදු trade එකක් අතපසු වී නොමැත.`
                      : `All ${parsedTrades.length} trades in this statement are already recorded in your journal.`}
                  </span>
                </div>
              )}

              {/* Trade list preview */}
              {newTrades.length > 0 && (
                <div className="max-h-44 overflow-y-auto space-y-1.5 border border-[var(--border)] rounded-2xl p-2 bg-[var(--background)]/60 text-xs">
                  {newTrades.slice(0, 10).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[var(--card)] border border-[var(--border)]/50 font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.direction === "Long" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                        }`}>
                          {t.direction}
                        </span>
                        <span className="font-bold text-[var(--foreground)]">{t.symbol}</span>
                        <span className="text-[var(--muted-foreground)] text-[11px]">{t.lotSize}L</span>
                        <span className="text-[var(--muted-foreground)] text-[10px] hidden sm:inline">{t.ticket}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[var(--muted-foreground)]">{t.date}</span>
                        <span className={`font-bold ${t.netPnL >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {t.netPnL >= 0 ? `+$${t.netPnL.toFixed(2)}` : `-$${Math.abs(t.netPnL).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Pinned, Always 100% visible */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
          >
            {lang === "si" ? "අවලංගු කරන්න (Cancel)" : "Cancel"}
          </button>

          {(() => {
            // Case 1: Success animation
            if (isSuccess) {
              return (
                <button
                  disabled
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white flex items-center gap-1.5 cursor-default shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  <span>{lang === "si" ? "සාර්ථකව Import විය!" : "Imported Successfully!"}</span>
                </button>
              );
            }

            // Case 2: No file uploaded yet
            if (parsedTrades.length === 0) {
              return (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{lang === "si" ? "ගොනුවක් තෝරන්න (.xlsx)" : "Select .xlsx File"}</span>
                </button>
              );
            }

            // Case 3: Fresh new trades or pre-trade plans to sync
            if (newTrades.length > 0) {
              const hasSync = syncedMatches.length > 0;
              return (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                    hasSync 
                      ? "bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 shadow-indigo-500/25" 
                      : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                  }`}
                >
                  {hasSync ? <Zap className="w-4 h-4 fill-white" /> : <Sparkles className="w-4 h-4" />}
                  <span>
                    {lang === "si"
                      ? `${hasSync ? `Playbook (${syncedMatches.length}) Sync & ` : ""}Trades (${newTrades.length}) Import කරන්න`
                      : `${hasSync ? `Auto-Sync Plan (${syncedMatches.length}) & ` : ""}Import (${newTrades.length}) Trades`}
                  </span>
                </button>
              );
            }

            // Case 4: All trades are duplicates, but balance can be synced
            if (detectedBalance !== undefined) {
              return (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {lang === "si"
                      ? `Balance එක $${detectedBalance.toFixed(2)} ට Sync කරන්න`
                      : `Sync Balance to $${detectedBalance.toFixed(2)}`}
                  </span>
                </button>
              );
            }

            // Case 5: All trades in file already exist & balance already matches
            return (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{lang === "si" ? "සියලු Trades දැනටමත් ඇත (Done)" : "All Trades Already Imported"}</span>
              </button>
            );
          })()}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
