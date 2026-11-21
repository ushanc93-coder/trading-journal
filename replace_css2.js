const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

code = code.replace('--sidebar-panel: #1a1c29;', '--sidebar-panel: #1a1c29;\n  --sidebar-active-bg: #262938;');
code = code.replace('--sidebar-panel: #4338CA;', '--sidebar-panel: #4338CA;\n  --sidebar-active-bg: #F8FAFC;');

fs.writeFileSync('src/app/globals.css', code);
console.log("CSS replaced!");
