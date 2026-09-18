const fs = require('fs');

const trades = [];
let date = new Date("2026-09-01T10:00:00Z");

const symbols = ["EURUSD", "GBPUSD", "USDJPY", "US30", "XAUUSD"];
const strategies = ["Order Flow", "Sharp Turn #1", "Sharp Turn #2"];
const emotions = ["Calm", "FOMO", "Anxious"];
const mistakes = ["None", "Moved SL", "Early close"];

let idCount = 1;

for (let i = 0; i < 25; i++) {
  // Skip weekends
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  const isWin = Math.random() > 0.35; // 65% win rate
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const netPnL = isWin ? Math.floor(Math.random() * 300) + 100 : -(Math.floor(Math.random() * 150) + 50);
  const status = isWin ? "Win" : "Loss";
  
  trades.push({
    id: `mock-${idCount++}`,
    symbol,
    direction: Math.random() > 0.5 ? "Long" : "Short",
    entryPrice: parseFloat((1.1000 + Math.random() * 0.05).toFixed(4)),
    exitPrice: parseFloat((1.1000 + (isWin ? 0.005 : -0.005)).toFixed(4)),
    lotSize: Math.floor(Math.random() * 3) + 1,
    sl: 1.0950,
    tp: 1.1100,
    netPnL,
    rMultiple: isWin ? parseFloat((Math.random() * 2 + 1).toFixed(2)) : -1,
    category: symbol === "US30" ? "Index" : "Forex",
    session: ["New York", "London", "Asian"][Math.floor(Math.random() * 3)],
    timePeriod: "None",
    date: date.toISOString().split('T')[0],
    rulesFollowed: Math.random() > 0.2,
    emotion: emotions[Math.floor(Math.random() * emotions.length)],
    mistake: mistakes[Math.floor(Math.random() * mistakes.length)],
    strategy: strategies[Math.floor(Math.random() * strategies.length)],
    notes: "Trade executed according to plan. " + (isWin ? "Hit TP." : "Stopped out."),
    status
  });

  // Advance date
  if (Math.random() > 0.5) {
    date.setDate(date.getDate() + 1);
  }
}

const fileContent = `export type Trade = {
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
};

export const MOCK_TRADES: Trade[] = ${JSON.stringify(trades, null, 2)};
`;

fs.writeFileSync('src/lib/mock-data.ts', fileContent);
console.log("Mock data generated.");
