"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TradesProvider, useTradesContext } from "@/lib/TradesContext";
import { SettingsProvider, useSettingsContext } from "@/lib/SettingsContext";
import AddTradeModal from "@/components/AddTradeModal";
import { LayoutDashboard, Target, CalendarDays, Settings, Search, Bell, BookOpen, FileText, BarChart2, Briefcase, Plus, RefreshCw, Shapes } from "lucide-react";

function Sidebar() {
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
      <aside className="w-64 border-r border-[var(--border)] bg-[#111115] flex flex-col h-screen overflow-y-auto">
        <div className="h-16 flex items-center px-6 mb-2 mt-2">
          <Target className="w-6 h-6 text-[var(--primary)] mr-2" />
          <span className="font-bold text-xl tracking-tight text-white">UC TRADE JOURNAL</span>
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
        
        <nav className="flex-1 px-3 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? "bg-[var(--muted)]/80 text-white border-l-2 border-[var(--primary)]" 
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-zinc-200"
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
                {link.name}
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

function Topbar() {
  const pathname = usePathname();
  const { accounts, activeAccountId, setActiveAccountId, isLoaded } = useSettingsContext();
  
  // Format title based on pathname
  const title = pathname === "/" ? "Dashboard" : 
                pathname.substring(1).charAt(0).toUpperCase() + pathname.substring(2);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-10">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-6">
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

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <SettingsProvider>
        <TradesProvider>
          <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)]">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
              <Topbar />
              <div className="flex-1 overflow-auto p-6 lg:p-8 bg-[#09090b]">
                {children}
              </div>
            </main>
          </div>
        </TradesProvider>
      </SettingsProvider>
    </ConfirmProvider>
  );
}
