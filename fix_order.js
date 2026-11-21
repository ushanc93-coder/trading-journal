const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const badBlock = `  const winRateFloat = closedTrades > 0 ? (wins.length / closedTrades) : 0;
  const lossRateFloat = closedTrades > 0 ? (losses.length / closedTrades) : 0;
  const expectedValue = (winRateFloat * avgWin) - (lossRateFloat * avgLoss);
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;`;

const goodBlock = `  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const winRateFloat = closedTrades > 0 ? (wins.length / closedTrades) : 0;
  const lossRateFloat = closedTrades > 0 ? (losses.length / closedTrades) : 0;
  const expectedValue = (winRateFloat * avgWin) - (lossRateFloat * avgLoss);`;

code = code.replace(badBlock, goodBlock);
fs.writeFileSync('src/app/page.tsx', code);
console.log("Moved expectedValue after avgLoss");
