const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

code = code.replace('--sidebar-bg: #151725;', '--sidebar-rail: #0f111a;\n  --sidebar-panel: #1a1c29;');
code = code.replace('--sidebar-bg: #4338CA;', '--sidebar-rail: #3730A3;\n  --sidebar-panel: #4338CA;');

fs.writeFileSync('src/app/globals.css', code);
console.log("CSS replaced!");
