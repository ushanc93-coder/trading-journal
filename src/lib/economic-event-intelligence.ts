export interface EventIntelligence {
  key: string;
  category: "Inflation" | "Employment" | "Central Bank / Rates" | "Growth / GDP" | "Consumer / Spending" | "Business / PMI" | "Energy / Oil";
  volatility: "Extreme (80-150 pips)" | "High (50-90 pips)" | "Moderate (30-50 pips)" | "Low-Medium (15-30 pips)";
  affectedPairs: string[];
  en: {
    summary: string;
    whyItMatters: string;
    bullishScenario: string;
    bearishScenario: string;
    ictTradingTip: string;
  };
  si: {
    summary: string;
    whyItMatters: string;
    bullishScenario: string;
    bearishScenario: string;
    ictTradingTip: string;
  };
}

export interface HistoricalCaseStudy {
  id: string;
  eventTitle: string;
  currency: string;
  date: string;
  forecast: string;
  actual: string;
  previous: string;
  pipMove: string;
  affectedInstrument: string;
  outcomeType: "Bullish Spike" | "Bearish Liquidity Dump" | "Judas Swing Reversal" | "Whipsaw Range Expansion";
  en: {
    title: string;
    description: string;
    ictLesson: string;
  };
  si: {
    title: string;
    description: string;
    ictLesson: string;
  };
}

