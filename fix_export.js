const fs = require('fs');
let code = fs.readFileSync('src/lib/SettingsContext.tsx', 'utf8');

// The exported provider value is currently missing customDateRange.
// Let's add it explicitly by matching the exact line.
const badExport = 'updatePreferences, isLoaded, activeDateRange, setActiveDateRange';
const goodExport = 'updatePreferences, isLoaded, activeDateRange, setActiveDateRange, customDateRange, setCustomDateRange';

code = code.replace(badExport, goodExport);

fs.writeFileSync('src/lib/SettingsContext.tsx', code);
console.log("Fixed export payload");
