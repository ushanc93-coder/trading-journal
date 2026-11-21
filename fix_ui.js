const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldDonut1 = `<div className="flex flex-col space-y-3">
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
                
const newDonut1 = `<div className="flex flex-col space-y-3">
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
                        <div className="w-3 h-3 bg-[var(--be)] rounded-sm mr-2"></div>
                        {breakEvens.length}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] ml-5">break even</span>
                    </div>
                  )}
                </div>`;

const oldDonut2 = `<div className="relative w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieDataTrades}
                        cx="50%" cy="50%"
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
                </div>`;

const newDonut2 = `<div className="relative w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieDataDays}
                        cx="50%" cy="50%"
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
                        <div className="w-3 h-3 bg-[var(--be)] rounded-sm mr-2"></div>
                        {breakEvenDays}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] ml-5">break even</span>
                    </div>
                  )}
                </div>`;

// First replace for Trades donut
code = code.replace(oldDonut1, newDonut1);
// Second replace for Days donut
code = code.replace(oldDonut2, newDonut2);

fs.writeFileSync('src/app/page.tsx', code);
console.log("Updated both donut charts");
