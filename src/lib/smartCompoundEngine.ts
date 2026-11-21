import { ProjectionPreset, ProjectionTrade } from "@/data/projectionPresets";

export type RiskModelType = 
  | "micro_growth" 
  | "funded_half_pct" 
  | "funded_one_pct" 
  | "funded_quarter_pct" 
  | "moderate" 
  | "conservative" 
  | "aggressive" 
  | "custom_pct";

export type CustomCompoundType = "tier_scaling" | "percent_risk" | "fixed_risk";

export interface AutoCompoundConfig {
  startingBalance: number; // e.g. 5, 10000, 100000
  targetBalance: number;   // e.g. 50, 108000, 110000
  riskModel: RiskModelType;
  customRiskPct?: number;  // e.g. 0.5, 0.75, 1.0
  rrRatio?: number;        // default 2.0 (1:2 R:R)
  fxRate?: number;         // default 332.39
  planName?: string;
  tradesPerDay?: number;   // default 2
  accountType?: "micro" | "funded" | "personal";
}

export interface CustomCompoundConfig {
  startingBalance: number;
  compoundType: CustomCompoundType;
  initialLot: number;
  riskUSD?: number;
  riskPercent?: number;
  rrRatio: number;
  totalTrades: number;
  targetBalance?: number;
  fxRate?: number;
  planName?: string;
}

// Milestone Lot Tier Table tailored for practical Forex execution (0.01 lot minimum, 50 pips SL breathing space)
// Formula: Risk = lotSize * 50 pips * $10/lot = lotSize * 500
export const TIER_LADDER = [
  { maxCap: 60, lot: 0.01, risk: 5.0, slPips: 50 },
  { maxCap: 120, lot: 0.02, risk: 10.0, slPips: 50 },
  { maxCap: 240, lot: 0.03, risk: 15.0, slPips: 50 },
  { maxCap: 500, lot: 0.05, risk: 25.0, slPips: 50 },
  { maxCap: 1000, lot: 0.10, risk: 50.0, slPips: 50 },
  { maxCap: 2000, lot: 0.20, risk: 100.0, slPips: 50 },
  { maxCap: 4000, lot: 0.35, risk: 175.0, slPips: 50 },
  { maxCap: 8000, lot: 0.70, risk: 350.0, slPips: 50 },
  { maxCap: 15000, lot: 1.50, risk: 750.0, slPips: 50 },
  { maxCap: Infinity, lot: 2.50, risk: 1250.0, slPips: 50 }
];

/**
 * Returns appropriate lot size and dollar risk for micro growth model based on current capital.
 * Enforces a minimum 50-pip stop loss buffer across all tiers so trades are never choked by noise.
 */
export function getMicroGrowthMetrics(cap: number): { lot: number; risk: number; slPips: number } {
  for (const tier of TIER_LADDER) {
    if (cap < tier.maxCap) {
      const effectiveRisk = Math.min(tier.risk, Math.max(1, cap));
      return { lot: tier.lot, risk: effectiveRisk, slPips: tier.slPips };
    }
  }
  return { lot: 2.50, risk: 1250.0, slPips: 50 };
}

/**
 * Generates an intelligent, realistic trading compound plan tailored to ANY starting capital.
 */
