const fs = require('fs');
let code = fs.readFileSync('src/app/settings/page.tsx', 'utf8');

code = code.replace(/import \{ useAlert \} from "@\/lib\/AlertContext";\n/g, '');
code = code.replace(/const alert = useAlert\(\);\n/g, '');
code = code.replace(/await alert\(/g, 'await confirm(');

fs.writeFileSync('src/app/settings/page.tsx', code);
console.log("Fixed alert hook");
