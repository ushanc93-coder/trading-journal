const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const middleRowReplacement = `{/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Circular Charts */}
        <div className="flex flex-col gap-6">
          {/* Winning % By Trades */}
          <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm">Winning % By Trades</h3>
              <div className="group relative flex items-center">
                <Info className="cursor-help w-4 h-4 text-[var(--muted-foreground)]" />
                <div className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  The percentage of total individual trades that resulted in a Win.
                  <div className="absolute top-full right-2 border-4 border-transparent border-t-[var(--foreground)]"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDataTrades} cx="50%" cy="50%"
                      innerRadius={48} outerRadius={60}
                      dataKey="value" stroke="none"
                      isAnimationActive={true} animationBegin={0} animationDuration={1000} animationEasing="ease-out"
                    >
                      {pieDataTrades.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-[var(--foreground)]">{winRate}%</span>
                  <span className="text-[10px] text-[var(--win)]">winrate</span>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
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
              </div>
            </div>
          </div>

          {/* Winning % By Days */}
          <div className="bg-[var(--card)] p-5 rounded-3xl border border-[var(--border)] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm">Winning % By Days</h3>
              <div className="group relative flex items-center">
                <Info className="cursor-help w-4 h-4 text-[var(--muted-foreground)]" />
                <div className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-48 p-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-md shadow-lg z-50 text-center font-normal whitespace-normal">
                  The percentage of trading days that ended with a positive Net P&L.
                  <div className="absolute top-full right-2 border-4 border-transparent border-t-[var(--foreground)]"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDataDays} cx="50%" cy="50%"
                      innerRadius={48} outerRadius={60}
                      dataKey="value" stroke="none"
                      isAnimationActive={true} animationBegin={0} animationDuration={1000} animationEasing="ease-out"
                    >
                      {pieDataDays.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-[var(--foreground)]">{dayWinRate}%</span>
                  <span className="text-[10px] text-[var(--win)]">winrate</span>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
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
          </div>
        </div>

        {/* Right Column: Area Chart */}`;

const startIndex = code.indexOf('{/* Middle Row */}');
const endIndex = code.indexOf('{/* Right Column: Area Chart */}');

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + middleRowReplacement + code.substring(endIndex + '{/* Right Column: Area Chart */}'.length);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log("Successfully rebuilt Middle Row!");
} else {
  console.log("Could not find boundaries.");
}
