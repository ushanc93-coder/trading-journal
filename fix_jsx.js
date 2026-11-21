const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const badBlock = `          </div>
                  </div>
                </div>
            </div>
            <h3 className="text-2xl font-bold text-[var(--foreground)]">{profitFactor}</h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center">
               +0.12 {/* Mock trend */}
            </p>
          </div>`;
          
code = code.replace(badBlock, '          </div>');

fs.writeFileSync('src/app/page.tsx', code);
console.log("Fixed JSX syntax error!");
