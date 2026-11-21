const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace("localStorage.getItem('uc-journal-settings')", "localStorage.getItem('preferences')");

fs.writeFileSync('src/app/layout.tsx', code);
console.log("Fixed localStorage key in layout.tsx");
