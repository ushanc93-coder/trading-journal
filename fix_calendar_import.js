const fs = require('fs');
let code = fs.readFileSync('src/components/ClientLayout.tsx', 'utf8');

if (!code.includes('import DatePickerDropdown')) {
  code = 'import DatePickerDropdown from "./DatePickerDropdown";\n' + code;
}

code = code.replace(
  '(d) => setCustomDateRange({ ...customDateRange, start: d } as any)',
  '(d: string) => setCustomDateRange({ ...customDateRange, start: d } as any)'
);
code = code.replace(
  '(d) => setCustomDateRange({ ...customDateRange, end: d } as any)',
  '(d: string) => setCustomDateRange({ ...customDateRange, end: d } as any)'
);

fs.writeFileSync('src/components/ClientLayout.tsx', code);
console.log("Fixed import and types");
