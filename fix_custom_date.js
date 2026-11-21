const fs = require('fs');

// 1. SettingsContext
let settingsCode = fs.readFileSync('src/lib/SettingsContext.tsx', 'utf8');

settingsCode = settingsCode.replace(
  'activeDateRange: string;',
  `activeDateRange: string;\n  customDateRange: { start: string, end: string } | null;\n  setCustomDateRange: (range: { start: string, end: string } | null) => void;`
);

settingsCode = settingsCode.replace(
  'const [activeDateRange, setActiveDateRange] = useState("All Time");',
  `const [activeDateRange, setActiveDateRange] = useState("All Time");\n  const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string } | null>(null);`
);

settingsCode = settingsCode.replace(
  'activeDateRange, setActiveDateRange',
  'activeDateRange, setActiveDateRange, customDateRange, setCustomDateRange'
);

fs.writeFileSync('src/lib/SettingsContext.tsx', settingsCode);


// 2. ClientLayout Topbar
let clientCode = fs.readFileSync('src/components/ClientLayout.tsx', 'utf8');

clientCode = clientCode.replace(
  'const { accounts, activeAccountId, setActiveAccountId, isLoaded, activeDateRange, setActiveDateRange } = useSettingsContext();',
  'const { accounts, activeAccountId, setActiveAccountId, isLoaded, activeDateRange, setActiveDateRange, customDateRange, setCustomDateRange } = useSettingsContext();'
);

const customDatePickerUI = `              {activeDateRange === "Custom" && (
                <div className="flex items-center space-x-2 mr-2 animate-in fade-in slide-in-from-right-2">
                  <input 
                    type="date" 
                    value={customDateRange?.start || ''}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value } as any)}
                    className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[var(--primary)] transition-colors [color-scheme:dark]" 
                  />
                  <span className="text-[var(--muted-foreground)] text-xs font-medium">to</span>
                  <input 
                    type="date" 
                    value={customDateRange?.end || ''}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value } as any)}
                    className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[var(--primary)] transition-colors [color-scheme:dark]" 
                  />
                </div>
              )}
              
              <div ref={dateDropdownRef} className="relative flex items-center text-sm z-50 mr-2">`;

clientCode = clientCode.replace(
  '<div ref={dateDropdownRef} className="relative flex items-center text-sm z-50 mr-2">',
  customDatePickerUI
);

fs.writeFileSync('src/components/ClientLayout.tsx', clientCode);


// 3. page.tsx Dashboard Logic
let dashCode = fs.readFileSync('src/app/page.tsx', 'utf8');

dashCode = dashCode.replace(
  'const { activeDateRange } = useSettingsContext();',
  'const { activeDateRange, customDateRange } = useSettingsContext();'
);

// We need to implement custom date range filtering
const newFilterLogic = `  const now = new Date();
  let filteredTrades = trades;
  
  if (activeDateRange !== "All Time") {
    filteredTrades = trades.filter(t => {
      const tradeDate = parseISO(t.date);
      if (activeDateRange === "Today") {
        return tradeDate >= startOfDay(now);
      } else if (activeDateRange === "This Week") {
        return tradeDate >= startOfWeek(now, { weekStartsOn: 1 });
      } else if (activeDateRange === "This Month") {
        return tradeDate >= startOfMonth(now);
      } else if (activeDateRange === "Custom" && customDateRange?.start && customDateRange?.end) {
        return tradeDate >= new Date(customDateRange.start) && tradeDate <= new Date(customDateRange.end);
      }
      return true;
    });
  }`;

dashCode = dashCode.replace(
  /  const now = new Date\(\);[\s\S]*?return true;\n    \}\);\n  \}/,
  newFilterLogic
);

fs.writeFileSync('src/app/page.tsx', dashCode);
console.log("Added custom date picker logic!");
