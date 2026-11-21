const fs = require('fs');
let code = fs.readFileSync('src/components/DatePickerDropdown.tsx', 'utf8');

code = code.replace(' min-w-[200px]', '');

fs.writeFileSync('src/components/DatePickerDropdown.tsx', code);
console.log("Removed hardcoded width!");
