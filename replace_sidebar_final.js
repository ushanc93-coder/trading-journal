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
        className="group/item relative flex items-center w-full transition-all duration-200 h-[44px] mb-1"
      >
        {/* Active Left Indicator inside the rail */}
        {isActive && (
          <motion.div
            layoutId="active-sidebar-indicator"
            className="absolute left-[12px] top-[6px] bottom-[6px] w-[3px] bg-white rounded-r-full z-20"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}

        {/* Icon Area (Occupies the 52px of the rail) */}
        <div className="w-[52px] ml-[12px] shrink-0 flex justify-center items-center relative z-20">
          <Icon className={\`transition-all duration-200 \${isCollapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]'} \${isActive ? 'text-white' : 'text-white/60 group-hover/item:text-white'}\`} />
        </div>
        
        {/* Text Area (Starts immediately after the rail) */}
        <div className={\`flex-1 overflow-hidden transition-all duration-300 \${isCollapsed ? 'w-0 opacity-0' : 'opacity-100'}\`}>
          <div className={\`h-full flex items-center pl-3 mr-4 rounded-r-2xl transition-all duration-300 \${isActive ? 'bg-[var(--sidebar-active-bg)] shadow-sm' : 'hover:bg-white/5'}\`}>
            <span className={\`text-[14px] font-semibold whitespace-nowrap transition-colors duration-200 \${isActive ? 'text-[var(--sidebar-active-text)]' : 'text-white/80 group-hover/item:text-white'}\`}>
              {link.name}
            </span>
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
        className={\`fixed inset-y-0 left-0 z-50 transform \${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] h-screen shrink-0 lg:m-3 lg:rounded-3xl lg:h-[calc(100vh-24px)] shadow-xl overflow-hidden bg-[var(--sidebar-bg)]\`}
        style={{ width: isCollapsed ? 76 : 250 }}
      >
        
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-[var(--sidebar-bg)] border border-white/20 rounded-full items-center justify-center text-white/60 hover:text-white hover:bg-[var(--sidebar-rail-bg)] z-[60] transition-all duration-200 shadow-md hover:scale-110"
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
          
          {/* Logo Header */}
          <div className={\`flex items-center transition-all duration-300 shrink-0 mt-6 mb-4 \${isCollapsed ? 'justify-center' : 'pl-6'}\`}>
            <div className="flex justify-center shrink-0">
              <Target className={\`text-white transition-all duration-300 \${isCollapsed ? 'w-7 h-7' : 'w-6 h-6'}\`} />
            </div>
            <span className={\`font-bold text-lg tracking-tight text-white whitespace-nowrap overflow-hidden transition-all duration-300 \${isCollapsed ? 'w-0 opacity-0' : 'opacity-100 ml-3'}\`}>
              UC TRADE
            </span>
            <button className="lg:hidden ml-auto text-white p-1 mr-4" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5"/>
            </button>
          </div>
          
          {/* Add Trade Button (Restored to top) */}
          <div className={\`mb-6 transition-all duration-300 shrink-0 \${isCollapsed ? 'px-3' : 'px-5'}\`}>
            <SidebarTooltip label="Add Trade" show={isCollapsed}>
              <button 
                onClick={() => setIsModalOpen(true)}
                className={\`group/add flex items-center justify-center bg-white/15 text-white font-medium hover:bg-white/25 active:scale-[0.97] transition-all duration-300 overflow-hidden border border-white/10 \${
                  isCollapsed 
                    ? 'w-11 h-11 mx-auto rounded-full' 
                    : 'w-full py-2.5 rounded-xl'
                }\`}
              >
                <Plus className={\`shrink-0 transition-all duration-300 \${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}\`} />
                <span className={\`whitespace-nowrap overflow-hidden transition-all duration-300 font-semibold text-sm \${isCollapsed ? 'w-0 opacity-0' : 'opacity-100 ml-2'}\`}>+ Add trade</span>
              </button>
            </SidebarTooltip>
          </div>

          {/* Navigation Links with Floating Rail */}
          <div className="relative flex-1 flex flex-col min-h-0">
            {/* The Floating Icon Rail Background */}
            <div className="absolute left-[12px] top-0 bottom-4 w-[52px] bg-[var(--sidebar-rail-bg)] rounded-[20px] z-0 pointer-events-none" />
            
            <nav className="relative z-10 flex flex-col py-2">
              {links.map((link) => renderNavItem(link))}
            </nav>
          </div>

          {/* Settings at the very bottom (Restored) */}
          <div className="mt-auto shrink-0 pb-6 pt-4">
            <SidebarTooltip label="Settings" show={isCollapsed}>
              <Link
                href="/settings"
                onClick={() => { if (isSidebarOpen) setIsSidebarOpen(false); }}
                className="group/item relative flex items-center w-full transition-all duration-200 h-[44px]"
              >
                <div className="w-[52px] ml-[12px] shrink-0 flex justify-center items-center">
                  <Settings className={\`transition-all duration-200 \${isCollapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]'} \${pathname === '/settings' ? 'text-white' : 'text-white/60 group-hover/item:text-white'}\`} />
                </div>
                <div className={\`flex-1 overflow-hidden transition-all duration-300 \${isCollapsed ? 'w-0 opacity-0' : 'opacity-100'}\`}>
                  <div className="h-full flex items-center pl-3">
                    <span className={\`text-[14px] font-semibold whitespace-nowrap transition-colors duration-200 \${pathname === '/settings' ? 'text-white' : 'text-white/80 group-hover/item:text-white'}\`}>
                      Settings
                    </span>
                  </div>
                </div>
              </Link>
            </SidebarTooltip>
          </div>

        </div>
      </aside>

      <AddTradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTrade={addTrade} />
    </>
  );
}`;

code = code.replace(/function SidebarTooltip[\s\S]*?(?=function Topbar)/, newSidebar + '\n\n');

fs.writeFileSync('src/components/ClientLayout.tsx', code);
console.log("Sidebar replaced!");
