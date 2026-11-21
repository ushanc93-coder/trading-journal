"use client";

import { X, Calendar, Target, DollarSign, Brain, FileText, Activity, Image as ImageIcon, Sparkles, BookOpen, CheckCircle2, XCircle, Camera, Loader2, PlaySquare, TrendingUp, TrendingDown, Check, Zap } from "lucide-react";
import { Trade } from "@/lib/mock-data";
import { useSettingsContext } from "@/lib/SettingsContext";
import { useConfirm } from "@/lib/ConfirmContext";
import ReactMarkdown from "react-markdown";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import Script from "next/script";
import { useJournal } from "@/lib/useJournal";
import { useTradesContext } from "@/lib/TradesContext";
import { ImageViewerModal } from "./ImageViewerModal";

interface ViewTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
}

export default function ViewTradeModal({ isOpen, onClose, trade }: ViewTradeModalProps) {
  const { preferences } = useSettingsContext();
  const { alert } = useConfirm();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aiReview, setAiReview] = useState<string | null>(trade?.aiReview || null);
  const { entries } = useJournal();
  const { updateTrade } = useTradesContext();
  
  const journalEntry = trade ? entries.find(e => e.date === trade.date && e.pair === trade.symbol) : null;
  
  useEffect(() => {
    if (trade) {
      setAiReview(trade.aiReview || null);
    }
  }, [trade]);
  // Sync initial state when trade changes

  const handleSaveImage = async () => {
    try {
      // @ts-ignore
      if (!window.htmlToImage) {
        await alert({ message: "Image saving library is still loading. Please try again in a few seconds." });
        return;
      }

      setIsExporting(true);
      
      // Wait for React to render the full height without scrollbars
      setTimeout(async () => {
        const element = document.getElementById("trade-modal-content");
        if (!element) return;
        
        try {
          const bgColor = window.getComputedStyle(element).getPropertyValue('background-color');
          // @ts-ignore
          const dataUrl = await window.htmlToImage.toPng(element, {
            backgroundColor: bgColor,
            pixelRatio: 2,
            style: {
              borderRadius: '16px' // force rounded corners in capture
            }
          });
          
          const link = document.createElement("a");
          link.download = trade ? `trade-${trade.symbol}-${trade.date}.png` : `trade.png`;
          link.href = dataUrl;
          link.click();
        } catch(e) {
          console.error(e);
          alert({ message: "Failed to save image.", danger: true });
        } finally {
          setIsExporting(false);
        }
      }, 300); // 300ms delay to allow DOM/styles to settle
    } catch (e) {
      console.error(e);
      await alert({ message: "Failed to initialize save.", danger: true });
      setIsExporting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!trade) return;
    const apiKey = preferences.geminiApiKey;
    
    if (!apiKey) {
      await alert({ message: "Please enter your Gemini API Key in Settings to use the AI Coach.", danger: true });
      return;
    }

    setIsAnalyzing(true);
    setAiReview(null);

    let base64Image = null;
    let mimeType = "image/png";
    if (trade.images && trade.images.length > 0) {
      const imgData = trade.images[0];
      const mimeMatch = imgData.match(/^data:(image\/[^;]+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
        base64Image = imgData.split(',')[1];
      } else if (imgData.startsWith('http')) {
        // If it's a remote URL, we can't easily pass it as base64 without fetching it.
        // For local testing it's usually data URI.
      }
    }

    let brokenRules: string[] = [];
    if (!trade.rulesFollowed) brokenRules.push("Entry Rules");
    if (journalEntry) {
      if (!journalEntry.maxRisk) brokenRules.push("Max 0.5% Risk");
      if (!journalEntry.maxTp) brokenRules.push(`Max 2R TP (Got ${trade.rMultiple}R)`);
      if (!journalEntry.max2Trades) brokenRules.push("Max 2 Trades per Day");
      if (!journalEntry.maxProfit) brokenRules.push("Max 2% Profit per Day");
    }

    const tradeContext = `
Trade Details:
- Pair: ${trade.symbol}
- Direction: ${trade.direction}
- Entry: ${trade.entryPrice}, Stop Loss: ${trade.sl}, Take Profit: ${trade.tp}
- Result: ${trade.netPnL} (R-Multiple: ${trade.rMultiple})
- Emotion: ${trade.emotion}
- Mistake: ${trade.mistake}
- Strategy: ${trade.strategy}
- Broken Rules: ${brokenRules.length > 0 ? brokenRules.join(', ') : 'None, perfectly disciplined.'}
- User Notes: ${trade.notes}
- Patterns Identified: ${trade.patterns?.join(', ') || 'None'}
    `;

    const promptText = `Act as a strict but highly experienced, elite trading mentor. I am your student. I just took a trade and want your feedback.

Here is the trade data:
${tradeContext}

Please review this trade. 
If an image is provided, analyze the chart (entry, stop loss placement, take profit, market structure, etc.) and tell me if my technicals made sense.
If no image is provided, focus entirely on the psychological and statistical data provided.

Structure your response with Markdown using these exact headings:
### Technical Analysis
(Your thoughts on the technical setup, chart patterns, or risk parameters)
### Psychological Review
(Tear down my emotion, mistake, and rule-following behavior)
### Actionable Advice
(What I must do tomorrow to improve)

Keep it concise, direct, and brutally honest but constructive. DO NOT use JSON. Respond only in markdown text.`;

    try {
      const parts: any[] = [{ text: promptText }];
      if (base64Image) {
        parts.push({ inline_data: { mime_type: mimeType, data: base64Image } });
      }

      const candidateModels = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-flash-latest"
      ];

      let aiData: any = null;
      let lastErrMsg = "";

      for (const model of candidateModels) {
        try {
          let retries = 2;
          while (retries > 0) {
            const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts }]
              })
            });

            if (aiRes.ok) {
              const resJson = await aiRes.json();
              if (resJson.candidates?.[0]?.content?.parts?.[0]?.text) {
                aiData = resJson;
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

            const errJson = await aiRes.json().catch(() => null);
            lastErrMsg = errJson?.error?.message || `HTTP ${aiRes.status}`;
            break; // Try next fallback model
          }

          if (aiData) break;
        } catch (fetchErr: any) {
          console.warn(`Model ${model} analysis failed:`, fetchErr);
          lastErrMsg = fetchErr?.message || "";
        }
      }

      if (aiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const reviewText = aiData.candidates[0].content.parts[0].text;
        setAiReview(reviewText);
        updateTrade(trade.id, { ...trade, aiReview: reviewText });
      } else {
        if (lastErrMsg.toLowerCase().includes("quota") || lastErrMsg.toLowerCase().includes("exceeded") || lastErrMsg.includes("429")) {
          setAiReview("⚠️ **AI is busy:** High demand on Google servers. Please try again in a moment.");
        } else {
          setAiReview("⚠️ **AI Feedback Unavailable:** " + (lastErrMsg || "Unable to reach Gemini API. Please verify your API key in Settings."));
        }
      }
    } catch (e: any) {
      console.error(e);
      setAiReview(`?? **Error:** ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen || !trade) return null;

  const isDisciplined = trade.rulesFollowed && 
    (!journalEntry || (journalEntry.max2Trades && journalEntry.maxRisk && journalEntry.maxTp && journalEntry.maxProfit));

  const isWin = trade.netPnL > 0;
  const isLoss = trade.netPnL < 0;

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js" strategy="lazyOnload" />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className={`w-full max-w-3xl flex flex-col items-center ${isExporting ? 'absolute top-0' : ''}`}>
          <div id="trade-modal-content" className={`bg-[var(--card)] w-full rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col ${isExporting ? 'overflow-visible' : 'overflow-hidden max-h-[90vh]'}`}>
        
        {/* Header - Colored based on PnL */}
        <div className={`px-8 py-8 flex flex-col shrink-0 border-b border-[var(--border)] relative overflow-hidden ${
          isWin ? 'bg-[var(--win)]/20' : isLoss ? 'bg-[var(--loss)]/20' : 'bg-[var(--muted)]/30'
        }`}>
          
          {/* Top Row: Badges & Buttons */}
          <div className="flex justify-between items-start relative z-10 mb-2">
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                trade.direction === 'Long' ? 'bg-[var(--win)]/20 text-[var(--win)]' : 'bg-[var(--loss)]/20 text-[var(--loss)]'
              }`}>
                {trade.direction}
              </span>
              <span className="text-[var(--muted-foreground)] text-sm font-medium">{trade.category}</span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handleSaveImage} 
                className="p-2 bg-[var(--card)]/80 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-full transition-colors border border-[var(--border)]"
                title="Save as Image"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button 
                onClick={onClose} 
                className="p-2 bg-[var(--card)]/80 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-full transition-colors border border-[var(--border)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Middle Row: Symbol & PnL perfectly aligned on baseline */}
          <div className="flex justify-between items-baseline relative z-10">
            <h2 className="text-4xl font-black text-[var(--foreground)] tracking-tight">
              {trade.symbol}
            </h2>
            <div className={`text-4xl font-black tracking-tight ${
              isWin ? 'text-[var(--win)]' : isLoss ? 'text-[var(--loss)]' : 'text-[var(--foreground)]'
            }`}>
              {isWin ? '+' : ''}{trade.netPnL === 0 ? 'BE' : `${Math.abs(trade.netPnL).toLocaleString()}`}
            </div>
          </div>
          
          {/* Bottom Row: Date */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[var(--muted-foreground)] text-sm mt-3 font-medium relative z-10">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1.5" />
              {format(new Date(trade.date), 'MMMM d, yyyy')} • {trade.session} Session
            </div>
            {trade.syncedFromStatement ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shadow-xs">
                <Zap className="w-3 h-3 fill-indigo-500" /> Auto-Synced with Statement
              </span>
            ) : (trade.entryPrice === 0 && trade.netPnL === 0) ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-xs">
                ⏳ Pre-Trade Plan (Awaiting Statement Upload)
              </span>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 p-8 space-y-8 ${isExporting ? '' : 'overflow-y-auto'}`}>
          
          {/* Execution Stats */}
          <section>
            <h3 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" /> Execution Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-4 rounded-xl">
                <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-1">Lot Size</div>
                <div className="text-[var(--foreground)] font-mono text-lg">{trade.lotSize}</div>
              </div>
              <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-4 rounded-xl">
                <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-1">Entry Price</div>
                <div className="text-[var(--foreground)] font-mono text-lg">{trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</div>
              </div>
              <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-4 rounded-xl">
                <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-1">Exit Price</div>
                <div className="text-[var(--foreground)] font-mono text-lg">{trade.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</div>
              </div>
              <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-4 rounded-xl">
                <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-1">Risk-Reward</div>
                <div className={`font-mono text-lg font-bold ${trade.rMultiple > 0 ? 'text-[var(--win)]' : trade.rMultiple < 0 ? 'text-[var(--loss)]' : 'text-[var(--muted-foreground)]'}`}>
                  {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple}R
                </div>
              </div>
            </div>
          </section>

          {/* Daily Journal Context */}
          {journalEntry && (
            <section>
              <h3 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-4 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" /> Daily Journal Context
              </h3>
              
              <div className="bg-[var(--card)]/30 border border-[var(--border)]/50 p-5 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-1">Journal Result</div>
                    <div className={`font-bold ${journalEntry.result.includes('Win') ? 'text-[var(--win)]' : 'text-[var(--loss)]'}`}>
                      {journalEntry.result}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-1">Outcome Notes</div>
                    <div className="text-[var(--foreground)] text-sm italic max-w-xs break-words">"{journalEntry.outcome}"</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-[var(--border)]/50">
                  {[
                    { key: "entryRules", label: "Entry Rules" },
                    { key: "max2Trades", label: "Max 2 Trades" },
                    { key: "maxRisk", label: "0.5% Risk" },
                    { key: "maxTp", label: "2R TP" },
                    { key: "maxProfit", label: "2% Profit" }
                  ].map((rule) => {
                    const passed = journalEntry[rule.key as keyof typeof journalEntry] as boolean;
                    return (
                      <div key={rule.key} className={`flex flex-col items-center p-2 rounded-lg border ${passed ? 'bg-[var(--win)]/20 border-[var(--win)]/30' : 'bg-[var(--loss)]/20 border-[var(--loss)]/30'}`}>
                        {passed ? <CheckCircle2 className="w-4 h-4 text-[var(--win)] mb-1" /> : <XCircle className="w-4 h-4 text-[var(--loss)] mb-1" />}
                        <span className={`text-[10px] font-semibold text-center ${passed ? 'text-[var(--win)]' : 'text-[var(--loss)]'}`}>{rule.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Psychology & Strategy */}
          <section>
            <h3 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-4 flex items-center">
              <Brain className="w-4 h-4 mr-2" /> Psychology & Strategy
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-5 rounded-xl flex items-center space-x-4">
                <div className={`p-3 rounded-full ${isDisciplined ? 'bg-[var(--win)]/20 text-[var(--win)]' : 'bg-[var(--loss)]/20 text-[var(--loss)]'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-0.5">Rules Followed?</div>
                  <div className={`font-bold text-lg ${isDisciplined ? 'text-[var(--win)]' : 'text-[var(--loss)]'}`}>
                    {isDisciplined ? 'Yes, disciplined.' : 'No, broke rules.'}
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-[var(--border)]/50 pb-2">
                  <span className="text-[var(--muted-foreground)] text-xs font-semibold uppercase">Emotion</span>
                  <span className="text-[var(--foreground)] text-sm font-medium">{trade.emotion}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[var(--border)]/50 pb-2">
                  <span className="text-[var(--muted-foreground)] text-xs font-semibold uppercase">Mistake</span>
                  <span className={`text-sm font-medium ${trade.mistake === 'None' ? 'text-[var(--win)]' : 'text-amber-400'}`}>{trade.mistake}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted-foreground)] text-xs font-semibold uppercase">Setup</span>
                  <span className="text-[var(--foreground)] text-sm font-medium">{trade.strategy}</span>
                </div>
              </div>
            </div>

            {/* Playbook Confirmations Section with 100-Marks Score */}
            {(trade.confluenceScore !== undefined || (trade.confirmations && trade.confirmations.length > 0)) && (() => {
              const score = trade.confluenceScore !== undefined 
                ? trade.confluenceScore 
                : Math.min(100, (trade.confirmations?.length || 0) * 20);

              const details = trade.playbookDetails;

              return (
                <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-4 rounded-xl mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted-foreground)] text-xs font-semibold uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4F39F6]" />
                      Pre-Trade Confluence Score
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                      score === 100
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : score >= 80
                        ? "bg-[#4F39F6]/15 text-[#4F39F6] border-[#4F39F6]/30"
                        : score >= 60
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : "bg-rose-500/15 text-rose-500 border-rose-500/30"
                    }`}>
                      {score} / 100 Marks {score === 100 ? "• A+ Prime" : score >= 80 ? "• A Setup" : score >= 60 ? "• B Setup" : "• C Setup"}
                    </span>
                  </div>

                  {/* Score Progress Bar */}
                  <div className="w-full bg-[var(--border)]/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        score === 100
                          ? "bg-gradient-to-r from-emerald-500 to-[#10B981]"
                          : score >= 80
                          ? "bg-gradient-to-r from-[#4F39F6] to-indigo-400"
                          : score >= 60
                          ? "bg-gradient-to-r from-amber-500 to-amber-400"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>

                  {/* Breakdown details */}
                  {details ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-1 text-xs">
                      {/* Bias */}
                      <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                        <div className="text-[10px] text-[var(--muted-foreground)] font-semibold flex justify-between">
                          <span>1. Bias Frame</span>
                          <span className={details.biasFrames?.length ? "text-[#10B981] font-bold" : "text-slate-400"}>
                            {details.biasFrames?.length ? "+20" : "0"}
                          </span>
                        </div>
                        <div className="font-bold text-[11px] text-[var(--foreground)] mt-0.5">
                          {details.biasFrames?.length ? details.biasFrames.join(" + ") : "None"}
                        </div>
                      </div>

                      {/* SB */}
                      <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                        <div className="text-[10px] text-[var(--muted-foreground)] font-semibold flex justify-between">
                          <span>2. SB Window</span>
                          <span className={details.sbSession ? "text-[#10B981] font-bold" : "text-slate-400"}>
                            {details.sbSession ? "+20" : "0"}
                          </span>
                        </div>
                        <div className="font-bold text-[11px] text-[var(--foreground)] mt-0.5 truncate">
                          {details.sbSession || "None"}
                        </div>
                      </div>

                      {/* PDA */}
                      <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                        <div className="text-[10px] text-[var(--muted-foreground)] font-semibold flex justify-between">
                          <span>3. PDA Array</span>
                          <span className={details.pdaType ? "text-[#10B981] font-bold" : "text-slate-400"}>
                            {details.pdaType ? "+20" : "0"}
                          </span>
                        </div>
                        <div className="font-bold text-[11px] text-[var(--foreground)] mt-0.5">
                          {details.pdaType || "None"}
                        </div>
                      </div>

                      {/* 1M Entry */}
                      <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                        <div className="text-[10px] text-[var(--muted-foreground)] font-semibold flex justify-between">
                          <span>4. 1M Trigger</span>
                          <span className={details.entry1m ? "text-[#10B981] font-bold" : "text-slate-400"}>
                            {details.entry1m ? "+20" : "0"}
                          </span>
                        </div>
                        <div className="font-bold text-[11px] text-[var(--foreground)] mt-0.5">
                          {details.entry1m || "None"}
                        </div>
                      </div>

                      {/* SMT */}
                      <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                        <div className="text-[10px] text-[var(--muted-foreground)] font-semibold flex justify-between">
                          <span>5. SMT</span>
                          <span className={details.smtType ? "text-[#10B981] font-bold" : "text-slate-400"}>
                            {details.smtType ? "+20" : "0"}
                          </span>
                        </div>
                        <div className="font-bold text-[11px] text-[var(--foreground)] mt-0.5 truncate">
                          {details.smtType || "None"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {trade.confirmations?.map((conf, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          {conf} (+20)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {/* AI Analysis Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-blue-400 uppercase tracking-wider flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-[var(--primary)]" /> AI Trade Review
              </h3>
              {!aiReview && (
                <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-md text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? "Analyzing Trade..." : "Generate AI Review"}
                </button>
              )}
            </div>
            
            {aiReview ? (
              <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-[var(--primary)]/20 p-6 rounded-lg mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-16 bg-[var(--primary)]/5 blur-3xl rounded-full pointer-events-none" />
                <div className="relative z-10 prose dark:prose-invert prose-purple max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{aiReview}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--card)]/30 border border-[var(--border)]/50 p-6 rounded-xl flex items-center justify-center text-center">
                <p className="text-[var(--muted-foreground)] text-sm">Click the button above to generate a personalized psychological review of this trade.</p>
              </div>
            )}
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2" /> Notes
            </h3>
            <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-6 rounded-xl text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
              {trade.notes || <span className="text-[var(--muted-foreground)] italic">No notes provided for this trade.</span>}
            </div>
          </section>

          {/* Reference Images */}
          {trade.images && trade.images.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-4 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" /> Reference Images
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trade.images.map((url, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setPreviewImage(url)}
                    className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] aspect-video cursor-pointer"
                  >
                    <img src={url} alt="Trade Reference" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md transition-all scale-95 group-hover:scale-100">
                        View Fullscreen
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
        </div>
      </div>
      {previewImage && (
        <ImageViewerModal src={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
    </>
  );
}
