"use client";
import DatePickerDropdown from "./DatePickerDropdown";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { TradesProvider, useTradesContext } from "@/lib/TradesContext";
import { SettingsProvider, useSettingsContext } from "@/lib/SettingsContext";
import { JournalProvider } from "@/lib/JournalContext";
import AddTradeModal from "@/components/AddTradeModal";
import AutoSyncListener from "@/components/AutoSyncListener";
import GlobalNumberWheelListener from "@/components/GlobalNumberWheelListener";
import { LayoutDashboard, Target, CalendarDays, Settings, Search, Bell, BookOpen, FileText, BarChart2, Briefcase, Plus, RefreshCw, Shapes, ChevronDown, Check, Menu, X, ChevronLeft, ChevronRight, Clock, Zap, LineChart, ExternalLink, Globe, TrendingUp } from "lucide-react";
import { ConfirmProvider } from "@/lib/ConfirmContext";
import ForexClockWidget from "@/components/ForexClockWidget";
import DailyUploadReminder from "@/components/DailyUploadReminder";
import LiveNewsDrawer from "@/components/LiveNewsDrawer";
import BalanceWidget from "@/components/BalanceWidget";
import ReutersLiveFlashAlert from "@/components/ReutersLiveFlashAlert";
import NotificationBell from "@/components/NotificationBell";

