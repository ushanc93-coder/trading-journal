const fs = require('fs');
let code = fs.readFileSync('src/components/AddTradeModal.tsx', 'utf8');

code = code.replace(/gemini-1\.5-flash:generateContent/g, 'gemini-1.5-flash-latest:generateContent');

fs.writeFileSync('src/components/AddTradeModal.tsx', code);
console.log("Updated model to gemini-1.5-flash-latest");
