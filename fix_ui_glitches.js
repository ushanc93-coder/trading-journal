const fs = require('fs');

// 1. Fix Topbar z-index
let clientCode = fs.readFileSync('src/components/ClientLayout.tsx', 'utf8');
clientCode = clientCode.replace(
  'sticky top-0 z-10',
  'sticky top-0 z-40'
);
fs.writeFileSync('src/components/ClientLayout.tsx', clientCode);


// 2. Fix DatePickerDropdown formatting
let dpCode = fs.readFileSync('src/components/DatePickerDropdown.tsx', 'utf8');
dpCode = dpCode.replace(
  `{format(selectedDate, 'MMM d, yyyy h:mm a')}`,
  `{format(selectedDate, 'MMM d, yyyy')}`
);
fs.writeFileSync('src/components/DatePickerDropdown.tsx', dpCode);

console.log("Fixed Topbar z-index and DatePicker format!");
