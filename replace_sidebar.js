const fs = require('fs');
let code = fs.readFileSync('src/components/ClientLayout.tsx', 'utf8');

const newSidebar = `function SidebarTooltip({ children, label, show }: { children: React.ReactNode; label: string; show: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {show && isHovered && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[100] pointer-events-none">
          <div className="bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-tooltip-in">
            {label}
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[var(--foreground)] rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { addTrade } = useTradesContext();

  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Trade Log", href: "/trades", icon: FileText },
    { name: "Daily Journal", href: "/journal", icon: BookOpen },
    { name: "Chart Patterns", href: "/patterns", icon: Shapes },
    { name: "Reports", href: "/reports", icon: BarChart2 },
    { name: "UC Insights", href: "/insights", icon: Target },
    { name: "Strategies", href: "/strategies", icon: Briefcase },
    { name: "Notebook", href: "/notebook", icon: CalendarDays },
  ];

  const renderNavItem = (link: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }) => {
    const isActive = pathname === link.href;
    const Icon = link.icon;
    
    const linkContent = (
      <Link
        href={link.href}
        onClick={() => { if (isSidebarOpen) setIsSidebarOpen(false); }}
        className="group/item relative flex items-center w-full transition-all duration-200"
      >
        <div className={\`flex items-center w-full transition-all duration-200 \${isCollapsed ? 'justify-center py-3.5 mb-1' : 'py-1'}\`}>
          
          {/* Active Left Indicator inside the left rail */}
          {isActive && (
            <motion.div
              layoutId="active-sidebar-indicator"
              className="absolute left-0 top-1 bottom-1 w-[3px] bg-[var(--sidebar-active-bg)] rounded-r-full z-20"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}

          {/* Left Rail Icon Area */}
          <div className={\`shrink-0 flex items-center justify-center relative z-20 transition-all duration-300 \${isCollapsed ? 'w-full' : 'w-[60px]'}\`}>
            <div className={\`flex items-center justify-center rounded-xl transition-all duration-200 \${isCollapsed ? (isActive ? 'w-10 h-10 bg-white/10' : 'w-10 h-10 group-hover/item:bg-white/10') : 'w-10 h-10'}\`}>
              <Icon className={\`transition-all duration-200 \${isCollapsed ? 'w-5 h-5' : 'w-5 h-5'} \${isActive ? 'text-white' : 'text-white/60 group-hover/item:text-white'}\`} />
            </div>
          </div>
          
          {/* Right Panel Text Area */}
          <div className={\`flex-1 overflow-hidden transition-all duration-300 \${isCollapsed ? 'w-0 opacity-0' : 'opacity-100'}\`}>
            {/* The active pill background that connects seamlessly to the left rail */}
            <div className={\`py-3 px-4 transition-all duration-300 mr-4 rounded-r-2xl relative \${isActive ? 'bg-[var(--sidebar-active-bg)] shadow-sm' : 'hover:bg-white/10'}\`}>
              {/* Seamless connection block if active */}
              {isActive && (
                <div className="absolute left-[-20px] top-0 bottom-0 w-[20px] bg-[var(--sidebar-active-bg)] z-0" />
              )}
              
              <span className={\`text-[14px] font-semibold whitespace-nowrap relative z-10 transition-colors duration-200 \${isActive ? 'text-[var(--sidebar-panel)]' : 'text-white/80 group-hover/item:text-white'}\`}>
                {link.name}
              </span>
            </div>
          </div>

        </div>
      </Link>
    );
    
    return (
      <SidebarTooltip key={link.name} label={link.name} show={isCollapsed}>
        {linkContent}
      </SidebarTooltip>
    );
  };

  return (
    <>
      <aside 
        className={\`fixed inset-y-0 left-0 z-50 transform \${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] h-screen shrink-0 lg:m-3 lg:rounded-3xl lg:h-[calc(100vh-24px)] shadow-xl overflow-hidden\`}
        style={{ width: isCollapsed ? 76 : 250 }}
      >
        
        {/* Dual Panel Background */}
        <div className="absolute inset-0 flex pointer-events-none z-0">
          <div className={\`bg-[var(--sidebar-rail)] transition-all duration-300 \${isCollapsed ? 'w-full' : 'w-[60px]'}\`}></div>
          <div className={\`bg-[var(--sidebar-panel)] transition-all duration-300 flex-1\`}></div>
        </div>
        
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-[var(--sidebar-panel)] border border-white/20 rounded-full items-center justify-center text-white/60 hover:text-white hover:bg-[var(--sidebar-rail)] z-[60] transition-all duration-200 shadow-md hover:scale-110"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-3 h-3" />
          </motion.div>
        </button>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full w-full overflow-y-auto overflow-x-hidden">
          
          {/* Header */}
          <div className={\`flex items-center transition-all duration-300 shrink-0 mb-6 pt-6 \${isCollapsed ? 'justify-center' : 'pl-[18px]'}\`}>
            <div className="w-6 flex justify-center shrink-0">
              <Target className={\`text-white transition-all duration-300 \${isCollapsed ? 'w-7 h-7' : 'w-6 h-6'}\`} />
            </div>
            <span className={\`font-bold text-lg tracking-tight text-white whitespace-nowrap overflow-hidden transition-all duration-300 \${isCollapsed ? 'w-0 opacity-0' : 'opacity-100 ml-4'}\`}>
              UC TRADE
            </span>
            <button className="lg:hidden ml-auto text-white p-1 mr-4" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5"/>
            </button>
          </div>
          
          {/* Add Trade Button (At top!) */}
          <div className={\`mb-6 transition-all duration-300 shrink-0 \${isCollapsed ? 'px-3' : 'pl-[60px] pr-4'}\`}>
            <SidebarTooltip label="Add Trade" show={isCollapsed}>
              <button 
                onClick={() => setIsModalOpen(true)}
                className={\`group/add flex items-center justify-center bg-white/20 text-white font-medium hover:bg-white/30 active:scale-[0.97] transition-all duration-300 overflow-hidden border border-white/10 \${
                  isCollapsed 
                    ? 'w-11 h-11 mx-auto rounded-full' 
                    : 'w-full py-2.5 rounded-xl -ml-2'
                }\`}
              >
                <Plus className={\`shrink-0 transition-all duration-300 \${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}\`} />
                <span className={\`whitespace-nowrap overflow-hidden transition-all duration-300 font-semibold text-sm \${isCollapsed ? 'w-0 opacity-0' : 'opacity-100 ml-2'}\`}>+ Add trade</span>
              </button>
            </SidebarTooltip>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 relative flex flex-col pt-2">
            {links.map((link) => renderNavItem(link))}
            
            <div className="mt-auto flex flex-col w-full shrink-0 pb-6 pt-4">
              {renderNavItem({ name: "Settings", href: "/settings", icon: Settings })}
            </div>
          </nav>
        </div>
      </aside>

      <AddTradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTrade={addTrade} />
    </>
  );
}`;

code = code.replace(/function SidebarTooltip[\s\S]*?(?=function Topbar)/, newSidebar + '\n\n');

fs.writeFileSync('src/components/ClientLayout.tsx', code);
console.log("Sidebar replaced!");