export const HISTORICAL_CASE_STUDIES: HistoricalCaseStudy[] = [
  {
    id: "hist-1",
    eventTitle: "US Consumer Price Index (CPI)",
    currency: "USD",
    date: "14 Aug 2024",
    forecast: "3.0%",
    actual: "2.9%",
    previous: "3.0%",
    pipMove: "+115 Pips (Gold Rally)",
    affectedInstrument: "XAU/USD & EUR/USD",
    outcomeType: "Bullish Spike",
    en: {
      title: "US CPI Cools Down: Explosive Gold & EUR/USD Rally",
      description: "Annual inflation cooled below 3.0% for the first time in 3 years. The US Dollar Index (DXY) plunged -65 pips within 8 minutes. Gold exploded upwards by +115 pips from $2,450 to $2,468.",
      ictLesson: "Notice how the release acted as an algorithm injection to tap into Buy-side Liquidity (BSL) resting above the London high. Tracing the 1-minute displacement created a pristine Bullish FVG that offered a 3.5 R:R entry."
    },
    si: {
      title: "ඇමරිකානු CPI උද්ධමනය අඩුවීම: Gold සහ EUR/USD ඉහළට පුපුරා යාම",
      description: "වසර 3කට පසු පළමු වරට ඇමරිකානු උද්ධමනය 3% ට වඩා අඩු විය. ඩොලර් දර්ශකය (DXY) මිනිත්තු 8ක් තුළ pips 65කින් පහත වැටුණු අතර, රන් මිල (Gold) $2,450 සිට $2,468 දක්වා pips 115කින් ක්ෂණිකව ඉහළ ගියේය.",
      ictLesson: "පුවත නිකුත් වූ සැණින් වෙළඳපල ඇල්ගොරිතමය මඟින් London High හි තිබූ Buy-side Liquidity උදුරා ගත් අයුරු බලන්න. පළමු මිනිත්තු 1-5 තුළ සෑදුණු Bullish Fair Value Gap (FVG) හරහා අවදානම අඩු විශිෂ්ට 3.5 R:R entry එකක් ලබාගත හැකි විය."
    }
  },
  {
    id: "hist-2",
    eventTitle: "US Non-Farm Payrolls (NFP)",
    currency: "USD",
    date: "06 Sep 2024",
    forecast: "165K",
    actual: "142K",
    previous: "89K",
    pipMove: "-90 Pips Judas Swing then +140 Pips",
    affectedInstrument: "XAU/USD & GBP/USD",
    outcomeType: "Judas Swing Reversal",
    en: {
      title: "Classic NFP Judas Swing Liquidity Sweep",
      description: "Initial release was mixed: job growth missed expectations but unemployment rate ticked down to 4.2%. Market initially whipped downwards -90 pips sweeping Sell-Side Liquidity before violently reversing +140 pips higher.",
      ictLesson: "Never enter market orders in the first 3 minutes of NFP. The initial fast move is almost always an ICT 'Judas Swing' designed to engineer liquidity. Wait for Market Structure Shift (MSS) on the 5-minute chart."
    },
    si: {
      title: "සම්භාව්‍ය NFP Judas Swing Liquidity උගුල",
      description: "රැකියා උත්පාදනය අපේක්ෂිත 165K වෙනුවට 142K ලෙස වාර්තා විය. පුවත නිකුත් වූ වහාම වෙළඳපල පළමුව පහළට pips 90ක් කඩා වැටී Sell-side Liquidity දඩයම් කර, අනතුරුව ඉහළට pips 140කින් ආපසු හැරුණි.",
      ictLesson: "NFP නිකුත් වූ මුල් මිනිත්තු 3 තුළ කිසි විටෙකත් Trades වලට ඇතුළු නොවන්න. මුලින්ම සිදුවන වේගවත් කඩා වැටීම බොහෝවිට 'Judas Swing' නමැති ආයතනික උගුලකි. මිනිත්තු 5 Chart එකෙහි Market Structure Shift (MSS) තහවුරු වන තෙක් රැඳී සිටින්න."
    }
  },
  {
    id: "hist-3",
    eventTitle: "FOMC Federal Funds Rate Decision",
    currency: "USD",
    date: "18 Sep 2024",
    forecast: "5.00%",
    actual: "5.00% (-50 bps Cut)",
    previous: "5.50%",
    pipMove: "±180 Pips Volatility Whipsaw",
    affectedInstrument: "EUR/USD, Gold, US100",
    outcomeType: "Whipsaw Range Expansion",
    en: {
      title: "Historic 50 bps Fed Jumbo Rate Cut",
      description: "The Federal Reserve delivered an aggressive 50 basis point rate reduction. Gold spiked to all-time highs above $2,600, followed by a sharp consolidation as Jerome Powell emphasized future cuts are data-dependent.",
      ictLesson: "FOMC has two phases: Phase 1 at 2:00 PM EST (Statement & Dot Plot) and Phase 2 at 2:30 PM EST (Powell Press Conference). True institutional direction almost always establishes during Phase 2."
    },
    si: {
      title: "ඓතිහාසික 50 bps Fed පොලී අනුපාත කප්පාදුව",
      description: "ඇමරිකානු මහ බැංකුව (Fed) පොලී අනුපාත 0.50% (50 bps) කින් විශාල ලෙස කපා හැරියේය. Gold මිල $2,600 නව වාර්තාවක් තැබූ අතර EUR/USD දැවැන්ත උච්චාවචනයක් පෙන්නුම් කළේය.",
      ictLesson: "FOMC සිදුවීම අදියර දෙකකින් සමන්විතයි: පළමුව ප.ව. 2:00 ට නිවේදනය, සහ දෙවනුව ප.ව. 2:30 ට Jerome Powell ගේ ප්‍රවෘත්ති සාකච්ඡාව. සැබෑ දිශානතිය තීරණය වන්නේ දෙවන අදියරේදී බැවින් ඒ වන තෙක් ඉවසීම අත්‍යවශ්‍ය වේ."
    }
  },
  {
    id: "hist-4",
    eventTitle: "Bank of England (BOE) Rate Decision & Bailey Speaks",
    currency: "GBP",
    date: "01 Aug 2024",
    forecast: "5.00%",
    actual: "5.00% (-25 bps Cut)",
    previous: "5.25%",
    pipMove: "-85 Pips (GBP/USD Sell-Off)",
    affectedInstrument: "GBP/USD & EUR/GBP",
    outcomeType: "Bearish Liquidity Dump",
    en: {
      title: "Bank of England Cuts Rates in Tight 5-4 Split Vote",
      description: "BOE cut interest rates to 5.00% with an extremely narrow 5 to 4 committee vote. GBP/USD immediately lost momentum and cascaded -85 pips into the London afternoon session.",
      ictLesson: "Central bank split votes (like 5-4) indicate deep division, which algorithms interpret as hawkish or dovish hesitation. Watch for Order Block retests after the initial momentum candle closes."
    },
    si: {
      title: "එංගලන්ත මහ බැංකුව 5-4 ඡන්දයකින් පොලී අනුපාත කපා හැරීම",
      description: "BOE විසින් පොලී අනුපාත 5.00% දක්වා අඩු කරන ලදී. තීරණය 5ට 4ක් ලෙස ඉතා තියුණු ඡන්ද විමසීමක් වූ බැවින් GBP/USD ක්ෂණිකව pips 85කින් පහත වැටුණි.",
      ictLesson: "මහ බැංකු ඡන්ද විමසීම් සමීප වන විට වෙළඳපල අස්ථාවර වේ. මෙවැනි අවස්ථාවල පළමු දිගු කැන්ඩලය අවසන් වූ පසු ඊට අදාළ Order Block එක නැවත පරික්ෂා කරන (Retest) තෙක් බලා සිටීම ආරක්ෂිතම ක්‍රමයයි."
    }
  }
];

