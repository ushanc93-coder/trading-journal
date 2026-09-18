"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { TradesProvider, useTradesContext } from "@/lib/TradesContext";
import { SettingsProvider, useSettingsContext } from "@/lib/SettingsContext";
import AddTradeModal from "@/components/AddTradeModal";
import { LayoutDashboard, Target, CalendarDays, Settings, Search, Bell, BookOpen, FileText, BarChart2, Briefcase, Plus, RefreshCw, Shapes } from "lucide-react";

function Sidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out bg-[var(--card)] flex flex-col h-screen overflow-y-auto`}>
        <div className="h-16 flex items-center px-6 mb-2 mt-2">
          <Target className="w-6 h-6 text-[var(--primary)] mr-2" />
          <span className="font-bold text-xl tracking-tight text-white">UC TRADE JOURNAL</span>
          <button className="lg:hidden ml-auto text-zinc-400 p-1" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5"/></button>
        </div>
        
        <div className="px-4 mb-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center bg-[#6b52a1] text-white px-4 py-2 rounded-md font-medium hover:bg-[#594289] transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add trade
          </button>
        </div>
        
        <nav className="flex-1 pl-4 space-y-2 mt-4 relative">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative flex items-center pl-6 py-3.5 text-sm font-semibold tracking-wide uppercase transition-colors z-10 ${
                  isActive 
                    ? "text-[var(--primary)] font-bold" 
                    : "text-[var(--muted-foreground)] hover:text-zinc-200 hover:bg-[var(--muted)]/10 mr-4 rounded-full"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-tab"
                    className="sidebar-active-tab absolute inset-0 -z-10 shadow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5 mr-4 relative z-10" />
                <span className="relative z-10">{link.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-[var(--border)] mt-auto flex items-center justify-between">
          <Link href="/settings" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-zinc-200 flex-1">
            <Settings className="w-4 h-4 mr-3 text-[var(--muted-foreground)]" />
            Settings
          </Link>
          <button 
            onClick={() => window.location.reload()}
            className="p-2.5 ml-1 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-zinc-200 transition-colors group"
            title="Refresh App"
          >
            <RefreshCw className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-zinc-200 transition-colors" />
          </button>
        </div>
      </aside>

      <AddTradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTrade={addTrade} />
    </>
  );
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { accounts, activeAccountId, setActiveAccountId, isLoaded } = useSettingsContext();
  
  // Format title based on pathname
  const title = pathname === "/" ? "Dashboard" : 
                pathname.substring(1).charAt(0).toUpperCase() + pathname.substring(2);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-10">
      <div className="flex items-center">
        <button className="lg:hidden mr-3 p-1 text-[var(--muted-foreground)] hover:text-white" onClick={onMenuClick}><Menu className="w-5 h-5" /></button>
        <h1 className="text-lg md:text-xl font-bold text-white tracking-tight truncate max-w-[120px] sm:max-w-none">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-6">
        {isLoaded && activeAccount && (
          <div className="flex items-center gap-3">
            <div className="flex items-center text-sm font-medium">
              <span className="text-[var(--muted-foreground)] mr-2">Balance:</span>
              <span className="text-emerald-400">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(activeAccount.balance)}
              </span>
            </div>
            
            <div className="h-6 w-px bg-[var(--muted)] mx-1"></div>
            
            <div className="flex items-center text-sm">
              <select 
                value={activeAccount.id}
                onChange={(e) => setActiveAccountId(e.target.value)}
                className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-md py-1 px-2 focus:outline-none focus:border-[var(--primary)] cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="h-6 w-px bg-[var(--muted)]"></div>
        <button className="relative p-1 text-[var(--muted-foreground)] hover:text-zinc-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-blue-500 border border-[var(--border)]"></div>
      </div>
    </header>
  );
}

import { ConfirmProvider } from "@/lib/ConfirmContext";
import { Menu, X } from "lucide-react";

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



