const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Fix Break Even color to neutral gray
code = code.replace(/var\(--be\)/g, '#9CA3AF');

// 2. Add Max Drawdown and Avg R:R logic
const oldKpiLogic = `  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;`;

const newKpiLogic = `  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  
  // Max Drawdown calculation
  let peak = 0;
  let maxDd = 0;
  let runningBal = 10000; // Assuming base balance
  
  // Avg Risk to Reward (R:R)
  const avgRR = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : avgWin > 0 ? "^z" : "0.00";`;

code = code.replace(oldKpiLogic, newKpiLogic);

// 3. Fix Chronological Sorting
const oldSort = `const tradesByDate = [...trades].reverse().reduce((acc: Record<string, any>, trade: any) => {`;
const newSort = `const tradesByDate = trades.reduce((acc: Record<string, any>, trade: any) => {`;
code = code.replace(oldSort, newSort);

const oldEquity = `  const equityData = Object.values(tradesByDate).map((day: any) => {`;
const newEquity = `  
  const sortedDays = Object.values(tradesByDate).map((d: any) => ({ ...d, timestamp: parseISO(d.date).getTime() })).sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate Drawdown through chronological equity curve
  let currentPeak = 0;
  let maxDrawdownDollars = 0;
  let cumulativeForDd = 0;
  sortedDays.forEach((d: any) => {
    cumulativeForDd += d.daily;
    if (cumulativeForDd > currentPeak) currentPeak = cumulativeForDd;
    const drawdown = currentPeak - cumulativeForDd;
    if (drawdown > maxDrawdownDollars) maxDrawdownDollars = drawdown;
  });
  const maxDrawdownPct = (maxDrawdownDollars / (10000 + currentPeak)) * 100;

  const equityData = sortedDays.map((day: any) => {`;
code = code.replace(oldEquity, newEquity);

// 4. Inject KPI Cards
const profitFactorCard = `{/* Profit factor */}
        <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Profit factor <div className="group relative flex items-center">
                <Info className="cursor-help w-3 h-3 ml-1" />
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  Gross Profit divided by Gross Loss. A value above 1.0 means you are profitable.
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--foreground)]"></div>
                </div>
              </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--foreground)]">{profitFactor}</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center">
             Avg R:R: 1:{avgRR}
          </p>
        </div>`;

code = code.replace(/\{\/\* Profit factor \*\/\}[\s\S]*?<\/div>/m, profitFactorCard);

const avgWinCard = `<div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Average winning trade <div className="group relative flex items-center">
                <Info className="cursor-help w-3 h-3 ml-1" />
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  The average net profit of all your winning trades.
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--foreground)]"></div>
                </div>
              </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--win)]">
            \${avgWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-[var(--win)] mt-1 flex items-center">
             Win Rate: {winRate}%
          </p>
        </div>`;
code = code.replace(/<div className="bg-\[var\(--card\)\].*Average winning trade[\s\S]*?<\/div>\s*<\/div>/, avgWinCard);

const avgLossCard = `{/* Average losing trade */}
        <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center text-sm font-medium text-[var(--muted-foreground)] mb-1">
            Average losing trade <div className="group relative flex items-center">
                <Info className="cursor-help w-3 h-3 ml-1" />
                <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  The average net loss of all your losing trades.
                  <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[var(--foreground)]"></div>
                </div>
              </div>
          </div>
          <h3 className="text-2xl font-bold text-[var(--loss)]">
            \${avgLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-[var(--loss)] mt-1 flex items-center">
             Max DD: -\${maxDrawdownDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (-{maxDrawdownPct.toFixed(1)}%)
          </p>
        </div>`;
code = code.replace(/\{\/\* Average losing trade \*\/\}[\s\S]*?<\/div>\s*<\/div>/, avgLossCard + '\n        </div>');

// Ensure other formatting uses 2 decimal places where needed
code = code.replace(/\$121.143/g, '$121.14');
code = code.replace(/data.equity.toFixed\(2\)/g, "data.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })");
code = code.replace(/data.daily.toFixed\(2\)/g, "data.daily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })");
code = code.replace(/trade.netPnL \> 0 \? 'text-\[var\(--win\)\]'/g, "trade.netPnL > 0 ? 'text-[var(--win)]'");
code = code.replace(/\$\{trade.netPnL\}/g, "${trade.netPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}");

fs.writeFileSync('src/app/page.tsx', code);
console.log("Updated page.tsx logic");
