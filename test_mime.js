const https = require('https');

const apiKey = "dummy"; 
const payload = JSON.stringify({
  contents: [{
    parts: [
      { text: "Extract trading details..." }
    ]
  }],
  generationConfig: { response_mime_type: "application/json" }
});

const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, { 
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Data:', data));
});
req.write(payload);
req.end();