export function generateAutoCompoundPlan(config: AutoCompoundConfig): ProjectionPreset {
  const startCap = Math.max(1, Number(config.startingBalance) || 5);
  // Allow user to set ANY target greater than startCap without forcing artificial minimums!
  const targetCap = Math.max(startCap + 1, Number(config.targetBalance) || Math.round(startCap * (config.accountType === "funded" || startCap >= 5000 ? 1.08 : 1.5)));
  const rr = Math.max(0.5, Number(config.rrRatio) || 2.0);
  const fx = Number(config.fxRate) || 332.39;
  const model = config.riskModel || (startCap >= 5000 ? "funded_half_pct" : "micro_growth");

  const trades: ProjectionTrade[] = [];
  let currentCap = startCap;
  let tradeIndex = 1;
  const maxTradesLimit = 250;

  while (currentCap < targetCap && tradeIndex <= maxTradesLimit) {
    let riskVal = 1;
    let lotVal = 0.01;

    if (model === "micro_growth") {
      const metrics = getMicroGrowthMetrics(currentCap);
      lotVal = metrics.lot;
      riskVal = metrics.risk;
    } else if (model === "funded_half_pct") {
      // 0.5% Risk per trade (Prop firm standard based on start capital to protect drawdown limits)
      const baseCap = config.accountType === "funded" || startCap >= 5000 ? startCap : currentCap;
      riskVal = Number((baseCap * 0.005).toFixed(2));
      lotVal = Math.max(0.01, Number((riskVal / 500).toFixed(2)));
    } else if (model === "funded_one_pct") {
      // 1.0% Risk per trade
      const baseCap = config.accountType === "funded" || startCap >= 5000 ? startCap : currentCap;
      riskVal = Number((baseCap * 0.01).toFixed(2));
      lotVal = Math.max(0.01, Number((riskVal / 500).toFixed(2)));
    } else if (model === "funded_quarter_pct") {
      // 0.25% Risk per trade (Ultra safe buffer)
      const baseCap = config.accountType === "funded" || startCap >= 5000 ? startCap : currentCap;
      riskVal = Number((baseCap * 0.0025).toFixed(2));
      lotVal = Math.max(0.01, Number((riskVal / 500).toFixed(2)));
    } else if (model === "custom_pct") {
      const pct = Math.max(0.1, Number(config.customRiskPct) || 0.5);
      const baseCap = config.accountType === "funded" || startCap >= 5000 ? startCap : currentCap;
      riskVal = Number((baseCap * (pct / 100)).toFixed(2));
      lotVal = Math.max(0.01, Number((riskVal / 500).toFixed(2)));
    } else if (model === "conservative") {
      // 1.5% Risk per trade (Min $5 for 0.01 lot to maintain 50-pip SL)
      const rawRisk = Number((currentCap * 0.015).toFixed(2));
      lotVal = Math.max(0.01, Number((rawRisk / 500).toFixed(2)));
      riskVal = Math.max(5, Number((lotVal * 500).toFixed(2)));
    } else if (model === "moderate") {
      // 3.0% Risk per trade (Min $5 for 0.01 lot to maintain 50-pip SL)
      const rawRisk = Number((currentCap * 0.03).toFixed(2));
      lotVal = Math.max(0.01, Number((rawRisk / 500).toFixed(2)));
      riskVal = Math.max(5, Number((lotVal * 500).toFixed(2)));
    } else if (model === "aggressive") {
      // 6.0% Risk per trade (Min $5 for 0.01 lot to maintain 50-pip SL)
      const rawRisk = Number((currentCap * 0.06).toFixed(2));
      lotVal = Math.max(0.01, Number((rawRisk / 500).toFixed(2)));
      riskVal = Math.max(5, Number((lotVal * 500).toFixed(2)));
    }

    // Profit with R:R
    const profitVal = Number((riskVal * rr).toFixed(2));
    const endBal = Number((currentCap + profitVal).toFixed(2));
    const riskPct = currentCap > 0 ? Number(((riskVal / currentCap) * 100).toFixed(2)) : 0;

    trades.push({
      tradeNum: tradeIndex,
      sheetTradeNum: tradeIndex,
      projectedCapital: Number(currentCap.toFixed(2)),
      risk: riskVal,
      riskPct,
      lotSize: lotVal,
      profitUSD: profitVal,
      profitLKR: Math.round(profitVal * fx),
      endBalanceUSD: endBal,
      targetLKRBalance: Math.round(endBal * fx)
    });

    currentCap = endBal;
    tradeIndex++;
  }

  // If target <= startCap, ensure at least 1 trade
  if (trades.length === 0) {
    const riskVal = startCap >= 5000 ? Number((startCap * 0.005).toFixed(2)) : 5;
    const lotVal = Math.max(0.01, Number((riskVal / 500).toFixed(2)));
    const profitVal = Number((riskVal * rr).toFixed(2));
    trades.push({
      tradeNum: 1,
      sheetTradeNum: 1,
      projectedCapital: startCap,
      risk: riskVal,
      riskPct: Number(((riskVal / startCap) * 100).toFixed(2)),
      lotSize: lotVal,
      profitUSD: profitVal,
      profitLKR: Math.round(profitVal * fx),
      endBalanceUSD: Number((startCap + profitVal).toFixed(2)),
      targetLKRBalance: Math.round((startCap + profitVal) * fx)
    });
    currentCap = startCap + profitVal;
  }

  const isFundedPlan = config.accountType === "funded" || startCap >= 5000;
  const growthPct = Math.round(((currentCap - startCap) / startCap) * 100);
  const defaultTitle = isFundedPlan
    ? `$${(startCap / 1000).toFixed(0)}k Prop Plan (+${growthPct}%)`
    : `$${startCap} ➔ $${Math.round(currentCap).toLocaleString()} Plan`;

  const title = config.planName?.trim() || defaultTitle;
  const newId = `auto-plan-${Date.now()}`;

  const modelLabels: Record<RiskModelType, string> = {
    micro_growth: "Micro Growth (50-Pip Fixed SL Buffer • 0.01+ Lot)",
    funded_half_pct: "Prop Firm Funded (0.5% Risk • 1:2 RR • Max Safety)",
    funded_one_pct: "Prop Firm Funded (1.0% Risk • 1:2 RR • Standard Prop)",
    funded_quarter_pct: "Prop Firm Funded (0.25% Risk • 1:2 RR • Ultra Buffer)",
    custom_pct: `Custom ${config.customRiskPct || 0.5}% Risk Compound`,
    moderate: "Balanced Compound (3% Risk • 50-Pip Buffer • 1:2 RR)",
    conservative: "Conservative Preservation (1.5% Risk • 50-Pip Buffer)",
    aggressive: "Aggressive Compound (6% Risk • 50-Pip Buffer)"
  };

  const badge = isFundedPlan ? `$${(startCap / 1000).toFixed(0)}k Funded` : `$${startCap} Plan`;
  const color = isFundedPlan ? "blue" : "emerald";

  return {
    id: newId,
    sheetName: title,
    title,
    subtitle: `${modelLabels[model]} • $${startCap.toLocaleString()} Start ➔ $${Math.round(currentCap).toLocaleString()} (${trades.length} Trades)`,
    startingBalance: startCap,
    targetBalance: trades[trades.length - 1].endBalanceUSD,
    totalTrades: trades.length,
    type: "auto_compound",
    badge,
    color,
    trades,
    isCustom: true
  };
}