function SidebarTooltip({ children, label, show }: { children: React.ReactNode; label: string; show: boolean }) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
    }
  };

  const handleMouseLeave = () => {
    setCoords(null);
  };

  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && coords && (
        <div 
          className="fixed z-[9999] pointer-events-none -translate-y-1/2 animate-tooltip-in"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="bg-[#0F172A] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10 relative">
            {label}
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#0F172A] rotate-45 border-l border-b border-white/10"></div>
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

  const mainLinks = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Trade Log", href: "/trades", icon: FileText },
    { name: "Daily Journal", href: "/journal", icon: BookOpen },
    { name: "Projection", href: "/projection", icon: TrendingUp },
    { name: "Chart Patterns", href: "/patterns", icon: Shapes },
    { name: "Economic Intel", href: "/market", icon: Globe },
    { name: "Reports", href: "/reports", icon: BarChart2 },
    { name: "UC Insights", href: "/insights", icon: Target },
    { name: "Strategies", href: "/strategies", icon: Briefcase },
    { name: "Notebook", href: "/notebook", icon: CalendarDays },
  ];
  const settingsLink = { name: "Settings", href: "/settings", icon: Settings };

  const renderNavItem = (link: { name: string; href: string; icon: React.ComponentType<{ className?: string, strokeWidth?: number }> }) => {
    const isActive = pathname === link.href;
    const Icon = link.icon;

    const linkContent = (
      <Link
        href={link.href}
        onClick={() => { if (isSidebarOpen) setIsSidebarOpen(false); }}
        className="group/item relative flex items-center w-full h-[40px] shrink-0 select-none cursor-pointer"
      >
        {/* Left Icon Rail Area (width: 52px, left: 12px) - 100% stationary */}
        <div className="w-[52px] ml-3 shrink-0 flex items-center justify-center relative z-20">
          {/* Active Left Indicator Bar */}
          {isActive && (
            <motion.div
              layoutId="active-capsule-tick"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 bg-white rounded-r-full shadow-sm z-30"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
            />
          )}

          {/* Soft Hover Capsule behind icon in rail */}
          {!isActive && (
            <div className="absolute w-9 h-9 rounded-xl bg-white/0 group-hover/item:bg-white/20 transition-all duration-200 pointer-events-none" />
          )}

          <Icon 
            strokeWidth={isActive ? 2.2 : 2}
            className={`transition-all duration-200 ${
              isActive ? 'text-white' : 'text-white/75 group-hover/item:text-white group-hover/item:scale-110'
            } w-[22px] h-[22px]`} 
          />
        </div>

        {/* Right Label Area with smooth fade & slide */}
        <div 
          className={`flex-1 h-full flex items-center relative transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isCollapsed ? 'opacity-0 pointer-events-none ml-0' : 'opacity-100 ml-2.5 mr-0'
          }`} 
          style={{ minWidth: 0 }}
        >
          {/* Active Cutout Shape - Smooth Shared Layout gliding with ZERO warping */}
          {isActive && !isCollapsed && (
            <motion.div
              layoutId="active-tab-shape"
              layout="position"
              className="absolute inset-y-0 left-0 -right-[1px] bg-[var(--background)] rounded-l-2xl z-10 pointer-events-none"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
            >
              {/* Top Inverted Corner */}
              <svg className="absolute -top-4 -right-[1px] w-4 h-4 pointer-events-none text-[var(--background)]" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0,16 C8.837,16 16,8.837 16,0 L16,16 L0,16 Z" />
              </svg>
              {/* Bottom Inverted Corner */}
              <svg className="absolute -bottom-4 -right-[1px] w-4 h-4 pointer-events-none text-[var(--background)]" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0,0 C8.837,0 16,7.163 16,16 L16,0 L0,0 Z" />
              </svg>
            </motion.div>
          )}

          {/* Hover Highlight Pill for Inactive Links - Rounded on both sides with light purple border */}
          {!isActive && !isCollapsed && (
            <div className="absolute inset-y-1 left-0 right-3 rounded-2xl bg-white/0 border border-transparent group-hover/item:bg-white/75 group-hover/item:border-indigo-200 dark:group-hover/item:bg-white/10 dark:group-hover/item:border-indigo-400/30 transition-all duration-200 pointer-events-none" />
          )}

          {/* Label Text - Always stable in foreground, never warped or morphed */}
          <div className="h-full flex-1 flex items-center justify-between pl-3.5 pr-4 relative z-20 pointer-events-none">
            <span className={`text-[15px] tracking-tight whitespace-nowrap transition-colors duration-150 ${
              isActive 
                ? 'font-semibold text-[var(--sidebar-active-text)]' 
                : 'font-medium text-[var(--sidebar-text)] group-hover/item:text-[var(--foreground)]'
            }`}>
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
        className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] h-screen shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col`}
        style={{ width: isCollapsed ? 76 : 284 }}
      >
        {/* Toggle Collapse Button - Unclipped on top of right border */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-7 w-6 h-6 bg-[var(--card)] border border-[var(--border)] rounded-full items-center justify-center text-[var(--sidebar-active-text)] hover:bg-[var(--primary)] hover:text-white z-[60] transition-all duration-200 shadow-md hover:scale-110 cursor-pointer"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </motion.div>
        </button>

        {/* Sticky/Fixed Top Branding & Add Trade - Never scrolls off screen */}
        <div className="shrink-0 z-30 bg-[var(--sidebar-bg)]">
          {/* Header / Logo */}
          <div className="flex items-center pt-3.5 pb-2 shrink-0 relative">
            <div className="w-[52px] ml-3 flex items-center justify-center shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-md">
                <Target className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              </div>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
              isCollapsed ? 'max-w-0 opacity-0 ml-0 pointer-events-none' : 'max-w-[195px] opacity-100 ml-2.5 pl-3.5 flex-1'
            }`}>
              <span className="font-bold text-base text-[var(--foreground)] tracking-tight block whitespace-nowrap">UC TRADE</span>
              <span className="text-[9.5px] text-[var(--muted-foreground)] uppercase tracking-widest font-medium block -mt-0.5 whitespace-nowrap">Forex Journal</span>
            </div>
            <button className="lg:hidden ml-auto mr-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5"/>
            </button>
          </div>

          {/* Add Trade Button - rounded-2xl to match rail and cards */}
          <div className="mb-2 shrink-0 px-3">
            <SidebarTooltip label="Add Trade" show={isCollapsed}>
              <button
                onClick={() => setIsModalOpen(true)}
                className="h-9.5 flex items-center bg-[var(--primary)] hover:opacity-90 active:scale-[0.98] text-white font-semibold transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] rounded-xl shadow-md overflow-hidden cursor-pointer"
                style={{ width: isCollapsed ? 52 : '100%' }}
              >
                <div className="w-[52px] h-9.5 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-white stroke-[2.5]" />
                </div>
                <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                  isCollapsed ? 'max-w-0 opacity-0 pl-0' : 'max-w-[190px] opacity-100 ml-2.5 pl-3.5 pr-4'
                }`}>
                  <span className="whitespace-nowrap font-semibold text-[14.5px] text-white tracking-tight">
                    Add trade
                  </span>
                </div>
              </button>
            </SidebarTooltip>
          </div>
        </div>

        {/* Scrollable Sidebar Content Area - Independent smooth scrolling */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <LayoutGroup id="sidebar-layout">
            {/* Full-height container ensuring natural layout and clean scrolling when expanded */}
            <div className="min-h-full flex flex-col flex-1">
              {/* Unified Nav Container: Continuous Left Capsule Rail spanning from top to Settings */}
              <div className="relative flex-grow shrink-0 flex flex-col justify-between pt-1.5 pb-2 min-h-[450px]">
                {/* One Continuous 52px Capsule Rail Background spanning top to bottom */}
                <div className="absolute top-0 bottom-0 left-3 w-[52px] bg-[var(--sidebar-rail-bg)] rounded-2xl border border-[var(--border)] shadow-sm z-0 pointer-events-none" />

                {/* Top Navigation Elements: main links */}
                <nav className="relative z-10 flex flex-col gap-0.5 pb-0.5">
                  {mainLinks.map((link) => renderNavItem(link))}
                </nav>

                {/* Settings link anchored at the bottom of the rail, above the widget */}
                <div className="relative z-10 pt-2 pb-0.5">
                  {renderNavItem(settingsLink)}
                </div>
              </div>

              {/* ForexClockWidget below the rail */}
              <div className="px-3 pb-3 pt-2 shrink-0 transition-all duration-300">
                <ForexClockWidget isCollapsed={isCollapsed} />
              </div>
            </div>
          </LayoutGroup>
        </div>
      </aside>

      <AddTradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTrade={addTrade} />
      <AutoSyncListener />
      <GlobalNumberWheelListener />
      <ReutersLiveFlashAlert />
    </>
  );
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
            }
    if (isAccountDropdownOpen || isDateDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAccountDropdownOpen, isDateDropdownOpen]);

  const pathname = usePathname();
  const { accounts, activeAccountId, setActiveAccountId, isLoaded, activeDateRange, setActiveDateRange, customDateRange, setCustomDateRange, preferences } = useSettingsContext();
  
  // Format title based on pathname
  const title = pathname === "/" ? "Dashboard" : 
                pathname === "/market" ? "Economic Intel" :
                pathname.substring(1).charAt(0).toUpperCase() + pathname.substring(2);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  return (
    <header className="h-14 sm:h-16 flex items-center justify-between px-4 lg:px-6 glass-header shadow-xs sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-[var(--foreground)] tracking-tight truncate max-w-[140px] sm:max-w-none">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-4">
        {isLoaded && activeAccount && (
          <div className="flex items-center gap-2.5">
            <BalanceWidget />
            
            <DailyUploadReminder />
            
            <div className="h-5 w-px bg-[var(--border)]/70 mx-0.5"></div>
            
            {activeDateRange === "Custom" && (
              <div className="flex items-center space-x-2 mr-1 animate-in fade-in slide-in-from-right-2">
                <DatePickerDropdown 
                  date={customDateRange?.start || new Date().toISOString()} 
                  onChange={(d: string) => setCustomDateRange({ ...customDateRange, start: d } as any)} 
                />
                <span className="text-[var(--muted-foreground)] text-xs font-medium">to</span>
                <DatePickerDropdown 
                  date={customDateRange?.end || new Date().toISOString()} 
                  onChange={(d: string) => setCustomDateRange({ ...customDateRange, end: d } as any)} 
                />
              </div>
            )}
            
            <div ref={dateDropdownRef} className="relative flex items-center text-sm z-50">
              <button 
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="flex items-center justify-between min-w-[120px] glass-pill hover:border-[var(--primary)] text-[var(--foreground)] rounded-full py-1.5 px-3.5 focus:outline-none transition-all cursor-pointer shadow-xs"
              >
                <span className="truncate mr-2 font-medium text-xs sm:text-sm">{activeDateRange}</span>
                <ChevronDown className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDateDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-[140px] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl shadow-black/20 z-50 p-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 origin-top-left flex flex-col gap-0.5">
                  <div className="px-2 py-1.5 mb-1 border-b border-[var(--border)]">
                    <span className="text-[10px] font-bold tracking-wider text-[var(--muted-foreground)] uppercase">Date Range</span>
                  </div>
                  {["Today", "This Week", "This Month", "All Time", "Custom"].map(range => {
                    const isActive = activeDateRange === range;
                    return (
                      <button
                        key={range}
                        onClick={() => {
                          setActiveDateRange(range);
                          setIsDateDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${isActive ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50'}`}
                      >
                        <span className="truncate">{range}</span>
                        {isActive && <Check className="w-4 h-4 ml-2 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div ref={dropdownRef} className="relative flex items-center text-sm z-50">
              <button 
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="flex items-center justify-between min-w-[130px] max-w-[130px] sm:min-w-[150px] sm:max-w-[180px] glass-pill hover:border-[var(--primary)] text-[var(--foreground)] rounded-full py-1.5 px-3.5 focus:outline-none transition-all cursor-pointer shadow-xs"
              >
                <span className="truncate mr-2 font-medium text-xs sm:text-sm">{activeAccount.name}</span>
                <ChevronDown className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isAccountDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl shadow-black/20 z-50 p-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 origin-top-left flex flex-col gap-0.5">
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
              )}
            </div>
          </div>
        )}
        <div className="h-5 w-px bg-[var(--border)]/70"></div>
        <LiveNewsDrawer />
        <button onClick={() => window.location.reload()} title="Refresh App" className="w-8 h-8 flex items-center justify-center rounded-full glass-pill text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-all cursor-pointer shadow-xs">
          <RefreshCw className="w-4 h-4" />
        </button>
        <NotificationBell />
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-500 border border-[var(--border)] flex items-center justify-center text-white text-xs font-bold shadow-xs">
          {activeAccount?.name?.charAt(0) || "T"}
        </div>
      </div>
    </header>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // If in dedicated pop-out window / tab, render clean edge-to-edge view
  if (pathname.startsWith("/market/popout") || pathname.startsWith("/clock")) {
    return (
      <ConfirmProvider>
        <SettingsProvider>
          <TradesProvider>
            <JournalProvider>
              {children}
            </JournalProvider>
          </TradesProvider>
        </SettingsProvider>
      </ConfirmProvider>
    );
  }

  return (
    <ConfirmProvider>
      <SettingsProvider>
        <TradesProvider>
          <JournalProvider>
            <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
              {isSidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" 
                  onClick={() => setIsSidebarOpen(false)} 
                />
              )}
              <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
              <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden relative bg-[var(--background)] scroll-smooth">
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
                <div className="p-4 md:p-6 lg:p-8">
                  {children}
                </div>
              </main>
            </div>
          </JournalProvider>
        </TradesProvider>
      </SettingsProvider>
    </ConfirmProvider>
  );
}







