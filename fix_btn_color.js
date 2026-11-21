const fs = require('fs');
let code = fs.readFileSync('src/components/DatePickerDropdown.tsx', 'utf8');

code = code.replace(
  'className="bg-[var(--calendar-bg)] border border-[var(--calendar-border)] rounded-xl px-4 py-2 text-sm',
  'className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm'
);

fs.writeFileSync('src/components/DatePickerDropdown.tsx', code);
console.log("Reverted button color!");
