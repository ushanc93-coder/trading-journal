const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

css = css.replace('.recharts-wrapper, .recharts-surface { outline: none !important; }', 
  '.recharts-responsive-container, .recharts-wrapper, .recharts-wrapper *, .recharts-surface, .recharts-surface * { outline: none !important; box-shadow: none !important; }');

fs.writeFileSync('src/app/globals.css', css);
console.log("Updated globals.css to fix recharts focus ring");
