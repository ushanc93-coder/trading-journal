const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

code = code.replace('--sidebar-active-bg: #262938;', '--sidebar-active-bg: #262938;\n  --sidebar-active-text: #ffffff;');
code = code.replace('--sidebar-active-bg: #F8FAFC;', '--sidebar-active-bg: #F8FAFC;\n  --sidebar-active-text: #3730A3;');

fs.writeFileSync('src/app/globals.css', code);
console.log("CSS replaced!");
