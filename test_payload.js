const https = require('https');

// We don't have a valid key, but we can see if the error is "API_KEY_INVALID" or something else like "INVALID_ARGUMENT" (which means the payload is malformed).
const apiKey = "dummy"; 
const payload = JSON.stringify({
  contents: [{
    parts: [
      { text: "Extract trading details..." },
      { inline_data: { mime_type: "image/png", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" } }
    ]
  }]
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
