const fs = require('fs');
let code = fs.readFileSync('src/components/AddTradeModal.tsx', 'utf8');

// The code currently has "response_mimeType". We need to change it to "responseMimeType".
code = code.replace(/response_mimeType/g, 'responseMimeType');

fs.writeFileSync('src/components/AddTradeModal.tsx', code);
console.log("Fixed responseMimeType");
