const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

css += `\nbody {\n  background-color: var(--background);\n  color: var(--foreground);\n}\n`;

fs.writeFileSync('src/app/globals.css', css);
console.log("Added body background color to globals.css");
