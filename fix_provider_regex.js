const fs = require('fs');
let code = fs.readFileSync('src/lib/SettingsContext.tsx', 'utf8');

code = code.replace(
  'updatePreferences, isLoaded',
  'updatePreferences, isLoaded, activeDateRange, setActiveDateRange'
);

fs.writeFileSync('src/lib/SettingsContext.tsx', code);
console.log("Fixed context provider value safely");
