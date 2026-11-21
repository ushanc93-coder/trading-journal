const fs = require('fs');
let code = fs.readFileSync('src/components/ClientLayout.tsx', 'utf8');

// 1. Add import
if (!code.includes('DatePickerDropdown')) {
  code = code.replace(
    'import { Menu, X, Home, BookOpen, LineChart, PieChart, BrainCircuit, Settings, Plus, LayoutDashboard, ChevronDown, Check, LogOut, FileText, ChevronRight } from "lucide-react";',
    'import { Menu, X, Home, BookOpen, LineChart, PieChart, BrainCircuit, Settings, Plus, LayoutDashboard, ChevronDown, Check, LogOut, FileText, ChevronRight } from "lucide-react";\nimport DatePickerDropdown from "./DatePickerDropdown";'
  );
}

// 2. Replace the native inputs with the custom component
const oldInputs = `<input 
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
                  />`;

const newInputs = `<DatePickerDropdown 
                    date={customDateRange?.start || new Date().toISOString()} 
                    onChange={(d) => setCustomDateRange({ ...customDateRange, start: d } as any)} 
                  />
                  <span className="text-[var(--muted-foreground)] text-xs font-medium">to</span>
                  <DatePickerDropdown 
                    date={customDateRange?.end || new Date().toISOString()} 
                    onChange={(d) => setCustomDateRange({ ...customDateRange, end: d } as any)} 
                  />`;

code = code.replace(oldInputs, newInputs);
fs.writeFileSync('src/components/ClientLayout.tsx', code);
console.log("Replaced with custom DatePickerDropdown!");
