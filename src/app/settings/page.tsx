"use client";

import { useState } from "react";
import { useSettingsContext, Account } from "@/lib/SettingsContext";
import { useTrades } from "@/lib/useTrades";
import { useJournal } from "@/lib/useJournal";
import { useNotebook } from "@/lib/useNotebook";
import { User, Wallet, Moon, Sun, Plus, Pencil, Trash2, X, Save, Sparkles, Download, Upload } from "lucide-react";
import { useConfirm } from "@/lib/ConfirmContext";

export default function SettingsPage() {
  const { accounts, activeAccountId, preferences, addAccount, updateAccount, deleteAccount, updatePreferences, isLoaded: settingsLoaded } = useSettingsContext();
  const { seedMockData } = useTrades();
  const { seedMockJournal } = useJournal();
  const { seedMockNotebook, clearAllNotes } = useNotebook();
  const { clearAllTrades } = useTrades();
  const { clearAllEntries } = useJournal();
  const { confirm, alert } = useConfirm();

  const [editName, setEditName] = useState(preferences.name);
  
  // Modal states for Accounts
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  
  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  if (!settingsLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading settings...</div>;

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      setErrors({ editName: true });
      return;
    }
    setErrors({ ...errors, editName: false });
    updatePreferences({ name: editName });
  };

  const handleExportBackup = () => {
    const backup: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        backup[key] = localStorage.getItem(key) || "";
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uc-trade-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content);
        const ok = await confirm({
          message: "This will overwrite ALL your current data. Are you sure you want to restore?",
          danger: true
        });
        if (ok) {
          localStorage.clear();
          Object.entries(backup).forEach(([key, value]) => {
            localStorage.setItem(key, value as string);
          });
          await alert({ message: "Backup restored successfully! The app will now reload." });
          window.location.reload();
        }
      } catch (err) {
        await alert({ message: "Failed to parse backup file.", danger: true });
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again if needed
    event.target.value = '';
  };

  const openAddAccount = () => {
    setAccName("");
    setAccBalance("10000");
    setModalMode("add");
    setErrors({});
    setIsAccountModalOpen(true);
  };

  const openEditAccount = (acc: Account) => {
    setEditingAccountId(acc.id);
    setAccName(acc.name);
    setAccBalance(acc.balance.toString());
    setModalMode("edit");
    setErrors({});
    setIsAccountModalOpen(true);
  };

  const confirmAccountModal = () => {
    const newErrors: Record<string, boolean> = {};
    if (!accName.trim()) newErrors.accName = true;
    
    const bal = parseFloat(accBalance);
    if (isNaN(bal)) newErrors.accBalance = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    if (modalMode === "add") {
      addAccount({ name: accName, balance: bal });
    } else if (modalMode === "edit" && editingAccountId) {
      updateAccount(editingAccountId, { name: accName, balance: bal });
    }
    setIsAccountModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-[var(--muted-foreground)] mt-1">Manage your trading accounts and personal preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile & Preferences */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/50 flex items-center">
              <User className="w-5 h-5 text-[var(--primary)] mr-2" />
              <h3 className="font-semibold text-white">Profile</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => {
                    setEditName(e.target.value);
                    if (errors.editName) setErrors({ ...errors, editName: false });
                  }}
                  className={`w-full bg-[var(--background)] border rounded-md px-3 py-2 text-white focus:outline-none focus:border-[var(--primary)] ${errors.editName ? '!border-rose-500' : 'border-[var(--border)]'}`}
                />
                {errors.editName && <p className="text-xs text-rose-500 mt-1">Name is required</p>}
              </div>
              <button 
                onClick={handleSaveProfile}
                className="w-full flex items-center justify-center px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)] text-white rounded-md font-medium transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </button>
            </div>
          </div>

                    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/50">
              <h3 className="font-semibold text-white">Appearance (Themes)</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-[var(--muted-foreground)] mb-4">Choose from 10 handcrafted color palettes.</p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">Dark Themes</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: "dark-purple", name: "Modern Purple", color: "#8B5CF6", bg: "#09090b" },
                      { id: "dark-blue", name: "Deep Blue", color: "#2563EB", bg: "#0B1220" },
                      { id: "dark-teal", name: "Teal Harmony", color: "#14B8A6", bg: "#134E4A" },
                      { id: "dark-royal", name: "Royal Dark", color: "#6D28D9", bg: "#111827" },
                      { id: "dark-neutral", name: "Minimal Neutral", color: "#6B7280", bg: "#111827" },
                    ].map(theme => (
                      <div 
                        key={theme.id}
                        onClick={() => updatePreferences({ theme: theme.id })}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${preferences.theme === theme.id ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]" : "border-[var(--border)] hover:border-[var(--muted-foreground)]"}`}
                        style={{ backgroundColor: preferences.theme === theme.id ? undefined : theme.bg }}
                      >
                        <div className="w-4 h-4 rounded-full mr-3 shadow-sm border border-white/20" style={{ backgroundColor: theme.color }}></div>
                        <span className={`text-xs font-medium ${preferences.theme === theme.id ? "text-[var(--primary)]" : "text-zinc-300"}`}>{theme.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">Light Themes</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: "light-ocean", name: "Ocean Breeze", color: "#0EA5E9", bg: "#E0F2FE", text: "#0F172A" },
                      { id: "light-green", name: "Nature Green", color: "#16A34A", bg: "#F0FDF4", text: "#14532D" },
                      { id: "light-sunset", name: "Sunset Vibes", color: "#F97316", bg: "#FFF7ED", text: "#7C2D12" },
                      { id: "light-pink", name: "Blush Pink", color: "#EC4899", bg: "#FDF2F8", text: "#831843" },
                      { id: "light-yellow", name: "Bright Yellow", color: "#EAB308", bg: "#FEFBEB", text: "#713F12" },
                    ].map(theme => (
                      <div 
                        key={theme.id}
                        onClick={() => updatePreferences({ theme: theme.id })}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${preferences.theme === theme.id ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]" : "border-[var(--border)] hover:border-[var(--muted-foreground)]"}`}
                        style={{ backgroundColor: preferences.theme === theme.id ? undefined : theme.bg }}
                      >
                        <div className="w-4 h-4 rounded-full mr-3 shadow-sm border border-black/10" style={{ backgroundColor: theme.color }}></div>
                        <span className="text-xs font-medium" style={{ color: preferences.theme === theme.id ? undefined : theme.text }}>{theme.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/50 flex items-center">
              <Save className="w-5 h-5 text-blue-400 mr-2" />
              <h3 className="font-semibold text-white">Data Backup</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-[var(--muted-foreground)]">Save a copy of your entire journal to your PC, or restore from a previous backup file.</p>
              
              <button 
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Backup to PC
              </button>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportBackup}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Restore from Backup"
                />
                <button className="w-full flex items-center justify-center px-4 py-2 bg-[var(--muted)] hover:bg-zinc-700 text-white rounded-md font-medium transition-colors border border-[var(--border)]">
                  <Upload className="w-4 h-4 mr-2 text-[var(--muted-foreground)]" />
                  Restore from Backup
                </button>
              </div>
            </div>
          </div>

          {/* AI Integrations */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/50 flex items-center">
              <span className="w-5 h-5 text-amber-400 mr-2 flex items-center justify-center">✨</span>
              <h3 className="font-semibold text-white">AI Integrations</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-[var(--muted-foreground)]">Add a free Google Gemini API key to enable automatic Trade Screenshot Extraction (MT4, MT5, TradingView).</p>
              
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Gemini API Key</label>
                <input 
                  type="password" 
                  value={preferences.geminiApiKey || ''}
                  onChange={e => updatePreferences({ geminiApiKey: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="AIzaSy..."
                />
              </div>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="block text-xs text-amber-500 hover:text-amber-400 transition-colors">
                Get a free API key from Google AI Studio &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/50 flex items-center justify-between">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 text-emerald-400 mr-2" />
                <h3 className="font-semibold text-white">Trading Accounts</h3>
              </div>
              <button 
                onClick={openAddAccount}
                className="flex items-center text-sm px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Account
              </button>
            </div>
            
            <div className="p-4 bg-[var(--primary)]/10 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-[var(--primary)]">Demo Data</h4>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Load 25 realistic mock trades into the ACTIVE account to see how the dashboard looks.</p>
              </div>
              <button 
                onClick={async () => {
                  const ok = await confirm({
                    message: "This will overwrite your active account's trades, journal, and notebook with mock data. Are you sure?",
                    danger: true
                  });
                  if (ok) {
                    seedMockData();
                    seedMockJournal();
                    seedMockNotebook();
                    await alert({ message: "Mock data loaded! Go to the Dashboard to see it." });
                  }
                }}
                className="flex items-center text-xs px-3 py-1.5 bg-[var(--primary)] text-white hover:bg-[var(--primary)] rounded-md transition-colors font-medium whitespace-nowrap"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Seed Demo Data
              </button>
            </div>

            <div className="p-4 bg-rose-500/10 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-rose-400">Wipe Account Data</h4>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Permanently delete ALL trades, journal entries, and notes for the ACTIVE account.</p>
              </div>
              <button 
                onClick={async () => {
                  const ok = await confirm({
                    message: "WARNING: This will instantly delete everything in the active account. This cannot be undone. Are you sure?",
                    danger: true
                  });
                  if (ok) {
                    clearAllTrades();
                    clearAllEntries();
                    clearAllNotes();
                    await alert({ message: "All data for this account has been wiped clean." });
                  }
                }}
                className="flex items-center text-xs px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-md transition-colors font-medium whitespace-nowrap"
              >
                <Trash2 className="w-3 h-3 mr-1.5" />
                Wipe All Data
              </button>
            </div>

            <div className="divide-y divide-zinc-800/50">
              {accounts.map(acc => (
                <div key={acc.id} className="p-6 flex items-center justify-between group hover:bg-[var(--muted)]/20 transition-colors">
                  <div>
                    <div className="flex items-center">
                      <h4 className="text-lg font-semibold text-white">{acc.name}</h4>
                      {acc.id === activeAccountId && (
                        <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      Balance: <span className="text-emerald-400 font-mono">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(acc.balance)}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => openEditAccount(acc)}
                      className="p-2 text-[var(--muted-foreground)] hover:text-emerald-400 bg-[var(--card)] hover:bg-[var(--muted)] rounded-md transition-all border border-transparent hover:border-emerald-500/30"
                      title="Edit Account"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={async () => {
                        if (accounts.length === 1) {
                          await alert({ message: "You must have at least one account.", danger: true });
                          return;
                        }
                        const ok = await confirm({
                          message: `Are you sure you want to delete ${acc.name}?`,
                          danger: true
                        });
                        if (ok) {
                          deleteAccount(acc.id);
                        }
                      }}
                      className={`p-2 rounded-md transition-all border border-transparent ${
                        accounts.length === 1 
                          ? 'text-zinc-700 bg-[var(--background)] cursor-not-allowed' 
                          : 'text-[var(--muted-foreground)] hover:text-rose-400 bg-[var(--card)] hover:bg-[var(--muted)] hover:border-rose-500/30'
                      }`}
                      title="Delete Account"
                      disabled={accounts.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Add / Edit Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] w-full max-w-sm rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/50">
              <h2 className="text-lg font-bold text-white">
                {modalMode === "add" ? "Add New Account" : "Edit Account"}
              </h2>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-[var(--muted-foreground)] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Account Name</label>
                <input 
                  type="text"
                  value={accName}
                  onChange={e => {
                    setAccName(e.target.value);
                    if (errors.accName) setErrors({ ...errors, accName: false });
                  }}
                  placeholder="e.g. Prop Firm Phase 1"
                  className={`w-full bg-[var(--background)] border rounded-md px-3 py-2 text-white focus:outline-none focus:border-[var(--primary)] ${errors.accName ? '!border-rose-500' : 'border-[var(--border)]'}`}
                  autoFocus
                />
                {errors.accName && <p className="text-xs text-rose-500 mt-1">Account name is required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Starting Balance (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[var(--muted-foreground)]">$</span>
                  <input 
                    type="number"
                    value={accBalance}
                    onChange={e => {
                      setAccBalance(e.target.value);
                      if (errors.accBalance) setErrors({ ...errors, accBalance: false });
                    }}
                    placeholder="10000"
                    className={`w-full bg-[var(--background)] border rounded-md pl-7 pr-3 py-2 text-white focus:outline-none focus:border-[var(--primary)] ${errors.accBalance ? '!border-rose-500' : 'border-[var(--border)]'}`}
                  />
                </div>
                {errors.accBalance && <p className="text-xs text-rose-500 mt-1">Valid balance is required</p>}
              </div>
            </div>
            
            <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAccountModalOpen(false)}
                className="px-4 py-2 rounded-md font-medium text-[var(--muted-foreground)] hover:text-white hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAccountModal}
                className="px-4 py-2 rounded-md font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                {modalMode === "add" ? "Add Account" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