/**
 * Generates a fully customizable compound plan based on user specifications.
 */
export function generateCustomCompoundPlan(config: CustomCompoundConfig): ProjectionPreset {
  const startCap = Math.max(1, Number(config.startingBalance) || 5);
  const tradeCount = Math.min(300, Math.max(10, Number(config.totalTrades) || 100));
  const rr = Math.max(0.5, Number(config.rrRatio) || 2.0);
  const fx = Number(config.fxRate) || 332.39;
  const compoundType = config.compoundType || "tier_scaling";

  const trades: ProjectionTrade[] = [];
  let currentCap = startCap;

  for (let i = 1; i <= tradeCount; i++) {
    let riskVal = Number(config.riskUSD) || 5;
    let lotVal = Number(config.initialLot) || 0.01;

    if (compoundType === "tier_scaling") {
      const metrics = getMicroGrowthMetrics(currentCap);
      lotVal = metrics.lot;
      riskVal = metrics.risk;
    } else if (compoundType === "percent_risk") {
      const pct = Math.max(0.5, Number(config.riskPercent) || 2.5);
      const rawRisk = Number((currentCap * (pct / 100)).toFixed(2));
      lotVal = Math.max(0.01, Number((rawRisk / 500).toFixed(2)));
      riskVal = Math.max(5, Number((lotVal * 500).toFixed(2)));
    } else {
      // Fixed risk
      lotVal = Math.max(0.01, Number(config.initialLot) || 0.01);
      riskVal = Math.max(1, Number(config.riskUSD) || 5);
    }

    const profitVal = Number((riskVal * rr).toFixed(2));
    const endBal = Number((currentCap + profitVal).toFixed(2));
    const riskPct = currentCap > 0 ? Number(((riskVal / currentCap) * 100).toFixed(2)) : 0;

    trades.push({
      tradeNum: i,
      sheetTradeNum: i,
      projectedCapital: Number(currentCap.toFixed(2)),
      risk: riskVal,
      riskPct,
      lotSize: lotVal,
      profitUSD: profitVal,
      profitLKR: Math.round(profitVal * fx),
      endBalanceUSD: endBal,
      targetLKRBalance: Math.round(endBal * fx)
    });

    currentCap = endBal;
  }

  const title = config.planName?.trim() || `$${startCap} Custom Compound Plan`;
  const newId = `custom-plan-${Date.now()}`;

  return {
    id: newId,
    sheetName: title,
    title,
    subtitle: `Custom Plan ($${startCap} Start, 1:${rr} RR, ${trades.length} Trades)`,
    startingBalance: startCap,
    targetBalance: trades[trades.length - 1].endBalanceUSD,
    totalTrades: trades.length,
    type: "custom_compound",
    badge: "Custom",
    color: "indigo",
    trades,
    isCustom: true
  };
}
