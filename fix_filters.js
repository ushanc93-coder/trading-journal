const fs = require('fs');

// 1. Update SettingsContext
let settingsCode = fs.readFileSync('src/lib/SettingsContext.tsx', 'utf8');

settingsCode = settingsCode.replace(
  'isLoaded: boolean;\n};',
  `isLoaded: boolean;\n  activeDateRange: string;\n  setActiveDateRange: (range: string) => void;\n};`
);

settingsCode = settingsCode.replace(
  'const [isLoaded, setIsLoaded] = useState(false);',
  `const [isLoaded, setIsLoaded] = useState(false);\n  const [activeDateRange, setActiveDateRange] = useState("All Time");`
);

settingsCode = settingsCode.replace(
  'updatePreferences,\n        isLoaded',
  `updatePreferences,\n        isLoaded,\n        activeDateRange,\n        setActiveDateRange`
);

fs.writeFileSync('src/lib/SettingsContext.tsx', settingsCode);


// 2. Update ClientLayout
let clientCode = fs.readFileSync('src/components/ClientLayout.tsx', 'utf8');

clientCode = clientCode.replace(
  'const [isLoaded, setIsLoaded] = useState(false);\n  const [activeDateRange, setActiveDateRange] = useState("This Month");',
  `const [isLoaded, setIsLoaded] = useState(false);`
);
clientCode = clientCode.replace(
  'const [activeDateRange, setActiveDateRange] = useState("This Month");',
  ''
);

clientCode = clientCode.replace(
  'const { accounts, activeAccountId, setActiveAccountId, isLoaded } = useSettingsContext();',
  'const { accounts, activeAccountId, setActiveAccountId, isLoaded, activeDateRange, setActiveDateRange } = useSettingsContext();'
);

fs.writeFileSync('src/components/ClientLayout.tsx', clientCode);


// 3. Update Dashboard Page
let dashCode = fs.readFileSync('src/app/page.tsx', 'utf8');

dashCode = dashCode.replace(
  'import { useState } from "react";',
  'import { useState } from "react";\nimport { useSettingsContext } from "@/lib/SettingsContext";\nimport { isWithinInterval, startOfDay, startOfWeek, startOfMonth, parseISO } from "date-fns";'
);

// We already imported date-fns format and parseISO, so we should just append the others to the import
dashCode = dashCode.replace(
  'import { format, parseISO } from "date-fns";',
  'import { format, parseISO, isWithinInterval, startOfDay, startOfWeek, startOfMonth } from "date-fns";'
);
// Remove the duplicate date-fns import I just accidentally added in the replace above
dashCode = dashCode.replace(
  'import { useState } from "react";\nimport { useSettingsContext } from "@/lib/SettingsContext";\nimport { isWithinInterval, startOfDay, startOfWeek, startOfMonth, parseISO } from "date-fns";',
  'import { useState } from "react";\nimport { useSettingsContext } from "@/lib/SettingsContext";'
);

const filterLogic = `  const { activeDateRange } = useSettingsContext();

  const now = new Date();
  let filteredTrades = trades;
  
  if (activeDateRange !== "All Time" && activeDateRange !== "Custom") {
    filteredTrades = trades.filter(t => {
      const tradeDate = parseISO(t.date);
      if (activeDateRange === "Today") {
        return tradeDate >= startOfDay(now);
      } else if (activeDateRange === "This Week") {
        return tradeDate >= startOfWeek(now, { weekStartsOn: 1 });
      } else if (activeDateRange === "This Month") {
        return tradeDate >= startOfMonth(now);
      }
      return true;
    });
  }

  // Derived Metrics
  const totalTrades = filteredTrades.length;
  const wins = filteredTrades.filter(t => t.status === "Win");
  const losses = filteredTrades.filter(t => t.status === "Loss");
  const breakEvens = filteredTrades.filter(t => t.status === "Break Even");`;

dashCode = dashCode.replace(
  /  \/\/ Derived Metrics[\s\S]*?const breakEvens = trades\.filter\(t => t\.status === "Break Even"\);/,
  filterLogic
);

// Replace ALL remaining `trades.` and `tradesByDate` logic to use `filteredTrades`
dashCode = dashCode.replace(
  /const netPnL = trades\.reduce/g,
  'const netPnL = filteredTrades.reduce'
);

dashCode = dashCode.replace(
  /const tradesByDate = trades\.reduce/g,
  'const tradesByDate = filteredTrades.reduce'
);

fs.writeFileSync('src/app/page.tsx', dashCode);
console.log("Implemented global date filtering!");
