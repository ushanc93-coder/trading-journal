const fs = require('fs');
let code = fs.readFileSync('src/lib/SettingsContext.tsx', 'utf8');

code = code.replace(
  'const [activeDateRange, setActiveDateRange, customDateRange, setCustomDateRange] = useState("All Time");',
  'const [activeDateRange, setActiveDateRange] = useState("All Time");'
);

fs.writeFileSync('src/lib/SettingsContext.tsx', code);
console.log("Fixed useState bug");
