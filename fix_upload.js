const fs = require('fs');
let code = fs.readFileSync('src/components/AddTradeModal.tsx', 'utf8');

// Replace the image upload logic to use Base64 strings directly instead of /api/upload
const oldUploadRegex = /try \{\s*const res = await fetch\("\/api\/upload", \{\s*method: "POST",\s*body: data,\s*\}\);\s*const result = await res\.json\(\);\s*if \(result\.success && result\.url\) \{\s*setFormData\(prev => \(\{ \.\.\.prev, images: \[\.\.\.prev\.images, result\.url\] \}\)\);\s*const apiKey = preferences\.geminiApiKey;\s*if \(apiKey\) \{/m;

const newUploadLogic = `try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, images: [...prev.images, base64String] }));
        
        const apiKey = preferences.geminiApiKey;
        if (apiKey) {`;

code = code.replace(oldUploadRegex, newUploadLogic);

// Fix the Gemini model name
code = code.replace(/gemini-flash-latest/g, 'gemini-1.5-flash');

// Remove the old FileReader block since we already have the base64 string
const oldReaderRegex = /const reader = new FileReader\(\);\s*reader\.readAsDataURL\(file\);\s*reader\.onload = async \(\) => \{\s*const base64Data = \(reader\.result as string\)\.split\(\',\/\)\[1\];/m;
code = code.replace(oldReaderRegex, 'const base64Data = base64String.split(",")[1];');

// Fix closing braces: we removed the `if (result.success && result.url) {` brace, so we need to remove one closing brace at the end of the block
// We can just count braces or use a regex for the end of the try block.
// The end of the block looks like:
/*
        }
      }
    } catch (err) {
      console.error(err);
      await alert({ message: "Failed to upload image.", danger: true });
      setIsUploading(false);
    }
*/
const endBlockRegex = /\}\s*\}\s*catch \(err\)/m;
code = code.replace(endBlockRegex, '} catch (err)');


fs.writeFileSync('src/components/AddTradeModal.tsx', code);
console.log("Refactored image upload to use Base64 and updated Gemini model name");
