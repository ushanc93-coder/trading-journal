"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { TradesProvider, useTradesContext } from "@/lib/TradesContext";
import { SettingsProvider, useSettingsContext } from "@/lib/SettingsContext";
import AddTradeModal from "@/components/AddTradeModal";
import { LayoutDashboard, Target, CalendarDays, Settings, Search, Bell, BookOpen, FileText, BarChart2, Briefcase, Plus, RefreshCw, Shapes, ChevronDown, Check } from "lucide-react";

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

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-all duration-300 ease-in-out bg-[var(--card)] h-screen ${isCollapsed ? 'w-24' : 'w-64'}`}>
        
        {/* Toggle Collapse Button - Made larger and visually distinct */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-4 top-4 w-8 h-8 bg-[var(--background)] border border-[var(--border)] rounded-full items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)] z-[60] transition-colors shadow-md"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 ml-0.5" /> : <ChevronLeft className="w-4 h-4 mr-0.5" />}
        </button>

        {/* Scrollable Inner Container */}
        <div className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden">
          <div className={`h-16 flex items-center transition-all duration-300 shrink-0 border-b border-transparent mb-10 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
            <Target className={`text-[var(--primary)] shrink-0 transition-all duration-300 ${isCollapsed ? 'w-8 h-8' : 'w-6 h-6 mr-2'}`} />
            
            <span className={`font-bold text-xl tracking-tight text-[var(--foreground)] whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>UC TRADE</span>
            
            <button className="lg:hidden ml-auto text-[var(--foreground)] p-1" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5"/>
            </button>
          </div>
          
          <div className={`mb-6 transition-all duration-300 shrink-0 ${isCollapsed ? 'px-3' : 'px-4'}`}>
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] rounded-3xl font-medium hover:brightness-110 transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-12 h-12 mx-auto px-0' : 'w-full px-4 py-2'}`}
            >
              <Plus className={`shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-4 h-4 mr-2'}`} />
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[100px] opacity-100 ml-1'}`}>Add trade</span>
            </button>
          </div>
          
          <nav className="flex-1 pl-0 pr-0 space-y-0 mt-0 relative flex flex-col pb-4">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative flex items-center py-3.5 mb-2 text-sm font-semibold tracking-wide uppercase transition-all z-10 w-full ${
                    isActive 
                      ? "text-[var(--primary)] font-bold" 
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  } ${isCollapsed ? 'justify-center px-0' : 'pl-6'}`}
                  title={isCollapsed ? link.name : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-sidebar-tab"
                      className={`absolute inset-y-0 right-0 bg-[var(--background)] rounded-l-full -z-10 ${isCollapsed ? 'left-3' : 'left-4'}`}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <svg className="absolute -top-6 right-0 w-6 h-6 text-[var(--background)] fill-current" viewBox="0 0 16 16">
                        <path d="M 0 16 A 16 16 0 0 0 16 0 V 16 Z" />
                      </svg>
                      <svg className="absolute -bottom-6 right-0 w-6 h-6 text-[var(--background)] fill-current" viewBox="0 0 16 16">
                        <path d="M 0 0 A 16 16 0 0 1 16 16 V 0 Z" />
                      </svg>
                    </motion.div>
                  )}
                  <Icon className={`shrink-0 relative z-10 transition-all duration-300 ${isCollapsed ? 'w-6 h-6 m-0' : 'w-5 h-5 mr-4 ml-2'}`} />
                  <span className={`relative z-10 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[150px] opacity-100'}`}>{link.name}</span>
                </Link>
              );
            })}
            
            <div className="mt-auto flex flex-col w-full shrink-0">
              <Link
                href="/settings"
                className={`relative flex items-center py-3.5 text-sm font-semibold tracking-wide uppercase transition-all z-10 w-full ${
                  pathname === "/settings" 
                    ? "text-[var(--primary)] font-bold" 
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                } ${isCollapsed ? 'justify-center px-0' : 'pl-6'}`}
                title={isCollapsed ? "Settings" : undefined}
              >
                {pathname === "/settings" && (
                  <motion.div
                    layoutId="active-sidebar-tab"
                    className={`absolute inset-y-0 right-0 bg-[var(--background)] rounded-l-full -z-10 ${isCollapsed ? 'left-3' : 'left-4'}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <svg className="absolute -top-6 right-0 w-6 h-6 text-[var(--background)] fill-current" viewBox="0 0 16 16">
                      <path d="M 0 16 A 16 16 0 0 0 16 0 V 16 Z" />
                    </svg>
                    <svg className="absolute -bottom-6 right-0 w-6 h-6 text-[var(--background)] fill-current" viewBox="0 0 16 16">
                      <path d="M 0 0 A 16 16 0 0 1 16 16 V 0 Z" />
                    </svg>
                  </motion.div>
                )}
                <Settings className={`shrink-0 relative z-10 transition-all duration-300 ${isCollapsed ? 'w-6 h-6 m-0' : 'w-5 h-5 mr-4 ml-2'}`} />
                <span className={`relative z-10 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[150px] opacity-100'}`}>Settings</span>
              </Link>
              
              <div className="h-16 w-full"></div>
            </div>
          </nav>
        </div>
      </aside>

      <AddTradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTrade={addTrade} />
    </>
  );
}
function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    }
    if (isAccountDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAccountDropdownOpen]);

  const pathname = usePathname();
  const { accounts, activeAccountId, setActiveAccountId, isLoaded } = useSettingsContext();
  
  // Format title based on pathname
  const title = pathname === "/" ? "Dashboard" : 
                pathname.substring(1).charAt(0).toUpperCase() + pathname.substring(2);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-10">
      <div className="flex items-center">
        <button className="lg:hidden mr-3 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" onClick={onMenuClick}><Menu className="w-5 h-5" /></button>
        <h1 className="text-lg md:text-xl font-bold text-[var(--foreground)] tracking-tight truncate max-w-[120px] sm:max-w-none">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-6">
        {isLoaded && activeAccount && (
          <div className="flex items-center gap-3">
            <div className="flex items-center text-sm font-medium">
              <span className="text-[var(--muted-foreground)] mr-2">Balance:</span>
              <span className="text-[var(--win)]">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(activeAccount.balance)}
              </span>
            </div>
            
            <div className="h-6 w-px bg-[var(--muted)] mx-1"></div>
            
            <div ref={dropdownRef} className="relative flex items-center text-sm z-50">
              <button 
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="flex items-center justify-between min-w-[130px] max-w-[130px] sm:min-w-[150px] sm:max-w-[180px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--foreground)] rounded-3xl py-1.5 px-3 focus:outline-none transition-colors cursor-pointer"
              >
                <span className="truncate mr-2 font-medium">{activeAccount.name}</span>
                <ChevronDown className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isAccountDropdownOpen && (
                <>
                  
                  <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl shadow-black/10 z-50 p-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 origin-top-left flex flex-col gap-0.5">
                    <div className="px-2 py-1.5 mb-1 border-b border-[var(--border)]">
                      <span className="text-[10px] font-bold tracking-wider text-[var(--muted-foreground)] uppercase">Select Account</span>
                    </div>
                    {accounts.map(acc => {
                      const isActive = activeAccount.id === acc.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => {
                            setActiveAccountId(acc.id);
                            setIsAccountDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${isActive ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50'}`}
                        >
                          <span className="truncate">{acc.name}</span>
                          {isActive && <Check className="w-4 h-4 ml-2 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <div className="h-6 w-px bg-[var(--muted)]"></div>
        <button onClick={() => window.location.reload()} title="Refresh App" className="relative p-1 mr-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
        <button className="relative p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-blue-500 border border-[var(--border)]"></div>
      </div>
    </header>
  );
}

import { ConfirmProvider } from "@/lib/ConfirmContext";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ConfirmProvider>
      <SettingsProvider>
        <TradesProvider>
          <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" 
                onClick={() => setIsSidebarOpen(false)} 
              />
            )}
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
              <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
              <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-[var(--background)]">
                {children}
              </div>
            </main>
          </div>
        </TradesProvider>
      </SettingsProvider>
    </ConfirmProvider>
  );
}







