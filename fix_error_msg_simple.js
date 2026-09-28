const fs = require('fs');
let code = fs.readFileSync('src/components/AddTradeModal.tsx', 'utf8');

const oldErrorBlock = `                if (aiRes.status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("exceeded")) {
                  setAiError("AI Analysis is currently busy due to high demand. Please try again in a few moments.");
                } else {
                  setAiError("AI Vision failed: " + (errMsg || "Please verify your API key."));
                }`;

const newErrorBlock = `                if (aiRes.status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("exceeded")) {
                  setAiError("AI Analysis is currently busy due to high demand. Please try again in a few moments.");
                } else if (aiRes.status === 400 || aiRes.status === 403 || aiRes.status === 404) {
                  setAiError("AI Vision failed: Please verify your Gemini API key in Settings. Make sure you generated it from Google AI Studio.");
                } else {
                  setAiError("AI Vision failed: Unable to process the image at this time. Please try again.");
                }`;

code = code.replace(oldErrorBlock, newErrorBlock);
fs.writeFileSync('src/components/AddTradeModal.tsx', code);
console.log("Simplified error message");