export const EVENT_INTELLIGENCE_DATABASE: Record<string, EventIntelligence> = {
  cpi: {
    key: "cpi",
    category: "Inflation",
    volatility: "Extreme (80-150 pips)",
    affectedPairs: ["XAU/USD (Gold)", "EUR/USD", "GBP/USD", "USD/JPY", "DXY", "US100 / Nasdaq"],
    en: {
      summary: "Consumer Price Index (CPI) measures the average change in prices paid by consumers for goods and services. It is the primary benchmark for measuring inflation.",
      whyItMatters: "Central banks (especially the US Federal Reserve) use CPI to determine whether to hike, hold, or cut interest rates. High inflation forces central banks to keep rates high, strengthening the currency.",
      bullishScenario: "Actual CPI > Forecast: Indicates stubborn inflation. The Federal Reserve will maintain higher interest rates for longer. Result: DXY (US Dollar) rallies sharply, while Gold (XAUUSD) and Stocks (US100) drop.",
      bearishScenario: "Actual CPI < Forecast: Indicates inflation is cooling faster than expected. The Fed can comfortably cut rates. Result: DXY plunges, while Gold and EUR/USD experience explosive bullish rallies.",
      ictTradingTip: "DO NOT enter at the exact release second. Spreads widen up to 10-20x. Wait for the initial 5-minute displacement candle to close. Look for an institutional Market Structure Shift (MSS) and enter on the retracement to a Fair Value Gap (FVG) or Order Block (OB)."
    },
    si: {
      summary: "පාරිභෝගික මිල දර්ශකය (CPI) මඟින් පාරිභෝගික භාණ්ඩ හා සේවා මිල ඉහළ යාමේ වේගය මනිනු ලබයි. මෙය රටක උද්ධමනය (Inflation) මනින ප්‍රධානතම දර්ශකයයි.",
      whyItMatters: "ඇමරිකානු මහ බැංකුව (Fed) පොලී අනුපාත තීරණය කිරීමට මෙය ප්‍රධාන වශයෙන් යොදා ගනී. උද්ධමනය වැඩි නම් පොලී අනුපාත වැඩිව තබා ගැනීමට සිදුවන අතර, එමඟින් ඩොලරය ශක්තිමත් වේ.",
      bullishScenario: "Actual > Forecast (අපේක්ෂිත අගයට වඩා වැඩි නම්): උද්ධමනය වැඩි බව පෙන්වයි. පොලී අනුපාත ඉහළ මට්ටමක පවතිනු ඇත. ප්‍රතිඵලය: ඩොලර් දර්ශකය (DXY) ඉහළ නගින අතර, Gold සහ EUR/USD තියුණු ලෙස පහත වැටේ.",
      bearishScenario: "Actual < Forecast (අපේක්ෂිත අගයට වඩා අඩු නම්): උද්ධමනය පාලනය වී ඇති බව පෙන්වයි. ප්‍රතිඵලය: ඩොලරය දුර්වල වන අතර, Gold සහ EUR/USD ඉහළට පුපුරා යයි (Bullish Rally).",
      ictTradingTip: "පුවත නිකුත් වන පළමු තත්පරයේ Trades වලට ඇතුළු නොවන්න (Spreads විශාල වේ). මිනිත්තු 5 ක Displacement candle එක අවසන් වන තෙක් සිටින්න. ඉන්පසු සෑදෙන Fair Value Gap (FVG) හෝ Order Block වෙත මිල ආපසු එන විට (Retracement) වෙළඳාමට පිවිසෙන්න."
    }
  },
  nfp: {
    key: "nfp",
    category: "Employment",
    volatility: "Extreme (80-150 pips)",
    affectedPairs: ["XAU/USD (Gold)", "EUR/USD", "GBP/USD", "USD/JPY", "DXY", "US30"],
    en: {
      summary: "Non-Farm Payrolls (NFP) measures the total number of paid workers in the US, excluding farm employees, government officials, and non-profit employees.",
      whyItMatters: "A healthy labor market gives the Federal Reserve confidence to keep borrowing costs high. Weak job data signals recession risk and triggers rate cut expectations.",
      bullishScenario: "Actual NFP > Forecast & Low Unemployment: Strong labor market. Supports the US Dollar. XAU/USD and major foreign currencies face selling pressure.",
      bearishScenario: "Actual NFP < Forecast & High Unemployment: Economic slowdown. DXY drops, triggering strong rallies in Gold, EUR/USD, and GBP/USD.",
      ictTradingTip: "NFP almost always features a 'Judas Swing' — an aggressive false spike that wipes out retail stop orders above/below session highs/lows before running in the true institutional direction."
    },
    si: {
      summary: "කෘෂිකාර්මික නොවන රැකියා දර්ශකය (NFP) මඟින් ඇමරිකාව තුළ අලුතින් එක්වූ රැකියා ප්‍රමාණය ගණනය කෙරේ. මෙය ලොව වැඩිම Volatility එකක් ඇති කරන දත්තයකි.",
      whyItMatters: "ශක්තිමත් රැකියා වෙළඳපලක් මඟින් ආර්ථිකය ශක්තිමත් බවත්, දුර්වල රැකියා දත්ත මඟින් ආර්ථික පසුබෑමක් එන බවත් පෙන්නුම් කරයි.",
      bullishScenario: "Actual > Forecast: රැකියා වෙළඳපල ශක්තිමත්. ඩොලරය (USD) වේගයෙන් ශක්තිමත් වන අතර Gold සහ අනෙකුත් මුදල් ඒකක පහත බසී.",
      bearishScenario: "Actual < Forecast: රැකියා උත්පාදනය දුර්වලයි. ඩොලරය (DXY) කඩා වැටෙන අතර Gold සහ EUR/USD ඉහළ යයි.",
      ictTradingTip: "NFP වලදී බොහෝවිට 'Judas Swing' නමැති රැවටිලි සහගත ආරම්භක චලනයක් සිදුවේ. එබැවින් දෙපැත්තේම Liquidity Sweep වන තුරු රැඳී සිට මිනිත්තු 5-15 Trend එක තහවුරු වූ පසු වෙළඳාම් කරන්න."
    }
  },
  fomc: {
    key: "fomc",
    category: "Central Bank / Rates",
    volatility: "Extreme (80-150 pips)",
    affectedPairs: ["All USD Pairs", "XAU/USD", "US100", "US30", "Global Indices", "Crypto"],
    en: {
      summary: "Federal Open Market Committee (FOMC) decides the US monetary policy and target interest rates. Consists of statement, economic projections, and press conference.",
      whyItMatters: "The single most impactful event in global finance. Dictates the global cost of borrowing and capital flows worldwide.",
      bullishScenario: "Hawkish Hold or Rate Hike: Signals the Fed will keep rates high to squash inflation. Bullish for USD, Bearish for Gold and Equities.",
      bearishScenario: "Dovish Guidance or Rate Cut: Cheaper money flows into risk assets. Extremely Bullish for Gold, Bitcoin, and Stock Indices.",
      ictTradingTip: "Split your attention: 2:00 PM EST is algorithmic headline reaction (high slippage). 2:30 PM EST Press Conference is where human institutional traders establish the multi-week trend."
    },
    si: {
      summary: "ෆෙඩරල් බැංකු ප්‍රතිපත්ති කමිටුව (FOMC) විසින් ඇමරිකානු පොලී අනුපාත සහ ඉදිරි මූල්‍ය ප්‍රතිපත්තිය තීරණය කරනු ලබයි.",
      whyItMatters: "මුළු ලෝකයේම මුදල් සංසරණය සහ ණය පොලිය තීරණය කරන අංක 1 මූල්‍ය සාධකයයි. ලෝකයේ සියලුම මුදල් වෙළඳපලවල් මීට ප්‍රතිචාර දක්වයි.",
      bullishScenario: "Hawkish (පොලී වැඩි කිරීම හෝ වැඩිව තැබීම): ඩොලරය (USD) අතිශය ශක්තිමත් වේ. Gold සහ Stocks පහත වැටේ.",
      bearishScenario: "Dovish (පොලී කපා හැරීම): ඩොලරය දුර්වල වන අතර Gold, Crypto සහ කොටස් වෙළඳපලවල් සීඝ්‍රයෙන් ඉහළ නගී.",
      ictTradingTip: "ප.ව. 2:00 ට නිකුත් වන නිවේදනයේදී පරිගණක ඇල්ගොරිතම ක්‍රියාත්මක වේ. සැබෑ Trend එක ස්ථාපිත වන්නේ ප.ව. 2:30 ට පවත්වන මාධ්‍ය හමුවේදී බැවින් එහිදී FVG හඳුනාගෙන වෙළඳාම් කරන්න."
    }
  },
  rates: {
    key: "rates",
    category: "Central Bank / Rates",
    volatility: "High (50-90 pips)",
    affectedPairs: ["Direct Currency Pair (EUR, GBP, JPY, AUD, CAD)"],
    en: {
      summary: "Central Bank Interest Rate Decision determines the benchmark overnight lending rate of a sovereign nation.",
      whyItMatters: "Higher interest rates attract foreign capital seeking higher yields, naturally increasing demand for that currency.",
      bullishScenario: "Rate Hike or Hawkish Hold: Currency appreciates significantly against its peers.",
      bearishScenario: "Rate Cut or Dovish Statement: Currency depreciates as yields diminish.",
      ictTradingTip: "Focus on the voting breakdown (e.g. 7-2 or 5-4). Dissenting votes often indicate an upcoming pivot before the official policy shift."
    },
    si: {
      summary: "මහ බැංකු පොලී අනුපාත තීරණය මඟින් අදාළ රටේ මූලික ණය පොලී අනුපාතිකය නියම කරනු ලබයි.",
      whyItMatters: "පොලී අනුපාත වැඩි කරන විට විදේශ ආයෝජකයින් එම මුදල් ඒකකය කරා ආකර්ෂණය වන බැවින් එම මුදල ශක්තිමත් වේ.",
      bullishScenario: "පොලී වැඩි කිරීම: අදාළ මුදල් ඒකකය අනෙකුත් මුදල් වලට සාපේක්ෂව ක්ෂණිකව ශක්තිමත් වේ.",
      bearishScenario: "පොලී අඩු කිරීම: ආයෝජන ලාභය අඩුවන බැවින් මුදල් ඒකකය දුර්වල වේ.",
      ictTradingTip: "ඡන්ද බෙදී ගිය ආකාරය (Voting Split) කෙරෙහි අවධානය යොමු කරන්න. මතභේදාත්මක ඡන්ද විමසීම් මඟින් ඉදිරි ප්‍රතිපත්ති වෙනස කලින් හඳුනාගත හැක."
    }
  },
  gdp: {
    key: "gdp",
    category: "Growth / GDP",
    volatility: "High (50-90 pips)",
    affectedPairs: ["Domestic Currency Pairs", "Equities"],
    en: {
      summary: "Gross Domestic Product (GDP) annualized growth rate measures the total value of all goods and services produced.",
      whyItMatters: "Primary scorecard of economic health. Two consecutive quarters of negative GDP officially marks a recession.",
      bullishScenario: "Actual GDP > Forecast: Economy is expanding healthily, reducing recession fears and supporting currency.",
      bearishScenario: "Actual GDP < Forecast: Signals economic contraction, pushing central banks towards monetary easing.",
      ictTradingTip: "Look for session high/low liquidity sweeps that occur right before the GDP print."
    },
    si: {
      summary: "දළ දේශීය නිෂ්පාදිතය (GDP) මඟින් රටක ආර්ථිකයේ වාර්ෂික සමස්ත වර්ධන වේගය මනිනු ලබයි.",
      whyItMatters: "රටක ආර්ථික ශක්තිය මනින ප්‍රධානම මිණුම්දණ්ඩයි. අඛණ්ඩව කාර්තු දෙකක් සෘණ වර්ධනයක් ලැබුවහොත් එය ආර්ථික පසුබෑමක් (Recession) ලෙස සැලකේ.",
      bullishScenario: "Actual > Forecast: ආර්ථිකය ශක්තිමත්ව වර්ධනය වන බව පෙන්වයි. මුදල් ඒකකය ශක්තිමත් වේ.",
      bearishScenario: "Actual < Forecast: ආර්ථිකය දුර්වල වන බව පෙන්වයි. මුදල් ඒකකය දුර්වල වේ.",
      ictTradingTip: "පුවතට මොහොතකට පෙර සිදුවන Session High / Low Liquidity Sweeps කෙරෙහි අවධානය යොමු කරන්න."
    }
  },
  retail: {
    key: "retail",
    category: "Consumer / Spending",
    volatility: "Moderate (30-50 pips)",
    affectedPairs: ["USD Pairs", "XAU/USD"],
    en: {
      summary: "Retail Sales measures consumer spending at retail outlets. Consumer spending accounts for approximately 68-70% of the US economy.",
      whyItMatters: "Direct indicator of consumer confidence and disposable income. Strong consumer spending fuels economic activity and inflation.",
      bullishScenario: "Actual > Forecast: Consumer spending is robust. Bullish for Dollar, Bearish for Gold.",
      bearishScenario: "Actual < Forecast: Consumer pullback. Bearish for Dollar, Bullish for Gold.",
      ictTradingTip: "Retail sales often trends smoothly during the 8:30 AM EST New York AM session killzone."
    },
    si: {
      summary: "සිල්ලර වෙළඳාම (Retail Sales) මඟින් පාරිභෝගිකයින් වෙළඳසැල් හරහා මුදල් වියදම් කරන ප්‍රමාණය මනිනු ලබයි. ඇමරිකානු ආර්ථිකයෙන් 70%ක් පමණ පාරිභෝගික වියදම් මත රඳා පවතී.",
      whyItMatters: "පාරිභෝගිකයින්ගේ ආර්ථික හැකියාව පෙන්වන සෘජු දර්ශකයකි. වියදම් වැඩිවීම ආර්ථිකය ශක්තිමත් කරයි.",
      bullishScenario: "Actual > Forecast: පාරිභෝගික වියදම් ඉහළයි. ඩොලරය ශක්තිමත් වේ.",
      bearishScenario: "Actual < Forecast: පාරිභෝගික වියදම් පහළයි. ඩොලරය දුර්වල වේ.",
      ictTradingTip: "New York Open Killzone (ප.ව. 6:00 ශ්‍රී ලංකා වේලාවෙන්) තුළ සුමට Trend එකක් සෑදීමට මෙය ඉවහල් වේ."
    }
  },
  pmi: {
    key: "pmi",
    category: "Business / PMI",
    volatility: "Moderate (30-50 pips)",
    affectedPairs: ["USD, EUR, GBP Pairs", "Indices"],
    en: {
      summary: "Purchasing Managers' Index (PMI) is a survey-based indicator of manufacturing and services sector business conditions. Above 50 represents expansion, below 50 represents contraction.",
      whyItMatters: "Forward-looking indicator: Purchasing managers have earliest insight into orders, inventory, and supply chain health.",
      bullishScenario: "Actual > 50 & > Forecast: Strong business expansion, supportive of currency.",
      bearishScenario: "Actual < 50: Business contraction and slowdown, pressure on currency.",
      ictTradingTip: "Pay close attention to the 'Prices Paid' sub-component as it provides a preview of next month's inflation."
    },
    si: {
      summary: "මිලදී ගැනීමේ කළමනාකරුවන්ගේ දර්ශකය (PMI) මඟින් නිෂ්පාදන හා සේවා ආයතනවල ව්‍යාපාරික වර්ධනය මනිනු ලබයි. අගය 50ට වැඩි නම් වර්ධනයක්ද, 50ට අඩු නම් ආර්ථික හැකිලීමක්ද වේ.",
      whyItMatters: "අනාගත ආර්ථික තත්ත්වය කලින් හඳුනාගත හැකි දර්ශකයකි (Leading Indicator).",
      bullishScenario: "Actual > 50: ව්‍යාපාරික ක්ෂේත්‍රය වර්ධනය වේ. මුදල් ඒකකය ශක්තිමත් වේ.",
      bearishScenario: "Actual < 50: ව්‍යාපාරික ක්ෂේත්‍රය හැකිලෙමින් පවතී. මුදල් ඒකකය දුර්වල වේ.",
      ictTradingTip: "මෙහි ඇති 'Prices Paid' කොටස කෙරෙහි අවධානය යොමු කරන්න. එමඟින් ලබන මාසයේ උද්ධමනය කලින් දැනගත හැක."
    }
  },
  jobless: {
    key: "jobless",
    category: "Employment",
    volatility: "Moderate (30-50 pips)",
    affectedPairs: ["USD Pairs", "XAU/USD"],
    en: {
      summary: "Initial Jobless Claims tracks individuals filing for unemployment insurance for the first time on a weekly basis.",
      whyItMatters: "Most frequent (weekly) read on labor market conditions.",
      bullishScenario: "Actual < Forecast (Fewer jobless claims): Labor market remains tight, supporting USD.",
      bearishScenario: "Actual > Forecast (Rising claims): Unemployment is climbing, weighing on USD.",
      ictTradingTip: "Released every Thursday at 8:30 AM EST. Often aligns directly with NY AM Silver Bullet setups."
    },
    si: {
      summary: "සතිපතා විරැකියා ඉල්ලුම්පත් (Jobless Claims) මඟින් අලුතින් රැකියා අහිමි වූ පුද්ගලයින් සංඛ්‍යාව සතිපතා වාර්තා කරයි.",
      whyItMatters: "රැකියා වෙළඳපල පිළිබඳ සතිපතා ලැබෙන එකම සජීවී දත්තයයි.",
      bullishScenario: "Actual < Forecast (ඉල්ලුම්පත් අඩු වීම): රැකියා සුරක්ෂිතතාවය වැඩි බව පෙන්වයි. ඩොලරය ශක්තිමත් වේ.",
      bearishScenario: "Actual > Forecast (ඉල්ලුම්පත් වැඩි වීම): රැකියා අහිමිවීම් වැඩි වේ. ඩොලරය දුර්වල වේ.",
      ictTradingTip: "සෑම බ්‍රහස්පතින්දාවකම නිකුත් වන අතර, New York AM Silver Bullet සැකසුම් (Setups) සමඟ මනාව ගැලපේ."
    }
  }
};

