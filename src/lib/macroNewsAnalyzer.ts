// Macro News & Gold Market Intelligence Analyzer
// Analyzes live news headlines and summaries to determine impact on Gold (XAU/USD), DXY, and trading bias

export interface ArticleAnalysis {
  goldImpact: "Bullish" | "Bearish" | "Neutral / Range";
  impactLevel: "High" | "Medium" | "Low";
  sentimentScore: number; // -100 to +100
  keyTheme: string;
  keyThemeSi: string;
  quickTake: string;
  quickTakeSi: string;
  macroReasoning: string;
  macroReasoningSi: string;
  actionablePlan: string;
  actionablePlanSi: string;
  keyLevelsToWatch?: string;
}

export interface GoldMarketPulse {
  condition: string;
  conditionSi: string;
  bias: "Bullish" | "Bearish" | "Consolidation / Range" | "High Volatility Warning";
  biasColor: "emerald" | "rose" | "amber" | "indigo";
  score: number; // -100 (Extremely Bearish) to +100 (Extremely Bullish)
  primaryCatalysts: {
    title: string;
    titleSi: string;
    desc: string;
    descSi: string;
    impact: "positive" | "negative" | "neutral";
  }[];
  tacticalPlan: string;
  tacticalPlanSi: string;
  goldRange: {
    support: string;
    resistance: string;
    pivot: string;
  };
}

/**
 * Analyzes an individual news article and derives Gold (XAU/USD) impact,
 * institutional mechanism, and actionable guidance in both English and Sinhala.
 */
