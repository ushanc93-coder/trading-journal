const fs = require('fs');
let code = fs.readFileSync('src/components/AddTradeModal.tsx', 'utf8');

const oldErrorBlock = `                if (aiRes.status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("exceeded")) {
                  setAiError("AI Analysis is currently busy due to high demand. Please try again in a few moments.");
                } else {
                  setAiError("AI Vision failed: Please verify your API key and network connection.");
                }`;

const newErrorBlock = `                if (aiRes.status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("exceeded")) {
                  setAiError("AI Analysis is currently busy due to high demand. Please try again in a few moments.");
                } else {
                  setAiError("AI Vision failed: " + (errMsg || "Please verify your API key."));
                }`;

code = code.replace(oldErrorBlock, newErrorBlock);
fs.writeFileSync('src/components/AddTradeModal.tsx', code);
console.log("Improved error message visibility");
