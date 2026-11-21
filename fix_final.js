const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Fix Chronological sorting (parseISO -> new Date)
code = code.replace(
  'timestamp: parseISO(d.date).getTime()',
  'timestamp: new Date(d.date).getTime()'
);

// Calculate Expected Value (WinRate * AvgWin - LossRate * AvgLoss)
code = code.replace(
  'const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;',
  `const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  
  const winRateFloat = closedTrades > 0 ? (wins.length / closedTrades) : 0;
  const lossRateFloat = closedTrades > 0 ? (losses.length / closedTrades) : 0;
  const expectedValue = (winRateFloat * avgWin) - (lossRateFloat * avgLoss);`
);

// 2. Fix Average winning trade card text
const oldAvgWinCard = `<p className="text-xs text-[var(--win)] mt-1 flex items-center">
             <ArrowUpRight className="w-3 h-3 mr-0.5" /> +17.25
          </p>`;
const newAvgWinCard = `<p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center">
             Expected Value: <span className={expectedValue >= 0 ? "text-[var(--win)] ml-1" : "text-[var(--loss)] ml-1"}>{expectedValue >= 0 ? '+' : ''}\${expectedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>`;
code = code.replace(oldAvgWinCard, newAvgWinCard);

// 3. Fix Donut Chart Legends (Trades and Days)
const oldDonutTradesLegend = `<div className="flex flex-col space-y-3">
                  <div className="flex flex-col">
                    <div className="flex items-center text-sm font-bold">
                      <div className="w-3 h-3 bg-[var(--win)] rounded-sm mr-2"></div>
                      {wins.length}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] ml-5">winners</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center text-sm font-bold">
                      <div className="w-3 h-3 bg-[var(--loss)] rounded-sm mr-2"></div>
                      {losses.length}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] ml-5">losers</span>
                  </div>
                </div>`;

const newDonutTradesLegend = `<div className="flex flex-col space-y-3">
                  <div className="flex flex-col">
                    <div className="flex items-center text-sm font-bold">
                      <div className="w-3 h-3 bg-[var(--win)] rounded-sm mr-2"></div>
                      {wins.length}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] ml-5">winners</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center text-sm font-bold">
                      <div className="w-3 h-3 bg-[var(--loss)] rounded-sm mr-2"></div>
                      {losses.length}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] ml-5">losers</span>
                  </div>
                  {breakEvens.length > 0 && (
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm font-bold">
                        <div className="w-3 h-3 bg-[#9CA3AF] rounded-sm mr-2"></div>
                        {breakEvens.length}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] ml-5">break even</span>
                    </div>
                  )}
                </div>`;

code = code.replace(oldDonutTradesLegend, newDonutTradesLegend);

// Same for Days
const oldDonutDaysLegend = `<div className="flex flex-col space-y-3">
                  <div className="flex flex-col">
                    <div className="flex items-center text-sm font-bold">
                      <div className="w-3 h-3 bg-[var(--win)] rounded-sm mr-2"></div>
                      {wins.length}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] ml-5">winners</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center text-sm font-bold">
                      <div className="w-3 h-3 bg-[var(--loss)] rounded-sm mr-2"></div>
                      {losses.length}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] ml-5">losers</span>
                  </div>
                </div>`;

const newDonutDaysLegend = `<div className="flex flex-col space-y-3">
                  <div className="flex flex-col">
                    <div className="flex items-center text-sm font-bold">
                      <div className="w-3 h-3 bg-[var(--win)] rounded-sm mr-2"></div>
                      {winningDays}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] ml-5">winners</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center text-sm font-bold">
                      <div className="w-3 h-3 bg-[var(--loss)] rounded-sm mr-2"></div>
                      {losingDays}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] ml-5">losers</span>
                  </div>
                  {breakEvenDays > 0 && (
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm font-bold">
                        <div className="w-3 h-3 bg-[#9CA3AF] rounded-sm mr-2"></div>
                        {breakEvenDays}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] ml-5">break even</span>
                    </div>
                  )}
                </div>`;

// Only replace the second occurrence, or just use regex with specific surrounding text
code = code.replace(/<div className="absolute inset-0 flex flex-col items-center justify-center">\s*<span className="text-xl font-bold text-\[var\(--foreground\)\]">\{dayWinRate\}%<\/span>\s*<span className="text-\[10px\] text-\[var\(--win\)\]">winrate<\/span>\s*<\/div>\s*<\/div>\s*<div className="flex flex-col space-y-3">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, `<div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-[var(--foreground)]">{dayWinRate}%</span>
                    <span className="text-[10px] text-[var(--win)]">winrate</span>
                  </div>
                </div>
                ${newDonutDaysLegend}`);

fs.writeFileSync('src/app/page.tsx', code);
console.log("All UI fixes applied successfully!");