export function analyzeNewsArticle(title: string, summary: string, source: string): ArticleAnalysis {
  const combined = `${title} ${summary}`.toLowerCase();

  // Pattern detection
  const isStrongDollar = /strong(er)? dollar|dollar firms|dollar gain|dxy rise|usd rally|firm greenback/i.test(combined);
  const isWeakDollar = /weak(er)? dollar|dollar slip|dollar drop|dxy fall|usd slump|slumping dollar/i.test(combined);
  const isRateHikeHawkish = /hawkish|rate hike|sticky inflation|higher for longer|fed holds high|yields jump|yields surge/i.test(combined);
  const isRateCutDovish = /rate cut|dovish|easing|fed cut|yields tumble|yields drop|lower yields/i.test(combined);
  const isGeopoliticalSafeHaven = /safe-haven|war|middle east|iran|israel|ukraine|conflict|geopolitical tension|attacks|crisis/i.test(combined);
  const isCpiFocus = /cpi|inflation data|inflation print|us cpi|core pce/i.test(combined);
  const isGoldRose = /gold rose|spot gold up|gold hits|gold high|heads for (weekly|daily) gain|gold rallies/i.test(combined);
  const isGoldEased = /gold eases|gold struggles|gold falls|gold slips|gold drops|retreats from high/i.test(combined);
  const isOilRebound = /oil rebound|crude surge|brent rise/i.test(combined);

  // 1. Strong Dollar / Higher Yields -> Bearish for Gold
  if ((isStrongDollar || isGoldEased) && !isGeopoliticalSafeHaven) {
    return {
      goldImpact: "Bearish",
      impactLevel: isCpiFocus ? "High" : "Medium",
      sentimentScore: -65,
      keyTheme: "USD Strength & Yield Pressure",
      keyThemeSi: "ඩොලරයේ ප්‍රබලතාවය සහ Yields ඉහළ යාම",
      quickTake: "US Dollar firmed, placing downward pressure on Gold bullion as traders trim positions ahead of economic data.",
      quickTakeSi: "ඇමෙරිකානු ඩොලරය (USD) ශක්තිමත් වීම නිසා ආයෝජකයින් රන් මිල විකිණීමට පෙළඹී ඇති අතර මිල පහත වැටීමේ පීඩනයක් ඇත.",
      macroReasoning: "A stronger US Dollar increases the cost of Gold for holders of foreign currencies. Additionally, when Treasury yields firm, non-yielding Gold loses relative yield appeal.",
      macroReasoningSi: "ඩොලරය ශක්තිමත් වන විට වෙනත් මුදල් ඒකක භාවිතා කරන රටවලට රන් මිලදී ගැනීම මිල අධික වේ. එසේම පොලී නොලැබෙන රත්‍රන් වලට වඩා ඩොලරය කෙරෙහි ආයෝජක කැමැත්ත වැඩි වේ.",
      actionablePlan: "Avoid aggressive Longs at major resistance ($4,200). Look for short-term short scalps or wait for clear liquidity sweeps near lower support ($4,170 - $4,180) with MSS before buying.",
      actionablePlanSi: "ප්‍රධාන Resistance ($4,200) අසලදී ඉක්මන් වී Buy නොකරන්න. මිල Support මට්ටමකට ($4,170 - $4,180) පැමිණ Liquidity sweep + MSS තහවුරු වන තෙක් රැඳී සිටින්න.",
      keyLevelsToWatch: "Resistance: $4,200 | Support: $4,170 - $4,175",
    };
  }

  // 2. Safe Haven / War / Geopolitical -> Bullish for Gold
  if (isGeopoliticalSafeHaven || isWeakDollar || (isGoldRose && !isStrongDollar)) {
    return {
      goldImpact: "Bullish",
      impactLevel: "High",
      sentimentScore: 75,
      keyTheme: "Safe-Haven Inflows & Dollar Softness",
      keyThemeSi: "ආරක්ෂිත වත්කම් (Safe-Haven) ඉල්ලුම සහ ඩොලරය දුර්වල වීම",
      quickTake: "Elevated geopolitical tensions or a softening USD drive institutional capital into Gold as a premier wealth-preservation hedge.",
      quickTakeSi: "භූ-දේශපාලනික අර්බුද හෝ ඩොලරය දුර්වල වීම හේතුවෙන් ලොව පුරා ප්‍රධාන ආයෝජකයින් රන් (Gold) මිලදී ගැනීමට එක්වෙයි.",
      macroReasoning: "During macro uncertainty or monetary easing expectations, sovereign funds and hedge funds park liquidity in physical bullion, driving sustained upward momentum.",
      macroReasoningSi: "අස්ථාවර වෙළඳපල පරිසරයකදී මධ්‍යම බැංකු සහ Hedge Funds විසින් අවදානම අවම කරගැනීමට Gold මිලදී ගන්නා බැවින් මිල වේගයෙන් ඉහළ යයි.",
      actionablePlan: "Look for Buy setups on pullbacks into bullish Fair Value Gaps (FVG) and Order Blocks on M5/M15 timeframe. Target higher liquidity pools.",
      actionablePlanSi: "M5 / M15 Timeframe වල Bullish FVG හෝ Order Blocks වෙත මිල retracement එකක් එන විට Buy setups සොයන්න. ඉක්මන් Short trades වලින් වළකින්න.",
      keyLevelsToWatch: "Support: $4,185 | Upside Target: $4,210 - $4,225",
    };
  }

  // 3. CPI / Inflation anticipation -> Consolidation / High Volatility warning
  if (isCpiFocus) {
    return {
      goldImpact: "Neutral / Range",
      impactLevel: "High",
      sentimentScore: 0,
      keyTheme: "Inflation (CPI) Waiting Stance",
      keyThemeSi: "උද්ධමන (CPI) දත්ත නිකුත් වන තෙක් රැඳී සිටීම",
      quickTake: "Markets are in a pre-CPI holding pattern. Institutional traders avoid heavy directional bets until official inflation prints cross the wire.",
      quickTakeSi: "ඉදිරි US CPI දත්ත නිකුත් වන තුරු ලොව ප්‍රධාන ආයෝජකයින් විශාල තීරණ ගැනීමෙන් වැළකී සිටින බැවින් මිල Range එකක දෝලනය වේ.",
      macroReasoning: "A higher-than-expected CPI reinforces 'higher-for-longer' rates (bearish Gold), while a cooler CPI accelerates rate-cut bets (bullish Gold). Until released, price remains range-bound.",
      macroReasoningSi: "CPI දත්ත වැඩි වුවහොත් පොලී අනුපාත ඉහළ මට්ටමක පවතිනු ඇතැයි අනුමාන කර රන් මිල පහත බසී; දත්ත අඩු වුවහොත් රන් මිල වේගයෙන් ඉහළ යයි.",
      actionablePlan: "Reduce lot sizes. Scalp strictly within the defined range ($4,175 - $4,200). Do NOT hold open swing positions right into the high-impact CPI release time.",
      actionablePlanSi: "Lot size අඩු කරන්න. Range එක තුළ පමණක් කෙටි Scalp trades ගන්න. CPI News එක නිකුත් වන වේලාවේ Trade විවෘතව තබාගැනීමෙන් වළකින්න.",
      keyLevelsToWatch: "Range High: $4,200 | Range Low: $4,175",
    };
  }

  // 4. Default / Mixed Corporate & Macro Earnings
  return {
    goldImpact: "Neutral / Range",
    impactLevel: "Low",
    sentimentScore: 10,
    keyTheme: "Macro Positioning & Range Trading",
    keyThemeSi: "සාර්ව ආර්ථික ස්ථානගතවීම් සහ සාමාන්‍ය ගනුදෙනු",
    quickTake: "Routine macroeconomic development with localized market ripples. Gold maintains its current structural framework.",
    quickTakeSi: "වෙළඳපලේ සාමාන්‍ය ප්‍රවෘත්තියක් වන අතර, රන් මිල දැනට පවතින Technical Trend එක ඔස්සේ සාමාන්‍ය පරිදි ගමන් කරයි.",
    macroReasoning: "Broad asset reallocation across banking and equity markets without an immediate structural shock to currency flows.",
    macroReasoningSi: "බැංකු සහ කොටස් වෙළඳපල අතර සිදුවන සාමාන්‍ය මුදල් හුවමාරුවක් බැවින් රන් මිලට ක්ෂණික දැවැන්ත කම්පනයක් ඇති නොවේ.",
    actionablePlan: "Trade strictly according to ICT Session liquidity (Asian High/Low sweep during London open). Maintain standard 0.5% risk limits.",
    actionablePlanSi: "ඔබගේ සාමාන්‍ය ICT Session Setup (Asian High/Low sweep) අනුව පමණක් Trade කරන්න. 0.5% Risk නීතිය අකුරටම පිළිපදින්න.",
    keyLevelsToWatch: "Key Zone: $4,185 - $4,200",
  };
}

