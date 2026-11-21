const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace(
  "document.documentElement.setAttribute('data-theme', 'light');",
  "document.documentElement.setAttribute('data-theme', 'light'); document.documentElement.style.backgroundColor = '#CBD5E1';"
);

code = code.replace(
  /document\.documentElement\.setAttribute\('data-theme', 'dark'\);/g,
  "document.documentElement.setAttribute('data-theme', 'dark'); document.documentElement.style.backgroundColor = '#0f111a';"
);

fs.writeFileSync('src/app/layout.tsx', code);
console.log("Added inline styles to prevent any possible FOUC flash");
