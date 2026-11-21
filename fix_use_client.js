const fs = require('fs');
let code = fs.readFileSync('src/components/ClientLayout.tsx', 'utf8');

code = code.replace('import DatePickerDropdown from "./DatePickerDropdown";\n"use client";', '"use client";\nimport DatePickerDropdown from "./DatePickerDropdown";');

fs.writeFileSync('src/components/ClientLayout.tsx', code);
console.log("Fixed use client position");
