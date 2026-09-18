"use client";

import { X, Calendar, Target, DollarSign, Brain, FileText, Activity, Image as ImageIcon, Sparkles, BookOpen, CheckCircle2, XCircle, Camera, Loader2, PlaySquare, TrendingUp, TrendingDown } from "lucide-react";
import { Trade } from "@/lib/mock-data";
import { useSettingsContext } from "@/lib/SettingsContext";
import { useConfirm } from "@/lib/ConfirmContext";
import ReactMarkdown from "react-markdown";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import Script from "next/script";
import { useJournal } from "@/lib/useJournal";
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
  const [aiReview, setAiReview] = useState<string | null>(null);
  const { entries } = useJournal();
  
  const journalEntry = trade ? entries.find(e => e.date === trade.date && e.pair === trade.symbol) : null;

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
          // @ts-ignore
          const dataUrl = await window.htmlToImage.toPng(element, {
            backgroundColor: "#111115",
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
      let retries = 3;
      let aiRes;
      
      const parts: any[] = [{ text: promptText }];
      if (base64Image) {
        parts.push({ inline_data: { mime_type: mimeType, data: base64Image } });
      }

      while (retries > 0) {
        aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }]
          })
        });

        if (aiRes.status === 503 || aiRes.status === 429) {
          retries--;
          if (retries === 0) break;
          await new Promise(r => setTimeout(r, 2000));
        } else {
          break;
        }
      }

      const aiData = await aiRes?.json();

      if (!aiRes?.ok) {
        setAiReview(`**API Error:** ${aiData?.error?.message || "Something went wrong."}`);
      } else if (aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
        setAiReview(aiData.candidates[0].content.parts[0].text);
      } else {
        setAiReview("**Error:** No response generated by AI.");
      }
    } catch (e: any) {
      console.error(e);
      setAiReview(`**Error:** ${e.message}`);
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
        <div className={`px-8 py-6 flex justify-between items-start border-b border-[var(--border)] relative overflow-hidden ${
          isWin ? 'bg-emerald-500/10' : isLoss ? 'bg-rose-500/10' : 'bg-[var(--muted)]/30'
        }`}>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                trade.direction === 'Long' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
              }`}>
                {trade.direction}
              </span>
              <span className="text-[var(--muted-foreground)] text-sm font-medium">{trade.category}</span>
            </div>
            
            <h2 className="text-4xl font-black text-white tracking-tight">
              {trade.symbol}
            </h2>
            
            <div className="flex items-center text-[var(--muted-foreground)] text-sm mt-3 font-medium">
              <Calendar className="w-4 h-4 mr-1.5" />
              {format(new Date(trade.date), 'MMMM d, yyyy')} • {trade.session} Session
            </div>
          </div>
          
          <div className="flex flex-col items-end relative z-10">
            <div className="flex space-x-2 mb-4">
              <button 
                onClick={handleSaveImage} 
                className="p-2 bg-[var(--card)]/80 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-white rounded-full transition-colors border border-[var(--border)]"
                title="Save as Image"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button 
                onClick={onClose} 
                className="p-2 bg-[var(--card)]/80 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-white rounded-full transition-colors border border-[var(--border)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`text-4xl font-black tracking-tight ${
              isWin ? 'text-emerald-500' : isLoss ? 'text-rose-500' : 'text-[var(--foreground)]'
            }`}>
              {isWin ? '+' : ''}{trade.netPnL === 0 ? 'BE' : `$${Math.abs(trade.netPnL).toLocaleString()}`}
            </div>
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
                <div className="text-white font-mono text-lg">{trade.lotSize}</div>
              </div>
              <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-4 rounded-xl">
                <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-1">Entry Price</div>
                <div className="text-white font-mono text-lg">{trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</div>
              </div>
              <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-4 rounded-xl">
                <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-1">Exit Price</div>
                <div className="text-white font-mono text-lg">{trade.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</div>
              </div>
              <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-4 rounded-xl">
                <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-1">Risk-Reward</div>
                <div className={`font-mono text-lg font-bold ${trade.rMultiple > 0 ? 'text-emerald-400' : trade.rMultiple < 0 ? 'text-rose-400' : 'text-[var(--muted-foreground)]'}`}>
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
                    <div className={`font-bold ${journalEntry.result.includes('Win') ? 'text-emerald-500' : 'text-rose-500'}`}>
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
                      <div key={rule.key} className={`flex flex-col items-center p-2 rounded-lg border ${passed ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-rose-950/20 border-rose-900/30'}`}>
                        {passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" /> : <XCircle className="w-4 h-4 text-rose-500 mb-1" />}
                        <span className={`text-[10px] font-semibold text-center ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>{rule.label}</span>
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
                <div className={`p-3 rounded-full ${isDisciplined ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)] text-xs font-semibold uppercase mb-0.5">Rules Followed?</div>
                  <div className={`font-bold text-lg ${isDisciplined ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isDisciplined ? 'Yes, disciplined.' : 'No, broke rules.'}
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card)]/50 border border-[var(--border)]/50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-[var(--border)]/50 pb-2">
                  <span className="text-[var(--muted-foreground)] text-xs font-semibold uppercase">Emotion</span>
                  <span className="text-white text-sm font-medium">{trade.emotion}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[var(--border)]/50 pb-2">
                  <span className="text-[var(--muted-foreground)] text-xs font-semibold uppercase">Mistake</span>
                  <span className={`text-sm font-medium ${trade.mistake === 'None' ? 'text-emerald-400' : 'text-amber-400'}`}>{trade.mistake}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted-foreground)] text-xs font-semibold uppercase">Setup</span>
                  <span className="text-white text-sm font-medium">{trade.strategy}</span>
                </div>
              </div>
            </div>
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
                <div className="relative z-10 prose prose-invert prose-purple max-w-none text-sm leading-relaxed">
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
              {trade.notes || <span className="text-zinc-600 italic">No notes provided for this trade.</span>}
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
