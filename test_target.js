const fs = require('fs');
let code = fs.readFileSync('src/components/AddTradeModal.tsx', 'utf8');

// The goal is to move the AI extraction OUTSIDE and BEFORE the `/api/upload` fetch.
// This way, even if the image upload fails on Vercel, the AI will still extract the trade!

const target = `      setIsUploading(true);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, result.url] }));
        
        const apiKey = preferences.geminiApiKey;
        if (apiKey) {`;

console.log(code.includes(target));
