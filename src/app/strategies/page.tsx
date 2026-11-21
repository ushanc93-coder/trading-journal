"use client";

import { useTradesContext } from "@/lib/TradesContext";
import { useSettingsContext } from "@/lib/SettingsContext";
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";
import { 
  Briefcase, Sparkles, Wand2, Loader2, BookOpen, Edit2, 
  CheckCircle2, X, Info, TrendingUp, CheckSquare, Square, Check,
  Plus, Trash2, Clock, Target, RotateCcw, ShieldCheck, Zap
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import AddTradeModal from "@/components/AddTradeModal";

function formatCurrency(val: number, forceSign = true): string {
  const isLoss = val < 0;
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (isLoss) return `-$${formatted}`;
  if (forceSign && val > 0) return `+$${formatted}`;
  return `$${formatted}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const isRate = item.dataKey === 'winRate';
    const rawVal = item.value;
    const value = Number(rawVal) || 0;
    const isLoss = !isRate && value < 0;
    const tradesCount = item.payload?.total;

    return (
      <div className="bg-[var(--card)] border border-[var(--border)] p-3 rounded-xl shadow-xl z-50">
        <p className="text-[var(--muted-foreground)] font-semibold text-xs mb-1">
          {label || item.name}
        </p>
        <p className={`text-sm font-bold ${isRate ? 'text-[#4F39F6]' : isLoss ? 'text-rose-500' : 'text-[#10B981]'}`}>
          {isRate ? `${value}% Win Rate` : formatCurrency(value, true)}
        </p>
        {tradesCount !== undefined && (
          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-medium">
            {tradesCount} {tradesCount === 1 ? 'trade' : 'trades'}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const QUICK_PROMPTS = [
  {
    label: "ICT 5m Liquidity Sweep",
    prompt: "Trade EURUSD and GBPUSD during London or NY session when price sweeps the Asian high or low on 15m, then creates a 5m market structure shift with an FVG. Enter on FVG retest, stop above the sweep high, targeting 1:2.5 RR."
  },
  {
    label: "London Open Breakout",
    prompt: "Trade the London Silver Bullet at 03:00-04:00 AM EST. Wait for London open to fake out Asian session range, then enter on the first fair value gap retracement towards the opposite liquidity pool."
  },
  {
    label: "FVG Retracement",
    prompt: "Look for a high-displacement impulse move creating a 15m Fair Value Gap. Wait for a slow corrective pullback into the 50% equilibrium level of the FVG, targeting the recent swing high/low."
  },
  {
    label: "NY Silver Bullet (10am)",
    prompt: "Execute 10:00 - 11:00 AM NY Silver Bullet setup on US100 and US30. Identify clear draw on liquidity, enter on 1m/5m FVG confirmation with max 1% account risk."
  }
];

export interface PlaybookConfirmationCard {
  id: string;
  name: string;
  timeframe: string;
  description: string;
  tag: string;
  color: string;
}

export const CORE_PLAYBOOK_CONFIRMATIONS: PlaybookConfirmationCard[] = [
  {
    id: "bias",
    name: "Bias 1D, 4H, 1H",
    timeframe: "Daily / 4H / 1H",
    description: "HTF market trend & Draw on Liquidity (DOL) strictly aligned with proposed trade direction.",
    tag: "HTF Bias",
    color: "indigo"
  },
  {
    id: "time",
    name: "Silver Bullet Time",
    timeframe: "London / NY AM / NY PM",
    description: "Execution strictly inside institutional killzone: London (3-4 AM EST), NY AM (10-11 AM EST), or NY PM (2-3 PM EST).",
    tag: "Killzone",
    color: "amber"
  },
  {
    id: "array",
    name: "15M FVG, or OB / RB",
    timeframe: "15-Minute PDA",
    description: "Price reacting from or mitigating a 15M Fair Value Gap (FVG), Order Block (OB), or Rejection Block (RB).",
    tag: "15M Array",
    color: "emerald"
  },
  {
    id: "trigger",
    name: "1min ST (VSR) / SRL / MSS",
    timeframe: "1-Minute LTF",
    description: "1m Short-Term trigger: Volume Spread/Spike Reversal (VSR), Swing Range Liquidity (SRL) sweep, or Market Structure Shift (MSS) with displacement.",
    tag: "1M Trigger",
    color: "sky"
  },
  {
    id: "smt",
    name: "SMT Divergence",
    timeframe: "Correlated Pairs",
    description: "Smart Money Tool (SMT) divergence confirmed between correlated assets (EURUSD vs GBPUSD, NQ vs ES, or inverted DXY).",
    tag: "SMT",
    color: "purple"
  }
];

export interface PillarOption {
  id: string;
  label: string;
}

export const DEFAULT_PDA_OPTIONS: PillarOption[] = [
  { id: "15M FVG", label: "15M FVG (Fair Value Gap)" },
  { id: "15M OB", label: "15M OB (Order Block)" },
  { id: "15M RB", label: "15M RB (Rejection Block)" },
  { id: "HRL", label: "HRL (High Resistance Liquidity)" }
];

export const DEFAULT_ENTRY1M_OPTIONS: PillarOption[] = [
  { id: "ST (VSR)", label: "ST: VSR (Volume Reversal)" },
  { id: "SRL", label: "SRL (Range Liquidity Sweep)" },
  { id: "MSS", label: "MSS (Structure Shift)" },
  { id: "Order Flow", label: "Order Flow" }
];

export const DEFAULT_SMT_OPTIONS: PillarOption[] = [
  { id: "EUR vs GBP", label: "EUR/USD vs GBP/USD" },
  { id: "NQ vs ES", label: "NQ (US100) vs ES (US500)" },
  { id: "DXY Inverted", label: "DXY Inverted Correlation" },
  { id: "XAU vs XAG (Gold)", label: "XAU/USD vs XAG/USD (Gold vs Silver)" },
  { id: "Clean SMT", label: "Clean SMT Divergence" }
];

const DEFAULT_CHECKLIST: Record<string, string[]> = {
  "Order Flow": [
    "Bias 1D, 4H, 1H: Higher Timeframe trend & Draw on Liquidity (DOL) strictly aligned with trade direction",
    "Silver Bullet Time: Execution strictly inside London (03-04 AM EST), NY AM (10-11 AM EST), or NY PM (02-03 PM EST) window",
    "15M FVG, OB / RB / HRL: Price reacting from key 15M Fair Value Gap, Order Block, Rejection Block, or HRL",
    "1min ST (VSR) / SRL / MSS / Order Flow: 1-minute execution trigger confirmed with energetic displacement or order flow",
    "SMT Divergence: Confirmed crack in correlation between EUR/GBP, NQ/ES, Gold (XAU/XAG), or against DXY",
    "Stop loss placed beyond invalidation swing / wick (never moved once live)",
    "Take profit mapped to opposing liquidity pool (minimum 1:2.0 R:R)",
    "Risk capped at maximum 1.0% account equity"
  ],
  "Sharp Turn #1": [
    "Bias 1D, 4H, 1H: Alignment with Higher Timeframe rejection level or HTF order block",
    "Silver Bullet Time: Session timing aligned with peak volume (London Open or NY Open)",
    "15M FVG, OB / RB / HRL: Major exhaustion wick at key daily/15m support or resistance PDA",
    "1min ST (VSR) / SRL / MSS / Order Flow: Lower timeframe Change of Character (CHoCH), VSR, or order flow",
    "SMT Divergence: Divergence against correlated asset (EUR/GBP, NQ/ES, Gold/XAU, DXY) confirming institutional reversal",
    "Tight Stop Loss placed just beyond rejection high/low",
    "Targeting 1:2 Risk to Reward at immediate structure level",
    "Max 1 trade per session limit respected"
  ],
  "Sharp Turn #2": [
    "Bias 1D, 4H, 1H: Double top/bottom or major liquidity grab aligned with HTF bias",
    "Silver Bullet Time: Executed during high-probability institutional delivery window",
    "15M FVG, OB / RB / HRL: Liquidity swept and displacement back through 15m FVG / OB / HRL",
    "1min ST (VSR) / SRL / MSS / Order Flow: Impulsive breakdown below swing range liquidity (SRL), MSS, or order flow",
    "SMT Divergence: RSI / SMT divergence (including Gold / correlated pairs) confirming momentum exhaustion",
    "Scale out 50% at 1.5R and move SL to break-even",
    "Final target at opposing daily swing level"
  ]
};

export default function StrategiesPage() {
  const { trades, isLoaded, addTrade } = useTradesContext();
  const { preferences } = useSettingsContext();
  
  const [roughIdea, setRoughIdea] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refinedSOP, setRefinedSOP] = useState<string | null>(null);

  // Persistent Checklists
  const [strategyChecklists, setStrategyChecklists] = useState<Record<string, string[]>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("uc_playbook_checklists_v2");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_CHECKLIST;
  });

  const saveChecklists = (updated: Record<string, string[]>) => {
    setStrategyChecklists(updated);
    try {
      localStorage.setItem("uc_playbook_checklists_v2", JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // Persistent 5-Step Pre-Trade Hub state (100 Marks Engine: 20 marks each)
  const [playbookScoring, setPlaybookScoring] = useState<{
    biasFrames: string[];
    sbSession: string;
    pdaType: string;
    entry1m: string;
    smtType: string;
  }>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("uc_playbook_scoring_v2");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      biasFrames: ["1D", "4H", "1H"],
      sbSession: "London SB (3-4 AM)",
      pdaType: "15M FVG",
      entry1m: "MSS",
      smtType: "Clean SMT"
    };
  });

  const savePlaybookScoring = (newScoring: typeof playbookScoring) => {
    setPlaybookScoring(newScoring);
    try {
      localStorage.setItem("uc_playbook_scoring_v2", JSON.stringify(newScoring));
    } catch (e) {
      console.warn(e);
    }
  };

  const biasMarks = playbookScoring.biasFrames.length > 0 ? 20 : 0;
  const sbMarks = playbookScoring.sbSession ? 20 : 0;
  const pdaMarks = playbookScoring.pdaType ? 20 : 0;
  const entryMarks = playbookScoring.entry1m ? 20 : 0;
  const smtMarks = playbookScoring.smtType ? 20 : 0;
  const totalScore = biasMarks + sbMarks + pdaMarks + entryMarks + smtMarks;

  // Drawer & Checklist State
  const [selectedPlaybook, setSelectedPlaybook] = useState<any | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("uc_playbook_checked_items_v2");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  const saveCheckedItems = (newItems: Record<string, boolean>) => {
    setCheckedItems(newItems);
    try {
      localStorage.setItem("uc_playbook_checked_items_v2", JSON.stringify(newItems));
    } catch (e) {
      console.warn(e);
    }
  };

  const [drawerNewRule, setDrawerNewRule] = useState("");
  
  // Customizable Options for PDA (Pillar 3) and 1M Entry (Pillar 4)
  const [pdaOptions, setPdaOptions] = useState<PillarOption[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("uc_pda_options_v2");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_PDA_OPTIONS;
  });

  const savePdaOptions = (opts: PillarOption[]) => {
    setPdaOptions(opts);
    try {
      localStorage.setItem("uc_pda_options_v2", JSON.stringify(opts));
    } catch (e) {
      console.warn(e);
    }
  };

  const [entry1mOptions, setEntry1mOptions] = useState<PillarOption[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("uc_entry1m_options_v2");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_ENTRY1M_OPTIONS;
  });

  const saveEntry1mOptions = (opts: PillarOption[]) => {
    setEntry1mOptions(opts);
    try {
      localStorage.setItem("uc_entry1m_options_v2", JSON.stringify(opts));
    } catch (e) {
      console.warn(e);
    }
  };

  const [newPdaText, setNewPdaText] = useState("");
  const [isAddingPda, setIsAddingPda] = useState(false);

  const [newEntry1mText, setNewEntry1mText] = useState("");
  const [isAddingEntry1m, setIsAddingEntry1m] = useState(false);

  const handleAddPda = () => {
    if (!newPdaText.trim()) return;
    const name = newPdaText.trim();
    const newOpt: PillarOption = { id: name, label: name };
    if (!pdaOptions.some(o => o.id.toLowerCase() === name.toLowerCase())) {
      savePdaOptions([...pdaOptions, newOpt]);
    }
    setNewPdaText("");
    setIsAddingPda(false);
  };

  const handleDeletePda = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pdaOptions.length <= 1) {
      alert("At least one PD Array option must remain.");
      return;
    }
    const updated = pdaOptions.filter(o => o.id !== id);
    savePdaOptions(updated);
    if (playbookScoring.pdaType === id) {
      savePlaybookScoring({ ...playbookScoring, pdaType: "" });
    }
  };

  const handleAddEntry1m = () => {
    if (!newEntry1mText.trim()) return;
    const name = newEntry1mText.trim();
    const newOpt: PillarOption = { id: name, label: name };
    if (!entry1mOptions.some(o => o.id.toLowerCase() === name.toLowerCase())) {
      saveEntry1mOptions([...entry1mOptions, newOpt]);
    }
    setNewEntry1mText("");
    setIsAddingEntry1m(false);
  };

  const handleDeleteEntry1m = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (entry1mOptions.length <= 1) {
      alert("At least one 1M Entry option must remain.");
      return;
    }
    const updated = entry1mOptions.filter(o => o.id !== id);
    saveEntry1mOptions(updated);
    if (playbookScoring.entry1m === id) {
      savePlaybookScoring({ ...playbookScoring, entry1m: "" });
    }
  };

  const [smtOptions, setSmtOptions] = useState<PillarOption[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("uc_smt_options_v2");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_SMT_OPTIONS;
  });

  const saveSmtOptions = (opts: PillarOption[]) => {
    setSmtOptions(opts);
    try {
      localStorage.setItem("uc_smt_options_v2", JSON.stringify(opts));
    } catch (e) {
      console.warn(e);
    }
  };

  const [newSmtText, setNewSmtText] = useState("");
  const [isAddingSmt, setIsAddingSmt] = useState(false);

  const handleAddSmt = () => {
    if (!newSmtText.trim()) return;
    const name = newSmtText.trim();
    const newOpt: PillarOption = { id: name, label: name };
    if (!smtOptions.some(o => o.id.toLowerCase() === name.toLowerCase())) {
      saveSmtOptions([...smtOptions, newOpt]);
    }
    setNewSmtText("");
    setIsAddingSmt(false);
  };

  const handleDeleteSmt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (smtOptions.length <= 1) {
      alert("At least one SMT option must remain.");
      return;
    }
    const updated = smtOptions.filter(o => o.id !== id);
    saveSmtOptions(updated);
    if (playbookScoring.smtType === id) {
      savePlaybookScoring({ ...playbookScoring, smtType: "" });
    }
  };

  // Edit Strategy Modal State
  const [editingStrategy, setEditingStrategy] = useState<any | null>(null);
  const [customName, setCustomName] = useState("");
  const [customRules, setCustomRules] = useState<string[]>([]);
  const [newCustomRuleText, setNewCustomRuleText] = useState("");
  const [customRR, setCustomRR] = useState("1:2.0");

  // Add Trade Modal trigger from Playbook
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);

  // Helper to map checklist rule to its 100-Marks Confluence pillar
  const getPillarForRule = (text: string): "bias" | "sb" | "pda" | "entry1m" | "smt" | "other" => {
    const t = text.toLowerCase();
    if (t.includes("bias") || t.includes("higher timeframe") || t.includes("1d, 4h, 1h") || t.includes("htf")) return "bias";
    if (t.includes("silver bullet") || t.includes("sb time") || t.includes("london (03-04") || t.includes("ny am (10-11") || t.includes("ny pm (02-03")) return "sb";
    if (t.includes("fvg") || t.includes("order block") || t.includes("rejection block") || t.includes("hrl") || t.includes("pda")) return "pda";
    if (t.includes("1min") || t.includes("vsr") || t.includes("srl") || t.includes("mss") || t.includes("order flow") || t.includes("displacement")) return "entry1m";
    if (t.includes("smt") || t.includes("divergence") || t.includes("correlation") || t.includes("gold") || t.includes("xau") || t.includes("xag")) return "smt";
    return "other";
  };

  // Check if a rule is satisfied (either in checkedItems or its pillar is active)
  const isRuleChecked = (stratName: string, idx: number, itemText: string): boolean => {
    const pillar = getPillarForRule(itemText);
    if (pillar === "bias") return playbookScoring.biasFrames.length > 0;
    if (pillar === "sb") return Boolean(playbookScoring.sbSession);
    if (pillar === "pda") return Boolean(playbookScoring.pdaType);
    if (pillar === "entry1m") return Boolean(playbookScoring.entry1m);
    if (pillar === "smt") return Boolean(playbookScoring.smtType);
    return !!checkedItems[`${stratName}-${idx}`];
  };

  // Bidirectional toggle: checking a rule updates marks, unchecking removes marks
  const toggleRule = (stratName: string, idx: number, itemText: string) => {
    const pillar = getPillarForRule(itemText);
    const currentlyChecked = isRuleChecked(stratName, idx, itemText);

    if (pillar === "bias") {
      const nextScoring = {
        ...playbookScoring,
        biasFrames: currentlyChecked ? [] : ["1D", "4H", "1H"]
      };
      savePlaybookScoring(nextScoring);
      return;
    }
    if (pillar === "sb") {
      const nextScoring = {
        ...playbookScoring,
        sbSession: currentlyChecked ? "" : "London SB (3-4 AM)"
      };
      savePlaybookScoring(nextScoring);
      return;
    }
    if (pillar === "pda") {
      const nextScoring = {
        ...playbookScoring,
        pdaType: currentlyChecked ? "" : "15M FVG"
      };
      savePlaybookScoring(nextScoring);
      return;
    }
    if (pillar === "entry1m") {
      const nextScoring = {
        ...playbookScoring,
        entry1m: currentlyChecked ? "" : "MSS"
      };
      savePlaybookScoring(nextScoring);
      return;
    }
    if (pillar === "smt") {
      const nextScoring = {
        ...playbookScoring,
        smtType: currentlyChecked ? "" : "Clean SMT"
      };
      savePlaybookScoring(nextScoring);
      return;
    }

    const key = `${stratName}-${idx}`;
    saveCheckedItems({ ...checkedItems, [key]: !currentlyChecked });
  };

  // Global 100 Marks A+ Shortcut
  const handleSetAplusMarks = (stratName?: string) => {
    const fullScoring = {
      biasFrames: ["1D", "4H", "1H"],
      sbSession: "London SB (3-4 AM)",
      pdaType: "15M FVG",
      entry1m: "MSS",
      smtType: "Clean SMT"
    };
    savePlaybookScoring(fullScoring);

    const targetStrat = stratName || selectedPlaybook?.name || "Order Flow";
    const rules = getChecklistForStrategy(targetStrat);
    const updated = { ...checkedItems };
    rules.forEach((_, i) => {
      updated[`${targetStrat}-${i}`] = true;
    });
    saveCheckedItems(updated);
  };

  // Global Reset Checklist & Marks
  const handleResetChecklistAndMarks = (stratName?: string) => {
    const zeroScoring = {
      biasFrames: [],
      sbSession: "",
      pdaType: "",
      entry1m: "",
      smtType: ""
    };
    savePlaybookScoring(zeroScoring);

    const targetStrat = stratName || selectedPlaybook?.name || "Order Flow";
    const updated = { ...checkedItems };
    const rules = getChecklistForStrategy(targetStrat);
    rules.forEach((_, i) => {
      delete updated[`${targetStrat}-${i}`];
    });
    saveCheckedItems(updated);
  };

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading strategies...</div>;

  if (trades.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)] bg-[var(--card)] rounded-lg border border-[var(--border)]">
        No data available to analyze strategies. Add some trades first!
      </div>
    );
  }

  // --- Strategy Performance Data ---
  const strategyStats = trades.reduce((acc, trade) => {
    const strat = trade.strategy || "Unknown";
    if (!acc[strat]) acc[strat] = { name: strat, pnl: 0, wins: 0, losses: 0, total: 0 };
    acc[strat].pnl += trade.netPnL;
    acc[strat].total += 1;
    if (trade.status === "Win") acc[strat].wins += 1;
    else if (trade.status === "Loss") acc[strat].losses += 1;
    return acc;
  }, {} as Record<string, { name: string, pnl: number, wins: number, losses: number, total: number }>);

  const strategyData = Object.values(strategyStats).map(s => {
    const stratTrades = trades.filter(t => t.strategy === s.name);
    const winTrades = stratTrades.filter(t => t.status === "Win");
    const avgWin = winTrades.length > 0 ? (winTrades.reduce((sum, t) => sum + t.netPnL, 0) / winTrades.length) : 0;
    
    // Average R:R calculation
    const avgWinRR = winTrades.length > 0 
      ? (winTrades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / winTrades.length) 
      : 0;
    
    const formattedRR = avgWinRR > 0 ? `1:${avgWinRR.toFixed(1)}` : "1:1.5";

    return {
      ...s,
      winRate: Math.round((s.wins / s.total) * 100),
      avgWin,
      avgRR: formattedRR,
      displayPnL: formatCurrency(s.pnl, true)
    };
  }).sort((a, b) => b.pnl - a.pnl);

  const bestStrategy = strategyData[0] || null;

  const getChecklistForStrategy = (stratName: string) => {
    return strategyChecklists[stratName] || strategyChecklists["Order Flow"] || DEFAULT_CHECKLIST["Order Flow"];
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Strategies Playbook</h2>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Execution playbooks and setups profit contribution.</p>
      </div>

      {/* Top Banner: Most Profitable Setup */}
      {bestStrategy && (
        <div className="bg-[#4F39F6] text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between shadow-lg shadow-[#4F39F6]/20 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-white/20 p-2.5 rounded-xl shrink-0 backdrop-blur-sm border border-white/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Most Profitable Setup</span>
              <h3 className="text-lg font-bold tracking-tight mt-0.5">{bestStrategy.name}</h3>
              <p className="text-xs text-white/90 mt-0.5">
                Generated <span className="font-bold font-mono">{formatCurrency(bestStrategy.pnl, true)}</span> with a {bestStrategy.winRate}% win rate across {bestStrategy.total} trades.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-xs text-xs font-bold text-white flex items-center gap-2 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Confluence: {totalScore}/100 Marks</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-mono">
                {totalScore === 100 ? "A+ Setup" : totalScore >= 80 ? "A Setup" : totalScore >= 60 ? "B Setup" : "C Setup"}
              </span>
            </div>

            <button
              onClick={() => setSelectedPlaybook(bestStrategy)}
              className="flex items-center self-start sm:self-auto px-4 py-2 bg-white text-[#4F39F6] hover:bg-white/95 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Open Executable Playbook
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PRE-TRADE CONFIRMATION PLAYBOOK (100-MARKS ENGINE: 20 EACH) */}
      {/* ========================================================= */}
      <div className="neumorphic-card p-5 sm:p-6 border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.03] to-transparent">
        {/* Header with 100 Marks Scoreboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#4F39F6]/15 text-[#4F39F6] border border-[#4F39F6]/25 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                  Pre-Trade Confluence Playbook
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide border transition-all ${
                  totalScore === 100
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                    : totalScore >= 80
                    ? "bg-[#4F39F6]/15 text-[#4F39F6] border-[#4F39F6]/40"
                    : totalScore >= 60
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40"
                    : "bg-rose-500/15 text-rose-500 border-rose-500/40"
                }`}>
                  {totalScore} / 100 Marks
                  {totalScore === 100 ? " • A+ Prime Setup" : totalScore >= 80 ? " • A Setup" : totalScore >= 60 ? " • B Setup" : " • C Setup"}
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                5 Critical pillars (Bias, SB Window, PDA, 1M Entry, SMT) • 20 Marks each for disciplined execution
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => handleSetAplusMarks()}
              className="px-3 py-1.5 rounded-xl bg-[#4F39F6]/10 text-[#4F39F6] hover:bg-[#4F39F6] hover:text-white text-xs font-semibold transition-all border border-[#4F39F6]/25 cursor-pointer"
            >
              Set A+ (100 Marks)
            </button>
            <button
              onClick={() => handleResetChecklistAndMarks()}
              className="px-3 py-1.5 rounded-xl bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xs font-semibold transition-all border border-[var(--border)] cursor-pointer"
            >
              Reset (0 Marks)
            </button>
            <button
              onClick={() => setIsAddTradeOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4F39F6] hover:bg-[#4338CA] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Log Trade With Marks ({totalScore})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Score Progress Bar */}
        <div className="mb-5 bg-[var(--muted)]/40 p-3 rounded-2xl border border-[var(--border)]">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-[var(--muted-foreground)] uppercase text-[10px] tracking-wider">
              Confluence Score Readiness
            </span>
            <span className={`tabular-nums ${totalScore >= 80 ? "text-[#10B981]" : totalScore >= 60 ? "text-amber-500" : "text-rose-500"}`}>
              {totalScore} / 100% {totalScore === 100 ? "(Full Risk Approved)" : totalScore >= 80 ? "(Standard 1.0% Risk)" : totalScore >= 60 ? "(Reduced 0.5% Risk)" : "(High Risk / Wait)"}
            </span>
          </div>
          <div className="w-full bg-[var(--border)]/60 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                totalScore === 100
                  ? "bg-gradient-to-r from-emerald-500 to-[#10B981]"
                  : totalScore >= 80
                  ? "bg-gradient-to-r from-[#4F39F6] to-indigo-400"
                  : totalScore >= 60
                  ? "bg-gradient-to-r from-amber-500 to-amber-400"
                  : "bg-rose-500"
              }`}
              style={{ width: `${totalScore}%` }}
            />
          </div>
        </div>

        {/* 5 Confirmation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. Bias Frame */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            biasMarks > 0 ? "bg-[#4F39F6]/10 border-[#4F39F6]/30 shadow-xs" : "bg-[var(--card)] border-[var(--border)]"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
                  HTF Bias
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  biasMarks > 0 ? "bg-[#10B981]/15 text-[#10B981]" : "bg-slate-500/10 text-[var(--muted-foreground)]"
                }`}>
                  +{biasMarks}/20
                </span>
              </div>
              <h4 className="text-sm font-bold tracking-tight mb-1">1. Bias: Which Frame?</h4>
              <p className="text-[10.5px] text-[var(--muted-foreground)] mb-3">Daily, 4H, 1H HTF trend alignment</p>
              
              <div className="flex flex-wrap gap-1.5">
                {["1D", "4H", "1H"].map((f) => {
                  const active = playbookScoring.biasFrames.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        const next = active 
                          ? playbookScoring.biasFrames.filter(x => x !== f)
                          : [...playbookScoring.biasFrames, f];
                        savePlaybookScoring({ ...playbookScoring, biasFrames: next });
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
            <div className="mt-3 pt-2 border-t border-[var(--border)]/50 text-[10px] font-medium text-[var(--muted-foreground)] flex justify-between">
              <span>{playbookScoring.biasFrames.length > 0 ? `${playbookScoring.biasFrames.join(" + ")} Aligned` : "Select frame"}</span>
              <span className="font-bold text-indigo-500">20 Marks</span>
            </div>
          </div>

          {/* 2. SB Window */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            sbMarks > 0 ? "bg-amber-500/10 border-amber-500/30 shadow-xs" : "bg-[var(--card)] border-[var(--border)]"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                  Killzone
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  sbMarks > 0 ? "bg-[#10B981]/15 text-[#10B981]" : "bg-slate-500/10 text-[var(--muted-foreground)]"
                }`}>
                  +{sbMarks}/20
                </span>
              </div>
              <h4 className="text-sm font-bold tracking-tight mb-1">2. SB: Which Frame/Time?</h4>
              <p className="text-[10.5px] text-[var(--muted-foreground)] mb-3">Silver Bullet execution window</p>
              
              <div className="flex flex-col gap-1.5">
                {[
                  { id: "London SB (3-4 AM)", label: "London SB (3-4 AM)" },
                  { id: "NY AM SB (10-11 AM)", label: "NY AM SB (10-11 AM)" },
                  { id: "NY PM SB (2-3 PM)", label: "NY PM SB (2-3 PM)" }
                ].map((s) => {
                  const active = playbookScoring.sbSession === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        savePlaybookScoring({
                          ...playbookScoring,
                          sbSession: active ? "" : s.id
                        });
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold text-left transition-all cursor-pointer ${
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
            <div className="mt-3 pt-2 border-t border-[var(--border)]/50 text-[10px] font-medium text-[var(--muted-foreground)] flex justify-between">
              <span className="truncate">{playbookScoring.sbSession || "Select session"}</span>
              <span className="font-bold text-amber-500 shrink-0">20 Marks</span>
            </div>
          </div>

          {/* 3. PDA */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            pdaMarks > 0 ? "bg-emerald-500/10 border-emerald-500/30 shadow-xs" : "bg-[var(--card)] border-[var(--border)]"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                  15M PDA
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  pdaMarks > 0 ? "bg-[#10B981]/15 text-[#10B981]" : "bg-slate-500/10 text-[var(--muted-foreground)]"
                }`}>
                  +{pdaMarks}/20
                </span>
              </div>
              <h4 className="text-sm font-bold tracking-tight mb-1">3. PDA: What Array?</h4>
              <p className="text-[10.5px] text-[var(--muted-foreground)] mb-3">15M institutional key array</p>
              
              <div className="flex flex-col gap-1.5">
                {pdaOptions.map((p) => {
                  const active = playbookScoring.pdaType === p.id;
                  return (
                    <div key={p.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => {
                          savePlaybookScoring({
                            ...playbookScoring,
                            pdaType: active ? "" : p.id
                          });
                        }}
                        className={`w-full px-2.5 py-1 rounded-lg text-[11px] font-semibold text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                          active 
                            ? "bg-emerald-500 text-white font-bold shadow-xs" 
                            : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        <span className="truncate">{active ? `✓ ${p.label}` : p.label}</span>
                        <span
                          onClick={(e) => handleDeletePda(p.id, e)}
                          title="Remove option"
                          className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500 hover:text-white transition-opacity shrink-0 ${active ? "text-white/80" : "text-rose-500"}`}
                        >
                          <X className="w-3 h-3" />
                        </span>
                      </button>
                    </div>
                  );
                })}

                {/* Inline Add PDA Option */}
                {isAddingPda ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      autoFocus
                      value={newPdaText}
                      onChange={(e) => setNewPdaText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddPda();
                        if (e.key === "Escape") setIsAddingPda(false);
                      }}
                      placeholder="e.g. HRL, Breaker..."
                      className="flex-1 px-2 py-1 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--foreground)] outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPda}
                      className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10.5px] font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingPda(false)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingPda(true)}
                    className="w-full py-1 mt-0.5 rounded-lg border border-dashed border-[var(--border)] text-[10.5px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add PD Array</span>
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)]/50 text-[10px] font-medium text-[var(--muted-foreground)] flex justify-between">
              <span>{playbookScoring.pdaType || "Select PDA"}</span>
              <span className="font-bold text-emerald-500">20 Marks</span>
            </div>
          </div>

          {/* 4. 1M Entry */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            entryMarks > 0 ? "bg-sky-500/10 border-sky-500/30 shadow-xs" : "bg-[var(--card)] border-[var(--border)]"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono">
                  1M Trigger
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  entryMarks > 0 ? "bg-[#10B981]/15 text-[#10B981]" : "bg-slate-500/10 text-[var(--muted-foreground)]"
                }`}>
                  +{entryMarks}/20
                </span>
              </div>
              <h4 className="text-sm font-bold tracking-tight mb-1">4. 1M Entry: What?</h4>
              <p className="text-[10.5px] text-[var(--muted-foreground)] mb-3">1-Minute execution trigger model</p>
              
              <div className="flex flex-col gap-1.5">
                {entry1mOptions.map((e) => {
                  const active = playbookScoring.entry1m === e.id;
                  return (
                    <div key={e.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => {
                          savePlaybookScoring({
                            ...playbookScoring,
                            entry1m: active ? "" : e.id
                          });
                        }}
                        className={`w-full px-2.5 py-1 rounded-lg text-[11px] font-semibold text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                          active 
                            ? "bg-sky-500 text-white font-bold shadow-xs" 
                            : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        <span className="truncate">{active ? `✓ ${e.label}` : e.label}</span>
                        <span
                          onClick={(ev) => handleDeleteEntry1m(e.id, ev)}
                          title="Remove option"
                          className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500 hover:text-white transition-opacity shrink-0 ${active ? "text-white/80" : "text-rose-500"}`}
                        >
                          <X className="w-3 h-3" />
                        </span>
                      </button>
                    </div>
                  );
                })}

                {/* Inline Add 1M Entry Option */}
                {isAddingEntry1m ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      autoFocus
                      value={newEntry1mText}
                      onChange={(ev) => setNewEntry1mText(ev.target.value)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") handleAddEntry1m();
                        if (ev.key === "Escape") setIsAddingEntry1m(false);
                      }}
                      placeholder="e.g. Order Flow, IFVG..."
                      className="flex-1 px-2 py-1 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--foreground)] outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddEntry1m}
                      className="px-2 py-1 rounded-lg bg-sky-600 text-white text-[10.5px] font-bold hover:bg-sky-700 cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingEntry1m(false)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingEntry1m(true)}
                    className="w-full py-1 mt-0.5 rounded-lg border border-dashed border-[var(--border)] text-[10.5px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add 1M Trigger</span>
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)]/50 text-[10px] font-medium text-[var(--muted-foreground)] flex justify-between">
              <span>{playbookScoring.entry1m || "Select 1m model"}</span>
              <span className="font-bold text-sky-500">20 Marks</span>
            </div>
          </div>

          {/* 5. SMT Divergence */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            smtMarks > 0 ? "bg-purple-500/10 border-purple-500/30 shadow-xs" : "bg-[var(--card)] border-[var(--border)]"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono">
                  SMT
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  smtMarks > 0 ? "bg-[#10B981]/15 text-[#10B981]" : "bg-slate-500/10 text-[var(--muted-foreground)]"
                }`}>
                  +{smtMarks}/20
                </span>
              </div>
              <h4 className="text-sm font-bold tracking-tight mb-1">5. SMT Divergence</h4>
              <p className="text-[10.5px] text-[var(--muted-foreground)] mb-3">Correlated asset divergence</p>
              
              <div className="flex flex-col gap-1.5">
                {smtOptions.map((m) => {
                  const active = playbookScoring.smtType === m.id;
                  return (
                    <div key={m.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => {
                          savePlaybookScoring({
                            ...playbookScoring,
                            smtType: active ? "" : m.id
                          });
                        }}
                        className={`w-full px-2.5 py-1 rounded-lg text-[11px] font-semibold text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                          active 
                            ? "bg-purple-500 text-white font-bold shadow-xs" 
                            : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        <span className="truncate">{active ? `✓ ${m.label}` : m.label}</span>
                        <span
                          onClick={(ev) => handleDeleteSmt(m.id, ev)}
                          title="Remove option"
                          className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500 hover:text-white transition-opacity shrink-0 ${active ? "text-white/80" : "text-rose-500"}`}
                        >
                          <X className="w-3 h-3" />
                        </span>
                      </button>
                    </div>
                  );
                })}

                {/* Inline Add SMT Option */}
                {isAddingSmt ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      autoFocus
                      value={newSmtText}
                      onChange={(ev) => setNewSmtText(ev.target.value)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") handleAddSmt();
                        if (ev.key === "Escape") setIsAddingSmt(false);
                      }}
                      placeholder="e.g. XAU vs DXY, Silver..."
                      className="flex-1 px-2 py-1 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--foreground)] outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSmt}
                      className="px-2 py-1 rounded-lg bg-purple-600 text-white text-[10.5px] font-bold hover:bg-purple-700 cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSmt(false)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingSmt(true)}
                    className="w-full py-1 mt-0.5 rounded-lg border border-dashed border-[var(--border)] text-[10.5px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add SMT Option</span>
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)]/50 text-[10px] font-medium text-[var(--muted-foreground)] flex justify-between">
              <span>{playbookScoring.smtType || "Select SMT pair"}</span>
              <span className="font-bold text-purple-500">20 Marks</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Balanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Net P&L by Strategy (Horizontal Bar Chart) */}
        <div className="neumorphic-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">Net P&amp;L by Strategy</h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">Profit contribution by playbook setup</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-[var(--muted-foreground)]">
              {strategyData.length} Active Setups
            </span>
          </div>

          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={strategyData} 
                layout="vertical" 
                margin={{ top: 15, right: 90, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="var(--muted-foreground)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val}`} 
                  domain={[0, 950]}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="var(--foreground)" 
                  fontSize={12} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false} 
                  width={110} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                <Bar dataKey="pnl" radius={[0, 8, 8, 0]} barSize={34}>
                  <LabelList
                    dataKey="displayPnL"
                    position="right"
                    content={({ x, y, width, height, value }: any) => (
                      <text
                        x={Number(x) + Number(width) + 10}
                        y={Number(y) + Number(height) / 2 + 4}
                        fill="#10B981"
                        textAnchor="start"
                        className="text-xs font-bold fill-[#10B981]"
                      >
                        {value}
                      </text>
                    )}
                  />
                  {strategyData.map((entry, index) => (
                    <Cell 
                      key={`pnl-cell-${index}`} 
                      fill={entry.pnl >= 0 ? '#10B981' : '#F43F5E'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate by Strategy (Vertical Bar Chart) */}
        <div className="neumorphic-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">Win Rate by Strategy</h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">Hit rate consistency per system</p>
            </div>
            <span className="text-[10px] font-semibold text-[var(--muted-foreground)] px-2 py-0.5 rounded-full bg-slate-500/10">
              Labels above bars
            </span>
          </div>

          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={strategyData} 
                margin={{ top: 32, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--muted-foreground)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}%`} 
                  domain={[0, 120]} 
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                <Bar dataKey="winRate" radius={[4, 4, 0, 0]} barSize={56}>
                  <LabelList
                    dataKey="winRate"
                    position="top"
                    content={({ x, y, width, value, index }: any) => {
                      const entry = strategyData[index];
                      const tradesText = entry ? ` [${entry.total}T]` : "";
                      return (
                        <text
                          x={Number(x) + Number(width) / 2}
                          y={Number(y) - 8}
                          fill="var(--foreground)"
                          textAnchor="middle"
                          className="text-xs font-semibold fill-[var(--foreground)]"
                        >
                          {value}%{tradesText}
                        </text>
                      );
                    }}
                  />
                  {strategyData.map((entry, index) => (
                    <Cell 
                      key={`wr-cell-${index}`} 
                      fill={entry.winRate >= 70 ? '#4F39F6' : entry.winRate >= 50 ? '#818CF8' : '#CBD5E1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 2. Enhanced Strategy Table with AVG R:R and Actions */}
      <div className="neumorphic-card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">Strategy Performance Matrix</h3>
            <p className="text-[11px] text-[var(--muted-foreground)]">Breakdown of efficiency, risk-to-reward ratios, and execution tools</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-500/10 rounded-full text-[var(--foreground)]">
            {strategyData.length} Tracked Systems
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10.5px] font-bold text-[var(--muted-foreground)] uppercase bg-slate-50/70 dark:bg-white/[0.02] border-b border-[var(--border)] tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Strategy Name</th>
                <th className="px-4 py-2.5 text-center">Total Trades</th>
                <th className="px-4 py-2.5 text-center">Win Rate</th>
                <th className="px-4 py-2.5 text-right">Avg Win</th>
                <th className="px-4 py-2.5 text-center">Avg R:R</th>
                <th className="px-4 py-2.5 text-right">Net P&amp;L</th>
                <th className="px-4 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-normal">
              {strategyData.map((strat) => (
                <tr key={strat.name} className="hover:bg-[var(--muted)]/20 transition-colors">
                  {/* Strategy Name */}
                  <td className="px-4 py-2 font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F39F6]"></span>
                    {strat.name}
                  </td>

                  {/* Total Trades */}
                  <td className="px-4 py-2 text-center text-[var(--foreground)] tabular-nums text-xs">
                    {strat.total}
                  </td>

                  {/* Win Rate */}
                  <td className="px-4 py-2 text-center tabular-nums">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      strat.winRate >= 70 
                        ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' 
                        : strat.winRate >= 50
                        ? 'bg-[#4F39F6]/15 text-[#4F39F6] border border-[#4F39F6]/30'
                        : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                    }`}>
                      {strat.winRate}%
                    </span>
                  </td>

                  {/* Avg Win */}
                  <td className="px-4 py-2 text-right text-[#10B981] font-semibold tabular-nums text-xs">
                    ${strat.avgWin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Avg R:R */}
                  <td className="px-4 py-2 text-center font-semibold tabular-nums">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--muted)]/50 border border-[var(--border)] text-[11px] text-[var(--foreground)]">
                      {strat.avgRR}
                    </span>
                  </td>

                  {/* Net P&L (Strict 2 Decimals) */}
                  <td className="px-4 py-2 text-right font-semibold tabular-nums text-xs">
                    <span className={strat.pnl > 0 ? 'text-[#10B981]' : strat.pnl < 0 ? 'text-rose-500' : 'text-amber-500'}>
                      {formatCurrency(strat.pnl, true)}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedPlaybook(strat)}
                        className="flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-[#4F39F6]/10 text-[#4F39F6] hover:bg-[#4F39F6] hover:text-white transition-all border border-[#4F39F6]/25 shadow-2xs cursor-pointer"
                        title="Open executable SOP checklist"
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        Playbook
                      </button>

                      <button
                        onClick={() => {
                          setEditingStrategy(strat);
                          setCustomName(strat.name);
                          setCustomRules([...getChecklistForStrategy(strat.name)]);
                          setCustomRR(strat.avgRR);
                        }}
                        className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all border border-transparent hover:border-[var(--border)] cursor-pointer"
                        title="Edit setup rules"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. AI Strategy Refiner Polish with Interactive Quick-Prompt Tags */}
      <div className="neumorphic-card p-6 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-[#4F39F6]/10 text-[#4F39F6] border border-[#4F39F6]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#4F39F6]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">AI Strategy Refiner</h3>
          </div>
          <p className="text-[var(--muted-foreground)] mb-4 text-xs">
            Type a rough idea for a strategy. The AI will refine it into a strict, executable Standard Operating Procedure (SOP).
          </p>

          <div className="space-y-3">
            <textarea
              className="w-full bg-[var(--muted)]/20 border border-[var(--border)] rounded-lg p-3 text-[var(--foreground)] text-xs focus:outline-none focus:border-[#4F39F6] focus:ring-1 focus:ring-[#4F39F6]/20 transition-all resize-none h-28 placeholder-[var(--muted-foreground)]/60 font-sans"
              placeholder="e.g. I want to trade gold when london opens if it sweeps asia high and breaks structure down on 5m, targeting the asia low..."
              value={roughIdea}
              onChange={(e) => setRoughIdea(e.target.value)}
            />

            {/* Interactive Quick-Prompt Tags */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-[#4F39F6]" /> Quick Idea Prompts (Click to pre-fill):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRoughIdea(qp.prompt)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/70 dark:bg-black/30 hover:bg-white text-[var(--foreground)] hover:text-[#4F39F6] border border-[var(--border)] hover:border-[#4F39F6]/40 transition-all shadow-2xs text-left"
                  >
                    ⚡ {qp.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-2">
              <button
                onClick={async () => {
                  const apiKey = preferences.geminiApiKey;
                  if (!apiKey) {
                    alert("Please enter your Gemini API Key in Settings.");
                    return;
                  }
                  if (!roughIdea.trim()) return;

                  setIsRefining(true);
                  setRefinedSOP(null);
                  try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        contents: [{ parts: [{ text: `Take this messy trading idea and turn it into a highly professional, strict, and precise Standard Operating Procedure (SOP) checklist. Do not include any JSON. Use Markdown. Break it down into: Context, Entry Criteria, Invalidation (Stop Loss), Target (Take Profit), and Risk Management. Idea: "${roughIdea}"` }] }]
                      })
                    });
                    const data = await res.json();
                    if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                      setRefinedSOP(data.candidates[0].content.parts[0].text);
                    } else {
                      setRefinedSOP("Error generating SOP.");
                    }
                  } catch {
                    setRefinedSOP("Error generating SOP.");
                  } finally {
                    setIsRefining(false);
                  }
                }}
                disabled={isRefining || !roughIdea.trim()}
                className="px-5 py-2.5 bg-[#4F39F6] hover:bg-[#4338CA] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center cursor-pointer disabled:cursor-not-allowed"
              >
                {isRefining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Refine into strict SOP
              </button>
            </div>
          </div>

          {refinedSOP && (
            <div className="mt-6 bg-white/80 dark:bg-black/30 border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
                <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Refined Standard Operating Procedure
                </h4>
                <button
                  onClick={() => setRefinedSOP(null)}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Dismiss
                </button>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-[var(--foreground)]">
                <ReactMarkdown>{refinedSOP}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. Slide-Over Drawer: Executable Strategy Playbook Checklist */}
      {/* ========================================================= */}
      {selectedPlaybook && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
          <div 
            className="w-full max-w-xl bg-[var(--card)] border-l border-[var(--border)] h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4F39F6]/10 text-[#4F39F6] border border-[#4F39F6]/20">
                      Standard Operating Procedure
                    </span>
                    <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                      Active Playbook
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight mt-1">
                    {selectedPlaybook.name}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedPlaybook(null)}
                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all border border-transparent hover:border-[var(--border)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Strategy Stats Summary Pills */}
              <div className="grid grid-cols-4 gap-2.5 my-4">
                <div className="p-2.5 bg-[var(--card)] rounded-lg border border-[var(--border)] text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)]">Net P&amp;L</div>
                  <div className="text-xs sm:text-sm font-semibold tabular-nums text-[#10B981] mt-0.5">
                    {formatCurrency(selectedPlaybook.pnl, true)}
                  </div>
                </div>

                <div className="p-2.5 bg-[var(--card)] rounded-lg border border-[var(--border)] text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)]">Win Rate</div>
                  <div className="text-xs sm:text-sm font-semibold tabular-nums text-[#4F39F6] mt-0.5">
                    {selectedPlaybook.winRate}%
                  </div>
                </div>

                <div className="p-2.5 bg-[var(--card)] rounded-lg border border-[var(--border)] text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)]">Avg R:R</div>
                  <div className="text-xs sm:text-sm font-semibold tabular-nums text-[var(--foreground)] mt-0.5">
                    {selectedPlaybook.avgRR}
                  </div>
                </div>

                <div className="p-2.5 bg-[var(--card)] rounded-lg border border-[var(--border)] text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)]">Total Trades</div>
                  <div className="text-xs sm:text-sm font-semibold tabular-nums text-[var(--foreground)] mt-0.5">
                    {selectedPlaybook.total}
                  </div>
                </div>
              </div>

              {/* Live Confluence Scoreboard inside Drawer */}
              <div className="my-4 p-3.5 rounded-2xl bg-[var(--muted)]/50 border border-[var(--border)]">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="flex items-center gap-1.5 text-[var(--foreground)]">
                    <ShieldCheck className="w-4 h-4 text-[#4F39F6]" />
                    <span>Confluence Score Readiness</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border transition-all ${
                    totalScore === 100
                      ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                      : totalScore >= 80
                      ? "bg-[#4F39F6]/15 text-[#4F39F6] border-[#4F39F6]/30"
                      : totalScore >= 60
                      ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                      : "bg-rose-500/15 text-rose-500 border-rose-500/30"
                  }`}>
                    {totalScore} / 100 Marks
                    {totalScore === 100 ? " • A+ Setup" : totalScore >= 80 ? " • A Setup" : totalScore >= 60 ? " • B Setup" : " • C Setup"}
                  </span>
                </div>
                <div className="w-full bg-[var(--border)]/70 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      totalScore === 100
                        ? "bg-gradient-to-r from-emerald-500 to-[#10B981]"
                        : totalScore >= 80
                        ? "bg-gradient-to-r from-[#4F39F6] to-indigo-400"
                        : totalScore >= 60
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${totalScore}%` }}
                  />
                </div>
              </div>

              {/* Interactive Pre-Trade SOP Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-[#4F39F6]" /> Executable Pre-Trade Checklist
                  </h4>
                  <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                    Click to confirm steps &amp; earn marks
                  </span>
                </div>

                {getChecklistForStrategy(selectedPlaybook.name).map((item, idx) => {
                  const pillar = getPillarForRule(item);
                  const isChecked = isRuleChecked(selectedPlaybook.name, idx, item);

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 select-none ${
                        isChecked 
                          ? 'bg-[#10B981]/10 border-[#10B981]/35 shadow-2xs' 
                          : 'bg-white/60 dark:bg-black/20 border-[var(--border)] hover:border-[#4F39F6]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => toggleRule(selectedPlaybook.name, idx, item)}
                          className="flex items-start gap-3 flex-1 cursor-pointer"
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <div className="w-4 h-4 rounded-md bg-[#10B981] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-md border border-[var(--muted-foreground)]/60 hover:border-[#4F39F6]" />
                            )}
                          </div>
                          <span className={`text-xs font-semibold leading-relaxed transition-all ${
                            isChecked 
                              ? 'text-[var(--foreground)] line-through decoration-[#10B981] decoration-2 opacity-85' 
                              : 'text-[var(--foreground)]'
                          }`}>
                            {item}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {pillar !== "other" && (
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                              isChecked ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-slate-500/10 text-[var(--muted-foreground)]'
                            }`}>
                              +20 Marks
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentRules = getChecklistForStrategy(selectedPlaybook.name);
                              const updated = currentRules.filter((_, i) => i !== idx);
                              const newMap = { ...strategyChecklists, [selectedPlaybook.name]: updated };
                              saveChecklists(newMap);
                            }}
                            className="text-[var(--muted-foreground)] hover:text-rose-500 p-1 transition-colors cursor-pointer"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Quick Select Chips inside Drawer for each Pillar */}
                      {pillar === "bias" && (
                        <div className="flex items-center gap-1.5 pl-7 pt-1 flex-wrap">
                          <span className="text-[10px] font-medium text-[var(--muted-foreground)]">Align Timeframes:</span>
                          {["1D", "4H", "1H"].map((f) => {
                            const active = playbookScoring.biasFrames.includes(f);
                            return (
                              <button
                                key={f}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const next = active 
                                    ? playbookScoring.biasFrames.filter(x => x !== f)
                                    : [...playbookScoring.biasFrames, f];
                                  savePlaybookScoring({ ...playbookScoring, biasFrames: next });
                                }}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                  active 
                                    ? "bg-[#4F39F6] text-white shadow-2xs" 
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                              >
                                {active ? `✓ ${f}` : f}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {pillar === "sb" && (
                        <div className="flex items-center gap-1.5 pl-7 pt-1 flex-wrap">
                          <span className="text-[10px] font-medium text-[var(--muted-foreground)]">Window:</span>
                          {[
                            { id: "London SB (3-4 AM)", label: "London (3-4 AM)" },
                            { id: "NY AM SB (10-11 AM)", label: "NY AM (10-11 AM)" },
                            { id: "NY PM SB (2-3 PM)", label: "NY PM (2-3 PM)" }
                          ].map((s) => {
                            const active = playbookScoring.sbSession === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  savePlaybookScoring({
                                    ...playbookScoring,
                                    sbSession: active ? "" : s.id
                                  });
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                                  active 
                                    ? "bg-amber-500 text-black shadow-2xs" 
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                              >
                                {active ? `✓ ${s.label}` : s.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {pillar === "pda" && (
                        <div className="flex items-center gap-1.5 pl-7 pt-1 flex-wrap">
                          <span className="text-[10px] font-medium text-[var(--muted-foreground)]">Key PDA:</span>
                          {pdaOptions.map((p) => {
                            const active = playbookScoring.pdaType === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  savePlaybookScoring({
                                    ...playbookScoring,
                                    pdaType: active ? "" : p.id
                                  });
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                                  active 
                                    ? "bg-emerald-500 text-white shadow-2xs" 
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                              >
                                {active ? `✓ ${p.id}` : p.id}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {pillar === "entry1m" && (
                        <div className="flex items-center gap-1.5 pl-7 pt-1 flex-wrap">
                          <span className="text-[10px] font-medium text-[var(--muted-foreground)]">1M Model:</span>
                          {entry1mOptions.map((e) => {
                            const active = playbookScoring.entry1m === e.id;
                            return (
                              <button
                                key={e.id}
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  savePlaybookScoring({
                                    ...playbookScoring,
                                    entry1m: active ? "" : e.id
                                  });
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                                  active 
                                    ? "bg-sky-500 text-white shadow-2xs" 
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                              >
                                {active ? `✓ ${e.id}` : e.id}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {pillar === "smt" && (
                        <div className="flex items-center gap-1.5 pl-7 pt-1 flex-wrap">
                          <span className="text-[10px] font-medium text-[var(--muted-foreground)]">SMT Pair:</span>
                          {smtOptions.map((m) => {
                            const active = playbookScoring.smtType === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  savePlaybookScoring({
                                    ...playbookScoring,
                                    smtType: active ? "" : m.id
                                  });
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                                  active 
                                    ? "bg-purple-500 text-white shadow-2xs" 
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                              >
                                {active ? `✓ ${m.id}` : m.id}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Inline Add Rule Input inside Drawer */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={drawerNewRule}
                    onChange={(e) => setDrawerNewRule(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && drawerNewRule.trim()) {
                        const currentRules = getChecklistForStrategy(selectedPlaybook.name);
                        const updated = [...currentRules, drawerNewRule.trim()];
                        const newMap = { ...strategyChecklists, [selectedPlaybook.name]: updated };
                        saveChecklists(newMap);
                        setDrawerNewRule("");
                      }
                    }}
                    placeholder="+ Add new confirmation rule..."
                    className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[#4F39F6]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!drawerNewRule.trim()) return;
                      const currentRules = getChecklistForStrategy(selectedPlaybook.name);
                      const updated = [...currentRules, drawerNewRule.trim()];
                      const newMap = { ...strategyChecklists, [selectedPlaybook.name]: updated };
                      saveChecklists(newMap);
                      setDrawerNewRule("");
                    }}
                    className="px-3.5 py-2 bg-[#4F39F6] text-white rounded-xl text-xs font-bold hover:bg-[#4338CA] transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Execution Invalidation & Risk Rules */}
              <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Strict Invalidation Protocol
                </div>
                <p className="text-[var(--muted-foreground)] text-[11px] leading-relaxed">
                  If price closes beyond the invalidation level on the 5-minute chart, exit immediately at market price. Never widen stop loss or average into losing positions under this setup.
                </p>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 mt-8">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResetChecklistAndMarks(selectedPlaybook.name)}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  Reset Checklist
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAplusMarks(selectedPlaybook.name)}
                  className="px-3 py-1.5 rounded-xl bg-[#4F39F6]/10 text-[#4F39F6] border border-[#4F39F6]/25 text-xs font-bold hover:bg-[#4F39F6] hover:text-white transition-colors cursor-pointer"
                >
                  Set A+ (100 Marks)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlaybook(null);
                    setIsAddTradeOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#4F39F6] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Log Trade ({totalScore} Marks)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlaybook(null)}
                  className="px-5 py-2 rounded-xl bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] font-bold text-xs transition-all border border-[var(--border)] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Strategy Modal */}
      {editingStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#4F39F6]" /> Edit Strategy Setup Rules
                </h3>
                <button
                  onClick={() => setEditingStrategy(null)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">Strategy Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[#4F39F6] font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">Target Risk-to-Reward</label>
                  <input
                    type="text"
                    value={customRR}
                    onChange={(e) => setCustomRR(e.target.value)}
                    className="w-full bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[#4F39F6]"
                  />
                </div>

                {/* Manage Checklist Rules */}
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1.5">
                    Confirmation Rules ({customRules.length})
                  </label>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {customRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs gap-2">
                        <span className="flex-1 text-[var(--foreground)] text-[11px]">{rule}</span>
                        <button
                          type="button"
                          onClick={() => setCustomRules(customRules.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                          title="Remove rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={newCustomRuleText}
                      onChange={(e) => setNewCustomRuleText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCustomRuleText.trim()) {
                          setCustomRules([...customRules, newCustomRuleText.trim()]);
                          setNewCustomRuleText("");
                        }
                      }}
                      placeholder="Add rule (e.g. Bias 1D, 4H, 1H / SMT)..."
                      className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[#4F39F6]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCustomRuleText.trim()) return;
                        setCustomRules([...customRules, newCustomRuleText.trim()]);
                        setNewCustomRuleText("");
                      }}
                      className="px-3 py-1.5 bg-[#4F39F6] text-white rounded-xl text-xs font-bold hover:bg-[#4338CA] transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setEditingStrategy(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newMap = { ...strategyChecklists, [customName]: customRules };
                  saveChecklists(newMap);
                  setEditingStrategy(null);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#4F39F6] text-white hover:bg-[#4338CA] transition-all cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Trade Modal from Playbook */}
      {isAddTradeOpen && (
        <AddTradeModal
          isOpen={isAddTradeOpen}
          onClose={() => setIsAddTradeOpen(false)}
          onAddTrade={addTrade}
          initialTrade={{
            id: "",
            symbol: "EURUSD",
            direction: "Long",
            entryPrice: 0,
            exitPrice: 0,
            lotSize: 0.1,
            sl: 0,
            tp: 0,
            netPnL: 0,
            rMultiple: 2,
            category: "Forex",
            session: "London",
            timePeriod: "London silver bullet",
            date: new Date().toISOString().split("T")[0],
            rulesFollowed: true,
            emotion: "Calm",
            mistake: "None",
            strategy: "Order Flow",
            notes: `Pre-Trade Confluence Score: ${totalScore}/100 Marks. Bias: ${playbookScoring.biasFrames.join(', ') || 'None'} | SB: ${playbookScoring.sbSession || 'None'} | PDA: ${playbookScoring.pdaType || 'None'} | 1M: ${playbookScoring.entry1m || 'None'} | SMT: ${playbookScoring.smtType || 'None'}`,
            status: "Win",
            confluenceScore: totalScore,
            playbookDetails: playbookScoring,
            confirmations: [
              ...(playbookScoring.biasFrames.length > 0 ? [`Bias: ${playbookScoring.biasFrames.join('+')}`] : []),
              ...(playbookScoring.sbSession ? [`SB: ${playbookScoring.sbSession}`] : []),
              ...(playbookScoring.pdaType ? [`PDA: ${playbookScoring.pdaType}`] : []),
              ...(playbookScoring.entry1m ? [`1M: ${playbookScoring.entry1m}`] : []),
              ...(playbookScoring.smtType ? [`SMT: ${playbookScoring.smtType}`] : [])
            ]
          }}
        />
      )}

    </div>
  );
}
