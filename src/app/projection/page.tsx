"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Circle,
  Percent,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RotateCcw,
  Sparkles,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  BarChart3,
  Coins,
  ShieldCheck,
  Zap,
  Info,
  Check,
  Pencil,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Settings2,
  X,
  Calendar,
  Clock,
  Target,
  Flame,
  Milestone,
  AlertTriangle,
  Activity
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid
} from "recharts";
import * as XLSX from "xlsx";
import {
  DEFAULT_PROJECTION_PRESETS,
  EXTRA_PROJECTION_TEMPLATES,
  ProjectionPreset,
  ProjectionTrade
} from "@/data/projectionPresets";
import {
  generateAutoCompoundPlan,
  generateCustomCompoundPlan,
  RiskModelType,
  CustomCompoundType
} from "@/lib/smartCompoundEngine";

export type TradeOutcome = "PENDING" | "WIN" | "LOSS" | "BE";

export interface TradeExecutionRecord {
  outcome: TradeOutcome;
  date: string;
  customPnl?: number;
  isManualDate?: boolean;
}

interface SteppingRuleTier {
  id: string;
  fromTrade: number;
  toTrade: number | string;
  lotSize: number | string;
  riskUSD: number | string;
}

// Calculate business day projected date (skipping Saturday & Sunday for Forex)
function getProjectedDate(startDateStr: string, tradeIndex: number, tradesPerDay: number, includeWeekends = false): Date {
  const cleanStartStr = startDateStr.includes("T") ? startDateStr : `${startDateStr}T00:00:00`;
  const start = new Date(cleanStartStr);
  if (isNaN(start.getTime())) return new Date();

  const dayOffset = Math.floor(tradeIndex / Math.max(1, tradesPerDay));

  if (includeWeekends) {
    const res = new Date(start);
    res.setDate(res.getDate() + dayOffset);
    return res;
  }

  const res = new Date(start);
  let curDay = res.getDay();
  if (curDay === 6) res.setDate(res.getDate() + 2);
  else if (curDay === 0) res.setDate(res.getDate() + 1);

  let daysAdded = 0;
  while (daysAdded < dayOffset) {
    res.setDate(res.getDate() + 1);
    const d = res.getDay();
    if (d !== 0 && d !== 6) {
      daysAdded++;
    }
  }
  return res;
}

