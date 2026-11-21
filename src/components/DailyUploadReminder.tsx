"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Upload, CheckCircle2, X, ShieldAlert, Sparkles, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImportCtraderModal from "./ImportCtraderModal";
import { useTradesContext } from "@/lib/TradesContext";
import { useJournal } from "@/lib/useJournal";
import { useSettingsContext } from "@/lib/SettingsContext";
import { evaluateTradesAndJournal } from "@/lib/journalRuleEvaluator";

export default function DailyUploadReminder() {
  const [mounted, setMounted] = useState(false);
  const [hasUploadedToday, setHasUploadedToday] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const { trades, addMultipleTrades } = useTradesContext();
  const { addMultipleEntries } = useJournal();
  const { activeAccountId, updateAccount } = useSettingsContext();

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const checkUploadStatus = () => {
    try {
      const today = getTodayStr();
      const lastUpload = localStorage.getItem("last_ctrader_upload_date");
      // Check if user has uploaded today OR has marked "no trades today"
      const isUploaded = lastUpload === today;
      setHasUploadedToday(isUploaded);
      return isUploaded;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    setMounted(true);
    checkUploadStatus();

    const handleStatementUploaded = () => {
      setHasUploadedToday(true);
      setIsWarningModalOpen(false);
    };

    window.addEventListener("ctrader_statement_uploaded", handleStatementUploaded);

    return () => {
      window.removeEventListener("ctrader_statement_uploaded", handleStatementUploaded);
    };
  }, []);

  const handleMarkNoTrades = () => {
    const today = getTodayStr();
    localStorage.setItem("last_ctrader_upload_date", today);
    setHasUploadedToday(true);
    setIsWarningModalOpen(false);
  };

  return (
    <>
      {/* Topbar/Global Status Pill & Warning Trigger */}
      <div className="flex items-center gap-1.5">
        {!hasUploadedToday ? (
          <button
            onClick={() => setIsWarningModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer border bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse hover:animate-none"
            title="අද දවසේ cTrader Report එක upload කරලා නැත - Click to Upload"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="hidden sm:inline">Upload Today&apos;s Report</span>
            <span className="sm:hidden">Upload Report</span>
          </button>
        ) : (
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
            title="අද දවසේ Statement එක සාර්ථකව Upload කර ඇත"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Today Synced</span>
          </div>
        )}
      </div>

      {/* Warning Modal before closing / ending day */}
      {mounted && createPortal(
        <AnimatePresence>
          {isWarningModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--card)] border border-[var(--border)] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--foreground)]">
                      අද දවසේ Report එක Upload කළාද?
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Upload Today&apos;s cTrader Statement
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-xs leading-relaxed space-y-2">
                  <p>
                    <strong>අවවාදයයි:</strong> අද දවසේ cTrader statement (.xlsx) එක තවමත් journal එකට ඇතුළත් කර නොමැත.
                  </p>
                  <p className="text-[11px] opacity-90">
                    ඔබේ <strong>Account Balance</strong> එක සහ <strong>Daily Journal</strong> එක 100% නිවැරදිව තබා ගැනීමට අද දවසේ statement එක upload කර පිටවන්න.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsWarningModalOpen(false);
                      setIsImportModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Statement (.xlsx) Now</span>
                  </button>

                  <button
                    onClick={handleMarkNoTrades}
                    className="w-full py-2 px-4 bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-2xl text-xs font-semibold transition-all cursor-pointer text-center"
                  >
                    අද Trade කළේ නැත / I didn&apos;t trade today
                  </button>

                  <button
                    onClick={() => setIsWarningModalOpen(false)}
                    className="w-full py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-center"
                  >
                    පසුව කරන්න (Dismiss)
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Import Modal */}
      <ImportCtraderModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingTrades={trades}
        onImport={(newTrades, detectedBalance) => {
          if (newTrades.length > 0) {
            const { evaluatedTrades, journalEntries } = evaluateTradesAndJournal(newTrades, detectedBalance || 72);
            addMultipleTrades(evaluatedTrades as any);
            addMultipleEntries(journalEntries);
          }
          if (detectedBalance !== undefined && activeAccountId) {
            updateAccount(activeAccountId, { balance: detectedBalance });
          }
          setHasUploadedToday(true);
        }}
      />
    </>
  );
}
