const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(
  '${avgWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}',
  '${avgWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}'
);

code = code.replace(
  '${netPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}',
  '${netPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}'
);

fs.writeFileSync('src/app/page.tsx', code);
console.log("Fixed max fraction digits");
