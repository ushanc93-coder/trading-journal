const fs = require('fs');
let code = fs.readFileSync('src/lib/SettingsContext.tsx', 'utf8');

code = code.replace(
  'updatePreferences,\n        isLoaded',
  `updatePreferences,\n        isLoaded,\n        activeDateRange,\n        setActiveDateRange`
);

fs.writeFileSync('src/lib/SettingsContext.tsx', code);
console.log("Fixed context provider value");
