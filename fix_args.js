const fs = require('fs');
let code = fs.readFileSync('src/app/settings/page.tsx', 'utf8');

code = code.replace(/addAccount\(accName\.trim\(\), Number\(accBalance\)\);/g, 'addAccount({ name: accName.trim(), balance: Number(accBalance) });');
code = code.replace(/updateAccount\(editingAccountId, accName\.trim\(\), Number\(accBalance\)\);/g, 'updateAccount(editingAccountId, { name: accName.trim(), balance: Number(accBalance) });');

fs.writeFileSync('src/app/settings/page.tsx', code);
console.log("Fixed addAccount args");
