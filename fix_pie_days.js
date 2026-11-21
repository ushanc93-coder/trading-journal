const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace pieDataTrades with pieDataDays in the second chart
const lastIndexOfMap = code.lastIndexOf('pieDataTrades.map');
code = code.substring(0, lastIndexOfMap) + code.substring(lastIndexOfMap).replace('pieDataTrades.map', 'pieDataDays.map');

// Replace winRate% with dayWinRate% in the second chart
const lastIndexOfWinRate = code.lastIndexOf('{winRate}%');
code = code.substring(0, lastIndexOfWinRate) + code.substring(lastIndexOfWinRate).replace('{winRate}%', '{dayWinRate}%');

fs.writeFileSync('src/app/page.tsx', code);
console.log("Fixed the pieDataDays iteration and dayWinRate variables");
