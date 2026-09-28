const https = require('https');

const apiKey = process.env.GEMINI_API_KEY || "dummy"; // just checking if model exists, API key doesn't matter for 404
const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest?key=${apiKey}`, { method: 'GET' }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Data:', data));
});
req.end();
