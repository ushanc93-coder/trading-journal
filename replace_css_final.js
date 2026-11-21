const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

// Reset and set variables for dark theme
code = code.replace(/--sidebar-rail:.*?;/g, '');
code = code.replace(/--sidebar-panel:.*?;/g, '');
code = code.replace(/--sidebar-active-bg:.*?;/g, '');
code = code.replace(/--sidebar-active-text:.*?;/g, '');

const darkVars = `  --sidebar-bg: #151725;
  --sidebar-rail-bg: #1e2235;
  --sidebar-active-bg: #262938;
  --sidebar-active-text: #ffffff;`;

const lightVars = `  --sidebar-bg: #4338CA;
  --sidebar-rail-bg: #4F46E5;
  --sidebar-active-bg: #ffffff;
  --sidebar-active-text: #4338CA;`;

code = code.replace('--sidebar-bg: #151725;', darkVars);
code = code.replace('--sidebar-bg: #4338CA;', lightVars);

fs.writeFileSync('src/app/globals.css', code);
console.log("CSS replaced!");