// Return formatted YYYY-MM-DD string for a projected trade date
function getProjectedDateStr(startDateStr: string, tradeIndex: number, tradesPerDay: number, includeWeekends = false): string {
  const d = getProjectedDate(startDateStr, tradeIndex, tradesPerDay, includeWeekends);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseSafeDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  if (!d) return new Date();
  const dateStr = typeof d === "string" && !d.includes("T") ? `${d}T00:00:00` : d;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatDateDisplay(d: Date | string): string {
  const dateObj = parseSafeDate(d);
  return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(d: Date | string): string {
  const dateObj = parseSafeDate(d);
  return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayName(d: Date | string): string {
  const dateObj = parseSafeDate(d);
  return dateObj.toLocaleDateString("en-US", { weekday: "short" });
}

export default function ProjectionPage() {
  // All active plans (Defaults + Custom Plans saved in localStorage)
  const [plans, setPlans] = useState<ProjectionPreset[]>(DEFAULT_PROJECTION_PRESETS);
  const [activePlanId, setActivePlanId] = useState<string>("micro-challenge-30");

  // Exchange rate USD -> LKR
  const [fxRate, setFxRate] = useState<number>(300);
  const [isLiveFx, setIsLiveFx] = useState<boolean>(true);
  const [isFetchingFx, setIsFetchingFx] = useState<boolean>(false);
  const [fxLastUpdated, setFxLastUpdated] = useState<string>("");
  const [isEditingFx, setIsEditingFx] = useState<boolean>(false);
  const [manualFxInput, setManualFxInput] = useState<string>("300");

  // Currency display mode: 'BOTH' | 'USD' | 'LKR'
  const [currencyMode, setCurrencyMode] = useState<"BOTH" | "USD" | "LKR">("BOTH");

  // Trade Executions (WIN, LOSS, BE, Date): { [planId]: { [tradeNum]: TradeExecutionRecord } }
  const [tradeExecutionsMap, setTradeExecutionsMap] = useState<Record<string, Record<number, TradeExecutionRecord>>>({});

  // Daily Pace & Target Projection Controls (2 trades per day by default)
  const [tradesPerDay, setTradesPerDay] = useState<number>(2);
  const [planStartDate, setPlanStartDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [includeWeekends, setIncludeWeekends] = useState<boolean>(false);

  // Pagination & Filters
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WINS" | "LOSSES" | "PENDING">("ALL");

  // Outcome popover state for quick selection
  const [activeOutcomePopoverTradeNum, setActiveOutcomePopoverTradeNum] = useState<number | null>(null);

  // Modals state
  const [isEditRowOpen, setIsEditRowOpen] = useState<boolean>(false);
  const [editingTrade, setEditingTrade] = useState<ProjectionTrade | null>(null);
  const [editLotInput, setEditLotInput] = useState<string>("0.01");
  const [editRiskInput, setEditRiskInput] = useState<string>("5");
  const [editOutcomeInput, setEditOutcomeInput] = useState<TradeOutcome>("WIN");
  const [editCustomPnlInput, setEditCustomPnlInput] = useState<string>("");
  const [applyForward, setApplyForward] = useState<boolean>(true);

  // Date edit modal / popover
  const [editingDateTradeNum, setEditingDateTradeNum] = useState<number | null>(null);
  const [dateInputVal, setDateInputVal] = useState<string>("");

  // Stepping Rules Config Modal
  const [isSteppingModalOpen, setIsSteppingModalOpen] = useState<boolean>(false);
  const [steppingTiers, setSteppingTiers] = useState<SteppingRuleTier[]>([]);

  // Add New Plan Modal
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState<boolean>(false);
  const [addPlanTab, setAddPlanTab] = useState<"auto" | "custom" | "templates">("auto");
  const [newPlanName, setNewPlanName] = useState<string>("");

  // Auto Smart Compound Generator States (Default to $5 as user requested!)
  const [accountCategory, setAccountCategory] = useState<"micro" | "funded">("micro");
  const [autoStartCap, setAutoStartCap] = useState<number>(5);
  const [autoTargetCap, setAutoTargetCap] = useState<number>(500);
  const [autoRiskModel, setAutoRiskModel] = useState<RiskModelType>("micro_growth");
  const [autoCustomRiskPct, setAutoCustomRiskPct] = useState<number>(0.5);
  const [autoRR, setAutoRR] = useState<number>(2.0);

  // Custom Compound Plan States
  const [customCompoundType, setCustomCompoundType] = useState<CustomCompoundType>("tier_scaling");
  const [newPlanStartCap, setNewPlanStartCap] = useState<number>(5);
  const [newPlanLot, setNewPlanLot] = useState<number>(0.01);
  const [newPlanRiskUSD, setNewPlanRiskUSD] = useState<number>(5);
  const [customRiskPercent, setCustomRiskPercent] = useState<number>(2.5);
  const [newPlanTradeCount, setNewPlanTradeCount] = useState<number>(100);
  const [newPlanRR, setNewPlanRR] = useState<number>(2.0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("custom");

  // Real-time Preview Plan for the Auto Generator
  const autoPreviewPlan = useMemo(() => {
    try {
      return generateAutoCompoundPlan({
        startingBalance: autoStartCap,
        targetBalance: autoTargetCap,
        riskModel: autoRiskModel,
        customRiskPct: autoCustomRiskPct,
        rrRatio: autoRR,
        fxRate,
        accountType: accountCategory
      });
    } catch {
      return null;
    }
  }, [autoStartCap, autoTargetCap, autoRiskModel, autoCustomRiskPct, autoRR, fxRate, accountCategory]);

  // Edit Existing Plan Modal States
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState<boolean>(false);
  const [editingPlanId, setEditingPlanId] = useState<string>("");
  const [editPlanTitle, setEditPlanTitle] = useState<string>("");
  const [editPlanBadge, setEditPlanBadge] = useState<string>("");
  const [editPlanCategory, setEditPlanCategory] = useState<"micro" | "funded">("micro");
  const [editPlanStartCap, setEditPlanStartCap] = useState<number>(100);
  const [editPlanTargetCap, setEditPlanTargetCap] = useState<number>(500);
  const [editPlanRiskModel, setEditPlanRiskModel] = useState<RiskModelType>("micro_growth");
  const [editPlanCustomRiskPct, setEditPlanCustomRiskPct] = useState<number>(0.5);
  const [editPlanRR, setEditPlanRR] = useState<number>(2.0);
  const [editPlanKeepExecutions, setEditPlanKeepExecutions] = useState<boolean>(true);

  // Real-time Preview Plan for Edit Plan Modal
  const editPreviewPlan = useMemo(() => {
    if (!isEditPlanModalOpen) return null;
    try {
      return generateAutoCompoundPlan({
        startingBalance: editPlanStartCap,
        targetBalance: editPlanTargetCap,
        riskModel: editPlanRiskModel,
        customRiskPct: editPlanCustomRiskPct,
        rrRatio: editPlanRR,
        fxRate,
        accountType: editPlanCategory,
        planName: editPlanTitle
      });
    } catch {
      return null;
    }
  }, [isEditPlanModalOpen, editPlanStartCap, editPlanTargetCap, editPlanRiskModel, editPlanCustomRiskPct, editPlanRR, fxRate, editPlanCategory, editPlanTitle]);

  // Fetch Live USD/LKR rate from API
  const fetchLiveFxRate = useCallback(async () => {
    setIsFetchingFx(true);
    try {
      const res = await fetch("/api/fx-rate");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.rate === "number" && data.rate > 0) {
          setFxRate(data.rate);
          setManualFxInput(String(data.rate));
          setFxLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          setIsLiveFx(true);
        }
      }
    } catch (err) {
      console.warn("Error fetching live FX rate:", err);
    } finally {
      setIsFetchingFx(false);
    }
  }, []);

  // Load plans & settings from localStorage on mount
  useEffect(() => {
    try {
      // 1. Saved Custom Plans
      const savedPlans = localStorage.getItem("uc_projection_saved_plans_v2");
      if (savedPlans) {
        const parsed = JSON.parse(savedPlans);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlans(parsed);
          if (parsed.some((p: ProjectionPreset) => p.id === activePlanId)) {
            // keep
          } else {
            setActivePlanId(parsed[0].id);
          }
        }
      }

      // 2. Daily Pace Settings (Enforce strictly 2 trades per day by default)
      const savedPace = localStorage.getItem("uc_projection_pace_settings_v3") || localStorage.getItem("uc_projection_pace_settings");
      let activePace = 2;
      let activeStart = new Date().toISOString().split("T")[0];
      let activeWeekends = false;

      if (savedPace) {
        try {
          const parsedPace = JSON.parse(savedPace);
          // Default to 2 trades per day (upgrade any legacy 1-trade setting to 2)
          if (parsedPace.tradesPerDay && parsedPace.tradesPerDay >= 2) {
            activePace = parsedPace.tradesPerDay;
          } else {
            activePace = 2;
          }
          if (parsedPace.planStartDate) activeStart = parsedPace.planStartDate;
          if (typeof parsedPace.includeWeekends === "boolean") activeWeekends = parsedPace.includeWeekends;
        } catch {
          // ignore
        }
      }
      setTradesPerDay(activePace);
      setPlanStartDate(activeStart);
      setIncludeWeekends(activeWeekends);

      // 3. Load Executions Map (with backwards compatibility for previous completed trades)
      const savedExecutions = localStorage.getItem("uc_projection_trade_executions_v3");
      let loadedExecMap: Record<string, Record<number, TradeExecutionRecord>> = {};
      if (savedExecutions) {
        try {
          loadedExecMap = JSON.parse(savedExecutions);
        } catch {
          loadedExecMap = {};
        }
      } else {
        // Fallback: migrate from previous completedTradesMap & tradeDatesMap if present
        const oldCompleted = localStorage.getItem("uc_projection_completed_trades");
        const oldDates = localStorage.getItem("uc_projection_trade_dates_v2");
        if (oldCompleted) {
          try {
            const parsedComp: Record<string, number[]> = JSON.parse(oldCompleted);
            const parsedDates: Record<string, Record<number, string>> = oldDates ? JSON.parse(oldDates) : {};
            for (const [pId, list] of Object.entries(parsedComp)) {
              loadedExecMap[pId] = {};
              for (const tNum of list) {
                loadedExecMap[pId][tNum] = {
                  outcome: "WIN",
                  date: parsedDates[pId]?.[tNum] || getProjectedDateStr(activeStart, tNum - 1, activePace, activeWeekends)
                };
              }
            }
          } catch {
            // ignore
          }
        }
      }

      // Auto-realign any non-manual dates to strictly follow the 2-trades-per-day schedule
      // (e.g. if Trade 3 was previously stamped with Oct 26 instead of Day 2 Oct 27, auto-correct it)
      let hasDateCorrection = false;
      for (const [, execs] of Object.entries(loadedExecMap)) {
        for (const [tNumStr, rec] of Object.entries(execs)) {
          const tNum = Number(tNumStr);
          if (!rec.isManualDate) {
            const correctDate = getProjectedDateStr(activeStart, tNum - 1, activePace, activeWeekends);
            if (rec.date !== correctDate) {
              rec.date = correctDate;
              hasDateCorrection = true;
            }
          }
        }
      }
      setTradeExecutionsMap(loadedExecMap);
      if (hasDateCorrection) {
        localStorage.setItem("uc_projection_trade_executions_v3", JSON.stringify(loadedExecMap));
      }

      // 4. Saved manual FX rate if set
      const savedManualFx = localStorage.getItem("uc_projection_manual_fx");
      if (savedManualFx) {
        const parsedRate = Number(savedManualFx);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          setFxRate(parsedRate);
          setManualFxInput(String(parsedRate));
          setIsLiveFx(false);
        }
      }
    } catch (e) {
      console.warn("Storage load error:", e);
    }

    // Fetch live FX rate
    fetchLiveFxRate();
  }, [fetchLiveFxRate]);

  // Save plans
  const persistPlans = (updatedPlans: ProjectionPreset[]) => {
    setPlans(updatedPlans);
    try {
      localStorage.setItem("uc_projection_saved_plans_v2", JSON.stringify(updatedPlans));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  };

  // Save trade executions map
  const saveExecutionsMap = (newMap: Record<string, Record<number, TradeExecutionRecord>>) => {
    setTradeExecutionsMap(newMap);
    try {
      localStorage.setItem("uc_projection_trade_executions_v3", JSON.stringify(newMap));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  };

  // Save pace settings and sync non-manual trade dates
  const savePaceSettings = (tPerDay: number, sDate: string, incWeekends: boolean) => {
    setTradesPerDay(tPerDay);
    setPlanStartDate(sDate);
    setIncludeWeekends(incWeekends);
    try {
      const payload = {
        tradesPerDay: tPerDay,
        planStartDate: sDate,
        includeWeekends: incWeekends
      };
      localStorage.setItem("uc_projection_pace_settings_v3", JSON.stringify(payload));
      localStorage.setItem("uc_projection_pace_settings", JSON.stringify(payload));
    } catch (e) {
      console.warn(e);
    }

    // Automatically re-align non-manual trade dates to the updated schedule
    setTradeExecutionsMap((prevMap) => {
      const currentPlanExecs = prevMap[activePlan.id];
      if (!currentPlanExecs) return prevMap;
      const updatedPlanExec = { ...currentPlanExecs };
      let changed = false;
      for (const [tNumStr, rec] of Object.entries(updatedPlanExec)) {
        const tNum = Number(tNumStr);
        if (!rec.isManualDate) {
          const newScheduledDate = getProjectedDateStr(sDate, tNum - 1, tPerDay, incWeekends);
          if (rec.date !== newScheduledDate) {
            rec.date = newScheduledDate;
            changed = true;
          }
        }
      }
      if (!changed) return prevMap;
      const newMap = { ...prevMap, [activePlan.id]: updatedPlanExec };
      try {
        localStorage.setItem("uc_projection_trade_executions_v3", JSON.stringify(newMap));
      } catch (e) {
        console.warn(e);
      }
      return newMap;
    });
  };

  // Active Plan object
  const activePlan = useMemo<ProjectionPreset>(() => {
    const found = plans.find(p => p.id === activePlanId);
    return found || plans[0] || DEFAULT_PROJECTION_PRESETS[0];
  }, [plans, activePlanId]);

  // Executions for active plan
  const activeExecutions = useMemo(() => {
    return tradeExecutionsMap[activePlan.id] || {};
  }, [tradeExecutionsMap, activePlan.id]);

  // DYNAMIC TRADES CASCADE ENGINE (With Real Loss Recalculation!)
  // Every trade's starting balance cascades from the previous trade's ending balance.
  // If a trade is a WIN: +1:2 Profit (or custom profit).
  // If a trade is a LOSS: -Risk (capital drops!).
  // If a trade is BE: $0 PnL.
  // Future pending trades then continue the compounding path starting from that exact new balance!
  const dynamicTrades = useMemo<Array<ProjectionTrade & { outcome: TradeOutcome; executionDate: string; isExecuted: boolean }>>(() => {
    if (!activePlan || !activePlan.trades) return [];

    const result: Array<ProjectionTrade & { outcome: TradeOutcome; executionDate: string; isExecuted: boolean }> = [];
    let runningCapital = activePlan.trades[0]?.projectedCapital || activePlan.startingBalance;

    for (let i = 0; i < activePlan.trades.length; i++) {
      const base = activePlan.trades[i];
      const exec = activeExecutions[base.tradeNum];
      const outcome = exec?.outcome || "PENDING";
      const isExecuted = outcome !== "PENDING";

      const riskVal = base.risk;
      const lotVal = base.lotSize;
      let profitValUSD: number;

      if (outcome === "WIN") {
        profitValUSD = exec?.customPnl !== undefined ? exec.customPnl : base.profitUSD;
      } else if (outcome === "LOSS") {
        profitValUSD = exec?.customPnl !== undefined ? -Math.abs(exec.customPnl) : -riskVal;
      } else if (outcome === "BE") {
        profitValUSD = 0;
      } else {
        // Pending: standard projected profit
        profitValUSD = base.profitUSD;
      }

      const endBalUSD = Number((runningCapital + profitValUSD).toFixed(2));
      const riskPct = runningCapital > 0 ? Number(((riskVal / runningCapital) * 100).toFixed(2)) : 0;
      const profitLKR = Math.round(profitValUSD * fxRate);
      const targetLKR = Math.round(endBalUSD * fxRate);

      result.push({
        ...base,
        projectedCapital: Number(runningCapital.toFixed(2)),
        risk: riskVal,
        riskPct,
        lotSize: lotVal,
        profitUSD: profitValUSD,
        profitLKR,
        endBalanceUSD: endBalUSD,
        targetLKRBalance: targetLKR,
        outcome,
        executionDate: exec?.date || "",
        isExecuted
      });

      runningCapital = endBalUSD;
    }

    return result;
  }, [activePlan, activeExecutions, fxRate]);

  // Set outcome for a trade (WIN, LOSS, BE, or PENDING) with 2 Trades/Day schedule date
  const setTradeOutcome = (tradeNum: number, outcome: TradeOutcome, customPnl?: number) => {
    const updatedPlanExec = { ...(tradeExecutionsMap[activePlan.id] || {}) };

    if (outcome === "PENDING") {
      delete updatedPlanExec[tradeNum];
    } else {
      // Scheduled date following 2 trades/day model
      const scheduledDate = getProjectedDateStr(planStartDate, tradeNum - 1, tradesPerDay, includeWeekends);
      const isManual = updatedPlanExec[tradeNum]?.isManualDate;
      const finalDate = isManual ? (updatedPlanExec[tradeNum]?.date || scheduledDate) : scheduledDate;

      updatedPlanExec[tradeNum] = {
        outcome,
        date: finalDate,
        isManualDate: isManual,
        ...(customPnl !== undefined ? { customPnl } : {})
      };
    }

    const newMap = {
      ...tradeExecutionsMap,
      [activePlan.id]: updatedPlanExec
    };
    saveExecutionsMap(newMap);
    setActiveOutcomePopoverTradeNum(null);
  };

  // Quick cycle outcome: PENDING -> WIN -> LOSS -> PENDING
  const cycleTradeOutcome = (tradeNum: number) => {
    const curOutcome = activeExecutions[tradeNum]?.outcome || "PENDING";
    if (curOutcome === "PENDING") {
      setTradeOutcome(tradeNum, "WIN");
    } else if (curOutcome === "WIN") {
      setTradeOutcome(tradeNum, "LOSS");
    } else if (curOutcome === "LOSS") {
      setTradeOutcome(tradeNum, "BE");
    } else {
      setTradeOutcome(tradeNum, "PENDING");
    }
  };

  // Mark all trades up to N as WIN with 2 Trades/Day calendar alignment
  const markUpToTrade = (tradeNum: number) => {
    const updatedPlanExec = { ...(tradeExecutionsMap[activePlan.id] || {}) };

    for (let i = 1; i <= tradeNum; i++) {
      const scheduledDate = getProjectedDateStr(planStartDate, i - 1, tradesPerDay, includeWeekends);
      const isManual = updatedPlanExec[i]?.isManualDate;
      const finalDate = isManual ? (updatedPlanExec[i]?.date || scheduledDate) : scheduledDate;

      if (!updatedPlanExec[i] || updatedPlanExec[i].outcome === "PENDING") {
        updatedPlanExec[i] = {
          outcome: "WIN",
          date: finalDate,
          isManualDate: isManual
        };
      }
    }

    const newMap = {
      ...tradeExecutionsMap,
      [activePlan.id]: updatedPlanExec
    };
    saveExecutionsMap(newMap);
  };

  // Re-align all executed trades strictly to the 2-trades-per-day calendar schedule
  const realignAllTradeDates = () => {
    const currentExecs = tradeExecutionsMap[activePlan.id];
    if (!currentExecs) return;

    const updatedPlanExec = { ...currentExecs };
    const tradeNums = Object.keys(updatedPlanExec).map(Number).sort((a, b) => a - b);

    for (const tNum of tradeNums) {
      if (updatedPlanExec[tNum] && updatedPlanExec[tNum].outcome !== "PENDING") {
        const scheduledDate = getProjectedDateStr(planStartDate, tNum - 1, tradesPerDay, includeWeekends);
        updatedPlanExec[tNum] = {
          ...updatedPlanExec[tNum],
          date: scheduledDate,
          isManualDate: false
        };
      }
    }

    const newMap = {
      ...tradeExecutionsMap,
      [activePlan.id]: updatedPlanExec
    };
    saveExecutionsMap(newMap);
  };

  // Save manually edited completion date for a trade
  const handleSaveTradeDate = (tradeNum: number, newDate: string) => {
    const updatedPlanExec = { ...(tradeExecutionsMap[activePlan.id] || {}) };
    if (updatedPlanExec[tradeNum]) {
      updatedPlanExec[tradeNum] = {
        ...updatedPlanExec[tradeNum],
        date: newDate,
        isManualDate: true
      };
      const newMap = {
        ...tradeExecutionsMap,
        [activePlan.id]: updatedPlanExec
      };
      saveExecutionsMap(newMap);
    }
    setEditingDateTradeNum(null);
  };

  // Reset all executions for this plan
  const resetPresetProgress = () => {
    if (window.confirm("Are you sure you want to reset all win/loss checkmarks & execution history for this plan?")) {
      const newMap = {
        ...tradeExecutionsMap,
        [activePlan.id]: {}
      };
      saveExecutionsMap(newMap);
    }
  };

  // Reset plan to original default data
  const resetPlanToDefault = () => {
    const orig = DEFAULT_PROJECTION_PRESETS.find(p => p.id === activePlan.id) ||
      EXTRA_PROJECTION_TEMPLATES.find(p => p.id === activePlan.id);

    if (!orig) {
      alert("This is a custom user plan. To reconfigure it, use the Edit or Stepping tools.");
      return;
    }

    if (window.confirm(`Reset "${activePlan.title}" back to its original default values?`)) {
      const updated = plans.map(p => p.id === activePlan.id ? orig : p);
      persistPlans(updated);
    }
  };

  // Append 10 recovery trades to extend runway
  const appendRecoveryTrades = () => {
    if (dynamicTrades.length === 0) return;
    const lastTrade = dynamicTrades[dynamicTrades.length - 1];
    const newTrades: ProjectionTrade[] = [...activePlan.trades];
    let runningCap = lastTrade.endBalanceUSD;
    const riskVal = lastTrade.risk;
    const lotVal = lastTrade.lotSize;
    const profitVal = Number((riskVal * 2.0).toFixed(2));

    for (let i = 1; i <= 10; i++) {
      const tNum = newTrades.length + 1;
      const endBal = Number((runningCap + profitVal).toFixed(2));
      const riskPct = runningCap > 0 ? Number(((riskVal / runningCap) * 100).toFixed(2)) : 0;

      newTrades.push({
        tradeNum: tNum,
        sheetTradeNum: tNum,
        projectedCapital: runningCap,
        risk: riskVal,
        riskPct,
        lotSize: lotVal,
        profitUSD: profitVal,
        profitLKR: Math.round(profitVal * fxRate),
        endBalanceUSD: endBal,
        targetLKRBalance: Math.round(endBal * fxRate)
      });
      runningCap = endBal;
    }

    const updatedPlan: ProjectionPreset = {
      ...activePlan,
      totalTrades: newTrades.length,
      targetBalance: newTrades[newTrades.length - 1].endBalanceUSD,
      trades: newTrades
    };

    persistPlans(plans.map(p => p.id === activePlan.id ? updatedPlan : p));
  };

  // Calculated Stats
  const winsCount = dynamicTrades.filter(t => t.outcome === "WIN").length;
  const lossesCount = dynamicTrades.filter(t => t.outcome === "LOSS").length;
  const beCount = dynamicTrades.filter(t => t.outcome === "BE").length;
  const executedTotal = winsCount + lossesCount + beCount;
  const winRatePct = (winsCount + lossesCount) > 0 ? Number(((winsCount / (winsCount + lossesCount)) * 100).toFixed(1)) : 100;

  // Realized net profit from executed trades
  const executedTrades = dynamicTrades.filter(t => t.isExecuted);
  const realizedPnLUSD = executedTrades.reduce((acc, t) => acc + t.profitUSD, 0);
  const realizedPnLLKR = Math.round(realizedPnLUSD * fxRate);

  // Current active trade index (first pending trade)
  const currentTradeIndex = useMemo(() => {
    for (let i = 0; i < dynamicTrades.length; i++) {
      if (dynamicTrades[i].outcome === "PENDING") {
        return i;
      }
    }
    return dynamicTrades.length - 1;
  }, [dynamicTrades]);

  const currentTrade = dynamicTrades[currentTradeIndex] || dynamicTrades[0] || {
    tradeNum: 1,
    sheetTradeNum: 1,
    projectedCapital: 30,
    risk: 5,
    riskPct: 16.67,
    lotSize: 0.01,
    profitUSD: 10,
    profitLKR: 3000,
    endBalanceUSD: 40,
    targetLKRBalance: 12000,
    outcome: "PENDING" as TradeOutcome,
    executionDate: "",
    isExecuted: false
  };

  // Current Actual Balance (End balance of last executed trade, or starting balance)
  const currentActualBalanceUSD = executedTrades.length > 0
    ? executedTrades[executedTrades.length - 1].endBalanceUSD
    : (dynamicTrades[0]?.projectedCapital || activePlan.startingBalance);
  const currentActualBalanceLKR = Math.round(currentActualBalanceUSD * fxRate);

  // High-water mark (peak balance achieved so far)
  const peakBalanceUSD = Math.max(
    activePlan.startingBalance,
    ...executedTrades.map(t => t.endBalanceUSD)
  );
  const currentDrawdownUSD = Math.max(0, Number((peakBalanceUSD - currentActualBalanceUSD).toFixed(2)));

  // Starting & Target stats
  const startingCapUSD = dynamicTrades.length > 0 ? dynamicTrades[0].projectedCapital : activePlan.startingBalance;
  const startingCapLKR = Math.round(startingCapUSD * fxRate);
  const targetCapUSD = dynamicTrades.length > 0 ? dynamicTrades[dynamicTrades.length - 1].endBalanceUSD : activePlan.targetBalance;
  const targetCapLKR = Math.round(targetCapUSD * fxRate);
  const progressPct = dynamicTrades.length > 0 ? Number(((winsCount / dynamicTrades.length) * 100).toFixed(1)) : 0;
  const multipleGrowth = startingCapUSD > 0 ? (targetCapUSD / startingCapUSD).toFixed(1) : "0";

  // Timeline Milestones
  const timelineMilestones = useMemo(() => {
    if (dynamicTrades.length === 0) return null;

    const totalTrades = dynamicTrades.length;
    const tradingDaysNeeded = Math.ceil(totalTrades / Math.max(1, tradesPerDay));
    const finishDate = getProjectedDate(planStartDate, totalTrades - 1, tradesPerDay, includeWeekends);

    const tradesPerWeek = tradesPerDay * (includeWeekends ? 7 : 5);
    const expected2Weeks = tradesPerWeek * 2;
    const expected1Month = tradesPerWeek * 4;
    const expected2Months = tradesPerWeek * 8;
    const expected3Months = tradesPerWeek * 12;

    const trades2Weeks = Math.min(totalTrades, expected2Weeks);
    const trades1Month = Math.min(totalTrades, expected1Month);
    const trades2Months = Math.min(totalTrades, expected2Months);
    const trades3Months = Math.min(totalTrades, expected3Months);

    const getMilestoneData = (targetTradeCount: number, expectedCount: number) => {
      const isCompletedEarly = totalTrades < expectedCount;
      const idx = Math.min(dynamicTrades.length - 1, Math.max(0, targetTradeCount - 1));
      const tr = dynamicTrades[idx];
      const pDate = getProjectedDate(planStartDate, idx, tradesPerDay, includeWeekends);
      return {
        tradeCount: targetTradeCount,
        expectedCount,
        isCompletedEarly,
        date: pDate,
        dateStr: formatDateDisplay(pDate),
        balanceUSD: tr.endBalanceUSD,
        balanceLKR: tr.targetLKRBalance,
        profitUSD: tr.endBalanceUSD - startingCapUSD,
        profitLKR: tr.targetLKRBalance - startingCapLKR,
        lotSize: tr.lotSize
      };
    };

    return {
      totalTrades,
      tradesPerDay,
      tradesPerWeek,
      tradingDaysNeeded,
      finishDate,
      finishDateStr: formatDateDisplay(finishDate),
      milestone2Weeks: getMilestoneData(trades2Weeks, expected2Weeks),
      milestone1Month: getMilestoneData(trades1Month, expected1Month),
      milestone2Months: getMilestoneData(trades2Months, expected2Months),
      milestone3Months: getMilestoneData(trades3Months, expected3Months)
    };
  }, [dynamicTrades, tradesPerDay, planStartDate, includeWeekends, startingCapUSD, startingCapLKR]);

  // Stepping stages breakdown
  const steppingStages = useMemo(() => {
    const stages: { stageNum: number; startTrade: number; endTrade: number; lotSize: number; risk: number; profitUSD: number; startBal: number; endBal: number }[] = [];
    let currentLot = -1;
    let stageStart = 1;
    let startBal = 0;

    for (let i = 0; i < dynamicTrades.length; i++) {
      const t = dynamicTrades[i];
      if (t.lotSize !== currentLot) {
        if (currentLot !== -1) {
          stages.push({
            stageNum: stages.length + 1,
            startTrade: stageStart,
            endTrade: dynamicTrades[i - 1].tradeNum,
            lotSize: currentLot,
            risk: dynamicTrades[i - 1].risk,
            profitUSD: dynamicTrades[i - 1].profitUSD,
            startBal: startBal,
            endBal: dynamicTrades[i - 1].endBalanceUSD
          });
        }
        currentLot = t.lotSize;
        stageStart = t.tradeNum;
        startBal = t.projectedCapital;
      }
    }

    if (currentLot !== -1 && dynamicTrades.length > 0) {
      stages.push({
        stageNum: stages.length + 1,
        startTrade: stageStart,
        endTrade: dynamicTrades[dynamicTrades.length - 1].tradeNum,
        lotSize: currentLot,
        risk: dynamicTrades[dynamicTrades.length - 1].risk,
        profitUSD: dynamicTrades[dynamicTrades.length - 1].profitUSD,
        startBal: startBal,
        endBal: dynamicTrades[dynamicTrades.length - 1].endBalanceUSD
      });
    }

    return stages;
  }, [dynamicTrades]);

  // Dynamic Risk-to-Lot correlation ratio for active plan ($ per 1.00 lot)
  const planRiskPerLot = useMemo(() => {
    const baseTrade = activePlan.trades[0];
    if (baseTrade && baseTrade.lotSize > 0 && baseTrade.risk > 0) {
      return baseTrade.risk / baseTrade.lotSize;
    }
    return 500;
  }, [activePlan]);

  // Dynamic Risk-to-Lot correlation ratio for currently edited trade
  const editRiskPerLotRatio = useMemo(() => {
    if (editingTrade && editingTrade.lotSize > 0 && editingTrade.risk > 0) {
      return editingTrade.risk / editingTrade.lotSize;
    }
    return planRiskPerLot;
  }, [editingTrade, planRiskPerLot]);

  // Open Edit Row Modal
  const openEditRow = (trade: ProjectionTrade & { outcome: TradeOutcome }, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrade(trade);
    const cleanLot = Math.max(0.01, Math.round(trade.lotSize * 100) / 100);
    setEditLotInput(cleanLot.toFixed(2));
    setEditRiskInput(String(Math.round(trade.risk * 100) / 100));
    setEditOutcomeInput(trade.outcome);
    setEditCustomPnlInput(trade.outcome !== "PENDING" ? String(trade.profitUSD) : "");
    setApplyForward(true);
    setIsEditRowOpen(true);
  };

  // Save Trade Row Edit
  const handleSaveTradeEdit = () => {
    if (!editingTrade) return;
    const newLot = Math.max(0.01, Math.round((Number(editLotInput) || 0.01) * 100) / 100);
    const newRisk = Math.max(0.1, Math.round((Number(editRiskInput) || 5) * 100) / 100);

    // 1. Update outcome in executions map
    const customPnlNum = editCustomPnlInput.trim() !== "" ? Number(editCustomPnlInput) : undefined;
    setTradeOutcome(editingTrade.tradeNum, editOutcomeInput, customPnlNum);

    // 2. Update lot size & risk in base plan if modified
    const updatedTrades: ProjectionTrade[] = [...activePlan.trades];
    const targetIdx = updatedTrades.findIndex(t => t.tradeNum === editingTrade.tradeNum);
    if (targetIdx !== -1) {
      const origRR = editingTrade.risk > 0 ? (editingTrade.profitUSD / editingTrade.risk) : 2.0;

      if (applyForward) {
        for (let i = targetIdx; i < updatedTrades.length; i++) {
          updatedTrades[i] = {
            ...updatedTrades[i],
            lotSize: newLot,
            risk: newRisk,
            profitUSD: Number((newRisk * origRR).toFixed(2))
          };
        }
      } else {
        updatedTrades[targetIdx] = {
          ...updatedTrades[targetIdx],
          lotSize: newLot,
          risk: newRisk,
          profitUSD: Number((newRisk * origRR).toFixed(2))
        };
      }

      const updatedPlan: ProjectionPreset = {
        ...activePlan,
        trades: updatedTrades
      };
      persistPlans(plans.map(p => p.id === activePlan.id ? updatedPlan : p));
    }

    setIsEditRowOpen(false);
  };

  // Open Stepping Rules Modal with automatic contiguous chaining
  const openSteppingModal = () => {
    let currentTiers: SteppingRuleTier[] = [];
    if (steppingStages.length > 0) {
      currentTiers = steppingStages.map((stg, idx) => {
        const cleanLot = Math.max(0.01, Math.round(stg.lotSize * 100) / 100);
        return {
          id: `tier-${idx}-${Date.now()}`,
          fromTrade: stg.startTrade,
          toTrade: stg.endTrade,
          lotSize: cleanLot.toFixed(2),
          riskUSD: String(Math.round(stg.risk * 100) / 100)
        };
      });
      // Enforce clean contiguous sequence: Tier 1 starts at 1, each subsequent starts at prev + 1
      currentTiers[0].fromTrade = 1;
      for (let i = 1; i < currentTiers.length; i++) {
        currentTiers[i].fromTrade = Number(currentTiers[i - 1].toTrade) + 1;
      }
    } else {
      const baseLot = Math.max(0.01, Math.round((activePlan.trades[0]?.lotSize || 0.01) * 100) / 100);
      const baseRisk = Math.round((activePlan.trades[0]?.risk || 5) * 100) / 100;
      currentTiers = [
        {
          id: `tier-1-${Date.now()}`,
          fromTrade: 1,
          toTrade: 100,
          lotSize: baseLot.toFixed(2),
          riskUSD: String(baseRisk)
        }
      ];
    }
    setSteppingTiers(currentTiers);
    setIsSteppingModalOpen(true);
  };

  // When user is typing in toTrade: allow string (even empty string) so Backspace works freely
  const handleTierToTradeChange = (index: number, rawVal: string) => {
    // Only allow digits or empty string
    const cleanVal = rawVal.replace(/[^0-9]/g, "");

    setSteppingTiers((prevTiers) => {
      const updated = [...prevTiers];
      updated[index] = { ...updated[index], toTrade: cleanVal };

      // If user typed a complete number that is >= fromTrade, automatically update subsequent tiers!
      const parsedToTrade = parseInt(cleanVal, 10);
      if (!isNaN(parsedToTrade) && parsedToTrade >= updated[index].fromTrade) {
        let prevEnd = parsedToTrade;
        for (let i = index + 1; i < updated.length; i++) {
          const newFrom = prevEnd + 1;
          const currentToNum = parseInt(String(updated[i].toTrade), 10);
          const newTo = !isNaN(currentToNum) && currentToNum > newFrom ? currentToNum : newFrom + 49;

          updated[i] = {
            ...updated[i],
            fromTrade: newFrom,
            toTrade: newTo
          };
          prevEnd = newTo;
        }
      }
      return updated;
    });
  };

  // When toTrade input loses focus: ensure valid range and cleanly cascade to subsequent tiers
  const handleTierToTradeBlur = (index: number) => {
    setSteppingTiers((prevTiers) => {
      const updated = [...prevTiers];
      const current = updated[index];
      const parsedToTrade = parseInt(String(current.toTrade), 10);

      // If empty or less than fromTrade, set default to fromTrade + 49
      const safeTo = !isNaN(parsedToTrade) && parsedToTrade >= current.fromTrade
        ? parsedToTrade
        : current.fromTrade + 49;

      updated[index] = { ...current, toTrade: safeTo };

      // Re-chain subsequent tiers cleanly
      let prevEnd = safeTo;
      for (let i = index + 1; i < updated.length; i++) {
        const newFrom = prevEnd + 1;
        const currentToNum = parseInt(String(updated[i].toTrade), 10);
        const newTo = !isNaN(currentToNum) && currentToNum > newFrom ? currentToNum : newFrom + 49;

        updated[i] = {
          ...updated[i],
          fromTrade: newFrom,
          toTrade: newTo
        };
        prevEnd = newTo;
      }
      return updated;
    });
  };

  // Add tier (automatically begins at lastTier.toTrade + 1)
  const addSteppingTier = () => {
    setSteppingTiers((prev) => {
      const lastTier = prev[prev.length - 1];
      const lastTo = lastTier ? (parseInt(String(lastTier.toTrade), 10) || (lastTier.fromTrade + 49)) : 0;
      const fromTrade = lastTier ? lastTo + 1 : 1;
      const toTrade = fromTrade + 49;
      const lastLot = lastTier ? (parseFloat(String(lastTier.lotSize)) || 0.01) : 0.01;
      // Strictly 2 decimal places: e.g. 0.01 -> 0.02 -> 0.03
      const nextLot = Math.max(0.01, Math.round((lastLot + 0.01) * 100) / 100);
      const riskUSD = Math.round(nextLot * planRiskPerLot * 100) / 100;

      return [
        ...prev,
        {
          id: `tier-${Date.now()}`,
          fromTrade,
          toTrade,
          lotSize: nextLot.toFixed(2),
          riskUSD: String(riskUSD)
        }
      ];
    });
  };

  // Delete tier (automatically re-chains all subsequent tiers)
  const handleDeleteTier = (index: number) => {
    setSteppingTiers((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((_, idx) => idx !== index);
      filtered[0].fromTrade = 1;
      let prevEnd = parseInt(String(filtered[0].toTrade), 10) || 50;
      filtered[0].toTrade = prevEnd;

      for (let i = 1; i < filtered.length; i++) {
        const newFrom = prevEnd + 1;
        const curTo = parseInt(String(filtered[i].toTrade), 10);
        const newTo = !isNaN(curTo) && curTo > newFrom ? curTo : newFrom + 49;
        filtered[i].fromTrade = newFrom;
        filtered[i].toTrade = newTo;
        prevEnd = newTo;
      }
      return filtered;
    });
  };

  // Apply Stepping Rules
  const applySteppingRules = () => {
    if (steppingTiers.length === 0) return;

    // Sanitize all tiers cleanly first
    const sanitizedTiers = steppingTiers.map((t, idx, arr) => {
      const fromTrade = idx === 0 ? 1 : (parseInt(String(arr[idx - 1].toTrade), 10) || 1) + 1;
      const rawTo = parseInt(String(t.toTrade), 10);
      const toTrade = !isNaN(rawTo) && rawTo >= fromTrade ? rawTo : fromTrade + 49;
      const rawLot = parseFloat(String(t.lotSize));
      const lotSize = !isNaN(rawLot) && rawLot >= 0.01 ? Number(rawLot.toFixed(2)) : 0.01;
      const rawRisk = parseFloat(String(t.riskUSD));
      const riskUSD = !isNaN(rawRisk) && rawRisk > 0 ? Number(rawRisk.toFixed(2)) : 5;

      return {
        id: t.id,
        fromTrade,
        toTrade,
        lotSize,
        riskUSD
      };
    });

    const maxTradeNum = Math.max(...sanitizedTiers.map(t => t.toTrade), activePlan.trades.length);
    const updatedTrades: ProjectionTrade[] = [];
    let currentCap = activePlan.trades[0]?.projectedCapital || activePlan.startingBalance;

    for (let i = 1; i <= maxTradeNum; i++) {
      const tier = sanitizedTiers.find(t => i >= t.fromTrade && i <= t.toTrade) || sanitizedTiers[sanitizedTiers.length - 1];
      const riskVal = tier.riskUSD;
      const lotVal = tier.lotSize;
      const profitVal = Number((riskVal * 2.0).toFixed(2));
      const endBal = Number((currentCap + profitVal).toFixed(2));
      const riskPct = currentCap > 0 ? Number(((riskVal / currentCap) * 100).toFixed(2)) : 0;

      updatedTrades.push({
        tradeNum: i,
        sheetTradeNum: i,
        projectedCapital: Number(currentCap.toFixed(2)),
        risk: riskVal,
        riskPct,
        lotSize: lotVal,
        profitUSD: profitVal,
        profitLKR: Math.round(profitVal * fxRate),
        endBalanceUSD: endBal,
        targetLKRBalance: Math.round(endBal * fxRate)
      });

      currentCap = endBal;
    }

    const updatedPlan: ProjectionPreset = {
      ...activePlan,
      targetBalance: updatedTrades[updatedTrades.length - 1].endBalanceUSD,
      totalTrades: updatedTrades.length,
      trades: updatedTrades
    };

    persistPlans(plans.map(p => p.id === activePlan.id ? updatedPlan : p));
    setIsSteppingModalOpen(false);
  };

  // Create New Plan (Auto Smart Compound, Custom Compound, or Pre-built Template)
  const handleCreateNewPlan = () => {
    let newPlan: ProjectionPreset;

    if (addPlanTab === "auto") {
      newPlan = generateAutoCompoundPlan({
        startingBalance: autoStartCap,
        targetBalance: autoTargetCap,
        riskModel: autoRiskModel,
        customRiskPct: autoCustomRiskPct,
        rrRatio: autoRR,
        fxRate,
        planName: newPlanName,
        tradesPerDay: tradesPerDay,
        accountType: accountCategory
      });
    } else if (addPlanTab === "custom") {
      newPlan = generateCustomCompoundPlan({
        startingBalance: newPlanStartCap,
        compoundType: customCompoundType,
        initialLot: newPlanLot,
        riskUSD: newPlanRiskUSD,
        riskPercent: customRiskPercent,
        rrRatio: newPlanRR,
        totalTrades: newPlanTradeCount,
        fxRate,
        planName: newPlanName
      });
    } else {
      const template = EXTRA_PROJECTION_TEMPLATES.find(t => t.id === selectedTemplateId);
      if (template) {
        const newId = `plan-${Date.now()}`;
        newPlan = {
          ...template,
          id: newId,
          title: newPlanName.trim() || template.title,
          badge: "Template",
          isCustom: true
        };
      } else {
        return;
      }
    }

    persistPlans([...plans, newPlan]);
    setActivePlanId(newPlan.id);
    setIsAddPlanModalOpen(false);
    setNewPlanName("");
  };

  // Open Edit Plan Modal populated with the selected plan's data
  const openEditPlanModal = (plan: ProjectionPreset) => {
    setEditingPlanId(plan.id);
    setEditPlanTitle(plan.title);
    setEditPlanBadge(plan.badge || "");
    setEditPlanStartCap(plan.startingBalance);
    setEditPlanTargetCap(plan.targetBalance);
    const isFunded = plan.startingBalance >= 5000 || plan.type === "funded" || plan.title.toLowerCase().includes("prop") || plan.title.toLowerCase().includes("funded");
    setEditPlanCategory(isFunded ? "funded" : "micro");
    setEditPlanRiskModel(isFunded ? "funded_half_pct" : "micro_growth");
    setEditPlanCustomRiskPct(0.5);
    setEditPlanRR(2.0);
    setEditPlanKeepExecutions(true);
    setIsEditPlanModalOpen(true);
  };

  // Save changes from Edit Plan Modal
  const handleSaveEditPlan = () => {
    const origPlan = plans.find(p => p.id === editingPlanId);
    if (!origPlan) return;

    let updatedPlan: ProjectionPreset;

    if (editPreviewPlan) {
      updatedPlan = {
        ...editPreviewPlan,
        id: origPlan.id,
        title: editPlanTitle.trim() || editPreviewPlan.title,
        badge: editPlanBadge.trim() || (editPlanCategory === "funded" ? `$${(editPlanStartCap / 1000).toFixed(0)}k Prop` : origPlan.badge),
        color: editPlanCategory === "funded" ? "blue" : origPlan.color,
        isCustom: true
      };
    } else {
      updatedPlan = {
        ...origPlan,
        title: editPlanTitle.trim() || origPlan.title,
        badge: editPlanBadge.trim() || origPlan.badge
      };
    }

    if (!editPlanKeepExecutions) {
      const newMap = { ...tradeExecutionsMap };
      delete newMap[editingPlanId];
      saveExecutionsMap(newMap);
    }

    const updatedPlans = plans.map(p => p.id === editingPlanId ? updatedPlan : p);
    persistPlans(updatedPlans);
    setIsEditPlanModalOpen(false);
  };

  // Delete Plan (Custom or Preset)
  const deletePlan = (planId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (plans.length <= 1) {
      alert("At least one plan must remain active in the system.");
      return;
    }
    const targetPlan = plans.find(p => p.id === planId);
    const planName = targetPlan?.title || "this plan";
    if (window.confirm(`Are you sure you want to delete "${planName}"? This action cannot be undone.`)) {
      const remaining = plans.filter(p => p.id !== planId);
      persistPlans(remaining);
      if (activePlanId === planId) {
        setActivePlanId(remaining[0].id);
      }
      const newMap = { ...tradeExecutionsMap };
      delete newMap[planId];
      saveExecutionsMap(newMap);
      setIsEditPlanModalOpen(false);
    }
  };

  // Filtered & Paginated Trades
  const filteredTrades = useMemo(() => {
    return dynamicTrades.filter(t => {
      if (statusFilter === "WINS" && t.outcome !== "WIN") return false;
      if (statusFilter === "LOSSES" && t.outcome !== "LOSS") return false;
      if (statusFilter === "PENDING" && t.outcome !== "PENDING") return false;

      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const matchesTrade = String(t.tradeNum).includes(query);
        const matchesCapital = String(t.projectedCapital).includes(query);
        const matchesLot = String(t.lotSize).includes(query);
        const matchesEndBal = String(t.endBalanceUSD).includes(query);
        const matchesDate = t.executionDate.includes(query);
        const matchesOutcome = t.outcome.toLowerCase().includes(query);
        if (!matchesTrade && !matchesCapital && !matchesLot && !matchesEndBal && !matchesDate && !matchesOutcome) return false;
      }

      return true;
    });
  }, [dynamicTrades, statusFilter, searchTerm]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredTrades.length / pageSize);
  const paginatedTrades = useMemo(() => {
    if (pageSize === -1) return filteredTrades;
    const start = (currentPage - 1) * pageSize;
    return filteredTrades.slice(start, start + pageSize);
  }, [filteredTrades, currentPage, pageSize]);

  // Chart data sampled for optimal rendering performance (max 50 points)
  const chartData = useMemo(() => {
    if (dynamicTrades.length <= 50) {
      return dynamicTrades.map(t => ({
        trade: t.tradeNum,
        usd: t.endBalanceUSD,
        lkr: t.targetLKRBalance,
        lot: t.lotSize,
        profit: t.profitUSD,
        outcome: t.outcome,
        isExecuted: t.isExecuted
      }));
    }
    const step = Math.ceil(dynamicTrades.length / 45);
    const sampled: any[] = [];
    for (let i = 0; i < dynamicTrades.length; i += step) {
      const t = dynamicTrades[i];
      sampled.push({
        trade: t.tradeNum,
        usd: t.endBalanceUSD,
        lkr: t.targetLKRBalance,
        lot: t.lotSize,
        profit: t.profitUSD,
        outcome: t.outcome,
        isExecuted: t.isExecuted
      });
    }
    const last = dynamicTrades[dynamicTrades.length - 1];
    if (sampled[sampled.length - 1]?.trade !== last.tradeNum) {
      sampled.push({
        trade: last.tradeNum,
        usd: last.endBalanceUSD,
        lkr: last.targetLKRBalance,
        lot: last.lotSize,
        profit: last.profitUSD,
        outcome: last.outcome,
        isExecuted: last.isExecuted
      });
    }
    return sampled;
  }, [dynamicTrades]);

  // Export to Excel / CSV with Date Stamp & Outcome columns
  const exportPlan = () => {
    const exportData = dynamicTrades.map((t, idx) => {
      const projDate = getProjectedDate(planStartDate, idx, tradesPerDay, includeWeekends);

      return {
        "Trade #": t.tradeNum,
        "Outcome": t.outcome,
        "Execution Date": t.executionDate,
        "Projected Target Date": formatDateDisplay(projDate),
        "Projected Capital ($)": t.projectedCapital,
        "Risk %": t.riskPct + "%",
        "Risk ($)": t.risk,
        "Lot Size": t.lotSize,
        "Realized P&L ($)": t.profitUSD,
        "Realized P&L (SLR/LKR)": t.profitLKR,
        "End Balance ($)": t.endBalanceUSD,
        "Target SLR/LKR Balance": t.targetLKRBalance
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projection Plan");
    XLSX.writeFile(wb, `${activePlan.title.replace(/[^a-zA-Z0-9]/g, "_")}_Projection.xlsx`);
  };

  const handleManualFxSubmit = () => {
    const val = Number(manualFxInput);
    if (!isNaN(val) && val > 0) {
      setFxRate(val);
      setIsLiveFx(false);
      try {
        localStorage.setItem("uc_projection_manual_fx", String(val));
      } catch {
        // ignore
      }
    }
    setIsEditingFx(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--foreground)]">
                Capital & Target Projection
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)] font-medium">
                Dynamic 1 x 2 Compound Roadmap • Live Win/Loss Execution Tracking • Auto Date Stamping
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dual Currency Mode Toggle */}
          <div className="flex items-center p-1 bg-[var(--muted)]/50 rounded-xl border border-[var(--border)] text-xs font-semibold">
            <button
              onClick={() => setCurrencyMode("BOTH")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currencyMode === "BOTH"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-bold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              USD + LKR
            </button>
            <button
              onClick={() => setCurrencyMode("USD")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currencyMode === "USD"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-bold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrencyMode("LKR")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currencyMode === "LKR"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-bold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              LKR (Rs)
            </button>
          </div>

          {/* Live USD / LKR Exchange Rate Pill with Live Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-xs shadow-xs">
            {isLiveFx ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <Coins className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="text-[var(--muted-foreground)] font-medium">1 USD =</span>
            {isEditingFx ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={manualFxInput}
                  onChange={(e) => setManualFxInput(e.target.value)}
                  onWheel={(e) => {
                    e.preventDefault();
                    (e.nativeEvent as any).__wheelHandled = true;
                    const step = e.shiftKey ? 5 : 1;
                    const cur = parseFloat(manualFxInput) || 300;
                    const next = Math.max(1, Number((cur + (e.deltaY < 0 ? step : -step)).toFixed(1)));
                    setManualFxInput(String(next));
                  }}
                  title="Scroll mouse wheel to adjust rate"
                  onKeyDown={(e) => e.key === "Enter" && handleManualFxSubmit()}
                  className="w-16 px-1.5 py-0.5 bg-[var(--muted)] border border-[var(--border)] rounded text-xs font-bold text-[var(--foreground)] outline-none"
                  autoFocus
                />
                <button
                  onClick={handleManualFxSubmit}
                  className="p-1 text-emerald-500 hover:text-emerald-600 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingFx(true)}
                className="font-bold text-[var(--foreground)] hover:underline flex items-center gap-1 cursor-pointer"
                title="Click to manually edit exchange rate"
              >
                <span>{fxRate.toFixed(2)} LKR</span>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {isLiveFx ? "(Live)" : "(Manual)"}
                </span>
              </button>
            )}

            {/* Refresh Live Rate Button */}
            <button
              onClick={fetchLiveFxRate}
              disabled={isFetchingFx}
              className="p-1 text-[var(--muted-foreground)] hover:text-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live USD to LKR exchange rate"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingFx ? "animate-spin text-indigo-500" : ""}`} />
            </button>
          </div>

          {/* Edit Plan Button */}
          <button
            onClick={() => openEditPlanModal(activePlan)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title="Edit active plan target, capital, or risk settings"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Plan</span>
          </button>

          {/* Delete Active Plan Button (if more than 1 plan exists) */}
          {plans.length > 1 && (
            <button
              onClick={() => deletePlan(activePlan.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              title={`Delete "${activePlan.title}"`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Plan</span>
            </button>
          )}

          {/* Stepping & Lot Scaling Rules Button */}
          <button
            onClick={openSteppingModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title="Configure lot size scaling tiers"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Scale Lot Sizes</span>
          </button>

          {/* Add Recovery Trades Button */}
          <button
            onClick={appendRecoveryTrades}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Add +10 extra trades to extend runway after losses"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+10 Trades</span>
          </button>

          {/* Export Plan to Excel */}
          <button
            onClick={exportPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--card)] hover:bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--foreground)] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Export Excel</span>
          </button>

          {/* Reset Completed Progress */}
          {executedTotal > 0 && (
            <button
              onClick={resetPresetProgress}
              className="flex items-center gap-1 px-2.5 py-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Reset all win/loss history for this plan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Plan Switcher Pills & Add Plan Button */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {plans.map((plan) => {
          const isSelected = activePlanId === plan.id;
          const planExec = tradeExecutionsMap[plan.id] || {};
          const pWins = Object.values(planExec).filter(e => e.outcome === "WIN").length;
          const pLoss = Object.values(planExec).filter(e => e.outcome === "LOSS").length;
          return (
            <div
              key={plan.id}
              className={`group relative flex items-center rounded-xl transition-all border ${
                isSelected
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                  : "bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)]/40"
              }`}
            >
              <button
                onClick={() => {
                  setActivePlanId(plan.id);
                  setCurrentPage(1);
                }}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold cursor-pointer"
              >
                <span>{plan.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {plan.badge || "Plan"}
                </span>
                {(pWins > 0 || pLoss > 0) && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-[var(--muted)] text-[var(--foreground)]"
                    }`}
                  >
                    <span className="text-emerald-400 font-extrabold">{pWins}W</span>
                    {pLoss > 0 && <span className="text-rose-400 font-extrabold">{pLoss}L</span>}
                  </span>
                )}
              </button>

              {/* Edit button on active plan tab */}
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditPlanModal(plan);
                  }}
                  className="pr-1.5 pl-0.5 text-white/70 hover:text-white transition-colors cursor-pointer"
                  title={`Edit "${plan.title}"`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Delete button for any plan (if more than 1 plan exists) */}
              {plans.length > 1 && (
                <button
                  onClick={(e) => deletePlan(plan.id, e)}
                  className={`pr-2.5 pl-1 transition-colors cursor-pointer ${
                    isSelected ? "text-white/70 hover:text-rose-300" : "text-slate-400 hover:text-rose-500"
                  }`}
                  title={`Delete "${plan.title}"`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Plan Button */}
        <button
          onClick={() => {
            setIsAddPlanModalOpen(true);
            setAddPlanTab("auto");
            setAutoStartCap(5);
            setAutoTargetCap(500);
            setNewPlanName("");
          }}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Plan</span>
        </button>
      </div>

      {/* Primary KPI Metric Cards (With Win Rate, Losses, and Real Actual Balance!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Actual Current Balance & Realized PnL */}
        <div className="neumorphic-card p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Actual Account Balance
            </span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-[var(--foreground)] tabular-nums">
            ${currentActualBalanceUSD.toLocaleString()}
          </div>
          {(currencyMode === "BOTH" || currencyMode === "LKR") && (
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5 tabular-nums">
              Rs. {currentActualBalanceLKR.toLocaleString()} LKR
            </div>
          )}
          <div className="text-[10px] mt-2 font-semibold flex items-center justify-between">
            <span className={realizedPnLUSD >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}>
              {realizedPnLUSD >= 0 ? "+" : ""}${realizedPnLUSD.toLocaleString()} Realized P&L
            </span>
            {currentDrawdownUSD > 0 && (
              <span className="text-rose-500 text-[9.5px]">
                -${currentDrawdownUSD} DD
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Next Trade / Current Milestone */}
        <div className="neumorphic-card p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Next Trade #{currentTrade.tradeNum}
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
            ${currentTrade.endBalanceUSD.toLocaleString()}
          </div>
          {(currencyMode === "BOTH" || currencyMode === "LKR") && (
            <div className="text-xs font-bold text-indigo-500 dark:text-indigo-300 mt-0.5 tabular-nums">
              Rs. {currentTrade.targetLKRBalance.toLocaleString()} LKR
            </div>
          )}
          <div className="text-[10px] text-[var(--muted-foreground)] mt-2 font-medium flex items-center gap-1.5">
            <span>Lot: <strong>{currentTrade.lotSize}</strong></span>
            <span>•</span>
            <span>Win Target: <strong>+${currentTrade.profitUSD}</strong></span>
          </div>
        </div>

        {/* Card 3: Win Rate & Performance Health */}
        <div className="neumorphic-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Win Rate & Accuracy
            </span>
            <span className={`p-1.5 rounded-lg ${winRatePct >= 50 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-500"}`}>
              <Percent className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-[var(--foreground)] tabular-nums flex items-baseline gap-2">
            <span>{executedTotal > 0 ? `${winRatePct}%` : "100%"}</span>
            <span className="text-xs font-bold text-[var(--muted-foreground)]">
              ({winsCount}W / {lossesCount}L)
            </span>
          </div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {lossesCount > 0 ? `${lossesCount} loss absorbed into plan` : "100% disciplined pace"}
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] mt-2 font-medium flex items-center justify-between">
            <span>1:2 R:R Rule</span>
            <span>{lossesCount > 0 ? `+${lossesCount} recovery win needed` : "Zero drawdown"}</span>
          </div>
        </div>

        {/* Card 4: Target Final Balance & Progress */}
        <div className="neumorphic-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Target Final Balance
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            ${targetCapUSD.toLocaleString()}
          </div>
          {(currencyMode === "BOTH" || currencyMode === "LKR") && (
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
              Rs. {targetCapLKR.toLocaleString()} LKR
            </div>
          )}
          <div className="w-full bg-[var(--muted)] h-2 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] mt-1.5 font-medium flex justify-between">
            <span>{winsCount} wins reached ({progressPct}%)</span>
            <span>+{multipleGrowth}x Growth</span>
          </div>
        </div>
      </div>

      {/* Loss Impact & Recovery Alert (Shown when losses exist) */}
      {lossesCount > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[var(--foreground)]">
                Dynamic Loss Recalculation Active ({lossesCount} Loss{lossesCount > 1 ? "es" : ""})
              </div>
              <p className="text-[var(--muted-foreground)] text-[11px] mt-0.5">
                Losses automatically reduced your balance and re-forecasted the future compounding path.
                You need <strong>+{lossesCount} extra winning trade{lossesCount > 1 ? "s" : ""}</strong> to hit the full final target balance.
              </p>
            </div>
          </div>
          <button
            onClick={appendRecoveryTrades}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl shadow-xs hover:bg-amber-400 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Recovery Trades</span>
          </button>
        </div>
      )}

      {/* Daily Pace & Target Timeline Forecast Widget (2 Trades/Day Model) */}
      <div className="neumorphic-card p-4 sm:p-5 border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-[var(--foreground)]">
                  Daily Execution Pace & Target Forecast
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {tradesPerDay} Trades / Day Model
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Forecast your target milestones and finish date based on disciplined daily execution
              </p>
            </div>
          </div>

          {/* Interactive Pace Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Start Date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-xs shadow-xs">
              <span className="text-[var(--muted-foreground)] font-semibold">Start:</span>
              <input
                type="date"
                value={planStartDate}
                onChange={(e) => savePaceSettings(tradesPerDay, e.target.value, includeWeekends)}
                className="bg-transparent font-bold text-[var(--foreground)] outline-none cursor-pointer text-xs"
              />
            </div>

            {/* Trades per Day Pills */}
            <div
              onWheel={(e) => {
                e.preventDefault();
                (e.nativeEvent as any).__wheelHandled = true;
                const delta = e.deltaY < 0 ? 1 : -1;
                const nextPace = Math.min(10, Math.max(1, tradesPerDay + delta));
                savePaceSettings(nextPace, planStartDate, includeWeekends);
              }}
              title="Scroll mouse wheel to change daily pace (1-10 trades/day)"
              className="flex items-center p-1 bg-[var(--card)] rounded-xl border border-[var(--border)] text-xs font-semibold shadow-xs"
            >
              <span className="px-2 text-[var(--muted-foreground)] text-[11px]">Pace:</span>
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => savePaceSettings(num, planStartDate, includeWeekends)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                    tradesPerDay === num
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {num === 2 ? "★ 2 / day" : `${num} / day`}
                </button>
              ))}
            </div>

            {/* Weekend Toggle */}
            <button
              onClick={() => savePaceSettings(tradesPerDay, planStartDate, !includeWeekends)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                includeWeekends
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title="Forex markets operate 5 days a week (Mon-Fri). Enable if trading Crypto 7 days/week."
            >
              {includeWeekends ? "7 Days/Wk" : "Forex (Mon-Fri)"}
            </button>

            {/* Re-align All Dates strictly to 2 Trades per Day */}
            <button
              onClick={realignAllTradeDates}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all cursor-pointer shadow-xs"
              title="Re-align all completed trades strictly to 2 trades per day schedule"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sync All Dates (2/Day)</span>
            </button>
          </div>
        </div>

        {/* 4 Timeline Horizon Target Cards */}
        {timelineMilestones && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {/* Horizon 1: 2 Weeks Target */}
            <div className="p-3.5 rounded-2xl bg-[var(--card)]/90 border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>In 2 Weeks ({timelineMilestones.milestone2Weeks.tradeCount} Trades)</span>
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] font-semibold">
                  {timelineMilestones.milestone2Weeks.dateStr}
                </span>
              </div>
              <div className="text-lg font-black text-[var(--foreground)] tabular-nums">
                ${timelineMilestones.milestone2Weeks.balanceUSD.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                Rs. {timelineMilestones.milestone2Weeks.balanceLKR.toLocaleString()} LKR
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] mt-2 flex justify-between">
                <span>Net Gain: <strong>+${timelineMilestones.milestone2Weeks.profitUSD.toLocaleString()}</strong></span>
                <span>Lot: <strong>{timelineMilestones.milestone2Weeks.lotSize.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Horizon 2: 1 Month Target */}
            <div className="p-3.5 rounded-2xl bg-[var(--card)]/90 border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>
                    In 1 Month {timelineMilestones.milestone1Month.isCompletedEarly ? `(Target Reached Early)` : `(${timelineMilestones.milestone1Month.tradeCount} Trades)`}
                  </span>
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] font-semibold">
                  {timelineMilestones.milestone1Month.dateStr}
                </span>
              </div>
              <div className="text-lg font-black text-[var(--foreground)] tabular-nums flex items-baseline gap-2">
                <span>${timelineMilestones.milestone1Month.balanceUSD.toLocaleString()}</span>
                {timelineMilestones.milestone1Month.isCompletedEarly && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    Day {timelineMilestones.tradingDaysNeeded} Goal
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                Rs. {timelineMilestones.milestone1Month.balanceLKR.toLocaleString()} LKR
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] mt-2 flex justify-between">
                <span>Net Gain: <strong>+${timelineMilestones.milestone1Month.profitUSD.toLocaleString()}</strong></span>
                <span>Lot: <strong>{timelineMilestones.milestone1Month.lotSize.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Horizon 3: 3 Months Target */}
            <div className="p-3.5 rounded-2xl bg-[var(--card)]/90 border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <Milestone className="w-3.5 h-3.5" />
                  <span>
                    In 3 Months {timelineMilestones.milestone3Months.isCompletedEarly ? `(Target Reached Early)` : `(${timelineMilestones.milestone3Months.tradeCount} Trades)`}
                  </span>
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] font-semibold">
                  {timelineMilestones.milestone3Months.dateStr}
                </span>
              </div>
              <div className="text-lg font-black text-purple-600 dark:text-purple-400 tabular-nums flex items-baseline gap-2">
                <span>${timelineMilestones.milestone3Months.balanceUSD.toLocaleString()}</span>
                {timelineMilestones.milestone3Months.isCompletedEarly && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    Day {timelineMilestones.tradingDaysNeeded} Goal
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                Rs. {timelineMilestones.milestone3Months.balanceLKR.toLocaleString()} LKR
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] mt-2 flex justify-between">
                <span>Net Gain: <strong>+${timelineMilestones.milestone3Months.profitUSD.toLocaleString()}</strong></span>
                <span>Lot: <strong>{timelineMilestones.milestone3Months.lotSize.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Horizon 4: Full Goal Completion */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-emerald-500/30 shadow-xs">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Full Target Completion</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {timelineMilestones.tradingDaysNeeded} Days
                </span>
              </div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                ${targetCapUSD.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-emerald-600/90 dark:text-emerald-400/90 tabular-nums">
                Rs. {targetCapLKR.toLocaleString()} LKR
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] mt-2 flex justify-between">
                <span>Estimated Date:</span>
                <strong className="text-[var(--foreground)]">{timelineMilestones.finishDateStr}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trajectory Growth Curve Chart & Stepping Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trajectory Growth Chart (2 cols) */}
        <div className="lg:col-span-2 neumorphic-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)]">
                Projected Capital Trajectory Curve
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Live compounding curve with actual win/loss realized points and projected path ({activePlan.title})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>{winsCount} Wins</span>
              </span>
              {lossesCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>{lossesCount} Losses</span>
                </span>
              )}
            </div>
          </div>

          <div className="h-[260px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="usdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                <XAxis
                  dataKey="trade"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `T#${val}`}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const outcome = data.outcome as TradeOutcome;
                      return (
                        <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs space-y-1.5">
                          <div className="font-bold flex items-center justify-between gap-2">
                            <span className="text-indigo-300">Trade #{data.trade}</span>
                            {outcome === "WIN" && <span className="text-emerald-400 font-black">✓ WIN (+2R)</span>}
                            {outcome === "LOSS" && <span className="text-rose-400 font-black">✕ LOSS (-1R)</span>}
                            {outcome === "BE" && <span className="text-amber-400 font-black">⚪ BREAK-EVEN</span>}
                            {outcome === "PENDING" && <span className="text-slate-400">Planned</span>}
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Balance:</span>
                            <span className="font-bold text-white">${data.usd.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">LKR Valuation:</span>
                            <span className="font-bold text-emerald-400">Rs. {data.lkr.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Lot Size:</span>
                            <span className="font-semibold">{Number(data.lot).toFixed(2)} Lot</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Trade P&L:</span>
                            <span className={`font-bold ${data.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {data.profit >= 0 ? "+" : ""}${data.profit}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="usd"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#usdGradient)"
                />
                {currentTrade && (
                  <ReferenceLine
                    x={currentTrade.tradeNum}
                    stroke="#10B981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Active: T#${currentTrade.tradeNum}`,
                      fill: "#10B981",
                      fontSize: 10,
                      position: "top"
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stepping Ladder / Stages Guide (1 col) */}
        <div className="neumorphic-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  Lot Sizing Stages
                </h3>
              </div>
              <button
                onClick={openSteppingModal}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Edit Stages
              </button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              Step rules controlling lot size & risk across account growth tiers.
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {steppingStages.slice(0, 8).map((stg) => {
                const isCurrentStage = currentTrade.tradeNum >= stg.startTrade && currentTrade.tradeNum <= stg.endTrade;
                return (
                  <div
                    key={stg.stageNum}
                    className={`p-2.5 rounded-xl border text-xs transition-all ${
                      isCurrentStage
                        ? "bg-indigo-500/10 border-indigo-500/30 text-[var(--foreground)] ring-1 ring-indigo-500/20"
                        : "bg-[var(--muted)]/30 border-[var(--border)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isCurrentStage ? "bg-indigo-500" : "bg-slate-400"}`} />
                        <span>Trades #{stg.startTrade} – #{stg.endTrade}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold">
                        {Number(stg.lotSize).toFixed(2)} Lot
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] opacity-90">
                      <span>Capital: ${stg.startBal.toLocaleString()} → ${stg.endBal.toLocaleString()}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +${stg.profitUSD} / win
                      </span>
                    </div>
                  </div>
                );
              })}
              {steppingStages.length > 8 && (
                <div className="text-center text-[10px] text-[var(--muted-foreground)] font-semibold pt-1">
                  + {steppingStages.length - 8} higher stepping stages
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
            <span>R:R Model: <strong>1 : 2</strong></span>
            <button
              onClick={resetPlanToDefault}
              className="text-rose-500/80 hover:text-rose-600 font-semibold cursor-pointer"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Trade Log Table with WIN / LOSS / BE Execution Tracking */}
      <div className="neumorphic-card overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search trade, lot, balance, date..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)] w-48 sm:w-60"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center p-0.5 bg-[var(--muted)]/50 rounded-xl border border-[var(--border)] text-xs font-semibold">
              <button
                onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === "ALL"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-bold"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                All ({dynamicTrades.length})
              </button>
              <button
                onClick={() => { setStatusFilter("WINS"); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === "WINS"
                    ? "bg-[var(--card)] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                Wins ({winsCount})
              </button>
              <button
                onClick={() => { setStatusFilter("LOSSES"); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === "LOSSES"
                    ? "bg-[var(--card)] text-rose-500 shadow-xs font-bold"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                Losses ({lossesCount})
              </button>
              <button
                onClick={() => { setStatusFilter("PENDING"); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === "PENDING"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs font-bold"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                Pending ({dynamicTrades.length - executedTotal})
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Quick Bulk Action */}
            <button
              onClick={() => markUpToTrade(currentTrade.tradeNum)}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              title={`Mark trades #1 to #${currentTrade.tradeNum} as WIN`}
            >
              ✓ Mark Up to T#{currentTrade.tradeNum}
            </button>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--foreground)] outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
            </div>
          </div>
        </div>

        {/* The Spreadsheet Data Table with WIN / LOSS / BE selection */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[var(--muted-foreground)] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 text-center w-28">Outcome</th>
                <th className="py-3 px-3">Trade #</th>
                <th className="py-3 px-3">Timeline & Date</th>
                <th className="py-3 px-3 text-right">Starting Capital ($)</th>
                <th className="py-3 px-3 text-right">Risk %</th>
                <th className="py-3 px-3 text-right">Risk ($)</th>
                <th className="py-3 px-3 text-center">Lot Size</th>
                <th className="py-3 px-3 text-right">Realized P&L ($)</th>
                {(currencyMode === "BOTH" || currencyMode === "LKR") && (
                  <th className="py-3 px-3 text-right">P&L (SLR/LKR)</th>
                )}
                <th className="py-3 px-3 text-right">End Balance ($)</th>
                {(currencyMode === "BOTH" || currencyMode === "LKR") && (
                  <th className="py-3 px-3 text-right">Target SLR Balance</th>
                )}
                <th className="py-3 px-3 text-center w-12">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
              {paginatedTrades.map((t) => {
                const isCurrent = t.tradeNum === currentTrade.tradeNum;
                const tradeIndex = t.tradeNum - 1;
                const projectedDate = getProjectedDate(planStartDate, tradeIndex, tradesPerDay, includeWeekends);
                const isPopoverOpen = activeOutcomePopoverTradeNum === t.tradeNum;

                return (
                  <tr
                    key={t.tradeNum}
                    className={`group transition-colors ${
                      t.outcome === "WIN"
                        ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                        : t.outcome === "LOSS"
                        ? "bg-rose-500/5 hover:bg-rose-500/10"
                        : t.outcome === "BE"
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : isCurrent
                        ? "bg-indigo-500/10 hover:bg-indigo-500/15 font-semibold"
                        : "hover:bg-[var(--muted)]/40"
                    }`}
                  >
                    {/* Outcome Action Cell (1-click or quick popover for WIN / LOSS / BE) */}
                    <td className="py-2.5 px-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {/* Quick toggle pill */}
                        <button
                          onClick={() => cycleTradeOutcome(t.tradeNum)}
                          className={`px-2 py-0.5 rounded-lg font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer border ${
                            t.outcome === "WIN"
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : t.outcome === "LOSS"
                              ? "bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-400"
                              : t.outcome === "BE"
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400"
                              : "bg-[var(--muted)]/60 border-[var(--border)] text-[var(--muted-foreground)] hover:border-indigo-500/40"
                          }`}
                          title="Click to cycle: Pending -> WIN -> LOSS -> BE -> Pending"
                        >
                          {t.outcome === "WIN" && "✓ WIN"}
                          {t.outcome === "LOSS" && "✕ LOSS"}
                          {t.outcome === "BE" && "⚪ BE"}
                          {t.outcome === "PENDING" && "PENDING"}
                        </button>

                        {/* Popover trigger */}
                        <button
                          onClick={() => setActiveOutcomePopoverTradeNum(isPopoverOpen ? null : t.tradeNum)}
                          className="p-1 rounded text-slate-400 hover:text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer"
                          title="Choose specific outcome"
                        >
                          <ChevronRight className={`w-3 h-3 transition-transform ${isPopoverOpen ? "rotate-90" : ""}`} />
                        </button>
                      </div>

                      {/* Mini Outcome Popover Menu */}
                      <AnimatePresence>
                        {isPopoverOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -5 }}
                            className="absolute z-50 left-2 top-full mt-1 bg-[var(--card)] border border-[var(--border)] shadow-xl rounded-xl p-1.5 flex flex-col gap-1 w-32 text-left"
                          >
                            <button
                              onClick={() => setTradeOutcome(t.tradeNum, "WIN")}
                              className="px-2 py-1 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>WIN (+2R)</span>
                            </button>
                            <button
                              onClick={() => setTradeOutcome(t.tradeNum, "LOSS")}
                              className="px-2 py-1 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-500/15 flex items-center gap-1.5 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>LOSS (-1R)</span>
                            </button>
                            <button
                              onClick={() => setTradeOutcome(t.tradeNum, "BE")}
                              className="px-2 py-1 rounded-lg text-xs font-bold text-amber-500 hover:bg-amber-500/15 flex items-center gap-1.5 cursor-pointer"
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                              <span>BE ($0)</span>
                            </button>
                            <button
                              onClick={() => setTradeOutcome(t.tradeNum, "PENDING")}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] flex items-center gap-1.5 cursor-pointer"
                            >
                              <Circle className="w-3.5 h-3.5" />
                              <span>Pending</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>

                    {/* Trade Number */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold tabular-nums">#{t.tradeNum}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-indigo-500 text-white tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Timeline & Date Column */}
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1 items-start">
                        {t.isExecuted ? (
                          editingDateTradeNum === t.tradeNum ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={dateInputVal}
                                onChange={(e) => setDateInputVal(e.target.value)}
                                className="px-1.5 py-0.5 bg-[var(--card)] border border-[var(--border)] rounded text-[11px] font-bold text-[var(--foreground)] outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveTradeDate(t.tradeNum, dateInputVal)}
                                className="p-1 text-emerald-500 hover:text-emerald-600 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingDateTradeNum(t.tradeNum);
                                setDateInputVal(t.executionDate || new Date().toISOString().split("T")[0]);
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                                t.outcome === "WIN"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                                  : t.outcome === "LOSS"
                                  ? "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
                                  : "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                              }`}
                              title="Click to edit date"
                            >
                              <span>{formatDateDisplay(t.executionDate || new Date().toISOString())}</span>
                              <Pencil className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          )
                        ) : (
                          <span className="font-semibold text-slate-600 dark:text-slate-300 text-[11px]">
                            {formatShortDate(projectedDate)} ({formatDayName(projectedDate)})
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Day {Math.floor(tradeIndex / tradesPerDay) + 1}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold border ${
                              (tradeIndex % tradesPerDay) + 1 === 1
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                : (tradeIndex % tradesPerDay) + 1 === 2
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            Trade {(tradeIndex % tradesPerDay) + 1}/{tradesPerDay}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Projected Capital */}
                    <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-[var(--foreground)]">
                      ${t.projectedCapital.toLocaleString()}
                    </td>

                    {/* Risk % */}
                    <td className="py-2.5 px-3 text-right text-[var(--muted-foreground)] tabular-nums">
                      {t.riskPct}%
                    </td>

                    {/* Risk $ */}
                    <td className="py-2.5 px-3 text-right text-rose-500/90 font-medium tabular-nums">
                      ${t.risk.toLocaleString()}
                    </td>

                    {/* Lot Size */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--muted)]/80 text-[var(--foreground)] font-bold tabular-nums">
                        {Number(t.lotSize).toFixed(2)}
                      </span>
                    </td>

                    {/* Realized / Projected P&L USD */}
                    <td className="py-2.5 px-3 text-right font-black tabular-nums">
                      {t.outcome === "LOSS" ? (
                        <span className="text-rose-500">-${Math.abs(t.profitUSD).toLocaleString()}</span>
                      ) : t.outcome === "BE" ? (
                        <span className="text-amber-500">$0.00</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">+${t.profitUSD.toLocaleString()}</span>
                      )}
                    </td>

                    {/* P&L LKR */}
                    {(currencyMode === "BOTH" || currencyMode === "LKR") && (
                      <td className="py-2.5 px-3 text-right font-medium tabular-nums">
                        {t.outcome === "LOSS" ? (
                          <span className="text-rose-500/90">-Rs. {Math.abs(t.profitLKR).toLocaleString()}</span>
                        ) : t.outcome === "BE" ? (
                          <span className="text-amber-500/90">Rs. 0</span>
                        ) : (
                          <span className="text-emerald-600/90 dark:text-emerald-400/90">+Rs. {t.profitLKR.toLocaleString()}</span>
                        )}
                      </td>
                    )}

                    {/* End Balance USD */}
                    <td className="py-2.5 px-3 text-right font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                      ${t.endBalanceUSD.toLocaleString()}
                    </td>

                    {/* Target LKR Balance */}
                    {(currencyMode === "BOTH" || currencyMode === "LKR") && (
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-600/90 dark:text-indigo-300 tabular-nums">
                        Rs. {t.targetLKRBalance.toLocaleString()}
                      </td>
                    )}

                    {/* Edit Row Button */}
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => openEditRow(t, e)}
                        className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                        title="Edit outcome, lot size & risk"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <div>
              Showing {pageSize === -1 ? filteredTrades.length : Math.min((currentPage - 1) * pageSize + 1, filteredTrades.length)} to{" "}
              {pageSize === -1 ? filteredTrades.length : Math.min(currentPage * pageSize, filteredTrades.length)} of {filteredTrades.length} trades
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-[var(--foreground)]">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Edit Single Trade / Outcome / Custom PnL Modal */}
      <AnimatePresence>
        {isEditRowOpen && editingTrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neumorphic-card w-full max-w-md p-5 bg-[var(--card)] border border-[var(--border)] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Pencil className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-[var(--foreground)]">
                    Edit Trade #{editingTrade.tradeNum}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditRowOpen(false)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Outcome Selector */}
                <div>
                  <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                    Trade Outcome
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditOutcomeInput("WIN")}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editOutcomeInput === "WIN"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]"
                      }`}
                    >
                      ✓ WIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditOutcomeInput("LOSS")}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editOutcomeInput === "LOSS"
                          ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                          : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]"
                      }`}
                    >
                      ✕ LOSS
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditOutcomeInput("BE")}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editOutcomeInput === "BE"
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                          : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]"
                      }`}
                    >
                      ⚪ BE
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditOutcomeInput("PENDING")}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editOutcomeInput === "PENDING"
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                          : "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]"
                      }`}
                    >
                      Planned
                    </button>
                  </div>
                </div>

                {/* Custom P&L Override */}
                {editOutcomeInput !== "PENDING" && (
                  <div>
                    <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                      Custom Realized P&L ($ USD) - Optional
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={editCustomPnlInput}
                      onChange={(e) => setEditCustomPnlInput(e.target.value)}
                      onWheel={(e) => {
                        e.preventDefault();
                        (e.nativeEvent as any).__wheelHandled = true;
                        const step = e.shiftKey ? 5 : 1;
                        const cur = parseFloat(editCustomPnlInput) || 0;
                        const next = Number((cur + (e.deltaY < 0 ? step : -step)).toFixed(1));
                        setEditCustomPnlInput(String(next));
                      }}
                      title="Scroll mouse wheel to change (Shift = fast)"
                      placeholder={editOutcomeInput === "WIN" ? `Default: +$${editingTrade.risk * 2}` : editOutcomeInput === "LOSS" ? `Default: -$${editingTrade.risk}` : "$0"}
                      className="w-full px-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                    />
                    <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5 block">
                      Leave blank to use default (Win: +2R = ${editingTrade.risk * 2}, Loss: -1R = -${editingTrade.risk})
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-[var(--muted-foreground)]">
                      Lot Size
                    </label>
                    <span className="text-[10px] text-indigo-500 font-semibold">
                      Forex Micro Lots (0.01 Step)
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editLotInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditLotInput(val);
                      const parsed = parseFloat(val);
                      if (!isNaN(parsed) && parsed > 0 && editRiskPerLotRatio > 0) {
                        const calculatedRisk = Math.round(parsed * editRiskPerLotRatio * 100) / 100;
                        setEditRiskInput(String(calculatedRisk));
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseFloat(editLotInput);
                      const safeLot = !isNaN(parsed) && parsed >= 0.01 ? Number(parsed.toFixed(2)) : 0.01;
                      setEditLotInput(safeLot.toFixed(2));
                      if (editRiskPerLotRatio > 0) {
                        const calculatedRisk = Math.round(safeLot * editRiskPerLotRatio * 100) / 100;
                        setEditRiskInput(String(calculatedRisk));
                      }
                    }}
                    onWheel={(e) => {
                      e.preventDefault();
                      (e.nativeEvent as any).__wheelHandled = true;
                      const step = e.shiftKey ? 0.05 : 0.01;
                      const cur = parseFloat(editLotInput) || 0.01;
                      const nextLot = Math.max(0.01, Number((cur + (e.deltaY < 0 ? step : -step)).toFixed(2)));
                      const nextLotStr = nextLot.toFixed(2);
                      setEditLotInput(nextLotStr);
                      if (editRiskPerLotRatio > 0) {
                        const calculatedRisk = Math.round(nextLot * editRiskPerLotRatio * 100) / 100;
                        setEditRiskInput(String(calculatedRisk));
                      }
                    }}
                    title="Scroll mouse wheel to change lot size (0.01 steps - Risk updates automatically)"
                    className="w-full px-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                    placeholder="e.g. 0.02"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-[var(--muted-foreground)]">
                      Risk Amount ($ USD)
                    </label>
                    <span className="text-[10px] text-rose-500 font-semibold">
                      Auto-correlated
                    </span>
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={editRiskInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditRiskInput(val);
                      const parsed = parseFloat(val);
                      if (!isNaN(parsed) && parsed > 0 && editRiskPerLotRatio > 0) {
                        const calculatedLot = Math.max(0.01, Math.round((parsed / editRiskPerLotRatio) * 100) / 100);
                        setEditLotInput(calculatedLot.toFixed(2));
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseFloat(editRiskInput);
                      const safeRisk = !isNaN(parsed) && parsed >= 1 ? Math.round(parsed * 100) / 100 : 5;
                      setEditRiskInput(String(safeRisk));
                      if (editRiskPerLotRatio > 0) {
                        const calculatedLot = Math.max(0.01, Math.round((safeRisk / editRiskPerLotRatio) * 100) / 100);
                        setEditLotInput(calculatedLot.toFixed(2));
                      }
                    }}
                    onWheel={(e) => {
                      e.preventDefault();
                      (e.nativeEvent as any).__wheelHandled = true;
                      const step = e.shiftKey ? 5 : 1;
                      const cur = parseFloat(editRiskInput) || 5;
                      const nextRisk = Math.max(1, Math.round(cur + (e.deltaY < 0 ? step : -step)));
                      setEditRiskInput(String(nextRisk));
                      if (editRiskPerLotRatio > 0) {
                        const calculatedLot = Math.max(0.01, Math.round((nextRisk / editRiskPerLotRatio) * 100) / 100);
                        setEditLotInput(calculatedLot.toFixed(2));
                      }
                    }}
                    title="Scroll mouse wheel to change risk (Lot size updates automatically)"
                    className="w-full px-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-sm font-bold text-rose-500 outline-none focus:border-[var(--primary)]"
                    placeholder="e.g. 10"
                  />
                </div>

                {/* Apply Forward Toggle */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyForward}
                      onChange={(e) => setApplyForward(e.target.checked)}
                      className="mt-0.5 accent-indigo-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-[var(--foreground)] block">
                        Apply lot size & risk to following trades
                      </span>
                      <span className="text-[11px] text-[var(--muted-foreground)] block">
                        Scale from Trade #{editingTrade.tradeNum} forward and re-compound balances dynamically.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  onClick={() => setIsEditRowOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTradeEdit}
                  className="px-4 py-1.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Save & Recalculate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Stepping / Lot Size Scaling Rules Modal */}
      <AnimatePresence>
        {isSteppingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neumorphic-card w-full max-w-xl p-5 bg-[var(--card)] border border-[var(--border)] shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Settings2 className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[var(--foreground)]">
                      Configure Stepping & Lot Scaling
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Tiers auto-chain: Setting Tier 1 to 1–100 automatically starts Tier 2 from 101 onwards!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSteppingModalOpen(false)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
                    Stepping Tiers ({steppingTiers.length})
                  </span>
                  <button
                    onClick={addSteppingTier}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {steppingTiers.map((tier, idx) => (
                    <div
                      key={tier.id}
                      className="p-3 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold block mb-0.5">
                            Trades
                          </span>
                          <div className="flex items-center gap-1.5 font-bold text-[var(--foreground)]">
                            <span className="px-2 py-0.5 rounded-md bg-[var(--card)] border border-[var(--border)] font-mono text-xs text-[var(--foreground)] shadow-2xs">
                              {tier.fromTrade}
                            </span>
                            <span className="text-[var(--muted-foreground)] text-xs font-medium">to</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={tier.toTrade}
                              onChange={(e) => handleTierToTradeChange(idx, e.target.value)}
                              onBlur={() => handleTierToTradeBlur(idx)}
                              onWheel={(e) => {
                                e.preventDefault();
                                (e.nativeEvent as any).__wheelHandled = true;
                                const step = e.shiftKey ? 10 : 1;
                                const cur = parseInt(String(tier.toTrade), 10) || tier.fromTrade;
                                const next = e.deltaY < 0 ? cur + step : Math.max(tier.fromTrade, cur - step);
                                handleTierToTradeChange(idx, String(next));
                              }}
                              title="Scroll mouse wheel to change trade count (Shift = 10)"
                              placeholder="e.g. 100"
                              className="w-16 px-1.5 py-0.5 bg-[var(--card)] border border-[var(--border)] rounded-md font-bold text-center text-xs outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-[var(--foreground)]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold block">
                            Lot Size
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={tier.lotSize}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^[0-9]*\.?[0-9]{0,2}$/.test(val)) {
                                const parsedLot = parseFloat(val);
                                const updatedRisk = (!isNaN(parsedLot) && parsedLot > 0 && planRiskPerLot > 0)
                                  ? String(Math.round(parsedLot * planRiskPerLot * 100) / 100)
                                  : undefined;
                                setSteppingTiers(steppingTiers.map(t => {
                                  if (t.id !== tier.id) return t;
                                  return {
                                    ...t,
                                    lotSize: val,
                                    riskUSD: updatedRisk !== undefined ? updatedRisk : t.riskUSD
                                  };
                                }));
                              }
                            }}
                            onBlur={() => {
                              setSteppingTiers(steppingTiers.map(t => {
                                if (t.id !== tier.id) return t;
                                const parsed = parseFloat(String(t.lotSize));
                                const safeLot = !isNaN(parsed) && parsed >= 0.01 ? Number(parsed.toFixed(2)) : 0.01;
                                const safeRisk = Math.round(safeLot * planRiskPerLot * 100) / 100;
                                return { ...t, lotSize: safeLot.toFixed(2), riskUSD: String(safeRisk) };
                              }));
                            }}
                            onWheel={(e) => {
                              e.preventDefault();
                              (e.nativeEvent as any).__wheelHandled = true;
                              const step = e.shiftKey ? 0.05 : 0.01;
                              const cur = parseFloat(String(tier.lotSize)) || 0.01;
                              const nextLot = Math.max(0.01, Number((cur + (e.deltaY < 0 ? step : -step)).toFixed(2)));
                              const nextLotStr = nextLot.toFixed(2);
                              const nextRisk = Math.round(nextLot * planRiskPerLot * 100) / 100;
                              setSteppingTiers(steppingTiers.map(t => t.id === tier.id ? { ...t, lotSize: nextLotStr, riskUSD: String(nextRisk) } : t));
                            }}
                            title="Scroll mouse wheel to change lot size (0.01 steps - Risk updates automatically)"
                            className="w-16 px-1.5 py-0.5 bg-[var(--card)] border border-[var(--border)] rounded font-bold text-center outline-none text-xs text-[var(--foreground)]"
                            placeholder="0.01"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold block">
                            Risk ($)
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={tier.riskUSD}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                                const parsedRisk = parseFloat(val);
                                const updatedLot = (!isNaN(parsedRisk) && parsedRisk > 0 && planRiskPerLot > 0)
                                  ? (Math.max(0.01, Math.round((parsedRisk / planRiskPerLot) * 100) / 100)).toFixed(2)
                                  : undefined;
                                setSteppingTiers(steppingTiers.map(t => {
                                  if (t.id !== tier.id) return t;
                                  return {
                                    ...t,
                                    riskUSD: val,
                                    lotSize: updatedLot !== undefined ? updatedLot : t.lotSize
                                  };
                                }));
                              }
                            }}
                            onBlur={() => {
                              setSteppingTiers(steppingTiers.map(t => {
                                if (t.id !== tier.id) return t;
                                const parsed = parseFloat(String(t.riskUSD));
                                const safeRisk = !isNaN(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : 5;
                                const safeLot = planRiskPerLot > 0
                                  ? (Math.max(0.01, Math.round((safeRisk / planRiskPerLot) * 100) / 100)).toFixed(2)
                                  : String(t.lotSize);
                                return { ...t, riskUSD: String(safeRisk), lotSize: safeLot };
                              }));
                            }}
                            onWheel={(e) => {
                              e.preventDefault();
                              (e.nativeEvent as any).__wheelHandled = true;
                              const step = e.shiftKey ? 5 : 1;
                              const cur = parseFloat(String(tier.riskUSD)) || 5;
                              const nextRisk = Math.max(1, Math.round(cur + (e.deltaY < 0 ? step : -step)));
                              const nextLot = planRiskPerLot > 0
                                ? (Math.max(0.01, Math.round((nextRisk / planRiskPerLot) * 100) / 100)).toFixed(2)
                                : String(tier.lotSize);
                              setSteppingTiers(steppingTiers.map(t => t.id === tier.id ? { ...t, riskUSD: String(nextRisk), lotSize: nextLot } : t));
                            }}
                            title="Scroll mouse wheel to change risk (Lot size updates automatically)"
                            className="w-16 px-1.5 py-0.5 bg-[var(--card)] border border-[var(--border)] rounded font-bold text-center outline-none text-xs text-rose-500 font-semibold"
                            placeholder="5"
                          />
                        </div>

                        {steppingTiers.length > 1 && (
                          <button
                            onClick={() => handleDeleteTier(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer mt-3"
                            title="Remove tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <button
                  onClick={resetPlanToDefault}
                  className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                >
                  Reset Plan to Original
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSteppingModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applySteppingRules}
                    className="px-4 py-1.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Apply Stepping Rules
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Add New Plan Modal */}
      <AnimatePresence>
        {isAddPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neumorphic-card w-full max-w-lg p-5 bg-[var(--card)] border border-[var(--border)] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Plus className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[var(--foreground)]">
                      Add New Projection Plan
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Create a tailored compounding plan or pick from pre-built models
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddPlanModalOpen(false)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dual Mode Switcher Tabs: Auto vs Custom vs Templates */}
              <div className="flex items-center p-1 bg-[var(--muted)]/60 rounded-xl border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setAddPlanTab("auto")}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    addPlanTab === "auto"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Auto Smart Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddPlanTab("custom")}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    addPlanTab === "custom"
                      ? "bg-[#4F39F6] text-white shadow-xs"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Custom Compound</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddPlanTab("templates")}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    addPlanTab === "templates"
                      ? "bg-slate-700 text-white shadow-xs"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span>Templates</span>
                </button>
              </div>

              <div className="space-y-3.5 text-xs max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {/* ========================================================================= */}
                {/* TAB 1: AUTO SMART COMPOUND GENERATOR (e.g. $5 capital auto plan)         */}
                {/* ========================================================================= */}
                {addPlanTab === "auto" && (
                  <div className="space-y-3.5">
                    {/* Category Switcher: Personal / Micro vs Prop Firm / Funded */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--muted)]/60 rounded-2xl border border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountCategory("micro");
                          if (autoStartCap >= 5000) {
                            setAutoStartCap(5);
                            setAutoTargetCap(500);
                            setAutoRiskModel("micro_growth");
                          }
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          accountCategory === "micro"
                            ? "bg-[var(--card)] text-emerald-500 shadow-xs border border-[var(--border)] font-black"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <span>🌱 Personal / Micro ($5 – $1k)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAccountCategory("funded");
                          if (autoStartCap < 5000) {
                            setAutoStartCap(100000);
                            setAutoTargetCap(108000); // +8% Phase 1 Challenge
                            setAutoRiskModel("funded_half_pct"); // 0.5% Risk
                          }
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          accountCategory === "funded"
                            ? "bg-[var(--card)] text-blue-500 shadow-xs border border-[var(--border)] font-black"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <span>🏛️ Prop Firm / Funded ($5k – $200k)</span>
                      </button>
                    </div>

                    {/* Informative Guidance Banner */}
                    <div className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs ${
                      accountCategory === "funded"
                        ? "bg-blue-500/10 border-blue-500/25 text-blue-900 dark:text-blue-200"
                        : "bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200"
                    }`}>
                      <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${accountCategory === "funded" ? "text-blue-500" : "text-emerald-500"}`} />
                      <div className="text-[11px] leading-relaxed">
                        {accountCategory === "funded" ? (
                          <>
                            <strong>Prop Firm / Funded Challenge Engine:</strong> 100k, 50k, 25k වැනි ඕනෑම Funded Account එකක් සඳහා <strong>0.5% Risk</strong>, 1:2 R:R, සහ <strong>+8% Phase 1 Challenge</strong> (හෝ ඔබ කැමති Growth Target එකක්) සඳහා දින ගණන හා Trades නිවැරදිව සැලසුම් කර දේ!
                          </>
                        ) : (
                          <>
                            <strong>Smart Auto Compounder:</strong> ඔබ සතු මුදල ($5 හෝ ඕනෑම අගයක්) ඇතුළත් කරන්න. Realistic 0.01 lot sizing, 1:2 R:R, සහ 50-pip stop loss buffer අනුව lot sizes ස්වයංක්‍රීයව scale වේ!
                          </>
                        )}
                      </div>
                    </div>

                    {/* 1. Starting Capital */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-[var(--foreground)]">Starting Capital ($ USD)</label>
                        <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                          ≈ Rs. {Math.round(autoStartCap * fxRate).toLocaleString()} LKR
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-sm font-bold text-[var(--muted-foreground)]">$</span>
                          <input
                            type="number"
                            min="1"
                            step={accountCategory === "funded" ? "5000" : "1"}
                            value={autoStartCap || ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : Number(e.target.value);
                              setAutoStartCap(val);
                            }}
                            onBlur={() => {
                              if (autoStartCap < 1) setAutoStartCap(accountCategory === "funded" ? 100000 : 5);
                            }}
                            onWheel={(e) => {
                              e.preventDefault();
                              (e.nativeEvent as any).__wheelHandled = true;
                              const step = accountCategory === "funded" ? (e.shiftKey ? 25000 : 5000) : (e.shiftKey ? 10 : 1);
                              setAutoStartCap((prev) => Math.max(1, prev + (e.deltaY < 0 ? step : -step)));
                            }}
                            title="Scroll mouse wheel or type starting capital"
                            className="w-full pl-7 pr-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl font-black text-sm text-[var(--foreground)] outline-none focus:border-emerald-500"
                            placeholder={accountCategory === "funded" ? "e.g. 100000" : "e.g. 5"}
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0 flex-wrap">
                          {accountCategory === "funded" ? (
                            [
                              { label: "$5k", val: 5000 },
                              { label: "$10k", val: 10000 },
                              { label: "$25k", val: 25000 },
                              { label: "$50k", val: 50000 },
                              { label: "$100k", val: 100000 },
                              { label: "$200k", val: 200000 }
                            ].map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setAutoStartCap(p.val);
                                  setAutoTargetCap(Math.round(p.val * 1.08)); // +8% challenge target default
                                }}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  autoStartCap === p.val
                                    ? "bg-blue-500 text-white border-blue-500 shadow-xs"
                                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                              >
                                {p.label}
                              </button>
                            ))
                          ) : (
                            [5, 10, 25, 50, 100, 500].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => {
                                  setAutoStartCap(amt);
                                  if (autoTargetCap <= amt) setAutoTargetCap(amt * 20);
                                }}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  autoStartCap === amt
                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                              >
                                ${amt}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Target Capital (100% Freely Editable!) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-[var(--foreground)]">Growth Target ($ USD)</label>
                        <span className="text-[11px] font-mono text-emerald-500 font-bold">
                          {autoStartCap > 0 && autoTargetCap > autoStartCap ? (
                            `+${(((autoTargetCap - autoStartCap) / autoStartCap) * 100).toFixed(1)}% Growth (+$${(autoTargetCap - autoStartCap).toLocaleString()})`
                          ) : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-sm font-bold text-[var(--muted-foreground)]">$</span>
                          <input
                            type="number"
                            min="1"
                            step={accountCategory === "funded" ? "1000" : "10"}
                            value={autoTargetCap || ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : Number(e.target.value);
                              setAutoTargetCap(val);
                            }}
                            onBlur={() => {
                              if (autoTargetCap <= autoStartCap) {
                                setAutoTargetCap(Math.round(autoStartCap * (accountCategory === "funded" ? 1.08 : 1.5)));
                              }
                            }}
                            onWheel={(e) => {
                              e.preventDefault();
                              (e.nativeEvent as any).__wheelHandled = true;
                              const step = accountCategory === "funded" ? (e.shiftKey ? 5000 : 1000) : (e.shiftKey ? 50 : 10);
                              setAutoTargetCap((prev) => Math.max(autoStartCap + 1, prev + (e.deltaY < 0 ? step : -step)));
                            }}
                            title="Scroll mouse wheel or type custom target capital freely"
                            className="w-full pl-7 pr-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl font-black text-sm text-[var(--foreground)] outline-none focus:border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            placeholder={accountCategory === "funded" ? "e.g. 108000" : "e.g. 500"}
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0 flex-wrap">
                          {accountCategory === "funded" ? (
                            [
                              { label: "+5%", val: Math.round(autoStartCap * 1.05), desc: "Phase 2" },
                              { label: "+8%", val: Math.round(autoStartCap * 1.08), desc: "Phase 1" },
                              { label: "+10%", val: Math.round(autoStartCap * 1.10), desc: "Pass" },
                              { label: "+12%", val: Math.round(autoStartCap * 1.12), desc: "High" },
                              { label: "+15%", val: Math.round(autoStartCap * 1.15), desc: "Max" }
                            ].map((t, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setAutoTargetCap(t.val)}
                                title={`${t.label} = $${t.val.toLocaleString()} (${t.desc})`}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  autoTargetCap === t.val
                                    ? "bg-blue-500 text-white border-blue-500 shadow-xs"
                                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                              >
                                {t.label}
                              </button>
                            ))
                          ) : (
                            [
                              { label: "2x", val: autoStartCap * 2 },
                              { label: "5x", val: autoStartCap * 5 },
                              { label: "10x", val: autoStartCap * 10 },
                              { label: "20x", val: autoStartCap * 20 },
                              { label: "$500", val: 500 },
                              { label: "$1k", val: 1000 }
                            ].map((t, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setAutoTargetCap(t.val)}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  autoTargetCap === t.val
                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                              >
                                {t.label}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Risk & Lot Scaling Strategy Model */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-[var(--foreground)]">
                          {accountCategory === "funded" ? "Risk Model & Drawdown Strategy" : "Compounding Strategy & Lot Model"}
                        </label>
                        {accountCategory === "funded" && (
                          <span className="text-[10px] text-blue-500 font-bold">1:2 R:R ICT Model</span>
                        )}
                      </div>

                      {accountCategory === "funded" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAutoRiskModel("funded_half_pct")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              autoRiskModel === "funded_half_pct"
                                ? "border-blue-500 bg-blue-500/10 shadow-xs"
                                : "border-[var(--border)] bg-[var(--card)] hover:border-blue-500/40"
                            }`}
                          >
                            <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span>🛡️ 0.5% Risk (Prop Firm Standard)</span>
                              </span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">Recommended</span>
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                              ${Math.round(autoStartCap * 0.005).toLocaleString()} risk/trade • 1:2 R:R (+$${Math.round(autoStartCap * 0.01).toLocaleString()} win) • Max Drawdown Safe
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAutoRiskModel("funded_one_pct")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              autoRiskModel === "funded_one_pct"
                                ? "border-indigo-500 bg-indigo-500/10 shadow-xs"
                                : "border-[var(--border)] bg-[var(--card)] hover:border-indigo-500/40"
                            }`}
                          >
                            <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                              <span>⚖️ 1.0% Risk (Standard Prop)</span>
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                              ${Math.round(autoStartCap * 0.01).toLocaleString()} risk/trade • 1:2 R:R (+$${Math.round(autoStartCap * 0.02).toLocaleString()} win) • Fast Pass
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAutoRiskModel("funded_quarter_pct")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              autoRiskModel === "funded_quarter_pct"
                                ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                                : "border-[var(--border)] bg-[var(--card)] hover:border-emerald-500/40"
                            }`}
                          >
                            <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                              <span>🦺 0.25% Risk (Ultra Buffer)</span>
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                              ${Math.round(autoStartCap * 0.0025).toLocaleString()} risk/trade • Maximum drawdown protection
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAutoRiskModel("custom_pct")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              autoRiskModel === "custom_pct"
                                ? "border-amber-500 bg-amber-500/10 shadow-xs"
                                : "border-[var(--border)] bg-[var(--card)] hover:border-amber-500/40"
                            }`}
                          >
                            <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span>🎯 Custom Risk %</span>
                              </span>
                              {autoRiskModel === "custom_pct" && (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="5"
                                    value={autoCustomRiskPct}
                                    onChange={(e) => setAutoCustomRiskPct(Math.max(0.1, Number(e.target.value)))}
                                    className="w-14 px-1.5 py-0.5 bg-[var(--muted)] border border-[var(--border)] rounded text-xs font-bold text-center text-amber-500 outline-none"
                                  />
                                  <span className="text-[10px] font-bold text-amber-500">%</span>
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                              ${Math.round(autoStartCap * (autoCustomRiskPct / 100)).toLocaleString()} risk/trade • Custom target
                            </div>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAutoRiskModel("micro_growth")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              autoRiskModel === "micro_growth"
                                ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                                : "border-[var(--border)] bg-[var(--card)] hover:border-emerald-500/40"
                            }`}
                          >
                            <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                              <span>🌱 Micro Safe Growth</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 font-bold">Recommended</span>
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                              50-Pip Constant SL Room • 0.01 ($5 risk) ➔ 0.02 ($10 risk @ $60) ➔ 0.03 ($15 risk @ $120)
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAutoRiskModel("moderate")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              autoRiskModel === "moderate"
                                ? "border-indigo-500 bg-indigo-500/10 shadow-xs"
                                : "border-[var(--border)] bg-[var(--card)] hover:border-indigo-500/40"
                            }`}
                          >
                            <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                              <span>⚖️ Balanced 1:2 (3% Risk)</span>
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                              Standard 3% risk compounding • High consistency
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAutoRiskModel("conservative")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              autoRiskModel === "conservative"
                                ? "border-blue-500 bg-blue-500/10 shadow-xs"
                                : "border-[var(--border)] bg-[var(--card)] hover:border-blue-500/40"
                            }`}
                          >
                            <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                              <span>🛡️ Conservative (1.5% Risk)</span>
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                              Prop firm style • Maximum capital preservation
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAutoRiskModel("aggressive")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              autoRiskModel === "aggressive"
                                ? "border-rose-500 bg-rose-500/10 shadow-xs"
                                : "border-[var(--border)] bg-[var(--card)] hover:border-rose-500/40"
                            }`}
                          >
                            <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                              <span>🚀 Aggressive (6% Risk)</span>
                            </div>
                            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                              Rapid account flip • Fast compounding
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 4. Live Blueprint Summary Preview */}
                    {autoPreviewPlan && (
                      <div className="p-3.5 rounded-2xl bg-[var(--muted)]/40 border border-[var(--border)] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[var(--muted-foreground)] uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                            <Target className={`w-3.5 h-3.5 ${accountCategory === "funded" ? "text-blue-500" : "text-emerald-500"}`} />
                            {accountCategory === "funded" ? "Funded Challenge Blueprint" : "Plan Blueprint Preview"}
                          </span>
                          <span className={`font-mono font-bold ${accountCategory === "funded" ? "text-blue-500" : "text-emerald-500"}`}>
                            {autoPreviewPlan.totalTrades} Trades (~{Math.ceil(autoPreviewPlan.totalTrades / tradesPerDay)} Days @ {tradesPerDay}/day)
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
                          <div className="bg-[var(--card)] p-2 rounded-xl border border-[var(--border)]/50 shadow-2xs">
                            <div className="text-[10px] text-[var(--muted-foreground)]">Account Start</div>
                            <div className="font-black text-[var(--foreground)]">${autoStartCap.toLocaleString()}</div>
                            <div className="text-[9px] text-[var(--muted-foreground)]">Lot: {autoPreviewPlan.trades[0]?.lotSize}</div>
                          </div>
                          <div className="bg-[var(--card)] p-2 rounded-xl border border-[var(--border)]/50 shadow-2xs">
                            <div className="text-[10px] text-[var(--muted-foreground)]">Per Trade (1:2)</div>
                            <div className="font-black text-emerald-500">+{autoPreviewPlan.trades[0]?.profitUSD.toLocaleString()}</div>
                            <div className="text-[9px] text-rose-500">Risk: ${autoPreviewPlan.trades[0]?.risk.toLocaleString()} ({autoPreviewPlan.trades[0]?.riskPct}%)</div>
                          </div>
                          <div className="bg-[var(--card)] p-2 rounded-xl border border-[var(--border)]/50 shadow-2xs">
                            <div className="text-[10px] text-[var(--muted-foreground)]">Target Balance</div>
                            <div className="font-black text-emerald-500">${Math.round(autoPreviewPlan.targetBalance).toLocaleString()}</div>
                            <div className="text-[9px] text-[var(--muted-foreground)] truncate">
                              Goal: +${Math.round(autoPreviewPlan.targetBalance - autoStartCap).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Plan Name (Optional) */}
                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Custom Plan Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        placeholder={
                          accountCategory === "funded"
                            ? `e.g. $${(autoStartCap / 1000).toFixed(0)}k Challenge Roadmap`
                            : `e.g. $${autoStartCap} ➔ $${Math.round(autoTargetCap).toLocaleString()} Compound Road`
                        }
                        className="w-full px-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: CUSTOM COMPOUND PLAN (Full Manual Configuration)                    */}
                {/* ========================================================================= */}
                {addPlanTab === "custom" && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Plan Name
                      </label>
                      <input
                        type="text"
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        placeholder="e.g. $5 Scaling Challenge"
                        className="w-full px-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    {/* Compounding Model Selector */}
                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Compounding Style
                      </label>
                      <select
                        value={customCompoundType}
                        onChange={(e) => setCustomCompoundType(e.target.value as CustomCompoundType)}
                        className="w-full px-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] outline-none"
                      >
                        <option value="tier_scaling">Milestone Tier Scaling (0.01 lot start, scales as balance doubles)</option>
                        <option value="percent_risk">Dynamic % Risk of Current Balance (e.g. 2.5% per trade)</option>
                        <option value="fixed_risk">Fixed Dollar Risk per Trade</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                          Starting Capital ($)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newPlanStartCap}
                          onChange={(e) => setNewPlanStartCap(Math.max(1, Number(e.target.value)))}
                          onWheel={(e) => {
                            e.preventDefault();
                            (e.nativeEvent as any).__wheelHandled = true;
                            const step = e.shiftKey ? 10 : 1;
                            setNewPlanStartCap((prev) => Math.max(1, prev + (e.deltaY < 0 ? step : -step)));
                          }}
                          title="Scroll mouse wheel to change (Shift = $10)"
                          className="w-full px-3 py-1.5 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl font-bold text-[var(--foreground)] outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                          Initial Lot Size
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={newPlanLot}
                          onChange={(e) => {
                            const val = Math.max(0.01, Number(Number(e.target.value).toFixed(2)));
                            setNewPlanLot(val);
                            setNewPlanRiskUSD(Number((val * 500).toFixed(1)));
                          }}
                          onWheel={(e) => {
                            e.preventDefault();
                            (e.nativeEvent as any).__wheelHandled = true;
                            const step = e.shiftKey ? 0.05 : 0.01;
                            setNewPlanLot((prev) => {
                              const nextLot = Math.max(0.01, Number((prev + (e.deltaY < 0 ? step : -step)).toFixed(2)));
                              setNewPlanRiskUSD(Number((nextLot * 500).toFixed(1)));
                              return nextLot;
                            });
                          }}
                          title="Scroll mouse wheel to change lot size"
                          className="w-full px-3 py-1.5 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl font-bold text-[var(--foreground)] outline-none"
                        />
                      </div>

                      {customCompoundType === "percent_risk" ? (
                        <div>
                          <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                            Risk % per Trade
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="20"
                            value={customRiskPercent}
                            onChange={(e) => setCustomRiskPercent(Math.max(0.5, Number(e.target.value)))}
                            onWheel={(e) => {
                              e.preventDefault();
                              (e.nativeEvent as any).__wheelHandled = true;
                              const step = 0.5;
                              setCustomRiskPercent((prev) => Math.max(0.5, Number((prev + (e.deltaY < 0 ? step : -step)).toFixed(1))));
                            }}
                            title="Scroll mouse wheel to change risk %"
                            className="w-full px-3 py-1.5 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl font-bold text-[var(--foreground)] outline-none text-rose-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                            Risk per Trade ($)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={newPlanRiskUSD}
                            onChange={(e) => {
                              const val = Math.max(0.5, Number(e.target.value));
                              setNewPlanRiskUSD(val);
                            }}
                            onWheel={(e) => {
                              e.preventDefault();
                              (e.nativeEvent as any).__wheelHandled = true;
                              const step = e.shiftKey ? 5 : 0.5;
                              setNewPlanRiskUSD((prev) => Math.max(0.5, prev + (e.deltaY < 0 ? step : -step)));
                            }}
                            title="Scroll mouse wheel to change risk"
                            className="w-full px-3 py-1.5 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl font-bold text-[var(--foreground)] outline-none text-rose-500"
                          />
                        </div>
                      )}

                      {/* Live SL Pips Breathing Space Indicator */}
                      {customCompoundType !== "percent_risk" && (() => {
                        const calculatedSlPips = newPlanLot > 0 ? Math.round(newPlanRiskUSD / (newPlanLot * 10)) : 0;
                        const isHealthy = calculatedSlPips >= 40;
                        const isTight = calculatedSlPips >= 25 && calculatedSlPips < 40;
                        return (
                          <div className="col-span-2">
                            <div className={`p-2 rounded-xl border text-xs font-mono flex items-center justify-between ${
                              isHealthy
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                : isTight
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                            }`}>
                              <span className="font-bold flex items-center gap-1.5">
                                {isHealthy ? "🛡️ Healthy Stop Loss Room:" : isTight ? "⚠️ Moderate SL Space:" : "🚨 Squeezed SL Warning:"}
                                <span className="underline">{calculatedSlPips} Pips SL</span>
                              </span>
                              <span className="text-[10px] opacity-90">
                                {calculatedSlPips < 30 ? `Noise stop-out risk! (Recommended 50 pips = $${Number((newPlanLot * 500).toFixed(1))})` : "Safe ICT / FVG breathing space"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <div>
                        <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                          R:R Ratio (1:X)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={newPlanRR}
                          onChange={(e) => setNewPlanRR(Math.max(0.5, Number(e.target.value)))}
                          onWheel={(e) => {
                            e.preventDefault();
                            (e.nativeEvent as any).__wheelHandled = true;
                            const step = 0.5;
                            setNewPlanRR((prev) => Math.max(0.5, Number((prev + (e.deltaY < 0 ? step : -step)).toFixed(1))));
                          }}
                          title="Scroll mouse wheel to change R:R"
                          className="w-full px-3 py-1.5 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl font-bold text-[var(--foreground)] outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                          Total Trades
                        </label>
                        <input
                          type="number"
                          step="10"
                          min="10"
                          max="500"
                          value={newPlanTradeCount}
                          onChange={(e) => setNewPlanTradeCount(Math.min(500, Math.max(10, Number(e.target.value))))}
                          onWheel={(e) => {
                            e.preventDefault();
                            (e.nativeEvent as any).__wheelHandled = true;
                            const step = e.shiftKey ? 50 : 10;
                            setNewPlanTradeCount((prev) => Math.min(500, Math.max(10, prev + (e.deltaY < 0 ? step : -step))));
                          }}
                          title="Scroll mouse wheel to change trade count"
                          className="w-full px-3 py-1.5 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl font-bold text-[var(--foreground)] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: PRE-BUILT TEMPLATES                                                */}
                {/* ========================================================================= */}
                {addPlanTab === "templates" && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Select Template
                      </label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] outline-none"
                      >
                        {EXTRA_PROJECTION_TEMPLATES.map((tmpl) => (
                          <option key={tmpl.id} value={tmpl.id}>
                            {tmpl.title} ({tmpl.subtitle})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Custom Plan Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        placeholder="Leave blank for template default name"
                        className="w-full px-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddPlanModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewPlan}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95 ${
                    addPlanTab === "auto"
                      ? (accountCategory === "funded"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
                          : "bg-gradient-to-r from-emerald-500 to-[#10B981] hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25")
                      : "bg-[#4F39F6] hover:bg-[#4338CA] shadow-indigo-500/25"
                  }`}
                >
                  {addPlanTab === "auto" ? (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>
                        Generate & Launch {accountCategory === "funded" ? `$${(autoStartCap / 1000).toFixed(0)}k Prop` : `$${autoStartCap}`} Plan ({autoPreviewPlan?.totalTrades || 0} Trades)
                      </span>
                    </>
                  ) : addPlanTab === "custom" ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create Custom Plan</span>
                    </>
                  ) : (
                    <span>Load Template Plan</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDIT EXISTING PROJECTION PLAN                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditPlanModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-500">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-[var(--foreground)]">
                      Edit Plan: <span className="text-blue-500">{editPlanTitle || "Selected Plan"}</span>
                    </h2>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      Modify target, starting capital, or risk settings for this specific plan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditPlanModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-[var(--muted)] text-[var(--muted-foreground)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="space-y-3.5 text-xs max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {/* 1. Plan Title & Badge */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="font-bold text-[var(--foreground)] block mb-1">
                      Plan Title
                    </label>
                    <input
                      type="text"
                      value={editPlanTitle}
                      onChange={(e) => setEditPlanTitle(e.target.value)}
                      placeholder="e.g. FTMO $100k Phase 1"
                      className="w-full px-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[var(--foreground)] block mb-1">
                      Badge
                    </label>
                    <input
                      type="text"
                      value={editPlanBadge}
                      onChange={(e) => setEditPlanBadge(e.target.value)}
                      placeholder="e.g. FTMO 100k"
                      className="w-full px-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* 2. Starting Capital */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[var(--foreground)]">Starting Capital ($ USD)</label>
                    <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                      ≈ Rs. {Math.round(editPlanStartCap * fxRate).toLocaleString()} LKR
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-sm font-bold text-[var(--muted-foreground)]">$</span>
                      <input
                        type="number"
                        min="1"
                        step={editPlanCategory === "funded" || editPlanStartCap >= 2000 ? "5000" : "1"}
                        value={editPlanStartCap || ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : Number(e.target.value);
                          setEditPlanStartCap(val);
                          if (val >= 2000 && editPlanCategory !== "funded") {
                            setEditPlanCategory("funded");
                            setEditPlanRiskModel("funded_half_pct");
                          } else if (val < 2000 && editPlanCategory !== "micro") {
                            setEditPlanCategory("micro");
                            setEditPlanRiskModel("micro_growth");
                          }
                        }}
                        onBlur={() => {
                          if (editPlanStartCap < 1) setEditPlanStartCap(editPlanCategory === "funded" ? 100000 : 5);
                        }}
                        onWheel={(e) => {
                          e.preventDefault();
                          (e.nativeEvent as any).__wheelHandled = true;
                          const isProp = editPlanCategory === "funded" || editPlanStartCap >= 2000;
                          const step = isProp ? (e.shiftKey ? 25000 : 5000) : (e.shiftKey ? 10 : 1);
                          setEditPlanStartCap((prev) => Math.max(1, prev + (e.deltaY < 0 ? step : -step)));
                        }}
                        className="w-full pl-7 pr-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl font-black text-sm text-[var(--foreground)] outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0 flex-wrap">
                      {(editPlanCategory === "funded" || editPlanStartCap >= 2000) ? (
                        [
                          { label: "$5k", val: 5000 },
                          { label: "$10k", val: 10000 },
                          { label: "$25k", val: 25000 },
                          { label: "$50k", val: 50000 },
                          { label: "$100k", val: 100000 },
                          { label: "$200k", val: 200000 }
                        ].map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setEditPlanStartCap(p.val);
                              setEditPlanTargetCap(Math.round(p.val * 1.08));
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              editPlanStartCap === p.val
                                ? "bg-blue-500 text-white border-blue-500 shadow-xs"
                                : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))
                      ) : (
                        [5, 10, 25, 50, 100, 500].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => {
                              setEditPlanStartCap(amt);
                              if (editPlanTargetCap <= amt) setEditPlanTargetCap(amt * 20);
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              editPlanStartCap === amt
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                                : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            ${amt}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Target Capital (100% Freely Editable!) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[var(--foreground)]">Growth Target ($ USD)</label>
                    <span className="text-[11px] font-mono text-emerald-500 font-bold">
                      {editPlanStartCap > 0 && editPlanTargetCap > editPlanStartCap ? (
                        `+${(((editPlanTargetCap - editPlanStartCap) / editPlanStartCap) * 100).toFixed(1)}% Growth (+$${(editPlanTargetCap - editPlanStartCap).toLocaleString()})`
                      ) : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-sm font-bold text-[var(--muted-foreground)]">$</span>
                      <input
                        type="number"
                        min="1"
                        step={(editPlanCategory === "funded" || editPlanStartCap >= 2000) ? "1000" : "10"}
                        value={editPlanTargetCap || ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : Number(e.target.value);
                          setEditPlanTargetCap(val);
                        }}
                        onBlur={() => {
                          if (editPlanTargetCap <= editPlanStartCap) {
                            setEditPlanTargetCap(Math.round(editPlanStartCap * ((editPlanCategory === "funded" || editPlanStartCap >= 2000) ? 1.08 : 1.5)));
                          }
                        }}
                        onWheel={(e) => {
                          e.preventDefault();
                          (e.nativeEvent as any).__wheelHandled = true;
                          const isProp = editPlanCategory === "funded" || editPlanStartCap >= 2000;
                          const step = isProp ? (e.shiftKey ? 5000 : 1000) : (e.shiftKey ? 50 : 10);
                          setEditPlanTargetCap((prev) => Math.max(editPlanStartCap + 1, prev + (e.deltaY < 0 ? step : -step)));
                        }}
                        title="Scroll mouse wheel or type custom target capital"
                        className="w-full pl-7 pr-3 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl font-black text-sm text-[var(--foreground)] outline-none focus:border-blue-500 text-blue-600 dark:text-blue-400"
                        placeholder={(editPlanCategory === "funded" || editPlanStartCap >= 2000) ? "e.g. 108000" : "e.g. 500"}
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0 flex-wrap">
                      {(editPlanCategory === "funded" || editPlanStartCap >= 2000) ? (
                        [
                          { label: "+5%", val: Math.round(editPlanStartCap * 1.05), desc: "Phase 2" },
                          { label: "+8%", val: Math.round(editPlanStartCap * 1.08), desc: "Phase 1" },
                          { label: "+10%", val: Math.round(editPlanStartCap * 1.10), desc: "Pass" },
                          { label: "+15%", val: Math.round(editPlanStartCap * 1.15), desc: "Max" }
                        ].map((t, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditPlanTargetCap(t.val)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              editPlanTargetCap === t.val
                                ? "bg-blue-500 text-white border-blue-500 shadow-xs"
                                : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))
                      ) : (
                        [
                          { label: "2x", val: editPlanStartCap * 2 },
                          { label: "5x", val: editPlanStartCap * 5 },
                          { label: "10x", val: editPlanStartCap * 10 },
                          { label: "$500", val: 500 },
                          { label: "$1k", val: 1000 }
                        ].map((t, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditPlanTargetCap(t.val)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              editPlanTargetCap === t.val
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                                : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Strategy / Risk Model */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-[var(--foreground)]">
                      {editPlanCategory === "funded" ? "Risk Model & Drawdown Strategy" : "Compounding Strategy & Lot Model"}
                    </label>
                  </div>

                  {editPlanCategory === "funded" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditPlanRiskModel("funded_half_pct")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          editPlanRiskModel === "funded_half_pct"
                            ? "border-blue-500 bg-blue-500/10 shadow-xs"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-blue-500/40"
                        }`}
                      >
                        <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center justify-between">
                          <span>🛡️ 0.5% Risk (Prop Standard)</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">Recommended</span>
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                          ${Math.round(editPlanStartCap * 0.005).toLocaleString()} risk/trade • 1:2 R:R (+$${Math.round(editPlanStartCap * 0.01).toLocaleString()} win)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditPlanRiskModel("funded_one_pct")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          editPlanRiskModel === "funded_one_pct"
                            ? "border-indigo-500 bg-indigo-500/10 shadow-xs"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-indigo-500/40"
                        }`}
                      >
                        <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                          <span>⚖️ 1.0% Risk (Standard Prop)</span>
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                          ${Math.round(editPlanStartCap * 0.01).toLocaleString()} risk/trade • 1:2 R:R (+$${Math.round(editPlanStartCap * 0.02).toLocaleString()} win)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditPlanRiskModel("funded_quarter_pct")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          editPlanRiskModel === "funded_quarter_pct"
                            ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-emerald-500/40"
                        }`}
                      >
                        <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                          <span>🦺 0.25% Risk (Ultra Buffer)</span>
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                          ${Math.round(editPlanStartCap * 0.0025).toLocaleString()} risk/trade • Maximum drawdown protection
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditPlanRiskModel("custom_pct")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          editPlanRiskModel === "custom_pct"
                            ? "border-amber-500 bg-amber-500/10 shadow-xs"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-amber-500/40"
                        }`}
                      >
                        <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center justify-between">
                          <span>🎯 Custom Risk %</span>
                          {editPlanRiskModel === "custom_pct" && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="5"
                                value={editPlanCustomRiskPct}
                                onChange={(e) => setEditPlanCustomRiskPct(Math.max(0.1, Number(e.target.value)))}
                                className="w-14 px-1.5 py-0.5 bg-[var(--muted)] border border-[var(--border)] rounded text-xs font-bold text-center text-amber-500 outline-none"
                              />
                              <span className="text-[10px] font-bold text-amber-500">%</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                          ${Math.round(editPlanStartCap * (editPlanCustomRiskPct / 100)).toLocaleString()} risk/trade • Custom target
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditPlanRiskModel("micro_growth")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          editPlanRiskModel === "micro_growth"
                            ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-emerald-500/40"
                        }`}
                      >
                        <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                          <span>🌱 Micro Safe Growth</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 font-bold">Recommended</span>
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                          50-Pip Constant SL Room • 0.01 ($5 risk) ➔ 0.02 ($10 risk @ $60)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditPlanRiskModel("moderate")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          editPlanRiskModel === "moderate"
                            ? "border-indigo-500 bg-indigo-500/10 shadow-xs"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-indigo-500/40"
                        }`}
                      >
                        <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                          <span>⚖️ Balanced 1:2 (3% Risk)</span>
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                          Standard 3% risk compounding • High consistency
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditPlanRiskModel("conservative")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          editPlanRiskModel === "conservative"
                            ? "border-blue-500 bg-blue-500/10 shadow-xs"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-blue-500/40"
                        }`}
                      >
                        <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                          <span>🛡️ Conservative (1.5% Risk)</span>
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                          Prop firm style • Maximum capital preservation
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditPlanRiskModel("aggressive")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          editPlanRiskModel === "aggressive"
                            ? "border-rose-500 bg-rose-500/10 shadow-xs"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-rose-500/40"
                        }`}
                      >
                        <div className="font-extrabold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                          <span>🚀 Aggressive (6% Risk)</span>
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                          Rapid account flip • Fast compounding
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. Preservation of trade results */}
                <div className="p-3 rounded-2xl bg-[var(--muted)]/40 border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[var(--foreground)]">Preserve Executed Trades (Wins/Losses)</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">Keep existing marked results for this plan</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editPlanKeepExecutions}
                    onChange={(e) => setEditPlanKeepExecutions(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* 7. Preview Blueprint */}
                {editPreviewPlan && (
                  <div className="p-3.5 rounded-2xl bg-[var(--muted)]/40 border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--muted-foreground)] uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                        <Target className={`w-3.5 h-3.5 ${editPlanCategory === "funded" ? "text-blue-500" : "text-emerald-500"}`} />
                        Updated Roadmap Blueprint
                      </span>
                      <span className={`font-mono font-bold ${editPlanCategory === "funded" ? "text-blue-500" : "text-emerald-500"}`}>
                        {editPreviewPlan.totalTrades} Trades (~{Math.ceil(editPreviewPlan.totalTrades / tradesPerDay)} Days @ {tradesPerDay}/day)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
                      <div className="bg-[var(--card)] p-2 rounded-xl border border-[var(--border)]/50 shadow-2xs">
                        <div className="text-[10px] text-[var(--muted-foreground)]">Start Capital</div>
                        <div className="font-black text-[var(--foreground)]">${editPlanStartCap.toLocaleString()}</div>
                        <div className="text-[9px] text-[var(--muted-foreground)]">Lot: {editPreviewPlan.trades[0]?.lotSize}</div>
                      </div>
                      <div className="bg-[var(--card)] p-2 rounded-xl border border-[var(--border)]/50 shadow-2xs">
                        <div className="text-[10px] text-[var(--muted-foreground)]">Per Trade (1:2)</div>
                        <div className="font-black text-emerald-500">+{editPreviewPlan.trades[0]?.profitUSD.toLocaleString()}</div>
                        <div className="text-[9px] text-rose-500">Risk: ${editPreviewPlan.trades[0]?.risk.toLocaleString()}</div>
                      </div>
                      <div className="bg-[var(--card)] p-2 rounded-xl border border-[var(--border)]/50 shadow-2xs">
                        <div className="text-[10px] text-[var(--muted-foreground)]">Target Balance</div>
                        <div className="font-black text-emerald-500">${Math.round(editPreviewPlan.targetBalance).toLocaleString()}</div>
                        <div className="text-[9px] text-[var(--muted-foreground)] truncate">
                          Goal: +${Math.round(editPreviewPlan.targetBalance - editPlanStartCap).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditPlanModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] cursor-pointer"
                  >
                    Cancel
                  </button>

                  {plans.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deletePlan(editingPlanId)}
                      className="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Permanently delete this plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Plan</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveEditPlan}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Update Plan</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