export function matchEventIntelligence(title: string): EventIntelligence {
  const t = title.toLowerCase();

  if (t.includes("cpi") || t.includes("consumer price") || t.includes("inflation")) {
    return EVENT_INTELLIGENCE_DATABASE.cpi;
  }
  if (t.includes("non-farm") || t.includes("nfp") || t.includes("employment change") || t.includes("unemployment rate")) {
    return EVENT_INTELLIGENCE_DATABASE.nfp;
  }
  if (t.includes("fomc") || t.includes("powell") || t.includes("fed chair") || t.includes("federal funds")) {
    return EVENT_INTELLIGENCE_DATABASE.fomc;
  }
  if (t.includes("rate") || t.includes("speaks") || t.includes("monetary policy") || t.includes("central bank") || t.includes("boe") || t.includes("ecb") || t.includes("boj") || t.includes("rba")) {
    return EVENT_INTELLIGENCE_DATABASE.rates;
  }
  if (t.includes("gdp") || t.includes("gross domestic")) {
    return EVENT_INTELLIGENCE_DATABASE.gdp;
  }
  if (t.includes("retail sales")) {
    return EVENT_INTELLIGENCE_DATABASE.retail;
  }
  if (t.includes("pmi") || t.includes("ism") || t.includes("purchasing managers")) {
    return EVENT_INTELLIGENCE_DATABASE.pmi;
  }
  if (t.includes("jobless") || t.includes("claims")) {
    return EVENT_INTELLIGENCE_DATABASE.jobless;
  }

  // Default dynamic intelligence for other indicators
  return {
    key: "general",
    category: "Central Bank / Rates",
    volatility: "Moderate (30-50 pips)",
    affectedPairs: ["Major Currency Pairs", "Gold (XAU/USD)"],
    en: {
      summary: `High-impact macroeconomic event: "${title}". This release provides vital economic signals that institutional algorithms monitor for liquidity injection.`,
      whyItMatters: "Macro releases alter market expectations regarding interest rate trajectory, economic growth, and capital inflows.",
      bullishScenario: "Actual > Forecast: Strong economic reading tends to strengthen the domestic currency against foreign counterparts.",
      bearishScenario: "Actual < Forecast: Disappointing economic data pressures the domestic currency and supports safe-haven assets.",
      ictTradingTip: "Wait for initial volatility to settle. Look for liquidity sweeps into key Fair Value Gaps (FVG) and Market Structure Shifts (MSS) on lower timeframes (1m-5m)."
    },
    si: {
      summary: `ප්‍රබල සාර්ව ආර්ථික සිදුවීමක්: "${title}". ආයතනික ඇල්ගොරිතම (Institutional Algorithms) වෙළඳපලට මුදල් එන්නත් කිරීමට මෙම දත්ත නිරීක්ෂණය කරයි.`,
      whyItMatters: "ආර්ථික වර්ධනය, පොලී අනුපාත අපේක්ෂාවන් සහ විදේශ ප්‍රාග්ධන ගලා ඒම් කෙරෙහි සෘජුවම බලපෑම් ඇති කරයි.",
      bullishScenario: "Actual > Forecast: අපේක්ෂිත මට්ටමට වඩා හොඳ දත්ත ලැබීමෙන් අදාළ රටේ මුදල් ඒකකය ශක්තිමත් වේ.",
      bearishScenario: "Actual < Forecast: බලාපොරොත්තු වූවාට වඩා දුර්වල දත්ත ලැබීමෙන් මුදල් ඒකකය දුර්වල වී Gold වැනි Safe-haven වත්කම් ඉහළ යයි.",
      ictTradingTip: "පළමු තත්පරයේ තදබදය පහව යන තෙක් ඉවසන්න. මිනිත්තු 1-5 Chart එකෙහි Fair Value Gap (FVG) සහ Market Structure Shift (MSS) හඳුනාගෙන පිළිවෙළට වෙළඳාම් කරන්න."
    }
  };
}
