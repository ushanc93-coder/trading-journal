"use client";

import { useState, useEffect, useRef } from "react";
import { useSettingsContext } from "@/lib/SettingsContext";
import { useTradesContext } from "@/lib/TradesContext";
import { 
  Wallet, RefreshCw, CheckCircle2, ChevronDown, 
  ExternalLink, ArrowDownRight, ArrowUpRight, Sparkles, Check, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DetectedStatementData {
  fileName: string;
  filePath: string;
  mtime: string;
  detectedBalance?: number;
  tradesCount: number;
  latestTrade?: {
    symbol?: string;
    netPnL?: number;
    balance?: number;
    date?: string;
  } | null;
}

export default function BalanceWidget() {
  const { accounts, activeAccountId, updateAccount, isLoaded } = useSettingsContext();
  const { trades } = useTradesContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [statementData, setStatementData] = useState<DetectedStatementData | null>(null);
  const [manualInput, setManualInput] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoSyncedOnce, setAutoSyncedOnce] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  // Fetch statement detection from backend API
  const scanStatement = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/ctrader/detect");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.found) {
          setStatementData({
            fileName: data.fileName,
            filePath: data.filePath,
            mtime: data.mtime,
            detectedBalance: data.detectedBalance,
            tradesCount: data.tradesCount,
            latestTrade: data.latestTrade
          });

          // Auto-sync if active account balance is stale default $72 or $10000
          if (
            typeof data.detectedBalance === "number" && 
            activeAccount && 
            activeAccountId && 
            (activeAccount.balance === 72 || activeAccount.balance === 10000 || !autoSyncedOnce)
          ) {
            if (Math.abs(activeAccount.balance - data.detectedBalance) > 0.001) {
              updateAccount(activeAccountId, { balance: data.detectedBalance });
              setAutoSyncedOnce(true);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to scan cTrader statement:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Run scan on mount and when trade events fire
  useEffect(() => {
    if (isLoaded) {
      scanStatement();
    }

    const handleUploadEvent = () => scanStatement();
    window.addEventListener("ctrader_statement_uploaded", handleUploadEvent);
    window.addEventListener("trades_updated", handleUploadEvent);

    return () => {
      window.removeEventListener("ctrader_statement_uploaded", handleUploadEvent);
      window.removeEventListener("trades_updated", handleUploadEvent);
    };
  }, [isLoaded, activeAccountId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isLoaded || !activeAccount) return null;

  // Determine latest statement balance
  const detectedBal = statementData?.detectedBalance;
  const isOutOfSync = typeof detectedBal === "number" && Math.abs(detectedBal - activeAccount.balance) >= 0.01;

  const handleSyncBalance = (targetBal: number) => {
    if (!activeAccountId) return;
    updateAccount(activeAccountId, { balance: targetBal });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 1800);
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(manualInput);
    if (!isNaN(parsed) && activeAccountId) {
      updateAccount(activeAccountId, { balance: Math.round(parsed * 100) / 100 });
      setManualInput("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1800);
    }
  };

  const formattedBalance = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(activeAccount.balance);

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Interactive Balance Pill */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && !statementData) scanStatement();
        }}
        className="flex items-center text-xs font-medium glass-pill px-3 py-1.5 rounded-full hover:border-emerald-500/50 hover:bg-[var(--accent)]/50 transition-all cursor-pointer shadow-xs group"
        title="Account balance (cTrader Statement). Click to view & sync."
      >
        <span className="text-[var(--muted-foreground)] mr-1.5 text-[10px] font-semibold uppercase tracking-wider group-hover:text-[var(--foreground)] transition-colors">
          Balance:
        </span>
        <span className="text-[var(--win)] font-semibold tracking-tight tabular-nums">
          {formattedBalance}
        </span>

        {isOutOfSync ? (
          <span className="ml-2 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 font-bold" title={`cTrader statement has $${detectedBal?.toFixed(2)}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>Sync</span>
          </span>
        ) : (
          <span className="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-500" title="Balance in sync with cTrader" />
        )}

        <ChevronDown className={`w-3.5 h-3.5 ml-1.5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover / Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 sm:left-0 mt-2 w-[330px] sm:w-[360px] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-3.5 text-[var(--foreground)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Account Balance</h4>
                  <p className="text-[11px] text-[var(--muted-foreground)]">{activeAccount.name}</p>
                </div>
              </div>

              <button
                onClick={scanStatement}
                disabled={isScanning}
                title="Scan Downloads folder for latest statement"
                className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-emerald-500" : ""}`} />
              </button>
            </div>

            {/* Current Active Balance Display */}
            <div className="p-3 rounded-xl bg-[var(--accent)]/30 border border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block">Display Balance</span>
                <span className="text-lg font-black text-[var(--win)]">{formattedBalance}</span>
              </div>
              {saveSuccess && (
                <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" /> Updated!
                </span>
              )}
            </div>

            {/* Detected cTrader Statement Section */}
            {statementData ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 fill-emerald-500" />
                      cTrader Statement Found
                    </span>
                    <p className="text-xs font-bold truncate text-[var(--foreground)]" title={statementData.fileName}>
                      {statementData.fileName}
                    </p>
                  </div>
                  {typeof statementData.detectedBalance === "number" && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block">Ending Balance</span>
                      <span className="text-sm font-black text-emerald-500">
                        ${statementData.detectedBalance.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {statementData.latestTrade && (
                  <div className="text-[11px] text-[var(--muted-foreground)] bg-[var(--card)]/80 p-2 rounded-lg border border-[var(--border)] flex items-center justify-between font-mono">
                    <span>Trade #{statementData.tradesCount} • {statementData.latestTrade.symbol}</span>
                    <span className={Number(statementData.latestTrade.netPnL || 0) >= 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                      {Number(statementData.latestTrade.netPnL || 0) >= 0 ? "+" : ""}${Number(statementData.latestTrade.netPnL || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Sync Action Button */}
                {typeof statementData.detectedBalance === "number" && (
                  <div className="pt-1">
                    {isOutOfSync ? (
                      <button
                        onClick={() => handleSyncBalance(statementData.detectedBalance!)}
                        className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Sync Balance to Statement (${statementData.detectedBalance.toFixed(2)})</span>
                      </button>
                    ) : (
                      <div className="text-center py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In sync with cTrader (${statementData.detectedBalance.toFixed(2)})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] text-center text-xs text-[var(--muted-foreground)] space-y-1">
                <p>No cTrader statements detected yet in Downloads folder.</p>
                <p className="text-[11px]">Upload an XLSX or CSV report to sync automatically.</p>
              </div>
            )}

            {/* Manual Edit Form */}
            <form onSubmit={handleManualSave} className="pt-2 border-t border-[var(--border)] space-y-2">
              <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block">
                Manual Balance Adjustment ($)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder={activeAccount.balance.toFixed(2)}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!manualInput}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    manualInput
                      ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 cursor-pointer"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed opacity-50"
                  }`}
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
