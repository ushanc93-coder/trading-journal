const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace top logic
const oldLogic = `  // Derived Metrics
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.status === "Win");
  const losses = trades.filter(t => t.status === "Loss");
  const winRate = totalTrades > 0 ? Math.round((wins.length / totalTrades) * 100) : 0;`;

const newLogic = `  // Derived Metrics
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.status === "Win");
  const losses = trades.filter(t => t.status === "Loss");
  const breakEvens = trades.filter(t => t.status === "Break Even");
  const closedTrades = wins.length + losses.length + breakEvens.length;
  const winRate = closedTrades > 0 ? Math.round((wins.length / closedTrades) * 100) : 0;`;
code = code.replace(oldLogic, newLogic);

// Replace pieDataTrades
const oldPieTrades = `  // Data for Donut Chart (Trades)
  const pieDataTrades = [
    { name: "Winners", value: wins.length, color: "var(--win)" },
    { name: "Losers", value: losses.length, color: "var(--loss)" }
  ];`;

const newPieTrades = `  // Data for Donut Chart (Trades)
  const pieDataTrades = [
    { name: "Winners", value: wins.length, color: "var(--win)" },
    { name: "Losers", value: losses.length, color: "var(--loss)" }
  ];
  if (breakEvens.length > 0) {
    pieDataTrades.push({ name: "Break Evens", value: breakEvens.length, color: "var(--be)" });
  }

  const winningDays = Object.values(tradesByDate).filter((d: any) => d.daily > 0).length;
  const losingDays = Object.values(tradesByDate).filter((d: any) => d.daily < 0).length;
  const breakEvenDays = Object.values(tradesByDate).filter((d: any) => d.daily === 0).length;
  const totalDays = winningDays + losingDays + breakEvenDays;
  const dayWinRate = totalDays > 0 ? Math.round((winningDays / totalDays) * 100) : 0;
  
  const pieDataDays = [
    { name: "Winners", value: winningDays, color: "var(--win)" },
    { name: "Losers", value: losingDays, color: "var(--loss)" }
  ];
  if (breakEvenDays > 0) {
    pieDataDays.push({ name: "Break Evens", value: breakEvenDays, color: "var(--be)" });
  }`;
code = code.replace(oldPieTrades, newPieTrades);

fs.writeFileSync('src/app/page.tsx', code);
console.log("Updated logic, now let's update JSX");
