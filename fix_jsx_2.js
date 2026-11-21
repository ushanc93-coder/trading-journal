const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const startTag = '{/* Profit factor */}';
const endTag = '{/* Average winning trade */}';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

const badBlock = code.substring(startIndex, endIndex);

const correctBlock = `{/* Profit factor */}
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
        </div>

        `;

code = code.replace(badBlock, correctBlock);
fs.writeFileSync('src/app/page.tsx', code);
console.log("Fixed JSX syntax perfectly");
