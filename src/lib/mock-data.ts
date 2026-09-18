export type Trade = {
  id: string;
  symbol: string;
  direction: "Long" | "Short";
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  sl: number;
  tp: number;
  netPnL: number;
  rMultiple: number;
  category: "Forex" | "Index";
  session: "Asian" | "London" | "New York";
  timePeriod: "None" | "London silver bullet" | "NY silver bullet";
  date: string;
  rulesFollowed: boolean;
  emotion: "Calm" | "FOMO" | "Anxious" | "Revenge";
  mistake: "None" | "Moved SL" | "Over-leveraged" | "Early close";
  strategy: "Order Flow" | "Sharp Turn #1" | "Sharp Turn #2";
  notes: string;
  status: "Win" | "Loss" | "Break Even";
  images?: string[];
  patterns?: string[];
};

export const MOCK_TRADES: Trade[] = [
  // Sept 1: Good Win (Risk $50, Reward $100, 2R) -> All Rules Followed
  { id: "mock-t1", date: "2026-09-01", symbol: "EURUSD", category: "Forex", session: "London", direction: "Long", entryPrice: 1.100, exitPrice: 1.102, lotSize: 2.5, sl: 1.098, tp: 1.102, netPnL: 100, rMultiple: 2, timePeriod: "None", rulesFollowed: true, emotion: "Calm", mistake: "None", strategy: "Order Flow", notes: "Perfect execution according to plan.", status: "Win" },
  
  // Sept 2: Good Loss (Risk $50, Loss -$50, -1R) -> All Rules Followed
  { id: "mock-t2", date: "2026-09-02", symbol: "GBPUSD", category: "Forex", session: "New York", direction: "Short", entryPrice: 1.250, exitPrice: 1.252, lotSize: 2.5, sl: 1.252, tp: 1.246, netPnL: -50, rMultiple: -1, timePeriod: "NY silver bullet", rulesFollowed: true, emotion: "Calm", mistake: "None", strategy: "Sharp Turn #1", notes: "Setup was A+, just got stopped out normally.", status: "Loss" },
  
  // Sept 3: Bad Win (Broke Risk Rule! Risked $150, won $300, 2R. Also broke Profit Rule >$200) 
  { id: "mock-t3", date: "2026-09-03", symbol: "XAUUSD", category: "Forex", session: "London", direction: "Long", entryPrice: 1950, exitPrice: 1956, lotSize: 0.5, sl: 1947, tp: 1956, netPnL: 300, rMultiple: 2, timePeriod: "London silver bullet", rulesFollowed: true, emotion: "FOMO", mistake: "Over-leveraged", strategy: "Order Flow", notes: "Position sized way too big out of greed. Got lucky it hit TP.", status: "Win" },
  
  // Sept 4: Bad Win (Broke TP Rule! Closed early at 1.5R. Risk $50, won $75)
  { id: "mock-t4", date: "2026-09-04", symbol: "US30", category: "Index", session: "New York", direction: "Long", entryPrice: 34000, exitPrice: 34030, lotSize: 2.5, sl: 33980, tp: 34040, netPnL: 75, rMultiple: 1.5, timePeriod: "None", rulesFollowed: true, emotion: "Anxious", mistake: "Early close", strategy: "Sharp Turn #2", notes: "Got scared of a pullback and closed before 2R.", status: "Win" },
  
  // Sept 5: Bad Loss (Broke Entry Rules! Took a random trade)
  { id: "mock-t5", date: "2026-09-05", symbol: "USDJPY", category: "Forex", session: "Asian", direction: "Short", entryPrice: 150.5, exitPrice: 150.7, lotSize: 2.5, sl: 150.7, tp: 150.1, netPnL: -50, rMultiple: -1, timePeriod: "None", rulesFollowed: false, emotion: "Revenge", mistake: "None", strategy: "Order Flow", notes: "Traded out of boredom during Asian session.", status: "Loss", patterns: [] },
  
  // Sept 8: Good Win (Risk $50, Reward $100, 2R)
  { id: "mock-t6", date: "2026-09-08", symbol: "USDCAD", category: "Forex", session: "New York", direction: "Long", entryPrice: 1.350, exitPrice: 1.354, lotSize: 2.5, sl: 1.348, tp: 1.354, netPnL: 100, rMultiple: 2, timePeriod: "None", rulesFollowed: true, emotion: "Calm", mistake: "None", strategy: "Order Flow", notes: "Clean breakout and hit target exactly.", status: "Win", patterns: ["Break & Retest", "Order Block"] },
  
  // Sept 9: Trade 1 - Good Win (Risk $50, Reward $100)
  { id: "mock-t7", date: "2026-09-09", symbol: "EURGBP", category: "Forex", session: "London", direction: "Short", entryPrice: 0.860, exitPrice: 0.856, lotSize: 2.5, sl: 0.862, tp: 0.856, netPnL: 100, rMultiple: 2, timePeriod: "London silver bullet", rulesFollowed: true, emotion: "Calm", mistake: "None", strategy: "Sharp Turn #1", notes: "Great setup.", status: "Win", patterns: ["FVG"] },
  
  // Sept 9: Trade 2 - Break Even (Risk $50, Reward $0)
  { id: "mock-t8", date: "2026-09-09", symbol: "US100", category: "Index", session: "New York", direction: "Long", entryPrice: 15000, exitPrice: 15000, lotSize: 2.5, sl: 14980, tp: 15040, netPnL: 0, rMultiple: 0, timePeriod: "NY silver bullet", rulesFollowed: true, emotion: "Calm", mistake: "Moved SL", strategy: "Order Flow", notes: "Moved stop to BE manually.", status: "Break Even", patterns: ["Liquidity Sweep", "Double Top"] },
  
  // Sept 9: Trade 3 - Bad Loss (Broke Max 2 Trades Rule! 3rd trade of the day)
  { id: "mock-t9", date: "2026-09-09", symbol: "GER40", category: "Index", session: "New York", direction: "Short", entryPrice: 16000, exitPrice: 16020, lotSize: 2.5, sl: 16020, tp: 15960, netPnL: -50, rMultiple: -1, timePeriod: "None", rulesFollowed: true, emotion: "Revenge", mistake: "None", strategy: "Sharp Turn #2", notes: "Over-traded. This was my 3rd trade today.", status: "Loss", patterns: ["Change of Character"] },
  
  // Sept 10: Bad Win (Broke TP Rule! Greed held for 3R instead of 2R)
  { id: "mock-t10", date: "2026-09-10", symbol: "XAGUSD", category: "Forex", session: "New York", direction: "Long", entryPrice: 23.0, exitPrice: 23.6, lotSize: 0.83, sl: 22.8, tp: 23.4, netPnL: 150, rMultiple: 3, timePeriod: "None", rulesFollowed: true, emotion: "FOMO", mistake: "None", strategy: "Order Flow", notes: "Moved my TP further than my plan allowed to try and get 3R.", status: "Win", patterns: ["Order Block"] }
];
