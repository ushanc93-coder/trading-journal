const fs = require('fs');
let code = fs.readFileSync('src/components/ClientLayout.tsx', 'utf8');

// Replace the native select with the custom UI
code = code.replace(
  /<div className="relative flex items-center text-sm z-50 mr-2">[\s\S]*?<select[\s\S]*?<\/select>[\s\S]*?<\/div>/,
  `<div ref={dateDropdownRef} className="relative flex items-center text-sm z-50 mr-2">
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
            </div>`
);

fs.writeFileSync('src/components/ClientLayout.tsx', code);
console.log("Replaced dropdown logic safely");