/**
 * Synthesizes the full array of current news items to generate
 * an overall executive Gold Market Pulse & Tactical Briefing.
 */
export function analyzeGoldMarketPulse(newsItems: { title: string; summary: string; source: string }[]): GoldMarketPulse {
  if (!newsItems || newsItems.length === 0) {
    return {
      condition: "Consolidation / Pre-Data Inactive",
      conditionSi: "ස්ථාවර පරාසයක දෝලනය වීම (Consolidation)",
      bias: "Consolidation / Range",
      biasColor: "amber",
      score: 0,
      primaryCatalysts: [
        {
          title: "Waiting for Scheduled Macro Catalysts",
          titleSi: "සාර්ව ආර්ථික දත්ත නිකුත් වන තෙක් රැඳී සිටීම",
          desc: "Gold is trading in a consolidation structure while awaiting upcoming central bank and inflation releases.",
          descSi: "ඉදිරි ප්‍රධාන ආර්ථික දත්ත නිකුත් වන තුරු රන් මිල සාමාන්‍ය පරාසයක පවතී.",
          impact: "neutral",
        },
      ],
      tacticalPlan: "Wait for New York session liquidity sweeps. Keep max risk under 0.5%.",
      tacticalPlanSi: "New York session එකේදී liquidity sweep එකක් සිදුවන තෙක් රැඳී සිටින්න. Risk 0.5% මට්ටමේ තබා ගන්න.",
      goldRange: {
        support: "$4,175.00",
        resistance: "$4,200.00",
        pivot: "$4,187.50",
      },
    };
  }

  // Count sentiments across gold/macro items
  let totalScore = 0;
  let count = 0;
  let hasCpi = false;
  let hasStrongDollar = false;
  let hasSafeHaven = false;

  for (const item of newsItems.slice(0, 15)) {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    if (text.includes("gold") || text.includes("xau") || text.includes("dollar") || text.includes("fed") || text.includes("cpi")) {
      const a = analyzeNewsArticle(item.title, item.summary, item.source);
      totalScore += a.sentimentScore;
      count++;
      if (/cpi|inflation/i.test(text)) hasCpi = true;
      if (/strong.*dollar|dollar firms|yield/i.test(text)) hasStrongDollar = true;
      if (/safe-haven|war|middle east/i.test(text)) hasSafeHaven = true;
    }
  }

  const avgScore = count > 0 ? Math.round(totalScore / count) : 0;

  // Primary catalysts list
  const primaryCatalysts = [
    {
      title: "Stronger US Dollar Index (DXY Firming)",
      titleSi: "ඇමෙරිකානු ඩොලරය (USD) ශක්තිමත් වීම",
      desc: "US Dollar index and Treasury yields gained momentum, capping upside attempts and putting resistance at the $4,200 level.",
      descSi: "ඩොලරය සහ භාණ්ඩාගාර බැඳුම්කර (Yields) ශක්තිමත් වීම නිසා $4,200 සීමාවෙන් ඔබ්බට රන් මිල ඉහළ යාම සීමා වී ඇත.",
      impact: hasStrongDollar ? ("negative" as const) : ("neutral" as const),
    },
    {
      title: "US CPI Inflation Data in Focus",
      titleSi: "ඉදිරි US CPI උද්ධමන දත්ත පිළිබඳ අවධානය",
      desc: "Institutional desks are in a cautious wait-and-see holding pattern before key US inflation prints reprice Fed interest rate trajectory.",
      descSi: "ඉදිරියේදී නිකුත් වීමට නියමිත US CPI උද්ධමන දත්ත මඟින් පොලී අනුපාත තීරණය වන බැවින් විශාල ආයෝජකයින් පරිස්සම්කාරී ප්‍රතිපත්තියක සිටී.",
      impact: "neutral" as const,
    },
    {
      title: "Underlying Central Bank & Safe-Haven Accumulation",
      titleSi: "මධ්‍යම බැංකු විසින් දිගුකාලීනව Gold මිලදී ගැනීම",
      desc: "Sovereign reserves and ongoing global macroeconomic rebalancing continue to provide structural buying support on dips below $4,175.",
      descSi: "ලොව පුරා මධ්‍යම බැංකු විසින් දිගින් දිගටම රන් සංචිත තර කරගන්නා බැවින් $4,175 ට අඩු මිලකදී ශක්තිමත් මිලදී ගැනුම්කරුවන් (Buyers) හමුවේ.",
      impact: "positive" as const,
    },
  ];

  let condition = "Consolidation Below $4,200 (Dollar Pressure vs. Support Accumulation)";
  let conditionSi = "සීමිත පරාසයක දෝලනය වීම ($4,175 – $4,200)";
  let bias: GoldMarketPulse["bias"] = "Consolidation / Range";
  let biasColor: GoldMarketPulse["biasColor"] = "amber";
  let tacticalPlan = "Strictly scalp liquidity pool boundaries ($4,175 low to $4,200 high).";
  let tacticalPlanSi = "සීමිත පරාසය ($4,175 - $4,200) තුළ පමණක් Scalp කරන්න.";

  if (avgScore <= -25) {
    condition = "Bearish Retracement under Strong Dollar Pressure";
    conditionSi = "ඩොලරයේ ප්‍රබලතාවය හේතුවෙන් රන් මිල පහත වැටීමේ නැඹුරුවක් (Bearish Pressure)";
    bias = "Bearish";
    biasColor = "rose";
    tacticalPlan = "Do not FOMO buy into resistance ($4,200). Focus on London/NY session high sweeps followed by Bearish MSS to short into $4,175 liquidity.";
    tacticalPlanSi = "Resistance ($4,200) අසලදී Buy කිරීමෙන් වළකින්න. Session High එක sweep වී Bearish MSS එකක් ලැබුණු විට Short (Sell) අවස්ථා සොයන්න.";
  } else if (avgScore >= 25) {
    condition = "Bullish Safe-Haven & Dip-Buying Inflows";
    conditionSi = "ආරක්ෂිත වත්කම් ඉල්ලුම හේතුවෙන් රන් මිල ඉහළ යාමේ නැඹුරුවක් (Bullish Momentum)";
    bias = "Bullish";
    biasColor = "emerald";
    tacticalPlan = "Look for buys on retracements into Bullish M5/M15 FVGs. Maintain trailing stop and target $4,210 - $4,225.";
    tacticalPlanSi = "මිල M5/M15 Bullish FVG වෙත පැමිණෙන විට Buy අවස්ථා සොයන්න. $4,210 - $4,225 ඉලක්ක කර ගන්න.";
  } else {
    condition = "Range-Bound Consolidation ($4,175 – $4,200)";
    conditionSi = "සීමිත පරාසයක දෝලනය වීම ($4,175 – $4,200 Range-Bound)";
    bias = "Consolidation / Range";
    biasColor = "amber";
    tacticalPlan = "Strictly scalp liquidity pool boundaries ($4,175 low to $4,200 high). Exit trades at 2R target and never over-trade (> 2 trades/day rule).";
    tacticalPlanSi = "සීමිත පරාසය ($4,175 - $4,200) තුළ පමණක් Scalp කරන්න. 2R Target එකෙන් Trade එකෙන් ඉවත් වන්න. දිනකට Trade 2කට වඩා නොගන්නා නීතිය පිළිපදින්න.";
  }

  return {
    condition,
    conditionSi: conditionSi || "සීමිත පරාසයක දෝලනය වීම ($4,175 – $4,200)",
    bias,
    biasColor,
    score: avgScore,
    primaryCatalysts,
    tacticalPlan,
    tacticalPlanSi,
    goldRange: {
      support: "$4,170.00 – $4,175.00",
      resistance: "$4,200.00 – $4,205.00",
      pivot: "$4,188.00",
    },
  };
}
