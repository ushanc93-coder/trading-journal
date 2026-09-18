const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Backgrounds
  content = content.replace(/bg-zinc-950/g, 'bg-[var(--background)]');
  content = content.replace(/bg-zinc-900/g, 'bg-[var(--card)]');
  content = content.replace(/bg-zinc-800/g, 'bg-[var(--muted)]');
  
  // Borders
  content = content.replace(/border-zinc-800/g, 'border-[var(--border)]');
  content = content.replace(/border-zinc-700/g, 'border-[var(--border)]');
  
  // Text
  content = content.replace(/text-zinc-500/g, 'text-[var(--muted-foreground)]');
  content = content.replace(/text-zinc-400/g, 'text-[var(--muted-foreground)]');
  content = content.replace(/text-zinc-300/g, 'text-[var(--foreground)]');
  content = content.replace(/text-zinc-800/g, 'text-[var(--muted-foreground)]');
  
  // Primary (Purple)
  content = content.replace(/purple-400/g, '[var(--primary)]');
  content = content.replace(/purple-500/g, '[var(--primary)]');
  content = content.replace(/purple-600/g, '[var(--primary)]');
  content = content.replace(/purple-700/g, '[var(--primary)]');
  
  // Indigo (Insights page)
  content = content.replace(/indigo-400/g, '[var(--primary)]');
  content = content.replace(/indigo-500/g, '[var(--primary)]');
  content = content.replace(/indigo-600/g, '[var(--primary)]');
  content = content.replace(/indigo-700/g, '[var(--primary)]');
  content = content.replace(/indigo-800/g, '[var(--primary)]');

  // Text white -> foreground (except when inside buttons with primary background)
  // This is tricky, but let's just do a global replace of text-white with text-[var(--foreground)]
  // and then manually fix buttons if needed, OR we can just redefine --color-white in globals.css.
  
  fs.writeFileSync(file, content, 'utf8');
});

console.log('Done refactoring classes.');
