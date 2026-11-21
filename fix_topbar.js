const fs = require('fs');
let code = fs.readFileSync('src/components/ClientLayout.tsx', 'utf8');

// 1. Add state for Date Dropdown
code = code.replace(
  'const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);',
  `const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState("This Month");
  const dateDropdownRef = useRef<HTMLDivElement>(null);`
);

// 2. Add click outside handler for Date Dropdown
code = code.replace(
  'if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {',
  `if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }`
);
code = code.replace(
  'setIsAccountDropdownOpen(false);\n      }\n    }',
  `    }`
);
code = code.replace(
  'if (isAccountDropdownOpen) {',
  `if (isAccountDropdownOpen || isDateDropdownOpen) {`
);
code = code.replace(
  '[isAccountDropdownOpen]',
  '[isAccountDropdownOpen, isDateDropdownOpen]'
);

// 3. Replace the native select with the custom UI
const oldSelect = `<div className="relative flex items-center text-sm z-50 mr-2">
                <select className="bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--foreground)] rounded-3xl py-1.5 px-3 focus:outline-none transition-colors cursor-pointer appearance-none pr-8">
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>All Time</option>
                  <option>Custom</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] absolute right-3 pointer-events-none" />
              </div>`;

const newSelect = `<div ref={dateDropdownRef} className="relative flex items-center text-sm z-50 mr-2">
              <button 
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="flex items-center justify-between min-w-[120px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--foreground)] rounded-3xl py-1.5 px-3 focus:outline-none transition-colors cursor-pointer"
              >
                <span className="truncate mr-2 font-medium">{activeDateRange}</span>
                <ChevronDown className={\`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 \${isDateDropdownOpen ? 'rotate-180' : ''}\`} />
              </button>
              
              {isDateDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-[140px] bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl shadow-black/10 z-50 p-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 origin-top-left flex flex-col gap-0.5">
                  <div className="px-2 py-1.5 mb-1 border-b border-[var(--border)]">
                    <span className="text-[10px] font-bold tracking-wider text-[var(--muted-foreground)] uppercase">Date Range</span>
                  </div>
                  {["Today", "This Week", "This Month", "All Time", "Custom"].map(range => {
                    const isActive = activeDateRange === range;
                    return (
                      <button
                        key={range}
                        onClick={() => {
                          setActiveDateRange(range);
                          setIsDateDropdownOpen(false);
                        }}
                        className={\`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 \${isActive ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50'}\`}
                      >
                        <span className="truncate">{range}</span>
                        {isActive && <Check className="w-4 h-4 ml-2 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>`;

code = code.replace(oldSelect, newSelect);
fs.writeFileSync('src/components/ClientLayout.tsx', code);
console.log("Updated ClientLayout dropdown");
