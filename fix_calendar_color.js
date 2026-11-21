const fs = require('fs');

// 1. Update CSS
let css = fs.readFileSync('src/app/globals.css', 'utf8');

css = css.replace(
  '/* DARK THEME (Default) */',
  '/* DARK THEME (Default) */\n  --calendar-bg: #1e1b4b;\n  --calendar-border: #312e81;'
);

css = css.replace(
  '/* COOL GRAY / DIM THEME */',
  '/* COOL GRAY / DIM THEME */\n    --calendar-bg: #e0e7ff;\n    --calendar-border: #c7d2fe;'
);

fs.writeFileSync('src/app/globals.css', css);


// 2. Update DatePickerDropdown
let dpCode = fs.readFileSync('src/components/DatePickerDropdown.tsx', 'utf8');

dpCode = dpCode.replace(
  'bg-[var(--card)] border border-[var(--border)]',
  'bg-[var(--calendar-bg)] border border-[var(--calendar-border)]'
);

fs.writeFileSync('src/components/DatePickerDropdown.tsx', dpCode);
console.log("Updated Calendar Theme");
