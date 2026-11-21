const fs = require('fs');
let code = fs.readFileSync('src/components/DatePickerDropdown.tsx', 'utf8');

if (!code.includes('"use client"')) {
  code = '"use client";\n' + code;
  fs.writeFileSync('src/components/DatePickerDropdown.tsx', code);
  console.log("Added use client to DatePickerDropdown");
} else {
  console.log("Already has use client");
}
