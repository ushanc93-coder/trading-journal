const fs = require('fs');
let code = fs.readFileSync('src/components/DatePickerDropdown.tsx', 'utf8');

code = code.replace(
  'w-72 bg-[var(--card)] border border-[var(--border)]',
  'w-72 bg-[var(--calendar-bg)] border border-[var(--calendar-border)]'
);

fs.writeFileSync('src/components/DatePickerDropdown.tsx', code);
console.log("Updated Calendar Container");
