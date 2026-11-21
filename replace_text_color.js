const fs = require('fs');
let code = fs.readFileSync('src/components/ClientLayout.tsx', 'utf8');

code = code.replace(/text-\[var\(--sidebar-panel\)\]/g, 'text-[var(--sidebar-active-text)]');

fs.writeFileSync('src/components/ClientLayout.tsx', code);
console.log("ClientLayout text replaced!");
