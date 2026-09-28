const fs = require('fs');
let code = fs.readFileSync('src/components/AddTradeModal.tsx', 'utf8');

code = code.replace(/          }, 1500\);\n        \}\n      \} catch \(err\) \{/g, '          }, 1500);\n        }\n      };\n    } catch (err) {');

fs.writeFileSync('src/components/AddTradeModal.tsx', code);
console.log("Fixed bracket syntax");
