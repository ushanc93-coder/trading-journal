const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Rename Max DD for clarity
code = code.replace(
  'Max DD: -$',
  'Maximum Drawdown: -$'
);

// 2. Fix the Winning % By Days donut chart legend and data injection
const badDaysChart = `<div className="flex flex-col space-y-3">
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
                </div>
              </div>
            </div>`;

const goodDaysChart = `<div className="flex flex-col space-y-3">
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
                </div>
              </div>
            </div>`;
            
// Note: We need to also make sure the Pie data for the second chart is using pieDataDays, not pieDataTrades!
code = code.replace(
  /<Pie\s+data=\{pieDataTrades\}\s+cx="50%" cy="50%"/g,
  '<Pie data={pieDataDays} cx="50%" cy="50%"'
);

// We should also replace the winRate% string in the second chart
const badDayWinRate = `<span className="text-xl font-bold text-[var(--foreground)]">{winRate}%</span>
                    <span className="text-[10px] text-[var(--win)]">winrate</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-3">`;
const goodDayWinRate = `<span className="text-xl font-bold text-[var(--foreground)]">{dayWinRate}%</span>
                    <span className="text-[10px] text-[var(--win)]">winrate</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-3">`;
code = code.replace(badDayWinRate, goodDayWinRate);

// Attempt to replace the bad days chart legend if it exists (the last occurrence)
const lastIndex = code.lastIndexOf('<div className="flex flex-col space-y-3">');
if (lastIndex !== -1 && code.substring(lastIndex).includes('{wins.length}')) {
   code = code.substring(0, lastIndex) + code.substring(lastIndex).replace(
     /<div className="flex flex-col space-y-3">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/,
     goodDaysChart + '\n          </div>'
   );
}

fs.writeFileSync('src/app/page.tsx', code);
console.log("Updated page.tsx logic");
