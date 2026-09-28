const fs = require('fs');
let code = fs.readFileSync('src/components/AddTradeModal.tsx', 'utf8');

code = code.replace(/inline_data/g, 'inlineData');
code = code.replace(/mime_type/g, 'mimeType');
code = code.replace(/response_mime_type/g, 'responseMimeType');

fs.writeFileSync('src/components/AddTradeModal.tsx', code);
console.log("Updated snake_case to camelCase for Gemini payload");
